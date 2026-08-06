import React, { useState, useRef, useEffect } from 'react'
import { Ic } from '../ui.jsx'

function IcBuildingBlock() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1"   y="1"   width="6" height="6" rx="1.5" fill="currentColor"/>
      <rect x="9"   y="1"   width="6" height="6" rx="1.5" fill="currentColor"/>
      <rect x="1"   y="9"   width="6" height="6" rx="1.5" fill="currentColor"/>
      <rect x="9"   y="9"   width="6" height="6" rx="1.5" fill="currentColor"/>
    </svg>
  )
}

function IcEMDashboard() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="6" height="5" rx="1" fill="currentColor"/>
      <rect x="9" y="1" width="6" height="5" rx="1" fill="currentColor"/>
      <rect x="1" y="8" width="6" height="7" rx="1" fill="currentColor"/>
      <rect x="9" y="8" width="6" height="7" rx="1" fill="currentColor"/>
    </svg>
  )
}

// Up+down arrows — conveys "switch between options" (not navigation)
function IcSortCaret() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <path d="M2.5 3.75 5 1.5 7.5 3.75" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2.5 6.25 5 8.5 7.5 6.25" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// Panel-left-close: sidebar panel icon with left-pointing arrow inside
function IcPanelClose() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.35"/>
      <path d="M5.25 1.5v12" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round"/>
      <path d="M9 5.5 L7 7.5 L9 9.5" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// Panel-left-open: sidebar panel icon with right-pointing arrow inside
function IcPanelOpen() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.35"/>
      <path d="M5.25 1.5v12" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round"/>
      <path d="M7 5.5 L9 7.5 L7 9.5" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// Sparkle — conveys "new/next-gen experience"
function IcSparkle() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 1.5 L9.4 5.6 L13.5 7 L9.4 8.4 L8 12.5 L6.6 8.4 L2.5 7 L6.6 5.6 Z" fill="currentColor"/>
      <path d="M12.5 10.3 L13.05 11.95 L14.7 12.5 L13.05 13.05 L12.5 14.7 L11.95 13.05 L10.3 12.5 L11.95 11.95 Z" fill="currentColor"/>
    </svg>
  )
}

// Studio home icon — inline (public/assets/icons/navbar-home.svg is a broken/
// incomplete asset, missing its roof stroke, and unused anywhere else)
export function IcHomeNav() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 11.5 12 4l8 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6 9.5V19a1 1 0 0 0 1 1h3v-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5h3a1 1 0 0 0 1-1V9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// Studio group icons — inline (no matching raster asset for these three yet).
// Stroke-only, matching the outline weight of IcHomeNav/IcShieldNav/etc. above
// (previously solid-filled, which read inconsistently against the rest of the nav).
export function IcWorkspaceNav() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6"/>
      <circle cx="16" cy="9" r="6" stroke="currentColor" strokeWidth="1.6"/>
      <circle cx="12.5" cy="16" r="6" stroke="currentColor" strokeWidth="1.6"/>
    </svg>
  )
}
export function IcPipelineNav() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="6" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.6"/>
      <circle cx="6" cy="18" r="2.5" stroke="currentColor" strokeWidth="1.6"/>
      <circle cx="18" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M8.3 6.9 15.7 10.9M8.3 17.1 15.7 13.1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  )
}
export function IcOntologyNav() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6"/>
      <circle cx="12" cy="4" r="2" stroke="currentColor" strokeWidth="1.6"/>
      <circle cx="4" cy="18" r="2" stroke="currentColor" strokeWidth="1.6"/>
      <circle cx="20" cy="18" r="2" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M12 7v2M10.5 13.5 6 16.5M13.5 13.5 18 16.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
    </svg>
  )
}

