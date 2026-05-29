import React, { useState, useRef, useEffect } from 'react'
import { PAI, Ic } from '../ui.jsx'
import { ChartRender, DEFAULT_VERT_BAR } from '../components/ChartRender.jsx'
import { DSPillSearch } from '../context/WorkspaceCtx.jsx'
import DiscoverDevicePage from './DiscoverDevicePage.jsx'
import '../styles/dashboard.css'
import '../styles/compliance.css'

// ── Color helpers ────────────────────────────────────────────────────
function hsvToRgb(h, s, v) {
  s /= 100; v /= 100
  const i = Math.floor(h / 60) % 6
  const f = h / 60 - Math.floor(h / 60)
  const p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s)
  const m = [[v,t,p],[q,v,p],[p,v,t],[p,q,v],[t,p,v],[v,p,q]][i]
  return m.map(x => Math.round(x * 255))
}
function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0').toUpperCase()).join('')
}
function hexToHsv(hex) {
  const h = hex.replace('#', '').padEnd(6, '0')
  const r = parseInt(h.slice(0,2),16)/255, g = parseInt(h.slice(2,4),16)/255, b = parseInt(h.slice(4,6),16)/255
  const max = Math.max(r,g,b), min = Math.min(r,g,b), d = max - min
  let hh = 0
  if (d) {
    if (max === r) hh = ((g - b) / d % 6) * 60
    else if (max === g) hh = ((b - r) / d + 2) * 60
    else hh = ((r - g) / d + 4) * 60
    if (hh < 0) hh += 360
  }
  return [Math.round(hh), max ? Math.round(d / max * 100) : 0, Math.round(max * 100)]
}

// ── Constants ────────────────────────────────────────────────────────
const WIDGET_SIZES = [
  { id: 'small',   label: 'Small',       span: 1 },
  { id: 'medium',  label: 'Medium',      span: 2 },
  { id: 'large',   label: 'Large',       span: 3 },
  { id: 'xlarge',  label: 'Extra Large', span: 4 },
]
const WIDGET_HEIGHTS = [
  { id: 'small',   label: 'Small',       px: 260 },
  { id: 'medium',  label: 'Medium',      px: 360 },
  { id: 'large',   label: 'Large',       px: 460 },
  { id: 'xlarge',  label: 'Extra Large', px: 560 },
]
const HEADING_WIDGET_SIZES = [
  { id: 'xsmall', label: 'Extra Small', span: 1 },
  { id: 'small',  label: 'Small',       span: 2 },
  { id: 'medium', label: 'Medium',      span: 3 },
  { id: 'large',  label: 'Large',       span: 4 },
  { id: 'xlarge', label: 'Extra Large', span: 4 },
]
const HEADING_WIDGET_HEIGHTS = [
  { id: '3xsmall', label: '3x Small',    px: 80  },
  { id: '2xsmall', label: '2x Small',    px: 120 },
  { id: 'xsmall',  label: 'Extra Small', px: 160 },
  { id: 'small',   label: 'Small',       px: 260 },
  { id: 'medium',  label: 'Medium',      px: 360 },
  { id: 'large',   label: 'Large',       px: 460 },
  { id: 'xlarge',  label: 'Extra Large', px: 560 },
]
const PERF_LEVELS = [
  { max: 4,        label: 'Optimal',           bg: 'rgba(22,163,74,0.10)',  color: 'var(--pai-green)', dot: 'var(--pai-green)' },
  { max: 7,        label: 'Approaching Limit', bg: 'rgba(217,119,6,0.10)', color: 'var(--pai-high-fg)', dot: 'var(--pai-high-fg)' },
  { max: Infinity, label: 'Limit Reached',     bg: 'rgba(220,38,38,0.10)', color: 'var(--pai-crit-fg)', dot: 'var(--pai-crit-fg)' },
]
const perfLevel = count => PERF_LEVELS.find(l => count <= l.max)

const KG_COLUMNS = [
  'AAD Created', 'AAD Deleted Date', 'AAD Device Category', 'AAD Device ID',
  'AAD Enrolled', 'AAD Management Service', 'AAD Management Status', 'AAD System Label',
  'Accessibility', 'Account ID', 'Active Blocking Mode', 'Active Blocking Status',
  'Active Operational Date', 'Active Owner Count', 'Active Threat Count', 'Activity Status',
  'AD Account Disabled Date', 'AD Created', 'AD Distinguished Name', 'AD Last Sync Date',
  'AD ObjectGUID', 'AD Operational Status', 'AD UAC Compliance Status', 'AD User Account Control',
  'Aggregated Quality Score', 'Anti Virus Scan Completed', 'Asset Compliance Scope',
  'Asset Criticality', 'Asset Criticality Score', 'Display Label', 'Type',
]

const CHART_TYPES = [
  { id: 'heading',    label: 'Heading' },
  { id: 'kpi',        label: 'KPI Card' },
  { id: 'pie',        label: 'Pie Chart' },
  { id: 'hor-bar',    label: 'Horizontal Bar Chart' },
  { id: 'vert-bar',   label: 'Vertical Bar Chart' },
  { id: 'stack-hor',  label: 'Stacked Horizontal Bar' },
  { id: 'stack-vert', label: 'Stacked Vertical Bar' },
  { id: 'line',       label: 'Line Chart' },
  { id: 'table',      label: 'Table' },
]

const VERT_BAR_PALETTE = ['#D12329','#D98B1D','#6360D8','#31A56D','#64748B','#94A3B8']

function buildChartColors(widget) {
  const rows  = widget.data || DEFAULT_VERT_BAR
  const saved = widget.chartColors || {}
  return Object.fromEntries(
    rows.map((row, i) => [row.label, saved[row.label] || VERT_BAR_PALETTE[i % VERT_BAR_PALETTE.length]])
  )
}
const GRAPH_FILTER_ATTRS = [
  'Entity ID', 'Display Label', 'Type', 'Origin', 'Origin (Count)',
  'Data Feed', 'First Found', 'First Seen', 'Last Found', 'Last Active',
  'Activity Status', 'Lifetime', 'Recent Activity', 'Completeness Quality Score',
]
const GRAPH_FILTER_VALUES = {
  'Type': ['Hypervisor', 'Mobile', 'Network Device', 'Other', 'Server', 'Workstation'],
}

const CRITICALITY_SWATCHES = ['#D12329','#E15252','#D98B1D','#CDB900','#31A56D','#1A7D4D']
const COMMON_SWATCHES = [
  '#5C6FC4','#2622A5','#95CB77','#F4CA5F','#42A7F2','#A3A5AF','#49A172','#F48858',
  '#9861B3','#7FBFDD','#E66B69','#E47FCB','#FF9F00','#B6D3B0','#9C75D9','#4C8D3F',
  '#E64C4C','#DFE64C','#9DE64C','#4CE64C','#4CE69E','#4CDFE6','#00895E','#BA3D8C',
  '#4C9DE6','#4C4CE6','#E64CE6','#E64C9E','#4B9CE2','#F0B642','#F25A8C','#11D4D4','#0D40A5',
]

// ── Chart icons (panel) ──────────────────────────────────────────────
const LCNC_ICONS = {
  'hor-bar':    'assets/icons/lcnc/horizontalbar.svg',
  'vert-bar':   'assets/icons/lcnc/verticalbar.svg',
  'stack-hor':  'assets/icons/lcnc/stack-horizontalbar.svg',
  'stack-vert': 'assets/icons/lcnc/stack-verticalbar.svg',
  'pie':        'assets/icons/lcnc/pie.svg',
  'line':       'assets/icons/lcnc/line.svg',
  'table':      'assets/icons/lcnc/table.svg',
  'kpi':        'assets/icons/lcnc/KPI.svg',
}

const ChartIcon = ({ id, selected }) => {
  const src = LCNC_ICONS[id]
  if (src) return (
    <span
      className="dc-chart-icon-mask"
      style={{
        '--dc-icon-color': selected ? PAI.indigo : 'var(--shell-text-muted)',
        '--dc-mask-url': `url(${src})`,
      }}
    />
  )
  const s = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' }
  const icons = {
    'heading': <><line x1="4" y1="7" x2="4" y2="17" {...s}/><line x1="20" y1="7" x2="20" y2="17" {...s}/><line x1="4" y1="12" x2="20" y2="12" {...s}/><line x1="7" y1="7" x2="17" y2="7" {...s}/></>,
    'none':    <><rect x="3" y="3" width="18" height="18" rx="2" {...s} strokeDasharray="3 2"/></>,
  }
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none">{icons[id]}</svg>
}

// ── Chart constants (skeleton only — ChartRender has its own) ────────
const G  = '#E5E7EB'  // skeleton gray
const GL = '#F3F4F6'  // skeleton light gray

