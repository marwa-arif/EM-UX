import React, { useState, useRef, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import '../styles/exposure.css'
import '../styles/compliance.css'
import '../styles/device.css'
import TablePagination from '../components/TablePagination.jsx'

// ── Data ──────────────────────────────────────────────────────────
const GROUP_BY_OPTIONS = [
  'Exposure Category', 'Asset Origin', 'Cloud Provider', 'OS Family', 'Type',
  'Asset Role', 'Finding Title', 'Finding Exposure Severity', 'Business Unit', 'Deployment Type',
];

const GROUP_BY_DATA = {
  'Exposure Category': [
    { name: 'Control Gap',            score: 584, exposurePct: 49,  findingsPct: 46,  assetsPct: 100 },
    { name: 'Misconfiguration',       score: 558, exposurePct: 0.4, findingsPct: 0.4, assetsPct: 0.4 },
    { name: 'Software Vulnerability', score: 502, exposurePct: 51,  findingsPct: 54,  assetsPct: 7   },
  ],
  'Asset Origin': [
    { name: 'Cloud-Native',  score: 712, exposurePct: 38, findingsPct: 41, assetsPct: 35 },
    { name: 'On-Premises',   score: 655, exposurePct: 34, findingsPct: 31, assetsPct: 40 },
    { name: 'Hybrid',        score: 498, exposurePct: 19, findingsPct: 20, assetsPct: 18 },
    { name: 'Third-Party',   score: 361, exposurePct: 9,  findingsPct: 8,  assetsPct: 7  },
  ],
  'Cloud Provider': [
    { name: 'AWS',      score: 689, exposurePct: 42, findingsPct: 39, assetsPct: 45 },
    { name: 'Azure',    score: 602, exposurePct: 28, findingsPct: 31, assetsPct: 27 },
    { name: 'GCP',      score: 471, exposurePct: 18, findingsPct: 17, assetsPct: 16 },
    { name: 'On-Prem',  score: 340, exposurePct: 12, findingsPct: 13, assetsPct: 12 },
  ],
  'OS Family': [
    { name: 'Windows',  score: 731, exposurePct: 46, findingsPct: 48, assetsPct: 51 },
    { name: 'Linux',    score: 588, exposurePct: 33, findingsPct: 30, assetsPct: 29 },
    { name: 'macOS',    score: 402, exposurePct: 14, findingsPct: 15, assetsPct: 13 },
    { name: 'Other',    score: 265, exposurePct: 7,  findingsPct: 7,  assetsPct: 7  },
  ],
  'Type': [
    { name: 'Server',      score: 758, exposurePct: 12, findingsPct: 12, assetsPct: 12 },
    { name: 'Workstation',  score: 745, exposurePct: 12, findingsPct: 12, assetsPct: 12 },
    { name: 'Mobile',       score: 701, exposurePct: 6,  findingsPct: 6,  assetsPct: 6  },
    { name: 'Printer',      score: 689, exposurePct: 5,  findingsPct: 5,  assetsPct: 5  },
    { name: 'Network',      score: 657, exposurePct: 5,  findingsPct: 5,  assetsPct: 5  },
    { name: 'Scanner',      score: 557, exposurePct: 5,  findingsPct: 5,  assetsPct: 5  },
    { name: 'IOT',          score: 443, exposurePct: 5,  findingsPct: 5,  assetsPct: 5  },
    { name: 'Laptop',       score: 441, exposurePct: 4,  findingsPct: 4,  assetsPct: 4  },
    { name: 'VM',           score: 321, exposurePct: 2,  findingsPct: 2,  assetsPct: 2  },
    { name: 'Container',    score: 298, exposurePct: 1,  findingsPct: 1,  assetsPct: 1  },
  ],
  'Asset Role': [
    { name: 'Production',   score: 744, exposurePct: 51, findingsPct: 53, assetsPct: 48 },
    { name: 'Development',  score: 512, exposurePct: 24, findingsPct: 22, assetsPct: 26 },
    { name: 'Staging',      score: 388, exposurePct: 15, findingsPct: 15, assetsPct: 16 },
    { name: 'Test',         score: 251, exposurePct: 10, findingsPct: 10, assetsPct: 10 },
  ],
  'Finding Title': [
    { name: 'Unpatched CVE',           score: 812, exposurePct: 33, findingsPct: 36, assetsPct: 29 },
    { name: 'Weak Password Policy',    score: 640, exposurePct: 24, findingsPct: 22, assetsPct: 25 },
    { name: 'Missing MFA',             score: 597, exposurePct: 21, findingsPct: 20, assetsPct: 23 },
    { name: 'Open Port Exposure',      score: 455, exposurePct: 14, findingsPct: 14, assetsPct: 14 },
    { name: 'Outdated TLS Version',    score: 302, exposurePct: 8,  findingsPct: 8,  assetsPct: 9  },
  ],
  'Finding Exposure Severity': [
    { name: 'Critical', score: 901, exposurePct: 40, findingsPct: 37, assetsPct: 22 },
    { name: 'High',     score: 733, exposurePct: 30, findingsPct: 32, assetsPct: 31 },
    { name: 'Medium',   score: 486, exposurePct: 19, findingsPct: 20, assetsPct: 28 },
    { name: 'Low',      score: 219, exposurePct: 11, findingsPct: 11, assetsPct: 19 },
  ],
  'Business Unit': [
    { name: 'Engineering', score: 668, exposurePct: 31, findingsPct: 29, assetsPct: 34 },
    { name: 'Finance',     score: 574, exposurePct: 24, findingsPct: 26, assetsPct: 22 },
    { name: 'Sales',       score: 449, exposurePct: 19, findingsPct: 18, assetsPct: 20 },
    { name: 'HR',          score: 337, exposurePct: 14, findingsPct: 15, assetsPct: 13 },
    { name: 'Legal',       score: 261, exposurePct: 12, findingsPct: 12, assetsPct: 11 },
  ],
  'Deployment Type': [
    { name: 'Public Cloud',   score: 702, exposurePct: 37, findingsPct: 40, assetsPct: 33 },
    { name: 'Private Cloud',  score: 585, exposurePct: 29, findingsPct: 26, assetsPct: 31 },
    { name: 'On-Premises',    score: 463, exposurePct: 22, findingsPct: 21, assetsPct: 23 },
    { name: 'Hybrid',         score: 328, exposurePct: 12, findingsPct: 13, assetsPct: 13 },
  ],
};

function scoreColor(v) { return v >= 740 ? 'var(--pai-red-high)' : 'var(--pai-high-fg)'; }
function pctColor(pct) {
  if (pct >= 80) return 'var(--pai-crit-fg)';
  if (pct >= 50) return 'var(--pai-high-fg)';
  if (pct >= 10) return 'var(--pai-med-fg)';
  return 'var(--pai-low-fg)';
}
function fmtPct(pct) { return pct < 1 ? '<1%' : `${Math.round(pct)}%`; }
function fmtCompact(v) {
  if (Math.abs(v) >= 1000000000) return `${(v / 1000000000).toFixed(2)}B`;
  if (Math.abs(v) >= 1000000)    return `${(v / 1000000).toFixed(1)}M`;
  if (Math.abs(v) >= 1000)       return `${(v / 1000).toFixed(0)}K`;
  return `${v}`;
}
const MONTH_FULL = { Jan:'January', Feb:'February', Mar:'March', Apr:'April', May:'May', Jun:'June', Jul:'July', Aug:'August', Sep:'September', Oct:'October', Nov:'November', Dec:'December' };
function fmtTipDate(label) {
  const parts = label.split(' ');
  return parts.length === 2 && MONTH_FULL[parts[1]] ? `${parts[0]} ${MONTH_FULL[parts[1]]} 2024` : label;
}

// ── Trend Explore data ─────────────────────────────────────────────
const EXPOSURE_BY_OPTIONS = ['All', 'Cloud', 'Device', 'Identity', 'Control Gap', 'Software Vulnerability', 'Misconfiguration'];

function buildTrend(labels, values) { return labels.map((name, i) => ({ name, value: values[i] })); }

const TREND_UNIT = { '1W': 'Daily', '1M': 'Weekly', '3M': 'Weekly', '6M': 'Monthly', '1Y': 'Monthly' };

const TREND_LABELS = {
  '1W': ['2 Aug', '3 Aug', '4 Aug', '5 Aug', '6 Aug', '7 Aug', '8 Aug'],
  '1M': ['12 Jul', '19 Jul', '26 Jul', '2 Aug', '8 Aug'],
  '3M': ['12 May', '26 May', '9 Jun', '23 Jun', '7 Jul', '21 Jul', '8 Aug'],
  '6M': ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
  '1Y': ['Sep 23', 'Oct', 'Nov', 'Dec', 'Jan 24', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
};

const EXP_SCORE_TREND = {
  '1W': buildTrend(TREND_LABELS['1W'], [548, 547, 546, 545, 543, 542, 541]),
  '1M': buildTrend(TREND_LABELS['1M'], [578, 574.8, 566, 552, 541]),
  '3M': buildTrend(TREND_LABELS['3M'], [612, 598, 585, 570, 558, 549, 541]),
  '6M': buildTrend(TREND_LABELS['6M'], [648, 630, 611, 592, 570, 552, 541]),
  '1Y': buildTrend(TREND_LABELS['1Y'], [702, 690, 671, 655, 640, 622, 611, 592, 580, 570, 552, 541]),
};

const EXP_SUM_TREND = {
  '1W': buildTrend(TREND_LABELS['1W'], [838000000, 836000000, 834500000, 833000000, 832000000, 831000000, 830500000]),
  '1M': buildTrend(TREND_LABELS['1M'], [880000000, 871000000, 858000000, 842000000, 830500000]),
  '3M': buildTrend(TREND_LABELS['3M'], [920000000, 905000000, 888000000, 868000000, 850000000, 838000000, 830500000]),
  '6M': buildTrend(TREND_LABELS['6M'], [960000000, 935000000, 905000000, 875000000, 850000000, 835000000, 830500000]),
  '1Y': buildTrend(TREND_LABELS['1Y'], [1020000000, 1000000000, 975000000, 950000000, 925000000, 900000000, 880000000, 862000000, 848000000, 838000000, 832000000, 830500000]),
};

const EXP_RISK_ASSET_TREND = {
  '1W': buildTrend(TREND_LABELS['1W'], [5100, 5300, 5500, 5700, 5900, 6100, 6300]),
  '1M': buildTrend(TREND_LABELS['1M'], [3050, 3180, 3350, 4300, 6300]),
  '3M': buildTrend(TREND_LABELS['3M'], [2800, 2850, 2950, 3050, 3180, 4300, 6300]),
  '6M': buildTrend(TREND_LABELS['6M'], [2600, 2700, 2800, 2900, 3050, 4300, 6300]),
  '1Y': buildTrend(TREND_LABELS['1Y'], [2200, 2300, 2400, 2500, 2600, 2700, 2800, 2900, 3050, 3350, 4300, 6300]),
};

const EXP_FINDINGS_TREND = {
  '1W': buildTrend(TREND_LABELS['1W'], [900000, 1050000, 1200000, 1300000, 1400000, 1500000, 1600000]),
  '1M': buildTrend(TREND_LABELS['1M'], [310000, 365000, 430000, 780000, 1600000]),
  '3M': buildTrend(TREND_LABELS['3M'], [250000, 280000, 320000, 380000, 460000, 780000, 1600000]),
  '6M': buildTrend(TREND_LABELS['6M'], [180000, 210000, 250000, 300000, 380000, 780000, 1600000]),
  '1Y': buildTrend(TREND_LABELS['1Y'], [90000, 110000, 130000, 150000, 180000, 210000, 250000, 300000, 380000, 460000, 780000, 1600000]),
};

// ── Trend Explore: driver attribution (derived from value deltas — no backend "why" data exists yet) ──
const DRIVER_CATEGORIES = EXPOSURE_BY_OPTIONS.slice(1); // Cloud, Device, Identity, Control Gap, Software Vulnerability, Misconfiguration

// When "Exposure by" is scoped to one entity, citing that same entity as its own driver is circular —
// drill down one level into the specific factors behind that entity's trend instead.
const ENTITY_SUB_DRIVERS = {
  'Cloud': ['S3 Bucket Misconfigurations', 'Public IAM Roles', 'Unencrypted Storage'],
  'Device': ['Unpatched OS Vulnerabilities', 'EDR Coverage Gaps', 'Stale Certificates'],
  'Identity': ['Overprivileged Accounts', 'Stale Service Accounts', 'MFA Gaps'],
  'Control Gap': ['Missing Endpoint Controls', 'Disabled Security Policies', 'Unmonitored Segments'],
  'Software Vulnerability': ['Critical CVEs', 'End-of-Life Software', 'Unpatched Libraries'],
  'Misconfiguration': ['Open Network Ports', 'Default Credentials', 'Excessive Permissions'],
};

function deriveDrivers(data, idx, offset = 0, entity = 'All') {
  if (idx <= 0) return null;
  const delta = data[idx].value - data[idx - 1].value;
  if (!delta) return null;
  const pool = entity !== 'All' && ENTITY_SUB_DRIVERS[entity] ? ENTITY_SUB_DRIVERS[entity] : DRIVER_CATEGORIES;
  const n = pool.length;
  const catA = pool[(idx + offset) % n];
  const catB = pool[(idx + offset + 2) % n];
  const sign = delta > 0 ? 1 : -1;
  return [
    { label: catA, pct: sign * (62 + (idx % 3) * 4) / 10 },
    { label: catB, pct: sign * (24 + (idx % 2) * 3) / 10 },
  ];
}

function summarizePeriodDrivers(data, offset = 0, entity = 'All') {
  const first = data[0].value, last = data[data.length - 1].value;
  const pct = first ? ((last - first) / first) * 100 : 0;
  if (Math.abs(pct) < 0.05) return null;
  const drivers = deriveDrivers(data, data.length - 1, offset, entity);
  return { pct, isUp: pct > 0, drivers };
}

// ── Icons ─────────────────────────────────────────────────────────
const IcSort = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/>
  </svg>
);
const IcTrendDown = ({ color = 'currentColor', size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
    <polyline points="17 18 23 18 23 12"/>
  </svg>
);
const IcTrendUp = ({ color = 'var(--pai-crit-fg)', size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
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
const IcInfo = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="exp-icon-muted">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
);

// ── Info icon with hover tooltip ──────────────────────────────────
function InfoTooltip({ children, align = 'left' }) {
  return (
    <span className="exp-info-tip">
      <IcInfo />
      <div className={`exp-info-tip-card${align === 'right' ? ' exp-info-tip-card--right' : ''}`}>{children}</div>
    </span>
  );
}

// ── Trend Explore: always-visible driver summary line ─────────────
function TrendDriverSummary({ data, offset = 0, entity = 'All' }) {
  const summary = summarizePeriodDrivers(data, offset, entity);
  if (!summary) return null;
  const { isUp, pct, drivers } = summary;
  const scopeText = entity !== 'All' ? ` within ${entity}` : '';
  return (
    <div className="exp-trend-card-summary">
      {isUp ? <IcTrendUp size={12} /> : <IcTrendDown size={12} color="var(--pai-teal)" />}
      <span>
        {isUp ? 'Up' : 'Down'} {Math.abs(pct).toFixed(1)}% over this period{scopeText} — mainly driven by{' '}
        <strong>{drivers[0].label}</strong> ({drivers[0].pct > 0 ? '+' : ''}{drivers[0].pct.toFixed(1)}%) and{' '}
        <strong>{drivers[1].label}</strong> ({drivers[1].pct > 0 ? '+' : ''}{drivers[1].pct.toFixed(1)}%).
      </span>
    </div>
  );
}

// ── Small inline SVG icons for bubbles ───────────────────────────
const IcExposure = ({ color = '#6360D8', size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path d="M7.40519 9.69937C7.57355 9.86809 7.7897 9.94484 8.05364 9.92964C8.31759 9.91479 8.51021 9.81993 8.6315 9.64506L10.6148 6.88022C10.7792 6.65098 10.4973 6.36741 10.2671 6.53052L7.48665 8.50075C7.3049 8.62168 7.2037 8.80959 7.18306 9.06449C7.16242 9.31938 7.23647 9.53064 7.40519 9.69937Z" fill={color}/>
    <path d="M3.28962 12.1326C2.77996 11.3087 2.48633 10.3406 2.48633 9.30481C2.48633 6.30169 4.95488 3.86719 8 3.86719C11.0451 3.86719 13.5137 6.30169 13.5137 9.30481C13.5137 10.3406 13.22 11.3087 12.7104 12.1326" stroke={color} strokeLinecap="round"/>
  </svg>
);
const IcSumExposure  = () => <img src="assets/icons/sum-of-exposure.svg" width={12} height={12} alt="" />;
const IcTotalFindings = () => <img src="assets/icons/total-findings.svg" width={12} height={12} alt="" />;
const IcTotalAssets   = () => <img src="assets/icons/total-assets.svg" width={12} height={12} alt="" />;

// ── Icon rendered from an asset file via CSS mask, tinted to match context ──
function MaskIcon({ icon, color = 'currentColor', size = 14 }) {
  return (
    <span
      style={{
        display: 'inline-block', width: size, height: size, flexShrink: 0, backgroundColor: color,
        maskImage: `url('assets/icons/${icon}.svg')`, WebkitMaskImage: `url('assets/icons/${icon}.svg')`,
        maskSize: 'contain', WebkitMaskSize: 'contain', maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat',
        maskPosition: 'center', WebkitMaskPosition: 'center',
      }}
    />
  );
}
const IcExplore = ({ color = 'currentColor', size = 12 }) => <MaskIcon icon="icon-explore" color={color} size={size} />;

const Sparkline = () => (
  <svg width="80" height="20" viewBox="0 0 80 20" fill="none">
    <polyline points="0,16 10,13 20,15 32,10 44,12 56,8 68,5 80,7" stroke="var(--pai-teal)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ── Bubble component ──────────────────────────────────────────────
function Bubble({
  score, severity, icon, navIcon, size = 105, label, index = 0,
  sumExposure, secondaryLabel, secondaryValue, secondaryIcon, exploreTarget, onNav,
}) {
  const isHigh = severity === 'H';
  const isLow = severity === 'L';
  const color = isHigh ? 'var(--pai-crit-fg)' : isLow ? 'var(--pai-low-fg)' : 'var(--pai-med-fg)';
  const tagBg = isHigh ? 'var(--pai-crit-bg)' : isLow ? 'var(--pai-low-bg)' : 'var(--pai-warn-bg)';
  const gradient = isHigh
    ? 'linear-gradient(177deg, #F48484 2%, #E15252 97%)'
    : isLow
      ? 'linear-gradient(177deg, #8ED1AE 2%, #31A56D 97%)'
      : 'linear-gradient(177deg, #E6B36D 2%, #D98B1D 97%)';
  const [hovered, setHovered] = useState(false);
  const showTooltip = hovered && sumExposure != null;

  return (
    <div className="exp-bubble-wrap" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div className="exp-bubble-circle" style={{ '--exp-bubble-size': `${size}px` }}>
        <div className="exp-bubble-ring" style={{ background: gradient }} />
        <div className="exp-bubble-inner" />
        <div className="exp-bubble-content">
          <span className="exp-bubble-score" style={{ color }}>{score}</span>
          <span className="exp-bubble-sev" style={{ color, background: tagBg }}>{severity}</span>
        </div>
        {(icon || navIcon) && (
          <div className="exp-bubble-icon-pin">
            {navIcon ? <MaskIcon icon={navIcon} color={color} size={14} /> : React.cloneElement(icon, { color })}
          </div>
        )}
      </div>
      {label && <div className="exp-bubble-label">{label}</div>}

      {showTooltip && (
        <div className="exp-bubble-tooltip">
          {exploreTarget && (
            <button className="exp-bubble-explore-btn" style={{ borderColor: color, color }} onClick={() => onNav && onNav(exploreTarget)}>
              <IcExplore /> Explore
            </button>
          )}
          <div className="exp-bubble-tooltip-card">
            <div className="exp-bubble-tooltip-stat">
              <span className="exp-bubble-tooltip-accent" style={{ background: color }} />
              <div className="exp-bubble-tooltip-text">
                <span className="exp-bubble-tooltip-label"><IcSumExposure /> Sum of Exposure</span>
                <span className="exp-bubble-tooltip-value">{sumExposure}</span>
              </div>
            </div>
            <div className="exp-bubble-tooltip-stat">
              <span className={`exp-bubble-tooltip-accent ${secondaryLabel === 'Total Assets' ? 'exp-bubble-tooltip-accent--amber' : 'exp-bubble-tooltip-accent--indigo'}`} />
              <div className="exp-bubble-tooltip-text">
                <span className="exp-bubble-tooltip-label">{secondaryIcon} {secondaryLabel}</span>
                <span className="exp-bubble-tooltip-value">{secondaryValue}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Exposure score gauge ──────────────────────────────────────────
const GAUGE_SIZE = 300;
const OUTER_R = 143;
const INNER_R = 116;
const TICK_COUNT = 80;
const cx = GAUGE_SIZE / 2;
const cy = GAUGE_SIZE / 2;

const W_TICK = 1.4;
const GAUGE_SCORE = 912;

const ticks = Array.from({ length: TICK_COUNT }, (_, i) => {
  const a = (i / TICK_COUNT) * 2 * Math.PI;
  const sin = Math.sin(a), cos = Math.cos(a);
  const ox = cx + OUTER_R * sin, oy = cy - OUTER_R * cos;
  const ix = cx + INNER_R * sin, iy = cy - INNER_R * cos;
  const points = [
    `${ox + W_TICK * cos},${oy + W_TICK * sin}`,
    `${ox - W_TICK * cos},${oy - W_TICK * sin}`,
    `${ix - W_TICK * cos},${iy - W_TICK * sin}`,
    `${ix + W_TICK * cos},${iy + W_TICK * sin}`,
  ].join(' ');
  return <polygon key={i} points={points} fill="var(--shell-border-2, #DCDCDC)" />;
});

function ExposureScoreGauge() {
  const innerDia = (INNER_R - 6) * 2;
  const [hovered, setHovered] = useState(false);
  return (
    <div className="exp-gauge-wrap">
      <div
        className="exp-gauge exp-gauge-float"
        style={{ width: GAUGE_SIZE, height: GAUGE_SIZE }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="exp-gauge-outer" />
        <svg className="exp-gauge-ticks" width={GAUGE_SIZE} height={GAUGE_SIZE}>{ticks}</svg>
        <div className="exp-gauge-inner" style={{ width: innerDia, height: innerDia }}>
          <div className="exp-gauge-score-row">
            <span className="exp-gauge-score">{GAUGE_SCORE}</span>
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

        {hovered && (
          <div className="exp-bubble-tooltip exp-bubble-tooltip--below">
            <div className="exp-bubble-tooltip-card">
              <div className="exp-bubble-tooltip-stat">
                <span className="exp-bubble-tooltip-accent" style={{ background: 'var(--pai-crit-fg)' }} />
                <div className="exp-bubble-tooltip-text">
                  <span className="exp-bubble-tooltip-label"><IcSumExposure /> Sum Of Exposure</span>
                  <span className="exp-bubble-tooltip-value">835.1M</span>
                </div>
              </div>
                <div className="exp-bubble-tooltip-stat">
                <span className="exp-bubble-tooltip-accent exp-bubble-tooltip-accent--amber" />
                <div className="exp-bubble-tooltip-text">
                  <span className="exp-bubble-tooltip-label"><IcTotalAssets /> Total Assets</span>
                  <span className="exp-bubble-tooltip-value">132,605</span>
                </div>
              </div>
                <div className="exp-bubble-tooltip-stat">
                <span className="exp-bubble-tooltip-accent exp-bubble-tooltip-accent--indigo" />
                <div className="exp-bubble-tooltip-text">
                  <span className="exp-bubble-tooltip-label"><IcTotalFindings /> Total Findings</span>
                  <span className="exp-bubble-tooltip-value">1.6M</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Exposure Overview Section ─────────────────────────────────────
function ExposureOverviewSection({ onNav }) {
  const [collapsed, setCollapsed] = useState(false);
  const [trendDrawerOpen, setTrendDrawerOpen] = useState(false);

  const attackSurface = [
    { score: 966, severity: 'H', navIcon: 'nav-discover-cloud',    label: 'Cloud',    size: 100,
      sumExposure: '92.6M',  secondaryLabel: 'Total Assets', secondaryValue: '11,436', secondaryIcon: <IcTotalAssets />, exploreTarget: 'discover/cloud' },
    { score: 893, severity: 'H', navIcon: 'nav-discover-device',   label: 'Device',   size: 100,
      sumExposure: '757.2M', secondaryLabel: 'Total Assets', secondaryValue: '54,685', secondaryIcon: <IcTotalAssets />, exploreTarget: 'discover/device' },
    { score: 601, severity: 'M', navIcon: 'nav-discover-identity', label: 'Identity', size: 86,
      sumExposure: '66.3M',  secondaryLabel: 'Total Assets', secondaryValue: '71,457', secondaryIcon: <IcTotalAssets />, exploreTarget: 'discover/identity' },
  ];

  const expCategories = [
    { score: 937, severity: 'H', icon: <IcExposure />, label: 'Control Gap',            size: 100,
      sumExposure: '413.2M', secondaryLabel: 'Total Findings', secondaryValue: '727,760', secondaryIcon: <IcTotalFindings /> },
    { score: 732, severity: 'M', icon: <IcExposure />, label: 'Software Vulnerability', size: 86,
      sumExposure: '422.0M', secondaryLabel: 'Total Findings', secondaryValue: '860,059', secondaryIcon: <IcTotalFindings /> },
    { score: 108, severity: 'L', icon: <IcExposure />, label: 'Misconfiguration',        size: 78,
      sumExposure: '2,344',  secondaryLabel: 'Total Findings', secondaryValue: '4',       secondaryIcon: <IcTotalFindings /> },
  ];

  const colLabel = (text, tip, align) => (
    <div className="exp-col-label">{text} <InfoTooltip align={align}>{tip}</InfoTooltip></div>
  );

  const BubbleTriangle = ({ items, indexOffset = 0 }) => (
    <div className="exp-bubble-tri">
      <div className="exp-bubble-tri-top">
        <Bubble {...items[0]} index={indexOffset} onNav={onNav} />
        <Bubble {...items[1]} index={indexOffset + 1} onNav={onNav} />
      </div>
      <Bubble {...items[2]} index={indexOffset + 2} onNav={onNav} />
    </div>
  );

  return (
    <>
    <div className="card exp-card">
      <div className={`exp-ov-hdr${collapsed ? '' : ' exp-ov-hdr--open'}`}>
        <div className="exp-ov-hdr-left">
          <span className="exp-ov-hdr-title">Exposure Overview</span>
          <InfoTooltip>The Exposure Overview provides a centralized, near-real-time view of an organization's security exposures across Attack Surface and Exposure Categories. Designed to support informed decision-making, the dashboard enables security teams and leadership to track progress, prioritize efforts, and reduce overall risk to the organization.</InfoTooltip>
        </div>

        <button className="ds-btn exp-trend-pill" onClick={() => setTrendDrawerOpen(true)}>
          <span className="exp-trend-label">
            <IcExposure size={20} />
            <span className="exp-trend-label-text">Exposure Trend</span>
            <InfoTooltip>Click to explore the trend of exposure score</InfoTooltip>
          </span>
          <Sparkline />
          <span className="exp-trend-pct">
            <IcTrendDown color="var(--pai-teal)" size={13} />
            <span className="exp-trend-pct-val">5%</span>
            <span className="exp-trend-from">from last month</span>
          </span>
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
            <ExposureScoreGauge />
            {colLabel('Exposure Score', 'The Exposure Score represents the overall exposure level of the organization, on a scale of 0-1000. It is calculated based on the scores of all findings across the organization, using a root mean square (RMS) method that gives more weight to higher-risk findings, so critical issues have a greater impact on the overall score.')}
          </div>
          <div className="exp-ov-col">
            <BubbleTriangle items={attackSurface} indexOffset={0} />
            {colLabel('Attack Surface', 'The attack surface score is derived as the root mean square (RMS) of the asset exposure scores across each asset within an attack surface, enabling security teams to pinpoint high-risk areas and prioritize remediation efforts more effectively.')}
          </div>
          <div className="exp-ov-col">
            <BubbleTriangle items={expCategories} indexOffset={3} />
            {colLabel('Exposure Categories', (
              <>
                <p>An exposure category's score is the root mean square (RMS) of all findings within each exposure category, considering factors like exploitability, ease of exploit, internet accessibility, open ports, and more.</p>
                <p><strong>Software Vulnerability</strong> - Vulnerabilities reported by Vulnerability Management tools.</p>
                <p><strong>Control Gap</strong> - Scenarios where a security control is missing, misconfigured, or not functioning as intended.</p>
              </>
            ), 'right')}
          </div>
        </div>
      )}
    </div>
    {trendDrawerOpen && <TrendExploreDrawer onClose={() => setTrendDrawerOpen(false)} />}
    </>
  );
}

// ── Trend Explore: metric toggle ─────────────────────────────────
function ExpMetricToggle({ value, onChange }) {
  return (
    <div className="exp-metric-toggle">
      <span className={`exp-metric-toggle-label${value === 'sum' ? ' exp-metric-toggle-label--active' : ''}`}>Sum of Exposure</span>
      <button
        className={`exp-toggle-track${value === 'score' ? ' exp-toggle-track--on' : ''}`}
        onClick={() => onChange(value === 'score' ? 'sum' : 'score')}
      >
        <span className="exp-toggle-thumb" />
      </button>
      <span className={`exp-metric-toggle-label${value === 'score' ? ' exp-metric-toggle-label--active' : ''}`}>Exposure Score</span>
    </div>
  );
}

// ── Trend Explore: chart tooltip ─────────────────────────────────
function YAxisTitle({ value, viewBox }) {
  if (!viewBox) return null;
  const x = viewBox.x + 4;
  const y = viewBox.y + viewBox.height / 2;
  return (
    <text x={x} y={y} textAnchor="middle" transform={`rotate(-90, ${x}, ${y})`}
      fontSize={11} fill="var(--shell-text-muted)" fontFamily="Inter,system-ui">
      {value}
    </text>
  );
}

function makeExpTrendTooltip(data, { label, format, offset = 0, entity = 'All', color = 'var(--pai-teal)' }) {
  return function ExpTrendTooltip({ active, payload, label: pointLabel }) {
    if (!active || !payload?.length) return null;
    const value = payload[0].value;
    const idx = data.findIndex(d => d.name === pointLabel);
    const prev = idx > 0 ? data[idx - 1].value : null;
    const pct = prev ? ((value - prev) / prev) * 100 : null;
    const isUp = pct > 0;
    const drivers = idx > 0 ? deriveDrivers(data, idx, offset, entity) : null;
    return (
      <div className="dev-tip-card dev-tip-card--md" style={{ '--tip-border': color }}>
        <div className="dev-tip-title">{fmtTipDate(pointLabel)}</div>
        <div className={`dev-tip-row dev-tip-row--bold${pct !== null ? ' dev-tip-row--mb' : ''}`}>
          <span className="dev-tip-text">{label}</span>
          <span className="dev-tip-accent">{format(value)}</span>
        </div>
        {pct !== null && (
          <div className="dev-tip-trend">
            <span className={isUp ? 'dev-tip-trend-up' : 'dev-tip-trend-down'}>
              {isUp ? <IcTrendUp size={12} /> : <IcTrendDown size={12} />}
              {Math.abs(pct).toFixed(2)}%
            </span>
            &nbsp;from last week
          </div>
        )}
        {drivers && (
          <div className="dev-tip-drivers">
            {drivers.map(d => (
              <div className="dev-tip-driver-row" key={d.label}>
                <span className="dev-tip-muted">{d.label}</span>
                <span className={d.pct > 0 ? 'dev-tip-trend-up' : 'dev-tip-trend-down'}>
                  {d.pct > 0 ? '+' : ''}{d.pct.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };
}

// ── Trend Explore drawer ──────────────────────────────────────────
function TrendExploreDrawer({ onClose }) {
  const [tRange, setTRange] = useState('1M');
  const [exposureBy, setExposureBy] = useState('All');
  const [metric, setMetric] = useState('score'); // 'score' | 'sum'
  const [closing, setClosing] = useState(false);

  const handleClose = () => { setClosing(true); setTimeout(onClose, 180); };

  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const scoreData       = metric === 'sum' ? EXP_SUM_TREND[tRange] : EXP_SCORE_TREND[tRange];
  const scoreCurrent    = scoreData[scoreData.length - 1].value;
  const riskData        = EXP_RISK_ASSET_TREND[tRange];
  const findingsData    = EXP_FINDINGS_TREND[tRange];
  const findingsCurrent = findingsData[findingsData.length - 1].value;
  const axisTick = { fontSize: 10, fill: 'var(--shell-text-muted)', fontFamily: 'Inter,system-ui' };

  return (
    <>
      <div className="comp-drawer-backdrop" onClick={handleClose} />
      <button className="comp-drawer-close-ext" onClick={handleClose}>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
          <line x1="1" y1="1" x2="9" y2="9"/><line x1="9" y1="1" x2="1" y2="9"/>
        </svg>
      </button>

      <div className={`comp-drawer${closing ? ' comp-drawer--closing' : ''}`}>
        <div className="exp-trend-drawer-header">
          <span className="exp-trend-drawer-title">Trend Explore</span>
          <div className="comp-time-pills-wrap">
            {['1W', '1M', '3M', '6M', '1Y'].map(t => (
              <button key={t}
                className={`comp-time-pill${tRange === t ? ' comp-time-pill--active' : ''}`}
                onClick={() => setTRange(t)}
              >{t}</button>
            ))}
          </div>
          <div className="exp-trend-drawer-by">
            Exposure by
            <SelectDropdown value={exposureBy} onChange={setExposureBy} options={EXPOSURE_BY_OPTIONS} />
          </div>
        </div>

        <div className="exp-trend-drawer-body">
          <div className="exp-trend-card">
            <div className="exp-trend-card-hdr">
              <span className="exp-trend-card-title">
                {metric === 'sum' ? 'Sum of Exposure' : 'Exposure Score'}
                <InfoTooltip>
                  {metric === 'sum'
                    ? 'Sum of Exposure represents the total exposure across all associated findings for the selected scope and time range.'
                    : 'Exposure Score represents the normalized exposure level, calculated as the root mean square (RMS) of all associated finding scores, emphasizing higher-risk findings.'}
                </InfoTooltip>
              </span>
              <span className="exp-trend-card-badge exp-trend-card-badge--red">
                {metric === 'sum' ? fmtCompact(scoreCurrent) : Math.round(scoreCurrent)}
              </span>
              <span className="exp-trend-card-spacer" />
              <ExpMetricToggle value={metric} onChange={setMetric} />
            </div>
            <TrendDriverSummary data={scoreData} offset={0} entity={exposureBy} />
            <div className="exp-trend-card-chart exp-trend-card-chart--lg">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={scoreData} margin={{ top: 16, right: 24, bottom: 32, left: 16 }}>
                  <defs>
                    <linearGradient id="expTrendScoreFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--pai-teal)" stopOpacity={0.18} />
                      <stop offset="100%" stopColor="var(--pai-teal)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid horizontal vertical={false} stroke="var(--card-border, #F0F0F0)" />
                  <XAxis dataKey="name" tick={axisTick} axisLine={false} tickLine={false} dy={8}
                    label={{ value: TREND_UNIT[tRange], position: 'insideBottom', offset: -16, style: { fontSize: 11, fill: 'var(--shell-text-muted)', fontFamily: 'Inter,system-ui' } }} />
                  <YAxis tick={axisTick} axisLine={false} tickLine={false} width={60}
                    tickFormatter={v => metric === 'sum' ? fmtCompact(v) : v}
                    label={<YAxisTitle value={metric === 'sum' ? 'Sum of Exposure' : 'Exposure Score'} />} />
                  <Tooltip
                    content={makeExpTrendTooltip(scoreData, {
                      label: metric === 'sum' ? 'Sum of Exposure' : 'Score',
                      format: v => metric === 'sum' ? fmtCompact(v) : v.toFixed(2),
                      offset: 0,
                      entity: exposureBy,
                    })}
                    cursor={false}
                  />
                  <Area type="monotone" dataKey="value" stroke="var(--pai-teal)" strokeWidth={2}
                    fill="url(#expTrendScoreFill)" dot={{ r: 4, fill: 'var(--pai-teal)', strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: 'var(--pai-teal)', strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="exp-trend-row">
            <div className="exp-trend-card">
              <div className="exp-trend-card-hdr">
                <span className="exp-trend-card-title">Risk/Asset <InfoTooltip>This metric measures the average risk burden per device in your environment. It is derived by combining the total exposure score with the number of affected devices across all findings. A higher value suggests that risk is concentrated across fewer assets or that individual assets carry a disproportionate level of risk, helping you prioritise asset-level remediation.</InfoTooltip></span>
              </div>
              <TrendDriverSummary data={riskData} offset={1} entity={exposureBy} />
              <div className="exp-trend-card-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={riskData} margin={{ top: 16, right: 24, bottom: 32, left: 16 }}>
                    <defs>
                      <linearGradient id="expTrendRiskFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--pai-teal)" stopOpacity={0.18} />
                        <stop offset="100%" stopColor="var(--pai-teal)" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid horizontal vertical={false} stroke="var(--card-border, #F0F0F0)" />
                    <XAxis dataKey="name" tick={axisTick} axisLine={false} tickLine={false} dy={8}
                      label={{ value: TREND_UNIT[tRange], position: 'insideBottom', offset: -16, style: { fontSize: 11, fill: 'var(--shell-text-muted)', fontFamily: 'Inter,system-ui' } }} />
                    <YAxis tick={axisTick} axisLine={false} tickLine={false} width={60} tickFormatter={fmtCompact}
                      label={<YAxisTitle value="Density" />} />
                    <Tooltip content={makeExpTrendTooltip(riskData, { label: 'Density', format: v => v.toLocaleString(), offset: 1, entity: exposureBy })} cursor={false} />
                    <Area type="monotone" dataKey="value" stroke="var(--pai-teal)" strokeWidth={2}
                      fill="url(#expTrendRiskFill)" dot={{ r: 4, fill: 'var(--pai-teal)', strokeWidth: 0 }}
                      activeDot={{ r: 5, fill: 'var(--pai-teal)', strokeWidth: 0 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="exp-trend-card">
              <div className="exp-trend-card-hdr">
                <span className="exp-trend-card-title">Total Findings <InfoTooltip>This represents the total count of distinct findings identified across all finding categories (e.g., vulnerabilities, misconfigurations, compliance gaps). The trend reflects how your finding landscape is evolving over time — an upward trend may indicate newly discovered issues or expanded scan coverage, while a downward trend signals active remediation progress.</InfoTooltip></span>
                <span className="exp-trend-card-badge exp-trend-card-badge--muted">{fmtCompact(findingsCurrent)}</span>
              </div>
              <TrendDriverSummary data={findingsData} offset={3} entity={exposureBy} />
              <div className="exp-trend-card-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={findingsData} margin={{ top: 16, right: 24, bottom: 32, left: 16 }}>
                    <defs>
                      <linearGradient id="expTrendFindingsFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--pai-teal)" stopOpacity={0.18} />
                        <stop offset="100%" stopColor="var(--pai-teal)" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid horizontal vertical={false} stroke="var(--card-border, #F0F0F0)" />
                    <XAxis dataKey="name" tick={axisTick} axisLine={false} tickLine={false} dy={8}
                      label={{ value: TREND_UNIT[tRange], position: 'insideBottom', offset: -16, style: { fontSize: 11, fill: 'var(--shell-text-muted)', fontFamily: 'Inter,system-ui' } }} />
                    <YAxis tick={axisTick} axisLine={false} tickLine={false} width={60} tickFormatter={fmtCompact}
                      label={<YAxisTitle value="Count" />} />
                    <Tooltip content={makeExpTrendTooltip(findingsData, { label: 'Count', format: v => v.toLocaleString(), offset: 3, entity: exposureBy })} cursor={false} />
                    <Area type="monotone" dataKey="value" stroke="var(--pai-teal)" strokeWidth={2}
                      fill="url(#expTrendFindingsFill)" dot={{ r: 4, fill: 'var(--pai-teal)', strokeWidth: 0 }}
                      activeDot={{ r: 5, fill: 'var(--pai-teal)', strokeWidth: 0 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Mini bar ──────────────────────────────────────────────────────
function MiniBar({ pct }) {
  const fillColor = pctColor(pct);
  const fillWidth = Math.round(Math.min(pct, 100));
  return (
    <div className="exp-minibar-wrap">
      <div className="exp-minibar-track">
        <div className="exp-minibar-fill" style={{ '--exp-fill-w': `${fillWidth}%`, '--exp-fill-bg': fillColor }} />
      </div>
      <span className="exp-minibar-pct">{fmtPct(pct)}</span>
    </div>
  );
}

// ── Group-by select dropdown ─────────────────────────────────────
function SelectDropdown({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="comp-sort-wrap">
      <button
        className={`comp-sort-btn${open ? ' comp-sort-btn--active' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        <span>{value}</span>
        <IcChevron />
      </button>
      {open && (
        <div className="comp-sort-menu">
          {options.map(opt => (
            <button
              key={opt}
              className={`comp-sort-item${opt === value ? ' comp-sort-item--selected' : ''}`}
              onClick={() => { onChange(opt); setOpen(false); }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────
export default function ExposureOverviewPage({ onNav }) {
  const [search, setSearch]           = useState('');
  const [groupBy, setGroupBy]         = useState('Exposure Category');
  const [page, setPage]               = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const tableData   = GROUP_BY_DATA[groupBy] || [];
  const filtered    = tableData.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));
  const start       = (page - 1) * rowsPerPage;
  const visibleRows = filtered.slice(start, start + rowsPerPage);

  const TH = ({ children, align = 'left' }) => (
    <th className={`ds-th${align !== 'left' ? ` ds-th--${align}` : ''}`}>
      <span className="ds-th-inner">
        {children}
        <span className="exp-th-sort-icon"><IcSort /></span>
      </span>
    </th>
  );

  return (
    <div className="page">
      <ExposureOverviewSection onNav={onNav} />

      <div className="card exp-contrib-card">
        <div className="exp-contrib-hdr">
          <div className="exp-contrib-hdr-left">
            <span className="exp-contrib-title">Exposure by</span>
            <SelectDropdown
              value={groupBy}
              options={GROUP_BY_OPTIONS}
              onChange={(v) => { setGroupBy(v); setSearch(''); setPage(1); }}
            />
          </div>
          <div className="exp-contrib-hdr-right">
            <div className="exp-search-box">
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${groupBy}`} className="exp-search-input" />
              {search && (
                <button
                  onMouseDown={e => { e.preventDefault(); setSearch(''); }}
                  className="exp-search-clear"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                </button>
              )}
              <div className="exp-search-icon-wrap">
                <IcSearch />
              </div>
            </div>
          </div>
        </div>

        <div className="ds-table-wrap">
          <table className="ds-table exp-contrib-table">
            <thead>
              <tr>
                <TH>{groupBy}</TH>
                <TH>Exposure Score</TH>
                <TH>% of Total Exposure</TH>
                <TH>% of Total Findings</TH>
                <TH>% of Affected Assets</TH>
                <th className="ds-th ds-th--center exp-col-explore">Explore</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row, i) => (
                <tr key={i}>
                  <td className="ds-td exp-td-name">
                    <button
                      className="exp-td-name-link"
                      onClick={() => onNav && onNav('exposure/findings', groupBy === 'Exposure Category' ? { category: row.name } : undefined)}
                    >
                      {row.name}
                    </button>
                  </td>
                  <td className="ds-td">
                    <span className="exp-td-score" style={{ '--exp-score-color': scoreColor(row.score) }}>{row.score}</span>
                  </td>
                  <td className="ds-td"><MiniBar pct={row.exposurePct} /></td>
                  <td className="ds-td"><MiniBar pct={row.findingsPct} /></td>
                  <td className="ds-td"><MiniBar pct={row.assetsPct} /></td>
                  <td className="ds-td exp-col-explore">
                    <button
                      className="exp-row-explore-btn"
                      title="Explore"
                      onClick={() => onNav && onNav('exposure/findings', groupBy === 'Exposure Category' ? { category: row.name } : undefined)}
                    >
                      <IcExplore />
                    </button>
                  </td>
                </tr>
              ))}
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
