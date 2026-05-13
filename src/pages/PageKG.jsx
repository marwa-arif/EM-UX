// PageKG — Knowledge Graph view.
// Layout: Summary card (top, with view toggle + node search), graph canvas (SVG),
// then the filtered Details table.

import React, { useState, useMemo, useRef, useEffect } from 'react'
import { PAI, Icons, Ic } from '../ui.jsx'
import { DSPillSearch } from '../context/WorkspaceCtx.jsx'

// ─────────────────────────────────────────────────────────────────────
// Entity type catalog — colors + icon glyph (drawn inline, no SVG file)
// Colors are muted/desaturated chip-tints matching the screenshot.
// ─────────────────────────────────────────────────────────────────────
const ENTITY_TYPES = {
  account:        { label: 'Account',           tint: '#F1ECF9', stroke: '#D3C3EC', icon: '#9269CF', count: 15301,    fragments: 15349,  group: 'identity', glyph: 'account' },
  identity:       { label: 'Identity',          tint: '#F4E6F9', stroke: '#DCB3ED', icon: '#A842D2', count: 71442,    fragments: 146922, group: 'identity', glyph: 'identity' },
  group:          { label: 'Group',             tint: '#E3F6F7', stroke: '#A9E5E7', icon: '#27BDC2', count: 2,                           group: 'identity', glyph: 'group' },
  person:         { label: 'Person',            tint: '#E4EDF1', stroke: '#ABC8D3', icon: '#2E7690', count: 304,      fragments: 1016,   group: 'identity', glyph: 'person' },
  application:    { label: 'Application',       tint: '#F4EEE6', stroke: '#DECCB1', icon: '#AD803D', count: 4376,     fragments: 42717,  group: 'cloud',    glyph: 'application' },
  vulnerability:  { label: 'Vulnerability',     tint: '#F4E9E9', stroke: '#DFBCBC', icon: '#AE5757', count: 55230,    fragments: 311397, group: 'host',     glyph: 'vulnerability' },
  assessment:     { label: 'Assessment',        tint: '#F4ECE5', stroke: '#DEC4AF', icon: '#AC6C36', count: 497,                         group: 'host',     glyph: 'assessment' },
  cluster:        { label: 'Cluster',           tint: '#E5E5F5', stroke: '#AEAEE1', icon: '#3434B4', count: 231,                         group: 'cloud',    glyph: 'cluster' },
  container:      { label: 'Container',         tint: '#EBE4F2', stroke: '#C2ADD7', icon: '#66329C', count: 358,      fragments: 358,    group: 'cloud',    glyph: 'container' },
  cloudAccount:   { label: 'Cloud Account',     tint: '#E6E7F5', stroke: '#B1B4DF', icon: '#3B43B0', count: 15,                          group: 'cloud',    glyph: 'cloud' },
  finding:        { label: 'Finding',           tint: '#E9E4F6', stroke: '#BCABE4', icon: '#582DBB', count: 15518350, fragments: 15518350,group: 'host',     glyph: 'finding', primary: true },
  ticket:         { label: 'Ticket',            tint: '#E6F6F4', stroke: '#B1E3DE', icon: '#3DBAAD', count: 10,                          group: 'host',     glyph: 'ticket' },
  host:           { label: 'Host',              tint: '#E3E9F1', stroke: '#AABBD3', icon: '#2B5690', count: 58687,    fragments: 225709, group: 'host',     glyph: 'host' },
  network:        { label: 'Network',           tint: '#DEF0EA', stroke: '#99D0BF', icon: '#00895E', count: 77,                          group: 'cloud',    glyph: 'network' },
  netSvc:         { label: 'Network Services',  tint: '#F0F4E4', stroke: '#D0DCAD', icon: '#89A833', count: 253,                         group: 'cloud',    glyph: 'netsvc' },
  netIface:       { label: 'Network Interface', tint: '#F6E6F0', stroke: '#E3B1D1', icon: '#BA3D8C', count: 3303,                        group: 'cloud',    glyph: 'netiface' },
  storage:        { label: 'Storage',           tint: '#E5F1F7', stroke: '#B0D5E7', icon: '#3A96C4', count: 5541,     fragments: 5541,   group: 'cloud',    glyph: 'storage' },
};

// Node positions — calibrated against a 940×420 canvas to match reference
// Oval layout: finding at center, 16 entity nodes on an ellipse around it.
// Order around the oval (clockwise from left) keeps Identity on the left,
// Cloud on the top, Host on the right — all visible inside 940×440.
const NODE_POS = (() => {
  const cx = 470, cy = 220, rx = 400, ry = 162;
  const order = [
    'group', 'identity', 'account', 'person',           // left arc → bottom-left (identity)
    'application', 'cluster', 'container',              // upper-left arc (cloud)
    'cloudAccount', 'network', 'netSvc', 'netIface',    // top → upper-right (cloud)
    'storage', 'vulnerability', 'host',                 // right arc (host)
    'assessment', 'ticket',                             // lower-right arc (host)
  ];
  const N = order.length;
  const pos = { finding: { x: cx, y: cy } };
  // Walk clockwise starting at the top of the left arc.
  for (let i = 0; i < N; i++) {
    const t = Math.PI * 0.85 + (i / N) * 2 * Math.PI;
    pos[order[i]] = {
      x: Math.round(cx + rx * Math.cos(t)),
      y: Math.round(cy + ry * Math.sin(t)),
    };
  }
  return pos;
})();

// Edges — [a, b, label]. The graph is undirected.
const INITIAL_EDGES = [
  ['account', 'identity', 'Associated with'],
  ['identity', 'application', null],
  ['identity', 'finding', 'Has'],
  ['application', 'finding', 'Has'],
  ['vulnerability', 'finding', 'Has'],
  ['assessment', 'finding', 'Has'],
  ['cluster', 'finding', 'Has'],
  ['container', 'finding', 'Has'],
  ['cloudAccount', 'finding', 'Has'],
  ['storage', 'finding', 'Has'],
  ['netIface', 'finding', 'Has'],
  ['netSvc', 'finding', null],
  ['network', 'finding', 'Has'],
  ['host', 'finding', 'Has'],
  ['host', 'vulnerability', 'Running on'],
  ['ticket', 'finding', 'Associated with'],
  ['person', 'ticket', 'Owns'],
  ['person', 'identity', 'Associated with'],
  ['person', 'finding', null],
  ['identity', 'ticket', 'Created'],
  ['account', 'group', 'Member of'],
  ['group', 'group', 'Member of'],
];

