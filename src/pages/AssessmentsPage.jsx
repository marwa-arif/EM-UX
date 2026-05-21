import React, { useState, useMemo, useCallback, useRef } from 'react'
import { AssessmentDrawer, FW_DISPLAY, FW_CONTROLS, SelectDropdown } from './CompliancePage.jsx'
import TablePagination from '../components/TablePagination.jsx'
import '../styles/compliance.css'
import '../styles/assessments.css'

// ── Entity icons ──────────────────────────────────────────────────
const ENTITY_ICONS = {
  cloud:    '/assets/icons/entities/cloud-account.svg',
  device:   '/assets/icons/entities/host.svg',
  identity: '/assets/icons/entities/identity.svg',
  storage:  '/assets/icons/entities/storage.svg',
  multi:    '/assets/icons/entities/assessment.svg',
}

function EntityBadge({ type }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 26, height: 26, borderRadius: '50%',
      background: '#F7F9FC', flexShrink: 0,
    }}>
      <img src={ENTITY_ICONS[type] || ENTITY_ICONS.multi} width={15} height={15} alt="" />
    </span>
  )
}

// ── Sort icon ─────────────────────────────────────────────────────
function IcSort({ dir }) {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      {(!dir || dir === 'asc')  && <path d="m7 9 5-5 5 5" opacity={dir === 'asc'  ? 1 : 0.4} />}
      {(!dir || dir === 'desc') && <path d="m7 15 5 5 5-5" opacity={dir === 'desc' ? 1 : 0.4} />}
    </svg>
  )
}

// ── Gear icon ─────────────────────────────────────────────────────
const IcGear = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
)

const IcSearch = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
)

