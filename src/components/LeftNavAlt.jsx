import React, { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { SectionLabel, NavItem, TOP_ITEMS, INSIGHTS_MODEL, FABRIC_MODEL } from './LeftNav.jsx'
import { ADMIN_NAV_GROUPS } from '../pages/admin/AdminPanelBody.jsx'
import { RECENT_CHATS } from '../pages/NavigatorPage.jsx'
import { SAVED_ROWS } from '../pages/SavedPage.jsx'
import { useNavigatorActivity } from '../context/NavigatorActivityCtx.jsx'

// Shared three-way icon treatment (masked/accent-tinted when active, plain
// img otherwise, or a literal iconNode for inline-SVG icons) — used by both
// Row's rail buttons and RailAccordionRow.
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

// hideTooltip: for a compact row whose hover/click already opens something
// self-labeled (the Navigator/Workspace preview flyout — see LeftNavHybrid
// below) — the CSS hover tooltip would otherwise render on top of that
// flyout's own header.
// onMouseEnter/onMouseLeave/onFocus/onBlur: optional passthrough so a rail
// row can also drive a hover/keyboard-focus preview (LeftNavHybrid) without
// every other Row caller needing to know about that.
function Row({ label, icon, iconNode, isActive, onClick, compact = false, hideTooltip = false, onMouseEnter, onMouseLeave, onFocus, onBlur }) {
  return (
    <div className="nav-item">
      <button
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onFocus={onFocus}
        onBlur={onBlur}
        data-tooltip={compact && !hideTooltip ? label : undefined}
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
// "Collapse X") plus a small corner-triangle hint — same reasoning as
// .nav-item__btn--rail-collapsed's own tooltip. Closed, the triangle only
// appears on hover, previewing the expand action at the row's bottom-right
// corner. Open, it stays visible without hovering (the only at-a-glance
// cue that a rail icon is currently expanded) and moves to the top-right
// corner, mirrored rather than just rotated, so it still reads as flush
// with that corner instead of floating.
// Children animate open/closed via a measured max-height (ref + scrollHeight)
// on `.nav-item__children` — the same class/transition NavItem's own
// children use in the expanded view, rather than a hardcoded row-count
// guess, since the divider that closes the group is measured along with it.
function RailAccordionRow({ entity, isOpen, isHighlighted, isSectionActive, onToggle, activeId, onNavigateChild }) {
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
          <RowIcon icon={entity.icon} iconNode={entity.iconNode} isSectionActive={isSectionActive} />
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

// Fabric Configuration has no navbar-*.svg asset of its own (its four leaf
// items each carry their own icon instead) — a small inline glyph, same
// stroke weight/style as LeftNav.jsx's IcPipelineNav/IcOntologyNav/etc.,
// stands in as the category icon for the rail's Fabric Configuration group.
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
function IcNewChat() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// "Chats" — full history list, distinct from IcNewChat (a pencil glyph reads
// as "start new", this reads as "the whole list") — used by the Navigator
// preview flyout header below.
function IcChatsListNav() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 6h13M4 12h13M4 18h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx="20.5" cy="6" r="1.3" fill="currentColor"/>
      <circle cx="20.5" cy="12" r="1.3" fill="currentColor"/>
    </svg>
  );
}

// LeftNavHybrid — the left nav's expanded/collapsed shell, reconciled
// against design-system-2.0/ds/patterns/navigation.json's own numbers (52px
// collapsed width, a mandatory never-removed toggle):
//
//   - Expanded: TOP_ITEMS/NavItem/SectionLabel shell — Insights and Fabric
//     Configuration collapse independently, so both can be open at once.
//   - Collapsed: never goes to 0 width — a persistent `.leftnav-alt--rail`
//     52px treatment with the full flat icon list (TOP_ITEMS, every
//     Insights entity, every Fabric item), not a 4-icon category rail.
//     Exposure/Discover/Report/Data Quality expand inline via
//     RailAccordionRow.
//   - Hovering the Navigator icon opens a preview flyout (recent chats +
//     New chat/Chats/Agents actions) instead of a plain tooltip —
//     suppressed while Navigator is already the active destination, since
//     then there's nothing new to preview.
//   - The Topbar's shared collapse toggle is always shown, in both states —
//     one control, one location.
//   - Drag-to-resize between 52px and 220px (and a third, fully-hidden
//     sliver state past that) is removed for now, may come back later —
//     the Topbar toggle is the only way to collapse/expand this nav.
const NAV_EXPANDED_WIDTH = 220;
const NAV_RAIL_WIDTH = 52;

export function LeftNavHybrid({ current, onNav, collapsed, onToggleCollapse, consoleActive = false, adminActiveSection, onAdminSelect, navigatorAtHome = false }) {
  // No navigatorAtHome suppression here — Navigator's home landing is the
  // one screen a user is on immediately after a fresh load, so leaving its
  // rail icon unhighlighted there read as "nothing shows I'm on this page"
  // rather than a deliberately neutral home state.
  const activeParent = current?.split('/')[0];
  const activeId = current;
  const { activeChat } = useNavigatorActivity();

  const insightsIds = new Set(INSIGHTS_MODEL.map(e => e.id));
  const fabricIds = new Set(FABRIC_MODEL.map(f => f.id));

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

  // Collapsed rail's preview — Navigator only now. The rail itself went
  // back to Option 1's full flat icon list (see railContent below), where
  // Exposure/Discover/Report/Data Quality expand inline via
  // RailAccordionRow exactly like Option 1, not through a category flyout —
  // so there's nothing left for Insights/Fabric/Workspace to preview.
  // Hover-driven: opens instantly on mouseenter/focus, closes ~150ms after
  // mouseleave/blur (same delayed-close reasoning as App.jsx's own
  // hover-peek — instant close would make it impossible to move the cursor
  // from the icon into the flyout itself to click a row). Escape still
  // force-closes it for a keyboard user who's tabbed into it.
  const [hoverPreview, setHoverPreview] = useState(null);
  const previewCloseTimer = useRef(null);
  const openPreview = (kind) => {
    if (previewCloseTimer.current) { clearTimeout(previewCloseTimer.current); previewCloseTimer.current = null; }
    setHoverPreview(kind);
  };
  const scheduleClosePreview = () => {
    if (previewCloseTimer.current) clearTimeout(previewCloseTimer.current);
    previewCloseTimer.current = setTimeout(() => setHoverPreview(null), 150);
  };
  useEffect(() => () => { if (previewCloseTimer.current) clearTimeout(previewCloseTimer.current); }, []);
  useEffect(() => { if (!collapsed) setHoverPreview(null); }, [collapsed]);
  useEffect(() => {
    if (!hoverPreview) return;
    const onKey = (e) => { if (e.key === 'Escape') setHoverPreview(null); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [hoverPreview]);

  const navigateFromFlyout = (id, forceMode) => {
    setHoverPreview(null);
    navigate(id, forceMode);
  };

  // Route-only active check (no hoverPreview involved) — whether Navigator
  // is the thing currently showing, independent of whatever's being
  // previewed. Used both for the icon's highlight and to decide whether
  // hovering it should even open a preview (openPreviewIfIdle) — hovering
  // the section you're already on has nothing new to preview.
  const isRouteActive = (kind) => activeParent === kind;
  const isRailActive = (kind) => hoverPreview === kind || isRouteActive(kind);
  const openPreviewIfIdle = (kind) => { if (!isRouteActive(kind)) openPreview(kind); };

  // A preview row's own click opens that specific chat/dashboard/report,
  // not just a generic landing page — 'navigator-page' already re-opens
  // ChatView directly into a live conversation for any non-empty query
  // (see NavigatorPage.jsx's own `view` init), so re-asking the chat's
  // original label reproduces "that chat" well enough for a mocked history
  // with no real per-message transcript behind it. Real per-chat routes
  // ("Chats"/"Agents" header icons, "View all conversations") still fall
  // back to plain 'navigator-page' — there's nowhere more specific for
  // those to go yet.
  const openChat = (query) => { setHoverPreview(null); onNav('navigator-page', query); };
  // One fewer static row whenever the in-progress chat pins its own row
  // above them, so the preview still tops out at 5 total instead of growing.
  const NAV_PREVIEW_CHATS = RECENT_CHATS.slice(0, activeChat ? 4 : 5);

  // Same idea as openChat above, mirroring SavedPage.jsx's own handleView
  // exactly (see its handleEdit/handleView) so a row here lands on the same
  // real per-dashboard route a click in the actual Saved list would — a
  // dashboard's title is personalized by WorkspacePage's own id-based seed
  // lookup once there (see its editDashboardSeed fallback), same as arriving
  // via SavedPage itself. Reports have no per-item route in this app at
  // all yet (SavedPage's own handleView sends every report to the same
  // 'executive-summary' preview) — matched here rather than inventing one.
  const openSavedItem = (row) => {
    setHoverPreview(null);
    onNav(row.type === 'REPORT' ? 'workspace/report-preview/executive-summary' : `workspace/dashboard/view-${row.id}`);
  };

  // SAVED_ROWS is already ordered most-recent-first (see its own
  // `lastUpdated` values in SavedPage.jsx), so a plain slice is genuinely
  // "recent" — capped at 4 each, same brevity as the 5 recent chats above.
  const savedDashboards = SAVED_ROWS.filter(r => r.type === 'DASHBOARD').slice(0, 4);
  const savedReports = SAVED_ROWS.filter(r => r.type === 'REPORT').slice(0, 4);

  // Rail-collapsed Insights — reuses the module-level RailAccordionRow
  // rather than a second copy of the same accordion component.
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
        // Same as Option 1's own renderCompactInsightsGroup: without this,
        // manually collapsing an entity while still on one of its pages
        // (activeParent === item.id but isOpen now false via the explicit
        // override) drops the icon back to a fully plain, unhighlighted
        // state — losing the only remaining cue that this is still the
        // active section, just collapsed.
        isSectionActive={activeParent === item.id}
        onToggle={() => toggleEntity(item.id)}
        activeId={activeId}
        onNavigateChild={(id) => navigate(id, forceMode)}
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

  // Shared between both sidebar states — the popover no longer retires once
  // the sidebar is expanded to its full 220px, it just anchors past the
  // wider row instead of the 52px rail (see the `left` inline style below,
  // the one thing that actually differs between the two placements).
  const previewFlyouts = (
    <>
      {hoverPreview === 'navigator' && (
        <div
          className="leftnav-hybrid__flyout"
          style={{ left: collapsed ? NAV_RAIL_WIDTH : NAV_EXPANDED_WIDTH }}
          onMouseEnter={() => openPreview('navigator')}
          onMouseLeave={scheduleClosePreview}
        >
          <div className="leftnav-split__panel-header">
            <span className="leftnav-split__panel-title">Navigator</span>
            <div className="leftnav-hybrid__header-actions">
              <button
                type="button"
                className="leftnav-hybrid__icon-btn"
                data-tooltip="New chat"
                aria-label="New chat"
                onClick={() => navigateFromFlyout('navigator-page')}
              >
                <IcNewChat />
              </button>
              <button
                type="button"
                className="leftnav-hybrid__icon-btn"
                data-tooltip="Chats"
                aria-label="Chats"
                onClick={() => navigateFromFlyout('navigator-page')}
              >
                <IcChatsListNav />
              </button>
              <button
                type="button"
                className="leftnav-hybrid__icon-btn"
                data-tooltip="Agents"
                aria-label="Agents"
                onClick={() => navigateFromFlyout('navigator-page')}
              >
                <IcAgentsNav />
              </button>
            </div>
          </div>
          <div className="leftnav-split__panel-body">
            <div className="leftnav-split__group-title">Recent chats</div>
            {activeChat && (
              <button key={activeChat.id} className="leftnav-split__row" onClick={() => openChat(activeChat.label)}>
                <IcChatsListNav />
                <span className="leftnav-split__row-label">{activeChat.label}</span>
                {activeChat.status === 'generating' ? (
                  <span className="nav-chat-status-pill">
                    <span className="nav-chat-status-dot" />
                    Generating
                  </span>
                ) : (
                  <span className="leftnav-split__row-meta">Just now</span>
                )}
              </button>
            )}
            {NAV_PREVIEW_CHATS.map(c => (
              <button key={c.id} className="leftnav-split__row" onClick={() => openChat(c.label)}>
                <IcChatsListNav />
                <span className="leftnav-split__row-label">{c.label}</span>
                <span className="leftnav-split__row-meta">{c.time}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {hoverPreview === 'workspace' && (
        <div
          className="leftnav-hybrid__flyout"
          style={{ left: collapsed ? NAV_RAIL_WIDTH : NAV_EXPANDED_WIDTH }}
          onMouseEnter={() => openPreview('workspace')}
          onMouseLeave={scheduleClosePreview}
        >
          <div className="leftnav-split__panel-header">
            <span className="leftnav-split__panel-title">Workspace</span>
            {/* Same icon assets as SavedPage.jsx's own New Report/New
                Dashboard buttons, masked to currentColor (like RowIcon's own
                masked branch) so they pick up the icon button's grey instead
                of their baked-in purple fill, matching IcNewChat's plain
                currentColor stroke above. New Dashboard routes to the real
                'workspace/dashboard/new' flow; New Report has nowhere to go
                yet — SavedPage's own "New Report" button has no onClick
                either, so this lands on Saved rather than inventing a route
                that doesn't exist. */}
            <div className="leftnav-hybrid__header-actions">
              <button
                type="button"
                className="leftnav-hybrid__icon-btn"
                data-tooltip="New report"
                aria-label="New report"
                onClick={() => navigateFromFlyout('workspace/saved')}
              >
                <span
                  className="leftnav-hybrid__icon-btn-mask"
                  style={{ maskImage: "url('assets/icons/new-report.svg')", WebkitMaskImage: "url('assets/icons/new-report.svg')" }}
                />
              </button>
              <button
                type="button"
                className="leftnav-hybrid__icon-btn"
                data-tooltip="New dashboard"
                aria-label="New dashboard"
                onClick={() => navigateFromFlyout('workspace/dashboard/new')}
              >
                <span
                  className="leftnav-hybrid__icon-btn-mask"
                  style={{ maskImage: "url('assets/icons/template-add.svg')", WebkitMaskImage: "url('assets/icons/template-add.svg')" }}
                />
              </button>
            </div>
          </div>
          <div className="leftnav-split__panel-body">
            <div className="leftnav-split__group">
              <div className="leftnav-split__group-title">Recent dashboards</div>
              {savedDashboards.map(row => (
                <button key={row.id} className="leftnav-split__row" onClick={() => openSavedItem(row)}>
                  <span className="leftnav-split__row-label">{row.name}</span>
                </button>
              ))}
            </div>
            <div className="leftnav-split__group">
              <div className="leftnav-split__group-title">Recent reports</div>
              {savedReports.map(row => (
                <button key={row.id} className="leftnav-split__row" onClick={() => openSavedItem(row)}>
                  <span className="leftnav-split__row-label">{row.name}</span>
                </button>
              ))}
            </div>
            <button className="leftnav-split__viewall" onClick={() => navigateFromFlyout('workspace/saved')}>View all saved</button>
            <button className="leftnav-split__viewall" onClick={() => navigateFromFlyout('workspace/library')}>Templates library</button>
          </div>
        </div>
      )}
    </>
  );

  const expandedContent = (
    <>
      <div className="leftnav__body">
        {consoleActive ? (
          ADMIN_NAV_GROUPS.map(renderAdminGroup)
        ) : (
          <>
            {TOP_ITEMS.map(item => {
              // Same hover preview as the collapsed rail below (see
              // railContent) — expanding the sidebar to its full 220px no
              // longer retires the popover, it just repositions it past the
              // wider row (see previewFlyouts' left offset).
              const hasPreview = item.id === 'navigator' || item.id === 'workspace';
              return (
                <React.Fragment key={item.id}>
                  <div
                    onMouseEnter={hasPreview ? () => openPreviewIfIdle(item.id) : undefined}
                    onMouseLeave={hasPreview ? scheduleClosePreview : undefined}
                    onFocus={hasPreview ? () => openPreviewIfIdle(item.id) : undefined}
                    onBlur={hasPreview ? scheduleClosePreview : undefined}
                  >
                    <NavItem
                      item={item}
                      isActiveParent={hasPreview ? isRailActive(item.id) : activeParent === item.id}
                      activeChild={activeId}
                      isOpen={false}
                      onToggle={() => {}}
                      onNav={(id) => navigate(id)}
                    />
                  </div>
                  {item.dividerAfter && <div className="leftnav__divider" />}
                </React.Fragment>
              );
            })}

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
      {previewFlyouts}
    </>
  );

  // Collapsed rail — Option 1's exact compactContent shape (TOP_ITEMS,
  // renderCompactInsightsGroup, FABRIC_MODEL flat icons), not the earlier
  // 4-icon category rail. Navigator is the one row wired for a hover
  // preview instead of a plain tooltip; everything else behaves exactly
  // like Option 1's own rail — plain tooltip, inline accordion expansion
  // for Exposure/Discover/Report/Data Quality via RailAccordionRow.
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
              // Navigator and Workspace both keep their hover preview from
              // before; every other rail row is plain Option-1 behavior.
              const hasPreview = item.id === 'navigator' || item.id === 'workspace';
              return (
                <Row
                  key={item.id}
                  label={item.label}
                  icon={item.icon}
                  iconNode={item.iconNode}
                  isActive={hasPreview ? isRailActive(item.id) : activeParent === item.id}
                  onClick={() => navigate(item.navigateId ?? item.id)}
                  compact
                  // Always suppressed for Navigator/Workspace now, active or
                  // not — while active, NavigatorPage's own top-left expand
                  // icon (useHidePeekSidebar, see NavigatorPage.jsx) sits
                  // right next to this rail, and the plain tooltip pill used
                  // to render on top of its label. No replacement needed:
                  // that title-bar icon is itself the hover affordance once
                  // Navigator/Workspace is the active destination.
                  hideTooltip={hasPreview}
                  onMouseEnter={hasPreview ? () => openPreviewIfIdle(item.id) : undefined}
                  onMouseLeave={hasPreview ? scheduleClosePreview : undefined}
                  onFocus={hasPreview ? () => openPreviewIfIdle(item.id) : undefined}
                  onBlur={hasPreview ? scheduleClosePreview : undefined}
                />
              );
            })}
            <div className="leftnav__divider" />
            {renderCompactInsightsGroup(INSIGHTS_MODEL, 'em')}
            <div className="leftnav__divider" />
            {(() => {
              // Fabric Configuration is a single expandable group here too
              // (per user request) — same RailAccordionRow shape as an
              // Insights entity, not four flat icons. isEntityOpen/
              // toggleEntity's defaultOpen override is needed because this
              // synthetic id never appears in activeParent — every real
              // Fabric page routes by its own leaf id (fabricIds.has(...)
              // is the real "am I inside this group" check).
              const fabricEntity = { id: 'fabric-configuration', label: 'Fabric Configuration', iconNode: <IcFabricNav />, children: FABRIC_MODEL };
              const fabricDefaultOpen = fabricIds.has(activeParent);
              const isOpen = isEntityOpen(fabricEntity.id, fabricDefaultOpen);
              return (
                <RailAccordionRow
                  entity={fabricEntity}
                  isOpen={isOpen}
                  isHighlighted={isOpen}
                  // Same reasoning as the Insights entities above — without
                  // this, collapsing Fabric Configuration while still on one
                  // of its own pages loses the "you're still in here" cue.
                  isSectionActive={fabricDefaultOpen}
                  onToggle={() => toggleEntity(fabricEntity.id, fabricDefaultOpen)}
                  activeId={activeId}
                  onNavigateChild={(id) => navigate(id, 'studio')}
                />
              );
            })()}
          </>
        )}
      </div>
      {previewFlyouts}
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
