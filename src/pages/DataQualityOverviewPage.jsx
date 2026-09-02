import React, { useState, useRef, useEffect, useMemo } from 'react'
import { ChartRender } from '../components/ChartRender.jsx'
import TablePagination from '../components/TablePagination.jsx'
import { DSPillSearch } from '../context/WorkspaceCtx.jsx'
import { useChartFilters } from '../hooks/useChartFilters.js'
import '../styles/dashboard.css'
import '../styles/compliance.css'
import '../styles/kg.css'
import '../styles/data-quality.css'

// ── Select dropdown (comp-sort pattern, matches other dashboards) ──────
const IcChevron = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6"/>
  </svg>
)
function SelectDropdown({ value, onChange, options, fullWidth = false }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className={`comp-sort-wrap${fullWidth ? ' comp-sort-wrap--full' : ''}`}>
      <button
        className={`comp-sort-btn${fullWidth ? ' comp-select-btn comp-select-btn--full' : ''}${open ? ' comp-sort-btn--active' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        <span>{value}</span>
        <IcChevron />
      </button>
      {open && (
        <div className={`comp-sort-menu${fullWidth ? ' comp-sort-menu--full' : ' comp-sort-menu--right'}`}>
          {options.map(opt => (
            <button
              key={opt}
              className={`comp-sort-item${opt === value ? ' comp-sort-item--selected' : ''}`}
              onClick={() => { onChange(opt); setOpen(false) }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Compact "Sort" trigger — same menu, fixed "Sort" label (sidebar) ───
const IcSort = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18M7 12h10M11 18h2"/>
  </svg>
)
function SortMenuButton({ value, onChange, options }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="comp-sort-wrap">
      <button className={`comp-sort-btn${open ? ' comp-sort-btn--active' : ''}`} onClick={() => setOpen(o => !o)}>
        <IcSort />
        <span>Sort</span>
      </button>
      {open && (
        <div className="comp-sort-menu">
          {options.map(opt => (
            <button
              key={opt}
              className={`comp-sort-item${opt === value ? ' comp-sort-item--selected' : ''}`}
              onClick={() => { onChange(opt); setOpen(false) }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Dimension tab strip — reuses the app's SegmentedTabs visual (sliding ──
// thumb, single connected bar; see KGPage.jsx/DashboardCanvas.jsx) with
// added support for disabled options + a tooltip, which the shared
// component doesn't need elsewhere.
function DimensionTabs({ value, options, disabledOptions, onChange }) {
  const btnRefs = useRef([])
  const [thumb, setThumb] = useState({ left: 3, width: 0 })

  useEffect(() => {
    const idx = options.indexOf(value)
    const btn = btnRefs.current[idx]
    if (btn) setThumb({ left: btn.offsetLeft, width: btn.offsetWidth })
  }, [value, options.join('|')])

  return (
    <div className="kg-seg-tabs">
      <div className="kg-seg-thumb" style={{ left: thumb.left, width: thumb.width, opacity: thumb.width ? 1 : 0 }} />
      {options.map((o, i) => {
        const disabled = disabledOptions.includes(o)
        return (
          <button
            key={o}
            ref={el => btnRefs.current[i] = el}
            className={`kg-seg-btn${o === value ? ' kg-seg-btn--active' : ''}${disabled ? ' dq-seg-btn--disabled' : ''}`}
            disabled={disabled}
            title={disabled ? 'Coming soon' : undefined}
            onClick={() => !disabled && onChange(o)}
          >
            {o}
          </button>
        )
      })}
    </div>
  )
}

// ── Small icon set ──────────────────────────────────────────────────
const IcInfo = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
)
const IcSortCaret = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 15l5 5 5-5M7 9l5-5 5 5"/>
  </svg>
)
// Same trend-arrow glyphs as ChartRender.jsx's cr-kpi-badge__trend, so every
// trend indicator in the app matches instead of falling back to plain text arrows.
const IcTrendUp = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
    <path d="M2.50586 11.0764L6.10893 7.47334L8.51098 9.87538L13.3151 5.07129" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M11.1223 4.84668H13.5244V7.24873" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const IcTrendDown = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
    <path d="M2.50586 4.84669L6.10893 8.44976L8.51098 6.04771L13.3151 10.8518" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M11.1223 11.0764H13.5244V8.67437" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
// Same glyph→file mapping KGPage.jsx uses for its entity-type icons —
// keeps every entity icon on this page visually identical to the KG.
const GLYPH_TO_FILE = {
  account: 'entity-account.svg',
  identity: 'entity-identity.svg',
  group: 'entity-group.svg',
  person: 'entity-person.svg',
  application: 'entity-application.svg',
  vulnerability: 'entity-vulnerability.svg',
  assessment: 'entity-assessment.svg',
  cluster: 'entity-cluster.svg',
  container: 'entity-cloud-container.svg',
  cloud: 'entity-cloud-account.svg',
  finding: 'entity-finding.svg',
  ticket: 'entity-ticket.svg',
  host: 'entity-host.svg',
  network: 'entity-network.svg',
  netsvc: 'entity-network-services.svg',
  netiface: 'entity-network-interface.svg',
  storage: 'entity-storage.svg',
}

// Same per-type node colors as the Knowledge Graph (KGPage.jsx's ENTITY_TYPES
// tint/stroke/tintDark/strokeDark/icon fields) — every entity icon on this
// page is a colored circle badge matching its KG node exactly, border and
// all, not a flat neutral glyph.
const GLYPH_COLORS = {
  account:       { tint: '#F1ECF9', tintDark: '#1E1228', stroke: '#D3C3EC', strokeDark: '#3D2558', icon: '#9269CF' },
  identity:      { tint: '#F4E6F9', tintDark: '#22102E', stroke: '#DCB3ED', strokeDark: '#4D1E68', icon: '#A842D2' },
  group:         { tint: '#E3F6F7', tintDark: '#0D2A2B', stroke: '#A9E5E7', strokeDark: '#1A5254', icon: '#27BDC2' },
  person:        { tint: '#E4EDF1', tintDark: '#0E1F28', stroke: '#ABC8D3', strokeDark: '#1D3E50', icon: '#2E7690' },
  application:   { tint: '#F4EEE6', tintDark: '#261B0D', stroke: '#DECCB1', strokeDark: '#4E381A', icon: '#AD803D' },
  vulnerability: { tint: '#F4E9E9', tintDark: '#261313', stroke: '#DFBCBC', strokeDark: '#4E2626', icon: '#AE5757' },
  assessment:    { tint: '#F4ECE5', tintDark: '#241808', stroke: '#DEC4AF', strokeDark: '#4A3018', icon: '#AC6C36' },
  cluster:       { tint: '#E5E5F5', tintDark: '#0D0D28', stroke: '#AEAEE1', strokeDark: '#1A1A50', icon: '#3434B4' },
  container:     { tint: '#EBE4F2', tintDark: '#180C24', stroke: '#C2ADD7', strokeDark: '#321848', icon: '#66329C' },
  cloud:         { tint: '#E6E7F5', tintDark: '#0D1028', stroke: '#B1B4DF', strokeDark: '#1A2050', icon: '#3B43B0' },
  finding:       { tint: '#E9E4F6', tintDark: '#130A2A', stroke: '#BCABE4', strokeDark: '#281455', icon: '#582DBB' },
  ticket:        { tint: '#E6F6F4', tintDark: '#0D2A27', stroke: '#B1E3DE', strokeDark: '#1A524E', icon: '#3DBAAD' },
  host:          { tint: '#E3E9F1', tintDark: '#0A1520', stroke: '#AABBD3', strokeDark: '#163060', icon: '#2B5690' },
  network:       { tint: '#DEF0EA', tintDark: '#0A2018', stroke: '#99D0BF', strokeDark: '#143E30', icon: '#00895E' },
  netsvc:        { tint: '#F0F4E4', tintDark: '#1C230D', stroke: '#D0DCAD', strokeDark: '#38461A', icon: '#89A833' },
  netiface:      { tint: '#F6E6F0', tintDark: '#280D1E', stroke: '#E3B1D1', strokeDark: '#50183A', icon: '#BA3D8C' },
  storage:       { tint: '#E5F1F7', tintDark: '#0C2030', stroke: '#B0D5E7', strokeDark: '#184060', icon: '#3A96C4' },
}

function EntityIcon({ glyph, muted }) {
  const file = GLYPH_TO_FILE[glyph]
  const colors = GLYPH_COLORS[glyph]
  if (!file) return null
  const maskUrl = `url(assets/icons/${file})`
  return (
    <span
      className={`dq-entity-badge${muted ? ' dq-entity-badge--muted' : ''}`}
      style={{
        '--dq-badge-tint': colors?.tint,
        '--dq-badge-tint-dark': colors?.tintDark,
        '--dq-badge-stroke': colors?.stroke,
        '--dq-badge-stroke-dark': colors?.strokeDark,
        '--dq-badge-icon': colors?.icon,
      }}
    >
      <span className="dq-entity-icon" style={{ WebkitMaskImage: maskUrl, maskImage: maskUrl }} />
    </span>
  )
}

// Overlapping from/to icon pair for a relationship card.
function RelIcons({ fromGlyph, toGlyph }) {
  return (
    <span className="dq-rel-icons">
      <span className="dq-rel-icon--from"><EntityIcon glyph={fromGlyph} /></span>
      <span className="dq-rel-icon--to"><EntityIcon glyph={toGlyph} /></span>
    </span>
  )
}

// ── Entity / Relationship view toggle — same sliding-thumb segmented ──
// control as DimensionTabs, but the two labels carry live counts, so
// value tracks the stable 'Entity'|'Relationship' key, not label text.
function EntityRelationshipTabs({ value, onChange, entityLabel, relationshipLabel }) {
  const options = ['Entity', 'Relationship']
  const labels = { Entity: entityLabel, Relationship: relationshipLabel }
  const btnRefs = useRef([])
  const [thumb, setThumb] = useState({ left: 3, width: 0 })

  useEffect(() => {
    const idx = options.indexOf(value)
    const btn = btnRefs.current[idx]
    if (btn) setThumb({ left: btn.offsetLeft, width: btn.offsetWidth })
  }, [value, entityLabel, relationshipLabel])

  return (
    <div className="kg-seg-tabs kg-seg-tabs--full dq-view-tabs">
      <div className="kg-seg-thumb" style={{ left: thumb.left, width: thumb.width, opacity: thumb.width ? 1 : 0 }} />
      {options.map((o, i) => (
        <button
          key={o}
          ref={el => btnRefs.current[i] = el}
          className={`kg-seg-btn kg-seg-btn--full${o === value ? ' kg-seg-btn--active' : ''}`}
          onClick={() => onChange(o)}
        >
          {labels[o]}
        </button>
      ))}
    </div>
  )
}

// ── Score color scale ───────────────────────────────────────────────
// Same 3-tier scale as the assessment drawer's gauge (CompliancePage's
// SemiDonutChart / ChartRender's gauge-arc) — kept consistent across
// every score-colored element on this page, not just the gauge.
function scoreColor(score) {
  if (score >= 85) return 'var(--pai-green)'
  if (score >= 60) return 'var(--pai-high-fg)'
  return 'var(--pai-crit-fg)'
}

// Matches CompliancePage's cardRgb() exactly — the selected-card gradient
// tint uses these RGB triplets rather than the bar/text colors above.
function cardRgb(score) {
  if (score >= 85) return '43,160,76'
  if (score >= 60) return '245,130,13'
  return '225,82,82'
}

const DIMENSIONS = ['Completeness', 'Accuracy', 'Integrity', 'Timeliness', 'Validity', 'Uniqueness']
const GROUP_BY_OPTIONS = ['Origin', 'Type', 'Business Unit', 'Activity Status']
const GROUP_VALUES = {
  'Origin':          ['Salesforce', 'SAP', 'Workday', 'ServiceNow'],
  'Type':            ['Customer', 'Vendor', 'Employee', 'Asset'],
  'Business Unit':   ['Sales', 'Finance', 'Operations', 'HR'],
  'Activity Status': ['Active', 'Inactive', 'Archived'],
}

const ATTRIBUTES = [
  { name: 'customer_id',        category: 'Identifiers'  },
  { name: 'email_address',      category: 'Contact Info' },
  { name: 'phone_number',       category: 'Contact Info' },
  { name: 'date_of_birth',      category: 'Identifiers'  },
  { name: 'account_status',     category: 'Metadata'     },
  { name: 'created_at',         category: 'Timestamps'   },
  { name: 'updated_at',         category: 'Timestamps'   },
  { name: 'ssn_last4',          category: 'Identifiers'  },
  { name: 'annual_revenue',     category: 'Financial'    },
  { name: 'billing_address',    category: 'Contact Info' },
  { name: 'shipping_address',   category: 'Contact Info' },
  { name: 'tax_id',             category: 'Financial'    },
  { name: 'contact_owner',      category: 'Metadata'     },
  { name: 'lead_source',        category: 'Metadata'     },
  { name: 'industry_code',      category: 'Metadata'     },
  { name: 'preferred_language', category: 'Metadata'     },
  { name: 'marketing_opt_in',   category: 'Metadata'     },
  { name: 'last_login_at',      category: 'Timestamps'   },
]

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n))

// Deterministic jitter so demo data looks varied without being random.
function makeDimensions(score) {
  return DIMENSIONS.map((label, i) => ({
    label,
    value: clamp(score + (((i * 17) % 30) - 15), 2, 100),
  }))
}

// dimIndex shifts the jitter so each dimension tab (Completeness, Accuracy, …)
// shows its own distinct spread instead of repeating the same numbers.
function makeAttributes(score, dimIndex = 0) {
  return ATTRIBUTES.map((a, i) => ({
    ...a,
    score: clamp(score + ((((i * 13) + dimIndex * 23) % 40) - 20), 1, 100),
  }))
}

// Real per-member population for the currently-selected subject (entity or relationship) —
// lets "Entity Distribution" and the gauge/radar/attributes all recompute from one filterable
// dataset when a chart segment is clicked, instead of a fixed formula with no members behind it.
function makeEntityMembers(subjectId, score, count = 80) {
  const members = []
  for (let i = 0; i < count; i++) {
    const h = hashInt(`${subjectId}#${i}`)
    const dims = {}
    DIMENSIONS.forEach((label, di) => {
      dims[label] = clamp(score + (((Math.floor(h / (di + 3)) + i * 7) % 30) - 15), 2, 100)
    })
    members.push({
      id: `${subjectId}-m${i}`,
      Origin: GROUP_VALUES.Origin[h % GROUP_VALUES.Origin.length],
      Type: GROUP_VALUES.Type[Math.floor(h / 7) % GROUP_VALUES.Type.length],
      'Business Unit': GROUP_VALUES['Business Unit'][Math.floor(h / 13) % GROUP_VALUES['Business Unit'].length],
      'Activity Status': GROUP_VALUES['Activity Status'][Math.floor(h / 29) % GROUP_VALUES['Activity Status'].length],
      dims,
    })
  }
  return members
}

