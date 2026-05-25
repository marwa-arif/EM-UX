// PageKG — Knowledge Graph view.
// Layout: Summary card (top, with view toggle + node search), graph canvas (SVG),
// then the filtered Details table.

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { PAI, Icons, Ic } from '../ui.jsx';

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
      style={{ display: 'block', pointerEvents: 'none' }}
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
      style={{ cursor: dragging ? 'grabbing' : 'grab', opacity, transition: dragging ? 'none' : 'opacity 150ms cubic-bezier(.2,.8,.2,1)' }}
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
        style={{ transition: 'all 150ms cubic-bezier(.2,.8,.2,1)' }}
      />
      {/* Count badge top-right (auto-sized) */}
      {(() => {
        const txt = fmtN(countOverride != null ? countOverride : def.count);
        // Approximate width: 5.5px per char at 10px Inter, plus padding.
        const w = Math.max(36, txt.length * 5.5 + 12);
        return (
          <g transform={`translate(${r-2},${-r+2})`}>
            <rect x={-w/2} y="-8" rx="8" ry="8" width={w} height="16"
                  style={{ fill: badgeBg, stroke: 'var(--border)', strokeWidth: 1 }} />
            <text textAnchor="middle" dominantBaseline="central" y="0.5"
                  fontFamily="Inter, system-ui, sans-serif" fontWeight="600"
                  style={{ fontSize: 10, fill: 'var(--fg-2)', fontVariantNumeric: 'tabular-nums' }}>
              {txt}
            </text>
          </g>
        );
      })()}
      {GLYPH_TO_FILE[def.glyph] && (
        <image x={-11} y={-11} width={22} height={22} href={`/assets/icons/${GLYPH_TO_FILE[def.glyph]}`} pointerEvents="none" />
      )}
      <text
        x="0" y={r + 14}
        textAnchor="middle"
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight={selected ? 600 : 500}
        style={{
          fontSize: 11,
          fill: selected ? accent : 'var(--fg-2, #282828)',
          letterSpacing: '0.01em',
        }}
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
    <g style={{ opacity, transition: 'opacity 150ms cubic-bezier(.2,.8,.2,1)' }}
       onMouseEnter={() => onEdgeHover && onEdgeHover(edgeKey)}
       onMouseLeave={() => onEdgeHover && onEdgeHover(null)}
       onClick={(e) => { if (!onEdgeClick) return; e.stopPropagation(); onEdgeClick(a, b, edgeKey); }}
    >
      {/* invisible thick hit area for easier hovering */}
      <line x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="transparent" strokeWidth="10"
            style={{ cursor: onEdgeClick ? 'pointer' : 'default' }}
      />
      <line x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={selected ? 'var(--pai-indigo)' : (isHovered ? 'var(--pai-indigo-muted)' : (isNodeHovered ? 'var(--pai-indigo-muted)' : stroke))}
            strokeWidth={selected ? 1.6 : (isHovered ? 1.6 : (isNodeHovered ? 1.8 : strokeW))}
            strokeDasharray={selected ? 'none' : '0'}
            style={{ transition: 'stroke 150ms, stroke-width 150ms', pointerEvents: 'none' }}
      />
      {label && (() => {
        const lbl = label.length > 22 ? label.slice(0, 20) + '\u2026' : label;
        return (
          <g transform={`translate(${mx},${my})`} style={{ pointerEvents: 'none' }}>
            <title>{label}</title>
            <rect x={-(lbl.length * 2.9 + 6)} y="-7" width={lbl.length * 5.8 + 12} height="14" rx="3"
                  style={{ fill: 'var(--card-bg)', stroke: 'none' }} />
            <text textAnchor="middle" dominantBaseline="central"
                  fontFamily="Inter, system-ui, sans-serif" fontWeight={selected ? 600 : 400}
                  style={{ fontSize: 9.5, fill: selected ? 'var(--pai-indigo)' : 'var(--shell-text-muted, #8A8A8A)' }}>
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

  // Pixel-space padding so the node circle (r≈22) and its label stay fully visible.
  const PAD_X = 30, PAD_TOP = 30, PAD_BOT = 44;

  // Convert client (mouse) coords → SVG viewBox coords.
  const toSvgPoint = (clientX, clientY) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = clientX; pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const p = pt.matrixTransform(ctm.inverse());
    return { x: p.x, y: p.y };
  };

  // Live SVG bounding rect in client pixels — re-read every drag tick.
  const svgRect = () => {
    const svg = svgRef.current;
    return svg ? svg.getBoundingClientRect() : { left: 0, top: 0, right: 0, bottom: 0 };
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
        // Project the SVG's actual visible client rect into viewBox coords so the
        // clamp tracks the true canvas boundary at any container size or zoom level.
        const r = svgRect();
        const tl = toSvgPoint(r.left,  r.top);
        const br = toSvgPoint(r.right, r.bottom);
        // Clamp nx/ny in display (viewBox) space, then un-project through the
        // horizontal-compression transform to get the logical position to store.
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
        setView(v => ({ ...v, x: pan.current.vx - dx * scaleX, y: pan.current.vy - dy * scaleY }));
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
      const tl = toSvgPoint(r.left,  r.top);
      const br = toSvgPoint(r.right, r.bottom);
      const minX = tl.x + PAD_X,   maxX = br.x - PAD_X;
      const minY = tl.y + PAD_TOP, maxY = br.y - PAD_BOT;
      if (!(maxX > minX) || !(maxY > minY)) return;

      setPositions(prev => {
        const k = 1 - panelShiftRef.current * SHIFT_AMOUNT;
        let changed = false;
        const next = {};
        for (const id in prev) {
          const p = prev[id];
          // Convert logical → display, clamp in display space, convert back.
          const dispX = SHIFT_CX + (p.x - SHIFT_CX) * k;
          const cdx = Math.max(minX, Math.min(maxX, dispX));
          const nx  = SHIFT_CX + (cdx - SHIFT_CX) / (k || 1);
          const ny  = Math.max(minY, Math.min(maxY, p.y));
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

  // Wheel = zoom around cursor
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      const factor = e.deltaY < 0 ? 0.88 : 1.14;
      setView(v => {
        const newW = Math.max(280, Math.min(2200, v.w * factor));
        const newH = newW * (440/940);
        const cx = v.x + v.w * px;
        const cy = v.y + v.h * py;
        return { x: cx - newW * px, y: cy - newH * py, w: newW, h: newH };
      });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [setView]);

  return (
    <div
      ref={containerRef}
      onMouseMove={(e) => {
        const r = containerRef.current.getBoundingClientRect();
        setMousePos({ x: e.clientX - r.left, y: e.clientY - r.top });
      }}
      style={{
        position: 'relative',
        background: 'var(--bg-surface, #fff)',
        border: 'none',
        borderRadius: 4,
        height: 440,
        margin: '0 12px',
        backgroundImage: 'radial-gradient(var(--border, #E5E7EB) 1px, transparent 1px)',
        backgroundSize: '14px 14px',
        backgroundPosition: '0 0',
        userSelect: 'none',
        cursor: panning ? 'grabbing' : 'grab',
        overflow: 'visible',
      }}
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
      <svg ref={svgRef} viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet" overflow="visible">
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
                   style={{ opacity: op, cursor: 'pointer', transition: 'opacity 150ms' }}
                >
                  {/* invisible thick hit area along the stub */}
                  <line x1={sx} y1={sy} x2={ex} y2={ey}
                        stroke="transparent" strokeWidth="10"
                  />
                  <line x1={sx} y1={sy} x2={ex} y2={ey}
                        stroke={accent} strokeWidth={accentW}
                        style={{ pointerEvents: 'none', transition: 'stroke 150ms, stroke-width 150ms' }}
                  />
                  <circle cx={ex} cy={ey} r={dotR}
                          fill={accent}
                          style={{ pointerEvents: 'none', transition: 'fill 150ms' }}
                  />
                  <g transform={`translate(${lx},${ly})`}
                     onMouseEnter={() => setHoveredEdge(key)}
                     onMouseLeave={() => setHoveredEdge(null)}
                     style={{ cursor: 'pointer' }}>
                    <rect x={rectX} y="-7" width={w} height="14" rx="3"
                          style={{ fill: 'var(--card-bg)', stroke: 'none' }} />
                    <text textAnchor={textAnchor} dominantBaseline="central"
                          x={textAnchor === 'start' ? 6 : (textAnchor === 'end' ? -6 : 0)}
                          fontFamily="Inter, system-ui, sans-serif" fontWeight={isSel ? 600 : 400}
                          style={{ fontSize: 9.5, fill: isSel ? 'var(--pai-indigo)' : 'var(--shell-text-muted, #8A8A8A)', pointerEvents: 'none' }}>
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
    ms:    '/assets/Data source logos/MS Defender.svg',
    crwd:  '/assets/Data source logos/logo-crowdstrike.svg',
    azure: '/assets/Data source logos/logo-azure.svg',
    aws:   '/assets/Data source logos/logo-aws.svg',
    k8s:   '/assets/Data source logos/AWS EKS Container.svg',
    jira:  '/assets/Data source logos/Jira.svg',
  };
  const overflowMap = {
    '+2': '+2',
    '+1': '+1',
  };

  if (overflowMap[src]) {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 20, height: 20, borderRadius: 4,
        background: 'var(--bg-sunken, #E6E6E6)', color: 'var(--fg-2, #282828)',
        fontSize: 9, fontWeight: 700, letterSpacing: '0.03em',
        flexShrink: 0,
      }}>{overflowMap[src]}</span>
    );
  }

  const logo = logoMap[src];
  if (logo) {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 20, height: 20,
        flexShrink: 0, overflow: 'hidden',
      }}>
        <img src={logo} width={16} height={16} alt={src} style={{ display: 'block', objectFit: 'contain' }} />
      </span>
    );
  }

  // fallback text
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 20, height: 20, borderRadius: 4,
      background: 'var(--bg-sunken, #E6E6E6)', color: 'var(--fg-2, #282828)',
      fontSize: 9, fontWeight: 700,
      flexShrink: 0,
    }}>{src}</span>
  );
}

