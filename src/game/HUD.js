/**
 * HUD renderer - draws health hearts, score, inventory bar,
 * dialog box, and notification popups during play mode.
 */
export class HUD {
  constructor(engine) {
    this.engine = engine;
    this._notifications = [];
  }

  /** Add a brief notification popup (e.g. "Picked up Key!") */
  notify(text, color = '#ffffff', duration = 2) {
    this._notifications.push({
      text,
      color,
      timer: duration,
      maxTime: duration,
      alpha: 1,
    });
  }

  update(dt) {
    for (let i = this._notifications.length - 1; i >= 0; i--) {
      const n = this._notifications[i];
      n.timer -= dt;
      // Fade out in last 0.5s
      if (n.timer < 0.5) {
        n.alpha = Math.max(0, n.timer / 0.5);
      }
      if (n.timer <= 0) {
        this._notifications.splice(i, 1);
      }
    }
  }

  render(renderer) {
    const w = renderer.width;
    const h = renderer.height;

    this._renderHearts(renderer, 10, 10);
    this._renderScore(renderer, w);
    this._renderInventory(renderer, w, h);
    this._renderDialog(renderer, w, h);
    this._renderNotifications(renderer, w, h);
    this._renderControls(renderer, w, h);
    this._renderFPS(renderer, w);
  }

  _renderHearts(renderer, x, y) {
    const gs = this.engine.gameState;
    const hp = gs.getVar('hp', 6);
    const maxHp = gs.getVar('maxHp', 6);
    const heartSize = 12;
    const gap = 2;

    // Hearts are in pairs of 2 HP each (like Zelda half-hearts)
    const totalHearts = Math.ceil(maxHp / 2);

    for (let i = 0; i < totalHearts; i++) {
      const hx = x + i * (heartSize + gap);
      const hpForThisHeart = hp - i * 2;

      if (hpForThisHeart >= 2) {
        // Full heart
        this._drawHeart(renderer, hx, y, heartSize, '#e04040', '#ff6060');
      } else if (hpForThisHeart === 1) {
        // Half heart
        this._drawHeart(renderer, hx, y, heartSize, '#803030', '#a04040');
        this._drawHalfHeart(renderer, hx, y, heartSize, '#e04040', '#ff6060');
      } else {
        // Empty heart
        this._drawHeart(renderer, hx, y, heartSize, '#402020', '#603030');
      }
    }

    // Show numeric HP next to hearts
    const textX = x + totalHearts * (heartSize + gap) + 4;
    renderer.drawText(`${hp}/${maxHp}`, textX, y + 2, {
      color: 'rgba(255,200,200,0.7)',
      font: '10px monospace',
    });
  }

