import React, { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Ic } from '../ui.jsx'
import { WidgetCard } from './DashboardCanvas.jsx'
import ReasoningEngine, { createExchange, useReasoningEngine } from '../components/ReasoningEngine.jsx'
import CanvasPanel, { ChatDragger, ExchangeResult, FeedbackRow } from '../components/CanvasPanel.jsx'
import TablePagination from '../components/TablePagination.jsx'
import { useToast } from '../context/ToastCtx.jsx'
import { TEXT_ONLY_TIERS, INTRO_COMPLETION_MESSAGES, FOLLOWUP_SUGGESTIONS } from './navigatorEngine.js'

const RECENT_CHATS = [
  { id: 'c1', label: 'High severity findings for host vm-prod-42', time: 'Just now',           bucket: 'Today',     starred: true  },
  { id: 'c2', label: 'Identities with access to critical storage',  time: '2 hrs ago',          bucket: 'Today',     starred: false },
  { id: 'c3', label: 'Summary of CVE-2024-11891 exposure',          time: 'Yesterday, 4:12 PM', bucket: 'Yesterday', starred: false },
  { id: 'c4', label: 'Compliance gaps in AWS environment',          time: 'Yesterday, 9:03 AM', bucket: 'Yesterday', starred: false },
  { id: 'c5', label: 'Top exposed cloud storage buckets',           time: '3 days ago',         bucket: 'Earlier',   starred: false },
  { id: 'c6', label: 'Identity risk overview for privileged accounts', time: '5 days ago',       bucket: 'Earlier',  starred: false },
  { id: 'c7', label: 'Findings trend over the last quarter',        time: '2 weeks ago',        bucket: 'Earlier',   starred: false },
];

const HISTORY_BUCKETS = ['Today', 'Yesterday', 'Earlier'];

const CTX_PILLS = [
  { id: 'host',     label: 'Hosts',      count: 842  },
  { id: 'finding',  label: 'Findings',   count: 2140 },
  { id: 'identity', label: 'Identities', count: 513  },
  { id: 'account',  label: 'Accounts',   count: 78   },
  { id: 'vuln',     label: 'CVEs',       count: 634  },
];


// Each sample query is worded to reliably land in its labeled tier when run through
// classifyQuery() — e.g. risk/deep phrasing is imperative rather than "what is/are…"
// so it doesn't get intercepted by the (intentionally broad) concept-question regex.
const SAMPLE_QUERIES = [
  { cat: 'quick',      q: 'Show me all admin users' },
  { cat: 'graph',      q: 'Which identities have access to the payment gateway, and what roles grant that access?' },
  { cat: 'risk',       q: 'Show me the highest risk vulnerabilities right now' },
  { cat: 'deep',       q: 'Run a full exposure analysis across all entity types and correlate risk indicators' },
  { cat: 'concept',    q: 'What is an exposure score?' },
  { cat: 'data-dict',  q: 'What does privilege_level mean?' },
  { cat: 'summary',    q: 'Give me a summary of my current exposure' },
  { cat: 'web',        q: 'Tell me about CVE-2024-38812' },
];

