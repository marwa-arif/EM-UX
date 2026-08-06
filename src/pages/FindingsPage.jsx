import React, { useState, useRef, useEffect } from 'react'
import '../styles/findings.css'
import '../styles/kg.css'
import '../styles/compliance.css'
import '../styles/active-filter-panel.css'
import { DSPillSearch } from '../context/WorkspaceCtx.jsx'
import TablePagination from '../components/TablePagination.jsx'
import DonutChart from '../components/DonutChart.jsx'
import EntityRelSummaryGraph from '../components/EntityRelSummaryGraph.jsx'
import { DrawerShell, DrawerLayout, RecordDetailContent, RelNodeSection, fieldColor, groupCounts, useDrawerNav } from '../components/DrawerShell.jsx'
import { ENTITY_TYPES, EntityGlyph, ASSET_ENTITY_TYPE_KEY } from '../components/entityTypes.jsx'
import { useDownloads } from '../DownloadsContext.jsx'
import { useChartFilters } from '../hooks/useChartFilters.js'
import { useToast } from '../context/ToastCtx.jsx'

// ── Group-by select dropdown (comp-sort pattern, matches other dashboards) ──
const IcChevron = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6"/>
  </svg>
);
function SelectDropdown({ value, onChange, options, fullWidth = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className={`comp-sort-wrap${fullWidth ? ' comp-sort-wrap--full' : ''}`}>
      <button
        className={`comp-sort-btn${fullWidth ? ' comp-select-btn comp-select-btn--full' : ''}${open ? ' comp-sort-btn--active' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        <span>{value}</span>
        <IcChevron />
      </button>
      {open && (
        <div className={`comp-sort-menu${fullWidth ? ' comp-sort-menu--full' : ' comp-sort-menu--right'}`}>
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

// ── Severity palette ─────────────────────────────────────────────
const SEV = {
  Critical: 'var(--pai-crit-fg)',
  High:     'var(--pai-high-fg)',
  Medium:   'var(--pai-med-fg)',
  Low:      'var(--pai-green)',
};

// ── Synthetic per-row dataset ──────────────────────────────────────
// Every dashboard widget below (both stacked bars, both donuts, the table and its header
// count) derives from this one real, filterable population instead of hand-tuned numbers —
// required for click-to-filter cross-filtering to mean anything (clicking a segment filters
// TABLE_ROWS itself, and every widget recomputes from whatever's left). `weight` stands in
// for "how many real findings this row represents" so totals still read in the
// thousands/millions despite a few hundred synthetic rows. Exact totals intentionally don't
// match the previous hand-tuned figures — only the shape (categories, rough proportions)
// carries over.
const FINDING_ARCHETYPES = [
  { title: 'Container has root access',           cat: 'Control Gap',            entityType: 'device',   evidence: 'Container Runs as Root: true',              entityPrefix: 'CONTAINER' },
  { title: 'Secure File Transfer is not enabled',  cat: 'Control Gap',            entityType: 'storage',  evidence: 'Type: Storage Account',                     entityPrefix: 'STORAGE' },
  { title: 'Unpatched Log4j Vulnerability',        cat: 'Software Vulnerability', entityType: 'device',   evidence: 'CVE-2021-44228 detected in dependency',     entityPrefix: 'SVC' },
  { title: 'Public Storage Bucket Exposed',        cat: 'Control Gap',            entityType: 'storage',  evidence: 'Bucket ACL: public-read',                   entityPrefix: 'BUCKET' },
  { title: 'Missing Network Segmentation',         cat: 'Control Gap',            entityType: 'device',   evidence: 'Flat network: true',                        entityPrefix: 'NET' },
  { title: 'Outdated TLS Version',                 cat: 'Software Vulnerability', entityType: 'device',   evidence: 'TLS Version: 1.0',                          entityPrefix: 'GATEWAY' },
  { title: 'Weak IAM Password Policy',              cat: 'Control Gap',            entityType: 'identity', evidence: 'Min Length: 6',                             entityPrefix: 'IDP' },
  { title: 'Unused Security Group Rule',           cat: 'Control Gap',            entityType: 'device',   evidence: 'Rule 0.0.0.0/0:22 unused 90d',              entityPrefix: 'FIREWALL' },
  { title: 'Anomalous Login Pattern Detected',     cat: 'Behavioural Indicator',  entityType: 'identity', evidence: 'Login velocity: 12x baseline',              entityPrefix: 'USER' },
];

const TYPE_POOL            = ['Server', 'Workstation', 'Network', 'Mobile', 'Others'];
const CLOUD_PROVIDER_POOL  = ['AWS', 'Azure', 'GCP', 'On-Prem'];
const OS_FAMILY_POOL       = ['Windows', 'Linux', 'macOS', 'Other'];
const BUSINESS_UNIT_POOL   = ['Engineering', 'Finance', 'Sales', 'HR', 'Legal'];
const DEPLOYMENT_TYPE_POOL = ['Public Cloud', 'Private Cloud', 'On-Premises', 'Hybrid'];
const ATTACK_SURFACE_POOL  = ['Device', 'Cloud', 'Identity'];
const SEVERITY_POOL        = ['Critical', 'High', 'Medium', 'Low'];
const EXPOSURE_BY_SEV      = { Critical: 1000, High: 800, Medium: 550, Low: 300 };

function pick(hash, offset, pool) {
  return pool[parseInt(hash.slice(offset, offset + 4), 16) % pool.length];
}
function pickWeight(hash, offset, min, max) {
  return min + (parseInt(hash.slice(offset, offset + 4), 16) % (max - min));
}

function buildTableRows() {
  const rows = [];
  const perArchetype = 22;
  for (const arch of FINDING_ARCHETYPES) {
    for (let i = 0; i < perArchetype; i++) {
      const h = pseudoHash(`${arch.title}#${i}`);
      const severity = pick(h, 24, SEVERITY_POOL);
      rows.push({
        cat: arch.cat,
        title: arch.title,
        entity: `${arch.entityPrefix}-${h.slice(32, 38).toUpperCase()}`,
        entityType: arch.entityType,
        evidence: arch.evidence,
        impact: severity,
        likelihood: severity,
        exposure: EXPOSURE_BY_SEV[severity],
        severity,
        attackSurface:  pick(h, 0, ATTACK_SURFACE_POOL),
        type:           pick(h, 4, TYPE_POOL),
        cloudProvider:  pick(h, 8, CLOUD_PROVIDER_POOL),
        osFamily:       pick(h, 12, OS_FAMILY_POOL),
        businessUnit:   pick(h, 16, BUSINESS_UNIT_POOL),
        deploymentType: pick(h, 20, DEPLOYMENT_TYPE_POOL),
        weight: pickWeight(h, 28, 200, 6000),
      });
    }
  }
  return rows;
}

const TABLE_ROWS = buildTableRows();

// ── Aggregation helpers — every widget recomputes from `filteredRows` through these ──
function aggregateStackedBars(rows, groupField) {
  const groups = new Map();
  for (const r of rows) {
    if (!groups.has(r[groupField])) groups.set(r[groupField], new Map());
    const sevMap = groups.get(r[groupField]);
    sevMap.set(r.severity, (sevMap.get(r.severity) || 0) + r.weight);
  }
  return [...groups.entries()].map(([value, sevMap]) => {
    const groupTotal = [...sevMap.values()].reduce((a, b) => a + b, 0) || 1;
    const segs = SEVERITY_POOL.filter(s => sevMap.has(s)).map(sev => ({
      pct: Math.round((sevMap.get(sev) / groupTotal) * 100),
      count: sevMap.get(sev),
      sev,
    }));
    return { label: value.split(' '), value, segs };
  });
}

function formatTotal(n) {
  if (n >= 1e6) return `${(n / 1e6).toFixed(2).replace(/0+$/, '').replace(/\.$/, '')}M`;
  if (n >= 1e3) return `${Math.round(n / 1e3)}k`;
  return String(Math.round(n));
}

const DONUT_ICONS = ['server', 'monitor', 'network', 'mobile', 'other'];

function aggregateDonut(rows, groupField, titleLabel, valueFn) {
  const groups = new Map();
  let total = 0;
  for (const r of rows) {
    const v = valueFn(r);
    total += v;
    groups.set(r[groupField], (groups.get(r[groupField]) || 0) + v);
  }
  const items = [...groups.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, val], i) => ({
      label,
      icon: DONUT_ICONS[i % DONUT_ICONS.length],
      val: Math.round(val).toLocaleString(),
      pct: total ? Math.round((val / total) * 1000) / 10 : 0,
    }));
  return { title: titleLabel, total: formatTotal(total), items };
}

// Group By dropdown label -> row field it aggregates, and -> the ActiveFilterPanel attrId a
// donut-slice click on that dimension should toggle.
const GROUPBY_FIELD = {
  'Type': 'type', 'Exposure Category': 'cat', 'Cloud Provider': 'cloudProvider',
  'OS Family': 'osFamily', 'Finding Exposure Severity': 'severity',
  'Business Unit': 'businessUnit', 'Deployment Type': 'deploymentType',
};
const GROUPBY_ATTR_ID = {
  'Type': 'type-host', 'Exposure Category': 'exposure-category', 'Cloud Provider': 'cloud-provider',
  'OS Family': 'os-family', 'Finding Exposure Severity': 'severity',
  'Business Unit': 'business-unit', 'Deployment Type': 'deployment-type',
};

// attrId -> row field, for testing whether a row matches the page's active cross-filters.
const CROSS_FILTER_FIELDS = {
  'exposure-category': r => r.cat,
  'attack-surface':    r => r.attackSurface,
  'severity':          r => r.severity,
  'type-host':         r => r.type,
  'cloud-provider':    r => r.cloudProvider,
  'os-family':         r => r.osFamily,
  'business-unit':     r => r.businessUnit,
  'deployment-type':   r => r.deploymentType,
};

function scoreColor(v) {
  if (v >= 750) return 'var(--pai-crit-fg)';
  if (v >= 500) return 'var(--pai-high-fg)';
  if (v >= 250) return 'var(--pai-med-fg)';
  return 'var(--pai-green)';
}

