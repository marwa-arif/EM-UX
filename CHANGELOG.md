# Changelog

All notable UI changes are tracked here.  
**Rule:** Move `[Unreleased]` entries to a versioned section before every push — run `npm run version:patch` (or `minor` / `major`).

---

<!-- pull: 2026-05-18 11:41 | branch: develop | 320a60d feat: Navigator view modes, versioning system, and layout token pass -->
<!-- pull: 2026-05-19 11:38 | branch: develop | 44c229d Merge feature/ui-updates into develop (v0.1.2 — CSS common.css refactor) -->
<!-- pull: 2026-05-19 18:31 | branch: feature/ui-updates | 6f2cf09 Refactor DonutChart to shared component, update findings tooltips and chart styling -->
<!-- pull: 2026-05-20 10:54 | branch: develop | cac10fe Merge feature/ui-updates into develop -->
<!-- pull: 2026-05-25 09:39 | branch: feature/ui-updates | ffd274f fix: KG dark mode — entity node dark tints and SVG CSS variable fixes -->
<!-- pull: 2026-05-25 11:06 | branch: feature/ui-updates | 17dc21e chore: bump to v0.3.0 -->
<!-- pull: 2026-05-26 11:49 | branch: feature/ui-updates | ea7d844 Merge branch 'develop' into feature/ui-updates -->
<!-- pull: 2026-05-29 18:19 | branch: feature/ui-updates | 1ff149a chore: bump to v0.5.0 -->
<!-- pull: 2026-06-01 10:58 | branch: feature/ui-updates | a2d3541 fix: DS 2.0 token compliance pass on dashboard.css, active-filter-panel.css, DashboardCanvas -->
<!-- pull: 2026-06-01 10:59 | branch: subfeature | 801f882 Merge branch 'subfeature' of https://github.com/marwa-arif/EM-UI into subfeature -->
<!-- pull: 2026-06-09 09:44 | branch: feature/ui-updates | 8d7c413 chore: bump to v0.6.4 -->
<!-- pull: 2026-06-23 11:03 | branch: develop | 3a6e66c Merge feature/ui-updates into develop (v0.6.6 — DS token pass and font scale audit) -->
<!-- pull: 2026-06-23 11:28 | branch: feature/ui-updates | 06d642d chore: bump to v0.6.6 -->
<!-- pull: 2026-07-21 16:32 | branch: feature/ui-updates | 2cd785f Merge pull request #5 from marwa-arif/feature/studio-workspace -->
## [Unreleased]
> Add your changes here as you work. Run `npm run version:patch` before pushing.

### Added
### Changed
### Fixed

---

## [0.13.0] — 2026-07-27
### Added
- Navigator: default seeded agents (Critical Vuln Triage, Cloud Misconfig Hunter, Identity Risk Reviewer, Device Patch Compliance, App Exposure Monitor, Compliance Gap Auditor) so the Home agent picker and Agents list aren't empty on first use.
- Navigator: edit-in-place for existing agents in AgentBuilderView (was create-only).
### Changed
- Navigator: saved-agent dropdown menu now renders via a portal so it isn't clipped by ancestor overflow.

---

