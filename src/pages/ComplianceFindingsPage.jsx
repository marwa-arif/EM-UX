import React, { useState, useRef, useEffect, useCallback } from 'react'
import { DSPillSearch } from '../context/WorkspaceCtx.jsx'
import TablePagination from '../components/TablePagination.jsx'
import EntityRelSummaryGraph from '../components/EntityRelSummaryGraph.jsx'
import { useDownloads } from '../DownloadsContext.jsx'
import '../styles/compliance.css'
import '../styles/navigator.css'
import '../styles/kg.css'
import '../styles/active-filter-panel.css'

// ── Icons ──────────────────────────────────────────────────────────
const IcRemediation = () => (
  <svg width="13" height="14" viewBox="0 0 15 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5.69133 3.905C6.06508 2.81125 7.57633 2.77813 8.01945 3.80563L8.05696 3.90563L8.56133 5.38063C8.67692 5.7189 8.86371 6.02844 9.1091 6.28839C9.35449 6.54834 9.65277 6.75263 9.98383 6.8875L10.1195 6.93812L11.5945 7.44188C12.6882 7.81563 12.7213 9.32687 11.6945 9.77L11.5945 9.8075L10.1195 10.3119C9.78107 10.4274 9.4714 10.6141 9.21134 10.8595C8.95128 11.1049 8.74689 11.4033 8.61196 11.7344L8.56133 11.8694L8.05758 13.345C7.68383 14.4388 6.17258 14.4719 5.73008 13.445L5.69133 13.345L5.18758 11.87C5.07207 11.5316 4.88531 11.2219 4.63992 10.9619C4.39452 10.7018 4.0962 10.4974 3.76508 10.3625L3.63008 10.3119L2.15508 9.80812C1.0607 9.43437 1.02758 7.92312 2.05508 7.48062L2.15508 7.44188L3.63008 6.93812C3.96835 6.82254 4.2779 6.63575 4.53784 6.39036C4.79779 6.14497 5.00209 5.84668 5.13696 5.51562L5.18758 5.38063L5.69133 3.905ZM6.87446 4.30875L6.37071 5.78375C6.1947 6.29956 5.90837 6.77081 5.53166 7.16469C5.15496 7.55856 4.69692 7.86558 4.18946 8.06437L4.03321 8.12125L2.5582 8.625L4.03321 9.12875C4.54902 9.30476 5.02027 9.59108 5.41414 9.96779C5.80801 10.3445 6.11503 10.8025 6.31383 11.31L6.37071 11.4662L6.87446 12.9412L7.37821 11.4662C7.55421 10.9504 7.84054 10.4792 8.21725 10.0853C8.59395 9.69144 9.05199 9.38442 9.55945 9.18563L9.7157 9.12937L11.1907 8.625L9.7157 8.12125C9.19989 7.94524 8.72864 7.65892 8.33477 7.28221C7.9409 6.9055 7.63388 6.44747 7.43508 5.94L7.37883 5.78375L6.87446 4.30875ZM11.8745 1.75C11.9914 1.75 12.106 1.7828 12.2052 1.84467C12.3044 1.90654 12.3843 1.995 12.4357 2.1L12.4657 2.17313L12.6845 2.81438L13.3263 3.03313C13.4435 3.07293 13.5462 3.14663 13.6215 3.24488C13.6967 3.34313 13.7411 3.46151 13.749 3.58501C13.7569 3.70851 13.728 3.83158 13.6658 3.93862C13.6037 4.04565 13.5112 4.13184 13.4001 4.18625L13.3263 4.21625L12.6851 4.435L12.4663 5.07687C12.4265 5.19402 12.3527 5.29669 12.2544 5.37187C12.1561 5.44705 12.0377 5.49137 11.9142 5.4992C11.7907 5.50703 11.6677 5.47803 11.5607 5.41586C11.4537 5.3537 11.3676 5.26117 11.3132 5.15L11.2832 5.07687L11.0645 4.43563L10.4226 4.21688C10.3054 4.17707 10.2027 4.10337 10.1274 4.00512C10.0522 3.90687 10.0078 3.78849 9.99991 3.66499C9.99201 3.54149 10.021 3.41842 10.0831 3.31138C10.1452 3.20435 10.2377 3.11816 10.3488 3.06375L10.4226 3.03375L11.0638 2.815L11.2826 2.17313C11.3247 2.04964 11.4045 1.94244 11.5106 1.86656C11.6167 1.79068 11.744 1.74992 11.8745 1.75Z" fill="url(#remGradFP)"/>
    <defs>
      <linearGradient id="remGradFP" x1="7.52944" y1="1.75" x2="7.52944" y2="14.191" gradientUnits="userSpaceOnUse">
        <stop stopColor="#2E84D4"/><stop offset="1" stopColor="#E54798"/>
      </linearGradient>
    </defs>
  </svg>
)

