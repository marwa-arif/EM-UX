import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Ic } from '../ui.jsx'

// ── Static data ───────────────────────────────────────────────────────
const AGENTS = [
  { id: 'a1', name: 'Risk Analyzer',      color: '#E8922A' },
  { id: 'a2', name: 'Compliance Auditor', color: '#E8922A' },
  { id: 'a3', name: 'Threat Hunter',      color: '#E8922A' },
]

const CHAT_HISTORY = [
  { id: 'h1', label: 'High severity findings for host vm-prod-42', time: 'Just now',    active: true  },
  { id: 'h2', label: 'Identities with access to critical storage',  time: '2 hrs ago',  active: false },
  { id: 'h3', label: 'Summary of CVE-2024-11891 exposure',          time: 'Yesterday',  active: false },
  { id: 'h4', label: 'Compliance gaps in AWS environment',          time: '3 days ago', active: false },
]

const CTX_PILLS = [
  { id: 'host',     label: 'Hosts',      count: 842  },
  { id: 'finding',  label: 'Findings',   count: 2140 },
  { id: 'identity', label: 'Identities', count: 513  },
  { id: 'vuln',     label: 'CVEs',       count: 634  },
]

const QUICK_ACTIONS = [
  { label: 'Summarize with Navigator',  desc: 'Get a digest of this dashboard' },
  { label: 'Show critical findings',    desc: 'Filter to severity: critical'   },
  { label: 'Identify exposure trends',  desc: 'Spot patterns over time'        },
  { label: 'Generate risk report',      desc: 'Export a formatted summary'     },
]

const THINKING_STEPS = [
  { text: 'Reading current exposure data',  detail: 'Loading 2,140 findings across dashboard' },
  { text: 'Querying knowledge graph',       detail: 'Found 842 hosts with active findings'    },
  { text: 'Analyzing risk patterns',        detail: 'Identifying top exposure areas…'         },
]

const DEMO_FINDINGS = [
  { name: 'Log4Shell (CVE-2021-44228)',           sev: 'Critical' },
  { name: 'Exposed admin credential in env vars', sev: 'Critical' },
  { name: 'Unrestricted inbound NSG rule',        sev: 'Critical' },
  { name: 'SSH port 22 open to 0.0.0.0/0',       sev: 'High'     },
  { name: 'Outdated kernel (5.4.0-147)',          sev: 'High'     },
]

const DEMO_SOURCES = [
  { num: 1, label: 'Knowledge Graph · host vm-prod-42' },
  { num: 2, label: 'CrowdStrike findings feed'         },
  { num: 3, label: 'Azure Security Center'             },
]

const QUERY_MODES = [
  { id: 'quick',  label: 'Quick',  desc: 'Fast answer from your connected graph' },
  { id: 'deep',   label: 'Deep',   desc: 'Multi-step reasoning across all data'  },
  { id: 'report', label: 'Report', desc: 'Formatted export-ready summary'        },
]

const RESPONSE_TEXT = `vm-prod-42 has 14 open findings, of which 3 are critical severity and 6 are high severity. Critical findings include an unpatched Log4Shell vulnerability, an exposed admin credential in environment variables, and a misconfigured NSG allowing unrestricted inbound traffic.`

// ── Icons ─────────────────────────────────────────────────────────────
const IcSend      = () => <Ic size={14} path={<><path d="m22 2-7 20-4-9-9-4 20-7z"/><path d="M22 2 11 13"/></>} />
const IcPlus      = () => <Ic size={14} path={<><path d="M12 5v14M5 12h14"/></>} />
const IcX         = () => <Ic size={15} path={<><path d="M18 6 6 18M6 6l12 12"/></>} />
const IcArrow     = () => <Ic size={12} path={<><path d="M5 12h14M12 5l7 7-7 7"/></>} />
const IcMenu      = () => <Ic size={16} path={<><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>} />
const IcEdit      = () => <Ic size={14} path={<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>} />
const IcSidebar   = () => <Ic size={14} path={<><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/></>} />
const IcFloat     = () => <Ic size={14} path={<><rect x="5" y="5" width="14" height="14" rx="2"/><path d="M3 9h2M3 12h2M3 15h2"/></>} />
const IcFullscr   = () => <Ic size={14} path={<><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></>} />
const IcDots      = () => <Ic size={15} path={<><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></>} />
const IcRename    = () => <Ic size={14} path={<><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></>} />
const IcTrash     = () => <Ic size={14} path={<><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></>} />
const IcFeedback  = () => <Ic size={14} path={<><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>} />
const IcHelp      = () => <Ic size={14} path={<><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></>} />
const IcCheck     = () => <Ic size={13} path={<><polyline points="20 6 9 17 4 12"/></>} />
const IcClock     = () => <Ic size={13} path={<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>} />
const IcChat      = () => <Ic size={14} path={<><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>} />
const IcAgents    = () => <Ic size={14} path={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>} />
const IcViewAll   = () => <Ic size={13} path={<><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>} />
const IcStar      = () => <Ic size={14} path={<><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></>} />
const IcFile      = () => <Ic size={13} path={<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>} />
const IcGraph     = () => <Ic size={13} path={<><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></>} />
const IcSearch    = () => <Ic size={13} path={<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>} />
const IcThumbUp   = () => <Ic size={13} path={<><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></>} />
const IcThumbDown = () => <Ic size={13} path={<><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/><path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></>} />
const IcCopy      = () => <Ic size={13} path={<><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>} />
const IcRefresh   = () => <Ic size={13} path={<><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></>} />
const IcAlert     = () => <Ic size={14} path={<><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>} />
const IcSource    = () => <Ic size={13} path={<><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></>} />
const IcZap       = () => <Ic size={13} path={<><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>} />
const IcArrowUp   = () => <Ic size={14} path={<><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></>} />

const STEP_ICONS = [IcFile, IcGraph, IcSearch]

const IcSparkle = () => (
  <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
    <path d="M8 1v3M8 12v3M1 8h3M12 8h3M3.5 3.5l2 2M10.5 10.5l2 2M10.5 3.5l-2 2M5.5 10.5l-2 2"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

// ── Agent hexagon icon ────────────────────────────────────────────────
function AgentIcon({ color }) {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <path d="M14 2 L25 8 L25 20 L14 26 L3 20 L3 8 Z" fill={color} opacity="0.15"/>
      <path d="M14 2 L25 8 L25 20 L14 26 L3 20 L3 8 Z" stroke={color} strokeWidth="1.2"/>
      <circle cx="14" cy="14" r="4" fill={color}/>
    </svg>
  )
}

