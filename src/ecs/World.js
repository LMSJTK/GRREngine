/**
 * World manages all entities in a scene.
 */
export class World {
  constructor() {
    this.entities = [];
  }

  add(entity) {
    this.entities.push(entity);
    return entity;
  }

  remove(entity) {
    const idx = this.entities.indexOf(entity);
    if (idx !== -1) {
      this.entities.splice(idx, 1);
    }
  }

  removeById(id) {
    const idx = this.entities.findIndex((e) => e.id === id);
    if (idx !== -1) {
      this.entities.splice(idx, 1);
    }
  }

  /** Get all entities with a specific tag */
  getByTag(tag) {
    return this.entities.filter((e) => e.hasTag(tag));
  }

  /** Get all entities of a specific type */
  getByType(type) {
    return this.entities.filter((e) => e.type === type);
  }

  /** Get all entities with a specific component */
  getByComponent(componentName) {
    return this.entities.filter((e) => e.hasComponent(componentName));
  }

  /** Find entity at a world position */
  getAtPosition(x, y) {
    return this.entities.filter((e) =>
      x >= e.x && x <= e.x + e.width &&
      y >= e.y && y <= e.y + e.height
    );
  }

  update(dt) {
    // Remove inactive entities
    this.entities = this.entities.filter((e) => e.active);
    // Update all
    for (const entity of this.entities) {
      entity.update(dt);
    }
  }

  render(renderer) {
    // Sort by y position for depth ordering
    const sorted = [...this.entities].sort((a, b) => (a.y + a.height) - (b.y + b.height));
    for (const entity of sorted) {
      entity.render(renderer);
    }
  }

  clear() {
    this.entities = [];
  }

  serialize() {
    return this.entities.map((e) => e.serialize());
  }
}