// Relationship-specific entity counts — overrides node badge + Details total
// when that edge is selected. Key = "a|b" matching INITIAL_EDGES order.
const EDGE_COUNTS = {
  'account|identity':      { account: 8420,  identity: 15281   },
  'identity|application':  { identity: 12400, application: 4178 },
  'identity|finding':      { identity: 71462, finding: 2341820  },
  'application|finding':   { application: 4178, finding: 892340 },
  'vulnerability|finding': { vulnerability: 55230, finding: 4218920 },
  'assessment|finding':    { assessment: 497,  finding: 12800   },
  'cluster|finding':       { cluster: 231,    finding: 58430    },
  'container|finding':     { container: 316,  finding: 89200    },
  'cloudAccount|finding':  { cloudAccount: 15, finding: 182400  },
  'storage|finding':       { storage: 5141,   finding: 312800   },
  'netIface|finding':      { netIface: 3303,  finding: 428900   },
  'netSvc|finding':        { netSvc: 253,     finding: 28400    },
  'network|finding':       { network: 77,     finding: 94200    },
  'host|finding':          { host: 54687,     finding: 8921400  },
  'host|vulnerability':    { host: 54687,     vulnerability: 55230 },
  'ticket|finding':        { ticket: 10,      finding: 2840     },
  'person|ticket':         { person: 304,     ticket: 10        },
  'person|identity':       { person: 304,     identity: 71462   },
  'person|finding':        { person: 304,     finding: 48200    },
  'identity|ticket':       { identity: 71462, ticket: 10        },
  'account|group':         { account: 15281,  group: 2          },
  'group|group':           { group: 2,        group: 2          },
  'cloudAccount|storage':  { cloudAccount: 2, storage: 94364    },
};

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
function EntityNode({ id, def, pos, selected, dimmed, onClick, onHover, hovered, onDragStart, dragging, floatOffset, countOverride }) {
  const r = 22;
  const fx = floatOffset ? floatOffset.x : 0;
  const fy = floatOffset ? floatOffset.y : 0;
  const bubbleStroke = selected ? def.icon : def.stroke;
  const bubbleStrokeW = selected ? 2.5 : (hovered ? 2 : 1.4);
  const opacity = dimmed ? 0.32 : 1;
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
        <circle cx="0" cy="0" r={r + 6} fill={def.icon + '1a'} />
      )}
      <circle
        cx="0" cy="0" r={r}
        fill={def.tint}
        stroke={bubbleStroke}
        strokeWidth={bubbleStrokeW}
        style={{ transition: 'all 150ms cubic-bezier(.2,.8,.2,1)' }}
      />
      {/* Count badge top-right (auto-sized) */}
      {(() => {
        const txt = fmtN(countOverride !== undefined ? countOverride : def.count);
        const w = Math.max(36, txt.length * 5.5 + 12);
        return (
          <g transform={`translate(${r-2},${-r+2})`}>
            <rect x={-w/2} y="-8" rx="8" ry="8" width={w} height="16" fill="#fff" stroke="#E6E6E6" strokeWidth="1" />
            <text textAnchor="middle" dominantBaseline="central" y="0.5"
                  style={{ fontSize: 10, fontWeight: 700, fill: '#282828', fontVariantNumeric: 'tabular-nums', fontFamily: "'Inter', system-ui" }}>
              {txt}
            </text>
          </g>
        );
      })()}
      {/* Glyph centered (offset to compensate for 18px icon) */}
      <foreignObject x={-11} y={-11} width={22} height={22} style={{ pointerEvents: 'none' }}>
        <div xmlns="http://www.w3.org/1999/xhtml" style={{ width: 22, height: 22 }}>
          <EntityGlyph kind={def.glyph} size={22} />
        </div>
      </foreignObject>
      {/* Label below */}
      <text
        x="0" y={r + 14}
        textAnchor="middle"
        style={{
          fontSize: 11, fontWeight: selected ? 600 : 500,
          fill: selected ? def.icon : '#282828',
          letterSpacing: '0.01em',
          fontFamily: "'Inter', system-ui",
        }}
      >
        {def.label}
      </text>
    </g>
  );
}

// ── Edge — straight line w/ optional label ───────────────────────────
function Edge({ a, b, label, selected, reversed, dimmed, positions, onEdgeHover, onEdgeClick, edgeKey, hoveredEdge, hoveredNode, anySelected, floatOffsets, pointerEvents }) {
  const isHovered = hoveredEdge === edgeKey;
  const isNodeHovered = hoveredNode && (a === hoveredNode || b === hoveredNode);
  const fa = floatOffsets && floatOffsets[a] ? floatOffsets[a] : { x: 0, y: 0 };
  const fb = floatOffsets && floatOffsets[b] ? floatOffsets[b] : { x: 0, y: 0 };
  const basePa = positions[a], basePb = positions[b];
  const pa = basePa && { x: basePa.x + fa.x, y: basePa.y + fa.y };
  const pb = basePb && { x: basePb.x + fb.x, y: basePb.y + fb.y };
  if (!pa || !pb) return null;

  const colorA = ENTITY_TYPES[reversed ? b : a]?.icon || '#6360D8';
  const colorB = ENTITY_TYPES[reversed ? a : b]?.icon || '#6360D8';
  const gradId = `eg-${edgeKey.replace('|', '-')}`;
  const stroke = selected ? `url(#${gradId})` : '#D6D6D6';
  const strokeW = selected ? 1.6 : 1;
  const opacity = dimmed ? 0.18 : 1;
  const isSelfLoop = a === b;

  if (isSelfLoop) {
    // Self-loop: small circular arc above the node
    const r = 22;
    const loopR = 14;
    // Start at top-left of node, sweep up & around, end at top-right
    const startAngle = -135 * Math.PI / 180;
    const endAngle = -45 * Math.PI / 180;
    const sx = pa.x + Math.cos(startAngle) * r;
    const sy = pa.y + Math.sin(startAngle) * r;
    const ex = pa.x + Math.cos(endAngle) * r;
    const ey = pa.y + Math.sin(endAngle) * r;
    // Arc with large-arc-flag=1 to wrap above the node
    const d = `M ${sx} ${sy} A ${loopR} ${loopR} 0 1 1 ${ex} ${ey}`;
    const labelX = pa.x;
    const labelY = pa.y - r - loopR * 1.6;
    return (
      <g style={{ opacity, transition: 'opacity 150ms cubic-bezier(.2,.8,.2,1)', pointerEvents: pointerEvents || 'auto' }}
         onMouseEnter={() => onEdgeHover && onEdgeHover(edgeKey)}
         onMouseLeave={() => onEdgeHover && onEdgeHover(null)}
         onClick={(e) => { e.stopPropagation(); onEdgeClick && onEdgeClick(a, b, edgeKey); }}
      >
        {selected && (
          <defs>
            <linearGradient id={gradId} gradientUnits="userSpaceOnUse"
              x1={sx} y1={sy} x2={ex} y2={ey}>
              <stop offset="0%" stopColor={colorA} />
              <stop offset="100%" stopColor={colorB} />
            </linearGradient>
          </defs>
        )}
        <path d={d} fill="none" stroke="transparent" strokeWidth="10" style={{ cursor: 'pointer' }} />
        <path d={d} fill="none"
              stroke={selected ? stroke : (isHovered ? '#A2A1F7' : (isNodeHovered ? '#A2A1F7' : '#D6D6D6'))}
              strokeWidth={selected ? 1.6 : (isHovered ? 1.6 : (isNodeHovered ? 1.8 : strokeW))}
              style={{ transition: 'stroke 150ms, stroke-width 150ms', pointerEvents: 'none' }}
        />
        {label && (() => {
          const lbl = label.length > 22 ? label.slice(0, 20) + '\u2026' : label;
          return (
            <g transform={`translate(${labelX},${labelY})`}>
              <title>{label}</title>
              <text textAnchor="middle" dominantBaseline="central"
                    style={{ fontSize: 9.5, fill: selected ? '#282828' : '#8A8A8A', fontWeight: selected ? 600 : 400, fontFamily: "'Inter', system-ui" }}>
                {lbl}
              </text>
            </g>
          );
        })()}
      </g>
    );
  }

  // shrink endpoints to circle radii
  const ra = 22;
  const rb = 22;
  const dx = pb.x - pa.x, dy = pb.y - pa.y;
  const len = Math.hypot(dx, dy) || 1;
  const x1 = pa.x + (dx/len) * ra, y1 = pa.y + (dy/len) * ra;
  const x2 = pb.x - (dx/len) * rb, y2 = pb.y - (dy/len) * rb;
  const mx = (x1+x2)/2, my = (y1+y2)/2;

  return (
    <g style={{ opacity, transition: 'opacity 150ms cubic-bezier(.2,.8,.2,1)' }}
       onMouseEnter={() => onEdgeHover && onEdgeHover(edgeKey)}
       onMouseLeave={() => onEdgeHover && onEdgeHover(null)}
       onClick={(e) => { e.stopPropagation(); onEdgeClick && onEdgeClick(a, b, edgeKey); }}
    >
      {selected && (
        <defs>
          <linearGradient id={gradId} gradientUnits="userSpaceOnUse"
            x1={x1} y1={y1} x2={x2} y2={y2}>
            <stop offset="0%" stopColor={colorA} />
            <stop offset="100%" stopColor={colorB} />
          </linearGradient>
        </defs>
      )}
      {/* invisible thick hit area for easier hovering */}
      <line x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="transparent" strokeWidth="10"
            style={{ cursor: 'pointer' }}
      />
      <line x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={selected ? stroke : (isHovered ? '#A2A1F7' : (isNodeHovered ? '#A2A1F7' : '#D6D6D6'))}
            strokeWidth={selected ? 1.6 : (isHovered ? 1.6 : (isNodeHovered ? 1.8 : strokeW))}
            strokeDasharray={selected ? 'none' : '0'}
            style={{ transition: 'stroke 150ms, stroke-width 150ms', pointerEvents: 'none' }}
      />
      {label && (() => {
        const lbl = label.length > 22 ? label.slice(0, 20) + '\u2026' : label;
        return (
          <g transform={`translate(${mx},${my})`}>
            <title>{label}</title>
            <rect x={-(lbl.length * 2.9 + 6)} y="-7" width={lbl.length * 5.8 + 12} height="14" rx="3" fill="#F7F9FC" />
            <text textAnchor="middle" dominantBaseline="central"
                  style={{ fontSize: 9.5, fill: selected ? '#282828' : '#8A8A8A', fontWeight: selected ? 600 : 400 }}>
              {lbl}
            </text>
          </g>
        );
      })()}
    </g>
  );
}

