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
## [Unreleased]
> Add your changes here as you work. Run `npm run version:patch` before pushing.

### Added
### Changed
### Fixed

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
