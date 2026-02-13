import { Collision } from '../physics/Collision.js';

/**
 * Trigger system - checks placed trigger/door entities against the player
 * each frame and fires their action lists on enter/exit/interact events.
 */
export class TriggerSystem {
  constructor(engine) {
    this.engine = engine;
    /** Set of trigger IDs the player is currently inside */
    this._insideZones = new Set();
    /** Cooldowns to prevent rapid re-triggering */
    this._cooldowns = new Map();
  }

  /** Called each frame during play mode */
  update(dt) {
    const player = this.engine.player;
    if (!player) return;

    // Don't process triggers while an action is running
    if (this.engine.actionRunner.running) return;

    const playerBox = player.getCollisionBox();

    // Update cooldowns
    for (const [id, time] of this._cooldowns) {
      const remaining = time - dt;
      if (remaining <= 0) this._cooldowns.delete(id);
      else this._cooldowns.set(id, remaining);
    }

    // Check trigger zones
    const triggerEntities = this.engine.editor.entityPlacer.entities.filter(
      (e) => e.type === 'trigger'
    );

    for (const trigger of triggerEntities) {
      const triggerBox = {
        x: trigger.x,
        y: trigger.y,
        width: trigger.width,
        height: trigger.height,
      };

      const isInside = Collision.aabb(playerBox, triggerBox);
      const wasInside = this._insideZones.has(trigger.id);

      if (isInside && !wasInside) {
        this._insideZones.add(trigger.id);
        if (trigger.properties.event === 'on_enter') {
          this._fire(trigger);
        }
      } else if (!isInside && wasInside) {
        this._insideZones.delete(trigger.id);
        if (trigger.properties.event === 'on_exit') {
          this._fire(trigger);
        }
      }
    }

    // Check door entities (act like on_enter triggers)
    const doorEntities = this.engine.editor.entityPlacer.entities.filter(
      (e) => e.type === 'door'
    );

    for (const door of doorEntities) {
      const doorBox = { x: door.x, y: door.y, width: door.width, height: door.height };
      const isInside = Collision.aabb(playerBox, doorBox);
      const wasInside = this._insideZones.has(door.id);

      if (isInside && !wasInside) {
        this._insideZones.add(door.id);
        // Door auto-teleport if targetSpawn is set
        if (door.properties.targetSpawn) {
          this.engine.actionRunner.run([
            { type: 'teleport', params: { spawnId: door.properties.targetSpawn } },
          ]);
        }
        // Also run custom actions if present
        if (door.properties.actions && door.properties.actions.length > 0) {
          this.engine.actionRunner.run(door.properties.actions);
        }
      } else if (!isInside && wasInside) {
        this._insideZones.delete(door.id);
      }
    }

    // Check item pickup
    const itemEntities = this.engine.world.getByType('item');
    for (const item of itemEntities) {
      const itemBox = { x: item.x, y: item.y, width: item.width, height: item.height };
      if (Collision.aabb(playerBox, itemBox)) {
        // Pick up item
        const name = item._itemName || 'Item';
        const value = item._itemValue || 1;
        const itemType = item._itemType || 'pickup';
        this.engine.gameState.addItem(name, 1);
        this.engine.gameState.addVar('score', value);

        // Consumable hearts restore HP
        if (itemType === 'consumable' && name.toLowerCase().includes('heart')) {
          this.engine.combatSystem.healPlayer(2);
        }

        // Show notification via HUD
        this.engine.hud.notify(`Picked up ${name}!`, '#ffdd66');
        item.active = false;
      }
    }
  }

  /** Handle interact key (Space/E) for on_interact triggers and NPC scripts */
  handleInteract() {
    const player = this.engine.player;
    if (!player) return false;
    if (this.engine.actionRunner.running) return false;

    const playerBox = player.getCollisionBox();

    // Check triggers with on_interact event
    const triggerEntities = this.engine.editor.entityPlacer.entities.filter(
      (e) => e.type === 'trigger' && e.properties.event === 'on_interact'
    );

    for (const trigger of triggerEntities) {
      const triggerBox = {
        x: trigger.x,
        y: trigger.y,
        width: trigger.width,
        height: trigger.height,
      };
      if (Collision.aabb(playerBox, triggerBox)) {
        this._fire(trigger);
        return true;
      }
    }

    return false;
  }

  /** Fire a trigger's action list */
  _fire(trigger) {
    if (this._cooldowns.has(trigger.id)) return;

    const actions = trigger.properties.actions;
    if (actions && actions.length > 0) {
      this.engine.actionRunner.run(actions);
      this._cooldowns.set(trigger.id, 0.5); // 500ms cooldown
    }
  }

  /** Reset all trigger states (called when entering play mode) */
  reset() {
    this._insideZones.clear();
    this._cooldowns.clear();
  }
}