// Studio left-nav menu — Figma node 470:21088. Workspace / Pipeline / Ontology
// each expand to the same Device / Cloud pair (no dedicated Studio subpages
// yet, so these route through the normal onNav/current wiring but the
// Studio shell itself ignores `current` and always shows StudioHomePage).
const STUDIO_MODEL = [
  { id: 'navigator', label: 'Navigator', iconNode: <img src="assets/icons/Navigator icon.svg" width={16} height={16} alt="" />, navigateId: 'navigator-page', solo: true },
  { id: 'studio-home', label: 'Home', iconNode: <IcHomeNav />, solo: true, dividerAfter: true },
  { id: 'studio-workspace', label: 'Workspace', iconNode: <IcWorkspaceNav />, children: [
      { id: 'studio-workspace/device', label: 'Device', icon: 'nav-discover-device' },
      { id: 'studio-workspace/cloud',  label: 'Cloud',  icon: 'nav-discover-cloud' },
  ]},
  { id: 'studio-pipeline', label: 'Pipeline', iconNode: <IcPipelineNav />, children: [
      { id: 'studio-pipeline/device', label: 'Device', icon: 'nav-discover-device' },
      { id: 'studio-pipeline/cloud',  label: 'Cloud',  icon: 'nav-discover-cloud' },
  ]},
  { id: 'studio-ontology', label: 'Ontology', iconNode: <IcOntologyNav />, children: [
      { id: 'studio-ontology/device', label: 'Device', icon: 'nav-discover-device' },
      { id: 'studio-ontology/cloud',  label: 'Cloud',  icon: 'nav-discover-cloud' },
  ]},
];

