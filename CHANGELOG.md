# Changelog

All notable UI changes are tracked here.  
**Rule:** Move `[Unreleased]` entries to a versioned section before every push — run `npm run version:patch` (or `minor` / `major`).

---

<!-- pull: 2026-05-18 11:41 | branch: develop | 320a60d feat: Navigator view modes, versioning system, and layout token pass -->
<!-- pull: 2026-05-19 11:38 | branch: develop | 44c229d Merge feature/ui-updates into develop (v0.1.2 — CSS common.css refactor) -->
## [Unreleased]
> Add your changes here as you work. Run `npm run version:patch` before pushing.

### Added
### Changed
### Fixed

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
- Asset paths and URL routing restored after merge conflict
- `recharts` dependency installed after remote merge
