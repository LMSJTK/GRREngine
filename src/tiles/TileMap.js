/**
 * TileMap stores the tile data for a map.
 * Supports multiple layers: ground, detail, overhead.
 */
export class TileMap {
  constructor(width = 40, height = 30, tileSize = 16) {
    this.width = width;   // in tiles
    this.height = height; // in tiles
    this.tileSize = tileSize;
    this.layers = {
      ground: this._createLayer(0),   // base terrain
      detail: this._createLayer(-1),  // decorations on top of ground (-1 = empty)
      overhead: this._createLayer(-1), // things rendered over the player
    };
    this.tileSet = null; // reference set externally
  }

  _createLayer(fillValue) {
    const layer = [];
    for (let y = 0; y < this.height; y++) {
      layer.push(new Array(this.width).fill(fillValue));
    }
    return layer;
  }

  /** Set tile at position on a layer */
  setTile(layerName, col, row, tileId) {
    if (col < 0 || col >= this.width || row < 0 || row >= this.height) return;
    if (this.layers[layerName]) {
      this.layers[layerName][row][col] = tileId;
    }
  }

  /** Get tile at position on a layer */
  getTile(layerName, col, row) {
    if (col < 0 || col >= this.width || row < 0 || row >= this.height) return -1;
    return this.layers[layerName] ? this.layers[layerName][row][col] : -1;
  }

  /** Check if a tile position is solid (checks all layers) */
  isSolid(col, row) {
    if (col < 0 || col >= this.width || row < 0 || row >= this.height) return true;
    if (!this.tileSet) return false;

    for (const layerName of Object.keys(this.layers)) {
      const tileId = this.layers[layerName][row][col];
      if (tileId >= 0 && this.tileSet.isSolid(tileId)) return true;
    }
    return false;
  }

  /** Convert world coordinates to tile coordinates */
  worldToTile(worldX, worldY) {
    return {
      col: Math.floor(worldX / this.tileSize),
      row: Math.floor(worldY / this.tileSize),
    };
  }

  /** Convert tile coordinates to world coordinates */
  tileToWorld(col, row) {
    return {
      x: col * this.tileSize,
      y: row * this.tileSize,
    };
  }

  /** Get world-space pixel dimensions */
  get pixelWidth() {
    return this.width * this.tileSize;
  }

  get pixelHeight() {
    return this.height * this.tileSize;
  }

  /** Resize the map (preserves existing tiles where possible) */
  resize(newWidth, newHeight) {
    for (const layerName of Object.keys(this.layers)) {
      const oldLayer = this.layers[layerName];
      const fillValue = layerName === 'ground' ? 0 : -1;
      const newLayer = [];
      for (let y = 0; y < newHeight; y++) {
        const row = new Array(newWidth).fill(fillValue);
        if (y < this.height) {
          for (let x = 0; x < Math.min(newWidth, this.width); x++) {
            row[x] = oldLayer[y][x];
          }
        }
        newLayer.push(row);
      }
      this.layers[layerName] = newLayer;
    }
    this.width = newWidth;
    this.height = newHeight;
  }

  /** Fill a rectangular area on a layer */
  fillRect(layerName, col, row, w, h, tileId) {
    for (let y = row; y < row + h; y++) {
      for (let x = col; x < col + w; x++) {
        this.setTile(layerName, x, y, tileId);
      }
    }
  }

  /** Serialize to JSON */
  serialize() {
    return {
      width: this.width,
      height: this.height,
      tileSize: this.tileSize,
      layers: {
        ground: this.layers.ground.map((row) => [...row]),
        detail: this.layers.detail.map((row) => [...row]),
        overhead: this.layers.overhead.map((row) => [...row]),
      },
    };
  }

  /** Load from serialized data */
  static deserialize(data) {
    const map = new TileMap(data.width, data.height, data.tileSize);
    map.layers.ground = data.layers.ground;
    map.layers.detail = data.layers.detail;
    map.layers.overhead = data.layers.overhead;
    return map;
  }
}
