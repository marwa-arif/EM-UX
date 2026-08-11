import React, { useState, useCallback, useRef, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, PieChart, Pie, Cell } from 'recharts'
import { DSPillSearch } from '../context/WorkspaceCtx.jsx'
import TablePagination from '../components/TablePagination.jsx'
import TimeRangeTabs from '../components/TimeRangeTabs.jsx'
import { useDropdownExit } from '../hooks/useDropdownExit.js'
import { FindingDrawer } from './ComplianceFindingsPage.jsx'
import '../styles/compliance.css'
import '../styles/drawer.css'
import '../styles/active-filter-panel.css'
import { useDownloads } from '../DownloadsContext.jsx'
import { useToast } from '../context/ToastCtx.jsx'

// ── Icons ─────────────────────────────────────────────────────────
const IcSearch = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
)
const IcCollapse = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/>
  </svg>
)
const IcChevronRight = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6"/>
  </svg>
)
const IcChevronDown = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6"/>
  </svg>
)
const IcSort = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/>
  </svg>
)
const IcTrendUp = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
)
const IcExpand = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="m21 3-7 7"/><path d="m3 21 7-7"/>
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

const ENTITY_ICON_SRCS = {
  cloud:    'assets/icons/entities/cloud-account.svg',
  device:   'assets/icons/entities/host.svg',
  identity: 'assets/icons/entities/identity.svg',
  storage:  'assets/icons/entities/storage.svg',
  multi:    'assets/icons/entities/assessment.svg',
}

// Maps this app's entity-badge vocabulary (device/cloud/identity/storage) to
// the Knowledge Graph page's node-type keys, for "Explore in Knowledge Graph".
const KG_ENTITY_TYPE = { device: 'host', cloud: 'cloudAccount', identity: 'identity', storage: 'storage' }

function EntityBadge({ type }) {
  const src = ENTITY_ICON_SRCS[type] || ENTITY_ICON_SRCS.multi
  return (
    <span className="comp-entity-badge">
      <img src={src} width={16} height={16} alt="" />
    </span>
  )
}

// ── Framework logo badge ──────────────────────────────────────────
const FW_META = {
  nist:     { abbr: 'NIST', ring: '#DDE4F8', fg: '#2B47B5' },
  pci:      { abbr: 'PCI',  ring: '#E4F4EF', fg: '#1A7A52' },
  cmmc:     { abbr: 'CM',   ring: '#E8EFF8', fg: '#2255A0' },
  csa:      { abbr: 'CSA',  ring: '#E0F4F4', fg: '#1A7A7A' },
  fedramp:  { abbr: 'FR',   ring: '#EEF0F8', fg: '#4042A0' },
  cis:      { abbr: 'CIS',  ring: '#F2EEF8', fg: '#6040A0' },
  iso:      { abbr: 'ISO',  ring: '#F8EEEE', fg: '#A03030' },
  soc:      { abbr: 'SOC',  ring: '#F8F4EE', fg: '#A07030' },
}

const FW_ICONS = {
  scf:        'assets/icons/frameworks/scf.svg',
  nist_csf:   'assets/icons/frameworks/nist_csf.svg',
  nist_800:   'assets/icons/frameworks/nist_800.svg',
  pci_dss:    'assets/icons/frameworks/pci_dss.svg',
  cmmc_1:     'assets/icons/frameworks/cmmc_1.svg',
  cmmc_2:     'assets/icons/frameworks/cmmc_2.svg',
  cis:        'assets/icons/frameworks/cis.svg',
  hipaa:      'assets/icons/frameworks/hipaa.svg',
  csa_ccm:    null,
  fedramp:    null,
  iso_27001:  null,
  soc2:       null,
  nist_ai:    null,
  cis_csc:    'assets/icons/frameworks/cis.svg',
  cmmc_3:     'assets/icons/frameworks/cmmc_2.svg',
  fedramp_h:  null,
  gdpr:       null,
  ccpa:       null,
  swift:      null,
  dora:       null,
  ens:        null,
  ism:        null,
  iasme:      null,
  cyber_ess:  null,
  soc2_cc:    null,
  nist_priv:  'assets/icons/frameworks/nist_800.svg',
  pci_pin:    'assets/icons/frameworks/pci_dss.svg',
  iso_22301:  null,
  cobit:      null,
}

const FW_ICONS_DARK = {
  nist_csf:   'assets/icons/frameworks/nist_dark.svg',
  nist_800:   'assets/icons/frameworks/nist_dark.svg',
  nist_priv:  'assets/icons/frameworks/nist_dark.svg',
}

function FwLogo({ icon, darkIcon, meta }) {
  return (
    <div
      className={icon ? 'comp-fw-logo-wrap comp-fw-logo-wrap--icon' : 'comp-fw-logo-wrap'}
      style={icon ? undefined : { '--comp-fw-ring': meta.ring }}
    >
      {icon
        ? darkIcon
          ? <>
              <img src={icon} width={24} height={24} alt="" className="comp-fw-logo-img comp-fw-logo-img--light" />
              <img src={darkIcon} width={24} height={24} alt="" className="comp-fw-logo-img comp-fw-logo-img--dark" />
            </>
          : <img src={icon} width={24} height={24} alt="" className="comp-fw-logo-img" />
        : <span className="comp-fw-logo-abbr" style={{ '--comp-fw-abbr-color': meta.fg }}>{meta.abbr}</span>
      }
    </div>
  )
}

function barColor(pct) {
  if (pct >= 85) return 'var(--pai-green)'
  if (pct >= 60) return 'var(--pai-high-fg)'
  return 'var(--pai-crit-fg)'
}
function cardRgb(pct) {
  if (pct >= 85) return '43,160,76'
  if (pct >= 60) return '245,130,13'
  return '225,82,82'
}

// ── Frameworks data (28 total, first 8 visible) ───────────────────
const FRAMEWORKS = [
  { id: 'nist_csf',   meta: FW_META.nist,    name: 'NIST CSF v2.0',           assessments: 218,  pct: 89 },
  { id: 'nist_800',   meta: FW_META.nist,    name: 'NIST 800-53 rev5',         assessments: 315,  pct: 88 },
  { id: 'pci_dss',    meta: FW_META.pci,     name: 'PCI DSS v4',               assessments: 352,  pct: 89 },
  { id: 'cmmc_1',     meta: FW_META.cmmc,    name: 'CMMC 2.0 Level 1',         assessments: 28,   pct: 56 },
  { id: 'cmmc_2',     meta: FW_META.cmmc,    name: 'CMMC 2.0 Level 2',         assessments: 79,   pct: 52 },
  { id: 'csa_ccm',    meta: FW_META.csa,     name: 'CSA CCM v4',               assessments: 63,   pct: 91 },
  { id: 'fedramp',    meta: FW_META.fedramp, name: 'FedRAMP R5 - Moderate',    assessments: 74,   pct: 93 },
  { id: 'cis',        meta: FW_META.cis,     name: 'CIS v9.1',                 assessments: 112,  pct: 78 },
  { id: 'iso_27001',  meta: FW_META.iso,     name: 'ISO 27001:2022',           assessments: 156,  pct: 82 },
  { id: 'soc2',       meta: FW_META.soc,     name: 'SOC 2 Type II',            assessments: 94,   pct: 87 },
  { id: 'hipaa',      meta: FW_META.pci,     name: 'HIPAA Security Rule',      assessments: 45,   pct: 74 },
  { id: 'nist_ai',    meta: FW_META.nist,    name: 'NIST AI RMF',              assessments: 38,   pct: 68 },
  { id: 'cis_csc',    meta: FW_META.cis,     name: 'CIS Controls v8',          assessments: 88,   pct: 81 },
  { id: 'cmmc_3',     meta: FW_META.cmmc,    name: 'CMMC 2.0 Level 3',         assessments: 120,  pct: 49 },
  { id: 'fedramp_h',  meta: FW_META.fedramp, name: 'FedRAMP R5 - High',        assessments: 82,   pct: 91 },
  { id: 'gdpr',       meta: FW_META.iso,     name: 'GDPR',                     assessments: 67,   pct: 77 },
  { id: 'ccpa',       meta: FW_META.soc,     name: 'CCPA',                     assessments: 29,   pct: 85 },
  { id: 'swift',      meta: FW_META.pci,     name: 'SWIFT CSCF 2024',          assessments: 55,   pct: 72 },
  { id: 'dora',       meta: FW_META.csa,     name: 'DORA',                     assessments: 41,   pct: 63 },
  { id: 'ens',        meta: FW_META.fedramp, name: 'ENS High',                 assessments: 98,   pct: 88 },
  { id: 'ism',        meta: FW_META.cis,     name: 'ISM (AU)',                 assessments: 73,   pct: 79 },
  { id: 'iasme',      meta: FW_META.iso,     name: 'IASME Governance',         assessments: 52,   pct: 84 },
  { id: 'cyber_ess',  meta: FW_META.csa,     name: 'Cyber Essentials Plus',    assessments: 34,   pct: 91 },
  { id: 'soc2_cc',    meta: FW_META.soc,     name: 'SOC 2 CC Series',          assessments: 61,   pct: 86 },
  { id: 'nist_priv',  meta: FW_META.nist,    name: 'NIST Privacy Framework',   assessments: 47,   pct: 70 },
  { id: 'pci_pin',    meta: FW_META.pci,     name: 'PCI PIN Security',         assessments: 22,   pct: 93 },
  { id: 'iso_22301',  meta: FW_META.iso,     name: 'ISO 22301:2019',           assessments: 39,   pct: 80 },
  { id: 'cobit',      meta: FW_META.soc,     name: 'COBIT 2019',              assessments: 110,  pct: 75 },
]

// ── Score trend data ──────────────────────────────────────────────
const SCORE_TREND = {
  '1W': [
    { name: '2 Jul',  value: 87 },
    { name: '3 Jul',  value: 87 },
    { name: '4 Jul',  value: 88 },
    { name: '5 Jul',  value: 88 },
    { name: '6 Jul',  value: 88 },
    { name: '7 Jul',  value: 89 },
    { name: '8 Jul',  value: 89 },
  ],
  '1M': [
    { name: '12 Jun', value: 85 },
    { name: '19 Jun', value: 86 },
    { name: '26 Jun', value: 86 },
    { name: '3 Jul',  value: 87 },
    { name: '12 Jul', value: 89 },
  ],
  '3M': [
    { name: '12 Apr', value: 81 },
    { name: '26 Apr', value: 82 },
    { name: '10 May', value: 83 },
    { name: '24 May', value: 83 },
    { name: '7 Jun',  value: 85 },
    { name: '21 Jun', value: 86 },
    { name: '5 Jul',  value: 87 },
    { name: '12 Jul', value: 89 },
  ],
  '6M': [
    { name: 'Jan',    value: 76 },
    { name: 'Feb',    value: 78 },
    { name: 'Mar',    value: 80 },
    { name: 'Apr',    value: 81 },
    { name: 'May',    value: 83 },
    { name: 'Jun',    value: 86 },
    { name: '12 Jul', value: 89 },
  ],
  '1Y': [
    { name: 'Jul 23', value: 68 },
    { name: 'Aug',    value: 71 },
    { name: 'Sep',    value: 72 },
    { name: 'Oct',    value: 74 },
    { name: 'Nov',    value: 75 },
    { name: 'Dec',    value: 76 },
    { name: 'Jan 24', value: 76 },
    { name: 'Feb',    value: 78 },
    { name: 'Mar',    value: 80 },
    { name: 'Apr',    value: 81 },
    { name: 'May',    value: 83 },
    { name: 'Jun',    value: 86 },
    { name: 'Jul',    value: 89 },
  ],
}

const FINDING_TREND = {
  '1W': [
    { name: '2 Jul',  value: 9800  },
    { name: '3 Jul',  value: 10100 },
    { name: '4 Jul',  value: 10300 },
    { name: '5 Jul',  value: 10200 },
    { name: '6 Jul',  value: 10500 },
    { name: '7 Jul',  value: 10800 },
    { name: '8 Jul',  value: 11000 },
  ],
  '1M': [
    { name: '12 Jul', value: 9800  },
    { name: '19 Jul', value: 10200 },
    { name: '26 Jul', value: 18000 },
    { name: '2 Aug',  value: 32000 },
    { name: '8 Aug',  value: 46000 },
  ],
  '3M': [
    { name: '12 Apr', value: 6000  },
    { name: '26 Apr', value: 7200  },
    { name: '10 May', value: 8100  },
    { name: '24 May', value: 9000  },
    { name: '7 Jun',  value: 9500  },
    { name: '21 Jun', value: 9800  },
    { name: '5 Jul',  value: 10200 },
    { name: '12 Jul', value: 46000 },
  ],
  '6M': [
    { name: 'Jan',    value: 4000  },
    { name: 'Feb',    value: 5500  },
    { name: 'Mar',    value: 6800  },
    { name: 'Apr',    value: 7200  },
    { name: 'May',    value: 9000  },
    { name: 'Jun',    value: 9800  },
    { name: '12 Jul', value: 46000 },
  ],
  '1Y': [
    { name: 'Jul 23', value: 2000  },
    { name: 'Aug',    value: 2800  },
    { name: 'Sep',    value: 3500  },
    { name: 'Oct',    value: 4200  },
    { name: 'Nov',    value: 5000  },
    { name: 'Dec',    value: 5800  },
    { name: 'Jan 24', value: 6200  },
    { name: 'Feb',    value: 7000  },
    { name: 'Mar',    value: 8100  },
    { name: 'Apr',    value: 9000  },
    { name: 'May',    value: 9800  },
    { name: 'Jun',    value: 10200 },
    { name: 'Jul',    value: 46000 },
  ],
}

// ── Worst Performing Assessments ──────────────────────────────────
const WORST_ASSESSMENTS = [
  { entity: 'cloud',    name: 'Containers running in Azure should have vulnerability findings resolved',       score: 0, findings: 47800 },
  { entity: 'storage',  name: 'Storage resources have Secure File Transfer Protocol (SFTP) enabled',          score: 0, findings: 1721  },
  { entity: 'multi',    name: 'Virtual machines and virtual machine scale sets should have encryption at host', score: 0, findings: 1721  },
  { entity: 'device',   name: 'Devices have file integrity monitoring enabled',                                 score: 1, findings: 980   },
  { entity: 'cloud',    name: 'EC2 Instances have health monitoring enabled',                                   score: 1, findings: 740   },
  { entity: 'identity', name: 'Privileged access is reviewed and recertified on a regular basis',               score: 2, findings: 620   },
  { entity: 'multi',    name: 'Multi-factor authentication is enforced for all administrative access',          score: 2, findings: 510   },
  { entity: 'device',   name: 'Vulnerability scans are performed on a regular cadence',                         score: 3, findings: 420   },
  { entity: 'multi',    name: 'Software assets are inventoried and patched within defined SLAs',                score: 3, findings: 318   },
  { entity: 'cloud',    name: 'Security event logs are retained for the required duration',                     score: 4, findings: 280   },
]

// ── Static findings rows (used in assessment drawer) ─────────────
const OVERVIEW_FRAMEWORKS = [
  { key: 'scf',      control: 'END-06',    desc: 'Endpoint File Integrity Monitoring (FIM)' },
  { key: 'nist_csf', control: 'DE.CM-09',  desc: 'Computing hardware and software, runtime environments, and their data' },
  { key: 'pci_dss',  control: '2.2.6',     desc: 'System security parameters are configured to prevent misuse.' },
  { key: 'nist_800', control: 'SI-7',       desc: 'Software, Firmware, and Information Integrity' },
]

const FW_DISPLAY = {
  scf:      { name: 'SCF 2025.1.1',      abbr: 'SCF', ring: '#FEF3E2', fg: '#9A5700', icon: FW_ICONS.scf },
  nist_csf: { name: 'NIST CSF v2.0',    abbr: 'NSF', ring: '#DDE4F8', fg: '#2B47B5', icon: FW_ICONS.nist_csf },
  pci_dss:  { name: 'PCI DSS v4',       abbr: 'PCI', ring: '#E4F4EF', fg: '#1A7A52', icon: FW_ICONS.pci_dss },
  nist_800: { name: 'NIST 800-53 rev5', abbr: 'NST', ring: '#DDE4F8', fg: '#2B47B5', icon: FW_ICONS.nist_800 },
  cmmc_2:   { name: 'CMMC 2.0',         abbr: 'CM',  ring: '#E8EFF8', fg: '#2255A0', icon: FW_ICONS.cmmc_2 },
  cis:      { name: 'CIS Controls',     abbr: 'CIS', ring: '#F2EEF8', fg: '#6040A0', icon: FW_ICONS.cis },
  hipaa:    { name: 'HIPAA',            abbr: 'HPA', ring: '#EEF0F8', fg: '#4042A0', icon: FW_ICONS.hipaa },
  iso_27001:{ name: 'ISO 27001',        abbr: 'ISO', ring: '#F8EEEE', fg: '#A03030', icon: null },
}

const FW_CONTROLS = {
  scf:      { control: 'END-06',          desc: 'Endpoint File Integrity Monitoring (FIM)' },
  nist_csf: { control: 'DE.CM-09',        desc: 'Computing hardware and software, runtime environments, and their data' },
  pci_dss:  { control: '2.2.6',           desc: 'System security parameters are configured to prevent misuse' },
  nist_800: { control: 'SI-7',            desc: 'Software, Firmware, and Information Integrity' },
  cmmc_2:   { control: 'AC.L2-3.1.1',    desc: 'Limit system access to authorized users, processes acting on behalf of users, and devices' },
  cis:      { control: 'CIS-4.1',         desc: 'Establish and maintain a secure configuration process for enterprise assets and software' },
  hipaa:    { control: '164.312(a)(1)',    desc: 'Access Control — Implement technical policies and procedures for electronic information systems' },
  iso_27001:{ control: 'A.9.4.1',         desc: 'Information access restriction based on business and security requirements' },
}