// ── Graph canvas ─────────────────────────────────────────────────────
function GraphCanvas({ selected, onSelect, onEdgeSelect, neighborSet, neighborEdgeSet, edgeSelectionEndpoints, selectedEdgeKey, edgeReversed, edgeCounts, multiSelectMode, multiSelected, hoveredId, setHoveredId, viewMode, positions, setPositions, view, setView, zoomBy, resetView, edges, search }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  // Drag state stored in ref to avoid rerender thrash
  const drag = useRef({ id: null, dx: 0, dy: 0, moved: false, downId: null });
  const pan = useRef({ active: false, sx: 0, sy: 0, vx: 0, vy: 0, moved: false });
  const [dragId, setDragId] = useState(null);
  const [panning, setPanning] = useState(false);
  const [hoveredEdge, setHoveredEdge] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [floatOffsets, setFloatOffsets] = useState({});

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
        if (drag.current.id === id && drag.current.moved) { next[id] = { x: 0, y: 0 }; continue; }
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
    if (viewMode === 'All') return Object.keys(ENTITY_TYPES);
    if (viewMode === 'Host')     return Object.keys(ENTITY_TYPES).filter(k => ENTITY_TYPES[k].group === 'host' || k === 'finding' || k === 'host');
    if (viewMode === 'Cloud')    return Object.keys(ENTITY_TYPES).filter(k => ENTITY_TYPES[k].group === 'cloud' || k === 'finding');
    if (viewMode === 'Identity') return Object.keys(ENTITY_TYPES).filter(k => ENTITY_TYPES[k].group === 'identity' || k === 'finding');
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

  // A node is dimmed if a selection excludes it OR the search excludes it.
  const isDimmed = (id) => {
    if (selected && !neighborSet.has(id) && id !== selected) return true;
    if (matchActive && !searchMatch.has(id)) return true;
    return false;
  };
  // Edge dimming: dim if selection excludes OR (search active and neither endpoint matches).
  const isEdgeDimmed = (key) => {
    if (selected && !neighborEdgeSet.has(key)) return true;
    if (matchActive) {
      const [a, b] = key.split('|');
      if (!searchMatch.has(a) && !searchMatch.has(b)) return true;
    }
    return false;
  };

  // Convert client coords to SVG coords (handles preserveAspectRatio scaling)
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

  const onNodeDown = (id, e) => {
    const p = toSvgPoint(e.clientX, e.clientY);
    const cur = positions[id];
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
        const cur = positions[id];
        if (Math.hypot(nx - cur.x, ny - cur.y) > 2) drag.current.moved = true;
        setPositions(prev => ({ ...prev, [id]: { x: nx, y: ny } }));
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
        setMousePos({ x: e.clientX - r.left, y: e.clientY - r.top, containerW: r.width });
      }}
      style={{
        position: 'relative',
        background: '#fff',
        border: 'none',
        borderRadius: 4,
        height: 440,
        margin: '0 12px',
        backgroundImage: 'radial-gradient(#E5E7EB 1px, transparent 1px)',
        backgroundSize: '14px 14px',
        backgroundPosition: '0 0',
        userSelect: 'none',
        cursor: panning ? 'grabbing' : 'grab',
        overflow: 'hidden',
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
        if (drag.current.consumed) { drag.current.consumed = false; return; }
      }}
    >
      <svg ref={svgRef} viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        <defs>
          <style>{`text { font-family: 'Inter', system-ui !important; }`}</style>
        </defs>
        {edges.filter(([a,b]) => visibleSet.has(a) && visibleSet.has(b)).map(([a,b,label], i) => {
          const key = `${a}|${b}`;
          return (
            <Edge key={i} a={a} b={b} label={label}
                  edgeKey={key}
                  hoveredEdge={hoveredEdge}
                  hoveredNode={hoveredId}
                  anySelected={!!selected}
                  onEdgeHover={setHoveredEdge}
                  onEdgeClick={multiSelectMode ? null : onEdgeSelect}
                  pointerEvents={multiSelectMode ? 'none' : 'auto'}
                  positions={positions}
                  floatOffsets={floatOffsets}
                  selected={selectedEdgeKey === key}
                  reversed={selectedEdgeKey === key && edgeReversed}
                  dimmed={isEdgeDimmed(key) && isEdgeDimmed(`${b}|${a}`)} />
          );
        })}
        {visibleEntities.map(id => (
          <EntityNode
            key={id}
            id={id}
            def={ENTITY_TYPES[id]}
            pos={positions[id]}
            floatOffset={floatOffsets[id]}
            selected={multiSelectMode ? multiSelected.has(id) : (selected === id || (edgeSelectionEndpoints && edgeSelectionEndpoints.has(id)))}
            countOverride={edgeCounts ? edgeCounts[id] : undefined}
            dimmed={isDimmed(id)}
            hovered={hoveredId === id}
            onHover={setHoveredId}
            onDragStart={onNodeDown}
            dragging={dragId === id}
          />
        ))}
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
          reversed={hoveredEdge && hoveredEdge === selectedEdgeKey && edgeReversed}
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

// ── Data source pill (small two-letter chip) ─────────────────────────
function SourceBadge({ src }) {
  const map = {
    ms:    { label: 'MS',    bg: '#0078D4', fg: '#fff' },
    crwd:  { label: 'CS',    bg: '#FA1F1F', fg: '#fff' },
    azure: { label: 'AZ',    bg: '#0072C6', fg: '#fff' },
    aws:   { label: 'AWS',   bg: '#FF9900', fg: '#101010' },
    k8s:   { label: 'K8',    bg: '#326CE5', fg: '#fff' },
    jira:  { label: 'JR',    bg: '#0052CC', fg: '#fff' },
    '+2':  { label: '+2',    bg: '#E6E6E6', fg: '#282828' },
    '+1':  { label: '+1',    bg: '#E6E6E6', fg: '#282828' },
  };
  const m = map[src] || { label: src, bg: '#E6E6E6', fg: '#282828' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 22, height: 16, borderRadius: 3,
      background: m.bg, color: m.fg,
      fontSize: 9, fontWeight: 700, letterSpacing: '0.04em',
      flexShrink: 0,
    }}>{m.label}</span>
  );
}

