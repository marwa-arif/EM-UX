import React, { useState, useEffect, useRef, useCallback } from 'react'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import ErrorPage from './pages/ErrorPage.jsx'
import Topbar from './components/Topbar.jsx'
import LeftNav from './components/LeftNav.jsx'
import SubHeader from './components/SubHeader.jsx'
import { PageKG } from './pages/PageKG.jsx'
import { FilterPanel, GraphFilterDrawer } from './components/FilterPanel.jsx'
import { useTweaks, TweaksPanel, TweakSection, TweakSlider, TweakToggle } from './components/tweaks-panel.jsx'
import { PAI } from './ui.jsx'
import WorkspacePage from './pages/WorkspacePage.jsx'
import NavigatorPage from './pages/NavigatorPage.jsx'
import NavigatorPanel from './components/NavigatorPanel.jsx'
import FindingsPage from './pages/FindingsPage.jsx'
import ExposureOverviewPage from './pages/ExposureOverviewPage.jsx'
import DiscoverDevicePage   from './pages/DiscoverDevicePage.jsx'
import DiscoverCloudPage    from './pages/DiscoverCloudPage.jsx'
import DiscoverIdentityPage from './pages/DiscoverIdentityPage.jsx'
import CompliancePage       from './pages/CompliancePage.jsx'
import ComplianceMatrixPage   from './pages/ComplianceMatrixPage.jsx'
import ComplianceFindingsPage from './pages/ComplianceFindingsPage.jsx'
import AssessmentsPage        from './pages/AssessmentsPage.jsx'

function SplashScreen({ onDone }) {
  const isDark = (localStorage.getItem('pai-theme') || 'light') === 'dark';
  const [phase, setPhase] = useState('idle'); // idle | dots | word | sub | out

  // 6 dots in constellation order (top → bottom)
  const dots = [
    "M45.6001 5.86863C43.7483 7.72044 43.7483 10.7228 45.6001 12.5746C47.4519 14.4264 50.4543 14.4264 52.3061 12.5746C54.1579 10.7228 54.1579 7.72044 52.3061 5.86863C50.4543 4.01682 47.4519 4.01682 45.6001 5.86863Z",
    "M31.172 15.7265C28.553 18.3455 28.553 22.5917 31.172 25.2107C33.7909 27.8297 38.0372 27.8297 40.6562 25.2107C43.2752 22.5917 43.2752 18.3455 40.6562 15.7265C38.0372 13.1075 33.7909 13.1075 31.172 15.7265Z",
    "M45.2432 32.5381C43.7681 34.0132 43.7681 36.4048 45.2432 37.8799C46.7183 39.355 49.1099 39.355 50.585 37.8799C52.0601 36.4048 52.0601 34.0132 50.585 32.5381C49.1099 31.063 46.7183 31.063 45.2432 32.5381Z",
    "M17.714 29.9422C14.7862 32.8701 14.786 37.6173 17.7138 40.5452C20.6417 43.473 25.3889 43.4728 28.3168 40.545C31.2447 37.6171 31.2449 32.8699 28.317 29.942C25.3891 27.0141 20.6419 27.0143 17.714 29.9422Z",
    "M31.3126 43.5624C28.6936 46.1814 28.6936 50.4276 31.3126 53.0466C33.9316 55.6656 38.1778 55.6656 40.7968 53.0466C43.4158 50.4276 43.4158 46.1814 40.7968 43.5624C38.1778 40.9434 33.9316 40.9434 31.3126 43.5624Z",
    "M45.7251 57.8374C43.8733 59.6892 43.8733 62.6916 45.7251 64.5434C47.5769 66.3952 50.5793 66.3952 52.4311 64.5434C54.2829 62.6916 54.2829 59.6892 52.4311 57.8374C50.5793 55.9856 47.5769 55.9856 45.7251 57.8374Z",
  ];

  const DOT_STAGGER = 110; // ms between each dot
  const allDotsMs = DOT_STAGGER * dots.length; // 660ms

  useEffect(() => {
    const t0 = setTimeout(() => setPhase('dots'), 120);
    const t1 = setTimeout(() => setPhase('word'), 120 + allDotsMs + 80);
    const t2 = setTimeout(() => setPhase('sub'),  120 + allDotsMs + 480);
    const t3 = setTimeout(() => setPhase('out'),  2600);
    const t4 = setTimeout(() => onDone(),          3150);
    return () => [t0, t1, t2, t3, t4].forEach(clearTimeout);
  }, [onDone]);

  const after = (...phases) => phases.includes(phase);

  const dotColor   = isDark ? 'white' : '#101010';
  const barTrack   = isDark ? 'rgba(255,255,255,0.07)' : '#E8E8F4';
  const emWordmark = isDark ? '/assets/logo/em-wordmark-white.svg' : '/assets/logo/em-wordmark.svg';
  const paiMark    = isDark ? '/assets/logo/pai-wordmark-white.svg' : '/assets/logo/pai-wordmark-black.svg';

  return (
    <>
      <style>{`
        @keyframes dot-pop {
          0%   { opacity: 0; transform: scale(0.25); }
          70%  { opacity: 1; transform: scale(1.15); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes em-text-in {
          from { opacity: 0; transform: translateX(22px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes em-sub-in {
          from { opacity: 0; transform: translateX(22px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes em-bar {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        @keyframes blob-drift-a {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33%      { transform: translate(35px, -22px) scale(1.08); }
          66%      { transform: translate(-18px, 28px) scale(0.95); }
        }
        @keyframes blob-drift-b {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          40%      { transform: translate(-28px, 18px) scale(1.1); }
          70%      { transform: translate(22px, -32px) scale(1.05); }
        }
        @keyframes blob-drift-c {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          50%      { transform: translate(14px, 22px) scale(1.12); }
        }
      `}</style>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: isDark ? '#0D0D18' : '#F7F7FF',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 16, overflow: 'hidden',
        opacity: phase === 'out' ? 0 : 1,
        transition: 'opacity 550ms ease',
      }}>

        {/* Blobs */}
        <div style={{
          position: 'absolute', width: 520, height: 520, top: '-8%', left: '8%',
          borderRadius: '50%',
          background: isDark
            ? 'radial-gradient(circle, rgba(99,96,216,0.40) 0%, transparent 65%)'
            : 'radial-gradient(circle, rgba(99,96,216,0.32) 0%, transparent 60%)',
          animation: 'blob-drift-a 9s ease-in-out infinite',
          pointerEvents: 'none', filter: 'blur(48px)',
        }} />
        <div style={{
          position: 'absolute', width: 440, height: 440, bottom: '-5%', right: '8%',
          borderRadius: '50%',
          background: isDark
            ? 'radial-gradient(circle, rgba(71,173,203,0.32) 0%, transparent 65%)'
            : 'radial-gradient(circle, rgba(71,173,203,0.26) 0%, transparent 60%)',
          animation: 'blob-drift-b 11s ease-in-out infinite',
          pointerEvents: 'none', filter: 'blur(56px)',
        }} />
        <div style={{
          position: 'absolute', width: 320, height: 320, top: '50%', left: '52%',
          borderRadius: '50%',
          background: isDark
            ? 'radial-gradient(circle, rgba(99,96,216,0.22) 0%, transparent 65%)'
            : 'radial-gradient(circle, rgba(99,96,216,0.20) 0%, transparent 60%)',
          animation: 'blob-drift-c 13s ease-in-out infinite',
          pointerEvents: 'none', filter: 'blur(64px)',
        }} />

        {/* Logo row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, position: 'relative', zIndex: 1 }}>
          {/* Dot constellation */}
          <svg width="58" height="71" viewBox="0 0 58 71" fill="none" xmlns="http://www.w3.org/2000/svg">
            {dots.map((d, i) => (
              <path key={i} d={d} fill={dotColor} style={{
                opacity: 0,
                transformBox: 'fill-box',
                transformOrigin: 'center',
                animation: after('dots','word','sub','out')
                  ? `dot-pop 350ms cubic-bezier(0.34,1.3,0.64,1) ${i * DOT_STAGGER}ms forwards`
                  : 'none',
              }} />
            ))}
          </svg>

          {/* EM wordmark */}
          <img
            src={emWordmark}
            height={28}
            alt="Exposure Management"
            style={{
              animation: after('word','sub','out') ? 'em-text-in 520ms cubic-bezier(0.22,1,0.36,1) forwards' : 'none',
              opacity: after('idle','dots') ? 0 : undefined,
            }}
          />
        </div>

        {/* PAI wordmark */}
        <img
          src={paiMark}
          height={28}
          alt="Prevalent AI"
          style={{
            position: 'relative', zIndex: 1,
            animation: after('sub','out') ? 'em-sub-in 520ms cubic-bezier(0.22,1,0.36,1) forwards' : 'none',
            opacity: after('idle','dots','word') ? 0 : undefined,
          }}
        />

        {/* Loading bar */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
          background: barTrack,
        }}>
          <div style={{
            height: '100%',
            background: 'linear-gradient(90deg, #6360D8 0%, #47ADCB 100%)',
            transformOrigin: 'left center',
            animation: after('dots','word','sub','out') ? 'em-bar 2200ms cubic-bezier(0.4,0,0.6,1) forwards' : 'none',
            transform: 'scaleX(0)',
          }} />
        </div>
      </div>
    </>
  );
}

