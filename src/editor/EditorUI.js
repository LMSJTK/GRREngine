import { getEntityTypesByCategory, ENTITY_CATEGORIES, getEntityType } from '../ecs/EntityTypes.js';
import { PropertyInspector } from './PropertyInspector.js';

/**
 * Editor UI - DOM-based panels for tools, tiles, entities, and properties.
 * Sits alongside the canvas; keeps the editor state in sync with UI.
 */
export class EditorUI {
  constructor(editor, engine) {
    this.editor = editor;
    this.engine = engine;
    this.propertyInspector = null;
    this._build();
    this._wireEditorCallbacks();
  }

  _build() {
    this.container = document.getElementById('editor-ui');
    if (!this.container) return;
    this.container.innerHTML = '';

    this._buildToolbar();
    this._buildTilePalette();
    this._buildEntityPalette();
    this._buildPropertyInspector();
    this._buildLayerSelector();
    this._buildMapControls();
    this._buildStatusBar();

    // Show tile palette by default, hide entity palette
    this._syncPaletteVisibility();
  }

  _wireEditorCallbacks() {
    // Sync tool button state when editor changes tool programmatically
    this.editor.onToolChange = (tool) => this._syncToolButtons(tool);

    // Show/hide property inspector when entity selection changes
    this.editor.entityPlacer.onSelectionChange = (entity) => {
      if (this.propertyInspector) {
        this.propertyInspector.inspect(entity);
      }
    };

    // Refresh entity palette when prefabs change
    this.editor.prefabManager.onChange = () => this._rebuildPrefabSection();

    // Refresh UI when sprites are imported
    this.editor.spriteImporter.onImport = () => {
      if (this.propertyInspector && this.editor.entityPlacer.selectedEntity) {
        this.propertyInspector.inspect(this.editor.entityPlacer.selectedEntity);
      }
    };
  }

  // ---- Toolbar ----

