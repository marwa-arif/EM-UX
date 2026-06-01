import React, { useState } from 'react'
import '../styles/exposure.css'
import TablePagination from '../components/TablePagination.jsx'

// ── Data ──────────────────────────────────────────────────────────
const TABLE_DATA = [
  { name: 'Server',      score: 758, changePct: 10, changeDir: 'up',   exposurePct: 12, findingsPct: 12, assetsPct: 12 },
  { name: 'Workstation', score: 745, changePct: 8,  changeDir: 'up',   exposurePct: 12, findingsPct: 12, assetsPct: 12 },
  { name: 'Mobile',      score: 701, changePct: 5,  changeDir: 'up',   exposurePct: 6,  findingsPct: 6,  assetsPct: 6  },
  { name: 'Printer',     score: 689, changePct: 5,  changeDir: 'down', exposurePct: 5,  findingsPct: 5,  assetsPct: 5  },
  { name: 'Network',     score: 657, changePct: 5,  changeDir: 'down', exposurePct: 5,  findingsPct: 5,  assetsPct: 5  },
  { name: 'Scanner',     score: 557, changePct: 5,  changeDir: 'up',   exposurePct: 5,  findingsPct: 5,  assetsPct: 5  },
  { name: 'IOT',         score: 443, changePct: 5,  changeDir: 'down', exposurePct: 5,  findingsPct: 5,  assetsPct: 5  },
  { name: 'Laptop',      score: 441, changePct: 10, changeDir: 'up',   exposurePct: 4,  findingsPct: 4,  assetsPct: 4  },
  { name: 'VM',          score: 321, changePct: 5,  changeDir: 'down', exposurePct: 2,  findingsPct: 2,  assetsPct: 2  },
  { name: 'Container',   score: 298, changePct: 3,  changeDir: 'up',   exposurePct: 1,  findingsPct: 1,  assetsPct: 1  },
];

const MAX_BAR_PCT = 12;

function scoreColor(v) { return v >= 740 ? 'var(--pai-red-high)' : 'var(--pai-high-fg)'; }
function changeColor(dir, pct) {
  if (dir === 'down') return 'var(--pai-green)';
  return pct >= 10 ? 'var(--pai-crit-fg)' : 'var(--pai-red-high)';
}

// ── Icons ─────────────────────────────────────────────────────────
const IcSort = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/>
  </svg>
);
const IcTrendUp = ({ color }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
);
const IcTrendDown = ({ color = 'currentColor', size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
    <polyline points="17 18 23 18 23 12"/>
  </svg>
);
const IcSearch = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
);
const IcChevron = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6"/>
  </svg>
);
const IcChevronUp = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m18 15-6-6-6 6"/>
  </svg>
);
const IcExplore = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
);
const IcInfo = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--shell-text-muted)' }}>
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

