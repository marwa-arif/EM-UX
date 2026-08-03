import React, { useState, useRef, useCallback, useEffect, useId } from 'react'
import { createPortal } from 'react-dom'
import TablePagination from './TablePagination'
import {
  AreaChart, Area,
  LineChart, Line,
  BarChart, Bar, Cell,
  PieChart, Pie,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  CartesianGrid,
  XAxis, YAxis,
  Tooltip, ResponsiveContainer,
  LabelList,
} from 'recharts'
import { PAI } from '../ui.jsx'

// ── DS palette ────────────────────────────────────────────────────
const GRID  = 'var(--shell-border)'
const SEV   = ['var(--pai-crit-fg)','var(--pai-high-fg)','var(--pai-caution-fg)','var(--pai-green)','var(--pai-low-fg)']
const CAT   = ['var(--pai-indigo)','var(--pai-nav-teal)','#2ea8a8','#5c6bc0','var(--pai-indigo-muted)','#3a7fcb']
const TG    = 'var(--shell-text-muted)'
const DCOLS = ['var(--pai-crit-fg)','var(--pai-high-fg)','var(--pai-indigo)','var(--pai-green)','#64748B','#94A3B8']

// ── Default data (used when widget has no configured data yet) ────
export const DEFAULT_VERT_BAR = [
  { label: 'Workstation',    value: 36323 },
  { label: 'Server',         value: 11476 },
  { label: 'Network Device', value: 4478  },
  { label: 'Mobile',         value: 2407  },
  { label: 'Virtual',        value: 1     },
]

export const DEFAULT_RADAR = [
  { label: 'Completeness', value: 70 },
  { label: 'Accuracy',     value: 65 },
  { label: 'Integrity',    value: 60 },
  { label: 'Timeliness',   value: 55 },
  { label: 'Validity',     value: 62 },
  { label: 'Uniqueness',   value: 68 },
]

// Origins palette — matches screenshot legend colors
export const STACK_ORIGINS = [
  { key: 'MS Azure AD',                   color: '#4285F4' },
  { key: 'ServiceNow',                    color: '#E040FB' },
  { key: 'MS Active Directory Extract',   color: '#FFB300' },
  { key: 'Qualys',                        color: '#26C6DA' },
  { key: 'MS Intune',                     color: '#43A047' },
  { key: 'MS Defender',                   color: '#FB8C00' },
  { key: 'Windows Security Logs',         color: '#7E57C2' },
  { key: 'Wiz',                           color: '#EC407A' },
  { key: 'CrowdStrike',                   color: '#00ACC1' },
  { key: 'Tenable.sc',                    color: '#FF7043' },
  { key: 'AWS',                           color: '#EF5350' },
  { key: 'MS Azure',                      color: '#26A69A' },
]

export const DEFAULT_STACK_VERT = [
  {
    type: 'Workstation',
    'MS Azure AD': 28500, 'ServiceNow': 26000, 'MS Active Directory Extract': 24500,
    'Qualys': 19000, 'MS Intune': 18500, 'MS Defender': 13500,
    'Windows Security Logs': 13000, 'Wiz': 3000, 'CrowdStrike': 2200,
    'Tenable.sc': 530, 'AWS': 480, 'MS Azure': 1,
  },
  {
    type: 'Server',
    'MS Azure AD': 9000, 'ServiceNow': 8500, 'MS Active Directory Extract': 8000,
    'Qualys': 7000, 'MS Intune': 6800, 'MS Defender': 5000,
    'Windows Security Logs': 4900, 'Wiz': 1000, 'CrowdStrike': 700,
    'Tenable.sc': 220, 'AWS': 200, 'MS Azure': 0,
  },
  {
    type: 'Network Device',
    'MS Azure AD': 1800, 'ServiceNow': 1600, 'MS Active Directory Extract': 1400,
    'Qualys': 900, 'MS Intune': 850, 'MS Defender': 600,
    'Windows Security Logs': 580, 'Wiz': 150, 'CrowdStrike': 100,
    'Tenable.sc': 30, 'AWS': 22, 'MS Azure': 0,
  },
  {
    type: 'Mobile',
    'MS Azure AD': 1200, 'ServiceNow': 1100, 'MS Active Directory Extract': 900,
    'Qualys': 500, 'MS Intune': 480, 'MS Defender': 350,
    'Windows Security Logs': 340, 'Wiz': 90, 'CrowdStrike': 60,
    'Tenable.sc': 15, 'AWS': 12, 'MS Azure': 0,
  },
  {
    type: 'Hypervisor',
    'MS Azure AD': 900, 'ServiceNow': 800, 'MS Active Directory Extract': 700,
    'Qualys': 400, 'MS Intune': 380, 'MS Defender': 270,
    'Windows Security Logs': 260, 'Wiz': 70, 'CrowdStrike': 45,
    'Tenable.sc': 10, 'AWS': 8, 'MS Azure': 0,
  },
  {
    type: 'Other',
    'MS Azure AD': 484, 'ServiceNow': 449, 'MS Active Directory Extract': 398,
    'Qualys': 235, 'MS Intune': 225, 'MS Defender': 154,
    'Windows Security Logs': 148, 'Wiz': 40, 'CrowdStrike': 26,
    'Tenable.sc': 5, 'AWS': 0, 'MS Azure': 0,
  },
]

const DEFAULT_HOR_BAR = [
  { label: 'Workstation',    value: 66, count: '36,323' },
  { label: 'Server',         value: 21, count: '11,476' },
  { label: 'Network Device', value: 8,  count: '4,478'  },
  { label: 'Mobile',         value: 4,  count: '2,407'  },
  { label: 'Virtual',        value: 0,  count: '1'      },
]

const DEFAULT_KG_TABLE = [
  { type: 'Workstation',    displayLabel: 'WORK-VYO830.AC...'   },
  { type: 'Network Device', displayLabel: '10.218.172.231'       },
  { type: 'Workstation',    displayLabel: 'WORK-KFG815.AC...'   },
  { type: 'Server',         displayLabel: 'SERVER-YHB308.A...'  },
  { type: 'Workstation',    displayLabel: 'WORK-IDI341182.A...' },
]

// ── Severity icon (triangle warning) ─────────────────────────────
function SevIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M8.762 3.569L13.388 11.6C13.712 12.167 13.293 12.866 12.626 12.866H3.374C2.706 12.866 2.287 12.167 2.612 11.6L7.238 3.569C7.571 2.989 8.429 2.989 8.762 3.569Z" stroke="var(--pai-crit-fg)" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8 9.058V6.942" stroke="var(--pai-crit-fg)" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="8" cy="10.962" r="0.635" fill="var(--pai-crit-fg)"/>
    </svg>
  )
}

// ── Source YAxis tick ─────────────────────────────────────────────
function SourceTick({ x, y, payload }) {
  return (
    <text x={x} y={y} dy={4} textAnchor="end" fontSize={9} fill="var(--shell-text-muted)" fontFamily="Inter,system-ui">
      {payload.value}
    </text>
  )
}

// ── Shared Recharts tooltip style (matches existing dashboard pattern) ────
const RECHARTS_TIP = {
  contentStyle: {
    background: 'var(--card-bg)',
    border: '1px solid var(--card-border)',
    borderRadius: 6,
    fontSize: 11,
    padding: '5px 8px',
    fontFamily: 'Inter,system-ui',
    color: 'var(--shell-text)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.14)',
  },
  labelStyle: { color: 'var(--shell-text-muted)', fontSize: 10, marginBottom: 2 },
  itemStyle:  { color: 'var(--shell-text)', padding: 0 },
  cursor: { fill: 'rgba(255,255,255,0.04)' },
}

