import React, { useState } from 'react'
import { PAI, Ic } from '../ui.jsx'
import { ChartRender } from '../components/ChartRender.jsx'

// ── Constants ────────────────────────────────────────────────────────
const WIDGET_SIZES = [
  { id: 'small',   label: 'Small',       span: 1 },
  { id: 'medium',  label: 'Medium',      span: 2 },
  { id: 'large',   label: 'Large',       span: 3 },
  { id: 'xlarge',  label: 'Extra Large', span: 4 },
]
const WIDGET_HEIGHTS = [
  { id: 'small',   label: 'Small',       px: 260 },
  { id: 'medium',  label: 'Medium',      px: 360 },
  { id: 'large',   label: 'Large',       px: 460 },
  { id: 'xlarge',  label: 'Extra Large', px: 560 },
]
const PERF_LEVELS = [
  { max: 4,        label: 'Optimal',           bg: 'rgba(22,163,74,0.10)',  color: 'var(--pai-green)', dot: 'var(--pai-green)' },
  { max: 7,        label: 'Approaching Limit', bg: 'rgba(217,119,6,0.10)', color: 'var(--pai-high-fg)', dot: 'var(--pai-high-fg)' },
  { max: Infinity, label: 'Limit Reached',     bg: 'rgba(220,38,38,0.10)', color: 'var(--pai-crit-fg)', dot: 'var(--pai-crit-fg)' },
]
const perfLevel = count => PERF_LEVELS.find(l => count <= l.max)

const CHART_TYPES = [
  { id: 'heading',    label: 'Heading' },
  { id: 'kpi',        label: 'KPI Card' },
  { id: 'pie',        label: 'Pie Chart' },
  { id: 'hor-bar',    label: 'Horizontal Bar Chart' },
  { id: 'vert-bar',   label: 'Vertical Bar Chart' },
  { id: 'stack-hor',  label: 'Stacked Horizontal Bar' },
  { id: 'stack-vert', label: 'Stacked Vertical Bar' },
  { id: 'line',       label: 'Line Chart' },
  { id: 'table',      label: 'Table' },
]

// ── Chart icons (panel) ──────────────────────────────────────────────
const LCNC_ICONS = {
  'hor-bar':    'assets/icons/lcnc/horizontalbar.svg',
  'vert-bar':   'assets/icons/lcnc/verticalbar.svg',
  'stack-hor':  'assets/icons/lcnc/stack-horizontalbar.svg',
  'stack-vert': 'assets/icons/lcnc/stack-verticalbar.svg',
  'pie':        'assets/icons/lcnc/pie.svg',
  'line':       'assets/icons/lcnc/line.svg',
  'table':      'assets/icons/lcnc/table.svg',
  'kpi':        'assets/icons/lcnc/KPI.svg',
}

const ChartIcon = ({ id, selected }) => {
  const src = LCNC_ICONS[id]
  if (src) return (
    <span style={{
      display: 'inline-block', width: 24, height: 24, flexShrink: 0,
      backgroundColor: selected ? PAI.indigo : 'var(--shell-text-muted)',
      WebkitMaskImage: `url(${src})`, WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center',
      maskImage: `url(${src})`, maskSize: 'contain', maskRepeat: 'no-repeat', maskPosition: 'center',
    }} />
  )
  const s = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' }
  const icons = {
    'heading': <><line x1="4" y1="7" x2="4" y2="17" {...s}/><line x1="20" y1="7" x2="20" y2="17" {...s}/><line x1="4" y1="12" x2="20" y2="12" {...s}/><line x1="7" y1="7" x2="17" y2="7" {...s}/></>,
    'none':    <><rect x="3" y="3" width="18" height="18" rx="2" {...s} strokeDasharray="3 2"/></>,
  }
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none">{icons[id]}</svg>
}

// ── Chart constants (skeleton only — ChartRender has its own) ────────
const G  = '#E5E7EB'  // skeleton gray
const GL = '#F3F4F6'  // skeleton light gray

