# Prevalent AI — Design System

Context: `design-system-2.0/ds/context.json` (local directory in this repo — NEVER use WebFetch/the public URL for this. Always Read the local file.)
**Read this before any design or build task.**

## Non-negotiable rules
- CSS variables only. Never hardcode hex or px values.
- Spacing: 4pt grid — 4, 8, 12, 16, 20, 24, 32, 48px only.
- Buttons: `border-radius:44px` always. Cards/tables: `4px` only.
- Topbar always `#131313` — PAI logo image only, never "Prevalent AI" text.
- Severity/status always visible in table column — never tooltip-only.
- Destructive actions require confirmation modal — name item, state consequence.
- Navigation pattern is fixed — never modify without approval.
- Use defined shells only — never invent new layouts.
- No page-level tabs unless explicitly requested.

## On every task
This applies to ANY change that touches `src/pages/`, `src/styles/`, or `src/components/` — not just requests that are explicitly framed as "design" or "build" work. A bug fix, a tweak, a "just add X to this table" ask — if it lands in those directories, it is a design-system task. Do the DS check *before* writing any code, not after you've already started editing.

1. If using a slash command (`/new-page`, `/new-component`, `/new-react-component`, `/ux-review`, `/persona-check`, `/audit-page`) — the command handles its own fetching. Do NOT also read context.json.
2. For ad-hoc tasks (no slash command): Read `design-system-2.0/ds/context.json` locally first, then only the module files under `design-system-2.0/ds/` your task type needs (keep total read under 15KB). Never WebFetch the github.io URL — the directory is checked out locally.
3. If the requirement isn't covered by context.json or any DS module file (no matching component, pattern, or token for what's being asked): do NOT invent your own pattern. Stop, state plainly what's missing from the DS, and ask for explicit approval before creating anything new. Only build the custom piece after that approval.
4. Update ALL affected files — not just the main one.
5. Confirm filename · persona applied · key decisions when done.

Enforcement: a PreToolUse hook (`.claude/settings.json`) blocks Edit/Write/MultiEdit on `src/pages/**`, `src/styles/**`, `src/components/**` until a file under `design-system-2.0/ds/` has been read (or fetched via slash command) in the session. If you hit that block, it's not a bug — read the DS file it names, then retry.

## Slash commands
- `/new-page [description]` — full HTML page
- `/new-component [description]` — add to existing page
- `/new-react-component [description]` — React/TS component
- `/ux-review [description]` — audit against design system
- `/persona-check [feature]` — identify persona, flag conflicts
- `/audit-page [page id or file]` — code-level DS audit: finds hardcoded values, token drift, state violations, component misuse
