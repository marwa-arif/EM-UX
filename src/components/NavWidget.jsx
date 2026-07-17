import React, { useState, useRef, useEffect } from 'react';
import {
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis,
  Tooltip, ResponsiveContainer,
} from 'recharts';

// ── Palette (mirrors ChartRender.jsx) ───────────────────────────────
const SEV_COLORS = [
  'var(--pai-crit-fg)',
  'var(--pai-high-fg)',
  'var(--pai-caution-fg)',
  'var(--pai-green)',
  'var(--shell-text-muted)',
];

const ACCENT = 'var(--shell-accent)';

// ── Mock data ────────────────────────────────────────────────────────
const MOCK = {
  kpi(title) {
    const t = (title || '').toLowerCase();
    const value = t.includes('critical') ? 247 :
                  t.includes('high') ? 613 :
                  t.includes('host') ? 842 : 1204;
    return { value, delta: 12, trend: 'up', sub: 'vs last 30 days' };
  },
  bar() {
    return [
      { name: 'CrowdStrike', value: 87 },
      { name: 'Azure',       value: 62 },
      { name: 'MS Intune',   value: 45 },
      { name: 'Qualys',      value: 38 },
      { name: 'Tenable',     value: 15 },
    ];
  },
  line() {
    return [
      { month: 'Jan', value: 120 },
      { month: 'Feb', value: 145 },
      { month: 'Mar', value: 133 },
      { month: 'Apr', value: 160 },
      { month: 'May', value: 147 },
      { month: 'Jun', value: 183 },
    ];
  },
  pie() {
    return [
      { name: 'Critical', value: 42  },
      { name: 'High',     value: 87  },
      { name: 'Medium',   value: 134 },
      { name: 'Low',      value: 63  },
      { name: 'Info',     value: 21  },
    ];
  },
  table() {
    return {
      columns: ['Host', 'Findings', 'Critical'],
      rows: [
        ['vm-prod-42',     '14', '3'],
        ['db-prod-01',     '11', '2'],
        ['api-gateway-02', '9',  '1'],
        ['web-prod-07',    '7',  '1'],
        ['lb-prod-01',     '4',  '0'],
      ],
    };
  },
};

