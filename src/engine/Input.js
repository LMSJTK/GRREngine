/**
 * Input manager for keyboard, mouse, and basic touch.
 * Tracks current state, just-pressed, and just-released.
 */
export class Input {
  constructor(canvas) {
    this.canvas = canvas;

    // Keyboard
    this._keys = new Set();
    this._keysPressed = new Set();
    this._keysReleased = new Set();

    // Mouse
    this.mouse = { x: 0, y: 0, worldX: 0, worldY: 0 };
    this._mouseButtons = new Set();
    this._mousePressed = new Set();
    this._mouseReleased = new Set();
    this._wheelDelta = 0;

    this._bindEvents();
  }

  _bindEvents() {
    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      this._keys.add(e.code);
      this._keysPressed.add(e.code);
    });

    window.addEventListener('keyup', (e) => {
      this._keys.delete(e.code);
      this._keysReleased.add(e.code);
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
    });

    this.canvas.addEventListener('mousedown', (e) => {
      this._mouseButtons.add(e.button);
      this._mousePressed.add(e.button);
    });

    this.canvas.addEventListener('mouseup', (e) => {
      this._mouseButtons.delete(e.button);
      this._mouseReleased.add(e.button);
    });

    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      this._wheelDelta += e.deltaY;
    }, { passive: false });

    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // Touch - map to mouse
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = touch.clientX - rect.left;
      this.mouse.y = touch.clientY - rect.top;
      this._mouseButtons.add(0);
      this._mousePressed.add(0);
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = touch.clientX - rect.left;
      this.mouse.y = touch.clientY - rect.top;
    }, { passive: false });

    this.canvas.addEventListener('touchend', (e) => {
      this._mouseButtons.delete(0);
      this._mouseReleased.add(0);
    });
  }

  /** Update mouse world position based on camera */
  updateWorldMouse(camera, renderer) {
    this.mouse.worldX = (this.mouse.x - renderer.width / 2) / camera.zoom + camera.x;
    this.mouse.worldY = (this.mouse.y - renderer.height / 2) / camera.zoom + camera.y;
  }

  /** Is key currently held down? */
  keyDown(code) {
    return this._keys.has(code);
  }

  /** Was key just pressed this frame? */
  keyPressed(code) {
    return this._keysPressed.has(code);
  }

  /** Was key just released this frame? */
  keyReleased(code) {
    return this._keysReleased.has(code);
  }

  /** Is mouse button held? (0=left, 1=middle, 2=right) */
  mouseDown(button = 0) {
    return this._mouseButtons.has(button);
  }

  /** Was mouse button just pressed? */
  mousePressed(button = 0) {
    return this._mousePressed.has(button);
  }

  /** Was mouse button just released? */
  mouseReleased(button = 0) {
    return this._mouseReleased.has(button);
  }

  /** Get and reset wheel delta */
  getWheelDelta() {
    const d = this._wheelDelta;
    this._wheelDelta = 0;
    return d;
  }

  /** Call at end of each frame to reset per-frame state */
  endFrame() {
    this._keysPressed.clear();
    this._keysReleased.clear();
    this._mousePressed.clear();
    this._mouseReleased.clear();
  }
}
