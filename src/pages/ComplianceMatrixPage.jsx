import React, { useState, useRef, useEffect } from 'react'
import { SegmentedTabs } from './PageKG.jsx'
import '../styles/compliance.css'

// ── Helpers ───────────────────────────────────────────────────────
function scoreToVisual(score, changeMode, prevScore) {
  if (changeMode && prevScore !== undefined) {
    const delta = score === null || prevScore === null ? null : score - prevScore
    return { delta, isNull: delta === null }
  }
  return { score, isNull: score === null }
}

function scoreTextColor(score) {
  if (score === null || score === undefined) return 'var(--shell-text-muted)'
  if (score === 100) return '#1A7D4D'
  if (score >= 85)   return 'var(--pai-green)'
  if (score >= 50)   return 'var(--pai-med-fg)'
  return 'var(--pai-crit-fg)'
}

function cellStyle(score) {
  if (score === null || score === undefined) {
    return { background: 'var(--shell-raised)', color: 'var(--shell-text-muted)', '--hover-border': '#A3A5AF' }
  }
  if (score === 100) return { background: '#1A7D4D', color: '#fff', '--hover-border': '#5AA17F' }
  if (score >= 85)   return { background: 'rgba(43,160,76,0.14)',  color: 'var(--pai-green)' }
  if (score >= 50)   return { background: 'rgba(245,130,13,0.14)', color: 'var(--pai-med-fg)' }
  return               { background: 'rgba(225,82,82,0.18)', color: 'var(--pai-crit-fg)' }
}

function deltaStyle(delta) {
  if (delta === null || delta === undefined) {
    return { background: 'var(--shell-raised)', color: 'var(--shell-text-muted)' }
  }
  if (delta > 0)  return { background: 'rgba(43,160,76,0.14)',  color: 'var(--pai-green)' }
  if (delta < 0)  return { background: 'rgba(225,82,82,0.18)', color: 'var(--pai-crit-fg)' }
  return           { background: 'rgba(200,200,200,0.18)', color: 'var(--shell-text-muted)' }
}

