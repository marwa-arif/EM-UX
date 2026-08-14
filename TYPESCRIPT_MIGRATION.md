# TypeScript Migration Plan (Language + Tooling Only)

## Context
EM-UI must adopt the org's required stack — TypeScript (strict), ESLint/Prettier config, path aliases, yarn — even though this app is a design/prototype tool, not the production UI that stack spec describes.

**Scope decision (locked in 2026-08-11): language + tooling only.** Everything else in the target spec is explicitly OUT of scope for EM-UI:
- Styling stays plain CSS on the DS 2.0 token system (`design-system-2.0/`) — **no Tailwind, no Radix, no antd.** Do not touch this without a new explicit decision; it conflicts with the DS 2.0 CLAUDE.md rules.
- State stays on React Context (`WorkspaceCtx`, `ToastCtx`, `DownloadsContext`) — no Zustand/Immer migration.
- Data stays static/mock (`src/data/`, `serversData.js`) — no Apollo/GraphQL Codegen.
- Auth stays the mock password gate (`authGate.js`/`PasswordGate.jsx`) — no real OIDC.
- No test-suite buildout as part of this plan (may happen separately later).

**How to resume:** check the `Status` field on each phase below, start at the first `PENDING` phase. Convert one file (or one small file-group) per commit — do not batch the whole phase into one commit. Update this file's status line the moment a phase completes, in the same session, so the next session picks up correctly.

---

## Phase 0 — Tooling Setup
**Status: PENDING**