function qualityBucket(score) {
  if (score < 40) return 'Low'
  if (score < 75) return 'Medium'
  return 'High'
}

function aggregateCategoryRows(members, groupField, dimLabel) {
  const rows = new Map()
  for (const m of members) {
    const key = m[groupField]
    if (!rows.has(key)) rows.set(key, { type: key, Low: 0, Medium: 0, High: 0 })
    rows.get(key)[qualityBucket(m.dims[dimLabel])]++
  }
  return [...rows.values()]
}

function makeTrend(score) {
  return ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'].map((name, i) => ({
    name,
    value: clamp(score - 10 + i * 2 + ((i % 2) * 3), 1, 100),
  }))
}

// Same 16 entity types as the Knowledge Graph (KGPage.jsx's ENTITY_TYPES) —
// this page tracks quality for every entity type the KG ingests, not a
// separate, invented set of business objects.
function hashInt(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0
  return h
}

const KG_ENTITY_TYPES = [
  { id: 'account',       name: 'Account',            glyph: 'account' },
  { id: 'identity',      name: 'Identity',           glyph: 'identity' },
  { id: 'group',         name: 'Group',              glyph: 'group', noTrend: true },
  { id: 'person',        name: 'Person',             glyph: 'person' },
  { id: 'application',   name: 'Application',        glyph: 'application' },
  { id: 'vulnerability', name: 'Vulnerability',      glyph: 'vulnerability' },
  { id: 'assessment',    name: 'Assessment',         glyph: 'assessment' },
  { id: 'cluster',       name: 'Cluster',            glyph: 'cluster' },
  { id: 'container',     name: 'Container',          glyph: 'container' },
  { id: 'cloudAccount',  name: 'Cloud Account',      glyph: 'cloud' },
  { id: 'finding',       name: 'Finding',            glyph: 'finding' },
  { id: 'ticket',        name: 'Ticket',             glyph: 'ticket' },
  { id: 'host',          name: 'Host',               glyph: 'host' },
  { id: 'network',       name: 'Network',            glyph: 'network' },
  { id: 'netSvc',        name: 'Network Services',   glyph: 'netsvc' },
  { id: 'netIface',      name: 'Network Interface',  glyph: 'netiface' },
  { id: 'storage',       name: 'Storage',            glyph: 'storage' },
]

