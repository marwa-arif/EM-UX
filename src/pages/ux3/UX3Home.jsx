import React, { useState } from 'react'

const TABS = ['Overview', 'Assets', 'Findings', 'Insights']

const STAT_CARDS = [
  {
    icon: 'alert', label: 'Critical Findings', sub: 'In last 7 days', value: '128', delta: '8%', trend: 'down-good',
    bars: [30, 38, 34, 44, 40, 52, 48, 58, 54, 64, 60, 100], navId: 'exposure/findings',
  },
]

// Exposure Score is an existing product metric scored out of 1000 (see
// AssetDetailDrawer/FindingsPage's ExposureFactorGaugeRing, denom={1000}) —
// 912 mirrors the org-wide figure NavigatorPanel already shows for
// 'exposure/overview', so Home's gauge agrees with the rest of the app
// instead of inventing its own 0–100 scale.
const EXPOSURE_SCORE = {
  score: 912, max: 1000, tier: 'Critical', tierClass: 'danger',
  delta: '24 pts', deltaSub: 'vs last week', navId: 'exposure/overview',
}
const GAUGE_ZONES = [
  { from: 0,   to: 400,  color: 'var(--home-green)' },
  { from: 400, to: 750,  color: 'var(--home-orange)' },
  { from: 750, to: 1000, color: 'var(--home-red)' },
]

// Studio now shares this Home surface, so the widgets next to the score
// mirror real Studio signals (connector health / sync status) rather than
// exposure "most improved" trends — see StudioHomePage's CONNECTIONS data.
const STUDIO_WIDGETS = [
  { kind: 'up', title: 'Connector Health', desc: 'Studio connectors syncing cleanly across workspaces',
    path: 'M0,50 C 30,48 50,45 70,38 C 100,30 130,32 160,24 C 190,18 220,20 250,10 C 280,4 310,6 340,2',
    navId: 'studio/workspace/device' },
  { kind: 'down', title: 'Sync Needs Attention', desc: 'ServiceNow — BUPA: auth expired, reconnect required',
    status: 'Error', statusClass: 'danger', lastAttempt: '6h ago',
    cta: 'Fix', navId: 'studio/pipeline/device' },
]

const FINDING_ROWS = [
  { name: 'S3 bucket public read',     desc: 'Publicly readable storage bucket exposes customer records', assets: 12,  cves: 1, sev: 'Critical', sevClass: 'critical', updated: 'Mar 18, 2026', status: 'Open',        statusClass: 'danger'  },
  { name: 'Stale admin credential',    desc: 'Admin account inactive 90+ days without offboarding',        assets: 3,   cves: 0, sev: 'High',     sevClass: 'high',     updated: 'Mar 21, 2026', status: 'In Progress', statusClass: 'warning' },
  { name: 'Unpatched OpenSSL CVE',     desc: 'Known-exploited vulnerability on internet-facing host',      assets: 8,   cves: 4, sev: 'High',     sevClass: 'high',     updated: 'Mar 25, 2026', status: 'Scheduled',  statusClass: 'info'    },
  { name: 'Excessive IAM permissions', desc: 'Service role holds unused wildcard write access',            assets: 21,  cves: 0, sev: 'Medium',   sevClass: 'medium',   updated: 'Mar 27, 2026', status: 'Completed',  statusClass: 'success' },
  { name: 'MFA not enforced',          desc: 'Break-glass account excluded from conditional access',       assets: 1,   cves: 0, sev: 'Low',      sevClass: 'low',      updated: 'Mar 28, 2026', status: 'Completed',  statusClass: 'success' },
]

const NAV_PROMPTS = [
  'Analyze my lowest-scoring asset',
  'Find hot CVEs',
  'Suggest next scan',
  'Write a remediation summary for the CISO',
]

const IcSort = () => (
  <svg width="9" height="11" viewBox="0 0 10 12" fill="none" className="ux3-home__sort">
    <path d="M5 0 8 4H2Z" fill="currentColor" opacity="0.9"/>
    <path d="M5 12 2 8h6Z" fill="currentColor" opacity="0.35"/>
  </svg>
)
const IcCalendar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 9h18M8 3v4M16 3v4"/>
  </svg>
)
const IcArrowUp = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 19V5M5 12l7-7 7 7"/>
  </svg>
)
const IcArrowDown = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12l7 7 7-7"/>
  </svg>
)
const IcExpand = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 17 17 7M9 7h8v8"/>
  </svg>
)
const IcSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>
  </svg>
)
const IcExport = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 15V3M7 8l5-5 5 5M4 17v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>
  </svg>
)
const IcFilter = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 6h16M7 12h10M10 18h4"/>
  </svg>
)
const IcKebab = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="12" cy="19" r="1.7"/></svg>
)
const IcMic = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v4"/>
  </svg>
)
const IcSparkle = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8Z" fill="#fff"/>
  </svg>
)
const IcMinus = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14"/></svg>
)
const IcChevronRight = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 6 6 6-6 6"/>
  </svg>
)
const IcShield = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
)
const IcAlertTriangle = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)
const STAT_ICONS = { shield: IcShield, alert: IcAlertTriangle }

