# Prevalent AI — Exposure Management UI: User Flows

**Purpose:** A raw, factual record of every flow that exists in the product today, derived from the running app's routing/state logic and a full read of the underlying React source. No gap analysis, no persona mapping, no recommendations — that is a separate pass.

**Methodology note:** This environment has no browser-automation tool available (no Playwright/computer-use), so flows were not driven by clicking through a live browser session. Instead, the local Vite dev server (`localhost:5173`) was confirmed running, and every route, component, and state transition described below was traced directly in source (`src/App.jsx` routing, page components, shared components) — file:line citations are given throughout so each claim can be independently verified against the code. Because nearly all data in this app is static/hardcoded (no backend, no fetch calls found anywhere in `src/pages` or `src/components`), source-level tracing is in most cases a more reliable record of actual behavior than a single click-through would be — but it does mean purely visual details (exact pixel layout, animation feel) are not captured here.

---

## Summary

- **Total modules documented:** 10, plus one cross-cutting "Shared Components" appendix (Filter Panel system, Topbar, LeftNav, SubHeader/Explore-in)
- **Total flows documented:** 57
- **Total `[FLAG]` items found:** 101
- **Modules not implemented / placeholder:**
  - **Studio** — `[PLACEHOLDER — no live interactions]`. Selecting "Studio" from the left-nav mode switcher renders a static "Coming Soon" screen regardless of route.
  - **Connectors** — `[NOT IMPLEMENTED]`. No connector list, connector detail, or configuration screen exists anywhere in the codebase. The closest adjacent screen (`DataConfigPage` / "Configure Screen") is part of the Workspace/Reporting dashboard-builder import flow, not a connector manager, and is documented under Reporting/Export.
  - **Settings / Admin** — `[NOT IMPLEMENTED]`. No settings, access-control, ABAC/scope, or user-management screen exists anywhere in the codebase, and no navigation entry point (menu item, icon, route) leads to one. The Topbar's avatar and notification-bell icons are present but inert (see Shared Components).

---

## Module map (requested module → actual code)

| Requested module | Route(s) | Primary component(s) |
|---|---|---|
| Dashboard | `exposure/overview` | `ExposureOverviewPage.jsx` |
| Navigator AI | `navigator`, right-panel "Navigator" tab | `NavigatorPage.jsx`, `NavigatorPanel.jsx` |
| Knowledge Graph / entity pages | `knowledge-graph` (`kg`) | `PageKG.jsx` |
| Discover | `discover/device`, `discover/cloud`, `discover/identity` | `DiscoverDevicePage.jsx`, `DiscoverCloudPage.jsx`, `DiscoverIdentityPage.jsx` |
| Assess | `report/assessments` | `AssessmentsPage.jsx` |
| Prioritize | `exposure/findings` | `FindingsPage.jsx` |
| Compliance / GRC | `report/compliance`, `report/compliance-matrix`, `report/compliance-findings` | `CompliancePage.jsx`, `ComplianceMatrixPage.jsx`, `ComplianceFindingsPage.jsx` |
| Reporting / Export | `workspace`, `workspace/library`, `workspace/saved`, `workspace/dashboard/*`, `workspace/report/*`, `workspace/report-preview/*`, `workspace/configure-screen` | `WorkspacePage.jsx`, `LibraryPage.jsx`, `SavedPage.jsx`, `DashboardCanvas.jsx`, `ReportPreviewPage.jsx`, `DataConfigPage.jsx` |
| Studio / Connectors | left-nav mode switcher → "Studio" | `App.jsx` `ComingSoon()` — no dedicated component |
| Settings / Admin | — none — | — none exists — |

---

## 1. Dashboard (Exposure Overview)

