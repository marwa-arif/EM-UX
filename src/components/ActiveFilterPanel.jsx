import React, { useState, useMemo, useRef, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { DSPillSearch } from '../context/WorkspaceCtx.jsx'
import '../styles/active-filter-panel.css'

const ATTR_ENTITY = {
  'type-host':         'Host',
  'infra-type':        'Host',
  'data-source':       'Host',
  'score':             'Host',
  'asset-criticality': 'Host',
  'business-unit':     'Host',
  'type-assessment':   'Assessment',
  'saved-filter':      'Saved',
}

const IcClose = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

const SAVED_FILTER_NAMES = [
  'Critical Servers',
  'Corporate high risk assets',
  'Client data management',
  'Compliance monitoring',
  'Incident response plans',
  'Threat intel feeds',
]

const ENTITY_TREE = [
  { entity: 'Host',             relation: 'Host Has Finding' },
  { entity: 'Storage',          relation: 'Storage Has Finding' },
  { entity: 'Network',          relation: 'Network Has Finding' },
  { entity: 'Container',        relation: 'Container Has Finding' },
  { entity: 'Network Services', relation: 'Network Services Has Finding' },
  { entity: 'Cluster',          relation: 'Cluster Has Finding' },
  { entity: 'Identity',         relation: 'Identity Has Finding' },
]

const IMPLICIT_ENTITY_FILTERS = [
  { key: 'Activity Status', mode: 'INCLUDE', values: ['Active'] },
]

const IMPLICIT_FINDING_FILTERS = [
  { key: 'Activity Status', mode: 'INCLUDE', values: ['Active'] },
  { key: 'Contributed To',  mode: 'INCLUDE', op: 'OR', values: ['Exposure'] },
  { key: 'Status',          mode: 'INCLUDE', values: ['Open'] },
]

const PAGE_AFP_CONFIG = {
  'kg': {
    entityTree: [
      { entity: 'Host',              relation: null },
      { entity: 'Storage',           relation: null },
      { entity: 'Cluster',           relation: null },
      { entity: 'Identity',          relation: null },
      { entity: 'Network',           relation: null },
      { entity: 'Finding',           relation: null },
      { entity: 'Account',           relation: null },
      { entity: 'Group',             relation: null },
      { entity: 'Person',            relation: null },
      { entity: 'Application',       relation: null },
      { entity: 'Vulnerability',     relation: null },
      { entity: 'Assessment',        relation: null },
      { entity: 'Container',         relation: null },
      { entity: 'Cloud Account',     relation: null },
      { entity: 'Ticket',            relation: null },
      { entity: 'Network Services',  relation: null },
      { entity: 'Network Interface', relation: null },
    ],
    implicitEntityFilters: [],
    implicitFindingFilters: [],
  },
  'discover/device': {
    entityTree: [{ entity: 'Host', relation: null }],
    implicitEntityFilters: [],
    implicitFindingFilters: [],
  },
  'discover/cloud': {
    entityTree: [
      { entity: 'Host',             relation: null },
      { entity: 'Storage',          relation: null },
      { entity: 'Network',          relation: null },
      { entity: 'Container',        relation: null },
      { entity: 'Network Services', relation: null },
      { entity: 'Cluster',          relation: null },
    ],
    implicitEntityFilters: [],
    implicitFindingFilters: [],
  },
  'discover/identity': {
    entityTree: [
      { entity: 'Identity', relation: null },
      { entity: 'Person',   relation: null },
      { entity: 'Account',  relation: null },
    ],
    implicitEntityFilters: [],
    implicitFindingFilters: [],
  },
  'workspace/report': {
    entityTree: [{ entity: 'Host', relation: null }],
    implicitEntityFilters: [],
    implicitFindingFilters: [],
  },
}

function getAfpConfig(pageId) {
  return PAGE_AFP_CONFIG[pageId] || {
    entityTree: ENTITY_TREE,
    implicitEntityFilters: IMPLICIT_ENTITY_FILTERS,
    implicitFindingFilters: IMPLICIT_FINDING_FILTERS,
  }
}

// ── Inline custom dropdown ────────────────────────────────────────────────────
function ModalDropdown({ value, onChange, options, placeholder = 'Select', searchable = false }) {
  const [open, setOpen]     = useState(false)
  const [search, setSearch] = useState('')
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 })
  const btnRef  = useRef(null)
  const listRef = useRef(null)

  const filtered = searchable && search.trim()
    ? options.filter(o => o.toLowerCase().includes(search.toLowerCase()))
    : options

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      const inBtn  = btnRef.current?.contains(e.target)
      const inList = listRef.current?.contains(e.target)
      if (!inBtn && !inList) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  useEffect(() => { if (!open) setSearch('') }, [open])

  const handleToggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setDropPos({ top: r.bottom + 4, left: r.left, width: r.width })
    }
    setOpen(v => !v)
  }

  // top/left/width are runtime-calculated pixel positions — must stay inline
  const listPosVars = { '--dd-top': `${dropPos.top}px`, '--dd-left': `${dropPos.left}px`, '--dd-width': `${dropPos.width}px` }

  const list = open ? ReactDOM.createPortal(
    <div ref={listRef} className="afp-dd-list" style={listPosVars}>
      {searchable && (
        <div className="afp-dd-search">
          <DSPillSearch value={search} onChange={setSearch} placeholder="Search..." width="100%" />
        </div>
      )}
      <div className="afp-dd-options">
        {filtered.length === 0 ? (
          <div className="afp-dd-empty">No results</div>
        ) : filtered.map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => { onChange(opt); setOpen(false) }}
            className={`afp-dd-opt${value === opt ? ' afp-dd-opt--selected' : ''}`}
          >
            {value === opt
              ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--pai-indigo)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="afp-dd-check-icon"><polyline points="20 6 9 17 4 12"/></svg>
              : <span className="afp-dd-check-spacer" />
            }
            {opt}
          </button>
        ))}
      </div>
    </div>,
    document.body
  ) : null

  return (
    <div className="afp-dd-wrap">
      <button
        ref={btnRef}
        type="button"
        onClick={handleToggle}
        className={`afp-dd-trigger${open ? ' afp-dd-trigger--open' : ''}${value ? ' afp-dd-trigger--has-value' : ''}`}
      >
        <span className="afp-dd-value">{value || placeholder}</span>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="var(--pai-fg3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className={`afp-dd-chevron${open ? ' afp-dd-chevron--open' : ''}`}
        >
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>
      {list}
    </div>
  )
}

