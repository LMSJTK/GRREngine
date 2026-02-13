import { TileRenderer } from '../tiles/TileRenderer.js';
import { EntityPlacer } from './EntityPlacer.js';
import { PrefabManager } from './PrefabManager.js';
import { SpriteImporter } from './SpriteImporter.js';

/**
 * Map Editor - handles tile painting, erasing, entity placement, and selection.
 * The editor takes over input when in edit mode.
 */
export class Editor {
  constructor(engine) {
    this.engine = engine;
    this.active = true;

    // Tools: paint, erase, entity
    this.currentTool = 'paint';
    this.currentLayer = 'ground';
    this.selectedTileId = 0;
    this.showGrid = true;

    // Entity system
    this.entityPlacer = new EntityPlacer(engine);
    this.prefabManager = new PrefabManager();
    this.spriteImporter = new SpriteImporter(engine);

    // Panning state
    this._isPanning = false;
    this._lastPanX = 0;
    this._lastPanY = 0;

    // Undo history (stores both tiles + entities)
    this._history = [];
    this._historyIndex = -1;
    this._currentAction = null;
  }

  /** Push current state (tiles + entities) to undo history */
  _pushHistory() {
    const snapshot = JSON.stringify({
      map: this.engine.tileMap.serialize(),
      entities: this.entityPlacer.getSnapshot(),
    });
    this._history = this._history.slice(0, this._historyIndex + 1);
    this._history.push(snapshot);
    this._historyIndex = this._history.length - 1;
    if (this._history.length > 50) {
      this._history.shift();
      this._historyIndex--;
    }
  }

  undo() {
    if (this._historyIndex > 0) {
      this._historyIndex--;
      this._restoreSnapshot(this._history[this._historyIndex]);
    }
  }

  redo() {
    if (this._historyIndex < this._history.length - 1) {
      this._historyIndex++;
      this._restoreSnapshot(this._history[this._historyIndex]);
    }
  }