const FLOAT_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "floatEnabled": true,
  "ampX": 6,
  "ampY": 3,
  "speedX": 0.7,
  "speedY": 0.5,
  "variation": 50,
  "edges": [
    ["account","identity","Associated with"],
    ["account","finding","Has"],
    ["application","host","Running on"],
    ["application","vulnerability","Has"],
    ["assessment","finding","Associated with"],
    ["cloudAccount","finding","Has"],
    ["cloudAccount","storage","Has"],
    ["cloudAccount","container","Has"],
    ["cloudAccount","host","Has"],
    ["cloudAccount","cluster","Has"],
    ["cluster","cluster","Has",null,"MapReduce Cluster","Compute Instance Group"],
    ["cluster","finding","Has"],
    ["cluster","container","Has",null,"Container Group"],
    ["cluster","container","Has",null,"Container Service"],
    ["cluster","cluster","Has",null,"Kubernetes Cluster","Compute Instance Group"],
    ["cluster","host","Has",null,"Compute Instance Group","Virtual Machine"],
    ["cluster","cloudAccount","Belongs to",true],
    ["container","cluster","Belongs to",true,null,"Container Service"],
    ["container","cloudAccount","Belongs to",true],
    ["container","finding","Has"],
    ["container","vulnerability","Has"],
    ["container","cluster","Belongs to",true,null,"Container Group"],
    ["host","person","Owned by"],
    ["host","cloudAccount","Belongs to",true],
    ["host","identity","Has"],
    ["host","finding","Has"],
    ["host","application","Hosting",true],
    ["host","vulnerability","Has"],
    ["host","cluster","Belongs to",true,"Virtual Machine","Compute Instance Group"],
    ["host","storage","Has",null,"Virtual Machine","Volume"],
    ["identity","person","Associated with"],
    ["identity","account","Has",true],
    ["identity","finding","Has"],
    ["identity","host","Associated with",true],
    ["network","finding","Has"],
    ["netSvc","finding","Has"],
    ["person","host","Owns",true],
    ["person","identity","Has",true],
    ["person","finding","Has"],
    ["storage","storage","Has",null,null,"Queue Service"],
    ["storage","finding","Has"],
    ["storage","storage","Belongs to",null,"Table Service"],
    ["storage","storage","Has",null,null,"Bucket"],
    ["storage","cloudAccount","Belongs to",true,"Storage Resource"],
    ["storage","storage","Belongs to",null,"File System Service"],
    ["storage","host","To",true,"Volume Associates","Virtual Machine"],
    ["vulnerability","host","On",true],
    ["vulnerability","container","On",true],
    ["vulnerability","finding","Has"],
    ["vulnerability","application","On",true]
  ]
}/*EDITMODE-END*/;

