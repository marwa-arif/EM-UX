import React, { useState, useEffect } from 'react'
import { useWorkspace } from '../context/WorkspaceCtx.jsx'
import { ChartRender } from '../components/ChartRender.jsx'
import '../styles/dashboard.css'

// ─────────────────────────────────────────────────────────────────────
// SamplePreview — illustrative "what a configured screen looks like"
// preview, built entirely from real DS components (ds-kpi-row, the
// shared ChartRender line chart, the DS css-hbar pattern, and ds-table)
// instead of a hand-drawn SVG mockup.
// ─────────────────────────────────────────────────────────────────────
const KPI_DATA = [
  { label: 'Total Devices', value: '12,382', delta: '↑ 3.9% from last month', trend: 'up-good'   },
  { label: 'Critical',      value: '953',    delta: '↑ 1.2% from last month', trend: 'up-bad'     },
  { label: 'High',          value: '12,353', delta: '↓ 0.8% from last month', trend: 'down-good'  },
  { label: 'Low',           value: '5,244',  delta: '↑ 5.1% from last month', trend: 'up-good'    },
]

const SOURCE_BARS = [
  { label: 'AWS',      pct: 100, count: 97 },
  { label: 'Azure',    pct: 88,  count: 85 },
  { label: 'Qualys',   pct: 58,  count: 56 },
  { label: 'Tenable',  pct: 42,  count: 41 },
  { label: 'Defender', pct: 28,  count: 27 },
]

const ASSET_ROWS = [
  { name: 'DESKTOP-7A3F',  type: 'Server',      sev: 'Critical', sevClass: 'danger',  cves: 14, os: 'Win 11',  status: 'Active',     statusClass: 'danger'  },
  { name: 'WS-CORP-022',   type: 'Workstation', sev: 'High',     sevClass: 'warning', cves: 7,  os: 'Win 10',  status: 'In Review',  statusClass: 'warning' },
  { name: 'SRV-PROD-09',   type: 'Server',      sev: 'High',     sevClass: 'warning', cves: 11, os: 'RHEL 9',  status: 'In Review',  statusClass: 'warning' },
  { name: 'LAPTOP-DEV-14', type: 'Workstation', sev: 'Medium',   sevClass: 'info',    cves: 3,  os: 'Win 11',  status: 'Resolved',   statusClass: 'success' },
  { name: 'IOT-SENSOR-3',  type: 'IoT',         sev: 'Low',      sevClass: 'success', cves: 1,  os: 'Ubuntu',  status: 'Resolved',   statusClass: 'success' },
]

