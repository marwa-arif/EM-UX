import React, { useState } from 'react'
import '../../styles/exposure-v3.css'
import TablePagination from '../../components/TablePagination.jsx'

// ── Data ──────────────────────────────────────────────────────────
// % of Total Exposure / % of Total Findings / % of Affected Assets are three
// distinct metrics — values are deliberately non-identical per row so the
// three table columns read as different signals, not one value repeated 3x.
const TABLE_DATA = [
  { name: 'Server',      score: 758, changePct: 10, changeDir: 'up',   exposurePct: 22, findingsPct: 9,  assetsPct: 14 },
  { name: 'Workstation', score: 745, changePct: 8,  changeDir: 'up',   exposurePct: 18, findingsPct: 14, assetsPct: 22 },
  { name: 'Mobile',      score: 701, changePct: 5,  changeDir: 'up',   exposurePct: 9,  findingsPct: 11, assetsPct: 15 },
  { name: 'Printer',     score: 689, changePct: 5,  changeDir: 'down', exposurePct: 4,  findingsPct: 12, assetsPct: 8  },
  { name: 'Network',     score: 657, changePct: 5,  changeDir: 'down', exposurePct: 11, findingsPct: 6,  assetsPct: 5  },
  { name: 'Scanner',     score: 557, changePct: 5,  changeDir: 'up',   exposurePct: 6,  findingsPct: 8,  assetsPct: 7  },
  { name: 'IOT',         score: 443, changePct: 5,  changeDir: 'down', exposurePct: 5,  findingsPct: 15, assetsPct: 9  },
  { name: 'Laptop',      score: 441, changePct: 10, changeDir: 'up',   exposurePct: 8,  findingsPct: 10, assetsPct: 12 },
  { name: 'VM',          score: 321, changePct: 5,  changeDir: 'down', exposurePct: 3,  findingsPct: 9,  assetsPct: 5  },
  { name: 'Container',   score: 298, changePct: 3,  changeDir: 'up',   exposurePct: 2,  findingsPct: 6,  assetsPct: 3  },
];

const LAST_UPDATED = 'Jul 5, 2026 · 6:00 AM';

// Mock — clearing a filter here only updates local state; wiring to the real
// filter panel is a separate task.
const INITIAL_FILTERS = [
  { key: 'region', label: 'Region', value: 'APAC' },
];

// The hero ring and every category meter share this scale so relative
// position is comparable across Attack Surface and Exposure Categories,
// not just within each group.
const SCALE_MAX = 1000;

function band(score) {
  if (score >= 700) return { label: 'High Risk', short: 'High', tone: 'high' };
  if (score >= 400) return { label: 'Moderate Risk', short: 'Moderate', tone: 'caution' };
  return { label: 'Low Risk', short: 'Low', tone: 'low' };
}

// ── Icons ─────────────────────────────────────────────────────────
const IcSort = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/>
  </svg>
);
const IcTrendUp = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
  </svg>
);
const IcTrendDown = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/>
  </svg>
);
const IcInfo = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="xo3-icon-muted">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
);
function InfoTooltip({ children, align = 'left' }) {
  return (
    <span className="xo3-info-tip">
      <IcInfo />
      <div className={`xo3-info-tip-card${align === 'right' ? ' xo3-info-tip-card--right' : ''}`}>{children}</div>
    </span>
  );
}
const IcSearch = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
);
const IcChevron = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6"/>
  </svg>
);
const IcChevronUp = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m18 15-6-6-6 6"/>
  </svg>
);
const IcClock = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const IcExport = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
const IcCloud = () => (
  <svg width="15" height="11" viewBox="0 0 24 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 10h1a4 4 0 0 0 0-8h-.5A6 6 0 0 0 5 6v1a4 4 0 0 0 0 8h12"/>
  </svg>
);
const IcDevice = () => (
  <svg width="15" height="13" viewBox="0 0 24 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
  </svg>
);
const IcIdentity = () => (
  <svg width="15" height="11" viewBox="0 0 24 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M15 8h3M15 12h2M6 20v-1a3 3 0 0 1 6 0v1"/>
  </svg>
);
const IcExposure = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor">
    <path d="M7.40519 9.69937C7.57355 9.86809 7.7897 9.94484 8.05364 9.92964C8.31759 9.91479 8.51021 9.81993 8.6315 9.64506L10.6148 6.88022C10.7792 6.65098 10.4973 6.36741 10.2671 6.53052L7.48665 8.50075C7.3049 8.62168 7.2037 8.80959 7.18306 9.06449C7.16242 9.31938 7.23647 9.53064 7.40519 9.69937Z" fill="currentColor" stroke="none"/>
    <path d="M3.28962 12.1326C2.77996 11.3087 2.48633 10.3406 2.48633 9.30481C2.48633 6.30169 4.95488 3.86719 8 3.86719C11.0451 3.86719 13.5137 6.30169 13.5137 9.30481C13.5137 10.3406 13.22 11.3087 12.7104 12.1326" strokeLinecap="round"/>
  </svg>
);

