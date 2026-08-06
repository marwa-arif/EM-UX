import React, { useState } from 'react';
import EntityRelSummaryGraph from './EntityRelSummaryGraph.jsx';
import { DrawerShell, DrawerLayout, RecordDetailContent, RelNodeSection, fieldColor, groupCounts, useDrawerNav } from './DrawerShell.jsx';
import { ENTITY_TYPES, EntityGlyph, ASSET_ENTITY_TYPE_KEY } from './entityTypes.jsx';
import '../styles/findings.css';

const ENTITY_ICON_SRCS = {
  device:   'assets/icons/entities/host.svg',
  cloud:    'assets/icons/entities/cloud-account.svg',
  identity: 'assets/icons/entities/identity.svg',
  storage:  'assets/icons/entities/storage.svg',
};

const ENTITY_TYPE_LABEL = { device: 'Host', storage: 'Storage Account', identity: 'Identity', cloud: 'Cloud Resource' };

function pseudoHash(str) {
  let h1 = 0x12345678, h2 = 0x87654321;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    h1 = (Math.imul(h1 ^ c, 16777619)) >>> 0;
    h2 = (Math.imul(h2 + c, 2246822519)) >>> 0;
  }
  let x = (h1 ^ h2) >>> 0;
  let out = '';
  for (let i = 0; i < 32; i++) {
    x = (Math.imul(x, 1103515245) + 12345) >>> 0;
    out += ((x >>> 28) & 0xf).toString(16);
  }
  return out;
}

const SEV_COLORS = {
  Critical: { fg: 'var(--pai-crit-fg)', bg: 'var(--pai-crit-bg)' },
  High:     { fg: 'var(--pai-high-fg)', bg: 'var(--pai-high-bg)' },
  Medium:   { fg: 'var(--pai-med-fg)',  bg: 'var(--pai-med-bg)' },
  Low:      { fg: 'var(--pai-low-fg)',  bg: 'var(--pai-low-bg)' },
};

const IcExposureFactorsGlyph = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.25 0.875V3.51925C11.3912 3.60544 9.48675 4.05825 7.62825 6.265C7.54163 6.14381 7.45412 6.02612 7.371 5.89313C5.23862 2.48063 2.765 1.87075 1.75 1.76837V0.875H0.875V13.125H1.75V11.3951C3.36116 11.375 4.9075 10.7576 6.08956 9.66263C8.08063 12.0138 11.0408 12.2666 12.2211 12.2666H12.25V13.125H13.125V0.875H12.25ZM12.25 4.39906V8.76969C11.4863 8.75904 10.7328 8.59327 10.0351 8.28243C9.33751 7.9716 8.71035 7.52218 8.19175 6.9615C9.8455 4.92931 11.5023 4.48875 12.25 4.39906ZM6.629 6.35687C6.77075 6.58394 6.91906 6.79 7.07 6.98688C6.92169 7.19469 6.77425 7.41213 6.629 7.64488C6.49057 7.86498 6.33998 8.07721 6.17794 8.28056C6.14162 8.22062 6.10444 8.16244 6.06987 8.09987C4.081 4.52025 2.53181 3.69425 1.75 3.52975V2.64731C2.62194 2.75231 4.73506 3.32675 6.629 6.35687ZM1.75 10.5214V4.43625C2.32969 4.63925 3.58881 5.4355 5.30513 8.52425C5.38825 8.67387 5.47837 8.80994 5.56763 8.94731C4.54018 9.93635 3.17594 10.4986 1.75 10.5214ZM6.70162 9.02519C6.94649 8.7363 7.17019 8.43013 7.371 8.10906C7.46769 7.95419 7.56569 7.81594 7.66369 7.67375C8.26085 8.28781 8.97339 8.77791 9.76043 9.11591C10.5475 9.45391 11.3935 9.63316 12.25 9.64338V11.3877C11.2306 11.3833 8.47613 11.1606 6.70162 9.02519Z" fill="currentColor"/>
  </svg>
);
const IcFindingSearchGlyph = () => (
  <svg width="16" height="24" viewBox="0 0 21 31" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M18.375 5.25H2.625V3.9375H18.375V5.25ZM12.411 7.88156C11.5578 7.88156 10.7396 8.22049 10.1363 8.82378C9.53299 9.42707 9.19406 10.2453 9.19406 11.0985C9.19406 11.9517 9.53299 12.7699 10.1363 13.3732C10.7396 13.9765 11.5578 14.3154 12.411 14.3154C13.2642 14.3154 14.0824 13.9765 14.6857 13.3732C15.289 12.7699 15.6279 11.9517 15.6279 11.0985C15.6279 10.2453 15.289 9.42707 14.6857 8.82378C14.0824 8.22049 13.2642 7.88156 12.411 7.88156ZM7.88156 11.0972C7.88178 10.3802 8.05219 9.67353 8.37879 9.03527C8.70539 8.397 9.17885 7.84539 9.76022 7.42579C10.3416 7.00619 11.0143 6.7306 11.7229 6.62168C12.4316 6.51276 13.1559 6.57363 13.8365 6.79927C14.517 7.02491 15.1343 7.40889 15.6375 7.91961C16.1407 8.43034 16.5155 9.05323 16.731 9.73704C16.9465 10.4209 16.9966 11.1461 16.8772 11.853C16.7577 12.56 16.4722 13.2285 16.044 13.8036L18.2976 16.0558L17.3683 16.9837L15.1161 14.7315C14.4424 15.2331 13.6426 15.5375 12.806 15.6107C11.9694 15.684 11.1288 15.5231 10.3783 15.1463C9.62781 14.7694 8.99686 14.1912 8.55595 13.4764C8.11505 12.7616 7.88156 11.9383 7.88156 11.0985M6.5625 11.1562H2.625V9.84375H6.5625V11.1562ZM7.875 17.0625H2.625V15.75H7.875V17.0625Z" fill="currentColor"/>
  </svg>
);

