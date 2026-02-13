/**
 * TileSet defines tile types and their properties.
 * Each tile has an id, name, image, and properties like solidity.
 */
export class TileSet {
  constructor(tileSize = 16) {
    this.tileSize = tileSize;
    this.tiles = new Map(); // id -> tile definition
  }

  /** Register a tile type */
  define(id, { name, image, solid = false, animated = false, frames = 1, frameRate = 4 }) {
    this.tiles.set(id, { id, name, image, solid, animated, frames, frameRate });
  }

  get(id) {
    return this.tiles.get(id);
  }

  isSolid(id) {
    const tile = this.tiles.get(id);
    return tile ? tile.solid : false;
  }

  getImage(id) {
    const tile = this.tiles.get(id);
    return tile ? tile.image : null;
  }

  /** Get all tile definitions as an array (for palette UI) */
  getAll() {
    return [...this.tiles.values()];
  }

  /** Get number of defined tiles */
  get count() {
    return this.tiles.size;
  }
}
