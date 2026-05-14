Fetch these files first:
1. https://anthu211.github.io/design-system-2.0/ds/tokens/colors.json
2. https://anthu211.github.io/design-system-2.0/ds/tokens/spacing.json

Then read $ARGUMENTS and fetch only what is needed:
- Table/list → tables.json + badges.json
- Form/input → inputs.json + modals.json
- Button/action → buttons.json
- Card/KPI → cards.json
- Chart → fetch https://anthu211.github.io/design-system-2.0/ds/charts/base.txt + only the chart type file needed:
    bar=ds/charts/bar.txt · line=ds/charts/line.txt · multiline=ds/charts/multiline.txt · donut=ds/charts/donut.txt · hbar=ds/charts/hbar.txt · stacked=ds/charts/stacked.txt
- Modal/dialog → modals.json
- Badge/status → badges.json
- Toast/alert → feedback.json
- Detail drawer (row-click asset/entity detail panel) → drawer.json
- Filter popup (multi-entity filter builder) → filters.json

All JSON base URL: https://anthu211.github.io/design-system-2.0/ds/components/

Do not fetch files for components not in the request.

The user's request is: $ARGUMENTS

If $ARGUMENTS is empty, ask: "What component? Which file? What variants does it need?"
Wait for the answer. Then read the target HTML file in full before making any changes.

## Design Rules (apply without fetching ds/core.txt)
- Colors: CSS variables only — never hardcode hex (use values from colors.json)
- Spacing: 4pt grid — 4, 8, 12, 16, 20, 24, 32, 48px only. Any other value is a bug.
- Buttons: `border-radius:44px`. Cards/table-wrappers: `border-radius:4px`.
- Row actions: `visibility:hidden` default, `visibility:visible` on `tr:hover` — NEVER `display:none`
- Status/severity: always visible in column — never tooltip-only
- Actions and status badge in separate `<td>` — never same cell
- Modals: Cancel left (t-outline), Confirm right (t-primary or t-danger for destructive)
- KPI cards: value + label + delta only — no icons, no colored borders, no box-shadow
- Destructive actions: confirmation modal naming the item and stating the consequence
- No page-level tabs unless explicitly requested

## Build Checklist

[ ] 1. READ TARGET FILE — read the full HTML file first. Match its CSS variable names, class names, JS structure exactly.

[ ] 2. HTML — add in the correct DOM location only. Use exact patterns from the fetched component JSON.

[ ] 3. CSS — add into the existing `<style>` block only. CSS variables only, 4pt spacing only.

[ ] 4. JS — add into the existing `<script>` block only.

[ ] 5. ALL STATES — every interactive element must have: hover, active, focus, disabled.

[ ] 6. CHARTS (only if adding a chart) — fetch ds/charts/base.txt + the specific chart type file only. Copy function VERBATIM. Ensure `<div id="chart-tooltip">` exists. Ensure showChartTooltip, positionChartTooltip, hideChartTooltip are present. Wrap init in `setTimeout(fn, 60)`.

[ ] 7. VERIFY HARD RULES — check all design rules above are met.

Output: "Done. Added: [component]. File: [filename]. States: [list]. Interactions working: [list]."
