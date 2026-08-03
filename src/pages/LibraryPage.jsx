import React, { useState, useRef, useEffect } from 'react'
import { DSPillSearch, LibraryIcon, SavedIcon, useWorkspace } from '../context/WorkspaceCtx.jsx'

// Workspace › Library tab

// ── Icons ─────────────────────────────────────────────────────────
const DashboardIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="var(--pai-teal)" strokeLinecap="round">
    <path d="M2.49854 5.79059V3.48059C2.49854 3.20445 2.72239 2.98059 2.99854 2.98059H5.30615C5.58229 2.98059 5.80615 3.20445 5.80615 3.48059V5.79059C5.80615 6.06673 5.58229 6.29059 5.30615 6.29059H2.99854C2.72239 6.29059 2.49854 6.06673 2.49854 5.79059Z"/>
    <path d="M10.1938 11.0584V8.74841C10.1938 8.47227 10.4177 8.24841 10.6938 8.24841H13.0015C13.2776 8.24841 13.5015 8.47227 13.5015 8.74841V11.0584C13.5015 11.3346 13.2776 11.5584 13.0015 11.5584H10.6938C10.4177 11.5584 10.1938 11.3346 10.1938 11.0584Z"/>
    <path d="M7.78076 5.79059V3.48059C7.78076 3.20445 8.00462 2.98059 8.28076 2.98059H13.0015C13.2776 2.98059 13.5015 3.20445 13.5015 3.48059V5.79059C13.5015 6.06673 13.2776 6.29059 13.0015 6.29059H8.28076C8.00462 6.29059 7.78076 6.06673 7.78076 5.79059Z"/>
    <path d="M2.49854 12.5194V8.74841C2.49854 8.47227 2.72239 8.24841 2.99854 8.24841H7.71924C7.99538 8.24841 8.21924 8.47227 8.21924 8.74841V12.5194C8.21924 12.7956 7.99538 13.0194 7.71924 13.0194H2.99854C2.72239 13.0194 2.49854 12.7956 2.49854 12.5194Z"/>
  </svg>
)

// ── Sub-components ─────────────────────────────────────────────────
function QuickCard({ title, desc, tag, actionLabel, action }) {
  const isReport = tag === 'REPORT'
  return (
    <div className="lib-quick-card">
      <div className="lib-quick-body">
        <div className={`lib-quick-icon${isReport ? ' lib-quick-icon--report' : ''}`}>
          {isReport
            ? <img src="assets/icons/report.svg" width={22} height={22} alt="" />
            : <DashboardIcon size={18} />
          }
        </div>
        <div className="lib-quick-title">{title}</div>
        <div className="lib-quick-desc">{desc}</div>
      </div>
      <div className="lib-quick-foot">
        <span className={`lib-quick-badge${isReport ? ' lib-quick-badge--report' : ' lib-quick-badge--dash'}`}>
          {tag}
        </span>
        <button className="ds-btn sz-sm t-outline" onClick={action}>{actionLabel}</button>
      </div>
    </div>
  )
}

// ── Constants ──────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { label: 'Name: A-Z',      value: 'A-Z'    },
  { label: 'Name: Z-A',      value: 'Z-A'    },
  { label: 'Recently Added', value: 'recent' },
  { label: 'Oldest First',   value: 'oldest' },
]