const FINDINGS_ROWS = [
  { title: 'FIM not enabled', entity: 'WORK-KFI900.ACNA.CORP.COM',      evidence: 'File Integrity Monitoring: Not Enabled', status: 'Open',  type: 'device', criticality: 'High',
    frameworks: [
      { key: 'scf',      control: 'END-06',    desc: 'Endpoint File Integrity Monitoring (FIM)' },
      { key: 'nist_csf', control: 'DE.CM-09',  desc: 'Computing hardware and software, runtime environments, and their data' },
      { key: 'pci_dss',  control: '2.2.6',     desc: 'System security parameters are configured to prevent misuse.' },
      { key: 'nist_800', control: 'SI-7',       desc: 'Software, Firmware, and Information Integrity' },
    ]},
  { title: 'Full disk encryption not enforced', entity: '172.16.147.186',                  evidence: 'Full Disk Encryption Status: Disabled',                      status: 'Open',  type: 'device', criticality: 'Critical',
    frameworks: [
      { key: 'nist_csf', control: 'PR.DS-01',  desc: 'The confidentiality, integrity, and availability of data-at-rest are protected' },
      { key: 'pci_dss',  control: '3.4.1',     desc: 'Primary account numbers are secured with strong cryptography' },
    ]},
  { title: 'Security configuration baseline drift', entity: '10.126.184.252',                  evidence: 'Configuration Baseline Compliance: Drifted',                 status: 'Open',  type: 'device', criticality: 'Medium',
    frameworks: [
      { key: 'nist_800', control: 'CM-6',       desc: 'Configuration settings for information technology products' },
      { key: 'cis',      control: 'CIS-4.1',    desc: 'Establish and maintain a secure configuration process' },
      { key: 'cmmc_2',   control: 'CM.L2-3.4.1',desc: 'Establish and maintain baseline configurations' },
    ]},
  { title: 'Malware protection not configured', entity: 'VM-TSR92112',                     evidence: 'Malware Protection Status: Not Configured',                 status: 'Open',  type: 'device', criticality: 'High',
    frameworks: [
      { key: 'scf',      control: 'END-06',    desc: 'Endpoint File Integrity Monitoring (FIM)' },
      { key: 'nist_csf', control: 'DE.CM-09',  desc: 'Computing hardware and software, runtime environments, and their data' },
      { key: 'hipaa',    control: '164.312(c)', desc: 'Integrity controls for electronic protected health information' },
      { key: 'iso_27001',control: 'A.12.2',    desc: 'Protection against malware' },
    ]},
  { title: 'Account management non-compliance', entity: 'VM-TSR45197',                     evidence: 'Account Review Status: Overdue',                             status: 'Open',  type: 'device', criticality: 'Medium',
    frameworks: [
      { key: 'nist_800', control: 'AC-2',       desc: 'Account Management' },
      { key: 'pci_dss',  control: '8.2.1',      desc: 'All user IDs and authentication credentials are managed' },
    ]},
  { title: 'Incident handling capability gap', entity: 'WORK-DOU537.ACNA.CORP.COM',       evidence: 'Incident Response Plan: Not Documented',                     status: 'Open',  type: 'device', criticality: 'High',
    frameworks: [
      { key: 'cmmc_2',   control: 'IR.L2-3.6.1',desc: 'Establish an operational incident-handling capability' },
      { key: 'nist_csf', control: 'RS.CO-02',   desc: 'Incidents are reported consistent with established criteria' },
      { key: 'iso_27001',control: 'A.16.1',     desc: 'Management of information security incidents and improvements' },
    ]},
  { title: 'Vulnerability scan overdue', entity: '10.215.233.210',                  evidence: 'Last Vulnerability Scan Date: 2025-11-02',                   status: 'Open',  type: 'device', criticality: 'Critical',
    frameworks: [
      { key: 'scf',      control: 'VUL-02',    desc: 'Vulnerability Scanning' },
      { key: 'nist_800', control: 'RA-5',       desc: 'Vulnerability Monitoring and Scanning' },
      { key: 'pci_dss',  control: '11.3.1',     desc: 'Internal vulnerability scans are performed' },
      { key: 'cis',      control: 'CIS-7.1',    desc: 'Perform automated vulnerability scans of enterprise assets' },
    ]},
  { title: 'Asset not in managed inventory', entity: 'WORK-VNR355.ACNA.CORP.COM',       evidence: 'CMDB Asset Record: Not Found',                              status: 'Open',  type: 'device', criticality: 'Medium',
    frameworks: [
      { key: 'nist_csf', control: 'ID.AM-01',   desc: 'Inventories of hardware managed by the organization are maintained' },
      { key: 'cis',      control: 'CIS-1.1',    desc: 'Establish and maintain detailed enterprise asset inventory' },
    ]},
  { title: 'Personnel screening controls missing', entity: 'VM-TSR73501',                     evidence: 'Background Check Status: Not Completed',                     status: 'Open',  type: 'device', criticality: 'High',
    frameworks: [
      { key: 'hipaa',    control: '164.308(a)', desc: 'Administrative safeguards for workforce security' },
      { key: 'nist_800', control: 'PS-3',       desc: 'Personnel Screening' },
      { key: 'iso_27001',control: 'A.7.1',     desc: 'Prior to employment — background verification checks' },
    ]},
  { title: 'Network boundary protection failure', entity: 'PAI-DEMO-PROD-CAST-63537D6F',     evidence: 'Security Group Rule: 0.0.0.0/0 Open on Port 22',            status: 'Open',  type: 'device', criticality: 'Critical',
    frameworks: [
      { key: 'nist_csf', control: 'PR.AC-05',   desc: 'Network integrity is protected, incorporating network segregation' },
      { key: 'pci_dss',  control: '1.3.1',      desc: 'Inbound traffic to the cardholder data environment is restricted' },
      { key: 'cmmc_2',   control: 'SC.L2-3.13.1',desc: 'Monitor, control, and protect communications at external boundaries' },
      { key: 'nist_800', control: 'SC-7',       desc: 'Boundary Protection' },
    ]},
  { title: 'Malware detection not deployed', entity: 'WORK-FLR646.ACNA.CORP.COM',       evidence: 'Endpoint Detection Agent: Not Installed',                    status: 'Open',  type: 'device', criticality: 'Medium',
    frameworks: [
      { key: 'scf',      control: 'END-03',    desc: 'Endpoint Protection' },
      { key: 'nist_csf', control: 'DE.CM-04',  desc: 'Malicious code is detected' },
    ]},
  { title: 'Anti-malware solution outdated', entity: 'WORK-JRF656228.ACNA.CORP.COM',    evidence: 'Anti-Malware Signature Date: 2024-02-11',                    status: 'Open',  type: 'device', criticality: 'High',
    frameworks: [
      { key: 'nist_800', control: 'SI-3',       desc: 'Malicious Code Protection' },
      { key: 'cis',      control: 'CIS-10.1',   desc: 'Deploy and maintain anti-malware software' },
      { key: 'pci_dss',  control: '5.2.1',      desc: 'Anti-malware solution deployed on all system components' },
    ]},
  { title: 'Cybersecurity role assignment gap', entity: 'WORK-BQN304189.ACNA.CORP.COM',    evidence: 'Security Owner Assigned: No',                               status: 'Open',  type: 'device', criticality: 'Medium',
    frameworks: [
      { key: 'nist_csf', control: 'GV.RR-02',   desc: 'Roles and responsibilities for cybersecurity risk management' },
      { key: 'iso_27001',control: 'A.6.1',     desc: 'Internal organization — information security roles' },
    ]},
  { title: 'Penetration testing overdue', entity: 'WORK-FMJ966.ACNA.CORP.COM',       evidence: 'Last Penetration Test Date: 2024-08-15',                    status: 'Open',  type: 'device', criticality: 'Critical',
    frameworks: [
      { key: 'scf',      control: 'VUL-06',    desc: 'Penetration Testing' },
      { key: 'pci_dss',  control: '11.4.1',     desc: 'Penetration testing methodology is defined, documented and implemented' },
      { key: 'nist_800', control: 'CA-8',       desc: 'Penetration Testing' },
      { key: 'cmmc_2',   control: 'CA.L2-3.12.1',desc: 'Periodically assess security controls in organizational systems' },
    ]},
  { title: 'Authentication management non-compliance', entity: 'WORK-BQN304182.ACNA.CORP.COM',    evidence: 'Password Policy Compliance: Failed',                        status: 'Open',  type: 'device', criticality: 'High',
    frameworks: [
      { key: 'nist_csf', control: 'PR.AA-01',   desc: 'Identities and credentials for authorized users are managed' },
      { key: 'nist_800', control: 'IA-5',       desc: 'Authenticator Management' },
    ]},
  { title: 'MFA not enabled', entity: 'WORK-YPS497248.ACNA.CORP.COM',    evidence: 'MFA Enforcement Status: Disabled',                          status: 'Open',  type: 'device', criticality: 'Medium',
    frameworks: [
      { key: 'hipaa',    control: '164.312(d)', desc: 'Person or entity authentication controls' },
      { key: 'nist_800', control: 'IA-2',       desc: 'Identification and Authentication (Organizational Users)' },
      { key: 'cis',      control: 'CIS-6.3',    desc: 'Require MFA for externally-exposed applications' },
    ]},
]

