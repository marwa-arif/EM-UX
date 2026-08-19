import React, { useState } from 'react'
import { Ic } from '../ui.jsx'
import LeftNav, { IcEMDashboard, IcConsoleNav, IcPanelToggle, IcSummaryNav, SectionLabel, TOP_ITEMS, INSIGHTS_MODEL, FABRIC_MODEL } from './LeftNav.jsx'
import { ADMIN_NAV_GROUPS } from '../pages/admin/AdminPanelBody.jsx'
import { CHAT_HISTORY, AGENTS } from './NavigatorPanel.jsx'
import { RECENT_CHATS } from '../pages/NavigatorPage.jsx'
import { SAVED_ROWS } from '../pages/SavedPage.jsx'

// Knowledge Graph has no children to list under it — shorten its own label
// to "Graph" for the group header so header+item aren't a literal duplicate
// ("Knowledge Graph" over "Knowledge Graph").
const GROUP_LABEL_OVERRIDES = { kg: 'Graph' };

// Option 2 — flat layout: each Insights entity (Exposure, Discover, Report,
// Graph, Data Quality) gets its own always-visible header with its
// destinations listed directly beneath, e.g. EXPOSURE / Overview / Findings —
// unlike Option 1's (LeftNav.jsx) single "Insights" umbrella wrapping a
// nested parent/children tree. A master "Insights" header sits above all of
// them (plus each entity's own header) — clicking any header collapses it
// normally, hiding its rows entirely, same as Fabric Configuration's header.
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

function LeftNavAlt({ current, onNav, collapsed, onToggleCollapse, consoleActive = false, adminActiveSection, onAdminSelect }) {
  // activeParent covers a whole route family (e.g. any 'workspace/...' page
  // highlights the Workspace row); activeId is an exact leaf match, used for
  // every row that represents one precise destination (a group's children,
  // Knowledge Graph, Fabric items) — same two derivations LeftNav.jsx uses,
  // just no "parent stays grey while a child is active" case needed here
  // since there's no clickable parent row anymore, only a static header.
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

  const navigate = (id, forceMode) => onNav(id, forceMode ? { forceMode } : undefined);

  const entityRows = (entity) => {
    const hasChildren = entity.children && entity.children.length;
    return hasChildren
      ? entity.children
      : [{ id: entity.navigateId ?? entity.id, label: entity.label, icon: entity.icon, iconNode: entity.iconNode }];
  };

  const renderEntityGroup = (entity, forceMode) => {
    const rows = entityRows(entity);
    const isCollapsed = collapsedGroups.has(entity.id);
    return (
      <div className="leftnav-alt__group" key={entity.id}>
        <SectionLabel
          label={GROUP_LABEL_OVERRIDES[entity.id] ?? entity.label}
          isCollapsed={isCollapsed}
          onClick={() => toggleGroup(entity.id)}
        />
        {!isCollapsed && rows.map(r => (
          <Row key={r.id} label={r.label} icon={r.icon} iconNode={r.iconNode} isActive={activeId === r.id} onClick={() => navigate(r.id, forceMode)} />
        ))}
      </div>
    );
  };

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
              {!collapsedGroups.has('insights') && INSIGHTS_MODEL.map(entity => renderEntityGroup(entity, 'em'))}
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
  // Option 1, everything (top items, every Insights destination flattened,
  // Fabric Configuration, footer) renders as one persistent icon-only rail.
  // No hover-peek needed here since the rail is never actually hidden.
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
            {INSIGHTS_MODEL.flatMap(entityRows).map(r => (
              <Row key={r.id} label={r.label} icon={r.icon} iconNode={r.iconNode} isActive={activeId === r.id} onClick={() => navigate(r.id, 'em')} compact />
            ))}
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

// Option 3 — same single "Insights" umbrella as Option 1 (LeftNav.jsx), but
// every entity's destinations (Exposure, Discover, Report, Knowledge Graph,
// Data Quality) are flattened directly beneath it — no Exposure/Discover/
// Report/Data Quality sub-headers or per-entity accordion at all, unlike
// Option 1's nested tree and Option 2's (LeftNavAlt) per-entity headers.
// A few destination labels are renamed: "Compliance Matrix" -> "Matrix" and
// Data Quality's "Overview" -> "Quality Overview" (so it doesn't read as a
// literal duplicate of Exposure's "Overview").
const OPTION3_LABEL_OVERRIDES = {
  'report/compliance-matrix': 'Matrix',
  'data-quality/overview': 'Quality Overview',
};

// Workspace's own section (Option 3 only) — same flat-header treatment as
// Insights, just with two destinations instead of five entities. Both
// currently route to the same 'workspace/saved' page: SavedPage's own All/
// Dashboards/Reports pill filter isn't wired to a route param, so unlike
// Insights' children these two can't each get a distinct active-highlight —
// both light up together whenever the user is anywhere on Workspace's Saved
// page (see the shared `activeParent === 'workspace'` check below).
const WORKSPACE_ROWS = [
  { id: 'workspace-dashboards',    navigateId: 'workspace/saved', label: 'Dashboards',    iconNode: <IcEMDashboard /> },
  { id: 'workspace-report-centre', navigateId: 'workspace/saved', label: 'Report Centre', iconNode: <IcSummaryNav /> },
];

// Static stand-in for NavigatorPage.jsx's own Starred/History split
// (RECENT_CHATS) — same data, same starred/non-starred split NavSidebar
// itself computes, so the inline panel below reads as an exact preview of
// the real sidebar rather than a different dataset.
const NAV_STARRED_CHATS = RECENT_CHATS.filter(c => c.starred);
const NAV_RECENT_CHATS = RECENT_CHATS.filter(c => !c.starred).slice(0, 6);

// Mirrors NavigatorPage.jsx's own IcStar/IcHistory/IcBot/IcPlus (private to
// that file, not exported) so the inline panel below can reuse the exact
// same glyphs without importing a page component's internals.
function IcStarNav() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
    </svg>
  );
}
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
function IcAddSmall() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

