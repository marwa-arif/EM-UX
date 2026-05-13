// Workspace › Library tab

function StartCard({ title, desc, cta, ctaType, action, iconType, highlighted }) {
  const [hovered, setHovered] = React.useState(false);
  const isReport = iconType === 'report';
  const baseBorder = highlighted ? '#A2A1F7' : 'var(--card-border)';
  return (
    <div
      style={{
        flex: '1 1 0', minWidth: 0,
        background: 'var(--card-bg)',
        border: `1px solid ${baseBorder}`,
        borderRadius: 12, padding: '16px 12px',
        display: 'flex', flexDirection: 'column', gap: 8,
        boxShadow: hovered ? '0 4px 16px rgba(0,0,0,0.08)' : 'none',
        transition: 'box-shadow 150ms',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        width: 36, height: 36,
        background: isReport ? 'rgba(217,139,29,0.10)' : '#ECF8FD',
        borderRadius: 6,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        {isReport
          ? <img src="assets/icons/report.svg" width={22} height={22} alt="" />
          : <DashboardIcon size={18} />
        }
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--shell-text)', lineHeight: 1.3 }}>{title}</div>
      <div style={{ fontSize: 11, color: 'var(--shell-text-muted)', lineHeight: 1.5, flex: 1 }}>{desc}</div>
      <button className={`ds-btn sz-sm ${ctaType === 'primary' ? 't-primary' : 't-outline'}`} onClick={action} style={{ alignSelf: 'flex-start', marginTop: 4 }}>
        {cta}
      </button>
    </div>
  );
}

function QuickCard({ title, desc, tag, actionLabel, action }) {
  const [hovered, setHovered] = React.useState(false);
  const isReport = tag === 'REPORT';
  return (
    <div
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        borderRadius: 12,
        display: 'flex', flexDirection: 'column',
        transition: 'box-shadow 150ms',
        boxShadow: hovered ? '0 4px 16px rgba(0,0,0,0.08)' : 'none',
        overflow: 'hidden',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Card body */}
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 8,
          background: isReport ? 'rgba(217,139,29,0.10)' : '#ECF8FD',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          {isReport
            ? <img src="assets/icons/report.svg" width={22} height={22} alt="" />
            : <DashboardIcon size={18} />
          }
        </div>
        <div style={{ fontSize: 13, fontWeight: 400, color: 'var(--shell-text)', lineHeight: 1.4 }}>{title}</div>
        <div style={{ fontSize: 11, color: 'var(--shell-text-muted)', lineHeight: 1.6, flex: 1 }}>{desc}</div>
      </div>

      {/* Bottom bar: badge left, button right */}
      <div style={{
        borderTop: '1px solid var(--card-border)',
        padding: '10px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 44,
          background: isReport ? 'rgba(217,139,29,0.12)' : '#ECF8FD',
          color: isReport ? '#D98B1D' : '#286B88',
          letterSpacing: '0.05em', textTransform: 'uppercase',
        }}>{tag}</span>
        <button className="ds-btn sz-sm t-outline" onClick={action}>{actionLabel}</button>
      </div>
    </div>
  );
}

// Inline workspace icon so stroke colour can be controlled
const DashboardIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="#286B88" strokeLinecap="round">
    <path d="M2.49854 5.79059V3.48059C2.49854 3.20445 2.72239 2.98059 2.99854 2.98059H5.30615C5.58229 2.98059 5.80615 3.20445 5.80615 3.48059V5.79059C5.80615 6.06673 5.58229 6.29059 5.30615 6.29059H2.99854C2.72239 6.29059 2.49854 6.06673 2.49854 5.79059Z"/>
    <path d="M10.1938 11.0584V8.74841C10.1938 8.47227 10.4177 8.24841 10.6938 8.24841H13.0015C13.2776 8.24841 13.5015 8.47227 13.5015 8.74841V11.0584C13.5015 11.3346 13.2776 11.5584 13.0015 11.5584H10.6938C10.4177 11.5584 10.1938 11.3346 10.1938 11.0584Z"/>
    <path d="M7.78076 5.79059V3.48059C7.78076 3.20445 8.00462 2.98059 8.28076 2.98059H13.0015C13.2776 2.98059 13.5015 3.20445 13.5015 3.48059V5.79059C13.5015 6.06673 13.2776 6.29059 13.0015 6.29059H8.28076C8.00462 6.29059 7.78076 6.06673 7.78076 5.79059Z"/>
    <path d="M2.49854 12.5194V8.74841C2.49854 8.47227 2.72239 8.24841 2.99854 8.24841H7.71924C7.99538 8.24841 8.21924 8.47227 8.21924 8.74841V12.5194C8.21924 12.7956 7.99538 13.0194 7.71924 13.0194H2.99854C2.72239 13.0194 2.49854 12.7956 2.49854 12.5194Z"/>
  </svg>
);

const ZapIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#101010" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);

const SORT_OPTIONS = [
  { label: 'Name: A-Z', value: 'A-Z' },
  { label: 'Name: Z-A', value: 'Z-A' },
  { label: 'Recently Added', value: 'recent' },
  { label: 'Oldest First', value: 'oldest' },
];

function SortOption({ label, selected, onClick }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'block', width: '100%', textAlign: 'left',
        padding: '10px 16px', border: 'none', cursor: 'pointer',
        fontSize: 13, fontFamily: 'inherit',
        background: selected ? '#6360D8' : hovered ? '#F5F4FF' : 'transparent',
        color: selected ? '#fff' : hovered ? '#6360D8' : 'var(--shell-text)',
        transition: 'background 100ms, color 100ms',
      }}
    >
      {label}
    </button>
  );
}

function LibraryPage() {
  const { onNav, libraryFilter, setLibraryFilter, librarySearch, setLibrarySearch } = useWorkspace();
  const [sortValue, setSortValue] = React.useState('A-Z');
  const [sortOpen, setSortOpen] = React.useState(false);
  const sortRef = React.useRef(null);
  const sortLabel = SORT_OPTIONS.find(o => o.value === sortValue)?.label.replace('Name: ', '') ?? 'A-Z';

  React.useEffect(() => {
    if (!sortOpen) return;
    const handler = (e) => { if (sortRef.current && !sortRef.current.contains(e.target)) setSortOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [sortOpen]);

  const getStartedCards = [
    { title: 'Custom Dashboard',   desc: 'Build a personalized view',                 cta: 'Create New Dashboard', ctaType: 'primary', iconType: 'dashboard', highlighted: true,  action: () => onNav('workspace/dashboard/new') },
    { title: 'Report Template',    desc: 'Generate a formatted report template',      cta: 'Create New Template',  ctaType: 'primary', iconType: 'report',    highlighted: true,  action: () => {} },
    { title: 'Discover Dashboard', desc: 'Explore security metrics and insights',     cta: 'Edit Dashboard',       ctaType: 'outline', iconType: 'dashboard', highlighted: false, action: () => onNav('workspace/dashboard/new') },
    { title: 'CISO Dashboard',     desc: 'Executive security overview',               cta: 'Edit Dashboard',       ctaType: 'outline', iconType: 'dashboard', highlighted: false, action: () => onNav('workspace/dashboard/new') },
    { title: 'Client Subsidiary',  desc: 'Overall security health status',            cta: 'Edit Dashboard',       ctaType: 'outline', iconType: 'dashboard', highlighted: false, action: () => onNav('workspace/dashboard/new') },
  ];

  const allQuickCards = [
    { title: 'Executive Summary',                              desc: 'Summary of detected vulnerabilities and their severity levels.',                                                                  tag: 'REPORT',    actionLabel: 'Edit Template',  action: () => {} },
    { title: 'Month over Month Comparison of Vulnerabilities', desc: 'Month-over-month analysis of vulnerability trends and severity changes.',                                                        tag: 'REPORT',    actionLabel: 'Edit Template',  action: () => {} },
    { title: 'Detailed Report on Vulnerabilities',             desc: 'Comprehensive vulnerability inventory with detailed findings, statuses and vulnerability trends.',                               tag: 'REPORT',    actionLabel: 'Edit Template',  action: () => {} },
    { title: 'Device Attack Surface',                          desc: 'Consolidated device posture overview including health, vulnerability load, compliance state, and security activity.',            tag: 'DASHBOARD', actionLabel: 'Edit Dashboard', action: () => onNav('workspace/dashboard/new') },
    { title: 'Risk Mitigation Queries',                        desc: 'Targeted views that surface remediation-ready items aligned with defined risk-reduction priorities.',                           tag: 'DASHBOARD', actionLabel: 'Edit Dashboard', action: () => onNav('workspace/dashboard/new') },
    { title: 'Tracked Security Gaps',                          desc: 'Monitored list of unresolved weaknesses showing progress, ownership, and aging of outstanding security issues.',                tag: 'DASHBOARD', actionLabel: 'Edit Dashboard', action: () => onNav('workspace/dashboard/new') },
  ];

  const filteredCards = allQuickCards.filter(c => {
    const matchesFilter = libraryFilter === 'all' || (libraryFilter === 'dashboards' && c.tag === 'DASHBOARD') || (libraryFilter === 'reports' && c.tag === 'REPORT');
    const matchesSearch = librarySearch === '' || c.title.toLowerCase().includes(librarySearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const sortedCards = [...filteredCards].sort((a, b) => {
    if (sortValue === 'A-Z') return a.title.localeCompare(b.title);
    if (sortValue === 'Z-A') return b.title.localeCompare(a.title);
    return 0;
  });

  const pillStyle = (active) => ({
    padding: '4px 14px', borderRadius: 44, fontSize: 12,
    fontWeight: active ? 600 : 400, cursor: 'pointer',
    border: active ? '1px solid #A2A1F7' : '1px solid var(--ctrl-border)',
    background: active ? '#6360D8' : 'transparent',
    color: active ? '#fff' : 'var(--shell-text-muted)',
    transition: 'background 150ms, color 150ms', fontFamily: 'inherit',
  });

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: 16, background: '#F7F9FC' }}>
    <div style={{
      background: '#fff',
      border: '1px solid #E6E6E6',
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
          <button className="ds-tab active" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <LibraryIcon size={14} />
            Library
          </button>
          <button className="ds-tab" style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => onNav('workspace/saved')}>
            <SavedIcon size={14} />
            Saved
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <DSPillSearch value={librarySearch} onChange={setLibrarySearch} placeholder="Search Library" width={200} />
          <button style={{
            height: 28, padding: '0 12px', gap: 6,
            background: 'rgba(99,96,216,0.06)', border: '1px solid rgba(99,96,216,0.35)',
            borderRadius: 44, color: '#6360D8',
            fontSize: 12, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center',
          }}>
            <img src="assets/icons/new-report.svg" width={13} height={13} alt="" />
            New Template
          </button>
          <button onClick={() => onNav('workspace/dashboard/new')} style={{
            height: 28, padding: '0 12px', gap: 6,
            background: 'rgba(99,96,216,0.06)', border: '1px solid rgba(99,96,216,0.35)',
            borderRadius: 44, color: '#6360D8',
            fontSize: 12, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center',
          }}>
            <img src="assets/icons/template-add.svg" width={13} height={13} alt="" />
            New Dashboard
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, paddingTop: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Get Started */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <img src="assets/icons/get-started.svg" width={16} height={16} alt="" />
            <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--shell-text)' }}>Get Started</span>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {getStartedCards.map((card, i) => <StartCard key={i} {...card} />)}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <ZapIcon />
            <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--shell-text)' }}>Quick Actions</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button style={pillStyle(libraryFilter === 'all')} onClick={() => setLibraryFilter('all')}>All</button>
              <button style={pillStyle(libraryFilter === 'dashboards')} onClick={() => setLibraryFilter('dashboards')}>Dashboards</button>
              <button style={pillStyle(libraryFilter === 'reports')} onClick={() => setLibraryFilter('reports')}>Reports</button>
            </div>

            {/* Sort dropdown */}
            <div ref={sortRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setSortOpen(o => !o)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  height: 28, padding: '0 14px',
                  background: '#fff', border: '1px solid #E6E6E6',
                  borderRadius: 44, cursor: 'pointer',
                  fontSize: 12, fontWeight: 400, fontFamily: 'inherit', color: 'var(--shell-text-muted)',
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18M7 12h10M11 18h2"/>
                </svg>
                Sort by :&nbsp;<span style={{ fontWeight: 500, color: '#6360D8' }}>{sortLabel}</span>
              </button>
              {sortOpen && (
                <div style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 6px)',
                  background: '#fff', border: '1px solid #E6E6E6',
                  borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                  minWidth: 180, zIndex: 100, overflow: 'hidden', padding: '4px 0',
                }}>
                  {SORT_OPTIONS.map(opt => (
                    <SortOption
                      key={opt.value}
                      label={opt.label}
                      selected={sortValue === opt.value}
                      onClick={() => { setSortValue(opt.value); setSortOpen(false); }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {sortedCards.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {sortedCards.map((card, i) => <QuickCard key={i} {...card} />)}
            </div>
          ) : (
            <div style={{
              padding: 48, textAlign: 'center',
              color: 'var(--shell-text-muted)', fontSize: 13,
              background: 'var(--card-bg)', borderRadius: 4, border: '1px solid var(--card-border)',
            }}>
              No results found.
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}

window.LibraryPage = LibraryPage;
