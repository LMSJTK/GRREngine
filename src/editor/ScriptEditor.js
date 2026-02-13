import { ACTION_TYPES, ACTION_CATEGORIES, createDefaultAction, getActionTypeList } from '../game/ActionTypes.js';

/**
 * Script editor UI component - displays an editable list of actions
 * for triggers, NPCs, and other scriptable entities.
 */
export class ScriptEditor {
  constructor(container, onChange) {
    this._container = container;
    this._onChange = onChange;
    this._actions = [];
    this._el = null;
  }

  /** Render the script editor for a given action list */
  render(actions) {
    this._actions = actions || [];

    if (this._el) this._el.remove();

    this._el = document.createElement('div');
    this._el.className = 'script-editor';

    // Header
    const header = document.createElement('div');
    header.className = 'script-header';
    header.textContent = `Actions (${this._actions.length})`;
    this._el.appendChild(header);

    // Action list
    const list = document.createElement('div');
    list.className = 'script-action-list';

    this._actions.forEach((action, index) => {
      list.appendChild(this._renderAction(action, index));
    });

    this._el.appendChild(list);

    // Add action button
    const addBtn = document.createElement('button');
    addBtn.className = 'script-add-btn';
    addBtn.textContent = '+ Add Action';
    addBtn.addEventListener('click', () => {
      const newAction = createDefaultAction('show_dialog');
      this._actions.push(newAction);
      this._notifyChange();
      this.render(this._actions);
    });
    this._el.appendChild(addBtn);

    this._container.appendChild(this._el);
  }

  _renderAction(action, index) {
    const row = document.createElement('div');
    row.className = 'script-action-row';

    const typeDef = ACTION_TYPES[action.type];
    const catColor = ACTION_CATEGORIES[typeDef?.category]?.color || '#888';

    // Index number
    const numEl = document.createElement('span');
    numEl.className = 'script-action-num';
    numEl.textContent = `${index + 1}`;
    numEl.style.borderColor = catColor;
    row.appendChild(numEl);

    // Type selector
    const typeSelect = document.createElement('select');
    typeSelect.className = 'script-type-select';
    const typeList = getActionTypeList();

    // Group by category
    const grouped = {};
    for (const t of typeList) {
      if (!grouped[t.category]) grouped[t.category] = [];
      grouped[t.category].push(t);
    }

    for (const [catKey, types] of Object.entries(grouped)) {
      const group = document.createElement('optgroup');
      group.label = ACTION_CATEGORIES[catKey]?.label || catKey;
      for (const t of types) {
        const opt = document.createElement('option');
        opt.value = t.key;
        opt.textContent = t.name;
        if (t.key === action.type) opt.selected = true;
        group.appendChild(opt);
      }
      typeSelect.appendChild(group);
    }

    typeSelect.addEventListener('change', (e) => {
      const newType = e.target.value;
      this._actions[index] = createDefaultAction(newType);
      this._notifyChange();
      this.render(this._actions);
    });
    row.appendChild(typeSelect);

    // Parameters (compact inline)
    if (typeDef?.params) {
      const paramsDiv = document.createElement('div');
      paramsDiv.className = 'script-params';

      for (const paramDef of typeDef.params) {
        const paramEl = this._renderParam(action, index, paramDef);
        paramsDiv.appendChild(paramEl);
      }

      row.appendChild(paramsDiv);
    }

    // Controls (move up/down, delete)
    const controls = document.createElement('div');
    controls.className = 'script-action-controls';

    if (index > 0) {
      const upBtn = document.createElement('button');
      upBtn.className = 'script-ctrl-btn';
      upBtn.textContent = '\u25B2';
      upBtn.title = 'Move up';
      upBtn.addEventListener('click', () => {
        [this._actions[index - 1], this._actions[index]] = [this._actions[index], this._actions[index - 1]];
        this._notifyChange();
        this.render(this._actions);
      });
      controls.appendChild(upBtn);
    }

    if (index < this._actions.length - 1) {
      const downBtn = document.createElement('button');
      downBtn.className = 'script-ctrl-btn';
      downBtn.textContent = '\u25BC';
      downBtn.title = 'Move down';
      downBtn.addEventListener('click', () => {
        [this._actions[index], this._actions[index + 1]] = [this._actions[index + 1], this._actions[index]];
        this._notifyChange();
        this.render(this._actions);
      });
      controls.appendChild(downBtn);
    }

    const delBtn = document.createElement('button');
    delBtn.className = 'script-ctrl-btn script-ctrl-del';
    delBtn.textContent = '\u2715';
    delBtn.title = 'Remove action';
    delBtn.addEventListener('click', () => {
      this._actions.splice(index, 1);
      this._notifyChange();
      this.render(this._actions);
    });
    controls.appendChild(delBtn);

    row.appendChild(controls);

    return row;
  }

  _renderParam(action, actionIndex, paramDef) {
    const wrapper = document.createElement('div');
    wrapper.className = 'script-param';

    const label = document.createElement('span');
    label.className = 'script-param-label';
    label.textContent = paramDef.label;
    wrapper.appendChild(label);

    const value = action.params?.[paramDef.key] ?? paramDef.default;

    switch (paramDef.type) {
      case 'string': {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'script-param-input';
        input.value = value ?? '';
        input.placeholder = paramDef.label;
        input.addEventListener('input', (e) => {
          if (!action.params) action.params = {};
          action.params[paramDef.key] = e.target.value;
          this._notifyChange();
        });
        wrapper.appendChild(input);
        break;
      }

      case 'number': {
        const input = document.createElement('input');
        input.type = 'number';
        input.className = 'script-param-input script-param-num';
        input.value = value ?? 0;
        if (paramDef.min !== undefined) input.min = paramDef.min;
        if (paramDef.max !== undefined) input.max = paramDef.max;
        input.addEventListener('change', (e) => {
          if (!action.params) action.params = {};
          action.params[paramDef.key] = parseFloat(e.target.value) || 0;
          this._notifyChange();
        });
        wrapper.appendChild(input);
        break;
      }

      case 'boolean': {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'script-param-check';
        checkbox.checked = value !== false;
        checkbox.addEventListener('change', (e) => {
          if (!action.params) action.params = {};
          action.params[paramDef.key] = e.target.checked;
          this._notifyChange();
        });
        wrapper.appendChild(checkbox);
        break;
      }
    }

    return wrapper;
  }

  _notifyChange() {
    if (this._onChange) this._onChange(this._actions);
  }

  /** Remove the editor element */
  destroy() {
    if (this._el) {
      this._el.remove();
      this._el = null;
    }
  }
}
