import { getEntityType, createDefaultProps, ENTITY_CATEGORIES } from '../ecs/EntityTypes.js';

/**
 * Manages entity placement, selection, movement, and deletion in the editor.
 * Maintains the "source of truth" list of placed entities (separate from the
 * game World, which is only used at runtime in play mode).
 */

let nextPlacedId = 1;

export class EntityPlacer {
  constructor(engine) {
    this.engine = engine;

    /** Placed entities — the editor's level data */
    this.entities = [];

    /** Currently selected entity (or null) */
    this.selectedEntity = null;

    /** Currently selected type for placement */
    this.selectedType = 'npc';

    // Drag state
    this._dragging = false;
    this._dragOffsetX = 0;
    this._dragOffsetY = 0;
    this._didDrag = false;

    // Callback for when selection changes (UI hooks into this)
    this.onSelectionChange = null;
  }

  /** Place a new entity at world coordinates, snapped to grid */
  place(worldX, worldY, typeKey, propsOverride = null) {
    const typeDef = getEntityType(typeKey);
    if (!typeDef) return null;

    const ts = this.engine.tileMap.tileSize;
    const snappedX = Math.floor(worldX / ts) * ts;
    const snappedY = Math.floor(worldY / ts) * ts;

    const entity = {
      id: nextPlacedId++,
      type: typeKey,
      x: snappedX,
      y: snappedY,
      width: typeDef.width,
      height: typeDef.height,
      properties: propsOverride || createDefaultProps(typeKey),
    };

    this.entities.push(entity);
    return entity;
  }

  /** Select entity at world position */
  selectAt(worldX, worldY) {
    // Search in reverse (topmost first)
    for (let i = this.entities.length - 1; i >= 0; i--) {
      const e = this.entities[i];
      if (
        worldX >= e.x && worldX < e.x + e.width &&
        worldY >= e.y && worldY < e.y + e.height
      ) {
        this.select(e);
        return e;
      }
    }
    this.deselect();
    return null;
  }

  select(entity) {
    this.selectedEntity = entity;
    if (this.onSelectionChange) this.onSelectionChange(entity);
  }

  deselect() {
    this.selectedEntity = null;
    if (this.onSelectionChange) this.onSelectionChange(null);
  }

  /** Delete the currently selected entity */
  deleteSelected() {
    if (!this.selectedEntity) return;
    const idx = this.entities.indexOf(this.selectedEntity);
    if (idx !== -1) this.entities.splice(idx, 1);
    this.deselect();
  }

  /** Delete entity by id */
  deleteById(id) {
    const idx = this.entities.findIndex((e) => e.id === id);
    if (idx !== -1) {
      if (this.selectedEntity && this.selectedEntity.id === id) {
        this.deselect();
      }
      this.entities.splice(idx, 1);
    }
  }

  /** Start dragging the selected entity */
  startDrag(worldX, worldY) {
    if (!this.selectedEntity) return;
    this._dragging = true;
    this._didDrag = false;
    this._dragOffsetX = worldX - this.selectedEntity.x;
    this._dragOffsetY = worldY - this.selectedEntity.y;
  }

  /** Update drag position */
  updateDrag(worldX, worldY) {
    if (!this._dragging || !this.selectedEntity) return;

    const ts = this.engine.tileMap.tileSize;
    const rawX = worldX - this._dragOffsetX;
    const rawY = worldY - this._dragOffsetY;
    const newX = Math.floor(rawX / ts) * ts;
    const newY = Math.floor(rawY / ts) * ts;

    if (newX !== this.selectedEntity.x || newY !== this.selectedEntity.y) {
      this._didDrag = true;
    }

    this.selectedEntity.x = newX;
    this.selectedEntity.y = newY;
  }

  /** End dragging */
  endDrag() {
    const didMove = this._didDrag;
    this._dragging = false;
    this._didDrag = false;
    return didMove;
  }

  get isDragging() {
    return this._dragging;
  }

  /** Handle mouse down in entity mode */
  handleMouseDown(worldX, worldY) {
    // Check if clicking on an existing entity
    const hit = this.selectAt(worldX, worldY);
    if (hit) {
      this.startDrag(worldX, worldY);
      return 'select';
    }
    return 'miss';
  }