// ── Chart silhouettes (DS skeleton / loading state) ───────────────────
function ChartSilhouette({ chartId }) {
  const silhouettes = {
    'pie': (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="130" height="130" viewBox="0 0 130 130">
            <circle cx="65" cy="65" r="48" fill="none" stroke={G} strokeWidth="12"/>
            <circle cx="65" cy="65" r="48" fill="none" stroke={GL} strokeWidth="12"
              strokeDasharray="45 999" transform="rotate(-90 65 65)"/>
            <circle cx="65" cy="65" r="20" fill={GL}/>
          </svg>
        </div>
        <div style={{ width: '100%', paddingBottom: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[[48,28],[42,36]].map(([lw,vw], i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: G, flexShrink: 0 }}/>
                <div style={{ width: lw, height: 10, borderRadius: 5, background: G }}/>
              </div>
              <div style={{ width: vw, height: 10, borderRadius: 5, background: G }}/>
            </div>
          ))}
        </div>
      </div>
    ),
    'hor-bar': (
      <svg viewBox="0 0 220 160" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        {[[28,17],[22,41],[32,65],[18,89],[14,113]].map(([w,y],i) => (
          <rect key={i} x="4" y={y} width={w} height="9" rx="4" fill={G}/>
        ))}
        {[[115,17],[85,41],[50,65],[30,89],[8,113]].map(([w,y],i) => (
          <rect key={i} x="38" y={y} width={w} height="12" rx="3" fill={G}/>
        ))}
        <line x1="38" y1="133" x2="210" y2="133" stroke={G} strokeWidth="1"/>
        {[38,79,120,161,202].map((x,i) => (
          <rect key={i} x={x-12} y="137" width="24" height="8" rx="4" fill={G}/>
        ))}
      </svg>
    ),
    'stack-hor': (
      <svg viewBox="0 0 220 160" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        {[[28,17],[22,41],[32,65],[18,89],[14,113]].map(([w,y],i) => (
          <rect key={i} x="4" y={y} width={w} height="9" rx="4" fill={G}/>
        ))}
        {[[80,50,30],[60,55,25],[70,45,35],[35,60,45],[15,30,20]].map(([w1,w2,w3],i) => {
          const y = 17+i*24
          return (
            <g key={i}>
              <rect x={38} y={y} width={w1} height="12" rx="2" fill={G}/>
              <rect x={38+w1+2} y={y} width={w2} height="12" rx="2" fill={GL}/>
              <rect x={38+w1+w2+4} y={y} width={w3} height="12" rx="2" fill={G}/>
            </g>
          )
        })}
        <line x1="38" y1="133" x2="210" y2="133" stroke={G} strokeWidth="1"/>
        {[38,79,120,161,202].map((x,i) => (
          <rect key={i} x={x-12} y="137" width="24" height="8" rx="4" fill={G}/>
        ))}
      </svg>
    ),
    'vert-bar': (
      <svg viewBox="0 0 220 160" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        {[10,37,64,91,118].map((y,i) => (
          <rect key={i} x="2" y={y} width="22" height="8" rx="4" fill={G}/>
        ))}
        {[14,41,68,95,122].map(y => (
          <line key={y} x1="30" y1={y} x2="210" y2={y} stroke={G} strokeWidth="0.8"/>
        ))}
        {[[110,36],[78,72],[52,108],[20,144],[7,180]].map(([h,x],i) => (
          <rect key={i} x={x} y={133-h} width="18" height={h} rx="3" fill={G}/>
        ))}
        <line x1="30" y1="133" x2="210" y2="133" stroke={G} strokeWidth="1"/>
        {[36,72,108,144,180].map((x,i) => (
          <rect key={i} x={x-9} y="137" width="24" height="8" rx="4" fill={G}/>
        ))}
      </svg>
    ),
    'stack-vert': (
      <svg viewBox="0 0 220 160" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        {[10,37,64,91,118].map((y,i) => (
          <rect key={i} x="2" y={y} width="22" height="8" rx="4" fill={G}/>
        ))}
        {[14,41,68,95,122].map(y => (
          <line key={y} x1="30" y1={y} x2="210" y2={y} stroke={G} strokeWidth="0.8"/>
        ))}
        {[[50,40,30],[30,50,40],[60,35,25],[20,45,55],[40,30,50]].map(([h1,h2,h3],i) => {
          const x = 36+i*36; const t = h1+h2+h3
          return (
            <g key={i}>
              <rect x={x} y={133-t} width="18" height={h1} rx="2" fill={G}/>
              <rect x={x} y={133-h2-h3} width="18" height={h2} fill={GL}/>
              <rect x={x} y={133-h3} width="18" height={h3} fill={G}/>
            </g>
          )
        })}
        <line x1="30" y1="133" x2="210" y2="133" stroke={G} strokeWidth="1"/>
        {[36,72,108,144,180].map((x,i) => (
          <rect key={i} x={x-9} y="137" width="24" height="8" rx="4" fill={G}/>
        ))}
      </svg>
    ),
    'line': (
      <svg viewBox="0 0 220 160" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        {[10,37,64,91,118].map((y,i) => (
          <rect key={i} x="2" y={y} width="22" height="8" rx="4" fill={G}/>
        ))}
        {[14,41,68,95,122].map(y => (
          <line key={y} x1="30" y1={y} x2="210" y2={y} stroke={G} strokeWidth="0.8"/>
        ))}
        <polyline points="38,115 76,75 114,95 152,55 190,45" fill="none" stroke={G} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="38,90 76,110 114,60 152,85 190,70" fill="none" stroke={GL} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="38,125 76,95 114,130 152,100 190,115" fill="none" stroke={G} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        {[[38,115],[76,75],[114,95],[152,55],[190,45]].map(([x,y],i) => (
          <circle key={i} cx={x} cy={y} r="4" fill={GL} stroke={G} strokeWidth="1.5"/>
        ))}
        <line x1="30" y1="133" x2="210" y2="133" stroke={G} strokeWidth="1"/>
        {[38,76,114,152,190].map((x,i) => (
          <rect key={i} x={x-10} y="137" width="22" height="8" rx="4" fill={G}/>
        ))}
      </svg>
    ),
    'table': (
      <svg viewBox="0 0 220 160" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        <rect x="8" y="8" width="204" height="22" rx="4" fill={G}/>
        {[0,1,2,3,4].map(i => (
          <rect key={i} x="8" y={40+i*24} width="204" height="21" rx="2" fill={i%2===0?G:GL}/>
        ))}
      </svg>
    ),
    'kpi': (
      <svg viewBox="0 0 220 90" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        <rect x="12" y="12" width="52" height="16" rx="8" fill={G}/>
        <circle cx="202" cy="20" r="14" fill={G}/>
        <rect x="12" y="38" width="132" height="18" rx="9" fill={G}/>
        <rect x="12" y="66" width="56" height="14" rx="7" fill={G}/>
        <rect x="74" y="66" width="82" height="14" rx="7" fill={G}/>
      </svg>
    ),
  }
  if (chartId === 'none' || chartId === 'heading') return null
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 220 }}>
        {silhouettes[chartId] || silhouettes['vert-bar']}
      </div>
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

