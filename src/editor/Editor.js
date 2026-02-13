import { TileRenderer } from '../tiles/TileRenderer.js';

/**
 * Map Editor - handles tile painting, erasing, entity placement.
 * The editor takes over input when in edit mode.
 */
export class Editor {
  constructor(engine) {
    this.engine = engine;
    this.active = true;

    // Tools
    this.currentTool = 'paint'; // paint, erase, entity, select
    this.currentLayer = 'ground';
    this.selectedTileId = 0;
    this.showGrid = true;

    // Panning state
    this._isPanning = false;
    this._lastPanX = 0;
    this._lastPanY = 0;

    // Undo history
    this._history = [];
    this._historyIndex = -1;
    this._currentAction = null;
  }

  /** Push current map state to undo history */
  _pushHistory() {
    const snapshot = JSON.stringify(this.engine.tileMap.serialize());
    // Trim any redo states
    this._history = this._history.slice(0, this._historyIndex + 1);
    this._history.push(snapshot);
    this._historyIndex = this._history.length - 1;
    // Limit history size
    if (this._history.length > 50) {
      this._history.shift();
      this._historyIndex--;
    }
  }

  undo() {
    if (this._historyIndex > 0) {
      this._historyIndex--;
      const data = JSON.parse(this._history[this._historyIndex]);
      this._restoreMap(data);
    }
  }

  redo() {
    if (this._historyIndex < this._history.length - 1) {
      this._historyIndex++;
      const data = JSON.parse(this._history[this._historyIndex]);
      this._restoreMap(data);
    }
  }

  _restoreMap(data) {
    const map = this.engine.tileMap;
    map.width = data.width;
    map.height = data.height;
    map.layers.ground = data.layers.ground;
    map.layers.detail = data.layers.detail;
    map.layers.overhead = data.layers.overhead;
  }

  /** Initialize undo with current state */
  initHistory() {
    this._history = [];
    this._historyIndex = -1;
    this._pushHistory();
  }

  update(dt) {
    if (!this.active) return;

    const { input, camera, renderer, tileMap } = this.engine;
    input.updateWorldMouse(camera, renderer);

    // Zoom with scroll wheel
    const wheel = input.getWheelDelta();
    if (wheel !== 0) {
      camera.adjustZoom(wheel);
    }

    // Pan with middle mouse or right mouse
    if (input.mousePressed(1) || input.mousePressed(2)) {
      this._isPanning = true;
      this._lastPanX = input.mouse.x;
      this._lastPanY = input.mouse.y;
    }
    if (this._isPanning && (input.mouseDown(1) || input.mouseDown(2))) {
      const dx = input.mouse.x - this._lastPanX;
      const dy = input.mouse.y - this._lastPanY;
      camera.pan(dx, dy);
      this._lastPanX = input.mouse.x;
      this._lastPanY = input.mouse.y;
    }
    if (input.mouseReleased(1) || input.mouseReleased(2)) {
      this._isPanning = false;
    }

    // Keyboard shortcuts
    if (input.keyPressed('KeyG')) this.showGrid = !this.showGrid;
    if (input.keyPressed('Digit1')) this.currentLayer = 'ground';
    if (input.keyPressed('Digit2')) this.currentLayer = 'detail';
    if (input.keyPressed('Digit3')) this.currentLayer = 'overhead';
    if (input.keyPressed('KeyB')) this.currentTool = 'paint';
    if (input.keyPressed('KeyE')) this.currentTool = 'erase';

    // Undo/redo
    if ((input.keyDown('ControlLeft') || input.keyDown('ControlRight') || input.keyDown('MetaLeft') || input.keyDown('MetaRight'))) {
      if (input.keyPressed('KeyZ')) {
        if (input.keyDown('ShiftLeft') || input.keyDown('ShiftRight')) {
          this.redo();
        } else {
          this.undo();
        }
      }
    }

    // Paint/erase with left mouse (only if not over UI)
    if (input.mouseDown(0) && !this._isPanning) {
      this._handlePaint();
    }
    if (input.mouseReleased(0) && this._currentAction) {
      this._pushHistory();
      this._currentAction = null;
    }

    // Keyboard-based camera movement for editor
    const panSpeed = 200 / camera.zoom;
    if (input.keyDown('ArrowLeft') || input.keyDown('KeyA')) camera.x -= panSpeed * dt;
    if (input.keyDown('ArrowRight') || input.keyDown('KeyD')) camera.x += panSpeed * dt;
    if (input.keyDown('ArrowUp') || input.keyDown('KeyW')) camera.y -= panSpeed * dt;
    if (input.keyDown('ArrowDown') || input.keyDown('KeyS')) camera.y += panSpeed * dt;
  }

  _handlePaint() {
    const { input, tileMap } = this.engine;
    const { col, row } = tileMap.worldToTile(input.mouse.worldX, input.mouse.worldY);

    if (col < 0 || col >= tileMap.width || row < 0 || row >= tileMap.height) return;

    if (!this._currentAction) {
      this._currentAction = true;
    }

    if (this.currentTool === 'paint') {
      tileMap.setTile(this.currentLayer, col, row, this.selectedTileId);
    } else if (this.currentTool === 'erase') {
      const eraseValue = this.currentLayer === 'ground' ? 0 : -1;
      tileMap.setTile(this.currentLayer, col, row, eraseValue);
    }
  }

  render(renderer, camera) {
    if (!this.active) return;
    const { tileMap, tileSet } = this.engine;

    // Draw all tile layers
    TileRenderer.drawBelow(renderer, camera, tileMap, tileSet);
    TileRenderer.drawAbove(renderer, camera, tileMap, tileSet);

    // Draw grid
    if (this.showGrid) {
      renderer.drawGrid(camera, tileMap.tileSize);
    }

    // Draw map border
    renderer.drawRect(0, 0, tileMap.pixelWidth, tileMap.pixelHeight, 'rgba(255,255,0,0.3)', false);

    // Highlight tile under cursor
    const { input } = this.engine;
    const { col, row } = tileMap.worldToTile(input.mouse.worldX, input.mouse.worldY);
    if (col >= 0 && col < tileMap.width && row >= 0 && row < tileMap.height) {
      const ts = tileMap.tileSize;
      renderer.drawRect(col * ts, row * ts, ts, ts, 'rgba(255,255,255,0.4)', false);
    }
  }

  /** Save map to JSON and trigger download */
  saveMap() {
    const data = {
      map: this.engine.tileMap.serialize(),
      entities: this.engine.world.serialize(),
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'map.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  /** Load map from JSON file */
  loadMap(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.map) {
          this._restoreMap(data.map);
          this.initHistory();
        }
      } catch (err) {
        console.error('Failed to load map:', err);
      }
    };
    reader.readAsText(file);
  }
}
