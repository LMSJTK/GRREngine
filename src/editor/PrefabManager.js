import { getEntityType } from '../ecs/EntityTypes.js';

/**
 * Manages entity prefabs — reusable entity templates.
 * A prefab stores the entity type and its properties (but not position).
 */

let nextPrefabId = 1;

export class PrefabManager {
  constructor() {
    this.prefabs = [];
    this.onChange = null;
  }

  /** Save a placed entity as a prefab */
  saveFromEntity(entity, name) {
    const prefab = {
      id: nextPrefabId++,
      name: name || this._generateName(entity),
      type: entity.type,
      width: entity.width,
      height: entity.height,
      properties: JSON.parse(JSON.stringify(entity.properties)),
    };
    this.prefabs.push(prefab);
    if (this.onChange) this.onChange();
    return prefab;
  }

  /** Create a new entity placement data from a prefab */
  instantiate(prefabId) {
    const prefab = this.prefabs.find((p) => p.id === prefabId);
    if (!prefab) return null;

    return {
      type: prefab.type,
      width: prefab.width,
      height: prefab.height,
      properties: JSON.parse(JSON.stringify(prefab.properties)),
    };
  }

  /** Delete a prefab by id */
  delete(prefabId) {
    const idx = this.prefabs.findIndex((p) => p.id === prefabId);
    if (idx !== -1) {
      this.prefabs.splice(idx, 1);
      if (this.onChange) this.onChange();
    }
  }

  /** Rename a prefab */
  rename(prefabId, newName) {
    const prefab = this.prefabs.find((p) => p.id === prefabId);
    if (prefab) {
      prefab.name = newName;
      if (this.onChange) this.onChange();
    }
  }

  _generateName(entity) {
    const typeDef = getEntityType(entity.type);
    const baseName = entity.properties.npcName || entity.properties.enemyName ||
      entity.properties.itemName || entity.properties.doorName ||
      entity.properties.triggerName || typeDef?.name || entity.type;
    return `${baseName} Prefab`;
  }

  /** Serialize all prefabs */
  serialize() {
    return this.prefabs.map((p) => ({
      name: p.name,
      type: p.type,
      width: p.width,
      height: p.height,
      properties: { ...p.properties },
    }));
  }

  /** Load prefabs from serialized data */
  deserialize(data) {
    this.prefabs = [];
    if (!Array.isArray(data)) return;
    for (const entry of data) {
      this.prefabs.push({
        id: nextPrefabId++,
        name: entry.name,
        type: entry.type,
        width: entry.width,
        height: entry.height,
        properties: { ...entry.properties },
      });
    }
    if (this.onChange) this.onChange();
  }
}
