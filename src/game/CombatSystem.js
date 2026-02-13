import { Collision } from '../physics/Collision.js';

/**
 * Combat system - handles melee attacks, contact damage,
 * knockback, invincibility frames, and enemy defeat.
 */

const DIR_OFFSETS = {
  up:    { x: 0, y: -12 },
  down:  { x: 0, y: 12 },
  left:  { x: -12, y: 0 },
  right: { x: 12, y: 0 },
};

export class CombatSystem {
  constructor(engine) {
    this.engine = engine;

    // Player combat state
    this._attackTimer = 0;        // >0 means attack hitbox is active
    this._attackCooldown = 0;     // >0 means player can't attack yet
    this._attackDir = 'down';
    this._playerInvincible = 0;   // >0 means player can't be hurt
    this._playerKnockback = null; // { vx, vy, timer }

    // Enemy hit flash timers (keyed by entity id)
    this._enemyFlash = new Map();

    // Floating damage numbers
    this._damageNumbers = [];

    // Attack settings
    this.attackDuration = 0.15;   // seconds the hitbox is active
    this.attackCooldownTime = 0.3;
    this.attackRange = 14;        // pixels from player center
    this.attackSize = 14;         // hitbox size
    this.playerInvincibleTime = 1.0;
    this.knockbackSpeed = 120;
    this.knockbackDuration = 0.15;
    this.contactDamageCooldown = 0.5;

    // Track per-enemy contact cooldown
    this._contactCooldowns = new Map();
  }

  /** Called each frame during play mode */
  update(dt) {
    const player = this.engine.player;
    if (!player || !player.active) return;

    // Update timers
    if (this._attackTimer > 0) this._attackTimer -= dt;
    if (this._attackCooldown > 0) this._attackCooldown -= dt;
    if (this._playerInvincible > 0) this._playerInvincible -= dt;

    // Update knockback
    if (this._playerKnockback) {
      this._playerKnockback.timer -= dt;
      if (this._playerKnockback.timer <= 0) {
        this._playerKnockback = null;
      } else {
        const kb = this._playerKnockback;
        Collision.resolveWithTilemap(player, this.engine.tileMap, kb.vx * dt, kb.vy * dt);
      }
    }

    // Update enemy flash timers
    for (const [id, time] of this._enemyFlash) {
      const remaining = time - dt;
      if (remaining <= 0) this._enemyFlash.delete(id);
      else this._enemyFlash.set(id, remaining);
    }

    // Update contact cooldowns
    for (const [id, time] of this._contactCooldowns) {
      const remaining = time - dt;
      if (remaining <= 0) this._contactCooldowns.delete(id);
      else this._contactCooldowns.set(id, remaining);
    }

    // Update damage numbers
    for (let i = this._damageNumbers.length - 1; i >= 0; i--) {
      const dn = this._damageNumbers[i];
      dn.timer -= dt;
      dn.y -= 30 * dt; // float upward
      dn.alpha = Math.max(0, dn.timer / dn.maxTime);
      if (dn.timer <= 0) {
        this._damageNumbers.splice(i, 1);
      }
    }

    // Check attack hitbox against enemies
    if (this._attackTimer > 0) {
      this._checkAttackHits();
    }

    // Contact damage (enemy touches player)
    this._checkContactDamage();
  }

  /** Player initiates an attack */
  tryAttack() {
    if (this._attackCooldown > 0 || this._attackTimer > 0) return false;
    if (this.engine.actionRunner.running || this.engine.actionRunner.isInputLocked) return false;

    const player = this.engine.player;
    if (!player) return false;

    this._attackDir = player.direction;
    this._attackTimer = this.attackDuration;
    this._attackCooldown = this.attackCooldownTime;
    return true;
  }

  /** Get the current attack hitbox in world coordinates (or null) */
  getAttackHitbox() {
    if (this._attackTimer <= 0) return null;
    const player = this.engine.player;
    if (!player) return null;

    const offset = DIR_OFFSETS[this._attackDir] || DIR_OFFSETS.down;
    const cx = player.x + player.width / 2 + offset.x;
    const cy = player.y + player.height / 2 + offset.y;
    const half = this.attackSize / 2;

    return {
      x: cx - half,
      y: cy - half,
      width: this.attackSize,
      height: this.attackSize,
    };
  }

  _checkAttackHits() {
    const hitbox = this.getAttackHitbox();
    if (!hitbox) return;

    const enemies = this.engine.world.getByType('enemy');
    const attackPower = this.engine.gameState.getVar('attack', 1);

    for (const enemy of enemies) {
      if (!enemy.active) continue;
      // Don't hit the same enemy multiple times in one swing
      if (this._enemyFlash.has(enemy.id) && this._enemyFlash.get(enemy.id) > this.attackDuration - 0.05) continue;

      const enemyBox = { x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height };

      if (Collision.aabb(hitbox, enemyBox)) {
        this._damageEnemy(enemy, attackPower);
      }
    }
  }

  _damageEnemy(enemy, damage) {
    enemy._health -= damage;
    this._enemyFlash.set(enemy.id, 0.2);

    // Knockback enemy away from player
    const player = this.engine.player;
    if (player) {
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const kbDist = 8;
      Collision.resolveWithTilemap(
        enemy, this.engine.tileMap,
        (dx / dist) * kbDist,
        (dy / dist) * kbDist
      );
    }

    // Spawn damage number
    this._damageNumbers.push({
      x: enemy.x + enemy.width / 2,
      y: enemy.y - 4,
      text: `-${damage}`,
      color: '#ff4444',
      timer: 0.8,
      maxTime: 0.8,
      alpha: 1,
    });

    // Check for defeat
    if (enemy._health <= 0) {
      this._defeatEnemy(enemy);
    }
  }

