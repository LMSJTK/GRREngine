# GRREngine

**Games, Resources, and Robots Engine** - A web-based 2D RPG game engine with an integrated visual editor.

Built with vanilla JavaScript (ES modules), rendered on HTML5 Canvas, bundled by Vite. No frameworks, no runtime dependencies.

## Quick Start

```bash
npm install
npm run dev      # development server with hot reload
npm run build    # production build to dist/
npm run preview  # preview production build
```

Open in browser, and you're in the **tile map editor**. Press **Play** to test your game.

## Architecture Overview

GRREngine is a dual-mode application: an **Editor** for building game worlds, and a **Play Mode** runtime that executes the game. Both share the same rendering pipeline and entity definitions.

```
src/
  engine/          Core runtime (loop, renderer, camera, input, assets)
  ecs/             Entity-Component-System (Entity, World, EntityTypes)
  game/            Game logic (Player, NPC, combat, scripting, HUD)
  physics/         Collision detection and resolution
  tiles/           Tile map, tile set, tile renderer
  sprites/         Sprite animation system
  editor/          Visual editor (tile painting, entity placement, scripting)
  assets/defaults/ Procedurally generated placeholder art
```

### Core Systems

| System | File | Purpose |
|--------|------|---------|
| **Game Loop** | `GameLoop.js` | Fixed 60 FPS timestep with variable render rate |
| **Renderer** | `Renderer.js` | Canvas 2D wrapper with camera transforms, pixel-perfect rendering |
| **Camera** | `Camera.js` | Smooth follow, zoom (0.5x-8x), world bounds, cutscene panning |
| **Input** | `Input.js` | Keyboard/mouse/touch with per-frame pressed/released tracking |
| **Asset Manager** | `AssetManager.js` | Image/audio/data loading, programmatic asset registration |

### Entity System

Entities are defined by **type schemas** in `EntityTypes.js`. Each type declares its properties, and the editor auto-generates UI for them.

| Entity Type | Category | Description |
|-------------|----------|-------------|
| **NPC** | Characters | Dialog, directional sprites, interaction scripts |
| **Enemy** | Characters | Health, damage, AI behavior, defeat scripts |
| **Item** | Objects | Pickup/consumable/key/equipment/quest types |
| **Trigger Zone** | Logic | Fires action scripts on enter/exit/interact |
| **Spawn Point** | Logic | Named player spawn locations |
| **Door** | Logic | Map transitions with target spawn |

Editor entity data is kept separate from runtime entities. When entering Play Mode, editor entities are **instantiated** into game entities with appropriate behaviors.

### Game Systems

**Combat** (`CombatSystem.js`):
- Player melee attack with directional hitbox
- Contact damage from enemies with knockback
- Invincibility frames with visual blink
- Enemy health bars and hit flash
- Floating damage/XP numbers
- Death and respawn flow

**Scripting** (`ActionRunner.js` + `ActionTypes.js`):
Sequential action executor supporting 19 action types across 6 categories:

| Category | Actions |
|----------|---------|
| Dialog | `show_dialog` |
| Logic | `set_flag`, `check_flag`, `set_variable`, `add_variable` |
| Game | `give_item`, `remove_item`, `check_item`, `teleport`, `remove_entity` |
| Combat | `heal_player`, `damage_player`, `set_max_hp`, `set_attack` |
| Flow | `wait` |
| Cutscene | `lock_input`, `camera_pan`, `camera_follow`, `screen_fade` |

Gate actions (`check_flag`, `check_item`) stop remaining actions if conditions aren't met - a simple alternative to branching.

**AI Behaviors** (`BehaviorSystem.js`):
- **Stationary**: Face player when nearby
- **Wander**: Random movement within radius
- **Patrol**: Back-and-forth along a distance
- **Chase**: Pursue player within detection radius

**Triggers** (`TriggerSystem.js`):
- Zone enter/exit/interact events
- Item auto-pickup with inventory
- Door teleportation
- Cooldown system to prevent rapid re-firing

**HUD** (`HUD.js`):
- Heart-based health display (half-heart granularity)
- Score and XP counter
- Inventory bar
- Word-wrapped dialog box
- Floating notification popups

**Screen Transitions** (`ScreenTransition.js`):
- Fade in/out overlays
- Fade-through (black → callback → reveal)
- Death screen with Game Over text and respawn prompt

### Editor

The editor provides a full visual level design workflow:

- **Tile Painting**: Paint/erase tiles across 3 layers (ground, detail, overhead)
- **Entity Placement**: Snap-to-grid placement with drag-to-move
- **Property Inspector**: Auto-generated forms from entity type schemas
- **Script Editor**: Visual action list builder with parameter inputs
- **Prefab System**: Save/load entity templates
- **Sprite Import**: Upload custom PNG sprite sheets
- **Undo/Redo**: 50-step history capturing tiles and entities
- **Camera**: Pan (middle/right drag), zoom (scroll wheel)

### Tile System

- 3 layers: **ground** (base terrain), **detail** (decorations), **overhead** (rendered above player)
- 16x16 pixel tiles with solid flag for collision
- Viewport-culled rendering for performance
- Configurable map dimensions

### Physics

- AABB collision detection
- Tilemap collision with separate X/Y axis resolution (smooth wall sliding)
- Custom collision boxes per entity

## Play Mode Controls

