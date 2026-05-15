import React, { useState } from 'react'
import { Ic } from '../ui.jsx'
import { DSPillSearch, LibraryIcon, SavedIcon, useWorkspace } from '../context/WorkspaceCtx.jsx'
import TablePagination from '../components/TablePagination.jsx'

// Workspace › Saved tab

const SAVED_ROWS = [
  { id: '1', name: 'CISO Dashboard',                              isNew: true,  type: 'DASHBOARD', template: 'Executive Summary',  visibility: 'Private', status: 'Saved',     lastUpdated: '11 August 2025' },
  { id: '2', name: 'Detailed Report on Software Vulnerabilities',               type: 'REPORT',    template: 'Executive Summary',  visibility: 'Public',  status: 'Scheduled', recipients: 2,  lastUpdated: '21 July 2025',   hasCalendar: true },
  { id: '3', name: 'Compliance Report',                                         type: 'REPORT',    template: 'Compliance',         visibility: 'Public',  status: 'Scheduled', recipients: 4,  lastUpdated: '03 June 2025',   hasCalendar: true },
  { id: '4', name: 'Critical Report - Low Filtered',                            type: 'DASHBOARD', template: 'Critical Findings',  visibility: 'Private', status: 'Saved',     lastUpdated: '03 June 2025' },
  { id: '5', name: 'Critical Report - High Filtered',                           type: 'DASHBOARD', template: 'Critical Findings',  visibility: 'Private', status: 'Saved',     lastUpdated: '23 May 2025' },
];

function AvatarGroup({ count }) {
  const shown = Math.min(count, 3);
  const extra = count > 3 ? count - 3 : 0;
  const colors = ['var(--pai-indigo)', '#10b981', '#f97316'];
  const initials = ['AB', 'CD', 'EF'];
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {Array.from({ length: shown }).map((_, i) => (
        <div key={i} style={{
          width: 24, height: 24, borderRadius: '50%',
          background: colors[i % colors.length],
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 9, fontWeight: 700, color: 'var(--card-bg)',
          border: '2px solid var(--card-bg)', marginLeft: i > 0 ? -6 : 0, zIndex: shown - i,
        }}>{initials[i]}</div>
      ))}
      {extra > 0 && (
        <div style={{
          width: 24, height: 24, borderRadius: '50%',
          background: 'var(--shell-raised)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 9, fontWeight: 700, color: 'var(--shell-text-muted)',
          border: '2px solid var(--card-bg)', marginLeft: -6,
        }}>+{extra}</div>
      )}
    </div>
  );
}

// Inline SVG icons
const IcLock = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const IcGlobe = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);

