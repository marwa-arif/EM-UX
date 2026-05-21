import React, { useState, useRef, useEffect, useCallback } from 'react'
import TablePagination from '../components/TablePagination.jsx'
import '../styles/compliance.css'
import '../styles/navigator.css'

// ── Icons ──────────────────────────────────────────────────────────
const IcExploreAction = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3.72222 13.5C3.39807 13.5 3.08719 13.3712 2.85798 13.142C2.62877 12.9128 2.5 12.6019 2.5 12.2778V8H6.00379C7.1092 8 8.00498 8.89675 8.00379 10.0022L8 13.5H3.72222Z"/>
    <path d="M13.5 9.34636V12.2778C13.5 12.6019 13.3712 12.9128 13.142 13.142C12.9128 13.3712 12.6019 13.5 12.2778 13.5H8M6.69508 2.5H3.72222C3.39807 2.5 3.08719 2.62877 2.85798 2.85798C2.62877 3.08719 2.5 3.39807 2.5 3.72222V8M13.5 2.5L9.36629 6.63371M13.5 6.62568V2.5H9.36629M2.5 8V12.2778C2.5 12.6019 2.62877 12.9128 2.85798 13.142C3.08719 13.3712 3.39807 13.5 3.72222 13.5H8M2.5 8H6.00379C7.1092 8 8.00498 8.89675 8.00379 10.0022L8 13.5"/>
  </svg>
)

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

// ── Entity badge ───────────────────────────────────────────────────
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
      width: 24, height: 24, borderRadius: '50%', background: '#F7F9FC', flexShrink: 0,
    }}>
      <img src={src} width={14} height={14} alt="" />
    </span>
  )
}

