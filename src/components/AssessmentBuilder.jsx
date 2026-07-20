import React, { useState, useMemo, useCallback, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import '../styles/assessment-builder.css'

// ── Entity catalog — order/colors/labels match the reference Figma exactly ──
// (Figma: EM Design, node 54944:139253 — "Select an Entity" grid)
export const BUILDER_ENTITIES = [
  { key: 'account',          label: 'Account',          icon: 'assets/icons/entities/account.svg',           color: '#9982BB',
    attrs: ['Type', 'Privileged', 'Active', 'Last login (days)'] },
  { key: 'application',      label: 'Application',      icon: 'assets/icons/entities/application.svg',       color: '#B4853D',
    attrs: ['Owner team', 'Criticality', 'Public facing', 'Patch level'] },
  { key: 'assessment',       label: 'Assessment',       icon: 'assets/icons/entities/assessment.svg',        color: '#AC672D',
    attrs: ['Rating', 'Score', 'Contribution type'] },
  { key: 'cloud_account',    label: 'Cloud Account',    icon: 'assets/icons/entities/cloud-account.svg',     color: '#5E6AFF',
    attrs: ['Provider', 'Region', 'Owner', 'MFA enforced', 'Root access restricted'] },
  { key: 'container',        label: 'Cloud Container',  icon: 'assets/icons/entities/cloud-container.svg',   color: '#7E54AA',
    attrs: ['Image', 'Namespace', 'Privileged mode', 'Encryption at rest', 'Type', 'Runtime', 'Owner team'] },
  { key: 'cluster',          label: 'Cloud Cluster',     icon: 'assets/icons/entities/cluster.svg',           color: '#5F5FCD',
    attrs: ['Version', 'Region', 'Network policy enabled', 'Owner team'] },
  { key: 'finding',          label: 'Finding',           icon: 'assets/icons/entities/finding.svg',           color: '#7958C4',
    attrs: ['Severity', 'Status', 'Source', 'Age (days)'] },
  { key: 'host',             label: 'Host',              icon: 'assets/icons/entities/host.svg',              color: '#7FA6D8',
    attrs: ['Operating system', 'Owner', 'Last seen', 'CMDB sync status', 'Firewall enabled', 'EDR installed', 'Encryption at rest', 'Type', 'Active blocking enabled', 'Malware protection'] },
  { key: 'identity',         label: 'Identity',          icon: 'assets/icons/entities/identity.svg',          color: '#9D15D6',
    attrs: ['MFA enabled', 'Password rotated (days)', 'Type', 'Privileged', 'Active', 'Auth factor count'] },
  { key: 'network_services', label: 'Network Services',  icon: 'assets/icons/entities/network-services.svg', color: '#89A833',
    attrs: ['Type', 'Region', 'Publicly exposed', 'Owner team'] },
  { key: 'person',           label: 'Person',            icon: 'assets/icons/entities/person.svg',            color: '#167091',
    attrs: ['Department', 'Role', 'Manager', 'Access level'] },
  { key: 'storage',          label: 'Cloud Storage',     icon: 'assets/icons/entities/storage.svg',           color: '#3A96C4',
    attrs: ['Type', 'Encrypted at rest', 'Public access', 'Region', 'SFTP enabled'] },
  { key: 'vulnerability',    label: 'Vulnerability',     icon: 'assets/icons/entities/vulnerability.svg',     color: '#AE5757',
    attrs: ['CVE ID', 'CVSS score', 'Exploit available', 'Patch available'] },
  { key: 'group',            label: 'Group',             icon: 'assets/icons/entities/group.svg',             color: '#27BDC2',
    attrs: ['Type', 'Member count', 'Owner team'] },
  { key: 'certificate',      label: 'Certificate',       icon: 'assets/icons/entities/certificate.svg',       color: '#73C12E',
    attrs: ['Issuer', 'Expires (days)', 'Key length', 'Self-signed'] },
  { key: 'network',          label: 'Network',           icon: 'assets/icons/entities/network.svg',           color: '#00895E',
    attrs: ['CIDR range', 'Region', 'Publicly routable', 'Owner team'] },
  { key: 'network_interface', label: 'Network Interface', icon: 'assets/icons/entities/network-interface.svg', color: '#BA3D8C',
    attrs: ['Public IP assigned', 'Attached to', 'Region'] },
]
export const ENTITY_BY_KEY = Object.fromEntries(BUILDER_ENTITIES.map(e => [e.key, e]))

// Maps a builder entity key to the badge icon key used on the Assessments list
const LIST_BADGE_BY_KEY = {
  host: 'device', storage: 'storage', identity: 'identity', person: 'person',
  finding: 'finding', vulnerability: 'vulnerability', cloud_account: 'cloud',
}

// Which relationships can be added from a given primary entity
export const RELATIONSHIP_OPTIONS = {
  host:          [{ to: 'vulnerability', label: 'has vulnerability finding' }, { to: 'finding', label: 'has finding' }],
  container:     [{ to: 'finding', label: 'has finding' }],
  cluster:       [{ to: 'container', label: 'contains' }],
  identity:      [{ to: 'person', label: 'belongs to' }],
  storage:       [{ to: 'finding', label: 'has finding' }],
  cloud_account: [{ to: 'storage', label: 'owns' }],
  account:       [{ to: 'person', label: 'belongs to' }],
  application:   [{ to: 'finding', label: 'has finding' }],
}

// Attributes of the relationship/edge itself (independent of either node)
const EDGE_ATTRS = ['First seen', 'Confidence', 'Detection source', 'Link status']

const GRANULARITY_OPTIONS = [
  { key: 'primary', label: 'Primary entity' },
  { key: 'pair', label: 'Pair' },
  { key: 'related', label: 'Related entity' },
]

// Variable-depth framework hierarchies for CCM contribution mapping
const FW_HIERARCHY = {
  scf: { name: 'SCF 2025.1.1', levels: [
    { key: 'domain', label: 'Domain', options: ['Cryptographic Protections', 'Endpoint Security', 'Identification & Authentication', 'Data Classification & Handling'] },
    { key: 'control', label: 'Control', options: ['CRY-01', 'END-06', 'IAC-09', 'DCH-03'] },
  ]},
  nist_800: { name: 'NIST 800-53 rev5', levels: [
    { key: 'family', label: 'Family', options: ['Access Control', 'System & Information Integrity', 'Identification & Authentication'] },
    { key: 'control', label: 'Control', options: ['AC-2', 'SI-7', 'IA-5'] },
    { key: 'enhancement', label: 'Enhancement', options: ['(1)', '(2)', '(3)', 'None'] },
  ]},
  iso_27001: { name: 'ISO 27001:2022', levels: [
    { key: 'theme', label: 'Theme', options: ['Organizational', 'People', 'Physical', 'Technological'] },
    { key: 'control', label: 'Control', options: ['A.5.1', 'A.8.9', 'A.9.4'] },
    { key: 'attribute', label: 'Attribute', options: ['Preventive', 'Detective', 'Corrective'] },
  ]},
  pci_dss: { name: 'PCI DSS v4.0.1', levels: [
    { key: 'requirement', label: 'Requirement', options: ['Req 2', 'Req 8', 'Req 10'] },
    { key: 'subrequirement', label: 'Sub-requirement', options: ['2.2', '8.3', '10.2'] },
    { key: 'control', label: 'Control', options: ['2.2.6', '8.3.1', '10.2.1'] },
    { key: 'testing', label: 'Testing procedure', options: ['2.2.6.a', '8.3.1.b', '10.2.1.c'] },
  ]},
  cis: { name: 'CIS v8.1', levels: [
    { key: 'control', label: 'Control', options: ['CIS-4', 'CIS-5', 'CIS-6'] },
    { key: 'safeguard', label: 'Safeguard', options: ['4.1', '5.2', '6.3'] },
  ]},
}
// Which other frameworks get auto-suggested once one is explicitly mapped
const CROSS_FRAMEWORK_MAP = {
  scf: ['nist_800', 'cis'],
  nist_800: ['scf', 'iso_27001'],
  iso_27001: ['scf'],
  pci_dss: ['scf'],
  cis: ['scf', 'nist_800'],
}
const SEVERITIES = ['Critical', 'High', 'Moderate', 'Low']

// Illustrative preview only — real per-framework compliance impact isn't computed until
// frameworks are mapped in the Contribution step.
const COMPLIANCE_IMPACT_PREVIEW = [
  { key: 'scf', badge: 'SCF', name: 'SCF 2025.1.1', delta: '+ 6.3%', up: true },
  { key: 'nist_800', badge: 'NIST', name: 'NIST 800-53 rev5', delta: '+ 10.5%', up: true },
  { key: 'iso_27001', badge: 'ISO', name: 'ISO 27001:2022', delta: '+ 6.3%', up: true },
  { key: 'pci_dss', badge: 'PCI', name: 'PCI DSS v4.0.1', delta: '- 2.2%', up: false },
  { key: 'cis', badge: 'CIS', name: 'CIS v8.1', delta: '+ 6.3%', up: true },
]

export const OPERATORS = [
  { key: '=', label: '=' },
  { key: '!=', label: '≠' },
  { key: 'contains', label: 'contains' },
  { key: 'is_null', label: 'is null' },
  { key: 'is_not_null', label: 'is not null' },
  { key: '>=', label: '≥' },
  { key: '<=', label: '≤' },
  { key: '>', label: '>' },
  { key: '<', label: '<' },
]
const NO_VALUE_OPS = new Set(['is_null', 'is_not_null'])

let uidSeed = 1
function uid(prefix) { return `${prefix}${uidSeed++}` }

function hashStr(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) { h = (h * 31 + str.charCodeAt(i)) >>> 0 }
  return h
}

const BASE_COUNT = { host: 58687, container: 358, identity: 71442, cluster: 231, storage: 5541, person: 304, finding: 15518350, vulnerability: 55230 }

function estimateScopeCount(entityKey, filters) {
  const base = BASE_COUNT[entityKey] || 1000
  if (!filters.length) return base
  let n = base
  filters.forEach(f => {
    if (!f.attr) return
    const ratio = 0.15 + (hashStr(`${f.attr}=${f.val}`) % 28) / 40
    n = Math.max(1, Math.round(n * ratio))
  })
  return n
}

