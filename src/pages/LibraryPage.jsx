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

const ZapIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--pai-fg1)" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
)

const SparkleIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3 L13.5 8.5 L19 10 L13.5 11.5 L12 17 L10.5 11.5 L5 10 L10.5 8.5 Z"/>
    <path d="M5 3 L5.75 5.25 L8 6 L5.75 6.75 L5 9 L4.25 6.75 L2 6 L4.25 5.25 Z" opacity="0.6"/>
    <path d="M19 15 L19.5 16.5 L21 17 L19.5 17.5 L19 19 L18.5 17.5 L17 17 L18.5 16.5 Z" opacity="0.6"/>
  </svg>
)

const CodeIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6"/>
    <polyline points="8 6 2 12 8 18"/>
  </svg>
)

const UploadIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
)

// ── Sub-components ─────────────────────────────────────────────────
function StartCard({ title, desc, cta, ctaType, action, iconType, highlighted }) {
  return (
    <div className={`lib-start-card${highlighted ? ' lib-start-card--hi' : ''}`}>
      <div className={`lib-start-icon${iconType === 'report' ? ' lib-start-icon--report' : ''}`}>
        {iconType === 'report'
          ? <img src="/assets/icons/report.svg" width={22} height={22} alt="" />
          : <DashboardIcon size={18} />
        }
      </div>
      <div className="lib-start-title">{title}</div>
      <div className="lib-start-desc">{desc}</div>
      <button
        className={`ds-btn sz-sm ${ctaType === 'primary' ? 't-primary' : 't-outline'} lib-start-card-cta`}
        onClick={action}
      >
        {cta}
      </button>
    </div>
  )
}