// ── SVG icons (inline Lucide-style) ─────────────────────────────────
const IcChat     = () => <Ic size={14} path={<><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>} />;
const IcBook     = () => <Ic size={14} path={<><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></>} />;
const IcChevR    = () => <Ic size={12} path={<><path d="m9 18 6-6-6-6"/></>} />;
const IcGrid     = () => <Ic size={14} path={<><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></>} />;
const IcChevDown = () => <Ic size={12} path={<><path d="m6 9 6 6 6-6"/></>} />;
const IcSend     = () => <Ic size={16} path={<><path d="m22 2-7 20-4-9-9-4 20-7z"/><path d="M22 2 11 13"/></>} />;
const IcChevD    = () => <Ic size={12} path={<><path d="m6 9 6 6 6-6"/></>} />;
const IcEdit     = () => <Ic size={14} path={<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>} />;
const IcSidebar  = () => <Ic size={14} path={<><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M15 3v18"/></>} />;
const IcFloat    = () => <Ic size={14} path={<><rect x="5" y="5" width="14" height="14" rx="2"/><path d="M3 9h2M3 12h2M3 15h2"/></>} />;
const IcFullscr  = () => <Ic size={14} path={<><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></>} />;
const IcDots     = () => <Ic size={15} path={<><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></>} />;
const IcCanvasView = () => <Ic size={14} path={<><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/><path d="M14 9l3 3-3 3"/></>} />;
const IcRename   = () => <Ic size={14} path={<><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></>} />;
const IcShare    = () => <Ic size={14} path={<><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"/><path d="M16 6l-4-4-4 4"/><path d="M12 2v13"/></>} />;
const IcPin      = () => <Ic size={14} path={<><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></>} />;
const IcArchive  = () => <Ic size={14} path={<><rect x="2" y="4" width="20" height="5" rx="1"/><path d="M4 9v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9"/><path d="M10 13h4"/></>} />;
const IcTrash    = () => <Ic size={14} path={<><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></>} />;
const IcFeedback = () => <Ic size={14} path={<><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>} />;
const IcHelp     = () => <Ic size={14} path={<><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></>} />;
const IcHistory   = () => <Ic size={14} path={<><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><path d="M12 7v5l4 2"/></>} />;
const IcArrowLeft = () => <Ic size={14} path={<><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></>} />;
const IcSearchSm  = () => <Ic size={14} path={<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>} />;
const IcSettings  = () => <Ic size={14} path={<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06-.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>} />;
const IcVulnerability = () => <Ic size={16} path={<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>} />;
const IcDevice        = () => <Ic size={16} path={<><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></>} />;
const IcCloud         = () => <Ic size={16} path={<><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></>} />;
const IcApp           = () => <Ic size={16} path={<><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 2 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></>} />;
const IcIdentity      = () => <Ic size={16} path={<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>} />;
const IcBot           = () => <Ic size={14} path={<><rect x="4" y="9" width="16" height="11" rx="2"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/><circle cx="9" cy="14.5" r="1.2"/><circle cx="15" cy="14.5" r="1.2"/><path d="M2 13h2M20 13h2"/></>} />;
const IcPlay          = () => <Ic size={16} path={<><polygon points="6 3 20 12 6 21 6 3"/></>} />;
const IcClock         = () => <Ic size={16} path={<><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/></>} />;
const IcCheckCircle   = () => <Ic size={28} path={<><circle cx="12" cy="12" r="10"/><polyline points="8 12.5 11 15.5 16 9"/></>} />;
const IcPlus          = () => <Ic size={14} path={<><path d="M12 5v14M5 12h14"/></>} />;
const IcStar           = () => <Ic size={13} path={<><path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></>} />;
const IcSidebarCollapse = ({ flip = false }) => (
  <span style={{ display: 'flex', transform: flip ? 'scaleX(-1)' : 'none' }}>
    <Ic size={14} path={<><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/><path d="M13.5 9l2.5 3-2.5 3"/></>} />
  </span>
);

const ENTITY_PILLS = [
  { id: 'vuln',   label: 'Vulnerability', count: '13,456', Icon: IcVulnerability },
  { id: 'device', label: 'Device',        count: '9,016',  Icon: IcDevice },
  { id: 'cloud',  label: 'Cloud',         count: '19,245', Icon: IcCloud },
  { id: 'app',    label: 'Application',   count: '6,324',  Icon: IcApp },
  { id: 'ident',  label: 'Identity',      count: '10,234', Icon: IcIdentity },
];

// Starter agents so the Home agent picker and the Agents list aren't empty on
// first use — same shape as agents created via AgentBuilderView, seeded once
// into AGENTS_STORAGE_KEY (see NavigatorPage) rather than re-injected every load.
const DEFAULT_AGENTS = [
  {
    id: 'agent-seed-1', createdAt: 1700000006000,
    name: 'Critical Vuln Triage',
    description: 'Surfaces new critical/high vulnerabilities on exposed assets',
    instructions: 'Every run, find critical and high-severity vulnerabilities discovered in the last 24 hours on internet-facing devices. Rank by exploitability and flag any without an assigned owner.',
    dataAccess: [ENTITY_PILLS[0], ENTITY_PILLS[1]],
    autonomy: 'interactive', depth: 1,
    triggerType: 'scheduled', scheduleFreq: 'daily', scheduleTime: '08:00',
  },
  {
    id: 'agent-seed-2', createdAt: 1700000005000,
    name: 'Cloud Misconfig Hunter',
    description: 'Scans cloud accounts for risky public exposure and IAM drift',
    instructions: 'Scan all cloud accounts for newly public storage, overly permissive IAM policies, and untagged resources. Summarize findings by account and severity.',
    dataAccess: [ENTITY_PILLS[2]],
    autonomy: 'agentic', depth: 1,
    triggerType: 'manual',
  },
  {
    id: 'agent-seed-3', createdAt: 1700000004000,
    name: 'Identity Risk Reviewer',
    description: 'Flags stale, over-privileged, or MFA-less identities',
    instructions: 'Review privileged identities for accounts without MFA, access unused for 90+ days, and permissions beyond role. List the top offenders each run.',
    dataAccess: [ENTITY_PILLS[4]],
    autonomy: 'agentic', depth: 0,
    triggerType: 'scheduled', scheduleFreq: 'daily', scheduleTime: '07:00',
  },
  {
    id: 'agent-seed-4', createdAt: 1700000003000,
    name: 'Device Patch Compliance',
    description: 'Tracks endpoints past their patch SLA',
    instructions: 'Check endpoint patch status against policy SLAs, flag devices past due, and group results by business unit.',
    dataAccess: [ENTITY_PILLS[1]],
    autonomy: 'agentic', depth: 0,
    triggerType: 'scheduled', scheduleFreq: 'daily', scheduleTime: '06:30',
  },
  {
    id: 'agent-seed-5', createdAt: 1700000002000,
    name: 'App Exposure Monitor',
    description: 'Watches applications for new internet-facing exposure',
    instructions: 'Track exposure changes across applications and flag any newly internet-exposed service or new critical finding tied to a production app.',
    dataAccess: [ENTITY_PILLS[3]],
    autonomy: 'interactive', depth: 1,
    triggerType: 'scheduled', scheduleFreq: 'weekly', scheduleTime: '09:00',
  },
  {
    id: 'agent-seed-6', createdAt: 1700000001000,
    name: 'Compliance Gap Auditor',
    description: 'Checks control coverage across apps and identities',
    instructions: 'Check control coverage across applications and identities against the current compliance framework. List any gaps opened in the last 7 days and who owns remediation.',
    dataAccess: [ENTITY_PILLS[3], ENTITY_PILLS[4]],
    autonomy: 'interactive', depth: 2,
    triggerType: 'scheduled', scheduleFreq: 'weekly', scheduleTime: '09:00',
  },
];

// Colored dots for the saved-agents dropdown/list — cycled by index rather than
// stored per-agent, since custom agents don't carry their own brand color.
const AGENT_DOT_VARS = ['var(--pai-indigo)', 'var(--pai-nav-teal)', 'var(--pai-green)', 'var(--pai-high-fg)', 'var(--shell-accent)'];

const VIEW_MODES = [
  { id: 'sidebar',    label: 'Sidebar',     Icon: IcSidebar },
  { id: 'floating',   label: 'Floating',    Icon: IcFloat   },
  { id: 'fullscreen', label: 'Full screen', Icon: IcFullscr },
];

// ── Click-outside-aware dropdown ─────────────────────────────────────
function Dropdown({ children, onClose, className, style }) {
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);
  return (
    <div ref={ref} className={`np-dropdown${className ? ` ${className}` : ''}`} style={style} role="menu">
      {children}
    </div>
  );
}

function IcHome() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 11.5 12 4l8 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6 9.5V19a1 1 0 0 0 1 1h3v-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5h3a1 1 0 0 0 1-1V9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// Drops the active Chat/Build session and returns to the Home composer —
// the replacement for the old NavPanel's "New Thread"/"New Project" rows,
// now living next to History in each view's own header.
function HomeButton({ onClick }) {
  return (
    <button className="nav-history-btn" onClick={onClick} title="Back to Home">
      <IcHome />
      <span className="nav-history-btn-label">Home</span>
    </button>
  );
}


// ── History page — replaces the old click-outside dropdown with a full-width
// view so a growing chat list has room for search + per-item actions. It's an
// overlay absolutely positioned over .nav-page-content-only (not a `view`
// state) so Home/Chat/Build stay mounted underneath — "Back" just closes it,
// landing exactly where the user was, with no lost chat/build state.
function HistoryRow({ chat, active, onSelect, onRename, onRequestDelete, onToggleStar, showIcon = true }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(chat.label);

  const commitRename = () => {
    setRenaming(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== chat.label) onRename(chat.id, trimmed);
  };

  return (
    <div className={`np-history-chat-row${active ? ' active' : ''}${menuOpen ? ' menu-open' : ''}`}>
      {renaming ? (
        <input
          className="nav-history-rename-input"
          value={draft}
          autoFocus
          onChange={e => setDraft(e.target.value)}
          onFocus={e => e.target.select()}
          onBlur={commitRename}
          onKeyDown={e => {
            if (e.key === 'Enter') commitRename();
            if (e.key === 'Escape') { setDraft(chat.label); setRenaming(false); }
          }}
        />
      ) : (
        <button className="np-history-chat-main" onClick={() => onSelect(chat.label)}>
          {showIcon && <span className="np-history-chat-icon"><IcChat /></span>}
          <span className="np-history-chat-body">
            <span className="np-history-chat-label">{chat.label}</span>
            <span className="np-history-chat-time">{chat.time}</span>
          </span>
        </button>
      )}
      <div className="np-rel">
        <button
          className="np-history-chat-menu-btn"
          onClick={(e) => { e.stopPropagation(); setMenuOpen(o => !o); }}
          title="Chat options"
          aria-haspopup="true"
        >
          <IcDots />
        </button>
        {menuOpen && (
          <Dropdown onClose={() => setMenuOpen(false)} className="np-dropdown--history-menu">
            <button className="np-dropdown-item" onClick={() => { setMenuOpen(false); onToggleStar(chat.id); }}>
              <IcStar /><span>{chat.starred ? 'Unstar' : 'Star'}</span>
            </button>
            <button className="np-dropdown-item" onClick={() => { setMenuOpen(false); setDraft(chat.label); setRenaming(true); }}>
              <IcRename /><span>Rename</span>
            </button>
            <div className="np-dropdown-sep" />
            <button className="np-dropdown-item danger" onClick={() => { setMenuOpen(false); onRequestDelete(chat); }}>
              <IcTrash /><span>Delete</span>
            </button>
          </Dropdown>
        )}
      </div>
    </div>
  );
}

function HistoryPage({ activeLabel, onBack, onSelect, chats, onRename, onDelete, onToggleStar }) {
  const [query, setQuery] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const q = query.trim().toLowerCase();
  const filtered = q ? chats.filter(c => c.label.toLowerCase().includes(q)) : chats;
  const groups = HISTORY_BUCKETS
    .map(bucket => ({ bucket, items: filtered.filter(c => c.bucket === bucket) }))
    .filter(g => g.items.length > 0);

  const handleDelete = (id) => { onDelete(id); setConfirmDelete(null); };

  return (
    <div className="nav-history-page">
      <div className="nav-history-page-hdr">
        <button className="nav-history-back-btn" onClick={onBack}>
          <IcArrowLeft /> Back
        </button>
        <h2 className="nav-history-page-title">History</h2>
      </div>

      <div className="nav-history-page-body">
        <div className="ds-pill-search nav-history-search">
          <span className="ds-pill-search__icon"><IcSearchSm /></span>
          <input
            className="ds-pill-search__input"
            type="text"
            placeholder="Search conversations…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
        </div>

        {groups.length === 0 ? (
          <div className="nav-history-empty">
            <p className="nav-history-empty-title">No conversations found</p>
            <p className="nav-history-empty-sub">Try a different search term.</p>
          </div>
        ) : (
          groups.map(g => (
            <div key={g.bucket} className="np-history-section">
              <div className="np-history-section-hdr">
                <span className="np-history-section-title">{g.bucket}</span>
              </div>
              {g.items.map(c => (
                <HistoryRow
                  key={c.id}
                  chat={c}
                  active={c.label === activeLabel}
                  onSelect={onSelect}
                  onRename={onRename}
                  onRequestDelete={setConfirmDelete}
                  onToggleStar={onToggleStar}
                />
              ))}
            </div>
          ))
        )}
      </div>

      {confirmDelete && (
        <div className="ds-modal-overlay">
          <div className="ds-modal" role="dialog" aria-modal="true">
            <div className="ds-modal-header">
              <span className="ds-modal-title nav-delete-modal-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  <line x1="10" y1="11" x2="10" y2="17"/>
                  <line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
                Delete Conversation
              </span>
              <button className="ds-modal-close" onClick={() => setConfirmDelete(null)} aria-label="Close">×</button>
            </div>
            <div className="ds-modal-body"><span>Are you sure you want to delete <strong>{confirmDelete.label}</strong>? This action cannot be undone.</span></div>
            <div className="ds-modal-footer">
              <button className="ds-btn sz-md t-outline" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="ds-btn sz-md t-danger" onClick={() => handleDelete(confirmDelete.id)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Home / AI prompt view ────────────────────────────────────────────
const MODE_DEFS = [
  { id: 'ask',      label: 'Ask'      },
  { id: 'research', label: 'Research' },
  { id: 'build',    label: 'Build'    },
];

const MODE_PLACEHOLDERS = {
  ask:      'Ask about findings, identities, hosts, CVEs, compliance…',
  research: 'What do you want to research in depth?',
  build:    'Describe a dashboard, e.g. “critical findings by host and source”…',
};

const SAMPLE_BUILDS = [
  { cat: 'expose',  q: 'Critical findings by host and data source' },
  { cat: 'cloud',   q: 'Cloud account exposure and misconfigurations' },
  { cat: 'ident',   q: 'Identity and access risk overview' },
  { cat: 'trend',   q: 'Findings trend over time by severity' },
  { cat: 'cve',     q: 'Top CVEs affecting my infrastructure' },
  { cat: 'summary', q: 'Compliance posture across all frameworks' },
];

const SAMPLE_RESEARCH = [
  'Investigate the root cause of repeated SSH exposure across production hosts',
  'Compare our exposure trend against last quarter and explain the drivers',
  'Research emerging threat actors targeting our industry',
  'Deep-dive into identity risk across all privileged accounts',
];

// Sample prompts shown on HomeView, keyed by the active Ask/Research/Build mode.
const SAMPLE_QS_BY_MODE = {
  ask:      SAMPLE_QUERIES,
  research: SAMPLE_RESEARCH.map(q => ({ cat: null, q })),
  build:    SAMPLE_BUILDS.slice(0, 4).map(s => ({ cat: null, q: s.q })),
};

const BUILD_SUGGESTIONS = [
  { id: 'bs1', label: 'Critical findings count',  chartId: 'kpi'     },
  { id: 'bs2', label: 'Findings by source',        chartId: 'hor-bar' },
  { id: 'bs3', label: 'Top affected hosts',        chartId: 'table'   },
  { id: 'bs4', label: 'Severity breakdown',        chartId: 'pie'     },
  { id: 'bs5', label: 'Findings over time',        chartId: 'line'    },
];

// ── Persistent left sidebar — History (Starred + recent) and Agents live
// here at all times, next to the (auto-collapsed) app LeftNav, instead of
// behind the old per-view "History"/"Agents" buttons and their full-page
// detours. Collapses to a slim icon rail rather than disappearing, so it
// never has to cover Home/Chat/Build to be reached.
function NavSidebar({
  collapsed, onToggleCollapse, onNewChat,
  chats, activeLabel, onSelectChat, onToggleStar, onRename, onDelete, onViewAllChats,
  agents, onRunAgent, onCreateAgent, onViewAllAgents,
}) {
  const starred = chats.filter(c => c.starred);
  const recent = chats.filter(c => !c.starred).slice(0, 6);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const agentMeta = (a) => {
    if (a.triggerType === 'manual') return 'Manual';
    const freq = SCHEDULE_FREQUENCIES.find(f => f.id === a.scheduleFreq)?.label || 'Scheduled';
    return a.scheduleTime ? `${freq} · ${a.scheduleTime}` : freq;
  };

  const renderChatRow = (c) => collapsed ? (
    <button
      key={c.id}
      className="np-hist-chat-row-collapsed"
      title={c.label}
      aria-label={c.label}
      onClick={() => onSelectChat(c.label)}
    >
      <IcChat />
    </button>
  ) : (
    <HistoryRow
      key={c.id}
      chat={c}
      active={c.label === activeLabel}
      onSelect={onSelectChat}
      onRename={onRename}
      onRequestDelete={setConfirmDelete}
      onToggleStar={onToggleStar}
      showIcon={false}
    />
  );

  return (
    <div className={`np-hist-sidebar${collapsed ? ' collapsed' : ''}`} aria-label="Chat history and agents">
      <div className="np-hist-sidebar-body">
        {collapsed ? (
          <div className="np-history-hdr np-history-hdr--collapsed">
            <button className="np-hist-newchat-collapsed" onClick={onNewChat} title="New chat" aria-label="New chat">
              <IcEdit />
            </button>
          </div>
        ) : (
          <div className="np-history-hdr">
            <button className="np-history-new-btn" onClick={onNewChat}>
              <IcEdit /> New chat
            </button>
          </div>
        )}

        {starred.length > 0 && (
          <>
            <div className="np-history-section">
              <div className="np-history-section-hdr">
                {collapsed
                  ? <span className="np-history-section-title" title="Starred"><IcStar /></span>
                  : <span className="np-history-section-title"><IcStar /> Starred</span>}
              </div>
              {starred.map(renderChatRow)}
            </div>
            <div className="np-history-divider" />
          </>
        )}

        <div className="np-history-section">
          <div className="np-history-section-hdr">
            {collapsed
              ? <span className="np-history-section-title" title="History"><IcHistory /></span>
              : <span className="np-history-section-title"><IcHistory /> History</span>}
          </div>
          {recent.map(renderChatRow)}
          {!collapsed && (
            <button className="np-history-viewall" onClick={onViewAllChats}>
              <IcHistory /> View all conversations
            </button>
          )}
        </div>

        <div className="np-history-divider" />

        <div className="np-history-section">
          <div className="np-history-section-hdr">
            {collapsed
              ? <span className="np-history-section-title" title="Agents"><IcBot /></span>
              : <span className="np-history-section-title"><IcBot /> Agents</span>}
            {!collapsed && (
              <button className="np-history-add-btn" onClick={onCreateAgent} aria-label="Create agent">
                <IcPlus />
              </button>
            )}
          </div>
          {agents.slice(0, 5).map((a) => collapsed ? (
            <button key={a.id} className="np-hist-agent-row-collapsed" title={a.name} aria-label={a.name} onClick={() => onRunAgent(a)}>
              <IcBot />
            </button>
          ) : (
            <button key={a.id} className="np-history-agent-row" onClick={() => onRunAgent(a)}>
              <span className="np-history-agent-body">
                <span className="np-history-agent-name">{a.name}</span>
                <span className="np-history-agent-meta">{agentMeta(a)}</span>
              </span>
            </button>
          ))}
          {!collapsed && (
            <button className="np-history-viewall" onClick={onViewAllAgents}>
              <IcBot /> View all agents
            </button>
          )}
        </div>
      </div>

      <div className="np-collapse-row">
        <button
          className={`np-collapse-btn${collapsed ? ' np-collapse-btn--collapsed' : ''}`}
          onClick={onToggleCollapse}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <span className="np-collapse-btn-icon"><IcSidebarCollapse flip={!collapsed} /></span>
          {!collapsed && <span className="np-collapse-btn-label">Collapse</span>}
        </button>
      </div>

      {confirmDelete && (
        <div className="ds-modal-overlay">
          <div className="ds-modal" role="dialog" aria-modal="true">
            <div className="ds-modal-header">
              <span className="ds-modal-title danger">Delete "{confirmDelete.label}"?</span>
              <button className="ds-modal-close" onClick={() => setConfirmDelete(null)} aria-label="Close">×</button>
            </div>
            <div className="ds-modal-body">This conversation will be removed. This can't be undone.</div>
            <div className="ds-modal-footer">
              <button className="ds-btn sz-md t-outline" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="ds-btn sz-md t-danger" onClick={() => { onDelete(confirmDelete.id); setConfirmDelete(null); }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HomeView({ onSend, mode, onModeChange, onOpenAgents, agents }) {
  const [query, setQuery] = useState('');
  const [contextFilters, setContextFilters] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [agentMenuOpen, setAgentMenuOpen] = useState(false);
  const [agentMenuPos, setAgentMenuPos] = useState({ bottom: 0, left: 0 });
  const agentBtnRef = useRef(null);

  const toggleFilter = (pill) => {
    setContextFilters(prev =>
      prev.find(c => c.id === pill.id)
        ? prev.filter(c => c.id !== pill.id)
        : [...prev, pill]
    );
  };

  const removeFilter = (id) => setContextFilters(prev => prev.filter(c => c.id !== id));

  const hasContent = !!query.trim() || contextFilters.length > 0 || !!selectedAgent;

  const handleSend = () => {
    if (!hasContent) return;
    const text = query.trim()
      || selectedAgent?.instructions
      || `Show ${contextFilters.map(c => c.label).join(', ')}`;
    onSend(text, mode, selectedAgent);
    setSelectedAgent(null);
  };

  const pickAgent = (a) => { setSelectedAgent(a); setAgentMenuOpen(false); };

  return (
    <div className="hv-shell">
      <div className="hv-bg">
        <div className="hv-bg-blob hv-bg-blob-1" />
        <div className="hv-bg-blob hv-bg-blob-2" />
      </div>

      <div className="hv-content">
        <div className="hv-title-block">
          <h1 className="hv-greeting">What can I do for you, Natalie?</h1>
          <p className="hv-sub">
            Discover insights with our advanced intelligence capabilities and ask questions relevant to your data
          </p>
        </div>

        <div className="hv-composer-box">
          {contextFilters.length > 0 && (
            <div className="hv-ctx-chips">
              {contextFilters.map(c => (
                <div key={c.id} className="hv-ctx-chip">
                  <span className="hv-ctx-chip-icon"><c.Icon /></span>
                  <span className="hv-ctx-chip-count">{c.count}</span>
                  <span className="hv-ctx-chip-label"> {c.label}</span>
                  <button className="hv-ctx-chip-close" onClick={() => removeFilter(c.id)}>
                    <Ic size={12} path={<><path d="M18 6 6 18M6 6l12 12"/></>} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="hv-tx-input">
            <textarea
              className="hv-composer-ta"
              placeholder={selectedAgent ? `Add instructions for "${selectedAgent.name}" (optional)…` : MODE_PLACEHOLDERS[mode]}
              value={query}
              rows={2}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
              }}
            />
          </div>

          <div className="hv-composer-bar">
            <div className="hv-composer-bar-left">
              <div className="np-rel">
                <button
                  ref={agentBtnRef}
                  className={`np-composer-add${agentMenuOpen ? ' active' : ''}`}
                  onClick={() => {
                    if (!agentMenuOpen && agentBtnRef.current) {
                      const r = agentBtnRef.current.getBoundingClientRect();
                      setAgentMenuPos({ bottom: window.innerHeight - r.top + 6, left: r.left });
                    }
                    setAgentMenuOpen(o => !o);
                  }}
                  aria-label="Use a saved agent"
                  aria-haspopup="menu"
                  aria-expanded={agentMenuOpen}
                  title="Use a saved agent"
                >
                  <IcPlus />
                </button>
                {agentMenuOpen && createPortal(
                  <Dropdown
                    onClose={() => setAgentMenuOpen(false)}
                    className="np-dropdown--agent-menu"
                    style={{ '--np-agent-menu-bottom': `${agentMenuPos.bottom}px`, '--np-agent-menu-left': `${agentMenuPos.left}px` }}
                  >
                    <div className="np-dropdown-label">Agents</div>
                    {agents.length === 0 ? (
                      <button className="np-dropdown-item" onClick={() => { setAgentMenuOpen(false); onOpenAgents(); }}>
                        <IcBot /><span>Create your first agent</span>
                      </button>
                    ) : (
                      agents.map((a, i) => (
                        <button
                          key={a.id}
                          className={`np-dropdown-item${selectedAgent?.id === a.id ? ' selected' : ''}`}
                          onClick={() => pickAgent(a)}
                        >
                          <span className="np-dropdown-agent-dot" style={{ background: AGENT_DOT_VARS[i % AGENT_DOT_VARS.length] }} aria-hidden="true" />
                          {a.name}
                          {selectedAgent?.id === a.id && (
                            <span className="np-dropdown-check"><Ic size={12} path={<><polyline points="20 6 9 17 4 12" /></>} /></span>
                          )}
                        </button>
                      ))
                    )}
                  </Dropdown>,
                  document.body
                )}
              </div>
              {selectedAgent && (
                <span className="np-ctx-chip active">
                  <span className="np-ctx-dot" />
                  {selectedAgent.name}
                  <button className="np-ctx-chip-remove" onClick={() => setSelectedAgent(null)} aria-label={`Remove ${selectedAgent.name}`}>
                    <Ic size={9} path={<><path d="M18 6 6 18M6 6l12 12" /></>} />
                  </button>
                </span>
              )}
              <div className="hv-mode-seg">
                {MODE_DEFS.map(m => (
                  <button
                    key={m.id}
                    className={`hv-mode-seg-item${mode === m.id ? ' active' : ''}`}
                    onClick={() => onModeChange(m.id)}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            <button className="nav-send-btn" disabled={!hasContent} onClick={handleSend}>
              <IcSend />
            </button>
          </div>
        </div>

        <div className="hv-entity-pills">
          {ENTITY_PILLS.map(pill => {
            const isSelected = !!contextFilters.find(c => c.id === pill.id);
            return (
              <button
                key={pill.id}
                className={`hv-entity-pill${isSelected ? ' selected' : ''}`}
                onClick={() => toggleFilter(pill)}
              >
                <span className="hv-entity-pill-icon"><pill.Icon /></span>
                <span className="hv-entity-pill-count">{pill.count}</span>
                <span className="hv-entity-pill-label"> {pill.label}</span>
              </button>
            );
          })}
        </div>

        <div className="hv-sample-qs">
          <span className="sample-queries-label">Try asking</span>
          <div className="hv-sample-qs-list">
            {SAMPLE_QS_BY_MODE[mode].map((s, i) => (
              <button key={i} className="hv-sample-q sample-q-row" onClick={() => onSend(s.q, mode)}>
                <span className="hv-sample-q-text">{s.q}</span>
                <span className="hv-sample-q-icon"><IcChevR /></span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="hv-disclaimer">Navigator uses your connected data sources. Verify critical findings independently.</p>
    </div>
  );
}

// ── One chat turn — user bubble + AI card housing the reasoning engine ──
const IcArrowRight = () => <Ic size={13} path={<><path d="M5 12h14M12 5l7 7-7 7" /></>} />;

function FollowUpItem({ text, onClick }) {
  return (
    <button type="button" className="follow-up-item" onClick={onClick}>
      <span className="follow-up-item-icon">
        <Ic size={13} path={<><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></>} />
      </span>
      <span className="follow-up-item-text">{text}</span>
      <span className="follow-up-item-chevron"><IcArrowRight /></span>
    </button>
  );
}

function ExchangeTurn({ exchange, live, updateExchange, phaseCollapsed, onTogglePhase, canvasFocusId, onToggleCanvas, onCanvasAutoOpen, onFollowup, registerEngine }) {
  const engine = useReasoningEngine(exchange, live, updateExchange);
  const autoOpenedRef = useRef(false);

  // Fires exactly once per exchange (guarded by the ref, not just the dependency
  // array) so it can never re-open the canvas after the user has explicitly hidden
  // it — including if this component were ever remounted.
  useEffect(() => {
    if (autoOpenedRef.current) return;
    if (live && exchange.done && exchange.canvasOpen && canvasFocusId !== exchange.id) {
      autoOpenedRef.current = true;
      onCanvasAutoOpen(exchange.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, exchange.done, exchange.canvasOpen]);

  useEffect(() => {
    registerEngine(exchange.id, engine);
  }, [exchange.id, engine, registerEngine]);

  if (exchange.chitChat) {
    return (
      <>
        <div className="cv-msg cv-msg--user-row">
          <div className="cv-user-group">
            <div className="cv-user-bubble">
              <p className="cv-user-text">{exchange.query}</p>
              <span className="cv-bubble-time">{exchange.time}</span>
            </div>
          </div>
        </div>
        <div className="cv-msg cv-msg--ai">
          <div className="cv-msg-avatar cv-msg-avatar--ai" aria-hidden="true">
            <img src="assets/icons/Navigator icon.svg" width={13} height={13} alt="" />
          </div>
          <div className="cv-ai-card">
            <p className="cv-ai-text">{exchange.reply}</p>
          </div>
        </div>
      </>
    );
  }

  const isCanvasTier = !TEXT_ONLY_TIERS.includes(exchange.tier);
  const introText = exchange.done
    ? (INTRO_COMPLETION_MESSAGES[exchange.tier] || INTRO_COMPLETION_MESSAGES.quick)
    : "I'll help you identify vulnerable assets. Let me analyze your request…";

  const localPhaseCollapsed = {};
  Object.keys(phaseCollapsed).forEach(k => {
    if (k.startsWith(exchange.id + ':')) localPhaseCollapsed[k.slice(exchange.id.length + 1)] = phaseCollapsed[k];
  });

  return (
    <>
      <div className="cv-msg cv-msg--user-row">
        <div className="cv-user-group">
          <div className="cv-user-bubble">
            <p className="cv-user-text">{exchange.query}</p>
            <span className="cv-bubble-time">{exchange.time}</span>
          </div>
        </div>
        {isCanvasTier && (
          <button className="cv-canvas-btn" onClick={() => onToggleCanvas(exchange.id)}>
            <IcCanvasView />
            {canvasFocusId === exchange.id ? 'Hide Canvas' : 'View in Canvas'}
          </button>
        )}
      </div>

      <div className="cv-msg cv-msg--ai">
        <div className="cv-msg-avatar cv-msg-avatar--ai" aria-hidden="true">
          <img src="assets/icons/Navigator icon.svg" width={13} height={13} alt="" />
        </div>
        <div className="cv-ai-body">
          <div className="cv-ai-card">
            <p className="cv-ai-text">
              {exchange.done && <Ic size={13} path={<><polyline points="20 6 9 17 4 12" /></>} />} {introText}
            </p>

            <ReasoningEngine
              exchange={exchange}
              live={live}
              engine={engine}
              phaseCollapsed={localPhaseCollapsed}
              onTogglePhase={(phase) => onTogglePhase(exchange.id, phase)}
            />

            <span className="cv-bubble-time">{exchange.time}</span>
          </div>

          {exchange.done && !isCanvasTier && (
            <div className="cv-answer-card">
              <p className="cv-answer-eyebrow">Answer</p>
              <ExchangeResult tier={exchange.tier} />
            </div>
          )}

          {exchange.done && (
            <>
              <FeedbackRow
                value={exchange.feedback}
                onChange={val => updateExchange(exchange.id, ex => ({ ...ex, feedback: val }))}
              />

              {(FOLLOWUP_SUGGESTIONS[exchange.tier] || []).length > 0 && (
                <div className="explore-section">
                  <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--shell-text-muted)', lineHeight: 'normal', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Explore Further</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {FOLLOWUP_SUGGESTIONS[exchange.tier].map((s, i) => (
                      <FollowUpItem key={i} text={s} onClick={() => onFollowup(s)} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ── Mode / Depth menu — decorative: doesn't change classification/reasoning ──
const MODE_OPTIONS = [
  {
    id: 'agentic', name: 'Agentic Mode',
    desc: 'Runs autonomously end-to-end, only pausing when it truly needs your input.',
    icon: <><path d="M12 2v4" /><path d="m6.4 6.4 2.8 2.8" /><path d="M2 14h4" /><path d="m6.4 21.6 2.8-2.8" /><path d="M12 22v-4" /><path d="m17.6 21.6-2.8-2.8" /><path d="M22 14h-4" /><path d="m17.6 6.4-2.8 2.8" /><circle cx="12" cy="14" r="3" /></>,
  },
  {
    id: 'interactive', name: 'Interactive Mode',
    desc: 'Walks through each step and checks in with you before running tools.',
    icon: <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></>,
  },
];
const DEPTH_LEVELS = [
  { label: 'Quick', time: '≈10 mins' },
  { label: 'Standard', time: '≈30 mins' },
  { label: 'Extensive', time: '≈60 mins' },
];

function ModeMenu({ anchorRect, appliedMode, appliedDepth, onApply, onCancel }) {
  const [pendingMode, setPendingMode] = useState(appliedMode);
  const [pendingDepth, setPendingDepth] = useState(appliedDepth);
  const menuRef = useRef(null);
  const trackRef = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) onCancel();
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setDepthFromClientX = (clientX) => {
    const rect = trackRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    setPendingDepth(ratio < 0.33 ? 0 : ratio < 0.66 ? 1 : 2);
  };

  const handleTrackKeyDown = (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); setPendingDepth(d => Math.max(0, d - 1)); }
    else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); setPendingDepth(d => Math.min(2, d + 1)); }
    else if (e.key === 'Home') { e.preventDefault(); setPendingDepth(0); }
    else if (e.key === 'End') { e.preventDefault(); setPendingDepth(2); }
  };

  const thumbPct = [0, 50, 100][pendingDepth];

  return (
    <div
      className="mode-menu"
      ref={menuRef}
      style={{ position: 'fixed', bottom: window.innerHeight - anchorRect.top + 8, left: anchorRect.left }}
    >
      <div className="mode-menu-inner">
        <div className="mode-menu-section">
          <span className="mode-menu-label">Select Mode</span>
          {MODE_OPTIONS.map(m => (
            <button
              key={m.id}
              className={`mode-option${pendingMode === m.id ? ' selected' : ''}`}
              onClick={() => setPendingMode(m.id)}
            >
              <div className="mode-option-row">
                <span className="mode-option-icon"><Ic size={16} path={m.icon} /></span>
                <span className="mode-option-name">{m.name}</span>
              </div>
              <span className="mode-option-desc">{m.desc}</span>
            </button>
          ))}
        </div>

        <div className="mode-depth-section">
          <span className="mode-menu-label">Depth of Analysis</span>
          <div className="mode-depth-slider-wrap">
            <div className="mode-depth-labels">
              {DEPTH_LEVELS.map((d, i) => (
                <button
                  key={i}
                  type="button"
                  className={`mode-depth-label${pendingDepth === i ? ' active' : ''}`}
                  onClick={() => setPendingDepth(i)}
                >
                  {d.label}
                </button>
              ))}
            </div>
            <div
              className="mode-depth-track-wrap"
              ref={trackRef}
              onClick={(e) => setDepthFromClientX(e.clientX)}
              onKeyDown={handleTrackKeyDown}
              role="slider"
              tabIndex={0}
              aria-label="Depth of analysis"
              aria-valuemin={0}
              aria-valuemax={2}
              aria-valuenow={pendingDepth}
              aria-valuetext={DEPTH_LEVELS[pendingDepth].label}
            >
              <div className="mode-depth-track">
                <div className="mode-depth-fill" style={{ width: `${thumbPct}%` }} />
                <div className="mode-depth-thumb" style={{ left: `calc(${thumbPct}% - 5px)` }} />
              </div>
            </div>
            <div className="mode-depth-times">
              {DEPTH_LEVELS.map((d, i) => (
                <span key={i} className={`mode-depth-time${pendingDepth === i ? ' active' : ''}`}>{d.time}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="mode-menu-footer">
          <button className="mode-cancel-btn" onClick={onCancel}>Cancel</button>
          <button className="ds-btn sz-sm t-primary" onClick={() => onApply(pendingMode, pendingDepth)}>Apply</button>
        </div>
      </div>
    </div>
  );
}

// ── Chat view — reasoning-engine driven conversation ─────────────────
function ChatView({ query, mode = 'ask', onGoHome, onNav, runningAgent }) {
  const [followUp, setFollowUp] = useState('');
  const [exchanges, setExchanges] = useState(() => [createExchange(query, { mode })]);
  const [liveId, setLiveId] = useState(() => exchanges[0].id);
  const [phaseCollapsed, setPhaseCollapsed] = useState({});
  const [canvasFocusId, setCanvasFocusId] = useState(null);
  const [chatWidth, setChatWidth] = useState(null);
  const [appliedMode, setAppliedMode] = useState('interactive');
  const [appliedDepth, setAppliedDepth] = useState(1);
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const [threadMenuOpen, setThreadMenuOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [confirmDeleteThread, setConfirmDeleteThread] = useState(false);
  const { showToast } = useToast();
  const splitRef = useRef(null);
  const messagesEndRef = useRef(null);
  const modeTriggerRef = useRef(null);
  const engineRegistry = useRef({});

  const registerEngine = useCallback((id, eng) => { engineRegistry.current[id] = eng; }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [exchanges.length]);

  const updateExchange = useCallback((id, fn) => {
    setExchanges(prev => prev.map(ex => ex.id === id ? fn(ex) : ex));
  }, []);

  const appendExchange = (q) => {
    const ex = createExchange(q, { mode });
    setExchanges(prev => [...prev, ex]);
    setLiveId(ex.id);
  };

  const handleSend = () => {
    const q = followUp.trim();
    if (!q) return;
    setFollowUp('');
    appendExchange(q);
  };

  const handleFollowup = (q) => appendExchange(q);

  const handleTogglePhase = (exId, phase) => {
    setPhaseCollapsed(prev => ({ ...prev, [`${exId}:${phase}`]: !prev[`${exId}:${phase}`] }));
  };

  const handleToggleCanvas = (exId) => {
    setCanvasFocusId(prev => (prev === exId ? null : exId));
  };

  const canvasExchange = exchanges.find(ex => ex.id === canvasFocusId) || null;

  const handleCanvasFeedback = (val) => {
    if (!canvasExchange) return;
    updateExchange(canvasExchange.id, ex => ({ ...ex, canvasFeedback: val }));
  };

  const handleDrag = (deltaX) => {
    setChatWidth(w => {
      const cur = w ?? 560;
      const total = splitRef.current ? splitRef.current.clientWidth : 1200;
      return Math.max(300, Math.min(cur + deltaX, total - 320));
    });
  };

  const liveExchange = exchanges.find(ex => ex.id === liveId) || null;
  const canStop = liveExchange && !liveExchange.chitChat && !liveExchange.done;
  const handleStop = () => { engineRegistry.current[liveId]?.stop(); updateExchange(liveId, ex => ({ ...ex, done: true, reasoningCollapsed: true })); };

  const threadTitle = customTitle || exchanges[0]?.query;

  const handleCopyLink = () => {
    setThreadMenuOpen(false);
    navigator.clipboard?.writeText(window.location.href)
      .then(() => showToast({ type: 'success', msg: 'Link copied to clipboard.' }))
      .catch(() => {});
  };

  const titleBar = (
    <div className="chat-space-title">
      {editingTitle ? (
        <input
          className="chat-space-title-input"
          value={threadTitle}
          autoFocus
          onChange={e => setCustomTitle(e.target.value)}
          onFocus={e => e.target.select()}
          onBlur={() => setEditingTitle(false)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') setEditingTitle(false); }}
        />
      ) : (
        <button className="chat-space-title-text chat-space-title-btn" onClick={() => setEditingTitle(true)} title="Rename thread">
          {threadTitle}
        </button>
      )}
      {mode === 'research' && <span className="ds-badge info" title="Research runs deeper, multi-source analysis on every question in this thread">Research</span>}
      {runningAgent && <span className="ds-badge info" title={runningAgent.description || runningAgent.instructions}>Agent: {runningAgent.name}</span>}
      <div className="chat-space-title-actions">
        <HomeButton onClick={onGoHome} />
        <button className="np-thread-menu-btn" title="Thread options" onClick={(e) => { e.stopPropagation(); setThreadMenuOpen(o => !o); }}>
          <IcDots />
        </button>
        {threadMenuOpen && (
          <Dropdown onClose={() => setThreadMenuOpen(false)} className="np-dropdown--thread-menu">
            <button className="np-dropdown-item" onClick={() => { setThreadMenuOpen(false); setEditingTitle(true); }}>
              <IcRename /><span>Rename thread</span>
            </button>
            <button className="np-dropdown-item" onClick={handleCopyLink}>
              <IcShare /><span>Copy link</span>
            </button>
            <div className="np-dropdown-sep" />
            <button className="np-dropdown-item danger" onClick={() => { setThreadMenuOpen(false); setConfirmDeleteThread(true); }}>
              <IcTrash /><span>Delete thread</span>
            </button>
          </Dropdown>
        )}
      </div>

      {confirmDeleteThread && (
        <div className="ds-modal-overlay">
          <div className="ds-modal" role="dialog" aria-modal="true">
            <div className="ds-modal-header">
              <span className="ds-modal-title nav-delete-modal-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  <line x1="10" y1="11" x2="10" y2="17"/>
                  <line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
                Delete Thread
              </span>
              <button className="ds-modal-close" onClick={() => setConfirmDeleteThread(false)} aria-label="Close">×</button>
            </div>
            <div className="ds-modal-body"><span>Are you sure you want to delete <strong>{threadTitle}</strong>? This action cannot be undone.</span></div>
            <div className="ds-modal-footer">
              <button className="ds-btn sz-md t-outline" onClick={() => setConfirmDeleteThread(false)}>Cancel</button>
              <button className="ds-btn sz-md t-danger" onClick={() => { setConfirmDeleteThread(false); onGoHome(); }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const messagesBlock = (
    <div className="cv-messages">
      {exchanges.map(ex => (
        <ExchangeTurn
          key={ex.id}
          exchange={ex}
          live={ex.id === liveId}
          updateExchange={updateExchange}
          phaseCollapsed={phaseCollapsed}
          onTogglePhase={handleTogglePhase}
          canvasFocusId={canvasFocusId}
          onToggleCanvas={handleToggleCanvas}
          onCanvasAutoOpen={setCanvasFocusId}
          onFollowup={handleFollowup}
          registerEngine={registerEngine}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );

  const composerBlock = (
    <div className="cv-bottom">
      <div className="cv-composer-box">
        <textarea
          className="cv-composer-ta"
          placeholder="Create a new workspace or ask anything"
          value={followUp}
          onChange={e => setFollowUp(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
          }}
        />
        <div className="cv-composer-bar">
          <button
            className="np-mode-chip"
            ref={modeTriggerRef}
            onClick={() => setModeMenuOpen(o => !o)}
            aria-haspopup="true"
            aria-expanded={modeMenuOpen}
          >
            <IcSettings />
            {appliedMode === 'agentic' ? 'Agentic' : 'Interactive'} · {DEPTH_LEVELS[appliedDepth].label}
          </button>
          {canStop ? (
            <button className="nav-send-btn" onClick={handleStop} title="Stop generating">
              <span className="nav-stop-icon" />
            </button>
          ) : (
            <button className="nav-send-btn" disabled={!followUp.trim()} onClick={handleSend}>
              <IcSend />
            </button>
          )}
        </div>
      </div>
      <p className="cv-disclaimer">Always review the accuracy of responses.</p>
      {modeMenuOpen && modeTriggerRef.current && (
        <ModeMenu
          anchorRect={modeTriggerRef.current.getBoundingClientRect()}
          appliedMode={appliedMode}
          appliedDepth={appliedDepth}
          onApply={(m, d) => { setAppliedMode(m); setAppliedDepth(d); setModeMenuOpen(false); }}
          onCancel={() => setModeMenuOpen(false)}
        />
      )}
    </div>
  );

  // .chat-split/.chat-panel stay mounted in both modes (only their class/style
  // changes) — see the CSS comment above .chat-panel--full for why: conditionally
  // adding/removing these wrapper elements unmounts and remounts every ExchangeTurn
  // underneath, which re-runs the "auto-open canvas" effect on mount and immediately
  // undoes a "Hide Canvas" click.
  return (
    <div className="cv-shell">
      {titleBar}
      <div className={`chat-split${canvasExchange ? '' : ' chat-split--single'}`} ref={splitRef}>
        <div className={`chat-panel${canvasExchange ? '' : ' chat-panel--full'}`} style={canvasExchange && chatWidth ? { width: chatWidth } : undefined}>
          {messagesBlock}
          {composerBlock}
        </div>
        {canvasExchange && (
          <>
            <ChatDragger onDrag={handleDrag} />
            <CanvasPanel
              exchange={canvasExchange}
              onFeedback={handleCanvasFeedback}
              onAddToWorkspace={({ widgets, name }) => onNav?.('workspace-dashboard-seed', { widgets, name })}
            />
          </>
        )}
      </div>
    </div>
  );
}

// ── Widget type + source lists ───────────────────────────────────────
// Chart types offered while building — a curated subset of Workspace's full
// CHART_TYPES (DashboardCanvas.jsx), since Build mode's picker only needs the
// shapes a chat-driven quick dashboard actually reaches for.
const BUILD_CHART_TYPES = [
  { id: 'kpi',      label: 'KPI'   },
  { id: 'hor-bar',  label: 'Bar'   },
  { id: 'line',     label: 'Line'  },
  { id: 'pie',      label: 'Pie'   },
  { id: 'table',    label: 'Table' },
];

// ── Mock data shaped for ChartRender (components/ChartRender.jsx) — the same
// renderer Workspace's DashboardCanvas uses, so a widget looks identical
// whether it was built here or added manually in Workspace.
function buildMockWidgetData(chartId, label) {
  const t = (label || '').toLowerCase();
  if (chartId === 'kpi') {
    const value = t.includes('critical') ? '247' : t.includes('high') ? '613' : t.includes('host') ? '842' : '1,204';
    return { value, label, trend: '↑ 12%', trendUp: true };
  }
  if (chartId === 'hor-bar') {
    return [
      { label: 'CrowdStrike', value: 87 },
      { label: 'Azure',       value: 62 },
      { label: 'MS Intune',   value: 45 },
      { label: 'Qualys',      value: 38 },
      { label: 'Tenable',     value: 15 },
    ];
  }
  if (chartId === 'pie') {
    const raw = [
      { label: 'Critical', value: 42  },
      { label: 'High',     value: 87  },
      { label: 'Medium',   value: 134 },
      { label: 'Low',      value: 63  },
      { label: 'Info',     value: 21  },
    ];
    const total = raw.reduce((s, d) => s + d.value, 0);
    return raw.map(d => ({ ...d, count: d.value.toLocaleString(), pct: `${Math.round((d.value / total) * 100)}%` }));
  }
  if (chartId === 'table') {
    return [
      { category: 'vm-prod-42',     count: '14', pct: '3 critical' },
      { category: 'db-prod-01',     count: '11', pct: '2 critical' },
      { category: 'api-gateway-02', count: '9',  pct: '1 critical' },
      { category: 'web-prod-07',    count: '7',  pct: '1 critical' },
    ];
  }
  return undefined; // 'line' renders ChartRender's own placeholder series, same as Workspace
}

export function detectChartId(text) {
  const t = (text || '').toLowerCase();
  if (/\bkpi\b|^how many\b|count\b|total\b|\bnumber of\b/.test(t)) return 'kpi';
  if (/pie|donut|breakdown|proportion|percent|split/.test(t))       return 'pie';
  if (/line|trend|over time|timeline|by month|by week/.test(t))     return 'line';
  if (/bar|by source|by data source|distribution/.test(t))          return 'hor-bar';
  return 'table';
}

const BUILD_WIDGET_SIZE_SPAN = { small: 1, medium: 2, large: 3, xlarge: 4 };

export function buildWidgetSpec(chartId, label, idSeq) {
  const sizeId = chartId === 'kpi' ? 'small' : 'medium';
  return {
    id: idSeq,
    label,
    chartId,
    span: BUILD_WIDGET_SIZE_SPAN[sizeId],
    sizeId,
    heightId: 'medium',
    phase: 'active',
    data: buildMockWidgetData(chartId, label),
  };
}

// ── Intent parser — determines if a message should create a widget ───
// Strips the request-phrasing ("Add a pie chart for…") down to just the
// subject, so the widget's title reads like a chart caption ("Severity
// breakdown") instead of the literal sentence the user typed.
export function cleanWidgetTitle(text) {
  let t = text.trim();
  t = t.replace(/^(add|show|create|build|give me)\s+/i, '');
  t = t.replace(/^(a|an|the)\s+/i, '');
  t = t.replace(/^(kpi|pie|donut|line|bar|table)\s*(chart|graph|table)?\s*(for|of|showing)?\s*/i, '');
  t = t.replace(/^(chart|graph)\s+(for|of|showing)?\s*/i, '');
  t = t.trim();
  if (!t) return text;
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export function parseWidgetIntent(text) {
  const t = text.toLowerCase();
  const addVerb   = /^(add|show|create|build|give me)\b/.test(t);
  const chartWord = /\b(chart|graph|trend|breakdown|distribution|over time)\b/.test(t);
  const dataList  = /\b(findings|hosts|cves|identities|accounts|severity)\b/.test(t);
  const countWord = /\b(how many|count|total|top \d|list)\b/.test(t);
  if (addVerb || chartWord || (dataList && countWord)) {
    return { create: true, chartId: detectChartId(t), title: cleanWidgetTitle(text) };
  }
  return { create: false };
}

// ── Chat context bar — only shown when a widget is selected ─────────
function BuildContextBar({ selectedWidget, onTypeChange, onDone }) {
  const [typeOpen, setTypeOpen] = useState(false);

  if (!selectedWidget) return null;

  const currentType = BUILD_CHART_TYPES.find(t => t.id === selectedWidget.chartId) || BUILD_CHART_TYPES[0];

  return (
    <div className="build-ctx-bar">
      <div className="build-ctx-row">
        <span className={`build-ctx-type-dot build-ctx-type-dot--${selectedWidget.chartId}`} />
        <span className="build-ctx-widget-name">{selectedWidget.label}</span>

        {/* Type picker */}
        <div className="np-rel">
          <button
            className="build-ctx-ctrl-btn"
            onClick={() => setTypeOpen(v => !v)}
          >
            {currentType.label}
            <IcChevDown />
          </button>
          {typeOpen && (
            <Dropdown onClose={() => setTypeOpen(false)} className="build-ctx-dropdown">
              {BUILD_CHART_TYPES.map(t => (
                <button
                  key={t.id}
                  className={`np-dropdown-item${selectedWidget.chartId === t.id ? ' active' : ''}`}
                  onClick={() => { onTypeChange(t.id); setTypeOpen(false); }}
                >
                  {t.label}
                </button>
              ))}
            </Dropdown>
          )}
        </div>

        <button className="build-ctx-done-btn" onClick={onDone}>Done</button>
      </div>
    </div>
  );
}

const IcWidgetReady = () => <Ic size={13} path={<><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></>} />;

// ── One Build-mode chat turn — same reasoning-engine quality as Ask/Research,
// but the "answer" is a widget landing on the canvas to the right rather than
// an inline text/canvas result. `onWidgetReady` fires exactly once per
// exchange (guarded by a ref, mirroring ExchangeTurn's canvas-auto-open guard)
// so the widget materializes the moment its trace finishes — no extra click.
export function BuildExchangeTurn({ exchange, live, updateExchange, onWidgetReady }) {
  const engine = useReasoningEngine(exchange, live, updateExchange);
  const readyFiredRef = useRef(false);

  useEffect(() => {
    if (readyFiredRef.current) return;
    if (exchange.done && exchange.pendingWidget) {
      readyFiredRef.current = true;
      onWidgetReady(exchange.pendingWidget);
    }
  }, [exchange.done, exchange.pendingWidget, onWidgetReady]);

  if (exchange.chitChat) {
    return (
      <>
        <div className="cv-msg cv-msg--user-row">
          <div className="cv-user-group">
            <div className="cv-user-bubble">
              <p className="cv-user-text">{exchange.query}</p>
              <span className="cv-bubble-time">{exchange.time}</span>
            </div>
          </div>
        </div>
        <div className="cv-msg cv-msg--ai">
          <div className="cv-msg-avatar cv-msg-avatar--ai" aria-hidden="true">
            <img src="assets/icons/Navigator icon.svg" width={13} height={13} alt="" />
          </div>
          <div className="cv-ai-card">
            <p className="cv-ai-text">{exchange.reply}</p>
          </div>
        </div>
      </>
    );
  }

  const introText = exchange.done
    ? INTRO_COMPLETION_MESSAGES.build
    : "On it — figuring out the right chart and pulling data…";

  return (
    <>
      <div className="cv-msg cv-msg--user-row">
        <div className="cv-user-group">
          <div className="cv-user-bubble">
            <p className="cv-user-text">{exchange.query}</p>
            <span className="cv-bubble-time">{exchange.time}</span>
          </div>
        </div>
      </div>
      <div className="cv-msg cv-msg--ai">
        <div className="cv-msg-avatar cv-msg-avatar--ai" aria-hidden="true">
          <img src="assets/icons/Navigator icon.svg" width={13} height={13} alt="" />
        </div>
        <div className="cv-ai-body">
          <div className="cv-ai-card">
            <p className="cv-ai-text">
              {exchange.done && <Ic size={13} path={<><polyline points="20 6 9 17 4 12" /></>} />} {introText}
            </p>
            <ReasoningEngine exchange={exchange} live={live} engine={engine} phaseCollapsed={{}} onTogglePhase={() => {}} />
            <span className="cv-bubble-time">{exchange.time}</span>
          </div>
          {exchange.done && exchange.pendingWidget && (
            <p className="build-widget-ready">
              <IcWidgetReady /> Added "{exchange.pendingWidget.label}" to your canvas
            </p>
          )}
        </div>
      </div>
    </>
  );
}

// ── Build view ───────────────────────────────────────────────────────
function BuildView({ initialQuery, onGoHome, onNav }) {
  const [dashName,    setDashName]    = useState('Untitled Dashboard');
  const [editingName, setEditingName] = useState(false);
  const [widgets,          setWidgets]          = useState([]);
  const [selectedWidgetId, setSelectedWidgetId] = useState(null);
  const [confirmDeleteWidget, setConfirmDeleteWidget] = useState(null);
  const selectedWidget = widgets.find(w => w.id === selectedWidgetId) ?? null;
  const widgetIdSeq = useRef(0);
  const nextWidgetId = () => (widgetIdSeq.current += 1);

  // The very first message always describes what to build — the user just
  // picked Build mode specifically to visualize it — so it always produces a
  // widget, unlike later chat turns where parseWidgetIntent has to guess
  // whether a follow-up message is a new widget request or just a question.
  const [exchanges, setExchanges] = useState(() => [
    createExchange(initialQuery, { forceTier: 'build', pendingWidget: buildWidgetSpec(detectChartId(initialQuery), cleanWidgetTitle(initialQuery), nextWidgetId()) }),
  ]);
  const [liveId, setLiveId] = useState(() => exchanges[0].id);
  const [input, setInput] = useState('');
  const [chatWidth, setChatWidth] = useState(null);
  const msgsEndRef = useRef(null);
  const splitRef = useRef(null);

  const handleDrag = (deltaX) => {
    setChatWidth(w => {
      const cur = w ?? 360;
      const total = splitRef.current ? splitRef.current.clientWidth : 1200;
      return Math.max(300, Math.min(cur + deltaX, total - 320));
    });
  };

  useEffect(() => {
    msgsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [exchanges.length]);

  const updateExchange = useCallback((id, fn) => {
    setExchanges(prev => prev.map(ex => ex.id === id ? fn(ex) : ex));
  }, []);

  const handleWidgetReady = useCallback((widget) => {
    setWidgets(prev => [...prev, widget]);
  }, []);

  const handleAddToWorkspace = () => {
    onNav?.('workspace-dashboard-seed', { widgets, name: dashName });
  };

  const handleRemoveWidget = (id) => {
    setWidgets(prev => prev.filter(w => w.id !== id));
    if (id === selectedWidgetId) setSelectedWidgetId(null);
  };

  const requestRemoveWidget = (id) => {
    const w = widgets.find(x => x.id === id);
    if (w) setConfirmDeleteWidget(w);
  };

  const handleSelectWidget = (id) => {
    setSelectedWidgetId(prev => prev === id ? null : id);
  };

  const handleTypeChange = (newChartId) => {
    setWidgets(prev => prev.map(w =>
      w.id === selectedWidgetId
        ? { ...w, chartId: newChartId, data: buildMockWidgetData(newChartId, w.label) }
        : w
    ));
  };

  const appendTextExchange = (query, textReply) => {
    const ex = createExchange(query, { textReply });
    setExchanges(prev => [...prev, ex]);
    setLiveId(ex.id);
  };

  const appendBuildExchange = (query, chartId, title) => {
    const ex = createExchange(query, { forceTier: 'build', pendingWidget: buildWidgetSpec(chartId, title, nextWidgetId()) });
    setExchanges(prev => [...prev, ex]);
    setLiveId(ex.id);
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    if (selectedWidget) {
      appendTextExchange(text, `Noted for "${selectedWidget.label}" — deep widget editing via chat arrives in a future phase.`);
      return;
    }
    const intent = parseWidgetIntent(text);
    if (intent.create) {
      appendBuildExchange(text, intent.chartId, intent.title);
    } else {
      appendTextExchange(text, `If you want to visualize this, try asking me to "add a chart" or pick a suggestion on the canvas.`);
    }
  };

  const handleSuggestion = (s) => {
    appendBuildExchange(`Add ${s.label}`, s.chartId, s.label);
  };

  return (
    <div className="nav-view-build">
      {/* Secondary topbar */}
      <div className="build-topbar">
        <div className="build-name-wrap">
          {editingName ? (
            <input
              className="build-name-input"
              value={dashName}
              autoFocus
              onChange={e => setDashName(e.target.value)}
              onBlur={() => setEditingName(false)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') setEditingName(false); }}
            />
          ) : (
            <button className="build-name-btn" onClick={() => setEditingName(true)}>
              <span className="build-name-text">{dashName}</span>
              <span className="build-name-edit-icon"><IcEdit /></span>
            </button>
          )}
        </div>

        <div className="build-topbar-spacer" />

        <HomeButton onClick={onGoHome} />
      </div>

      {/* Chat + Canvas workspace */}
      <div className="build-workspace" ref={splitRef}>
        {/* Chat pane */}
        <div className="build-chat-pane" style={chatWidth ? { width: chatWidth } : undefined}>
          <div className="build-chat-msgs">
            {exchanges.map(ex => (
              <BuildExchangeTurn
                key={ex.id}
                exchange={ex}
                live={ex.id === liveId}
                updateExchange={updateExchange}
                onWidgetReady={handleWidgetReady}
              />
            ))}
            <div ref={msgsEndRef} />
          </div>

          <BuildContextBar
            selectedWidget={selectedWidget}
            onTypeChange={handleTypeChange}
            onDone={() => setSelectedWidgetId(null)}
          />

          <div className="build-chat-composer">
            <div className="build-composer-box">
              <textarea
                className="build-composer-ta"
                placeholder={selectedWidget
                  ? `Ask about "${selectedWidget.label}" or request changes…`
                  : 'Add a widget, ask a question, or refine the dashboard…'
                }
                value={input}
                rows={1}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
                }}
              />
              <div className="build-composer-bar">
                <button
                  className="nav-send-btn"
                  disabled={!input.trim()}
                  onClick={handleSend}
                >
                  <IcSend />
                </button>
              </div>
            </div>
          </div>
        </div>

        <ChatDragger onDrag={handleDrag} />

        {/* Canvas pane */}
        <div className="build-canvas-pane">
          <div className="build-canvas-hdr">
            <span className="build-canvas-title">Canvas</span>
            <span className="build-widget-count">
              {widgets.length === 0 ? 'No widgets' : `${widgets.length} widget${widgets.length !== 1 ? 's' : ''}`}
            </span>
            <button className="ds-btn sz-sm t-outline" disabled={widgets.length === 0} onClick={handleAddToWorkspace}>
              <Ic size={13} path={<><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" /></>} /> Add to Workspace
            </button>
          </div>
          <div className="build-canvas-content" onClick={() => setSelectedWidgetId(null)}>
            {widgets.length === 0 ? (
              <div className="build-canvas-empty">
                <div className="build-empty-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="7" height="7" rx="1"/>
                    <rect x="14" y="3" width="7" height="7" rx="1"/>
                    <rect x="14" y="14" width="7" height="7" rx="1"/>
                    <rect x="3" y="14" width="7" height="7" rx="1"/>
                  </svg>
                </div>
                <p className="build-empty-title">No widgets yet</p>
                <p className="build-empty-sub">
                  Ask Navigator to add charts, tables, or KPIs —<br />
                  or start from a suggestion below
                </p>
                <div className="build-empty-suggestions">
                  <span className="build-empty-sugg-label">Suggested widgets</span>
                  <div className="build-empty-sugg-chips">
                    {BUILD_SUGGESTIONS.map(s => (
                      <button key={s.id} className="build-sugg-chip" onClick={() => handleSuggestion(s)}>
                        <span className={`build-sugg-type build-sugg-type-${s.chartId}`}>{s.chartId}</span>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="dc-grid" onClick={e => e.stopPropagation()}>
                {widgets.map(w => (
                  <WidgetCard
                    key={w.id}
                    widget={w}
                    isEditing={w.id === selectedWidgetId}
                    onEdit={() => handleSelectWidget(w.id)}
                    onRequestDelete={() => requestRemoveWidget(w.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {confirmDeleteWidget && (
        <div className="ds-modal-overlay">
          <div className="ds-modal" role="dialog" aria-modal="true">
            <div className="ds-modal-header">
              <span className="ds-modal-title nav-delete-modal-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  <line x1="10" y1="11" x2="10" y2="17"/>
                  <line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
                Delete Widget
              </span>
              <button className="ds-modal-close" onClick={() => setConfirmDeleteWidget(null)} aria-label="Close">×</button>
            </div>
            <div className="ds-modal-body"><span>Are you sure you want to delete <strong>{confirmDeleteWidget.label}</strong>? This action cannot be undone.</span></div>
            <div className="ds-modal-footer">
              <button className="ds-btn sz-md t-outline" onClick={() => setConfirmDeleteWidget(null)}>Cancel</button>
              <button className="ds-btn sz-md t-danger" onClick={() => { handleRemoveWidget(confirmDeleteWidget.id); setConfirmDeleteWidget(null); }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Agent Builder ──────────────────────────────────────────────────
// Config-form (not chat-driven, unlike Ask/Research/Build) since creating an
// agent is a one-time setup task, not a query — reuses the same primitives
// as the rest of Navigator (entity pills, MODE_OPTIONS/DEPTH_LEVELS, ds-btn)
// so it reads as part of the same product rather than a bolted-on wizard.
const AGENT_TRIGGER_OPTIONS = [
  { id: 'manual',    name: 'Manual',    desc: 'Runs only when you launch it from Navigator.',       Icon: IcPlay  },
  { id: 'scheduled', name: 'Scheduled', desc: 'Runs automatically on a recurring schedule.',        Icon: IcClock },
];

const SCHEDULE_FREQUENCIES = [
  { id: 'daily',   label: 'Daily'   },
  { id: 'weekly',  label: 'Weekly'  },
  { id: 'monthly', label: 'Monthly' },
];

function AgentBuilderView({ onGoHome, onAgentCreated, onAgentUpdated, editingAgent }) {
  const isEditing = !!editingAgent;
  const [name, setName] = useState(editingAgent?.name || '');
  const [description, setDescription] = useState(editingAgent?.description || '');
  const [instructions, setInstructions] = useState(editingAgent?.instructions || '');
  const [dataAccess, setDataAccess] = useState(editingAgent?.dataAccess || []);
  const [autonomy, setAutonomy] = useState(editingAgent?.autonomy || 'interactive');
  const [depth, setDepth] = useState(editingAgent?.depth ?? 1);
  const [triggerType, setTriggerType] = useState(editingAgent?.triggerType || 'manual');
  const [scheduleFreq, setScheduleFreq] = useState(editingAgent?.scheduleFreq || 'daily');
  const [scheduleTime, setScheduleTime] = useState(editingAgent?.scheduleTime || '09:00');
  const [nameTouched, setNameTouched] = useState(false);
  const [instructionsTouched, setInstructionsTouched] = useState(false);
  const [created, setCreated] = useState(false);

  const nameError = nameTouched && !name.trim() ? 'Agent name is required' : null;
  const instructionsError = instructionsTouched && !instructions.trim()
    ? 'Instructions are required so the agent knows what to do' : null;

  const toggleDataAccess = (pill) => {
    setDataAccess(prev => prev.find(p => p.id === pill.id) ? prev.filter(p => p.id !== pill.id) : [...prev, pill]);
  };

  const handleCreate = () => {
    setNameTouched(true);
    setInstructionsTouched(true);
    if (!name.trim() || !instructions.trim()) return;
    const agentData = {
      name: name.trim(),
      description: description.trim(),
      instructions: instructions.trim(),
      dataAccess,
      autonomy,
      depth,
      triggerType,
      scheduleFreq,
      scheduleTime,
    };
    if (isEditing) {
      onAgentUpdated?.(editingAgent.id, agentData);
      onGoHome();
    } else {
      onAgentCreated?.(agentData);
      setCreated(true);
    }
  };

  const resetForm = () => {
    setName(''); setDescription(''); setInstructions(''); setDataAccess([]);
    setAutonomy('interactive'); setDepth(1); setTriggerType('manual');
    setScheduleFreq('daily'); setScheduleTime('09:00');
    setNameTouched(false); setInstructionsTouched(false); setCreated(false);
  };

  const topbar = (
    <div className="nav-history-page-hdr">
      <button className="nav-history-back-btn" onClick={onGoHome}>
        <IcArrowLeft /> Back
      </button>
      <h2 className="nav-history-page-title">{isEditing ? 'Edit Agent' : 'Create Agent'}</h2>
    </div>
  );

  if (created) {
    const freqLabel = SCHEDULE_FREQUENCIES.find(f => f.id === scheduleFreq)?.label;
    return (
      <div className="nav-view-build">
        {topbar}
        <div className="agb-body agb-body--success">
          <div className="agb-success">
            <span className="agb-success-icon"><IcCheckCircle /></span>
            <h2 className="agb-success-title">"{name}" is ready</h2>
            <p className="agb-success-sub">Your agent has been created with the configuration below.</p>
            <div className="agb-summary-card">
              <div className="agb-summary-row">
                <span className="agb-summary-label">Description</span>
                <span className="agb-summary-value">{description.trim() || '—'}</span>
              </div>
              <div className="agb-summary-row">
                <span className="agb-summary-label">Mode</span>
                <span className="agb-summary-value">{autonomy === 'agentic' ? 'Agentic' : 'Interactive'} · {DEPTH_LEVELS[depth].label}</span>
              </div>
              <div className="agb-summary-row">
                <span className="agb-summary-label">Trigger</span>
                <span className="agb-summary-value">
                  {triggerType === 'manual' ? 'Manual' : `Scheduled · ${freqLabel} at ${scheduleTime}`}
                </span>
              </div>
              <div className="agb-summary-row">
                <span className="agb-summary-label">Data access</span>
                <span className="agb-summary-value">{dataAccess.length ? dataAccess.map(d => d.label).join(', ') : 'None selected'}</span>
              </div>
            </div>
            <div className="agb-success-actions">
              <button className="ds-btn sz-md t-outline" onClick={resetForm}>Create another</button>
              <button className="ds-btn sz-md t-primary" onClick={onGoHome}>Back to Home</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="nav-view-build">
      {topbar}

      <div className="agb-body">
        <div className="agb-intro">
          <span className="agb-intro-icon"><IcBot /></span>
          <div>
            <p className="agb-intro-title">{isEditing ? `Edit "${editingAgent.name}"` : 'Build a custom agent'}</p>
            <p className="agb-intro-sub">Give it a name, tell it what to do, and choose what it can access — then run it on demand or on a schedule.</p>
          </div>
        </div>

        <div className="agb-section">
          <p className="agb-section-title">Basic info</p>
          <div className="ds-input-wrap">
            <label className="ds-input-label">Agent name<span className="agb-required">*</span></label>
            <input
              className={`ds-input-field${nameError ? ' has-error' : ''}`}
              placeholder="e.g. Critical Findings Triage"
              value={name}
              onChange={e => setName(e.target.value)}
              onBlur={() => setNameTouched(true)}
            />
            {nameError && <span className="agb-field-error">{nameError}</span>}
          </div>
          <div className="ds-input-wrap">
            <label className="ds-input-label">Description</label>
            <input
              className="ds-input-field"
              placeholder="One line describing what this agent is for"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
        </div>

        <div className="agb-section">
          <p className="agb-section-title">Instructions<span className="agb-required">*</span></p>
          <p className="agb-section-sub">Describe the agent's behavior and what it should do each time it runs — this drives every response it gives.</p>
          <div className="ds-input-wrap">
            <textarea
              className={`ds-input-field agb-textarea${instructionsError ? ' has-error' : ''}`}
              placeholder="e.g. Every run, check for new critical findings on production hosts, summarize the top 5 by risk, and flag any that lack an owner."
              value={instructions}
              rows={5}
              onChange={e => setInstructions(e.target.value)}
              onBlur={() => setInstructionsTouched(true)}
            />
            {instructionsError && <span className="agb-field-error">{instructionsError}</span>}
          </div>
        </div>

        <div className="agb-section">
          <p className="agb-section-title">Data access</p>
          <p className="agb-section-sub">Choose which entity types this agent is allowed to read from.</p>
          <div className="hv-entity-pills">
            {ENTITY_PILLS.map(pill => {
              const isSelected = !!dataAccess.find(p => p.id === pill.id);
              return (
                <button
                  key={pill.id}
                  type="button"
                  className={`hv-entity-pill${isSelected ? ' selected' : ''}`}
                  onClick={() => toggleDataAccess(pill)}
                >
                  <span className="hv-entity-pill-icon"><pill.Icon /></span>
                  <span className="hv-entity-pill-count">{pill.count}</span>
                  <span className="hv-entity-pill-label"> {pill.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="agb-section">
          <p className="agb-section-title">Autonomy</p>
          <div className="agb-choice-grid">
            {MODE_OPTIONS.map(m => (
              <button
                key={m.id}
                type="button"
                className={`agb-choice-card${autonomy === m.id ? ' selected' : ''}`}
                onClick={() => setAutonomy(m.id)}
              >
                <span className="agb-choice-row">
                  <span className="agb-choice-icon"><Ic size={16} path={m.icon} /></span>
                  <span className="agb-choice-name">{m.name}</span>
                </span>
                <span className="agb-choice-desc">{m.desc}</span>
              </button>
            ))}
          </div>
          <div className="agb-depth-row">
            <span className="ds-input-label">Depth of analysis</span>
            <div className="hv-mode-seg">
              {DEPTH_LEVELS.map((d, i) => (
                <button
                  key={i}
                  type="button"
                  className={`hv-mode-seg-item${depth === i ? ' active' : ''}`}
                  onClick={() => setDepth(i)}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="agb-section">
          <p className="agb-section-title">Trigger</p>
          <div className="agb-choice-grid">
            {AGENT_TRIGGER_OPTIONS.map(t => (
              <button
                key={t.id}
                type="button"
                className={`agb-choice-card${triggerType === t.id ? ' selected' : ''}`}
                onClick={() => setTriggerType(t.id)}
              >
                <span className="agb-choice-row">
                  <span className="agb-choice-icon"><t.Icon /></span>
                  <span className="agb-choice-name">{t.name}</span>
                </span>
                <span className="agb-choice-desc">{t.desc}</span>
              </button>
            ))}
          </div>
          {triggerType === 'scheduled' && (
            <div className="agb-schedule-row">
              <div className="ds-input-wrap">
                <label className="ds-input-label">Frequency</label>
                <select className="ds-input-field" value={scheduleFreq} onChange={e => setScheduleFreq(e.target.value)}>
                  {SCHEDULE_FREQUENCIES.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                </select>
              </div>
              <div className="ds-input-wrap">
                <label className="ds-input-label">Time</label>
                <input
                  type="time"
                  className="ds-input-field"
                  value={scheduleTime}
                  onChange={e => setScheduleTime(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="agb-footer">
        <button className="ds-btn sz-md t-outline" onClick={onGoHome}>Cancel</button>
        <button className="ds-btn sz-md t-primary" onClick={handleCreate}>{isEditing ? 'Save Changes' : 'Create Agent'}</button>
      </div>
    </div>
  );
}

// ── Agents list — "the best way to see agents you've created": a full-width
// overlay page (same pattern as HistoryPage), rendered as a real data table
// (ds-table-wrap/ds-table/TablePagination) rather than plain cards — list
// data belongs in a table per the design system, not a card list. ────────
function AgentRow({ agent: a, dotColor, onRun, onRename, onEdit, onRequestDelete }) {
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(a.name);

  const commitRename = () => {
    setRenaming(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== a.name) onRename(a.id, trimmed);
    else setDraft(a.name);
  };

  const freqLabel = a.scheduleFreq ? (SCHEDULE_FREQUENCIES.find(f => f.id === a.scheduleFreq)?.label || a.scheduleFreq) : null;

  return (
    <tr>
      <td className="ds-td">
        <div className="agp-name-cell">
          <span className="agp-dot" style={{ background: dotColor }} aria-hidden="true" />
          {renaming ? (
            <input
              className="nav-history-rename-input"
              value={draft}
              autoFocus
              onChange={e => setDraft(e.target.value)}
              onFocus={e => e.target.select()}
              onBlur={commitRename}
              onKeyDown={e => {
                if (e.key === 'Enter') commitRename();
                if (e.key === 'Escape') { setDraft(a.name); setRenaming(false); }
              }}
            />
          ) : (
            <span className="agp-name-body">
              <span className="agp-td-name">{a.name}</span>
              {(a.description || a.instructions) && (
                <span className="agp-td-desc" title={a.description || a.instructions}>{a.description || a.instructions}</span>
              )}
            </span>
          )}
        </div>
      </td>
      <td className="ds-td">
        <span className={`ds-badge ${a.autonomy === 'agentic' ? 'info' : 'neutral'}`}>
          {a.autonomy === 'agentic' ? 'Agentic' : 'Interactive'}
        </span>
      </td>
      <td className="ds-td">
        {a.triggerType === 'manual'
          ? <span className="ds-badge neutral">Manual</span>
          : <span className="ds-badge success dot">{freqLabel ? `Scheduled · ${freqLabel}${a.scheduleTime ? ` at ${a.scheduleTime}` : ''}` : 'Scheduled'}</span>
        }
      </td>
      <td className="ds-td lib-td-muted">
        {a.dataAccess?.length
          ? <span className="agp-td-access" title={a.dataAccess.map(d => d.label).join(', ')}>{a.dataAccess.map(d => d.label).join(', ')}</span>
          : '—'
        }
      </td>
      <td className="ds-td">
        <div className="row-actions">
          <button className="ds-icon-btn" title={`Run "${a.name}"`} onClick={() => onRun(a)}>
            <IcPlay />
          </button>
          <button className="ds-icon-btn" title={`Rename "${a.name}"`} onClick={() => { setDraft(a.name); setRenaming(true); }}>
            <IcRename />
          </button>
          <button className="ds-icon-btn" title={`Edit "${a.name}"`} onClick={() => onEdit(a)}>
            <IcEdit />
          </button>
          <button className="ds-icon-btn agp-td-delete" title={`Delete "${a.name}"`} onClick={() => onRequestDelete(a)}>
            <IcTrash />
          </button>
        </div>
      </td>
    </tr>
  );
}

function AgentsListPage({ agents, onBack, onRun, onCreateNew, onDelete, onRename, onEdit }) {
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const start = (page - 1) * rowsPerPage;
  const pageRows = agents.slice(start, start + rowsPerPage);

  return (
    <div className="nav-history-page">
      <div className="nav-history-page-hdr">
        <button className="nav-history-back-btn" onClick={onBack}>
          <IcArrowLeft /> Back
        </button>
        <h2 className="nav-history-page-title">Agents</h2>
        <div className="nav-history-page-hdr-spacer" />
        <button className="ds-btn sz-sm t-primary" onClick={onCreateNew}>
          <IcPlus /> New Agent
        </button>
      </div>

      <div className="nav-history-page-body agp-body">
        <div className="ds-table-wrap">
          <table className="ds-table sz-sm">
            <thead>
              <tr>
                <th className="ds-th">Agent</th>
                <th className="ds-th">Autonomy</th>
                <th className="ds-th">Trigger</th>
                <th className="ds-th">Data access</th>
                <th className="ds-th" style={{ width: 152 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length > 0 ? pageRows.map((a, i) => (
                <AgentRow
                  key={a.id}
                  agent={a}
                  dotColor={AGENT_DOT_VARS[(start + i) % AGENT_DOT_VARS.length]}
                  onRun={onRun}
                  onRename={onRename}
                  onEdit={onEdit}
                  onRequestDelete={setConfirmDelete}
                />
              )) : (
                <tr>
                  <td colSpan={5} className="lib-no-results">
                    No agents yet — create one to automate a recurring task, then run it here or from the chat composer.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <TablePagination
          total={agents.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={n => { setRowsPerPage(n); setPage(1); }}
        />
      </div>

      {confirmDelete && (
        <div className="ds-modal-overlay">
          <div className="ds-modal" role="dialog" aria-modal="true">
            <div className="ds-modal-header">
              <span className="ds-modal-title nav-delete-modal-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  <line x1="10" y1="11" x2="10" y2="17"/>
                  <line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
                Delete Agent
              </span>
              <button className="ds-modal-close" onClick={() => setConfirmDelete(null)} aria-label="Close">×</button>
            </div>
            <div className="ds-modal-body"><span>Are you sure you want to delete <strong>{confirmDelete.name}</strong>? This action cannot be undone.</span></div>
            <div className="ds-modal-footer">
              <button className="ds-btn sz-md t-outline" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="ds-btn sz-md t-danger" onClick={() => { onDelete(confirmDelete.id); setConfirmDelete(null); }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page root ────────────────────────────────────────────────────────

// `resetToken` is bumped by App.jsx every time the LeftNav "Navigator" item
// is clicked, so clicking it always lands back on the Home composer — even
// when `current` is already 'navigator' (mid-chat), where a plain prop
// change wouldn't otherwise cause anything to happen. The very first mount
// skips this: an `initialQuery` (arriving from the docked chat panel's
// "expand to full page" action) should open straight into its chat instead
// of being reset back to Home.
const AGENTS_STORAGE_KEY = 'nav-agents';

export default function NavigatorPage({ initialQuery = '', resetToken = 0, onNav }) {
  const [view, setView]         = useState(initialQuery ? 'chat' : 'home');
  const [activeQuery, setQuery] = useState(initialQuery);
  const [mode, setMode]         = useState('ask');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [agentsOpen, setAgentsOpen] = useState(false);
  const [runningAgent, setRunningAgent] = useState(null);
  const [editingAgent, setEditingAgent] = useState(null);
  const [chats, setChats] = useState(RECENT_CHATS);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [agents, setAgents] = useState(() => {
    try {
      const raw = localStorage.getItem(AGENTS_STORAGE_KEY);
      return raw !== null ? (JSON.parse(raw) || []) : DEFAULT_AGENTS;
    } catch { return DEFAULT_AGENTS; }
  });
  const agentIdSeq = useRef(0);
  const mounted = useRef(false);

  useEffect(() => {
    localStorage.setItem(AGENTS_STORAGE_KEY, JSON.stringify(agents));
  }, [agents]);

  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    if (initialQuery) {
      setMode('ask');
      setQuery(initialQuery);
      setView('chat');
    } else {
      setMode('ask');
      setView('home');
      setQuery('');
    }
    setRunningAgent(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetToken]);

  const handleSend = (q, m, agent) => {
    const sentMode = m ?? mode;
    setQuery(q);
    setRunningAgent(agent || null);
    setView(sentMode === 'build' ? 'build' : 'chat');
  };

  const openHistoryPage = () => { setAgentsOpen(false); setHistoryOpen(true); };

  const goHome = () => { setView('home'); setQuery(''); setRunningAgent(null); };

  const handleRenameChat = (id, label) => setChats(prev => prev.map(c => c.id === id ? { ...c, label } : c));
  const handleDeleteChat = (id) => setChats(prev => prev.filter(c => c.id !== id));
  const handleToggleStarChat = (id) => setChats(prev => prev.map(c => c.id === id ? { ...c, starred: !c.starred } : c));

  const goCreateAgent = () => { setAgentsOpen(false); setEditingAgent(null); setView('agent-builder'); };

  const goEditAgent = (agent) => { setAgentsOpen(false); setEditingAgent(agent); setView('agent-builder'); };

  const backToAgents = () => { setEditingAgent(null); setView('home'); setAgentsOpen(true); };

  const openAgentsList = () => { setHistoryOpen(false); setAgentsOpen(true); };

  const handleAgentCreated = (agentData) => {
    const agent = { id: `agent-${Date.now()}-${++agentIdSeq.current}`, createdAt: Date.now(), ...agentData };
    setAgents(prev => [agent, ...prev]);
  };

  const handleAgentUpdated = (id, agentData) => {
    setAgents(prev => prev.map(a => a.id === id ? { ...a, ...agentData } : a));
  };

  const handleRenameAgent = (id, name) => {
    setAgents(prev => prev.map(a => a.id === id ? { ...a, name } : a));
  };

  const handleDeleteAgent = (id) => setAgents(prev => prev.filter(a => a.id !== id));

  const handleRunAgent = (agent) => {
    setAgentsOpen(false);
    setMode('ask');
    setQuery(agent.instructions);
    setRunningAgent(agent);
    setView('chat');
  };

  const handleSelectChat = (label) => {
    setHistoryOpen(false);
    setQuery(label);
    setView('chat');
  };

  return (
    <div className="nav-page-shell">
      <NavSidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(c => !c)}
        onNewChat={goHome}
        chats={chats}
        activeLabel={view === 'chat' ? activeQuery : null}
        onSelectChat={handleSelectChat}
        onToggleStar={handleToggleStarChat}
        onRename={handleRenameChat}
        onDelete={handleDeleteChat}
        onViewAllChats={openHistoryPage}
        agents={agents}
        onRunAgent={handleRunAgent}
        onCreateAgent={goCreateAgent}
        onViewAllAgents={openAgentsList}
      />
      <div className="nav-page-content-only">
        {view === 'home' && (
          <HomeView onSend={handleSend} mode={mode} onModeChange={setMode} onOpenAgents={openAgentsList} agents={agents} />
        )}
        {view === 'chat' && (
          <ChatView query={activeQuery} mode={mode} onGoHome={goHome} onNav={onNav} runningAgent={runningAgent} />
        )}
        {view === 'build' && (
          <BuildView initialQuery={activeQuery} onGoHome={goHome} onNav={onNav} />
        )}
        {view === 'agent-builder' && (
          <AgentBuilderView
            onGoHome={editingAgent ? backToAgents : goHome}
            onAgentCreated={handleAgentCreated}
            onAgentUpdated={handleAgentUpdated}
            editingAgent={editingAgent}
          />
        )}
        {historyOpen && (
          <HistoryPage
            activeLabel={view === 'chat' ? activeQuery : null}
            onBack={() => setHistoryOpen(false)}
            onSelect={handleSelectChat}
            chats={chats}
            onRename={handleRenameChat}
            onDelete={handleDeleteChat}
            onToggleStar={handleToggleStarChat}
          />
        )}
        {agentsOpen && (
          <AgentsListPage
            agents={agents}
            onBack={() => setAgentsOpen(false)}
            onRun={handleRunAgent}
            onCreateNew={goCreateAgent}
            onDelete={handleDeleteAgent}
            onRename={handleRenameAgent}
            onEdit={goEditAgent}
          />
        )}
      </div>
    </div>
  );
}