function stripPrefix(row) {
  return { ...row, attr: row.attr.includes(':') ? row.attr.split(':').slice(1).join(':') : row.attr }
}

const SAMPLE_TOKENS = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo']
function sampleValue(entityKey, attr, rowIdx) {
  const h = hashStr(`${entityKey}:${attr}:${rowIdx}`)
  if (/enabled|active|privileged|public access|available|policy|mfa/i.test(attr)) return h % 2 === 0 ? 'Yes' : 'No'
  if (/score|days|count|version/i.test(attr)) return String(h % 100)
  return SAMPLE_TOKENS[h % SAMPLE_TOKENS.length]
}

function newConditionRow() { return { id: uid('c'), attr: '', op: '=', val: '', joiner: 'AND', advanced: false, expr: '' } }

// ── Small icons ───────────────────────────────────────────────────
const IcClose = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
)
const IcTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
)
const IcPlus = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
)
const IcChevronRight = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
)
const IcCheck = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
)
const IcLink = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
)
const IcInfo = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
)
const IcPlay = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="6 4 20 12 6 20"/></svg>
)
const IcCheckCircle = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.5 2.5 4.5-5"/></svg>
)
const IcTargetCircle = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.5"/></svg>
)
const IcXCircle = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><path d="M15 9l-6 6M9 9l6 6"/></svg>
)
const IcCaretUp = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="m6 15 6-6 6 6"/></svg>
)
const IcCaretDown = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="m6 9 6 6 6-6"/></svg>
)
const IcListLines = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 5h16M4 12h16M4 19h10"/></svg>
)
const IcBranch = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6l4 4-4 4M12 8h8M12 16h8"/></svg>
)
const IcCalendar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></svg>
)
const IcSearch = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
)
const IcSort = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7 9 5-5 5 5M7 15l5 5 5-5"/></svg>
)

// ── Stepper ───────────────────────────────────────────────────────
const STEPS = ['Scope & Condition', 'Validation', 'Contribution', 'Deploy']

function Stepper({ step, onJump, maxReached }) {
  return (
    <div className="ds-steps asb-steps">
      {STEPS.map((label, i) => {
        const n = i + 1
        const state = n < step ? 'completed' : n === step ? 'active' : ''
        const clickable = n <= maxReached
        return (
          <React.Fragment key={label}>
            <div
              className={`ds-step asb-step ${state}${clickable ? ' asb-step--clickable' : ''}`}
              onClick={() => clickable && onJump(n)}
            >
              <div className="ds-step-dot">{n < step ? <IcCheck /> : n}</div>
              <span className="ds-step-label">{label}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`ds-step-line asb-step-line${n < step ? ' completed' : ''}`} />}
          </React.Fragment>
        )
      })}
    </div>
  )
}

// ── Onboarding coach-mark guide ───────────────────────────────────
const GUIDE = [
  { title: 'Select scope entity', mock: 'scope',
    body: "Choose the entity type your assessment evaluates, then narrow it with attribute filters — for example Cloud Storage where Type = Volume. Mark it as scope when you're done." },
  { title: 'Define the condition', mock: 'condition',
    body: 'Set the success condition an entity in scope must meet to be counted as compliant, using the same attribute picker. The assessment name is generated for you.' },
  { title: 'Validation', mock: 'validation',
    body: 'Run a dry-run to see how many items fall in scope and preview the exact table your assessment will produce.' },
  { title: 'Contribution', mock: 'contribution',
    body: 'Choose whether this assessment feeds Compliance (CCM) and/or Exposure scoring, and set alert thresholds.' },
  { title: 'Deploy', mock: 'deploy',
    body: 'Preview the full assessment definition, then deploy it — it runs automatically with the next data pipeline.' },
]

const GUIDE_MOCK_ENTITIES = [
  { icon: 'assets/icons/entities/storage.svg', color: '#3A96C4', selected: true },
  { icon: 'assets/icons/entities/host.svg', color: '#2B5690', selected: false },
  { icon: 'assets/icons/entities/finding.svg', color: '#582DBB', selected: false },
]

function GuideMock({ kind }) {
  if (kind === 'scope') {
    return (
      <div className="asb-guide-mock asb-guide-mock--scope">
        {GUIDE_MOCK_ENTITIES.map((e, i) => (
          <span key={i} className={`asb-guide-mock-entity${e.selected ? ' selected' : ''}`} style={{ '--asb-entity-color': e.color }}>
            <img src={e.icon} width={20} height={20} alt="" />
          </span>
        ))}
      </div>
    )
  }
  if (kind === 'condition') {
    return (
      <div className="asb-guide-mock asb-guide-mock--rows">
        <div className="asb-guide-mock-row">
          <span className="asb-guide-mock-joiner">IF</span>
          <span className="asb-guide-mock-field">Type</span>
          <span className="asb-guide-mock-op">=</span>
          <span className="asb-guide-mock-field">Volume</span>
        </div>
        <div className="asb-guide-mock-row">
          <span className="asb-guide-mock-joiner">AND</span>
          <span className="asb-guide-mock-field">Encryption</span>
          <span className="asb-guide-mock-op">=</span>
          <span className="asb-guide-mock-field">Enabled</span>
        </div>
      </div>
    )
  }
  if (kind === 'validation') {
    return (
      <div className="asb-guide-mock asb-guide-mock--stats">
        <div className="asb-guide-mock-stat"><span className="asb-guide-mock-stat-label">In scope</span><span className="asb-guide-mock-stat-value">3,186</span></div>
        <div className="asb-guide-mock-stat"><span className="asb-guide-mock-stat-label">Passing</span><span className="asb-guide-mock-stat-value asb-guide-mock-stat-value--pass">2,262</span></div>
        <div className="asb-guide-mock-stat"><span className="asb-guide-mock-stat-label">Failing</span><span className="asb-guide-mock-stat-value asb-guide-mock-stat-value--fail">924</span></div>
      </div>
    )
  }
  if (kind === 'contribution') {
    return (
      <div className="asb-guide-mock asb-guide-mock--chips">
        <span className="asb-guide-mock-chip selected">Compliance (CCM)</span>
        <span className="asb-guide-mock-chip">Exposure</span>
        <div className="asb-guide-mock-fw-row">
          <span className="asb-guide-mock-fw">SCF</span>
          <span className="asb-guide-mock-fw">NIST</span>
          <span className="asb-guide-mock-fw">CIS</span>
        </div>
      </div>
    )
  }
  return (
    <div className="asb-guide-mock asb-guide-mock--deploy">
      <div className="asb-guide-mock-recap-row"><span>Scope</span><strong>Cloud Storage</strong></div>
      <div className="asb-guide-mock-recap-row"><span>Condition</span><strong>Encryption = Enabled</strong></div>
      <span className="asb-guide-mock-deploy-btn">Deploy</span>
    </div>
  )
}

