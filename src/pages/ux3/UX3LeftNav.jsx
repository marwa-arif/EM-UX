import React, { useState, useRef, useEffect, useMemo } from 'react'
import { IcHomeNav, IcPipelineNav, IcOntologyNav } from '../../components/LeftNav.jsx'

// Security Posture Management has no matching icon asset yet — inline, same
// convention as LeftNav.jsx's IcHomeNav/IcPipelineNav/etc.
function IcShieldNav() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3.5 5 6.5v5.2c0 4.6 3.1 7.6 7 8.8 3.9-1.2 7-4.2 7-8.8V6.5L12 3.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 12.2l2.1 2.1L15.3 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// Findings has no matching icon asset that reads well at nav scale — inline,
// same convention as IcShieldNav (report clipboard + alert flag).
function IcFindingsNav() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 3.5h6.5L18 7v11.5a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
      <path d="M14 3.5V7h4" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
      <path d="M9 12.5h4.5M9 15.5h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      <circle cx="9.3" cy="9.2" r="1.1" fill="currentColor"/>
    </svg>
  )
}

// Remediation — patch/bandage motif, distinct from the Security Posture
// shield glyph above. Inline for the same reason as IcShieldNav.
function IcRemediationNav() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.5" y="8.5" width="17" height="7" rx="3.5" transform="rotate(-35 12 12)" stroke="currentColor" strokeWidth="1.7"/>
      <path d="M9.5 9.5 14.5 14.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeDasharray="0.1 2.4"/>
    </svg>
  )
}

// Blast Radius has no matching icon asset — inline, concentric-rings motif to
// read as "radius of impact" at nav scale. Same convention as IcShieldNav.
function IcBlastRadiusNav() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="2" fill="currentColor"/>
      <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="1.6"/>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.4" opacity="0.55"/>
    </svg>
  )
}

// Panel-left-close/open — mirrors components/LeftNav.jsx's collapse icons so
// the two sidebars in the app read as the same control.
function IcPanelClose() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.35"/>
      <path d="M5.25 1.5v12" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round"/>
      <path d="M9 5.5 L7 7.5 L9 9.5" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function IcPanelOpen() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.35"/>
      <path d="M5.25 1.5v12" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round"/>
      <path d="M7 5.5 L9 7.5 L7 9.5" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function IcSearch() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  )
}

function IcBell() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  )
}

function IcHelp() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/>
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  )
}

const HOME_ITEM = { id: 'home', label: 'Home', iconNode: <IcHomeNav /> };
// Same top-level entries as the classic LeftNav.jsx (Navigator + Workspace, both
// solo items above the grouped sections) — these bubble straight up to onNav
// and leave UX3Page entirely, same as clicking them does in the classic nav.
const NAVIGATOR_ITEM = { id: 'navigator', label: 'Navigator', iconNode: <img src="assets/icons/Navigator icon.svg" width={16} height={16} alt="" /> };
const WORKSPACE_ITEM = { id: 'workspace', label: 'Workspace', icon: 'navbar-workspace' };

// Single-item categories render as a direct link (no expand/collapse) — see
// CategoryItem's isDirectLink handling below.
const KG_CATEGORY = {
  id: 'kg',
  label: 'Knowledge Graph',
  icon: 'navbar-kg',
  items: [{ id: 'kg', label: 'Knowledge Graph', icon: 'navbar-kg' }],
};
const BLAST_RADIUS_CATEGORY = {
  id: 'blast-radius',
  label: 'Blast Radius',
  iconNode: <IcBlastRadiusNav />,
  items: [{ id: 'graph/blast-radius', label: 'Blast Radius', iconNode: <IcBlastRadiusNav /> }],
};

