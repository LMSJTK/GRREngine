/**
 * Screen transition overlay - handles fade-to-black, fade-from-black,
 * and death screen with respawn prompt.
 */
export class ScreenTransition {
  constructor() {
    this._state = 'none'; // 'none', 'fade_out', 'fade_in', 'death', 'hold'
    this._alpha = 0;
    this._duration = 0;
    this._timer = 0;
    this._color = '#000000';
    this._onMidpoint = null; // callback at full black
    this._onComplete = null;

    // Death screen
    this._deathTimer = 0;
    this._deathPromptVisible = false;
  }

  /** Fade to black, call midpoint callback, then fade back in */
  fadeThrough(duration = 0.8, onMidpoint = null, onComplete = null, color = '#000000') {
    this._state = 'fade_out';
    this._alpha = 0;
    this._duration = duration / 2;
    this._timer = 0;
    this._color = color;
    this._onMidpoint = onMidpoint;
    this._onComplete = onComplete;
  }

  /** Fade to black only */
  fadeOut(duration = 0.5, onComplete = null, color = '#000000') {
    this._state = 'fade_out';
    this._alpha = 0;
    this._duration = duration;
    this._timer = 0;
    this._color = color;
    this._onMidpoint = null;
    this._onComplete = () => {
      this._state = 'hold';
      if (onComplete) onComplete();
    };
  }

  /** Fade from black to clear */
  fadeIn(duration = 0.5, onComplete = null) {
    this._state = 'fade_in';
    this._alpha = 1;
    this._duration = duration;
    this._timer = 0;
    this._onMidpoint = null;
    this._onComplete = onComplete;
  }

  /** Show death screen with game over text */
  showDeath() {
    this._state = 'death';
    this._alpha = 0;
    this._timer = 0;
    this._deathTimer = 0;
    this._deathPromptVisible = false;
    this._color = '#100808';
  }

  /** Is any transition active? */
  get active() {
    return this._state !== 'none';
  }

  /** Is the screen fully black (for death prompt input)? */
  get isDeathReady() {
    return this._state === 'death' && this._deathPromptVisible;
  }

  update(dt) {
    if (this._state === 'none') return;

    this._timer += dt;

    switch (this._state) {
      case 'fade_out': {
        this._alpha = Math.min(1, this._timer / this._duration);
        if (this._alpha >= 1) {
          if (this._onMidpoint) {
            const cb = this._onMidpoint;
            this._onMidpoint = null;
            cb();
            // Start fade in
            this._state = 'fade_in';
            this._timer = 0;
          } else if (this._onComplete) {
            const cb = this._onComplete;
            this._onComplete = null;
            cb();
          } else {
            this._state = 'none';
          }
        }
        break;
      }

      case 'fade_in': {
        this._alpha = Math.max(0, 1 - this._timer / this._duration);
        if (this._alpha <= 0) {
          this._state = 'none';
          this._alpha = 0;
          if (this._onComplete) {
            const cb = this._onComplete;
            this._onComplete = null;
            cb();
          }
        }
        break;
      }

      case 'hold':
        // Stay at full alpha, waiting for external trigger
        this._alpha = 1;
        break;

      case 'death': {
        this._deathTimer += dt;
        this._alpha = Math.min(0.85, this._deathTimer / 0.8);
        if (this._deathTimer > 1.5) {
          this._deathPromptVisible = true;
        }
        break;
      }
    }
  }

  render(renderer) {
    if (this._state === 'none' || this._alpha <= 0) return;

    const w = renderer.width;
    const h = renderer.height;

    // Overlay
    renderer.drawRect(0, 0, w, h, this._colorWithAlpha(this._color, this._alpha));

    // Death screen extras
    if (this._state === 'death') {
      if (this._deathTimer > 0.6) {
        const textAlpha = Math.min(1, (this._deathTimer - 0.6) / 0.5);
        renderer.drawText('Game Over', w / 2, h / 2 - 20, {
          color: `rgba(200,60,60,${textAlpha})`,
          font: 'bold 24px monospace',
          align: 'center',
          baseline: 'middle',
        });
      }

      if (this._deathPromptVisible) {
        const blink = Math.sin(this._deathTimer * 3) > 0;
        if (blink) {
          renderer.drawText('Press Space to respawn', w / 2, h / 2 + 20, {
            color: 'rgba(200,200,200,0.7)',
            font: '13px monospace',
            align: 'center',
            baseline: 'middle',
          });
        }
      }

      // Show stats
      if (this._deathTimer > 1.0) {
        const statAlpha = Math.min(1, (this._deathTimer - 1.0) / 0.5);
        const score = this.engine?.gameState?.getVar('score', 0) || 0;
        renderer.drawText(`Score: ${score}`, w / 2, h / 2 + 50, {
          color: `rgba(180,180,140,${statAlpha * 0.6})`,
          font: '11px monospace',
          align: 'center',
          baseline: 'middle',
        });
      }
    }
  }

  _colorWithAlpha(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16) || 0;
    const g = parseInt(hex.slice(3, 5), 16) || 0;
    const b = parseInt(hex.slice(5, 7), 16) || 0;
    return `rgba(${r},${g},${b},${alpha})`;
  }

  /** Attach engine reference for death screen stats */
  setEngine(engine) {
    this.engine = engine;
  }

  reset() {
    this._state = 'none';
    this._alpha = 0;
    this._timer = 0;
    this._deathTimer = 0;
    this._deathPromptVisible = false;
    this._onMidpoint = null;
    this._onComplete = null;
  }
}
