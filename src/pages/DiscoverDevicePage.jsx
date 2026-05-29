import React, { useState, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AreaChart, Area, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import TablePagination from '../components/TablePagination.jsx'
import { DSPillSearch } from '../context/WorkspaceCtx.jsx'
import DSDropdown from '../components/DSDropdown.jsx'
import '../styles/device.css'

// ── DS-style chart tooltips ───────────────────────────────────────
const TIP_WRAP = { animation: 'dsTooltipFade 0.15s ease', overflow: 'visible', zIndex: 100 };
const SourceTick = ({ x, y, payload }) => (
  <text x={x} y={y} dy={4} textAnchor="end" fontSize={10} fill="var(--shell-text-muted)" fontFamily="Inter,system-ui">
    {payload.value}
  </text>
);

function DonutTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  const color = p.color;
  return (
    <div className="dev-tip-card dev-tip-card--sm" style={{ '--tip-border': color }}>
      <div className="dev-tip-title">{p.label}</div>
      <div className="dev-tip-row dev-tip-row--bold">
        <span className="dev-tip-dot-row">
          <span className="dev-tip-dot" />
          {p.count}
        </span>
        <span className="dev-tip-accent">{p.pct}</span>
      </div>
    </div>
  );
}

function makeTrendTooltip(data) {
  return function({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    const value = payload[0].value;
    const idx = data.findIndex(d => d.name === label);
    const prev = idx > 0 ? data[idx - 1].value : null;
    const pct = prev ? (((value - prev) / prev) * 100).toFixed(2) : null;
    const isUp = pct > 0;
    return (
      <div className="dev-tip-card dev-tip-card--md" style={{ '--tip-border': 'var(--pai-indigo)' }}>
        <div className="dev-tip-title">{fmtDate(label)}</div>
        <div className={`dev-tip-row dev-tip-row--bold${pct ? ' dev-tip-row--mb' : ''}`}>
          <span className="dev-tip-text">Total</span>
          <span className="dev-tip-accent">{value.toLocaleString()}</span>
        </div>
        {pct && (
          <div className="dev-tip-trend">
            <span className={isUp ? 'dev-tip-trend-up' : 'dev-tip-trend-down'}>
              {isUp
                ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>
              }
              {Math.abs(pct)}%
            </span>
            &nbsp;from last week
          </div>
        )}
      </div>
    );
  };
}

// ── Static data ───────────────────────────────────────────────────

const MONTH_FULL = { Jan:'January', Feb:'February', Mar:'March', Apr:'April', May:'May', Jun:'June', Jul:'July', Aug:'August', Sep:'September', Oct:'October', Nov:'November', Dec:'December' };
function fmtDate(label) {
  const [day, mon] = label.split(' ');
  return `${day} ${MONTH_FULL[mon] || mon} 2024`;
}

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
];

const CRITICALITY = [
  { label: 'Critical', count: '953',    pct: 1.74,  color: 'var(--pai-crit-fg)'   },
  { label: 'High',     count: '12,353', pct: 22.59, color: 'var(--pai-red-high)'   },
  { label: 'Medium',   count: '36,136', pct: 66.08, color: 'var(--pai-med-fg)'      },
  { label: 'Low',      count: '5,244',  pct: 9.59,  color: 'var(--pai-green)'     },
];

const ASSETS = [
  { name: 'VM-TSR39727.ACNA.CO...', type: 'Server', os: 'Linux', deploy: 'Cloud', crit: 'Critical', score: 1000 },
  { name: 'VM-TSR19224.ACNA.CO...', type: 'Server', os: 'Linux', deploy: 'Cloud', crit: 'Critical', score: 998  },
  { name: 'VM-TSR27829.ACNA.C...',  type: 'Server', os: 'Linux', deploy: 'Cloud', crit: 'Critical', score: 998  },
  { name: 'VM-TSR17132.ACNA.CO...', type: 'Server', os: 'Linux', deploy: 'Cloud', crit: 'Critical', score: 998  },
  { name: 'VM-TSR37484.ACNA.C...',  type: 'Server', os: 'Linux', deploy: 'Cloud', crit: 'Critical', score: 996  },
];

// ── Chart data ────────────────────────────────────────────────────

const TYPES_PIE_DATA = TYPES.slice(0, 6).map(t => ({
  label: t.label,
  count: t.count.toLocaleString(),
  value: t.count,
  pct: t.pct <= 1 ? '<1%' : `${t.pct}%`,
  color: t.color,
}));

const TREND_DATA_BY_RANGE = {
  '1 W': [
    { name: '2 Aug',  value: 11900 },
    { name: '3 Aug',  value: 12020 },
    { name: '4 Aug',  value: 12100 },
    { name: '5 Aug',  value: 12180 },
    { name: '6 Aug',  value: 12250 },
    { name: '7 Aug',  value: 12320 },
    { name: '8 Aug',  value: 12382 },
  ],
  '1 M': [
    { name: '12 Jul', value: 11640 },
    { name: '19 Jul', value: 11800 },
    { name: '26 Jul', value: 11970 },
    { name: '2 Aug',  value: 12180 },
    { name: '8 Aug',  value: 12382 },
  ],
  '3 M': [
    { name: '18 May', value: 9800  },
    { name: '25 May', value: 10050 },
    { name: '1 Jun',  value: 10300 },
    { name: '8 Jun',  value: 10520 },
    { name: '15 Jun', value: 10740 },
    { name: '22 Jun', value: 10960 },
    { name: '29 Jun', value: 11160 },
    { name: '6 Jul',  value: 11360 },
    { name: '13 Jul', value: 11560 },
    { name: '20 Jul', value: 11760 },
    { name: '27 Jul', value: 11960 },
    { name: '3 Aug',  value: 12180 },
    { name: '8 Aug',  value: 12382 },
  ],
  '6 M': [
    { name: '8 Feb',  value: 7200  },
    { name: '8 Mar',  value: 8400  },
    { name: '8 Apr',  value: 9400  },
    { name: '8 May',  value: 10300 },
    { name: '8 Jun',  value: 11100 },
    { name: '8 Jul',  value: 11800 },
    { name: '8 Aug',  value: 12382 },
  ],
  '1 Y': [
    { name: '1 Sep',  value: 3800  },
    { name: '1 Oct',  value: 4600  },
    { name: '1 Nov',  value: 5400  },
    { name: '1 Dec',  value: 6100  },
    { name: '1 Jan',  value: 6900  },
    { name: '1 Feb',  value: 7600  },
    { name: '1 Mar',  value: 8400  },
    { name: '1 Apr',  value: 9200  },
    { name: '1 May',  value: 10000 },
    { name: '1 Jun',  value: 10800 },
    { name: '1 Jul',  value: 11600 },
    { name: '8 Aug',  value: 12382 },
  ],
};