const ENTITIES = KG_ENTITY_TYPES.map(e => {
  const h = hashInt(e.id)
  return { ...e, score: 10 + (h % 89), dataSources: 2 + (h % 24) }
}).map(e => ({
  ...e,
  dimensions: makeDimensions(e.score),
  trend: e.noTrend ? [] : makeTrend(e.score),
}))

// "Overall" benchmark shown alongside whichever entity/relationship is
// selected — the average score/dimensions across every entity the KG
// tracks, matching the reference's second "Overall" radar series + gauge row.
const OVERALL_SCORE = Math.round(ENTITIES.reduce((s, e) => s + e.score, 0) / ENTITIES.length)
const OVERALL_DIMENSIONS = DIMENSIONS.map((label, i) => ({
  label,
  value: Math.round(ENTITIES.reduce((s, e) => s + e.dimensions[i].value, 0) / ENTITIES.length),
}))

const ENTITY_BY_ID = Object.fromEntries(KG_ENTITY_TYPES.map(e => [e.id, e]))

// Same relationship edges as the Knowledge Graph (KGPage.jsx's INITIAL_EDGES) —
// [srcEntityId, tgtEntityId, verb], trimmed of the hidden/alias fields that
// page uses for its graph layout, which this list doesn't need.
const KG_RELATIONSHIPS = [
  ['account', 'identity', 'Associated with'],
  ['account', 'finding', 'Has'],
  ['application', 'host', 'Running on'],
  ['application', 'vulnerability', 'Has'],
  ['assessment', 'finding', 'Associated with'],
  ['cloudAccount', 'finding', 'Has'],
  ['cloudAccount', 'storage', 'Has'],
  ['cloudAccount', 'container', 'Has'],
  ['cloudAccount', 'host', 'Has'],
  ['cloudAccount', 'cluster', 'Has'],
  ['cluster', 'finding', 'Has'],
  ['cluster', 'cloudAccount', 'Belongs to'],
  ['container', 'cloudAccount', 'Belongs to'],
  ['container', 'finding', 'Has'],
  ['container', 'vulnerability', 'Has'],
  ['host', 'person', 'Owned by'],
  ['host', 'cloudAccount', 'Belongs to'],
  ['host', 'identity', 'Has'],
  ['host', 'finding', 'Has'],
  ['host', 'application', 'Hosting'],
  ['host', 'vulnerability', 'Has'],
  ['host', 'cluster', 'Belongs to'],
  ['host', 'storage', 'Has'],
  ['identity', 'person', 'Associated with'],
  ['identity', 'account', 'Has'],
  ['identity', 'finding', 'Has'],
  ['identity', 'host', 'Associated with'],
  ['network', 'finding', 'Has'],
  ['netSvc', 'finding', 'Has'],
  ['person', 'host', 'Owns'],
  ['person', 'identity', 'Has'],
  ['person', 'finding', 'Has'],
  ['storage', 'finding', 'Has'],
  ['storage', 'cloudAccount', 'Belongs to'],
  ['storage', 'host', 'To'],
  ['vulnerability', 'host', 'On'],
  ['vulnerability', 'container', 'On'],
  ['vulnerability', 'finding', 'Has'],
  ['vulnerability', 'application', 'On'],
]