function LeftNav({ current, onNav, collapsed, onToggleCollapse, onExpand, mode = 'em', onModeChange, ux3Active = false }) {
  const model = [
    { id: 'navigator', label: 'Navigator', iconNode: <img src="assets/icons/Navigator icon.svg" width={16} height={16} alt="" />, navigateId: 'navigator-page', solo: true },
    { id: 'workspace',  label: 'Workspace',       icon: 'navbar-workspace', dividerAfter: true },
    { id: 'exposure',   label: 'Exposure',        icon: 'navbar-exposure',   children: [
        { id: 'exposure/overview',  label: 'Overview',  icon: 'nav-overview' },
        { id: 'exposure/findings',  label: 'Findings',  icon: 'nav-findings' },
    ]},
    { id: 'discover',   label: 'Discover',        icon: 'navbar-discover',   children: [
        { id: 'discover/device',   label: 'Device',   icon: 'nav-discover-device' },
        { id: 'discover/cloud',    label: 'Cloud',    icon: 'nav-discover-cloud' },
        { id: 'discover/identity', label: 'Identity', icon: 'nav-discover-identity' },
    ]},
    { id: 'report',     label: 'Report',          icon: 'navbar-report',     children: [
        { id: 'report/compliance',          label: 'Compliance',          icon: 'nav-report-compliance' },
        { id: 'report/assessments',         label: 'Assessments',         icon: 'nav-report-assessments' },
        { id: 'report/compliance-matrix',   label: 'Compliance Matrix',   icon: 'nav-report-matrix' },
        { id: 'report/compliance-findings', label: 'Compliance Findings', icon: 'nav-findings' },
    ]},
    { id: 'kg',         label: 'Knowledge Graph', icon: 'navbar-kg',         solo: true },
    { id: 'data-quality', label: 'Data Quality',  icon: 'navbar-data quality', children: [
        { id: 'data-quality/overview', label: 'Overview',  icon: 'nav-overview' },
        { id: 'data-quality/in-depth', label: 'In-Depth',  icon: 'nav-dq-indepth' },
    ]},
    { id: 'remediation',label: 'Remediation',     icon: 'navbar-remediation', children: [
        { id: 'remediation/queue',  label: 'Queue',  icon: 'nav-remediation-queue' },
        { id: 'remediation/closed', label: 'Closed', icon: 'nav-remediation-closed' },
    ]},
  ];

  const activeParent = current?.split('/')[0];
  const activeChild  = current;
  // Sections the user has manually opened to browse/preview — independent of
  // which page is actually active. The active section is always shown open
  // (below) regardless of this set, so peeking at another section never
  // collapses the one you're actually on.
  const [openIds, setOpenIds] = useState(() => new Set());
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const headerRef = useRef(null);

  const toggle = (id) => setOpenIds(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  // Navigating to an actual page clears every manually-previewed section —
  // only the section for the page you just landed on stays open (via the
  // activeParent check below), so whatever you were previewing collapses.
  const navigate = (id) => {
    setOpenIds(new Set());
    onNav(id);
  };
  const width = collapsed ? 52 : 220;
  const isStudio = mode === 'studio';

  // Close dropdown when clicking outside the header
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e) => {
      if (headerRef.current && !headerRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen]);

  const handleOption = (option) => {
    setDropdownOpen(false);
    if (option === 'studio') {
      onModeChange?.('studio');
    } else if (option === 'em') {
      onModeChange?.('em');
    }
  };

  return (
    <aside className="leftnav" style={{ width }}>
      <div ref={headerRef} className="leftnav__header">
        <button
          className={`leftnav__switcher${collapsed ? ' leftnav__switcher--collapsed' : ''}${dropdownOpen ? ' leftnav__switcher--open' : ''}`}
          onClick={() => setDropdownOpen(o => !o)}
          aria-haspopup="menu"
          aria-expanded={dropdownOpen}
          title={collapsed ? (isStudio ? 'Studio' : 'EM Dashboard') : undefined}
        >
          <span className="leftnav__switcher-icon">
            {isStudio ? <IcBuildingBlock /> : <IcEMDashboard />}
          </span>
          {!collapsed && (
            <>
              <span className="leftnav__switcher-text">
                <span className="leftnav__switcher-name">
                  {isStudio ? 'Studio' : 'EM Dashboard'}
                </span>
                <span className="leftnav__switcher-sub">
                  {isStudio ? 'Data Fabric' : 'Exposure Management'}
                </span>
              </span>
              <span className="leftnav__switcher-caret">
                <IcSortCaret />
              </span>
            </>
          )}
        </button>

        {dropdownOpen && (
          <div className="leftnav__mode-dropdown">
            {isStudio ? (
              <button
                className="leftnav__mode-option"
                onClick={() => handleOption('em')}
              >
                <IcEMDashboard />
                <span className="leftnav__mode-option-label">EM Dashboard</span>
              </button>
            ) : (
              <button
                className="leftnav__mode-option"
                onClick={() => handleOption('studio')}
              >
                <IcBuildingBlock />
                <span className="leftnav__mode-option-label">Studio</span>
                <span className="leftnav__mode-option-soon">Soon</span>
              </button>
            )}
          </div>
        )}
      </div>

      <div className="leftnav__body">
        {(isStudio ? STUDIO_MODEL : model).map(item => (
          <React.Fragment key={item.id}>
            <NavItem
              item={item}
              collapsed={collapsed}
              isActiveParent={activeParent === item.id}
              activeChild={activeChild}
              isOpen={openIds.has(item.id) || activeParent === item.id}
              onToggle={() => toggle(item.id)}
              onExpand={onExpand}
              onNav={navigate}
            />
            {item.dividerAfter && <div className="leftnav__divider" />}
          </React.Fragment>
        ))}
      </div>

      {!isStudio && (
        <div className="leftnav__footer">
          <button
            onClick={() => onNav(ux3Active ? 'ux3-exit' : 'ux3-page')}
            title={ux3Active ? 'Back to EM Dashboard' : 'UX 3.0 — in progress'}
            className={`leftnav__ux3-btn${collapsed ? ' leftnav__ux3-btn--collapsed' : ''}${ux3Active ? ' leftnav__ux3-btn--active' : ''}`}
          >
            <span className="leftnav__ux3-btn-icon">
              {ux3Active ? <IcEMDashboard /> : <IcSparkle />}
            </span>
            {!collapsed && (
              <>
                <span className="leftnav__ux3-btn-label">{ux3Active ? 'EM Dashboard' : 'UX 3.0'}</span>
                {!ux3Active && <span className="leftnav__ux3-btn-badge">Beta</span>}
              </>
            )}
          </button>
        </div>
      )}

      <div className="leftnav__collapse-row">
        <button
          onClick={onToggleCollapse}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`leftnav__collapse-btn${collapsed ? ' leftnav__collapse-btn--collapsed' : ''}`}
        >
          <span className="leftnav__collapse-btn-icon">
            {collapsed ? <IcPanelOpen /> : <IcPanelClose />}
          </span>
          {!collapsed && <span className="leftnav__collapse-btn-label">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}

function NavItem({ item, collapsed, isActiveParent, activeChild, isOpen, onToggle, onExpand, onNav }) {
  const hasChildren = item.children && item.children.length;
  const treatAsLeaf = !hasChildren;
  // Grey = this section is expanded (ambient — may just be a preview, see openIds above).
  // Accent = this exact destination is the current page — same meaning as a selected
  // child, so a leaf item (no children of its own) gets the same treatment a child does.
  const isExpanded = hasChildren && isOpen;
  const isSelected = treatAsLeaf && isActiveParent;

  const handleClick = () => {
    if (treatAsLeaf) { onNav(item.navigateId ?? item.id); return; }
    // Collapsed rail hides the children list entirely, so a click that only
    // toggled `openIds` would look like nothing happened — expand the rail
    // too so the dropdown becomes visible.
    if (collapsed) onExpand?.();
    onToggle();
  };

  return (
    <div className="nav-item">
      <button
        onClick={handleClick}
        title={collapsed ? item.label : undefined}
        className={[
          'nav-item__btn',
          collapsed ? 'nav-item__btn--collapsed' : '',
          isExpanded ? 'nav-item__btn--active' : '',
          isSelected ? 'nav-item__btn--selected' : '',
        ].filter(Boolean).join(' ')}
      >
        {item.iconNode ? (
          <span className={`nav-item__icon${isExpanded ? ' nav-item__icon--active' : ''}${isSelected ? ' nav-item__icon--selected' : ''}`}>
            {item.iconNode}
          </span>
        ) : isSelected ? (
          <span
            className="nav-item__icon nav-item__icon--masked"
            style={{
              maskImage: `url('assets/icons/${item.icon}.svg')`,
              WebkitMaskImage: `url('assets/icons/${item.icon}.svg')`,
              maskMode: 'alpha',
            }}
          />
        ) : (
          <img
            src={`assets/icons/${item.icon}.svg`}
            width={16} height={16}
            className={`nav-item__icon${isExpanded ? ' nav-item__icon--active' : ''}`}
            alt=""
          />
        )}
        {!collapsed && (
          <>
            <span className="nav-item__label">{item.label}</span>
            {hasChildren && (
              <span className={`nav-item__chevron${isOpen ? ' nav-item__chevron--open' : ''}`}>
                <Ic size={12} path={<><path d="m6 9 6 6 6-6"/></>}/>
              </span>
            )}
          </>
        )}
      </button>

      {!collapsed && hasChildren && (
        <div
          className="nav-item__children"
          style={{ maxHeight: isOpen ? item.children.length * 32 : 0 }}
        >
          {item.children.map(c => {
            const active = activeChild === c.id;
            return (
              <button
                key={c.id}
                onClick={() => onNav(c.id)}
                className={`nav-item__child${active ? ' nav-item__child--active' : ''}`}
              >
                {c.icon && (
                  <span
                    className="nav-item__child-icon"
                    style={{
                      maskImage: `url('assets/icons/${c.icon}.svg')`,
                      WebkitMaskImage: `url('assets/icons/${c.icon}.svg')`,
                      maskSize: 'contain',
                      WebkitMaskSize: 'contain',
                      maskRepeat: 'no-repeat',
                      WebkitMaskRepeat: 'no-repeat',
                      maskPosition: 'center',
                      WebkitMaskPosition: 'center',
                      maskMode: 'alpha',
                    }}
                  />
                )}
                {c.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default LeftNav;
