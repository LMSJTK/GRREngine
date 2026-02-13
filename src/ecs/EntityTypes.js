/**
 * Entity type registry - defines all placeable entity types,
 * their default properties, property schemas (for the inspector),
 * and visual configuration.
 */

export const ENTITY_CATEGORIES = {
  characters: { label: 'Characters', color: '#4a90d0' },
  objects: { label: 'Objects', color: '#d0a040' },
  logic: { label: 'Logic', color: '#a040d0' },
};

/**
 * Each entity type definition:
 *  - name: display name
 *  - category: key into ENTITY_CATEGORIES
 *  - spriteKey: asset key for the preview/editor sprite (null = drawn as shape)
 *  - solid: default collision behavior
 *  - width/height: default size in pixels
 *  - defaultProps: default values for type-specific properties
 *  - schema: property definitions for the inspector UI
 */
export const ENTITY_TYPES = {
  npc: {
    name: 'NPC',
    category: 'characters',
    spriteKey: 'npc_sprite_1',
    solid: true,
    width: 16,
    height: 16,
    defaultProps: {
      npcName: 'Villager',
      dialog: ['Hello!'],
      direction: 'down',
      spriteVariant: 'npc_sprite_1',
    },
    schema: [
      { key: 'npcName', label: 'Name', type: 'string' },
      { key: 'dialog', label: 'Dialog Lines', type: 'stringarray' },
      { key: 'direction', label: 'Facing', type: 'select', options: ['down', 'left', 'right', 'up'] },
      { key: 'spriteVariant', label: 'Sprite', type: 'sprite' },
    ],
  },
  enemy: {
    name: 'Enemy',
    category: 'characters',
    spriteKey: 'enemy_slime',
    solid: true,
    width: 16,
    height: 16,
    defaultProps: {
      enemyName: 'Slime',
      health: 3,
      damage: 1,
      behavior: 'wander',
      direction: 'down',
      spriteVariant: 'enemy_slime',
    },
    schema: [
      { key: 'enemyName', label: 'Name', type: 'string' },
      { key: 'health', label: 'Health', type: 'number', min: 1, max: 999 },
      { key: 'damage', label: 'Damage', type: 'number', min: 0, max: 999 },
      { key: 'behavior', label: 'Behavior', type: 'select', options: ['stationary', 'wander', 'patrol', 'chase'] },
      { key: 'direction', label: 'Facing', type: 'select', options: ['down', 'left', 'right', 'up'] },
      { key: 'spriteVariant', label: 'Sprite', type: 'sprite' },
    ],
  },
  item: {
    name: 'Item',
    category: 'objects',
    spriteKey: 'item_coin',
    solid: false,
    width: 16,
    height: 16,
    defaultProps: {
      itemName: 'Coin',
      itemType: 'pickup',
      value: 1,
      spriteVariant: 'item_coin',
    },
    schema: [
      { key: 'itemName', label: 'Name', type: 'string' },
      { key: 'itemType', label: 'Type', type: 'select', options: ['pickup', 'key', 'consumable', 'equipment', 'quest'] },
      { key: 'value', label: 'Value', type: 'number', min: 0, max: 9999 },
      { key: 'spriteVariant', label: 'Sprite', type: 'sprite' },
    ],
  },
  trigger: {
    name: 'Trigger Zone',
    category: 'logic',
    spriteKey: null,
    solid: false,
    width: 32,
    height: 32,
    defaultProps: {
      triggerName: 'Zone',
      event: 'on_enter',
      action: '',
    },
    schema: [
      { key: 'triggerName', label: 'Name', type: 'string' },
      { key: 'event', label: 'Event', type: 'select', options: ['on_enter', 'on_exit', 'on_interact'] },
      { key: 'action', label: 'Action', type: 'string' },
      { key: 'width', label: 'Width (px)', type: 'number', min: 8, max: 512, target: 'size' },
      { key: 'height', label: 'Height (px)', type: 'number', min: 8, max: 512, target: 'size' },
    ],
  },
  spawn: {
    name: 'Spawn Point',
    category: 'logic',
    spriteKey: null,
    solid: false,
    width: 16,
    height: 16,
    defaultProps: {
      spawnId: 'default',
    },
    schema: [
      { key: 'spawnId', label: 'Spawn ID', type: 'string' },
    ],
  },
  door: {
    name: 'Door',
    category: 'logic',
    spriteKey: 'item_door',
    solid: false,
    width: 16,
    height: 16,
    defaultProps: {
      doorName: 'Door',
      targetMap: '',
      targetSpawn: 'default',
    },
    schema: [
      { key: 'doorName', label: 'Name', type: 'string' },
      { key: 'targetMap', label: 'Target Map', type: 'string' },
      { key: 'targetSpawn', label: 'Target Spawn', type: 'string' },
    ],
  },
};

/** Get a type definition by key */
export function getEntityType(typeKey) {
  return ENTITY_TYPES[typeKey] || null;
}

/** Get all types grouped by category */
export function getEntityTypesByCategory() {
  const grouped = {};
  for (const [key, def] of Object.entries(ENTITY_TYPES)) {
    const cat = def.category;
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push({ key, ...def });
  }
  return grouped;
}

/** Create default properties for a type */
export function createDefaultProps(typeKey) {
  const def = ENTITY_TYPES[typeKey];
  if (!def) return {};
  return JSON.parse(JSON.stringify(def.defaultProps));
}
