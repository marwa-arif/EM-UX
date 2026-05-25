import React, { useState, useEffect, useRef } from 'react'
import { useWorkspace } from '../context/WorkspaceCtx.jsx'

// ─────────────────────────────────────────────────────────────────────
// MockDashboardPreview — SVG illustration of a PAI security dashboard.
// Rendered at 1100 × 720; the wrapper scales it to fit the canvas.
// Uses SVG presentation attributes (not CSS props) so no style={} needed.
// ─────────────────────────────────────────────────────────────────────
function MockDashboardPreview() {
  const wrapRef  = useRef(null)
  const innerRef = useRef(null)

  // Scale the 1100-wide SVG to fit the container width
  useEffect(() => {
    const wrap  = wrapRef.current
    const inner = innerRef.current
    if (!wrap || !inner) return
    const update = () => {
      const scale = wrap.offsetWidth / 1100
      inner.style.transform = `scale(${scale})`
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [])

  // ── Area chart paths (fits 464px-wide chart area) ────────────────
  const linePoints = [
    [0,110],[58,90],[116,104],[174,68],[232,82],[290,50],[348,64],[406,38],[464,54],
  ]
  const linePath = linePoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ')
  const areaPath = `${linePath} L464,140 L0,140 Z`
  const line2Pts = [
    [0,128],[58,118],[116,122],[174,110],[232,116],[290,104],[348,112],[406,106],[464,110],
  ]
  const line2Path = line2Pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ')

  // ── Bar chart data ────────────────────────────────────────────────
  const bars = [
    { label: 'AWS',      pct: 100, count: '97', color: '#6360D8' },
    { label: 'Azure',    pct: 88,  count: '85', color: '#47ADCB' },
    { label: 'Qualys',   pct: 58,  count: '56', color: '#6360D8' },
    { label: 'Tenable',  pct: 42,  count: '41', color: '#47ADCB' },
    { label: 'Defender', pct: 28,  count: '27', color: '#6360D8' },
  ]

  // ── Table rows ────────────────────────────────────────────────────
  const rows = [
    { name: 'DESKTOP-7A3F',  type: 'Server',      sev: 'Critical', sevColor: '#D12329', sevBg: '#FCE8E8' },
    { name: 'WS-CORP-022',   type: 'Workstation',  sev: 'High',    sevColor: '#D98B1D', sevBg: '#FEF3C7' },
    { name: 'SRV-PROD-09',   type: 'Server',      sev: 'High',    sevColor: '#D98B1D', sevBg: '#FEF3C7' },
    { name: 'LAPTOP-DEV-14', type: 'Workstation',  sev: 'Medium',  sevColor: '#6360D8', sevBg: '#F0F0FC' },
    { name: 'IOT-SENSOR-3',  type: 'IoT',         sev: 'Low',     sevColor: '#1A7549', sevBg: '#EFF7ED' },
  ]

  // Layout constants (no chrome / nav — full 1100×720 content view)
  const PAD = 16          // side padding
  const CW  = 1100 - PAD * 2   // 1068 usable width
  const CARD_W = (CW - 30) / 4 // ≈ 259.5 → KPI card width

  // KPI x positions
  const kpiX = [PAD, PAD + CARD_W + 10, PAD + (CARD_W + 10) * 2, PAD + (CARD_W + 10) * 3]

  // Chart card positions
  const CHART_Y  = 118
  const CHART_H  = 210
  const CHART_LW = Math.floor((CW - 10) / 2)    // left chart width  ≈ 529
  const CHART_RX = PAD + CHART_LW + 10           // right chart x

  // Table position
  const TBL_Y  = CHART_Y + CHART_H + 12          // 384
  const TBL_H  = 720 - TBL_Y                     // fills to bottom
  const TBL_RH = 34                               // header row height
  const ROW_H  = Math.floor((TBL_H - TBL_RH) / rows.length) // row height

  // Table column x positions (absolute)
  const COL = [PAD + 16, PAD + 220, PAD + 390, PAD + 520, PAD + 640, PAD + 756, PAD + 880]

  return (
    <div className="mock-wrap" ref={wrapRef}>
      <div className="mock-inner" ref={innerRef}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="1100" height="720"
          viewBox="0 0 1100 720"
          className="mock-svg"
        >
          {/* ── Page background ────────────────────────────── */}
          <rect width="1100" height="720" fill="#F7F9FC" />


          {/* ── KPI cards ──────────────────────────────────── */}
          {[
            { label: 'Total Devices', value: '12,382', trend: '+3.9%', up: true,  accent: '#47ADCB', bg: '#EEF9FC' },
            { label: 'Critical',      value: '953',    trend: '+1.2%', up: false, accent: '#D12329', bg: '#FCE8E8' },
            { label: 'High',          value: '12,353', trend: '-0.8%', up: false, accent: '#D98B1D', bg: '#FEF3C7' },
            { label: 'Low',           value: '5,244',  trend: '+5.1%', up: true,  accent: '#1A7549', bg: '#EFF7ED' },
          ].map((card, i) => {
            const cx = kpiX[i]
            return (
              <g key={card.label}>
                <rect x={cx} y="12" width={CARD_W} height="90" rx="8" fill="#fff" stroke="#E6E6E6" strokeWidth="1" />
                {/* Icon chip */}
                <rect x={cx + 12} y="22" width="26" height="26" rx="7" fill={card.bg} />
                <circle cx={cx + 25} cy="35" r="6.5" fill={card.accent} opacity="0.75" />
                {/* Value */}
                <text x={cx + 12} y="72" fontFamily="Inter,sans-serif" fontSize="24" fontWeight="700" fill="#101010">{card.value}</text>
                {/* Label */}
                <text x={cx + 12} y="88" fontFamily="Inter,sans-serif" fontSize="10" fill="#6E6E6E">{card.label}</text>
                {/* Trend pill */}
                <rect x={cx + CARD_W - 52} y="76" width="44" height="15" rx="7.5" fill={card.up ? '#EFF7ED' : '#FCE8E8'} />
                <text x={cx + CARD_W - 30} y="87" fontFamily="Inter,sans-serif" fontSize="9" fontWeight="600" fill={card.up ? '#1A7549' : '#D12329'} textAnchor="middle">{card.trend}</text>
              </g>
            )
          })}

          {/* ── Chart cards ────────────────────────────────── */}

          {/* LEFT — area chart */}
          <rect x={PAD} y={CHART_Y} width={CHART_LW} height={CHART_H} rx="8" fill="#fff" stroke="#E6E6E6" strokeWidth="1" />
          <text x={PAD + 14} y={CHART_Y + 20} fontFamily="Inter,sans-serif" fontSize="12" fontWeight="600" fill="#101010">Vulnerability Trend</text>
          <text x={PAD + 14} y={CHART_Y + 35} fontFamily="Inter,sans-serif" fontSize="10" fill="#6E6E6E">Last 30 days · All severity</text>
          {/* Legend */}
          <rect x={PAD + 14} y={CHART_Y + 44} width="8" height="8" rx="2" fill="#6360D8" />
          <text x={PAD + 26} y={CHART_Y + 52} fontFamily="Inter,sans-serif" fontSize="9" fill="#6E6E6E">Active</text>
          <rect x={PAD + 76} y={CHART_Y + 44} width="8" height="8" rx="2" fill="#47ADCB" />
          <text x={PAD + 88} y={CHART_Y + 52} fontFamily="Inter,sans-serif" fontSize="9" fill="#6E6E6E">Resolved</text>
          {/* Y-axis labels */}
          {['120','80','40'].map((v, i) => (
            <text key={v} x={PAD + 6} y={CHART_Y + 78 + i * 40} fontFamily="Inter,sans-serif" fontSize="8" fill="#ADADAD" textAnchor="middle">{v}</text>
          ))}
          {/* Grid lines */}
          {[0, 1, 2].map(i => (
            <line key={i} x1={PAD + 28} y1={CHART_Y + 70 + i * 40} x2={PAD + CHART_LW - 10} y2={CHART_Y + 70 + i * 40} stroke="#F0F0F0" strokeWidth="1" />
          ))}
          {/* Chart area (translated) */}
          <g transform={`translate(${PAD + 32}, ${CHART_Y + 60})`}>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#6360D8" stopOpacity="0.20" />
                <stop offset="100%" stopColor="#6360D8" stopOpacity="0.01" />
              </linearGradient>
            </defs>
            <path d={areaPath} fill="url(#areaGrad)" />
            <path d={linePath}  fill="none" stroke="#6360D8" strokeWidth="2"   strokeLinecap="round" strokeLinejoin="round" />
            <path d={line2Path} fill="none" stroke="#47ADCB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 3" />
          </g>
          {/* X-axis labels */}
          {['May 1','May 8','May 15','May 22','May 29'].map((l, i) => (
            <text key={l} x={PAD + 32 + i * 116} y={CHART_Y + CHART_H - 8} fontFamily="Inter,sans-serif" fontSize="8" fill="#ADADAD">{l}</text>
          ))}

          {/* RIGHT — horizontal bar chart */}
          <rect x={CHART_RX} y={CHART_Y} width={CHART_LW} height={CHART_H} rx="8" fill="#fff" stroke="#E6E6E6" strokeWidth="1" />
          <text x={CHART_RX + 14} y={CHART_Y + 20} fontFamily="Inter,sans-serif" fontSize="12" fontWeight="600" fill="#101010">Data Sources</text>
          <text x={CHART_RX + 14} y={CHART_Y + 35} fontFamily="Inter,sans-serif" fontSize="10" fill="#6E6E6E">Asset origin by connector</text>
          <g transform={`translate(${CHART_RX + 14}, ${CHART_Y + 52})`}>
            {bars.map((bar, i) => {
              const barW = Math.round((bar.pct / 100) * 360)
              const y = i * 28
              return (
                <g key={bar.label}>
                  <text x="0" y={y + 13} fontFamily="Inter,sans-serif" fontSize="10" fill="#6E6E6E">{bar.label}</text>
                  <rect x="68" y={y + 4} width="360" height="13" rx="3.5" fill="#F5F5F5" />
                  <rect x="68" y={y + 4} width={barW} height="13" rx="3.5" fill={bar.color} opacity="0.72" />
                  <text x={68 + barW + 7} y={y + 14} fontFamily="Inter,sans-serif" fontSize="9" fill="#9A9A9A">{bar.count}</text>
                </g>
              )
            })}
          </g>

          {/* ── Data table ─────────────────────────────────── */}
          <rect x={PAD} y={TBL_Y} width={CW} height={TBL_H} rx="8" fill="#fff" stroke="#E6E6E6" strokeWidth="1" />
          {/* TH background */}
          <rect x={PAD} y={TBL_Y} width={CW} height={TBL_RH} rx="8" fill="#F5F5F5" />
          <rect x={PAD} y={TBL_Y + TBL_RH - 16} width={CW} height="16" fill="#F5F5F5" />
          <rect x={PAD} y={TBL_Y + TBL_RH - 1} width={CW} height="1" fill="#E6E6E6" />
          {/* TH labels */}
          {['Asset Name','Type','Severity','CVEs','Last Seen','OS','Status'].map((h, i) => (
            <text key={h} x={COL[i]} y={TBL_Y + 21} fontFamily="Inter,sans-serif" fontSize="9" fontWeight="700" fill="#9A9A9A" letterSpacing="0.04em">{h.toUpperCase()}</text>
          ))}
          {/* Rows */}
          {rows.map((row, i) => {
            const ry = TBL_Y + TBL_RH + i * ROW_H
            const mid = ry + ROW_H / 2 + 4
            const cveCount = [14, 7, 11, 3, 1][i]
            return (
              <g key={row.name}>
                <rect x={PAD} y={ry} width={CW} height={ROW_H} fill={i % 2 === 0 ? '#fff' : '#FAFAFA'} />
                <rect x={PAD} y={ry + ROW_H - 1} width={CW} height="1" fill="#F0F0F0" />
                {/* Name */}
                <rect x={COL[0]} y={mid - 8} width="13" height="13" rx="3" fill="#EBEBEB" />
                <text x={COL[0] + 18} y={mid} fontFamily="Inter,sans-serif" fontSize="11" fontWeight="500" fill="#101010">{row.name}</text>
                {/* Type */}
                <text x={COL[1]} y={mid} fontFamily="Inter,sans-serif" fontSize="11" fill="#6E6E6E">{row.type}</text>
                {/* Severity */}
                <rect x={COL[2]} y={mid - 10} width="56" height="16" rx="4" fill={row.sevBg} />
                <text x={COL[2] + 28} y={mid} fontFamily="Inter,sans-serif" fontSize="9.5" fontWeight="700" fill={row.sevColor} textAnchor="middle">{row.sev}</text>
                {/* CVEs */}
                <text x={COL[3]} y={mid} fontFamily="Inter,sans-serif" fontSize="11" fill="#282828">{cveCount}</text>
                {/* Last Seen */}
                <text x={COL[4]} y={mid} fontFamily="Inter,sans-serif" fontSize="11" fill="#6E6E6E">2h ago</text>
                {/* OS */}
                <text x={COL[5]} y={mid} fontFamily="Inter,sans-serif" fontSize="11" fill="#6E6E6E">{['Win 11','Win 10','RHEL 9','Win 11','Ubuntu'][i]}</text>
                {/* Status */}
                <circle cx={COL[6]} cy={mid - 3} r="4" fill={i === 0 ? '#D12329' : i < 3 ? '#D98B1D' : '#1A7549'} />
                <text x={COL[6] + 12} y={mid} fontFamily="Inter,sans-serif" fontSize="10" fill="#6E6E6E">{i === 0 ? 'Active' : i < 3 ? 'In Review' : 'Resolved'}</text>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

// ── Icons ──────────────────────────────────────────────────────────
const ChevronLeftIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
)

const SlidersIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/>
    <line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/>
    <line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/>
    <line x1="17" y1="16" x2="23" y2="16"/>
  </svg>
)

const CloseIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

const ResetIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
    <path d="M3 3v5h5"/>
  </svg>
)

const SparkleIcon = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3 L13.5 8.5 L19 10 L13.5 11.5 L12 17 L10.5 11.5 L5 10 L10.5 8.5 Z"/>
    <path d="M5 3 L5.6 4.8 L7.5 5.5 L5.6 6.2 L5 8 L4.4 6.2 L2.5 5.5 L4.4 4.8 Z" opacity="0.5"/>
  </svg>
)

const ChartLineIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
)

const GridIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
)

const TableIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <line x1="3" y1="9" x2="21" y2="9"/>
    <line x1="3" y1="15" x2="21" y2="15"/>
    <line x1="9" y1="9" x2="9" y2="21"/>
  </svg>
)

const CodeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6"/>
    <polyline points="8 6 2 12 8 18"/>
  </svg>
)

const DatabaseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="5" rx="9" ry="3"/>
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
  </svg>
)

const CsvIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="8" y1="13" x2="16" y2="13"/>
    <line x1="8" y1="17" x2="16" y2="17"/>
  </svg>
)

const FileIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
    <polyline points="13 2 13 9 20 9"/>
  </svg>
)

const LockIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)

const GlobeIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
)

// ── Simulated AI-detected elements ────────────────────────────────
const DETECTED_ELEMENTS = [
  { id: 'el-1', type: 'Chart',      label: 'Line Chart',    sub: 'Time series',   icon: <ChartLineIcon /> },
  { id: 'el-2', type: 'KPI',        label: 'KPI Cards',     sub: '3 cards found', icon: <GridIcon />      },
  { id: 'el-3', type: 'Table',      label: 'Data Table',    sub: 'Paginated',     icon: <TableIcon />     },
]

const SOURCE_OPTIONS = [
  { id: 'live-api', label: 'Live API',     sub: 'REST / GraphQL',  icon: <DatabaseIcon /> },
  { id: 'static',   label: 'Static Data',  sub: 'Hardcoded JSON',  icon: <FileIcon />     },
  { id: 'csv',      label: 'CSV / Upload', sub: 'Import a file',   icon: <CsvIcon />      },
]

