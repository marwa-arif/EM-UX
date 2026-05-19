import React, { useState, useEffect, useRef } from 'react'
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
import DiscoverDevicePage from './pages/DiscoverDevicePage.jsx'

const FLOAT_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "floatEnabled": true,
  "ampX": 6,
  "ampY": 4,
  "speedX": 1,
  "speedY": 0.5,
  "variation": 50,
  "edges": [
    ["account", "identity", "Associated with"],
    ["identity", "finding", "Has"],
    ["application", "host", "Running on"],
    ["vulnerability", "finding", "Has"],
    ["assessment", "finding", "Associated with"],
    ["cluster", "finding", "Has"],
    ["container", "finding", "Has"],
    ["cloudAccount", "finding", "Has"],
    ["storage", "finding", "Has"],
    ["netSvc", "finding", "Has"],
    ["network", "finding", "Has"],
    ["host", "finding", "Has"],
    ["host", "vulnerability", "Has"],
    ["person", "ticket", "Associated with"],
    ["person", "identity", "Has"],
    ["person", "finding", "Has"],
    ["identity", "ticket", "Created"],
    ["account", "group", "Member of"],
    ["group", "group", "Member of"],
    ["identity", "host", "Associated with"],
    ["application", "vulnerability", "Has"],
    ["container", "vulnerability", "Has"],
    ["cloudAccount", "cluster", "Has"],
    ["cloudAccount", "container", "Has"],
    ["cloudAccount", "host", "Has"],
    ["cloudAccount", "storage", "Has"],
    ["person", "host", "Owns"]
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
      if (field === 'src') copy[0] = value;
      if (field === 'tgt') copy[1] = value;
      if (field === 'label') copy[2] = value || null;
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
      if (a[0] !== b[0] || a[1] !== b[1] || (a[2] || null) !== (b[2] || null)) return true;
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

function App() {
  const [current, setCurrent] = useState(() => {
    const path = window.location.pathname;
    if (path === '/workspace' || path.startsWith('/workspace/')) return 'workspace';
    if (path === '/knowledge-graph' || path === '/') return 'kg';
    return path.slice(1) || 'kg';
  });
  const [theme, setTheme] = useState(() => localStorage.getItem('pai-theme') || 'light');
  const [collapsed, setCollapsed] = useState(false);
  const [rightPanel, setRightPanel] = useState(null); // null | 'filter' | 'navigator'
  const [navigatorQuery, setNavigatorQuery] = useState('');
  const [navigatorViewMode, setNavigatorViewMode] = useState('sidebar');
  const [navigatorFloating, setNavigatorFloating] = useState(false);
  const [visitedTabs, setVisitedTabs] = useState([]);
  const [graphFilterOpen, setGraphFilterOpen] = useState(false);
  const [activeFilterCount, setActiveFilterCount] = useState(0);
  const [tweaks, setTweak] = useTweaks(FLOAT_TWEAK_DEFAULTS);
  const [canvasTop, setCanvasTop] = useState(0);
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
      else if (path === '/knowledge-graph' || path === '/') setCurrent('kg');
      else setCurrent(path.slice(1) || 'kg');
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

  if (current === 'workspace' || current.startsWith('workspace/')) {
    return <WorkspacePage onNav={handleNav} />
  }

  if (current === 'navigator' || current.startsWith('navigator/')) {
    return <NavigatorPage onNav={handleNav} current={current} initialQuery={navigatorQuery} />
  }

  const PAGE_META = {
    'exposure/overview': {
      title: 'Overview',
      breadcrumb: ['Dashboard', 'Exposure', 'Overview'],
      breadcrumbHrefs: [null, null, null],
    },
    'exposure/findings': {
      title: 'Findings',
      breadcrumb: ['Dashboard', 'Exposure', 'Findings'],
      breadcrumbHrefs: [null, null, null],
    },
    'discover/device': {
      title: 'Device',
      breadcrumb: ['Dashboard', 'Discover', 'Device'],
      breadcrumbHrefs: [null, null, null],
    },
    'discover/cloud': {
      title: 'Cloud',
      breadcrumb: ['Dashboard', 'Discover', 'Cloud'],
      breadcrumbHrefs: [null, null, null],
    },
    'discover/identity': {
      title: 'Identity',
      breadcrumb: ['Dashboard', 'Discover', 'Identity'],
      breadcrumbHrefs: [null, null, null],
    },
    'report/compliance': {
      title: 'Compliance',
      breadcrumb: ['Dashboard', 'Report', 'Compliance'],
      breadcrumbHrefs: [null, null, null],
    },
    'report/assessments': {
      title: 'Assessments',
      breadcrumb: ['Dashboard', 'Report', 'Assessments'],
      breadcrumbHrefs: [null, null, null],
    },
    'report/compliance-matrix': {
      title: 'Compliance Matrix',
      breadcrumb: ['Dashboard', 'Report', 'Compliance Matrix'],
      breadcrumbHrefs: [null, null, null],
    },
    'report/compliance-findings': {
      title: 'Compliance Findings',
      breadcrumb: ['Dashboard', 'Report', 'Compliance Findings'],
      breadcrumbHrefs: [null, null, null],
    },
    'data-quality/overview': {
      title: 'Overview',
      breadcrumb: ['Dashboard', 'Data Quality', 'Overview'],
      breadcrumbHrefs: [null, null, null],
    },
    'data-quality/in-depth': {
      title: 'In-Depth',
      breadcrumb: ['Dashboard', 'Data Quality', 'In-Depth'],
      breadcrumbHrefs: [null, null, null],
    },
    'remediation/queue': {
      title: 'Queue',
      breadcrumb: ['Dashboard', 'Remediation', 'Queue'],
      breadcrumbHrefs: [null, null, null],
    },
    'remediation/closed': {
      title: 'Closed',
      breadcrumb: ['Dashboard', 'Remediation', 'Closed'],
      breadcrumbHrefs: [null, null, null],
    },
    kg: {
      title: 'Knowledge Graph',
      breadcrumb: ['Dashboard', 'Knowledge Graph'],
      breadcrumbHrefs: ['/knowledge-graph', null],
      onAdd: () => {},
      onExplore: () => {},
    },
  };

  const pageMeta = PAGE_META[current] || PAGE_META.kg;
  const isKG = current === 'kg' || !PAGE_META[current];

  const sharedRightPanel = (
    <RightPanelShell
      tab={rightPanel}
      onTabSwitch={openRightTab}
      onClose={() => { setRightPanel(null); setNavigatorFloating(false); }}
      visitedTabs={visitedTabs}
      filterProps={{ onApply: (c) => setActiveFilterCount(c), onOpenGraphFilter: () => setGraphFilterOpen(o => !o), graphFilterOpen }}
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
      <Topbar onNav={handleNav} navigatorActive={rightPanel === 'navigator'} theme={theme} onToggleTheme={toggleTheme} />

      <div ref={isKG ? canvasRef : null} style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <LeftNav
          current={current}
          onNav={handleNav}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
        />

        <main className="exp-main" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'row', overflow: 'hidden', background: 'var(--ctrl-bg)' }}>
          <div className="exp-content-col" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <SubHeader
              title={pageMeta.title}
              breadcrumb={pageMeta.breadcrumb}
              breadcrumbHrefs={pageMeta.breadcrumbHrefs}
              activeFilterCount={activeFilterCount}
              filterActive={rightPanel === 'filter'}
              onFilter={() => openRightTab('filter')}
              onAdd={pageMeta.onAdd}
              onExplore={pageMeta.onExplore}
            />
            <div className="page-scroll" style={{ flex: 1, minWidth: 0, overflow: 'auto' }}>
              {current === 'exposure/overview'  && <ExposureOverviewPage />}
              {current === 'exposure/findings'  && <FindingsPage />}
              {current === 'discover/device'    && <DiscoverDevicePage />}
              {!isKG && current !== 'exposure/overview' && current !== 'exposure/findings' && current !== 'discover/device' && <ComingSoon />}
              {isKG && <PageKG />}
            </div>
          </div>
          {sharedRightPanel}
        </main>
      </div>

      {isKG && GraphFilterDrawer && (
        <GraphFilterDrawer
          open={graphFilterOpen}
          onClose={() => setGraphFilterOpen(false)}
          onApply={(count) => { setActiveFilterCount(count); setGraphFilterOpen(false); }}
          top={canvasTop}
        />
      )}

      {isKG && (
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

export default App;