// ── OS Family icon ───────────────────────────────────────────────────
function OSPill({ os }) {
  if (os === '—') return <span style={{ color: PAI.fg3 }}>—</span>;
  const map = {
    Windows: { color: '#0078D4' },
    Linux:   { color: 'var(--shell-text)' },
    macOS:   { color: 'var(--shell-text-muted)' },
  };
  const m = map[os] || { color: 'var(--shell-text-muted)' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
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
    <div style={{
      display: 'inline-flex', alignItems: 'center',
      height: 32, paddingLeft: 14, paddingRight: 4,
      boxSizing: 'border-box',
      background: 'var(--bg-surface, #fff)',
      border: `1px solid ${focused ? '#6360D8' : 'var(--border, #E6E6E6)'}`,
      boxShadow: focused ? '0 0 0 3px rgba(99,96,216,0.18)' : 'none',
      borderRadius: 44, width,
      transition: 'border-color 120ms, box-shadow 120ms',
    }}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        style={{
          flex: 1, border: 'none', outline: 'none', background: 'transparent',
          fontSize: 13, fontFamily: 'inherit', color: 'var(--fg-1, #101010)',
          minWidth: 0,
        }}
      />
      {value && (
        <button
          onMouseDown={e => { e.preventDefault(); onChange(''); }}
          style={{
            width: 16, height: 16, padding: 0, border: 'none', background: 'transparent',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--fg-3, #888)', borderRadius: 999, flexShrink: 0, marginLeft: 4,
          }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      )}
      <span style={{
        width: 24, height: 24, marginLeft: 4,
        borderRadius: '50%',
        background: 'var(--pai-indigo-tint)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--pai-indigo)',
        flexShrink: 0,
      }}>
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
    <th style={{
      textAlign: 'left',
      padding: '8px 12px',
      background: 'var(--bg-raised, #F5F5F5)',
      borderBottom: '1px solid var(--border, #E6E6E6)',
      fontSize: 10, fontWeight: 600, color: 'var(--fg-3, #6E6E6E)',
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      whiteSpace: 'nowrap',
    }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        {children}
        <Ic size={10} path={<><path d="m7 9 5-5 5 5M7 15l5 5 5-5"/></>} />
      </span>
    </th>
  );
}

// ── Details Table ────────────────────────────────────────────────────
function DetailsTable({ rows, totalCount, search, onSearch }) {
  const PAGE_SIZE = 10;
  // We never render more than PAGE_SIZE rows on screen, even if the source
  // dataset has more — pagination is *visual* (the underlying ROWS are a
  // sample). The displayed page-1 size is min(totalCount, PAGE_SIZE).
  const displayRows = rows.slice(0, Math.min(rows.length, PAGE_SIZE));
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const showFrom = totalCount === 0 ? 0 : 1;
  const showTo = Math.min(PAGE_SIZE, totalCount);
  return (
    <div style={{
      background: 'var(--bg-surface, #fff)',
      border: '1px solid var(--border, #E6E6E6)',
      borderRadius: 6,
      margin: '0 12px 16px',
      overflow: 'hidden',
    }}>
      {/* header bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px',
        borderBottom: '1px solid var(--border, #E6E6E6)',
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: PAI.fg1 }}>
          Details <span style={{ color: PAI.fg3, fontWeight: 500 }}>({fmtN(totalCount)})</span>
        </div>
        <div style={{ flex: 1 }} />
        <DSPillSearch value={search} onChange={onSearch} placeholder="Search Any" width={220} />
        <button className="ds-btn sz-md t-outline" style={{
          height: 32, padding: '0 12px', background: 'var(--bg-surface, #fff)', border: '1px solid var(--border, #E6E6E6)',
          borderRadius: 44, color: PAI.fg1, fontSize: 12, fontWeight: 500, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'inherit',
        }}>
          Add Column <Ic size={12} path={<><path d="M12 5v14M5 12h14"/></>}/>
        </button>
        <button className="ds-btn sz-md t-primary" style={{
          height: 32, padding: '0 14px', background: 'var(--pai-indigo)', color: '#fff',
          border: 'none', borderRadius: 44, fontSize: 12, fontWeight: 500, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'inherit',
        }}>
          {Icons.download} Download
          <Ic size={12} path={<><path d="m6 9 6 6 6-6"/></>}/>
        </button>
      </div>

      {/* table */}
      <div style={{ overflow: 'auto', maxHeight: 320 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: 'inherit' }}>
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
                <td colSpan="7" style={{ padding: 32, textAlign: 'center', color: PAI.fg3 }}>
                  No records match this filter.
                </td>
              </tr>
            ) : displayRows.map((r, i) => {
              const meta = TYPE_TO_TABLE_LABEL[r.type];
              const ent = ENTITY_TYPES[r.type];
              return (
                <tr key={i} style={{
                  borderBottom: '1px solid var(--border)',
                  transition: 'background 120ms cubic-bezier(.2,.8,.2,1)',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.02)'}
                onMouseLeave={e => e.currentTarget.style.background = ''}
                >
                  <td style={{ padding: '10px 12px', color: PAI.fg1, fontWeight: 500, whiteSpace: 'nowrap', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.label}</td>
                  <td style={{ padding: '10px 12px', color: PAI.fg1, whiteSpace: 'nowrap' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <span style={{
                        width: 22, height: 22,
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <EntityGlyph kind={meta.glyph} size={20} />
                      </span>
                      {meta.type}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                    <span style={{ display:'inline-flex', alignItems: 'center', gap: 4 }}>
                      {meta.sources.map((s, j) => <SourceBadge key={j} src={s} />)}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', color: PAI.fg1, whiteSpace: 'nowrap' }}><OSPill os={meta.os} /></td>
                  <td style={{ padding: '10px 12px', color: PAI.fg1, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{r.ip}</td>
                  <td style={{ padding: '10px 12px', color: PAI.fg1, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{r.last}</td>
                  <td style={{ padding: '10px 12px', color: PAI.fg1, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{r.active}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {totalCount > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16,
          padding: '10px 16px',
          borderTop: '1px solid var(--border, #E6E6E6)',
          fontSize: 12, color: PAI.fg3,
          fontFamily: 'inherit',
        }}>
          {/* page-size selector */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
            {[10, 50, 100, 150].map((n, i) => (
              <button
                key={n}
                style={{
                  background: 'transparent', border: 'none', padding: 0,
                  fontSize: 12, fontFamily: 'inherit', cursor: 'pointer',
                  color: i === 0 ? PAI.fg1 : PAI.fg3,
                  fontWeight: i === 0 ? 700 : 400,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >{n}</button>
            ))}
          </div>
          <div style={{ color: PAI.fg3 }}>
            Showing rows <span style={{ color: PAI.fg1, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{showFrom}</span> to <span style={{ color: PAI.fg1, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{showTo}</span> of <span style={{ color: PAI.fg1, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{fmtN(totalCount)}</span>
          </div>
          <div style={{ flex: 1 }} />
          {/* page numbers */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
            {[1, 2, 3].slice(0, Math.min(3, totalPages)).map((p, i) => (
              <button
                key={p}
                disabled={p > totalPages}
                style={{
                  background: 'transparent', border: 'none', padding: 0,
                  fontSize: 12, fontFamily: 'inherit',
                  cursor: p > totalPages ? 'default' : 'pointer',
                  color: i === 0 ? PAI.fg1 : (p > totalPages ? 'var(--pai-disabled)' : PAI.fg3),
                  fontWeight: i === 0 ? 700 : 400,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >{p}</button>
            ))}
            <button disabled={totalPages <= 1} style={{
              background: 'transparent', border: 'none', padding: 0,
              fontSize: 14, fontFamily: 'inherit',
              cursor: totalPages <= 1 ? 'default' : 'pointer',
              color: totalPages <= 1 ? 'var(--pai-disabled)' : PAI.fg3,
              display: 'inline-flex', alignItems: 'center',
            }}>›</button>
            <button disabled={totalPages <= 1} style={{
              background: 'transparent', border: 'none', padding: 0,
              fontSize: 14, fontFamily: 'inherit',
              cursor: totalPages <= 1 ? 'default' : 'pointer',
              color: totalPages <= 1 ? 'var(--pai-disabled)' : PAI.fg3,
              display: 'inline-flex', alignItems: 'center',
            }}>»</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Entity KPI card grid — Entities tab view ─────────────────────────
function EntityKpiGrid() {
  const entities = Object.entries(ENTITY_TYPES).sort((a, b) => a[1].label.localeCompare(b[1].label));
  return (
    <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
      {entities.map(([id, def]) => {
            const frags = def.fragments || def.count;
            const pct = frags ? (def.count / frags) * 100 : 100;
            const pctStr = Number.isInteger(pct) ? `${pct}%` : `${pct.toFixed(2)}%`;
            return (
              <div key={id} style={{
                border: '1px solid var(--border, #E6E6E6)',
                borderRadius: 4, padding: 16,
                display: 'flex', flexDirection: 'column', gap: 16,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: 44,
                    background: 'var(--bg-raised, #F5F5F5)',
                    border: '1px solid var(--border, #E6E6E6)',
                    flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <EntityGlyph kind={def.glyph} size={16} />
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--fg-1, #101010)', whiteSpace: 'nowrap' }}>
                    {def.label}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24 }}>
                  <div style={{ borderLeft: '2px solid #6360D8', paddingLeft: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--fg-3, #6E6E6E)', lineHeight: 1.17 }}>Resolved</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg-1, #101010)', whiteSpace: 'nowrap', lineHeight: 1.17, fontVariantNumeric: 'tabular-nums' }}>
                      {fmtN(def.count)}{' '}<span style={{ fontWeight: 400 }}>({pctStr})</span>
                    </span>
                  </div>
                  <div style={{ borderLeft: '2px solid #31A56D', paddingLeft: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--fg-3, #6E6E6E)', lineHeight: 1.17 }}>Fragments</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg-1, #101010)', whiteSpace: 'nowrap', lineHeight: 1.17, fontVariantNumeric: 'tabular-nums' }}>
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
function PageKG() {
  const [summaryTab, setSummaryTab] = useState('Relationships');
  const [selected, setSelected] = useState(null);
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
      // zoom around center
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
    // Strip the #idx self-loop disambiguator for key comparison.
    const baseSelectedKey = selectedEdgeKey ? selectedEdgeKey.replace(/#\d+$/, '') : null;
    return edges
      .filter(([,,,hidden]) => !hidden)
      .filter(([a,b]) => a === selected || b === selected)
      .filter(([a,b]) => !baseSelectedKey || `${a}|${b}` === baseSelectedKey)
      // Only keep chips whose "other" endpoint is visible under the current view.
      .filter(([a,b]) => {
        const other = a === selected ? b : a;
        return visibleSetByView.has(other);
      })
      .map(([a, b, label, , srcAlias, tgtAlias]) => {
        const reversed = b === selected;  // selected is canonical target → reversed view
        const other = reversed ? a : b;
        const key = `${a}|${b}`;
        // When reversed, the display aliases swap: canonical tgtAlias becomes our
        // source alias and canonical srcAlias becomes our target alias.
        const dispSrcAlias = reversed ? tgtAlias : srcAlias;
        const dispTgtAlias = reversed ? srcAlias : tgtAlias;
        return {
          key,
          source: dispSrcAlias || ENTITY_TYPES[selected]?.label || selected,
          relation: label || 'Connected to',
          target: dispTgtAlias || ENTITY_TYPES[other]?.label || other,
          otherId: other,
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
    <div style={{ padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Summary card */}
      <div style={{
        background: 'var(--bg-surface, #fff)',
        border: '1px solid var(--border, #E6E6E6)',
        borderRadius: 6,
        margin: '0 12px',
        overflow: 'hidden',
      }}>
        {/* Card header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 16px 0',
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: PAI.fg1 }}>Summary</div>
          <div style={{ flex: 1 }} />
          <SegmentedTabs
            value={summaryTab}
            onChange={setSummaryTab}
            options={['Relationships','Entities','Data Sources']}
          />
          <button style={{
            height: 28, padding: '0 12px', background: 'transparent',
            border: 'none', color: PAI.fg2, fontSize: 12, fontWeight: 500,
            cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
            fontFamily: 'inherit',
          }}>
            <Ic size={12} path={<><path d="m18 15-6-6-6 6"/></>}/>
            Collapse
          </button>
        </div>

        {summaryTab === 'Entities' && <EntityKpiGrid />}

        {/* Toolbar — Relationships tab only */}
        {summaryTab === 'Relationships' && <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 16px',
        }}>
          <span style={{
            fontSize: 12, color: 'var(--fg-3, #6E6E6E)', fontWeight: 500,
          }}>Attack Surface:</span>
          <ViewTabs value={viewMode} onChange={setViewMode} options={['None','Device','Cloud','Identity']}/>
          <div style={{ flex: 1 }} />
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
            className="ds-btn sz-md t-outline"
            style={{
              height: 32, padding: '0 14px',
              background: multiMode ? 'var(--pai-indigo-tint)' : 'var(--bg-surface, #fff)',
              border: `1px solid ${multiMode ? 'var(--pai-indigo-light)' : 'var(--border, #E6E6E6)'}`,
              borderRadius: 44,
              color: multiMode ? 'var(--pai-indigo-hover)' : 'var(--shell-text-muted)',
              fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}
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
                style={{
                  height: 32, padding: '0 14px',
                  background: 'var(--bg-surface, #fff)',
                  border: `1px solid ${active ? 'var(--pai-red-high)' : 'var(--border, #E6E6E6)'}`,
                  borderRadius: 44,
                  color: active ? 'var(--pai-red-high)' : 'var(--shell-text-muted)',
                  fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  transition: 'all 150ms cubic-bezier(.2,.8,.2,1)',
                }}
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
        {summaryTab === 'Relationships' && <div style={{ position: 'relative' }}>
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
          <div style={{
            position: 'absolute', left: 24, bottom: 24,
            display: 'flex', flexDirection: 'column', gap: 8,
            zIndex: 5,
          }}>
            <RailBtn onClick={() => zoomBy(0.8)} icon={<Ic size={14} path={<><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/><path d="M11 8v6M8 11h6"/></>}/>}/>
            <RailBtn onClick={() => zoomBy(1.25)} icon={<Ic size={14} path={<><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/><path d="M8 11h6"/></>}/>}/>
          </div>
          {/* Bottom-left zoom indicator (hidden) */}
          {/* <ZoomIndicator view={view}/> */}
        </div>}

        {/* Footer chip bar — relationships of selection */}
        {summaryTab === 'Relationships' && (() => {
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
                    search={tableSearch} onSearch={setTableSearch}/>
    </div>
  );
}

// ── Segmented tabs (large) ───────────────────────────────────────────
// Visual style adapted from the design system's dual-toggle: pill track
// with a sliding indigo thumb and label color that flips on the active
// segment.
function SegmentedTabs({ value, options, onChange }) {
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
    <div ref={containerRef} style={{
      position: 'relative',
      display: 'inline-flex',
      alignItems: 'center',
      height: 32,
      boxSizing: 'border-box',
      padding: 0,
      background: PAI.bgRaised,
      borderRadius: 999,
      gap: 0,
    }}>
      {/* sliding white thumb — sized to match active segment */}
      <div style={{
        position: 'absolute',
        top: 0, bottom: 0,
        left: thumb.left,
        width: thumb.width,
        background: 'var(--bg-surface, #fff)',
        border: '1px solid var(--border, #E6E6E6)',
        borderRadius: 999,
        transition: 'left 200ms cubic-bezier(.2,.8,.2,1), width 200ms cubic-bezier(.2,.8,.2,1)',
        boxShadow: '0 1px 2px rgba(16,16,16,0.04)',
        boxSizing: 'border-box',
        opacity: thumb.width ? 1 : 0,
      }} />
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
            style={{
              position: 'relative', zIndex: 1,
              padding: '0 16px',
              height: 32,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent', border: 'none', cursor: onChange ? 'pointer' : 'default',
              fontFamily: 'inherit', fontSize: 13,
              color: active ? PAI.fg1 : PAI.fg3,
              fontWeight: active ? 600 : 500,
              transition: 'color 150ms',
              whiteSpace: 'nowrap',
              lineHeight: 1,
            }}
          >
            {showDivider && (
              <span style={{
                position: 'absolute',
                left: 0, top: 4, bottom: 4,
                width: 1, background: 'var(--shell-border-2)',
                pointerEvents: 'none',
              }} />
            )}
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
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      pointerEvents: 'none',
    }}>
      <div style={{
        background: 'var(--bg-surface, rgba(255,255,255,0.92))',
        border: '1px solid var(--border, #E6E6E6)',
        borderRadius: 10,
        padding: '20px 28px',
        boxShadow: '0 4px 12px rgba(16,16,16,0.06)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 8,
        maxWidth: 340, textAlign: 'center',
        color: PAI.fg2,
      }}>
        <div style={{ color: PAI.fg3 }}>{icon}</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: PAI.fg1 }}>{title}</div>
        <div style={{ fontSize: 12, color: PAI.fg3 }}>{subtitle}</div>
      </div>
    </div>
  );
}

function RailBtn({ icon, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        width: 32, height: 32, padding: 0,
        background: hover ? 'var(--shell-hover)' : 'var(--shell-raised)',
        border: 'none', borderRadius: 6,
        cursor: 'pointer', color: PAI.fg2,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      }}
    >{icon}</button>
  );
}

// ── Zoom level indicator (bottom-left) ───────────────────────────────
// view.w == 940 corresponds to 100%. Smaller w  = zoomed in.
function ZoomIndicator({ view }) {
  const pct = Math.round((940 / view.w) * 100);
  return (
    <div style={{
      position: 'absolute', left: 16, bottom: 12,
      height: 26, padding: '0 10px',
      background: 'var(--bg-surface, #fff)',
      border: '1px solid var(--border, #E6E6E6)',
      borderRadius: 6,
      boxShadow: '0 1px 2px rgba(16,16,16,0.04)',
      display: 'inline-flex', alignItems: 'center', gap: 6,
      fontSize: 12, fontWeight: 500, color: PAI.fg2,
      fontFamily: 'inherit',
      pointerEvents: 'none',
      userSelect: 'none',
    }}>
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
const CHIPBAR_HEIGHT = 46;
const CHIPBAR_BASE_STYLE = {
  height: CHIPBAR_HEIGHT,
  minHeight: CHIPBAR_HEIGHT,
  maxHeight: CHIPBAR_HEIGHT,
  padding: '0 16px',
  borderTop: '1px solid var(--border)',
  display: 'flex', alignItems: 'center', gap: 10,
  boxSizing: 'border-box',
  overflow: 'hidden',
};
// ── Empty chip bar — default state messaging ─────────────────────────
function EmptyChipBar({ message }) {
  return (
    <div style={CHIPBAR_BASE_STYLE}>
      <span style={{ fontSize: 11, color: PAI.fg3 }}>{message}</span>
    </div>
  );
}

// ── Multi-select chip bar — chips for each multi-selected entity ────
function MultiSelectChipBar({ ids, visibleSet, onRemove, onClear }) {
  return (
    <div style={CHIPBAR_BASE_STYLE}>
      <span style={{ fontSize: 11, color: PAI.fg3, flexShrink: 0 }}>Details table filtered by:</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0, overflowX: 'auto', overflowY: 'hidden' }}>
        {ids.map(id => {
          const def = ENTITY_TYPES[id];
          if (!def) return null;
          const disabled = visibleSet && !visibleSet.has(id);
          return (
            <span
              key={id}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                height: 24, padding: '0 6px 0 12px',
                background: disabled ? 'var(--bg-raised, #F2F2F2)' : 'var(--pai-indigo-tint)',
                border: `1px solid ${disabled ? 'var(--border, #DEDEDE)' : 'var(--pai-indigo-light)'}`,
                borderRadius: 44,
                color: disabled ? PAI.fg3 : 'var(--pai-indigo-hover)',
                fontSize: 11, fontWeight: 600, fontFamily: 'inherit',
                flexShrink: 0, whiteSpace: 'nowrap',
                opacity: disabled ? 0.7 : 1,
              }}
            >
              <span>{def.label} <span>({fmtN(def.count)})</span></span>
              <button
                onClick={() => onRemove(id)}
                aria-label={`Remove ${def.label}`}
                style={{
                  width: 16, height: 16, padding: 0,
                  background: 'transparent', border: 'none',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: disabled ? PAI.fg3 : 'var(--pai-indigo-muted)', borderRadius: 999,
                }}
              >
                <Ic size={10} path={<><path d="M18 6 6 18M6 6l12 12"/></>} />
              </button>
            </span>
          );
        })}
      </div>
      <button
        onClick={onClear}
        style={{
          background: 'transparent', border: 'none', padding: 0,
          color: PAI.fg2, fontSize: 11, fontWeight: 500, cursor: 'pointer',
          fontFamily: 'inherit', textDecoration: 'underline', textUnderlineOffset: 2,
          flexShrink: 0,
        }}
      >Clear</button>
    </div>
  );
}

function FilterChipBar({ chips, deselected, reversed = new Set(), selectedLabel, selectedCount, onToggle, onReverse, nodeOnly, nodeDisabled, onClearNode }) {
  if (nodeOnly) {
    return (
      <div style={CHIPBAR_BASE_STYLE}>
        <span style={{ fontSize: 11, color: PAI.fg3, flexShrink: 0 }}>Details table filtered by:</span>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          height: 24, padding: onClearNode ? '0 6px 0 12px' : '0 12px',
          background: nodeDisabled ? 'var(--bg-raised, #F2F2F2)' : 'var(--pai-indigo-tint)',
          border: `1px solid ${nodeDisabled ? 'var(--border, #DEDEDE)' : 'var(--pai-indigo-light)'}`,
          borderRadius: 44,
          color: nodeDisabled ? PAI.fg3 : 'var(--pai-indigo-hover)',
          fontSize: 11, fontWeight: 600, fontFamily: 'inherit',
          opacity: nodeDisabled ? 0.7 : 1,
        }}>
          <span>{selectedLabel} <span>({fmtN(selectedCount)})</span></span>
          {onClearNode && (
            <button
              onClick={onClearNode}
              aria-label={`Remove ${selectedLabel}`}
              style={{
                width: 16, height: 16, padding: 0,
                background: 'transparent', border: 'none',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: nodeDisabled ? PAI.fg3 : 'var(--pai-indigo-muted)', borderRadius: 999,
              }}
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
      <div style={CHIPBAR_BASE_STYLE}>
        <span style={{ fontSize: 11, color: PAI.fg3, flex: 1 }}>
          <strong style={{ fontWeight: 600, color: PAI.fg2 }}>{selectedLabel}</strong> has no relationships in this view.
        </span>
      </div>
    );
  }
  return (
    <div style={CHIPBAR_BASE_STYLE}>
      <span style={{ fontSize: 11, color: PAI.fg3, flexShrink: 0 }}>Details table filtered by:</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0, overflowX: 'auto', overflowY: 'hidden' }}>
        {chips.map(c => {
          if (deselected.has(c.key)) return null;
          const isRev = reversed.has(c.key);
          const dispSrc = isRev ? c.target : c.source;
          const dispTgt = isRev ? c.source : c.target;
          return (
            <span
              key={c.key}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                height: 24, padding: '0 6px 0 10px',
                background: 'var(--pai-indigo-tint)',
                border: '1px solid var(--pai-indigo-light)',
                borderRadius: 44,
                color: 'var(--pai-indigo-hover)',
                fontSize: 11, fontWeight: 500, fontFamily: 'inherit',
                flexShrink: 0,
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4, whiteSpace: 'nowrap' }}>
                <span style={{ fontWeight: 600 }}>{dispSrc}</span>
                <span style={{ fontWeight: 400, color: 'var(--pai-indigo-muted)' }}>{c.relation}</span>
                <span style={{ fontWeight: 600 }}>{dispTgt}</span>
              </span>
              {onReverse && (
                <button
                  onClick={() => onReverse(c.key)}
                  aria-label="Reverse relationship"
                  title="Reverse relationship"
                  style={{
                    width: 16, height: 16, padding: 0,
                    background: 'transparent', border: 'none',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: isRev ? 'var(--pai-indigo)' : 'var(--pai-indigo-muted)', borderRadius: 999,
                  }}
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
                style={{
                  width: 16, height: 16, padding: 0,
                  background: 'transparent', border: 'none',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: 'var(--pai-indigo-muted)', borderRadius: 999,
                }}
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
        <div style={{
          padding: '8px 12px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 8,
          background: headerBg,
        }}>
          <div style={{ display: 'flex' }}>
            <EntityGlyph kind={def.glyph} size={18} />
          </div>
          <div style={{ color: def.icon || def.stroke, fontSize: 12, fontWeight: 600 }}>{def.label}</div>
        </div>
        <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 6, minWidth: 200 }}>
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
        <div style={{
          padding: '8px 12px',
          borderBottom: '1px solid var(--border)',
          fontSize: 12, fontWeight: 600, color: PAI.fg1,
        }}>
          {srcLabel} <span style={{ color: PAI.fg3, fontWeight: 500 }}>{rel || 'connected to'}</span> {tgtLabel}
        </div>
        <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 6, minWidth: 220 }}>
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
    <div style={{
      position: 'absolute', left, top, zIndex: 30,
      background: 'var(--bg-surface, #fff)',
      border: '1px solid var(--border, #E6E6E6)',
      borderRadius: 8,
      boxShadow: '0 8px 24px rgba(16,16,16,0.08), 0 2px 6px rgba(16,16,16,0.04)',
      pointerEvents: 'none',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      {content}
    </div>
  );
}

function Row({ k, v }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
      <span style={{ fontSize: 11, color: PAI.fg3 }}>{k}</span>
      <span style={{ fontSize: 12, color: PAI.fg1, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{v}</span>
    </div>
  );
}

// ── SelectionPanel — pinned right-side panel showing selected entities ───
function SelectionPanel({ ids, onRemove }) {
  const isDark = useDark();
  if (!ids || ids.length === 0) return null;
  return (
    <div style={{
      position: 'absolute', right: 16, top: 16, zIndex: 6,
      width: 264,
      maxHeight: 'calc(100% - 32px)',
      display: 'flex', flexDirection: 'column',
      background: 'var(--bg-surface, #fff)',
      border: '1px solid var(--border, #E6E6E6)',
      borderRadius: 10,
      boxShadow: '0 6px 20px rgba(16,16,16,0.06), 0 1px 2px rgba(16,16,16,0.04)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 12px',
        borderBottom: '1px solid var(--border)',
        fontSize: 11, color: PAI.fg3,
        flexShrink: 0,
      }}>
        Details table filtered by:
      </div>
      <div style={{
        display: 'flex', flexDirection: 'column',
        overflowY: 'auto', minHeight: 0,
      }}>
        {ids.map((id, idx) => {
          const def = ENTITY_TYPES[id];
          if (!def) return null;
          const accent = def.icon || def.stroke;
          return (
            <div key={id} style={{
              borderTop: idx === 0 ? 'none' : '1px solid var(--border)',
              flexShrink: 0,
            }}>
              <div style={{
                padding: '8px 10px 8px 12px',
                borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', gap: 8,
                background: isDark ? (def.tintDark || def.tint) : def.tint + '40',
              }}>
                <div style={{ display: 'flex' }}>
                  <EntityGlyph kind={def.glyph} size={18} />
                </div>
                <div style={{ color: accent, fontSize: 12, fontWeight: 600, flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{def.label}</div>
                <button
                  onClick={() => onRemove(id)}
                  aria-label="Deselect"
                  style={{
                    width: 20, height: 20, borderRadius: 4,
                    border: 'none', background: 'transparent', cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    color: PAI.fg3, padding: 0, flexShrink: 0,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#F2F2F2'; e.currentTarget.style.color = PAI.fg1; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = PAI.fg3; }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                </button>
              </div>
              <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
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