// ── Speedometer-style score gauge ───────────────────────────────────
// A full-circle progress ring only answers "how far to the max" — it can't
// show *where the risk zones are*, so a reader has to already know that 700
// means "high" before the fill means anything. A banded dial with a needle
// puts the zones on the instrument itself: the reader sees which colored
// zone the needle sits in before they even read the number.
const GAUGE_START = -150; // compass degrees, 0 = up, clockwise positive
const GAUGE_END   = 150;
const GAUGE_SWEEP = GAUGE_END - GAUGE_START; // 300° — a small 60° gap at the
                                              // bottom instead of an open half,
                                              // so the dial reads as one ring.

// Tick values double as gradient stops. Boundaries match the existing
// High/Moderate threshold at 700, extended down to Low and up to Critical so
// the dial always shows the full scale — same reason a speedometer prints
// 160mph even if the car rarely gets there. Reusing the app's own severity
// tokens for the stops keeps the gradient tied to real design-system colors
// instead of inventing new ones.
const GAUGE_STOPS = [
  { value: 0,    tone: 'low' },
  { value: 400,  tone: 'caution' },
  { value: 700,  tone: 'high' },
  { value: 1000, tone: 'critical' },
];
const GAUGE_TICKS = GAUGE_STOPS.map(s => s.value);

function angleForValue(v) {
  return GAUGE_START + (Math.min(Math.max(v, 0), SCALE_MAX) / SCALE_MAX) * GAUGE_SWEEP;
}

function polarPoint(cx, cy, r, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) };
}

function arcPath(cx, cy, r, a0, a1) {
  const p0 = polarPoint(cx, cy, r, a0);
  const p1 = polarPoint(cx, cy, r, a1);
  const largeArc = a1 - a0 > 180 ? 1 : 0;
  return `M ${p0.x} ${p0.y} A ${r} ${r} 0 ${largeArc} 1 ${p1.x} ${p1.y}`;
}

// A puck sitting on the ring's centerline at the exact value — a circle reads
// correctly at any angle, unlike a triangle whose points have to be rotated
// to match the local tangent, which is what made the previous marker look
// crooked. A double ring (light halo, dark core) stays legible on every
// band color the value could land on.
function GaugeNeedle({ cx, cy, radius, angle, size }) {
  const p = polarPoint(cx, cy, radius, angle);
  return (
    <g transform={`translate(${p.x} ${p.y})`}>
      <circle r={size} className="xo3-gauge-needle-halo" />
      <circle r={size * 0.5} className="xo3-gauge-needle-core" />
    </g>
  );
}