const SOURCES_CHART_DATA = SOURCES.map(s => ({
  name: s.name,
  Unique: s.total - s.corr,
  Corroborated: s.corr,
}));

const TYPE_TREND_DATA_BY_RANGE = {
  '1 W': [
    { name: '2 Aug',  Server: 4057, Workstation: 2814, Network: 2567, Mobile: 883, Printers: 121, IOT: 119, 'Storage Accounts': 2 },
    { name: '3 Aug',  Server: 4063, Workstation: 2821, Network: 2574, Mobile: 885, Printers: 122, IOT: 120, 'Storage Accounts': 2 },
    { name: '4 Aug',  Server: 4069, Workstation: 2828, Network: 2580, Mobile: 887, Printers: 122, IOT: 120, 'Storage Accounts': 2 },
    { name: '5 Aug',  Server: 4074, Workstation: 2834, Network: 2586, Mobile: 890, Printers: 123, IOT: 121, 'Storage Accounts': 2 },
    { name: '6 Aug',  Server: 4078, Workstation: 2839, Network: 2591, Mobile: 892, Printers: 123, IOT: 121, 'Storage Accounts': 2 },
    { name: '7 Aug',  Server: 4082, Workstation: 2844, Network: 2596, Mobile: 895, Printers: 124, IOT: 122, 'Storage Accounts': 2 },
    { name: '8 Aug',  Server: 4086, Workstation: 2848, Network: 2600, Mobile: 897, Printers: 124, IOT: 122, 'Storage Accounts': 2 },
  ],
  '1 M': [
    { name: '12 Jul', Server: 3948, Workstation: 2712, Network: 2472, Mobile: 857, Printers: 118, IOT: 116, 'Storage Accounts': 2 },
    { name: '19 Jul', Server: 3980, Workstation: 2748, Network: 2510, Mobile: 868, Printers: 119, IOT: 117, 'Storage Accounts': 2 },
    { name: '26 Jul', Server: 4015, Workstation: 2782, Network: 2545, Mobile: 878, Printers: 121, IOT: 119, 'Storage Accounts': 2 },
    { name: '2 Aug',  Server: 4054, Workstation: 2819, Network: 2574, Mobile: 889, Printers: 122, IOT: 121, 'Storage Accounts': 2 },
    { name: '8 Aug',  Server: 4086, Workstation: 2848, Network: 2600, Mobile: 897, Printers: 124, IOT: 122, 'Storage Accounts': 2 },
  ],
  '3 M': [
    { name: '18 May', Server: 3350, Workstation: 2130, Network: 1940, Mobile: 723, Printers: 97,  IOT: 95,  'Storage Accounts': 1 },
    { name: '25 May', Server: 3408, Workstation: 2195, Network: 2003, Mobile: 738, Printers: 99,  IOT: 97,  'Storage Accounts': 1 },
    { name: '1 Jun',  Server: 3462, Workstation: 2255, Network: 2058, Mobile: 752, Printers: 102, IOT: 100, 'Storage Accounts': 1 },
    { name: '8 Jun',  Server: 3518, Workstation: 2315, Network: 2115, Mobile: 767, Printers: 104, IOT: 102, 'Storage Accounts': 1 },
    { name: '15 Jun', Server: 3568, Workstation: 2368, Network: 2170, Mobile: 781, Printers: 107, IOT: 105, 'Storage Accounts': 1 },
    { name: '22 Jun', Server: 3618, Workstation: 2422, Network: 2226, Mobile: 796, Printers: 109, IOT: 107, 'Storage Accounts': 2 },
    { name: '29 Jun', Server: 3668, Workstation: 2478, Network: 2282, Mobile: 810, Printers: 111, IOT: 109, 'Storage Accounts': 2 },
    { name: '6 Jul',  Server: 3722, Workstation: 2538, Network: 2340, Mobile: 825, Printers: 114, IOT: 112, 'Storage Accounts': 2 },
    { name: '13 Jul', Server: 3778, Workstation: 2600, Network: 2402, Mobile: 842, Printers: 116, IOT: 114, 'Storage Accounts': 2 },
    { name: '20 Jul', Server: 3840, Workstation: 2662, Network: 2458, Mobile: 858, Printers: 119, IOT: 117, 'Storage Accounts': 2 },
    { name: '27 Jul', Server: 3935, Workstation: 2728, Network: 2522, Mobile: 874, Printers: 121, IOT: 119, 'Storage Accounts': 2 },
    { name: '3 Aug',  Server: 4022, Workstation: 2800, Network: 2568, Mobile: 888, Printers: 122, IOT: 121, 'Storage Accounts': 2 },
    { name: '8 Aug',  Server: 4086, Workstation: 2848, Network: 2600, Mobile: 897, Printers: 124, IOT: 122, 'Storage Accounts': 2 },
  ],
  '6 M': [
    { name: '8 Feb',  Server: 2780, Workstation: 1660, Network: 1510, Mobile: 575, Printers:  81, IOT:  79, 'Storage Accounts': 1 },
    { name: '8 Mar',  Server: 3100, Workstation: 1980, Network: 1800, Mobile: 660, Printers:  91, IOT:  89, 'Storage Accounts': 1 },
    { name: '8 Apr',  Server: 3400, Workstation: 2250, Network: 2040, Mobile: 732, Printers: 101, IOT:  99, 'Storage Accounts': 1 },
    { name: '8 May',  Server: 3640, Workstation: 2460, Network: 2240, Mobile: 790, Printers: 108, IOT: 106, 'Storage Accounts': 2 },
    { name: '8 Jun',  Server: 3820, Workstation: 2620, Network: 2380, Mobile: 832, Printers: 114, IOT: 112, 'Storage Accounts': 2 },
    { name: '8 Jul',  Server: 3970, Workstation: 2750, Network: 2500, Mobile: 866, Printers: 120, IOT: 118, 'Storage Accounts': 2 },
    { name: '8 Aug',  Server: 4086, Workstation: 2848, Network: 2600, Mobile: 897, Printers: 124, IOT: 122, 'Storage Accounts': 2 },
  ],
  '1 Y': [
    { name: '1 Sep',  Server: 1400, Workstation:  850, Network:  770, Mobile: 278, Printers: 44, IOT: 42, 'Storage Accounts': 0 },
    { name: '1 Oct',  Server: 1760, Workstation: 1100, Network: 1000, Mobile: 348, Printers: 53, IOT: 51, 'Storage Accounts': 0 },
    { name: '1 Nov',  Server: 2100, Workstation: 1370, Network: 1230, Mobile: 418, Printers: 62, IOT: 60, 'Storage Accounts': 0 },
    { name: '1 Dec',  Server: 2400, Workstation: 1600, Network: 1440, Mobile: 484, Printers: 69, IOT: 67, 'Storage Accounts': 1 },
    { name: '1 Jan',  Server: 2700, Workstation: 1840, Network: 1640, Mobile: 550, Printers: 76, IOT: 74, 'Storage Accounts': 1 },
    { name: '1 Feb',  Server: 2960, Workstation: 2040, Network: 1840, Mobile: 610, Printers: 83, IOT: 81, 'Storage Accounts': 1 },
    { name: '1 Mar',  Server: 3200, Workstation: 2230, Network: 2010, Mobile: 668, Printers: 89, IOT: 87, 'Storage Accounts': 1 },
    { name: '1 Apr',  Server: 3440, Workstation: 2400, Network: 2170, Mobile: 724, Printers: 96, IOT: 94, 'Storage Accounts': 1 },
    { name: '1 May',  Server: 3640, Workstation: 2550, Network: 2320, Mobile: 775, Printers: 103, IOT: 101, 'Storage Accounts': 2 },
    { name: '1 Jun',  Server: 3820, Workstation: 2680, Network: 2430, Mobile: 820, Printers: 110, IOT: 108, 'Storage Accounts': 2 },
    { name: '1 Jul',  Server: 3980, Workstation: 2780, Network: 2520, Mobile: 862, Printers: 118, IOT: 116, 'Storage Accounts': 2 },
    { name: '8 Aug',  Server: 4086, Workstation: 2848, Network: 2600, Mobile: 897, Printers: 124, IOT: 122, 'Storage Accounts': 2 },
  ],
};

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
const IcLinux = () => (
  <svg width="13" height="13" viewBox="0 0 32 32" fill="currentColor">
    <path d="M16 2C9.37 2 4 7.37 4 14c0 3.69 1.58 7 4.09 9.33C9.3 24.4 10 25.7 10 27h12c0-1.3.7-2.6 1.91-3.67C26.42 21 28 17.69 28 14 28 7.37 22.63 2 16 2zm-3 17a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm6 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3-5c0 2.5-1.5 4-3 4.5V18c0-.55-.45-1-1-1h-4c-.55 0-1 .45-1 1v.5C11.5 18 10 16.5 10 14c0-3.31 2.69-6 6-6s6 2.69 6 6z"/>
  </svg>
);
const IcExplore = () => <img src="/assets/icons/icon-explore.svg" width="12" height="12" alt="" />;
const IcNewlyAdded = () => (
  <svg width="10" height="10" viewBox="0 0 8.99512 8.98682" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <path d="M0.5 8.48682H5.48074"/><path d="M8.49512 0.5L8.49512 5.48074"/><path d="M2.49414 2.51758L6.46736 6.4908"/>
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

const IcSevHigh = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M8.76193 3.56881L13.3879 11.6015C13.7121 12.1675 13.2932 12.8662 12.6257 12.8662H3.37382C2.70632 12.8662 2.28741 12.1675 2.61164 11.6015L7.23758 3.56881C7.5708 2.98911 8.42871 2.98911 8.76193 3.56881Z" stroke="var(--pai-crit-fg)" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8.00049 9.05806V6.94238" stroke="var(--pai-crit-fg)" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8.00043 11.5968C8.35097 11.5968 8.63513 11.3126 8.63513 10.9621C8.63513 10.6116 8.35097 10.3274 8.00043 10.3274C7.64989 10.3274 7.36572 10.6116 7.36572 10.9621C7.36572 11.3126 7.64989 11.5968 8.00043 11.5968Z" fill="var(--pai-crit-fg)"/>
  </svg>
);
const IcSevMed = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M8.76193 3.56881L13.3879 11.6015C13.7121 12.1675 13.2932 12.8662 12.6257 12.8662H3.37382C2.70632 12.8662 2.28741 12.1675 2.61164 11.6015L7.23758 3.56881C7.5708 2.98911 8.42871 2.98911 8.76193 3.56881Z" stroke="var(--pai-crit-fg)" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8.00049 9.05806V6.94238" stroke="var(--pai-crit-fg)" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8.00043 11.5968C8.35097 11.5968 8.63513 11.3126 8.63513 10.9621C8.63513 10.6116 8.35097 10.3274 8.00043 10.3274C7.64989 10.3274 7.36572 10.6116 7.36572 10.9621C7.36572 11.3126 7.64989 11.5968 8.00043 11.5968Z" fill="var(--pai-crit-fg)"/>
  </svg>
);

