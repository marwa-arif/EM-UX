// PageKG — Knowledge Graph view.
// Layout: Summary card (top, with view toggle + node search), graph canvas (SVG),
// then the filtered Details table.

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { PAI, Icons, Ic } from '../ui.jsx';
import TablePagination from '../components/TablePagination.jsx';
import EntityRelSummaryGraph from '../components/EntityRelSummaryGraph.jsx';

function useDark() {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('theme-dark'));
  useEffect(() => {
    const obs = new MutationObserver(() => setIsDark(document.documentElement.classList.contains('theme-dark')));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return isDark;
}

// ─────────────────────────────────────────────────────────────────────
// Entity type catalog — colors + icon glyph (drawn inline, no SVG file)
// Colors are muted/desaturated chip-tints matching the screenshot.
// ─────────────────────────────────────────────────────────────────────
const ENTITY_TYPES = {
  account:        { label: 'Account',           tint: '#F1ECF9', stroke: '#D3C3EC', tintDark: '#1E1228', strokeDark: '#3D2558', icon: '#9269CF', count: 15301,    fragments: 15349,    group: 'identity', glyph: 'account' },
  identity:       { label: 'Identity',          tint: '#F4E6F9', stroke: '#DCB3ED', tintDark: '#22102E', strokeDark: '#4D1E68', icon: '#A842D2', count: 71442,    fragments: 146922,   group: 'identity', glyph: 'identity' },
  group:          { label: 'Group',             tint: '#E3F6F7', stroke: '#A9E5E7', tintDark: '#0D2A2B', strokeDark: '#1A5254', icon: '#27BDC2', count: 2,        fragments: 2,        group: 'identity', glyph: 'group' },
  person:         { label: 'Person',            tint: '#E4EDF1', stroke: '#ABC8D3', tintDark: '#0E1F28', strokeDark: '#1D3E50', icon: '#2E7690', count: 304,      fragments: 1016,     group: 'identity', glyph: 'person' },
  application:    { label: 'Application',       tint: '#F4EEE6', stroke: '#DECCB1', tintDark: '#261B0D', strokeDark: '#4E381A', icon: '#AD803D', count: 4376,     fragments: 42717,    group: 'cloud',    glyph: 'application' },
  vulnerability:  { label: 'Vulnerability',     tint: '#F4E9E9', stroke: '#DFBCBC', tintDark: '#261313', strokeDark: '#4E2626', icon: '#AE5757', count: 55230,    fragments: 311397,   group: 'host',     glyph: 'vulnerability' },
  assessment:     { label: 'Assessment',        tint: '#F4ECE5', stroke: '#DEC4AF', tintDark: '#241808', strokeDark: '#4A3018', icon: '#AC6C36', count: 497,      fragments: 497,      group: 'host',     glyph: 'assessment' },
  cluster:        { label: 'Cluster',           tint: '#E5E5F5', stroke: '#AEAEE1', tintDark: '#0D0D28', strokeDark: '#1A1A50', icon: '#3434B4', count: 231,      fragments: 231,      group: 'cloud',    glyph: 'cluster' },
  container:      { label: 'Container',         tint: '#EBE4F2', stroke: '#C2ADD7', tintDark: '#180C24', strokeDark: '#321848', icon: '#66329C', count: 358,      fragments: 358,      group: 'cloud',    glyph: 'container' },
  cloudAccount:   { label: 'Cloud Account',     tint: '#E6E7F5', stroke: '#B1B4DF', tintDark: '#0D1028', strokeDark: '#1A2050', icon: '#3B43B0', count: 15,       fragments: 15,       group: 'cloud',    glyph: 'cloud' },
  finding:        { label: 'Finding',           tint: '#E9E4F6', stroke: '#BCABE4', tintDark: '#130A2A', strokeDark: '#281455', icon: '#582DBB', count: 15518350, fragments: 15518350, group: 'host',     glyph: 'finding', primary: true },
  ticket:         { label: 'Ticket',            tint: '#E6F6F4', stroke: '#B1E3DE', tintDark: '#0D2A27', strokeDark: '#1A524E', icon: '#3DBAAD', count: 10,       fragments: 10,       group: 'host',     glyph: 'ticket' },
  host:           { label: 'Host',              tint: '#E3E9F1', stroke: '#AABBD3', tintDark: '#0A1520', strokeDark: '#163060', icon: '#2B5690', count: 58687,    fragments: 225709,   group: 'host',     glyph: 'host' },
  network:        { label: 'Network',           tint: '#DEF0EA', stroke: '#99D0BF', tintDark: '#0A2018', strokeDark: '#143E30', icon: '#00895E', count: 77,       fragments: 77,       group: 'cloud',    glyph: 'network' },
  netSvc:         { label: 'Network Services',  tint: '#F0F4E4', stroke: '#D0DCAD', tintDark: '#1C230D', strokeDark: '#38461A', icon: '#89A833', count: 253,      fragments: 253,      group: 'cloud',    glyph: 'netsvc' },
  netIface:       { label: 'Network Interface', tint: '#F6E6F0', stroke: '#E3B1D1', tintDark: '#280D1E', strokeDark: '#50183A', icon: '#BA3D8C', count: 3303,     fragments: 3303,     group: 'cloud',    glyph: 'netiface' },
  storage:        { label: 'Storage',           tint: '#E5F1F7', stroke: '#B0D5E7', tintDark: '#0C2030', strokeDark: '#184060', icon: '#3A96C4', count: 5541,     fragments: 5541,     group: 'cloud',    glyph: 'storage' },
};

// Node positions — calibrated against a 940×420 canvas to match reference.
// Layout: finding at center, all other entities arranged ALPHABETICALLY
// by display label around an ellipse — starting just left of top with
// Account, sweeping clockwise back to Vulnerability.
const NODE_POS = (() => {
  const cx = 470, cy = 220, rx = 400, ry = 162;
  const order = [
    'account',       // Account
    'application',   // Application
    'assessment',    // Assessment
    'cloudAccount',  // Cloud Account
    'cluster',       // Cluster
    'container',     // Container
    'group',         // Group
    'host',          // Host
    'identity',      // Identity
    'network',       // Network
    'netIface',      // Network Interface
    'netSvc',        // Network Services
    'person',        // Person
    'storage',       // Storage
    'ticket',        // Ticket
    'vulnerability', // Vulnerability
  ];
  const N = order.length;
  const pos = { finding: { x: cx, y: cy } };
  // Start at the top (-π/2) and sweep clockwise. Bias the first slot a
  // touch left of dead-top so Account reads as the start of the ring,
  // matching the reference.
  const start = -Math.PI / 2 - (Math.PI / N);
  for (let i = 0; i < N; i++) {
    const t = start + (i / N) * 2 * Math.PI;
    pos[order[i]] = {
      x: Math.round(cx + rx * Math.cos(t)),
      y: Math.round(cy + ry * Math.sin(t)),
    };
  }
  return pos;
})();

// Edges — [src, tgt, label, hidden?, srcAlias?, tgtAlias?]
const INITIAL_EDGES = [
  ['account', 'identity', 'Associated with'],
  ['account', 'finding', 'Has'],
  ['application', 'host', 'Running on'],
  ['application', 'vulnerability', 'Has'],
  ['assessment', 'finding', 'Associated with'],
  ['cloudAccount', 'finding', 'Has'],
  ['cloudAccount', 'storage', 'Has'],
  ['cloudAccount', 'container', 'Has'],
  ['cloudAccount', 'host', 'Has'],
  ['cloudAccount', 'cluster', 'Has'],
  ['cluster', 'cluster', 'Has', null, 'MapReduce Cluster', 'Compute Instance Group'],
  ['cluster', 'finding', 'Has'],
  ['cluster', 'container', 'Has', null, 'Container Group'],
  ['cluster', 'container', 'Has', null, 'Container Service'],
  ['cluster', 'cluster', 'Has', null, 'Kubernetes Cluster', 'Compute Instance Group'],
  ['cluster', 'host', 'Has', null, 'Compute Instance Group', 'Virtual Machine'],
  ['cluster', 'cloudAccount', 'Belongs to', true],
  ['container', 'cluster', 'Belongs to', true, null, 'Container Service'],
  ['container', 'cloudAccount', 'Belongs to', true],
  ['container', 'finding', 'Has'],
  ['container', 'vulnerability', 'Has'],
  ['container', 'cluster', 'Belongs to', true, null, 'Container Group'],
  ['host', 'person', 'Owned by'],
  ['host', 'cloudAccount', 'Belongs to', true],
  ['host', 'identity', 'Has'],
  ['host', 'finding', 'Has'],
  ['host', 'application', 'Hosting', true],
  ['host', 'vulnerability', 'Has'],
  ['host', 'cluster', 'Belongs to', true, 'Virtual Machine', 'Compute Instance Group'],
  ['host', 'storage', 'Has', null, 'Virtual Machine', 'Volume'],
  ['identity', 'person', 'Associated with'],
  ['identity', 'account', 'Has', true],
  ['identity', 'finding', 'Has'],
  ['identity', 'host', 'Associated with', true],
  ['network', 'finding', 'Has'],
  ['netSvc', 'finding', 'Has'],
  ['person', 'host', 'Owns', true],
  ['person', 'identity', 'Has', true],
  ['person', 'finding', 'Has'],
  ['storage', 'storage', 'Has', null, null, 'Queue Service'],
  ['storage', 'finding', 'Has'],
  ['storage', 'storage', 'Belongs to', null, 'Table Service'],
  ['storage', 'storage', 'Has', null, null, 'Bucket'],
  ['storage', 'cloudAccount', 'Belongs to', true, 'Storage Resource'],
  ['storage', 'storage', 'Belongs to', null, 'File System Service'],
  ['storage', 'host', 'To', true, 'Volume Associates', 'Virtual Machine'],
  ['vulnerability', 'host', 'On', true],
  ['vulnerability', 'container', 'On', true],
  ['vulnerability', 'finding', 'Has'],
  ['vulnerability', 'application', 'On', true],
];

// ── Per-edge entity counts ───────────────────────────────────────────
// When a relationship is selected, the two endpoint nodes show a reduced
// count (only the entities actually participating in that relationship).
// Map keyed by sorted "a|b" (alphabetical) so order doesn't matter.
const EDGE_ENTITY_COUNTS = {
  // [src, tgt] => { srcCount, tgtCount }
  'cloudAccount|storage':       { cloudAccount: 2,   storage: 94364 },
  'cluster|finding':            { cluster: 47,       finding: 412903 },
  'container|finding':          { container: 89,     finding: 287104 },
  'cloudAccount|finding':       { cloudAccount: 11,  finding: 1248901 },
  'storage|finding':            { storage: 318,      finding: 92410 },
  'netIface|finding':           { netIface: 64,      finding: 184221 },
  'host|finding':               { host: 1284,        finding: 8410922 },
  'application|finding':        { application: 412,  finding: 1108922 },
  'identity|finding':           { identity: 928,     finding: 421003 },
  'finding|person':             { finding: 184228,   person: 1042 },
  'finding|vulnerability':      { finding: 1480922,  vulnerability: 6128 },
  'assessment|finding':         { assessment: 38,    finding: 84122 },
  'account|identity':           { account: 4188,     identity: 4188 },
  'application|identity':       { application: 612,  identity: 1840 },
  'cluster|host':               { cluster: 47,       host: 412 },
  'container|host':             { container: 1208,   host: 412 },
  'host|netIface':              { host: 1240,        netIface: 4022 },
  'host|storage':               { host: 928,         storage: 12048 },
  'netIface|network':           { netIface: 4022,    network: 184 },
  'netSvc|network':             { netSvc: 1240,      network: 184 },
  'host|ticket':                { host: 124,         ticket: 8 },
  'identity|person':            { identity: 1042,    person: 1042 },
  'person|identity':            { person: 1042,      identity: 1042 },
  'identity|application':       { identity: 1840,    application: 612 },
  'identity|ticket':            { identity: 6,       ticket: 6 },
  'account|group':              { account: 2104,     group: 318 },
  'group|group':                { group: 124,        group: 124 },
};
function edgeCountsFor(a, b) {
  const k1 = `${a}|${b}`, k2 = `${b}|${a}`;
  return EDGE_ENTITY_COUNTS[k1] || EDGE_ENTITY_COUNTS[k2] || null;
}

// ── Inline entity glyphs (24x24 design-system icons via <img>) ───────
// Maps a glyph kind to the design-system SVG filename. Colors are baked
// into the SVG itself, so we don't tint via CSS — pass the file straight.
const GLYPH_TO_FILE = {
  account: 'entity-account.svg',
  identity: 'entity-identity.svg',
  group: 'entity-group.svg',
  person: 'entity-person.svg',
  application: 'entity-application.svg',
  vulnerability: 'entity-vulnerability.svg',
  assessment: 'entity-assessment.svg',
  cluster: 'entity-cluster.svg',
  container: 'entity-cloud-container.svg',
  cloud: 'entity-cloud-account.svg',
  finding: 'entity-finding.svg',
  ticket: 'entity-ticket.svg',
  host: 'entity-host.svg',
  network: 'entity-network.svg',
  netsvc: 'entity-network-services.svg',
  netiface: 'entity-network-interface.svg',
  storage: 'entity-storage.svg',
};

function EntityGlyph({ kind, size = 18 }) {
  const file = GLYPH_TO_FILE[kind];
  if (!file) return null;
  return (
    <img
      src={`assets/icons/${file}`}
      width={size} height={size}
      className="kg-entity-glyph"
      alt=""
    />
  );
}

// ── Number formatter (commas, exact value) ──────────────────────────
function fmtN(n) {
  return n.toLocaleString('en-US');
}

// ── Entity Node — circle bubble + count badge + label below ──────────
function EntityNode({ id, def, pos, selected, dimmed, onClick, onHover, hovered, onDragStart, dragging, floatOffset, countOverride, isDark }) {
  const r = 22;
  const fx = floatOffset ? floatOffset.x : 0;
  const fy = floatOffset ? floatOffset.y : 0;
  const accent = def.icon || def.stroke;
  const nodeTint = isDark ? (def.tintDark || def.tint) : def.tint;
  const nodeStroke = isDark ? (def.strokeDark || def.stroke) : def.stroke;
  const bubbleStroke = selected ? accent : (hovered ? accent : nodeStroke);
  const bubbleStrokeW = selected ? 2.5 : (hovered ? 1.8 : 1.4);
  const opacity = dimmed ? 0.6 : 1;
  const badgeBg = isDark ? 'var(--card-bg)' : 'var(--bg-surface, #fff)';
  return (
    <g
      transform={`translate(${pos.x + fx}, ${pos.y + fy})`}
      className={dragging ? 'kg-node-group--dragging' : 'kg-node-group'}
      style={{ '--kg-node-opacity': opacity, '--kg-node-transition': dragging ? 'none' : 'opacity 150ms cubic-bezier(.2,.8,.2,1)' }}
      onMouseDown={(e) => { e.stopPropagation(); onDragStart(id, e); }}
      onMouseEnter={() => onHover(id)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Soft outer ring on selection */}
      {selected && (
        <circle cx="0" cy="0" r={r + 6} fill={accent} fillOpacity="0.12" />
      )}
      <circle
        cx="0" cy="0" r={r}
        fill={nodeTint}
        stroke={bubbleStroke}
        strokeWidth={bubbleStrokeW}
        className="kg-node-circle"
      />
      {/* Count badge top-right (auto-sized) */}
      {(() => {
        const txt = fmtN(countOverride != null ? countOverride : def.count);
        // Approximate width: 5.5px per char at 10px Inter, plus padding.
        const w = Math.max(36, txt.length * 5.5 + 12);
        return (
          <g transform={`translate(${r-2},${-r+2})`}>
            <rect x={-w/2} y="-8" rx="8" ry="8" width={w} height="16"
                  className="kg-node-badge-rect"
                  style={{ '--kg-badge-fill': badgeBg }} />
            <text textAnchor="middle" dominantBaseline="central" y="0.5"
                  fontFamily="Inter, system-ui, sans-serif" fontWeight="600"
                  className="kg-node-badge-text">
              {txt}
            </text>
          </g>
        );
      })()}
      {GLYPH_TO_FILE[def.glyph] && (
        <image x={-11} y={-11} width={22} height={22} href={`assets/icons/${GLYPH_TO_FILE[def.glyph]}`} pointerEvents="none" />
      )}
      <text
        x="0" y={r + 14}
        textAnchor="middle"
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight={selected ? 600 : 500}
        className={selected ? 'kg-node-label kg-node-label--selected' : 'kg-node-label'}
        style={selected ? { '--kg-node-label-fill': accent } : undefined}
      >
        {def.label}
      </text>
    </g>
  );
}

// Strip the `#N` self-loop disambiguator from an edge key.
function splitEdgeKey(k) {
  const [a, bRaw] = k.split('|');
  const b = bRaw ? bRaw.split('#')[0] : bRaw;
  return [a, b];
}

// ── Edge — straight line w/ optional label ───────────────────────────
function Edge({ a, b, label, selected, dimmed, positions, onEdgeHover, onEdgeClick, edgeKey, hoveredEdge, hoveredNode, anySelected, floatOffsets, selfIdx = 0, selfTotal = 0 }) {
  const isHovered = hoveredEdge === edgeKey;
  const isNodeHovered = hoveredNode && (a === hoveredNode || b === hoveredNode);
  const fa = floatOffsets && floatOffsets[a] ? floatOffsets[a] : { x: 0, y: 0 };
  const fb = floatOffsets && floatOffsets[b] ? floatOffsets[b] : { x: 0, y: 0 };
  const basePa = positions[a], basePb = positions[b];
  const pa = basePa && { x: basePa.x + fa.x, y: basePa.y + fa.y };
  const pb = basePb && { x: basePb.x + fb.x, y: basePb.y + fb.y };
  if (!pa || !pb) return null;

  const stroke = selected ? 'var(--pai-indigo)' : 'var(--shell-border-2)';
  const strokeW = selected ? 1.6 : 1;
  const opacity = dimmed ? 0.6 : 1;
  const isSelfLoop = a === b;

  if (isSelfLoop) return null;

  // shrink endpoints to circle radii
  const ra = a === 'finding' ? 28 : 22;
  const rb = b === 'finding' ? 28 : 22;
  const dx = pb.x - pa.x, dy = pb.y - pa.y;
  const len = Math.hypot(dx, dy) || 1;
  const x1 = pa.x + (dx/len) * ra, y1 = pa.y + (dy/len) * ra;
  const x2 = pb.x - (dx/len) * rb, y2 = pb.y - (dy/len) * rb;
  const mx = (x1+x2)/2, my = (y1+y2)/2;

  return (
    <g className="kg-edge-group"
       style={{ '--kg-edge-opacity': opacity }}
       onMouseEnter={() => onEdgeHover && onEdgeHover(edgeKey)}
       onMouseLeave={() => onEdgeHover && onEdgeHover(null)}
       onClick={(e) => { if (!onEdgeClick) return; e.stopPropagation(); onEdgeClick(a, b, edgeKey); }}
    >
      {/* invisible thick hit area for easier hovering */}
      <line x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="transparent" strokeWidth="10"
            className={onEdgeClick ? 'kg-edge-hit' : 'kg-edge-hit--default'}
      />
      <line x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={selected ? 'var(--pai-indigo)' : (isHovered ? 'var(--pai-indigo-muted)' : (isNodeHovered ? 'var(--pai-indigo-muted)' : stroke))}
            strokeWidth={selected ? 1.6 : (isHovered ? 1.6 : (isNodeHovered ? 1.8 : strokeW))}
            strokeDasharray={selected ? 'none' : '0'}
            className="kg-edge-line"
      />
      {label && (() => {
        const lbl = label.length > 22 ? label.slice(0, 20) + '\u2026' : label;
        return (
          <g transform={`translate(${mx},${my})`} className="kg-edge-label-group">
            <title>{label}</title>
            <rect x={-(lbl.length * 2.9 + 6)} y="-7" width={lbl.length * 5.8 + 12} height="14" rx="3"
                  className="kg-edge-label-bg" />
            <text textAnchor="middle" dominantBaseline="central"
                  fontFamily="Inter, system-ui, sans-serif" fontWeight={selected ? 600 : 400}
                  className={selected ? 'kg-edge-label-text kg-edge-label-text--selected' : 'kg-edge-label-text'}>
              {lbl}
            </text>
          </g>
        );
      })()}
    </g>
  );
}

// ── Graph canvas ─────────────────────────────────────────────────────
function GraphCanvas({ selected, selectedEdgeKey, onSelect, onEdgeSelect, neighborSet, neighborEdgeSet, edgeSelectionEndpoints, hoveredId, setHoveredId, viewMode, positions, setPositions, view, setView, zoomBy, resetView, edges, search, highlightOnly, multiSelectedSet, panelOpen }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const isDark = useDark();
  // Drag state stored in ref to avoid rerender thrash
  const drag = useRef({ id: null, dx: 0, dy: 0, moved: false, downId: null });
  const pan = useRef({ active: false, sx: 0, sy: 0, vx: 0, vy: 0, moved: false });
  const [dragId, setDragId] = useState(null);
  const [panning, setPanning] = useState(false);
  const [hoveredEdge, setHoveredEdge] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [floatOffsets, setFloatOffsets] = useState({});

  // Smoothly animated panel-shift factor (0 = panel closed, 1 = open).
  // Used to compress node x-positions toward the center when the right
  // selection panel is showing.
  const [panelShift, setPanelShift] = useState(0);
  const panelShiftRef = useRef(0);
  useEffect(() => {
    const target = panelOpen ? 1 : 0;
    let raf = 0;
    const start = performance.now();
    const from = panelShift;
    const dur = 280;
    const ease = (t) => 1 - Math.pow(1 - t, 3); // easeOutCubic
    const tick = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const v = from + (target - from) * ease(t);
      setPanelShift(v);
      panelShiftRef.current = v;
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelOpen]);

  // Compress horizontal positions toward findings (cx=470) by up to 22%.
  const SHIFT_CX = 470;
  const SHIFT_AMOUNT = 0.22;
  const displayPositions = useMemo(() => {
    if (panelShift === 0) return positions;
    const k = 1 - panelShift * SHIFT_AMOUNT;
    const out = {};
    for (const id in positions) {
      const p = positions[id];
      out[id] = { x: SHIFT_CX + (p.x - SHIFT_CX) * k, y: p.y };
    }
    return out;
  }, [positions, panelShift]);

  // Per-node deterministic phase + a 0..1 jitter factor for variation
  const floatParams = useMemo(() => {
    const p = {};
    Object.keys(ENTITY_TYPES).forEach((id, i) => {
      const h = (id.charCodeAt(0) * 31 + (id.charCodeAt(1) || 0) * 7 + i * 13);
      p[id] = {
        phaseX: (h % 100) / 100 * Math.PI * 2,
        phaseY: ((h * 7) % 100) / 100 * Math.PI * 2,
        // Per-node jitter (-1..1) — scaled by `variation` tweak at runtime
        jAmpX: ((h * 3) % 21 - 10) / 10,
        jAmpY: ((h * 5) % 21 - 10) / 10,
        jSpdX: ((h * 11) % 21 - 10) / 10,
        jSpdY: ((h * 17) % 21 - 10) / 10,
      };
    });
    return p;
  }, []);

  // Drive float animation — reads window.__floatTweaks each frame so changes are live
  useEffect(() => {
    let raf, start = performance.now();
    const tick = (now) => {
      const tw = window.__floatTweaks || {};
      const enabled = tw.floatEnabled !== false;
      const ampX = enabled ? (tw.ampX ?? 3) : 0;
      const ampY = enabled ? (tw.ampY ?? 2.5) : 0;
      const spdX = tw.speedX ?? 0.55;
      const spdY = tw.speedY ?? 0.45;
      const v = (tw.variation ?? 50) / 100; // 0..1

      const t = (now - start) / 1000;
      const next = {};
      for (const id in floatParams) {
        const p = floatParams[id];
        if (drag.current.id === id) { next[id] = { x: 0, y: 0 }; continue; }
        const aX = ampX * (1 + p.jAmpX * 0.5 * v);
        const aY = ampY * (1 + p.jAmpY * 0.5 * v);
        const sX = spdX * (1 + p.jSpdX * 0.4 * v);
        const sY = spdY * (1 + p.jSpdY * 0.4 * v);
        next[id] = {
          x: Math.sin(t * sX + p.phaseX) * aX,
          y: Math.cos(t * sY + p.phaseY) * aY,
        };
      }
      setFloatOffsets(next);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [floatParams]);

  const visibleEntities = useMemo(() => {
    if (viewMode === 'None') return Object.keys(ENTITY_TYPES);
    if (viewMode === 'Device')   return ['host'];
    if (viewMode === 'Cloud')    return ['cloudAccount', 'cluster', 'container', 'host', 'netSvc', 'network', 'storage'];
    if (viewMode === 'Identity') return ['person', 'identity', 'account'];
    return Object.keys(ENTITY_TYPES);
  }, [viewMode]);

  const visibleSet = new Set(visibleEntities);

  // Search-match set: ids whose label matches the current search term.
  // When search is empty, every visible entity counts as a match (no dim).
  const q = (search || '').trim().toLowerCase();
  const searchMatch = new Set(
    q ? visibleEntities.filter(id => (ENTITY_TYPES[id]?.label || '').toLowerCase().includes(q)) : visibleEntities
  );
  const matchActive = q.length > 0;

  // A node is dimmed only by search. Selection no longer dims other nodes.
  const isDimmed = (id) => {
    if (matchActive && !searchMatch.has(id)) return true;
    return false;
  };
  // Edge dimming: only by search. Selection no longer dims other edges.
  const isEdgeDimmed = (key) => {
    if (matchActive) {
      const [a, b] = key.split('|');
      if (!searchMatch.has(a) && !searchMatch.has(b)) return true;
    }
    return false;
  };

  // Project SVG element corners → viewBox coords so all clamps track the
  // actual rendered canvas regardless of element size or zoom level.
  // Padding: PAD_X keeps nodes off the side walls; PAD_TOP/BOT clears the
  // node geometry (r=22, halo r+6=28, label ~42).
  const PAD_X = 30, PAD_TOP = 30, PAD_BOT = 44;

  const svgRect = () => {
    const svg = svgRef.current;
    return svg ? svg.getBoundingClientRect() : { left: 0, top: 0, right: 0, bottom: 0 };
  };

  const toSvgPoint = (clientX, clientY) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = clientX; pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    return pt.matrixTransform(ctm.inverse());
  };

  const onNodeDown = (id, e) => {
    const p = toSvgPoint(e.clientX, e.clientY);
    const cur = displayPositions[id];
    drag.current = { id, dx: p.x - cur.x, dy: p.y - cur.y, moved: false, downId: id };
    setDragId(id);
  };

  useEffect(() => {
    const onMove = (e) => {
      if (drag.current.id) {
        const p = toSvgPoint(e.clientX, e.clientY);
        const id = drag.current.id;
        const nx = p.x - drag.current.dx;
        const ny = p.y - drag.current.dy;
        const cur = displayPositions[id];
        if (Math.hypot(nx - cur.x, ny - cur.y) > 2) drag.current.moved = true;
        const r = svgRect();
        const tl = toSvgPoint(r.left, r.top);
        const br = toSvgPoint(r.right, r.bottom);
        const cnx = Math.max(tl.x + PAD_X, Math.min(br.x - PAD_X, nx));
        const cny = Math.max(tl.y + PAD_TOP, Math.min(br.y - PAD_BOT, ny));
        const k = 1 - panelShift * SHIFT_AMOUNT;
        const lx = SHIFT_CX + (cnx - SHIFT_CX) / (k || 1);
        setPositions(prev => ({ ...prev, [id]: { x: lx, y: cny } }));
      } else if (pan.current.active) {
        const dx = e.clientX - pan.current.sx;
        const dy = e.clientY - pan.current.sy;
        if (Math.hypot(dx, dy) > 3) pan.current.moved = true;
        const svg = svgRef.current;
        if (!svg) return;
        const r = svg.getBoundingClientRect();
        const scaleX = view.w / r.width;
        const scaleY = view.h / r.height;
        setView(v => ({
          ...v,
          x: pan.current.vx - dx * scaleX,
          y: pan.current.vy - dy * scaleY,
        }));
      }
    };
    const onUp = () => {
      const { id, moved, downId } = drag.current;
      if (id && !moved && downId) {
        onSelect(downId);
        // Mark that this click was a node selection so the container's
        // onClick handler (which fires after) doesn't clear it.
        drag.current.consumed = true;
      }
      drag.current = { id: null, dx: 0, dy: 0, moved: false, downId: null,
                       consumed: drag.current.consumed };
      setDragId(null);
      pan.current.active = false;
      setPanning(false);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [positions, setPositions, onSelect, view, setView]);

  // Re-clamp all node positions when the container resizes (sidebar toggle, window resize).
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || typeof ResizeObserver === 'undefined') return;

    const reclampAll = () => {
      const r = svgRect();
      const tl = toSvgPoint(r.left, r.top);
      const br = toSvgPoint(r.right, r.bottom);
      const minX = tl.x + PAD_X, maxX = br.x - PAD_X;
      const minY = tl.y + PAD_TOP, maxY = br.y - PAD_BOT;
      if (!(maxX > minX) || !(maxY > minY)) return;

      setPositions(prev => {
        let changed = false;
        const next = {};
        for (const id in prev) {
          const p = prev[id];
          const nx = Math.max(minX, Math.min(maxX, p.x));
          const ny = Math.max(minY, Math.min(maxY, p.y));
          if (nx !== p.x || ny !== p.y) changed = true;
          next[id] = { x: nx, y: ny };
        }
        return changed ? next : prev;
      });
    };

    const ro = new ResizeObserver(reclampAll);
    ro.observe(svg);
    return () => ro.disconnect();
  }, [setPositions]);

  return (
    <div
      ref={containerRef}
      onMouseMove={(e) => {
        const r = containerRef.current.getBoundingClientRect();
        setMousePos({ x: e.clientX - r.left, y: e.clientY - r.top });
      }}
      className={panning ? 'kg-canvas kg-canvas--panning' : 'kg-canvas'}
      onMouseDown={(e) => {
        // Begin pan when clicking empty canvas (svg background)
        if (e.target.tagName === 'svg' || e.target === containerRef.current) {
          pan.current = { active: true, sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y, moved: false };
          setPanning(true);
        }
      }}
      onClick={(e) => {
        if (drag.current.moved || pan.current.moved) return;
        // Consumed by a node-click that already set selection — don't clear it.
        if (drag.current.consumed) { drag.current.consumed = false; return; }
        // Only clear when click was on the canvas itself, not bubbled from
        // a node/edge interactive element.
        const t = e.target;
        if (t.tagName === 'svg' || t === containerRef.current) {
          onSelect(null);
        }
      }}
    >
      <svg ref={svgRef} viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        {/* Self-relations rendered as petals — short outward stub lines
            radiating from the node with the label at the tip. Multiple
            self-relations fan across the top so each gets its own slot. */}
        {(() => {
          const selfByNode = {};
          edges.forEach(e => {
            const [a,b,,hidden] = e;
            if (hidden || a !== b || !visibleSet.has(a)) return;
            (selfByNode[a] = selfByNode[a] || []).push(e);
          });
          const out = [];
          Object.entries(selfByNode).forEach(([id, list]) => {
            const base = displayPositions[id];
            if (!base) return;
            const fo = floatOffsets[id] || { x: 0, y: 0 };
            const pa = { x: base.x + fo.x, y: base.y + fo.y };
            const def = ENTITY_TYPES[id];
            const r = id === 'finding' ? 28 : 22;
            const stubLen = 30;
            const dotR = 2.5;
            const total = list.length;
            const spread = total === 1 ? 0 : (Math.PI * 1.25);
            const baseAngle = -Math.PI / 2;
            const dimmed = isDimmed(id);
            const op = dimmed ? 0.5 : 1;
            list.forEach((edge, i) => {
              const [, , label, , srcAlias, tgtAlias] = edge;
              const subLabel = label || srcAlias || tgtAlias || 'Self';
              const angle = baseAngle + (total === 1 ? 0 : -spread/2 + (i/(total-1)) * spread);
              const cos = Math.cos(angle), sin = Math.sin(angle);
              const sx = pa.x + cos * r;
              const sy = pa.y + sin * r;
              const ex = pa.x + cos * (r + stubLen);
              const ey = pa.y + sin * (r + stubLen);
              const labelDist = r + stubLen + 6;
              const lx = pa.x + cos * labelDist;
              const ly = pa.y + sin * labelDist;
              const textAnchor = cos > 0.3 ? 'start' : (cos < -0.3 ? 'end' : 'middle');
              const lbl = subLabel.length > 22 ? subLabel.slice(0, 20) + '\u2026' : subLabel;
              const w = lbl.length * 5.8 + 12;
              const rectX = textAnchor === 'start' ? 0 : (textAnchor === 'end' ? -w : -w/2);
              const key = `${id}|${id}#${i}`;
              const isH = hoveredEdge === key;
              const isSel = selectedEdgeKey === key;
              const accent = isSel ? 'var(--pai-indigo)' : (isH ? 'var(--pai-indigo-muted)' : 'var(--shell-border-2)');
              const accentW = isSel ? 1.6 : (isH ? 1.6 : 1);
              out.push(
                <g key={`pet-${id}-${i}`}
                   onMouseEnter={() => setHoveredEdge(key)}
                   onMouseLeave={() => setHoveredEdge(null)}
                   onClick={(e) => { e.stopPropagation(); onEdgeSelect && onEdgeSelect(id, id, key); }}
                   className="kg-petal-group"
                   style={{ '--kg-petal-opacity': op }}
                >
                  {/* invisible thick hit area along the stub */}
                  <line x1={sx} y1={sy} x2={ex} y2={ey}
                        stroke="transparent" strokeWidth="10"
                  />
                  <line x1={sx} y1={sy} x2={ex} y2={ey}
                        stroke={accent} strokeWidth={accentW}
                        className="kg-petal-line"
                  />
                  <circle cx={ex} cy={ey} r={dotR}
                          fill={accent}
                          className="kg-petal-dot"
                  />
                  <g transform={`translate(${lx},${ly})`}
                     onMouseEnter={() => setHoveredEdge(key)}
                     onMouseLeave={() => setHoveredEdge(null)}
                     className="kg-petal-label-group">
                    <rect x={rectX} y="-7" width={w} height="14" rx="3"
                          className="kg-petal-label-bg" />
                    <text textAnchor={textAnchor} dominantBaseline="central"
                          x={textAnchor === 'start' ? 6 : (textAnchor === 'end' ? -6 : 0)}
                          fontFamily="Inter, system-ui, sans-serif" fontWeight={isSel ? 600 : 400}
                          className={isSel ? 'kg-petal-label-text kg-petal-label-text--selected' : 'kg-petal-label-text'}>
                      {lbl}
                    </text>
                  </g>
                </g>
              );
            });
          });
          return out;
        })()}
        {(() => {
          const visibleEdges = edges.filter(([a,b,,hidden]) => !hidden && visibleSet.has(a) && visibleSet.has(b));
          // Count self-loops per node and assign each its index in that node's loop stack.
          const selfCounts = {};
          visibleEdges.forEach(([a,b]) => { if (a === b) selfCounts[a] = (selfCounts[a] || 0) + 1; });
          const selfIdxByPos = new Map();
          const selfRunning = {};
          visibleEdges.forEach(([a,b], i) => {
            if (a === b) {
              selfRunning[a] = (selfRunning[a] || 0);
              selfIdxByPos.set(i, selfRunning[a]++);
            }
          });
          return visibleEdges.map(([a,b,label], i) => {
            const selfIdx = a === b ? selfIdxByPos.get(i) : 0;
            const selfTotal = a === b ? selfCounts[a] : 0;
            // Self-loops on the same node share endpoints — give each a unique
            // key so hover/select target one loop at a time. Suffix uses `#`
            // which never appears in entity ids; consumers strip it.
            const key = a === b ? `${a}|${b}#${selfIdx}` : `${a}|${b}`;
            return (
              <Edge key={i} a={a} b={b} label={label}
                    edgeKey={key}
                    hoveredEdge={hoveredEdge}
                    hoveredNode={hoveredId}
                    anySelected={!!selected}
                    onEdgeHover={setHoveredEdge}
                    onEdgeClick={onEdgeSelect}
                    positions={displayPositions}
                    floatOffsets={floatOffsets}
                    selfIdx={selfIdx}
                    selfTotal={selfTotal}
                    selected={!highlightOnly && edgeSelectionEndpoints && edgeSelectionEndpoints.has(a) && edgeSelectionEndpoints.has(b)}
                    dimmed={isEdgeDimmed(key) && isEdgeDimmed(`${b}|${a}`)} />
            );
          });
        })()}
        {visibleEntities.map(id => {
          let countOverride = null;
          if (viewMode === 'Cloud' && id === 'host') countOverride = 5303;
          if (selectedEdgeKey && edgeSelectionEndpoints && edgeSelectionEndpoints.has(id)) {
            const [ea, eb] = splitEdgeKey(selectedEdgeKey);
            const ec = edgeCountsFor(ea, eb);
            if (ec && ec[id] != null) countOverride = ec[id];
          }
          return (
          <EntityNode
            key={id}
            id={id}
            def={ENTITY_TYPES[id]}
            pos={displayPositions[id]}
            floatOffset={floatOffsets[id]}
            selected={selected === id || (edgeSelectionEndpoints && edgeSelectionEndpoints.has(id)) || (multiSelectedSet && multiSelectedSet.has(id))}
            dimmed={isDimmed(id)}
            hovered={hoveredId === id || (hoveredEdge && (splitEdgeKey(hoveredEdge)[0] === id || splitEdgeKey(hoveredEdge)[1] === id))}
            onHover={setHoveredId}
            onDragStart={onNodeDown}
            dragging={dragId === id}
            countOverride={countOverride}
            isDark={isDark}
          />
          );
        })}
      </svg>

      {/* Empty-state overlay */}
      {visibleEntities.length === 0 ? (
        <EmptyOverlay
          icon={<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 8l8 8M16 8l-8 8"/></svg>}
          title="No entities in this view"
          subtitle="Switch to All to see the full graph."
        />
      ) : (q && searchMatch.size === 0) ? (
        <EmptyOverlay
          icon={<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>}
          title="No nodes match"
          subtitle={`Nothing matches \u201c${q}\u201d. Try a different search.`}
        />
      ) : null}

      {/* Hover tooltip overlay */}
      {(hoveredId || hoveredEdge) && !dragId && (
        <HoverTooltip
          nodeId={hoveredId}
          edgeKey={hoveredEdge}
          mousePos={mousePos}
          edges={edges}
        />
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Sample table rows. Each row is tagged with an entity type.
// ──────────────────────────────────────────────────────────────────────
const TYPE_TO_TABLE_LABEL = {
  host: { type: 'Workstation', sources: ['ms','crwd'], os: 'Windows', glyph: 'host' },
  person: { type: 'Human', sources: ['ms','crwd','azure','+2'], os: 'Windows', glyph: 'person' },
  identity: { type: 'Identity', sources: ['azure','crwd'], os: 'Windows', glyph: 'identity' },
  account: { type: 'Account', sources: ['azure'], os: '—', glyph: 'account' },
  application: { type: 'Application', sources: ['ms'], os: 'Windows', glyph: 'application' },
  vulnerability: { type: 'Vulnerability', sources: ['ms','crwd'], os: 'Windows', glyph: 'vulnerability' },
  assessment: { type: 'Assessment', sources: ['azure'], os: '—', glyph: 'assessment' },
  cluster: { type: 'Cluster', sources: ['k8s'], os: 'Linux', glyph: 'cluster' },
  container: { type: 'Container', sources: ['k8s'], os: 'Linux', glyph: 'container' },
  cloudAccount: { type: 'Cloud Account', sources: ['aws'], os: '—', glyph: 'cloud' },
  finding: { type: 'Finding', sources: ['ms','crwd','+1'], os: '—', glyph: 'finding' },
  ticket: { type: 'Ticket', sources: ['jira'], os: '—', glyph: 'ticket' },
  network: { type: 'Network', sources: ['aws'], os: '—', glyph: 'network' },
  netSvc: { type: 'Network Service', sources: ['aws'], os: '—', glyph: 'netsvc' },
  netIface: { type: 'Network Interface', sources: ['aws'], os: '—', glyph: 'netiface' },
  storage: { type: 'Storage', sources: ['aws'], os: '—', glyph: 'storage' },
  group: { type: 'Group', sources: ['azure'], os: '—', glyph: 'group' },
};

// ── Full source names, for the Evolution tab column header + filter popup ──
const SOURCE_NAMES = {
  ms: 'Microsoft Defender', crwd: 'CrowdStrike', azure: 'Microsoft Azure AD',
  aws: 'AWS', k8s: 'Kubernetes (EKS)', jira: 'Jira',
};

// ── Identity tab dummy data (uniform mock across all entity types) ────────
const IDENTITY_RINGS = [
  { key: 'Operational Status', color: 'var(--pai-green, #16A34A)', value: 'Active' },
  { key: 'Identity Provider', color: 'var(--pai-indigo, #3B82F6)', value: 'Active Directory' },
  { key: 'Successful Login Location', color: 'var(--fg-3, #8a8a8a)', value: '(empty)' },
];
const IDENTITY_RELATION_ROW = {
  label: 'JANE LEWIS', activity: 'Active', operational: 'Active', ownership: 'Corp',
  provider: 'Active Directory', loginLocation: '—', origin: 'MS Active Directory',
  firstSeen: '—', duration: '—', recency: '0',
};

const ROWS = [
  // host rows
  { label: 'support-portal.acme.io',       type: 'host', ip: '198.1.2.1, 192.168.1.5', last: '2023-10-21', active: '2024-08-11' },
  { label: 'edge-router-03',                type: 'host', ip: '10.0.4.18',              last: '2024-02-04', active: '2024-09-22' },
  { label: 'win-build-08.corp.local',       type: 'host', ip: '10.12.2.44',             last: '2024-04-19', active: '2024-09-30' },
  { label: 'mac-mini-arm64-12',             type: 'host', ip: '10.5.18.221',            last: '2024-06-30', active: '2024-09-15' },
  { label: 'kiosk-02.retail.acme.io',       type: 'host', ip: '172.16.4.5',             last: '2024-01-12', active: '2024-08-08' },
  // person/identity rows
  { label: 'JANE LEWIS',                    type: 'person', ip: '198.168.2.1',          last: '2024-08-11', active: '2023-10-21' },
  { label: 'MARK PHILLIPS',                 type: 'person', ip: '—',                    last: '2024-09-15', active: '2024-09-30' },
  { label: 'jane.lewis@acme.io',            type: 'identity', ip: '—',                  last: '2024-08-11', active: '2024-09-22' },
  { label: 'mark.phillips@acme.io',         type: 'identity', ip: '—',                  last: '2024-08-11', active: '2024-09-30' },
  { label: 'svc-deploy@acme.io',            type: 'identity', ip: '—',                  last: '2024-04-02', active: '2024-09-30' },
  // account
  { label: 'acme-prod-aws',                 type: 'account', ip: '—',                   last: '2024-09-22', active: '2024-09-30' },
  { label: 'acme-stage-azure',              type: 'account', ip: '—',                   last: '2024-09-15', active: '2024-09-30' },
  // application
  { label: 'acme-portal v4.2',              type: 'application', ip: '—',               last: '2024-08-30', active: '2024-09-30' },
  { label: 'finance-dashboard',             type: 'application', ip: '—',               last: '2024-09-02', active: '2024-09-29' },
  // vulnerability
  { label: 'CVE-2024-3094',                 type: 'vulnerability', ip: '—',             last: '2024-04-01', active: '2024-09-29' },
  { label: 'CVE-2024-21412',                type: 'vulnerability', ip: '—',             last: '2024-03-12', active: '2024-09-21' },
  // finding
  { label: 'Open SSH on 0.0.0.0',           type: 'finding', ip: '198.1.2.1',           last: '2024-09-12', active: '2024-09-30' },
  { label: 'S3 bucket public-read',         type: 'finding', ip: '—',                   last: '2024-09-19', active: '2024-09-30' },
  { label: 'IAM user without MFA',          type: 'finding', ip: '—',                   last: '2024-09-21', active: '2024-09-30' },
  // assessment
  { label: 'Q3 SOC2 self-attestation',      type: 'assessment', ip: '—',                last: '2024-09-01', active: '2024-09-30' },
  // cluster / container
  { label: 'prod-eks-east-1',               type: 'cluster', ip: '—',                   last: '2024-08-12', active: '2024-09-30' },
  { label: 'auth-svc-7d4c89f6cf-l9b2x',     type: 'container', ip: '10.43.4.12',        last: '2024-09-22', active: '2024-09-30' },
  // cloud / network
  { label: 'aws-acct-908127364582',         type: 'cloudAccount', ip: '—',              last: '2024-09-22', active: '2024-09-30' },
  { label: 'vpc-prod-east1',                type: 'network', ip: '10.0.0.0/16',         last: '2024-08-08', active: '2024-09-29' },
  { label: 'eni-0f12a8b394',                type: 'netIface', ip: '10.0.4.18',          last: '2024-09-15', active: '2024-09-30' },
  { label: 's3://acme-data-prod',           type: 'storage', ip: '—',                   last: '2024-09-10', active: '2024-09-30' },
  // ticket
  { label: 'JIRA-SEC-1208',                 type: 'ticket', ip: '—',                    last: '2024-09-15', active: '2024-09-29' },
  { label: 'JIRA-SEC-1145',                 type: 'ticket', ip: '—',                    last: '2024-09-04', active: '2024-09-22' },
  // group
  { label: 'platform-eng',                  type: 'group', ip: '—',                     last: '2024-09-01', active: '2024-09-30' },
];

// ── Data source pill (logo image chip) ───────────────────────────────
function SourceBadge({ src }) {
  const logoMap = {
    ms:    'assets/Data source logos/MS Defender.svg',
    crwd:  'assets/Data source logos/logo-crowdstrike.svg',
    azure: 'assets/Data source logos/logo-azure.svg',
    aws:   'assets/Data source logos/logo-aws.svg',
    k8s:   'assets/Data source logos/AWS EKS Container.svg',
    jira:  'assets/Data source logos/Jira.svg',
  };
  const overflowMap = {
    '+2': '+2',
    '+1': '+1',
  };

  if (overflowMap[src]) {
    return (
      <span className="kg-src-overflow-badge">{overflowMap[src]}</span>
    );
  }

  const logo = logoMap[src];
  if (logo) {
    return (
      <span className="kg-src-logo-wrap">
        <img src={logo} width={16} height={16} alt={src} className="kg-src-logo-img" />
      </span>
    );
  }

  // fallback text
  return (
    <span className="kg-src-fallback-badge">{src}</span>
  );
}

// ── OS Family icon ───────────────────────────────────────────────────
function OSPill({ os }) {
  if (os === '—') return <span className="kg-os-null-dash">—</span>;
  const map = {
    Windows: { color: '#0078D4' },
    Linux:   { color: 'var(--shell-text)' },
    macOS:   { color: 'var(--shell-text-muted)' },
  };
  const m = map[os] || { color: 'var(--shell-text-muted)' };
  return (
    <span className="kg-os-inline">
      <svg width="14" height="14" viewBox="0 0 24 24" fill={m.color}>
        <path d="M3 4h8v8H3zM13 4h8v8h-8zM3 14h8v8H3zM13 14h8v8h-8z"/>
      </svg>
      <span>{os}</span>
    </span>
  );
}

// ── Design-system pill search — icon on right inside an indigo-tinted
//    circular swatch; pill border (44px), 32px tall.
function DSPillSearch({ value, onChange, placeholder, width = 220 }) {
  const [focused, setFocused] = useState(false);
  return (
    <div
      className={focused ? 'kg-pill-search kg-pill-search--focused' : 'kg-pill-search'}
      style={{ '--kg-pill-search-width': typeof width === 'number' ? `${width}px` : width }}
    >
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className="kg-pill-search__input"
      />
      {value && (
        <button
          onMouseDown={e => { e.preventDefault(); onChange(''); }}
          className="kg-pill-search__clear"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      )}
      <span className="kg-pill-search__icon-wrap">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="2"
             strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>
        </svg>
      </span>
    </div>
  );
}

// ── Header column — design-system .ds-th: F5F5F5 bg, 10px uppercase,
//    .06em letter-spacing, no inter-column dividers, single bottom border
function Th({ children }) {
  return (
    <th className="kg-th">
      <span className="kg-th__inner">
        {children}
        <Ic size={10} path={<polyline points="18 15 12 9 6 15" className="kg-th__sort-icon" />} />
      </span>
    </th>
  );
}

// ── Details Table ────────────────────────────────────────────────────
function DetailsTable({ rows, totalCount, search, onSearch, onRowClick }) {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const displayRows = rows.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  return (
    <div className="kg-details-card">
      {/* header bar */}
      <div className="kg-details-header">
        <div className="kg-details-title">
          Details <span className="kg-details-title-count">({fmtN(totalCount)})</span>
        </div>
        <div className="kg-details-spacer" />
        <DSPillSearch value={search} onChange={onSearch} placeholder="Search Any" width={220} />
        <button className="ds-btn sz-md t-outline kg-details-add-col-btn">
          Add Column <Ic size={12} path={<><path d="M12 5v14M5 12h14"/></>}/>
        </button>
        <button className="ds-btn sz-md t-primary kg-details-download-btn">
          {Icons.download} Download
          <Ic size={12} path={<><path d="m6 9 6 6 6-6"/></>}/>
        </button>
      </div>

      {/* table */}
      <div className="kg-details-body">
        <table className="kg-details-table">
          <thead>
            <tr>
              <Th>Display Label</Th>
              <Th>Type</Th>
              <Th>Data Sources</Th>
              <Th>OS Family</Th>
              <Th>IP</Th>
              <Th>Last Found</Th>
              <Th>Last Active</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan="7" className="kg-details-empty-cell">
                  No records match this filter.
                </td>
              </tr>
            ) : displayRows.map((r, i) => {
              const meta = TYPE_TO_TABLE_LABEL[r.type];
              const ent = ENTITY_TYPES[r.type];
              return (
                <tr key={i} className={onRowClick ? 'kg-tr kg-tr--clickable' : 'kg-tr'} onClick={() => onRowClick && onRowClick(r)}>
                  <td className="kg-td--label">{r.label}</td>
                  <td className="kg-td--type">
                    <span className="kg-td--type-inner">
                      <span className="kg-td--type-icon">
                        <EntityGlyph kind={meta.glyph} size={20} />
                      </span>
                      {meta.type}
                    </span>
                  </td>
                  <td className="kg-td--sources">
                    <span className="kg-td--sources-inner">
                      {meta.sources.map((s, j) => <SourceBadge key={j} src={s} />)}
                    </span>
                  </td>
                  <td className="kg-td"><OSPill os={meta.os} /></td>
                  <td className="kg-td--numeric">{r.ip}</td>
                  <td className="kg-td--numeric">{r.last}</td>
                  <td className="kg-td--numeric">{r.active}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {rows.length > 0 && (
        <TablePagination
          total={rows.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={n => { setRowsPerPage(n); setPage(1); }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// SankeyView — Data Sources tab (Origins → Contribution → Entities)
// ─────────────────────────────────────────────────────────────────────

const SK_SOURCES = [
  { id: 'aws',            label: 'AWS',                         color: '#E05C5C' },
  { id: 'msAzure',        label: 'MS Azure',                    color: '#E07090' },
  { id: 'msAD',           label: 'MS Active Directory',         color: '#D4B800' },
  { id: 'msAzureAD',      label: 'MS Azure AD',                 color: '#4BBDBA' },
  { id: 'qualys',         label: 'Qualys',                      color: '#5BBFBD' },
  { id: 'msIntune',       label: 'MS Intune',                   color: '#4CAF50' },
  { id: 'wiz',            label: 'Wiz',                         color: '#E91E8C' },
  { id: 'msDefender',     label: 'MS Defender',                 color: '#FF9800' },
  { id: 'winSecLogs',     label: 'Windows Security Logs',       color: '#9E8EC8' },
  { id: 'tenableSc',      label: 'Tenable.sc',                  color: '#FFA726' },
  { id: 'serviceNow',     label: 'ServiceNow',                  color: '#B0A8D8' },
  { id: 'msADExtract',    label: 'MS Active Directory Extract', color: '#C0B8E8' },
  { id: 'crowdStrike',    label: 'CrowdStrike',                 color: '#FFB3B3' },
  { id: 'mega',           label: 'Mega',                        color: '#90A4B8' },
  { id: 'awsCloudtrail',  label: 'AWS Cloudtrail',              color: '#B8C8D8' },
  { id: 'awsIAMUsers',    label: 'AWS IAM Users',               color: '#B8C8D8' },
  { id: 'bambooHR',       label: 'BambooHR',                    color: '#C8D0D8' },
  { id: 'successFactors', label: 'SuccessFactors',              color: '#C8D0D8' },
  { id: 'awsIAMCenter',   label: 'AWS IAM Center',              color: '#C8D0D8' },
];

const SK_ENTITIES = [
  { id: 'account',   label: 'Account',           color: '#E05C5C' },
  { id: 'storage',   label: 'Storage',           color: '#E07090' },
  { id: 'netIface',  label: 'Network Interface', color: '#4BBDBA' },
  { id: 'container', label: 'Container',         color: '#9E8EC8' },
  { id: 'network',   label: 'Network',           color: '#4CAF50' },
  { id: 'cluster',   label: 'Cluster',           color: '#2040A0' },
  { id: 'netSvc',    label: 'Network Services',  color: '#89A833' },
  { id: 'cloudAcct', label: 'Cloud Account',     color: '#3B43B0' },
  { id: 'host',      label: 'Host',              color: '#2B5690' },
  { id: 'identity',  label: 'Identity',          color: '#A842D2' },
  { id: 'app',       label: 'Application',       color: '#303030' },
  { id: 'person',    label: 'Person',            color: '#2E7690' },
];

// [sourceId, 'unique'|'corroborated', value]
const SK_SRC_CONTRIB = [
  // → Unique (total 49,704)
  ['aws','unique',9747],['msAzure','unique',516],
  ['msAD','unique',19397],['msAzureAD','unique',7194],
  ['qualys','unique',5521],['msIntune','unique',4800],
  ['wiz','unique',1205],['msDefender','unique',1185],
  ['tenableSc','unique',132],['mega','unique',7],
  // → Corroborated (total 356,496)
  ['msAD','corroborated',32375],['msAzureAD','corroborated',68517],
  ['qualys','corroborated',23214],['msIntune','corroborated',48298],
  ['wiz','corroborated',3614],['msDefender','corroborated',43911],
  ['winSecLogs','corroborated',52139],['tenableSc','corroborated',668],
  ['serviceNow','corroborated',39549],['msADExtract','corroborated',37048],
  ['crowdStrike','corroborated',3268],['mega','corroborated',3189],
  ['awsCloudtrail','corroborated',133],['awsIAMUsers','corroborated',1],
  ['bambooHR','corroborated',152],['successFactors','corroborated',148],
  ['awsIAMCenter','corroborated',272],
];

// [contrib, entityId, value]
const SK_CONTRIB_ENT = [
  // Unique → entities (total 49,704)
  ['unique','account',15253],['unique','storage',5541],['unique','netIface',3303],
  ['unique','container',358],['unique','network',77],['unique','cluster',231],
  ['unique','netSvc',253],['unique','cloudAcct',15],
  ['unique','host',9761],['unique','identity',13721],['unique','app',1187],['unique','person',4],
  // Corroborated → entities (total 356,496)
  ['corroborated','account',96],
  ['corroborated','host',215810],['corroborated','identity',133201],
  ['corroborated','app',6378],['corroborated','person',1011],
];

function computeSankeyLayout(W, H, opts) {
  const {
    sources    = SK_SOURCES,
    entities   = SK_ENTITIES,
    srcContrib = SK_SRC_CONTRIB,
    contribEnt = SK_CONTRIB_ENT,
  } = opts || {};

  const NW = 8;    // node bar width
  const LL = 185;  // left label space (source labels right-aligned)
  const LR = 148;  // right label space (entity labels left-aligned)
  const NG = 4;    // vertical gap between same-column nodes
  const CG = 16;   // gap between Unique / Corroborated
  const PT = 32;   // top padding (column headers)
  const PB = 8;

  const srcX     = LL;
  const entX     = W - LR - NW;
  const contribX = Math.round((srcX + NW + entX) / 2);

  const srcTotals = {};
  const contribIn = { unique: 0, corroborated: 0 };
  srcContrib.forEach(([s, c, v]) => { srcTotals[s] = (srcTotals[s] || 0) + v; contribIn[c] += v; });
  const contribOut = { unique: 0, corroborated: 0 };
  const entTotals  = {};
  contribEnt.forEach(([c, e, v]) => { contribOut[c] += v; entTotals[e] = (entTotals[e] || 0) + v; });
  const totalFlow = Object.values(srcTotals).reduce((s, v) => s + v, 0) || 1;
  const availH    = H - PT - PB;

  function layoutNodes(items, getVal, x) {
    const MIN_H = 14;  // font(11) + label-gap(3) — ensures no label overlap at NG=4 spacing
    const totalGap = (items.length - 1) * NG;
    const nodeSpace = availH - totalGap;
    // First pass: proportional with minimum
    const raw = items.map(it => Math.max(MIN_H, getVal(it.id) / totalFlow * nodeSpace));
    const rawTotal = raw.reduce((s, v) => s + v, 0);
    // Scale down proportionally if minimums caused overflow
    const scale = rawTotal > nodeSpace ? nodeSpace / rawTotal : 1;
    let y = PT;
    return items.map((it, i) => {
      const h = raw[i] * scale;
      const node = { x, y, h };
      y += h + NG;
      return [it.id, node];
    });
  }

  const srcNodes = Object.fromEntries(layoutNodes(sources,  id => srcTotals[id] || 0, srcX));
  const entNodes = Object.fromEntries(layoutNodes(entities, id => entTotals[id] || 0, entX));

  // Use the same px-per-unit scale as source nodes so contribution blocks
  // don't inflate to full height. Then center them vertically with equal
  // empty space above and below.
  const srcNodeSpace = availH - (sources.length - 1) * NG;
  const uH = Math.max(4, contribIn.unique       / totalFlow * srcNodeSpace);
  const cH = Math.max(4, contribIn.corroborated / totalFlow * srcNodeSpace);
  const midTotalH = uH + CG + cH;
  const midStartY = PT + (availH - midTotalH) / 2;
  const contribNodes = {
    unique:       { x: contribX, y: midStartY,           h: uH, label: 'Unique',       color: '#6360D8' },
    corroborated: { x: contribX, y: midStartY + uH + CG, h: cH, label: 'Corroborated', color: '#4AB5C4' },
  };

  // Source → contribution ribbons (unique first so they stack at top of each source bar)
  const srcOff  = {};
  sources.forEach(s => { srcOff[s.id] = 0; });
  const cInOff  = { unique: 0, corroborated: 0 };
  const scRibbons = [];
  for (const contrib of ['unique', 'corroborated']) {
    srcContrib.filter(([, c]) => c === contrib).forEach(([src, , val]) => {
      const sn = srcNodes[src], cn = contribNodes[contrib];
      if (!sn) return;
      const rhs = Math.max(0.5, (val / (srcTotals[src]      || 1)) * sn.h);
      const rhc = Math.max(0.5, (val / (contribIn[contrib]  || 1)) * cn.h);
      const y0t = sn.y + srcOff[src],     y0b = y0t + rhs;
      const y1t = cn.y + cInOff[contrib], y1b = y1t + rhc;
      const mx  = (sn.x + NW + cn.x) / 2;
      scRibbons.push({
        key: `sc-${src}-${contrib}`, srcId: src, contrib, val,
        color: sources.find(s => s.id === src)?.color || '#ccc',
        path:  `M${sn.x+NW} ${y0t}C${mx} ${y0t},${mx} ${y1t},${cn.x} ${y1t}L${cn.x} ${y1b}C${mx} ${y1b},${mx} ${y0b},${sn.x+NW} ${y0b}Z`,
        label: `${sources.find(s => s.id === src)?.label || src} → ${contrib === 'unique' ? 'Unique' : 'Corroborated'}`,
      });
      srcOff[src]      += rhs;
      cInOff[contrib]  += rhc;
    });
  }

  // Contribution → entity ribbons
  const cOutOff = { unique: 0, corroborated: 0 };
  const entOff  = {};
  entities.forEach(e => { entOff[e.id] = 0; });
  const ceRibbons = [];
  for (const contrib of ['unique', 'corroborated']) {
    contribEnt.filter(([c]) => c === contrib).forEach(([, ent, val]) => {
      const cn = contribNodes[contrib], en = entNodes[ent];
      if (!en) return;
      const rhc = Math.max(0.5, (val / (contribOut[contrib] || 1)) * cn.h);
      const rhe = Math.max(0.5, (val / (entTotals[ent]      || 1)) * en.h);
      const y0t = cn.y + cOutOff[contrib], y0b = y0t + rhc;
      const y1t = en.y + entOff[ent],      y1b = y1t + rhe;
      const mx  = (cn.x + NW + en.x) / 2;
      ceRibbons.push({
        key: `ce-${contrib}-${ent}`, contrib, entId: ent, val,
        color: contribNodes[contrib].color,
        path:  `M${cn.x+NW} ${y0t}C${mx} ${y0t},${mx} ${y1t},${en.x} ${y1t}L${en.x} ${y1b}C${mx} ${y1b},${mx} ${y0b},${cn.x+NW} ${y0b}Z`,
        label: `${contrib === 'unique' ? 'Unique' : 'Corroborated'} → ${entities.find(e => e.id === ent)?.label || ent}`,
      });
      cOutOff[contrib] += rhc;
      entOff[ent]      += rhe;
    });
  }

  return { srcNodes, contribNodes, entNodes, scRibbons, ceRibbons, NW, LL, LR, CG, srcTotals, entTotals, contribIn, srcX, entX, contribX };
}

// ── SankeyFilterPopup — checkbox filter panel for Origin/Contribution/Entities
function SankeyFilterPopup({ type, items, selected, operator, onApply, onClose, anchorX, svgW }) {
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState(() => new Set(selected));
  const [draftOp, setDraftOp] = useState(operator || 'OR');

  const filtered = items.filter(it =>
    !search || it.label.toLowerCase().includes(search.toLowerCase())
  );
  const allChecked = filtered.length > 0 && filtered.every(i => draft.has(i.id));
  const someChecked = !allChecked && filtered.some(i => draft.has(i.id));

  const toggle = (id) => setDraft(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
  });
  const toggleAll = () => setDraft(prev => {
    const n = new Set(prev);
    allChecked ? filtered.forEach(i => n.delete(i.id)) : filtered.forEach(i => n.add(i.id));
    return n;
  });
  const selectInverse = () => setDraft(prev => {
    const n = new Set();
    filtered.forEach(i => { if (!prev.has(i.id)) n.add(i.id); });
    prev.forEach(id => { if (!filtered.find(i => i.id === id)) n.add(id); });
    return n;
  });

  const title = type === 'origin' ? 'Filter Origin' :
                type === 'contrib' ? 'Filter Contribution' :
                type === 'source' ? 'Filter Data Source' : 'Filter Entities';
  const popupW = 280;
  const left = Math.max(0, Math.min(anchorX - 20, svgW - popupW));

  return (
    <div className="kg-filter-popup" style={{ '--kg-filter-popup-left': `${left}px` }}>
      <div className="kg-filter-popup__header">
        <span className="kg-filter-popup__title">{title}</span>
        <button onClick={onClose} className="kg-filter-popup__close-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <div className="kg-filter-popup__search">
        <DSPillSearch value={search} onChange={setSearch} placeholder="Search" width="100%" />
      </div>

      {type === 'origin' && (
        <div className="kg-filter-popup__op">
          <SegmentedTabs value={draftOp} options={['AND', 'OR', 'EXACT']} onChange={setDraftOp} fullWidth />
        </div>
      )}

      <div className="kg-filter-popup__list">
        <label className="kg-filter-popup__label">
          <input
            type="checkbox"
            checked={allChecked}
            ref={el => { if (el) el.indeterminate = someChecked; }}
            onChange={toggleAll}
            className="kg-filter-popup__checkbox"
          />
          <span className="kg-filter-popup__select-all-text">Select All</span>
        </label>
        {filtered.map(item => (
          <label key={item.id} className="kg-filter-popup__label">
            <input
              type="checkbox"
              checked={draft.has(item.id)}
              onChange={() => toggle(item.id)}
              className="kg-filter-popup__checkbox"
            />
            <span className="kg-filter-popup__item-text">{item.label}</span>
          </label>
        ))}
      </div>

      <div className="kg-filter-popup__footer">
        <button onClick={selectInverse} className="kg-filter-popup__inverse-btn">Select Inverse</button>
        <div className="kg-filter-popup__spacer" />
        <button onClick={onClose} className="kg-filter-popup__cancel-btn">Cancel</button>
        <button onClick={() => { onApply(draft, draftOp); onClose(); }} className="kg-filter-popup__apply-btn">Apply</button>
      </div>
    </div>
  );
}

function SankeyView() {
  const containerRef = useRef(null);
  const [svgW, setSvgW] = useState(900);
  const [activeAssets, setActiveAssets] = useState(true);
  const [hovered, setHovered] = useState(null);
  const [selected, setSelected] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [openFilter, setOpenFilter] = useState(null);
  const [filterOrigin, setFilterOrigin] = useState(() => new Set(SK_SOURCES.map(s => s.id)));
  const [filterContrib, setFilterContrib] = useState(() => new Set(['unique', 'corroborated']));
  const [filterEntities, setFilterEntities] = useState(() => new Set(SK_ENTITIES.map(e => e.id)));
  const [originOperator, setOriginOperator] = useState('OR');
  const isDark = useDark();
  const H = 680;

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(es => setSvgW(Math.max(500, es[0].contentRect.width)));
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const filteredSources    = useMemo(() => SK_SOURCES.filter(s => filterOrigin.has(s.id)),    [filterOrigin]);
  const filteredEntities   = useMemo(() => SK_ENTITIES.filter(e => filterEntities.has(e.id)), [filterEntities]);
  const filteredSrcContrib = useMemo(() => SK_SRC_CONTRIB.filter(([s, c]) => filterOrigin.has(s) && filterContrib.has(c)), [filterOrigin, filterContrib]);
  const filteredContribEnt = useMemo(() => SK_CONTRIB_ENT.filter(([c, e]) => filterContrib.has(c) && filterEntities.has(e)), [filterContrib, filterEntities]);

  const layout = useMemo(() => computeSankeyLayout(svgW, H, {
    sources: filteredSources, entities: filteredEntities,
    srcContrib: filteredSrcContrib, contribEnt: filteredContribEnt,
  }), [svgW, filteredSources, filteredEntities, filteredSrcContrib, filteredContribEnt]);
  const { srcNodes, contribNodes, entNodes, scRibbons, ceRibbons, NW, LL, LR, CG, srcTotals, entTotals, contribIn } = layout;

  // `selected` (click-pinned) takes priority over `hovered` for path highlighting
  function eff() { return selected || hovered; }

  function isNodeActive(col, id) {
    const e = eff();
    if (!e) return true;
    if (e.type === 'srcNode') {
      if (col === 'src')     return e.id === id;
      if (col === 'contrib') return scRibbons.some(r => r.srcId === e.id && r.contrib === id);
      if (col === 'ent') {
        const cs = new Set(scRibbons.filter(r => r.srcId === e.id).map(r => r.contrib));
        return ceRibbons.some(r => cs.has(r.contrib) && r.entId === id);
      }
    }
    if (e.type === 'contribNode') {
      if (col === 'src')     return scRibbons.some(r => r.contrib === e.id && r.srcId === id);
      if (col === 'contrib') return e.id === id;
      if (col === 'ent')     return ceRibbons.some(r => r.contrib === e.id && r.entId === id);
    }
    if (e.type === 'entNode') {
      if (col === 'ent')     return e.id === id;
      if (col === 'contrib') return ceRibbons.some(r => r.entId === e.id && r.contrib === id);
      if (col === 'src') {
        const cs = new Set(ceRibbons.filter(r => r.entId === e.id).map(r => r.contrib));
        return scRibbons.some(r => cs.has(r.contrib) && r.srcId === id);
      }
    }
    if (e.type === 'sc') {
      const r = scRibbons.find(r => r.key === e.key);
      if (col === 'src')     return r?.srcId   === id;
      if (col === 'contrib') return r?.contrib === id;
      if (col === 'ent')     return ceRibbons.some(cr => cr.contrib === r?.contrib && cr.entId === id);
    }
    if (e.type === 'ce') {
      const r = ceRibbons.find(r => r.key === e.key);
      if (col === 'ent')     return r?.entId   === id;
      if (col === 'contrib') return r?.contrib === id;
      if (col === 'src')     return scRibbons.some(sr => sr.contrib === r?.contrib && sr.srcId === id);
    }
    return false;
  }

  function scOp(r) {
    const e = eff();
    if (!e) return 0.35;
    if (e.type === 'sc')          return e.key === r.key ? 0.72 : 0.07;
    if (e.type === 'srcNode')     return e.id  === r.srcId   ? 0.72 : 0.07;
    if (e.type === 'contribNode') return e.id  === r.contrib ? 0.72 : 0.07;
    if (e.type === 'ce') {
      const cr = ceRibbons.find(cr => cr.key === e.key);
      return cr?.contrib === r.contrib ? 0.72 : 0.07;
    }
    if (e.type === 'entNode') {
      const cs = new Set(ceRibbons.filter(cr => cr.entId === e.id).map(cr => cr.contrib));
      return cs.has(r.contrib) ? 0.72 : 0.07;
    }
    return 0.35;
  }

  function ceOp(r) {
    const e = eff();
    if (!e) return 0.35;
    if (e.type === 'ce')          return e.key === r.key ? 0.72 : 0.07;
    if (e.type === 'contribNode') return e.id  === r.contrib ? 0.72 : 0.07;
    if (e.type === 'entNode')     return e.id  === r.entId   ? 0.72 : 0.07;
    if (e.type === 'sc') {
      const sr = scRibbons.find(sr => sr.key === e.key);
      return sr?.contrib === r.contrib ? 0.72 : 0.07;
    }
    if (e.type === 'srcNode') {
      const cs = new Set(scRibbons.filter(sr => sr.srcId === e.id).map(sr => sr.contrib));
      return cs.has(r.contrib) ? 0.72 : 0.07;
    }
    return 0.35;
  }

  const FG1   = isDark ? '#D1D1D1' : '#282828';
  const FG3   = isDark ? '#8A8A8A' : '#6E6E6E';
  const HDR_Y = 22;

  return (
    <div>
      {/* Description + controls */}
      <div className="kg-sankey-desc-row">
        <p className="kg-sankey-desc" style={{ '--kg-sankey-desc-color': FG3 }}>
          Entity origins showing contribution to the entity from each origin supported by whether it is uniquely found in an origin or corroborated from multiple origins.{' '}
          <em>Showing only active assets by default.</em>
        </p>
        <SegmentedTabs
          value={activeAssets ? 'Assets' : 'All Entities'}
          onChange={v => setActiveAssets(v === 'Assets')}
          options={['Assets', 'All Entities']}
          height={28}
        />
      </div>

      {/* Chart */}
      <div className="kg-sankey-chart-wrap">
        <div ref={containerRef} className="kg-sankey-inner">
          <svg
            width={svgW} height={H}
            className="kg-sankey-svg"
            onMouseMove={e => {
              const rc = e.currentTarget.getBoundingClientRect();
              setMousePos({ x: e.clientX - rc.left, y: e.clientY - rc.top });
            }}
            onMouseLeave={() => { setHovered(null); setTooltip(null); }}
            onClick={() => setSelected(null)}
          >
            {/* Column headers */}
            {[
              { id: 'origin',  label: 'Origin',       x: layout.srcX },
              { id: 'contrib', label: 'Contribution', x: layout.contribX },
              { id: 'ents',    label: 'Entities',     x: layout.entX + NW + 8 },
            ].map(({ id, label, x }) => {
              const isActive = id === 'origin' ? filterOrigin.size < SK_SOURCES.length :
                               id === 'contrib' ? filterContrib.size < 2 :
                               filterEntities.size < SK_ENTITIES.length;
              return (
                <g key={id}>
                  <text x={x} y={HDR_Y} fontFamily="Inter, system-ui, sans-serif" fontSize={12} fontWeight={500} fill={FG1} className="kg-sankey-col-header">
                    {label}
                  </text>
                  <g
                    transform={`translate(${x + label.length * 6.8 + 2}, ${HDR_Y - 10})`}
                    onClick={(e) => { e.stopPropagation(); setOpenFilter(id); }}
                    className="kg-sankey-filter-icon"
                  >
                    <rect x={-3} y={-3} width={16} height={16} fill="transparent" />
                    <path d="M1 0L9 0L6 4.5L6 9L4 7.5L4 4.5Z"
                          fill={isActive ? 'var(--pai-indigo)' : FG3}
                          opacity={isActive ? 1 : 0.65} />
                  </g>
                </g>
              );
            })}

            {/* Left ribbons: source → contribution */}
            {scRibbons.map(r => (
              <path key={r.key} d={r.path} fill={r.color} opacity={scOp(r)}
                className="kg-sankey-ribbon"
                onMouseEnter={() => { setHovered({ type: 'sc', key: r.key }); setTooltip({ text: r.label, value: r.val }); }}
                onMouseLeave={() => { setHovered(null); setTooltip(null); }}
              />
            ))}

            {/* Right ribbons: contribution → entity */}
            {ceRibbons.map(r => (
              <path key={r.key} d={r.path} fill={r.color} opacity={ceOp(r)}
                className="kg-sankey-ribbon"
                onMouseEnter={() => { setHovered({ type: 'ce', key: r.key }); setTooltip({ text: r.label, value: r.val }); }}
                onMouseLeave={() => { setHovered(null); setTooltip(null); }}
              />
            ))}

            {/* Source bars + labels */}
            {SK_SOURCES.map(src => {
              const n = srcNodes[src.id];
              if (!n) return null;
              const active = isNodeActive('src', src.id);
              return (
                <g key={src.id}
                  onMouseEnter={() => { setHovered({ type: 'srcNode', id: src.id }); setTooltip({ text: src.label, value: srcTotals[src.id] || 0 }); }}
                  onMouseLeave={() => { setHovered(null); setTooltip(null); }}
                  onClick={e => { e.stopPropagation(); setSelected(p => p?.type === 'srcNode' && p.id === src.id ? null : { type: 'srcNode', id: src.id }); }}
                  className="kg-sankey-node-group"
                >
                  {/* Transparent hit-rect covers full label + bar area */}
                  <rect x={n.x - LL + 4} y={n.y - 2} width={LL - 4 + NW} height={Math.max(n.h + 4, 18)} fill="transparent" pointerEvents="all" />
                  <rect x={n.x} y={n.y} width={NW} height={Math.max(2, n.h)} fill={src.color} rx={1} />
                  <text
                    x={n.x} y={n.y + n.h / 2}
                    textAnchor="end" dominantBaseline="central"
                    fontFamily="Inter, system-ui, sans-serif" fontSize={11}
                    fontWeight={hovered?.type === 'srcNode' && hovered.id === src.id ? 600 : 400}
                    fill={FG1} opacity={active ? 1 : 0.4}
                    className="kg-sankey-node-label"
                  >{src.label}</text>
                </g>
              );
            })}

            {/* Contribution bars + labels */}
            {Object.entries(contribNodes).map(([cid, cn]) => {
              const active = isNodeActive('contrib', cid);
              return (
                <g key={cid}
                  onMouseEnter={() => { setHovered({ type: 'contribNode', id: cid }); setTooltip({ text: cn.label, value: contribIn[cid] || 0 }); }}
                  onMouseLeave={() => { setHovered(null); setTooltip(null); }}
                  onClick={e => { e.stopPropagation(); setSelected(p => p?.type === 'contribNode' && p.id === cid ? null : { type: 'contribNode', id: cid }); }}
                  className="kg-sankey-node-group"
                >
                  {/* Transparent hit-rect covers bar + label above */}
                  <rect x={cn.x - 40} y={cn.y - 18} width={NW + 80} height={Math.max(cn.h + 18, 36)} fill="transparent" pointerEvents="all" />
                  <rect x={cn.x} y={cn.y} width={NW} height={Math.max(4, cn.h)} fill={cn.color} rx={1} />
                  <text
                    x={cn.x + NW / 2} y={cn.y - 5} textAnchor="middle"
                    fontFamily="Inter, system-ui, sans-serif" fontSize={11} fontWeight={500}
                    fill={FG1} opacity={active ? 1 : 0.4}
                    className="kg-sankey-node-label"
                  >{cn.label}</text>
                </g>
              );
            })}

            {/* Entity bars + labels */}
            {SK_ENTITIES.map(ent => {
              const n = entNodes[ent.id];
              if (!n) return null;
              const active = isNodeActive('ent', ent.id);
              return (
                <g key={ent.id}
                  onMouseEnter={() => { setHovered({ type: 'entNode', id: ent.id }); setTooltip({ text: ent.label, value: entTotals[ent.id] || 0 }); }}
                  onMouseLeave={() => { setHovered(null); setTooltip(null); }}
                  onClick={e => { e.stopPropagation(); setSelected(p => p?.type === 'entNode' && p.id === ent.id ? null : { type: 'entNode', id: ent.id }); }}
                  className="kg-sankey-node-group"
                >
                  {/* Transparent hit-rect covers bar + full label area to the right */}
                  <rect x={n.x} y={n.y - 2} width={NW + LR - 4} height={Math.max(n.h + 4, 18)} fill="transparent" pointerEvents="all" />
                  <rect x={n.x} y={n.y} width={NW} height={Math.max(2, n.h)} fill={ent.color} rx={1} />
                  <text
                    x={n.x + NW} y={n.y + n.h / 2}
                    textAnchor="start" dominantBaseline="central"
                    fontFamily="Inter, system-ui, sans-serif" fontSize={11}
                    fontWeight={hovered?.type === 'entNode' && hovered.id === ent.id ? 600 : 400}
                    fill={FG1} opacity={active ? 1 : 0.4}
                    className="kg-sankey-node-label"
                  >{ent.label}</text>
                </g>
              );
            })}
          </svg>

          {/* Tooltip — position is DOM-rect/mouse-derived, keep inline */}
          {tooltip && (
            <div
              className="kg-sankey-tooltip"
              style={{
                left: Math.min(mousePos.x + 14, svgW - 230),
                top: Math.max(mousePos.y - 52, 4),
                '--kg-sankey-tooltip-bg': isDark ? 'var(--card-bg, #1C1C1C)' : '#fff',
                '--kg-sankey-tooltip-border': isDark ? '#333' : '#E6E6E6',
                '--kg-sankey-tooltip-color': isDark ? '#D1D1D1' : '#282828',
              }}
            >
              <span className="kg-sankey-tooltip-text">{tooltip.text} : </span>
              <span className="kg-sankey-tooltip-label">
                {tooltip.value.toLocaleString('en-US')}
              </span>
            </div>
          )}

          {/* Filter popup backdrop + panel */}
          {openFilter && (
            <>
              <div
                className="kg-sankey-backdrop"
                onClick={() => setOpenFilter(null)}
              />
              <SankeyFilterPopup
                type={openFilter}
                items={
                  openFilter === 'origin'  ? SK_SOURCES.map(s => ({ id: s.id, label: s.label })) :
                  openFilter === 'contrib' ? [{ id: 'corroborated', label: 'Corroborated' }, { id: 'unique', label: 'Unique' }] :
                  SK_ENTITIES.map(e => ({ id: e.id, label: e.label }))
                }
                selected={
                  openFilter === 'origin'  ? filterOrigin :
                  openFilter === 'contrib' ? filterContrib :
                  filterEntities
                }
                operator={openFilter === 'origin' ? originOperator : undefined}
                anchorX={
                  openFilter === 'origin'  ? layout.srcX + 43 :
                  openFilter === 'contrib' ? layout.contribX + 84 :
                  layout.entX + NW + 8 + 57
                }
                svgW={svgW}
                onClose={() => setOpenFilter(null)}
                onApply={(draft, op) => {
                  if (openFilter === 'origin')  { setFilterOrigin(draft); setOriginOperator(op); }
                  else if (openFilter === 'contrib') setFilterContrib(draft);
                  else setFilterEntities(draft);
                }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Entity KPI card grid — Entities tab view ─────────────────────────
function EntityKpiGrid() {
  const entities = Object.entries(ENTITY_TYPES).sort((a, b) => a[1].label.localeCompare(b[1].label));
  return (
    <div className="kg-kpi-grid">
      {entities.map(([id, def]) => {
            const frags = def.fragments || def.count;
            const pct = frags ? (def.count / frags) * 100 : 100;
            const pctStr = Number.isInteger(pct) ? `${pct}%` : `${pct.toFixed(2)}%`;
            return (
              <div key={id} className="kg-kpi-card">
                <div className="kg-kpi-header">
                  <div className="kg-kpi-icon">
                    <EntityGlyph kind={def.glyph} size={16} />
                  </div>
                  <span className="kg-kpi-label">
                    {def.label}
                  </span>
                </div>
                <div className="kg-kpi-stats">
                  <div className="kg-kpi-stat--resolved">
                    <span className="kg-kpi-stat-label">Resolved</span>
                    <span className="kg-kpi-stat-value">
                      {fmtN(def.count)}{' '}<span className="kg-kpi-stat-pct">({pctStr})</span>
                    </span>
                  </div>
                  <div className="kg-kpi-stat--fragments">
                    <span className="kg-kpi-stat-label">Fragments</span>
                    <span className="kg-kpi-stat-value">
                      {fmtN(frags)}
                    </span>
                  </div>
                </div>
              </div>
            );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// PageKG — composes graph + table + selection state
// ─────────────────────────────────────────────────────────────────────
function PageKG({ focusEntity } = {}) {
  const [summaryTab, setSummaryTab] = useState('Relationships');
  const [summaryCollapsed, setSummaryCollapsed] = useState(false);
  const [selected, setSelected] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelRow, setPanelRow] = useState(null);
  const [panelTab, setPanelTab] = useState('summary');
  const [identityTabUnlocked, setIdentityTabUnlocked] = useState(false);
  const [evoShowHidden, setEvoShowHidden] = useState(false);
  const [evoSourceFilterOpen, setEvoSourceFilterOpen] = useState(false);
  const [checkedSources, setCheckedSources] = useState(() => new Set());
  const [evoSectionEl, setEvoSectionEl] = useState(null);
  const evoSectionRef = useCallback(node => setEvoSectionEl(node), []);
  const [evoSectionW, setEvoSectionW] = useState(400);
  useEffect(() => {
    if (!evoSectionEl) return;
    const ro = new ResizeObserver(es => setEvoSectionW(es[0].contentRect.width));
    ro.observe(evoSectionEl);
    return () => ro.disconnect();
  }, [evoSectionEl]);
  // When `highlightOnly` is true, the selected node gets a visual ring
  // but does NOT dim other nodes/edges or filter the details table.
  // Set when selection comes from a tab switch (Host/Identity).
  const [highlightOnly, setHighlightOnly] = useState(false);
  // Multi-select mode: independent of single-selection. When ON, clicking
  // nodes toggles them in `multiSelected` (a Set of entity ids).
  const [multiMode, setMultiMode] = useState(false);
  const [multiSelected, setMultiSelected] = useState(() => new Set());
  const [hoveredId, setHoveredId] = useState(null);
  const [viewMode, setViewMode] = useState('None');
  const [search, setSearch] = useState('');
  const [tableSearch, setTableSearch] = useState('');
  // Set of edge keys that are currently OFF (deselected). When a node is
  // selected, all its edges start as on (active); user can deselect chips
  // to drop those relationships from the filter without losing them.
  const [deselectedChips, setDeselectedChips] = useState(() => new Set());
  const [reversedChips, setReversedChips] = useState(() => new Set());
  // When an edge is clicked, restrict chips to ONLY that edge. Cleared when
  // a node is clicked (which shows all of its relationships).
  const [selectedEdgeKey, setSelectedEdgeKey] = useState(null);
  const [positions, setPositions] = useState(() => ({ ...NODE_POS }));
  const [view, setView] = useState({ x: 0, y: 0, w: 940, h: 440 });
  const [edges, setEdges] = useState(() => {
    // Prefer persisted edges from tweaks (App writes them onto window before mount)
    const fromTweaks = (window.__floatTweaks && window.__floatTweaks.edges);
    if (Array.isArray(fromTweaks) && fromTweaks.length) {
      return fromTweaks.map(e => [...e]);
    }
    return INITIAL_EDGES.map(e => [...e]);
  });

  // "Explore in Knowledge Graph" deep-link — pre-select the node a caller
  // navigated in for (by entity-type key, falling back to a label match).
  useEffect(() => {
    if (!focusEntity) return;
    const id = ENTITY_TYPES[focusEntity.type]
      ? focusEntity.type
      : Object.keys(ENTITY_TYPES).find(k => ENTITY_TYPES[k].label.toLowerCase() === (focusEntity.label || '').toLowerCase());
    if (id) setSelected(id);
  }, [focusEntity]);

  // Expose edge editing API + entity list to the Tweaks panel
  useEffect(() => {
    window.__kgSetEdges = setEdges;
    window.__kgGetEdges = () => edges;
    window.__kgEntityList = Object.keys(ENTITY_TYPES).map(id => ({
      id, label: ENTITY_TYPES[id].label,
    }));
    window.dispatchEvent(new CustomEvent('kg-edges-changed'));
  }, [edges]);

  // Set of entity ids visible under the current viewMode (used for both
  // chip filtering and auto-clearing stale selections).
  const visibleSetByView = useMemo(() => {
    if (viewMode === 'None') return new Set(Object.keys(ENTITY_TYPES));
    if (viewMode === 'Device')   return new Set(['host']);
    if (viewMode === 'Cloud')    return new Set(['cloudAccount', 'cluster', 'container', 'host', 'netSvc', 'network', 'storage']);
    if (viewMode === 'Identity') return new Set(['person', 'identity', 'account']);
    return new Set(Object.keys(ENTITY_TYPES));
  }, [viewMode]);

  // On tab switch: preserve node selection (chips persist) but drop any edge
  // selection whose endpoints are no longer both visible in the new view.
  // Chip deselections reset so the filter starts fresh in the new context.
  useEffect(() => {
    if (selectedEdgeKey) {
      const [a, b] = splitEdgeKey(selectedEdgeKey);
      if (!visibleSetByView.has(a) || !visibleSetByView.has(b)) {
        setSelectedEdgeKey(null);
      }
    }
    if (highlightOnly) setHighlightOnly(false);
    setDeselectedChips(new Set());
    setReversedChips(new Set());
  }, [viewMode]);

  const zoomBy = (factor) => {
    setView(v => {
      const newW = Math.max(280, Math.min(2200, v.w * factor));
      const newH = newW * (440/940);
      const cx = v.x + v.w / 2, cy = v.y + v.h / 2;
      return { x: cx - newW / 2, y: cy - newH / 2, w: newW, h: newH };
    });
  };
  const resetView = () => setView({ x: 0, y: 0, w: 940, h: 440 });

  // Reset chip state whenever the selected node changes.
  useEffect(() => {
    setDeselectedChips(new Set());
    setReversedChips(new Set());
    // Node-click path clears the edge-only filter; edge-click path sets it
    // immediately AFTER this effect (via setTimeout in onEdgeSelect).
    setSelectedEdgeKey(null);
  }, [selected]);

  // All relationship chips for the selected node — one per connecting edge.
  // When `selectedEdgeKey` is set, restrict to ONLY that edge.
  const relationshipChips = useMemo(() => {
    if (!selected) return [];
    const baseSelectedKey = selectedEdgeKey ? selectedEdgeKey.replace(/#\d+$/, '') : null;
    // For self-loop edges the key carries a #N disambiguator. Extract N so we
    // can return exactly that one self-loop chip instead of one per self-loop.
    const selfLoopIdx = selectedEdgeKey ? Number(selectedEdgeKey.match(/#(\d+)$/)?.[1] ?? -1) : -1;
    const isSelfLoopKey = selfLoopIdx >= 0;

    let candidates = edges
      .filter(([,,,hidden]) => !hidden)
      .filter(([a,b]) => a === selected || b === selected)
      .filter(([a,b]) => !baseSelectedKey || `${a}|${b}` === baseSelectedKey)
      .filter(([a,b]) => {
        const other = a === selected ? b : a;
        return visibleSetByView.has(other);
      });

    // Self-loop: all candidates share the same a===b===selected key, so pick
    // only the one at the clicked petal's index.
    if (isSelfLoopKey) {
      const selfEdges = candidates.filter(([a, b]) => a === b);
      candidates = selfLoopIdx < selfEdges.length ? [selfEdges[selfLoopIdx]] : [];
    }

    return candidates
      .map(([a, b, label, , srcAlias, tgtAlias]) => {
        const reversed = b === selected;  // selected is canonical target → reversed view
        const other = reversed ? a : b;
        const key = `${a}|${b}`;
        // When reversed, the display aliases swap: canonical tgtAlias becomes our
        // source alias and canonical srcAlias becomes our target alias.
        const dispSrcAlias = reversed ? tgtAlias : srcAlias;
        const dispTgtAlias = reversed ? srcAlias : tgtAlias;
        // Find the hidden inverse edge. Direction depends on whether the chip
        // is reversed (selected is canonical target vs source). Also match on
        // the selected-node alias stored in eTgtAlias so ambiguous same-pair
        // edges (e.g. cluster↔container Container Group vs Container Service)
        // resolve to the correct inverse.
        const invEdge = reversed
          ? edges.find(([ea, eb, , eh, , eTgtAlias]) =>
              eh && ea === selected && eb === other &&
              (!dispTgtAlias || !eTgtAlias || dispTgtAlias === eTgtAlias))
          : edges.find(([ea, eb, , eh, , eTgtAlias]) =>
              eh && ea === other && eb === selected &&
              (!srcAlias || !eTgtAlias || srcAlias === eTgtAlias));
        return {
          key,
          source: dispSrcAlias || ENTITY_TYPES[selected]?.label || selected,
          relation: label || 'Connected to',
          target: dispTgtAlias || ENTITY_TYPES[other]?.label || other,
          otherId: other,
          canReverse: !!invEdge,
          invRelation: invEdge ? (invEdge[2] || 'Connected to') : null,
          // invSource/invTarget swap based on invEdge direction (ea/eb swap when reversed).
          invSource: reversed
            ? (invEdge?.[4] || ENTITY_TYPES[selected]?.label || selected)
            : (invEdge?.[4] || ENTITY_TYPES[other]?.label || other),
          invTarget: reversed
            ? (invEdge?.[5] || ENTITY_TYPES[other]?.label || other)
            : (invEdge?.[5] || ENTITY_TYPES[selected]?.label || selected),
        };
      });
  }, [selected, edges, selectedEdgeKey, visibleSetByView]);

  // Build adjacency for selection halo — full set (visual halo always shows
  // all connections of the selected node, regardless of chip state).
  const { neighborSet, neighborEdgeSet } = useMemo(() => {
    if (!selected || highlightOnly) return { neighborSet: new Set(), neighborEdgeSet: new Set() };
    const ns = new Set([selected]);
    const es = new Set();
    edges.forEach(([a,b,,hidden]) => {
      if (hidden) return;
      if (a === selected) { ns.add(b); es.add(`${a}|${b}`); es.add(`${b}|${a}`); }
      else if (b === selected) { ns.add(a); es.add(`${a}|${b}`); es.add(`${b}|${a}`); }
    });
    return { neighborSet: ns, neighborEdgeSet: es };
  }, [selected, edges]);

  // Active neighbor set for FILTERING — only neighbors whose chip is on.
  // Also build active edge set so the graph can dim deselected edges.
  const { activeNeighborSet, activeNeighborEdgeSet } = useMemo(() => {
    if (!selected || highlightOnly) return { activeNeighborSet: new Set(), activeNeighborEdgeSet: new Set() };
    const ns = new Set([selected]);
    const es = new Set();
    relationshipChips.forEach(c => {
      if (!deselectedChips.has(c.key)) {
        ns.add(c.otherId);
        const [a, b] = c.key.split('|');
        es.add(`${a}|${b}`);
        es.add(`${b}|${a}`);
      }
    });
    return { activeNeighborSet: ns, activeNeighborEdgeSet: es };
  }, [selected, relationshipChips, deselectedChips]);

  // Filter rows by selected node OR (if an edge is selected) its active
  // (chip-on) neighbors. With only a node selected, the table is restricted
  // to rows of that entity type — and the chip bar shows a single chip
  // labeled with the node name.
  const filteredRows = useMemo(() => {
    let rs = ROWS;
    if (multiMode && multiSelected.size > 0) {
      // Only filter by entities that are visible in the current view tab.
      const inView = new Set([...multiSelected].filter(t => visibleSetByView.has(t)));
      // If no selection is in-view, show empty table (chips are disabled).
      rs = inView.size > 0 ? rs.filter(r => inView.has(r.type)) : [];
    } else if (selected) {
      if (!visibleSetByView.has(selected)) {
        rs = [];
      } else if (selectedEdgeKey) {
        // Source-entity rows only, capped to the per-edge source count.
        const ec = edgeCountsFor(...splitEdgeKey(selectedEdgeKey));
        rs = rs.filter(r => r.type === selected);
        if (ec && ec[selected] != null) rs = rs.slice(0, ec[selected]);
      } else {
        rs = rs.filter(r => r.type === selected);
      }
    }
    if (tableSearch.trim()) {
      const q = tableSearch.trim().toLowerCase();
      rs = rs.filter(r => {
        const meta = TYPE_TO_TABLE_LABEL[r.type] || {};
        const haystack = [
          r.label, r.type, r.ip, r.last, r.active,
          meta.type, meta.os,
          ...(meta.sources || []),
        ].filter(Boolean).join(' ').toLowerCase();
        return haystack.includes(q);
      });
    }
    return rs;
  }, [selected, selectedEdgeKey, activeNeighborSet, tableSearch, multiMode, multiSelected, highlightOnly, visibleSetByView]);

  // Total count for header.
  // - Multi-select: sum of selected entities that are visible in the current view.
  // - Single-node: entity's own count, but only if visible in the current view.
  // - Otherwise (nothing selected, or selection is out of view): sum of view's entities.
  const totalCount = useMemo(() => {
    if (multiMode && multiSelected.size > 0) {
      const inView = [...multiSelected].filter(t => visibleSetByView.has(t));
      if (inView.length > 0) {
        let sum = 0;
        inView.forEach(t => { if (ENTITY_TYPES[t]) sum += ENTITY_TYPES[t].count; });
        return sum;
      }
      // All selected chips are out of this view.
      return 0;
    }
    if (selected && !visibleSetByView.has(selected)) {
      // Selected entity not in this view — disabled chip, table is empty.
      return 0;
    }
    if (!selected) {
      if (viewMode === 'None') return 15730247;
      let sum = 0;
      visibleSetByView.forEach(k => { if (ENTITY_TYPES[k]) sum += ENTITY_TYPES[k].count; });
      return sum;
    }
    if (selectedEdgeKey) {
      const [ea, eb] = splitEdgeKey(selectedEdgeKey);
      const ec = edgeCountsFor(ea, eb);
      if (ec && ec[selected] != null) return ec[selected];
      return ENTITY_TYPES[selected]?.count ?? 0;
    }
    return ENTITY_TYPES[selected]?.count ?? 0;
  }, [selected, activeNeighborSet, multiMode, multiSelected, highlightOnly, selectedEdgeKey, viewMode, visibleSetByView]);

  return (
    <div className="kg-page-root">
      {/* Summary card */}
      <div className="kg-summary-card">
        {/* Card header */}
        <div className="kg-summary-header">
          <div className="kg-summary-title">Summary</div>
          <div className="kg-summary-spacer" />
          <SegmentedTabs
            value={summaryTab}
            onChange={setSummaryTab}
            options={['Relationships','Entities','Data Sources']}
          />
          <button className="kg-summary-collapse-btn" onClick={() => setSummaryCollapsed(c => !c)}>
            <Ic size={12} path={summaryCollapsed ? <><path d="m6 9 6 6 6-6"/></> : <><path d="m18 15-6-6-6 6"/></>}/>
            {summaryCollapsed ? 'Expand' : 'Collapse'}
          </button>
        </div>

        {!summaryCollapsed && summaryTab === 'Entities' && <EntityKpiGrid />}
        {!summaryCollapsed && summaryTab === 'Data Sources' && <SankeyView />}

        {/* Toolbar — Relationships tab only */}
        {!summaryCollapsed && summaryTab === 'Relationships' && <div className="kg-relationships-toolbar">
          <span className="kg-relationships-label">Attack Surface:</span>
          <ViewTabs value={viewMode} onChange={setViewMode} options={['None','Device','Cloud','Identity']}/>
          <div className="kg-toolbar-spacer" />
          <DSPillSearch value={search} onChange={setSearch} placeholder="Search Nodes" width={220} />
          <button
            onClick={() => {
              setMultiMode(m => {
                const next = !m;
                if (next) {
                  // Turning ON: seed the multi-select set with the currently
                  // selected node (if any) so it stays highlighted and joins
                  // the selection. Don't clear `selected` — we restore it on
                  // the way out.
                  setHighlightOnly(false);
                  setSelectedEdgeKey(null);
                  setMultiSelected(prev => {
                    const seed = new Set(prev);
                    if (selected) seed.add(selected);
                    return seed;
                  });
                } else {
                  // Turning OFF: clear ALL selections.
                  setMultiSelected(new Set());
                  setSelected(null);
                  setSelectedEdgeKey(null);
                  setDeselectedChips(new Set());
                  setReversedChips(new Set());
                  setHighlightOnly(false);
                }
                return next;
              });
            }}
            className={multiMode ? 'kg-multiselect-btn kg-multiselect-btn--on' : 'kg-multiselect-btn kg-multiselect-btn--off'}
          >
            Multi-select{multiMode && multiSelected.size > 0 ? ` (${multiSelected.size})` : ''}
          </button>
          {(() => {
            // Reset is "enabled" (red) when ANY graph change has occurred:
            // selection, search, view tab change, node drag, or zoom/pan.
            const positionsChanged = Object.keys(NODE_POS).some(k => {
              const a = positions[k], b = NODE_POS[k];
              return !a || a.x !== b.x || a.y !== b.y;
            });
            const viewChanged = view.x !== 0 || view.y !== 0 || view.w !== 940 || view.h !== 440;
            const active = !!(selected || selectedEdgeKey || (multiMode && multiSelected.size > 0) || search || positionsChanged || viewChanged);
            return (
              <button
                onClick={() => { setSelected(null); setHighlightOnly(false); setSearch(''); setPositions({ ...NODE_POS }); resetView(); setMultiMode(false); setMultiSelected(new Set()); }}
                className={active ? 'kg-reset-btn kg-reset-btn--active' : 'kg-reset-btn kg-reset-btn--idle'}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8.00178 10.5582C8.99928 10.5582 9.79262 9.76371 9.79262 8.7674C9.79262 7.7711 8.99928 6.97656 8.00178 6.97656C7.00428 6.97656 6.21094 7.7711 6.21094 8.7674C6.21094 9.76371 7.00428 10.5582 8.00178 10.5582Z" fill="currentColor"/>
                  <path d="M3.26953 8.76914C3.26953 9.70481 3.54697 10.6195 4.06676 11.3974C4.58655 12.1754 5.32534 12.7818 6.18972 13.1399C7.05409 13.4979 8.00523 13.5916 8.92285 13.4091C9.84047 13.2265 10.6834 12.776 11.3449 12.1143C12.0065 11.4527 12.457 10.6098 12.6395 9.69208C12.8221 8.77439 12.7284 7.82317 12.3704 6.95873C12.0123 6.09428 11.406 5.35543 10.6281 4.8356C9.87356 4.3314 8.99047 4.05522 8.08433 4.03906" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7.7998 5.61719L5.6875 4.02246L7.7998 2.42773V5.61719Z" fill="currentColor" stroke="currentColor" strokeWidth="0.555556"/>
                </svg>
                Reset
              </button>
            );
          })()}
        </div>}

        {/* Graph + zoom rail — Relationships tab only */}
        {!summaryCollapsed && summaryTab === 'Relationships' && <div className="kg-relationships-canvas-wrap">
          <GraphCanvas
            selected={selected}
            selectedEdgeKey={selectedEdgeKey}
            highlightOnly={highlightOnly}
            multiSelectedSet={multiMode ? multiSelected : null}
            panelOpen={false}
            onSelect={(id) => {
              if (multiMode) {
                if (id === null) return;
                setMultiSelected(prev => {
                  const next = new Set(prev);
                  if (next.has(id)) next.delete(id); else next.add(id);
                  return next;
                });
                return;
              }
              // In highlight-only mode (Host/Identity/Cloud tab), clicking a
              // node breaks out of highlight-only and selects that node normally.
              // Clicking the hero node itself just clears (toggle off).
              if (highlightOnly) {
                if (id === null) return;  // empty-canvas click is handled below
                setHighlightOnly(false);
                setSelected(prev => prev === id ? null : id);
                return;
              }
              // If we're on a tab with a hero node and the user clicks empty
              // canvas (id === null), restore the hero selection in highlight-only mode.
              const heroByTab = {};
              if (id === null && heroByTab[viewMode]) {
                setSelected(heroByTab[viewMode]);
                setHighlightOnly(true);
                setSelectedEdgeKey(null);
                setDeselectedChips(new Set());
                setReversedChips(new Set());
                return;
              }
              setSelected(prev => prev === id ? null : id);
            }}
            onEdgeSelect={(a, b, key) => {
              setHighlightOnly(false);
              const heroByTab = {};
              // Re-clicking the already-selected edge clears the selection.
              // On Host/Identity tab, restore the hero in highlight-only mode.
              if (selectedEdgeKey === key) {
                if (heroByTab[viewMode]) {
                  setSelected(heroByTab[viewMode]);
                  setHighlightOnly(true);
                  setSelectedEdgeKey(null);
                  setDeselectedChips(new Set());
                  setReversedChips(new Set());
                } else {
                  setSelected(null);
                  setSelectedEdgeKey(null);
                }
                return;
              }
              // Pick the non-'finding' endpoint as primary selection so the
              // graph centers on a meaningful entity. Then restrict chips/
              // highlights to ONLY this edge.
              const primary = (a === 'finding' && b !== 'finding') ? b : a;
              setSelected(primary);
              // Defer so the selected-change effect (which clears state) runs first.
              setTimeout(() => setSelectedEdgeKey(key), 0);
            }}
            neighborSet={activeNeighborSet}
            neighborEdgeSet={activeNeighborEdgeSet}
            edgeSelectionEndpoints={selectedEdgeKey ? new Set(splitEdgeKey(selectedEdgeKey)) : null}
            hoveredId={hoveredId}
            setHoveredId={setHoveredId}
            viewMode={viewMode}
            positions={positions}
            setPositions={setPositions}
            view={view}
            setView={setView}
            edges={edges}
            search={search}
          />
          {/* Bottom-left rail: zoom in / zoom out */}
          <div className="kg-zoom-rail-abs">
            <RailBtn onClick={() => zoomBy(0.8)} icon={<Ic size={14} path={<><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/><path d="M11 8v6M8 11h6"/></>}/>}/>
            <RailBtn onClick={() => zoomBy(1.25)} icon={<Ic size={14} path={<><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/><path d="M8 11h6"/></>}/>}/>
          </div>
          {/* Bottom-left zoom indicator (hidden) */}
          {/* <ZoomIndicator view={view}/> */}
        </div>}

        {/* Footer chip bar — relationships of selection */}
        {!summaryCollapsed && summaryTab === 'Relationships' && (() => {
          if (multiMode) {
            if (multiSelected.size > 0) {
              return (
                <MultiSelectChipBar
                  ids={[...multiSelected]}
                  visibleSet={visibleSetByView}
                  onRemove={(id) => {
                    setMultiSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
                  }}
                  onClear={() => setMultiSelected(new Set())}
                />
              );
            }
            return <EmptyChipBar message="Click nodes to filter the details table." />;
          }
          if (selected) {
            const selDef = ENTITY_TYPES[selected];
            const selectedLabel = selDef ? selDef.label : selected;
            const selectedInView = visibleSetByView.has(selected);
            // When a node is selected but no edge is selected, show a single
            // node chip. When an edge is selected, show the relationship chips.
            if (!selectedEdgeKey) {
              return (
                <FilterChipBar
                  chips={relationshipChips}
                  deselected={deselectedChips}
                  selectedLabel={selectedLabel}
                  selectedCount={selDef ? selDef.count : 0}
                  nodeOnly={true}
                  nodeDisabled={!selectedInView}
                  onClearNode={(highlightOnly && selectedInView) ? null : () => { setSelected(null); setSelectedEdgeKey(null); setDeselectedChips(new Set()); }}
                  onToggle={(k) => {
                    setDeselectedChips(prev => {
                      const n = new Set(prev);
                      if (n.has(k)) n.delete(k); else n.add(k);
                      return n;
                    });
                  }}
                />
              );
            }
            return (
              <FilterChipBar
                chips={relationshipChips}
                deselected={deselectedChips}
                reversed={reversedChips}
                selectedLabel={selectedLabel}
                selectedCount={selDef ? selDef.count : 0}
                onToggle={(k) => {
                  setDeselectedChips(prev => {
                    const n = new Set(prev);
                    if (n.has(k)) n.delete(k); else n.add(k);
                    return n;
                  });
                }}
                onReverse={(k) => {
                  setReversedChips(prev => {
                    const n = new Set(prev);
                    if (n.has(k)) n.delete(k); else n.add(k);
                    return n;
                  });
                }}
              />
            );
          }
          return <EmptyChipBar message="Click nodes to filter the details table." />;
        })()}

      </div>


      <DetailsTable rows={filteredRows} totalCount={totalCount}
                    search={tableSearch} onSearch={setTableSearch}
                    onRowClick={(row) => {
                      setPanelRow(row); setPanelOpen(true); setPanelTab('summary');
                      setIdentityTabUnlocked(false); setCheckedSources(new Set());
                    }}/>

      {/* ── Panel backdrop ── */}
      <div
        className={panelOpen ? 'kg-panel-backdrop kg-panel-backdrop--open' : 'kg-panel-backdrop'}
        onClick={() => setPanelOpen(false)}
      />

      {/* ── External close button — sits to the left of the panel, matching the Assessment drawer ── */}
      {panelOpen && (
        <button className="kg-dp-close-ext" onClick={() => setPanelOpen(false)}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
            <line x1="1" y1="1" x2="9" y2="9"/><line x1="9" y1="1" x2="1" y2="9"/>
          </svg>
        </button>
      )}

      {/* ── Detail slide-over panel ── */}
      <div className={panelOpen ? 'kg-detail-panel kg-detail-panel--open' : 'kg-detail-panel'}>
        {panelRow && (() => {
          const meta = TYPE_TO_TABLE_LABEL[panelRow.type] || {};
          const ent  = ENTITY_TYPES[panelRow.type]        || {};
          return (
            <>
              {/* Panel header */}
              <div className="kg-dp-header">
                <div className="kg-dp-title-row">
                  <div className="kg-dp-icon-circle" style={{ '--dp-tint': ent.tint || 'var(--pai-bg-raised)', '--dp-stroke': ent.stroke || 'var(--shell-border)' }}>
                    <EntityGlyph kind={meta.glyph} size={22} />
                  </div>
                  <div className="kg-dp-title-body">
                    <div className="kg-dp-name-row">
                      <span className="kg-dp-name">{panelRow.label}</span>
                      <span className="kg-dp-type-chip" style={{ '--dp-chip-border': ent.stroke || 'var(--shell-border)', '--dp-chip-color': ent.icon || 'var(--pai-indigo)' }}>
                        {meta.type || panelRow.type}
                      </span>
                    </div>
                    <div className="kg-dp-meta-row">
                      <span className="kg-dp-meta-item">IP: <strong>{panelRow.ip}</strong></span>
                      <span className="kg-dp-meta-item">OS: <strong>{meta.os}</strong></span>
                      <span className="kg-dp-meta-item">Last Active: <strong>{panelRow.active}</strong></span>
                    </div>
                  </div>
                </div>

                <EntityRelSummaryGraph
                  center={{
                    label: panelRow.label,
                    icon: <EntityGlyph kind={meta.glyph} size={16} />,
                    accent: ent.icon || 'var(--pai-indigo)',
                  }}
                  leaves={[
                    {
                      key: 'finding',
                      label: 'Finding',
                      icon: <EntityGlyph kind="finding" size={16} />,
                      tint: ENTITY_TYPES.finding.tint,
                      stroke: ENTITY_TYPES.finding.stroke,
                      accent: ENTITY_TYPES.finding.icon,
                      count: fmtN(ent.count || 0),
                    },
                    {
                      key: 'identity',
                      label: 'Identity',
                      icon: <EntityGlyph kind="identity" size={16} />,
                      tint: ENTITY_TYPES.identity.tint,
                      stroke: ENTITY_TYPES.identity.stroke,
                      accent: ENTITY_TYPES.identity.icon,
                      count: 1,
                      onClick: () => { setIdentityTabUnlocked(true); setPanelTab('identity'); },
                      testId: 'mini-graph-identity-node',
                    },
                  ]}
                />
              </div>

              {/* Tabs */}
              <div className="kg-dp-tabs">
                {['summary', 'evolution', ...(identityTabUnlocked ? ['identity'] : []), 'derivation'].map(t => (
                  <button
                    key={t}
                    onClick={() => setPanelTab(t)}
                    className={panelTab === t ? 'kg-dp-tab kg-dp-tab--active' : 'kg-dp-tab'}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Panel body */}
              <div className="kg-dp-body">
                {panelTab === 'summary' && (
                  <>
                    <div className="kg-dp-section">
                      <div className="kg-dp-section-header">General Information</div>
                      <div className="kg-dp-grid">
                        {[
                          ['Display Label', panelRow.label],
                          ['Type',          meta.type || panelRow.type],
                          ['OS Family',     meta.os],
                          ['IP Address',    panelRow.ip],
                          ['Last Found',    panelRow.last],
                          ['Last Active',   panelRow.active],
                        ].map(([k, v]) => (
                          <div key={k} className="kg-dp-grid-cell">
                            <div className="kg-dp-grid-key">{k}</div>
                            <div className="kg-dp-grid-val">{v}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="kg-dp-section">
                      <div className="kg-dp-section-header">Data Sources</div>
                      <div className="kg-dp-sources-row">
                        {(meta.sources || []).map((s, i) => <SourceBadge key={i} src={s} />)}
                      </div>
                    </div>

                    <div className="kg-dp-section">
                      <div className="kg-dp-section-header kg-dp-section-header--flex">
                        <span>Findings</span>
                        <span className="kg-dp-findings-count">({fmtN(ent.count || 0)})</span>
                      </div>
                      <div className="kg-dp-sev-list">
                        {[
                          { label: 'Critical', pct: 4,  color: 'var(--pai-crit-fg)' },
                          { label: 'High',     pct: 21, color: 'var(--pai-red-high)' },
                          { label: 'Medium',   pct: 68, color: 'var(--pai-red-high)' },
                          { label: 'Low',      pct: 7,  color: 'var(--pai-green)' },
                        ].map(s => (
                          <div key={s.label} className="kg-dp-sev-row">
                            <span className="kg-dp-sev-label">{s.label}</span>
                            <div className="kg-dp-sev-track">
                              <div className="kg-dp-sev-fill" style={{ '--sev-pct': `${s.pct}%`, '--sev-color': s.color }} />
                            </div>
                            <span className="kg-dp-sev-count">
                              {Math.floor((ent.count || 0) * s.pct / 100).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {panelTab === 'evolution' && (() => {
                  const sources = meta.sources || [];
                  const primarySource = sources.find(s => SOURCE_NAMES[s]);
                  const sourceLabel = SOURCE_NAMES[primarySource] || 'Unknown Source';
                  const sourceItems = sources.filter(s => SOURCE_NAMES[s]).map(s => ({ id: s, label: SOURCE_NAMES[s] }));
                  const evoRows = [
                    ['Display Label', panelRow.label],
                    ['Type',          meta.type || panelRow.type],
                    ['OS Family',     meta.os],
                    ['IP Address',    panelRow.ip],
                    ['Last Found',    panelRow.last],
                    ['Last Active',   panelRow.active],
                  ];
                  return (
                    <div className="kg-dp-section" ref={evoSectionRef} style={{ position: 'relative' }}>
                      <div className="kg-dp-section-header kg-dp-section-header--flex">
                        <span>Evolution</span>
                        <button
                          className="kg-dp-icon-btn"
                          title="Data Source Filter"
                          onClick={() => {
                            setCheckedSources(new Set(primarySource ? [primarySource] : []));
                            setEvoSourceFilterOpen(true);
                          }}
                        >
                          {Icons.filter}
                        </button>
                      </div>
                      <div className="ds-table-wrap">
                        <table className="ds-table">
                          <thead>
                            <tr>
                              <th className="ds-th">Attribute</th>
                              <th className="ds-th">
                                <div className="kg-dp-evo-resolved-head">
                                  Resolved
                                  <button className="kg-dp-evo-hidden-btn" onClick={() => setEvoShowHidden(v => !v)}>
                                    {evoShowHidden ? 'Hide' : 'Show Hidden'}
                                  </button>
                                </div>
                              </th>
                              <th className="ds-th">
                                <div className="kg-dp-evo-src-head">
                                  <span>{sourceLabel}</span>
                                  <span className="kg-dp-evo-latest-badge">Latest</span>
                                </div>
                                <div className="kg-dp-evo-src-date">[{panelRow.last}]</div>
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {evoRows.map(([k, v]) => (
                              <tr key={k}>
                                <td className="ds-td">{k}</td>
                                <td className="ds-td" style={{ fontWeight: 600 }}>
                                  {v}
                                  {evoShowHidden && primarySource && <span className="kg-dp-evo-hidden-tag">{primarySource}</span>}
                                </td>
                                <td className="ds-td">{v}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {evoSourceFilterOpen && (
                        <SankeyFilterPopup
                          type="source"
                          items={sourceItems}
                          selected={checkedSources}
                          onApply={(draft) => setCheckedSources(draft)}
                          onClose={() => setEvoSourceFilterOpen(false)}
                          anchorX={evoSectionW - 20}
                          svgW={evoSectionW}
                        />
                      )}
                    </div>
                  );
                })()}

                {panelTab === 'identity' && (
                  <>
                    <div className="kg-dp-section">
                      <div className="kg-dp-section-header">Identity Summary</div>
                      <div className="kg-dp-identity-rings">
                        {IDENTITY_RINGS.map(ring => (
                          <div key={ring.key} className="kg-dp-ring-col">
                            <div className="kg-dp-ring-wrap">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={[{ v: 1 }]}
                                    dataKey="v"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius="68%"
                                    outerRadius="90%"
                                    startAngle={90}
                                    endAngle={450}
                                    cornerRadius={4}
                                    strokeWidth={0}
                                  >
                                    <Cell fill={ring.color} />
                                  </Pie>
                                </PieChart>
                              </ResponsiveContainer>
                              <div className="kg-dp-ring-num">1</div>
                            </div>
                            <div className="kg-dp-ring-label">{ring.key}</div>
                            <div className="kg-dp-ring-value">
                              <span className="kg-dp-ring-dot" style={{ background: ring.color }} />
                              {ring.value}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="kg-dp-section">
                      <div className="kg-dp-section-header kg-dp-section-header--flex">
                        <span>Relationship Summary (1)</span>
                        <button className="ds-btn sz-sm t-primary">
                          Download {Icons.chevron}
                        </button>
                      </div>
                      <div className="ds-table-wrap">
                        <table className="ds-table">
                          <thead>
                            <tr>
                              {['Display Label', 'Activity Status', 'Operational Status', 'Ownership', 'Identity Provider', 'Successful Login Location', 'Origin', 'First Seen', 'Duration', 'Recency'].map(h => (
                                <th key={h} className="ds-th">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="ds-td">{IDENTITY_RELATION_ROW.label}</td>
                              <td className="ds-td"><span className="ds-badge success">{IDENTITY_RELATION_ROW.activity}</span></td>
                              <td className="ds-td">{IDENTITY_RELATION_ROW.operational}</td>
                              <td className="ds-td">{IDENTITY_RELATION_ROW.ownership}</td>
                              <td className="ds-td">{IDENTITY_RELATION_ROW.provider}</td>
                              <td className="ds-td">{IDENTITY_RELATION_ROW.loginLocation}</td>
                              <td className="ds-td">{IDENTITY_RELATION_ROW.origin}</td>
                              <td className="ds-td">{IDENTITY_RELATION_ROW.firstSeen}</td>
                              <td className="ds-td">{IDENTITY_RELATION_ROW.duration}</td>
                              <td className="ds-td">{IDENTITY_RELATION_ROW.recency}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}

                {panelTab === 'derivation' && (
                  <div className="kg-dp-empty-tab">
                    Derivation graph for <strong>{panelRow.label}</strong>.<br/>
                    Shows how this entity was resolved from source fragments.
                  </div>
                )}
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}

// ── Segmented tabs (large) ───────────────────────────────────────────
// Visual style adapted from the design system's dual-toggle: pill track
// with a sliding indigo thumb and label color that flips on the active
// segment.
function SegmentedTabs({ value, options, onChange, fullWidth, height = 32 }) {
  const containerRef = useRef(null);
  const btnRefs = useRef([]);
  const labelRefs = useRef([]);
  const [thumb, setThumb] = useState({ left: 3, width: 0 });

  useEffect(() => {
    const idx = options.indexOf(value);
    const btn = btnRefs.current[idx];
    if (btn) {
      // Thumb fills the active tab exactly — container has no padding,
      // so the pill spans the full button bounds.
      setThumb({ left: btn.offsetLeft, width: btn.offsetWidth });
    }
  }, [value, options.join('|')]);

  return (
    <div
      ref={containerRef}
      className={fullWidth ? 'kg-seg-tabs kg-seg-tabs--full' : 'kg-seg-tabs'}
      style={{ '--kg-seg-height': `${height}px` }}
    >
      {/* sliding white thumb — sized to match active segment */}
      <div
        className="kg-seg-thumb"
        style={{
          left: thumb.left,
          width: thumb.width,
          opacity: thumb.width ? 1 : 0,
        }}
      />
      {options.map((o, i) => {
        const active = o === value;
        // Dividers between segments are hidden — the sliding thumb already
        // indicates active state clearly enough on its own.
        const showDivider = false;
        return (
          <button
            key={o}
            ref={el => btnRefs.current[i] = el}
            onClick={() => onChange && onChange(o)}
            className={[
              'kg-seg-btn',
              active ? 'kg-seg-btn--active' : '',
              !onChange ? 'kg-seg-btn--no-change' : '',
              fullWidth ? 'kg-seg-btn--full' : '',
            ].filter(Boolean).join(' ')}
          >
            {showDivider && <span className="kg-seg-divider" />}
            <span ref={el => labelRefs.current[i] = el}>{o}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── View tabs (None / Device / Cloud / Identity) — segmented-tab style ──
function ViewTabs({ value, onChange, options }) {
  return <SegmentedTabs value={value} options={options} onChange={onChange} />;
}

// ── Empty state overlay (centered on canvas) ────────────────────────
function EmptyOverlay({ icon, title, subtitle }) {
  return (
    <div className="kg-empty-overlay-wrap">
      <div className="kg-empty-overlay-box">
        <div className="kg-empty-overlay-icon">{icon}</div>
        <div className="kg-empty-overlay-title">{title}</div>
        <div className="kg-empty-overlay-subtitle">{subtitle}</div>
      </div>
    </div>
  );
}

function RailBtn({ icon, onClick }) {
  return (
    <button
      onClick={onClick}
      className="kg-rail-btn-abs"
    >{icon}</button>
  );
}

// ── Zoom level indicator (bottom-left) ───────────────────────────────
// view.w == 940 corresponds to 100%. Smaller w  = zoomed in.
function ZoomIndicator({ view }) {
  const pct = Math.round((940 / view.w) * 100);
  return (
    <div className="kg-zoom-indicator-abs">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="7"/>
        <path d="m21 21-4.3-4.3"/>
      </svg>
      <span>{pct}%</span>
    </div>
  );
}

// ── Filter chip bar — relationships of the selected node ────────────
// ── Empty chip bar — default state messaging ─────────────────────────
function EmptyChipBar({ message }) {
  return (
    <div className="kg-chipbar">
      <span className="kg-chipbar__hint">{message}</span>
    </div>
  );
}

// ── Multi-select chip bar — chips for each multi-selected entity ────
function MultiSelectChipBar({ ids, visibleSet, onRemove, onClear }) {
  return (
    <div className="kg-chipbar">
      <span className="kg-chipbar__label">Details table filtered by:</span>
      <div className="kg-chipbar__scroll">
        {ids.map(id => {
          const def = ENTITY_TYPES[id];
          if (!def) return null;
          const disabled = visibleSet && !visibleSet.has(id);
          return (
            <span
              key={id}
              className={disabled ? 'kg-entity-chip kg-entity-chip--disabled' : 'kg-entity-chip'}
            >
              <span>{def.label} <span>({fmtN(def.count)})</span></span>
              <button
                onClick={() => onRemove(id)}
                aria-label={`Remove ${def.label}`}
                className={disabled ? 'kg-entity-chip__remove-btn kg-entity-chip__remove-btn--disabled' : 'kg-entity-chip__remove-btn'}
              >
                <Ic size={10} path={<><path d="M18 6 6 18M6 6l12 12"/></>} />
              </button>
            </span>
          );
        })}
      </div>
      <button onClick={onClear} className="kg-chipbar__clear-btn">Clear</button>
    </div>
  );
}

function FilterChipBar({ chips, deselected, reversed = new Set(), selectedLabel, selectedCount, onToggle, onReverse, nodeOnly, nodeDisabled, onClearNode }) {
  if (nodeOnly) {
    return (
      <div className="kg-chipbar">
        <span className="kg-chipbar__label">Details table filtered by:</span>
        <div className={[
          'kg-entity-chip',
          nodeDisabled ? 'kg-entity-chip--disabled' : '',
          !onClearNode ? 'kg-entity-chip--no-close' : '',
        ].filter(Boolean).join(' ')}>
          <span>{selectedLabel} <span>({fmtN(selectedCount)})</span></span>
          {onClearNode && (
            <button
              onClick={onClearNode}
              aria-label={`Remove ${selectedLabel}`}
              className={nodeDisabled ? 'kg-entity-chip__remove-btn kg-entity-chip__remove-btn--disabled' : 'kg-entity-chip__remove-btn'}
            >
              <Ic size={10} path={<><path d="M18 6 6 18M6 6l12 12"/></>} />
            </button>
          )}
        </div>
      </div>
    );
  }
  if (chips.length === 0) {
    return (
      <div className="kg-chipbar">
        <span className="kg-chipbar__no-rel">
          <strong className="kg-chipbar__no-rel-name">{selectedLabel}</strong> has no relationships in this view.
        </span>
      </div>
    );
  }
  return (
    <div className="kg-chipbar">
      <span className="kg-chipbar__label">Details table filtered by:</span>
      <div className="kg-chipbar__scroll">
        {chips.map(c => {
          if (deselected.has(c.key)) return null;
          const isRev = reversed.has(c.key);
          const dispSrc    = isRev ? c.invSource   : c.source;
          const dispRel    = isRev ? c.invRelation  : c.relation;
          const dispTgt    = isRev ? c.invTarget    : c.target;
          return (
            <span key={c.key} className="kg-rel-chip-new">
              <span className="kg-rel-chip__inner">
                <span className="kg-rel-chip__src-text">{dispSrc}</span>
                <span className="kg-rel-chip__rel-text">{dispRel}</span>
                <span className="kg-rel-chip__tgt-text">{dispTgt}</span>
              </span>
              {onReverse && c.canReverse && (
                <button
                  onClick={() => onReverse(c.key)}
                  aria-label="Reverse relationship"
                  title={isRev ? 'Show original relationship' : 'Show inverse relationship'}
                  className={isRev ? 'kg-rel-chip__reverse-btn kg-rel-chip__reverse-btn--active' : 'kg-rel-chip__reverse-btn kg-rel-chip__reverse-btn--inactive'}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 1l4 4-4 4"/>
                    <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                    <path d="M7 23l-4-4 4-4"/>
                    <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                  </svg>
                </button>
              )}
              <button
                onClick={() => onToggle(c.key)}
                aria-label="Remove filter"
                className="kg-rel-chip__close-btn"
              >
                <Ic size={10} path={<><path d="M18 6 6 18M6 6l12 12"/></>} />
              </button>
            </span>
          );
        })}
      </div>
    </div>
  );
}

export { PageKG, SegmentedTabs };

// ── HoverTooltip ─────────────────────────────────────────────────────
function HoverTooltip({ nodeId, edgeKey, mousePos, edges }) {
  const isDark = useDark();
  // Find context
  let kind = null, content = null;
  if (nodeId) {
    const def = ENTITY_TYPES[nodeId];
    kind = 'node';
    const headerBg = isDark ? (def.tintDark || def.tint) : def.tint + '40';
    content = (
      <div>
        <div
          className="kg-hover-tooltip__node-header"
          style={{ '--kg-tooltip-node-header-bg': headerBg }}
        >
          <div className="kg-hover-tooltip__node-icon">
            <EntityGlyph kind={def.glyph} size={18} />
          </div>
          <div
            className="kg-hover-tooltip__node-label"
            style={{ '--kg-tooltip-node-label-color': def.icon || def.stroke }}
          >{def.label}</div>
        </div>
        <div className="kg-hover-tooltip__body">
          <Row k="Entity Count" v={fmtN(def.count)} />
          <Row k="Fragments" v={fmtN(def.fragments || def.count)} />
          <Row k="Resolved (%)" v={(() => {
            const frags = def.fragments || def.count;
            if (!frags) return '—';
            const pct = (def.count / frags) * 100;
            return `${Number.isInteger(pct) ? pct : pct.toFixed(2)}%`;
          })()} />
        </div>
      </div>
    );
  } else if (edgeKey) {
    const [a, b] = splitEdgeKey(edgeKey);
    // Self-loops carry a `#N` disambiguator — pick the Nth matching edge.
    const isSelf = a === b;
    const selfIdx = (() => {
      const m = /#(\d+)$/.exec(edgeKey || '');
      return m ? parseInt(m[1], 10) : 0;
    })();
    let edgeDef;
    if (isSelf) {
      let n = 0;
      edgeDef = (edges || []).find(([x,y]) => {
        if (x === a && y === b) { if (n === selfIdx) return true; n++; }
        return false;
      });
    } else {
      edgeDef = (edges || []).find(([x,y]) => (x===a&&y===b) || (x===b&&y===a));
    }
    if (!edgeDef) return null;
    const [src, tgt, rel] = edgeDef;
    const srcDef = ENTITY_TYPES[src], tgtDef = ENTITY_TYPES[tgt];
    // Per-edge alias overrides — position 4 = source alias, position 5 = target alias.
    // Only swap aliases for *non-self* edges that are reversed relative to the hovered key.
    const reversed = !isSelf && (edgeDef[0] === b && edgeDef[1] === a);
    const srcAlias = reversed ? edgeDef[5] : edgeDef[4];
    const tgtAlias = reversed ? edgeDef[4] : edgeDef[5];
    const srcLabel = srcAlias || srcDef.label;
    const tgtLabel = tgtAlias || tgtDef.label;
    kind = 'edge';
    content = (
      <div>
        <div className="kg-hover-tooltip__edge-header">
          {srcLabel} <span className="kg-hover-tooltip__edge-rel">{rel || 'connected to'}</span> {tgtLabel}
        </div>
        <div className="kg-hover-tooltip__edge-body">
          <Row k="Source Entity" v={srcLabel} />
          <Row k="Target Entity" v={tgtLabel} />
          <Row k="Relationship Count" v={'2'} />
        </div>
      </div>
    );
  }
  if (!content) return null;

  // Position with offset from mouse, clamped to container
  const left = Math.min(mousePos.x + 16, 760);
  const top = Math.min(mousePos.y + 16, 320);

  return (
    <div className="kg-hover-tooltip" style={{ left, top }}>
      {content}
    </div>
  );
}

function Row({ k, v }) {
  return (
    <div className="kg-row">
      <span className="kg-row__key">{k}</span>
      <span className="kg-row__val">{v}</span>
    </div>
  );
}

// ── SelectionPanel — pinned right-side panel showing selected entities ───
function SelectionPanel({ ids, onRemove }) {
  const isDark = useDark();
  if (!ids || ids.length === 0) return null;
  return (
    <div className="kg-sel-panel">
      <div className="kg-sel-panel__header">
        Details table filtered by:
      </div>
      <div className="kg-sel-panel__body">
        {ids.map((id, idx) => {
          const def = ENTITY_TYPES[id];
          if (!def) return null;
          const accent = def.icon || def.stroke;
          const headerBg = isDark ? (def.tintDark || def.tint) : def.tint + '40';
          return (
            <div key={id} className={idx === 0 ? 'kg-sel-panel__item' : 'kg-sel-panel__item kg-sel-panel__item--bordered'}>
              <div
                className="kg-sel-panel__item-header"
                style={{ '--kg-sel-item-bg': headerBg }}
              >
                <div className="kg-sel-panel__item-icon">
                  <EntityGlyph kind={def.glyph} size={18} />
                </div>
                <div
                  className="kg-sel-panel__item-label"
                  style={{ '--kg-sel-item-color': accent }}
                >{def.label}</div>
                <button
                  onClick={() => onRemove(id)}
                  aria-label="Deselect"
                  className="kg-sel-panel__deselect-btn"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                </button>
              </div>
              <div className="kg-sel-panel__item-stats">
                <Row k="Entity Count" v={fmtN(def.count)} />
                <Row k="Fragments" v={fmtN(def.fragments || def.count)} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