// ── Function tree data ────────────────────────────────────────────
const TREE_DATA = [
  {
    id: 'gv', name: 'GV: Govern', closed: 56163, open: 53185, pct: 51, rating: 'Moderate', criticality: 'High',
    children: [
      {
        id: 'gv_rr', name: 'GV.RR: Roles, Responsibilities, and Authorities', closed: 56162, open: 53185, pct: 51, rating: 'Moderate', criticality: 'High',
        children: [
          {
            id: 'gv_rr_02', name: 'GV.RR-02: Roles, responsibilities, and authorities related to cybersecurity risk management', closed: 56162, open: 53185, pct: 51, rating: 'Moderate', criticality: 'High',
            children: [
              { id: 'gv_rr_02_a', name: 'Devices have a single assigned owner',   closed: 19991, open: 18740, pct: 51, rating: 'Moderate', criticality: 'Medium', isLeaf: true },
              { id: 'gv_rr_02_b', name: 'Users have their role inventoried',       closed: 15910, open: 19,    pct: 99, rating: 'Strong',   criticality: 'Low',    isLeaf: true },
              { id: 'gv_rr_02_c', name: 'Devices have an active owner',            closed: 20261, open: 34426, pct: 37, rating: 'Weak',     criticality: 'High',   isLeaf: true },
            ],
          },
        ],
      },
      {
        id: 'gv_po', name: 'GV.PO: Policy', closed: 1, open: 0, pct: 100, rating: 'Compliant', criticality: 'Medium',
        children: [
          {
            id: 'gv_po_01', name: 'GV.PO-01: Policy for managing cybersecurity risks is established based on organizational requirements', closed: 1, open: 0, pct: 100, rating: 'Compliant', criticality: 'Medium',
            children: [
              { id: 'gv_po_01_a', name: 'Cybersecurity policy is documented and approved by executive leadership', closed: 1, open: 0, pct: 100, rating: 'Compliant', criticality: 'Low', isLeaf: true },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'id', name: 'ID: Identify', closed: 219945, open: 119600, pct: 64, rating: 'Moderate', criticality: 'Critical',
    children: [
      {
        id: 'id_am', name: 'ID.AM: Asset Management', closed: 189570, open: 102110, pct: 64, rating: 'Moderate', criticality: 'Critical',
        children: [
          { id: 'id_am_01', name: 'ID.AM-01: Inventories of hardware managed by the organization are maintained',                         closed: 174747, open: 94561, pct: 64, rating: 'Moderate', criticality: 'High',     children: [
              { id: 'id_am_01_a', name: 'All hardware assets are inventoried in the CMDB',                 closed: 100000, open: 50000, pct: 67, rating: 'Moderate', criticality: 'High', isLeaf: true },
              { id: 'id_am_01_b', name: 'Newly provisioned devices are auto-enrolled into inventory',      closed: 74747,  open: 44561, pct: 63, rating: 'Moderate', criticality: 'High', isLeaf: true },
            ] },
          { id: 'id_am_02', name: 'ID.AM-02: Inventories of software, services, and systems managed by the organization are maintained',  closed: 39548,  open: 15137, pct: 72, rating: 'Moderate', criticality: 'Medium',   children: [
              { id: 'id_am_02_a', name: 'Software and SaaS assets are inventoried and reconciled monthly',  closed: 25000, open: 9000, pct: 74, rating: 'Moderate', criticality: 'Medium', isLeaf: true },
              { id: 'id_am_02_b', name: 'Unauthorized/shadow IT applications are flagged for review',        closed: 14548, open: 6137, pct: 70, rating: 'Moderate', criticality: 'Medium', isLeaf: true },
            ] },
          { id: 'id_am_03', name: 'ID.AM-03: Representations of the organization\'s authorized network communication are maintained',      closed: 1,      open: 0,     pct: 100, rating: 'Compliant', criticality: 'Low',    children: [
              { id: 'id_am_03_a', name: 'Network communication baselines are documented and kept current', closed: 1, open: 0, pct: 100, rating: 'Compliant', criticality: 'Low', isLeaf: true },
            ] },
          { id: 'id_am_07', name: 'ID.AM-07: Inventories of data and corresponding metadata for designated data types are maintained',    closed: 2908,   open: 3222,  pct: 47, rating: 'Weak',     criticality: 'Critical', children: [
              { id: 'id_am_07_a', name: 'Sensitive data types are classified and mapped to storage locations', closed: 1200, open: 2000, pct: 38, rating: 'Weak', criticality: 'Critical', isLeaf: true },
              { id: 'id_am_07_b', name: 'Data inventory metadata is reviewed on a recurring cadence',           closed: 1708, open: 1222, pct: 58, rating: 'Moderate', criticality: 'High', isLeaf: true },
            ] },
          { id: 'id_am_08', name: 'ID.AM-08: Systems, hardware, software, services, and data are managed throughout their life cycles',   closed: 11914,  open: 4327,  pct: 73, rating: 'Moderate', criticality: 'Medium',   children: [
              { id: 'id_am_08_a', name: 'Asset lifecycle stage (procured/active/EOL) is tracked in the CMDB', closed: 8000, open: 2500, pct: 76, rating: 'Moderate', criticality: 'Medium', isLeaf: true },
              { id: 'id_am_08_b', name: 'End-of-life assets are decommissioned per defined SLA',              closed: 3914, open: 1827, pct: 68, rating: 'Moderate', criticality: 'High', isLeaf: true },
            ] },
        ],
      },
      {
        id: 'id_ra', name: 'ID.RA: Risk Assessment', closed: 30375, open: 17490, pct: 63, rating: 'Moderate', criticality: 'High',
        children: [
          {
            id: 'id_ra_01', name: 'ID.RA-01: Vulnerabilities in assets are identified, validated, and recorded', closed: 18000, open: 11000, pct: 62, rating: 'Moderate', criticality: 'High',
            children: [
              { id: 'id_ra_01_a', name: 'Vulnerability scans are performed on a recurring schedule',                       closed: 10000, open: 6000, pct: 63, rating: 'Moderate', criticality: 'High', isLeaf: true },
              { id: 'id_ra_01_b', name: 'Identified vulnerabilities are validated and logged in the vulnerability register', closed: 8000,  open: 5000, pct: 62, rating: 'Moderate', criticality: 'High', isLeaf: true },
            ],
          },
          {
            id: 'id_ra_05', name: 'ID.RA-05: Threats, vulnerabilities, likelihoods, and impacts are used to understand inherent risk and inform risk response prioritization', closed: 12375, open: 6490, pct: 66, rating: 'Moderate', criticality: 'High',
            children: [
              { id: 'id_ra_05_a', name: 'Risk register reflects current threat and vulnerability likelihood scoring', closed: 7000, open: 4000, pct: 64, rating: 'Moderate', criticality: 'High', isLeaf: true },
              { id: 'id_ra_05_b', name: 'Risk response priorities are reviewed by risk owners quarterly',            closed: 5375, open: 2490, pct: 68, rating: 'Moderate', criticality: 'High', isLeaf: true },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'pr', name: 'PR: Protect', closed: 7123443, open: 393013, pct: 94, rating: 'Strong', criticality: 'Medium',
    children: [
      {
        id: 'pr_aa', name: 'PR.AA: Identity Management, Authentication, and Access Control', closed: 5000000, open: 200000, pct: 96, rating: 'Strong', criticality: 'Low',
        children: [
          {
            id: 'pr_aa_01', name: 'PR.AA-01: Identities and credentials for authorized users, services, and hardware are managed by the organization', closed: 3000000, open: 100000, pct: 97, rating: 'Strong', criticality: 'Low',
            children: [
              { id: 'pr_aa_01_a', name: 'User accounts are provisioned through an approved identity lifecycle process', closed: 1800000, open: 60000, pct: 97, rating: 'Strong', criticality: 'Low', isLeaf: true },
              { id: 'pr_aa_01_b', name: 'Credentials are revoked within 24 hours of employee termination',              closed: 1200000, open: 40000, pct: 97, rating: 'Strong', criticality: 'Low', isLeaf: true },
            ],
          },
          {
            id: 'pr_aa_05', name: 'PR.AA-05: Access permissions, entitlements, and authorizations are defined in a policy, managed, enforced, and reviewed', closed: 2000000, open: 100000, pct: 95, rating: 'Strong', criticality: 'Low',
            children: [
              { id: 'pr_aa_05_a', name: 'Access permissions follow least-privilege and are reviewed periodically', closed: 1300000, open: 70000, pct: 95, rating: 'Strong', criticality: 'Low', isLeaf: true },
              { id: 'pr_aa_05_b', name: 'Privileged access requires just-in-time elevation and approval',         closed: 700000,  open: 30000, pct: 96, rating: 'Strong', criticality: 'Low', isLeaf: true },
            ],
          },
        ],
      },
      {
        id: 'pr_ds', name: 'PR.DS: Data Security', closed: 2123443, open: 193013, pct: 92, rating: 'Strong', criticality: 'Low',
        children: [
          {
            id: 'pr_ds_01', name: 'PR.DS-01: The confidentiality, integrity, and availability of data-at-rest are protected', closed: 1200000, open: 120000, pct: 91, rating: 'Strong', criticality: 'Low',
            children: [
              { id: 'pr_ds_01_a', name: 'Data at rest is encrypted using approved cryptographic standards', closed: 750000, open: 80000, pct: 90, rating: 'Strong', criticality: 'Low', isLeaf: true },
              { id: 'pr_ds_01_b', name: 'Encryption key rotation follows defined policy intervals',        closed: 450000, open: 40000, pct: 92, rating: 'Strong', criticality: 'Low', isLeaf: true },
            ],
          },
          {
            id: 'pr_ds_02', name: 'PR.DS-02: The confidentiality, integrity, and availability of data-in-transit are protected', closed: 923443, open: 73013, pct: 93, rating: 'Strong', criticality: 'Low',
            children: [
              { id: 'pr_ds_02_a', name: 'Data in transit is encrypted using TLS 1.2 or higher',            closed: 600000, open: 50000, pct: 92, rating: 'Strong', criticality: 'Low', isLeaf: true },
              { id: 'pr_ds_02_b', name: 'Unencrypted protocols are disabled on production endpoints',      closed: 323443, open: 23013, pct: 93, rating: 'Strong', criticality: 'Low', isLeaf: true },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'de', name: 'DE: Detect', closed: 284102, open: 198430, pct: 58, rating: 'Moderate', criticality: 'High',
    children: [
      {
        id: 'de_cm', name: 'DE.CM: Continuous Monitoring', closed: 200000, open: 150000, pct: 57, rating: 'Moderate', criticality: 'High',
        children: [
          {
            id: 'de_cm_01', name: 'DE.CM-01: Networks and network services are monitored to find potentially adverse events', closed: 120000, open: 90000, pct: 57, rating: 'Moderate', criticality: 'High',
            children: [
              { id: 'de_cm_01_a', name: 'Network traffic is monitored for anomalous connections',      closed: 70000, open: 50000, pct: 58, rating: 'Moderate', criticality: 'High', isLeaf: true },
              { id: 'de_cm_01_b', name: 'IDS/IPS alerts are triaged within defined SLAs',                closed: 50000, open: 40000, pct: 56, rating: 'Moderate', criticality: 'High', isLeaf: true },
            ],
          },
          {
            id: 'de_cm_09', name: 'DE.CM-09: Computing hardware and software, runtime environments, and their data are monitored to find potentially adverse events', closed: 80000, open: 60000, pct: 57, rating: 'Moderate', criticality: 'High',
            children: [
              { id: 'de_cm_09_a', name: 'Endpoint telemetry is continuously collected from managed devices',          closed: 50000, open: 35000, pct: 59, rating: 'Moderate', criticality: 'High', isLeaf: true },
              { id: 'de_cm_09_b', name: 'Unmanaged devices connecting to the network are flagged for review',        closed: 30000, open: 25000, pct: 55, rating: 'Moderate', criticality: 'High', isLeaf: true },
            ],
          },
        ],
      },
      {
        id: 'de_ae', name: 'DE.AE: Adverse Event Analysis', closed: 84102, open: 48430, pct: 63, rating: 'Moderate', criticality: 'High',
        children: [
          {
            id: 'de_ae_02', name: 'DE.AE-02: Potentially adverse events are analyzed to better understand associated activities', closed: 50000, open: 28430, pct: 64, rating: 'Moderate', criticality: 'High',
            children: [
              { id: 'de_ae_02_a', name: 'Security events are correlated across log sources in the SIEM',      closed: 32000, open: 18000, pct: 64, rating: 'Moderate', criticality: 'High', isLeaf: true },
              { id: 'de_ae_02_b', name: 'Analysts document root cause for closed adverse-event tickets',      closed: 18000, open: 10430, pct: 63, rating: 'Moderate', criticality: 'High', isLeaf: true },
            ],
          },
          {
            id: 'de_ae_07', name: 'DE.AE-07: Cyber threat intelligence and other contextual information are integrated into the analysis', closed: 34102, open: 20000, pct: 63, rating: 'Moderate', criticality: 'High',
            children: [
              { id: 'de_ae_07_a', name: 'Threat intelligence feeds are ingested into the detection pipeline', closed: 20102, open: 12000, pct: 63, rating: 'Moderate', criticality: 'High', isLeaf: true },
              { id: 'de_ae_07_b', name: 'IOC matches trigger automated enrichment workflows',                 closed: 14000, open: 8000,  pct: 64, rating: 'Moderate', criticality: 'High', isLeaf: true },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'rs', name: 'RS: Respond', closed: 71245, open: 28910, pct: 71, rating: 'Moderate', criticality: 'Medium',
    children: [
      {
        id: 'rs_ma', name: 'RS.MA: Incident Management', closed: 45000, open: 18000, pct: 71, rating: 'Moderate', criticality: 'Medium',
        children: [
          {
            id: 'rs_ma_01', name: 'RS.MA-01: The incident response plan is executed once an incident is declared', closed: 28000, open: 10000, pct: 74, rating: 'Moderate', criticality: 'Medium',
            children: [
              { id: 'rs_ma_01_a', name: 'Incident response plan is invoked upon declared incidents',       closed: 18000, open: 6000, pct: 75, rating: 'Moderate', criticality: 'Medium', isLeaf: true },
              { id: 'rs_ma_01_b', name: 'Post-incident reviews are completed within 10 business days',    closed: 10000, open: 4000, pct: 71, rating: 'Moderate', criticality: 'Medium', isLeaf: true },
            ],
          },
          {
            id: 'rs_ma_02', name: 'RS.MA-02: Incidents are categorized and prioritized', closed: 17000, open: 8000, pct: 68, rating: 'Moderate', criticality: 'High',
            children: [
              { id: 'rs_ma_02_a', name: 'Incidents are triaged and assigned a severity within 1 hour of detection', closed: 10000, open: 5000, pct: 67, rating: 'Moderate', criticality: 'High', isLeaf: true },
              { id: 'rs_ma_02_b', name: 'Incident priority is re-evaluated as new evidence emerges',               closed: 7000,  open: 3000, pct: 70, rating: 'Moderate', criticality: 'Medium', isLeaf: true },
            ],
          },
        ],
      },
      {
        id: 'rs_co', name: 'RS.CO: Incident Response Reporting and Communication', closed: 26245, open: 10910, pct: 71, rating: 'Moderate', criticality: 'Medium',
        children: [
          {
            id: 'rs_co_02', name: 'RS.CO-02: Internal and external stakeholders are notified of incidents', closed: 15000, open: 6000, pct: 71, rating: 'Moderate', criticality: 'High',
            children: [
              { id: 'rs_co_02_a', name: 'Stakeholders are notified per the communication plan within SLA', closed: 9000, open: 4000, pct: 69, rating: 'Moderate', criticality: 'High', isLeaf: true },
              { id: 'rs_co_02_b', name: 'Regulatory notification timelines are tracked and met',           closed: 6000, open: 2000, pct: 75, rating: 'Moderate', criticality: 'Medium', isLeaf: true },
            ],
          },
          {
            id: 'rs_co_03', name: 'RS.CO-03: Information is shared with designated internal and external stakeholders per the response plan', closed: 11245, open: 4910, pct: 70, rating: 'Moderate', criticality: 'Medium',
            children: [
              { id: 'rs_co_03_a', name: 'Incident details are shared with relevant ISACs where applicable', closed: 6245, open: 2910, pct: 68, rating: 'Moderate', criticality: 'High', isLeaf: true },
              { id: 'rs_co_03_b', name: 'Lessons learned are distributed to affected business units',      closed: 5000, open: 2000, pct: 71, rating: 'Moderate', criticality: 'Medium', isLeaf: true },
            ],
          },
        ],
      },
    ],
  },
]

// ── Dummy control trees for non-NIST frameworks ────────────────────
// Deterministic (hash-seeded) so counts/ratings stay stable across renders,
// mirroring the shape of TREE_DATA above (function -> category -> leaves,
// with parent closed/open always the sum of its children's).
function hash32(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 16777619)
  }
  return h >>> 0
}

function deriveLeafMetrics(id) {
  const h = hash32(id)
  const pct = 35 + (h % 65)
  const total = 200 + (h % 12000)
  const closed = Math.round(total * pct / 100)
  const open = total - closed
  const rating = open === 0 ? 'Compliant' : pct >= 85 ? 'Strong' : pct >= 55 ? 'Moderate' : 'Weak'
  const criticality = pct < 55 ? 'Critical' : pct < 70 ? 'High' : pct < 85 ? 'Medium' : 'Low'
  return { closed, open, pct, rating, criticality }
}

const CRITICALITY_RANK = { Low: 0, Medium: 1, High: 2, Critical: 3 }

function aggregateMetrics(nodes) {
  const closed = nodes.reduce((s, n) => s + n.closed, 0)
  const open = nodes.reduce((s, n) => s + n.open, 0)
  const pct = closed + open ? Math.round((closed / (closed + open)) * 100) : 100
  const rating = open === 0 ? 'Compliant' : pct >= 85 ? 'Strong' : pct >= 55 ? 'Moderate' : 'Weak'
  const criticality = nodes.reduce(
    (worst, n) => (CRITICALITY_RANK[n.criticality] > CRITICALITY_RANK[worst] ? n.criticality : worst),
    'Low'
  )
  return { closed, open, pct, rating, criticality }
}

function buildFrameworkTree(fwId, taxonomy) {
  return taxonomy.map(fn => {
    const fnId = `${fwId}_${fn.key}`
    const children = fn.categories.map(cat => {
      const catId = `${fnId}_${cat.key}`
      const leaves = cat.leaves.map((leafName, li) => {
        const leafId = `${catId}_${li}`
        return { id: leafId, name: leafName, isLeaf: true, ...deriveLeafMetrics(leafId) }
      })
      return { id: catId, name: cat.name, children: leaves, ...aggregateMetrics(leaves) }
    })
    return { id: fnId, name: fn.name, children, ...aggregateMetrics(children) }
  })
}

// Only a handful of frameworks get their own taxonomy for now — others fall
// back to an explicit "not mapped yet" state rather than silently reusing
// NIST CSF data (see FRAMEWORK_TREES below).
const FRAMEWORK_TAXONOMY = {
  iso_27001: [
    { key: 'org', name: 'A.5: Organizational Controls', categories: [
        { key: 'policies', name: 'A.5.1: Policies for Information Security', leaves: [
            'Information security policy is documented and approved by management',
            'Policies are reviewed at planned intervals or upon major change',
          ]},
        { key: 'assets', name: 'A.5.9: Inventory of Information and Other Associated Assets', leaves: [
            'Information assets are inventoried and classified by sensitivity',
          ]},
      ]},
    { key: 'people', name: 'A.6: People Controls', categories: [
        { key: 'training', name: 'A.6.3: Information Security Awareness, Education and Training', leaves: [
            'Personnel complete security awareness training annually',
            'Role-specific security training is tracked to completion',
          ]},
      ]},
    { key: 'physical', name: 'A.7: Physical Controls', categories: [
        { key: 'entry', name: 'A.7.2: Physical Entry', leaves: [
            'Physical access to secure areas is restricted to authorized personnel',
          ]},
      ]},
    { key: 'tech', name: 'A.8: Technological Controls', categories: [
        { key: 'config', name: 'A.8.9: Configuration Management', leaves: [
            'Secure configuration baselines are defined and enforced',
            'Configuration drift is detected and remediated',
          ]},
        { key: 'monitoring', name: 'A.8.16: Monitoring Activities', leaves: [
            'Security events are monitored and logged centrally',
          ]},
      ]},
  ],
  pci_dss: [
    { key: 'network', name: 'Build and Maintain a Secure Network', categories: [
        { key: 'req1', name: 'Requirement 1: Install and Maintain Network Security Controls', leaves: [
            'Firewall and router rules restrict traffic to the cardholder data environment',
          ]},
      ]},
    { key: 'protect', name: 'Protect Account Data', categories: [
        { key: 'req3', name: 'Requirement 3: Protect Stored Account Data', leaves: [
            'Primary account numbers are rendered unreadable wherever stored',
          ]},
        { key: 'req4', name: 'Requirement 4: Protect Cardholder Data with Strong Cryptography During Transmission', leaves: [
            'Strong cryptography protects PAN during transmission over open networks',
          ]},
      ]},
    { key: 'vuln', name: 'Maintain a Vulnerability Management Program', categories: [
        { key: 'req6', name: 'Requirement 6: Develop and Maintain Secure Systems and Software', leaves: [
            'Critical vulnerabilities are remediated within defined SLAs',
            'Change control procedures are followed for all system changes',
          ]},
      ]},
    { key: 'access', name: 'Implement Strong Access Control Measures', categories: [
        { key: 'req8', name: 'Requirement 8: Identify Users and Authenticate Access', leaves: [
            'Multi-factor authentication is enforced for all access into the CDE',
          ]},
      ]},
  ],
  soc2: [
    { key: 'security', name: 'Security (Common Criteria)', categories: [
        { key: 'cc6', name: 'CC6: Logical and Physical Access Controls', leaves: [
            'Access to systems is restricted to authorized users',
            'Privileged access is reviewed on a recurring basis',
          ]},
        { key: 'cc7', name: 'CC7: System Operations', leaves: [
            'Security incidents are detected, tracked, and resolved',
          ]},
      ]},
    { key: 'availability', name: 'Availability', categories: [
        { key: 'a1', name: 'A1: Availability Commitments', leaves: [
            'System capacity is monitored against defined thresholds',
          ]},
      ]},
    { key: 'confidentiality', name: 'Confidentiality', categories: [
        { key: 'c1', name: 'C1: Confidential Information Protection', leaves: [
            'Confidential data is encrypted at rest and in transit',
          ]},
      ]},
    { key: 'integrity', name: 'Processing Integrity', categories: [
        { key: 'pi1', name: 'PI1: Processing Integrity', leaves: [
            'System processing is complete, accurate, and authorized',
          ]},
      ]},
  ],
  cis_csc: [
    { key: 'assets', name: 'CIS 1: Inventory and Control of Enterprise Assets', categories: [
        { key: 'inventory', name: '1.1: Establish and Maintain Detailed Enterprise Asset Inventory', leaves: [
            'All enterprise assets are inventoried and reconciled on a recurring basis',
          ]},
      ]},
    { key: 'config', name: 'CIS 4: Secure Configuration of Enterprise Assets and Software', categories: [
        { key: 'baseline', name: '4.1: Establish and Maintain a Secure Configuration Process', leaves: [
            'Secure configuration baselines are applied to all enterprise assets',
          ]},
      ]},
    { key: 'accounts', name: 'CIS 5: Account Management', categories: [
        { key: 'inactive', name: '5.3: Disable Dormant Accounts', leaves: [
            'Inactive accounts are disabled within a defined SLA',
          ]},
      ]},
    { key: 'accesscontrol', name: 'CIS 6: Access Control Management', categories: [
        { key: 'mfa', name: '6.3: Require MFA for Externally-Exposed Applications', leaves: [
            'Multi-factor authentication is required for all administrative access',
          ]},
      ]},
    { key: 'auditlog', name: 'CIS 8: Audit Log Management', categories: [
        { key: 'collect', name: '8.2: Collect Audit Logs', leaves: [
            'Audit logs are collected, centrally stored, and retained per policy',
          ]},
      ]},
  ],
  hipaa: [
    { key: 'admin', name: 'Administrative Safeguards', categories: [
        { key: '164_308_a1', name: '164.308(a)(1): Security Management Process', leaves: [
            'Risk analysis is performed and documented at planned intervals',
            'A sanction policy exists for workforce members who fail to comply',
          ]},
      ]},
    { key: 'physical', name: 'Physical Safeguards', categories: [
        { key: '164_310_a1', name: '164.310(a)(1): Facility Access Controls', leaves: [
            'Physical access to facilities housing ePHI is limited to authorized personnel',
          ]},
      ]},
    { key: 'technical', name: 'Technical Safeguards', categories: [
        { key: '164_312_a1', name: '164.312(a)(1): Access Control', leaves: [
            'Unique user identification is enforced for systems containing ePHI',
          ]},
        { key: '164_312_e1', name: '164.312(e)(1): Transmission Security', leaves: [
            'ePHI is encrypted during transmission over electronic networks',
          ]},
      ]},
  ],
  nist_800: [
    { key: 'ac', name: 'AC: Access Control', categories: [
        { key: 'ac2', name: 'AC-2: Account Management', leaves: [
            'Accounts are provisioned, reviewed, and disabled per defined lifecycle procedures',
          ]},
        { key: 'ac6', name: 'AC-6: Least Privilege', leaves: [
            'Privileged functions are restricted to explicitly authorized personnel',
          ]},
      ]},
    { key: 'au', name: 'AU: Audit and Accountability', categories: [
        { key: 'au6', name: 'AU-6: Audit Record Review, Analysis, and Reporting', leaves: [
            'Audit records are reviewed and analyzed for indications of inappropriate activity',
          ]},
      ]},
    { key: 'cm', name: 'CM: Configuration Management', categories: [
        { key: 'cm6', name: 'CM-6: Configuration Settings', leaves: [
            'Configuration settings are established and enforced against an approved baseline',
          ]},
      ]},
    { key: 'ir', name: 'IR: Incident Response', categories: [
        { key: 'ir4', name: 'IR-4: Incident Handling', leaves: [
            'Incident handling capability includes preparation, detection, containment, and recovery',
          ]},
      ]},
    { key: 'sc', name: 'SC: System and Communications Protection', categories: [
        { key: 'sc7', name: 'SC-7: Boundary Protection', leaves: [
            'System boundaries are monitored and controlled at key internal and external interfaces',
          ]},
      ]},
  ],
  cmmc_1: [
    { key: 'ac', name: 'AC.L1: Access Control', categories: [
        { key: 'ac_3_1_1', name: 'AC.L1-3.1.1: Authorized Access Control', leaves: [
            'System access is limited to authorized users, processes, and devices',
          ]},
        { key: 'ac_3_1_2', name: 'AC.L1-3.1.2: Transaction & Function Control', leaves: [
            'Authorized users are restricted to the transactions and functions they are permitted to execute',
          ]},
      ]},
    { key: 'ia', name: 'IA.L1: Identification and Authentication', categories: [
        { key: 'ia_3_5_1', name: 'IA.L1-3.5.1: Identification', leaves: [
            'Users and processes are uniquely identified before system access is granted',
          ]},
      ]},
    { key: 'mp', name: 'MP.L1: Media Protection', categories: [
        { key: 'mp_3_8_3', name: 'MP.L1-3.8.3: Media Disposal', leaves: [
            'System media containing FCI is sanitized or destroyed before disposal or reuse',
          ]},
      ]},
    { key: 'pe', name: 'PE.L1: Physical Protection', categories: [
        { key: 'pe_3_10_1', name: 'PE.L1-3.10.1: Limit Physical Access', leaves: [
            'Physical access to organizational systems and facilities is limited to authorized individuals',
          ]},
      ]},
    { key: 'sc', name: 'SC.L1: System and Communications Protection', categories: [
        { key: 'sc_3_13_1', name: 'SC.L1-3.13.1: Boundary Protection', leaves: [
            'Communications at external system boundaries are monitored, controlled, and protected',
          ]},
      ]},
  ],
  cmmc_2: [
    { key: 'ac', name: 'AC.L2: Access Control', categories: [
        { key: 'ac_3_1_3', name: 'AC.L2-3.1.3: Control CUI Flow', leaves: [
            'Information flow is controlled in accordance with approved authorizations',
          ]},
        { key: 'ac_3_1_12', name: 'AC.L2-3.1.12: Control Remote Access', leaves: [
            'Remote access sessions are monitored and controlled',
          ]},
      ]},
    { key: 'at', name: 'AT.L2: Awareness and Training', categories: [
        { key: 'at_3_2_1', name: 'AT.L2-3.2.1: Role-Based Risk Awareness', leaves: [
            'Personnel are made aware of security risks associated with their role',
          ]},
      ]},
    { key: 'au', name: 'AU.L2: Audit and Accountability', categories: [
        { key: 'au_3_3_1', name: 'AU.L2-3.3.1: System Auditing', leaves: [
            'Audit logs are created, protected, and retained to enable monitoring and investigation',
          ]},
      ]},
    { key: 'cm', name: 'CM.L2: Configuration Management', categories: [
        { key: 'cm_3_4_1', name: 'CM.L2-3.4.1: System Baselining', leaves: [
            'Baseline configurations are established and maintained throughout the system lifecycle',
          ]},
      ]},
    { key: 'ir', name: 'IR.L2: Incident Response', categories: [
        { key: 'ir_3_6_1', name: 'IR.L2-3.6.1: Incident Handling', leaves: [
            'An operational incident-handling capability is established for organizational systems',
          ]},
      ]},
  ],
  cmmc_3: [
    { key: 'ac', name: 'AC.L3: Access Control (Enhanced)', categories: [
        { key: 'ac_3_1_3e', name: 'AC.L3-3.1.3e: Enhanced Flow Control for APTs', leaves: [
            'Information flow control mechanisms are enhanced to counter advanced persistent threats',
          ]},
      ]},
    { key: 'cm', name: 'CM.L3: Configuration Management (Enhanced)', categories: [
        { key: 'cm_3_4_2e', name: 'CM.L3-3.4.2e: Automated Configuration Monitoring', leaves: [
            'Configuration changes are automatically monitored and reconciled against approved baselines',
          ]},
      ]},
    { key: 'ir', name: 'IR.L3: Incident Response (Enhanced)', categories: [
        { key: 'ir_3_6_2e', name: 'IR.L3-3.6.2e: Advanced Threat Hunting', leaves: [
            'Threat hunting activities are performed to detect advanced persistent threats',
          ]},
      ]},
    { key: 'ra', name: 'RA.L3: Risk Assessment (Enhanced)', categories: [
        { key: 'ra_3_11_1e', name: 'RA.L3-3.11.1e: Advanced Risk Analysis', leaves: [
            'Threat intelligence is incorporated into risk assessments on a recurring basis',
          ]},
      ]},
    { key: 'si', name: 'SI.L3: System and Information Integrity (Enhanced)', categories: [
        { key: 'si_3_14_1e', name: 'SI.L3-3.14.1e: Advanced Malware Defense', leaves: [
            'Advanced malware protection capabilities are deployed against sophisticated threats',
          ]},
      ]},
  ],
  cis: [
    { key: 'os', name: 'OS Hardening Benchmarks', categories: [
        { key: 'os_baseline', name: 'Level 1: Baseline OS Hardening', leaves: [
            'Operating systems are configured against CIS benchmark baseline settings',
          ]},
        { key: 'os_l2', name: 'Level 2: Defense-in-Depth OS Hardening', leaves: [
            'Defense-in-depth hardening settings are applied for high-security environments',
          ]},
      ]},
    { key: 'network', name: 'Network Device Benchmarks', categories: [
        { key: 'network_baseline', name: 'Router & Firewall Baseline Configuration', leaves: [
            'Network devices are configured per CIS benchmark recommendations',
          ]},
      ]},
    { key: 'cloud', name: 'Cloud Provider Benchmarks', categories: [
        { key: 'cloud_iam', name: 'IAM and Storage Baseline', leaves: [
            'Cloud IAM policies and storage configurations follow CIS benchmark guidance',
          ]},
      ]},
    { key: 'server', name: 'Server Application Benchmarks', categories: [
        { key: 'server_db', name: 'Database & Web Server Hardening', leaves: [
            'Server applications are hardened against CIS benchmark recommended settings',
          ]},
      ]},
  ],
  nist_priv: [
    { key: 'identify_p', name: 'ID-P: Identify-P', categories: [
        { key: 'id_im', name: 'ID.IM-P: Inventory and Mapping', leaves: [
            'Data processing activities and data flows are inventoried and mapped',
          ]},
      ]},
    { key: 'govern_p', name: 'GV-P: Govern-P', categories: [
        { key: 'gv_po', name: 'GV.PO-P: Governance Policies', leaves: [
            'Privacy values, policies, and organizational risk tolerance are established',
          ]},
      ]},
    { key: 'control_p', name: 'CT-P: Control-P', categories: [
        { key: 'ct_po', name: 'CT.PO-P: Data Processing Policies', leaves: [
            "Policies for handling individuals' privacy preferences are established",
          ]},
      ]},
    { key: 'communicate_p', name: 'CM-P: Communicate-P', categories: [
        { key: 'cm_po', name: 'CM.PO-P: Transparency Policies', leaves: [
            'Transparency of data processing practices is communicated to individuals',
          ]},
      ]},
    { key: 'protect_p', name: 'PR-P: Protect-P', categories: [
        { key: 'pr_ds', name: 'PR.DS-P: Data Protection Policies', leaves: [
            'Data-at-rest and data-in-transit are protected in accordance with the data map',
          ]},
      ]},
  ],
  pci_pin: [
    { key: 'keymgmt', name: 'Key Management', categories: [
        { key: 'key_gen', name: 'Requirement 18: Key Generation', leaves: [
            'Cryptographic keys are generated using approved random number generation methods',
          ]},
        { key: 'key_dist', name: 'Requirement 20: Key Distribution', leaves: [
            'Keys are distributed and loaded using dual-control and split-knowledge procedures',
          ]},
      ]},
    { key: 'pinproc', name: 'PIN Processing', categories: [
        { key: 'pin_enc', name: 'Requirement 3: PIN Encryption', leaves: [
            'PINs are encrypted at the point of entry and remain encrypted throughout processing',
          ]},
      ]},
    { key: 'devsec', name: 'Device Security', categories: [
        { key: 'dev_tamper', name: 'Requirement 29: Device Tamper Protection', leaves: [
            'PIN entry devices are protected against tampering and substitution',
          ]},
      ]},
  ],
}

// Frameworks with no hand-authored taxonomy above (mostly ones not yet
// surfaced as sidebar cards — see FW_ICONS) still get a plausible generic
// control taxonomy so none of them show up empty if/when they do appear.
function genericTaxonomy(fw) {
  return [
    { key: 'governance', name: `${fw.name}: Governance & Risk Management`, categories: [
        { key: 'risk', name: 'Risk Assessment & Treatment', leaves: [
            `Risk assessments aligned to ${fw.name} are performed and documented at planned intervals`,
          ]},
      ]},
    { key: 'access', name: `${fw.name}: Access Control`, categories: [
        { key: 'accesscontrol', name: 'Identity & Access Management', leaves: [
            'Access to in-scope systems is restricted to authorized users and reviewed periodically',
          ]},
      ]},
    { key: 'data', name: `${fw.name}: Data Protection`, categories: [
        { key: 'dataprotect', name: 'Data Classification & Encryption', leaves: [
            'In-scope data is classified and protected with encryption at rest and in transit',
          ]},
      ]},
    { key: 'monitoring', name: `${fw.name}: Security Monitoring & Incident Response`, categories: [
        { key: 'monitor', name: 'Monitoring & Incident Handling', leaves: [
            'Security events are monitored and incidents are handled per a defined response plan',
          ]},
      ]},
  ]
}

const FRAMEWORK_TREES = { nist_csf: TREE_DATA }
for (const fw of FRAMEWORKS) {
  if (fw.id === 'nist_csf') continue
  const taxonomy = FRAMEWORK_TAXONOMY[fw.id] ?? genericTaxonomy(fw)
  FRAMEWORK_TREES[fw.id] = buildFrameworkTree(fw.id, taxonomy)
}

function ratingClass(r) {
  return {
    Compliant: 'comp-rating-badge--compliant',
    Strong:    'comp-rating-badge--strong',
    Moderate:  'comp-rating-badge--moderate',
    Weak:      'comp-rating-badge--weak',
  }[r] || ''
}

function criticalityClass(c) {
  return {
    Low:      'comp-criticality-badge--low',
    Medium:   'comp-criticality-badge--medium',
    High:     'comp-criticality-badge--high',
    Critical: 'comp-criticality-badge--critical',
  }[c] || ''
}

function postureColor(pct) {
  if (pct >= 85) return 'var(--pai-green)'
  if (pct >= 60) return 'var(--pai-high-fg)'
  return 'var(--pai-crit-fg)'
}
function ratingColor(r) {
  return { Compliant: '#1A7D4D', Strong: 'var(--pai-green)', Moderate: 'var(--pai-high-fg)', Weak: 'var(--pai-crit-fg)' }[r] || 'var(--shell-text)'
}

// ── Deterministic sparkline per node ──────────────────────────────
function genSparkPoints(pct, seed) {
  let s = seed
  const pts = []
  for (let i = 0; i < 8; i++) {
    s = ((s * 1103515245 + 12345) >>> 0) & 0x7fffffff
    const noise = ((s % 13) - 6) * 0.7
    pts.push(Math.max(5, Math.min(95, pct + noise)))
  }
  return pts
}

const SPARK_LABELS = ['5 Jul','6 Jul','7 Jul','8 Jul','9 Jul','10 Jul','11 Jul','12 Jul']

function Sparkline({ pct, seed }) {
  const [hoverIdx, setHoverIdx] = useState(null)
  const [isHovered, setIsHovered] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const svgRef = useRef(null)
  const linePathRef = useRef(null)
  const fillPathRef = useRef(null)

  const pts = genSparkPoints(pct, seed)
  const w = 80, h = 32
  const min = Math.min(...pts) - 4
  const max = Math.max(...pts) + 4
  const range = max - min || 1
  const xs = pts.map((_, i) => (i / (pts.length - 1)) * w)
  const ys = pts.map(v => h - ((v - min) / range) * (h - 4) - 2)
  const line = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ')
  const color = 'var(--pai-teal)'

  useEffect(() => {
    const el = linePathRef.current
    if (!el) return
    const len = el.getTotalLength()
    el.style.transition = 'none'
    el.style.strokeDasharray = `${len}`
    el.style.strokeDashoffset = `${len}`
    if (fillPathRef.current) { fillPathRef.current.style.opacity = '0' }
    requestAnimationFrame(() => requestAnimationFrame(() => {
      el.style.transition = 'stroke-dashoffset 0.55s ease'
      el.style.strokeDashoffset = '0'
      if (fillPathRef.current) {
        fillPathRef.current.style.transition = 'opacity 0.55s ease'
        fillPathRef.current.style.opacity = '1'
      }
    }))
  }, [line])

  const handleMouseMove = (e) => {
    if (!svgRef.current) return
    setMousePos({ x: e.clientX, y: e.clientY })
    const rect = svgRef.current.getBoundingClientRect()
    const mx = (e.clientX - rect.left) / rect.width * w
    let closest = 0, minDist = Infinity
    xs.forEach((x, i) => { const d = Math.abs(x - mx); if (d < minDist) { minDist = d; closest = i } })
    setHoverIdx(closest)
  }

  const hx = hoverIdx !== null ? xs[hoverIdx] : null
  const hy = hoverIdx !== null ? ys[hoverIdx] : null

  return (
    <div
      className="comp-spark-wrap"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setHoverIdx(null) }}
    >
      {hoverIdx !== null && (
        <div
          className="comp-spark-tooltip"
          style={{ left: mousePos.x, top: mousePos.y - 58 }}
        >
          <div className="comp-spark-tooltip-date">
            {SPARK_LABELS[hoverIdx]} 2025
          </div>
          <div className="comp-spark-tooltip-row">
            <span className="comp-spark-tooltip-label">Score</span>
            <span className="comp-spark-tooltip-value" style={{ color }}>{Math.round(pts[hoverIdx])}%</span>
          </div>
        </div>
      )}

      <svg
        ref={svgRef}
        width="100%" height={h}
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        fill="none"
        onMouseMove={handleMouseMove}
        className="comp-spark-svg"
      >
        <path ref={fillPathRef} d={`${line} L${w},${h} L0,${h} Z`} fill={color} fillOpacity="0.10"/>
        <path ref={linePathRef} d={line} stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>

      {hoverIdx !== null && (
        <div
          className="comp-spark-dot"
          style={{
            left: `${(hx / w) * 100}%`,
            top: `${(hy / h) * 100}%`,
            background: color,
          }}
        />
      )}

    </div>
  )
}

// ── Toggle ────────────────────────────────────────────────────────
function Toggle({ checked, onChange }) {
  return (
    <label className="comp-toggle">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        className="comp-toggle-input" />
      <span className={`comp-toggle-track${checked ? ' comp-toggle-track--on' : ''}`}>
        <span className={`comp-toggle-thumb${checked ? ' comp-toggle-thumb--on' : ''}`} />
      </span>
    </label>
  )
}

// ── Donut chart ───────────────────────────────────────────────────
function DonutChart({ pct, size = 120 }) {
  const r = 44, cx = 60, cy = 60
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - pct / 100)
  const color = pct >= 85 ? 'var(--pai-green)' : pct >= 60 ? 'var(--pai-high-fg)' : 'var(--pai-crit-fg)'
  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--shell-raised)" strokeWidth="12"/>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="12"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
        fontSize="22" fontWeight="700" fill={color} fontFamily="Inter,sans-serif">
        {pct}%
      </text>
    </svg>
  )
}

// ── Semi-donut chart (Recharts PieChart) ─────────────────────────
const RATING_COLOR = {
  Compliant: 'var(--pai-green)',
  Strong:    'var(--pai-green)',
  Moderate:  'var(--pai-high-fg)',
  Weak:      'var(--pai-crit-fg)',
}

function SemiDonutChart({ pct, rating, width = 482 }) {
  const color = RATING_COLOR[rating] ?? (pct >= 85 ? 'var(--pai-green)' : pct >= 60 ? 'var(--pai-high-fg)' : 'var(--pai-crit-fg)')
  const clamped = Math.min(Math.max(pct, 0), 100)
  const outerR = Math.round(width * 0.21)
  const innerR = Math.round(outerR * 0.88)
  const ringW = outerR - innerR
  const height = outerR + 16
  const cy = height - 4

  return (
    <div className="comp-semi-donut-wrap" style={{ width, height }}>
      <PieChart width={width} height={height}>
        <Pie
          data={[{ value: 100 }]}
          cx={width / 2}
          cy={cy}
          startAngle={180}
          endAngle={0}
          innerRadius={innerR}
          outerRadius={outerR}
          dataKey="value"
          strokeWidth={0}
          isAnimationActive={false}
        >
          <Cell fill="var(--shell-raised)" />
        </Pie>
        {clamped > 0 && (
          <Pie
            data={[{ value: clamped }]}
            cx={width / 2}
            cy={cy}
            startAngle={180}
            endAngle={180 - (clamped / 100) * 180}
            innerRadius={innerR}
            outerRadius={outerR}
            dataKey="value"
            strokeWidth={0}
            cornerRadius={Math.round(ringW / 2)}
            isAnimationActive={false}
          >
            <Cell fill={color} />
          </Pie>
        )}
      </PieChart>
      <div className="comp-semi-donut-label" style={{ color }}>
        {pct}%
      </div>
    </div>
  )
}

const IcExploreAction = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3.72222 13.5C3.39807 13.5 3.08719 13.3712 2.85798 13.142C2.62877 12.9128 2.5 12.6019 2.5 12.2778V8H6.00379C7.1092 8 8.00498 8.89675 8.00379 10.0022L8 13.5H3.72222Z" fill="currentColor" fillOpacity="0.15"/>
    <path d="M13.5 9.34636V12.2778C13.5 12.6019 13.3712 12.9128 13.142 13.142C12.9128 13.3712 12.6019 13.5 12.2778 13.5H8M6.69508 2.5H3.72222C3.39807 2.5 3.08719 2.62877 2.85798 2.85798C2.62877 3.08719 2.5 3.39807 2.5 3.72222V8M13.5 2.5L9.36629 6.63371M13.5 6.62568V2.5H9.36629M2.5 8V12.2778C2.5 12.6019 2.62877 12.9128 2.85798 13.142C3.08719 13.3712 3.39807 13.5 3.72222 13.5H8M2.5 8H6.00379C7.1092 8 8.00498 8.89675 8.00379 10.0022L8 13.5"/>
  </svg>
)

const IcRemediation = () => (
  <svg width="13" height="14" viewBox="0 0 15 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5.69133 3.905C6.06508 2.81125 7.57633 2.77813 8.01945 3.80563L8.05696 3.90563L8.56133 5.38063C8.67692 5.7189 8.86371 6.02844 9.1091 6.28839C9.35449 6.54834 9.65277 6.75263 9.98383 6.8875L10.1195 6.93812L11.5945 7.44188C12.6882 7.81563 12.7213 9.32687 11.6945 9.77L11.5945 9.8075L10.1195 10.3119C9.78107 10.4274 9.4714 10.6141 9.21134 10.8595C8.95128 11.1049 8.74689 11.4033 8.61196 11.7344L8.56133 11.8694L8.05758 13.345C7.68383 14.4388 6.17258 14.4719 5.73008 13.445L5.69133 13.345L5.18758 11.87C5.07207 11.5316 4.88531 11.2219 4.63992 10.9619C4.39452 10.7018 4.0962 10.4974 3.76508 10.3625L3.63008 10.3119L2.15508 9.80812C1.0607 9.43437 1.02758 7.92312 2.05508 7.48062L2.15508 7.44188L3.63008 6.93812C3.96835 6.82254 4.2779 6.63575 4.53784 6.39036C4.79779 6.14497 5.00209 5.84668 5.13696 5.51562L5.18758 5.38063L5.69133 3.905ZM6.87446 4.30875L6.37071 5.78375C6.1947 6.29956 5.90837 6.77081 5.53166 7.16469C5.15496 7.55856 4.69692 7.86558 4.18946 8.06437L4.03321 8.12125L2.5582 8.625L4.03321 9.12875C4.54902 9.30476 5.02027 9.59108 5.41414 9.96779C5.80801 10.3445 6.11503 10.8025 6.31383 11.31L6.37071 11.4662L6.87446 12.9412L7.37821 11.4662C7.55421 10.9504 7.84054 10.4792 8.21725 10.0853C8.59395 9.69144 9.05199 9.38442 9.55945 9.18563L9.7157 9.12937L11.1907 8.625L9.7157 8.12125C9.19989 7.94524 8.72864 7.65892 8.33477 7.28221C7.9409 6.9055 7.63388 6.44747 7.43508 5.94L7.37883 5.78375L6.87446 4.30875ZM11.8745 1.75C11.9914 1.75 12.106 1.7828 12.2052 1.84467C12.3044 1.90654 12.3843 1.995 12.4357 2.1L12.4657 2.17313L12.6845 2.81438L13.3263 3.03313C13.4435 3.07293 13.5462 3.14663 13.6215 3.24488C13.6967 3.34313 13.7411 3.46151 13.749 3.58501C13.7569 3.70851 13.728 3.83158 13.6658 3.93862C13.6037 4.04565 13.5112 4.13184 13.4001 4.18625L13.3263 4.21625L12.6851 4.435L12.4663 5.07687C12.4265 5.19402 12.3527 5.29669 12.2544 5.37187C12.1561 5.44705 12.0377 5.49137 11.9142 5.4992C11.7907 5.50703 11.6677 5.47803 11.5607 5.41586C11.4537 5.3537 11.3676 5.26117 11.3132 5.15L11.2832 5.07687L11.0645 4.43563L10.4226 4.21688C10.3054 4.17707 10.2027 4.10337 10.1274 4.00512C10.0522 3.90687 10.0078 3.78849 9.99991 3.66499C9.99201 3.54149 10.021 3.41842 10.0831 3.31138C10.1452 3.20435 10.2377 3.11816 10.3488 3.06375L10.4226 3.03375L11.0638 2.815L11.2826 2.17313C11.3247 2.04964 11.4045 1.94244 11.5106 1.86656C11.6167 1.79068 11.744 1.74992 11.8745 1.75Z" fill="url(#remGrad)"/>
    <defs>
      <linearGradient id="remGrad" x1="7.52944" y1="1.75" x2="7.52944" y2="14.191" gradientUnits="userSpaceOnUse">
        <stop stopColor="#2E84D4"/><stop offset="1" stopColor="#E54798"/>
      </linearGradient>
    </defs>
  </svg>
)

// ── Findings KPI rows (replaces stacked bar in both drawers) ──────
function FindingsKpi({ closed, open, pct }) {
  const total   = closed + open
  const openPct = 100 - pct
  const rows = [
    {
      label: 'Passed findings', suffix: '(Closed)',
      count: closed,
      pct,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--pai-indigo)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>
        </svg>
      ),
    },
    {
      label: 'Failed findings', suffix: '(Open)',
      count: open,
      pct: openPct,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--pai-indigo)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="0.5" fill="var(--pai-indigo)"/>
        </svg>
      ),
    },
    {
      label: 'Total findings',
      count: total,
      pct: 100,
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4.59062 8H2.51562M11.5156 3.5H2.51562M6.06476 12.5H2.51562" stroke="var(--pai-indigo)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="9.15663" cy="9.15419" r="2.65663" stroke="var(--pai-indigo)" strokeWidth="1.4"/>
          <path d="M11.0378 11.0356L13.5 13.4977" stroke="var(--pai-indigo)" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      ),
    },
  ]
  return (
    <div className="comp-findings-kpi">
      {rows.map((row, i) => (
        <div key={row.label} className={`comp-findings-kpi-row${i < rows.length - 1 ? ' comp-findings-kpi-row--bordered' : ''}`}>
          <div className="comp-findings-kpi-icon">
            {row.icon}
          </div>
          <span className="comp-findings-kpi-label">
            {row.label}
            {row.suffix && <span className="comp-findings-kpi-suffix">{row.suffix}</span>}
          </span>
          <span className="comp-findings-kpi-count">
            {row.count.toLocaleString()}
          </span>
          <span className="comp-findings-kpi-pct">
            {row.pct}%
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Assessment drawer ─────────────────────────────────────────────
const TREND_METRICS = ['Compliance Score', 'Findings Trend']

function AssessmentDrawer({ node, onClose, onNav }) {
  const [tRange, setTRange] = useState('3M')
  const [inclClosed, setInclClosed] = useState(false)
  const [closing, setClosing] = useState(false)
  const [trendMetric, setTrendMetric] = useState('Compliance Score')
  const [trendMenuOpen, setTrendMenuOpen] = useState(false)
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false)
  const [ratingTooltip, setRatingTooltip] = useState(false)
  const { addDownload } = useDownloads()

  const [findingsPage, setFindingsPage]       = useState(1)
  const [findingsPerPage, setFindingsPerPage] = useState(10)
  const [remediationRow, setRemediationRow]   = useState(null) // { i, rect }
  const [findingDrawerRow, setFindingDrawerRow] = useState(null)
  const [fwPopover, setFwPopover]             = useState(null) // { rect } — overview frameworks popover
  const [createTicketEntity, setCreateTicketEntity] = useState(null) // null = closed, string = entity pre-fill
  const [ctTitle, setCtTitle]           = useState('')
  const [ctDescription, setCtDescription] = useState('')
  const [ctAssignee, setCtAssignee] = useState('Patch Admin')
  const { showToast } = useToast()
  const trendMenuRef = useRef(null)
  const downloadMenuRef = useRef(null)

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
    showToast({ type, msg, duration: 3000 })
  }, [closeCreateTicket, showToast])

  useEffect(() => {
    if (!trendMenuOpen) return
    const handler = e => { if (trendMenuRef.current && !trendMenuRef.current.contains(e.target)) setTrendMenuOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [trendMenuOpen])

  useEffect(() => {
    if (!downloadMenuOpen) return
    const handler = e => { if (downloadMenuRef.current && !downloadMenuRef.current.contains(e.target)) setDownloadMenuOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [downloadMenuOpen])

  const total = node.closed + node.open
  const ticketCode = `PR-${(node.id.replace(/\D/g,'') || '1').padStart(3,'0')}`
  const ctMockTickets = [
    { id: 'PA-1238', date: '08 April 2026' },
    { id: 'PA-1220', date: '13 March 2026' },
    { id: 'PA-1190', date: '11 March 2026' },
  ]

  const handleClose = useCallback(() => {
    setClosing(true)
    setTimeout(onClose, 180)
  }, [onClose])

  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') handleClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [handleClose])

  const ratingMeta = {
    Compliant: { label: 'Compliant', bg: '#1A7D4D', color: '#fff', border: 'transparent' },
    Strong:    { label: 'Strong',    bg: 'var(--pai-low-bg)', color: 'var(--pai-green)', border: 'rgba(49,165,109,0.3)' },
    Moderate:  { label: 'Moderate',  bg: 'var(--pai-high-bg)', color: 'var(--pai-high-fg)', border: 'rgba(217,139,29,0.3)' },
    Weak:      { label: 'Weak',      bg: 'var(--pai-crit-bg)', color: 'var(--pai-crit-fg)', border: 'rgba(209,35,41,0.3)' },
  }[node.rating] || {}

  return (
    <>
      <div className="comp-drawer-backdrop" onClick={handleClose} />
      {/* External close button — sits to the left of the panel */}
      <button className="comp-drawer-close-ext" onClick={handleClose}>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
          <line x1="1" y1="1" x2="9" y2="9"/><line x1="9" y1="1" x2="1" y2="9"/>
        </svg>
      </button>

      <div className={`comp-drawer${closing ? ' comp-drawer--closing' : ''}`}>

        {/* Header */}
        <div className="comp-drawer-header">
          <div className="comp-drawer-header-content">
            <div className="comp-drawer-title-row">
              <span className="comp-drawer-title">{node.name}</span>
              <span className="comp-drawer-badge">Assessment</span>
            </div>
            <p className="comp-drawer-desc comp-drawer-desc--no-margin">
              This assessment verifies compliance controls and findings associated with the selected function.
              Review the details below to understand the current posture and take corrective action where needed.
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="comp-drawer-body">

          {/* Overview */}
          <div className="comp-drawer-section">
            <span className="comp-drawer-section-title">Overview</span>
            <div className="comp-drawer-overview">
              <div className="comp-drawer-ov-item">
                <span className="comp-drawer-ov-label">ID</span>
                <span className="comp-drawer-ov-value">
                  <span className="comp-ov-id-badge">{node.id.toUpperCase().replace('_', '-')}</span>
                </span>
              </div>
              <div className="comp-drawer-ov-item">
                <span className="comp-drawer-ov-label">Scope</span>
                <span className="comp-drawer-ov-value">
                  <EntityBadge type={node.scopeType || node.entity || 'device'} />
                  {node.scopeLabel || node.entityLabel || 'Host'}
                </span>
              </div>
              <div className="comp-drawer-ov-item">
                <span className="comp-drawer-ov-label">Related Frameworks</span>
                <span className="comp-drawer-ov-value comp-drawer-ov-value--relative">
                  {[
                    { key: 'scf' }, { key: 'nist_csf' }, { key: 'pci_dss' },
                  ].map((fw, fi) => {
                    const meta = FW_DISPLAY[fw.key] || {}
                    return (
                      <div key={fi} className={`comp-ov-fw-avatar${fi > 0 ? ' comp-ov-fw-avatar--overlap' : ''}`}>
                        {meta.icon
                          ? <img src={meta.icon} width={14} height={14} alt="" className="comp-fw-logo-img" />
                          : meta.abbr}
                      </div>
                    )
                  })}
                  <button
                    className="comp-fw-overflow-btn comp-fw-overflow-btn--overlap"
                    onClick={e => {
                      const rect = e.currentTarget.getBoundingClientRect()
                      setFwPopover(fwPopover ? null : { rect })
                    }}
                  >+1</button>
                </span>
              </div>
              <div className="comp-drawer-ov-item">
                <span className="comp-drawer-ov-label">Criticality</span>
                <span className="comp-drawer-ov-value">
                  <span className={`comp-rating-badge comp-rating-badge--small ${criticalityClass(node.criticality)}`}>{node.criticality}</span>
                </span>
              </div>
              <div className="comp-drawer-ov-item">
                <span className="comp-drawer-ov-label">Rating</span>
                <span className="comp-drawer-ov-value comp-drawer-ov-value--relative">
                  <span
                    className={`comp-rating-badge comp-rating-badge--small ${ratingClass(node.rating)}`}
                    onMouseEnter={() => setRatingTooltip(true)}
                    onMouseLeave={() => setRatingTooltip(false)}
                  >
                    {node.rating}
                  </span>
                  {ratingTooltip && (
                    <div className="comp-rating-tooltip">
                      <span className="comp-rating-tooltip-text">
                        Rating threshold categorizes compliance performance score into four bands: Fully Compliant (100%), Strong (&gt; Warning and &lt; 100%), Moderate (&gt; Critical Gap and &lt;= Warning), and Weak (&lt;= Critical Gap).
                      </span>
                    </div>
                  )}
                </span>
              </div>
              <div className="comp-drawer-ov-item">
                <span className="comp-drawer-ov-label">Last Evaluated</span>
                <span className="comp-drawer-ov-value comp-drawer-ov-value--sm">08 August 2024</span>
              </div>
            </div>
          </div>

          {/* Finding Details */}
          <div className="comp-drawer-section">
            <span className="comp-drawer-section-title">Finding Details</span>
            <div className="comp-drawer-finding-layout">
              {/* Semi-donut + legend */}
              <div className="comp-drawer-donut-col">
                <div className="comp-drawer-score-header">
                  <span className="comp-drawer-score-label">Compliance Score</span>
                  <span
                    className={`comp-rating-badge comp-rating-badge--small ${ratingClass(node.rating)}`}
                    onMouseEnter={() => setRatingTooltip(true)}
                    onMouseLeave={() => setRatingTooltip(false)}
                  >
                    {node.rating}
                  </span>
                  {ratingTooltip && (
                    <div className="comp-rating-tooltip">
                      <span className="comp-rating-tooltip-text">
                        Rating threshold categorizes compliance performance score into four bands: Fully Compliant (100%), Strong (&gt; Warning and &lt; 100%), Moderate (&gt; Critical Gap and &lt;= Warning), and Weak (&lt;= Critical Gap).
                      </span>
                    </div>
                  )}
                </div>
                <SemiDonutChart pct={node.pct} rating={node.rating} width={482} />
                <div className="comp-drawer-divider" />
                <div className="comp-drawer-breakdown">
                  <span className="comp-drawer-breakdown-title">Findings Breakdown</span>
                  <FindingsKpi closed={node.closed} open={node.open} pct={node.pct} />
                </div>
              </div>

              {/* Trend chart */}
              <div className="comp-drawer-trend-col">
                <div className="comp-drawer-trend-header">
                  <span className="comp-drawer-trend-label">Trend</span>
                  <div ref={trendMenuRef} className="comp-sort-wrap">
                    <button
                      className={`comp-sort-btn${trendMenuOpen ? ' comp-sort-btn--active' : ''}`}
                      onClick={() => setTrendMenuOpen(o => !o)}
                    >
                      {trendMetric}
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="m6 9 6 6 6-6"/></svg>
                    </button>
                    {trendMenuOpen && (
                      <div className="comp-sort-menu">
                        {TREND_METRICS.map(opt => (
                          <button
                            key={opt}
                            className={`comp-sort-item${opt === trendMetric ? ' comp-sort-item--selected' : ''}`}
                            onClick={() => { setTrendMetric(opt); setTrendMenuOpen(false) }}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className={`comp-drawer-trend-legends${trendMetric === 'Compliance Score' ? '' : ' comp-drawer-trend-legends--hidden'}`}>
                    <span className="comp-drawer-trend-legend-item comp-drawer-trend-legend--critical">
                      <span className="comp-drawer-trend-legend-dash" />
                      Critical Gap (50)
                    </span>
                    <span className="comp-drawer-trend-legend-item comp-drawer-trend-legend--warning">
                      <span className="comp-drawer-trend-legend-dash" />
                      Warning (75)
                    </span>
                  </div>
                  <TimeRangeTabs value={tRange} onChange={setTRange} />
                </div>
                <div className="comp-drawer-chart-wrap">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={trendMetric === 'Compliance Score' ? SCORE_TREND[tRange] : FINDING_TREND[tRange]}
                      margin={{ top: 8, right: 8, bottom: 0, left: 4 }}
                    >
                      <defs>
                        <linearGradient id="drawerAreaFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%"   stopColor="var(--pai-teal)" stopOpacity={0.28} />
                          <stop offset="100%" stopColor="var(--pai-teal)" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name"
                        tick={{ fontSize: 9, fill: 'var(--shell-text-muted)', fontFamily: 'Inter,system-ui' }}
                        axisLine={false} tickLine={false} dy={4}
                      />
                      {trendMetric === 'Compliance Score' ? (
                        <YAxis
                          domain={[0, 100]}
                          ticks={[0, 25, 50, 75, 100]}
                          tick={{ fontSize: 9, fill: 'var(--shell-text-muted)', fontFamily: 'Inter,system-ui' }}
                          axisLine={false} tickLine={false}
                          tickFormatter={v => `${v}%`}
                          width={40}
                        />
                      ) : (
                        <YAxis
                          tick={{ fontSize: 9, fill: 'var(--shell-text-muted)', fontFamily: 'Inter,system-ui' }}
                          axisLine={false} tickLine={false}
                          tickFormatter={v => v >= 1000 ? `${v / 1000}K` : `${v}`}
                          width={40}
                        />
                      )}
                      <Tooltip
                        formatter={v => trendMetric === 'Compliance Score' ? [`${v}%`, 'Score'] : [v.toLocaleString(), 'Count']}
                        contentStyle={{
                          background: 'var(--card-bg)', border: '1px solid var(--card-border)',
                          borderRadius: 6, fontSize: 11, padding: '4px 10px',
                          fontFamily: 'Inter,system-ui', color: 'var(--shell-text)',
                        }}
                        itemStyle={{ color: 'var(--pai-teal)' }}
                        cursor={false}
                        isAnimationActive={false}
                      />
                      {trendMetric === 'Compliance Score' && <ReferenceLine y={50} stroke="var(--pai-crit-fg)" strokeDasharray="5 3" strokeWidth={1.5} />}
                      {trendMetric === 'Compliance Score' && <ReferenceLine y={75} stroke="var(--pai-med-fg)" strokeDasharray="5 3" strokeWidth={1.5} />}
                      <Area type="monotone" dataKey="value"
                        stroke="var(--pai-teal)" strokeWidth={2}
                        fill="url(#drawerAreaFill)" dot={false}
                        activeDot={{ r: 4, fill: 'var(--pai-teal)', strokeWidth: 0 }}
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="comp-chart-legend-row">
                  <span className="comp-chart-legend-dot" />
                  <span className="comp-chart-legend-text">
                    {trendMetric === 'Compliance Score' ? 'Score' : 'Count'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Findings table */}
          <div className="comp-drawer-section">
            <div className="comp-drawer-findings-header">
              <div className="comp-drawer-findings-left">
                <span className="comp-drawer-findings-title">
                  Findings Details ({(inclClosed ? total : node.open).toLocaleString()})
                </span>
                <button
                  className="comp-drawer-kg-btn"
                  onClick={() => onNav && onNav('kg', { type: KG_ENTITY_TYPE[node.scopeType || node.entity] || 'host', label: node.scopeLabel || node.entityLabel || node.name })}
                >
                  <span className="comp-kg-btn-icon"><IcExploreAction /></span>
                  Explore Asset in Knowledge Graph
                </button>
              </div>
              <div className="comp-drawer-findings-actions">
                <label className="comp-drawer-incl-label">
                  Include Passed Findings
                  <Toggle checked={inclClosed} onChange={setInclClosed} />
                </label>
                <div ref={downloadMenuRef} className="comp-sort-wrap">
                  <button
                    className="comp-drawer-download-btn"
                    onClick={() => setDownloadMenuOpen(o => !o)}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Download
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className={`comp-dl-chevron${downloadMenuOpen ? ' comp-dl-chevron--open' : ''}`}><path d="m6 9 6 6 6-6"/></svg>
                  </button>
                  {downloadMenuOpen && (
                    <div className="comp-dl-menu">
                      <button className="comp-dl-item" onClick={(e) => { addDownload(`${node.name}-Findings.csv`, e.currentTarget); setDownloadMenuOpen(false); }}><IcFileCsv /> CSV</button>
                      <button className="comp-dl-item" onClick={(e) => { addDownload(`${node.name}-Findings.xlsx`, e.currentTarget); setDownloadMenuOpen(false); }}><IcFileExcel /> Excel</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="comp-drawer-table-wrap">
              <table className="comp-drawer-table">
                <thead>
                  <tr>
                    <th>
                      <span className="comp-drawer-th-inner">Associated Entities
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M8 9l4-4 4 4"/><path d="M16 15l-4 4-4-4"/></svg>
                      </span>
                    </th>
                    <th>
                      <span className="comp-drawer-th-inner">Finding Evidence
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M8 9l4-4 4 4"/><path d="M16 15l-4 4-4-4"/></svg>
                      </span>
                    </th>
                    <th>
                      <span className="comp-drawer-th-inner">Status
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="14" y2="12"/><line x1="4" y1="18" x2="9" y2="18"/></svg>
                      </span>
                    </th>
                    <th className="comp-drawer-th-actions">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {FINDINGS_ROWS.slice((findingsPage - 1) * findingsPerPage, findingsPage * findingsPerPage).map((row, i) => (
                    <tr key={i} className="comp-drawer-tr--clickable" onClick={() => setFindingDrawerRow(row)}>
                      <td>
                        <div className="comp-table-entity-cell">
                          <EntityBadge type="device" />
                          <span className="comp-table-entity-name">{row.entity}</span>
                        </div>
                      </td>
                      <td className="comp-table-muted">{row.evidence}</td>
                      <td><span className="comp-drawer-status-open">{row.status}</span></td>
                      <td>
                        <div className="comp-drawer-action-btns">
                          <button
                            className="comp-drawer-action-icon comp-drawer-action-icon--indigo"
                            title="Explore"
                            onClick={e => { e.stopPropagation(); onNav && onNav('kg', { type: 'host', label: row.entity }) }}
                          >
                            <IcExploreAction />
                          </button>
                          <button
                            className="comp-drawer-action-icon"
                            title="Remediation Actions"
                            onClick={e => {
                              e.stopPropagation()
                              const rect = e.currentTarget.getBoundingClientRect()
                              setRemediationRow(remediationRow?.i === i ? null : { i, rect })
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
              total={node.open}
              page={findingsPage}
              rowsPerPage={findingsPerPage}
              onPageChange={setFindingsPage}
              onRowsPerPageChange={n => { setFindingsPerPage(n); setFindingsPage(1) }}
            />
          </div>

        </div>
      </div>

      {/* Finding detail drawer */}
      {findingDrawerRow && (
        <FindingDrawer row={findingDrawerRow} onClose={() => setFindingDrawerRow(null)} stacked />
      )}

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
                <button className="comp-drawer-kg-btn" onClick={() => openCreateTicket(FINDINGS_ROWS[remediationRow.i]?.entity ?? '', FINDINGS_ROWS[remediationRow.i]?.title ?? '')}>Create Ticket
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


      {/* Framework popover */}
      {fwPopover !== null && (
        <>
          <div className="comp-overlay comp-overlay--z9099" onClick={() => setFwPopover(null)} />
          <div className="comp-fw-popover" style={{
            top: Math.min(fwPopover.rect.bottom + 6, window.innerHeight - 300),
            left: fwPopover.rect.left,
          }}>
            {OVERVIEW_FRAMEWORKS.map((fw, fi) => {
              const meta = FW_DISPLAY[fw.key] || {}
              return (
                <div key={fi} className="comp-fw-popover-item">
                  <div className="comp-fw-popover-badge">
                    {meta.icon
                      ? <img src={meta.icon} width={13} height={13} alt="" className="comp-fw-logo-img" />
                      : meta.abbr}
                  </div>
                  <div className="comp-fw-popover-body">
                    <span className="comp-fw-popover-name">{meta.name}</span>
                    <span className="comp-fw-popover-control">• {fw.control}: {fw.desc}</span>
                  </div>
                </div>
              )
            })}
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
                  <p className="comp-ai-rec-heading">Recommendation: Register all unmanaged devices in Active Directory and establish ongoing device inventory management</p>
                  <ol className="comp-ai-rec-list">
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
    </>
  )
}

// ── Function / Category / Sub-Category drawer ─────────────────────
function FunctionDrawer({ node, level, onClose }) {
  const [tRange, setTRange]                     = useState('3M')
  const [inclClosed, setInclClosed]             = useState(false)
  const [closing, setClosing]                   = useState(false)
  const [trendMetric, setTrendMetric]           = useState('Compliance Score')
  const [trendMenuOpen, setTrendMenuOpen]       = useState(false)
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false)
  const [ratingTooltip, setRatingTooltip]       = useState(false)
  const { addDownload } = useDownloads()
  const [findingsPage, setFindingsPage]         = useState(1)
  const [findingsPerPage, setFindingsPerPage]   = useState(10)
  const [remediationRow, setRemediationRow]     = useState(null)
  const [findingDrawerRow, setFindingDrawerRow] = useState(null)
  const [fwPopover, setFwPopover]               = useState(null)
  const [createTicketEntity, setCreateTicketEntity] = useState(null)
  const [ctTitle, setCtTitle]                     = useState('')
  const [ctDescription, setCtDescription]         = useState('')
  const [ctAssignee, setCtAssignee]               = useState('Patch Admin')
  const { showToast } = useToast()
  const trendMenuRef    = useRef(null)
  const downloadMenuRef = useRef(null)

  const levelLabel = level === 0 ? 'Function' : level === 1 ? 'Category' : 'Sub-Category'
  const total      = node.closed + node.open
  const ticketCode = `PR-${(node.id.replace(/\D/g,'') || '1').padStart(3,'0')}`
  const ctMockTickets = [
    { id: 'PA-1238', date: '08 April 2026' },
    { id: 'PA-1220', date: '13 March 2026' },
    { id: 'PA-1190', date: '11 March 2026' },
  ]

  const openCreateTicket  = useCallback((entity, findingTitle) => {
    setCtDescription(findingTitle ?? '')
    setCreateTicketEntity(entity)
  }, [])
  const closeCreateTicket = useCallback(() => setCreateTicketEntity(null), [])

  const handleCreateTicket = useCallback(() => {
    closeCreateTicket()
    setRemediationRow(null)
    const success = Math.random() > 0.2
    showToast({ type: success ? 'success' : 'error', msg: success ? 'Ticket created successfully.' : 'Failed to create ticket. Please try again.', duration: 3000 })
  }, [closeCreateTicket, showToast])

  const handleClose = useCallback(() => {
    setClosing(true)
    setTimeout(onClose, 180)
  }, [onClose])

  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') handleClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [handleClose])

  useEffect(() => {
    if (!trendMenuOpen) return
    const h = e => { if (trendMenuRef.current && !trendMenuRef.current.contains(e.target)) setTrendMenuOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [trendMenuOpen])

  useEffect(() => {
    if (!downloadMenuOpen) return
    const h = e => { if (downloadMenuRef.current && !downloadMenuRef.current.contains(e.target)) setDownloadMenuOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [downloadMenuOpen])

  const ratingMeta = {
    Compliant: { label: 'Compliant', bg: '#1A7D4D', color: '#fff', border: 'transparent' },
    Strong:    { label: 'Strong',    bg: 'var(--pai-low-bg)', color: 'var(--pai-green)', border: 'rgba(49,165,109,0.3)' },
    Moderate:  { label: 'Moderate',  bg: 'var(--pai-high-bg)', color: 'var(--pai-high-fg)', border: 'rgba(217,139,29,0.3)' },
    Weak:      { label: 'Weak',      bg: 'var(--pai-crit-bg)', color: 'var(--pai-crit-fg)', border: 'rgba(209,35,41,0.3)' },
  }[node.rating] || {}

  return (
    <>
      <div className="comp-drawer-backdrop" onClick={handleClose} />
      <button className="comp-drawer-close-ext" onClick={handleClose}>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
          <line x1="1" y1="1" x2="9" y2="9"/><line x1="9" y1="1" x2="1" y2="9"/>
        </svg>
      </button>

      <div className={`comp-drawer${closing ? ' comp-drawer--closing' : ''}`}>

        {/* Header */}
        <div className="comp-drawer-header">
          <div className="comp-drawer-header-content">
            <div className="comp-drawer-title-row">
              <span className="comp-drawer-title">{node.name}</span>
              <span className="comp-drawer-badge">{levelLabel}</span>
            </div>
            <p className="comp-drawer-desc comp-drawer-desc--no-margin">
              This {levelLabel.toLowerCase()} groups related compliance controls and assessments.
              Review the details below to understand the current posture and take corrective action where needed.
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="comp-drawer-body">

          {/* Overview */}
          <div className="comp-drawer-section">
            <span className="comp-drawer-section-title">Overview</span>
            <div className="comp-drawer-overview">
              <div className="comp-drawer-ov-item">
                <span className="comp-drawer-ov-label">ID</span>
                <span className="comp-drawer-ov-value">
                  <span className="comp-ov-id-badge">
                    {node.id.toUpperCase().replace('_', '-')}
                  </span>
                </span>
              </div>
              <div className="comp-drawer-ov-item">
                <span className="comp-drawer-ov-label">Scope</span>
                <span className="comp-drawer-ov-value">
                  <EntityBadge type="device" />
                  Host
                </span>
              </div>
              <div className="comp-drawer-ov-item">
                <span className="comp-drawer-ov-label">Related Frameworks</span>
                <span className="comp-drawer-ov-value">
                  {[FW_ICONS.nist_csf, FW_ICONS.pci_dss, FW_ICONS.cmmc_1].map((icon, i) => (
                    <div key={i} className={`comp-ov-fw-avatar comp-ov-fw-avatar--white${i > 0 ? ' comp-ov-fw-avatar--overlap' : ''}`}>
                      <img src={icon} width={16} height={16} alt="" className="comp-fw-logo-img" />
                    </div>
                  ))}
                  <button
                    className="comp-fw-overflow-btn comp-fw-overflow-btn--overlap"
                    onClick={e => {
                      const rect = e.currentTarget.getBoundingClientRect()
                      setFwPopover(fwPopover ? null : { rect })
                    }}
                  >+3</button>
                </span>
              </div>
              <div className="comp-drawer-ov-item">
                <span className="comp-drawer-ov-label">Criticality</span>
                <span className="comp-drawer-ov-value">
                  <span className={`comp-rating-badge comp-rating-badge--small ${criticalityClass(node.criticality)}`}>{node.criticality}</span>
                </span>
              </div>
              <div className="comp-drawer-ov-item">
                <span className="comp-drawer-ov-label">Rating</span>
                <span className="comp-drawer-ov-value comp-drawer-ov-value--relative">
                  <span
                    className={`comp-rating-badge comp-rating-badge--small ${ratingClass(node.rating)}`}
                    onMouseEnter={() => setRatingTooltip(true)}
                    onMouseLeave={() => setRatingTooltip(false)}
                  >
                    {node.rating}
                  </span>
                  {ratingTooltip && (
                    <div className="comp-rating-tooltip">
                      <span className="comp-rating-tooltip-text">
                        Rating threshold categorizes compliance performance score into four bands: Fully Compliant (100%), Strong (&gt; Warning and &lt; 100%), Moderate (&gt; Critical Gap and &lt;= Warning), and Weak (&lt;= Critical Gap).
                      </span>
                    </div>
                  )}
                </span>
              </div>
              <div className="comp-drawer-ov-item">
                <span className="comp-drawer-ov-label">Last Evaluated</span>
                <span className="comp-drawer-ov-value comp-drawer-ov-value--sm">08 August 2024</span>
              </div>
            </div>
          </div>

          {/* Finding Details */}
          <div className="comp-drawer-section">
            <span className="comp-drawer-section-title">Finding Details</span>
            <div className="comp-drawer-finding-layout">
              <div className="comp-drawer-donut-col">
                <div className="comp-drawer-score-header">
                  <span className="comp-drawer-score-label">Compliance Score</span>
                  <span
                    className={`comp-rating-badge comp-rating-badge--small ${ratingClass(node.rating)}`}
                    onMouseEnter={() => setRatingTooltip(true)}
                    onMouseLeave={() => setRatingTooltip(false)}
                  >
                    {node.rating}
                  </span>
                  {ratingTooltip && (
                    <div className="comp-rating-tooltip">
                      <span className="comp-rating-tooltip-text">
                        Rating threshold categorizes compliance performance score into four bands: Fully Compliant (100%), Strong (&gt; Warning and &lt; 100%), Moderate (&gt; Critical Gap and &lt;= Warning), and Weak (&lt;= Critical Gap).
                      </span>
                    </div>
                  )}
                </div>
                <SemiDonutChart pct={node.pct} rating={node.rating} width={482} />
                <div className="comp-drawer-divider" />
                <div className="comp-drawer-breakdown">
                  <span className="comp-drawer-breakdown-title">Findings Breakdown</span>
                  <FindingsKpi closed={node.closed} open={node.open} pct={node.pct} />
                </div>
              </div>

              {/* Trend chart */}
              <div className="comp-drawer-trend-col">
                <div className="comp-drawer-trend-header">
                  <span className="comp-drawer-trend-label">Trend</span>
                  <div ref={trendMenuRef} className="comp-sort-wrap">
                    <button className={`comp-sort-btn${trendMenuOpen ? ' comp-sort-btn--active' : ''}`} onClick={() => setTrendMenuOpen(o => !o)}>
                      {trendMetric}
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="m6 9 6 6 6-6"/></svg>
                    </button>
                    {trendMenuOpen && (
                      <div className="comp-sort-menu">
                        {TREND_METRICS.map(opt => (
                          <button key={opt} className={`comp-sort-item${opt === trendMetric ? ' comp-sort-item--selected' : ''}`} onClick={() => { setTrendMetric(opt); setTrendMenuOpen(false) }}>{opt}</button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className={`comp-drawer-trend-legends${trendMetric === 'Compliance Score' ? '' : ' comp-drawer-trend-legends--hidden'}`}>
                    <span className="comp-drawer-trend-legend-item comp-drawer-trend-legend--critical">
                      <span className="comp-drawer-trend-legend-dash" />
                      Critical Gap (50)
                    </span>
                    <span className="comp-drawer-trend-legend-item comp-drawer-trend-legend--warning">
                      <span className="comp-drawer-trend-legend-dash" />
                      Warning (75)
                    </span>
                  </div>
                  <TimeRangeTabs value={tRange} onChange={setTRange} />
                </div>
                <div className="comp-drawer-chart-wrap">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={trendMetric === 'Compliance Score' ? SCORE_TREND[tRange] : FINDING_TREND[tRange]}
                      margin={{ top: 8, right: 8, bottom: 0, left: 4 }}
                    >
                      <defs>
                        <linearGradient id="fnDrawerFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%"   stopColor="var(--pai-teal)" stopOpacity={0.28} />
                          <stop offset="100%" stopColor="var(--pai-teal)" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'var(--shell-text-muted)', fontFamily: 'Inter,system-ui' }} axisLine={false} tickLine={false} dy={4} />
                      {trendMetric === 'Compliance Score' ? (
                        <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fontSize: 9, fill: 'var(--shell-text-muted)', fontFamily: 'Inter,system-ui' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} width={40} />
                      ) : (
                        <YAxis tick={{ fontSize: 9, fill: 'var(--shell-text-muted)', fontFamily: 'Inter,system-ui' }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${v / 1000}K` : `${v}`} width={40} />
                      )}
                      <Tooltip
                        formatter={v => trendMetric === 'Compliance Score' ? [`${v}%`, 'Score'] : [v.toLocaleString(), 'Count']}
                        contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 6, fontSize: 11, padding: '4px 10px', fontFamily: 'Inter,system-ui', color: 'var(--shell-text)' }}
                        itemStyle={{ color: 'var(--pai-teal)' }}
                        cursor={false}
                        isAnimationActive={false}
                      />
                      {trendMetric === 'Compliance Score' && <ReferenceLine y={50} stroke="var(--pai-crit-fg)" strokeDasharray="5 3" strokeWidth={1.5} />}
                      {trendMetric === 'Compliance Score' && <ReferenceLine y={75} stroke="var(--pai-med-fg)" strokeDasharray="5 3" strokeWidth={1.5} />}
                      <Area type="monotone" dataKey="value" stroke="var(--pai-teal)" strokeWidth={2} fill="url(#fnDrawerFill)" dot={false} activeDot={{ r: 4, fill: 'var(--pai-teal)', strokeWidth: 0 }} isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="comp-chart-legend-row">
                  <span className="comp-chart-legend-dot" />
                  <span className="comp-chart-legend-text">
                    {trendMetric === 'Compliance Score' ? 'Score' : 'Count'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Findings table */}
          <div className="comp-drawer-section">
            <div className="comp-drawer-findings-header">
              <div className="comp-drawer-findings-left">
                <span className="comp-drawer-findings-title">
                  Findings Details ({(inclClosed ? total : node.open).toLocaleString()})
                </span>
                <button className="comp-drawer-kg-btn">
                  <span className="comp-kg-btn-icon"><IcExploreAction /></span>
                  Explore Asset in Knowledge Graph
                </button>
              </div>
              <div className="comp-drawer-findings-actions">
                <label className="comp-drawer-incl-label">
                  Include Passed Findings
                  <Toggle checked={inclClosed} onChange={setInclClosed} />
                </label>
                <div ref={downloadMenuRef} className="comp-sort-wrap">
                  <button className="comp-drawer-download-btn" onClick={() => setDownloadMenuOpen(o => !o)}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Download
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className={`comp-dl-chevron${downloadMenuOpen ? ' comp-dl-chevron--open' : ''}`}><path d="m6 9 6 6 6-6"/></svg>
                  </button>
                  {downloadMenuOpen && (
                    <div className="comp-dl-menu">
                      <button className="comp-dl-item" onClick={(e) => { addDownload(`${node.name}-Findings.csv`, e.currentTarget); setDownloadMenuOpen(false); }}><IcFileCsv /> CSV</button>
                      <button className="comp-dl-item" onClick={(e) => { addDownload(`${node.name}-Findings.xlsx`, e.currentTarget); setDownloadMenuOpen(false); }}><IcFileExcel /> Excel</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="comp-drawer-table-wrap">
              <table className="comp-drawer-table">
                <thead>
                  <tr>
                    <th>
                      <span className="comp-drawer-th-inner">Associated Entities
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M8 9l4-4 4 4"/><path d="M16 15l-4 4-4-4"/></svg>
                      </span>
                    </th>
                    <th>
                      <span className="comp-drawer-th-inner">Finding Evidence
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M8 9l4-4 4 4"/><path d="M16 15l-4 4-4-4"/></svg>
                      </span>
                    </th>
                    <th>
                      <span className="comp-drawer-th-inner">Status
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="14" y2="12"/><line x1="4" y1="18" x2="9" y2="18"/></svg>
                      </span>
                    </th>
                    <th className="comp-drawer-th-actions">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {FINDINGS_ROWS.slice((findingsPage - 1) * findingsPerPage, findingsPage * findingsPerPage).map((row, i) => (
                    <tr key={i} className="comp-drawer-tr--clickable" onClick={() => setFindingDrawerRow(row)}>
                      <td>
                        <div className="comp-table-entity-cell">
                          <EntityBadge type="device" />
                          <span className="comp-table-entity-name">{row.entity}</span>
                        </div>
                      </td>
                      <td className="comp-table-muted">{row.evidence}</td>
                      <td><span className="comp-drawer-status-open">{row.status}</span></td>
                      <td>
                        <div className="comp-drawer-action-btns">
                          <button className="comp-drawer-action-icon comp-drawer-action-icon--indigo" title="Explore" onClick={e => e.stopPropagation()}>
                            <IcExploreAction />
                          </button>
                          <button
                            className="comp-drawer-action-icon"
                            title="Remediation Actions"
                            onClick={e => {
                              e.stopPropagation()
                              const rect = e.currentTarget.getBoundingClientRect()
                              setRemediationRow(remediationRow?.i === i ? null : { i, rect })
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
              total={node.open}
              page={findingsPage}
              rowsPerPage={findingsPerPage}
              onPageChange={setFindingsPage}
              onRowsPerPageChange={n => { setFindingsPerPage(n); setFindingsPage(1) }}
            />
          </div>

        </div>
      </div>

      {/* Finding detail drawer */}
      {findingDrawerRow && (
        <FindingDrawer row={findingDrawerRow} onClose={() => setFindingDrawerRow(null)} stacked />
      )}

      {/* Remediation popup */}
      {remediationRow !== null && (
        <>
          <div className="comp-overlay comp-overlay--z210" onClick={() => setRemediationRow(null)} />
          <div className="comp-remediation-popup" style={{ top: Math.min(remediationRow.rect.top, window.innerHeight - 560), left: remediationRow.rect.left - 608 }}>
            <div className="comp-remediation-header">
              <div className="comp-remediation-header-left">
                <span className="comp-remediation-title">Remediation Actions</span>
                <span className="comp-remediation-note">Note: AI-generated remediations offer valuable guidance, but we recommend verifying and validating before implementation.</span>
              </div>
              <div className="comp-remediation-header-actions">
                <button className="comp-drawer-kg-btn" onClick={() => openCreateTicket(FINDINGS_ROWS[remediationRow.i]?.entity ?? '', FINDINGS_ROWS[remediationRow.i]?.title ?? '')}>Create Ticket
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


      {/* Framework popover */}
      {fwPopover !== null && (
        <>
          <div className="comp-overlay comp-overlay--z9099" onClick={() => setFwPopover(null)} />
          <div className="comp-fw-popover" style={{ top: Math.min(fwPopover.rect.bottom + 6, window.innerHeight - 300), left: fwPopover.rect.left }}>
            {OVERVIEW_FRAMEWORKS.map((fw, fi) => {
              const meta = FW_DISPLAY[fw.key] || {}
              return (
                <div key={fi} className="comp-fw-popover-item">
                  <div className="comp-fw-popover-badge">
                    {meta.icon ? <img src={meta.icon} width={13} height={13} alt="" className="comp-fw-logo-img" /> : meta.abbr}
                  </div>
                  <div className="comp-fw-popover-body">
                    <span className="comp-fw-popover-name">{meta.name}</span>
                    <span className="comp-fw-popover-control">• {fw.control}: {fw.desc}</span>
                  </div>
                </div>
              )
            })}
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
                <SelectDropdown value={ctAssignee} onChange={setCtAssignee} options={['Patch Admin', 'Security Admin', 'IT Operations']} fullWidth />
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
                  <p className="comp-ai-rec-heading">Recommendation: Register all unmanaged devices in Active Directory and establish ongoing device inventory management</p>
                  <ol className="comp-ai-rec-list">
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
    </>
  )
}

// ── Tree row renderer ─────────────────────────────────────────────
// Matches the fixed height of .comp-tree-cell-inner — every tree row is this tall.
const TREE_ROW_HEIGHT = 52

function findTreeNode(nodes, id) {
  for (const n of nodes) {
    if (n.id === id) return n
    if (n.children) {
      const found = findTreeNode(n.children, id)
      if (found) return found
    }
  }
  return null
}

// Ids of rows that are (or are about to become) rendered under `node`, given the current expanded map.
// Used both right before `node` collapses (they're still mounted) and right after it expands (they're newly mounted).
function visibleDescendantIds(node, expanded) {
  const ids = []
  if (node.children) {
    for (const child of node.children) {
      ids.push(child.id)
      if (expanded[child.id]) ids.push(...visibleDescendantIds(child, expanded))
    }
  }
  return ids
}

function collectRows(nodes, level, expanded, closingIds, openingIds, parentIsLast, ancestorClosing = false, ancestorOpening = false) {
  const result = []
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    const isLast = i === nodes.length - 1
    const hasChildren = node.children && node.children.length > 0
    const isExpanded = !!expanded[node.id]
    const selfClosing = closingIds.has(node.id)
    const selfOpening = openingIds.has(node.id)
    // Only descendants of the toggled node animate — the toggled row itself stays put.
    const isClosing = ancestorClosing
    const isEntering = ancestorOpening
    result.push({ node, level, isLast, hasChildren, isOpen: isExpanded, isClosing, isEntering, parentIsLast: [...parentIsLast] })
    if ((isExpanded || selfClosing) && hasChildren) {
      result.push(...collectRows(node.children, level + 1, expanded, closingIds, openingIds, [...parentIsLast, isLast], ancestorClosing || selfClosing, ancestorOpening || selfOpening))
    }
  }
  return result
}

function TreeRows({ nodes, expanded, closingIds, openingIds, collapseHeights, growHeights, rowRefs, onToggle, onLeafClick, onExpand, showTrend }) {
  const flatRows = collectRows(nodes, 0, expanded, closingIds, openingIds, [])

  const sectionEnds = new Set()
  for (let i = 0; i < flatRows.length; i++) {
    const isLastRow = i === flatRows.length - 1
    const nextIsTopLevel = !isLastRow && flatRows[i + 1].level === 0
    if (isLastRow || nextIsTopLevel) sectionEnds.add(i)
  }

  return (
    <>
      {flatRows.map(({ node, level, isLast, hasChildren, isOpen, isClosing, isEntering, parentIsLast }, i) => {
        const indent = level * 20 + 8
        const isSectionEnd = sectionEnds.has(i)

        const collapseHeight = collapseHeights[node.id]
        const growHeight = growHeights[node.id]
        const collapseStyle = isClosing && collapseHeight !== undefined
          ? { height: `${collapseHeight}px`, overflow: 'hidden', transition: 'height 180ms ease' }
          : isEntering && growHeight !== undefined
          ? { height: `${growHeight}px`, overflow: 'hidden', transition: 'height 260ms ease' }
          : undefined

        return (
          <tr
            key={node.id}
            ref={el => { if (el) rowRefs.current[node.id] = el; else delete rowRefs.current[node.id] }}
            className={`comp-tree-row${isSectionEnd ? ' comp-tree-row--section-end' : ''}${isClosing ? ' comp-tree-row--closing' : ''}${isEntering ? ' comp-tree-row--entering' : ''}`}
          >
            <td>
              <div className="comp-tree-collapse" style={collapseStyle}>
              <div className="comp-tree-cell-inner">
              {parentIsLast.slice(0, -1).map((pIsLast, l) =>
                !pIsLast ? (
                  <span key={l} className="comp-tree-vline" style={{ left: l * 20 + 16 }} />
                ) : null
              )}
              {level > 0 && (
                <span
                  className={`comp-tree-vline comp-tree-vline--connector${isLast && !(hasChildren && isOpen) ? ' comp-tree-vline--last' : ''}`}
                  style={{ left: (level - 1) * 20 + 16 }}
                />
              )}
              <div
                className={`comp-domain-name-cell comp-domain-name-cell--clickable${node.isLeaf ? ' comp-domain-name-cell--leaf' : ''}`}
                style={{ '--comp-tree-indent': `${indent}px` }}
                onClick={() => node.isLeaf ? onLeafClick(node) : onToggle(node.id)}
              >
                {node.isLeaf ? (
                  <span className={`comp-leaf-icon comp-leaf-icon--${node.rating.toLowerCase()}`} title={`Rating: ${node.rating}`}>{node.rating[0]}</span>
                ) : (
                  <button className={`comp-domain-expand${isOpen ? ' comp-domain-expand--open' : ''}`} onClick={e => { e.stopPropagation(); onToggle(node.id) }}>
                    <IcChevronRight />
                  </button>
                )}
                <span className="comp-tree-name" title={node.name}>{node.name}</span>
              </div>
              </div>
              </div>
            </td>
            <td className="right">
              <div className="comp-tree-collapse" style={collapseStyle}>
              <div className="comp-tree-cell-inner" style={{ justifyContent: 'flex-end' }}>
              <div className="comp-count-cell">
                <span className="comp-count-val">{node.closed.toLocaleString()}</span>
                <div className="comp-count-dot comp-count-dot--green" />
              </div>
              </div>
              </div>
            </td>
            <td className="right">
              <div className="comp-tree-collapse" style={collapseStyle}>
              <div className="comp-tree-cell-inner" style={{ justifyContent: 'flex-end' }}>
              <div className="comp-count-cell">
                <span className="comp-count-val">{node.open.toLocaleString()}</span>
                {node.open > 0 && <div className="comp-count-dot comp-count-dot--red" />}
              </div>
              </div>
              </div>
            </td>
            <td>
              <div className="comp-tree-collapse" style={collapseStyle}>
              <div className="comp-tree-cell-inner">
              {showTrend ? (
                <div className="comp-posture-cell comp-posture-cell--trend">
                  <Sparkline pct={node.pct} seed={node.id.charCodeAt(0) * 31 + node.pct} />
                  <button className="comp-posture-expand" onClick={e => { e.stopPropagation(); onExpand(node, level) }}><IcExpand /></button>
                  <span className="comp-posture-pct" style={{ '--comp-posture-pct-color': ratingColor(node.rating) }}>{node.pct}%</span>
                </div>
              ) : (
                <div className="comp-posture-cell">
                  <div className="comp-posture-track">
                    <div className="comp-posture-fill" style={{ '--comp-posture-w': `${node.pct}%`, '--comp-posture-bg': postureColor(node.pct) }} />
                  </div>
                  <button className="comp-posture-expand" onClick={e => { e.stopPropagation(); onExpand(node, level) }}><IcExpand /></button>
                  <span className="comp-posture-pct" style={{ '--comp-posture-pct-color': ratingColor(node.rating) }}>{node.pct}%</span>
                </div>
              )}
              </div>
              </div>
            </td>
            <td>
              <div className="comp-tree-collapse" style={collapseStyle}>
              <div className="comp-tree-cell-inner">
              <span className={`comp-rating-badge ${ratingClass(node.rating)}`}>{node.rating}</span>
              </div>
              </div>
            </td>
          </tr>
        )
      })}
    </>
  )
}

// ── Sort dropdown ─────────────────────────────────────────────────
const SORT_OPTIONS = [
  { id: 'default',   label: 'Default' },
  { id: 'az',        label: 'Category: A - Z' },
  { id: 'za',        label: 'Category: Z - A' },
  { id: 'strong_weak', label: 'Score: Strong to Weak' },
  { id: 'weak_strong', label: 'Score: Weak to Strong' },
]

function SortDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const { visible, closing } = useDropdownExit(open)

  useEffect(() => {
    if (!open) return
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const current = SORT_OPTIONS.find(o => o.id === value)

  return (
    <div ref={ref} className="comp-sort-wrap">
      <button
        className={`comp-sort-btn${open ? ' comp-sort-btn--active' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        <IcSort /> Sort
      </button>
      {visible && (
        <div className={`comp-sort-menu${closing ? ' comp-sort-menu--closing' : ''}`}>
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.id}
              className={`comp-sort-item${opt.id === value ? ' comp-sort-item--selected' : ''}`}
              onClick={() => { onChange(opt.id); setOpen(false) }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function SelectDropdown({ value, onChange, options, placeholder = 'Select…', fullWidth = false }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const { visible, closing } = useDropdownExit(open)

  useEffect(() => {
    if (!open) return
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const label = options.find(o => o === value || o.value === value)
  const displayLabel = label ? (typeof label === 'string' ? label : label.label) : placeholder

  return (
    <div ref={ref} className={`comp-sort-wrap${fullWidth ? ' comp-sort-wrap--full' : ''}`}>
      <button
        className={`comp-sort-btn comp-select-btn${open ? ' comp-sort-btn--active' : ''}${fullWidth ? ' comp-select-btn--full' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        <span>{displayLabel}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>
      {visible && (
        <div className={`comp-sort-menu${fullWidth ? ' comp-sort-menu--full' : ''}${closing ? ' comp-sort-menu--closing' : ''}`}>
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

function applySortToNodes(nodes, sortBy) {
  if (sortBy === 'default') return nodes
  return [...nodes].sort((a, b) => {
    if (sortBy === 'az') return a.name.localeCompare(b.name)
    if (sortBy === 'za') return b.name.localeCompare(a.name)
    if (sortBy === 'strong_weak') return b.pct - a.pct
    if (sortBy === 'weak_strong') return a.pct - b.pct
    return 0
  })
}

// ── Download button ───────────────────────────────────────────────
const IcFilePdf = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="none" stroke="currentColor" strokeWidth="1.4"/>
    <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.4" fill="none"/>
    <text x="12" y="17" textAnchor="middle" fontSize="5.5" fontWeight="700" fill="currentColor" fontFamily="Inter,sans-serif">PDF</text>
  </svg>
)
const IcFileCsv = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="none" stroke="currentColor" strokeWidth="1.4"/>
    <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.4" fill="none"/>
    <text x="12" y="17" textAnchor="middle" fontSize="5.5" fontWeight="700" fill="currentColor" fontFamily="Inter,sans-serif">CSV</text>
  </svg>
)
const IcFileExcel = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="none" stroke="currentColor" strokeWidth="1.4"/>
    <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.4" fill="none"/>
    <text x="12" y="17" textAnchor="middle" fontSize="5" fontWeight="700" fill="currentColor" fontFamily="Inter,sans-serif">XLS</text>
  </svg>
)
const DL_FORMATS = [
  { id: 'pdf',   label: 'PDF',   Icon: IcFilePdf },
  { id: 'csv',   label: 'CSV',   Icon: IcFileCsv },
  { id: 'excel', label: 'Excel', Icon: IcFileExcel },
]
function DownloadButton() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const { addDownload } = useDownloads()
  useEffect(() => {
    if (!open) return
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])
  return (
    <div className="comp-dl-wrap" ref={ref}>
      <button className="comp-dl-btn" onClick={() => setOpen(v => !v)}>
        <IcDownload /> Download <IcChevronDown />
      </button>
      {open && (
        <div className="comp-dl-menu">
          {DL_FORMATS.map(({ id, label, Icon }) => (
            <button key={id} className="comp-dl-item" onClick={(e) => { addDownload(`Compliance-Overview.${id}`, e.currentTarget); setOpen(false); }}>
              <Icon /> {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────
export default function CompliancePage({ expanded: expandedProp, onExpandChange, onNav }) {
  const [selectedFw, setSelectedFw] = useState('nist_csf')
  const [timeRange, setTimeRange]   = useState('1W')
  const [showTrend, setShowTrend]   = useState(true)
  const [search, setSearch]         = useState('')
  const [sortBy, setSortBy]         = useState('default')
  const [expandedLocal, setExpandedLocal] = useState({})
  const expanded = expandedProp ?? expandedLocal
  const setExpanded = onExpandChange ?? setExpandedLocal
  const [closingIds, setClosingIds] = useState(() => new Set())
  const [openingIds, setOpeningIds] = useState(() => new Set())
  const [collapseHeights, setCollapseHeights] = useState({})
  const [growHeights, setGrowHeights] = useState({})
  const rowRefs = useRef({})
  const [drawerNode, setDrawerNode]       = useState(null)
  const [funcDrawerNode, setFuncDrawerNode] = useState(null)
  const [collapsed, setCollapsed]         = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [fwSearch, setFwSearch]     = useState('')
  const [fwSortBy, setFwSortBy]     = useState('default')
  const fwSearchRef = useRef(null)

  const activeTree = FRAMEWORK_TREES[selectedFw] ?? null

  const onToggle = useCallback(id => {
    const willClose = !!expanded[id]
    if (willClose) {
      const targetNode = findTreeNode(activeTree ?? [], id)
      const descendantIds = targetNode ? visibleDescendantIds(targetNode, expanded) : []

      // Measure each closing row's current rendered height, then collapse to 0 next frame
      // so the browser has a concrete starting height to transition from (not "auto").
      const measured = {}
      descendantIds.forEach(did => {
        const el = rowRefs.current[did]
        if (el) measured[did] = el.getBoundingClientRect().height
      })
      setCollapseHeights(h => ({ ...h, ...measured }))
      requestAnimationFrame(() => {
        setCollapseHeights(h => {
          const next = { ...h }
          descendantIds.forEach(did => { if (did in next) next[did] = 0 })
          return next
        })
      })

      setClosingIds(c => new Set(c).add(id))
      setTimeout(() => {
        setClosingIds(c => { if (!c.has(id)) return c; const next = new Set(c); next.delete(id); return next })
        setCollapseHeights(h => {
          const next = { ...h }
          descendantIds.forEach(did => { delete next[did] })
          return next
        })
      }, 200)
    } else {
      const targetNode = findTreeNode(activeTree ?? [], id)
      const descendantIds = targetNode ? visibleDescendantIds(targetNode, expanded) : []

      setOpeningIds(o => new Set(o).add(id))
      // Mount the new rows collapsed (height 0), then grow into the tree table's standard
      // row height (comp-tree-cell-inner is a fixed 52px) for a real height transition
      // rather than an instant pop-in. A fixed target avoids measuring scrollHeight through
      // an already-collapsed (overflow:hidden) wrapper, which would just read back 0.
      setGrowHeights(g => { const next = { ...g }; descendantIds.forEach(did => { next[did] = 0 }); return next })
      requestAnimationFrame(() => {
        setGrowHeights(g => {
          const next = { ...g }
          descendantIds.forEach(did => { if (did in next) next[did] = TREE_ROW_HEIGHT })
          return next
        })
      })

      setTimeout(() => {
        setOpeningIds(o => { if (!o.has(id)) return o; const next = new Set(o); next.delete(id); return next })
        setGrowHeights(g => { const next = { ...g }; descendantIds.forEach(did => { delete next[did] }); return next })
      }, 280)
    }
    setExpanded(prev => ({ ...prev, [id]: !willClose }))
  }, [expanded, setExpanded, activeTree])

  const onExpand = useCallback((node, level) => {
    if (node.isLeaf) setDrawerNode(node)
    else setFuncDrawerNode({ node, level })
  }, [])

  const visibleFunctions = activeTree
    ? applySortToNodes(
        activeTree.filter(f => f.name.toLowerCase().includes(search.toLowerCase())),
        sortBy
      )
    : []

  const iconFrameworks = FRAMEWORKS.filter(fw => FW_ICONS[fw.id])
  const visibleFrameworks = applySortToNodes(
    fwSearch ? iconFrameworks.filter(fw => fw.name.toLowerCase().includes(fwSearch.toLowerCase())) : iconFrameworks,
    fwSortBy
  )

  return (
    <div className="comp-layout">

      {/* ── Left: Framework list ──────────────────────────────────── */}
      <div className={`card comp-left${collapsed ? ' comp-left--collapsed' : ''}`}>
        <div className="comp-left-header comp-left-header--padded">
          {!collapsed && (
            <div className="comp-left-header-group">
              <span className="comp-left-title">Frameworks ({iconFrameworks.length})</span>
              <SortDropdown value={fwSortBy} onChange={setFwSortBy} />
            </div>
          )}
          <div className={`comp-left-actions${collapsed ? ' comp-left-actions--full' : ''}`}>
            {!collapsed && (
              <button
                className={`comp-icon-btn${showSearch ? ' comp-icon-btn--active' : ''}`}
                title="Search"
                onClick={() => { setShowSearch(v => !v); setFwSearch('') }}
              ><IcSearch /></button>
            )}
            <button
              className="comp-icon-btn"
              title={collapsed ? 'Expand' : 'Collapse'}
              onClick={() => { setCollapsed(v => !v); if (!collapsed) setShowSearch(false) }}
            ><IcCollapse /></button>
          </div>
        </div>

        {showSearch && !collapsed && (
          <div className="comp-fw-search-wrap">
            <DSPillSearch
              value={fwSearch}
              onChange={setFwSearch}
              placeholder="Search frameworks…"
              width="100%"
            />
          </div>
        )}

        <div className={`comp-fw-list${collapsed ? ' comp-fw-list--collapsed comp-fw-list--collapsed-pad' : ' comp-fw-list--pad'}`}>
          {visibleFrameworks.map(fw => {
            const isSelected = fw.id === selectedFw
            if (collapsed) {
              return (
                <div
                  key={fw.id}
                  className={`comp-fw-card comp-fw-card--mini ${isSelected ? 'comp-fw-card--selected' : 'comp-fw-card--default'}`}
                  style={{ '--fw-rgb': cardRgb(fw.pct) }}
                  onClick={() => setSelectedFw(fw.id)}
                >
                  <FwLogo meta={fw.meta} icon={FW_ICONS[fw.id]} darkIcon={FW_ICONS_DARK[fw.id]} />
                  <span className="comp-fw-mini-pct" style={{ '--comp-fw-mini-pct-color': barColor(fw.pct) }}>{fw.pct}%</span>
                </div>
              )
            }
            return (
              <div
                key={fw.id}
                className={`comp-fw-card ${isSelected ? 'comp-fw-card--selected' : 'comp-fw-card--default'}`}
                style={{ '--fw-rgb': cardRgb(fw.pct) }}
                onClick={() => setSelectedFw(fw.id)}
              >
                <div className="comp-fw-card__top">
                  <div className="comp-fw-card__id">
                    <FwLogo meta={fw.meta} icon={FW_ICONS[fw.id]} darkIcon={FW_ICONS_DARK[fw.id]} />
                    <span className={isSelected ? 'comp-fw-name' : 'comp-fw-name comp-fw-name--muted'}>
                      {fw.name}
                    </span>
                  </div>
                </div>
                <div className="comp-fw-card__bar">
                  <span className="comp-fw-count">{fw.assessments} Assessments</span>
                  <div className="comp-fw-bar-row">
                    <span className="comp-fw-pct">{fw.pct}<span className="comp-fw-pct-unit">%</span></span>
                    <div className="comp-fw-track">
                      <div className="comp-fw-fill" style={{ '--comp-fw-w': `${fw.pct}%`, '--comp-fw-bar-color': barColor(fw.pct) }} />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Right: Main content ───────────────────────────────────── */}
      <div className="comp-right">

        {/* Top row */}
        <div className="comp-top-row">

          {/* Score card */}
          <div className="card comp-score-card">
            {/* Header row */}
            <div className="comp-score-header">
              <span className="comp-score-label">Score</span>
              <TimeRangeTabs value={timeRange} onChange={setTimeRange} />
            </div>

            {/* Body: stats left, chart right */}
            <div className="comp-score-body">
              <div className="comp-score-stats">
                <div className="comp-score-value comp-score-value--green">89%</div>
                <div className="comp-score-trend">
                  <span className="comp-score-trend-pill">
                    <IcTrendUp />
                    2%
                  </span>
                  <span className="comp-score-trend-label">from last week</span>
                </div>
                <div className="comp-score-count">
                  <span className="comp-score-count-closed">7,754,803</span>
                  <span className="comp-score-count-total">{' / 8,699,489'}</span>
                </div>
              </div>

              <div className="comp-score-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={SCORE_TREND[timeRange]} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="scoreAreaFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="var(--pai-teal)" stopOpacity={0.30} />
                        <stop offset="100%" stopColor="var(--pai-teal)" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 9, fill: 'var(--shell-text-muted)', fontFamily: 'Inter,system-ui' }}
                      axisLine={false}
                      tickLine={false}
                      dy={4}
                    />
                    <YAxis hide domain={['dataMin - 3', 'dataMax + 1']} />
                    <Tooltip
                      formatter={v => [`${v}%`, 'Score']}
                      contentStyle={{
                        background: 'var(--card-bg)', border: '1px solid var(--card-border)',
                        borderRadius: 6, fontSize: 11, padding: '4px 10px',
                        fontFamily: 'Inter,system-ui', color: 'var(--shell-text)',
                      }}
                      itemStyle={{ color: 'var(--pai-teal)' }}
                      cursor={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="var(--pai-teal)"
                      strokeWidth={2}
                      fill="url(#scoreAreaFill)"
                      dot={false}
                      activeDot={{ r: 4, fill: 'var(--pai-teal)', strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Worst Performing Assessments */}
          <div className="card comp-rating-card">
            <div className="comp-rating-header">
              <div className="comp-rating-title">Worst Performing Assessments (Top 10)</div>
              <div className="comp-rating-col-labels">
                <span>Score</span>
                <span>Findings</span>
              </div>
            </div>

            <div className="comp-rating-rows">
              {WORST_ASSESSMENTS.map((row, i) => (
                <div
                  key={i}
                  className="comp-rating-row comp-rating-row--clickable"
                  onClick={() => setDrawerNode({
                    id: `worst_${i}`,
                    name: row.name,
                    pct: row.score,
                    open: row.findings,
                    closed: 0,
                    rating: row.score <= 1 ? 'Weak' : row.score <= 3 ? 'Moderate' : 'Strong',
                    isLeaf: true,
                  })}
                >
                  <div className="comp-rating-row__name">
                    <EntityBadge type={row.entity} />
                    <span className="comp-rating-name-text">{row.name}</span>
                  </div>
                  <span className="comp-rating-pct">{row.score}%</span>
                  <span className="comp-rating-count">
                    {row.findings.toLocaleString()}
                    <span className="comp-findings-dot" />
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Function tree table */}
        <div className="card comp-domain-card">
          <div className="comp-domain-header">
            <span className="comp-domain-title">Function ({(activeTree ?? []).length})</span>
            <div className="comp-domain-controls">
              <label className="comp-toggle-label">
                Show Trend
                <Toggle checked={showTrend} onChange={setShowTrend} />
              </label>

              <DSPillSearch
                value={search}
                onChange={setSearch}
                placeholder="Search any"
                width={180}
              />

              <DownloadButton />
            </div>
          </div>

          <div className="comp-domain-table-wrap">
            <table className="comp-domain-table">
              <colgroup>
                <col />
                <col className="comp-col-w80" />
                <col className="comp-col-w80" />
                <col className="comp-col-w24pct" />
                <col className="comp-col-w100" />
              </colgroup>
              <thead>
                <tr>
                  <th>
                    <div className="comp-th-name-cell">
                      Name
                      <SortDropdown value={sortBy} onChange={setSortBy} />
                    </div>
                  </th>
                  <th className="right">Passed</th>
                  <th className="right">Failed</th>
                  <th>{showTrend ? 'Compliance (%) with Trend' : 'Compliance Posture'}</th>
                  <th>Rating</th>
                </tr>
              </thead>
              <tbody>
                {activeTree ? (
                  <TreeRows
                    nodes={visibleFunctions}
                    expanded={expanded}
                    closingIds={closingIds}
                    openingIds={openingIds}
                    collapseHeights={collapseHeights}
                    growHeights={growHeights}
                    rowRefs={rowRefs}
                    onToggle={onToggle}
                    onLeafClick={setDrawerNode}
                    onExpand={onExpand}
                    showTrend={showTrend}
                  />
                ) : (
                  <tr>
                    <td className="comp-tree-empty" colSpan={5}>
                      No control data mapped yet for {FRAMEWORKS.find(f => f.id === selectedFw)?.name ?? 'this framework'}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {drawerNode && (
        <AssessmentDrawer node={drawerNode} onClose={() => setDrawerNode(null)} onNav={onNav} />
      )}
      {funcDrawerNode && (
        <FunctionDrawer node={funcDrawerNode.node} level={funcDrawerNode.level} onClose={() => setFuncDrawerNode(null)} />
      )}
    </div>
  )
}

export { AssessmentDrawer, FW_DISPLAY, FW_ICONS, FW_CONTROLS, SelectDropdown }