// ── Save Filter Modal ─────────────────────────────────────────────────────────
export function SaveFilterModal({ onClose, onSave }) {
  const [filterName, setFilterName]      = useState('')
  const [description, setDescription]   = useState('')
  const [availability, setAvailability] = useState('Private')
  const [overwrite, setOverwrite]        = useState('')

  const canCreate = filterName.trim().length > 0 || overwrite.length > 0

  const handleCreate = () => {
    if (!canCreate) return
    if (overwrite) {
      onSave?.({ overwrite })
    } else {
      onSave?.({ filterName: filterName.trim(), description, availability })
    }
    onClose()
  }

  return ReactDOM.createPortal(
    <>
      <div className="sfm-overlay" onMouseDown={onClose} />
      <div className="sfm-dialog" onMouseDown={e => e.stopPropagation()}>

        <div className="sfm-header">
          <div className="sfm-icon-wrap">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--pai-indigo)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4">
              <path d="M13.5 5.207V13a.5.5 0 0 1-.5.5H3a.5.5 0 0 1-.5-.5V3a.5.5 0 0 1 .5-.5h7.793l2.207 2.207Z"/>
              <path d="M5 13.5V9.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 .5.5v4"/>
              <path d="M9.5 4.5H6"/>
            </svg>
          </div>
          <span className="sfm-title">Create new/Overwrite existing</span>
          <button onClick={onClose} className="sfm-close"><IcClose /></button>
        </div>

        <div className="sfm-body">
          <p className="sfm-desc">Filter will be saved for future rapid filtering.</p>

          <div className="sfm-section">
            <div className="sfm-section-header">
              <span className="sfm-section-label">Create Filter</span>
              <div className="sfm-divider" />
            </div>
            <div className="sfm-field">
              <label className="sfm-field-label">Filter Name</label>
              <input autoFocus type="text" value={filterName} onChange={e => setFilterName(e.target.value)} className="sfm-input" />
            </div>
            <div className="sfm-field">
              <label className="sfm-field-label">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="sfm-textarea" />
            </div>
            <div className="sfm-field">
              <label className="sfm-field-label">Availability</label>
              <ModalDropdown value={availability} onChange={setAvailability} options={['Private', 'Public']} />
            </div>
          </div>

          <div className="sfm-or-divider">
            <div className="sfm-or-line" />
            <span className="sfm-or-text">OR</span>
            <div className="sfm-or-line" />
          </div>

          <div className="sfm-section">
            <div className="sfm-section-header">
              <span className="sfm-section-label">Overwrite existing filter</span>
              <div className="sfm-divider" />
            </div>
            <ModalDropdown value={overwrite} onChange={setOverwrite} options={SAVED_FILTER_NAMES} placeholder="Select any" searchable />
          </div>
        </div>

        <div className="sfm-footer">
          <button onClick={onClose} className="sfm-cancel">Cancel</button>
          <button onClick={handleCreate} disabled={!canCreate} className={`sfm-create${!canCreate ? ' sfm-create--disabled' : ''}`}>
            Create
          </button>
        </div>
      </div>
    </>,
    document.body
  )
}