// ── Bar tooltip (matches PieTooltip design) ──────────────────────
function BarTooltip({ active, payload, total }) {
  if (!active || !payload?.length) return null
  const d   = payload[0].payload
  const val = d.value >= 1000 ? `${(d.value / 1000).toFixed(1)}k` : String(d.value ?? '')
  const pct = total > 0 ? `${Math.round((d.value / total) * 100)}%` : ''
  return (
    <div className="tooltip-card cr-bar-tip" style={{ '--cr-tip-border': d.fill }}>
      <div className="cr-bar-tip__name">{d.name}</div>
      <div className="cr-bar-tip__row">
        <span className="cr-bar-tip__dot-row">
          <span className="cr-bar-tip__dot" style={{ '--cr-dot-bg': d.fill }} />
          {val}
        </span>
        <span className="cr-bar-tip__pct" style={{ '--cr-tip-color': d.fill }}>{pct}</span>
      </div>
    </div>
  )
}

// ── Stack tooltip ─────────────────────────────────────────────────
function StackTooltip({ active, payload, activeOrigin }) {
  if (!active || !payload?.length || !activeOrigin) return null
  const entry = payload.find(p => p.dataKey === activeOrigin)
  if (!entry) return null
  const colTotal = payload.reduce((s, p) => s + (p.value || 0), 0)
  const pct = colTotal > 0 ? ((entry.value / colTotal) * 100).toFixed(2) : '0'
  return (
    <div className="tooltip-card cr-stack-tip" style={{ '--cr-tip-border': entry.fill }}>
      <div className="tooltip-card__row cr-stack-tip__header">
        <span className="cr-bar-tip__dot" style={{ '--cr-dot-bg': entry.fill }} />
        <span className="cr-stack-tip__name">{entry.name}</span>
      </div>
      <div className="cr-stack-tip__row">
        <span className="tooltip-card__label">Count Distinct</span>
        <span className="cr-stack-tip__val">{entry.value.toLocaleString()}</span>
      </div>
      <div className="cr-stack-tip__row">
        <span className="tooltip-card__label">Percentage</span>
        <span className="cr-stack-tip__val">{pct}%</span>
      </div>
    </div>
  )
}

// ── Pie tooltip ───────────────────────────────────────────────────
function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div className="tooltip-card cr-pie-tip" style={{ '--cr-tip-border': p.color }}>
      <div className="cr-pie-tip__label">{p.label}</div>
      <div className="cr-pie-tip__row">
        <span className="tooltip-card__label">Count</span>
        <span className="cr-stack-tip__val">{p.count}</span>
      </div>
      <div className="cr-pie-tip__row">
        <span className="tooltip-card__label">Percentage</span>
        <span className="cr-stack-tip__val">{p.pct}</span>
      </div>
    </div>
  )
}

// ── Stacked vertical bar (extracted so it can own activeOrigin state) ──
const COMPACT_LEGEND_PAGE_SIZE = 7

