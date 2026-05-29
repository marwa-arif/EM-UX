import React, { useState } from 'react'
import '../styles/findings.css'
import '../styles/kg.css'
import { DSPillSearch } from '../context/WorkspaceCtx.jsx'
import TablePagination from '../components/TablePagination.jsx'
import DonutChart from '../components/DonutChart.jsx'
import DSDropdown from '../components/DSDropdown.jsx'

// ── Severity palette ─────────────────────────────────────────────
const SEV = {
  Critical: '#C9373C',
  High:     '#E06B4A',
  Medium:   '#D98B1D',
  Low:      '#31A56D',
};

// ── Chart data ───────────────────────────────────────────────────
const ASSET_CHART = [
  { label: ['Device'],   segs: [{ pct: 44, count: 9856,  sev: 'Critical' }, { pct: 14, count: 3136,  sev: 'High' }, { pct: 10, count: 2240,  sev: 'Medium' }, { pct: 32, count: 7168,  sev: 'Low' }] },
  { label: ['Cloud'],    segs: [{ pct: 14, count: 2744,  sev: 'Critical' }, { pct: 36, count: 7056,  sev: 'High' }, { pct: 10, count: 1960,  sev: 'Medium' }, { pct: 40, count: 7840,  sev: 'Low' }] },
  { label: ['Identity'], segs: [{ pct:  5, count:  700,  sev: 'Critical' }, { pct:  4, count:  560,  sev: 'High' }, { pct:  3, count:  420,  sev: 'Medium' }, { pct: 88, count: 12320, sev: 'Low' }] },
];

const FINDING_CHART = [
  { label: ['Software', 'Vulnerability'], segs: [{ pct: 32, count: 779314,  sev: 'Critical' }, { pct: 16, count: 389657,  sev: 'High' }, { pct: 14, count: 340950,  sev: 'Medium' }, { pct: 38, count: 925437,  sev: 'Low' }] },
  { label: ['Control Gap'],               segs: [{ pct: 22, count: 186343,  sev: 'Critical' }, { pct: 20, count: 169403,  sev: 'High' }, { pct: 15, count: 127052,  sev: 'Medium' }, { pct: 43, count: 364216,  sev: 'Low' }] },
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
  if (v >= 800) return 'var(--pai-crit-fg)';
  if (v >= 650) return 'var(--pai-high-fg)';
  if (v >= 500) return 'var(--pai-caution-fg)';
  return 'var(--pai-disabled)';
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

// ── Remediate Now widget ──────────────────────────────────────────
function ActNowWidget({ onNav }) {
  return (
    <div className="card fin-actnow-card">
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
              <button className="fin-remediate-btn" onClick={() => onNav?.('error')}>Remediate</button>
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
    <div className="card fin-ops-card">
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

  return (
    <div
      className="card fin-chart-card"
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
                  onMouseEnter={() => setHovSeg({ sev: seg.sev, pct: seg.pct, count: seg.count, label: row.label.join(' ') })}
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
      {hovSeg && (() => {
        const W = 210;
        const flipLeft = mouse.x + 20 + W > window.innerWidth;
        const left = flipLeft ? mouse.x - W - 8 : mouse.x + 16;
        const color = SEV[hovSeg.sev];
        return (
          <div style={{ position: 'fixed', left, top: mouse.y + 16, zIndex: 9999, pointerEvents: 'none', background: 'var(--card-bg)', border: `1px solid ${color}`, borderRadius: 8, padding: '12px 13px', minWidth: 200, boxShadow: '0 4px 16px rgba(0,0,0,0.14)', fontFamily: 'Inter,system-ui' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--shell-text)', marginBottom: 8 }}>{hovSeg.sev}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
              <span style={{ color: 'var(--shell-text-muted)' }}>Count</span>
              <span style={{ fontWeight: 600, color }}>{hovSeg.count?.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: 'var(--shell-text-muted)' }}>Percentage</span>
              <span style={{ fontWeight: 600, color }}>{hovSeg.pct}%</span>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ── Page root ─────────────────────────────────────────────────────
export default function FindingsPage({ onNav }) {
  const [search, setSearch]           = useState('');
  const [page, setPage]               = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [groupBy, setGroupBy]         = useState('Type');

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
    <div className="page fin-page">

      {/* ── Intelligence row: Act Now + Operational Health ── */}
      <div className="fin-intel-row">
        <ActNowWidget onNav={onNav} />
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
          <div className="card fin-posture-card">
            <div className="fin-posture-hdr">
              <span className="fin-posture-title">Security Posture Summary</span>
              <div className="fin-posture-groupby">
                <span>Group By</span>
                <DSDropdown
                  value={groupBy}
                  onChange={setGroupBy}
                  options={['Exposure Category', 'Cloud Provider', 'OS Family', 'Type', 'Finding Exposure Severity', 'Business Unit', 'Deployment Type']}
                />
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
      <div className="card fin-table-section">
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
            <button className="ds-btn sz-md t-outline">
              <IcDownload /> Download Exposure Factors
            </button>
            <button className="ds-btn sz-md t-primary">
              <IcDownload /> Download
            </button>
          </div>
        </div>

        <div className="ds-table-wrap">
          <table className="ds-table">
            <thead>
              <tr>
                {['Finding Title', 'Affected Assets', 'Exposure Category', 'Impact Score', 'Likelihood Score', 'Exposure Score'].map(h => (
                  <th key={h} className="ds-th">
                    <span className="ds-th-inner">{h} <IcSort /></span>
                  </th>
                ))}
                <th className="ds-th"><span className="ds-th-inner">Action</span></th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row, i) => (
                <tr key={i}>
                  <td className="ds-td">
                    <div className="fin-td-flex">
                      <span className="fin-td-icon"><IcDoc /></span>
                      {row.title}
                    </div>
                  </td>
                  <td className="ds-td">
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
                  <td className="ds-td fin-td-cat">{row.cat}</td>
                  <td className="ds-td fin-score" style={{ color: scoreColor(row.impact) }}>{row.impact}</td>
                  <td className="ds-td fin-score" style={{ color: scoreColor(row.likelihood) }}>{row.likelihood}</td>
                  <td className="ds-td fin-score" style={{ color: scoreColor(row.exposure) }}>{row.exposure}</td>
                  <td className="ds-td">
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
