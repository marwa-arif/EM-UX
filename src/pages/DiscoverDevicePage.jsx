import React, { useState } from 'react'
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import TablePagination from '../components/TablePagination.jsx'
import { DSPillSearch } from '../context/WorkspaceCtx.jsx'
import '../styles/device.css'

// ── Static data ───────────────────────────────────────────────────

const TIME_RANGES = ['1 W', '1 M', '3 M', '6 M', '1 Y'];

const SOURCES = [
  { name: 'AWS',                 total: 97, corr: 5  },
  { name: 'MS Azure',            total: 85, corr: 5  },
  { name: 'Qualys',              total: 56, corr: 20 },
  { name: 'MS Active Directory', total: 47, corr: 30 },
  { name: 'WIZ',                 total: 38, corr: 5  },
  { name: 'Infoblox',            total: 12, corr: 7  },
  { name: 'MS Defender',         total: 8,  corr: 5  },
  { name: 'Tenable',             total: 5,  corr: 3  },
];

const TYPES = [
  { label: 'Server',           icon: 'server',      count: 4086, pct: 33, color: 'var(--pai-indigo)' },
  { label: 'Workstation',      icon: 'workstation', count: 2848, pct: 23, color: '#5BADB8' },
  { label: 'Network',          icon: 'network',     count: 2600, pct: 21, color: 'var(--pai-green)' },
  { label: 'Mobile',           icon: 'mobile',      count: 897,  pct: 8,  color: 'var(--pai-high-fg)' },
  { label: 'Printers',         icon: 'printer',     count: 124,  pct: 1,  color: 'var(--pai-red-high)' },
  { label: 'IOT',              icon: 'iot',         count: 122,  pct: 1,  color: 'var(--pai-indigo-muted)' },
  { label: 'Storage Accounts', icon: 'storage',     count: 2,    pct: 1,  color: '#C4C4C4' },
];

const INSIGHTS = [
  { sev: 'high', text: 'EDM or VM scan has not been completed for the latest day.',  trend: 'down', n: 2,  f1: 208, f2: 34,  cat: 'Control Gap' },
  { sev: 'high', text: 'The AV signature has not been updated.',                     trend: 'flat', n: 4,  f1: 290, f2: 0,   cat: 'Control Gap' },
  { sev: 'high', text: 'EDM or VM scan has not been completed for the latest day.',  trend: 'down', n: 1,  f1: 620, f2: 100, cat: 'Control Gap' },
  { sev: 'high', text: 'Devices Running with End of Life OS',                        trend: 'down', n: 3,  f1: 199, f2: 26,  cat: 'Control Gap' },
  { sev: 'high', text: 'Implement Cryptographic Protection',                         trend: 'flat', n: 3,  f1: 208, f2: 34,  cat: 'Control Gap' },
  { sev: 'low',  text: 'EDM or VM scan has not been completed for last 30 days',     trend: 'down', n: 6,  f1: 88,  f2: 244, cat: 'Control Gap' },
  { sev: 'low',  text: 'Devices Running with End of Life OS',                        trend: 'up',   n: 11, f1: 199, f2: 26,  cat: 'Control Gap' },
];

const CRITICALITY = [
  { label: 'Critical', count: '1,238', pct: 10, color: 'var(--pai-crit-fg)' },
  { label: 'High',     count: '1,857', pct: 15, color: 'var(--pai-red-high)' },
  { label: 'Medium',   count: '3,096', pct: 25, color: 'var(--pai-high-fg)' },
  { label: 'Very Low', count: '6,191', pct: 50, color: 'var(--pai-green)' },
];

