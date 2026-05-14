Fetch ALL of these URLs fully before doing anything:
1. https://anthu211.github.io/design-system-2.0/ds/rules.json
2. https://anthu211.github.io/design-system-2.0/ds/tokens/colors.json
3. https://anthu211.github.io/design-system-2.0/ds/tokens/spacing.json
4. https://anthu211.github.io/design-system-2.0/ds/tokens/typography.json
5. https://anthu211.github.io/design-system-2.0/ds/components/buttons.json
6. https://anthu211.github.io/design-system-2.0/ds/components/tables.json
7. https://anthu211.github.io/design-system-2.0/ds/components/badges.json
8. https://anthu211.github.io/design-system-2.0/ds/components/modals.json
9. https://anthu211.github.io/design-system-2.0/ds/components/inputs.json
10. https://anthu211.github.io/design-system-2.0/ds/components/feedback.json
11. https://anthu211.github.io/design-system-2.0/ds/components/states.json
12. https://anthu211.github.io/design-system-2.0/ds/components/charts.json
13. https://anthu211.github.io/design-system-2.0/ds/components/cards.json
14. https://anthu211.github.io/design-system-2.0/ds/components/utilities.json
15. https://anthu211.github.io/design-system-2.0/ds/components/tabs.json
16. https://anthu211.github.io/design-system-2.0/ds/core.txt

Do not proceed until every URL above is fully fetched and read.

---

Review this screen against the Prevalent AI design system and UX laws:

$ARGUMENTS

---

Return a `✅ PASS` / `❌ FAIL` checklist using the fetched files as the source of truth. For every FAIL, give the exact fix referencing the specific rule or token.

## Shell & Structure
- [ ] Topbar `#131313` with PAI logo image — no "Prevalent AI" text
- [ ] Nav header shows workspace name, not "Prevalent AI"
- [ ] Left nav + sticky sub-header + content body present
- [ ] Sub-header title 12px/500 (not `<h1>` or 18px), breadcrumb 11px below

## Tokens & Styling
- [ ] Accent `#6360D8` · Filter CTA `#504bb8`
- [ ] All CTA/text buttons `border-radius:44px`
- [ ] Cards, table wrappers `border-radius:4px` only
- [ ] Inter font · `<html class="theme-light">`
- [ ] Spacing 4px scale only for margin, padding, gap — flag off-scale values there only. border-radius is NOT spacing and is not restricted to the 4pt grid.

## Tables
- [ ] Column order: checkbox → data → status → actions (empty `<th>`)
- [ ] Row actions in own `col-actions` cell — NOT mixed with status badge
- [ ] Row actions CSS-hidden by default — no `style="display:flex"` inline
- [ ] Status/severity visible in column — not tooltip-only
- [ ] Pagination footer present
- [ ] Skeleton load keeps `thead` visible — only `tbody` rows replaced with `ds-skeleton`

## Components
- [ ] KPI cards ≤ 5, no icons, no colored borders, correct delta classes
- [ ] KPI delta always present — never omitted; direction class correct (`up-good` / `down-good` / `up-bad` / `down-bad`)
- [ ] Table columns ≤ 7
- [ ] Destructive actions have confirmation modal (item name + consequence + red confirm)
- [ ] No page-level tabs unless explicitly requested
- [ ] Empty/error states use correct emoji — 🚦 table empty · 🚧 error · 📋 first-use

## Forms & Inputs
- [ ] Text inputs and dropdowns use `border-radius:8px` — not 4px (cards) or 44px (buttons)
- [ ] No native `<select>` — `ds-dropdown` used throughout
- [ ] Dropdown panel includes search input when 10+ options present
- [ ] Validation triggers on blur only — never per-keystroke
- [ ] Required fields marked with `<span style="color:#dc2626">*</span>` after label text
- [ ] Field error: red `1.5px` border + ⓘ icon + specific message below — never border alone
- [ ] Field value preserved on error — never cleared
- [ ] Filter chips use `ds-filter-chip` with `ds-chip-key` / `ds-chip-value` / `ds-chip-close` structure

