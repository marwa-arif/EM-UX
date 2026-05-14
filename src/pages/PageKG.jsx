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

const NODE_POS = (() => {
  const cx = 470, cy = 220, rx = 400, ry = 162;
  const order = [
    'group', 'identity', 'account', 'person',
    'application', 'cluster', 'container',
    'cloudAccount', 'network', 'netSvc', 'netIface',
    'storage', 'vulnerability', 'host',
    'assessment', 'ticket',
  ];
  const N = order.length;
  const pos = { finding: { x: cx, y: cy } };
  for (let i = 0; i < N; i++) {
    const t = Math.PI * 0.85 + (i / N) * 2 * Math.PI;
    pos[order[i]] = {
      x: Math.round(cx + rx * Math.cos(t)),
      y: Math.round(cy + ry * Math.sin(t)),
    };
  }
  return pos;
})();

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

function fmtN(n) {
  return n.toLocaleString('en-US');
}

// ── Entity Node ───────────────────────────────────────────────────────
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
      <foreignObject x={-11} y={-11} width={22} height={22} style={{ pointerEvents: 'none' }}>
        <div xmlns="http://www.w3.org/1999/xhtml" style={{ width: 22, height: 22 }}>
          <EntityGlyph kind={def.glyph} size={22} />
        </div>
      </foreignObject>
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

