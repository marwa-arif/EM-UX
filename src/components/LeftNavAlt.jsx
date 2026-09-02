import React, { useState, useEffect, useRef } from 'react'
import { SectionLabel, NavItem, TOP_ITEMS, INSIGHTS_MODEL, FABRIC_MODEL } from './LeftNav.jsx'
import { ADMIN_NAV_GROUPS } from '../pages/admin/AdminPanelBody.jsx'

// Shared three-way icon treatment (masked/accent-tinted when active, plain
// img otherwise, or a literal iconNode for inline-SVG icons) — used by both
// Row's rail buttons and RailFlyoutRow.
// isActive = this row IS the selected destination (purple/accent mask).
// isSectionActive = this row is an ancestor of the selected destination
// (e.g. a rail accordion header whose child is selected) — same dark/full-
// opacity treatment NavItem's own isExpanded uses in the expanded view, not
// the accent tint, so only the one exact destination reads as "selected".
function RowIcon({ icon, iconNode, isActive, isSectionActive }) {
  if (iconNode) {
    return <span className={`nav-item__icon${isActive ? ' nav-item__icon--selected' : isSectionActive ? ' nav-item__icon--active' : ''}`}>{iconNode}</span>;
  }
  if (!icon) return null;
  return isActive ? (
    <span
      className="nav-item__icon nav-item__icon--masked"
      style={{ maskImage: `url('assets/icons/${icon}.svg')`, WebkitMaskImage: `url('assets/icons/${icon}.svg')`, maskMode: 'alpha' }}
    />
  ) : (
    <img src={`assets/icons/${icon}.svg`} width={16} height={16} className={`nav-item__icon${isSectionActive ? ' nav-item__icon--active' : ''}`} alt="" />
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
// (Exposure/Discover/Report/Data Quality, or Navigator/Workspace) that has
// no room for a text label or chevron in the 52px rail, so its children
// (or, for Navigator/Workspace, a handful of shortcut destinations — see
// NAVIGATOR_FLYOUT_CHILDREN/WORKSPACE_FLYOUT_CHILDREN below) show in a
// floating panel to its right on hover/focus instead of expanding inline.
// position:fixed + a measured `top` (via getBoundingClientRect on open, not
// continuous tracking) rather than position:absolute — same reasoning as
// .nav-item__btn--rail-collapsed's own tooltip (leftNavAlt.css):
// .leftnav__body's overflow-y:auto would otherwise clip an absolutely
// positioned panel that extends past the 52px rail. Unlike that tooltip's
// CSS-only static-position trick, the panel holds real interactive buttons
// (not generated content), so it needs an actual measured offset instead of
// a `top: auto` fallback.
// isActive vs isSectionActive on the parent icon itself mirror RowIcon's own
// distinction: Insights entities (Exposure etc.) pass isSectionActive — the
// icon is never itself the exact destination, its real children are.
// Navigator/Workspace pass isActive instead — unlike Insights entities,
// they ARE real leaf destinations in their own right, so their icon keeps
// the same accent-selected look a plain Row gives any other leaf.
// onClick: fires on a plain click of the parent icon itself, separate from
// the hover-driven flyout — only Navigator/Workspace pass this (their icon
// is a real destination, landing on the section's default page); Insights
// entities leave it undefined so their icon stays click-inert — only their
// children (Overview, Findings, ...) are real destinations to navigate to.
function RailFlyoutRow({ entity, isOpen, isActive, isSectionActive, activeId, onClick, onOpen, onClose, onNavigateChild }) {
  const btnRef = useRef(null);
  const [top, setTop] = useState(0);
  const handleOpen = () => {
    if (btnRef.current) setTop(btnRef.current.getBoundingClientRect().top);
    onOpen();
  };
  return (
    <div className="nav-item">
      <button
        ref={btnRef}
        onClick={onClick}
        onMouseEnter={handleOpen}
        onMouseLeave={onClose}
        onFocus={handleOpen}
        onBlur={onClose}
        data-tooltip={isOpen ? undefined : entity.label}
        aria-label={entity.label}
        aria-expanded={isOpen}
        className={`nav-item__btn nav-item__btn--rail-collapsed${isActive ? ' nav-item__btn--selected' : isSectionActive ? ' nav-item__btn--active' : ''}`}
      >
        <RowIcon icon={entity.icon} iconNode={entity.iconNode} isActive={isActive} isSectionActive={isSectionActive} />
      </button>
      {isOpen && (
        <div className="leftnav-alt__rail-flyout" style={{ top }} onMouseEnter={handleOpen} onMouseLeave={onClose}>
          <div className="leftnav-alt__rail-flyout-title">{entity.label}</div>
          {entity.children.map(c => (
            <button
              key={c.id}
              className={`leftnav-alt__rail-flyout-row${activeId === c.id ? ' leftnav-alt__rail-flyout-row--active' : ''}`}
              onClick={() => onNavigateChild(c.navigateId ?? c.id)}
            >
              <RowIcon icon={c.icon} iconNode={c.iconNode} isActive={activeId === c.id} />
              <span className="leftnav-alt__rail-flyout-row-label">{c.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Synthetic "children" for Navigator/Workspace's rail flyout — same
// real-leaf-route pattern as Templates/Saved below: "History"/"Agents" are
// their own routes, '/navigator/history' and '/navigator/agents' (App.jsx),
// which render the same full-page Navigator but land it on the matching
// overlay (History list / Agents list) — see navigatorOverlay/initialOverlay
// derivation in App.jsx and NavigatorPage.jsx. Presented as flyout rows
// purely to match Exposure's Overview/Findings pattern, not because either
// is a real accordion. Icons are hand-drawn at a native 16x16 viewBox with
// ~1px strokes (not scaled down from a 24x24 glyph) specifically to match
// nav-overview.svg/nav-findings.svg's weight — an earlier 24x24-viewBox
// version read noticeably bigger/bolder next to Exposure's asset icons at
// the same rendered 16x16 size.
const NAVIGATOR_FLYOUT_CHILDREN = [
  {
    // id: 'navigator' (not a synthetic 'navigator/new-chat') deliberately —
    // it needs to land on the exact same route the Navigator icon's own
    // plain click already does (App.jsx's id === 'navigator-page' branch
    // bumps resetToken and routes to 'navigator'), so navigateId points
    // there while id itself is what RailFlyoutRow compares against
    // `activeId` (=== current) to highlight this row — matching 'navigator'
    // is exactly "currently on the fresh Home/new-chat screen", the same
    // way 'navigator/history' and 'navigator/agents' below self-highlight.
    id: 'navigator', navigateId: 'navigator-page', label: 'New chat',
    iconNode: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M7.2 2.8H3.3A1.3 1.3 0 0 0 2 4.1v8.6a1.3 1.3 0 0 0 1.3 1.3h8.6a1.3 1.3 0 0 0 1.3-1.3V8.8" stroke="currentColor" strokeWidth="1.05" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12.3 1.7a1.4 1.4 0 0 1 2 2L8 10l-2.6.6.6-2.6z" stroke="currentColor" strokeWidth="1.05" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: 'navigator/history', label: 'History',
    iconNode: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M2.5 4H10.5M2.5 8H10.5M2.5 12H7.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
        <circle cx="13.2" cy="4" r="0.9" fill="currentColor"/>
        <circle cx="13.2" cy="8" r="0.9" fill="currentColor"/>
      </svg>
    ),
  },
  {
    id: 'navigator/agents', label: 'Agents',
    iconNode: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect x="3" y="6.5" width="10" height="7" rx="1.3" stroke="currentColor" strokeWidth="1.05"/>
        <path d="M6 6.5V4.3a1.8 1.8 0 0 1 3.6 0V6.5" stroke="currentColor" strokeWidth="1.05"/>
        <circle cx="6" cy="10" r="0.75" fill="currentColor"/>
        <circle cx="10" cy="10" r="0.75" fill="currentColor"/>
        <path d="M1.5 9h1M13.5 9h1" stroke="currentColor" strokeWidth="1.05" strokeLinecap="round"/>
      </svg>
    ),
  },
];
const WORKSPACE_FLYOUT_CHILDREN = [
  { id: 'workspace/saved',   label: 'Saved',      icon: 'saved' },
  { id: 'workspace/library', label: 'Templates', icon: 'template-add' },
];
const TOP_ITEM_FLYOUT_CHILDREN = { navigator: NAVIGATOR_FLYOUT_CHILDREN, workspace: WORKSPACE_FLYOUT_CHILDREN };

// LeftNavHybrid — the left nav's expanded/collapsed shell, reconciled
// against design-system-2.0/ds/patterns/navigation.json's own numbers (52px
// collapsed width, a mandatory never-removed toggle):
//
//   - Expanded: TOP_ITEMS/NavItem/SectionLabel shell — Insights and Fabric
//     Configuration collapse independently, so both can be open at once.
//   - Collapsed: never goes to 0 width — a persistent `.leftnav-alt--rail`
//     52px treatment with the full flat icon list (TOP_ITEMS, every
//     Insights entity, every Fabric item), not a 4-icon category rail.
//     Exposure/Discover/Report/Data Quality (and Navigator/Workspace) show
//     their children in a hover flyout via RailFlyoutRow rather than
//     expanding inline — see RailFlyoutRow's own doc comment.
//   - The Topbar's shared collapse toggle is always shown, in both states —
//     one control, one location.
//   - Drag-to-resize between 52px and 220px (and a third, fully-hidden
//     sliver state past that) is removed for now, may come back later —
//     the Topbar toggle is the only way to collapse/expand this nav.
export function LeftNavHybrid({ current, onNav, collapsed, onToggleCollapse, consoleActive = false, adminActiveSection, onAdminSelect, navigatorAtHome = false }) {
  // No navigatorAtHome suppression here — Navigator's home landing is the
  // one screen a user is on immediately after a fresh load, so leaving its
  // rail icon unhighlighted there read as "nothing shows I'm on this page"
  // rather than a deliberately neutral home state.
  const activeParent = current?.split('/')[0];
  const activeId = current;

  // Collapsed rail's hover-flyout open state — delayed close (mouseleave/
  // blur schedule a ~150ms close so the cursor can travel from the icon
  // into the panel itself; Escape force-closes for a keyboard user tabbed
  // into it).
  const [railFlyoutOpen, setRailFlyoutOpen] = useState(null);
  const railFlyoutCloseTimer = useRef(null);
  const openRailFlyout = (id) => {
    if (railFlyoutCloseTimer.current) { clearTimeout(railFlyoutCloseTimer.current); railFlyoutCloseTimer.current = null; }
    setRailFlyoutOpen(id);
  };
  const scheduleCloseRailFlyout = () => {
    if (railFlyoutCloseTimer.current) clearTimeout(railFlyoutCloseTimer.current);
    railFlyoutCloseTimer.current = setTimeout(() => setRailFlyoutOpen(null), 150);
  };
  useEffect(() => () => { if (railFlyoutCloseTimer.current) clearTimeout(railFlyoutCloseTimer.current); }, []);
  useEffect(() => { if (!collapsed) setRailFlyoutOpen(null); }, [collapsed]);
  useEffect(() => {
    if (!railFlyoutOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') setRailFlyoutOpen(null); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [railFlyoutOpen]);

  const insightsIds = new Set(INSIGHTS_MODEL.map(e => e.id));

  // Expanded state: Insights and Fabric Configuration collapse independently
  // — same Set-of-collapsed-keys mechanic Classic's own LeftNav.jsx uses,
  // not a single "only one open" value. Opening/expanding one no longer
  // closes the other; both start open by default (empty set) and stay
  // exactly where the user left them across navigation, matching Classic's
  // own collapsedSections behavior 1:1.
  const [collapsedTopSections, setCollapsedTopSections] = useState(() => new Set());
  const toggleTopSection = (key) => setCollapsedTopSections(prev => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

  // Per-entity accordion nested inside whichever top group is open — same
  // openOverrides mechanic as Option 1/Option 2.
  const [openOverrides, setOpenOverrides] = useState(() => new Map());
  useEffect(() => { setOpenOverrides(new Map()); }, [activeParent]);
  // defaultOpen lets a caller override "open iff activeParent === id" —
  // needed for the synthetic Fabric Configuration entity below, whose own
  // id ('fabric-configuration') never actually matches activeParent since
  // every real Fabric page routes by its own leaf id instead.
  const toggleEntity = (id, defaultOpen = activeParent === id) => setOpenOverrides(prev => {
    const next = new Map(prev);
    const isCurrentlyOpen = next.has(id) ? next.get(id) : defaultOpen;
    next.set(id, !isCurrentlyOpen);
    return next;
  });
  const isEntityOpen = (id, defaultOpen = activeParent === id) => (openOverrides.has(id) ? openOverrides.get(id) : defaultOpen);

  const navigate = (id, forceMode) => {
    setOpenOverrides(new Map());
    onNav(id, forceMode ? { forceMode } : undefined);
  };

  const navigateFromRailFlyout = (id, forceMode) => {
    setRailFlyoutOpen(null);
    navigate(id, forceMode);
  };

  // Rail-collapsed Insights — reuses the module-level RailFlyoutRow so
  // Exposure/Discover/Report/Data Quality show their children in a hover
  // flyout, same mechanism as Navigator/Workspace below.
  const renderCompactInsightsGroup = (items, forceMode) => items.map(item => {
    const hasChildren = item.children && item.children.length;
    if (!hasChildren) {
      const leaf = { id: item.navigateId ?? item.id, label: item.label, icon: item.icon, iconNode: item.iconNode };
      return <Row key={leaf.id} label={leaf.label} icon={leaf.icon} iconNode={leaf.iconNode} isActive={activeId === leaf.id} onClick={() => navigate(leaf.id, forceMode)} compact />;
    }
    return (
      <RailFlyoutRow
        key={item.id}
        entity={item}
        isOpen={railFlyoutOpen === item.id}
        isSectionActive={activeParent === item.id}
        activeId={activeId}
        onOpen={() => openRailFlyout(item.id)}
        onClose={scheduleCloseRailFlyout}
        onNavigateChild={(id) => navigateFromRailFlyout(id, forceMode)}
      />
    );
  });

  // Admin console groups have their own independent collapse, separate from
  // collapsedTopSections (Insights/Fabric Configuration) — same
  // Set-of-collapsed-keys mechanic, just a different key namespace.
  const [collapsedAdminGroups, setCollapsedAdminGroups] = useState(() => new Set());
  const toggleAdminGroup = (key) => setCollapsedAdminGroups(prev => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });
  const renderAdminGroup = (group) => {
    const key = `admin:${group.label}`;
    const isCollapsed = collapsedAdminGroups.has(key);
    return (
      <div className="leftnav-alt__group" key={group.label}>
        <SectionLabel label={group.label} isCollapsed={isCollapsed} onClick={() => toggleAdminGroup(key)} />
        {!isCollapsed && group.items.map(item => (
          <Row key={item.id} label={item.label} iconNode={item.iconNode} isActive={adminActiveSection === item.id} onClick={() => onAdminSelect(item.id)} />
        ))}
      </div>
    );
  };

  const expandedContent = (
    <>
      <div className="leftnav__body">
        {consoleActive ? (
          ADMIN_NAV_GROUPS.map(renderAdminGroup)
        ) : (
          <>
            {TOP_ITEMS.map(item => (
              <React.Fragment key={item.id}>
                <NavItem
                  item={item}
                  isActiveParent={activeParent === item.id}
                  activeChild={activeId}
                  isOpen={false}
                  onToggle={() => {}}
                  onNav={(id) => navigate(id)}
                />
                {item.dividerAfter && <div className="leftnav__divider" />}
              </React.Fragment>
            ))}

            <SectionLabel
              label="Insights"
              isCollapsed={collapsedTopSections.has('insights')}
              onClick={() => toggleTopSection('insights')}
            />
            {!collapsedTopSections.has('insights') && INSIGHTS_MODEL.map(item => (
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
            <SectionLabel
              label="Fabric Configuration"
              isCollapsed={collapsedTopSections.has('fabric')}
              onClick={() => toggleTopSection('fabric')}
            />
            {!collapsedTopSections.has('fabric') && FABRIC_MODEL.map(item => (
              <NavItem
                key={item.id}
                item={item}
                isActiveParent={activeId === item.id}
                activeChild={activeId}
                isOpen={false}
                onToggle={() => {}}
                onNav={(id) => navigate(id, 'studio')}
              />
            ))}
          </>
        )}
      </div>
    </>
  );

  // Collapsed rail — Option 1's exact compactContent shape (TOP_ITEMS,
  // renderCompactInsightsGroup, FABRIC_MODEL flat icons), not the earlier
  // 4-icon category rail. Navigator/Workspace and every Insights entity
  // show their children in RailFlyoutRow's hover flyout.
  const railContent = (
    <>
      <div className="leftnav__body">
        {consoleActive ? (
          ADMIN_NAV_GROUPS.flatMap(g => g.items).map(item => (
            <Row key={item.id} label={item.label} iconNode={item.iconNode} isActive={adminActiveSection === item.id} onClick={() => onAdminSelect(item.id)} compact />
          ))
        ) : (
          <>
            {TOP_ITEMS.map(item => {
              const isActive = activeParent === item.id;
              return (
                <RailFlyoutRow
                  key={item.id}
                  entity={{ ...item, children: TOP_ITEM_FLYOUT_CHILDREN[item.id] }}
                  isOpen={railFlyoutOpen === item.id}
                  isActive={isActive}
                  activeId={activeId}
                  // A plain click still lands on the section's own default
                  // page (Navigator's landing/new-chat screen, Workspace's
                  // Saved list). The hover flyout is an additional shortcut
                  // to a specific child (History/Agents, Templates/Saved),
                  // not a replacement for the icon's own click behavior.
                  onClick={() => navigate(item.navigateId ?? item.id)}
                  // Never suppressed by isActive, for either item: History/
                  // Agents and Saved/Templates are all real sibling routes
                  // you need to jump between while already inside that
                  // section, not a redundant preview of where you already
                  // are — matching Insights entities, whose own flyout
                  // (renderCompactInsightsGroup) never gates on isActive
                  // either.
                  onOpen={() => openRailFlyout(item.id)}
                  onClose={scheduleCloseRailFlyout}
                  onNavigateChild={(id) => navigateFromRailFlyout(id)}
                />
              );
            })}
            <div className="leftnav__divider" />
            {renderCompactInsightsGroup(INSIGHTS_MODEL, 'em')}
            <div className="leftnav__divider" />
            {/* Fabric Configuration renders as four flat icons here, same as
                the expanded view's FABRIC_MODEL.map — no accordion, since
                each entry is already a leaf (solo: true), unlike Insights'
                Exposure/Discover/Report/Data Quality which each nest real
                children and need RailFlyoutRow to show them. */}
            {FABRIC_MODEL.map(item => (
              <Row
                key={item.id}
                label={item.label}
                icon={item.icon}
                iconNode={item.iconNode}
                isActive={activeParent === item.id}
                onClick={() => navigate(item.id, 'studio')}
                compact
              />
            ))}
          </>
        )}
      </div>
    </>
  );

  // Drag-to-resize is removed for now (may come back later) — the sidebar
  // just toggles between the 52px rail and the full 220px view via
  // onToggleCollapse (Topbar toggle), same as every other nav design.
  return (
    <aside className={`leftnav${collapsed ? ' leftnav-alt--rail' : ''}`}>
      {collapsed ? railContent : expandedContent}
    </aside>
  );
}
