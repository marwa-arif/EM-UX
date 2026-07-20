import React, { useState, useRef, useEffect } from 'react'
import { PAI, Ic } from '../ui.jsx'
import { ChartRender } from '../components/ChartRender.jsx'
import { EXEC_SUMMARY_TEMPLATE, VULN_DETAIL_TEMPLATE, MOM_TEMPLATE, WidgetCard } from './DashboardCanvas.jsx'
import { USER_FULL_NAME } from '../currentUser.js'
import { useWorkspace } from '../context/WorkspaceCtx.jsx'
import '../styles/dashboard.css'
import '../styles/compliance.css'
import '../styles/active-filter-panel.css'

// ── Toolbar icons ─────────────────────────────────────────────────────
const CalendarIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
)
const ShareIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
  </svg>
)
const DownloadIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
)
const EditIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)
const IcFilePdf = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.4"/>
    <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.4" fill="none"/>
    <text x="12" y="17" textAnchor="middle" fontSize="5.5" fontWeight="700" fill="currentColor" fontFamily="Inter,sans-serif">PDF</text>
  </svg>
)
const IcFileExcel = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.4"/>
    <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.4" fill="none"/>
    <text x="12" y="17" textAnchor="middle" fontSize="5" fontWeight="700" fill="currentColor" fontFamily="Inter,sans-serif">XLS</text>
  </svg>
)

function DownloadDropdown({ template }) {
  const REPORT_TABLES = template.widgets.filter(w => w.chartId === 'table')
  const [open, setOpen]           = useState(false)
  const [excelWarn, setExcelWarn] = useState(false)
  const [selected, setSelected]   = useState(() => new Set(REPORT_TABLES.map(t => t.id)))
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  const openExcelModal = () => {
    setSelected(new Set(REPORT_TABLES.map(t => t.id)))
    setExcelWarn(true)
  }

  const toggleTable = (id) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const canDownload = selected.size > 0

  return (
    <>
      <div className="comp-dl-wrap" ref={ref}>
        <button className="ds-btn sz-md t-tertiary" onClick={() => setOpen(v => !v)}>
          Download
          <DownloadIcon />
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
            style={{ transition: 'transform 150ms', transform: open ? 'rotate(180deg)' : 'none' }}>
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </button>
        {open && (
          <div className="comp-dl-menu">
            <button className="comp-dl-item" onClick={() => setOpen(false)}>
              <IcFilePdf /> PDF
            </button>
            <button className="comp-dl-item" onClick={() => {
              setOpen(false)
              openExcelModal()
            }}>
              <IcFileExcel /> Excel
            </button>
          </div>
        )}
      </div>

      {excelWarn && (
        <>
          <div className="sfm-overlay" onMouseDown={() => setExcelWarn(false)} />
          <div className="sfm-dialog" onMouseDown={e => e.stopPropagation()}>
            <div className="sfm-header">
              <div className="sfm-icon-wrap">
                <IcFileExcel />
              </div>
              <span className="sfm-title">Download as Excel</span>
              <button className="sfm-close" onClick={() => setExcelWarn(false)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="sfm-body sfm-body--compact">
              <p className="sfm-desc">
                Select the tables you'd like to export as Excel files.
              </p>

              <div className="sfm-table-list">
                {REPORT_TABLES.map(t => (
                  <label key={t.id} className="sfm-checkbox-row">
                    <input
                      type="checkbox"
                      checked={selected.has(t.id)}
                      onChange={() => toggleTable(t.id)}
                    />
                    {t.label}
                  </label>
                ))}
              </div>

              <p className="sfm-note">
                <strong>Note:</strong><br />
                Charts and other visualizations are not available for export.<br />
                Each table will be downloaded as a separate Excel file.
              </p>
            </div>
            <div className="sfm-footer">
              <button className="sfm-cancel" onClick={() => setExcelWarn(false)}>Cancel</button>
              <button className="sfm-create" disabled={!canDownload} onClick={() => {
                setExcelWarn(false)
              }}>Download</button>
            </div>
          </div>
        </>
      )}
    </>
  )
}

const SaveIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
  </svg>
)