// ── Toggle ───────────────────────────────────────────────────────────
function Toggle({ value, onChange }) {
  return (
    <button onClick={() => onChange(!value)} style={{
      width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', flexShrink: 0,
      background: value ? PAI.indigo : 'var(--pai-border-strong)', position: 'relative', padding: 0,
      transition: 'background 150ms',
    }}>
      <span style={{
        position: 'absolute', top: 2, left: value ? 18 : 2,
        width: 16, height: 16, borderRadius: '50%', background: 'var(--card-bg)',
        transition: 'left 150ms', display: 'block',
      }} />
    </button>
  )
}

function ToggleRow({ label, description, value, onChange, disabled }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16, opacity: disabled ? 0.4 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: PAI.fg1 }}>{label}</div>
        {description && <div style={{ fontSize: 11, color: PAI.fg3, marginTop: 2 }}>{description}</div>}
      </div>
      <Toggle value={value} onChange={onChange} />
    </div>
  )
}

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
          color: value ? PAI.fg1 : PAI.fg3, outline: 'none', background: 'var(--card-bg)',
        }}
      />
      {withKG && <KGBtn />}
    </div>
  )
}

function TextArea({ placeholder, value, onChange }) {
  return (
    <textarea
      value={value || ''} onChange={onChange}
      placeholder={placeholder}
      rows={3}
      style={{
        width: '100%', boxSizing: 'border-box',
        border: '1px solid rgba(0,9,50,0.12)', borderRadius: 8,
        padding: '8px 10px', fontSize: 13, fontFamily: 'inherit',
        color: PAI.fg3, outline: 'none', background: 'var(--card-bg)',
        resize: 'vertical', lineHeight: 1.5,
      }}
    />
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
        color: value ? PAI.fg1 : PAI.fg3, background: 'var(--card-bg)', outline: 'none', cursor: 'pointer',
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
            background: value === o.id ? PAI.indigoTint : 'var(--card-bg)',
            border: `1.5px solid ${value === o.id ? PAI.indigo : 'var(--shell-border)'}`,
            borderRadius: 8, cursor: 'pointer',
            fontSize: 11, fontWeight: 500, fontFamily: 'inherit',
            whiteSpace: 'nowrap', overflow: 'hidden',
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
  const [tab, setTab]             = useState('data')
  const [title, setTitle]         = useState(widget.label)
  const [description, setDescription] = useState(widget.description || '')
  const [sizeId, setSizeId]       = useState(widget.sizeId || 'small')
  const [heightId, setHeightId] = useState(widget.heightId || 'small')
  const [chartType, setChartType] = useState(widget.chartId)
  const [classification, setClassification] = useState('Type')
  const [operation, setOperation]           = useState('count-distinct')
  const [aggregateBy, setAggregateBy]       = useState('host')

  const [widgetFilter, setWidgetFilter]     = useState('')
  const [sortBy, setSortBy]                 = useState('')
  const [showTotalCount, setShowTotalCount] = useState(widget.showTotalCount ?? true)
  const [showPctChange, setShowPctChange]   = useState(widget.showPctChange ?? false)
  const [showLegend, setShowLegend]         = useState(widget.showLegend ?? true)

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
      width: 348, flexShrink: 0, background: 'var(--card-bg)',
      border: '1px solid var(--shell-border)', borderRadius: 8,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '12px 12px 0', borderBottom: '1px solid var(--pai-border-strong)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 10 }}>
          <img src="/assets/icons/lcnc/dasboard-edit.svg" width={16} height={16} alt="" />
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
            <FieldRow label="Description">
              <TextArea placeholder="Describe what this widget shows..." value={description} onChange={e => setDescription(e.target.value)} />
            </FieldRow>
            <FieldRow label="Widget Size">
              <SizeButtons options={WIDGET_SIZES} value={sizeId} onChange={setSizeId} />
            </FieldRow>
            <FieldRow label="Widget Height">
              <SizeButtons options={WIDGET_HEIGHTS} value={heightId} onChange={setHeightId} />
            </FieldRow>
            <FieldRow label="Chart Type">
              <SelectInput
                value={chartType}
                onChange={e => setChartType(e.target.value)}
                options={CHART_TYPES.map(c => ({ value: c.id, label: c.label }))}
              />
            </FieldRow>
          </>
        )}

        {tab === 'data' && (
          <>
            {isPie ? (
              <>
                <FieldRow label="Attribute" hint="Define how to divide sections in pie">
                  <FieldRow label="Classification">
                    <TextInput value={classification} onChange={e => setClassification(e.target.value)} withKG />
                  </FieldRow>
                </FieldRow>

                <FieldRow label="Size" hint="Display total/distinct count in the center of pie chart">
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: PAI.fg3, marginBottom: 6, paddingBottom: 4 }}>Operation</div>
                      <SelectInput value={operation} onChange={e => setOperation(e.target.value)} options={[{ value:'count-distinct',label:'Count Distinct'},{ value:'count',label:'Count'},{ value:'sum',label:'Sum'},{ value:'avg',label:'Avg'}]} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: PAI.fg3, marginBottom: 6, paddingBottom: 4 }}>Aggregate By</div>
                      <SelectInput value={aggregateBy} onChange={e => setAggregateBy(e.target.value)} options={[{ value:'host',label:'Host'},{ value:'entity-id',label:'Entity ID'},{ value:'ip',label:'IP Address'}]} />
                    </div>
                  </div>
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
                      <div style={{ fontSize: 11, color: PAI.fg3, marginBottom: 6, paddingBottom: 4 }}>Operation</div>
                      <SelectInput value={operation} onChange={e => setOperation(e.target.value)} options={[{ value:'count',label:'Count'},{ value:'sum',label:'Sum'},{ value:'avg',label:'Avg'}]} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: PAI.fg3, marginBottom: 6, paddingBottom: 4 }}>Aggregate By</div>
                      <TextInput placeholder="Field" withKG />
                    </div>
                  </div>
                </FieldRow>
              </>
            )}

            <FieldRow label="Widget Filter">
              <TextInput placeholder="Select Widget Filter" withKG />
            </FieldRow>

            {!isPie && (
              <FieldRow label="Sort By" hint="Define how data is ordered in chart">
                <TextInput placeholder="Select field" />
              </FieldRow>
            )}

            {isPie && (
              <>
                <div style={{ borderTop: '1px solid var(--shell-border)', margin: '4px 0 16px' }} />
                <ToggleRow
                  label="Show Legend"
                  description="Display or hide the legend for this chart"
                  value={showLegend}
                  onChange={setShowLegend}
                />
                <ToggleRow
                  label="Show Total Count"
                  description="Display total/distinct count in the center of pie chart"
                  value={showTotalCount}
                  onChange={setShowTotalCount}
                  disabled={!showLegend}
                />
                <ToggleRow
                  label="Show Percentage Change"
                  description='Display the change over time (e.g., "+12%" or "-5%")'
                  value={showPctChange}
                  onChange={setShowPctChange}
                  disabled={!showLegend}
                />
              </>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid var(--shell-border)', padding: '12px', display: 'flex', gap: 8, justifyContent: 'flex-end', flexShrink: 0 }}>
        <button onClick={onClose} className="ds-btn sz-md t-outline">Cancel</button>
        <button
          onClick={() => onSaveChanges({ label: title, description, sizeId, heightId, chartId: chartType, showTotalCount, showPctChange, showLegend })}
          className="ds-btn sz-md t-primary"
        >Apply</button>
      </div>
    </div>
  )
}

