import React, { useState } from 'react'
import { Ic } from '../ui.jsx'
import { DSPillSearch, LibraryIcon, SavedIcon, useWorkspace } from '../context/WorkspaceCtx.jsx'
import TablePagination from '../components/TablePagination.jsx'
import { useDownloads } from '../DownloadsContext.jsx'
import { useToast } from '../context/ToastCtx.jsx'
import '../styles/admin.css'
import '../styles/navigator.css'
import '../styles/library.css'

const IcTrashDelete = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    <line x1="10" y1="11" x2="10" y2="17"/>
    <line x1="14" y1="11" x2="14" y2="17"/>
  </svg>
)

const IcCalendarSchedule = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
)

// Workspace › Saved tab

const SAVED_ROWS = [
  { id: '1',  name: 'CISO Dashboard',                              isNew: true,  type: 'DASHBOARD', template: 'Executive Summary',   visibility: 'Private', status: 'Saved',     lastUpdated: '11 August 2025' },
  { id: '2',  name: 'Detailed Report on Software Vulnerabilities',               type: 'REPORT',    template: 'Executive Summary',   visibility: 'Public',  status: 'Scheduled', recipients: 2, lastUpdated: '21 July 2025',    hasCalendar: true },
  { id: '3',  name: 'Compliance Report',                                        type: 'REPORT',    template: 'Compliance',          visibility: 'Public',  status: 'Scheduled', recipients: 4, lastUpdated: '03 June 2025',    hasCalendar: true },
  { id: '4',  name: 'Critical Report - Low Filtered',                           type: 'DASHBOARD', template: 'Critical Findings',   visibility: 'Private', status: 'Saved',     lastUpdated: '03 June 2025' },
  { id: '5',  name: 'Critical Report - High Filtered',                          type: 'DASHBOARD', template: 'Critical Findings',   visibility: 'Private', status: 'Saved',     lastUpdated: '23 May 2025' },
  { id: '6',  name: 'Executive Summary - Q3',                                   type: 'REPORT',    template: 'Executive Summary',   visibility: 'Public',  status: 'Scheduled', recipients: 3, lastUpdated: '18 May 2025',     hasCalendar: true },
  { id: '7',  name: 'Month over Month Vulnerability Trends',                    type: 'REPORT',    template: 'Month over Month',    visibility: 'Private', status: 'Saved',     lastUpdated: '09 May 2025' },
  { id: '8',  name: 'Device Attack Surface Overview',                          type: 'DASHBOARD', template: 'Device Attack Surface', visibility: 'Private', status: 'Saved',   lastUpdated: '02 May 2025' },
  { id: '9',  name: 'Risk Mitigation Queue',                                    type: 'DASHBOARD', template: 'Risk Mitigation',     visibility: 'Public',  status: 'Saved',     lastUpdated: '27 April 2025' },
  { id: '10', name: 'Tracked Security Gaps',                                    type: 'DASHBOARD', template: 'Security Gaps',       visibility: 'Private', status: 'Saved',     lastUpdated: '19 April 2025' },
  { id: '11', name: 'Discover Dashboard - Cloud',                              type: 'DASHBOARD', template: 'Discover Dashboard',  visibility: 'Private', status: 'Saved',     lastUpdated: '12 April 2025' },
  { id: '12', name: 'Discover Dashboard - Identity',                           type: 'DASHBOARD', template: 'Discover Dashboard',  visibility: 'Public',  status: 'Saved',     lastUpdated: '05 April 2025' },
  { id: '13', name: 'Client Subsidiary Health',                                type: 'DASHBOARD', template: 'Client Subsidiary',   visibility: 'Private', status: 'Saved',     lastUpdated: '29 March 2025' },
  { id: '14', name: 'Vulnerability Aging Report',                              type: 'REPORT',    template: 'Executive Summary',   visibility: 'Public',  status: 'Scheduled', recipients: 5, lastUpdated: '21 March 2025',   hasCalendar: true },
  { id: '15', name: 'Patch Compliance Summary',                                type: 'REPORT',    template: 'Compliance',          visibility: 'Private', status: 'Saved',     lastUpdated: '14 March 2025' },
  { id: '16', name: 'Endpoint Risk Dashboard',                                 type: 'DASHBOARD', template: 'Critical Findings',   visibility: 'Private', status: 'Saved',     lastUpdated: '07 March 2025' },
  { id: '17', name: 'Cloud Misconfigurations Report',                         type: 'REPORT',    template: 'Compliance',          visibility: 'Public',  status: 'Scheduled', recipients: 1, lastUpdated: '27 February 2025', hasCalendar: true },
  { id: '18', name: 'Identity Exposure Dashboard',                            type: 'DASHBOARD', template: 'Device Attack Surface', visibility: 'Private', status: 'Saved',   lastUpdated: '19 February 2025' },
  { id: '19', name: 'Third-Party Risk Report',                                 type: 'REPORT',    template: 'Executive Summary',   visibility: 'Private', status: 'Saved',     lastUpdated: '11 February 2025' },
  { id: '20', name: 'Asset Inventory Dashboard',                              type: 'DASHBOARD', template: 'Discover Dashboard',  visibility: 'Public',  status: 'Saved',     lastUpdated: '03 February 2025' },
  { id: '21', name: 'Remediation Progress Report',                            type: 'REPORT',    template: 'Month over Month',    visibility: 'Public',  status: 'Scheduled', recipients: 6, lastUpdated: '26 January 2025', hasCalendar: true },
  { id: '22', name: 'Security Posture Overview',                              type: 'DASHBOARD', template: 'Executive Summary',   visibility: 'Private', status: 'Saved',     lastUpdated: '18 January 2025' },
  { id: '23', name: 'Weekly Vulnerability Digest',                            type: 'REPORT',    template: 'Executive Summary',   visibility: 'Private', status: 'Scheduled', recipients: 2, lastUpdated: '11 January 2025', hasCalendar: true },
  { id: '24', name: 'Executive Board Summary',                                type: 'DASHBOARD', template: 'Executive Summary',   visibility: 'Public',  status: 'Saved',     lastUpdated: '04 January 2025' },
]