// ── Main component ─────────────────────────────────────────────────
function DataConfigPage() {
  const { onNav, uploadedFile, uploadSource, setUploadedFile } = useWorkspace()

  const [screenName,   setScreenName]   = useState('')
  const [description,  setDescription]  = useState('')
  const [dataSource,   setDataSource]   = useState('live-api')
  const [visibility,   setVisibility]   = useState('private')
  const [previewUrl,   setPreviewUrl]   = useState(null)
  const [isDetecting,  setIsDetecting]  = useState(false)
  const [detected,     setDetected]     = useState([])
  const [configOpen,   setConfigOpen]   = useState(false)

  // Create blob URL for iframe preview when an HTML file is uploaded
  useEffect(() => {
    if (uploadedFile && uploadSource === 'html') {
      const url = URL.createObjectURL(uploadedFile)
      setPreviewUrl(url)
      const name = uploadedFile.name.replace(/\.html?$/i, '').replace(/[-_]/g, ' ')
      setScreenName(name.charAt(0).toUpperCase() + name.slice(1))
      setIsDetecting(true)
      const t = setTimeout(() => { setDetected(DETECTED_ELEMENTS); setIsDetecting(false) }, 1400)
      return () => { clearTimeout(t); URL.revokeObjectURL(url) }
    }
    if (uploadSource === 'design') {
      setIsDetecting(true)
      const t = setTimeout(() => { setDetected(DETECTED_ELEMENTS); setIsDetecting(false) }, 1000)
      return () => clearTimeout(t)
    }
  }, [uploadedFile, uploadSource])

  const handleBack = () => { setUploadedFile(null); onNav('workspace/library') }
  const handleReset = () => { setScreenName(''); setDescription('') }
  const handleSave = () => { setUploadedFile(null); onNav('workspace/library') }

  const fileName = uploadedFile?.name ?? (uploadSource === 'design' ? 'Claude Code Design' : null)

  return (
    <div className="dcp-shell">
      <div className="dcp-card">

        {/* ── Toolbar — matches DashboardCanvas header exactly ─── */}
        <div className="dcp-canvas-hdr">

          {/* Back button */}
          <button className="dcp-back-btn" onClick={handleBack}>
            <ChevronLeftIcon />
          </button>

          {/* Screen name input */}
          <input
            className="dcp-name-input"
            placeholder="Enter screen name here..."
            value={screenName}
            onChange={e => setScreenName(e.target.value)}
          />

          {/* Visibility badge */}
          <span className={`dcp-vis-badge${visibility === 'public' ? ' public' : ''}`}>
            {visibility === 'private' ? <LockIcon /> : <GlobeIcon />}
            {visibility === 'private' ? 'Private' : 'Public'}
          </span>

          <div className="dcp-hdr-spacer" />

          {/* Configure pill — like "Dashboard Scope" */}
          <button
            className={`dcp-configure-pill${configOpen ? ' active' : ''}`}
            onClick={() => setConfigOpen(o => !o)}
          >
            <SparkleIcon size={12} />
            Configure
            <span className="dcp-configure-pill-icon">
              <SlidersIcon />
            </span>
          </button>

          <div className="dcp-hdr-sep" />

          {/* Reset icon */}
          <button className="ds-icon-btn" title="Reset" onClick={handleReset}>
            <ResetIcon />
          </button>

          {/* Save */}
          <button
            className="ds-btn sz-md t-primary"
            onClick={handleSave}
            disabled={!screenName.trim()}
          >
            Save
          </button>
        </div>

        {/* ── Body — preview + optional config panel ─────────── */}
        <div className="dcp-body">

          {/* Screen preview — full width when config closed */}
          <div className="dcp-canvas-body">
            {previewUrl ? (
              <iframe
                className="dcp-canvas-frame"
                src={previewUrl}
                title="Screen Preview"
                sandbox="allow-scripts allow-same-origin"
              />
            ) : (
              <MockDashboardPreview />
            )}

            {!previewUrl && (
              <div className="dcp-canvas-sample-tag">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Sample Preview
              </div>
            )}

            {fileName && (
              <div className="dcp-canvas-fname">
                {uploadSource === 'html'
                  ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
                  : <CodeIcon />
                }
                {fileName}
              </div>
            )}
          </div>

          {/* Config slide-in panel */}
          {configOpen && (
            <div className="dcp-config-panel">

              {/* Panel header */}
              <div className="dcp-config-panel-hdr">
                <span className="dcp-config-panel-title">Configure Screen</span>
                <button className="ds-icon-btn" onClick={() => setConfigOpen(false)}>
                  <CloseIcon />
                </button>
              </div>

              <div className="dcp-config-scroll">

                {/* Screen Details */}
                <div className="dcp-section">
                  <div className="dcp-section-hdr">
                    <span className="dcp-section-title">Screen Details</span>
                  </div>
                  <div className="dcp-field">
                    <label className="dcp-label">Description <span className="dcp-hint">(optional)</span></label>
                    <textarea
                      className="dcp-textarea"
                      placeholder="Briefly describe what this screen shows…"
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                    />
                  </div>
                  <div className="dcp-field">
                    <label className="dcp-label">Visibility</label>
                    <div className="dcp-toggle-row">
                      <button
                        className={`dcp-toggle-btn${visibility === 'private' ? ' active' : ''}`}
                        onClick={() => setVisibility('private')}
                      >
                        <LockIcon /> Private
                      </button>
                      <button
                        className={`dcp-toggle-btn${visibility === 'public' ? ' active' : ''}`}
                        onClick={() => setVisibility('public')}
                      >
                        <GlobeIcon /> Public
                      </button>
                    </div>
                  </div>
                </div>

                <div className="dcp-divider" />

                {/* AI Detection */}
                <div className="dcp-section">
                  <div className="dcp-section-hdr">
                    <span className="dcp-section-title">AI Detection</span>
                  </div>
                  <div className="dcp-ai-panel">
                    <div className="dcp-ai-panel-hdr">
                      <div className="dcp-ai-label">
                        <SparkleIcon />
                        {isDetecting ? 'Analysing screen…' : `${detected.length} elements detected`}
                      </div>
                      {!isDetecting && detected.length > 0 && (
                        <span className="dcp-ai-count">{detected.length}</span>
                      )}
                    </div>
                    {isDetecting ? (
                      <div className="dcp-ai-items">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="dcp-ai-item dcp-ai-skel">
                            <div className="dcp-ai-item-icon" />
                            <div className="dcp-ai-item-name"><span className="dcp-ai-skel-bar" /></div>
                          </div>
                        ))}
                      </div>
                    ) : detected.length > 0 ? (
                      <div className="dcp-ai-items">
                        {detected.map(el => (
                          <div key={el.id} className="dcp-ai-item">
                            <div className="dcp-ai-item-icon">{el.icon}</div>
                            <div className="dcp-ai-item-body">
                              <div className="dcp-ai-item-name">{el.label}</div>
                              <div className="dcp-ai-item-sub">{el.sub}</div>
                            </div>
                            <span className="dcp-ai-item-tag">{el.type}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="dcp-ai-empty">Upload or connect a design to begin detection.</div>
                    )}
                  </div>
                </div>

                <div className="dcp-divider" />

                {/* Data Source */}
                <div className="dcp-section">
                  <div className="dcp-section-hdr">
                    <span className="dcp-section-title">Data Source</span>
                  </div>
                  <div className="dcp-source-row">
                    {SOURCE_OPTIONS.map(opt => (
                      <button
                        key={opt.id}
                        className={`dcp-source-btn${dataSource === opt.id ? ' active' : ''}`}
                        onClick={() => setDataSource(opt.id)}
                      >
                        <span className="dcp-source-btn-icon">{opt.icon}</span>
                        <span className="dcp-source-btn-label">{opt.label}</span>
                        <span className="dcp-source-btn-sub">{opt.sub}</span>
                      </button>
                    ))}
                  </div>
                  {dataSource === 'live-api' && (
                    <div className="dcp-field">
                      <label className="dcp-label">Endpoint URL</label>
                      <input className="dcp-input" placeholder="https://api.example.com/v1/data" />
                    </div>
                  )}
                  {dataSource === 'csv' && (
                    <div className="dcp-field">
                      <label className="dcp-label">Upload CSV</label>
                      <input className="dcp-input dcp-input--file" type="file" accept=".csv" />
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default DataConfigPage