function BarChart({ bars, note }) {
  return (
    <div className="ux3-home__bars">
      {note && <span className="ux3-home__bars-note">{note}</span>}
      {bars.map((h, i) => {
        const last = i === bars.length - 1
        return (
          <div key={i} className="ux3-home__bar-col">
            <div className={`ux3-home__bar${last ? ' ux3-home__bar--last' : ''}`} style={{ height: `${h}%` }} />
            {last && <span className="ux3-home__bar-dot" />}
          </div>
        )
      })}
    </div>
  )
}

function TrendArea({ path, kind }) {
  const gid = `ux3-home-grad-${kind}`
  return (
    <svg className={`ux3-home__trend-area ux3-home__trend-area--${kind}`} viewBox="0 0 340 56" preserveAspectRatio="none">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.28" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L340,56 L0,56 Z`} fill={`url(#${gid})`} stroke="none" />
      <path d={path} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

// Semicircle speedometer: angleDeg runs 0 (left) → 180 (right) over the top,
// matching SVG's y-down positive-angle (clockwise) sweep convention.
function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = (angleDeg - 180) * Math.PI / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}
function describeArc(cx, cy, r, startPct, endPct) {
  const start = polarToCartesian(cx, cy, r, startPct * 180)
  const end = polarToCartesian(cx, cy, r, endPct * 180)
  return `M ${start.x} ${start.y} A ${r} ${r} 0 0 1 ${end.x} ${end.y}`
}

// Tapered dart instead of a bare stroked line — a plain line reads as a
// stray mark, not a pointer; the wide-to-narrow shape is what makes a
// speedometer needle legible at a glance.
function needlePoints(cx, cy, angleDeg, tipR, baseR, baseW) {
  const tip = polarToCartesian(cx, cy, tipR, angleDeg)
  const base = polarToCartesian(cx, cy, baseR, angleDeg)
  const left = polarToCartesian(base.x, base.y, baseW, angleDeg + 90)
  const right = polarToCartesian(base.x, base.y, baseW, angleDeg - 90)
  return `${tip.x},${tip.y} ${left.x},${left.y} ${right.x},${right.y}`
}

function ExposureGauge({ data, onActivate }) {
  const pct = data.score / data.max
  const needleAngle = pct * 180
  return (
    <div
      className="ux3-home__gauge-card"
      role="button"
      tabIndex={0}
      onClick={onActivate}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onActivate() } }}
    >
      <div className="ux3-home__stat-hdr">
        <span className="ux3-home__stat-icon"><IcShield /></span>
        <span className="ux3-home__stat-label">Exposure Score</span>
        <span className="ux3-home__stat-cal"><IcExpand /></span>
      </div>
      <div className="ux3-home__stat-sub">Across all monitored assets</div>
      <svg className="ux3-home__gauge" viewBox="0 0 200 112">
        {GAUGE_ZONES.map(z => (
          <path key={z.color} d={describeArc(100, 100, 80, z.from / data.max, z.to / data.max)}
            stroke={z.color} strokeWidth="14" fill="none" />
        ))}
        <polygon points={needlePoints(100, 100, needleAngle, 66, 12, 5)} fill="var(--home-navy)" />
        <circle cx="100" cy="100" r="8" fill="var(--home-navy)" />
      </svg>
      <div className="ux3-home__gauge-readout">
        <span className="ux3-home__gauge-score">{data.score}</span>
        <span className="ux3-home__gauge-max">/{data.max}</span>
      </div>
      <div className="ux3-home__gauge-foot">
        <span className={`ux3-home__pill ${data.tierClass}`}>{data.tier}</span>
        <span className="ux3-home__stat-delta down-good"><IcArrowDown /> {data.delta} <span className="ux3-home__gauge-foot-sub">{data.deltaSub}</span></span>
      </div>
    </div>
  )
}

