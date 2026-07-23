import React, { useState } from 'react'
import { Ic } from '../ui.jsx'
import { DSPillSearch, LibraryIcon, SavedIcon, LibraryImportBar, useWorkspace } from '../context/WorkspaceCtx.jsx'
import TablePagination from '../components/TablePagination.jsx'
import '../styles/admin.css'
import '../styles/navigator.css'
import '../styles/library.css'

const IcWarningTriangle = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)

// Workspace › Saved tab

const SAVED_ROWS = [
  { id: '1', name: 'CISO Dashboard',                              isNew: true,  type: 'DASHBOARD', template: 'Executive Summary',  visibility: 'Private', status: 'Saved',     lastUpdated: '11 August 2025' },
  { id: '2', name: 'Detailed Report on Software Vulnerabilities',               type: 'REPORT',    template: 'Executive Summary',  visibility: 'Public',  status: 'Scheduled', recipients: 2,  lastUpdated: '21 July 2025',   hasCalendar: true },
  { id: '3', name: 'Compliance Report',                                         type: 'REPORT',    template: 'Compliance',         visibility: 'Public',  status: 'Scheduled', recipients: 4,  lastUpdated: '03 June 2025',   hasCalendar: true },
  { id: '4', name: 'Critical Report - Low Filtered',                            type: 'DASHBOARD', template: 'Critical Findings',  visibility: 'Private', status: 'Saved',     lastUpdated: '03 June 2025' },
  { id: '5', name: 'Critical Report - High Filtered',                           type: 'DASHBOARD', template: 'Critical Findings',  visibility: 'Private', status: 'Saved',     lastUpdated: '23 May 2025' },
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
  } = useWorkspace()

  const [deletedIds, setDeletedIds] = useState(new Set())
  const [toast, setToast] = useState(null)

  const allRows = [...savedReports, ...SAVED_ROWS].filter(row => !deletedIds.has(row.id))

  const [page, setPage]               = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const handleConfirmDelete = () => {
    if (!deleteTarget) return
    setDeletedIds(prev => new Set(prev).add(deleteTarget.id))
    setToast(`"${deleteTarget.name}" has been deleted.`)
    closeDeleteModal()
    setTimeout(() => setToast(null), 3000)
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

      <LibraryImportBar />

      <div className="lib-card">

        {/* Tab bar */}
        <div className="lib-tabbar">
          <div className="lib-tabbar-left">
            <button className="ds-tab has-icon" onClick={() => onNav('workspace/library')}>
              <LibraryIcon size={14} />
              Library
            </button>
            <button className="ds-tab active has-icon">
              <SavedIcon size={14} />
              Saved
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
                          <button className="ds-icon-btn" title="Edit" onClick={() => onNav(row.type === 'REPORT' ? 'workspace/report/executive-summary' : 'workspace/dashboard/new')}>
                            <Ic size={14} path={<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>} />
                          </button>
                          <button className="ds-icon-btn" title="Download">
                            <Ic size={14} path={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>} />
                          </button>
                          {row.hasCalendar && (
                            <button className="ds-icon-btn" title="Schedule">
                              <Ic size={14} path={<><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>} />
                            </button>
                          )}
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
                <IcWarningTriangle />
                Delete {(allRows.find(r => r.id === deleteTarget.id)?.type === 'REPORT') ? 'Report' : 'Dashboard'}
              </span>
              <button className="ds-modal-close" onClick={closeDeleteModal} aria-label="Close">×</button>
            </div>
            <div className="ds-modal-body">
              Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This action cannot be undone.
            </div>
            <div className="ds-modal-footer">
              <button className="ds-btn sz-md t-outline" onClick={closeDeleteModal}>Cancel</button>
              <button className="ds-btn sz-md t-danger" onClick={handleConfirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="ds-toast-container">
          <div className="ds-toast success">
            <span>{toast}</span>
            <button className="ds-toast-dismiss" onClick={() => setToast(null)}>×</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default SavedPage