const ASSETS = [
  { name: 'support-portal.acm...', score: 1, os: 'Windows', type: 'Workstation', infra: 'On-Prem' },
  { name: 'DESKTOP-4FHS873',       score: 1, os: 'Windows', type: 'Workstation', infra: 'On-Prem' },
  { name: 'DESKTOP-F0NQGHD',       score: 4, os: 'Windows', type: 'Workstation', infra: 'On-Prem' },
  { name: 'SAMSUNG_S24-DOE',       score: 6, os: 'Windows', type: 'Mobile',      infra: 'On-Prem' },
  { name: 'DESKTOP-48HSG78',       score: 6, os: 'Windows', type: 'Workstation', infra: 'On-Prem' },
];

// ── Chart data ────────────────────────────────────────────────────

const TYPES_PIE_DATA = TYPES.slice(0, 6).map(t => ({
  label: t.label,
  count: t.count.toLocaleString(),
  value: t.count,
  pct: t.pct <= 1 ? '<1%' : `${t.pct}%`,
  color: t.color,
}));

const TREND_CHART_DATA = [
  { name: '12 Jun', value: 8520  },
  { name: '19 Jun', value: 9140  },
  { name: '26 Jun', value: 9880  },
  { name: '3 Jul',  value: 10450 },
  { name: '10 Jul', value: 11020 },
  { name: '17 Jul', value: 11640 },
  { name: '24 Jul', value: 12030 },
  { name: '31 Jul', value: 12382 },
];

const SOURCES_CHART_DATA = SOURCES.map(s => ({
  name: s.name,
  Unique: s.total - s.corr,
  Corroborated: s.corr,
}));

// ── Inline icons ──────────────────────────────────────────────────

const IcSort = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/>
  </svg>
);
const IcTrendUp = ({ size = 12, color = 'var(--pai-crit-fg)' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
);
const IcTrendDown = ({ size = 12, color = 'var(--pai-green)' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
    <polyline points="17 18 23 18 23 12"/>
  </svg>
);
const IcMinus = ({ size = 12, color = 'var(--shell-text-muted)' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IcExplore = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
);
const IcNewlyAdded = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--pai-indigo)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
  </svg>
);

// Type icon inline SVGs (fallback for icons not in /assets/icons)
const TYPE_ICONS = {
  server:      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><circle cx="7" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="7" cy="18" r="1" fill="currentColor" stroke="none"/></svg>,
  workstation: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>,
  network:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><path d="M12 7v4M12 11l-5 6M12 11l5 6"/></svg>,
  mobile:      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></svg>,
  printer:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>,
  iot:         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1" fill="currentColor" stroke="none"/></svg>,
  storage:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/></svg>,
};

const IcWindows = () => (
  <svg width="13" height="13" viewBox="0 0 88 88" fill="none">
    <path d="M0 12.4L36.1 7.4V43H0V12.4z" fill="#0078D4"/>
    <path d="M40.6 6.7L88 0v43H40.6V6.7z" fill="#0078D4"/>
    <path d="M0 47h36.1v35.6l-36.1-5V47z" fill="#0078D4"/>
    <path d="M40.6 47H88v41L40.6 81.3V47z" fill="#0078D4"/>
  </svg>
);

const IcSevHigh = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
    <path d="M12 2L2 20h20L12 2z" fill="rgba(209,35,41,0.12)" stroke="var(--pai-crit-fg)" strokeWidth="1.8" strokeLinejoin="round"/>
    <line x1="12" y1="10" x2="12" y2="14" stroke="var(--pai-crit-fg)" strokeWidth="1.8" strokeLinecap="round"/>
    <circle cx="12" cy="17" r="1" fill="var(--pai-crit-fg)"/>
  </svg>
);
const IcSevMed = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
    <path d="M12 2L2 20h20L12 2z" fill="rgba(217,139,29,0.12)" stroke="var(--pai-high-fg)" strokeWidth="1.8" strokeLinejoin="round"/>
    <line x1="12" y1="10" x2="12" y2="14" stroke="var(--pai-high-fg)" strokeWidth="1.8" strokeLinecap="round"/>
    <circle cx="12" cy="17" r="1" fill="var(--pai-high-fg)"/>
  </svg>
);

// ── Page ──────────────────────────────────────────────────────────