// ── Chart silhouettes (DS skeleton / loading state) ───────────────────
function ChartSilhouette({ chartId }) {
  const silhouettes = {
    'pie': (
      <div className="dc-silhouette-pie-wrap">
        <div className="dc-silhouette-pie-center">
          <svg width="130" height="130" viewBox="0 0 130 130">
            <circle cx="65" cy="65" r="48" fill="none" stroke={G} strokeWidth="12"/>
            <circle cx="65" cy="65" r="48" fill="none" stroke={GL} strokeWidth="12"
              strokeDasharray="45 999" transform="rotate(-90 65 65)"/>
            <circle cx="65" cy="65" r="20" fill={GL}/>
          </svg>
        </div>
        <div className="dc-silhouette-legend">
          {[[48,28],[42,36]].map(([lw,vw], i) => (
            <div key={i} className="dc-silhouette-legend-row">
              <div className="dc-silhouette-legend-left">
                <div className="dc-silhouette-dot"/>
                <div className="dc-silhouette-bar" style={{ '--dc-bar-w': `${lw}px` }}/>
              </div>
              <div className="dc-silhouette-bar" style={{ '--dc-bar-w': `${vw}px` }}/>
            </div>
          ))}
        </div>
      </div>
    ),
    'hor-bar': (
      <svg viewBox="0 0 220 160" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        {[[28,17],[22,41],[32,65],[18,89],[14,113]].map(([w,y],i) => (
          <rect key={i} x="4" y={y} width={w} height="9" rx="4" fill={G}/>
        ))}
        {[[115,17],[85,41],[50,65],[30,89],[8,113]].map(([w,y],i) => (
          <rect key={i} x="38" y={y} width={w} height="12" rx="3" fill={G}/>
        ))}
        <line x1="38" y1="133" x2="210" y2="133" stroke={G} strokeWidth="1"/>
        {[38,79,120,161,202].map((x,i) => (
          <rect key={i} x={x-12} y="137" width="24" height="8" rx="4" fill={G}/>
        ))}
      </svg>
    ),
    'stack-hor': (
      <svg viewBox="0 0 220 160" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        {[[28,17],[22,41],[32,65],[18,89],[14,113]].map(([w,y],i) => (
          <rect key={i} x="4" y={y} width={w} height="9" rx="4" fill={G}/>
        ))}
        {[[80,50,30],[60,55,25],[70,45,35],[35,60,45],[15,30,20]].map(([w1,w2,w3],i) => {
          const y = 17+i*24
          return (
            <g key={i}>
              <rect x={38} y={y} width={w1} height="12" rx="2" fill={G}/>
              <rect x={38+w1+2} y={y} width={w2} height="12" rx="2" fill={GL}/>
              <rect x={38+w1+w2+4} y={y} width={w3} height="12" rx="2" fill={G}/>
            </g>
          )
        })}
        <line x1="38" y1="133" x2="210" y2="133" stroke={G} strokeWidth="1"/>
        {[38,79,120,161,202].map((x,i) => (
          <rect key={i} x={x-12} y="137" width="24" height="8" rx="4" fill={G}/>
        ))}
      </svg>
    ),
    'vert-bar': (
      <svg viewBox="0 0 220 160" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        {[10,37,64,91,118].map((y,i) => (
          <rect key={i} x="2" y={y} width="22" height="8" rx="4" fill={G}/>
        ))}
        {[14,41,68,95,122].map(y => (
          <line key={y} x1="30" y1={y} x2="210" y2={y} stroke={G} strokeWidth="0.8"/>
        ))}
        {[[110,36],[78,72],[52,108],[20,144],[7,180]].map(([h,x],i) => (
          <rect key={i} x={x} y={133-h} width="18" height={h} rx="3" fill={G}/>
        ))}
        <line x1="30" y1="133" x2="210" y2="133" stroke={G} strokeWidth="1"/>
        {[36,72,108,144,180].map((x,i) => (
          <rect key={i} x={x-9} y="137" width="24" height="8" rx="4" fill={G}/>
        ))}
      </svg>
    ),
    'stack-vert': (
      <svg viewBox="0 0 220 160" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        {[10,37,64,91,118].map((y,i) => (
          <rect key={i} x="2" y={y} width="22" height="8" rx="4" fill={G}/>
        ))}
        {[14,41,68,95,122].map(y => (
          <line key={y} x1="30" y1={y} x2="210" y2={y} stroke={G} strokeWidth="0.8"/>
        ))}
        {[[50,40,30],[30,50,40],[60,35,25],[20,45,55],[40,30,50]].map(([h1,h2,h3],i) => {
          const x = 36+i*36; const t = h1+h2+h3
          return (
            <g key={i}>
              <rect x={x} y={133-t} width="18" height={h1} rx="2" fill={G}/>
              <rect x={x} y={133-h2-h3} width="18" height={h2} fill={GL}/>
              <rect x={x} y={133-h3} width="18" height={h3} fill={G}/>
            </g>
          )
        })}
        <line x1="30" y1="133" x2="210" y2="133" stroke={G} strokeWidth="1"/>
        {[36,72,108,144,180].map((x,i) => (
          <rect key={i} x={x-9} y="137" width="24" height="8" rx="4" fill={G}/>
        ))}
      </svg>
    ),
    'line': (
      <svg viewBox="0 0 220 160" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        {[10,37,64,91,118].map((y,i) => (
          <rect key={i} x="2" y={y} width="22" height="8" rx="4" fill={G}/>
        ))}
        {[14,41,68,95,122].map(y => (
          <line key={y} x1="30" y1={y} x2="210" y2={y} stroke={G} strokeWidth="0.8"/>
        ))}
        <polyline points="38,115 76,75 114,95 152,55 190,45" fill="none" stroke={G} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="38,90 76,110 114,60 152,85 190,70" fill="none" stroke={GL} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="38,125 76,95 114,130 152,100 190,115" fill="none" stroke={G} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        {[[38,115],[76,75],[114,95],[152,55],[190,45]].map(([x,y],i) => (
          <circle key={i} cx={x} cy={y} r="4" fill={GL} stroke={G} strokeWidth="1.5"/>
        ))}
        <line x1="30" y1="133" x2="210" y2="133" stroke={G} strokeWidth="1"/>
        {[38,76,114,152,190].map((x,i) => (
          <rect key={i} x={x-10} y="137" width="22" height="8" rx="4" fill={G}/>
        ))}
      </svg>
    ),
    'table': (
      <svg viewBox="0 0 220 160" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        <rect x="8" y="8" width="204" height="22" rx="4" fill={G}/>
        {[0,1,2,3,4].map(i => (
          <rect key={i} x="8" y={40+i*24} width="204" height="21" rx="2" fill={i%2===0?G:GL}/>
        ))}
      </svg>
    ),
    'kpi': (
      <svg viewBox="0 0 220 90" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        <rect x="12" y="12" width="52" height="16" rx="8" fill={G}/>
        <circle cx="202" cy="20" r="14" fill={G}/>
        <rect x="12" y="38" width="132" height="18" rx="9" fill={G}/>
        <rect x="12" y="66" width="56" height="14" rx="7" fill={G}/>
        <rect x="74" y="66" width="82" height="14" rx="7" fill={G}/>
      </svg>
    ),
  }
  if (chartId === 'none' || chartId === 'heading') return null
  return (
    <div className="dc-silhouette-outer">
      <div className="dc-silhouette-inner">
        {silhouettes[chartId] || silhouettes['vert-bar']}
      </div>
    </div>
  )
}

// ── KG picker button ─────────────────────────────────────────────────
const KGBtn = () => (
  <button
    className="dc-kg-btn"
    style={{ '--dc-indigo': PAI.indigo, '--dc-indigo-tint': PAI.indigoTint }}
  >
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="6" cy="12" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="18" cy="18" r="2"/>
      <line x1="8" y1="11" x2="16" y2="7"/><line x1="8" y1="13" x2="16" y2="17"/>
    </svg>
  </button>
)

// ── Toggle ───────────────────────────────────────────────────────────
function Toggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="dc-toggle-track"
      style={{ '--dc-toggle-bg': value ? PAI.indigo : 'var(--pai-border-strong)' }}
    >
      <span
        className="dc-toggle-thumb"
        style={{ '--dc-toggle-left': value ? '18px' : '2px' }}
      />
    </button>
  )
}

function InfoTooltip({ text }) {
  return (
    <span className="dc-info-tooltip" data-tip={text}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
      </svg>
    </span>
  )
}

function ToggleRow({ label, description, value, onChange, disabled, tooltip }) {
  return (
    <div
      className="dc-toggle-row"
      style={{
        '--dc-row-opacity': disabled ? 0.4 : 1,
        '--dc-row-events': disabled ? 'none' : 'auto',
        '--dc-fg1': PAI.fg1,
        '--dc-fg3': PAI.fg3,
      }}
    >
      <div className="dc-toggle-row-body">
        <div className="dc-toggle-row-label">
          {label}
          {tooltip && <InfoTooltip text={tooltip} />}
        </div>
        {description && <div className="dc-toggle-row-desc">{description}</div>}
      </div>
      <Toggle value={value} onChange={onChange} />
    </div>
  )
}

// ── Field row ────────────────────────────────────────────────────────
function FieldRow({ label, hint, tooltip, children }) {
  return (
    <div className="dc-field-row" style={{ '--dc-fg1': PAI.fg1, '--dc-fg3': PAI.fg3 }}>
      {label && (
        <div className={`dc-field-label ${hint ? 'dc-field-label--with-hint' : 'dc-field-label--no-hint'}`}>
          {label}
          {tooltip && <InfoTooltip text={tooltip} />}
        </div>
      )}
      {hint  && <div className="dc-field-hint">{hint}</div>}
      {children}
    </div>
  )
}

function TextInput({ placeholder, value, onChange, withKG }) {
  return (
    <div className="dc-text-input-wrap">
      <input
        value={value || ''} onChange={onChange}
        placeholder={placeholder}
        className="dc-text-input"
        style={{ '--dc-input-color': value ? PAI.fg1 : PAI.fg3 }}
      />
      {withKG && <KGBtn />}
    </div>
  )
}

function TextArea({ placeholder, value, onChange }) {
  return (
    <textarea
      value={value || ''} onChange={onChange}
      placeholder={placeholder}
      rows={3}
      className="dc-textarea"
      style={{ '--dc-fg3': PAI.fg3 }}
    />
  )
}

