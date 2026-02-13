/**
 * Generates placeholder entity sprites (enemies, items, doors).
 * All generated programmatically — no external files needed.
 */

function createCanvas(w, h, drawFn) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  drawFn(ctx, w, h);
  return c;
}

/**
 * Generate a slime enemy sprite sheet (4 directions, 2 frames each).
 */
export function generateSlimeSpriteSheet(color = '#40c040', size = 16) {
  const cols = 2;
  const rows = 4;
  const c = document.createElement('canvas');
  c.width = size * cols;
  c.height = size * rows;
  const ctx = c.getContext('2d');

  const darkColor = shiftColor(color, -30);
  const lightColor = shiftColor(color, 30);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const ox = col * size;
      const oy = row * size;
      const squish = col === 1 ? 1 : 0; // animation: squish

      // Body
      ctx.fillStyle = color;
      ctx.fillRect(ox + 3, oy + 5 + squish, 10, 9 - squish);
      ctx.fillRect(ox + 2, oy + 7 + squish, 12, 5 - squish);
      ctx.fillRect(ox + 4, oy + 4 + squish, 8, 1);

      // Highlight
      ctx.fillStyle = lightColor;
      ctx.fillRect(ox + 4, oy + 5 + squish, 3, 2);

      // Shadow
      ctx.fillStyle = darkColor;
      ctx.fillRect(ox + 3, oy + 12, 10, 2);

      // Eyes
      ctx.fillStyle = '#fff';
      ctx.fillRect(ox + 5, oy + 7 + squish, 2, 3);
      ctx.fillRect(ox + 9, oy + 7 + squish, 2, 3);
      ctx.fillStyle = '#202020';
      // Direction affects pupil position
      if (row === 0) { // down
        ctx.fillRect(ox + 5, oy + 9 + squish, 2, 1);
        ctx.fillRect(ox + 9, oy + 9 + squish, 2, 1);
      } else if (row === 1) { // left
        ctx.fillRect(ox + 5, oy + 8 + squish, 1, 1);
        ctx.fillRect(ox + 9, oy + 8 + squish, 1, 1);
      } else if (row === 2) { // right
        ctx.fillRect(ox + 6, oy + 8 + squish, 1, 1);
        ctx.fillRect(ox + 10, oy + 8 + squish, 1, 1);
      } else { // up
        ctx.fillRect(ox + 5, oy + 7 + squish, 2, 1);
        ctx.fillRect(ox + 9, oy + 7 + squish, 2, 1);
      }
    }
  }
  return c;
}

/**
 * Generate a skeleton enemy sprite sheet.
 */
export function generateSkeletonSpriteSheet(size = 16) {
  const cols = 2;
  const rows = 4;
  const c = document.createElement('canvas');
  c.width = size * cols;
  c.height = size * rows;
  const ctx = c.getContext('2d');

  const boneColor = '#e0d8c8';
  const darkBone = '#b0a898';
  const eyeColor = '#c03030';

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const ox = col * size;
      const oy = row * size;
      const walk = col === 1 ? 1 : 0;

      // Legs
      ctx.fillStyle = boneColor;
      ctx.fillRect(ox + 5, oy + 11, 2, 4);
      ctx.fillRect(ox + 9, oy + 11, 2, 4);
      if (walk) {
        ctx.fillRect(ox + 4, oy + 13, 2, 2);
        ctx.fillRect(ox + 10, oy + 12, 2, 2);
      }

      // Ribcage
      ctx.fillStyle = boneColor;
      ctx.fillRect(ox + 4, oy + 7, 8, 5);
      ctx.fillStyle = darkBone;
      ctx.fillRect(ox + 5, oy + 8, 1, 3);
      ctx.fillRect(ox + 7, oy + 8, 1, 3);
      ctx.fillRect(ox + 9, oy + 8, 1, 3);

      // Arms
      ctx.fillStyle = boneColor;
      ctx.fillRect(ox + 3, oy + 7, 1, 5);
      ctx.fillRect(ox + 12, oy + 7, 1, 5);

      // Skull
      ctx.fillStyle = boneColor;
      ctx.fillRect(ox + 4, oy + 1, 8, 7);
      ctx.fillRect(ox + 5, oy + 0, 6, 1);

      // Eye sockets
      if (row !== 3) {
        ctx.fillStyle = '#202020';
        ctx.fillRect(ox + 5, oy + 3, 2, 2);
        ctx.fillRect(ox + 9, oy + 3, 2, 2);
        ctx.fillStyle = eyeColor;
        ctx.fillRect(ox + 5, oy + 3, 1, 1);
        ctx.fillRect(ox + 9, oy + 3, 1, 1);
      }

      // Jaw
      ctx.fillStyle = darkBone;
      ctx.fillRect(ox + 5, oy + 6, 6, 1);
    }
  }
  return c;
}

/**
 * Generate simple item icons (16x16 each, single frame).
 */