const IcDownload = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
)

const IcClose = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const IcTicket = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4">
    <path d="M1.5 6a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v1a1 1 0 1 0 0 2v1a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-1a1 1 0 1 0 0-2V6Z"/>
    <path d="M6 5v6" strokeDasharray="1.5 1.5"/>
  </svg>
)

// ── Entity badge ───────────────────────────────────────────────────
const ENTITY_ICON_SRCS = {
  cloud:    'assets/icons/entities/cloud-account.svg',
  device:   'assets/icons/entities/host.svg',
  identity: 'assets/icons/entities/identity.svg',
  storage:  'assets/icons/entities/storage.svg',
  multi:    'assets/icons/entities/assessment.svg',
}

const ENTITY_TYPE_LABEL = {
  device:   'Host / Device',
  cloud:    'Cloud Account',
  identity: 'Identity',
  storage:  'Storage',
  multi:    'Multiple',
}

function EntityBadge({ type }) {
  const src = ENTITY_ICON_SRCS[type] || ENTITY_ICON_SRCS.multi
  return (
    <span className="cfp-entity-badge">
      <img src={src} width={14} height={14} alt="" />
    </span>
  )
}

// ── Finding detail drawer ───────────────────────────────────────────
// Colors/glyphs mirror the Knowledge Graph entity palette (PageKG.jsx ENTITY_TYPES)
// so a Finding's detail drawer reads as the same entity type everywhere in the app.
const KG_ENT = {
  finding:    { tint: '#E9E4F6', stroke: '#BCABE4', icon: '#582DBB', glyph: 'entity-finding.svg' },
  host:       { tint: '#E3E9F1', stroke: '#AABBD3', icon: '#2B5690', glyph: 'entity-host.svg' },
  assessment: { tint: '#F4ECE5', stroke: '#DEC4AF', icon: '#AC6C36', glyph: 'entity-assessment.svg' },
}

const SEV_COLORS = {
  Critical: 'var(--pai-crit-fg)',
  High:     'var(--pai-high-fg)',
  Medium:   'var(--pai-med-fg)',
  Low:      'var(--pai-low-fg)',
}

