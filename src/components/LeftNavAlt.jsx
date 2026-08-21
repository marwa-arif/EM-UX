import React, { useState, useEffect, useRef, useLayoutEffect } from 'react'
import LeftNav, { IcEMDashboard, IcConsoleNav, IcPanelToggle, IcSummaryNav, SectionLabel, NavItem, TOP_ITEMS, INSIGHTS_MODEL, FABRIC_MODEL } from './LeftNav.jsx'
import { ADMIN_NAV_GROUPS } from '../pages/admin/AdminPanelBody.jsx'
import { CHAT_HISTORY, AGENTS } from './NavigatorPanel.jsx'
import { RECENT_CHATS } from '../pages/NavigatorPage.jsx'
import { SAVED_ROWS } from '../pages/SavedPage.jsx'

// Option 2 — Insights renders the same per-entity accordion as Option 1
// (LeftNav.jsx's NavItem: one row with its own icon + chevron, expanding to
// its children inline) under a single "Insights" umbrella header — the only
// remaining difference from Option 1 here is the whole-nav collapse
// behavior (icon-only rail below, instead of Option 1's hover-peek).
// Headers reuse LeftNav.jsx's SectionLabel (same hover-reveal chevron that
// stays visible while collapsed).
//
// The whole-nav collapse (`collapsed` prop) is where Option 2 actually
// diverges from Option 1: instead of hiding behind a hover-peek overlay, it
// becomes one persistent icon-only rail covering every destination — see
// compactContent below and `.leftnav-alt--rail` in leftNavAlt.css. `compact`
// on Row renders that icon-only treatment — a DS-style dark CSS tooltip
// (data-tooltip + ::after, see .nav-item__btn--rail-collapsed::after in
// leftNavAlt.css) instead of a visible label, same convention as
// drawer.css's relationship-dot tooltip. Native `title` was tried first but
// its OS-level hover delay doesn't match the DS's instant-on-:hover tooltip
// behavior.
//
// The collapse toggle itself lives inside the nav (top of leftnav__body,
// via onToggleCollapse), not in the Topbar — unlike every other LeftNav
// option, which shares Topbar.jsx's .topbar__nav-toggle (hidden for this
// option specifically, see Topbar.jsx's `navDesign !== 'rail'` check).
// Shared three-way icon treatment (masked/accent-tinted when active, plain
// img otherwise, or a literal iconNode for inline-SVG icons) — used by both
// Row's rail buttons and the split panel's own rows (Option 4), so an
// Insights/Fabric row inside the panel gets the same icon it would have had
// in Options 1-3 instead of just a bare label.
function RowIcon({ icon, iconNode, isActive }) {
  if (iconNode) {
    return <span className={`nav-item__icon${isActive ? ' nav-item__icon--selected' : ''}`}>{iconNode}</span>;
  }
  if (!icon) return null;
  return isActive ? (
    <span
      className="nav-item__icon nav-item__icon--masked"
      style={{ maskImage: `url('assets/icons/${icon}.svg')`, WebkitMaskImage: `url('assets/icons/${icon}.svg')`, maskMode: 'alpha' }}
    />
  ) : (
    <img src={`assets/icons/${icon}.svg`} width={16} height={16} className="nav-item__icon" alt="" />
  );
}

function Row({ label, icon, iconNode, isActive, onClick, compact = false }) {
  return (
    <div className="nav-item">
      <button
        onClick={onClick}
        data-tooltip={compact ? label : undefined}
        aria-label={compact ? label : undefined}
        className={`nav-item__btn${compact ? ' nav-item__btn--rail-collapsed' : ''}${isActive ? ' nav-item__btn--selected' : ''}`}
      >
        <RowIcon icon={icon} iconNode={iconNode} isActive={isActive} />
        {!compact && <span className="nav-item__label">{label}</span>}
      </button>
    </div>
  );
}

// Rail-collapsed counterpart to LeftNav.jsx's NavItem — a section icon
// (Exposure/Discover/Report/Data Quality) that toggles its own children
// icons inline below it. No room for a text label or chevron in the 52px
// rail, so the expand/collapse affordance is a tooltip ("Expand X"/
// "Collapse X") plus a small corner-triangle hint that only appears on
// hover — same reasoning as .nav-item__btn--rail-collapsed's own tooltip.
// The triangle sits at the row's own corner (not pinned to the icon), and
// flips 180deg once open so it reads as "collapse" rather than "expand".
// Children animate open/closed via a measured max-height (ref + scrollHeight)
// on `.nav-item__children` — the same class/transition NavItem's own
// children use in the expanded view, rather than a hardcoded row-count
// guess, since the divider that closes the group is measured along with it.
function RailAccordionRow({ entity, isOpen, isHighlighted, onToggle, activeId, onNavigateChild }) {
  const tooltip = `${isOpen ? 'Collapse' : 'Expand'} ${entity.label}`;
  const childrenRef = useRef(null);
  const [maxHeight, setMaxHeight] = useState(0);
  useLayoutEffect(() => {
    if (childrenRef.current) setMaxHeight(isOpen ? childrenRef.current.scrollHeight : 0);
  }, [isOpen, entity.children]);

  return (
    <div className="leftnav-alt__rail-group">
      <div className="nav-item">
        <button
          onClick={onToggle}
          data-tooltip={tooltip}
          aria-label={tooltip}
          aria-expanded={isOpen}
          className={`nav-item__btn nav-item__btn--rail-collapsed nav-item__btn--rail-expandable${isHighlighted ? ' nav-item__btn--active' : ''}`}
        >
          <RowIcon icon={entity.icon} iconNode={entity.iconNode} isActive={isHighlighted} />
          <svg className="nav-item__rail-caret" width="7" height="7" viewBox="0 0 7 7" aria-hidden="true">
            <path d="M0 0 L7 0 L0 7 Z" fill="currentColor" />
          </svg>
        </button>
      </div>
      <div className="nav-item__children" ref={childrenRef} style={{ maxHeight }}>
        {entity.children.map(c => (
          <Row key={c.id} label={c.label} icon={c.icon} iconNode={c.iconNode} isActive={activeId === c.id} onClick={() => onNavigateChild(c.id)} compact />
        ))}
        <div className="leftnav__divider" />
      </div>
    </div>
  );
}