function OnboardingGuide({ onDismiss }) {
  const [i, setI] = useState(0)
  const [neverShowAgain, setNeverShowAgain] = useState(false)
  const g = GUIDE[i]
  const last = i === GUIDE.length - 1

  const dismiss = () => {
    if (neverShowAgain) {
      try { localStorage.setItem('asb-onboard-guide-dismissed', '1') } catch { /* ignore */ }
    }
    onDismiss()
  }

  return (
    <div className="asb-onboard-overlay" onClick={dismiss}>
      <div className="asb-onboard-modal" onClick={e => e.stopPropagation()}>
        <div className="asb-onboard-modal__head">
          <span className="asb-onboard-modal__title">Guide</span>
          <button className="asb-close-btn" onClick={dismiss} title="Close"><IcClose /></button>
        </div>
        <div className="asb-guide-mock-frame"><GuideMock kind={g.mock} /></div>
        <div className="asb-onboard-progress-row">
          <span className="asb-onboard-progress-label">Step {i + 1} of {GUIDE.length}</span>
          <div className="asb-onboard-progress-bar"><div className="asb-onboard-progress-fill" style={{ width: `${((i + 1) / GUIDE.length) * 100}%` }} /></div>
        </div>
        <div className="asb-onboard-title">{g.title}</div>
        <div className="asb-onboard-body">{g.body}</div>
        <div className="asb-onboard-footer">
          <label className="asb-onboard-never-show">
            <input type="checkbox" checked={neverShowAgain} onChange={e => setNeverShowAgain(e.target.checked)} />
            Don't show this again
          </label>
          <div className="asb-onboard-footer__actions">
            <button className="ds-btn sz-sm t-outline" onClick={dismiss}>Skip Now</button>
            <button className="ds-btn sz-sm t-primary" onClick={() => last ? dismiss() : setI(i + 1)}>
              {last ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Entity grid picker ────────────────────────────────────────────
function EntityGrid({ onPick, disabledKeys, selectedKey }) {
  return (
    <div className="asb-entity-grid">
      {BUILDER_ENTITIES.map(e => {
        const disabled = disabledKeys?.has(e.key)
        const selected = selectedKey === e.key
        return (
          <button
            key={e.key}
            className={`asb-entity-tile${disabled ? ' asb-entity-tile--disabled' : ''}${selected ? ' selected' : ''}`}
            disabled={disabled}
            onClick={() => onPick(e.key)}
            style={{ '--asb-entity-color': e.color }}
          >
            <span className="asb-entity-tile__icon"><img src={e.icon} width={20} height={20} alt="" /></span>
            <span className="asb-entity-tile__label">{e.label}</span>
          </button>
        )
      })}
    </div>
  )
}

// ── Scope path card (unified rail with inline add-slots) ──────────
function ScopePathPill({ entity, badge, count, filterCount, selected, dashed, title, sub, onClick }) {
  if (dashed) {
    return (
      <button className="asb-sp-pill asb-sp-pill--dashed" onClick={onClick}>
        <span className="asb-sp-pill__plus"><IcPlus /></span>
        <span className="asb-sp-pill__dashed-info">
          <strong>{title}</strong>
          <span className="asb-sp-pill__sub">{sub}</span>
        </span>
      </button>
    )
  }
  return (
    <div className={`asb-sp-pill asb-sp-pill--filled${selected ? ' selected' : ''}`} style={{ '--asb-entity-color': entity.color }}>
      <span className="asb-sp-pill__icon"><img src={entity.icon} width={17} height={17} alt="" /></span>
      <span className="asb-sp-pill__info">
        <span className="asb-sp-pill__top">
          <strong>{entity.label}</strong>
          <span className="asb-sp-pill__badge">{badge}</span>
        </span>
        <span className="asb-sp-pill__sub">{filterCount > 0 ? `${count.toLocaleString()} · ${filterCount} filter${filterCount > 1 ? 's' : ''}` : `All ${count.toLocaleString()}`}</span>
      </span>
    </div>
  )
}

function ScopePathCard({ scope, estTotal, onAddUnion, onAddRelationship, canAddRelationship }) {
  if (!scope.primary) return null
  const primaryEntity = ENTITY_BY_KEY[scope.primary.key]
  return (
    <div className="asb-sp-card">
      <div className="asb-sp-head">
        <span className="asb-sp-label">Scope path</span>
        <span className="asb-sp-est">Estimated in scope: <strong>{estTotal.toLocaleString()} Entities</strong></span>
      </div>
      <div className="asb-sp-row">
        <ScopePathPill
          entity={primaryEntity}
          badge="Primary"
          count={estimateScopeCount(scope.primary.key, scope.primary.filters.filter(filterComplete))}
          filterCount={scope.primary.filters.filter(filterComplete).length}
          selected
        />
        {scope.union.map((u, idx) => (
          <React.Fragment key={u.key + idx}>
            <span className="asb-sp-or">Or</span>
            <ScopePathPill
              entity={ENTITY_BY_KEY[u.key]}
              badge="Or"
              count={estimateScopeCount(u.key, u.filters.filter(filterComplete))}
              filterCount={u.filters.filter(filterComplete).length}
            />
          </React.Fragment>
        ))}
        {!scope.relationship && (
          <>
            <span className="asb-sp-or">Or</span>
            <ScopePathPill dashed title="Another entity" sub="Union (OR) - same rules apply" onClick={onAddUnion} />
          </>
        )}

        {(scope.relationship || canAddRelationship) && (
          scope.relationship ? (
            <ScopePathPill
              entity={ENTITY_BY_KEY[scope.relationship.key]}
              badge="Related"
              count={estimateScopeCount(scope.relationship.key, scope.relationship.filters.filter(filterComplete))}
              filterCount={scope.relationship.filters.filter(filterComplete).length}
            />
          ) : (
            <ScopePathPill dashed title="Related entity" sub="Follow a graph link" onClick={onAddRelationship} />
          )
        )}
      </div>
    </div>
  )
}

// ── Filter row (attr / operator / value) ──────────────────────────
function FilterRow({ row, attrs, onChange, onRemove }) {
  const noValue = NO_VALUE_OPS.has(row.op)
  return (
    <div className="asb-filter-row">
      <select className="asb-select" value={row.attr} onChange={e => onChange({ ...row, attr: e.target.value })}>
        <option value="">Attribute…</option>
        {attrs.map(a => <option key={a} value={a}>{a}</option>)}
      </select>
      <select className="asb-select asb-select--op" value={row.op} onChange={e => onChange({ ...row, op: e.target.value })}>
        {OPERATORS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
      </select>
      {!noValue && (
        <input
          className="asb-input"
          placeholder="Value"
          value={row.val}
          onChange={e => onChange({ ...row, val: e.target.value })}
        />
      )}
      <button className="asb-row-remove" onClick={onRemove} title="Remove filter"><IcClose /></button>
    </div>
  )
}

function filterComplete(row) {
  if (row.advanced) return !!row.expr?.trim()
  if (!row.attr || !row.op) return false
  if (NO_VALUE_OPS.has(row.op)) return true
  return row.val !== '' && row.val != null
}

// ── Entity card (primary / union / related) with its filters ─────
function EntityCard({ badge, entity, filters, onFiltersChange, onRemoveEntity, subtitle }) {
  const [draft, setDraft] = useState({ attr: '', op: '=', val: '' })
  const draftNoValue = NO_VALUE_OPS.has(draft.op)
  const commitDraft = () => {
    if (!draft.attr) return
    onFiltersChange([...filters, { id: uid('f'), ...draft }])
    setDraft({ attr: '', op: '=', val: '' })
  }
  const updateFilter = (id, next) => onFiltersChange(filters.map(f => f.id === id ? next : f))
  const removeFilter = (id) => onFiltersChange(filters.filter(f => f.id !== id))
  return (
    <div className="asb-ecard" style={{ '--asb-entity-color': entity.color }}>
      <div className="asb-ecard__head">
        <div className="asb-ecard__title-col">
          <div className="asb-ecard__title-group">
            {entity.icon && <span className="asb-ecard__icon"><img src={entity.icon} width={14} height={14} alt="" /></span>}
            <span className="asb-ecard__name">{entity.label}</span>
            <span className="asb-ecard__badge">{badge}</span>
          </div>
          <span className="asb-ecard__subtitle">{subtitle || `Filter which ${entity.label} are in scope - leave empty to include all.`}</span>
        </div>
        {onRemoveEntity && (
          <button className="asb-row-remove asb-ecard__remove" onClick={onRemoveEntity} title="Remove entity"><IcClose /></button>
        )}
      </div>

      {filters.map(f => (
        <FilterRow key={f.id} row={f} attrs={entity.attrs} onChange={next => updateFilter(f.id, next)} onRemove={() => removeFilter(f.id)} />
      ))}

      <div className="asb-filter-draft-row">
        <select className="asb-select" value={draft.attr} onChange={e => setDraft(d => ({ ...d, attr: e.target.value }))}>
          <option value="">Attribute…</option>
          {entity.attrs.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select className="asb-select asb-select--op" value={draft.op} onChange={e => setDraft(d => ({ ...d, op: e.target.value }))}>
          {OPERATORS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
        </select>
        {!draftNoValue && (
          <input className="asb-input" placeholder="Value…" value={draft.val} onChange={e => setDraft(d => ({ ...d, val: e.target.value }))} />
        )}
        <button className="asb-add-filter-btn" onClick={commitDraft} disabled={!draft.attr}><IcPlus /> Add filter</button>
      </div>

      {filters.length === 0 && <div className="asb-ecard__empty">No filters yet — all {entity.label} entities are included.</div>}
    </div>
  )
}

// ── Relationship (edge) card — sits between the two entities it connects ──
function RelationshipEdgeCard({ primaryLabel, relOptionsAll, currentKey, onChangeType, onRemove, filters, onFiltersChange, granularity, onGranularityChange }) {
  const [draft, setDraft] = useState({ attr: '', op: '=', val: '' })
  const draftNoValue = NO_VALUE_OPS.has(draft.op)
  const commitDraft = () => {
    if (!draft.attr) return
    onFiltersChange([...filters, { id: uid('f'), ...draft }])
    setDraft({ attr: '', op: '=', val: '' })
  }
  const updateFilter = (id, next) => onFiltersChange(filters.map(f => f.id === id ? next : f))
  const removeFilter = (id) => onFiltersChange(filters.filter(f => f.id !== id))
  return (
    <div className="asb-rel-card">
      <div className="asb-rel-card__stem asb-rel-card__stem--top" />
      <div className="asb-rel-card__stem asb-rel-card__stem--bottom" />
      <div className="asb-rel-card__head">
        <span className="asb-rel-card__icon"><IcLink /></span>
        <span className="asb-rel-card__label">Related via</span>
        <select
          className="asb-select asb-rel-card__type-select"
          value={currentKey}
          onChange={e => {
            const opt = relOptionsAll.find(r => r.to === e.target.value)
            if (opt) onChangeType(opt.to, opt.label)
          }}
        >
          {relOptionsAll.map(r => (
            <option key={r.to} value={r.to}>{primaryLabel} {r.label}</option>
          ))}
        </select>
        <button className="asb-row-remove asb-rel-card__remove" onClick={onRemove} title="Remove relationship"><IcClose /> Remove</button>
      </div>

      <div className="asb-rel-card__granularity">
        <span className="asb-rel-card__granularity-label">Each assessed item is one:</span>
        <div className="asb-granularity__segs">
          {GRANULARITY_OPTIONS.map(g => (
            <button key={g.key} className={`asb-seg-btn${granularity === g.key ? ' active' : ''}`} onClick={() => onGranularityChange(g.key)}>{g.label}</button>
          ))}
        </div>
      </div>

      <div className="asb-rel-card__divider" />

      <div className="asb-rel-card__filter-head">
        <span className="asb-rel-card__filter-title">Filter the relationship</span>
        <span className="asb-rel-card__filter-desc">edge properties of this link — leave empty to include every link</span>
      </div>

      {filters.map(f => (
        <FilterRow key={f.id} row={f} attrs={EDGE_ATTRS} onChange={next => updateFilter(f.id, next)} onRemove={() => removeFilter(f.id)} />
      ))}

      <div className="asb-filter-draft-row">
        <select className="asb-select" value={draft.attr} onChange={e => setDraft(d => ({ ...d, attr: e.target.value }))}>
          <option value="">Attribute…</option>
          {EDGE_ATTRS.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select className="asb-select asb-select--op" value={draft.op} onChange={e => setDraft(d => ({ ...d, op: e.target.value }))}>
          {OPERATORS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
        </select>
        {!draftNoValue && (
          <input className="asb-input" placeholder="Value…" value={draft.val} onChange={e => setDraft(d => ({ ...d, val: e.target.value }))} />
        )}
        <button className="asb-add-filter-btn" onClick={commitDraft} disabled={!draft.attr}><IcPlus /> Add filter</button>
      </div>
    </div>
  )
}

// ── Condition row ─────────────────────────────────────────────────
function ConditionRow({ row, attrOptions, onChange, onRemove, isFirst, joiner, onJoinerChange, dotColor }) {
  const noValue = NO_VALUE_OPS.has(row.op)
  return (
    <div className="asb-cond-row2">
      {isFirst ? (
        <span className="asb-cond-prefix asb-cond-prefix--if">IF</span>
      ) : (
        <div className="asb-cond-joiner2">
          <span className="asb-cond-joiner2__thumb" />
          {['AND', 'OR'].map(j => (
            <button key={j} className={`asb-joiner-btn${joiner === j ? ' active' : ''}`} onClick={() => onJoinerChange(j)}>{j}</button>
          ))}
        </div>
      )}
      {dotColor && <span className="asb-cond-dot" style={{ background: dotColor }} />}
      {row.advanced ? (
        <input
          className="asb-input asb-cond-expr-input"
          placeholder="e.g. array_contains(tags, 'prod') AND severity != 'low'"
          value={row.expr}
          onChange={e => onChange({ ...row, expr: e.target.value })}
        />
      ) : (
        <>
          <select className="asb-select" value={row.attr} onChange={e => onChange({ ...row, attr: e.target.value })}>
            <option value="">Attribute…</option>
            {attrOptions.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
          </select>
          <select className="asb-select asb-select--op" value={row.op} onChange={e => onChange({ ...row, op: e.target.value })}>
            {OPERATORS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
          </select>
          {!noValue && (
            <input className="asb-input" placeholder="Value…" value={row.val} onChange={e => onChange({ ...row, val: e.target.value })} />
          )}
        </>
      )}
      <button
        className={`asb-fx-btn${row.advanced ? ' active' : ''}`}
        onClick={() => onChange({ ...row, advanced: !row.advanced })}
        title="Advanced expression"
      >fx</button>
      <button className="asb-row-remove" onClick={onRemove} title="Remove condition"><IcTrash /></button>
    </div>
  )
}

// The "Compliant when" card — heading + a block of condition rows
function ConditionBlock({ subtitle, rows, attrOptions, onUpdate, onRemove, onJoiner, onAdd, dotColorFor }) {
  const last = rows[rows.length - 1]
  const canAdd = filterComplete(last)
  return (
    <div className="asb-ccard">
      <div className="asb-ccard__head">
        <div className="asb-ccard__title">Compliant when</div>
        <div className="asb-ccard__subtitle">{subtitle}</div>
      </div>
      {rows.map((c, i) => (
        <ConditionRow
          key={c.id}
          row={c}
          attrOptions={attrOptions}
          onChange={next => onUpdate(c.id, next)}
          onRemove={() => onRemove(c.id)}
          isFirst={i === 0}
          joiner={c.joiner}
          onJoinerChange={j => onJoiner(c.id, j)}
          dotColor={dotColorFor ? dotColorFor(c) : null}
        />
      ))}
      <button className="asb-add-condition-btn" onClick={onAdd} disabled={!canAdd}>
        <IcPlus /> Add Condition
      </button>
    </div>
  )
}

// ── Assessment metadata card (auto-generated name + description) ──
function AssessmentMetadataCard({ name, nameEdited, onNameChange, description, descEdited, onDescriptionChange }) {
  return (
    <div className="asb-meta-card">
      <div className="asb-meta-block">
        <div className="asb-meta-label-row">
          <span className="asb-meta-label">Assessment Name</span>
          {!nameEdited && <span className="asb-auto-badge">Auto-generated</span>}
        </div>
        <input
          className="asb-meta-input"
          value={name}
          placeholder="Pick a condition to generate a name"
          onChange={e => onNameChange(e.target.value)}
        />
      </div>
      <div className="asb-meta-block">
        <div className="asb-meta-label-row">
          <span className="asb-meta-label">Assessment Description</span>
          {!descEdited && <span className="asb-auto-badge">Auto-generated</span>}
        </div>
        <textarea
          className="asb-meta-input asb-meta-textarea"
          rows={2}
          value={description}
          onChange={e => onDescriptionChange(e.target.value)}
        />
      </div>
    </div>
  )
}

// ── Table column picker popover ───────────────────────────────────
function ColumnPicker({ entities, grainKey, existingKeys, pending, onPick, onClose }) {
  const [search, setSearch] = useState('')
  const q = search.trim().toLowerCase()
  return (
    <div className="asb-colpicker-overlay" onClick={onClose}>
      <div className="asb-colpicker" onClick={e => e.stopPropagation()}>
        <input
          className="asb-input asb-colpicker-search"
          placeholder="Search attributes…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          autoFocus
        />
        <div className="asb-colpicker-list">
          {entities.map(entity => {
            const attrs = entity.attrs.filter(a => !q || a.toLowerCase().includes(q))
            if (!attrs.length) return null
            return (
              <div key={entity.key} className="asb-colpicker-group">
                <div className="asb-colpicker-group__label" style={{ color: entity.color }}>{entity.label}</div>
                {attrs.map(a => {
                  const added = existingKeys.has(`${entity.key}:${a}`)
                  const isPending = pending && pending.entityKey === entity.key && pending.attr === a
                  return (
                    <div key={a} className="asb-colpicker-item">
                      <button
                        className={`asb-colpicker-opt${added ? ' asb-colpicker-opt--added' : ''}`}
                        disabled={added}
                        onClick={() => onPick(entity.key, a)}
                      >
                        {added && <IcCheck />} {a}
                      </button>
                      {isPending && (
                        <div className="asb-grain-warning">
                          {entity.key === grainKey
                            ? null
                            : <>Adding this changes the grain — rows will fan out to one row per {entity.label.toLowerCase()}.</>}
                          <button className="asb-add-link" onClick={() => onPick(entity.key, a)}>Add anyway</button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Name / phrase generation ───────────────────────────────────────
function conditionPhrase(row) {
  if (row.advanced) return row.expr ? `meets \`${row.expr}\`` : ''
  if (!row.attr || !row.op) return ''
  const truthy = /^(true|enabled|yes|passed|active)$/i.test(row.val || '')
  const falsy = /^(false|disabled|no|failed|inactive)$/i.test(row.val || '')
  if (row.op === 'is_null') return `have no ${row.attr.toLowerCase()}`
  if (row.op === 'is_not_null') return `have a ${row.attr.toLowerCase()}`
  if (truthy) return `should have ${row.attr.toLowerCase()}`
  if (falsy) return `should not have ${row.attr.toLowerCase()}`
  if (row.op === 'contains') return `${row.attr.toLowerCase()} contains "${row.val}"`
  return `${row.attr.toLowerCase()} ${OPERATORS.find(o => o.key === row.op)?.label || row.op} ${row.val}`
}

function scopeEntityLabel(scope) {
  const entities = [scope.primary, ...scope.union].filter(Boolean).map(n => ENTITY_BY_KEY[n.key])
  return entities.map(e => e.label + (e.label.endsWith('s') ? '' : 's')).join(' or ')
}

function genName(scope, conditions) {
  if (!scope.primary) return ''
  const label = scopeEntityLabel(scope)
  const complete = conditions.filter(filterComplete)
  if (!complete.length) return ''
  let phrase = conditionPhrase(complete[0])
  if (complete.length > 1) phrase += ` (+${complete.length - 1} more)`
  return `${label} ${phrase}`
}

function genDescription(scope, conditions, name) {
  if (!scope.primary) return ''
  const entities = [scope.primary, ...scope.union].filter(Boolean).map(n => ENTITY_BY_KEY[n.key])
  const labelJoined = entities.map(e => e.label).join(' or ')
  const complete = conditions.filter(filterComplete)
  if (!complete.length) return `This assessment evaluates All ${labelJoined} entities. Define a condition to complete the description.`
  const parts = complete.map(conditionPhrase)
  return `This assessment evaluates ${labelJoined.toLowerCase()} assets in scope. Each in-scope item is marked compliant when it ${parts.join(' and ')}; those that fail are raised as findings.`
}

function scopeSummaryText(scope) {
  if (!scope.primary) return null
  const parts = [scope.primary, ...scope.union].map(n => {
    const e = ENTITY_BY_KEY[n.key]
    const nf = n.filters.filter(filterComplete).length
    return `${e.label}${nf > 0 ? ` · ${nf} filter${nf > 1 ? 's' : ''}` : ''}`
  })
  let text = parts.join(' OR ')
  if (scope.relationship) {
    const re = ENTITY_BY_KEY[scope.relationship.key]
    const rn = scope.relationship.filters.filter(filterComplete).length
    const en = (scope.relationship.edgeFilters || []).filter(filterComplete).length
    text += ` → ${scope.relationship.label}${en > 0 ? ` (${en} edge filter${en > 1 ? 's' : ''})` : ''} → ${re.label}${rn > 0 ? ` · ${rn} filter${rn > 1 ? 's' : ''}` : ''}`
  }
  return text
}

function conditionSummaryText(condMode, conditions, perEntityConditions, scope) {
  if (condMode === 'shared') {
    const complete = conditions.filter(filterComplete)
    if (!complete.length) return null
    return complete.map((c, i) => `${i > 0 ? ` ${c.joiner} ` : ''}${conditionPhrase(stripPrefix(c))}`).join('')
  }
  const entities = [scope.primary, ...scope.union].filter(Boolean)
  const parts = entities.map(node => {
    const e = ENTITY_BY_KEY[node.key]
    const rows = (perEntityConditions[node.key] || []).filter(filterComplete)
    if (!rows.length) return null
    const phrase = rows.map((c, i) => `${i > 0 ? ` ${c.joiner} ` : ''}${conditionPhrase(stripPrefix(c))}`).join('')
    return `${e.label}: ${phrase}`
  }).filter(Boolean)
  return parts.length ? parts.join(' · ') : null
}

// ── Persistent right-hand assessment summary panel ────────────────
function PreviewSection({ label, entity, text }) {
  return (
    <div className="asb-prev-section">
      <div className="asb-prev-label">{label}</div>
      {entity && (
        <div className="asb-prev-entity-row">
          <span className="asb-prev-entity-icon" style={{ '--asb-entity-color': entity.color }}><img src={entity.icon} width={13} height={13} alt="" /></span>
          <span className="asb-prev-entity-name">{entity.label}</span>
        </div>
      )}
      <div className="asb-prev-text">{text}</div>
    </div>
  )
}

function AssessmentSummaryPanel({ scope, scopeSummary, conditionSummary }) {
  const primaryEntity = scope.primary ? ENTITY_BY_KEY[scope.primary.key] : null
  const scopeText = scopeSummary || (primaryEntity ? `All ${primaryEntity.label} · no filter` : 'No entity selected yet')
  const conditionText = conditionSummary || (primaryEntity ? `All ${primaryEntity.label} · no condition set yet` : 'Define after scope is set')

  return (
    <div className="asb-sum-panel">
      <PreviewSection label="Scope" entity={primaryEntity} text={scopeText} />
      <PreviewSection label="Condition" text={conditionText} />
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
const AssessmentBuilder = forwardRef(function AssessmentBuilder({ onClose, onDeploy, skipGuide, onUseNavigator }, ref) {
  const [step, setStep] = useState(1)
  const [maxReached, setMaxReached] = useState(1)
  const [summaryPreviewOpen, setSummaryPreviewOpen] = useState(false)
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false)
  const requestClose = () => { if (onClose) setCancelConfirmOpen(true) }
  const confirmCancel = () => { setCancelConfirmOpen(false); onClose() }
  const [showGuide, setShowGuide] = useState(() => {
    if (skipGuide) return false
    try { return localStorage.getItem('asb-onboard-guide-dismissed') !== '1' } catch { return true }
  })

  // ── Scope state ──
  const [scope, setScope] = useState({ primary: null, union: [], relationship: null, granularity: 'primary' })
  const primaryEntity = scope.primary ? ENTITY_BY_KEY[scope.primary.key] : null
  const relatedEntity = scope.relationship ? ENTITY_BY_KEY[scope.relationship.key] : null
  const unionEntities = scope.union.map(u => ENTITY_BY_KEY[u.key])

  const usedKeys = useMemo(() => new Set([
    scope.primary?.key,
    ...scope.union.map(u => u.key),
    scope.relationship?.key,
  ].filter(Boolean)), [scope])

  const pickPrimary = (key) => { setScope({ primary: { key, filters: [] }, union: [], relationship: null, granularity: 'primary' }); setTableColumns([]) }
  const setPrimaryFilters = (filters) => setScope(s => ({ ...s, primary: { ...s.primary, filters } }))
  const addPrimaryFilter = (attr, op, val) => setScope(s => ({ ...s, primary: { ...s.primary, filters: [...(s.primary?.filters || []), { id: uid('f'), attr, op, val }] } }))
  const removePrimary = () => {
    setScope(s => {
      if (s.union.length === 0) return { primary: null, union: [], relationship: null, granularity: 'primary' }
      const [newPrimary, ...restUnion] = s.union
      return { primary: newPrimary, union: restUnion, relationship: null, granularity: 'primary' }
    })
    setTableColumns([])
  }

  // ── Union scope (OR additional entity types) ──
  const [unionPicking, setUnionPicking] = useState(false)
  const addUnionMember = (key) => { setScope(s => ({ ...s, union: [...s.union, { key, filters: [] }] })); setUnionPicking(false) }
  const setUnionFilters = (idx, filters) => setScope(s => ({ ...s, union: s.union.map((u, i) => i === idx ? { ...u, filters } : u) }))
  const removeUnionMember = (idx) => setScope(s => ({ ...s, union: s.union.filter((_, i) => i !== idx) }))

  // ── Relationship scope ──
  const relOptions = primaryEntity ? (RELATIONSHIP_OPTIONS[primaryEntity.key] || []).filter(r => !usedKeys.has(r.to)) : []
  const relOptionsAll = primaryEntity ? (RELATIONSHIP_OPTIONS[primaryEntity.key] || []) : []
  const [relPicking, setRelPicking] = useState(false)
  const addRelationship = (toKey, label) => { setScope(s => ({ ...s, relationship: { key: toKey, label, filters: [], edgeFilters: [] } })); setRelPicking(false) }
  const changeRelationshipType = (toKey, label) => setScope(s => ({ ...s, relationship: { key: toKey, label, filters: [], edgeFilters: [] } }))
  const setRelFilters = (filters) => setScope(s => ({ ...s, relationship: { ...s.relationship, filters } }))
  const setRelEdgeFilters = (filters) => setScope(s => ({ ...s, relationship: { ...s.relationship, edgeFilters: filters } }))
  const removeRelationship = () => setScope(s => ({ ...s, relationship: null, granularity: 'primary' }))
  const setGranularity = (g) => setScope(s => ({ ...s, granularity: g }))

  // ── Condition state ──
  const [condMode, setCondMode] = useState('shared') // 'shared' | 'perEntity'
  useEffect(() => { if (scope.union.length === 0 && condMode === 'perEntity') setCondMode('shared') }, [scope.union.length, condMode])

  const [conditions, setConditions] = useState([newConditionRow()])
  const sharedAttrOptions = useMemo(() => {
    if (!primaryEntity) return []
    const entities = [primaryEntity, ...unionEntities]
    let opts
    if (entities.length > 1) {
      const common = entities[0].attrs.filter(a => entities.every(e => e.attrs.includes(a)))
      opts = common.map(a => ({ value: `shared:${a}`, label: `${a} (all types)` }))
    } else {
      opts = primaryEntity.attrs.map(a => ({ value: `${primaryEntity.key}:${a}`, label: `${primaryEntity.label} · ${a}` }))
    }
    if (relatedEntity) relatedEntity.attrs.forEach(a => opts.push({ value: `${relatedEntity.key}:${a}`, label: `${relatedEntity.label} · ${a}` }))
    return opts
  }, [primaryEntity, unionEntities, relatedEntity])

  const updateCondition = (id, next) => setConditions(cs => cs.map(c => c.id === id ? next : c))
  const removeCondition = (id) => setConditions(cs => cs.length > 1 ? cs.filter(c => c.id !== id) : cs)
  const setJoiner = (id, joiner) => setConditions(cs => cs.map(c => c.id === id ? { ...c, joiner } : c))
  const addCondition = () => { if (filterComplete(conditions[conditions.length - 1])) setConditions(cs => [...cs, newConditionRow()]) }
  const sharedDotColor = (row) => {
    if (!row.attr.includes(':')) return null
    const key = row.attr.split(':')[0]
    if (key === 'shared') return 'var(--shell-accent)'
    return ENTITY_BY_KEY[key]?.color || null
  }

  // ── Per-entity-type condition rules ──
  const [perEntityConditions, setPerEntityConditions] = useState({})
  useEffect(() => {
    if (condMode !== 'perEntity') return
    const keys = [scope.primary?.key, ...scope.union.map(u => u.key)].filter(Boolean)
    setPerEntityConditions(prev => {
      const next = { ...prev }
      let changed = false
      keys.forEach(k => { if (!next[k]) { next[k] = [newConditionRow()]; changed = true } })
      return changed ? next : prev
    })
  }, [condMode, scope.primary, scope.union])

  const perEntityAttrOptions = useCallback((entity) => {
    const opts = entity.attrs.map(a => ({ value: `${entity.key}:${a}`, label: a }))
    if (relatedEntity) relatedEntity.attrs.forEach(a => opts.push({ value: `${relatedEntity.key}:${a}`, label: `${relatedEntity.label} · ${a}` }))
    return opts
  }, [relatedEntity])

  const updatePerEntityCondition = (key, id, next) => setPerEntityConditions(pc => ({ ...pc, [key]: (pc[key] || []).map(c => c.id === id ? next : c) }))
  const removePerEntityCondition = (key, id) => setPerEntityConditions(pc => {
    const rows = pc[key] || []
    return { ...pc, [key]: rows.length > 1 ? rows.filter(c => c.id !== id) : rows }
  })
  const setPerEntityJoiner = (key, id, joiner) => setPerEntityConditions(pc => ({ ...pc, [key]: (pc[key] || []).map(c => c.id === id ? { ...c, joiner } : c) }))
  const addPerEntityCondition = (key) => setPerEntityConditions(pc => {
    const rows = pc[key] || []
    if (rows.length && !filterComplete(rows[rows.length - 1])) return pc
    return { ...pc, [key]: [...rows, newConditionRow()] }
  })

  // ── Naming ──
  const activeConditionsForName = condMode === 'shared' ? conditions : (perEntityConditions[scope.primary?.key] || [])
  const conditionsForName = useMemo(() => activeConditionsForName.map(stripPrefix), [activeConditionsForName])
  const autoName = useMemo(() => genName(scope, conditionsForName), [scope, conditionsForName])
  const [name, setName] = useState('')
  const [nameEdited, setNameEdited] = useState(false)
  useEffect(() => { if (!nameEdited) setName(autoName) }, [autoName, nameEdited])

  const autoDescription = useMemo(() => genDescription(scope, conditionsForName, name), [scope, conditionsForName, name])
  const [description, setDescription] = useState('')
  const [descEdited, setDescEdited] = useState(false)
  useEffect(() => { if (!descEdited) setDescription(autoDescription) }, [autoDescription, descEdited])

  const scopeSummary = useMemo(() => scopeSummaryText(scope), [scope])
  const conditionSummary = useMemo(() => conditionSummaryText(condMode, conditions, perEntityConditions, scope), [condMode, conditions, perEntityConditions, scope])
  const condSubjectLabel = [primaryEntity, ...unionEntities].filter(Boolean).map(e => e.label).join(' or ')

  const scopeComplete = !!scope.primary
  const conditionComplete = condMode === 'shared'
    ? conditions.some(filterComplete)
    : Object.values(perEntityConditions).some(rows => rows.some(filterComplete))
  const canValidate = scopeComplete && conditionComplete

  const estPrimaryCount = scope.primary ? estimateScopeCount(scope.primary.key, scope.primary.filters.filter(filterComplete)) : 0
  const estUnionCount = scope.union.reduce((sum, u) => sum + estimateScopeCount(u.key, u.filters.filter(filterComplete)), 0)
  const estScopeTotal = estPrimaryCount + estUnionCount
  const estRelatedCount = scope.relationship ? estimateScopeCount(scope.relationship.key, scope.relationship.filters.filter(filterComplete)) : 0

  // ── Validation state ──
  const [validating, setValidating] = useState(false)
  const [validated, setValidated] = useState(false)
  const [createdAt] = useState(() => new Date())
  const createdAtLabel = useMemo(() => {
    const day = createdAt.getDate()
    const month = createdAt.toLocaleString('en-US', { month: 'long' })
    return `${day} / ${month} / ${createdAt.getFullYear()}`
  }, [createdAt])
  const runValidation = () => {
    setValidating(true)
    setTimeout(() => { setValidating(false); setValidated(true) }, 900)
  }
  const passPct = useMemo(() => 30 + (hashStr(name) % 55), [name])
  const passCount = Math.round(estScopeTotal * passPct / 100)
  const failCount = estScopeTotal - passCount

  // ── Table output / columns ──
  const grainKey = scope.primary?.key
  const [tableColumns, setTableColumns] = useState([])
  useEffect(() => {
    if (grainKey && tableColumns.length === 0) {
      const e = ENTITY_BY_KEY[grainKey]
      setTableColumns(e.attrs.slice(0, 2).map(a => ({ id: uid('col'), entityKey: grainKey, attr: a })))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grainKey])
  const tableEntities = useMemo(() => {
    const list = [primaryEntity, ...unionEntities]
    if (relatedEntity) list.push(relatedEntity)
    return list.filter(Boolean)
  }, [primaryEntity, unionEntities, relatedEntity])
  const [colPickerOpen, setColPickerOpen] = useState(false)
  const [pendingGrainAdd, setPendingGrainAdd] = useState(null)
  const existingColKeys = useMemo(() => new Set(tableColumns.map(c => `${c.entityKey}:${c.attr}`)), [tableColumns])
  const addColumn = (entityKey, attr) => {
    if (existingColKeys.has(`${entityKey}:${attr}`)) return
    if (entityKey !== grainKey && !(pendingGrainAdd && pendingGrainAdd.entityKey === entityKey && pendingGrainAdd.attr === attr)) {
      setPendingGrainAdd({ entityKey, attr })
      return
    }
    setTableColumns(cols => [...cols, { id: uid('col'), entityKey, attr }])
    setPendingGrainAdd(null)
  }
  const removeColumn = (id) => setTableColumns(cols => cols.filter(c => c.id !== id))
  const [tableSearch, setTableSearch] = useState('')
  const SAMPLE_ROW_IDXS = [0, 1, 2, 3, 4]
  const filteredRowIdxs = useMemo(() => {
    const q = tableSearch.trim().toLowerCase()
    if (!q) return SAMPLE_ROW_IDXS
    return SAMPLE_ROW_IDXS.filter(rowIdx =>
      tableColumns.some(c => String(sampleValue(c.entityKey, c.attr, rowIdx)).toLowerCase().includes(q))
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableSearch, tableColumns])

  // ── Contribution state ──
  const [contribCCM, setContribCCM] = useState(true)
  const [contribExposure, setContribExposure] = useState(false)
  const [criticalLimit, setCriticalLimit] = useState(10)
  const [warningThreshold, setWarningThreshold] = useState(25)
  const [alertEnabled, setAlertEnabled] = useState(true)
  const canDeploy = contribCCM || contribExposure

  // ── Framework mapping (CCM) ──
  const [mapFramework, setMapFramework] = useState('')
  const [mapLevelValues, setMapLevelValues] = useState({})
  const [automapped, setAutomapped] = useState([])
  const setMapFrameworkAndReset = (fw) => { setMapFramework(fw); setMapLevelValues({}) }
  const applyMapping = (fwOverride) => {
    const fw = fwOverride || mapFramework
    const hier = FW_HIERARCHY[fw]
    if (!hier) return
    const primaryRow = {
      id: uid('map'),
      frameworkKey: fw,
      frameworkName: hier.name,
      levels: hier.levels.map(l => ({ key: l.key, value: mapLevelValues[l.key] || l.options[0] })),
      severity: SEVERITIES[hashStr(name + fw) % SEVERITIES.length],
      auto: false,
    }
    const relatedRows = (CROSS_FRAMEWORK_MAP[fw] || []).map(relKey => {
      const relHier = FW_HIERARCHY[relKey]
      return {
        id: uid('map'),
        frameworkKey: relKey,
        frameworkName: relHier.name,
        levels: relHier.levels.map(l => ({ key: l.key, value: l.options[0] })),
        severity: SEVERITIES[hashStr(name + relKey) % SEVERITIES.length],
        auto: true,
      }
    })
    setAutomapped(rows => [
      ...rows.filter(r => r.frameworkKey !== fw && !relatedRows.some(rr => rr.frameworkKey === r.frameworkKey)),
      primaryRow,
      ...relatedRows,
    ])
  }
  const updateMappingLevel = (rowId, levelKey, value) => setAutomapped(rows => rows.map(r => r.id === rowId ? { ...r, levels: r.levels.map(l => l.key === levelKey ? { ...l, value } : l) } : r))
  const removeMappingRow = (rowId) => setAutomapped(rows => rows.filter(r => r.id !== rowId))

  // ── Deploy state ──
  const [previewOpen, setPreviewOpen] = useState(false)

  const goto = (n) => { setStep(n); setMaxReached(m => Math.max(m, n)) }
  const next = () => goto(step + 1)

  const deploy = () => {
    setPreviewOpen(false)
    onDeploy({
      id: uid('new-a'),
      name,
      description,
      entity: LIST_BADGE_BY_KEY[primaryEntity.key] || 'multi',
      entityLabel: primaryEntity.label,
      closed: 0,
      open: 0,
      pct: 0,
      rating: 'Weak',
      frameworks: contribCCM ? (automapped.length ? automapped.map(r => r.frameworkKey) : ['scf']) : [],
      pending: true,
    })
  }

  // ── Imperative API for the Copilot-driven guided builder ──
  useImperativeHandle(ref, () => ({
    pickPrimary,
    addPrimaryFilter,
    setSharedCondition: (attr, op, val) => {
      const value = scope.primary ? `${scope.primary.key}:${attr}` : attr
      setConditions(cs => cs.length
        ? [{ ...cs[0], attr: value, op, val }, ...cs.slice(1)]
        : [{ ...newConditionRow(), attr: value, op, val }])
    },
    goToStep: goto,
    runValidation,
    setContribution: (ccm, exposure) => { setContribCCM(ccm); setContribExposure(exposure) },
    applyFrameworkMapping: (fwKey) => { setMapFrameworkAndReset(fwKey); applyMapping(fwKey) },
    openPreview: () => setPreviewOpen(true),
    confirmDeploy: deploy,
    getSnapshot: () => ({
      step, name, scopeSummary, conditionSummary,
      estScopeTotal, passPct, passCount, failCount,
      validated, contribCCM, contribExposure, automapped,
    }),
  }))

  return (
    <div className="asb-page">
      <div className="asb-stepper-row">
        {onClose && (
          <button className="asb-stepper-back-btn" onClick={requestClose} aria-label="Back to assessments">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
        )}
        <Stepper step={step} maxReached={maxReached} onJump={goto} />
        <button className="asb-stepper-preview-btn" onClick={() => setSummaryPreviewOpen(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"/><circle cx="12" cy="12" r="3"/>
          </svg>
          Preview
        </button>
      </div>

      {showGuide && <OnboardingGuide onDismiss={() => setShowGuide(false)} />}

      <div className="asb-body">
       <div className="asb-layout">
        <div className="asb-main-col">
        {/* ── Step 1: Scope & Condition ── */}
        {step === 1 && (
          <>
              <div className="asb-section-row">
                <div className="asb-section-title">{scope.primary ? 'Scope & Condition' : 'Select an Entity'}</div>
                {onUseNavigator && (
                  <button className="asb-use-nav-btn asb-nav-gradient" onClick={onUseNavigator}>
                    <img src="assets/icons/Navigator icon.svg" width={14} height={14} alt="" className="asb-nav-icon" /> Use Navigator
                  </button>
                )}
              </div>

              {!scope.primary && (
                <>
                  <div className="asb-banner">
                    <span className="asb-banner__lead">Pick the entity this assessment evaluates</span>{' '}
                    <span className="asb-banner__rest">narrow it with attribute filters (e.g. Type = Volume). Click <strong>Add Filter</strong> for each, then Mark as scope to continue</span>
                  </div>

                  <EntityGrid onPick={pickPrimary} selectedKey={scope.primary?.key} />
                </>
              )}

              {scope.primary && (
                <ScopePathCard
                  scope={scope}
                  estTotal={estScopeTotal}
                  onAddUnion={() => { setRelPicking(false); setUnionPicking(true) }}
                  onAddRelationship={() => { setUnionPicking(false); setRelPicking(true) }}
                  canAddRelationship={relOptions.length > 0}
                />
              )}

              {unionPicking && (
                <div className="asb-rel-picker">
                  <div className="asb-rel-picker__label">Pick another entity type to OR into scope</div>
                  <EntityGrid onPick={addUnionMember} disabledKeys={usedKeys} />
                  <div className="asb-rel-picker__footer">
                    <button className="asb-picker-cancel-btn" onClick={() => setUnionPicking(false)}>Cancel</button>
                  </div>
                </div>
              )}

              {relPicking && (
                <div className="asb-rel-picker">
                  {relOptions.length === 0 && <div className="asb-empty-hint">No known relationships for this entity yet.</div>}
                  {relOptions.map(r => (
                    <button key={r.to} className="asb-rel-option" onClick={() => addRelationship(r.to, r.label)}>
                      <IcLink /> {r.label} → {ENTITY_BY_KEY[r.to].label}
                    </button>
                  ))}
                  <div className="asb-rel-picker__footer">
                    <button className="asb-picker-cancel-btn" onClick={() => setRelPicking(false)}>Cancel</button>
                  </div>
                </div>
              )}

              {scope.primary && (
                <EntityCard
                  badge="PRIMARY"
                  entity={primaryEntity}
                  filters={scope.primary.filters}
                  onFiltersChange={setPrimaryFilters}
                  onRemoveEntity={removePrimary}
                />
              )}

              {scope.union.map((u, idx) => (
                <EntityCard
                  key={u.key + idx}
                  badge="OR"
                  entity={ENTITY_BY_KEY[u.key]}
                  filters={u.filters}
                  onFiltersChange={filters => setUnionFilters(idx, filters)}
                  onRemoveEntity={() => removeUnionMember(idx)}
                />
              ))}

              {scope.relationship && (
                <>
                  <RelationshipEdgeCard
                    primaryLabel={primaryEntity.label}
                    relOptionsAll={relOptionsAll}
                    currentKey={scope.relationship.key}
                    onChangeType={changeRelationshipType}
                    onRemove={removeRelationship}
                    filters={scope.relationship.edgeFilters || []}
                    onFiltersChange={setRelEdgeFilters}
                    granularity={scope.granularity}
                    onGranularityChange={setGranularity}
                  />

                  <EntityCard
                    badge="RELATED"
                    entity={relatedEntity}
                    filters={scope.relationship.filters}
                    onFiltersChange={setRelFilters}
                    onRemoveEntity={removeRelationship}
                  />
                </>
              )}

              {scope.primary && (
                <>
                  <hr className="asb-section-divider" />

                  {scope.union.length > 0 && (
                    <div className="asb-condmode-toggle">
                      <button className={`asb-contrib-chip${condMode === 'shared' ? ' active' : ''}`} onClick={() => setCondMode('shared')}>
                        {condMode === 'shared' && <IcCheck />} Shared rule
                      </button>
                      <button className={`asb-contrib-chip${condMode === 'perEntity' ? ' active' : ''}`} onClick={() => setCondMode('perEntity')}>
                        {condMode === 'perEntity' && <IcCheck />} Rules per type
                      </button>
                    </div>
                  )}

                  {condMode === 'shared' ? (
                    <ConditionBlock
                      subtitle={`A ${condSubjectLabel} in scope is compliant when the rules below pass.`}
                      rows={conditions}
                      attrOptions={sharedAttrOptions}
                      onUpdate={updateCondition}
                      onRemove={removeCondition}
                      onJoiner={setJoiner}
                      onAdd={addCondition}
                      dotColorFor={sharedDotColor}
                    />
                  ) : (
                    [scope.primary, ...scope.union].map(node => {
                      const e = ENTITY_BY_KEY[node.key]
                      const rows = perEntityConditions[node.key] || [newConditionRow()]
                      return (
                        <div key={node.key} className="asb-perentity-block">
                          <div className="asb-perentity-block__label">
                            <span className="asb-cond-dot" style={{ background: e.color }} /> {e.label}
                          </div>
                          <ConditionBlock
                            subtitle={`A ${e.label} in scope is compliant when the rules below pass.`}
                            rows={rows}
                            attrOptions={perEntityAttrOptions(e)}
                            onUpdate={(id, next) => updatePerEntityCondition(node.key, id, next)}
                            onRemove={id => removePerEntityCondition(node.key, id)}
                            onJoiner={(id, j) => setPerEntityJoiner(node.key, id, j)}
                            onAdd={() => addPerEntityCondition(node.key)}
                          />
                        </div>
                      )
                    })
                  )}
                </>
              )}

              {scope.primary && <hr className="asb-section-divider" />}

              {scope.primary && (
                <AssessmentMetadataCard
                  name={name}
                  nameEdited={nameEdited}
                  onNameChange={v => { setName(v); setNameEdited(true) }}
                  description={description}
                  descEdited={descEdited}
                  onDescriptionChange={v => { setDescription(v); setDescEdited(true) }}
                />
              )}
          </>
        )}

        {/* ── Step 2: Validation ── */}
        {step === 2 && (
          <>
            <div className="asb-section-row">
              <div className="asb-section-title">Validation</div>
              {onUseNavigator && (
                <button className="asb-use-nav-btn asb-nav-gradient" onClick={onUseNavigator}>
                  <img src="assets/icons/Navigator icon.svg" width={14} height={14} alt="" className="asb-nav-icon" /> Use Navigator
                </button>
              )}
            </div>
            {!validated ? (
              <div className="asb-validate-gate">
                <p className="asb-validate-copy">Run a dry-run to see how many items fall in scope and preview the assessment's output table.</p>
                <button className="ds-btn sz-md t-primary" disabled={validating} onClick={runValidation}>
                  {validating ? 'Running…' : 'Run validation'}
                </button>
              </div>
            ) : (
              <>
                <div className="asb-val-cards">
                  <div className="asb-val-card">
                    <div className="asb-val-card__title">Analytics</div>
                    <div className="asb-val-metric-row">
                      <span className="asb-val-metric-row__icon asb-val-metric-row__icon--pass"><IcCheckCircle /></span>
                      <span className="asb-val-metric-row__label">Pass percentage</span>
                    </div>
                    <div className="asb-val-bar-row">
                      <div className="asb-val-bar-track"><div className="asb-val-bar-fill" style={{ '--asb-bar-pct': `${passPct}%` }} /></div>
                      <span className="asb-val-bar-pct">{passPct}%</span>
                    </div>
                    <div className="asb-val-stat-row">
                      <span className="asb-val-stat-row__icon"><IcTargetCircle /></span>
                      <span className="asb-val-stat-row__label">Total Scope</span>
                      <span className="asb-val-stat-row__value">{estScopeTotal.toLocaleString()}</span>
                    </div>
                    <div className="asb-val-stat-row">
                      <span className="asb-val-stat-row__icon asb-val-stat-row__icon--pass"><IcCheckCircle /></span>
                      <span className="asb-val-stat-row__label">Passed Checks</span>
                      <span className="asb-val-stat-row__value asb-val-stat-row__value--pass">{passCount.toLocaleString()}</span>
                    </div>
                    <div className="asb-val-stat-row">
                      <span className="asb-val-stat-row__icon asb-val-stat-row__icon--fail"><IcXCircle /></span>
                      <span className="asb-val-stat-row__label">Failed Checks</span>
                      <span className="asb-val-stat-row__value asb-val-stat-row__value--fail">{failCount.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="asb-val-card">
                    <div className="asb-val-card__title">Compliance Impact</div>
                    {COMPLIANCE_IMPACT_PREVIEW.map(ci => (
                      <div key={ci.key} className="asb-ci-row">
                        <span className="asb-ci-badge">{ci.badge}</span>
                        <span className="asb-ci-name">{ci.name}</span>
                        <span className={`asb-ci-delta${ci.up ? ' asb-ci-delta--up' : ' asb-ci-delta--down'}`}>
                          {ci.delta}{ci.up ? <IcCaretUp /> : <IcCaretDown />}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="asb-val-card">
                    <div className="asb-val-card__title">Assessment Summary</div>
                    <div className="asb-sum-row">
                      <span className="asb-sum-row__icon"><IcListLines /></span>
                      <div className="asb-sum-row__body">
                        <div className="asb-sum-row__label">Assessment name</div>
                        <div className="asb-sum-row__value asb-sum-row__value--strong">{name || 'Untitled assessment'}</div>
                      </div>
                    </div>
                    <div className="asb-sum-row">
                      <span className="asb-sum-row__icon"><IcBranch /></span>
                      <div className="asb-sum-row__body">
                        <div className="asb-sum-row__label">Condition</div>
                        <div className="asb-sum-row__value">{conditionSummary}</div>
                      </div>
                    </div>
                    <div className="asb-sum-row">
                      <span className="asb-sum-row__icon"><IcTargetCircle /></span>
                      <div className="asb-sum-row__body">
                        <div className="asb-sum-row__label">Scope</div>
                        <div className="asb-sum-row__value">{scopeSummary}</div>
                      </div>
                    </div>
                    <div className="asb-sum-row">
                      <span className="asb-sum-row__icon"><IcCalendar /></span>
                      <div className="asb-sum-row__body">
                        <div className="asb-sum-row__label">Created at</div>
                        <div className="asb-sum-row__value">{createdAtLabel}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="asb-field-block asb-table-output-head">
                  <div className="asb-table-output-title">
                    Table output <span className="asb-table-output-count">- Visible Attributes ({tableColumns.length})</span>
                  </div>
                  <div className="asb-table-search">
                    <span className="asb-table-search__icon"><IcSearch /></span>
                    <input
                      className="asb-input asb-table-search__input"
                      placeholder="Search Any"
                      value={tableSearch}
                      onChange={e => setTableSearch(e.target.value)}
                    />
                  </div>
                  <div className="asb-add-col-wrap">
                    <button className="asb-use-nav-btn" onClick={() => setColPickerOpen(v => !v)}>
                      <IcPlus /> Add column
                    </button>
                    {colPickerOpen && (
                      <ColumnPicker
                        entities={tableEntities}
                        grainKey={grainKey}
                        existingKeys={existingColKeys}
                        pending={pendingGrainAdd}
                        onPick={addColumn}
                        onClose={() => { setColPickerOpen(false); setPendingGrainAdd(null) }}
                      />
                    )}
                  </div>
                </div>
                <div className="asb-table-hint">
                  <IcInfo /> The selected columns will be the default attributes shown for this assessment.
                </div>
                <div className="asb-table-wrap">
                  <table className="asb-sample-table">
                    <thead>
                      <tr>
                        {tableColumns.map(c => (
                          <th key={c.id}>
                            <span className="asb-sample-th-inner">
                              <span className="asb-sample-th-label">{c.attr}</span>
                              {c.entityKey !== grainKey && <span className="asb-col-badge">{ENTITY_BY_KEY[c.entityKey].label}</span>}
                              <span className="asb-sample-th-sort"><IcSort /></span>
                              <button className="asb-sample-th-remove" onClick={() => removeColumn(c.id)} title="Remove column"><IcClose /></button>
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRowIdxs.map(rowIdx => (
                        <tr key={rowIdx}>
                          {tableColumns.map(c => <td key={c.id}>{sampleValue(c.entityKey, c.attr, rowIdx)}</td>)}
                        </tr>
                      ))}
                      {filteredRowIdxs.length === 0 && (
                        <tr><td className="asb-table-empty" colSpan={tableColumns.length}>No rows match your search.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="asb-field-block">
                  <div className="asb-field-label">Validation steps <span className="asb-auto-tag">Auto-generated</span></div>
                  <ol className="asb-recap-list">
                    <li>Scope: {scopeSummary}</li>
                    <li>Condition: {conditionSummary}</li>
                    <li>Validate: {estScopeTotal.toLocaleString()} items evaluated · {passPct}% compliant</li>
                  </ol>
                </div>
              </>
            )}
          </>
        )}

        {/* ── Step 3: Contribution ── */}
        {step === 3 && (
          <>
            <div className="asb-section-row">
              <div className="asb-section-title">Contribution</div>
              {onUseNavigator && (
                <button className="asb-use-nav-btn asb-nav-gradient" onClick={onUseNavigator}>
                  <img src="assets/icons/Navigator icon.svg" width={14} height={14} alt="" className="asb-nav-icon" /> Use Navigator
                </button>
              )}
            </div>
            <div className="asb-banner">Choose whether this assessment feeds Compliance (CCM) and/or Exposure scoring.</div>
            <div className="asb-contrib-toggles">
              <button className={`asb-contrib-chip${contribCCM ? ' active' : ''}`} onClick={() => setContribCCM(v => !v)}>
                {contribCCM && <IcCheck />} Compliance (CCM)
              </button>
              <button className={`asb-contrib-chip${contribExposure ? ' active' : ''}`} onClick={() => setContribExposure(v => !v)}>
                {contribExposure && <IcCheck />} Exposure
              </button>
            </div>

            {contribCCM && (
              <div className="asb-field-block">
                <div className="asb-field-label">Framework mapping</div>
                <div className="asb-fwmap-controls">
                  <select className="asb-select" value={mapFramework} onChange={e => setMapFrameworkAndReset(e.target.value)}>
                    <option value="">Select framework…</option>
                    {Object.entries(FW_HIERARCHY).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
                  </select>
                  {mapFramework && FW_HIERARCHY[mapFramework].levels.map(l => (
                    <select
                      key={l.key}
                      className="asb-select"
                      value={mapLevelValues[l.key] || ''}
                      onChange={e => setMapLevelValues(v => ({ ...v, [l.key]: e.target.value }))}
                    >
                      <option value="">{l.label}…</option>
                      {l.options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ))}
                  <button className="ds-btn sz-sm t-primary" disabled={!mapFramework} onClick={applyMapping}>Apply &amp; auto-map</button>
                </div>

                {!automapped.length ? (
                  <div className="asb-empty-hint">Select a framework and control values, then apply to see auto-mapped frameworks.</div>
                ) : (
                  <div className="asb-fwmap-rows">
                    {automapped.map(row => (
                      <div key={row.id} className="asb-fwmap-row">
                        <span className={`asb-fwmap-row__badge${row.auto ? '' : ' asb-fwmap-row__badge--mapped'}`}>{row.auto ? 'AUTO' : 'MAPPED'}</span>
                        <span className="asb-fwmap-row__name">{row.frameworkName}</span>
                        {row.levels.map(l => {
                          const levelDef = FW_HIERARCHY[row.frameworkKey].levels.find(x => x.key === l.key)
                          return (
                            <select key={l.key} className="asb-select asb-select--sm" value={l.value} onChange={e => updateMappingLevel(row.id, l.key, e.target.value)}>
                              {levelDef.options.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                          )
                        })}
                        <span className={`asb-fwmap-severity asb-fwmap-severity--${row.severity.toLowerCase()}`}>{row.severity}</span>
                        <button className="asb-row-remove" onClick={() => removeMappingRow(row.id)} title="Remove"><IcClose /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="asb-field-block">
              <div className="asb-field-label">Compliance thresholds</div>
              <div className="asb-threshold-row">
                <label className="asb-threshold-label">Critical limit
                  <input type="number" className="asb-input asb-input--num" value={criticalLimit} onChange={e => setCriticalLimit(+e.target.value)} />%
                </label>
                <label className="asb-threshold-label">Warning threshold
                  <input type="number" className="asb-input asb-input--num" value={warningThreshold} onChange={e => setWarningThreshold(+e.target.value)} />%
                </label>
                <label className="asb-toggle-label">
                  <span className={`asb-toggle${alertEnabled ? ' on' : ''}`} onClick={() => setAlertEnabled(v => !v)}><span className="asb-toggle__knob" /></span>
                  Alert when threshold is breached
                </label>
              </div>
            </div>
          </>
        )}

        {/* ── Step 4: Deploy ── */}
        {step === 4 && (
          <>
            <div className="asb-section-row">
              <div className="asb-section-title">Deploy</div>
              {onUseNavigator && (
                <button className="asb-use-nav-btn asb-nav-gradient" onClick={onUseNavigator}>
                  <img src="assets/icons/Navigator icon.svg" width={14} height={14} alt="" className="asb-nav-icon" /> Use Navigator
                </button>
              )}
            </div>
            <div className="asb-deploy-recap">
              <div className="asb-deploy-recap__row"><span>Name</span><strong>{name}</strong></div>
              <div className="asb-deploy-recap__row"><span>Scope</span><strong>{scopeSummary}</strong></div>
              <div className="asb-deploy-recap__row"><span>Contribution</span><strong>{[contribCCM && 'CCM', contribExposure && 'Exposure'].filter(Boolean).join(' + ') || 'None'}</strong></div>
              {contribCCM && automapped.length > 0 && <div className="asb-deploy-recap__row"><span>Frameworks</span><strong>{automapped.map(r => r.frameworkName).join(', ')}</strong></div>}
              <div className="asb-deploy-recap__row"><span>Thresholds</span><strong>Critical ≤{criticalLimit}% · Warning ≤{warningThreshold}%</strong></div>
            </div>
            <button className="ds-btn sz-md t-primary" disabled={!canDeploy} onClick={() => setPreviewOpen(true)}>Preview &amp; deploy</button>
          </>
        )}
        </div>
       </div>
      </div>

      <div className="asb-footer">
        <span className="asb-footer__hint">
          {step === 1 && !canValidate && 'Add a scope and a condition to continue'}
        </span>
        <div className="asb-footer__actions">
          <button className="ds-btn sz-md t-outline asb-footer-btn" onClick={() => step > 1 ? goto(step - 1) : requestClose()}>
            {step === 1 && <IcClose />}{step > 1 ? 'Back' : 'Cancel'}
          </button>
          {step === 1 && (
            <button className="ds-btn sz-md t-primary asb-footer-btn" disabled={!canValidate} onClick={() => { next(); runValidation() }}>
              <IcPlay /> Run Validation
            </button>
          )}
          {step === 2 && <button className="ds-btn sz-md t-primary" disabled={!validated} onClick={next}>Continue to contribution</button>}
          {step === 3 && <button className="ds-btn sz-md t-primary" disabled={!canDeploy} onClick={next}>Continue to deploy</button>}
        </div>
      </div>

      {summaryPreviewOpen && (
        <div className="ct-overlay" onClick={() => setSummaryPreviewOpen(false)}>
          <div className="ct-modal asb-preview-modal" onClick={e => e.stopPropagation()}>
            <div className="ct-modal__header">
              <div className="ct-modal__title">Assessment preview</div>
              <div className="ct-modal__subtitle">Scope and condition defined so far</div>
            </div>
            <div className="ct-modal__body">
              <AssessmentSummaryPanel scope={scope} scopeSummary={scopeSummary} conditionSummary={conditionSummary} />
            </div>
            <div className="ct-modal__footer">
              <button className="ct-btn ct-btn--cancel" onClick={() => setSummaryPreviewOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {cancelConfirmOpen && (
        <div className="ct-overlay" onClick={() => setCancelConfirmOpen(false)}>
          <div className="ct-modal" onClick={e => e.stopPropagation()}>
            <div className="ct-modal__header">
              <div className="ct-modal__title">Cancel this assessment?</div>
              <div className="ct-modal__subtitle">All progress on this assessment will be lost. This action cannot be undone.</div>
            </div>
            <div className="ct-modal__footer">
              <button className="ct-btn ct-btn--cancel" onClick={() => setCancelConfirmOpen(false)}>Keep editing</button>
              <button className="ct-btn ct-btn--danger" onClick={confirmCancel}>Discard progress</button>
            </div>
          </div>
        </div>
      )}

      {previewOpen && (
        <div className="ct-overlay" onClick={() => setPreviewOpen(false)}>
          <div className="ct-modal asb-preview-modal" onClick={e => e.stopPropagation()}>
            <div className="ct-modal__header">
              <div className="ct-modal__title">Preview &amp; deploy</div>
              <div className="ct-modal__subtitle">Review this assessment before it goes live</div>
            </div>
            <div className="ct-modal__body">
              <div className="asb-deploy-recap">
                <div className="asb-deploy-recap__row"><span>Name</span><strong>{name}</strong></div>
                <div className="asb-deploy-recap__row"><span>Description</span><strong>{description}</strong></div>
                <div className="asb-deploy-recap__row"><span>Scope</span><strong>{scopeSummary}</strong></div>
                <div className="asb-deploy-recap__row"><span>Pass / fail</span><strong>{passCount.toLocaleString()} / {failCount.toLocaleString()}</strong></div>
                <div className="asb-deploy-recap__row"><span>Contribution</span><strong>{[contribCCM && 'CCM', contribExposure && 'Exposure'].filter(Boolean).join(' + ')}</strong></div>
                {contribCCM && automapped.length > 0 && <div className="asb-deploy-recap__row"><span>Frameworks</span><strong>{automapped.map(r => r.frameworkName).join(', ')}</strong></div>}
                <div className="asb-deploy-recap__row"><span>Thresholds</span><strong>Critical ≤{criticalLimit}% · Warning ≤{warningThreshold}%{alertEnabled ? ' · Alerts on' : ''}</strong></div>
              </div>
              <div className="ct-warning">
                <span className="ct-warning-dot" />
                Deploying runs in the background — this assessment will show as pending until it's live, then run with the next pipeline.
              </div>
            </div>
            <div className="ct-modal__footer">
              <button className="ct-btn ct-btn--cancel" onClick={() => setPreviewOpen(false)}>Cancel</button>
              <button className="ct-btn ct-btn--create" onClick={deploy}>Deploy</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

export default AssessmentBuilder