function ScoreGauge({ score, size, strokeWidth, gradientId }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - strokeWidth) / 2 - 20; // leave room for tick labels outside the arc
  const needleAngle = angleForValue(score);
  const full = arcPath(cx, cy, r, GAUGE_START, GAUGE_END);
  // Anchor the gradient to the arc's own start/end points (both near the
  // bottom, symmetric about center) instead of the default objectBoundingBox,
  // which spans the full circle's width — that made the arc's start sit at
  // ~25% into the gradient, so score 0 rendered a green/yellow blend instead
  // of the pure "low" stop-color.
  const gradStart = polarPoint(cx, cy, r, GAUGE_START);
  const gradEnd = polarPoint(cx, cy, r, GAUGE_END);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="xo3-gauge">
      <defs>
        {/* A straight gradient across the arc's own endpoints approximates
           the angular sweep — low/green at the start, critical/red at the
           end — without the complexity of a true conic gradient. */}
        <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1={gradStart.x} y1={gradStart.y} x2={gradEnd.x} y2={gradEnd.y}>
          {GAUGE_STOPS.map(s => (
            <stop key={s.value} offset={`${(s.value / SCALE_MAX) * 100}%`} className={`xo3-gauge-stop xo3-gauge-stop--${s.tone}`} />
          ))}
        </linearGradient>
      </defs>

      <path
        d={full}
        stroke={`url(#${gradientId})`}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="none"
        className="xo3-gauge-track"
      />

      {GAUGE_TICKS.map((v, i) => {
        const p = polarPoint(cx, cy, r + strokeWidth / 2 + 14, angleForValue(v));
        return (
          <text
            key={v}
            x={p.x} y={p.y}
            className={`xo3-gauge-tick xo3-gauge-tick--${GAUGE_STOPS[i].tone}`}
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {v}
          </text>
        );
      })}

      <GaugeNeedle cx={cx} cy={cy} radius={r} angle={needleAngle} size={strokeWidth * 0.6} />
    </svg>
  );
}

// Threshold gridlines shared with the gauge's own bands (400/700), so a bar
// crossing into High reads the same zone the dial already taught the reader —
// one shared scale across the hero gauge and every bar here, not a disconnected
// per-row fill re-deriving its own 0–100%.
const CHART_GRIDLINES = [400, 700];

function CategoryChart({ rows }) {
  return (
    <div className="xo3-chart">
      <div className="xo3-chart-axis">
        <span className="xo3-chart-axis-spacer" />
        <span className="xo3-chart-axis-spacer" />
        <div className="xo3-chart-axis-track">
          <span className="xo3-chart-axis-tick xo3-chart-axis-tick--start" style={{ left: '0%' }}>0</span>
          {CHART_GRIDLINES.map(v => (
            <span key={v} className="xo3-chart-axis-tick" style={{ left: `${(v / SCALE_MAX) * 100}%` }}>{v}</span>
          ))}
          <span className="xo3-chart-axis-tick xo3-chart-axis-tick--end" style={{ left: '100%' }}>1,000</span>
        </div>
        <span className="xo3-chart-axis-spacer" />
        <span className="xo3-chart-axis-spacer" />
      </div>
      <div className="xo3-mrow-list">
        {rows.map(row => <ChartRow key={row.label} {...row} />)}
      </div>
    </div>
  );
}

// One aligned row per category — icon identity, a bar anchored to the shared
// 0–1000 baseline (square edge at zero, 4px rounded data-end per the bar mark
// spec), the exact value, and a status chip so severity is never color-only.
function ChartRow({ score, icon, label }) {
  const b = band(score);
  const pct = Math.round(Math.min(score / SCALE_MAX, 1) * 100);
  return (
    <div className="xo3-mrow" title={`${label}: ${score}/1000 — ${b.label}`}>
      <span className="xo3-mrow-icon">{icon}</span>
      <span className="xo3-mrow-label">{label}</span>
      <div className="xo3-chart-bar-wrap">
        <div className={`xo3-chart-track xo3-chart-track--${b.tone}`}>
          <div className={`xo3-chart-fill xo3-chart-fill--${b.tone}`} style={{ width: `${pct}%` }} />
        </div>
        {CHART_GRIDLINES.map(v => (
          <span key={v} className="xo3-chart-gridline" style={{ left: `${(v / SCALE_MAX) * 100}%` }} />
        ))}
      </div>
      <span className={`xo3-mrow-score xo3-mrow-score--${b.tone}`}>{score}</span>
      <span className={`xo3-mrow-chip xo3-mrow-chip--${b.tone}`}>{b.short}</span>
    </div>
  );
}

