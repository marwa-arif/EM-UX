import React, { useState } from 'react'
import '../styles/findings.css'
import '../styles/kg.css'
import { DSPillSearch } from '../context/WorkspaceCtx.jsx'
import TablePagination from '../components/TablePagination.jsx'

// ── Severity palette ─────────────────────────────────────────────
const SEV = {
  Critical: '#C9373C',
  High:     '#E06B4A',
  Medium:   '#D98B1D',
  Low:      '#31A56D',
};

const DONUT_COLORS = ['#EC4899', '#8B5CF6', '#06B6D4', '#3B82F6', '#94A3B8'];

// ── Chart data ───────────────────────────────────────────────────
const ASSET_CHART = [
  { label: ['Device'],   segs: [{ pct: 44, sev: 'Critical' }, { pct: 14, sev: 'High' }, { pct: 10, sev: 'Medium' }, { pct: 32, sev: 'Low' }] },
  { label: ['Cloud'],    segs: [{ pct: 14, sev: 'Critical' }, { pct: 36, sev: 'High' }, { pct: 10, sev: 'Medium' }, { pct: 40, sev: 'Low' }] },
  { label: ['Identity'], segs: [{ pct:  5, sev: 'Critical' }, { pct:  4, sev: 'High' }, { pct:  3, sev: 'Medium' }, { pct: 88, sev: 'Low' }] },
];

const FINDING_CHART = [
  { label: ['Software', 'Vulnerability'], segs: [{ pct: 32, sev: 'Critical' }, { pct: 16, sev: 'High' }, { pct: 14, sev: 'Medium' }, { pct: 38, sev: 'Low' }] },
  { label: ['Control Gap'],               segs: [{ pct: 22, sev: 'Critical' }, { pct: 20, sev: 'High' }, { pct: 15, sev: 'Medium' }, { pct: 43, sev: 'Low' }] },
];

// ── Donut data ───────────────────────────────────────────────────
const EXPOSURE_DONUT = {
  title: 'Total Exposure', total: '56k',
  items: [
    { label: 'Server',      icon: 'server',  val: '27,440',    pct: 49 },
    { label: 'Workstation', icon: 'monitor', val: '21,840',    pct: 39 },
    { label: 'Network',     icon: 'network', val: '5,040',     pct:  9 },
    { label: 'Mobile',      icon: 'mobile',  val: '1,120',     pct:  2 },
    { label: 'Others',      icon: 'other',   val: '560',       pct:  1 },
  ],
};

const FINDINGS_DONUT = {
  title: 'Total Findings', total: '3.28M',
  items: [
    { label: 'Workstation', icon: 'monitor', val: '1,730,006', pct: 54 },
    { label: 'Server',      icon: 'server',  val: '1,425,134', pct: 44 },
    { label: 'Network',     icon: 'network', val: '44,564',    pct:  1 },
    { label: 'Mobile',      icon: 'mobile',  val: '19,264',    pct:  1 },
    { label: 'Others',      icon: 'other',   val: '1',         pct:  0 },
  ],
};

// ── Table rows ───────────────────────────────────────────────────
const TABLE_ROWS = [
  { title: 'CVE 2024-23450',              asset: 'support-portal.acme.com', cat: 'Software Vulnerability', impact: 758, likelihood: 958, exposure: 866 },
  { title: 'UAC Misconfigured',           asset: 'support-portal.acme.com', cat: 'Control Gap',            impact: 712, likelihood: 745, exposure: 732 },
  { title: 'Full Disk Encryption Missing',asset: 'support-portal.acme.com', cat: 'Control Gap',            impact: 601, likelihood: 671, exposure: 654 },
  { title: 'Missing EDR Agent',           asset: 'support-portal.acme.com', cat: 'Control Gap',            impact: 589, likelihood: 566, exposure: 576 },
  { title: 'Outdated EDR agents',         asset: 'support-portal.acme.com', cat: 'Control Gap',            impact: 579, likelihood: 589, exposure: 582 },
  { title: 'Malware Scan Overdue',        asset: 'support-portal.acme.com', cat: 'Control Gap',            impact: 557, likelihood: 597, exposure: 567 },
  { title: 'Malware Blocking Disabled',   asset: 'prod-web-21.acme.com',    cat: 'Control Gap',            impact: 443, likelihood: 503, exposure: 497 },
];