function LeftNavAlt({ current, onNav, collapsed, onToggleCollapse, consoleActive = false, adminActiveSection, onAdminSelect }) {
  // activeParent covers a whole route family (e.g. any 'workspace/...' page
  // highlights the Workspace row, and auto-opens an Insights entity's own
  // accordion — see isOpen below); activeId is an exact leaf match, used for
  // every row that represents one precise destination (a group's children,
  // Knowledge Graph, Fabric items) — same two derivations LeftNav.jsx uses.
  // Unlike Options 1/3/4, Navigator's own row stays highlighted even on its
  // own home landing screen (no suppressActive) — this is the only nav
  // instance the user is on immediately after a fresh load, so leaving it
  // unhighlighted there read as "nothing shows I'm on this page."
  const activeParent = current?.split('/')[0];
  const activeId = current;

  // Each group header (Exposure, Discover, ... Fabric Configuration, admin
  // groups) collapses/expands its own rows independently — same
  // hover-reveal/persistent-while-collapsed chevron as LeftNav.jsx's
  // Insights/Fabric Configuration section labels (see SectionLabel).
  const [collapsedGroups, setCollapsedGroups] = useState(() => new Set());
  const toggleGroup = (key) => setCollapsedGroups(prev => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

  // Per-entity accordion open/closed override within Insights (independent
  // of collapsedGroups above, which only hides/shows the "Insights"
  // umbrella as a whole) — same mechanic as LeftNav.jsx's openOverrides.
  // Default (no entry) is "open iff this entity is the active section";
  // an explicit entry always wins, so a click can both preview-open an
  // inactive entity AND collapse the one you're actually on. Cleared
  // whenever the active top-level section changes, or on any
  // sidebar-driven navigation, so an override never lingers onto an
  // unrelated page later.
  const [openOverrides, setOpenOverrides] = useState(() => new Map());
  useEffect(() => { setOpenOverrides(new Map()); }, [activeParent]);

  const toggleOpen = (id) => setOpenOverrides(prev => {
    const next = new Map(prev);
    const isCurrentlyOpen = next.has(id) ? next.get(id) : activeParent === id;
    next.set(id, !isCurrentlyOpen);
    return next;
  });

  const isEntityOpen = (id) => (openOverrides.has(id) ? openOverrides.get(id) : activeParent === id);

  const navigate = (id, forceMode) => {
    setOpenOverrides(new Map());
    onNav(id, forceMode ? { forceMode } : undefined);
  };

  // Rail-collapsed Insights — same accordion shape as renderInsightsGroup
  // below (and the same openOverrides state, so expanding/collapsing the
  // sidebar never loses which entity was open), just icon-only. A leaf
  // entity (no children, e.g. Knowledge Graph) renders as a single Row like
  // any other compact destination. RailAccordionRow owns its own opening/
  // closing animation and trailing divider (see above).
  const renderCompactInsightsGroup = (items, forceMode) => items.map(item => {
    const hasChildren = item.children && item.children.length;
    if (!hasChildren) {
      const leaf = { id: item.navigateId ?? item.id, label: item.label, icon: item.icon, iconNode: item.iconNode };
      return <Row key={leaf.id} label={leaf.label} icon={leaf.icon} iconNode={leaf.iconNode} isActive={activeId === leaf.id} onClick={() => navigate(leaf.id, forceMode)} compact />;
    }
    const isOpen = isEntityOpen(item.id);
    return (
      <RailAccordionRow
        key={item.id}
        entity={item}
        isOpen={isOpen}
        isHighlighted={isOpen}
        onToggle={() => toggleOpen(item.id)}
        activeId={activeId}
        onNavigateChild={(id) => navigate(id, forceMode)}
      />
    );
  });

  const renderInsightsGroup = (items, forceMode) => items.map(item => (
    <NavItem
      key={item.id}
      item={item}
      isActiveParent={activeParent === item.id}
      activeChild={activeId}
      isOpen={isEntityOpen(item.id)}
      onToggle={() => toggleOpen(item.id)}
      onNav={(id) => navigate(id, forceMode)}
    />
  ));

  const renderAdminGroup = (group) => {
    const key = `admin:${group.label}`;
    const isCollapsed = collapsedGroups.has(key);
    return (
      <div className="leftnav-alt__group" key={group.label}>
        <SectionLabel label={group.label} isCollapsed={isCollapsed} onClick={() => toggleGroup(key)} />
        {!isCollapsed && group.items.map(item => (
          <Row key={item.id} label={item.label} iconNode={item.iconNode} isActive={adminActiveSection === item.id} onClick={() => onAdminSelect(item.id)} />
        ))}
      </div>
    );
  };

  const navContent = (
    <>
      <div className="leftnav__body">
        <Row label="Collapse sidebar" iconNode={<IcPanelToggle open={collapsed} />} onClick={onToggleCollapse} />
        <div className="leftnav__divider" />
        {consoleActive ? (
          ADMIN_NAV_GROUPS.map(renderAdminGroup)
        ) : (
          <>
            {TOP_ITEMS.map(item => (
              <React.Fragment key={item.id}>
                <Row
                  label={item.label}
                  icon={item.icon}
                  iconNode={item.iconNode}
                  isActive={activeParent === item.id}
                  onClick={() => navigate(item.navigateId ?? item.id)}
                />
                {item.dividerAfter && <div className="leftnav__divider" />}
              </React.Fragment>
            ))}

            <div className="leftnav-alt__group">
              <SectionLabel
                label="Insights"
                isCollapsed={collapsedGroups.has('insights')}
                onClick={() => toggleGroup('insights')}
                className="leftnav-alt__top-header"
              />
              {!collapsedGroups.has('insights') && renderInsightsGroup(INSIGHTS_MODEL, 'em')}
            </div>

            <div className="leftnav__divider" />
            <div className="leftnav-alt__group">
              <SectionLabel
                label="Fabric Configuration"
                isCollapsed={collapsedGroups.has('fabric')}
                onClick={() => toggleGroup('fabric')}
                className="leftnav-alt__top-header"
              />
              {!collapsedGroups.has('fabric') && FABRIC_MODEL.map(item => (
                <Row key={item.id} label={item.label} icon={item.icon} iconNode={item.iconNode} isActive={activeId === item.id} onClick={() => navigate(item.id, 'studio')} />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="leftnav__footer">
        <Row
          label={consoleActive ? 'EM Dashboard' : 'Console Panel'}
          iconNode={consoleActive ? <IcEMDashboard /> : <IcConsoleNav />}
          isActive={consoleActive}
          onClick={() => navigate(consoleActive ? 'admin-exit' : 'admin-page')}
        />
      </div>
    </>
  );

  // Whole-nav collapse (the Topbar toggle, same `collapsed` prop Option 1
  // hides behind) — instead of disappearing behind a hover-peek overlay like
  // Option 1, everything (top items, Insights, Fabric Configuration, footer)
  // renders as one persistent icon-only rail. No hover-peek needed here
  // since the rail is never actually hidden. Insights keeps the same
  // per-entity accordion shape as the expanded view — see
  // renderCompactInsightsGroup/RailAccordionRow above.
  const compactContent = (
    <>
      <div className="leftnav__body">
        <Row label="Expand sidebar" iconNode={<IcPanelToggle open={collapsed} />} onClick={onToggleCollapse} compact />
        <div className="leftnav__divider" />
        {consoleActive ? (
          ADMIN_NAV_GROUPS.flatMap(g => g.items).map(item => (
            <Row key={item.id} label={item.label} iconNode={item.iconNode} isActive={adminActiveSection === item.id} onClick={() => onAdminSelect(item.id)} compact />
          ))
        ) : (
          <>
            {TOP_ITEMS.map(item => (
              <Row key={item.id} label={item.label} icon={item.icon} iconNode={item.iconNode} isActive={activeParent === item.id} onClick={() => navigate(item.navigateId ?? item.id)} compact />
            ))}
            <div className="leftnav__divider" />
            {renderCompactInsightsGroup(INSIGHTS_MODEL, 'em')}
            <div className="leftnav__divider" />
            {FABRIC_MODEL.map(item => (
              <Row key={item.id} label={item.label} icon={item.icon} iconNode={item.iconNode} isActive={activeId === item.id} onClick={() => navigate(item.id, 'studio')} compact />
            ))}
          </>
        )}
      </div>

      <div className="leftnav__footer">
        <Row
          label={consoleActive ? 'EM Dashboard' : 'Console Panel'}
          iconNode={consoleActive ? <IcEMDashboard /> : <IcConsoleNav />}
          isActive={consoleActive}
          onClick={() => navigate(consoleActive ? 'admin-exit' : 'admin-page')}
          compact
        />
      </div>
    </>
  );

  return (
    <aside className={`leftnav${collapsed ? ' leftnav-alt--rail' : ''}`}>
      {collapsed ? compactContent : navContent}
    </aside>
  );
}

export default LeftNavAlt;

// Workspace's own section (Option 3 only) — same flat-header treatment as
// Insights, rendered inside whichever of Navigator/Fabric's panels is open
// (see the restructure comment above LeftNavOption3 below) rather than as
// its own always-visible section. Dashboards and Report Centre each route
// to a distinct type-locked view (see WorkspacePage.jsx's savedTypeLock) so
// exactly one highlights at a time — previously both routed to the same
// 'workspace/saved' page and always lit up together.
const WORKSPACE_ROWS = [
  { id: 'workspace-dashboards',    type: 'dashboards', label: 'Dashboards',    iconNode: <IcEMDashboard /> },
  { id: 'workspace-report-centre', type: 'reports',    label: 'Report Centre', iconNode: <IcSummaryNav /> },
];

// Static stand-in for NavigatorPage.jsx's own Starred/History split
// (RECENT_CHATS) — same data, same starred/non-starred split NavSidebar
// itself computes, so the inline panel below reads as an exact preview of
// the real sidebar rather than a different dataset.
const NAV_STARRED_CHATS = RECENT_CHATS.filter(c => c.starred);
const NAV_RECENT_CHATS = RECENT_CHATS.filter(c => !c.starred).slice(0, 6);

// Mirrors NavigatorPage.jsx's own IcHistory/IcBot (private to that file, not
// exported) so the "View all conversations"/"View all agents" buttons below
// can reuse the exact same glyphs without importing a page component's
// internals. Starred/History/Agents no longer carry a header icon (see
// below), so IcStarNav/IcAddSmall have no remaining caller.
function IcHistoryNav() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 3v5h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 7v5l4 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function IcAgentsNav() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="9" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M9 9V6a3 3 0 0 1 6 0v3" stroke="currentColor" strokeWidth="1.6"/>
      <circle cx="9" cy="14.5" r="1.2" fill="currentColor"/>
      <circle cx="15" cy="14.5" r="1.2" fill="currentColor"/>
      <path d="M2 13h2M20 13h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}

// EM product mark — Fabric's own row icon (see the restructure comment
// below). Copied verbatim from public/assets/logo/EM logo white.svg and
// inlined (rather than <img src>) so it picks up currentColor tinting the
// same way as this file's other inline-SVG icons.
function IcEMLogoNav() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M13.2007 9.02099C12.7652 9.4565 12.7652 10.1626 13.2007 10.5981C13.6362 11.0336 14.3423 11.0336 14.7778 10.5981C15.2133 10.1626 15.2133 9.4565 14.7778 9.02099C14.3423 8.58547 13.6362 8.58547 13.2007 9.02099Z" fill="currentColor"/>
      <path d="M13.3416 16.9992C12.7949 17.546 12.7949 18.4324 13.3416 18.9791C13.8883 19.5259 14.7748 19.5259 15.3215 18.9791C15.8682 18.4324 15.8682 17.546 15.3215 16.9992C14.7748 16.4525 13.8883 16.4525 13.3416 16.9992Z" fill="currentColor"/>
      <path d="M9.08772 12.7839C8.31448 13.5571 8.31448 14.8108 9.08772 15.584C9.86096 16.3572 11.1146 16.3572 11.8879 15.584C12.6611 14.8108 12.6611 13.5571 11.8879 12.7839C11.1146 12.0106 9.86096 12.0106 9.08772 12.7839Z" fill="currentColor"/>
      <path d="M5.07391 8.76325C4.20948 9.62768 4.20942 11.0293 5.07385 11.8937C5.93828 12.7581 7.33986 12.7581 8.20429 11.8936C9.06873 11.0292 9.06878 9.62762 8.20435 8.76319C7.33992 7.89876 5.93834 7.89882 5.07391 8.76325Z" fill="currentColor"/>
      <path d="M13.304 1.65352C12.7573 2.20026 12.7573 3.08669 13.304 3.63342C13.8507 4.18016 14.7372 4.18016 15.2839 3.63342C15.8306 3.08669 15.8306 2.20026 15.2839 1.65352C14.7372 1.10679 13.8507 1.10679 13.304 1.65352Z" fill="currentColor"/>
      <path d="M9.04524 4.56511C8.272 5.33835 8.272 6.59202 9.04524 7.36525C9.81848 8.13849 11.0721 8.13849 11.8454 7.36525C12.6186 6.59202 12.6186 5.33835 11.8454 4.56511C11.0721 3.79187 9.81848 3.79187 9.04524 4.56511Z" fill="currentColor"/>
    </svg>
  );
}

// Option 4 (LeftNavOption3, navDesign 'renamed') — restructured to exactly
// two toggleable top rows, Navigator and Fabric. Fabric replaces the old
// always-visible Insights/Fabric Configuration flat sections and carries
// the EM product mark as its own row icon. Clicking either is an accordion
// toggle: a single openGroup value is the source of truth, so opening one
// implicitly closes the other — no separate "collapse the other side" step
// to keep in sync, unlike the old three-independent-collapsedSections model.
//
// Row order is fixed: Navigator, Fabric, a divider, then the "Workspace"
// section (Dashboards/Report Centre) — rendered once, not owned by either
// group and not gated by openGroup — then a second divider, then whichever
// group's own content (fabricSection or navigatorSection) is currently
// open. Picking a Workspace row locks the Saved/Templates workspace views
// to just that type (see SavedPage.jsx/LibraryPage.jsx's `typeLock` prop)
// instead of the usual All/Dashboards/Reports pill filter, which is hidden
// while locked.
//
// Starred/History/Agents (Navigator's panel) and Configuration (Fabric's
// panel) share one section treatment — a plain SectionLabel header (no
// icon) over flat Row children — rather than Starred/History/Agents' old
// np-history-section-title icon+label headers and multi-line
// np-history-chat-row/-agent-row children. Workspace and Insights instead
// render through NavItem, the same icon+chevron accordion component button
// 1 (LeftNav.jsx) uses for its own Insights/Fabric Configuration groups, so
// Exposure/Discover/Report/Data Quality nest their children exactly like
// button 1 rather than the old Option 3 flattened single-level list.
function LeftNavOption3({ current, onNav, collapsed, hoverPeek = false, onHoverEnter, onHoverLeave, consoleActive = false, adminActiveSection, onAdminSelect, navigatorAtHome = false }) {
  const suppressActive = navigatorAtHome && current === 'navigator';
  const activeParent = suppressActive ? null : current?.split('/')[0];
  const activeId = suppressActive ? null : current;
  const routeParent = current?.split('/')[0];

  const insightsIds = new Set(INSIGHTS_MODEL.map(e => e.id));
  const fabricIds = new Set(FABRIC_MODEL.map(f => f.id));
  // Workspace routes have no group of their own — they default into
  // Fabric's panel, the same side as the rest of the data/config surface,
  // rather than Navigator's chat surface.
  const groupOf = (parent) => parent === 'navigator' ? 'navigator'
    : (insightsIds.has(parent) || fabricIds.has(parent) || parent === 'workspace') ? 'fabric'
    : null;

  // Seeded from the page this instance mounts on — App.jsx and
  // WorkspacePage.jsx each render their own separate ActiveLeftNav instance,
  // so navigating between their two trees unmounts this component and
  // mounts a fresh one; without this, whichever panel a row click just
  // opened would be lost the instant the new instance mounts.
  const [openGroup, setOpenGroup] = useState(() => groupOf(routeParent) ?? 'fabric');
  const toggleGroup = (kind) => setOpenGroup(prev => (prev === kind ? null : kind));

  // Independent collapse for the sub-sections nested inside whichever panel
  // is open (Insights/Configuration under Fabric; Starred/History/Agents
  // under Navigator) — same collapsedSections mechanism LeftNav.jsx uses for
  // its own section headers. All default open, except Workspace auto-
  // collapses while Navigator is the active group (see the effect below) —
  // Workspace's own two rows are chat-irrelevant, so keeping them open here
  // just pushes New chat/Starred/History further down for no reason.
  const [collapsedSections, setCollapsedSections] = useState(() => (
    (groupOf(routeParent) ?? 'fabric') === 'navigator' ? new Set(['workspace']) : new Set()
  ));
  const toggleSection = (key) => setCollapsedSections(prev => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

  // Re-derives Workspace's collapse on every openGroup change (including a
  // manual re-click of the same row, which toggleGroup can also null out) —
  // a user-driven expand/collapse via Workspace's own SectionLabel chevron
  // still works in between, since this only re-asserts the default at the
  // moment openGroup itself changes, not on every render.
  useEffect(() => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (openGroup === 'navigator') next.add('workspace'); else next.delete('workspace');
      return next;
    });
  }, [openGroup]);

  const navigate = (id, forceMode) => onNav(id, forceMode ? { forceMode } : undefined);

  const handleTopRowClick = (kind) => {
    toggleGroup(kind);
    if (kind === 'navigator') navigate('navigator-page');
  };

  // Per-entity accordion open/closed override within Insights — same
  // mechanic as LeftNavAlt's (Option 2) own openOverrides: default (no
  // entry) is "open iff this entity is the active section," an explicit
  // entry always wins, cleared whenever the active top-level section
  // changes so an override never lingers onto an unrelated page later.
  const [entityOverrides, setEntityOverrides] = useState(() => new Map());
  useEffect(() => { setEntityOverrides(new Map()); }, [activeParent]);
  const toggleEntity = (id) => setEntityOverrides(prev => {
    const next = new Map(prev);
    const isCurrentlyOpen = next.has(id) ? next.get(id) : activeParent === id;
    next.set(id, !isCurrentlyOpen);
    return next;
  });
  const isEntityOpen = (id) => (entityOverrides.has(id) ? entityOverrides.get(id) : activeParent === id);

  // Which of the two Workspace rows reads as selected — true regardless of
  // whether the user is on the Saved or Templates tab, since typeLock
  // travels as a route suffix on both (see WorkspacePage.jsx).
  const isWorkspaceTypeActive = (type) => activeParent === 'workspace'
    && (current === `workspace/saved-${type}` || current === `workspace/library-${type}`);

  // Workspace and Insights render through the same NavItem component Option
  // 1 (LeftNav.jsx) uses — icon + label + chevron, nested children that
  // accordion open/closed — instead of the flat single-line Row rows used
  // elsewhere in this file, so both look and behave identically to button 1.
  // Workspace's two rows have no children of their own, so they render as
  // NavItem leaves (isOpen/onToggle are no-ops for a leaf).
  const workspaceItems = WORKSPACE_ROWS.map(r => ({ ...r, navigateId: `workspace/saved-${r.type}` }));

  // Fixed, non-toggled — sits between the two rail rows and whichever
  // group's content is open below it, rather than being duplicated inside
  // each of fabricSection/navigatorSection.
  const workspaceSection = (
    <>
      <SectionLabel label="Workspace" isCollapsed={collapsedSections.has('workspace')} onClick={() => toggleSection('workspace')} />
      {!collapsedSections.has('workspace') && workspaceItems.map(item => (
        <NavItem
          key={item.id}
          item={item}
          isActiveParent={isWorkspaceTypeActive(item.type)}
          activeChild={null}
          isOpen={false}
          onToggle={() => {}}
          onNav={(id) => navigate(id)}
        />
      ))}
    </>
  );

  const fabricSection = (
    <>
      <SectionLabel label="Insights" isCollapsed={collapsedSections.has('insights')} onClick={() => toggleSection('insights')} />
      {!collapsedSections.has('insights') && INSIGHTS_MODEL.map(item => (
        <NavItem
          key={item.id}
          item={item}
          isActiveParent={activeParent === item.id}
          activeChild={activeId}
          isOpen={isEntityOpen(item.id)}
          onToggle={() => toggleEntity(item.id)}
          onNav={(id) => navigate(id, 'em')}
        />
      ))}

      <div className="leftnav__divider" />
      <SectionLabel label="Configuration" isCollapsed={collapsedSections.has('configuration')} onClick={() => toggleSection('configuration')} />
      {!collapsedSections.has('configuration') && FABRIC_MODEL.map(item => (
        <Row key={item.id} label={item.label} icon={item.icon} iconNode={item.iconNode} isActive={activeId === item.id} onClick={() => navigate(item.id, 'studio')} />
      ))}
    </>
  );

  const navigatorSection = (
    <>
      <div className="np-history-hdr">
        <button className="np-history-new-btn" onClick={() => navigate('navigator-page')}>
          <IcNewChat /> New chat
        </button>
      </div>

      {NAV_STARRED_CHATS.length > 0 && (
        <>
          <SectionLabel label="Starred" isCollapsed={collapsedSections.has('starred')} onClick={() => toggleSection('starred')} />
          {!collapsedSections.has('starred') && NAV_STARRED_CHATS.map(c => (
            <Row key={c.id} label={c.label} onClick={() => navigate('navigator-page')} />
          ))}
          <div className="leftnav__divider" />
        </>
      )}

      <SectionLabel label="History" isCollapsed={collapsedSections.has('history')} onClick={() => toggleSection('history')} />
      {!collapsedSections.has('history') && (
        <>
          {NAV_RECENT_CHATS.map(c => (
            <Row key={c.id} label={c.label} onClick={() => navigate('navigator-page')} />
          ))}
          <button className="np-history-viewall" onClick={() => navigate('navigator-page')}>
            <IcHistoryNav /> View all conversations
          </button>
        </>
      )}

      <div className="leftnav__divider" />
      <SectionLabel label="Agents" isCollapsed={collapsedSections.has('agents')} onClick={() => toggleSection('agents')} />
      {!collapsedSections.has('agents') && (
        <>
          {AGENTS.map(a => (
            <Row key={a.id} label={a.name} iconNode={<IcAgentDot color={a.color} />} onClick={() => navigate('navigator-page')} />
          ))}
          <button className="np-history-viewall" onClick={() => navigate('navigator-page')}>
            <IcAgentsNav /> View all agents
          </button>
        </>
      )}
    </>
  );

  const renderAdminGroup = (group) => {
    const key = `admin:${group.label}`;
    const isCollapsed = collapsedSections.has(key);
    return (
      <div className="leftnav-alt__group" key={group.label}>
        <SectionLabel label={group.label} isCollapsed={isCollapsed} onClick={() => toggleSection(key)} />
        {!isCollapsed && group.items.map(item => (
          <Row key={item.id} label={item.label} iconNode={item.iconNode} isActive={adminActiveSection === item.id} onClick={() => onAdminSelect(item.id)} />
        ))}
      </div>
    );
  };

  const navContent = (
    <>
      <div className="leftnav__body">
        {consoleActive ? (
          ADMIN_NAV_GROUPS.map(renderAdminGroup)
        ) : (
          <>
            <Row
              label="Navigator"
              iconNode={<img src="assets/icons/Navigator icon.svg" width={16} height={16} alt="" />}
              isActive={openGroup === 'navigator'}
              onClick={() => handleTopRowClick('navigator')}
            />
            <Row
              label="Fabric"
              iconNode={<IcEMLogoNav />}
              isActive={openGroup === 'fabric'}
              onClick={() => handleTopRowClick('fabric')}
            />
            <div className="leftnav__divider" />

            <div className="leftnav-alt__group">
              {workspaceSection}
            </div>
            <div className="leftnav__divider" />

            <div className="leftnav-alt__group leftnav-alt__inline-panel">
              {openGroup === 'fabric' && fabricSection}
              {openGroup === 'navigator' && navigatorSection}
            </div>
          </>
        )}
      </div>

      <div className="leftnav__footer">
        <Row
          label={consoleActive ? 'EM Dashboard' : 'Console Panel'}
          iconNode={consoleActive ? <IcEMDashboard /> : <IcConsoleNav />}
          isActive={consoleActive}
          onClick={() => navigate(consoleActive ? 'admin-exit' : 'admin-page')}
        />
      </div>
    </>
  );

  return (
    <>
      <aside className={`leftnav${collapsed ? ' leftnav--collapsed' : ''}`} aria-hidden={collapsed}>
        {navContent}
      </aside>

      {collapsed && !hoverPeek && (
        <div className="leftnav__hover-zone" onMouseEnter={onHoverEnter} aria-hidden="true" />
      )}
      {collapsed && hoverPeek && (
        <aside className="leftnav leftnav--peek" onMouseEnter={onHoverEnter} onMouseLeave={onHoverLeave}>
          {navContent}
        </aside>
      )}
    </>
  );
}

// Fabric Configuration has no navbar-*.svg asset of its own (its four leaf
// items each carry their own icon instead) — a small inline glyph, same
// stroke weight/style as LeftNav.jsx's IcPipelineNav/IcOntologyNav/etc.,
// stands in as the category icon for Option 4's rail.
function IcFabricNav() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.6"/>
      <rect x="13" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.6"/>
      <rect x="3" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.6"/>
      <rect x="13" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.6"/>
    </svg>
  );
}

