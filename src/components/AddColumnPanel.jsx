import React, { useState, useMemo } from 'react';
import { DSPillSearch } from '../context/WorkspaceCtx.jsx';
import { GF_ENTITY_ATTRS, FPCheckbox } from './FilterPanel.jsx';
import { ENTITY_TYPES, EntityGlyph } from './entityTypes.jsx';
import { DrawerShell, useDrawerNav } from './DrawerShell.jsx';

// Every entity type the Knowledge Graph itself models — same set ENTITY_TYPES already
// drives for the graph canvas and the Details table's Type column.
const PANEL_ENTITY_KEYS = Object.keys(ENTITY_TYPES);
const SPECIFIC_SHOW_LIMIT = 8;

// A couple of entity types (group, ticket) have no dedicated GF_ENTITY_ATTRS schema — fall
// back to the same generic field set FilterPanel.jsx's getEntityAttrs() uses, so every entity
// still has something to add a column from.
const GENERIC_FALLBACK_FIELDS = [
  { id: 'name', label: 'Name', type: 'text' },
  { id: 'status', label: 'Status', type: 'enum', options: ['Active', 'Inactive'] },
  { id: 'created-date', label: 'Created Date', type: 'date' },
];
function fieldsFor(entityKey) {
  return GF_ENTITY_ATTRS[entityKey] || GENERIC_FALLBACK_FIELDS;
}

// "Common" isn't a hand-picked guess — it's whatever field labels are shared by more than one
// entity's real schema, computed from the data. Requiring *every* entity to share a label would
// zero the set out entirely just because a couple of entities (host, account) use their own
// naming convention — "shared by more than one" still captures the real Entity ID/Display
// Label/Type/... convention that most entities do follow, without those outliers erasing it.
function computeCommonLabels() {
  const counts = new Map();
  PANEL_ENTITY_KEYS.filter(k => GF_ENTITY_ATTRS[k]).forEach(k => {
    new Set(GF_ENTITY_ATTRS[k].map(f => f.label)).forEach(label => counts.set(label, (counts.get(label) || 0) + 1));
  });
  return new Set([...counts].filter(([, count]) => count > 1).map(([label]) => label));
}

function IcChevronDown() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
function IcPlus() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function FieldRow({ field, checked, disabled, onToggle }) {
  return (
    <label className={`fp-option-label fp-option-label--normal${disabled ? ' kg-addcol-field--disabled' : ''}`} onClick={() => !disabled && onToggle(field)}>
      <FPCheckbox checked={checked} onChange={() => !disabled && onToggle(field)} />
      {field.label}
    </label>
  );
}