// ── Exposure Factors panel — mirrors FindingsPage's EntityDetailDrawer, deterministic per-asset mock contributing factors ──
const COMPLIANCE_SCOPES = ['PCI DSS', 'HIPAA', 'SOC 2', 'GDPR', 'None'];
const ENVIRONMENTS = ['Production', 'Staging', 'Development'];
const ASSET_ROLES = ['ERP System', 'Domain Controller', 'Database Server', 'Web Server', 'File Server', 'Build Server'];

// Fixed ring theming — Asset Criticality reads as the "high" red, Exposure /
// Finding Exposure read as the "medium" amber, regardless of the actual score.
const EF_CRIT_COLOR = 'var(--pai-high-fg)';
const EF_EXPOSURE_COLOR = 'var(--pai-med-fg)';

function buildAssetExposureFactors(asset, entityType, critScore, exposureScore) {
  const seed = field => parseInt(pseudoHash(`${asset.name}|${field}`).slice(0, 4), 16);
  const bool = field => (seed(field) % 2 === 0 ? 'true' : 'false');
  const pick = (field, pool) => pool[seed(field) % pool.length];

  const criticalityFactors = [
    ['Has Sensitive Info', bool('sensitive')],
    ['Has High Privileges', bool('highpriv')],
    ['Has Critical Applications', bool('critapp')],
    ['Asset Compliance Scope', pick('scope', COMPLIANCE_SCOPES)],
    ['Environment', pick('env', ENVIRONMENTS)],
    ['Has Admin Privileges', bool('admin')],
    ['Type', asset.type],
    ['High Risk Applications Count', seed('hrac') % 6],
    ['Asset Role', pick('role', ASSET_ROLES)],
    ['Holds Chief Role', bool('chief')],
  ];

  const findingFactors = [
    ['Software Vulnerability', 200 + (seed('swvuln') % 800)],
    ['Control Gap', 200 + (seed('ctrlgap') % 800)],
  ];

  return {
    assetCriticalityScore: critScore,
    exposureScore,
    findingExposureScore: exposureScore,
    criticalityFactors,
    findingFactors,
  };
}

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