// ── Helpers ───────────────────────────────────────────────────────────
function formatDate(d) {
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
}

function groupFilters(chips) {
  const map = new Map()
  chips.forEach(c => {
    if (!map.has(c.key)) map.set(c.key, [])
    map.get(c.key).push(c.value)
  })
  return Array.from(map.entries())
}

// ── Page components ───────────────────────────────────────────────────

const DEFAULT_COVER_DESC = 'This report summarises the software vulnerability landscape for devices within the scope of the defined report criteria. It outlines vulnerability distribution by severity and asset criticality, highlights the most common and highest-risk vulnerabilities, and identifies the most affected operating systems and services. The findings provide a clear view of where vulnerabilities exist and how they are concentrated across the infrastructure.'

function CoverPage({ reportTitle, reportFilters, template }) {
  const today = formatDate(new Date())
  const criteriaGroups = groupFilters(reportFilters)
  const coverImage = template.coverImage || 'assets/reports/executive-summary-cover.svg'
  const coverDesc  = template.coverDescription || DEFAULT_COVER_DESC

  return (
    <div
      className="rv-page rv-page--cover"
      style={{ backgroundImage: `url('${coverImage}')` }}
    >
      {/* Info content overlaid on the SVG's white area */}
      <div className="rv-info-body rv-info-body--on-cover">
        <div className="rv-info-section-icon">
          <img src="assets/reports/template-icon.svg" width={34} height={34} alt="" />
        </div>
        <h2 className="rv-info-title">{reportTitle}</h2>
        <p className="rv-info-desc">{coverDesc}</p>

        <hr className="rv-info-divider rv-info-divider--body" />

        <div className="rv-meta-row">
          <div className="rv-meta-col">
            <div className="rv-info-meta-item">
              <div className="rv-info-meta-label">Created by</div>
              <div className="rv-info-meta-value">{USER_FULL_NAME}</div>
            </div>
          </div>
          <div className="rv-meta-col">
            <div className="rv-info-meta-item" style={{ textAlign: 'right' }}>
              <div className="rv-info-meta-label">Report Generated</div>
              <div className="rv-info-meta-value">{today}</div>
            </div>
          </div>
        </div>

        <div className="rv-criteria-box">
          <div className="rv-criteria-title">Report Criteria</div>
          {criteriaGroups.length === 0 ? (
            <div className="rv-criteria-empty">No filters applied</div>
          ) : (
            criteriaGroups.map(([key, values]) => (
              <div key={key} className="rv-criteria-row">
                <span className="rv-criteria-key">{key}</span>
                <span className="rv-criteria-val">{values.join(', ')}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// ── Save Report modal ─────────────────────────────────────────────────
function SaveReportModal({ reportTitle, onClose, onSaved }) {
  const [name, setName] = useState(reportTitle)
  return (
    <>
      <div className="sfm-overlay" onMouseDown={onClose} />
      <div className="sfm-dialog" onMouseDown={e => e.stopPropagation()}>
        <div className="sfm-header">
          <div className="sfm-icon-wrap">
            <SaveIcon />
          </div>
          <span className="sfm-title">Save Report</span>
          <button className="sfm-close" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div className="sfm-body">
          <p className="sfm-desc">Your report needs to be saved before scheduling.</p>
          <div className="sfm-form-field">
            <label className="sfm-form-label">Report Name</label>
            <input className="sfm-form-input" value={name} onChange={e => setName(e.target.value)} autoFocus />
          </div>
        </div>
        <div className="sfm-footer">
          <button className="sfm-cancel" onClick={onClose}>Cancel</button>
          <button className="sfm-create" onClick={() => onSaved(name.trim())} disabled={!name.trim()}>Save</button>
        </div>
      </div>
    </>
  )
}

// ── Schedule Report modal ─────────────────────────────────────────────
function ScheduleReportModal({ onClose, onConfirm }) {
  const [recipients, setRecipients]   = useState('')
  const [sendCopy, setSendCopy]       = useState(true)
  const [schedType, setSchedType]     = useState('specific')
  const [startDate, setStartDate]     = useState('2026-06-02')
  const [startTime, setStartTime]     = useState('09:00')
  const [repeatNum, setRepeatNum]     = useState(1)
  const [repeatUnit, setRepeatUnit]   = useState('Week(s)')
  const [repeatUntil, setRepeatUntil] = useState('')

  return (
    <>
      <div className="sfm-overlay" onMouseDown={onClose} />
      <div className="sfm-dialog sfm-dialog--lg" onMouseDown={e => e.stopPropagation()}>
        <div className="sfm-header">
          <div className="sfm-icon-wrap">
            <CalendarIcon />
          </div>
          <span className="sfm-title">Schedule Report</span>
          <button className="sfm-close" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="sfm-body sfm-body--compact">
          <div className="sfm-form-field">
            <label className="sfm-form-label">Recipients</label>
            <input className="sfm-form-input" placeholder="To: a@mail.com, b@mail.com" value={recipients} onChange={e => setRecipients(e.target.value)} />
          </div>

          <label className="sfm-checkbox-row">
            <input type="checkbox" checked={sendCopy} onChange={e => setSendCopy(e.target.checked)} />
            Send me a copy
          </label>

          <div className="sfm-section-divider">
            <span className="sfm-section-divider-label">Set Date and Time</span>
            <div className="sfm-section-divider-line" />
          </div>

          <label className="sfm-radio-row">
            <input type="radio" name="schedType" value="specific" checked={schedType === 'specific'} onChange={() => setSchedType('specific')} />
            Schedule the report for a specific time. It will include data from the latest available run.
          </label>
          <label className="sfm-radio-row">
            <input type="radio" name="schedType" value="daily" checked={schedType === 'daily'} onChange={() => setSchedType('daily')} />
            Send an email after each day's run to receive the latest report.
          </label>

          {schedType === 'specific' && (
            <div className="sfm-form-row">
              <div className="sfm-form-field">
                <label className="sfm-form-label">Start Date</label>
                <input type="date" className="sfm-form-input" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div className="sfm-form-field">
                <label className="sfm-form-label">Time</label>
                <input type="time" className="sfm-form-input" value={startTime} onChange={e => setStartTime(e.target.value)} />
              </div>
            </div>
          )}

          {schedType === 'daily' && (
            <div className="sfm-form-field">
              <label className="sfm-form-label">Start Date</label>
              <input type="date" className="sfm-form-input" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
          )}

          <div className="sfm-section-divider">
            <span className="sfm-section-divider-label">Set frequency</span>
            <div className="sfm-section-divider-line" />
          </div>

          <div className="sfm-form-field">
            <label className="sfm-form-label">Repeat every</label>
            <div className="sfm-form-row">
              <div className="sfm-form-field sfm-form-field--xs">
                <input type="number" min="1" className="sfm-form-input" value={repeatNum} onChange={e => setRepeatNum(e.target.value)} />
              </div>
              <div className="sfm-form-field">
                <select className="sfm-form-input" value={repeatUnit} onChange={e => setRepeatUnit(e.target.value)}>
                  {['Day(s)', 'Week(s)', 'Month(s)'].map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="sfm-form-field">
            <label className="sfm-form-label">Repeat until</label>
            <input type="date" className="sfm-form-input" value={repeatUntil} onChange={e => setRepeatUntil(e.target.value)} />
          </div>

          <p className="sfm-next-run">Next report will be on <strong>Friday, Aug 15, 2025, 9:00 AM</strong></p>
          <p className="sfm-utc-note">* Please note that all time details shown are in Coordinated Universal Time (UTC).</p>
        </div>

        <div className="sfm-footer">
          <button className="sfm-cancel" onClick={onClose}>Cancel</button>
          <button className="sfm-create" onClick={onConfirm}>Schedule</button>
        </div>
      </div>
    </>
  )
}

// ── Share Report modal ────────────────────────────────────────────────
function ShareReportModal({ reportTitle, onClose, onConfirm }) {
  const [recipients, setRecipients] = useState('')
  const [sendCopy, setSendCopy]     = useState(true)
  const defaultMessage = `Hi,\n\nI'm sharing "${reportTitle}" with you. Please find the report attached/linked below.\n\nBest regards`
  const [message, setMessage]       = useState(defaultMessage)

  return (
    <>
      <div className="sfm-overlay" onMouseDown={onClose} />
      <div className="sfm-dialog sfm-dialog--lg" onMouseDown={e => e.stopPropagation()}>
        <div className="sfm-header">
          <div className="sfm-icon-wrap">
            <ShareIcon />
          </div>
          <span className="sfm-title">Share Report</span>
          <button className="sfm-close" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="sfm-body sfm-body--compact">
          <div className="sfm-form-field">
            <label className="sfm-form-label">Recipients</label>
            <input
              className="sfm-form-input"
              placeholder="To: Name, group or email"
              value={recipients}
              onChange={e => setRecipients(e.target.value)}
            />
          </div>
          <div className="sfm-form-field">
            <label className="sfm-form-label">Message</label>
            <textarea
              className="sfm-textarea-field"
              rows={6}
              value={message}
              onChange={e => setMessage(e.target.value)}
            />
          </div>
          <label className="sfm-checkbox-row">
            <input type="checkbox" checked={sendCopy} onChange={e => setSendCopy(e.target.checked)} />
            Send me a copy
          </label>
          <p className="sfm-info-note">Report will be shared via link and attachment in email.</p>
        </div>

        <div className="sfm-footer sfm-footer--split">
          <button className="sfm-copy-link-btn">
            Copy link
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="sfm-cancel" onClick={onClose}>Cancel</button>
            <button className="sfm-create" onClick={onConfirm}>Share</button>
          </div>
        </div>
      </div>
    </>
  )
}

// ── Widget pagination ─────────────────────────────────────────────────
const HEIGHTS = { '2xsmall': 120, xsmall: 160, small: 260, medium: 360, large: 460, xlarge: 560, 'rpt-chart': 500, 'rpt-pie': 480 }
const PAGE_BODY_H = 1216 - 48  // page height minus top+bottom padding
const ROW_GAP = 12

function buildWidgetRows(widgets) {
  const rows = []
  let kpiBuf = []
  for (const w of widgets) {
    if (w.chartId === 'kpi') {
      if (w.rowBreak && kpiBuf.length) {
        rows.push({ type: 'kpi', widgets: kpiBuf, h: HEIGHTS.xsmall })
        kpiBuf = []
      }
      kpiBuf.push(w)
    } else {
      if (kpiBuf.length) { rows.push({ type: 'kpi', widgets: kpiBuf, h: HEIGHTS.xsmall }); kpiBuf = [] }
      rows.push({ type: 'chart', widget: w, h: HEIGHTS[w.heightId] || 260 })
    }
  }
  if (kpiBuf.length) rows.push({ type: 'kpi', widgets: kpiBuf, h: HEIGHTS.xsmall })
  return rows
}

function paginateRows(rows) {
  const pages = []
  let page = [], used = 0
  for (const row of rows) {
    const needed = row.h + (page.length > 0 ? ROW_GAP : 0)
    if (used + needed > PAGE_BODY_H && page.length > 0) {
      pages.push(page); page = [row]; used = row.h
    } else {
      page.push(row); used += needed
    }
  }
  if (page.length) pages.push(page)
  return pages
}

function WidgetRow({ row }) {
  if (row.type === 'kpi') {
    return (
      <div className="dc-report-kpi-row">
        {row.widgets.map(w => (
          <div key={w.id} className="dc-report-kpi-item">
            <WidgetCard widget={w} isEditing={false} onEdit={() => {}} onRequestDelete={() => {}} reportMode printMode />
          </div>
        ))}
      </div>
    )
  }
  const isTable = row.widget.chartId === 'table'
  return (
    <div className={`dc-report-chart-row${isTable ? ' dc-report-chart-row--table' : ''}`}>
      <WidgetCard
        widget={row.widget}
        isEditing={false}
        onEdit={() => {}}
        onRequestDelete={() => {}}
        reportMode
        printMode
      />
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────
export default function ReportPreviewPage({ reportTitle, reportFilters = [], onBack, template = EXEC_SUMMARY_TEMPLATE }) {
  const { onNav, addSavedReport } = useWorkspace()
  const widgets = template.widgets
  const widgetPages = paginateRows(buildWidgetRows(widgets))
  const [isSaved, setIsSaved]             = useState(false)
  const [savedName, setSavedName]         = useState(reportTitle)
  const [saveOpen, setSaveOpen]           = useState(false)
  const [pendingAction, setPendingAction] = useState(null)
  const [scheduleOpen, setScheduleOpen]   = useState(false)
  const [shareOpen, setShareOpen]         = useState(false)

  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })

  const navigateToSaved = (name, status) => {
    addSavedReport({
      id: `r-${Date.now()}`, name, isNew: true,
      type: 'REPORT', template: template.name,
      visibility: 'Private', status,
      lastUpdated: today,
      ...(status === 'Scheduled' ? { hasCalendar: true, recipients: 0 } : {}),
    })
    onNav('workspace/saved')
  }

  const openAfterSave = (action) => {
    if (!isSaved) { setPendingAction(action); setSaveOpen(true) }
    else if (action === 'schedule') setScheduleOpen(true)
    else if (action === 'share') setShareOpen(true)
    else navigateToSaved(savedName, 'Saved')
  }

  const handleSaved = (name) => {
    setSavedName(name); setIsSaved(true); setSaveOpen(false)
    if (pendingAction === 'schedule') setScheduleOpen(true)
    else if (pendingAction === 'share') setShareOpen(true)
    else navigateToSaved(name, 'Saved')
    setPendingAction(null)
  }

  const handleScheduleConfirm = () => { setScheduleOpen(false); navigateToSaved(savedName, 'Scheduled') }
  const handleShareConfirm    = () => { setShareOpen(false);    navigateToSaved(savedName, 'Saved') }

  return (
    <div
      className="dc-root"
      style={{ '--dc-bg-app': PAI.bgApp, '--dc-indigo': PAI.indigo, '--dc-indigo-tint': PAI.indigoTint, '--dc-fg1': PAI.fg1, '--dc-fg3': PAI.fg3 }}
    >
      <div className="dc-layout">
        <div className="dc-canvas-wrap">

          {/* Toolbar */}
          <div className="dc-toolbar">
            <button className="dc-toolbar-back-btn" onClick={onBack}>
              <Ic size={13} path={<polyline points="15 18 9 12 15 6"/>} />
            </button>
            <input readOnly value={reportTitle} className="dc-toolbar-name-input" style={{ cursor: 'default' }} />
            <div className="dc-toolbar-spacer" />
            <button className="ds-btn sz-md t-tertiary" onClick={() => openAfterSave('schedule')}>Schedule <CalendarIcon /></button>
            <button className="ds-btn sz-md t-tertiary" onClick={() => openAfterSave('share')}>Share <ShareIcon /></button>
            <DownloadDropdown template={template} />
            <div className="dc-toolbar-divider" />
            <button className="ds-btn sz-md t-secondary" onClick={onBack}>Edit <EditIcon /></button>
            <button className="ds-btn sz-md t-primary" onClick={() => openAfterSave('save')}>Save <SaveIcon /></button>
          </div>

          {/* Pages viewer */}
          <div className="rv-viewer">
            <CoverPage reportTitle={reportTitle} reportFilters={reportFilters} template={template} />
            {widgetPages.map((rows, i) => (
              <div key={i} className="rv-page rv-page--charts">
                {rows.map((row, j) => <WidgetRow key={j} row={row} />)}
              </div>
            ))}
          </div>

        </div>
      </div>

      {saveOpen     && <SaveReportModal reportTitle={reportTitle} onClose={() => setSaveOpen(false)} onSaved={handleSaved} />}
      {scheduleOpen && <ScheduleReportModal onClose={() => setScheduleOpen(false)} onConfirm={handleScheduleConfirm} />}
      {shareOpen    && <ShareReportModal reportTitle={reportTitle} onClose={() => setShareOpen(false)} onConfirm={handleShareConfirm} />}
    </div>
  )
}
