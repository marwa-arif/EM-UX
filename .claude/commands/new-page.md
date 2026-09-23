Read these local files before doing anything else (never WebFetch — this directory is checked out locally in this repo):
1. design-system-2.0/ds/rules.json
2. design-system-2.0/ds/tokens/colors.json
3. design-system-2.0/ds/tokens/spacing.json
4. design-system-2.0/ds/tokens/typography.json
5. design-system-2.0/ds/patterns/navigation.json
6. design-system-2.0/ds/components/buttons.json
7. design-system-2.0/ds/components/tables.json
8. design-system-2.0/ds/components/badges.json
9. design-system-2.0/ds/components/modals.json
10. design-system-2.0/ds/page-spec.md

Then read $ARGUMENTS (or ask "What is this page called and who is its primary user?" if empty) and read only what the page needs:
- Cards on page → read design-system-2.0/ds/components/cards.json
- Charts on page → read design-system-2.0/ds/charts/base.json PLUS only the chart types needed:
    Bar chart → design-system-2.0/ds/charts/bar.json
    Line chart → design-system-2.0/ds/charts/line.json
    Multi-line chart → design-system-2.0/ds/charts/multiline.json
    Donut chart → design-system-2.0/ds/charts/donut.json
    Horizontal bar → design-system-2.0/ds/charts/hbar.json
    Stacked bar → design-system-2.0/ds/charts/stacked.json
- Forms / inputs / dropdowns / toggles on page → read design-system-2.0/ds/components/inputs.json
- Three-panel layout or auth shell → read design-system-2.0/ds/patterns/shells.json
- Toasts / callouts / error states on page → read design-system-2.0/ds/components/feedback.json
- Tabs on page → read design-system-2.0/ds/components/tabs.json
- Tooltip / accordion / progress / steps / avatar / skeleton on page → read design-system-2.0/ds/components/utilities.json
- Detail drawer (row-click asset detail panel) on page → read design-system-2.0/ds/components/drawer.json
- Filter popup (multi-entity filter builder) on page → read design-system-2.0/ds/components/filters.json

Do not read files for components the page does not need.

BUILD CHECKLIST — complete every item in order:

[ ] 1. PERSONA — infer from request, apply layout:
       ciso → trend charts, 1 dominant CTA — KPI cards ONLY if explicitly requested
       grc → Compliance table, control status visible, export button
       security-architect → CVSSv3 scores, technical detail, asset context
       security-engineer → Dense CVE table, bulk toolbar, SLA column, pagination
       soc-analyst → Alert queue first, severity sorted, quick row actions on hover
       NOTE: Never add KPI cards unless the user explicitly asks for them.

[ ] 2. SHELL — copy the complete shell HTML from page-spec.md VERBATIM.
       Copy the ENTIRE <style> block — do not skip or shorten any CSS.
       Copy the ENTIRE <script> block — do not skip or shorten any JS.
       Only replace: page <title>, nav SVG icons, breadcrumb + sub-header text, page content slot.

[ ] 3. TOKENS — use only values from tokens/colors.json, tokens/spacing.json, tokens/typography.json.
       CSS variables only — zero hardcoded hex or px values anywhere.
       Spacing: 4pt grid only — 4, 8, 12, 16, 20, 24, 32, 48px. Any other value is a bug.

[ ] 4. TOPBAR — PAI logo <img> only (height:26px). Never "Prevalent AI" text. Navigator button class="ds-btn sz-sm t-special".

[ ] 5. LEFT NAV — must include:
       - id="shell-nav" on the nav element
       - id="shell-nav-btn" on the toggle button
       - shellNavToggle() JS function from page-spec.md — never remove or rewrite.

[ ] 6. SUB-HEADER — exactly TWO lines:
       Line 1: page title <div style="font-size:12px;font-weight:500"> — NEVER <h1>
       Line 2: breadcrumb <div style="font-size:11px"> — last crumb color:#6360D8
       Never merge into one line.

[ ] 7. CHARTS (only if page has charts) — read design-system-2.0/ds/charts/base.json + only the chart type files needed (not all of them).
       Copy each function VERBATIM from the files already read.
       Add <div id="chart-tooltip"> at end of <body>.
       Copy showChartTooltip, positionChartTooltip, hideChartTooltip from ds/charts/base.json verbatim.
       Init: document.addEventListener('DOMContentLoaded', function() { setTimeout(initCharts, 60); });

[ ] 8. COMPONENTS — use exact HTML patterns from the component JSONs already read.
       Buttons: class names and border-radius:44px from components/buttons.json.
       Cards: border-radius:4px only, patterns from components/cards.json.
       Tables: column order, row-actions, badge placement from components/tables.json.
       Badges: exact class names from components/badges.json.
       Inputs: exact patterns from components/inputs.json.
       Modals: Cancel left (t-outline), Confirm right (t-primary or t-danger) from components/modals.json.

[ ] 9. TABLE INTERACTIONS — use visibility, not display, to hide row actions:
       .row-actions { display:flex; visibility:hidden; gap:4px; }
       tr:hover .row-actions { visibility:visible; }
       NEVER display:none on .row-actions — it causes row height to jump on hover.
       NEVER style="display:flex" inline. Status badge and actions in separate <td> always.
       Severity always visible in table column — never tooltip-only.

[ ] 10. FILTER BAR — Filter button: background:#e0dff7; color:#504bb8; border-radius:44px.
        Active filter chips: .ds-filter-chip > .ds-chip-key + .ds-chip-value + .ds-chip-close.

[ ] 11. TOASTS (only if page has toasts) — success/info: auto-dismiss after 3s. error/warning: persist until dismissed.
        Class pattern: class="ds-toast success" — space-separated, never "ds-toast-success".

[ ] 12. ALL INTERACTIVE ELEMENTS — every button, input, row, tab must have hover, active, focus, disabled states.

[ ] 13. DESTRUCTIVE ACTIONS — any delete/remove must trigger a confirmation modal.
        Modal must name the item being deleted and state the consequence. Confirm button uses t-danger.

After completing all items, output:
"Done. Created: [filename]. Persona: [persona]. Working: nav-toggle · chart-tooltips · row-actions · filters · toasts."

Do not finish until every checklist item is complete.
