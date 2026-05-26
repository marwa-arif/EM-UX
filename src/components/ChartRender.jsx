import React from 'react'
import {
  AreaChart, Area,
  BarChart, Bar,
  XAxis, YAxis,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { PAI } from '../ui.jsx'

// ── DS palette ────────────────────────────────────────────────────
const GRID  = 'var(--shell-border)'
const SEV   = ['var(--pai-crit-fg)','var(--pai-high-fg)','var(--pai-caution-fg)','var(--pai-green)','var(--pai-low-fg)']
const CAT   = ['var(--pai-indigo)','var(--pai-nav-teal)','#2ea8a8','#5c6bc0','var(--pai-indigo-muted)','#3a7fcb']
const TG    = 'var(--shell-text-muted)'
const DCOLS = ['var(--pai-crit-fg)','var(--pai-high-fg)','var(--pai-indigo)','var(--pai-green)','#64748B','#94A3B8']

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

export function ChartRender({
  chartId,
  showPctChange = false,
  showLegend    = true,
  showTotalCount = true,
  data,
  series,
  xLabels,
  totalLabel,
}) {
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
                <Tooltip content={() => null} cursor={false} />
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
      <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16, padding: '4px 0', fontFamily: 'Inter,system-ui' }}>
        <div style={{ display: 'flex', height: 12, borderRadius: 4, overflow: 'hidden', gap: 2 }}>
          {data.map((d, i) => (
            <div key={i} style={{ flex: d.pct, background: d.color, borderRadius: 3 }} />
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
    const sz    = 120, cx = 60, cy = 60
    const outerR = sz / 2 - 2
    const strokeW = outerR * 0.12
    const r     = outerR - strokeW / 2
    const total = raw.reduce((s, d) => s + d.value, 0)

    const ptCart = (cx, cy, r, deg) => {
      const rad = (deg - 90) * Math.PI / 180
      return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
    }
    const arc = (sa, ea) => {
      const s = ptCart(cx, cy, r, ea), e = ptCart(cx, cy, r, sa)
      const la = (ea - sa) <= 180 ? '0' : '1'
      return `M ${s.x} ${s.y} A ${r} ${r} 0 ${la} 0 ${e.x} ${e.y}`
    }

    let sa = 0
    const segs = raw.map((d, i) => {
      const sweep = (d.value / total) * 360
      const ea    = sa + sweep - (sweep > 10 ? 6 : 1)
      const seg   = { ...d, color: d.color || DCOLS[i % DCOLS.length], d: arc(sa, Math.max(ea, sa + 1)) }
      sa += sweep
      return seg
    })

    const centerTop = totalLabel
      ? totalLabel
      : (showTotalCount ? total.toLocaleString() : String(segs.length))

    return (
      <div style={{ flex: 1, width: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 10px', flexShrink: 0 }}>
          <div style={{ position: 'relative', width: sz, height: sz }}>
            <svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`}>
              {segs.map((d, i) => (
                <path key={i} d={d.d} fill="none" stroke={d.color} strokeWidth={strokeW} strokeLinecap="round" />
              ))}
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
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
    // Recharts mode: data has unique/corroborated
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
                <Tooltip content={() => null} cursor={false} />
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

    // SVG mode: data has value/secondary
    if (data) {
      const LABEL_W = 86
      const BAR_MAX = 110
      const ROW_H   = 24
      const VH      = 8 + data.length * ROW_H + 4
      const VW      = LABEL_W + BAR_MAX + 30

      return (
        <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
          <svg viewBox={`0 0 ${VW} ${VH}`} width="100%" preserveAspectRatio="xMidYMid meet">
            {data.map((d, i) => {
              const y      = 8 + i * ROW_H
              const barW   = (d.value / 100) * BAR_MAX
              const secW   = d.secondary ? (d.secondary / 100) * BAR_MAX : 0
              const uniqW  = Math.max(barW - secW, 0)
              return (
                <g key={i}>
                  <text x={LABEL_W - 4} y={y + 14} fontSize="7.5" textAnchor="end" fill={TG} fontFamily="Inter,system-ui">{d.label}</text>
                  {uniqW > 0 && (
                    <rect x={LABEL_W} y={y + 6} width={secW + uniqW} height="11" rx="5" fill="var(--pai-indigo-light)"/>
                  )}
                  {secW > 0 && (
                    <rect x={LABEL_W} y={y + 6} width={secW} height="11" rx="5" fill="var(--pai-indigo)"/>
                  )}
                  <text x={LABEL_W + barW + 4} y={y + 14} fontSize="7.5" fill={TG} fontFamily="Inter,system-ui">{d.count != null ? d.count : d.value + '%'}</text>
                </g>
              )
            })}
          </svg>
        </div>
      )
    }

    // Default hardcoded
    return (
      <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg viewBox="0 0 220 160" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
          {[38,79,120,161,202].map(x => (
            <line key={x} x1={x} y1="10" x2={x} y2="133" stroke={GRID} strokeWidth="0.8"/>
          ))}
          {['Critical','High','Medium','Low','Compliant'].map((lbl,i) => (
            <text key={i} x="36" y={22+i*24} fontSize="7.5" textAnchor="end" fill={TG} fontFamily="Inter,system-ui">{lbl}</text>
          ))}
          {[[115,SEV[0]],[85,SEV[1]],[50,SEV[2]],[30,SEV[3]],[8,SEV[4]]].map(([w,clr],i) => (
            <rect key={i} x={38} y={17+i*24} width={w} height="12" rx="3" fill={clr}/>
          ))}
          <line x1="38" y1="133" x2="210" y2="133" stroke={GRID} strokeWidth="1"/>
          {[0,100,200,300,400].map((v,i) => (
            <text key={i} x={38+i*41} y="147" fontSize="7.5" textAnchor="middle" fill={TG} fontFamily="Inter,system-ui">{v}</text>
          ))}
        </svg>
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

    // Default skeleton
    return (
      <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg viewBox="0 0 220 160" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
          <rect x="8" y="8" width="204" height="22" rx="4" fill={CAT[0]}/>
          {[0,1,2,3,4].map(i => (
            <g key={i}>
              <rect x="8"   y={40+i*23} width="204" height="21" rx="2" fill={i%2===0?'var(--pai-indigo-tint)':'var(--card-bg)'}/>
              <rect x="14"  y={46+i*23} width="32"  height="9"  rx="3" fill={i%2===0?'rgba(103,96,216,0.3)':'var(--shell-border)'}/>
              <rect x="54"  y={46+i*23} width="80"  height="9"  rx="3" fill={i%2===0?'rgba(103,96,216,0.3)':'var(--shell-border)'}/>
              <rect x="148" y={46+i*23} width="52"  height="9"  rx="3" fill={i%2===0?'rgba(103,96,216,0.3)':'var(--shell-border)'}/>
            </g>
          ))}
        </svg>
      </div>
    )
  }

  // ── Line chart ──────────────────────────────────────────────────
  if (chartId === 'line') {
    if (series) return null

    return (
      <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
            <circle key={i} cx={x} cy={y} r="3.5" fill="var(--card-bg)" stroke={CAT[0]} strokeWidth="1.5"/>
          ))}
          {[[38,90],[76,110],[114,60],[152,85],[190,70]].map(([x,y],i) => (
            <circle key={i} cx={x} cy={y} r="3.5" fill="var(--card-bg)" stroke={CAT[1]} strokeWidth="1.5"/>
          ))}
          {[[38,125],[76,95],[114,130],[152,100],[190,115]].map(([x,y],i) => (
            <circle key={i} cx={x} cy={y} r="3.5" fill="var(--card-bg)" stroke={SEV[0]} strokeWidth="1.5"/>
          ))}
          <line x1="30" y1="133" x2="210" y2="133" stroke={GRID} strokeWidth="1"/>
          {['name','name','name','name','name'].map((lbl,i) => (
            <text key={i} x={38+i*38} y="147" fontSize="7.5" textAnchor="middle" fill={TG} fontFamily="Inter,system-ui">{lbl}</text>
          ))}
        </svg>
      </div>
    )
  }

  // ── Remaining chart types ────────────────────────────────────────
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
          <rect key={i} x={36+i*36} y={133-h} width="18" height={h} rx="3" fill={clr}/>
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
          return (
            <g key={i}>
              <rect x={x} y={133-t}      width="18" height={h1} rx="2" fill={SEV[0]}/>
              <rect x={x} y={133-h2-h3}  width="18" height={h2}        fill={SEV[1]}/>
              <rect x={x} y={133-h3}     width="18" height={h3}        fill={SEV[2]}/>
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
          return (
            <g key={i}>
              <rect x={38}       y={y} width={w1} height="12" rx="2" fill={SEV[0]}/>
              <rect x={38+w1}    y={y} width={w2} height="12"        fill={SEV[1]}/>
              <rect x={38+w1+w2} y={y} width={w3} height="12"        fill={SEV[2]}/>
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
    <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {charts[chartId] || charts['vert-bar']}
    </div>
  )
}