// ── Coming Soon placeholder ──────────────────────────────────────────────
function ComingSoon() {
  return (
    <div className="coming-soon">
      <svg width="128" height="128" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="64" cy="64" r="60" fill="#EEEEFF" />
        <circle cx="64" cy="64" r="40" stroke="var(--pai-indigo-light)" strokeWidth="2" fill="var(--card-bg)" />
        <circle cx="64" cy="64" r="32" stroke="var(--pai-indigo)" strokeWidth="2.5" fill="none" />
        <path d="M64 42 L64 64 L78 73" stroke="var(--pai-indigo)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="64" cy="64" r="3" fill="var(--pai-indigo)" />
        <circle cx="64" cy="34" r="2" fill="var(--pai-indigo)" />
        <circle cx="64" cy="94" r="2" fill="var(--pai-indigo)" />
        <circle cx="34" cy="64" r="2" fill="var(--pai-indigo)" />
        <circle cx="94" cy="64" r="2" fill="var(--pai-indigo)" />
        <circle cx="22" cy="34" r="6" fill="var(--pai-indigo)" opacity="0.12" />
        <circle cx="106" cy="95" r="8" fill="var(--pai-indigo)" opacity="0.08" />
        <circle cx="100" cy="22" r="4" fill="var(--pai-indigo)" opacity="0.16" />
        <circle cx="18" cy="88" r="5" fill="var(--pai-indigo)" opacity="0.1" />
      </svg>
      <div className="coming-soon__text">
        <div className="coming-soon__title">Coming Soon</div>
        <div className="coming-soon__desc">This page is currently under development and will be available soon.</div>
      </div>
    </div>
  );
}