// ── Assessment data ───────────────────────────────────────────────
const ASSESSMENTS = [
  { id: 'a01', name: 'Machine identities have MFA enabled',                                                     entity: 'identity', entityLabel: 'Identity', closed: 15,     open: 88810, pct: 0,  rating: 'Weak',     frameworks: ['scf','nist_csf','pci_dss','nist_800'] },
  { id: 'a02', name: 'Devices are synchronised in CMDB within the last 1 day',                                  entity: 'device',   entityLabel: 'Host',     closed: 2,      open: 54682, pct: 0,  rating: 'Weak',     frameworks: ['scf','nist_800','nist_csf'] },
  { id: 'a03', name: 'Devices follow approved naming conventions',                                               entity: 'device',   entityLabel: 'Host',     closed: 155,    open: 54529, pct: 0,  rating: 'Weak',     frameworks: ['scf'] },
  { id: 'a04', name: 'Devices do not have end of life operating systems',                                        entity: 'device',   entityLabel: 'Host',     closed: 2041,   open: 52645, pct: 3,  rating: 'Weak',     frameworks: ['scf','nist_csf','pci_dss','nist_800','cmmc_2'] },
  { id: 'a05', name: 'Devices have file integrity monitoring enabled',                                           entity: 'device',   entityLabel: 'Host',     closed: 0,      open: 47799, pct: 0,  rating: 'Weak',     frameworks: ['scf','nist_800','nist_csf','pci_dss'] },
  { id: 'a06', name: 'Devices have host firewall protection enabled',                                            entity: 'device',   entityLabel: 'Host',     closed: 192,    open: 47607, pct: 0,  rating: 'Weak',     frameworks: ['scf','nist_800','nist_csf','pci_dss'] },
  { id: 'a07', name: 'Devices enforce blocking of known malware',                                                entity: 'device',   entityLabel: 'Host',     closed: 518,    open: 47281, pct: 1,  rating: 'Weak',     frameworks: ['scf','nist_csf','pci_dss'] },
  { id: 'a08', name: 'Devices have fully functional endpoint protection agent',                                  entity: 'device',   entityLabel: 'Host',     closed: 10263,  open: 37536, pct: 21, rating: 'Weak',     frameworks: ['scf','nist_csf','nist_800','pci_dss'] },
  { id: 'a09', name: 'Non-Human identities in Active Directory have had their password rotated within the last 45 days', entity: 'identity', entityLabel: 'Identity', closed: 4284, open: 35886, pct: 10, rating: 'Weak', frameworks: ['scf','nist_csf','pci_dss','nist_800','cmmc_2'] },
  { id: 'a10', name: 'Devices have Active Blocking enabled',                                                     entity: 'device',   entityLabel: 'Host',     closed: 19028,  open: 35658, pct: 34, rating: 'Weak',     frameworks: ['scf','nist_csf','pci_dss','nist_800','cis'] },
  { id: 'a11', name: 'Devices have an active owner',                                                             entity: 'device',   entityLabel: 'Host',     closed: 20260,  open: 34426, pct: 37, rating: 'Weak',     frameworks: ['scf','nist_800','nist_csf'] },
  { id: 'a12', name: 'Devices are scanned for malicious code within the last 7 days',                           entity: 'device',   entityLabel: 'Host',     closed: 14867,  open: 32932, pct: 31, rating: 'Weak',     frameworks: ['scf','nist_800','nist_csf'] },
  { id: 'a13', name: 'Devices have AV coverage',                                                                entity: 'device',   entityLabel: 'Host',     closed: 14873,  open: 32926, pct: 31, rating: 'Weak',     frameworks: ['scf','nist_csf','pci_dss','nist_800','cis'] },
  { id: 'a14', name: 'Human identities are configured to require a password',                                   entity: 'identity', entityLabel: 'Identity', closed: 152,    open: 31316, pct: 0,  rating: 'Weak',     frameworks: ['scf','nist_csf','pci_dss','nist_800','cis'] },
  { id: 'a15', name: 'Active Human identities have at least one authentication factor',                         entity: 'identity', entityLabel: 'Identity', closed: 157,    open: 31311, pct: 0,  rating: 'Weak',     frameworks: ['scf','nist_csf','pci_dss','nist_800','cis'] },
  { id: 'a16', name: 'Devices have EDR agent installed',                                                        entity: 'device',   entityLabel: 'Host',     closed: 8412,   open: 28940, pct: 22, rating: 'Weak',     frameworks: ['scf','nist_csf','cis'] },
  { id: 'a17', name: 'Cloud resources have monitoring and logging enabled',                                     entity: 'cloud',    entityLabel: 'Cloud',    closed: 3211,   open: 19870, pct: 13, rating: 'Weak',     frameworks: ['nist_csf','pci_dss','cmmc_2'] },
  { id: 'a18', name: 'Vulnerability scans are performed on a regular cadence',                                  entity: 'device',   entityLabel: 'Host',     closed: 12450,  open: 14200, pct: 46, rating: 'Moderate', frameworks: ['scf','nist_csf','pci_dss'] },
  { id: 'a19', name: 'Software assets are inventoried and patched within defined SLAs',                        entity: 'multi',    entityLabel: 'Multi',    closed: 21880,  open: 12300, pct: 64, rating: 'Moderate', frameworks: ['nist_csf','nist_800','cis'] },
  { id: 'a20', name: 'Security event logs are retained for the required duration',                              entity: 'cloud',    entityLabel: 'Cloud',    closed: 38200,  open: 6100,  pct: 86, rating: 'Strong',   frameworks: ['nist_csf','pci_dss','hipaa'] },
  { id: 'a21', name: 'Privileged access is reviewed and recertified on a regular basis',                       entity: 'identity', entityLabel: 'Identity', closed: 5100,   open: 1280,  pct: 79, rating: 'Moderate', frameworks: ['nist_csf','nist_800','cmmc_2','pci_dss'] },
  { id: 'a22', name: 'Multi-factor authentication is enforced for all administrative access',                  entity: 'identity', entityLabel: 'Identity', closed: 44200,  open: 3800,  pct: 92, rating: 'Strong',   frameworks: ['nist_csf','pci_dss','cmmc_2','cis'] },
  { id: 'a23', name: 'EC2 Instances have health monitoring enabled',                                           entity: 'cloud',    entityLabel: 'Cloud',    closed: 9800,   open: 740,   pct: 93, rating: 'Strong',   frameworks: ['nist_csf','nist_800'] },
  { id: 'a24', name: 'Storage resources have Secure File Transfer Protocol (SFTP) enabled',                   entity: 'storage',  entityLabel: 'Storage',  closed: 280,    open: 1721,  pct: 14, rating: 'Weak',     frameworks: ['nist_csf','pci_dss','nist_800'] },
  { id: 'a25', name: 'Devices have a single assigned owner',                                                   entity: 'device',   entityLabel: 'Host',     closed: 19991,  open: 18740, pct: 51, rating: 'Moderate', frameworks: ['scf','nist_csf'] },
]

