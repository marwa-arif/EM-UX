import React, { useState } from 'react'
import { PAI, Ic } from '../ui.jsx'

// ── Chart type icons ─────────────────────────────────────────────────
const ChartIcon = ({ children }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
)

const CHART_TYPES = [
  {
    id: 'hor-bar', label: 'Horizontal Bar Chart',
    icon: <ChartIcon>
      <line x1="4" y1="4" x2="4" y2="20"/><line x1="4" y1="20" x2="20" y2="20"/>
      <rect x="5" y="6"  width="10" height="2.5" rx="0.5" fill="currentColor" stroke="none" opacity="0.7"/>
      <rect x="5" y="11" width="7"  height="2.5" rx="0.5" fill="currentColor" stroke="none" opacity="0.7"/>
      <rect x="5" y="16" width="13" height="2.5" rx="0.5" fill="currentColor" stroke="none" opacity="0.7"/>
    </ChartIcon>,
  },
  {
    id: 'vert-bar', label: 'Vertical Bar Chart',
    icon: <ChartIcon>
      <line x1="4" y1="4" x2="4" y2="20"/><line x1="4" y1="20" x2="20" y2="20"/>
      <rect x="5"  y="12" width="3" height="8"  rx="0.5" fill="currentColor" stroke="none" opacity="0.7"/>
      <rect x="10" y="8"  width="3" height="12" rx="0.5" fill="currentColor" stroke="none" opacity="0.7"/>
      <rect x="15" y="15" width="3" height="5"  rx="0.5" fill="currentColor" stroke="none" opacity="0.7"/>
    </ChartIcon>,
  },
  {
    id: 'stack-hor', label: 'Stacked Horizontal Bar',
    icon: <ChartIcon>
      <line x1="4" y1="4" x2="4" y2="20"/><line x1="4" y1="20" x2="20" y2="20"/>
      <rect x="5"  y="6"  width="6" height="2.5" rx="0.5" fill="currentColor" stroke="none" opacity="0.85"/>
      <rect x="11" y="6"  width="5" height="2.5" rx="0.5" fill="currentColor" stroke="none" opacity="0.45"/>
      <rect x="5"  y="11" width="4" height="2.5" rx="0.5" fill="currentColor" stroke="none" opacity="0.85"/>
      <rect x="9"  y="11" width="7" height="2.5" rx="0.5" fill="currentColor" stroke="none" opacity="0.45"/>
      <rect x="5"  y="16" width="8" height="2.5" rx="0.5" fill="currentColor" stroke="none" opacity="0.85"/>
      <rect x="13" y="16" width="4" height="2.5" rx="0.5" fill="currentColor" stroke="none" opacity="0.45"/>
    </ChartIcon>,
  },
  {
    id: 'stack-vert', label: 'Stacked Vertical Bar',
    icon: <ChartIcon>
      <line x1="4" y1="4" x2="4" y2="20"/><line x1="4" y1="20" x2="20" y2="20"/>
      <rect x="5"  y="13" width="3" height="7" rx="0.5" fill="currentColor" stroke="none" opacity="0.85"/>
      <rect x="5"  y="9"  width="3" height="4" rx="0.5" fill="currentColor" stroke="none" opacity="0.45"/>
      <rect x="10" y="10" width="3" height="10" rx="0.5" fill="currentColor" stroke="none" opacity="0.85"/>
      <rect x="10" y="6"  width="3" height="4" rx="0.5" fill="currentColor" stroke="none" opacity="0.45"/>
      <rect x="15" y="14" width="3" height="6" rx="0.5" fill="currentColor" stroke="none" opacity="0.85"/>
      <rect x="15" y="11" width="3" height="3" rx="0.5" fill="currentColor" stroke="none" opacity="0.45"/>
    </ChartIcon>,
  },
  {
    id: 'pie', label: 'Pie Chart',
    icon: <ChartIcon>
      <circle cx="12" cy="12" r="8"/>
      <path d="M12 12 L12 4"/><path d="M12 12 L19.2 15.6"/><path d="M12 12 L5.6 17"/>
    </ChartIcon>,
  },
  {
    id: 'line', label: 'Line Chart',
    icon: <ChartIcon>
      <line x1="4" y1="4" x2="4" y2="20"/><line x1="4" y1="20" x2="20" y2="20"/>
      <polyline points="5,16 9,11 13,14 18,7" strokeWidth="1.75"/>
      <circle cx="5"  cy="16" r="1" fill="currentColor" stroke="none"/>
      <circle cx="9"  cy="11" r="1" fill="currentColor" stroke="none"/>
      <circle cx="13" cy="14" r="1" fill="currentColor" stroke="none"/>
      <circle cx="18" cy="7"  r="1" fill="currentColor" stroke="none"/>
    </ChartIcon>,
  },
  {
    id: 'table', label: 'Table',
    icon: <ChartIcon>
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <line x1="3"  y1="8"  x2="21" y2="8"/>
      <line x1="3"  y1="13" x2="21" y2="13"/>
      <line x1="3"  y1="18" x2="21" y2="18"/>
      <line x1="10" y1="3"  x2="10" y2="21"/>
    </ChartIcon>,
  },
  {
    id: 'kpi', label: 'KPI Card',
    icon: <ChartIcon>
      <rect x="3" y="5" width="18" height="14" rx="2"/>
      <path d="M8 14 L11 10 L14 12 L17 8" strokeWidth="1.75"/>
      <polyline points="14,8 17,8 17,11"/>
    </ChartIcon>,
  },
]