// ── Icons ─────────────────────────────────────────────────────────
const IcLock = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)

const IcGlobe = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
)

// ── Avatar group ──────────────────────────────────────────────────
const INITIALS = ['AB', 'CD', 'EF']

// SAVED_ROWS only ever stored a recipient *count* (enough for the table's
// avatar chips) with no backing emails — so reopening Manage Schedule on an
// already-scheduled row had nothing to prefill the "To:" field with. Mocks
// up the same a@mail.com/b@mail.com pattern already shown as the field's
// placeholder, matching the row's existing recipient count.
const mockRecipientEmails = (count) =>
  Array.from({ length: count }, (_, i) => `${String.fromCharCode(97 + i)}@mail.com`).join(', ')

function AvatarGroup({ count }) {
  const shown = Math.min(count, 3)
  const extra = count > 3 ? count - 3 : 0
  return (
    <div className="lib-avatar-group">
      {Array.from({ length: shown }).map((_, i) => (
        <div key={i} className="lib-avatar" data-idx={String(i)}>
          {INITIALS[i]}
        </div>
      ))}
      {extra > 0 && (
        <div className="lib-avatar lib-avatar-over">+{extra}</div>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────
function SavedPage() {
  const {
    onNav,
    savedFilter, setSavedFilter,
    savedVisibility, setSavedVisibility,
    savedSearch, setSavedSearch,
    deleteTarget, openDeleteModal, closeDeleteModal,
    savedReports,
    savedDashboards,
    setEditDashboardSeed,
  } = useWorkspace()
  const { addDownload } = useDownloads()
  const { showToast } = useToast()

  const handleEdit = (row) => {
    if (row.type === 'REPORT') { onNav('workspace/report/executive-summary'); return }
    setEditDashboardSeed(row)
    onNav(`workspace/dashboard/edit-${row.id}`)
  }

  const [deletedIds, setDeletedIds] = useState(new Set())
  const [clonedRows, setClonedRows] = useState([])
  const [scheduleOverrides, setScheduleOverrides] = useState({})
  const [scheduleTarget, setScheduleTarget] = useState(null)
  const [scheduleRecipients, setScheduleRecipients] = useState('')
  const [scheduleSendCopy, setScheduleSendCopy] = useState(true)
  const [stopScheduleConfirmOpen, setStopScheduleConfirmOpen] = useState(false)

  const handleDuplicate = (row) => {
    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
    const copyName = `${row.name} (Copy)`
    setClonedRows(prev => [{ ...row, id: `d-${Date.now()}`, name: copyName, isNew: true, lastUpdated: today }, ...prev])
    showToast({ type: 'success', msg: `Duplicated as "${copyName}".` })
  }

  // clonedRows/savedDashboards/savedReports are listed first so a freshly
  // saved edit (same id as a SAVED_ROWS mock entry) replaces it instead of
  // appearing as a duplicate row.
  const seenIds = new Set()
  const allRows = [...clonedRows, ...savedDashboards, ...savedReports, ...SAVED_ROWS]
    .filter(row => seenIds.has(row.id) ? false : (seenIds.add(row.id), true))
    .filter(row => !deletedIds.has(row.id))
    .map(row => scheduleOverrides[row.id] ? { ...row, ...scheduleOverrides[row.id] } : row)

  const openScheduleModal = (row) => {
    setScheduleTarget(row)
    setScheduleRecipients(row.recipientEmails || (row.recipients ? mockRecipientEmails(row.recipients) : ''))
    setScheduleSendCopy(true)
  }
  const handleSaveSchedule = () => {
    const emails = scheduleRecipients.split(',').map(s => s.trim()).filter(Boolean)
    setScheduleOverrides(prev => ({ ...prev, [scheduleTarget.id]: { recipients: emails.length, recipientEmails: emails.join(', '), hasCalendar: true, status: 'Scheduled' } }))
    showToast({ type: 'success', msg: `Schedule updated for "${scheduleTarget.name}".` })
    setScheduleTarget(null)
  }
  const handleStopSchedule = () => {
    setScheduleOverrides(prev => ({ ...prev, [scheduleTarget.id]: { recipients: undefined, recipientEmails: undefined, hasCalendar: false, status: 'Saved' } }))
    showToast({ type: 'success', msg: `Schedule stopped for "${scheduleTarget.name}".` })
    setStopScheduleConfirmOpen(false)
    setScheduleTarget(null)
  }

  const [page, setPage]               = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const handleConfirmDelete = () => {
    if (!deleteTarget) return
    setDeletedIds(prev => new Set(prev).add(deleteTarget.id))
    showToast({ type: 'success', msg: `"${deleteTarget.name}" has been deleted.` })
    closeDeleteModal()
  }

  const filtered = allRows.filter(row => {
    const matchType   = savedFilter     === 'all' || (savedFilter     === 'dashboards' && row.type       === 'DASHBOARD') || (savedFilter     === 'reports' && row.type       === 'REPORT')
    const matchVis    = savedVisibility === 'all' || (savedVisibility === 'private'    && row.visibility === 'Private')   || (savedVisibility === 'public'  && row.visibility === 'Public')
    const matchSearch = savedSearch === '' || row.name.toLowerCase().includes(savedSearch.toLowerCase())
    return matchType && matchVis && matchSearch
  })

  const start       = (page - 1) * rowsPerPage
  const visibleRows = filtered.slice(start, start + rowsPerPage)

  return (
    <div className="lib-shell">

      <div className="lib-card">

        {/* Tab bar */}
        <div className="lib-tabbar">
          <div className="lib-tabbar-left">
            <button className="ds-tab active has-icon">
              <SavedIcon size={14} />
              Saved
            </button>
            <button className="ds-tab has-icon" onClick={() => onNav('workspace/library')}>
              <LibraryIcon size={14} />
              Templates
            </button>
          </div>
          <div className="lib-tabbar-right">
            <DSPillSearch value={savedSearch} onChange={setSavedSearch} placeholder="Search Saved" width={200} />
            <button className="lib-action-btn">
              <img src="assets/icons/new-report.svg" width={13} height={13} alt="" />
              New Report
            </button>
            <button className="lib-action-btn" onClick={() => onNav('workspace/dashboard/new')}>
              <img src="assets/icons/template-add.svg" width={13} height={13} alt="" />
              New Dashboard
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="lib-content">

          {/* Sub-filter bar */}
          <div className="lib-toolbar">
            <div className="lib-pills">
              <button className={`lib-pill${savedFilter === 'all'        ? ' active' : ''}`} onClick={() => setSavedFilter('all')}>All</button>
              <button className={`lib-pill${savedFilter === 'dashboards' ? ' active' : ''}`} onClick={() => setSavedFilter('dashboards')}>Dashboards</button>
              <button className={`lib-pill${savedFilter === 'reports'    ? ' active' : ''}`} onClick={() => setSavedFilter('reports')}>Reports</button>
            </div>
            <div className="lib-pills">
              <button className={`lib-vis-pill${savedVisibility === 'all'     ? ' active' : ''}`} onClick={() => setSavedVisibility('all')}>All</button>
              <button className={`lib-vis-pill${savedVisibility === 'private' ? ' active' : ''}`} onClick={() => setSavedVisibility('private')}>Private</button>
              <button className={`lib-vis-pill${savedVisibility === 'public'  ? ' active' : ''}`} onClick={() => setSavedVisibility('public')}>Public</button>
            </div>
          </div>

          {/* Table */}
          <div className="lib-tbl-wrap">
            <div className="ds-table-wrap">
              <table className="ds-table sz-sm">
                <thead>
                  <tr>
                    {['Name', 'Type', 'Template', 'Visibility', 'Status', 'Scheduled Recipients', 'Last Updated', 'Actions'].map((h, i) => (
                      <th key={h} className="ds-th" style={i === 7 ? { width: 120 } : {}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.length > 0 ? visibleRows.map(row => (
                    <tr key={row.id}>
                      {/* Name */}
                      <td className="ds-td">
                        <div className="lib-name-cell">
                          <span className="lib-td-name">{row.name}</span>
                          {row.isNew && <span className="lib-new-badge">New</span>}
                        </div>
                      </td>

                      {/* Type */}
                      <td className="ds-td">
                        <span className={`lib-type-badge${row.type === 'DASHBOARD' ? ' lib-type-badge--dash' : ' lib-type-badge--rep'}`}>
                          {row.type}
                        </span>
                      </td>

                      {/* Template */}
                      <td className="ds-td lib-td-muted">{row.template}</td>

                      {/* Visibility */}
                      <td className="ds-td">
                        <span className="lib-vis-cell">
                          {row.visibility === 'Private' ? <IcLock /> : <IcGlobe />}
                          {row.visibility}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="ds-td">
                        {row.status === 'Scheduled'
                          ? <span className="ds-badge success dot">{row.status}</span>
                          : <span className="ds-badge neutral">{row.status}</span>
                        }
                      </td>

                      {/* Recipients */}
                      <td className="ds-td">
                        {row.recipients
                          ? <AvatarGroup count={row.recipients} />
                          : <span className="lib-td-muted">—</span>
                        }
                      </td>

                      {/* Last updated */}
                      <td className="ds-td lib-td-muted-nowrap">{row.lastUpdated}</td>

                      {/* Actions */}
                      <td className="ds-td">
                        <div className="row-actions">
                          <button className="ds-icon-btn" title="View" onClick={() => onNav(row.type === 'REPORT' ? 'workspace/report-preview/executive-summary' : `workspace/dashboard/${row.id}`)}>
                            <Ic size={14} path={<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>} />
                          </button>
                          <button className="ds-icon-btn" title="Edit" onClick={() => handleEdit(row)}>
                            <Ic size={14} path={<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>} />
                          </button>
                          <button
                            className="ds-icon-btn"
                            title="Download"
                            onClick={(e) => addDownload(`${row.name}.${row.type === 'REPORT' ? 'pdf' : 'csv'}`, e.currentTarget)}
                          >
                            <Ic size={14} path={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>} />
                          </button>
                          {row.hasCalendar && (
                            <button className="ds-icon-btn" title="Schedule" onClick={() => openScheduleModal(row)}>
                              <Ic size={14} path={<><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>} />
                            </button>
                          )}
                          <button
                            className="ds-icon-btn"
                            title="Duplicate"
                            onClick={() => handleDuplicate(row)}
                          >
                            <Ic size={14} path={<><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>} />
                          </button>
                          <button
                            className="ds-icon-btn lib-td-delete"
                            title="Delete"
                            onClick={() => openDeleteModal(row.id, row.name)}
                          >
                            <Ic size={14} path={<><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></>} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={8} className="lib-no-results">No results found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <TablePagination
              total={filtered.length}
              page={page}
              rowsPerPage={rowsPerPage}
              onPageChange={setPage}
              onRowsPerPageChange={n => { setRowsPerPage(n); setPage(1) }}
            />
          </div>

        </div>
      </div>

      {deleteTarget && (
        <div className="ds-modal-overlay">
          <div className="ds-modal" role="dialog" aria-modal="true">
            <div className="ds-modal-header">
              <span className="ds-modal-title lib-delete-modal-title">
                <IcTrashDelete />
                Delete {(allRows.find(r => r.id === deleteTarget.id)?.type === 'REPORT') ? 'Report' : 'Dashboard'}
              </span>
              <button className="ds-modal-close" onClick={closeDeleteModal} aria-label="Close">×</button>
            </div>
            <div className="ds-modal-body">
              <span>Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This action cannot be undone.</span>
            </div>
            <div className="ds-modal-footer">
              <button className="ds-btn sz-md t-outline" onClick={closeDeleteModal}>Cancel</button>
              <button className="ds-btn sz-md t-danger" onClick={handleConfirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {scheduleTarget && !stopScheduleConfirmOpen && (
        <div className="ds-modal-overlay" onClick={() => setScheduleTarget(null)}>
          <div className="ds-modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="ds-modal-header">
              <span className="ds-modal-title dc-schedule-modal-title">
                <IcCalendarSchedule />
                Manage Schedule
              </span>
              <button className="ds-modal-close" onClick={() => setScheduleTarget(null)} aria-label="Close">×</button>
            </div>
            <div className="ds-modal-body">
              <div className="dc-modal-body-stack">
                <div className="dc-modal-schedule-status">
                  <span>A schedule is currently active for "{scheduleTarget.name}".</span>
                  <button className="ds-btn sz-md t-outline" onClick={() => setStopScheduleConfirmOpen(true)}>Stop Schedule</button>
                </div>
                <div className="dc-modal-field">
                  <div className="dc-field-label">Recipients</div>
                  <div className="dc-modal-to-field">
                    <span className="dc-modal-to-field-prefix">To:</span>
                    <input value={scheduleRecipients} onChange={e => setScheduleRecipients(e.target.value)} placeholder="a@mail.com, b@mail.com" />
                  </div>
                </div>
                <div className="dc-modal-checkbox-row">
                  <input type="checkbox" checked={scheduleSendCopy} onChange={e => setScheduleSendCopy(e.target.checked)} className="dc-gf-checkbox" id="saved-schedule-send-copy" />
                  <label htmlFor="saved-schedule-send-copy">Send me a copy</label>
                </div>
              </div>
            </div>
            <div className="ds-modal-footer">
              <button className="ds-btn sz-md t-outline" onClick={() => setScheduleTarget(null)}>Cancel</button>
              <button className="ds-btn sz-md t-primary" disabled={!scheduleRecipients.trim()} onClick={handleSaveSchedule}>Save changes</button>
            </div>
          </div>
        </div>
      )}

      {stopScheduleConfirmOpen && (
        <div className="ds-modal-overlay">
          <div className="ds-modal" role="dialog" aria-modal="true">
            <div className="ds-modal-header">
              <span className="ds-modal-title danger">Stop schedule</span>
              <button className="ds-modal-close" onClick={() => setStopScheduleConfirmOpen(false)} aria-label="Close">×</button>
            </div>
            <div className="ds-modal-body">
              <span>Stop the recurring schedule for <strong>{scheduleTarget?.name}</strong>? Recipients will no longer receive automatic updates.</span>
            </div>
            <div className="ds-modal-footer">
              <button className="ds-btn sz-md t-outline" onClick={() => setStopScheduleConfirmOpen(false)}>Cancel</button>
              <button className="ds-btn sz-md t-danger" onClick={handleStopSchedule}>Stop Schedule</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SavedPage
