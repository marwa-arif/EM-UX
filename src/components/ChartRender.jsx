import React, { useState } from 'react'
import TablePagination from './TablePagination'
import {
  AreaChart, Area,
  BarChart, Bar, Cell,
  PieChart, Pie,
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

// Origins palette — matches screenshot legend colors
const STACK_ORIGINS = [
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
    <div style={{
      background: 'var(--card-bg)',
      border: `1px solid ${d.fill}`,
      borderRadius: 8,
      padding: '10px 12px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.14)',
      fontFamily: 'Inter,system-ui',
      pointerEvents: 'none',
      minWidth: 140,
    }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--shell-text)', marginBottom: 6 }}>{d.name}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, fontSize: 12, fontWeight: 700, color: 'var(--shell-text)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.fill, flexShrink: 0, display: 'inline-block' }} />
          {val}
        </span>
        <span style={{ color: d.fill }}>{pct}</span>
      </div>
    </div>
  )
}

// ── Stack tooltip ─────────────────────────────────────────────────
function StackTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const total = payload.reduce((s, p) => s + (p.value || 0), 0)
  return (
    <div style={{
      background: 'var(--card-bg)',
      border: '1px solid var(--card-border)',
      borderRadius: 8,
      padding: '10px 12px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
      fontFamily: 'Inter,system-ui',
      pointerEvents: 'none',
      minWidth: 180,
    }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--shell-text)', marginBottom: 8 }}>{label}</div>
      {[...payload].reverse().map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.fill, flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: 11, color: 'var(--shell-text-muted)' }}>{p.name}</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--shell-text)' }}>
            {p.value >= 1000 ? `${(p.value / 1000).toFixed(1)}k` : p.value}
          </span>
          <span style={{ fontSize: 10, color: p.fill, minWidth: 32, textAlign: 'right' }}>
            {total > 0 ? `${Math.round((p.value / total) * 100)}%` : ''}
          </span>
        </div>
      ))}
      <div style={{ borderTop: '1px solid var(--shell-border)', marginTop: 6, paddingTop: 5, display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
        <span style={{ color: 'var(--shell-text-muted)' }}>Total</span>
        <span style={{ fontWeight: 700, color: 'var(--shell-text)' }}>{total >= 1000 ? `${(total / 1000).toFixed(1)}k` : total}</span>
      </div>
    </div>
  )
}

