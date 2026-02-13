/**
 * Renders tilemap layers efficiently, only drawing visible tiles.
 */
export class TileRenderer {
  /** Draw a single tilemap layer */
  static drawLayer(renderer, camera, tileMap, tileSet, layerName) {
    const ts = tileMap.tileSize;
    const layer = tileMap.layers[layerName];
    if (!layer) return;

    // Calculate visible tile range
    const viewLeft = camera.x - renderer.width / 2 / camera.zoom;
    const viewTop = camera.y - renderer.height / 2 / camera.zoom;
    const viewRight = camera.x + renderer.width / 2 / camera.zoom;
    const viewBottom = camera.y + renderer.height / 2 / camera.zoom;

    const startCol = Math.max(0, Math.floor(viewLeft / ts));
    const endCol = Math.min(tileMap.width - 1, Math.floor(viewRight / ts));
    const startRow = Math.max(0, Math.floor(viewTop / ts));
    const endRow = Math.min(tileMap.height - 1, Math.floor(viewBottom / ts));

    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        const tileId = layer[row][col];
        if (tileId < 0) continue;

        const tileDef = tileSet.get(tileId);
        if (!tileDef || !tileDef.image) continue;

        renderer.drawImage(tileDef.image, col * ts, row * ts, ts, ts);
      }
    }
  }

  /** Draw ground + detail layers (below entities) */
  static drawBelow(renderer, camera, tileMap, tileSet) {
    TileRenderer.drawLayer(renderer, camera, tileMap, tileSet, 'ground');
    TileRenderer.drawLayer(renderer, camera, tileMap, tileSet, 'detail');
  }

  /** Draw overhead layer (above entities) */
  static drawAbove(renderer, camera, tileMap, tileSet) {
    TileRenderer.drawLayer(renderer, camera, tileMap, tileSet, 'overhead');
  }
}
