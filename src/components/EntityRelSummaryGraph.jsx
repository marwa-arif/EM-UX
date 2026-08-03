import React from 'react'

// Shared "Entity Relationship Summary" mini-graph used inside every entity/finding/asset
// detail drawer (kg-dp-rel-card shell, styles in styles/kg.css). Centralized here so all
// call sites render the same curved-branch layout instead of hand-copied SVG per page.
//
// center: { label, icon: ReactNode, accent }
// leaves: [{ key, label, icon: ReactNode, tint, stroke, accent, count, onClick?, testId?, active? }]
// `active` renders a leaf the same way as the center node (solid accent fill, white icon) —
// used where clicking a leaf both opens a detail tab and marks it as the current selection.
export default function EntityRelSummaryGraph({
  title = 'Entity Relationship Summary',
  center,
  leaves,
  collapsible = false,
  open = true,
  onToggle,
}) {
  const CENTER_R = 22
  const CENTER_CY = 36
  const LEAF_R = 18
  const LEAF_CY = 118
  const GAP = 145
  const START_X = 90

  const nodeXs = leaves.map((_, i) => START_X + i * GAP)
  const centerX = nodeXs.length ? (nodeXs[0] + nodeXs[nodeXs.length - 1]) / 2 : START_X
  const viewW = nodeXs.length ? nodeXs[nodeXs.length - 1] + START_X : START_X * 2
  const centerBottomY = CENTER_CY + CENTER_R
  const leafTopY = LEAF_CY - LEAF_R
  const midY = (centerBottomY + leafTopY) / 2

  return (
    <div className="kg-dp-rel-card">
      <div className={collapsible ? 'kg-dp-rel-header kg-dp-rel-header--flex' : 'kg-dp-rel-header'}>
        <span>{title}</span>
        {collapsible && (
          <button className="kg-dp-evo-hidden-btn" onClick={onToggle}>{open ? 'Collapse' : 'Expand'}</button>
        )}
      </div>
      {(!collapsible || open) && (
        <div className="kg-dp-rel-body">
          <svg width="100%" height="150" viewBox={`0 0 ${viewW} 150`} className="kg-dp-rel-svg">
            {nodeXs.map((x, i) => (
              <path
                key={leaves[i].key}
                d={`M ${centerX} ${centerBottomY} C ${centerX} ${midY}, ${x} ${midY}, ${x} ${leafTopY}`}
                fill="none"
                stroke="var(--shell-border)"
                strokeWidth="1.5"
              />
            ))}

            {/* Center node — solid accent fill, white icon, soft halo */}
            <circle cx={centerX} cy={CENTER_CY} r={CENTER_R + 8} fill={center.accent} fillOpacity="0.15" />
            <circle cx={centerX} cy={CENTER_CY} r={CENTER_R} fill={center.accent} stroke={center.accent} strokeWidth="1.5" />
            <foreignObject x={centerX - 16} y={CENTER_CY - 16} width="32" height="32" style={{ pointerEvents: 'none' }}>
              <div xmlns="http://www.w3.org/1999/xhtml" className="kg-dp-rel-icon-wrap kg-dp-rel-center-icon">
                {center.icon}
              </div>
            </foreignObject>
            <text x={centerX + CENTER_R + 14} y={CENTER_CY + 4} textAnchor="start" fontSize="11" fontWeight="600" fill="var(--fg-1, #101010)" fontFamily="inherit">
              {center.label}
            </text>

            {leaves.map((leaf, i) => {
              const x = nodeXs[i]
              return (
                <g
                  key={leaf.key}
                  onClick={leaf.onClick}
                  style={leaf.onClick ? { cursor: 'pointer' } : undefined}
                  data-testid={leaf.testId}
                >
                  {leaf.onClick && <rect x={x - 30} y={leafTopY - 20} width="60" height="76" fill="transparent" />}
                  <circle
                    cx={x} cy={LEAF_CY} r={LEAF_R}
                    fill={leaf.active ? leaf.accent : leaf.tint}
                    stroke={leaf.active ? leaf.accent : leaf.stroke}
                    strokeWidth="1.5"
                  />
                  <foreignObject x={x - 16} y={LEAF_CY - 16} width="32" height="32" style={{ pointerEvents: 'none' }}>
                    <div
                      xmlns="http://www.w3.org/1999/xhtml"
                      className={leaf.active ? 'kg-dp-rel-icon-wrap kg-dp-rel-center-icon' : 'kg-dp-rel-icon-wrap'}
                      style={leaf.active ? undefined : { color: leaf.accent }}
                    >
                      {leaf.icon}
                    </div>
                  </foreignObject>
                  <text x={x} y={LEAF_CY + LEAF_R + 14} textAnchor="middle" fontSize="9" fontWeight="600" fill="var(--fg-1, #101010)" fontFamily="inherit">
                    {leaf.label}
                  </text>
                  {(() => {
                    const txt = String(leaf.count)
                    const bw = Math.max(18, txt.length * 6 + 10)
                    const bh = 16
                    return (
                      <>
                        <rect
                          x={x - bw / 2} y={leafTopY - bh / 2} width={bw} height={bh} rx={bh / 2} ry={bh / 2}
                          fill="var(--card-bg, #fff)" stroke="var(--shell-border, #C9C9C9)" strokeWidth="1"
                        />
                        <text x={x} y={leafTopY + 3} textAnchor="middle" fontSize="8" fontWeight="700" fill="var(--fg-1, #101010)" fontFamily="inherit">
                          {txt}
                        </text>
                      </>
                    )
                  })()}
                </g>
              )
            })}
          </svg>
        </div>
      )}
    </div>
  )
}
