/**
 * Generates placeholder tile images programmatically using Canvas.
 * These give you something to work with immediately — no external assets needed.
 */

function createTileCanvas(size, drawFn) {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  drawFn(ctx, size);
  return c;
}

/** Seeded random for consistent tile patterns */
function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function generatePlaceholderTiles(tileSize = 16) {
  const tiles = {};

  // 0: Grass
  tiles.grass = createTileCanvas(tileSize, (ctx, s) => {
    ctx.fillStyle = '#4a8c3f';
    ctx.fillRect(0, 0, s, s);
    const rng = seededRandom(42);
    for (let i = 0; i < 12; i++) {
      const gx = rng() * s;
      const gy = rng() * s;
      ctx.fillStyle = rng() > 0.5 ? '#5a9c4f' : '#3a7c2f';
      ctx.fillRect(Math.floor(gx), Math.floor(gy), 1, 1);
    }
  });

  // 1: Water
  tiles.water = createTileCanvas(tileSize, (ctx, s) => {
    ctx.fillStyle = '#2a6cb8';
    ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = '#3a7cd0';
    for (let y = 2; y < s; y += 5) {
      ctx.fillRect(1, y, s - 2, 1);
    }
    ctx.fillStyle = '#4a8ce8';
    ctx.fillRect(3, 4, 3, 1);
    ctx.fillRect(9, 9, 4, 1);
  });

  // 2: Dirt
  tiles.dirt = createTileCanvas(tileSize, (ctx, s) => {
    ctx.fillStyle = '#8c6b3e';
    ctx.fillRect(0, 0, s, s);
    const rng = seededRandom(99);
    for (let i = 0; i < 10; i++) {
      ctx.fillStyle = rng() > 0.5 ? '#7c5b2e' : '#9c7b4e';
      ctx.fillRect(Math.floor(rng() * s), Math.floor(rng() * s), 1, 1);
    }
  });

  // 3: Stone
  tiles.stone = createTileCanvas(tileSize, (ctx, s) => {
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = '#707070';
    ctx.fillRect(0, 0, s / 2, s / 2);
    ctx.fillRect(s / 2, s / 2, s / 2, s / 2);
    ctx.fillStyle = '#909090';
    ctx.fillRect(s / 2, 0, s / 2, s / 2);
    ctx.fillRect(0, s / 2, s / 2, s / 2);
    // Grout lines
    ctx.fillStyle = '#606060';
    ctx.fillRect(0, s / 2 - 0.5, s, 1);
    ctx.fillRect(s / 2 - 0.5, 0, 1, s);
  });

  // 4: Wall (solid)
  tiles.wall = createTileCanvas(tileSize, (ctx, s) => {
    ctx.fillStyle = '#505060';
    ctx.fillRect(0, 0, s, s);
    // Brick pattern
    ctx.fillStyle = '#606070';
    ctx.fillRect(1, 1, s / 2 - 2, s / 2 - 2);
    ctx.fillRect(s / 2 + 1, 1, s / 2 - 2, s / 2 - 2);
    ctx.fillRect(s / 4, s / 2 + 1, s / 2 - 2, s / 2 - 2);
    // Highlight
    ctx.fillStyle = '#707080';
    ctx.fillRect(1, 1, s / 2 - 2, 1);
    ctx.fillRect(s / 2 + 1, 1, s / 2 - 2, 1);
  });

  // 5: Sand
  tiles.sand = createTileCanvas(tileSize, (ctx, s) => {
    ctx.fillStyle = '#d4b86a';
    ctx.fillRect(0, 0, s, s);
    const rng = seededRandom(77);
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = rng() > 0.5 ? '#c4a85a' : '#e4c87a';
      ctx.fillRect(Math.floor(rng() * s), Math.floor(rng() * s), 1, 1);
    }
  });

  // 6: Path
  tiles.path = createTileCanvas(tileSize, (ctx, s) => {
    ctx.fillStyle = '#b89860';
    ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = '#a88850';
    const rng = seededRandom(55);
    for (let i = 0; i < 6; i++) {
      ctx.fillRect(Math.floor(rng() * s), Math.floor(rng() * s), 2, 1);
    }
  });

  // 7: Tree (solid, detail tile)
  tiles.tree = createTileCanvas(tileSize, (ctx, s) => {
    // Trunk
    ctx.fillStyle = '#6b4226';
    ctx.fillRect(s / 2 - 2, s / 2, 4, s / 2);
    // Canopy
    ctx.fillStyle = '#2d6b1e';
    ctx.fillRect(1, 1, s - 2, s / 2 + 2);
    ctx.fillStyle = '#3d8b2e';
    ctx.fillRect(2, 2, s - 4, s / 2 - 2);
    // Highlight
    ctx.fillStyle = '#4d9b3e';
    ctx.fillRect(3, 3, 3, 2);
  });

  // 8: Flowers (detail)
  tiles.flowers = createTileCanvas(tileSize, (ctx, s) => {
    // Transparent background (detail tile)
    ctx.clearRect(0, 0, s, s);
    const colors = ['#e44', '#ee4', '#e4e', '#4ef'];
    const rng = seededRandom(33);
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = colors[Math.floor(rng() * colors.length)];
      ctx.fillRect(Math.floor(rng() * (s - 2)) + 1, Math.floor(rng() * (s - 2)) + 1, 2, 2);
      // Stem
      ctx.fillStyle = '#3a7c2f';
      ctx.fillRect(Math.floor(rng() * (s - 2)) + 1, Math.floor(rng() * (s - 4)) + 3, 1, 2);
    }
  });

  // 9: Dark Grass (variation)
  tiles.darkGrass = createTileCanvas(tileSize, (ctx, s) => {
    ctx.fillStyle = '#3a6c2f';
    ctx.fillRect(0, 0, s, s);
    const rng = seededRandom(88);
    for (let i = 0; i < 10; i++) {
      ctx.fillStyle = rng() > 0.5 ? '#2a5c1f' : '#4a7c3f';
      ctx.fillRect(Math.floor(rng() * s), Math.floor(rng() * s), 1, 2);
    }
  });

  // 10: Wooden Floor
  tiles.woodFloor = createTileCanvas(tileSize, (ctx, s) => {
    ctx.fillStyle = '#a07040';
    ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = '#906030';
    for (let y = 0; y < s; y += 4) {
      ctx.fillRect(0, y, s, 1);
    }
    ctx.fillStyle = '#b08050';
    ctx.fillRect(2, 1, s - 4, 1);
    ctx.fillRect(4, 5, s - 8, 1);
  });

  // 11: Roof (solid)
  tiles.roof = createTileCanvas(tileSize, (ctx, s) => {
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = '#7b3503';
    for (let y = 0; y < s; y += 3) {
      ctx.fillRect(0, y, s, 1);
    }
  });

  return tiles;
}