// ── Add Widget Panel ─────────────────────────────────────────────────
function AddWidgetPanel({ selected, setSelected, widgetTitle, setWidgetTitle, widgetDescription, setWidgetDescription, widgetSize, setWidgetSize, widgetHeight, setWidgetHeight, onSave, onCancel }) {
  const rows = []
  for (let i = 0; i < CHART_TYPES.length; i += 2) rows.push(CHART_TYPES.slice(i, i + 2))

  return (
    <div style={{ width: 348, flexShrink: 0, background: 'var(--card-bg)', border: '1px solid var(--shell-border)', borderRadius: 8, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* header */}
      <div style={{ padding: '12px', borderBottom: '1px solid var(--pai-border-strong)', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
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
        <FieldRow label="Description">
          <TextArea placeholder="Describe what this widget shows..." value={widgetDescription} onChange={e => setWidgetDescription(e.target.value)} />
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
                    background: selected === ct.id ? PAI.indigoTint : 'var(--card-bg)',
                    border: `1.5px solid ${selected === ct.id ? PAI.indigo : 'var(--shell-border)'}`,
                    borderRadius: 12, cursor: 'pointer',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 6,
                    color: selected === ct.id ? PAI.indigo : PAI.fg3,
                    transition: 'border-color 120ms, color 120ms, background 120ms',
                  }}
                >
                  <ChartIcon id={ct.id} selected={selected === ct.id} />
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
function WidgetCard({ widget, isEditing, onEdit, onDelete }) {
  const [hovered, setHovered] = useState(false)
  const h = WIDGET_HEIGHTS.find(s => s.id === widget.heightId)?.px || 180

  return (
    <div
      style={{ gridColumn: `span ${widget.span}`, position: 'relative' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Hover actions */}
      {hovered && (
        <div style={{ position: 'absolute', top: -16, right: 0, display: 'flex', gap: 4, zIndex: 10 }}>
          <button title="Move" style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--shell-border)', background: 'var(--card-bg)', cursor: 'grab', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/assets/icons/lcnc/drag-widget.svg" width={16} height={16} alt="drag" />
          </button>
          <button title="Add nested widget" style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--shell-border)', background: 'var(--card-bg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/assets/icons/lcnc/add-widget.svg" width={16} height={16} alt="add widget" />
          </button>
          <button title="Edit" onClick={onEdit} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--shell-border)', background: 'var(--card-bg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/assets/icons/lcnc/dasboard-edit.svg" width={16} height={16} alt="edit" />
          </button>
          <button title="Delete" onClick={onDelete} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--pai-crit-bg-hover)', background: 'var(--pai-crit-bg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/assets/icons/lcnc/delete.svg" width={16} height={16} alt="delete" />
          </button>
        </div>
      )}

      {/* Card */}
      <div style={{
        background: 'var(--card-bg)',
        border: isEditing ? `1.5px dashed ${PAI.indigo}` : '1px solid var(--shell-border)',
        borderRadius: 10, padding: 12,
        display: 'flex', flexDirection: 'column', gap: 8,
        height: h, boxSizing: 'border-box',
        transition: 'border-color 150ms',
      }}>
        <div style={{ flexShrink: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: PAI.fg1 }}>{widget.label}</span>
          {widget.description && (
            <div style={{ fontSize: 12, color: PAI.fg3, marginTop: 2 }}>{widget.description}</div>
          )}
        </div>
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <ChartRender chartId={widget.chartId} showPctChange={widget.showPctChange} showLegend={widget.showLegend ?? true} showTotalCount={widget.showTotalCount ?? true} data={widget.data} totalLabel={widget.totalLabel} />
        </div>
      </div>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────
// ── Discover Dashboard template ──────────────────────────────────────
const DISCOVER_TEMPLATE = {
  name: 'Discover Dashboard',
  widgets: [
    {
      id: 1001, label: 'Total Devices', chartId: 'kpi', span: 1, sizeId: 'small', heightId: 'medium', phase: 'active',
      data: { value: '12,382', label: 'Total Devices', trend: '3.89%', trendUp: true },
    },
    {
      id: 1002, label: 'Criticality Insights', chartId: 'stack-hor', span: 2, sizeId: 'medium', heightId: 'medium', phase: 'active',
      data: [
        { label: 'Critical', count: '953',    pct: 1.74,  color: 'var(--pai-crit-fg)'  },
        { label: 'High',     count: '12,353', pct: 22.59, color: 'var(--pai-red-high)' },
        { label: 'Medium',   count: '36,136', pct: 66.08, color: 'var(--pai-high-fg)'  },
        { label: 'Low',      count: '5,244',  pct: 9.59,  color: 'var(--pai-green)'    },
      ],
    },
    {
      id: 1003, label: 'Data Source', chartId: 'hor-bar', span: 2, sizeId: 'medium', heightId: 'medium', phase: 'active',
      data: [
        { label: 'AWS',                 value: 100, secondary: 5,  count: '97' },
        { label: 'MS Azure',            value: 88,  secondary: 5,  count: '85' },
        { label: 'Qualys',              value: 58,  secondary: 21, count: '56' },
        { label: 'MS Active Directory', value: 48,  secondary: 31, count: '47' },
        { label: 'WIZ',                 value: 39,  secondary: 5,  count: '38' },
        { label: 'Infoblox',            value: 12,  secondary: 7,  count: '12' },
        { label: 'MS Defender',         value: 8,   secondary: 5,  count: '8'  },
        { label: 'Tenable',             value: 5,   secondary: 3,  count: '5'  },
      ],
    },
    {
      id: 1004, label: 'Asset Types', chartId: 'pie', span: 1, sizeId: 'small', heightId: 'medium', phase: 'active',
      totalLabel: '10,679',
      data: [
        { label: 'Server',           count: '4,086', value: 4086, pct: '33%', color: 'var(--pai-indigo)'       },
        { label: 'Workstation',      count: '2,848', value: 2848, pct: '23%', color: '#5BADB8'                 },
        { label: 'Network',          count: '2,600', value: 2600, pct: '21%', color: 'var(--pai-green)'        },
        { label: 'Mobile',           count: '897',   value: 897,  pct: '8%',  color: 'var(--pai-high-fg)'      },
        { label: 'Printers',         count: '124',   value: 124,  pct: '1%',  color: 'var(--pai-red-high)'     },
        { label: 'IOT',              count: '122',   value: 122,  pct: '1%',  color: 'var(--pai-indigo-muted)' },
      ],
    },
    { id: 1005, label: 'Insights', chartId: 'table', span: 4, sizeId: 'xlarge', heightId: 'large', phase: 'active' },
  ],
}

let nextId = 1

export default function DashboardCanvas({ onNav, templateId = null }) {
  const template = templateId === 'discover' ? DISCOVER_TEMPLATE : null
  const [name, setName]       = useState(template?.name ?? '')
  const [widgets, setWidgets] = useState(() => {
    if (!template) return []
    nextId = Math.max(...template.widgets.map(w => w.id)) + 1
    return template.widgets
  })

  // Panel state: null | 'add' | 'settings'
  const [panelMode, setPanelMode]         = useState(null)
  const [settingsWidgetId, setSettingsWidgetId] = useState(null)

  // Add widget form
  const [selectedChart, setSelectedChart]       = useState(null)
  const [widgetTitle, setWidgetTitle]           = useState('')
  const [widgetDescription, setWidgetDescription] = useState('')
  const [widgetSize, setWidgetSize]             = useState('small')
  const [widgetHeight, setWidgetHeight]         = useState('small')

  const perf = widgets.filter(w => w.phase === 'active').length > 0
    ? perfLevel(widgets.filter(w => w.phase === 'active').length) : null

  const openAdd = () => {
    setSelectedChart(null); setWidgetTitle(''); setWidgetDescription(''); setWidgetSize('small'); setWidgetHeight('small')
    setPanelMode('add')
  }

  const handleAddSave = () => {
    if (!selectedChart) return
    const size = WIDGET_SIZES.find(s => s.id === widgetSize)
    const newId = nextId++
    setWidgets(w => [...w, {
      id: newId, label: widgetTitle || CHART_TYPES.find(c => c.id === selectedChart)?.label,
      description: widgetDescription,
      chartId: selectedChart, span: size.span, sizeId: widgetSize, heightId: widgetHeight,
      phase: 'active',
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
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: 'var(--card-bg)', border: '1px solid var(--shell-border)', borderRadius: 8, overflow: 'hidden' }}>

          {/* Toolbar */}
          <div style={{ height: 52, flexShrink: 0, boxSizing: 'border-box', background: 'var(--card-bg)', display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8 }}>
            <button
              onClick={() => onNav('workspace/library')}
              style={{ width: 28, height: 28, flexShrink: 0, borderRadius: '50%', border: '1.5px solid var(--pai-indigo-light)', background: 'var(--card-bg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: PAI.indigo }}
            >
              <Ic size={13} path={<polyline points="15 18 9 12 15 6"/>} />
            </button>

            <input
              value={name} onChange={e => setName(e.target.value)}
              placeholder="Enter dashboard name here..."
              style={{ height: 32, minWidth: 220, border: '1px solid var(--shell-border)', borderRadius: 8, padding: '0 14px', fontSize: 12, fontFamily: 'inherit', color: PAI.fg1, background: 'var(--card-bg)', outline: 'none', boxSizing: 'border-box' }}
            />

            {perf && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 22, padding: '0 9px', flexShrink: 0, borderRadius: 100, fontSize: 11, fontWeight: 500, background: perf.bg, color: perf.color }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: perf.dot, flexShrink: 0 }} />
                {perf.label}
              </span>
            )}

            <div style={{ flex: 1 }} />

            <button className="ds-btn sz-md t-outline">Convert to Report</button>

            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 32, lineHeight: 1, padding: '0 4px 0 12px', flexShrink: 0, borderRadius: 100, background: PAI.indigoTint, color: PAI.indigo, fontSize: 14, fontWeight: 500, boxSizing: 'border-box' }}>
              Dashboard Scope
              <span style={{ width: 24, height: 24, borderRadius: '50%', background: PAI.indigo, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <img src="/assets/icons/lcnc/graph-filter.svg" width={20} height={20} alt="" style={{ filter: 'brightness(0) invert(1)' }} />
              </span>
            </span>

            <div style={{ width: 1, height: 18, background: 'var(--shell-border)', flexShrink: 0 }} />

            <button className="ds-icon-btn" title="Reset" onClick={() => { setWidgets([]); setName(''); setPanelMode(null) }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
              </svg>
            </button>

            <button className="ds-btn sz-md t-primary">Save</button>
          </div>

          {/* Canvas body */}
          <div style={{ flex: 1, overflow: 'auto', backgroundImage: 'radial-gradient(circle, var(--pai-border-strong) 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, padding: 20, alignItems: 'start' }}>

              {widgets.map(w => (
                <WidgetCard
                  key={w.id}
                  widget={w}
                  isEditing={w.id === settingsWidgetId}
                  onEdit={() => openSettings(w.id)}
                  onDelete={() => deleteWidget(w.id)}
                />
              ))}

              {/* Add Widget placeholder / Live preview */}
              {panelMode === 'add' ? (
                <div style={{
                  gridColumn: `span ${WIDGET_SIZES.find(s => s.id === widgetSize)?.span || 1}`,
                  position: 'relative',
                }}>
                  <div style={{ position: 'absolute', top: -16, right: 0, display: 'flex', gap: 4, zIndex: 10 }}>
                    <button title="Move" style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--shell-border)', background: 'var(--card-bg)', cursor: 'grab', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src="/assets/icons/lcnc/drag-widget.svg" width={16} height={16} alt="drag" />
                    </button>
                    <button title="Add nested widget" style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--shell-border)', background: 'var(--card-bg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src="/assets/icons/lcnc/add-widget.svg" width={16} height={16} alt="add widget" />
                    </button>
                    <button title="Edit" style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--shell-border)', background: 'var(--card-bg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src="/assets/icons/lcnc/dasboard-edit.svg" width={16} height={16} alt="edit" />
                    </button>
                    <button title="Delete" style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--pai-crit-bg-hover)', background: 'var(--pai-crit-bg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src="/assets/icons/lcnc/delete.svg" width={16} height={16} alt="delete" />
                    </button>
                  </div>
                  <div style={{
                    background: 'var(--card-bg)',
                    border: `1.5px dashed ${PAI.indigo}`,
                    borderRadius: 10, padding: 12,
                    height: WIDGET_HEIGHTS.find(s => s.id === widgetHeight)?.px || 260,
                    boxSizing: 'border-box',
                    display: 'flex', flexDirection: 'column', gap: 8,
                  }}>
                    <div style={{ flexShrink: 0 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: PAI.fg1 }}>
                        {widgetTitle || (selectedChart ? CHART_TYPES.find(c => c.id === selectedChart)?.label : '')}
                      </span>
                      {widgetDescription && (
                        <div style={{ fontSize: 12, color: PAI.fg3, marginTop: 2 }}>{widgetDescription}</div>
                      )}
                    </div>
                    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                      {selectedChart && <ChartSilhouette chartId={selectedChart} />}
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={openAdd}
                  style={{
                    gridColumn: 'span 1',
                    height: WIDGET_HEIGHTS[0].px, width: '100%',
                    background: 'var(--card-bg)',
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
              )}
            </div>
          </div>
        </div>

        {/* ── Right Panel ── */}
        {panelMode === 'add' && (
          <AddWidgetPanel
            selected={selectedChart} setSelected={setSelectedChart}
            widgetTitle={widgetTitle} setWidgetTitle={setWidgetTitle}
            widgetDescription={widgetDescription} setWidgetDescription={setWidgetDescription}
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
