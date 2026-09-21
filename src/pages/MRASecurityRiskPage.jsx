import React, { useState } from 'react'
import SegmentedTabs from '../components/SegmentedTabs.jsx'
import '../styles/mra-security-risk.css'

// Same trend-arrow glyphs as ChartRender.jsx's cr-kpi-badge__trend (also
// mirrored in DataQualityOverviewPage.jsx) so every trend indicator in the
// app matches instead of falling back to plain text arrows.
const IcTrendUp = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
    <path d="M2.50586 11.0764L6.10893 7.47334L8.51098 9.87538L13.3151 5.07129" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M11.1223 4.84668H13.5244V7.24873" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const IcTrendDown = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
    <path d="M2.50586 4.84669L6.10893 8.44976L8.51098 6.04771L13.3151 10.8518" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M11.1223 11.0764H13.5244V8.67437" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

// ── MRA risk score — the one formula everything on this page derives from:
// (KEVs affecting an asset population / total assets in that population) * 1000.
// Row scores, table totals, and the headline KPIs are all computed from raw
// KEV/asset counts below rather than hardcoded, so a table's Total row is
// always the true sum of its rows, and the top KPIs always equal those totals.
function riskScore(kevs, assets) {
  return assets > 0 ? Math.round((kevs / assets) * 1000) : 0
}
const sumBy = (rows, key) => rows.reduce((s, r) => s + r[key], 0)

// Score thresholds — the same scale for every Risk Score on the page,
// matching the Risk Threshold legend shown in the widget header (High ≥ 35,
// Medium ≥ 34, Low < 34). A single scale keeps every RAG-colored value
// (headline card, Supported/EOL cards, breakdown table rows) consistent
// with the one legend the page shows.
function ragForTypeScore(score) {
  return score >= 35 ? 'red' : score >= 34 ? 'amber' : 'green'
}

// ── RAG cell helper ───────────────────────────────────────────────────
function RagTd({ value, rag }) {
  const cls = rag ? `ds-td mra-rag--${rag}` : 'ds-td'
  return <td className={cls}>{value}</td>
}

// ── Change % — colored by trend direction (good/bad), not RAG status,
// matching the ds-kpi-delta pattern used across the other dashboards. Every
// metric here is a KEV-density score, so an increase is always the bad
// direction and a decrease is always the good one.
function DeltaBadge({ prev, curr }) {
  if (prev == null || curr == null) {
    return <span className="mra-td-muted">N/A</span>
  }
  if (prev === 0 || curr === prev) {
    return <span className="ds-kpi-delta neutral">-</span>
  }
  const pct = ((curr - prev) / prev) * 100
  const up = pct > 0
  return (
    <span className={`ds-kpi-delta ${up ? 'up-bad' : 'down-good'}`}>
      {up ? <IcTrendUp /> : <IcTrendDown />} {Math.abs(pct).toFixed(1)}%
    </span>
  )
}

function ChangeCell({ prev, curr }) {
  return (
    <td className="ds-td mra-change-cell">
      <DeltaBadge prev={prev} curr={curr} />
    </td>
  )
}

// ── KPI trend row — delta badge + "from last month" suffix. ─────────────
function KpiTrend({ prev, curr }) {
  return (
    <div className="mra-kpi-card-trend">
      <DeltaBadge prev={prev} curr={curr} />
      <span className="mra-kpi-card-trend-suffix">from last month</span>
    </div>
  )
}

// ── Risk Score's own trend block — a plain grey "Previous Risk Score: X"
// caption line (Risk Score's own prior value isn't shown anywhere else on
// the card) sitting below the "Risk Score" label, then the usual change %
// trend row underneath it. ───────────────────────────────────────────────
function PrevRiskScoreLine({ prev, curr }) {
  return (
    <>
      <div className="mra-prev-score-line">Previous Risk Score: {prev}</div>
      <KpiTrend prev={prev} curr={curr} />
    </>
  )
}

// ── Risk threshold legend — what each RAG color means, matching the same
// ragForTypeScore() thresholds the tables below are colored by.
function RagThresholdLegend() {
  return (
    <div className="mra-rag-legend">
      <span className="mra-rag-legend-label">Risk Threshold:</span>
      <span className="mra-rag-chip mra-rag-chip--red"><span className="mra-rag-dot mra-rag-dot--red" />High ≥ 35</span>
      <span className="mra-rag-chip mra-rag-chip--amber"><span className="mra-rag-dot mra-rag-dot--amber" />Medium ≥ 34</span>
      <span className="mra-rag-chip mra-rag-chip--green"><span className="mra-rag-dot mra-rag-dot--green" />Low &lt; 34</span>
    </div>
  )
}

