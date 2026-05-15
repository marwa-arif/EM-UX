import React, { useState, useRef, useEffect } from 'react'
import { Ic, Icons, EmIcon } from '../ui.jsx'
import { USER_INITIALS, USER_FIRST_NAME } from '../currentUser.js'

const RECENT_CHATS = [
  { id: 'c1', label: 'Hosts with Critical Vulnerabilities' },
  { id: 'c2', label: 'Vulnerable Hosts' },
  { id: 'c3', label: 'Critical Vulnerabilities on Business-Critical Hosts from Last Month' },
  { id: 'c4', label: 'Critical Issues on Important Systems' },
  { id: 'c5', label: 'Exposure' },
];

const CTX_PILLS = [
  { id: 'vulnerability', label: 'Vulnerability',     count: 13456, icon: <Ic size={13} path={<><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></>} /> },
  { id: 'device',        label: 'Device',            count: 9016,  icon: <Ic size={13} path={<><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></>} /> },
  { id: 'cloud',         label: 'Cloud',             count: 19245, icon: <Ic size={13} path={<><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></>} /> },
  { id: 'application',   label: 'Application',       count: 6324,  icon: <Ic size={13} path={<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>} /> },
  { id: 'identity',      label: 'Identity',          count: 10234, icon: <Ic size={13} path={<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>} /> },
  { id: 'dashboard',     label: 'Dashboard Summary', count: null,  icon: <Ic size={13} path={<><path d="M3 3v18h18"/><rect x="7" y="10" width="3" height="8"/><rect x="13" y="6" width="3" height="12"/></>} /> },
];

const SAMPLE_QUERIES = [
  { cat: 'quick',   q: 'How many critical findings are open right now?' },
  { cat: 'graph',   q: 'Which identities have access to more than 3 cloud accounts?' },
  { cat: 'risk',    q: 'What is the blast radius of compromising vm-prod-42?' },
  { cat: 'deep',    q: 'Summarise all findings linked to CVE-2024-11891' },
  { cat: 'summary', q: 'Weekly exposure report across all cloud accounts' },
  { cat: 'web',     q: 'Latest threat intel for Log4Shell variants' },
];

const DEMO_STEPS = [
  'Querying knowledge graph for host vm-prod-42',
  'Retrieving linked findings',
  'Ranking by severity score',
];

const DEMO_FINDINGS = [
  { name: 'Log4Shell (CVE-2021-44228)',          sev: 'Critical', src: 'Crowdstrike' },
  { name: 'Exposed admin credential in env vars', sev: 'Critical', src: 'MS Intune'   },
  { name: 'Unrestricted inbound NSG rule',        sev: 'Critical', src: 'Azure'       },
  { name: 'SSH port 22 open to 0.0.0.0/0',       sev: 'High',     src: 'Azure'       },
  { name: 'Outdated kernel (5.4.0-147)',          sev: 'High',     src: 'Crowdstrike' },
];

const CONTEXT_QUESTIONS = {
  vulnerability: [
    'Show hosts with critical vulnerabilities',
    'What are the most recent vulnerabilities detected?',
    'List vulnerabilities with active risk signals',
    'Show vulnerabilities linked to external exposure',
  ],
  device: [
    'Which devices have the most critical findings?',
    'Show unmanaged devices with open vulnerabilities',
    'List devices that haven\'t been scanned in 30 days',
    'Which cloud-connected devices are at high risk?',
  ],
  cloud: [
    'Show misconfigured cloud storage buckets',
    'Which cloud accounts have the most findings?',
    'List cloud resources exposed to the internet',
    'Show cloud assets with critical vulnerabilities',
  ],
  application: [
    'Which applications have unpatched CVEs?',
    'Show applications with known active exploits',
    'List web-facing applications with critical findings',
    'Which applications access sensitive data stores?',
  ],
  identity: [
    'Which identities have excessive permissions?',
    'Show compromised credentials detected this month',
    'List identities with access to critical systems',
    'Which service accounts are overprivileged?',
  ],
  dashboard: [
    'Show weekly exposure summary across all assets',
    'What changed in my risk posture this week?',
    'Compare current findings to last month',
    'Show top 10 remediation priorities',
  ],
};