function scoreColor(v) {
  if (v >= 800) return '#D12329';
  if (v >= 650) return '#D98B1D';
  if (v >= 500) return '#CDB900';
  return '#9CA3AF';
}

// ── Operational intelligence data ────────────────────────────────
const REMEDIATE_NOW = [
  {
    action: 'Patch internet-facing RCE',
    scope: '3 servers · support-portal.acme.com',
    closes: 4,
    why: 'Exploitable without auth — blast radius spans 3 downstream services, no owner assigned',
    tags: ['CVE-2024-23450', 'CVSS 9.8'],
    sev: 'crit',
    daysOpen: 12,
  },
  {
    action: 'Close domain privilege escalation path',
    scope: 'prod-dc-01.acme.com · domain controller',
    closes: 2,
    why: 'UAC gap allows lateral movement to domain admin — unassigned for 34 days, no ticket',
    tags: ['UAC Misconfiguration', 'No Ticket'],
    sev: 'crit',
    daysOpen: 34,
  },
  {
    action: 'Enable encryption on executive fleet',
    scope: '4 devices · board-level financial data',
    closes: 4,
    why: 'Active SOC 2 CC6.7 violation — legal notified, remediation window closes Friday',
    tags: ['Compliance', 'SOC 2'],
    sev: 'high',
    daysOpen: 7,
  },
];

const BACKLOG_PULSE = [
  { val: '892',  label: 'new this week',      color: '#C9373C' },
  { val: '234',  label: 'closed this week',   color: '#31A56D' },
  { val: '+658', label: 'net backlog growth', color: '#C9373C' },
  { val: '47',   label: 'SLA breaches',       color: '#E06B4A' },
];

const SLA_STATUS = [
  { sev: 'Critical', color: '#C9373C', target: '14d SLA', pct: 77, overdue: 47  },
  { sev: 'High',     color: '#E06B4A', target: '30d SLA', pct: 93, overdue: 12  },
  { sev: 'Medium',   color: '#D98B1D', target: '60d SLA', pct: 98, overdue: 3   },
];

const TOP_EXPOSED = [
  { asset: 'support-portal.acme.com',  count: '847 critical findings', pct: 23 },
  { asset: 'prod-dc-01.acme.com',      count: '651 critical findings', pct: 18 },
  { asset: 'prod-db-cluster.acme.com', count: '398 critical findings', pct: 11 },
];

// ── Inline SVG icons ─────────────────────────────────────────────
const IcSort = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/>
  </svg>
);
const IcDownload = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
const IcPin = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="17" x2="12" y2="22"/>
    <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17z"/>
  </svg>
);
const IcX = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
  </svg>
);
const IcChevD = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6"/>
  </svg>
);
const IcDoc = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14,2 14,8 20,8"/>
    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);

// ── KG-style chart tooltip (follows mouse, fixed to viewport) ────
function ChartTooltip({ content, mousePos }) {
  if (!content || !mousePos) return null;
  const W = 210;
  const flipLeft = mousePos.x + 20 + W > window.innerWidth;
  const left = flipLeft ? mousePos.x - W - 8 : mousePos.x + 16;
  const top = mousePos.y + 16;
  return (
    <div className="kg-tooltip" style={{ left, top, position: 'fixed' }}>
      {content}
    </div>
  );
}

function TRow({ k, v }) {
  return (
    <div className="kg-tooltip-row">
      <span className="kg-tooltip-row__key">{k}</span>
      <span className="kg-tooltip-row__val">{v}</span>
    </div>
  );
}

