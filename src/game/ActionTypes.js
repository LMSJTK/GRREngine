/**
 * Action type definitions for the scripting system.
 * Each action type has a name, category, description, and parameter schema.
 */

export const ACTION_CATEGORIES = {
  dialog: { label: 'Dialog', color: '#4a90d0' },
  logic: { label: 'Logic', color: '#d0a040' },
  game: { label: 'Game', color: '#40b060' },
  combat: { label: 'Combat', color: '#d04040' },
  flow: { label: 'Flow', color: '#b04080' },
  cutscene: { label: 'Cutscene', color: '#a060c0' },
};

export const ACTION_TYPES = {
  show_dialog: {
    name: 'Show Dialog',
    category: 'dialog',
    desc: 'Display a message in the dialog box',
    params: [
      { key: 'text', label: 'Text', type: 'string', default: 'Hello!' },
      { key: 'duration', label: 'Duration (s)', type: 'number', default: 3, min: 0.5, max: 30 },
    ],
  },
  set_flag: {
    name: 'Set Flag',
    category: 'logic',
    desc: 'Set a boolean flag to true or false',
    params: [
      { key: 'flag', label: 'Flag Name', type: 'string', default: 'my_flag' },
      { key: 'value', label: 'Value', type: 'boolean', default: true },
    ],
  },
  check_flag: {
    name: 'Check Flag',
    category: 'logic',
    desc: 'Stop remaining actions if flag does not match expected value',
    params: [
      { key: 'flag', label: 'Flag Name', type: 'string', default: '' },
      { key: 'expect', label: 'Expect', type: 'boolean', default: true },
    ],
  },
  set_variable: {
    name: 'Set Variable',
    category: 'logic',
    desc: 'Set a numeric variable to a value',
    params: [
      { key: 'variable', label: 'Variable', type: 'string', default: 'score' },
      { key: 'value', label: 'Value', type: 'number', default: 0 },
    ],
  },
  add_variable: {
    name: 'Add to Variable',
    category: 'logic',
    desc: 'Add a number to an existing variable',
    params: [
      { key: 'variable', label: 'Variable', type: 'string', default: 'score' },
      { key: 'amount', label: 'Amount', type: 'number', default: 1 },
    ],
  },
  give_item: {
    name: 'Give Item',
    category: 'game',
    desc: 'Add an item to the player inventory',
    params: [
      { key: 'item', label: 'Item Name', type: 'string', default: 'Key' },
      { key: 'amount', label: 'Amount', type: 'number', default: 1, min: 1 },
    ],
  },
  remove_item: {
    name: 'Remove Item',
    category: 'game',
    desc: 'Remove an item from the player inventory',
    params: [
      { key: 'item', label: 'Item Name', type: 'string', default: 'Key' },
      { key: 'amount', label: 'Amount', type: 'number', default: 1, min: 1 },
    ],
  },
  check_item: {
    name: 'Check Item',
    category: 'game',
    desc: 'Stop remaining actions if player lacks item',
    params: [
      { key: 'item', label: 'Item Name', type: 'string', default: 'Key' },
      { key: 'amount', label: 'Min Amount', type: 'number', default: 1, min: 1 },
    ],
  },
  teleport: {
    name: 'Teleport',
    category: 'game',
    desc: 'Move the player to a spawn point',
    params: [
      { key: 'spawnId', label: 'Spawn ID', type: 'string', default: 'default' },
    ],
  },
  wait: {
    name: 'Wait',
    category: 'flow',
    desc: 'Pause action execution for a duration',
    params: [
      { key: 'seconds', label: 'Seconds', type: 'number', default: 1, min: 0.1, max: 60 },
    ],
  },
  lock_input: {
    name: 'Lock Input',
    category: 'cutscene',
    desc: 'Enable or disable player controls',
    params: [
      { key: 'locked', label: 'Locked', type: 'boolean', default: true },
    ],
  },
  camera_pan: {
    name: 'Camera Pan',
    category: 'cutscene',
    desc: 'Smoothly move camera to a world position',
    params: [
      { key: 'x', label: 'Target X', type: 'number', default: 0 },
      { key: 'y', label: 'Target Y', type: 'number', default: 0 },
      { key: 'duration', label: 'Duration (s)', type: 'number', default: 1, min: 0.1 },
    ],
  },
  camera_follow: {
    name: 'Camera Follow Player',
    category: 'cutscene',
    desc: 'Return camera to follow the player',
    params: [],
  },
  remove_entity: {
    name: 'Remove This Entity',
    category: 'game',
    desc: 'Remove the entity that triggered this action',
    params: [],
  },
  heal_player: {
    name: 'Heal Player',
    category: 'combat',
    desc: 'Restore player health',
    params: [
      { key: 'amount', label: 'Amount', type: 'number', default: 2, min: 1, max: 99 },
    ],
  },
  damage_player: {
    name: 'Damage Player',
    category: 'combat',
    desc: 'Deal damage to the player',
    params: [
      { key: 'amount', label: 'Damage', type: 'number', default: 1, min: 1, max: 99 },
    ],
  },
  set_max_hp: {
    name: 'Set Max HP',
    category: 'combat',
    desc: 'Change the player max health',
    params: [
      { key: 'value', label: 'Max HP', type: 'number', default: 6, min: 2, max: 20 },
    ],
  },
  set_attack: {
    name: 'Set Attack Power',
    category: 'combat',
    desc: 'Change the player attack damage',
    params: [
      { key: 'value', label: 'Attack', type: 'number', default: 1, min: 1, max: 99 },
    ],
  },
  screen_fade: {
    name: 'Screen Fade',
    category: 'cutscene',
    desc: 'Fade screen to/from black',
    params: [
      { key: 'direction', label: 'Direction', type: 'string', default: 'out' },
      { key: 'duration', label: 'Duration (s)', type: 'number', default: 0.5, min: 0.1, max: 5 },
    ],
  },
};

/** Get an action type definition */
export function getActionType(typeKey) {
  return ACTION_TYPES[typeKey] || null;
}

/** Create a default action of a given type */
export function createDefaultAction(typeKey) {
  const def = ACTION_TYPES[typeKey];
  if (!def) return null;

  const params = {};
  for (const p of def.params) {
    params[p.key] = p.default ?? '';
  }
  return { type: typeKey, params };
}

/** Get all action types as an array for dropdowns */
export function getActionTypeList() {
  return Object.entries(ACTION_TYPES).map(([key, def]) => ({
    key,
    name: def.name,
    category: def.category,
    desc: def.desc,
  }));
}
