import React, { useState, useEffect } from 'react';
import EntityRelSummaryGraph from './EntityRelSummaryGraph.jsx';
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

const IcDrawerClose = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
    <line x1="1" y1="1" x2="9" y2="9"/><line x1="9" y1="1" x2="1" y2="9"/>
  </svg>
);

const IcPersonGlyph = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.5-7 8-7s8 3 8 7"/>
  </svg>
);
const IcIdentityGlyph = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/><circle cx="8" cy="10" r="2"/>
    <path d="M4 17c0-1.7 1.8-3 4-3s4 1.3 4 3"/><line x1="14" y1="9" x2="18" y2="9"/><line x1="14" y1="13" x2="18" y2="13"/>
  </svg>
);
const IcApplicationGlyph = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
  </svg>
);
const IcFindingGlyph = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="10" cy="10" r="6"/><line x1="18.5" y1="18.5" x2="14.5" y2="14.5"/>
  </svg>
);
const IcCloudAccountGlyph = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6.5 19a4.5 4.5 0 0 1-.5-8.98A6 6 0 0 1 17.5 8.5 5 5 0 0 1 17 19H6.5z"/>
  </svg>
);
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

const REL_NODES = [
  { key: 'person',      label: 'Person',       Icon: IcPersonGlyph,      count: 1  },
  { key: 'identity',     label: 'Identity',     Icon: IcIdentityGlyph,    count: 1  },
  { key: 'application',  label: 'Application',  Icon: IcApplicationGlyph, count: 22 },
  { key: 'finding',      label: 'Finding',      Icon: IcFindingGlyph,     count: 10 },
  { key: 'cloudAccount', label: 'Cloud Account',Icon: IcCloudAccountGlyph,count: 1  },
];

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

export default function AssetDetailDrawer({ asset, entityType = 'device', onClose }) {
  const [closing, setClosing] = useState(false);
  const handleClose = () => { setClosing(true); setTimeout(onClose, 180); };
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const [tab, setTab] = useState('summary');
  const [relOpen, setRelOpen] = useState(true);
  const [exposureFactorsOpen, setExposureFactorsOpen] = useState(false);

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
    <>
      <div className="comp-drawer-backdrop" onClick={handleClose} />
      <button className="comp-drawer-close-ext" onClick={handleClose}><IcDrawerClose /></button>
      <div className={`comp-drawer${closing ? ' comp-drawer--closing' : ''}`}>
        <div className="kg-dp-header">
          <div className="kg-dp-title-row">
            <div className="kg-dp-icon-circle"><img src={ENTITY_ICON_SRCS[entityType] || ENTITY_ICON_SRCS.device} width={18} height={18} alt="" /></div>
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

          {/* Entity relationship mini-graph — this asset branches to Person, Identity, Application, Finding and Cloud Account */}
          <EntityRelSummaryGraph
            collapsible
            open={relOpen}
            onToggle={() => setRelOpen(o => !o)}
            center={{
              label: asset.name.length > 22 ? asset.name.slice(0, 20) + '…' : asset.name,
              icon: <img src={ENTITY_ICON_SRCS[entityType] || ENTITY_ICON_SRCS.device} width={16} height={16} alt="" />,
              accent: 'var(--pai-indigo)',
            }}
            leaves={REL_NODES.map(node => ({
              key: node.key,
              label: node.label,
              icon: <node.Icon />,
              tint: 'var(--shell-raised)',
              stroke: 'var(--shell-border)',
              accent: 'var(--shell-text-muted)',
              count: node.count,
            }))}
          />
        </div>

        {/* Tabs */}
        <div className="kg-dp-tabs">
          {['summary', 'evolution', ...(exposureFactorsOpen ? ['exposureFactors'] : [])].map(t => (
            <button key={t} onClick={() => setTab(t)} className={tab === t ? 'kg-dp-tab kg-dp-tab--active' : 'kg-dp-tab'}>{t === 'exposureFactors' ? 'Exposure Factors' : t}</button>
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
      </div>
    </>
  );
}
