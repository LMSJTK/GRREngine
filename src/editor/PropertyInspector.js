import { getEntityType, ENTITY_CATEGORIES } from '../ecs/EntityTypes.js';
import { ScriptEditor } from './ScriptEditor.js';

/**
 * Property inspector panel - shows editable properties for a selected entity.
 * Dynamically generates form fields from the entity type's schema.
 */
export class PropertyInspector {
  constructor(container, engine) {
    this.container = container;
    this.engine = engine;
    this.entity = null;
    this.onChange = null; // callback when a property changes
    this._scriptEditors = [];

    this._panel = document.createElement('div');
    this._panel.className = 'property-inspector';
    this._panel.style.display = 'none';
    this.container.appendChild(this._panel);
  }

  /** Show properties for an entity, or hide if null */
  inspect(entity) {
    this.entity = entity;
    if (!entity) {
      this._panel.style.display = 'none';
      return;
    }
    this._panel.style.display = '';
    this._destroyScriptEditors();
    this._render();
  }

  _render() {
    const entity = this.entity;
    if (!entity) return;

    const typeDef = getEntityType(entity.type);
    const cat = ENTITY_CATEGORIES[typeDef?.category];

    this._panel.innerHTML = '';

    // Header
    const header = document.createElement('div');
    header.className = 'inspector-header';
    header.innerHTML = `
      <span class="inspector-type-badge" style="background:${cat?.color || '#888'}">${typeDef?.name || entity.type}</span>
      <button class="inspector-delete-btn" title="Delete entity (Del)">&#x2716;</button>
    `;
    header.querySelector('.inspector-delete-btn').addEventListener('click', () => {
      if (this.onDelete) this.onDelete(entity);
    });
    this._panel.appendChild(header);

    // Position (always shown)
    const posDiv = document.createElement('div');
    posDiv.className = 'inspector-field';
    posDiv.innerHTML = `
      <label class="inspector-label">Position</label>
      <div class="inspector-pos">
        <label>X: <input type="number" class="inspector-input inspector-input-sm" data-field="x" value="${entity.x}" step="16" /></label>
        <label>Y: <input type="number" class="inspector-input inspector-input-sm" data-field="y" value="${entity.y}" step="16" /></label>
      </div>
    `;
    posDiv.querySelectorAll('input').forEach((input) => {
      input.addEventListener('change', (e) => {
        const field = e.target.dataset.field;
        entity[field] = parseInt(e.target.value, 10) || 0;
        this._notifyChange();
      });
    });
    this._panel.appendChild(posDiv);

    // Type-specific properties from schema
    if (typeDef?.schema) {
      for (const prop of typeDef.schema) {
        // Width/height target the entity directly
        if (prop.target === 'size') {
          this._addSizeField(prop, entity);
          continue;
        }
        this._addPropertyField(prop, entity);
      }
    }

    // Prefab save button
    const prefabBtn = document.createElement('button');
    prefabBtn.className = 'control-btn inspector-prefab-btn';
    prefabBtn.textContent = 'Save as Prefab';
    prefabBtn.addEventListener('click', () => {
      if (this.onSavePrefab) this.onSavePrefab(entity);
    });
    this._panel.appendChild(prefabBtn);
  }