function NavIcon({ size = 18 }) {
  return (
    <span className="np-nav-icon-mask" style={{ '--np-icon-size': `${size}px` }}>
      <img src="assets/icons/Navigator icon.svg" width={size} height={size} alt="" />
    </span>
  )
}

function StepDone() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="np-flex-shrink-0">
      <circle cx="8" cy="8" r="7" stroke="#31A56D" strokeWidth="1.5" opacity="0.35" />
      <path d="M5 8l2 2 4-4" stroke="#31A56D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ── Dropdown (click-outside aware) ────────────────────────────────────
function Dropdown({ children, onClose, className }) {
  const ref = useRef(null)
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])
  return (
    <div ref={ref} className={`np-dropdown${className ? ` ${className}` : ''}`} role="menu">
      {children}
    </div>
  )
}

// ── History overlay ───────────────────────────────────────────────────
function HistoryOverlay({ open, onClose, onNewChat, onSelectChat, firstFocusRef }) {
  const [menuOpenId, setMenuOpenId] = useState(null)

  useEffect(() => {
    if (open && firstFocusRef?.current) firstFocusRef.current.focus()
  }, [open, firstFocusRef])

  return (
    <div
      className={`np-history-overlay${open ? ' open' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Chat history"
    >
      <div className="np-history-inner">
        <div className="np-history-hdr">
          <button className="np-icon-btn" onClick={onClose} aria-label="Close history" ref={firstFocusRef}>
            <IcX />
          </button>
          <button className="np-history-new-btn" onClick={() => { onNewChat(); onClose() }}>
            <IcEdit /> New chat
          </button>
        </div>

        <div className="np-history-section">
          <div className="np-history-section-hdr">
            <span className="np-history-section-title"><IcAgents /> Agents</span>
            <button className="np-history-add-btn" aria-label="Add agent"><IcPlus /></button>
          </div>
          {AGENTS.map(a => (
            <button key={a.id} className="np-history-agent-row">
              <AgentIcon color={a.color} />
              <span className="np-history-agent-name">{a.name}</span>
            </button>
          ))}
          <button className="np-history-viewall"><IcViewAll /> View all agents</button>
        </div>

        <div className="np-history-divider" />

        <div className="np-history-section">
          <div className="np-history-section-hdr">
            <span className="np-history-section-title"><IcClock /> Chats</span>
            <button className="np-history-add-btn" onClick={() => { onNewChat(); onClose() }} aria-label="New chat">
              <IcPlus />
            </button>
          </div>
          {CHAT_HISTORY.map(c => (
            <div
              key={c.id}
              className={`np-history-chat-row${c.active ? ' active' : ''}${menuOpenId === c.id ? ' menu-open' : ''}`}
            >
              <button className="np-history-chat-main" onClick={() => { onSelectChat(c.label); onClose() }}>
                <span className="np-history-chat-icon"><IcChat /></span>
                <span className="np-history-chat-body">
                  <span className="np-history-chat-label">{c.label}</span>
                  <span className="np-history-chat-time">{c.time}</span>
                </span>
              </button>
              <div className="np-rel">
                <button
                  className="np-history-chat-menu-btn"
                  title="Chat options"
                  aria-label="Chat options"
                  onClick={(e) => { e.stopPropagation(); setMenuOpenId(o => o === c.id ? null : c.id) }}
                >
                  <IcDots />
                </button>
                {menuOpenId === c.id && (
                  <Dropdown onClose={() => setMenuOpenId(null)} className="np-dropdown--history-menu">
                    <button className="np-dropdown-item" onClick={() => setMenuOpenId(null)}>
                      <IcStar /> Star
                    </button>
                    <button className="np-dropdown-item" onClick={() => setMenuOpenId(null)}>
                      <IcRename /> Rename
                    </button>
                    <div className="np-dropdown-sep" />
                    <button className="np-dropdown-item danger" onClick={() => setMenuOpenId(null)}>
                      <IcTrash /> Delete
                    </button>
                  </Dropdown>
                )}
              </div>
            </div>
          ))}
          <button className="np-history-viewall"><IcViewAll /> View all conversations</button>
        </div>
      </div>
    </div>
  )
}

// ── Thinking card ─────────────────────────────────────────────────────
function ThinkingCard() {
  const [visible, setVisible] = useState(0)
  useEffect(() => {
    const timers = THINKING_STEPS.map((_, i) =>
      setTimeout(() => setVisible(v => Math.max(v, i + 1)), (i + 1) * 900)
    )
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div className="np-msg ai" aria-live="polite" aria-label="Navigator is processing">
      <div className="np-msg-avatar ai" aria-hidden="true"><NavIcon size={12} /></div>
      <div className="np-thinking-border">
        <div className="np-thinking-card">
          <div className="np-thinking-hdr">
            <span className="np-thinking-dot" aria-hidden="true" />
            <span className="np-thinking-title">Navigator is analyzing…</span>
          </div>
          {THINKING_STEPS.slice(0, visible).map((s, i) => {
            const Icon = STEP_ICONS[i]
            return (
              <div key={i} className="np-thinking-step">
                <div className="np-thinking-step-track">
                  <span className="np-thinking-step-icon" aria-hidden="true"><Icon /></span>
                  {i < visible - 1 && <span className="np-thinking-step-line" />}
                </div>
                <div className="np-thinking-step-body">
                  <span className="np-thinking-step-label">{s.text}</span>
                  <span className="np-thinking-step-detail">{s.detail}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Response card ─────────────────────────────────────────────────────
function ResponseCard({ onCopy, onExplore }) {
  const [feedback, setFeedback]       = useState(null)
  const [showSources, setShowSources] = useState(false)
  const [feedbackNote, setNote]       = useState('')
  const [showNoteBox, setNoteBox]     = useState(false)

  const handleFeedback = (val) => {
    const next = feedback === val ? null : val
    setFeedback(next)
    if (next === 'down') setNoteBox(true)
    else setNoteBox(false)
  }

  return (
    <div className="np-msg ai">
      <div className="np-msg-avatar ai" aria-hidden="true"><NavIcon size={12} /></div>
      <div className="np-ai-response">

        {/* Completed reasoning steps */}
        <div className="np-steps">
          {THINKING_STEPS.map((s, i) => (
            <div key={i} className="np-step"><StepDone /><span>{s.text}</span></div>
          ))}
        </div>

        <div className="np-divider" />

        {/* KPI row */}
        <div className="np-kpis">
          <div className="np-kpi critical"><span className="np-kpi-n">3</span><span className="np-kpi-l">Critical</span></div>
          <div className="np-kpi high"><span className="np-kpi-n">6</span><span className="np-kpi-l">High</span></div>
          <div className="np-kpi low"><span className="np-kpi-n">5</span><span className="np-kpi-l">Med / Low</span></div>
        </div>

        {/* Findings list */}
        <div className="np-findings">
          {DEMO_FINDINGS.map((f, i) => (
            <div key={i} className="np-finding-row">
              <span className={`np-sev-dot ${f.sev === 'Critical' ? 'critical' : 'high'}`} aria-hidden="true" />
              <span className="np-finding-name">{f.name}</span>
              <span className={`np-sev-badge ${f.sev === 'Critical' ? 'critical' : 'high'}`}>{f.sev}</span>
            </div>
          ))}
        </div>

        {/* ① Per-message AI disclaimer */}
        <div className="np-response-disclaimer" role="note">
          AI-generated · Verify critical findings independently before acting
        </div>

        {/* ② Action row: copy · sources · thumbs */}
        <div className="np-response-actions">
          <button
            className="np-resp-action-btn"
            onClick={() => onCopy(RESPONSE_TEXT)}
            aria-label="Copy response — review before sharing"
          >
            <IcCopy /> Copy
          </button>
          <button
            className={`np-resp-action-btn${showSources ? ' active' : ''}`}
            onClick={() => setShowSources(s => !s)}
            aria-label={showSources ? 'Hide sources' : 'Show sources'}
            aria-expanded={showSources}
          >
            <IcSource /> {DEMO_SOURCES.length} sources
          </button>
          <div className="np-feedback-group" role="group" aria-label="Rate this response">
            <button
              className={`np-feedback-btn${feedback === 'up' ? ' up' : ''}`}
              onClick={() => handleFeedback('up')}
              aria-label="Helpful"
              aria-pressed={feedback === 'up'}
            >
              <IcThumbUp />
            </button>
            <button
              className={`np-feedback-btn${feedback === 'down' ? ' down' : ''}`}
              onClick={() => handleFeedback('down')}
              aria-label="Not helpful"
              aria-pressed={feedback === 'down'}
            >
              <IcThumbDown />
            </button>
          </div>
        </div>

        {/* Negative feedback note box */}
        {showNoteBox && feedback === 'down' && (
          <div className="np-feedback-note-wrap">
            <textarea
              className="np-feedback-note-ta"
              placeholder="What was wrong with this response? (optional)"
              value={feedbackNote}
              onChange={e => setNote(e.target.value)}
              rows={2}
              aria-label="Describe what was wrong"
            />
            <button className="np-feedback-note-send" onClick={() => setNoteBox(false)}>
              Submit feedback
            </button>
          </div>
        )}

        {/* ③ Expandable sources */}
        {showSources && (
          <div className="np-sources">
            <div className="np-sources-hdr">Sources</div>
            {DEMO_SOURCES.map(s => (
              <div key={s.num} className="np-source-row">
                <span className="np-source-num">[{s.num}]</span>
                <span className="np-source-label">{s.label}</span>
              </div>
            ))}
          </div>
        )}

        <div className="np-response-meta">3 steps · 1.2 s · Knowledge Graph</div>

        {onExplore && (
          <button className="np-explore-detail-btn" onClick={onExplore}>
            Explore in detail <IcArrow />
          </button>
        )}
      </div>
    </div>
  )
}

// ── Error card ────────────────────────────────────────────────────────
function ErrorCard({ onRetry }) {
  return (
    <div className="np-msg ai" role="alert">
      <div className="np-msg-avatar ai" aria-hidden="true"><NavIcon size={12} /></div>
      <div className="np-error-card">
        <div className="np-error-top">
          <span className="np-error-icon" aria-hidden="true"><IcAlert /></span>
          <div className="np-error-body">
            <span className="np-error-title">Couldn't complete this request</span>
            <span className="np-error-sub">Try rephrasing, or check your data source connections.</span>
          </div>
        </div>
        <button className="np-error-retry" onClick={onRetry}>
          <IcRefresh /> Retry
        </button>
      </div>
    </div>
  )
}

// ── Mode selector ─────────────────────────────────────────────────────
function ModeSelector({ mode, onChange }) {
  return (
    <div className="np-mode-row" role="group" aria-label="Query mode">
      {QUERY_MODES.map(m => (
        <button
          key={m.id}
          className={`np-mode-chip${mode === m.id ? ' active' : ''}`}
          onClick={() => onChange(m.id)}
          title={m.desc}
          aria-pressed={mode === m.id}
        >
          {m.label}
        </button>
      ))}
    </div>
  )
}

// ── Copy friction toast ───────────────────────────────────────────────
function CopyToast({ message, onDismiss }) {
  if (!message) return null
  return (
    <div className="np-copy-toast" role="alert" aria-live="assertive">
      <span className="np-copy-toast-icon" aria-hidden="true"><IcAlert /></span>
      <span className="np-copy-toast-text">{message}</span>
      <button className="np-copy-toast-dismiss" onClick={onDismiss} aria-label="Dismiss">×</button>
    </div>
  )
}

// ── Resize handle ─────────────────────────────────────────────────────
function ResizeHandle({ onResizeStart, onDrag }) {
  const onMouseDown = (e) => {
    e.preventDefault()
    onResizeStart()
    const startX = e.clientX
    const onMove = (ev) => onDrag(ev.clientX - startX)
    const onUp   = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.style.cursor    = ''
      document.body.style.userSelect = ''
    }
    document.body.style.cursor    = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  return (
    <div
      className="np-resize-handle"
      onMouseDown={onMouseDown}
      role="separator"
      aria-label="Drag to resize panel"
      title="Drag to resize"
    >
      <div className="np-resize-dots">
        <span /><span /><span /><span />
      </div>
    </div>
  )
}

// ── Composer ──────────────────────────────────────────────────────────
function Composer({ value, onChange, onSend, placeholder, mode, onModeChange, focusRef }) {
  const internalRef = useRef(null)
  const taRef       = focusRef || internalRef

  const grow = useCallback(() => {
    const el = taRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }, [taRef])

  return (
    <div className="np-composer" role="form" aria-label="Message input">
      <div className="np-composer-box">
        <textarea
          ref={taRef}
          className="np-composer-ta"
          rows={1}
          placeholder={placeholder}
          value={value}
          onChange={e => { onChange(e); grow() }}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend() } }}
          aria-label="Type your message. Press Enter to send, Shift+Enter for new line."
          aria-multiline="true"
        />
        <div className="np-composer-mode-row">
          <div className="np-composer-row-left">
            <button className="np-composer-add" aria-label="Add context" tabIndex={-1}>
              <IcPlus />
            </button>
            <ModeSelector mode={mode} onChange={onModeChange} />
          </div>
          <button
            className="np-composer-send"
            disabled={!value.trim()}
            onClick={onSend}
            aria-label="Send message"
          >
            <IcArrowUp />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Splash screen ────────────────────────────────────────────────────
function SplashScreen({ exiting }) {
  return (
    <div className={`np-splash${exiting ? ' np-splash-exit' : ''}`} aria-hidden="true">
      <div className="np-splash-rings">
        <span className="np-splash-ring r1" />
        <span className="np-splash-ring r2" />
        <span className="np-splash-ring r3" />
      </div>
      <div className="np-splash-logo">
        <NavIcon size={36} />
      </div>
      <div className="np-splash-text">
        <span className="np-splash-name">Navigator</span>
        <span className="np-splash-sub">Exposure Intelligence</span>
      </div>
      <div className="np-splash-dots">
        <span /><span /><span />
      </div>
    </div>
  )
}

// ── First-run hero ────────────────────────────────────────────────────
const FIRSTRUN_SUGGESTIONS = [
  'What are my most critical findings right now?',
  'Which hosts have the highest exposure?',
  'Show identities with access to critical assets',
  'Summarize CVEs affecting my environment',
]

function FirstRunHero({ onSend }) {
  return (
    <div className="np-firstrun" role="region" aria-label="Navigator introduction">
      <div className="np-firstrun-identity">
        <div className="np-firstrun-logo"><NavIcon size={44} /></div>
        <span className="np-firstrun-name">Navigator</span>
      </div>
      <div className="np-firstrun-bottom">
        <div className="np-firstrun-suggestions">
          {FIRSTRUN_SUGGESTIONS.slice(0, 2).map((q, i) => (
            <button key={i} className="np-firstrun-suggestion" onClick={() => onSend(q)}>
              {q}
            </button>
          ))}
        </div>
        <p className="np-firstrun-limit" role="note">
          Answers are grounded in your connected data. Verify critical findings before acting.
        </p>
      </div>
    </div>
  )
}

// ── Home view ─────────────────────────────────────────────────────────
function PanelHome({ onSend, isFirstRun }) {
  const [query, setQuery]   = useState('')
  const [activeCtx, setCtx] = useState(new Set())
  const [mode, setMode]     = useState('quick')
  const taRef               = useRef(null)

  const toggleCtx = (id) => setCtx(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const handleSend = (q) => {
    const text = (q ?? query).trim()
    if (!text) return
    onSend(text)
  }

  const placeholder = activeCtx.size > 0
    ? `Ask about ${[...activeCtx].map(id => CTX_PILLS.find(p => p.id === id)?.label).join(', ')}…`
    : 'Ask about findings, hosts, CVEs…'

  return (
    <div className="np-home">
      <div className="np-home-scroll">
        {isFirstRun ? (
          <FirstRunHero onSend={handleSend} />
        ) : (
          <>
            <div className="np-hero">
              <div className="np-hero-icon" aria-hidden="true"><NavIcon size={24} /></div>
              <div className="np-hero-text">
                <span className="np-hero-title">Ask Navigator</span>
                <span className="np-hero-sub">Explore your attack surface with AI</span>
              </div>
            </div>

            {/* Quick-fire primary action buttons */}
            <div className="np-quick-btns">
              <button
                className="np-quick-btn primary"
                onClick={() => handleSend('Summarize current view')}
                aria-label="Summarize current view"
              >
                <span className="np-quick-btn-icon" aria-hidden="true"><IcSparkle /></span>
                <span className="np-quick-btn-text">
                  <span className="np-quick-btn-label">Summarize</span>
                  <span className="np-quick-btn-sub">Digest of this view</span>
                </span>
              </button>
              <button
                className="np-quick-btn secondary"
                onClick={() => handleSend('Analyze current page exposure and surface key risks')}
                aria-label="Analyze this page"
              >
                <span className="np-quick-btn-icon" aria-hidden="true"><IcZap /></span>
                <span className="np-quick-btn-text">
                  <span className="np-quick-btn-label">Analyze</span>
                  <span className="np-quick-btn-sub">Surface key risks</span>
                </span>
              </button>
            </div>

            <div className="np-section-label">Suggestions</div>
            <div className="np-actions-grid">
              {QUICK_ACTIONS.map((a, i) => (
                <button key={i} className="np-action-card" onClick={() => handleSend(a.label)}>
                  <span className="np-action-label">{a.label}</span>
                  <span className="np-action-desc">{a.desc}</span>
                  <span className="np-action-arrow" aria-hidden="true"><IcArrow /></span>
                </button>
              ))}
            </div>

            <div className="np-section-label np-section-label--mt4">Recent</div>
            <div className="np-recents-list">
              {CHAT_HISTORY.map(c => (
                <button key={c.id} className="np-recent-item" onClick={() => handleSend(c.label)}>
                  <span className="np-recent-icon" aria-hidden="true"><IcChat /></span>
                  <span className="np-recent-lbl">{c.label}</span>
                  <span className="np-recent-arrow" aria-hidden="true"><IcArrow /></span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <Composer
        value={query}
        onChange={e => setQuery(e.target.value)}
        onSend={() => handleSend()}
        placeholder={placeholder}
        mode={mode}
        onModeChange={setMode}
        focusRef={taRef}
      />
    </div>
  )
}

// ── Chat quick bar ────────────────────────────────────────────────────
function ChatQuickBar({ onSend }) {
  const [showActions, setShowActions] = useState(false)

  return (
    <div className="np-chat-quickbar">
      <button
        className="np-chat-quick-btn"
        onClick={() => onSend('Summarize current view')}
        aria-label="Summarize the current page"
      >
        <IcSparkle /> Summarize page
      </button>

      <div className="np-chat-quick-actions-wrap">
        <button
          className={`np-chat-quick-btn${showActions ? ' active' : ''}`}
          onClick={() => setShowActions(o => !o)}
          aria-label="Show quick actions"
          aria-expanded={showActions}
          aria-haspopup="menu"
        >
          <IcZap /> Quick actions
        </button>
        {showActions && (
          <Dropdown
            onClose={() => setShowActions(false)}
            className="np-dropdown--quick-actions"
          >
            {QUICK_ACTIONS.map((a, i) => (
              <button
                key={i}
                className="np-dropdown-item"
                onClick={() => { onSend(a.label); setShowActions(false) }}
                role="menuitem"
              >
                <IcArrow /> {a.label}
              </button>
            ))}
          </Dropdown>
        )}
      </div>
    </div>
  )
}

// ── Chat view ─────────────────────────────────────────────────────────
function PanelChat({ query, onNewChat, onSend, responseState, onRetry, onCopy, onExplore }) {
  const [followUp, setFollowUp] = useState('')
  const [mode, setMode]         = useState('quick')
  const messagesRef             = useRef(null)

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight
    }
  }, [responseState])

  return (
    <div className="np-chat">
      <div
        className="np-messages"
        ref={messagesRef}
        role="log"
        aria-live="polite"
        aria-label="Conversation with Navigator"
        aria-relevant="additions"
      >
        <div className="np-msg user">
          <div className="np-msg-avatar user" aria-hidden="true">MP</div>
          <div className="np-msg-bubble user">{query}</div>
        </div>
        {responseState === 'thinking' && <ThinkingCard />}
        {responseState === 'done'     && <ResponseCard onCopy={onCopy} onExplore={onExplore} />}
        {responseState === 'error'    && <ErrorCard onRetry={onRetry} />}
      </div>

      <ChatQuickBar onSend={onSend} />

      <Composer
        value={followUp}
        onChange={e => setFollowUp(e.target.value)}
        onSend={() => {
          const text = followUp.trim();
          if (!text) return;
          onSend(text);
          setFollowUp('');
        }}
        placeholder="Ask a follow-up…"
        mode={mode}
        onModeChange={setMode}
      />
    </div>
  )
}

// ── Builder guided chats ────────────────────────────────────────────────
// Scripted demo flows (not real NLU) — each stage's `action` drives the live
// canvas for the active surface (Assessment Builder, Dashboard, ...) via its
// imperative `builderApi` ref, and its `ai` message is generated from a
// post-action snapshot of that real state. Which stage list runs is picked
// by `builderKind`, so each surface gets its own scoped vocabulary/context.
const ASSESSMENT_BUILDER_STAGES = [
  {
    ai: "Hi! Let's build an assessment together — what should we check?",
    suggestions: ['Storage volumes must be encrypted at rest'],
  },
  {
    action: (api) => { api.pickPrimary?.('storage'); api.addPrimaryFilter?.('Type', '=', 'Volume') },
    ai: (snap) => `Got it — I've scoped this to ${snap.scopeSummary || 'Storage · 1 filter'}. Look right?`,
    suggestions: ['Looks good'],
  },
  {
    action: (api) => api.setSharedCondition?.('Encrypted at rest', '=', 'true'),
    ai: (snap) => `Condition set: ${snap.conditionSummary || 'should have encrypted at rest'}. Ready to validate?`,
    suggestions: ['Run validation'],
  },
  {
    action: (api) => { api.goToStep?.(2); api.runValidation?.() },
    ai: () => 'Running a dry-run…',
    suggestions: [],
    settleMs: 1100,
  },
  {
    ai: (snap) => `Validation complete — ${(snap.estScopeTotal ?? 0).toLocaleString()} items in scope, ${snap.passPct ?? 0}% passing today. Move on to contribution?`,
    suggestions: ['Continue to contribution'],
  },
  {
    action: (api) => { api.goToStep?.(3); api.setContribution?.(true, false) },
    ai: () => 'This now contributes to Compliance (CCM). Want me to auto-map frameworks?',
    suggestions: ['Map to SCF'],
  },
  {
    action: (api) => api.applyFrameworkMapping?.('scf'),
    ai: (snap) => `Mapped to ${(snap.automapped || []).map(r => r.frameworkName).join(', ') || 'SCF'}. Ready to review and deploy?`,
    suggestions: ['Review & deploy'],
  },
  {
    action: (api) => { api.goToStep?.(4); api.openPreview?.() },
    ai: () => "I've opened the deploy confirmation — it'll run in the background until it's live.",
    suggestions: [],
  },
]

// ── Dashboard-builder guided chat ────────────────────────────────────────
// Same scripted-demo shape as the assessment builder, driving DashboardCanvas's
// addWidget/configureWidget/removeWidget via its builderApi ref.
const DASHBOARD_BUILDER_STAGES = [
  {
    ai: "Hi! Let's add something to your dashboard — what would you like to see?",
    suggestions: ['Show me open findings by severity'],
  },
  {
    action: (api) => api.addWidget?.({ chartId: 'vert-bar', label: 'Findings by Severity', sizeId: 'medium', heightId: 'medium' }),
    ai: (snap) => `Added "${snap.widgets?.at(-1)?.label || 'the widget'}" to your dashboard (${snap.widgetCount} widget${snap.widgetCount === 1 ? '' : 's'} total). Want to adjust its size or colors?`,
    suggestions: ['Make it larger', 'Looks good'],
  },
  {
    action: (api) => { const last = api.getSnapshot?.().widgets?.at(-1); if (last) api.configureWidget?.(last.id, { sizeId: 'large', heightId: 'large' }) },
    ai: (snap) => `Resized "${snap.widgets?.at(-1)?.label || 'the widget'}". Anything else you'd like on this dashboard?`,
    suggestions: ['That’s all for now'],
  },
]

// Triggered from a widget's "Edit with Copilot" hover action — scoped to that
// one widget instead of the generic add-new-widget flow above.
function buildDashboardEditStages(ctx) {
  return [
    {
      ai: `Let's edit "${ctx.widgetLabel}" — what would you like to change?`,
      suggestions: ['Make it larger', 'Change chart type'],
    },
    {
      action: (api) => api.configureWidget?.(ctx.widgetId, { sizeId: 'large', heightId: 'large' }),
      ai: (snap) => `Resized "${snap.widgets?.find(w => w.id === ctx.widgetId)?.label || ctx.widgetLabel}". Anything else you'd like to change?`,
      suggestions: ['Looks good'],
    },
  ]
}

const BUILDER_STAGES_BY_KIND = {
  assessment: ASSESSMENT_BUILDER_STAGES,
  dashboard: DASHBOARD_BUILDER_STAGES,
}

const BUILDER_CAPTION_BY_KIND = {
  assessment: 'Guided assessment builder',
  dashboard: 'Guided dashboard builder',
}

function BuilderChat({ builderApi, builderKind = 'assessment', builderContext = null }) {
  const editingWidget = builderKind === 'dashboard' && builderContext?.widgetId
  const stages = editingWidget
    ? buildDashboardEditStages(builderContext)
    : (BUILDER_STAGES_BY_KIND[builderKind] || ASSESSMENT_BUILDER_STAGES)
  const caption = editingWidget
    ? `Editing "${builderContext.widgetLabel}"`
    : (BUILDER_CAPTION_BY_KIND[builderKind] || BUILDER_CAPTION_BY_KIND.assessment)
  const [messages, setMessages]   = useState(() => [{ role: 'ai', text: stages[0].ai }])
  const [stageIdx, setStageIdx]   = useState(0)
  const [inputValue, setInputVal] = useState('')
  const [busy, setBusy]           = useState(false)
  const [mode, setMode]           = useState('quick')
  const stageIdxRef  = useRef(0)
  const messagesRef  = useRef(null)

  useEffect(() => {
    if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight
  }, [messages, busy])

  const advance = (userText) => {
    if (busy) return
    const nextIdx   = stageIdxRef.current + 1
    const nextStage = stages[nextIdx]
    if (!nextStage) return
    if (userText) setMessages(m => [...m, { role: 'user', text: userText }])
    setInputVal('')
    setBusy(true)
    if (nextStage.action) nextStage.action(builderApi?.current || {})
    setTimeout(() => {
      const snap   = builderApi?.current?.getSnapshot?.() || {}
      const aiText = typeof nextStage.ai === 'function' ? nextStage.ai(snap) : nextStage.ai
      setMessages(m => [...m, { role: 'ai', text: aiText }])
      stageIdxRef.current = nextIdx
      setStageIdx(nextIdx)
      setBusy(false)
      if (!nextStage.suggestions?.length && stages[nextIdx + 1]) {
        setTimeout(() => advance(''), 300)
      }
    }, nextStage.settleMs || 450)
  }

  const currentStage = stages[stageIdx]

  return (
    <div className="np-builder-chat">
      <div className="np-builder-caption">{caption}</div>
      <div className="np-builder-messages" ref={messagesRef} role="log" aria-live="polite" aria-label={caption}>
        {messages.map((m, i) => (
          <div key={i} className={`np-builder-msg ${m.role}`}>
            {m.role === 'ai' && <span className="np-builder-msg-badge" aria-hidden="true"><NavIcon size={13} /></span>}
            <div className="np-builder-msg-bubble">{m.text}</div>
          </div>
        ))}
        {busy && (
          <div className="np-builder-msg ai">
            <span className="np-builder-msg-badge" aria-hidden="true"><NavIcon size={13} /></span>
            <div className="np-builder-msg-bubble np-builder-typing"><span /><span /><span /></div>
          </div>
        )}
      </div>

      {!busy && currentStage?.suggestions?.length > 0 && (
        <div className="np-builder-suggestions">
          {currentStage.suggestions.map(s => (
            <button key={s} className="np-builder-suggestion" onClick={() => advance(s)}>{s}</button>
          ))}
        </div>
      )}

      <Composer
        value={inputValue}
        onChange={e => setInputVal(e.target.value)}
        onSend={() => inputValue.trim() && advance(inputValue.trim())}
        placeholder="Type anything to continue…"
        mode={mode}
        onModeChange={setMode}
      />
    </div>
  )
}

// ── View modes ────────────────────────────────────────────────────────
const VIEW_MODES = [
  { id: 'sidebar',    label: 'Sidebar',     Icon: IcSidebar },
  { id: 'floating',   label: 'Floating',    Icon: IcFloat   },
  { id: 'fullscreen', label: 'Full screen', Icon: IcFullscr },
]

// ── Panel root ────────────────────────────────────────────────────────
export default function NavigatorPanel({ open, onClose, onNav, embedded = false, initialViewMode = 'sidebar', onViewModeChange, builderMode = false, builderApi = null, builderKind = 'assessment', builderContext = null }) {
  const [view, setView]             = useState('home')

  // Enter the scripted assessment-builder chat when triggered externally
  useEffect(() => { if (builderMode) setView('builder') }, [builderMode])
  const [activeQuery, setQ]         = useState('')
  const [responseState, setRespSt]  = useState('done')
  const [historyOpen, setHistory]   = useState(false)
  const [viewMode, setViewMode]     = useState(initialViewMode)
  const [showViewMenu, setViewMenu] = useState(false)
  const [showMoreMenu, setMoreMenu] = useState(false)
  const [panelWidth, setPanelWidth] = useState(400)
  const [floatPos, setFloatPos]     = useState(() => initialViewMode === 'floating'
    ? { x: window.innerWidth - 400 - 16, y: 60 }
    : { x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [copyToast, setCopyToast]   = useState(null)
  const [isFirstRun, setFirstRun]   = useState(true)
  const [splash, setSplash]         = useState(false)
  const [splashExit, setSplashExit] = useState(false)

  const panelRef      = useRef(null)
  const startWidthRef = useRef(400)
  const historyFocRef = useRef(null)

  // Splash screen on every open
  useEffect(() => {
    if (!open) { setSplash(false); setSplashExit(false); return }
    setSplash(true)
    setSplashExit(false)
    const exitT  = setTimeout(() => setSplashExit(true),  1700)
    const doneT  = setTimeout(() => setSplash(false),     2100)
    return () => { clearTimeout(exitT); clearTimeout(doneT) }
  }, [open])

  // Focus textarea when panel opens (after slide-in transition)
  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => {
      panelRef.current?.querySelector('textarea')?.focus()
    }, 2200)
    return () => clearTimeout(t)
  }, [open])

  // ⌘K / Ctrl+K → new chat
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k' && open) {
        e.preventDefault()
        handleNew()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  // Escape → close history overlay
  useEffect(() => {
    if (!historyOpen) return
    const handler = (e) => { if (e.key === 'Escape') setHistory(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [historyOpen])

  const handleSend = (q) => {
    setQ(q)
    setView('chat')
    setRespSt('thinking')
    setFirstRun(false)
    setTimeout(() => setRespSt('done'), 3200)
  }

  const handleRetry = () => {
    setRespSt('thinking')
    setTimeout(() => setRespSt('done'), 3200)
  }

  const handleNew = () => {
    setQ('')
    setView('home')
    setRespSt('done')
  }

  const handleExploreDetail = useCallback(() => {
    onClose?.()
    onNav?.('navigator-page', activeQuery)
  }, [onClose, onNav, activeQuery])

  const handleCopy = useCallback((text) => {
    try { navigator.clipboard.writeText(text) } catch (_) {}
    setCopyToast('Copied. AI-generated content may contain inaccuracies — verify before sharing.')
    setTimeout(() => setCopyToast(null), 5000)
  }, [])

  const handleViewMode = (id) => {
    setViewMenu(false)
    if (id === 'fullscreen') {
      onClose?.()
      onNav?.('navigator-page', activeQuery)
      return
    }
    if (id === 'floating' && viewMode !== 'floating') {
      setFloatPos({ x: window.innerWidth - panelWidth - 16, y: 60 })
    }
    setViewMode(id)
    onViewModeChange?.(id)
  }

  // Resize
  const handleResizeStart = useCallback(() => {
    startWidthRef.current = panelWidth
  }, [panelWidth])

  const handleResizeDrag = useCallback((dx) => {
    setPanelWidth(Math.max(300, Math.min(700, startWidthRef.current - dx)))
  }, [])

  // Float drag
  const handleFloatHeaderMouseDown = (e) => {
    if (viewMode !== 'floating') return
    const startX = e.clientX - floatPos.x
    const startY = e.clientY - floatPos.y
    setIsDragging(true)
    const onMove = (ev) => setFloatPos({ x: ev.clientX - startX, y: ev.clientY - startY })
    const onUp   = () => {
      setIsDragging(false)
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.style.cursor    = ''
      document.body.style.userSelect = ''
    }
    document.body.style.cursor    = 'grabbing'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  const isFloating = viewMode === 'floating'
  const w          = panelWidth

  const ViewIcon = viewMode === 'floating' ? IcFloat : viewMode === 'fullscreen' ? IcFullscr : IcSidebar

  const panelStyle = isFloating
    ? {
        position:      'fixed',
        left:          floatPos.x,
        top:           floatPos.y,
        width:         w,
        height:        'calc(100vh - 80px)',
        zIndex:        300,
        borderRadius:  16,
        boxShadow:     '0 12px 48px rgba(0,0,0,0.20), 0 2px 8px rgba(0,0,0,0.10)',
        background:    'var(--card-bg)',
        border:        '1px solid var(--shell-border)',
        display:       open ? 'flex' : 'none',
        flexDirection: 'column',
        overflow:      'hidden',
      }
    : embedded
    ? {
        flex:          1,
        display:       'flex',
        flexDirection: 'column',
        overflow:      'hidden',
        background:    'var(--card-bg)',
      }
    : {
        width:         open ? w : 0,
        flexShrink:    0,
        background:    'var(--card-bg)',
        borderLeft:    open ? '1px solid var(--shell-border)' : 'none',
        boxShadow:     open ? '-8px 0 32px rgba(0,0,0,0.06)' : 'none',
        overflow:      'hidden',
        display:       'flex',
        flexDirection: 'column',
        transition:    'width 300ms cubic-bezier(0.4,0,0.2,1)',
        position:      'relative',
      }

  return (
    <div
      style={panelStyle}
      ref={panelRef}
      role="complementary"
      aria-label="Navigator AI assistant"
      aria-hidden={!open}
    >
      {/* Resize handle — sidebar only, not when embedded in shell */}
      {!isFloating && !embedded && open && (
        <ResizeHandle
          onResizeStart={handleResizeStart}
          onDrag={handleResizeDrag}
        />
      )}

      <div className="np-panel-content" style={{ width: embedded || isFloating ? '100%' : w }}>

        {/* ── Splash ── */}
        {false && splash && <SplashScreen exiting={splashExit} />}

        {/* ── Header — shown when standalone or floating ── */}
        {(!embedded || isFloating) && <div
          className="np-header"
          onMouseDown={isFloating ? handleFloatHeaderMouseDown : undefined}
          style={isFloating ? { cursor: isDragging ? 'grabbing' : 'grab' } : undefined}
        >
          <div className="np-header-brand">
            <button
              className={`np-icon-btn${historyOpen ? ' active' : ''}`}
              onClick={() => setHistory(o => !o)}
              aria-label={historyOpen ? 'Close history' : 'Open chat history'}
              aria-expanded={historyOpen}
            >
              <IcMenu />
            </button>
            <span className="np-header-icon-wrap" aria-hidden="true"><NavIcon size={16} /></span>
            <span className="np-header-title">Navigator</span>
            <span className="np-header-badge" aria-hidden="true"><IcSparkle /> AI</span>
          </div>

          <div className="np-header-actions">
            <button
              className="np-icon-btn"
              onClick={handleNew}
              aria-label="New chat (⌘K)"
              title="New chat  ⌘K"
            >
              <IcEdit />
            </button>

            {/* View mode */}
            <div className="np-rel">
              <button
                className={`np-icon-btn${showViewMenu ? ' active' : ''}`}
                onClick={() => { setViewMenu(o => !o); setMoreMenu(false) }}
                aria-label="Switch view mode"
                aria-expanded={showViewMenu}
                aria-haspopup="menu"
              >
                <ViewIcon />
              </button>
              {showViewMenu && (
                <Dropdown onClose={() => setViewMenu(false)} className="np-dropdown--view-menu">
                  <div className="np-dropdown-label">View mode</div>
                  {VIEW_MODES.map(m => (
                    <button
                      key={m.id}
                      className={`np-dropdown-item${viewMode === m.id ? ' selected' : ''}`}
                      onClick={() => handleViewMode(m.id)}
                      role="menuitem"
                    >
                      <m.Icon /> {m.label}
                      {viewMode === m.id && <span className="np-dropdown-check" aria-hidden="true"><IcCheck /></span>}
                    </button>
                  ))}
                </Dropdown>
              )}
            </div>

            {/* More menu */}
            <div className="np-rel">
              <button
                className={`np-icon-btn${showMoreMenu ? ' active' : ''}`}
                onClick={() => { setMoreMenu(o => !o); setViewMenu(false) }}
                aria-label="More options"
                aria-expanded={showMoreMenu}
                aria-haspopup="menu"
              >
                <IcDots />
              </button>
              {showMoreMenu && (
                <Dropdown onClose={() => setMoreMenu(false)} className="np-dropdown--more-menu">
                  <button className="np-dropdown-item" onClick={() => setMoreMenu(false)} role="menuitem">
                    <IcRename /> Rename
                  </button>
                  <button className="np-dropdown-item danger" onClick={() => setMoreMenu(false)} role="menuitem">
                    <IcTrash /> Delete
                  </button>
                  <div className="np-dropdown-sep" role="separator" />
                  <button className="np-dropdown-item" onClick={() => setMoreMenu(false)} role="menuitem">
                    <IcFeedback /> Send feedback
                  </button>
                  <button className="np-dropdown-item" onClick={() => setMoreMenu(false)} role="menuitem">
                    <IcHelp /> Help &amp; capabilities
                  </button>
                </Dropdown>
              )}
            </div>

            <button className="np-icon-btn" onClick={onClose} aria-label="Close Navigator">
              <IcX />
            </button>
          </div>
        </div>}

        {/* ── Embedded controls bar (only when embedded and not floating) ── */}
        {embedded && !isFloating && (
          <div className="np-embedded-bar">
            <button
              className={`np-icon-btn${historyOpen ? ' active' : ''}`}
              onClick={() => setHistory(o => !o)}
              aria-label={historyOpen ? 'Close history' : 'Open chat history'}
              aria-expanded={historyOpen}
            >
              <IcMenu />
            </button>
            <div className="np-embedded-bar-spacer" />
            <button
              className="np-icon-btn"
              onClick={handleNew}
              aria-label="New chat (⌘K)"
              title="New chat  ⌘K"
            >
              <IcEdit />
            </button>
            <div className="np-rel">
              <button
                className={`np-icon-btn${showViewMenu ? ' active' : ''}`}
                onClick={() => { setViewMenu(o => !o); setMoreMenu(false) }}
                aria-label="Switch view mode"
                aria-expanded={showViewMenu}
                aria-haspopup="menu"
              >
                <IcSidebar />
              </button>
              {showViewMenu && (
                <Dropdown onClose={() => setViewMenu(false)} className="np-dropdown--view-menu">
                  <div className="np-dropdown-label">View mode</div>
                  {VIEW_MODES.map(m => (
                    <button
                      key={m.id}
                      className={`np-dropdown-item${m.id === 'sidebar' ? ' selected' : ''}`}
                      onClick={() => handleViewMode(m.id)}
                      role="menuitem"
                    >
                      <m.Icon /> {m.label}
                      {m.id === 'sidebar' && <span className="np-dropdown-check" aria-hidden="true"><IcCheck /></span>}
                    </button>
                  ))}
                </Dropdown>
              )}
            </div>
            <div className="np-rel">
              <button
                className={`np-icon-btn${showMoreMenu ? ' active' : ''}`}
                onClick={() => { setMoreMenu(o => !o); setViewMenu(false) }}
                aria-label="More options"
                aria-expanded={showMoreMenu}
                aria-haspopup="menu"
              >
                <IcDots />
              </button>
              {showMoreMenu && (
                <Dropdown onClose={() => setMoreMenu(false)} className="np-dropdown--more-menu">
                  <button className="np-dropdown-item" onClick={() => setMoreMenu(false)} role="menuitem">
                    <IcRename /> Rename
                  </button>
                  <button className="np-dropdown-item danger" onClick={() => setMoreMenu(false)} role="menuitem">
                    <IcTrash /> Delete
                  </button>
                  <div className="np-dropdown-sep" role="separator" />
                  <button className="np-dropdown-item" onClick={() => setMoreMenu(false)} role="menuitem">
                    <IcFeedback /> Send feedback
                  </button>
                  <button className="np-dropdown-item" onClick={() => setMoreMenu(false)} role="menuitem">
                    <IcHelp /> Help &amp; capabilities
                  </button>
                </Dropdown>
              )}
            </div>
          </div>
        )}

        {/* ── History overlay ── */}
        <HistoryOverlay
          open={historyOpen}
          onClose={() => setHistory(false)}
          onNewChat={handleNew}
          onSelectChat={(label) => { handleSend(label); setHistory(false) }}
          firstFocusRef={historyFocRef}
        />

        {/* ── Body ── */}
        <div className="np-panel-body">
          {view === 'builder'
            ? <BuilderChat key={`${builderKind}:${builderContext?.widgetId ?? 'new'}`} builderApi={builderApi} builderKind={builderKind} builderContext={builderContext} />
            : view === 'home'
            ? <PanelHome onSend={handleSend} isFirstRun={isFirstRun} />
            : <PanelChat
                query={activeQuery}
                onNewChat={handleNew}
                onSend={handleSend}
                responseState={responseState}
                onRetry={handleRetry}
                onCopy={handleCopy}
                onExplore={handleExploreDetail}
              />
          }
        </div>

        {/* ── Copy friction toast ── */}
        <CopyToast message={copyToast} onDismiss={() => setCopyToast(null)} />
      </div>
    </div>
  )
}