function ExposureScoreGauge({ score }) {
  const b = band(score);
  return (
    <div className="xo3-hero-ring-wrap">
      <ScoreGauge score={score} size={288} strokeWidth={16} gradientId="xo3-hero-gauge-gradient" />
      <div className="xo3-hero-body">
        <div className="xo3-hero-score-row">
          <span className="xo3-hero-score">{score}</span>
          <span className="xo3-hero-denom">/1000</span>
        </div>
        <span className="xo3-hero-caption">Exposure Score</span>
        <span className={`xo3-hero-risk-badge xo3-hero-risk-badge--${b.tone}`}>{b.label}</span>
        <div className="xo3-hero-trend">
          <IcTrendDown />
          <span className="xo3-hero-trend-pct">5%</span>
          <span className="xo3-hero-trend-from">from last month</span>
        </div>
      </div>
    </div>
  );
}

// ── Compact, non-redundant percentage bar — label sits right at the bar's
// end instead of pinned across a wide, mostly-empty column ─────────────
function PctBar({ pct, maxPct, tone = 'high' }) {
  const fillWidth = Math.max(4, Math.round((pct / maxPct) * 100));
  return (
    <div className="xo3-pctbar">
      <div className="xo3-pctbar-track">
        <div className={`xo3-pctbar-fill xo3-pctbar-fill--${tone}`} style={{ '--xo3-fill-w': `${fillWidth}%` }} />
      </div>
      <span className="xo3-pctbar-val">{pct}%</span>
    </div>
  );
}

