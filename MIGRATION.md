# Migration Plan: CDN/Babel → Vite + React

## Context
The project currently loads React via unpkg CDN, transpiles JSX with Babel standalone in the browser, and shares components through `window.*` globals. Goal: convert to a proper Vite + React ES-module project with no CDN dependencies and no `window.*` component exports.

---

## Step 1 — Tooling setup

**`package.json`** — replace `serve` with Vite + React plugin:
```json
{
  "scripts": { "dev": "vite", "build": "vite build", "preview": "vite preview" },
  "devDependencies": { "vite": "^5.4.0", "@vitejs/plugin-react": "^4.3.0" },
  "dependencies": { "react": "^18.3.1", "react-dom": "^18.3.1" }
}
```

**`vite.config.js`** (new file):
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({ plugins: [react()] })
```

**`index.html`** — remove all CDN `<script>` tags and Babel standalone; replace the last script block with:
```html
<script type="module" src="/main.jsx"></script>
```

---

## Step 2 — Create entry point

**`main.jsx`** (new file):
```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
ReactDOM.createRoot(document.getElementById('root')).render(<App />)
```

Remove the `ReactDOM.createRoot(...)` call from the bottom of `App.jsx`.

---

## Step 3 — Convert `ui.jsx`

- Add: `import React, { useState } from 'react'`
- Remove all `window.XXX = ...` assignments (9 exports)
- Add named exports: `export { PAI, Button, IconBtn, Chip, DualToggle, KPI, Input, Ic, Icons }`

---

## Step 4 — Convert `tweaks-panel.jsx`

- Add: `import React, { useState } from 'react'`
- Remove all `window.XXX = ...` assignments (12 exports)
- Add named exports: `export { useTweaks, TweaksPanel, TweakSection, TweakRow, TweakSlider, TweakToggle, TweakRadio, TweakSelect, TweakText, TweakNumber, TweakColor, TweakButton }`
- Keep `window.parent.postMessage(...)` calls intact (cross-frame communication with workspace.html)

---

## Step 5 — Convert `WorkspaceCtx.jsx`

- Add: `import React, { useState, useCallback, useContext, createContext } from 'react'`
- Remove `window.XXX = ...` assignments
- Add exports: `export { DSPillSearch, LibraryIcon, SavedIcon, WorkspaceProvider, useWorkspace }`
- **`DSPillSearch` lives here as the canonical source** — remove duplicate copies in `PageKG.jsx` and `FilterPanel.jsx` and import from here instead

---

## Step 6 — Convert `Topbar.jsx`

- Add: `import React from 'react'`
- Add: `import { Icons } from './ui.jsx'`
- Remove: `window.Topbar = Topbar`
- Add: `export default Topbar`

---

## Step 7 — Convert `LeftNav.jsx`

- Add: `import React, { useState } from 'react'` (replaces `const { useState: useStateLN } = React`)
- Add: `import { PAI, Ic } from './ui.jsx'`
- Remove: `window.LeftNav = LeftNav`
- Add: `export default LeftNav`

---

## Step 8 — Convert `SubHeader.jsx`

- Add: `import React, { useState, useRef, useEffect } from 'react'` (replaces aliased destructuring)
- Add: `import { PAI, Ic } from './ui.jsx'`
- Remove: `window.SubHeader = SubHeader`
- Add: `export default SubHeader`

---

## Step 9 — Convert `FilterPanel.jsx`

- Add: `import React, { useState, useRef, useEffect } from 'react'` (replaces aliased destructuring)
- Add: `import { PAI, Ic } from './ui.jsx'`
- Add: `import { DSPillSearch } from './WorkspaceCtx.jsx'` (remove inline duplicate)
- Remove: `window.FilterPanel = FilterPanel`, `window.GraphFilterDrawer = GraphFilterDrawer`
- Add: `export { FilterPanel, GraphFilterDrawer }`

---

## Step 10 — Convert `PageKG.jsx`

- Add: `import React, { useState, useMemo, useRef, useEffect } from 'react'` (replaces aliased destructuring)
- Add: `import { PAI, Icons } from './ui.jsx'`
- Add: `import { DSPillSearch } from './WorkspaceCtx.jsx'` (remove inline duplicate)
- Remove: `window.PageKG = PageKG`, `window.SegmentedTabs = SegmentedTabs`, `window.DSPillSearch = DSPillSearch`
- Add: `export { PageKG, SegmentedTabs }`
- **Keep intact** (intentional cross-component API):
  - `window.__kgSetEdges`, `window.__kgGetEdges`, `window.__kgEntityList`
  - `window.__floatTweaks` reads (per-frame animation, avoids re-renders intentionally)
  - `kg-edges-changed` custom event

---

## Step 11 — Convert `App.jsx`

- Add imports for all components:
  ```js
  import React, { useState, useEffect, useRef } from 'react'
  import Topbar from './Topbar.jsx'
  import LeftNav from './LeftNav.jsx'
  import SubHeader from './SubHeader.jsx'
  import { PageKG } from './PageKG.jsx'
  import { FilterPanel, GraphFilterDrawer } from './FilterPanel.jsx'
  import { useTweaks, TweaksPanel, TweakSection, TweakSlider, TweakToggle } from './tweaks-panel.jsx'
  import { PAI } from './ui.jsx'
  ```
- Remove all aliased hook destructuring (`useS`, `useE`, `useR` → standard names)
- Replace `const GFDrawer = window.GraphFilterDrawer` with direct use of imported `GraphFilterDrawer`
- Remove `ReactDOM.createRoot(...)` call at bottom (moved to main.jsx)

---

## Files touched summary

| File | Action |
|---|---|
| `package.json` | Update scripts + deps |
| `vite.config.js` | Create new |
| `index.html` | Remove CDN scripts, add module entry |
| `main.jsx` | Create new (entry point) |
| `ui.jsx` | Add import, replace window exports with named exports |
| `tweaks-panel.jsx` | Add import, replace window exports with named exports |
| `WorkspaceCtx.jsx` | Add import, replace window exports, canonical DSPillSearch |
| `Topbar.jsx` | Add imports, export default |
| `LeftNav.jsx` | Add imports, export default |
| `SubHeader.jsx` | Add imports, export default |
| `FilterPanel.jsx` | Add imports, remove DSPillSearch dup, named exports |
| `PageKG.jsx` | Add imports, remove DSPillSearch dup, named exports, keep window.__kg* |
| `App.jsx` | Add all imports, clean up hook aliases, remove ReactDOM call |

**Not changed:** `workspace.html`, `colors_and_type.css`, `assets/`

---

## Verification

1. `npm install` — installs vite + @vitejs/plugin-react + react + react-dom
2. `npm run dev` — Vite starts with no errors
3. Open `http://localhost:5173` — KG page renders, graph animates, filter panel opens/closes
4. Tweaks panel opens and float animation params apply
5. Edge editor: add/remove/save edges — `window.__kg*` bridge still works
6. `npm run build` — builds with no errors
