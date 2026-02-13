import { Entity } from '../ecs/Entity.js';
import { Sprite } from '../sprites/Sprite.js';
import { Collision } from '../physics/Collision.js';

/**
 * Player entity with 4-directional movement, animation, and tile collision.
 */
export class Player extends Entity {
  constructor(x, y, spriteSheet) {
    super(x, y, 16, 16);
    this.type = 'player';
    this.speed = 80; // pixels per second
    this.direction = 'down';
    this.moving = false;

    // Set up sprite
    this.sprite = new Sprite(spriteSheet, 16, 16);
    this.sprite.defineAnimation('idle_down', 0, 1, 1);
    this.sprite.defineAnimation('idle_left', 1, 1, 1);
    this.sprite.defineAnimation('idle_right', 2, 1, 1);
    this.sprite.defineAnimation('idle_up', 3, 1, 1);
    this.sprite.defineAnimation('walk_down', 0, 3, 8);
    this.sprite.defineAnimation('walk_left', 1, 3, 8);
    this.sprite.defineAnimation('walk_right', 2, 3, 8);
    this.sprite.defineAnimation('walk_up', 3, 3, 8);
    this.sprite.play('idle_down');
    this.addComponent('sprite', this.sprite);
  }

  handleInput(input) {
    this.vx = 0;
    this.vy = 0;

    if (input.keyDown('ArrowLeft') || input.keyDown('KeyA')) {
      this.vx = -this.speed;
      this.direction = 'left';
    }
    if (input.keyDown('ArrowRight') || input.keyDown('KeyD')) {
      this.vx = this.speed;
      this.direction = 'right';
    }
    if (input.keyDown('ArrowUp') || input.keyDown('KeyW')) {
      this.vy = -this.speed;
      this.direction = 'up';
    }
    if (input.keyDown('ArrowDown') || input.keyDown('KeyS')) {
      this.vy = this.speed;
      this.direction = 'down';
    }

    // Normalize diagonal movement
    if (this.vx !== 0 && this.vy !== 0) {
      const len = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      this.vx = (this.vx / len) * this.speed;
      this.vy = (this.vy / len) * this.speed;
    }

    this.moving = this.vx !== 0 || this.vy !== 0;
  }

  update(dt) {
    // Update animation
    const prefix = this.moving ? 'walk' : 'idle';
    this.sprite.play(`${prefix}_${this.direction}`);
    this.sprite.update(dt);
  }

  /** Move with tile collision. Called from game mode. */
  moveWithCollision(dt, tileMap) {
    const dx = this.vx * dt;
    const dy = this.vy * dt;
    Collision.resolveWithTilemap(this, tileMap, dx, dy);
  }

  getCollisionBox() {
    // Slightly smaller collision box for smoother movement around corners
    return {
      x: this.x + 2,
      y: this.y + 6,
      width: this.width - 4,
      height: this.height - 6,
    };
  }

  render(renderer) {
    if (this._renderSkip) return; // invincibility blink
    this.sprite.render(renderer);
  }

  serialize() {
    return {
      ...super.serialize(),
      direction: this.direction,
    };
  }
}
