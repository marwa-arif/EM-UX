import React, { useState } from 'react'
import { PAI, Ic } from '../ui.jsx'

// ── Constants ────────────────────────────────────────────────────────
const WIDGET_SIZES = [
  { id: 'small',  label: 'Small',  span: 1 },
  { id: 'medium', label: 'Medium', span: 2 },
  { id: 'large',  label: 'Large',  span: 4 },
]
const WIDGET_HEIGHTS = [
  { id: 'small',  label: 'Small',  px: 180 },
  { id: 'medium', label: 'Medium', px: 260 },
  { id: 'large',  label: 'Large',  px: 360 },
]
const PERF_LEVELS = [
  { max: 4,        label: 'Optimal',           bg: 'rgba(22,163,74,0.10)',  color: '#16a34a', dot: '#16a34a' },
  { max: 7,        label: 'Approaching Limit', bg: 'rgba(217,119,6,0.10)', color: '#d97706', dot: '#d97706' },
  { max: Infinity, label: 'Limit Reached',     bg: 'rgba(220,38,38,0.10)', color: '#dc2626', dot: '#dc2626' },
]
const perfLevel = count => PERF_LEVELS.find(l => count <= l.max)

const CHART_TYPES = [
  { id: 'hor-bar',    label: 'Horizontal Bar Chart' },
  { id: 'vert-bar',   label: 'Vertical Bar Chart' },
  { id: 'stack-hor',  label: 'Stacked Horizontal Bar' },
  { id: 'stack-vert', label: 'Stacked Vertical Bar' },
  { id: 'pie',        label: 'Pie Chart' },
  { id: 'line',       label: 'Line Chart' },
  { id: 'table',      label: 'Table' },
  { id: 'kpi',        label: 'KPI Card' },
]

// ── Chart SVG icons (panel) ──────────────────────────────────────────
const ChartIcon = ({ id }) => {
  const s = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' }
  const icons = {
    'hor-bar': <><line x1="4" y1="4" x2="4" y2="20" {...s}/><line x1="4" y1="20" x2="20" y2="20" {...s}/><rect x="5" y="6" width="10" height="2.5" rx="0.5" fill="currentColor" stroke="none" opacity="0.7"/><rect x="5" y="11" width="7" height="2.5" rx="0.5" fill="currentColor" stroke="none" opacity="0.7"/><rect x="5" y="16" width="13" height="2.5" rx="0.5" fill="currentColor" stroke="none" opacity="0.7"/></>,
    'vert-bar': <><line x1="4" y1="4" x2="4" y2="20" {...s}/><line x1="4" y1="20" x2="20" y2="20" {...s}/><rect x="5" y="12" width="3" height="8" rx="0.5" fill="currentColor" stroke="none" opacity="0.7"/><rect x="10" y="8" width="3" height="12" rx="0.5" fill="currentColor" stroke="none" opacity="0.7"/><rect x="15" y="15" width="3" height="5" rx="0.5" fill="currentColor" stroke="none" opacity="0.7"/></>,
    'stack-hor': <><line x1="4" y1="4" x2="4" y2="20" {...s}/><line x1="4" y1="20" x2="20" y2="20" {...s}/><rect x="5" y="6" width="6" height="2.5" rx="0.5" fill="currentColor" stroke="none" opacity="0.85"/><rect x="11" y="6" width="5" height="2.5" rx="0.5" fill="currentColor" stroke="none" opacity="0.45"/><rect x="5" y="11" width="4" height="2.5" rx="0.5" fill="currentColor" stroke="none" opacity="0.85"/><rect x="9" y="11" width="7" height="2.5" rx="0.5" fill="currentColor" stroke="none" opacity="0.45"/></>,
    'stack-vert': <><line x1="4" y1="4" x2="4" y2="20" {...s}/><line x1="4" y1="20" x2="20" y2="20" {...s}/><rect x="5" y="13" width="3" height="7" rx="0.5" fill="currentColor" stroke="none" opacity="0.85"/><rect x="5" y="9" width="3" height="4" rx="0.5" fill="currentColor" stroke="none" opacity="0.45"/><rect x="10" y="10" width="3" height="10" rx="0.5" fill="currentColor" stroke="none" opacity="0.85"/><rect x="10" y="6" width="3" height="4" rx="0.5" fill="currentColor" stroke="none" opacity="0.45"/></>,
    'pie': <><circle cx="12" cy="12" r="8" {...s}/><path d="M12 12 L12 4" {...s}/><path d="M12 12 L19.2 15.6" {...s}/><path d="M12 12 L5.6 17" {...s}/></>,
    'line': <><line x1="4" y1="4" x2="4" y2="20" {...s}/><line x1="4" y1="20" x2="20" y2="20" {...s}/><polyline points="5,16 9,11 13,14 18,7" strokeWidth="1.75" {...s}/></>,
    'table': <><rect x="3" y="3" width="18" height="18" rx="2" {...s}/><line x1="3" y1="8" x2="21" y2="8" {...s}/><line x1="3" y1="13" x2="21" y2="13" {...s}/><line x1="10" y1="3" x2="10" y2="21" {...s}/></>,
    'kpi': <><rect x="3" y="5" width="18" height="14" rx="2" {...s}/><path d="M8 14 L11 10 L14 12 L17 8" strokeWidth="1.75" {...s}/><polyline points="14,8 17,8 17,11" {...s}/></>,
  }
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      {icons[id]}
    </svg>
  )
}

