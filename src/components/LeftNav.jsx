import React, { useState, useEffect } from 'react'
import { Ic } from '../ui.jsx'
import { ADMIN_NAV_GROUPS } from '../pages/admin/AdminPanelBody.jsx'

// Sidebar panel toggle icon — one persistent <svg>/<path> tree whose arrow
// direction flips via a prop, rather than two separate components swapped
// by the caller. Swapping components (unmount+remount a different SVG
// under a stationary cursor) makes the browser re-hit-test that spot and
// fire a phantom mouseenter — which, on the Topbar's collapse/expand
// button, was reopening the hover-peek override right after a click forced
// it closed. Updating one already-mounted <path>'s `d` attribute in place
// doesn't trigger that.
// Same bolder shape as NavigatorPage.jsx's own IcSidebarCollapse (24-unit
// viewBox, strokeWidth 2, Ic's Lucide-style stroke convention) instead of
// this file's old thin 1.35-stroke design — the two were visually
// inconsistent despite meaning the same thing ("toggle this sidebar").
// `open` maps directly to IcSidebarCollapse's own `flip`: both point the
// chevron left when true, right when false.
export function IcPanelToggle({ open, size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M9 3v18"/>
      <path d={open ? 'M13.5 9l2.5 3-2.5 3' : 'M16 9l-2.5 3 2.5 3'}/>
    </svg>
  )
}

// Console/terminal glyph — Admin Panel entry point (topbar account menu)
export function IcConsoleNav({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2.5" y="4" width="19" height="15" rx="2" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M6.5 9.5 10 12.5 6.5 15.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 15.5h5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
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

// Studio group icons — inline (no matching raster asset for these yet).
// Stroke-only, matching the outline weight of IcHomeNav/IcShieldNav/etc. above
// (previously solid-filled, which read inconsistently against the rest of the nav).
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
export function IcSummaryNav() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 3.5h9l3 3v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
      <path d="M15 3.5V7h3" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
      <path d="M8 12h8M8 15.5h8M8 19h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

// Top-level items shown above both grouped sections, same on every load —
// no mode switcher, no appMode branching (matches UX3LeftNav.jsx's Navigator/
// Workspace items, which use the same "always visible, not part of a group"
// treatment).
// Navigator uses `icon` (not `iconNode`) like every other row here — its
// asset is a blue-gradient fill, not a currentColor stroke, so it needs the
// same mask-image treatment RowIcon/NavItem give every other `icon` entry
// to actually recolor on selection. It used to carry its own <img> iconNode
// instead, which meant the accent-selected state's `color: var(--shell-
// accent)` had nothing to act on (an <img> ignores CSS `color`) — the icon
// just kept rendering its native blue instead of turning purple like every
// sibling row does, and looked inconsistently grey the rest of the time
// since only the grayscale filter (not the accent color) was ever visibly
// applying to it.
export const TOP_ITEMS = [
  { id: 'navigator', label: 'Navigator', icon: 'Navigator icon', navigateId: 'navigator-page', solo: true },
  { id: 'workspace',  label: 'Workspace', icon: 'navbar-workspace', dividerAfter: true },
];

// "Insights" — the classic EM sections, now always visible rather than
// gated behind the old EM/Studio switcher.
export const INSIGHTS_MODEL = [
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
      { id: 'report/mra-security-risk',   label: 'MRA Security Risk',   icon: 'nav-report-matrix' },
  ]},
  { id: 'kg',         label: 'Knowledge Graph', icon: 'navbar-kg',         solo: true },
  { id: 'data-quality', label: 'Data Quality',  icon: 'navbar-data quality', children: [
      { id: 'data-quality/overview', label: 'Overview',  icon: 'nav-overview' },
      { id: 'data-quality/in-depth', label: 'In-Depth',  icon: 'nav-dq-indepth' },
  ]},
];

// "Fabric Configuration" — Studio's real pillars per StudioHomePage (same
// naming as UX3LeftNav.jsx's STUDIO_CATEGORIES), now a second always-visible
// group instead of a separate mode reached via a switcher. None have
// dedicated pages yet, so each is a direct-link leaf that routes through the
// normal onNav/current wiring but the Studio shell itself ignores `current`
// and always shows StudioHomePage.
export const FABRIC_MODEL = [
  { id: 'studio-data-ingestion',   label: 'Data Ingestion',   icon: 'data-source',    solo: true },
  { id: 'studio-pipeline-builder', label: 'Pipeline Builder', iconNode: <IcPipelineNav />, solo: true },
  { id: 'studio-ontology',         label: 'Ontology',         iconNode: <IcOntologyNav />, solo: true },
  { id: 'studio-summary',          label: 'Summary',          iconNode: <IcSummaryNav />,  solo: true },
];