  /** Handle mouse up in entity mode */
  handleMouseUp(worldX, worldY) {
    if (this._dragging) {
      return this.endDrag() ? 'moved' : 'clicked';
    }
    return 'none';
  }

  /** Render all placed entities in the editor */
  render(renderer, camera, assets) {
    for (const entity of this.entities) {
      const typeDef = getEntityType(entity.type);
      if (!typeDef) continue;

      const catColor = ENTITY_CATEGORIES[typeDef.category]?.color || '#888';

      // Get sprite image
      const spriteKey = entity.properties.spriteVariant || typeDef.spriteKey;
      const sprite = spriteKey ? assets.getImage(spriteKey) : null;

      if (sprite) {
        // For sprite sheets (characters/enemies), draw just the first frame
        const isSpriteSheet = sprite.width > entity.width;
        if (isSpriteSheet) {
          // Draw first frame (col 0, row 0 or direction row)
          const dirMap = { down: 0, left: 1, right: 2, up: 3 };
          const dir = entity.properties.direction || 'down';
          const row = dirMap[dir] || 0;
          renderer.drawImageRegion(
            sprite,
            0, row * entity.height, entity.width, entity.height,
            entity.x, entity.y, entity.width, entity.height
          );
        } else {
          renderer.drawImage(sprite, entity.x, entity.y, entity.width, entity.height);
        }
      } else {
        // No sprite — draw a colored shape
        const alpha = entity.type === 'trigger' ? '40' : '80';
        renderer.drawRect(entity.x, entity.y, entity.width, entity.height, catColor + alpha);
      }

      // Draw type indicator label
      const label = entity.properties.npcName || entity.properties.enemyName ||
        entity.properties.itemName || entity.properties.doorName ||
        entity.properties.triggerName || entity.properties.spawnId || typeDef.name;
      renderer.drawText(label, entity.x + entity.width / 2, entity.y - 2, {
        color: catColor,
        font: `${Math.max(4, Math.min(8, 8 / camera.zoom * 3))}px monospace`,
        align: 'center',
        baseline: 'bottom',
      });

      // Category dot
      renderer.drawRect(entity.x - 1, entity.y - 1, 3, 3, catColor);

      // Selection highlight
      if (this.selectedEntity && this.selectedEntity.id === entity.id) {
        renderer.ctx.strokeStyle = '#ffff00';
        renderer.ctx.lineWidth = 1 / camera.zoom;
        renderer.ctx.setLineDash([3 / camera.zoom, 3 / camera.zoom]);
        renderer.ctx.strokeRect(
          entity.x - 1, entity.y - 1,
          entity.width + 2, entity.height + 2
        );
        renderer.ctx.setLineDash([]);
      }

      // Spawn point marker
      if (entity.type === 'spawn') {
        renderer.ctx.strokeStyle = '#ff44ff';
        renderer.ctx.lineWidth = 1 / camera.zoom;
        const cx = entity.x + entity.width / 2;
        const cy = entity.y + entity.height / 2;
        renderer.ctx.beginPath();
        renderer.ctx.moveTo(cx - 4, cy);
        renderer.ctx.lineTo(cx + 4, cy);
        renderer.ctx.moveTo(cx, cy - 4);
        renderer.ctx.lineTo(cx, cy + 4);
        renderer.ctx.stroke();
      }
    }
  }

  /** Serialize all placed entities */
  serialize() {
    return this.entities.map((e) => ({
      type: e.type,
      x: e.x,
      y: e.y,
      width: e.width,
      height: e.height,
      properties: { ...e.properties },
    }));
  }

  /** Load entities from serialized data */
  deserialize(data) {
    this.entities = [];
    this.deselect();
    if (!Array.isArray(data)) return;

    for (const entry of data) {
      const entity = {
        id: nextPlacedId++,
        type: entry.type,
        x: entry.x,
        y: entry.y,
        width: entry.width,
        height: entry.height,
        properties: { ...entry.properties },
      };
      this.entities.push(entity);
    }
  }

  /** Get a snapshot for undo/redo */
  getSnapshot() {
    return JSON.stringify(this.serialize());
  }

  /** Restore from a snapshot */
  restoreSnapshot(snapshot) {
    const data = JSON.parse(snapshot);
    this.deserialize(data);
  }

  /** Clear all entities */
  clear() {
    this.entities = [];
    this.deselect();
  }
}
