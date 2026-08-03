import React, { useState, useCallback, useRef } from 'react'
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
  { name: 'MS Active Dire...', total: 59, corr: 24 },
  { name: 'MS Entra ID',       total: 38, corr: 15 },
  { name: 'Windows Securit...', total: 37, corr: 12 },
  { name: 'MS Intune',         total: 29, corr: 8  },
  { name: 'MS Defender',       total: 23, corr: 7  },
  { name: 'AWS IAM Center',    total: 1,  corr: 0  },
  { name: 'MS Azure',          total: 6,  corr: 3  },
  { name: 'Okta',              total: 4,  corr: 2  },
];

const TYPES = [
  { label: 'Non-Human', icon: 'non-human', count: 57687, pct: 80.75, color: 'var(--pai-indigo)' },
  { label: 'Human',     icon: 'human',     count: 13755, pct: 19.25, color: 'var(--pai-green)' },
];

const INSIGHTS = [
  { sev: 'high', text: 'Data uploads to personal cloud storage are restricted during the employment period',                          failPct: 100, cat: 'Behavioural Indicators' },
  { sev: 'high', text: 'Human identities are configured to require a password',                                                       failPct: 100, cat: 'Control Gap' },
  { sev: 'high', text: 'Human identities in Microsoft Entra ID have had their password rotated in the last 90 days',                 failPct: 100, cat: 'Control Gap' },
  { sev: 'high', text: 'Sensitive data is protected from unauthorized bulk access and exfiltration attempts',                         failPct: 100, cat: 'Behavioural Indicators' },
  { sev: 'high', text: 'Machine identities have MFA enabled',                                                                         failPct: 99,  failPctLabel: '>99%', cat: 'Control Gap' },
  { sev: 'high', text: 'Non-human accounts are scoped with least-privilege permissions',                                              failPct: 98,  cat: 'Control Gap' },
  { sev: 'high', text: 'Privileged identity accounts are protected with Privileged Identity Management',                              failPct: 96,  cat: 'Control Gap' },
  { sev: 'high', text: 'Service accounts have their credentials rotated on a regular schedule',                                       failPct: 95,  cat: 'Control Gap' },
  { sev: 'high', text: 'Dormant identities are reviewed and disabled after a defined inactivity period',                              failPct: 93,  cat: 'Control Gap' },
  { sev: 'high', text: 'External guest identities are reviewed and removed when access is no longer required',                        failPct: 91,  cat: 'Control Gap' },
  { sev: 'high', text: 'Conditional Access policies enforce device compliance for all identity sign-ins',                             failPct: 89,  cat: 'Control Gap' },
  { sev: 'high', text: 'Identity governance reviews are completed on a quarterly basis for privileged roles',                         failPct: 87,  cat: 'Control Gap' },
  { sev: 'high', text: 'Shared accounts are eliminated and replaced with individual identity assignments',                            failPct: 85,  cat: 'Control Gap' },
  { sev: 'high', text: 'Break-glass emergency accounts are monitored and alerts are configured for any usage',                       failPct: 83,  cat: 'Control Gap' },
  { sev: 'high', text: 'Identity risk policies are configured in Microsoft Entra ID Protection for high-risk sign-ins',               failPct: 81,  cat: 'Control Gap' },
  { sev: 'high', text: 'Application registrations in Entra ID are reviewed and unused apps are decommissioned',                      failPct: 79,  cat: 'Control Gap' },
  { sev: 'high', text: 'OAuth app permissions are reviewed and excessive consented scopes are revoked',                              failPct: 77,  cat: 'Behavioural Indicators' },
  { sev: 'high', text: 'Federated identity credentials are audited and unused federations are removed',                              failPct: 75,  cat: 'Control Gap' },
  { sev: 'high', text: 'Sign-in activity for non-human identities is monitored for anomalous patterns',                              failPct: 73,  cat: 'Behavioural Indicators' },
  { sev: 'high', text: 'Role assignments at the subscription scope are limited and regularly reviewed',                              failPct: 71,  cat: 'Control Gap' },
  { sev: 'high', text: 'Legacy authentication protocols are blocked via Conditional Access policies',                                 failPct: 69,  cat: 'Control Gap' },
  { sev: 'high', text: 'User accounts are protected with phishing-resistant MFA methods',                                            failPct: 67,  cat: 'Control Gap' },
  { sev: 'high', text: 'Cross-tenant access settings restrict collaboration to approved partner tenants only',                        failPct: 65,  cat: 'Control Gap' },
  { sev: 'high', text: 'Identity lifecycle is integrated with HR systems for automated provisioning and deprovisioning',              failPct: 63,  cat: 'Control Gap' },
  { sev: 'high', text: 'Named locations are defined and risky location-based sign-ins trigger step-up authentication',               failPct: 61,  cat: 'Behavioural Indicators' },
  { sev: 'high', text: 'Directory synchronization health is monitored and sync errors are resolved within SLA',                     failPct: 59,  cat: 'Control Gap' },
  { sev: 'high', text: 'Privileged access workstations are required for all Tier 0 identity administration tasks',                   failPct: 57,  cat: 'Control Gap' },
  { sev: 'high', text: 'Entra ID audit logs are exported to SIEM and retained for the required compliance period',                   failPct: 55,  cat: 'Control Gap' },
  { sev: 'high', text: 'Managed identities are used in place of service principals with client secrets where supported',             failPct: 53,  cat: 'Control Gap' },
];