  _restoreSnapshot(snapshotStr) {
    const snapshot = JSON.parse(snapshotStr);
    this._restoreMap(snapshot.map);
    if (snapshot.entities) {
      this.entityPlacer.restoreSnapshot(snapshot.entities);
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

  initHistory() {
    this._history = [];
    this._historyIndex = -1;
    this._pushHistory();
  }

  update(dt) {
    if (!this.active) return;

    const { input, camera, renderer } = this.engine;
    input.updateWorldMouse(camera, renderer);

    // Zoom
    const wheel = input.getWheelDelta();
    if (wheel !== 0) camera.adjustZoom(wheel);

    // Pan with middle/right mouse
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
    if (input.keyPressed('KeyB')) this.setTool('paint');
    if (input.keyPressed('KeyE')) this.setTool('erase');
    if (input.keyPressed('KeyN')) this.setTool('entity');

    // Delete selected entity
    if (this.currentTool === 'entity') {
      if (input.keyPressed('Delete') || input.keyPressed('Backspace')) {
        if (this.entityPlacer.selectedEntity) {
          this.entityPlacer.deleteSelected();
          this._pushHistory();
        }
      }
    }

    // Undo/redo
    const ctrl = input.keyDown('ControlLeft') || input.keyDown('ControlRight') ||
      input.keyDown('MetaLeft') || input.keyDown('MetaRight');
    if (ctrl && input.keyPressed('KeyZ')) {
      if (input.keyDown('ShiftLeft') || input.keyDown('ShiftRight')) {
        this.redo();
      } else {
        this.undo();
      }
    }

    // Left mouse interactions
    if (!this._isPanning) {
      if (this.currentTool === 'paint' || this.currentTool === 'erase') {
        if (input.mouseDown(0)) this._handlePaint();
        if (input.mouseReleased(0) && this._currentAction) {
          this._pushHistory();
          this._currentAction = null;
        }
      } else if (this.currentTool === 'entity') {
        this._handleEntityInput();
      }
    }

    // Keyboard-based camera pan
    const panSpeed = 200 / camera.zoom;
    if (input.keyDown('ArrowLeft') || input.keyDown('KeyA')) camera.x -= panSpeed * dt;
    if (input.keyDown('ArrowRight') || input.keyDown('KeyD')) camera.x += panSpeed * dt;
    if (input.keyDown('ArrowUp') || input.keyDown('KeyW')) camera.y -= panSpeed * dt;
    if (input.keyDown('ArrowDown') || input.keyDown('KeyS')) camera.y += panSpeed * dt;

    // Update entity drag
    if (this.entityPlacer.isDragging) {
      this.entityPlacer.updateDrag(input.mouse.worldX, input.mouse.worldY);
    }
  }

  _handlePaint() {
    const { input, tileMap } = this.engine;
    const { col, row } = tileMap.worldToTile(input.mouse.worldX, input.mouse.worldY);
    if (col < 0 || col >= tileMap.width || row < 0 || row >= tileMap.height) return;

    if (!this._currentAction) this._currentAction = true;

    if (this.currentTool === 'paint') {
      tileMap.setTile(this.currentLayer, col, row, this.selectedTileId);
    } else if (this.currentTool === 'erase') {
      const eraseValue = this.currentLayer === 'ground' ? 0 : -1;
      tileMap.setTile(this.currentLayer, col, row, eraseValue);
    }
  }

  _handleEntityInput() {
    const { input } = this.engine;
    const wx = input.mouse.worldX;
    const wy = input.mouse.worldY;

    if (input.mousePressed(0)) {
      const result = this.entityPlacer.handleMouseDown(wx, wy);
      if (result === 'miss') {
        // Place new entity (use pending prefab props if available)
        const prefabProps = this.entityPlacer._pendingPrefabProps || null;
        const placed = this.entityPlacer.place(wx, wy, this.entityPlacer.selectedType, prefabProps);
        if (placed) {
          this.entityPlacer.select(placed);
          this._pushHistory();
        }
        // Clear pending prefab props after use
        this.entityPlacer._pendingPrefabProps = null;
      }
    }

    if (input.mouseReleased(0)) {
      const result = this.entityPlacer.handleMouseUp(wx, wy);
      if (result === 'moved') {
        this._pushHistory();
      }
    }
  }

  /** Set current tool and notify UI */
  setTool(tool) {
    this.currentTool = tool;
    if (tool !== 'entity') {
      this.entityPlacer.deselect();
    }
    if (this.onToolChange) this.onToolChange(tool);
  }

  /** Callback for UI synchronization */
  onToolChange = null;

  render(renderer, camera) {
    if (!this.active) return;
    const { tileMap, tileSet, assets } = this.engine;

    // Draw tile layers
    TileRenderer.drawBelow(renderer, camera, tileMap, tileSet);
    TileRenderer.drawAbove(renderer, camera, tileMap, tileSet);

    // Draw placed entities
    this.entityPlacer.render(renderer, camera, assets);

    // Draw grid
    if (this.showGrid) renderer.drawGrid(camera, tileMap.tileSize);

    // Draw map border
    renderer.drawRect(0, 0, tileMap.pixelWidth, tileMap.pixelHeight, 'rgba(255,255,0,0.3)', false);

    // Highlight tile under cursor (only in tile tools)
    if (this.currentTool === 'paint' || this.currentTool === 'erase') {
      const { input } = this.engine;
      const { col, row } = tileMap.worldToTile(input.mouse.worldX, input.mouse.worldY);
      if (col >= 0 && col < tileMap.width && row >= 0 && row < tileMap.height) {
        const ts = tileMap.tileSize;
        renderer.drawRect(col * ts, row * ts, ts, ts, 'rgba(255,255,255,0.4)', false);
      }
    }

    // Entity placement preview (ghost)
    if (this.currentTool === 'entity' && !this.entityPlacer.isDragging && !this.entityPlacer.selectedEntity) {
      const { input } = this.engine;
      const ts = tileMap.tileSize;
      const gx = Math.floor(input.mouse.worldX / ts) * ts;
      const gy = Math.floor(input.mouse.worldY / ts) * ts;
      renderer.drawRect(gx, gy, ts, ts, 'rgba(100,200,255,0.3)');
      renderer.drawRect(gx, gy, ts, ts, 'rgba(100,200,255,0.6)', false);
    }
  }

  /** Save map + entities to JSON download */
  saveMap() {
    const data = {
      map: this.engine.tileMap.serialize(),
      entities: this.entityPlacer.serialize(),
      prefabs: this.prefabManager.serialize(),
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

  /** Load map + entities from JSON file */
  loadMap(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.map) this._restoreMap(data.map);
        if (data.entities) this.entityPlacer.deserialize(data.entities);
        if (data.prefabs) this.prefabManager.deserialize(data.prefabs);
        this.initHistory();
      } catch (err) {
        console.error('Failed to load map:', err);
      }
    };
    reader.readAsText(file);
  }
}