// Workspace/Insights render via their shared navbar-*.svg assets everywhere
// else (RowIcon's masked-span branch, shell.css's .nav-item__icon--masked —
// background-color clipped by the asset's alpha channel), but confirmed
// empirically that recolor silently fails for those two specific assets:
// selected state renders the asset's own baked-in stroke/fill color (near-
// black for navbar-workspace.svg, its own pre-set #6360D8 for insights.svg)
// instead of picking up --shell-accent, so it never visibly changes color
// against Fabric/Navigator's neighboring rail icons, which use inline
// currentColor SVGs (IcFabricNav, the Navigator img) and tint correctly.
// Inlined here with the same currentColor convention rather than fixing the
// shared masking mechanism itself, since TOP_ITEMS/INSIGHTS_MODEL feed the
// exact same two assets into every other nav option's own Row rendering —
// scoping the fix to this rail's own RAIL_ITEMS avoids touching how
// Options 1/3/4 render Workspace/Insights elsewhere.
function IcWorkspaceNav() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2.49854 5.79059V3.48059C2.49854 3.20445 2.72239 2.98059 2.99854 2.98059H5.30615C5.58229 2.98059 5.80615 3.20445 5.80615 3.48059V5.79059C5.80615 6.06673 5.58229 6.29059 5.30615 6.29059H2.99854C2.72239 6.29059 2.49854 6.06673 2.49854 5.79059Z" stroke="currentColor" strokeLinecap="round"/>
      <path d="M10.1938 11.0584V8.74841C10.1938 8.47227 10.4177 8.24841 10.6938 8.24841H13.0015C13.2776 8.24841 13.5015 8.47227 13.5015 8.74841V11.0584C13.5015 11.3346 13.2776 11.5584 13.0015 11.5584H10.6938C10.4177 11.5584 10.1938 11.3346 10.1938 11.0584Z" stroke="currentColor" strokeLinecap="round"/>
      <path d="M7.78076 5.79059V3.48059C7.78076 3.20445 8.00462 2.98059 8.28076 2.98059H13.0015C13.2776 2.98059 13.5015 3.20445 13.5015 3.48059V5.79059C13.5015 6.06673 13.2776 6.29059 13.0015 6.29059H8.28076C8.00462 6.29059 7.78076 6.06673 7.78076 5.79059Z" stroke="currentColor" strokeLinecap="round"/>
      <path d="M2.49854 12.5194V8.74841C2.49854 8.47227 2.72239 8.24841 2.99854 8.24841H7.71924C7.99538 8.24841 8.21924 8.47227 8.21924 8.74841V12.5194C8.21924 12.7956 7.99538 13.0194 7.71924 13.0194H2.99854C2.72239 13.0194 2.49854 12.7956 2.49854 12.5194Z" stroke="currentColor" strokeLinecap="round"/>
    </svg>
  );
}

