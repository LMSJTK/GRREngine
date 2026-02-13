/**
 * Handles importing custom sprite images (PNG) into the engine.
 * Registers them in the AssetManager so they can be assigned to entities or tiles.
 */
export class SpriteImporter {
  constructor(engine) {
    this.engine = engine;
    this.customSprites = []; // track imported sprite keys
    this.onImport = null; // callback when a sprite is imported
  }

  /** Open file picker and import a sprite */
  openImportDialog() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg,image/gif,image/webp';
    input.multiple = true;
    input.onchange = (e) => {
      for (const file of e.target.files) {
        this._importFile(file);
      }
    };
    input.click();
  }

  /** Import a single file */
  _importFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Generate a safe key from filename
        const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
        let key = `custom_${baseName}`;

        // Avoid collisions
        let suffix = 0;
        while (this.engine.assets.getImage(key)) {
          suffix++;
          key = `custom_${baseName}_${suffix}`;
        }

        this.engine.assets.registerImage(key, img);
        this.customSprites.push({
          key,
          name: baseName.replace(/_/g, ' '),
          width: img.width,
          height: img.height,
        });

        console.log(`Imported sprite: ${key} (${img.width}x${img.height})`);

        if (this.onImport) this.onImport(key, img);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  /** Import as a new tile type */
  importAsTile(key, name, solid = false) {
    const img = this.engine.assets.getImage(key);
    if (!img) return null;

    const tileSet = this.engine.tileSet;
    // Find next available tile ID
    let nextId = 0;
    while (tileSet.get(nextId)) nextId++;

    tileSet.define(nextId, { name, image: img, solid });
    return nextId;
  }

  /** Get all custom sprites */
  getCustomSprites() {
    return this.customSprites;
  }

  /** Serialize custom sprite references (not the actual image data) */
  serialize() {
    return this.customSprites.map((s) => ({
      key: s.key,
      name: s.name,
      width: s.width,
      height: s.height,
    }));
  }
}