function LeftNav({ current, onNav, collapsed, hoverPeek = false, onHoverEnter, onHoverLeave, consoleActive = false, adminActiveSection, onAdminSelect, navigatorAtHome = false }) {
  // Navigator's Home landing screen suppresses the active highlight entirely
  // so it reads as a neutral home page rather than an already-active section;
  // normal highlighting resumes the moment the user starts a chat.
  const suppressActive = navigatorAtHome && current === 'navigator';
  const activeParent = suppressActive ? null : current?.split('/')[0];
  const activeChild  = suppressActive ? null : current;
  // Per-section open/closed override. Default (no entry) is "open iff this
  // is the active section" — but an explicit entry here always wins, which
  // is what lets a click both preview-open an inactive section AND collapse
  // the section you're actually on (previously impossible: isOpen used to
  // OR straight against activeParent, so the active section could never be
  // turned off). Cleared whenever the active top-level section itself
  // changes (below) or on any nav-triggered click (see navigate), so an
  // override never lingers onto an unrelated page later.
  const [openOverrides, setOpenOverrides] = useState(() => new Map());
  useEffect(() => { setOpenOverrides(new Map()); }, [activeParent]);

  const toggle = (id) => setOpenOverrides(prev => {
    const next = new Map(prev);
    const isCurrentlyOpen = next.has(id) ? next.get(id) : activeParent === id;
    next.set(id, !isCurrentlyOpen);
    return next;
  });

  // Section labels (Insights, Fabric Configuration, admin groups) collapse/
  // expand their own group of nav items independently of the rail-collapse
  // (`collapsed` prop) above — a section key in this set means collapsed.
  const [collapsedSections, setCollapsedSections] = useState(() => new Set());
  const toggleSection = (key) => setCollapsedSections(prev => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

  // Navigating to an actual page clears every override — every section
  // reverts to its default (open iff it's the one you just landed on), so
  // whatever you were previewing collapses and a section you'd manually
  // collapsed earlier gets a fresh chance to auto-open for the new page.
  // forceMode tells App.jsx's handleNav which page-set (em/studio) this id
  // belongs to, since Insights and Fabric Configuration items now live side
  // by side instead of behind a switcher that used to set this explicitly.
  const navigate = (id, forceMode) => {
    setOpenOverrides(new Map());
    onNav(id, forceMode ? { forceMode } : undefined);
  };

  // `collapsed` now means "hidden by default" rather than "shrink to an icon
  // rail" — the rail is gone. Two structurally separate things render for it,
  // deliberately not one element wearing two hats (that combination fought
  // itself: a single element can't have both a smooth in-flow width
  // transition *and* escape via position:fixed for the peek without the
  // two mechanics interfering — see below):
  //   1. The pinned/collapsed sidebar itself — always mounted, in flow, its
  //      width simply animates between 220 and 0 (see .leftnav/.leftnav--
  //      collapsed in shell.css) so pin/unpin is a single uniform, symmetric
  //      transition in both directions, exactly like the old rail-collapse.
  //   2. A separate hover-peek overlay — only mounted while collapsed and
  //      hovered, position:fixed so it never affects layout width itself.
  // `hoverPeek` is owned by the parent (App.jsx/WorkspacePage.jsx) with a
  // delayed close, since the Topbar toggle button also needs to extend it —
  // closing the instant the mouse leaves this component would make it
  // impossible to move the cursor from a peeked sidebar up to that button
  // to click it.
  const showPeek = collapsed && hoverPeek;

  const renderGroup = (items, forceMode) => items.map(item => {
    const isOpen = openOverrides.has(item.id) ? openOverrides.get(item.id) : activeParent === item.id;
    return (
      <React.Fragment key={item.id}>
        <NavItem
          item={item}
          isActiveParent={activeParent === item.id}
          activeChild={activeChild}
          isOpen={isOpen}
          onToggle={() => toggle(item.id)}
          onNav={(id) => navigate(id, forceMode)}
        />
        {item.dividerAfter && <div className="leftnav__divider" />}
      </React.Fragment>
    );
  });

  // Admin Panel groups render through the same NavItem row (icon + label,
  // same font weight/hover/selected treatment) as Insights/Fabric
  // Configuration — clicks pick an admin section instead of navigating
  // `current`, so they get their own tiny render path rather than going
  // through renderGroup/navigate.
  const renderAdminGroup = (items) => items.map(item => (
    <NavItem
      key={item.id}
      item={item}
      isActiveParent={adminActiveSection === item.id}
      activeChild={null}
      isOpen={false}
      onToggle={() => {}}
      onNav={() => onAdminSelect(item.id)}
    />
  ));

  const navContent = (
    <>
      <div className="leftnav__body">
        {consoleActive ? (
          ADMIN_NAV_GROUPS.map(group => {
            const sectionKey = `admin:${group.label}`;
            const sectionCollapsed = collapsedSections.has(sectionKey);
            return (
              <React.Fragment key={group.label}>
                <SectionLabel
                  label={group.label}
                  isCollapsed={sectionCollapsed}
                  onClick={() => toggleSection(sectionKey)}
                />
                {!sectionCollapsed && renderAdminGroup(group.items)}
              </React.Fragment>
            );
          })
        ) : (
          <>
            {renderGroup(TOP_ITEMS)}

            <SectionLabel
              label="Insights"
              isCollapsed={collapsedSections.has('insights')}
              onClick={() => toggleSection('insights')}
              data-tour="nav-section-insights"
            />
            {!collapsedSections.has('insights') && renderGroup(INSIGHTS_MODEL, 'em')}

            <div className="leftnav__divider" />
            <SectionLabel
              label="Fabric Configuration"
              isCollapsed={collapsedSections.has('fabric')}
              onClick={() => toggleSection('fabric')}
              data-tour="nav-section-fabric"
            />
            {!collapsedSections.has('fabric') && renderGroup(FABRIC_MODEL, 'studio')}
          </>
        )}
      </div>
    </>
  );

  return (
    <>
      <aside className={`leftnav${collapsed ? ' leftnav--collapsed' : ''}`} aria-hidden={collapsed}>
        {navContent}
      </aside>

      {collapsed && !hoverPeek && (
        <div
          className="leftnav__hover-zone"
          onMouseEnter={onHoverEnter}
          aria-hidden="true"
        />
      )}
      {showPeek && (
        <aside
          className="leftnav leftnav--peek"
          onMouseEnter={onHoverEnter}
          onMouseLeave={onHoverLeave}
        >
          {navContent}
        </aside>
      )}
    </>
  );
}

// A section label (Insights, Fabric Configuration, admin groups) doubles as
// a collapse/expand toggle for the nav items rendered under it — no icon
// while collapsed, a small chevron-down while expanded.
export function SectionLabel({ label, isCollapsed, onClick, className, ...rest }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={!isCollapsed}
      className={`leftnav__section-label${className ? ` ${className}` : ''}`}
      {...rest}
    >
      <span className="leftnav__section-label-text">{label}</span>
      <span className={`leftnav__section-chevron${isCollapsed ? ' leftnav__section-chevron--visible' : ''}`}>
        <Ic size={10} path={isCollapsed ? <path d="m6 9 6 6 6-6"/> : <path d="m6 15 6-6 6 6"/>}/>
      </span>
    </button>
  );
}

export function NavItem({ item, isActiveParent, activeChild, isOpen, onToggle, onNav }) {
  const hasChildren = item.children && item.children.length;
  const treatAsLeaf = !hasChildren;
  // Grey = this section is expanded (ambient — may just be a preview, see openOverrides above).
  // Accent = this exact destination is the current page — same meaning as a selected
  // child, so a leaf item (no children of its own) gets the same treatment a child does.
  const isExpanded = hasChildren && isOpen;
  const isSelected = treatAsLeaf && isActiveParent;

  const handleClick = () => {
    if (treatAsLeaf) { onNav(item.navigateId ?? item.id); return; }
    onToggle();
  };

  return (
    <div className="nav-item">
      <button
        onClick={handleClick}
        data-tour={`nav-item-${item.id}`}
        className={[
          'nav-item__btn',
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
        <span className="nav-item__label">{item.label}</span>
        {hasChildren && (
          <span className={`nav-item__chevron${isOpen ? ' nav-item__chevron--open' : ''}`}>
            <Ic size={12} path={<><path d="m6 9 6 6 6-6"/></>}/>
          </span>
        )}
      </button>

      {hasChildren && (
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
