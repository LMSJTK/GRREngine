/**
 * Base Entity class. Entities are game objects with position, size, and components.
 */
let nextEntityId = 1;

export class Entity {
  constructor(x = 0, y = 0, width = 16, height = 16) {
    this.id = nextEntityId++;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.vx = 0;
    this.vy = 0;
    this.active = true;
    this.type = 'entity';
    this.components = new Map();
    this.tags = new Set();
  }

  addComponent(name, component) {
    component.entity = this;
    this.components.set(name, component);
    return this;
  }

  getComponent(name) {
    return this.components.get(name);
  }

  hasComponent(name) {
    return this.components.has(name);
  }

  removeComponent(name) {
    this.components.delete(name);
    return this;
  }

  addTag(tag) {
    this.tags.add(tag);
    return this;
  }

  hasTag(tag) {
    return this.tags.has(tag);
  }

  update(dt) {
    for (const comp of this.components.values()) {
      if (comp.update) comp.update(dt);
    }
  }

  render(renderer) {
    for (const comp of this.components.values()) {
      if (comp.render) comp.render(renderer);
    }
  }

  getCollisionBox() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

  /** Serialize entity to JSON-friendly object */
  serialize() {
    return {
      type: this.type,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      tags: [...this.tags],
    };
  }
}