export function generateItemSprites(size = 16) {
  const items = {};

  // Coin
  items.coin = createCanvas(size, size, (ctx) => {
    ctx.fillStyle = '#d4a020';
    ctx.fillRect(5, 3, 6, 10);
    ctx.fillRect(4, 4, 8, 8);
    ctx.fillStyle = '#e8c040';
    ctx.fillRect(5, 4, 6, 8);
    ctx.fillStyle = '#f0d860';
    ctx.fillRect(6, 5, 2, 2);
    // $ symbol
    ctx.fillStyle = '#b08010';
    ctx.fillRect(7, 5, 2, 6);
    ctx.fillRect(6, 6, 4, 1);
    ctx.fillRect(6, 9, 4, 1);
  });

  // Heart / health pickup
  items.heart = createCanvas(size, size, (ctx) => {
    ctx.fillStyle = '#e04040';
    ctx.fillRect(3, 4, 4, 4);
    ctx.fillRect(9, 4, 4, 4);
    ctx.fillRect(2, 5, 12, 4);
    ctx.fillRect(3, 9, 10, 2);
    ctx.fillRect(4, 11, 8, 1);
    ctx.fillRect(5, 12, 6, 1);
    ctx.fillRect(6, 13, 4, 1);
    ctx.fillRect(7, 14, 2, 1);
    // Highlight
    ctx.fillStyle = '#f06060';
    ctx.fillRect(4, 5, 2, 2);
  });

  // Key
  items.key = createCanvas(size, size, (ctx) => {
    ctx.fillStyle = '#d4a020';
    // Ring
    ctx.fillRect(4, 2, 6, 1);
    ctx.fillRect(3, 3, 1, 4);
    ctx.fillRect(10, 3, 1, 4);
    ctx.fillRect(4, 7, 6, 1);
    ctx.fillRect(4, 3, 1, 1);
    ctx.fillRect(9, 3, 1, 1);
    ctx.fillRect(4, 6, 1, 1);
    ctx.fillRect(9, 6, 1, 1);
    // Shaft
    ctx.fillRect(6, 8, 2, 6);
    // Teeth
    ctx.fillRect(8, 11, 2, 1);
    ctx.fillRect(8, 13, 2, 1);
    // Highlight
    ctx.fillStyle = '#e8c040';
    ctx.fillRect(5, 3, 4, 4);
    ctx.fillStyle = '#d4a020';
    ctx.fillRect(6, 4, 2, 2);
  });

  // Potion
  items.potion = createCanvas(size, size, (ctx) => {
    // Bottle neck
    ctx.fillStyle = '#808080';
    ctx.fillRect(6, 2, 4, 2);
    ctx.fillStyle = '#a0a0a0';
    ctx.fillRect(6, 1, 4, 1);
    // Bottle body
    ctx.fillStyle = '#4040c0';
    ctx.fillRect(4, 6, 8, 8);
    ctx.fillRect(5, 4, 6, 2);
    ctx.fillRect(5, 14, 6, 1);
    // Liquid
    ctx.fillStyle = '#6060e0';
    ctx.fillRect(5, 7, 6, 6);
    // Highlight
    ctx.fillStyle = '#8080f0';
    ctx.fillRect(5, 7, 2, 3);
  });

  // Chest
  items.chest = createCanvas(size, size, (ctx) => {
    // Body
    ctx.fillStyle = '#8b5a2b';
    ctx.fillRect(2, 7, 12, 7);
    // Lid
    ctx.fillStyle = '#a06830';
    ctx.fillRect(2, 4, 12, 4);
    ctx.fillRect(3, 3, 10, 1);
    // Metal bands
    ctx.fillStyle = '#c0a020';
    ctx.fillRect(2, 7, 12, 1);
    ctx.fillRect(7, 4, 2, 5);
    // Lock
    ctx.fillStyle = '#d4b830';
    ctx.fillRect(7, 8, 2, 2);
    // Highlight
    ctx.fillStyle = '#b07838';
    ctx.fillRect(3, 4, 3, 2);
  });

  // Door
  items.door = createCanvas(size, size, (ctx) => {
    // Frame
    ctx.fillStyle = '#6b4226';
    ctx.fillRect(2, 0, 12, 16);
    // Door panel
    ctx.fillStyle = '#8b5a36';
    ctx.fillRect(3, 1, 10, 14);
    // Panels detail
    ctx.fillStyle = '#7b4a26';
    ctx.fillRect(4, 2, 3, 5);
    ctx.fillRect(9, 2, 3, 5);
    ctx.fillRect(4, 9, 3, 5);
    ctx.fillRect(9, 9, 3, 5);
    // Handle
    ctx.fillStyle = '#d4a020';
    ctx.fillRect(10, 8, 2, 2);
  });

  return items;
}

/** Shift a hex color's brightness */
function shiftColor(hex, amount) {
  const r = Math.max(0, Math.min(255, parseInt(hex.slice(1, 3), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(hex.slice(3, 5), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(hex.slice(5, 7), 16) + amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Register all entity placeholder sprites into the AssetManager.
 */
export function registerEntitySprites(assetManager) {
  // Slime enemy
  const slime = generateSlimeSpriteSheet('#40c040', 16);
  assetManager.registerImage('enemy_slime', slime);

  // Red slime variant
  const redSlime = generateSlimeSpriteSheet('#c04040', 16);
  assetManager.registerImage('enemy_slime_red', redSlime);

  // Skeleton
  const skeleton = generateSkeletonSpriteSheet(16);
  assetManager.registerImage('enemy_skeleton', skeleton);

  // Items
  const itemSprites = generateItemSprites(16);
  assetManager.registerImage('item_coin', itemSprites.coin);
  assetManager.registerImage('item_heart', itemSprites.heart);
  assetManager.registerImage('item_key', itemSprites.key);
  assetManager.registerImage('item_potion', itemSprites.potion);
  assetManager.registerImage('item_chest', itemSprites.chest);
  assetManager.registerImage('item_door', itemSprites.door);
}
