import React, { useState, useRef, useEffect, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react'
import { flushSync, createPortal } from 'react-dom'
import { PAI, Ic } from '../ui.jsx'
import { ChartRender, DEFAULT_VERT_BAR, STACK_ORIGINS } from '../components/ChartRender.jsx'
import { EXPLORE_GROUPS } from '../components/SubHeader.jsx'
import { DSPillSearch, useWorkspace } from '../context/WorkspaceCtx.jsx'
import { GF_ENTITIES, getEntityAttrs } from '../components/FilterPanel.jsx'
import SegmentedTabs from '../components/SegmentedTabs.jsx'
import { SelectDropdown } from './CompliancePage.jsx'
import { SAVED_ROWS } from './SavedPage.jsx'
import { INSIGHTS_MODEL } from '../components/LeftNav.jsx'
import DiscoverDevicePage from './DiscoverDevicePage.jsx'
import GridLayout from 'react-grid-layout/legacy'
import 'react-grid-layout/css/styles.css'
import { useToast } from '../context/ToastCtx.jsx'
import { useDownloads } from '../DownloadsContext.jsx'
import '../styles/dashboard.css'
import '../styles/compliance.css'
import '../styles/active-filter-panel.css'

// ── Download menu file-type icons ──────────────────────────────────────
const IcFilePdf = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.4"/>
    <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.4" fill="none"/>
    <text x="12" y="17" textAnchor="middle" fontSize="5.5" fontWeight="700" fill="currentColor" fontFamily="Inter,sans-serif">PDF</text>
  </svg>
)
const IcFileExcel = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.4"/>
    <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.4" fill="none"/>
    <text x="12" y="17" textAnchor="middle" fontSize="5" fontWeight="700" fill="currentColor" fontFamily="Inter,sans-serif">XLS</text>
  </svg>
)

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
  { id: 'rpt-pie',   label: 'Report Pie',   px: 500 },
]
// Initials-only segmented pickers for the Add Widget panel's Width/Height
// rows, mirroring the KPI value-size control (see KPI_VALUE_SIZE_OPTIONS) —
// short label on the segment, full name via hover tooltip.
const WIDGET_HEIGHT_TAB_LABELS = { small: 'S', medium: 'M', large: 'L', xlarge: 'XL', 'rpt-chart': 'RC', 'rpt-pie': 'RP' }
const WIDGET_HEIGHT_TABS = WIDGET_HEIGHTS.map(h => ({ value: h.id, label: WIDGET_HEIGHT_TAB_LABELS[h.id] || h.label, tooltip: h.label }))
const WIDGET_SIZE_TAB_LABELS = { small: 'S', medium: 'M', large: 'L', xlarge: 'XL' }
const WIDGET_SIZE_TABS = WIDGET_SIZES.map(s => ({ value: s.id, label: WIDGET_SIZE_TAB_LABELS[s.id] || s.label, tooltip: s.label }))
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
// KPI heading auto-fills from the pre-selected Aggregate By attribute (see
// WidgetSettingsPanel's title init / sync effect) until the user types a
// custom title of their own.
const KPI_AGG_LABELS = { host: 'Host', 'entity-id': 'Entity ID', ip: 'IP Address' }
// Initials-only segmented picker for the KPI value size — full word shown via
// each segment's hover tooltip. "Auto" scales the value off the widget's own
// width/height instead of a fixed size (see ChartRender's kpi branch).
const KPI_VALUE_SIZE_OPTIONS = [
  { value: 'auto',   label: 'A',  tooltip: 'Auto' },
  { value: 'small',  label: 'S',  tooltip: 'Small' },
  { value: 'medium', label: 'M',  tooltip: 'Medium' },
  { value: 'large',  label: 'L',  tooltip: 'Large' },
  { value: 'xl',     label: 'XL', tooltip: 'Extra Large' },
]
// This builder has no live data pipeline behind Primary/Comparison Metric —
// Apply needs to stand up *some* representative value so a widget actually
// renders the KPI design (value + pill) instead of falling back to the
// generic "no data yet" chart silhouette. Never called for dataLocked
// widgets, which already carry real authored data.
const KPI_MOCK_BASE = { host: 54623, 'entity-id': 12894, ip: 8342 }
function buildKpiMockData(aggregateBy, showTotalCount) {
  const base = KPI_MOCK_BASE[aggregateBy] ?? 54623
  const prev = Math.round(base * 0.986)
  const value = base.toLocaleString()
  const prevValue = prev.toLocaleString()
  return {
    value,
    label: KPI_AGG_LABELS[aggregateBy] || aggregateBy,
    trend: '1.43%',
    trendUp: true,
    prevValue,
    ...(showTotalCount ? { totalValue: value, totalTrend: '1.43%', totalTrendUp: true, totalPrevValue: prevValue } : {}),
  }
}
// Same rationale as buildKpiMockData above — a freshly-added Aggregated
// Table has no live data pipeline behind Group By/Aggregate By, so this
// stands up representative grouped rows (keyed to match ChartRender's
// kgCellValue lowercase-no-space column lookup) for the default Business
// Unit × Host ID preset, rather than falling back to the generic
// Type/Display Label table until the user opens Settings and hits Apply.
function buildAggTableMockData() {
  return [
    { businessunit: 'Zone B Workstations',  totalhostid: 2101 },
    { businessunit: 'Zone B Omega Systems', totalhostid: 2136 },
    { businessunit: 'Zone A Workstations',  totalhostid: 6354 },
    { businessunit: 'Zone A Server',        totalhostid: 1967 },
    { businessunit: 'Zone A Protect',       totalhostid: 4219 },
    { businessunit: 'Zone C Workstations',  totalhostid: 3082 },
    { businessunit: 'Zone B Server',        totalhostid: 1544 },
    { businessunit: 'Zone C Server',        totalhostid: 987  },
    { businessunit: 'Zone A Omega Systems', totalhostid: 2765 },
    { businessunit: 'Zone C Protect',       totalhostid: 1320 },
    { businessunit: 'Zone B Protect',       totalhostid: 1791 },
    { businessunit: 'Zone C Omega Systems', totalhostid: 906  },
  ]
}
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
const MIN_GH = 13, MAX_GH = 28
// Fed to react-grid-layout as `margin`/`containerPadding` — keep in sync
// with any visual spacing changes so the two stay consistent.
const GRID_PAD_PX = 20
const GRID_GAP_PX = 12