// Per-title mock metadata — the ROWS mock data only carries title/entity/type/evidence,
// so the richer drawer fields below are deliberately dummy/illustrative.
const FINDING_META = {
  'Devices with End-of-Life OS':           { severity: 'High',     domain: 'Vulnerability & Patch Management', category: 'Control Gap',      description: 'This assessment verifies that devices are not running operating systems that have reached end-of-life and no longer receive security patches.' },
  'Malware scan overdue':                  { severity: 'Medium',   domain: 'Endpoint Security',                 category: 'Control Gap',      description: 'This assessment verifies that endpoint anti-malware scans are running on schedule and have not exceeded the allowed SLA window.' },
  'Authentication factors not configured': { severity: 'Medium',   domain: 'Identity & Access Management',      category: 'Control Gap',      description: 'This assessment verifies that identities have at least one authentication factor registered for account access.' },
  'MFA not enabled':                       { severity: 'Critical', domain: 'Identity & Access Management',      category: 'Control Gap',      description: 'This assessment verifies that multi-factor authentication is enforced for the associated entity.' },
  'Full disk encryption not enforced':     { severity: 'High',     domain: 'Data Protection',                    category: 'Control Gap',      description: 'This assessment verifies that full disk encryption is enabled to protect data at rest.' },
  'Vulnerability scan overdue':            { severity: 'Medium',   domain: 'Vulnerability & Patch Management',  category: 'Control Gap',      description: 'This assessment verifies that vulnerability scans are completed within the required SLA window.' },
  'Unaccountable devices':                 { severity: 'Low',      domain: 'Asset Management',                  category: 'Governance Gap',   description: 'This assessment verifies that all discovered devices have an active, accountable owner on record.' },
  'EDR agent not fully functional':        { severity: 'High',     domain: 'Endpoint Security',                 category: 'Control Gap',      description: 'This assessment verifies that the EDR agent is installed and reporting normally on the associated device.' },
  'No login activity':                     { severity: 'Low',      domain: 'Identity & Access Management',      category: 'Inactive Account',  description: 'This assessment flags identities or devices with no recorded login activity within the expected window.' },
  'Host firewall disabled':                { severity: 'High',     domain: 'Network Security',                  category: 'Control Gap',      description: 'This assessment verifies that the host-based firewall is enabled and actively enforcing policy.' },
  'FIM not enabled':                       { severity: 'Medium',   domain: 'Endpoint Security',                 category: 'Control Gap',      description: 'This assessment verifies that File Integrity Monitoring is enabled to detect unauthorized changes.' },
  'Patch management overdue':              { severity: 'High',     domain: 'Vulnerability & Patch Management',  category: 'Control Gap',      description: 'This assessment verifies that security patches are applied within the required patch management SLA.' },
}
const DEFAULT_FINDING_META = { severity: 'Medium', domain: 'General Compliance', category: 'Control Gap', description: 'This assessment verifies compliance controls associated with the selected finding.' }

