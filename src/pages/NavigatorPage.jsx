import React, { useState, useRef, useEffect } from 'react'
import { Ic, Icons } from '../ui.jsx'

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

// ── SVG icons (inline Lucide-style) ─────────────────────────────────
const IcChat     = () => <Ic size={14} path={<><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>} />;
const IcBook     = () => <Ic size={14} path={<><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></>} />;
const IcArrowL   = () => <Ic size={14} path={<><path d="m15 18-6-6 6-6"/></>} />;
const IcPlus     = () => <Ic size={16} path={<><path d="M12 5v14M5 12h14"/></>} />;
const IcSend     = () => <Ic size={16} path={<><path d="m22 2-7 20-4-9-9-4 20-7z"/><path d="M22 2 11 13"/></>} />;
const IcChevD    = () => <Ic size={12} path={<><path d="m6 9 6 6 6-6"/></>} />;
const IcStar     = () => <Ic size={14} path={<><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></>} />;
const IcEdit     = () => <Ic size={14} path={<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>} />;
const IcSidebar  = () => <Ic size={14} path={<><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/></>} />;
const IcFloat    = () => <Ic size={14} path={<><rect x="5" y="5" width="14" height="14" rx="2"/><path d="M3 9h2M3 12h2M3 15h2"/></>} />;
const IcFullscr  = () => <Ic size={14} path={<><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></>} />;
const IcDots     = () => <Ic size={15} path={<><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></>} />;
const IcCheck    = () => <Ic size={13} path={<><polyline points="20 6 9 17 4 12"/></>} />;
const IcRename   = () => <Ic size={14} path={<><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></>} />;
const IcTrash    = () => <Ic size={14} path={<><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></>} />;
const IcFeedback = () => <Ic size={14} path={<><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>} />;
const IcHelp     = () => <Ic size={14} path={<><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></>} />;

const VIEW_MODES = [
  { id: 'sidebar',    label: 'Sidebar',     Icon: IcSidebar },
  { id: 'floating',   label: 'Floating',    Icon: IcFloat   },
  { id: 'fullscreen', label: 'Full screen', Icon: IcFullscr },
];

// ── Click-outside-aware dropdown ─────────────────────────────────────
function Dropdown({ children, onClose, style }) {
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);
  return (
    <div ref={ref} className="np-dropdown" style={style} role="menu">
      {children}
    </div>
  );
}

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
        <img src="/assets/logo/pai-wordmark-white.svg" height={20} alt="Prevalent AI" />
        <span className="nav-back-crumb-label">Exposure Management</span>
      </button>

      <span className="nav-crumb-sep">/</span>

      <div className="nav-crumb-current">
        <img src="/assets/icons/Navigator icon.svg" width={14} height={14} alt="" />
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

      <div className="topbar__avatar">MP</div>
    </header>
  );
}