// ── Chart silhouettes (canvas widget body) ───────────────────────────
const G = '#E5E7EB'   // primary gray
const GL = '#F3F4F6'  // light gray

function ChartSilhouette({ chartId }) {
  const silhouettes = {
    'pie': (
      <svg viewBox="0 0 220 170" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        <circle cx="110" cy="80" r="55" fill="none" stroke={G} strokeWidth="26"/>
        <circle cx="110" cy="80" r="55" fill="none" stroke={GL} strokeWidth="26" strokeDasharray="65 400"/>
        <circle cx="110" cy="80" r="18" fill={GL}/>
        <circle cx="28" cy="150" r="6" fill={G}/>
        <rect x="40" y="145" width="45" height="10" rx="5" fill={G}/>
        <circle cx="105" cy="150" r="6" fill={G}/>
        <rect x="117" y="145" width="55" height="10" rx="5" fill={G}/>
        <circle cx="185" cy="150" r="6" fill={G}/>
        <rect x="197" y="145" width="18" height="10" rx="5" fill={G}/>
      </svg>
    ),
    'table': (
      <svg viewBox="0 0 220 160" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        <rect x="8" y="8" width="204" height="22" rx="4" fill={G}/>
        {[0,1,2,3,4].map(i => (
          <g key={i}>
            <rect x="8" y={40+i*24} width="38" height="12" rx="4" fill={GL}/>
            <rect x="54" y={40+i*24} width="90" height="12" rx="4" fill={GL}/>
            <rect x="152" y={40+i*24} width="60" height="12" rx="4" fill={GL}/>
          </g>
        ))}
      </svg>
    ),
    'vert-bar': (
      <svg viewBox="0 0 220 160" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        <line x1="20" y1="10" x2="20" y2="140" stroke={G} strokeWidth="2"/>
        <line x1="20" y1="140" x2="210" y2="140" stroke={G} strokeWidth="2"/>
        {[[30,80],[68,110],[106,55],[144,90],[182,40]].map(([x,h],i) => (
          <rect key={i} x={x} y={140-h} width="28" height={h} rx="3" fill={i%2===0?G:GL}/>
        ))}
      </svg>
    ),
    'hor-bar': (
      <svg viewBox="0 0 220 160" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        <line x1="20" y1="10" x2="20" y2="140" stroke={G} strokeWidth="2"/>
        <line x1="20" y1="140" x2="210" y2="140" stroke={G} strokeWidth="2"/>
        {[[20,100],[50,140],[80,80],[110,120],[140,60]].map(([y,w],i) => (
          <rect key={i} x={22} y={y} width={w} height="18" rx="3" fill={i%2===0?G:GL}/>
        ))}
      </svg>
    ),
    'stack-hor': (
      <svg viewBox="0 0 220 160" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        <line x1="20" y1="10" x2="20" y2="140" stroke={G} strokeWidth="2"/>
        <line x1="20" y1="140" x2="210" y2="140" stroke={G} strokeWidth="2"/>
        {[20,55,90,125].map((y,i) => (
          <g key={i}>
            <rect x={22} y={y} width={80} height="18" rx="3" fill={G}/>
            <rect x={104} y={y} width={50} height="18" rx="3" fill={GL}/>
            <rect x={156} y={y} width={30} height="18" rx="3" fill="#DBEAFE"/>
          </g>
        ))}
      </svg>
    ),
    'stack-vert': (
      <svg viewBox="0 0 220 160" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        <line x1="20" y1="10" x2="20" y2="140" stroke={G} strokeWidth="2"/>
        <line x1="20" y1="140" x2="210" y2="140" stroke={G} strokeWidth="2"/>
        {[[30,50,40],[70,70,30],[110,45,55],[150,60,35],[190,35,50]].map(([x,h1,h2],i) => (
          <g key={i}>
            <rect x={x} y={140-h1-h2} width="24" height={h1} rx="2" fill={GL}/>
            <rect x={x} y={140-h2} width="24" height={h2} rx="2" fill={G}/>
          </g>
        ))}
      </svg>
    ),
    'line': (
      <svg viewBox="0 0 220 160" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        <line x1="20" y1="10" x2="20" y2="140" stroke={G} strokeWidth="2"/>
        <line x1="20" y1="140" x2="210" y2="140" stroke={G} strokeWidth="2"/>
        <polyline points="30,110 68,70 106,90 144,45 182,65" fill="none" stroke={G} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        {[30,68,106,144,182].map((x,i) => {
          const ys = [110,70,90,45,65]
          return <circle key={i} cx={x} cy={ys[i]} r="5" fill="#fff" stroke={G} strokeWidth="2"/>
        })}
      </svg>
    ),
    'kpi': (
      <svg viewBox="0 0 220 100" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        <rect x="60" y="20" width="100" height="32" rx="6" fill={G}/>
        <rect x="80" y="64" width="60" height="14" rx="5" fill={GL}/>
      </svg>
    ),
  }
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {silhouettes[chartId] || silhouettes['vert-bar']}
    </div>
  )
}

