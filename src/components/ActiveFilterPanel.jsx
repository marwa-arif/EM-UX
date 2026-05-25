import React, { useState, useMemo, useRef, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { DSPillSearch } from '../context/WorkspaceCtx.jsx'

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

const IcFilter = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--pai-indigo)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
)


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

// ── Inline custom dropdown (no native <select>) ───────────────────────────────
// Each option row is 38px tall (9px padding top+bottom + ~20px line-height)
const OPTION_ROW_H = 38
const MAX_VISIBLE   = 4

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

  // clear search when closed
  useEffect(() => { if (!open) setSearch('') }, [open])

  const handleToggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setDropPos({ top: r.bottom + 4, left: r.left, width: r.width })
    }
    setOpen(v => !v)
  }

  const list = open ? ReactDOM.createPortal(
    <div
      ref={listRef}
      style={{
        position: 'fixed', top: dropPos.top, left: dropPos.left, width: dropPos.width,
        zIndex: 10020,
        background: 'var(--card-bg)', border: '1px solid var(--pai-border-strong)',
        borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Search bar */}
      {searchable && (
        <div style={{ padding: '8px 8px 6px', flexShrink: 0 }}>
          <DSPillSearch
            value={search}
            onChange={setSearch}
            placeholder="Search..."
            width="100%"
          />
        </div>
      )}

      {/* Options list — max 4 rows visible */}
      <div style={{ overflowY: 'auto', maxHeight: OPTION_ROW_H * MAX_VISIBLE }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '12px', fontSize: 13, color: 'var(--pai-fg3)', textAlign: 'center' }}>No results</div>
        ) : filtered.map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => { onChange(opt); setOpen(false) }}
            onMouseEnter={e => { if (value !== opt) e.currentTarget.style.background = 'var(--shell-raised)' }}
            onMouseLeave={e => { if (value !== opt) e.currentTarget.style.background = 'none' }}
            style={{
              width: '100%', padding: '9px 12px', border: 'none', textAlign: 'left',
              fontSize: 14, color: 'var(--pai-fg1)', cursor: 'pointer', fontFamily: 'inherit',
              background: value === opt ? 'var(--pai-indigo-tint)' : 'none',
              display: 'flex', alignItems: 'center', gap: 8, boxSizing: 'border-box',
            }}
          >
            {value === opt
              ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--pai-indigo)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><polyline points="20 6 9 17 4 12"/></svg>
              : <span style={{ width: 12, flexShrink: 0 }} />
            }
            {opt}
          </button>
        ))}
      </div>
    </div>,
    document.body
  ) : null

  return (
    <div data-modal-dropdown="" style={{ position: 'relative' }}>
      <button
        ref={btnRef}
        type="button"
        onClick={handleToggle}
        style={{
          width: '100%', height: 40, padding: '0 12px',
          background: 'var(--card-bg)',
          border: `1px solid ${open ? 'var(--pai-indigo)' : 'var(--pai-border-strong)'}`,
          borderRadius: 8, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
          fontSize: 14, color: value ? 'var(--pai-fg1)' : 'var(--pai-fg3)',
          fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none',
        }}
      >
        <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {value || placeholder}
        </span>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="var(--pai-fg3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }}
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
      <div style={{ position: 'fixed', inset: 0, zIndex: 10005, background: 'rgba(0,0,0,0.45)' }} onMouseDown={onClose} />
      <div
        style={{
          position: 'fixed', zIndex: 10006,
          top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 400, maxHeight: 'calc(100vh - 48px)', background: 'var(--card-bg)',
          borderRadius: 12, boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
        onMouseDown={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px', borderBottom: '1px solid var(--shell-border)' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: 'var(--pai-indigo-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--pai-indigo)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4">
              <path d="M13.5 5.207V13a.5.5 0 0 1-.5.5H3a.5.5 0 0 1-.5-.5V3a.5.5 0 0 1 .5-.5h7.793l2.207 2.207Z"/>
              <path d="M5 13.5V9.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 .5.5v4"/>
              <path d="M9.5 4.5H6"/>
            </svg>
          </div>
          <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: 'var(--pai-fg1)' }}>
            Create new/Overwrite existing
          </span>
          <button onClick={onClose} style={{ width: 28, height: 28, padding: 0, flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--pai-fg3)', borderRadius: 6 }}>
            <IcClose />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', flex: 1, minHeight: 0 }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--pai-fg2)', lineHeight: 1.5 }}>
            Filter will be saved for future rapid filtering.
          </p>

          {/* Create Filter section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--pai-fg2)', whiteSpace: 'nowrap' }}>Create Filter</span>
              <div style={{ flex: 1, height: 1, background: 'var(--pai-border-strong)' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--pai-fg1)' }}>Filter Name</label>
              <input
                autoFocus
                type="text"
                value={filterName}
                onChange={e => setFilterName(e.target.value)}
                style={{
                  width: '100%', height: 40, padding: '0 12px', boxSizing: 'border-box',
                  border: '1px solid var(--pai-border-strong)', borderRadius: 8,
                  fontSize: 14, color: 'var(--pai-fg1)', fontFamily: 'inherit',
                  outline: 'none', background: 'var(--card-bg)',
                }}
                onFocus={e => { e.target.style.borderColor = 'var(--pai-indigo)' }}
                onBlur={e => { e.target.style.borderColor = 'var(--pai-border-strong)' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--pai-fg1)' }}>Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                style={{
                  width: '100%', padding: '10px 12px', boxSizing: 'border-box',
                  border: '1px solid var(--pai-border-strong)', borderRadius: 8,
                  fontSize: 14, color: 'var(--pai-fg1)', fontFamily: 'inherit',
                  outline: 'none', background: 'var(--card-bg)', resize: 'vertical', lineHeight: 1.5,
                }}
                onFocus={e => { e.target.style.borderColor = 'var(--pai-indigo)' }}
                onBlur={e => { e.target.style.borderColor = 'var(--pai-border-strong)' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--pai-fg1)' }}>Availability</label>
              <ModalDropdown value={availability} onChange={setAvailability} options={['Private', 'Public']} />
            </div>
          </div>

          {/* OR divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--pai-border-strong)' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--pai-fg3)', letterSpacing: '0.04em' }}>OR</span>
            <div style={{ flex: 1, height: 1, background: 'var(--pai-border-strong)' }} />
          </div>

          {/* Overwrite section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--pai-fg2)', whiteSpace: 'nowrap' }}>Overwrite existing filter</span>
              <div style={{ flex: 1, height: 1, background: 'var(--pai-border-strong)' }} />
            </div>
            <ModalDropdown value={overwrite} onChange={setOverwrite} options={SAVED_FILTER_NAMES} placeholder="Select any" searchable />
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, padding: '12px 20px', borderTop: '1px solid var(--shell-border)' }}>
          <button
            onClick={onClose}
            style={{ height: 36, padding: '0 20px', borderRadius: 44, background: 'var(--card-bg)', border: '1px solid var(--pai-border-strong)', fontSize: 14, fontWeight: 500, color: 'var(--pai-fg1)', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!canCreate}
            style={{
              height: 36, padding: '0 20px', borderRadius: 44, border: 'none',
              background: canCreate ? 'var(--pai-indigo)' : 'var(--shell-border)',
              fontSize: 14, fontWeight: 500,
              color: canCreate ? 'var(--card-bg)' : 'var(--pai-fg3)',
              cursor: canCreate ? 'pointer' : 'not-allowed', fontFamily: 'inherit',
              transition: 'background 150ms, color 150ms',
            }}
          >
            Create
          </button>
        </div>
      </div>
    </>,
    document.body
  )
}

export default function ActiveFilterPanel({ activeFilters = [], onRemove, onClear, onClose, position }) {
  const [implicitFilters, setImplicitFilters] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [showSaveModal, setShowSaveModal]       = useState(false)

  // Group chips by entity → then by attrId, combining values
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

  const panel = (
    <>
      {/* transparent click-catcher — no visual overlay */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }} onMouseDown={onClose} />
      <div
        className="afp-panel"
        style={{ position: 'fixed', top: position?.top ?? 95, right: position?.right ?? 16, zIndex: 9999 }}
      >

        {/* ── Header ── */}
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

        {/* ── Body ── */}
        <div className="afp-body">
          {ENTITY_TREE.map(({ entity, relation }) => {
            const explicitAttrs = entityGroups.find(g => g.entity === entity)?.attrs || []
            const showEntityWhere  = explicitAttrs.length > 0 || implicitFilters
            const showFindingWhere = implicitFilters

            return (
              <div key={entity} className="afp-entity-block">
                <span className="afp-entity-chip">{entity}</span>

                <div className="afp-entity-content">
                  {/* Entity-level filters */}
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
                        {implicitFilters && IMPLICIT_ENTITY_FILTERS.map(f => (
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

                  {/* Has Finding relation */}
                  <span className="afp-entity-chip afp-relation-chip">{relation}</span>
                  <div className="afp-entity-content">
                    <p className="afp-no-filters">No filters applied</p>
                    <span className="afp-entity-chip">Finding</span>

                    {/* Finding-level implicit filters */}
                    {showFindingWhere && (
                      <>
                        <span className="afp-where">where</span>
                        <div className="afp-filter-chips">
                          {IMPLICIT_FINDING_FILTERS.map(f => (
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
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Footer ── */}
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

      {/* ── Save Filter Modal ── */}
      {showSaveModal && (
        <SaveFilterModal
          onClose={() => setShowSaveModal(false)}
          onSave={(data) => { console.log('Filter saved:', data) }}
        />
      )}

      {/* ── Reset Confirmation Modal ── */}
      {showResetConfirm && (
        <div className="afp-modal-overlay" onMouseDown={e => { if (e.target === e.currentTarget) setShowResetConfirm(false) }}>
          <div className="afp-modal">
            <h3 className="afp-modal-title">Reset All Filters</h3>
            <p className="afp-modal-body">
              This will remove all explicit filters from your current view. Implicit filters will remain active. This action cannot be undone.
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