| Key | Action |
|-----|--------|
| WASD / Arrow Keys | Move |
| J | Attack |
| Space / E | Interact with NPCs and triggers |
| Escape | Return to editor |

## Editor Controls

| Input | Action |
|-------|--------|
| Left Click | Paint tile / Place entity / Select entity |
| Right Click / Middle Drag | Pan camera |
| Scroll Wheel | Zoom in/out |
| Delete / Backspace | Delete selected entity |
| Ctrl+Z | Undo |
| Ctrl+Shift+Z | Redo |
| N | Switch to entity tool |

## Technical Details

- **Rendering**: All drawing is done via Canvas 2D API with `imageSmoothingEnabled = false` for crisp pixel art
- **Art**: All sprites and tiles are procedurally generated at startup - no external image files needed
- **Collision**: Separate X then Y axis resolution enables smooth sliding along walls and around corners
- **Entity IDs**: Auto-incrementing integers, unique per session
- **Serialization**: Map and entity data serializable to JSON for save/load

## Development Phases

### Completed

**Phase 1 - Entity System & Editor Placement**
- Entity type registry with property schemas
- Procedural placeholder sprites for all entity types
- Entity placement, selection, drag-to-move in editor
- Auto-generated property inspector
- Sprite import and prefab system

**Phase 2 - Event System & Scripting**
- Game state manager (flags, variables, inventory)
- 14 action types across 5 categories
- Sequential action runner with async support
- Trigger zone system with enter/exit/interact events
- Enemy AI behavior system (4 behaviors)
- Visual script editor in the property inspector

**Phase 3 - Combat, HUD & Screen Transitions**
- Melee combat with directional attacks
- Enemy damage, knockback, health bars, hit flash
- Contact damage with invincibility frames
- Heart-based HUD with score, inventory, notifications
- Death screen with respawn flow
- Screen fade transitions
- 5 new combat/cutscene action types

### Planned

**Phase 4 - Map Management & Persistence**
- Multi-map support with door transitions between maps
- Save/load maps to JSON files (export/import)
- Save/load game state (localStorage)
- Map list manager in editor
- Map metadata (name, dimensions, tileset)

**Phase 5 - Audio & Polish**
- Sound effect system (attack, damage, pickup, UI)
- Background music with per-map tracks
- Audio manager with volume control
- Screen shake on damage/impact
- Particle effects (hit sparks, item pickup sparkle, dust)
- Animated tiles (water, torches)

**Phase 6 - Advanced Gameplay**
- Dialog choice system (branching conversations)
- Quest/objective tracker
- Equipment system (sword, shield, armor slots)
- Stat scaling (level-up from XP)
- Shop system (buy/sell with NPCs)
- Ranged attacks / projectiles

**Phase 7 - Editor Enhancements**
- Multi-select and bulk entity operations
- Copy/paste regions
- Keyboard shortcut customization
- Tileset management (multiple tilesets per map)
- Collision layer visualization
- Animated tile editor
- Map preview thumbnails

## Project Structure

```
GRREngine/
  index.html              Entry point
  package.json            Project config
  vite.config.js          Vite build config
  styles/
    editor.css            Editor and HUD styling
  src/
    main.js               Bootstrap - creates Engine, exposes window.grr
    engine/
      Engine.js           Master orchestrator, mode switching, game loop wiring
      GameLoop.js          Fixed-timestep loop with RAF
      Renderer.js          Canvas 2D drawing primitives
      Camera.js            Follow, zoom, bounds, pan
      Input.js             Keyboard/mouse/touch state tracking
      AssetManager.js      Image/audio/data loading
    ecs/
      Entity.js            Base entity (position, velocity, components, tags)
      World.js             Entity collection with queries and y-sort render
      EntityTypes.js       Type registry with property schemas
    game/
      Player.js            4-dir movement, animation, collision
      NPC.js               Dialog, interaction, facing
      GameState.js         Flags, variables, inventory
      ActionRunner.js      Sequential script executor
      ActionTypes.js       19 action type definitions
      TriggerSystem.js     Zone/door/item detection
      BehaviorSystem.js    Enemy AI (wander/patrol/chase/stationary)
      CombatSystem.js      Attacks, damage, knockback, invincibility
      HUD.js               Hearts, score, inventory, dialog, notifications
      ScreenTransition.js  Fade overlays, death screen
    physics/
      Collision.js         AABB overlap, tilemap resolution
    tiles/
      TileMap.js           3-layer tile grid
      TileSet.js           Tile type registry
      TileRenderer.js      Viewport-culled tile drawing
    sprites/
      Sprite.js            Frame-based directional animation
    editor/
      Editor.js            Tile/entity tools, undo/redo, rendering
      EditorUI.js          Sidebar panels, palette, toolbar
      EntityPlacer.js      Entity placement and selection
      PropertyInspector.js Auto-generated property forms
      ScriptEditor.js      Visual action list editor
      PrefabManager.js     Entity template save/load
      SpriteImporter.js    Custom sprite upload
    assets/defaults/
      PlaceholderTiles.js  Procedural tile generation
      PlaceholderSprites.js Procedural player/NPC sprites
      EntitySprites.js     Procedural entity sprites
```

## Console Access

The engine instance is exposed as `window.grr` for debugging:

```js
grr.gameState.setVar('hp', 99)     // set player HP
grr.gameState.setFlag('boss_dead')  // set a flag
grr.camera.zoom = 5                 // change zoom
grr.setMode('play')                 // enter play mode
```