function SavedPage() {
  const { onNav, savedFilter, setSavedFilter, savedVisibility, setSavedVisibility, savedSearch, setSavedSearch, openDeleteModal } = useWorkspace();
  const [page, setPage]               = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const filtered = SAVED_ROWS.filter(row => {
    const matchType = savedFilter === 'all' || (savedFilter === 'dashboards' && row.type === 'DASHBOARD') || (savedFilter === 'reports' && row.type === 'REPORT');
    const matchVis  = savedVisibility === 'all' || (savedVisibility === 'private' && row.visibility === 'Private') || (savedVisibility === 'public' && row.visibility === 'Public');
    const matchSearch = savedSearch === '' || row.name.toLowerCase().includes(savedSearch.toLowerCase());
    return matchType && matchVis && matchSearch;
  });
  const start       = (page - 1) * rowsPerPage;
  const visibleRows = filtered.slice(start, start + rowsPerPage);

  const pillStyle = (active) => ({
    padding: '4px 12px', borderRadius: 44, fontSize: 12,
    fontWeight: active ? 600 : 400, cursor: 'pointer',
    border: active ? '1px solid var(--pai-indigo-light)' : '1px solid var(--ctrl-border)',
    background: active ? 'var(--pai-indigo)' : 'transparent',
    color: active ? 'var(--card-bg)' : 'var(--shell-text-muted)',
    transition: 'background 150ms, color 150ms', fontFamily: 'inherit',
  });

  const visPillStyle = (active) => ({
    padding: '4px 12px', borderRadius: 44, fontSize: 11,
    fontWeight: active ? 600 : 400, cursor: 'pointer',
    border: `1px solid ${active ? 'var(--pai-indigo)' : 'var(--shell-border)'}`,
    background: active ? 'rgba(99,96,216,0.08)' : 'transparent',
    color: active ? 'var(--pai-indigo)' : 'var(--shell-text-muted)',
    transition: 'all 150ms', fontFamily: 'inherit',
  });

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: 16, background: 'var(--ctrl-bg)' }}>
    <div style={{
      background: 'var(--card-bg)',
      border: '1px solid var(--shell-border)',
      borderRadius: 12,
      display: 'flex', flexDirection: 'column',
      minHeight: '100%', overflow: 'hidden',
    }}>
      {/* Tab bar */}
      <div style={{
        background: 'var(--card-bg)',
        padding: '16px 16px 0', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', flexShrink: 0,
      }}>
        <div style={{ display: 'flex' }}>
          <button className="ds-tab" style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => onNav('workspace/library')}>
            <LibraryIcon size={14} />
            Library
          </button>
          <button className="ds-tab active" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <SavedIcon size={14} />
            Saved
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <DSPillSearch value={savedSearch} onChange={setSavedSearch} placeholder="Search Saved" width={200} />
          <button style={{
            height: 28, padding: '0 12px', gap: 6,
            background: 'rgba(99,96,216,0.06)', border: '1px solid rgba(99,96,216,0.35)',
            borderRadius: 44, color: 'var(--pai-indigo)',
            fontSize: 12, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center',
          }}>
            <img src="/assets/icons/new-report.svg" width={13} height={13} alt="" />
            New Template
          </button>
          <button onClick={() => onNav('workspace/dashboard/new')} style={{
            height: 28, padding: '0 12px', gap: 6,
            background: 'rgba(99,96,216,0.06)', border: '1px solid rgba(99,96,216,0.35)',
            borderRadius: 44, color: 'var(--pai-indigo)',
            fontSize: 12, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center',
          }}>
            <img src="/assets/icons/template-add.svg" width={13} height={13} alt="" />
            New Dashboard
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Sub-filter bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button style={pillStyle(savedFilter === 'all')} onClick={() => setSavedFilter('all')}>All</button>
            <button style={pillStyle(savedFilter === 'dashboards')} onClick={() => setSavedFilter('dashboards')}>Dashboards</button>
            <button style={pillStyle(savedFilter === 'reports')} onClick={() => setSavedFilter('reports')}>Reports</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button style={visPillStyle(savedVisibility === 'all')} onClick={() => setSavedVisibility('all')}>All</button>
            <button style={visPillStyle(savedVisibility === 'private')} onClick={() => setSavedVisibility('private')}>Private</button>
            <button style={visPillStyle(savedVisibility === 'public')} onClick={() => setSavedVisibility('public')}>Public</button>
          </div>
        </div>

        {/* Table */}
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 4, overflow: 'hidden' }}>
          <div className="ds-table-wrap">
            <table className="ds-table" style={{ fontSize: 12 }}>
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
                    <td className="ds-td">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontWeight: 500, color: 'var(--shell-text)' }}>{row.name}</span>
                        {row.isNew && (
                          <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 44, background: 'rgba(99,96,216,0.12)', color: 'var(--pai-indigo)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>New</span>
                        )}
                      </div>
                    </td>
                    <td className="ds-td">
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: row.type === 'DASHBOARD' ? 'rgba(99,96,216,0.10)' : 'rgba(249,115,22,0.10)', color: row.type === 'DASHBOARD' ? 'var(--pai-indigo)' : '#f97316', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {row.type}
                      </span>
                    </td>
                    <td className="ds-td" style={{ color: 'var(--shell-text-muted)' }}>{row.template}</td>
                    <td className="ds-td">
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--shell-text-muted)' }}>
                        {row.visibility === 'Private' ? <IcLock /> : <IcGlobe />}
                        {row.visibility}
                      </span>
                    </td>
                    <td className="ds-td">
                      {row.status === 'Scheduled'
                        ? <span className="ds-badge success dot">{row.status}</span>
                        : <span className="ds-badge neutral">{row.status}</span>
                      }
                    </td>
                    <td className="ds-td">
                      {row.recipients ? <AvatarGroup count={row.recipients} /> : <span style={{ color: 'var(--shell-text-muted)' }}>—</span>}
                    </td>
                    <td className="ds-td" style={{ color: 'var(--shell-text-muted)', whiteSpace: 'nowrap' }}>{row.lastUpdated}</td>
                    <td className="ds-td">
                      <div className="row-actions">
                        <button className="ds-icon-btn" title="View" onClick={() => onNav(`workspace/dashboard/${row.id}`)}>
                          <Ic size={14} path={<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>} />
                        </button>
                        <button className="ds-icon-btn" title="Edit" onClick={() => onNav('workspace/dashboard/new')}>
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
                        <button className="ds-icon-btn" title="Delete" style={{ color: 'var(--pai-crit-fg)' }} onClick={() => openDeleteModal(row.id, row.name)}>
                          <Ic size={14} path={<><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></>} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: 'var(--shell-text-muted)' }}>
                      No results found.
                    </td>
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
            onRowsPerPageChange={n => { setRowsPerPage(n); setPage(1); }}
          />
        </div>
      </div>
    </div>
    </div>
  );
}

export default SavedPage;