// ── Custom chart sub-components (avoid inline styles on HTML) ────────
function ChartTick({ x, y, payload, anchor = 'middle' }) {
  return (
    <text x={x} y={y + 4} className="nw-chart-tick" textAnchor={anchor}>
      {payload.value}
    </text>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="nw-chart-tooltip">
      {label && <div className="nw-chart-tooltip-label">{label}</div>}
      {payload.map((p, i) => (
        <div key={i} className="nw-chart-tooltip-row">
          <span>{p.name || 'Value'}</span>
          <span className="nw-chart-tooltip-val">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Sub-renderers ────────────────────────────────────────────────────
function KpiRenderer({ data }) {
  return (
    <div className="nw-kpi">
      <div className="nw-kpi-val">{data.value.toLocaleString()}</div>
      <div className={`nw-kpi-delta nw-kpi-delta--${data.trend}`}>
        {data.trend === 'up' ? '↑' : '↓'} {data.delta}%
      </div>
      <div className="nw-kpi-sub">{data.sub}</div>
    </div>
  );
}

function BarRenderer({ data }) {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 40, bottom: 0, left: 4 }}>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          width={82}
          axisLine={false}
          tickLine={false}
          tick={<ChartTick anchor="end" />}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--shell-hover)' }} />
        <Bar dataKey="value" radius={[0, 3, 3, 0]} fill={ACCENT} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function LineRenderer({ data }) {
  return (
    <ResponsiveContainer width="100%" height={140}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
        <XAxis
          dataKey="month"
          axisLine={false}
          tickLine={false}
          tick={<ChartTick />}
        />
        <YAxis hide />
        <Tooltip content={<ChartTooltip />} />
        <Line
          type="monotone"
          dataKey="value"
          stroke={ACCENT}
          strokeWidth={2}
          dot={{ r: 3, fill: ACCENT, strokeWidth: 0 }}
          activeDot={{ r: 5, fill: ACCENT }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function PieRenderer({ data }) {
  return (
    <div className="nw-pie-wrap">
      <ResponsiveContainer width={140} height={140}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={38}
            outerRadius={62}
            dataKey="value"
            paddingAngle={2}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={SEV_COLORS[i % SEV_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="nw-pie-legend">
        {data.map((d, i) => (
          <div key={i} className="nw-pie-legend-row">
            <span className={`nw-pie-dot nw-pie-dot-${i % 5}`} />
            <span className="nw-pie-lbl">{d.name}</span>
            <span className="nw-pie-val">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TableRenderer({ data }) {
  return (
    <div className="nw-table-wrap">
      <table className="nw-table">
        <thead>
          <tr>{data.columns.map((c, i) => <th key={i} className="nw-th">{c}</th>)}</tr>
        </thead>
        <tbody>
          {data.rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => <td key={j} className="nw-td">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Type detection (exported for use in BuildView) ───────────────────
export function detectWidgetType(text) {
  const t = (text || '').toLowerCase();
  if (/\bkpi\b|^how many\b|count\b|total\b|\bnumber of\b/.test(t)) return 'kpi';
  if (/pie|donut|breakdown|proportion|percent|split/.test(t))       return 'pie';
  if (/line|trend|over time|timeline|by month|by week/.test(t))     return 'line';
  if (/bar|by source|by data source|distribution/.test(t))          return 'bar';
  return 'table';
}

export function createWidget(type, title) {
  const id = `w${Date.now()}${String(Math.random()).slice(2, 6)}`;
  return { id, type, title, source: 'kg', data: MOCK[type]?.(title) ?? {} };
}

// ── Three-dot icon ───────────────────────────────────────────────────
function IcDotMenu() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="5"  r="1.5"/>
      <circle cx="12" cy="12" r="1.5"/>
      <circle cx="12" cy="19" r="1.5"/>
    </svg>
  );
}

// ── Main widget card ─────────────────────────────────────────────────
export default function NavWidget({ widget, selected, onSelect, onRemove, onRename, onDuplicate }) {
  const { id, type, title, data } = widget;
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [renaming,  setRenaming]  = useState(false);
  const [renameVal, setRenameVal] = useState(title);
  const menuRef = useRef(null);

  // sync rename input if title changes externally
  useEffect(() => { setRenameVal(title); }, [title]);

  useEffect(() => {
    if (!menuOpen) return;
    const h = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [menuOpen]);

  const commitRename = () => {
    const v = renameVal.trim();
    if (v) onRename?.(id, v);
    else setRenameVal(title);
    setRenaming(false);
  };

  return (
    <div
      className={`nav-widget nav-widget--${type}${selected ? ' nw-selected' : ''}`}
      onClick={() => onSelect?.(id)}
    >
      <div className="nw-header">
        {renaming ? (
          <input
            className="nw-rename-input"
            value={renameVal}
            autoFocus
            onChange={e => setRenameVal(e.target.value)}
            onBlur={commitRename}
            onKeyDown={e => {
              if (e.key === 'Enter') commitRename();
              if (e.key === 'Escape') { setRenaming(false); setRenameVal(title); }
            }}
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <span className="nw-title">{title}</span>
        )}

        <span className={`nw-type-badge nw-type-badge--${type}`}>{type}</span>

        <div
          className="nw-menu-wrap"
          ref={menuRef}
          onClick={e => e.stopPropagation()}
        >
          <button
            className={`nw-menu-btn${menuOpen ? ' nw-menu-btn--open' : ''}`}
            onClick={() => setMenuOpen(v => !v)}
            title="Widget options"
            aria-label="Widget options"
          >
            <IcDotMenu />
          </button>

          {menuOpen && (
            <div className="nw-menu-dropdown" role="menu">
              <button
                className="nw-menu-item"
                onClick={() => { setRenaming(true); setMenuOpen(false); }}
              >
                Rename
              </button>
              <button
                className="nw-menu-item"
                onClick={() => { onDuplicate?.(id); setMenuOpen(false); }}
              >
                Duplicate
              </button>
              <div className="nw-menu-divider" />
              <button
                className="nw-menu-item nw-menu-item--danger"
                onClick={() => { onRemove?.(id); setMenuOpen(false); }}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="nw-body">
        {type === 'kpi'   && <KpiRenderer   data={data} />}
        {type === 'bar'   && <BarRenderer   data={data} />}
        {type === 'line'  && <LineRenderer  data={data} />}
        {type === 'pie'   && <PieRenderer   data={data} />}
        {type === 'table' && <TableRenderer data={data} />}
      </div>
    </div>
  );
}