// ── Small inline SVG icons for bubbles ───────────────────────────
const IcCloud = ({ color = '#6360D8' }) => (
  <svg width="14" height="10" viewBox="0 0 24 16" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 10h1a4 4 0 0 0 0-8h-.5A6 6 0 0 0 5 6v1a4 4 0 0 0 0 8h12"/>
  </svg>
);
const IcDevice = ({ color = '#6360D8' }) => (
  <svg width="14" height="12" viewBox="0 0 24 20" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
  </svg>
);
const IcIdentity = ({ color = '#6360D8' }) => (
  <svg width="14" height="10" viewBox="0 0 24 18" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M15 8h3M15 12h2M6 20v-1a3 3 0 0 1 6 0v1"/>
  </svg>
);
const IcExposure = ({ color = '#6360D8' }) => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="5.5" stroke={color} strokeWidth="1.5"/>
    <path d="M5.5 9.5 Q8 5.5 10.5 9.5" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    <line x1="8" y1="4" x2="8" y2="6" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const Sparkline = () => (
  <svg width="80" height="20" viewBox="0 0 80 20" fill="none">
    <polyline points="0,16 10,13 20,15 32,10 44,12 56,8 68,5 80,7" stroke="#21929B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ── Bubble component ──────────────────────────────────────────────
function Bubble({ score, severity, icon, size = 105, label, index = 0 }) {
  const isHigh = severity === 'H';
  const color = isHigh ? 'var(--pai-crit-fg)' : 'var(--pai-high-fg)';
  const tagBg = isHigh ? 'var(--pai-crit-bg)' : 'var(--pai-warn-bg)';
  const gradient = isHigh
    ? 'linear-gradient(177deg, #F48484 2%, #E15252 97%)'
    : 'linear-gradient(177deg, #E6B36D 2%, #D98B1D 97%)';

  return (
    <div className="exp-bubble-wrap">
      <div className="exp-bubble-circle" style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <div className="exp-bubble-ring" style={{ background: gradient }} />
        <div className="exp-bubble-inner" />
        <div className="exp-bubble-content">
          <span className="exp-bubble-score" style={{ color }}>{score}</span>
          <span className="exp-bubble-sev" style={{ color, background: tagBg }}>{severity}</span>
        </div>
        {icon && (
          <div className="exp-bubble-icon-pin">
            {React.cloneElement(icon, { color })}
          </div>
        )}
      </div>
      {label && <div className="exp-bubble-label">{label}</div>}
    </div>
  );
}

// ── Enterprise score gauge ────────────────────────────────────────
const GAUGE_SIZE = 300;
const OUTER_R = 143;
const INNER_R = 116;
const TICK_COUNT = 80;
const cx = GAUGE_SIZE / 2;
const cy = GAUGE_SIZE / 2;

const W_OUTER = 2.5;
const W_INNER = 0.6;

const ticks = Array.from({ length: TICK_COUNT }, (_, i) => {
  const a = (i / TICK_COUNT) * 2 * Math.PI;
  const sin = Math.sin(a), cos = Math.cos(a);
  const ox = cx + OUTER_R * sin, oy = cy - OUTER_R * cos;
  const ix = cx + INNER_R * sin, iy = cy - INNER_R * cos;
  const points = [
    `${ox + W_OUTER * cos},${oy + W_OUTER * sin}`,
    `${ox - W_OUTER * cos},${oy - W_OUTER * sin}`,
    `${ix - W_INNER * cos},${iy - W_INNER * sin}`,
    `${ix + W_INNER * cos},${iy + W_INNER * sin}`,
  ].join(' ');
  return <polygon key={i} points={points} fill="#DCDCDC" />;
});

function EnterpriseScore() {
  const innerDia = (INNER_R - 6) * 2;
  return (
    <div className="exp-gauge-wrap">
      <div className="exp-gauge exp-gauge-float" style={{ width: GAUGE_SIZE, height: GAUGE_SIZE }}>
        <div className="exp-gauge-outer" />
        <svg className="exp-gauge-ticks" width={GAUGE_SIZE} height={GAUGE_SIZE}>{ticks}</svg>
        <div className="exp-gauge-inner" style={{ width: innerDia, height: innerDia }}>
          <div className="exp-gauge-score-row">
            <span className="exp-gauge-score">912</span>
            <span className="exp-gauge-denom">/1000</span>
          </div>
          <span className="exp-gauge-label">Exposure Score</span>
          <div className="exp-gauge-risk-badge">
            <span className="exp-gauge-risk-text">High Risk</span>
          </div>
          <div className="exp-gauge-trend">
            <IcTrendDown color="#21929B" size={13} />
            <span className="exp-gauge-trend-pct">5%</span>
            <span className="exp-gauge-trend-from">From last month</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Exposure Overview Section ─────────────────────────────────────
function ExposureOverviewSection() {
  const [collapsed, setCollapsed] = useState(false);

  const attackSurface = [
    { score: 966, severity: 'H', icon: <IcCloud />,    label: 'Cloud',    size: 100 },
    { score: 893, severity: 'H', icon: <IcDevice />,   label: 'Device',   size: 100 },
    { score: 601, severity: 'M', icon: <IcIdentity />, label: 'Identity', size: 86  },
  ];

  const expCategories = [
    { score: 937, severity: 'H', icon: <IcExposure />, label: 'Control Gap',            size: 100 },
    { score: 732, severity: 'M', icon: <IcExposure />, label: 'Software Vulnerability', size: 86  },
    { score: 356, severity: 'M', icon: <IcExposure />, label: 'Misconfiguration',        size: 78  },
  ];

  const colLabel = (text) => (
    <div className="exp-col-label">{text} <IcInfo /></div>
  );

  const BubbleTriangle = ({ items, indexOffset = 0 }) => (
    <div className="exp-bubble-tri">
      <div className="exp-bubble-tri-top">
        <Bubble {...items[0]} index={indexOffset} />
        <Bubble {...items[1]} index={indexOffset + 1} />
      </div>
      <Bubble {...items[2]} index={indexOffset + 2} />
    </div>
  );

  return (
    <div className="card exp-card">
      <div className={`exp-ov-hdr${collapsed ? '' : ' exp-ov-hdr--open'}`}>
        <div className="exp-ov-hdr-left">
          <span className="exp-ov-hdr-title">Exposure Overview</span>
          <IcInfo />
        </div>

        <button className="ds-btn exp-trend-pill">
          <IcExposure />
          <span>Exposure Trend</span>
          <IcInfo />
          <Sparkline />
          <span className="exp-trend-pct">
            <IcTrendDown color="#21929B" size={14} />
            <span className="exp-trend-pct-val">5%</span>
          </span>
          <span className="exp-trend-from">from last month</span>
          <IcExplore />
        </button>

        <button onClick={() => setCollapsed(c => !c)} className="ds-btn sz-sm t-outline exp-collapse-btn">
          {collapsed ? <IcChevron /> : <IcChevronUp />}
          {collapsed ? 'Expand' : 'Collapse'}
        </button>
      </div>

      {!collapsed && (
        <div className="exp-ov-body">
          {['33.33%', '66.66%'].map((left, i) => (
            <div key={left} className="exp-sep" style={{ left }}>
              <svg width="237" height="100%" viewBox="0 0 237 468" fill="none" preserveAspectRatio="none">
                <path d="M0.170503 -49.3912C62.2392 -44.96 120.585 -16.5504 164.06 30.4098C207.535 77.37 233.092 139.588 235.847 205.177C238.601 270.765 218.361 335.126 178.994 385.961C139.626 436.797 83.8908 470.543 22.437 480.752L22.0436 478.115C82.8828 468.007 138.061 434.599 177.035 384.272C216.009 333.945 236.046 270.228 233.319 205.295C230.592 140.362 205.291 78.7663 162.251 32.2757C119.21 -14.2149 61.4477 -42.3405 -0.000254112 -46.7273L0.170503 -49.3912Z"
                  fill={`url(#sep-grad-${i})`} />
                <defs>
                  <linearGradient id={`sep-grad-${i}`} x1="53.58" y1="217" x2="236.095" y2="217" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#FFFADC" stopOpacity="0" />
                    <stop offset="1" stopColor="#EF8B55" stopOpacity="0.2" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          ))}

          <div className="exp-ov-col">
            <EnterpriseScore />
            {colLabel('Enterprise Score')}
          </div>
          <div className="exp-ov-col">
            <BubbleTriangle items={attackSurface} indexOffset={0} />
            {colLabel('Attack Surface')}
          </div>
          <div className="exp-ov-col">
            <BubbleTriangle items={expCategories} indexOffset={3} />
            {colLabel('Exposure Categories')}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Mini bar ──────────────────────────────────────────────────────
function MiniBar({ pct, maxPct = MAX_BAR_PCT }) {
  const fillColor = pct >= 10 ? '#E15252' : '#D98B1D';
  const fillWidth = Math.round((pct / maxPct) * 100);
  return (
    <div className="exp-minibar-wrap">
      <div className="exp-minibar-track">
        <div className="exp-minibar-fill" style={{ width: `${fillWidth}%`, background: fillColor }} />
      </div>
      <span className="exp-minibar-pct">{pct}%</span>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────
export default function ExposureOverviewPage() {
  const [search, setSearch]           = useState('');
  const [groupBy]                     = useState('Asset Type');
  const [page, setPage]               = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const filtered    = TABLE_DATA.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));
  const start       = (page - 1) * rowsPerPage;
  const visibleRows = filtered.slice(start, start + rowsPerPage);

  const TH = ({ children, align = 'left' }) => (
    <th className="ds-th" style={{ textAlign: align }}>
      <span className="ds-th-inner">
        {children}
        <span className="exp-th-sort-icon"><IcSort /></span>
      </span>
    </th>
  );

  return (
    <div className="page">
      <ExposureOverviewSection />

      <div className="card exp-contrib-card">
        <div className="exp-contrib-hdr">
          <div className="exp-contrib-hdr-left">
            <span className="exp-contrib-title">Exposure Contribution by</span>
            <button className="ds-btn sz-sm t-outline exp-groupby-btn">
              {groupBy}
              <IcChevron />
            </button>
          </div>
          <div className="exp-contrib-hdr-right">
            <div className="exp-search-box">
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search for Asset Type" className="exp-search-input" />
              {search && (
                <button
                  onMouseDown={e => { e.preventDefault(); setSearch(''); }}
                  style={{
                    width: 16, height: 16, padding: 0, border: 'none', background: 'transparent',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: 'var(--shell-text-muted)', borderRadius: 999, flexShrink: 0, marginRight: 4,
                  }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                </button>
              )}
              <div className="exp-search-icon-wrap">
                <IcSearch />
              </div>
            </div>
            <button className="ds-btn sz-sm t-outline exp-explore-btn">
              Explore More <IcExplore />
            </button>
          </div>
        </div>

        <div className="ds-table-wrap">
          <table className="ds-table">
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
              {visibleRows.map((row, i) => {
                const trendColor = changeColor(row.changeDir, row.changePct);
                return (
                  <tr key={i}>
                    <td className="ds-td exp-td-name">{row.name}</td>
                    <td className="ds-td">
                      <span className="exp-td-score" style={{ color: scoreColor(row.score) }}>{row.score}</span>
                    </td>
                    <td className="ds-td">
                      <span className="exp-td-change" style={{ color: trendColor }}>
                        {row.changeDir === 'up' ? <IcTrendUp color={trendColor} /> : <IcTrendDown color={trendColor} />}
                        {row.changePct}%
                      </span>
                    </td>
                    <td className="ds-td"><MiniBar pct={row.exposurePct} /></td>
                    <td className="ds-td"><MiniBar pct={row.findingsPct} /></td>
                    <td className="ds-td"><MiniBar pct={row.assetsPct} /></td>
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
