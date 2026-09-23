import React, { useState, useMemo, useRef, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { DSPillSearch } from '../context/WorkspaceCtx.jsx'
import { GF_ENTITIES } from './FilterPanel.jsx'
import '../styles/active-filter-panel.css'

const ATTR_ENTITY = {
  'type-host':                 'Host',
  'infra-type':                'Host',
  'data-source':               'Host',
  'origin-contribution-type':  'Host',
  'score':                     'Host',
  'asset-criticality':         'Host',
  'business-unit':             'Host',
  'type-assessment':           'Assessment',
  'saved-filter':              'Saved',
  'assessment-id':             'Finding',
  'attack-surface':            'Host',
  'severity':                  'Finding',
  'exposure-category':         'Finding',
  // Data Quality Overview's "Entity Distribution" chart uses the group-by dimension name
  // itself as the attrId (Origin/Type/Business Unit/Activity Status), plus a synthetic
  // quality-bucket dimension for the Low/Medium/High segment — all bucketed under 'Entity'.
  'Origin':                    'Entity',
  'Type':                      'Entity',
  'Business Unit':             'Entity',
  'Activity Status':           'Entity',
  'quality-bucket':            'Entity',
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
    entityTree: [{ entity: 'Host', relation: 'Host Has Finding' }],
    implicitEntityFilters: [],
    implicitFindingFilters: [
      { key: 'Status',          mode: 'INCLUDE', values: ['Open'] },
      { key: 'Activity Status', mode: 'INCLUDE', values: ['Active'] },
    ],
  },
  'discover/cloud': {
    entityTree: [
      { entity: 'Host',             relation: 'Host Has Finding' },
      { entity: 'Storage',          relation: null },
      { entity: 'Network',          relation: null },
      { entity: 'Container',        relation: null },
      { entity: 'Network Services', relation: null },
      { entity: 'Cluster',          relation: null },
    ],
    implicitEntityFilters: [],
    implicitFindingFilters: [
      { key: 'Status',          mode: 'INCLUDE', values: ['Open'] },
      { key: 'Activity Status', mode: 'INCLUDE', values: ['Active'] },
    ],
  },
  'discover/identity': {
    entityTree: [
      { entity: 'Identity', relation: 'Identity Has Finding' },
      { entity: 'Person',   relation: null },
      { entity: 'Account',  relation: null },
      // Chart-click chips reuse the same 'Host'-bucketed attrIds as the other Discover
      // pages (data-source, type-host, asset-criticality, origin-contribution-type) —
      // simplest to just include Host here too rather than fork attrId→entity mapping
      // per page.
      { entity: 'Host',     relation: null },
    ],
    implicitEntityFilters: [],
    implicitFindingFilters: [
      { key: 'Status',          mode: 'INCLUDE', values: ['Open'] },
      { key: 'Activity Status', mode: 'INCLUDE', values: ['Active'] },
    ],
  },
  'workspace/report': {
    entityTree: [{ entity: 'Host', relation: null }],
    implicitEntityFilters: [],
    implicitFindingFilters: [],
  },
  'data-quality/overview': {
    entityTree: [{ entity: 'Entity', relation: null }],
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
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4">
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

// Turns a saved Workspace dashboard's scope (dashboardScopes: GF_ENTITIES rows;
// dashboardScopeAttrs: { [entityId]: { [attr]: { mode, values } } };
// dashboardScopePaths: [[entityId, ...], ...] relationship chains — all three
// set via DashboardCanvas's DashboardScopeModal/ScopeAttrsPanel) into the
// `scopeChains` shape this panel renders — the dashboard's scope becomes this
// view's locked filters, the same role PAGE_AFP_CONFIG plays for Discover's
// static pages, just computed per-dashboard instead of per-route.
//
// Unlike the old flat entityTree (every scope entity its own top-level block,
// always ending in a hardcoded "Has Finding" → Finding leaf), scopeChains
// mirrors the graph filter's own relationship tree — dashboardScopePaths'
// actual Host → X → Y chains, each hop nested under the last exactly like
// PathFilterTree renders it in the Set Dashboard Scope modal — so a filter
// applied on an entity only reached via traversal (e.g. Vulnerability under
// Host → Vulnerability, never a scope root itself) still shows up here
// instead of being silently dropped for not being one of dashboardScopes.
export function buildDashboardScopeImplicitConfig(dashboardScopes = [], dashboardScopeAttrs = {}, dashboardScopePaths = []) {
  const labelOf = (id) => GF_ENTITIES.find(e => e.id === id)?.label
    || dashboardScopes.find(e => e.id === id)?.label
    || id
  const filtersOf = (id) => Object.entries(dashboardScopeAttrs[id] || {})
    .filter(([, f]) => f?.values?.length)
    .map(([key, f]) => ({ key, mode: (f.mode || 'Include').toUpperCase(), values: f.values }))

  const chains = (dashboardScopePaths || []).filter(p => p.length >= 2)
  const chainedIds = new Set(chains.flat())
  // A scope root not already the root of a multi-hop chain above still needs
  // its own (single-node) chain so a plain, non-traversed entity and its own
  // attribute filters keep showing up.
  const rootOnlyChains = dashboardScopes.filter(e => !chainedIds.has(e.id)).map(e => [e.id])

  const scopeChains = [...chains, ...rootOnlyChains].map(path =>
    path.map(id => ({ id, label: labelOf(id), filters: filtersOf(id) }))
  )
  return { scopeChains }
}

// Recursive renderer for one dashboard-scope relationship chain (see
// buildDashboardScopeImplicitConfig) — same afp-entity-chip / afp-entity-
// content / afp-relation-chip / afp-filter-chip nesting PathChainNode uses
// in the Graph Filter's own Active Filter Preview, so a chain reads
// identically in both places. Dashboard-scope filters are read-only here
// (no per-chip remove) since this panel doesn't own the dashboard's scope —
// only this view's own explicit filters (entityGroups) are removable.
// alwaysShowFilters: used for graphFilterChains (a viewer's own ad-hoc Graph
// Filter selection, explicit — always visible) as opposed to scopeChains (the
// dashboard's saved scope, implicit — gated behind the Implicit Filters
// toggle like every other implicit filter on this panel).
function ScopeChainNode({ chain, idx, entityGroups, implicitFilters, onRemove, alwaysShowFilters = false }) {
  const node = chain[idx]
  const hasNext = idx < chain.length - 1
  // graph-* chips are handled entirely by graphFilterChains (correct entity
  // attribution + real attribute labels) — excluded here so a Graph-Filter-
  // built attribute doesn't also show up mis-labeled/mis-bucketed under
  // whichever chain node ATTR_ENTITY's fallback happened to default it to.
  const explicitAttrs = (entityGroups.find(g => g.entity === node.label)?.attrs || [])
    .filter(attr => !(attr.attrId || '').startsWith('graph-'))
  const showOwnFilters = implicitFilters || alwaysShowFilters
  const showWhere = explicitAttrs.length > 0 || (showOwnFilters && node.filters.length > 0)

  return (
    <>
      <span className="afp-entity-chip">{node.label}</span>
      {(showWhere || hasNext) && (
        <div className="afp-entity-content">
          {showWhere && (
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
                    <button className="afp-fc-remove" title="Remove filter" onClick={() => attr.indices.slice().reverse().forEach(i2 => onRemove?.(i2))}>×</button>
                  </span>
                ))}
                {showOwnFilters && node.filters.map(f => (
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
          {hasNext && (
            <>
              <span className="afp-entity-chip afp-relation-chip">{node.label} Has {chain[idx + 1].label}</span>
              <div className="afp-entity-content">
                <ScopeChainNode chain={chain} idx={idx + 1} entityGroups={entityGroups} implicitFilters={implicitFilters} onRemove={onRemove} alwaysShowFilters={alwaysShowFilters} />
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}

// ── Active Filter Panel ───────────────────────────────────────────────────────
export default function ActiveFilterPanel({ activeFilters = [], onRemove, onClear, onClose, position, pageId, implicitConfig, graphFilterPaths = [] }) {
  const [implicitFilters, setImplicitFilters] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [showSaveModal, setShowSaveModal]       = useState(false)

  const resolvedConfig = implicitConfig || getAfpConfig(pageId)
  const { entityTree, implicitEntityFilters, implicitFindingFilters, perEntityImplicitFilters, scopeChains } = resolvedConfig

  const savedFilterIdx  = activeFilters.findIndex(f => f.attrId === 'saved-filter')
  const savedFilterChip = savedFilterIdx >= 0 ? activeFilters[savedFilterIdx] : null

  const entityGroups = useMemo(() => {
    const entities = new Map()
    activeFilters.forEach((chip, idx) => {
      const entity = ATTR_ENTITY[chip.attrId] || 'Host'
      if (!entities.has(entity)) entities.set(entity, new Map())
      const attrs = entities.get(entity)
      if (!attrs.has(chip.attrId)) attrs.set(chip.attrId, { key: chip.key, attrId: chip.attrId, values: [], indices: [] })
      const a = attrs.get(chip.attrId)
      a.values.push(chip.value)
      a.indices.push(idx)
    })
    return Array.from(entities.entries()).map(([entity, attrs]) => ({
      entity,
      attrs: Array.from(attrs.values()),
    }))
  }, [activeFilters])

  // A viewer's own ad-hoc Graph Filter, applied via this page's Filter button
  // (GFSidePanel in FilterPanel.jsx) rather than the dashboard's saved scope —
  // graphFilterPaths carries the real traversal chains (e.g. [['host',
  // 'vulnerability']]) since GFSidePanel's flattened chips collapse every hop
  // to the same generic 'graph-entity' attrId and can't reconstruct which
  // entity a relation connects. Per-entity attribute chips (graph-attr-
  // <entityId>-<attrId>) DO carry a real entity id, recovered here instead of
  // relying on ATTR_ENTITY (which doesn't know about them and would bucket
  // them all under 'Host').
  const graphFilterChains = useMemo(() => {
    const chains = (graphFilterPaths || []).filter(p => p.length > 0)
    if (!chains.length) return []
    const filtersByEntity = {}
    activeFilters.forEach(chip => {
      const m = /^graph-attr-([a-zA-Z]+)-(.+)$/.exec(chip.attrId || '')
      if (!m) return
      const [, entityId] = m
      const label = (chip.key || '').split(' · ')[1] || m[2]
      // mode prefix casing differs by source (GFAttrPanelBody reports
      // 'Include'/'Exclude'; DashboardCanvas's ScopeAttrsPanel-style flows
      // report 'INCLUDE'/'EXCLUDE') — match case-insensitively so the prefix
      // is always stripped from the values string instead of leaking into it
      // (e.g. a value rendering as "Include EPSS" instead of just "EPSS").
      const valueMatch = /^(include|exclude)\s([\s\S]*)$/i.exec(chip.value || '')
      const mode   = valueMatch ? valueMatch[1].toUpperCase() : 'INCLUDE'
      const values = (valueMatch ? valueMatch[2] : (chip.value || '')).split(', ').filter(Boolean)
      if (!filtersByEntity[entityId]) filtersByEntity[entityId] = []
      filtersByEntity[entityId].push({ key: label, mode, values })
    })
    return chains.map(path => path.map(id => ({
      id,
      label: GF_ENTITIES.find(e => e.id === id)?.label || id,
      filters: filtersByEntity[id] || [],
    })))
  }, [graphFilterPaths, activeFilters])

  // top/right are runtime-calculated pixel positions — must stay inline
  const panelPosVars = {
    '--afp-top':   `${position?.top  ?? 95}px`,
    '--afp-right': `${position?.right ?? 16}px`,
  }

  const panel = (
    <>
      <div className="afp-backdrop" onMouseDown={onClose} />
      <div className="afp-panel" style={panelPosVars} data-tour="page-filter-panel">

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
            <button className="afp-close-btn" onClick={onClose} data-tour="page-filter-close"><IcClose /></button>
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
          {scopeChains && scopeChains.map((chain, i) => (
            <div key={`scope-${i}`} className="afp-entity-block">
              <ScopeChainNode chain={chain} idx={0} entityGroups={entityGroups} implicitFilters={implicitFilters} onRemove={onRemove} />
            </div>
          ))}
          {/* A viewer's own ad-hoc Graph Filter (graphFilterChains) renders as its
              own nested tree regardless of which page/context this panel is on —
              a dashboard with scopeChains, a report or any other page still on the
              old static entityTree fallback below. Rendered here, outside either
              branch, so it isn't limited to dashboard-view routes. */}
          {graphFilterChains.map((chain, i) => (
            <div key={`gf-${i}`} className="afp-entity-block">
              <ScopeChainNode chain={chain} idx={0} entityGroups={entityGroups} implicitFilters={implicitFilters} onRemove={onRemove} alwaysShowFilters />
            </div>
          ))}
          {!scopeChains && entityTree.map(({ entity, relation }, entityIdx) => {
            // graph-* chips are excluded here too (see ScopeChainNode) — they're
            // rendered exclusively via graphFilterChains above, correctly
            // attributed to their real entity and nested under their relation,
            // instead of also leaking into this entity's flat chip list as a
            // generic mislabeled "Graph Filter" attribute.
            const explicitAttrs    = (entityGroups.find(g => g.entity === entity)?.attrs || [])
              .filter(attr => !(attr.attrId || '').startsWith('graph-'))
            const showEntityWhere  = explicitAttrs.length > 0 || implicitFilters
            const findingAttrs     = (entityGroups.find(g => g.entity === 'Finding')?.attrs || [])
              .filter(attr => !(attr.attrId || '').startsWith('graph-'))
            const showFindingWhere = implicitFilters || findingAttrs.length > 0
            // The Finding sub-block's contents (implicitFindingFilters/findingAttrs) aren't
            // scoped per entity — render them once, under the first related entity, instead
            // of once per entity in the tree (entityTree can have several `relation`s, e.g.
            // the fallback ENTITY_TREE, which would otherwise repeat the same chips N times).
            const isFirstRelated   = relation && entityIdx === entityTree.findIndex(e => e.relation)
            const entityImplicit   = perEntityImplicitFilters ? (perEntityImplicitFilters[entity] || []) : implicitEntityFilters

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
                        {implicitFilters && entityImplicit.map(f => (
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

                  {relation && isFirstRelated && (
                    <>
                      <span className="afp-entity-chip afp-relation-chip">{relation}</span>
                      <div className="afp-entity-content">
                        <p className="afp-no-filters">No filters applied</p>
                        <span className="afp-entity-chip">Finding</span>
                        {showFindingWhere && (
                          <>
                            <span className="afp-where">where</span>
                            <div className="afp-filter-chips">
                              {implicitFilters && implicitFindingFilters.map(f => (
                                <span key={f.key} className="afp-filter-chip">
                                  <span className="afp-fc-label">{f.key}</span>
                                  <span className="afp-fc-sep">&nbsp;:&nbsp;</span>
                                  <span className="afp-fc-badge">[{f.mode}]</span>
                                  {f.op && <span className="afp-fc-badge afp-fc-badge--op">[{f.op}]</span>}
                                  <span className="afp-fc-values">&nbsp;{f.values.join(', ')}</span>
                                </span>
                              ))}
                              {findingAttrs.map((attr, i) => (
                                <span key={`fa-${i}`} className="afp-filter-chip">
                                  <span className="afp-fc-label">{attr.key.replace(/ · .*$/, '')}</span>
                                  <span className="afp-fc-sep">&nbsp;:&nbsp;</span>
                                  <span className="afp-fc-badge">[INCLUDE]</span>
                                  {attr.values.length > 1 && <span className="afp-fc-badge afp-fc-badge--op">[OR]</span>}
                                  <span className="afp-fc-values">&nbsp;{attr.values.join(', ')}</span>
                                  <button className="afp-fc-remove" title="Remove filter" onClick={() => attr.indices.slice().reverse().forEach(idx => onRemove?.(idx))}>×</button>
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
          <button className="afp-reset-btn" data-tooltip="Resets explicit filters" onClick={() => setShowResetConfirm(true)}>
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
        <div className="ds-modal-overlay afp-reset-modal-overlay">
          <div className="ds-modal" role="dialog" aria-modal="true">
            <div className="ds-modal-header">
              <span className="ds-modal-title afp-reset-modal-title">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 7.2561C8.84388 7.2562 9.5127 7.92682 9.5127 8.76978C9.5126 9.61265 8.84382 10.2824 8 10.2825C7.15609 10.2825 6.48642 9.61271 6.48633 8.76978C6.48633 7.92676 7.15603 7.2561 8 7.2561Z" fill="currentColor" stroke="currentColor" strokeWidth="0.555556"/>
                  <path d="M3.26953 8.76914C3.26953 9.70481 3.54697 10.6195 4.06676 11.3974C4.58655 12.1754 5.32534 12.7818 6.18972 13.1399C7.05409 13.4979 8.00523 13.5916 8.92285 13.4091C9.84047 13.2265 10.6834 12.776 11.3449 12.1143C12.0065 11.4527 12.457 10.6098 12.6395 9.69208C12.8221 8.77439 12.7284 7.82317 12.3704 6.95873C12.0123 6.09428 11.406 5.35543 10.6281 4.8356C9.87356 4.3314 8.99047 4.05522 8.08433 4.03906" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7.80005 5.6189L5.68774 4.02417L7.80005 2.42944V5.6189Z" fill="currentColor" stroke="currentColor" strokeWidth="0.555556"/>
                </svg>
                Reset Filters
              </span>
              <button className="ds-modal-close" onClick={() => setShowResetConfirm(false)} aria-label="Close">×</button>
            </div>
            <div className="ds-modal-body">
              <p className="afp-reset-modal-copy">
                This clears every explicit filter you've applied to this view. This action cannot be undone.
              </p>
            </div>
            <div className="ds-modal-footer">
              <button className="ds-btn sz-md t-outline" onClick={() => setShowResetConfirm(false)}>Cancel</button>
              <button
                className="ds-btn sz-md t-danger"
                onClick={() => {
                  onClear?.()
                  setShowResetConfirm(false)
                  onClose()
                }}
              >
                Reset Explicit Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )

  return ReactDOM.createPortal(panel, document.body)
}