function AssetExposureFactorsPanel({ asset, entityType, critScore, exposureScore }) {
  const factors = buildAssetExposureFactors(asset, entityType, critScore, exposureScore);

  return (
    <div className="kg-dp-section">
      <div className="fin-ef-ring-row">
        <ExposureFactorRing
          value={factors.assetCriticalityScore} label="Asset Criticality Score" color={EF_CRIT_COLOR}
          icon={<MaskImg src={ENTITY_ICON_SRCS[entityType] || ENTITY_ICON_SRCS.device} size={20} />}
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

// Keys match ENTITY_TYPES exactly, so a leaf's own icon/color always comes straight from the
// shared palette (ENTITY_TYPES[node.key]) — no separate icon set to keep in sync.
const REL_NODES = [
  { key: 'person',      label: 'Person',        count: 1  },
  { key: 'identity',    label: 'Identity',      count: 1  },
  { key: 'application', label: 'Application',   count: 22 },
  { key: 'finding',     label: 'Finding',       count: 10 },
  { key: 'cloudAccount',label: 'Cloud Account', count: 1  },
];

// Leaves that map onto an entity type this file already knows how to render fully — clicking
// them drills into a new trail entry that reuses AssetEntityContent itself (self-referential),
// rather than dead-ending or fabricating a whole second content component.
const REL_NODE_ENTITY_TYPE = { identity: 'identity', cloudAccount: 'cloud' };

const MOCK_IDENTITY_NAMES = ['jsmith', 'r.patel', 'a.chen', 'm.garcia', 'k.nguyen', 't.oconnor'];
const MOCK_CLOUD_NAMES = ['prod-storage-01', 'backup-vault-eastus', 'app-data-bucket', 'shared-blob-store'];

// Synthesizes a plausible related asset for a leaf that DOES have a dedicated entity type
// (Identity / Cloud Account) but no real underlying record in this mock app — deterministic
// per parent asset, same pseudoHash approach already used for exposure factors above.
function synthesizeRelatedAsset(parentAsset, entityType) {
  const seed = field => parseInt(pseudoHash(`${parentAsset.name}|${entityType}|${field}`).slice(0, 4), 16);
  const pool = entityType === 'identity' ? MOCK_IDENTITY_NAMES : MOCK_CLOUD_NAMES;
  const crits = ['Critical', 'High', 'Medium', 'Low'];
  return {
    name: pool[seed('name') % pool.length],
    type: entityType === 'identity' ? 'User Identity' : 'Storage Account',
    crit: crits[seed('crit') % crits.length],
    score: 300 + (seed('score') % 650),
  };
}

const PERSON_NAMES = ['J. Rivera', 'A. Kowalski', 'S. Okafor', 'M. Tanaka', 'L. Dubois', 'R. Singh'];
const APPLICATION_NAMES = [
  'Slack', 'Zoom', 'Salesforce', 'Workday', 'Jira', 'Confluence', 'GitHub Enterprise', 'Okta',
  'Tableau', 'Adobe Acrobat', 'Chrome', 'Docker Desktop', 'VS Code', 'Postman', '1Password',
  'Zscaler', 'CrowdStrike Falcon', 'Splunk', 'Datadog', 'PagerDuty', 'Notion', 'Figma',
];
const ASSET_FINDING_TITLES = [
  'Outdated TLS Version', 'Missing Endpoint Protection', 'Weak Local Admin Password',
  'Unpatched OS Vulnerability', 'Unencrypted Local Disk', 'RDP Exposed to Internet',
  'Legacy SMBv1 Enabled', 'Default Credentials in Use', 'Unauthorized USB Device', 'Stale Local User Account',
];
const CRIT_LEVELS = ['Critical', 'High', 'Medium', 'Low'];

// Builds the {rings, columns, rows} data RelNodeSection needs for a given relationship-graph
// leaf — same deterministic pseudoHash approach as the rest of this file's mock data. Person/
// Identity/Cloud Account are single-row (count: 1 in REL_NODES); Application/Finding list out
// as many mock rows as their leaf count claims, so the pie-chart rings have something to break
// down and the table has more than one row to pick from.
function buildAssetRelData(nodeKey, asset) {
  const seed = (field, i = '') => parseInt(pseudoHash(`${asset.name}|${nodeKey}|${i}|${field}`).slice(0, 4), 16);

  if (nodeKey === 'identity' || nodeKey === 'cloudAccount') {
    const related = synthesizeRelatedAsset(asset, REL_NODE_ENTITY_TYPE[nodeKey]);
    const rec = { 'Display Label': related.name, 'Type': related.type, 'Criticality': related.crit, 'Score': related.score };
    return {
      rings: [{ title: 'Criticality', segments: [{ label: related.crit, count: 1, color: fieldColor(related.crit) }] }],
      columns: Object.keys(rec), rows: [rec],
    };
  }

  if (nodeKey === 'person') {
    const status = seed('status') % 5 === 0 ? 'Inactive' : 'Active';
    const rec = {
      'Display Label': PERSON_NAMES[seed('name') % PERSON_NAMES.length],
      'Role': ['Owner', 'Primary User', 'IT Admin', 'Contractor'][seed('role') % 4],
      'Department': ['IT', 'Finance', 'Engineering', 'Sales', 'HR'][seed('dept') % 5],
      'Status': status,
    };
    return {
      rings: [{ title: 'Status', segments: [{ label: status, count: 1, color: fieldColor(status) }] }],
      columns: Object.keys(rec), rows: [rec],
    };
  }

  const count = REL_NODES.find(n => n.key === nodeKey)?.count || 1;
  const rows = Array.from({ length: count }, (_, i) => {
    if (nodeKey === 'application') {
      return {
        'Display Label': APPLICATION_NAMES[(seed('name') + i) % APPLICATION_NAMES.length],
        'Version': `${1 + seed('major', i) % 9}.${seed('minor', i) % 20}.${seed('patch', i) % 10}`,
        'Risk Level': CRIT_LEVELS[seed('risk', i) % CRIT_LEVELS.length],
        'Last Scanned': '2024-08-08',
      };
    }
    // finding
    return {
      'Display Label': ASSET_FINDING_TITLES[(seed('name') + i) % ASSET_FINDING_TITLES.length],
      'Severity': CRIT_LEVELS[seed('sev', i) % CRIT_LEVELS.length],
      'Category': ['Control Gap', 'Vulnerability', 'Misconfiguration'][seed('cat', i) % 3],
      'Status': 'Open',
    };
  });
  const ringField = nodeKey === 'application' ? 'Risk Level' : 'Severity';
  return {
    rings: [{ title: ringField, segments: groupCounts(rows, ringField).map(([label, c]) => ({ label, count: c, color: fieldColor(label) })) }],
    columns: Object.keys(rows[0]),
    rows,
  };
}

// renderCell for this file's RelNodeSection tables — small severity-style badge for
// criticality/risk/severity fields, plain text otherwise (mirrors FindingsPage's SevBadge
// styling via the same .fin-sev-badge class, without needing that page-local component).
function assetRelCell(col, val) {
  if (['Criticality', 'Risk Level', 'Severity', 'Status'].includes(col) && SEV_COLORS[val]) {
    const c = SEV_COLORS[val];
    return <span className="fin-sev-badge" style={{ '--fin-sev-fg': c.fg, '--fin-sev-bg': c.bg }}>{val}</span>;
  }
  return String(val);
}

// Maps a trail item to {icon,label,typeLabel} for the shared HeaderIconStack — this drawer's
// trail only ever holds two kinds: 'assetEntity' (self-referential drill-down onto this same
// content component) and 'record' (the generic fallback for leaves with no entity model).
export function describeAssetTrailItem(item) {
  if (item.kind === 'record') {
    const ent = ENTITY_TYPES[item.entityTypeKey] || {};
    return {
      icon: <EntityGlyph kind={ent.glyph} size={16} />,
      label: item.record.label,
      typeLabel: item.record.chipText,
      color: ent.icon,
    };
  }
  const ent = ENTITY_TYPES[ASSET_ENTITY_TYPE_KEY[item.entityType] || 'host'];
  return {
    icon: <EntityGlyph kind={ent.glyph} size={16} />,
    label: item.asset.name,
    typeLabel: ENTITY_TYPE_LABEL[item.entityType] || item.entityType,
    color: ent.icon,
  };
}

function buildAssetFields(asset, entityType) {
  const id = pseudoHash(asset.name);
  const critScore = asset.score;
  const exposureScore = asset.score - (parseInt(pseudoHash(asset.name).slice(0, 2), 16) % 40);
  return {
    critScore,
    exposureScore,
    general: [
      ['Entity ID', id],
      ['Display Label', asset.name],
      ['Class', ENTITY_TYPE_LABEL[entityType] || 'Host'],
      ['Type', asset.type],
      ['Origin', 'MS Defender, MS Intune, Qualys, MS Azure AD, Wiz'],
      ['Origin (Count)', 5],
      ['First Found', '2024-07-01'],
      ['First Seen', '2024-02-11'],
      ['Last Found', '2024-08-08'],
      ['Last Active', '2024-08-08'],
      ['Activity Status', 'Active'],
      ['Lifetime', 179],
      ['Recent Activity', 0],
      ['Observed Lifetime', 38],
      ['Recency', 0],
      ['Business Unit', 'Shared unity'],
      ['Location Country', 'United States of America'],
      ['Fragments', 5],
      ['Origin Contribution Type', 'Corroborated'],
    ],
    criticality: [
      ['Asset Criticality', asset.crit],
      ['Asset Criticality Score', critScore],
      ['Exposure Score', exposureScore],
      ['Exposure Severity', asset.crit],
    ],
  };
}

// Entity content (header + relationship mini-graph + summary/evolution/exposureFactors tabs) —
// exported so ComplianceFindingsPage's FindingDrawer can reuse it verbatim for its Host leaf
// instead of reimplementing the same asset view.
export function AssetEntityContent({ asset, entityType = 'device', onNavigate, trail, activeIndex, onNavigateTrail, describe = describeAssetTrailItem }) {
  const [tab, setTab] = useState('summary');
  const [relOpen, setRelOpen] = useState(true);
  const [exposureFactorsOpen, setExposureFactorsOpen] = useState(false);
  // Which relationship-graph leaf's "opened" (pie-chart + table) view is showing, if any —
  // set by clicking a leaf; clicking a ROW inside that view is what actually navigates.
  const [relTab, setRelTab] = useState(null);
  const openRelTab = key => { setRelTab(key); setTab(key); };
  const relTabLabel = key => REL_NODES.find(n => n.key === key)?.label || key;

  const navigateFromRelRow = row => {
    const relatedType = REL_NODE_ENTITY_TYPE[relTab];
    if (relatedType) {
      onNavigate({ kind: 'assetEntity', asset: synthesizeRelatedAsset(asset, relatedType), entityType: relatedType });
    } else {
      const node = REL_NODES.find(n => n.key === relTab);
      onNavigate({ kind: 'record', entityTypeKey: relTab, record: { label: row['Display Label'], chipText: node.label, fields: Object.entries(row) } });
    }
  };

  const toggleExposureFactors = () => {
    const next = !exposureFactorsOpen;
    setExposureFactorsOpen(next);
    setRelOpen(!next);
    setTab(next ? 'exposureFactors' : 'summary');
  };

  const data = buildAssetFields(asset, entityType);
  const c = SEV_COLORS[asset.crit] || SEV_COLORS.Low;
  const { critScore, exposureScore } = data;
  const sections = [
    { title: 'General Information', fields: data.general },
    { title: 'Asset Criticality and Exposure', fields: data.criticality },
  ];
  const allFields = sections.flatMap(s => s.fields);

  const renderGrid = list => (
    <div className="kg-dp-grid kg-dp-grid--4">
      {list.map(([k, v]) => (
        <div key={k} className="kg-dp-grid-cell">
          <div className="kg-dp-grid-key">{k}</div>
          <div className="kg-dp-grid-val">{v}</div>
        </div>
      ))}
    </div>
  );

  return (
    <DrawerLayout trail={trail} activeIndex={activeIndex} onNavigateTrail={onNavigateTrail} describe={describe}>
      <div className="kg-dp-header">
        <div className="kg-dp-title-row">
          <div className="kg-dp-title-body">
            <div className="kg-dp-name-row">
              <span className="kg-dp-name">{asset.name}</span>
              <span className="kg-dp-type-chip">{ENTITY_TYPE_LABEL[entityType] || 'Host'}</span>
            </div>
            <div className="kg-dp-meta-row">
              <span className="kg-dp-meta-item">Asset Criticality <strong style={{ color: c.fg }}>{asset.crit}</strong></span>
              <span className="kg-dp-meta-item">Exposure Severity <strong style={{ color: c.fg }}>{asset.crit}</strong></span>
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

        {/* Entity relationship mini-graph — this asset branches to Person, Identity, Application, Finding and Cloud Account.
            Identity/Cloud Account drill into a new trail entry reusing this same content component (self-referential);
            the rest fall back to a generic record view since they have no dedicated entity model in this app yet. */}
        <EntityRelSummaryGraph
          collapsible
          open={relOpen}
          onToggle={() => setRelOpen(o => !o)}
          center={{
            label: asset.name.length > 22 ? asset.name.slice(0, 20) + '…' : asset.name,
            icon: <EntityGlyph kind={ENTITY_TYPES[ASSET_ENTITY_TYPE_KEY[entityType] || 'host'].glyph} size={16} />,
            accent: ENTITY_TYPES[ASSET_ENTITY_TYPE_KEY[entityType] || 'host'].icon,
          }}
          leaves={REL_NODES.map(node => ({
            key: node.key,
            label: node.label,
            icon: <EntityGlyph kind={ENTITY_TYPES[node.key].glyph} size={16} />,
            tint: ENTITY_TYPES[node.key].tint,
            stroke: ENTITY_TYPES[node.key].stroke,
            accent: ENTITY_TYPES[node.key].icon,
            count: node.count,
            active: relTab === node.key,
            onClick: () => openRelTab(node.key),
          }))}
        />
      </div>

      {/* Tabs */}
      <div className="kg-dp-tabs">
        {['summary', 'evolution', ...(exposureFactorsOpen ? ['exposureFactors'] : []), ...(relTab ? [relTab] : [])].map(t => (
          <button key={t} onClick={() => setTab(t)} className={tab === t ? 'kg-dp-tab kg-dp-tab--active' : 'kg-dp-tab'}>{t === 'exposureFactors' ? 'Exposure Factors' : t === relTab ? relTabLabel(t) : t}</button>
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
          <AssetExposureFactorsPanel asset={asset} entityType={entityType} critScore={critScore} exposureScore={exposureScore} />
        )}

        {relTab && tab === relTab && (
          <RelNodeSection
            title={relTabLabel(relTab)}
            data={buildAssetRelData(relTab, asset)}
            renderCell={assetRelCell}
            onRowClick={navigateFromRelRow}
          />
        )}

        {tab === 'evolution' && (
          <div className="kg-dp-section">
            <div className="ds-table-wrap">
              <table className="ds-table">
                <thead>
                  <tr>
                    <th className="ds-th">Attribute</th>
                    <th className="ds-th">Resolved</th>
                    <th className="ds-th">Knowledge Graph</th>
                  </tr>
                </thead>
                <tbody>
                  {allFields.map(([k, v]) => (
                    <tr key={k}>
                      <td className="ds-td">{k}</td>
                      <td className="ds-td" style={{ fontWeight: 600 }}>{v}</td>
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

export default function AssetDetailDrawer({ asset, entityType = 'device', onClose }) {
  const drawer = useDrawerNav({ kind: 'assetEntity', asset, entityType });
  const top = drawer.history[drawer.index];
  const trailProps = { trail: drawer.history, activeIndex: drawer.index, onNavigateTrail: drawer.goToIndex };

  return (
    <DrawerShell onClose={() => drawer.close(onClose)} closing={drawer.closing}>
      {top.kind === 'record' ? (
        <RecordDetailContent key={drawer.index} record={top.record} describe={describeAssetTrailItem} {...trailProps} />
      ) : (
        <AssetEntityContent key={drawer.index} asset={top.asset} entityType={top.entityType} onNavigate={drawer.navigate} {...trailProps} />
      )}
    </DrawerShell>
  );
}