const SEV_COLORS = {
  Critical: { fg: 'var(--pai-crit-fg)', bg: 'var(--pai-crit-bg)' },
  High:     { fg: 'var(--pai-high-fg)', bg: 'var(--pai-high-bg)' },
  Medium:   { fg: 'var(--pai-med-fg)',  bg: 'var(--pai-med-bg)' },
  Low:      { fg: 'var(--pai-low-fg)',  bg: 'var(--pai-low-bg)' },
};
function SevBadge({ level }) {
  const c = SEV_COLORS[level] || SEV_COLORS.Low;
  return <span className="fin-sev-badge" style={{ '--fin-sev-fg': c.fg, '--fin-sev-bg': c.bg }}>{level}</span>;
}

const ENTITY_ICON_SRCS = {
  device:        'assets/icons/entities/host.svg',
  cloud:         'assets/icons/entities/cloud-account.svg',
  identity:      'assets/icons/entities/identity.svg',
  storage:       'assets/icons/entities/storage.svg',
  container:     'assets/icons/entities/cloud-container.svg',
  assessment:    'assets/icons/entities/assessment.svg',
  finding:       'assets/icons/entities/finding.svg',
  vulnerability: 'assets/icons/entities/vulnerability.svg',
};

// ── Finding Details panel — mock provenance/metadata ──────────────
const FINDING_META = {
  'Container has root access':           { description: 'This assessment verifies that containers in cloud Kubernetes clusters (EKS/AKS) are not running with root access.', assessment: 'Kubernetes Containers do not have root access' },
  'Secure File Transfer is not enabled': { description: 'This assessment verifies that secure file transfer protocols are enforced on storage accounts to prevent unencrypted data transfer.', assessment: 'Storage Accounts must enforce secure transfer' },
  'Unpatched Log4j Vulnerability':       { description: 'This assessment verifies that services are not running vulnerable versions of the Log4j logging library.', assessment: 'Services must be patched against known CVEs' },
  'Public Storage Bucket Exposed':       { description: 'This assessment verifies that storage buckets do not grant public read access.', assessment: 'Storage buckets must not be publicly accessible' },
  'Missing Network Segmentation':        { description: 'This assessment verifies that production database clusters are isolated from flat, unsegmented networks.', assessment: 'Production networks must be segmented' },
  'Outdated TLS Version':                { description: 'This assessment verifies that services do not accept connections over deprecated TLS versions.', assessment: 'Services must enforce TLS 1.2 or higher' },
  'Weak IAM Password Policy':            { description: 'This assessment verifies that the identity provider enforces a strong minimum password length.', assessment: 'Identity providers must enforce strong password policies' },
  'Unused Security Group Rule':          { description: 'This assessment verifies that firewall rules are reviewed and removed when no longer in use.', assessment: 'Unused firewall rules must be removed' },
};

const SCOPE_BY_ENTITY_TYPE = {
  device:   { label: 'Container',       classification: 'Identification & Authentication', icon: 'container' },
  storage:  { label: 'Storage Account', classification: 'Data Protection',                 icon: 'storage' },
  identity: { label: 'Identity',        classification: 'Identity & Access',                icon: 'identity' },
  cloud:    { label: 'Cloud Resource',  classification: 'Cloud Configuration',              icon: 'cloud' },
};

// Label for the entity's OWN type chip — paired with ENTITY_ICON_SRCS[entityType] (the host/storage/identity
// icon), unlike SCOPE_BY_ENTITY_TYPE.label which describes how a *finding* refers to its affected resource
// (paired with the container/storage/identity icon in that graph instead).
const ENTITY_TYPE_LABEL = {
  device: 'Host', storage: 'Storage Account', identity: 'Identity', cloud: 'Cloud Resource',
};

function pseudoHash(str) {
  let h1 = 0x12345678, h2 = 0x87654321;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    h1 = (Math.imul(h1 ^ c, 16777619)) >>> 0;
    h2 = (Math.imul(h2 + c, 2246822519)) >>> 0;
  }
  let x = (h1 ^ h2) >>> 0;
  let out = '';
  for (let i = 0; i < 64; i++) {
    x = (Math.imul(x, 1103515245) + 12345) >>> 0;
    out += ((x >>> 28) & 0xf).toString(16); // high bits — an LCG's low bits cycle far too short
  }
  return out;
}

function buildFindingFields(row) {
  const meta = FINDING_META[row.title] || {};
  const scope = SCOPE_BY_ENTITY_TYPE[row.entityType] || SCOPE_BY_ENTITY_TYPE.device;
  return {
    general: [
      ['Activity Status', 'Active'],
      ['Class', 'Finding'],
      ['Origin (Count)', 1],
      ['Data Feed', 'Knowledge Graph'],
      ['Description', meta.description || `This assessment verifies "${row.title}" for ${row.entity}.`],
      ['Display Label', row.title],
      ['Exposure Category', row.cat],
      ['First Found', '2024-08-07'],
      ['First Seen', '2024-08-07'],
      ['Last Active', '2024-08-08'],
      ['Last Found', '2024-08-08'],
      ['Lifetime', 1],
      ['Observed Lifetime', 1],
      ['Origin', 'Knowledge Graph'],
      ['Origin Contribution Type', 'Unique'],
      ['Entity ID', pseudoHash(row.title + row.entity)],
      ['Recency', 0],
      ['Recent Activity', 0],
      ['Type', scope.classification],
    ],
    affected: [
      ['Associated Entities Display Label', row.entity],
    ],
    business: [
      ['Assessment Severity', row.severity],
      ['Assessment Weightage', 10],
      ['Exposure Score', row.exposure],
      ['Exposure Severity', row.severity],
      ['Finding Source', 'Product Defined'],
      ['Impact', row.impact],
      ['Impact Score', row.exposure],
      ['Likelihood', row.likelihood],
      ['Likelihood Score', row.exposure],
      ['Scope Entity', scope.label],
    ],
    evidence: [
      ['Evidence', row.evidence],
    ],
    identification: [
      ['Assessment', meta.assessment || `${row.cat} control check`],
      ['Status', 'Open'],
    ],
  };
}

const FINDING_BADGE_FIELDS = new Set(['Assessment Severity', 'Exposure Severity', 'Impact', 'Likelihood']);

// ── Entity Details panel — mock provenance/metadata per entity type ──
const SEVERITY_RANK = { Critical: 4, High: 3, Medium: 2, Low: 1 };
const SEVERITY_SCORE = { Critical: 1000, High: 750, Medium: 500, Low: 250 };
function maxSeverity(rows) {
  return rows.reduce((max, r) => (SEVERITY_RANK[r.severity] > SEVERITY_RANK[max] ? r.severity : max), 'Low');
}

function pseudoUuid(str) {
  const h = pseudoHash(str);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}

const ENTITY_BADGE_FIELDS = new Set(['Asset Criticality', 'Exposure Severity']);

const ENTITY_TEMPLATES = {
  device: {
    class: 'Container', dataFeed: 'Wiz Cloud Resource, Wiz Vulnerability Findings', origin: 'Wiz',
    type: 'Kubernetes Container', location: { city: 'Virginia', country: 'United States of America' }, deploymentType: 'Cloud',
    extraSections: name => [
      { title: 'Cloud Resource Identification', fields: [
        ['Kubernetes Flavor', 'AKS'],
        ['Native Type', 'Azure AKS Container'],
        ['Resource ID', pseudoUuid(name)],
        ['Resource Name', name.toLowerCase()],
      ] },
      { title: 'Cloud Resource State and Security', fields: [
        ['Active Operational Date', '2024-08-08'],
        ['Encryption Status', 'false'],
        ['Has Admin Privileges', 'true'],
        ['Has High Privileges', 'true'],
        ['Internet Exposed', 'true'],
        ['Open To All Internet', 'true'],
        ['Last Known Operational State', 'Active'],
      ] },
      { title: 'Container Security and Privileges', fields: [
        ['Is Container Privileged', 'false'],
        ['Container Runs as Root', 'true'],
        ['Is Container Serverless', 'false'],
        ['Is Container TTY Enabled', 'false'],
      ] },
    ],
  },
  storage: {
    class: 'Storage Account', dataFeed: 'Wiz Cloud Resource', origin: 'Wiz',
    type: 'Cloud Storage Account', location: { city: 'Iowa', country: 'United States of America' }, deploymentType: 'Cloud',
    extraSections: name => [
      { title: 'Cloud Resource Identification', fields: [
        ['Native Type', 'Azure Storage Account'],
        ['Resource ID', pseudoUuid(name)],
        ['Resource Name', name.toLowerCase()],
      ] },
      { title: 'Storage Security and Privileges', fields: [
        ['Secure Transfer Required', 'false'],
        ['Public Access Enabled', 'true'],
        ['Versioning Enabled', 'false'],
        ['Internet Exposed', 'true'],
      ] },
    ],
  },
  identity: {
    class: 'Identity', dataFeed: 'Entra ID', origin: 'Entra ID',
    type: 'Service Account', location: null, deploymentType: 'Identity Provider',
    extraSections: () => [
      { title: 'Identity Details', fields: [
        ['Identity Type', 'Service Account'],
        ['MFA Enabled', 'false'],
        ['Privileged Access', 'true'],
        ['Last Login', '2024-08-05'],
      ] },
      { title: 'Access and Privileges', fields: [
        ['Is Admin', 'true'],
        ['Has Standing Access', 'true'],
        ['Password Age Days', '412'],
      ] },
    ],
  },
  cloud: {
    class: 'Cloud Account', dataFeed: 'Wiz Cloud Resource', origin: 'Wiz',
    type: 'Cloud Account', location: { city: 'Iowa', country: 'United States of America' }, deploymentType: 'Cloud',
    extraSections: name => [
      { title: 'Cloud Resource Identification', fields: [
        ['Native Type', 'Cloud Subscription'],
        ['Resource ID', pseudoUuid(name)],
        ['Resource Name', name.toLowerCase()],
      ] },
    ],
  },
};