// ── Dashboard-mode widget controls overlay ────────────────────────
function DdbControls({ canMove = true, onEdit }) {
  return (
    <div className="ddb-controls">
      {canMove && (
        <button className="ddb-ctrl-btn ddb-ctrl-btn--grab" title="Move">
          <img src="/assets/icons/lcnc/drag-widget.svg" width={16} height={16} alt="drag" />
        </button>
      )}
      <button className="ddb-ctrl-btn" title="Settings" onClick={onEdit}>
        <img src="/assets/icons/lcnc/dasboard-edit.svg" width={16} height={16} alt="edit" />
      </button>
      <button className="ddb-ctrl-btn ddb-ctrl-btn--delete" title="Delete">
        <img src="/assets/icons/lcnc/delete.svg" width={16} height={16} alt="delete" />
      </button>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────

export default function DiscoverDevicePage({ dashboardMode = false, onEditWidget, onAddWidget }) {
  const [timeRange,     setTimeRange]     = useState('1 Y');
  const [insightSearch, setInsightSearch] = useState('');
  const [assetSearch,   setAssetSearch]   = useState('');
  const [insightPage,   setInsightPage]   = useState(1);
  const [assetPage,     setAssetPage]     = useState(1);
  const [rowsPer,       setRowsPer]       = useState(10);
  const [hoveredCrit,   setHoveredCrit]   = useState(null);
  const [critTooltip,   setCritTooltip]   = useState(null);
  const [showDrawer,    setShowDrawer]    = useState(false);
  const [drawerClosing, setDrawerClosing] = useState(false);
  const [drawerRange,   setDrawerRange]   = useState('1 M');
  const [baselineView,  setBaselineView]  = useState(false);
  const [drawerFilter,  setDrawerFilter]  = useState('All');
  const closeDrawer = useCallback(() => {
    setDrawerClosing(true);
    setTimeout(() => { setShowDrawer(false); setDrawerClosing(false); }, 240);
  }, []);
  const hoveredBarRef    = useRef(null);
  const hoveredTypeRef   = useRef(null);
  const typeRangeDataRef = useRef(null);
  const drawerChartRef   = useRef(null);
  const [hoveredType,   setHoveredType]   = useState(null);
  const [selectedType,  setSelectedType]  = useState(null);
  const [drawerTooltipPos, setDrawerTooltipPos] = useState({ x: 0, y: 0 });
  const [typeTooltipData, setTypeTooltipData] = useState(null);
  const currentTrendData = TREND_DATA_BY_RANGE[timeRange] ?? TREND_DATA_BY_RANGE['1 Y'];

  // Dashboard mode widget hover state
  const [hoveredWidget,  setHoveredWidget]  = useState(null);
  const [critSection,    setCritSection]    = useState(null);

  // Mouse position refs for portal tooltips (bypass card overflow:hidden)
  const sourceTipPosRef = useRef({ x: 0, y: 0 });
  const donutPosRef     = useRef({ x: 0, y: 0 });

  const SourceTooltip = useCallback(({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const entry = payload.find(e => e.dataKey === hoveredBarRef.current) || payload[0];
    const total = payload.reduce((sum, e) => sum + (e.value || 0), 0);
    const pct = total > 0 ? ((entry.value / total) * 100).toFixed(2) : '0.00';
    const color = entry.fill;
    const { x, y } = sourceTipPosRef.current;
    return createPortal(
      <div className="dev-tip-card dev-tip-card--lg dev-tip-card--fixed" style={{ '--tip-border': color, left: x + 14, top: y - 40 }}>
        <div className="dev-tip-title">{label}</div>
        <div className="dev-tip-col">
          <div className="dev-tip-row dev-tip-row--bold">
            <span className="dev-tip-text">{entry.name} Entities</span>
            <span className="dev-tip-accent">{entry.value.toLocaleString()}</span>
          </div>
          <div className="dev-tip-row dev-tip-row--medium">
            <span className="dev-tip-text">Total Entities</span>
            <span className="dev-tip-muted">{total.toLocaleString()}</span>
          </div>
          <div className="dev-tip-row dev-tip-row--medium">
            <span className="dev-tip-text">Percentage</span>
            <span className="dev-tip-accent">{pct}%</span>
          </div>
        </div>
      </div>,
      document.body
    );
  }, []);

  const DonutTooltipFixed = useCallback(({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const p = payload[0].payload;
    const { x, y } = donutPosRef.current;
    return createPortal(
      <div className="dev-tip-card dev-tip-card--sm dev-tip-card--fixed" style={{ '--tip-border': p.color, left: x + 14, top: y - 40 }}>
        <div className="dev-tip-title">{p.label}</div>
        <div className="dev-tip-row dev-tip-row--bold">
          <span className="dev-tip-dot-row">
            <span className="dev-tip-dot" />
            {p.count}
          </span>
          <span className="dev-tip-accent">{p.pct}</span>
        </div>
      </div>,
      document.body
    );
  }, []);

  const filteredInsights = INSIGHTS.filter(r =>
    r.text.toLowerCase().includes(insightSearch.toLowerCase())
  );
  const filteredAssets = ASSETS.filter(r =>
    r.name.toLowerCase().includes(assetSearch.toLowerCase())
  );

  const TH = ({ children }) => (
    <th className="ds-th">
      <span className="ds-th-inner">{children}<span className="ds-th-sort"><IcSort /></span></span>
    </th>
  );

  return (
    <div className="page dev-page">
      <div className="dev-grid">

        {/* ── Left column ──────────────────────────────── */}
        <div className="dev-col-left">

          {/* Total stat + trend chart */}
          <div
            className="ddb-widget-wrap"
            onMouseEnter={() => dashboardMode && setHoveredWidget('total')}
            onMouseLeave={() => dashboardMode && setHoveredWidget(null)}
          >
          {dashboardMode && hoveredWidget === 'total' && <DdbControls onEdit={() => onEditWidget?.('total')} />}
          <div className="card dev-card">
            <div className="dev-stat-header">
              <div className="dev-stat-title-row">
                <span className="dev-stat-label">Total</span>
                <span className="dev-newly-added">
                  <IcNewlyAdded />
                  <span>15 Newly added</span>
                </span>
              </div>
              <div className="dev-stat-header-controls">
                <div className="dev-time-pills">
                  {TIME_RANGES.map(r => (
                    <button
                      key={r}
                      className={`dev-time-pill${timeRange === r ? ' dev-time-pill--active' : ''}`}
                      onClick={() => setTimeRange(r)}
                    >{r}</button>
                  ))}
                </div>
                <button className="ds-btn sz-sm t-tertiary" onClick={() => setShowDrawer(true)}>
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

            <div className="dev-chart-area">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={currentTrendData} margin={{ top: 16, right: 16, bottom: 0, left: 8 }}>
                  <defs>
                    <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="var(--pai-indigo)" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="var(--pai-indigo)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid horizontal={false} vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: 'var(--shell-text-muted)', fontFamily: 'Inter,system-ui' }}
                    axisLine={false}
                    tickLine={false}
                    dy={6}
                  />
                  <YAxis hide />
                  <Tooltip content={makeTrendTooltip(currentTrendData)} isAnimationActive={false} wrapperStyle={TIP_WRAP} cursor={false} />
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
          </div>{/* /ddb-widget-wrap total */}

          {/* Bottom row: Data Source + Type */}
          <div className="dev-bottom-row">

            {/* Data Source */}
            <div
              className="ddb-widget-wrap"
              onMouseEnter={() => dashboardMode && setHoveredWidget('source')}
              onMouseLeave={() => dashboardMode && setHoveredWidget(null)}
            >
            {dashboardMode && hoveredWidget === 'source' && <DdbControls onEdit={() => onEditWidget?.('source')} />}
            <div className="card dev-card dev-source-card">
              <div className="dev-card-title">Data Source</div>
              <div
                className="dev-chart-fill"
                onMouseMove={(e) => { sourceTipPosRef.current = { x: e.clientX, y: e.clientY }; }}
              >
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
                      tick={<SourceTick />}
                      width={92}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={SourceTooltip} isAnimationActive={false} wrapperStyle={TIP_WRAP} cursor={false} />
                    <Bar dataKey="Corroborated" stackId="a" fill="var(--pai-chart-teal)" radius={[2, 0, 0, 2]} isAnimationActive={false} onMouseEnter={() => { hoveredBarRef.current = 'Corroborated'; }} onMouseLeave={() => { hoveredBarRef.current = null; }} />
                    <Bar
                      dataKey="Unique"
                      stackId="a"
                      fill="var(--pai-chart-purple)"
                      radius={[0, 2, 2, 0]}
                      isAnimationActive={false}
                      onMouseEnter={() => { hoveredBarRef.current = 'Unique'; }}
                      onMouseLeave={() => { hoveredBarRef.current = null; }}
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
              <div className="dev-chart-legend">
                <span className="dev-legend-dot dev-legend-dot--teal" /><span>Corroborated</span>
                <span className="dev-legend-dot dev-legend-dot--purple" /><span>Unique</span>
              </div>
            </div>
            </div>{/* /ddb-widget-wrap source */}

            {/* Type + Donut */}
            <div
              className="ddb-widget-wrap"
              onMouseEnter={() => dashboardMode && setHoveredWidget('type')}
              onMouseLeave={() => dashboardMode && setHoveredWidget(null)}
            >
            {dashboardMode && hoveredWidget === 'type' && <DdbControls onEdit={() => onEditWidget?.('type')} />}
            <div className="card dev-card dev-type-card">
              <div className="dev-card-title">Type</div>
              <div
                className="dev-donut-wrap"
                onMouseMove={(e) => { donutPosRef.current = { x: e.clientX, y: e.clientY }; }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={TYPES_PIE_DATA}
                      cx="50%"
                      cy="50%"
                      innerRadius="46%"
                      outerRadius="54%"
                      paddingAngle={4}
                      dataKey="value"
                      nameKey="label"
                      strokeWidth={0}
                      startAngle={90}
                      endAngle={-270}
                      cornerRadius={4}
                    >
                      {TYPES_PIE_DATA.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={DonutTooltipFixed} isAnimationActive={false} wrapperStyle={TIP_WRAP} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="dev-donut-center">
                  <div className="dev-donut-center__label">Total</div>
                  <div className="dev-donut-center__value">6</div>
                </div>
              </div>
              <div className="dev-type-list">
                {TYPES.map((t, i) => (
                  <div key={i} className="dev-type-row">
                    <div className="dev-type-row-left">
                      <span className="dev-type-icon" style={{ '--type-color': t.color }}>{TYPE_ICONS[t.icon]}</span>
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
            </div>{/* /ddb-widget-wrap type */}

            {dashboardMode && onAddWidget && (
              <button onClick={onAddWidget} className="ddb-add-widget-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                <span className="ddb-add-widget-label">Add Widget</span>
              </button>
            )}

          </div>
        </div>

        {/* ── Right column ─────────────────────────────── */}
        <div className="dev-col-right">

          {/* Key Security Insights */}
          <div
            className="ddb-widget-wrap"
            onMouseEnter={() => dashboardMode && setHoveredWidget('insights')}
            onMouseLeave={() => dashboardMode && setHoveredWidget(null)}
          >
          {dashboardMode && hoveredWidget === 'insights' && <DdbControls onEdit={() => onEditWidget?.('insights')} />}
          <div className="card dev-card dev-insights-card">
            <div className="dev-card-hdr">
              <span className="dev-card-title">Key Security Insights — Top 5</span>
              <DSPillSearch
                value={insightSearch}
                onChange={v => { setInsightSearch(v); setInsightPage(1); }}
                placeholder="Search assessments…"
              />
            </div>
            <div className="ds-table-wrap">
              <table className="ds-table">
                <thead>
                  <tr>
                    <th className="ds-th dev-th-icon" />
                    <TH>Assessment</TH>
                    <TH>Findings Failed</TH>
                    <TH>Exposure Category</TH>
                  </tr>
                </thead>
                <tbody>
                  {filteredInsights.slice((insightPage-1)*rowsPer, insightPage*rowsPer).map((r, i) => (
                    <tr key={i}>
                      <td className="ds-td dev-td-icon">
                        {r.sev === 'high' ? <IcSevHigh /> : <IcSevMed />}
                      </td>
                      <td className="ds-td dev-td-name">{r.text}</td>
                      <td className="ds-td dev-td-findings">
                        <div className="dev-findings-bar">
                          <div className="dev-findings-bar__track">
                            <div className="dev-findings-bar__fill" style={{ width: `${r.failPct}%` }} />
                          </div>
                          <span className="dev-findings-bar__pct">{r.failPct}%</span>
                        </div>
                      </td>
                      <td className="ds-td">
                        {r.cat}
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
          </div>{/* /ddb-widget-wrap insights */}

          {/* Criticality */}
          <div
            className="ddb-widget-wrap"
            onMouseEnter={() => dashboardMode && setCritSection(s => s || 'outer')}
            onMouseLeave={() => dashboardMode && setCritSection(null)}
          >
          {dashboardMode && critSection && <DdbControls onEdit={() => onEditWidget?.('crit')} />}
          <div className="card dev-card dev-crit-card">
            <div className="dev-card-hdr">
              <span className="dev-card-title">Criticality Insights</span>
            </div>

            <div className="dev-crit-bar-section">
              <div className="dev-stacked-bar">
                {CRITICALITY.map((c, i) => (
                  <div
                    key={i}
                    className="dev-crit-seg"
                    data-dimmed={hoveredCrit !== null && hoveredCrit !== i ? 'true' : 'false'}
                    style={{ '--seg-color': c.color, '--seg-flex': c.pct }}
                    onMouseEnter={(e) => { setHoveredCrit(i); setCritTooltip({ i, x: e.clientX, y: e.clientY }); }}
                    onMouseMove={(e) => setCritTooltip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null)}
                    onMouseLeave={() => { setHoveredCrit(null); setCritTooltip(null); }}
                  />
                ))}
              </div>
              <div className="dev-crit-legend">
                {CRITICALITY.map((c, i) => (
                  <div key={i} className="dev-crit-leg-item" style={{ '--crit-color': c.color }}>
                    <span className="dev-crit-leg-label">{c.label}</span>
                    <div className="dev-crit-leg-bottom">
                      <span className="dev-crit-leg-count">{c.count}</span>
                      <span className="dev-crit-leg-pct">{c.pct.toFixed(2)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Nested: Assets by Criticality Score */}
            <div
              className="ddb-nested-wrap"
              onMouseEnter={() => dashboardMode && setCritSection('assets')}
              onMouseLeave={() => dashboardMode && setCritSection('outer')}
            >
            {dashboardMode && critSection === 'assets' && <DdbControls canMove={false} onEdit={() => onEditWidget?.('assets')} />}
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

            <div className="ds-table-wrap">
              <table className="ds-table">
                <thead>
                  <tr>
                    <TH>Display Label</TH>
                    <TH>Type</TH>
                    <TH>Deployment Type</TH>
                    <TH>Asset Criticality</TH>
                    <TH>Asset Criticality Score</TH>
                    <TH>OS Family</TH>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.slice((assetPage-1)*10, assetPage*10).map((a, i) => (
                    <tr key={i}>
                      <td className="ds-td dev-td-name">{a.name}</td>
                      <td className="ds-td">{a.type}</td>
                      <td className="ds-td">{a.deploy}</td>
                      <td className="ds-td"><span className="pai-chip pai-chip--crit">{a.crit}</span></td>
                      <td className="ds-td dev-td-score">{a.score.toLocaleString()}</td>
                      <td className="ds-td"><span className="dev-cell-icon-text"><IcLinux />{a.os}</span></td>
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
            </div>{/* /ddb-nested-wrap assets */}
          </div>
          </div>{/* /ddb-widget-wrap crit */}

        </div>
      </div>

      {/* ── Trend Explore Drawer ──────────────────────────────────── */}
      {showDrawer && (() => {
        const rawBaseData = TREND_DATA_BY_RANGE[drawerRange] ?? TREND_DATA_BY_RANGE['1 Y'];
        const drawerData = baselineView
          ? (() => { const b = rawBaseData[0]?.value ?? 1; return rawBaseData.map(d => ({ ...d, value: +((d.value / b * 100) - 100).toFixed(2) })); })()
          : rawBaseData;
        const statValue = currentTrendData[currentTrendData.length - 1]?.value ?? 0;
        const first    = rawBaseData[0]?.value ?? 0;
        const last     = rawBaseData[rawBaseData.length - 1]?.value ?? 0;
        const trendPct = first > 0 ? (((last - first) / first) * 100).toFixed(2) : '0.00';
        const isUp     = last >= first;
        const xLabel   = drawerRange === '1 W' ? 'Daily' : (drawerRange === '6 M' || drawerRange === '1 Y') ? 'Monthly' : 'Weekly';
        const yLabel   = baselineView ? 'Percentage' : 'Count';
        const yFmt     = baselineView ? v => `${v}%` : v => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v;
        const isTypeFilter = drawerFilter === 'Type';
        const rawTypeRangeData = TYPE_TREND_DATA_BY_RANGE[drawerRange] ?? TYPE_TREND_DATA_BY_RANGE['1 Y'];
        const typeRangeData = baselineView
          ? (() => { const b0 = rawTypeRangeData[0]; return rawTypeRangeData.map(d => ({ name: d.name, ...Object.fromEntries(TYPES.map(t => { const base = b0[t.label] ?? 1; return [t.label, base > 0 ? +((d[t.label] / base * 100) - 100).toFixed(2) : 0]; })) })); })()
          : rawTypeRangeData;
        typeRangeDataRef.current = typeRangeData;
        return (
          <>
            <div className={`dev-drawer-overlay${drawerClosing ? ' closing' : ''}`} onClick={closeDrawer} />
            <button className="dev-drawer-close-ext" onClick={closeDrawer}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <line x1="1" y1="1" x2="9" y2="9"/><line x1="9" y1="1" x2="1" y2="9"/>
              </svg>
            </button>
            <div className={`dev-drawer${drawerClosing ? ' closing' : ''}`}>
              <div className="dev-drawer-hdr">
                <span className="dev-drawer-title">Trend Explore</span>
              </div>
              <div className="dev-drawer-body">
                <div className="dev-drawer-controls">
                  <div className="dev-drawer-stat">
                    <div className="dev-drawer-stat__label">Total</div>
                    <div className="dev-drawer-stat__value">{statValue.toLocaleString()}</div>
                  </div>
                  <div className="dev-drawer-range-center">
                    <div className="dev-time-pills">
                      {TIME_RANGES.map(r => (
                        <button key={r} className={`dev-time-pill${drawerRange === r ? ' dev-time-pill--active' : ''}`} onClick={() => setDrawerRange(r)}>{r}</button>
                      ))}
                    </div>
                  </div>
                  <DSDropdown
                    value={drawerFilter}
                    onChange={setDrawerFilter}
                    options={['All','Type','Origin','Deployment Type','Environment','Asset Criticality','OS Family']}
                  />
                </div>
                <div className="dev-baseline-row">
                  <span>Baseline View</span>
                  <label className={`dev-toggle${baselineView ? ' dev-toggle--on' : ''}`}>
                    <input type="checkbox" className="dev-toggle__input" checked={baselineView} onChange={e => setBaselineView(e.target.checked)} />
                    <span className="dev-toggle__track">
                      <span className="dev-toggle__thumb" />
                    </span>
                  </label>
                </div>
                <div
                  ref={drawerChartRef}
                  className="dev-drawer-chart-wrap"
                  onMouseMove={(e) => { const r = drawerChartRef.current?.getBoundingClientRect(); if (r) setDrawerTooltipPos({ x: e.clientX - r.left + 14, y: e.clientY - r.top - 40 }); }}
                >
                  {typeTooltipData && (
                    <div
                      className="dev-type-tooltip"
                      style={{ '--tt-color': typeTooltipData.color, left: drawerTooltipPos.x, top: drawerTooltipPos.y }}
                    >
                      <div className="dev-tip-title">{fmtDate(typeTooltipData.label)}</div>
                      <div className={`dev-tip-row dev-tip-row--bold${typeTooltipData.pct !== null ? ' dev-tip-row--mb' : ''}`}>
                        <span>{typeTooltipData.key}</span>
                        <span className="dev-tt-accent">{typeTooltipData.value?.toLocaleString()}</span>
                      </div>
                      {typeTooltipData.pct !== null && (
                        <div className="dev-tip-trend">
                          <span className={Number(typeTooltipData.pct) >= 0 ? 'dev-tip-trend-up' : 'dev-tip-trend-down'}>
                            {Number(typeTooltipData.pct) >= 0
                              ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                              : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>}
                            {Math.abs(Number(typeTooltipData.pct))}%
                          </span>
                          &nbsp;from last period
                        </div>
                      )}
                    </div>
                  )}
                  <ResponsiveContainer width="100%" height={400}>
                    {isTypeFilter ? (
                      <LineChart data={typeRangeData} margin={{ top: 16, right: 24, bottom: 32, left: 16 }}
                        onMouseLeave={() => { hoveredTypeRef.current = null; setHoveredType(null); }}>
                        <CartesianGrid horizontal vertical={false} stroke="var(--card-border, #F0F0F0)" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--shell-text-muted)', fontFamily: 'Inter,system-ui' }} axisLine={false} tickLine={false} dy={8}
                          label={{ value: xLabel, position: 'insideBottom', offset: -16, style: { fontSize: 11, fill: 'var(--shell-text-muted)', fontFamily: 'Inter,system-ui' } }} />
                        <YAxis tick={{ fontSize: 11, fill: 'var(--shell-text-muted)', fontFamily: 'Inter,system-ui' }} axisLine={false} tickLine={false} width={52}
                          tickFormatter={yFmt}
                          label={{ value: yLabel, angle: -90, position: 'insideLeft', offset: 12, style: { fontSize: 11, fill: 'var(--shell-text-muted)', fontFamily: 'Inter,system-ui' } }} />
                        <Tooltip content={() => null} isAnimationActive={false} cursor={{ strokeWidth: 0 }} />
                        {TYPES.map(t => { const effectiveHL = selectedType !== null ? selectedType : hoveredType; const isActive = !effectiveHL || effectiveHL === t.label; return (
                          <Line key={t.label} type="monotone" dataKey={t.label} stroke={t.color} strokeWidth={2}
                            isAnimationActive={false}
                            strokeOpacity={isActive ? 1 : 0.2}
                            dot={(dotProps) => { const { cx, cy } = dotProps; return <circle key={`d-${t.label}-${cx}`} cx={cx} cy={cy} r={4} fill={t.color} strokeWidth={0} opacity={isActive ? 1 : 0.2} />; }}
                            activeDot={(dotProps) => {
                              const { cx, cy, value, payload } = dotProps;
                              const ttLabel = payload?.name;
                              const data = typeRangeDataRef.current ?? [];
                              const idx = data.findIndex(d => d.name === ttLabel);
                              const prev = idx > 0 ? data[idx - 1]?.[t.label] : null;
                              const pct = prev != null && prev > 0 ? (((value - prev) / prev) * 100).toFixed(2) : null;
                              return (
                                <circle key={`${t.label}-${cx}`} cx={cx} cy={cy} r={5} fill={t.color} strokeWidth={0} opacity={isActive ? 1 : 0.2}
                                  onMouseEnter={() => { hoveredTypeRef.current = t.label; setHoveredType(t.label); setTypeTooltipData({ key: t.label, label: ttLabel, value, color: t.color, pct }); }}
                                  onMouseLeave={() => { hoveredTypeRef.current = null; setHoveredType(null); setTypeTooltipData(null); }}
                                />
                              );
                            }}
                          />
                        ); })}
                      </LineChart>
                    ) : (
                      <AreaChart data={drawerData} margin={{ top: 16, right: 24, bottom: 32, left: 16 }}>
                        <defs>
                          <linearGradient id="drawerFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%"   stopColor="var(--pai-indigo)" stopOpacity={0.20} />
                            <stop offset="100%" stopColor="var(--pai-indigo)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid horizontal vertical={false} stroke="var(--card-border, #F0F0F0)" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--shell-text-muted)', fontFamily: 'Inter,system-ui' }} axisLine={false} tickLine={false} dy={8}
                          label={{ value: xLabel, position: 'insideBottom', offset: -16, style: { fontSize: 11, fill: 'var(--shell-text-muted)', fontFamily: 'Inter,system-ui' } }} />
                        <YAxis tick={{ fontSize: 11, fill: 'var(--shell-text-muted)', fontFamily: 'Inter,system-ui' }} axisLine={false} tickLine={false} width={52}
                          tickFormatter={yFmt}
                          label={{ value: yLabel, angle: -90, position: 'insideLeft', offset: 12, style: { fontSize: 11, fill: 'var(--shell-text-muted)', fontFamily: 'Inter,system-ui' } }} />
                        <Tooltip content={makeTrendTooltip(rawBaseData)} isAnimationActive={false} wrapperStyle={TIP_WRAP} cursor={false} />
                        <Area type="monotone" dataKey="value" name="Total" stroke="var(--pai-indigo)" strokeWidth={2} fill="url(#drawerFill)"
                          dot={{ r: 5, fill: 'var(--pai-indigo)', strokeWidth: 0 }} activeDot={{ r: 5, fill: 'var(--pai-indigo)', strokeWidth: 0 }} />
                      </AreaChart>
                    )}
                  </ResponsiveContainer>
                  {isTypeFilter ? (
                    <div className="dev-type-legend">
                      {TYPES.map(t => {
                        const f = typeRangeData[0]?.[t.label] ?? 0;
                        const l = typeRangeData[typeRangeData.length - 1]?.[t.label] ?? 0;
                        const pVal = f > 0 ? (((l - f) / f) * 100) : 0;
                        const up = pVal >= 0;
                        return (
                          <span
                            key={t.label}
                            className="dev-type-leg-item"
                            data-dimmed={selectedType && selectedType !== t.label ? 'true' : 'false'}
                            style={{ '--type-color': t.color }}
                            onClick={() => setSelectedType(prev => prev === t.label ? null : t.label)}
                          >
                            <span className="dev-type-leg-dot" />
                            <span className="dev-type-leg-label">{t.label}</span>
                            {!baselineView && (
                              <span className="dev-type-leg-trend">
                                {up ? <IcTrendUp size={12} color={t.color} /> : <IcTrendDown size={12} color={t.color} />}
                                <span className="dev-type-leg-pct">{Math.abs(pVal).toFixed(2)}%</span>
                              </span>
                            )}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="dev-single-legend">
                      <span className="dev-single-leg-dot" />
                      <span className="dev-single-leg-label">Total</span>
                      {!baselineView && (
                        <>
                          {isUp ? <IcTrendUp size={12} color="var(--pai-indigo)" /> : <IcTrendDown size={12} color="var(--pai-indigo)" />}
                          <span className="dev-single-leg-pct">{Math.abs(Number(trendPct)).toFixed(2)}%</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        );
      })()}
      {critTooltip !== null && (() => {
        const c = CRITICALITY[critTooltip.i];
        return (
          <div
            className="dev-crit-tooltip"
            style={{ '--crit-color': c.color, left: c.label === 'Low' ? critTooltip.x - 200 : critTooltip.x + 14, top: critTooltip.y - 64 }}
          >
            <div className="dev-crit-tooltip__title">{c.label}</div>
            <div className="dev-crit-tooltip__row">
              <span className="dev-crit-tooltip__label">Count</span>
              <span className="dev-crit-tooltip__value">{c.count}</span>
            </div>
            <div className="dev-crit-tooltip__row">
              <span className="dev-crit-tooltip__label">Percentage</span>
              <span className="dev-crit-tooltip__value">{c.pct.toFixed(2)}%</span>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