  _defeatEnemy(enemy) {
    enemy.active = false;

    // Run onDefeat script if present
    if (enemy._onDefeat && enemy._onDefeat.length > 0) {
      this.engine.actionRunner.run(enemy._onDefeat, enemy);
    }

    // Award XP
    const xpReward = enemy._damage * 2 + 1;
    this.engine.gameState.addVar('xp', xpReward);
    this.engine.gameState.addVar('score', xpReward * 5);

    // Floating XP number
    this._damageNumbers.push({
      x: enemy.x + enemy.width / 2,
      y: enemy.y - 8,
      text: `+${xpReward} XP`,
      color: '#44ff88',
      timer: 1.2,
      maxTime: 1.2,
      alpha: 1,
    });
  }

  _checkContactDamage() {
    const player = this.engine.player;
    if (!player || this._playerInvincible > 0) return;

    const playerBox = player.getCollisionBox();
    const enemies = this.engine.world.getByType('enemy');

    for (const enemy of enemies) {
      if (!enemy.active) continue;
      if (this._contactCooldowns.has(enemy.id)) continue;

      const enemyBox = { x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height };

      if (Collision.aabb(playerBox, enemyBox)) {
        const damage = enemy._damage || 1;
        this.damagePlayer(damage, enemy);
        this._contactCooldowns.set(enemy.id, this.contactDamageCooldown);
        break; // only take one hit per frame
      }
    }
  }

  /** Apply damage to the player (can be called externally by actions) */
  damagePlayer(damage, source = null) {
    if (this._playerInvincible > 0) return;

    const defense = this.engine.gameState.getVar('defense', 0);
    const actualDamage = Math.max(1, damage - defense);

    const currentHP = this.engine.gameState.getVar('hp', 6);
    const newHP = Math.max(0, currentHP - actualDamage);
    this.engine.gameState.setVar('hp', newHP);

    this._playerInvincible = this.playerInvincibleTime;

    // Knockback away from source
    const player = this.engine.player;
    if (player && source) {
      const dx = player.x - source.x;
      const dy = player.y - source.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      this._playerKnockback = {
        vx: (dx / dist) * this.knockbackSpeed,
        vy: (dy / dist) * this.knockbackSpeed,
        timer: this.knockbackDuration,
      };
    }

    // Damage number on player
    this._damageNumbers.push({
      x: player.x + player.width / 2,
      y: player.y - 4,
      text: `-${actualDamage}`,
      color: '#ff6666',
      timer: 0.8,
      maxTime: 0.8,
      alpha: 1,
    });

    // Check death
    if (newHP <= 0) {
      this.engine.onPlayerDeath();
    }
  }

  /** Heal the player */
  healPlayer(amount) {
    const maxHP = this.engine.gameState.getVar('maxHp', 6);
    const currentHP = this.engine.gameState.getVar('hp', 6);
    const newHP = Math.min(maxHP, currentHP + amount);
    this.engine.gameState.setVar('hp', newHP);

    if (this.engine.player) {
      this._damageNumbers.push({
        x: this.engine.player.x + this.engine.player.width / 2,
        y: this.engine.player.y - 4,
        text: `+${amount}`,
        color: '#44ff44',
        timer: 0.8,
        maxTime: 0.8,
        alpha: 1,
      });
    }
  }

  /** Whether the player is currently invincible (for render flash) */
  get isPlayerInvincible() {
    return this._playerInvincible > 0;
  }

  /** Whether an attack is currently active */
  get isAttacking() {
    return this._attackTimer > 0;
  }

  /** Check if an enemy is currently flashing from damage */
  isEnemyFlashing(entityId) {
    return this._enemyFlash.has(entityId);
  }

  /** Render attack hitbox visual and damage numbers (called in world space) */
  renderWorld(renderer) {
    // Attack slash visual
    if (this._attackTimer > 0) {
      const hitbox = this.getAttackHitbox();
      if (hitbox) {
        const progress = 1 - (this._attackTimer / this.attackDuration);
        const alpha = 0.6 * (1 - progress);
        renderer.drawRect(
          hitbox.x - 1, hitbox.y - 1,
          hitbox.width + 2, hitbox.height + 2,
          `rgba(255,255,200,${alpha})`
        );
        renderer.drawRect(
          hitbox.x, hitbox.y,
          hitbox.width, hitbox.height,
          `rgba(255,255,255,${alpha * 0.5})`,
          false
        );
      }
    }
  }

  /** Render floating damage numbers (called in screen space) */
  renderDamageNumbers(renderer, camera) {
    for (const dn of this._damageNumbers) {
      // Convert world position to screen position
      const sx = (dn.x - camera.x) * camera.zoom + renderer.width / 2;
      const sy = (dn.y - camera.y) * camera.zoom + renderer.height / 2;

      const r = parseInt(dn.color.slice(1, 3), 16);
      const g = parseInt(dn.color.slice(3, 5), 16);
      const b = parseInt(dn.color.slice(5, 7), 16);

      // Shadow
      renderer.drawText(dn.text, sx + 1, sy + 1, {
        color: `rgba(0,0,0,${dn.alpha * 0.7})`,
        font: 'bold 11px monospace',
        align: 'center',
        baseline: 'middle',
      });
      // Main text
      renderer.drawText(dn.text, sx, sy, {
        color: `rgba(${r},${g},${b},${dn.alpha})`,
        font: 'bold 11px monospace',
        align: 'center',
        baseline: 'middle',
      });
    }
  }

  /** Reset combat state */
  reset() {
    this._attackTimer = 0;
    this._attackCooldown = 0;
    this._playerInvincible = 0;
    this._playerKnockback = null;
    this._enemyFlash.clear();
    this._damageNumbers = [];
    this._contactCooldowns.clear();
  }
}