## Feedback & States
- [ ] Toast position: `bottom-right`, `fixed`, `z-index:1000` — max 3 stacked
- [ ] Error and warning toasts **persist** (never auto-dismiss) — success/info auto-dismiss after 3s
- [ ] Toast never used for destructive confirmations or decisions — modal used instead
- [ ] Inline alerts/banners use `ds-callout` classes — never custom-styled
- [ ] Table empty state: 🚦 emoji · "No Data… For Now!" · `thead` + pagination remain visible · no Refresh CTA
- [ ] First-use empty section: 📋 emoji · headline + 1-line context + exactly one primary CTA
- [ ] Section error: 🚧 emoji · "Data Retrieval Failed" · Retry button · scoped to section only — entire page never redirected
- [ ] Full-page error: 🚧 emoji · "ERROR" watermark (`font-size:90px, opacity:0.08`) · topbar + nav kept visible · no stack trace
- [ ] Skeleton loaders used when layout is predictable — not spinners
- [ ] Skeleton shape matches content it replaces: `border-radius:4px` for rows/text, `44px` for badge/button shapes

## Charts & Data Visualization
- [ ] No `<canvas>`, Chart.js, D3, or ECharts — SVG functions (HTML) or Recharts (React) only
- [ ] Chart wrapped in content-card: `border-radius:4px`, `padding:20px 24px`
- [ ] Y-axis baseline always `0` — never dynamic `yMin`
- [ ] Y-axis ticks ≤ 6
- [ ] Legend present below every multi-series chart with `chart-legend-dot` per series
- [ ] Tooltip HTML present in DOM — charts never rendered without it
- [ ] Severity series use DS tokens: critical `#D12329` · high `#D98B1D` · medium `#F5B700` · low `#31A56D`
- [ ] Non-severity series use DS normal color palette — no custom hex colors

## Cards
- [ ] All cards use `border-radius:4px` — forbidden values: 8px, 10px, 12px, 16px, `rounded-xl`, `rounded-2xl`
- [ ] No `box-shadow`, colored left-border, or background gradients on any card
- [ ] Cards not nested more than one level deep
- [ ] `var(--card-bg)` and `var(--card-border)` used — no hardcoded card background colors

## Tabs
- [ ] Tabs appear only within a page section or detail panel — never at page level (unless explicitly requested)
- [ ] Max 5 visible tabs — overflow menu present if more
- [ ] Active tab: `color:#6360D8` with `2px solid #6360D8` bottom-border indicator
- [ ] Tab buttons: `border-radius:0` — indicator is bottom-border only, no pill shape
- [ ] Tab `font-size:12px` · active weight 500 · inactive weight 400

## Utilities
- [ ] Breadcrumb last crumb: `color:#6360D8` · non-linked · represents current page
- [ ] Tooltip is CSS-only (`:hover`) — no JS `.show()` / `.hide()`
- [ ] Pagination "Showing X–Y of Z" label on the left · prev/next disabled (not hidden) at boundaries
- [ ] Progress bars use `border-radius:44px` · `danger` modifier used for critical thresholds
- [ ] Multi-step flows use `ds-steps` component with `completed` / `active` state classes

## Interaction Quality

### Decision Hierarchy
- [ ] Each view has exactly one visually dominant primary action — secondary/tertiary actions are clearly subordinate in weight
- [ ] High-severity or overdue items surface visually without requiring the user to sort or filter — critical rows are scannable at a glance
- [ ] Applied filters always visible as chips — user never has to guess why fewer rows appear

### Workflow Integrity
- [ ] Multi-step flows (wizards, onboarding, config) show a `ds-steps` progress indicator — user always knows where they are and how many steps remain
- [ ] Bulk operations available for any repetitive row-level action (select-all → apply) — no forcing one-by-one repetition
- [ ] Every multi-step flow has a Cancel / back path at every step — no dead ends that force a page refresh