function QuickCard({ title, desc, tag, actionLabel, action }) {
  const isReport = tag === 'REPORT'
  return (
    <div className="lib-quick-card">
      <div className="lib-quick-body">
        <div className={`lib-quick-icon${isReport ? ' lib-quick-icon--report' : ''}`}>
          {isReport
            ? <img src="/assets/icons/report.svg" width={22} height={22} alt="" />
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
    setUploadedFile, setUploadSource,
  } = useWorkspace()

  const [sortValue, setSortValue] = useState('A-Z')
  const [sortOpen,  setSortOpen]  = useState(false)
  const sortRef  = useRef(null)
  const fileRef  = useRef(null)
  const sortLabel = SORT_OPTIONS.find(o => o.value === sortValue)?.label.replace('Name: ', '') ?? 'A-Z'

  // Close sort dropdown on outside click
  useEffect(() => {
    if (!sortOpen) return
    const handler = (e) => { if (sortRef.current && !sortRef.current.contains(e.target)) setSortOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [sortOpen])

  // Handle HTML file upload → navigate to configure-screen
  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadedFile(file)
    setUploadSource('html')
    onNav('workspace/configure-screen')
    e.target.value = ''   // reset so same file can be re-selected
  }

  const getStartedCards = [
    { title: 'Custom Dashboard',   desc: 'Build a personalized view',                 cta: 'Create New Dashboard', ctaType: 'primary', iconType: 'dashboard', highlighted: true,  action: () => onNav('workspace/dashboard/new') },
    { title: 'Report Template',    desc: 'Generate a formatted report template',      cta: 'Create New Template',  ctaType: 'primary', iconType: 'report',    highlighted: true,  action: () => {} },
    { title: 'Discover Dashboard', desc: 'Explore security metrics and insights',     cta: 'Edit Dashboard',       ctaType: 'outline', iconType: 'dashboard', highlighted: false, action: () => onNav('workspace/dashboard/discover') },
    { title: 'CISO Dashboard',     desc: 'Executive security overview',               cta: 'Edit Dashboard',       ctaType: 'outline', iconType: 'dashboard', highlighted: false, action: () => onNav('workspace/dashboard/new') },
    { title: 'Client Subsidiary',  desc: 'Overall security health status',            cta: 'Edit Dashboard',       ctaType: 'outline', iconType: 'dashboard', highlighted: false, action: () => onNav('workspace/dashboard/new') },
  ]

  const allQuickCards = [
    { title: 'Executive Summary',                              desc: 'Summary of detected vulnerabilities and their severity levels.',                                                                  tag: 'REPORT',    actionLabel: 'Edit Template',  action: () => onNav('workspace/report/executive-summary') },
    { title: 'Month over Month Comparison of Vulnerabilities', desc: 'Month-over-month analysis of vulnerability trends and severity changes.',                                                        tag: 'REPORT',    actionLabel: 'Edit Template',  action: () => {} },
    { title: 'Detailed Report on Vulnerabilities',             desc: 'Comprehensive vulnerability inventory with detailed findings, statuses and vulnerability trends.',                               tag: 'REPORT',    actionLabel: 'Edit Template',  action: () => {} },
    { title: 'Device Attack Surface',                          desc: 'Consolidated device posture overview including health, vulnerability load, compliance state, and security activity.',            tag: 'DASHBOARD', actionLabel: 'Edit Dashboard', action: () => onNav('workspace/dashboard/new') },
    { title: 'Risk Mitigation Queries',                        desc: 'Targeted views that surface remediation-ready items aligned with defined risk-reduction priorities.',                           tag: 'DASHBOARD', actionLabel: 'Edit Dashboard', action: () => onNav('workspace/dashboard/new') },
    { title: 'Tracked Security Gaps',                          desc: 'Monitored list of unresolved weaknesses showing progress, ownership, and aging of outstanding security issues.',                tag: 'DASHBOARD', actionLabel: 'Edit Dashboard', action: () => onNav('workspace/dashboard/new') },
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

        {/* ── Import banner ─────────────────────────────────────── */}
        <div className="lib-import">
          {/* Animated ambient layer */}
          <div className="lib-import-bg" aria-hidden="true">
            <div className="lib-import-blob-a" />
            <div className="lib-import-blob-b" />
            <div className="lib-import-blob-c" />
          </div>
          <div className="lib-import-shimmer" aria-hidden="true" />

          {/* Foreground content */}
          <div className="lib-import-content">
            <div className="lib-import-info">
              <div className="lib-import-icon">
                <SparkleIcon size={22} />
              </div>
              <div className="lib-import-text">
                <span className="lib-import-title">Import a Screen</span>
                <span className="lib-import-desc">
                  Bring any design to life. Upload an HTML file or connect a Claude Code design —
                  AI detects widgets and wires your data automatically.
                </span>
              </div>
            </div>

            <div className="lib-import-btns">
              <button
                className="lib-import-btn"
                onClick={() => { setUploadSource('design'); onNav('workspace/configure-screen') }}
              >
                <div className="lib-import-btn-row">
                  <span className="lib-import-btn-icon"><CodeIcon /></span>
                  <span className="lib-import-btn-label">Connect Design</span>
                </div>
                <span className="lib-import-btn-sub">Claude Code · Figma</span>
              </button>

              <button
                className="lib-import-btn lib-import-btn--primary"
                onClick={() => fileRef.current?.click()}
              >
                <div className="lib-import-btn-row">
                  <span className="lib-import-btn-icon"><UploadIcon /></span>
                  <span className="lib-import-btn-label">Upload HTML</span>
                </div>
                <span className="lib-import-btn-sub">.html · .htm files</span>
              </button>

              <input
                ref={fileRef}
                type="file"
                accept=".html,.htm"
                className="lib-file-input"
                onChange={handleFileChange}
              />
            </div>
          </div>
        </div>

      <div className="lib-card">
        {/* ── Tab bar ───────────────────────────────────────────── */}
        <div className="lib-tabbar">
          <div className="lib-tabbar-left">
            <button className="ds-tab active has-icon">
              <LibraryIcon size={14} />
              Library
            </button>
            <button className="ds-tab has-icon" onClick={() => onNav('workspace/saved')}>
              <SavedIcon size={14} />
              Saved
            </button>
          </div>
          <div className="lib-tabbar-right">
            <DSPillSearch value={librarySearch} onChange={setLibrarySearch} placeholder="Search Library" width={200} />
            <button className="lib-action-btn">
              <img src="/assets/icons/new-report.svg" width={13} height={13} alt="" />
              New Template
            </button>
            <button className="lib-action-btn" onClick={() => onNav('workspace/dashboard/new')}>
              <img src="/assets/icons/template-add.svg" width={13} height={13} alt="" />
              New Dashboard
            </button>
          </div>
        </div>

        {/* ── Scrollable content ────────────────────────────────── */}
        <div className="lib-content">

          {/* Get Started */}
          <div>
            <div className="lib-section-hdr">
              <img src="/assets/icons/get-started.svg" width={16} height={16} alt="" />
              <span className="lib-section-lbl">Get Started</span>
            </div>
            <div className="lib-start-row">
              {getStartedCards.map((card, i) => <StartCard key={i} {...card} />)}
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <div className="lib-section-hdr">
              <ZapIcon />
              <span className="lib-section-lbl">Quick Actions</span>
            </div>

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