const DEPTH_OPTS = [
  { label: 'Quick',     time: '≈10 mins' },
  { label: 'Standard',  time: '≈30 mins' },
  { label: 'Extensive', time: '≈60 mins' },
];

const DEPTH_FILLS  = ['2px', 'calc(50% + 1px)', 'calc(100% + 2px)'];
const DEPTH_THUMBS = ['0px', 'calc(50% - 5px)', 'calc(100% - 10px)'];

// ── SVG icons (inline Lucide-style) ─────────────────────────────────
const IcChat   = () => <Ic size={14} path={<><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>} />;
const IcBook   = () => <Ic size={14} path={<><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></>} />;
const IcArrowL = () => <Ic size={14} path={<><path d="m15 18-6-6 6-6"/></>} />;
const IcPlus   = () => <Ic size={16} path={<><path d="M12 5v14M5 12h14"/></>} />;
const IcSend   = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 19V5M5 12l7-7 7 7"/>
  </svg>
);
const IcChevD  = () => <Ic size={12} path={<><path d="m6 9 6 6 6-6"/></>} />;
const IcChevR  = () => <Ic size={12} path={<><path d="m9 18 6-6-6-6"/></>} />;
const IcStar   = () => <Ic size={14} path={<><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></>} />;

const IcAgentic = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93 4.93 19.07"/>
  </svg>
);
const IcInteractive = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 2.1l4 4-4 4"/><path d="M3 12.2v-2a4 4 0 0 1 4-4h12.8"/>
    <path d="M7 21.9l-4-4 4-4"/><path d="M21 11.8v2a4 4 0 0 1-4 4H4.2"/>
  </svg>
);
const IcArrowNE = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 17 17 7M7 7h10v10"/>
  </svg>
);

// ── Navigator sidebar icons ──────────────────────────────────────────
const IcAddCircle = () => <Ic size={14} path={<><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></>} />;
const IcSearch    = () => <Ic size={14} path={<><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></>} />;
const IcDiscover  = () => <Ic size={14} path={<><circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z"/></>} />;
const IcNewProject = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.7 10.3a2.41 2.41 0 0 0 0 3.41l7.59 7.59a2.41 2.41 0 0 0 3.41 0l7.59-7.59a2.41 2.41 0 0 0 0-3.41L13.7 2.71a2.41 2.41 0 0 0-3.41 0Z"/>
    <line x1="12" y1="7" x2="12" y2="17"/><line x1="7" y1="12" x2="17" y2="12"/>
  </svg>
);
const IcProjects  = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5.5 8.5 9 12l-3.5 3.5L2 12l3.5-3.5z"/>
    <path d="m12 2-3.5 3.5L12 9l3.5-3.5L12 2z"/>
    <path d="M18.5 8.5 22 12l-3.5 3.5L15 12l3.5-3.5z"/>
    <path d="m12 15-3.5 3.5L12 22l3.5-3.5L12 15z"/>
  </svg>
);
const IcHistory   = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="10" cy="10" r="7"/><path d="m21 21-4.3-4.3"/>
    <path d="M7 10h6M7 13h4"/>
  </svg>
);
const IcSettings  = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);
const IcSidebarCollapse = ({ flipped }) => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5Z"/>
    <path d="M9 3v18"/>
    {flipped ? <path d="M13 9l3 3-3 3"/> : <path d="M15 9l-3 3 3 3"/>}
  </svg>
);

// ── Check icon for done steps ────────────────────────────────────────
function StepDoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="8" cy="8" r="7" stroke="#31A56D" strokeWidth="1.5" opacity="0.4" />
      <path d="M5 8l2 2 4-4" stroke="#31A56D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Navigator topbar ─────────────────────────────────────────────────