## [0.12.0] — 2026-07-22
### Added
- Saved page: delete confirmation modal (names the dashboard/report, states the action can't be undone) and a success toast on confirm.
### Changed
- Subheader filter pill group restyled — pill wrapper now transparent/borderless, individual filter pills carry the card background and border instead.

---

## [0.11.5] — 2026-07-22
### Added
- Hover tooltips on every info icon across Exposure Overview (header, column labels, Trend Explore drawer cards), matching the app's white-card tooltip style.
- Exposure-by table rows: clicking a row's name now navigates to Findings the same way the row's Explore button does.
- Category filters carried from Exposure Overview into Findings now surface in the shared Active Filters pill/panel instead of a page-local "Filtered by" bar, and clearing them from that panel resets the table.
- Graph-based visual filter builder (node canvas, attribute panels, date-range picker) now embeds directly into the Filter panel instead of living in a separate Knowledge Graph-only drawer.
### Changed
- Exposure Overview's "Exposure by" dropdown and row-action buttons now use the same comp-sort-btn pill pattern as other dashboards, instead of a page-specific style.
- Bubble ring icon color and the hover "Explore" button now always match the ring's severity color (red/orange) instead of a fixed color.
- Exposure Trend header pill regrouped into label / sparkline / stat sections, with the trend stat shown as a pill badge matching the Enterprise Score gauge's indicator.
- Mini progress bars in the contribution table now fill their column's available width instead of a fixed 100px track.
- Trend Explore drawer: the top card's title now toggles between "Exposure Score" and "Sum of Exposure" to match the selected metric, and all three trend charts use one consistent line color.
### Fixed
- Trend Explore chart Y-axis label no longer overlaps the tick values.
- Attack Surface bubble hover "Explore" button no longer gets clipped by the page's scroll boundary.

---

## [0.11.4] — 2026-07-22
### Changed
- UX 3.0: Exposure Overview now shows the "Coming Soon" placeholder like every other unbuilt page, instead of its built-out content — Client Servers remains the only page with real content, and no longer needs an "Explore in Current UX" button since it has no classic-shell equivalent to link to.
- UX 3.0: Client Servers is now the default page on entry (was Exposure Overview).
- UX 3.0: the URL now tracks the active sub-page (`/ux3/exposure/findings`, `/ux3/client/servers`, etc.) instead of staying at `/ux3` regardless of navigation, and deep-linking directly to any `/ux3/<page>` URL now lands on that page.

---

## [0.11.3] — 2026-07-22
### Added
- UX 3.0: "Explore in Current UX" button on every unbuilt placeholder page, linking to its classic-shell equivalent (falls back safely when no classic page exists yet).
### Fixed
- Fixed `ReferenceError: Cannot access 'PAGE_META' before initialization` that broke both "Back to Classic Dashboard" and the new "Explore in Current UX" button — `PAGE_META` was declared inside `App()` after several early `return`s (workspace/ux3/admin routes), so routes reaching those returns never initialized it before `handleNav` closures referenced it. Moved to module scope.

---

## [0.11.2] — 2026-07-22
### Changed
- UX 3.0 Client Servers trend charts: switched to a stacked bar + line combo chart, with a per-period "Average" (mean of Critical/High/Medium) plotted as a dotted line against its own right-side y-axis.
- Client Servers demo data (`serversData.js`) is now fully synthetic — fictional HOD names, hostnames, and IP ranges, no longer sourced from a real client report.

---

## [0.11.1] — 2026-07-22
### Changed
- Default landing route switched from Exposure Overview to Navigator.
### Fixed
- UX 3.0 Client Servers table: numeric column headers/values now center-align consistently instead of drifting to right/left across header vs body cells.

---

## [0.11.0] — 2026-07-22
### Added
- Password gate (authGate.js, PasswordGate.jsx) for app-level access control.
### Changed
- Follow-on Navigator/Workspace/Library refinements from the Build/Ask/Research unification work.

---

## [0.10.0] — 2026-07-20
### Added
- Navigator Build mode's chat now runs on the same reasoning engine as Ask/Research (streamed step traces, tool narration) instead of a separate scripted chat, via a new `build` reasoning tier.
- Working "Add to Workspace": both Build mode's canvas and Ask/Research's canvas panel can now hand their widgets off into a brand-new, pre-populated Workspace dashboard — previously a dead, `onClick`-less button.
- Research mode now reasons measurably deeper than Ask on the same question — forces the phased "deep" tier and adds a "Source Corroboration" phase — instead of only differing in home-screen placeholder text.
### Changed
- Navigator Build mode's widgets are now built on Workspace's own widget schema/renderer (`WidgetCard`/`ChartRender`) instead of a separate, disconnected `NavWidget` system — removes a translation layer and a dead-end `localStorage` save.
- Build mode's shell (topbar, chat pane, resize dragger, canvas header) now matches Ask/Research's visual pattern instead of a separate, inconsistent layout.
- Build mode's widget-context bar (shown when a widget is selected) now sits just above the composer instead of floating at the top of the chat pane, so it reads as scoped to the input right below it.
### Fixed
- KPI widgets synthesized from Ask/Research's "Add to Workspace" no longer render a duplicated trend arrow (e.g. "↓ ↑ 6%").

---

## [0.9.0] — 2026-07-20
### Added
- Assessment Builder / Dashboard Copilot: canvas-driven changes (picking an entity, setting a condition, adding/resizing a widget, etc.) now sync back into the Copilot chat, matching the existing Copilot-to-canvas direction — `BuilderChat` polls the canvas snapshot and catches its narration up to whatever stage the canvas already reached.
### Changed
- Assessments page: removed the separate "Build with Copilot" button — "+ New assessment" is the only entry point now, since the manual builder already offers a "Use Navigator" hand-off.
- Assessment Builder's "Use Navigator" button now uses the Navigator brand gradient and icon instead of a generic outline style.

---

## [0.8.1] — 2026-07-20
### Added
- `public/404.html` SPA fallback so deep-linking/refreshing a route on GitHub Pages redirects back through `index.html` instead of hitting a real 404.
### Changed
- `vite.config.js`: `base` is now `/EM-UX/` when built with `GH_PAGES=true` (used by the Pages workflow), `/` otherwise.
### Fixed
- GitHub Pages deploy was fully broken under the `/EM-UX/` subpath: 132 hardcoded `/assets/...` image/icon references across 22 files resolved to the wrong URL (fixed via `<base href>` + relative paths); client-side routing (`history.pushState`/`window.location.pathname` parsing in App.jsx) assumed the app lived at domain root, so the very first render fell into the app's own 404 page; logout and the error page's "Go to dashboard" button hard-navigated to `/`, escaping the subpath.

---

## [0.8.0] — 2026-07-17
### Added
- Navigator now opens as a full page (not modal) with its own left-nav entry and route.
- Navigator gained a History panel and Home button, replacing the old sidebar/thread-switcher panel.
- Copilot builder chat now supports both Assessment and Dashboard building, scoped per surface.
- Dashboards/reports can be edited via a "Build with Copilot" flow and per-widget "Edit with Copilot".
- DashboardCanvas: undo/redo, zoom controls, and a floating canvas toolbar.
- DashboardCanvas: Share, Schedule Assistant, Stop Schedule, and Download (Excel) modals.
- DashboardCanvas: delete-dashboard confirmation modal and a "More actions" menu.
- Navigator chat: thread rename (inline) and delete-thread confirmation modal.
- Navigator Build view: delete-widget confirmation modal.
- Workspace pages now embed the shared right panel (Navigator/Filter), so Navigator can open docked while in Workspace.
### Changed
- Dashboard toolbar reorganized into two rows and auto-stacks/compacts responsively on narrow widths.
- Widget mutations (add/configure/remove) now route through a single undo-aware state path shared by the manual panel and Copilot.
- Navigator's mode-depth slider is now keyboard-operable (arrow keys, Home/End) with proper ARIA slider semantics.
- Follow-up suggestion items converted from styled anchors to accessible buttons (removed inline styles).
- Compliance dropdown menus support a wider variant for longer labels.
### Fixed
- Navigator panel follow-up composer previously discarded the typed message instead of sending it.
- Clicking the LeftNav "Navigator" item while already mid-chat now correctly resets to the Home screen.
- Canvas Results panel's "Add to Workspace" button no longer wraps to its own line — aligned top-right with the panel title.
- Chat view lost its white background when the canvas panel was hidden; restored, centered on the conversation column.

---

## [0.7.0] — 2026-07-16
### Added
- Studio Home page and Admin section (Workspace, Users & Access, Data Integrations, Identity & Security, Risk Config, Security & Compliance)
- UX3 exposure overview and client servers views, with dedicated left nav
- Assessment Builder and Canvas Panel components
- Copilot FAB entry point and Reasoning Engine component
- Navigator engine module supporting the Navigator redesign work

---

## [0.6.6] — 2026-06-23
### Changed
- DS token pass: replaced all hardcoded hex in dashboard.css rv-* block and tooltip block with CSS variables; added `--tooltip-bg`/`--tooltip-fg` tokens to global.css; applied `color-scheme: light` to `.rv-page`
- Font scale audit: fixed out-of-scale font sizes (7/8/9px → 10px, 15px → 14px, 11.5/12.5px → 12px, 17px → 16px) across compliance.css, kg.css, navigator.css, active-filter-panel.css, library.css

---

## [0.6.5] — 2026-06-23
### Changed
- SplashScreen: extracted from App.jsx into its own component file with dedicated splash-screen.css
- DashboardCanvas, WorkspacePage, AssessmentsPage: minor UI fixes
- device.css, kg.css, assessments.css, dashboard.css: style tweaks and token cleanup
- DS token pass: replaced all hardcoded hex in dashboard.css rv-* block and tooltip block with CSS variables; added `--tooltip-bg`/`--tooltip-fg` tokens to global.css; applied `color-scheme: light` to `.rv-page`
- Font scale audit: fixed out-of-scale font sizes (7/8/9px → 10px, 15px → 14px, 11.5/12.5px → 12px, 17px → 16px) across compliance.css, kg.css, navigator.css, active-filter-panel.css, library.css

---

## [0.6.4] — 2026-06-08
### Changed
- SplashScreen: reworked animation to stroke-draw SVG paths with staggered delays
- ComplianceMatrixPage: replaced `pai-high-fg` with `pai-med-fg` for Moderate score color

---

## [0.6.3] — 2026-06-08
### Changed
- Download as Excel modal: replaced radio buttons (All/Specific tables) with a direct checkbox list
- Download as Excel modal: removed "Don't show this again" option and localStorage gate
- Download as Excel modal: updated description text and removed "Tables to include" section header
- Download as Excel modal: added Note footer clarifying charts are not exportable and each table downloads separately
- sfm-table-list padding set to 12px left and right

---

## [0.6.2] — 2026-06-08
### Added
- Assessments table: styled hover tooltips on findings counts showing "Passed Findings" / "Failed Findings"

---

## [0.6.1] — 2026-06-08
### Changed
- Renamed Open/Closed terminology to Failed/Passed across compliance, findings, and assessments
- Compliance table headers: Closed → Passed, Open → Failed
- Findings Breakdown KPI labels: added (Closed)/(Open) suffixes in grey regular weight
- "Include Closed Findings" toggle renamed to "Include Passed Findings" in all drawers and ComplianceFindingsPage
- Compliance matrix tooltip: Open findings → Failed findings
- Exposure Findings table header: Open Findings → Failed Findings
- Compliance tree table cells: removed vertical padding

---

## [0.6.0] — 2026-06-03
### Added
- Executive Summary report template (20 widgets: KPI, vert-bar, pie, hor-bar, table) in DashboardCanvas
- ReportPreviewPage: paginated A4 layout, cover page, save/schedule/share/download modals
- workspace/report filter panel, breadcrumb, and active-filter chip support in WorkspacePage
- hor-bar charts: LabelList value labels, x-axis label, per-widget description notes (vulnerability/os/service templates)
- `printMode` prop on WidgetCard/ChartRender — suppresses tooltips in PDF preview
- Table widgets hug content height via `dc-report-chart-row--table` CSS modifier
### Changed
- WidgetCard exported from DashboardCanvas so ReportPreviewPage renders identical widgets to editor
- Report editor chart cards restore explicit height (removed `height:auto` override that collapsed Recharts)
- sfm-checkbox-row: `align-items: flex-start` + `line-height: 1.4` to fix multi-line label alignment
- hor-bar chart description note: removed border-top divider
### Fixed
- 500 error on Library → Executive Summary: undeclared `note` variable in ChartRender pie renderer
- Recharts charts invisible in report editor due to `height:auto` collapsing card body flex chain

---

## [0.5.2] — 2026-05-29
### Changed
- `dashboard.css`: DS 2.0 token fixes — `border-radius` normalised (cards→4px, inputs→8px, toggles→12px), z-index clamped to 300 tier, font-size floor 11px, spacing to 4pt grid, toolbar height 48px
- `active-filter-panel.css`: z-index `10006` → `300` on `.sfm-dialog`
- `DashboardCanvas.jsx`: chart-type picker buttons use CSS classes + CSS vars only (no inline styles); `.dc-field-sub-label` margin-top via CSS modifier class

---

## [0.5.1] — 2026-05-29
### Added
- `error-page.css` — extracted ErrorPage styles from inline JSX to proper CSS classes
- `wp-root`, `wp-body`, `wp-main` layout classes added to `shell.css` for WorkspacePage shell
### Changed
- ExposureOverviewPage: `exp-trend-pill`, `exp-collapse-btn`, `exp-groupby-btn`, `exp-explore-btn` now layer `ds-btn` base classes
- WorkspacePage: layout inline styles replaced with CSS class references
### Fixed
- FindingsPage: replaced `fin-btn` custom classes with `ds-btn sz-md t-outline / t-primary`
- ComplianceFindingsPage: replaced `comp-drawer-download-btn` with `ds-btn sz-sm t-outline`
- DashboardCanvas: widget delete now shows confirmation modal naming the widget before deletion
- ErrorPage: all inline `style={{}}` blocks extracted to `error-page.css`

---

## [0.5.0] — 2026-05-27
### Added
- Stacked vertical bar (`stack-vert`) Recharts implementation with 12 origin stacks, legend, and per-segment hover tooltip
- `stack-vert` data tab in widget settings: Magnitude (x-axis) + Classification (y-axis) attribute fields with graph filter modals, Size row with graph filter action, Widget Filter with chips, Show Legend and Explode Array Field Values toggles
- `InfoTooltip` component — reusable ⓘ icon with CSS tooltip; `FieldRow` and `ToggleRow` accept a `tooltip` prop
- `graph-filter.svg` icon asset added to `public/assets/icons/`
- `GraphFilterModal` `mode="filter"` returns `{ attr, values }` object for Widget Filter chip state
### Changed
- Widget Filter field uses read-only input + chips-below pattern (matching Columns field in table widget)
- Info tooltip uses hardcoded contrast-safe colors (`#e2e4f0` on `#1a1c2e`) with `white-space: normal` and `max-width: 260px` for long text

---

## [0.4.6] — 2026-05-26
### Added
- `dashboard.css` with `dc-` prefix classes for DashboardCanvas components
- `active-filter-panel.css` extracted from inline styles
### Changed
- DashboardCanvas: extracted inline styles to `dashboard.css`; Add Widget button fixed to small width (span 1) × small height (260px) across all dashboard types
- Discover page: Add Widget button moved into `dev-bottom-row` below Data Source, aligned to same column width
- Filter panel canvas dotted background updated to `var(--pai-border-strong)` to match Dashboard canvas
- Compliance drawers: renamed "Open findings" → "Failed findings" and "Closed findings" → "Passed findings"

---

## [0.4.5] — 2026-05-26
### Fixed
- KG table row click: restored slide-over detail panel (dropped during inline-CSS refactor)

---

## [0.4.4] — 2026-05-26
### Changed
- KG graph: removed mouse scroll wheel zoom; zoom is now button-only (`+` / `−` rail buttons)

---

## [0.4.3] — 2026-05-26
### Added
- `Container` entry added to ExposureOverviewPage TABLE_DATA
### Changed
- Add `--table-th-padding` / `--table-td-padding` CSS tokens to global.css
- Apply table padding tokens across compliance, device, exposure, findings, and kg stylesheets (replaces hardcoded `8px 12px` / `10px 12px` values)
- Merge branch `develop` into `feature/ui-updates`

---

## [0.4.2] — 2026-05-26
### Changed
- Eliminated inline `style={{}}` props from `CompliancePage`, `ComplianceMatrixPage`, `ComplianceFindingsPage`, `AssessmentsPage`, and `PageKG` — replaced with CSS classes and CSS custom-property injection
- `compliance.css`, `assessments.css`, and `kg.css` extended with semantic `comp-*`, `asmts-*`, `cfp-*`, and `kg-*` utility classes

---

## [0.4.1] — 2026-05-26
### Changed
- Eliminated inline `style={{}}` props from `CompliancePage`, `ComplianceMatrixPage`, `ComplianceFindingsPage`, `AssessmentsPage`, and `PageKG` — replaced with CSS classes and CSS custom-property injection
- `compliance.css`, `assessments.css`, and `kg.css` extended with semantic `comp-*`, `asmts-*`, `cfp-*`, and `kg-*` utility classes
### Fixed
- KG table row click: restored slide-over detail panel (dropped during inline-CSS refactor)
- Renamed breadcrumb root label from "Dashboard" to "Home" across all pages

---

## [0.4.0] — 2026-05-25
### Added
- ActiveFilterPanel: full entity tree view (Host, Storage, Network, Container, Network Services, Cluster, Identity) with Has Finding sub-nodes and Finding leaf nodes
- Implicit Filters toggle (off by default): preset Activity Status / Contributed To / Status chips at Finding level; non-removable
- SaveFilterModal wired to SubHeader bookmark button (same modal as Active Filter Panel)
- `canCreate` in SaveFilterModal enabled for either new filter name or overwrite selection
- `save.svg` and nav icon assets added
- `afp-relation-chip` CSS style for blue-tinted Has Finding relation nodes
### Changed
- Reset Filters icon uses `reset.svg` paths with `currentColor` (inherits button red)
- Save Filter icon uses save SVG with `currentColor` (inherits button indigo)
- SubHeader panel position anchored to subheader container right edge to prevent overlap when filter panel is open
### Fixed
- KG table row click: restored slide-over detail panel (dropped during inline-CSS refactor)
- Renamed breadcrumb root label from "Dashboard" to "Home" across all pages (App.jsx, WorkspacePage.jsx)

---

## [0.3.1] — 2026-05-25
### Added
- `filter-panel.css` — dedicated stylesheet for FilterPanel component
- `library.css` — dedicated stylesheet for LibraryPage component
### Changed
- Eliminated inline `style={{}}` props from DiscoverDevicePage, DiscoverIdentityPage, DiscoverCloudPage, FilterPanel — replaced with CSS classes and CSS custom-property injection
- `device.css` extended with new utility classes: `dev-tip-card`, `dev-findings-bar`, `dev-crit-seg`, `dev-toggle`, `dev-donut-center`, `dev-type-legend`, `dev-single-legend`, `dev-crit-tooltip`, `dev-stat-header-controls`, `dev-drawer-controls` and more

---

## [0.3.0] — 2026-05-25
### Added
- LeftNav app-mode switcher: chevron dropdown on org-name-row with **Studio** and **Navigator** options
- Studio mode: nav body hidden, header shows "Studio", main content shows Coming Soon screen
- Navigator option in dropdown navigates to full-page Navigator screen
- Studio dropdown shows "EM Dashboard" option to switch back to EM mode
- `IcBuildingBlock` and `IcEMDashboard` inline SVG icons for the switcher
### Changed
- KG table row-click now correctly reopens the slide-over detail panel
- Root-level orphaned files removed; folder structure standardised

---

## [0.2.0] — 2026-05-25
### Added
- ComplianceMatrixPage with sticky x/y axes, comparison badges (Change % with trend icon, absolute score), and structured tooltip
- AssessmentsPage and ComplianceFindingsPage
- Sparkline stroke-dashoffset draw animation on mount
- ScaleX fill animation for framework progress bars
- Clip-path reveal animation for stacked findings breakdown bars
### Changed
- Compliance matrix cell hover redesigned using `currentColor` / per-cell `--hover-border` CSS variable
- Compliance chart legend: circles, per-severity text colors, semi-bold
- Change % formula corrected to `(current − prev) / prev × 100` with 2dp precision
### Fixed
- KG table row click: restored slide-over detail panel (dropped during inline-CSS refactor)
- KG dark mode: all hardcoded hex values in `PageKG.jsx` and `kg.css` replaced with design system tokens
- KG entity node circles, tooltip headers, and selection panel headers now switch correctly on theme toggle
- SVG edge label pill fill moved from attribute to `style` so CSS custom properties resolve in dark mode
- Remaining hardcoded hex (edge lines, dividers, pagination, zoom buttons) replaced with tokens

---

## [0.1.2] — 2026-05-19
### Changed
- Extracted shared CSS patterns from page files into `common.css` (tables, card headers, titles, legend dots, icon-text pairs)
- Removed duplicate table, header, and title rules from `device.css`, `exposure.css`, `findings.css`, `kg.css`

---

## [0.1.1] — 2026-05-18
### Added
- New version badge in topbar

---

## [0.1.0] — 2026-05-18
### Added
- Navigator page with sidebar / floating / fullscreen view modes
- Navigator panel embedded in right-panel shell with view-mode switching
- `initialQuery` prop — deep-link into a chat from any page
- `navigator-page`, `navigator-floating`, `navigator` routing in `handleNav`
- DiscoverDevicePage with Recharts area / bar / pie charts (`ChartRender`)
- `device.css` token-compliant styles for device discovery page
- Left nav accordion — only one section open at a time
- Coming-soon route stubs and per-page URL routing

### Changed
- Navigator layout switched from inline styles to CSS classes (`nav-page-shell`, `nav-page-body`, `nav-page-content`)
- `np-panel`, `np-row`, `np-icon`, `np-lbl` classes replace all inline style props in `NavigatorPage`
- `RightPanelShell` collapses to zero-width when Navigator is in floating mode
- Left nav and shell CSS token-compliance pass across `exposure.css`, `findings.css`, `kg.css`, `shell.css`, `workspace.css`, `global.css`

### Fixed
- KG table row click: restored slide-over detail panel (dropped during inline-CSS refactor)
- Asset paths and URL routing restored after merge conflict
- `recharts` dependency installed after remote merge
