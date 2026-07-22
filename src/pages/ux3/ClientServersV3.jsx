import React, { useState } from 'react'
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import '../../styles/client-servers.css'
import * as D from './serversData'

const SEV_COLOR = {
  Critical: 'var(--pai-crit-fg)',
  High: 'var(--pai-high-fg)',
  Medium: 'var(--pai-med-fg)',
}

const TOOLTIP_STYLE = {
  contentStyle: {
    background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 6,
    fontSize: 11, padding: '6px 10px', fontFamily: 'Inter,system-ui',
    color: 'var(--shell-text)', boxShadow: '0 2px 8px rgba(0,0,0,0.14)',
  },
  labelStyle: { color: 'var(--shell-text-muted)', fontSize: 10, marginBottom: 2, fontWeight: 600 },
  itemStyle: { padding: 0, fontSize: 11 },
  cursor: { fill: 'var(--shell-hover)' },
}

const IcChevron = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6"/>
  </svg>
)
const IcChevronUp = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m18 15-6-6-6 6"/>
  </svg>
)

// ── Collapsible section card — mirrors the xo3-card collapse pattern ──
function Section({ title, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="card csv-card">
      <div className="csv-card-hdr">
        <div className="csv-card-hdr-left">
          <span className="csv-card-title">{title}</span>
        </div>
        <button className="ds-btn sz-md t-tertiary" onClick={() => setOpen(o => !o)}>
          {open ? <IcChevronUp /> : <IcChevron />}
          {open ? 'Collapse' : 'Expand'}
        </button>
      </div>
      {open && <div className="csv-card-body">{children}</div>}
    </div>
  )
}

function ChartLegend() {
  return (
    <div className="csv-chart-legend">
      <span className="csv-chart-legend-item"><span className="csv-chart-legend-dot" style={{ '--csv-dot': SEV_COLOR.Critical }} />Critical</span>
      <span className="csv-chart-legend-item"><span className="csv-chart-legend-dot" style={{ '--csv-dot': SEV_COLOR.High }} />High</span>
      <span className="csv-chart-legend-item"><span className="csv-chart-legend-dot" style={{ '--csv-dot': SEV_COLOR.Medium }} />Medium</span>
      <span className="csv-chart-legend-item"><span className="csv-chart-legend-line" />Average</span>
    </div>
  )
}

// ── Stacked severity trend chart (Critical/High/Medium over time),
// plus a dashed average-total line read off its own right-side axis ──
function TrendChart({ data, height = 260 }) {
  const dataWithAverage = data.map(r => ({
    ...r,
    Average: ((r.Critical || 0) + (r.High || 0) + (r.Medium || 0)) / 3,
  }))
  const fmtTick = v => v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)

  return (
    <div className="csv-chart-wrap">
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={dataWithAverage} margin={{ top: 8, right: 16, bottom: 8, left: 0 }} barSize={26}>
          <CartesianGrid vertical={false} stroke="var(--shell-border)" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: 'var(--shell-text-muted)', fontFamily: 'Inter,system-ui' }}
            axisLine={false} tickLine={false}
            interval={0} angle={0} textAnchor="middle" dy={8}
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 11, fill: 'var(--shell-text-muted)', fontFamily: 'Inter,system-ui' }}
            axisLine={false} tickLine={false}
            tickFormatter={fmtTick}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 11, fill: 'var(--shell-accent)', fontFamily: 'Inter,system-ui' }}
            axisLine={false} tickLine={false}
            tickFormatter={fmtTick}
          />
          <Tooltip {...TOOLTIP_STYLE} formatter={v => Number(v).toLocaleString()} />
          <Bar yAxisId="left" dataKey="Critical" name="Critical" stackId="sev" fill={SEV_COLOR.Critical} isAnimationActive={false} />
          <Bar yAxisId="left" dataKey="High" name="High" stackId="sev" fill={SEV_COLOR.High} isAnimationActive={false} />
          <Bar yAxisId="left" dataKey="Medium" name="Medium" stackId="sev" fill={SEV_COLOR.Medium} radius={[3, 3, 0, 0]} isAnimationActive={false} />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="Average"
            name="Average"
            stroke="var(--shell-accent)"
            strokeWidth={2}
            strokeDasharray="1 4"
            strokeLinecap="round"
            dot={{ r: 3, fill: 'var(--shell-accent)', strokeWidth: 0 }}
            activeDot={{ r: 4 }}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
      <ChartLegend />
    </div>
  )
}

