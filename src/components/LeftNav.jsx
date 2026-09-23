import React from 'react'
import { Ic } from '../ui.jsx'

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
  { id: 'kg',         label: 'Knowledge Graph', icon: 'navbar-kg',         solo: true },
  { id: 'report',     label: 'Report',          icon: 'navbar-report',     children: [
      { id: 'report/compliance',          label: 'Compliance',          icon: 'nav-report-compliance' },
      { id: 'report/assessments',         label: 'Assessments',         icon: 'nav-report-assessments' },
      { id: 'report/compliance-matrix',   label: 'Compliance Matrix',   icon: 'nav-report-matrix' },
      { id: 'report/compliance-findings', label: 'Compliance Findings', icon: 'nav-findings' },
  ]},
  { id: 'data-quality', label: 'Data Quality',  icon: 'navbar-data quality', children: [
      { id: 'data-quality/overview', label: 'Overview',  icon: 'nav-overview' },
      { id: 'data-quality/in-depth', label: 'In-Depth',  icon: 'nav-dq-indepth' },
  ]},
];

// A dashboard saved from the Workspace builder can be pinned to one of the
// Insights sections above (see the Save modal's "Save Dashboard Under"
// field) so it shows up as a real left-nav destination there, not just in
// Workspace > Saved. Exposure's pinned dashboards insert right after
// "Findings" — the one anchor point actually requested; every other section
// just appends to the end of its existing children.
const SAVED_DASHBOARD_ANCHOR = { exposure: 'exposure/findings' };

// "Standalone Dashboard" (the Save modal's "Save Dashboard Under" field) is
// deliberately not one of the nestable Insights sections above — a dashboard
// saved this way becomes its own new top-level leaf, the same flat,
// single-click treatment every section header gets, rather than being nested
// a click deeper inside one. It's anchored right after Data Quality — the
// last Insights section — in the list (not turned into a child of any
// section — that would make it an expandable parent and bury the pinned
// dashboard, plus make that section's own page unreachable through its icon
// unless it grew a synthetic self-link child). Its id deliberately has no
// '/' in it (unlike the nested-child ids below): a top-level item's
// active/selected state is matched via `current.split('/')[0] === item.id`
// (see LeftNavAlt.jsx's `activeParent`), which only works for a slash-free id.
const STANDALONE_NAV_SECTION = 'standalone';
const STANDALONE_ANCHOR_ID = 'data-quality';

// A user-created section (the same "Save Dashboard Under" field's
// "+ Create New Section" option, DashboardCanvas.jsx) behaves like Exposure/
// Discover/Report/Data Quality — a real expandable parent — except it has no
// built-in children of its own to start from, and it isn't one of the fixed
// INSIGHTS_MODEL entries, so it's appended as a brand new top-level group at
// the end of the list (after Data Quality/Standalone Dashboard) rather than
// inserted into an existing one. `customSections` is the reusable registry
// (SavedDashboardsCtx.jsx) — a section only actually renders here once at
// least one saved dashboard references it again; being in that registry just
// keeps it pickable from the dropdown even if it's briefly empty.
const isFixedNavSection = (id) => id === STANDALONE_NAV_SECTION || INSIGHTS_MODEL.some(s => s.id === id);

export function withSavedDashboards(model, savedDashboards, customSections = []) {
  const nestedBySection = {};
  // Both a "Standalone Dashboard" leaf and a custom section's group get
  // appended after Data Quality, in a single shared list — they need one
  // combined ordering, not two separate passes (one always inserting
  // standalone leaves, then a second always appending every custom section
  // after them), or a dashboard saved standalone *after* a custom section
  // already existed would still show up before it.
  const appended = [];
  const groupBySection = {};
  // savedDashboards is newest-first (addSavedDashboard prepends each new
  // entry) — walk it oldest-first so `appended`'s order matches actual save
  // order. A custom section's position is set by its *first* dashboard;
  // later dashboards saved into the same section just add a child there
  // without moving it.
  const chronological = [...savedDashboards].reverse();
  for (const d of chronological) {
    if (!d.navSection || d.navSection === 'workspace') continue;
    if (d.navSection === STANDALONE_NAV_SECTION) {
      appended.push({ id: `standalone-saved-${d.id}`, label: d.name, icon: 'saved', solo: true });
    } else if (isFixedNavSection(d.navSection)) {
      (nestedBySection[d.navSection] ??= []).push({ id: `${d.navSection}/saved-${d.id}`, label: d.name, icon: 'saved' });
    } else {
      let group = groupBySection[d.navSection];
      if (!group) {
        const label = customSections.find(cs => cs.id === d.navSection)?.label ?? d.navSection;
        group = { id: d.navSection, label, icon: 'saved', children: [] };
        groupBySection[d.navSection] = group;
        appended.push(group);
      }
      group.children.push({ id: `${d.navSection}/saved-${d.id}`, label: d.name, icon: 'saved' });
    }
  }
  if (Object.keys(nestedBySection).length === 0 && appended.length === 0) return model;

  let result = model.map(section => {
    const extra = nestedBySection[section.id];
    if (!extra) return section;
    const existing = section.children ?? [];
    const anchor = SAVED_DASHBOARD_ANCHOR[section.id];
    const anchorIdx = anchor ? existing.findIndex(c => c.id === anchor) : -1;
    const children = anchorIdx >= 0
      ? [...existing.slice(0, anchorIdx + 1), ...extra, ...existing.slice(anchorIdx + 1)]
      : [...existing, ...extra];
    return { ...section, children };
  });

  if (appended.length) {
    const anchorIdx = result.findIndex(s => s.id === STANDALONE_ANCHOR_ID);
    result = anchorIdx >= 0
      ? [...result.slice(0, anchorIdx + 1), ...appended, ...result.slice(anchorIdx + 1)]
      : [...result, ...appended];
  }
  return result;
}

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