// ── Pie tooltip ───────────────────────────────────────────────────
function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div style={{
      background: 'var(--card-bg)',
      border: `1px solid ${p.color}`,
      borderRadius: 6,
      padding: '6px 10px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.14)',
      fontFamily: 'Inter,system-ui',
      pointerEvents: 'none',
      minWidth: 130,
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--shell-text)', marginBottom: 4 }}>{p.label}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 11, marginBottom: 2 }}>
        <span style={{ color: 'var(--shell-text-muted)' }}>Count</span>
        <span style={{ fontWeight: 600, color: 'var(--shell-text)' }}>{p.count}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 11 }}>
        <span style={{ color: 'var(--shell-text-muted)' }}>Percentage</span>
        <span style={{ fontWeight: 600, color: 'var(--shell-text)' }}>{p.pct}</span>
      </div>
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
  totalLabel,
  columns,
  chartColors,
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
    const trendColor = data.trendUp ? 'var(--pai-green)' : 'var(--pai-crit-fg)'
    const trendBg    = data.trendUp ? 'rgba(22,163,74,0.10)' : 'rgba(220,38,38,0.10)'

    if (data.trendData) {
      return (
        <div className="cr-kpi-root">
          <div className="cr-kpi-meta">
            <span className="cr-kpi-label">{data.label}</span>
            <span className="cr-kpi-value">{data.value}</span>
            {data.trend && (
              <span
                className="cr-kpi-badge"
                style={{ '--cr-trend-bg': trendBg, '--cr-trend-color': trendColor }}
              >
                {data.trendUp ? '↑' : '↓'} {data.trend} from last month
              </span>
            )}
          </div>
          <div className="cr-kpi-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.trendData} margin={{ top: 8, right: 8, bottom: 0, left: -30 }}>
                <defs>
                  <linearGradient id="crKpiFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="var(--pai-indigo)" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="var(--pai-indigo)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 9, fill: 'var(--shell-text-muted)', fontFamily: 'Inter,system-ui' }}
                  axisLine={false} tickLine={false} dy={4}
                />
                <YAxis hide />
                <Tooltip {...RECHARTS_TIP} cursor={{ stroke: 'var(--shell-border)', strokeWidth: 1 }} />
                <Area
                  type="monotone" dataKey="value"
                  stroke="var(--pai-indigo)" strokeWidth={2}
                  fill="url(#crKpiFill)"
                  dot={{ r: 3, fill: 'var(--pai-indigo)', strokeWidth: 0 }}
                  activeDot={{ r: 4, fill: 'var(--pai-indigo)', strokeWidth: 0 }}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )
    }

    return (
      <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, fontFamily: 'Inter,system-ui' }}>
        <span style={{ fontSize: 11, color: 'var(--shell-text-muted)' }}>{data.label}</span>
        <span style={{ fontSize: 44, fontWeight: 700, color: 'var(--pai-indigo)', lineHeight: 1 }}>{data.value}</span>
        {data.trend && (
          <span style={{ background: trendBg, borderRadius: 100, padding: '3px 12px', fontSize: 11, fontWeight: 600, color: trendColor }}>
            {data.trendUp ? '↑' : '↓'} {data.trend} from last month
          </span>
        )}
      </div>
    )
  }

  // ── Stacked horizontal bar ──────────────────────────────────────
  if (chartId === 'stack-hor' && data) {
    return (
      <div
        data-cr-svgwrap=""
        style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16, padding: '4px 0', fontFamily: 'Inter,system-ui', position: 'relative' }}
        onMouseMove={onSvgMove}
        onMouseLeave={() => setSvgTip(null)}
      >
        <div style={{ display: 'flex', height: 12, borderRadius: 4, overflow: 'hidden', gap: 2 }}>
          {data.map((d, i) => (
            <div
              key={i}
              style={{ flex: d.pct, background: d.color, borderRadius: 3, cursor: 'default' }}
              onMouseEnter={(e) => onSvgEnter(e, d.label, `${d.count} · ${d.pct.toFixed(2)}%`)}
              onMouseLeave={() => setSvgTip(null)}
            />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          {data.map((d, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingLeft: 8, borderLeft: `2px solid ${d.color}`, flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 11, color: 'var(--shell-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.label}</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--shell-text)' }}>{d.count}</span>
                <span style={{ fontSize: 10, color: 'var(--shell-text-muted)' }}>{d.pct.toFixed(2)}%</span>
              </div>
            </div>
          ))}
        </div>
        {svgTip && (
          <div className="cr-tooltip" style={{ left: svgTip.x + 14, top: svgTip.y - 44 }}>
            <div className="cr-tooltip__label">{svgTip.label}</div>
            <span className="cr-tooltip__val">{svgTip.value}</span>
          </div>
        )}
      </div>
    )
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
    const sz    = 120
    const total = raw.reduce((s, d) => s + d.value, 0)
    const segs  = raw.map((d, i) => ({ ...d, color: d.color || DCOLS[i % DCOLS.length] }))

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
                  innerRadius="72%" outerRadius="90%"
                  dataKey="value" nameKey="label"
                  paddingAngle={3}
                  strokeWidth={0}
                  startAngle={90} endAngle={-270}
                  cornerRadius={3}
                  isAnimationActive={false}
                >
                  {segs.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip
                  content={<PieTooltip />}
                  wrapperStyle={{ animation: 'none', overflow: 'visible', zIndex: 9999 }}
                />
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
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5, padding: '0 8px 8px' }}>
            {segs.map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 11, color: PAI.fg1, fontFamily: 'Inter,system-ui' }}>{d.label}</span>
                <span style={{ fontSize: 11, color: PAI.fg3, fontFamily: 'Inter,system-ui', minWidth: 40, textAlign: 'right' }}>{d.count}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: PAI.fg1, fontFamily: 'Inter,system-ui', minWidth: 36, textAlign: 'right' }}>{d.pct}</span>
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
    const horTotal = horChartData.reduce((s, d) => s + (d.value || 0), 0)

    return (
      <div className="cr-vert-root">
        <div className={showLegend ? 'cr-bar-chart-area--with-legend' : 'cr-bar-chart-area'}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={horChartData}
              layout="vertical"
              margin={{ top: 4, right: 40, bottom: 4, left: 0 }}
              barSize={14}
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
                tick={<SourceTick />}
                width={88}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<BarTooltip total={horTotal} />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="value" radius={[0, 3, 3, 0]} isAnimationActive={false}>
                {horChartData.map((d, i) => <Cell key={i} fill={d.fill} />)}
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
      </div>
    )
  }

  // ── Stacked vertical bar chart ────────────────────────────────
  if (chartId === 'stack-vert') {
    const rows = data || DEFAULT_STACK_VERT
    const chartData = rows.map(r => ({ ...r, name: r.type }))

    // compute per-origin totals for the legend
    const originTotals = STACK_ORIGINS.map(o => ({
      ...o,
      total: rows.reduce((s, r) => s + (r[o.key] || 0), 0),
    }))
    const grandTotal = originTotals.reduce((s, o) => s + o.total, 0)

    return (
      <div className="cr-vert-root">
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
              <Tooltip
                content={<StackTooltip />}
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                wrapperStyle={{ zIndex: 9999 }}
              />
              {STACK_ORIGINS.map((o, i) => (
                <Bar
                  key={o.key}
                  dataKey={o.key}
                  stackId="stack"
                  fill={o.color}
                  radius={i === STACK_ORIGINS.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]}
                  isAnimationActive={false}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
        {showLegend && (
          <div className="cr-bar-legend">
            {originTotals.map((o, i) => (
              <div key={i} className="cr-bar-legend-row">
                <span className="cr-bar-legend-dot" style={{ '--cr-dot-bg': o.color }} />
                <span className="cr-bar-legend-name">{o.key}</span>
                <span className="cr-bar-legend-count">{o.total.toLocaleString()}</span>
                <span className="cr-bar-legend-pct">
                  {grandTotal > 0 ? `${((o.total / grandTotal) * 100).toFixed(2)}%` : '0%'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    )
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
              margin={{ top: 8, right: 8, bottom: 52, left: -10 }}
              barSize={22}
            >
              <XAxis
                dataKey="name"
                tick={{ fontSize: 8, fill: TG, fontFamily: 'Inter,system-ui' }}
                axisLine={false} tickLine={false}
                interval={0}
                angle={-35}
                textAnchor="end"
                dy={4}
              />
              <YAxis
                tick={{ fontSize: 8, fill: TG, fontFamily: 'Inter,system-ui' }}
                axisLine={false} tickLine={false}
                tickFormatter={v => v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)}
              />
              <Tooltip content={<BarTooltip total={total} />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="value" radius={[3, 3, 0, 0]} isAnimationActive={false}>
                {chartData.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        {showLegend && (
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
        )}
      </div>
    )
  }

  // ── Table ────────────────────────────────────────────────────────
  if (chartId === 'table') {
    if (data && Array.isArray(data) && data[0]?.text) {
      return (
        <div className="cr-insights-root">
          <div className="cr-insights-scroll">
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
                    <img src="/assets/icons/explore.svg" width={12} height={12} alt="" />
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
    if (series) return null

    const yToVal = (y) => Math.round((1000 - (y - 14) * 800 / 108) / 10) * 10
    return (
      <div
        data-cr-svgwrap=""
        style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}
        onMouseMove={onSvgMove}
        onMouseLeave={() => setSvgTip(null)}
      >
        <svg viewBox="0 0 220 160" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="dsGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={CAT[0]} stopOpacity="0.20"/>
              <stop offset="100%" stopColor={CAT[0]} stopOpacity="0.01"/>
            </linearGradient>
          </defs>
          {[14,41,68,95,122].map(y => (
            <line key={y} x1="30" y1={y} x2="210" y2={y} stroke={GRID} strokeWidth="0.8"/>
          ))}
          {[1000,800,600,400,200].map((v,i) => (
            <text key={i} x="28" y={18+i*27} fontSize="7.5" textAnchor="end" fill={TG} fontFamily="Inter,system-ui">{v}</text>
          ))}
          <path d="M38,115 L76,75 L114,95 L152,55 L190,45 L190,133 L38,133 Z" fill="url(#dsGrad)"/>
          <polyline points="38,115 76,75 114,95 152,55 190,45" fill="none" stroke={CAT[0]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <polyline points="38,90 76,110 114,60 152,85 190,70"  fill="none" stroke={CAT[1]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <polyline points="38,125 76,95 114,130 152,100 190,115" fill="none" stroke={SEV[0]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          {[[38,115],[76,75],[114,95],[152,55],[190,45]].map(([x,y],i) => (
            <circle key={i} cx={x} cy={y} r="5" fill="var(--card-bg)" stroke={CAT[0]} strokeWidth="1.5" style={{ cursor: 'default' }}
              onMouseEnter={(e) => onSvgEnter(e, `S1 · P${i+1}`, yToVal(y).toLocaleString())}
              onMouseLeave={() => setSvgTip(null)}
            />
          ))}
          {[[38,90],[76,110],[114,60],[152,85],[190,70]].map(([x,y],i) => (
            <circle key={i} cx={x} cy={y} r="5" fill="var(--card-bg)" stroke={CAT[1]} strokeWidth="1.5" style={{ cursor: 'default' }}
              onMouseEnter={(e) => onSvgEnter(e, `S2 · P${i+1}`, yToVal(y).toLocaleString())}
              onMouseLeave={() => setSvgTip(null)}
            />
          ))}
          {[[38,125],[76,95],[114,130],[152,100],[190,115]].map(([x,y],i) => (
            <circle key={i} cx={x} cy={y} r="5" fill="var(--card-bg)" stroke={SEV[0]} strokeWidth="1.5" style={{ cursor: 'default' }}
              onMouseEnter={(e) => onSvgEnter(e, `S3 · P${i+1}`, yToVal(y).toLocaleString())}
              onMouseLeave={() => setSvgTip(null)}
            />
          ))}
          <line x1="30" y1="133" x2="210" y2="133" stroke={GRID} strokeWidth="1"/>
          {['name','name','name','name','name'].map((lbl,i) => (
            <text key={i} x={38+i*38} y="147" fontSize="7.5" textAnchor="middle" fill={TG} fontFamily="Inter,system-ui">{lbl}</text>
          ))}
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