// ── Generic data table with severity-aware numeric coloring ──
function DataTable({ columns, rows }) {
  return (
    <div className="ds-table-wrap csv-table-wrap">
      <table className="ds-table csv-table">
        <thead>
          <tr>
            {columns.map(c => (
              <th key={c.key} className={`ds-th${c.align === 'right' ? ' csv-right' : ''}`}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={row._total ? 'csv-tr-total' : undefined}>
              {columns.map(c => {
                const val = row[c.key]
                const display = typeof val === 'number' ? val.toLocaleString() : (val || '—')
                return (
                  <td
                    key={c.key}
                    className={`ds-td${c.align === 'right' ? ' csv-right' : ''}${c.sev ? ` csv-num--${c.sev}` : ''}`}
                  >
                    {display}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TableBlock({ title, table, scroll = false }) {
  return (
    <div className="csv-subcard">
      {title && <div className="csv-subhead">{title}</div>}
      <div className={scroll ? 'csv-table-scroll' : undefined}>
        <DataTable columns={table.columns} rows={table.rows} />
      </div>
    </div>
  )
}

// ── Ageing table rendered as a per-column intensity heat map ──
// Each severity column is bucketed into 4 levels by rank (not raw value) so a
// single outlier row can't wash out the shading for the rest of the column.
function AgeingHeatmap({ title, table }) {
  const sevCols = table.columns.filter(c => c.sev)
  const levelByRowAndCol = table.rows.map(() => ({}))
  sevCols.forEach(col => {
    const order = table.rows
      .map((row, i) => ({ i, val: Number(row[col.key]) || 0 }))
      .sort((a, b) => a.val - b.val)
    order.forEach((entry, rank) => {
      levelByRowAndCol[entry.i][col.key] = Math.floor((rank / order.length) * 4) + 1
    })
  })

  return (
    <div className="csv-subcard">
      {title && <div className="csv-subhead">{title}</div>}
      <div className="csv-table-wrap">
        <table className="ds-table csv-table csv-heatmap">
          <thead>
            <tr>
              {table.columns.map(c => (
                <th key={c.key} className={`ds-th${c.align === 'right' ? ' csv-right' : ''}`}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, i) => (
              <tr key={i}>
                {table.columns.map(c => {
                  const val = row[c.key]
                  const display = typeof val === 'number' ? val.toLocaleString() : (val || '—')
                  const level = c.sev ? levelByRowAndCol[i][c.key] : null
                  const className = [
                    'ds-td',
                    c.align === 'right' ? 'csv-right' : '',
                    c.sev ? `csv-num--${c.sev} csv-heat--${c.sev}-${level}` : '',
                  ].filter(Boolean).join(' ')
                  return <td key={c.key} className={className}>{display}</td>
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Crown Jewels / Windows / Linux / Azure — one card, toggled between the four ──
const SERVER_CATEGORY_TABS = [
  { key: 'cj', label: 'Crown Jewels Servers' },
  { key: 'windows', label: 'Windows Servers' },
  { key: 'linux', label: 'Linux Servers' },
  { key: 'azure', label: 'Azure Servers' },
]

function ServerCategorySection() {
  const [tab, setTab] = useState('cj')
  return (
    <div className="card csv-card">
      <div className="csv-card-hdr">
        <div className="csv-card-hdr-left">
          <div className="csv-tabbar">
            {SERVER_CATEGORY_TABS.map(t => (
              <button
                key={t.key}
                className={`ds-btn sz-md ${tab === t.key ? 't-primary' : 't-outline'}`}
                onClick={() => setTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="csv-card-body">
        {tab === 'cj' && (
          <>
            <div className="csv-subcard">
              <div className="csv-subhead">Weekly Vulnerability Trend</div>
              <TrendChart data={D.CJ_WEEKLY_TREND.rows} height={280} />
            </div>
            <TableBlock title={D.CJ_BASELINE_TABLE.title} table={D.CJ_BASELINE_TABLE} />
            <TableBlock title={D.CJ_CURRENT_TABLE.title} table={D.CJ_CURRENT_TABLE} />
          </>
        )}

        {tab === 'windows' && (
          <>
            <div className="csv-subcard">
              <div className="csv-subhead">Monthly Trend</div>
              <TrendChart data={D.WIN_TREND.rows} height={280} />
            </div>
            <div className="csv-grid-2">
              <TableBlock title="By Head Of Department" table={D.WIN_HOD_TABLE} />
              <AgeingHeatmap title="By Ageing" table={D.WIN_AGEING_TABLE} />
            </div>
            <div className="csv-grid-2">
              <TableBlock title="Top 10 Critical CVE" table={D.WIN_TOP_CRITICAL_CVE} />
              <TableBlock title="Top 10 High CVE" table={D.WIN_TOP_HIGH_CVE} />
            </div>
            <TableBlock title="Top 20 Affected Hosts (Windows)" table={D.WIN_TOP_HOSTS} />
          </>
        )}

        {tab === 'linux' && (
          <>
            <div className="csv-subcard">
              <div className="csv-subhead">Monthly Trend</div>
              <TrendChart data={D.LINUX_TREND.rows} height={280} />
            </div>
            <div className="csv-grid-2">
              <TableBlock title="By Asset Owner" table={D.LINUX_ASSET_OWNER_TABLE} />
              <AgeingHeatmap title="By Ageing" table={D.LINUX_AGEING_TABLE} />
            </div>
            <div className="csv-grid-2">
              <TableBlock title="Top 10 Critical CVE (Linux)" table={D.LINUX_TOP_CRITICAL_CVE} />
              <TableBlock title="Top 20 Affected Hosts (Linux)" table={D.LINUX_TOP_HOSTS} />
            </div>
          </>
        )}

        {tab === 'azure' && (
          <>
            <TableBlock title="Windows Azure Servers — by Head Of Department" table={D.AZURE_WIN_HOD_TABLE} />
            <TableBlock title="Linux Azure Servers — by Head Of Department" table={D.AZURE_LINUX_HOD_TABLE} />
            <div className="csv-grid-2">
              <TableBlock title="Top 10 Vulnerable Windows Hosts" table={D.AZURE_TOP_WIN_HOSTS} scroll />
              <TableBlock title="Top 10 Vulnerable Linux Hosts" table={D.AZURE_TOP_LINUX_HOSTS} scroll />
            </div>
            <TableBlock title="Top 10 CVEs" table={D.AZURE_TOP_CVE} scroll />
          </>
        )}
      </div>
    </div>
  )
}

export default function ClientServersV3() {
  return (
    <div className="page csv-page">

      {/* Slide 8 — Open Vulnerabilities Trend (All Servers) */}
      {/* Slide 2 — Server Inventory and Vulnerabilities Details, moved below the trend bar chart */}
      <Section title="Open Vulnerabilities Trend — All Servers">
        <TrendChart data={D.ALL_SERVERS_TREND.rows} height={320} />
        <TableBlock title="Server Inventory and Vulnerabilities Details" table={D.INVENTORY_TABLE} />
      </Section>

      {/* Slides 1, 3, 5 — Crown Jewels / Windows / Linux, toggled in one card */}
      <ServerCategorySection />

    </div>
  )
}
