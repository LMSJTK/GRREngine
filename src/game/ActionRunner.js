/**
 * Action runner - executes a list of actions sequentially.
 * Handles async actions (wait, dialog) by pausing execution.
 * Used by TriggerSystem, NPC interactions, cutscenes, etc.
 */
export class ActionRunner {
  constructor(engine) {
    this.engine = engine;
    this.running = false;
    this._queue = [];
    this._waitTimer = 0;
    this._inputLocked = false;

    // The entity that triggered the current action list (for remove_entity, etc.)
    this._sourceEntity = null;
  }

  /** Start executing a list of actions */
  run(actions, sourceEntity = null) {
    if (!actions || actions.length === 0) return;

    // If already running, queue additional actions at the end
    if (this.running) {
      this._queue.push(...actions);
      return;
    }

    this._queue = [...actions];
    this._sourceEntity = sourceEntity;
    this.running = true;
    this._waitTimer = 0;

    // Execute immediately until we hit a wait
    this._processQueue();
  }

  /** Called each frame to process timers */
  update(dt) {
    if (!this.running) return;

    if (this._waitTimer > 0) {
      this._waitTimer -= dt;
      if (this._waitTimer <= 0) {
        this._waitTimer = 0;
        this._processQueue();
      }
    }
  }

  /** Process actions from the queue until we hit a wait or run out */
  _processQueue() {
    while (this._queue.length > 0) {
      const action = this._queue.shift();
      const result = this._execute(action);
      if (result === 'wait') return;
      if (result === 'stop') {
        this._queue = [];
        this._finish();
        return;
      }
    }

    // Queue empty — we're done
    this._finish();
  }

  _finish() {
    this.running = false;
    this._sourceEntity = null;
    // Ensure input is unlocked when actions finish
    if (this._inputLocked) {
      this._inputLocked = false;
    }
  }

  /** Execute a single action. Returns 'done', 'wait', or 'stop'. */
  _execute(action) {
    if (!action || !action.type) return 'done';
    const p = action.params || {};

    switch (action.type) {
      case 'show_dialog': {
        const text = p.text || '...';
        const duration = p.duration || 3;
        this.engine.dialogText = text;
        this.engine.dialogTimer = duration;
        this._waitTimer = duration;
        return 'wait';
      }

      case 'wait': {
        this._waitTimer = p.seconds || 1;
        return 'wait';
      }

      case 'set_flag': {
        this.engine.gameState.setFlag(p.flag, p.value !== false);
        return 'done';
      }

      case 'check_flag': {
        const actual = this.engine.gameState.getFlag(p.flag);
        const expected = p.expect !== false;
        if (actual !== expected) return 'stop';
        return 'done';
      }

      case 'set_variable': {
        this.engine.gameState.setVar(p.variable, p.value ?? 0);
        return 'done';
      }

      case 'add_variable': {
        this.engine.gameState.addVar(p.variable, p.amount ?? 1);
        return 'done';
      }

      case 'give_item': {
        this.engine.gameState.addItem(p.item, p.amount || 1);
        this.engine.dialogText = `Got ${p.item}${(p.amount || 1) > 1 ? ` x${p.amount}` : ''}!`;
        this.engine.dialogTimer = 2;
        this._waitTimer = 2;
        return 'wait';
      }

      case 'remove_item': {
        this.engine.gameState.removeItem(p.item, p.amount || 1);
        return 'done';
      }

      case 'check_item': {
        if (!this.engine.gameState.hasItem(p.item, p.amount || 1)) return 'stop';
        return 'done';
      }

      case 'teleport': {
        const spawnId = p.spawnId || 'default';
        const spawnEntity = this.engine.editor.entityPlacer.entities.find(
          (e) => e.type === 'spawn' && e.properties.spawnId === spawnId
        );
        if (spawnEntity && this.engine.player) {
          this.engine.player.x = spawnEntity.x;
          this.engine.player.y = spawnEntity.y;
        }
        return 'done';
      }

      case 'lock_input': {
        this._inputLocked = p.locked !== false;
        return 'done';
      }

      case 'camera_pan': {
        const cam = this.engine.camera;
        cam.target = null; // detach from player
        cam._panTarget = { x: p.x || 0, y: p.y || 0 };
        cam._panDuration = p.duration || 1;
        cam._panElapsed = 0;
        cam._panStartX = cam.x;
        cam._panStartY = cam.y;
        this._waitTimer = p.duration || 1;
        return 'wait';
      }

      case 'camera_follow': {
        const cam = this.engine.camera;
        cam._panTarget = null;
        if (this.engine.player) {
          cam.follow(this.engine.player, 0.15);
        }
        return 'done';
      }

      case 'remove_entity': {
        if (this._sourceEntity) {
          this._sourceEntity.active = false;
        }
        return 'done';
      }

      default:
        console.warn(`Unknown action type: ${action.type}`);
        return 'done';
    }
  }

  /** Whether input should be locked (used by engine to skip player input) */
  get isInputLocked() {
    return this._inputLocked;
  }
}