const EXPOSURE_CATEGORY = {
  id: 'exposure',
  label: 'Exposure',
  icon: 'navbar-exposure',
  items: [
    { id: 'exposure/overview', label: 'Overview', icon: 'nav-overview' },
    { id: 'exposure/findings', label: 'Findings', iconNode: <IcFindingsNav /> },
  ],
};
const ATTACK_SURFACE_CATEGORY = {
  id: 'attack-surface',
  label: 'Attack Surface',
  icon: 'navbar-discover',
  items: [
    { id: 'discover/cloud',    label: 'Cloud',    icon: 'nav-discover-cloud' },
    { id: 'discover/device',   label: 'Device',   icon: 'nav-discover-device' },
    { id: 'discover/identity', label: 'Identity', icon: 'nav-discover-identity' },
  ],
};
const SECURITY_POSTURE_CATEGORY = {
  id: 'security-posture',
  label: 'Security Posture',
  iconNode: <IcShieldNav />,
  items: [
    { id: 'security-posture/host',     label: 'Host',     icon: 'nav-discover-device' },
    { id: 'security-posture/identity', label: 'Identity', icon: 'nav-discover-identity' },
    { id: 'security-posture/cloud',    label: 'Cloud',    icon: 'nav-discover-cloud' },
  ],
};
const REPORT_CATEGORY = {
  id: 'report',
  label: 'Assessments',
  icon: 'navbar-report',
  items: [
    { id: 'report/assessments', label: 'Assessments', icon: 'nav-report-assessments' },
  ],
};
const COMPLIANCE_CATEGORY = {
  id: 'compliance',
  label: 'Compliance',
  icon: 'nav-report-compliance',
  items: [
    { id: 'report/compliance',          label: 'Overview',  icon: 'nav-report-compliance' },
    { id: 'report/compliance-matrix',   label: 'Matrix',    icon: 'nav-report-matrix' },
    { id: 'report/compliance-findings', label: 'Findings',  iconNode: <IcFindingsNav /> },
  ],
};
// The "Data Quality" section has only these two destinations — direct-link
// categories (same pattern as KG_CATEGORY/BLAST_RADIUS_CATEGORY) instead of
// one "Data Quality" category nested under a "Data Quality" section, which
// just repeated the section name.
const DATA_QUALITY_OVERVIEW_CATEGORY = {
  id: 'data-quality-overview',
  label: 'Overview',
  icon: 'nav-overview',
  items: [{ id: 'data-quality/overview', label: 'Overview', icon: 'nav-overview' }],
};
const DATA_QUALITY_INDEPTH_CATEGORY = {
  id: 'data-quality-in-depth',
  label: 'In-Depth',
  icon: 'nav-dq-indepth',
  items: [{ id: 'data-quality/in-depth', label: 'In-Depth', icon: 'nav-dq-indepth' }],
};
const REMEDIATION_CATEGORY = {
  id: 'remediation',
  label: 'Remediation',
  iconNode: <IcRemediationNav />,
  items: [
    { id: 'remediation/queue',  label: 'Queue',  icon: 'nav-remediation-queue' },
    { id: 'remediation/closed', label: 'Closed', icon: 'nav-remediation-closed' },
  ],
};

// Studio's real pillars per StudioHomePage — connector/data ingestion,
// pipeline building, and entity/relationship (ontology) templates. None have
// dedicated pages yet, so each collapses to a single "Coming Soon" leaf
// (routes to UX3Page's generic placeholder fallback).
const STUDIO_CATEGORIES = [
  {
    id: 'studio-pipeline-builder',
    label: 'Pipeline Builder',
    iconNode: <IcPipelineNav />,
    items: [{ id: 'studio/pipeline-builder/coming-soon', label: 'Coming Soon', icon: 'nav-overview' }],
  },
  {
    id: 'studio-data-ingestion',
    label: 'Data Ingestion',
    icon: 'data-source',
    items: [{ id: 'studio/data-ingestion/coming-soon', label: 'Coming Soon', icon: 'nav-overview' }],
  },
  {
    id: 'studio-ontology',
    label: 'Ontology',
    iconNode: <IcOntologyNav />,
    items: [{ id: 'studio/ontology/coming-soon', label: 'Coming Soon', icon: 'nav-overview' }],
  },
];