// ── Navigator left panel ─────────────────────────────────────────────
function NavPanel({ collapsed, setCollapsed, onNewChat, onSelectChat, onNav }) {
  const [showViewMenu, setViewMenu] = useState(false);
  const [showMoreMenu, setMoreMenu] = useState(false);

  const handleViewMode = (id) => {
    setViewMenu(false);
    if (id === 'sidebar' || id === 'floating') {
      onNav?.('kg');
    }
    // fullscreen = current mode, no-op
  };

  return (
    <div className={`np-panel${collapsed ? ' collapsed' : ''}`} style={{ position: 'relative' }}>
      <div className="np-hdr">
        <img src="/assets/icons/Navigator icon.svg" width={20} height={20} alt="" />
        {!collapsed && (
          <>
            <span className="np-hdr-title">Navigator</span>
            <div className="np-hdr-actions">
              <button className="np-icon-btn" onClick={onNewChat} title="New chat (⌘K)" aria-label="New chat">
                <IcEdit />
              </button>
              <div style={{ position: 'relative' }}>
                <button
                  className={`np-icon-btn${showViewMenu ? ' active' : ''}`}
                  onClick={() => { setViewMenu(o => !o); setMoreMenu(false); }}
                  aria-label="Switch view mode"
                  aria-expanded={showViewMenu}
                  aria-haspopup="menu"
                >
                  <IcFullscr />
                </button>
                {showViewMenu && (
                  <Dropdown onClose={() => setViewMenu(false)} style={{ right: 0, top: 34, width: 186 }}>
                    <div className="np-dropdown-label">View mode</div>
                    {VIEW_MODES.map(m => (
                      <button
                        key={m.id}
                        className={`np-dropdown-item${m.id === 'fullscreen' ? ' selected' : ''}`}
                        onClick={() => handleViewMode(m.id)}
                        role="menuitem"
                      >
                        <m.Icon /> {m.label}
                        {m.id === 'fullscreen' && <span className="np-dropdown-check" aria-hidden="true"><IcCheck /></span>}
                      </button>
                    ))}
                  </Dropdown>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <button
                  className={`np-icon-btn${showMoreMenu ? ' active' : ''}`}
                  onClick={() => { setMoreMenu(o => !o); setViewMenu(false); }}
                  aria-label="More options"
                  aria-expanded={showMoreMenu}
                  aria-haspopup="menu"
                >
                  <IcDots />
                </button>
                {showMoreMenu && (
                  <Dropdown onClose={() => setMoreMenu(false)} style={{ right: 0, top: 34, width: 194 }}>
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
          </>
        )}
      </div>

      <div className="np-body">
        <div className="np-row" onClick={onNewChat} style={{ color: 'var(--shell-accent)' }}>
          <span className="np-icon" style={{ color: 'var(--shell-accent)' }}><IcPlus /></span>
          <span className="np-lbl" style={{ color: 'var(--shell-accent)', fontWeight: 500 }}>New chat</span>
          <span className="np-kbd">⌘K</span>
        </div>

        <div className="np-divider" />
        <div className="np-section">Recent</div>

        {RECENT_CHATS.map(c => (
          <div key={c.id} className="np-row" onClick={() => onSelectChat(c.label)}>
            <span className="np-icon"><IcChat /></span>
            <span className="np-lbl">{c.label}</span>
          </div>
        ))}
      </div>

      <div className="np-footer">
        <div className="np-row">
          <span className="np-icon"><IcBook /></span>
          <span className="np-lbl">Library</span>
        </div>
      </div>

      <button
        className="np-collapse-btn"
        onClick={() => setCollapsed(c => !c)}
        title={collapsed ? 'Expand' : 'Collapse'}
      >
        <Ic size={12} path={collapsed
          ? <><path d="m9 18 6-6-6-6"/></>
          : <><path d="m15 18-6-6 6-6"/></>
        } />
      </button>
    </div>
  );
}

// ── Home / AI prompt view ────────────────────────────────────────────
function HomeView({ onSend }) {
  const [query, setQuery]     = useState('');
  const [activeCtx, setCtx]   = useState(new Set());
  const textareaRef           = useRef(null);

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

  return (
    <div className="nav-view-home">
      <div className="ai-content-wrap">
        <div className="ai-home">
          <h1 className="ai-heading">Ask me anything</h1>
          <p className="ai-sub">
            Explore your attack surface, investigate findings, and understand<br />
            exposure risk — powered by your knowledge graph.
          </p>

          {/* Context pills */}
          <div className="ctx-pills-row">
            {CTX_PILLS.map(p => (
              <button
                key={p.id}
                className={`ctx-pill${activeCtx.has(p.id) ? ' active' : ''}`}
                onClick={() => toggleCtx(p.id)}
              >
                <span className="ctx-pill-count">{p.count.toLocaleString()}</span>
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
                        <span className="nav-tx-chip-icon">
                          <Ic size={12} path={<><circle cx="12" cy="12" r="10"/></>} />
                        </span>
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
                  placeholder="Ask about findings, identities, hosts, CVEs, compliance…"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
                  }}
                />
              </div>
            </div>
            <div className="nav-tx-bar">
              <button className="mode-btn">
                <IcStar />
                Deep research
                <IcChevD />
              </button>
              <button
                className="nav-send-btn"
                disabled={!query.trim()}
                onClick={() => handleSend()}
              >
                <IcSend />
              </button>
            </div>
          </div>

          <p className="ai-disclaimer">
            Navigator uses your connected data sources. Verify critical findings independently.
          </p>
        </div>
      </div>

      {/* Sample queries footer */}
      <div className="sample-queries-footer">
        <span className="sample-queries-label">Try asking</span>
        <div className="sample-queries-list">
          {SAMPLE_QUERIES.map((sq, i) => (
            <div key={i} className="sample-q-row">
              <span className={`sample-q-cat ${sq.cat}`}>{sq.cat}</span>
              <button className="sample-q" onClick={() => handleSend(sq.q)}>{sq.q}</button>
            </div>
          ))}
        </div>
      </div>
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
                <img src="/assets/icons/Navigator icon.svg" width={14} height={14} alt="" />
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
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
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
export default function NavigatorPage({ onNav }) {
  const [collapsed, setCollapsed] = useState(false);
  const [view, setView]           = useState('home');
  const [activeQuery, setQuery]   = useState('');

  const handleSend = (q) => {
    setQuery(q);
    setView('chat');
  };

  const handleNewChat = () => {
    setView('home');
    setQuery('');
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
          {view === 'home'
            ? <HomeView onSend={handleSend} />
            : <ChatView query={activeQuery} />
          }
        </div>
      </div>
    </div>
  );
}