  _buildToolbar() {
    const toolbar = document.createElement('div');
    toolbar.className = 'editor-toolbar';
    toolbar.innerHTML = `
      <div class="toolbar-group">
        <button class="tool-btn active" data-tool="paint" title="Paint Tiles (B)">&#x1f58c;</button>
        <button class="tool-btn" data-tool="erase" title="Erase (E)">&#x2715;</button>
        <button class="tool-btn" data-tool="entity" title="Entities (N)">&#x263A;</button>
      </div>
      <div class="toolbar-group">
        <button class="tool-btn active" data-tool="grid" title="Toggle Grid (G)">&#x25A6;</button>
      </div>
      <div class="toolbar-group mode-group">
        <button class="mode-btn active" id="btn-edit-mode">Edit</button>
        <button class="mode-btn" id="btn-play-mode">Play</button>
      </div>
    `;

    toolbar.querySelectorAll('.tool-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tool = btn.dataset.tool;
        if (tool === 'grid') {
          this.editor.showGrid = !this.editor.showGrid;
          btn.classList.toggle('active', this.editor.showGrid);
        } else {
          this.editor.setTool(tool);
        }
      });
    });

    // Mode switch
    toolbar.querySelector('#btn-edit-mode').addEventListener('click', () => {
      this.engine.setMode('edit');
      toolbar.querySelector('#btn-edit-mode').classList.add('active');
      toolbar.querySelector('#btn-play-mode').classList.remove('active');
      this.container.classList.remove('play-mode');
    });
    toolbar.querySelector('#btn-play-mode').addEventListener('click', () => {
      this.engine.setMode('play');
      toolbar.querySelector('#btn-play-mode').classList.add('active');
      toolbar.querySelector('#btn-edit-mode').classList.remove('active');
      this.container.classList.add('play-mode');
    });

    this.toolbar = toolbar;
    this.container.appendChild(toolbar);
  }

  _syncToolButtons(tool) {
    if (!this.toolbar) return;
    this.toolbar.querySelectorAll('.tool-btn[data-tool="paint"],.tool-btn[data-tool="erase"],.tool-btn[data-tool="entity"]')
      .forEach((b) => b.classList.toggle('active', b.dataset.tool === tool));
    this._syncPaletteVisibility();
  }

  _syncPaletteVisibility() {
    const isEntityTool = this.editor.currentTool === 'entity';
    if (this.tilePalette) this.tilePalette.style.display = isEntityTool ? 'none' : '';
    if (this.layerPanel) this.layerPanel.style.display = isEntityTool ? 'none' : '';
    if (this.entityPalette) this.entityPalette.style.display = isEntityTool ? '' : 'none';
  }

  // ---- Tile Palette ----

  _buildTilePalette() {
    const palette = document.createElement('div');
    palette.className = 'tile-palette';

    const title = document.createElement('div');
    title.className = 'panel-title';
    title.textContent = 'Tiles';
    palette.appendChild(title);

    const grid = document.createElement('div');
    grid.className = 'palette-grid';

    const tiles = this.engine.tileSet.getAll();
    tiles.forEach((tileDef) => {
      const item = document.createElement('div');
      item.className = 'palette-item';
      if (tileDef.id === this.editor.selectedTileId) item.classList.add('selected');
      item.title = `${tileDef.name}${tileDef.solid ? ' (solid)' : ''}`;

      if (tileDef.image) {
        const preview = document.createElement('canvas');
        preview.width = 32;
        preview.height = 32;
        const pctx = preview.getContext('2d');
        pctx.imageSmoothingEnabled = false;
        pctx.drawImage(tileDef.image, 0, 0, 32, 32);
        item.appendChild(preview);
      }

      const label = document.createElement('span');
      label.className = 'palette-label';
      label.textContent = tileDef.name;
      item.appendChild(label);

      item.addEventListener('click', () => {
        grid.querySelectorAll('.palette-item').forEach((el) => el.classList.remove('selected'));
        item.classList.add('selected');
        this.editor.selectedTileId = tileDef.id;
        this.editor.setTool('paint');
      });

      grid.appendChild(item);
    });

    palette.appendChild(grid);
    this.tilePalette = palette;
    this.container.appendChild(palette);
  }

  // ---- Entity Palette ----

  _buildEntityPalette() {
    const palette = document.createElement('div');
    palette.className = 'entity-palette';
    palette.style.display = 'none';

    const title = document.createElement('div');
    title.className = 'panel-title';
    title.textContent = 'Entities';
    palette.appendChild(title);

    const typesByCategory = getEntityTypesByCategory();
    for (const [catKey, types] of Object.entries(typesByCategory)) {
      const cat = ENTITY_CATEGORIES[catKey];
      const catHeader = document.createElement('div');
      catHeader.className = 'entity-cat-header';
      catHeader.innerHTML = `<span class="entity-cat-dot" style="background:${cat.color}"></span>${cat.label}`;
      palette.appendChild(catHeader);

      const grid = document.createElement('div');
      grid.className = 'entity-grid';

      for (const typeDef of types) {
        const item = document.createElement('div');
        item.className = 'entity-item';
        if (typeDef.key === this.editor.entityPlacer.selectedType) {
          item.classList.add('selected');
        }
        item.title = typeDef.name;
        item.dataset.type = typeDef.key;

        // Preview
        const preview = document.createElement('div');
        preview.className = 'entity-preview';
        const spriteKey = typeDef.spriteKey;
        const sprite = spriteKey ? this.engine.assets.getImage(spriteKey) : null;
        if (sprite) {
          const canvas = document.createElement('canvas');
          canvas.width = 32;
          canvas.height = 32;
          const ctx = canvas.getContext('2d');
          ctx.imageSmoothingEnabled = false;
          const sw = Math.min(sprite.width, typeDef.width);
          const sh = Math.min(sprite.height, typeDef.height);
          ctx.drawImage(sprite, 0, 0, sw, sh, 0, 0, 32, 32);
          preview.appendChild(canvas);
        } else {
          preview.style.background = cat.color + '40';
          preview.style.border = `1px solid ${cat.color}`;
          preview.style.borderRadius = '4px';
          preview.textContent = typeDef.name[0];
          preview.style.display = 'flex';
          preview.style.alignItems = 'center';
          preview.style.justifyContent = 'center';
          preview.style.color = cat.color;
          preview.style.fontSize = '14px';
          preview.style.fontWeight = 'bold';
          preview.style.width = '32px';
          preview.style.height = '32px';
        }
        item.appendChild(preview);

        const label = document.createElement('span');
        label.className = 'palette-label';
        label.textContent = typeDef.name;
        item.appendChild(label);

        item.addEventListener('click', () => {
          palette.querySelectorAll('.entity-item').forEach((el) => el.classList.remove('selected'));
          item.classList.add('selected');
          this.editor.entityPlacer.selectedType = typeDef.key;
          this.editor.entityPlacer._pendingPrefabProps = null;
          this.editor.entityPlacer.deselect();
        });

        grid.appendChild(item);
      }
      palette.appendChild(grid);
    }

    // Prefab section
    this._prefabSection = document.createElement('div');
    this._prefabSection.className = 'prefab-section';
    palette.appendChild(this._prefabSection);
    this._rebuildPrefabSection();

    // Import sprite button
    const importBtn = document.createElement('button');
    importBtn.className = 'control-btn import-sprite-btn';
    importBtn.textContent = 'Import Sprite';
    importBtn.addEventListener('click', () => this.editor.spriteImporter.openImportDialog());
    palette.appendChild(importBtn);

    this.entityPalette = palette;
    this.container.appendChild(palette);
  }

  _rebuildPrefabSection() {
    if (!this._prefabSection) return;
    this._prefabSection.innerHTML = '';

    const prefabs = this.editor.prefabManager.prefabs;
    if (prefabs.length === 0) return;

    const title = document.createElement('div');
    title.className = 'panel-title';
    title.textContent = 'Prefabs';
    this._prefabSection.appendChild(title);

    const grid = document.createElement('div');
    grid.className = 'entity-grid';

    for (const prefab of prefabs) {
      const typeDef = getEntityType(prefab.type);
      const cat = ENTITY_CATEGORIES[typeDef?.category] || { color: '#888' };

      const item = document.createElement('div');
      item.className = 'entity-item prefab-item';
      item.title = `${prefab.name} (${typeDef?.name || prefab.type})`;

      const preview = document.createElement('div');
      preview.className = 'entity-preview';
      const spriteKey = prefab.properties.spriteVariant || typeDef?.spriteKey;
      const sprite = spriteKey ? this.engine.assets.getImage(spriteKey) : null;
      if (sprite) {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        const sw = Math.min(sprite.width, prefab.width || 16);
        const sh = Math.min(sprite.height, prefab.height || 16);
        ctx.drawImage(sprite, 0, 0, sw, sh, 0, 0, 32, 32);
        preview.appendChild(canvas);
      } else {
        preview.style.background = cat.color + '40';
        preview.textContent = 'P';
        preview.style.display = 'flex';
        preview.style.alignItems = 'center';
        preview.style.justifyContent = 'center';
        preview.style.color = cat.color;
        preview.style.width = '32px';
        preview.style.height = '32px';
      }
      item.appendChild(preview);

      const label = document.createElement('span');
      label.className = 'palette-label';
      label.textContent = prefab.name;
      item.appendChild(label);

      item.addEventListener('click', () => {
        this.editor.entityPlacer.selectedType = prefab.type;
        this.editor.entityPlacer._pendingPrefabProps = JSON.parse(JSON.stringify(prefab.properties));
        this.editor.entityPlacer.deselect();
        if (this.entityPalette) {
          this.entityPalette.querySelectorAll('.entity-item').forEach((el) => el.classList.remove('selected'));
        }
        item.classList.add('selected');
      });

      item.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        if (confirm(`Delete prefab "${prefab.name}"?`)) {
          this.editor.prefabManager.delete(prefab.id);
        }
      });

      grid.appendChild(item);
    }

    this._prefabSection.appendChild(grid);
  }

  // ---- Property Inspector ----

  _buildPropertyInspector() {
    this.propertyInspector = new PropertyInspector(this.container, this.engine);
    this.propertyInspector.onDelete = (entity) => {
      this.editor.entityPlacer.deleteSelected();
      this.editor._pushHistory();
    };
    this.propertyInspector.onSavePrefab = (entity) => {
      const name = prompt('Prefab name:', '');
      if (name !== null && name.trim()) {
        this.editor.prefabManager.saveFromEntity(entity, name.trim());
      }
    };
    this.propertyInspector.onChange = () => {};
  }

  // ---- Layer Selector ----

  _buildLayerSelector() {
    const panel = document.createElement('div');
    panel.className = 'layer-panel';

    const title = document.createElement('div');
    title.className = 'panel-title';
    title.textContent = 'Layers';
    panel.appendChild(title);

    const layers = [
      { key: 'ground', label: 'Ground (1)' },
      { key: 'detail', label: 'Detail (2)' },
      { key: 'overhead', label: 'Overhead (3)' },
    ];

    layers.forEach((layerDef) => {
      const btn = document.createElement('button');
      btn.className = 'layer-btn';
      if (layerDef.key === this.editor.currentLayer) btn.classList.add('active');
      btn.textContent = layerDef.label;
      btn.addEventListener('click', () => {
        this.editor.currentLayer = layerDef.key;
        panel.querySelectorAll('.layer-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
      });
      panel.appendChild(btn);
    });

    this.layerPanel = panel;
    this.container.appendChild(panel);
  }

  // ---- Map Controls ----

  _buildMapControls() {
    const panel = document.createElement('div');
    panel.className = 'map-controls';

    const title = document.createElement('div');
    title.className = 'panel-title';
    title.textContent = 'Map';
    panel.appendChild(title);

    const saveBtn = document.createElement('button');
    saveBtn.className = 'control-btn';
    saveBtn.textContent = 'Save Map';
    saveBtn.addEventListener('click', () => this.editor.saveMap());
    panel.appendChild(saveBtn);

    const loadBtn = document.createElement('button');
    loadBtn.className = 'control-btn';
    loadBtn.textContent = 'Load Map';
    loadBtn.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = (e) => {
        if (e.target.files[0]) this.editor.loadMap(e.target.files[0]);
      };
      input.click();
    });
    panel.appendChild(loadBtn);

    const sizeDiv = document.createElement('div');
    sizeDiv.className = 'map-size-controls';
    sizeDiv.innerHTML = `
      <label>W: <input type="number" id="map-width" value="${this.engine.tileMap.width}" min="10" max="200" /></label>
      <label>H: <input type="number" id="map-height" value="${this.engine.tileMap.height}" min="10" max="200" /></label>
      <button class="control-btn" id="resize-map">Resize</button>
    `;
    panel.appendChild(sizeDiv);

    sizeDiv.querySelector('#resize-map').addEventListener('click', () => {
      const w = parseInt(sizeDiv.querySelector('#map-width').value, 10);
      const h = parseInt(sizeDiv.querySelector('#map-height').value, 10);
      if (w >= 10 && h >= 10 && w <= 200 && h <= 200) {
        this.engine.tileMap.resize(w, h);
        this.editor._pushHistory();
      }
    });

    this.container.appendChild(panel);
  }

  // ---- Status Bar ----

  _buildStatusBar() {
    this.statusBar = document.createElement('div');
    this.statusBar.className = 'status-bar';
    this.container.appendChild(this.statusBar);
  }

  updateStatus() {
    if (!this.statusBar) return;
    const { input, gameLoop } = this.engine;
    const { col, row } = this.engine.tileMap.worldToTile(input.mouse.worldX, input.mouse.worldY);
    const entCount = this.editor.entityPlacer.entities.length;
    const sel = this.editor.entityPlacer.selectedEntity;

    let status = `Tile: ${col}, ${row} | Layer: ${this.editor.currentLayer} | Tool: ${this.editor.currentTool}`;
    if (this.editor.currentTool === 'entity') {
      status = `Tile: ${col}, ${row} | Entities: ${entCount}`;
      if (sel) status += ` | Selected: ${sel.type} #${sel.id}`;
    }
    status += ` | FPS: ${gameLoop.fps}`;
    this.statusBar.textContent = status;
  }

  setVisible(visible) {
    if (this.container) {
      this.container.classList.toggle('play-mode', !visible);
    }
  }
}