function EntitySection({ entityKey, fields, globalQuery, selected, disabledLabels, commonLabels, onToggleField, onToggleAll }) {
  const [open, setOpen] = useState(false);
  const [localQuery, setLocalQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  const ent = ENTITY_TYPES[entityKey];

  const query = (globalQuery || localQuery).trim().toLowerCase();
  const visible = query ? fields.filter(f => f.label.toLowerCase().includes(query)) : fields;
  if (globalQuery && visible.length === 0) return null;

  const common = visible.filter(f => commonLabels.has(f.label));
  const specific = visible.filter(f => !commonLabels.has(f.label));
  const specificShown = showAll ? specific : specific.slice(0, SPECIFIC_SHOW_LIMIT);

  const isDisabled = f => disabledLabels.has(f.label);
  const isChecked = f => isDisabled(f) || selected.has(`${entityKey}:${f.id}`);

  const toggleable = fields.filter(f => !isDisabled(f));
  const selectedCount = toggleable.filter(f => selected.has(`${entityKey}:${f.id}`)).length;
  const allChecked = toggleable.length > 0 && selectedCount === toggleable.length;
  const someChecked = selectedCount > 0 && !allChecked;

  const expanded = open || !!globalQuery;

  return (
    <div className="fp-attr-group">
      <button className="fp-attr-group__btn" onClick={() => setOpen(o => !o)}>
        <span className="gf-attrs-entity-swatch" style={{ '--ent-tint': ent.tint, '--ent-stroke': ent.stroke }}>
          <EntityGlyph kind={ent.glyph} size={14} />
        </span>
        <span className="fp-attr-group__label">{ent.label}</span>
        <FPCheckbox checked={allChecked} indeterminate={someChecked} onChange={() => onToggleAll(entityKey, toggleable, !allChecked)} />
        <span className={`fp-chevron${expanded ? ' fp-chevron--open' : ''}`}><IcChevronDown /></span>
      </button>
      {expanded && (
        <div className="fp-options-wrap fp-options-wrap--open">
          <div className="fp-options">
            <div className="fp-options__search-row">
              <div className="fp-options__search-wrap">
                <DSPillSearch value={localQuery} onChange={setLocalQuery} placeholder={`Search in ${ent.label}`} width="100%" />
              </div>
            </div>
            {common.length > 0 && (
              <>
                <div className="kg-addcol-subhead">Common Fields</div>
                {common.map(f => (
                  <FieldRow key={f.id} field={f} checked={isChecked(f)} disabled={isDisabled(f)} onToggle={() => onToggleField(entityKey, f)} />
                ))}
              </>
            )}
            {specific.length > 0 && (
              <>
                <div className="kg-addcol-subhead">Entity Specific Fields</div>
                {specificShown.map(f => (
                  <FieldRow key={f.id} field={f} checked={isChecked(f)} disabled={isDisabled(f)} onToggle={() => onToggleField(entityKey, f)} />
                ))}
                {specific.length > SPECIFIC_SHOW_LIMIT && (
                  <button className="fp-show-more-btn" onClick={() => setShowAll(s => !s)}>
                    {showAll ? 'Show Less' : 'Show All'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Right-side panel for the KG Details tab's "Add Column" button — lists every entity type's
// fields as checkboxes (Common Fields shared across all entities, computed from the real
// schema, vs Entity Specific Fields) and reports the newly checked fields back via onAdd.
export default function AddColumnPanel({ existingColumnLabels = [], onAdd, onClose }) {
  const drawer = useDrawerNav();
  const close = () => drawer.close(onClose);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(() => new Set());

  const commonLabels = useMemo(() => computeCommonLabels(), []);
  const disabledLabels = useMemo(() => new Set(existingColumnLabels), [existingColumnLabels]);

  const toggleField = (entityKey, field) => {
    const id = `${entityKey}:${field.id}`;
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = (entityKey, toggleableFields, checkAll) => {
    setSelected(prev => {
      const next = new Set(prev);
      toggleableFields.forEach(f => {
        const id = `${entityKey}:${f.id}`;
        if (checkAll) next.add(id); else next.delete(id);
      });
      return next;
    });
  };

  const handleAdd = () => {
    const cols = [];
    selected.forEach(id => {
      const sep = id.indexOf(':');
      const entityKey = id.slice(0, sep);
      const fieldId = id.slice(sep + 1);
      const field = fieldsFor(entityKey).find(f => f.id === fieldId);
      if (field) cols.push({ id, label: field.label, entityKey, type: field.type });
    });
    if (cols.length) onAdd(cols);
    close();
  };

  return (
    <DrawerShell onClose={close} closing={drawer.closing} width="min(460px, 92vw)">
      <div className="kg-addcol-panel">
        <div className="kg-addcol-header">
          <div className="kg-addcol-title">Add column</div>
          <div className="kg-addcol-subtitle">Common fields apply across all entities. Entity-specific fields are added only to that entity.</div>
        </div>
        <div className="kg-addcol-search">
          <DSPillSearch value={search} onChange={setSearch} placeholder="Search Any" width="100%" />
        </div>
        <div className="kg-addcol-body">
          {PANEL_ENTITY_KEYS.map(key => (
            <EntitySection
              key={key}
              entityKey={key}
              fields={fieldsFor(key)}
              globalQuery={search}
              selected={selected}
              disabledLabels={disabledLabels}
              commonLabels={commonLabels}
              onToggleField={toggleField}
              onToggleAll={toggleAll}
            />
          ))}
        </div>
        <div className="kg-addcol-footer">
          <button className="ds-btn sz-md t-primary kg-addcol-submit" onClick={handleAdd}>
            <IcPlus /> Add Column(s)
          </button>
        </div>
      </div>
    </DrawerShell>
  );
}