// performance badge: only shown once widgets exist
const PERF_LEVELS = [
  { max: 4,        label: 'Optimal',          bg: 'rgba(22,163,74,0.10)',  color: '#16a34a', dot: '#16a34a' },
  { max: 7,        label: 'Approaching Limit', bg: 'rgba(217,119,6,0.10)', color: '#d97706', dot: '#d97706' },
  { max: Infinity, label: 'Limit Reached',     bg: 'rgba(220,38,38,0.10)', color: '#dc2626', dot: '#dc2626' },
]
function perfLevel(count) {
  return PERF_LEVELS.find(l => count <= l.max)
}

// ── Add Widget Panel ─────────────────────────────────────────────────
function AddWidgetPanel({ selected, setSelected, widgetTitle, setWidgetTitle, onSave, onCancel }) {
  const rows = []
  for (let i = 0; i < CHART_TYPES.length; i += 2) rows.push(CHART_TYPES.slice(i, i + 2))

  return (
    <div style={{
      width: 348, flexShrink: 0,
      background: '#fff',
      border: '1px solid var(--shell-border)',
      borderRadius: 8,
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* header */}
      <div style={{
        padding: '12px 12px 12px',
        borderBottom: '1px solid #D8D9DD',
        display: 'flex', alignItems: 'center', gap: 6,
        flexShrink: 0,
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={PAI.fg1} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/>
          <line x1="17" y1="14" x2="17" y2="20"/><line x1="14" y1="17" x2="20" y2="17"/>
        </svg>
        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: PAI.fg1 }}>Add Widget</span>
        <button onClick={onCancel} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 2, color: PAI.fg3, display: 'flex' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 12px 0' }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: PAI.fg1, marginBottom: 8 }}>Widget Title</div>
          <input
            value={widgetTitle}
            onChange={e => setWidgetTitle(e.target.value)}
            placeholder="Type"
            style={{
              width: '100%', height: 36, boxSizing: 'border-box',
              border: '1px solid rgba(0,9,50,0.12)', borderRadius: 8,
              padding: '0 10px', fontSize: 13, fontFamily: 'inherit',
              color: PAI.fg1, outline: 'none', background: '#fff',
            }}
          />
        </div>
        <div style={{ fontSize: 12, fontWeight: 500, color: PAI.fg1, marginBottom: 8 }}>Chart Type</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 16 }}>
          {rows.map((row, ri) => (
            <div key={ri} style={{ display: 'flex', gap: 8 }}>
              {row.map(ct => (
                <button
                  key={ct.id}
                  onClick={() => setSelected(ct.id)}
                  style={{
                    flex: 1, height: 76, padding: 10,
                    background: selected === ct.id ? PAI.indigoTint : '#fff',
                    border: `1.5px solid ${selected === ct.id ? PAI.indigo : '#E6E6E6'}`,
                    borderRadius: 12, cursor: 'pointer',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 6,
                    color: selected === ct.id ? PAI.indigo : PAI.fg3,
                    transition: 'border-color 120ms, color 120ms, background 120ms',
                  }}
                >
                  {ct.icon}
                  <span style={{ fontSize: 10, fontWeight: 500, textAlign: 'center', lineHeight: 1.3 }}>
                    {ct.label}
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* footer */}
      <div style={{
        borderTop: '1px solid var(--shell-border)',
        padding: '12px 12px',
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8,
        flexShrink: 0,
      }}>
        <button onClick={onCancel} className="ds-btn sz-sm t-outline">Cancel</button>
        <button onClick={onSave}   className="ds-btn sz-sm t-primary">Save</button>
      </div>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────
let nextId = 1

export default function DashboardCanvas({ onNav }) {
  const [name, setName]               = useState('')
  const [widgets, setWidgets]         = useState([])
  const [panelOpen, setPanelOpen]     = useState(false)
  const [selectedChart, setSelectedChart] = useState(null)
  const [widgetTitle, setWidgetTitle] = useState('')
  const [showScope, setShowScope]     = useState(true)

  const perf = widgets.length > 0 ? perfLevel(widgets.length) : null

  const handleSave = () => {
    if (!selectedChart) return
    const type = CHART_TYPES.find(c => c.id === selectedChart)
    setWidgets(w => [...w, { id: nextId++, label: widgetTitle || type.label, chartId: selectedChart, icon: type.icon }])
    setWidgetTitle('')
    setSelectedChart(null)
    setPanelOpen(false)
  }

  const handleCancel = () => {
    setWidgetTitle('')
    setSelectedChart(null)
    setPanelOpen(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: PAI.bgApp }}>
      <div style={{ display: 'flex', flex: 1, minHeight: 0, gap: 12, padding: 16 }}>

        {/* ── Canvas ── */}
        <div style={{
          flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column',
          background: '#fff',
          border: '1px solid var(--shell-border)',
          borderRadius: 8, overflow: 'hidden',
        }}>

          {/* Canvas toolbar */}
          <div style={{
            height: 52, flexShrink: 0, boxSizing: 'border-box',
            borderBottom: '1px solid var(--shell-border)',
            background: '#fff',
            display: 'flex', alignItems: 'center',
            padding: '0 12px', gap: 8,
          }}>
            {/* Back */}
            <button
              onClick={() => onNav('workspace/library')}
              style={{
                width: 28, height: 28, flexShrink: 0,
                borderRadius: '50%', border: '1.5px solid #A2A1F7',
                background: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: PAI.indigo,
              }}
            >
              <Ic size={13} path={<polyline points="15 18 9 12 15 6"/>} />
            </button>

            {/* Name input */}
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Enter dashboard name here..."
              style={{
                height: 32, minWidth: 220,
                border: '1px solid var(--shell-border)', borderRadius: 8,
                padding: '0 14px', fontSize: 12, fontFamily: 'inherit',
                color: PAI.fg1, background: '#fff', outline: 'none',
                boxSizing: 'border-box',
              }}
            />

            {/* Performance badge — only when widgets exist */}
            {perf && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                height: 22, padding: '0 9px', flexShrink: 0,
                borderRadius: 100, fontSize: 11, fontWeight: 500,
                background: perf.bg, color: perf.color,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: perf.dot, flexShrink: 0 }} />
                {perf.label}
              </span>
            )}

            <div style={{ flex: 1 }} />

            {/* Convert to Report */}
            <button className="ds-btn sz-md t-outline">Convert to Report</button>

            {/* Dashboard Scope */}
            {showScope && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                height: 32, padding: '0 10px', flexShrink: 0,
                borderRadius: 100,
                border: '1px solid #A2A1F7',
                background: PAI.indigoTint, color: PAI.indigo,
                fontSize: 11, fontWeight: 500,
              }}>
                Dashboard Scope
                <button
                  onClick={() => setShowScope(false)}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, color: PAI.indigo, display: 'flex', lineHeight: 1 }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </span>
            )}

            {/* Divider */}
            <div style={{ width: 1, height: 18, background: 'var(--shell-border)', flexShrink: 0 }} />

            {/* Reset */}
            <button
              className="ds-icon-btn"
              title="Reset"
              onClick={() => { setWidgets([]); setName('') }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/>
              </svg>
            </button>

            {/* Save */}
            <button className="ds-btn sz-md t-primary">Save</button>
          </div>

          {/* Canvas body — dot grid */}
          <div style={{
            flex: 1, overflow: 'auto', position: 'relative',
            backgroundImage: 'radial-gradient(circle, #D1D5DB 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}>
            {/* Add Widget button — top-left */}
            <div style={{ padding: 16 }}>
              <button
                onClick={() => setPanelOpen(true)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  height: 32, padding: '0 14px',
                  background: '#fff',
                  border: `1.5px solid ${PAI.indigo}`,
                  borderRadius: 8, cursor: 'pointer',
                  fontSize: 12, fontWeight: 500, fontFamily: 'inherit',
                  color: PAI.indigo,
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Add Widget
              </button>
            </div>

            {/* Widget grid */}
            {widgets.length > 0 && (
              <div style={{ padding: '0 16px 16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                {widgets.map(w => (
                  <div key={w.id} style={{
                    background: '#fff', border: '1px solid var(--shell-border)',
                    borderRadius: 10, padding: 16,
                    display: 'flex', flexDirection: 'column', gap: 10, minHeight: 140,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: PAI.fg1 }}>{w.label}</span>
                      <button
                        onClick={() => setWidgets(ws => ws.filter(x => x.id !== w.id))}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: PAI.fg3, padding: 2, display: 'flex' }}
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                    <div style={{
                      flex: 1, background: PAI.bgApp, borderRadius: 6,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      minHeight: 80, color: PAI.borderStrong,
                    }}>
                      {w.icon}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Add Widget Panel (conditional) ── */}
        {panelOpen && (
          <AddWidgetPanel
            selected={selectedChart}
            setSelected={setSelectedChart}
            widgetTitle={widgetTitle}
            setWidgetTitle={setWidgetTitle}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        )}
      </div>
    </div>
  )
}
