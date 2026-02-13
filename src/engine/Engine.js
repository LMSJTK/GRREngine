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
import { NPC } from '../game/NPC.js';
import { registerPlaceholderTiles } from '../assets/defaults/PlaceholderTiles.js';
import { generatePlayerSpriteSheet, generateNPCSpriteSheet } from '../assets/defaults/PlaceholderSprites.js';
import { registerEntitySprites } from '../assets/defaults/EntitySprites.js';
import { getEntityType } from '../ecs/EntityTypes.js';
import { Entity } from '../ecs/Entity.js';

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

    // Generate NPC sprite variants
    const npcSheet1 = generateNPCSpriteSheet('#c04040', '#f0d060', 16, 16);
    this.assets.registerImage('npc_sprite_1', npcSheet1);
    const npcSheet2 = generateNPCSpriteSheet('#40a040', '#403020', 16, 16);
    this.assets.registerImage('npc_sprite_2', npcSheet2);
    const npcSheet3 = generateNPCSpriteSheet('#9040b0', '#c03030', 16, 16);
    this.assets.registerImage('npc_sprite_3', npcSheet3);

    // Generate entity sprites (enemies, items, doors)
    registerEntitySprites(this.assets);

    // Fill default map with grass
    this.tileMap.fillRect('ground', 0, 0, this.tileMap.width, this.tileMap.height, 0);

    // Add some variety to the default map
    this._generateStarterMap();

    // Add some starter entities
    this._generateStarterEntities();

    // Position camera at map center
    this.camera.x = this.tileMap.pixelWidth / 2;
    this.camera.y = this.tileMap.pixelHeight / 2;

    // Initialize editor
    this.editor.initHistory();
    this.editorUI = new EditorUI(this.editor, this);

    // Start the loop
    this.gameLoop.start();
  }

  _generateStarterMap() {
    const map = this.tileMap;

    // Dirt path
    for (let x = 10; x < 30; x++) {
      map.setTile('ground', x, 15, 6);
      map.setTile('ground', x, 16, 6);
    }
    for (let y = 8; y < 22; y++) {
      map.setTile('ground', 20, y, 6);
      map.setTile('ground', 21, y, 6);
    }

    // Water pond
    for (let y = 5; y < 9; y++) {
      for (let x = 4; x < 9; x++) {
        map.setTile('ground', x, y, 1);
      }
    }

    // Trees
    const treePositions = [
      [2, 2], [3, 10], [12, 3], [14, 4], [15, 3],
      [30, 5], [31, 7], [33, 4], [35, 10], [8, 22],
      [10, 24], [28, 22], [30, 20], [5, 18],
    ];
    for (const [x, y] of treePositions) {
      map.setTile('detail', x, y, 7);
    }

    // Flowers
    const flowerPositions = [
      [6, 12], [7, 13], [25, 8], [26, 9], [15, 20],
    ];
    for (const [x, y] of flowerPositions) {
      map.setTile('detail', x, y, 8);
    }

    // Stone area
    for (let y = 12; y < 15; y++) {
      for (let x = 25; x < 30; x++) {
        map.setTile('ground', x, y, 3);
      }
    }

    // Small building
    for (let y = 10; y < 13; y++) {
      for (let x = 32; x < 37; x++) {
        if (y === 10 || x === 32 || x === 36) {
          map.setTile('detail', x, y, 4);
        } else {
          map.setTile('ground', x, y, 10);
        }
      }
    }
    map.setTile('detail', 34, 12, -1);
  }

  /** Place some starter entities to demonstrate the system */
  _generateStarterEntities() {
    const placer = this.editor.entityPlacer;

    // Spawn point
    placer.place(20 * 16, 17 * 16, 'spawn', { spawnId: 'default' });

    // An NPC near the path
    placer.place(18 * 16, 14 * 16, 'npc', {
      npcName: 'Old Man',
      dialog: ['Welcome to GRREngine!', 'Try placing some entities.', 'Press N to switch to entity mode.'],
      direction: 'down',
      spriteVariant: 'npc_sprite_1',
    });

    // Another NPC by the building
    placer.place(34 * 16, 11 * 16, 'npc', {
      npcName: 'Shopkeeper',
      dialog: ['This is my shop!', 'Nothing to sell yet...', 'Come back later!'],
      direction: 'left',
      spriteVariant: 'npc_sprite_2',
    });

    // An enemy slime
    placer.place(26 * 16, 20 * 16, 'enemy', {
      enemyName: 'Green Slime',
      health: 3,
      damage: 1,
      behavior: 'wander',
      direction: 'down',
      spriteVariant: 'enemy_slime',
    });

    // A coin item
    placer.place(22 * 16, 15 * 16, 'item', {
      itemName: 'Gold Coin',
      itemType: 'pickup',
      value: 10,
      spriteVariant: 'item_coin',
    });
  }

  /** Switch between edit and play mode */
  setMode(mode) {
    this.mode = mode;

    if (mode === 'play') {
      this.world.clear();

      // Find spawn point or use a default position
      const spawnEntity = this.editor.entityPlacer.entities.find((e) => e.type === 'spawn');
      const spawnX = spawnEntity ? spawnEntity.x : 20 * 16;
      const spawnY = spawnEntity ? spawnEntity.y : 17 * 16;

      // Create player at spawn point
      const playerSheet = this.assets.getImage('player_sprite');
      this.player = new Player(spawnX, spawnY, playerSheet);
      this.world.add(this.player);

      // Instantiate placed entities as game entities
      this._instantiateEntities();

      // Camera follows player
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

      if (this.player) {
        this.world.remove(this.player);
        this.player = null;
      }
      this.dialogText = null;
      this.world.clear();
    }
  }

  /** Convert editor entity data into runtime game entities */
  _instantiateEntities() {
    for (const editorEntity of this.editor.entityPlacer.entities) {
      const typeDef = getEntityType(editorEntity.type);
      if (!typeDef) continue;

      switch (editorEntity.type) {
        case 'npc': {
          const spriteKey = editorEntity.properties.spriteVariant || 'npc_sprite_1';
          const spriteSheet = this.assets.getImage(spriteKey);
          if (spriteSheet) {
            const npc = new NPC(editorEntity.x, editorEntity.y, spriteSheet, {
              name: editorEntity.properties.npcName || 'NPC',
              dialog: editorEntity.properties.dialog || ['...'],
            });
            npc.direction = editorEntity.properties.direction || 'down';
            npc.sprite.play(`idle_${npc.direction}`);
            this.world.add(npc);
          }
          break;
        }
        // Other entity types will be handled as we add their game-side classes.
        // For now, enemies/items are rendered but not interactive beyond NPCs.
        case 'enemy': {
          const spriteKey = editorEntity.properties.spriteVariant || 'enemy_slime';
          const sprite = this.assets.getImage(spriteKey);
          if (sprite) {
            // Create a basic entity with a sprite render
            const enemy = new Entity(editorEntity.x, editorEntity.y, 16, 16);
            enemy.type = 'enemy';
            enemy._sprite = sprite;
            enemy._direction = editorEntity.properties.direction || 'down';
            enemy.render = (renderer) => {
              const dirMap = { down: 0, left: 1, right: 2, up: 3 };
              const row = dirMap[enemy._direction] || 0;
              renderer.drawImageRegion(
                enemy._sprite,
                0, row * 16, 16, 16,
                enemy.x, enemy.y, 16, 16
              );
            };
            this.world.add(enemy);
          }
          break;
        }
        case 'item': {
          const spriteKey = editorEntity.properties.spriteVariant || 'item_coin';
          const sprite = this.assets.getImage(spriteKey);
          if (sprite) {
            const item = new Entity(editorEntity.x, editorEntity.y, 16, 16);
            item.type = 'item';
            item._sprite = sprite;
            item.render = (renderer) => {
              renderer.drawImage(item._sprite, item.x, item.y, 16, 16);
            };
            this.world.add(item);
          }
          break;
        }
        // spawn, trigger, door — handled at mode switch or when systems exist
      }
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
      TileRenderer.drawBelow(this.renderer, this.camera, this.tileMap, this.tileSet);
      this.world.render(this.renderer);
      TileRenderer.drawAbove(this.renderer, this.camera, this.tileMap, this.tileSet);
    }

    this.renderer.restoreCamera();

    if (this.mode === 'play') {
      this._renderPlayHUD();
    }

    if (this.mode === 'edit' && this.editorUI) {
      this.editorUI.updateStatus();
    }

    this.input.endFrame();
  }

  _renderPlayHUD() {
    this.renderer.drawText(
      `FPS: ${this.gameLoop.fps}`,
      this.renderer.width - 10, 10,
      { color: 'rgba(255,255,255,0.5)', font: '12px monospace', align: 'right' }
    );

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

    this.renderer.drawText(
      'WASD/Arrows: Move | Space: Interact | Esc: Editor',
      this.renderer.width / 2, this.renderer.height - 8,
      { color: 'rgba(255,255,255,0.3)', font: '11px monospace', align: 'center', baseline: 'bottom' }
    );
  }
}

