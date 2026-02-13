import { Engine } from './engine/Engine.js';

/**
 * GRREngine - Games, Resources, and Robots Engine
 * Entry point. Initializes the engine and starts the editor.
 */

const engine = new Engine('game-canvas');
engine.init();

// Expose engine globally for debugging / console access
window.grr = engine;

console.log(
  '%c GRREngine v0.1.0 %c Games, Resources, and Robots Engine ',
  'background: #4a6090; color: #fff; padding: 4px 8px; border-radius: 4px 0 0 4px; font-weight: bold;',
  'background: #2a2a4a; color: #ccc; padding: 4px 8px; border-radius: 0 4px 4px 0;'
);
console.log('Engine available at window.grr');