function LeftNavOption3({ current, onNav, collapsed, hoverPeek = false, onHoverEnter, onHoverLeave, consoleActive = false, adminActiveSection, onAdminSelect, navigatorAtHome = false }) {
  const suppressActive = navigatorAtHome && current === 'navigator';
  const activeParent = suppressActive ? null : current?.split('/')[0];
  const activeId = suppressActive ? null : current;
  // Unsuppressed route parent, for seeding the panel/collapse state below —
  // `activeParent` goes null on Navigator's home landing (navigatorAtHome)
  // purely so that landing screen doesn't read as "already active," but the
  // panel-open/collapsed state below has nothing to do with that visual
  // suppression and must still seed correctly there.
  const routeParent = current?.split('/')[0];

  // One toggle each for "Workspace", "Insights" and "Fabric Configuration"
  // (plus one per admin group) — same collapsedSections mechanism LeftNav.jsx
  // uses for its own Insights/Fabric Configuration headers, just with
  // Insights now covering one flat list instead of five nested accordions,
  // and Workspace added as a third, identically-behaved section (see
  // WORKSPACE_ROWS above). All three default open; seeded collapsed only
  // when Navigator's own panel is seeded open below (see navigatorOpen) —
  // App.jsx and WorkspacePage.jsx each mount their own separate
  // LeftNavOption3 instance (Workspace's early return in App.jsx swaps the
  // whole tree), so navigating into or out of Workspace remounts this
  // component fresh; without seeding here too, that remount would silently
  // re-expand these three sections even when Navigator's panel is still
  // open right above them.
  const [collapsedSections, setCollapsedSections] = useState(() => (
    routeParent === 'navigator' ? new Set(['workspace', 'insights', 'fabric']) : new Set()
  ));
  const toggleSection = (key) => setCollapsedSections(prev => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

  // Navigator's own side panel (New chat/Starred/History/Agents — same
  // content as NavigatorPage.jsx's own NavSidebar, now folded in here
  // instead so that sidebar is suppressed for this option, see its
  // `hideOwnSidebar`) inlines directly beneath the Navigator row: a click
  // expands it in place, pushing Workspace/Insights/Fabric Configuration
  // further down the column. Those three sections auto-collapse the moment
  // it opens so that push stays short instead of stacking one long list
  // under another. Seeded from `routeParent`, not `activeParent`, for the
  // same remount-survival reason as collapsedSections above.
  const [navigatorOpen, setNavigatorOpen] = useState(() => routeParent === 'navigator');
  const collapseOtherSections = () => setCollapsedSections(s => new Set(s).add('workspace').add('insights').add('fabric'));
  const toggleNavigator = () => setNavigatorOpen(prev => {
    const next = !prev;
    if (next) collapseOtherSections();
    return next;
  });

  const navigate = (id, forceMode) => onNav(id, forceMode ? { forceMode } : undefined);

  const insightsRows = INSIGHTS_MODEL.flatMap(entity => {
    const hasChildren = entity.children && entity.children.length;
    const source = hasChildren
      ? entity.children
      : [{ id: entity.navigateId ?? entity.id, label: entity.label, icon: entity.icon, iconNode: entity.iconNode }];
    return source.map(r => ({ ...r, label: OPTION3_LABEL_OVERRIDES[r.id] ?? r.label }));
  });

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
            {TOP_ITEMS.filter(item => item.id !== 'workspace').map(item => {
              const isNavigator = item.id === 'navigator';
              return (
                <React.Fragment key={item.id}>
                  <Row
                    label={item.label}
                    icon={item.icon}
                    iconNode={item.iconNode}
                    isActive={activeParent === item.id || (isNavigator && navigatorOpen)}
                    onClick={() => {
                      if (isNavigator) toggleNavigator();
                      navigate(item.navigateId ?? item.id);
                    }}
                  />
                  {isNavigator && navigatorOpen && (
                    <div className="leftnav-alt__group leftnav-alt__inline-panel">
                      <div className="np-history-hdr">
                        <button className="np-history-new-btn" onClick={() => navigate('navigator-page')}>
                          <IcNewChat /> New chat
                        </button>
                      </div>

                      {NAV_STARRED_CHATS.length > 0 && (
                        <>
                          <div className="np-history-section">
                            <div className="np-history-section-hdr">
                              <span className="np-history-section-title"><IcStarNav /> Starred</span>
                            </div>
                            {NAV_STARRED_CHATS.map(c => (
                              <div className="np-history-chat-row" key={c.id}>
                                <button className="np-history-chat-main" onClick={() => navigate('navigator-page')}>
                                  <span className="np-history-chat-body">
                                    <span className="np-history-chat-label">{c.label}</span>
                                    <span className="np-history-chat-time">{c.time}</span>
                                  </span>
                                </button>
                              </div>
                            ))}
                          </div>
                          <div className="np-history-divider" />
                        </>
                      )}

                      <div className="np-history-section">
                        <div className="np-history-section-hdr">
                          <span className="np-history-section-title"><IcHistoryNav /> History</span>
                        </div>
                        {NAV_RECENT_CHATS.map(c => (
                          <div className="np-history-chat-row" key={c.id}>
                            <button className="np-history-chat-main" onClick={() => navigate('navigator-page')}>
                              <span className="np-history-chat-body">
                                <span className="np-history-chat-label">{c.label}</span>
                                <span className="np-history-chat-time">{c.time}</span>
                              </span>
                            </button>
                          </div>
                        ))}
                        <button className="np-history-viewall" onClick={() => navigate('navigator-page')}>
                          <IcHistoryNav /> View all conversations
                        </button>
                      </div>

                      <div className="np-history-divider" />

                      <div className="np-history-section">
                        <div className="np-history-section-hdr">
                          <span className="np-history-section-title"><IcAgentsNav /> Agents</span>
                          <button className="np-history-add-btn" onClick={() => navigate('navigator-page')} aria-label="Create agent">
                            <IcAddSmall />
                          </button>
                        </div>
                        <button className="np-history-viewall" onClick={() => navigate('navigator-page')}>
                          <IcAgentsNav /> View all agents
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="leftnav__divider" />
                </React.Fragment>
              );
            })}

            <SectionLabel label="Workspace" isCollapsed={collapsedSections.has('workspace')} onClick={() => toggleSection('workspace')} />
            {!collapsedSections.has('workspace') && WORKSPACE_ROWS.map(r => (
              <Row key={r.id} label={r.label} iconNode={r.iconNode} isActive={activeParent === 'workspace'} onClick={() => navigate(r.navigateId)} />
            ))}

            <div className="leftnav__divider" />
            <SectionLabel label="Insights" isCollapsed={collapsedSections.has('insights')} onClick={() => toggleSection('insights')} />
            {!collapsedSections.has('insights') && insightsRows.map(r => (
              <Row key={r.id} label={r.label} icon={r.icon} iconNode={r.iconNode} isActive={activeId === r.id} onClick={() => navigate(r.id, 'em')} />
            ))}

            <div className="leftnav__divider" />
            <SectionLabel label="Fabric Configuration" isCollapsed={collapsedSections.has('fabric')} onClick={() => toggleSection('fabric')} />
            {!collapsedSections.has('fabric') && FABRIC_MODEL.map(item => (
              <Row key={item.id} label={item.label} icon={item.icon} iconNode={item.iconNode} isActive={activeId === item.id} onClick={() => navigate(item.id, 'studio')} />
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
    { kind: 'workspace',  label: 'Workspace', icon: 'navbar-workspace' },
    { kind: 'insights',   label: 'Insights',  icon: 'insights' },
    { kind: 'fabric',     label: 'Fabric Configuration', iconNode: <IcFabricNav /> },
  ];

  const toggleSection = (kind) => setOpenSection(prev => {
    const next = prev === kind ? null : kind;
    if (next) setLastSection(next);
    return next;
  });

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

  // A `--panel-open` modifier on the wrapper shifts the rail's own hover
  // tooltip (.nav-item__btn--rail-collapsed::after, leftNavAlt.css) past
  // the panel's right edge instead of over it — that tooltip is
  // position:fixed at a hardcoded left offset tuned for Option 2, where
  // nothing but main content sits to the rail's right; Option 4's panel
  // otherwise renders directly underneath it while open.
  const innerContent = (
    <>
      <aside className="leftnav leftnav-alt--rail">{railContent}</aside>
      <aside className={`leftnav-split__panel${isOpen ? ' leftnav-split__panel--open' : ''}`}>
        <div className="leftnav-split__panel-inner">
          <div className="leftnav-split__panel-header">
            <span className="leftnav-split__panel-title">{panelLabel}</span>
            <button className="leftnav-split__panel-close" onClick={() => setOpenSection(null)} aria-label="Collapse panel">
              <Ic size={12} path={<path d="M18 6 6 18M6 6l12 12"/>}/>
            </button>
          </div>
          <div className="leftnav-split__panel-body">
            {panelBody()}
          </div>
        </div>
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