// ── OS Family icon ───────────────────────────────────────────────────
function OSPill({ os }) {
  if (os === '—') return <span style={{ color: PAI.fg3 }}>—</span>;
  const map = {
    Windows: { color: '#0078D4' },
    Linux:   { color: '#222' },
    macOS:   { color: '#999' },
  };
  const m = map[os] || { color: '#999' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill={m.color}>
        <path d="M3 4h8v8H3zM13 4h8v8h-8zM3 14h8v8H3zM13 14h8v8h-8z"/>
      </svg>
      <span>{os}</span>
    </span>
  );
}

// ── Header column — design-system .ds-th: F5F5F5 bg, 10px uppercase,
//    .06em letter-spacing, no inter-column dividers, single bottom border
function Th({ children }) {
  return (
    <th style={{
      textAlign: 'left',
      padding: '8px 12px',
      background: '#F5F5F5',
      borderBottom: '1px solid #E6E6E6',
      fontSize: 10, fontWeight: 600, color: '#A3A5AF',
      letterSpacing: '0.01em',
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
function DetailsTable({ rows, totalCount, search, onSearch, onRowClick }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #E6E6E6',
      borderRadius: 6,
      margin: '0 12px 16px',
      overflow: 'hidden',
    }}>
      {/* header bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px',
        borderBottom: '1px solid #E6E6E6',
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: PAI.fg1 }}>
          Details <span style={{ color: PAI.fg3, fontWeight: 400 }}>({fmtN(totalCount)})</span>
        </div>
        <div style={{ flex: 1 }} />
        <DSPillSearch value={search} onChange={onSearch} placeholder="Search Any" width={220} />
        <button className="ds-btn sz-md t-outline" style={{
          height: 32, padding: '0 12px', background: '#fff', border: '1px solid #E6E6E6',
          borderRadius: 44, color: PAI.fg1, fontSize: 12, fontWeight: 500, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'inherit',
        }}>
          Add Column <Ic size={12} path={<><path d="M12 5v14M5 12h14"/></>}/>
        </button>
        <button className="ds-btn sz-md t-primary" style={{
          height: 32, padding: '0 14px', background: '#6360D8', color: '#fff',
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
            ) : rows.map((r, i) => {
              const meta = TYPE_TO_TABLE_LABEL[r.type];
              const ent = ENTITY_TYPES[r.type];
              return (
                <tr key={i} style={{
                  borderBottom: '1px solid #F0F0F0',
                  transition: 'background 120ms cubic-bezier(.2,.8,.2,1)',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.02)'}
                onMouseLeave={e => e.currentTarget.style.background = ''}
                onClick={() => onRowClick && onRowClick(r)}
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
                  <td style={{ padding: '10px 12px', color: PAI.fg1, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums', fontWeight: 400 }}>{r.ip}</td>
                  <td style={{ padding: '10px 12px', color: PAI.fg1, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums', fontWeight: 400 }}>{r.last}</td>
                  <td style={{ padding: '10px 12px', color: PAI.fg1, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums', fontWeight: 400 }}>{r.active}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// PageKG — composes graph + table + selection state
// ─────────────────────────────────────────────────────────────────────
function PageKG() {
  const [selected, setSelected] = useState(null);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [multiSelected, setMultiSelected] = useState(() => new Set());
  const [hoveredId, setHoveredId] = useState(null);
  const [viewMode, setViewMode] = useState('All');
  const [search, setSearch] = useState('');
  const [tableSearch, setTableSearch] = useState('');
  // Set of edge keys that are currently OFF (deselected). When a node is
  // selected, all its edges start as on (active); user can deselect chips
  // to drop those relationships from the filter without losing them.
  const [deselectedChips, setDeselectedChips] = useState(() => new Set());
  // When an edge is clicked, restrict chips to ONLY that edge. Cleared when
  // a node is clicked (which shows all of its relationships).
  const [selectedEdgeKey, setSelectedEdgeKey] = useState(null);
  const [edgeReversed, setEdgeReversed] = useState(false);
  const [positions, setPositions] = useState(() => ({ ...NODE_POS }));
  const [view, setView] = useState({ x: 0, y: 0, w: 940, h: 440 });
  const [isDirty, setIsDirty] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelRow, setPanelRow] = useState(null);
  const [panelTab, setPanelTab] = useState('summary');
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
    if (viewMode === 'All') return new Set(Object.keys(ENTITY_TYPES));
    const ids = Object.keys(ENTITY_TYPES).filter(k => {
      if (k === 'finding') return true;
      const g = ENTITY_TYPES[k]?.group;
      if (viewMode === 'Host')     return g === 'host'     || k === 'host';
      if (viewMode === 'Cloud')    return g === 'cloud';
      if (viewMode === 'Identity') return g === 'identity';
      return true;
    });
    return new Set(ids);
  }, [viewMode]);

  // Auto-select the primary node when entering a tab; clear it when leaving.
  const TAB_DEFAULT = { Host: 'host', Cloud: 'cloudAccount', Identity: 'identity' };
  useEffect(() => {
    const visible = visibleSetByView;
    const def = TAB_DEFAULT[viewMode];
    if (def && !multiSelectMode) {
      setSelected(def);
      setSelectedEdgeKey(null);
      setDeselectedChips(new Set());
    } else if (selected && !visible.has(selected)) {
      setSelected(null);
      setSelectedEdgeKey(null);
      setDeselectedChips(new Set());
    } else {
      if (Object.values(TAB_DEFAULT).includes(selected)) setSelected(null);
      if (selectedEdgeKey) {
        const [a, b] = selectedEdgeKey.split('|');
        if (!visible.has(a) || !visible.has(b)) setSelectedEdgeKey(null);
      }
    }
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
  const setPositionsDirty = (updater) => { setPositions(updater); setIsDirty(true); };
  const setViewDirty = (updater) => { setView(updater); setIsDirty(true); };

  // Reset chip state whenever the selected node changes.
  useEffect(() => {
    setDeselectedChips(new Set());
    setEdgeReversed(false);
    // Node-click path clears the edge-only filter; edge-click path sets it
    // immediately AFTER this effect (via setTimeout in onEdgeSelect).
    setSelectedEdgeKey(null);
  }, [selected]);

  // All relationship chips for the selected node — one per connecting edge.
  // When `selectedEdgeKey` is set, restrict to ONLY that edge.
  const relationshipChips = useMemo(() => {
    if (!selected) return [];
    return edges
      .filter(([a,b]) => a === selected || b === selected)
      .filter(([a,b]) => !selectedEdgeKey || `${a}|${b}` === selectedEdgeKey)
      // Only keep chips whose "other" endpoint is visible under the current view.
      .filter(([a,b]) => {
        const other = a === selected ? b : a;
        return visibleSetByView.has(other);
      })
      .map(([a,b,label]) => {
        const other = a === selected ? b : a;
        const key = `${a}|${b}`;
        return {
          key,
          source: ENTITY_TYPES[selected]?.label || selected,
          relation: label || 'Connected to',
          target: ENTITY_TYPES[other]?.label || other,
          otherId: other,
        };
      });
  }, [selected, edges, selectedEdgeKey, visibleSetByView]);

  // Build adjacency for selection halo — full set (visual halo always shows
  // all connections of the selected node, regardless of chip state).
  const { neighborSet, neighborEdgeSet } = useMemo(() => {
    if (!selected) return { neighborSet: new Set(), neighborEdgeSet: new Set() };
    const ns = new Set([selected]);
    const es = new Set();
    edges.forEach(([a,b]) => {
      if (a === selected) { ns.add(b); es.add(`${a}|${b}`); es.add(`${b}|${a}`); }
      else if (b === selected) { ns.add(a); es.add(`${a}|${b}`); es.add(`${b}|${a}`); }
    });
    return { neighborSet: ns, neighborEdgeSet: es };
  }, [selected, edges]);

  // Active neighbor set for FILTERING — only neighbors whose chip is on.
  // Also build active edge set so the graph can dim deselected edges.
  const { activeNeighborSet, activeNeighborEdgeSet } = useMemo(() => {
    if (!selected) return { activeNeighborSet: new Set(), activeNeighborEdgeSet: new Set() };
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

  // Filter rows: node-only selection → that node's type; edge selection → both endpoint types.
  const filteredRows = useMemo(() => {
    let rs = ROWS;
    if (multiSelectMode) {
      if (multiSelected.size > 0) rs = rs.filter(r => multiSelected.has(r.type));
    } else if (selected && !selectedEdgeKey) {
      rs = rs.filter(r => r.type === selected);
    } else if (selectedEdgeKey) {
      const [a, b] = selectedEdgeKey.split('|');
      rs = rs.filter(r => r.type === a || r.type === b);
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
  }, [selected, selectedEdgeKey, multiSelectMode, multiSelected, tableSearch]);

  // Total count for header
  const totalCount = useMemo(() => {
    if (multiSelectMode) {
      if (multiSelected.size === 0) return 15730247;
      let sum = 0;
      multiSelected.forEach(t => { if (ENTITY_TYPES[t]) sum += ENTITY_TYPES[t].count; });
      return sum;
    }
    if (!selected) return 15730247;
    if (!selectedEdgeKey) return ENTITY_TYPES[selected]?.count || 0;
    const [a] = selectedEdgeKey.split('|');
    const counts = EDGE_COUNTS[selectedEdgeKey];
    return counts ? (counts[a] || 0) : (ENTITY_TYPES[a]?.count || 0);
  }, [selected, selectedEdgeKey, multiSelectMode, multiSelected]);

  return (
    <div style={{ padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Summary card */}
      <div style={{
        background: '#fff',
        border: '1px solid #E6E6E6',
        borderRadius: 6,
        margin: '0 12px',
        overflow: 'hidden',
      }}>
        {/* Card header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 16px',
          borderBottom: '1px solid #E6E6E6',
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: PAI.fg1 }}>Summary</div>
          <div style={{ flex: 1 }} />
          <SegmentedTabs
            value={'Relationships'}
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

        {/* Toolbar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 16px',
        }}>
          <span style={{
            fontSize: 12, color: '#A3A5AF', fontWeight: 500,
          }}>Attack Surface:</span>
          <ViewTabs value={viewMode} onChange={v => { setViewMode(v); setIsDirty(true); }} options={['All','Host','Cloud','Identity']}/>
          <div style={{ flex: 1 }} />
          <DSPillSearch value={search} onChange={v => { setSearch(v); if (v) setIsDirty(true); }} placeholder="Search Nodes" width={220} />
          <button
            onClick={() => {
              const next = !multiSelectMode;
              setMultiSelectMode(next);
              setIsDirty(true);
              if (next) {
                if (selected) setMultiSelected(new Set([selected]));
                setSelected(null);
                setSelectedEdgeKey(null);
                setEdgeReversed(false);
              } else {
                setMultiSelected(new Set());
              }
            }}
            title="Select multiple nodes to compare their entity counts"
            style={{
              height: 32, padding: '0 14px',
              background: multiSelectMode ? '#EEEEFD' : '#fff',
              border: `1px solid ${multiSelectMode ? '#C9C7F2' : '#E6E6E6'}`,
              borderRadius: 44, color: multiSelectMode ? '#504BB8' : '#6E6E6E',
              fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
              display: 'inline-flex', alignItems: 'center', gap: 6,
              transition: 'all 150ms cubic-bezier(.2,.8,.2,1)',
            }}
          >
            Multi-select{multiSelected.size > 0 && ` (${multiSelected.size})`}
          </button>
          <button
            onClick={isDirty ? () => { setSelected(null); setSelectedEdgeKey(null); setMultiSelectMode(false); setMultiSelected(new Set()); setSearch(''); setViewMode('All'); setPositions({ ...NODE_POS }); resetView(); setIsDirty(false); } : undefined}
            className="ds-btn sz-md t-outline"
            style={{
              height: 32, padding: '0 14px',
              background: '#fff', border: `1px solid ${isDirty ? '#F5C0C0' : '#E6E6E6'}`,
              borderRadius: 44, color: isDirty ? '#E15252' : '#6E6E6E',
              fontSize: 12, fontWeight: 500, cursor: isDirty ? 'pointer' : 'default', fontFamily: 'inherit',
              display: 'inline-flex', alignItems: 'center', gap: 6,
              transition: 'all 150ms cubic-bezier(.2,.8,.2,1)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 7.2561C8.84388 7.2562 9.5127 7.92682 9.5127 8.76978C9.5126 9.61265 8.84382 10.2824 8 10.2825C7.15609 10.2825 6.48642 9.61271 6.48633 8.76978C6.48633 7.92676 7.15603 7.2561 8 7.2561Z" fill="currentColor" stroke="currentColor" strokeWidth="0.555556"/>
              <path d="M3.26953 8.76914C3.26953 9.70481 3.54697 10.6195 4.06676 11.3974C4.58655 12.1754 5.32534 12.7818 6.18972 13.1399C7.05409 13.4979 8.00523 13.5916 8.92285 13.4091C9.84047 13.2265 10.6834 12.776 11.3449 12.1143C12.0065 11.4527 12.457 10.6098 12.6395 9.69208C12.8221 8.77439 12.7284 7.82317 12.3704 6.95873C12.0123 6.09428 11.406 5.35543 10.6281 4.8356C9.87356 4.3314 8.99047 4.05522 8.08433 4.03906" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7.80005 5.6189L5.68774 4.02417L7.80005 2.42944V5.6189Z" fill="currentColor" stroke="currentColor" strokeWidth="0.555556"/>
            </svg>
            Reset
          </button>
        </div>

        {/* Graph + zoom rail */}
        <div style={{ position: 'relative' }}>
          <GraphCanvas
            selected={selected}
            onSelect={(id) => {
              setIsDirty(true);
              if (multiSelectMode) {
                if (!id) { setMultiSelected(new Set()); return; }
                setMultiSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
              } else {
                if (!id) { setSelected(null); setSelectedEdgeKey(null); }
                else { setSelected(prev => prev === id ? null : id); setSelectedEdgeKey(null); }
              }
            }}
            onEdgeSelect={(a, b, key) => {
              if (multiSelectMode) return;
              setIsDirty(true);
              // Re-clicking the already-selected edge clears the selection.
              if (selectedEdgeKey === key) {
                setSelected(null);
                setSelectedEdgeKey(null);
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
            multiSelectMode={multiSelectMode}
            multiSelected={multiSelected}
            neighborSet={(selected || multiSelectMode) ? { has: () => true } : activeNeighborSet}
            neighborEdgeSet={(selected || multiSelectMode) ? { has: () => true } : activeNeighborEdgeSet}
            selectedEdgeKey={selectedEdgeKey}
            edgeReversed={edgeReversed}
            edgeCounts={selectedEdgeKey ? (EDGE_COUNTS[selectedEdgeKey] || null) : null}
            edgeSelectionEndpoints={selectedEdgeKey ? new Set(selectedEdgeKey.split('|')) : null}
            hoveredId={hoveredId}
            setHoveredId={setHoveredId}
            viewMode={viewMode}
            positions={positions}
            setPositions={setPositionsDirty}
            view={view}
            setView={setViewDirty}
            edges={edges}
            search={search}
          />
          {/* Bottom-left rail: zoom in / zoom out */}
          <div style={{
            position: 'absolute', left: 16, bottom: 12,
            display: 'flex', flexDirection: 'column', gap: 6,
          }}>
            <RailBtn onClick={() => zoomBy(0.8)} icon={<Ic size={14} path={<><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/><path d="M11 8v6M8 11h6"/></>}/>}/>
            <RailBtn onClick={() => zoomBy(1.25)} icon={<Ic size={14} path={<><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/><path d="M8 11h6"/></>}/>}/>
          </div>
          {/* Bottom-left zoom indicator (hidden) */}
          {/* <ZoomIndicator view={view}/> */}
        </div>

        {/* Hint / filter chip footer */}
        {edges.length === 0 ? (
          <div style={{
            height: 44, padding: '0 16px', boxSizing: 'border-box',
            borderTop: '1px solid #F0F0F0',
            display: 'flex', alignItems: 'center',
            fontSize: 11, color: PAI.fg3, fontStyle: 'italic',
          }}>No relationships configured.</div>
        ) : multiSelectMode ? (
          <div style={{
            height: 44, padding: '0 16px', boxSizing: 'border-box',
            borderTop: '1px solid #F0F0F0',
            display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', overflow: 'hidden',
          }}>
            {multiSelected.size === 0 ? (
              <span style={{ fontSize: 11, color: PAI.fg3 }}>Click nodes to multi-select and filter the details table.</span>
            ) : (
              <>
                <span style={{ fontSize: 11, color: PAI.fg3, flexShrink: 0 }}>Details table filtered by:</span>
              {[...multiSelected].map(id => (
                <span key={id} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  height: 24, padding: '0 8px 0 12px',
                  background: '#EEEEFD', border: '1px solid #C9C7F2',
                  borderRadius: 44, color: '#504BB8',
                  fontSize: 11, fontWeight: 600, fontFamily: 'inherit',
                }}>
                  {ENTITY_TYPES[id]?.label || id}
                  {ENTITY_TYPES[id]?.count !== undefined && (
                    <span>({fmtN(ENTITY_TYPES[id].count)})</span>
                  )}
                  <button onClick={() => setMultiSelected(prev => { const n = new Set(prev); n.delete(id); return n; })}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#7E7BD0', lineHeight: 1, fontSize: 14, display: 'flex' }}>×</button>
                </span>
              ))}
              </>
            )}
          </div>
        ) : selected ? (() => {
          let chipText;
          const isEdge = !!selectedEdgeKey;
          if (isEdge) {
            const [a, b] = selectedEdgeKey.split('|');
            const rel = edges.find(([ea, eb]) => ea === a && eb === b)?.[2] || 'connected to';
            const src = edgeReversed ? b : a;
            const tgt = edgeReversed ? a : b;
            chipText = `${ENTITY_TYPES[src]?.label || src} ${rel} ${ENTITY_TYPES[tgt]?.label || tgt}`;
          } else {
            chipText = ENTITY_TYPES[selected]?.label || selected;
          }
          return (
            <div style={{
              height: 44, padding: '0 16px', boxSizing: 'border-box',
              borderTop: '1px solid #F0F0F0',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ fontSize: 11, color: PAI.fg3, flexShrink: 0 }}>Details table filtered by:</span>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                height: 24, padding: '0 8px 0 12px',
                background: '#EEEEFD', border: '1px solid #C9C7F2',
                borderRadius: 44, color: '#504BB8',
                fontSize: 11, fontWeight: 600, fontFamily: 'inherit',
              }}>
                {chipText}
                {!isEdge && ENTITY_TYPES[selected]?.count !== undefined && (
                  <span>({fmtN(ENTITY_TYPES[selected].count)})</span>
                )}
                {isEdge && (
                  <button
                    onClick={() => setEdgeReversed(r => !r)}
                    title="Reverse relationship"
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#7E7BD0', lineHeight: 1, display: 'flex', transform: edgeReversed ? 'scaleX(-1)' : 'none' }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                    </svg>
                  </button>
                )}
                <button
                  onClick={() => { setSelected(null); setSelectedEdgeKey(null); }}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#7E7BD0', lineHeight: 1, fontSize: 14, display: 'flex' }}
                >×</button>
              </span>
            </div>
          );
        })() : (
          <div style={{
            height: 44, padding: '0 16px', boxSizing: 'border-box',
            borderTop: '1px solid #F0F0F0',
            display: 'flex', alignItems: 'center',
            fontSize: 11, color: PAI.fg3,
          }}>
            <span>Click a node or relationship to filter the details table.</span>
          </div>
        )}
      </div>

      <DetailsTable
        rows={filteredRows}
        totalCount={totalCount}
        search={tableSearch}
        onSearch={setTableSearch}
        onRowClick={(row) => { setPanelRow(row); setPanelOpen(true); setPanelTab('summary'); }}
      />

      {/* ── Panel overlay ── */}
      <div
        onClick={() => setPanelOpen(false)}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)',
          zIndex: 299, display: panelOpen ? 'block' : 'none',
        }}
      />

      {/* ── Detail panel ── */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: '55%',
        background: '#fff', borderLeft: '1px solid #E6E6E6',
        zIndex: 300,
        transform: panelOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.28s cubic-bezier(.2,.8,.2,1)',
        display: 'flex', flexDirection: 'column',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.12)',
        fontFamily: "'Inter', system-ui",
      }}>
        {panelRow && (() => {
          const meta = TYPE_TO_TABLE_LABEL[panelRow.type] || {};
          const ent  = ENTITY_TYPES[panelRow.type]        || {};
          return (
            <>
              {/* Panel header */}
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #E6E6E6', flexShrink: 0, background: '#fff' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                  {/* Entity icon circle */}
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: ent.tint || '#F5F5F5',
                    border: `2px solid ${ent.stroke || '#E6E6E6'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <EntityGlyph kind={meta.glyph} size={22} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: 15, fontWeight: 700, color: PAI.fg1,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 340,
                      }}>
                        {panelRow.label}
                      </span>
                      <span style={{
                        border: `1px solid ${ent.stroke || '#E6E6E6'}`, color: ent.icon || '#6360D8',
                        borderRadius: 44, padding: '2px 8px', fontSize: 11, fontWeight: 600, flexShrink: 0,
                      }}>
                        {meta.type || panelRow.type}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, color: PAI.fg3 }}>
                        IP: <span style={{ color: PAI.fg2, fontWeight: 500 }}>{panelRow.ip}</span>
                      </span>
                      <span style={{ fontSize: 11, color: PAI.fg3 }}>
                        OS: <span style={{ color: PAI.fg2, fontWeight: 500 }}>{meta.os}</span>
                      </span>
                      <span style={{ fontSize: 11, color: PAI.fg3 }}>
                        Last Active: <span style={{ color: PAI.fg2, fontWeight: 500 }}>{panelRow.active}</span>
                      </span>
                    </div>
                  </div>
                  {/* Close button */}
                  <button
                    onClick={() => setPanelOpen(false)}
                    style={{
                      background: 'none', border: 'none', color: PAI.fg3,
                      cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', flexShrink: 0,
                      borderRadius: 6,
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>

                {/* Entity Relationship mini-graph */}
                <div style={{ border: '1px solid #E6E6E6', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{
                    padding: '8px 12px', background: '#FAFAFA', borderBottom: '1px solid #E6E6E6',
                    fontSize: 11, fontWeight: 600, color: PAI.fg1,
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    Entity Relationship Summary
                  </div>
                  <div style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <svg width="280" height="90" style={{ display: 'block', overflow: 'visible', flex: 1 }}>
                      <line x1="90" y1="44" x2="190" y2="44" stroke="#D6D6D6" strokeWidth="1.5"/>
                      <text x="140" y="38" textAnchor="middle" fontSize="9" fill={PAI.fg3} fontFamily="inherit">Has</text>
                      {/* Entity node */}
                      <circle cx="60" cy="44" r="28" fill={ent.tint || '#F5F5F5'} stroke={ent.stroke || '#E6E6E6'} strokeWidth="1.5"/>
                      <foreignObject x="44" y="30" width="32" height="32" style={{ pointerEvents: 'none' }}>
                        <div xmlns="http://www.w3.org/1999/xhtml" style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <EntityGlyph kind={meta.glyph} size={20} />
                        </div>
                      </foreignObject>
                      <text x="60" y="82" textAnchor="middle" fontSize="9" fill={PAI.fg2} fontWeight="600" fontFamily="inherit">
                        {(meta.type || panelRow.type).slice(0, 12)}
                      </text>
                      {/* Finding node */}
                      <circle cx="220" cy="44" r="22" fill={ENTITY_TYPES.finding.tint} stroke={ENTITY_TYPES.finding.stroke} strokeWidth="1.5"/>
                      <foreignObject x="204" y="30" width="32" height="32" style={{ pointerEvents: 'none' }}>
                        <div xmlns="http://www.w3.org/1999/xhtml" style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <EntityGlyph kind="finding" size={20} />
                        </div>
                      </foreignObject>
                      <text x="220" y="82" textAnchor="middle" fontSize="9" fill={ENTITY_TYPES.finding.icon} fontWeight="600" fontFamily="inherit">Finding</text>
                      {/* Count badge */}
                      <circle cx="244" cy="20" r="9" fill="#6360D8"/>
                      <text x="244" y="23" textAnchor="middle" fontSize="8" fill="#fff" fontWeight="700" fontFamily="inherit">
                        {(ent.count || 0) > 999 ? fmtN(ent.count).slice(0,4) : fmtN(ent.count || 0)}
                      </text>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div style={{ borderBottom: '1px solid #E6E6E6', background: '#fff', flexShrink: 0, paddingLeft: 20, display: 'flex' }}>
                {['summary', 'evolution', 'derivation'].map(t => (
                  <button
                    key={t}
                    onClick={() => setPanelTab(t)}
                    style={{
                      padding: '8px 14px', fontSize: 12, fontWeight: panelTab === t ? 600 : 500,
                      border: 'none', background: 'transparent', cursor: 'pointer',
                      color: panelTab === t ? '#6360D8' : PAI.fg3,
                      borderBottom: panelTab === t ? '2px solid #6360D8' : '2px solid transparent',
                      marginBottom: -1, fontFamily: 'inherit',
                      transition: 'color 150ms, border-color 150ms',
                      textTransform: 'capitalize',
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Panel body */}
              <div style={{ flex: 1, overflowY: 'auto', background: '#F7F9FC', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>

                {panelTab === 'summary' && (
                  <>
                    {/* General Information */}
                    <div style={{ background: '#fff', border: '1px solid #E6E6E6', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ padding: '10px 14px', background: '#FAFAFA', fontSize: 12, fontWeight: 600, color: PAI.fg1, borderBottom: '1px solid #E6E6E6' }}>
                        General Information
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                        {[
                          ['Display Label', panelRow.label],
                          ['Type',          meta.type || panelRow.type],
                          ['OS Family',     meta.os],
                          ['IP Address',    panelRow.ip],
                          ['Last Found',    panelRow.last],
                          ['Last Active',   panelRow.active],
                        ].map(([k, v], i) => (
                          <div key={k} style={{
                            padding: '8px 14px',
                            borderBottom: i < 4 ? '1px solid #F5F5F5' : 'none',
                            borderRight: i % 2 === 0 ? '1px solid #F5F5F5' : 'none',
                          }}>
                            <div style={{ fontSize: 10, color: PAI.fg3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>{k}</div>
                            <div style={{ fontSize: 12, color: PAI.fg1, wordBreak: 'break-all' }}>{v}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Data Sources */}
                    <div style={{ background: '#fff', border: '1px solid #E6E6E6', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ padding: '10px 14px', background: '#FAFAFA', fontSize: 12, fontWeight: 600, color: PAI.fg1, borderBottom: '1px solid #E6E6E6' }}>
                        Data Sources
                      </div>
                      <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        {(meta.sources || []).map((s, i) => <SourceBadge key={i} src={s} />)}
                      </div>
                    </div>

                    {/* Findings severity breakdown */}
                    <div style={{ background: '#fff', border: '1px solid #E6E6E6', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{
                        padding: '10px 14px', background: '#FAFAFA', fontSize: 12, fontWeight: 600,
                        color: PAI.fg1, borderBottom: '1px solid #E6E6E6',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      }}>
                        <span>Findings</span>
                        <span style={{ fontWeight: 400, color: PAI.fg3, fontSize: 11 }}>({fmtN(ent.count || 0)})</span>
                      </div>
                      <div style={{ padding: '12px 14px' }}>
                        {[
                          { label: 'Critical', pct: 4,  color: '#D12329' },
                          { label: 'High',     pct: 21, color: '#f97316' },
                          { label: 'Medium',   pct: 68, color: '#eab308' },
                          { label: 'Low',      pct: 7,  color: '#16a34a' },
                        ].map(s => (
                          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                            <span style={{ width: 54, fontSize: 11, color: PAI.fg3, flexShrink: 0 }}>{s.label}</span>
                            <div style={{ flex: 1, height: 6, background: '#F5F5F5', borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${s.pct}%`, background: s.color, borderRadius: 3 }} />
                            </div>
                            <span style={{ width: 44, fontSize: 11, fontWeight: 600, color: PAI.fg2, flexShrink: 0, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                              {Math.floor((ent.count || 0) * s.pct / 100).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {panelTab === 'evolution' && (
                  <div style={{ background: '#fff', border: '1px solid #E6E6E6', borderRadius: 4, padding: '24px 20px', color: PAI.fg3, fontSize: 12, textAlign: 'center', lineHeight: 1.7 }}>
                    Evolution history for <strong style={{ color: PAI.fg1 }}>{panelRow.label}</strong>.<br/>
                    Track how attributes changed over time across data sources.
                  </div>
                )}

                {panelTab === 'derivation' && (
                  <div style={{ background: '#fff', border: '1px solid #E6E6E6', borderRadius: 4, padding: '24px 20px', color: PAI.fg3, fontSize: 12, textAlign: 'center', lineHeight: 1.7 }}>
                    Derivation graph for <strong style={{ color: PAI.fg1 }}>{panelRow.label}</strong>.<br/>
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
function SegmentedTabs({ value, options, onChange, fullWidth, compact }) {
  const containerRef = useRef(null);
  const btnRefs = useRef([]);
  const [thumb, setThumb] = useState({ left: 3, width: 0 });

  useEffect(() => {
    const idx = options.indexOf(value);
    const btn = btnRefs.current[idx];
    if (btn) {
      setThumb({ left: btn.offsetLeft, width: btn.offsetWidth });
    }
  }, [value, options.join('|')]);

  return (
    <div ref={containerRef} style={{
      position: 'relative',
      display: fullWidth ? 'flex' : 'inline-flex',
      width: fullWidth ? '100%' : undefined,
      alignItems: 'center',
      height: 32,
      padding: 3,
      background: '#F2F2F4',
      borderRadius: 999,
      gap: 0,
    }}>
      {/* sliding white thumb — sized to match active segment */}
      <div style={{
        position: 'absolute',
        top: 3, bottom: 3,
        left: thumb.left,
        width: thumb.width,
        background: '#fff',
        border: '1px solid #E6E6E6',
        borderRadius: 999,
        transition: 'left 200ms cubic-bezier(.2,.8,.2,1), width 200ms cubic-bezier(.2,.8,.2,1)',
        boxShadow: '0 1px 2px rgba(16,16,16,0.04)',
        boxSizing: 'border-box',
        opacity: thumb.width ? 1 : 0,
      }} />
      {options.map((o, i) => {
        const active = o === value;
        // Show divider on the LEFT of inactive segments that aren't first,
        // unless the previous segment is the active one.
        const showDivider = i > 0 && !active && options[i - 1] !== value;
        return (
          <button
            key={o}
            ref={el => btnRefs.current[i] = el}
            onClick={() => onChange && onChange(o)}
            style={{
              position: 'relative', zIndex: 1,
              padding: compact ? '0 8px' : '0 16px',
              height: 26,
              flex: fullWidth ? 1 : undefined,
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
                width: 1, background: '#D9D9DC',
                pointerEvents: 'none',
              }} />
            )}
            {o}
          </button>
        );
      })}
    </div>
  );
}

// ── View tabs (Host / Cloud / Identity) — same dual-toggle style ──
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
        background: 'rgba(255,255,255,0.92)',
        border: '1px solid #E6E6E6',
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
        background: hover ? '#EBEBEB' : '#F5F5F5',
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
      background: '#fff',
      border: '1px solid #E6E6E6',
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
function FilterChipBar({ chips, deselected, selectedLabel, onToggle }) {
  if (chips.length === 0) {
    return (
      <div style={{
        padding: '10px 16px',
        borderTop: '1px solid #F0F0F0',
      }}>
        <span style={{ fontSize: 11, color: PAI.fg3 }}>
          <strong style={{ fontWeight: 600, color: PAI.fg2 }}>{selectedLabel}</strong> has no relationships in this view.
        </span>
      </div>
    );
  }
  return (
    <div style={{
      padding: '10px 16px',
      borderTop: '1px solid #F0F0F0',
      display: 'flex', alignItems: 'center', gap: 10,
      flexWrap: 'wrap',
    }}>
      <span style={{ fontSize: 11, color: PAI.fg3, flexShrink: 0 }}>Details Table filtered by:</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
        {chips.map(c => {
          const off = deselected.has(c.key);
          return (
            <button
              key={c.key}
              onClick={() => onToggle(c.key)}
              title={off ? 'Click to include in filter' : 'Click to exclude from filter'}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                height: 24, padding: '0 12px',
                background: off ? '#F5F5F5' : '#EEEEFD',
                border: `1px solid ${off ? '#E6E6E6' : '#C9C7F2'}`,
                borderRadius: 44,
                color: off ? PAI.fg3 : '#504BB8',
                fontSize: 11, fontWeight: 500, fontFamily: 'inherit',
                cursor: 'pointer',
                transition: 'all 150ms cubic-bezier(.2,.8,.2,1)',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontWeight: 600 }}>{c.source}</span>
                <span style={{ fontWeight: 400, color: off ? PAI.fg3 : '#7E7BD0' }}>{c.relation}</span>
                <span style={{ fontWeight: 600 }}>{c.target}</span>
                {ENTITY_TYPES[c.otherId]?.count !== undefined && (
                  <span style={{ fontWeight: 600 }}>({fmtN(ENTITY_TYPES[c.otherId].count)})</span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { PageKG, SegmentedTabs };

// ── HoverTooltip ─────────────────────────────────────────────────────
function HoverTooltip({ nodeId, edgeKey, mousePos, edges, reversed }) {
  // Find context
  let kind = null, content = null;
  if (nodeId) {
    const def = ENTITY_TYPES[nodeId];
    kind = 'node';
    content = (
      <div>
        <div style={{
          padding: '8px 12px',
          borderBottom: '1px solid #F0F0F0',
          display: 'flex', alignItems: 'center', gap: 8,
          background: def.tint + '40',
        }}>
          <div style={{ display: 'flex' }}>
            <EntityGlyph kind={def.glyph} size={18} />
          </div>
          <div style={{ color: def.icon || def.stroke, fontSize: 12, fontWeight: 600 }}>{def.label}</div>
        </div>
        <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 6, minWidth: 200 }}>
          <Row k="Entity Count" v={fmtN(def.count)} />
          <Row k="Fragments" v={fmtN(def.fragments || def.count)} />
          <Row k="Resolved" v={`${(def.count / (def.fragments || def.count) * 100).toFixed(2)}%`} />
        </div>
      </div>
    );
  } else if (edgeKey) {
    const [a, b] = edgeKey.split('|');
    const edgeDef = (edges || []).find(([x,y]) => (x===a&&y===b) || (x===b&&y===a));
    if (!edgeDef) return null;
    const [rawSrc, rawTgt, rel] = edgeDef;
    const src = reversed ? rawTgt : rawSrc;
    const tgt = reversed ? rawSrc : rawTgt;
    const srcDef = ENTITY_TYPES[src], tgtDef = ENTITY_TYPES[tgt];
    kind = 'edge';
    content = (
      <div>
        <div style={{
          padding: '8px 12px',
          borderBottom: '1px solid #F0F0F0',
          fontSize: 12, fontWeight: 600, color: PAI.fg1,
        }}>
          {srcDef.label} <span style={{ color: PAI.fg3, fontWeight: 500 }}>{rel || 'connected to'}</span> {tgtDef.label}
        </div>
        <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 6, minWidth: 220 }}>
          <Row k="Source Entity" v={srcDef.label} />
          <Row k="Target Entity" v={tgtDef.label} />
          <Row k="Relationship Count" v={'2'} />
        </div>
      </div>
    );
  }
  if (!content) return null;

  // Position tooltip: flip to left of cursor when near the right edge
  const TOOLTIP_W = 240;
  const containerW = mousePos.containerW || 900;
  const flipLeft = mousePos.x + 16 + TOOLTIP_W > containerW;
  const left = flipLeft ? mousePos.x - TOOLTIP_W - 8 : mousePos.x + 16;
  const top = Math.min(mousePos.y + 16, 320);

  return (
    <div style={{
      position: 'absolute', left, top, zIndex: 30,
      background: '#fff',
      border: '1px solid #E6E6E6',
      borderRadius: 8,
      boxShadow: '0 8px 24px rgba(16,16,16,0.08), 0 2px 6px rgba(16,16,16,0.04)',
      pointerEvents: 'none',
      fontFamily: 'inherit',
    }}>
      {content}
    </div>
  );
}

function Row({ k, v }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
      <span style={{ fontSize: 11, color: PAI.fg3 }}>{k}</span>
      <span style={{ fontSize: 12, color: PAI.fg1, fontWeight: 400, fontVariantNumeric: 'tabular-nums', fontFamily: 'Inter, system-ui, sans-serif' }}>{v}</span>
    </div>
  );
}