function buildEntityFields(entity, entityType, rows) {
  const tmpl = ENTITY_TEMPLATES[entityType] || ENTITY_TEMPLATES.device;
  const severity = maxSeverity(rows);
  const critScore = SEVERITY_SCORE[severity];
  const exposureScore = critScore - (parseInt(pseudoHash(entity).slice(0, 2), 16) % 40);
  const hashNum = parseInt(pseudoHash(entity).slice(2, 6), 16);
  const qualityScore = (hashNum % 5000) / 100;

  const general = [
    ['Activity Status', 'Active'],
    ['Class', tmpl.class],
    ['Origin (Count)', 1],
    ['Data Feed', tmpl.dataFeed],
    ['Display Label', entity],
    ['First Found', '2024-07-01'],
    ['First Seen', '2023-10-29'],
    ['Last Active', '2024-08-08'],
    ['Last Found', '2024-08-08'],
    ['Lifetime', 284],
    ...(tmpl.location ? [['Location City', tmpl.location.city], ['Location Country', tmpl.location.country]] : []),
    ['Observed Lifetime', 38],
    ['Origin', tmpl.origin],
    ['Origin Contribution Type', 'Unique'],
    ['Entity ID', pseudoHash(entity)],
    ['Recency', 0],
    ['Recent Activity', 0],
    ['Type', tmpl.type],
  ];
  const criticality = [
    ['Asset Criticality', severity],
    ['Asset Criticality Score', critScore],
    ['Exposure Score', exposureScore],
    ['Exposure Severity', severity],
  ];
  const identification = [
    ['Deployment Type', tmpl.deploymentType],
  ];
  const dataQuality = [
    ['Aggregated Quality Score', qualityScore.toFixed(2)],
    ['Completeness Quality Score', qualityScore.toFixed(2)],
    ['Completeness Quality Score Category', qualityScore >= 80 ? 'High' : qualityScore >= 50 ? 'Medium' : 'Low'],
  ];

  return { severity, critScore, exposureScore, general, criticality, identification, extraSections: tmpl.extraSections(entity), dataQuality };
}

// ── Exposure Factors panel — deterministic per-entity mock contributing factors ──
const COMPLIANCE_SCOPES = ['PCI DSS', 'HIPAA', 'SOC 2', 'GDPR', 'None'];
const ENVIRONMENTS = ['Production', 'Staging', 'Development'];
const ASSET_ROLES = ['ERP System', 'Domain Controller', 'Database Server', 'Web Server', 'File Server', 'Build Server'];

function buildExposureFactors(entity, entityType, data) {
  const tmpl = ENTITY_TEMPLATES[entityType] || ENTITY_TEMPLATES.device;
  const seed = field => parseInt(pseudoHash(`${entity}|${field}`).slice(0, 4), 16);
  const bool = field => (seed(field) % 2 === 0 ? 'true' : 'false');
  const pick = (field, pool) => pool[seed(field) % pool.length];

  const criticalityFactors = [
    ['Has Sensitive Info', bool('sensitive')],
    ['Has High Privileges', bool('highpriv')],
    ['Has Critical Applications', bool('critapp')],
    ['Asset Compliance Scope', pick('scope', COMPLIANCE_SCOPES)],
    ['Environment', pick('env', ENVIRONMENTS)],
    ['Has Admin Privileges', bool('admin')],
    ['Type', tmpl.type],
    ['High Risk Applications Count', seed('hrac') % 6],
    ['Asset Role', pick('role', ASSET_ROLES)],
    ['Holds Chief Role', bool('chief')],
  ];

  const findingFactors = [
    ['Software Vulnerability', 200 + (seed('swvuln') % 800)],
    ['Control Gap', 200 + (seed('ctrlgap') % 800)],
  ];

  return {
    assetCriticalityScore: data.critScore,
    exposureScore: data.exposureScore,
    findingExposureScore: data.exposureScore,
    criticalityFactors,
    findingFactors,
  };
}

// Fixed ring theming — Asset Criticality reads as the "high" red, Exposure /
// Finding Exposure read as the "medium" amber, regardless of the actual score.
const EF_CRIT_COLOR = 'var(--pai-high-fg)';
const EF_EXPOSURE_COLOR = 'var(--pai-med-fg)';

// Renders an SVG asset as a CSS mask so it can inherit `currentColor` — a plain
// <img> bakes in the file's own fill and can't be recolored per ring.
function MaskImg({ src, size = 16 }) {
  return (
    <span
      style={{
        display: 'inline-block', width: size, height: size, flexShrink: 0, backgroundColor: 'currentColor',
        maskImage: `url('${src}')`, WebkitMaskImage: `url('${src}')`,
        maskSize: 'contain', WebkitMaskSize: 'contain', maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat',
        maskPosition: 'center', WebkitMaskPosition: 'center',
      }}
    />
  );
}

const IcFindingSearchGlyph = () => (
  <svg width="16" height="24" viewBox="0 0 21 31" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M18.375 5.25H2.625V3.9375H18.375V5.25ZM12.411 7.88156C11.5578 7.88156 10.7396 8.22049 10.1363 8.82378C9.53299 9.42707 9.19406 10.2453 9.19406 11.0985C9.19406 11.9517 9.53299 12.7699 10.1363 13.3732C10.7396 13.9765 11.5578 14.3154 12.411 14.3154C13.2642 14.3154 14.0824 13.9765 14.6857 13.3732C15.289 12.7699 15.6279 11.9517 15.6279 11.0985C15.6279 10.2453 15.289 9.42707 14.6857 8.82378C14.0824 8.22049 13.2642 7.88156 12.411 7.88156ZM7.88156 11.0972C7.88178 10.3802 8.05219 9.67353 8.37879 9.03527C8.70539 8.397 9.17885 7.84539 9.76022 7.42579C10.3416 7.00619 11.0143 6.7306 11.7229 6.62168C12.4316 6.51276 13.1559 6.57363 13.8365 6.79927C14.517 7.02491 15.1343 7.40889 15.6375 7.91961C16.1407 8.43034 16.5155 9.05323 16.731 9.73704C16.9465 10.4209 16.9966 11.1461 16.8772 11.853C16.7577 12.56 16.4722 13.2285 16.044 13.8036L18.2976 16.0558L17.3683 16.9837L15.1161 14.7315C14.4424 15.2331 13.6426 15.5375 12.806 15.6107C11.9694 15.684 11.1288 15.5231 10.3783 15.1463C9.62781 14.7694 8.99686 14.1912 8.55595 13.4764C8.11505 12.7616 7.88156 11.9383 7.88156 11.0985M6.5625 11.1562H2.625V9.84375H6.5625V11.1562ZM7.875 17.0625H2.625V15.75H7.875V17.0625Z" fill="currentColor"/>
  </svg>
);

function ExposureFactorRing({ value, label, color, icon }) {
  return (
    <div className="fin-ef-ring-circle" style={{ '--ef-ring-color': color }}>
      {icon && <span className="fin-ef-ring-icon" style={{ color }}>{icon}</span>}
      <span className="fin-ef-ring-value" style={{ color }}>{value}</span>
      <span className="fin-ef-ring-label">{label}</span>
    </div>
  );
}

function ExposureFactorGaugeRing({ value, denom, label, color }) {
  const size = 230;
  return (
    <div className="fin-ef-ring-gauge" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={size * 0.43} fill="none" stroke="var(--shell-border, #F0F0F0)" strokeWidth={size * 0.055} strokeDasharray="3 4" />
      </svg>
      <div className="fin-ef-ring-gauge-inner">
        <span className="fin-ef-ring-value-row">
          <span className="fin-ef-ring-value" style={{ color }}>{value}</span>
          <span className="fin-ef-ring-denom">/{denom}</span>
        </span>
        <span className="fin-ef-ring-label">{label}</span>
      </div>
    </div>
  );
}

