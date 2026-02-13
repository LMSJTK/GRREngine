/**
 * Fixed-timestep game loop with variable rendering.
 * Physics/logic update at a fixed rate, rendering as fast as possible.
 */
export class GameLoop {
  constructor({ update, render, fixedDt = 1 / 60 }) {
    this.update = update;
    this.render = render;
    this.fixedDt = fixedDt;
    this.accumulator = 0;
    this.lastTime = 0;
    this.running = false;
    this.rafId = null;
    this.fps = 0;
    this.frameCount = 0;
    this.fpsTimer = 0;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now() / 1000;
    this.accumulator = 0;
    this.rafId = requestAnimationFrame((t) => this._tick(t));
  }

  stop() {
    this.running = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  _tick(timestamp) {
    if (!this.running) return;

    const now = timestamp / 1000;
    let frameTime = now - this.lastTime;
    this.lastTime = now;

    // Clamp frame time to prevent spiral of death
    if (frameTime > 0.25) frameTime = 0.25;

    this.accumulator += frameTime;

    // Fixed timestep updates
    while (this.accumulator >= this.fixedDt) {
      this.update(this.fixedDt);
      this.accumulator -= this.fixedDt;
    }

    // Render with interpolation alpha
    const alpha = this.accumulator / this.fixedDt;
    this.render(alpha);

    // FPS counter
    this.frameCount++;
    this.fpsTimer += frameTime;
    if (this.fpsTimer >= 1.0) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsTimer -= 1.0;
    }

    this.rafId = requestAnimationFrame((t) => this._tick(t));
  }
}
