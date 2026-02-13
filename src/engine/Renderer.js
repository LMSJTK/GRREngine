/**
 * Canvas 2D rendering system.
 * Handles drawing with camera transforms, sprites, tiles, shapes, and text.
 */
export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false; // crisp pixel art
    this.width = canvas.width;
    this.height = canvas.height;

    this._resizeObserver = new ResizeObserver(() => this._handleResize());
    this._resizeObserver.observe(canvas.parentElement);
    this._handleResize();
  }

  _handleResize() {
    const parent = this.canvas.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    this.canvas.width = Math.floor(rect.width);
    this.canvas.height = Math.floor(rect.height);
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.ctx.imageSmoothingEnabled = false;
  }

  clear(color = '#1a1a2e') {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  /** Apply camera transform for world-space drawing */
  applyCamera(camera) {
    this.ctx.save();
    this.ctx.translate(
      Math.floor(-camera.x * camera.zoom + this.width / 2),
      Math.floor(-camera.y * camera.zoom + this.height / 2)
    );
    this.ctx.scale(camera.zoom, camera.zoom);
  }

  /** Restore to screen space */
  restoreCamera() {
    this.ctx.restore();
  }

  drawImage(image, x, y, w, h) {
    this.ctx.drawImage(image, Math.floor(x), Math.floor(y), w, h);
  }

  /** Draw a sub-region of an image (for sprite sheets) */
  drawImageRegion(image, sx, sy, sw, sh, dx, dy, dw, dh) {
    this.ctx.drawImage(
      image,
      sx, sy, sw, sh,
      Math.floor(dx), Math.floor(dy), dw, dh
    );
  }

  drawRect(x, y, w, h, color, fill = true) {
    if (fill) {
      this.ctx.fillStyle = color;
      this.ctx.fillRect(Math.floor(x), Math.floor(y), w, h);
    } else {
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(Math.floor(x) + 0.5, Math.floor(y) + 0.5, w - 1, h - 1);
    }
  }

  drawText(text, x, y, { color = '#fff', font = '14px monospace', align = 'left', baseline = 'top' } = {}) {
    this.ctx.fillStyle = color;
    this.ctx.font = font;
    this.ctx.textAlign = align;
    this.ctx.textBaseline = baseline;
    this.ctx.fillText(text, Math.floor(x), Math.floor(y));
  }

  drawGrid(camera, tileSize, color = 'rgba(255,255,255,0.08)') {
    const startX = Math.floor((camera.x - this.width / 2 / camera.zoom) / tileSize) * tileSize;
    const startY = Math.floor((camera.y - this.height / 2 / camera.zoom) / tileSize) * tileSize;
    const endX = startX + this.width / camera.zoom + tileSize * 2;
    const endY = startY + this.height / camera.zoom + tileSize * 2;

    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 1 / camera.zoom;

    this.ctx.beginPath();
    for (let x = startX; x <= endX; x += tileSize) {
      this.ctx.moveTo(x, startY);
      this.ctx.lineTo(x, endY);
    }
    for (let y = startY; y <= endY; y += tileSize) {
      this.ctx.moveTo(startX, y);
      this.ctx.lineTo(endX, y);
    }
    this.ctx.stroke();
  }

  /** Get canvas-relative mouse position */
  getCanvasPos(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }
}
