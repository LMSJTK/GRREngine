/**
 * 2D camera with smooth follow, zoom, and bounds.
 */
export class Camera {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
    this.zoom = 3; // default zoom for pixel art (3x)
    this.minZoom = 0.5;
    this.maxZoom = 8;
    this.smoothing = 0.1; // lerp factor for following
    this.target = null;
    this.bounds = null; // { minX, minY, maxX, maxY } or null for unbounded
  }

  /** Set a target to follow (any object with x,y) */
  follow(target, smoothing = 0.1) {
    this.target = target;
    this.smoothing = smoothing;
  }

  /** Set world bounds for the camera */
  setBounds(minX, minY, maxX, maxY) {
    this.bounds = { minX, minY, maxX, maxY };
  }

  clearBounds() {
    this.bounds = null;
  }

  update(dt, viewportWidth, viewportHeight) {
    if (this.target) {
      const tx = this.target.x + (this.target.width || 0) / 2;
      const ty = this.target.y + (this.target.height || 0) / 2;
      this.x += (tx - this.x) * this.smoothing;
      this.y += (ty - this.y) * this.smoothing;
    }

    if (this.bounds) {
      const halfW = viewportWidth / 2 / this.zoom;
      const halfH = viewportHeight / 2 / this.zoom;
      this.x = Math.max(this.bounds.minX + halfW, Math.min(this.bounds.maxX - halfW, this.x));
      this.y = Math.max(this.bounds.minY + halfH, Math.min(this.bounds.maxY - halfH, this.y));
    }
  }

  /** Adjust zoom by delta (from scroll wheel) */
  adjustZoom(delta) {
    this.zoom *= 1 - delta * 0.001;
    this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom));
  }

  /** Convert screen coordinates to world coordinates */
  screenToWorld(screenX, screenY, viewportWidth, viewportHeight) {
    return {
      x: (screenX - viewportWidth / 2) / this.zoom + this.x,
      y: (screenY - viewportHeight / 2) / this.zoom + this.y,
    };
  }

  /** Convert world coordinates to screen coordinates */
  worldToScreen(worldX, worldY, viewportWidth, viewportHeight) {
    return {
      x: (worldX - this.x) * this.zoom + viewportWidth / 2,
      y: (worldY - this.y) * this.zoom + viewportHeight / 2,
    };
  }

  /** Move camera by screen-space pixels (for panning) */
  pan(dx, dy) {
    this.x -= dx / this.zoom;
    this.y -= dy / this.zoom;
  }
}