  _addPropertyField(prop, entity) {
    const value = entity.properties[prop.key];
    const wrapper = document.createElement('div');
    wrapper.className = 'inspector-field';

    const label = document.createElement('label');
    label.className = 'inspector-label';
    label.textContent = prop.label;
    wrapper.appendChild(label);

    let input;

    switch (prop.type) {
      case 'string':
        input = document.createElement('input');
        input.type = 'text';
        input.className = 'inspector-input';
        input.value = value ?? '';
        input.addEventListener('input', (e) => {
          entity.properties[prop.key] = e.target.value;
          this._notifyChange();
        });
        wrapper.appendChild(input);
        break;

      case 'number':
        input = document.createElement('input');
        input.type = 'number';
        input.className = 'inspector-input';
        input.value = value ?? 0;
        if (prop.min !== undefined) input.min = prop.min;
        if (prop.max !== undefined) input.max = prop.max;
        input.addEventListener('change', (e) => {
          entity.properties[prop.key] = parseFloat(e.target.value) || 0;
          this._notifyChange();
        });
        wrapper.appendChild(input);
        break;

      case 'select':
        input = document.createElement('select');
        input.className = 'inspector-input';
        for (const opt of prop.options) {
          const option = document.createElement('option');
          option.value = opt;
          option.textContent = opt;
          if (opt === value) option.selected = true;
          input.appendChild(option);
        }
        input.addEventListener('change', (e) => {
          entity.properties[prop.key] = e.target.value;
          this._notifyChange();
        });
        wrapper.appendChild(input);
        break;

      case 'stringarray':
        input = document.createElement('textarea');
        input.className = 'inspector-input inspector-textarea';
        input.value = Array.isArray(value) ? value.join('\n') : '';
        input.rows = 3;
        input.placeholder = 'One line per entry';
        input.addEventListener('input', (e) => {
          entity.properties[prop.key] = e.target.value.split('\n').filter((s) => s.length > 0);
          this._notifyChange();
        });
        wrapper.appendChild(input);
        break;

      case 'actionlist': {
        const actionsWrapper = document.createElement('div');
        actionsWrapper.className = 'inspector-actions-wrapper';
        wrapper.appendChild(actionsWrapper);

        const editor = new ScriptEditor(actionsWrapper, (updatedActions) => {
          entity.properties[prop.key] = updatedActions;
          this._notifyChange();
        });
        editor.render(Array.isArray(value) ? value : []);
        this._scriptEditors.push(editor);
        this._panel.appendChild(wrapper);
        return; // don't append twice
      }

      case 'sprite': {
        input = document.createElement('select');
        input.className = 'inspector-input';
        // Gather available sprites from asset manager
        const sprites = this._getAvailableSprites(entity.type);
        for (const s of sprites) {
          const option = document.createElement('option');
          option.value = s.key;
          option.textContent = s.label;
          if (s.key === value) option.selected = true;
          input.appendChild(option);
        }
        input.addEventListener('change', (e) => {
          entity.properties[prop.key] = e.target.value;
          this._notifyChange();
          this._render(); // re-render to reflect change
        });
        wrapper.appendChild(input);
        break;
      }
    }

    this._panel.appendChild(wrapper);
  }

  _addSizeField(prop, entity) {
    const wrapper = document.createElement('div');
    wrapper.className = 'inspector-field';
    const label = document.createElement('label');
    label.className = 'inspector-label';
    label.textContent = prop.label;
    wrapper.appendChild(label);

    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'inspector-input';
    input.value = entity[prop.key] ?? prop.min ?? 16;
    if (prop.min !== undefined) input.min = prop.min;
    if (prop.max !== undefined) input.max = prop.max;
    input.step = 8;
    input.addEventListener('change', (e) => {
      entity[prop.key] = parseInt(e.target.value, 10) || 16;
      this._notifyChange();
    });
    wrapper.appendChild(input);
    this._panel.appendChild(wrapper);
  }

  _getAvailableSprites(entityType) {
    const sprites = [];
    const assets = this.engine.assets;
    const typeDef = getEntityType(entityType);

    // Built-in sprites relevant to this type
    const prefixes = {
      npc: ['npc_sprite'],
      enemy: ['enemy_'],
      item: ['item_'],
    };

    const prefix = prefixes[entityType] || [];

    for (const [key] of assets.images) {
      const matches = prefix.length === 0 || prefix.some((p) => key.startsWith(p));
      if (matches && key !== 'player_sprite') {
        sprites.push({ key, label: key.replace(/_/g, ' ') });
      }
    }

    // Also include any custom imported sprites
    for (const [key] of assets.images) {
      if (key.startsWith('custom_') && !sprites.find((s) => s.key === key)) {
        sprites.push({ key, label: key.replace('custom_', '').replace(/_/g, ' ') });
      }
    }

    return sprites;
  }

  _notifyChange() {
    if (this.onChange) this.onChange(this.entity);
  }

  _destroyScriptEditors() {
    for (const editor of this._scriptEditors) {
      editor.destroy();
    }
    this._scriptEditors = [];
  }

  /** External hook for entity deletion */
  onDelete = null;

  /** External hook for prefab saving */
  onSavePrefab = null;
}