// ── Toolbar Dropdown (label above, pill button) ───────────────────
function MatrixDropdown({ label, subLabel, value, options, onChange, width = 150 }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  const selected = options.find(o => o.id === value)

  return (
    <div className="comp-matrix-tb-item">
      <span className="comp-matrix-tb-label">
        {label}
        {subLabel && <span className="comp-matrix-tb-label-sub"> {subLabel}</span>}
      </span>
      <div ref={ref} className="comp-matrix-dropdown-wrap">
        <button
          className={`comp-matrix-tb-btn${open ? ' comp-matrix-tb-btn--open' : ''}`}
          style={{ '--comp-matrix-btn-w': `${width}px` }}
          onClick={() => setOpen(o => !o)}
        >
          <span className="comp-matrix-tb-btn-text">{selected?.name ?? value}</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </button>
        {open && (
          <div className="comp-sort-menu comp-matrix-dropdown-menu">
            {options.map(opt => (
              <button
                key={opt.id}
                className={`comp-sort-item${opt.id === value ? ' comp-sort-item--selected' : ''}`}
                onClick={() => { onChange(opt.id); setOpen(false) }}
              >
                {opt.date
                  ? <><span>{opt.date}</span><span className="comp-matrix-opt-sublabel">({opt.sublabel})</span></>
                  : opt.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


// ── Static data ───────────────────────────────────────────────────
const FRAMEWORKS = [
  { id: 'nist_csf',  name: 'NIST CSF v2.0' },
  { id: 'nist_800',  name: 'NIST 800-53 rev5' },
  { id: 'pci_dss',   name: 'PCI DSS v4' },
  { id: 'cmmc_2',    name: 'CMMC 2.0 Level 2' },
  { id: 'cis',       name: 'CIS v9.1' },
  { id: 'iso_27001', name: 'ISO 27001:2022' },
]

const VIEW_LEVELS = [
  { id: 'Function',      name: 'Function' },
  { id: 'Category',      name: 'Category' },
  { id: 'Sub-Category',  name: 'Sub-Category' },
]

const GROUP_BY_OPTS = [
  { id: 'Business Unit', name: 'Business Unit' },
  { id: 'Region',        name: 'Region' },
  { id: 'Entity Type',   name: 'Entity Type' },
  { id: 'Department',    name: 'Department' },
]

const COMPARE_OPTS = [
  { id: 'None',     name: 'None' },
  { id: 'week',     name: '15 Jan 2026 (Last week)',     date: '15 Jan 2026', sublabel: 'Last week' },
  { id: 'month',    name: '23 Dec 2025 (Last month)',    date: '23 Dec 2025', sublabel: 'Last month' },
  { id: '3months',  name: '26 Oct 2025 (Last 3 months)', date: '26 Oct 2025', sublabel: 'Last 3 months' },
  { id: '6months',  name: '31 Jul 2025 (Last 6 months)', date: '31 Jul 2025', sublabel: 'Last 6 months' },
  { id: 'year',     name: '31 Jan 2025 (Last year)',     date: '31 Jan 2025', sublabel: 'Last year' },
]

const COLS_BY_LEVEL = {
  Function: [
    { id: 'DE', label: 'DE', full: 'DE: Detect' },
    { id: 'GV', label: 'GV', full: 'GV: Govern' },
    { id: 'ID', label: 'ID', full: 'ID: Identify' },
    { id: 'PR', label: 'PR', full: 'PR: Protect' },
    { id: 'RS', label: 'RS', full: 'RS: Respond' },
  ],
  Category: [
    { id: 'GV.RR', label: 'GV.RR', full: 'Roles, Responsibilities & Authorities' },
    { id: 'GV.PO', label: 'GV.PO', full: 'Policy' },
    { id: 'ID.AM', label: 'ID.AM', full: 'Asset Management' },
    { id: 'ID.RA', label: 'ID.RA', full: 'Risk Assessment' },
    { id: 'PR.AA', label: 'PR.AA', full: 'Identity & Access Control' },
    { id: 'PR.AT', label: 'PR.AT', full: 'Awareness & Training' },
    { id: 'PR.DS', label: 'PR.DS', full: 'Data Security' },
    { id: 'DE.AE', label: 'DE.AE', full: 'Adverse Event Analysis' },
    { id: 'DE.CM', label: 'DE.CM', full: 'Continuous Monitoring' },
    { id: 'RS.CO', label: 'RS.CO', full: 'Incident Response Communication' },
    { id: 'RS.MA', label: 'RS.MA', full: 'Incident Management' },
  ],
  'Sub-Category': [
    { id: 'GV.RR-02', label: 'GV.RR-02', full: 'Roles, responsibilities, and authorities for cybersecurity risk management' },
    { id: 'GV.PO-01', label: 'GV.PO-01', full: 'Policy for managing cybersecurity risks is established' },
    { id: 'ID.AM-01', label: 'ID.AM-01', full: 'Inventories of hardware managed by the organization are maintained' },
    { id: 'ID.AM-02', label: 'ID.AM-02', full: 'Inventories of software and services are maintained' },
    { id: 'ID.AM-07', label: 'ID.AM-07', full: 'Inventories of data and metadata are maintained' },
    { id: 'ID.RA-01', label: 'ID.RA-01', full: 'Vulnerabilities in assets are identified, validated, and recorded' },
    { id: 'PR.AA-01', label: 'PR.AA-01', full: 'Identities and credentials for authorized users are managed' },
    { id: 'PR.AA-05', label: 'PR.AA-05', full: 'Access permissions and authorizations are managed' },
    { id: 'PR.DS-01', label: 'PR.DS-01', full: 'The confidentiality, integrity, and availability of data-at-rest are protected' },
    { id: 'DE.AE-01', label: 'DE.AE-01', full: 'A baseline of network operations and expected data flows is established' },
    { id: 'DE.CM-04', label: 'DE.CM-04', full: 'Malicious code is detected' },
    { id: 'DE.CM-09', label: 'DE.CM-09', full: 'Computing hardware and software are monitored' },
    { id: 'RS.CO-02', label: 'RS.CO-02', full: 'Incidents are reported consistent with established criteria' },
    { id: 'RS.MA-01', label: 'RS.MA-01', full: 'Incident response activities are coordinated with internal and external stakeholders' },
  ],
}

// Scores per (level, group) combination
// For Function × Business Unit: matches screenshot
const FN_BU_CURRENT = [
  { id: 'zone_b_wk',  label: 'Zone B Workstation',    scores: { DE: 47,   GV: 90,  ID: 82,   PR: 99,  RS: null } },
  { id: 'zone_b_om',  label: 'Zone B Omega Server',    scores: { DE: 46,   GV: 89,  ID: 82,   PR: 99,  RS: null } },
  { id: 'zone_a_wk',  label: 'Zone A Workstation',     scores: { DE: 47,   GV: 89,  ID: 82,   PR: 99,  RS: null } },
  { id: 'zone_a_sv',  label: 'Zone A Server',           scores: { DE: 55,   GV: 0,   ID: 85,   PR: 99,  RS: null } },
  { id: 'zone_a_pr',  label: 'Zone A Protect',          scores: { DE: 47,   GV: 90,  ID: 82,   PR: 99,  RS: null } },
  { id: 'shared',     label: 'Shared Unity',             scores: { DE: 25,   GV: 40,  ID: 35,   PR: 98,  RS: null } },
  { id: 'sales',      label: 'Sales & Marketing',        scores: { DE: 100,  GV: 100, ID: null, PR: 66,  RS: null } },
  { id: 'research',   label: 'Research & Development',   scores: { DE: null, GV: 100, ID: null, PR: 66,  RS: null } },
  { id: 'project',    label: 'Project Management',       scores: { DE: 99,   GV: 99,  ID: null, PR: 66,  RS: null } },
  { id: 'prod_ser',   label: 'Production Services',      scores: { DE: 54,   GV: 0,   ID: 85,   PR: 99,  RS: null } },
  { id: 'prod_mg',    label: 'Product Management',       scores: { DE: 99,   GV: 99,  ID: null, PR: 66,  RS: null } },
]

const FN_BU_PREV = FN_BU_CURRENT.map(r => ({
  ...r,
  scores: Object.fromEntries(
    Object.entries(r.scores).map(([k, v]) => [k, v === null ? null : Math.max(0, v - Math.floor(2 + ((r.id.charCodeAt(0) * 17 + k.charCodeAt(0) * 7) % 8)))])
  )
}))

// Category × Business Unit
function genCatBuRows(colIds) {
  return FN_BU_CURRENT.map(row => ({
    ...row,
    scores: Object.fromEntries(colIds.map((id, ci) => {
      const seed = (row.id.charCodeAt(0) * 13 + ci * 7) % 100
      const base = seed > 70 ? null : seed > 60 ? 100 : 30 + seed
      return [id, base]
    }))
  }))
}

// Region rows
const REGION_FN = [
  { id: 'na',    label: 'North America',   scores: { DE: 72, GV: 88, ID: 79, PR: 95, RS: 61 } },
  { id: 'emea',  label: 'EMEA',            scores: { DE: 58, GV: 82, ID: 71, PR: 91, RS: null } },
  { id: 'apac',  label: 'APAC',            scores: { DE: 44, GV: 76, ID: 65, PR: 88, RS: null } },
  { id: 'latam', label: 'Latin America',   scores: { DE: 35, GV: 68, ID: null, PR: 82, RS: null } },
  { id: 'me',    label: 'Middle East',     scores: { DE: 61, GV: 85, ID: 74, PR: 93, RS: null } },
]

const ENTITY_FN = [
  { id: 'cloud',    label: 'Cloud Account',  scores: { DE: 61, GV: 85, ID: 77, PR: 97, RS: null } },
  { id: 'device',   label: 'Host / Device',  scores: { DE: 48, GV: 78, ID: 72, PR: 93, RS: null } },
  { id: 'identity', label: 'Identity',        scores: { DE: null, GV: 91, ID: 84, PR: 99, RS: null } },
  { id: 'storage',  label: 'Storage',         scores: { DE: 52, GV: 72, ID: null, PR: 88, RS: null } },
]

const DEPT_FN = [
  { id: 'it',   label: 'IT Operations',   scores: { DE: 68, GV: 92, ID: 81, PR: 98, RS: 55 } },
  { id: 'sec',  label: 'Security',         scores: { DE: 89, GV: 95, ID: 90, PR: 99, RS: 72 } },
  { id: 'fin',  label: 'Finance',          scores: { DE: 41, GV: 74, ID: null, PR: 85, RS: null } },
  { id: 'hr',   label: 'Human Resources',  scores: { DE: 33, GV: 67, ID: null, PR: 78, RS: null } },
  { id: 'eng',  label: 'Engineering',      scores: { DE: 55, GV: 83, ID: 76, PR: 94, RS: null } },
  { id: 'ops',  label: 'Operations',       scores: { DE: 47, GV: 79, ID: 68, PR: 92, RS: null } },
]

function getRows(level, groupBy) {
  const cols = COLS_BY_LEVEL[level] ?? COLS_BY_LEVEL.Function
  const colIds = cols.map(c => c.id)

  if (level !== 'Function') {
    const baseRows = groupBy === 'Business Unit' ? FN_BU_CURRENT
      : groupBy === 'Region' ? REGION_FN
      : groupBy === 'Entity Type' ? ENTITY_FN
      : DEPT_FN
    return genCatBuRows(colIds).slice(0, baseRows.length).map((r, i) => ({
      ...r, label: baseRows[i]?.label ?? r.label,
    }))
  }

  if (groupBy === 'Business Unit') return FN_BU_CURRENT
  if (groupBy === 'Region')        return REGION_FN
  if (groupBy === 'Entity Type')   return ENTITY_FN
  return DEPT_FN
}

function getPrevRows(level, groupBy) {
  if (level !== 'Function' || groupBy !== 'Business Unit') return null
  return FN_BU_PREV
}

// ── Tooltip ───────────────────────────────────────────────────────
function CellTooltip({ row, col, score, prevScore, delta, canCompare, x, y }) {
  const scoreColor = scoreTextColor(score)

  const deltaColor = delta == null ? 'var(--shell-text-muted)'
    : delta > 0 ? 'var(--pai-green)'
    : delta < 0 ? 'var(--pai-crit-fg)'
    : 'var(--shell-text-muted)'

  const assessments  = score === null ? 0 : 8 + (score % 9) + 2
  const openFindings = score === null ? 0 : Math.round(score * 290 + 500)

  return (
    <div className="comp-matrix-tooltip" style={{ left: x, top: y, borderColor: scoreTextColor(score) }}>
      <div className="comp-matrix-tt-title">{row}</div>
      <div className="comp-matrix-tt-header">
        <span className="comp-matrix-tt-col">{col}</span>
        <span className="comp-matrix-tt-score" style={{ '--comp-tt-score-color': scoreColor }}>
          {score === null ? '—' : `${parseFloat(Number(score).toFixed(2))}%`}
        </span>
      </div>
      <div className="comp-matrix-tt-row">
        <span>Assessments</span>
        <span className="comp-matrix-tt-val">{score === null ? '—' : assessments}</span>
      </div>
      <div className="comp-matrix-tt-row">
        <span>Failed findings</span>
        <span className="comp-matrix-tt-val">{score === null ? '—' : openFindings.toLocaleString()}</span>
      </div>
      {canCompare && delta !== undefined && (
        <>
          <div className="comp-matrix-tt-divider" />
          <div className="comp-matrix-tt-row">
            <span>Change %</span>
            <span className="comp-matrix-delta-val" style={{ '--comp-delta-color': deltaColor }}>
              {delta !== null && delta !== 0 && (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  {delta > 0
                    ? <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>
                    : <><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></>
                  }
                </svg>
              )}
              {delta === null ? '—' : `${parseFloat(Math.abs(delta).toFixed(2))}%`}
            </span>
          </div>
          <div className="comp-matrix-tt-row">
            <span>Absolute score</span>
            <span className="comp-matrix-abs-score" style={{ '--comp-abs-score-color': scoreColor }}>
              {prevScore === null ? '—' : `${parseFloat(Number(prevScore).toFixed(2))}%`}
            </span>
          </div>
        </>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────
export default function ComplianceMatrixPage({ onCellClick }) {
  const [framework,   setFramework]   = useState('nist_csf')
  const [viewLevel,   setViewLevel]   = useState('Function')
  const [groupBy,     setGroupBy]     = useState('Business Unit')
  const [compareWith, setCompareWith] = useState('None')
  const [displayMode, setDisplayMode] = useState('Absolute score') // 'Change %' | 'Absolute score'
  const [tooltip,     setTooltip]     = useState(null)

  const cols     = COLS_BY_LEVEL[viewLevel] ?? COLS_BY_LEVEL.Function
  const rows     = getRows(viewLevel, groupBy)
  const prevRows = getPrevRows(viewLevel, groupBy)
  const canCompare = compareWith !== 'None' && prevRows !== null

  const handleCellEnter = (e, rowLabel, colFull, score, prevScore) => {
    const delta = canCompare && prevScore !== undefined
      ? (score === null || prevScore === null || prevScore === 0 ? null : (score - prevScore) / prevScore * 100)
      : undefined
    setTooltip({ row: rowLabel, col: colFull, score, prevScore, delta, canCompare, x: e.clientX, y: e.clientY })
  }
  const handleCellMove = e => {
    if (tooltip) setTooltip(t => t ? { ...t, x: e.clientX, y: e.clientY } : null)
  }
  const handleCellLeave = () => setTooltip(null)

  return (
    <div className="comp-matrix-page">
    <div className="comp-matrix-card">

      {/* Toolbar */}
      <div className="comp-matrix-toolbar">

        {/* Left group: Framework | divider | Level | Group by */}
        <div className="comp-matrix-tb-group">
          <MatrixDropdown
            label="Framework"
            value={framework}
            options={FRAMEWORKS}
            onChange={setFramework}
            width={150}
          />
          <div className="comp-matrix-tb-divider" />
          <MatrixDropdown
            label="Level"
            subLabel="(x-axis)"
            value={viewLevel}
            options={VIEW_LEVELS}
            onChange={v => { setViewLevel(v); setDisplayMode('Absolute score') }}
            width={150}
          />
          <MatrixDropdown
            label="Group by"
            subLabel="(y-axis)"
            value={groupBy}
            options={GROUP_BY_OPTS}
            onChange={v => { setGroupBy(v); setDisplayMode('Absolute score') }}
            width={150}
          />
        </div>

        {/* Right group: Compare with | Display segmented control */}
        <div className="comp-matrix-tb-group comp-matrix-tb-group--right">
          <MatrixDropdown
            label="Compare with"
            value={compareWith}
            options={COMPARE_OPTS}
            onChange={v => setCompareWith(v)}
            width={220}
          />
          <div className={`comp-matrix-tb-item${compareWith === 'None' ? ' comp-matrix-tb-item--disabled' : ''}`}>
            <span className="comp-matrix-tb-label">Display</span>
            <SegmentedTabs
              value={displayMode}
              options={['Change %', 'Absolute score']}
              onChange={setDisplayMode}
            />
          </div>
        </div>

      </div>

      {/* Matrix body */}
      <div className="comp-matrix-body">

        {/* Y-axis label */}
        <div className="comp-matrix-y-label">
          <span>{groupBy}</span>
        </div>

        {/* Grid wrapper */}
        <div className="comp-matrix-grid-wrap">
          <div className="comp-matrix-scroll-outer">
          <div className="comp-matrix-scroll-inner">
          <table className="comp-matrix-table">
            <tbody>
              {rows.map((row, ri) => {
                const prevRow = prevRows?.find(r => r.id === row.id)
                return (
                  <tr key={row.id}>
                    <td className="comp-matrix-row-label" title={row.label}>
                      {row.label}
                    </td>
                    {cols.map((col, ci) => {
                      const score    = row.scores[col.id] ?? null
                      const prevScore = prevRow?.scores[col.id] ?? null
                      const delta    = canCompare ? (score === null || prevScore === null || prevScore === 0 ? null : (score - prevScore) / prevScore * 100) : undefined

                      const style = cellStyle(score)
                      const badgeDir = delta == null ? 'neutral' : delta > 0 ? 'green' : delta < 0 ? 'red' : 'neutral'

                      let cellContent
                      if (score === null) {
                        cellContent = '—'
                      } else if (canCompare) {
                        let badgeInner
                        if (displayMode === 'Change %') {
                          badgeInner = delta === null ? '—' : (
                            <span className="comp-matrix-delta-inner">
                              {delta !== 0 && (
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  {delta > 0
                                    ? <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>
                                    : <><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></>
                                  }
                                </svg>
                              )}
                              {Math.round(Math.abs(delta))}%
                            </span>
                          )
                        } else {
                          badgeInner = prevScore === null ? '—' : `${prevScore}%`
                        }
                        cellContent = (
                          <span className="comp-matrix-cell-inner">
                            <span>{score}%</span>
                            <span
                              className={`comp-matrix-badge comp-matrix-badge--${displayMode === 'Change %' ? badgeDir : 'neutral'}`}
                              style={displayMode !== 'Change %' ? { '--comp-badge-color': scoreTextColor(score) } : undefined}
                            >
                              {badgeInner}
                            </span>
                          </span>
                        )
                      } else {
                        cellContent = `${score}%`
                      }

                      return (
                        <td
                          key={col.id}
                          className="comp-matrix-cell"
                          style={{ '--comp-cell-bg': style.background, '--comp-cell-color': style.color, '--hover-border': style['--hover-border'], '--comp-cell-cursor': score !== null ? 'pointer' : 'default', animationDelay: `${(ri + ci) * 28}ms` }}
                          onMouseEnter={e => handleCellEnter(e, row.label, col.full ?? col.label, score, prevScore)}
                          onMouseMove={handleCellMove}
                          onMouseLeave={handleCellLeave}
                          onClick={() => {
                            if (score === null || !onCellClick) return
                            const fw = FRAMEWORKS.find(f => f.id === framework)
                            onCellClick({
                              framework,
                              frameworkName: fw?.name ?? framework,
                              groupBy,
                              row:   row.label,
                              col:   col.full ?? col.label,
                              colId: col.id,
                              score,
                            })
                          }}
                        >
                          {cellContent}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr>
                <td className="comp-matrix-corner" />
                {cols.map(col => (
                  <td key={col.id} className="comp-matrix-col-label">{col.label}</td>
                ))}
              </tr>
            </tfoot>
          </table>
          </div>
          </div>

          {/* X-axis label */}
          <div className="comp-matrix-x-label">{viewLevel}</div>
        </div>
      </div>

      {/* Legend */}
      <div className="comp-matrix-legend">
        {[
          { label: 'Weak',            bg: 'rgba(225,82,82,0.18)',  textColor: 'var(--pai-crit-fg)' },
          { label: 'Moderate',        bg: 'rgba(245,130,13,0.14)', textColor: 'var(--pai-med-fg)' },
          { label: 'Strong',          bg: 'rgba(43,160,76,0.14)',  textColor: 'var(--pai-green)' },
          { label: 'Fully Compliant', bg: '#1A7D4D',               textColor: '#1A7D4D' },
          { label: 'Not in Scope',    bg: 'var(--shell-raised)',   textColor: 'var(--shell-text-muted)' },
        ].map(item => (
          <span key={item.label} className="comp-matrix-legend-item">
            <span className="comp-matrix-legend-swatch" style={{ '--comp-legend-swatch-bg': item.bg, background: 'var(--comp-legend-swatch-bg)' }} />
            <span className="comp-matrix-legend-text" style={{ '--comp-legend-text-color': item.textColor }}>{item.label}</span>
          </span>
        ))}
      </div>

    </div>

      {/* Tooltip */}
      {tooltip && (
        <CellTooltip
          row={tooltip.row}
          col={tooltip.col}
          score={tooltip.score}
          prevScore={tooltip.prevScore}
          delta={tooltip.delta}
          canCompare={tooltip.canCompare}
          x={tooltip.x}
          y={tooltip.y}
        />
      )}
    </div>
  )
}