// ── Edge ──────────────────────────────────────────────────────────────
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
    const r = 22;
    const loopR = 14;
    const startAngle = -135 * Math.PI / 180;
    const endAngle = -45 * Math.PI / 180;
    const sx = pa.x + Math.cos(startAngle) * r;
    const sy = pa.y + Math.sin(startAngle) * r;
    const ex = pa.x + Math.cos(endAngle) * r;
    const ey = pa.y + Math.sin(endAngle) * r;
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
            <linearGradient id={gradId} gradientUnits="userSpaceOnUse" x1={sx} y1={sy} x2={ex} y2={ey}>
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
          const lbl = label.length > 22 ? label.slice(0, 20) + '…' : label;
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

  const ra = 22, rb = 22;
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
          <linearGradient id={gradId} gradientUnits="userSpaceOnUse" x1={x1} y1={y1} x2={x2} y2={y2}>
            <stop offset="0%" stopColor={colorA} />
            <stop offset="100%" stopColor={colorB} />
          </linearGradient>
        </defs>
      )}
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="transparent" strokeWidth="10" style={{ cursor: 'pointer' }} />
      <line x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={selected ? stroke : (isHovered ? '#A2A1F7' : (isNodeHovered ? '#A2A1F7' : '#D6D6D6'))}
            strokeWidth={selected ? 1.6 : (isHovered ? 1.6 : (isNodeHovered ? 1.8 : strokeW))}
            strokeDasharray={selected ? 'none' : '0'}
            style={{ transition: 'stroke 150ms, stroke-width 150ms', pointerEvents: 'none' }}
      />
      {label && (() => {
        const lbl = label.length > 22 ? label.slice(0, 20) + '…' : label;
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

// ── Graph canvas ──────────────────────────────────────────────────────
function GraphCanvas({ selected, onSelect, onEdgeSelect, neighborSet, neighborEdgeSet, edgeSelectionEndpoints, selectedEdgeKey, edgeReversed, edgeCounts, multiSelectMode, multiSelected, hoveredId, setHoveredId, viewMode, positions, setPositions, view, setView, zoomBy, resetView, edges, search }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const drag = useRef({ id: null, dx: 0, dy: 0, moved: false, downId: null });
  const pan = useRef({ active: false, sx: 0, sy: 0, vx: 0, vy: 0, moved: false });
  const [dragId, setDragId] = useState(null);
  const [panning, setPanning] = useState(false);
  const [hoveredEdge, setHoveredEdge] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [floatOffsets, setFloatOffsets] = useState({});

  const floatParams = useMemo(() => {
    const p = {};
    Object.keys(ENTITY_TYPES).forEach((id, i) => {
      const h = (id.charCodeAt(0) * 31 + (id.charCodeAt(1) || 0) * 7 + i * 13);
      p[id] = {
        phaseX: (h % 100) / 100 * Math.PI * 2,
        phaseY: ((h * 7) % 100) / 100 * Math.PI * 2,
        jAmpX: ((h * 3) % 21 - 10) / 10,
        jAmpY: ((h * 5) % 21 - 10) / 10,
        jSpdX: ((h * 11) % 21 - 10) / 10,
        jSpdY: ((h * 17) % 21 - 10) / 10,
      };
    });
    return p;
  }, []);

  useEffect(() => {
    let raf, start = performance.now();
    const tick = (now) => {
      const tw = window.__floatTweaks || {};
      const enabled = tw.floatEnabled !== false;
      const ampX = enabled ? (tw.ampX ?? 3) : 0;
      const ampY = enabled ? (tw.ampY ?? 2.5) : 0;
      const spdX = tw.speedX ?? 0.55;
      const spdY = tw.speedY ?? 0.45;
      const v = (tw.variation ?? 50) / 100;

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

  const q = (search || '').trim().toLowerCase();
  const searchMatch = new Set(
    q ? visibleEntities.filter(id => (ENTITY_TYPES[id]?.label || '').toLowerCase().includes(q)) : visibleEntities
  );
  const matchActive = q.length > 0;

  const isDimmed = (id) => {
    if (selected && !neighborSet.has(id) && id !== selected) return true;
    if (matchActive && !searchMatch.has(id)) return true;
    return false;
  };
  const isEdgeDimmed = (key) => {
    if (selected && !neighborEdgeSet.has(key)) return true;
    if (matchActive) {
      const [a, b] = key.split('|');
      if (!searchMatch.has(a) && !searchMatch.has(b)) return true;
    }
    return false;
  };

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
      className={`kg-graph${panning ? ' kg-graph--panning' : ''}`}
      onMouseMove={(e) => {
        const r = containerRef.current.getBoundingClientRect();
        setMousePos({ x: e.clientX - r.left, y: e.clientY - r.top, containerW: r.width });
      }}
      onMouseDown={(e) => {
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
            key={id} id={id}
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
          subtitle={`Nothing matches “${q}”. Try a different search.`}
        />
      ) : null}

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

// ── Sample table data ─────────────────────────────────────────────────
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
  { label: 'support-portal.acme.io',       type: 'host',         ip: '198.1.2.1, 192.168.1.5', last: '2023-10-21', active: '2024-08-11' },
  { label: 'edge-router-03',                type: 'host',         ip: '10.0.4.18',              last: '2024-02-04', active: '2024-09-22' },
  { label: 'win-build-08.corp.local',       type: 'host',         ip: '10.12.2.44',             last: '2024-04-19', active: '2024-09-30' },
  { label: 'mac-mini-arm64-12',             type: 'host',         ip: '10.5.18.221',            last: '2024-06-30', active: '2024-09-15' },
  { label: 'kiosk-02.retail.acme.io',       type: 'host',         ip: '172.16.4.5',             last: '2024-01-12', active: '2024-08-08' },
  { label: 'JANE LEWIS',                    type: 'person',       ip: '198.168.2.1',            last: '2024-08-11', active: '2023-10-21' },
  { label: 'MARK PHILLIPS',                 type: 'person',       ip: '—',                      last: '2024-09-15', active: '2024-09-30' },
  { label: 'jane.lewis@acme.io',            type: 'identity',     ip: '—',                      last: '2024-08-11', active: '2024-09-22' },
  { label: 'mark.phillips@acme.io',         type: 'identity',     ip: '—',                      last: '2024-08-11', active: '2024-09-30' },
  { label: 'svc-deploy@acme.io',            type: 'identity',     ip: '—',                      last: '2024-04-02', active: '2024-09-30' },
  { label: 'acme-prod-aws',                 type: 'account',      ip: '—',                      last: '2024-09-22', active: '2024-09-30' },
  { label: 'acme-stage-azure',              type: 'account',      ip: '—',                      last: '2024-09-15', active: '2024-09-30' },
  { label: 'acme-portal v4.2',              type: 'application',  ip: '—',                      last: '2024-08-30', active: '2024-09-30' },
  { label: 'finance-dashboard',             type: 'application',  ip: '—',                      last: '2024-09-02', active: '2024-09-29' },
  { label: 'CVE-2024-3094',                 type: 'vulnerability', ip: '—',                     last: '2024-04-01', active: '2024-09-29' },
  { label: 'CVE-2024-21412',                type: 'vulnerability', ip: '—',                     last: '2024-03-12', active: '2024-09-21' },
  { label: 'Open SSH on 0.0.0.0',           type: 'finding',      ip: '198.1.2.1',              last: '2024-09-12', active: '2024-09-30' },
  { label: 'S3 bucket public-read',         type: 'finding',      ip: '—',                      last: '2024-09-19', active: '2024-09-30' },
  { label: 'IAM user without MFA',          type: 'finding',      ip: '—',                      last: '2024-09-21', active: '2024-09-30' },
  { label: 'Q3 SOC2 self-attestation',      type: 'assessment',   ip: '—',                      last: '2024-09-01', active: '2024-09-30' },
  { label: 'prod-eks-east-1',               type: 'cluster',      ip: '—',                      last: '2024-08-12', active: '2024-09-30' },
  { label: 'auth-svc-7d4c89f6cf-l9b2x',     type: 'container',    ip: '10.43.4.12',             last: '2024-09-22', active: '2024-09-30' },
  { label: 'aws-acct-908127364582',         type: 'cloudAccount', ip: '—',                      last: '2024-09-22', active: '2024-09-30' },
  { label: 'vpc-prod-east1',                type: 'network',      ip: '10.0.0.0/16',            last: '2024-08-08', active: '2024-09-29' },
  { label: 'eni-0f12a8b394',                type: 'netIface',     ip: '10.0.4.18',              last: '2024-09-15', active: '2024-09-30' },
  { label: 's3://acme-data-prod',           type: 'storage',      ip: '—',                      last: '2024-09-10', active: '2024-09-30' },
  { label: 'JIRA-SEC-1208',                 type: 'ticket',       ip: '—',                      last: '2024-09-15', active: '2024-09-29' },
  { label: 'JIRA-SEC-1145',                 type: 'ticket',       ip: '—',                      last: '2024-09-04', active: '2024-09-22' },
  { label: 'platform-eng',                  type: 'group',        ip: '—',                      last: '2024-09-01', active: '2024-09-30' },
];

const SOURCE_ICONS = {
  ms: (
    <svg viewBox="0 0 21 21" width="13" height="13" style={{ display: 'block' }}>
      <rect x="0" y="0" width="9.5" height="9.5" fill="#F25022"/>
      <rect x="11.5" y="0" width="9.5" height="9.5" fill="#7FBA00"/>
      <rect x="0" y="11.5" width="9.5" height="9.5" fill="#00A4EF"/>
      <rect x="11.5" y="11.5" width="9.5" height="9.5" fill="#FFB900"/>
    </svg>
  ),
  crwd: (
    <svg viewBox="0 0 20 20" width="13" height="13" style={{ display: 'block' }}>
      <rect width="20" height="20" rx="2" fill="#E10D1A"/>
      <path d="M10 3.5C6.4 3.5 3.5 6.4 3.5 10S6.4 16.5 10 16.5" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <path d="M10 6.8C8.2 6.8 6.8 8.2 6.8 10S8.2 13.2 10 13.2" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="10" cy="10" r="1.5" fill="white"/>
    </svg>
  ),
  azure: (
    <svg viewBox="0 0 18 18" width="13" height="13" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="azGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#114A8B"/>
          <stop offset="100%" stopColor="#0078D4"/>
        </linearGradient>
      </defs>
      <path d="M4.5 1h9L18 14H0L4.5 1z" fill="url(#azGrad)"/>
      <path d="M0 14l5-6.5 2.5 6.5z" fill="#0078D4" fillOpacity="0.55"/>
    </svg>
  ),
  aws: (
    <svg viewBox="0 0 26 16" width="18" height="12" style={{ display: 'block' }}>
      <rect width="26" height="16" rx="2.5" fill="#FF9900"/>
      <text x="13" y="11.5" textAnchor="middle" fontSize="7.5" fontWeight="800" fill="white"
            fontFamily="'Arial', sans-serif" letterSpacing="0.5">AWS</text>
    </svg>
  ),
  k8s: (
    <svg viewBox="0 0 20 20" width="13" height="13" style={{ display: 'block' }}>
      <circle cx="10" cy="10" r="10" fill="#326CE5"/>
      <line x1="10" y1="2.5" x2="10" y2="7" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="10" y1="13" x2="10" y2="17.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="2.5" y1="10" x2="7" y2="10" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="13" y1="10" x2="17.5" y2="10" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="4.4" y1="4.4" x2="7.8" y2="7.8" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="12.2" y1="12.2" x2="15.6" y2="15.6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="15.6" y1="4.4" x2="12.2" y2="7.8" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="7.8" y1="12.2" x2="4.4" y2="15.6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="10" cy="10" r="2.5" fill="white"/>
    </svg>
  ),
  jira: (
    <svg viewBox="0 0 24 24" width="13" height="13" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="jiraGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0052CC"/>
          <stop offset="100%" stopColor="#2684FF"/>
        </linearGradient>
      </defs>
      <path d="M12 0L0 12l12 12 12-12L12 0z" fill="url(#jiraGrad)"/>
      <path d="M12 5v10M7.5 10l4.5 5 4.5-5" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

const SOURCE_TITLES = { ms: 'Microsoft', crwd: 'CrowdStrike', azure: 'Azure', aws: 'AWS', k8s: 'Kubernetes', jira: 'Jira' };

function SourceBadge({ src }) {
  const LOGOS = {
    ms:    '/assets/Data source logos/logo-intunes.svg',
    crwd:  '/assets/Data source logos/logo-crowdstrike.svg',
    azure: '/assets/Data source logos/logo-azure.svg',
    aws:   '/assets/Data source logos/logo-aws.svg',
  };
  const BADGES = {
    k8s:  { label: 'K8',  bg: '#326CE5', fg: '#fff' },
    jira: { label: 'JR',  bg: '#0052CC', fg: '#fff' },
    '+2': { label: '+2',  bg: '#E6E6E6', fg: '#282828' },
    '+1': { label: '+1',  bg: '#E6E6E6', fg: '#282828' },
  };
  if (LOGOS[src]) {
    return <img src={LOGOS[src]} alt={src} className="kg-source-logo" />;
  }
  const m = BADGES[src] || { label: src, bg: '#E6E6E6', fg: '#282828' };
  return (
    <span className="kg-source-badge" style={{ background: m.bg, color: m.fg }}>{m.label}</span>
  );
}

function OSPill({ os }) {
  if (os === '—') return <span className="kg-os-null">—</span>;
  const map = { Windows: { color: '#0078D4' }, Linux: { color: '#222' }, macOS: { color: '#999' } };
  const m = map[os] || { color: '#999' };
  return (
    <span className="kg-os-pill">
      <svg width="14" height="14" viewBox="0 0 24 24" fill={m.color}>
        <path d="M3 4h8v8H3zM13 4h8v8h-8zM3 14h8v8H3zM13 14h8v8h-8z"/>
      </svg>
      <span>{os}</span>
    </span>
  );
}

function Th({ children }) {
  return (
    <th>
      <span className="kg-th-inner">
        {children}
        <Ic size={10} path={<><path d="m7 9 5-5 5 5M7 15l5 5 5-5"/></>} />
      </span>
    </th>
  );
}

const PAGE_SIZE = 10;

function DetailsTable({ rows, totalCount, search, onSearch, onRowClick }) {
  const [page, setPage] = useState(0);
  useEffect(() => { setPage(0); }, [rows]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pagedRows = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const from = rows.length === 0 ? 0 : page * PAGE_SIZE + 1;
  const to   = Math.min((page + 1) * PAGE_SIZE, rows.length);

  return (
    <div className="kg-details">
      <div className="kg-details__header">
        <div className="kg-details__title">
          Details <span className="kg-details__title-count">({fmtN(totalCount)})</span>
        </div>
        <div className="kg-details__spacer" />
        <DSPillSearch value={search} onChange={onSearch} placeholder="Search Any" width={220} />
        <button className="ds-btn sz-md t-outline">
          Add Column <Ic size={12} path={<><path d="M12 5v14M5 12h14"/></>}/>
        </button>
        <button className="ds-btn sz-md t-primary">
          {Icons.download} Download
          <Ic size={12} path={<><path d="m6 9 6 6 6-6"/></>}/>
        </button>
      </div>

      <div className="kg-details__body">
        <table>
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
            {pagedRows.length === 0 ? (
              <tr><td colSpan="7" className="kg-details__empty">No records match this filter.</td></tr>
            ) : pagedRows.map((r, i) => {
              const meta = TYPE_TO_TABLE_LABEL[r.type];
              return (
                <tr key={i} className="kg-details__row" onClick={() => onRowClick && onRowClick(r)}>
                  <td className="kg-td-label">{r.label}</td>
                  <td>
                    <span className="kg-td-type">
                      <span className="kg-td-type__icon"><EntityGlyph kind={meta.glyph} size={20} /></span>
                      {meta.type}
                    </span>
                  </td>
                  <td>
                    <span className="kg-td-sources">
                      {meta.sources.map((s, j) => <SourceBadge key={j} src={s} />)}
                    </span>
                  </td>
                  <td><OSPill os={meta.os} /></td>
                  <td className="kg-td-numeric">{r.ip}</td>
                  <td className="kg-td-numeric">{r.last}</td>
                  <td className="kg-td-numeric">{r.active}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="kg-details__footer">
        <span className="kg-details__page-info">
          {rows.length === 0 ? 'No results' : `${from}–${to} of ${rows.length}`}
        </span>
        <div className="kg-details__page-btns">
          <button
            className="kg-page-btn"
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
          >
            <Ic size={13} path={<><path d="m15 18-6-6 6-6"/></>}/>
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              className={`kg-page-btn${i === page ? ' kg-page-btn--active' : ''}`}
              onClick={() => setPage(i)}
            >
              {i + 1}
            </button>
          ))}
          <button
            className="kg-page-btn"
            disabled={page >= totalPages - 1}
            onClick={() => setPage(p => p + 1)}
          >
            <Ic size={13} path={<><path d="m9 18 6-6-6-6"/></>}/>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── PageKG ────────────────────────────────────────────────────────────
function PageKG() {
  const [selected, setSelected] = useState(null);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [multiSelected, setMultiSelected] = useState(() => new Set());
  const [hoveredId, setHoveredId] = useState(null);
  const [viewMode, setViewMode] = useState('All');
  const [search, setSearch] = useState('');
  const [tableSearch, setTableSearch] = useState('');
  const [deselectedChips, setDeselectedChips] = useState(() => new Set());
  const [selectedEdgeKey, setSelectedEdgeKey] = useState(null);
  const [edgeReversed, setEdgeReversed] = useState(false);
  const [positions, setPositions] = useState(() => ({ ...NODE_POS }));
  const [view, setView] = useState({ x: 0, y: 0, w: 940, h: 440 });
  const [isDirty, setIsDirty] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelRow, setPanelRow] = useState(null);
  const [panelTab, setPanelTab] = useState('summary');
  const [edges, setEdges] = useState(() => {
    const fromTweaks = (window.__floatTweaks && window.__floatTweaks.edges);
    if (Array.isArray(fromTweaks) && fromTweaks.length) return fromTweaks.map(e => [...e]);
    return INITIAL_EDGES.map(e => [...e]);
  });

  useEffect(() => {
    window.__kgSetEdges = setEdges;
    window.__kgGetEdges = () => edges;
    window.__kgEntityList = Object.keys(ENTITY_TYPES).map(id => ({ id, label: ENTITY_TYPES[id].label }));
    window.dispatchEvent(new CustomEvent('kg-edges-changed'));
  }, [edges]);

  const visibleSetByView = useMemo(() => {
    if (viewMode === 'All') return new Set(Object.keys(ENTITY_TYPES));
    const ids = Object.keys(ENTITY_TYPES).filter(k => {
      if (k === 'finding') return true;
      const g = ENTITY_TYPES[k]?.group;
      if (viewMode === 'Host')     return g === 'host' || k === 'host';
      if (viewMode === 'Cloud')    return g === 'cloud';
      if (viewMode === 'Identity') return g === 'identity';
      return true;
    });
    return new Set(ids);
  }, [viewMode]);

  const TAB_DEFAULT = { Host: 'host', Cloud: 'cloudAccount', Identity: 'identity' };
  useEffect(() => {
    const visible = visibleSetByView;
    const def = TAB_DEFAULT[viewMode];
    if (def && !multiSelectMode) {
      setSelected(def); setSelectedEdgeKey(null); setDeselectedChips(new Set());
    } else if (selected && !visible.has(selected)) {
      setSelected(null); setSelectedEdgeKey(null); setDeselectedChips(new Set());
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
      const cx = v.x + v.w / 2, cy = v.y + v.h / 2;
      return { x: cx - newW / 2, y: cy - newH / 2, w: newW, h: newH };
    });
  };
  const resetView = () => setView({ x: 0, y: 0, w: 940, h: 440 });
  const setPositionsDirty = (updater) => { setPositions(updater); setIsDirty(true); };
  const setViewDirty = (updater) => { setView(updater); setIsDirty(true); };

  useEffect(() => {
    setDeselectedChips(new Set()); setEdgeReversed(false); setSelectedEdgeKey(null);
  }, [selected]);

  const relationshipChips = useMemo(() => {
    if (!selected) return [];
    return edges
      .filter(([a,b]) => a === selected || b === selected)
      .filter(([a,b]) => !selectedEdgeKey || `${a}|${b}` === selectedEdgeKey)
      .filter(([a,b]) => { const other = a === selected ? b : a; return visibleSetByView.has(other); })
      .map(([a,b,label]) => {
        const other = a === selected ? b : a;
        const key = `${a}|${b}`;
        return { key, source: ENTITY_TYPES[selected]?.label || selected, relation: label || 'Connected to', target: ENTITY_TYPES[other]?.label || other, otherId: other };
      });
  }, [selected, edges, selectedEdgeKey, visibleSetByView]);

  const { neighborSet, neighborEdgeSet } = useMemo(() => {
    if (!selected) return { neighborSet: new Set(), neighborEdgeSet: new Set() };
    const ns = new Set([selected]), es = new Set();
    edges.forEach(([a,b]) => {
      if (a === selected) { ns.add(b); es.add(`${a}|${b}`); es.add(`${b}|${a}`); }
      else if (b === selected) { ns.add(a); es.add(`${a}|${b}`); es.add(`${b}|${a}`); }
    });
    return { neighborSet: ns, neighborEdgeSet: es };
  }, [selected, edges]);

  const { activeNeighborSet, activeNeighborEdgeSet } = useMemo(() => {
    if (!selected) return { activeNeighborSet: new Set(), activeNeighborEdgeSet: new Set() };
    const ns = new Set([selected]), es = new Set();
    relationshipChips.forEach(c => {
      if (!deselectedChips.has(c.key)) {
        ns.add(c.otherId);
        const [a, b] = c.key.split('|');
        es.add(`${a}|${b}`); es.add(`${b}|${a}`);
      }
    });
    return { activeNeighborSet: ns, activeNeighborEdgeSet: es };
  }, [selected, relationshipChips, deselectedChips]);

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
        const haystack = [r.label, r.type, r.ip, r.last, r.active, meta.type, meta.os, ...(meta.sources || [])].filter(Boolean).join(' ').toLowerCase();
        return haystack.includes(q);
      });
    }
    return rs;
  }, [selected, selectedEdgeKey, multiSelectMode, multiSelected, tableSearch]);

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
    <div className="kg-page">
      {/* Summary card */}
      <div className="kg-card">
        <div className="kg-card__header">
          <div className="kg-card__title">Summary</div>
          <div className="kg-card__spacer" />
          <SegmentedTabs value={'Relationships'} options={['Relationships','Entities','Data Sources']} />
          <button className="kg-collapse-btn">
            <Ic size={12} path={<><path d="m18 15-6-6-6 6"/></>}/>
            Collapse
          </button>
        </div>

        <div className="kg-toolbar">
          <span className="kg-toolbar__label">Attack Surface:</span>
          <ViewTabs value={viewMode} onChange={v => { setViewMode(v); setIsDirty(true); }} options={['All','Host','Cloud','Identity']}/>
          <div className="kg-toolbar__spacer" />
          <DSPillSearch value={search} onChange={v => { setSearch(v); if (v) setIsDirty(true); }} placeholder="Search Nodes" width={220} />
          <button
            onClick={() => {
              const next = !multiSelectMode;
              setMultiSelectMode(next); setIsDirty(true);
              if (next) {
                if (selected) setMultiSelected(new Set([selected]));
                setSelected(null); setSelectedEdgeKey(null); setEdgeReversed(false);
              } else {
                setMultiSelected(new Set());
              }
            }}
            title="Select multiple nodes to compare their entity counts"
            className={`kg-btn-toggle${multiSelectMode ? ' kg-btn-toggle--on' : ''}`}
          >
            Multi-select{multiSelected.size > 0 && ` (${multiSelected.size})`}
          </button>
          <button
            onClick={isDirty ? () => { setSelected(null); setSelectedEdgeKey(null); setMultiSelectMode(false); setMultiSelected(new Set()); setSearch(''); setViewMode('All'); setPositions({ ...NODE_POS }); resetView(); setIsDirty(false); } : undefined}
            className={`kg-btn-reset${isDirty ? ' kg-btn-reset--dirty' : ''}`}
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
              if (selectedEdgeKey === key) { setSelected(null); setSelectedEdgeKey(null); return; }
              const primary = (a === 'finding' && b !== 'finding') ? b : a;
              setSelected(primary);
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
          <div className="kg-zoom-rail">
            <RailBtn onClick={() => zoomBy(0.8)} icon={<Ic size={14} path={<><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/><path d="M11 8v6M8 11h6"/></>}/>}/>
            <RailBtn onClick={() => zoomBy(1.25)} icon={<Ic size={14} path={<><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/><path d="M8 11h6"/></>}/>}/>
          </div>
        </div>

        {/* Footer: hint / filter chips */}
        {edges.length === 0 ? (
          <div className="kg-footer">
            <span className="kg-footer__hint kg-footer__hint--italic">No relationships configured.</span>
          </div>
        ) : multiSelectMode ? (
          <div className="kg-footer">
            {multiSelected.size === 0 ? (
              <span className="kg-footer__hint">Click nodes to multi-select and filter the details table.</span>
            ) : (
              <>
                <span className="kg-footer__label">Details table filtered by:</span>
                {[...multiSelected].map(id => (
                  <span key={id} className="kg-filter-chip">
                    {ENTITY_TYPES[id]?.label || id}
                    {ENTITY_TYPES[id]?.count !== undefined && (
                      <span>({fmtN(ENTITY_TYPES[id].count)})</span>
                    )}
                    <button className="kg-filter-chip__btn kg-filter-chip__close"
                      onClick={() => setMultiSelected(prev => { const n = new Set(prev); n.delete(id); return n; })}>×</button>
                  </span>
                ))}
              </>
            )}
          </div>
        ) : selected ? (() => {
          const isEdge = !!selectedEdgeKey;
          let chipText;
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
            <div className="kg-footer">
              <span className="kg-footer__label">Details table filtered by:</span>
              <span className="kg-filter-chip">
                {chipText}
                {!isEdge && ENTITY_TYPES[selected]?.count !== undefined && (
                  <span>({fmtN(ENTITY_TYPES[selected].count)})</span>
                )}
                {isEdge && (
                  <button className="kg-filter-chip__btn"
                    onClick={() => setEdgeReversed(r => !r)}
                    title="Reverse relationship"
                    style={{ transform: edgeReversed ? 'scaleX(-1)' : 'none' }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                    </svg>
                  </button>
                )}
                <button className="kg-filter-chip__btn kg-filter-chip__close"
                  onClick={() => { setSelected(null); setSelectedEdgeKey(null); }}>×</button>
              </span>
            </div>
          );
        })() : (
          <div className="kg-footer">
            <span className="kg-footer__hint">Click a node or relationship to filter the details table.</span>
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

      {/* Panel overlay */}
      <div
        onClick={() => setPanelOpen(false)}
        className={`kg-panel-overlay${panelOpen ? '' : ' kg-panel-overlay--hidden'}`}
      />

      {/* Detail panel */}
      <div className={`kg-panel${panelOpen ? ' kg-panel--open' : ' kg-panel--closed'}`}>
        {panelRow && (() => {
          const meta = TYPE_TO_TABLE_LABEL[panelRow.type] || {};
          const ent  = ENTITY_TYPES[panelRow.type]        || {};
          return (
            <>
              <div className="kg-panel__header">
                <div className="kg-panel__title-row">
                  <div className="kg-panel__entity-icon" style={{ background: ent.tint || '#F5F5F5', border: `2px solid ${ent.stroke || '#E6E6E6'}` }}>
                    <EntityGlyph kind={meta.glyph} size={22} />
                  </div>
                  <div className="kg-panel__title-block">
                    <div className="kg-panel__name-row">
                      <span className="kg-panel__name">{panelRow.label}</span>
                      <span className="kg-panel__type-badge" style={{ border: `1px solid ${ent.stroke || '#E6E6E6'}`, color: ent.icon || '#6360D8' }}>
                        {meta.type || panelRow.type}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => setPanelOpen(false)} className="kg-panel__collapse-btn">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m18 15-6-6-6 6"/>
                    </svg>
                    Collapse
                  </button>
                </div>

                <div className="kg-panel__score-bar">
                  <div className="kg-panel__score-group">
                    <span className="kg-panel__score-label">Exposure Score</span>
                    <span className="kg-panel__score-val">920</span>
                  </div>
                  <div className="kg-panel__score-sep" />
                  <div className="kg-panel__score-group">
                    <span className="kg-panel__score-label">Asset Criticality Score</span>
                    <span className="kg-panel__score-val">920</span>
                  </div>
                  <div className="kg-panel__score-sep" />
                  <button className="kg-panel__score-action">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                    </svg>
                    View Score Simulation
                    <kbd className="kg-panel__score-kbd">⌘ D</kbd>
                  </button>
                </div>

                <div className="kg-panel__connections">
                  {[
                    { glyph: 'application', label: 'Application Endpoint', count: null },
                    { glyph: 'person',      label: 'Shashi.salian',        count: null },
                    { glyph: 'account',     label: 'Account',              count: 2 },
                    { glyph: 'vulnerability', label: 'Vulnerability',      count: 8 },
                    { glyph: 'finding',     label: 'Findings',             count: 43 },
                  ].map(c => (
                    <span key={c.glyph} className="kg-panel__conn-chip">
                      <EntityGlyph kind={c.glyph} size={13} />
                      <span>{c.label}</span>
                      {c.count != null && <span className="kg-panel__conn-count">{c.count}</span>}
                    </span>
                  ))}
                  <span className="kg-panel__conn-chip kg-panel__conn-chip--internet">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                    </svg>
                    <span>Internet</span>
                    <span className="kg-panel__conn-badge">True</span>
                  </span>
                </div>

                <div className="kg-panel__rel-graph">
                  <div className="kg-panel__rel-header">Entity Relationship Summary</div>
                  <div className="kg-panel__rel-body">
                    <svg width="280" height="90" style={{ display: 'block', overflow: 'visible', flex: 1 }}>
                      <line x1="90" y1="44" x2="190" y2="44" stroke="#D6D6D6" strokeWidth="1.5"/>
                      <text x="140" y="38" textAnchor="middle" fontSize="9" fill={PAI.fg3} fontFamily="inherit">Has</text>
                      <circle cx="60" cy="44" r="28" fill={ent.tint || '#F5F5F5'} stroke={ent.stroke || '#E6E6E6'} strokeWidth="1.5"/>
                      <foreignObject x="44" y="30" width="32" height="32" style={{ pointerEvents: 'none' }}>
                        <div xmlns="http://www.w3.org/1999/xhtml" style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <EntityGlyph kind={meta.glyph} size={20} />
                        </div>
                      </foreignObject>
                      <text x="60" y="82" textAnchor="middle" fontSize="9" fill={PAI.fg2} fontWeight="600" fontFamily="inherit">
                        {(meta.type || panelRow.type).slice(0, 12)}
                      </text>
                      <circle cx="220" cy="44" r="22" fill={ENTITY_TYPES.finding.tint} stroke={ENTITY_TYPES.finding.stroke} strokeWidth="1.5"/>
                      <foreignObject x="204" y="30" width="32" height="32" style={{ pointerEvents: 'none' }}>
                        <div xmlns="http://www.w3.org/1999/xhtml" style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <EntityGlyph kind="finding" size={20} />
                        </div>
                      </foreignObject>
                      <text x="220" y="82" textAnchor="middle" fontSize="9" fill={ENTITY_TYPES.finding.icon} fontWeight="600" fontFamily="inherit">Finding</text>
                      <circle cx="244" cy="20" r="9" fill="#6360D8"/>
                      <text x="244" y="23" textAnchor="middle" fontSize="8" fill="#fff" fontWeight="700" fontFamily="inherit">
                        {(ent.count || 0) > 999 ? fmtN(ent.count).slice(0,4) : fmtN(ent.count || 0)}
                      </text>
                    </svg>
                  </div>
                </div>
              </div>

              <div className="kg-panel__tabs">
                {['Summary', 'Timeline', 'Evolution'].map(t => (
                  <button key={t} onClick={() => setPanelTab(t.toLowerCase())}
                    className={`kg-panel__tab${panelTab === t.toLowerCase() ? ' kg-panel__tab--active' : ''}`}>
                    {t}
                  </button>
                ))}
              </div>

              <div className="kg-panel__body">
                {panelTab === 'summary' && (
                  <>
                    <div className="kg-panel__section">
                      <div className="kg-panel__section-header kg-panel__section-header--icon">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
                        </svg>
                        General
                      </div>
                      <div className="kg-panel__info-grid">
                        {[
                          ['Display Label',      panelRow.label],
                          ['Type',               meta.type || panelRow.type],
                          ['FQDN',               panelRow.type === 'host' ? panelRow.label : '—'],
                          ['AAD Device ID',      '12345678-90ab-cdef-1234-567890abcdef'],
                          ['MAC Address',        '00:1A:2B:3C:4D:5E'],
                          ['Internet Facing',    'True'],
                          ['Environment',        'Production'],
                          ['Data Source',        (meta.sources || ['—']).join(', ')],
                          ['OS',                 meta.os],
                          ['Infrastructure Type', ent.group === 'cloud' ? 'Cloud' : 'On-Premise'],
                          ['Business Unit',      'Customer Service'],
                          ['Role',               panelRow.type === 'host' ? 'Web Server, Database' : '—'],
                          ['Hardware Serial',    'SN1234567890'],
                          ['Last Found',         panelRow.last],
                          ['Last Active',        panelRow.active],
                        ].map(([k, v]) => (
                          <div key={k} className="kg-panel__info-cell">
                            <div className="kg-panel__info-label">{k}</div>
                            <div className="kg-panel__info-value">{v}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="kg-panel__section">
                      <div className="kg-panel__section-header kg-panel__section-header--icon">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
                        </svg>
                        Metadata and tags
                      </div>
                      <div className="kg-panel__tag-table">
                        {[
                          ['Primary Asset Tags', ['APP=CustomerPortal', 'ENV=Production', 'ROLE=WebServer,DatabaseServer']],
                          ['Technical Tags',     ['OS=CentOS8', 'APP_STACK=ApacheStruts,Tomcat', 'DB=MySQL']],
                          ['Business Tags',      ['BUSINESS_UNIT=CustomerService', 'TIER=Critical', 'DATA_CLASSIFICATION=Sensitive']],
                          ['Security Tags',      ['SCAN_PROFILE=External', 'COMPLIANCE=PCI,GDPR', 'PATCH_GROUP=Critical-48hrs']],
                        ].map(([label, tags]) => (
                          <div key={label} className="kg-panel__tag-row">
                            <span className="kg-panel__tag-row-label">{label}</span>
                            <span className="kg-panel__tag-list">
                              {tags.map(t => <span key={t} className="kg-panel__tag-pill">{t}</span>)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="kg-panel__section">
                      <div className="kg-panel__section-header kg-panel__section-header--icon">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        </svg>
                        Security and Compliance
                      </div>
                      <div className="kg-panel__info-grid">
                        {[
                          ['Defender Risk Score',    'High'],
                          ['Defender Health Status', 'TRUE'],
                          ['EDR Onboarding Status',  'TRUE'],
                          ['VM Onboarding Status',   'TRUE'],
                          ['FW Enabled',             'TRUE'],
                        ].map(([k, v]) => (
                          <div key={k} className="kg-panel__info-cell">
                            <div className="kg-panel__info-label">{k}</div>
                            <div className={`kg-panel__info-value${v === 'TRUE' ? ' kg-panel__badge--true' : v === 'High' ? ' kg-panel__badge--risk' : ''}`}>{v}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="kg-panel__section">
                      <div className="kg-panel__section-header kg-panel__section-header--icon">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
                        </svg>
                        Hardware
                      </div>
                      <div className="kg-panel__info-grid">
                        {[
                          ['Hardware Model',         'Dell Latitude 7420'],
                          ['IP',                     panelRow.ip !== '—' ? panelRow.ip.split(',')[0].trim() : '192.168.1.10'],
                          ['Hardware Bios Version',  '1.12.3'],
                          ['Crowdstrike Local IP',   '192.168.1.10'],
                          ['Hardware Chassis Type',  'Laptop'],
                          ['Hardware Serial Number', 'SN1234567890'],
                          ['Hardware Manufacturer',  'Dell Inc.'],
                        ].map(([k, v]) => (
                          <div key={k} className="kg-panel__info-cell">
                            <div className="kg-panel__info-label">{k}</div>
                            <div className="kg-panel__info-value">{v}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {panelTab === 'timeline' && (
                  <div className="kg-panel__placeholder">
                    Timeline for <strong style={{ color: PAI.fg1 }}>{panelRow.label}</strong>.<br/>
                    Track when this entity was first seen and how its attributes changed.
                  </div>
                )}

                {panelTab === 'evolution' && (
                  <div className="kg-panel__placeholder">
                    Evolution history for <strong style={{ color: PAI.fg1 }}>{panelRow.label}</strong>.<br/>
                    Shows how this entity was resolved from source fragments over time.
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

// ── SegmentedTabs ─────────────────────────────────────────────────────
function SegmentedTabs({ value, options, onChange, fullWidth, compact }) {
  const containerRef = useRef(null);
  const btnRefs = useRef([]);
  const [thumb, setThumb] = useState({ left: 3, width: 0 });

  useEffect(() => {
    const idx = options.indexOf(value);
    const btn = btnRefs.current[idx];
    if (btn) setThumb({ left: btn.offsetLeft, width: btn.offsetWidth });
  }, [value, options.join('|')]);

  return (
    <div ref={containerRef} className={`seg-tabs${fullWidth ? ' seg-tabs--full' : ''}`}>
      {/* Animated thumb — position is JS-measured, must stay inline */}
      <div className="seg-tabs__thumb" style={{ left: thumb.left, width: thumb.width, opacity: thumb.width ? 1 : 0 }} />
      {options.map((o, i) => {
        const active = o === value;
        const showDivider = i > 0 && !active && options[i - 1] !== value;
        return (
          <button
            key={o}
            ref={el => btnRefs.current[i] = el}
            onClick={() => onChange && onChange(o)}
            className={[
              'seg-tabs__btn',
              compact ? 'seg-tabs__btn--compact' : '',
              fullWidth ? 'seg-tabs__btn--full' : '',
              active ? 'seg-tabs__btn--active' : '',
            ].filter(Boolean).join(' ')}
          >
            {showDivider && <span className="seg-tabs__divider" />}
            {o}
          </button>
        );
      })}
    </div>
  );
}

function ViewTabs({ value, onChange, options }) {
  return <SegmentedTabs value={value} options={options} onChange={onChange} />;
}

function EmptyOverlay({ icon, title, subtitle }) {
  return (
    <div className="kg-empty-overlay">
      <div className="kg-empty-overlay__box">
        <div className="kg-empty-overlay__icon">{icon}</div>
        <div className="kg-empty-overlay__title">{title}</div>
        <div className="kg-empty-overlay__subtitle">{subtitle}</div>
      </div>
    </div>
  );
}

function RailBtn({ icon, onClick }) {
  return (
    <button onClick={onClick} className="kg-rail-btn">{icon}</button>
  );
}

function ZoomIndicator({ view }) {
  const pct = Math.round((940 / view.w) * 100);
  return (
    <div className="kg-zoom-indicator">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>
      </svg>
      <span>{pct}%</span>
    </div>
  );
}

function FilterChipBar({ chips, deselected, selectedLabel, onToggle }) {
  if (chips.length === 0) {
    return (
      <div className="kg-chip-bar__empty">
        <span className="kg-chip-bar__empty-msg">
          <strong style={{ fontWeight: 600, color: PAI.fg2 }}>{selectedLabel}</strong> has no relationships in this view.
        </span>
      </div>
    );
  }
  return (
    <div className="kg-chip-bar">
      <span className="kg-chip-bar__label">Details Table filtered by:</span>
      <div className="kg-chip-bar__chips">
        {chips.map(c => {
          const off = deselected.has(c.key);
          return (
            <button
              key={c.key}
              onClick={() => onToggle(c.key)}
              title={off ? 'Click to include in filter' : 'Click to exclude from filter'}
              className={`kg-rel-chip${off ? ' kg-rel-chip--off' : ''}`}
            >
              <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4 }}>
                <span className="kg-rel-chip__src">{c.source}</span>
                <span className={`kg-rel-chip__rel${off ? ' kg-rel-chip__rel--off' : ' kg-rel-chip__rel--on'}`}>{c.relation}</span>
                <span className="kg-rel-chip__tgt">{c.target}</span>
                {ENTITY_TYPES[c.otherId]?.count !== undefined && (
                  <span className="kg-rel-chip__tgt">({fmtN(ENTITY_TYPES[c.otherId].count)})</span>
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

// ── HoverTooltip ──────────────────────────────────────────────────────
function HoverTooltip({ nodeId, edgeKey, mousePos, edges, reversed }) {
  let content = null;

  if (nodeId) {
    const def = ENTITY_TYPES[nodeId];
    content = (
      <div>
        <div className="kg-tooltip__header" style={{ background: def.tint + '40' }}>
          <div style={{ display: 'flex' }}><EntityGlyph kind={def.glyph} size={18} /></div>
          <div className="kg-tooltip__header-label" style={{ color: def.icon || def.stroke }}>{def.label}</div>
        </div>
        <div className="kg-tooltip__body">
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
    content = (
      <div>
        <div className="kg-tooltip__edge-header">
          {srcDef.label} <span className="kg-tooltip__edge-rel">{rel || 'connected to'}</span> {tgtDef.label}
        </div>
        <div className="kg-tooltip__body kg-tooltip__body--wide">
          <Row k="Source Entity" v={srcDef.label} />
          <Row k="Target Entity" v={tgtDef.label} />
          <Row k="Relationship Count" v={'2'} />
        </div>
      </div>
    );
  }
  if (!content) return null;

  const TOOLTIP_W = 240;
  const containerW = mousePos.containerW || 900;
  const flipLeft = mousePos.x + 16 + TOOLTIP_W > containerW;
  const left = flipLeft ? mousePos.x - TOOLTIP_W - 8 : mousePos.x + 16;
  const top = Math.min(mousePos.y + 16, 320);

  return (
    <div className="kg-tooltip" style={{ left, top }}>
      {content}
    </div>
  );
}

function Row({ k, v }) {
  return (
    <div className="kg-tooltip-row">
      <span className="kg-tooltip-row__key">{k}</span>
      <span className="kg-tooltip-row__val">{v}</span>
    </div>
  );
}