function NavigatorTopbar({ onBack }) {
  return (
    <header className="topbar nav-topbar">
      <button className="nav-back-crumb" onClick={onBack} title="Back to Exposure Management">
        <img src="assets/logo/pai-wordmark-white.svg" height={20} alt="Prevalent AI" />
        <span className="nav-back-crumb-label">Exposure Management</span>
      </button>

      <span className="nav-crumb-sep">/</span>

      <div className="nav-crumb-current">
        <img src="assets/icons/Navigator icon.svg" width={14} height={14} alt="" />
        <span>Navigator</span>
      </div>

      <div className="topbar__spacer" />

      <div className="topbar__timestamp">
        Last updated <span className="topbar__timestamp-val">Apr 20, 2026 · 14:32 UTC</span>
      </div>

      <button title="Notifications" className="topbar__btn">
        {Icons.bell}
        <span className="topbar__notif-dot" />
      </button>

      <div className="topbar__avatar">{USER_INITIALS}</div>

      <button className="topbar__navigator" onClick={onBack}>
        <EmIcon size={14} />
        <span className="topbar__navigator-label">Exposure Management</span>
      </button>
    </header>
  );
}

// ── Navigator left panel ─────────────────────────────────────────────
function NavPanel({ collapsed, setCollapsed, onNewChat, onSelectChat, onNav }) {
  const width = collapsed ? 52 : 220;
  const btnCls = `nav-item__btn${collapsed ? ' nav-item__btn--collapsed' : ''}`;

  return (
    <aside className="leftnav" style={{ width }}>
      <div className={`leftnav__header${collapsed ? ' leftnav__header--collapsed' : ''}`}>
        {!collapsed && (
          <div className="leftnav__org">
            <div className="leftnav__org-name-row">
              <img src="assets/icons/Navigator icon.svg" width={14} height={14} alt=""
                   style={{ flexShrink: 0, filter: 'grayscale(20%) opacity(0.78)' }} />
              <div className="leftnav__org-name">Navigator</div>
            </div>
            <div className="leftnav__org-sub">AI Assistant</div>
          </div>
        )}
        <button className="leftnav__toggle-btn" onClick={() => setCollapsed(c => !c)}
                title={collapsed ? 'Expand' : 'Collapse'}>
          <Ic size={12} path={collapsed
            ? <><path d="m9 18 6-6-6-6"/></>
            : <><path d="m15 18-6-6 6-6"/></>
          } />
        </button>
      </div>

      <div className="leftnav__body">
        <div className="nav-item">
          <button className={btnCls} onClick={onNewChat}>
            <span style={{ display:'flex', flexShrink:0 }}><IcAddCircle /></span>
            {!collapsed && <span className="nav-item__label">New Thread</span>}
          </button>
        </div>
        <div className="nav-item">
          <button className={btnCls}>
            <span style={{ display:'flex', flexShrink:0 }}><IcSearch /></span>
            {!collapsed && <span className="nav-item__label">Search</span>}
          </button>
        </div>
        <div className="leftnav__divider" />

        <div className="nav-item">
          <button className={btnCls} onClick={() => onNav?.('navigator/new-project')}>
            <span style={{ display:'flex', flexShrink:0 }}><IcNewProject /></span>
            {!collapsed && <span className="nav-item__label">New Project</span>}
          </button>
        </div>
        <div className="nav-item">
          <button className={btnCls} onClick={() => onNav?.('navigator/projects')}>
            <span style={{ display:'flex', flexShrink:0 }}><IcProjects /></span>
            {!collapsed && <span className="nav-item__label">Projects</span>}
          </button>
        </div>

        <div className="leftnav__divider" />

        <div className="nav-item">
          <button className={btnCls}>
            <span style={{ display:'flex', flexShrink:0 }}><IcHistory /></span>
            {!collapsed && <span className="nav-item__label">History</span>}
          </button>
          {!collapsed && (
            <div className="nav-item__children" style={{ maxHeight: RECENT_CHATS.length * 29 }}>
              {RECENT_CHATS.map(c => (
                <button key={c.id} className="nav-item__child" onClick={() => onSelectChat(c.label)}>
                  <span className="nav-item__label">{c.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="np-nav-footer">
        <div className="nav-item">
          <button className={btnCls}>
            <span style={{ display:'flex', flexShrink:0 }}><IcSettings /></span>
            {!collapsed && <span className="nav-item__label">Settings</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}

const USER_NAME = USER_FIRST_NAME;

const GREETINGS = [
  `What can I do for you, ${USER_NAME}?`,
  `How can I help you today, ${USER_NAME}?`,
  `What are we investigating today, ${USER_NAME}?`,
  `What would you like to explore, ${USER_NAME}?`,
  `Ready when you are, ${USER_NAME}.`,
];

// ── Coming soon view (Navigator sub-pages) ───────────────────────────
function NavComingSoon({ title }) {
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 24,
      padding: 48,
      background: 'var(--shell-bg, #F7F9FC)',
    }}>
      <svg width="128" height="128" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="64" cy="64" r="60" fill="#EEEEFF" />
        <circle cx="64" cy="64" r="40" stroke="#C8C7F0" strokeWidth="2" fill="white" />
        <circle cx="64" cy="64" r="32" stroke="#6360D8" strokeWidth="2.5" fill="none" />
        <path d="M64 42 L64 64 L78 73" stroke="#6360D8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="64" cy="64" r="3" fill="#6360D8" />
        <circle cx="64" cy="34" r="2" fill="#6360D8" />
        <circle cx="64" cy="94" r="2" fill="#6360D8" />
        <circle cx="34" cy="64" r="2" fill="#6360D8" />
        <circle cx="94" cy="64" r="2" fill="#6360D8" />
        <circle cx="22" cy="34" r="6" fill="#6360D8" opacity="0.12" />
        <circle cx="106" cy="95" r="8" fill="#6360D8" opacity="0.08" />
        <circle cx="100" cy="22" r="4" fill="#6360D8" opacity="0.16" />
        <circle cx="18" cy="88" r="5" fill="#6360D8" opacity="0.1" />
      </svg>
      <div style={{ textAlign: 'center', maxWidth: 360 }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: '#101010', marginBottom: 8 }}>{title}</div>
        <div style={{ fontSize: 13, color: '#6E6E6E', lineHeight: 1.65 }}>
          This page is currently under development and will be available soon.
        </div>
      </div>
    </div>
  );
}

// ── Home / AI prompt view ────────────────────────────────────────────
function HomeView({ onSend }) {
  const [query, setQuery]             = useState('');
  const [activeCtx, setCtx]           = useState(new Set());
  const [modeOpen, setModeOpen]       = useState(false);
  const [pendingMode, setPendingMode] = useState(null);
  const [pendingDepth, setPendingDepth] = useState(0);
  const [activeMode, setActiveMode]   = useState(null);
  const [menuPos, setMenuPos]         = useState({ bottom: 0, left: 0 });
  const textareaRef                   = useRef(null);
  const modeBtnRef                    = useRef(null);
  const modeMenuRef                   = useRef(null);
  const greeting                      = useRef(GREETINGS[Math.floor(Math.random() * GREETINGS.length)]).current;

  useEffect(() => {
    if (!modeOpen) return;
    const handler = (e) => {
      if (!modeMenuRef.current?.contains(e.target) && !modeBtnRef.current?.contains(e.target)) {
        setModeOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [modeOpen]);

  const toggleCtx = (id) => setCtx(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const handleSend = (q) => {
    const text = (q ?? query).trim();
    if (!text) return;
    onSend(text);
  };

  const suggestions = [...activeCtx].flatMap(id => CONTEXT_QUESTIONS[id] ?? []).slice(0, 4);

  const CTX_PLURAL = {
    vulnerability: 'vulnerabilities',
    device:        'devices',
    cloud:         'cloud assets',
    application:   'applications',
    identity:      'identities',
    dashboard:     'dashboard summaries',
  };
  const placeholder = activeCtx.size === 1
    ? `Ask about ${CTX_PLURAL[[...activeCtx][0]] ?? 'the selected topic'}`
    : activeCtx.size > 1
    ? 'Ask about the selected topics'
    : 'Ask about vulnerable assets, threats, or risk levels';

  const openModeMenu = () => {
    const rect = modeBtnRef.current.getBoundingClientRect();
    setMenuPos({
      bottom: window.innerHeight - rect.top + 8,
      left: Math.max(8, rect.right - 305),
    });
    setPendingMode(activeMode?.mode ?? null);
    setPendingDepth(activeMode?.depth ?? 0);
    setModeOpen(true);
  };

  const applyMode = () => {
    if (pendingMode) setActiveMode({ mode: pendingMode, depth: pendingDepth });
    setModeOpen(false);
  };

  return (
    <div className="nav-view-home">
      <div className="nav-bg-blobs">
        <div className="nav-bg-blob nav-bg-blob-1" />
        <div className="nav-bg-blob nav-bg-blob-2" />
        <div className="nav-bg-blob nav-bg-blob-3" />
      </div>
      <div className="ai-content-wrap">
        <div className="ai-home">
          <h1 className="ai-heading">{greeting}</h1>
          <p className="ai-sub">
            Discover insights with our advanced intelligence capabilities and<br />
            ask questions relevant to your data
          </p>

          {/* Context pills */}
          <div className="ctx-pills-row">
            {CTX_PILLS.map(p => (
              <button
                key={p.id}
                className={`ctx-pill${activeCtx.has(p.id) ? ' active' : ''}`}
                onClick={() => toggleCtx(p.id)}
              >
                <span className="ctx-pill-icon">{p.icon}</span>
                {p.count != null && <span className="ctx-pill-count">{p.count.toLocaleString()}</span>}
                <span className="ctx-pill-name">{p.label}</span>
              </button>
            ))}
          </div>

          {/* Text box */}
          <div className={`nav-textbox${activeCtx.size > 0 ? ' has-context' : ''}`}>
            <div className="nav-tx-top">
              {activeCtx.size > 0 && (
                <div className="nav-tx-chips">
                  {[...activeCtx].map(id => {
                    const pill = CTX_PILLS.find(p => p.id === id);
                    return (
                      <span key={id} className="nav-tx-chip">
                        <span className="nav-tx-chip-icon">{pill?.icon}</span>
                        {pill?.label}
                        <button className="nav-tx-chip-close" onClick={() => toggleCtx(id)}>×</button>
                      </span>
                    );
                  })}
                </div>
              )}
              <div className="nav-tx-input">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  placeholder={placeholder}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
                  }}
                />
              </div>
            </div>
            <div className="nav-tx-bar">
              {activeMode && (
                <div className="agentic-tag">
                  <span style={{ display: 'flex' }}>
                    {activeMode.mode === 'agentic' ? <IcAgentic /> : <IcInteractive />}
                  </span>
                  <button className="agentic-tag-close" onClick={() => setActiveMode(null)}>×</button>
                </div>
              )}
              <button ref={modeBtnRef} className="mode-btn" onClick={openModeMenu}>
                Mode
                {activeMode ? <IcChevR /> : <IcChevD />}
              </button>
              <button
                className="nav-send-btn"
                disabled={!query.trim()}
                onClick={() => handleSend()}
              >
                <IcSend />
              </button>
            </div>
            {suggestions.length > 0 && (
              <div className="nav-suggestions">
                {suggestions.map((q, i) => (
                  <button
                    key={i}
                    className="nav-suggestion-item"
                    onClick={() => handleSend(q)}
                  >
                    <span>{q}</span>
                    <span className="nav-suggestion-item-arrow"><IcArrowNE /></span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <p className="ai-disclaimer">
            Details may vary over time and are subject to revision
          </p>
        </div>
      </div>

      {/* Mode menu popup */}
      {modeOpen && (
        <div ref={modeMenuRef} className="mode-menu" style={{ bottom: menuPos.bottom, left: menuPos.left }}>
          <div className="mode-menu-inner">
            <div className="mode-menu-section">
              <div className="mode-menu-label">Select Mode</div>
              <button
                className={`mode-option${pendingMode === 'agentic' ? ' selected' : ''}`}
                onClick={() => setPendingMode('agentic')}
              >
                <div className="mode-option-row">
                  <div className="mode-option-icon"><IcAgentic /></div>
                  <span className="mode-option-name">Agentic Mode</span>
                </div>
                <div className="mode-option-desc">Navigator autonomously explores and finds the best path.</div>
              </button>
              <button
                className={`mode-option${pendingMode === 'interactive' ? ' selected' : ''}`}
                onClick={() => setPendingMode('interactive')}
              >
                <div className="mode-option-row">
                  <div className="mode-option-icon"><IcInteractive /></div>
                  <span className="mode-option-name">Interactive Mode</span>
                </div>
                <div className="mode-option-desc">Guide the exploration step-by-step with your input.</div>
              </button>
            </div>

            <div className="mode-depth-section">
              <div className="mode-menu-label">Depth of Analysis</div>
              <div className="mode-depth-slider-wrap">
                <div className="mode-depth-labels">
                  {DEPTH_OPTS.map((o, i) => (
                    <span
                      key={i}
                      className={`mode-depth-label${pendingDepth === i ? ' active' : ''}`}
                      onClick={() => setPendingDepth(i)}
                    >{o.label}</span>
                  ))}
                </div>
                <div
                  className="mode-depth-track-wrap"
                  onClick={e => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const pct = (e.clientX - rect.left) / rect.width;
                    setPendingDepth(pct < 0.33 ? 0 : pct < 0.67 ? 1 : 2);
                  }}
                >
                  <div className="mode-depth-track">
                    <div className="mode-depth-fill" style={{ width: DEPTH_FILLS[pendingDepth] }} />
                    <div className="mode-depth-thumb" style={{ left: DEPTH_THUMBS[pendingDepth] }} />
                  </div>
                </div>
                <div className="mode-depth-times">
                  {DEPTH_OPTS.map((o, i) => (
                    <span key={i} className={`mode-depth-time${pendingDepth === i ? ' active' : ''}`}>{o.time}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mode-menu-footer">
              <button className="mode-cancel-btn" onClick={() => setModeOpen(false)}>Cancel</button>
              <button className="mode-apply-btn" onClick={applyMode} disabled={!pendingMode}
                style={{ opacity: pendingMode ? 1 : 0.45, cursor: pendingMode ? 'pointer' : 'not-allowed' }}>
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Chat view ────────────────────────────────────────────────────────
function ChatView({ query }) {
  const [followUp, setFollowUp] = useState('');

  return (
    <div className="nav-view-chat">
      <div className="chat-space-title">
        <h2 className="chat-space-title-text">{query}</h2>
      </div>

      <div className="chat-split">
        {/* Chat messages panel */}
        <div className="chat-panel">
          <div className="chat-messages">
            {/* User bubble */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div
                className="nav-avatar-ring"
                style={{ background: '#6360D8', color: '#fff', fontSize: 11, fontWeight: 600 }}
              >
                MP
              </div>
              <div className="msg-bubble">
                <p className="msg-text">{query}</p>
              </div>
            </div>

            {/* AI bubble */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div className="nav-avatar-ring active">
                <img src="assets/icons/Navigator icon.svg" width={14} height={14} alt="" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="nav-ai-card-wrap">
                  <div className="nav-ai-card">
                    {/* Reasoning steps */}
                    {DEMO_STEPS.map((s, i) => (
                      <div key={i} className="sr-row done" style={{ marginLeft: 0 }}>
                        <div className="sr-step-track">
                          <StepDoneIcon />
                          {i < DEMO_STEPS.length - 1 && <div className="sr-step-line" />}
                        </div>
                        <div className="sr-content">
                          <div className="sr-header">
                            <span className="sr-label">{s}</span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Answer prose */}
                    <p className="prose-answer-text" style={{ borderTop: '1px solid var(--shell-border)', paddingTop: 12, marginTop: 4, marginBottom: 0 }}>
                      <strong>vm-prod-42</strong> has <strong>14 open findings</strong>, of which{' '}
                      <strong style={{ color: '#D12329' }}>3 are critical severity</strong> and{' '}
                      <strong style={{ color: '#D98B1D' }}>6 are high severity</strong>.
                      <br /><br />
                      Critical findings include an unpatched Log4Shell vulnerability, an exposed admin
                      credential in environment variables, and a misconfigured network security group
                      allowing unrestricted inbound traffic.
                    </p>

                    <p className="msg-time">Just now · 3 steps · 1.2s</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Follow-up input */}
          <div className="chat-textbox">
            <textarea
              placeholder="Ask a follow-up…"
              value={followUp}
              onChange={e => setFollowUp(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); setFollowUp(''); }
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10 }}>
              <button className="mode-btn">
                Mode
                <IcChevD />
              </button>
              <button
                className="nav-send-btn"
                disabled={!followUp.trim()}
                onClick={() => setFollowUp('')}
              >
                <IcSend />
              </button>
            </div>
          </div>
        </div>

        {/* Resize dragger */}
        <div className="chat-dragger">
          <div className="chat-dragger-handle">
            <span /><span /><span /><span />
          </div>
        </div>

        {/* Canvas / answer panel */}
        <div className="canvas-panel">
          <div className="canvas-topbar">
            <div className="canvas-topbar-row1">
              <span className="canvas-result-title">Results</span>
              <span className="tier-chip quick">quick</span>
            </div>
            <p className="canvas-topbar-answer visible">
              14 open findings on vm-prod-42 · 3 critical
            </p>
          </div>

          <div className="canvas-content">
            <div className="prose-answer-card">
              {/* KPI row */}
              <div className="ds-kpi-row">
                <div className="ds-kpi-card">
                  <div className="ds-kpi-value" style={{ color: '#D12329', fontSize: 22 }}>3</div>
                  <div className="ds-kpi-label">Critical</div>
                </div>
                <div className="ds-kpi-card">
                  <div className="ds-kpi-value" style={{ color: '#D98B1D', fontSize: 22 }}>6</div>
                  <div className="ds-kpi-label">High</div>
                </div>
                <div className="ds-kpi-card">
                  <div className="ds-kpi-value" style={{ fontSize: 22 }}>5</div>
                  <div className="ds-kpi-label">Medium / Low</div>
                </div>
              </div>

              {/* Findings table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
                <thead>
                  <tr>
                    <th className="ds-th">Finding</th>
                    <th className="ds-th">Severity</th>
                    <th className="ds-th">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {DEMO_FINDINGS.map((f, i) => (
                    <tr key={i}>
                      <td className="ds-td">{f.name}</td>
                      <td className="ds-td">
                        <span className={`ds-badge ${f.sev === 'Critical' ? 'danger' : 'warning'}`}>
                          {f.sev}
                        </span>
                      </td>
                      <td className="ds-td" style={{ color: 'var(--shell-text-muted)', fontSize: 11 }}>
                        {f.src}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="citation-block">
                <div className="citation-block-hdr">Sources</div>
                {['Knowledge Graph · host vm-prod-42', 'Crowdstrike findings feed', 'Azure Security Center'].map((s, i) => (
                  <div key={i} className="citation-row">
                    <span className="citation-num">[{i + 1}]</span>
                    <span className="citation-title">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page root ────────────────────────────────────────────────────────
export default function NavigatorPage({ onNav, current }) {
  const [collapsed, setCollapsed] = useState(false);
  const [view, setView]           = useState('home');
  const [activeQuery, setQuery]   = useState('');
  const subRoute = current?.startsWith('navigator/') ? current.slice('navigator/'.length) : null;

  const handleSend = (q) => {
    setQuery(q);
    setView('chat');
  };

  const handleNewChat = () => {
    setView('home');
    setQuery('');
    onNav?.('navigator');
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden',
      fontFamily: "'Inter', system-ui",
      background: 'var(--shell-bg, #F7F9FC)',
    }}>
      <NavigatorTopbar onBack={() => onNav?.('kg')} />

      <div style={{ flex: 1, minWidth: 0, display: 'flex', overflow: 'hidden' }}>
        <NavPanel
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          onNewChat={handleNewChat}
          onSelectChat={handleSend}
          onNav={onNav}
        />

        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {subRoute === 'projects'    ? <NavComingSoon title="Projects" />
          : subRoute === 'new-project' ? <NavComingSoon title="New Project" />
          : view === 'home'            ? <HomeView onSend={handleSend} />
          :                             <ChatView query={activeQuery} />}
        </div>
      </div>
    </div>
  );
}
