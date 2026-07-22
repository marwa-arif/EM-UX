---
name: verify
description: Project-specific recipe for verifying EM-UI (Vite/React) changes by running the app and driving it with Playwright.
---

## Launch

```bash
npm run dev
```
Vite dev server, default `http://localhost:5173` (picks next free port if busy — check the CLI output).

## Engineering health (this repo has no test suite or lint gate)

`package.json` has **no `test` script and no eslint/biome config at all.** The only pre-push hook (`scripts/hooks/pre-push`) checks CHANGELOG.md/semver discipline — it does not run a build, lint, or test. That means driving the app by hand (this skill) is the *entire* correctness gate before code ships, not a supplement to one. Treat a "small CSS tweak" with the same rigor as a logic change — nothing else will catch a regression.

Two cheap checks that catch what a visual pass alone won't, worth doing every verify pass, not just when something looks broken:

- **`npm run build`** — the dev server's HMR silently tolerates things a production build won't. Confirmed clean as of 2026-07-16 (652 modules, builds in ~4s). It does currently warn: single JS chunk is 1.56MB minified (394KB gzip), no code-splitting — not a regression to fix reflexively, but worth flagging if a change adds a large new dependency, since the bundle has no headroom mechanism (`build.rolldownOptions.output.codeSplitting`) in place yet.
- **Browser console, not just the screen** — `page.on('console', ...)` / `page.on('pageerror', ...)` in every Playwright script, and actually read it. A change can look pixel-perfect while throwing a React key warning or silently swallowing an error. Confirmed clean baseline (2026-07-16) across `/`, `/navigator` (including sending a message + opening the LeftNav switcher), `/workspace`, `/knowledge-graph`, `/ux3`, `/admin`, `/report/assessments` — any new console output after a change is a real signal, since the baseline is verified silent.

Playwright itself is reinstalled from scratch in the scratchpad every verify session (see below) rather than a project devDependency — fine for occasional use, but if `/verify` becomes routine, it's worth proposing to the user that it graduate to a real `devDependency` with a checked-in setup script, so any engineer (not just this skill) gets the same repeatable harness. Don't add it to `package.json` unilaterally — that's a dependency change, ask first.

## Reach a page directly

`App.jsx` picks the page from `window.location.pathname` (no react-router). Navigate straight to the page under test instead of clicking through LeftNav:

- `/navigator` → `NavigatorPage`
- `/workspace` or `/workspace/*` → `WorkspacePage`
- `/knowledge-graph` → `PageKG`
- `/ux3` → `UX3Page`
- `/admin` → `AdminPage` (reachable directly by URL regardless of app mode)
- `/` or any other `/report/...`, `/discover/...` etc. path → the matching EM dashboard page via `PAGE_META` in `App.jsx`

**Studio mode can't be reached by a fresh/direct URL navigation** — `appMode` (`'em' | 'studio'`) is in-memory React state, not derived from the URL on load. Click through instead: `.leftnav__switcher` (the workspace-switcher dropdown at the top of LeftNav, shows "EM Dashboard"/"Studio") then the `.leftnav__mode-option-label` option labeled "Studio". This click-through does push `/studio-home` into the URL bar (confirmed), but a *new* `page.goto('http://localhost:5173/studio-home')` 404s — pre-existing bug where the `PAGE_META` guard in `App.jsx` ignores `appMode` on initial mount. Don't re-report that 404 as a new finding; see `[[project_studio_home_nav]]` memory. (The Studio home nav icon asset, `navbar-home.svg`, is also already known-broken.)

## Splash screen (every fresh page load)

`SplashScreen` (`src/components/SplashScreen.jsx`) renders as a full overlay on mount for ~3.75s (`idle → draw → fill → float → out`, dismissed via `setTimeout(onDone, 3750)`) — `showSplash` is `App`-level state, so it's tied to a full mount, not to which page branch renders. Confirmed: it fires on **every** `page.goto()` (each one remounts `App`), but does **not** reappear on in-app clicks/nav within the same loaded session. Playwright's actionability auto-wait on `fill()`/`click()` handles it transparently, but a `page.screenshot()` right after any `goto()` (before ~3.8s) captures the splash animation instead of the page — add an explicit wait or wait for `.splash-root` to detach before screenshotting. Matters most in multi-page verify scripts that call `goto()` more than once (e.g. checking two routes) — each one needs its own wait, not just the first.

## Theme

Light/dark is `.topbar__theme-toggle` in the Topbar, persisted to `localStorage['pai-theme']`. Set that key before `goto()` (or click the toggle) when a change is theme-dependent.

## Driving the browser

Playwright is **not** a project dependency (not in `package.json`). Install it in the scratchpad, not the repo:

```bash
cd <scratchpad>
npm init -y && npm install playwright
npx playwright install chromium
```