// ── Toggle ─────────────────────────────────────────────────────────
function Toggle({ checked, onChange }) {
  return (
    <label style={{ position: 'relative', display: 'inline-block', width: 32, height: 18, cursor: 'pointer', flexShrink: 0 }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} />
      <span style={{
        position: 'absolute', inset: 0, borderRadius: 44,
        background: checked ? 'var(--pai-indigo)' : 'var(--shell-border)',
        transition: 'background 200ms',
      }}>
        <span style={{
          position: 'absolute', top: 2, left: checked ? 16 : 2,
          width: 14, height: 14, borderRadius: '50%', background: '#fff',
          transition: 'left 200ms', boxShadow: '0 1px 3px rgba(0,0,0,.2)',
        }} />
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
    <div ref={ref} style={{ position: 'relative', width: fullWidth ? '100%' : undefined }}>
      <button
        className={`comp-sort-btn comp-select-btn${open ? ' comp-sort-btn--active' : ''}`}
        style={fullWidth ? { width: '100%', justifyContent: 'space-between' } : {}}
        onClick={() => setOpen(o => !o)}
      >
        <span>{displayLabel}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>
      {open && (
        <div className="comp-sort-menu" style={fullWidth ? { width: '100%', left: 0 } : {}}>
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

export default function ComplianceFindingsPage({ filter = null, onClearFilter }) {
  const [inclClosed, setInclClosed]     = useState(false)
  const [page, setPage]                 = useState(1)
  const [rowsPerPage, setRowsPerPage]   = useState(25)
  const [downloadOpen, setDownloadOpen] = useState(false)
  const [remediationRow, setRemediationRow]         = useState(null) // { i, rect }
  const [createTicketEntity, setCreateTicketEntity] = useState(null) // null | string
  const [ctDescription, setCtDescription]           = useState('')
  const [ctAssignee, setCtAssignee]                 = useState('Patch Admin')
  const [toast, setToast]                           = useState(null) // { type, msg }
  const downloadRef = useRef(null)

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
  const filteredRows = filter
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

  const total = filter
    ? filteredRows.length
    : inclClosed ? TOTAL_ALL : TOTAL_OPEN

  const visibleRows = filteredRows.slice((page - 1) * rowsPerPage, page * rowsPerPage)

  return (
    <>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, padding: 16, overflow: 'hidden', height: '100%', boxSizing: 'border-box' }}>

        {/* Card container */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0,
          background: 'var(--card-bg)', border: '1px solid var(--card-border)',
          borderRadius: 4, overflow: 'hidden',
        }}>

          {/* Widget header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 16px', borderBottom: '1px solid var(--shell-border)', flexShrink: 0,
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--shell-text)' }}>
              Findings Details ({total.toLocaleString()})
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {!filter && (
                <label className="comp-drawer-incl-label">
                  Include Closed Findings
                  <Toggle checked={inclClosed} onChange={v => { setInclClosed(v); setPage(1) }} />
                </label>
              )}
              <div ref={downloadRef} style={{ position: 'relative' }}>
                <button
                  className={`comp-drawer-download-btn${downloadOpen ? ' comp-sort-btn--active' : ''}`}
                  onClick={() => setDownloadOpen(o => !o)}
                >
                  <IcDownload />
                  Download
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="m6 9 6 6 6-6"/>
                  </svg>
                </button>
                {downloadOpen && (
                  <div className="comp-sort-menu" style={{ right: 0, left: 'auto', minWidth: 160 }}>
                    {['Export as CSV', 'Export as PDF', 'Export as Excel'].map(opt => (
                      <button key={opt} className="comp-sort-item" onClick={() => setDownloadOpen(false)}>{opt}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Active filter bar */}
          {filter && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
              padding: '8px 16px', borderBottom: '1px solid var(--shell-border)',
              background: 'rgba(99,96,216,0.04)', flexShrink: 0,
            }}>
              <span style={{ fontSize: 11, color: 'var(--shell-text-muted)', fontWeight: 500 }}>Filtered by:</span>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                height: 22, padding: '0 8px', borderRadius: 44,
                background: 'rgba(99,96,216,0.10)', border: '1px solid rgba(99,96,216,0.25)',
                fontSize: 11, fontWeight: 500, color: 'var(--pai-indigo)',
              }}>
                {filter.frameworkName}
              </span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--shell-text-muted)" strokeWidth="2" strokeLinecap="round"><path d="m9 18 6-6-6-6"/></svg>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                height: 22, padding: '0 8px', borderRadius: 44,
                background: 'rgba(99,96,216,0.10)', border: '1px solid rgba(99,96,216,0.25)',
                fontSize: 11, fontWeight: 500, color: 'var(--pai-indigo)',
              }}>
                {filter.col}
              </span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--shell-text-muted)" strokeWidth="2" strokeLinecap="round"><path d="m9 18 6-6-6-6"/></svg>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                height: 22, padding: '0 8px', borderRadius: 44,
                background: 'rgba(99,96,216,0.10)', border: '1px solid rgba(99,96,216,0.25)',
                fontSize: 11, fontWeight: 500, color: 'var(--pai-indigo)',
              }}>
                {filter.groupBy}: {filter.row}
              </span>
              <button
                onClick={onClearFilter}
                style={{
                  marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4,
                  height: 22, padding: '0 8px', borderRadius: 44, border: 'none',
                  background: 'transparent', color: 'var(--shell-text-muted)',
                  fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--shell-text)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--shell-text-muted)'}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <line x1="1" y1="1" x2="9" y2="9"/><line x1="9" y1="1" x2="1" y2="9"/>
                </svg>
                Clear filter
              </button>
            </div>
          )}

          {/* Table */}
          <div className="ds-table-wrap" style={{ flex: 1, overflowY: 'auto' }}>
            <table className="ds-table">
              <thead>
                <tr>
                  <th className="ds-th">Finding Title</th>
                  <th className="ds-th">Associated Entities</th>
                  <th className="ds-th">Evidence</th>
                  <th className="ds-th">Status</th>
                  <th className="ds-th" style={{ width: 72 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row, i) => (
                  <tr key={i}>
                    <td className="ds-td" style={{ fontWeight: 500, color: 'var(--shell-text)', whiteSpace: 'nowrap' }}>
                      {row.title}
                    </td>
                    <td className="ds-td">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                        <EntityBadge type={row.type} />
                        <span>{row.entity}</span>
                      </div>
                    </td>
                    <td className="ds-td" style={{ color: 'var(--shell-text-muted)', maxWidth: 420, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {row.evidence}
                    </td>
                    <td className="ds-td">
                      <span className="comp-drawer-status-open">Open</span>
                    </td>
                    <td className="ds-td">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <button
                          className="comp-drawer-action-icon"
                          title="Remediation"
                          onClick={e => {
                            const rect = e.currentTarget.getBoundingClientRect()
                            const globalI = (page - 1) * rowsPerPage + i
                            setRemediationRow(prev =>
                              prev !== null && prev.i === globalI ? null : { i: globalI, rect }
                            )
                          }}
                        >
                          <IcRemediation />
                        </button>
                        <button className="comp-drawer-action-icon" title="Explore" style={{ color: 'var(--pai-indigo)' }}>
                          <IcExploreAction />
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

      {/* Remediation popup */}
      {remediationRow !== null && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 210 }} onClick={() => setRemediationRow(null)} />
          <div className="comp-remediation-popup" style={{
            top: Math.min(remediationRow.rect.top, window.innerHeight - 560),
            left: remediationRow.rect.left - 608,
          }}>
            <div className="comp-remediation-header">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span className="comp-remediation-title">Remediation Actions</span>
                <span className="comp-remediation-note">Note: AI-generated remediations offer valuable guidance, but we recommend verifying and validating before implementation.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
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
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--pai-high-fg)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--shell-text)' }}>
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
        <div className="ct-overlay" onClick={closeCreateTicket}>
          <div className="ct-modal" key={createTicketEntity} onClick={e => e.stopPropagation()}>
            <div className="ct-modal__header">
              <div className="ct-modal__title">Create Ticket</div>
              <div className="ct-modal__subtitle">This ticket will be added to your board once you click 'Create' to track this finding.</div>
            </div>
            <div className="ct-modal__body">
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
                <label className="ct-label">Associated Entities</label>
                <input className="ct-input" type="text" value={createTicketEntity} readOnly style={{ background: 'var(--shell-bg)', cursor: 'default' }} />
              </div>
              <div className="ct-field">
                <label className="ct-label">Description of Failed Finding</label>
                <textarea className="ct-textarea" rows={2} value={ctDescription} onChange={e => setCtDescription(e.target.value)} />
              </div>
              <div className="ct-field">
                <label className="ct-label">Remediation Recommendation</label>
                <div className="ct-ai-content">
                  <p style={{ fontWeight: 600, marginBottom: 8, color: 'var(--shell-text)' }}>Recommendation: Register all unmanaged devices in Active Directory and establish ongoing device inventory management</p>
                  <ol style={{ paddingLeft: 16, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
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
            <div className="ct-modal__footer">
              <button className="ct-btn ct-btn--cancel" onClick={closeCreateTicket}>Cancel</button>
              <button className="ct-btn ct-btn--create" onClick={handleCreateTicket}>Create</button>
            </div>
          </div>
        </div>
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