function UX3Home({ onNav }) {
  const [tab, setTab] = useState('Overview')
  const goToNavigator = () => onNav?.('navigator-page')

  return (
    <div className="ux3-home">
      <div className="ux3-home__tabs">
        {TABS.map(t => (
          <button key={t} className={`ux3-home__tab${tab === t ? ' ux3-home__tab--active' : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      <div className="ux3-home__top">
        <div className="ux3-home__hero">
          <div className="ux3-home__hero-greeting">Hello Joe</div>
          <div className="ux3-home__hero-title">
            Explore your<br />exposure landscape
          </div>
          <button className="ux3-home__hero-cta">+ Get Started</button>
        </div>

        {STAT_CARDS.map(card => (
          <div
            className="ux3-home__stat-card ux3-home__stat-card--clickable"
            key={card.label}
            role="button"
            tabIndex={0}
            onClick={() => onNav?.(card.navId)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNav?.(card.navId) } }}
          >
            <div className="ux3-home__stat-hdr">
              <span className="ux3-home__stat-icon">{React.createElement(STAT_ICONS[card.icon])}</span>
              <span className="ux3-home__stat-label">{card.label}</span>
              <span className="ux3-home__stat-cal"><IcCalendar /></span>
            </div>
            <div className="ux3-home__stat-sub">{card.sub}</div>
            <div className="ux3-home__stat-value-row">
              <span className="ux3-home__stat-value">{card.value}</span>
              <span className={`ux3-home__stat-delta ${card.trend}`}>
                {card.trend.startsWith('up') ? <IcArrowUp /> : <IcArrowDown />} {card.delta}
              </span>
            </div>
            <BarChart bars={card.bars} note={card.note} />
          </div>
        ))}

        <ExposureGauge data={EXPOSURE_SCORE} onActivate={() => onNav?.(EXPOSURE_SCORE.navId)} />

        <div className="ux3-home__perf-card">
          {STUDIO_WIDGETS.map(p => (
            <div
              className={`ux3-home__perf-row ux3-home__perf-row--${p.kind} ux3-home__perf-row--clickable`}
              key={p.title}
              role="button"
              tabIndex={0}
              onClick={() => onNav?.(p.navId)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNav?.(p.navId) } }}
            >
              <div className="ux3-home__perf-hdr">
                <span className={`ux3-home__perf-icon ux3-home__perf-icon--${p.kind}`}>
                  {p.kind === 'up' ? <IcArrowUp /> : <IcArrowDown />}
                </span>
                <span className="ux3-home__perf-title">{p.title}</span>
                <button className="ux3-home__perf-expand" onClick={(e) => { e.stopPropagation(); onNav?.(p.navId) }}><IcExpand /></button>
              </div>
              <div className="ux3-home__perf-desc">{p.desc}</div>
              {p.cta ? (
                <div className="ux3-home__perf-cta-row">
                  <span className={`ux3-home__pill ${p.statusClass}`}>{p.status}</span>
                  <span className="ux3-home__perf-cta-time">Last attempt {p.lastAttempt}</span>
                  <button className="ux3-home__perf-cta" onClick={(e) => { e.stopPropagation(); onNav?.(p.navId) }}>
                    {p.cta} <IcChevronRight />
                  </button>
                </div>
              ) : (
                <TrendArea path={p.path} kind={p.kind} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="ux3-home__toolbar">
        <div className="ux3-home__table-heading">Recent Findings</div>
        <div className="ux3-home__toolbar-right">
          <div className="ux3-home__hero-search">
            <IcSearch />
            <span>Search findings...</span>
          </div>
          <button className="ux3-home__ghost-btn"><IcExport /> Export</button>
          <button className="ux3-home__ghost-btn"><IcFilter /> Filters</button>
        </div>
      </div>

      <div className="ux3-home__table-wrap">
        <table className="ux3-home__table">
          <thead>
            <tr>
              <th className="ux3-home__th-check"><input type="checkbox" className="ux3-home__row-check" /></th>
              <th>Name</th>
              <th>Description</th>
              <th>Assets <IcSort /></th>
              <th>CVEs <IcSort /></th>
              <th>Severity</th>
              <th>Updated <IcSort /></th>
              <th>Status</th>
              <th className="ux3-home__th-kebab" />
            </tr>
          </thead>
          <tbody>
            {FINDING_ROWS.map(row => (
              <tr key={row.name}>
                <td className="ux3-home__th-check"><input type="checkbox" className="ux3-home__row-check" /></td>
                <td className="ux3-home__td-name">{row.name}</td>
                <td className="ux3-home__td-desc">{row.desc}</td>
                <td>{row.assets}</td>
                <td>{row.cves}</td>
                <td><span className={`ux3-home__pill ${row.sevClass}`}>{row.sev}</span></td>
                <td>{row.updated}</td>
                <td><span className={`ux3-home__pill ${row.statusClass}`}>{row.status}</span></td>
                <td className="ux3-home__th-kebab"><button className="ux3-home__kebab-btn"><IcKebab /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="ux3-home__navigator">
        <div className="ux3-home__navigator-sheen" aria-hidden="true" />
        <div className="ux3-home__navigator-expand">
          <div className="ux3-home__navigator-hdr">
            <span className="ux3-home__navigator-icon"><IcSparkle /></span>
            Navigator
            <button className="ux3-home__navigator-min"><IcMinus /></button>
          </div>
          <div className="ux3-home__navigator-chip-grid">
            {NAV_PROMPTS.map(prompt => (
              <button key={prompt} className="ux3-home__navigator-chip" onClick={goToNavigator}>+ {prompt}</button>
            ))}
          </div>
        </div>
        <button className="ux3-home__navigator-inputbar" onClick={goToNavigator}>
          <span>Ask anything or search...</span>
          <span className="ux3-home__navigator-mic"><IcMic /></span>
        </button>
      </div>
    </div>
  )
}

export default UX3Home