**Route:** `exposure/overview` (also the app's default landing route `/`). **Component:** `src/pages/ExposureOverviewPage.jsx`.

### Dashboard — Enterprise Score gauge & Exposure Overview section

**Entry point:** `/exposure/overview`, top card.
**Trigger:** Page load.
**Steps:**
1. Page loads directly into a static "Exposure Overview" card (`ExposureOverviewPage.jsx:184-273`) showing three columns: an "Enterprise Score" radial gauge (912/1000, "High Risk" badge, "5% from last month" trend — all hardcoded, `:132-181`), an "Attack Surface" bubble-triangle (Cloud/Device/Identity scores, `:187-191`), and an "Exposure Categories" bubble-triangle (Control Gap/Software Vulnerability/Misconfiguration, `:193-197`).
2. An "Exposure Trend" pill button shows a sparkline + "5% from last month" + an Explore icon (`:221-232`).
3. A "Collapse"/"Expand" toggle (real, local `collapsed` state, `:185,234-237`) hides/shows the whole section.
**States handled:**
- Loading: Not present — all values are hardcoded constants.
- Empty: Not present.
- Error: Not present.
- Success: Static render, always "successful."
**Filters / scope controls:** None on this card.
**Export / output:** Not present.
**Navigation out:** The "Exposure Trend" pill has an Explore icon (`IcExplore`) but no `onClick` handler — `[FLAG]` dead affordance.
**Code location:** `src/pages/ExposureOverviewPage.jsx:132-273`.
**Notes:** All numbers (912/1000 score, bubble scores, trend %) are literal constants; nothing here is computed from any other page's data.

### Dashboard — Exposure Contribution table (search, sort, pagination)

**Entry point:** `/exposure/overview`, lower card "Exposure Contribution by [Asset Type]".
**Trigger:** Page load; typing in the search box; clicking column headers; paginating.
**Steps:**
1. A "Group By" pill button reads "Asset Type" with a chevron, styled like a dropdown (`:317-320`) — but `groupBy` is declared as `const [groupBy] = useState('Asset Type')` with **no setter** (`ExposureOverviewPage.jsx:292`) — `[FLAG]` the button is visually a dropdown trigger but is permanently non-interactive; there is no way to actually change the grouping.
2. A search box (real) filters the static 10-row `TABLE_DATA` array by asset-type name substring (`:296,323-336`).
3. Column headers (Name, Exposure Score, % Change, % of Total Exposure, % of Total Findings, % of Affected Assets) each render a sort-chevron icon via the `TH` helper (`:300-307`) — `[FLAG]` no `onClick`, no sort state, and no sort logic exists anywhere in the file; the chevrons are decorative only.
4. An "Explore More" button (`:337-339`) has no `onClick` handler — `[FLAG]` dead button.
5. `TablePagination` (shared component) paginates the filtered rows, with a working rows-per-page selector (`:379-385`).
**States handled:**
- Loading: Not present.
- Empty: Not present — no "no results" message if search matches zero rows (bare empty `<tbody>`).
- Error: Not present.
- Success: Filtered/paginated rows render.
**Filters / scope controls:** Search box only (functional). "Group By" pill is inert (see Flag above).
**Export / output:** Not present.
**Navigation out:** "Explore More" button is non-functional (see Flag).
**Code location:** `src/pages/ExposureOverviewPage.jsx:289-389`.
**Notes:** This is the entirety of the Dashboard module's own page-local logic. All KPI dashboards used elsewhere in the app share the exact same paginated-table pattern but are implemented as fully separate components.

---

## 2. Navigator AI

**Routes/entry points:** Full page at `/navigator` (`NavigatorPage.jsx`); right-side panel opened from the Topbar "Navigator" pill or the LeftNav mode-switcher "Navigator" option (`NavigatorPanel.jsx`, rendered inside `App.jsx`'s shared `RightPanelShell`); a "floating" overlay mode reachable only via the Knowledge Graph page.

### Navigator AI — Query input (Home view, full page)

**Entry point:** `/navigator`, `HomeView` component.
**Trigger:** Landing on Navigator with no active query, or clicking "New chat."
**Steps:**
1. Heading "Ask me anything" (`NavigatorPage.jsx:271-274`).
2. Five toggleable "context pills" (Hosts 842 / Findings 2140 / Identities 513 / Accounts 78 / CVEs 634, `:11-17,279-289`) add a chip to the textbox via local state — **purely cosmetic**: nothing downstream reads the selected context when sending the query (`:261-264`). `[FLAG]`
3. A textarea (Enter submits, Shift+Enter newlines, `:310-320`); a "Deep research" pill next to Send has no `onClick` at all. `[FLAG]`
4. Send button disabled when empty (`:331`); calls `handleSend()` → `onSend(text)` → view becomes `'chat'`.
5. A "Try asking" list of 6 sample queries (`SAMPLE_QUERIES`, `:19-26`) — clicking one **immediately submits** it (no populate-then-edit step).
**States handled:**
- Loading: Not present on this screen.
- Empty: Send disabled; Enter-on-empty is a silent no-op (`handleSend` guards `if (!text) return`).
- Error: Not present.
- Success: Transitions straight to `ChatView`.
**Filters / scope controls:** Context pills are cosmetic only (see Flag).
**Export / output:** Not present.
**Navigation out:** None from this screen.
**Code location:** `src/pages/NavigatorPage.jsx:250-359`.

### Navigator AI — Query input (Panel Home view, sidebar/floating)

**Entry point:** `NavigatorPanel`, opened via Topbar pill or KG floating trigger.
**Trigger:** Panel opened with no active query.
**Steps:**
1. First-ever open shows `FirstRunHero` with only 2 of the 4 defined `FIRSTRUN_SUGGESTIONS` (`.slice(0,2)`, `NavigatorPanel.jsx:553`) — `[FLAG]` items 3–4 are unreachable dead data.
2. Returning-user view: two quick-fire buttons ("Summarize", "Analyze"), a 2×2 `QUICK_ACTIONS` grid, and a static "Recent" list (`CHAT_HISTORY`) — all click-to-send-immediately, same pattern as the full page.
3. `Composer`: auto-growing textarea, a "+ Add context" button with `tabIndex={-1}` and no `onClick` (`:494`) — `[FLAG]` dead/unfocusable, and a `ModeSelector` (Quick/Deep/Report chips) whose selected `mode` is never read anywhere downstream (`[FLAG]` cosmetic; "Report" mode is labeled "Formatted export-ready summary" but produces no different output).
**States handled:** Same empty/disabled-send pattern as the full page; no loading state until a query is actually sent.
**Filters / scope controls:** `ModeSelector` is cosmetic (see Flag).
**Export / output:** Not present at this stage.
**Navigation out:** None from Home.
**Code location:** `src/components/NavigatorPanel.jsx:568-667` (Home), `537-565` (FirstRunHero), `467-511` (Composer).

### Navigator AI — Response rendering (full-page ChatView)

**Entry point:** `/navigator`, after sending a query from HomeView.
**Trigger:** `handleSend` sets `view='chat'`.
**Steps:**
1. Split layout: chat panel (left) + "Results" canvas panel (right), with a draggable divider that has no drag handler wired (`:449-453`) — `[FLAG]` decorative only.
2. AI bubble shows 3 already-completed "reasoning steps" (`DEMO_STEPS`) and a fixed answer paragraph about host `vm-prod-42` and Log4Shell — **hardcoded regardless of the actual query submitted**. `[FLAG]` Every sample query, typed question, or historical re-send produces the identical canned answer; there is no query-dependent branching anywhere in the file.
3. Right canvas shows a 3-up KPI row, a static findings table, and a "Sources" citation list — all static.
4. A follow-up textarea at the bottom: pressing Enter only clears the field (`setFollowUp('')`, `:433`) — `[FLAG]` a typed follow-up is silently discarded, never answered.
**States handled:**
- Loading: Not present — response renders synchronously and instantly.
- Empty: N/A (query required to reach this view).
- Error: Not present — no error path exists in this view at all.
- Success: Static demo answer, always.
**Filters / scope controls:** Not present.
**Export / output:** None — no download/share button anywhere on the canvas panel.
**Navigation out:** None — no drill-down links from the findings table or citations to KG/Discover/Findings pages.
**Code location:** `src/pages/NavigatorPage.jsx:362-526`.

### Navigator AI — Response rendering (Panel ChatView — sidebar/floating/embedded)

**Entry point:** `NavigatorPanel`, after sending a query from PanelHome.
**Trigger:** `handleSend` sets `responseState='thinking'`, then a hardcoded 3200ms `setTimeout` flips it to `'done'` — a simulated delay, not a real request.
**Steps:**
1. `ThinkingCard`: "Navigator is analyzing…" with a pulsing dot and 3 steps revealed at staggered 900ms intervals (`aria-live="polite"`) — the only real loading indicator anywhere in the Navigator feature.
2. `ResponseCard`: completed steps, KPI row, findings list, a disclaimer line, Copy/Sources/thumbs-up-down actions, an expandable sources list, and an "Explore in detail" button.
3. "Copy" copies a hardcoded `RESPONSE_TEXT` string to the clipboard and shows a 5-second toast — the one genuinely working export-adjacent action in the whole feature.
4. Thumbs up/down only toggle local component state with no persistence or API call (`[FLAG]` cosmetic feedback); thumbs-down reveals a note textarea whose "Submit feedback" button only closes the box, never sending the note anywhere (`[FLAG]`).
5. Follow-up composer here also discards input instead of sending it (`PanelChat.jsx` `onSend={() => setFollowUp('')}`) — `[FLAG]` same bug as the full page.
**States handled:**
- Loading: `ThinkingCard` (see above) — the one working loading state in Navigator.
- Empty: Send disabled when empty; same silent no-op pattern.
- Error: `ErrorCard` exists (title, subtitle, Retry button) but **no code path ever sets `responseState` to `'error'`** — confirmed no such call exists anywhere in the file. `[FLAG]` fully-built but permanently unreachable error state.
- Success: `ResponseCard` as described.
**Filters / scope controls:** Not present.
**Export / output:** "Copy" (functional, clipboard only). No PDF/CSV/report export exists despite "Report" mode and "Generate risk report" implying one.
**Navigation out:** "Explore in detail" → closes the panel, navigates to `/navigator` full page with the query pre-filled as the chat title (content is still the same static demo answer, not a true continuation).
**Code location:** `src/components/NavigatorPanel.jsx:211-399` (Thinking/Response/Error cards), `716-758` (PanelChat), `846-855` (Explore/Copy handlers).

### Navigator AI — Failure states (empty query / no results / rate limiting)

**Entry point:** All query-entry surfaces.
**Trigger:** N/A — cross-cutting.
**Steps:** Empty submissions are blocked by disabled Send buttons or silently swallowed by a guard clause; no "no results" state can occur because every query produces the identical static answer; the built `ErrorCard` is unreachable; there is no rate limiting anywhere.
**States handled:**
- Loading: Panel only (`ThinkingCard`); full page has none.
- Empty: Silently blocked/ignored, no user-visible feedback either way.
- Error: UI exists, dead.
- Success: Always succeeds.
**Filters / scope controls:** N/A.
**Export / output:** N/A.
**Navigation out:** N/A.
**Code location:** `src/pages/NavigatorPage.jsx:261-265,331`; `src/components/NavigatorPanel.jsx:580-584,501,381-399`.
**Notes:** `[FLAG]` No empty-state, no-results-state, or rate-limit messaging exists anywhere in Navigator — every non-empty submission deterministically returns the same canned answer.

### Navigator AI — Suggested/starter prompts

**Entry point:** HomeView / PanelHome (first-run and returning-user variants).
**Trigger:** Panel/page opened with no active query.
**Steps:** All suggested-prompt surfaces (`SAMPLE_QUERIES`, `FIRSTRUN_SUGGESTIONS`, `QUICK_ACTIONS`, "Recent" list, `ChatQuickBar`'s "Quick actions" dropdown) are **click-to-send, not click-to-populate** — the user can never review/edit a suggestion before it fires.
**States handled:** N/A.
**Filters / scope controls:** None — clicking injects the exact string as the message, no scoping.
**Export / output:** N/A.
**Navigation out:** N/A (stays within Navigator).
**Code location:** `src/pages/NavigatorPage.jsx:19-26,346-356`; `src/components/NavigatorPanel.jsx:25-30,537-542,632-651,670-713`.

### Navigator AI — View modes: sidebar vs. floating vs. full screen

**Entry point:** View-mode dropdown in either surface's header.
**Trigger:** Clicking the view-mode icon → dropdown (Sidebar / Floating / Full screen).
**Steps:**
1. **Sidebar** (default): docked 400px-wide panel inside `RightPanelShell`, resizable 300–700px via a drag handle.
2. **Floating**: `position:fixed`, draggable by its header, rendered on top of the current page (in practice only reachable landing on the KG page — see next flow).
3. **Full screen** from the *panel's* dropdown does **not** navigate to the real `/navigator` page — it just re-docks as sidebar (`[FLAG]` mislabeled: functionally identical to picking "Sidebar"). **Full screen** from the *page's own* dropdown is an explicit no-op per a code comment (`NavigatorPage.jsx:136`, `[FLAG]`) since the page already is the full-screen experience.
4. Choosing "Floating" from the full page's own dropdown always relocates the user to `/knowledge-graph` with Navigator floating over it.
**States handled:** Identical chat states in every mode — modes only change container chrome/position, never response content.
**Filters / scope controls:** None differ by mode.
**Export / output:** None differ by mode.
**Navigation out:** Mode switches double as navigation (Floating → KG page always).
**Code location:** `src/components/NavigatorPanel.jsx:761-869,905-940`; `src/pages/NavigatorPage.jsx:61-65,129-137`; `src/App.jsx:279-344,566-593`.

### Navigator AI — Explore/drill-down out of a response

**Entry point:** `ResponseCard`'s "Explore in detail" button (panel only).
**Trigger:** Click.
**Steps:** Closes the panel, sets `navigatorQuery` in `App.jsx` to the just-asked query, navigates to `/navigator`, which mounts directly into `ChatView` with that query as the title (skipping HomeView).
**States handled:** N/A — a page transition, not a data load.
**Filters / scope controls:** N/A.
**Export / output:** N/A.
**Navigation out:** This flow IS the navigation-out action.
**Code location:** `src/components/NavigatorPanel.jsx:846-849`; `src/App.jsx:572-577,623`; `src/components/LeftNav.jsx:111-112`.
**Notes:** `[FLAG]` This is the **only** outbound drill-down action anywhere in Navigator — no individual response element (finding row, KPI card, citation, severity badge) is clickable or links to Findings/KG/Discover, despite the response naming a specific host and specific CVEs.

### Navigator AI — Conversation/session state and "New chat"

**Entry point:** New-chat icon (both surfaces), the `HistoryOverlay`'s "New chat" button, and the ⌘K/Ctrl+K shortcut.
**Trigger:** Any of the above, or simply closing and reopening the panel.
**Steps:** `NavigatorPanel` is conditionally *mounted* (not just hidden) inside `RightPanelShell` — closing it destroys all React state; reopening always starts fresh at the Home view. `[FLAG]` **There is no persisted conversation** — recent-chat/history lists (`RECENT_CHATS`, `CHAT_HISTORY`, `AGENTS`) are static hardcoded arrays that never grow or change no matter what the user asks.
**States handled:** New chat always resets to Home; also resets any (unreachable) error state.
**Filters / scope controls:** N/A.
**Export / output:** N/A.
**Navigation out:** N/A.
**Code location:** `src/pages/NavigatorPage.jsx:539-542`; `src/components/NavigatorPanel.jsx:840-844,807-817,145-208,768-786`; `src/App.jsx:330-339`.
**Notes:** `[FLAG]` `HistoryOverlay`'s Agent rows and both "View all…" buttons have no click handler at all. `[FLAG]` "Rename"/"Delete"/"Send feedback"/"Help & capabilities" in the more-options dropdown all just close the dropdown — none has any effect, and "Delete" (a destructive-sounding action) has no confirmation modal because it has no function to confirm.

### Navigator AI — Splash screen on panel open

**Entry point:** `NavigatorPanel`, every open.
**Trigger:** Panel opened.
**Steps:** A full `SplashScreen` sub-component (rings, logo, animated dots) is fully built, and its timers still run on every open — but its render is gated by a literal `{false && splash && <SplashScreen />}` (`NavigatorPanel.jsx:961`), so it **never renders**. The input-focus effect still waits the full 2200ms as if the splash were showing.
**States handled:** N/A.
**Filters / scope controls:** N/A.
**Export / output:** N/A.
**Navigation out:** N/A.
**Code location:** `src/components/NavigatorPanel.jsx:513-534,789-796,961`.
**Notes:** `[FLAG]` Permanently disabled via a hardcoded `false &&` short-circuit — wasted timers with no visible effect.

---

## 3. Knowledge Graph / Entity Pages

**Route:** `knowledge-graph` (`kg`). **Component:** `src/pages/PageKG.jsx`.

### Knowledge Graph — Initial load / default view

**Entry point:** `/knowledge-graph`.
**Trigger:** Navigating via LeftNav, direct URL load, or the Navigator "floating" action.
**Steps:**
1. All 17 entity types render as SVG circle nodes (count badge, icon, label) positioned around an ellipse, with edges drawn as lines (optional relationship-label pills) plus "petal" stubs for self-referential relationships (e.g. `cluster→cluster`).
2. A continuous floating/bobbing animation runs via `requestAnimationFrame`, driven by dev-only tweak sliders (amplitude/speed/variation).
3. Canvas supports pan (drag empty background), zoom (two rail buttons), node drag (repositions permanently in local state), and a Reset button restoring default layout/zoom/search/selection.
4. Below the canvas, a "Details" table renders a static 28-row sample dataset, paginated.
**States handled:**
- Loading: Not present — all data is hardcoded, no fetch exists anywhere in the file.
- Empty: "No entities in this view" overlay if the current view-mode filter yields zero entities (in practice unreachable — every view-mode option maps to a non-empty list).
- Error: Not present inside PageKG itself (only the app-wide generic `ErrorBoundary` wraps it).
- Success: Graph + Details table render as described.
**Filters / scope controls:** "Attack Surface" view tabs (None/Device/Cloud/Identity) restrict which entity types draw.
**Export / output:** A "Download" button exists in the Details table toolbar but has **no `onClick` handler** — `[FLAG]` dead. An "Add Column" button beside it is likewise dead — `[FLAG]`.
**Navigation out:** LeftNav to any other page; clicking a table row opens the entity detail slide-over (does not navigate away).
**Code location:** `src/pages/PageKG.jsx:1-82,355-809,1715-2387`.
**Notes:** Because all data is static, dataset-size/large-graph performance scenarios are only cosmetic (e.g., `finding` count hardcoded at 15,518,350) — never a real rendering-load condition.

### Knowledge Graph — Search (node search)

**Entry point:** `DSPillSearch` input in the Relationships toolbar ("Search Nodes").
**Trigger:** Typing.
**Steps:** Matches against the 16 entity-type **labels** only (not individual instance records — there are only ever 16 possible graph nodes). Non-matching nodes/edges dim to 60% opacity; there is no autocomplete dropdown, results appear directly on canvas.
**States handled:**
- Loading: Not present (synchronous, 16 hardcoded labels).
- Empty: "No nodes match" overlay when the search matches nothing.
- Error: Not present.
- Success: Matching bubbles stay full-opacity.
**Filters / scope controls:** Search only operates over the entity types currently visible under the active Attack Surface tab.
**Export / output:** Not present.
**Navigation out:** None — dimming only, no navigation.
**Code location:** `src/pages/PageKG.jsx:934-966,468-488,2003`.
**Notes:** A second, separate "Search Any" box inside the Details table header full-text-searches the table rows (label/type/ip/dates/OS/sources) — distinct from graph-node search, no effect on the canvas.

### Knowledge Graph — Entity detail view (table row → slide-over panel)

**Entry point:** Clicking any Details-table row.
**Trigger:** Row click.
**Steps:**
1. Slide-over panel: entity icon, label, type chip, metadata row (IP/OS/Last Active).
2. A small "Entity Relationship Summary" mini-diagram **always** shows a generic "Has → Finding" relationship regardless of the entity's actual real relationships (`[FLAG]`).
3. Three tabs: `summary` (General Information grid + hardcoded severity-breakdown bars, the only substantive tab), `evolution` and `derivation` (both pure static placeholder copy with no data or controls — `[FLAG]`).
4. Closing via × or backdrop click; the underlying row data is not cleared, so briefly-reopening shows stale content until a new row is clicked.
**States handled:**
- Loading: Not present.
- Empty: An unset panel shows only backdrop/close controls.
- Error: Not present.
- Success: As described.
**Filters / scope controls:** None inside the panel.
**Export / output:** None.
**Navigation out:** Closing returns to KG in its prior state; no deep-linking (URL doesn't change when the panel opens).
**Code location:** `src/pages/PageKG.jsx:2222-2387`.

### Knowledge Graph — Node selection & relationship chip filtering (graph → table sync)

**Entry point:** Clicking an entity-type bubble.
**Trigger:** Click (toggle select/deselect).
**Steps:**
1. Selecting a node computes one "relationship chip" per edge connecting it to a currently-visible neighbor, each showing `Source — Relation — Target`, removable and (where a hidden reverse edge exists) reversible via a ⇄ button.
2. The Details table filters to the selected entity type; header count updates to that type's total.
3. Selection gives the node a soft halo but does **not** dim other nodes/edges (search is the only thing that dims).
4. A "Multi-select" toggle switches to a `Set`-based multi-selection mode; the table then filters to the union of all selected types.
**States handled:**
- Loading: Not present.
- Empty: "{Entity} has no relationships in this view" / "Click nodes to filter the details table" hints.
- Error: Not present.
- Success: Chip bar + filtered table.
**Filters / scope controls:** Chips only include neighbors visible under the active Attack Surface tab; if the selected node itself becomes hidden after switching tabs, its chip greys out and the table returns 0 rows.
**Export / output:** Not present.
**Navigation out:** None — purely in-page state.
**Code location:** `src/pages/PageKG.jsx:1809-1902,2149-2217,2535-2613`.

### Knowledge Graph — Relationship traversal (edge click / one-hop)

**Entry point:** Clicking an edge line, its relationship-label pill, or a self-loop petal.
**Trigger:** Click.
**Steps:**
1. Selects one endpoint as the "primary" node (preferring the non-`finding` endpoint) and marks the specific edge selected, restricting the chip bar to just that one relationship.
2. Both endpoints' count badges switch to an edge-specific "participating entities" count from a hardcoded lookup map, rather than the type's global total.
3. There is **no** "expand outward"/multi-hop traversal control — every pivot is exactly one hop from whichever node is `selected`; re-clicking the same edge deselects it.
**States handled:** Same as node selection above.
**Filters / scope controls:** Edge visibility is gated by a `hidden` flag — many edges are one-directional aliases of a shown edge, deliberately hidden so only one direction renders per pair.
**Export / output:** Not present.
**Navigation out:** None.
**Code location:** `src/pages/PageKG.jsx:291-353,636-717,2101-2126,141-174`.
**Notes:** `[FLAG]` The "Relationship Count" shown in every edge's hover tooltip is a hardcoded literal `'2'` regardless of which edge is hovered — dead/placeholder data.

### Knowledge Graph — Graph Filter tab (shared FilterPanel component)

**Entry point:** Filter tab in the shared right-panel shell (same component used app-wide).
**Trigger:** Opening "Filter" while on the KG page.
**Steps:** The KG page has a dedicated Quick-Filter attribute set (19 attributes) and a dedicated 17-entity tree in the Active Filter preview — but **`PageKG` itself takes zero props and never reads `activeFilters`/`filtersByPage`/`FilterPanel` in any form.** Confirmed via full-file review: no reference to any of those names exists in `PageKG.jsx`.
**States handled:** N/A — no consumption exists to have states.
**Filters / scope controls:** None reach the canvas.
**Export / output:** Not present.
**Navigation out:** Not present.
**Code location:** `src/pages/PageKG.jsx` (no reference); `src/App.jsx:709-803`; `src/components/FilterPanel.jsx:21-41`; `src/components/ActiveFilterPanel.jsx:53-75`.
**Notes:** `[FLAG]` The shared "Filter" tab is fully visible and interactive on the KG page but has **zero effect** on the canvas, Details table, or entity KPI grid — a user applying filters there sees no change anywhere. Full mechanics of the shared FilterPanel are documented once in the Shared Components appendix.

### Knowledge Graph — Data Sources tab (Sankey diagram) — the one *working* filter on this page

**Entry point:** "Data Sources" segmented tab in the Summary card header.
**Trigger:** Click.
**Steps:** A three-column Sankey diagram (Origin → Contribution → Entities) built from hardcoded arrays. Each column header has a filter-funnel icon opening a checkbox popup (Select All / Select Inverse / per-item, plus AND/OR/EXACT for Origin) that **genuinely** filters which sources/contribution-types/entities render (confirmed via `useMemo` derivations feeding the actual chart). Hovering/clicking a node or ribbon highlights the full source→contribution→entity path and can be "pinned" by clicking.
**States handled:**
- Loading/Error: Not present (static data).
- Empty: Not explicitly handled — an all-filtered-out selection renders an empty column with no dedicated empty-state message.
- Success: As described.
**Filters / scope controls:** The three column filter-popups — local to this tab only, no effect on the graph canvas or Details table.
**Export / output:** Not present.
**Navigation out:** Switching back to Relationships/Entities tabs.
**Code location:** `src/pages/PageKG.jsx:1072-1670`.
**Notes:** `[FLAG]` An "Assets / All Entities" segmented toggle above the diagram updates its own state but has zero downstream effect on the layout computation — dead control sitting right next to genuinely-working filters.

### Knowledge Graph — Legend / entity-type reference

**Entry point:** "Entities" summary tab.
**Trigger:** Click.
**Steps:** `EntityKpiGrid` lists all 16 non-finding entity types with icon, label, resolved count/percentage, and fragment count — functions as the closest thing to a legend (there is no dedicated on-canvas color-key panel and no minimap anywhere in the file).
**States handled:** Static reference content, no states.
**Filters / scope controls:** Always shows all types regardless of the active Attack Surface tab.
**Export / output:** Not present.
**Navigation out:** Not present.
**Code location:** `src/pages/PageKG.jsx:23-41,1672-1710,199-210`.
**Notes:** `[FLAG]` Each `ENTITY_TYPES` entry carries a `group` field (identity/cloud/host) that is defined but never read anywhere in the file — dead data.

### Knowledge Graph — Navigator "floating" mode tie-in

**Entry point:** Choosing "Floating" as a view mode from the standalone Navigator page.
**Trigger:** Selecting that option.
**Steps:** `App.jsx` intercepts the `'navigator-floating'` action specially: it force-navigates the whole app to `/knowledge-graph` (regardless of where the user was) and opens the Navigator tab, collapsed to float over the canvas instead of docking.
**States handled:** N/A — navigation/layout mechanism only.
**Filters / scope controls:** Not present.
**Export / output:** Not present.
**Navigation out:** Switching Navigator's view mode again, or navigating away via LeftNav.
**Code location:** `src/App.jsx:279-297,579-585`; `src/components/NavigatorPanel.jsx:763,864,900-907`.
**Notes:** The KG page is used as a mandatory landing surface for the floating Navigator experience, even though the floating view mode itself is generic and not KG-specific in its own implementation.

### Knowledge Graph — Dev-only Tweaks panel (float animation & Edge Editor)

**Entry point:** Not reachable from any in-app UI. A `TweaksPanel` is composed into the tree only when `isKG && appMode !== 'studio'`, but it only becomes visible in response to a `window.postMessage` of type `__activate_edit_mode` sent by an external host frame — nothing inside the deployed SPA itself sends that message.
**Trigger:** External host activation only (e.g. a design/prototyping tool embedding this app in an iframe).
**Steps:** Sliders for float-animation amplitude/speed/variation; an Edge Editor letting a (privileged/dev) user add/edit/remove graph edges live, with "Save as default" (persists only by asking an external host to rewrite the source file on disk — no localStorage, no backend call) and "Reset" (restores the last-saved snapshot, not the original hardcoded edges).
**States handled:**
- Loading: Brief unstyled empty list until the first sync.
- Empty: "No edges. Add one below."
- Error: Not present — all globals accessed via optional chaining, so a missing host silently no-ops.
- Success: Live-editable table, changes apply to the graph immediately (in-session only).
**Filters / scope controls:** Not present.
**Export / output:** "Save as default" is the closest thing to persistence, and it only works with an external host attached (see above).
**Navigation out:** Not present — floats over the page.
**Code location:** `src/components/tweaks-panel.jsx`; `src/App.jsx:25-84,113-259,500,515-520,809-831`; `src/pages/PageKG.jsx:1744-1761`.
**Notes:** This is a confirmed internal/dev-facing flow, not reachable by an end user in a normal browser tab. `[FLAG]` The code is fully present in the shipped bundle with no build-time strip — it is inert only because nothing in the deployed app sends the activation message.

---

## 4. Discover

**Routes:** `discover/device`, `discover/cloud`, `discover/identity`. **Components:** `DiscoverDevicePage.jsx`, `DiscoverCloudPage.jsx`, `DiscoverIdentityPage.jsx`. All three are invoked with **zero props** from `App.jsx` and are 100% static-mock-data pages — no fetch, no async state anywhere across any of the three files.

### Discover — Total entity KPI + trend chart (all three pages)

**Entry point:** Top-left card on each Discover page.
**Trigger:** Page load; time-range pill click (`1W/1M/3M/6M/1Y`); "Trend Explore" button.
**Steps:** A big stat value + "Newly added" badge + trend delta are all hardcoded strings (`[FLAG]` disconnected from the time-range pills — switching ranges only redraws the area-chart curve beneath them, never the headline number or its delta). Hovering the area chart shows a custom week-over-week tooltip. Default time range is `1 Y` on Device/Cloud, `1 M` on Identity (minor divergence, no functional impact).
**States handled:** No loading/empty/error anywhere — always-on static render.
**Filters / scope controls:** Time-range pills, scoped to this widget only.
**Export / output:** Not present.
**Navigation out:** See "Trend Explore" drawer and "Edit" shortcut flows below.
**Code location:** `DiscoverDevicePage.jsx:444-520`; `DiscoverCloudPage.jsx:387-456`; `DiscoverIdentityPage.jsx:399-468`.

### Discover — Data Source breakdown chart (all three pages)

**Entry point:** Left column, bottom-left card.
**Trigger:** Mouse hover over a stacked-bar segment.
**Steps:** A horizontal stacked bar per data source (Corroborated vs. Unique counts) with a custom hover tooltip.
**States handled:** No loading/empty/error — static.
**Filters / scope controls:** None — hover-only.
**Export / output:** Not present.
**Navigation out:** Not present.
**Code location:** `DiscoverDevicePage.jsx:526-586`; `DiscoverCloudPage.jsx:461-513`; `DiscoverIdentityPage.jsx:473-523`.
**Notes:** `[FLAG]` No `onClick` on any bar segment anywhere — despite looking like a breakdown that should drill into the asset table, it cannot be clicked to filter anything. Device page additionally wraps this widget in a hover-controls overlay that only activates in a `dashboardMode` the live routing never actually passes — permanently dead markup on that one page.

### Discover — Type/category donut chart (all three pages)

**Entry point:** Left column, bottom-right card.
**Trigger:** Hover.
**Steps:** A donut of asset/identity types with a center total. Device's donut plots only 6 of 7 types (Storage Accounts excluded from the visual but present in the text list below it — same pattern on Cloud, excluding Serverless). Identity has only 2 types so nothing is cut. Device's center label shows a **type count** ("6") while Cloud/Identity show **entity totals** — `[FLAG]` inconsistent semantics across three otherwise-identical widgets.
**States handled:** No loading/empty/error — static.
**Filters / scope controls:** None — hover-only, no click-to-filter (same as Data Source chart).
**Export / output:** Not present.
**Navigation out:** Not present.
**Code location:** `DiscoverDevicePage.jsx:589-644`; `DiscoverCloudPage.jsx:516-561`; `DiscoverIdentityPage.jsx:526-571`.

### Discover — Key Security Insights table (all three pages)

**Entry point:** Right column, top card.
**Trigger:** Page load; search typing; pagination.
**Steps:** A findings-style table (severity icon, Assessment, Findings Failed progress bar, Exposure Category). Every column header shows a sort-chevron icon via a shared `TH` helper — `[FLAG]` no sort state or logic exists anywhere in any of the three files; purely decorative. A `DSPillSearch` filters client-side by substring.
**States handled:**
- Loading: Not present.
- Empty: If search matches zero rows, the table body renders empty with **no "no results" message** — `[FLAG]`.
- Error: Not present.
- Success: Static table.
**Filters / scope controls:** Page-local search only; separate from the shared FilterPanel opened by the SubHeader Filter button.
**Export / output:** Not present.
**Navigation out:** No row-click handler anywhere — rows are inert.
**Code location:** `DiscoverDevicePage.jsx:662-718`; `DiscoverCloudPage.jsx:569-617`; `DiscoverIdentityPage.jsx:579-629`.
**Notes:** `[FLAG]` Identity's rows-per-page control is hardcoded to `5` and disconnected from the (functional-looking) 10/25/50/100 buttons — likely a copy-paste leftover from Device/Cloud, where the same control is genuinely wired.

### Discover — Assets by Criticality Score table (all three pages)

**Entry point:** Right column, "Criticality Insights" card, nested table.
**Trigger:** Page load; search; pagination.
**Steps:** Device shows 6 columns (incl. Deployment Type, OS Family); Cloud/Identity show only 4 (no Deployment Type/OS Family concept in their mock data). All 5 mock rows per page are near-duplicates (same criticality, near-identical scores). The Criticality chip renders a literal CSS class `pai-chip--crit` that **does not match any defined modifier class** in the stylesheet (only `--critical/--high/--medium/--low` exist) — `[FLAG]` the chip never gets severity-colored styling regardless of value. Pagination's `onRowsPerPageChange` is an explicit no-op (`() => {}`) on all three pages — `[FLAG]`. Identity additionally passes a hardcoded `total={87073}` to its pager, completely disconnected from the actual 5-row mock array being paginated — `[FLAG]` the most visible data/pagination-metadata mismatch across the whole module.
**States handled:** No loading/empty/error — static.
**Filters / scope controls:** Page-local search only.
**Export / output:** Not present.
**Navigation out:** No row-click handler.
**Code location:** `DiscoverDevicePage.jsx:759-812`; `DiscoverCloudPage.jsx:619-692`; `DiscoverIdentityPage.jsx:631-704`.

### Discover — Criticality stacked-bar + legend (all three pages)

**Entry point:** Right column, "Criticality Insights" card, top section.
**Trigger:** Hover.
**Steps:** A 4-segment (Critical/High/Medium/Low) horizontal stacked bar with hover tooltip and a static legend. Identity's distribution is a notable outlier (Medium dominates at 96.63%).
**States handled:** No loading/empty/error — hover-interactive only.
**Filters / scope controls:** None — hover-only, no click-to-filter into the Assets table directly below it despite being visually/thematically adjacent.
**Export / output:** Not present.
**Navigation out:** Not present.
**Code location:** `DiscoverDevicePage.jsx:720-757,1003-1021`; `DiscoverCloudPage.jsx:619-650,891-913`; `DiscoverIdentityPage.jsx:631-662,894-913`.

### Discover — Trend Explore drawer (all three pages)

**Entry point:** "Trend Explore" button beside the top-left KPI card's time-range pills.
**Trigger:** Click to open; overlay/× to close.
**Steps:** A slide-in drawer with its own time-range pills, a breakdown dropdown (options differ per page — Device/Cloud share Origin/Deployment Type/Environment/Asset Criticality/[OS Family on Device only]; Identity has its own Authentication Type/MFA Status/Risk Level set), and a "Baseline View" toggle that rebases the chart to % change from the first point in range.
**States handled:** No loading/empty/error — static/interactive on mock data only.
**Filters / scope controls:** `drawerRange`, `drawerFilter`, `baselineView`, legend click-to-isolate (Type mode only) — all local to the drawer.
**Export / output:** Not present.
**Navigation out:** Drawer only closes back to the same page.
**Code location:** `DiscoverDevicePage.jsx:817-1002`; `DiscoverCloudPage.jsx:697-889`; `DiscoverIdentityPage.jsx:709-893`.
**Notes:** `[FLAG]` This is the single most significant "looks interactive but isn't" pattern in the Discover module: selecting "Type" from the dropdown genuinely switches to a per-type multi-line chart, but **every other option** ("Origin," "Deployment Type," "Environment," "Asset Criticality," "OS Family," "Authentication Type," "MFA Status," "Risk Level") renders the exact same generic Total chart as "All" — there is no dataset behind any of them besides the Type breakdown. 5–6 of each page's 6–7 dropdown choices are functionally dead.

### Discover — "Edit" → Discover Dashboard shortcut (all three pages)

**Entry point:** SubHeader "more" dropdown menu, "Edit" item — visible only on these three pages (`DISCOVER_PAGES` set in `App.jsx`).
**Trigger:** Click "Edit."
**Steps:** Navigates to `workspace/dashboard/discover`, which renders the Workspace `DashboardCanvas` builder pre-loaded with a `'discover'` template (documented under Reporting/Export).
**States handled:** N/A — navigation only.
**Filters / scope controls:** N/A.
**Export / output:** Not present.
**Navigation out:** Confirmed real cross-module navigation into the Workspace/Reporting builder.
**Code location:** `src/App.jsx:346-347,784-794`; `src/components/SubHeader.jsx:86-100`.
**Notes:** A leftover `_UNUSED` mock widget-config object in `App.jsx` (keyed by the three Discover route ids) appears to be a stale intended data shape for this builder — it is not referenced anywhere and is dead code, noted here only for completeness.

### Discover — Cross-page filter carry-over ("Explore in")

**Entry point:** Any page's SubHeader "Explore in" menu, destination a Discover page.
**Trigger:** Selecting a Discover page as the destination.
**Steps:** The source page's filter chip state is copied verbatim into the destination page's filter bucket, then navigation occurs.
**States handled:** N/A.
**Filters / scope controls:** Filters carried via the shared `filtersByPage` object.
**Export / output:** Not present.
**Navigation out:** This is the navigation mechanism itself.
**Code location:** `src/App.jsx:604-608,566-593`.
**Notes:** `[FLAG]` Since none of the three Discover page components read any filter-related props at all (confirmed — all three are invoked prop-less), the "carried" filters only ever populate the shared chip-display UI; none of the Discover pages' own charts/tables react to it. Full mechanics documented once in the Shared Components appendix.

### Structural comparison — Device vs. Cloud vs. Identity

All three pages share an identical grid layout, chart types, tooltip logic, search/pagination wiring, decorative sort chevrons, and the total absence of loading/empty/error states, exports, or row-click behavior. They diverge in: type counts tracked (7/7/2), asset-table column count (6/4/4), insights row count (10/10/29), insight categories (Identity uniquely has "Behavioural Indicators"), Trend Explore dropdown options (identity-specific attributes vs. device/cloud-specific), and the specific pagination/wiring bugs noted above (Identity's hardcoded `rowsPerPage`/`total`).

---

## 5. Assess (Assessments)

**Route:** `report/assessments`. **Component:** `src/pages/AssessmentsPage.jsx`. Takes zero props.

### Assess — Assessment list (search, sort, pagination)

**Entry point:** `/report/assessments`.
**Trigger:** Page load; search typing; column-header click; pagination.
**Steps:**
1. A static 25-row `ASSESSMENTS` array (each with entity type, name, closed/open finding counts, a computed pass %, a Weak/Moderate/Strong rating, and a list of related-framework keys).
2. A real search box filters by name or entity label (`useMemo`-based).
3. Column headers for Name / Rating / Score / Entity are genuinely sortable (ascending/descending toggle) via real `sortCol`/`sortDir` state — this table's sort **does work**, unlike the many decorative sort-chevrons documented elsewhere in the app.
4. A "Related Frameworks" cell shows up to 3 framework badges plus a "+N" overflow button opening a popover listing all associated frameworks and their specific control text.
5. `TablePagination` (working) at the bottom.
**States handled:**
- Loading: Not present — static array.
- Empty: Not present — no "no results" message if search excludes all rows.
- Error: Not present.
- Success: Sorted/filtered/paginated rows render.
**Filters / scope controls:** Search box (functional); sort (functional, genuinely rare in this app); no relation to the shared FilterPanel.
**Export / output:** Not present at the list level.
**Navigation out:** Clicking a row's name opens the `AssessmentDrawer` (same component reused from `CompliancePage.jsx` — see Compliance/GRC below).
**Code location:** `src/pages/AssessmentsPage.jsx:125-266`.

### Assess — Create Ticket action (per-row)

**Entry point:** A wrench/ticket icon button per row, "Create Ticket."
**Trigger:** Click.
**Steps:** Opens a modal pre-filled with a synthetic ticket code, title, and an auto-generated description referencing the row's open-finding count and rating. Fields: Title (editable), Assignee (`SelectDropdown`, 3 static options), Description (editable textarea), a static warning about only the top 3,000 findings being included, and a "Ticket History" box listing 3 hardcoded prior tickets (unrelated to the actual row).
**States handled:**
- Loading: Not present.
- Empty: Not present.
- Error: On "Create," a client-only `Math.random() > 0.15` (~85% success) simulation shows either a success toast (auto-dismisses in 3s) or an error toast ("Failed to create ticket. Please try again.," does not auto-dismiss).
- Success: Success toast; no ticket is actually persisted anywhere.
**Filters / scope controls:** N/A.
**Export / output:** N/A — this is ticket creation, not export, and it's simulated rather than real.
**Navigation out:** Modal closes back to the list.
**Code location:** `src/pages/AssessmentsPage.jsx:139-152,312-361`.
**Notes:** The "Ticket History" box is entirely static regardless of which row's ticket was just created or how many tickets already exist for it.

---

## 6. Prioritize (Findings)

**Route:** `exposure/findings`. **Component:** `src/pages/FindingsPage.jsx`. Takes only `{ onNav }`.

### Prioritize — Remediate Now & Program Status intelligence widgets

**Entry point:** `/exposure/findings`, top row.
**Trigger:** Page load.
**Steps:** "Remediate Now" lists 3 static high-priority actions (each with scope, "why," CVE/CVSS tags, days-open) and a "Remediate" button per item. "Exposure & Remediation" (Program Status) shows a 4-stat "backlog pulse" row, SLA-compliance rows by severity, and a "Top Exposed" ranked asset list — all static.
**States handled:** No loading/empty/error — static.
**Filters / scope controls:** None.
**Export / output:** Not present.
**Navigation out:** Each "Remediate" button calls `onNav('error')` — `[FLAG]` this deliberately routes to the app's generic `ErrorPage` (`type: 'notFound'`/error fallback), i.e., clicking "Remediate" on any of the 3 top actions sends the user to an error screen rather than any real remediation flow.
**Code location:** `src/pages/FindingsPage.jsx:71-186,175`.

### Prioritize — Asset/Finding criticality breakdown charts

**Entry point:** Left column, below the intelligence row.
**Trigger:** Hover over a stacked-bar segment.
**Steps:** Two stacked horizontal-bar charts ("Asset Criticality by Attack Surface," "Finding Criticality by Exposure Category") with custom hover tooltips (count + percentage) and a shared severity legend.
**States handled:** No loading/empty/error — static, hover-only.
**Filters / scope controls:** None — no click-to-filter.
**Export / output:** Not present.
**Navigation out:** Not present.
**Code location:** `src/pages/FindingsPage.jsx:244-311,17-27`.

### Prioritize — Security Posture Summary donuts

**Entry point:** Right column, top card.
**Trigger:** "Group By" dropdown change; hover on donut segments.
**Steps:** Two donut charts ("Total Exposure," "Total Findings") with a shared "Group By" dropdown (7 options: Exposure Category, Cloud Provider, OS Family, Type, Finding Exposure Severity, Business Unit, Deployment Type).
**States handled:** No loading/empty/error — static.
**Filters / scope controls:** `[FLAG]` The "Group By" dropdown updates local `groupBy` state but nothing in the file re-derives the donut data from it — both donuts always render the same two fixed `EXPOSURE_DONUT`/`FINDINGS_DONUT` objects regardless of the selected option. Cosmetic control.
**Export / output:** Not present.
**Navigation out:** Not present.
**Code location:** `src/pages/FindingsPage.jsx:29-50,318,357-378`.

### Prioritize — Failed Findings table (ranked exposure list)

**Entry point:** Bottom card, "Failed Findings (3,282,373)."
**Trigger:** Page load; search typing; pagination.
**Steps:** This is the module's core "ranked list with scoring breakdown" — 7 static rows, each with Finding Title, Affected Assets, Exposure Category, and three color-coded scores (Impact / Likelihood / Exposure — the scoring breakdown the module name implies). A real search box filters by title/asset substring. Column sort-chevrons render on every header but, as elsewhere in the app, have no wired sort logic — `[FLAG]`. Per-row Pin/Dismiss icon buttons have no `onClick` handlers — `[FLAG]` both dead. Two header buttons: "Download Exposure Factors" and "Download" — neither has an `onClick` handler — `[FLAG]` both dead despite being styled as primary actions.
**States handled:**
- Loading: Not present.
- Empty: Not present — no "no results" message.
- Error: Not present.
- Success: Filtered/paginated rows render.
**Filters / scope controls:** Search box (functional) only.
**Export / output:** Both Download buttons are non-functional (see Flags above) — `[FLAG]` this module has no working export path despite two dedicated export-styled buttons.
**Navigation out:** No row-click handler — rows are inert.
**Code location:** `src/pages/FindingsPage.jsx:52-69,380-461`.
**Notes:** The header count "(3,282,373)" is a hardcoded literal, unrelated to the 7 actual mock rows or the search-filtered count shown in pagination.

---

## 7. Compliance / GRC

**Routes:** `report/compliance` (`CompliancePage.jsx`), `report/compliance-matrix` (`ComplianceMatrixPage.jsx`), `report/compliance-findings` (`ComplianceFindingsPage.jsx`). These three, plus Assessments (module 5), make up the LeftNav "Report" section. There is **no in-page navigation** between any of the four Report tabs — switching between them happens only via the shared LeftNav/SubHeader chrome (confirmed zero cross-references inside `CompliancePage.jsx` to the other three routes).

### Compliance/GRC — Framework list & selection (left rail)

**Entry point:** `/report/compliance`, left panel, "Frameworks (N)."
**Trigger:** Page load; click a framework card; search/sort within the rail.
**Steps:** A hardcoded 28-framework catalog (NIST CSF, NIST 800-53, PCI DSS, CMMC L1–L3, ISO 27001, SOC 2, HIPAA, GDPR, DORA, and 19 more) — but the rendered list is **filtered down to only the ~9 frameworks that have an icon asset defined** (`[FLAG]` looks like an unfinished icon rollout, not intentional scoping; 19 of 28 frameworks never appear at all). Clicking a card sets a `selectedFw` highlight state that is **not consumed anywhere else on the page** — `[FLAG]` the Score card, Worst Performing list, and Function tree below are unaffected by which framework is "selected"; they always show the same static NIST-CSF-shaped tree regardless.
**States handled:**
- Loading: Not present — static data.
- Empty: A zero-match search renders no cards with no "no results" message.
- Error: Not present.
- Success: Cards render with logo/name/assessment-count/percent bar.
**Filters / scope controls:** Rail-local search + sort (Default/Category A-Z/Z-A/Score Strong→Weak/Weak→Strong), separate from the shared FilterPanel.
**Export / output:** Not present in this rail.
**Navigation out:** None — selecting a framework changes nothing else on the page.
**Code location:** `src/pages/CompliancePage.jsx:70-168,2154-2249`.

### Compliance/GRC — Score summary card & Worst Performing Assessments

**Entry point:** Top-left/top-right cards.
**Trigger:** Page load; time-range pill click (Score card); row click (Worst Performing).
**Steps:** Score card shows a hardcoded 89% overall score, trend pill, and closed/total count, with an area chart over 5 hardcoded time-series datasets. Worst Performing lists 10 hardcoded rows; clicking one synthesizes an ad-hoc node object and opens the `AssessmentDrawer` (same component as below and as reused in Assessments module).
**States handled:** No loading/empty/error — everything static, time pills swap which canned series is drawn.
**Filters / scope controls:** Time-range pills only (Score card).
**Export / output:** Not present.
**Navigation out:** Worst Performing rows open the drawer (in-page overlay, not a route change).
**Code location:** `src/pages/CompliancePage.jsx:171-289,2258-2368`.

### Compliance/GRC — Control hierarchy tree (Function table, NIST-CSF-shaped)

**Entry point:** Bottom card, "Function (N)."
**Trigger:** Page load; expand/collapse click; leaf/expand-icon click; search; sort.
**Steps:**
1. A 4-level hierarchy modeled specifically on NIST CSF v2.0 (Function → Category → Sub-Category → leaf control statement). Only the Govern and Identify functions have any populated children — the other three top-level functions (Protect/Detect/Respond) have empty `children: []`; `[FLAG]` their expand chevrons still render as if expandable, but clicking produces visibly nothing.
2. Expand/collapse state is lifted to `App.jsx` (`complianceExpanded`) purely so it survives navigating away to another Report tab and back — it is not shared with Assessments, Compliance Matrix, or Compliance Findings.
3. A "Show Trend" toggle switches the compliance column between a static bar and a sparkline. A search box filters **only top-level Function names** — `[FLAG]` searching for a leaf-level or category-level term (e.g. "MFA," "GV.PO") returns nothing even though such text exists deeper in the tree, which reads like a bug though it's simply unimplemented deep-search.
4. Clicking a leaf opens `AssessmentDrawer`; clicking the expand icon on a Function/Category/Sub-Category opens `FunctionDrawer` (near-duplicate of `AssessmentDrawer`, ~500 lines of copy-pasted logic — `[FLAG]` maintenance/consistency risk).
**States handled:**
- Loading: Not present.
- Empty: A zero-match search renders header-only with no "no results" placeholder.
- Error: Not present.
- Success: Indented tree with chevrons, sparkline/bar, rating badge.
**Filters / scope controls:** "Show Trend" toggle, top-level-only search, sort dropdown — all local, separate from the shared FilterPanel.
**Export / output:** A Download button (PDF/CSV/Excel menu) exists — `[FLAG]` every option just closes the menu; no file is ever generated.
**Navigation out:** Opens `AssessmentDrawer`/`FunctionDrawer` as same-page overlays, no route change.
**Code location:** `src/pages/CompliancePage.jsx:420-479,1863-1962,2372-2427`; state lift in `src/App.jsx:502,795`.

### Compliance/GRC — Assessment/Function Drawer (leaf and non-leaf detail)

**Entry point:** Any of: leaf-row click, expand-icon click, Worst Performing row click, or (reused) Assessments-page row click.
**Trigger:** Click.
**Steps:**
1. Overview section: ID badge, a hardcoded "Host" scope regardless of the node, "Related Frameworks" avatars + overflow popover (static list, unrelated to the specific node), a hardcoded "Medium" criticality badge for every node, and a hardcoded "Last Evaluated" date.
2. Finding Details: a half-donut score gauge and Passed/Failed/Total KPI rows — these numbers **are** node-specific (`node.pct`/`open`/`closed`).
3. A Findings table lists 17 hardcoded rows — **identical across every node opened**; `[FLAG]` the table does not actually reflect the specific control/leaf/category clicked, only the KPI numbers above it are node-specific. Every row's Status is hardcoded "Open" — `[FLAG]` no row can ever show "Passed"/"Closed," regardless of the "Include Passed Findings" toggle, which only changes a displayed count label, not the table contents (`[FLAG]` misleading given its name).
4. "Explore Asset in Knowledge Graph" button and every per-row "Explore" icon have **no `onClick` handler** — `[FLAG]` fully decorative despite explore/link-styled icons.
5. Per-row "Remediation Actions" opens a floating popup with a static 7-step AI-style recommendation and a "Ticket History" section that **always** reads "No existing tickets found," even immediately after a simulated successful ticket creation in the same session — `[FLAG]` (a `ctMockTickets` array exists in source but is never rendered anywhere, dead code).
6. "Create Ticket" opens the same modal pattern as the Assessments module (Assignee dropdown, read-only entity field, editable description, static AI recommendation) with the same ~80%-success random-toast simulation and no real persistence.
**States handled:**
- Loading: Not present.
- Empty: "No existing tickets found" is hardcoded to always show (see Flag above).
- Error: Simulated ~20% random ticket-creation failure toast — the only error state on the page, and it's random rather than tied to any real validation.
- Success: Toast, auto-dismiss 3s.
**Filters / scope controls:** "Include Passed Findings" toggle (label-only, see Flag); trend metric dropdown/time pills.
**Export / output:** Findings-table Download button — `[FLAG]` non-functional, closes menu only.
**Navigation out:** "Explore" affordances are all dead (see above).
**Code location:** `src/pages/CompliancePage.jsx:785-1352` (`AssessmentDrawer`), `1355-1860` (`FunctionDrawer`), reused at `src/pages/AssessmentsPage.jsx:2`.

### Compliance/GRC — Compliance Matrix (framework × dimension heatmap)

**Entry point:** `/report/compliance-matrix`. **Component:** `ComplianceMatrixPage.jsx`, receives one prop: `onCellClick`.
**Trigger:** Page load; toolbar dropdown changes; cell hover/click.
**Steps:**
1. Toolbar: Framework (6 options), Level (Function/Category/Sub-Category — x-axis), Group By (Business Unit/Region/Entity Type/Department — y-axis), Compare With (None/several relative-date options), and a Change %/Absolute Score display-mode segmented control.
2. The heatmap is entirely static-lookup data selected by the current Level+Group By combination (`getRows`/`getPrevRows` branching, no `.filter()` computation) — a real dataset-selection mechanism, not row filtering.
3. Hovering a scored cell shows a rich tooltip (assessments count, failed findings, and — if a comparison date is active — change % and prior absolute score). A legend at the bottom explains the color bands (Weak/Moderate/Strong/Fully Compliant/Not in Scope).
4. **Clicking a scored cell is a real, live-wired action:** it builds `{ framework, frameworkName, groupBy, row, col, colId, score }` and calls `onCellClick`, which `App.jsx` uses to set a dedicated `matrixFilter` state and navigate to Compliance Findings. Cells with a null score ("—," Not in Scope) are not clickable.
**States handled:**
- Loading: Not present.
- Empty: Not present — no `.filter()` exists in this file at all; every level/groupBy combination has a defined static row set.
- Error: Not present.
- Success: Colored/animated cell grid with staggered fade-in.
**Filters / scope controls:** The 5 toolbar controls described above — all genuinely change what renders (dataset selection, not text filtering). Entirely separate mechanism from the shared FilterPanel/`filtersByPage` chip system (confirmed zero references to either in this file).
**Export / output:** Not present.
**Navigation out:** Clicking a scored cell navigates to `/report/compliance-findings` carrying the click context (see next flow).
**Code location:** `src/pages/ComplianceMatrixPage.jsx:94-534`; wiring in `src/App.jsx:491,797`.

### Compliance/GRC — Compliance Findings (matrix-filtered results)

**Entry point:** `/report/compliance-findings`, reached either directly via LeftNav (with no filter) or via a Compliance Matrix cell click (with a filter object).
**Trigger:** Page load; matrix cell click upstream; search typing; "Clear filter."
**Steps:**
1. Receives `filter` (= the App-level `matrixFilter` object, **not** the shared FilterPanel chip system — a fully separate, independent mechanism) and `onClearFilter`.
2. **The `filter` prop genuinely filters the rendered rows**, confirmed by tracing `ROWS.filter(...)` → `filteredRows` → `visibleRows` → the actual `<tr>` map. However, the match logic only inspects `filter.row` (substring match against entity name) and, when `filter.groupBy === 'Entity Type'`, four hardcoded label→type mappings (Host/Device, Cloud Account, Identity, Storage). `[FLAG]` `filter.col`, `filter.colId`, `filter.framework`, and `filter.score` are received but **never used in the filtering predicate** — they only appear in the "Filtered by:" banner text. `[FLAG]` For the other 3 of 4 possible Group By dimensions (Business Unit/Region/Department), the row-matching path falls back to a literal substring match against labels like "Zone B Workstation" that don't exist anywhere in this page's mock entity names — so clicking a cell under those groupings yields an empty result set in practice, even though the mechanism is "live-wired," not dead.
3. An "Active filter bar" banner shows the framework/column/row context with a "Clear filter" button (calls `onClearFilter` → clears `matrixFilter` in `App.jsx`).
4. A real search box further narrows the (possibly matrix-filtered) rows. An "Include Passed Findings" toggle only changes which of two hardcoded totals (`TOTAL_ALL` vs `TOTAL_OPEN`) is displayed when no matrix filter is active — it does not affect the rendered rows either way, since every mock row has status "Open."
5. Per-row "Remediation" (opens a floating popup, same 7-step static recommendation pattern seen in Compliance/Assess) and "Explore" (icon present, **no `onClick`** — `[FLAG]` dead) actions. A "Download" dropdown (CSV/PDF/Excel) — `[FLAG]` every option just closes the menu, no file produced.
**States handled:**
- Loading: Not present.
- Empty: Not present — no dedicated "0 results" message even for the degenerate matrix-filter case described above.
- Error: Simulated ~20% random ticket-creation-failure toast (same pattern as elsewhere).
- Success: Filtered/paginated table renders; ticket-creation success toast.
**Filters / scope controls:** The matrix-click `filter` (partially functional, see above), local search, "Include Passed Findings" (display-only).
**Export / output:** Download dropdown — non-functional (see Flag).
**Navigation out:** "Clear filter" only; no drill-down further from a row.
**Code location:** `src/pages/ComplianceFindingsPage.jsx:117-449`; wiring in `src/App.jsx:491,798`.

---

## 8. Reporting / Export (Workspace)

**Entry point:** LeftNav top-level "Workspace" item. **Routes:** `workspace/library` (default), `workspace/saved`, `workspace/dashboard/*`, `workspace/report/*`, `workspace/report-preview/*`, `workspace/configure-screen`. **Components:** `WorkspacePage.jsx` (shell/router), `LibraryPage.jsx`, `SavedPage.jsx`, `DashboardCanvas.jsx` (shared builder for both dashboards and reports), `ReportPreviewPage.jsx`, `DataConfigPage.jsx`. **Persistence:** confirmed via a repo-wide grep for `localStorage` — the *entire* module has none; all state is React `useState`/context that vanishes on reload. The one `localStorage` reference in this module (`pai-excel-warn-dismissed`, removed on every report-route entry) is never set or read anywhere — vestigial dead code.

### Reporting/Export — Library (entry point)

**Entry point:** `/workspace` (redirects to `workspace/library`).
**Trigger:** Page load; card clicks; search/filter/sort within the page.
**Steps:**
1. An "Import a Screen" banner offers "Connect Design" (→ Configure Screen, no real file) and "Upload HTML" (real file picker, `.html`/`.htm`, stores the actual `File` object → Configure Screen).
2. A "Get Started" row of 5 cards: "Custom Dashboard" and "Discover Dashboard" go to distinct real routes; "Report Template"'s CTA is a literal no-op (`() => {}`); "CISO Dashboard" and "Client Subsidiary" both route to the identical generic `workspace/dashboard/new` despite distinct card copy — `[FLAG]`.
3. A "Quick Actions" section: 3 REPORT cards correctly route to the 3 distinct report templates; all 3 DASHBOARD cards route to the same generic `workspace/dashboard/new` — `[FLAG]` same pattern as above.
4. A pill filter (All/Dashboards/Reports), search box, and a sort dropdown whose "Recently Added"/"Oldest First" options are wired to a comparator that always `return 0` — `[FLAG]` no-op sort.
5. Tab-bar "New Template" button has no `onClick` at all — `[FLAG]`. "New Dashboard" works (routes to `workspace/dashboard/new`).
**States handled:**
- Loading: Not present.
- Empty: "No results found." shown when the filtered Quick Actions list is empty.
- Error: Not present.
- Success: Navigation is the only "success" outcome.
**Filters / scope controls:** Local pill filter + search + (non-functional) sort.
**Export / output:** Not present — Library only launches builders.
**Navigation out:** To all the destinations described above.
**Code location:** `src/pages/LibraryPage.jsx:1-318`.

### Reporting/Export — Saved

**Entry point:** `workspace/saved`, reached via the "Saved" tab or after a successful Save/Schedule action from Report Preview.
**Trigger:** Tab click; arrival after saving.
**Steps:**
1. Table concatenates real `savedReports` (added only via the Report Preview flow) with 5 permanent hardcoded seed rows that always appear regardless of actual usage — `[FLAG]` mixed indistinguishably in the same list.
2. "View"/"Edit" actions **ignore the row's actual identity**: every REPORT row's "View" always opens the Executive Summary preview; every REPORT row's "Edit" always opens the Executive Summary builder; every DASHBOARD row's "Edit" always opens a blank new dashboard — `[FLAG]` a Compliance Report or Critical-Findings dashboard, when viewed/edited, silently substitutes a different template.
3. Per-row "Download" and "Schedule" icon buttons have no handlers — `[FLAG]` both dead.
4. "Delete" opens a confirmation-modal *request* via context state (`openDeleteModal`), but **no modal component consuming that state was found anywhere in the module** — `[FLAG]` clicking Delete sets state with no visible UI effect based on the code read.
5. Type pill (All/Dashboards/Reports), Visibility pill (All/Private/Public), and search all genuinely filter the combined row list.
**States handled:**
- Loading: Not present.
- Empty: "No results found." row spanning all columns.
- Error: Not present.
- Success: Newly-added rows get a real "New" badge.
**Filters / scope controls:** Type/Visibility pills + search (functional).
**Export / output:** Per-row Download — dead (see above).
**Navigation out:** See View/Edit mismatches above.
**Code location:** `src/pages/SavedPage.jsx:1-235`; `src/context/WorkspaceCtx.jsx:69,99-105`.
**Notes:** Nothing added here survives a page reload — confirmed no localStorage/backend write anywhere in `WorkspaceCtx.jsx`.

### Reporting/Export — Dashboard Canvas (dashboard-building mode)

**Entry point:** `workspace/dashboard/discover` (pre-seeded "Discover Dashboard" template) or `workspace/dashboard/new`/any other `workspace/dashboard*` (blank canvas).
**Trigger:** "Create New Dashboard"/"New Dashboard"/"Edit Dashboard" from Library or Saved, or the Discover-page "Edit" shortcut.
**Steps:**
1. Toolbar: editable name field, a performance badge (Optimal/Approaching Limit/Limit Reached, computed from widget count — genuinely functional), "Convert to Report" (no `onClick` — `[FLAG]` dead), a static "Dashboard Scope" badge (no interaction wired — `[FLAG]` dead), Reset (clears all widgets, functional), and **"Save"** — `[FLAG]` its `onClick` is literally `if (!reportMode) return`, meaning in dashboard-building mode Save is a complete, unconditional no-op. A custom dashboard cannot be saved anywhere in the current wiring.
2. Widget grid: each widget's hover controls include Move (drag-handle icon with **no drag/drop logic attached anywhere in the file** — `[FLAG]` purely decorative, dashboards cannot actually be reordered), "Add nested widget" (no handler — `[FLAG]` dead), Edit (opens `WidgetSettingsPanel`, functional), Delete (confirmation modal naming the widget, then genuinely removes it from local state — functional).
3. "Add Widget" opens a real two-step flow: pick title/description/size/height/chart-type (9 types), see a live gray-silhouette preview, Save commits it and immediately opens `WidgetSettingsPanel` for further configuration (General tab: type/title/size/color; Data tab: columns/attributes/toggles) — but **none of the Data-tab controls change what the chart actually renders**; chart content is either the seeded template array or a generic default, never derived from these settings — `[FLAG]`.
4. The `'discover'` template renders the actual `DiscoverDevicePage` component in a special dashboard-editing mode with hover-to-edit affordances over its fixed sections.
**States handled:**
- Loading: Not present — fully synchronous local state.
- Empty: A brand-new dashboard starts with zero widgets and just an "Add Widget" tile.
- Error: Not present.
- Success: No save confirmation of any kind (Save is a no-op in this mode).
**Filters / scope controls:** The "Dashboard Scope" badge implies one but has no wired interaction.
**Export / output:** Not present.
**Navigation out:** Back arrow → Library. No forward path to a preview/export screen exists for dashboards (that path is report-mode only).
**Code location:** `src/pages/DashboardCanvas.jsx:1694-1846,2585-2924`.

### Reporting/Export — Dashboard Canvas (report-building mode) & the 3 built-in templates

**Entry point:** `workspace/report/executive-summary`, `workspace/report/vulnerabilities`, `workspace/report/month-over-month`.
**Trigger:** "Edit Template" from Library, or Saved's Edit action (always resolves to Executive Summary regardless of the row clicked — see Saved flow above).
**Steps:**
1. Month-over-Month uniquely gates entry behind a blocking modal requiring a report name and date-range pick before the canvas renders; canceling returns to Library. The other two skip straight to the canvas.
2. Toolbar differs from dashboard mode: no performance badge, no "Convert to Report," no scope badge; Reset is replaced by Undo/Redo icons with **no handlers at all** — `[FLAG]` both dead; the primary CTA reads "Preview" (not "Save") and genuinely navigates to Report Preview.
3. Widgets are template-fixed: no "Add Widget" tile exists in report mode, and the Move/Add-nested/Delete hover icons are suppressed — only "Edit" (open settings) is reachable. So a report's widget *set* cannot be changed via UI, only individual widgets' settings.
4. The three templates are large, fully hardcoded widget arrays: Executive Summary (20 widgets, all with real baked-in numeric data), Vulnerability Detail (11 widgets, but its 3 table widgets ship with `data: []` — genuinely empty), Month-over-Month (10 widgets, both its tables likewise ship with `data: []`).
5. A "Filter" button opens the shared `FilterPanel` (scoped `pageId="workspace/report"`) in a bespoke local drawer (not the app-wide right-panel shell). Applying filters here **auto-closes the drawer** (unlike the main-app filter flow) and the resulting chips are carried through to Report Preview's cover page as descriptive text.
**States handled:**
- Loading: Month-over-Month shows a full skeleton until its modal is confirmed.
- Empty: The two templates whose tables ship with `data: []` render genuinely empty tables with no "no data" messaging.
- Error: Not present.
- Success: No save confirmation — "Preview" simply advances; the report isn't considered "saved" until Report Preview's own Save is clicked.
**Filters / scope controls:** Report-scoped `FilterPanel` instance — `[FLAG]` filters are cosmetic here too: nothing in `DashboardCanvas.jsx`'s report-mode rendering re-derives any of the hardcoded template widget data from `reportFilters`; they only ever appear as text on the eventual cover page.
**Export / output:** None at this stage — export lives entirely on Report Preview.
**Navigation out:** "Preview" → Report Preview. Back arrow → Library. Canceling the MoM modal → Library.
**Code location:** `src/pages/DashboardCanvas.jsx:1852-2265,2440-2559,2585-2924`; `src/pages/WorkspacePage.jsx:39-70,115-163`.

### Reporting/Export — Report Preview (the module's export surface)

**Entry point:** `workspace/report-preview/{slug}`, reached only via a report's "Preview" button.
**Trigger:** Page load; toolbar button clicks.
**Steps:**
1. A read-only title field (must go back to the builder to rename), and a paginated print-style preview: a Cover Page (title, description, "Created by"/"Report Generated" metadata, and a "Report Criteria" box listing the carried-forward filter chips, or "No filters applied" if none) followed by widget rows packed into fixed-height simulated "pages" — purely a client-side visual layout, not a real document.
2. **Save**: opens a name-confirmation modal first time, then pushes an entry into the shared (in-memory-only) `savedReports` list and navigates to Saved.
3. **Schedule**: forces Save first if not already saved, then opens a scheduling modal (recipients, one-time/daily, start date/time, repeat cadence — including a **hardcoded** "Next report will be on Friday, Aug 15, 2025, 9:00 AM" preview line regardless of any actual input), confirming pushes a "Scheduled"-status Saved-page entry. No real email/schedule is created anywhere — no backend call exists.
4. **Share**: same save-first gate, then a modal with recipients/message fields and a "Copy link" button — `[FLAG]` no `onClick` handler, dead.
5. **Download**: "PDF" option — `[FLAG]` clicking it only closes its own dropdown menu, no file is ever generated. "Excel" option opens a table-selection modal (pre-checked checkboxes per table widget) whose own "Download" button — `[FLAG]` only calls a state setter that closes the modal; no export call, no file.
**States handled:**
- Loading: Not present.
- Empty: Cover page shows "No filters applied" when appropriate.
- Error: Not present.
- Success: Save/Schedule/Share all genuinely navigate to Saved with a real new row — the closest thing to a success confirmation in the module; there is no toast/snackbar.
**Filters / scope controls:** Displays (read-only) the filters carried from the report builder; no editing here.
**Export / output:** `[FLAG]` **There is no working export path anywhere in this entire module** — neither PDF nor Excel produces a downloadable artifact, despite fully-styled, validation-backed, interactive-looking UI for both.
**Navigation out:** Back/Edit → the report builder. Save/Schedule/Share → Saved.
**Code location:** `src/pages/ReportPreviewPage.jsx:1-598`.

### Reporting/Export — Configure Screen (DataConfigPage)

**Entry point:** `workspace/configure-screen`, reached only from Library's "Upload HTML" (after picking a file) or "Connect Design."
**Trigger:** Arrival from either Library action.
**Steps:**
1. If a real HTML file was uploaded, the main body shows a genuine live `<iframe>` preview of that file (via a blob URL) — the one authentic user-content preview in the module. Otherwise (including the entire "Connect Design" path, which never has a real file) it shows a hand-built, clearly-labeled "Sample Preview" mock SVG dashboard with fully invented numbers.
2. An "AI Detection" panel simulates scanning (1–1.4s skeleton delay) then **always** reveals the identical hardcoded 3-item detected-elements list regardless of what was actually uploaded or connected — `[FLAG]` not real content analysis.
3. A "Configure" side panel offers Description, Visibility (Private/Public), the AI Detection block, and a "Data Source" picker (Live API endpoint text field — not validated/used; CSV file input — accepts a file but wires to nothing).
4. "Save" is disabled until the name field is non-empty; on click it **only clears local state and navigates back to Library** — `[FLAG]` no actual save/persist call exists; nothing created here appears anywhere else in the app (no new Library/Saved entry).
**States handled:**
- Loading: AI Detection shows 3 skeleton rows while "detecting."
- Empty: "Upload or connect a design to begin detection" (effectively unreachable in normal use).
- Error: Not present — no upload validation, size limits, or failure states.
- Success: None beyond navigating back to Library.
**Filters / scope controls:** Not applicable to this screen.
**Export / output:** Not present — this is an inbound-import screen.
**Navigation out:** Back and Save both return to Library, with nothing persisted.
**Code location:** `src/pages/DataConfigPage.jsx:1-601`.

---

## 9. Studio / Connectors

**Status:** `[PLACEHOLDER — no live interactions]` (Studio) / `[NOT IMPLEMENTED]` (Connectors).

### Studio — Mode switch placeholder

**Entry point:** LeftNav header, the "EM Dashboard"/"Studio" mode switcher dropdown.
**Trigger:** Selecting "Studio" from the dropdown (marked with a "Soon" badge in the menu itself).
**Steps:** `App.jsx` sets `appMode = 'studio'`. While in this mode, the LeftNav's normal section list (Workspace/Exposure/Discover/Report/Knowledge Graph) is hidden entirely, and the main content area — regardless of whatever `current` route was previously active — renders a single generic `ComingSoon()` component: an icon, "Coming Soon" title, and "This page is currently under development and will be available soon." No sub-navigation, no settings, nothing else exists in this mode.
**States handled:** N/A — static placeholder.
**Filters / scope controls:** None.
**Export / output:** None.
**Navigation out:** Reopening the mode dropdown and selecting "EM Dashboard" is the only way out.
**Code location:** `src/App.jsx:128-152` (`ComingSoon`), `791-801` (studio-mode branch), `529` (`appMode` state); `src/components/LeftNav.jsx:130-200` (mode dropdown, "Soon" badge).
**Notes:** The dropdown's own "Soon" label is an honest, explicit signal — this is the one placeholder area the product itself openly discloses as unfinished, rather than silently presenting dead controls.

### Connectors — Not implemented

**Entry point:** None exists.
**Trigger:** N/A.
**Steps:** A repo-wide search for "connector" turns up only two incidental matches — a CSS class name and a code comment describing a mock chart's x-axis label ("Asset origin by connector") inside the unrelated `DataConfigPage.jsx` mock preview (see Reporting/Export module). There is no connector list, connector detail view, configuration screen, or status-indicator UI anywhere in the codebase, and no navigation entry point (menu item, route, or button) leads toward one.
**States handled:** N/A.
**Filters / scope controls:** N/A.
**Export / output:** N/A.
**Navigation out:** N/A.
**Code location:** N/A.
**Notes:** `[NOT IMPLEMENTED]`. If Connectors is intended to live under the Studio mode shown above, that mode currently renders only the generic "Coming Soon" placeholder with no connector-specific scaffolding of any kind.

---

## 10. Settings / Admin

**Status:** `[NOT IMPLEMENTED]`.

### Settings/Admin — Not implemented

**Entry point:** None exists.
**Trigger:** N/A.
**Steps:** A repo-wide search for "settings," "admin," "ABAC," "access control," "user management," and "role-based" turns up only unrelated incidental matches (CSS class names like `.dcp-settings-panel` for the Configure Screen's config drawer, comments, and the KG page's dev-only "Tweaks" panel, which is an internal graph-animation/edge-editing tool, not a user-facing settings screen — documented under Knowledge Graph). There is no settings page, access-control/scope configuration, or user-management screen anywhere in the codebase, and no navigation entry point leads toward one.
**States handled:** N/A.
**Filters / scope controls:** N/A.
**Export / output:** N/A.
**Navigation out:** N/A.
**Code location:** N/A.
**Notes:** `[NOT IMPLEMENTED]`. The closest adjacent UI is the Topbar's avatar initials ("MP") and notification bell — both present but inert (see Shared Components, Topbar). Neither opens any menu, dropdown, or settings surface.

---

## Shared Components (used across multiple modules — documented once)

### Shared — FilterPanel / ActiveFilterPanel (the app-wide "Filter" system)

**Entry point:** The "Filter" button in `SubHeader`, present on nearly every page (`src/components/SubHeader.jsx:178-183`), opening a shared 400px right-side panel (`RightPanelShell` in `App.jsx`). A separate, bespoke instance is embedded directly in the Workspace report-builder (see Reporting/Export).
**Trigger:** Click "Filter."
**Steps — Quick Filters tab (default):**
1. Attribute list is looked up per-`pageId` from a large static table (`PAGE_FILTER_ATTRS`); unknown pages fall back to a 7-attribute default set.
2. Each attribute is a collapsible checkbox group (or a range slider for numeric attributes), with Select-All, an AND/OR/EXACT mode bar for multi-mode attributes, per-attribute search, and a "Show All/Less" toggle beyond 8 visible options.
3. "Apply" builds a chip array and a count, calling `onApply(count, chips)`; "Reset" only clears the panel's in-progress draft — it does **not** call `onApply`, so previously-applied chips remain until a fresh Apply overwrites them.
4. A Settings/gear view lets a user reorder, rename, or delete attributes, or jump to the Graph Filter tab via an "Add Attributes" button that **only switches tabs** rather than adding a new attribute — `[FLAG]`. None of these edits persist beyond the current mount.
**Steps — Saved Filters tab:**
5. Lists 6 hardcoded saved-filter cards (name/description/author/visibility/pinned/`count` metadata). Selecting one and clicking Apply always produces **exactly one** generic "Saved Filter: {name}" chip — `[FLAG]` the card's claimed `count` of underlying criteria (e.g. "12 filters") is never actually expanded into real filter logic. A "View all" button has no handler — `[FLAG]` dead.
**Steps — Graph Filter tab:**
6. A floating, draggable/resizable node-graph canvas (17 entity types) lets a user click-to-connect entities into relationship "paths." Clicking "Apply Filter" builds chips **only from these entity-to-entity path connections**.
7. Each entity node also exposes a rich per-attribute filter accordion (Include/Exclude, values, AND/OR/EXACT, ranges, dates) — `[FLAG]` this entire per-entity attribute UI is fully interactive but structurally disconnected from the Apply handler; none of those selections ever reach `onApply` or produce a chip.
8. A near-duplicate second implementation of this whole tab (`GraphFilterDrawer`) exists in the same file and is exported, but is **not imported or rendered anywhere else in the codebase** — `[FLAG]` confirmed dead code.
**States handled:**
- Loading: Not present anywhere in the panel — all data is static.
- Empty: Saved Filters search shows "No saved filters found." (the one tab with a real empty-state message); Quick Filters' attribute search and per-option search show no equivalent message — `[FLAG]`.
- Error: Not present.
- Success: Chips render in the SubHeader "Active Filters" pill/preview.
**Filters / scope controls:** As described per tab.
**Export / output:** Not present within the panel itself.
**Navigation out:** Closing via the shared panel's own close button.
**Code location:** `src/components/FilterPanel.jsx` (whole file, ~3278 lines).

**Active Filter Panel & Save Filter modal:**
9. The SubHeader "Active Filters" pill (with a numeric badge) opens `ActiveFilterPanel`, which groups chips by an inferred "entity" using a hardcoded lookup table that only covers 7 generic attribute ids — `[FLAG]` any chip whose attribute isn't in that table (the large majority of real per-page attributes) silently defaults to grouping under "Host," regardless of its real entity type. The Knowledge Graph page gets its own 17-entity tree config with empty "implicit filter" data (so its Implicit Filters toggle reveals nothing), while most other pages get a 7-entity generic tree with non-empty hardcoded implicit filters like "Status: Open."
10. Per-chip × removal, a "Reset Filters" action (with a confirmation modal — the one confirmation dialog in this whole system), and a "Save Filter" action are available. Both the SubHeader's own bookmark-icon Save button and the panel's "Save Filter" button open the identical `SaveFilterModal`.
11. `[FLAG]` **`SaveFilterModal`'s save action only does `console.log('Filter saved:', data)`** in both places it's wired — nothing is persisted; a "created" or "overwritten" filter never appears in the Saved Filters tab it nominally targets, and no success confirmation is shown to the user.
**Code location:** `src/components/ActiveFilterPanel.jsx` (whole file); `src/components/SubHeader.jsx:140-194`.

**Persistence and downstream effect (the single most significant cross-cutting finding in this document):**
12. Filter state (`filtersByPage`, keyed per page id) lives in `App.jsx` and persists across in-session navigation but is lost on any page reload (plain React state, no localStorage/backend).
13. `[FLAG]` **`FilterPanel` never reflects previously-applied filters when reopened** — its internal checkbox/range state always resets to blank on mount, even though the SubHeader pill correctly shows the existing count and the Active Filter Panel correctly shows the existing chips. Re-clicking Apply with nothing (re-)checked would then overwrite the existing filter with an empty one.
14. `[FLAG — system-wide]` **Confirmed via direct prop-signature inspection of every page in the app** (Exposure Overview, Findings, all three Discover pages, Compliance, Assessments, Compliance Matrix, Compliance Findings, Knowledge Graph): **none of them receive or read `activeFilters`/`filtersByPage`/`curPageFilters` in any form.** The entire FilterPanel/chip system is cosmetic app-wide — applying a filter updates the SubHeader display and is stored in state, but never changes a single row, chart, KPI, or graph node anywhere in the product. The one partial exception is the Workspace Report Template flow, where filter chips are echoed as descriptive text on the generated report's cover page — still not a real data filter on the report body.
15. `"Explore in"` (SubHeader dropdown to jump to another page) does genuinely copy the current page's filter chips into the destination page's bucket — but per the above, this only changes what the destination's chip *display* shows, never its actual content; and it silently overwrites any filters the destination page already had.
16. Separately, several pages implement **their own, fully independent, genuinely-working local filters** that have nothing to do with this shared system: page-local search boxes (Exposure Overview, Findings, all three Discover pages, Assessments all filter their own static arrays for real), and the Compliance Matrix → Compliance Findings cell-click mechanism (a distinct `matrixFilter` App state, partially functional — see Compliance/GRC module for its specific limitations).
**Code location:** `src/App.jsx:499,566-608,715-725,770-803`.

### Shared — SubHeader (breadcrumb, Filter, Active Filters, Explore in, page menu)

**Entry point:** Rendered at the top of nearly every page's content area.
**Trigger:** N/A — always present.
**Steps:** Breadcrumb (clickable, resets to Home/Overview); "Active Filters" pill (see above); "Filter" button (see above); "Explore in" dropdown, grouped by section (Exposure/Discover/Report), copying the current page's filters to the chosen destination and navigating; a "more" dropdown menu whose contents vary per page (e.g. the "Edit" item that only does something on the three Discover pages).
**States handled:** N/A — chrome component.
**Filters / scope controls:** See FilterPanel section above.
**Export / output:** Not present in SubHeader itself.
**Navigation out:** Breadcrumb, Explore in.
**Code location:** `src/components/SubHeader.jsx` (whole file).
**Notes:** SubHeader does **not** render an inline chip row directly in the header bar — the pill + count badge is the only header-level indicator; all chip detail lives inside the `ActiveFilterPanel` overlay.

### Shared — Topbar

**Entry point:** Fixed header bar, present on every page.
**Trigger:** N/A.
**Steps:** PAI wordmark logo (image only, no "Prevalent AI" text — consistent with the design system rule); a static "Last updated" timestamp; a version badge; a working light/dark theme toggle (persists via `localStorage`); a notification bell with an unread-dot indicator; a "MP" avatar initials chip; and the persistent "Navigator" pill (opens the Navigator panel).
**States handled:** N/A.
**Filters / scope controls:** Not present.
**Export / output:** Not present.
**Navigation out:** Navigator pill only.
**Code location:** `src/components/Topbar.jsx`.
**Notes:** `[FLAG]` The notification bell button has no `onClick` handler — clicking it does nothing despite the unread-dot implying there's something to see. `[FLAG]` The "MP" avatar has no `onClick`/dropdown at all — there is no user menu, profile page, or settings access point anywhere behind it, consistent with Settings/Admin being entirely unimplemented.

### Shared — LeftNav

**Entry point:** Fixed left sidebar, present on every page (collapsible to an icon rail).
**Trigger:** N/A.
**Steps:** A mode-switcher dropdown ("EM Dashboard" ⇄ "Studio," plus a "Navigator" shortcut that opens the full Navigator page); the main section list (Workspace, Exposure [Overview/Findings], Discover [Device/Cloud/Identity], Report [Compliance/Assessments/Compliance Matrix/Compliance Findings], Knowledge Graph); each parent section expands/collapses its children, with the currently-active leaf highlighted.
**States handled:** N/A.
**Filters / scope controls:** Not present.
**Export / output:** Not present.
**Navigation out:** This is the primary navigation surface for the whole app.
**Code location:** `src/components/LeftNav.jsx`.