function IcInsightsNav() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M9.63658 6.63634L10.1493 5.50722L11.273 4.99993L10.1493 4.49265L9.63658 3.36353L9.13474 4.49265L8.00017 4.99993L9.13474 5.50722L9.63658 6.63634ZM3.36367 7.72728L3.63641 6.63634L4.72735 6.36361L3.63641 6.09087L3.36367 4.99993L3.09094 6.09087L2 6.36361L3.09094 6.63634L3.36367 7.72728Z" fill="currentColor"/>
      <circle cx="3.08758" cy="11.5488" r="1.08758" fill="currentColor"/>
      <circle cx="6.91277" cy="7.72723" r="1.08758" fill="currentColor"/>
      <circle cx="9.62713" cy="10.4511" r="1.08758" fill="currentColor"/>
      <circle cx="12.9128" cy="7.17828" r="1.08758" fill="currentColor"/>
      <path d="M3.3291 11.2961L6.91895 7.70642L9.65839 10.4589L12.9944 7.07214" stroke="currentColor" strokeLinecap="round"/>
    </svg>
  );
}

function IcNewChat() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// Per-agent dynamic color as an SVG fill prop, not a style prop — same
// convention as NavigatorPanel.jsx's own AgentIcon.
function IcAgentDot({ color }) {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true">
      <circle cx="4" cy="4" r="4" fill={color} />
    </svg>
  );
}

