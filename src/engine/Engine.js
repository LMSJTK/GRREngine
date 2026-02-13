import { GameLoop } from './GameLoop.js';
import { Renderer } from './Renderer.js';
import { Input } from './Input.js';
import { AssetManager } from './AssetManager.js';
import { Camera } from './Camera.js';
import { TileSet } from '../tiles/TileSet.js';
import { TileMap } from '../tiles/TileMap.js';
import { TileRenderer } from '../tiles/TileRenderer.js';
import { World } from '../ecs/World.js';
import { Editor } from '../editor/Editor.js';
import { EditorUI } from '../editor/EditorUI.js';
import { Player } from '../game/Player.js';
import { registerPlaceholderTiles } from '../assets/defaults/PlaceholderTiles.js';
import { generatePlayerSpriteSheet, generateNPCSpriteSheet } from '../assets/defaults/PlaceholderSprites.js';

/**
 * GRREngine - main engine class that ties all systems together.
 * Manages game loop, rendering, input, assets, and mode switching.
 */
export class Engine {
  constructor(canvasId = 'game-canvas') {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) throw new Error(`Canvas #${canvasId} not found`);

    // Core systems
    this.renderer = new Renderer(this.canvas);
    this.input = new Input(this.canvas);
    this.assets = new AssetManager();
    this.camera = new Camera(0, 0);
    this.tileSet = new TileSet(16);
    this.tileMap = new TileMap(40, 30, 16);
    this.world = new World();

    // Mode: 'edit' or 'play'
    this.mode = 'edit';

    // Player (created on play mode entry)
    this.player = null;

    // Dialog state
    this.dialogText = null;
    this.dialogTimer = 0;

    // Editor
    this.editor = new Editor(this);
    this.editorUI = null;