function SelectInput({ value, onChange, options }) {
  return (
    <select
      value={value || ''} onChange={onChange}
      className="dc-select-input"
      style={{ '--dc-input-color': value ? PAI.fg1 : PAI.fg3 }}
    >
      {options.map(o => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
    </select>
  )
}

function SizeSelectDropdown({ value, onChange, options }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const selected = options.find(o => o.value === value)

  useEffect(() => {
    if (!open) return
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="dc-col-dropdown-wrap">
      <button
        className={`dc-col-trigger${open ? ' dc-col-trigger--open' : ''}`}
        onClick={() => setOpen(o => !o)}
        style={{ color: selected ? PAI.fg1 : PAI.fg3 }}
      >
        <span>{selected ? selected.label : 'Select...'}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>
      {open && (
        <div className="comp-sort-menu dc-col-menu" style={{ width: '100%' }}>
          {options.map(o => (
            <button
              key={o.value}
              className={`comp-sort-item${o.value === value ? ' comp-sort-item--selected' : ''}`}
              onClick={() => { onChange(o.value); setOpen(false) }}
            >{o.label}</button>
          ))}
        </div>
      )}
    </div>
  )
}

function SizeButtons({ options, value, onChange }) {
  return (
    <div className="dc-size-buttons">
      {options.map(o => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className="dc-size-btn"
          style={{
            '--dc-sizebtn-bg':     value === o.id ? PAI.indigoTint : 'var(--card-bg)',
            '--dc-sizebtn-border': value === o.id ? PAI.indigo     : 'var(--shell-border)',
            '--dc-sizebtn-color':  value === o.id ? PAI.indigo     : PAI.fg3,
          }}
        >{o.label}</button>
      ))}
    </div>
  )
}

// ── Column picker dropdown ───────────────────────────────────────────
function ColumnDropdown({ selected, onAdd }) {
  const [open, setOpen]     = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setSearch('') } }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const visible = KG_COLUMNS.filter(c =>
    !selected.includes(c) && (!search || c.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div ref={ref} className="dc-col-dropdown-wrap">
      <button
        className={`dc-col-trigger${open ? ' dc-col-trigger--open' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        <span>Select column...</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>
      {open && (
        <div className="comp-sort-menu dc-col-menu">
          <div className="dc-col-menu-search">
            <DSPillSearch value={search} onChange={setSearch} placeholder="Search columns..." width="100%" />
          </div>
          <div className="dc-col-menu-list">
            {visible.map(col => (
              <button
                key={col}
                className="comp-sort-item"
                onClick={() => { onAdd(col); setOpen(false); setSearch('') }}
              >{col}</button>
            ))}
            {visible.length === 0 && (
              <div className="dc-col-menu-empty">No columns found</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── GraphFilterModal ─────────────────────────────────────────────────
function GraphFilterModal({ currentAttr, mode = 'attr', onClose, onApply }) {
  const [selectedAttr, setSelectedAttr] = useState(currentAttr || 'Type')
  const [attrSearch,   setAttrSearch]   = useState('')
  const [valSearch,    setValSearch]    = useState('')
  const [selectedVals, setSelectedVals] = useState([])
  const [selectAll,    setSelectAll]    = useState(false)

  const filteredAttrs = GRAPH_FILTER_ATTRS.filter(a =>
    !attrSearch || a.toLowerCase().includes(attrSearch.toLowerCase())
  )
  const values = (GRAPH_FILTER_VALUES[selectedAttr] || []).filter(v =>
    !valSearch || v.toLowerCase().includes(valSearch.toLowerCase())
  )

  const toggleVal = v => setSelectedVals(prev =>
    prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]
  )
  const handleSelectAll = () => {
    if (selectAll) { setSelectedVals([]); setSelectAll(false) }
    else           { setSelectedVals([...values]); setSelectAll(true) }
  }

  return (
    <div className="dc-gf-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="dc-gf-modal" style={{ '--dc-fg1': PAI.fg1, '--dc-fg3': PAI.fg3, '--dc-indigo': PAI.indigo }}>
        {/* Header */}
        <div className="dc-gf-header">
          <button className="dc-gf-tab">Graph Filter</button>
        </div>

        {/* Body */}
        <div className="dc-gf-body">
          {/* Left panel — attributes */}
          <div className="dc-gf-left">
            <button className="dc-gf-hide-attrs">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6"/>
              </svg>
              Hide Attributes
            </button>
            <div className="dc-gf-search-wrap">
              <input
                className="dc-gf-search-input"
                placeholder="Search attribute"
                value={attrSearch}
                onChange={e => setAttrSearch(e.target.value)}
              />
              <svg className="dc-gf-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </div>
            <div className="dc-gf-entity-label">Host</div>
            <div className="dc-gf-attr-list">
              {filteredAttrs.map(attr => (
                <div
                  key={attr}
                  className={`dc-gf-attr-item${selectedAttr === attr ? ' dc-gf-attr-item--active' : ''}`}
                  onClick={() => { setSelectedAttr(attr); setSelectedVals([]); setSelectAll(false) }}
                >
                  <span className={`dc-gf-attr-radio${selectedAttr === attr ? ' dc-gf-attr-radio--on' : ''}`} />
                  <span className="dc-gf-attr-name">{attr}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right panel — values */}
          <div className="dc-gf-right">
            <div className="dc-gf-val-heading">Values ({values.length})</div>
            <div className="dc-gf-search-wrap">
              <input
                className="dc-gf-search-input"
                placeholder="Search value"
                value={valSearch}
                onChange={e => setValSearch(e.target.value)}
              />
              <svg className="dc-gf-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </div>
            <div className="dc-gf-val-controls">
              <label className="dc-gf-select-all-label">
                <input type="checkbox" checked={selectAll} onChange={handleSelectAll} className="dc-gf-checkbox" />
                Select All as Pattern
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ opacity: 0.45 }}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
              </label>
              <span className="dc-gf-sort-label">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 6h18M7 12h10M11 18h2"/></svg>
                Sort by : A-Z
              </span>
            </div>
            <div className="dc-gf-val-grid">
              {values.map(v => (
                <div key={v} className="dc-gf-val-item" onClick={() => toggleVal(v)}>
                  <span className="dc-gf-val-name">{v}</span>
                  <span className={`dc-gf-val-radio${selectedVals.includes(v) ? ' dc-gf-val-radio--on' : ''}`} />
                </div>
              ))}
            </div>
            <div className="dc-gf-val-actions">
              <button className="dc-gf-action-btn">Exclude Selected</button>
              <button className="dc-gf-action-btn">Include Selection</button>
            </div>
            <div className="dc-gf-filters-section">
              <div className="dc-gf-filters-label">Filters</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="dc-gf-footer">
          <button className="ds-btn sz-md t-outline" onClick={onClose}>Cancel</button>
          <button
            className="ds-btn sz-md t-primary"
            onClick={() => mode === 'filter'
              ? onApply({ attr: selectedAttr, values: selectedVals })
              : onApply(selectedAttr)
            }
          >Apply</button>
        </div>
      </div>
    </div>
  )
}

// ── ColorPickerModal ─────────────────────────────────────────────────
function ColorPickerModal({ color, label, onClose, onApply }) {
  const init       = hexToHsv(color && /^#[0-9a-fA-F]{6}$/.test(color) ? color : '#FF0000')
  const [hue, setHue]         = useState(init[0])
  const [sat, setSat]         = useState(init[1])
  const [val, setVal]         = useState(init[2])
  const [hexInput, setHexInput] = useState((color || '#FF0000').replace('#','').toUpperCase())
  const canvasRef  = useRef(null)
  const modalRef   = useRef(null)
  const dragging   = useRef(false)

  useEffect(() => {
    const handler = e => { if (modalRef.current && !modalRef.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const currentHex = rgbToHex(...hsvToRgb(hue, sat, val))
  const pureHue    = rgbToHex(...hsvToRgb(hue, 100, 100))

  const applyCanvas = e => {
    const rect = canvasRef.current.getBoundingClientRect()
    const x  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const y  = Math.max(0, Math.min(1, (e.clientY - rect.top)  / rect.height))
    const ns = Math.round(x * 100), nv = Math.round((1 - y) * 100)
    setSat(ns); setVal(nv)
    setHexInput(rgbToHex(...hsvToRgb(hue, ns, nv)).replace('#',''))
  }

  const onHexChange = raw => {
    const v = raw.toUpperCase().replace(/[^0-9A-F]/g,'').slice(0,6)
    setHexInput(v)
    if (v.length === 6) {
      const [h, s, vv] = hexToHsv('#' + v)
      setHue(h); setSat(s); setVal(vv)
    }
  }

  const pickSwatch = c => {
    setHexInput(c.replace('#','').toUpperCase())
    const [h, s, vv] = hexToHsv(c)
    setHue(h); setSat(s); setVal(vv)
  }

  return (
    <div className="dc-cpicker-overlay">
      <div ref={modalRef} className="dc-cpicker-modal" style={{ '--dc-fg1': PAI.fg1, '--dc-fg3': PAI.fg3 }}>
        <div className="dc-cpicker-header">
          <svg className="dc-cpicker-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
          </svg>
          <span className="dc-cpicker-title">{label}</span>
          <button className="dc-panel-close-btn" onClick={onClose}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="dc-cpicker-body">
          <div
            ref={canvasRef}
            className="dc-cpicker-canvas"
            style={{ '--dc-cpicker-hue': pureHue }}
            onPointerDown={e => { dragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); applyCanvas(e) }}
            onPointerMove={e => dragging.current && applyCanvas(e)}
            onPointerUp={() => { dragging.current = false }}
          >
            <div className="dc-cpicker-canvas-overlay" />
            <div className="dc-cpicker-handle" style={{ '--dc-handle-l': `${sat}%`, '--dc-handle-t': `${100 - val}%` }} />
          </div>

          <div className="dc-cpicker-sliders">
            <input
              type="range" min="0" max="360" value={hue}
              className="dc-cpicker-hue-slider"
              onChange={e => {
                const h = Number(e.target.value)
                setHue(h)
                setHexInput(rgbToHex(...hsvToRgb(h, sat, val)).replace('#',''))
              }}
            />
          </div>

          <div className="dc-cpicker-hex-row">
            <div className="dc-cpicker-format-btn">
              <span>HEX</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
            </div>
            <div className="dc-cpicker-hex-wrap">
              <span className="dc-cpicker-hex-hash">#</span>
              <input
                value={hexInput}
                onChange={e => onHexChange(e.target.value)}
                className="dc-cpicker-hex-input"
                maxLength={6}
                spellCheck={false}
              />
            </div>
          </div>

          <div className="dc-cpicker-presets">
            <div className="dc-cpicker-preset-heading">Presets</div>
            <div className="dc-cpicker-preset-group-label">Criticality colors</div>
            <div className="dc-cpicker-swatches">
              {CRITICALITY_SWATCHES.map(c => (
                <button
                  key={c}
                  className={`dc-cpicker-swatch${currentHex.toUpperCase() === c.toUpperCase() ? ' dc-cpicker-swatch--on' : ''}`}
                  style={{ '--dc-sw': c }}
                  onClick={() => pickSwatch(c)}
                />
              ))}
            </div>
            <div className="dc-cpicker-preset-group-label">Common colors</div>
            <div className="dc-cpicker-swatches">
              {COMMON_SWATCHES.map(c => (
                <button
                  key={c}
                  className={`dc-cpicker-swatch${currentHex.toUpperCase() === c.toUpperCase() ? ' dc-cpicker-swatch--on' : ''}`}
                  style={{ '--dc-sw': c }}
                  onClick={() => pickSwatch(c)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="dc-cpicker-footer">
          <button className="ds-btn sz-md t-outline" onClick={onClose}>Cancel</button>
          <button className="ds-btn sz-md t-primary" onClick={() => onApply(currentHex)}>Save</button>
        </div>
      </div>
    </div>
  )
}

// ── Widget Settings Panel ────────────────────────────────────────────
function WidgetSettingsPanel({ widget, onSaveChanges, onClose }) {
  const [tab, setTab]             = useState('data')
  const [title, setTitle]         = useState(() => {
    const defaultLabel   = CHART_TYPES.find(c => c.id === widget.chartId)?.label
    const isClassChart   = widget.chartId === 'vert-bar' || widget.chartId === 'hor-bar' || widget.chartId === 'pie'
    return isClassChart && widget.label === defaultLabel
      ? (widget.classification || 'Type')
      : widget.label
  })
  const [description, setDescription] = useState(widget.description || '')
  const [sizeId, setSizeId]       = useState(widget.sizeId || 'small')
  const [heightId, setHeightId] = useState(widget.heightId || 'small')
  const [chartType, setChartType] = useState(widget.chartId)
  const [classification, setClassification] = useState('Type')
  const [operation, setOperation]           = useState('count-distinct')
  const [aggregateBy, setAggregateBy]       = useState('host')

  const [widgetFilters, setWidgetFilters]   = useState([])
  const [sortBy, setSortBy]                 = useState('')
  const [showTotalCount, setShowTotalCount] = useState(widget.showTotalCount ?? true)
  const [showPctChange, setShowPctChange]   = useState(widget.showPctChange ?? false)
  const [showLegend, setShowLegend]         = useState(widget.showLegend ?? true)
  const [columns, setColumns]               = useState(widget.columns || ['Type', 'Display Label'])
  const [enableDownload, setEnableDownload] = useState(widget.enableDownload ?? true)
  const [magnitude, setMagnitude]           = useState('Origin')
  const [magnitudeModalOpen, setMagnitudeModalOpen] = useState(false)
  const [stackClassModalOpen, setStackClassModalOpen] = useState(false)
  const [explodeArrayFields, setExplodeArrayFields] = useState(true)
  const [chartColors, setChartColors]       = useState(() => buildChartColors(widget))
  const [colorPickerOpen, setColorPickerOpen] = useState(null)
  const [filterModalOpen, setFilterModalOpen] = useState(false)
  const [widgetFilterModalOpen, setWidgetFilterModalOpen] = useState(false)
  const [exploreIn, setExploreIn] = useState(widget.exploreIn ?? false)

  const isPie       = chartType === 'pie'
  const isTable     = chartType === 'table'
  const isVertBar   = chartType === 'vert-bar'
  const isHorBar    = chartType === 'hor-bar'
  const isStackVert = chartType === 'stack-vert'
  const isHeading   = chartType === 'heading'

  return (
    <div
      className="dc-panel"
      style={{ '--dc-fg1': PAI.fg1, '--dc-fg3': PAI.fg3, '--dc-indigo': PAI.indigo }}
    >
      {/* Header */}
      <div className="dc-panel-header">
        <div className="dc-panel-title-row">
          <img src="/assets/icons/lcnc/dasboard-edit.svg" width={16} height={16} alt="" />
          <span className="dc-panel-title">Widget Settings</span>
          <button onClick={onClose} className="dc-panel-close-btn">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        {/* Tabs */}
        <div className="dc-panel-tabs">
          <button
            className="dc-panel-tab"
            style={{
              '--dc-tab-weight': tab === 'general' ? 600 : 400,
              '--dc-tab-color':  tab === 'general' ? PAI.fg1 : PAI.fg3,
              '--dc-tab-border': tab === 'general' ? PAI.indigo : 'transparent',
            }}
            onClick={() => setTab('general')}
          >General</button>
          <button
            className="dc-panel-tab"
            style={{
              '--dc-tab-weight': tab === 'data' ? 600 : 400,
              '--dc-tab-color':  tab === 'data' ? PAI.fg1 : PAI.fg3,
              '--dc-tab-border': tab === 'data' ? PAI.indigo : 'transparent',
            }}
            onClick={() => setTab('data')}
          >Data</button>
        </div>
      </div>

      {/* Body */}
      <div className="dc-panel-body">
        {tab === 'general' && (
          <>
            <FieldRow label="Widget Type">
              <SelectInput
                value={chartType}
                onChange={e => setChartType(e.target.value)}
                options={CHART_TYPES.map(c => ({ value: c.id, label: c.label }))}
              />
            </FieldRow>
            <FieldRow label="Widget Title">
              <TextInput placeholder="Enter widget title..." value={title} onChange={e => setTitle(e.target.value)} />
            </FieldRow>
            <FieldRow label="Description">
              <TextArea placeholder="Describe what this widget shows..." value={description} onChange={e => setDescription(e.target.value)} />
            </FieldRow>
            <div className="dc-size-section" style={{ '--dc-fg1': PAI.fg1, '--dc-fg3': PAI.fg3 }}>
              <div className="dc-size-section-heading">Widget Size</div>
              <div className="dc-size-sub-row">
                <div className="dc-size-sub-label">Width</div>
                <SizeSelectDropdown
                  value={sizeId}
                  onChange={v => setSizeId(v)}
                  options={(isHeading ? HEADING_WIDGET_SIZES : WIDGET_SIZES).map(s => ({ value: s.id, label: s.label }))}
                />
              </div>
              <div className="dc-size-sub-row">
                <div className="dc-size-sub-label">Height</div>
                <SizeSelectDropdown
                  value={heightId}
                  onChange={v => setHeightId(v)}
                  options={(isHeading ? HEADING_WIDGET_HEIGHTS : WIDGET_HEIGHTS).map(h => ({ value: h.id, label: h.label }))}
                />
              </div>
            </div>
            {(isVertBar || isHorBar) && (
              <>
                <FieldRow label="Configure Colors">
                  <div className="dc-color-config">
                    {Object.entries(chartColors).map(([key, color]) => (
                      <div key={key} className="dc-color-config-row">
                        <span className="dc-color-config-label">{key}</span>
                        <button
                          className="dc-color-config-input"
                          onClick={() => setColorPickerOpen(key)}
                        >
                          <span className="dc-color-config-dot" style={{ '--dc-dot-color': color }} />
                          <span className="dc-color-config-hex">{color.toUpperCase()}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </FieldRow>
                {colorPickerOpen && (
                  <ColorPickerModal
                    color={chartColors[colorPickerOpen]}
                    label={colorPickerOpen}
                    onClose={() => setColorPickerOpen(null)}
                    onApply={c => {
                      setChartColors(prev => ({ ...prev, [colorPickerOpen]: c }))
                      setColorPickerOpen(null)
                    }}
                  />
                )}
              </>
            )}
          </>
        )}

        {tab === 'data' && widget.dataLocked && (
          <div className="dc-data-locked">
            <span>No data configuration available for this widget.</span>
          </div>
        )}

        {tab === 'data' && !widget.dataLocked && (
          <>
            {isHeading ? (
              <>
                <ToggleRow
                  label="Enable Explore In"
                  description="Allow navigation to another dashboard with selected filter context."
                  value={exploreIn}
                  onChange={setExploreIn}
                />
                {exploreIn && (
                  <FieldRow label="Filter" hint="Select a widget filter for navigation context">
                    <TextInput placeholder="Select Widget Filter" withKG />
                  </FieldRow>
                )}
              </>
            ) : isTable ? (
              <>
                <FieldRow label="Columns" hint="Select fields to display as columns">
                  <ColumnDropdown selected={columns} onAdd={col => setColumns(c => [...c, col])} />
                  {columns.length > 0 && (
                    <div className="dc-chips">
                      {columns.map(col => (
                        <span key={col} className="dc-chip">
                          {col}
                          <button
                            onClick={() => setColumns(c => c.filter(x => x !== col))}
                            className="dc-chip-x"
                          >×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </FieldRow>
                <FieldRow label="Widget Filter" hint="Filter data shown in this widget">
                  <TextInput placeholder="Select Widget Filter" withKG />
                </FieldRow>
                <div className="dc-divider" />
                <ToggleRow
                  label="Enable Download"
                  description="Table can be downloaded as CSV or XLSX."
                  value={enableDownload}
                  onChange={setEnableDownload}
                />
              </>
            ) : isPie ? (
              <>
                <FieldRow label="Attribute" hint="Define how to divide sections in pie">
                  <FieldRow label="Classification">
                    <TextInput value={classification} onChange={e => setClassification(e.target.value)} withKG />
                  </FieldRow>
                </FieldRow>
                <FieldRow label="Size" hint="Display total/distinct count in the center of pie chart">
                  <div className="dc-axis-row">
                    <div className="dc-axis-col">
                      <div className="dc-axis-label">Operation</div>
                      <SelectInput value={operation} onChange={e => setOperation(e.target.value)} options={[{ value:'count-distinct',label:'Count Distinct'},{ value:'count',label:'Count'},{ value:'sum',label:'Sum'},{ value:'avg',label:'Avg'}]} />
                    </div>
                    <div className="dc-axis-col">
                      <div className="dc-axis-label">Aggregate By</div>
                      <SelectInput value={aggregateBy} onChange={e => setAggregateBy(e.target.value)} options={[{ value:'host',label:'Host'},{ value:'entity-id',label:'Entity ID'},{ value:'ip',label:'IP Address'}]} />
                    </div>
                  </div>
                </FieldRow>
              </>
            ) : isVertBar ? (
              <>
                <FieldRow label="Attribute*">
                  <div className="dc-field-sub-label">Classification (x-axis)</div>
                  <div className="dc-text-input-wrap">
                    <input
                      readOnly
                      value={classification}
                      className="dc-text-input"
                      style={{ '--dc-input-color': PAI.fg1 }}
                    />
                    <button
                      className="dc-kg-btn"
                      onClick={() => setFilterModalOpen(true)}
                      style={{ '--dc-indigo': PAI.indigo, '--dc-indigo-tint': PAI.indigoTint }}
                    >
                      <img src="/assets/icons/graph-filter.svg" width={18} height={18} alt="" />
                    </button>
                  </div>
                </FieldRow>
                {filterModalOpen && (
                  <GraphFilterModal
                    currentAttr={classification}
                    onClose={() => setFilterModalOpen(false)}
                    onApply={attr => { setClassification(attr); setFilterModalOpen(false) }}
                  />
                )}

                <FieldRow label="Size" hint="Display total/distinct count in the vertical bar chart">
                  <div className="dc-axis-row--no-mb">
                    <div className="dc-axis-col">
                      <div className="dc-axis-label">Operation</div>
                      <SelectInput
                        value={operation}
                        onChange={e => setOperation(e.target.value)}
                        options={[
                          { value: 'count-distinct', label: 'Count Distinct' },
                          { value: 'count',          label: 'Count' },
                          { value: 'sum',            label: 'Sum' },
                        ]}
                      />
                    </div>
                    <div className="dc-axis-col">
                      <div className="dc-axis-label">Aggregate By</div>
                      <SelectInput
                        value={aggregateBy}
                        onChange={e => setAggregateBy(e.target.value)}
                        options={[
                          { value: 'host',      label: 'host' },
                          { value: 'entity-id', label: 'Entity ID' },
                          { value: 'ip',        label: 'IP Address' },
                        ]}
                      />
                    </div>
                  </div>
                </FieldRow>
                <FieldRow label="Widget Filter">
                  <div className="dc-text-input-wrap">
                    <input
                      readOnly
                      placeholder="Select Widget Filter"
                      className="dc-text-input"
                      style={{ '--dc-input-color': PAI.fg3 }}
                    />
                    <button
                      className="dc-kg-btn"
                      onClick={() => setWidgetFilterModalOpen(true)}
                      style={{ '--dc-indigo': PAI.indigo, '--dc-indigo-tint': PAI.indigoTint }}
                    >
                      <img src="/assets/icons/graph-filter.svg" width={18} height={18} alt="" />
                    </button>
                  </div>
                  {widgetFilters.length > 0 && (
                    <div className="dc-chips">
                      {widgetFilters.map((f, i) => (
                        <span key={i} className="dc-chip">
                          {f.attr}{f.values?.length ? `: ${f.values.join(', ')}` : ''}
                          <button
                            className="dc-chip-x"
                            onClick={() => setWidgetFilters(prev => prev.filter((_, j) => j !== i))}
                          >×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </FieldRow>
                {widgetFilterModalOpen && (
                  <GraphFilterModal
                    mode="filter"
                    onClose={() => setWidgetFilterModalOpen(false)}
                    onApply={f => { setWidgetFilters(prev => [...prev, f]); setWidgetFilterModalOpen(false) }}
                  />
                )}
                <div className="dc-divider" />
                <ToggleRow
                  label="Show Legend"
                  description="Display or hide the legend for this chart"
                  value={showLegend}
                  onChange={setShowLegend}
                />
              </>
            ) : isHorBar ? (
              <>
                <FieldRow label="Attribute*">
                  <div className="dc-field-sub-label">Classification (y-axis)</div>
                  <div className="dc-text-input-wrap">
                    <input
                      readOnly
                      value={classification}
                      className="dc-text-input"
                      style={{ '--dc-input-color': PAI.fg1 }}
                    />
                    <button
                      className="dc-kg-btn"
                      onClick={() => setFilterModalOpen(true)}
                      style={{ '--dc-indigo': PAI.indigo, '--dc-indigo-tint': PAI.indigoTint }}
                    >
                      <img src="/assets/icons/graph-filter.svg" width={18} height={18} alt="" />
                    </button>
                  </div>
                </FieldRow>
                {filterModalOpen && (
                  <GraphFilterModal
                    currentAttr={classification}
                    onClose={() => setFilterModalOpen(false)}
                    onApply={attr => { setClassification(attr); setFilterModalOpen(false) }}
                  />
                )}

                <FieldRow label="Size" hint="Display total/distinct count in the horizontal bar chart">
                  <div className="dc-axis-row--no-mb">
                    <div className="dc-axis-col">
                      <div className="dc-axis-label">Operation</div>
                      <SelectInput
                        value={operation}
                        onChange={e => setOperation(e.target.value)}
                        options={[
                          { value: 'count-distinct', label: 'Count Distinct' },
                          { value: 'count',          label: 'Count' },
                          { value: 'sum',            label: 'Sum' },
                        ]}
                      />
                    </div>
                    <div className="dc-axis-col">
                      <div className="dc-axis-label">Aggregate By</div>
                      <SelectInput
                        value={aggregateBy}
                        onChange={e => setAggregateBy(e.target.value)}
                        options={[
                          { value: 'host',      label: 'host' },
                          { value: 'entity-id', label: 'Entity ID' },
                          { value: 'ip',        label: 'IP Address' },
                        ]}
                      />
                    </div>
                  </div>
                </FieldRow>
                <FieldRow label="Widget Filter">
                  <div className="dc-text-input-wrap">
                    <input
                      readOnly
                      placeholder="Select Widget Filter"
                      className="dc-text-input"
                      style={{ '--dc-input-color': PAI.fg3 }}
                    />
                    <button
                      className="dc-kg-btn"
                      onClick={() => setWidgetFilterModalOpen(true)}
                      style={{ '--dc-indigo': PAI.indigo, '--dc-indigo-tint': PAI.indigoTint }}
                    >
                      <img src="/assets/icons/graph-filter.svg" width={18} height={18} alt="" />
                    </button>
                  </div>
                  {widgetFilters.length > 0 && (
                    <div className="dc-chips">
                      {widgetFilters.map((f, i) => (
                        <span key={i} className="dc-chip">
                          {f.attr}{f.values?.length ? `: ${f.values.join(', ')}` : ''}
                          <button
                            className="dc-chip-x"
                            onClick={() => setWidgetFilters(prev => prev.filter((_, j) => j !== i))}
                          >×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </FieldRow>
                {widgetFilterModalOpen && (
                  <GraphFilterModal
                    mode="filter"
                    onClose={() => setWidgetFilterModalOpen(false)}
                    onApply={f => { setWidgetFilters(prev => [...prev, f]); setWidgetFilterModalOpen(false) }}
                  />
                )}
                <div className="dc-divider" />
                <ToggleRow
                  label="Show Legend"
                  description="Display or hide the legend for this chart"
                  value={showLegend}
                  onChange={setShowLegend}
                />
              </>
            ) : isStackVert ? (
              <>
                <FieldRow label="Attribute*">
                  <div className="dc-field-sub-label">Magnitude ( x-axis )</div>
                  <div className="dc-text-input-wrap">
                    <input
                      readOnly
                      value={magnitude}
                      className="dc-text-input"
                      style={{ '--dc-input-color': PAI.fg1 }}
                    />
                    <button
                      className="dc-kg-btn"
                      onClick={() => setMagnitudeModalOpen(true)}
                      style={{ '--dc-indigo': PAI.indigo, '--dc-indigo-tint': PAI.indigoTint }}
                    >
                      <img src="/assets/icons/graph-filter.svg" width={18} height={18} alt="" />
                    </button>
                  </div>
                  <div className="dc-field-sub-label" style={{ marginTop: 8 }}>Classification ( y-axis )</div>
                  <div className="dc-text-input-wrap">
                    <input
                      readOnly
                      value={classification}
                      className="dc-text-input"
                      style={{ '--dc-input-color': PAI.fg1 }}
                    />
                    <button
                      className="dc-kg-btn"
                      onClick={() => setStackClassModalOpen(true)}
                      style={{ '--dc-indigo': PAI.indigo, '--dc-indigo-tint': PAI.indigoTint }}
                    >
                      <img src="/assets/icons/graph-filter.svg" width={18} height={18} alt="" />
                    </button>
                  </div>
                </FieldRow>
                {magnitudeModalOpen && (
                  <GraphFilterModal
                    currentAttr={magnitude}
                    onClose={() => setMagnitudeModalOpen(false)}
                    onApply={attr => { setMagnitude(attr); setMagnitudeModalOpen(false) }}
                  />
                )}
                {stackClassModalOpen && (
                  <GraphFilterModal
                    currentAttr={classification}
                    onClose={() => setStackClassModalOpen(false)}
                    onApply={attr => { setClassification(attr); setStackClassModalOpen(false) }}
                  />
                )}

                <FieldRow label="Size" hint="Display total/distinct count in the vertical stacked chart">
                  <div className="dc-axis-row--no-mb dc-axis-row--with-action">
                    <div className="dc-axis-col">
                      <div className="dc-axis-label">Operation</div>
                      <SelectInput
                        value={operation}
                        onChange={e => setOperation(e.target.value)}
                        options={[
                          { value: 'count-distinct', label: 'Count Distinct' },
                          { value: 'count',          label: 'Count' },
                          { value: 'sum',            label: 'Sum' },
                        ]}
                      />
                    </div>
                    <div className="dc-axis-col">
                      <div className="dc-axis-label">Aggregate By</div>
                      <SelectInput
                        value={aggregateBy}
                        onChange={e => setAggregateBy(e.target.value)}
                        options={[
                          { value: 'host',      label: 'host' },
                          { value: 'entity-id', label: 'Entity ID' },
                          { value: 'ip',        label: 'IP Address' },
                        ]}
                      />
                    </div>
                    <button
                      className="dc-kg-btn dc-kg-btn--bottom"
                      style={{ '--dc-indigo': PAI.indigo, '--dc-indigo-tint': PAI.indigoTint }}
                    >
                      <img src="/assets/icons/graph-filter.svg" width={18} height={18} alt="" />
                    </button>
                  </div>
                </FieldRow>

                <FieldRow
                  label="Widget Filter"
                  tooltip="Filter data shown in this widget"
                >
                  <div className="dc-text-input-wrap">
                    <input
                      readOnly
                      placeholder="Select Widget Filter"
                      className="dc-text-input"
                      style={{ '--dc-input-color': PAI.fg3 }}
                    />
                    <button
                      className="dc-kg-btn"
                      onClick={() => setWidgetFilterModalOpen(true)}
                      style={{ '--dc-indigo': PAI.indigo, '--dc-indigo-tint': PAI.indigoTint }}
                    >
                      <img src="/assets/icons/graph-filter.svg" width={18} height={18} alt="" />
                    </button>
                  </div>
                  {widgetFilters.length > 0 && (
                    <div className="dc-chips">
                      {widgetFilters.map((f, i) => (
                        <span key={i} className="dc-chip">
                          {f.attr}{f.values?.length ? `: ${f.values.join(', ')}` : ''}
                          <button
                            className="dc-chip-x"
                            onClick={() => setWidgetFilters(prev => prev.filter((_, j) => j !== i))}
                          >×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </FieldRow>
                {widgetFilterModalOpen && (
                  <GraphFilterModal
                    mode="filter"
                    onClose={() => setWidgetFilterModalOpen(false)}
                    onApply={f => { setWidgetFilters(prev => [...prev, f]); setWidgetFilterModalOpen(false) }}
                  />
                )}
                <div className="dc-divider" />
                <ToggleRow
                  label="Show Legend"
                  description="Display or hide the legend for this chart"
                  value={showLegend}
                  onChange={setShowLegend}
                />
                <ToggleRow
                  label="Explode Array Field Values"
                  description="Show distinct rows for fields with multiple values."
                  value={explodeArrayFields}
                  onChange={setExplodeArrayFields}
                  tooltip="When enabled, fields with multiple values will appear as separate entries in visualizations, instead of being grouped together."
                />
              </>
            ) : (
              <>
                <FieldRow label="X Axis">
                  <TextInput placeholder="Select field" withKG />
                </FieldRow>
                <FieldRow label="Y Axis">
                  <div className="dc-axis-row--no-mb">
                    <div className="dc-axis-col">
                      <div className="dc-axis-label">Operation</div>
                      <SelectInput value={operation} onChange={e => setOperation(e.target.value)} options={[{ value:'count',label:'Count'},{ value:'sum',label:'Sum'},{ value:'avg',label:'Avg'}]} />
                    </div>
                    <div className="dc-axis-col">
                      <div className="dc-axis-label">Aggregate By</div>
                      <TextInput placeholder="Field" withKG />
                    </div>
                  </div>
                </FieldRow>
              </>
            )}

            {!isPie && !isTable && !isVertBar && !isHorBar && !isHeading && !isStackVert && (
              <FieldRow label="Widget Filter">
                <TextInput placeholder="Select Widget Filter" withKG />
              </FieldRow>
            )}

            {!isPie && !isTable && !isVertBar && !isHorBar && !isHeading && !isStackVert && (
              <FieldRow label="Sort By" hint="Define how data is ordered in chart">
                <TextInput placeholder="Select field" />
              </FieldRow>
            )}

            {isPie && (
              <>
                <FieldRow label="Widget Filter">
                  <TextInput placeholder="Select Widget Filter" withKG />
                </FieldRow>
                <div className="dc-divider" />
                <ToggleRow
                  label="Show Legend"
                  description="Display or hide the legend for this chart"
                  value={showLegend}
                  onChange={setShowLegend}
                />
                <ToggleRow
                  label="Show Total Count"
                  description="Display total/distinct count in the center of pie chart"
                  value={showTotalCount}
                  onChange={setShowTotalCount}
                  disabled={!showLegend}
                />
                <ToggleRow
                  label="Show Percentage Change"
                  description='Display the change over time (e.g., "+12%" or "-5%")'
                  value={showPctChange}
                  onChange={setShowPctChange}
                  disabled={!showLegend}
                />
              </>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="dc-panel-footer">
        <button onClick={onClose} className="ds-btn sz-md t-outline">Cancel</button>
        <button
          onClick={() => onSaveChanges({
            label: title, description, sizeId, heightId, chartId: chartType,
            showTotalCount, showPctChange, showLegend,
            ...(isTable                                    && { columns, enableDownload }),
            ...((isVertBar || isHorBar)                   && { chartColors }),
            ...((isVertBar || isHorBar || isPie)          && { classification }),
            ...(isStackVert                               && { magnitude, classification, explodeArrayFields }),
            ...(isHeading                                 && { exploreIn }),
          })}
          className="ds-btn sz-md t-primary"
        >Apply</button>
      </div>
    </div>
  )
}

// ── Add Widget Panel ─────────────────────────────────────────────────
function AddWidgetPanel({ selected, setSelected, widgetTitle, setWidgetTitle, widgetDescription, setWidgetDescription, widgetSize, setWidgetSize, widgetHeight, setWidgetHeight, onSave, onCancel }) {
  const rows = []
  for (let i = 0; i < CHART_TYPES.length; i += 2) rows.push(CHART_TYPES.slice(i, i + 2))

  return (
    <div style={{ width: 348, flexShrink: 0, background: 'var(--card-bg)', border: '1px solid var(--shell-border)', borderRadius: 8, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* header */}
      <div style={{ padding: '12px', borderBottom: '1px solid var(--pai-border-strong)', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={PAI.fg1} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
          <line x1="17" y1="14" x2="17" y2="20"/><line x1="14" y1="17" x2="20" y2="17"/>
        </svg>
        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: PAI.fg1 }}>Add Widget</span>
        <button onClick={onCancel} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 2, color: PAI.fg3, display: 'flex' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 12px 0' }}>
        <FieldRow label="Widget Title">
          <TextInput placeholder="Enter widget title..." value={widgetTitle} onChange={e => setWidgetTitle(e.target.value)} />
        </FieldRow>
        <FieldRow label="Description">
          <TextArea placeholder="Describe what this widget shows..." value={widgetDescription} onChange={e => setWidgetDescription(e.target.value)} />
        </FieldRow>
        <FieldRow label="Widget Size">
          <SizeButtons options={WIDGET_SIZES} value={widgetSize} onChange={setWidgetSize} />
        </FieldRow>
        <FieldRow label="Widget Height">
          <SizeButtons options={WIDGET_HEIGHTS} value={widgetHeight} onChange={setWidgetHeight} />
        </FieldRow>
        <div style={{ fontSize: 12, fontWeight: 500, color: PAI.fg1, marginBottom: 8 }}>Widget Type</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 16 }}>
          {rows.map((row, ri) => (
            <div key={ri} style={{ display: 'flex', gap: 8 }}>
              {row.map(ct => (
                <button
                  key={ct.id}
                  onClick={() => setSelected(ct.id)}
                  style={{
                    flex: 1, height: 76, padding: 10,
                    background: selected === ct.id ? PAI.indigoTint : 'var(--card-bg)',
                    border: `1.5px solid ${selected === ct.id ? PAI.indigo : 'var(--shell-border)'}`,
                    borderRadius: 12, cursor: 'pointer',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 6,
                    color: selected === ct.id ? PAI.indigo : PAI.fg3,
                    transition: 'border-color 120ms, color 120ms, background 120ms',
                  }}
                >
                  <ChartIcon id={ct.id} selected={selected === ct.id} />
                  <span style={{ fontSize: 10, fontWeight: 500, textAlign: 'center', lineHeight: 1.3 }}>{ct.label}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* footer */}
      <div style={{ borderTop: '1px solid var(--shell-border)', padding: '12px', display: 'flex', gap: 8, justifyContent: 'flex-end', flexShrink: 0 }}>
        <button onClick={onCancel} className="ds-btn sz-md t-outline">Cancel</button>
        <button onClick={onSave} className="ds-btn sz-md t-primary" disabled={!selected} style={{ opacity: selected ? 1 : 0.4 }}>Save</button>
      </div>
    </div>
  )
}

// ── Widget Card ──────────────────────────────────────────────────────
function WidgetCard({ widget, isEditing, onEdit, onRequestDelete }) {
  const [hovered, setHovered]         = useState(false)
  const [dlOpen, setDlOpen]           = useState(false)
  const dlRef                         = useRef(null)
  const h = WIDGET_HEIGHTS.find(s => s.id === widget.heightId)?.px || 180
  const showDownload = widget.chartId === 'table' && widget.enableDownload !== false

  useEffect(() => {
    if (!dlOpen) return
    const handler = e => { if (dlRef.current && !dlRef.current.contains(e.target)) setDlOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [dlOpen])

  return (
    <div
      className="dc-widget-col"
      style={{
        '--dc-widget-span': widget.span,
        '--dc-fg1': PAI.fg1,
        '--dc-fg3': PAI.fg3,
        '--dc-indigo': PAI.indigo,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Hover actions */}
      {hovered && (
        <div className="dc-widget-actions">
          <button title="Move" className="dc-action-btn dc-action-btn--grab">
            <img src="/assets/icons/lcnc/drag-widget.svg" width={16} height={16} alt="drag" />
          </button>
          <button title="Add nested widget" className="dc-action-btn">
            <img src="/assets/icons/lcnc/add-widget.svg" width={16} height={16} alt="add widget" />
          </button>
          <button title="Edit" onClick={onEdit} className="dc-action-btn">
            <img src="/assets/icons/lcnc/dasboard-edit.svg" width={16} height={16} alt="edit" />
          </button>
          <button title="Delete" onClick={() => onRequestDelete(widget)} className="dc-action-btn dc-action-btn--delete">
            <img src="/assets/icons/lcnc/delete.svg" width={16} height={16} alt="delete" />
          </button>
        </div>
      )}

      {/* Card */}
      <div
        className="dc-widget-card"
        style={{
          '--dc-card-border': isEditing ? `1.5px dashed ${PAI.indigo}` : '1px solid var(--shell-border)',
          '--dc-card-height': `${h}px`,
        }}
      >
        <div className="dc-widget-card-header">
          <div className="dc-widget-card-title-row">
            <span className="dc-widget-card-title">{widget.label}</span>
            {showDownload && (
              <div ref={dlRef} className="comp-sort-wrap">
                <button
                  className="comp-drawer-download-btn"
                  disabled
                  onClick={() => setDlOpen(o => !o)}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Download
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ transition: 'transform 150ms', transform: dlOpen ? 'rotate(180deg)' : 'none' }}><path d="m6 9 6 6 6-6"/></svg>
                </button>
                {dlOpen && (
                  <div className="comp-dl-menu">
                    <button className="comp-dl-item" onClick={() => setDlOpen(false)}>CSV</button>
                    <button className="comp-dl-item" onClick={() => setDlOpen(false)}>Excel</button>
                  </div>
                )}
              </div>
            )}
          </div>
          {widget.description && (
            <div className="dc-widget-card-desc">{widget.description}</div>
          )}
        </div>
        <div className="dc-widget-card-body">
          <ChartRender chartId={widget.chartId} showPctChange={widget.showPctChange} showLegend={widget.showLegend ?? true} showTotalCount={widget.showTotalCount ?? true} data={widget.data} totalLabel={widget.totalLabel} columns={widget.columns} chartColors={widget.chartColors} />
        </div>
      </div>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────
// ── Discover Dashboard template ──────────────────────────────────────
const DISCOVER_TREND_DATA = [
  { name: '1 Sep', value: 3800  },
  { name: '1 Oct', value: 4600  },
  { name: '1 Nov', value: 5400  },
  { name: '1 Dec', value: 6100  },
  { name: '1 Jan', value: 6900  },
  { name: '1 Feb', value: 7600  },
  { name: '1 Mar', value: 8400  },
  { name: '1 Apr', value: 9200  },
  { name: '1 May', value: 10000 },
  { name: '1 Jun', value: 10800 },
  { name: '1 Jul', value: 11600 },
  { name: '8 Aug', value: 12382 },
]

const DISCOVER_INSIGHTS = [
  { sev: 'high', text: 'Adaptive application controls for defining safe applications should be configured on your machines',           failPct: 100, cat: 'Control Gap' },
  { sev: 'high', text: 'Adaptive network hardening recommendations should be applied on internet facing virtual machines',             failPct: 100, cat: 'Control Gap' },
  { sev: 'high', text: 'All network ports should be restricted on network security groups associated to your virtual machine',         failPct: 100, cat: 'Control Gap' },
  { sev: 'high', text: 'Allowlist rules in your adaptive application control policy should be updated',                                failPct: 100, cat: 'Control Gap' },
  { sev: 'high', text: 'Authentication to Linux machines should require SSH keys',                                                     failPct: 100, cat: 'Control Gap' },
  { sev: 'high', text: 'Endpoint protection should be installed on your machines',                                                     failPct: 97,  cat: 'Control Gap' },
  { sev: 'high', text: 'Guest configuration extension should be installed on your machines',                                           failPct: 94,  cat: 'Control Gap' },
  { sev: 'high', text: 'Log Analytics agent should be installed on your virtual machine for Azure Security Center monitoring',         failPct: 91,  cat: 'Control Gap' },
  { sev: 'high', text: 'MFA should be enabled on accounts with write permissions on your subscription',                                failPct: 88,  cat: 'Control Gap' },
  { sev: 'high', text: 'Remote debugging should be turned off for Function Apps',                                                      failPct: 85,  cat: 'Control Gap' },
]

const DISCOVER_TEMPLATE = {
  name: 'Discover Dashboard',
  widgets: [
    {
      id: 1001, label: 'Total Devices', chartId: 'kpi', span: 1, sizeId: 'small', heightId: 'medium', phase: 'active', dataLocked: true,
      data: { value: '12,382', label: 'Total Devices', trend: '3.89%', trendUp: true, trendData: DISCOVER_TREND_DATA },
    },
    {
      id: 1002, label: 'Criticality Insights', chartId: 'stack-hor', span: 2, sizeId: 'medium', heightId: 'medium', phase: 'active',
      data: [
        { label: 'Critical', count: '953',    pct: 1.74,  color: 'var(--pai-crit-fg)'  },
        { label: 'High',     count: '12,353', pct: 22.59, color: 'var(--pai-red-high)' },
        { label: 'Medium',   count: '36,136', pct: 66.08, color: 'var(--pai-high-fg)'  },
        { label: 'Low',      count: '5,244',  pct: 9.59,  color: 'var(--pai-green)'    },
      ],
    },
    {
      id: 1003, label: 'Data Source', chartId: 'hor-bar', span: 2, sizeId: 'medium', heightId: 'medium', phase: 'active',
      data: [
        { label: 'AWS',                 unique: 92, corroborated: 5  },
        { label: 'MS Azure',            unique: 80, corroborated: 5  },
        { label: 'Qualys',              unique: 36, corroborated: 20 },
        { label: 'MS Active Directory', unique: 17, corroborated: 30 },
        { label: 'WIZ',                 unique: 33, corroborated: 5  },
        { label: 'Infoblox',            unique: 5,  corroborated: 7  },
        { label: 'MS Defender',         unique: 3,  corroborated: 5  },
        { label: 'Tenable',             unique: 2,  corroborated: 3  },
      ],
    },
    {
      id: 1004, label: 'Asset Types', chartId: 'pie', span: 1, sizeId: 'small', heightId: 'medium', phase: 'active',
      totalLabel: '10,679',
      data: [
        { label: 'Server',      count: '4,086', value: 4086, pct: '33%', color: 'var(--pai-indigo)'       },
        { label: 'Workstation', count: '2,848', value: 2848, pct: '23%', color: '#5BADB8'                 },
        { label: 'Network',     count: '2,600', value: 2600, pct: '21%', color: 'var(--pai-green)'        },
        { label: 'Mobile',      count: '897',   value: 897,  pct: '8%',  color: 'var(--pai-high-fg)'      },
        { label: 'Printers',    count: '124',   value: 124,  pct: '1%',  color: 'var(--pai-red-high)'     },
        { label: 'IOT',         count: '122',   value: 122,  pct: '1%',  color: 'var(--pai-indigo-muted)' },
      ],
    },
    {
      id: 1005, label: 'Key Security Insights', chartId: 'table', span: 4, sizeId: 'xlarge', heightId: 'large', phase: 'active', dataLocked: true, enableDownload: true,
      data: DISCOVER_INSIGHTS,
    },
    {
      id: 1006, label: 'Assets by Criticality Score', chartId: 'table', span: 4, sizeId: 'xlarge', heightId: 'large', phase: 'active', dataLocked: true, enableDownload: true,
      data: [],
    },
  ],
}

export default function DashboardCanvas({ onNav, templateId = null }) {
  const template = templateId === 'discover' ? DISCOVER_TEMPLATE : null
  const [name, setName]       = useState(template?.name ?? '')
  const [widgets, setWidgets] = useState(() => {
    if (!template) return []
    return template.widgets
  })

  // Panel state: null | 'add' | 'settings'
  const [panelMode, setPanelMode]         = useState(null)
  const [settingsWidgetId, setSettingsWidgetId] = useState(null)
  const [deletePending, setDeletePending] = useState(null)

  // Add widget form
  const [selectedChart, setSelectedChart]       = useState(null)
  const [widgetTitle, setWidgetTitle]           = useState('')
  const [widgetDescription, setWidgetDescription] = useState('')
  const [widgetSize, setWidgetSize]             = useState('small')
  const [widgetHeight, setWidgetHeight]         = useState('small')

  const perf = widgets.filter(w => w.phase === 'active').length > 0
    ? perfLevel(widgets.filter(w => w.phase === 'active').length) : null

  const openAdd = () => {
    setSelectedChart(null); setWidgetTitle(''); setWidgetDescription(''); setWidgetSize('small'); setWidgetHeight('small')
    setPanelMode('add')
  }

  const handleAddSave = () => {
    if (!selectedChart) return
    const size = WIDGET_SIZES.find(s => s.id === widgetSize)
    const newId = (widgets.length > 0 ? Math.max(...widgets.map(w => w.id)) : 0) + 1
    setWidgets(w => [...w, {
      id: newId, label: widgetTitle || CHART_TYPES.find(c => c.id === selectedChart)?.label,
      description: widgetDescription,
      chartId: selectedChart, span: size.span, sizeId: widgetSize, heightId: widgetHeight,
      phase: 'active',
    }])
    setSettingsWidgetId(newId)
    setPanelMode('settings')
  }

  const handleAddCancel = () => { setPanelMode(null) }

  const handleSettingsSave = (newId, changes) => {
    const size = WIDGET_SIZES.find(s => s.id === changes.sizeId)
    setWidgets(ws => ws.map(w => w.id === newId
      ? { ...w, ...changes, span: size.span, phase: 'active' }
      : w
    ))
    setPanelMode(null)
    setSettingsWidgetId(null)
  }

  const handleSettingsClose = (widgetId) => {
    // if widget was never activated, remove it
    setWidgets(ws => ws.filter(w => !(w.id === widgetId && w.phase === 'settings')))
    setPanelMode(null)
    setSettingsWidgetId(null)
  }

  const openSettings = (id) => { setSettingsWidgetId(id); setPanelMode('settings') }
  const deleteWidget = (id) => { setWidgets(ws => ws.filter(w => w.id !== id)); if (settingsWidgetId === id) setPanelMode(null) }

  const DISCOVER_CARD_IDS = { total: 1001, crit: 1002, source: 1003, type: 1004, insights: 1005, assets: 1006 }
  const handleDiscoverEdit = (cardKey) => {
    const id = DISCOVER_CARD_IDS[cardKey]
    if (id) { setSettingsWidgetId(id); setPanelMode('settings') }
  }

  const settingsWidget = widgets.find(w => w.id === settingsWidgetId)

  return (
    <>
    <div
      className="dc-root"
      style={{ '--dc-bg-app': PAI.bgApp, '--dc-indigo': PAI.indigo, '--dc-indigo-tint': PAI.indigoTint, '--dc-fg1': PAI.fg1, '--dc-fg3': PAI.fg3 }}
    >
      <div className="dc-layout">

        {/* ── Canvas ── */}
        <div className="dc-canvas-wrap">

          {/* Toolbar */}
          <div className="dc-toolbar">
            <button
              onClick={() => onNav('workspace/library')}
              className="dc-toolbar-back-btn"
            >
              <Ic size={13} path={<polyline points="15 18 9 12 15 6"/>} />
            </button>

            <input
              value={name} onChange={e => setName(e.target.value)}
              placeholder="Enter dashboard name here..."
              className="dc-toolbar-name-input"
            />

            {perf && (
              <span
                className="dc-perf-badge"
                style={{ '--dc-perf-bg': perf.bg, '--dc-perf-color': perf.color, '--dc-perf-dot': perf.dot }}
              >
                <span className="dc-perf-dot" />
                {perf.label}
              </span>
            )}

            <div className="dc-toolbar-spacer" />

            <button className="ds-btn sz-md t-outline">Convert to Report</button>

            <span className="dc-scope-badge">
              Dashboard Scope
              <span className="dc-scope-icon">
                <img src="/assets/icons/lcnc/graph-filter.svg" width={20} height={20} alt="" className="dc-scope-icon-img" />
              </span>
            </span>

            <div className="dc-toolbar-divider" />

            <button className="ds-icon-btn" title="Reset" onClick={() => { setWidgets([]); setName(''); setPanelMode(null) }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
              </svg>
            </button>

            <button className="ds-btn sz-md t-primary">Save</button>
          </div>

          {/* Canvas body */}
          <div className={`dc-canvas-body${templateId === 'discover' ? ' dc-canvas-body--plain' : ''}`}>
            {templateId === 'discover' ? (
              <DiscoverDevicePage dashboardMode onEditWidget={handleDiscoverEdit} onAddWidget={openAdd} />
            ) : (
              <div className="dc-grid">

                {widgets.map(w => (
                  <WidgetCard
                    key={w.id}
                    widget={w}
                    isEditing={w.id === settingsWidgetId}
                    onEdit={() => openSettings(w.id)}
                    onRequestDelete={w => setDeletePending(w)}
                  />
                ))}

                {/* Add Widget placeholder / Live preview */}
                {panelMode === 'add' ? (
                  <div
                    className="dc-preview-col"
                    style={{ '--dc-preview-span': WIDGET_SIZES.find(s => s.id === widgetSize)?.span || 1 }}
                  >
                    <div className="dc-widget-actions">
                      <button title="Move" className="dc-action-btn dc-action-btn--grab">
                        <img src="/assets/icons/lcnc/drag-widget.svg" width={16} height={16} alt="drag" />
                      </button>
                      <button title="Add nested widget" className="dc-action-btn">
                        <img src="/assets/icons/lcnc/add-widget.svg" width={16} height={16} alt="add widget" />
                      </button>
                      <button title="Edit" className="dc-action-btn">
                        <img src="/assets/icons/lcnc/dasboard-edit.svg" width={16} height={16} alt="edit" />
                      </button>
                      <button title="Delete" className="dc-action-btn dc-action-btn--delete">
                        <img src="/assets/icons/lcnc/delete.svg" width={16} height={16} alt="delete" />
                      </button>
                    </div>
                    <div
                      className="dc-preview-card"
                      style={{ '--dc-preview-height': `${WIDGET_HEIGHTS.find(s => s.id === widgetHeight)?.px || 260}px` }}
                    >
                      <div className="dc-preview-header">
                        <span className="dc-preview-title">
                          {widgetTitle || (selectedChart ? CHART_TYPES.find(c => c.id === selectedChart)?.label : '')}
                        </span>
                        {widgetDescription && (
                          <div className="dc-preview-desc">{widgetDescription}</div>
                        )}
                      </div>
                      <div className="dc-preview-body">
                        {selectedChart && <ChartSilhouette chartId={selectedChart} />}
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={openAdd}
                    className="dc-add-widget-btn"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    <span className="dc-add-widget-btn-label">Add Widget</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Right Panel (custom dashboards only) ── */}
        {panelMode === 'add' && (
          <AddWidgetPanel
            selected={selectedChart} setSelected={setSelectedChart}
            widgetTitle={widgetTitle} setWidgetTitle={setWidgetTitle}
            widgetDescription={widgetDescription} setWidgetDescription={setWidgetDescription}
            widgetSize={widgetSize}   setWidgetSize={setWidgetSize}
            widgetHeight={widgetHeight} setWidgetHeight={setWidgetHeight}
            onSave={handleAddSave}
            onCancel={handleAddCancel}
          />
        )}
        {panelMode === 'settings' && settingsWidget && (
          <WidgetSettingsPanel
            key={settingsWidget.id}
            widget={settingsWidget}
            onSaveChanges={changes => handleSettingsSave(settingsWidget.id, changes)}
            onClose={() => handleSettingsClose(settingsWidget.id)}
          />
        )}
      </div>
    </div>

    {deletePending && (
      <div className="afp-modal-overlay" onClick={() => setDeletePending(null)}>
        <div className="afp-modal" onClick={e => e.stopPropagation()}>
          <p className="afp-modal-title">Delete widget</p>
          <p className="afp-modal-body">
            Delete <strong>"{deletePending.label}"</strong>? This widget will be permanently removed from the dashboard.
          </p>
          <div className="afp-modal-actions">
            <button className="afp-modal-cancel" onClick={() => setDeletePending(null)}>Cancel</button>
            <button className="afp-modal-confirm" onClick={() => { deleteWidget(deletePending.id); setDeletePending(null); }}>Delete widget</button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