// ── Active Filter Panel ───────────────────────────────────────────────────────
export default function ActiveFilterPanel({ activeFilters = [], onRemove, onClear, onClose, position, pageId }) {
  const [implicitFilters, setImplicitFilters] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [showSaveModal, setShowSaveModal]       = useState(false)

  const { entityTree, implicitEntityFilters, implicitFindingFilters } = getAfpConfig(pageId)

  const savedFilterIdx  = activeFilters.findIndex(f => f.attrId === 'saved-filter')
  const savedFilterChip = savedFilterIdx >= 0 ? activeFilters[savedFilterIdx] : null

  const entityGroups = useMemo(() => {
    const entities = new Map()
    activeFilters.forEach((chip, idx) => {
      const entity = ATTR_ENTITY[chip.attrId] || 'Host'
      if (!entities.has(entity)) entities.set(entity, new Map())
      const attrs = entities.get(entity)
      if (!attrs.has(chip.attrId)) attrs.set(chip.attrId, { key: chip.key, values: [], indices: [] })
      const a = attrs.get(chip.attrId)
      a.values.push(chip.value)
      a.indices.push(idx)
    })
    return Array.from(entities.entries()).map(([entity, attrs]) => ({
      entity,
      attrs: Array.from(attrs.values()),
    }))
  }, [activeFilters])

  // top/right are runtime-calculated pixel positions — must stay inline
  const panelPosVars = {
    '--afp-top':   `${position?.top  ?? 95}px`,
    '--afp-right': `${position?.right ?? 16}px`,
  }

  const panel = (
    <>
      <div className="afp-backdrop" onMouseDown={onClose} />
      <div className="afp-panel" style={panelPosVars}>

        <div className="afp-header">
          <div className="afp-header-left">
            <span className="afp-title">Active Filter Preview</span>
          </div>
          <div className="afp-header-right">
            <label className="afp-toggle-wrap">
              <div
                className={`afp-toggle${implicitFilters ? ' afp-toggle--on' : ''}`}
                onClick={() => setImplicitFilters(v => !v)}
              >
                <div className="afp-toggle-thumb" />
              </div>
              <span className="afp-toggle-label">Implicit Filters</span>
            </label>
            <button className="afp-close-btn" onClick={onClose}><IcClose /></button>
          </div>
        </div>

        <div className="afp-body">
          {savedFilterChip && (
            <div className="afp-saved-filter-banner">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="afp-saved-filter-banner__icon">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              </svg>
              <span className="afp-saved-filter-banner__label">Saved Filter applied</span>
              <span className="afp-saved-filter-banner__name">{savedFilterChip.value}</span>
              <button className="afp-fc-remove" title="Remove saved filter" onClick={() => onRemove?.(savedFilterIdx)}>×</button>
            </div>
          )}
          {entityTree.map(({ entity, relation }) => {
            const explicitAttrs    = entityGroups.find(g => g.entity === entity)?.attrs || []
            const showEntityWhere  = explicitAttrs.length > 0 || implicitFilters
            const showFindingWhere = implicitFilters

            return (
              <div key={entity} className="afp-entity-block">
                <span className="afp-entity-chip">{entity}</span>

                <div className="afp-entity-content">
                  {showEntityWhere && (
                    <>
                      <span className="afp-where">where</span>
                      <div className="afp-filter-chips">
                        {explicitAttrs.map((attr, i) => (
                          <span key={i} className="afp-filter-chip">
                            <span className="afp-fc-label">{attr.key.replace(/ · .*$/, '')}</span>
                            <span className="afp-fc-sep">&nbsp;:&nbsp;</span>
                            <span className="afp-fc-badge">[INCLUDE]</span>
                            {attr.values.length > 1 && <span className="afp-fc-badge afp-fc-badge--op">[OR]</span>}
                            <span className="afp-fc-values">&nbsp;{attr.values.join(', ')}</span>
                            <button className="afp-fc-remove" title="Remove filter" onClick={() => attr.indices.slice().reverse().forEach(idx => onRemove?.(idx))}>×</button>
                          </span>
                        ))}
                        {implicitFilters && implicitEntityFilters.map(f => (
                          <span key={f.key} className="afp-filter-chip">
                            <span className="afp-fc-label">{f.key}</span>
                            <span className="afp-fc-sep">&nbsp;:&nbsp;</span>
                            <span className="afp-fc-badge">[{f.mode}]</span>
                            <span className="afp-fc-values">&nbsp;{f.values.join(', ')}</span>
                          </span>
                        ))}
                      </div>
                    </>
                  )}

                  {relation && (
                    <>
                      <span className="afp-entity-chip afp-relation-chip">{relation}</span>
                      <div className="afp-entity-content">
                        <p className="afp-no-filters">No filters applied</p>
                        <span className="afp-entity-chip">Finding</span>
                        {showFindingWhere && (
                          <>
                            <span className="afp-where">where</span>
                            <div className="afp-filter-chips">
                              {implicitFindingFilters.map(f => (
                                <span key={f.key} className="afp-filter-chip">
                                  <span className="afp-fc-label">{f.key}</span>
                                  <span className="afp-fc-sep">&nbsp;:&nbsp;</span>
                                  <span className="afp-fc-badge">[{f.mode}]</span>
                                  {f.op && <span className="afp-fc-badge afp-fc-badge--op">[{f.op}]</span>}
                                  <span className="afp-fc-values">&nbsp;{f.values.join(', ')}</span>
                                </span>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="afp-footer">
          <button className="afp-reset-btn" data-tooltip="Will only reset explicit filters" onClick={() => setShowResetConfirm(true)}>
            Reset Filters
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 7.2561C8.84388 7.2562 9.5127 7.92682 9.5127 8.76978C9.5126 9.61265 8.84382 10.2824 8 10.2825C7.15609 10.2825 6.48642 9.61271 6.48633 8.76978C6.48633 7.92676 7.15603 7.2561 8 7.2561Z" fill="currentColor" stroke="currentColor" strokeWidth="0.555556"/>
              <path d="M3.26953 8.76914C3.26953 9.70481 3.54697 10.6195 4.06676 11.3974C4.58655 12.1754 5.32534 12.7818 6.18972 13.1399C7.05409 13.4979 8.00523 13.5916 8.92285 13.4091C9.84047 13.2265 10.6834 12.776 11.3449 12.1143C12.0065 11.4527 12.457 10.6098 12.6395 9.69208C12.8221 8.77439 12.7284 7.82317 12.3704 6.95873C12.0123 6.09428 11.406 5.35543 10.6281 4.8356C9.87356 4.3314 8.99047 4.05522 8.08433 4.03906" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7.80005 5.6189L5.68774 4.02417L7.80005 2.42944V5.6189Z" fill="currentColor" stroke="currentColor" strokeWidth="0.555556"/>
            </svg>
          </button>
          <button className="afp-save-btn" onClick={() => setShowSaveModal(true)}>
            Save Filter
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13.5 5.207V13a.5.5 0 0 1-.5.5H3a.5.5 0 0 1-.5-.5V3a.5.5 0 0 1 .5-.5h7.793l2.207 2.207Z"/>
              <path d="M5 13.5V9.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 .5.5v4"/>
              <path d="M9.5 4.5H6"/>
            </svg>
          </button>
        </div>
      </div>

      {showSaveModal && (
        <SaveFilterModal
          onClose={() => setShowSaveModal(false)}
          onSave={(data) => { console.log('Filter saved:', data) }}
        />
      )}

      {showResetConfirm && (
        <div className="afp-modal-overlay" onMouseDown={e => { if (e.target === e.currentTarget) setShowResetConfirm(false) }}>
          <div className="afp-modal">
            <h3 className="afp-modal-title danger">Reset All Filters</h3>
            <p className="afp-modal-body">
              Removes all explicit filters from this view. This can't be undone.
            </p>
            <div className="afp-modal-actions">
              <button className="afp-modal-cancel" onClick={() => setShowResetConfirm(false)}>Cancel</button>
              <button className="afp-modal-confirm" onClick={() => { setShowResetConfirm(false); onClear?.(); onClose() }}>Reset Filters</button>
            </div>
          </div>
        </div>
      )}
    </>
  )

  return ReactDOM.createPortal(panel, document.body)
}