// ── Raw per-type data — the only hand-entered numbers on the page.
// Everything else (row scores, table totals, headline KPIs) is derived from
// these via riskScore()/sumBy() so nothing can drift out of sync.
const SUPPORTED_TYPES = [
  { type: 'Windows Endpoints',                  assets: 850, kevs: 14, kevsPrev: 12 },
  { type: 'Mac OS Endpoints',                   assets: 120, kevs: 1,  kevsPrev: 1 },
  { type: 'Zone 1 Windows Server',              assets: 95,  kevs: 4,  kevsPrev: 3 },
  { type: 'Zone 2 Windows Server',              assets: 80,  kevs: 3,  kevsPrev: 3 },
  { type: 'Zone 1 Linux Server',                assets: 60,  kevs: 2,  kevsPrev: 2 },
  { type: 'Zone 2 Linux Server',                assets: 45,  kevs: 2,  kevsPrev: 1 },
  { type: 'AWS Linux Server',                   assets: 30,  kevs: 1,  kevsPrev: 1 },
  { type: 'Virtualisation Platforms',           assets: 25,  kevs: 1,  kevsPrev: 1 },
  { type: 'Network Devices',                    assets: 29,  kevs: 1,  kevsPrev: 1 },
  { type: 'Appliances, Firmware and All Other', assets: 40,  kevs: 1,  kevsPrev: 1 },
]

const EOL_TYPES = [
  { type: 'Windows Endpoints',     assets: 45, kevs: 3, kevsPrev: 2 },
  { type: 'Zone 1 Windows Server', assets: 28, kevs: 4, kevsPrev: 3 },
  { type: 'Zone 2 Windows Server', assets: 22, kevs: 3, kevsPrev: 3 },
  { type: 'Zone 1 Linux Server',   assets: 18, kevs: 3, kevsPrev: 2 },
  { type: 'Zone 2 Linux Server',   assets: 14, kevs: 2, kevsPrev: 2 },
  { type: 'Network Devices',       assets: 6,  kevs: 1, kevsPrev: 1 },
  { type: 'Solaris',               assets: 8,  kevs: 1, kevsPrev: 1 },
]

// ── Derived totals ──────────────────────────────────────────────────────
const suppAssets = sumBy(SUPPORTED_TYPES, 'assets')
const suppKevs = sumBy(SUPPORTED_TYPES, 'kevs')
const suppKevsPrev = sumBy(SUPPORTED_TYPES, 'kevsPrev')
const suppScore = riskScore(suppKevs, suppAssets)

const eolAssets = sumBy(EOL_TYPES, 'assets')
const eolKevs = sumBy(EOL_TYPES, 'kevs')
const eolKevsPrev = sumBy(EOL_TYPES, 'kevsPrev')
const eolScore = riskScore(eolKevs, eolAssets)

const overallAssets = suppAssets + eolAssets
const overallKevs = suppKevs + eolKevs
const overallKevsPrev = suppKevsPrev + eolKevsPrev
const overallScore = riskScore(overallKevs, overallAssets)
const overallScorePrev = riskScore(overallKevsPrev, overallAssets)

const BREAKDOWNS = {
  'Supported Assets with KEVs': SUPPORTED_TYPES,
  'EOL Assets with KEVs': EOL_TYPES,
}

// ── Breakdown table — per-type rows, plus a Total row that's the true sum
// of them (not a separate hand-entered number). ─────────────────────────
function BreakdownTable({ rows }) {
  const totalAssets = sumBy(rows, 'assets')
  const totalKevs = sumBy(rows, 'kevs')
  const totalKevsPrev = sumBy(rows, 'kevsPrev')
  const totalScore = riskScore(totalKevs, totalAssets)
  const totalScorePrev = riskScore(totalKevsPrev, totalAssets)

  return (
    <div className="ds-table-wrap">
      <table className="ds-table">
        <thead>
          <tr>
            <th className="ds-th">Type</th>
            <th className="ds-th">Total KEVs</th>
            <th className="ds-th">Total Assets</th>
            <th className="ds-th">Current Risk Score</th>
            <th className="ds-th">Previous Month Risk Score</th>
            <th className="ds-th">Change %</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => {
            const score = riskScore(r.kevs, r.assets)
            const scorePrev = riskScore(r.kevsPrev, r.assets)
            return (
              <tr key={r.type}>
                <td className="ds-td">{r.type}</td>
                <td className="ds-td">{r.kevs}</td>
                <td className="ds-td">{r.assets}</td>
                <RagTd value={score} rag={ragForTypeScore(score)} />
                <RagTd value={scorePrev} rag={ragForTypeScore(scorePrev)} />
                <ChangeCell prev={scorePrev} curr={score} />
              </tr>
            )
          })}
          <tr className="mra-total-row">
            <td className="ds-td mra-td-total">Total</td>
            <td className="ds-td mra-td-total">{totalKevs}</td>
            <td className="ds-td mra-td-total">{totalAssets}</td>
            <RagTd value={totalScore} rag={ragForTypeScore(totalScore)} />
            <RagTd value={totalScorePrev} rag={ragForTypeScore(totalScorePrev)} />
            <ChangeCell prev={totalScorePrev} curr={totalScore} />
          </tr>
        </tbody>
      </table>
    </div>
  )
}

