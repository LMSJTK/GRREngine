/**
 * Basic collision detection and resolution.
 * AABB-based with tilemap collision support.
 */
export class Collision {
  /** Check if two axis-aligned bounding boxes overlap */
  static aabb(a, b) {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  /** Get the overlap between two AABBs (returns null if no overlap) */
  static getOverlap(a, b) {
    const overlapX = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
    const overlapY = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);

    if (overlapX <= 0 || overlapY <= 0) return null;

    return { x: overlapX, y: overlapY };
  }

  /**
   * Check and resolve collision of an entity against a tilemap.
   * Moves the entity out of any solid tiles.
   * Uses separate X/Y resolution for smooth sliding along walls.
   */
  static resolveWithTilemap(entity, tileMap, dx, dy) {
    const tileSize = tileMap.tileSize;

    // Resolve X axis
    entity.x += dx;
    const colBox = entity.getCollisionBox ? entity.getCollisionBox() : entity;
    const startCol = Math.floor(colBox.x / tileSize);
    const endCol = Math.floor((colBox.x + colBox.width - 0.01) / tileSize);
    const startRow = Math.floor(colBox.y / tileSize);
    const endRow = Math.floor((colBox.y + colBox.height - 0.01) / tileSize);

    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        if (tileMap.isSolid(col, row)) {
          const tileBox = { x: col * tileSize, y: row * tileSize, width: tileSize, height: tileSize };
          if (Collision.aabb(colBox, tileBox)) {
            if (dx > 0) {
              entity.x = tileBox.x - colBox.width - (colBox.x - entity.x);
            } else if (dx < 0) {
              entity.x = tileBox.x + tileSize - (colBox.x - entity.x);
            }
          }
        }
      }
    }

    // Resolve Y axis
    entity.y += dy;
    const colBox2 = entity.getCollisionBox ? entity.getCollisionBox() : entity;
    const startCol2 = Math.floor(colBox2.x / tileSize);
    const endCol2 = Math.floor((colBox2.x + colBox2.width - 0.01) / tileSize);
    const startRow2 = Math.floor(colBox2.y / tileSize);
    const endRow2 = Math.floor((colBox2.y + colBox2.height - 0.01) / tileSize);

    for (let row = startRow2; row <= endRow2; row++) {
      for (let col = startCol2; col <= endCol2; col++) {
        if (tileMap.isSolid(col, row)) {
          const tileBox = { x: col * tileSize, y: row * tileSize, width: tileSize, height: tileSize };
          if (Collision.aabb(colBox2, tileBox)) {
            if (dy > 0) {
              entity.y = tileBox.y - colBox2.height - (colBox2.y - entity.y);
            } else if (dy < 0) {
              entity.y = tileBox.y + tileSize - (colBox2.y - entity.y);
            }
          }
        }
      }
    }
  }

  /** Check if a point is inside a rect */
  static pointInRect(px, py, rect) {
    return (
      px >= rect.x &&
      px <= rect.x + rect.width &&
      py >= rect.y &&
      py <= rect.y + rect.height
    );
  }
}