function ExposureFactorsPanel({ entity, type, data }) {
  const factors = buildExposureFactors(entity, type, data);

  return (
    <div className="kg-dp-section">
      <div className="fin-ef-ring-row">
        <ExposureFactorRing
          value={factors.assetCriticalityScore} label="Asset Criticality Score" color={EF_CRIT_COLOR}
          icon={<MaskImg src={ENTITY_ICON_SRCS[type] || ENTITY_ICON_SRCS.device} size={20} />}
        />
        <div className="fin-ef-connector" style={{ '--ef-connector-color': EF_CRIT_COLOR }} />
        <ExposureFactorGaugeRing value={factors.exposureScore} denom={1000} label="Exposure Score" color={EF_EXPOSURE_COLOR} />
        <div className="fin-ef-connector fin-ef-connector--flip" style={{ '--ef-connector-color': EF_EXPOSURE_COLOR }} />
        <ExposureFactorRing
          value={factors.findingExposureScore} label="Finding Exposure Score" color={EF_EXPOSURE_COLOR}
          icon={<IcFindingSearchGlyph />}
        />
      </div>
      <div className="fin-ef-body">
        <div className="fin-ef-chips-group">
          {factors.criticalityFactors.map(([k, v]) => (
            <div key={k} className="fin-ef-chip">
              <div className="fin-ef-chip-label">{k}</div>
              <div className="fin-ef-chip-value">{String(v)}</div>
            </div>
          ))}
        </div>
        <div className="fin-ef-chips-group">
          {factors.findingFactors.map(([k, v], i) => {
            const accent = i === 0 ? EF_EXPOSURE_COLOR : EF_CRIT_COLOR;
            return (
              <div key={k} className="fin-ef-chip" style={{ '--ef-chip-accent': accent }}>
                <div className="fin-ef-chip-label">{k}</div>
                <div className="fin-ef-chip-value" style={{ color: accent }}>{v}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Related-node tabs (Cloud Account / Finding / Vulnerability) — opened by clicking a graph node ──
const REL_LABELS = { cloudAccount: 'Cloud Account', finding: 'Finding', vulnerability: 'Vulnerability' };

const VULN_POOL = [
  { id: 'CVE-2007-2930',  title: 'DNS Server Processes Remote Code Execution', severity: 'Medium',   exploit: 'false', patch: 'false' },
  { id: 'CVE-2007-2925',  title: 'DNS Server Processes Buffer Overflow',       severity: 'Medium',   exploit: 'false', patch: 'false' },
  { id: 'CVE-1999-0024',  title: 'DNS Server Processes Cache Poisoning',       severity: 'Medium',   exploit: 'false', patch: 'true'  },
  { id: 'CVE-2022-23990', title: 'Common Base Linux Privilege Escalation',     severity: 'High',     exploit: 'true',  patch: 'true'  },
  { id: 'CVE-2022-21434', title: 'Azul Java Multiple Vulnerabilities',         severity: 'Medium',   exploit: 'true',  patch: 'true'  },
  { id: 'CVE-2021-44228', title: 'Log4j Remote Code Execution',                severity: 'Critical', exploit: 'true',  patch: 'true'  },
  { id: 'CVE-2023-4863',  title: 'WebP Heap Buffer Overflow',                  severity: 'High',     exploit: 'true',  patch: 'true'  },
  { id: 'CVE-2020-1938',  title: 'Apache Tomcat AJP File Read',                severity: 'Medium',   exploit: 'false', patch: 'true'  },
];

function buildRelData(nodeKey, entity, entityType, rows) {
  if (nodeKey === 'cloudAccount') {
    const acct = {
      'Display Label': 'ACNA-DEVOPS-INFRA', 'Account ID': pseudoUuid(entity + 'account'), 'Type': 'Azure Subscription',
      'Cloud Provider': 'Azure', 'Activity Status': 'Active', 'Origin': ENTITY_TEMPLATES[entityType]?.origin || 'Wiz',
      'First Seen': '2024-07-01', 'Last Seen': '2024-08-08', 'Duration': 38, 'Recency': 0, 'Fragments': 1,
    };
    return {
      rings: [
        { title: 'Cloud Provider', segments: [{ label: 'Azure', count: 1, color: fieldColor('Azure') }] },
        { title: 'Activity Status', segments: [{ label: 'Active', count: 1, color: fieldColor('Active') }] },
      ],
      columns: Object.keys(acct), rows: [acct],
    };
  }
  if (nodeKey === 'finding') {
    const sevCounts = groupCounts(rows, 'severity');
    const catCounts = groupCounts(rows, 'cat');
    return {
      rings: [
        { title: 'Exposure Severity', segments: sevCounts.map(([label, count]) => ({ label, count, color: fieldColor(label) })) },
        { title: 'Exposure Category', segments: catCounts.map(([label, count]) => ({ label, count, color: fieldColor(label) })) },
        { title: 'Cloud Vendor Severity', segments: [{ label: '(empty)', count: rows.length, color: fieldColor('') }] },
      ],
      columns: ['Display Label', 'Exposure Severity', 'Exposure Category', 'Cloud Vendor Severity', 'Origin', 'Finding Status', 'First Seen', 'Last Seen', 'Duration', 'Recency', 'Fragments'],
      rows: rows.map(r => ({
        'Display Label': r.title, 'Exposure Severity': r.severity, 'Exposure Category': r.cat, 'Cloud Vendor Severity': '',
        'Origin': 'Assessment Evidence', 'Finding Status': 'Open', 'First Seen': '2024-08-07', 'Last Seen': '2024-08-08', 'Duration': 1, 'Recency': 0, 'Fragments': 1,
      })),
    };
  }
  // vulnerability
  const count = { Critical: 5, High: 3, Medium: 2, Low: 1 }[maxSeverity(rows)];
  const start = parseInt(pseudoHash(entity).slice(0, 2), 16) % VULN_POOL.length;
  const vulns = Array.from({ length: count }, (_, i) => VULN_POOL[(start + i) % VULN_POOL.length]);
  return {
    rings: [
      { title: 'Vulnerability Severity', segments: [...groupCounts(vulns, 'severity')].map(([label, c]) => ({ label, count: c, color: fieldColor(label) })) },
      { title: 'Exploit Available', segments: [...groupCounts(vulns, 'exploit')].map(([label, c]) => ({ label, count: c, color: fieldColor(label) })) },
      { title: 'Patch Available', segments: [...groupCounts(vulns, 'patch')].map(([label, c]) => ({ label, count: c, color: fieldColor(label) })) },
    ],
    columns: ['Display Label', 'Vulnerability Title', 'Vulnerability Severity', 'Exploit Available', 'Patch Available', 'Origin', 'First Seen', 'Last Seen', 'Duration', 'Recency', 'Fragments'],
    rows: vulns.map(v => ({
      'Display Label': v.id, 'Vulnerability Title': v.title, 'Vulnerability Severity': v.severity, 'Exploit Available': v.exploit, 'Patch Available': v.patch,
      'Origin': 'Wiz', 'First Seen': '2024-06-24', 'Last Seen': '2024-07-01', 'Duration': 7, 'Recency': 38, 'Fragments': 1,
    })),
  };
}

// ── Related-node data for the Finding Details panel's own graph (Assessment / scope entity) ──
function buildFindingRelData(nodeKey, row) {
  if (nodeKey === 'assessment') {
    const assessmentName = FINDING_META[row.title]?.assessment || `${row.cat} control check`;
    const rec = {
      'Display Label': assessmentName, 'Assessment ID': pseudoUuid(row.title + 'assessment'), 'Severity': row.severity,
      'Weightage': 10, 'Status': 'Open', 'Origin': 'Knowledge Graph',
      'First Seen': '2024-08-07', 'Last Seen': '2024-08-08', 'Duration': 1, 'Recency': 0, 'Fragments': 1,
    };
    return {
      rings: [
        { title: 'Severity', segments: [{ label: row.severity, count: 1, color: fieldColor(row.severity) }] },
        { title: 'Status', segments: [{ label: 'Open', count: 1, color: fieldColor('Open') }] },
      ],
      columns: Object.keys(rec), rows: [rec],
    };
  }
  // scopeEntity
  const scope = SCOPE_BY_ENTITY_TYPE[row.entityType] || SCOPE_BY_ENTITY_TYPE.device;
  const tmpl = ENTITY_TEMPLATES[row.entityType] || ENTITY_TEMPLATES.device;
  const rec = {
    'Display Label': row.entity, 'Type': scope.label, 'Origin': tmpl.origin, 'Activity Status': 'Active',
    'First Seen': '2023-10-29', 'Last Seen': '2024-08-08', 'Duration': 284, 'Recency': 0, 'Fragments': 1,
  };
  return {
    rings: [
      { title: 'Type', segments: [{ label: scope.label, count: 1, color: fieldColor(scope.label) }] },
      { title: 'Activity Status', segments: [{ label: 'Active', count: 1, color: fieldColor('Active') }] },
    ],
    columns: Object.keys(rec), rows: [rec],
  };
}

// renderCell for this page's RelNodeSection tables — badges for severity-like fields, plain text otherwise.
const findingsRelCell = (col, val) => (ENTITY_BADGE_FIELDS.has(col) || SEV_COLORS[val] ? <SevBadge level={val} /> : String(val));

// Breadcrumb rail for a drilled-into drawer stack — one icon per level, oldest at top,
// current (last) highlighted; clicking an earlier icon pops back to that level.
// Icon for a mock leaf record (Assessment / Cloud Account / Vulnerability) that has no
// dedicated entity type of its own — shared by DrawerTrail and RecordDetailContent.
// Icon for a mock leaf record (Assessment / Cloud Account / Vulnerability) that has no
// dedicated entity type of its own — shared by DrawerTrail and RecordDetailContent.
// A record leaf's ENTITY_TYPES key — 'cloudAccount'/'vulnerability' map directly, anything else
// (e.g. an Assessment) falls back to 'assessment'.
function recordEntityKey(nodeKey) {
  if (nodeKey === 'cloudAccount' || nodeKey === 'vulnerability') return nodeKey;
  return 'assessment';
}

function recordIcon(nodeKey, size) {
  return <EntityGlyph kind={ENTITY_TYPES[recordEntityKey(nodeKey)].glyph} size={size} />;
}

// A Finding is represented by the same dedicated "finding" entity icon everywhere — header,
// mini-graph, relationship rows — never the severity/alert triangle; severity is its own
// meta-row field, not baked into the icon.
function drawerItemIcon(item, size) {
  if (item.kind === 'finding') return <EntityGlyph kind="finding" size={size} />;
  if (item.kind === 'record') return recordIcon(item.nodeKey, size);
  const ent = ENTITY_TYPES[ASSET_ENTITY_TYPE_KEY[item.type] || 'host'];
  return <EntityGlyph kind={ent.glyph} size={size} />;
}

function drawerItemLabel(item) {
  if (item.kind === 'finding') return item.row.title;
  if (item.kind === 'record') return item.record['Display Label'];
  return item.entity;
}

function drawerItemTypeLabel(item) {
  if (item.kind === 'finding') return 'Finding';
  if (item.kind === 'record') return item.title;
  return ENTITY_TYPE_LABEL[item.type] || item.type;
}

// Maps a trail item to the shape the shared HeaderIconStack/DrawerLayout (src/components/
// DrawerShell.jsx) needs to render it, without that shared component knowing this page's
// 'finding'|'entity'|'record' kind vocabulary.
function describeDrawerItem(item) {
  const color = item.kind === 'finding' ? ENTITY_TYPES.finding.icon
    : item.kind === 'record' ? ENTITY_TYPES[recordEntityKey(item.nodeKey)].icon
    : ENTITY_TYPES[ASSET_ENTITY_TYPE_KEY[item.type] || 'host'].icon;
  return { icon: drawerItemIcon(item, 16), label: drawerItemLabel(item), typeLabel: drawerItemTypeLabel(item), color };
}

// Adapts a raw record (arbitrary key/value pairs, e.g. { 'Display Label': ..., ... }) into the
// normalized { label, chipText, fields } shape the shared RecordDetailContent expects.
function toSharedRecord(title, record) {
  return {
    label: record['Display Label'],
    chipText: title,
    fields: Object.entries(record).map(([k, v]) => [k, SEV_COLORS[v] ? <SevBadge level={v} /> : String(v)]),
  };
}

function EntityCell({ name, type, onClick }) {
  const src = ENTITY_ICON_SRCS[type] || ENTITY_ICON_SRCS.device;
  return (
    <div className="fin-td-flex fin-td-clickable" onClick={onClick}>
      <span className="fin-td-icon fin-td-icon--badge"><img src={src} width={14} height={14} alt="" /></span>
      <span className="fin-td-entity">{name}</span>
    </div>
  );
}

// ── Finding Details panel — opened from row click / Explore, same comp-drawer shell as the Assessment/Trend Explore drawers ──
function FindingDetailContent({ row, onNavigate, trail, activeIndex, onNavigateTrail }) {
  const [tab, setTab] = useState('summary');
  const [relOpen, setRelOpen] = useState(true);
  const [evoShowHidden, setEvoShowHidden] = useState(false);
  const [relTab, setRelTab] = useState(null); // 'assessment' | 'scopeEntity' | null
  const openRelTab = key => { setRelTab(key); setTab(key); };
  const c = SEV_COLORS[row.severity] || SEV_COLORS.Low;
  const scope = SCOPE_BY_ENTITY_TYPE[row.entityType] || SCOPE_BY_ENTITY_TYPE.device;
  const fields = buildFindingFields(row);
  const allFields = [...fields.general, ...fields.affected, ...fields.business, ...fields.evidence, ...fields.identification];
  const relTabLabels = { assessment: 'Assessment', scopeEntity: scope.label };

  const renderGrid = list => (
    <div className="kg-dp-grid kg-dp-grid--4">
      {list.map(([k, v]) => (
        <div key={k} className="kg-dp-grid-cell">
          <div className="kg-dp-grid-key">{k}</div>
          <div className="kg-dp-grid-val">{FINDING_BADGE_FIELDS.has(k) ? <SevBadge level={v} /> : v}</div>
        </div>
      ))}
    </div>
  );

  return (
    <DrawerLayout trail={trail} activeIndex={activeIndex} onNavigateTrail={onNavigateTrail} describe={describeDrawerItem}>
        <div className="kg-dp-header">
          <div className="kg-dp-title-row">
            <div className="kg-dp-title-body">
              <div className="kg-dp-name-row">
                <span className="kg-dp-name">{row.title}</span>
                <span className="kg-dp-type-chip">Finding</span>
              </div>
              <div className="kg-dp-meta-row">
                <span className="kg-dp-meta-item">Exposure Severity <strong style={{ color: c.fg }}>{row.severity}</strong></span>
              </div>
            </div>
          </div>

          {/* Entity relationship mini-graph — Finding branches to its Assessment and scope entity */}
          <EntityRelSummaryGraph
            collapsible
            open={relOpen}
            onToggle={() => setRelOpen(o => !o)}
            center={{
              label: row.title.length > 26 ? row.title.slice(0, 24) + '…' : row.title,
              icon: <EntityGlyph kind="finding" size={16} />,
              accent: ENTITY_TYPES.finding.icon,
            }}
            leaves={[
              {
                key: 'assessment',
                label: 'Assessment',
                icon: <EntityGlyph kind="assessment" size={16} />,
                tint: ENTITY_TYPES.assessment.tint,
                stroke: ENTITY_TYPES.assessment.stroke,
                accent: ENTITY_TYPES.assessment.icon,
                count: 1,
                active: relTab === 'assessment',
                onClick: () => openRelTab('assessment'),
                testId: 'rel-node-assessment',
              },
              {
                key: 'scopeEntity',
                label: scope.label,
                icon: <EntityGlyph kind={ENTITY_TYPES[scope.icon === 'cloud' ? 'cloudAccount' : scope.icon].glyph} size={16} />,
                tint: ENTITY_TYPES[scope.icon === 'cloud' ? 'cloudAccount' : scope.icon].tint,
                stroke: ENTITY_TYPES[scope.icon === 'cloud' ? 'cloudAccount' : scope.icon].stroke,
                accent: ENTITY_TYPES[scope.icon === 'cloud' ? 'cloudAccount' : scope.icon].icon,
                count: 1,
                active: relTab === 'scopeEntity',
                onClick: () => openRelTab('scopeEntity'),
                testId: 'rel-node-scopeEntity',
              },
            ]}
          />
        </div>

        {/* Tabs */}
        <div className="kg-dp-tabs">
          {['summary', 'evolution', ...(relTab ? [relTab] : [])].map(t => (
            <button key={t} onClick={() => setTab(t)} className={tab === t ? 'kg-dp-tab kg-dp-tab--active' : 'kg-dp-tab'}>{relTabLabels[t] || t}</button>
          ))}
        </div>

        <div className="kg-dp-body">
          {tab === 'summary' && (
            <>
              <div className="kg-dp-section">
                <div className="kg-dp-section-header">General Information</div>
                {renderGrid(fields.general)}
              </div>
              <div className="kg-dp-section">
                <div className="kg-dp-section-header">Affected Resources</div>
                {renderGrid(fields.affected)}
              </div>
              <div className="kg-dp-section">
                <div className="kg-dp-section-header">Exposure and Business context</div>
                {renderGrid(fields.business)}
              </div>
              <div className="kg-dp-section">
                <div className="kg-dp-section-header">Finding Evidence Details</div>
                {renderGrid(fields.evidence)}
              </div>
              <div className="kg-dp-section">
                <div className="kg-dp-section-header">Finding Identification</div>
                {renderGrid(fields.identification)}
              </div>
            </>
          )}

          {relTab && tab === relTab && (
            <RelNodeSection
              title={relTabLabels[relTab]}
              data={buildFindingRelData(relTab, row)}
              renderCell={findingsRelCell}
              onRowClick={
                relTab === 'scopeEntity' ? () => onNavigate({ kind: 'entity', entity: row.entity, type: row.entityType })
                : relTab === 'assessment' ? r => onNavigate({ kind: 'record', nodeKey: 'assessment', title: 'Assessment', record: r })
                : undefined
              }
            />
          )}

          {tab === 'evolution' && (
            <div className="kg-dp-section">
              <div className="ds-table-wrap">
                <table className="ds-table">
                  <thead>
                    <tr>
                      <th className="ds-th">Attribute</th>
                      <th className="ds-th">
                        <div className="kg-dp-evo-resolved-head">
                          Resolved
                          <button className="kg-dp-evo-hidden-btn" onClick={() => setEvoShowHidden(v => !v)}>{evoShowHidden ? 'Hide' : 'Show Hidden'}</button>
                        </div>
                      </th>
                      <th className="ds-th">
                        <div className="kg-dp-evo-src-head">
                          <span>Knowledge Graph</span>
                          <span className="kg-dp-evo-latest-badge">Latest</span>
                        </div>
                        <div className="kg-dp-evo-src-date">[2024-08-08]</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {allFields.map(([k, v]) => (
                      <tr key={k}>
                        <td className="ds-td">{k}</td>
                        <td className="ds-td" style={{ fontWeight: 600 }}>
                          {v}
                          {evoShowHidden && <span className="kg-dp-evo-hidden-tag">Knowledge Graph</span>}
                        </td>
                        <td className="ds-td">{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
    </DrawerLayout>
  );
}

// ── Entity Details panel — opened from Associated Entities, same comp-drawer shell as Finding Details ──
function EntityDetailContent({ entity, type, rows, onNavigate, trail, activeIndex, onNavigateTrail }) {
  const [tab, setTab] = useState('summary');
  const [relOpen, setRelOpen] = useState(true);
  const [evoShowHidden, setEvoShowHidden] = useState(false);
  const [relTab, setRelTab] = useState(null); // 'cloudAccount' | 'finding' | 'vulnerability' | null
  const [exposureFactorsOpen, setExposureFactorsOpen] = useState(false);

  const openRelTab = key => { setRelTab(key); setTab(key); };
  const toggleExposureFactors = () => {
    const next = !exposureFactorsOpen;
    setExposureFactorsOpen(next);
    setRelOpen(!next);
    setTab(next ? 'exposureFactors' : 'summary');
  };

  const data = buildEntityFields(entity, type, rows);
  const c = SEV_COLORS[data.severity] || SEV_COLORS.Low;
  const vulnCount = { Critical: 5, High: 3, Medium: 2, Low: 1 }[data.severity];
  const sections = [
    { title: 'General Information', fields: data.general },
    { title: 'Asset Criticality and Exposure', fields: data.criticality },
    { title: 'Asset Identification', fields: data.identification },
    ...data.extraSections,
    { title: 'Data Quality Metrics', fields: data.dataQuality },
  ];
  const allFields = sections.flatMap(s => s.fields);

  const renderGrid = list => (
    <div className="kg-dp-grid">
      {list.map(([k, v]) => (
        <div key={k} className="kg-dp-grid-cell">
          <div className="kg-dp-grid-key">{k}</div>
          <div className="kg-dp-grid-val">{ENTITY_BADGE_FIELDS.has(k) ? <SevBadge level={v} /> : v}</div>
        </div>
      ))}
    </div>
  );

  return (
    <DrawerLayout trail={trail} activeIndex={activeIndex} onNavigateTrail={onNavigateTrail} describe={describeDrawerItem}>
        <div className="kg-dp-header">
          <div className="kg-dp-title-row">
            <div className="kg-dp-title-body">
              <div className="kg-dp-name-row">
                <span className="kg-dp-name">{entity}</span>
                <span className="kg-dp-type-chip">{ENTITY_TYPE_LABEL[type] || type}</span>
              </div>
              <div className="kg-dp-meta-row">
                <span className="kg-dp-meta-item">Asset Criticality <strong style={{ color: c.fg }}>{data.severity}</strong></span>
                <span className="kg-dp-meta-item">Exposure Severity <strong style={{ color: c.fg }}>{data.severity}</strong></span>
                <span className="fin-ef-tip">
                  <button className={`ds-btn sz-sm ${exposureFactorsOpen ? 't-tertiary' : 't-outline'}`} onClick={toggleExposureFactors}>
                    <IcExposureFactorsGlyph /> {exposureFactorsOpen ? 'Hide Exposure Factors' : 'View Exposure Factors'}
                  </button>
                  <div className="fin-ef-tip-card">
                    {exposureFactorsOpen
                      ? 'Hide Score Simulation'
                      : "Displays a detailed breakdown of an asset's security posture, including the Asset Criticality Score, Exposure Score, and Finding Exposure Score, helping users understand risk factors and prioritize mitigation."}
                  </div>
                </span>
              </div>
            </div>
          </div>

          {/* Entity relationship mini-graph — this entity branches to its Cloud Account, Findings and Vulnerabilities */}
          <EntityRelSummaryGraph
            collapsible
            open={relOpen}
            onToggle={() => setRelOpen(o => !o)}
            center={{
              label: entity.length > 22 ? entity.slice(0, 20) + '…' : entity,
              icon: <EntityGlyph kind={ENTITY_TYPES[ASSET_ENTITY_TYPE_KEY[type] || 'host'].glyph} size={16} />,
              accent: ENTITY_TYPES[ASSET_ENTITY_TYPE_KEY[type] || 'host'].icon,
            }}
            leaves={[
              {
                key: 'cloudAccount',
                label: 'Cloud Account',
                icon: <EntityGlyph kind="cloud" size={16} />,
                tint: ENTITY_TYPES.cloudAccount.tint,
                stroke: ENTITY_TYPES.cloudAccount.stroke,
                accent: ENTITY_TYPES.cloudAccount.icon,
                count: 1,
                active: relTab === 'cloudAccount',
                onClick: () => openRelTab('cloudAccount'),
                testId: 'rel-node-cloudAccount',
              },
              {
                key: 'finding',
                label: 'Finding',
                icon: <EntityGlyph kind="finding" size={16} />,
                tint: ENTITY_TYPES.finding.tint,
                stroke: ENTITY_TYPES.finding.stroke,
                accent: ENTITY_TYPES.finding.icon,
                count: rows.length,
                active: relTab === 'finding',
                onClick: () => openRelTab('finding'),
                testId: 'rel-node-finding',
              },
              {
                key: 'vulnerability',
                label: 'Vulnerability',
                icon: <EntityGlyph kind="vulnerability" size={16} />,
                tint: ENTITY_TYPES.vulnerability.tint,
                stroke: ENTITY_TYPES.vulnerability.stroke,
                accent: ENTITY_TYPES.vulnerability.icon,
                count: vulnCount,
                active: relTab === 'vulnerability',
                onClick: () => openRelTab('vulnerability'),
                testId: 'rel-node-vulnerability',
              },
            ]}
          />
        </div>

        {/* Tabs */}
        <div className="kg-dp-tabs">
          {['summary', 'evolution', ...(exposureFactorsOpen ? ['exposureFactors'] : []), ...(relTab ? [relTab] : [])].map(t => (
            <button key={t} onClick={() => setTab(t)} className={tab === t ? 'kg-dp-tab kg-dp-tab--active' : 'kg-dp-tab'}>{t === 'exposureFactors' ? 'Exposure Factors' : (REL_LABELS[t] || t)}</button>
          ))}
        </div>

        <div className="kg-dp-body">
          {tab === 'summary' && sections.map(s => (
            <div key={s.title} className="kg-dp-section">
              <div className="kg-dp-section-header">{s.title}</div>
              {renderGrid(s.fields)}
            </div>
          ))}

          {tab === 'exposureFactors' && (
            <ExposureFactorsPanel entity={entity} type={type} data={data} />
          )}

          {relTab && tab === relTab && (
            <RelNodeSection
              title={REL_LABELS[relTab]}
              data={buildRelData(relTab, entity, type, rows)}
              renderCell={findingsRelCell}
              onRowClick={
                relTab === 'finding' ? (r, i) => onNavigate({ kind: 'finding', row: rows[i] })
                : relTab === 'cloudAccount' ? r => onNavigate({ kind: 'record', nodeKey: 'cloudAccount', title: 'Cloud Account', record: r })
                : relTab === 'vulnerability' ? r => onNavigate({ kind: 'record', nodeKey: 'vulnerability', title: 'Vulnerability', record: r })
                : undefined
              }
            />
          )}

          {tab === 'evolution' && (
            <div className="kg-dp-section">
              <div className="ds-table-wrap">
                <table className="ds-table">
                  <thead>
                    <tr>
                      <th className="ds-th">Attribute</th>
                      <th className="ds-th">
                        <div className="kg-dp-evo-resolved-head">
                          Resolved
                          <button className="kg-dp-evo-hidden-btn" onClick={() => setEvoShowHidden(v => !v)}>{evoShowHidden ? 'Hide' : 'Show Hidden'}</button>
                        </div>
                      </th>
                      <th className="ds-th">
                        <div className="kg-dp-evo-src-head">
                          <span>{ENTITY_TEMPLATES[type]?.origin || 'Knowledge Graph'}</span>
                          <span className="kg-dp-evo-latest-badge">Latest</span>
                        </div>
                        <div className="kg-dp-evo-src-date">[2024-08-08]</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {allFields.map(([k, v]) => (
                      <tr key={k}>
                        <td className="ds-td">{k}</td>
                        <td className="ds-td" style={{ fontWeight: 600 }}>
                          {v}
                          {evoShowHidden && <span className="kg-dp-evo-hidden-tag">{ENTITY_TEMPLATES[type]?.origin || 'Knowledge Graph'}</span>}
                        </td>
                        <td className="ds-td">{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
    </DrawerLayout>
  );
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
  { val: '892',  label: 'new this week',      color: 'var(--pai-crit-fg)' },
  { val: '234',  label: 'closed this week',   color: 'var(--pai-green)' },
  { val: '+658', label: 'net backlog growth', color: 'var(--pai-crit-fg)' },
  { val: '47',   label: 'SLA breaches',       color: 'var(--pai-high-fg)' },
];

const SLA_STATUS = [
  { sev: 'Critical', color: 'var(--pai-crit-fg)', target: '14d SLA', pct: 77, overdue: 47  },
  { sev: 'High',     color: 'var(--pai-high-fg)', target: '30d SLA', pct: 93, overdue: 12  },
  { sev: 'Medium',   color: 'var(--pai-med-fg)',  target: '60d SLA', pct: 98, overdue: 3   },
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
const IcChevronDown = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6"/>
  </svg>
);
const IcFileCsv = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="none" stroke="currentColor" strokeWidth="1.4"/>
    <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.4" fill="none"/>
    <text x="12" y="17" textAnchor="middle" fontSize="5.5" fontWeight="700" fill="currentColor" fontFamily="Inter,sans-serif">CSV</text>
  </svg>
);
const IcFileExcel = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="none" stroke="currentColor" strokeWidth="1.4"/>
    <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.4" fill="none"/>
    <text x="12" y="17" textAnchor="middle" fontSize="5" fontWeight="700" fill="currentColor" fontFamily="Inter,sans-serif">XLS</text>
  </svg>
);
const IcClose = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IcTicket = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4">
    <path d="M1.5 6a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v1a1 1 0 1 0 0 2v1a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-1a1 1 0 1 0 0-2V6Z"/>
    <path d="M6 5v6" strokeDasharray="1.5 1.5"/>
  </svg>
);
const IcExposureFactorsGlyph = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.25 0.875V3.51925C11.3912 3.60544 9.48675 4.05825 7.62825 6.265C7.54163 6.14381 7.45412 6.02612 7.371 5.89313C5.23862 2.48063 2.765 1.87075 1.75 1.76837V0.875H0.875V13.125H1.75V11.3951C3.36116 11.375 4.9075 10.7576 6.08956 9.66263C8.08063 12.0138 11.0408 12.2666 12.2211 12.2666H12.25V13.125H13.125V0.875H12.25ZM12.25 4.39906V8.76969C11.4863 8.75904 10.7328 8.59327 10.0351 8.28243C9.33751 7.9716 8.71035 7.52218 8.19175 6.9615C9.8455 4.92931 11.5023 4.48875 12.25 4.39906ZM6.629 6.35687C6.77075 6.58394 6.91906 6.79 7.07 6.98688C6.92169 7.19469 6.77425 7.41213 6.629 7.64488C6.49057 7.86498 6.33998 8.07721 6.17794 8.28056C6.14162 8.22062 6.10444 8.16244 6.06987 8.09987C4.081 4.52025 2.53181 3.69425 1.75 3.52975V2.64731C2.62194 2.75231 4.73506 3.32675 6.629 6.35687ZM1.75 10.5214V4.43625C2.32969 4.63925 3.58881 5.4355 5.30513 8.52425C5.38825 8.67387 5.47837 8.80994 5.56763 8.94731C4.54018 9.93635 3.17594 10.4986 1.75 10.5214ZM6.70162 9.02519C6.94649 8.7363 7.17019 8.43013 7.371 8.10906C7.46769 7.95419 7.56569 7.81594 7.66369 7.67375C8.26085 8.28781 8.97339 8.77791 9.76043 9.11591C10.5475 9.45391 11.3935 9.63316 12.25 9.64338V11.3877C11.2306 11.3833 8.47613 11.1606 6.70162 9.02519Z" fill="currentColor"/>
  </svg>
);
const IcRemediation = () => (
  <svg width="13" height="14" viewBox="0 0 15 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5.69133 3.905C6.06508 2.81125 7.57633 2.77813 8.01945 3.80563L8.05696 3.90563L8.56133 5.38063C8.67692 5.7189 8.86371 6.02844 9.1091 6.28839C9.35449 6.54834 9.65277 6.75263 9.98383 6.8875L10.1195 6.93812L11.5945 7.44188C12.6882 7.81563 12.7213 9.32687 11.6945 9.77L11.5945 9.8075L10.1195 10.3119C9.78107 10.4274 9.4714 10.6141 9.21134 10.8595C8.95128 11.1049 8.74689 11.4033 8.61196 11.7344L8.56133 11.8694L8.05758 13.345C7.68383 14.4388 6.17258 14.4719 5.73008 13.445L5.69133 13.345L5.18758 11.87C5.07207 11.5316 4.88531 11.2219 4.63992 10.9619C4.39452 10.7018 4.0962 10.4974 3.76508 10.3625L3.63008 10.3119L2.15508 9.80812C1.0607 9.43437 1.02758 7.92312 2.05508 7.48062L2.15508 7.44188L3.63008 6.93812C3.96835 6.82254 4.2779 6.63575 4.53784 6.39036C4.79779 6.14497 5.00209 5.84668 5.13696 5.51562L5.18758 5.38063L5.69133 3.905ZM6.87446 4.30875L6.37071 5.78375C6.1947 6.29956 5.90837 6.77081 5.53166 7.16469C5.15496 7.55856 4.69692 7.86558 4.18946 8.06437L4.03321 8.12125L2.5582 8.625L4.03321 9.12875C4.54902 9.30476 5.02027 9.59108 5.41414 9.96779C5.80801 10.3445 6.11503 10.8025 6.31383 11.31L6.37071 11.4662L6.87446 12.9412L7.37821 11.4662C7.55421 10.9504 7.84054 10.4792 8.21725 10.0853C8.59395 9.69144 9.05199 9.38442 9.55945 9.18563L9.7157 9.12937L11.1907 8.625L9.7157 8.12125C9.19989 7.94524 8.72864 7.65892 8.33477 7.28221C7.9409 6.9055 7.63388 6.44747 7.43508 5.94L7.37883 5.78375L6.87446 4.30875ZM11.8745 1.75C11.9914 1.75 12.106 1.7828 12.2052 1.84467C12.3044 1.90654 12.3843 1.995 12.4357 2.1L12.4657 2.17313L12.6845 2.81438L13.3263 3.03313C13.4435 3.07293 13.5462 3.14663 13.6215 3.24488C13.6967 3.34313 13.7411 3.46151 13.749 3.58501C13.7569 3.70851 13.728 3.83158 13.6658 3.93862C13.6037 4.04565 13.5112 4.13184 13.4001 4.18625L13.3263 4.21625L12.6851 4.435L12.4663 5.07687C12.4265 5.19402 12.3527 5.29669 12.2544 5.37187C12.1561 5.44705 12.0377 5.49137 11.9142 5.4992C11.7907 5.50703 11.6677 5.47803 11.5607 5.41586C11.4537 5.3537 11.3676 5.26117 11.3132 5.15L11.2832 5.07687L11.0645 4.43563L10.4226 4.21688C10.3054 4.17707 10.2027 4.10337 10.1274 4.00512C10.0522 3.90687 10.0078 3.78849 9.99991 3.66499C9.99201 3.54149 10.021 3.41842 10.0831 3.31138C10.1452 3.20435 10.2377 3.11816 10.3488 3.06375L10.4226 3.03375L11.0638 2.815L11.2826 2.17313C11.3247 2.04964 11.4045 1.94244 11.5106 1.86656C11.6167 1.79068 11.744 1.74992 11.8745 1.75Z" fill="url(#remGradFP)"/>
    <defs>
      <linearGradient id="remGradFP" x1="7.52944" y1="1.75" x2="7.52944" y2="14.191" gradientUnits="userSpaceOnUse">
        <stop stopColor="#2E84D4"/><stop offset="1" stopColor="#E54798"/>
      </linearGradient>
    </defs>
  </svg>
);
const IcChevD = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6"/>
  </svg>
);

// ── Remediate Now widget ──────────────────────────────────────────
function ActNowWidget({ onRemediate, onNav }) {
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
              <button
                className="fin-remediate-btn"
                onClick={() => (i === REMEDIATE_NOW.length - 1 ? onNav?.('error') : onRemediate?.(item))}
              >
                Remediate
              </button>
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
            <span className="fin-ps-pulse-val" style={{ '--fin-pulse-color': s.color }}>{s.val}</span>
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
              <span className="fin-ps-sla-dot" style={{ '--fin-sla-dot-bg': row.color }} />
              <span className="fin-ps-sla-sev">{row.sev}</span>
              <span className="fin-ps-sla-target">{row.target}</span>
              <span className="fin-ps-sla-pct" style={{ '--fin-sla-pct-color': row.pct >= 90 ? 'var(--pai-green)' : row.pct >= 80 ? 'var(--pai-med-fg)' : 'var(--pai-crit-fg)' }}>
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
              <span className="fin-ps-exp-pct" style={{ '--fin-exp-pct-color': row.pct >= 20 ? 'var(--pai-crit-fg)' : 'var(--pai-med-fg)' }}>
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
function StackedBarChart({ title, rows, xLabel, onSegClick }) {
  const [hovSeg, setHovSeg] = useState(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0, containerW: 400 });

  return (
    <div
      className="card fin-chart-card fin-chart-card--rel"
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
                  className={`fin-sbc-seg${onSegClick ? ' fin-sbc-seg--clickable' : ''}`}
                  style={{ '--fin-seg-w': `${seg.pct}%`, '--fin-seg-bg': SEV[seg.sev] }}
                  onMouseEnter={() => setHovSeg({ sev: seg.sev, pct: seg.pct, count: seg.count, label: row.label.join(' ') })}
                  onMouseLeave={() => setHovSeg(null)}
                  onClick={() => onSegClick?.(row, seg)}
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
            <span className="fin-sbc-legend-dot" style={{ '--fin-dot-bg': color }} />
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
          <div className="tooltip-card tooltip-card--fixed fin-sbc-tooltip" style={{ left, top: mouse.y + 16, '--fin-tip-color': color }}>
            <div className="fin-sbc-tooltip__title">{hovSeg.sev}</div>
            <div className="fin-sbc-tooltip__row">
              <span className="tooltip-card__label">Count</span>
              <span className="fin-sbc-tooltip__val">{hovSeg.count?.toLocaleString()}</span>
            </div>
            <div className="fin-sbc-tooltip__row">
              <span className="tooltip-card__label">Percentage</span>
              <span className="fin-sbc-tooltip__val">{hovSeg.pct}%</span>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ── Page root ─────────────────────────────────────────────────────
export default function FindingsPage({ onNav, crossFilters = [], onToggleFilter }) {
  const [search, setSearch]           = useState('');
  const [page, setPage]               = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [groupBy, setGroupBy]         = useState('Type');
  const [remediationRow, setRemediationRow]         = useState(null); // { i, rect }
  const [createTicketEntity, setCreateTicketEntity] = useState(null); // null = closed, string = entity pre-fill
  const [ctDescription, setCtDescription]           = useState('');
  const [ctAssignee, setCtAssignee]                 = useState('Patch Admin');
  const { showToast } = useToast()
  const [downloadOpen, setDownloadOpen]             = useState(false);
  // Drawer navigation — history items: {kind:'finding',row} | {kind:'entity',entity,type} |
  // {kind:'record',nodeKey,title,record}. Jumping to an earlier entry only moves the pointer,
  // it never drops later entries — the trail only shrinks when the drawer fully closes.
  const drawer = useDrawerNav();
  const openDrawer = drawer.open;
  const navigateDrawer = drawer.navigate;
  const goToDrawerIndex = drawer.goToIndex;
  const closeDrawer = drawer.close;
  const downloadRef = useRef(null);
  const { addDownload } = useDownloads();

  useEffect(() => {
    if (!downloadOpen) return;
    const handler = e => { if (downloadRef.current && !downloadRef.current.contains(e.target)) setDownloadOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [downloadOpen]);

  const { matches } = useChartFilters(crossFilters);

  const filteredRows = TABLE_ROWS.filter(r =>
    matches(r, CROSS_FILTER_FIELDS) &&
    (!search ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.entity.toLowerCase().includes(search.toLowerCase()) ||
      r.evidence.toLowerCase().includes(search.toLowerCase()))
  );
  const clampedPage = Math.min(page, Math.max(1, Math.ceil(filteredRows.length / rowsPerPage)));
  const start       = (clampedPage - 1) * rowsPerPage;
  const visibleRows = filteredRows.slice(start, start + rowsPerPage);

  const totalWeight   = filteredRows.reduce((s, r) => s + r.weight, 0);
  const assetChart    = aggregateStackedBars(filteredRows, 'attackSurface');
  const findingChart  = aggregateStackedBars(filteredRows, 'cat');
  const groupField    = GROUPBY_FIELD[groupBy];
  const groupAttrId   = GROUPBY_ATTR_ID[groupBy];
  const exposureDonutData = aggregateDonut(filteredRows, groupField, 'Total Exposure', r => r.exposure * r.weight);
  const findingsDonutData = aggregateDonut(filteredRows, groupField, 'Total Findings', r => r.weight);

  const toggleSeg = (rowAttrId) => (row, seg) =>
    onToggleFilter?.([
      { attrId: rowAttrId, key: rowAttrId === 'attack-surface' ? 'Attack Surface' : 'Exposure Category', value: row.value },
      { attrId: 'severity', key: 'Severity', value: seg.sev },
    ]);
  const toggleSlice = (item) =>
    onToggleFilter?.([{ attrId: groupAttrId, key: groupBy, value: item.label }]);

  function handleSearch(v) { setSearch(v); setPage(1); }

  function openCreateTicket(entity, findingTitle) {
    setCtDescription(findingTitle ?? '');
    setCreateTicketEntity(entity);
  }
  function closeCreateTicket() { setCreateTicketEntity(null); }
  function handleCreateTicket() {
    closeCreateTicket();
    setRemediationRow(null);
    const success = Math.random() > 0.2;
    const type = success ? 'success' : 'error';
    const msg = success ? 'Ticket created successfully.' : 'Failed to create ticket. Please try again.';
    showToast({ type, msg, duration: 3000 });
  }

  return (
    <>
    <div className="page fin-page">

      {/* ── Intelligence row: Act Now + Operational Health ── */}
      <div className="fin-intel-row">
        <ActNowWidget onRemediate={(item) => openCreateTicket(item.scope, item.action)} onNav={onNav} />
        <ProgramStatusWidget />
      </div>

      {/* ── Top row: left charts + right posture ── */}
      <div className="fin-top-row">

        {/* Left: two stacked bar charts */}
        <div className="fin-left-col">
          <StackedBarChart
            title="Asset Criticality by Attack Surface"
            rows={assetChart}
            xLabel="% of Asset Count"
            onSegClick={onToggleFilter && toggleSeg('attack-surface')}
          />
          <StackedBarChart
            title="Finding Criticality by Exposure Category"
            rows={findingChart}
            xLabel="% of Findings Count"
            onSegClick={onToggleFilter && toggleSeg('exposure-category')}
          />
        </div>

        {/* Right: Security Posture Summary */}
        <div className="fin-right-col">
          <div className="card fin-posture-card">
            <div className="fin-posture-hdr">
              <span className="fin-posture-title">Security Posture Summary</span>
              <div className="fin-posture-groupby">
                <span>Group By</span>
                <SelectDropdown
                  value={groupBy}
                  onChange={setGroupBy}
                  options={['Exposure Category', 'Cloud Provider', 'OS Family', 'Type', 'Finding Exposure Severity', 'Business Unit', 'Deployment Type']}
                />
              </div>
            </div>
            <div className="fin-posture-body">
              <DonutChart
                data={exposureDonutData}
                onSliceClick={onToggleFilter && toggleSlice}
              />
              <div className="fin-posture-divider" />
              <DonutChart
                data={findingsDonutData}
                onSliceClick={onToggleFilter && toggleSlice}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom: failed findings table ── */}
      <div className="card fin-table-section">
        <div className="fin-table-hdr">
          <span className="fin-table-title">
            Failed Findings <span className="fin-table-count">({totalWeight.toLocaleString()})</span>
          </span>
          <div className="fin-table-actions">
            <DSPillSearch
              value={search}
              onChange={handleSearch}
              placeholder="Search Any"
              width={200}
            />
            <button className="ds-btn sz-md t-outline" onClick={(e) => addDownload('Exposure-Factors-Report.xlsx', e.currentTarget)}>
              <IcDownload /> Download Exposure Factors
            </button>
            <div ref={downloadRef} className="comp-dl-wrap">
              <button className="comp-dl-btn" onClick={() => setDownloadOpen(o => !o)}>
                <IcDownload /> Download <IcChevronDown />
              </button>
              {downloadOpen && (
                <div className="comp-dl-menu">
                  <button className="comp-dl-item" onClick={(e) => { addDownload('Failed-Findings.csv', e.currentTarget); setDownloadOpen(false); }}><IcFileCsv /> CSV</button>
                  <button className="comp-dl-item" onClick={(e) => { addDownload('Failed-Findings.xlsx', e.currentTarget); setDownloadOpen(false); }}><IcFileExcel /> Excel</button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="ds-table-wrap">
          <table className="ds-table fin-findings-table">
            <thead>
              <tr>
                {['Exposure Category', 'Finding Title', 'Associated Entities', 'Evidence', 'Impact', 'Likelihood', 'Exposure Score', 'Finding Exposure Severity'].map(h => (
                  <th key={h} className="ds-th">
                    <span className="ds-th-inner">{h} <IcSort /></span>
                  </th>
                ))}
                <th className="ds-th"><span className="ds-th-inner">Action</span></th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row, i) => (
                <tr key={i} className="kg-tr kg-tr--clickable" onClick={() => openDrawer({ kind: 'finding', row })}>
                  <td className="ds-td fin-td-cat">{row.cat}</td>
                  <td className="ds-td"><span className="fin-td-title-link">{row.title}</span></td>
                  <td className="ds-td" onClick={e => e.stopPropagation()}>
                    <EntityCell name={row.entity} type={row.entityType} onClick={() => openDrawer({ kind: 'entity', entity: row.entity, type: row.entityType })} />
                  </td>
                  <td className="ds-td fin-td-evidence">{row.evidence}</td>
                  <td className="ds-td"><SevBadge level={row.impact} /></td>
                  <td className="ds-td"><SevBadge level={row.likelihood} /></td>
                  <td className="ds-td fin-score" style={{ '--fin-score-color': scoreColor(row.exposure) }}>{row.exposure}</td>
                  <td className="ds-td"><SevBadge level={row.severity} /></td>
                  <td className="ds-td" onClick={e => e.stopPropagation()}>
                    <div className="fin-td-actions">
                      <button
                        className="fin-action-btn"
                        title="Remediation"
                        onClick={e => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setRemediationRow(remediationRow?.i === i ? null : { i, rect });
                        }}
                      >
                        <IcRemediation />
                      </button>
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

    {/* Remediation popup */}
    {remediationRow !== null && (
      <>
        <div className="comp-overlay comp-overlay--z210" onClick={() => setRemediationRow(null)} />
        <div className="comp-remediation-popup" style={{
          top: Math.min(remediationRow.rect.top, window.innerHeight - 560),
          left: remediationRow.rect.left - 608,
        }}>
          <div className="comp-remediation-header">
            <div className="comp-remediation-header-left">
              <span className="comp-remediation-title">Remediation Actions</span>
              <span className="comp-remediation-note">Note: AI-generated remediations offer valuable guidance, but we recommend verifying and validating before implementation.</span>
            </div>
            <div className="comp-remediation-header-actions">
              <button className="comp-drawer-kg-btn" onClick={() => openCreateTicket(visibleRows[remediationRow.i]?.entity ?? '', visibleRows[remediationRow.i]?.title ?? '')}>
                Create Ticket
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>
              <button className="comp-drawer-action-icon" onClick={() => setRemediationRow(null)}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                  <line x1="1" y1="1" x2="9" y2="9"/><line x1="9" y1="1" x2="1" y2="9"/>
                </svg>
              </button>
            </div>
          </div>
          <div className="comp-remediation-body">
            <div className="comp-remediation-rec">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--pai-high-fg)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="comp-remediation-rec-icon">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <span className="comp-remediation-rec-text">
                Recommendation: Prioritize and remediate this finding based on its exposure score, affected assets, and business impact
              </span>
            </div>
            <ol className="comp-remediation-steps">
              <li>Confirm the finding against the affected asset and validate it is not a false positive</li>
              <li>Assess business impact and criticality of the affected asset before proceeding</li>
              <li>Apply the vendor-recommended patch, configuration change, or compensating control</li>
              <li>Re-scan the affected asset to confirm the finding is resolved</li>
              <li>Document the remediation and update the finding's status</li>
            </ol>
            <p className="comp-remediation-summary">
              Resolving this finding reduces the organization's overall exposure score and lowers the risk of exploitation on the affected asset.
            </p>
          </div>
          <div className="comp-remediation-tickets">
            <span className="comp-remediation-tickets-title">Ticket History</span>
            <span className="comp-remediation-tickets-empty">No existing tickets found</span>
          </div>
        </div>
      </>
    )}

    {/* Create Ticket modal */}
    {createTicketEntity !== null && (
      <>
        <div className="sfm-overlay" onMouseDown={closeCreateTicket} />
        <div className="sfm-dialog" onMouseDown={e => e.stopPropagation()}>
          <div className="sfm-header">
            <div className="sfm-icon-wrap"><IcTicket /></div>
            <span className="sfm-title">Create Ticket</span>
            <button onClick={closeCreateTicket} className="sfm-close" aria-label="Close"><IcClose /></button>
          </div>
          <div className="sfm-body">
            <p className="sfm-desc">This ticket will be added to your board once you click 'Create' to track this finding.</p>
            <div className="sfm-field">
              <label className="sfm-field-label">Assignee</label>
              <SelectDropdown
                value={ctAssignee}
                onChange={setCtAssignee}
                options={['Patch Admin', 'Security Admin', 'IT Operations']}
                fullWidth
              />
            </div>
            <div className="sfm-field">
              <label className="sfm-field-label">Associated Entities</label>
              <input type="text" value={createTicketEntity} readOnly className="sfm-input" />
            </div>
            <div className="sfm-field">
              <label className="sfm-field-label">Description of Failed Finding</label>
              <textarea value={ctDescription} onChange={e => setCtDescription(e.target.value)} rows={2} className="sfm-textarea" />
            </div>
          </div>
          <div className="sfm-footer">
            <button onClick={closeCreateTicket} className="sfm-cancel">Cancel</button>
            <button onClick={handleCreateTicket} className="sfm-create">Create</button>
          </div>
        </div>
      </>
    )}

    {/* Finding / Entity / Record Details drawer — a single persistent shell (DrawerShell) whose
        content swaps based on drawer.index; navigating never remounts the shell, so only the
        very first open slides in and every Relationship Summary click just replaces content.
        The header's icon stack (trail/activeIndex/onNavigateTrail) lives inside each content
        component's own header, not the shell, since it sits beside that content's title. */}
    {drawer.index >= 0 && (() => {
      const top = drawer.history[drawer.index];
      const trailProps = { trail: drawer.history, activeIndex: drawer.index, onNavigateTrail: goToDrawerIndex, describe: describeDrawerItem };
      const content = top.kind === 'finding' ? (
        <FindingDetailContent key={drawer.index} row={top.row} onNavigate={navigateDrawer} {...trailProps} />
      ) : top.kind === 'entity' ? (
        <EntityDetailContent
          key={drawer.index}
          entity={top.entity}
          type={top.type}
          rows={TABLE_ROWS.filter(r => r.entity === top.entity)}
          onNavigate={navigateDrawer}
          {...trailProps}
        />
      ) : (
        <RecordDetailContent key={drawer.index} record={toSharedRecord(top.title, top.record)} {...trailProps} />
      );
      return (
        <DrawerShell onClose={closeDrawer} closing={drawer.closing}>
          {content}
        </DrawerShell>
      );
    })()}
    </>
  );
}