(There's an untracked `src/measure2.js` in the repo root using the same `require('playwright')` pattern — a leftover one-off script, not a project convention to follow.)

## Navigator conversation view

- Home composer: textarea `.hv-composer-ta`, submit via `.nav-send-btn` or Enter (no shift).
- Two separate render paths in `NavigatorPage.jsx` for a sent message — **check both** when touching chat/message markup, they duplicate JSX rather than share it:
  - `exchange.chitChat` early-return block (short greetings/acks — see `isChitChat()` in `navigatorEngine.js`, e.g. "hello", "thanks", "ok").
  - the full tiered exchange block (`cv-msg--user-row` / `cv-msg--ai`, reasoning engine, "View in Canvas" button).
- Trigger the full-tier path with a real query, e.g. `"Show me critical vulnerabilities on internet-facing assets"`.
- Trigger chit-chat with a bare greeting, e.g. `"hello"`.

## Design System — runtime-only checks

`/ux-review` and `/audit-page` already do the *static* DS audit (hardcoded hex, off-scale spacing, border-radius, token drift — all grep-able from source). This list is different on purpose: things `ds/rules.json` and `ds/components/*.json` (in `design-system-2.0/`) require, that only show up by actually driving the app — a grep can't catch a timer or a hover.

- **Toast timing** — trigger the action that fires it and time it: success/info auto-dismiss at **3500ms**, error/warning at **5000ms** (`ds/components/feedback.json`). ⚠️ `.claude/commands/ux-review.md` in *this* repo says the opposite ("error/warning persist, never auto-dismiss; success/info 3s") — that command file is stale against the current canonical spec. Verify against `feedback.json`'s numbers, not the command file's.
- **Destructive confirmation modals** — click the backdrop and press Escape: must NOT close (`ds/components/modals.json` `modal-confirmation`/`modal-non-dismissable`). Confirm button must be `t-danger`, never `t-primary`. Tab through it — focus should stay trapped inside.
- **Form / non-destructive modals** — the opposite: backdrop click and Escape *should* close them. Check both directions when a page has both modal types, they're easy to mix up.
- **Field validation** — type an invalid value and check nothing fires until blur (never per-keystroke); after the error shows, confirm the entered value is still in the field, not cleared.
- **Empty / loading / error states** — trigger each and check the exact emoji, they're not interchangeable: 🚦 table-empty only, 🚧 every error state (section/full-page), 📋 first-use empty. `thead` + pagination must stay visible during table loading and table-empty — never hidden.
- **Skeleton loaders** — confirm only `tbody` swaps (thead stays put), and widths are staggered/varied, not uniform mechanical blocks.
- **Pagination boundaries** — page to the first/last page: prev/next must be a `disabled` button (opacity .3, non-interactive), not removed from the DOM.
- **Tooltips** — hover an icon-only button: the dark tooltip must appear via CSS `:hover` (no JS show/hide class toggling), never contain clickable content, and wrap rather than truncate long text.

## Cross-cutting checks (the kind a UI lead reviews for, not just the diff)

A correctness pass on the changed lines isn't the whole job — these are checks that catch problems *because* they look past the diff, at the surrounding system.

- **Sibling-pattern duplication** — before adding a new UI pattern, grep for a prefix-named sibling that already does the same thing. Concrete case from this session: `cv-msg-avatar` (`NavigatorPage.jsx`, the main conversation view) and `np-msg-avatar` (`NavigatorPanel.jsx`, the docked FAB panel) are two independent CSS implementations of the identical "small circular avatar, user vs AI" pattern. I found and fixed a `box-sizing` bug in `cv-msg-avatar` — confirmed (`navigator.css:677`) `np-msg-avatar` still has the *exact same* unfixed bug, because there's no shared component or class between them; a fix to one never reaches the other. When touching either, check the other for regressions/parity, and flag the duplication itself as tech debt worth consolidating — don't just patch your copy and move on.
- **Responsive breakpoints** — `ux-review.md`'s own checklist calls for 1280px / 1440px / 1920px with no overflow or orphaned elements. Verified: the Navigator conversation view holds up at both 1280 and 1920 (avatar alignment, canvas button position, no horizontal overflow). Default to testing at least the narrow (1280) and wide (1920) ends, not just one viewport — narrow is where flex rows first break, wide is where max-widths first look sparse.
- **Data-scale edge cases for tables/lists** — 0 rows (empty state), 1 row (no pagination needed), 1000+ rows (pagination, scroll perf) all render through different code paths. A change that only gets exercised against the demo's default row count can hide a broken empty-state or an unpaginated 1000-row dump.
- **Keyboard-only pass** — beyond modal focus-trap (already in the DS section above): Tab through the changed screen end-to-end and confirm every interactive element gets a visible focus outline (not just a color change) and a sane tab order. Cheap to do while you're already in the browser: costly to skip since it doesn't show up in a mouse-driven click-through.
- **Persona fit** — if the change is feature-level (not a pixel tweak), cross-check who it's actually for. This repo is mid-way through a 5→15 persona revision (`[[project_persona_revision_2026]]`); `/persona-check` is the dedicated tool for that judgment call — don't try to reinvent it here, just remember to run it for anything bigger than a style fix.

## Gotchas

- No global `box-sizing: border-box` reset in this codebase — it's set per-element where needed. An element with a border but no explicit `box-sizing` renders larger than its declared `width`/`height`. Check this whenever comparing/aligning two same-size elements where only one has a border (e.g. avatar circles).
- `src/components/CopilotFab.jsx` exists but is not imported anywhere (checked: no match outside its own file) — an in-progress component, not yet mounted in the running app. Don't spend time hunting for it live; nothing to verify there yet.
- **Harness reliability, not an app bug**: driving the Navigator composer (`fill()` → `click('.nav-send-btn')`) occasionally fails to transition to the chat view with no console error — happened in ~1 of 4 runs in this session, inconsistently, including on a warm dev server. Read `handleSend`/`setView('chat')` in `NavigatorPage.jsx:1312` — no apparent race in the app code itself. Don't trust a bare `.click()`; assert on `.cv-user-bubble` (or the view actually changing) appearing afterward, and retry the click once if it doesn't, before concluding anything about the app's behavior.
