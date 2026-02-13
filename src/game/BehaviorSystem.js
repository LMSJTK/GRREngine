import { Collision } from '../physics/Collision.js';

/**
 * Behavior system - updates enemy/NPC AI each frame.
 * Supports: stationary, wander, patrol, chase.
 */

const DIR_VECTORS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};
const DIRECTIONS = ['up', 'down', 'left', 'right'];

export class BehaviorSystem {
  constructor() {
    /** Per-entity AI state, keyed by world entity ID */
    this._states = new Map();
  }

  /** Called each frame during play mode */
  update(dt, world, player, tileMap) {
    const enemies = world.getByType('enemy');

    for (const enemy of enemies) {
      const behavior = enemy._behavior || 'stationary';
      let state = this._states.get(enemy.id);

      if (!state) {
        state = {
          timer: 0,
          moveTimer: 0,
          moving: false,
          direction: enemy._direction || 'down',
          originX: enemy.x,
          originY: enemy.y,
          patrolIndex: 0,
          patrolForward: true,
          speed: 25,
        };
        this._states.set(enemy.id, state);
      }

      switch (behavior) {
        case 'wander':
          this._updateWander(dt, enemy, state, tileMap);
          break;
        case 'patrol':
          this._updatePatrol(dt, enemy, state, tileMap);
          break;
        case 'chase':
          this._updateChase(dt, enemy, state, player, tileMap);
          break;
        case 'stationary':
          this._updateStationary(dt, enemy, state, player);
          break;
      }

      // Update sprite direction
      enemy._direction = state.direction;
    }
  }

  /** Wander: move in a random direction, pause, repeat */
  _updateWander(dt, enemy, state, tileMap) {
    state.timer -= dt;

    if (state.timer <= 0) {
      if (state.moving) {
        // Stop moving, start pause
        state.moving = false;
        state.timer = 1 + Math.random() * 2;
      } else {
        // Pick random direction and start moving
        state.direction = DIRECTIONS[Math.floor(Math.random() * 4)];
        state.moving = true;
        state.timer = 0.5 + Math.random() * 1.5;
      }
    }

    if (state.moving) {
      const vec = DIR_VECTORS[state.direction];
      const dx = vec.x * state.speed * dt;
      const dy = vec.y * state.speed * dt;

      // Stay within wander radius of origin
      const maxRadius = enemy._wanderRadius || 48;
      const nextX = enemy.x + dx;
      const nextY = enemy.y + dy;
      const distFromOrigin = Math.sqrt(
        (nextX - state.originX) ** 2 + (nextY - state.originY) ** 2
      );

      if (distFromOrigin <= maxRadius) {
        Collision.resolveWithTilemap(enemy, tileMap, dx, dy);
      } else {
        // Went too far, reverse direction
        state.direction = this._reverseDir(state.direction);
        state.timer = 0;
      }
    }
  }

  /** Patrol: walk back and forth along a line */
  _updatePatrol(dt, enemy, state, tileMap) {
    const patrolDist = enemy._patrolDistance || 64;
    const speed = state.speed;

    // Determine patrol endpoints based on origin
    const dir = enemy._patrolDirection || 'right';
    const horizontal = dir === 'left' || dir === 'right';
    const axis = horizontal ? 'x' : 'y';
    const start = horizontal ? state.originX : state.originY;
    const end = start + (dir === 'right' || dir === 'down' ? patrolDist : -patrolDist);

    // Move toward target
    const target = state.patrolForward ? end : start;
    const current = enemy[axis];
    const diff = target - current;

    if (Math.abs(diff) < 2) {
      state.patrolForward = !state.patrolForward;
      state.direction = this._reverseDir(state.direction);
      return;
    }

    const moveDir = diff > 0 ? 1 : -1;
    const movement = moveDir * speed * dt;

    if (horizontal) {
      state.direction = moveDir > 0 ? 'right' : 'left';
      Collision.resolveWithTilemap(enemy, tileMap, movement, 0);
    } else {
      state.direction = moveDir > 0 ? 'down' : 'up';
      Collision.resolveWithTilemap(enemy, tileMap, 0, movement);
    }
  }

  /** Chase: move toward the player when within range */
  _updateChase(dt, enemy, state, player, tileMap) {
    if (!player) return;

    const chaseRadius = enemy._chaseRadius || 80;
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > chaseRadius) {
      // Too far — idle or wander back toward origin
      this._updateWander(dt, enemy, state, tileMap);
      return;
    }

    // Move toward player
    const speed = state.speed * 1.2; // slightly faster when chasing
    if (dist > 1) {
      const nx = (dx / dist) * speed * dt;
      const ny = (dy / dist) * speed * dt;

      // Face the player
      if (Math.abs(dx) > Math.abs(dy)) {
        state.direction = dx > 0 ? 'right' : 'left';
      } else {
        state.direction = dy > 0 ? 'down' : 'up';
      }

      Collision.resolveWithTilemap(enemy, tileMap, nx, ny);
    }
  }

  /** Stationary: face the player when they're nearby */
  _updateStationary(dt, enemy, state, player) {
    if (!player) return;

    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 48) {
      if (Math.abs(dx) > Math.abs(dy)) {
        state.direction = dx > 0 ? 'right' : 'left';
      } else {
        state.direction = dy > 0 ? 'down' : 'up';
      }
    }
  }

  _reverseDir(dir) {
    switch (dir) {
      case 'up': return 'down';
      case 'down': return 'up';
      case 'left': return 'right';
      case 'right': return 'left';
      default: return 'down';
    }
  }

  /** Reset all AI states (on play mode entry) */
  reset() {
    this._states.clear();
  }
}