function StackVertChart({ data, showLegend, chartColors, printMode = false, seriesKeys }) {
  const [activeOrigin, setActiveOrigin] = useState(null)
  const [legendPage, setLegendPage] = useState(0)
  const [hiddenOrigins, setHiddenOrigins] = useState(new Set())

  const SERIES = seriesKeys || STACK_ORIGINS

  const toggleOrigin = (key) => {
    setHiddenOrigins(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }
  const rows = data || DEFAULT_STACK_VERT
  const chartData = rows.map(r => ({ ...r, name: r.type }))
  const originTotals = SERIES.map(o => ({
    ...o,
    total: rows.reduce((s, r) => s + (r[o.key] || 0), 0),
  }))
  const grandTotal = originTotals.reduce((s, o) => s + o.total, 0)

  const totalPages = Math.ceil(SERIES.length / COMPACT_LEGEND_PAGE_SIZE)
  const pageItems = SERIES.slice(
    legendPage * COMPACT_LEGEND_PAGE_SIZE,
    (legendPage + 1) * COMPACT_LEGEND_PAGE_SIZE,
  )

  return (
    <div className="cr-vert-root" onMouseLeave={() => setActiveOrigin(null)}>
      <div className={showLegend ? 'cr-bar-chart-area--with-legend' : 'cr-bar-chart-area'}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 8, right: 8, bottom: 52, left: -10 }}
            barSize={22}
          >
            <XAxis
              dataKey="name"
              tick={{ fontSize: 8, fill: TG, fontFamily: 'Inter,system-ui' }}
              axisLine={false} tickLine={false}
              interval={0} angle={-35} textAnchor="end" dy={4}
            />
            <YAxis
              tick={{ fontSize: 8, fill: TG, fontFamily: 'Inter,system-ui' }}
              axisLine={false} tickLine={false}
              tickFormatter={v => v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)}
            />
            {!printMode && <Tooltip content={(props) => <StackTooltip {...props} activeOrigin={activeOrigin} />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} wrapperStyle={{ zIndex: 9999 }} />}
            {SERIES.map((o, i) => (
              <Bar
                key={o.key}
                dataKey={o.key}
                stackId="stack"
                fill={chartColors?.[o.key] || o.color}
                fillOpacity={activeOrigin && activeOrigin !== o.key ? 0.15 : 1}
                hide={hiddenOrigins.has(o.key)}
                radius={i === SERIES.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]}
                isAnimationActive={false}
                onMouseEnter={() => setActiveOrigin(o.key)}
                onMouseLeave={() => setActiveOrigin(null)}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      {showLegend && (
        <div className="cr-bar-legend">
          {originTotals.map((o, i) => (
            <div key={i} className="cr-bar-legend-row">
              <span className="cr-bar-legend-dot" style={{ '--cr-dot-bg': chartColors?.[o.key] || o.color }} />
              <span className="cr-bar-legend-name">{o.label || o.key}</span>
              <span className="cr-bar-legend-count">{o.total.toLocaleString()}</span>
              <span className="cr-bar-legend-pct">
                {grandTotal > 0 ? `${((o.total / grandTotal) * 100).toFixed(2)}%` : '0%'}
              </span>
            </div>
          ))}
        </div>
      )}
      {!showLegend && (
        <div className="cr-compact-legend">
          <div className="cr-compact-legend-items">
            {pageItems.map((o, i) => (
              <div
                key={i}
                className={`cr-compact-legend-item${hiddenOrigins.has(o.key) ? ' cr-compact-legend-item--disabled' : ''}`}
                onClick={() => toggleOrigin(o.key)}
              >
                <span className="cr-bar-legend-dot" style={{ '--cr-dot-bg': chartColors?.[o.key] || o.color }} />
                <span className="cr-compact-legend-label">{o.label || o.key}</span>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="cr-compact-legend-nav">
              <button
                className="cr-compact-legend-btn"
                onClick={() => setLegendPage(p => p - 1)}
                disabled={legendPage === 0}
              >◄</button>
              <span className="cr-compact-legend-page">{legendPage + 1}/{totalPages}</span>
              <button
                className="cr-compact-legend-btn"
                onClick={() => setLegendPage(p => p + 1)}
                disabled={legendPage === totalPages - 1}
              >►</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Stacked horizontal bar ────────────────────────────────────────
function StackHorChart({ data, showLegend, chartColors, printMode = false, seriesKeys, onSegmentClick }) {
  const [activeOrigin, setActiveOrigin] = useState(null)
  const [legendPage, setLegendPage] = useState(0)
  const [hiddenOrigins, setHiddenOrigins] = useState(new Set())
  const [tipPos, setTipPos] = useState({ x: 0, y: 0 })
  const rafRef = useRef(null)

  const SERIES = seriesKeys || STACK_ORIGINS

  const toggleOrigin = (key) => {
    setHiddenOrigins(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const handleMouseMove = useCallback((e) => {
    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(() => {
        setTipPos({ x: e.clientX, y: e.clientY })
        rafRef.current = null
      })
    }
  }, [])

  const rows = data || DEFAULT_STACK_VERT
  const chartData = rows.map(r => ({ ...r, name: r.type }))
  const originTotals = SERIES.map(o => ({
    ...o,
    total: rows.reduce((s, r) => s + (r[o.key] || 0), 0),
  }))
  const grandTotal = originTotals.reduce((s, o) => s + o.total, 0)

  const totalPages = Math.ceil(SERIES.length / COMPACT_LEGEND_PAGE_SIZE)
  const pageItems = SERIES.slice(
    legendPage * COMPACT_LEGEND_PAGE_SIZE,
    (legendPage + 1) * COMPACT_LEGEND_PAGE_SIZE,
  )

  const portalTooltip = useCallback((props) => {
    if (!props.active || !props.payload?.length || !activeOrigin) return null
    const entry = props.payload.find(p => p.dataKey === activeOrigin)
    if (!entry) return null
    const colTotal = props.payload.reduce((s, p) => s + (p.value || 0), 0)
    const pct = colTotal > 0 ? ((entry.value / colTotal) * 100).toFixed(2) : '0'
    return createPortal(
      <div className="tooltip-card tooltip-card--fixed cr-stack-tip cr-stack-tip--portal"
        style={{ left: tipPos.x + 14, top: tipPos.y - 70, zIndex: 99999, '--cr-tip-border': entry.fill }}
      >
        <div className="tooltip-card__row cr-stack-tip__header">
          <span className="cr-bar-tip__dot" style={{ '--cr-dot-bg': entry.fill }} />
          <span className="cr-stack-tip__name">{entry.name}</span>
        </div>
        <div className="cr-stack-tip__row">
          <span className="tooltip-card__label">Count Distinct</span>
          <span className="cr-stack-tip__val">{entry.value.toLocaleString()}</span>
        </div>
        <div className="cr-stack-tip__row">
          <span className="tooltip-card__label">Percentage</span>
          <span className="cr-stack-tip__val">{pct}%</span>
        </div>
      </div>,
      document.body
    )
  }, [activeOrigin, tipPos])

  return (
    <div className="cr-vert-root" onMouseMove={handleMouseMove} onMouseLeave={() => setActiveOrigin(null)}>
      <div className={showLegend ? 'cr-bar-chart-area--with-legend' : 'cr-bar-chart-area'}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 4, right: 16, bottom: 4, left: 0 }}
            barSize={12}
          >
            <XAxis
              type="number"
              tick={{ fontSize: 8, fill: TG, fontFamily: 'Inter,system-ui' }}
              axisLine={false} tickLine={false}
              tickFormatter={v => v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={90}
              tick={{ fontSize: 8, fill: TG, fontFamily: 'Inter,system-ui' }}
              axisLine={false} tickLine={false}
            />
            <Tooltip
              content={printMode ? () => null : portalTooltip}
              cursor={printMode ? false : { fill: 'rgba(255,255,255,0.04)' }}
              wrapperStyle={{ display: 'none' }}
            />
            {SERIES.map((o, i) => (
              <Bar
                key={o.key}
                dataKey={o.key}
                stackId="stack"
                fill={chartColors?.[o.key] || o.color}
                fillOpacity={activeOrigin && activeOrigin !== o.key ? 0.15 : 1}
                hide={hiddenOrigins.has(o.key)}
                radius={i === SERIES.length - 1 ? [0, 3, 3, 0] : [0, 0, 0, 0]}
                isAnimationActive={false}
                onMouseEnter={() => setActiveOrigin(o.key)}
                onMouseLeave={() => setActiveOrigin(null)}
                cursor={onSegmentClick ? 'pointer' : 'default'}
                onClick={onSegmentClick ? (barData) => onSegmentClick(barData.payload?.type ?? barData.type, o.key) : undefined}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      {showLegend && (
        <div className="cr-bar-legend">
          {originTotals.map((o, i) => (
            <div key={i} className="cr-bar-legend-row">
              <span className="cr-bar-legend-dot" style={{ '--cr-dot-bg': chartColors?.[o.key] || o.color }} />
              <span className="cr-bar-legend-name">{o.label || o.key}</span>
              <span className="cr-bar-legend-count">{o.total.toLocaleString()}</span>
              <span className="cr-bar-legend-pct">
                {grandTotal > 0 ? `${((o.total / grandTotal) * 100).toFixed(2)}%` : '0%'}
              </span>
            </div>
          ))}
        </div>
      )}
      {!showLegend && (
        <div className="cr-compact-legend">
          <div className="cr-compact-legend-items">
            {pageItems.map((o, i) => (
              <div
                key={i}
                className={`cr-compact-legend-item${hiddenOrigins.has(o.key) ? ' cr-compact-legend-item--disabled' : ''}`}
                onClick={() => toggleOrigin(o.key)}
              >
                <span className="cr-bar-legend-dot" style={{ '--cr-dot-bg': chartColors?.[o.key] || o.color }} />
                <span className="cr-compact-legend-label">{o.label || o.key}</span>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="cr-compact-legend-nav">
              <button
                className="cr-compact-legend-btn"
                onClick={() => setLegendPage(p => p - 1)}
                disabled={legendPage === 0}
              >◄</button>
              <span className="cr-compact-legend-page">{legendPage + 1}/{totalPages}</span>
              <button
                className="cr-compact-legend-btn"
                onClick={() => setLegendPage(p => p + 1)}
                disabled={legendPage === totalPages - 1}
              >►</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Semicircle gauge (self-measuring — needs pixel cx/cy/radius so the ──
// gradient can be anchored with gradientUnits="userSpaceOnUse"; a % based
// gradient would rescale to each arc's own bounding box, so a low value
// would show the full red-to-green range instead of just the red end.
function GaugeArc({ value, markerValue }) {
  const gradId = useId()
  const wrapRef = useRef(null)
  const [size, setSize] = useState({ w: 280, h: 150 })

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      const r = entries[0]?.contentRect
      if (r && r.width > 0 && r.height > 0) setSize({ w: r.width, h: r.height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const { w, h } = size
  const labelPad = 20
  // Reference gauge measures 325×171.5 (outerR 162.5, ring 18px) — cap at
  // that intrinsic size rather than stretching to fill a larger card, but
  // still shrink proportionally (same ratio) if the container is smaller.
  const REF_OUTER_R = 162.5
  const REF_RING_RATIO = 18 / 162.5
  const outerR  = Math.max(24, Math.min(w / 2 - 4, h - labelPad, REF_OUTER_R))
  const ringW   = outerR * REF_RING_RATIO
  const innerR  = outerR - ringW
  const cx = w / 2
  // Center the whole gauge block (arc + end labels) in the available
  // height instead of pinning it to the bottom — a tall body would
  // otherwise leave the arc looking bottom-heavy with dead space above it.
  const blockH = outerR + labelPad
  const topOffset = Math.max(0, (h - blockH) / 2)
  const cy = topOffset + outerR

  return (
    <div ref={wrapRef} style={{ flex: 1, width: '100%', minHeight: 0, position: 'relative' }}>
      <PieChart width={w} height={h}>
        <defs>
          <linearGradient id={gradId} gradientUnits="userSpaceOnUse" x1={cx - outerR} y1="0" x2={cx + outerR} y2="0">
            <stop offset="0%"   stopColor="var(--pai-crit-fg)" />
            <stop offset="35%"  stopColor="var(--pai-med-fg)" />
            <stop offset="70%"  stopColor="var(--pai-caution-fg)" />
            <stop offset="100%" stopColor="var(--pai-green)" />
          </linearGradient>
        </defs>
        <Pie
          data={[{ value: 100 }]}
          dataKey="value"
          cx={cx} cy={cy}
          startAngle={180} endAngle={0}
          innerRadius={innerR} outerRadius={outerR}
          stroke="none"
          cornerRadius={ringW / 2}
          isAnimationActive={false}
        >
          <Cell fill="var(--shell-raised)" />
        </Pie>
        {value > 0 && (
          <Pie
            data={[{ value }]}
            dataKey="value"
            cx={cx} cy={cy}
            startAngle={180}
            endAngle={180 - (value / 100) * 180}
            innerRadius={innerR} outerRadius={outerR}
            stroke="none"
            cornerRadius={ringW / 2}
            isAnimationActive={false}
          >
            <Cell fill={`url(#${gradId})`} />
          </Pie>
        )}
      </PieChart>
      {markerValue != null && (() => {
        // Rendered as a separate overlay svg (not a PieChart child) — Recharts
        // buckets unrecognized children into its own z-index layering system,
        // which put a raw <line> inside <PieChart> behind the Pie sectors
        // regardless of JSX order. An absolutely-positioned sibling svg is
        // unambiguously painted on top.
        const rad = ((180 - (Math.max(0, Math.min(100, markerValue)) / 100) * 180) * Math.PI) / 180
        const cosT = Math.cos(rad), sinT = Math.sin(rad)
        const tickIn = innerR - 5, tickOut = outerR + 5
        const x1 = cx + tickIn * cosT, y1 = cy - tickIn * sinT
        const x2 = cx + tickOut * cosT, y2 = cy - tickOut * sinT
        return (
          <svg width={w} height={h} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fff" strokeWidth={10} strokeLinecap="round" />
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--pai-caution-fg)" strokeWidth={3} strokeLinecap="round" />
          </svg>
        )
      })()}
      <div style={{ position: 'absolute', left: cx, top: cy - 14, transform: 'translate(-50%, -100%)', pointerEvents: 'none' }}>
        <span style={{ fontSize: 32, fontWeight: 700, color: 'var(--shell-text)', fontFamily: 'Inter,system-ui', lineHeight: 1, whiteSpace: 'nowrap' }}>{Math.round(value)}%</span>
      </div>
      <span style={{ position: 'absolute', left: cx - outerR, top: cy + 6, fontSize: 11, color: TG, fontFamily: 'Inter,system-ui' }}>0</span>
      <span style={{ position: 'absolute', left: cx + outerR - 20, top: cy + 6, fontSize: 11, color: TG, fontFamily: 'Inter,system-ui' }}>100</span>
    </div>
  )
}

// ── ChartRender ───────────────────────────────────────────────────
// Props:
//   chartId        – 'pie' | 'line' | 'hor-bar' | 'vert-bar' | 'stack-vert' | 'stack-hor' | 'table' | 'kpi'
//   showLegend     – show legend row (pie); default true
//   showTotalCount – show "Total / n" in pie center; default true
//   showPctChange  – show % change badges in pie legend; default false
//   data           – data-driven override for pie / hor-bar / kpi / table
//                    pie:     [{label, count, value, pct, change?, color?}]
//                    hor-bar: [{label, unique, corroborated}]  — Recharts mode
//                             [{label, value (0-100), secondary? (0-100)}] — SVG mode
//                    kpi:     {value, label, trend?, trendUp?, trendData?}
//                    table:   [{sev, text, failPct, cat}]
//   series         – data-driven override for line chart
//   xLabels        – string[] x-axis labels for data-driven line chart
//   totalLabel     – override center text in pie (e.g. '12,382')

function kgCellValue(row, colName) {
  const k = colName.toLowerCase().replace(/\s+/g, '')
  if (k === 'type')         return row.type
  if (k === 'displaylabel') return row.displayLabel
  return row[k] ?? '—'
}

export function ChartRender({
  chartId,
  showPctChange = false,
  showLegend    = true,
  showTotalCount = true,
  data,
  series,
  xLabels,
  xLabel,
  yLabel,
  totalLabel,
  noteLabel,
  note,
  legendDesc,
  columns,
  chartColors,
  seriesKeys,
  radarSeries,
  description,
  cardHeight = 260,
  printMode = false,
  reportTotal = 0,
  compact = false,
  onSegmentClick,
}) {
  // ── SVG tooltip state ──────────────────────────────────────────
  const [svgTip, setSvgTip] = useState(null)
  const onSvgMove = (e) => {
    setSvgTip(t => t ? { ...t, x: e.clientX, y: e.clientY } : t)
  }
  const onSvgEnter = (e, label, value) => {
    setSvgTip({ x: e.clientX, y: e.clientY, label, value })
  }

  // ── KPI ─────────────────────────────────────────────────────────
  if (chartId === 'kpi' && data) {
    const accent      = chartColors?.['Accent'] || 'var(--pai-indigo)'
    const valSize     = Math.max(18, Math.min(36, cardHeight * 0.138))
    const labelSize   = Math.max(9,  Math.min(11, cardHeight * 0.042))
    const simValSize  = Math.max(20, Math.min(44, cardHeight * 0.169))
    const gapSize     = Math.max(4,  Math.min(10, cardHeight * 0.04))
    const trendColor = data.trendUp ? 'var(--pai-green)' : 'var(--pai-crit-fg)'
    const trendBg    = data.trendUp ? 'rgba(22,163,74,0.10)' : 'rgba(220,38,38,0.10)'

    if (data.trendData) {
      return (
        <div className="cr-kpi-root" style={{ '--cr-kpi-accent': accent, '--kpi-val-size': `${valSize}px`, '--kpi-label-size': `${labelSize}px` }}>
          {!compact && (
            <div className="cr-kpi-meta">
              <span className="cr-kpi-label">{data.label}</span>
              <span className="cr-kpi-value">{data.value}</span>
              {data.trend && (
                <span
                  className="cr-kpi-badge"
                  style={{ '--cr-trend-bg': trendBg, '--cr-trend-color': trendColor }}
                >
                  <span className="cr-kpi-badge__trend">
                    {data.trendUp
                      ? <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}><path d="M2.50586 11.0764L6.10893 7.47334L8.51098 9.87538L13.3151 5.07129" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/><path d="M11.1223 4.84668H13.5244V7.24873" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      : <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}><path d="M2.50586 4.84669L6.10893 8.44976L8.51098 6.04771L13.3151 10.8518" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/><path d="M11.1223 11.0764H13.5244V8.67437" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    }
                    {data.trend}
                  </span>
                  <span className="cr-kpi-badge__suffix"> {data.trendSuffix || 'from last month'}</span>
                </span>
              )}
            </div>
          )}
          <div className="cr-kpi-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.trendData} margin={compact ? { top: 2, right: 2, bottom: 2, left: 2 } : { top: 8, right: 8, bottom: 0, left: -30 }}>
                <defs>
                  <linearGradient id="crKpiFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={accent} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={accent} stopOpacity={0} />
                  </linearGradient>
                </defs>
                {!compact && (
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 9, fill: 'var(--shell-text-muted)', fontFamily: 'Inter,system-ui' }}
                    axisLine={false} tickLine={false} dy={4}
                  />
                )}
                <YAxis hide />
                {!compact && <Tooltip {...RECHARTS_TIP} cursor={{ stroke: 'var(--shell-border)', strokeWidth: 1 }} />}
                <Area
                  type="monotone" dataKey="value"
                  stroke={accent} strokeWidth={2}
                  fill="url(#crKpiFill)"
                  dot={false}
                  activeDot={compact ? false : { r: 4, fill: accent, strokeWidth: 0 }}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )
    }

    return (
      <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: gapSize, fontFamily: 'Inter,system-ui' }}>
        <span style={{ fontSize: labelSize, color: 'var(--shell-text-muted)' }}>{data.label}</span>
        <span style={{ fontSize: simValSize, fontWeight: 700, color: accent, lineHeight: 1 }}>{data.value}</span>
        {data.trend && (
          <span style={{ background: trendBg, borderRadius: 100, padding: '3px 12px', fontSize: labelSize, fontWeight: 600, color: trendColor }}>
            {data.trendUp ? '↑' : '↓'} {data.trend} {data.trendSuffix || 'from last month'}
          </span>
        )}
      </div>
    )
  }

  // ── Stacked horizontal bar ──────────────────────────────────────
  if (chartId === 'stack-hor') {
    return <StackHorChart data={data} showLegend={showLegend} chartColors={chartColors} printMode={printMode} seriesKeys={seriesKeys} onSegmentClick={onSegmentClick} />
  }

  // ── Pie / Donut ─────────────────────────────────────────────────
  if (chartId === 'pie') {
    const DEFAULT_RAW = [
      { label: 'Workstation',    count: '36,323', pct: '66.42%', value: 36323, change: 7.57 },
      { label: 'Server',         count: '11,476', pct: '20.99%', value: 11476, change: 5.24 },
      { label: 'Network Device', count: '4,478',  pct: '8.19%',  value: 4478,  change: 5.36 },
      { label: 'Mobile',         count: '2,407',  pct: '4.4%',   value: 2407,  change: 7.6  },
      { label: 'Virtual',        count: '1',      pct: '<1%',    value: 1,     change: 0    },
      { label: 'Unknown',        count: '1',      pct: '<1%',    value: 1,     change: 0    },
    ]
    const raw   = data || DEFAULT_RAW
    const sz    = 200
    const total = raw.reduce((s, d) => s + d.value, 0)
    const segs  = raw.map((d, i) => ({ ...d, color: chartColors?.[d.label] || d.color || DCOLS[i % DCOLS.length] }))

    const centerTop = totalLabel
      ? totalLabel
      : (showTotalCount ? total.toLocaleString() : String(segs.length))

    return (
      <div style={{ flex: 1, width: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 10px', flexShrink: 0 }}>
          <div style={{ position: 'relative', width: sz, height: sz }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={segs}
                  cx="50%" cy="50%"
                  innerRadius="76%" outerRadius="90%"
                  dataKey="value" nameKey="label"
                  paddingAngle={3}
                  strokeWidth={0}
                  startAngle={90} endAngle={-270}
                  cornerRadius={3}
                  isAnimationActive={false}
                >
                  {segs.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                {!printMode && <Tooltip content={<PieTooltip />} wrapperStyle={{ animation: 'none', overflow: 'visible', zIndex: 9999 }} />}
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, pointerEvents: 'none' }}>
              {showTotalCount ? (
                <>
                  <span style={{ fontSize: 10, color: PAI.fg3, fontFamily: 'Inter,system-ui' }}>Total</span>
                  <span style={{ fontSize: 18, fontWeight: 700, color: PAI.fg1, fontFamily: 'Inter,system-ui', lineHeight: 1 }}>{centerTop}</span>
                </>
              ) : (
                <span style={{ fontSize: 20, fontWeight: 700, color: PAI.fg1, fontFamily: 'Inter,system-ui' }}>{centerTop}</span>
              )}
            </div>
          </div>
        </div>

        {showLegend && (
          <div className="cr-pie-legend">
            {noteLabel && (
              <p className="cr-pie-legend__note">
                {noteLabel}: <strong>{total.toLocaleString()}</strong>
              </p>
            )}
            {description && <p className="cr-pie-legend__desc">{description}</p>}
            {note && <p className="cr-pie-legend__footer-note">{note}</p>}
            {segs.map((d, i) => (
              <div key={i} className="cr-pie-legend__row">
                <span className="cr-pie-legend__dot" style={{ background: d.color }} />
                <span className="cr-pie-legend__label">{d.label}</span>
                <span className="cr-pie-legend__count">{d.count}</span>
                <span className="cr-pie-legend__pct">{d.pct}</span>
                {showPctChange && (
                  d.change > 0
                    ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, background: 'rgba(22,163,74,0.10)', color: 'var(--pai-green)', fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 100, minWidth: 52, justifyContent: 'center', flexShrink: 0 }}>↗ {d.change}%</span>
                    : <span style={{ fontSize: 10, color: PAI.fg3, fontFamily: 'Inter,system-ui', minWidth: 52, textAlign: 'right', flexShrink: 0 }}>0%</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ── Semicircle gauge — red→amber→yellow→green gradient, proportional fill ──
  if (chartId === 'gauge-arc') {
    const raw = typeof data === 'number' ? data : (data?.value ?? 0)
    const value = Math.max(0, Math.min(100, raw))
    const markerValue = typeof data === 'object' ? data?.markerValue : undefined
    return <GaugeArc value={value} markerValue={markerValue} />
  }

  // ── Radar / spider chart ──────────────────────────────────────────
  if (chartId === 'radar') {
    const rows = data || DEFAULT_RADAR
    const rSeries = radarSeries || [{ key: 'value', color: 'var(--pai-indigo)', label: 'Value' }]
    return (
      <div style={{ flex: 1, width: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, minHeight: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={rows} outerRadius="72%">
              <PolarGrid stroke={GRID} />
              <PolarAngleAxis dataKey="label" tick={{ fontSize: 10, fill: TG, fontFamily: 'Inter,system-ui' }} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              {rSeries.map(s => (
                <Radar
                  key={s.key}
                  dataKey={s.key}
                  stroke={s.color}
                  fill={s.color}
                  fillOpacity={0.2}
                  isAnimationActive={false}
                  dot={{ r: 3, fill: s.color, strokeWidth: 0 }}
                />
              ))}
              {!printMode && <Tooltip {...RECHARTS_TIP} />}
            </RadarChart>
          </ResponsiveContainer>
        </div>
        {rSeries.length > 1 && (
          <div className="cr-radar-legend">
            {rSeries.map(s => (
              <div key={s.key} className="cr-radar-legend-item">
                <span className="cr-radar-legend-dot" style={{ '--cr-dot-bg': s.color }} />
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ── Horizontal bar chart ────────────────────────────────────────
  if (chartId === 'hor-bar') {
    // Stacked mode: data has unique/corroborated fields
    if (data && data[0]?.unique !== undefined) {
      const chartData = data.map(d => ({
        name: d.label,
        Unique: d.unique,
        Corroborated: d.corroborated,
      }))

      return (
        <div className="cr-source-root">
          <div className="cr-source-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 4, right: 36, bottom: 4, left: 0 }}
                barSize={8}
              >
                <XAxis type="number" domain={[0, 'dataMax']} hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={<SourceTick />}
                  width={92}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip {...RECHARTS_TIP} />
                <Bar dataKey="Corroborated" stackId="a" fill="var(--pai-chart-teal)" radius={[2, 0, 0, 2]} isAnimationActive={false} />
                <Bar
                  dataKey="Unique"
                  stackId="a"
                  fill="var(--pai-chart-purple)"
                  radius={[0, 2, 2, 0]}
                  isAnimationActive={false}
                  label={({ x, y, width, height, index }) => {
                    const total = chartData[index].Corroborated + chartData[index].Unique
                    return (
                      <text
                        x={x + width + 5}
                        y={y + height / 2 + 1}
                        dominantBaseline="middle"
                        fontSize={9}
                        fill="var(--shell-text-muted)"
                        fontFamily="Inter,system-ui"
                      >{total}</text>
                    )
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="cr-source-legend">
            <span className="cr-leg-dot cr-leg-dot--teal" /><span>Corroborated</span>
            <span className="cr-leg-dot cr-leg-dot--purple" /><span>Unique</span>
          </div>
        </div>
      )
    }

    // SVG percentage mode: explicit legacy data with percentage values + count labels
    if (data && data[0]?.count !== undefined) {
      const svgData = data
      const LABEL_W = 86
      const BAR_MAX = 110
      const ROW_H   = 24
      const VH      = 8 + svgData.length * ROW_H + 4
      const VW      = LABEL_W + BAR_MAX + 30

      return (
        <div
          data-cr-svgwrap=""
          style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', position: 'relative' }}
          onMouseMove={onSvgMove}
          onMouseLeave={() => setSvgTip(null)}
        >
          <svg viewBox={`0 0 ${VW} ${VH}`} width="100%" preserveAspectRatio="xMidYMid meet">
            {svgData.map((d, i) => {
              const y      = 8 + i * ROW_H
              const barW   = (d.value / 100) * BAR_MAX
              const secW   = d.secondary ? (d.secondary / 100) * BAR_MAX : 0
              const uniqW  = Math.max(barW - secW, 0)
              const tipVal = d.count != null ? d.count : d.value + '%'
              return (
                <g
                  key={i}
                  style={{ cursor: 'default' }}
                  onMouseEnter={(e) => onSvgEnter(e, d.label, tipVal)}
                  onMouseLeave={() => setSvgTip(null)}
                >
                  <text x={LABEL_W - 4} y={y + 14} fontSize="7.5" textAnchor="end" fill={TG} fontFamily="Inter,system-ui">{d.label}</text>
                  {uniqW > 0 && (
                    <rect x={LABEL_W} y={y + 6} width={secW + uniqW} height="11" rx="5" fill="var(--pai-indigo-light)"/>
                  )}
                  {secW > 0 && (
                    <rect x={LABEL_W} y={y + 6} width={secW} height="11" rx="5" fill="var(--pai-indigo)"/>
                  )}
                  <text x={LABEL_W + barW + 4} y={y + 14} fontSize="7.5" fill={TG} fontFamily="Inter,system-ui">{tipVal}</text>
                </g>
              )
            })}
          </svg>
          {svgTip && (
            <div className="cr-tooltip" style={{ left: svgTip.x + 14, top: svgTip.y - 44 }}>
              <div className="cr-tooltip__label">{svgTip.label}</div>
              <span className="cr-tooltip__val">{svgTip.value}</span>
            </div>
          )}
        </div>
      )
    }

    // Default: Recharts colored horizontal bar — used by settings-panel-configured widgets
    const horRows = data || DEFAULT_VERT_BAR
    const horChartData = horRows.map((d, i) => ({
      name: d.label,
      value: d.value,
      fill: (chartColors && chartColors[d.label]) || d.color || DCOLS[i % DCOLS.length],
    }))
    const horTotal   = horChartData.reduce((s, d) => s + (d.value || 0), 0)
    const horRef     = reportTotal || horTotal
    const horTopItem = horChartData[0]
    const horTopPct  = horRef > 0 ? (horTopItem.value / horRef * 100).toFixed(2) : '0'

    return (
      <div className="cr-vert-root">
        <div className={showLegend ? 'cr-bar-chart-area--with-legend' : 'cr-bar-chart-area'}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={horChartData}
              layout="vertical"
              margin={{ top: 4, right: 100, bottom: xLabel ? 28 : 8, left: 0 }}
              barSize={14}
            >
              <XAxis
                type="number"
                tick={{ fontSize: 9, fill: TG, fontFamily: 'Inter,system-ui' }}
                axisLine={false} tickLine={false}
                tickFormatter={v => v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)}
                label={xLabel ? { value: xLabel, position: 'insideBottom', offset: -16, fontSize: 11, fill: TG, fontFamily: 'Inter,system-ui' } : undefined}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 10, fill: TG, fontFamily: 'Inter,system-ui' }}
                width={110}
                axisLine={false}
                tickLine={false}
              />
              {!printMode && <Tooltip content={<BarTooltip total={horTotal} />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />}
              <Bar dataKey="value" radius={[0, 3, 3, 0]} isAnimationActive={false}>
                {horChartData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                <LabelList
                  dataKey="value"
                  position="right"
                  formatter={(v) => {
                    const pct = horRef > 0 ? (v / horRef * 100).toFixed(2) : '0'
                    return `${v.toLocaleString()} (${pct}%)`
                  }}
                  style={{ fontSize: 11, fill: '#1a1a1a', fontFamily: 'Inter,system-ui', fontWeight: 600 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        {showLegend && (
          <div className="cr-bar-legend">
            {horChartData.map((d, i) => {
              const pct = horTotal > 0 ? ((d.value / horTotal) * 100).toFixed(2) : '0'
              return (
                <div key={i} className="cr-bar-legend-row">
                  <span className="cr-bar-legend-dot" style={{ '--cr-dot-bg': d.fill }} />
                  <span className="cr-bar-legend-name">{d.name}</span>
                  <span className="cr-bar-legend-count">{d.value.toLocaleString()}</span>
                  <span className="cr-bar-legend-pct">{pct}%</span>
                </div>
              )
            })}
          </div>
        )}
        {legendDesc && (() => {
          const n = horTopItem.name
          const v = horTopItem.value.toLocaleString()
          const p = horTopPct
          const s = { fontSize: 11, color: '#374151', lineHeight: 1.55, margin: '8px 0 0', flexShrink: 0 }
          const b = (t) => <strong style={{ fontWeight: 700 }}>{t}</strong>
          if (legendDesc === 'os') return (
            <p style={s}>{b(n)} is the dominant operating system accounting for {b(`${v} (${p}%)`)} of total vulnerable devices.</p>
          )
          if (legendDesc === 'service') return (
            <p style={s}>{b(n)} is the most common service running for about {b(`${v} (${p}%)`)} of total vulnerable devices.</p>
          )
          return (
            <p style={s}>Out of {horRef.toLocaleString()} {legendDesc}, {b(n)} is the most common, affecting {b(`${v} (${p}%)`)} of vulnerable devices.</p>
          )
        })()}
      </div>
    )
  }

  // ── Stacked vertical bar chart ────────────────────────────────
  if (chartId === 'stack-vert') {
    return <StackVertChart data={data} showLegend={showLegend} chartColors={chartColors} printMode={printMode} seriesKeys={seriesKeys} />
  }

  // ── Vertical bar chart ─────────────────────────────────────────
  if (chartId === 'vert-bar') {
    const rows = data || DEFAULT_VERT_BAR
    const chartData = rows.map((d, i) => ({
      name: d.label,
      value: d.value,
      fill: (chartColors && chartColors[d.label]) || d.color || DCOLS[i % DCOLS.length],
    }))
    const total = chartData.reduce((s, d) => s + (d.value || 0), 0)

    return (
      <div className="cr-vert-root">
        <div className={showLegend ? 'cr-bar-chart-area--with-legend' : 'cr-bar-chart-area'}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 8, right: 16, bottom: xLabel ? 32 : 8, left: yLabel ? 16 : -10 }}
              barSize={22}
            >
              <CartesianGrid vertical={false} stroke="var(--shell-border)" strokeDasharray="0" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: TG, fontFamily: 'Inter,system-ui' }}
                axisLine={false} tickLine={false}
                interval={0}
                label={xLabel ? { value: xLabel, position: 'insideBottom', offset: -16, fontSize: 11, fill: TG, fontFamily: 'Inter,system-ui' } : undefined}
              />
              <YAxis
                tick={{ fontSize: 10, fill: TG, fontFamily: 'Inter,system-ui' }}
                axisLine={false} tickLine={false}
                tickFormatter={v => v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)}
                width={yLabel ? 52 : 40}
                label={yLabel ? { value: yLabel, angle: -90, position: 'insideLeft', offset: 10, fontSize: 11, fill: TG, fontFamily: 'Inter,system-ui' } : undefined}
              />
              {!printMode && <Tooltip content={<BarTooltip total={total} />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />}
              <Bar dataKey="value" radius={[3, 3, 0, 0]} isAnimationActive={false}>
                {chartData.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        {showLegend && (
          <div className="cr-bar-legend-wrap">
            {noteLabel && (
              <p className="cr-bar-legend-note">
                {noteLabel}: <strong>{total.toLocaleString()}</strong>
              </p>
            )}
            {legendDesc && <p className="cr-bar-legend-desc">{legendDesc}</p>}
            <div className="cr-bar-legend">
              {chartData.map((d, i) => {
                const pct = total > 0 ? ((d.value / total) * 100).toFixed(2) : '0'
                return (
                  <div key={i} className="cr-bar-legend-row">
                    <span className="cr-bar-legend-dot" style={{ '--cr-dot-bg': d.fill }} />
                    <span className="cr-bar-legend-name">{d.name}</span>
                    <span className="cr-bar-legend-count">{d.value.toLocaleString()}</span>
                    <span className="cr-bar-legend-pct">{pct}%</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Table ────────────────────────────────────────────────────────
  if (chartId === 'table') {
    if (data && Array.isArray(data) && data[0]?.text) {
      return (
        <div className="cr-insights-root">
          <div className={printMode ? undefined : 'cr-insights-scroll'}>
            <table className="cr-insights-table">
              <thead>
                <tr>
                  <th className="cr-th" />
                  <th className="cr-th">Assessment</th>
                  <th className="cr-th cr-th--num">Findings Failed</th>
                  <th className="cr-th cr-th--num">Exposure Category</th>
                </tr>
              </thead>
              <tbody>
                {data.map((r, i) => (
                  <tr key={i} className="cr-tr">
                    <td className="cr-td cr-td-icon"><SevIcon /></td>
                    <td className="cr-td cr-td-text">{r.text}</td>
                    <td className="cr-td">
                      <div className="cr-findings-bar">
                        <div className="cr-findings-bar__track">
                          <div className="cr-findings-bar__fill" style={{ '--cr-pct': `${r.failPct}%` }} />
                        </div>
                        <span className="cr-findings-pct">{r.failPct}%</span>
                      </div>
                    </td>
                    <td className="cr-td cr-td-cat">{r.cat}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )
    }

    // ── Host SLA Breach table: { assetType, nonBreaching, breaching, total, isTotal? }
    if (data && Array.isArray(data) && data[0]?.assetType !== undefined) {
      return (
        <div className="cr-rpt-table-root">
          <div className={printMode ? undefined : 'cr-rpt-table-scroll'}>
            <table className="cr-rpt-table">
              <thead>
                <tr>
                  <th className="cr-rpt-th cr-rpt-th--left">Asset Type</th>
                  <th className="cr-rpt-th cr-rpt-th--green">Non-Breaching</th>
                  <th className="cr-rpt-th cr-rpt-th--red">Breaching</th>
                  <th className="cr-rpt-th">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.map((r, i) => (
                  <tr key={i} className={r.isTotal ? 'cr-rpt-tr cr-rpt-tr--total' : 'cr-rpt-tr'}>
                    <td className="cr-rpt-td cr-rpt-td--left">{r.assetType}</td>
                    <td className="cr-rpt-td">{r.nonBreaching}</td>
                    <td className="cr-rpt-td">{r.breaching}</td>
                    <td className="cr-rpt-td">{r.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )
    }

    // ── SLA Timeline table: { severity, breaching, overHalfway, underHalfway, total, isTotal? }
    if (data && Array.isArray(data) && data[0]?.severity !== undefined && data[0]?.overHalfway !== undefined) {
      const SEV_BADGE = {
        Critical: { bg: 'rgba(220,38,38,0.10)',  color: 'var(--pai-crit-fg)',  border: 'var(--pai-crit-fg)'  },
        High:     { bg: 'rgba(217,119,6,0.10)',  color: 'var(--pai-high-fg)',  border: 'var(--pai-high-fg)'  },
        Medium:   { bg: 'rgba(202,138,4,0.10)',  color: 'var(--pai-med-fg)',   border: 'var(--pai-med-fg)'   },
        Low:      { bg: 'rgba(22,163,74,0.10)',  color: 'var(--pai-green)',    border: 'var(--pai-green)'    },
      }
      return (
        <div className="cr-rpt-table-root">
          <div className={printMode ? undefined : 'cr-rpt-table-scroll'}>
            <table className="cr-rpt-table">
              <thead>
                <tr>
                  <th className="cr-rpt-th cr-rpt-th--left">Severity</th>
                  <th className="cr-rpt-th">Breaching</th>
                  <th className="cr-rpt-th">Over halfway</th>
                  <th className="cr-rpt-th">Under halfway</th>
                  <th className="cr-rpt-th">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.map((r, i) => {
                  const sc = SEV_BADGE[r.severity]
                  return (
                    <tr key={i} className={r.isTotal ? 'cr-rpt-tr cr-rpt-tr--total' : 'cr-rpt-tr'}>
                      <td className="cr-rpt-td cr-rpt-td--left">
                        {sc
                          ? <span className="cr-rpt-sev-badge" style={{ background: sc.bg, color: sc.color, borderColor: sc.border }}>{r.severity}</span>
                          : r.severity
                        }
                      </td>
                      <td className="cr-rpt-td">{r.breaching}</td>
                      <td className="cr-rpt-td">{r.overHalfway}</td>
                      <td className="cr-rpt-td">{r.underHalfway}</td>
                      <td className="cr-rpt-td">{r.total}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )
    }

    // ── Simple report table: { category, count, pct, isTotal? }
    if (data && Array.isArray(data) && data[0]?.category !== undefined) {
      const colA = columns?.[0] || 'Category'
      const colB = columns?.[1] || 'Count (%)'
      return (
        <div className="cr-rpt-table-root">
          <div className={printMode ? undefined : 'cr-rpt-table-scroll'}>
            <table className="cr-rpt-table">
              <thead>
                <tr>
                  <th className="cr-rpt-th cr-rpt-th--left cr-rpt-th--muted">{colA}</th>
                  <th className="cr-rpt-th cr-rpt-th--muted">{colB}</th>
                </tr>
              </thead>
              <tbody>
                {data.map((r, i) => (
                  <tr key={i} className={r.isTotal ? 'cr-rpt-tr cr-rpt-tr--total' : 'cr-rpt-tr'}>
                    <td className="cr-rpt-td cr-rpt-td--left">{r.category}</td>
                    <td className="cr-rpt-td">
                      <span className="cr-rpt-count">{r.count}</span>
                      <span className="cr-rpt-pct"> ({r.pct})</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )
    }

    // KG-style table: type/displayLabel data or default
    const allRows = (data && Array.isArray(data) && data.length > 0 && data[0]?.type)
      ? data
      : DEFAULT_KG_TABLE
    const tableCols = (columns && columns.length > 0) ? columns : ['Type', 'Display Label']

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [kgPage, setKgPage] = useState(1)
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [kgRows, setKgRows] = useState(10)
    const kgStart   = (kgPage - 1) * kgRows
    const pagedRows = allRows.slice(kgStart, kgStart + kgRows)

    return (
      <div className="cr-kg-root">
        <div className="cr-kg-scroll">
          <table className="ds-table cr-kg-table">
            <thead>
              <tr>
                <th className="ds-th cr-kg-th--icon" />
                {tableCols.map(col => <th key={col} className="ds-th">{col}</th>)}
              </tr>
            </thead>
            <tbody>
              {pagedRows.map((r, i) => (
                <tr key={i}>
                  <td className="ds-td cr-kg-td--icon">
                    <img src="assets/icons/explore.svg" width={12} height={12} alt="" />
                  </td>
                  {tableCols.map(col => (
                    <td key={col} className={`ds-td${col === 'Display Label' ? ' cr-kg-td--label' : ''}`}>
                      {kgCellValue(r, col)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TablePagination
          total={allRows.length}
          page={kgPage}
          rowsPerPage={kgRows}
          onPageChange={setKgPage}
          onRowsPerPageChange={n => { setKgRows(n); setKgPage(1) }}
        />
      </div>
    )
  }

  // ── Line chart ──────────────────────────────────────────────────
  if (chartId === 'line') {
    const PLACEHOLDER = [
      { name: 'Jan', value: 420 },
      { name: 'Feb', value: 680 },
      { name: 'Mar', value: 510 },
      { name: 'Apr', value: 790 },
      { name: 'May', value: 630 },
      { name: 'Jun', value: 870 },
    ]
    const hasData   = series && series.length > 0
    const seriesDef = hasData ? series : [{ label: 'value', color: 'var(--pai-indigo)' }]
    const labels    = hasData ? (xLabels || series[0].data.map((_, i) => `P${i + 1}`)) : PLACEHOLDER.map(d => d.name)
    const chartData = hasData
      ? labels.map((name, i) => {
          const pt = { name }
          series.forEach(s => { pt[s.label] = s.data[i] ?? 0 })
          return pt
        })
      : PLACEHOLDER

    const isMulti   = seriesDef.length > 1
    const axisProps = {
      tick: { fontSize: 11, fill: 'var(--shell-text-muted)', fontFamily: 'Inter,system-ui' },
      axisLine: false,
      tickLine: false,
    }
    const margin = { top: 16, right: 24, bottom: 8, left: 8 }

    if (isMulti) {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={margin}>
            <CartesianGrid horizontal vertical={false} stroke="var(--card-border, #F0F0F0)" />
            <XAxis dataKey="name" {...axisProps} dy={8} />
            <YAxis {...axisProps} width={40} />
            <Tooltip {...RECHARTS_TIP} />
            {seriesDef.map(s => (
              <Line
                key={s.label}
                type="monotone"
                dataKey={s.label}
                stroke={s.color}
                strokeWidth={2}
                isAnimationActive={false}
                dot={{ r: 4, fill: s.color, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: s.color, strokeWidth: 0 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )
    }

    const lineColor = seriesDef[0].color
    const lineKey   = seriesDef[0].label
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={margin}>
          <defs>
            <linearGradient id="crLineFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={lineColor} stopOpacity={0.20} />
              <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid horizontal vertical={false} stroke="var(--card-border, #F0F0F0)" />
          <XAxis dataKey="name" {...axisProps} dy={8} />
          <YAxis {...axisProps} width={40} />
          <Tooltip {...RECHARTS_TIP} isAnimationActive={false} cursor={false} />
          <Area
            type="monotone"
            dataKey={lineKey}
            stroke={lineColor}
            strokeWidth={2}
            fill="url(#crLineFill)"
            dot={{ r: 5, fill: lineColor, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: lineColor, strokeWidth: 0 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    )
  }

  // ── Remaining chart types ────────────────────────────────────────
  const svToVal = (y) => Math.round((1000 - (y - 14) * 800 / 108) / 10) * 10
  const charts = {
    'vert-bar': (
      <svg viewBox="0 0 220 160" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        {[14,41,68,95,122].map(y => (
          <line key={y} x1="30" y1={y} x2="210" y2={y} stroke={GRID} strokeWidth="0.8"/>
        ))}
        {[1000,800,600,400,200].map((v,i) => (
          <text key={i} x="28" y={18+i*27} fontSize="7.5" textAnchor="end" fill={TG} fontFamily="Inter,system-ui">{v}</text>
        ))}
        {[[110,SEV[0]],[78,SEV[1]],[52,SEV[2]],[20,SEV[3]],[7,SEV[4]]].map(([h,clr],i) => (
          <rect key={i} x={36+i*36} y={133-h} width="18" height={h} rx="3" fill={clr} style={{ cursor: 'default' }}
            onMouseEnter={(e) => onSvgEnter(e, ['Crit','High','Med','Low','Comp'][i], svToVal(133-h).toLocaleString())}
            onMouseLeave={() => setSvgTip(null)}
          />
        ))}
        <line x1="30" y1="133" x2="210" y2="133" stroke={GRID} strokeWidth="1"/>
        {['Crit','High','Med','Low','Comp'].map((lbl,i) => (
          <text key={i} x={36+i*36+9} y="147" fontSize="7" textAnchor="middle" fill={TG} fontFamily="Inter,system-ui">{lbl}</text>
        ))}
      </svg>
    ),
    'stack-vert': (
      <svg viewBox="0 0 220 160" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        {[14,41,68,95,122].map(y => (
          <line key={y} x1="30" y1={y} x2="210" y2={y} stroke={GRID} strokeWidth="0.8"/>
        ))}
        {[1000,800,600,400,200].map((v,i) => (
          <text key={i} x="28" y={18+i*27} fontSize="7.5" textAnchor="end" fill={TG} fontFamily="Inter,system-ui">{v}</text>
        ))}
        {[[50,40,30],[30,50,40],[60,35,25],[20,45,55],[40,30,50]].map(([h1,h2,h3],i) => {
          const x = 36+i*36; const t = h1+h2+h3
          const sevLabels = ['Critical','High','Medium']
          return (
            <g key={i}>
              <rect x={x} y={133-t}      width="18" height={h1} rx="2" fill={SEV[0]} style={{ cursor: 'default' }}
                onMouseEnter={(e) => onSvgEnter(e, sevLabels[0], svToVal(133-t).toLocaleString())}
                onMouseLeave={() => setSvgTip(null)}
              />
              <rect x={x} y={133-h2-h3}  width="18" height={h2}        fill={SEV[1]} style={{ cursor: 'default' }}
                onMouseEnter={(e) => onSvgEnter(e, sevLabels[1], svToVal(133-h2-h3).toLocaleString())}
                onMouseLeave={() => setSvgTip(null)}
              />
              <rect x={x} y={133-h3}     width="18" height={h3}        fill={SEV[2]} style={{ cursor: 'default' }}
                onMouseEnter={(e) => onSvgEnter(e, sevLabels[2], svToVal(133-h3).toLocaleString())}
                onMouseLeave={() => setSvgTip(null)}
              />
            </g>
          )
        })}
        <line x1="30" y1="133" x2="210" y2="133" stroke={GRID} strokeWidth="1"/>
        {['name','name','name','name','name'].map((lbl,i) => (
          <text key={i} x={36+i*36+9} y="147" fontSize="7" textAnchor="middle" fill={TG} fontFamily="Inter,system-ui">{lbl}</text>
        ))}
      </svg>
    ),
    'stack-hor': (
      <svg viewBox="0 0 220 160" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        {[38,79,120,161,202].map(x => (
          <line key={x} x1={x} y1="10" x2={x} y2="133" stroke={GRID} strokeWidth="0.8"/>
        ))}
        {['name','name','name','name','name'].map((lbl,i) => (
          <text key={i} x="36" y={22+i*24} fontSize="7.5" textAnchor="end" fill={TG} fontFamily="Inter,system-ui">{lbl}</text>
        ))}
        {[[80,50,30],[60,55,25],[70,45,35],[35,60,45],[15,30,20]].map(([w1,w2,w3],i) => {
          const y = 17+i*24
          const sevLabels = ['Critical','High','Medium']
          return (
            <g key={i}>
              <rect x={38}       y={y} width={w1} height="12" rx="2" fill={SEV[0]} style={{ cursor: 'default' }}
                onMouseEnter={(e) => onSvgEnter(e, sevLabels[0], w1)}
                onMouseLeave={() => setSvgTip(null)}
              />
              <rect x={38+w1}    y={y} width={w2} height="12"        fill={SEV[1]} style={{ cursor: 'default' }}
                onMouseEnter={(e) => onSvgEnter(e, sevLabels[1], w2)}
                onMouseLeave={() => setSvgTip(null)}
              />
              <rect x={38+w1+w2} y={y} width={w3} height="12"        fill={SEV[2]} style={{ cursor: 'default' }}
                onMouseEnter={(e) => onSvgEnter(e, sevLabels[2], w3)}
                onMouseLeave={() => setSvgTip(null)}
              />
            </g>
          )
        })}
        <line x1="38" y1="133" x2="210" y2="133" stroke={GRID} strokeWidth="1"/>
        {[0,100,200,300,400].map((v,i) => (
          <text key={i} x={38+i*41} y="147" fontSize="7.5" textAnchor="middle" fill={TG} fontFamily="Inter,system-ui">{v}</text>
        ))}
      </svg>
    ),
    'kpi': (
      <svg viewBox="0 0 220 110" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        <text x="110" y="50" textAnchor="middle" fontSize="38" fontWeight="700" fill={CAT[0]} fontFamily="Inter,system-ui">1,284</text>
        <text x="110" y="70" textAnchor="middle" fontSize="11"                  fill="var(--shell-text-muted)" fontFamily="Inter,system-ui">Total Assets</text>
        <rect x="70" y="78" width="80" height="18" rx="9" fill="var(--pai-low-bg)"/>
        <text x="110" y="91" textAnchor="middle" fontSize="10" fontWeight="500" fill="var(--pai-low-fg)" fontFamily="Inter,system-ui">↑ 12% from last month</text>
      </svg>
    ),
    'heading': <div style={{ width: '100%', height: '100%' }} />,
    'none':    <div style={{ width: '100%', height: '100%' }} />,
  }

  return (
    <div
      data-cr-svgwrap=""
      style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}
      onMouseMove={onSvgMove}
      onMouseLeave={() => setSvgTip(null)}
    >
      {charts[chartId] || charts['vert-bar']}
      {svgTip && (
        <div className="cr-tooltip" style={{ left: svgTip.x + 14, top: svgTip.y - 44 }}>
          <div className="cr-tooltip__label">{svgTip.label}</div>
          <span className="cr-tooltip__val">{svgTip.value}</span>
        </div>
      )}
    </div>
  )
}