// Deterministic hex id derived from the row — mock data only, not a real entity identifier.
function mockEntityId(seed) {
  let h1 = 0, h2 = 0
  for (let i = 0; i < seed.length; i++) {
    h1 = (h1 * 31 + seed.charCodeAt(i)) >>> 0
    h2 = (h2 * 131 + seed.charCodeAt(i)) >>> 0
  }
  return (h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0')).padEnd(32, '0')
}

function KgGlyph({ file, size = 20 }) {
  return <img src={`assets/icons/${file}`} width={size} height={size} className="kg-entity-glyph" alt="" />
}

function FindingDrawer({ row, onClose }) {
  const [closing, setClosing] = useState(false)
  const [tab, setTab] = useState('summary')

  const handleClose = useCallback(() => {
    setClosing(true)
    setTimeout(onClose, 180)
  }, [onClose])

  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') handleClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [handleClose])

  const meta = FINDING_META[row.title] || DEFAULT_FINDING_META
  const entityId = mockEntityId(`${row.title}|${row.entity}`)

  const infoFields = [
    ['Entity ID',              entityId],
    ['Display Label',          row.title],
    ['Class',                  'Finding'],
    ['Type',                   meta.domain],
    ['Origin',                 'Knowledge Graph'],
    ['Origin (Count)',         1],
    ['First Found',            '2024-08-07'],
    ['First Seen',             '2024-08-07'],
    ['Last Found',             '2024-08-08'],
    ['Last Active',            '2024-08-08'],
    ['Activity Status',        'Active'],
    ['Lifetime',               1],
    ['Recent Activity',        0],
    ['Observed Lifetime',      1],
    ['Recency',                0],
    ['Description',            meta.description],
    ['Origin Contribution Type', 'Unique'],
    ['Exposure Category',      meta.category],
  ]

  return (
    <>
      <div className="comp-drawer-backdrop" onClick={handleClose} />
      <button className="comp-drawer-close-ext" onClick={handleClose}>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
          <line x1="1" y1="1" x2="9" y2="9"/><line x1="9" y1="1" x2="1" y2="9"/>
        </svg>
      </button>

      <div className={`comp-drawer${closing ? ' comp-drawer--closing' : ''}`}>
        <div className="kg-dp-header">
          <div className="kg-dp-title-row">
            <div className="kg-dp-icon-circle" style={{ '--dp-tint': KG_ENT.finding.tint, '--dp-stroke': KG_ENT.finding.stroke }}>
              <KgGlyph file={KG_ENT.finding.glyph} size={22} />
            </div>
            <div className="kg-dp-title-body">
              <div className="kg-dp-name-row">
                <span className="kg-dp-name">{row.title}</span>
                <span className="kg-dp-type-chip" style={{ '--dp-chip-border': KG_ENT.finding.stroke, '--dp-chip-color': KG_ENT.finding.icon }}>
                  Finding
                </span>
              </div>
              <div className="kg-dp-meta-row">
                <span className="kg-dp-meta-item">
                  Exposure Severity <strong style={{ color: SEV_COLORS[meta.severity] }}>{meta.severity}</strong>
                </span>
              </div>
            </div>
          </div>

          <EntityRelSummaryGraph
            center={{ label: row.title, icon: <KgGlyph file={KG_ENT.finding.glyph} size={16} />, accent: KG_ENT.finding.icon }}
            leaves={[
              { key: 'host', label: 'Host', icon: <KgGlyph file={KG_ENT.host.glyph} size={16} />, tint: KG_ENT.host.tint, stroke: KG_ENT.host.stroke, accent: KG_ENT.host.icon, count: 1 },
              { key: 'assessment', label: 'Assessment', icon: <KgGlyph file={KG_ENT.assessment.glyph} size={16} />, tint: KG_ENT.assessment.tint, stroke: KG_ENT.assessment.stroke, accent: KG_ENT.assessment.icon, count: 1 },
            ]}
          />
        </div>

        {/* Tabs */}
        <div className="kg-dp-tabs">
          {['summary', 'evolution'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={tab === t ? 'kg-dp-tab kg-dp-tab--active' : 'kg-dp-tab'}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="kg-dp-body">
          {tab === 'summary' && (
            <>
              <div className="kg-dp-section">
                <div className="kg-dp-section-header">General Information</div>
                <div className="kg-dp-grid kg-dp-grid--4">
                  {infoFields.map(([k, v]) => (
                    <div key={k} className="kg-dp-grid-cell">
                      <div className="kg-dp-grid-key">{k}</div>
                      <div className="kg-dp-grid-val">{v}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="kg-dp-section">
                <div className="kg-dp-section-header">Affected Resources</div>
                <div className="ds-table-wrap">
                  <table className="ds-table">
                    <thead>
                      <tr>
                        <th className="ds-th">Associated Entities Display Label</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="ds-td">
                          <div className="cfp-entity-cell">
                            <EntityBadge type={row.type} />
                            <span>{row.entity}</span>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {tab === 'evolution' && (
            <div className="kg-dp-section">
              <div className="kg-dp-section-header">Evolution</div>
              <div className="ds-table-wrap">
                <table className="ds-table">
                  <thead>
                    <tr>
                      <th className="ds-th">Attribute</th>
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
                    {infoFields.map(([k, v]) => (
                      <tr key={k}>
                        <td className="ds-td">{k}</td>
                        <td className="ds-td" style={{ fontWeight: 600 }}>{v}</td>
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
  )
}

// ── Toggle ─────────────────────────────────────────────────────────
function Toggle({ checked, onChange }) {
  return (
    <label className="cfp-toggle-label">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        className="cfp-toggle-input" />
      <span className="cfp-toggle-track" style={{ '--cfp-toggle-bg': checked ? 'var(--pai-indigo)' : 'var(--shell-border)' }}>
        <span className="cfp-toggle-thumb" style={{ '--cfp-toggle-thumb-left': checked ? '16px' : '2px' }} />
      </span>
    </label>
  )
}

// ── SelectDropdown ─────────────────────────────────────────────────
function SelectDropdown({ value, onChange, options, placeholder = 'Select…', fullWidth = false }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const label = options.find(o => o === value || o.value === value)
  const displayLabel = label ? (typeof label === 'string' ? label : label.label) : placeholder

  return (
    <div ref={ref} className={`cfp-select-wrap${fullWidth ? ' cfp-select-wrap--full' : ''}`}>
      <button
        className={`comp-sort-btn comp-select-btn${open ? ' comp-sort-btn--active' : ''}${fullWidth ? ' cfp-select-btn--full' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        <span>{displayLabel}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>
      {open && (
        <div className={`comp-sort-menu${fullWidth ? ' cfp-sort-menu--full' : ''}`}>
          {options.map(opt => {
            const v = typeof opt === 'string' ? opt : opt.value
            const l = typeof opt === 'string' ? opt : opt.label
            return (
              <button
                key={v}
                className={`comp-sort-item${v === value ? ' comp-sort-item--selected' : ''}`}
                onClick={() => { onChange(v); setOpen(false) }}
              >
                {l}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Mock data ──────────────────────────────────────────────────────
const TOTAL_OPEN = 1083446
const TOTAL_ALL  = 1391872


const ROWS = [
  { title: 'Devices with End-of-Life OS',           entity: 'WORK-ZOA825.ACNA.CORP.COM',    type: 'device',   evidence: 'OS: Ubuntu 18.04.6 18 64-bit x64, End of Life Date: null' },
  { title: 'Malware scan overdue',                  entity: 'WORK-CZS929.ACNA.CORP.COM',    type: 'device',   evidence: 'AV Scan SLA Breach Duration: null, AV Last Scan Date: null' },
  { title: 'Authentication factors not configured', entity: 'ANN PHELPS',                   type: 'identity', evidence: 'Authentication Methods Registered: null, Authentication Factors: []' },
  { title: 'MFA not enabled',                       entity: 'SERVER-POR119',                type: 'multi',    evidence: 'Authentication Methods Registered: null, Authentication Factors: []' },
  { title: 'Full disk encryption not enforced',     entity: 'AWSEC22135',                   type: 'cloud',    evidence: 'Full Disk Encryption Status: false' },
  { title: 'Vulnerability scan overdue',            entity: 'WORK-TWP190.ACNA.CORP.COM',    type: 'device',   evidence: 'VM Last Scan Date: null, VM Scan SLA Breach Duration: null' },
  { title: 'Unaccountable devices',                 entity: 'WORK-NWG159.ACNA.CORP.COM',    type: 'device',   evidence: 'Active Owner Count: 0' },
  { title: 'Unaccountable devices',                 entity: 'WORK-SYJ357206.ACNA.CORP.COM', type: 'device',   evidence: 'Active Owner Count: 0' },
  { title: 'EDR agent not fully functional',        entity: 'LSERVER-B2709K.ACNA.CORP.COM', type: 'device',   evidence: 'EDR Fully Functional: false' },
  { title: 'No login activity',                     entity: 'VM-TSR11632.ACNA.CORP.COM',    type: 'device',   evidence: 'Days Since Last Login: null' },
  { title: 'Authentication factors not configured', entity: 'JAMES PATRICK',                type: 'identity', evidence: 'Authentication Methods Registered: null, Authentication Factors: []' },
  { title: 'Host firewall disabled',                entity: 'WORK-WJM234233.ACNA.CORP.COM', type: 'device',   evidence: 'Firewall Status: false' },
  { title: 'MFA not enabled',                       entity: 'LSERVER-O2240Z',               type: 'multi',    evidence: 'Authentication Methods Registered: null, Authentication Factors: []' },
  { title: 'FIM not enabled',                       entity: 'VM-TSR51049',                  type: 'device',   evidence: 'EDR FIM Policy Status: false' },
  { title: 'EDR agent not fully functional',        entity: 'LSERVER-Z3903P.ACNA.CORP.COM', type: 'device',   evidence: 'EDR Fully Functional: false' },
  { title: 'Unaccountable devices',                 entity: 'WORK-LNQ285177.ACNA.CORP.COM', type: 'device',   evidence: 'Active Owner Count: 0' },
  { title: 'Patch management overdue',              entity: 'PAI-DEMO-PROD-CAST-63537D6F',  type: 'cloud',    evidence: 'Patch Status: overdue, Days Since Last Patch: 214' },
  { title: 'No login activity',                     entity: 'SARAH CONNORS',                type: 'identity', evidence: 'Days Since Last Login: null' },
  { title: 'Host firewall disabled',                entity: '10.126.184.252',               type: 'device',   evidence: 'Firewall Status: false' },
  { title: 'Vulnerability scan overdue',            entity: 'VM-TSR45197',                  type: 'device',   evidence: 'VM Last Scan Date: null, VM Scan SLA Breach Duration: null' },
  { title: 'Devices with End-of-Life OS',           entity: 'WORK-FLR646.ACNA.CORP.COM',   type: 'device',   evidence: 'OS: Windows Server 2008 R2, End of Life Date: 2020-01-14' },
  { title: 'Malware scan overdue',                  entity: 'WORK-JRF656228.ACNA.CORP.COM', type: 'device',   evidence: 'AV Scan SLA Breach Duration: null, AV Last Scan Date: null' },
  { title: 'MFA not enabled',                       entity: 'WORK-BQN304189.ACNA.CORP.COM', type: 'device',   evidence: 'Authentication Methods Registered: null, Authentication Factors: []' },
  { title: 'FIM not enabled',                       entity: 'WORK-FMJ966.ACNA.CORP.COM',   type: 'device',   evidence: 'EDR FIM Policy Status: false' },
  { title: 'EDR agent not fully functional',        entity: 'WORK-BQN304182.ACNA.CORP.COM', type: 'device',   evidence: 'EDR Fully Functional: false' },
]

export default function ComplianceFindingsPage({ filter = null, onClearFilter, onNav }) {
  const [inclClosed, setInclClosed]     = useState(false)
  const [search, setSearch]             = useState('')
  const [page, setPage]                 = useState(1)
  const [rowsPerPage, setRowsPerPage]   = useState(25)
  const [downloadOpen, setDownloadOpen] = useState(false)
  const [remediationRow, setRemediationRow]         = useState(null) // { i, rect }
  const [findingDrawerRow, setFindingDrawerRow]     = useState(null)
  const [createTicketEntity, setCreateTicketEntity] = useState(null) // null | string
  const [ctDescription, setCtDescription]           = useState('')
  const [ctAssignee, setCtAssignee]                 = useState('Patch Admin')
  const [toast, setToast]                           = useState(null) // { type, msg }
  const downloadRef = useRef(null)
  const { addDownload } = useDownloads()

  // Reset to page 1 whenever filter changes
  useEffect(() => { setPage(1) }, [filter])

  useEffect(() => {
    if (!downloadOpen) return
    const handler = e => { if (downloadRef.current && !downloadRef.current.contains(e.target)) setDownloadOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [downloadOpen])

  const openCreateTicket = useCallback((entity, findingTitle) => {
    setCtDescription(findingTitle ?? '')
    setCreateTicketEntity(entity)
  }, [])

  const closeCreateTicket = useCallback(() => setCreateTicketEntity(null), [])

  const handleCreateTicket = useCallback(() => {
    closeCreateTicket()
    setRemediationRow(null)
    const success = Math.random() > 0.2
    const type = success ? 'success' : 'error'
    const msg = success ? 'Ticket created successfully.' : 'Failed to create ticket. Please try again.'
    setToast({ type, msg })
    if (success) setTimeout(() => setToast(null), 3000)
  }, [closeCreateTicket])

  // Apply matrix filter: match rows whose entity type loosely maps to the selected column/row
  const filteredRows = (() => {
    let rows = filter
      ? ROWS.filter(row => {
          const rowMatch = filter.row ? row.entity.toLowerCase().includes(filter.row.toLowerCase()) ||
            (filter.groupBy === 'Entity Type' && (
              (filter.row === 'Host / Device'  && row.type === 'device') ||
              (filter.row === 'Cloud Account'  && row.type === 'cloud') ||
              (filter.row === 'Identity'       && row.type === 'identity') ||
              (filter.row === 'Storage'        && row.type === 'storage')
            )) : true
          return rowMatch
        })
      : ROWS
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      rows = rows.filter(r => [r.title, r.entity, r.evidence].join(' ').toLowerCase().includes(q))
    }
    return rows
  })()

  const total = filter
    ? filteredRows.length
    : inclClosed ? TOTAL_ALL : TOTAL_OPEN

  const visibleRows = filteredRows.slice((page - 1) * rowsPerPage, page * rowsPerPage)

  return (
    <>
      <div className="cfp-page">

        {/* Card container */}
        <div className="cfp-card">

          {/* Widget header */}
          <div className="cfp-header">
            <span className="cfp-header-title">
              Findings Details ({total.toLocaleString()})
            </span>
            <div className="cfp-header-actions">
              {!filter && (
                <label className="comp-drawer-incl-label">
                  Include Passed Findings
                  <Toggle checked={inclClosed} onChange={v => { setInclClosed(v); setPage(1) }} />
                </label>
              )}
              <DSPillSearch value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search Any" width={200} />
              <div ref={downloadRef} className="cfp-download-wrap">
                <button
                  className={`ds-btn sz-sm t-outline${downloadOpen ? ' comp-sort-btn--active' : ''}`}
                  onClick={() => setDownloadOpen(o => !o)}
                >
                  <IcDownload />
                  Download
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="m6 9 6 6 6-6"/>
                  </svg>
                </button>
                {downloadOpen && (
                  <div className="comp-sort-menu comp-sort-menu--right">
                    {[
                      { label: 'Export as CSV', ext: 'csv' },
                      { label: 'Export as PDF', ext: 'pdf' },
                      { label: 'Export as Excel', ext: 'xlsx' },
                    ].map(opt => (
                      <button
                        key={opt.label}
                        className="comp-sort-item"
                        onClick={(e) => { addDownload(`Compliance-Findings.${opt.ext}`, e.currentTarget); setDownloadOpen(false); }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Active filter bar */}
          {filter && (
            <div className="cfp-filter-bar">
              <span className="cfp-filter-label">Filtered by:</span>
              <span className="cfp-filter-chip">{filter.frameworkName}</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--shell-text-muted)" strokeWidth="2" strokeLinecap="round"><path d="m9 18 6-6-6-6"/></svg>
              <span className="cfp-filter-chip">{filter.col}</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--shell-text-muted)" strokeWidth="2" strokeLinecap="round"><path d="m9 18 6-6-6-6"/></svg>
              <span className="cfp-filter-chip">{filter.groupBy}: {filter.row}</span>
              <button className="cfp-filter-clear" onClick={onClearFilter}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <line x1="1" y1="1" x2="9" y2="9"/><line x1="9" y1="1" x2="1" y2="9"/>
                </svg>
                Clear filter
              </button>
            </div>
          )}

          {/* Table */}
          <div className="ds-table-wrap cfp-table-wrap">
            <table className="ds-table">
              <thead>
                <tr>
                  <th className="ds-th">Finding Title</th>
                  <th className="ds-th">Associated Entities</th>
                  <th className="ds-th">Evidence</th>
                  <th className="ds-th">Status</th>
                  <th className="ds-th cfp-th-actions">Action</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row, i) => (
                  <tr key={i} className="cfp-tr--clickable" onClick={() => setFindingDrawerRow(row)}>
                    <td className="ds-td cfp-td-title">{row.title}</td>
                    <td className="ds-td">
                      <div className="cfp-entity-cell">
                        <EntityBadge type={row.type} />
                        <span>{row.entity}</span>
                      </div>
                    </td>
                    <td className="ds-td cfp-td-evidence">{row.evidence}</td>
                    <td className="ds-td">
                      <span className="comp-drawer-status-open">Open</span>
                    </td>
                    <td className="ds-td">
                      <div className="cfp-td-actions">
                        <button
                          className="comp-drawer-action-icon"
                          title="Remediation"
                          onClick={e => {
                            e.stopPropagation()
                            const rect = e.currentTarget.getBoundingClientRect()
                            const globalI = (page - 1) * rowsPerPage + i
                            setRemediationRow(prev =>
                              prev !== null && prev.i === globalI ? null : { i: globalI, rect }
                            )
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
            total={total}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={setPage}
            onRowsPerPageChange={n => { setRowsPerPage(n); setPage(1) }}
          />
        </div>
      </div>

      {/* Finding detail drawer */}
      {findingDrawerRow && (
        <FindingDrawer row={findingDrawerRow} onClose={() => setFindingDrawerRow(null)} />
      )}

      {/* Remediation popup */}
      {remediationRow !== null && (
        <>
          <div className="cfp-remediation-overlay" onClick={() => setRemediationRow(null)} />
          <div className="comp-remediation-popup" style={{
            top: Math.min(remediationRow.rect.top, window.innerHeight - 560),
            left: remediationRow.rect.left - 608,
          }}>
            <div className="comp-remediation-header">
              <div className="cfp-rem-title-wrap">
                <span className="comp-remediation-title">Remediation Actions</span>
                <span className="comp-remediation-note">Note: AI-generated remediations offer valuable guidance, but we recommend verifying and validating before implementation.</span>
              </div>
              <div className="cfp-rem-actions">
                <button className="comp-drawer-kg-btn" onClick={() => openCreateTicket(ROWS[remediationRow.i]?.entity ?? '', ROWS[remediationRow.i]?.title ?? '')}>
                  Create Ticket
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>
                <button className="comp-drawer-action-icon" onClick={() => setRemediationRow(null)}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <line x1="1" y1="1" x2="9" y2="9"/><line x1="9" y1="1" x2="1" y2="9"/>
                  </svg>
                </button>
              </div>
            </div>
            <div className="comp-remediation-body">
              <div className="comp-remediation-rec">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--pai-high-fg)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="cfp-rem-warning-icon">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <span className="cfp-rem-rec-text">
                  Recommendation: Register all unmanaged devices in Active Directory and establish ongoing device inventory management
                </span>
              </div>
              <ol className="comp-remediation-steps">
                <li>Identify all devices missing from AD by cross-referencing network discovery results with current AD computer objects</li>
                <li>Verify ownership and business justification for each unregistered device through asset owners or department managers</li>
                <li>Join approved devices to the Active Directory domain following your organization's standard computer naming convention</li>
                <li>Remove or isolate any unauthorized or unmanaged devices that cannot be justified for business use</li>
                <li>Apply appropriate Group Policy Objects to newly joined devices based on their role and security requirements</li>
                <li>Implement automated discovery tools or scripts to regularly audit for new unmanaged devices on the network</li>
                <li>Establish a formal device onboarding process requiring AD registration before network access</li>
              </ol>
              <p className="comp-remediation-summary">
                This remediation will ensure all legitimate devices receive proper security policies, centralized management, and maintain compliance with organizational governance standards.
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
        <div className="sfm-dialog" key={createTicketEntity} onMouseDown={e => e.stopPropagation()}>
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
              <div className="sfm-field">
                <label className="sfm-field-label">Remediation Recommendation</label>
                <div className="ct-ai-content">
                  <p className="cfp-rec-title">Recommendation: Register all unmanaged devices in Active Directory and establish ongoing device inventory management</p>
                  <ol className="cfp-rec-steps">
                    <li>Identify all devices missing from AD by cross-referencing network discovery results with current AD computer objects</li>
                    <li>Verify ownership and business justification for each unregistered device through asset owners or department managers</li>
                    <li>Join approved devices to the Active Directory domain following your organization's standard computer naming convention</li>
                    <li>Remove or isolate any unauthorized or unmanaged devices that cannot be justified for business use</li>
                    <li>Apply appropriate Group Policy Objects to newly joined devices based on their role and security requirements</li>
                    <li>Implement automated discovery tools or scripts to regularly audit for new unmanaged devices on the network</li>
                  </ol>
                </div>
              </div>
          </div>
          <div className="sfm-footer">
            <button onClick={closeCreateTicket} className="sfm-cancel">Cancel</button>
            <button onClick={handleCreateTicket} className="sfm-create">Create</button>
          </div>
        </div>
        </>
      )}

      {/* Toast notification */}
      {toast && (
        <div className="ds-toast-container">
          <div className={`ds-toast ${toast.type}`}>
            <span>{toast.msg}</span>
            <button className="ds-toast-dismiss" onClick={() => setToast(null)}>×</button>
          </div>
        </div>
      )}
    </>
  )
}