// ── KG picker button ─────────────────────────────────────────────────
const KGBtn = () => (
  <button style={{
    width: 40, height: 40, flexShrink: 0, borderRadius: 8,
    border: `1.5px solid ${PAI.indigo}`, background: PAI.indigoTint,
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: PAI.indigo,
  }}>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="6" cy="12" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="18" cy="18" r="2"/>
      <line x1="8" y1="11" x2="16" y2="7"/><line x1="8" y1="13" x2="16" y2="17"/>
    </svg>
  </button>
)

// ── Field row ────────────────────────────────────────────────────────
function FieldRow({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <div style={{ fontSize: 13, fontWeight: 600, color: PAI.fg1, marginBottom: hint ? 2 : 8 }}>{label}</div>}
      {hint  && <div style={{ fontSize: 11, color: PAI.fg3, marginBottom: 8 }}>{hint}</div>}
      {children}
    </div>
  )
}

function TextInput({ placeholder, value, onChange, withKG }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <input
        value={value || ''} onChange={onChange}
        placeholder={placeholder}
        style={{
          flex: 1, height: 40, boxSizing: 'border-box',
          border: '1px solid rgba(0,9,50,0.12)', borderRadius: 8,
          padding: '0 10px', fontSize: 13, fontFamily: 'inherit',
          color: PAI.fg3, outline: 'none', background: '#fff',
        }}
      />
      {withKG && <KGBtn />}
    </div>
  )
}