const CRITICALITY = [
  { label: 'Critical', count: '27',     pct: 0.03,  color: 'var(--pai-crit-fg)'   },
  { label: 'High',     count: '178',    pct: 0.20,  color: 'var(--pai-red-high)'   },
  { label: 'Medium',   count: '84,137', pct: 96.63, color: 'var(--pai-med-fg)'      },
  { label: 'Low',      count: '2,731',  pct: 3.14,  color: 'var(--pai-green)'     },
];

const ASSETS = [
  { name: 'J.HARTWELL@ACMECORP.COM:...',   type: 'Entra ID Account', crit: 'Critical', score: 1000, isNew: true },
  { name: 'JAMES HARTWELL',                type: 'Human',            crit: 'Critical', score: 1000 },
  { name: 'S.MEHTA@ACMECORP.COM:OFF...',   type: 'Entra ID Account', crit: 'Critical', score: 1000, isNew: true },
  { name: 'J.HARTWELL@ACMECORP.COM:...',   type: 'Entra ID Account', crit: 'Critical', score: 1000 },
  { name: 'R.TORRES@ACMECORP.COM:...',     type: 'Entra ID Account', crit: 'Critical', score: 1000 },
];

// ── Chart data ────────────────────────────────────────────────────

const TYPES_PIE_DATA = TYPES.slice(0, 7).map(t => ({
  label: t.label,
  count: t.count.toLocaleString(),
  value: t.count,
  pct: t.pct <= 1 ? '<1%' : `${t.pct}%`,
  color: t.color,
}));

const TREND_DATA_BY_RANGE = {
  '1 W': [
    { name: '2 Aug',  value: 67471 },
    { name: '3 Aug',  value: 71500 },
    { name: '4 Aug',  value: 75000 },
    { name: '5 Aug',  value: 78500 },
    { name: '6 Aug',  value: 81500 },
    { name: '7 Aug',  value: 84500 },
    { name: '8 Aug',  value: 87073 },
  ],
  '1 M': [
    { name: '12 Jul', value: 55000 },
    { name: '19 Jul', value: 63000 },
    { name: '26 Jul', value: 72000 },
    { name: '2 Aug',  value: 80000 },
    { name: '8 Aug',  value: 87073 },
  ],
  '3 M': [
    { name: '18 May', value: 23000 },
    { name: '25 May', value: 28000 },
    { name: '1 Jun',  value: 33000 },
    { name: '8 Jun',  value: 38000 },
    { name: '15 Jun', value: 43000 },
    { name: '22 Jun', value: 49000 },
    { name: '29 Jun', value: 55000 },
    { name: '6 Jul',  value: 61000 },
    { name: '13 Jul', value: 67000 },
    { name: '20 Jul', value: 73000 },
    { name: '27 Jul', value: 79000 },
    { name: '3 Aug',  value: 84000 },
    { name: '8 Aug',  value: 87073 },
  ],
  '6 M': [
    { name: '8 Feb',  value: 8000  },
    { name: '8 Mar',  value: 16000 },
    { name: '8 Apr',  value: 29000 },
    { name: '8 May',  value: 45000 },
    { name: '8 Jun',  value: 61000 },
    { name: '8 Jul',  value: 76000 },
    { name: '8 Aug',  value: 87073 },
  ],
  '1 Y': [
    { name: '1 Sep',  value: 2500  },
    { name: '1 Oct',  value: 4000  },
    { name: '1 Nov',  value: 6500  },
    { name: '1 Dec',  value: 10000 },
    { name: '1 Jan',  value: 15000 },
    { name: '1 Feb',  value: 22000 },
    { name: '1 Mar',  value: 31000 },
    { name: '1 Apr',  value: 44000 },
    { name: '1 May',  value: 57000 },
    { name: '1 Jun',  value: 68000 },
    { name: '1 Jul',  value: 79000 },
    { name: '8 Aug',  value: 87073 },
  ],
};

