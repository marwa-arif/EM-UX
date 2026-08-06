import React, { useState, useRef, useEffect, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react'
import { createPortal } from 'react-dom'
import { PAI, Ic } from '../ui.jsx'
import { ChartRender, DEFAULT_VERT_BAR, STACK_ORIGINS } from '../components/ChartRender.jsx'
import { DSPillSearch, useWorkspace } from '../context/WorkspaceCtx.jsx'
import { GF_ENTITIES } from '../components/FilterPanel.jsx'
import { INITIAL_DATA_SOURCES } from './admin/DataIntegrations.jsx'
import DiscoverDevicePage from './DiscoverDevicePage.jsx'
import GridLayout from 'react-grid-layout/legacy'
import 'react-grid-layout/css/styles.css'
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
  { id: 'small',     label: 'Small',       px: 260 },
  { id: 'medium',    label: 'Medium',      px: 360 },
  { id: 'large',     label: 'Large',       px: 460 },
  { id: 'xlarge',    label: 'Extra Large', px: 560 },
  { id: 'rpt-chart', label: 'Report Chart', px: 500 },
  { id: 'rpt-pie',   label: 'Report Pie',   px: 480 },
]
const KPI_WIDGET_SIZES = [
  { id: 'xsmall',  label: 'Extra Small', span: 1 },
  { id: 'small',   label: 'Small',       span: 2 },
  { id: 'medium',  label: 'Medium',      span: 3 },
  { id: 'large',   label: 'Large',       span: 4 },
  { id: 'xlarge',  label: 'Extra Large', span: 4 },
]
const KPI_WIDGET_HEIGHTS = [
  { id: '2xsmall', label: '2x Small',    px: 120 },
  { id: 'xsmall',  label: 'Extra Small', px: 160 },
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
const ALL_WIDGET_SIZES = [...WIDGET_SIZES, ...KPI_WIDGET_SIZES, ...HEADING_WIDGET_SIZES]
const ALL_WIDGET_HEIGHTS = [...WIDGET_HEIGHTS, ...KPI_WIDGET_HEIGHTS, ...HEADING_WIDGET_HEIGHTS]
function widgetHeightPx(w) {
  return ALL_WIDGET_HEIGHTS.find(s => s.id === w.heightId)?.px || 180
}

// ── Free-form grid layout engine ──────────────────────────────────────
// The canvas is a 12-column grid measured in row-units (ROW_UNIT_PX each).
// Widgets carry an explicit gx/gy/gw/gh position once dragged or resized;
// until then their position/size is derived from the legacy span/heightId
// preset fields and packed on the fly, so untouched dashboards/templates
// keep rendering exactly as they did under the old auto-flow layout.
const GRID_COLS   = 12
const ROW_UNIT_PX = 20
const MIN_GW = 3,  MAX_GW = GRID_COLS
const MIN_GH = 4,  MAX_GH = 40
// Fed to react-grid-layout as `margin`/`containerPadding` — keep in sync
// with any visual spacing changes so the two stay consistent.
const GRID_PAD_PX = 20
const GRID_GAP_PX = 12

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

function legacyGw(w) { return clamp((w.span || 1) * 3, MIN_GW, MAX_GW) }
function legacyGh(w) { return clamp(Math.ceil(widgetHeightPx(w) / ROW_UNIT_PX), MIN_GH, MAX_GH) }

// react-grid-layout owns all drag/resize/reflow interaction (see the grid
// render in DashboardCanvas) — this function only has one job: give every
// widget a valid gx/gy/gw/gh so RGL always has a complete `layout` to start
// from. A widget that already has a position (persisted, or just set by RGL
// itself after a drag/resize) keeps it untouched; only widgets missing one
// (brand new, or a legacy/template widget that predates this position model)
// get auto-placed, into the first free top-left gap — checking actual
// per-cell occupancy (not just one "skyline" height per column) so a newly
// auto-placed widget can always backfill a gap left by an earlier one,
// regardless of size mix.
function packWidgets(widgets) {
  const occupiedRows = [] // occupiedRows[y] = Set of occupied columns in row y
  const rowFree = (x, y, gw) => {
    const row = occupiedRows[y]
    if (!row) return true
    for (let c = x; c < x + gw; c++) if (row.has(c)) return false
    return true
  }
  const occupy = (x, y, gw, gh) => {
    for (let r = y; r < y + gh; r++) {
      if (!occupiedRows[r]) occupiedRows[r] = new Set()
      for (let c = x; c < x + gw; c++) occupiedRows[r].add(c)
    }
  }

  const sized = widgets.map(w => ({
    ...w,
    gw: clamp(w.gw ?? legacyGw(w), MIN_GW, MAX_GW),
    gh: clamp(w.gh ?? legacyGh(w), MIN_GH, MAX_GH),
  }))

  // Reserve cells for everything that already has a real position first, so
  // auto-placed widgets never land on top of them.
  sized.forEach(w => { if (w.gx != null && w.gy != null) occupy(w.gx, w.gy, w.gw, w.gh) })

  return sized.map(w => {
    if (w.gx != null && w.gy != null) return w
    let gx = 0, gy = 0
    outer: for (let y = 0; ; y++) {
      for (let x = 0; x <= GRID_COLS - w.gw; x++) {
        let fits = true
        for (let r = y; r < y + w.gh && fits; r++) fits = rowFree(x, r, w.gw)
        if (fits) { gx = x; gy = y; break outer }
      }
    }
    occupy(gx, gy, w.gw, w.gh)
    return { ...w, gx, gy }
  })
}
const PERF_LEVELS = [
  { max: 4,        label: 'Optimal',           range: '≤4 widgets',  desc: 'loads and refreshes quickly',                      bg: 'rgba(22,163,74,0.10)',  color: 'var(--pai-green)', dot: 'var(--pai-green)' },
  { max: 7,        label: 'Approaching Limit', range: '5–7 widgets', desc: 'may start to feel slower',                         bg: 'rgba(217,119,6,0.10)', color: 'var(--pai-high-fg)', dot: 'var(--pai-high-fg)' },
  { max: Infinity, label: 'Limit Reached',     range: '8+ widgets',  desc: 'may load slowly — consider trimming widgets',      bg: 'rgba(220,38,38,0.10)', color: 'var(--pai-crit-fg)', dot: 'var(--pai-crit-fg)' },
]
const perfLevel = count => PERF_LEVELS.find(l => count <= l.max)
const PERF_TOOLTIP = PERF_LEVELS.map(l => `${l.label} (${l.range}) — ${l.desc}`).join('. ') + '.'

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

const DOWNLOAD_TABLE_OPTIONS = [
  { id: 'host-sla-breach',        label: 'Host SLA Breach Status by Asset Type' },
  { id: 'vuln-sla-timeline',      label: 'Vulnerability Findings SLA Timeline by Vulnerability Severity' },
  { id: 'top10-vuln-cat-findings', label: 'Top 10 Most Common Vulnerability Categories by Vulnerability Findings' },
  { id: 'top10-vuln-cat',         label: 'Top 10 Most Common Vulnerability Categories by Vulnerabilities' },
  { id: 'top10-os-findings',      label: 'Top 10 Most Common Vulnerable Operating Systems by Vulnerability Findings' },
  { id: 'top10-os',               label: 'Top 10 Most Common Vulnerable Operating Systems by Vulnerabilities' },
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

const CHART_DEFAULT_NAMES = {
  'vert-bar':   'Type',
  'hor-bar':    'Type',
  'pie':        'Type',
  'table':      'Type',
  'stack-vert': 'Origin',
  'stack-hor':  'Origin',
}

const VERT_BAR_PALETTE = ['#D12329','#D98B1D','#6360D8','#31A56D','#64748B','#94A3B8']

function buildChartColors(widget) {
  const saved   = widget.chartColors || {}
  const chartId = widget.chartId
  if (chartId === 'kpi') {
    return { 'Accent': saved['Accent'] || '#5C6FC4' }
  }
  if (chartId === 'stack-vert' || chartId === 'stack-hor') {
    return Object.fromEntries(STACK_ORIGINS.map(o => [o.key, saved[o.key] || o.color]))
  }
  const rows = Array.isArray(widget.data) ? widget.data : DEFAULT_VERT_BAR
  return Object.fromEntries(
    rows.map((row, i) => [row.label, saved[row.label] || row.color || VERT_BAR_PALETTE[i % VERT_BAR_PALETTE.length]])
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

function TextInput({ placeholder, value, onChange, withKG, readOnly = false }) {
  return (
    <div className="dc-text-input-wrap">
      <input
        value={value || ''} onChange={onChange}
        readOnly={readOnly}
        placeholder={placeholder}
        className="dc-text-input"
        style={{ '--dc-input-color': value ? PAI.fg1 : PAI.fg3 }}
      />
      {withKG && <KGBtn />}
    </div>
  )
}

function TextArea({ placeholder, value, onChange, rows = 3 }) {
  return (
    <textarea
      value={value || ''} onChange={onChange}
      placeholder={placeholder}
      rows={rows}
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
        className={`dc-col-trigger${open ? ' dc-col-trigger--open' : ''}${selected ? ' dc-col-trigger--selected' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        <span>{selected ? selected.label : 'Select...'}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>
      {open && (
        <div className="comp-sort-menu dc-col-menu">
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
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="dc-icon-muted"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
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

// ── DashboardScopeModal ──────────────────────────────────────────────
// Graph-filter entity picker used to set a dashboard's scope. Mandatory
// (non-dismissable) the first time a brand-new dashboard is opened; when
// reopened later via the Dashboard Scope badge it's a normal dismissable
// modal so the user can change the scope.
function DashboardScopeModal({ mandatory, onClose, onBack, onSelect }) {
  const [search, setSearch]         = useState('')
  const [selectedId, setSelectedId] = useState(null)

  const filtered = GF_ENTITIES.filter(e =>
    !search || e.label.toLowerCase().includes(search.toLowerCase())
  )
  const selected = GF_ENTITIES.find(e => e.id === selectedId) || null
  const dismiss = mandatory ? onBack : onClose

  return (
    <div className="ds-modal-overlay" onClick={mandatory ? undefined : onClose}>
      <div className="ds-modal dc-scope-modal" onClick={e => e.stopPropagation()}>
        <div className="ds-modal-header">
          <span className="ds-modal-title">Set Dashboard Scope</span>
          <button className="ds-modal-close" onClick={dismiss}>✕</button>
        </div>
        <div className="ds-modal-body">
          <p className="dc-scope-modal__hint">
            Select a node or entity to scope this dashboard to. You can change this later from the Dashboard Scope badge.
          </p>
          <input
            className="dc-scope-modal__search"
            placeholder="Search entity"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="dc-scope-modal__grid">
            {filtered.map(entity => (
              <button
                type="button"
                key={entity.id}
                className={`dc-scope-node${selectedId === entity.id ? ' dc-scope-node--selected' : ''}`}
                style={{ '--dc-scope-color': entity.color }}
                onClick={() => setSelectedId(entity.id)}
              >
                <span className="dc-scope-node__circle">
                  <img src={`/assets/icons/${entity.file}`} width={20} height={20} alt="" />
                </span>
                <span className="dc-scope-node__label">{entity.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="ds-modal-footer">
          <button className="ds-btn sz-md t-outline" onClick={dismiss}>
            {mandatory ? 'Back' : 'Cancel'}
          </button>
          <button
            className="ds-btn sz-md t-primary"
            disabled={!selected}
            onClick={() => selected && onSelect(selected)}
          >Confirm Scope</button>
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
function WidgetSettingsPanel({ widget, onSaveChanges, onClose, onLiveChange }) {
  const [tab, setTab]             = useState('data')
  const [title, setTitle]         = useState(() => {
    const defaultLabel   = CHART_TYPES.find(c => c.id === widget.chartId)?.label
    const isClassChart   = widget.chartId === 'vert-bar' || widget.chartId === 'hor-bar' || widget.chartId === 'pie'
    if (widget.chartId === 'stack-vert' && widget.label === defaultLabel)
      return widget.magnitude || 'Origin'
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
  const [kpiCompOperation, setKpiCompOperation]   = useState('count-distinct')
  const [kpiCompAggregateBy, setKpiCompAggregateBy] = useState('host')
  const [fontSize, setFontSize] = useState(widget.fontSize || 'medium')
  // A brand-new widget has no persisted classification yet — Configure Colors
  // stays locked until the user actually engages with the Data tab's
  // attribute control at least once (typing it for pie, or applying the
  // attribute picker for bar/stacked charts).
  const [attributeTouched, setAttributeTouched] = useState(widget.classification != null)

  const isPie       = chartType === 'pie'
  const isKpi       = chartType === 'kpi'
  const isTable     = chartType === 'table'
  const isVertBar   = chartType === 'vert-bar'
  const isHorBar    = chartType === 'hor-bar'
  const isStackVert = chartType === 'stack-vert'
  const isStackHor  = chartType === 'stack-hor'
  const isKPI       = chartType === 'kpi'
  const isHeading   = chartType === 'heading'

  useEffect(() => {
    onLiveChange?.({ sizeId, heightId })
  }, [sizeId, heightId])

  return (
    <div
      className="dc-panel"
      style={{ '--dc-fg1': PAI.fg1, '--dc-fg3': PAI.fg3, '--dc-indigo': PAI.indigo }}
    >
      {/* Header */}
      <div className="dc-panel-header">
        <div className="dc-panel-title-row">
          <img src="assets/icons/lcnc/dasboard-edit.svg" width={16} height={16} alt="" />
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
                  options={(isHeading ? HEADING_WIDGET_SIZES : isKPI ? KPI_WIDGET_SIZES : WIDGET_SIZES).map(s => ({ value: s.id, label: s.label }))}
                />
              </div>
              <div className="dc-size-sub-row">
                <div className="dc-size-sub-label">Height</div>
                <SizeSelectDropdown
                  value={heightId}
                  onChange={v => setHeightId(v)}
                  options={(isHeading ? HEADING_WIDGET_HEIGHTS : isKPI ? KPI_WIDGET_HEIGHTS : WIDGET_HEIGHTS).map(h => ({ value: h.id, label: h.label }))}
                />
              </div>
              {isKPI && (
                <div className="dc-size-sub-row">
                  <div className="dc-size-sub-label">Font Size</div>
                  <SizeSelectDropdown
                    value={fontSize}
                    onChange={v => setFontSize(v)}
                    options={[{ value: 'small', label: 'Small' }, { value: 'medium', label: 'Medium' }, { value: 'large', label: 'Large' }]}
                  />
                </div>
              )}
            </div>
            <FieldRow label="Configure Colors">
              {!isKpi && !isTable && !attributeTouched ? (
                <div className="dc-color-config-locked">Select an attribute in the Data tab first.</div>
              ) : (
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
              )}
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
                    <TextInput value={classification} onChange={e => { setClassification(e.target.value); setAttributeTouched(true) }} withKG />
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
                      <img src="assets/icons/graph-filter.svg" width={18} height={18} alt="" />
                    </button>
                  </div>
                </FieldRow>
                {filterModalOpen && (
                  <GraphFilterModal
                    currentAttr={classification}
                    onClose={() => setFilterModalOpen(false)}
                    onApply={attr => { setClassification(attr); setAttributeTouched(true); setFilterModalOpen(false) }}
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
                      <img src="assets/icons/graph-filter.svg" width={18} height={18} alt="" />
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
                      <img src="assets/icons/graph-filter.svg" width={18} height={18} alt="" />
                    </button>
                  </div>
                </FieldRow>
                {filterModalOpen && (
                  <GraphFilterModal
                    currentAttr={classification}
                    onClose={() => setFilterModalOpen(false)}
                    onApply={attr => { setClassification(attr); setAttributeTouched(true); setFilterModalOpen(false) }}
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
                      <img src="assets/icons/graph-filter.svg" width={18} height={18} alt="" />
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
            ) : isStackHor ? (
              <>
                <FieldRow label="Attribute*">
                  <div className="dc-field-sub-label">Magnitude ( y-axis )</div>
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
                      <img src="assets/icons/graph-filter.svg" width={18} height={18} alt="" />
                    </button>
                  </div>
                  <div className="dc-field-sub-label dc-field-sub-label--mt">Classification ( x-axis )</div>
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
                      <img src="assets/icons/graph-filter.svg" width={18} height={18} alt="" />
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
                    onApply={attr => { setClassification(attr); setAttributeTouched(true); setStackClassModalOpen(false) }}
                  />
                )}

                <FieldRow label="Size" hint="Display total/distinct count in the horizontal stacked chart">
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
                      <img src="assets/icons/graph-filter.svg" width={18} height={18} alt="" />
                    </button>
                  </div>
                </FieldRow>

                <FieldRow label="Widget Filter" tooltip="Filter data shown in this widget">
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
                      <img src="assets/icons/graph-filter.svg" width={18} height={18} alt="" />
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
                      <img src="assets/icons/graph-filter.svg" width={18} height={18} alt="" />
                    </button>
                  </div>
                  <div className="dc-field-sub-label dc-field-sub-label--mt">Classification ( y-axis )</div>
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
                      <img src="assets/icons/graph-filter.svg" width={18} height={18} alt="" />
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
                    onApply={attr => { setClassification(attr); setAttributeTouched(true); setStackClassModalOpen(false) }}
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
                      <img src="assets/icons/graph-filter.svg" width={18} height={18} alt="" />
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
                      <img src="assets/icons/graph-filter.svg" width={18} height={18} alt="" />
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
            ) : isKpi ? null : (
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

            {isKpi && (
              <>
                <div className="dc-kpi-metric-section">
                  <div className="dc-kpi-metric-title">Primary Metric</div>
                  <div className="dc-kpi-metric-desc">Display the main KPI value to display</div>
                  <div className="dc-axis-row--no-mb dc-axis-row--with-action dc-axis-row--mt8">
                    <div className="dc-axis-col">
                      <div className="dc-axis-label">Operation</div>
                      <SizeSelectDropdown value={operation} onChange={v => setOperation(v)} options={[{ value:'count-distinct',label:'Count Distinct'},{ value:'count',label:'Count'},{ value:'sum',label:'Sum'}]} />
                    </div>
                    <div className="dc-axis-col">
                      <div className="dc-axis-label">Aggregate By</div>
                      <SizeSelectDropdown value={aggregateBy} onChange={v => setAggregateBy(v)} options={[{ value:'host',label:'host'},{ value:'entity-id',label:'Entity ID'},{ value:'ip',label:'IP Address'}]} />
                    </div>
                    <button className="dc-kg-btn dc-kg-btn--bottom" style={{ '--dc-indigo': PAI.indigo, '--dc-indigo-tint': PAI.indigoTint }}>
                      <img src="assets/icons/graph-filter.svg" width={18} height={18} alt="" />
                    </button>
                  </div>
                  <div className="dc-mt12">
                    <div className="dc-field-label dc-field-label--icon-row">
                      Filter By
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="dc-label-icon">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                      </svg>
                    </div>
                    <div className="dc-text-input-wrap">
                      <input readOnly placeholder="Select Widget Filter" className="dc-text-input" style={{ '--dc-input-color': PAI.fg3 }} />
                      <button className="dc-kg-btn" style={{ '--dc-indigo': PAI.indigo, '--dc-indigo-tint': PAI.indigoTint }}>
                        <img src="assets/icons/graph-filter.svg" width={18} height={18} alt="" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="dc-divider" />
                <div className="dc-kpi-metric-section">
                  <div className="dc-kpi-metric-title">Comparison Metric (Optional)</div>
                  <div className="dc-kpi-metric-desc">Compare with any other KPI value</div>
                  <div className="dc-axis-row--no-mb dc-axis-row--with-action dc-axis-row--mt8">
                    <div className="dc-axis-col">
                      <div className="dc-axis-label">Operation</div>
                      <SizeSelectDropdown value={kpiCompOperation} onChange={v => setKpiCompOperation(v)} options={[{ value:'count-distinct',label:'Count Distinct'},{ value:'count',label:'Count'},{ value:'sum',label:'Sum'}]} />
                    </div>
                    <div className="dc-axis-col">
                      <div className="dc-axis-label">Aggregate By</div>
                      <SizeSelectDropdown value={kpiCompAggregateBy} onChange={v => setKpiCompAggregateBy(v)} options={[{ value:'host',label:'host'},{ value:'entity-id',label:'Entity ID'},{ value:'ip',label:'IP Address'}]} />
                    </div>
                    <button className="dc-kg-btn dc-kg-btn--bottom" style={{ '--dc-indigo': PAI.indigo, '--dc-indigo-tint': PAI.indigoTint }}>
                      <img src="assets/icons/graph-filter.svg" width={18} height={18} alt="" />
                    </button>
                  </div>
                  <div className="dc-mt12">
                    <div className="dc-field-label dc-field-label--icon-row">
                      Filter By
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="dc-label-icon">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                      </svg>
                    </div>
                    <div className="dc-text-input-wrap">
                      <input readOnly placeholder="Select Widget Filter" className="dc-text-input" style={{ '--dc-input-color': PAI.fg3 }} />
                      <button className="dc-kg-btn" style={{ '--dc-indigo': PAI.indigo, '--dc-indigo-tint': PAI.indigoTint }}>
                        <img src="assets/icons/graph-filter.svg" width={18} height={18} alt="" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="dc-divider" />
                <ToggleRow
                  label="Show Total Count"
                  description='Display the denominator (e.g., "6 / 54,555")'
                  value={showTotalCount}
                  onChange={setShowTotalCount}
                />
                <ToggleRow
                  label="Show Percentage Change"
                  description='Display the change over time (e.g., "+12%" or "-5%")'
                  value={showPctChange}
                  onChange={setShowPctChange}
                />
              </>
            )}

            {!isPie && !isTable && !isVertBar && !isHorBar && !isHeading && !isStackVert && !isStackHor && !isKpi && (
              <FieldRow label="Widget Filter">
                <TextInput placeholder="Select Widget Filter" withKG />
              </FieldRow>
            )}

            {!isPie && !isTable && !isVertBar && !isHorBar && !isHeading && !isStackVert && !isStackHor && !isKpi && (
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
            chartColors,
            ...(isTable                                    && { columns, enableDownload }),
            ...((isVertBar || isHorBar || isPie)          && { classification }),
            ...(isStackVert                               && { magnitude, classification, explodeArrayFields }),
            ...(isStackHor                                && { magnitude, classification, explodeArrayFields }),
            ...(isHeading                                 && { exploreIn }),
            ...(isKpi                                     && { fontSize }),
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
    <div className="dc-aw-panel">
      {/* header */}
      <div className="dc-aw-panel__header">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="dc-aw-panel__header-icon">
          <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
          <line x1="17" y1="14" x2="17" y2="20"/><line x1="14" y1="17" x2="20" y2="17"/>
        </svg>
        <span className="dc-aw-panel__title">Add Widget</span>
        <button onClick={onCancel} className="dc-aw-panel__close">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* body */}
      <div className="dc-aw-panel__body">
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
        <div className="dc-field-label dc-field-label--mb8">Widget Type</div>
        <div className="dc-chart-type-grid">
          {rows.map((row, ri) => (
            <div key={ri} className="dc-chart-type-row">
              {row.map(ct => (
                <button
                  key={ct.id}
                  onClick={() => setSelected(ct.id)}
                  className="dc-chart-type-btn"
                  style={{
                    '--dc-chartbtn-bg':     selected === ct.id ? PAI.indigoTint : 'var(--card-bg)',
                    '--dc-chartbtn-border': selected === ct.id ? PAI.indigo : 'var(--shell-border)',
                    '--dc-chartbtn-color':  selected === ct.id ? PAI.indigo : PAI.fg3,
                  }}
                >
                  <ChartIcon id={ct.id} selected={selected === ct.id} />
                  <span className="dc-chart-type-btn-label">{ct.label}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* footer */}
      <div className="dc-aw-panel__footer">
        <button onClick={onCancel} className="ds-btn sz-md t-outline">Cancel</button>
        <button onClick={onSave} className="ds-btn sz-md t-primary" disabled={!selected} style={{ '--dc-aw-save-opacity': selected ? 1 : 0.4 }}>Save</button>
      </div>
    </div>
  )
}

// ── Widget Card ──────────────────────────────────────────────────────
// Positioning for the live (non-report) grid is owned entirely by
// react-grid-layout: it wraps this component's root element in its own
// `.react-grid-item` (position:absolute, inline width/height/transform for
// drag/resize), so this card never sets its own grid placement or animates
// its own position — it just fills whatever box that wrapper gives it (see
// `.dc-widget-col` in dashboard.css).
function WidgetCardImpl({ widget, isEditing, onEdit, onRequestDelete, onEditWithCopilot, reportMode, printMode = false }) {
  const [hovered, setHovered]         = useState(false)
  const [dlOpen, setDlOpen]           = useState(false)
  const dlRef                         = useRef(null)
  const h = widget.gh ? widget.gh * ROW_UNIT_PX : widgetHeightPx(widget)
  const showDownload = widget.chartId === 'table' && widget.enableDownload !== false && !reportMode

  useEffect(() => {
    if (!dlOpen) return
    const handler = e => { if (dlRef.current && !dlRef.current.contains(e.target)) setDlOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [dlOpen])

  return (
    <div
      className={reportMode ? 'dc-report-widget' : 'dc-widget-col'}
      style={{
        '--dc-fg1': PAI.fg1,
        '--dc-fg3': PAI.fg3,
        '--dc-indigo': PAI.indigo,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Hover actions */}
      {hovered && !reportMode && (
        <div className="dc-widget-actions">
          <button title="Move" className="dc-action-btn dc-action-btn--grab">
            <img src="assets/icons/lcnc/drag-widget.svg" width={16} height={16} alt="drag" />
          </button>
          <button title="Add nested widget" className="dc-action-btn">
            <img src="assets/icons/lcnc/add-widget.svg" width={16} height={16} alt="add widget" />
          </button>
          <button title="Edit" onClick={onEdit} className="dc-action-btn">
            <img src="assets/icons/lcnc/dasboard-edit.svg" width={16} height={16} alt="edit" />
          </button>
          {onEditWithCopilot && (
            <button title="Edit with Copilot" onClick={() => onEditWithCopilot(widget)} className="dc-action-btn">
              <img src="assets/icons/Navigator icon.svg" width={16} height={16} alt="edit with copilot" />
            </button>
          )}
          <button title="Delete" onClick={() => onRequestDelete(widget)} className="dc-action-btn dc-action-btn--delete">
            <img src="assets/icons/lcnc/delete.svg" width={16} height={16} alt="delete" />
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
              <div ref={dlRef} className="comp-sort-wrap" onMouseDown={e => e.stopPropagation()}>
                <button
                  className="ds-btn sz-sm t-outline"
                  disabled
                  onClick={() => setDlOpen(o => !o)}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Download
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className={`comp-dl-chevron${dlOpen ? ' comp-dl-chevron--open' : ''}`}><path d="m6 9 6 6 6-6"/></svg>
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
        </div>
        <div className="dc-widget-card-body">
          <ChartRender chartId={widget.chartId} showPctChange={widget.showPctChange} showLegend={widget.showLegend ?? true} showTotalCount={widget.showTotalCount ?? true} data={widget.data} totalLabel={widget.totalLabel} noteLabel={widget.noteLabel} note={widget.note} legendDesc={widget.legendDesc} columns={widget.columns} chartColors={widget.chartColors} description={widget.description} xLabel={widget.xLabel} yLabel={widget.yLabel} reportTotal={widget.reportTotal} fontSize={widget.fontSize} cardHeight={h} printMode={printMode} />
        </div>
      </div>
    </div>
  )
}

// Memoized, ignoring the callback props (onEdit/onRequestDelete/onEditWithCopilot
// are recreated fresh every render — they're stable in behavior, never in
// reference). Without this, every widget re-renders (charts included) on
// every drag/resize frame react-grid-layout produces, since it re-renders
// its whole children list on each reflow — with a dozen-plus real widgets on
// a dashboard, that's a real, visible frame-rate hit during drag, not just a
// wasted-render nicety.
export const WidgetCard = React.memo(WidgetCardImpl, (prev, next) =>
  prev.widget === next.widget &&
  prev.isEditing === next.isEditing &&
  prev.reportMode === next.reportMode &&
  prev.printMode === next.printMode
)

// ── Floating canvas toolbar (Undo / Redo / Zoom) ───────────────────────
function DashboardFloatingToolbar({ canUndo, canRedo, onUndo, onRedo, zoom, onZoomIn, onZoomOut, onZoomReset, onReset }) {
  return (
    <div className="dc-float-toolbar">
      <button className="ds-icon-btn" title="Undo" disabled={!canUndo} onClick={onUndo}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 14 4 9 9 4"/>
          <path d="M20 20v-7a4 4 0 0 0-4-4H4"/>
        </svg>
      </button>
      <button className="ds-icon-btn" title="Redo" disabled={!canRedo} onClick={onRedo}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 14 20 9 15 4"/>
          <path d="M4 20v-7a4 4 0 0 1 4-4h12"/>
        </svg>
      </button>
      <div className="dc-float-toolbar-divider" />
      <button className="ds-icon-btn" title="Zoom out" disabled={zoom <= 0.5} onClick={onZoomOut}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/>
        </svg>
      </button>
      <button className="dc-float-toolbar-zoom-label" title="Reset zoom" onClick={onZoomReset}>{Math.round(zoom * 100)}%</button>
      <button className="ds-icon-btn" title="Zoom in" disabled={zoom >= 1.5} onClick={onZoomIn}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
        </svg>
      </button>
      {onReset && (
        <>
          <div className="dc-float-toolbar-divider" />
          <span className="dc-tip" data-tip="Reset the whole dashboard">
            <button className="ds-icon-btn" onClick={onReset}>
              <img src="assets/icons/reset.svg" width={16} height={16} alt="Reset" />
            </button>
          </span>
        </>
      )}
    </div>
  )
}

// ── Executive Summary report template ────────────────────────────────
const ES_SUFF = 'from 31 Aug 2025'

// Spans: row1 = 3×span2, row2 = 2×span3, full-width charts/tables = span6
export const EXEC_SUMMARY_TEMPLATE = {
  name: 'Executive Summary',
  widgets: [
    // ── Row 1: 3 KPIs ─────────────────────────────────────────────
    {
      id: 3001, label: 'Total Devices', chartId: 'kpi', span: 2, sizeId: 'small', heightId: 'xsmall', phase: 'active', dataLocked: true,
      data: { value: '4,280', label: 'Total Devices', trend: '78.5%', trendUp: true, trendSuffix: ES_SUFF, trendData: [
        { name: 'Jan', value: 2400 }, { name: 'Feb', value: 2800 }, { name: 'Mar', value: 3200 },
        { name: 'Apr', value: 3600 }, { name: 'May', value: 3900 }, { name: 'Jun', value: 4280 },
      ]},
    },
    {
      id: 3002, label: 'Scanned Devices within 30 days', chartId: 'kpi', span: 2, sizeId: 'small', heightId: 'xsmall', phase: 'active', dataLocked: true,
      data: { value: '3,737', label: 'Scanned Devices within 30 days', trend: '4%', trendUp: false, trendSuffix: ES_SUFF, trendData: [
        { name: 'Jan', value: 3900 }, { name: 'Feb', value: 3860 }, { name: 'Mar', value: 3820 },
        { name: 'Apr', value: 3790 }, { name: 'May', value: 3760 }, { name: 'Jun', value: 3737 },
      ]},
    },
    {
      id: 3003, label: 'Total Vulnerable Devices', chartId: 'kpi', span: 2, sizeId: 'small', heightId: 'xsmall', phase: 'active', dataLocked: true,
      data: { value: '1,322', label: 'Total Vulnerable Devices', trend: '2%', trendUp: false, trendSuffix: ES_SUFF, trendData: [
        { name: 'Jan', value: 1350 }, { name: 'Feb', value: 1345 }, { name: 'Mar', value: 1340 },
        { name: 'Apr', value: 1335 }, { name: 'May', value: 1328 }, { name: 'Jun', value: 1322 },
      ]},
    },
    // ── Row 2: 2 KPIs ─────────────────────────────────────────────
    {
      id: 3004, label: 'Total Vulnerability Findings', chartId: 'kpi', span: 3, sizeId: 'medium', heightId: 'xsmall', phase: 'active', dataLocked: true, rowBreak: true,
      data: { value: '2,150', label: 'Total Vulnerability Findings', trend: '4%', trendUp: true, trendSuffix: ES_SUFF, trendData: [
        { name: 'Jan', value: 2070 }, { name: 'Feb', value: 2090 }, { name: 'Mar', value: 2100 },
        { name: 'Apr', value: 2110 }, { name: 'May', value: 2130 }, { name: 'Jun', value: 2150 },
      ]},
    },
    {
      id: 3005, label: 'Total Vulnerabilities', chartId: 'kpi', span: 3, sizeId: 'medium', heightId: 'xsmall', phase: 'active', dataLocked: true,
      data: { value: '1,746', label: 'Total Vulnerabilities', trend: '8%', trendUp: false, trendSuffix: ES_SUFF, trendData: [
        { name: 'Jan', value: 1890 }, { name: 'Feb', value: 1860 }, { name: 'Mar', value: 1830 },
        { name: 'Apr', value: 1810 }, { name: 'May', value: 1780 }, { name: 'Jun', value: 1746 },
      ]},
    },
    // ── Widget 6: Vulnerability Findings by Vulnerability Severity ─
    {
      id: 3006, label: 'Vulnerability Findings by Vulnerability Severity', chartId: 'vert-bar', span: 6, sizeId: 'xlarge', heightId: 'rpt-chart', phase: 'active', dataLocked: true,
      xLabel: 'Vulnerability Severity', yLabel: 'Vulnerability Findings',
      noteLabel: 'Total Vulnerability Findings', legendDesc: 'Out of which the distribution is as follows:',
      data: [
        { label: 'Critical', value: 556,  color: 'var(--pai-crit-fg)' },
        { label: 'High',     value: 934,  color: 'var(--pai-high-fg)' },
        { label: 'Medium',   value: 530,  color: 'var(--pai-med-fg)'  },
        { label: 'Low',      value: 130,  color: 'var(--pai-green)'   },
      ],
    },
    // ── Widget 7: Vulnerability Findings by Asset Criticality ──────
    {
      id: 3007, label: 'Vulnerability Findings by Asset Criticality', chartId: 'vert-bar', span: 6, sizeId: 'xlarge', heightId: 'rpt-chart', phase: 'active', dataLocked: true,
      xLabel: 'Asset Criticality', yLabel: 'Vulnerability Findings',
      noteLabel: 'Total Vulnerability Findings', legendDesc: 'Distribution of vulnerability findings on devices grouped by asset criticality is as follows:',
      data: [
        { label: 'Critical', value: 1115, color: 'var(--pai-crit-fg)' },
        { label: 'High',     value: 613,  color: 'var(--pai-high-fg)' },
        { label: 'Medium',   value: 352,  color: 'var(--pai-med-fg)'  },
        { label: 'Low',      value: 70,   color: 'var(--pai-green)'   },
      ],
    },
    // ── Widget 8: Devices by Vulnerability Severity ────────────────
    {
      id: 3008, label: 'Devices by Vulnerability Severity', chartId: 'vert-bar', span: 6, sizeId: 'xlarge', heightId: 'rpt-chart', phase: 'active', dataLocked: true,
      xLabel: 'Vulnerability Severity', yLabel: 'Devices',
      noteLabel: 'Total Vulnerable Device Occurrences by Severity', legendDesc: 'Represents total device severity combinations, not unique devices.',
      data: [
        { label: 'Critical', value: 297,  color: 'var(--pai-crit-fg)' },
        { label: 'High',     value: 375,  color: 'var(--pai-high-fg)' },
        { label: 'Medium',   value: 250,  color: 'var(--pai-med-fg)'  },
        { label: 'Low',      value: 400,  color: 'var(--pai-green)'   },
      ],
    },
    // ── Widget 9: Vulnerable Devices (donut) ──────────────────────
    {
      id: 3009, label: 'Vulnerable Devices', chartId: 'pie', span: 6, sizeId: 'xlarge', heightId: 'rpt-pie', phase: 'active', dataLocked: true,
      totalLabel: '3,737', noteLabel: 'Total Devices',
      description: 'Vulnerable Devices have one or more unresolved ("Open") Vulnerability Findings.',
      note: 'Note : If a filter for any Vulnerability-related field has been applied to the Report, the scope of Devices changes to be those that currently or previously had Vulnerability Findings matching the filter criteria. This includes both Open and Closed Findings, unless Finding Status is specifically filtered for.',
      data: [
        { label: 'Vulnerable',     value: 1322, count: '1,322', pct: '35%', color: 'var(--pai-crit-fg)' },
        { label: 'Non-Vulnerable', value: 2415, count: '2,415', pct: '65%', color: 'var(--pai-green)'   },
      ],
    },
    // ── Widget 10: Host SLA Breach Status by Asset Type ────────────
    {
      id: 3010, label: 'Host SLA Breach Status by Asset Type', chartId: 'table', span: 6, sizeId: 'xlarge', heightId: 'large', phase: 'active', dataLocked: true,
      description: 'Breaching indicates that at least one open vulnerability finding on the host has exceeded the SLA timeline. Non-Breaching indicates that, although vulnerabilities are still open, none have breached SLA timeline.',
      data: [
        { assetType: 'Server',          nonBreaching: '15 (33.33%)', breaching: '5 (11.11%)',   total: '20 (44.44%)'  },
        { assetType: 'Workstation',     nonBreaching: '7 (15.56%)',  breaching: '3 (6.67%)',    total: '10 (22.23%)'  },
        { assetType: 'Network Devices', nonBreaching: '13 (28.89%)', breaching: '2 (4.44%)',    total: '15 (33.33%)'  },
        { assetType: 'Total Devices',   nonBreaching: '35 (77.78%)', breaching: '10 (22.22%)',  total: '45 (100%)',    isTotal: true },
      ],
    },
    // ── Widget 11: Vulnerability Findings SLA Timeline ────────────
    {
      id: 3011, label: 'Vulnerability Findings SLA Timeline by Vulnerability Severity', chartId: 'table', span: 6, sizeId: 'xlarge', heightId: 'xlarge', phase: 'active', dataLocked: true,
      description: 'Counts shown here include only findings with a defined SLA and may differ from Total Vulnerability Findings, which include both SLA and non-SLA findings.',
      data: [
        { severity: 'Critical', breaching: '480 (22.33%)', overHalfway: '100 (4.65%)',   underHalfway: '160 (7.44%)',   total: '740 (34.42%)'  },
        { severity: 'High',     breaching: '225 (10.47%)', overHalfway: '85 (3.95%)',    underHalfway: '210 (9.77%)',   total: '520 (24.19%)'  },
        { severity: 'Medium',   breaching: '490 (22.79%)', overHalfway: '90 (4.19%)',    underHalfway: '140 (6.51%)',   total: '720 (33.49%)'  },
        { severity: 'Low',      breaching: '70 (3.26%)',   overHalfway: '55 (2.56%)',    underHalfway: '45 (2.09%)',    total: '170 (7.91%)'   },
        { severity: 'Total Vulnerability Findings', breaching: '1,265 (58.84%)', overHalfway: '330 (15.35%)', underHalfway: '555 (25.81%)', total: '2,150 (100%)', isTotal: true },
      ],
    },
    // ── Widget 12: Known Exploit Availability (donut) ─────────────
    {
      id: 3012, label: 'Known Exploit Availability', chartId: 'pie', span: 6, sizeId: 'xlarge', heightId: 'rpt-pie', phase: 'active', dataLocked: true,
      totalLabel: '3,737', noteLabel: 'Total Vulnerabilities',
      description: 'True indicates a known exploit is available, while False indicates no known exploit is available.',
      data: [
        { label: 'False', value: 2541, count: '2,541', pct: '70%', color: 'var(--pai-green)'   },
        { label: 'True',  value: 1196, count: '1,196', pct: '30%', color: 'var(--pai-crit-fg)' },
      ],
    },
    // ── Widget 13: Top 10 Most Common Vulnerabilities (hor-bar) ───
    {
      id: 3013, label: 'Top 10 Most Common Vulnerabilities', chartId: 'hor-bar', span: 6, sizeId: 'xlarge', heightId: 'rpt-chart', phase: 'active', dataLocked: true,
      showLegend: false, xLabel: 'Number of devices', reportTotal: 1746, legendDesc: 'vulnerabilities',
      data: [
        { label: 'CVE-2025-8749',  value: 410, color: 'var(--pai-indigo)' },
        { label: 'CVE-2025-8088',  value: 400, color: 'var(--pai-indigo)' },
        { label: 'CVE-2025-53606', value: 350, color: 'var(--pai-indigo)' },
        { label: 'CVE-2025-48913', value: 350, color: 'var(--pai-indigo)' },
        { label: 'CVE-2025-6572',  value: 256, color: 'var(--pai-indigo)' },
        { label: 'CVE-2025-9754',  value: 150, color: 'var(--pai-indigo)' },
        { label: 'CVE-2025-7543',  value: 150, color: 'var(--pai-indigo)' },
        { label: 'CVE-2025-8754',  value: 100, color: 'var(--pai-indigo)' },
        { label: 'CVE-2025-34656', value: 100, color: 'var(--pai-indigo)' },
        { label: 'CVE-2025-7657',  value: 50,  color: 'var(--pai-indigo)' },
      ],
    },
    // ── Widget 14: Top 10 Most Common Critical Vulnerabilities ─────
    {
      id: 3014, label: 'Top 10 Most Common Critical Vulnerabilities', chartId: 'hor-bar', span: 6, sizeId: 'xlarge', heightId: 'rpt-chart', phase: 'active', dataLocked: true,
      showLegend: false, xLabel: 'Number of devices', reportTotal: 1746, legendDesc: 'Critical Vulnerabilities',
      data: [
        { label: 'CVE-2025-53606', value: 400, color: 'var(--pai-crit-fg)' },
        { label: 'CVE-2025-48913', value: 380, color: 'var(--pai-crit-fg)' },
        { label: 'CVE-2025-6572',  value: 380, color: 'var(--pai-crit-fg)' },
        { label: 'CVE-2025-8749',  value: 300, color: 'var(--pai-crit-fg)' },
        { label: 'CVE-2025-8088',  value: 286, color: 'var(--pai-crit-fg)' },
        { label: 'CVE-2025-2536',  value: 100, color: 'var(--pai-crit-fg)' },
        { label: 'CVE-2025-3645',  value: 100, color: 'var(--pai-crit-fg)' },
        { label: 'CVE-2025-8674',  value: 100, color: 'var(--pai-crit-fg)' },
        { label: 'CVE-2025-2435',  value: 50,  color: 'var(--pai-crit-fg)' },
        { label: 'CVE-2025-7635',  value: 50,  color: 'var(--pai-crit-fg)' },
      ],
    },
    // ── Widget 15: Top 10 Vuln Categories by Vulnerability Findings ─
    {
      id: 3015, label: 'Top 10 Most Common Vulnerability Categories by Vulnerability Findings', chartId: 'table', span: 6, sizeId: 'xlarge', heightId: 'large', phase: 'active', dataLocked: true,
      columns: ['Category', 'Count of Vulnerability Findings (%)'],
      data: [
        { category: 'Palo Alto Networks',                   count: '700',   pct: '32.56%' },
        { category: 'Palo Alto Networks GlobalProtect App', count: '400',   pct: '18.60%' },
        { category: 'CVSS Score Predicted with Rapid7 AI',  count: '250',   pct: '11.63%' },
        { category: 'Privilege Escalation',                 count: '150',   pct: '6.98%'  },
        { category: 'PAN-OS',                               count: '80',    pct: '3.72%'  },
        { category: 'Web',                                  count: '20',    pct: '0.93%'  },
        { category: 'Denial of Service',                    count: '7',     pct: '0.33%'  },
        { category: 'Information Gathering',                count: '5',     pct: '0.23%'  },
        { category: 'Network',                              count: '3',     pct: '0.14%'  },
        { category: 'SSH',                                  count: '2',     pct: '0.09%'  },
        { category: 'Total',                                count: '1,617', pct: '75.26%', isTotal: true },
      ],
    },
    // ── Widget 16: Top 10 Vuln Categories by Vulnerabilities ───────
    {
      id: 3016, label: 'Top 10 Most Common Vulnerability Categories by Vulnerabilities', chartId: 'table', span: 6, sizeId: 'xlarge', heightId: 'large', phase: 'active', dataLocked: true,
      columns: ['Category', 'Count of Vulnerabilities (%)'],
      data: [
        { category: 'Palo Alto Networks',                   count: '300',   pct: '17.17%' },
        { category: 'Palo Alto Networks GlobalProtect App', count: '200',   pct: '11.45%' },
        { category: 'CVSS Score Predicted with Rapid7 AI',  count: '150',   pct: '8.59%'  },
        { category: 'Privilege Escalation',                 count: '120',   pct: '6.87%'  },
        { category: 'PAN-OS',                               count: '80',    pct: '4.58%'  },
        { category: 'Web',                                  count: '60',    pct: '3.44%'  },
        { category: 'Denial of Service',                    count: '50',    pct: '2.86%'  },
        { category: 'Information Gathering',                count: '25',    pct: '1.43%'  },
        { category: 'Network',                              count: '15',    pct: '0.86%'  },
        { category: 'SSH',                                  count: '13',    pct: '0.74%'  },
        { category: 'Total',                                count: '1,013', pct: '58%',    isTotal: true },
      ],
    },
    // ── Widget 17: Top 10 Vulnerable OS by Vulnerability Findings ──
    {
      id: 3017, label: 'Top 10 Most Common Vulnerable Operating Systems by Vulnerability Findings', chartId: 'table', span: 6, sizeId: 'xlarge', heightId: 'large', phase: 'active', dataLocked: true,
      columns: ['OS', 'Count of Vulnerability Findings (%)'],
      data: [
        { category: 'Apple Mac OS X',                       count: '386',   pct: '17.95%' },
        { category: 'Cisco 10S',                            count: '295',   pct: '13.72%' },
        { category: 'Palo Alto Networks PAN-OS',            count: '241',   pct: '11.21%' },
        { category: 'Palo Alto Networks GlobalProtect App', count: '191',   pct: '8.88%'  },
        { category: 'Privilege Escalation',                 count: '155',   pct: '7.21%'  },
        { category: 'Web',                                  count: '135',   pct: '6.28%'  },
        { category: 'Denial of Service',                    count: '115',   pct: '5.35%'  },
        { category: 'Information Gathering',                count: '96',    pct: '4.47%'  },
        { category: 'Network',                              count: '86',    pct: '4.00%'  },
        { category: 'SSH',                                  count: '84',    pct: '3.91%'  },
        { category: 'Total',                                count: '1,784', pct: '82.98%', isTotal: true },
      ],
    },
    // ── Widget 18: Top 10 Vulnerable OS by Vulnerabilities ─────────
    {
      id: 3018, label: 'Top 10 Most Common Vulnerable Operating Systems by Vulnerabilities', chartId: 'table', span: 6, sizeId: 'xlarge', heightId: 'large', phase: 'active', dataLocked: true,
      columns: ['OS', 'Count of Vulnerabilities (%)'],
      data: [
        { category: 'Apple Mac OS X',                       count: '290',   pct: '16.61%'  },
        { category: 'Cisco 10S',                            count: '210',   pct: '12.031%' },
        { category: 'Palo Alto Networks PAN-OS',            count: '170',   pct: '9.74%'   },
        { category: 'Palo Alto Networks GlobalProtect App', count: '140',   pct: '8.02%'   },
        { category: 'Privilege Escalation',                 count: '120',   pct: '6.87%'   },
        { category: 'Web',                                  count: '100',   pct: '5.73%'   },
        { category: 'Denial of Service',                    count: '80',    pct: '4.58%'   },
        { category: 'Information Gathering',                count: '75',    pct: '4.29%'   },
        { category: 'Network',                              count: '72',    pct: '4.12%'   },
        { category: 'SSH',                                  count: '70',    pct: '4.01%'   },
        { category: 'Total',                                count: '1,327', pct: '76%',     isTotal: true },
      ],
    },
    // ── Widget 19: Top 10 Most Common Operating Systems ───────────
    {
      id: 3019, label: 'Top 10 Most Common Operating Systems', chartId: 'hor-bar', span: 6, sizeId: 'xlarge', heightId: 'rpt-chart', phase: 'active', dataLocked: true,
      showLegend: false, xLabel: 'Devices', legendDesc: 'os',
      data: [
        { label: 'Apple Mac OS X',   value: 200, color: 'var(--pai-indigo)' },
        { label: 'Juniper Junos',    value: 100, color: 'var(--pai-indigo)' },
        { label: 'Fortinet FortiOS', value: 50,  color: 'var(--pai-indigo)' },
        { label: 'Linux',            value: 50,  color: 'var(--pai-indigo)' },
        { label: 'Solaris',          value: 50,  color: 'var(--pai-indigo)' },
        { label: 'Chrome OS',        value: 30,  color: 'var(--pai-indigo)' },
        { label: 'Free BSD',         value: 30,  color: 'var(--pai-indigo)' },
        { label: 'QNX',              value: 10,  color: 'var(--pai-indigo)' },
        { label: 'VxWorks',          value: 10,  color: 'var(--pai-indigo)' },
        { label: 'z/OS',             value: 10,  color: 'var(--pai-indigo)' },
      ],
    },
    // ── Widget 20: Top 10 Most Common Services ─────────────────────
    {
      id: 3020, label: 'Top 10 Most Common Services', chartId: 'hor-bar', span: 6, sizeId: 'xlarge', heightId: 'rpt-chart', phase: 'active', dataLocked: true,
      showLegend: false, xLabel: 'Devices', legendDesc: 'service',
      data: [
        { label: 'SSH',         value: 400, color: 'var(--pai-indigo)' },
        { label: 'SNMP',        value: 300, color: 'var(--pai-indigo)' },
        { label: 'HTTPS',       value: 200, color: 'var(--pai-indigo)' },
        { label: 'callbook',    value: 200, color: 'var(--pai-indigo)' },
        { label: 'uucp-rlogin', value: 200, color: 'var(--pai-indigo)' },
        { label: 'NTP',         value: 100, color: 'var(--pai-indigo)' },
        { label: 'Telnet',      value: 80,  color: 'var(--pai-indigo)' },
        { label: 'FTP',         value: 80,  color: 'var(--pai-indigo)' },
        { label: 'DNS',         value: 50,  color: 'var(--pai-indigo)' },
        { label: 'NetBIOS',     value: 50,  color: 'var(--pai-indigo)' },
      ],
    },
  ],
}

// ── Detailed Report on Vulnerabilities template ──────────────────────
export const VULN_DETAIL_TEMPLATE = {
  name: 'Detailed Report on Vulnerabilities',
  coverImage: 'assets/reports/executive-summary-cover.svg',
  coverDescription: 'This report provides a comprehensive inventory of all vulnerability findings across the infrastructure. It includes detailed breakdowns by severity, affected hosts, vulnerability categories, and remediation status, enabling targeted and prioritised remediation efforts.',
  widgets: [
    { id: 4001, label: 'Total Vulnerability Findings', chartId: 'kpi', span: 2, sizeId: 'small', heightId: 'xsmall', phase: 'active', dataLocked: true,
      data: { value: '2,150', label: 'Total Vulnerability Findings', trend: '4%', trendUp: true, trendSuffix: ES_SUFF, trendData: [
        { name: 'Jan', value: 2070 }, { name: 'Feb', value: 2090 }, { name: 'Mar', value: 2100 },
        { name: 'Apr', value: 2115 }, { name: 'May', value: 2135 }, { name: 'Jun', value: 2150 },
      ]},
    },
    { id: 4002, label: 'Critical Findings', chartId: 'kpi', span: 2, sizeId: 'small', heightId: 'xsmall', phase: 'active', dataLocked: true,
      data: { value: '312', label: 'Critical Findings', trend: '6%', trendUp: false, trendSuffix: ES_SUFF, trendData: [
        { name: 'Jan', value: 340 }, { name: 'Feb', value: 335 }, { name: 'Mar', value: 330 },
        { name: 'Apr', value: 325 }, { name: 'May', value: 318 }, { name: 'Jun', value: 312 },
      ]},
    },
    { id: 4003, label: 'High Findings', chartId: 'kpi', span: 2, sizeId: 'small', heightId: 'xsmall', phase: 'active', dataLocked: true,
      data: { value: '648', label: 'High Findings', trend: '2%', trendUp: false, trendSuffix: ES_SUFF, trendData: [
        { name: 'Jan', value: 675 }, { name: 'Feb', value: 670 }, { name: 'Mar', value: 665 },
        { name: 'Apr', value: 660 }, { name: 'May', value: 654 }, { name: 'Jun', value: 648 },
      ]},
    },
    { id: 4004, label: 'Affected Hosts', chartId: 'kpi', span: 3, sizeId: 'medium', heightId: 'xsmall', phase: 'active', dataLocked: true, rowBreak: true,
      data: { value: '1,322', label: 'Affected Hosts', trend: '2%', trendUp: false, trendSuffix: ES_SUFF, trendData: [
        { name: 'Jan', value: 1350 }, { name: 'Feb', value: 1345 }, { name: 'Mar', value: 1340 },
        { name: 'Apr', value: 1335 }, { name: 'May', value: 1328 }, { name: 'Jun', value: 1322 },
      ]},
    },
    { id: 4005, label: 'Remediation Rate', chartId: 'kpi', span: 3, sizeId: 'medium', heightId: 'xsmall', phase: 'active', dataLocked: true,
      data: { value: '68%', label: 'Remediation Rate', trend: '5%', trendUp: true, trendSuffix: ES_SUFF, trendData: [
        { name: 'Jan', value: 60 }, { name: 'Feb', value: 62 }, { name: 'Mar', value: 63 },
        { name: 'Apr', value: 65 }, { name: 'May', value: 66 }, { name: 'Jun', value: 68 },
      ]},
    },
    { id: 4006, label: 'Vulnerability Findings by Severity', chartId: 'vert-bar', span: 6, sizeId: 'xlarge', heightId: 'rpt-chart', phase: 'active', dataLocked: true,
      data: [
        { name: 'Critical', value: 312,  color: 'var(--pai-crit-fg)'  },
        { name: 'High',     value: 648,  color: 'var(--pai-red-high)' },
        { name: 'Medium',   value: 890,  color: 'var(--pai-high-fg)'  },
        { name: 'Low',      value: 300,  color: 'var(--pai-green)'    },
      ],
    },
    { id: 4007, label: 'Top 10 Most Vulnerable Hosts', chartId: 'hor-bar', span: 6, sizeId: 'xlarge', heightId: 'rpt-chart', phase: 'active', dataLocked: true,
      data: [
        { name: 'srv-prod-01',   value: 48, color: 'var(--pai-crit-fg)'  },
        { name: 'srv-db-02',     value: 41, color: 'var(--pai-crit-fg)'  },
        { name: 'ws-finance-03', value: 35, color: 'var(--pai-red-high)' },
        { name: 'srv-web-04',    value: 31, color: 'var(--pai-red-high)' },
        { name: 'ws-hr-05',      value: 28, color: 'var(--pai-high-fg)'  },
        { name: 'srv-app-06',    value: 24, color: 'var(--pai-high-fg)'  },
        { name: 'net-fw-07',     value: 19, color: 'var(--pai-high-fg)'  },
        { name: 'ws-dev-08',     value: 15, color: 'var(--pai-green)'    },
        { name: 'srv-mail-09',   value: 13, color: 'var(--pai-green)'    },
        { name: 'ws-ops-10',     value: 10, color: 'var(--pai-green)'    },
      ],
    },
    { id: 4008, label: 'Vulnerabilities by Category', chartId: 'pie', span: 6, sizeId: 'xlarge', heightId: 'rpt-pie', phase: 'active', dataLocked: true,
      data: [
        { label: 'Remote Code Execution', count: '380', value: 380, pct: '18%', color: 'var(--pai-crit-fg)'  },
        { label: 'Privilege Escalation',  count: '294', value: 294, pct: '14%', color: 'var(--pai-red-high)' },
        { label: 'Information Disclosure',count: '441', value: 441, pct: '21%', color: 'var(--pai-high-fg)'  },
        { label: 'Denial of Service',     count: '210', value: 210, pct: '10%', color: '#5BADB8'             },
        { label: 'Other',                 count: '825', value: 825, pct: '38%', color: 'var(--pai-green)'    },
      ],
    },
    { id: 4009, label: 'Detailed Vulnerability Findings', chartId: 'table', span: 6, sizeId: 'xlarge', heightId: 'xlarge', phase: 'active', dataLocked: true, enableDownload: true,
      data: [],
    },
    { id: 4010, label: 'Vulnerability Findings by Host and Severity', chartId: 'table', span: 6, sizeId: 'xlarge', heightId: 'large', phase: 'active', dataLocked: true, enableDownload: true,
      data: [],
    },
    { id: 4011, label: 'Remediation Status by Severity', chartId: 'table', span: 6, sizeId: 'xlarge', heightId: 'large', phase: 'active', dataLocked: true, enableDownload: true,
      data: [],
    },
  ],
}

// ── Month over Month Report template ────────────────────────────────
export const MOM_TEMPLATE = {
  name: 'Month over Month Report',
  coverImage: 'assets/reports/executive-summary-cover.svg',
  coverDescription: 'This report presents a month-over-month analysis of vulnerability trends across the environment. It tracks changes in severity distribution, newly discovered and remediated findings, and overall risk posture over time to support continuous improvement in security operations.',
  widgets: [
    { id: 5001, label: 'New Vulnerabilities (MoM)', chartId: 'kpi', span: 2, sizeId: 'small', heightId: 'xsmall', phase: 'active', dataLocked: true,
      data: { value: '+184', label: 'New Vulnerabilities (MoM)', trend: '12%', trendUp: true, trendSuffix: ES_SUFF, trendData: [
        { name: 'Jan', value: 120 }, { name: 'Feb', value: 145 }, { name: 'Mar', value: 158 },
        { name: 'Apr', value: 162 }, { name: 'May', value: 176 }, { name: 'Jun', value: 184 },
      ]},
    },
    { id: 5002, label: 'Closed Vulnerabilities (MoM)', chartId: 'kpi', span: 2, sizeId: 'small', heightId: 'xsmall', phase: 'active', dataLocked: true,
      data: { value: '+231', label: 'Closed Vulnerabilities (MoM)', trend: '8%', trendUp: true, trendSuffix: ES_SUFF, trendData: [
        { name: 'Jan', value: 180 }, { name: 'Feb', value: 195 }, { name: 'Mar', value: 210 },
        { name: 'Apr', value: 215 }, { name: 'May', value: 222 }, { name: 'Jun', value: 231 },
      ]},
    },
    { id: 5003, label: 'Net Change', chartId: 'kpi', span: 2, sizeId: 'small', heightId: 'xsmall', phase: 'active', dataLocked: true,
      data: { value: '-47', label: 'Net Change', trend: '3%', trendUp: false, trendSuffix: ES_SUFF, trendData: [
        { name: 'Jan', value: -60 }, { name: 'Feb', value: -55 }, { name: 'Mar', value: -52 },
        { name: 'Apr', value: -50 }, { name: 'May', value: -48 }, { name: 'Jun', value: -47 },
      ]},
    },
    { id: 5004, label: 'Remediation Rate (MoM)', chartId: 'kpi', span: 3, sizeId: 'medium', heightId: 'xsmall', phase: 'active', dataLocked: true, rowBreak: true,
      data: { value: '68%', label: 'Remediation Rate (MoM)', trend: '5%', trendUp: true, trendSuffix: ES_SUFF, trendData: [
        { name: 'Jan', value: 58 }, { name: 'Feb', value: 60 }, { name: 'Mar', value: 62 },
        { name: 'Apr', value: 64 }, { name: 'May', value: 66 }, { name: 'Jun', value: 68 },
      ]},
    },
    { id: 5005, label: 'Mean Time to Remediate (Days)', chartId: 'kpi', span: 3, sizeId: 'medium', heightId: 'xsmall', phase: 'active', dataLocked: true,
      data: { value: '14.2', label: 'Mean Time to Remediate (Days)', trend: '11%', trendUp: false, trendSuffix: ES_SUFF, trendData: [
        { name: 'Jan', value: 18 }, { name: 'Feb', value: 17 }, { name: 'Mar', value: 16.5 },
        { name: 'Apr', value: 16 }, { name: 'May', value: 15 }, { name: 'Jun', value: 14.2 },
      ]},
    },
    { id: 5006, label: 'Monthly Vulnerability Trend by Severity', chartId: 'vert-bar', span: 6, sizeId: 'xlarge', heightId: 'rpt-chart', phase: 'active', dataLocked: true,
      data: [
        { name: 'Jan', value: 620,  color: 'var(--pai-crit-fg)'  },
        { name: 'Feb', value: 598,  color: 'var(--pai-crit-fg)'  },
        { name: 'Mar', value: 571,  color: 'var(--pai-red-high)' },
        { name: 'Apr', value: 543,  color: 'var(--pai-red-high)' },
        { name: 'May', value: 519,  color: 'var(--pai-high-fg)'  },
        { name: 'Jun', value: 492,  color: 'var(--pai-high-fg)'  },
      ],
    },
    { id: 5007, label: 'New vs Closed Vulnerabilities by Month', chartId: 'hor-bar', span: 6, sizeId: 'xlarge', heightId: 'rpt-chart', phase: 'active', dataLocked: true,
      data: [
        { name: 'Jan', value: 120, color: 'var(--pai-crit-fg)'  },
        { name: 'Feb', value: 145, color: 'var(--pai-red-high)' },
        { name: 'Mar', value: 158, color: 'var(--pai-high-fg)'  },
        { name: 'Apr', value: 162, color: 'var(--pai-high-fg)'  },
        { name: 'May', value: 176, color: 'var(--pai-green)'    },
        { name: 'Jun', value: 184, color: 'var(--pai-green)'    },
      ],
    },
    { id: 5008, label: 'Severity Distribution Change (MoM)', chartId: 'pie', span: 6, sizeId: 'xlarge', heightId: 'rpt-pie', phase: 'active', dataLocked: true,
      data: [
        { label: 'Critical', count: '312', value: 312, pct: '15%', color: 'var(--pai-crit-fg)'  },
        { label: 'High',     count: '648', value: 648, pct: '30%', color: 'var(--pai-red-high)' },
        { label: 'Medium',   count: '890', value: 890, pct: '41%', color: 'var(--pai-high-fg)'  },
        { label: 'Low',      count: '300', value: 300, pct: '14%', color: 'var(--pai-green)'    },
      ],
    },
    { id: 5009, label: 'Monthly Vulnerability Summary', chartId: 'table', span: 6, sizeId: 'xlarge', heightId: 'large', phase: 'active', dataLocked: true, enableDownload: true,
      data: [],
    },
    { id: 5010, label: 'Top Recurring Vulnerabilities (Past 3 Months)', chartId: 'table', span: 6, sizeId: 'xlarge', heightId: 'large', phase: 'active', dataLocked: true, enableDownload: true,
      data: [],
    },
  ],
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

// ── Saved-dashboard edit seeding ─────────────────────────────────────
// SavedPage's mock rows (SAVED_ROWS) only carry a `template` label, not real
// widget content, so re-opening one for editing needs a plausible starting
// point rather than a blank canvas — reuse the closest matching template's
// widgets/scope by that label. Not every mock label has a dedicated
// template, so unmatched ones fall back to the exec-summary set.
const DASHBOARD_EDIT_SEED_BY_TEMPLATE = {
  'Discover Dashboard':    { widgets: DISCOVER_TEMPLATE.widgets,    scopeId: 'host' },
  'Executive Summary':     { widgets: EXEC_SUMMARY_TEMPLATE.widgets, scopeId: 'finding' },
  'Critical Findings':     { widgets: VULN_DETAIL_TEMPLATE.widgets,  scopeId: 'finding' },
  'Device Attack Surface': { widgets: VULN_DETAIL_TEMPLATE.widgets,  scopeId: 'host' },
  'Risk Mitigation':       { widgets: VULN_DETAIL_TEMPLATE.widgets,  scopeId: 'vulnerability' },
  'Security Gaps':         { widgets: VULN_DETAIL_TEMPLATE.widgets,  scopeId: 'vulnerability' },
  'Client Subsidiary':     { widgets: EXEC_SUMMARY_TEMPLATE.widgets, scopeId: 'account' },
}
const DASHBOARD_EDIT_SEED_DEFAULT = { widgets: EXEC_SUMMARY_TEMPLATE.widgets, scopeId: 'host' }

// ── Segmented tabs (same pattern as KG) ─────────────────────────────
function SegmentedTabs({ value, options, onChange, fullWidth, height = 32 }) {
  const btnRefs = useRef([])
  const [thumb, setThumb] = useState({ left: 3, width: 0 })

  useEffect(() => {
    const idx = options.indexOf(value)
    const btn = btnRefs.current[idx]
    if (btn) setThumb({ left: btn.offsetLeft, width: btn.offsetWidth })
  }, [value, options.join('|')])

  return (
    <div className={fullWidth ? 'kg-seg-tabs kg-seg-tabs--full' : 'kg-seg-tabs'} style={{ '--kg-seg-height': `${height}px` }}>
      <div className="kg-seg-thumb" style={{ left: thumb.left, width: thumb.width, opacity: thumb.width ? 1 : 0 }} />
      {options.map((o, i) => (
        <button
          key={o}
          ref={el => { btnRefs.current[i] = el }}
          onClick={() => onChange && onChange(o)}
          className={['kg-seg-btn', o === value ? 'kg-seg-btn--active' : '', fullWidth ? 'kg-seg-btn--full' : ''].filter(Boolean).join(' ')}
        >
          {o}
        </button>
      ))}
    </div>
  )
}

// ── Month-over-Month timeline modal ─────────────────────────────────
const MONTHS_LONG = ['January','February','March','April','May','June','July','August','September','October','November','December']
const YEARS_LIST  = [2023, 2024, 2025, 2026, 2027]

function MomDropdown({ value, onChange, options, zIndex = 220 }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  return (
    <div ref={ref} className="mom-select-wrap" onClick={() => setOpen(o => !o)}>
      <span className="mom-select-val">{value}</span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        className={`mom-select-chevron${open ? ' mom-select-chevron--open' : ''}`}>
        <path d="m6 9 6 6 6-6"/>
      </svg>
      {open && (
        <div className="comp-sort-menu comp-sort-menu--full comp-sort-menu--scrollable" style={{ zIndex }}
          onClick={e => e.stopPropagation()}>
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

function MomEditIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  )
}

const RANGE_OPTS        = ['1 M', '3 M', '6 M', '1 Y', 'Custom']
const RANGE_MONTH_COUNT = { '1 M': 0, '3 M': 2, '6 M': 5, '1 Y': 11 }

function addMonths(month, year, n) {
  let m = month + n
  let y = year + Math.floor(m / 12)
  m = m % 12
  return { month: m, year: y }
}

function lastDayOf(month, year) {
  return new Date(year, month + 1, 0).getDate()
}

function MomTimelineModal({ defaultName, onConfirm, onCancel }) {
  const [name, setName]             = useState(defaultName)
  const [range, setRange]           = useState('3 M')
  const [startMonth, setStartMonth] = useState(5)   // June
  const [startYear, setStartYear]   = useState(2025)
  const [endMonth, setEndMonth]     = useState(7)   // August
  const [endYear, setEndYear]       = useState(2025)

  const applyRange = (r, sm, sy) => {
    const n = RANGE_MONTH_COUNT[r]
    if (n == null) return
    const end = addMonths(sm, sy, n)
    setEndMonth(end.month)
    setEndYear(end.year)
  }

  const handleRange = (r) => {
    setRange(r)
    applyRange(r, startMonth, startYear)
  }

  const handleStartMonth = (v) => {
    setStartMonth(v)
    if (range !== 'Custom') applyRange(range, v, startYear)
  }
  const handleStartYear = (v) => {
    setStartYear(v)
    if (range !== 'Custom') applyRange(range, startMonth, v)
  }

  const startLabel = `1 ${MONTHS_LONG[startMonth]} ${startYear}`
  const endLabel   = `${lastDayOf(endMonth, endYear)} ${MONTHS_LONG[endMonth]} ${endYear}`

  return (
    <>
      <div className="sfm-overlay sfm-overlay--z200" />
      <div className="mom-modal">
        <div className="mom-modal-header">
          <MomEditIcon />
          <span className="mom-modal-title">Edit Report Template</span>
        </div>

        <div className="mom-modal-body">
          {/* Report Setup */}
          <div className="mom-section">
            <div className="mom-divider-row">
              <span className="mom-divider-label">Report Setup</span>
              <div className="mom-divider-line" />
            </div>
            <div className="mom-field">
              <label className="mom-field-label">Report Name <span className="mom-required">*</span></label>
              <input className="mom-field-input" value={name} onChange={e => setName(e.target.value)} />
            </div>
          </div>

          {/* Set Report Timeline */}
          <div className="mom-section">
            <div className="mom-divider-row">
              <span className="mom-divider-label">Set Report Timeline</span>
              <div className="mom-divider-line" />
            </div>

            <SegmentedTabs
              value={range}
              options={RANGE_OPTS}
              onChange={handleRange}
              fullWidth
              height={36}
            />

            <div className="mom-month-row">
              <div className="mom-month-field">
                <label className="mom-field-label">Start Month</label>
                <div className="mom-month-selects">
                  <MomDropdown
                    value={MONTHS_LONG[startMonth]}
                    options={MONTHS_LONG}
                    onChange={v => handleStartMonth(MONTHS_LONG.indexOf(v))}
                  />
                  <MomDropdown
                    value={String(startYear)}
                    options={YEARS_LIST.map(String)}
                    onChange={v => handleStartYear(+v)}
                  />
                </div>
              </div>

              <div className="mom-month-field">
                <label className="mom-field-label">End Month</label>
                <div className="mom-month-selects">
                  <MomDropdown
                    value={MONTHS_LONG[endMonth]}
                    options={MONTHS_LONG}
                    onChange={v => setEndMonth(MONTHS_LONG.indexOf(v))}
                  />
                  <MomDropdown
                    value={String(endYear)}
                    options={YEARS_LIST.map(String)}
                    onChange={v => setEndYear(+v)}
                  />
                </div>
              </div>
            </div>

            <p className="mom-summary">
              This report will be generated from <strong>{startLabel}</strong> to <strong>{endLabel}</strong>. All comparisons will be calculated based on month-end data.
            </p>
          </div>
        </div>

        <div className="mom-modal-footer">
          <button className="ds-btn sz-md t-secondary" onClick={onCancel}>Cancel</button>
          <button className="ds-btn sz-md t-primary" disabled={!name.trim()} onClick={() => onConfirm({ name, range, startMonth, startYear, endMonth, endYear })}>
            Create Report
          </button>
        </div>
      </div>
    </>
  )
}

function MomSkeleton() {
  return (
    <div className="mom-skeleton">
      <div className="mom-sk-toolbar">
        <div className="mom-sk-bar mom-sk-bar--w200" />
        <div className="mom-sk-spacer" />
        <div className="mom-sk-bar mom-sk-bar--w80" />
        <div className="mom-sk-bar mom-sk-bar--w80" />
        <div className="mom-sk-bar mom-sk-bar--w100" />
      </div>
      <div className="mom-sk-body">
        <div className="mom-sk-kpi-row">
          {[1,2,3].map(i => <div key={i} className="mom-sk-kpi" />)}
        </div>
        <div className="mom-sk-kpi-row">
          {[1,2].map(i => <div key={i} className="mom-sk-kpi mom-sk-kpi--wide" />)}
        </div>
        <div className="mom-sk-chart" />
        <div className="mom-sk-chart" />
      </div>
    </div>
  )
}

// Connected data sources feeding this workspace (same list Admin > Data
// Integrations manages, see DataIntegrations.jsx) — only ones actually
// "Connected" make sense to ground a generated dashboard on.
const HERO_DATA_SOURCES = INITIAL_DATA_SOURCES.filter(s => s.status === 'Connected')
const HERO_SOURCE_COLORS = ['--shell-accent', '--pai-nav-teal', '--pai-green', '--pai-high-fg', '--pai-purple', '--pai-brand-blue']
const sourceInitials = (name) => name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()

// ── Create-with-Navigator hero ───────────────────────────────────────
// Shown instead of the bare "Add Widget" tile while the canvas has zero
// widgets — describing a dashboard here hands the prompt to Navigator's
// real Build reasoning engine (docked right panel), which pushes generated
// widgets straight onto this canvas as they finish. "Create manually"
// underneath is the previous, unassisted path (openAdd).
// Reuses Navigator's own AI-home visual language (hv-bg blobs, hv-greeting's
// animated gradient text, hv-composer-box's always-on gradient border) —
// see NavigatorPage.jsx's HomeView — instead of a plain bordered box, so this
// entry point actually reads as the same AI surface, not a generic form.
function DashboardCreateHero({ onSubmit, onCreateManually }) {
  const [prompt, setPrompt] = useState('')
  const [attachMenuOpen, setAttachMenuOpen] = useState(false)
  const [attachMenuPos, setAttachMenuPos] = useState({ top: 0, left: 0 })
  const attachBtnRef = useRef(null)
  const attachMenuRef = useRef(null)
  const fileInputRef = useRef(null)

  // .hv-composer-box clips its own content (overflow:hidden, for its rounded
  // gradient border) — a plain absolutely-positioned dropdown nested inside
  // it gets cut off, so this portals to <body> instead (same escape-hatch
  // NavigatorPage.jsx's own agent-picker menu uses for the same reason).
  useEffect(() => {
    if (!attachMenuOpen) return
    const handler = e => {
      if (attachMenuRef.current?.contains(e.target)) return
      if (attachBtnRef.current?.contains(e.target)) return
      setAttachMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [attachMenuOpen])

  const submit = (text) => {
    const t = (text ?? prompt).trim()
    if (!t) return
    onSubmit(t)
  }

  const appendToPrompt = (fragment) => setPrompt(p => (p.trim() ? `${p.trim()} ${fragment}` : fragment))

  const insertEntity = (entity) => {
    appendToPrompt(`for ${entity.label}`)
    setAttachMenuOpen(false)
  }

  const insertSource = (source) => {
    appendToPrompt(`from ${source.name}`)
    setAttachMenuOpen(false)
  }

  const openAttachMenu = () => {
    if (!attachMenuOpen && attachBtnRef.current) {
      const r = attachBtnRef.current.getBoundingClientRect()
      setAttachMenuPos({ top: r.bottom + 6, left: r.left })
    }
    setAttachMenuOpen(o => !o)
  }

  const handleFileChosen = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    appendToPrompt(`using data from "${file.name}"`)
  }

  return (
    <div className="dc-create-hero">
      <div className="hv-bg">
        <div className="hv-bg-blob hv-bg-blob-1" />
        <div className="hv-bg-blob hv-bg-blob-2" />
      </div>

      <div className="dc-create-hero__content">
        <div className="dc-create-hero__badge">
          <img src="assets/icons/Navigator icon.svg" width={20} height={20} alt="" />
        </div>
        <h2 className="hv-greeting">Create a dashboard with Navigator</h2>
        <p className="hv-sub">Describe the insights you want to see and Navigator will build it for you.</p>

        <div className="hv-composer-box">
          <div className="hv-tx-input">
            <textarea
              className="hv-composer-ta"
              rows={2}
              placeholder='Describe a dashboard, e.g. "critical findings by host and source"…'
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }}
            />
          </div>
          <div className="hv-composer-bar">
            <div className="dc-create-hero__composer-left">
              <input ref={fileInputRef} type="file" className="dc-sr-only" onChange={handleFileChosen} />
              <button
                ref={attachBtnRef}
                type="button"
                className={`np-composer-add${attachMenuOpen ? ' active' : ''}`}
                onClick={openAttachMenu}
                aria-label="Attach data to ground this dashboard on"
                aria-haspopup="menu"
                aria-expanded={attachMenuOpen}
                title="Attach data or reference an entity"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
              {attachMenuOpen && createPortal(
                <div
                  className="dc-create-hero__entity-menu"
                  ref={attachMenuRef}
                  style={{ '--dc-entity-menu-top': `${attachMenuPos.top}px`, '--dc-entity-menu-left': `${attachMenuPos.left}px` }}
                >
                  <button
                    type="button"
                    className="dc-create-hero__entity-item"
                    onClick={() => { setAttachMenuOpen(false); fileInputRef.current?.click() }}
                  >
                    <span className="dc-create-hero__entity-icon dc-create-hero__entity-icon--upload">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                    </span>
                    Upload a file
                  </button>

                  <div className="dc-create-hero__menu-label">Connected data sources</div>
                  {HERO_DATA_SOURCES.map((source, i) => (
                    <button type="button" key={source.id} className="dc-create-hero__entity-item" onClick={() => insertSource(source)}>
                      <span className="dc-create-hero__entity-icon" style={{ '--dc-source-color': `var(${HERO_SOURCE_COLORS[i % HERO_SOURCE_COLORS.length]})` }}>
                        {sourceInitials(source.name)}
                      </span>
                      {source.name}
                    </button>
                  ))}

                  <div className="dc-create-hero__menu-label">Reference an entity</div>
                  {GF_ENTITIES.slice(0, 6).map(entity => (
                    <button type="button" key={entity.id} className="dc-create-hero__entity-item" onClick={() => insertEntity(entity)}>
                      <img src={`/assets/icons/${entity.file}`} width={14} height={14} alt="" />
                      {entity.label}
                    </button>
                  ))}
                </div>,
                document.body
              )}
              <span className="dc-create-hero__hint">Press Enter to generate</span>
            </div>
            <button
              type="button"
              className="nav-send-btn"
              disabled={!prompt.trim()}
              onClick={() => submit()}
              aria-label="Generate dashboard"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="dc-create-hero__divider"><span>or</span></div>

        <button type="button" className="ds-btn sz-md t-outline" onClick={onCreateManually}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Create manually
        </button>
      </div>
    </div>
  )
}

const DashboardCanvas = forwardRef(function DashboardCanvas({ onNav, templateId = null, reportMode = false, reportTitle = '', onNameChange, onOpenCopilotBuilder, seedWidgets = null, seedName = '', backTarget = 'workspace/saved' }, ref) {
  const { addSavedDashboard, setJustSavedName, editDashboardSeed } = useWorkspace()
  const template = templateId === 'discover' ? DISCOVER_TEMPLATE
    : templateId === 'executive-summary' ? EXEC_SUMMARY_TEMPLATE
    : templateId === 'vulnerabilities'   ? VULN_DETAIL_TEMPLATE
    : templateId === 'month-over-month'  ? MOM_TEMPLATE
    : null
  // Set by SavedPage's "Edit" action on an existing saved dashboard — captured
  // once at mount. WorkspacePage owns clearing it (keyed off the route, once
  // the user navigates away from this edit-* route) so it isn't picked up
  // again by the next dashboard this canvas mounts for (e.g. "New Dashboard").
  const [editSeed] = useState(() => editDashboardSeed)
  const editSeedEntry = editSeed ? (DASHBOARD_EDIT_SEED_BY_TEMPLATE[editSeed.template] ?? DASHBOARD_EDIT_SEED_DEFAULT) : null

  // `seedWidgets`/`seedName` arrive when this canvas was just navigated to from
  // Navigator's Build mode (or Ask/Research's "Add to Workspace") — see
  // WorkspacePage's `isSeededDashboard` handling — and behave exactly like a
  // template, just constructed at runtime from the chat session instead of a
  // hard-coded constant.
  const [name, setName]       = useState(reportMode ? reportTitle : (template?.name ?? editSeed?.name ?? seedName ?? ''))
  const [widgets, setWidgets] = useState(() => {
    if (template) return template.widgets
    if (editSeedEntry) return editSeedEntry.widgets
    if (seedWidgets && seedWidgets.length) return seedWidgets
    return []
  })

  const [timelineConfirmed, setTimelineConfirmed] = useState(templateId !== 'month-over-month' || !reportMode)
  const [momTimeline, setMomTimeline] = useState('')

  // Dashboard scope: brand-new, never-scoped dashboards (no template, no
  // seed data, not a report, not an existing dashboard being edited) must
  // have the graph-filter scope popup set before anything else — see the
  // "New Dashboard" flow from the Library.
  const isNewDashboard = !reportMode && !template && !editSeed && (!seedWidgets || !seedWidgets.length)
  const [dashboardScope, setDashboardScope] = useState(() =>
    editSeedEntry ? (GF_ENTITIES.find(e => e.id === editSeedEntry.scopeId) ?? null) : null
  )
  const [scopeModalOpen, setScopeModalOpen] = useState(false)
  const [scopeMandatory, setScopeMandatory] = useState(false)
  useEffect(() => {
    if (isNewDashboard) { setScopeMandatory(true); setScopeModalOpen(true) }
  }, [])

  // Panel state: null | 'add' | 'settings'
  const [panelMode, setPanelMode]         = useState(null)
  const [settingsWidgetId, setSettingsWidgetId] = useState(null)
  const [liveSizeId, setLiveSizeId]       = useState(null)
  const [liveHeightId, setLiveHeightId]   = useState(null)
  const [deletePending, setDeletePending] = useState(null)
  const [deleteDashboardConfirm, setDeleteDashboardConfirm] = useState(false)

  // Dashboard-level actions: share + schedule + stop schedule + download (UI only — this app has no backend)
  const [shareOpen, setShareOpen]           = useState(false)
  const [shareRecipients, setShareRecipients] = useState('')
  const [shareRecipientList, setShareRecipientList] = useState([])
  const [shareAccessDraft, setShareAccessDraft] = useState('view')
  const [shareMessage, setShareMessage]     = useState('')
  const [shareSendCopy, setShareSendCopy]   = useState(true)

  // Save / Save As — persists into the Saved Dashboards list (see WorkspaceCtx's
  // savedDashboards), the same local-only "backend" savedReports already uses.
  const [dashboardId, setDashboardId]       = useState(() => editSeed?.id ?? null)
  const [saveModalOpen, setSaveModalOpen]   = useState(false)
  const [saveModalMode, setSaveModalMode]   = useState('save') // 'save' | 'save-as'
  const [saveNameDraft, setSaveNameDraft]   = useState('')
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false)
  // An existing dashboard opened for editing starts out already "saved" — its
  // snapshot must reflect that so the leave-confirmation doesn't fire until
  // something actually changes.
  const lastSavedSnapshotRef = useRef(editSeed ? JSON.stringify({ name, widgets, dashboardScope }) : null)

  const openSaveModal = (mode) => { setSaveModalMode(mode); setSaveNameDraft(name); setSaveModalOpen(true) }
  const handleDashboardSaved = (savedName) => {
    const id = saveModalMode === 'save-as' ? `d-${Date.now()}` : (dashboardId ?? `d-${Date.now()}`)
    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
    addSavedDashboard({
      id, name: savedName, isNew: true, type: 'DASHBOARD',
      template: template?.name ?? editSeed?.template ?? 'Custom', visibility: 'Private', status: 'Saved',
      lastUpdated: today,
    })
    setDashboardId(id)
    setName(savedName)
    lastSavedSnapshotRef.current = JSON.stringify({ name: savedName, widgets, dashboardScope })
    setSaveModalOpen(false)
    setJustSavedName(savedName)
    onNav('workspace/saved')
  }
  const isDirty = !reportMode && !(widgets.length === 0 && !name.trim())
    && JSON.stringify({ name, widgets, dashboardScope }) !== lastSavedSnapshotRef.current
  const handleBackClick = () => {
    if (isDirty) { setLeaveConfirmOpen(true); return }
    onNav(backTarget)
  }

  const [scheduleOpen, setScheduleOpen]         = useState(false)
  const [scheduleActive, setScheduleActive]     = useState(false)
  const [scheduleRecipients, setScheduleRecipients] = useState('')
  const [scheduleSendCopy, setScheduleSendCopy] = useState(true)
  const [scheduleMode, setScheduleMode]         = useState('specific') // 'daily' | 'specific'
  const [scheduleStartDate, setScheduleStartDate] = useState('')
  const [scheduleStartTime, setScheduleStartTime] = useState('09:00')
  const [scheduleRepeatEvery, setScheduleRepeatEvery] = useState(1)
  const [scheduleRepeatUnit, setScheduleRepeatUnit]   = useState('week')
  const [scheduleRepeatUntil, setScheduleRepeatUntil] = useState('')

  const [stopScheduleOpen, setStopScheduleOpen] = useState(false)

  const [downloadOpen, setDownloadOpen] = useState(false)
  const [downloadTables, setDownloadTables] = useState(() =>
    Object.fromEntries(DOWNLOAD_TABLE_OPTIONS.map(t => [t.id, true]))
  )

  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const moreMenuRef = useRef(null)
  useEffect(() => {
    if (!moreMenuOpen) return
    const handler = e => { if (moreMenuRef.current && !moreMenuRef.current.contains(e.target)) setMoreMenuOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [moreMenuOpen])

  const perf = widgets.filter(w => w.phase === 'active').length > 0
    ? perfLevel(widgets.filter(w => w.phase === 'active').length) : null

  // The toolbar's identity row (back/name/scope) and actions row (Copilot/
  // Share/Schedule/Download/kebab/Save) share one line by default. Only
  // stack them into two lines once they'd actually overflow.
  //
  // Can't use scrollWidth here: once stacked, each row stretches to 100% of
  // the outer toolbar's width (column-flex cross-axis stretch), so a row
  // narrower than that reports scrollWidth == clientWidth == the stretched
  // box width, not its real content width — a self-referential measurement
  // that would flip-flop every render. Instead sum each visible child's own
  // rendered width (stable regardless of row/column direction, since
  // flex-shrink:0 children don't resize based on the row's box width),
  // skipping the flex-grow spacer, which is the only child that does.
  const toolbarOuterRef = useRef(null)
  const toolbarTopRowRef = useRef(null)
  const toolbarActionsRowRef = useRef(null)
  const [toolbarStacked, setToolbarStacked] = useState(false)
  const [toolbarCompact, setToolbarCompact] = useState(false)
  useEffect(() => {
    const outer = toolbarOuterRef.current
    const top = toolbarTopRowRef.current
    const actions = toolbarActionsRowRef.current
    if (!outer || !top || !actions) return
    const naturalWidth = row => {
      const visible = Array.from(row.children).filter(c => !c.classList.contains('dc-toolbar-spacer'))
      const sum = visible.reduce((total, c) => {
        // The name input is flex-shrink:1, so its live rendered width is
        // already compressed whenever space is tight — measuring that would
        // underestimate how much room this row actually wants. Use its
        // comfortable target width instead.
        if (c.classList.contains('dc-toolbar-name-input')) return total + 200
        return total + c.getBoundingClientRect().width
      }, 0)
      return sum + Math.max(0, visible.length - 1) * 8
    }
    const check = () => {
      const available = outer.clientWidth
      const topNatural = naturalWidth(top)
      const actionsNatural = naturalWidth(actions)
      setToolbarStacked(topNatural + actionsNatural + 8 > available)
      setToolbarCompact(available < 900)
    }
    check()
    const ro = new ResizeObserver(check)
    ro.observe(outer)
    return () => ro.disconnect()
    // Re-check on relevant content changes too, not just outer resizes —
    // the outer element's own width can stay the same while a row's natural
    // content width changes (e.g. the perf/timeline badges appearing).
  }, [momTimeline, perf, reportMode, toolbarCompact])

  // Add widget form
  const [selectedChart, setSelectedChart]       = useState(null)
  const [widgetTitle, setWidgetTitle]           = useState('')
  const [widgetDescription, setWidgetDescription] = useState('')
  const [widgetSize, setWidgetSize]             = useState('small')
  const [widgetHeight, setWidgetHeight]         = useState('small')

  const [zoom, setZoom]   = useState(1)
  const [past, setPast]   = useState([])
  const [future, setFuture] = useState([])
  const canUndo = past.length > 0
  const canRedo = future.length > 0

  const zoomIn    = () => setZoom(z => Math.min(1.5, Math.round((z + 0.25) * 100) / 100))
  const zoomOut   = () => setZoom(z => Math.max(0.5, Math.round((z - 0.25) * 100) / 100))
  const zoomReset = () => setZoom(1)

  // Every committed widget change goes through here, so it's undoable
  // regardless of whether it came from the manual panel or Copilot's builderApi.
  const commitWidgets = (updater) => {
    setPast(p => [...p, widgets])
    setFuture([])
    setWidgets(updater)
  }

  const undo = () => {
    if (!canUndo) return
    const previous = past[past.length - 1]
    setPast(p => p.slice(0, -1))
    setFuture(f => [widgets, ...f])
    setWidgets(previous)
  }

  const redo = () => {
    if (!canRedo) return
    const next = future[0]
    setFuture(f => f.slice(1))
    setPast(p => [...p, widgets])
    setWidgets(next)
  }

  // ── Grid layout + drag/resize interaction ──────────────────────────────
  // All of it is owned by react-grid-layout now: collision-aware vertical
  // compaction, drag-to-reorder, resize handles, and the live reflow preview
  // are its job, not ours. `layoutWidgets` only fills in gx/gy/gw/gh for any
  // widget that doesn't have a real position yet (new, or pre-dating this
  // model) — see packWidgets. Once RGL reports a drag/resize result via
  // onDragStop/onResizeStop, that becomes each widget's real, persisted
  // position, and packWidgets leaves it alone on every subsequent render.
  const layoutWidgets = useMemo(() => packWidgets(widgets), [widgets])

  // A callback ref, not a plain useRef — the wrapper this measures only
  // mounts once widgets.length > 0 or the add-panel is open (DashboardCreateHero
  // renders in its place before that), so a mount-time effect reading
  // gridWrapRef.current would find it null and, with an empty dep array,
  // never get another chance to attach the observer once the div actually
  // appears. A callback ref fires exactly when the node attaches, whenever
  // that happens across the component's lifetime.
  const [gridEl, setGridEl] = useState(null)
  const gridWrapRef = useCallback(node => setGridEl(node), [])
  const [gridWidth, setGridWidth] = useState(0)
  const [interacting, setInteracting] = useState(false) // true while dragging or resizing — drives the approximate grid-line overlay
  useEffect(() => {
    if (!gridEl) return
    const ro = new ResizeObserver(([entry]) => setGridWidth(entry.contentRect.width))
    ro.observe(gridEl)
    return () => ro.disconnect()
  }, [gridEl])

  // The Add Widget tile is a real (static — undraggable/unresizable) grid
  // item too, sized to match whatever it's currently showing (the button's
  // fixed footprint, or the live preview's actual selected size while the
  // panel is open) and placed via the same first-free-gap search packWidgets
  // uses for real widgets — so it fills whichever gap is actually free
  // instead of always starting a new row below everything.
  const addGw = panelMode === 'add'
    ? clamp((WIDGET_SIZES.find(s => s.id === widgetSize)?.span || 1) * 3, MIN_GW, MAX_GW)
    : 3
  const addGh = panelMode === 'add'
    ? clamp(Math.ceil((WIDGET_HEIGHTS.find(s => s.id === widgetHeight)?.px || 260) / ROW_UNIT_PX), MIN_GH, MAX_GH)
    : 13
  const addSlot = useMemo(
    () => packWidgets([...widgets, { id: '__add__', gw: addGw, gh: addGh }]).find(w => w.id === '__add__'),
    [widgets, addGw, addGh]
  )

  // The settings panel's live size/height dropdowns preview a resize before
  // Apply commits it — fed in here (not just into WidgetCard's own display)
  // so RGL actually reflows neighbors live to match, a true preview of what
  // Apply will produce rather than a size change that visually overlaps them
  // until confirmed.
  const rglLayout = useMemo(
    () => {
      const real = layoutWidgets.map(w => {
        let gw = w.gw, gh = w.gh
        if (panelMode === 'settings' && w.id === settingsWidgetId && (liveSizeId || liveHeightId)) {
          if (liveSizeId) {
            const span = ALL_WIDGET_SIZES.find(s => s.id === liveSizeId)?.span || w.span
            gw = clamp((span || 1) * 3, MIN_GW, MAX_GW)
          }
          if (liveHeightId) {
            const px = ALL_WIDGET_HEIGHTS.find(s => s.id === liveHeightId)?.px
            if (px) gh = clamp(Math.ceil(px / ROW_UNIT_PX), MIN_GH, MAX_GH)
          }
        }
        return { i: String(w.id), x: w.gx, y: w.gy, w: gw, h: gh, minW: MIN_GW, minH: MIN_GH, maxW: MAX_GW, maxH: MAX_GH }
      })
      return [...real, { i: '__add__', x: addSlot.gx, y: addSlot.gy, w: addSlot.gw, h: addSlot.gh, static: true }]
    },
    [layoutWidgets, panelMode, settingsWidgetId, liveSizeId, liveHeightId, addSlot]
  )

  // Fired once per completed drag/resize gesture (not per intermediate
  // frame) — RGL hands back the final, already-compacted layout, so this is
  // the single point where a gesture becomes one undoable commit.
  const commitRglLayout = (layout) => {
    commitWidgets(ws => ws.map(w => {
      const l = layout.find(item => item.i === String(w.id))
      return l ? { ...w, gx: l.x, gy: l.y, gw: l.w, gh: l.h } : w
    }))
  }

  // Widget mutators — the single path both the manual Add Widget panel and
  // Copilot's builderApi use, so both stay in sync against one `widgets` state.
  // Each call is its own undo step: for the manual panel, Save (create with
  // defaults) and Apply (configure) are genuinely two distinct, real states.
  const addWidget = ({ chartId, label, description = '', sizeId = 'small', heightId = 'small' }) => {
    const size = WIDGET_SIZES.find(s => s.id === sizeId) || WIDGET_SIZES[0]
    const newId = (widgets.length > 0 ? Math.max(...widgets.map(w => w.id)) : 0) + 1
    commitWidgets(w => [...w, {
      id: newId,
      label: label || CHART_DEFAULT_NAMES[chartId] || CHART_TYPES.find(c => c.id === chartId)?.label,
      description,
      chartId, span: size.span, sizeId, heightId,
      phase: 'active',
    }])
    return newId
  }

  const configureWidget = (id, changes) => {
    const allSizes = [...WIDGET_SIZES, ...KPI_WIDGET_SIZES, ...HEADING_WIDGET_SIZES]
    const size = allSizes.find(s => s.id === changes.sizeId) || WIDGET_SIZES[0]
    commitWidgets(ws => ws.map(w => w.id === id
      ? { ...w, ...changes, span: size.span, phase: 'active' }
      : w
    ))
  }

  const removeWidget = (id) => { commitWidgets(ws => ws.filter(w => w.id !== id)) }

  const getSnapshot = () => ({
    widgetCount: widgets.length,
    widgets: widgets.map(w => ({ id: w.id, label: w.label, chartId: w.chartId, phase: w.phase, sizeId: w.sizeId, heightId: w.heightId })),
  })

  useImperativeHandle(ref, () => ({ addWidget, configureWidget, removeWidget, getSnapshot }))

  if (!timelineConfirmed) {
    return (
      <div className="dc-root" style={{ '--dc-bg-app': PAI.bgApp, '--dc-indigo': PAI.indigo, '--dc-indigo-tint': PAI.indigoTint, '--dc-fg1': PAI.fg1, '--dc-fg3': PAI.fg3 }}>
        <MomSkeleton />
        <MomTimelineModal
          defaultName={name}
          onConfirm={({ name: n, startMonth, startYear, endMonth, endYear }) => {
            setName(n)
            setMomTimeline(`${MONTHS_LONG[startMonth]} ${startYear} – ${MONTHS_LONG[endMonth]} ${endYear}`)
            setTimelineConfirmed(true)
          }}
          onCancel={() => onNav(backTarget)}
        />
      </div>
    )
  }

  const openAdd = () => {
    setSelectedChart(null); setWidgetTitle(''); setWidgetDescription(''); setWidgetSize('small'); setWidgetHeight('small')
    setPanelMode('add')
  }

  const handleAddSave = () => {
    if (!selectedChart) return
    const newId = addWidget({ chartId: selectedChart, label: widgetTitle, description: widgetDescription, sizeId: widgetSize, heightId: widgetHeight })
    setSettingsWidgetId(newId)
    setPanelMode('settings')
    setLiveSizeId(null); setLiveHeightId(null)
  }

  const handleAddCancel = () => { setPanelMode(null) }

  const handleSettingsSave = (newId, changes) => {
    configureWidget(newId, changes)
    setPanelMode(null)
    setSettingsWidgetId(null)
    setLiveSizeId(null); setLiveHeightId(null)
  }

  const handleSettingsClose = (widgetId) => {
    // if widget was never activated, remove it
    setWidgets(ws => ws.filter(w => !(w.id === widgetId && w.phase === 'settings')))
    setPanelMode(null)
    setSettingsWidgetId(null)
    setLiveSizeId(null); setLiveHeightId(null)
  }

  const openSettings = (id) => { setSettingsWidgetId(id); setPanelMode('settings'); setLiveSizeId(null); setLiveHeightId(null) }
  const deleteWidget = (id) => { removeWidget(id); if (settingsWidgetId === id) setPanelMode(null) }

  const DISCOVER_CARD_IDS = { total: 1001, crit: 1002, source: 1003, type: 1004, insights: 1005, assets: 1006 }
  const handleDiscoverEdit = (cardKey) => {
    const id = DISCOVER_CARD_IDS[cardKey]
    if (id) { setSettingsWidgetId(id); setPanelMode('settings'); setLiveSizeId(null); setLiveHeightId(null) }
  }

  const settingsWidget = widgets.find(w => w.id === settingsWidgetId)

  const formatNextReport = () => {
    if (!scheduleStartDate) return null
    const d = new Date(`${scheduleStartDate}T${scheduleStartTime || '00:00'}`)
    if (isNaN(d.getTime())) return null
    const weekday = d.toLocaleDateString(undefined, { weekday: 'long' })
    const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' })
    const timeStr = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    return `${weekday}, ${dateStr}, ${timeStr}`
  }

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
          <div className={`dc-toolbar${toolbarStacked ? ' dc-toolbar--stacked' : ''}`} ref={toolbarOuterRef}>
            <div className="dc-toolbar-row dc-toolbar-row--top" ref={toolbarTopRowRef}>
              <button
                onClick={handleBackClick}
                className="dc-toolbar-back-btn"
              >
                <Ic size={13} path={<polyline points="15 18 9 12 15 6"/>} />
              </button>

              <input
                value={name} onChange={e => { setName(e.target.value); onNameChange?.(e.target.value) }}
                placeholder={reportMode ? 'Enter report name here...' : 'Enter dashboard name here...'}
                className="dc-toolbar-name-input"
              />

              {!reportMode && (
                <button
                  type="button"
                  className="dc-scope-badge"
                  title="Dashboard Scope"
                  onClick={() => { setScopeMandatory(false); setScopeModalOpen(true) }}
                >
                  <span className="dc-btn-label">{dashboardScope ? dashboardScope.label : 'Dashboard Scope'}</span>
                  <span className="dc-scope-icon">
                    {dashboardScope
                      ? <img src={`/assets/icons/${dashboardScope.file}`} width={16} height={16} alt="" className="dc-scope-icon-img" />
                      : <img src="assets/icons/lcnc/graph-filter.svg" width={20} height={20} alt="" className="dc-scope-icon-img" />}
                  </span>
                </button>
              )}

              {momTimeline && (
                <span className="dc-toolbar-timeline"><span className="dc-toolbar-timeline__label">Timeline:</span> {momTimeline}</span>
              )}

              {perf && !reportMode && (
                <span className="dc-tip dc-tip--wrap" data-tip={PERF_TOOLTIP}>
                  <span
                    className="dc-perf-badge"
                    style={{ '--dc-perf-bg': perf.bg, '--dc-perf-color': perf.color, '--dc-perf-dot': perf.dot }}
                  >
                    <span className="dc-perf-dot" />
                    {perf.label}
                  </span>
                </span>
              )}
            </div>

            <div className={`dc-toolbar-row dc-toolbar-row--actions${toolbarCompact ? ' dc-toolbar-row--compact' : ''}`} ref={toolbarActionsRowRef}>
              {!reportMode && (
                <button className="ds-btn sz-md t-outline" title="Share" onClick={() => setShareOpen(true)}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                  </svg>
                  <span className="dc-btn-label">Share</span>
                </button>
              )}

              {!reportMode && (
                <button className="ds-btn sz-md t-outline" title="Schedule Assistant" onClick={() => setScheduleOpen(true)}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/>
                  </svg>
                  <span className="dc-btn-label">Schedule Assistant</span>
                </button>
              )}

              {!reportMode && (
                <button className="ds-btn sz-md t-outline" title="Download" onClick={() => setDownloadOpen(true)}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  <span className="dc-btn-label">Download</span>
                </button>
              )}

              {!reportMode && (
                <div ref={moreMenuRef} className="comp-sort-wrap">
                  <button className="ds-icon-btn" title="More actions" onClick={() => setMoreMenuOpen(o => !o)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/>
                    </svg>
                  </button>
                  {moreMenuOpen && (
                    <div className="comp-dl-menu comp-dl-menu--wide">
                      <button className="comp-dl-item" onClick={() => setMoreMenuOpen(false)}>Convert to Report</button>
                      <button className="comp-dl-item" onClick={() => { setMoreMenuOpen(false); setDeleteDashboardConfirm(true) }}>Delete</button>
                    </div>
                  )}
                </div>
              )}

              <div className="dc-toolbar-spacer" />

              {!reportMode && (
                <button className="ds-btn sz-md t-outline" onClick={() => openSaveModal('save-as')}>Save As</button>
              )}

              <button
                className="ds-btn sz-md t-primary"
                onClick={() => {
                  if (!reportMode) { openSaveModal('save'); return }
                  const previewSlug = templateId === 'vulnerabilities' ? 'vulnerabilities'
                    : templateId === 'month-over-month' ? 'month-over-month'
                    : 'executive-summary'
                  onNav(`workspace/report-preview/${previewSlug}`)
                }}
              >{reportMode ? 'Preview' : 'Save'}</button>
            </div>
          </div>

          {/* Canvas body */}
          <div className={`dc-canvas-body${templateId === 'discover' ? ' dc-canvas-body--plain' : ''}${reportMode ? ' dc-canvas-body--report' : ''}`}>
            {templateId === 'discover' ? (
              <DiscoverDevicePage
                dashboardMode
                typeColors={widgets.find(w => w.id === 1004)?.chartColors}
                kpiCardHeight={(() => {
                  const kw = widgets.find(w => w.id === 1001)
                  return kw ? ([...WIDGET_HEIGHTS, ...KPI_WIDGET_HEIGHTS, ...HEADING_WIDGET_HEIGHTS].find(s => s.id === kw.heightId)?.px || 360) : 360
                })()}
                onEditWidget={handleDiscoverEdit}
                onAddWidget={openAdd}
              />
            ) : reportMode ? (
              // ── Report layout: KPI rows grouped, charts full-width ──
              (() => {
                const rows = []
                let kpiBuf = []
                for (const w of widgets) {
                  if (w.chartId === 'kpi') {
                    if (w.rowBreak && kpiBuf.length) { rows.push({ type: 'kpi', widgets: kpiBuf }); kpiBuf = [] }
                    kpiBuf.push(w)
                  } else {
                    if (kpiBuf.length) { rows.push({ type: 'kpi', widgets: kpiBuf }); kpiBuf = [] }
                    rows.push({ type: 'chart', widget: w })
                  }
                }
                if (kpiBuf.length) rows.push({ type: 'kpi', widgets: kpiBuf })
                return (
                  <div className="dc-report-layout" style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}>
                    {rows.map((row, i) =>
                      row.type === 'kpi' ? (
                        <div key={i} className="dc-report-kpi-row">
                          {row.widgets.map(w => (
                            <div key={w.id} className="dc-report-kpi-item">
                              <WidgetCard widget={w} isEditing={false} onEdit={() => openSettings(w.id)} onRequestDelete={() => {}} reportMode />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div key={row.widget.id} className={`dc-report-chart-row${row.widget.chartId === 'table' ? ' dc-report-chart-row--table' : ''}`}>
                          <WidgetCard widget={row.widget} isEditing={false} onEdit={() => openSettings(row.widget.id)} onRequestDelete={() => {}} reportMode />
                        </div>
                      )
                    )}
                  </div>
                )
              })()
            ) : (widgets.length === 0 && panelMode !== 'add') ? (
              <DashboardCreateHero
                onSubmit={text => onOpenCopilotBuilder?.({ initialPrompt: text })}
                onCreateManually={openAdd}
              />
            ) : (
              <div
                className="dc-grid"
                ref={gridWrapRef}
                style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
              >
                {gridWidth > 0 && (
                  <GridLayout
                    className={`dc-grid-inner${interacting ? ' dc-grid-inner--interacting' : ''}`}
                    layout={rglLayout}
                    cols={GRID_COLS}
                    rowHeight={ROW_UNIT_PX}
                    margin={[GRID_GAP_PX, GRID_GAP_PX]}
                    containerPadding={[GRID_PAD_PX, GRID_PAD_PX]}
                    width={gridWidth}
                    draggableHandle=".dc-action-btn--grab, .dc-widget-card-header"
                    resizeHandles={['se']}
                    transformScale={zoom}
                    useCSSTransforms
                    compactType="vertical"
                    onDragStart={() => setInteracting(true)}
                    onDragStop={layout => { setInteracting(false); commitRglLayout(layout) }}
                    onResizeStart={() => setInteracting(true)}
                    onResizeStop={layout => { setInteracting(false); commitRglLayout(layout) }}
                  >
                    {layoutWidgets.map(w => {
                      const isBeingEdited = panelMode === 'settings' && w.id === settingsWidgetId
                      const renderWidget = isBeingEdited && (liveSizeId || liveHeightId)
                        ? {
                            ...w,
                            sizeId: liveSizeId || w.sizeId,
                            heightId: liveHeightId || w.heightId,
                            span: ALL_WIDGET_SIZES.find(s => s.id === (liveSizeId || w.sizeId))?.span || w.span,
                          }
                        : w
                      return (
                        <div key={String(w.id)}>
                          <WidgetCard
                            widget={renderWidget}
                            isEditing={isBeingEdited}
                            onEdit={() => openSettings(w.id)}
                            onRequestDelete={w => setDeletePending(w)}
                            onEditWithCopilot={w => onOpenCopilotBuilder?.({ widgetId: w.id, widgetLabel: w.label })}
                            reportMode={false}
                          />
                        </div>
                      )
                    })}

                    {/* Add Widget tile / live preview — a real (static) grid
                        item placed by packWidgets like any other widget, so
                        it lands in whatever gap is actually free instead of
                        always starting a new row below everything. */}
                    <div key="__add__">
                      {panelMode === 'add' ? (
                        <div className="dc-preview-col">
                          <div className="dc-widget-actions">
                            <button title="Move" className="dc-action-btn dc-action-btn--grab">
                              <img src="assets/icons/lcnc/drag-widget.svg" width={16} height={16} alt="drag" />
                            </button>
                            <button title="Add nested widget" className="dc-action-btn">
                              <img src="assets/icons/lcnc/add-widget.svg" width={16} height={16} alt="add widget" />
                            </button>
                            <button title="Edit" className="dc-action-btn">
                              <img src="assets/icons/lcnc/dasboard-edit.svg" width={16} height={16} alt="edit" />
                            </button>
                            <button title="Delete" className="dc-action-btn dc-action-btn--delete">
                              <img src="assets/icons/lcnc/delete.svg" width={16} height={16} alt="delete" />
                            </button>
                          </div>
                          <div className="dc-preview-card">
                            <div className="dc-preview-header">
                              <span className="dc-preview-title">
                                {widgetTitle || (selectedChart ? (CHART_DEFAULT_NAMES[selectedChart] || CHART_TYPES.find(c => c.id === selectedChart)?.label) : '')}
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
                        <div className="dc-add-widget-tile">
                          <button onClick={openAdd} className="dc-add-widget-main">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                            <span className="dc-add-widget-btn-label">Add Widget</span>
                          </button>
                          {onOpenCopilotBuilder && (
                            <button
                              type="button"
                              title="Build with AI"
                              onClick={() => onOpenCopilotBuilder({})}
                              className="dc-add-widget-ai"
                            >
                              <img src="assets/icons/Navigator icon.svg" width={14} height={14} alt="" />
                              <span>Ask AI</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </GridLayout>
                )}
              </div>
            )}
          </div>

          {templateId !== 'discover' && (
            <DashboardFloatingToolbar
              canUndo={canUndo}
              canRedo={canRedo}
              onUndo={undo}
              onRedo={redo}
              zoom={zoom}
              onZoomIn={zoomIn}
              onZoomOut={zoomOut}
              onZoomReset={zoomReset}
              onReset={reportMode ? undefined : () => { setWidgets([]); setName(''); setPanelMode(null) }}
            />
          )}
        </div>

        {/* ── Right Panel (custom dashboards only, not report mode) ── */}
        {panelMode === 'add' && !reportMode && (
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
            onLiveChange={({ sizeId, heightId }) => { setLiveSizeId(sizeId); setLiveHeightId(heightId) }}
          />
        )}
      </div>
    </div>

    {scopeModalOpen && (
      <DashboardScopeModal
        mandatory={scopeMandatory}
        onClose={() => setScopeModalOpen(false)}
        onBack={() => onNav(backTarget)}
        onSelect={(entity) => { setDashboardScope(entity); setScopeModalOpen(false); setScopeMandatory(false) }}
      />
    )}

    {deletePending && (
      <div className="afp-modal-overlay" onClick={() => setDeletePending(null)}>
        <div className="afp-modal" onClick={e => e.stopPropagation()}>
          <p className="afp-modal-title danger">Delete widget</p>
          <p className="afp-modal-body">
            Delete <strong>"{deletePending.label}"</strong>? Can't be undone.
          </p>
          <div className="afp-modal-actions">
            <button className="afp-modal-cancel" onClick={() => setDeletePending(null)}>Cancel</button>
            <button className="afp-modal-confirm" onClick={() => { deleteWidget(deletePending.id); setDeletePending(null); }}>Delete widget</button>
          </div>
        </div>
      </div>
    )}

    {deleteDashboardConfirm && (
      <div className="ds-modal-overlay">
        <div className="ds-modal">
          <div className="ds-modal-header">
            <span className="ds-modal-title danger">Delete dashboard</span>
            <button className="ds-modal-close" onClick={() => setDeleteDashboardConfirm(false)}>✕</button>
          </div>
          <div className="ds-modal-body">
            <span>Delete <strong>"{name || 'Untitled Dashboard'}"</strong>? Its widgets will be permanently removed too.</span>
          </div>
          <div className="ds-modal-footer">
            <button className="ds-btn sz-md t-outline" onClick={() => setDeleteDashboardConfirm(false)}>Cancel</button>
            <button className="ds-btn sz-md t-danger" onClick={() => { setDeleteDashboardConfirm(false); onNav(backTarget) }}>Delete dashboard</button>
          </div>
        </div>
      </div>
    )}

    {saveModalOpen && (
      <div className="ds-modal-overlay">
        <div className="ds-modal">
          <div className="ds-modal-header">
            <span className="ds-modal-title">{saveModalMode === 'save-as' ? 'Save Dashboard As' : 'Save Dashboard'}</span>
            <button className="ds-modal-close" onClick={() => setSaveModalOpen(false)}>✕</button>
          </div>
          <div className="ds-modal-body">
            <FieldRow label="Dashboard Name">
              <TextInput placeholder="Enter dashboard name..." value={saveNameDraft} onChange={e => setSaveNameDraft(e.target.value)} />
            </FieldRow>
          </div>
          <div className="ds-modal-footer">
            <button className="ds-btn sz-md t-outline" onClick={() => setSaveModalOpen(false)}>Cancel</button>
            <button
              className="ds-btn sz-md t-primary"
              disabled={!saveNameDraft.trim()}
              onClick={() => handleDashboardSaved(saveNameDraft.trim())}
            >Save</button>
          </div>
        </div>
      </div>
    )}

    {leaveConfirmOpen && (
      <div className="ds-modal-overlay">
        <div className="ds-modal">
          <div className="ds-modal-header">
            <span className="ds-modal-title warning">Discard unsaved changes?</span>
            <button className="ds-modal-close" onClick={() => setLeaveConfirmOpen(false)}>✕</button>
          </div>
          <div className="ds-modal-body">
            <span><strong>"{name || 'this dashboard'}"</strong> has changes that haven't been saved. If you leave now, they'll be lost.</span>
          </div>
          <div className="ds-modal-footer">
            <button className="ds-btn sz-md t-outline" onClick={() => setLeaveConfirmOpen(false)}>Cancel</button>
            <button className="ds-btn sz-md t-danger" onClick={() => { setLeaveConfirmOpen(false); onNav(backTarget) }}>Discard & Leave</button>
          </div>
        </div>
      </div>
    )}

    {stopScheduleOpen && (
      <div className="ds-modal-overlay">
        <div className="ds-modal" style={{ maxWidth: 600 }}>
          <div className="ds-modal-header">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--pai-med-fg)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="9" y1="15" x2="15" y2="19"/><line x1="15" y1="15" x2="9" y2="19"/>
            </svg>
            <span className="ds-modal-title warning">Stop Report Schedule</span>
            <button className="ds-modal-close" onClick={() => setStopScheduleOpen(false)}>✕</button>
          </div>
          <div className="ds-modal-body">
            <span>Stop automatic generation for <strong>"{name || 'this dashboard'}"</strong>? The report stays saved but won't regenerate.</span>
          </div>
          <div className="ds-modal-footer">
            <button className="ds-btn sz-md t-outline" onClick={() => setStopScheduleOpen(false)}>Cancel</button>
            <button className="ds-btn sz-md t-primary" onClick={() => { setScheduleActive(false); setStopScheduleOpen(false) }}>Stop Schedule</button>
          </div>
        </div>
      </div>
    )}

    {downloadOpen && (
      <div className="ds-modal-overlay" onClick={() => setDownloadOpen(false)}>
        <div className="ds-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 563 }}>
          <div className="ds-modal-header">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>
            </svg>
            <span className="ds-modal-title">Download as Excel</span>
            <button className="ds-modal-close" onClick={() => setDownloadOpen(false)}>✕</button>
          </div>
          <div className="ds-modal-body">
            <div className="dc-modal-body-stack">
              <div>Select the tables you'd like to export as Excel files</div>
              {DOWNLOAD_TABLE_OPTIONS.map(t => (
                <div className="dc-modal-checkbox-row" key={t.id}>
                  <input
                    type="checkbox"
                    className="dc-gf-checkbox"
                    id={`download-${t.id}`}
                    checked={!!downloadTables[t.id]}
                    onChange={e => setDownloadTables(prev => ({ ...prev, [t.id]: e.target.checked }))}
                  />
                  <label htmlFor={`download-${t.id}`}>{t.label}</label>
                </div>
              ))}
              <div className="dc-modal-note">
                <strong>Note:</strong>
                Charts and other visualizations are not available for export.<br />
                Each table will be downloaded as a separate Excel file.
              </div>
            </div>
          </div>
          <div className="ds-modal-footer">
            <button className="ds-btn sz-md t-outline" onClick={() => setDownloadOpen(false)}>Cancel</button>
            <button
              className="ds-btn sz-md t-primary"
              disabled={!Object.values(downloadTables).some(Boolean)}
              style={{ '--dc-aw-save-opacity': Object.values(downloadTables).some(Boolean) ? 1 : 0.4 }}
              onClick={() => setDownloadOpen(false)}
            >Download</button>
          </div>
        </div>
      </div>
    )}

    {shareOpen && (
      <div className="ds-modal-overlay" onClick={() => setShareOpen(false)}>
        <div className="ds-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
          <div className="ds-modal-header">
            <span className="ds-modal-title">Share Report</span>
            <button className="ds-modal-close" onClick={() => setShareOpen(false)}>✕</button>
          </div>
          <div className="ds-modal-body">
            <div className="dc-modal-body-stack">
              <div className="dc-modal-field">
                <div className="dc-field-label">Recipients</div>
                <div className="dc-modal-to-field">
                  <span className="dc-modal-to-field-prefix">To:</span>
                  <input
                    value={shareRecipients}
                    onChange={e => setShareRecipients(e.target.value)}
                    onKeyDown={e => {
                      if (e.key !== 'Enter' || !shareRecipients.trim()) return
                      e.preventDefault()
                      setShareRecipientList(prev => [...prev, { id: `${Date.now()}-${prev.length}`, name: shareRecipients.trim(), access: shareAccessDraft }])
                      setShareRecipients('')
                    }}
                    placeholder="Name, group or email"
                  />
                </div>
                <div className="dc-share-add-row">
                  <select
                    className="dc-share-access-select"
                    value={shareAccessDraft}
                    onChange={e => setShareAccessDraft(e.target.value)}
                  >
                    <option value="view">Can view</option>
                    <option value="edit">Can edit</option>
                  </select>
                  <button
                    type="button"
                    className="ds-btn sz-sm t-outline"
                    disabled={!shareRecipients.trim()}
                    onClick={() => {
                      setShareRecipientList(prev => [...prev, { id: `${Date.now()}-${prev.length}`, name: shareRecipients.trim(), access: shareAccessDraft }])
                      setShareRecipients('')
                    }}
                  >Add recipient</button>
                </div>
                {shareRecipientList.length > 0 && (
                  <div className="dc-chips">
                    {shareRecipientList.map(r => (
                      <span key={r.id} className="dc-chip">
                        {r.name}
                        <select
                          className="dc-chip-access-select"
                          value={r.access}
                          onChange={e => setShareRecipientList(prev => prev.map(x => x.id === r.id ? { ...x, access: e.target.value } : x))}
                        >
                          <option value="view">Can view</option>
                          <option value="edit">Can edit</option>
                        </select>
                        <button
                          className="dc-chip-x"
                          onClick={() => setShareRecipientList(prev => prev.filter(x => x.id !== r.id))}
                        >×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="dc-modal-field">
                <div className="dc-field-label">Message</div>
                <TextArea
                  rows={6}
                  value={shareMessage || `Hi,\n\nI'm sharing "${name || 'this dashboard'}" with you. Please find the report attached/linked below.\n\nBest regards`}
                  onChange={e => setShareMessage(e.target.value)}
                />
              </div>
              <div className="dc-modal-checkbox-row">
                <input type="checkbox" checked={shareSendCopy} onChange={e => setShareSendCopy(e.target.checked)} className="dc-gf-checkbox" id="share-send-copy" />
                <label htmlFor="share-send-copy">Send me a copy</label>
              </div>
              <div className="dc-modal-note">Report will be shared via link and attachment in email.</div>
            </div>
          </div>
          <div className="ds-modal-footer">
            <div className="dc-modal-footer-split">
              <button className="ds-btn sz-md t-outline" onClick={() => navigator.clipboard?.writeText(window.location.href)}>
                Copy link
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
              </button>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="ds-btn sz-md t-outline" onClick={() => setShareOpen(false)}>Cancel</button>
                <button className="ds-btn sz-md t-primary" onClick={() => setShareOpen(false)}>Share</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}

    {scheduleOpen && (
      <div className="ds-modal-overlay" onClick={() => setScheduleOpen(false)}>
        <div className="ds-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 563 }}>
          <div className="ds-modal-header">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="14" x2="12" y2="18"/><line x1="10" y1="16" x2="14" y2="16"/>
            </svg>
            <span className="ds-modal-title">Schedule Report</span>
            <button className="ds-modal-close" onClick={() => setScheduleOpen(false)}>✕</button>
          </div>
          <div className="ds-modal-body">
            <div className="dc-modal-body-stack">
              {scheduleActive && (
                <div className="dc-modal-schedule-status">
                  <span>A schedule is currently active for this dashboard.</span>
                  <button
                    className="ds-btn sz-md t-outline"
                    onClick={() => { setScheduleOpen(false); setStopScheduleOpen(true) }}
                  >Stop Schedule</button>
                </div>
              )}
              <div className="dc-modal-field">
                <div className="dc-field-label">Recipients</div>
                <div className="dc-modal-to-field">
                  <span className="dc-modal-to-field-prefix">To:</span>
                  <input value={scheduleRecipients} onChange={e => setScheduleRecipients(e.target.value)} placeholder="a@mail.com, b@mail.com" />
                </div>
              </div>

              <div className="dc-modal-checkbox-row">
                <input type="checkbox" checked={scheduleSendCopy} onChange={e => setScheduleSendCopy(e.target.checked)} className="dc-gf-checkbox" id="schedule-send-copy" />
                <label htmlFor="schedule-send-copy">Send me a copy</label>
              </div>

              <div className="dc-modal-section-head">
                <span className="dc-modal-section-head-label">Set Date and Time</span>
                <div className="dc-modal-section-head-line" />
              </div>

              <div className="dc-modal-radio-row">
                <input type="radio" name="scheduleMode" id="schedule-mode-daily" checked={scheduleMode === 'daily'} onChange={() => setScheduleMode('daily')} />
                <label htmlFor="schedule-mode-daily">Send an email after each day's run to receive the latest report.</label>
              </div>
              <div className="dc-modal-radio-row">
                <input type="radio" name="scheduleMode" id="schedule-mode-specific" checked={scheduleMode === 'specific'} onChange={() => setScheduleMode('specific')} />
                <label htmlFor="schedule-mode-specific">Schedule the report for a specific time. It will include data from the latest available run.</label>
              </div>

              <div className="dc-modal-field-row">
                <div className="dc-modal-field">
                  <div className="dc-field-label">Start Date</div>
                  <input type="date" className="dc-modal-input" value={scheduleStartDate} onChange={e => setScheduleStartDate(e.target.value)} />
                </div>
                <div className="dc-modal-field">
                  <div className="dc-field-label">Time</div>
                  <input type="time" className="dc-modal-input" value={scheduleStartTime} onChange={e => setScheduleStartTime(e.target.value)} />
                </div>
              </div>

              <div className="dc-modal-section-head">
                <span className="dc-modal-section-head-label">Set frequency</span>
                <div className="dc-modal-section-head-line" />
              </div>

              <div className="dc-modal-field">
                <div className="dc-field-label">Repeat every</div>
                <div className="dc-modal-field-row">
                  <input
                    type="number" min={1} className="dc-modal-input" style={{ maxWidth: 98 }}
                    value={scheduleRepeatEvery}
                    onChange={e => setScheduleRepeatEvery(Math.max(1, Number(e.target.value) || 1))}
                  />
                  <select className="dc-modal-select" value={scheduleRepeatUnit} onChange={e => setScheduleRepeatUnit(e.target.value)}>
                    <option value="day">Day(s)</option>
                    <option value="week">Week(s)</option>
                    <option value="month">Month(s)</option>
                  </select>
                </div>
              </div>

              <div className="dc-modal-field">
                <div className="dc-field-label">Repeat until</div>
                <input type="date" className="dc-modal-input" value={scheduleRepeatUntil} onChange={e => setScheduleRepeatUntil(e.target.value)} />
              </div>

              {formatNextReport() && (
                <div className="dc-modal-note">Next report will be on <strong style={{ display: 'inline', marginBottom: 0 }}>{formatNextReport()}</strong></div>
              )}
              <div className="dc-modal-note">* Please note that all time details shown are in Coordinated Universal Time (UTC).</div>
            </div>
          </div>
          <div className="ds-modal-footer">
            <button className="ds-btn sz-md t-outline" onClick={() => setScheduleOpen(false)}>Cancel</button>
            <button
              className="ds-btn sz-md t-primary"
              disabled={!scheduleRecipients.trim() || !scheduleStartDate}
              style={{ '--dc-aw-save-opacity': (scheduleRecipients.trim() && scheduleStartDate) ? 1 : 0.4 }}
              onClick={() => { setScheduleActive(true); setScheduleOpen(false) }}
            >Schedule</button>
          </div>
        </div>
      </div>
    )}
    </>
  )
})

export default DashboardCanvas