export default function MRASecurityRiskPage() {
  const [activeBreakdown, setActiveBreakdown] = useState('Supported Assets with KEVs')

  return (
    <div className="mra-page">

      {/* Headline summary — Risk Score / Total Assets / Total Assets with KEVs
          are the fleet-wide combination of both breakdown tables below, and
          the Supported/EOL row underneath splits that same total in two, so
          every number here traces back to the tables. Each of the 5 stats is
          its own KPI card (mra-kpi-card) rather than dividers inside one
          shared widget, matching the ds-kpi-row pattern used elsewhere in
          the app (CanvasPanel, DataConfigPage). */}
      <div className="mra-summary-section">
        <div className="mra-widget-header mra-widget-header--split">
          <span className="mra-widget-title">Number of CISA KEVs per 1,000 Qualys Assets</span>
          <RagThresholdLegend />
        </div>

        <div className="mra-stat-row">
          <div className="mra-kpi-card">
            <div className={`mra-kpi-card-value mra-rag--${ragForTypeScore(overallScore)}`}>{overallScore}</div>
            <div className="mra-kpi-card-label">Risk Score</div>
            <PrevRiskScoreLine prev={overallScorePrev} curr={overallScore} />
          </div>
          <div className="mra-kpi-card">
            <div className="mra-kpi-card-value">{overallAssets.toLocaleString()}</div>
            <div className="mra-kpi-card-label">Total Assets</div>
          </div>
          <div className="mra-kpi-card">
            <div className="mra-kpi-card-value">{overallKevs}</div>
            <div className="mra-kpi-card-label">Total Assets with KEVs</div>
            <KpiTrend prev={overallKevsPrev} curr={overallKevs} />
          </div>
        </div>

        <div className="mra-stat-row mra-stat-row--split">
          <div className="mra-kpi-card">
            <div className="mra-stat-mini-title">Supported Assets with KEVs</div>
            <div className="mra-breakdown-body">
              <div className="mra-breakdown-primary">
                <span className={`mra-widget-stat-value mra-rag--${ragForTypeScore(suppScore)}`}>{suppScore}</span>
                <span className="mra-widget-stat-label">Risk Score</span>
                <div className="mra-prev-score-line">Previous Risk Score: {riskScore(suppKevsPrev, suppAssets)}</div>
              </div>
              <div className="mra-breakdown-list">
                <div className="mra-breakdown-row">
                  <span className="mra-breakdown-row-label">Total KEVs</span>
                  <span className="mra-breakdown-row-value">{suppKevs}</span>
                </div>
                <div className="mra-breakdown-row">
                  <span className="mra-breakdown-row-label">Total Assets</span>
                  <span className="mra-breakdown-row-value">{suppAssets.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <KpiTrend prev={riskScore(suppKevsPrev, suppAssets)} curr={suppScore} />
          </div>
          <div className="mra-kpi-card">
            <div className="mra-stat-mini-title">EOL Assets with KEVs</div>
            <div className="mra-breakdown-body">
              <div className="mra-breakdown-primary">
                <span className={`mra-widget-stat-value mra-rag--${ragForTypeScore(eolScore)}`}>{eolScore}</span>
                <span className="mra-widget-stat-label">Risk Score</span>
                <div className="mra-prev-score-line">Previous Risk Score: {riskScore(eolKevsPrev, eolAssets)}</div>
              </div>
              <div className="mra-breakdown-list">
                <div className="mra-breakdown-row">
                  <span className="mra-breakdown-row-label">Total KEVs</span>
                  <span className="mra-breakdown-row-value">{eolKevs}</span>
                </div>
                <div className="mra-breakdown-row">
                  <span className="mra-breakdown-row-label">Total Assets</span>
                  <span className="mra-breakdown-row-value">{eolAssets.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <KpiTrend prev={riskScore(eolKevsPrev, eolAssets)} curr={eolScore} />
          </div>
        </div>
      </div>

      {/* Breakdown — one table at a time, switched via tabs instead of two
          side-by-side tables. */}
      <div className="mra-widget">
        <div className="mra-widget-header mra-widget-header--split">
          <span className="mra-widget-title">Breakdown</span>
          <SegmentedTabs
            value={activeBreakdown}
            options={Object.keys(BREAKDOWNS)}
            onChange={setActiveBreakdown}
          />
        </div>
        <BreakdownTable rows={BREAKDOWNS[activeBreakdown]} />
      </div>

    </div>
  )
}
