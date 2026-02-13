/**
 * Editor UI - DOM-based panels for tile palette, tools, and map controls.
 * Sits alongside the canvas; keeps the editor state in sync with UI.
 */
export class EditorUI {
  constructor(editor, engine) {
    this.editor = editor;
    this.engine = engine;
    this._build();
  }

  _build() {
    // Main container
    this.container = document.getElementById('editor-ui');
    if (!this.container) return;

    this.container.innerHTML = '';

    // Toolbar
    this._buildToolbar();

    // Tile palette
    this._buildPalette();

    // Layer selector
    this._buildLayerSelector();

    // Map controls
    this._buildMapControls();

    // Status bar
    this._buildStatusBar();
  }

  _buildToolbar() {
    const toolbar = document.createElement('div');
    toolbar.className = 'editor-toolbar';
    toolbar.innerHTML = `
      <div class="toolbar-group">
        <button class="tool-btn active" data-tool="paint" title="Paint (B)">🖌</button>
        <button class="tool-btn" data-tool="erase" title="Erase (E)">✕</button>
      </div>
      <div class="toolbar-group">
        <button class="tool-btn" data-tool="grid" title="Toggle Grid (G)">▦</button>
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
          this.editor.currentTool = tool;
          toolbar.querySelectorAll('.tool-btn[data-tool="paint"],.tool-btn[data-tool="erase"]')
            .forEach((b) => b.classList.toggle('active', b.dataset.tool === tool));
        }
      });
    });

    // Mode switch
    const editBtn = toolbar.querySelector('#btn-edit-mode');
    const playBtn = toolbar.querySelector('#btn-play-mode');
    editBtn.addEventListener('click', () => {
      this.engine.setMode('edit');
      editBtn.classList.add('active');
      playBtn.classList.remove('active');
      this.container.classList.remove('hidden');
    });
    playBtn.addEventListener('click', () => {
      this.engine.setMode('play');
      playBtn.classList.add('active');
      editBtn.classList.remove('active');
      this.container.classList.add('play-mode');
    });

    this.toolbar = toolbar;
    this.container.appendChild(toolbar);
  }

  _buildPalette() {
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
      if (tileDef.id === this.editor.selectedTileId) {
        item.classList.add('selected');
      }
      item.title = `${tileDef.name}${tileDef.solid ? ' (solid)' : ''}`;

      // Draw tile preview
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
        this.editor.currentTool = 'paint';
        this._updateToolButtons();
      });

      grid.appendChild(item);
    });

    palette.appendChild(grid);
    this.paletteGrid = grid;
    this.container.appendChild(palette);
  }

  _updateToolButtons() {
    if (this.toolbar) {
      this.toolbar.querySelectorAll('.tool-btn[data-tool="paint"],.tool-btn[data-tool="erase"]')
        .forEach((b) => b.classList.toggle('active', b.dataset.tool === this.editor.currentTool));
    }
  }

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

  _buildMapControls() {
    const panel = document.createElement('div');
    panel.className = 'map-controls';

    const title = document.createElement('div');
    title.className = 'panel-title';
    title.textContent = 'Map';
    panel.appendChild(title);

    // Save button
    const saveBtn = document.createElement('button');
    saveBtn.className = 'control-btn';
    saveBtn.textContent = 'Save Map';
    saveBtn.addEventListener('click', () => this.editor.saveMap());
    panel.appendChild(saveBtn);

    // Load button
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

    // Map size controls
    const sizeDiv = document.createElement('div');
    sizeDiv.className = 'map-size-controls';
    sizeDiv.innerHTML = `
      <label>W: <input type="number" id="map-width" value="${this.engine.tileMap.width}" min="10" max="200" /></label>
      <label>H: <input type="number" id="map-height" value="${this.engine.tileMap.height}" min="10" max="200" /></label>
      <button class="control-btn" id="resize-map">Resize</button>
    `;
    panel.appendChild(sizeDiv);

    // Wire up resize
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

  _buildStatusBar() {
    this.statusBar = document.createElement('div');
    this.statusBar.className = 'status-bar';
    this.container.appendChild(this.statusBar);
  }

  /** Update status bar each frame */
  updateStatus() {
    if (!this.statusBar) return;
    const { input, gameLoop } = this.engine;
    const { col, row } = this.engine.tileMap.worldToTile(input.mouse.worldX, input.mouse.worldY);
    this.statusBar.textContent =
      `Tile: ${col}, ${row} | Layer: ${this.editor.currentLayer} | ` +
      `Tool: ${this.editor.currentTool} | FPS: ${gameLoop.fps}`;
  }

  /** Show/hide the sidebar when switching modes */
  setVisible(visible) {
    if (this.container) {
      this.container.classList.toggle('play-mode', !visible);
    }
  }
}