// Small colored asset-type icon squares
function AssetIcon({ type, color }) {
  const paths = {
    server:  <><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></>,
    monitor: <><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></>,
    network: <><circle cx="12" cy="5" r="3"/><circle cx="19" cy="19" r="3"/><circle cx="5" cy="19" r="3"/><path d="M12 8v5M12 13l-4.5 4M12 13l4.5 4"/></>,
    mobile:  <><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></>,
    other:   <><circle cx="12" cy="12" r="2"/><circle cx="12" cy="4" r="2"/><circle cx="12" cy="20" r="2"/></>,
  };
  return (
    <div className="fin-donut-asset-icon" style={{ background: `${color}18` }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {paths[type]}
      </svg>
    </div>
  );
}

// ── Remediate Now widget ──────────────────────────────────────────
function ActNowWidget() {
  return (
    <div className="fin-actnow-card">
      <div className="fin-intel-hdr">
        <span className="fin-intel-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C9373C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          Remediate Now
        </span>
        <span className="fin-intel-badge fin-intel-badge-crit">3 actions</span>
      </div>
      <div className="fin-actnow-list">
        {REMEDIATE_NOW.map((item, i) => (
          <div key={i} className={`fin-actnow-item fin-actnow-sev-${item.sev}`}>
            <div className="fin-actnow-row1">
              <span className="fin-actnow-action">{item.action}</span>
              <button className="fin-remediate-btn">Remediate</button>
            </div>
            <div className="fin-actnow-row2">
              <span className="fin-actnow-scope">{item.scope}</span>
              <span className="fin-actnow-closes">closes {item.closes} findings · {item.daysOpen}d open</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Program Status widget ─────────────────────────────────────────
function ProgramStatusWidget() {
  return (
    <div className="fin-ops-card">
      <div className="fin-intel-hdr">
        <span className="fin-intel-title">Exposure & Remediation</span>
        <span className="fin-intel-badge fin-intel-badge-neutral">This week</span>
      </div>

      {/* Backlog pulse — 4 stats, reads as a single sentence */}
      <div className="fin-ps-pulse">
        {BACKLOG_PULSE.map((s, i) => (
          <div key={i} className="fin-ps-pulse-item">
            <span className="fin-ps-pulse-val" style={{ color: s.color }}>{s.val}</span>
            <span className="fin-ps-pulse-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Two-column: SLA compliance | Exposure concentration */}
      <div className="fin-ps-body">
        <div className="fin-ps-col">
          <div className="fin-ps-col-title">SLA Compliance</div>
          {SLA_STATUS.map((row, i) => (
            <div key={i} className="fin-ps-sla-row">
              <span className="fin-ps-sla-dot" style={{ background: row.color }} />
              <span className="fin-ps-sla-sev">{row.sev}</span>
              <span className="fin-ps-sla-target">{row.target}</span>
              <span className="fin-ps-sla-pct" style={{ color: row.pct >= 90 ? '#31A56D' : row.pct >= 80 ? '#D98B1D' : '#C9373C' }}>
                {row.pct}%
              </span>
              <span className="fin-ps-sla-overdue">{row.overdue} overdue</span>
            </div>
          ))}
        </div>

        <div className="fin-ps-col">
          <div className="fin-ps-col-title">Exposure Concentration</div>
          {TOP_EXPOSED.map((row, i) => (
            <div key={i} className="fin-ps-exp-row">
              <span className="fin-ps-exp-rank">{i + 1}</span>
              <div className="fin-ps-exp-info">
                <span className="fin-ps-exp-asset">{row.asset}</span>
                <span className="fin-ps-exp-count">{row.count}</span>
              </div>
              <span className="fin-ps-exp-pct" style={{ color: row.pct >= 20 ? '#C9373C' : '#D98B1D' }}>
                {row.pct}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Stacked horizontal bar chart ──────────────────────────────────
function StackedBarChart({ title, rows, xLabel }) {
  const [hovSeg, setHovSeg] = useState(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0, containerW: 400 });

  const tooltipContent = hovSeg ? (
    <div>
      <div className="kg-tooltip__header" style={{ background: SEV[hovSeg.sev] + '22' }}>
        <span className="kg-tooltip__header-label" style={{ color: SEV[hovSeg.sev] }}>{hovSeg.sev}</span>
      </div>
      <div className="kg-tooltip__body">
        <TRow k="Category" v={hovSeg.label} />
        <TRow k="Share" v={`${hovSeg.pct}%`} />
      </div>
    </div>
  ) : null;

  return (
    <div
      className="fin-card fin-chart-card"
      style={{ position: 'relative' }}
      onMouseMove={(e) => setMouse({ x: e.clientX, y: e.clientY })}
    >
      <div className="fin-chart-title">{title}</div>
      <div className="fin-sbc-rows">
        {rows.map((row, i) => (
          <div key={i} className="fin-sbc-row">
            <div className="fin-sbc-label">
              {row.label.map((l, j) => <span key={j}>{l}</span>)}
            </div>
            <div className="fin-sbc-track">
              {row.segs.filter(s => s.pct > 0).map((seg, j) => (
                <div
                  key={j}
                  className="fin-sbc-seg"
                  style={{ width: `${seg.pct}%`, background: SEV[seg.sev] }}
                  onMouseEnter={() => setHovSeg({ sev: seg.sev, pct: seg.pct, label: row.label.join(' ') })}
                  onMouseLeave={() => setHovSeg(null)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="fin-sbc-bottom">
        <div className="fin-sbc-label-spacer" />
        <div className="fin-sbc-axis">
          {[0, 20, 40, 60, 80, 100].map(v => <span key={v}>{v}%</span>)}
        </div>
      </div>
      <div className="fin-sbc-xlabel">{xLabel}</div>
      <div className="fin-sbc-legend">
        {Object.entries(SEV).map(([sev, color]) => (
          <span key={sev} className="fin-sbc-legend-item">
            <span className="fin-sbc-legend-dot" style={{ background: color }} />
            <span>{sev}</span>
          </span>
        ))}
      </div>
      {hovSeg && <ChartTooltip content={tooltipContent} mousePos={mouse} />}
    </div>
  );
}

// ── Donut chart ───────────────────────────────────────────────────
function DonutChart({ data }) {
  const R = 50, CX = 68, CY = 68;
  const C = 2 * Math.PI * R;
  const GAP = 3;
  const [hovItem, setHovItem] = useState(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0, containerW: 400 });

  const segs = [];
  let prevPct = 0;
  data.items.forEach((item, i) => {
    const pct = item.pct < 1 ? 0.5 : item.pct;
    const segLen = Math.max(0, (pct / 100) * C - GAP);
    const dashOffset = C / 4 - (prevPct / 100) * C;
    segs.push({ ...item, segLen, dashOffset, color: DONUT_COLORS[i] });
    prevPct += pct;
  });

  const tooltipContent = hovItem ? (
    <div>
      <div className="kg-tooltip__header" style={{ background: hovItem.color + '22' }}>
        <span className="kg-tooltip__header-label" style={{ color: hovItem.color }}>{hovItem.label}</span>
      </div>
      <div className="kg-tooltip__body">
        <TRow k="Count" v={hovItem.val} />
        <TRow k="Share" v={hovItem.pct < 1 ? '<1%' : `${hovItem.pct}%`} />
      </div>
    </div>
  ) : null;

  return (
    <div
      className="fin-donut-panel"
      style={{ position: 'relative' }}
      onMouseMove={(e) => setMouse({ x: e.clientX, y: e.clientY })}
    >
      <div className="fin-donut-title">{data.title}</div>
      <div className="fin-donut-body">
        <div className="fin-donut-svg-wrap">
          <svg width={136} height={136} viewBox="0 0 136 136">
            <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--shell-border)" strokeWidth={13} />
            {segs.map((seg, i) => (
              <circle
                key={i}
                cx={CX} cy={CY} r={R}
                fill="none"
                stroke={seg.color}
                strokeWidth={13}
                strokeDasharray={`${seg.segLen} ${C}`}
                strokeDashoffset={seg.dashOffset}
                strokeLinecap="butt"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHovItem(segs[i])}
                onMouseLeave={() => setHovItem(null)}
              />
            ))}
            <text x={CX} y={CY - 6} textAnchor="middle" fontSize={10} fill="var(--shell-text-muted)" fontFamily="Inter, system-ui">Total</text>
            <text x={CX} y={CY + 12} textAnchor="middle" fontSize={18} fontWeight={700} fill="var(--shell-text)" fontFamily="Inter, system-ui">{data.total}</text>
          </svg>
        </div>
        <div className="fin-donut-list">
          {data.items.map((item, i) => (
            <div
              key={i}
              className="fin-donut-row"
              style={{ cursor: 'default' }}
              onMouseEnter={() => setHovItem(segs[i])}
              onMouseLeave={() => setHovItem(null)}
            >
              <AssetIcon type={item.icon} color={DONUT_COLORS[i]} />
              <span className="fin-donut-label">{item.label}</span>
              <span className="fin-donut-val">{item.val}</span>
              <span className="fin-donut-pct">{item.pct < 1 ? '<1%' : `${item.pct}%`}</span>
            </div>
          ))}
        </div>
      </div>
      {hovItem && <ChartTooltip content={tooltipContent} mousePos={mouse} />}
    </div>
  );
}

// ── Page root ─────────────────────────────────────────────────────
export default function FindingsPage() {
  const [search, setSearch]           = useState('');
  const [page, setPage]               = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const filteredRows = TABLE_ROWS.filter(r =>
    !search ||
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.asset.toLowerCase().includes(search.toLowerCase())
  );
  const clampedPage = Math.min(page, Math.max(1, Math.ceil(filteredRows.length / rowsPerPage)));
  const start       = (clampedPage - 1) * rowsPerPage;
  const visibleRows = filteredRows.slice(start, start + rowsPerPage);

  function handleSearch(v) { setSearch(v); setPage(1); }

  return (
    <div className="fin-page">

      {/* ── Intelligence row: Act Now + Operational Health ── */}
      <div className="fin-intel-row">
        <ActNowWidget />
        <ProgramStatusWidget />
      </div>

      {/* ── Top row: left charts + right posture ── */}
      <div className="fin-top-row">

        {/* Left: two stacked bar charts */}
        <div className="fin-left-col">
          <StackedBarChart
            title="Asset Criticality by Attack Surface"
            rows={ASSET_CHART}
            xLabel="% of Asset Count"
          />
          <StackedBarChart
            title="Finding Criticality by Exposure Category"
            rows={FINDING_CHART}
            xLabel="% of Findings Count"
          />
        </div>

        {/* Right: Security Posture Summary */}
        <div className="fin-right-col">
          <div className="fin-card fin-posture-card">
            <div className="fin-posture-hdr">
              <span className="fin-posture-title">Security Posture Summary</span>
              <div className="fin-posture-groupby">
                <span>Group by</span>
                <button className="fin-groupby-btn">Asset Type <IcChevD /></button>
              </div>
            </div>
            <div className="fin-posture-body">
              <DonutChart data={EXPOSURE_DONUT} />
              <div className="fin-posture-divider" />
              <DonutChart data={FINDINGS_DONUT} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom: open findings table ── */}
      <div className="fin-table-section">
        <div className="fin-table-hdr">
          <span className="fin-table-title">
            Open Findings <span className="fin-table-count">(3,282,373)</span>
          </span>
          <div className="fin-table-actions">
            <DSPillSearch
              value={search}
              onChange={handleSearch}
              placeholder="Search Any"
              width={200}
            />
            <button className="fin-btn fin-btn-outline">
              <IcDownload /> Download Exposure Factors
            </button>
            <button className="fin-btn fin-btn-primary">
              <IcDownload /> Download
            </button>
          </div>
        </div>

        <div className="fin-table-wrap">
          <table className="fin-table">
            <thead>
              <tr>
                {['Finding Title', 'Affected Assets', 'Exposure Category', 'Impact Score', 'Likelihood Score', 'Exposure Score'].map(h => (
                  <th key={h} className="fin-th">
                    <span className="fin-th-inner">{h} <IcSort /></span>
                  </th>
                ))}
                <th className="fin-th"><span className="fin-th-inner">Action</span></th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row, i) => (
                <tr key={i} className="fin-tr">
                  <td className="fin-td">
                    <div className="fin-td-flex">
                      <span className="fin-td-icon"><IcDoc /></span>
                      {row.title}
                    </div>
                  </td>
                  <td className="fin-td">
                    <div className="fin-td-flex">
                      <span className="fin-td-icon" style={{ color: '#6360D8' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/>
                          <line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/>
                        </svg>
                      </span>
                      {row.asset}
                    </div>
                  </td>
                  <td className="fin-td fin-td-cat">{row.cat}</td>
                  <td className="fin-td fin-score" style={{ color: scoreColor(row.impact) }}>{row.impact}</td>
                  <td className="fin-td fin-score" style={{ color: scoreColor(row.likelihood) }}>{row.likelihood}</td>
                  <td className="fin-td fin-score" style={{ color: scoreColor(row.exposure) }}>{row.exposure}</td>
                  <td className="fin-td">
                    <div className="fin-td-actions">
                      <button className="fin-action-btn" title="Pin"><IcPin /></button>
                      <button className="fin-action-btn" title="Dismiss"><IcX /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <TablePagination
          total={filteredRows.length}
          page={clampedPage}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={n => { setRowsPerPage(n); setPage(1); }}
        />
      </div>

    </div>
  );
}