export default function ExposureOverviewV3() {
  const [collapsed, setCollapsed] = useState(false);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const filtered    = TABLE_DATA.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));
  const start       = (page - 1) * rowsPerPage;
  const visibleRows = filtered.slice(start, start + rowsPerPage);

  const maxExposure = Math.max(...TABLE_DATA.map(r => r.exposurePct));
  const maxFindings = Math.max(...TABLE_DATA.map(r => r.findingsPct));
  const maxAssets   = Math.max(...TABLE_DATA.map(r => r.assetsPct));

  const clearFilter = (key) => setFilters(f => f.filter(x => x.key !== key));

  const TH = ({ children }) => (
    <th className="ds-th">
      <span className="ds-th-inner">{children}<span className="xo3-th-sort"><IcSort /></span></span>
    </th>
  );

  return (
    <div className="page">
      <div className="card xo3-card">
        <div className="xo3-card-hdr">
          <div className="xo3-card-hdr-left">
            <span className="xo3-card-title" title="Aggregated exposure across all discovered assets, weighted by severity and reachability.">
              Exposure Overview
            </span>
            <span className="xo3-freshness"><IcClock /> Data as of {LAST_UPDATED}</span>
          </div>

          <div className="xo3-card-hdr-right">
            {filters.length > 0 && (
              <div className="xo3-filter-chips">
                {filters.map(f => (
                  <span key={f.key} className="xo3-filter-chip">
                    {f.label}: <strong>{f.value}</strong>
                    <button aria-label={`Clear ${f.label} filter`} onClick={() => clearFilter(f.key)}>
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                    </button>
                  </span>
                ))}
              </div>
            )}
            <button className="ds-btn sz-md t-tertiary" onClick={() => setCollapsed(c => !c)}>
              {collapsed ? <IcChevron /> : <IcChevronUp />}
              {collapsed ? 'Expand' : 'Collapse'}
            </button>
            <button className="ds-btn sz-md t-primary xo3-export-btn">
              <IcExport /> Export Executive Summary
            </button>
          </div>
        </div>

        {!collapsed && (
          <div className="xo3-body">
            <div className="xo3-col xo3-col--hero">
              <ExposureScoreGauge score={912} />
              <div className="xo3-col-label">
                Exposure Score
                <InfoTooltip>The Exposure Score represents the overall exposure level of the organization, on a scale of 0-1000. It is calculated based on the scores of all findings across the organization, using a root mean square (RMS) method that gives more weight to higher-risk findings, so critical issues have a greater impact on the overall score.</InfoTooltip>
              </div>
            </div>

            <div className="xo3-col xo3-divider">
              <CategoryChart rows={[
                { score: 966, icon: <IcCloud />, label: 'Cloud' },
                { score: 893, icon: <IcDevice />, label: 'Device' },
                { score: 601, icon: <IcIdentity />, label: 'Identity' },
              ]} />
              <div className="xo3-col-label">
                Attack Surface
                <InfoTooltip>The attack surface score is derived as the root mean square (RMS) of the asset exposure scores across each asset within an attack surface, enabling security teams to pinpoint high-risk areas and prioritize remediation efforts more effectively.</InfoTooltip>
              </div>
            </div>

            <div className="xo3-col xo3-divider">
              <CategoryChart rows={[
                { score: 937, icon: <IcExposure />, label: 'Control Gap' },
                { score: 732, icon: <IcExposure />, label: 'Software Vulnerability' },
                { score: 230, icon: <IcExposure />, label: 'Misconfiguration' },
              ]} />
              <div className="xo3-col-label">
                Exposure Categories
                <InfoTooltip align="right">An exposure category's score is the root mean square (RMS) of all findings within each exposure category, considering factors like exploitability, ease of exploit, internet accessibility, open ports, and more.</InfoTooltip>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="card xo3-contrib-card">
        <div className="xo3-contrib-hdr">
          <div className="xo3-contrib-hdr-left">
            <span className="xo3-contrib-title">Exposure Contribution by</span>
            <button className="ds-btn sz-md t-outline xo3-groupby-btn">
              Asset Type <IcChevron />
            </button>
          </div>
          <div className="xo3-contrib-hdr-right">
            <div className="xo3-search-box">
              <IcSearch />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search for Asset Type"
                aria-label="Search for Asset Type"
                className="xo3-search-input"
              />
              {search && (
                <button
                  aria-label="Clear search"
                  onMouseDown={e => { e.preventDefault(); setSearch(''); }}
                  className="xo3-search-clear"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                </button>
              )}
            </div>
            <button className="ds-btn sz-md t-outline">
              View Full Table <IcChevron />
            </button>
          </div>
        </div>

        <div className="ds-table-wrap">
          <table className="ds-table xo3-table">
            <thead>
              <tr>
                <TH>Name</TH>
                <TH>Exposure Score</TH>
                <TH>% Change</TH>
                <TH>% of Total Exposure</TH>
                <TH>% of Total Findings</TH>
                <TH>% of Affected Assets</TH>
              </tr>
            </thead>
            <tbody>
              {visibleRows.length === 0 ? (
                <tr><td className="ds-td xo3-empty" colSpan={6}>No asset types match "{search}".</td></tr>
              ) : visibleRows.map((row) => {
                const b = band(row.score);
                const changeGood = row.changeDir === 'down';
                return (
                  <tr key={row.name}>
                    <td className="ds-td xo3-td-name">{row.name}</td>
                    <td className="ds-td">
                      <span className={`xo3-score xo3-score--${b.tone}`}>{row.score}</span>
                    </td>
                    <td className="ds-td">
                      <span className={`xo3-change${changeGood ? ' xo3-change--good' : ' xo3-change--bad'}`}>
                        {row.changeDir === 'up' ? <IcTrendUp /> : <IcTrendDown />}
                        {row.changePct}%
                      </span>
                    </td>
                    <td className="ds-td"><PctBar pct={row.exposurePct} maxPct={maxExposure} tone={b.tone} /></td>
                    <td className="ds-td"><PctBar pct={row.findingsPct} maxPct={maxFindings} tone={b.tone} /></td>
                    <td className="ds-td"><PctBar pct={row.assetsPct} maxPct={maxAssets} tone={b.tone} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <TablePagination
          total={filtered.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={n => { setRowsPerPage(n); setPage(1); }}
        />
      </div>
    </div>
  );
}
