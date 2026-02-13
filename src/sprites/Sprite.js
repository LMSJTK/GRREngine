/**
 * Sprite component for entities.
 * Supports directional animation frames from a sprite sheet.
 */
export class Sprite {
  constructor(spriteSheet, frameWidth = 16, frameHeight = 16) {
    this.spriteSheet = spriteSheet; // image containing all frames
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;
    this.animations = new Map(); // name -> { row, frames, frameRate }
    this.currentAnim = null;
    this.currentFrame = 0;
    this.frameTimer = 0;
    this.flipX = false;
    this.entity = null; // set when added as component
  }

  /**
   * Define an animation.
   * row: which row in the sprite sheet
   * frames: number of frames
   * frameRate: frames per second
   */
  defineAnimation(name, row, frames, frameRate = 8) {
    this.animations.set(name, { row, frames, frameRate });
  }

  play(name) {
    if (this.currentAnim === name) return;
    this.currentAnim = name;
    this.currentFrame = 0;
    this.frameTimer = 0;
  }

  update(dt) {
    const anim = this.animations.get(this.currentAnim);
    if (!anim || anim.frames <= 1) return;

    this.frameTimer += dt;
    if (this.frameTimer >= 1 / anim.frameRate) {
      this.frameTimer -= 1 / anim.frameRate;
      this.currentFrame = (this.currentFrame + 1) % anim.frames;
    }
  }

  render(renderer) {
    if (!this.spriteSheet || !this.entity) return;

    const anim = this.animations.get(this.currentAnim);
    if (!anim) return;

    const sx = this.currentFrame * this.frameWidth;
    const sy = anim.row * this.frameHeight;

    if (this.flipX) {
      renderer.ctx.save();
      renderer.ctx.scale(-1, 1);
      renderer.drawImageRegion(
        this.spriteSheet,
        sx, sy, this.frameWidth, this.frameHeight,
        -(this.entity.x + this.entity.width), this.entity.y,
        this.entity.width, this.entity.height
      );
      renderer.ctx.restore();
    } else {
      renderer.drawImageRegion(
        this.spriteSheet,
        sx, sy, this.frameWidth, this.frameHeight,
        this.entity.x, this.entity.y,
        this.entity.width, this.entity.height
      );
    }
  }
}