/**
 * Register all placeholder tiles into a TileSet and AssetManager.
 */
export function registerPlaceholderTiles(tileSet, assetManager, tileSize = 16) {
  const tiles = generatePlaceholderTiles(tileSize);

  const definitions = [
    { id: 0, key: 'grass', name: 'Grass', solid: false },
    { id: 1, key: 'water', name: 'Water', solid: true },
    { id: 2, key: 'dirt', name: 'Dirt', solid: false },
    { id: 3, key: 'stone', name: 'Stone Floor', solid: false },
    { id: 4, key: 'wall', name: 'Wall', solid: true },
    { id: 5, key: 'sand', name: 'Sand', solid: false },
    { id: 6, key: 'path', name: 'Path', solid: false },
    { id: 7, key: 'tree', name: 'Tree', solid: true },
    { id: 8, key: 'flowers', name: 'Flowers', solid: false },
    { id: 9, key: 'darkGrass', name: 'Dark Grass', solid: false },
    { id: 10, key: 'woodFloor', name: 'Wood Floor', solid: false },
    { id: 11, key: 'roof', name: 'Roof', solid: true },
  ];

  for (const def of definitions) {
    const canvas = tiles[def.key];
    assetManager.registerImage(`tile_${def.key}`, canvas);
    tileSet.define(def.id, {
      name: def.name,
      image: canvas,
      solid: def.solid,
    });
  }

  return definitions;
}