const RATING_ORDER = { Weak: 0, Moderate: 1, Strong: 2, Compliant: 3 }

function ratingBadgeStyle(r) {
  return {
    Compliant: { bg: '#1A7D4D', fg: '#fff',                  border: 'transparent' },
    Strong:    { bg: 'var(--pai-low-bg)',  fg: 'var(--pai-green)',   border: 'rgba(49,165,109,0.3)' },
    Moderate:  { bg: 'var(--pai-high-bg)', fg: 'var(--pai-high-fg)', border: 'rgba(217,139,29,0.3)' },
    Weak:      { bg: 'var(--pai-crit-bg)', fg: 'var(--pai-crit-fg)', border: 'rgba(209,35,41,0.3)' },
  }[r] || { bg: 'var(--shell-raised)', fg: 'var(--shell-text)', border: 'var(--shell-border)' }
}

// ── Framework stack ───────────────────────────────────────────────
function FwStack({ keys, onOverflow }) {
  const shown = keys.slice(0, 3)
  const extra = keys.length - 3
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {shown.map((key, i) => {
        const m = FW_DISPLAY[key] || {}
        return (
          <div key={i} style={{
            width: 22, height: 22, borderRadius: '50%',
            background: m.icon ? 'transparent' : (m.ring || 'var(--shell-raised)'),
            border: m.icon ? 'none' : '1px solid var(--shell-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginLeft: i > 0 ? -6 : 0, overflow: 'hidden',
            fontSize: 7, fontWeight: 700, color: m.fg || 'var(--shell-text)',
            flexShrink: 0, zIndex: 3 - i,
          }}>
            {m.icon
              ? <img src={m.icon} width={14} height={14} alt="" style={{ objectFit: 'contain' }} />
              : m.abbr}
          </div>
        )
      })}
      {extra > 0 && (
        <button
          className="comp-fw-overflow-btn"
          style={{ marginLeft: -6 }}
          onClick={e => {
            e.stopPropagation()
            onOverflow?.(e.currentTarget.getBoundingClientRect(), keys)
          }}
        >+{extra}</button>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────
export default function AssessmentsPage() {
  const [search, setSearch]         = useState('')
  const [sortCol, setSortCol]       = useState(null)
  const [sortDir, setSortDir]       = useState('asc')
  const [page, setPage]             = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(20)
  const [drawerNode, setDrawerNode] = useState(null)
  const [fwPopover, setFwPopover]       = useState(null) // { rect, keys }
  const [ticketRow, setTicketRow]       = useState(null)
  const [ctTitle, setCtTitle]           = useState('')
  const [ctDescription, setCtDescription] = useState('')
  const [ctAssignee, setCtAssignee]     = useState('Patch Admin')
  const [toast, setToast]               = useState(null)

  const openTicket = useCallback((row, e) => {
    e.stopPropagation()
    const code = `PR-${parseInt(row.id.slice(1)).toString().padStart(3,'0')}`
    setCtTitle(`[${code}] ${row.name}`)
    setCtDescription(`${row.open.toLocaleString()} open findings have been identified for "${row.name}" across ${row.entityLabel} assets. This assessment is currently rated ${row.rating}. Immediate remediation is recommended to address the compliance gap and reduce overall exposure.`)
    setTicketRow(row)
  }, [])
  const closeTicket = useCallback(() => setTicketRow(null), [])
  const handleCreateTicket = useCallback(() => {
    closeTicket()
    const success = Math.random() > 0.15
    setToast({ type: success ? 'success' : 'error', msg: success ? 'Ticket created successfully.' : 'Failed to create ticket. Please try again.' })
    if (success) setTimeout(() => setToast(null), 3000)
  }, [closeTicket])

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return q
      ? ASSESSMENTS.filter(a => a.name.toLowerCase().includes(q) || a.entityLabel.toLowerCase().includes(q))
      : ASSESSMENTS
  }, [search])

  const sorted = useMemo(() => {
    if (!sortCol) return filtered
    return [...filtered].sort((a, b) => {
      let va, vb
      if (sortCol === 'name')   { va = a.name;   vb = b.name;   return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va) }
      if (sortCol === 'rating') { va = RATING_ORDER[a.rating]; vb = RATING_ORDER[b.rating] }
      if (sortCol === 'score')  { va = a.pct; vb = b.pct }
      if (sortCol === 'entity') { va = a.entityLabel; vb = b.entityLabel; return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va) }
      return sortDir === 'asc' ? va - vb : vb - va
    })
  }, [filtered, sortCol, sortDir])

  const paginated  = sorted.slice((page - 1) * rowsPerPage, page * rowsPerPage)
  const ticketCode = ticketRow ? `PR-${parseInt(ticketRow.id.slice(1)).toString().padStart(3, '0')}` : ''
  const mockTickets = [
    { id: 'PA-1238', date: '08 April 2026' },
    { id: 'PA-1220', date: '13 March 2026' },
    { id: 'PA-1190', date: '11 March 2026' },
  ]

  const sortProps = (col) => ({
    onClick: () => handleSort(col),
    style: { cursor: 'pointer', userSelect: 'none' },
  })

  return (
    <div className="asmts-page">
      <div className="asmts-card">
      {/* Header bar */}
      <div className="asmts-header">
        <span className="asmts-title">Assessments ({filtered.length.toLocaleString()})</span>
        <div className="asmts-search-wrap">
          <input
            className="asmts-search"
            placeholder="Search Any"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
          <span className="asmts-search-icon"><IcSearch /></span>
        </div>
      </div>

      {/* Table */}
      <div className="asmts-table-wrap">
        <table className="ds-table asmts-table">
          <thead>
            <tr>
              <th style={{ width: 36 }} />
              <th {...sortProps('name')}>
                <span className="asmts-th-inner">Name <IcSort dir={sortCol === 'name' ? sortDir : null} /></span>
              </th>
              <th>Findings</th>
              <th {...sortProps('rating')}>
                <span className="asmts-th-inner">Rating <IcSort dir={sortCol === 'rating' ? sortDir : null} /></span>
              </th>
              <th {...sortProps('score')}>
                <span className="asmts-th-inner">Score(%) <IcSort dir={sortCol === 'score' ? sortDir : null} /></span>
              </th>
              <th>Related Frameworks</th>
              <th {...sortProps('entity')}>
                <span className="asmts-th-inner">Entity <IcSort dir={sortCol === 'entity' ? sortDir : null} /></span>
              </th>
              <th style={{ width: 40, textAlign: 'center' }}><IcGear /></th>
            </tr>
          </thead>
          <tbody>
            {paginated.map(a => {
              const rs = ratingBadgeStyle(a.rating)
              return (
                <tr key={a.id} className="asmts-row">
                  <td><EntityBadge type={a.entity} /></td>
                  <td className="asmts-name-cell asmts-name-link" onClick={() => setDrawerNode(a)}>{a.name}</td>
                  <td>
                    <div className="asmts-findings-cell">
                      <span className="asmts-findings-val">
                        {a.closed.toLocaleString()}
                        <span className="asmts-dot asmts-dot--green" />
                      </span>
                      <span className="asmts-findings-val">
                        {a.open.toLocaleString()}
                        <span className="asmts-dot asmts-dot--red" />
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="asmts-rating-pill" style={{ background: rs.bg, color: rs.fg, border: `1px solid ${rs.border}` }}>
                      {a.rating}
                    </span>
                  </td>
                  <td className="asmts-score-cell">{a.pct}</td>
                  <td><FwStack keys={a.frameworks} onOverflow={(rect, keys) => setFwPopover({ rect, keys })} /></td>
                  <td>
                    <span className="asmts-entity-pill">{a.entityLabel}</span>
                  </td>
                  <td>
                    <button className="asmts-action-btn" title="Create Ticket" onClick={e => openTicket(a, e)}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                      </svg>
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <TablePagination
        total={sorted.length}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={setPage}
        onRowsPerPageChange={n => { setRowsPerPage(n); setPage(1) }}
      />
      </div>

      {drawerNode && (
        <AssessmentDrawer
          node={drawerNode}
          onClose={() => setDrawerNode(null)}
        />
      )}

      {fwPopover && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 9099 }} onClick={() => setFwPopover(null)} />
          <div className="comp-fw-popover" style={{
            top: Math.min(fwPopover.rect.bottom + 6, window.innerHeight - 300),
            left: fwPopover.rect.left,
          }}>
            {fwPopover.keys.map((key, fi) => {
              const meta = FW_DISPLAY[key] || {}
              const ctrl = FW_CONTROLS[key] || {}
              return (
                <div key={fi} className="comp-fw-popover-item">
                  <div className="comp-fw-popover-badge" style={{ background: meta.icon ? 'transparent' : (meta.ring || 'var(--card-bg)'), border: meta.icon ? 'none' : '1px solid var(--shell-border)' }}>
                    {meta.icon
                      ? <img src={meta.icon} width={18} height={18} alt="" style={{ objectFit: 'contain' }} />
                      : <span style={{ fontSize: 7, fontWeight: 700, color: meta.fg }}>{meta.abbr}</span>}
                  </div>
                  <div className="comp-fw-popover-body">
                    <span className="comp-fw-popover-name">{meta.name || key}</span>
                    {ctrl.control && <span className="comp-fw-popover-control">• {ctrl.control}: {ctrl.desc}</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Create Ticket modal */}
      {ticketRow !== null && (
        <div className="ct-overlay" onClick={closeTicket}>
          <div className="ct-modal" onClick={e => e.stopPropagation()}>
            <div className="ct-modal__header">
              <div className="ct-modal__title">Create Ticket</div>
              <div className="ct-modal__subtitle">A ticket is being added to your board to track finding</div>
            </div>
            <div className="ct-modal__body">
              <div className="ct-field">
                <label className="ct-label">Title</label>
                <input className="ct-input" type="text" value={ctTitle} onChange={e => setCtTitle(e.target.value)} />
              </div>
              <div className="ct-field">
                <label className="ct-label">Assignee</label>
                <SelectDropdown
                  value={ctAssignee}
                  onChange={setCtAssignee}
                  options={['Patch Admin', 'Security Admin', 'IT Operations']}
                  fullWidth
                />
              </div>
              <div className="ct-field">
                <label className="ct-label">Description</label>
                <textarea className="ct-textarea" rows={3} value={ctDescription} onChange={e => setCtDescription(e.target.value)} />
              </div>
              <div className="ct-warning">
                <span className="ct-warning-dot" />
                Out of the total {ticketRow.open.toLocaleString()} findings, only the top 3,000 findings from the selected assessment {ticketCode} will be consolidated into a file in the ticket.
              </div>
              <div className="ct-ticket-history-box">
                <div className="ct-ticket-history-title">Ticket History</div>
                {mockTickets.map(t => (
                  <div key={t.id} className="ct-ticket-item">
                    <input type="checkbox" defaultChecked className="ct-ticket-check" />
                    <span className="ct-ticket-id">{t.id}</span>
                    <span className="ct-ticket-name">/ {ticketCode} - {ticketRow.name}</span>
                    <span className="ct-ticket-date">Created on {t.date}</span>
                    <span className="ct-ticket-status">Open</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="ct-modal__footer">
              <button className="ct-btn ct-btn--cancel" onClick={closeTicket}>Cancel</button>
              <button className="ct-btn ct-btn--create" onClick={handleCreateTicket} disabled={!ctTitle.trim()}>Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="ds-toast-container">
          <div className={`ds-toast ${toast.type}`}>
            <span>{toast.msg}</span>
            <button className="ds-toast-dismiss" onClick={() => setToast(null)}>×</button>
          </div>
        </div>
      )}
    </div>
  )
}