function SamplePreview({ zoom = 1 }) {
  return (
    <div className="mock-preview" style={{ transform: `scale(${zoom})` }}>

      {/* ── KPI row ──────────────────────────────────────────── */}
      <div className="ds-kpi-row">
        {KPI_DATA.map(kpi => (
          <div className="ds-kpi-card" key={kpi.label}>
            <div>
              <div className="ds-kpi-value">{kpi.value}</div>
              <div className="ds-kpi-label">{kpi.label}</div>
            </div>
            <span className={`ds-kpi-delta ${kpi.trend}`}>{kpi.delta}</span>
          </div>
        ))}
      </div>

      {/* ── Chart row ────────────────────────────────────────── */}
      <div className="mock-chart-row">
        <div className="mock-chart-card">
          <div className="mock-chart-hdr">
            <span className="mock-chart-title">Vulnerability Trend</span>
            <span className="mock-chart-sub">Last 30 days · All severity</span>
          </div>
          <div className="mock-chart-body">
            <ChartRender
              chartId="line"
              series={[
                { label: 'Active',   color: 'var(--pai-indigo)', data: [42, 58, 68, 78, 86] },
                { label: 'Resolved', color: 'var(--pai-teal)',   data: [25, 30, 35, 38, 40] },
              ]}
              xLabels={['May 1', 'May 8', 'May 15', 'May 22', 'May 29']}
            />
          </div>
        </div>

        <div className="mock-chart-card">
          <div className="mock-chart-hdr">
            <span className="mock-chart-title">Data Sources</span>
            <span className="mock-chart-sub">Asset origin by connector</span>
          </div>
          <div className="css-hbar-chart">
            {SOURCE_BARS.map(bar => (
              <div className="css-hbar-row" key={bar.label}>
                <span className="css-hbar-label">{bar.label}</span>
                <div className="css-hbar" style={{ width: `${bar.pct}%` }} />
                <span className="css-hbar-val">{bar.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Asset table ──────────────────────────────────────── */}
      <div className="lib-tbl-wrap">
       <div className="ds-table-wrap">
        <table className="ds-table sz-sm">
          <thead>
            <tr>
              {['Asset Name', 'Type', 'Severity', 'CVEs', 'Last Seen', 'OS', 'Status'].map(h => (
                <th key={h} className="ds-th">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ASSET_ROWS.map(row => (
              <tr key={row.name}>
                <td className="ds-td">{row.name}</td>
                <td className="ds-td">{row.type}</td>
                <td className="ds-td"><span className={`ds-badge ${row.sevClass} dot`}>{row.sev}</span></td>
                <td className="ds-td">{row.cves}</td>
                <td className="ds-td">2h ago</td>
                <td className="ds-td">{row.os}</td>
                <td className="ds-td"><span className={`ds-badge ${row.statusClass} dot`}>{row.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
       </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// Floating preview toolbar — same dc-float-toolbar markup as the real
// dashboard canvas (DashboardCanvas.jsx's DashboardFloatingToolbar).
// Undo/Redo stay disabled — this is a static sample preview with no
// edit history yet — but zoom is real, scaling the preview content.
// ─────────────────────────────────────────────────────────────────────
function PreviewFloatingToolbar({ zoom, onZoomIn, onZoomOut, onZoomReset }) {
  return (
    <div className="dc-float-toolbar">
      <button className="ds-icon-btn" title="Undo" disabled>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 14 4 9 9 4"/>
          <path d="M20 20v-7a4 4 0 0 0-4-4H4"/>
        </svg>
      </button>
      <button className="ds-icon-btn" title="Redo" disabled>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 14 20 9 15 4"/>
          <path d="M4 20v-7a4 4 0 0 1 4-4h12"/>
        </svg>
      </button>
      <div className="dc-float-toolbar-divider" />
      <button className="ds-icon-btn" title="Zoom out" disabled={zoom <= 0.5} onClick={onZoomOut}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/>
        </svg>
      </button>
      <button className="dc-float-toolbar-zoom-label" title="Reset zoom" onClick={onZoomReset}>{Math.round(zoom * 100)}%</button>
      <button className="ds-icon-btn" title="Zoom in" disabled={zoom >= 1.5} onClick={onZoomIn}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
        </svg>
      </button>
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
function DataConfigPage({ onOpenCopilotBuilder, backTarget = 'workspace/saved' }) {
  const { onNav, uploadedFile, uploadSource, setUploadedFile } = useWorkspace()

  const [screenName,   setScreenName]   = useState('')
  const [description,  setDescription]  = useState('')
  const [dataSource,   setDataSource]   = useState('live-api')
  const [visibility,   setVisibility]   = useState('private')
  const [previewUrl,   setPreviewUrl]   = useState(null)
  const [isDetecting,  setIsDetecting]  = useState(false)
  const [detected,     setDetected]     = useState([])
  const [configOpen,   setConfigOpen]   = useState(false)
  const [zoom,         setZoom]         = useState(1)

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

  const handleBack = () => { setUploadedFile(null); onNav(backTarget) }
  const handleReset = () => { setScreenName(''); setDescription('') }
  const handleSave = () => { setUploadedFile(null); onNav(backTarget) }

  const handleZoomIn    = () => setZoom(z => Math.min(1.5, Math.round((z + 0.1) * 10) / 10))
  const handleZoomOut   = () => setZoom(z => Math.max(0.5, Math.round((z - 0.1) * 10) / 10))
  const handleZoomReset = () => setZoom(1)

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

          {/* Edit with Copilot — same entry point as DashboardCanvas */}
          <button
            className="ds-btn sz-md t-outline"
            onClick={() => onOpenCopilotBuilder?.({ kind: 'dataConfig', screenName })}
          >
            <img src="assets/icons/Navigator icon.svg" width={14} height={14} alt="" />
            Edit with Copilot
          </button>

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
              <SamplePreview zoom={zoom} />
            )}

            {!previewUrl && (
              <div className="dcp-canvas-sample-tag">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Sample Preview
              </div>
            )}

            {!previewUrl && (
              <PreviewFloatingToolbar
                zoom={zoom}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onZoomReset={handleZoomReset}
              />
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