function relationshipsForEntity(entityId) {
  return KG_RELATIONSHIPS
    .filter(([src, tgt]) => src === entityId || tgt === entityId)
    .map(([src, tgt, label]) => {
      const id = `${src}|${label}|${tgt}`
      const h = hashInt(id)
      const srcE = ENTITY_BY_ID[src]
      const tgtE = ENTITY_BY_ID[tgt]
      return {
        id,
        name: `${srcE.name} ${label} ${tgtE.name}`,
        fromGlyph: srcE.glyph,
        toGlyph: tgtE.glyph,
        attributes: 5 + (h % 20),
        dataSources: 2 + (h % 8),
        score: 10 + (h % 89),
      }
    })
}

const CATEGORY_SERIES = [
  { key: 'Low',    label: 'Low',    color: 'var(--pai-crit-fg)'    },
  { key: 'Medium', label: 'Medium', color: 'var(--pai-caution-fg)' },
  { key: 'High',   label: 'High',   color: 'var(--pai-green)'      },
]

export default function DataQualityOverviewPage({ onNav, crossFilters = [], onToggleFilter } = {}) {
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('Score: High to Low')
  const [viewMode, setViewMode] = useState('Entity')
  const [selectedId, setSelectedId] = useState(() => (
    [...ENTITIES].sort((a, b) => b.score - a.score)[0].id
  ))
  const [groupBy, setGroupBy] = useState('Origin')
  const [activeDim, setActiveDim] = useState('Completeness')

  const [attrSearch, setAttrSearch] = useState('')
  const [attrCategory, setAttrCategory] = useState('All')
  const [attrSort, setAttrSort] = useState({ key: 'score', dir: 'desc' })
  const [attrPage, setAttrPage] = useState(1)
  const [attrRowsPerPage, setAttrRowsPerPage] = useState(10)

  const filteredEntities = useMemo(() => {
    let rows = ENTITIES.filter(e => e.name.toLowerCase().includes(search.toLowerCase()))
    switch (sort) {
      case 'Score: Low to High': rows = [...rows].sort((a, b) => a.score - b.score); break
      case 'Name: A-Z':          rows = [...rows].sort((a, b) => a.name.localeCompare(b.name)); break
      case 'Name: Z-A':          rows = [...rows].sort((a, b) => b.name.localeCompare(a.name)); break
      default:                   rows = [...rows].sort((a, b) => b.score - a.score)
    }
    return rows
  }, [search, sort])

  // Relationships belong to whichever entity is currently selected — same
  // pattern as the reference (Host selected → its 3 relationship edges).
  const entityRelationships = useMemo(() => relationshipsForEntity(selectedId), [selectedId])

  const [selectedRelId, setSelectedRelId] = useState(() => (
    entityRelationships.length ? [...entityRelationships].sort((a, b) => b.score - a.score)[0].id : null
  ))

  // Keep the relationship selection valid whenever the entity (and so its
  // relationship list) changes — default back to the top-scored one.
  useEffect(() => {
    if (entityRelationships.length === 0) { setSelectedRelId(null); return }
    setSelectedRelId(prev => (
      entityRelationships.some(r => r.id === prev)
        ? prev
        : [...entityRelationships].sort((a, b) => b.score - a.score)[0].id
    ))
  }, [entityRelationships])

  const filteredRelationships = useMemo(() => {
    let rows = entityRelationships.filter(r => r.name.toLowerCase().includes(search.toLowerCase()))
    switch (sort) {
      case 'Score: Low to High': rows = [...rows].sort((a, b) => a.score - b.score); break
      case 'Name: A-Z':          rows = [...rows].sort((a, b) => a.name.localeCompare(b.name)); break
      case 'Name: Z-A':          rows = [...rows].sort((a, b) => b.name.localeCompare(a.name)); break
      default:                   rows = [...rows].sort((a, b) => b.score - a.score)
    }
    return rows
  }, [entityRelationships, search, sort])

  const entity = ENTITIES.find(e => e.id === selectedId) || ENTITIES[0]

  // What the main content (gauge/dimensions/category/attributes) shows —
  // the selected entity, or the selected relationship's own dummy data
  // when the Relationship tab is active.
  const activeSubject = useMemo(() => {
    if (viewMode !== 'Relationship') return entity
    const r = entityRelationships.find(x => x.id === selectedRelId)
    if (!r) return entity
    return {
      ...r,
      dimensions: makeDimensions(r.score),
      trend: makeTrend(r.score),
    }
  }, [viewMode, entity, entityRelationships, selectedRelId])

  const trendDelta = useMemo(() => {
    if (activeSubject.trend.length < 2) return null
    const last = activeSubject.trend[activeSubject.trend.length - 1].value
    const prev = activeSubject.trend[activeSubject.trend.length - 2].value
    return { up: last >= prev, pct: Math.abs(last - prev) }
  }, [activeSubject])

  // The distribution chart and attribute scores both vary by which dimension
  // tab (Completeness, Accuracy, …) is active, not just by the subject.
  const dimIndex = DIMENSIONS.indexOf(activeDim)

  // Real per-member population for the current subject — every chart-click filter recomputes
  // from this, rather than a formula with no members behind it.
  const members = useMemo(() => (
    makeEntityMembers(activeSubject.id || activeSubject.name, activeSubject.score)
  ), [activeSubject])
  const { matches } = useChartFilters(crossFilters)
  const MEMBER_FIELDS = {
    'Origin':            m => m.Origin,
    'Type':              m => m.Type,
    'Business Unit':     m => m['Business Unit'],
    'Activity Status':   m => m['Activity Status'],
    'quality-bucket':    m => qualityBucket(m.dims[activeDim]),
  }
  const filteredMembers = members.filter(m => matches(m, MEMBER_FIELDS))
  const filterActive = crossFilters.length > 0

  // Clicking an Entity Distribution segment switches the whole card set from "this one
  // subject's own score" to "average across the filtered population" — confirmed behavior,
  // not just a re-filtered chart. Falls back to the subject itself if a filter empties the set.
  const displaySubject = useMemo(() => {
    if (!filterActive || !filteredMembers.length) return activeSubject
    const avg = label => Math.round(filteredMembers.reduce((s, m) => s + m.dims[label], 0) / filteredMembers.length)
    return {
      ...activeSubject,
      name: `${activeSubject.name} (filtered)`,
      score: avg(activeDim),
      dimensions: DIMENSIONS.map(label => ({ label, value: avg(label) })),
    }
  }, [activeSubject, filteredMembers, filterActive, activeDim])

  // Radar needs both series merged into one row per axis: {label, value, overall}.
  const radarData = useMemo(() => (
    displaySubject.dimensions.map((d, i) => ({ ...d, overall: OVERALL_DIMENSIONS[i].value }))
  ), [displaySubject])

  const categoryData = useMemo(() => (
    aggregateCategoryRows(filteredMembers, groupBy, activeDim)
  ), [filteredMembers, groupBy, activeDim])

  const subjectAttributes = useMemo(() => (
    makeAttributes(displaySubject.score, dimIndex)
  ), [displaySubject, dimIndex])

  const attrCategories = useMemo(() => (
    ['All', ...new Set(ATTRIBUTES.map(a => a.category))]
  ), [])

  const toggleAttrSort = (key) => {
    setAttrSort(prev => prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' })
  }

  const filteredAttrs = useMemo(() => {
    let rows = subjectAttributes.filter(a => (
      a.name.toLowerCase().includes(attrSearch.toLowerCase()) &&
      (attrCategory === 'All' || a.category === attrCategory)
    ))
    const dir = attrSort.dir === 'asc' ? 1 : -1
    rows = [...rows].sort((a, b) => (
      attrSort.key === 'name' ? a.name.localeCompare(b.name) * dir : (a.score - b.score) * dir
    ))
    return rows
  }, [subjectAttributes, attrSearch, attrCategory, attrSort])

  const pagedAttrs = filteredAttrs.slice(
    (attrPage - 1) * attrRowsPerPage,
    attrPage * attrRowsPerPage,
  )

  return (
    <div className="dq-page">
      {/* ── Sidebar: entity/relationship picker — same panel as Compliance's Frameworks ── */}
      <div className="card comp-left">
        <div className="comp-left-header--padded">
          <EntityRelationshipTabs
            value={viewMode}
            onChange={setViewMode}
            entityLabel={`Entities (${ENTITIES.length})`}
            relationshipLabel={`Relationships (${entityRelationships.length})`}
          />
        </div>
        <div className="comp-left-header comp-left-header--padded">
          <div className="comp-left-header-group">
            <SortMenuButton
              value={sort}
              onChange={setSort}
              options={['Score: High to Low', 'Score: Low to High', 'Name: A-Z', 'Name: Z-A']}
            />
          </div>
          <div className="comp-left-actions">
            <DSPillSearch
              value={search}
              onChange={setSearch}
              placeholder={viewMode === 'Entity' ? 'Search entities…' : 'Search relationships…'}
            />
          </div>
        </div>

        <div className="comp-fw-list comp-fw-list--pad">
          {viewMode === 'Entity' && filteredEntities.length === 0 && (
            <div className="dq-entity-empty">No entities match "{search}"</div>
          )}
          {viewMode === 'Entity' && filteredEntities.map(e => {
            const isSelected = e.id === selectedId
            const barCol = scoreColor(e.score)
            const rgb = cardRgb(e.score)
            return (
              <div
                key={e.id}
                className={`comp-fw-card ${isSelected ? 'comp-fw-card--selected' : 'comp-fw-card--default'}`}
                style={isSelected ? { '--fw-rgb': rgb, background: `linear-gradient(90deg, rgba(${rgb},0.10) 0%, rgba(247,249,252,0) 100%)` } : undefined}
                onClick={() => setSelectedId(e.id)}
              >
                <div className="comp-fw-card__top">
                  <div className="comp-fw-card__id">
                    <EntityIcon glyph={e.glyph} muted={!isSelected} />
                    <span className={isSelected ? 'comp-fw-name' : 'comp-fw-name comp-fw-name--muted'}>{e.name}</span>
                  </div>
                </div>
                <div className="comp-fw-card__bar">
                  <span className="comp-fw-count">{e.dataSources} Data Sources</span>
                  <div className="comp-fw-bar-row">
                    <span className="comp-fw-pct">{e.score}<span className="comp-fw-pct-unit">%</span></span>
                    <div className="comp-fw-track">
                      <div className="comp-fw-fill" style={{ '--comp-fw-w': `${e.score}%`, '--comp-fw-bar-color': barCol }} />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          {viewMode === 'Relationship' && filteredRelationships.length === 0 && (
            <div className="dq-entity-empty">No relationships found for {entity.name}</div>
          )}
          {viewMode === 'Relationship' && filteredRelationships.map(r => {
            const isSelected = r.id === selectedRelId
            const barCol = scoreColor(r.score)
            const rgb = cardRgb(r.score)
            return (
              <div
                key={r.id}
                className={`comp-fw-card ${isSelected ? 'comp-fw-card--selected' : 'comp-fw-card--default'}`}
                style={isSelected ? { '--fw-rgb': rgb, background: `linear-gradient(90deg, rgba(${rgb},0.10) 0%, rgba(247,249,252,0) 100%)` } : undefined}
                onClick={() => setSelectedRelId(r.id)}
              >
                <div className="comp-fw-card__top">
                  <div className="comp-fw-card__id">
                    <RelIcons fromGlyph={r.fromGlyph} toGlyph={r.toGlyph} />
                    <span className={isSelected ? 'comp-fw-name' : 'comp-fw-name comp-fw-name--muted'}>{r.name}</span>
                  </div>
                </div>
                <div className="comp-fw-card__bar">
                  <span className="comp-fw-count">{r.attributes} Attributes  |  {r.dataSources} Data Sources</span>
                  <div className="comp-fw-bar-row">
                    <span className="comp-fw-pct">{r.score}<span className="comp-fw-pct-unit">%</span></span>
                    <div className="comp-fw-track">
                      <div className="comp-fw-fill" style={{ '--comp-fw-w': `${r.score}%`, '--comp-fw-bar-color': barCol }} />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Main column ─────────────────────────────────────────── */}
      <div className="dq-main">
        <div className="dq-row">
          {/* Score gauge + integrated trend */}
          <div className="dq-card dq-card--gauge" data-nav-explore="chart" data-nav-label="Application Quality Score">
            <div className="dq-card__title">Application Quality Score</div>
            <div className="dq-card__subtitle">{displaySubject.name} · Updated 2 hours ago</div>
            <div className="dq-card__body">
              <ChartRender chartId="gauge-arc" data={{ value: displaySubject.score, markerValue: OVERALL_SCORE }} />
            </div>
            <div className="dq-overall-row">
              <span className="dq-overall-dot" />
              <span className="dq-overall-label">Overall Score</span>
              <span className="dq-overall-value">{OVERALL_SCORE}%</span>
            </div>
            <div className="dq-gauge-trend">
              <span className="dq-gauge-trend__label">Score Trend</span>
              <span className="dq-gauge-trend__info" title="Score trend over the last 6 weeks"><IcInfo /></span>
              {!trendDelta ? (
                <span className="dq-gauge-trend__empty">No trend data available</span>
              ) : (
                <>
                  <div className="dq-gauge-trend__spark" data-nav-explore="chart" data-nav-label="Score Trend">
                    <ChartRender chartId="kpi" compact data={{ trendData: activeSubject.trend }} />
                  </div>
                  <span className={`dq-gauge-trend__delta${trendDelta.up ? ' dq-gauge-trend__delta--up' : ' dq-gauge-trend__delta--down'}`}>
                    {trendDelta.up ? <IcTrendUp /> : <IcTrendDown />}{trendDelta.pct}%
                  </span>
                  <span className="dq-gauge-trend__from">from last week</span>
                </>
              )}
            </div>
          </div>

          {/* Dimensions radar */}
          <div className="dq-card dq-card--dims" data-nav-explore="chart" data-nav-label="Dimensions">
            <div className="dq-card__title">Dimensions</div>
            <div className="dq-card__body">
              <ChartRender
                chartId="radar"
                data={radarData}
                radarSeries={[
                  { key: 'value',   color: 'var(--pai-indigo)',    label: displaySubject.name },
                  { key: 'overall', color: 'var(--pai-caution-fg)', label: 'Overall' },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Dimension tab strip + Entity Distribution / Attributes split —
            switching tabs re-derives categoryData/subjectAttributes above. */}
        <div className="dq-card dq-card--wide">
          <div className="dq-tabstrip">
            <DimensionTabs
              value={activeDim}
              options={DIMENSIONS}
              disabledOptions={[]}
              onChange={setActiveDim}
            />
          </div>

          <div className="dq-split">
            <div className="dq-split__col">
              <div className="dq-split__head">
                <span className="dq-split__title">Entity Distribution</span>
                <div className="dq-split__controls">
                  <span className="dq-split__label">Group by</span>
                  <SelectDropdown value={groupBy} onChange={setGroupBy} options={GROUP_BY_OPTIONS} />
                </div>
              </div>
              <div className="dq-split__body" data-nav-explore="chart" data-nav-label="Entity Distribution">
                <ChartRender
                  chartId="stack-hor"
                  data={categoryData}
                  seriesKeys={CATEGORY_SERIES}
                  showLegend={false}
                  onSegmentClick={onToggleFilter ? (rowValue, seriesKey) => onToggleFilter([
                    { attrId: groupBy, key: groupBy, value: rowValue },
                    { attrId: 'quality-bucket', key: 'Quality', value: seriesKey },
                  ]) : undefined}
                />
              </div>
            </div>

            <div className="dq-split__col dq-split__col--attrs">
              <div className="dq-split__head">
                <span className="dq-split__title">Attributes</span>
                <div className="dq-split__controls">
                  <DSPillSearch
                    value={attrSearch}
                    onChange={v => { setAttrSearch(v); setAttrPage(1) }}
                    placeholder="Search Attributes"
                    width={170}
                  />
                  <SelectDropdown
                    value={attrCategory}
                    onChange={v => { setAttrCategory(v); setAttrPage(1) }}
                    options={attrCategories}
                  />
                </div>
              </div>
              <div className="ds-table-wrap dq-split__table-wrap" data-nav-explore="table" data-nav-label="Attributes">
                <table className="ds-table">
                  <thead>
                    <tr>
                      <th className="ds-th">
                        <button className={`dq-th-sort${attrSort.key === 'name' ? ' dq-th-sort--active' : ''}`} onClick={() => toggleAttrSort('name')}>
                          Name <span className="dq-th-sort__icon"><IcSortCaret /></span>
                        </button>
                      </th>
                      <th className="ds-th">
                        <button className={`dq-th-sort${attrSort.key === 'score' ? ' dq-th-sort--active' : ''}`} onClick={() => toggleAttrSort('score')}>
                          Score <span className="dq-th-sort__icon"><IcSortCaret /></span>
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedAttrs.length === 0 && (
                      <tr><td className="ds-td" colSpan={2}>🚦 No Data… For Now!</td></tr>
                    )}
                    {pagedAttrs.map(a => {
                      const color = scoreColor(a.score)
                      return (
                        <tr key={a.name}>
                          <td className="ds-td">{a.name}</td>
                          <td className="ds-td dq-attr-score-cell">
                            <div className="cr-findings-bar">
                              <div className="cr-findings-bar__track">
                                <div className="cr-findings-bar__fill" style={{ '--cr-pct': `${a.score}%`, '--fb-color': color }} />
                              </div>
                              <span className="cr-findings-pct" style={{ '--fb-color': color }}>{a.score}%</span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <TablePagination
                total={filteredAttrs.length}
                page={attrPage}
                rowsPerPage={attrRowsPerPage}
                onPageChange={setAttrPage}
                onRowsPerPageChange={n => { setAttrRowsPerPage(n); setAttrPage(1) }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