// Option 4 — persistent 4-icon rail (Navigator, Workspace, Insights, Fabric
// Configuration) with a collapsible contextual panel to its right, instead
// of every destination living in the rail/nav column itself like Options
// 1-3. Clicking a rail icon is an accordion toggle (Row's `compact` tooltip
// treatment, same as Option 2's rail): a second click on the same icon, or a
// click on a different one, both resolve through one setOpenSection call.
// Navigator/Workspace are real destinations so their rail click also
// navigates; Insights/Fabric Configuration are categories only — clicking
// them just opens the panel, same as their (non-clickable) SectionLabel
// headers in Options 1-3.
//
// `collapsed` (the Topbar pin/unpin toggle) hides the whole rail+panel and
// shows a hover-peek instead, the same contract Options 1/3 use — Option 4
// has no separate "full labeled nav" state the way Option 2 does, since the
// rail is icon-only by design here, not just while collapsed.
//
// lastSection (vs. openSection) keeps the most recently viewed panel's
// content mounted through the close transition — the width is what
// animates to 0 (see .leftnav-split__panel in leftNavAlt.css); dropping the
// content the instant openSection clears would make it vanish before the
// width had a chance to visibly collapse.
// Panel width states — full 240px (same as .leftnav-split__panel--open in
// leftNavAlt.css) or a 12px drag-collapsed sliver (Teams' own channel-list
// collapse pattern: a thin handle strip, not a full close, so whatever
// section was open stays selected and reopens exactly where it left off).
const PANEL_WIDTH = 240;
const PANEL_COLLAPSED_WIDTH = 12;

