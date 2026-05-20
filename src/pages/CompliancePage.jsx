import React, { useState, useCallback, useRef, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, PieChart, Pie, Cell } from 'recharts'
import { DSPillSearch } from '../context/WorkspaceCtx.jsx'
import '../styles/compliance.css'

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

const ENTITY_ICON_SRCS = {
  cloud:    '/assets/icons/entities/cloud-account.svg',
  device:   '/assets/icons/entities/host.svg',
  identity: '/assets/icons/entities/identity.svg',
  storage:  '/assets/icons/entities/storage.svg',
  multi:    '/assets/icons/entities/assessment.svg',
}

function EntityBadge({ type }) {
  const src = ENTITY_ICON_SRCS[type] || ENTITY_ICON_SRCS.multi
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 28, height: 28, borderRadius: '50%',
      background: '#F7F9FC',
      flexShrink: 0,
    }}>
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
  nist_csf:   'https://www.figma.com/api/mcp/asset/cfbec188-e19a-4370-8ac5-7810e3c7a616',
  nist_800:   'https://www.figma.com/api/mcp/asset/cfbec188-e19a-4370-8ac5-7810e3c7a616',
  pci_dss:    'https://www.figma.com/api/mcp/asset/d5c036c4-a2a3-410f-bce5-f6c39b2fa8ce',
  cmmc_1:     'https://www.figma.com/api/mcp/asset/3adf955e-45cd-4bce-9992-266c5603eaae',
  cmmc_2:     'https://www.figma.com/api/mcp/asset/3adf955e-45cd-4bce-9992-266c5603eaae',
  csa_ccm:    'https://www.figma.com/api/mcp/asset/345109f0-5d93-48ff-be78-ed2b4b2adf41',
  fedramp:    'https://www.figma.com/api/mcp/asset/f32dc9c1-8ad7-498d-bfde-3072850e13cf',
  cis:        'https://www.figma.com/api/mcp/asset/3a6f6be5-545c-45b9-ae1e-3d5d1bfb230a',
  iso_27001:  null,
  soc2:       null,
  hipaa:      'https://www.figma.com/api/mcp/asset/5e8db389-ac34-4ec2-96a3-f0f854dee513',
  nist_ai:    'https://www.figma.com/api/mcp/asset/1bc51fac-8ca2-481d-96a2-3648e39661be',
  cis_csc:    'https://www.figma.com/api/mcp/asset/3a6f6be5-545c-45b9-ae1e-3d5d1bfb230a',
  cmmc_3:     'https://www.figma.com/api/mcp/asset/3adf955e-45cd-4bce-9992-266c5603eaae',
  fedramp_h:  'https://www.figma.com/api/mcp/asset/f32dc9c1-8ad7-498d-bfde-3072850e13cf',
  gdpr:       null,
  ccpa:       null,
  swift:      'https://www.figma.com/api/mcp/asset/df36acd0-8c54-4f25-8653-1445b5b3ff81',
  dora:       'https://www.figma.com/api/mcp/asset/7cd460e2-84a6-4f5e-8ab8-94af2627572b',
  ens:        null,
  ism:        null,
  iasme:      null,
  cyber_ess:  null,
  soc2_cc:    null,
  nist_priv:  'https://www.figma.com/api/mcp/asset/cfbec188-e19a-4370-8ac5-7810e3c7a616',
  pci_pin:    'https://www.figma.com/api/mcp/asset/d5c036c4-a2a3-410f-bce5-f6c39b2fa8ce',
  iso_22301:  null,
  cobit:      'https://www.figma.com/api/mcp/asset/8b24d92c-bc2c-4186-9f6e-7c05374aab8b',
}