function SelectInput({ value, onChange, options }) {
  return (
    <select
      value={value || ''} onChange={onChange}
      style={{
        flex: 1, height: 40, boxSizing: 'border-box',
        border: '1px solid rgba(0,9,50,0.12)', borderRadius: 8,
        padding: '0 10px', fontSize: 13, fontFamily: 'inherit',
        color: PAI.fg3, background: '#fff', outline: 'none', cursor: 'pointer',
        appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236E6E6E' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center',
        paddingRight: 30,
      }}
    >
      {options.map(o => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
    </select>
  )
}

function SizeButtons({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {options.map(o => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          style={{
            flex: 1, height: 32,
            background: value === o.id ? PAI.indigoTint : '#fff',
            border: `1.5px solid ${value === o.id ? PAI.indigo : '#E6E6E6'}`,
            borderRadius: 8, cursor: 'pointer',
            fontSize: 12, fontWeight: 500, fontFamily: 'inherit',
            color: value === o.id ? PAI.indigo : PAI.fg3,
            transition: 'border-color 120ms, color 120ms, background 120ms',
          }}
        >{o.label}</button>
      ))}
    </div>
  )
}

// ── Widget Settings Panel ────────────────────────────────────────────
function WidgetSettingsPanel({ widget, onSaveChanges, onClose }) {
  const [tab, setTab]       = useState('data')
  const [title, setTitle]   = useState(widget.label)
  const [sizeId, setSizeId] = useState(widget.sizeId || 'small')
  const [heightId, setHeightId] = useState(widget.heightId || 'small')
  const [chartType, setChartType] = useState(widget.chartId)
  const [groupBy, setGroupBy]     = useState('')
  const [operation, setOperation] = useState('count')
  const [aggregateBy, setAggregateBy] = useState('')
  const [filterBy, setFilterBy]   = useState('')
  const [widgetFilter, setWidgetFilter] = useState('')
  const [sortBy, setSortBy]       = useState('')

  const tabStyle = (id) => ({
    flex: 1, height: 40, border: 'none', background: 'transparent',
    cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
    fontWeight: tab === id ? 600 : 400,
    color: tab === id ? PAI.fg1 : PAI.fg3,
    borderBottom: `2px solid ${tab === id ? PAI.indigo : 'transparent'}`,
    transition: 'color 120ms, border-color 120ms',
  })

  const isPie = chartType === 'pie'
  const chartTypeLabel = CHART_TYPES.find(c => c.id === chartType)?.label || ''

  return (
    <div style={{
      width: 348, flexShrink: 0, background: '#fff',
      border: '1px solid var(--shell-border)', borderRadius: 8,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '12px 12px 0', borderBottom: '1px solid #D8D9DD', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 10 }}>
          <Ic size={16} path={<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 17h6M17 14v6"/></>} />
          <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: PAI.fg1 }}>Widget Settings</span>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 2, color: PAI.fg3, display: 'flex' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        {/* Tabs */}
        <div style={{ display: 'flex', marginBottom: -1 }}>
          <button style={tabStyle('general')} onClick={() => setTab('general')}>General</button>
          <button style={tabStyle('data')}    onClick={() => setTab('data')}>Data</button>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 12px 0' }}>
        {tab === 'general' && (
          <>
            <FieldRow label="Widget Title">
              <TextInput placeholder="Enter widget title..." value={title} onChange={e => setTitle(e.target.value)} />
            </FieldRow>
            <FieldRow label="Widget Size">
              <SizeButtons options={WIDGET_SIZES} value={sizeId} onChange={setSizeId} />
            </FieldRow>
            <FieldRow label="Widget Height">
              <SizeButtons options={WIDGET_HEIGHTS} value={heightId} onChange={setHeightId} />
            </FieldRow>
          </>
        )}

        {tab === 'data' && (
          <>
            <FieldRow label="Chart Type">
              <SelectInput
                value={chartType}
                onChange={e => setChartType(e.target.value)}
                options={CHART_TYPES.map(c => ({ value: c.id, label: c.label }))}
              />
            </FieldRow>

            {isPie ? (
              <>
                <FieldRow label="Slice" hint="Define how to divide sections in pie">
                  <FieldRow label="Group By">
                    <TextInput placeholder="Classification" withKG />
                  </FieldRow>
                </FieldRow>

                <FieldRow label="Size" hint="Define what determines slice proportions">
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: PAI.fg3, marginBottom: 6, borderBottom: '1px dashed #E6E6E6', paddingBottom: 4 }}>Operation</div>
                      <SelectInput value={operation} onChange={e => setOperation(e.target.value)} options={[{ value:'count',label:'Count'},{ value:'sum',label:'Sum'},{ value:'avg',label:'Avg'}]} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: PAI.fg3, marginBottom: 6, borderBottom: '1px dashed #E6E6E6', paddingBottom: 4 }}>Aggregate By</div>
                      <TextInput placeholder="Entity ID" withKG />
                    </div>
                  </div>
                </FieldRow>

                <FieldRow label="Filter By">
                  <TextInput placeholder="Optional data filter" withKG />
                </FieldRow>
              </>
            ) : (
              <>
                <FieldRow label="X Axis">
                  <TextInput placeholder="Select field" withKG />
                </FieldRow>
                <FieldRow label="Y Axis">
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: PAI.fg3, marginBottom: 6, borderBottom: '1px dashed #E6E6E6', paddingBottom: 4 }}>Operation</div>
                      <SelectInput value={operation} onChange={e => setOperation(e.target.value)} options={[{ value:'count',label:'Count'},{ value:'sum',label:'Sum'},{ value:'avg',label:'Avg'}]} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: PAI.fg3, marginBottom: 6, borderBottom: '1px dashed #E6E6E6', paddingBottom: 4 }}>Aggregate By</div>
                      <TextInput placeholder="Field" withKG />
                    </div>
                  </div>
                </FieldRow>
                <FieldRow label="Filter By">
                  <TextInput placeholder="Optional data filter" withKG />
                </FieldRow>
              </>
            )}

            <FieldRow label={<><span style={{ fontWeight: 600 }}>Widget Filter</span><span style={{ fontWeight: 400, color: PAI.fg3, fontSize: 11 }}> (Apply global filters - optional)</span></>}>
              <TextInput placeholder="Select widget filter" withKG />
            </FieldRow>

            <FieldRow label="Sort By" hint="Define how data is ordered in chart">
              <TextInput placeholder="Select field" />
            </FieldRow>
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid var(--shell-border)', padding: '12px', display: 'flex', gap: 8, justifyContent: 'flex-end', flexShrink: 0 }}>
        <button onClick={onClose} className="ds-btn sz-md t-outline">Cancel</button>
        <button
          onClick={() => onSaveChanges({ label: title, sizeId, heightId, chartId: chartType })}
          className="ds-btn sz-md t-primary"
        >Save Changes</button>
      </div>
    </div>
  )
}

