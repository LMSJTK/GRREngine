/**
 * Generates a placeholder player sprite sheet programmatically.
 * 4 directions (down, left, right, up), 3 frames each (idle, walk1, walk2).
 * Simple character with head and body.
 */
export function generatePlayerSpriteSheet(frameWidth = 16, frameHeight = 16) {
  const cols = 3; // frames per direction
  const rows = 4; // directions: down, left, right, up
  const c = document.createElement('canvas');
  c.width = frameWidth * cols;
  c.height = frameHeight * rows;
  const ctx = c.getContext('2d');

  // Color palette
  const skinColor = '#f0c090';
  const hairColor = '#604020';
  const shirtColor = '#4080c0';
  const pantsColor = '#405080';
  const eyeColor = '#202020';

  function drawCharacter(col, row, walkOffset = 0) {
    const ox = col * frameWidth;
    const oy = row * frameHeight;

    // Body offset for walk animation
    const bodyBob = Math.abs(walkOffset) > 0 ? -1 : 0;

    // Legs / pants
    ctx.fillStyle = pantsColor;
    ctx.fillRect(ox + 5, oy + 11 + bodyBob, 3, 3);
    ctx.fillRect(ox + 8, oy + 11 + bodyBob, 3, 3);

    // Walk leg movement
    if (walkOffset !== 0) {
      ctx.fillRect(ox + 5 + walkOffset, oy + 13, 3, 2);
      ctx.fillRect(ox + 8 - walkOffset, oy + 12, 3, 2);
    } else {
      ctx.fillRect(ox + 5, oy + 13, 3, 2);
      ctx.fillRect(ox + 8, oy + 13, 3, 2);
    }

    // Torso / shirt
    ctx.fillStyle = shirtColor;
    ctx.fillRect(ox + 4, oy + 7 + bodyBob, 8, 5);

    // Arms
    if (walkOffset > 0) {
      ctx.fillRect(ox + 3, oy + 7 + bodyBob, 1, 4);
      ctx.fillRect(ox + 12, oy + 8 + bodyBob, 1, 4);
    } else if (walkOffset < 0) {
      ctx.fillRect(ox + 3, oy + 8 + bodyBob, 1, 4);
      ctx.fillRect(ox + 12, oy + 7 + bodyBob, 1, 4);
    } else {
      ctx.fillRect(ox + 3, oy + 7 + bodyBob, 1, 4);
      ctx.fillRect(ox + 12, oy + 7 + bodyBob, 1, 4);
    }

    // Head
    ctx.fillStyle = skinColor;
    ctx.fillRect(ox + 4, oy + 1 + bodyBob, 8, 7);

    // Hair
    ctx.fillStyle = hairColor;
    if (row === 0) {
      // Facing down - hair on top
      ctx.fillRect(ox + 4, oy + 1 + bodyBob, 8, 2);
    } else if (row === 1) {
      // Facing left - hair on top and right side
      ctx.fillRect(ox + 4, oy + 1 + bodyBob, 8, 2);
      ctx.fillRect(ox + 10, oy + 3 + bodyBob, 2, 3);
    } else if (row === 2) {
      // Facing right - hair on top and left side
      ctx.fillRect(ox + 4, oy + 1 + bodyBob, 8, 2);
      ctx.fillRect(ox + 4, oy + 3 + bodyBob, 2, 3);
    } else {
      // Facing up - hair covers head
      ctx.fillRect(ox + 4, oy + 1 + bodyBob, 8, 6);
    }

    // Eyes (only visible when not facing up)
    if (row !== 3) {
      ctx.fillStyle = eyeColor;
      if (row === 0) {
        // Facing down
        ctx.fillRect(ox + 6, oy + 4 + bodyBob, 1, 2);
        ctx.fillRect(ox + 9, oy + 4 + bodyBob, 1, 2);
      } else if (row === 1) {
        // Facing left
        ctx.fillRect(ox + 5, oy + 4 + bodyBob, 1, 2);
      } else {
        // Facing right
        ctx.fillRect(ox + 10, oy + 4 + bodyBob, 1, 2);
      }
    }
  }

  // Generate all frames
  for (let row = 0; row < rows; row++) {
    drawCharacter(0, row, 0);   // Idle
    drawCharacter(1, row, 1);   // Walk frame 1
    drawCharacter(2, row, -1);  // Walk frame 2
  }

  return c;
}

/**
 * Generate a simple NPC sprite sheet (different colors).
 */
export function generateNPCSpriteSheet(
  shirtColor = '#c04040',
  hairColor = '#f0d060',
  frameWidth = 16,
  frameHeight = 16
) {
  const cols = 3;
  const rows = 4;
  const c = document.createElement('canvas');
  c.width = frameWidth * cols;
  c.height = frameHeight * rows;
  const ctx = c.getContext('2d');

  const skinColor = '#f0c090';
  const pantsColor = '#404040';
  const eyeColor = '#202020';

  function drawChar(col, row, walkOffset = 0) {
    const ox = col * frameWidth;
    const oy = row * frameHeight;
    const bob = Math.abs(walkOffset) > 0 ? -1 : 0;

    ctx.fillStyle = pantsColor;
    ctx.fillRect(ox + 5, oy + 11 + bob, 3, 4);
    ctx.fillRect(ox + 8, oy + 11 + bob, 3, 4);

    ctx.fillStyle = shirtColor;
    ctx.fillRect(ox + 4, oy + 7 + bob, 8, 5);
    ctx.fillRect(ox + 3, oy + 7 + bob, 1, 4);
    ctx.fillRect(ox + 12, oy + 7 + bob, 1, 4);

    ctx.fillStyle = skinColor;
    ctx.fillRect(ox + 4, oy + 1 + bob, 8, 7);

    ctx.fillStyle = hairColor;
    ctx.fillRect(ox + 4, oy + 1 + bob, 8, 2);
    if (row === 3) ctx.fillRect(ox + 4, oy + 1 + bob, 8, 6);

    if (row !== 3) {
      ctx.fillStyle = eyeColor;
      if (row === 0) {
        ctx.fillRect(ox + 6, oy + 4 + bob, 1, 2);
        ctx.fillRect(ox + 9, oy + 4 + bob, 1, 2);
      } else if (row === 1) {
        ctx.fillRect(ox + 5, oy + 4 + bob, 1, 2);
      } else {
        ctx.fillRect(ox + 10, oy + 4 + bob, 1, 2);
      }
    }
  }

  for (let row = 0; row < rows; row++) {
    drawChar(0, row, 0);
    drawChar(1, row, 1);
    drawChar(2, row, -1);
  }

  return c;
}
