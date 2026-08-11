import React, { useEffect, useRef, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import TablePagination from './TablePagination.jsx';
import '../styles/drawer.css';

export const IcDrawerClose = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
    <line x1="1" y1="1" x2="9" y2="9"/><line x1="9" y1="1" x2="1" y2="9"/>
  </svg>
);

const IcRefresh = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
  </svg>
);
const IcDownload = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
const IcChevronDown = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6"/>
  </svg>
);

// Deterministic color for a mock field value with no dedicated palette of its own — same value
// always gets the same color within a session, without needing a hand-authored mapping.
export function fieldColor(value) {
  if (value === 'true') return 'var(--pai-low-fg)';
  if (value === 'false') return 'var(--pai-crit-fg)';
  const known = { Critical: 'var(--pai-crit-fg)', High: 'var(--pai-high-fg)', Medium: 'var(--pai-med-fg)', Low: 'var(--pai-low-fg)' };
  if (known[value]) return known[value];
  if (value === '' || value == null) return 'var(--shell-text-muted)';
  const palette = ['#2E84D4', '#6360D8', '#31A56D', '#D98B1D', '#66329C', '#0EA5A5'];
  let h = 0;
  for (const ch of String(value)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return palette[h % palette.length];
}

export function groupCounts(rows, field) {
  const m = new Map();
  rows.forEach(r => m.set(r[field], (m.get(r[field]) || 0) + 1));
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

function MiniRing({ title, segments }) {
  const total = segments.reduce((s, x) => s + x.count, 0);
  const pieData = segments.map(s => ({ ...s, value: s.count === 0 ? 0.001 : s.count }));
  return (
    <div className="fin-ring-block">
      <div className="fin-ring-block-title">{title}</div>
      <div className="fin-ring-row">
        <div className="kg-dp-ring-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="label" cx="50%" cy="50%" innerRadius="68%" outerRadius="90%" startAngle={90} endAngle={450} cornerRadius={4} strokeWidth={0}>
                {pieData.map((seg, i) => <Cell key={i} fill={seg.color} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="kg-dp-ring-num">{total}</div>
        </div>
        <div className="fin-ring-legend">
          {segments.map((s, i) => (
            <div key={i} className="kg-dp-ring-value"><span className="kg-dp-ring-dot" style={{ background: s.color }} />{s.label}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

// A leaf's "opened" view — a Recharts-style pie-chart summary of one or more fields, plus the
// full relationship table beneath it. Clicking a row is what actually drills down (via
// onRowClick) — clicking the leaf itself only reveals this section, matching the reference
// (FindingsPage) drawer's two-step interaction so every drawer's leaves behave the same way.
export function RelNodeSection({ title, data, onRowClick, renderCell = (col, val) => String(val) }) {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const visible = data.rows.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  return (
    <div className="kg-dp-section">
      <div className="kg-dp-section-header kg-dp-section-header--flex">
        <span>{title} Summary</span>
        <button className="comp-drawer-action-icon" title="Refresh"><IcRefresh /></button>
      </div>
      <div className="fin-ring-summary">
        {data.rings.map(r => <MiniRing key={r.title} title={r.title} segments={r.segments} />)}
      </div>
      <div className="kg-dp-section-header kg-dp-section-header--flex">
        <span>Relationship Summary ({data.rows.length})</span>
        <button className="ds-btn sz-sm t-primary"><IcDownload /> Download <IcChevronDown /></button>
      </div>
      <div className="ds-table-wrap">
        <table className="ds-table">
          <thead>
            <tr>{data.columns.map(c => <th key={c} className="ds-th">{c}</th>)}</tr>
          </thead>
          <tbody>
            {visible.map((r, i) => (
              <tr key={i} className={onRowClick ? 'kg-tr kg-tr--clickable' : undefined} onClick={onRowClick ? () => onRowClick(r, (page - 1) * rowsPerPage + i) : undefined}>
                {data.columns.map(c => {
                  const val = renderCell(c, r[c]);
                  return (
                    <td key={c} className="ds-td">
                      {c === 'Display Label' && onRowClick ? <span className="fin-rel-row-link">{val}</span> : val}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TablePagination
        total={data.rows.length}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={setPage}
        onRowsPerPageChange={n => { setRowsPerPage(n); setPage(1); }}
      />
    </div>
  );
}

// Shared drawer chrome (backdrop, close button, sliding panel) mounted once per drawer
// session — swapping `children` on navigation just replaces content in place, it never
// remounts this shell, so only the very first open animates in.
export function DrawerShell({ children, onClose, closing, stacked = false }) {
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <>
      {/* Called as onClose() with no args — never pass the native click event through, since
          consumers wire this to useDrawerNav's close(onClosed), and a stray event object would
          get invoked as onClosed(). */}
      <div className="comp-drawer-backdrop" onClick={() => onClose()} />
      <button className={`comp-drawer-close-ext${stacked ? ' comp-drawer-close-ext--stacked' : ''}`} onClick={() => onClose()}><IcDrawerClose /></button>
      <div className={`comp-drawer${stacked ? ' comp-drawer--stacked' : ''}${closing ? ' comp-drawer--closing' : ''}`}>
        {children}
      </div>
    </>
  );
}

// Breadcrumb rail for a drilled-into drawer stack — one icon per level, oldest at top,
// current (last) highlighted; clicking an earlier icon pops back to that level. `describe(item)`
// maps a page-specific trail item to {icon, label, typeLabel, color?} so this component never
// needs to know any one page's `kind` vocabulary — every page brings its own trail-item shape.
// `color` is that entity's own accent color (falls back to indigo) — the active/"you are here"
// node renders a bold ring in that color, so the trail reads as "this specific entity is where
// you are," not just a generic indigo highlight shared by every entity type.
export function HeaderIconStack({ history, activeIndex, onNavigate, describe }) {
  const order = history.map((_, i) => i).reverse(); // [newest, ..., oldest]
  return (
    <div className="kg-dp-icon-stack">
      {order.map((i, pos) => {
        const item = history[i];
        const d = describe(item);
        const isActive = i === activeIndex;
        return (
          <React.Fragment key={i}>
            {pos > 0 && (
              <span className="kg-dp-icon-stack-line">
                <span
                  className="kg-dp-icon-stack-rel-dot"
                  data-tooltip={`${d.typeLabel} has ${describe(history[order[pos - 1]]).typeLabel}`}
                />
              </span>
            )}
            <button
              className={`kg-dp-icon-stack-node${isActive ? ' kg-dp-icon-stack-node--active' : ''}`}
              style={isActive ? { '--icon-stack-active-color': d.color || 'var(--pai-indigo)' } : undefined}
              onClick={() => !isActive && onNavigate(i)}
              disabled={isActive}
              title={d.label}
            >
              {d.icon}
            </button>
          </React.Fragment>
        );
      })}
      {/* Trailing line under the oldest/root node — always reaches the bottom of the rail, so
          the trail reads as a continuous path even before any drill-down has happened. */}
      <span className="kg-dp-icon-stack-line kg-dp-icon-stack-line--tail" />
    </div>
  );
}

// Icon rail (left) + scrollable content (right) — keeps the path trail from pushing the
// header/tabs/body content down as it grows; the two scroll independently.
export function DrawerLayout({ trail, activeIndex, onNavigateTrail, describe, children }) {
  return (
    <div className="kg-dp-layout">
      <div className="kg-dp-icon-rail">
        <HeaderIconStack history={trail} activeIndex={activeIndex} onNavigate={onNavigateTrail} describe={describe} />
      </div>
      <div className="kg-dp-main">
        {children}
      </div>
    </div>
  );
}

// Generic detail content for a leaf record that has no dedicated entity type of its own —
// renders whatever fields the caller supplies, so every relationship-graph leaf has somewhere
// to go, not just the ones with a fully modeled entity type. `record` is normalized by the
// caller to `{ label, chipText, fields: [key, value][] }` since every page's own mock data
// shape differs (tuple arrays, key/value objects, etc.).
export function RecordDetailContent({ record, trail, activeIndex, onNavigateTrail, describe }) {
  return (
    <DrawerLayout trail={trail} activeIndex={activeIndex} onNavigateTrail={onNavigateTrail} describe={describe}>
      <div className="kg-dp-header">
        <div className="kg-dp-title-row">
          <div className="kg-dp-title-body">
            <div className="kg-dp-name-row">
              <span className="kg-dp-name">{record.label}</span>
              <span className="kg-dp-type-chip">{record.chipText}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="kg-dp-body">
        <div className="kg-dp-section">
          <div className="kg-dp-section-header">General Information</div>
          <div className="kg-dp-grid">
            {record.fields.map(([k, v]) => (
              <div key={k} className="kg-dp-grid-cell">
                <div className="kg-dp-grid-key">{k}</div>
                <div className="kg-dp-grid-val">{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DrawerLayout>
  );
}

// Drawer navigation state machine — { history: item[], index }. `index` points at the
// currently-shown entry; jumping to an earlier entry (goToIndex) only moves the pointer, it
// never drops later entries — the trail only shrinks when the drawer fully closes.
//
// Pass `rootItem` for drawers that open/close by mounting/unmounting (AssetDetailDrawer-style —
// the trail is seeded immediately from props). Leave it undefined for a persistent-shell drawer
// that stays mounted across many open/close cycles (FindingsPage-style) and calls `open(item)`
// itself whenever a new item is clicked.
export function useDrawerNav(rootItem) {
  const [nav, setNav] = useState(() => (
    rootItem ? { history: [rootItem], index: 0 } : { history: [], index: -1 }
  ));
  const [closing, setClosing] = useState(false);
  const genRef = useRef(0);
  const closeTimerRef = useRef(null);

  const open = item => {
    genRef.current += 1;
    if (closeTimerRef.current) { clearTimeout(closeTimerRef.current); closeTimerRef.current = null; }
    setClosing(false);
    setNav({ history: [item], index: 0 });
  };
  const navigate = item => setNav(({ history, index }) => ({ history: [...history.slice(0, index + 1), item], index: index + 1 }));
  const goToIndex = i => setNav(n => ({ ...n, index: i }));
  // `onClosed` fires after the 180ms slide-out — guarded by a generation counter so a stale
  // timeout from a previous close can't wipe out a drawer that was reopened in the meantime.
  const close = onClosed => {
    const gen = genRef.current;
    setClosing(true);
    closeTimerRef.current = setTimeout(() => {
      if (gen !== genRef.current) return;
      setClosing(false);
      setNav({ history: [], index: -1 });
      closeTimerRef.current = null;
      if (typeof onClosed === 'function') onClosed();
    }, 180);
  };

  return { history: nav.history, index: nav.index, closing, open, navigate, goToIndex, close };
}