const SOURCES_CHART_DATA = SOURCES.map(s => ({
  name: s.name,
  Unique: s.total - s.corr,
  Corroborated: s.corr,
}));

const TYPE_TREND_DATA_BY_RANGE = {
  '1 W': [
    { name: '2 Aug',  'Non-Human': 54503, Human: 12968 },
    { name: '3 Aug',  'Non-Human': 57735, Human: 13765 },
    { name: '4 Aug',  'Non-Human': 60563, Human: 14438 },
    { name: '5 Aug',  'Non-Human': 63404, Human: 15096 },
    { name: '6 Aug',  'Non-Human': 65856, Human: 15644 },
    { name: '7 Aug',  'Non-Human': 68248, Human: 16252 },
    { name: '8 Aug',  'Non-Human': 70312, Human: 16761 },
  ],
  '1 M': [
    { name: '12 Jul', 'Non-Human': 44413, Human: 10588 },
    { name: '19 Jul', 'Non-Human': 50873, Human: 12128 },
    { name: '26 Jul', 'Non-Human': 58140, Human: 13860 },
    { name: '2 Aug',  'Non-Human': 64600, Human: 15400 },
    { name: '8 Aug',  'Non-Human': 70312, Human: 16761 },
  ],
  '3 M': [
    { name: '18 May', 'Non-Human': 18573, Human: 4428 },
    { name: '25 May', 'Non-Human': 22610, Human: 5390 },
    { name: '1 Jun',  'Non-Human': 26648, Human: 6352 },
    { name: '8 Jun',  'Non-Human': 30685, Human: 7315 },
    { name: '15 Jun', 'Non-Human': 34723, Human: 8278 },
    { name: '22 Jun', 'Non-Human': 39568, Human: 9432 },
    { name: '29 Jun', 'Non-Human': 44413, Human: 10588 },
    { name: '6 Jul',  'Non-Human': 49258, Human: 11742 },
    { name: '13 Jul', 'Non-Human': 54103, Human: 12898 },
    { name: '20 Jul', 'Non-Human': 58948, Human: 14053 },
    { name: '27 Jul', 'Non-Human': 63793, Human: 15207 },
    { name: '3 Aug',  'Non-Human': 67831, Human: 16169 },
    { name: '8 Aug',  'Non-Human': 70312, Human: 16761 },
  ],
  '6 M': [
    { name: '8 Feb',  'Non-Human':  6460, Human:  1540 },
    { name: '8 Mar',  'Non-Human': 12920, Human:  3080 },
    { name: '8 Apr',  'Non-Human': 23435, Human:  5565 },
    { name: '8 May',  'Non-Human': 36338, Human:  8663 },
    { name: '8 Jun',  'Non-Human': 49258, Human: 11742 },
    { name: '8 Jul',  'Non-Human': 61390, Human: 14610 },
    { name: '8 Aug',  'Non-Human': 70312, Human: 16761 },
  ],
  '1 Y': [
    { name: '1 Sep',  'Non-Human':  2019, Human:   481 },
    { name: '1 Oct',  'Non-Human':  3230, Human:   770 },
    { name: '1 Nov',  'Non-Human':  5249, Human:  1251 },
    { name: '1 Dec',  'Non-Human':  8075, Human:  1925 },
    { name: '1 Jan',  'Non-Human': 12113, Human:  2888 },
    { name: '1 Feb',  'Non-Human': 17765, Human:  4234 },
    { name: '1 Mar',  'Non-Human': 25033, Human:  5967 },
    { name: '1 Apr',  'Non-Human': 35530, Human:  8470 },
    { name: '1 May',  'Non-Human': 46028, Human: 10972 },
    { name: '1 Jun',  'Non-Human': 54928, Human: 13073 },
    { name: '1 Jul',  'Non-Human': 63828, Human: 15173 },
    { name: '8 Aug',  'Non-Human': 70312, Human: 16761 },
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
const IcExplore = () => <img src="assets/icons/icon-explore.svg" width="12" height="12" alt="" />;
const IcNewlyAdded = () => (
  <svg width="10" height="10" viewBox="0 0 8.99512 8.98682" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <path d="M0.5 8.48682H5.48074"/><path d="M8.49512 0.5L8.49512 5.48074"/><path d="M2.49414 2.51758L6.46736 6.4908"/>
  </svg>
);

// Type icon inline SVGs
const TYPE_ICONS = {
  'empty':       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" strokeDasharray="3 3"/></svg>,
  'non-human':   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M9 11V7a3 3 0 0 1 6 0v4"/><circle cx="12" cy="16" r="1" fill="currentColor" stroke="none"/><path d="M8 11V8"/><path d="M16 11V8"/></svg>,
  'human':       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  'win-account': <svg width="14" height="14" viewBox="0 0 88 88" fill="none"><path d="M0 12.4L36.1 7.4V43H0V12.4z" fill="currentColor"/><path d="M40.6 6.7L88 0v43H40.6V6.7z" fill="currentColor"/><path d="M0 47h36.1v35.6l-36.1-5V47z" fill="currentColor"/><path d="M40.6 47H88v41L40.6 81.3V47z" fill="currentColor"/></svg>,
  'entra':       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>,
  'permanent':   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>,
  'aws-iam':     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  'contractor':  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>,
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

// ── Page ──────────────────────────────────────────────────────────

export default function DiscoverIdentityPage() {
  const [timeRange,     setTimeRange]     = useState('1 M');
  const [insightSearch, setInsightSearch] = useState('');
  const [assetSearch,   setAssetSearch]   = useState('');
  const [newOnly,       setNewOnly]       = useState(false);
  const assetsSectionRef = useRef(null);
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

  const SourceTooltip = useCallback(({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const entry = payload.find(e => e.dataKey === hoveredBarRef.current) || payload[0];
    const total = payload.reduce((sum, e) => sum + (e.value || 0), 0);
    const pct = total > 0 ? ((entry.value / total) * 100).toFixed(2) : '0.00';
    const color = entry.fill;
    return (
      <div className="dev-tip-card dev-tip-card--lg" style={{ '--tip-border': color }}>
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
      </div>
    );
  }, []);

  const filteredInsights = INSIGHTS.filter(r =>
    r.text.toLowerCase().includes(insightSearch.toLowerCase())
  );
  const filteredAssets = ASSETS.filter(r =>
    r.name.toLowerCase().includes(assetSearch.toLowerCase()) && (!newOnly || r.isNew)
  );
  const newAssetCount = ASSETS.filter(r => r.isNew).length;

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
          <div className="card dev-card">
            <div className="dev-stat-header">
              <div className="dev-stat-title-row">
                <span className="dev-stat-label">Total</span>
                <button
                  type="button"
                  className={`dev-newly-added${newOnly ? ' dev-newly-added--active' : ''}`}
                  title="Show only newly added identities"
                  onClick={() => {
                    setNewOnly(v => !v)
                    setAssetPage(1)
                    assetsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }}
                >
                  <IcNewlyAdded />
                  <span>115 Newly Added</span>
                </button>
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
                <div className="dev-stat-value">87,073</div>
                <div className="dev-stat-meta">
                  <IcTrendUp size={13} color="var(--pai-crit-fg)" />
                  <span className="dev-stat-change up">29.05%</span>
                  <span className="dev-stat-from">from last week</span>
                </div>
              </div>
            </div>

            <div className="dev-chart-area">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={currentTrendData} margin={{ top: 16, right: 16, bottom: 0, left: 8 }}>
                  <defs>
                    <linearGradient id="trendFillId" x1="0" y1="0" x2="0" y2="1">
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
                    fill="url(#trendFillId)"
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
            <div className="card dev-card dev-source-card">
              <div className="dev-card-title">Data Source</div>
              <div className="dev-chart-fill">
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
                    <Bar dataKey="Corroborated" stackId="a" fill="var(--pai-chart-teal)" radius={[2, 0, 0, 2]} onMouseEnter={() => { hoveredBarRef.current = 'Corroborated'; }} onMouseLeave={() => { hoveredBarRef.current = null; }} />
                    <Bar
                      dataKey="Unique"
                      stackId="a"
                      fill="var(--pai-chart-purple)"
                      radius={[0, 2, 2, 0]}
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

            {/* Type + Donut */}
            <div className="card dev-card dev-type-card">
              <div className="dev-card-title">Type</div>
              <div className="dev-donut-wrap dev-donut-wrap--fixed">
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
                    <Tooltip content={DonutTooltip} isAnimationActive={false} wrapperStyle={TIP_WRAP} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="dev-donut-center">
                  <div className="dev-donut-center__label">Total</div>
                  <div className="dev-donut-center__value dev-donut-center__value--sm">71,442</div>
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
                      <span className="dev-type-pct">{t.pct < 1 ? '<1%' : `${t.pct}%`}</span>
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
          <div className="card dev-card dev-insights-card">
            <div className="dev-card-hdr">
              <span className="dev-card-title">Key Security Insights</span>
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
                          <span className="dev-findings-bar__pct">{r.failPctLabel || `${r.failPct}%`}</span>
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
              total={filteredInsights.length || 29}
              page={insightPage}
              rowsPerPage={5}
              onPageChange={setInsightPage}
              onRowsPerPageChange={n => { setRowsPer(n); setInsightPage(1); }}
            />
          </div>

          {/* Criticality */}
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
                      <span className="dev-crit-leg-pct">{c.pct < 1 ? '<1%' : `${c.pct.toFixed(2)}%`}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div ref={assetsSectionRef} className="dev-asset-hdr">
              <div className="dev-asset-hdr-left">
                <span className="dev-card-title">Assets by Criticality Score</span>
                {newOnly && (
                  <span className="dev-asset-filter-note">
                    Showing {newAssetCount} newly added identit{newAssetCount === 1 ? 'y' : 'ies'}
                    <button type="button" className="dev-asset-filter-clear" onClick={() => setNewOnly(false)}>Clear</button>
                  </span>
                )}
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
                    <TH>Asset Criticality</TH>
                    <TH>Asset Criticality Score</TH>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.slice((assetPage-1)*10, assetPage*10).map((a, i) => (
                    <tr key={i}>
                      <td className="ds-td dev-td-name">
                        {a.name}
                        {a.isNew && <span className="dev-td-new-badge">New</span>}
                      </td>
                      <td className="ds-td">{a.type}</td>
                      <td className="ds-td"><span className="pai-chip pai-chip--crit">{a.crit}</span></td>
                      <td className="ds-td dev-td-score">{a.score.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <TablePagination
              total={87073}
              page={assetPage}
              rowsPerPage={5}
              onPageChange={setAssetPage}
              onRowsPerPageChange={() => {}}
            />
          </div>

        </div>
      </div>

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
                    options={['All','Type','Origin','Authentication Type','MFA Status','Risk Level']}
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
                          <linearGradient id="drawerFillId" x1="0" y1="0" x2="0" y2="1">
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
                        <Area type="monotone" dataKey="value" name="Total" stroke="var(--pai-indigo)" strokeWidth={2} fill="url(#drawerFillId)"
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
        const pctLabel = c.pct < 1 ? '<1%' : `${c.pct.toFixed(2)}%`;
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
              <span className="dev-crit-tooltip__value">{pctLabel}</span>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
