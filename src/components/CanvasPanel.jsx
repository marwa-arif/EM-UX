import React, { useRef, useCallback } from 'react'
import { Ic } from '../ui.jsx'

const IcMaximize = () => <Ic size={13} path={<><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" /></>} />
const IcThumbUp = () => <Ic size={13} path={<><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3z" /><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" /></>} />
const IcThumbDown = () => <Ic size={13} path={<><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3z" /><path d="M17 2h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3" /></>} />
const IcExternal = () => <Ic size={11} path={<><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></>} />

// ── Drag handle — resizes the chat pane width against the canvas pane ─
export function ChatDragger({ onDrag }) {
  const onPointerDown = useCallback((e) => {
    let lastX = e.clientX;
    const onMove = (ev) => {
      onDrag(ev.clientX - lastX);
      lastX = ev.clientX;
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [onDrag]);
  return (
    <div className="chat-dragger" onMouseDown={onPointerDown}>
      <div className="chat-dragger-handle">
        <span /><span /><span /><span /><span /><span />
      </div>
    </div>
  );
}

// ── Filter tree — graph-query-as-nested-tree visualization ────────────
// Rendered inside the reasoning step's expandable body (not the canvas) —
// the exact shape of the constructed query, which differs per tier/query.
function FtInclude({ children }) { return <span style={{ color: 'var(--pai-low-fg)' }}>[INCLUDE]</span>; }
function FtVals({ children }) { return <span style={{ color: 'var(--shell-text)' }}>{children}</span>; }
function FtAnd() { return <span style={{ color: 'var(--pai-high-fg)' }}>[AND]</span>; }

const FILTER_TREE_VARIANTS = {
  // graph tier — Identity → Application access path
  graph: (entity) => (
    <>
      <div><span className="ft-entity">{entity}</span></div>
      <div className="ft-branch">
        <div className="ft-where">where</div>
        <div><div className="ft-filter"><span className="ft-filter-key">privilege_level</span><div className="ft-filter-val"><FtInclude /> <FtVals>['privileged', 'admin']</FtVals> <FtAnd /></div></div></div>
        <div><span className="ft-relation">{entity} Has Access To Application</span></div>
        <div className="ft-branch">
          <div><span className="ft-entity">Application</span></div>
          <div className="ft-branch">
            <div className="ft-where">where</div>
            <div><div className="ft-filter"><span className="ft-filter-key">criticality</span><div className="ft-filter-val"><FtInclude /> <FtVals>['high', 'critical']</FtVals></div></div></div>
          </div>
        </div>
      </div>
    </>
  ),
  // risk tier — Host → Finding severity path
  risk: (entity) => (
    <>
      <div><span className="ft-entity">{entity}</span></div>
      <div className="ft-branch">
        <div className="ft-where">where</div>
        <div><div className="ft-filter"><span className="ft-filter-key">asset_criticality</span><div className="ft-filter-val"><FtInclude /> <FtVals>['high', 'critical']</FtVals></div></div></div>
        <div><span className="ft-relation">{entity} Has Finding</span></div>
        <div className="ft-branch">
          <div><span className="ft-entity">Finding</span></div>
          <div className="ft-branch">
            <div className="ft-where">where</div>
            <div><div className="ft-filter"><span className="ft-filter-key">Exposure Severity</span><div className="ft-filter-val"><FtInclude /> <FtVals>['high', 'critical']</FtVals> <FtAnd /></div></div></div>
          </div>
        </div>
      </div>
    </>
  ),
  // deep tier — full cross-domain tree (Person → Identity/Host → Application/Finding)
  deep: (entity) => (
    <>
      <div><span className="ft-entity">Person</span></div>
      <div className="ft-branch">
        <div className="ft-where">where</div>
        <div><div className="ft-filter"><span className="ft-filter-key">completed_compliance_training</span><div className="ft-filter-val"><FtVals>False</FtVals></div></div></div>
        <div><span className="ft-relation">Person Owns {entity}</span></div>
        <div className="ft-branch">
          <div><span className="ft-entity">{entity}</span></div>
          <div className="ft-branch">
            <div className="ft-where">where</div>
            <div><div className="ft-filter"><span className="ft-filter-key">privilege_level</span><div className="ft-filter-val"><FtInclude /> <FtVals>['privileged', 'admin']</FtVals> <FtAnd /></div></div></div>
            <div><span className="ft-relation">{entity} Has Access To Application</span></div>
            <div className="ft-branch">
              <div><span className="ft-entity">Application</span></div>
              <div className="ft-branch">
                <div className="ft-where">where</div>
                <div><div className="ft-filter"><span className="ft-filter-key">criticality</span><div className="ft-filter-val"><FtInclude /> <FtVals>['high', 'critical']</FtVals> <FtAnd /></div></div></div>
              </div>
            </div>
          </div>
        </div>
        <div><span className="ft-relation">Person Logs Into Host</span></div>
        <div className="ft-branch">
          <div><span className="ft-entity">Host</span></div>
          <div className="ft-branch">
            <div className="ft-where">where</div>
            <div><div className="ft-filter"><span className="ft-filter-key">asset_criticality</span><div className="ft-filter-val"><FtInclude /> <FtVals>['high', 'critical']</FtVals></div></div></div>
            <div><span className="ft-relation">Host Has Finding</span></div>
            <div className="ft-branch">
              <div><span className="ft-entity">Finding</span></div>
              <div className="ft-branch">
                <div className="ft-where">where</div>
                <div><div className="ft-filter"><span className="ft-filter-key">Exposure Severity</span><div className="ft-filter-val"><FtInclude /> <FtVals>['high', 'critical']</FtVals></div></div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  ),
};

export function FilterTree({ tier = 'deep', entity = 'Identity' }) {
  const build = FILTER_TREE_VARIANTS[tier] || FILTER_TREE_VARIANTS.deep;
  return <div className="ft-tree-box">{build(entity)}</div>;
}

// ── Tier-specific result cards (bespoke — no forced unification) ──────
export function QuickCard() {
  return (
    <div className="prose-answer-card">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        <span className="ds-badge info">47 records matched</span>
        <span className="ds-badge neutral dot">Knowledge Graph</span>
      </div>
      <p className="prose-answer-text">Found <strong>47 admin users</strong> in your identity store.
        12 have no MFA configured, 8 are associated with high-severity findings, and 3 have not completed compliance training.</p>
      <div style={{ marginTop: 12 }}>
        <table className="ds-table" style={{ fontSize: 12 }}>
          <thead><tr><th className="ds-th">Identity</th><th className="ds-th">Privilege</th><th className="ds-th">Risk</th></tr></thead>
          <tbody>
            <tr><td className="ds-td">admin-svc-account</td><td className="ds-td"><span className="ds-badge danger">admin</span></td><td className="ds-td"><span className="ds-badge danger dot">Critical</span></td></tr>
            <tr><td className="ds-td">jdoe@company.com</td><td className="ds-td"><span className="ds-badge warning">elevated</span></td><td className="ds-td"><span className="ds-badge warning dot">High</span></td></tr>
            <tr><td className="ds-td">svc-cloud-deploy</td><td className="ds-td"><span className="ds-badge danger">admin</span></td><td className="ds-td"><span className="ds-badge warning dot">High</span></td></tr>
            <tr><td className="ds-td" colSpan={3} style={{ color: 'var(--shell-text-muted)', fontSize: 11, textAlign: 'center' }}>+ 44 more results</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ConceptCard() {
  return (
    <div className="prose-answer-card">
      <p className="prose-answer-text">In Prevalent AI, <strong>exposure score</strong> is a composite risk metric that aggregates vulnerability severity (CVSS), asset criticality, privilege level of connected identities, and active exploitation indicators. A higher exposure score indicates a greater likelihood of a successful breach and broader blast radius.</p>
      <div className="prose-answer-meta">
        <span className="ds-badge neutral">Concept</span>
        <span className="prose-answer-source">Knowledge Base · Prevalent AI Platform Docs</span>
      </div>
    </div>
  );
}

export function FieldDefCard() {
  return (
    <div className="field-def-card">
      <div className="field-def-hdr">
        <code className="field-def-name">privilege_level</code>
        <span className="ds-badge info">String · Enum</span>
      </div>
      <p className="field-def-desc">Indicates the access tier granted to an Identity. Higher privilege levels carry greater risk when associated with unmitigated findings or non-compliant posture.</p>
      <div className="field-def-values">
        <span className="ds-badge neutral">standard</span>
        <span className="ds-badge warning">elevated</span>
        <span className="ds-badge danger">privileged</span>
        <span className="ds-badge danger">admin</span>
      </div>
    </div>
  );
}

const CITATIONS = [
  { num: 1, badge: 'NVD', title: 'CVE-2024-38812 · Heap-Based Buffer Overflow in vCenter Server', date: '2024-09-17' },
  { num: 2, badge: 'VMware', title: 'VMSA-2024-0019 · Security Advisory', date: '2024-09-17' },
  { num: 3, badge: 'MITRE ATT&CK', title: 'T1210 · Exploitation of Remote Services', date: '2024-10-04' },
];

export function WebResultCard() {
  return (
    <>
      <div className="prose-answer-card">
        <p className="prose-answer-text"><strong>CVE-2024-38812</strong> is a heap-based buffer overflow vulnerability in VMware vCenter Server (CVSS 9.8 · Critical). An unauthenticated attacker with network access can achieve remote code execution. Patch to vCenter 8.0 U3b or later. <strong>2 assets in your inventory are running affected versions.</strong></p>
        <div className="prose-answer-meta">
          <span className="ds-badge danger">Critical · CVSS 9.8</span>
          <span className="prose-answer-source">NVD · Published 2024-09-17</span>
        </div>
      </div>
      <div className="citation-block">
        <div className="citation-block-hdr">Sources</div>
        {CITATIONS.map(c => (
          <a className="citation-row" href="#" key={c.num} onClick={e => e.preventDefault()}>
            <span className="citation-num">[{c.num}]</span>
            <span className="ds-badge neutral">{c.badge}</span>
            <span className="citation-title">{c.title}</span>
            <span className="citation-date">{c.date}</span>
            <span style={{ opacity: 0.5, flexShrink: 0 }}><IcExternal /></span>
          </a>
        ))}
      </div>
    </>
  );
}

const INSIGHTS = [
  { icon: '⚠', headline: '3 critical assets with untrained owners', val: '↑ 12% this week' },
  { icon: '🔴', headline: '847 unpatched high-severity findings', val: 'Remediation rate: 34%' },
  { icon: '🔑', headline: '12 admin identities with no MFA', val: 'Exposure score: 94' },
  { icon: '☁', headline: 'Cloud exposure up across 4 accounts', val: '↑ 8% from last period' },
];

export function InsightStrip() {
  return (
    <div className="insight-strip">
      {INSIGHTS.map((ins, i) => (
        <div className="insight-card" key={i}>
          <div className="insight-card-icon" style={{ color: 'var(--pai-high-fg)', fontSize: 12 }}>{ins.icon}</div>
          <div className="insight-card-body">
            <span className="insight-card-headline">{ins.headline}</span>
            <span className="insight-card-val">{ins.val}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SummaryCanvas() {
  return (
    <div className="summary-canvas">
      <div className="ds-kpi-row">
        <div className="ds-kpi-card"><div className="ds-kpi-value">48,271</div><div className="ds-kpi-label">Total Exposures</div><span className="ds-kpi-delta up-bad">↑ 6% vs last week</span></div>
        <div className="ds-kpi-card"><div className="ds-kpi-value">847</div><div className="ds-kpi-label">Critical Assets</div><span className="ds-kpi-delta neutral">Unchanged</span></div>
        <div className="ds-kpi-card"><div className="ds-kpi-value">1,204</div><div className="ds-kpi-label">Active Threats</div><span className="ds-kpi-delta up-bad">↑ 14% vs last week</span></div>
        <div className="ds-kpi-card"><div className="ds-kpi-value">34%</div><div className="ds-kpi-label">Remediation Rate</div><span className="ds-kpi-delta down-bad">↓ 4% vs last week</span></div>
      </div>
      <p className="summary-narrative">Your overall exposure posture has worsened slightly this week. Critical findings are concentrated in the Cloud and Identity domains, with admin identities lacking MFA representing the highest blast radius. Remediation velocity has declined — 34% of open criticals have no assigned owner. Prioritise the 12 unpatched privilege escalation paths in the vCenter cluster identified below.</p>
      <div className="ds-table-wrap">
        <table className="ds-table">
          <thead><tr><th className="ds-th">Entity</th><th className="ds-th">Severity</th><th className="ds-th">Finding</th><th className="ds-th">Action</th></tr></thead>
          <tbody>
            <tr><td className="ds-td">vCenter-prod-01</td><td className="ds-td"><span className="ds-badge danger dot">Critical</span></td><td className="ds-td">CVE-2024-38812 · RCE · CVSS 9.8</td><td className="ds-td"><button className="ds-btn sz-sm t-danger">Patch Now</button></td></tr>
            <tr><td className="ds-td">admin-svc-account</td><td className="ds-td"><span className="ds-badge danger dot">Critical</span></td><td className="ds-td">Admin identity · No MFA · Privilege escalation path</td><td className="ds-td"><button className="ds-btn sz-sm t-danger">Remediate</button></td></tr>
            <tr><td className="ds-td">AWS-prod-us-east-1</td><td className="ds-td"><span className="ds-badge warning dot">High</span></td><td className="ds-td">S3 bucket public read · 4 exposed objects</td><td className="ds-td"><button className="ds-btn sz-sm t-outline">Review</button></td></tr>
            <tr><td className="ds-td">HR-Application</td><td className="ds-td"><span className="ds-badge warning dot">High</span></td><td className="ds-td">28 privileged identities with no compliance training</td><td className="ds-td"><button className="ds-btn sz-sm t-outline">Assign</button></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function GraphResultsCard() {
  return (
    <div className="prose-answer-card">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        <span className="ds-badge info">84 relationships mapped</span>
        <span className="ds-badge neutral dot">Knowledge Graph</span>
      </div>
      <p className="prose-answer-text">Found <strong>12 identities</strong> connected to <strong>6 critical applications</strong> through direct access grants. 3 identities hold access to more than one critical application, forming potential lateral-movement paths.</p>
      <div style={{ marginTop: 12 }}>
        <table className="ds-table" style={{ fontSize: 12 }}>
          <thead><tr><th className="ds-th">Identity</th><th className="ds-th">Application</th><th className="ds-th">Access Path</th></tr></thead>
          <tbody>
            <tr><td className="ds-td">jdoe@company.com</td><td className="ds-td">Payment Gateway</td><td className="ds-td" style={{ color: 'var(--shell-text-muted)' }}>Identity → Role → Application</td></tr>
            <tr><td className="ds-td">svc-cloud-deploy</td><td className="ds-td">Customer Data Platform</td><td className="ds-td" style={{ color: 'var(--shell-text-muted)' }}>Identity → Group → Application</td></tr>
            <tr><td className="ds-td">admin-svc-account</td><td className="ds-td">Payment Gateway</td><td className="ds-td" style={{ color: 'var(--shell-text-muted)' }}>Identity → Role → Application</td></tr>
            <tr><td className="ds-td" colSpan={3} style={{ color: 'var(--shell-text-muted)', fontSize: 11, textAlign: 'center' }}>+ 9 more paths</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function RiskResultsCard() {
  return (
    <div className="summary-canvas">
      <div className="ds-kpi-row">
        <div className="ds-kpi-card"><div className="ds-kpi-value">18</div><div className="ds-kpi-label">Critical Exposures</div><span className="ds-kpi-delta up-bad">↑ 3 new this week</span></div>
        <div className="ds-kpi-card"><div className="ds-kpi-value">64</div><div className="ds-kpi-label">High Severity</div><span className="ds-kpi-delta neutral">Unchanged</span></div>
        <div className="ds-kpi-card"><div className="ds-kpi-value">94</div><div className="ds-kpi-label">Max Exposure Score</div><span className="ds-kpi-delta up-bad">↑ 6 pts</span></div>
      </div>
      <p className="summary-narrative">Critical exposure is concentrated on production hosts with unpatched remote-code-execution vulnerabilities and admin identities lacking MFA. These paths give the shortest route from an external-facing weakness to a privileged asset.</p>
      <div className="ds-table-wrap">
        <table className="ds-table">
          <thead><tr><th className="ds-th">Asset</th><th className="ds-th">Severity</th><th className="ds-th">Finding</th></tr></thead>
          <tbody>
            <tr><td className="ds-td">vCenter-prod-01</td><td className="ds-td"><span className="ds-badge danger dot">Critical</span></td><td className="ds-td">CVE-2024-38812 · RCE · CVSS 9.8</td></tr>
            <tr><td className="ds-td">admin-svc-account</td><td className="ds-td"><span className="ds-badge danger dot">Critical</span></td><td className="ds-td">Admin identity · No MFA</td></tr>
            <tr><td className="ds-td">AWS-prod-us-east-1</td><td className="ds-td"><span className="ds-badge warning dot">High</span></td><td className="ds-td">S3 bucket public read</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function DeepResultsCard() {
  return (
    <div className="summary-canvas">
      <div className="ds-kpi-row">
        <div className="ds-kpi-card"><div className="ds-kpi-value">7</div><div className="ds-kpi-label">Correlated Risk Chains</div><span className="ds-kpi-delta up-bad">↑ 2 vs last scan</span></div>
        <div className="ds-kpi-card"><div className="ds-kpi-value">3</div><div className="ds-kpi-label">Cross-Domain Paths</div><span className="ds-kpi-delta neutral">Unchanged</span></div>
        <div className="ds-kpi-card"><div className="ds-kpi-value">96</div><div className="ds-kpi-label">Peak Blast Radius Score</div><span className="ds-kpi-delta up-bad">↑ 9 pts</span></div>
      </div>
      <p className="summary-narrative">Correlating findings across cloud, identity and host domains surfaces 3 chains where a single compromised identity leads to critical production impact. The highest-severity chain links an unpatched vCenter host to an over-privileged service account with no MFA and unrestricted S3 access.</p>
      <div className="ds-table-wrap">
        <table className="ds-table">
          <thead><tr><th className="ds-th">Chain</th><th className="ds-th">Domains</th><th className="ds-th">Severity</th></tr></thead>
          <tbody>
            <tr><td className="ds-td">vCenter → svc-cloud-deploy → S3 prod bucket</td><td className="ds-td">Host · Identity · Cloud</td><td className="ds-td"><span className="ds-badge danger dot">Critical</span></td></tr>
            <tr><td className="ds-td">admin-svc-account → Payment Gateway</td><td className="ds-td">Identity · Application</td><td className="ds-td"><span className="ds-badge danger dot">Critical</span></td></tr>
            <tr><td className="ds-td">jdoe@company.com → Customer Data Platform</td><td className="ds-td">Identity · Application</td><td className="ds-td"><span className="ds-badge warning dot">High</span></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Dispatcher — picks the right bespoke result card for the exchange's tier ──
export function ExchangeResult({ tier }) {
  switch (tier) {
    case 'quick': return <QuickCard />;
    case 'concept': return <ConceptCard />;
    case 'data-dict': return <FieldDefCard />;
    case 'web': return <WebResultCard />;
    case 'summary': return <SummaryCanvas />;
    case 'graph': return <GraphResultsCard />;
    case 'risk': return <RiskResultsCard />;
    case 'deep': return <DeepResultsCard />;
    default: return null;
  }
}

export function FeedbackRow({ value, onChange }) {
  return (
    <div className="answer-feedback-row" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <button
        className={`fb-btn${value === 'up' ? ' active-up' : ''}`}
        style={{ background: value === 'up' ? 'var(--pai-low-bg)' : 'transparent', color: value === 'up' ? 'var(--pai-low-fg)' : 'var(--shell-text-muted)', border: '1px solid var(--shell-border)', borderRadius: 6, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        onClick={() => onChange(value === 'up' ? null : 'up')}
        aria-pressed={value === 'up'}
      ><IcThumbUp /></button>
      <button
        className={`fb-btn${value === 'down' ? ' active-down' : ''}`}
        style={{ background: value === 'down' ? 'var(--pai-crit-bg)' : 'transparent', color: value === 'down' ? 'var(--pai-crit-fg)' : 'var(--shell-text-muted)', border: '1px solid var(--shell-border)', borderRadius: 6, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        onClick={() => onChange(value === 'down' ? null : 'down')}
        aria-pressed={value === 'down'}
      ><IcThumbDown /></button>
    </div>
  );
}

const CANVAS_ANSWERS = {
  quick:    'Query resolved — matching records retrieved from your knowledge graph.',
  graph:    'Graph traversal complete — relationship chains mapped across connected entities.',
  risk:     'Risk analysis complete — critical exposure paths identified requiring immediate attention.',
  deep:     'Multi-stage analysis complete — risk indicators correlated across all exposure dimensions.',
  concept:  'Definition retrieved from the Prevalent AI knowledge base.',
  'data-dict': 'Schema metadata loaded — field definition and usage examples available.',
  summary:  'Exposure summary generated — KPIs and top-risk items compiled.',
  web:      'Web search complete — threat intelligence sourced and cross-referenced.',
};

// ── The right-hand panel itself ───────────────────────────────────────
export default function CanvasPanel({ exchange, onFeedback }) {
  const empty = !exchange || !exchange.done;
  return (
    <div className="canvas-panel">
      <div className="canvas-topbar">
        <span style={{ fontWeight: 600, fontSize: 13 }}>Analysis Results</span>
        <div className="canvas-action-btns">
          <button className="ds-btn sz-sm t-outline"><IcMaximize /> Add to Workspace</button>
        </div>
      </div>
      {!empty && (
        <div className="canvas-topbar-answer visible" style={{ padding: '8px 20px 0', fontSize: 12, color: 'var(--shell-text-muted)' }}>
          {CANVAS_ANSWERS[exchange.tier]}
        </div>
      )}
      <div className="canvas-content">
        {empty ? (
          <div className="canvas-empty">
            <span className="canvas-empty-label">Results will open here once the AI finishes reasoning.</span>
          </div>
        ) : (
          <>
            {exchange.tier === 'summary' && <InsightStrip />}
            <ExchangeResult tier={exchange.tier} />
          </>
        )}
      </div>
      {!empty && (
        <div className="canvas-feedback" style={{ padding: '8px 20px 16px' }}>
          <FeedbackRow value={exchange.canvasFeedback} onChange={onFeedback} />
        </div>
      )}
    </div>
  );
}
