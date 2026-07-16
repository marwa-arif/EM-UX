import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Ic } from '../ui.jsx'
import NavWidget, { detectWidgetType, createWidget } from '../components/NavWidget.jsx'
import Topbar from '../components/Topbar.jsx'
import ReasoningEngine, { createExchange, useReasoningEngine } from '../components/ReasoningEngine.jsx'
import CanvasPanel, { ChatDragger, ExchangeResult, FeedbackRow } from '../components/CanvasPanel.jsx'
import { TEXT_ONLY_TIERS, INTRO_COMPLETION_MESSAGES, FOLLOWUP_SUGGESTIONS } from './navigatorEngine.js'

const RECENT_CHATS = [
  { id: 'c1', label: 'High severity findings for host vm-prod-42' },
  { id: 'c2', label: 'Identities with access to critical storage' },
  { id: 'c3', label: 'Summary of CVE-2024-11891 exposure' },
  { id: 'c4', label: 'Compliance gaps in AWS environment' },
];

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
const CAT_LABELS = {
  quick: 'Quick', graph: 'Graph', risk: 'Risk', deep: 'Deep',
  concept: 'Concept', 'data-dict': 'Schema', summary: 'Summary', web: 'Web',
};
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
const IcArrowL   = () => <Ic size={14} path={<><path d="m15 18-6-6 6-6"/></>} />;
const IcChevR    = () => <Ic size={12} path={<><path d="m9 18 6-6-6-6"/></>} />;
const IcGrid     = () => <Ic size={14} path={<><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></>} />;
const IcChevDown = () => <Ic size={12} path={<><path d="m6 9 6 6 6-6"/></>} />;
const IcPlus     = () => <Ic size={16} path={<><path d="M12 5v14M5 12h14"/></>} />;
const IcSend     = () => <Ic size={16} path={<><path d="m22 2-7 20-4-9-9-4 20-7z"/><path d="M22 2 11 13"/></>} />;
const IcChevD    = () => <Ic size={12} path={<><path d="m6 9 6 6 6-6"/></>} />;
const IcEdit     = () => <Ic size={14} path={<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>} />;
const IcSidebar  = () => <Ic size={14} path={<><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/></>} />;
const IcFloat    = () => <Ic size={14} path={<><rect x="5" y="5" width="14" height="14" rx="2"/><path d="M3 9h2M3 12h2M3 15h2"/></>} />;
const IcFullscr  = () => <Ic size={14} path={<><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></>} />;
const IcDots     = () => <Ic size={15} path={<><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></>} />;
const IcCanvasView = () => <Ic size={14} path={<><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/><path d="M14 9l3 3-3 3"/></>} />;
const IcCheck    = () => <Ic size={13} path={<><polyline points="20 6 9 17 4 12"/></>} />;
const IcRename   = () => <Ic size={14} path={<><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></>} />;
const IcMoveTo   = () => <Ic size={14} path={<><path d="M2 9V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8"/><path d="M2 13v6a2 2 0 0 0 2 2h4"/><path d="M2 13h9"/><path d="m5 10-3 3 3 3"/></>} />;
const IcShare    = () => <Ic size={14} path={<><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"/><path d="M16 6l-4-4-4 4"/><path d="M12 2v13"/></>} />;
const IcPin      = () => <Ic size={14} path={<><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></>} />;
const IcArchive  = () => <Ic size={14} path={<><rect x="2" y="4" width="20" height="5" rx="1"/><path d="M4 9v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9"/><path d="M10 13h4"/></>} />;
const IcTrash    = () => <Ic size={14} path={<><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></>} />;
const IcFeedback = () => <Ic size={14} path={<><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>} />;
const IcHelp     = () => <Ic size={14} path={<><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></>} />;
const IcSearch    = () => <Ic size={14} path={<><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></>} />;
const IcDiscover  = () => <Ic size={14} path={<><circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z"/></>} />;
const IcComponent = () => <Ic size={14} path={<><path d="m5.5 8.5 2.5 2.5-2.5 2.5L3 11l2.5-2.5z"/><path d="m12 2 2.5 2.5L12 7 9.5 4.5 12 2z"/><path d="m18.5 8.5 2.5 2.5-2.5 2.5L16 11l2.5-2.5z"/><path d="m12 15 2.5 2.5L12 20l-2.5-2.5L12 15z"/></>} />;
const IcHistory   = () => <Ic size={14} path={<><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><path d="M12 7v5l4 2"/></>} />;
const IcSettings  = () => <Ic size={14} path={<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06-.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>} />;
const IcVulnerability = () => <Ic size={16} path={<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>} />;
const IcDevice        = () => <Ic size={16} path={<><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></>} />;
const IcCloud         = () => <Ic size={16} path={<><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></>} />;
const IcApp           = () => <Ic size={16} path={<><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 2 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></>} />;
const IcIdentity      = () => <Ic size={16} path={<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>} />;

const ENTITY_PILLS = [
  { id: 'vuln',   label: 'Vulnerability', count: '13,456', Icon: IcVulnerability },
  { id: 'device', label: 'Device',        count: '9,016',  Icon: IcDevice },
  { id: 'cloud',  label: 'Cloud',         count: '19,245', Icon: IcCloud },
  { id: 'app',    label: 'Application',   count: '6,324',  Icon: IcApp },
  { id: 'ident',  label: 'Identity',      count: '10,234', Icon: IcIdentity },
];

const VIEW_MODES = [
  { id: 'sidebar',    label: 'Sidebar',     Icon: IcSidebar },
  { id: 'floating',   label: 'Floating',    Icon: IcFloat   },
  { id: 'fullscreen', label: 'Full screen', Icon: IcFullscr },
];

// ── Click-outside-aware dropdown ─────────────────────────────────────
function Dropdown({ children, onClose, className }) {
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);
  return (
    <div ref={ref} className={`np-dropdown${className ? ` ${className}` : ''}`} role="menu">
      {children}
    </div>
  );
}

// ── Check icon for done steps ────────────────────────────────────────
function IcPanelClose() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.35"/>
      <path d="M5.25 1.5v12" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round"/>
      <path d="M9 5.5 L7 7.5 L9 9.5" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function IcPanelOpen() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.35"/>
      <path d="M5.25 1.5v12" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round"/>
      <path d="M7 5.5 L9 7.5 L7 9.5" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// Up+down arrows — same "switch between options" glyph LeftNav's
// workspace switcher uses, kept in sync for visual parity.
function IcSortCaret() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <path d="M2.5 3.75 5 1.5 7.5 3.75" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2.5 6.25 5 8.5 7.5 6.25" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// Same building-block / EM-dashboard glyphs LeftNav's switcher uses for
// Studio / EM Dashboard, so the mode dropdown reads identically here.
function IcBuildingBlock() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1"   y="1"   width="6" height="6" rx="1.5" fill="currentColor"/>
      <rect x="9"   y="1"   width="6" height="6" rx="1.5" fill="currentColor"/>
      <rect x="1"   y="9"   width="6" height="6" rx="1.5" fill="currentColor"/>
      <rect x="9"   y="9"   width="6" height="6" rx="1.5" fill="currentColor"/>
    </svg>
  );
}
function IcEMDashboard() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="6" height="5" rx="1" fill="currentColor"/>
      <rect x="9" y="1" width="6" height="5" rx="1" fill="currentColor"/>
      <rect x="1" y="8" width="6" height="7" rx="1" fill="currentColor"/>
      <rect x="9" y="8" width="6" height="7" rx="1" fill="currentColor"/>
    </svg>
  );
}

function StepDoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="np-flex-shrink-0">
      <circle cx="8" cy="8" r="7" stroke="var(--pai-green)" strokeWidth="1.5" opacity="0.4" />
      <path d="M5 8l2 2 4-4" stroke="var(--pai-green)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Navigator left panel ─────────────────────────────────────────────
function NavPanel({ collapsed, setCollapsed, onSelectChat, onNewMode, appMode = 'em', onNav, onModeChange }) {
  const isStudio = appMode === 'studio';
  const sourceLabel = isStudio ? 'Studio' : 'EM';
  const [modeOpen, setModeOpen] = useState(false);
  const [threadMenuOpen, setThreadMenuOpen] = useState(null);
  const switcherRef = useRef(null);

  useEffect(() => {
    if (!modeOpen) return;
    const handler = (e) => { if (switcherRef.current && !switcherRef.current.contains(e.target)) setModeOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [modeOpen]);

  const goBack = () => onNav?.(isStudio ? 'studio-home' : 'kg');

  return (
    <div className={`np-panel${collapsed ? ' collapsed' : ''}`}>
      {!collapsed && (
        <div ref={switcherRef} className="leftnav__header">
          <button
            className={`leftnav__switcher${modeOpen ? ' leftnav__switcher--open' : ''}`}
            onClick={() => setModeOpen(o => !o)}
            aria-haspopup="menu"
            aria-expanded={modeOpen}
          >
            <span className="leftnav__switcher-icon">
              {isStudio ? <IcBuildingBlock /> : <IcEMDashboard />}
            </span>
            <span className="leftnav__switcher-text">
              <span className="leftnav__switcher-name">
                {isStudio ? 'Studio' : 'EM Dashboard'}
              </span>
              <span className="leftnav__switcher-sub">
                {isStudio ? 'Data Fabric' : 'Exposure Management'}
              </span>
            </span>
            <span className="leftnav__switcher-caret">
              <IcSortCaret />
            </span>
          </button>

          {modeOpen && (
            <div className="leftnav__mode-dropdown">
              {isStudio ? (
                <button className="leftnav__mode-option" onClick={() => { setModeOpen(false); onModeChange?.('em'); }}>
                  <IcEMDashboard />
                  <span className="leftnav__mode-option-label">EM Dashboard</span>
                </button>
              ) : (
                <button className="leftnav__mode-option" onClick={() => { setModeOpen(false); onModeChange?.('studio'); }}>
                  <IcBuildingBlock />
                  <span className="leftnav__mode-option-label">Studio</span>
                  <span className="leftnav__mode-option-soon">Soon</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <div className="np-body">
        <button className="np-menu-row" onClick={goBack} title={`Back to ${sourceLabel}`}>
          <span className="np-menu-row-icon"><IcArrowL /></span>
          {!collapsed && <span className="np-menu-row-lbl">Back to {sourceLabel}</span>}
        </button>

        <div className="np-divider" />

        <button className="np-menu-row" onClick={() => onNewMode?.('ask')} title="New Thread">
          <span className="np-menu-row-icon"><IcPlus /></span>
          {!collapsed && <span className="np-menu-row-lbl">New Thread</span>}
          {!collapsed && <span className="np-menu-row-kbd">⌘N</span>}
        </button>

        <button className="np-menu-row" title="Search">
          <span className="np-menu-row-icon"><IcSearch /></span>
          {!collapsed && <span className="np-menu-row-lbl">Search</span>}
          {!collapsed && <span className="np-menu-row-kbd">⌘K</span>}
        </button>

        <button className="np-menu-row" title="Discover">
          <span className="np-menu-row-icon"><IcDiscover /></span>
          {!collapsed && <span className="np-menu-row-lbl">Discover</span>}
          {!collapsed && <span className="np-menu-row-kbd">⌘F</span>}
        </button>

        <div className="np-divider" />

        <button className="np-menu-row" onClick={() => onNewMode?.('build')} title="New Project">
          <span className="np-menu-row-icon"><IcPlus /></span>
          {!collapsed && <span className="np-menu-row-lbl">New Project</span>}
          {!collapsed && <span className="np-menu-row-kbd">⌘⇧P</span>}
        </button>

        <button className="np-menu-row" title="Projects">
          <span className="np-menu-row-icon"><IcComponent /></span>
          {!collapsed && <span className="np-menu-row-lbl">Projects</span>}
          {!collapsed && <span className="np-menu-row-kbd">⌘P</span>}
        </button>

        <div className="np-divider" />

        <button className="np-menu-row" title="History">
          <span className="np-menu-row-icon"><IcHistory /></span>
          {!collapsed && <span className="np-menu-row-lbl">History</span>}
          {!collapsed && <span className="np-menu-row-kbd">⌘H</span>}
        </button>

        {!collapsed && RECENT_CHATS.map(c => (
          <div
            key={c.id}
            className={`np-menu-row np-menu-row--thread np-thread-row${threadMenuOpen === c.id ? ' np-thread-row--menu-open' : ''}`}
          >
            <button className="np-thread-row-main" onClick={() => onSelectChat(c.label)}>
              <span className="np-menu-row-lbl np-menu-row-lbl--thread">{c.label}</span>
            </button>
            <div className="np-rel">
              <button
                className="np-thread-menu-btn"
                title="Thread options"
                onClick={(e) => { e.stopPropagation(); setThreadMenuOpen(o => o === c.id ? null : c.id); }}
              >
                <IcDots />
              </button>
              {threadMenuOpen === c.id && (
                <Dropdown onClose={() => setThreadMenuOpen(null)} className="np-dropdown--thread-menu">
                  <button className="np-dropdown-item" onClick={() => setThreadMenuOpen(null)}>
                    <IcShare /><span>Share</span>
                  </button>
                  <button className="np-dropdown-item" onClick={() => setThreadMenuOpen(null)}>
                    <IcRename /><span>Rename</span>
                  </button>
                  <button className="np-dropdown-item" onClick={() => setThreadMenuOpen(null)}>
                    <IcMoveTo /><span>Move to project</span>
                  </button>
                  <button className="np-dropdown-item" onClick={() => setThreadMenuOpen(null)}>
                    <IcPin /><span>Pin chat</span>
                  </button>
                  <button className="np-dropdown-item" onClick={() => setThreadMenuOpen(null)}>
                    <IcArchive /><span>Archive</span>
                  </button>
                  <div className="np-dropdown-sep" />
                  <button className="np-dropdown-item danger" onClick={() => setThreadMenuOpen(null)}>
                    <IcTrash /><span>Delete</span>
                  </button>
                </Dropdown>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="np-footer">
        <button className="np-menu-row" title="Settings">
          <span className="np-menu-row-icon"><IcSettings /></span>
          {!collapsed && <span className="np-menu-row-lbl">Settings</span>}
          {!collapsed && <span className="np-menu-row-kbd">⌘O</span>}
        </button>
      </div>

      <div className="np-collapse-row">
        <button
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`np-collapse-btn${collapsed ? ' np-collapse-btn--collapsed' : ''}`}
        >
          <span className="np-collapse-btn-icon">
            {collapsed ? <IcPanelOpen /> : <IcPanelClose />}
          </span>
          {!collapsed && <span className="np-collapse-btn-label">Collapse</span>}
        </button>
      </div>
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
  { id: 'bs1', label: 'Critical findings count',  type: 'kpi'   },
  { id: 'bs2', label: 'Findings by source',        type: 'bar'   },
  { id: 'bs3', label: 'Top affected hosts',        type: 'table' },
  { id: 'bs4', label: 'Severity breakdown',        type: 'pie'   },
  { id: 'bs5', label: 'Findings over time',        type: 'line'  },
];

const BUILD_INIT_STEPS = [
  'Reading knowledge graph context',
  'Analyzing 2,140 findings across 842 hosts',
  'Planning dashboard layout',
];

function HomeView({ onSend, mode, onModeChange }) {
  const [query, setQuery] = useState('');
  const [contextFilters, setContextFilters] = useState([]);

  const toggleFilter = (pill) => {
    setContextFilters(prev =>
      prev.find(c => c.id === pill.id)
        ? prev.filter(c => c.id !== pill.id)
        : [...prev, pill]
    );
  };

  const removeFilter = (id) => setContextFilters(prev => prev.filter(c => c.id !== id));

  const hasContent = !!query.trim() || contextFilters.length > 0;

  const handleSend = () => {
    if (!hasContent) return;
    const text = query.trim() || `Show ${contextFilters.map(c => c.label).join(', ')}`;
    onSend(text, mode);
  };

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
              placeholder={MODE_PLACEHOLDERS[mode]}
              value={query}
              rows={2}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
              }}
            />
          </div>

          <div className="hv-composer-bar">
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
                {s.cat && <span className={`sample-q-cat ${s.cat}`}>{CAT_LABELS[s.cat]}</span>}
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
    <a className="follow-up-item" onClick={onClick} style={{ cursor: 'pointer' }}>
      <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--shell-raised)', border: '1px solid var(--shell-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Ic size={13} path={<><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></>} />
      </div>
      <span style={{ flex: 1, fontSize: 13, color: 'var(--shell-text-2)', lineHeight: 1.5 }}>{text}</span>
      <span style={{ flexShrink: 0, color: 'var(--shell-text-faint)' }}><IcArrowRight /></span>
    </a>
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
            <img src="/assets/icons/Navigator icon.svg" width={13} height={13} alt="" />
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
          <img src="/assets/icons/Navigator icon.svg" width={13} height={13} alt="" />
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

            {exchange.done && !isCanvasTier && (
              <>
                <div className="cv-ai-divider" />
                <div className="cv-answer-block">
                  <p className="cv-answer-eyebrow">Answer</p>
                  <ExchangeResult tier={exchange.tier} />
                </div>
              </>
            )}
          </div>

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
                <span key={i} className={`mode-depth-label${pendingDepth === i ? ' active' : ''}`} onClick={() => setPendingDepth(i)}>{d.label}</span>
              ))}
            </div>
            <div
              className="mode-depth-track-wrap"
              ref={trackRef}
              onClick={(e) => setDepthFromClientX(e.clientX)}
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
function ChatView({ query }) {
  const [followUp, setFollowUp] = useState('');
  const [exchanges, setExchanges] = useState(() => [createExchange(query)]);
  const [liveId, setLiveId] = useState(() => exchanges[0].id);
  const [phaseCollapsed, setPhaseCollapsed] = useState({});
  const [canvasFocusId, setCanvasFocusId] = useState(null);
  const [chatWidth, setChatWidth] = useState(null);
  const [appliedMode, setAppliedMode] = useState('interactive');
  const [appliedDepth, setAppliedDepth] = useState(1);
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const [threadMenuOpen, setThreadMenuOpen] = useState(false);
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
    const ex = createExchange(q);
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

  const titleBar = (
    <div className="chat-space-title">
      <p className="chat-space-title-text">{exchanges[0]?.query}</p>
      <button className="np-thread-menu-btn" title="Thread options" onClick={(e) => { e.stopPropagation(); setThreadMenuOpen(o => !o); }}>
        <IcDots />
      </button>
      {threadMenuOpen && (
        <Dropdown onClose={() => setThreadMenuOpen(false)} className="np-dropdown--thread-menu">
          <button className="np-dropdown-item" onClick={() => setThreadMenuOpen(false)}>
            <IcMoveTo /><span>Save to project</span>
          </button>
          <button className="np-dropdown-item" onClick={() => setThreadMenuOpen(false)}>
            <IcRename /><span>Rename thread</span>
          </button>
          <button className="np-dropdown-item" onClick={() => { navigator.clipboard?.writeText(window.location.href); setThreadMenuOpen(false); }}>
            <IcShare /><span>Copy link</span>
          </button>
          <div className="np-dropdown-sep" />
          <button className="np-dropdown-item danger" onClick={() => setThreadMenuOpen(false)}>
            <IcTrash /><span>Delete thread</span>
          </button>
        </Dropdown>
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
            <button className="ds-btn sz-sm t-outline" onClick={handleStop} title="Stop generating">
              <span style={{ width: 10, height: 10, background: 'currentColor', borderRadius: 2, display: 'inline-block' }} />
              Stop
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
            <CanvasPanel exchange={canvasExchange} onFeedback={handleCanvasFeedback} />
          </>
        )}
      </div>
    </div>
  );
}

// ── Widget type + source lists ───────────────────────────────────────
const WIDGET_TYPES = [
  { id: 'kpi',   label: 'KPI'   },
  { id: 'bar',   label: 'Bar'   },
  { id: 'line',  label: 'Line'  },
  { id: 'pie',   label: 'Pie'   },
  { id: 'table', label: 'Table' },
];

const WIDGET_SOURCES = [
  { id: 'kg',   label: 'Knowledge Graph' },
  { id: 'dict', label: 'Data Dictionary' },
  { id: 'int',  label: 'Internal'        },
];

// ── Chat context bar — only shown when a widget is selected ─────────
function BuildContextBar({ selectedWidget, onTypeChange, onDone }) {
  const [typeOpen, setTypeOpen] = useState(false);

  if (!selectedWidget) return null;

  const currentType = WIDGET_TYPES.find(t => t.id === selectedWidget.type) || WIDGET_TYPES[0];

  return (
    <div className="build-ctx-bar">
      <div className="build-ctx-row">
        <span className={`build-ctx-type-dot build-ctx-type-dot--${selectedWidget.type}`} />
        <span className="build-ctx-widget-name">{selectedWidget.title}</span>

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
              {WIDGET_TYPES.map(t => (
                <button
                  key={t.id}
                  className={`np-dropdown-item${selectedWidget.type === t.id ? ' active' : ''}`}
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

// ── Intent parser — determines if a message should create a widget ───
function parseWidgetIntent(text) {
  const t = text.toLowerCase();
  const addVerb   = /^(add|show|create|build|give me)\b/.test(t);
  const chartWord = /\b(chart|graph|trend|breakdown|distribution|over time)\b/.test(t);
  const dataList  = /\b(findings|hosts|cves|identities|accounts|severity)\b/.test(t);
  const countWord = /\b(how many|count|total|top \d|list)\b/.test(t);
  if (addVerb || chartWord || (dataList && countWord)) {
    return { create: true, type: detectWidgetType(t), title: text };
  }
  return { create: false };
}

// ── Build view ───────────────────────────────────────────────────────
function BuildView({ initialQuery }) {
  const [dashName,    setDashName]    = useState('Untitled Dashboard');
  const [editingName, setEditingName] = useState(false);
  const [saveState,   setSaveState]   = useState('idle');
  const [widgets,          setWidgets]          = useState([]);
  const [selectedWidgetId, setSelectedWidgetId] = useState(null);
  const selectedWidget = widgets.find(w => w.id === selectedWidgetId) ?? null;
  const [msgs, setMsgs] = useState(() => [
    { id: 'm0', role: 'user', text: initialQuery },
    {
      id: 'm1',
      role: 'ai',
      steps: BUILD_INIT_STEPS,
      text: `I'll build a dashboard for "${initialQuery}". Use the chat to add charts, tables, or KPIs — or tap a suggestion on the canvas.`,
    },
  ]);
  const [input, setInput] = useState('');
  const msgsEndRef = useRef(null);

  useEffect(() => {
    msgsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  const handleSave = () => {
    const dash = { id: `dash-${Date.now()}`, name: dashName, widgets, savedAt: Date.now() };
    const stored = JSON.parse(localStorage.getItem('nav-dashboards') || '[]');
    stored.push(dash);
    localStorage.setItem('nav-dashboards', JSON.stringify(stored));
    setSaveState('saved');
    setTimeout(() => setSaveState('idle'), 2000);
  };

  const appendMsgs = (userText, aiText) => {
    const id = String(Date.now());
    setMsgs(prev => [
      ...prev,
      { id: `u${id}`, role: 'user', text: userText },
      { id: `a${id}`, role: 'ai',   text: aiText   },
    ]);
  };

  const handleRemoveWidget = (id) => {
    setWidgets(prev => prev.filter(w => w.id !== id));
    if (id === selectedWidgetId) setSelectedWidgetId(null);
  };

  const handleSelectWidget = (id) => {
    setSelectedWidgetId(prev => prev === id ? null : id);
  };

  const handleTypeChange = (newType) => {
    setWidgets(prev => prev.map(w =>
      w.id === selectedWidgetId
        ? { ...createWidget(newType, w.title), id: w.id, source: w.source }
        : w
    ));
  };

  const handleSourceChange = (newSource) => {
    setWidgets(prev => prev.map(w =>
      w.id === selectedWidgetId ? { ...w, source: newSource } : w
    ));
  };

  const handleRenameWidget = (id, newTitle) => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, title: newTitle } : w));
  };

  const handleDuplicateWidget = (id) => {
    const orig = widgets.find(w => w.id === id);
    if (!orig) return;
    const copy = { ...orig, id: `w${Date.now()}cp`, title: `${orig.title} (copy)` };
    setWidgets(prev => {
      const idx = prev.findIndex(w => w.id === id);
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    if (selectedWidget) {
      appendMsgs(
        text,
        `Noted for "${selectedWidget.title}" — deep widget editing via chat arrives in a future phase.`,
      );
      return;
    }
    const intent = parseWidgetIntent(text);
    if (intent.create) {
      const w = createWidget(intent.type, intent.title);
      setWidgets(prev => [...prev, w]);
      appendMsgs(text, `Added a ${intent.type} widget for "${intent.title}" to your canvas.`);
    } else {
      appendMsgs(text, `If you want to visualize this, try asking me to "add a chart" or pick a suggestion on the canvas.`);
    }
  };

  const handleSuggestion = (s) => {
    const w = createWidget(s.type, s.label);
    setWidgets(prev => [...prev, w]);
    appendMsgs(`Add ${s.label}`, `Added a ${s.type} widget for "${s.label}" to your canvas.`);
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

        <button
          className={`build-save-btn${saveState === 'saved' ? ' saved' : ''}`}
          onClick={handleSave}
        >
          {saveState === 'saved' ? (
            <><IcCheck /><span>Saved</span></>
          ) : (
            <span>Save</span>
          )}
        </button>
      </div>

      {/* Chat + Canvas workspace */}
      <div className="build-workspace">
        {/* Chat pane */}
        <div className="build-chat-pane">
          <BuildContextBar
            selectedWidget={selectedWidget}
            onTypeChange={handleTypeChange}
            onDone={() => setSelectedWidgetId(null)}
          />
          <div className="build-chat-msgs">
            {msgs.map(msg =>
              msg.role === 'user' ? (
                <div key={msg.id} className="build-msg-row build-msg-row--user">
                  <div className="build-msg-avatar build-msg-avatar--user">MP</div>
                  <div className="build-msg-bubble">{msg.text}</div>
                </div>
              ) : (
                <div key={msg.id} className="build-msg-row build-msg-row--ai">
                  <div className="build-msg-avatar build-msg-avatar--ai">
                    <img src="/assets/icons/Navigator icon.svg" width={14} height={14} alt="" />
                  </div>
                  <div className="build-ai-card">
                    {msg.steps && (
                      <div className="build-ai-steps">
                        {msg.steps.map((s, i) => (
                          <div key={i} className="sr-row done np-sr-row--no-indent">
                            <div className="sr-step-track">
                              <StepDoneIcon />
                              {i < msg.steps.length - 1 && <div className="sr-step-line" />}
                            </div>
                            <div className="sr-content">
                              <div className="sr-header"><span className="sr-label">{s}</span></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="build-ai-text">{msg.text}</p>
                  </div>
                </div>
              )
            )}
            <div ref={msgsEndRef} />
          </div>

          <div className="build-chat-composer">
            <div className="build-composer-box">
              <textarea
                className="build-composer-ta"
                placeholder={selectedWidget
                  ? `Ask about "${selectedWidget.title}" or request changes…`
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

        {/* Vertical resize dragger */}
        <div className="build-dragger">
          <div className="build-dragger-handle">
            <span /><span /><span /><span />
          </div>
        </div>

        {/* Canvas pane */}
        <div className="build-canvas-pane">
          <div className="build-canvas-hdr">
            <span className="build-canvas-title">Canvas</span>
            <span className="build-widget-count">
              {widgets.length === 0 ? 'No widgets' : `${widgets.length} widget${widgets.length !== 1 ? 's' : ''}`}
            </span>
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
                        <span className={`build-sugg-type build-sugg-type-${s.type}`}>{s.type}</span>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="build-canvas-grid" onClick={e => e.stopPropagation()}>
                {widgets.map(w => (
                  <NavWidget
                    key={w.id}
                    widget={w}
                    selected={w.id === selectedWidgetId}
                    onSelect={handleSelectWidget}
                    onRemove={handleRemoveWidget}
                    onRename={handleRenameWidget}
                    onDuplicate={handleDuplicateWidget}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page root ────────────────────────────────────────────────────────

export default function NavigatorPage({ onNav, initialQuery = '', theme = 'light', onToggleTheme, appMode = 'em', onModeChange }) {
  const [collapsed, setCollapsed] = useState(false);
  const [view, setView]           = useState(initialQuery ? 'chat' : 'home');
  const [activeQuery, setQuery]   = useState(initialQuery);
  const [mode, setMode]           = useState('ask');

  const handleSend = (q, m) => {
    const sentMode = m ?? mode;
    setQuery(q);
    if (sentMode === 'build') {
      setView('build');
    } else {
      setView('chat');
    }
  };

  const handleNewMode = (m) => {
    setMode(m);
    setView('home');
    setQuery('');
  };

  return (
    <div className="nav-page-shell">
      <Topbar
        onNav={(id) => onNav?.(id === 'navigator' ? (appMode === 'studio' ? 'studio-home' : 'kg') : id)}
        showNavigatorButton={false}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />

      <div className="nav-page-body">
        <NavPanel
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          onSelectChat={handleSend}
          onNewMode={handleNewMode}
          appMode={appMode}
          onNav={onNav}
          onModeChange={onModeChange}
        />

        <div className="nav-page-content">
          {view === 'home' && (
            <HomeView onSend={handleSend} mode={mode} onModeChange={setMode} />
          )}
          {view === 'chat' && (
            <ChatView query={activeQuery} />
          )}
          {view === 'build' && (
            <BuildView initialQuery={activeQuery} />
          )}
        </div>
      </div>
    </div>
  );
}
