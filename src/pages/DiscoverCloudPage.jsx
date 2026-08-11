import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { AreaChart, Area, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import TablePagination from '../components/TablePagination.jsx'
import { DSPillSearch } from '../context/WorkspaceCtx.jsx'
import { AssessmentDrawer } from './CompliancePage.jsx'
import AssetDetailDrawer from '../components/AssetDetailDrawer.jsx'
import { useChartFilters } from '../hooks/useChartFilters.js'
import { useDropdownExit } from '../hooks/useDropdownExit.js'
import { makeDiscoverRecords, aggregateBySource, aggregateByType, aggregateByCriticality, fakeAssessmentId } from '../data/discoverRecords.js'
import '../styles/device.css'
import '../styles/compliance.css'
import '../styles/dashboard.css'
import '../styles/kg.css'

// ── Group-by select dropdown (comp-sort pattern, matches other dashboards) ──
const IcChevron = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6"/>
  </svg>
);
function SelectDropdown({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { visible, closing } = useDropdownExit(open);

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
      {visible && (
        <div className={`comp-sort-menu comp-sort-menu--right${closing ? ' comp-sort-menu--closing' : ''}`}>
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
          <span>Total</span>
          <span className="dev-tip-accent">{value.toLocaleString()}</span>
        </div>
        {pct && (
          <div className="dev-tip-trend">
            {isUp
              ? <span className="dev-tip-trend-up">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                  <span>{Math.abs(pct)}%</span>
                </span>
              : <span className="dev-tip-trend-down">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>
                  <span>{Math.abs(pct)}%</span>
                </span>
            }
            from last week
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
  { name: 'AWS',         total: 55, corr: 0  },
  { name: 'Wiz',         total: 41, corr: 15 },
  { name: 'Qualys',      total: 29, corr: 20 },
  { name: 'MS Intune',   total: 13, corr: 10 },
  { name: 'MS Azure AD', total: 13, corr: 10 },
  { name: 'MS Azure',    total: 8,  corr: 5  },
  { name: 'MS Defender', total: 6,  corr: 4  },
  { name: 'Tenable',     total: 4,  corr: 2  },
];

const TYPES = [
  { label: 'Volume',                 icon: 'volume',      count: 5423, pct: 46,  color: 'var(--pai-indigo)'       },
  { label: 'Workstation',            icon: 'workstation', count: 4922, pct: 42,  color: '#5BADB8'                 },
  { label: 'Server',                 icon: 'server',      count: 381,  pct: 3,   color: 'var(--pai-green)'        },
  { label: 'Kubernetes Container',   icon: 'k8s',         count: 353,  pct: 3,   color: 'var(--pai-high-fg)'      },
  { label: 'Security Group',         icon: 'secgroup',    count: 224,  pct: 2,   color: 'var(--pai-red-high)'     },
  { label: 'Compute Instance Group', icon: 'compute',     count: 153,  pct: 1,   color: 'var(--pai-indigo-muted)' },
  { label: 'Serverless',             icon: 'serverless',  count: 66,   pct: 1,   color: '#C4C4C4'                 },
];

// Compliance score thresholds mirrored from AssessmentDrawer's rating tooltip copy
function ratingFromPct(pct) {
  if (pct >= 100) return 'Compliant';
  if (pct > 75) return 'Strong';
  if (pct > 50) return 'Moderate';
  return 'Weak';
}
const SEV_TO_CRITICALITY = { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' };
function insightToAssessmentNode(r, i) {
  const pct = 100 - r.failPct;
  return {
    id: `insight_${i}`,
    name: r.text,
    pct,
    open: r.failPct,
    closed: Math.max(0, 100 - r.failPct),
    rating: ratingFromPct(pct),
    criticality: SEV_TO_CRITICALITY[r.sev] || 'Medium',
    scopeType: 'cloud',
    scopeLabel: 'Cloud Resource',
    isLeaf: true,
  };
}

const INSIGHTS = [
  { sev: 'high', text: 'Adaptive application controls for defining safe applications should be configured on your machines',           failPct: 100, cat: 'Control Gap' },
  { sev: 'high', text: 'Adaptive network hardening recommendations should be applied on internet facing virtual machines',             failPct: 100, cat: 'Control Gap' },
  { sev: 'high', text: 'All network ports should be restricted on network security groups associated to your virtual machine',         failPct: 100, cat: 'Control Gap' },
  { sev: 'high', text: 'Allowlist rules in your adaptive application control policy should be updated',                                failPct: 100, cat: 'Control Gap' },
  { sev: 'high', text: 'Amazon EC2 should be configured to use VPC endpoints that are created for the Amazon EC2 service',            failPct: 100, cat: 'Control Gap' },
  { sev: 'high', text: 'Auto scaling groups associated with a load balancer should use load balancer health checks',                   failPct: 98,  cat: 'Control Gap' },
  { sev: 'high', text: 'CloudTrail should be enabled and configured with at least one multi-Region trail',                            failPct: 96,  cat: 'Control Gap' },
  { sev: 'high', text: 'EBS default encryption should be enabled',                                                                    failPct: 94,  cat: 'Control Gap' },
  { sev: 'high', text: 'EC2 instances should not have a public IPv4 address',                                                          failPct: 91,  cat: 'Control Gap' },
  { sev: 'high', text: 'Ensure IAM password policy requires at least one uppercase letter',                                            failPct: 88,  cat: 'Control Gap' },
];

const CRITICALITY = [
  { label: 'Critical', count: '750',   pct: 6.38,  color: 'var(--pai-crit-fg)'   },
  { label: 'High',     count: '3,560', pct: 30.26, color: 'var(--pai-red-high)'   },
  { label: 'Medium',   count: '4,188', pct: 35.60, color: 'var(--pai-med-fg)'      },
  { label: 'Low',      count: '3,265', pct: 27.76, color: 'var(--pai-green)'     },
];

const ASSETS = [
  { name: 'DATA-TRANSFORMATION-PL...', type: 'Kubernetes Container', crit: 'Critical', score: 1000, isNew: true },
  { name: 'UI-COMPONENT-LIBRARY-V3',   type: 'Kubernetes Container', crit: 'Critical', score: 1000 },
  { name: 'CONTENT-FILTERING-SERVIC...', type: 'Kubernetes Container', crit: 'Critical', score: 1000, isNew: true },
  { name: 'ML-EXPERIMENT-TRACKING-V1',  type: 'Kubernetes Container', crit: 'Critical', score: 1000 },
  { name: 'WEB-UI-DESIGN-SYSTEM-V1',    type: 'Kubernetes Container', crit: 'Critical', score: 1000 },
];

// ── Single-assessment filtered snapshot (all widgets scope to just the one
// assessment picked via the Key Security Insights row's filter icon) ───────
const FILTERED_SOURCES_CHART_DATA = [{ name: 'AWS', Unique: 100, Corroborated: 0 }];
const FILTERED_TYPES_DATA = [{ label: 'Server', icon: 'server', count: 1, pct: 100, color: 'var(--pai-indigo)' }];
const FILTERED_CRITICALITY = [{ label: 'Medium', count: '1', pct: 100, color: 'var(--pai-med-fg)' }];
const FILTERED_ASSET = { name: 'K8S-PFSENSE-IN-CE', type: 'Kubernetes Container', crit: 'Medium', score: 382 };

// ── Chart data ────────────────────────────────────────────────────

const TREND_DATA_BY_RANGE = {
  '1 W': [
    { name: '2 Aug',  value: 11200 },
    { name: '3 Aug',  value: 11350 },
    { name: '4 Aug',  value: 11460 },
    { name: '5 Aug',  value: 11560 },
    { name: '6 Aug',  value: 11640 },
    { name: '7 Aug',  value: 11700 },
    { name: '8 Aug',  value: 11763 },
  ],
  '1 M': [
    { name: '12 Jul', value: 9800  },
    { name: '19 Jul', value: 10400 },
    { name: '26 Jul', value: 11000 },
    { name: '2 Aug',  value: 11450 },
    { name: '8 Aug',  value: 11763 },
  ],
  '3 M': [
    { name: '18 May', value: 4800  },
    { name: '25 May', value: 5600  },
    { name: '1 Jun',  value: 6400  },
    { name: '8 Jun',  value: 7200  },
    { name: '15 Jun', value: 7900  },
    { name: '22 Jun', value: 8600  },
    { name: '29 Jun', value: 9200  },
    { name: '6 Jul',  value: 9700  },
    { name: '13 Jul', value: 10200 },
    { name: '20 Jul', value: 10700 },
    { name: '27 Jul', value: 11100 },
    { name: '3 Aug',  value: 11500 },
    { name: '8 Aug',  value: 11763 },
  ],
  '6 M': [
    { name: '8 Feb',  value: 3200  },
    { name: '8 Mar',  value: 4800  },
    { name: '8 Apr',  value: 6400  },
    { name: '8 May',  value: 7800  },
    { name: '8 Jun',  value: 9200  },
    { name: '8 Jul',  value: 10600 },
    { name: '8 Aug',  value: 11763 },
  ],
  '1 Y': [
    { name: '1 Sep',  value: 800   },
    { name: '1 Oct',  value: 1200  },
    { name: '1 Nov',  value: 1800  },
    { name: '1 Dec',  value: 2500  },
    { name: '1 Jan',  value: 3400  },
    { name: '1 Feb',  value: 4400  },
    { name: '1 Mar',  value: 5600  },
    { name: '1 Apr',  value: 7000  },
    { name: '1 May',  value: 8400  },
    { name: '1 Jun',  value: 9800  },
    { name: '1 Jul',  value: 11000 },
    { name: '8 Aug',  value: 11763 },
  ],
};

const TYPE_TREND_DATA_BY_RANGE = {
  '1 W': [
    { name: '2 Aug',  Volume: 5353, Workstation: 4852, Server: 374, 'Kubernetes Container': 346, 'Security Group': 219, 'Compute Instance Group': 149, Serverless: 64 },
    { name: '3 Aug',  Volume: 5368, Workstation: 4868, Server: 376, 'Kubernetes Container': 348, 'Security Group': 220, 'Compute Instance Group': 150, Serverless: 65 },
    { name: '4 Aug',  Volume: 5381, Workstation: 4882, Server: 377, 'Kubernetes Container': 349, 'Security Group': 221, 'Compute Instance Group': 151, Serverless: 65 },
    { name: '5 Aug',  Volume: 5393, Workstation: 4895, Server: 378, 'Kubernetes Container': 350, 'Security Group': 222, 'Compute Instance Group': 151, Serverless: 65 },
    { name: '6 Aug',  Volume: 5403, Workstation: 4906, Server: 379, 'Kubernetes Container': 351, 'Security Group': 222, 'Compute Instance Group': 152, Serverless: 65 },
    { name: '7 Aug',  Volume: 5414, Workstation: 4915, Server: 380, 'Kubernetes Container': 352, 'Security Group': 223, 'Compute Instance Group': 152, Serverless: 66 },
    { name: '8 Aug',  Volume: 5423, Workstation: 4922, Server: 381, 'Kubernetes Container': 353, 'Security Group': 224, 'Compute Instance Group': 153, Serverless: 66 },
  ],
  '1 M': [
    { name: '12 Jul', Volume: 4520, Workstation: 4100, Server: 317, 'Kubernetes Container': 294, 'Security Group': 186, 'Compute Instance Group': 127, Serverless: 55 },
    { name: '19 Jul', Volume: 4820, Workstation: 4370, Server: 338, 'Kubernetes Container': 313, 'Security Group': 198, 'Compute Instance Group': 135, Serverless: 58 },
    { name: '26 Jul', Volume: 5100, Workstation: 4625, Server: 358, 'Kubernetes Container': 332, 'Security Group': 210, 'Compute Instance Group': 143, Serverless: 62 },
    { name: '2 Aug',  Volume: 5290, Workstation: 4800, Server: 370, 'Kubernetes Container': 343, 'Security Group': 217, 'Compute Instance Group': 148, Serverless: 64 },
    { name: '8 Aug',  Volume: 5423, Workstation: 4922, Server: 381, 'Kubernetes Container': 353, 'Security Group': 224, 'Compute Instance Group': 153, Serverless: 66 },
  ],
  '3 M': [
    { name: '18 May', Volume: 2215, Workstation: 2009, Server: 155, 'Kubernetes Container': 144, 'Security Group':  91, 'Compute Instance Group':  62, Serverless: 27 },
    { name: '25 May', Volume: 2584, Workstation: 2343, Server: 181, 'Kubernetes Container': 168, 'Security Group': 106, 'Compute Instance Group':  72, Serverless: 31 },
    { name: '1 Jun',  Volume: 2952, Workstation: 2678, Server: 207, 'Kubernetes Container': 192, 'Security Group': 121, 'Compute Instance Group':  83, Serverless: 36 },
    { name: '8 Jun',  Volume: 3321, Workstation: 3012, Server: 233, 'Kubernetes Container': 216, 'Security Group': 136, 'Compute Instance Group':  93, Serverless: 40 },
    { name: '15 Jun', Volume: 3644, Workstation: 3306, Server: 255, 'Kubernetes Container': 236, 'Security Group': 150, 'Compute Instance Group': 102, Serverless: 44 },
    { name: '22 Jun', Volume: 3967, Workstation: 3598, Server: 278, 'Kubernetes Container': 258, 'Security Group': 163, 'Compute Instance Group': 111, Serverless: 48 },
    { name: '29 Jun', Volume: 4243, Workstation: 3850, Server: 297, 'Kubernetes Container': 275, 'Security Group': 174, 'Compute Instance Group': 119, Serverless: 51 },
    { name: '6 Jul',  Volume: 4474, Workstation: 4060, Server: 313, 'Kubernetes Container': 290, 'Security Group': 184, 'Compute Instance Group': 126, Serverless: 54 },
    { name: '13 Jul', Volume: 4705, Workstation: 4270, Server: 330, 'Kubernetes Container': 306, 'Security Group': 194, 'Compute Instance Group': 132, Serverless: 57 },
    { name: '20 Jul', Volume: 4936, Workstation: 4478, Server: 346, 'Kubernetes Container': 321, 'Security Group': 203, 'Compute Instance Group': 138, Serverless: 59 },
    { name: '27 Jul', Volume: 5121, Workstation: 4647, Server: 359, 'Kubernetes Container': 333, 'Security Group': 211, 'Compute Instance Group': 144, Serverless: 62 },
    { name: '3 Aug',  Volume: 5307, Workstation: 4815, Server: 372, 'Kubernetes Container': 345, 'Security Group': 218, 'Compute Instance Group': 149, Serverless: 65 },
    { name: '8 Aug',  Volume: 5423, Workstation: 4922, Server: 381, 'Kubernetes Container': 353, 'Security Group': 224, 'Compute Instance Group': 153, Serverless: 66 },
  ],
  '6 M': [
    { name: '8 Feb',  Volume: 1476, Workstation: 1340, Server: 103, 'Kubernetes Container':  96, 'Security Group':  61, 'Compute Instance Group':  41, Serverless: 18 },
    { name: '8 Mar',  Volume: 2215, Workstation: 2010, Server: 155, 'Kubernetes Container': 144, 'Security Group':  91, 'Compute Instance Group':  62, Serverless: 27 },
    { name: '8 Apr',  Volume: 2952, Workstation: 2678, Server: 207, 'Kubernetes Container': 192, 'Security Group': 121, 'Compute Instance Group':  83, Serverless: 36 },
    { name: '8 May',  Volume: 3598, Workstation: 3265, Server: 252, 'Kubernetes Container': 234, 'Security Group': 148, 'Compute Instance Group': 101, Serverless: 44 },
    { name: '8 Jun',  Volume: 4243, Workstation: 3850, Server: 297, 'Kubernetes Container': 275, 'Security Group': 174, 'Compute Instance Group': 119, Serverless: 51 },
    { name: '8 Jul',  Volume: 4889, Workstation: 4436, Server: 343, 'Kubernetes Container': 318, 'Security Group': 201, 'Compute Instance Group': 137, Serverless: 59 },
    { name: '8 Aug',  Volume: 5423, Workstation: 4922, Server: 381, 'Kubernetes Container': 353, 'Security Group': 224, 'Compute Instance Group': 153, Serverless: 66 },
  ],
  '1 Y': [
    { name: '1 Sep',  Volume:  369, Workstation:  335, Server:  26, 'Kubernetes Container':  24, 'Security Group':  15, 'Compute Instance Group':  10, Serverless:  4 },
    { name: '1 Oct',  Volume:  554, Workstation:  503, Server:  39, 'Kubernetes Container':  36, 'Security Group':  23, 'Compute Instance Group':  16, Serverless:  7 },
    { name: '1 Nov',  Volume:  831, Workstation:  754, Server:  58, 'Kubernetes Container':  54, 'Security Group':  34, 'Compute Instance Group':  23, Serverless: 10 },
    { name: '1 Dec',  Volume: 1153, Workstation: 1047, Server:  81, 'Kubernetes Container':  75, 'Security Group':  47, 'Compute Instance Group':  32, Serverless: 14 },
    { name: '1 Jan',  Volume: 1569, Workstation: 1424, Server: 110, 'Kubernetes Container': 102, 'Security Group':  64, 'Compute Instance Group':  44, Serverless: 19 },
    { name: '1 Feb',  Volume: 2031, Workstation: 1843, Server: 142, 'Kubernetes Container': 132, 'Security Group':  83, 'Compute Instance Group':  57, Serverless: 25 },
    { name: '1 Mar',  Volume: 2584, Workstation: 2345, Server: 181, 'Kubernetes Container': 168, 'Security Group': 106, 'Compute Instance Group':  72, Serverless: 31 },
    { name: '1 Apr',  Volume: 3229, Workstation: 2930, Server: 226, 'Kubernetes Container': 210, 'Security Group': 133, 'Compute Instance Group':  90, Serverless: 39 },
    { name: '1 May',  Volume: 3875, Workstation: 3515, Server: 271, 'Kubernetes Container': 252, 'Security Group': 159, 'Compute Instance Group': 109, Serverless: 47 },
    { name: '1 Jun',  Volume: 4520, Workstation: 4100, Server: 317, 'Kubernetes Container': 294, 'Security Group': 186, 'Compute Instance Group': 127, Serverless: 55 },
    { name: '1 Jul',  Volume: 5073, Workstation: 4603, Server: 355, 'Kubernetes Container': 329, 'Security Group': 209, 'Compute Instance Group': 143, Serverless: 62 },
    { name: '8 Aug',  Volume: 5423, Workstation: 4922, Server: 381, 'Kubernetes Container': 353, 'Security Group': 224, 'Compute Instance Group': 153, Serverless: 66 },
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
const IcExplore = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3.72222 13.5C3.39807 13.5 3.08719 13.3712 2.85798 13.142C2.62877 12.9128 2.5 12.6019 2.5 12.2778V8H6.00379C7.1092 8 8.00498 8.89675 8.00379 10.0022L8 13.5H3.72222Z" fill="currentColor"/>
    <path d="M13.5 9.34636V12.2778C13.5 12.6019 13.3712 12.9128 13.142 13.142C12.9128 13.3712 12.6019 13.5 12.2778 13.5H8M6.69508 2.5H3.72222C3.39807 2.5 3.08719 2.62877 2.85798 2.85798C2.62877 3.08719 2.5 3.39807 2.5 3.72222V8M13.5 2.5L9.36629 6.63371M13.5 6.62568V2.5H9.36629M2.5 8V12.2778C2.5 12.6019 2.62877 12.9128 2.85798 13.142C3.08719 13.3712 3.39807 13.5 3.72222 13.5H8M2.5 8H6.00379C7.1092 8 8.00498 8.89675 8.00379 10.0022L8 13.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IcNewlyAdded = () => (
  <svg width="10" height="10" viewBox="0 0 8.99512 8.98682" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <path d="M0.5 8.48682H5.48074"/><path d="M8.49512 0.5L8.49512 5.48074"/><path d="M2.49414 2.51758L6.46736 6.4908"/>
  </svg>
);

// Type icon inline SVGs
const TYPE_ICONS = {
  server:      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><circle cx="7" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="7" cy="18" r="1" fill="currentColor" stroke="none"/></svg>,
  workstation: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>,
  volume:      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  k8s:         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><circle cx="12" cy="14" r="2"/></svg>,
  secgroup:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  compute:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2"/></svg>,
  serverless:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
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

const IcInsightFilter = () => (
  <svg width="18" height="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.91113 5.25H13.089M4.60744 8.64262H11.3927M6.64301 12.0352H9.35711" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10.4072 2.375C12.1844 2.375 13.625 3.81565 13.625 5.59277C13.625 7.3699 12.1844 8.81055 10.4072 8.81055C8.6301 8.81055 7.18945 7.3699 7.18945 5.59277C7.18945 3.81565 8.6301 2.375 10.4072 2.375Z" fill="currentColor" stroke="var(--card-bg, #fff)" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9.02637 5.59277H11.788" stroke="var(--card-bg, #fff)" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10.4072 4.21198V6.97358" stroke="var(--card-bg, #fff)" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ── Page ──────────────────────────────────────────────────────────

export default function DiscoverCloudPage({ onNav, crossFilters = [], onToggleFilter } = {}) {
  const [timeRange,     setTimeRange]     = useState('1 Y');
  const [insightSearch, setInsightSearch] = useState('');
  const [assetSearch,   setAssetSearch]   = useState('');
  const [newOnly,       setNewOnly]       = useState(false);
  const assetsSectionRef = useRef(null);
  const [insightPage,   setInsightPage]   = useState(1);
  const [assetPage,     setAssetPage]     = useState(1);
  const [rowsPer,       setRowsPer]       = useState(10);
  const [hoveredCrit,   setHoveredCrit]   = useState(null);
  const [critTooltip,   setCritTooltip]   = useState(null);
  const [insightDrawerNode, setInsightDrawerNode] = useState(null);
  const [assetDrawer, setAssetDrawer] = useState(null);
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
  const [hoveredType,      setHoveredType]      = useState(null);
  const [selectedType,     setSelectedType]     = useState(null);
  const [drawerTooltipPos, setDrawerTooltipPos] = useState({ x: 0, y: 0 });
  const [typeTooltipData,  setTypeTooltipData]  = useState(null);
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

  // Real per-record population every widget below recomputes from — replaces the old
  // single-scenario "isFiltered" canned snapshot, which couldn't represent arbitrary or
  // stacking chart filters (only ever one fixed fake result).
  const records = useMemo(() => makeDiscoverRecords({
    key: 'cloud', count: 240, sources: SOURCES, types: TYPES, criticalities: CRITICALITY, insights: INSIGHTS, namePrefix: 'CLD-RES',
  }), []);
  const { matches } = useChartFilters(crossFilters);
  const RECORD_FIELDS = {
    'data-source':              r => r.source,
    'origin-contribution-type': r => r.corrType,
    'type-host':                r => r.type,
    'asset-criticality':        r => r.criticality,
    'assessment-id':            r => r.assessmentId,
  };
  const filteredRecords = records.filter(r => matches(r, RECORD_FIELDS));

  const toggleAssessmentFilter = (r) => {
    onToggleFilter?.([{ attrId: 'assessment-id', key: 'Assessment ID', value: fakeAssessmentId(r.text) }]);
    setInsightPage(1);
    setAssetPage(1);
  };

  const activeAssessmentIds = new Set(crossFilters.filter(c => c.attrId === 'assessment-id').map(c => c.value));
  const filteredInsights = INSIGHTS.filter(r =>
    (activeAssessmentIds.size === 0 || activeAssessmentIds.has(fakeAssessmentId(r.text))) &&
    r.text.toLowerCase().includes(insightSearch.toLowerCase())
  );
  const filteredAssets = [...filteredRecords]
    .sort((a, b) => b.score - a.score)
    .filter(a => a.name.toLowerCase().includes(assetSearch.toLowerCase()) && (!newOnly || a.isNew))
    .map(a => ({ name: a.name, type: a.type, crit: a.criticality, score: a.score }));
  const newAssetCount = filteredRecords.filter(r => r.isNew).length;

  const activeSourcesChartData = aggregateBySource(filteredRecords, SOURCES);
  const activeTypesComputed    = aggregateByType(filteredRecords, TYPES);
  const activeTypesData        = activeTypesComputed;
  const activeTypesPieData     = activeTypesComputed.map(t => ({ label: t.label, count: `${t.count}`, value: t.count, pct: t.pct <= 1 ? '<1%' : `${t.pct}%`, color: t.color }));
  const activeCriticality      = aggregateByCriticality(filteredRecords, CRITICALITY);
  const activeChartData        = currentTrendData;

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
                  title="Show only newly added assets"
                  onClick={() => {
                    setNewOnly(v => !v)
                    setAssetPage(1)
                    assetsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }}
                >
                  <IcNewlyAdded />
                  <span>2,492 Newly Added</span>
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
                <div className="dev-stat-value">{filteredRecords.length.toLocaleString()}</div>
                <div className="dev-stat-meta">
                  <IcTrendUp size={13} color="var(--pai-crit-fg)" />
                  <span className="dev-stat-change up">65.12%</span>
                  <span className="dev-stat-from">from last week</span>
                </div>
              </div>
            </div>

            <div className="dev-chart-area">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activeChartData} margin={{ top: 16, right: 16, bottom: 0, left: 8 }}>
                  <defs>
                    <linearGradient id="trendFillCloud" x1="0" y1="0" x2="0" y2="1">
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
                  <Tooltip content={makeTrendTooltip(activeChartData)} isAnimationActive={false} wrapperStyle={TIP_WRAP} cursor={false} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    name="Total"
                    stroke="var(--pai-indigo)"
                    strokeWidth={2}
                    fill="url(#trendFillCloud)"
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
                    data={activeSourcesChartData}
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
                    <Bar dataKey="Corroborated" stackId="a" fill="var(--pai-chart-teal)" radius={[2, 0, 0, 2]}
                      onMouseEnter={() => { hoveredBarRef.current = 'Corroborated'; }}
                      onMouseLeave={() => { hoveredBarRef.current = null; }}
                      cursor={onToggleFilter ? 'pointer' : 'default'}
                      onClick={(data) => onToggleFilter?.([
                        { attrId: 'data-source', key: 'Data Source', value: data.name },
                        { attrId: 'origin-contribution-type', key: 'Origin Contribution Type', value: 'Corroborated' },
                      ])}
                    />
                    <Bar
                      dataKey="Unique"
                      stackId="a"
                      fill="var(--pai-chart-purple)"
                      radius={[0, 2, 2, 0]}
                      onMouseEnter={() => { hoveredBarRef.current = 'Unique'; }}
                      onMouseLeave={() => { hoveredBarRef.current = null; }}
                      cursor={onToggleFilter ? 'pointer' : 'default'}
                      onClick={(data) => onToggleFilter?.([
                        { attrId: 'data-source', key: 'Data Source', value: data.name },
                        { attrId: 'origin-contribution-type', key: 'Origin Contribution Type', value: 'Unique' },
                      ])}
                      label={({ x, y, width, height, index }) => {
                        const row = activeSourcesChartData[index]; const total = row ? row.Corroborated + row.Unique : 0;
                        return (
                          <text
                            x={x + width + 16}
                            y={y + height / 2 + 1}
                            dominantBaseline="middle"
                            fontSize={10}
                            fill="var(--shell-text-muted)"
                            fontFamily="Inter,system-ui"
                          >{total}%</text>
                        );
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
              <div className="dev-donut-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={activeTypesPieData}
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
                      cursor={onToggleFilter ? 'pointer' : 'default'}
                      onClick={(entry) => onToggleFilter?.([{ attrId: 'type-host', key: 'Type', value: entry.label }])}
                    >
                      {activeTypesPieData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={DonutTooltip} isAnimationActive={false} wrapperStyle={TIP_WRAP} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="dev-donut-center">
                  <div className="dev-donut-center__label">Total</div>
                  <div className="dev-donut-center__value">{filteredRecords.length.toLocaleString()}</div>
                </div>
              </div>
              {/* Legend is a display-only key — no click-to-filter here, only the donut's own
                  slices filter, matching every other dashboard's pre-existing behavior. */}
              <div className="dev-type-list">
                {activeTypesData.map((t, i) => (
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
            <div className="ds-table-wrap dev-no-hscroll">
              <table className="ds-table dev-insights-table">
                <thead>
                  <tr>
                    <TH>Assessment</TH>
                    <TH>Findings Failed</TH>
                    <TH>Exposure Category</TH>
                    <th className="ds-th cfp-th-actions">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInsights.slice((insightPage-1)*rowsPer, insightPage*rowsPer).map((r, i) => {
                    const globalIdx = (insightPage - 1) * rowsPer + i;
                    return (
                    <tr key={i} className="kg-tr--clickable" onClick={() => setInsightDrawerNode(insightToAssessmentNode(r, globalIdx))}>
                      <td className="ds-td dev-td-name">
                        <span className="dev-cell-icon-text">
                          {r.sev === 'high' ? <IcSevHigh /> : <IcSevMed />}
                          <span className="dev-td-name-text">{r.text}</span>
                        </span>
                      </td>
                      <td className="ds-td dev-td-findings">
                        <div className="dev-findings-bar">
                          <div className="dev-findings-bar__track">
                            <div className="dev-findings-bar__fill" style={{ width: `${r.failPct}%` }} />
                          </div>
                          <span className="dev-findings-bar__pct">{r.failPct}%</span>
                        </div>
                      </td>
                      <td className="ds-td">{r.cat}</td>
                      <td className="ds-td" onClick={e => e.stopPropagation()}>
                        <div className="cfp-td-actions">
                          <span className="dc-tip dc-tip--end" data-tip="Filter dashboard by this assessment">
                            <button
                              className={`comp-drawer-action-icon comp-drawer-action-icon--filter${activeAssessmentIds.has(fakeAssessmentId(r.text)) ? ' comp-drawer-action-icon--active' : ''}`}
                              onClick={() => toggleAssessmentFilter(r)}
                            ><IcInsightFilter /></button>
                          </span>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
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
          <div className="card dev-card dev-crit-card">
            <div className="dev-card-hdr">
              <span className="dev-card-title">Criticality Insights</span>
            </div>

            <div className="dev-crit-bar-section">
              <div className="dev-stacked-bar">
                {activeCriticality.map((c, i) => (
                  <div
                    key={i}
                    className="dev-crit-seg"
                    data-dimmed={hoveredCrit !== null && hoveredCrit !== i ? 'true' : undefined}
                    style={{ '--seg-flex': c.pct, '--seg-color': c.color }}
                    onMouseEnter={(e) => { setHoveredCrit(i); setCritTooltip({ i, x: e.clientX, y: e.clientY }); }}
                    onMouseMove={(e) => setCritTooltip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null)}
                    onMouseLeave={() => { setHoveredCrit(null); setCritTooltip(null); }}
                    onClick={() => onToggleFilter?.([{ attrId: 'asset-criticality', key: 'Asset Criticality', value: c.label }])}
                  />
                ))}
              </div>
              {/* Legend is a display-only key — no click-to-filter here, only the bar's own
                  segments filter, matching every other dashboard's pre-existing behavior. */}
              <div className="dev-crit-legend">
                {activeCriticality.map((c, i) => (
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

            <div ref={assetsSectionRef} className="dev-asset-hdr">
              <div className="dev-asset-hdr-left">
                <span className="dev-card-title">Assets by Criticality Score</span>
                {newOnly && (
                  <span className="dev-asset-filter-note">
                    Showing {newAssetCount} newly added asset{newAssetCount === 1 ? '' : 's'}
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

            <div className="ds-table-wrap dev-no-hscroll">
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
                    <tr key={i} className="kg-tr--clickable" onClick={() => setAssetDrawer(a)}>
                      <td className="ds-td dev-td-name">
                        {a.name}
                        {a.isNew && <span className="dev-td-new-badge">New</span>}
                      </td>
                      <td className="ds-td">{a.type}</td>
                      <td className="ds-td"><span className={`pai-chip pai-chip--${a.crit.toLowerCase()}`}>{a.crit}</span></td>
                      <td className="ds-td dev-td-score">{a.score.toLocaleString()}</td>
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
                  <SelectDropdown
                    value={drawerFilter}
                    onChange={setDrawerFilter}
                    options={['All','Type','Origin','Deployment Type','Environment','Asset Criticality']}
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
                  className="dev-drawer-chart-wrap"
                  ref={drawerChartRef}
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
                          {Number(typeTooltipData.pct) >= 0
                            ? <span className="dev-tip-trend-up">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                                <span>{Math.abs(Number(typeTooltipData.pct))}%</span>
                              </span>
                            : <span className="dev-tip-trend-down">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>
                                <span>{Math.abs(Number(typeTooltipData.pct))}%</span>
                              </span>
                          }
                          from last period
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
                        {TYPES.map(t => {
                          const effectiveHL = selectedType !== null ? selectedType : hoveredType;
                          const isActive = !effectiveHL || effectiveHL === t.label;
                          return (
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
                          );
                        })}
                      </LineChart>
                    ) : (
                      <AreaChart data={drawerData} margin={{ top: 16, right: 24, bottom: 32, left: 16 }}>
                        <defs>
                          <linearGradient id="drawerFillCloud" x1="0" y1="0" x2="0" y2="1">
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
                        <Area type="monotone" dataKey="value" name="Total" stroke="var(--pai-indigo)" strokeWidth={2} fill="url(#drawerFillCloud)"
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
                            data-dimmed={selectedType && selectedType !== t.label ? 'true' : undefined}
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
        const c = activeCriticality[critTooltip.i];
        return (
          <div
            className="dev-crit-tooltip"
            style={{
              '--crit-color': c.color,
              left: c.label === 'Low' ? critTooltip.x - 200 : critTooltip.x + 14,
              top: critTooltip.y - 64,
            }}
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
      {insightDrawerNode && (
        <AssessmentDrawer node={insightDrawerNode} onClose={() => setInsightDrawerNode(null)} onNav={onNav} />
      )}
      {assetDrawer && (
        <AssetDetailDrawer asset={assetDrawer} entityType="cloud" onClose={() => setAssetDrawer(null)} />
      )}
    </div>
  );
}
