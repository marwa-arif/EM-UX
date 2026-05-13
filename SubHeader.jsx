// SubHeader — sticky page chrome matching design spec.
// Left: title + breadcrumb + "..." menu (Edit) + Explore In dropdown
// Right: circle icon btn + Active Filters pill + Filter button

const { useState: useStateSH, useRef: useRefSH, useEffect: useEffectSH } = React;

const EXPLORE_GROUPS = [
  { label: 'Exposure', icon: 'navbar-exposure', items: [
    { label: 'Overview',  icon: 'navbar-exposure' },
    { label: 'Findings',  icon: 'navbar-findings' },
  ]},
  { label: 'Discover', icon: 'navbar-discover', items: [
    { label: 'Device',    icon: 'navbar-device' },
    { label: 'Cloud',     icon: 'navbar-kg' },
    { label: 'Identity',  icon: 'navbar-home' },
  ]},
  { label: 'Report', icon: 'navbar-report', items: [
    { label: 'Compliance',          icon: 'navbar-compliance' },
    { label: 'Assessments',         icon: 'navbar-exposure' },
    { label: 'Compliance Matrix',   icon: 'navbar-compliance' },
    { label: 'Compliance Findings', icon: 'navbar-findings' },
  ]},
];

function SubHeader({ title, breadcrumb, breadcrumbHrefs = [], activeFilterCount = 0, onExplore, onFilter, filterActive }) {
  const [menuOpen, setMenuOpen] = useStateSH(false);
  const menuRef = useRefSH(null);
  const [exploreOpen, setExploreOpen] = useStateSH(false);
  const exploreRef = useRefSH(null);

  useEffectSH(() => {
    if (!menuOpen) return;
    const onDown = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [menuOpen]);

  useEffectSH(() => {
    if (!exploreOpen) return;
    const onDown = (e) => { if (exploreRef.current && !exploreRef.current.contains(e.target)) setExploreOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [exploreOpen]);

  return (
    <div style={{
      height: 48, boxSizing: 'border-box', flexShrink: 0,
      background: 'var(--shell-bg, #F7F9FC)',
      borderBottom: '1px solid var(--shell-border, #E6E6E6)',
      display: 'flex', alignItems: 'center',
      padding: '0 24px', gap: 12,
      position: 'sticky', top: 0, zIndex: 40,
    }}>

      {/* Title + breadcrumb */}
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{
          fontSize: 12, fontWeight: 600, color: PAI.fg1,
          lineHeight: 1.2, whiteSpace: 'nowrap',
          overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{title}</div>
        {breadcrumb && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 11, color: PAI.fg3, marginTop: 2,
          }}>
            {breadcrumb.map((b, i) => {
              const isLast = i === breadcrumb.length - 1;
              const href = breadcrumbHrefs[i];
              return (
                <React.Fragment key={i}>
                  {i > 0 && <span style={{ color: PAI.fg3 }}>›</span>}
                  {href && !isLast ? (
                    <a href={href} style={{ color: PAI.fg3, textDecoration: 'none', cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.color = PAI.indigo}
                      onMouseLeave={e => e.currentTarget.style.color = PAI.fg3}
                    >{b}</a>
                  ) : (
                    <span style={isLast ? { color: PAI.indigo, fontWeight: 500 } : {}}>{b}</span>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>

      {/* ... menu */}
      <div ref={menuRef} style={{ position: 'relative', flexShrink: 0 }}>
        <button
          onClick={() => setMenuOpen(o => !o)}
          style={{
            width: 24, height: 24, padding: 0,
            background: '#F5F5F5',
            border: 'none',
            borderRadius: '50%', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            color: PAI.fg3,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>
          </svg>
        </button>
        {menuOpen && (
          <div style={{
            position: 'absolute', top: 32, left: 0,
            background: '#fff', border: '1px solid #E6E6E6',
            borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
            minWidth: 120, zIndex: 100, padding: '4px 0',
          }}>
            <button
              onClick={() => setMenuOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                width: '100%', padding: '8px 14px',
                background: 'none', border: 'none',
                fontSize: 12, fontWeight: 500, color: PAI.fg1,
                cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#F5F5FF'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <Ic size={13} path={<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>} />
              Edit
            </button>
          </div>
        )}
      </div>

      {/* Explore In */}
      <div ref={exploreRef} style={{ position: 'relative', flexShrink: 0 }}>
        <button onClick={() => setExploreOpen(o => !o)} style={{
          height: 28, padding: '0 12px',
          background: exploreOpen ? '#EEEEFD' : 'transparent',
          border: `1px solid ${exploreOpen ? '#C9C7F2' : PAI.borderStrong}`,
          borderRadius: 44, color: exploreOpen ? '#504BB8' : PAI.fg2,
          fontSize: 12, fontWeight: 500, fontFamily: 'inherit',
          cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 6,
        }}>
          <img src="assets/icons/Explore-in.svg" width={13} height={13} alt="" />
          Explore in
          <Ic size={11} path={<><path d="m6 9 6 6 6-6"/></>} />
        </button>
        {exploreOpen && (
          <div style={{
            position: 'absolute', top: 34, left: 0,
            background: '#fff', border: '1px solid #E6E6E6',
            borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
            minWidth: 200, zIndex: 100, padding: '8px 0',
          }}>
            {EXPLORE_GROUPS.map((group, gi) => (
              <div key={group.label}>
                {gi > 0 && <div style={{ margin: '6px 0', borderTop: '1px solid #F0F0F0' }} />}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '6px 14px 4px',
                }}>
                  <img src={`assets/icons/${group.icon}.svg`} width={13} height={13} alt="" style={{ opacity: 0.5 }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: PAI.fg3, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{group.label}</span>
                </div>
                {group.items.map(item => (
                  <button key={item.label}
                    onClick={() => { setExploreOpen(false); onExplore && onExplore(item.label); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      width: '100%', padding: '7px 14px 7px 36px',
                      background: 'none', border: 'none',
                      fontSize: 12, fontWeight: 500, color: PAI.fg1,
                      cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F5F5FF'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <img src={`assets/icons/${item.icon}.svg`} width={14} height={14} alt="" />
                    {item.label}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Save filter set */}
      <button title="Save filter set" style={{
        width: 32, height: 32, padding: 0,
        background: PAI.indigo, border: 'none',
        borderRadius: '50%', cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
        </svg>
      </button>

      {/* Active Filters pill */}
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        height: 28, padding: '0 12px',
        background: '#ffffff', color: '#504BB8',
        border: `1px solid ${PAI.borderStrong}`,
        borderRadius: 44, fontSize: 12, fontWeight: 500,
        flexShrink: 0,
      }}>
        Active Filters
        {activeFilterCount > 0 && (
          <span style={{
            background: '#E0DFF7', color: '#504BB8',
            borderRadius: '50%', width: 16, height: 16,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 600,
          }}>{activeFilterCount}</span>
        )}
      </span>

      {/* Divider */}
      <div style={{ width: 1, height: 20, background: PAI.borderStrong, flexShrink: 0 }} />

      {/* Filter button */}
      <button onClick={onFilter} style={{
        height: 28, padding: '0 12px',
        background: '#E0DFF7',
        color: '#504BB8',
        border: 'none', borderRadius: 44,
        fontSize: 12, fontWeight: 500, fontFamily: 'inherit',
        cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: 6,
        flexShrink: 0,
      }}>
        Filter
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
        </svg>
      </button>

    </div>
  );
}

window.SubHeader = SubHeader;