export default function DiscoverDevicePage() {
  const [timeRange,     setTimeRange]     = useState('1 Y');
  const [insightSearch, setInsightSearch] = useState('');
  const [assetSearch,   setAssetSearch]   = useState('');
  const [insightPage,   setInsightPage]   = useState(1);
  const [assetPage,     setAssetPage]     = useState(1);
  const [rowsPer,       setRowsPer]       = useState(10);

  const filteredInsights = INSIGHTS.filter(r =>
    r.text.toLowerCase().includes(insightSearch.toLowerCase())
  );
  const filteredAssets = ASSETS.filter(r =>
    r.name.toLowerCase().includes(assetSearch.toLowerCase())
  );

  const TH = ({ children }) => (
    <th className="dev-th">
      <span className="dev-th-inner">{children}<span className="dev-th-sort"><IcSort /></span></span>
    </th>
  );

  return (
    <div className="dev-page">
      <div className="dev-grid">

        {/* ── Left column ──────────────────────────────── */}
        <div className="dev-col-left">

          {/* Total stat + trend chart */}
          <div className="dev-card">
            <div className="dev-stat-header">
              <div className="dev-stat-title-row">
                <span className="dev-stat-label">Total</span>
                <span className="dev-newly-added">
                  <IcNewlyAdded />
                  <span>15 Newly added</span>
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="dev-time-pills">
                  {TIME_RANGES.map(r => (
                    <button
                      key={r}
                      className={`dev-time-pill${timeRange === r ? ' dev-time-pill--active' : ''}`}
                      onClick={() => setTimeRange(r)}
                    >{r}</button>
                  ))}
                </div>
                <button className="pai-btn pai-btn--tertiary pai-btn--sm">
                  Trend Explore <IcExplore />
                </button>
              </div>
            </div>

            <div className="dev-stat-value-row">
              <div>
                <div className="dev-stat-value">12,382</div>
                <div className="dev-stat-meta">
                  <IcTrendUp size={13} color="var(--pai-crit-fg)" />
                  <span className="dev-stat-change up">2%</span>
                  <span className="dev-stat-from">from last month</span>
                </div>
              </div>
            </div>

            <div className="dev-chart-area" style={{ flex: 1, minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={TREND_CHART_DATA} margin={{ top: 16, right: 16, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="var(--pai-indigo)" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="var(--pai-indigo)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--shell-border)" strokeWidth={1} vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: 'var(--shell-text-muted)', fontFamily: 'Inter,system-ui' }}
                    axisLine={false}
                    tickLine={false}
                    dy={6}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: 'var(--shell-text-muted)', fontFamily: 'Inter,system-ui' }}
                    axisLine={false}
                    tickLine={false}
                    width={44}
                    tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--card-bg)',
                      border: '1px solid var(--card-border)',
                      borderRadius: 4,
                      fontSize: 11,
                      fontFamily: 'Inter,system-ui',
                      color: 'var(--shell-text)',
                    }}
                    itemStyle={{ color: 'var(--pai-indigo)' }}
                    cursor={{ stroke: 'var(--shell-border)', strokeWidth: 1 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    name="Total"
                    stroke="var(--pai-indigo)"
                    strokeWidth={2}
                    fill="url(#trendFill)"
                    dot={{ r: 5, fill: 'var(--pai-indigo)', strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: 'var(--pai-indigo)', strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bottom row: Data Source + Type */}
          <div className="dev-bottom-row">

            {/* Data Source */}
            <div className="dev-card dev-source-card">
              <div className="dev-card-title">Data Source</div>
              <div style={{ flex: 1, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={SOURCES_CHART_DATA}
                    layout="vertical"
                    margin={{ top: 4, right: 44, bottom: 4, left: 0 }}
                    barSize={10}
                  >
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 10, fill: 'var(--shell-text-muted)', fontFamily: 'Inter,system-ui' }}
                      width={88}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--card-border)',
                        borderRadius: 4,
                        fontSize: 11,
                        fontFamily: 'Inter,system-ui',
                        color: 'var(--shell-text)',
                      }}
                      cursor={{ fill: 'var(--shell-hover)' }}
                    />
                    <Bar dataKey="Corroborated" stackId="a" fill="var(--pai-chart-teal)" radius={[2, 0, 0, 2]} />
                    <Bar
                      dataKey="Unique"
                      stackId="a"
                      fill="var(--pai-chart-purple)"
                      radius={[0, 2, 2, 0]}
                      label={({ x, y, width, height, index }) => {
                        const total = SOURCES_CHART_DATA[index].Corroborated + SOURCES_CHART_DATA[index].Unique
                        return (
                          <text
                            x={x + width + 16}
                            y={y + height / 2 + 1}
                            dominantBaseline="middle"
                            fontSize={10}
                            fill="var(--shell-text-muted)"
                            fontFamily="Inter,system-ui"
                          >{total}%</text>
                        )
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="dev-chart-legend" style={{ marginTop: 8 }}>
                <span className="dev-legend-dot" style={{ background: 'var(--pai-chart-teal)' }} /><span>Corroborated</span>
                <span className="dev-legend-dot" style={{ background: 'var(--pai-chart-purple)', marginLeft: 16 }} /><span>Unique</span>
              </div>
            </div>

            {/* Type + Donut */}
            <div className="dev-card dev-type-card">
              <div className="dev-card-title">Type</div>
              <div className="dev-donut-wrap" style={{ position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={TYPES_PIE_DATA}
                      cx="50%"
                      cy="50%"
                      innerRadius="46%"
                      outerRadius="52%"
                      paddingAngle={4}
                      dataKey="value"
                      nameKey="label"
                      strokeWidth={0}
                      startAngle={90}
                      endAngle={-270}
                    >
                      {TYPES_PIE_DATA.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--card-border)',
                        borderRadius: 4,
                        fontSize: 11,
                        fontFamily: 'Inter,system-ui',
                        color: 'var(--shell-text)',
                      }}
                      formatter={(value, name) => [value.toLocaleString(), name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{
                  position: 'absolute', top: '50%', left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center', pointerEvents: 'none',
                }}>
                  <div style={{ fontSize: 11, color: 'var(--shell-text-muted)', fontFamily: 'Inter,system-ui' }}>Total</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--shell-text)', fontFamily: 'Inter,system-ui', lineHeight: 1, marginTop: 2 }}>6</div>
                </div>
              </div>
              <div className="dev-type-list">
                {TYPES.map((t, i) => (
                  <div key={i} className="dev-type-row">
                    <div className="dev-type-row-left">
                      <span className="dev-type-icon" style={{ color: t.color }}>{TYPE_ICONS[t.icon]}</span>
                      <span className="dev-type-name">{t.label}</span>
                    </div>
                    <div className="dev-type-row-right">
                      <span className="dev-type-count">{t.count.toLocaleString()}</span>
                      <span className="dev-type-pct">{t.pct <= 1 ? '<1' : t.pct}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* ── Right column ─────────────────────────────── */}
        <div className="dev-col-right">

          {/* Key Security Insights */}
          <div className="dev-card dev-insights-card">
            <div className="dev-card-hdr">
              <span className="dev-card-title">Key Security Insights — Top 5</span>
              <DSPillSearch
                value={insightSearch}
                onChange={v => { setInsightSearch(v); setInsightPage(1); }}
                placeholder="Search assessments…"
              />
            </div>
            <div className="dev-table-wrap">
              <table className="dev-table">
                <thead>
                  <tr>
                    <th className="dev-th dev-th-icon" />
                    <TH>Assessments Name</TH>
                    <TH>Findings</TH>
                    <TH>Exposure Category</TH>
                  </tr>
                </thead>
                <tbody>
                  {filteredInsights.slice((insightPage-1)*rowsPer, insightPage*rowsPer).map((r, i) => (
                    <tr key={i} className="dev-tr">
                      <td className="dev-td dev-td-icon">
                        {r.sev === 'high' ? <IcSevHigh /> : <IcSevMed />}
                      </td>
                      <td className="dev-td dev-td-name">{r.text}</td>
                      <td className="dev-td dev-td-findings">
                        <span className="dev-trend-cell">
                          {r.trend === 'down' ? <IcTrendDown size={12} /> : r.trend === 'up' ? <IcTrendUp size={12} /> : <IcMinus size={12} />}
                          <span>{r.n}</span>
                        </span>
                        <span className="dev-findings-pair">
                          <span>{r.f1}</span>
                          <span className="dev-findings-dot" />
                          <span>{r.f2}</span>
                        </span>
                      </td>
                      <td className="dev-td">
                        <span className="pai-chip pai-chip--indigo">Control Gap</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <TablePagination
              total={filteredInsights.length}
              page={insightPage}
              rowsPerPage={rowsPer}
              onPageChange={setInsightPage}
              onRowsPerPageChange={n => { setRowsPer(n); setInsightPage(1); }}
            />
          </div>

          {/* Criticality */}
          <div className="dev-card dev-crit-card">
            <div className="dev-card-hdr">
              <span className="dev-card-title">Criticality — Top 5</span>
            </div>

            <div className="dev-crit-bar-section">
              <div className="dev-stacked-bar">
                {CRITICALITY.map((c, i) => (
                  <div key={i} style={{ flex: c.pct, background: c.color, borderRadius: 3 }} title={`${c.label}: ${c.pct}%`} />
                ))}
              </div>
              <div className="dev-crit-legend">
                {CRITICALITY.map((c, i) => (
                  <div key={i} className="dev-crit-leg-item" style={{ borderLeftColor: c.color }}>
                    <span className="dev-crit-leg-label">{c.label}</span>
                    <div className="dev-crit-leg-bottom">
                      <span className="dev-crit-leg-count">{c.count}</span>
                      <span className="dev-crit-leg-pct">{c.pct}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="dev-asset-hdr">
              <div className="dev-asset-hdr-left">
                <span className="dev-card-title">Assets by Criticality Score</span>
              </div>
              <DSPillSearch
                value={assetSearch}
                onChange={v => { setAssetSearch(v); setAssetPage(1); }}
                placeholder="Search assets…"
              />
            </div>

            <div className="dev-table-wrap">
              <table className="dev-table">
                <thead>
                  <tr>
                    <th className="dev-th dev-th-check"><input type="checkbox" className="dev-checkbox" /></th>
                    <TH>Display Label</TH>
                    <TH>Score</TH>
                    <TH>OS Family</TH>
                    <TH>Type</TH>
                    <TH>Infrastructure Type</TH>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.slice((assetPage-1)*10, assetPage*10).map((a, i) => (
                    <tr key={i} className="dev-tr">
                      <td className="dev-td dev-td-check"><input type="checkbox" className="dev-checkbox" /></td>
                      <td className="dev-td dev-td-name">{a.name}</td>
                      <td className="dev-td">{a.score}</td>
                      <td className="dev-td">
                        <span className="dev-cell-icon-text"><IcWindows />{a.os}</span>
                      </td>
                      <td className="dev-td">
                        <span className="dev-cell-icon-text">
                          <span style={{ color: 'var(--shell-text-muted)' }}>
                            {TYPE_ICONS[a.type.toLowerCase()]}
                          </span>
                          {a.type}
                        </span>
                      </td>
                      <td className="dev-td"><span className="pai-chip pai-chip--neutral">{a.infra}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <TablePagination
              total={filteredAssets.length}
              page={assetPage}
              rowsPerPage={10}
              onPageChange={setAssetPage}
              onRowsPerPageChange={() => {}}
            />
          </div>

        </div>
      </div>
    </div>
  );
}
