/**
 * Game state manager - holds persistent flags, variables, and inventory
 * that persist across play sessions and can be read/written by the action system.
 */
export class GameState {
  constructor() {
    this.flags = {};      // string -> boolean
    this.vars = {};       // string -> number|string
    this.inventory = [];  // { name, amount }[]
  }

  // ---- Flags ----
  setFlag(key, value = true) {
    this.flags[key] = !!value;
  }

  getFlag(key) {
    return !!this.flags[key];
  }

  toggleFlag(key) {
    this.flags[key] = !this.flags[key];
  }

  // ---- Variables ----
  setVar(key, value) {
    this.vars[key] = value;
  }

  getVar(key, defaultVal = 0) {
    return this.vars[key] ?? defaultVal;
  }

  addVar(key, amount) {
    this.vars[key] = (this.vars[key] || 0) + amount;
  }

  // ---- Inventory ----
  addItem(name, amount = 1) {
    const existing = this.inventory.find((i) => i.name === name);
    if (existing) {
      existing.amount += amount;
    } else {
      this.inventory.push({ name, amount });
    }
  }

  removeItem(name, amount = 1) {
    const existing = this.inventory.find((i) => i.name === name);
    if (!existing) return false;
    existing.amount -= amount;
    if (existing.amount <= 0) {
      this.inventory = this.inventory.filter((i) => i.name !== name);
    }
    return true;
  }

  hasItem(name, amount = 1) {
    const existing = this.inventory.find((i) => i.name === name);
    return existing ? existing.amount >= amount : false;
  }

  getItemCount(name) {
    const existing = this.inventory.find((i) => i.name === name);
    return existing ? existing.amount : 0;
  }

  // ---- Serialization ----
  reset() {
    this.flags = {};
    this.vars = {};
    this.inventory = [];
  }

  serialize() {
    return {
      flags: { ...this.flags },
      vars: { ...this.vars },
      inventory: this.inventory.map((i) => ({ ...i })),
    };
  }

  deserialize(data) {
    if (!data) return;
    this.flags = data.flags || {};
    this.vars = data.vars || {};
    this.inventory = (data.inventory || []).map((i) => ({ ...i }));
  }
}