1. Install: `typescript`, `@types/react`, `@types/react-dom`, `typescript-eslint`, `eslint-plugin-sonarjs`, `prettier`, `eslint-plugin-import` (or `eslint-plugin-import-x`).
2. `tsconfig.json` — `"strict": true`, `"allowJs": true` (lets untouched `.jsx`/`.js` coexist with converted `.tsx`/`.ts` during the migration), `"jsx": "react-jsx"`, `"noUnusedLocals": true`, `"noUnusedParameters": true`.
3. Path aliases — use a **reduced local set**, not the full org list (the org's `@graphql/*`, `@pai/*`, `@user-contexts/*`, `@lib/auth` map to modules that don't exist in this scope):
   - `@components/*` → `src/components/*`
   - `@pages/*` → `src/pages/*`
   - `@styles/*` → `src/styles/*`
   - `@context/*` → `src/context/*`
   - `@hooks/*` → `src/hooks/*`
   - `@utils/*` → `src/utils/*`
   - `@data/*` → `src/data/*`
   - Mirror these in `vite.config.js` under `resolve.alias` (Vite doesn't read `tsconfig.json` paths automatically).
   - Only 15 files currently import at `../../` depth and 0 at `../../../` — low-pain rewrite, do it opportunistically per-file during each phase below rather than a single repo-wide sed pass.
4. ESLint config — org's ~270 rules incl. `sonarjs`, plus Prettier with `singleQuote: true, printWidth: 150, trailingComma: "es5"` and an import-sort plugin. **Do not add the Tailwind class-sorting Prettier plugin** — no Tailwind in this repo.
5. `package.json` → yarn: delete `package-lock.json`, run `yarn install` to generate `yarn.lock`. **Confirm with the user before deleting the lockfile** — this is a one-way, deliberate commit, not a silent side effect of another change.
6. Add `src/utils/logger.ts` (small: `debug`/`warn`/`error` wrapping `console`, gated so it can be silenced in prod). Replace the 3 existing `console.log` call sites:
   - `src/measure2.js:16`
   - `src/components/ActiveFilterPanel.jsx:496`
   - `src/components/SubHeader.jsx:212`
7. Verify: `yarn dev` still runs, `yarn build` still builds, before touching any component.

---

## Phase 1 — Data shape files + tiny leaf files (0–120 lines)
**Status: PENDING**
Convert first: these define shapes other files will import types from, and are small enough to de-risk the whole approach.

Data/shape files (type these *first* — downstream pages inherit the types):
- `src/data/discoverRecords.js`
- `src/pages/ux3/serversData.js` (411 lines but pure data — no JSX, low risk despite size)

Tiny leaf files:
- `src/currentUser.js`, `src/main.jsx`, `src/components/CopilotFab.jsx`, `src/utils/crossFilter.js`, `src/hooks/useToastExit.js`, `src/pages/UserSettingsPage.jsx`, `src/hooks/useChartFilters.js`, `src/pages/AdminPage.jsx`, `src/components/ErrorBoundary.jsx`, `src/authGate.js`, `src/components/DSDropdown.jsx`, `src/measure2.js`, `src/components/PasswordGate.jsx`, `src/pages/ErrorPage.jsx`, `src/context/ToastCtx.jsx`, `src/hooks/useSpeechToText.js`, `src/components/SegmentedTabs.jsx`, `src/components/entityTypes.jsx`, `src/components/VersionBadge.jsx`, `src/components/ClickExploreOverlay.jsx`, `src/components/TablePagination.jsx`, `src/components/SplashScreen.jsx`, `src/components/EntityRelSummaryGraph.jsx`, `src/DownloadsContext.jsx`, `src/components/DonutChart.jsx`, `src/ui.jsx`, `src/components/HelpSupportPanel.jsx`

---

## Phase 2 — Small/medium components + pages (120–300 lines)
**Status: PENDING**
- `src/pages/admin/RiskConfig.jsx`, `src/pages/StudioHomePage.jsx`, `src/pages/admin/Workspace.jsx`, `src/pages/LibraryPage.jsx`, `src/pages/UX3Page.jsx`, `src/pages/settings/UserSettingsBody.jsx`, `src/pages/WorkspacePage.jsx`, `src/pages/admin/AdminPanelBody.jsx`, `src/pages/admin/IdentitySecurity.jsx`, `src/components/ProductTour.jsx`, `src/pages/admin/DataIntegrations.jsx`, `src/components/SubHeader.jsx`, `src/components/Topbar.jsx`, `src/components/NotificationPanel.jsx`, `src/pages/admin/shared.jsx`, `src/pages/admin/SecurityCompliance.jsx`, `src/components/DrawerShell.jsx`

**Convert `src/context/WorkspaceCtx.jsx` last in this phase, as its own commit.** It's only 276 lines but is consumed almost everywhere — typing its state/hook shape correctly will surface every mismatched consumer at once. Expect follow-up fixes in files converted in later phases that haven't been typed yet; re-check them once they're reached.

---

## Phase 3 — Medium components + pages (300–650 lines)
**Status: PENDING**
- `src/pages/ux3/ClientServersV3.jsx`, `src/components/LeftNav.jsx`, `src/pages/ux3/UX3Home.jsx`, `src/pages/admin/UsersAndAccess.jsx`, `src/components/tweaks-panel.jsx`, `src/pages/SavedPage.jsx`, `src/pages/AssessmentsPage.jsx`, `src/components/CanvasPanel.jsx`, `src/components/ReasoningEngine.jsx`, `src/pages/ux3/UX3LeftNav.jsx`, `src/pages/navigatorEngine.js`, `src/components/AssetDetailDrawer.jsx`, `src/pages/ComplianceMatrixPage.jsx`, `src/components/ActiveFilterPanel.jsx`, `src/pages/DataConfigPage.jsx`, `src/pages/ReportPreviewPage.jsx`

**Note:** `src/pages/ux3/ExposureOverviewV3.jsx` (496 lines) is dead code — never mounted (`UX3Page` only renders `ClientServersV3` or a placeholder). Confirm with the user whether to delete it instead of typing it; don't spend conversion effort on unreachable code without checking first.

---

## Phase 4 — Large pages (650–1300 lines)
**Status: PENDING**
- `src/pages/ComplianceFindingsPage.jsx`, `src/pages/DataQualityOverviewPage.jsx`, `src/pages/DiscoverCloudPage.jsx`, `src/pages/DiscoverIdentityPage.jsx`, `src/pages/DiscoverDevicePage.jsx`, `src/pages/ExposureOverviewPage.jsx`, `src/pages/DataQualityInDepthPage.jsx`

Convert `src/App.jsx` (1239 lines) **last in this phase**, once all its children above and in earlier phases are typed — typing it against already-typed child props is far easier than typing it first.

---

## Phase 5 — The 9 largest/highest-risk files (one file = one sub-phase = one commit)
**Status: PENDING**
Convert in this order (smallest of the group first, to build up shared type patterns before the biggest ones):

- [ ] `src/components/ChartRender.jsx` (1554 lines)
- [ ] `src/pages/FindingsPage.jsx` (1746 lines)
- [ ] `src/components/AssessmentBuilder.jsx` (1748 lines)
- [ ] `src/components/NavigatorPanel.jsx` (1788 lines)
- [ ] `src/pages/NavigatorPage.jsx` (2466 lines)
- [ ] `src/pages/KGPage.jsx` (2820 lines)
- [ ] `src/pages/CompliancePage.jsx` (2898 lines)
- [ ] `src/components/FilterPanel.jsx` (3354 lines)
- [ ] `src/pages/DashboardCanvas.jsx` (4031 lines)

These 9 files are ~half the codebase's line count. Expect each to take real time — don't compress into one sitting. Watch for two things while converting each:
1. **Latent bugs surfacing** — typing loose JS at this size commonly reveals a shape mismatch that was previously silently `undefined`. Fix the bug, note it in the commit message, don't just widen the type to make it compile.
2. **`sonarjs` complexity/duplication rules firing hard** — decide per-case whether to refactor or suppress-with-a-comment (the org's "no `any` without justification" rule implies the same bar applies to lint suppressions: justify, don't silently disable).

---

## Phase 6 — Repo-wide cleanup + final verification
**Status: PENDING**
1. `tsc --noEmit` clean across the whole repo, zero implicit `any`, zero unused locals/params.
2. Full ESLint pass clean (or every remaining violation has a justification comment).
3. `yarn build` succeeds.
4. Run the project's `/verify` skill flow — start the app, drive it with Playwright, confirm no runtime regressions on the pages touched in phases 1–5 (pay particular attention to anything downstream of `WorkspaceCtx` given Phase 2's note above).
5. Delete any remaining `.jsx`/`.js` stragglers found by `find src -name "*.jsx" -o -name "*.js"` — should return nothing but `.tsx`/`.ts`.

---

## Out of scope — do not do these without a new explicit decision
- Tailwind / Radix / antd styling migration
- Zustand + Immer state migration
- Apollo Client + GraphQL Codegen
- Real OIDC auth
- Vitest/Playwright/jest-axe test-suite buildout