function LeftNavSplit({ current, onNav, collapsed, hoverPeek = false, onHoverEnter, onHoverLeave, consoleActive = false, adminActiveSection, onAdminSelect, navigatorAtHome = false }) {
  const suppressActive = navigatorAtHome && current === 'navigator';
  const activeParent = suppressActive ? null : current?.split('/')[0];
  const activeId = suppressActive ? null : current;

  const insightsIds = new Set(INSIGHTS_MODEL.map(e => e.id));
  const fabricIds = new Set(FABRIC_MODEL.map(f => f.id));
  const kindOf = (parent) => parent === 'navigator' ? 'navigator'
    : parent === 'workspace' ? 'workspace'
    : insightsIds.has(parent) ? 'insights'
    : fabricIds.has(parent) ? 'fabric'
    : null;
  const activeKind = kindOf(activeParent);

  // Seeded from the page this instance mounts on, not hardcoded closed —
  // App.jsx and WorkspacePage.jsx each render their own separate
  // ActiveLeftNav instance (see WorkspacePage.jsx's own <ActiveLeftNav>),
  // so navigating from an App.jsx-rendered page into Workspace (or into
  // Navigator, also App.jsx-rendered but a separate branch) unmounts this
  // component and mounts a fresh one there; without this, the panel state
  // set by handleRailClick right before that navigation is lost the
  // instant the new instance mounts. Opening to match the active section
  // on mount also means the panel reflects wherever the user actually
  // lands (e.g. a direct link into a Report page), not just rail clicks.
  // Seeded from `current` directly rather than `activeKind` — the latter
  // is null on Navigator's suppressed home landing (navigatorAtHome), which
  // would otherwise leave the history panel closed right after a rail
  // click into Navigator just because that landing screen suppresses the
  // rail icon's own highlight.
  const seedKind = kindOf(current?.split('/')[0]);
  const [openSection, setOpenSection] = useState(() => seedKind);
  const [lastSection, setLastSection] = useState(() => seedKind);

  const navigate = (id, forceMode) => onNav(id, forceMode ? { forceMode } : undefined);

  const RAIL_ITEMS = [
    { kind: 'navigator', label: 'Navigator', iconNode: <img src="assets/icons/Navigator icon.svg" width={16} height={16} alt="" /> },
    { kind: 'workspace',  label: 'Workspace', iconNode: <IcWorkspaceNav /> },
    { kind: 'insights',   label: 'Insights',  iconNode: <IcInsightsNav /> },
    { kind: 'fabric',     label: 'Fabric Configuration', iconNode: <IcFabricNav /> },
  ];

  // Re-clicking the already-active rail icon used to null out openSection
  // entirely, snapping the panel to width:0 — a different, more abrupt
  // collapse than the panel's own collapse icon/drag handle (both of which
  // only flip panelCollapsed, leaving openSection/lastSection alone so the
  // section's content is still there the instant it reopens). Now it does
  // the same thing they do: a rail click should never make the whole
  // navigation pane disappear, only minimize it to the sliver.
  const toggleSection = (kind) => {
    if (openSection === kind) {
      setPanelCollapsed(prev => !prev);
      return;
    }
    setOpenSection(kind);
    setLastSection(kind);
    setPanelCollapsed(false);
  };

  // Drag-to-collapse — mirrors NavigatorPanel.jsx's own ResizeHandle
  // (global mousemove/mouseup, col-resize cursor, userSelect suppressed
  // mid-drag) but snaps to one of two widths on release instead of tracking
  // an arbitrary size: past the halfway point it settles collapsed
  // (PANEL_COLLAPSED_WIDTH), short of it it springs back open (PANEL_WIDTH).
  // panelCollapsed is deliberately separate from openSection/lastSection —
  // collapsing is a purely visual minimize, not a deselect, so the same
  // section's content is still there the moment it's dragged/clicked back
  // open (see the sliver handle in innerContent below).
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [dragWidth, setDragWidth] = useState(null);

  const handlePanelResizeStart = (e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = panelCollapsed ? PANEL_COLLAPSED_WIDTH : PANEL_WIDTH;
    const clamp = (w) => Math.max(PANEL_COLLAPSED_WIDTH, Math.min(PANEL_WIDTH, w));
    const onMove = (ev) => setDragWidth(clamp(startWidth + (ev.clientX - startX)));
    const onUp = (ev) => {
      setPanelCollapsed(clamp(startWidth + (ev.clientX - startX)) < PANEL_WIDTH / 2);
      setDragWidth(null);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  // Which rail icon actually reads as selected: the open panel's own kind
  // takes priority over the route (insights/fabric rail clicks only open a
  // panel, they never navigate, so activeKind alone would keep highlighting
  // whatever page was active before the click instead of the panel now
  // showing). Falls back to the route-based activeKind once the panel is
  // fully closed. Unlike Options 1/3, the navigator-home-landing suppression
  // does NOT apply here — the rail icon is the only persistent indicator of
  // which section's panel is open, so it needs to read as selected the
  // moment Navigator's panel is showing, home screen or not (same reasoning
  // as Option 2's own un-suppressed Navigator row, see LeftNavAlt above).
  const isRailActive = (kind) => (openSection ?? activeKind) === kind;

  const handleRailClick = (kind) => {
    toggleSection(kind);
    if (kind === 'navigator') navigate('navigator-page');
    if (kind === 'workspace') navigate('workspace');
  };

  const savedDashboards = SAVED_ROWS.filter(r => r.type === 'DASHBOARD').slice(0, 8);
  const savedReports = SAVED_ROWS.filter(r => r.type === 'REPORT').slice(0, 8);

  const railContent = (
    <>
      <div className="leftnav__body">
        {consoleActive ? (
          ADMIN_NAV_GROUPS.flatMap(g => g.items).map(item => (
            <Row key={item.id} label={item.label} iconNode={item.iconNode} isActive={adminActiveSection === item.id} onClick={() => onAdminSelect(item.id)} compact />
          ))
        ) : (
          RAIL_ITEMS.map(item => (
            <Row
              key={item.kind}
              label={item.label}
              icon={item.icon}
              iconNode={item.iconNode}
              isActive={isRailActive(item.kind)}
              onClick={() => handleRailClick(item.kind)}
              compact
            />
          ))
        )}
      </div>

      <div className="leftnav__footer">
        <Row
          label={consoleActive ? 'EM Dashboard' : 'Console Panel'}
          iconNode={consoleActive ? <IcEMDashboard /> : <IcConsoleNav />}
          isActive={consoleActive}
          onClick={() => navigate(consoleActive ? 'admin-exit' : 'admin-page')}
          compact
        />
      </div>
    </>
  );

  const panelBody = () => {
    if (lastSection === 'navigator') {
      // Standing in for NavSidebar's New chat/History/Agents (NavigatorPage.jsx)
      // — that sidebar is suppressed while navDesign is 'split' (see
      // NavigatorPage.jsx's `hideOwnSidebar`) so this panel is the only place
      // those live, rather than the two rendering side by side. It's a
      // preview/launcher over the same static data, not the real thing: every
      // row still just opens Navigator's current session rather than
      // selecting/renaming/starring that exact past chat or running that
      // exact agent — doing that for real would need chats/agents state (both
      // owned by NavigatorPage's own component tree) threaded across to this
      // component, which sits outside it under App.jsx/WorkspacePage.jsx.
      return (
        <>
          <button className="leftnav-split__newchat" onClick={() => navigate('navigator-page')}>
            <IcNewChat /> New chat
          </button>
          <div className="leftnav-split__group-title">History</div>
          {CHAT_HISTORY.map(c => (
            <button
              key={c.id}
              className={`leftnav-split__row${c.active ? ' leftnav-split__row--active' : ''}`}
              onClick={() => navigate('navigator-page')}
            >
              <span className="leftnav-split__row-label">{c.label}</span>
              <span className="leftnav-split__row-meta">{c.time}</span>
            </button>
          ))}
          <div className="leftnav-split__group-title">Agents</div>
          {AGENTS.map(a => (
            <button key={a.id} className="leftnav-split__row" onClick={() => navigate('navigator-page')}>
              <IcAgentDot color={a.color} />
              <span className="leftnav-split__row-label">{a.name}</span>
            </button>
          ))}
        </>
      );
    }
    if (lastSection === 'workspace') {
      return (
        <>
          <div className="leftnav-split__group">
            <div className="leftnav-split__group-title">Dashboards</div>
            {savedDashboards.map(row => (
              <button key={row.id} className="leftnav-split__row" onClick={() => navigate('workspace/saved')}>
                <span className="leftnav-split__row-label">{row.name}</span>
              </button>
            ))}
          </div>
          <div className="leftnav-split__group">
            <div className="leftnav-split__group-title">Report Centre</div>
            {savedReports.map(row => (
              <button key={row.id} className="leftnav-split__row" onClick={() => navigate('workspace/saved')}>
                <span className="leftnav-split__row-label">{row.name}</span>
              </button>
            ))}
          </div>
          <button className="leftnav-split__viewall" onClick={() => navigate('workspace/saved')}>View all saved</button>
          <button className="leftnav-split__viewall" onClick={() => navigate('workspace/library')}>Templates library</button>
        </>
      );
    }
    if (lastSection === 'insights') {
      return INSIGHTS_MODEL.map(entity => {
        const rows = entity.children?.length
          ? entity.children
          : [{ id: entity.navigateId ?? entity.id, label: entity.label, icon: entity.icon, iconNode: entity.iconNode }];
        return (
          <div className="leftnav-split__group" key={entity.id}>
            <div className="leftnav-split__group-title">{entity.label}</div>
            {rows.map(r => {
              const active = activeId === r.id;
              return (
                <button
                  key={r.id}
                  className={`leftnav-split__row${active ? ' leftnav-split__row--active' : ''}`}
                  onClick={() => navigate(r.id, 'em')}
                >
                  <RowIcon icon={r.icon} iconNode={r.iconNode} isActive={active} />
                  <span className="leftnav-split__row-label">{r.label}</span>
                </button>
              );
            })}
          </div>
        );
      });
    }
    if (lastSection === 'fabric') {
      return FABRIC_MODEL.map(item => {
        const active = activeId === item.id;
        return (
          <button
            key={item.id}
            className={`leftnav-split__row${active ? ' leftnav-split__row--active' : ''}`}
            onClick={() => navigate(item.id, 'studio')}
          >
            <RowIcon icon={item.icon} iconNode={item.iconNode} isActive={active} />
            <span className="leftnav-split__row-label">{item.label}</span>
          </button>
        );
      });
    }
    return null;
  };

  const isOpen = openSection !== null;
  const panelLabel = RAIL_ITEMS.find(i => i.kind === lastSection)?.label;
  const panelWidth = !isOpen ? 0 : (dragWidth ?? (panelCollapsed ? PANEL_COLLAPSED_WIDTH : PANEL_WIDTH));

  // A `--panel-open` modifier on the wrapper shifts the rail's own hover
  // tooltip (.nav-item__btn--rail-collapsed::after, leftNavAlt.css) past
  // the panel's right edge instead of over it — that tooltip is
  // position:fixed at a hardcoded left offset tuned for Option 2, where
  // nothing but main content sits to the rail's right; Option 4's panel
  // otherwise renders directly underneath it while open.
  const innerContent = (
    <>
      <aside className="leftnav leftnav-alt--rail">{railContent}</aside>
      <aside
        className={`leftnav-split__panel${isOpen ? ' leftnav-split__panel--open' : ''}${panelCollapsed ? ' leftnav-split__panel--collapsed' : ''}${dragWidth !== null ? ' leftnav-split__panel--dragging' : ''}`}
        style={isOpen ? { width: panelWidth } : undefined}
      >
        {panelCollapsed ? (
          <button
            type="button"
            className="leftnav-split__panel-handle"
            onMouseDown={handlePanelResizeStart}
            onClick={() => setPanelCollapsed(false)}
            data-tooltip="Select or drag to expand"
            aria-label={`Expand ${panelLabel} panel`}
          >
            <span className="leftnav-split__panel-grip" aria-hidden="true" />
          </button>
        ) : (
          <div className="leftnav-split__panel-inner">
            <div className="leftnav-split__panel-header">
              <span className="leftnav-split__panel-title">{panelLabel}</span>
              <button className="leftnav-split__panel-collapse" onClick={() => setPanelCollapsed(true)} data-tooltip="Collapse sidebar" aria-label="Collapse sidebar">
                <IcPanelToggle open={false} size={18} />
              </button>
            </div>
            <div className="leftnav-split__panel-body">
              {panelBody()}
            </div>
          </div>
        )}
        {isOpen && !panelCollapsed && (
          <div
            className="leftnav-split__panel-resizer"
            onMouseDown={handlePanelResizeStart}
            role="separator"
            aria-label="Drag to collapse panel"
            title="Drag to collapse"
          />
        )}
      </aside>
    </>
  );
  const wrapperClass = `leftnav-split${isOpen ? ' leftnav-split--panel-open' : ''}`;

  return (
    <>
      {!collapsed && <div className={wrapperClass}>{innerContent}</div>}

      {collapsed && !hoverPeek && (
        <div className="leftnav__hover-zone" onMouseEnter={onHoverEnter} aria-hidden="true" />
      )}
      {collapsed && hoverPeek && (
        <div className={`${wrapperClass} leftnav-split--peek`} onMouseEnter={onHoverEnter} onMouseLeave={onHoverLeave}>
          {innerContent}
        </div>
      )}
    </>
  );
}

// Picks Option 1 (LeftNav), Option 2 (LeftNavAlt), Option 3
// (LeftNavOption3), or Option 4 (LeftNavSplit) by the shared `navDesign`
// setting — the one place that needs to know all four designs exist, so
// call sites (App.jsx, WorkspacePage.jsx) don't each repeat the same branch.
export function ActiveLeftNav({ navDesign, ...props }) {
  if (navDesign === 'rail') return <LeftNavAlt {...props} />;
  if (navDesign === 'renamed') return <LeftNavOption3 {...props} />;
  if (navDesign === 'split') return <LeftNavSplit {...props} />;
  return <LeftNav {...props} />;
}
