/**
 * Loads and caches images, audio, and JSON data.
 * Supports progress tracking and programmatic asset registration.
 */
export class AssetManager {
  constructor() {
    this.images = new Map();
    this.audio = new Map();
    this.data = new Map();
    this._loading = 0;
    this._loaded = 0;
  }

  get progress() {
    return this._loading === 0 ? 1 : this._loaded / this._loading;
  }

  get isLoading() {
    return this._loaded < this._loading;
  }

  /** Load an image from URL */
  loadImage(key, url) {
    this._loading++;
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.images.set(key, img);
        this._loaded++;
        resolve(img);
      };
      img.onerror = () => {
        this._loaded++;
        reject(new Error(`Failed to load image: ${url}`));
      };
      img.src = url;
    });
  }

  /** Register a pre-created image (e.g., from canvas) */
  registerImage(key, imageOrCanvas) {
    this.images.set(key, imageOrCanvas);
  }

  /** Get a loaded image */
  getImage(key) {
    return this.images.get(key);
  }

  /** Load JSON data */
  async loadJSON(key, url) {
    this._loading++;
    try {
      const resp = await fetch(url);
      const json = await resp.json();
      this.data.set(key, json);
      this._loaded++;
      return json;
    } catch (e) {
      this._loaded++;
      throw new Error(`Failed to load JSON: ${url}`);
    }
  }

  /** Register data directly */
  registerData(key, data) {
    this.data.set(key, data);
  }

  getData(key) {
    return this.data.get(key);
  }

  /** Load audio file */
  loadAudio(key, url) {
    this._loading++;
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.oncanplaythrough = () => {
        this.audio.set(key, audio);
        this._loaded++;
        resolve(audio);
      };
      audio.onerror = () => {
        this._loaded++;
        reject(new Error(`Failed to load audio: ${url}`));
      };
      audio.src = url;
    });
  }

  getAudio(key) {
    return this.audio.get(key);
  }

  /** Load multiple assets at once */
  async loadAll(manifest) {
    const promises = [];
    if (manifest.images) {
      for (const [key, url] of Object.entries(manifest.images)) {
        promises.push(this.loadImage(key, url));
      }
    }
    if (manifest.audio) {
      for (const [key, url] of Object.entries(manifest.audio)) {
        promises.push(this.loadAudio(key, url));
      }
    }
    if (manifest.data) {
      for (const [key, url] of Object.entries(manifest.data)) {
        promises.push(this.loadJSON(key, url));
      }
    }
    return Promise.allSettled(promises);
  }
}