// ── Widget sizing guideline ─────────────────────────────────────────
// Per-widget-type resize floor, in grid units (gw = columns, gh = rows of
// ROW_UNIT_PX each), pinned to the named size scale so every widget's
// draggable range always lines up with a real preset:
//   - KPI:            min XS × 2XS  (gw 3, gh 6)  — smallest KPI height preset (120px)
//   - Heading:        min XS × 3XS  (gw 3, gh 4)  — smallest Heading height preset (80px)
//   - everything else: min S × S    (gw 3, gh 13) — smallest generic height preset (260px)
// Every widget shares the same ceiling: max XL × XL (gw 12, gh 28), set via
// MAX_GW/MAX_GH below. A drag can land anywhere between floor and ceiling,
// not just on a preset — Widget Settings shows "Custom" for width/height
// whenever the live gw/gh doesn't match any named preset (see
// matchSizeId/matchHeightId).
const CHART_MIN_SIZE = {
  kpi:     { minGw: MIN_GW, minGh: 6 },
  heading: { minGw: MIN_GW, minGh: 4 },
}
function minSizeFor(chartId) {
  return CHART_MIN_SIZE[chartId] || { minGw: MIN_GW, minGh: MIN_GH }
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

function legacyGw(w) { return clamp((w.span || 1) * 3, minSizeFor(w.chartId).minGw, MAX_GW) }
function legacyGh(w) { return clamp(Math.ceil(widgetHeightPx(w) / ROW_UNIT_PX), minSizeFor(w.chartId).minGh, MAX_GH) }

// Reverse-lookup for the Widget Settings width/height dropdowns: a widget's
// real gw/gh (post free-form drag) may no longer land on any named preset,
// in which case these return null and the dropdown falls back to its
// "Custom" label instead of showing a stale/incorrect preset.
function matchSizeId(gw, options, minGw) {
  return options.find(o => clamp((o.span || 1) * 3, minGw, MAX_GW) === gw)?.id ?? null
}
function matchHeightId(gh, options, minGh) {
  return options.find(o => clamp(Math.ceil(o.px / ROW_UNIT_PX), minGh, MAX_GH) === gh)?.id ?? null
}

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

  const sized = widgets.map(w => {
    const { minGw, minGh } = minSizeFor(w.chartId)
    return {
      ...w,
      gw: clamp(w.gw ?? legacyGw(w), minGw, MAX_GW),
      gh: clamp(w.gh ?? legacyGh(w), minGh, MAX_GH),
    }
  })

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

// Gap (in grid row-units) reserved between a container's own content and
// its nested widgets, and between nested rows — matches the nested grid's
// own margin.
const NESTED_GAP_GH = Math.ceil(GRID_GAP_PX / ROW_UNIT_PX)

// A widget's own genuine content height, in grid row-units: the full
// heightId-derived preset for a type with real visual body content, but
// for a type whose ChartRender output is always an empty placeholder
// regardless of heightId ('heading'/'none') — that type's minimum floor
// while standalone (so it still has a sensible default height on the
// canvas), or 0 once it's hosting nested widgets, since reserving the
// floor there buys nothing but an empty box above the nested content.
function ownContentGh(widget) {
  if (widget.chartId === 'heading' || widget.chartId === 'none')
    return widget.children?.length ? 0 : minSizeFor(widget.chartId).minGh
  return legacyGh(widget)
}

// A container's total grid height: its own content height plus whatever
// its packed nested children currently need. Recomputed fresh from
// `children` every time they change rather than accumulated incrementally,
// so it self-corrects — including shrinking back down when nested widgets
// are rearranged more compactly, resized smaller, or removed.
function requiredContainerGh(widget) {
  if (!widget.children?.length) return widget.gh ?? legacyGh(widget)
  const packedChildren = packWidgets(widget.children)
  const nestedGh = Math.max(...packedChildren.map(c => c.gy + c.gh))
  const { minGh } = minSizeFor(widget.chartId)
  return clamp(ownContentGh(widget) + NESTED_GAP_GH + nestedGh, minGh, MAX_GH)
}
function withRequiredGh(widget) {
  return { ...widget, gh: requiredContainerGh(widget) }
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

const CHART_TYPES = [
  { id: 'heading',    label: 'Heading' },
  { id: 'kpi',        label: 'KPI Card' },
  { id: 'pie',        label: 'Pie Chart' },
  { id: 'line',       label: 'Line Chart' },
  { id: 'vert-bar',   label: 'Vertical Bar Chart' },
  { id: 'hor-bar',    label: 'Horizontal Bar Chart' },
  { id: 'stack-vert', label: 'Stacked Vertical Bar' },
  { id: 'stack-hor',  label: 'Stacked Horizontal Bar' },
  { id: 'table',      label: 'Table' },
  { id: 'agg-table',  label: 'Aggregated Table' },
]

const CHART_DEFAULT_NAMES = {
  'vert-bar':   'Type',
  'hor-bar':    'Type',
  'pie':        'Type',
  'table':      'Type',
  'agg-table':  'Business Unit',
  'stack-vert': 'Origin',
  'stack-hor':  'Origin',
  'line':       'Origin',
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
  'Entity ID':      ['ENT-10293', 'ENT-24871', 'ENT-38650', 'ENT-47215', 'ENT-58210', 'ENT-69940'],
  'Display Label':  ['Prod-Web-01', 'DB-Cluster-East', 'App-Gateway-02', 'Staging-API', 'Backup-Node-04', 'Analytics-Worker'],
  'Type':           ['Hypervisor', 'Mobile', 'Network Device', 'Other', 'Server', 'Workstation'],
  'Origin':         ['AWS', 'Azure', 'GCP', 'On-Prem', 'CrowdStrike', 'Qualys', 'ServiceNow', 'MS Intune'],
  'Origin (Count)': ['1', '2', '3-5', '6-10', '10+'],
  'Data Feed':      ['AWS Cloudtrail ConsoleLogin', 'MS Azure AD', 'CrowdStrike', 'Qualys', 'ServiceNow', 'MS Intune', 'MS Defender'],
  'First Found':    ['Last 7 Days', 'Last 30 Days', 'Last 90 Days', 'Last Year', 'Over a Year Ago'],
  'First Seen':     ['Last 7 Days', 'Last 30 Days', 'Last 90 Days', 'Last Year', 'Over a Year Ago'],
  'Last Found':     ['Today', 'Yesterday', 'This Week', 'This Month', 'Over 90 Days Ago'],
  'Last Active':    ['Today', 'Yesterday', 'This Week', 'This Month', 'Over 90 Days Ago'],
  'Activity Status':['Active', 'Inactive', 'Dormant', 'Decommissioned'],
  'Lifetime':       ['< 30 Days', '30-90 Days', '90-180 Days', '180-365 Days', '> 1 Year'],
  'Recent Activity':['High', 'Medium', 'Low', 'None'],
  'Completeness Quality Score': ['Excellent (90-100)', 'Good (70-89)', 'Fair (50-69)', 'Poor (<50)'],
}

// Mock magnitude of distinct values each "Aggregate By" field would actually
// produce — feeds the "Limit To Top Values" count banner below, and the
// Graph Filter picker's own "Values (N)" heading (GraphFilterModal). Covers
// both the plain Aggregate By dropdown's own options (host/entity-id/ip) and
// every attribute selectable via its Graph Filter picker (GRAPH_FILTER_ATTRS),
// deliberately spread across a wide range (as low as 4, up to 50,000) so
// different attributes read as genuinely different in scale — the modal
// still only *renders* GRAPH_FILTER_VALUES' small representative sample of
// actual value rows, same as a real attribute with tens of thousands of
// distinct values would in a picker UI.
const AGGREGATE_VALUE_COUNTS = {
  host: 12382, 'entity-id': 54618, ip: 8214,
  'Type': 6, 'Activity Status': 4,
  'Origin': 340, 'Data Feed': 45, 'Completeness Quality Score': 101,
  'Origin (Count)': 720, 'Lifetime': 850, 'Recent Activity': 610,
  'Entity ID': 49827, 'Display Label': 47500,
  'First Found': 15012, 'First Seen': 14487, 'Last Found': 13820, 'Last Active': 16245,
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
  'agg-table':  'assets/icons/lcnc/table.svg',
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
    'agg-table': (
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
const KGBtn = ({ onClick }) => (
  <button
    className="dc-kg-btn"
    onClick={onClick}
    style={{ '--dc-indigo': PAI.indigo, '--dc-indigo-tint': PAI.indigoTint }}
  >
    <img src="assets/icons/graph-filter.svg" width={18} height={18} alt="" />
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

// Portal-rendered (not a CSS ::after) because every call site lives inside
// the Widget Settings panel's scrollable body — a plain absolutely-positioned
// tooltip gets clipped by that container's overflow, however it's anchored,
// since the container itself, not just the icon's position, is what's
// cutting it off. Positioned in the viewport from the icon's own rect
// instead, right-anchored (grows left/up) to stay clear of the panel's
// right edge, which every call site sits close to.
function InfoTooltip({ text }) {
  const [pos, setPos] = useState(null)
  const ref = useRef(null)
  const show = () => {
    const r = ref.current?.getBoundingClientRect()
    if (r) setPos({ top: r.top - 6, left: r.right })
  }
  const hide = () => setPos(null)
  return (
    <>
      <span
        ref={ref}
        className="dc-info-tooltip"
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        tabIndex={0}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
        </svg>
      </span>
      {pos && createPortal(
        <div className="dc-info-tooltip__portal" style={{ top: pos.top, left: pos.left }}>
          {text}
        </div>,
        document.body
      )}
    </>
  )
}

// ── Values count banner ──────────────────────────────────────────────
// Shown above a settings panel's Apply/Cancel row for any classification
// chart, so the count of values actually being rendered — and how that
// compares to the field's real total — stays visible right where the user
// commits the change. Severity escalates in three steps once past a plain,
// unstyled "of" count small enough to never be a readability risk:
//   <=10        — plain text, no box, no explanation
//   11-500      — neutral box, explanation, no icon
//   501-999     — amber box, explanation, no icon
//   >=1000      — amber box, explanation, warning icon
function ValuesCountBanner({ shown, total }) {
  const fmt = n => n.toLocaleString()
  const severe = shown >= 1000
  const warn = shown >= 501
  const showDesc = shown > 10
  return (
    <div className={`dc-values-banner${warn ? ' dc-values-banner--warn' : ' dc-values-banner--neutral'}`}>
      {severe && (
        <div className="dc-values-banner__icon">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8.762 3.569L13.388 11.6C13.712 12.167 13.293 12.866 12.626 12.866H3.374C2.706 12.866 2.287 12.167 2.612 11.6L7.238 3.569C7.571 2.989 8.429 2.989 8.762 3.569Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 9.058V6.942" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="8" cy="10.962" r="0.635" fill="currentColor"/>
          </svg>
        </div>
      )}
      <div className="dc-values-banner__text">
        <div className="dc-values-banner__title">
          <span>Showing <strong>{fmt(shown)}</strong> of <strong>{fmt(total)}</strong> values</span>
          {showDesc && (
            <InfoTooltip text={warn
              ? 'For optimal chart readability and performance, a maximum of 1,000 values are displayed at a time.'
              : 'Values beyond the shown count are grouped out of the chart.'} />
          )}
        </div>
        {showDesc && (
          <div className="dc-values-banner__desc">Reducing the number of displayed values can further improve chart readability and performance.</div>
        )}
      </div>
    </div>
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

// A GraphFilterModal result carries `exclude` once a filter was built via
// "Exclude Selected" rather than "Include Selection" — prefixed here so an
// excluded filter reads distinctly from an included one wherever chips
// summarize it outside the modal (e.g. "Not Type: Server"). It also carries
// entityLabel (which scope entity the filter was built against) — shown only
// when withEntity is true, since a single-entity scope makes it redundant.
function filterChipLabel(f, withEntity) {
  const attrPart = (withEntity && f.entityLabel) ? `${f.attr} (${f.entityLabel})` : f.attr
  const base = attrPart + (f.values?.length ? `: ${f.values.join(', ')}` : '')
  return f.exclude ? `Not ${base}` : base
}

function WidgetFilterChips({ filters, onRemove, onClear, showEntity }) {
  if (!filters.length) return null
  return (
    <div className="dc-widget-filter-chips-row">
      <div className="dc-chips">
        {filters.map((f, i) => (
          <span key={i} className="dc-chip">
            {filterChipLabel(f, showEntity)}
            <button className="dc-chip-x" onClick={() => onRemove(i)}>×</button>
          </span>
        ))}
      </div>
      {filters.length > 1 && (
        <button type="button" className="dc-chip-reset-all" onClick={onClear}>Reset all</button>
      )}
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

function SizeSelectDropdown({ value, onChange, options, emptyLabel = 'Select...' }) {
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
        <span>{selected ? selected.label : emptyLabel}</span>
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

// ── Active Filter Preview tree ───────────────────────────────────────
// Shared by every Graph Filter surface (widget settings' GraphFilterModal,
// the dashboard scope's ScopeAttrsPanel/DashboardScopeModal) — the same
// entity-grouped "Include/Exclude attr: values" tree, wherever a picker
// needs to show everything selected so far.
function buildPreviewGroups(filtersByEntity, entityList) {
  return Object.entries(filtersByEntity || {})
    .filter(([, attrFilters]) => attrFilters && Object.keys(attrFilters).length)
    .map(([entityId, attrFilters]) => ({
      entityId,
      entityLabel: entityList.find(e => e.id === entityId)?.label || entityId,
      filters: Object.entries(attrFilters).map(([attr, f]) => ({
        id: `${entityId}-${attr}`, attr, values: f.values, exclude: f.mode === 'Exclude' || f.exclude === true,
      })),
    }))
}
function FilterPreviewTree({ groups, onRemove }) {
  if (!groups.length) {
    return <div className="dc-gf-preview-empty">No filters applied yet — select values, then Include or Exclude.</div>
  }
  return (
    <div className="dc-gf-preview-tree">
      {groups.map(g => (
        <div key={g.entityId} className="dc-gf-preview-group">
          <span className="dc-gf-preview-entity-pill">{g.entityLabel}</span>
          <div className="dc-gf-preview-branches">
            {g.filters.map(f => (
              <div key={f.id} className="dc-gf-preview-branch">
                <span className={`dc-gf-filter-chip-badge${f.exclude ? ' dc-gf-filter-chip-badge--exclude' : ''}`}>
                  {f.exclude ? 'Exclude' : 'Include'}
                </span>
                <span className="dc-gf-preview-branch-text">{f.attr}: {f.values.join(', ')}</span>
                {onRemove && (
                  <button className="dc-gf-filter-chip-x" onClick={() => onRemove(g.entityId, f)}>×</button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── GraphFilterModal ─────────────────────────────────────────────────
function GraphFilterModal({ currentAttr, mode = 'attr', scopeEntities, existingFilters = [], onClose, onApply }) {
  const entities = (scopeEntities && scopeEntities.length) ? scopeEntities : GF_ENTITIES.filter(e => e.id === 'host')
  const [activeEntityId, setActiveEntityId] = useState(entities[0]?.id)
  const [showGraph,     setShowGraph]     = useState(false)
  const [selectedAttr, setSelectedAttr] = useState(currentAttr || 'Type')
  const [attrSearch,   setAttrSearch]   = useState('')
  const [valSearch,    setValSearch]    = useState('')
  const [selectedVals, setSelectedVals] = useState([])
  const [selectAll,    setSelectAll]    = useState(false)
  // Filters built up via "Include Selection"/"Exclude Selected" during this
  // modal session — each is its own attribute+values pick, so a user can
  // combine several before hitting Apply instead of being limited to one.
  // Seeded from whatever this field already had applied (existingFilters) so
  // reopening the popup shows prior filters instead of starting blank —
  // Apply below replaces the field's filter list wholesale with whatever's
  // here, rather than appending, so removing/editing a seeded row works.
  const [pendingFilters, setPendingFilters] = useState(() =>
    existingFilters.map((f, i) => ({
      entityId: entities[0]?.id, entityLabel: entities[0]?.label, ...f,
      id: `existing-${i}-${Date.now()}`,
    }))
  )

  const activeEntity = entities.find(e => e.id === activeEntityId) || entities[0]

  const filteredAttrs = GRAPH_FILTER_ATTRS.filter(a =>
    !attrSearch || a.toLowerCase().includes(attrSearch.toLowerCase())
  )
  const values = (GRAPH_FILTER_VALUES[selectedAttr] || []).filter(v =>
    !valSearch || v.toLowerCase().includes(valSearch.toLowerCase())
  )
  const attrHasFilter = (attr) => pendingFilters.some(f => f.attr === attr && f.entityId === activeEntity?.id)

  const toggleVal = v => setSelectedVals(prev =>
    prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]
  )
  const handleSelectAll = () => {
    if (selectAll) { setSelectedVals([]); setSelectAll(false) }
    else           { setSelectedVals([...values]); setSelectAll(true) }
  }
  const selectEntity = (id) => {
    setActiveEntityId(id)
    setShowGraph(false)
    setSelectedAttr('Type')
    setSelectedVals([])
    setSelectAll(false)
  }

  const addPendingFilter = (exclude) => {
    if (!selectedVals.length) return
    setPendingFilters(prev => [
      ...prev,
      {
        id: `${selectedAttr}-${exclude ? 'ex' : 'in'}-${Date.now()}`,
        attr: selectedAttr, values: [...selectedVals], exclude,
        entityId: activeEntity?.id, entityLabel: activeEntity?.label,
      },
    ])
    setSelectedVals([])
    setSelectAll(false)
  }
  const removePendingFilter = (id) => setPendingFilters(prev => prev.filter(f => f.id !== id))
  const resetFilters = () => {
    setPendingFilters([])
    setSelectedVals([])
    setSelectAll(false)
  }

  // Group the Active Filter Preview by entity, in the order entities were
  // first touched, so filters from several graph nodes read as separate
  // branches instead of one flat list.
  const previewGroups = useMemo(() => {
    const order = []
    const byEntity = {}
    pendingFilters.forEach(f => {
      const key = f.entityId || 'unknown'
      if (!byEntity[key]) { byEntity[key] = { entityId: key, entityLabel: f.entityLabel || 'Entity', filters: [] }; order.push(key) }
      byEntity[key].filters.push(f)
    })
    return order.map(k => byEntity[k])
  }, [pendingFilters])

  return (
    <div className="dc-gf-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="dc-gf-modal" style={{ '--dc-fg1': PAI.fg1, '--dc-fg3': PAI.fg3, '--dc-indigo': PAI.indigo }}>
        {/* Header */}
        <div className="ds-modal-header dc-gf-header">
          <span className="ds-modal-title dc-gf-modal-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M18.7485 14.25C18.0856 14.2496 17.4415 14.47 16.9176 14.8762L14.751 13.1887C14.9146 12.8138 14.9989 12.4091 14.9985 12C14.9985 11.9306 14.9985 11.8612 14.991 11.7928L16.2314 11.3794C16.6238 11.9846 17.2211 12.4281 17.9139 12.6288C18.6067 12.8295 19.3486 12.7738 20.0037 12.4721C20.6588 12.1703 21.1833 11.6426 21.481 10.9857C21.7788 10.3287 21.8298 9.58649 21.6249 8.89494C21.42 8.20338 20.9728 7.60881 20.3652 7.22012C19.7576 6.83144 19.0303 6.67466 18.3166 6.77852C17.6028 6.88238 16.9504 7.23991 16.4787 7.78563C16.0071 8.33135 15.7479 9.02871 15.7485 9.74999C15.7485 9.81936 15.7485 9.88874 15.756 9.95718L14.5157 10.3706C14.2438 9.95027 13.8711 9.60465 13.4314 9.36525C12.9917 9.12585 12.4992 9.00028 11.9985 8.99999C11.833 9.00034 11.6678 9.01413 11.5045 9.04124L10.8632 7.59374C11.4169 7.15133 11.7961 6.52716 11.9336 5.83188C12.0711 5.13659 11.9579 4.41509 11.6142 3.79525C11.2706 3.17541 10.7185 2.69727 10.056 2.44556C9.39345 2.19386 8.66319 2.18485 7.99464 2.42014C7.32609 2.65542 6.76243 3.11981 6.40356 3.73098C6.0447 4.34216 5.9138 5.06065 6.03408 5.75911C6.15436 6.45758 6.51804 7.0909 7.06066 7.54684C7.60328 8.00277 8.2898 8.25187 8.99855 8.24999C9.16408 8.24964 9.32931 8.23585 9.49261 8.20874L10.1339 9.65249C9.59007 10.0829 9.21265 10.6888 9.0661 11.3666C8.91955 12.0445 9.01298 12.7522 9.33042 13.3687L6.92011 15.51C6.31353 15.1011 5.57864 14.9274 4.85317 15.0216C4.12771 15.1157 3.46149 15.4712 2.97939 16.0214C2.49729 16.5716 2.2324 17.2788 2.23439 18.0103C2.23637 18.7419 2.50508 19.4476 2.99016 19.9952C3.47523 20.5428 4.14337 20.8946 4.86933 20.9849C5.59529 21.0751 6.32923 20.8974 6.93359 20.4852C7.53794 20.073 7.97122 19.4546 8.1522 18.7458C8.33317 18.0369 8.24943 17.2865 7.91667 16.635L10.327 14.4937C10.8489 14.8451 11.4682 15.023 12.097 15.0022C12.7258 14.9813 13.3321 14.7627 13.8295 14.3775L15.996 16.065C15.833 16.4388 15.7487 16.8422 15.7485 17.25C15.7485 17.8433 15.9245 18.4234 16.2541 18.9167C16.5838 19.41 17.0523 19.7946 17.6005 20.0216C18.1487 20.2487 18.7519 20.3081 19.3338 20.1923C19.9158 20.0766 20.4503 19.7909 20.8699 19.3713C21.2894 18.9518 21.5751 18.4172 21.6909 17.8353C21.8067 17.2533 21.7472 16.6501 21.5202 16.1019C21.2931 15.5538 20.9086 15.0852 20.4153 14.7556C19.9219 14.4259 19.3419 14.25 18.7485 14.25ZM18.7485 8.24999C19.0452 8.24999 19.3352 8.33796 19.5819 8.50278C19.8286 8.66761 20.0208 8.90187 20.1344 9.17596C20.2479 9.45005 20.2776 9.75165 20.2197 10.0426C20.1618 10.3336 20.019 10.6009 19.8092 10.8106C19.5994 11.0204 19.3322 11.1633 19.0412 11.2212C18.7502 11.279 18.4486 11.2493 18.1745 11.1358C17.9004 11.0223 17.6662 10.83 17.5013 10.5833C17.3365 10.3367 17.2485 10.0467 17.2485 9.74999C17.2485 9.35216 17.4066 8.97063 17.6879 8.68933C17.9692 8.40802 18.3507 8.24999 18.7485 8.24999ZM7.49855 5.24999C7.49855 4.95332 7.58652 4.66331 7.75134 4.41663C7.91616 4.16996 8.15043 3.9777 8.42452 3.86417C8.69861 3.75064 9.00021 3.72093 9.29118 3.77881C9.58215 3.83669 9.84943 3.97955 10.0592 4.18933C10.269 4.39911 10.4118 4.66638 10.4697 4.95735C10.5276 5.24833 10.4979 5.54993 10.3844 5.82401C10.2708 6.0981 10.0786 6.33237 9.8319 6.49719C9.58523 6.66202 9.29522 6.74999 8.99855 6.74999C8.60072 6.74999 8.21919 6.59195 7.93789 6.31065C7.65658 6.02934 7.49855 5.64781 7.49855 5.24999ZM5.24855 19.5C4.95187 19.5 4.66187 19.412 4.41519 19.2472C4.16852 19.0824 3.97626 18.8481 3.86273 18.574C3.7492 18.2999 3.71949 17.9983 3.77737 17.7074C3.83525 17.4164 3.97811 17.1491 4.18789 16.9393C4.39767 16.7296 4.66494 16.5867 4.95591 16.5288C5.24688 16.4709 5.54848 16.5006 5.82257 16.6142C6.09666 16.7277 6.33093 16.92 6.49575 17.1666C6.66057 17.4133 6.74855 17.7033 6.74855 18C6.74855 18.3978 6.59051 18.7793 6.30921 19.0606C6.0279 19.342 5.64637 19.5 5.24855 19.5ZM10.4985 12C10.4985 11.7033 10.5865 11.4133 10.7513 11.1666C10.9162 10.92 11.1504 10.7277 11.4245 10.6142C11.6986 10.5006 12.0002 10.4709 12.2912 10.5288C12.5822 10.5867 12.8494 10.7296 13.0592 10.9393C13.269 11.1491 13.4118 11.4164 13.4697 11.7074C13.5276 11.9983 13.4979 12.2999 13.3844 12.574C13.2708 12.8481 13.0786 13.0824 12.8319 13.2472C12.5852 13.412 12.2952 13.5 11.9985 13.5C11.6007 13.5 11.2192 13.342 10.9379 13.0606C10.6566 12.7793 10.4985 12.3978 10.4985 12ZM18.7485 18.75C18.4519 18.75 18.1619 18.662 17.9152 18.4972C17.6685 18.3324 17.4763 18.0981 17.3627 17.824C17.2492 17.5499 17.2195 17.2483 17.2774 16.9574C17.3352 16.6664 17.4781 16.3991 17.6879 16.1893C17.8977 15.9796 18.1649 15.8367 18.4559 15.7788C18.7469 15.7209 19.0485 15.7506 19.3226 15.8642C19.5967 15.9777 19.8309 16.17 19.9958 16.4166C20.1606 16.6633 20.2485 16.9533 20.2485 17.25C20.2485 17.6478 20.0905 18.0293 19.8092 18.3106C19.5279 18.592 19.1464 18.75 18.7485 18.75Z"/>
            </svg>
            Graph Filter
          </span>
        </div>

        {/* Body */}
        <div className="dc-gf-body">
          {/* Left panel — attributes, or the entity graph canvas */}
          <div className={`dc-gf-left${showGraph ? ' dc-gf-left--full' : ''}`}>
            <button className="dc-gf-hide-attrs" onClick={() => setShowGraph(v => !v)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d={showGraph ? 'm9 18 6-6-6-6' : 'm15 18-6-6 6-6'}/>
              </svg>
              {showGraph ? 'Back to Attributes' : 'Go to Graph'}
            </button>
            {showGraph ? (
              <div className="gf-canvas-area dc-gf-canvas-area">
                {entities.map(entity => {
                  const selected = activeEntityId === entity.id
                  return (
                    <div
                      key={entity.id}
                      className="gf-node"
                      onClick={() => selectEntity(entity.id)}
                    >
                      <div className={`gf-node__circle${selected ? ' gf-node__circle--selected' : ''}`}>
                        <img src={`/assets/icons/${entity.file}`} width={18} height={18} alt="" className="gf-node__img" />
                        <span className="gf-node__count">{entity.count.toLocaleString()}</span>
                      </div>
                      <span className={`gf-node__label${selected ? ' gf-node__label--selected' : ''}`}>
                        {entity.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <>
                <div className="dc-gf-search-wrap">
                  <DSPillSearch value={attrSearch} onChange={setAttrSearch} placeholder="Search attribute" width="100%" />
                </div>
                <div className="dc-gf-entity-label">{activeEntity?.label}</div>
                <div className="dc-gf-attr-list">
                  {filteredAttrs.map(attr => (
                    <div
                      key={attr}
                      className={`dc-gf-attr-item${selectedAttr === attr ? ' dc-gf-attr-item--active' : ''}`}
                      onClick={() => { setSelectedAttr(attr); setSelectedVals([]); setSelectAll(false) }}
                    >
                      <span className="dc-gf-attr-name">{attr}</span>
                      {attrHasFilter(attr) && <span className="dc-gf-attr-dot" />}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Right panel — values (hidden while the graph canvas is active).
              Attribute-only pickers (mode="attr", e.g. Classification/Aggregate
              By) filter on the whole attribute, so the value list is shown for
              context but disabled — only mode="filter" (the widget-filter
              flow) lets specific values be picked. */}
          {!showGraph && (
          <div className={`dc-gf-right${mode !== 'filter' ? ' dc-gf-right--disabled' : ''}`}>
            <div className="dc-gf-val-heading">Values ({(AGGREGATE_VALUE_COUNTS[selectedAttr] ?? values.length).toLocaleString()})</div>
            <div className="dc-gf-search-wrap">
              <DSPillSearch value={valSearch} onChange={setValSearch} placeholder="Search value" width="100%" />
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
              <button className="dc-gf-action-btn" disabled={!selectedVals.length} onClick={() => addPendingFilter(true)}>Exclude Selected</button>
              <button className="dc-gf-action-btn" disabled={!selectedVals.length} onClick={() => addPendingFilter(false)}>Include Selection</button>
            </div>
          </div>
          )}
        </div>

        {/* Active Filter Preview — modeled on the page-level Graph Filter's
            bottom preview bar: a persistent, entity-grouped tree of every
            filter built so far, visible in both the attribute-list and graph
            views so switching entities via "Go to Graph" never hides it. Only
            meaningful for the widget-filter flow (mode="filter") — the plain
            attribute pickers (classification/aggregate-by) don't build a
            filter list at all. */}
        {mode === 'filter' && (
          <div className="dc-gf-preview-section">
            <div className="dc-gf-preview-label">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              Active Filter Preview
            </div>
            <FilterPreviewTree groups={previewGroups} onRemove={(entityId, f) => removePendingFilter(f.id)} />
          </div>
        )}

        {/* Footer */}
        <div className="dc-gf-footer">
          <button
            className="dc-gf-reset-btn"
            disabled={!pendingFilters.length && !selectedVals.length}
            onClick={resetFilters}
          >
            Reset all filters
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
          </button>
          <button className="ds-btn sz-md t-outline" onClick={onClose}>Cancel</button>
          <button
            className="ds-btn sz-md t-primary"
            onClick={() => {
              if (mode !== 'filter') { onApply(selectedAttr); return }
              const toApply = [...pendingFilters]
              if (selectedVals.length) toApply.push({
                attr: selectedAttr, values: [...selectedVals], exclude: false,
                entityId: activeEntity?.id, entityLabel: activeEntity?.label,
              })
              // Hands back the field's complete filter list (seeded rows plus
              // whatever changed this session) — the caller replaces its
              // filter state wholesale, it doesn't append. entityId/entityLabel
              // travel with it so chips outside the modal can disambiguate
              // which scope entity a filter belongs to.
              onApply(toApply.map(f => ({ attr: f.attr, values: f.values, exclude: f.exclude, entityId: f.entityId, entityLabel: f.entityLabel })))
            }}
          >Apply</button>
        </div>
      </div>
    </div>
  )
}

// ── ScopeAttrsPanel ──────────────────────────────────────────────────
// Attribute + value picker used by DashboardScopeModal's "Add Attributes"
// step. Structured exactly like the widget settings' Graph Filter modal —
// same attribute-list / values-grid / Exclude-Include layout, the same mock
// GRAPH_FILTER_ATTRS/GRAPH_FILTER_VALUES dummy data, the same "Go to Graph"
// canvas toggle for switching which scope entity is active, and the same
// Active Filter Preview tree — but grouped across every entity in the
// dashboard's scope at once (a single attribute set applies to all of them),
// not just the one currently active.
function ScopeAttrsPanel({ entities, filters, onFiltersChange }) {
  const [activeEntityId, setActiveEntityId] = useState(entities[0]?.id)
  const [showGraph,      setShowGraph]      = useState(false)

  const activeEntity   = entities.find(e => e.id === activeEntityId) || entities[0]
  const activeFilters  = filters[activeEntityId] || {}

  const [selectedAttr, setSelectedAttr] = useState(GRAPH_FILTER_ATTRS[0])
  const [attrSearch, setAttrSearch] = useState('')
  const [valSearch,  setValSearch]  = useState('')
  const [draftVals,  setDraftVals]  = useState(() => new Set(activeFilters[GRAPH_FILTER_ATTRS[0]]?.values))
  const [selectAll,  setSelectAll]  = useState(false)

  const filteredAttrs = GRAPH_FILTER_ATTRS.filter(a => !attrSearch || a.toLowerCase().includes(attrSearch.toLowerCase()))
  const values = (GRAPH_FILTER_VALUES[selectedAttr] || []).filter(v => !valSearch || v.toLowerCase().includes(valSearch.toLowerCase()))

  const previewGroups = useMemo(() => buildPreviewGroups(filters, entities), [filters, entities])

  const selectEntity = (id) => {
    setActiveEntityId(id)
    setShowGraph(false)
    setSelectedAttr(GRAPH_FILTER_ATTRS[0])
    setDraftVals(new Set(filters[id]?.[GRAPH_FILTER_ATTRS[0]]?.values))
    setAttrSearch(''); setValSearch(''); setSelectAll(false)
  }
  const selectAttr = (attr) => {
    setSelectedAttr(attr)
    setDraftVals(new Set(activeFilters[attr]?.values))
    setValSearch('')
    setSelectAll(false)
  }
  const toggleVal = (v) => setDraftVals(prev => {
    const next = new Set(prev)
    next.has(v) ? next.delete(v) : next.add(v)
    return next
  })
  const toggleSelectAll = () => {
    if (selectAll) { setDraftVals(new Set()); setSelectAll(false) }
    else           { setDraftVals(new Set(values)); setSelectAll(true) }
  }
  const applyMode = (mode) => {
    if (!draftVals.size) return
    onFiltersChange({
      ...filters,
      [activeEntityId]: { ...activeFilters, [selectedAttr]: { mode, values: [...draftVals] } },
    })
  }
  const removeFilterFor = (entityId, attr) => {
    const nextEntityFilters = { ...(filters[entityId] || {}) }
    delete nextEntityFilters[attr]
    onFiltersChange({ ...filters, [entityId]: nextEntityFilters })
  }

  return (
    <>
    <div className="dc-gf-attrs-body" style={{ '--dc-fg1': PAI.fg1, '--dc-fg3': PAI.fg3, '--dc-indigo': PAI.indigo }}>
      <div className={`dc-gf-left${showGraph ? ' dc-gf-left--full' : ''}`}>
        <button className="dc-gf-hide-attrs" onClick={() => setShowGraph(v => !v)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d={showGraph ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6'}/>
          </svg>
          {showGraph ? 'Back to Attributes' : 'Go to Graph'}
        </button>
        {showGraph ? (
          <div className="gf-canvas-area dc-gf-canvas-area">
            {entities.map(entity => {
              const selected = activeEntityId === entity.id
              return (
                <div key={entity.id} className="gf-node" onClick={() => selectEntity(entity.id)}>
                  <div className={`gf-node__circle${selected ? ' gf-node__circle--selected' : ''}`}>
                    <img src={`/assets/icons/${entity.file}`} width={18} height={18} alt="" className="gf-node__img" />
                    <span className="gf-node__count">{entity.count.toLocaleString()}</span>
                  </div>
                  <span className={`gf-node__label${selected ? ' gf-node__label--selected' : ''}`}>{entity.label}</span>
                </div>
              )
            })}
          </div>
        ) : (
          <>
            <div className="dc-gf-search-wrap">
              <DSPillSearch value={attrSearch} onChange={setAttrSearch} placeholder="Search attribute" width="100%" />
            </div>
            <div className="dc-gf-entity-label">{activeEntity?.label}</div>
            <div className="dc-gf-attr-list">
              {filteredAttrs.map(attr => (
                <div
                  key={attr}
                  className={`dc-gf-attr-item${selectedAttr === attr ? ' dc-gf-attr-item--active' : ''}`}
                  onClick={() => selectAttr(attr)}
                >
                  <span className="dc-gf-attr-name">{attr}</span>
                  {activeFilters[attr] && <span className="dc-gf-attr-dot" />}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {!showGraph && (
      <div className="dc-gf-right">
        <div className="dc-gf-val-heading">Values ({(AGGREGATE_VALUE_COUNTS[selectedAttr] ?? values.length).toLocaleString()})</div>
        <div className="dc-gf-search-wrap">
          <DSPillSearch value={valSearch} onChange={setValSearch} placeholder="Search value" width="100%" />
        </div>
        <div className="dc-gf-val-controls">
          <label className="dc-gf-select-all-label">
            <input type="checkbox" checked={selectAll} onChange={toggleSelectAll} className="dc-gf-checkbox" />
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
              <span className={`dc-gf-val-radio${draftVals.has(v) ? ' dc-gf-val-radio--on' : ''}`} />
            </div>
          ))}
        </div>
        <div className="dc-gf-val-actions">
          <button className="dc-gf-action-btn" disabled={!draftVals.size} onClick={() => applyMode('Exclude')}>Exclude Selected</button>
          <button className="dc-gf-action-btn" disabled={!draftVals.size} onClick={() => applyMode('Include')}>Include Selection</button>
        </div>
      </div>
      )}
    </div>
    <div className="dc-gf-preview-section">
      <div className="dc-gf-preview-label">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        Active Filter Preview
      </div>
      <FilterPreviewTree groups={previewGroups} onRemove={(entityId, f) => removeFilterFor(entityId, f.attr)} />
    </div>
    </>
  )
}

// ── DashboardScopeModal ──────────────────────────────────────────────
// Graph-filter entity picker used to set a dashboard's scope. Mandatory
// (non-dismissable) the first time a brand-new dashboard is opened; when
// reopened later via the Dashboard Scope badge it's a normal dismissable
// modal so the user can change the scope.
function DashboardScopeModal({ mandatory, initialSelectedIds, initialAttrFilters, onClose, onBack, onSelect }) {
  const [search, setSearch]           = useState('')
  const [selectedIds, setSelectedIds] = useState(() =>
    initialSelectedIds?.length ? initialSelectedIds : ['host']
  )
  const [attrFilters, setAttrFilters] = useState(() => initialAttrFilters ?? {})
  const [attrsViewOpen, setAttrsViewOpen] = useState(false)

  const filtered = GF_ENTITIES.filter(e =>
    !search || e.label.toLowerCase().includes(search.toLowerCase())
  )
  const selected = GF_ENTITIES.filter(e => selectedIds.includes(e.id))
  const dismiss = mandatory ? onBack : onClose
  const toggleEntity = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }
  const attrCount = (id) => Object.keys(attrFilters[id] || {}).length
  const totalAttrCount = selected.reduce((n, e) => n + attrCount(e.id), 0)
  const scopePreviewGroups = useMemo(() => buildPreviewGroups(attrFilters, GF_ENTITIES), [attrFilters])
  const openAttrs = () => { if (selected.length) setAttrsViewOpen(true) }
  const removeAttrFilter = (entityId, attr) => {
    setAttrFilters(prev => {
      const nextEntityFilters = { ...(prev[entityId] || {}) }
      delete nextEntityFilters[attr]
      return { ...prev, [entityId]: nextEntityFilters }
    })
  }

  if (attrsViewOpen) {
    return (
      <div className="ds-modal-overlay" onClick={mandatory ? undefined : onClose}>
        <div className="ds-modal dc-scope-modal dc-scope-modal--wide" onClick={e => e.stopPropagation()}>
          <div className="ds-modal-header">
            <span className="ds-modal-title">Add Attributes</span>
            <button className="ds-modal-close" onClick={dismiss}>✕</button>
          </div>
          <div className="ds-modal-body ds-modal-body--flush">
            <ScopeAttrsPanel
              entities={selected}
              filters={attrFilters}
              onFiltersChange={setAttrFilters}
            />
          </div>
          <div className="ds-modal-footer">
            <button
              className="dc-gf-reset-btn"
              disabled={totalAttrCount === 0}
              onClick={() => setAttrFilters({})}
            >
              Reset all filters
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
            </button>
            <button className="ds-btn sz-md t-outline" onClick={() => setAttrsViewOpen(false)}>Back</button>
            <button className="ds-btn sz-md t-primary" onClick={() => setAttrsViewOpen(false)}>Done</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="ds-modal-overlay" onClick={mandatory ? undefined : onClose}>
      <div className="ds-modal dc-scope-modal" onClick={e => e.stopPropagation()}>
        <div className="ds-modal-header">
          <span className="ds-modal-title">{mandatory ? 'Set Dashboard Scope' : 'Edit Dashboard Scope'}</span>
          <button className="ds-modal-close" onClick={dismiss}>✕</button>
        </div>
        <div className="ds-modal-body">
          <p className="dc-scope-modal__hint">
            Select one or more nodes or entities to scope this dashboard to. You can change this later from the Dashboard Scope badge.
          </p>
          <DSPillSearch
            value={search}
            onChange={setSearch}
            placeholder="Search entity"
            width="100%"
          />
          <div className="dc-scope-modal__grid">
            {filtered.map(entity => (
              <button
                type="button"
                key={entity.id}
                className={`dc-scope-node${selectedIds.includes(entity.id) ? ' dc-scope-node--selected' : ''}`}
                style={{ '--dc-scope-color': entity.color }}
                onClick={() => toggleEntity(entity.id)}
              >
                <span className="dc-scope-node__circle">
                  <img src={`/assets/icons/${entity.file}`} width={20} height={20} alt="" />
                  {attrCount(entity.id) > 0 && <span className="dc-scope-node__attr-badge">{attrCount(entity.id)}</span>}
                </span>
                <span className="dc-scope-node__label">{entity.label}</span>
              </button>
            ))}
          </div>
          {totalAttrCount > 0 && (
            <div className="dc-gf-preview-section dc-gf-preview-section--inline">
              <div className="dc-gf-preview-label">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                Active Filters
              </div>
              <FilterPreviewTree groups={scopePreviewGroups} onRemove={(entityId, f) => removeAttrFilter(entityId, f.attr)} />
            </div>
          )}
        </div>
        <div className="ds-modal-footer">
          <div className="dc-scope-attrs-section">
            <button
              type="button"
              className="ds-btn sz-md t-outline"
              disabled={!selected.length}
              onClick={openAttrs}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Attributes
            </button>
            {!selected.length && <span className="dc-scope-attrs-section__hint">Select an entity first</span>}
          </div>
          <div className="dc-scope-modal__footer-actions">
            <button className="ds-btn sz-md t-outline" onClick={dismiss}>
              {mandatory ? 'Back' : 'Cancel'}
            </button>
            <button
              className="ds-btn sz-md t-primary"
              disabled={!selected.length}
              onClick={() => selected.length && onSelect(selected, attrFilters)}
            >Confirm Scope</button>
          </div>
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

// ── Aggregated Table: Group By / Aggregate By column chips ─────────────
// A chip with both an edit (pencil) affordance and the usual remove (×) —
// unlike a plain Table column chip, these carry enough config (attribute +
// operation + optional display name) that re-opening the same modal to
// tweak it beats forcing a remove-and-re-add.
function EditableChip({ label, onEdit, onRemove }) {
  return (
    <span className="dc-chip dc-chip--editable">
      {label}
      <button className="dc-chip-edit" onClick={onEdit} aria-label="Edit">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
        </svg>
      </button>
      <button className="dc-chip-x" onClick={onRemove} aria-label="Remove">×</button>
    </span>
  )
}

function ModalFieldLabel({ children, optional }) {
  return (
    <div className="dc-modal-field-label">
      <span>{children}{optional && <span className="dc-modal-field-optional">(Optional)</span>}</span>
      <span className="dc-modal-field-label-line" />
    </div>
  )
}

// Readonly "Select from graph" input + the same graph-picker icon button
// used everywhere else in this panel (GraphFilterModal in mode="attr") —
// reused here so Add Group's attribute pick works identically to every
// other graph-backed attribute field in the settings panel.
function AttributePickerField({ value, onPick, placeholder = 'Select from graph' }) {
  const [pickerOpen, setPickerOpen] = useState(false)
  return (
    <div className="dc-text-input-wrap">
      <input
        readOnly
        value={value || ''}
        placeholder={placeholder}
        className="dc-text-input"
        style={{ '--dc-input-color': value ? PAI.fg1 : PAI.fg3 }}
      />
      <button
        className="dc-kg-btn"
        onClick={() => setPickerOpen(true)}
        style={{ '--dc-indigo': PAI.indigo, '--dc-indigo-tint': PAI.indigoTint }}
      >
        <img src="assets/icons/graph-filter.svg" width={18} height={18} alt="" />
      </button>
      {pickerOpen && (
        <GraphFilterModal
          mode="attr"
          currentAttr={value}
          onClose={() => setPickerOpen(false)}
          onApply={attr => { onPick(attr); setPickerOpen(false) }}
        />
      )}
    </div>
  )
}

function AddGroupModal({ initial, onClose, onApply }) {
  const [attribute, setAttribute]     = useState(initial?.attribute || '')
  const [displayName, setDisplayName] = useState(initial?.displayName || '')
  return (
    <div className="ds-modal-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="ds-modal" onMouseDown={e => e.stopPropagation()}>
        <div className="ds-modal-header">
          <span className="ds-modal-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ marginRight: 6, verticalAlign: -2 }}>
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            {initial ? 'Edit Group' : 'Add Group'}
          </span>
          <button className="ds-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="ds-modal-body">
          <div>
            <ModalFieldLabel>Select Attribute</ModalFieldLabel>
            <AttributePickerField value={attribute} onPick={setAttribute} />
          </div>
          <div>
            <ModalFieldLabel optional>Display Name for Column</ModalFieldLabel>
            <TextInput value={displayName} onChange={e => setDisplayName(e.target.value)} />
          </div>
        </div>
        <div className="ds-modal-footer">
          <button className="ds-btn sz-md t-outline" onClick={onClose}>Cancel</button>
          <button className="ds-btn sz-md t-primary" disabled={!attribute} style={{ opacity: attribute ? 1 : 0.4 }} onClick={() => onApply({ attribute, displayName })}>Apply</button>
        </div>
      </div>
    </div>
  )
}

const AGG_OPERATIONS = [
  { value: 'count-distinct', label: 'Count Distinct' },
  { value: 'count',          label: 'Count' },
  { value: 'sum',            label: 'Sum' },
  { value: 'avg',            label: 'Avg' },
]

function AddAggregateModal({ initial, onClose, onApply }) {
  const [operation, setOperation]     = useState(initial?.operation || 'count-distinct')
  const [attribute, setAttribute]     = useState(initial?.attribute || '')
  const [displayName, setDisplayName] = useState(initial?.displayName || '')
  const [pickerOpen, setPickerOpen]   = useState(false)
  return (
    <div className="ds-modal-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="ds-modal" onMouseDown={e => e.stopPropagation()}>
        <div className="ds-modal-header">
          <span className="ds-modal-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ marginRight: 6, verticalAlign: -2 }}>
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            {initial ? 'Edit Aggregate' : 'Add Aggregate'}
          </span>
          <button className="ds-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="ds-modal-body">
          <div className="dc-axis-row dc-axis-row--with-action">
            <div className="dc-axis-col">
              <ModalFieldLabel>Select Operation</ModalFieldLabel>
              <SelectInput value={operation} onChange={e => setOperation(e.target.value)} options={AGG_OPERATIONS} />
            </div>
            <div className="dc-axis-col">
              <ModalFieldLabel>Select Attribute</ModalFieldLabel>
              <select
                value={attribute}
                onChange={e => setAttribute(e.target.value)}
                className="dc-select-input"
                style={{ '--dc-input-color': attribute ? PAI.fg1 : PAI.fg3 }}
              >
                <option value="">Select Any</option>
                <option value="host">Host</option>
                <option value="entity-id">Entity ID</option>
                <option value="ip">IP Address</option>
              </select>
            </div>
            <button
              className="dc-kg-btn dc-kg-btn--bottom"
              onClick={() => setPickerOpen(true)}
              style={{ '--dc-indigo': PAI.indigo, '--dc-indigo-tint': PAI.indigoTint }}
            >
              <img src="assets/icons/graph-filter.svg" width={18} height={18} alt="" />
            </button>
          </div>
          {pickerOpen && (
            <GraphFilterModal
              mode="attr"
              currentAttr={attribute}
              onClose={() => setPickerOpen(false)}
              onApply={attr => { setAttribute(attr); setPickerOpen(false) }}
            />
          )}
          <div>
            <ModalFieldLabel optional>Display Name for Column</ModalFieldLabel>
            <TextInput value={displayName} onChange={e => setDisplayName(e.target.value)} />
          </div>
        </div>
        <div className="ds-modal-footer">
          <button className="ds-btn sz-md t-outline" onClick={onClose}>Cancel</button>
          <button className="ds-btn sz-md t-primary" disabled={!attribute} style={{ opacity: attribute ? 1 : 0.4 }} onClick={() => onApply({ operation, attribute, displayName })}>Apply</button>
        </div>
      </div>
    </div>
  )
}

// ── Widget Settings Panel ────────────────────────────────────────────
function WidgetSettingsPanel({ widget, scopeEntities, onSaveChanges, onClose, onLiveChange, suppressPerfWarning, onSuppressPerfWarning }) {
  // Holds the pending onSaveChanges payload while the Performance Impact
  // Warning is up — Apply doesn't commit directly for a high-cardinality
  // classification chart until the user confirms through it.
  const [perfWarningPending, setPerfWarningPending] = useState(null)
  const [dontWarnAgain, setDontWarnAgain] = useState(false)
  const [tab, setTab]             = useState('data')
  const [title, setTitle]         = useState(() => {
    const defaultLabel   = CHART_TYPES.find(c => c.id === widget.chartId)?.label
    const isClassChart   = widget.chartId === 'vert-bar' || widget.chartId === 'hor-bar' || widget.chartId === 'pie'
    if ((widget.chartId === 'stack-vert' || widget.chartId === 'line') && widget.label === defaultLabel)
      return widget.magnitude || 'Origin'
    if (widget.chartId === 'kpi' && widget.label === defaultLabel)
      return KPI_AGG_LABELS.host
    return isClassChart && widget.label === defaultLabel
      ? (widget.classification || 'Type')
      : widget.label
  })
  const [description, setDescription] = useState(widget.description || '')
  // A widget's real gw/gh (set by a free-form drag/resize) may no longer
  // line up with any named preset — when it doesn't, these are null so the
  // dropdown shows "Custom" instead of a stale preset label. Re-synced by
  // the effect below (not just computed once at mount) because the panel
  // stays mounted across a canvas drag — it auto-opens right after Add
  // Widget's Save, and a user commonly drags the widget to size while it's
  // already showing — so a mount-only computation would freeze on the
  // widget's size at open time and never reflect that drag.
  const [sizeId, setSizeId] = useState(null)
  const [heightId, setHeightId] = useState(null)
  useEffect(() => {
    const { minGw, minGh } = minSizeFor(widget.chartId)
    const sizeOptions = widget.chartId === 'heading' ? HEADING_WIDGET_SIZES : widget.chartId === 'kpi' ? KPI_WIDGET_SIZES : WIDGET_SIZES
    const heightOptions = widget.chartId === 'heading' ? HEADING_WIDGET_HEIGHTS : widget.chartId === 'kpi' ? KPI_WIDGET_HEIGHTS : WIDGET_HEIGHTS
    setSizeId(matchSizeId(widget.gw, sizeOptions, minGw))
    setHeightId(matchHeightId(widget.gh, heightOptions, minGh))
  }, [widget.gw, widget.gh, widget.chartId])
  const [chartType, setChartType] = useState(widget.chartId)
  const [classification, setClassification] = useState('Type')
  const [operation, setOperation]           = useState('count-distinct')
  const [aggregateBy, setAggregateBy]       = useState('host')

  const [widgetFilters, setWidgetFilters]   = useState([])
  // A dashboard scoped to just one entity makes "Host · Type: Server" chip
  // labels redundant noise — only worth showing once there's more than one
  // entity to disambiguate between.
  const showFilterEntity = (scopeEntities?.length || 0) > 1
  const [sortBy, setSortBy]                 = useState('')
  const [showTotalCount, setShowTotalCount] = useState(widget.showTotalCount ?? true)
  const [showPctChange, setShowPctChange]   = useState(widget.showPctChange ?? true)
  const [showLegend, setShowLegend]         = useState(widget.showLegend ?? true)
  const [columns, setColumns]               = useState(widget.columns || ['Type', 'Display Label'])
  const [enableDownload, setEnableDownload] = useState(widget.enableDownload ?? true)
  const [enableAddColumn, setEnableAddColumn] = useState(widget.enableAddColumn ?? false)
  // Aggregated Table's own Columns model — a list of group-by attributes and
  // a list of aggregate calculations, each editable/removable as its own
  // chip, rather than the plain Table's flat list of display columns.
  const [groupByCols, setGroupByCols]       = useState(widget.groupByCols || [])
  const [aggregateByCols, setAggregateByCols] = useState(widget.aggregateByCols || [])
  const [groupModalOpen, setGroupModalOpen] = useState(null) // null closed, else { editIndex, initial }
  const [aggColModalOpen, setAggColModalOpen] = useState(null)
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
  const [valueFontSize, setValueFontSize] = useState(widget.valueFontSize || 'auto')
  const [aggregateByModalOpen, setAggregateByModalOpen] = useState(false)
  const [kpiCompAggregateByModalOpen, setKpiCompAggregateByModalOpen] = useState(false)
  const [kpiFilterModalOpen, setKpiFilterModalOpen] = useState(false)
  const [kpiFilters, setKpiFilters]         = useState([])
  const [kpiCompFilterModalOpen, setKpiCompFilterModalOpen] = useState(false)
  const [kpiCompFilters, setKpiCompFilters] = useState([])
  const [limitTopValues, setLimitTopValues] = useState(widget.limitTopValues ?? false)
  const [topValuesCount, setTopValuesCount] = useState(widget.topValuesCount ?? 5)
  // A brand-new widget has no persisted classification yet — Configure Colors
  // stays locked until the user actually engages with the Data tab's
  // attribute control at least once (typing it for pie, or applying the
  // attribute picker for bar/stacked charts).
  const [attributeTouched, setAttributeTouched] = useState(widget.classification != null)

  const isPie       = chartType === 'pie'
  const isKpi       = chartType === 'kpi'
  const isTable     = chartType === 'table'
  const isAggTable  = chartType === 'agg-table'
  const isVertBar   = chartType === 'vert-bar'
  const isHorBar    = chartType === 'hor-bar'
  const isStackVert = chartType === 'stack-vert'
  const isStackHor  = chartType === 'stack-hor'
  const isLine      = chartType === 'line'
  const isKPI       = chartType === 'kpi'
  const isHeading   = chartType === 'heading'

  // Composition charts render one bar/slice per distinct value of their own
  // Classification attribute (not the pie's "Size" section's Aggregate By,
  // which only drives the center total/distinct count) — a real backend
  // would report the true cardinality; here it's the same per-field mock
  // magnitude used elsewhere (AGGREGATE_VALUE_COUNTS) so "Limit To Top
  // Values" and its count banner feel proportionate to the field chosen.
  // Stacked charts split values across two attributes (Classification for
  // the axis, Magnitude for the stack breakdown), so their banner sums both
  // — Line shares that same two-attribute Data tab, so it's grouped in here
  // too rather than treated as its own one-attribute case.
  const isStackedChart  = isStackVert || isStackHor || isLine
  const isBannerChart   = isPie || isVertBar || isHorBar || isStackedChart
  const classificationValues = AGGREGATE_VALUE_COUNTS[classification] ?? 1000
  const magnitudeValues      = AGGREGATE_VALUE_COUNTS[magnitude] ?? 1000
  const rawAggregateValues   = isStackedChart ? classificationValues + magnitudeValues : classificationValues
  // The attribute's own total value count never moves — only how many of
  // those values actually make it into the chart. A widget filter narrows
  // the underlying dataset (each applied filter mock-shrinks the shown count
  // by roughly a third, compounding), and "Limit To Top Values" caps it
  // further on top of that — either way it's the "shown" half of "Showing X
  // of Y values" that decreases, never Y.
  const totalAggregateValues = rawAggregateValues
  const filteredAggregateValues = Math.max(1, Math.round(totalAggregateValues * Math.pow(0.65, widgetFilters.length)))
  // Matches ValuesCountBanner's own tooltip copy ("a maximum of 1,000 values
  // are displayed at a time") — that ceiling applies automatically once the
  // filtered count passes it, independent of the opt-in "Limit To Top
  // Values" cap, which can still pull it lower still (e.g. topValuesCount=5).
  const autoCappedAggregateValues = Math.min(filteredAggregateValues, 1000)
  const shownAggregateValues = limitTopValues ? Math.min(topValuesCount, autoCappedAggregateValues) : autoCappedAggregateValues

  useEffect(() => {
    onLiveChange?.({ sizeId, heightId })
  }, [sizeId, heightId])

  // KPI heading tracks the pre-selected Aggregate By attribute — but only
  // while the title still matches the last auto-applied label, so a title
  // the user typed themselves is never clobbered.
  const kpiAutoTitleRef = useRef(isKpi ? (KPI_AGG_LABELS[aggregateBy] || aggregateBy) : null)
  useEffect(() => {
    if (!isKpi) return
    const nextLabel = KPI_AGG_LABELS[aggregateBy] || aggregateBy
    setTitle(t => (t === kpiAutoTitleRef.current ? nextLabel : t))
    kpiAutoTitleRef.current = nextLabel
  }, [aggregateBy, isKpi])

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
            {isKPI && (
              <div className="dc-size-section" style={{ '--dc-fg1': PAI.fg1, '--dc-fg3': PAI.fg3 }}>
                <div className="dc-size-section-heading">Text Size</div>
                <div className="dc-size-sub-row">
                  <div className="dc-size-sub-label">Value</div>
                  <SegmentedTabs value={valueFontSize} options={KPI_VALUE_SIZE_OPTIONS} onChange={setValueFontSize} height={28} />
                </div>
              </div>
            )}
            <div className="dc-size-section" style={{ '--dc-fg1': PAI.fg1, '--dc-fg3': PAI.fg3 }}>
              <div className="dc-size-section-heading">Widget Size</div>
              <div className="dc-size-sub-row">
                <div className="dc-size-sub-label">Width</div>
                <SizeSelectDropdown
                  value={sizeId}
                  onChange={v => setSizeId(v)}
                  options={(isHeading ? HEADING_WIDGET_SIZES : isKPI ? KPI_WIDGET_SIZES : WIDGET_SIZES).map(s => ({ value: s.id, label: s.label }))}
                  emptyLabel="Custom"
                />
              </div>
              <div className="dc-size-sub-row">
                <div className="dc-size-sub-label">Height</div>
                <SizeSelectDropdown
                  value={heightId}
                  onChange={v => setHeightId(v)}
                  options={(isHeading ? HEADING_WIDGET_HEIGHTS : isKPI ? KPI_WIDGET_HEIGHTS : WIDGET_HEIGHTS).map(h => ({ value: h.id, label: h.label }))}
                  emptyLabel="Custom"
                />
              </div>
            </div>
            <FieldRow label="Configure Colors">
              {!isKpi && !isTable && !isAggTable && !attributeTouched ? (
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
                  <>
                    <FieldRow label="Filter" hint="Select a widget filter for navigation context">
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
                      <WidgetFilterChips
                        filters={widgetFilters}
                        onRemove={i => setWidgetFilters(prev => prev.filter((_, j) => j !== i))}
                        onClear={() => setWidgetFilters([])}
                        showEntity={showFilterEntity}
                      />
                    </FieldRow>
                    {widgetFilterModalOpen && (
                      <GraphFilterModal
                        scopeEntities={scopeEntities}
                        mode="filter"
                        existingFilters={widgetFilters}
                        onClose={() => setWidgetFilterModalOpen(false)}
                        onApply={filters => { setWidgetFilters(filters); setWidgetFilterModalOpen(false) }}
                      />
                    )}
                  </>
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
                  <WidgetFilterChips
                    filters={widgetFilters}
                    onRemove={i => setWidgetFilters(prev => prev.filter((_, j) => j !== i))}
                    onClear={() => setWidgetFilters([])}
                    showEntity={showFilterEntity}
                  />
                </FieldRow>
                {widgetFilterModalOpen && (
                  <GraphFilterModal
                    scopeEntities={scopeEntities}
                    mode="filter"
                    existingFilters={widgetFilters}
                    onClose={() => setWidgetFilterModalOpen(false)}
                    onApply={filters => { setWidgetFilters(filters); setWidgetFilterModalOpen(false) }}
                  />
                )}
                <div className="dc-divider" />
                <ToggleRow
                  label="Enable Download"
                  description="Table can be downloaded as CSV or XLSX."
                  value={enableDownload}
                  onChange={setEnableDownload}
                />
                <ToggleRow
                  label="Add Column"
                  description="Show an Add Column button above the table."
                  value={enableAddColumn}
                  onChange={setEnableAddColumn}
                />
              </>
            ) : isAggTable ? (
              <>
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
                  <WidgetFilterChips
                    filters={widgetFilters}
                    onRemove={i => setWidgetFilters(prev => prev.filter((_, j) => j !== i))}
                    onClear={() => setWidgetFilters([])}
                    showEntity={showFilterEntity}
                  />
                </FieldRow>
                {widgetFilterModalOpen && (
                  <GraphFilterModal
                    scopeEntities={scopeEntities}
                    mode="filter"
                    existingFilters={widgetFilters}
                    onClose={() => setWidgetFilterModalOpen(false)}
                    onApply={filters => { setWidgetFilters(filters); setWidgetFilterModalOpen(false) }}
                  />
                )}

                <div className="dc-field-label dc-field-label--no-hint">Columns</div>

                <div className="dc-agg-col-group">
                  <div className="dc-field-label dc-field-label--no-hint">
                    Group By <span className="dc-required-asterisk">*</span>
                    <InfoTooltip text="Choose one or more attributes to group table rows by." />
                  </div>
                  <div className="dc-text-input-wrap">
                    <input readOnly placeholder="Add Group" className="dc-text-input" style={{ '--dc-input-color': PAI.fg3 }} />
                    <button
                      className="dc-add-row-btn"
                      onClick={() => setGroupModalOpen({ editIndex: null, initial: null })}
                      style={{ '--dc-indigo': PAI.indigo }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                    </button>
                  </div>
                  {groupByCols.length > 0 && (
                    <div className="dc-chips">
                      {groupByCols.map((g, i) => (
                        <EditableChip
                          key={i}
                          label={g.displayName || g.attribute}
                          onEdit={() => setGroupModalOpen({ editIndex: i, initial: g })}
                          onRemove={() => setGroupByCols(prev => prev.filter((_, j) => j !== i))}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="dc-agg-col-group">
                  <div className="dc-field-label dc-field-label--no-hint">
                    Aggregate By <span className="dc-required-asterisk">*</span>
                    <InfoTooltip text="Choose one or more aggregate calculations to show as columns." />
                  </div>
                  <div className="dc-text-input-wrap">
                    <input readOnly placeholder="Add Aggregate" className="dc-text-input" style={{ '--dc-input-color': PAI.fg3 }} />
                    <button
                      className="dc-add-row-btn"
                      onClick={() => setAggColModalOpen({ editIndex: null, initial: null })}
                      style={{ '--dc-indigo': PAI.indigo }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                    </button>
                  </div>
                  {aggregateByCols.length > 0 && (
                    <div className="dc-chips">
                      {aggregateByCols.map((a, i) => (
                        <EditableChip
                          key={i}
                          label={a.displayName || a.attribute}
                          onEdit={() => setAggColModalOpen({ editIndex: i, initial: a })}
                          onRemove={() => setAggregateByCols(prev => prev.filter((_, j) => j !== i))}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="dc-divider" />
                <ToggleRow
                  label="Explode Array Field Values"
                  description="Show distinct rows for fields with multiple values."
                  value={explodeArrayFields}
                  onChange={setExplodeArrayFields}
                  tooltip="When a field holds multiple values, show one row per value instead of combining them into a single row."
                />
                <ToggleRow
                  label="Enable Download"
                  description="Table can be downloaded as CSV or XLSX."
                  value={enableDownload}
                  onChange={setEnableDownload}
                />
                <ToggleRow
                  label="Add Column"
                  description="Show an Add Column button above the table."
                  value={enableAddColumn}
                  onChange={setEnableAddColumn}
                />

                {groupModalOpen && (
                  <AddGroupModal
                    initial={groupModalOpen.initial}
                    onClose={() => setGroupModalOpen(null)}
                    onApply={val => {
                      setGroupByCols(prev => {
                        if (groupModalOpen.editIndex != null) {
                          const copy = [...prev]; copy[groupModalOpen.editIndex] = val; return copy
                        }
                        return [...prev, val]
                      })
                      setGroupModalOpen(null)
                    }}
                  />
                )}
                {aggColModalOpen && (
                  <AddAggregateModal
                    initial={aggColModalOpen.initial}
                    onClose={() => setAggColModalOpen(null)}
                    onApply={val => {
                      setAggregateByCols(prev => {
                        if (aggColModalOpen.editIndex != null) {
                          const copy = [...prev]; copy[aggColModalOpen.editIndex] = val; return copy
                        }
                        return [...prev, val]
                      })
                      setAggColModalOpen(null)
                    }}
                  />
                )}
              </>
            ) : isPie ? (
              <>
                <FieldRow label="Attribute" hint="Define how to divide sections in pie">
                  <FieldRow label="Classification">
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
                </FieldRow>
                {filterModalOpen && (
                  <GraphFilterModal
                    scopeEntities={scopeEntities}
                    currentAttr={classification}
                    onClose={() => setFilterModalOpen(false)}
                    onApply={attr => { setClassification(attr); setAttributeTouched(true); setFilterModalOpen(false) }}
                  />
                )}
                <FieldRow label="Size" hint="Display total/distinct count in the center of pie chart">
                  <div className="dc-axis-row dc-axis-row--with-action">
                    <div className="dc-axis-col">
                      <div className="dc-axis-label">Operation</div>
                      <SelectInput value={operation} onChange={e => setOperation(e.target.value)} options={[{ value:'count-distinct',label:'Count Distinct'},{ value:'count',label:'Count'},{ value:'sum',label:'Sum'},{ value:'avg',label:'Avg'}]} />
                    </div>
                    <div className="dc-axis-col">
                      <div className="dc-axis-label">Aggregate By</div>
                      <SelectInput value={aggregateBy} onChange={e => setAggregateBy(e.target.value)} options={[{ value:'host',label:'Host'},{ value:'entity-id',label:'Entity ID'},{ value:'ip',label:'IP Address'}]} />
                    </div>
                    <button
                      className="dc-kg-btn dc-kg-btn--bottom"
                      onClick={() => setAggregateByModalOpen(true)}
                      style={{ '--dc-indigo': PAI.indigo, '--dc-indigo-tint': PAI.indigoTint }}
                    >
                      <img src="assets/icons/graph-filter.svg" width={18} height={18} alt="" />
                    </button>
                  </div>
                </FieldRow>
                {aggregateByModalOpen && (
                  <GraphFilterModal
                    scopeEntities={scopeEntities}
                    currentAttr={aggregateBy}
                    onClose={() => setAggregateByModalOpen(false)}
                    onApply={attr => { setAggregateBy(attr); setAggregateByModalOpen(false) }}
                  />
                )}
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
                    scopeEntities={scopeEntities}
                    currentAttr={classification}
                    onClose={() => setFilterModalOpen(false)}
                    onApply={attr => { setClassification(attr); setAttributeTouched(true); setFilterModalOpen(false) }}
                  />
                )}

                <FieldRow label="Size" hint="Display total/distinct count in the vertical bar chart">
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
                      onClick={() => setAggregateByModalOpen(true)}
                      style={{ '--dc-indigo': PAI.indigo, '--dc-indigo-tint': PAI.indigoTint }}
                    >
                      <img src="assets/icons/graph-filter.svg" width={18} height={18} alt="" />
                    </button>
                  </div>
                </FieldRow>
                {aggregateByModalOpen && (
                  <GraphFilterModal
                    scopeEntities={scopeEntities}
                    currentAttr={aggregateBy}
                    onClose={() => setAggregateByModalOpen(false)}
                    onApply={attr => { setAggregateBy(attr); setAggregateByModalOpen(false) }}
                  />
                )}
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
                  <WidgetFilterChips
                    filters={widgetFilters}
                    onRemove={i => setWidgetFilters(prev => prev.filter((_, j) => j !== i))}
                    onClear={() => setWidgetFilters([])}
                    showEntity={showFilterEntity}
                  />
                </FieldRow>
                {widgetFilterModalOpen && (
                  <GraphFilterModal
                    scopeEntities={scopeEntities}
                    mode="filter"
                    existingFilters={widgetFilters}
                    onClose={() => setWidgetFilterModalOpen(false)}
                    onApply={filters => { setWidgetFilters(filters); setWidgetFilterModalOpen(false) }}
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
                  label="Limit To Top Values"
                  description="Only show the top values by size; the rest are grouped out of the chart"
                  value={limitTopValues}
                  onChange={setLimitTopValues}
                  tooltip="Composition charts are most effective when the number of values are below 10. Limiting the values improves chart readability and performance."
                />
                {limitTopValues && (
                  <FieldRow>
                    <div className="dc-text-input-wrap">
                      <input
                        type="number"
                        min={1}
                        value={topValuesCount}
                        onChange={e => setTopValuesCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="dc-text-input"
                        style={{ '--dc-input-color': PAI.fg1 }}
                      />
                    </div>
                  </FieldRow>
                )}
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
                    scopeEntities={scopeEntities}
                    currentAttr={classification}
                    onClose={() => setFilterModalOpen(false)}
                    onApply={attr => { setClassification(attr); setAttributeTouched(true); setFilterModalOpen(false) }}
                  />
                )}

                <FieldRow label="Size" hint="Display total/distinct count in the horizontal bar chart">
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
                      onClick={() => setAggregateByModalOpen(true)}
                      style={{ '--dc-indigo': PAI.indigo, '--dc-indigo-tint': PAI.indigoTint }}
                    >
                      <img src="assets/icons/graph-filter.svg" width={18} height={18} alt="" />
                    </button>
                  </div>
                </FieldRow>
                {aggregateByModalOpen && (
                  <GraphFilterModal
                    scopeEntities={scopeEntities}
                    currentAttr={aggregateBy}
                    onClose={() => setAggregateByModalOpen(false)}
                    onApply={attr => { setAggregateBy(attr); setAggregateByModalOpen(false) }}
                  />
                )}
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
                  <WidgetFilterChips
                    filters={widgetFilters}
                    onRemove={i => setWidgetFilters(prev => prev.filter((_, j) => j !== i))}
                    onClear={() => setWidgetFilters([])}
                    showEntity={showFilterEntity}
                  />
                </FieldRow>
                {widgetFilterModalOpen && (
                  <GraphFilterModal
                    scopeEntities={scopeEntities}
                    mode="filter"
                    existingFilters={widgetFilters}
                    onClose={() => setWidgetFilterModalOpen(false)}
                    onApply={filters => { setWidgetFilters(filters); setWidgetFilterModalOpen(false) }}
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
                  label="Limit To Top Values"
                  description="Only show the top values by size; the rest are grouped out of the chart"
                  value={limitTopValues}
                  onChange={setLimitTopValues}
                  tooltip="Composition charts are most effective when the number of values are below 10. Limiting the values improves chart readability and performance."
                />
                {limitTopValues && (
                  <FieldRow>
                    <div className="dc-text-input-wrap">
                      <input
                        type="number"
                        min={1}
                        value={topValuesCount}
                        onChange={e => setTopValuesCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="dc-text-input"
                        style={{ '--dc-input-color': PAI.fg1 }}
                      />
                    </div>
                  </FieldRow>
                )}
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
                    scopeEntities={scopeEntities}
                    currentAttr={magnitude}
                    onClose={() => setMagnitudeModalOpen(false)}
                    onApply={attr => { setMagnitude(attr); setMagnitudeModalOpen(false) }}
                  />
                )}
                {stackClassModalOpen && (
                  <GraphFilterModal
                    scopeEntities={scopeEntities}
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
                      onClick={() => setAggregateByModalOpen(true)}
                      style={{ '--dc-indigo': PAI.indigo, '--dc-indigo-tint': PAI.indigoTint }}
                    >
                      <img src="assets/icons/graph-filter.svg" width={18} height={18} alt="" />
                    </button>
                  </div>
                </FieldRow>
                {aggregateByModalOpen && (
                  <GraphFilterModal
                    scopeEntities={scopeEntities}
                    currentAttr={aggregateBy}
                    onClose={() => setAggregateByModalOpen(false)}
                    onApply={attr => { setAggregateBy(attr); setAggregateByModalOpen(false) }}
                  />
                )}

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
                  <WidgetFilterChips
                    filters={widgetFilters}
                    onRemove={i => setWidgetFilters(prev => prev.filter((_, j) => j !== i))}
                    onClear={() => setWidgetFilters([])}
                    showEntity={showFilterEntity}
                  />
                </FieldRow>
                {widgetFilterModalOpen && (
                  <GraphFilterModal
                    scopeEntities={scopeEntities}
                    mode="filter"
                    existingFilters={widgetFilters}
                    onClose={() => setWidgetFilterModalOpen(false)}
                    onApply={filters => { setWidgetFilters(filters); setWidgetFilterModalOpen(false) }}
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
                    scopeEntities={scopeEntities}
                    currentAttr={magnitude}
                    onClose={() => setMagnitudeModalOpen(false)}
                    onApply={attr => { setMagnitude(attr); setMagnitudeModalOpen(false) }}
                  />
                )}
                {stackClassModalOpen && (
                  <GraphFilterModal
                    scopeEntities={scopeEntities}
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
                      onClick={() => setAggregateByModalOpen(true)}
                      style={{ '--dc-indigo': PAI.indigo, '--dc-indigo-tint': PAI.indigoTint }}
                    >
                      <img src="assets/icons/graph-filter.svg" width={18} height={18} alt="" />
                    </button>
                  </div>
                </FieldRow>
                {aggregateByModalOpen && (
                  <GraphFilterModal
                    scopeEntities={scopeEntities}
                    currentAttr={aggregateBy}
                    onClose={() => setAggregateByModalOpen(false)}
                    onApply={attr => { setAggregateBy(attr); setAggregateByModalOpen(false) }}
                  />
                )}

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
                  <WidgetFilterChips
                    filters={widgetFilters}
                    onRemove={i => setWidgetFilters(prev => prev.filter((_, j) => j !== i))}
                    onClear={() => setWidgetFilters([])}
                    showEntity={showFilterEntity}
                  />
                </FieldRow>
                {widgetFilterModalOpen && (
                  <GraphFilterModal
                    scopeEntities={scopeEntities}
                    mode="filter"
                    existingFilters={widgetFilters}
                    onClose={() => setWidgetFilterModalOpen(false)}
                    onApply={filters => { setWidgetFilters(filters); setWidgetFilterModalOpen(false) }}
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
            ) : isKpi ? null : isLine ? (
              // Same two-attribute shape as the stacked charts (Magnitude +
              // Classification, both pre-selected via the shared defaults
              // rather than an empty placeholder field) — a line chart plots
              // one line per Magnitude value, classified along the x-axis.
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
                    scopeEntities={scopeEntities}
                    currentAttr={magnitude}
                    onClose={() => setMagnitudeModalOpen(false)}
                    onApply={attr => { setMagnitude(attr); setTitle(t => (t === magnitude ? attr : t)); setMagnitudeModalOpen(false) }}
                  />
                )}
                {stackClassModalOpen && (
                  <GraphFilterModal
                    scopeEntities={scopeEntities}
                    currentAttr={classification}
                    onClose={() => setStackClassModalOpen(false)}
                    onApply={attr => { setClassification(attr); setAttributeTouched(true); setStackClassModalOpen(false) }}
                  />
                )}

                <FieldRow label="Size" hint="Display total/distinct count in the line chart">
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
                      onClick={() => setAggregateByModalOpen(true)}
                      style={{ '--dc-indigo': PAI.indigo, '--dc-indigo-tint': PAI.indigoTint }}
                    >
                      <img src="assets/icons/graph-filter.svg" width={18} height={18} alt="" />
                    </button>
                  </div>
                </FieldRow>
                {aggregateByModalOpen && (
                  <GraphFilterModal
                    scopeEntities={scopeEntities}
                    currentAttr={aggregateBy}
                    onClose={() => setAggregateByModalOpen(false)}
                    onApply={attr => { setAggregateBy(attr); setAggregateByModalOpen(false) }}
                  />
                )}

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
                  <WidgetFilterChips
                    filters={widgetFilters}
                    onRemove={i => setWidgetFilters(prev => prev.filter((_, j) => j !== i))}
                    onClear={() => setWidgetFilters([])}
                    showEntity={showFilterEntity}
                  />
                </FieldRow>
                {widgetFilterModalOpen && (
                  <GraphFilterModal
                    scopeEntities={scopeEntities}
                    mode="filter"
                    existingFilters={widgetFilters}
                    onClose={() => setWidgetFilterModalOpen(false)}
                    onApply={filters => { setWidgetFilters(filters); setWidgetFilterModalOpen(false) }}
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
            ) : null}

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
                    <button
                      className="dc-kg-btn dc-kg-btn--bottom"
                      onClick={() => setAggregateByModalOpen(true)}
                      style={{ '--dc-indigo': PAI.indigo, '--dc-indigo-tint': PAI.indigoTint }}
                    >
                      <img src="assets/icons/graph-filter.svg" width={18} height={18} alt="" />
                    </button>
                  </div>
                  <div className="dc-mt12 dc-mb16">
                    <div className="dc-field-label dc-field-label--icon-row">
                      Widget Filter
                      <InfoTooltip text="Apply widget-specific filters to refine the displayed data. These filters only affect this widget and do not impact the entire dashboard." />
                    </div>
                    <div className="dc-text-input-wrap">
                      <input readOnly placeholder="Select Widget Filter" className="dc-text-input" style={{ '--dc-input-color': PAI.fg3 }} />
                      <button
                        className="dc-kg-btn"
                        onClick={() => setKpiFilterModalOpen(true)}
                        style={{ '--dc-indigo': PAI.indigo, '--dc-indigo-tint': PAI.indigoTint }}
                      >
                        <img src="assets/icons/graph-filter.svg" width={18} height={18} alt="" />
                      </button>
                    </div>
                    {kpiFilters.length > 0 && (
                      <div className="dc-chips">
                        {kpiFilters.map((f, i) => (
                          <span key={i} className="dc-chip">
                            {filterChipLabel(f, showFilterEntity)}
                            <button
                              className="dc-chip-x"
                              onClick={() => setKpiFilters(prev => prev.filter((_, j) => j !== i))}
                            >×</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {aggregateByModalOpen && (
                  <GraphFilterModal
                    scopeEntities={scopeEntities}
                    currentAttr={aggregateBy}
                    onClose={() => setAggregateByModalOpen(false)}
                    onApply={attr => { setAggregateBy(attr); setAggregateByModalOpen(false) }}
                  />
                )}
                {kpiFilterModalOpen && (
                  <GraphFilterModal
                    scopeEntities={scopeEntities}
                    mode="filter"
                    existingFilters={kpiFilters}
                    onClose={() => setKpiFilterModalOpen(false)}
                    onApply={filters => { setKpiFilters(filters); setKpiFilterModalOpen(false) }}
                  />
                )}
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
                    <button
                      className="dc-kg-btn dc-kg-btn--bottom"
                      onClick={() => setKpiCompAggregateByModalOpen(true)}
                      style={{ '--dc-indigo': PAI.indigo, '--dc-indigo-tint': PAI.indigoTint }}
                    >
                      <img src="assets/icons/graph-filter.svg" width={18} height={18} alt="" />
                    </button>
                  </div>
                  <div className="dc-mt12">
                    <div className="dc-field-label dc-field-label--icon-row">
                      Comparison Metric Filter
                      <InfoTooltip text="Apply a filter that affects only the Comparison Metric value. It does not change the Primary Metric or the rest of the dashboard." />
                    </div>
                    <div className="dc-text-input-wrap">
                      <input readOnly placeholder="Select Widget Filter" className="dc-text-input" style={{ '--dc-input-color': PAI.fg3 }} />
                      <button
                        className="dc-kg-btn"
                        onClick={() => setKpiCompFilterModalOpen(true)}
                        style={{ '--dc-indigo': PAI.indigo, '--dc-indigo-tint': PAI.indigoTint }}
                      >
                        <img src="assets/icons/graph-filter.svg" width={18} height={18} alt="" />
                      </button>
                    </div>
                    {kpiCompFilters.length > 0 && (
                      <div className="dc-chips">
                        {kpiCompFilters.map((f, i) => (
                          <span key={i} className="dc-chip">
                            {filterChipLabel(f, showFilterEntity)}
                            <button
                              className="dc-chip-x"
                              onClick={() => setKpiCompFilters(prev => prev.filter((_, j) => j !== i))}
                            >×</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {kpiCompAggregateByModalOpen && (
                  <GraphFilterModal
                    scopeEntities={scopeEntities}
                    currentAttr={kpiCompAggregateBy}
                    onClose={() => setKpiCompAggregateByModalOpen(false)}
                    onApply={attr => { setKpiCompAggregateBy(attr); setKpiCompAggregateByModalOpen(false) }}
                  />
                )}
                {kpiCompFilterModalOpen && (
                  <GraphFilterModal
                    scopeEntities={scopeEntities}
                    mode="filter"
                    existingFilters={kpiCompFilters}
                    onClose={() => setKpiCompFilterModalOpen(false)}
                    onApply={filters => { setKpiCompFilters(filters); setKpiCompFilterModalOpen(false) }}
                  />
                )}
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

            {!isPie && !isTable && !isAggTable && !isVertBar && !isHorBar && !isHeading && !isStackVert && !isStackHor && !isLine && !isKpi && (
              <>
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
                  <WidgetFilterChips
                    filters={widgetFilters}
                    onRemove={i => setWidgetFilters(prev => prev.filter((_, j) => j !== i))}
                    onClear={() => setWidgetFilters([])}
                    showEntity={showFilterEntity}
                  />
                </FieldRow>
                {widgetFilterModalOpen && (
                  <GraphFilterModal
                    scopeEntities={scopeEntities}
                    mode="filter"
                    existingFilters={widgetFilters}
                    onClose={() => setWidgetFilterModalOpen(false)}
                    onApply={filters => { setWidgetFilters(filters); setWidgetFilterModalOpen(false) }}
                  />
                )}
              </>
            )}

            {!isPie && !isTable && !isAggTable && !isVertBar && !isHorBar && !isHeading && !isStackVert && !isStackHor && !isLine && !isKpi && (
              <FieldRow label="Sort By" hint="Define how data is ordered in chart">
                <TextInput placeholder="Select field" />
              </FieldRow>
            )}

            {isPie && (
              <>
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
                  <WidgetFilterChips
                    filters={widgetFilters}
                    onRemove={i => setWidgetFilters(prev => prev.filter((_, j) => j !== i))}
                    onClear={() => setWidgetFilters([])}
                    showEntity={showFilterEntity}
                  />
                </FieldRow>
                {widgetFilterModalOpen && (
                  <GraphFilterModal
                    scopeEntities={scopeEntities}
                    mode="filter"
                    existingFilters={widgetFilters}
                    onClose={() => setWidgetFilterModalOpen(false)}
                    onApply={filters => { setWidgetFilters(filters); setWidgetFilterModalOpen(false) }}
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
                <ToggleRow
                  label="Limit To Top Values"
                  description="Only show the top values by size; the rest are grouped out of the chart"
                  value={limitTopValues}
                  onChange={setLimitTopValues}
                  tooltip="Composition charts are most effective when the number of values are below 10. Limiting the values improves chart readability and performance."
                />
                {limitTopValues && (
                  <FieldRow>
                    <div className="dc-text-input-wrap">
                      <input
                        type="number"
                        min={1}
                        value={topValuesCount}
                        onChange={e => setTopValuesCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="dc-text-input"
                        style={{ '--dc-input-color': PAI.fg1 }}
                      />
                    </div>
                  </FieldRow>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="dc-panel-footer">
        {isBannerChart && (
          <ValuesCountBanner shown={shownAggregateValues} total={totalAggregateValues} />
        )}
        <div className="dc-panel-footer-actions">
          <button onClick={onClose} className="ds-btn sz-md t-outline">Cancel</button>
          <button
            onClick={() => {
              const changes = {
                label: title, description, sizeId, heightId, chartId: chartType,
                showTotalCount, showPctChange, showLegend,
                chartColors,
                ...(isTable                                    && { columns, enableDownload, enableAddColumn }),
                ...(isAggTable                                 && { groupByCols, aggregateByCols, enableDownload, enableAddColumn, explodeArrayFields }),
                ...((isVertBar || isHorBar || isPie)          && { classification, limitTopValues, topValuesCount }),
                ...(isStackVert                               && { magnitude, classification, explodeArrayFields }),
                ...(isStackHor                                && { magnitude, classification, explodeArrayFields }),
                ...(isLine                                    && { magnitude, classification, explodeArrayFields }),
                ...(isHeading                                 && { exploreIn }),
                ...(isKpi                                     && { valueFontSize }),
                ...(isKpi && !widget.dataLocked                && { data: buildKpiMockData(aggregateBy, showTotalCount) }),
              }
              const highCardinality = isBannerChart && shownAggregateValues >= 501
              if (highCardinality && !suppressPerfWarning) {
                setDontWarnAgain(false)
                setPerfWarningPending(changes)
              } else {
                onSaveChanges(changes)
              }
            }}
            className="ds-btn sz-md t-primary"
          >Apply</button>
        </div>
      </div>

      {perfWarningPending && (
        <div className="ds-modal-overlay">
          <div className="ds-modal">
            <div className="ds-modal-header">
              <span className="ds-modal-title warning dc-scope-confirm-modal-title">
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                  <path d="M8.762 3.569L13.388 11.6C13.712 12.167 13.293 12.866 12.626 12.866H3.374C2.706 12.866 2.287 12.167 2.612 11.6L7.238 3.569C7.571 2.989 8.429 2.989 8.762 3.569Z" stroke="var(--pai-med-fg)" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 9.058V6.942" stroke="var(--pai-med-fg)" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="8" cy="10.962" r="0.635" fill="var(--pai-med-fg)"/>
                </svg>
                Performance Impact Warning
              </span>
              <button className="ds-modal-close" onClick={() => setPerfWarningPending(null)} aria-label="Close">✕</button>
            </div>
            <div className="ds-modal-body">
              <p>This widget has a high number of distinct values which could affect chart readability and dashboard performance. Are you sure you want to continue?</p>
              <div className="dc-modal-checkbox-row">
                <input type="checkbox" checked={dontWarnAgain} onChange={e => setDontWarnAgain(e.target.checked)} className="dc-gf-checkbox" id="perf-warning-dont-ask" />
                <label htmlFor="perf-warning-dont-ask">Don't warn me again for this dashboard</label>
              </div>
            </div>
            <div className="ds-modal-footer">
              <button className="ds-btn sz-md t-outline" onClick={() => setPerfWarningPending(null)}>Optimize Widget</button>
              <button
                className="ds-btn sz-md t-primary"
                onClick={() => {
                  if (dontWarnAgain) onSuppressPerfWarning?.()
                  onSaveChanges(perfWarningPending)
                  setPerfWarningPending(null)
                }}
              >Continue</button>
            </div>
          </div>
        </div>
      )}
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
        <div className="dc-size-section" style={{ '--dc-fg1': PAI.fg1, '--dc-fg3': PAI.fg3 }}>
          <div className="dc-size-section-heading">Widget Size</div>
          <div className="dc-size-sub-row">
            <div className="dc-size-sub-label">Width</div>
            <SegmentedTabs value={widgetSize} options={WIDGET_SIZE_TABS} onChange={setWidgetSize} fullWidth height={32} />
          </div>
          <div className="dc-size-sub-row">
            <div className="dc-size-sub-label">Height</div>
            <SegmentedTabs value={widgetHeight} options={WIDGET_HEIGHT_TABS} onChange={setWidgetHeight} fullWidth height={32} />
          </div>
        </div>
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
function WidgetCardImpl({
  widget, isEditing, onEdit, onRequestDelete, onEditWithCopilot, onNav, reportMode, viewMode = false, printMode = false,
  // Nested-widget support: `nested` is true for a widget rendered inside
  // another widget's container (no grid position of its own, no further
  // nesting). The generic (id-based, rather than pre-bound) callbacks below
  // let this component recurse into `widget.children` using itself.
  nested = false, editingWidgetId = null, onEditWidget, onDeleteWidget, onAddNested, addingNestedParentId = null, addingNestedDraft = null,
  onNestedLayoutChange,
  // Cross-grid nesting: `isNestTarget` is true while another top-level
  // widget is being dragged over this one (a valid drop-to-nest target —
  // see the top-level GridLayout's onDrag below), and `onPromoteNested`
  // fires when a widget dragged out of THIS card's own nested grid crosses
  // its bounds, to lift it back onto the top-level canvas.
  isNestTarget = false, onPromoteNested,
}) {
  const [hovered, setHovered]         = useState(false)
  const [exploreOpen, setExploreOpen] = useState(false)
  const exploreRef                    = useRef(null)
  const h = widget.gh ? widget.gh * ROW_UNIT_PX : widgetHeightPx(widget)
  const gw = widget.gw || legacyGw(widget)
  const isTableWidget = widget.chartId === 'table' || widget.chartId === 'agg-table'
  // Rendered inside ChartRender's own table toolbar (alongside the title,
  // Search Any, and Add Column) rather than here in the card header, so all
  // four sit on one line above the table — see the title span below, which
  // is suppressed here for table widgets for the same reason.
  const showDownload = isTableWidget && widget.enableDownload !== false && !reportMode
  const showExploreIn = widget.chartId === 'heading' && widget.exploreIn && !reportMode && !printMode
  // True once this widget is actively hosting nested widgets (or is about
  // to, mid-add) — caps its own content to its base height instead of
  // letting it stretch to fill the extra room reserved for them.
  const isContainer = !nested && (widget.children?.length > 0 || addingNestedParentId === widget.id)

  useEffect(() => {
    if (!exploreOpen) return
    const handler = e => { if (exploreRef.current && !exploreRef.current.contains(e.target)) setExploreOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [exploreOpen])

  return (
    <div
      className={reportMode ? 'dc-report-widget' : 'dc-widget-col'}
      // Read by the top-level GridLayout's onDrag (elementsFromPoint hit-
      // testing) to identify which widget a drag is currently hovering over,
      // for the drag-to-nest affordance — only meaningful for top-level
      // (non-nested) cards, which is the only case this ever needs to resolve.
      data-widget-id={!nested ? widget.id : undefined}
      style={{
        '--dc-fg1': PAI.fg1,
        '--dc-fg3': PAI.fg3,
        '--dc-indigo': PAI.indigo,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Hover actions */}
      {hovered && !reportMode && !viewMode && (
        <div className="dc-widget-actions">
          <button title="Move" className="dc-action-btn dc-action-btn--grab">
            <img src="assets/icons/lcnc/drag-widget.svg" width={16} height={16} alt="drag" />
          </button>
          {!nested && (
            <button title="Add nested widget" onClick={() => onAddNested?.(widget.id)} className="dc-action-btn">
              <img src="assets/icons/lcnc/add-widget.svg" width={16} height={16} alt="add widget" />
            </button>
          )}
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
        className={`dc-widget-card${widget.chartId === 'kpi' ? ' dc-widget-card--kpi' : ''}${isNestTarget ? ' dc-widget-card--nest-target' : ''}`}
        style={{
          '--dc-card-border': isEditing ? `1.5px dashed ${PAI.indigo}` : '1px solid var(--shell-border)',
          '--dc-card-height': `${h}px`,
        }}
      >
        {/* Drag-to-nest affordance: shown on whichever other top-level
            widget a dragged widget is currently hovering over (see the
            top-level GridLayout's onDrag) — a purple line around the card
            plus a label naming the drop behavior, so nesting is never a
            silent/tooltip-only state. */}
        {isNestTarget && (
          <div className="dc-nest-target-label">Drop to nest inside</div>
        )}
        <div className="dc-widget-card-header">
          <div className={`dc-widget-card-title-row${widget.chartId === 'kpi' ? ' dc-widget-card-title-row--center' : ''}`}>
            {!isTableWidget && (
              <span className="dc-widget-card-title">{widget.label}</span>
            )}
            {showExploreIn && (
              <div ref={exploreRef} className="subheader__explore-wrap" onMouseDown={e => e.stopPropagation()}>
                <button
                  onClick={() => setExploreOpen(o => !o)}
                  disabled={!viewMode}
                  className={`subheader__explore-btn${exploreOpen ? ' subheader__explore-btn--open' : ''}`}
                >
                  <img src="assets/icons/Explore-in.svg" width={13} height={13} alt="" />
                  Explore in
                  <Ic size={11} path={<><path d="m6 9 6 6 6-6"/></>} />
                </button>
                {exploreOpen && (
                  <div className="subheader__explore-dropdown">
                    {EXPLORE_GROUPS.map((group, gi) => (
                      <div key={group.label}>
                        {gi > 0 && <div className="subheader__explore-divider" />}
                        <div className="subheader__explore-group">
                          <img src={`assets/icons/${group.icon}.svg`} width={13} height={13} alt="" style={{ opacity: 0.5 }} />
                          <span className="subheader__explore-group-label">{group.label}</span>
                        </div>
                        {group.items.map(item => (
                          <button
                            key={item.label}
                            onClick={() => { setExploreOpen(false); onNav && onNav(item.id) }}
                            className="subheader__explore-item"
                          >
                            <img src={`assets/icons/${item.icon}.svg`} width={14} height={14} alt="" />
                            {item.label}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          {widget.chartId === 'kpi' && widget.description && (
            <div className="dc-widget-card-desc dc-widget-card-desc--center">{widget.description}</div>
          )}
        </div>
        <div className={`dc-widget-card-body${isContainer ? ' dc-widget-card-body--has-nested' : ''}${widget.chartId === 'kpi' ? ' dc-widget-card-body--kpi' : ''}`}>
          {isContainer ? (
            // A container's own content is capped to its true base height
            // (ownContentGh — its own heightId preset, or just the type's
            // minimum floor for a type like 'heading' whose body is always
            // empty regardless of heightId) instead of stretching — via
            // ChartRender's internal flex:1 — to fill the full inflated
            // card height. The nested area below gets whatever's left,
            // instead of a large empty gap above it.
            <div className="dc-widget-own-content" style={{ '--dc-own-content-h': `${ownContentGh(widget) * ROW_UNIT_PX}px` }}>
              <ChartRender chartId={widget.chartId} showPctChange={widget.showPctChange ?? true} showLegend={widget.showLegend ?? true} showTotalCount={widget.showTotalCount ?? true} data={widget.data} totalLabel={widget.totalLabel} noteLabel={widget.noteLabel} note={widget.note} legendDesc={widget.legendDesc} columns={widget.columns} chartColors={widget.chartColors} description={widget.description} xLabel={widget.xLabel} yLabel={widget.yLabel} reportTotal={widget.reportTotal} valueFontSize={widget.valueFontSize} cardCols={gw} cardHeight={ownContentGh(widget) * ROW_UNIT_PX} printMode={printMode} enableAddColumn={widget.enableAddColumn === true && !reportMode} enableDownload={showDownload} title={widget.label} />
            </div>
          ) : (
            <ChartRender chartId={widget.chartId} showPctChange={widget.showPctChange ?? true} showLegend={widget.showLegend ?? true} showTotalCount={widget.showTotalCount ?? true} data={widget.data} totalLabel={widget.totalLabel} noteLabel={widget.noteLabel} note={widget.note} legendDesc={widget.legendDesc} columns={widget.columns} chartColors={widget.chartColors} description={widget.description} xLabel={widget.xLabel} yLabel={widget.yLabel} reportTotal={widget.reportTotal} valueFontSize={widget.valueFontSize} cardCols={gw} cardHeight={h} printMode={printMode} enableAddColumn={widget.enableAddColumn === true && !reportMode} enableDownload={showDownload} title={widget.label} />
          )}
          {/* Nested widgets — one level deep only (a nested card never gets
              its own "Add nested widget" action, so `children` never gets
              populated on a widget rendered with `nested`). Report mode has
              no grid interaction anywhere on the page, so it gets a plain
              static stack instead of a live drag/resize grid. */}
          {!nested && reportMode && widget.children?.length > 0 && (
            <div className="dc-nested-widgets">
              {widget.children.map(child => (
                <WidgetCard
                  key={child.id}
                  widget={child}
                  nested
                  isEditing={false}
                  onEdit={() => {}}
                  onRequestDelete={() => {}}
                  onEditWithCopilot={onEditWithCopilot}
                  onNav={onNav}
                  reportMode
                  printMode={printMode}
                />
              ))}
            </div>
          )}
          {!nested && !reportMode && widget.children?.length > 0 && (
            <NestedWidgetGrid
              parent={widget}
              editingWidgetId={editingWidgetId}
              onEditWidget={onEditWidget}
              onDeleteWidget={onDeleteWidget}
              onEditWithCopilot={onEditWithCopilot}
              onNav={onNav}
              onLayoutChange={layout => onNestedLayoutChange?.(widget.id, layout)}
              onPromoteToTop={childId => onPromoteNested?.(widget.id, childId)}
              viewMode={viewMode}
              printMode={printMode}
            />
          )}
          {!nested && !reportMode && !viewMode && addingNestedParentId === widget.id && addingNestedDraft && (
            <div className="dc-nested-add-preview" style={{ '--dc-nested-add-h': `${addingNestedDraft.heightPx}px` }}>
              <div className="dc-preview-card">
                <div className="dc-preview-header">
                  <span className="dc-preview-title">
                    {addingNestedDraft.title || (addingNestedDraft.chartId ? (CHART_DEFAULT_NAMES[addingNestedDraft.chartId] || CHART_TYPES.find(c => c.id === addingNestedDraft.chartId)?.label) : '')}
                  </span>
                  {addingNestedDraft.description && <div className="dc-preview-desc">{addingNestedDraft.description}</div>}
                </div>
                <div className="dc-preview-body">
                  {addingNestedDraft.chartId && <ChartSilhouette chartId={addingNestedDraft.chartId} />}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Nested widget grid ──────────────────────────────────────────────────
// A container's own small react-grid-layout instance, scoped to its card —
// gives nested widgets the same drag-to-move/resize-to-fit interaction as
// top-level ones (so two can be dragged side by side to go horizontal),
// just confined to the parent's bounds instead of the whole dashboard.
// Reuses the same grid-unit system (GRID_COLS/ROW_UNIT_PX/packWidgets) as
// the top-level grid — only the pixel width fed to it differs.
function NestedWidgetGrid({ parent, editingWidgetId, onEditWidget, onDeleteWidget, onEditWithCopilot, onNav, onLayoutChange, onPromoteToTop, viewMode, printMode }) {
  const [gridEl, setGridEl] = useState(null)
  const gridWrapRef = useCallback(node => setGridEl(node), [])
  const [gridWidth, setGridWidth] = useState(0)
  useEffect(() => {
    if (!gridEl) return
    const ro = new ResizeObserver(([entry]) => setGridWidth(entry.contentRect.width))
    ro.observe(gridEl)
    return () => ro.disconnect()
  }, [gridEl])

  // Drag-out-to-canvas: while a nested widget is being dragged, track
  // whether the pointer has crossed outside this container's own bounds —
  // if so, dropping it there promotes it back onto the top-level canvas
  // (via onPromoteToTop) instead of committing a nested-layout reorder.
  // Read via a ref (not just state) inside onDragStop, since RGL's own event
  // there carries the final pointer position but state set from the last
  // onDrag frame is guaranteed to have flushed by the time the gesture ends.
  const [draggingChildId, setDraggingChildId] = useState(null)
  const [willDragOut, setWillDragOut] = useState(false)
  const willDragOutRef = useRef(false)
  const OUTSIDE_MARGIN_PX = 24

  const packed = useMemo(() => packWidgets(parent.children || []), [parent.children])
  // minGw from minSizeFor is calibrated for the top-level canvas, where 12
  // columns typically span 1000px+ (3 columns is a legitimate ~300px chart).
  // Reused as-is at a container's much narrower scale (often ~250-400px
  // total), the same 3-column floor lets a chart get resized down to
  // 60-100px — too narrow for Recharts to lay out sensibly (it starts
  // warning about negative computed dimensions and the layout destabilizes
  // around it). Raise the floor, in columns, to whatever this specific
  // nested grid's current column width requires for a ~150px minimum.
  const minNestedGw = gridWidth > 0 ? Math.ceil(150 / (gridWidth / GRID_COLS)) : MIN_GW
  const layout = useMemo(() => packed.map(c => {
    const { minGw, minGh } = minSizeFor(c.chartId)
    return { i: String(c.id), x: c.gx, y: c.gy, w: c.gw, h: c.gh, minW: Math.max(minGw, minNestedGw), minH: minGh, maxW: MAX_GW, maxH: MAX_GH }
  }), [packed, minNestedGw])

  return (
    // onMouseDown stops here, before it can bubble to the top-level grid's
    // own item root: a nested card's header matches the same
    // `.dc-widget-card-header` selector the outer GridLayout uses as its
    // draggableHandle (WidgetCard is shared between top-level and nested
    // rendering), and that outer node is an ancestor of this wrap — so
    // without this, pressing a nested header's drag handle fired BOTH
    // grids' react-draggable at once, and the outer one (dragging the
    // whole container widget) won under contention, leaving the nested
    // grid's own drag looking like a no-op.
    <div className="dc-nested-grid-wrap" ref={gridWrapRef} onMouseDown={e => e.stopPropagation()}>
      {/* Drag-out hint — appears only once the pointer has actually crossed
          this container's bounds, confirming the drop that's about to
          happen (not shown for the whole drag, just this one state). */}
      {draggingChildId != null && willDragOut && (
        <div className="dc-nested-dragout-hint">Release to move onto the canvas</div>
      )}
      {gridWidth > 0 && (
        <GridLayout
          className="dc-nested-grid-inner"
          layout={layout}
          cols={GRID_COLS}
          rowHeight={ROW_UNIT_PX}
          margin={[GRID_GAP_PX, GRID_GAP_PX]}
          containerPadding={[0, 0]}
          width={gridWidth}
          draggableHandle=".dc-action-btn--grab, .dc-widget-card-header, .cr-kg-title-row"
          resizeHandles={['se']}
          transformScale={1}
          useCSSTransforms
          compactType="vertical"
          isDraggable={!viewMode}
          isResizable={!viewMode}
          onDragStart={(layout, oldItem) => { setDraggingChildId(oldItem.i); setWillDragOut(false); willDragOutRef.current = false }}
          onDrag={(layout, oldItem, newItem, placeholder, e) => {
            if (!gridEl) return
            const r = gridEl.getBoundingClientRect()
            const outside = e.clientX < r.left - OUTSIDE_MARGIN_PX || e.clientX > r.right + OUTSIDE_MARGIN_PX ||
                             e.clientY < r.top - OUTSIDE_MARGIN_PX || e.clientY > r.bottom + OUTSIDE_MARGIN_PX
            willDragOutRef.current = outside
            setWillDragOut(outside)
          }}
          onDragStop={(layout, oldItem) => {
            const childId = Number(oldItem.i)
            setDraggingChildId(null)
            setWillDragOut(false)
            if (willDragOutRef.current) onPromoteToTop?.(childId)
            else onLayoutChange(layout)
          }}
          onResizeStop={onLayoutChange}
        >
          {packed.map(c => (
            <div key={String(c.id)}>
              <WidgetCard
                widget={c}
                nested
                isEditing={editingWidgetId === c.id}
                onEdit={() => onEditWidget?.(c.id)}
                onRequestDelete={() => onDeleteWidget?.(c)}
                onEditWithCopilot={onEditWithCopilot}
                onNav={onNav}
                editingWidgetId={editingWidgetId}
                reportMode={false}
                viewMode={viewMode}
                printMode={printMode}
              />
            </div>
          ))}
        </GridLayout>
      )}
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
  prev.viewMode === next.viewMode &&
  prev.printMode === next.printMode &&
  prev.nested === next.nested &&
  // Opening/closing the settings panel or a nested add for some OTHER
  // widget doesn't change this widget's own `widget` object reference, but
  // it can change how this card should render its children (a nested
  // child's own dashed "isEditing" border, or the in-progress add preview),
  // so these need their own comparison rather than being treated as stable
  // callback props like onEdit/onRequestDelete/onEditWithCopilot are below.
  prev.editingWidgetId === next.editingWidgetId &&
  prev.addingNestedParentId === next.addingNestedParentId &&
  prev.addingNestedDraft === next.addingNestedDraft &&
  prev.isNestTarget === next.isNestTarget
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

// Reserved names — the fixed set of core dashboard templates offered from the
// Library (see LibraryPage.jsx's TEMPLATES / WorkspacePage's DASHBOARD_TITLES)
// — a saved dashboard can't reuse one of these, on top of any name already
// taken by another saved dashboard (see isDashboardNameTaken below).
const CORE_DASHBOARD_TEMPLATE_NAMES = [
  'Discover Dashboard', 'CISO Dashboard', 'Client Subsidiary',
  'Device Attack Surface', 'Risk Mitigation Queries', 'Tracked Security Gaps',
]

// "Save Dashboard Under" — where a saved dashboard is reachable from besides
// Workspace > Saved. Anything but 'workspace' also pins it as a real item in
// that left-nav section (see withSavedDashboards in LeftNav.jsx, and
// App.jsx's `${section}/saved-${id}` render branch).
const SAVE_DASHBOARD_UNDER_OPTIONS = [
  { value: 'workspace',     label: 'Workspace' },
  { value: 'exposure',      label: 'Exposure' },
  { value: 'discover',      label: 'Discover' },
  { value: 'report',        label: 'Report' },
  { value: 'data-quality',  label: 'Data Quality' },
  { value: 'standalone',    label: 'Standalone Dashboard' },
]

// The built-in pages already living in each Insights section — none of these
// were created via the dashboard builder (LCNC), but they occupy real nav
// slots just the same, so pinning a same-named LCNC dashboard there would
// show two identically-labeled items side by side. Derived from
// INSIGHTS_MODEL itself (not a separately-maintained list) so it can't drift
// out of sync with the actual nav. 'kg' has no children of its own (a solo
// leaf) — its own label is the one reserved name for that section.
const BUILT_IN_SECTION_PAGE_NAMES = Object.fromEntries(
  INSIGHTS_MODEL.map(section => [section.id, (section.children ?? [section]).map(c => c.label)])
)

// Sentinel dropdown value for "+ Create New Section" — never itself stored
// as a dashboard's navSection (see handleCreateSection below, which resolves
// it to a real generated section id before that ever happens).
const CREATE_SECTION_VALUE = '__create_new_section__'

// Custom section ids are slugified from their label and namespaced under
// 'custom-' so they can never collide with a fixed built-in id (exposure,
// report, standalone, ...) even if someone names their section "Report" —
// the label-uniqueness check in isSectionNameTaken below is what actually
// blocks that, this is just a belt-and-suspenders guarantee at the id level.
const slugifySection = (label, existingIds) => {
  const base = 'custom-' + label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  let id = base || 'custom-section'
  let n = 2
  while (existingIds.has(id)) { id = `${base || 'custom-section'}-${n}`; n++ }
  return id
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

const SaveIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
  </svg>
)

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

// ── Create-dashboard hero ────────────────────────────────────────────
// Shown instead of the bare "Add Widget" tile while the canvas has zero
// widgets. "Create manually" (openAdd) is the primary path; "Use Navigator"
// opens the docked Copilot/Navigator builder (right panel) so the user
// describes the dashboard there instead — same onOpenCopilotBuilder({})
// call the dc-add-widget-tile's "Ask AI" button uses once the canvas
// already has widgets.
// Reuses Navigator's own AI-home visual language (hv-bg blobs, hv-greeting's
// animated gradient text) — see NavigatorPage.jsx's HomeView — instead of a
// plain bordered box, so this entry point still reads as the same surface.
function DashboardCreateHero({ onCreateManually, onUseNavigator }) {
  return (
    <div className="dc-create-hero">
      <div className="hv-bg">
        <div className="hv-bg-blob hv-bg-blob-1" />
        <div className="hv-bg-blob hv-bg-blob-2" />
      </div>

      <div className="dc-create-hero__content">
        <div className="dc-create-hero__badge">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </div>
        <h2 className="hv-greeting">Start building your dashboard</h2>
        <p className="hv-sub">Add and configure widgets yourself, or let Navigator build it for you.</p>

        <button type="button" className="ds-btn sz-md t-primary" onClick={onCreateManually}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Create manually
        </button>

        <div className="dc-create-hero__divider"><span>or</span></div>

        <button type="button" className="ds-btn sz-md t-outline" onClick={onUseNavigator}>
          <img src="assets/icons/Navigator icon.svg" width={14} height={14} alt="" />
          Use Navigator
        </button>
      </div>
    </div>
  )
}

const DashboardCanvas = forwardRef(function DashboardCanvas({ onNav, templateId = null, reportMode = false, reportTitle = '', onNameChange, onOpenCopilotBuilder, seedWidgets = null, seedName = '', backTarget = 'workspace/saved', viewMode = false }, ref) {
  const { addSavedDashboard, editDashboardSeed, savedDashboards, setEditDashboardSeed, customSections, addCustomSection } = useWorkspace()
  const { addDownload } = useDownloads()
  const { showToast } = useToast()
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
  // A real saved dashboard (created via handleDashboardSaved) carries its own
  // widgets/scope — use those directly. Only the hardcoded SAVED_ROWS mock
  // rows (no real content, just a `template` label) need the name-keyed
  // lookup below to have anything to seed from.
  const hasSavedContent = !!(editSeed && editSeed.widgets)
  const editSeedEntry = (editSeed && !hasSavedContent) ? (DASHBOARD_EDIT_SEED_BY_TEMPLATE[editSeed.template] ?? DASHBOARD_EDIT_SEED_DEFAULT) : null

  // `seedWidgets`/`seedName` arrive when this canvas was just navigated to from
  // Navigator's Build mode (or Ask/Research's "Add to Workspace") — see
  // WorkspacePage's `isSeededDashboard` handling — and behave exactly like a
  // template, just constructed at runtime from the chat session instead of a
  // hard-coded constant.
  const [name, setName]       = useState(reportMode ? reportTitle : (seedName || template?.name || editSeed?.name || ''))
  const [widgets, setWidgets] = useState(() => {
    if (template) return template.widgets
    if (hasSavedContent) return editSeed.widgets
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
  const isNewDashboard = !reportMode && !viewMode && !template && !editSeed && (!seedWidgets || !seedWidgets.length)
  const [dashboardScopes, setDashboardScopes] = useState(() => {
    if (hasSavedContent) return editSeed.dashboardScopes ?? []
    if (editSeedEntry) return GF_ENTITIES.filter(e => e.id === editSeedEntry.scopeId)
    return []
  })
  const [dashboardScopeAttrs, setDashboardScopeAttrs] = useState(() =>
    hasSavedContent ? (editSeed.dashboardScopeAttrs ?? {}) : {}
  )
  const [scopeModalOpen, setScopeModalOpen] = useState(false)
  const [scopeMandatory, setScopeMandatory] = useState(false)
  // Set instead of committing directly whenever a scope edit (on a dashboard
  // that already has widgets) actually adds, removes, or replaces entities —
  // holds the pending change plus enough to word the warning correctly.
  const [scopeChangeConfirm, setScopeChangeConfirm] = useState(null)
  // "Don't warn me again for this dashboard" on the widget Performance
  // Impact Warning — lives here (not inside WidgetSettingsPanel) so it
  // persists across opening settings for different widgets in one session.
  const [suppressPerfWarning, setSuppressPerfWarning] = useState(false)
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
  const [saveNameError, setSaveNameError]   = useState('')
  // Seeded from the dashboard's own already-saved values (not just a modal
  // draft) so a quick re-save — see handleToolbarSave below, which skips the
  // modal entirely for an already-saved dashboard — persists the *existing*
  // availability/section instead of silently resetting them to the defaults.
  const [saveAvailabilityDraft, setSaveAvailabilityDraft] = useState(() => editSeed?.visibility ?? 'Private')
  const [saveNavSectionDraft, setSaveNavSectionDraft] = useState(() => editSeed?.navSection ?? 'workspace')
  // Inline "+ Create New Section" flow within the "Save Dashboard Under"
  // field — a separate small draft rather than repurposing saveNavSectionDraft
  // itself, so the dropdown can keep showing its previous real selection
  // underneath while the user is mid-typing a new section name (Cancel just
  // drops this without disturbing that).
  const [creatingSection, setCreatingSection] = useState(false)
  const [newSectionDraft, setNewSectionDraft] = useState('')
  const [newSectionError, setNewSectionError] = useState('')
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false)
  // Set by an external caller (WorkspacePage's guardNav, e.g. switching to a
  // different dashboard/nav item mid-creation) so the same discard-confirm
  // modal used for the in-canvas Back button can also gate navigation
  // triggered from outside — Discard & Leave replays this instead of always
  // falling back to backTarget.
  const pendingConfirmRef = useRef(null)
  // An existing dashboard opened for editing starts out already "saved" — its
  // snapshot must reflect that so the leave-confirmation doesn't fire until
  // something actually changes.
  const lastSavedSnapshotRef = useRef(editSeed ? JSON.stringify({ name, widgets, dashboardScopes, dashboardScopeAttrs }) : null)

  const openSaveModal = (mode) => {
    setSaveModalMode(mode)
    setSaveNameDraft(name)
    setSaveNameError('')
    setSaveAvailabilityDraft(editSeed?.visibility ?? 'Private')
    setSaveNavSectionDraft(editSeed?.navSection ?? 'workspace')
    setSaveModalOpen(true)
  }
  // A name already used by another saved dashboard, one of the fixed Library
  // template names, or a built-in page already living in the chosen "Save
  // Dashboard Under" section is rejected — those are the other places a
  // dashboard name shows up in the product, so a collision there is
  // genuinely ambiguous, not just a cosmetic dupe (pinning a same-named LCNC
  // dashboard next to an existing built-in page of that name, e.g. a new
  // "Compliance" dashboard saved under Report where Compliance already
  // exists, would show two identically-labeled items side by side in the
  // nav). Excludes this dashboard's own current entry so re-saving it under
  // its existing name still works.
  // navSection is an explicit param (defaulting to the current draft state)
  // rather than always reading saveNavSectionDraft directly — the "Save
  // Dashboard Under" dropdown's onChange needs to re-validate against the
  // section it's switching *to* in the same tick, before that state update
  // has actually re-rendered.
  const isDashboardNameTaken = (trimmedName, navSection = saveNavSectionDraft) => {
    const lower = trimmedName.toLowerCase()
    if (CORE_DASHBOARD_TEMPLATE_NAMES.some(n => n.toLowerCase() === lower)) return true
    // "Standalone Dashboard" still lands right next to the real Knowledge
    // Graph nav entry (see withSavedDashboards in LeftNav.jsx), so it still
    // needs to check against that page's own name specifically.
    const sectionPages = BUILT_IN_SECTION_PAGE_NAMES[navSection === 'standalone' ? 'kg' : navSection] ?? []
    if (sectionPages.some(n => n.toLowerCase() === lower)) return true
    const currentId = saveModalMode === 'save-as' ? null : dashboardId
    return [...savedDashboards, ...SAVED_ROWS].some(d =>
      d.type === 'DASHBOARD' && d.id !== currentId && d.name.trim().toLowerCase() === lower
    )
  }
  const validateSaveName = (navSection = saveNavSectionDraft) => {
    const trimmed = saveNameDraft.trim()
    if (!trimmed) return true
    if (isDashboardNameTaken(trimmed, navSection)) {
      setSaveNameError('This name is already taken. Please choose a different one.')
      return false
    }
    setSaveNameError('')
    return true
  }
  // A new section's name can't collide with any existing "Save Dashboard
  // Under" destination — the fixed ones (Workspace, Exposure, ... Standalone
  // Dashboard) or another custom section already created — since either
  // would show two identically-labeled entries in that same dropdown, and a
  // built-in-section match would additionally show up twice in the nav
  // itself (see BUILT_IN_SECTION_PAGE_NAMES's own per-page check above,
  // which this doesn't duplicate — this is about the *section* name, that's
  // about a *dashboard* name).
  const isSectionNameTaken = (trimmedLabel) => {
    const lower = trimmedLabel.toLowerCase()
    return SAVE_DASHBOARD_UNDER_OPTIONS.some(o => o.label.toLowerCase() === lower)
      || customSections.some(cs => cs.label.toLowerCase() === lower)
  }
  const handleCreateSection = () => {
    const trimmed = newSectionDraft.trim()
    if (!trimmed) { setNewSectionError('Section name is required.'); return }
    if (isSectionNameTaken(trimmed)) {
      setNewSectionError('This name is already taken. Please choose a different one.')
      return
    }
    const id = slugifySection(trimmed, new Set(customSections.map(cs => cs.id)))
    addCustomSection({ id, label: trimmed })
    setSaveNavSectionDraft(id)
    setCreatingSection(false)
    setNewSectionDraft('')
    setNewSectionError('')
    if (saveNameDraft.trim()) validateSaveName(id)
  }
  // `mode` defaults to whatever the Save Dashboard modal was opened with, but
  // is passed explicitly by the toolbar's quick re-save path (see
  // handleToolbarSave) — saveModalMode can be stale left over from an earlier
  // Save As in the same session, which would otherwise mint a fresh id on
  // every subsequent quick save instead of updating the one already open.
  const handleDashboardSaved = (savedName, mode = saveModalMode) => {
    setSaveModalOpen(false)
    // Mock-only simulated failure (no real backend here) — occasional, not
    // routine, so it exercises the error-toast path without making saving
    // itself unreliable.
    if (Math.random() < 0.1) {
      showToast({ type: 'error', msg: 'Failed to save dashboard. Please try again.' })
      return
    }
    const id = mode === 'save-as' ? `d-${Date.now()}` : (dashboardId ?? `d-${Date.now()}`)
    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
    // Persist the actual builder state (widgets/scope), not just the table-row
    // metadata — otherwise reopening this entry has nothing real to seed from
    // and falls back to a generic template's widgets (see editSeedEntry below).
    const savedEntry = {
      id, name: savedName, isNew: true, type: 'DASHBOARD',
      template: template?.name ?? editSeed?.template ?? 'Custom', visibility: saveAvailabilityDraft, status: 'Saved',
      lastUpdated: today,
      widgets, dashboardScopes, dashboardScopeAttrs,
      navSection: saveNavSectionDraft === 'workspace' ? null : saveNavSectionDraft,
    }
    flushSync(() => {
      addSavedDashboard(savedEntry)
      setDashboardId(id)
      setName(savedName)
      lastSavedSnapshotRef.current = JSON.stringify({ name: savedName, widgets, dashboardScopes, dashboardScopeAttrs })
    })
    showToast({ type: 'success', msg: `"${savedName}" has been saved.` })
    // Land on the dashboard itself rather than the list — seed
    // editDashboardSeed the same way SavedPage's own View action does
    // (see its handleView) so WorkspacePage doesn't fall back to resolving
    // it from the hardcoded SAVED_ROWS mock list, which has no idea about a
    // dashboard just saved this session.
    setEditDashboardSeed(savedEntry)
    onNav(`workspace/dashboard/view-${id}`)
  }
  const isDirty = !reportMode && !viewMode && !(widgets.length === 0 && !name.trim())
    && JSON.stringify({ name, widgets, dashboardScopes, dashboardScopeAttrs }) !== lastSavedSnapshotRef.current
  // No local isDirty check here — WorkspacePage's handleNav guards every nav
  // it receives (back button included) through guardNav below, which is what
  // actually opens the discard-confirm modal. Keeps this the single place
  // that decides whether to prompt, so the same modal covers switching
  // dashboards mid-creation, not just this Back button.
  const handleBackClick = () => onNav(backTarget)

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
  // Keyed by widget id; a widget counts as checked unless explicitly
  // unchecked, so newly added widgets default to selected without needing
  // to reset this map every time the modal opens.
  const [downloadWidgets, setDownloadWidgets] = useState({})

  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false)
  const downloadMenuRef = useRef(null)
  useEffect(() => {
    if (!downloadMenuOpen) return
    const handler = e => { if (downloadMenuRef.current && !downloadMenuRef.current.contains(e.target)) setDownloadMenuOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [downloadMenuOpen])

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
  // Set while the Add Widget panel is targeting a nested widget (opened via
  // a container's "Add nested widget" action) rather than the top-level
  // grid — routes addWidget()/the __add__ grid tile accordingly.
  const [addParentId, setAddParentId]           = useState(null)

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
  // Drag-to-nest: while a top-level widget is being dragged, draggingTopId
  // names it (only ever set for a non-container widget — nesting stays one
  // level deep) and nestTargetId names whichever OTHER top-level widget the
  // pointer is currently over, if any — driving that card's purple
  // drop-to-nest outline (isNestTarget) below.
  const [draggingTopId, setDraggingTopId] = useState(null)
  const [nestTargetId, setNestTargetId] = useState(null)
  useEffect(() => {
    if (!gridEl) return
    const ro = new ResizeObserver(([entry]) => setGridWidth(entry.contentRect.width))
    ro.observe(gridEl)
    return () => ro.disconnect()
  }, [gridEl])

  // The Add Widget tile is a real grid item too, sized to match whatever
  // it's currently showing (the button's fixed footprint, or the live
  // preview's actual selected size while the panel is open) and placed via
  // the same first-free-gap search packWidgets uses for real widgets — so it
  // fills whichever gap is actually free instead of always starting a new
  // row below everything. It's marked isDraggable/isResizable: false (not
  // RGL's `static: true`) so the user can't move or resize it directly, but
  // it still participates in collision compaction like any other item —
  // resizing a real widget into its cell pushes the Add tile itself out of
  // the way (right/below), instead of RGL treating it as an immovable
  // obstacle and shoving the widget being resized down to dodge it.
  const addGw = (panelMode === 'add' && !addParentId)
    ? clamp((WIDGET_SIZES.find(s => s.id === widgetSize)?.span || 1) * 3, MIN_GW, MAX_GW)
    : 3
  const addGh = (panelMode === 'add' && !addParentId)
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
        const { minGw, minGh } = minSizeFor(w.chartId)
        if (panelMode === 'settings' && w.id === settingsWidgetId && (liveSizeId || liveHeightId)) {
          if (liveSizeId) {
            const span = ALL_WIDGET_SIZES.find(s => s.id === liveSizeId)?.span || w.span
            gw = clamp((span || 1) * 3, minGw, MAX_GW)
          }
          if (liveHeightId) {
            const px = ALL_WIDGET_HEIGHTS.find(s => s.id === liveHeightId)?.px
            if (px) gh = clamp(Math.ceil(px / ROW_UNIT_PX), minGh, MAX_GH)
          }
        }
        return { i: String(w.id), x: w.gx, y: w.gy, w: gw, h: gh, minW: minGw, minH: minGh, maxW: MAX_GW, maxH: MAX_GH }
      })
      return viewMode ? real : [...real, { i: '__add__', x: addSlot.gx, y: addSlot.gy, w: addSlot.gw, h: addSlot.gh, isDraggable: false, isResizable: false }]
    },
    [layoutWidgets, panelMode, settingsWidgetId, liveSizeId, liveHeightId, addSlot, viewMode]
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
  // Every id must stay unique across both the top-level grid and every
  // container's nested children — they share one flat id space (settings/
  // delete lookups key off id alone, without needing to know in advance
  // whether it's nested).
  const nextWidgetId = (ws) => {
    const allIds = ws.flatMap(w => [w.id, ...(w.children || []).map(c => c.id)])
    return (allIds.length > 0 ? Math.max(...allIds) : 0) + 1
  }

  const addWidget = ({ chartId, label, description = '', sizeId = 'small', heightId = 'small', parentId = null }) => {
    // A freshly-added KPI defaults to the "Extra Small" preset (not the
    // generic "Small" the Add Widget picker offers for every chart type)
    // and its heading defaults to the pre-selected Aggregate By attribute.
    if (chartId === 'kpi') {
      if (sizeId === 'small') sizeId = 'xsmall'
      if (heightId === 'small') heightId = 'xsmall'
    }
    const sizeList = chartId === 'kpi' ? KPI_WIDGET_SIZES : chartId === 'heading' ? HEADING_WIDGET_SIZES : WIDGET_SIZES
    const size = sizeList.find(s => s.id === sizeId) || sizeList[0]
    const newId = nextWidgetId(widgets)
    const newWidget = {
      id: newId,
      label: label || (chartId === 'kpi' ? KPI_AGG_LABELS.host : (CHART_DEFAULT_NAMES[chartId] || CHART_TYPES.find(c => c.id === chartId)?.label)),
      description,
      chartId, span: size.span, sizeId, heightId,
      phase: 'active',
      // Stand up the same representative KPI data + defaults the Settings
      // panel's Apply would generate, so a freshly-added KPI renders the
      // real card design right away instead of the generic chart-type
      // silhouette until the user opens Settings and clicks Apply once.
      ...(chartId === 'kpi' ? { showTotalCount: true, showPctChange: true, valueFontSize: 'auto', data: buildKpiMockData('host', true) } : {}),
      // A freshly-added Aggregated Table defaults to grouping by Business
      // Unit with a Host ID count, same rationale as the KPI defaults above
      // — real-looking grouped rows right away instead of the generic
      // Type/Display Label table.
      ...(chartId === 'agg-table' ? {
        groupByCols: [{ attribute: 'Business Unit', displayName: '' }],
        aggregateByCols: [{ operation: 'count-distinct', attribute: 'host', displayName: 'Total Host ID' }],
        columns: ['Business Unit', 'Total Host ID'],
        enableDownload: true,
        data: buildAggTableMockData(),
      } : {}),
      // A nested widget starts full-width (one per row) regardless of its
      // chosen size preset — that preset's span is scaled for the
      // top-level dashboard's width, where a "Small" fraction is still
      // plenty wide; at a container's much narrower scale the same
      // fraction is usually too cramped to render legibly. Dragging it
      // narrower afterward (to place a second one beside it) persists a
      // real gw via the nested grid's own resize handle.
      ...(parentId ? { gw: GRID_COLS } : {}),
    }
    commitWidgets(ws => parentId
      ? ws.map(w => w.id === parentId
          ? withRequiredGh({ ...w, children: [...(w.children || []), newWidget] })
          : w)
      : [...ws, newWidget])
    return newId
  }

  // A nested widget lives inside its parent's `children` array instead of
  // the top-level grid, positioned within its own small grid scoped to the
  // parent's card (see NestedWidgetGrid) rather than the dashboard's.
  const applyWidgetChanges = (w, changes) => {
    const allSizes = [...WIDGET_SIZES, ...KPI_WIDGET_SIZES, ...HEADING_WIDGET_SIZES]
    const allHeights = [...WIDGET_HEIGHTS, ...KPI_WIDGET_HEIGHTS, ...HEADING_WIDGET_HEIGHTS]
    const next = { ...w, ...changes, phase: 'active' }
    // changes.sizeId/heightId is null when the width/height was left on
    // "Custom" — in that case leave the widget's real gw/gh (and span)
    // untouched instead of collapsing it back to a default preset.
    const { minGw, minGh } = minSizeFor(next.chartId)
    const size = allSizes.find(s => s.id === changes.sizeId)
    if (size) { next.span = size.span; next.gw = clamp(size.span * 3, minGw, MAX_GW) }
    const height = allHeights.find(h => h.id === changes.heightId)
    if (height) next.gh = clamp(Math.ceil(height.px / ROW_UNIT_PX), minGh, MAX_GH)
    return next
  }

  const configureWidget = (id, changes) => {
    commitWidgets(ws => ws.map(w => {
      if (w.id === id) {
        const next = applyWidgetChanges(w, changes)
        return next.children?.length ? withRequiredGh(next) : next
      }
      if (w.children?.some(c => c.id === id)) {
        const newChildren = w.children.map(c => c.id === id ? applyWidgetChanges(c, changes) : c)
        return withRequiredGh({ ...w, children: newChildren })
      }
      return w
    }))
  }

  // Fired once per completed drag/resize gesture inside a container's own
  // nested grid — the nested equivalent of commitRglLayout, scoped to one
  // parent's children instead of the top-level widgets array.
  // react-grid-layout's own onResizeStop/onDragStart set their internal
  // `activeDrag` state via setState — under React 18's automatic batching,
  // that can land in the same batch as the re-render our own commit below
  // triggers, and the library's internal state can come out of that batch
  // never properly cleared (a documented category of upstream bug: a drag
  // started right after a resize commit silently no-ops, no placeholder, no
  // drag-start callback, nothing). flushSync forces our commit — and the
  // re-render it causes — to finish before react-grid-layout's own
  // post-resize bookkeeping continues, keeping the two in sync.
  const commitNestedLayout = (parentId, layout) => {
    commitWidgets(ws => ws.map(w => {
      if (w.id !== parentId) return w
      const children = (w.children || []).map(c => {
        const l = layout.find(item => item.i === String(c.id))
        return l ? { ...c, gx: l.x, gy: l.y, gw: l.w, gh: l.h } : c
      })
      return withRequiredGh({ ...w, children })
    }))
  }

  // Drag-out-to-canvas: lifts a nested widget out of its parent's `children`
  // and back onto the top-level grid, the inverse of addWidget's parentId
  // path. Fired by NestedWidgetGrid's onPromoteToTop once a drag crosses the
  // container's bounds. Position is left unset (gx/gy undefined) so
  // packWidgets auto-places it into the first free top-level gap, same as
  // any newly-added widget.
  const promoteNestedToTop = (parentId, childId) => {
    commitWidgets(ws => {
      const parent = ws.find(w => w.id === parentId)
      const child = parent?.children?.find(c => c.id === childId)
      if (!child) return ws
      const promoted = { ...child, gx: undefined, gy: undefined, gw: child.gw || legacyGw(child) }
      return ws
        .map(w => w.id === parentId ? withRequiredGh({ ...w, children: w.children.filter(c => c.id !== childId) }) : w)
        .concat(promoted)
    })
  }

  // Drag-to-nest: moves a top-level widget into another top-level widget's
  // `children`, the inverse of promoteNestedToTop — fired by the top-level
  // grid's onDragStop when the drag ends over a valid nest target (see
  // nestTargetId). Only ever called with a childId that isn't itself a
  // container (draggingTopId is never set for one — nesting stays one level
  // deep), so the moved widget can't arrive already hosting children of its
  // own. Nested widgets start full-width, same as one added via "Add nested
  // widget" (see addWidget's parentId path).
  const nestWidgetInto = (childId, targetParentId) => {
    commitWidgets(ws => {
      const child = ws.find(w => w.id === childId)
      if (!child) return ws
      const nested = { ...child, gx: undefined, gy: undefined, gw: GRID_COLS }
      return ws
        .filter(w => w.id !== childId)
        .map(w => w.id === targetParentId ? withRequiredGh({ ...w, children: [...(w.children || []), nested] }) : w)
    })
  }

  const removeWidget = (id) => {
    commitWidgets(ws => {
      if (ws.some(w => w.id === id)) return ws.filter(w => w.id !== id)
      return ws.map(w => w.children?.some(c => c.id === id)
        ? withRequiredGh({ ...w, children: w.children.filter(c => c.id !== id) })
        : w)
    })
  }

  const getSnapshot = () => ({
    widgetCount: widgets.length,
    widgets: widgets.map(w => ({ id: w.id, label: w.label, chartId: w.chartId, phase: w.phase, sizeId: w.sizeId, heightId: w.heightId })),
  })

  // Lets a parent (WorkspacePage) gate its own navigation — e.g. clicking a
  // different LeftNav item or another saved dashboard — behind this same
  // unsaved-changes prompt. Returns true when it's safe to navigate right
  // away; when dirty, it opens the modal instead and stashes onConfirmed to
  // run only if the user picks "Discard & Leave".
  const guardNav = (onConfirmed) => {
    if (!isDirty) return true
    pendingConfirmRef.current = onConfirmed
    setLeaveConfirmOpen(true)
    return false
  }

  useImperativeHandle(ref, () => ({ addWidget, configureWidget, removeWidget, getSnapshot, guardNav }))

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
    setAddParentId(null)
    setPanelMode('add')
  }

  const openAddNested = (parentId) => {
    setSelectedChart(null); setWidgetTitle(''); setWidgetDescription(''); setWidgetSize('small'); setWidgetHeight('small')
    setAddParentId(parentId)
    setPanelMode('add')
  }

  const handleAddSave = () => {
    if (!selectedChart) return
    const newId = addWidget({ chartId: selectedChart, label: widgetTitle, description: widgetDescription, sizeId: widgetSize, heightId: widgetHeight, parentId: addParentId })
    setAddParentId(null)
    setSettingsWidgetId(newId)
    setPanelMode('settings')
    setLiveSizeId(null); setLiveHeightId(null)
  }

  const handleAddCancel = () => { setPanelMode(null); setAddParentId(null) }

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

  // layoutWidgets (not the raw widgets array) so the panel always sees a
  // resolved gw/gh — real if the widget's been dragged/resized, derived from
  // its sizeId/heightId preset otherwise — never undefined. A nested widget
  // never appears in layoutWidgets (it isn't part of the grid at all), so
  // fall back to its parent's children array — keeping its own real gw/gh
  // when it has one (set at creation time, e.g. the forced full-width
  // GRID_COLS a nested widget starts with, or a real value from being
  // dragged in the nested grid) and only deriving one from its size/height
  // preset via the same fallback packWidgets uses for ungridded widgets
  // when it doesn't. Discarding a real gw/gh here to always re-derive from
  // span/heightId showed the wrong preset in the dropdown (e.g. "Small" for
  // a full-width widget) and, worse, re-applied that wrong size on Apply.
  const settingsWidget = layoutWidgets.find(w => w.id === settingsWidgetId) || (() => {
    const nested = widgets.flatMap(w => w.children || []).find(c => c.id === settingsWidgetId)
    return nested ? { ...nested, gw: nested.gw ?? legacyGw(nested), gh: nested.gh ?? legacyGh(nested) } : undefined
  })()

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
      <div className={`dc-layout${viewMode ? ' dc-layout--view' : ''}`}>

        {/* ── Canvas ── */}
        <div className={`dc-canvas-wrap${viewMode ? ' dc-canvas-wrap--view' : ''}`}>

          {/* Toolbar — a saved dashboard being viewed (not built/edited) drops
              this entirely, same as Discover's dashboards: just the SubHeader
              (with its own "···" menu's Edit item, see WorkspacePage.jsx) then
              the widgets, no builder chrome. */}
          {!viewMode && (
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
                readOnly={viewMode}
              />

              {!reportMode && (
                <button
                  type="button"
                  className="dc-scope-badge"
                  title="Dashboard Scope"
                  onClick={() => { if (viewMode) return; setScopeMandatory(false); setScopeModalOpen(true) }}
                >
                  <span className="dc-btn-label">
                    {dashboardScopes.length
                      ? dashboardScopes[0].label + (dashboardScopes.length > 1 ? ` +${dashboardScopes.length - 1}` : '')
                      : 'Dashboard Scope'}
                  </span>
                  <span className="dc-scope-icon">
                    {dashboardScopes.length
                      ? <img src={`/assets/icons/${dashboardScopes[0].file}`} width={16} height={16} alt="" className="dc-scope-icon-img" />
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
                <div ref={downloadMenuRef} className="comp-sort-wrap">
                  <button className="ds-btn sz-md t-outline" title="Download" onClick={() => setDownloadMenuOpen(o => !o)}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    <span className="dc-btn-label">Download</span>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className={`comp-dl-chevron${downloadMenuOpen ? ' comp-dl-chevron--open' : ''}`}><path d="m6 9 6 6 6-6"/></svg>
                  </button>
                  {downloadMenuOpen && (
                    <div className="comp-dl-menu">
                      <button
                        className="comp-dl-item"
                        onClick={e => { addDownload(`${name || 'Dashboard'}.pdf`, e.currentTarget); setDownloadMenuOpen(false) }}
                      >
                        <IcFilePdf /> PDF
                      </button>
                      <button
                        className="comp-dl-item"
                        onClick={() => { setDownloadMenuOpen(false); setDownloadOpen(true) }}
                      >
                        <IcFileExcel /> Excel
                      </button>
                    </div>
                  )}
                </div>
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

              {!reportMode && !viewMode && (
                <button className="ds-btn sz-md t-outline" onClick={() => openSaveModal('save-as')}>Save As</button>
              )}

              <button
                className="ds-btn sz-md t-primary"
                title={(!reportMode && !viewMode && !isDirty) ? 'No changes to save' : undefined}
                disabled={!reportMode && !viewMode && !isDirty}
                onClick={() => {
                  if (viewMode) { onNav(`workspace/dashboard/edit-${dashboardId}`); return }
                  if (!reportMode) {
                    // Already saved once (dashboardId exists) — name/availability/
                    // section are already wired up, so just re-persist the
                    // updated widgets/scope and toast, skipping the modal that
                    // asks for those again. A never-saved dashboard still needs
                    // the full modal (openSaveModal('save')) to get a name.
                    if (dashboardId) { handleDashboardSaved(name, 'save'); return }
                    openSaveModal('save')
                    return
                  }
                  const previewSlug = templateId === 'vulnerabilities' ? 'vulnerabilities'
                    : templateId === 'month-over-month' ? 'month-over-month'
                    : 'executive-summary'
                  onNav(`workspace/report-preview/${previewSlug}`)
                }}
              >{viewMode ? 'Edit' : reportMode ? 'Preview' : 'Save'}</button>
            </div>
          </div>
          )}

          {/* Canvas body */}
          <div className={`dc-canvas-body${(templateId === 'discover' || viewMode) ? ' dc-canvas-body--plain' : ''}${reportMode ? ' dc-canvas-body--report' : ''}`}>
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
                        <div key={row.widget.id} className={`dc-report-chart-row${(row.widget.chartId === 'table' || row.widget.chartId === 'agg-table') ? ' dc-report-chart-row--table' : ''}`}>
                          <WidgetCard widget={row.widget} isEditing={false} onEdit={() => openSettings(row.widget.id)} onRequestDelete={() => {}} reportMode />
                        </div>
                      )
                    )}
                  </div>
                )
              })()
            ) : (widgets.length === 0 && viewMode) ? (
              <div className="dc-empty-state">No widgets to display.</div>
            ) : (widgets.length === 0 && panelMode !== 'add') ? (
              <DashboardCreateHero
                onCreateManually={openAdd}
                onUseNavigator={() => onOpenCopilotBuilder?.({})}
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
                    containerPadding={viewMode ? [0, 0] : [GRID_PAD_PX, GRID_PAD_PX]}
                    width={gridWidth}
                    draggableHandle=".dc-action-btn--grab, .dc-widget-card-header, .cr-kg-title-row"
                    resizeHandles={['se']}
                    transformScale={zoom}
                    useCSSTransforms
                    compactType="vertical"
                    isDraggable={!viewMode}
                    isResizable={!viewMode}
                    onDragStart={(layout, oldItem) => {
                      setInteracting(true)
                      // Drag-to-nest is only ever offered for a widget that
                      // isn't itself hosting children — nesting a container
                      // inside another container would be two levels deep,
                      // which the data model (and NestedWidgetGrid) doesn't
                      // support.
                      const w = widgets.find(w => String(w.id) === oldItem.i)
                      setDraggingTopId(w && !w.children?.length ? w.id : null)
                    }}
                    onDrag={(layout, oldItem, newItem, placeholder, e) => {
                      if (draggingTopId == null) { setNestTargetId(null); return }
                      const hit = document.elementsFromPoint(e.clientX, e.clientY)
                        .map(el => el.closest?.('.dc-widget-col'))
                        .find(col => col && col.dataset.widgetId && Number(col.dataset.widgetId) !== draggingTopId)
                      // elementsFromPoint can surface a NESTED widget's own
                      // `.dc-widget-col` (inside some other card's container
                      // grid) — only a real top-level widget id is a valid
                      // nest target, so cross-check against the top-level list.
                      const hitId = hit ? Number(hit.dataset.widgetId) : null
                      setNestTargetId(widgets.some(w => w.id === hitId) ? hitId : null)
                    }}
                    onDragStop={layout => {
                      setInteracting(false)
                      if (draggingTopId != null && nestTargetId != null) nestWidgetInto(draggingTopId, nestTargetId)
                      else commitRglLayout(layout)
                      setDraggingTopId(null)
                      setNestTargetId(null)
                    }}
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
                            onNav={onNav}
                            editingWidgetId={panelMode === 'settings' ? settingsWidgetId : null}
                            onEditWidget={openSettings}
                            onDeleteWidget={setDeletePending}
                            onAddNested={openAddNested}
                            addingNestedParentId={panelMode === 'add' ? addParentId : null}
                            addingNestedDraft={panelMode === 'add' && addParentId ? {
                              title: widgetTitle, description: widgetDescription, chartId: selectedChart,
                              heightPx: WIDGET_HEIGHTS.find(s => s.id === widgetHeight)?.px || 180,
                            } : null}
                            onNestedLayoutChange={commitNestedLayout}
                            onPromoteNested={promoteNestedToTop}
                            isNestTarget={nestTargetId === w.id}
                            reportMode={false}
                            viewMode={viewMode}
                          />
                        </div>
                      )
                    })}

                    {/* Add Widget tile / live preview — a real, non-interactive
                        (isDraggable/isResizable: false, not RGL `static`) grid
                        item placed by packWidgets like any other widget, so it
                        lands in whatever gap is actually free and reflows out
                        of the way (not the other way around) when a real
                        widget resizes into its cell. Omitted entirely in
                        viewMode (see rglLayout above, which drops its layout
                        entry too). */}
                    {!viewMode && (
                    <div key="__add__">
                      {panelMode === 'add' && !addParentId ? (
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
                    )}
                  </GridLayout>
                )}
              </div>
            )}
          </div>

          {templateId !== 'discover' && !viewMode && (
            <DashboardFloatingToolbar
              canUndo={canUndo}
              canRedo={canRedo}
              onUndo={undo}
              onRedo={redo}
              zoom={zoom}
              onZoomIn={zoomIn}
              onZoomOut={zoomOut}
              onZoomReset={zoomReset}
              onReset={(reportMode || viewMode) ? undefined : () => { setWidgets([]); setName(''); setPanelMode(null) }}
            />
          )}
        </div>

        {/* ── Right Panel (custom dashboards only, not report mode) ── */}
        {panelMode === 'add' && !reportMode && !viewMode && (
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
            scopeEntities={dashboardScopes}
            onSaveChanges={changes => handleSettingsSave(settingsWidget.id, changes)}
            onClose={() => handleSettingsClose(settingsWidget.id)}
            onLiveChange={({ sizeId, heightId }) => { setLiveSizeId(sizeId); setLiveHeightId(heightId) }}
            suppressPerfWarning={suppressPerfWarning}
            onSuppressPerfWarning={() => setSuppressPerfWarning(true)}
          />
        )}
      </div>
    </div>

    {scopeModalOpen && (
      <DashboardScopeModal
        mandatory={scopeMandatory}
        initialSelectedIds={dashboardScopes.map(e => e.id)}
        initialAttrFilters={dashboardScopeAttrs}
        onClose={() => setScopeModalOpen(false)}
        onBack={() => onNav(backTarget)}
        onSelect={(entities, attrFilters) => {
          setScopeModalOpen(false)
          setScopeMandatory(false)
          const oldIds = new Set(dashboardScopes.map(e => e.id))
          const newIds = new Set(entities.map(e => e.id))
          const added = entities.filter(e => !oldIds.has(e.id))
          const removed = dashboardScopes.filter(e => !newIds.has(e.id))
          // Entities that were already in scope and stay in scope, but whose
          // attribute filters changed this session (e.g. adding Storage to
          // scope while also adding new attribute filters to the already-
          // scoped Host) — an added/removed-only check would silently miss
          // these, so they need their own call-out below rather than being
          // folded into "added".
          const oldAttrs = dashboardScopeAttrs || {}
          const attrsChanged = entities.filter(e =>
            oldIds.has(e.id) && newIds.has(e.id) &&
            JSON.stringify(oldAttrs[e.id] || {}) !== JSON.stringify(attrFilters[e.id] || {})
          )
          // Nothing to warn about on a brand-new scope, a truly unchanged
          // selection, or a dashboard with no widgets yet to be affected.
          if (widgets.length === 0 || (!added.length && !removed.length && !attrsChanged.length)) {
            setDashboardScopes(entities)
            setDashboardScopeAttrs(attrFilters)
            return
          }
          setScopeChangeConfirm({
            entities, attrFilters,
            kind: added.length && removed.length ? 'replace' : added.length ? 'add' : removed.length ? 'remove' : 'attrs',
            added, removed, attrsChanged,
          })
        }}
      />
    )}

    {scopeChangeConfirm && (() => {
      const { kind, added, removed, attrsChanged = [] } = scopeChangeConfirm
      const addedNames = added.map(e => e.label).join(', ')
      const removedNames = removed.map(e => e.label).join(', ')
      const attrsChangedNames = attrsChanged.map(e => e.label).join(', ')
      const title = kind === 'add' ? 'Add to dashboard scope?' : kind === 'remove' ? 'Remove from dashboard scope?' : kind === 'attrs' ? 'Update scope attribute filters?' : 'Replace dashboard scope?'
      const applyLabel = kind === 'add' ? 'Add' : kind === 'remove' ? 'Remove' : kind === 'attrs' ? 'Update' : 'Replace'
      // Called out separately from the add/remove/replace copy below so an
      // entity add/remove never silently hides an attribute-filter change to
      // an entity that was already in scope and stayed there.
      const attrsNote = attrsChanged.length
        ? <> Attribute filters for <strong>{attrsChangedNames}</strong> were also updated.</>
        : null
      const body = kind === 'add'
        ? <>Adding <strong>{addedNames}</strong> to the dashboard scope will apply to all existing widgets. Their data may now include these entity types.{attrsNote}</>
        : kind === 'remove'
        ? <>Removing <strong>{removedNames}</strong> from the dashboard scope will apply to all existing widgets. Their data will no longer include these entity types.{attrsNote}</>
        : kind === 'attrs'
        ? <>Updating attribute filters for <strong>{attrsChangedNames}</strong> will apply to all existing widgets, changing the data they show.</>
        : <>Replacing <strong>{removedNames}</strong> with <strong>{addedNames}</strong> in the dashboard scope will apply to all existing widgets, changing the data they show.{attrsNote}</>
      return (
        <div className="ds-modal-overlay">
          <div className="ds-modal">
            <div className="ds-modal-header">
              <span className="ds-modal-title warning dc-scope-confirm-modal-title">
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                  <path d="M8.762 3.569L13.388 11.6C13.712 12.167 13.293 12.866 12.626 12.866H3.374C2.706 12.866 2.287 12.167 2.612 11.6L7.238 3.569C7.571 2.989 8.429 2.989 8.762 3.569Z" stroke="var(--pai-med-fg)" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 9.058V6.942" stroke="var(--pai-med-fg)" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="8" cy="10.962" r="0.635" fill="var(--pai-med-fg)"/>
                </svg>
                {title}
              </span>
              <button className="ds-modal-close" onClick={() => setScopeChangeConfirm(null)} aria-label="Close">✕</button>
            </div>
            <div className="ds-modal-body">
              <span>{body}</span>
            </div>
            <div className="ds-modal-footer">
              <button className="ds-btn sz-md t-outline" onClick={() => setScopeChangeConfirm(null)}>Cancel</button>
              <button
                className="ds-btn sz-md t-primary"
                onClick={() => {
                  setDashboardScopes(scopeChangeConfirm.entities)
                  setDashboardScopeAttrs(scopeChangeConfirm.attrFilters)
                  setScopeChangeConfirm(null)
                }}
              >{applyLabel} & Apply</button>
            </div>
          </div>
        </div>
      )
    })()}

    {deletePending && (
      <div className="ds-modal-overlay">
        <div className="ds-modal">
          <div className="ds-modal-header">
            <span className="ds-modal-title dc-delete-modal-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                <line x1="10" y1="11" x2="10" y2="17"/>
                <line x1="14" y1="11" x2="14" y2="17"/>
              </svg>
              Delete widget
            </span>
            <button className="ds-modal-close" onClick={() => setDeletePending(null)} aria-label="Close">✕</button>
          </div>
          <div className="ds-modal-body">
            <span>Delete <strong>"{deletePending.label}"</strong>? This widget will be permanently removed from the dashboard.</span>
          </div>
          <div className="ds-modal-footer">
            <button className="ds-btn sz-md t-outline" onClick={() => setDeletePending(null)}>Cancel</button>
            <button className="ds-btn sz-md t-danger" onClick={() => { deleteWidget(deletePending.id); setDeletePending(null); }}>Delete widget</button>
          </div>
        </div>
      </div>
    )}

    {deleteDashboardConfirm && (
      <div className="ds-modal-overlay">
        <div className="ds-modal">
          <div className="ds-modal-header">
            <span className="ds-modal-title dc-delete-modal-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                <line x1="10" y1="11" x2="10" y2="17"/>
                <line x1="14" y1="11" x2="14" y2="17"/>
              </svg>
              Delete dashboard
            </span>
            <button className="ds-modal-close" onClick={() => setDeleteDashboardConfirm(false)}>✕</button>
          </div>
          <div className="ds-modal-body">
            <span>Delete <strong>"{name || 'Untitled Dashboard'}"</strong>? This dashboard and all of its widgets will be permanently removed.</span>
          </div>
          <div className="ds-modal-footer">
            <button className="ds-btn sz-md t-outline" onClick={() => setDeleteDashboardConfirm(false)}>Cancel</button>
            <button className="ds-btn sz-md t-danger" onClick={() => {
              setDeleteDashboardConfirm(false)
              showToast({ type: 'success', msg: `"${name || 'Untitled Dashboard'}" has been deleted.` })
              onNav(backTarget)
            }}>Delete dashboard</button>
          </div>
        </div>
      </div>
    )}

    {saveModalOpen && (
      <>
        <div className="sfm-overlay" onMouseDown={() => setSaveModalOpen(false)} />
        <div className="sfm-dialog" onMouseDown={e => e.stopPropagation()}>
          <div className="sfm-header">
            <div className="sfm-icon-wrap">
              <SaveIcon />
            </div>
            <span className="sfm-title">{saveModalMode === 'save-as' ? 'Save Dashboard As' : 'Save Dashboard'}</span>
            <button className="sfm-close" onClick={() => setSaveModalOpen(false)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div className="sfm-body">
            <div className="sfm-form-field">
              <label className="sfm-form-label">Dashboard Name<span className="sfm-required">*</span></label>
              <input
                className={`sfm-form-input${saveNameError ? ' has-error' : ''}`}
                placeholder="Enter name"
                value={saveNameDraft}
                onChange={e => { setSaveNameDraft(e.target.value); if (saveNameError) setSaveNameError('') }}
                onBlur={() => validateSaveName()}
                autoFocus
              />
              {saveNameError && <span className="sfm-field-error">{saveNameError}</span>}
            </div>
            <div className="sfm-form-field">
              <label className="sfm-form-label">Availability</label>
              <div className="sfm-select-full">
                <SelectDropdown
                  value={saveAvailabilityDraft}
                  onChange={setSaveAvailabilityDraft}
                  options={['Private', 'Public']}
                  fullWidth
                  portal
                />
              </div>
            </div>
            <div className="sfm-form-field">
              <label className="sfm-form-label">Save Dashboard Under</label>
              <div className="sfm-select-full">
                <SelectDropdown
                  value={creatingSection ? CREATE_SECTION_VALUE : saveNavSectionDraft}
                  onChange={(next) => {
                    if (next === CREATE_SECTION_VALUE) {
                      setCreatingSection(true)
                      setNewSectionDraft('')
                      setNewSectionError('')
                      return
                    }
                    setSaveNavSectionDraft(next)
                    if (saveNameDraft.trim()) validateSaveName(next)
                  }}
                  options={[
                    ...SAVE_DASHBOARD_UNDER_OPTIONS,
                    ...customSections.map(cs => ({ value: cs.id, label: cs.label })),
                    { value: CREATE_SECTION_VALUE, label: '+ Create New Section' },
                  ]}
                  fullWidth
                  portal
                />
              </div>
              {creatingSection && (
                <div className="sfm-new-section-row">
                  <input
                    className={`sfm-form-input${newSectionError ? ' has-error' : ''}`}
                    placeholder="New section name"
                    value={newSectionDraft}
                    onChange={e => { setNewSectionDraft(e.target.value); if (newSectionError) setNewSectionError('') }}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCreateSection() } }}
                    autoFocus
                  />
                  <button type="button" className="sfm-cancel sfm-new-section-btn" onClick={() => { setCreatingSection(false); setNewSectionDraft(''); setNewSectionError('') }}>Cancel</button>
                  <button type="button" className="sfm-create sfm-new-section-btn" onClick={handleCreateSection}>Add</button>
                </div>
              )}
              {newSectionError && <span className="sfm-field-error">{newSectionError}</span>}
              {!creatingSection && saveNavSectionDraft !== 'workspace' && (
                <p className="sfm-info-note">
                  {saveNavSectionDraft === 'standalone'
                    ? 'This dashboard will also appear in the left nav as its own item.'
                    : <>This dashboard will also appear in the left nav under {[...SAVE_DASHBOARD_UNDER_OPTIONS, ...customSections.map(cs => ({ value: cs.id, label: cs.label }))].find(o => o.value === saveNavSectionDraft)?.label}{saveNavSectionDraft === 'exposure' ? ', right after Findings.' : '.'}</>
                  }
                </p>
              )}
            </div>
          </div>
          <div className="sfm-footer">
            <button className="sfm-cancel" onClick={() => setSaveModalOpen(false)}>Cancel</button>
            <button
              className={`sfm-create${!saveNameDraft.trim() ? ' sfm-create--disabled' : ''}`}
              disabled={!saveNameDraft.trim()}
              onClick={() => {
                const trimmed = saveNameDraft.trim()
                if (!trimmed || !validateSaveName()) return
                handleDashboardSaved(trimmed)
              }}
            >Save</button>
          </div>
        </div>
      </>
    )}

    {leaveConfirmOpen && (
      <div className="ds-modal-overlay">
        <div className="ds-modal">
          <div className="ds-modal-header">
            <span className="ds-modal-title dc-delete-modal-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                <line x1="10" y1="11" x2="10" y2="17"/>
                <line x1="14" y1="11" x2="14" y2="17"/>
              </svg>
              Discard unsaved changes?
            </span>
            <button className="ds-modal-close" onClick={() => { setLeaveConfirmOpen(false); pendingConfirmRef.current = null }}>✕</button>
          </div>
          <div className="ds-modal-body">
            <span><strong>"{name || 'Untitled'}"</strong> has changes that haven't been saved. If you leave now, they'll be lost.</span>
          </div>
          <div className="ds-modal-footer">
            <button className="ds-btn sz-md t-outline" onClick={() => { setLeaveConfirmOpen(false); pendingConfirmRef.current = null }}>Cancel</button>
            <button
              className="ds-btn sz-md t-danger"
              onClick={() => {
                setLeaveConfirmOpen(false)
                const confirmed = pendingConfirmRef.current
                pendingConfirmRef.current = null
                if (confirmed) confirmed()
                else onNav(backTarget)
              }}
            >Discard & Leave</button>
          </div>
        </div>
      </div>
    )}

    {stopScheduleOpen && (
      <div className="ds-modal-overlay">
        <div className="ds-modal dc-modal--wide">
          <div className="ds-modal-header">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--pai-med-fg)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="9" y1="15" x2="15" y2="19"/><line x1="15" y1="15" x2="9" y2="19"/>
            </svg>
            <span className="ds-modal-title warning">Stop Dashboard Schedule</span>
            <button className="ds-modal-close" onClick={() => setStopScheduleOpen(false)}>✕</button>
          </div>
          <div className="ds-modal-body">
            <span>Stop automatic generation for <strong>"{name || 'this dashboard'}"</strong>? The dashboard stays saved but won't regenerate.</span>
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
        <div className="ds-modal dc-modal--wide" onClick={e => e.stopPropagation()}>
          <div className="ds-modal-header">
            <span className="ds-modal-title dc-download-modal-title">
              <Ic path={<><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/><path d="M5 21h14"/></>} size={18} />
              Download as Excel
            </span>
            <button className="ds-modal-close" onClick={() => setDownloadOpen(false)}>✕</button>
          </div>
          <div className="ds-modal-body">
            <div className="dc-modal-body-stack">
              <div>Select the widgets you'd like to export as Excel files</div>
              {widgets.map(w => (
                <div className="dc-modal-checkbox-row" key={w.id}>
                  <input
                    type="checkbox"
                    className="dc-gf-checkbox"
                    id={`download-${w.id}`}
                    checked={downloadWidgets[w.id] !== false}
                    onChange={e => setDownloadWidgets(prev => ({ ...prev, [w.id]: e.target.checked }))}
                  />
                  <label htmlFor={`download-${w.id}`}>{w.label}</label>
                </div>
              ))}
            </div>
          </div>
          <div className="ds-modal-footer">
            <button className="ds-btn sz-md t-outline" onClick={() => setDownloadOpen(false)}>Cancel</button>
            <button
              className="ds-btn sz-md t-primary"
              disabled={!widgets.some(w => downloadWidgets[w.id] !== false)}
              style={{ '--dc-aw-save-opacity': widgets.some(w => downloadWidgets[w.id] !== false) ? 1 : 0.4 }}
              onClick={(e) => {
                widgets.filter(w => downloadWidgets[w.id] !== false).forEach(w => addDownload(`${w.label}.xlsx`, e.currentTarget))
                setDownloadOpen(false)
              }}
            >Download</button>
          </div>
        </div>
      </div>
    )}

    {shareOpen && (
      <div className="ds-modal-overlay" onClick={() => setShareOpen(false)}>
        <div className="ds-modal dc-modal--wide" onClick={e => e.stopPropagation()}>
          <div className="ds-modal-header">
            <span className="ds-modal-title dc-share-modal-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
              Share Dashboard
            </span>
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
                  <div className="dc-share-access-dropdown">
                    <SelectDropdown
                      value={shareAccessDraft}
                      onChange={setShareAccessDraft}
                      options={[{ value: 'view', label: 'Can view' }, { value: 'edit', label: 'Can edit' }]}
                    />
                  </div>
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
                  value={shareMessage || `Hi,\n\nI'm sharing "${name || 'this dashboard'}" with you. Please find the dashboard linked below.\n\nBest regards`}
                  onChange={e => setShareMessage(e.target.value)}
                />
              </div>
              <div className="dc-modal-checkbox-row">
                <input type="checkbox" checked={shareSendCopy} onChange={e => setShareSendCopy(e.target.checked)} className="dc-gf-checkbox" id="share-send-copy" />
                <label htmlFor="share-send-copy">Send me a copy</label>
              </div>
              <div className="dc-modal-note">Dashboard will be shared as link via email.</div>
            </div>
          </div>
          <div className="ds-modal-footer">
            <div className="dc-modal-footer-split">
              <button className="ds-btn sz-md t-outline" onClick={() => {
                navigator.clipboard?.writeText(window.location.href)
                showToast({ type: 'success', msg: 'Link copied to clipboard.' })
              }}>
                Copy link
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
              </button>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="ds-btn sz-md t-outline" onClick={() => setShareOpen(false)}>Cancel</button>
                <button className="ds-btn sz-md t-primary" onClick={() => {
                  setShareOpen(false)
                  showToast({ type: 'success', msg: `"${name || 'Dashboard'}" has been shared.` })
                }}>Share</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}

    {scheduleOpen && (
      <div className="ds-modal-overlay" onClick={() => setScheduleOpen(false)}>
        <div className="ds-modal dc-modal--wide" onClick={e => e.stopPropagation()}>
          <div className="ds-modal-header">
            <span className="ds-modal-title dc-schedule-modal-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="14" x2="12" y2="18"/><line x1="10" y1="16" x2="14" y2="16"/>
              </svg>
              Schedule Dashboard
            </span>
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
                <label htmlFor="schedule-mode-daily">Send an email after each day's run to receive the latest dashboard.</label>
              </div>
              <div className="dc-modal-radio-row">
                <input type="radio" name="scheduleMode" id="schedule-mode-specific" checked={scheduleMode === 'specific'} onChange={() => setScheduleMode('specific')} />
                <label htmlFor="schedule-mode-specific">Schedule the dashboard for a specific time. It will include data from the latest available run.</label>
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
                <div className="dc-modal-note">Next dashboard update will be on <strong style={{ display: 'inline', marginBottom: 0 }}>{formatNextReport()}</strong></div>
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
              onClick={() => {
                setScheduleActive(true)
                setScheduleOpen(false)
                showToast({ type: 'success', msg: `"${name || 'Dashboard'}" has been scheduled.` })
              }}
            >Schedule</button>
          </div>
        </div>
      </div>
    )}
    </>
  )
})

export default DashboardCanvas