// ── Main component ─────────────────────────────────────────────────
function LibraryPage() {
  const {
    onNav, libraryFilter, setLibraryFilter,
    librarySearch, setLibrarySearch,
  } = useWorkspace()

  const [sortValue, setSortValue] = useState('A-Z')
  const [sortOpen,  setSortOpen]  = useState(false)
  const sortRef  = useRef(null)
  const sortLabel = SORT_OPTIONS.find(o => o.value === sortValue)?.label.replace('Name: ', '') ?? 'A-Z'

  // Close sort dropdown on outside click
  useEffect(() => {
    if (!sortOpen) return
    const handler = (e) => { if (sortRef.current && !sortRef.current.contains(e.target)) setSortOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [sortOpen])

  const allQuickCards = [
    { title: 'Discover Dashboard',                             desc: 'Explore security metrics and insights.',                                                                                          tag: 'DASHBOARD', actionLabel: 'Use Template', action: () => onNav('workspace/dashboard/discover') },
    { title: 'CISO Dashboard',                                 desc: 'Executive security overview.',                                                                                                    tag: 'DASHBOARD', actionLabel: 'Use Template', action: () => onNav('workspace/dashboard/new') },
    { title: 'Client Subsidiary',                              desc: 'Overall security health status.',                                                                                                 tag: 'DASHBOARD', actionLabel: 'Use Template', action: () => onNav('workspace/dashboard/new') },
    { title: 'Executive Summary',                              desc: 'Summary of detected vulnerabilities and their severity levels.',                                                                  tag: 'REPORT',    actionLabel: 'Use Template',  action: () => onNav('workspace/report/executive-summary') },
    { title: 'Month over Month Comparison of Vulnerabilities', desc: 'Month-over-month analysis of vulnerability trends and severity changes.',                                                        tag: 'REPORT',    actionLabel: 'Use Template',  action: () => onNav('workspace/report/month-over-month') },
    { title: 'Detailed Report on Vulnerabilities',             desc: 'Comprehensive vulnerability inventory with detailed findings, statuses and vulnerability trends.',                               tag: 'REPORT',    actionLabel: 'Use Template',  action: () => onNav('workspace/report/vulnerabilities') },
    { title: 'Device Attack Surface',                          desc: 'Consolidated device posture overview including health, vulnerability load, compliance state, and security activity.',            tag: 'DASHBOARD', actionLabel: 'Use Template', action: () => onNav('workspace/dashboard/new') },
    { title: 'Risk Mitigation Queries',                        desc: 'Targeted views that surface remediation-ready items aligned with defined risk-reduction priorities.',                           tag: 'DASHBOARD', actionLabel: 'Use Template', action: () => onNav('workspace/dashboard/new') },
    { title: 'Tracked Security Gaps',                          desc: 'Monitored list of unresolved weaknesses showing progress, ownership, and aging of outstanding security issues.',                tag: 'DASHBOARD', actionLabel: 'Use Template', action: () => onNav('workspace/dashboard/new') },
  ]

  const filteredCards = allQuickCards.filter(c => {
    const matchesFilter = libraryFilter === 'all'
      || (libraryFilter === 'dashboards' && c.tag === 'DASHBOARD')
      || (libraryFilter === 'reports'    && c.tag === 'REPORT')
    const matchesSearch = librarySearch === '' || c.title.toLowerCase().includes(librarySearch.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const sortedCards = [...filteredCards].sort((a, b) => {
    if (sortValue === 'A-Z') return a.title.localeCompare(b.title)
    if (sortValue === 'Z-A') return b.title.localeCompare(a.title)
    return 0
  })

  return (
    <div className="lib-shell">

      <div className="lib-card">
        {/* ── Tab bar ───────────────────────────────────────────── */}
        <div className="lib-tabbar">
          <div className="lib-tabbar-left">
            <button className="ds-tab has-icon" onClick={() => onNav('workspace/saved')}>
              <SavedIcon size={14} />
              Saved
            </button>
            <button className="ds-tab active has-icon">
              <LibraryIcon size={14} />
              Templates
            </button>
          </div>
          <div className="lib-tabbar-right">
            <DSPillSearch value={librarySearch} onChange={setLibrarySearch} placeholder="Search Templates" width={200} />
            <button className="lib-action-btn" onClick={() => {}}>
              <img src="assets/icons/new-report.svg" width={13} height={13} alt="" />
              New Report
            </button>
            <button className="lib-action-btn" onClick={() => onNav('workspace/dashboard/new')}>
              <img src="assets/icons/template-add.svg" width={13} height={13} alt="" />
              New Dashboard
            </button>
          </div>
        </div>

        {/* ── Scrollable content ────────────────────────────────── */}
        <div className="lib-content">

          {/* Templates & Dashboards */}
          <div>
            <div className="lib-toolbar">
              <div className="lib-pills">
                <button className={`lib-pill${libraryFilter === 'all'        ? ' active' : ''}`} onClick={() => setLibraryFilter('all')}>All</button>
                <button className={`lib-pill${libraryFilter === 'dashboards' ? ' active' : ''}`} onClick={() => setLibraryFilter('dashboards')}>Dashboards</button>
                <button className={`lib-pill${libraryFilter === 'reports'    ? ' active' : ''}`} onClick={() => setLibraryFilter('reports')}>Reports</button>
              </div>

              {/* Sort dropdown */}
              <div className="lib-sort-wrap" ref={sortRef}>
                <button className="lib-sort-btn" onClick={() => setSortOpen(o => !o)}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18M7 12h10M11 18h2"/>
                  </svg>
                  Sort by :&nbsp;<span className="lib-sort-val">{sortLabel}</span>
                </button>
                {sortOpen && (
                  <div className="lib-sort-menu">
                    {SORT_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        className={`lib-sort-opt${sortValue === opt.value ? ' active' : ''}`}
                        onClick={() => { setSortValue(opt.value); setSortOpen(false) }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {sortedCards.length > 0 ? (
              <div className="lib-quick-grid">
                {sortedCards.map((card, i) => <QuickCard key={i} {...card} />)}
              </div>
            ) : (
              <div className="lib-empty">No results found.</div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

export default LibraryPage