  _drawHeart(renderer, x, y, size, fillColor, highlightColor) {
    const ctx = renderer.ctx;
    const s = size;
    const cx = x + s / 2;
    const cy = y + s / 2;

    ctx.fillStyle = fillColor;
    // Simplified heart: two circles + triangle
    const r = s * 0.25;
    ctx.beginPath();
    ctx.arc(cx - r, cy - r * 0.5, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + r, cy - r * 0.5, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.45, cy - r * 0.1);
    ctx.lineTo(cx, cy + s * 0.4);
    ctx.lineTo(cx + s * 0.45, cy - r * 0.1);
    ctx.fill();

    // Small highlight
    ctx.fillStyle = highlightColor;
    ctx.beginPath();
    ctx.arc(cx - r - 1, cy - r * 0.5 - 1, r * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawHalfHeart(renderer, x, y, size, fillColor, highlightColor) {
    const ctx = renderer.ctx;
    const s = size;
    const cx = x + s / 2;
    const cy = y + s / 2;
    const r = s * 0.25;

    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, s / 2, s);
    ctx.clip();

    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.arc(cx - r, cy - r * 0.5, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + r, cy - r * 0.5, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.45, cy - r * 0.1);
    ctx.lineTo(cx, cy + s * 0.4);
    ctx.lineTo(cx + s * 0.45, cy - r * 0.1);
    ctx.fill();

    ctx.fillStyle = highlightColor;
    ctx.beginPath();
    ctx.arc(cx - r - 1, cy - r * 0.5 - 1, r * 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  _renderScore(renderer, w) {
    const score = this.engine.gameState.getVar('score', 0);
    const xp = this.engine.gameState.getVar('xp', 0);

    if (score > 0 || xp > 0) {
      let text = '';
      if (score > 0) text += `Score: ${score}`;
      if (xp > 0) text += `${text ? '  ' : ''}XP: ${xp}`;
      renderer.drawText(text, w - 10, 26, {
        color: 'rgba(255,255,200,0.7)',
        font: '11px monospace',
        align: 'right',
      });
    }
  }

  _renderInventory(renderer, w, h) {
    const items = this.engine.gameState.inventory;
    if (items.length === 0) return;

    const barY = 26;
    const barX = 10;
    const itemWidth = 64;
    const barHeight = 16;

    for (let i = 0; i < items.length && i < 8; i++) {
      const ix = barX + i * (itemWidth + 4);
      const item = items[i];

      renderer.drawRect(ix, barY, itemWidth, barHeight, 'rgba(0,0,0,0.4)');
      renderer.drawRect(ix, barY, itemWidth, barHeight, 'rgba(100,130,170,0.3)', false);

      const label = item.amount > 1 ? `${item.name} x${item.amount}` : item.name;
      renderer.drawText(label, ix + 3, barY + 3, {
        color: 'rgba(255,255,220,0.85)',
        font: '10px monospace',
      });
    }
  }

  _renderDialog(renderer, w, h) {
    if (!this.engine.dialogText) return;

    const boxW = Math.min(400, w - 40);
    const boxH = 60;
    const boxX = (w - boxW) / 2;
    const boxY = h - boxH - 20;

    // Background
    renderer.drawRect(boxX, boxY, boxW, boxH, 'rgba(0,0,0,0.85)');
    // Border
    renderer.drawRect(boxX, boxY, boxW, boxH, '#6688aa', false);
    // Inner highlight
    renderer.drawRect(boxX + 1, boxY + 1, boxW - 2, boxH - 2, 'rgba(100,130,170,0.15)');

    // Text with word wrapping
    const maxWidth = boxW - 30;
    const text = this.engine.dialogText;
    const ctx = renderer.ctx;
    ctx.font = '13px monospace';
    const words = text.split(' ');
    let line = '';
    let lineY = boxY + 16;
    const lineHeight = 16;

    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && line) {
        renderer.drawText(line, boxX + 15, lineY, {
          color: '#ffffff',
          font: '13px monospace',
        });
        line = word;
        lineY += lineHeight;
      } else {
        line = testLine;
      }
    }
    if (line) {
      renderer.drawText(line, boxX + 15, lineY, {
        color: '#ffffff',
        font: '13px monospace',
      });
    }
  }

  _renderNotifications(renderer, w, h) {
    for (let i = 0; i < this._notifications.length; i++) {
      const n = this._notifications[i];
      const ny = h - 100 - i * 20;

      const r = parseInt(n.color.slice(1, 3), 16) || 255;
      const g = parseInt(n.color.slice(3, 5), 16) || 255;
      const b = parseInt(n.color.slice(5, 7), 16) || 255;

      renderer.drawText(n.text, w / 2, ny, {
        color: `rgba(${r},${g},${b},${n.alpha})`,
        font: '12px monospace',
        align: 'center',
      });
    }
  }

  _renderControls(renderer, w, h) {
    renderer.drawText(
      'WASD: Move | J: Attack | Space: Interact | Esc: Editor',
      w / 2, h - 8,
      { color: 'rgba(255,255,255,0.3)', font: '11px monospace', align: 'center', baseline: 'bottom' }
    );
  }

  _renderFPS(renderer, w) {
    renderer.drawText(
      `FPS: ${this.engine.gameLoop.fps}`,
      w - 10, 10,
      { color: 'rgba(255,255,255,0.4)', font: '10px monospace', align: 'right' }
    );
  }

  reset() {
    this._notifications = [];
  }
}