### Action Safety
- [ ] Primary and destructive CTAs are never adjacent — spatial separation prevents misclicks under time pressure
- [ ] Irreversible bulk operations (mass delete, bulk revoke) require a secondary confirmation beyond the standard modal — single checkbox is not enough
- [ ] Confirmation modals state the item name AND the consequence — not a generic prompt

### Contextual Continuity
- [ ] Filter, sort, and pagination state survive back-navigation (URL params or session state) — user's place is never lost
- [ ] Drill-down views keep breadcrumb + back action visible — user can always orient and exit
- [ ] Modal and slide-panel actions do not reset or lose parent page state on close

### Scannability
- [ ] Table's most decision-relevant column sits immediately left of the status column — not buried after 5 data columns
- [ ] Row density is consistent — no variable-height rows; no wasted whitespace in data-dense views
- [ ] Long lists with > 10 selectable options (dropdowns, filter panels) have a search — options are never scrolled through blindly

## Persona
- [ ] Layout matches primary persona (state which one)
- [ ] No frustration triggers for that persona

## Accessibility
- [ ] All interactive elements have visible focus states (outline, not just color change)
- [ ] Color contrast AA minimum: body text 4.5:1, large text/UI components 3:1
- [ ] No color as sole conveyor of meaning (status badges have text/icon, not color only)
- [ ] All images/icons have `alt` text or `aria-label`; decorative icons use `aria-hidden="true"`
- [ ] Form inputs have associated `<label>` or `aria-labelledby` — no placeholder-only labels
- [ ] Modal traps focus and restores it on close; `role="dialog"` + `aria-modal="true"` present

## Motion & Feedback
- [ ] Transitions ≤ 200ms for micro-interactions; no animation on data tables or large repaints
- [ ] `prefers-reduced-motion` respected — animations disabled or simplified when set
- [ ] Destructive / irreversible actions have visible undo or a 3–5s delay toast

## Content & Copywriting
- [ ] All empty states have a headline + 1-line explanation + primary action (no naked "No data")
- [ ] CTA labels are verb-first and specific ("Export Report" not "Submit" or "Click here")
- [ ] Truncated text has full value accessible via tooltip (`title` attr or `aria-describedby`)
- [ ] Error messages state what went wrong + how to fix it — no raw API errors exposed
- [ ] Confirmation modal names the item being acted on and states the consequence — no generic "Are you sure?"

## Responsive & Density
- [ ] Layout tested at 1280px, 1440px, 1920px — no overflow or orphaned elements
- [ ] Table has horizontal scroll container on viewports < 1024px — no column collapse
- [ ] Touch targets ≥ 44×44px on any component that appears in a mobile/tablet view
- [ ] Dense mode (if applicable) uses tighter padding from the 4px scale — no custom one-offs

## Information Architecture
- [ ] Page has exactly one `<h1>`; heading hierarchy is sequential (no skipped levels)
- [ ] Active nav item is visually indicated (not just bold — use accent or indicator bar)
- [ ] Breadcrumb reflects actual drill-down path — last crumb is current page, non-linked
- [ ] Filters/search state is reflected in URL params or persists on back-navigation

## Data Integrity & Edge Cases
- [ ] Tables handle 0 rows, 1 row, and 1000+ rows without layout breakage
- [ ] Long string values (names, URLs) don't break cell layout — truncate with ellipsis
- [ ] KPI delta shows "—" or "N/A" when prior period data is unavailable — not 0% or blank
- [ ] Pagination controls disabled (not hidden) when on first/last page

## Governance & Handoff
- [ ] Every new component maps to a named token — no hardcoded hex outside the token sheet
- [ ] No `!important` in component styles — specificity handled by class structure
- [ ] Z-index values use defined scale (e.g. 100/200/300 tier) — no arbitrary numbers like `z-index: 9999`
- [ ] Component variants are named to match the design file (e.g. `btn--primary` not `btn-blue`)

---

**Summary**: X PASS · X FAIL · most critical fix