function FwLogo({ icon, meta }) {
  return (
    <div style={{
      width: 32, height: 32, borderRadius: '50%',
      background: icon ? '#fff' : meta.ring,
      border: '1px solid var(--shell-border)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, overflow: 'hidden',
    }}>
      {icon
        ? <img src={icon} width={24} height={24} alt="" style={{ objectFit: 'contain' }} />
        : <span style={{ fontSize: 8, fontWeight: 700, color: meta.fg, letterSpacing: '0.02em' }}>{meta.abbr}</span>
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
const FINDINGS_ROWS = [
  { entity: 'WORK-FLR646.ACNA.CORP.COM',    evidence: 'Active Owner Count: 0', status: 'Open' },
  { entity: 'WORK-JRF656228.ACNA.CORP.COM', evidence: 'Active Owner Count: 0', status: 'Open' },
  { entity: 'WORK-BQN304189.ACNA.CORP.COM', evidence: 'Active Owner Count: 0', status: 'Open' },
  { entity: 'WORK-FMJ966.ACNA.CORP.COM',    evidence: 'Active Owner Count: 0', status: 'Open' },
  { entity: 'WORK-BQN304182.ACNA.CORP.COM', evidence: 'Active Owner Count: 0', status: 'Open' },
  { entity: 'WORK-YPS497248.ACNA.CORP.COM', evidence: 'Active Owner Count: 0', status: 'Open' },
]

// ── Function tree data ────────────────────────────────────────────
const TREE_DATA = [
  {
    id: 'gv', name: 'GV: Govern', closed: 56163, open: 53185, pct: 51, rating: 'Moderate',
    children: [
      {
        id: 'gv_rr', name: 'GV.RR: Roles, Responsibilities, and Authorities', closed: 56162, open: 53185, pct: 51, rating: 'Moderate',
        children: [
          {
            id: 'gv_rr_02', name: 'GV.RR-02: Roles, responsibilities, and authorities related to cybersecurity risk management', closed: 56162, open: 53185, pct: 51, rating: 'Moderate',
            children: [
              { id: 'gv_rr_02_a', name: 'Devices have a single assigned owner',   closed: 19991, open: 18740, pct: 51, rating: 'Moderate', isLeaf: true },
              { id: 'gv_rr_02_b', name: 'Users have their role inventoried',       closed: 15910, open: 19,    pct: 99, rating: 'Strong',   isLeaf: true },
              { id: 'gv_rr_02_c', name: 'Devices have an active owner',            closed: 20261, open: 34426, pct: 37, rating: 'Weak',     isLeaf: true },
            ],
          },
        ],
      },
      {
        id: 'gv_po', name: 'GV.PO: Policy', closed: 1, open: 0, pct: 100, rating: 'Compliant',
        children: [
          {
            id: 'gv_po_01', name: 'GV.PO-01: Policy for managing cybersecurity risks is established based on organizational requirements', closed: 1, open: 0, pct: 100, rating: 'Compliant',
            children: [],
          },
        ],
      },
    ],
  },
  {
    id: 'id', name: 'ID: Identify', closed: 219945, open: 119600, pct: 64, rating: 'Moderate',
    children: [
      {
        id: 'id_am', name: 'ID.AM: Asset Management', closed: 189570, open: 102110, pct: 64, rating: 'Moderate',
        children: [
          { id: 'id_am_01', name: 'ID.AM-01: Inventories of hardware managed by the organization are maintained',                         closed: 174747, open: 94561, pct: 64, rating: 'Moderate', children: [] },
          { id: 'id_am_02', name: 'ID.AM-02: Inventories of software, services, and systems managed by the organization are maintained',  closed: 39548,  open: 15137, pct: 72, rating: 'Moderate', children: [] },
          { id: 'id_am_03', name: 'ID.AM-03: Representations of the organization\'s authorized network communication are maintained',      closed: 1,      open: 0,     pct: 100, rating: 'Compliant', children: [] },
          { id: 'id_am_07', name: 'ID.AM-07: Inventories of data and corresponding metadata for designated data types are maintained',    closed: 2908,   open: 3222,  pct: 47, rating: 'Weak',     children: [] },
          { id: 'id_am_08', name: 'ID.AM-08: Systems, hardware, software, services, and data are managed throughout their life cycles',   closed: 11914,  open: 4327,  pct: 73, rating: 'Moderate', children: [] },
        ],
      },
      {
        id: 'id_ra', name: 'ID.RA: Risk Assessment', closed: 30375, open: 17490, pct: 63, rating: 'Moderate',
        children: [],
      },
    ],
  },
  {
    id: 'pr', name: 'PR: Protect', closed: 7123443, open: 393013, pct: 94, rating: 'Strong',
    children: [],
  },
  {
    id: 'de', name: 'DE: Detect', closed: 284102, open: 198430, pct: 58, rating: 'Moderate',
    children: [],
  },
  {
    id: 'rs', name: 'RS: Respond', closed: 71245, open: 28910, pct: 71, rating: 'Moderate',
    children: [],
  },
]

function ratingClass(r) {
  return {
    Compliant: 'comp-rating-badge--compliant',
    Strong:    'comp-rating-badge--strong',
    Moderate:  'comp-rating-badge--moderate',
    Weak:      'comp-rating-badge--weak',
  }[r] || ''
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

  const pts = genSparkPoints(pct, seed)
  const w = 80, h = 32
  const min = Math.min(...pts) - 4
  const max = Math.max(...pts) + 4
  const range = max - min || 1
  const xs = pts.map((_, i) => (i / (pts.length - 1)) * w)
  const ys = pts.map(v => h - ((v - min) / range) * (h - 4) - 2)
  const line = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ')
  const color = 'var(--pai-teal)'

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
      style={{ position: 'relative', flex: 1, minWidth: 0 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setHoverIdx(null) }}
    >
      {/* Fixed-position tooltip escapes overflow:hidden ancestors */}
      {hoverIdx !== null && (
        <div style={{
          position: 'fixed',
          left: mousePos.x,
          top: mousePos.y - 58,
          transform: 'translateX(-50%)',
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          borderRadius: 6,
          padding: '5px 8px',
          fontSize: 11,
          whiteSpace: 'nowrap',
          zIndex: 9999,
          pointerEvents: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,0.14)',
          color: 'var(--shell-text)',
        }}>
          <div style={{ color: 'var(--shell-text-muted)', fontSize: 10, marginBottom: 2 }}>
            {SPARK_LABELS[hoverIdx]} 2025
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ color: 'var(--shell-text-muted)' }}>Score</span>
            <span style={{ color, fontWeight: 600 }}>{Math.round(pts[hoverIdx])}%</span>
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
        style={{ display: 'block', cursor: 'crosshair' }}
      >
        <path d={`${line} L${w},${h} L0,${h} Z`} fill={color} fillOpacity="0.10"/>
        <path d={line} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>

      {/* Dot rendered as DOM element to stay circular despite non-uniform SVG scaling */}
      {hoverIdx !== null && (
        <div style={{
          position: 'absolute',
          left: `${(hx / w) * 100}%`,
          top: `${(hy / h) * 100}%`,
          transform: 'translate(-50%, -50%)',
          width: 7, height: 7,
          borderRadius: '50%',
          background: color,
          border: '1.5px solid var(--card-bg)',
          pointerEvents: 'none',
          zIndex: 1,
        }} />
      )}

    </div>
  )
}

// ── Toggle ────────────────────────────────────────────────────────
function Toggle({ checked, onChange }) {
  return (
    <label style={{ position: 'relative', display: 'inline-block', width: 32, height: 18, cursor: 'pointer', flexShrink: 0 }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} />
      <span style={{
        position: 'absolute', inset: 0, borderRadius: 18,
        background: checked ? 'var(--shell-accent)' : 'var(--ctrl-bg, #D8D8D8)',
        transition: 'background 150ms', display: 'block',
      }}>
        <span style={{
          position: 'absolute', top: 2, left: checked ? 16 : 2,
          width: 14, height: 14, borderRadius: '50%', background: '#fff',
          transition: 'left 150ms', boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
        }} />
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
function SemiDonutChart({ pct, width = 482 }) {
  const color = pct >= 85 ? 'var(--pai-green)' : pct >= 60 ? 'var(--pai-high-fg)' : 'var(--pai-crit-fg)'
  const clamped = Math.min(Math.max(pct, 0), 100)
  const outerR = Math.round(width * 0.38)
  const innerR = Math.round(outerR * 0.88)
  const height = outerR + 12
  const cy = height - 2

  return (
    <div style={{ position: 'relative', width, height, flexShrink: 0 }}>
      <PieChart width={width} height={height}>
        <Pie
          data={[{ value: clamped }, { value: 100 - clamped }]}
          cx={width / 2}
          cy={cy}
          startAngle={180}
          endAngle={0}
          innerRadius={innerR}
          outerRadius={outerR}
          dataKey="value"
          strokeWidth={0}
          paddingAngle={clamped > 0 && clamped < 100 ? 1 : 0}
        >
          <Cell fill={color} />
          <Cell fill="var(--shell-raised)" />
        </Pie>
      </PieChart>
      <div style={{
        position: 'absolute',
        bottom: 10,
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: 40, fontWeight: 700, color,
        lineHeight: 1, whiteSpace: 'nowrap',
        fontFamily: 'Inter,system-ui,sans-serif',
      }}>
        {pct}%
      </div>
    </div>
  )
}

// ── Assessment drawer ─────────────────────────────────────────────
function AssessmentDrawer({ node, onClose }) {
  const [tRange, setTRange] = useState('3M')
  const [inclClosed, setInclClosed] = useState(false)
  const [closing, setClosing] = useState(false)
  const total = node.closed + node.open

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
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
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
            <p className="comp-drawer-desc" style={{ margin: 0 }}>
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
                  <span style={{
                    background: 'var(--shell-raised)', border: '1px solid var(--shell-border)',
                    borderRadius: 4, padding: '1px 6px', fontSize: 11, fontWeight: 600, fontFamily: 'monospace'
                  }}>{node.id.toUpperCase().replace('_', '-')}</span>
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
                    <div key={i} style={{
                      width: 22, height: 22, borderRadius: '50%',
                      background: '#fff', border: '1px solid var(--shell-border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginLeft: i > 0 ? -6 : 0, overflow: 'hidden', flexShrink: 0,
                    }}>
                      <img src={icon} width={16} height={16} alt="" style={{ objectFit: 'contain' }} />
                    </div>
                  ))}
                  <span style={{ fontSize: 11, color: 'var(--pai-indigo)', fontWeight: 600, marginLeft: 4 }}>+3</span>
                </span>
              </div>
              <div className="comp-drawer-ov-item">
                <span className="comp-drawer-ov-label">Criticality</span>
                <span className="comp-drawer-ov-value">
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', height: 20, padding: '0 8px',
                    borderRadius: 44, background: 'var(--pai-high-bg)', color: 'var(--pai-high-fg)',
                    border: '1px solid rgba(217,139,29,0.3)', fontSize: 10, fontWeight: 600
                  }}>Medium</span>
                </span>
              </div>
              <div className="comp-drawer-ov-item">
                <span className="comp-drawer-ov-label">Rating</span>
                <span className="comp-drawer-ov-value">
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', height: 20, padding: '0 8px',
                    borderRadius: 44, background: ratingMeta.bg, color: ratingMeta.color,
                    border: `1px solid ${ratingMeta.border}`, fontSize: 10, fontWeight: 600
                  }}>{node.rating}</span>
                </span>
              </div>
              <div className="comp-drawer-ov-item">
                <span className="comp-drawer-ov-label">Last Evaluated</span>
                <span className="comp-drawer-ov-value" style={{ fontSize: 12 }}>08 August 2024</span>
              </div>
            </div>
          </div>

          {/* Finding Details */}
          <div className="comp-drawer-section">
            <span className="comp-drawer-section-title">Finding Details</span>
            <div className="comp-drawer-finding-layout">
              {/* Semi-donut + legend */}
              <div className="comp-drawer-donut-col">
                <SemiDonutChart pct={node.pct} width={482} />
                <div className="comp-drawer-semi-legend">
                  {[
                    { label: 'Closed', val: node.closed.toLocaleString(), color: 'var(--pai-green)' },
                    { label: 'Open',   val: node.open.toLocaleString(),   color: 'var(--pai-red-high)' },
                    { label: 'Total',  val: total.toLocaleString(),        color: 'var(--pai-indigo)' },
                  ].map(({ label, val, color }) => (
                    <div key={label} className="comp-drawer-semi-legend-item">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <div className="comp-drawer-legend-dot" style={{ background: color }} />
                        <span style={{ fontSize: 10, color: 'var(--shell-text-muted)' }}>{label}</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--shell-text)' }}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trend chart */}
              <div className="comp-drawer-trend-col">
                <div className="comp-drawer-trend-header">
                  <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--shell-text)', flexShrink: 0 }}>Trend</span>
                  <select className="comp-drawer-trend-select" defaultValue="Compliance Score">
                    <option>Compliance Score</option>
                    <option>Findings Trend</option>
                  </select>
                  <div className="comp-drawer-trend-legends">
                    <span className="comp-drawer-trend-legend-item comp-drawer-trend-legend--critical">
                      <span className="comp-drawer-trend-legend-dash" />
                      Critical Gap (50)
                    </span>
                    <span className="comp-drawer-trend-legend-item comp-drawer-trend-legend--warning">
                      <span className="comp-drawer-trend-legend-dash" />
                      Warning (75)
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                    {['1W','1M','3M','6M','1Y'].map(t => (
                      <button key={t}
                        className={`comp-time-pill${tRange === t ? ' comp-time-pill--active' : ''}`}
                        onClick={() => setTRange(t)}
                      >{t}</button>
                    ))}
                  </div>
                </div>
                <div style={{ flex: 1, minHeight: 180 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={SCORE_TREND[tRange]} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
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
                      <YAxis
                        domain={[0, 100]}
                        ticks={[0, 25, 50, 75, 100]}
                        tick={{ fontSize: 9, fill: 'var(--shell-text-muted)', fontFamily: 'Inter,system-ui' }}
                        axisLine={false} tickLine={false}
                        tickFormatter={v => `${v}`}
                        width={28}
                      />
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
                      <ReferenceLine y={50} stroke="var(--pai-crit-fg)" strokeDasharray="5 3" strokeWidth={1.5} />
                      <ReferenceLine y={75} stroke="var(--pai-high-fg)" strokeDasharray="5 3" strokeWidth={1.5} />
                      <Area type="monotone" dataKey="value"
                        stroke="var(--pai-teal)" strokeWidth={2}
                        fill="url(#drawerAreaFill)" dot={false}
                        activeDot={{ r: 4, fill: 'var(--pai-teal)', strokeWidth: 0 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Findings table */}
          <div className="comp-drawer-section">
            <div className="comp-drawer-findings-header">
              <span className="comp-drawer-findings-title">
                Findings Details ({node.open.toLocaleString()})
              </span>
              <div className="comp-drawer-findings-actions">
                <button className="comp-drawer-kg-btn">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
                  </svg>
                  Explore Asset in Knowledge Graph
                </button>
                <label className="comp-drawer-incl-label">
                  Include Closed Findings
                  <Toggle checked={inclClosed} onChange={setInclClosed} />
                </label>
              </div>
            </div>
            <div className="comp-drawer-table-wrap">
              <table className="comp-drawer-table">
                <thead>
                  <tr>
                    <th>Associated Entities</th>
                    <th>Finding Evidence</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {FINDINGS_ROWS.map((row, i) => (
                    <tr key={i}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--shell-text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
                          </svg>
                          <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{row.entity}</span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--shell-text-muted)' }}>{row.evidence}</td>
                      <td>
                        <span className="comp-drawer-status-open">{row.status}</span>
                      </td>
                      <td>
                        <div className="comp-drawer-action-btns">
                          <button className="comp-drawer-action-icon" title="Open in new tab">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                            </svg>
                          </button>
                          <button className="comp-drawer-action-icon" title="Settings">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}

// ── Tree row renderer ─────────────────────────────────────────────
function collectRows(nodes, level, expanded, parentIsLast) {
  const result = []
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    const isLast = i === nodes.length - 1
    const hasChildren = node.children && node.children.length > 0
    const isOpen = !!expanded[node.id]
    result.push({ node, level, isLast, hasChildren, isOpen, parentIsLast: [...parentIsLast] })
    if (isOpen && hasChildren) {
      result.push(...collectRows(node.children, level + 1, expanded, [...parentIsLast, isLast]))
    }
  }
  return result
}

function TreeRows({ nodes, expanded, onToggle, onLeafClick, showTrend }) {
  const flatRows = collectRows(nodes, 0, expanded, [])

  const sectionEnds = new Set()
  for (let i = 0; i < flatRows.length; i++) {
    const isLastRow = i === flatRows.length - 1
    const nextIsTopLevel = !isLastRow && flatRows[i + 1].level === 0
    if (isLastRow || nextIsTopLevel) sectionEnds.add(i)
  }

  return (
    <>
      {flatRows.map(({ node, level, isLast, hasChildren, isOpen, parentIsLast }, i) => {
        const indent = level * 20 + 8
        const isSectionEnd = sectionEnds.has(i)

        return (
          <tr key={node.id} className={`comp-tree-row${isSectionEnd ? ' comp-tree-row--section-end' : ''}`}>
            <td>
              <div style={{ position: 'relative', height: 52, display: 'flex', alignItems: 'center' }}>
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
                style={{ paddingLeft: indent }}
                onClick={() => node.isLeaf ? onLeafClick(node) : onToggle(node.id)}
              >
                {node.isLeaf ? (
                  <span className={`comp-leaf-icon comp-leaf-icon--${node.rating.toLowerCase()}`} title={`Rating: ${node.rating}`}>{node.rating[0]}</span>
                ) : (
                  <button className="comp-domain-expand" onClick={e => { e.stopPropagation(); onToggle(node.id) }}>
                    {isOpen ? <IcChevronDown /> : <IcChevronRight />}
                  </button>
                )}
                <span className="comp-tree-name" title={node.name}>{node.name}</span>
              </div>
              </div>
            </td>
            <td className="right">
              <div className="comp-count-cell">
                <span className="comp-count-val">{node.closed.toLocaleString()}</span>
                <div className="comp-count-dot" style={{ background: 'var(--pai-green)' }} />
              </div>
            </td>
            <td className="right">
              <div className="comp-count-cell">
                <span className="comp-count-val">{node.open.toLocaleString()}</span>
                {node.open > 0 && <div className="comp-count-dot" style={{ background: 'var(--pai-red-high)' }} />}
              </div>
            </td>
            <td>
              {showTrend ? (
                <div className="comp-posture-cell comp-posture-cell--trend">
                  <Sparkline pct={node.pct} seed={node.id.charCodeAt(0) * 31 + node.pct} />
                  <button className="comp-posture-expand"><IcExpand /></button>
                  <span className="comp-posture-pct" style={{ color: ratingColor(node.rating) }}>{node.pct}%</span>
                </div>
              ) : (
                <div className="comp-posture-cell">
                  <div className="comp-posture-track">
                    <div className="comp-posture-fill" style={{ width: `${node.pct}%`, background: postureColor(node.pct) }} />
                  </div>
                  <button className="comp-posture-expand"><IcExpand /></button>
                  <span className="comp-posture-pct" style={{ color: ratingColor(node.rating) }}>{node.pct}%</span>
                </div>
              )}
            </td>
            <td>
              <span className={`comp-rating-badge ${ratingClass(node.rating)}`}>{node.rating}</span>
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

  useEffect(() => {
    if (!open) return
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const current = SORT_OPTIONS.find(o => o.id === value)

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        className={`comp-sort-btn${open ? ' comp-sort-btn--active' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        <IcSort /> Sort
      </button>
      {open && (
        <div className="comp-sort-menu">
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
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="none" stroke="currentColor" strokeWidth="1.5"/>
    <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <text x="12" y="17" textAnchor="middle" fontSize="5.5" fontWeight="700" fill="currentColor" fontFamily="Inter,sans-serif">PDF</text>
  </svg>
)
const IcFileCsv = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="none" stroke="currentColor" strokeWidth="1.5"/>
    <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <text x="12" y="17" textAnchor="middle" fontSize="5.5" fontWeight="700" fill="currentColor" fontFamily="Inter,sans-serif">CSV</text>
  </svg>
)
const IcFileExcel = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="none" stroke="currentColor" strokeWidth="1.5"/>
    <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.5" fill="none"/>
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
            <button key={id} className="comp-dl-item" onClick={() => setOpen(false)}>
              <Icon /> {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────
export default function CompliancePage() {
  const [selectedFw, setSelectedFw] = useState('nist_csf')
  const [timeRange, setTimeRange]   = useState('1W')
  const [showTrend, setShowTrend]   = useState(true)
  const [search, setSearch]         = useState('')
  const [sortBy, setSortBy]         = useState('default')
  const [expanded, setExpanded]     = useState({ gv: true, id: true, gv_rr: true, id_am: true })
  const [drawerNode, setDrawerNode]  = useState(null)
  const [collapsed, setCollapsed]   = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [fwSearch, setFwSearch]     = useState('')
  const [fwSortBy, setFwSortBy]     = useState('default')
  const fwSearchRef = useRef(null)

  const onToggle = useCallback(id => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }, [])

  const visibleFunctions = applySortToNodes(
    TREE_DATA.filter(f => f.name.toLowerCase().includes(search.toLowerCase())),
    sortBy
  )

  const iconFrameworks = FRAMEWORKS.filter(fw => FW_ICONS[fw.id])
  const visibleFrameworks = applySortToNodes(
    fwSearch ? iconFrameworks.filter(fw => fw.name.toLowerCase().includes(fwSearch.toLowerCase())) : iconFrameworks,
    fwSortBy
  )

  return (
    <div className="comp-layout">

      {/* ── Left: Framework list ──────────────────────────────────── */}
      <div className={`card comp-left${collapsed ? ' comp-left--collapsed' : ''}`}>
        <div className="comp-left-header" style={{ padding: '10px 12px 0' }}>
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
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
          <div style={{ padding: '0 12px' }}>
            <DSPillSearch
              value={fwSearch}
              onChange={setFwSearch}
              placeholder="Search frameworks…"
              width="100%"
            />
          </div>
        )}

        <div className={`comp-fw-list${collapsed ? ' comp-fw-list--collapsed' : ''}`}
          style={{ padding: collapsed ? '8px 8px 12px' : '10px 12px 12px' }}>
          {visibleFrameworks.map(fw => {
            const isSelected = fw.id === selectedFw
            if (collapsed) {
              return (
                <div
                  key={fw.id}
                  className={`comp-fw-card comp-fw-card--mini ${isSelected ? 'comp-fw-card--selected' : 'comp-fw-card--default'}`}
                  style={isSelected ? {
                    '--fw-rgb': cardRgb(fw.pct),
                    background: `linear-gradient(180deg, rgba(${cardRgb(fw.pct)},0.15) 0%, rgba(247,249,252,0) 100%)`
                  } : undefined}
                  onClick={() => setSelectedFw(fw.id)}
                >
                  <FwLogo meta={fw.meta} icon={FW_ICONS[fw.id]} />
                  <span className="comp-fw-mini-pct" style={{ color: barColor(fw.pct) }}>{fw.pct}%</span>
                </div>
              )
            }
            return (
              <div
                key={fw.id}
                className={`comp-fw-card ${isSelected ? 'comp-fw-card--selected' : 'comp-fw-card--default'}`}
                style={isSelected ? {
                  '--fw-rgb': cardRgb(fw.pct),
                  background: `linear-gradient(90deg, rgba(${cardRgb(fw.pct)},0.10) 0%, rgba(247,249,252,0) 100%)`
                } : undefined}
                onClick={() => setSelectedFw(fw.id)}
              >
                <div className="comp-fw-card__top">
                  <div className="comp-fw-card__id">
                    <FwLogo meta={fw.meta} icon={FW_ICONS[fw.id]} />
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
                      <div className="comp-fw-fill" style={{ width: `${fw.pct}%`, background: barColor(fw.pct) }} />
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
              <div className="comp-time-pills">
                {['1W','1M','3M','6M','1Y'].map(t => (
                  <button key={t}
                    className={`comp-time-pill${timeRange === t ? ' comp-time-pill--active' : ''}`}
                    onClick={() => setTimeRange(t)}
                  >{t}</button>
                ))}
              </div>
            </div>

            {/* Body: stats left, chart right */}
            <div className="comp-score-body">
              <div className="comp-score-stats">
                <div className="comp-score-value" style={{ color: 'var(--pai-green)' }}>89%</div>
                <div className="comp-score-trend">
                  <span style={{ color: 'var(--pai-green)', display: 'flex', alignItems: 'center', gap: 3 }}>
                    <IcTrendUp />
                    <strong>2%</strong>
                  </span>
                  <span style={{ color: 'var(--shell-text-muted)', fontSize: 11 }}>from last week</span>
                </div>
                <div className="comp-score-count">
                  <span style={{ color: 'var(--pai-green)', fontWeight: 700 }}>7,754,803</span>
                  <span style={{ color: 'var(--shell-text)', fontWeight: 700 }}>{' / 8,699,489'}</span>
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
              <div style={{ display: 'flex', gap: 24, fontSize: 11, color: 'var(--shell-text-muted)', paddingRight: 4 }}>
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
            <span className="comp-domain-title">Function ({TREE_DATA.length})</span>
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
                <col style={{ width: 80 }} />
                <col style={{ width: 80 }} />
                <col style={{ width: '24%' }} />
                <col style={{ width: 90 }} />
              </colgroup>
              <thead>
                <tr>
                  <th>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      Name
                      <SortDropdown value={sortBy} onChange={setSortBy} />
                    </div>
                  </th>
                  <th className="right">Closed</th>
                  <th className="right">Open</th>
                  <th>{showTrend ? 'Compliance (%) with Trend' : 'Compliance Posture'}</th>
                  <th>Rating</th>
                </tr>
              </thead>
              <tbody>
                <TreeRows
                  nodes={visibleFunctions}
                  level={0}
                  expanded={expanded}
                  onToggle={onToggle}
                  onLeafClick={setDrawerNode}
                  showTrend={showTrend}
                />
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {drawerNode && (
        <AssessmentDrawer node={drawerNode} onClose={() => setDrawerNode(null)} />
      )}
    </div>
  )
}