// ── Edge editor ──────────────────────────────────────────────────────────
// Subscribes to PageKG's edge state via window.__kgGetEdges + 'kg-edges-changed'
// event, edits via window.__kgSetEdges.
function EdgeEditor({ onSaveDefault, savedEdges }) {
  const [edges, setLocalEdges] = useState([]);
  const [entities, setEntities] = useState([]);
  const [newSrc, setNewSrc] = useState('');
  const [newTgt, setNewTgt] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    const sync = () => {
      const e = window.__kgGetEdges?.() || [];
      setLocalEdges(e.map(x => [...x]));
      const list = window.__kgEntityList || [];
      setEntities(list);
      if (list.length && !newSrc) setNewSrc(list[0].id);
      if (list.length && !newTgt) setNewTgt(list[0].id);
    };
    sync();
    window.addEventListener('kg-edges-changed', sync);
    // Poll briefly in case PageKG mounts after this component
    const id = setInterval(sync, 250);
    const stop = setTimeout(() => clearInterval(id), 2000);
    return () => {
      window.removeEventListener('kg-edges-changed', sync);
      clearInterval(id); clearTimeout(stop);
    };
  }, []);

  const setEdges = (next) => window.__kgSetEdges?.(next);

  const removeEdge = (i) => {
    const next = edges.filter((_, idx) => idx !== i);
    setEdges(next);
  };
  const updateEdge = (i, field, value) => {
    const next = edges.map((e, idx) => {
      if (idx !== i) return e;
      const copy = [...e];
      if (field === 'src')      copy[0] = value;
      if (field === 'tgt')      copy[1] = value;
      if (field === 'label')    copy[2] = value || null;
      if (field === 'hidden')   copy[3] = !!value;
      if (field === 'srcAlias') copy[4] = value || null;
      if (field === 'tgtAlias') copy[5] = value || null;
      return copy;
    });
    setEdges(next);
  };
  const addEdge = () => {
    if (!newSrc || !newTgt) return;
    const next = [...edges, [newSrc, newTgt, newLabel || null]];
    setEdges(next);
    setNewLabel('');
  };
  const resetEdges = () => {
    if (savedEdges && Array.isArray(savedEdges)) {
      setEdges(savedEdges.map(e => [...e]));
    }
  };

  const saveAsDefault = () => {
    if (onSaveDefault) {
      onSaveDefault(edges.map(e => [...e]));
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1500);
    }
  };

  // Detect unsaved changes vs. persisted defaults
  const dirty = (() => {
    if (!savedEdges) return false;
    if (savedEdges.length !== edges.length) return true;
    for (let i = 0; i < edges.length; i++) {
      const a = edges[i], b = savedEdges[i];
      if (a[0] !== b[0] || a[1] !== b[1] || (a[2] || null) !== (b[2] || null) || (!!a[3]) !== (!!b[3]) || (a[4] || null) !== (b[4] || null) || (a[5] || null) !== (b[5] || null)) return true;
    }
    return false;
  })();

  const labelById = (id) => entities.find(e => e.id === id)?.label || id;

  const rowStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1.2fr 24px',
    gap: 6,
    alignItems: 'center',
    padding: '4px 0',
  };
  const selStyle = {
    fontSize: 11, padding: '4px 6px', borderRadius: 4,
    border: '1px solid var(--shell-border)', background: 'var(--card-bg)', color: 'var(--pai-fg1)',
    fontFamily: 'inherit',
    minWidth: 0,
  };
  const inputStyle = { ...selStyle };
  const xBtnStyle = {
    width: 22, height: 22, borderRadius: 4, border: '1px solid var(--shell-border)',
    background: 'var(--card-bg)', color: 'var(--shell-text-muted)', cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 14, lineHeight: 1, padding: 0,
  };

  return (
    <div style={{ padding: '4px 0' }}>
      {/* Save bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        marginBottom: 8,
      }}>
        <button
          onClick={saveAsDefault}
          disabled={!dirty && !savedFlash}
          style={{
            flex: 1, padding: '6px 10px',
            borderRadius: 6, border: '1px solid',
            borderColor: savedFlash ? 'var(--pai-green)' : (dirty ? 'var(--pai-indigo)' : 'var(--shell-border)'),
            background: savedFlash ? 'var(--pai-low-bg)' : (dirty ? 'var(--pai-indigo)' : 'var(--shell-raised)'),
            color: savedFlash ? 'var(--pai-low-fg)' : (dirty ? 'var(--pai-surface)' : 'var(--shell-text-muted)'),
            fontSize: 11, fontWeight: 500,
            cursor: (dirty || savedFlash) ? 'pointer' : 'default',
            fontFamily: 'inherit',
            transition: 'all 150ms cubic-bezier(.2,.8,.2,1)',
          }}
        >
          {savedFlash ? 'Saved' : (dirty ? 'Save as default' : 'Default saved')}
        </button>
        <button
          onClick={resetEdges}
          disabled={!dirty}
          style={{
            padding: '6px 10px',
            borderRadius: 6, border: '1px solid var(--shell-border)',
            background: 'transparent',
            color: dirty ? 'var(--shell-text-muted)' : 'var(--pai-disabled)',
            fontSize: 11,
            cursor: dirty ? 'pointer' : 'default',
            fontFamily: 'inherit',
          }}
        >
          Reset
        </button>
      </div>

      <div style={{ ...rowStyle, fontSize: 9, color: 'var(--shell-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', paddingBottom: 4, borderBottom: '1px solid var(--shell-border)', marginBottom: 6 }}>
        <div>Source</div><div>Target</div><div>Label</div><div></div>
      </div>

      <div style={{ maxHeight: 260, overflowY: 'auto', paddingRight: 4 }}>
        {edges.map((e, i) => (
          <div key={i} style={rowStyle}>
            <select style={selStyle} value={e[0]} onChange={(ev) => updateEdge(i, 'src', ev.target.value)}>
              {entities.map(en => <option key={en.id} value={en.id}>{en.label}</option>)}
            </select>
            <select style={selStyle} value={e[1]} onChange={(ev) => updateEdge(i, 'tgt', ev.target.value)}>
              {entities.map(en => <option key={en.id} value={en.id}>{en.label}</option>)}
            </select>
            <input style={inputStyle} placeholder="—"
                   value={e[2] || ''}
                   onChange={(ev) => updateEdge(i, 'label', ev.target.value)} />
            <button style={xBtnStyle} title="Remove edge"
                    onClick={() => removeEdge(i)}
                    onMouseEnter={(ev) => ev.currentTarget.style.background = 'var(--pai-crit-bg)'}
                    onMouseLeave={(ev) => ev.currentTarget.style.background = 'var(--card-bg)'}
            >×</button>
          </div>
        ))}
        {edges.length === 0 && (
          <div style={{ fontSize: 11, color: 'var(--shell-text-muted)', padding: '8px 0' }}>No edges. Add one below.</div>
        )}
      </div>

      <div style={{ borderTop: '1px solid var(--shell-border)', marginTop: 8, paddingTop: 8 }}>
        <div style={{ fontSize: 9, color: 'var(--shell-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
          Add edge
        </div>
        <div style={rowStyle}>
          <select style={selStyle} value={newSrc} onChange={(e) => setNewSrc(e.target.value)}>
            {entities.map(en => <option key={en.id} value={en.id}>{en.label}</option>)}
          </select>
          <select style={selStyle} value={newTgt} onChange={(e) => setNewTgt(e.target.value)}>
            {entities.map(en => <option key={en.id} value={en.id}>{en.label}</option>)}
          </select>
          <input style={inputStyle} placeholder="Relationship (optional)"
                 value={newLabel}
                 onChange={(e) => setNewLabel(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && addEdge()} />
          <button style={{ ...xBtnStyle, color: 'var(--pai-indigo)', borderColor: 'var(--pai-indigo-secondary)' }}
                  title="Add edge"
                  onClick={addEdge}>+</button>
        </div>
      </div>
    </div>
  );
}

const TAB_DEFS = [
  {
    id: 'filter',
    label: 'Filter',
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
      </svg>
    ),
  },
  {
    id: 'navigator',
    label: 'Navigator',
    icon: <img src="/assets/icons/Navigator icon.svg" width={12} height={12} alt="" />,
  },
];

// ── Shared right panel tab strip ─────────────────────────────────────
function RightPanelShell({ tab, onTabSwitch, onClose, filterProps, navigatorProps, visitedTabs = [], navigatorFloating = false }) {
  const SHELL_WIDTH = 400;
  const isOpen = tab !== null;
  const isCollapsedForFloat = navigatorFloating && tab === 'navigator';
  const visibleTabs = TAB_DEFS.filter(t => visitedTabs.includes(t.id));

  return (
    <div
      className="rp-shell"
      style={{
        width: isCollapsedForFloat ? 0 : isOpen ? SHELL_WIDTH : 0,
        borderLeft: (isOpen && !isCollapsedForFloat) ? '1px solid var(--shell-border)' : 'none',
        boxShadow: (isOpen && !isCollapsedForFloat) ? '-4px 0 20px rgba(0,0,0,0.18)' : 'none',
      }}
    >
      <div className="rp-shell__inner" style={{ width: SHELL_WIDTH }}>
        {/* Tab strip — 48px to align with SubHeader */}
        <div className="rp-tabstrip">
          <div className={`rp-tabstrip__tabs${visibleTabs.length > 1 ? ' rp-seg-tabs' : ''}`}>
            {visibleTabs.map(t => (
              <button
                key={t.id}
                className={`rp-tab${tab === t.id ? ' rp-tab--active' : ''}`}
                onClick={() => onTabSwitch(t.id)}
              >
                <span className="rp-tab__icon">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
          <button
            className="rp-tab-close"
            onClick={onClose}
            title="Close panel"
            aria-label="Close panel"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Active panel content */}
        <div className="rp-content">
          {tab === 'filter' && (
            <FilterPanel
              {...filterProps}
              embedded={true}
              onClose={onClose}
            />
          )}
          {tab === 'navigator' && (
            <NavigatorPanel
              open={true}
              embedded={true}
              onClose={onClose}
              onNav={navigatorProps?.onNav}
              initialViewMode={navigatorProps?.initialViewMode}
              onViewModeChange={navigatorProps?.onViewModeChange}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Pages that have the Edit → Discover Dashboard shortcut ──────────
const DISCOVER_PAGES = new Set(['discover/device', 'discover/cloud', 'discover/identity']);

const _UNUSED = {
  'discover/device': {
    name: 'Device Dashboard',
    widgets: [
      {
        id: 1001, label: 'Total Devices', chartId: 'kpi', span: 1, sizeId: 'small', heightId: 'medium', phase: 'active',
        data: { value: '12,382', label: 'Total Devices', trend: '3.89%', trendUp: true },
      },
      {
        id: 1002, label: 'Criticality Insights', chartId: 'stack-hor', span: 2, sizeId: 'medium', heightId: 'medium', phase: 'active',
        data: [
          { label: 'Critical', count: '953',    pct: 1.74,  color: 'var(--pai-crit-fg)'  },
          { label: 'High',     count: '12,353', pct: 22.59, color: 'var(--pai-red-high)' },
          { label: 'Medium',   count: '36,136', pct: 66.08, color: 'var(--pai-high-fg)'  },
          { label: 'Low',      count: '5,244',  pct: 9.59,  color: 'var(--pai-green)'    },
        ],
      },
      {
        id: 1003, label: 'Data Source', chartId: 'hor-bar', span: 2, sizeId: 'medium', heightId: 'medium', phase: 'active',
        data: [
          { label: 'AWS',                 value: 100, secondary: 5,  count: '97' },
          { label: 'MS Azure',            value: 88,  secondary: 5,  count: '85' },
          { label: 'Qualys',              value: 58,  secondary: 21, count: '56' },
          { label: 'MS Active Directory', value: 48,  secondary: 31, count: '47' },
          { label: 'WIZ',                 value: 39,  secondary: 5,  count: '38' },
          { label: 'Infoblox',            value: 12,  secondary: 7,  count: '12' },
          { label: 'MS Defender',         value: 8,   secondary: 5,  count: '8'  },
          { label: 'Tenable',             value: 5,   secondary: 3,  count: '5'  },
        ],
      },
      {
        id: 1004, label: 'Asset Types', chartId: 'pie', span: 1, sizeId: 'small', heightId: 'medium', phase: 'active',
        totalLabel: '10,679',
        data: [
          { label: 'Server',           count: '4,086', value: 4086, pct: '33%',  color: 'var(--pai-indigo)'       },
          { label: 'Workstation',      count: '2,848', value: 2848, pct: '23%',  color: '#5BADB8'                 },
          { label: 'Network',          count: '2,600', value: 2600, pct: '21%',  color: 'var(--pai-green)'        },
          { label: 'Mobile',           count: '897',   value: 897,  pct: '8%',   color: 'var(--pai-high-fg)'      },
          { label: 'Printers',         count: '124',   value: 124,  pct: '1%',   color: 'var(--pai-red-high)'     },
          { label: 'IOT',              count: '122',   value: 122,  pct: '1%',   color: 'var(--pai-indigo-muted)' },
        ],
      },
      { id: 1005, label: 'Insights', chartId: 'table', span: 4, sizeId: 'xlarge', heightId: 'large', phase: 'active' },
    ],
  },
  'discover/cloud': {
    name: 'Cloud Dashboard',
    widgets: [
      {
        id: 1001, label: 'Total Cloud Assets', chartId: 'kpi', span: 1, sizeId: 'small', heightId: 'medium', phase: 'active',
        data: { value: '11,722', label: 'Total Cloud Assets', trend: '2.14%', trendUp: true },
      },
      {
        id: 1002, label: 'Criticality Insights', chartId: 'stack-hor', span: 2, sizeId: 'medium', heightId: 'medium', phase: 'active',
        data: [
          { label: 'Critical', count: '750',   pct: 6.38,  color: 'var(--pai-crit-fg)'  },
          { label: 'High',     count: '3,560', pct: 30.26, color: 'var(--pai-red-high)' },
          { label: 'Medium',   count: '4,188', pct: 35.60, color: 'var(--pai-high-fg)'  },
          { label: 'Low',      count: '3,265', pct: 27.76, color: 'var(--pai-green)'    },
        ],
      },
      {
        id: 1003, label: 'Data Source', chartId: 'hor-bar', span: 2, sizeId: 'medium', heightId: 'medium', phase: 'active',
        data: [
          { label: 'AWS',         value: 100, secondary: 0,  count: '55' },
          { label: 'Wiz',         value: 75,  secondary: 27, count: '41' },
          { label: 'Qualys',      value: 53,  secondary: 36, count: '29' },
          { label: 'MS Intune',   value: 24,  secondary: 18, count: '13' },
          { label: 'MS Azure AD', value: 24,  secondary: 18, count: '13' },
          { label: 'MS Azure',    value: 15,  secondary: 9,  count: '8'  },
          { label: 'MS Defender', value: 11,  secondary: 7,  count: '6'  },
          { label: 'Tenable',     value: 7,   secondary: 4,  count: '4'  },
        ],
      },
      {
        id: 1004, label: 'Asset Types', chartId: 'pie', span: 1, sizeId: 'small', heightId: 'medium', phase: 'active',
        totalLabel: '11,722',
        data: [
          { label: 'Volume',                 count: '5,423', value: 5423, pct: '46%', color: 'var(--pai-indigo)'       },
          { label: 'Workstation',            count: '4,922', value: 4922, pct: '42%', color: '#5BADB8'                 },
          { label: 'Server',                 count: '381',   value: 381,  pct: '3%',  color: 'var(--pai-green)'        },
          { label: 'Kubernetes Container',   count: '353',   value: 353,  pct: '3%',  color: 'var(--pai-high-fg)'      },
          { label: 'Security Group',         count: '224',   value: 224,  pct: '2%',  color: 'var(--pai-red-high)'     },
          { label: 'Serverless',             count: '66',    value: 66,   pct: '1%',  color: 'var(--pai-indigo-muted)' },
        ],
      },
      { id: 1005, label: 'Insights', chartId: 'table', span: 4, sizeId: 'xlarge', heightId: 'large', phase: 'active' },
    ],
  },
  'discover/identity': {
    name: 'Identity Dashboard',
    widgets: [
      {
        id: 1001, label: 'Total Identities', chartId: 'kpi', span: 1, sizeId: 'small', heightId: 'medium', phase: 'active',
        data: { value: '71,442', label: 'Total Identities', trend: '1.62%', trendUp: false },
      },
      {
        id: 1002, label: 'Criticality Insights', chartId: 'stack-hor', span: 2, sizeId: 'medium', heightId: 'medium', phase: 'active',
        data: [
          { label: 'Critical', count: '4,322',  pct: 6.05,  color: 'var(--pai-crit-fg)'  },
          { label: 'High',     count: '17,503', pct: 24.50, color: 'var(--pai-red-high)' },
          { label: 'Medium',   count: '40,197', pct: 56.27, color: 'var(--pai-high-fg)'  },
          { label: 'Low',      count: '9,420',  pct: 13.18, color: 'var(--pai-green)'    },
        ],
      },
      {
        id: 1003, label: 'Data Source', chartId: 'hor-bar', span: 2, sizeId: 'medium', heightId: 'medium', phase: 'active',
        data: [
          { label: 'MS Active Dire...', value: 100, secondary: 41, count: '59' },
          { label: 'MS Entra ID',       value: 64,  secondary: 25, count: '38' },
          { label: 'Windows Securit...', value: 63, secondary: 20, count: '37' },
          { label: 'MS Intune',         value: 49,  secondary: 14, count: '29' },
          { label: 'MS Defender',       value: 39,  secondary: 12, count: '23' },
          { label: 'MS Azure',          value: 10,  secondary: 5,  count: '6'  },
          { label: 'Okta',              value: 7,   secondary: 3,  count: '4'  },
        ],
      },
      {
        id: 1004, label: 'Identity Types', chartId: 'pie', span: 1, sizeId: 'small', heightId: 'medium', phase: 'active',
        totalLabel: '71,442',
        data: [
          { label: 'Non-Human', count: '57,687', value: 57687, pct: '80.75%', color: 'var(--pai-indigo)' },
          { label: 'Human',     count: '13,755', value: 13755, pct: '19.25%', color: 'var(--pai-green)'  },
        ],
      },
      { id: 1005, label: 'Insights', chartId: 'table', span: 4, sizeId: 'xlarge', heightId: 'large', phase: 'active' },
    ],
  },
};

function App() {
  const [current, setCurrent] = useState(() => {
    const path = window.location.pathname;
    if (path === '/workspace' || path.startsWith('/workspace/')) return 'workspace';
    if (path === '/knowledge-graph') return 'kg';
    if (path === '/') return 'exposure/overview';
    return path.slice(1) || 'exposure/overview';
  });
  const [appMode, setAppMode] = useState('em'); // 'em' | 'studio'
  const [showSplash, setShowSplash] = useState(true);
  const onSplashDone = useCallback(() => setShowSplash(false), []);
  const [matrixFilter, setMatrixFilter] = useState(null); // { framework, frameworkName, groupBy, row, col, colId, score }
  const [theme, setTheme] = useState(() => localStorage.getItem('pai-theme') || 'light');
  const [collapsed, setCollapsed] = useState(false);
  const [rightPanel, setRightPanel] = useState(null); // null | 'filter' | 'navigator'
  const [navigatorQuery, setNavigatorQuery] = useState('');
  const [navigatorViewMode, setNavigatorViewMode] = useState('sidebar');
  const [navigatorFloating, setNavigatorFloating] = useState(false);
  const [visitedTabs, setVisitedTabs] = useState([]);
  const [graphFilterOpen, setGraphFilterOpen] = useState(false);
  const [filtersByPage, setFiltersByPage] = useState({});
  const [tweaks, setTweak] = useTweaks(FLOAT_TWEAK_DEFAULTS);
  const [canvasTop, setCanvasTop] = useState(0);
  const [complianceExpanded, setComplianceExpanded] = useState({});
  const canvasRef = useRef(null);

  useEffect(() => {
    const html = document.documentElement;
    html.classList.toggle('theme-dark', theme === 'dark');
    html.classList.toggle('theme-light', theme === 'light');
    localStorage.setItem('pai-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  // Set BEFORE first render of children so PageKG can read persisted edges synchronously
  if (typeof window !== 'undefined' && window.__floatTweaks !== tweaks) {
    window.__floatTweaks = tweaks;
  }

  // Keep in sync on subsequent updates (rAF reads it each frame)
  useEffect(() => { window.__floatTweaks = tweaks; }, [tweaks]);

  useEffect(() => {
    const measure = () => {
      if (canvasRef.current) setCanvasTop(canvasRef.current.getBoundingClientRect().top);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  useEffect(() => {
    const onPop = () => {
      const path = window.location.pathname;
      if (path === '/workspace' || path.startsWith('/workspace/')) setCurrent('workspace');
      else if (path === '/knowledge-graph') setCurrent('kg');
      else if (path === '/') setCurrent('exposure/overview');
      else setCurrent(path.slice(1) || 'exposure/overview');
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    const timers = new WeakMap();
    const onScroll = (e) => {
      const el = e.target;
      if (!el?.classList?.contains('page-scroll')) return;
      el.classList.add('is-scrolling');
      if (timers.has(el)) clearTimeout(timers.get(el));
      timers.set(el, setTimeout(() => el.classList.remove('is-scrolling'), 3000));
    };
    document.addEventListener('scroll', onScroll, true);
    return () => document.removeEventListener('scroll', onScroll, true);
  }, []);

  const openRightTab = (tabName) => {
    setVisitedTabs(prev => prev.includes(tabName) ? prev : [...prev, tabName]);
    setRightPanel(prev => {
      const next = prev === tabName ? null : tabName;
      if (next) setCollapsed(true);
      return next;
    });
  };

  const handleNav = (id, data) => {
    if (id === 'navigator') {
      setNavigatorViewMode('sidebar');
      openRightTab('navigator');
      return;
    }
    if (id === 'navigator-page') {
      setRightPanel(null);
      setNavigatorQuery(data || '');
      setCurrent('navigator');
      history.pushState(null, '', '/navigator');
      return;
    }
    if (id === 'navigator-floating') {
      setNavigatorViewMode('floating');
      setCurrent('kg');
      history.pushState(null, '', '/knowledge-graph');
      openRightTab('navigator');
      return;
    }
    setCurrent(id);
    let url;
    if (id === 'workspace' || id.startsWith('workspace/')) url = '/workspace';
    else if (id === 'kg') url = '/knowledge-graph';
    else url = `/${id}`;
    history.pushState(null, '', url);
  };

  // Per-page filter accessors
  const curPageFilters   = filtersByPage[current] || { count: 0, chips: [] };
  const activeFilterCount = curPageFilters.count;
  const activeFilters     = curPageFilters.chips;

  const setPageFilters = (pageId, count, chips) =>
    setFiltersByPage(prev => ({ ...prev, [pageId]: { count, chips } }));

  // Explore in: navigate to destId carrying the current page's filters
  const handleExplore = (destId) => {
    const src = filtersByPage[current] || { count: 0, chips: [] };
    setFiltersByPage(prev => ({ ...prev, [destId]: { count: src.count, chips: src.chips } }));
    handleNav(destId);
  };

  if (current === 'workspace' || current.startsWith('workspace/')) {
    return (
      <>
        {showSplash && <SplashScreen onDone={onSplashDone} />}
        <WorkspacePage onNav={handleNav} initialRoute={current} theme={theme} onToggleTheme={toggleTheme} />
      </>
    );
  }

  if (current === 'navigator' || current.startsWith('navigator/')) {
    return (
      <>
        {showSplash && <SplashScreen onDone={onSplashDone} />}
        <NavigatorPage onNav={handleNav} current={current} initialQuery={navigatorQuery} />
      </>
    );
  }

  const PAGE_META = {
    'exposure/overview': {
      title: 'Overview',
      breadcrumb: ['Home', 'Exposure', 'Overview'],
      breadcrumbHrefs: [null, null, null],
    },
    'exposure/findings': {
      title: 'Findings',
      breadcrumb: ['Home', 'Exposure', 'Findings'],
      breadcrumbHrefs: [null, null, null],
    },
    'discover/device': {
      title: 'Device',
      breadcrumb: ['Home', 'Discover', 'Device'],
      breadcrumbHrefs: [null, null, null],
    },
    'discover/cloud': {
      title: 'Cloud',
      breadcrumb: ['Home', 'Discover', 'Cloud'],
      breadcrumbHrefs: [null, null, null],
    },
    'discover/identity': {
      title: 'Identity',
      breadcrumb: ['Home', 'Discover', 'Identity'],
      breadcrumbHrefs: [null, null, null],
    },
    'report/compliance': {
      title: 'Compliance',
      breadcrumb: ['Home', 'Report', 'Compliance'],
      breadcrumbHrefs: [null, null, null],
    },
    'report/assessments': {
      title: 'Assessments',
      breadcrumb: ['Home', 'Report', 'Assessments'],
      breadcrumbHrefs: [null, null, null],
    },
    'report/compliance-matrix': {
      title: 'Compliance Matrix',
      breadcrumb: ['Home', 'Report', 'Compliance Matrix'],
      breadcrumbHrefs: [null, null, null],
    },
    'report/compliance-findings': {
      title: 'Compliance Findings',
      breadcrumb: ['Home', 'Report', 'Compliance Findings'],
      breadcrumbHrefs: [null, null, null],
    },
    'data-quality/overview': {
      title: 'Overview',
      breadcrumb: ['Home', 'Data Quality', 'Overview'],
      breadcrumbHrefs: [null, null, null],
    },
    'data-quality/in-depth': {
      title: 'In-Depth',
      breadcrumb: ['Home', 'Data Quality', 'In-Depth'],
      breadcrumbHrefs: [null, null, null],
    },
    'remediation/queue': {
      title: 'Queue',
      breadcrumb: ['Home', 'Remediation', 'Queue'],
      breadcrumbHrefs: [null, null, null],
    },
    'remediation/closed': {
      title: 'Closed',
      breadcrumb: ['Home', 'Remediation', 'Closed'],
      breadcrumbHrefs: [null, null, null],
    },
    kg: {
      title: 'Knowledge Graph',
      breadcrumb: ['Home', 'Knowledge Graph'],
      breadcrumbHrefs: ['/knowledge-graph', null],
      onAdd: () => {},
    },
  };

  if (!PAGE_META[current] && current !== 'kg') {
    return <ErrorPage type="notFound" onHome={() => { setCurrent('exposure/overview'); history.pushState(null, '', '/exposure/overview'); }} />;
  }

  const pageMeta = PAGE_META[current] || PAGE_META.kg;
  const isKG = current === 'kg' || !PAGE_META[current];

  const sharedRightPanel = (
    <RightPanelShell
      tab={rightPanel}
      onTabSwitch={openRightTab}
      onClose={() => { setRightPanel(null); setNavigatorFloating(false); }}
      visitedTabs={visitedTabs}
      filterProps={{ onApply: (c, chips, merge = false) => {
        if (merge) {
          setFiltersByPage(prev => {
            const cur = prev[current] || { count: 0, chips: [] };
            const merged = [...cur.chips, ...(chips || [])];
            return { ...prev, [current]: { count: new Set(merged.map(f => f.attrId)).size, chips: merged } };
          });
        } else {
          setPageFilters(current, c, chips || []);
        }
      }, onOpenGraphFilter: () => setGraphFilterOpen(o => !o), graphFilterOpen }}
      navigatorProps={{
        onNav: handleNav,
        initialViewMode: navigatorViewMode,
        onViewModeChange: (mode) => setNavigatorFloating(mode === 'floating'),
      }}
      navigatorFloating={navigatorFloating}
    />
  );

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100vh', overflow: 'hidden',
      fontFamily: "'Inter', system-ui",
      color: PAI.fg1, background: 'var(--shell-bg)',
    }}>
      {showSplash && <SplashScreen onDone={onSplashDone} />}
      <Topbar onNav={handleNav} navigatorActive={rightPanel === 'navigator'} theme={theme} onToggleTheme={toggleTheme} />

      <div ref={isKG && appMode !== 'studio' ? canvasRef : null} style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <LeftNav
          current={current}
          onNav={handleNav}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
          mode={appMode}
          onModeChange={setAppMode}
        />

        {appMode === 'studio' ? (
          <main className="exp-main" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--ctrl-bg)' }}>
            <SubHeader
              title="Studio"
              breadcrumb={['Studio']}
              breadcrumbHrefs={[null]}
            />
            <div className="page-scroll" style={{ flex: 1, minWidth: 0, overflow: 'auto' }}>
              <ComingSoon />
            </div>
          </main>
        ) : (
          <main className="exp-main" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'row', overflow: 'hidden', background: 'var(--ctrl-bg)' }}>
            <div className="exp-content-col" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <SubHeader
                title={pageMeta.title}
                breadcrumb={pageMeta.breadcrumb}
                breadcrumbHrefs={pageMeta.breadcrumbHrefs}
                activeFilterCount={activeFilterCount}
                activeFilters={activeFilters}
                onRemoveFilter={(idx) => {
                  setFiltersByPage(prev => {
                    const cur = prev[current] || { count: 0, chips: [] };
                    const updated = cur.chips.filter((_, i) => i !== idx);
                    return { ...prev, [current]: { count: new Set(updated.map(c => c.attrId)).size, chips: updated } };
                  });
                }}
                onClearFilters={() => setPageFilters(current, 0, [])}
                filterActive={rightPanel === 'filter'}
                onFilter={() => openRightTab('filter')}
                onAdd={pageMeta.onAdd}
                onExplore={handleExplore}
                onEdit={DISCOVER_PAGES.has(current) ? () => {
                  setCurrent('workspace/dashboard/discover');
                  history.pushState(null, '', '/workspace');
                } : undefined}
              />
              <div className="page-scroll" style={{ flex: 1, minWidth: 0, overflow: 'auto' }}>
                {current === 'exposure/overview'   && <ExposureOverviewPage />}
                {current === 'exposure/findings'   && <FindingsPage onNav={handleNav} />}
                {current === 'discover/device'     && <DiscoverDevicePage />}
                {current === 'discover/cloud'      && <DiscoverCloudPage />}
                {current === 'discover/identity'   && <DiscoverIdentityPage />}
                {current === 'report/compliance'        && <CompliancePage expanded={complianceExpanded} onExpandChange={setComplianceExpanded} />}
                {current === 'report/assessments'       && <AssessmentsPage />}
                {current === 'report/compliance-matrix'    && <ComplianceMatrixPage onCellClick={filter => { setMatrixFilter(filter); handleNav('report/compliance-findings'); }} />}
                {current === 'report/compliance-findings'  && <ComplianceFindingsPage filter={matrixFilter} onClearFilter={() => setMatrixFilter(null)} />}
                {!isKG && current !== 'exposure/overview' && current !== 'exposure/findings' && current !== 'discover/device' && current !== 'discover/cloud' && current !== 'discover/identity' && current !== 'report/compliance' && current !== 'report/assessments' && current !== 'report/compliance-matrix' && current !== 'report/compliance-findings' && <ComingSoon />}
                {isKG && <PageKG />}
              </div>
            </div>
            {sharedRightPanel}
          </main>
        )}
      </div>

      {isKG && appMode !== 'studio' && GraphFilterDrawer && (
        <GraphFilterDrawer
          open={graphFilterOpen}
          onClose={() => setGraphFilterOpen(false)}
          onApply={(count) => { setPageFilters(current, count, activeFilters); setGraphFilterOpen(false); }}
          top={canvasTop}
        />
      )}

      {isKG && appMode !== 'studio' && (
        <TweaksPanel title="Tweaks">
          <style>{`.twk-panel { width: 360px !important; }`}</style>
          <TweakSection label="Graph float animation" />
          <TweakToggle label="Enabled" value={tweaks.floatEnabled}
                       onChange={(v) => setTweak('floatEnabled', v)} />
          <TweakSlider label="Amplitude X" value={tweaks.ampX} min={0} max={20} step={0.5} unit="px"
                       onChange={(v) => setTweak('ampX', v)} />
          <TweakSlider label="Amplitude Y" value={tweaks.ampY} min={0} max={20} step={0.5} unit="px"
                       onChange={(v) => setTweak('ampY', v)} />
          <TweakSlider label="Speed X" value={tweaks.speedX} min={0.05} max={3} step={0.05} unit=" rad/s"
                       onChange={(v) => setTweak('speedX', v)} />
          <TweakSlider label="Speed Y" value={tweaks.speedY} min={0.05} max={3} step={0.05} unit=" rad/s"
                       onChange={(v) => setTweak('speedY', v)} />
          <TweakSlider label="Per-node variation" value={tweaks.variation} min={0} max={100} step={5} unit="%"
                       onChange={(v) => setTweak('variation', v)} />

          <TweakSection label="Edges" />
          <EdgeEditor
            onSaveDefault={(eds) => setTweak('edges', eds)}
            savedEdges={tweaks.edges}
          />
        </TweaksPanel>
      )}
    </div>
  );
}

function AppWithBoundary() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}

export default AppWithBoundary;