    // Game loop
    this.gameLoop = new GameLoop({
      update: (dt) => this._update(dt),
      render: (alpha) => this._render(alpha),
    });
  }

  /** Initialize the engine - load assets and set up initial state */
  init() {
    // Generate and register placeholder tiles
    registerPlaceholderTiles(this.tileSet, this.assets, 16);
    this.tileMap.tileSet = this.tileSet;

    // Generate player sprite sheet
    const playerSheet = generatePlayerSpriteSheet(16, 16);
    this.assets.registerImage('player_sprite', playerSheet);

    // Generate NPC sprite sheet
    const npcSheet = generateNPCSpriteSheet('#c04040', '#f0d060', 16, 16);
    this.assets.registerImage('npc_sprite', npcSheet);

    // Fill default map with grass
    this.tileMap.fillRect('ground', 0, 0, this.tileMap.width, this.tileMap.height, 0);

    // Add some variety to the default map
    this._generateStarterMap();

    // Position camera at map center
    this.camera.x = this.tileMap.pixelWidth / 2;
    this.camera.y = this.tileMap.pixelHeight / 2;

    // Initialize editor
    this.editor.initHistory();
    this.editorUI = new EditorUI(this.editor, this);

    // Start the loop
    this.gameLoop.start();
  }

  /** Generate a simple starter map so it's not just flat grass */
  _generateStarterMap() {
    const map = this.tileMap;

    // Add a dirt path
    for (let x = 10; x < 30; x++) {
      map.setTile('ground', x, 15, 6); // path
      map.setTile('ground', x, 16, 6);
    }
    for (let y = 8; y < 22; y++) {
      map.setTile('ground', 20, y, 6);
      map.setTile('ground', 21, y, 6);
    }

    // Water pond
    for (let y = 5; y < 9; y++) {
      for (let x = 4; x < 9; x++) {
        map.setTile('ground', x, y, 1); // water
      }
    }

    // Some trees
    const treePositions = [
      [2, 2], [3, 10], [12, 3], [14, 4], [15, 3],
      [30, 5], [31, 7], [33, 4], [35, 10], [8, 22],
      [10, 24], [28, 22], [30, 20], [5, 18],
    ];
    for (const [x, y] of treePositions) {
      map.setTile('detail', x, y, 7); // tree
    }

    // Some flowers
    const flowerPositions = [
      [6, 12], [7, 13], [25, 8], [26, 9], [15, 20],
    ];
    for (const [x, y] of flowerPositions) {
      map.setTile('detail', x, y, 8); // flowers
    }

    // A small stone area
    for (let y = 12; y < 15; y++) {
      for (let x = 25; x < 30; x++) {
        map.setTile('ground', x, y, 3); // stone
      }
    }

    // A small building
    for (let y = 10; y < 13; y++) {
      for (let x = 32; x < 37; x++) {
        if (y === 10 || x === 32 || x === 36) {
          map.setTile('detail', x, y, 4); // wall
        } else {
          map.setTile('ground', x, y, 10); // wood floor
        }
      }
    }
    // Door opening
    map.setTile('detail', 34, 12, -1);
  }

  /** Switch between edit and play mode */
  setMode(mode) {
    this.mode = mode;

    if (mode === 'play') {
      // Create player at map center (or a nice starting spot)
      const playerSheet = this.assets.getImage('player_sprite');
      this.player = new Player(20 * 16, 17 * 16, playerSheet);
      this.world.add(this.player);

      // Camera follows player in play mode
      this.camera.follow(this.player, 0.15);
      this.camera.zoom = 3;
      this.camera.setBounds(0, 0, this.tileMap.pixelWidth, this.tileMap.pixelHeight);

      this.editor.active = false;
      if (this.editorUI) this.editorUI.setVisible(false);
    } else {
      // Return to edit mode
      this.camera.target = null;
      this.camera.clearBounds();
      this.editor.active = true;
      if (this.editorUI) this.editorUI.setVisible(true);

      // Remove player
      if (this.player) {
        this.world.remove(this.player);
        this.player = null;
      }
      this.dialogText = null;
      this.world.clear();
    }
  }

  _update(dt) {
    if (this.mode === 'edit') {
      this.editor.update(dt);
    } else if (this.mode === 'play') {
      this._updatePlay(dt);
    }

    this.camera.update(dt, this.renderer.width, this.renderer.height);
    this.input.updateWorldMouse(this.camera, this.renderer);
  }

  _updatePlay(dt) {
    if (this.player) {
      this.player.handleInput(this.input);
      this.player.moveWithCollision(dt, this.tileMap);
      this.player.update(dt);
    }

    this.world.update(dt);

    // Interact with NPCs
    if (this.input.keyPressed('Space') || this.input.keyPressed('KeyE')) {
      const npcs = this.world.getByType('npc');
      for (const npc of npcs) {
        if (npc.isPlayerNear(this.player)) {
          npc.faceToward(this.player);
          this.dialogText = npc.talk();
          this.dialogTimer = 3;
        }
      }
    }

    // Dialog timeout
    if (this.dialogTimer > 0) {
      this.dialogTimer -= dt;
      if (this.dialogTimer <= 0) {
        this.dialogText = null;
      }
    }

    // Return to editor with Escape
    if (this.input.keyPressed('Escape')) {
      this.setMode('edit');
      // Update UI buttons
      const editBtn = document.getElementById('btn-edit-mode');
      const playBtn = document.getElementById('btn-play-mode');
      if (editBtn) editBtn.classList.add('active');
      if (playBtn) playBtn.classList.remove('active');
    }
  }

  _render(alpha) {
    this.renderer.clear('#1a1a2e');

    this.renderer.applyCamera(this.camera);

    if (this.mode === 'edit') {
      this.editor.render(this.renderer, this.camera);
    } else if (this.mode === 'play') {
      // Draw layers below entities
      TileRenderer.drawBelow(this.renderer, this.camera, this.tileMap, this.tileSet);

      // Draw entities (player, NPCs, etc.)
      this.world.render(this.renderer);

      // Draw overhead layer
      TileRenderer.drawAbove(this.renderer, this.camera, this.tileMap, this.tileSet);
    }

    this.renderer.restoreCamera();

    // HUD / overlays (screen space)
    if (this.mode === 'play') {
      this._renderPlayHUD();
    }

    if (this.mode === 'edit' && this.editorUI) {
      this.editorUI.updateStatus();
    }

    this.input.endFrame();
  }

  _renderPlayHUD() {
    // FPS
    this.renderer.drawText(
      `FPS: ${this.gameLoop.fps}`,
      this.renderer.width - 10, 10,
      { color: 'rgba(255,255,255,0.5)', font: '12px monospace', align: 'right' }
    );

    // Dialog box
    if (this.dialogText) {
      const boxW = Math.min(400, this.renderer.width - 40);
      const boxH = 60;
      const boxX = (this.renderer.width - boxW) / 2;
      const boxY = this.renderer.height - boxH - 20;

      this.renderer.drawRect(boxX, boxY, boxW, boxH, 'rgba(0,0,0,0.85)');
      this.renderer.drawRect(boxX, boxY, boxW, boxH, '#6688aa', false);
      this.renderer.drawText(this.dialogText, boxX + 15, boxY + 15, {
        color: '#ffffff',
        font: '14px monospace',
      });
    }

    // Controls hint
    this.renderer.drawText(
      'WASD/Arrows: Move | Space: Interact | Esc: Editor',
      this.renderer.width / 2, this.renderer.height - 8,
      { color: 'rgba(255,255,255,0.3)', font: '11px monospace', align: 'center', baseline: 'bottom' }
    );
  }
}