// Solutions + Studio are both always listed in the nav — no mode switcher,
// no appMode branching. All EM categories fold under one "Solutions" header.
const SECTIONS = [
  {
    label: 'Solutions',
    categories: [
      KG_CATEGORY, BLAST_RADIUS_CATEGORY,
      EXPOSURE_CATEGORY, REMEDIATION_CATEGORY,
      ATTACK_SURFACE_CATEGORY, SECURITY_POSTURE_CATEGORY,
      REPORT_CATEGORY, COMPLIANCE_CATEGORY,
      DATA_QUALITY_OVERVIEW_CATEGORY, DATA_QUALITY_INDEPTH_CATEGORY,
    ],
  },
  { label: 'Studio', categories: STUDIO_CATEGORIES },
];

function NavIcon({ icon }) {
  return (
    <span
      className="ux3-nav-icon"
      style={{
        maskImage: `url('assets/icons/${icon}.svg')`,
        WebkitMaskImage: `url('assets/icons/${icon}.svg')`,
      }}
    />
  );
}

const ChevronIcon = ({ open }) => (
  <svg className={`ux3-nav__chevron${open ? ' ux3-nav__chevron--open' : ''}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6"/>
  </svg>
);

const BackIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);

function CategoryItem({ category, current, onNav, isOpen, onToggle, collapsed, onExpandNav }) {
  // A category with exactly one child (e.g. Knowledge Graph, Blast Radius, or
  // any of Studio's still-unbuilt pillars) is a single destination, not a
  // group — clicking it navigates directly instead of expanding a redundant
  // one-item list.
  const isDirectLink = category.items.length === 1;
  const hasActiveChild = category.items.some(i => i.id === current);
  const open = isOpen || hasActiveChild;

  const handleClick = () => {
    if (isDirectLink) { onNav(category.items[0].id); return; }
    if (collapsed) onExpandNav();
    onToggle();
  };

  return (
    <div className="ux3-nav__category">
      <button
        className={`ux3-nav__category-btn${hasActiveChild ? ' ux3-nav__category-btn--active' : ''}${collapsed ? ' ux3-nav__category-btn--collapsed' : ''}`}
        onClick={handleClick}
        title={collapsed ? category.label : undefined}
      >
        {category.iconNode ? category.iconNode : <NavIcon icon={category.icon} />}
        {!collapsed && <span className="ux3-nav__category-label">{category.label}</span>}
        {!collapsed && category.badge && <span className="ux3-nav__badge">{category.badge}</span>}
        {!collapsed && !isDirectLink && <ChevronIcon open={open} />}
      </button>
      {!collapsed && !isDirectLink && (
        <div className="ux3-nav__category-children" style={{ maxHeight: open ? category.items.length * 32 : 0 }}>
          {category.items.map(item => (
            <button
              key={item.id}
              className={`ux3-nav__leaf${current === item.id ? ' ux3-nav__leaf--active' : ''}`}
              onClick={() => onNav(item.id)}
            >
              {item.iconNode ? item.iconNode : <NavIcon icon={item.icon} />}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function UX3LeftNav({ current, onNav, forceCollapsed = false }) {
  const [openIds, setOpenIds] = useState(() => new Set());
  const [collapsedState, setCollapsed] = useState(false);
  const collapsed = forceCollapsed || collapsedState;
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef(null);
  const pendingFocusRef = useRef(false);

  useEffect(() => {
    if (!collapsed && pendingFocusRef.current) {
      pendingFocusRef.current = false;
      searchInputRef.current?.focus();
    }
  }, [collapsed]);

  const toggle = (id) => setOpenIds(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const expandNav = () => setCollapsed(false);

  const term = searchTerm.trim().toLowerCase();

  const filteredSections = useMemo(() => {
    if (!term) return SECTIONS.map(section => ({ ...section, categories: section.categories.map(c => ({ ...c, _forceOpen: false })) }));
    return SECTIONS
      .map(section => {
        const categories = section.categories
          .map(cat => {
            const catMatches = cat.label.toLowerCase().includes(term);
            const items = catMatches ? cat.items : cat.items.filter(i => i.label.toLowerCase().includes(term));
            if (!catMatches && items.length === 0) return null;
            return { ...cat, items, _forceOpen: true };
          })
          .filter(Boolean);
        return { ...section, categories };
      })
      .filter(section => section.categories.length > 0);
  }, [term]);

  const homeMatches = !term || HOME_ITEM.label.toLowerCase().includes(term);
  const navigatorMatches = !term || NAVIGATOR_ITEM.label.toLowerCase().includes(term);
  const workspaceMatches = !term || WORKSPACE_ITEM.label.toLowerCase().includes(term);
  const noResults = Boolean(term) && filteredSections.length === 0 && !homeMatches && !navigatorMatches && !workspaceMatches;

  const handleSearchIconClick = () => {
    pendingFocusRef.current = true;
    setCollapsed(false);
  };

  return (
    <div className="ux3-leftnav-shell">
      <aside className={`admin-sidebar ux3-leftnav${collapsed ? ' ux3-leftnav--collapsed' : ''}`}>
      <nav className="admin-sidebar__nav">
        {collapsed ? (
          <button className="ux3-nav__search-btn" title="Search" onClick={handleSearchIconClick}>
            <IcSearch />
          </button>
        ) : (
          <div className="ux3-nav__search-row">
            <IcSearch />
            <input
              ref={searchInputRef}
              className="ux3-nav__search-input"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}

        {homeMatches && (
          <button
            className={`admin-sidebar__item${current === HOME_ITEM.id ? ' admin-sidebar__item--active' : ''}`}
            onClick={() => onNav(HOME_ITEM.id)}
            title={collapsed ? HOME_ITEM.label : undefined}
          >
            {HOME_ITEM.iconNode}
            {!collapsed && HOME_ITEM.label}
          </button>
        )}
        <div className="ux3-nav__divider" />

        {navigatorMatches && (
          <button
            className="admin-sidebar__item"
            onClick={() => onNav(NAVIGATOR_ITEM.id)}
            title={collapsed ? NAVIGATOR_ITEM.label : undefined}
          >
            {NAVIGATOR_ITEM.iconNode}
            {!collapsed && NAVIGATOR_ITEM.label}
          </button>
        )}
        {workspaceMatches && (
          <button
            className="admin-sidebar__item"
            onClick={() => onNav(WORKSPACE_ITEM.id)}
            title={collapsed ? WORKSPACE_ITEM.label : undefined}
          >
            <NavIcon icon={WORKSPACE_ITEM.icon} />
            {!collapsed && WORKSPACE_ITEM.label}
          </button>
        )}
        {(navigatorMatches || workspaceMatches) && <div className="ux3-nav__divider" />}

        {noResults && <div className="ux3-nav__no-results">No matches</div>}

        {filteredSections.map(section => (
          <div key={section.label} className="admin-sidebar__group">
            {!collapsed && <div className="ux3-nav__section-label">{section.label}</div>}
            {section.categories.map(category => (
              <CategoryItem
                key={category.id}
                category={category}
                current={current}
                onNav={onNav}
                isOpen={openIds.has(category.id) || category._forceOpen}
                onToggle={() => toggle(category.id)}
                collapsed={collapsed}
                onExpandNav={expandNav}
              />
            ))}
          </div>
        ))}
      </nav>

      <div className="admin-sidebar__footer">
        <button
          className="admin-sidebar__item"
          onClick={() => onNav('ux3-exit')}
          title={collapsed ? 'Back to Old' : undefined}
        >
          <BackIcon />
          {!collapsed && 'Back to Old'}
        </button>
      </div>

      <div className={`ux3-nav__utility-row${collapsed ? ' ux3-nav__utility-row--collapsed' : ''}`}>
        <button className="ux3-nav__utility-btn" title="Notifications">
          <IcBell />
        </button>
        <button className="ux3-nav__utility-btn" title="Help & Support">
          <IcHelp />
        </button>
      </div>

      {!forceCollapsed && (
        <div className="ux3-nav__collapse-row">
          <button
            onClick={() => setCollapsed(c => !c)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={`ux3-nav__collapse-btn${collapsed ? ' ux3-nav__collapse-btn--collapsed' : ''}`}
          >
            <span className="ux3-nav__collapse-btn-icon">
              {collapsed ? <IcPanelOpen /> : <IcPanelClose />}
            </span>
            {!collapsed && <span className="ux3-nav__collapse-btn-label">Collapse</span>}
          </button>
        </div>
      )}
      </aside>
    </div>
  );
}

export default UX3LeftNav;