// ── Add Widget Panel ─────────────────────────────────────────────────
function AddWidgetPanel({ selected, setSelected, widgetTitle, setWidgetTitle, widgetSize, setWidgetSize, widgetHeight, setWidgetHeight, onSave, onCancel }) {
  const rows = []
  for (let i = 0; i < CHART_TYPES.length; i += 2) rows.push(CHART_TYPES.slice(i, i + 2))

  return (
    <div style={{ width: 348, flexShrink: 0, background: '#fff', border: '1px solid var(--shell-border)', borderRadius: 8, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* header */}
      <div style={{ padding: '12px', borderBottom: '1px solid #D8D9DD', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={PAI.fg1} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
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
        <FieldRow label="Widget Title">
          <TextInput placeholder="Enter widget title..." value={widgetTitle} onChange={e => setWidgetTitle(e.target.value)} />
        </FieldRow>
        <FieldRow label="Widget Size">
          <SizeButtons options={WIDGET_SIZES} value={widgetSize} onChange={setWidgetSize} />
        </FieldRow>
        <FieldRow label="Widget Height">
          <SizeButtons options={WIDGET_HEIGHTS} value={widgetHeight} onChange={setWidgetHeight} />
        </FieldRow>
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
                  <ChartIcon id={ct.id} />
                  <span style={{ fontSize: 10, fontWeight: 500, textAlign: 'center', lineHeight: 1.3 }}>{ct.label}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* footer */}
      <div style={{ borderTop: '1px solid var(--shell-border)', padding: '12px', display: 'flex', gap: 8, justifyContent: 'flex-end', flexShrink: 0 }}>
        <button onClick={onCancel} className="ds-btn sz-md t-outline">Cancel</button>
        <button onClick={onSave}   className="ds-btn sz-md t-primary" disabled={!selected} style={{ opacity: selected ? 1 : 0.4 }}>Save</button>
      </div>
    </div>
  )
}

// ── Widget Card ──────────────────────────────────────────────────────
function WidgetCard({ widget, onEdit, onDelete }) {
  const [hovered, setHovered] = useState(false)
  const h = WIDGET_HEIGHTS.find(s => s.id === widget.heightId)?.px || 180
  const isNew = widget.phase === 'settings'

  return (
    <div
      style={{ gridColumn: `span ${widget.span}`, position: 'relative' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Hover actions */}
      {hovered && (
        <div style={{ position: 'absolute', top: -16, right: 0, display: 'flex', gap: 4, zIndex: 10 }}>
          <button title="Move" style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--shell-border)', background: '#fff', cursor: 'grab', display: 'flex', alignItems: 'center', justifyContent: 'center', color: PAI.fg1 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20"/></svg>
          </button>
          <button title="Edit" onClick={onEdit} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--shell-border)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: PAI.fg1 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>
          </button>
          <button title="Delete" onClick={onDelete} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #FECACA', background: '#FEF2F2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          </button>
        </div>
      )}

      {/* Card */}
      <div style={{
        background: '#fff',
        border: isNew ? `1.5px dashed ${PAI.indigo}` : '1px solid var(--shell-border)',
        borderRadius: 10, padding: 12,
        display: 'flex', flexDirection: 'column', gap: 8,
        height: h, boxSizing: 'border-box',
        transition: 'border-color 150ms',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: PAI.fg1 }}>{widget.label}</span>
          <span style={{ fontSize: 10, color: PAI.fg3, background: '#F5F5F5', padding: '2px 7px', borderRadius: 44 }}>
            {CHART_TYPES.find(c => c.id === widget.chartId)?.label}
          </span>
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          <ChartSilhouette chartId={widget.chartId} />
        </div>
      </div>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────
let nextId = 1

export default function DashboardCanvas({ onNav }) {
  const [name, setName]           = useState('')
  const [widgets, setWidgets]     = useState([])
  const [showScope, setShowScope] = useState(true)

  // Panel state: null | 'add' | 'settings'
  const [panelMode, setPanelMode]         = useState(null)
  const [settingsWidgetId, setSettingsWidgetId] = useState(null)

  // Add widget form
  const [selectedChart, setSelectedChart] = useState(null)
  const [widgetTitle, setWidgetTitle]     = useState('')
  const [widgetSize, setWidgetSize]       = useState('small')
  const [widgetHeight, setWidgetHeight]   = useState('small')

  const perf = widgets.filter(w => w.phase === 'active').length > 0
    ? perfLevel(widgets.filter(w => w.phase === 'active').length) : null

  const openAdd = () => {
    setSelectedChart(null); setWidgetTitle(''); setWidgetSize('small'); setWidgetHeight('small')
    setPanelMode('add')
  }

  const handleAddSave = () => {
    if (!selectedChart) return
    const size = WIDGET_SIZES.find(s => s.id === widgetSize)
    const newId = nextId++
    setWidgets(w => [...w, {
      id: newId, label: widgetTitle || CHART_TYPES.find(c => c.id === selectedChart)?.label,
      chartId: selectedChart, span: size.span, sizeId: widgetSize, heightId: widgetHeight,
      phase: 'settings',
    }])
    setSettingsWidgetId(newId)
    setPanelMode('settings')
  }

  const handleAddCancel = () => { setPanelMode(null) }

  const handleSettingsSave = (newId, changes) => {
    const size = WIDGET_SIZES.find(s => s.id === changes.sizeId)
    setWidgets(ws => ws.map(w => w.id === newId
      ? { ...w, ...changes, span: size.span, phase: 'active' }
      : w
    ))
    setPanelMode(null)
    setSettingsWidgetId(null)
  }

  const handleSettingsClose = (widgetId) => {
    // if widget was never activated, remove it
    setWidgets(ws => ws.filter(w => !(w.id === widgetId && w.phase === 'settings')))
    setPanelMode(null)
    setSettingsWidgetId(null)
  }

  const openSettings = (id) => { setSettingsWidgetId(id); setPanelMode('settings') }
  const deleteWidget = (id) => { setWidgets(ws => ws.filter(w => w.id !== id)); if (settingsWidgetId === id) setPanelMode(null) }

  const settingsWidget = widgets.find(w => w.id === settingsWidgetId)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: PAI.bgApp }}>
      <div style={{ display: 'flex', flex: 1, minHeight: 0, gap: 12, padding: 16 }}>

        {/* ── Canvas ── */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: '#fff', border: '1px solid var(--shell-border)', borderRadius: 8, overflow: 'hidden' }}>

          {/* Toolbar */}
          <div style={{ height: 52, flexShrink: 0, boxSizing: 'border-box', background: '#fff', display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8 }}>
            <button
              onClick={() => onNav('workspace/library')}
              style={{ width: 28, height: 28, flexShrink: 0, borderRadius: '50%', border: '1.5px solid #A2A1F7', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: PAI.indigo }}
            >
              <Ic size={13} path={<polyline points="15 18 9 12 15 6"/>} />
            </button>

            <input
              value={name} onChange={e => setName(e.target.value)}
              placeholder="Enter dashboard name here..."
              style={{ height: 32, minWidth: 220, border: '1px solid var(--shell-border)', borderRadius: 8, padding: '0 14px', fontSize: 12, fontFamily: 'inherit', color: PAI.fg1, background: '#fff', outline: 'none', boxSizing: 'border-box' }}
            />

            {perf && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 22, padding: '0 9px', flexShrink: 0, borderRadius: 100, fontSize: 11, fontWeight: 500, background: perf.bg, color: perf.color }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: perf.dot, flexShrink: 0 }} />
                {perf.label}
              </span>
            )}

            <div style={{ flex: 1 }} />

            <button className="ds-btn sz-md t-outline">Convert to Report</button>

            {showScope && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 32, padding: '0 10px', flexShrink: 0, borderRadius: 100, border: '1px solid #A2A1F7', background: PAI.indigoTint, color: PAI.indigo, fontSize: 11, fontWeight: 500 }}>
                Dashboard Scope
                <button onClick={() => setShowScope(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, color: PAI.indigo, display: 'flex', lineHeight: 1 }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </span>
            )}

            <div style={{ width: 1, height: 18, background: 'var(--shell-border)', flexShrink: 0 }} />

            <button className="ds-icon-btn" title="Reset" onClick={() => { setWidgets([]); setName(''); setPanelMode(null) }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
              </svg>
            </button>

            <button className="ds-btn sz-md t-primary">Save</button>
          </div>

          {/* Canvas body */}
          <div style={{ flex: 1, overflow: 'auto', backgroundImage: 'radial-gradient(circle, #D1D5DB 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, padding: 20, alignItems: 'start' }}>

              {widgets.map(w => (
                <WidgetCard
                  key={w.id}
                  widget={w}
                  onEdit={() => openSettings(w.id)}
                  onDelete={() => deleteWidget(w.id)}
                />
              ))}

              {/* Add Widget placeholder */}
              <button
                onClick={openAdd}
                style={{
                  gridColumn: 'span 1',
                  height: WIDGET_HEIGHTS[0].px, width: '100%',
                  background: panelMode === 'add' ? PAI.indigoTint : '#fff',
                  border: `1.5px dashed ${PAI.indigo}`,
                  borderRadius: 10, cursor: 'pointer',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 6,
                  color: PAI.indigo, transition: 'background 150ms',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                <span style={{ fontSize: 12, fontWeight: 500, fontFamily: 'inherit' }}>Add Widget</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Right Panel ── */}
        {panelMode === 'add' && (
          <AddWidgetPanel
            selected={selectedChart} setSelected={setSelectedChart}
            widgetTitle={widgetTitle} setWidgetTitle={setWidgetTitle}
            widgetSize={widgetSize}   setWidgetSize={setWidgetSize}
            widgetHeight={widgetHeight} setWidgetHeight={setWidgetHeight}
            onSave={handleAddSave}
            onCancel={handleAddCancel}
          />
        )}
        {panelMode === 'settings' && settingsWidget && (
          <WidgetSettingsPanel
            widget={settingsWidget}
            onSaveChanges={changes => handleSettingsSave(settingsWidget.id, changes)}
            onClose={() => handleSettingsClose(settingsWidget.id)}
          />
        )}
      </div>
    </div>
  )
}
