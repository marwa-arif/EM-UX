import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

export const DONUT_COLORS = ['#EC4899', '#8B5CF6', '#06B6D4', '#3B82F6', '#94A3B8'];

const TIP_WRAP = { animation: 'dsTooltipFade 0.15s ease', overflow: 'visible', zIndex: 100 };

export function ChartTooltip({ content, mousePos }) {
  if (!content || !mousePos) return null;
  const W = 210;
  const flipLeft = mousePos.x + 20 + W > window.innerWidth;
  const left = flipLeft ? mousePos.x - W - 8 : mousePos.x + 16;
  const top = mousePos.y + 16;
  return (
    <div className="kg-tooltip" style={{ left, top, position: 'fixed' }}>
      {content}
    </div>
  );
}

export function TRow({ k, v }) {
  return (
    <div className="kg-tooltip-row">
      <span className="kg-tooltip-row__key">{k}</span>
      <span className="kg-tooltip-row__val">{v}</span>
    </div>
  );
}

export function AssetIcon({ type, color }) {
  const paths = {
    server:  <><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></>,
    monitor: <><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></>,
    network: <><circle cx="12" cy="5" r="3"/><circle cx="19" cy="19" r="3"/><circle cx="5" cy="19" r="3"/><path d="M12 8v5M12 13l-4.5 4M12 13l4.5 4"/></>,
    mobile:  <><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></>,
    other:   <><circle cx="12" cy="12" r="2"/><circle cx="12" cy="4" r="2"/><circle cx="12" cy="20" r="2"/></>,
  };
  return (
    <div className="fin-donut-asset-icon" style={{ background: `${color}18` }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {paths[type]}
      </svg>
    </div>
  );
}

function DonutTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div style={{ background: 'var(--card-bg)', border: `1px solid ${p.color}`, borderRadius: 8, padding: '12px 13px', width: 200, boxShadow: '0 4px 16px rgba(0,0,0,0.14)', fontFamily: 'Inter,system-ui' }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--shell-text)', marginBottom: 8 }}>{p.label}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: 'var(--shell-text)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0, display: 'inline-block' }} />
          {p.val}
        </span>
        <span style={{ color: p.color }}>{p.pct < 1 ? '<1%' : `${p.pct}%`}</span>
      </div>
    </div>
  );
}

export default function DonutChart({ data }) {
  const pieData = data.items.map((item, i) => ({
    ...item,
    value: item.pct < 1 ? 0.5 : item.pct,
    color: DONUT_COLORS[i],
  }));

  return (
    <div className="fin-donut-panel">
      <div className="fin-donut-title">{data.title}</div>
      <div className="fin-donut-body">
        <div className="fin-donut-svg-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius="46%"
                outerRadius="54%"
                paddingAngle={4}
                dataKey="value"
                nameKey="label"
                strokeWidth={0}
                startAngle={90}
                endAngle={-270}
                cornerRadius={4}
              >
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={DonutTooltip} isAnimationActive={false} wrapperStyle={TIP_WRAP} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center', pointerEvents: 'none',
          }}>
            <div style={{ fontSize: 11, color: 'var(--shell-text-muted)', fontFamily: 'Inter,system-ui' }}>Total</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--shell-text)', fontFamily: 'Inter,system-ui', lineHeight: 1, marginTop: 2 }}>{data.total}</div>
          </div>
        </div>
        <div className="fin-donut-list">
          {data.items.map((item, i) => (
            <div key={i} className="fin-donut-row" style={{ cursor: 'default' }}>
              <AssetIcon type={item.icon} color={DONUT_COLORS[i]} />
              <span className="fin-donut-label">{item.label}</span>
              <span className="fin-donut-val">{item.val}</span>
              <span className="fin-donut-pct">{item.pct < 1 ? '<1%' : `${item.pct}%`}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
