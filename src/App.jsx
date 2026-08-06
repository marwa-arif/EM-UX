import React, { useState, useEffect, useRef, useCallback } from 'react'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import ErrorPage from './pages/ErrorPage.jsx'
import Topbar from './components/Topbar.jsx'
import LeftNav from './components/LeftNav.jsx'
import SubHeader from './components/SubHeader.jsx'
import KGPage from './pages/KGPage.jsx'
import { FilterPanel } from './components/FilterPanel.jsx'
import { useTweaks, TweaksPanel, TweakSection, TweakSlider, TweakToggle } from './components/tweaks-panel.jsx'
import { PAI } from './ui.jsx'
import WorkspacePage from './pages/WorkspacePage.jsx'
import NavigatorPage from './pages/NavigatorPage.jsx'
import UX3Page from './pages/UX3Page.jsx'
import AdminPage from './pages/AdminPage.jsx'
import { useAdminPanelState, AdminSettingsNav, AdminPanelContent, AdminConfirmModal } from './pages/admin/AdminPanelBody.jsx'
import StudioHomePage from './pages/StudioHomePage.jsx'
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
import DataQualityOverviewPage from './pages/DataQualityOverviewPage.jsx'
import DataQualityInDepthPage from './pages/DataQualityInDepthPage.jsx'
import SplashScreen           from './components/SplashScreen.jsx'
import PasswordGate           from './components/PasswordGate.jsx'
import { useAuthGate }        from './authGate.js'
import { DownloadsProvider }  from './DownloadsContext.jsx'
import { ToastProvider }      from './context/ToastCtx.jsx'
import { toggleChipGroup, toChipsState } from './utils/crossFilter.js'

// Deployed under a subpath on GitHub Pages (e.g. /EM-UX) — strip/prepend it
// so pushState-based routing and window.location.pathname parsing work the
// same locally (BASE '') and on Pages (BASE '/EM-UX').
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
const stripBase = (pathname) => {
  const rest = BASE && pathname.startsWith(BASE) ? pathname.slice(BASE.length) : pathname;
  return rest || '/';
};
const navPath = (path) => `${BASE}${path}`;

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
// Subscribes to KGPage's edge state via window.__kgGetEdges + 'kg-edges-changed'
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
    // Poll briefly in case KGPage mounts after this component
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

  return (
    <div className="ee-root">
      {/* Save bar */}
      <div className="ee-save-bar">
        <button
          onClick={saveAsDefault}
          disabled={!dirty && !savedFlash}
          className={`ee-save-btn${savedFlash ? ' ee-save-btn--saved' : dirty ? ' ee-save-btn--dirty' : ''}`}
        >
          {savedFlash ? 'Saved' : (dirty ? 'Save as default' : 'Default saved')}
        </button>
        <button
          onClick={resetEdges}
          disabled={!dirty}
          className={`ee-reset-btn${dirty ? ' ee-reset-btn--dirty' : ''}`}
        >
          Reset
        </button>
      </div>

      <div className="ee-row-header">
        <div>Source</div><div>Target</div><div>Label</div><div></div>
      </div>

      <div className="ee-scroll-list">
        {edges.map((e, i) => (
          <div key={i} className="ee-row">
            <select className="ee-field" value={e[0]} onChange={(ev) => updateEdge(i, 'src', ev.target.value)}>
              {entities.map(en => <option key={en.id} value={en.id}>{en.label}</option>)}
            </select>
            <select className="ee-field" value={e[1]} onChange={(ev) => updateEdge(i, 'tgt', ev.target.value)}>
              {entities.map(en => <option key={en.id} value={en.id}>{en.label}</option>)}
            </select>
            <input className="ee-field" placeholder="—"
                   value={e[2] || ''}
                   onChange={(ev) => updateEdge(i, 'label', ev.target.value)} />
            <button className="ee-x-btn" title="Remove edge" onClick={() => removeEdge(i)}>×</button>
          </div>
        ))}
        {edges.length === 0 && (
          <div className="ee-empty">No edges. Add one below.</div>
        )}
      </div>

      <div className="ee-add-section">
        <div className="ee-add-label">Add edge</div>
        <div className="ee-row">
          <select className="ee-field" value={newSrc} onChange={(e) => setNewSrc(e.target.value)}>
            {entities.map(en => <option key={en.id} value={en.id}>{en.label}</option>)}
          </select>
          <select className="ee-field" value={newTgt} onChange={(e) => setNewTgt(e.target.value)}>
            {entities.map(en => <option key={en.id} value={en.id}>{en.label}</option>)}
          </select>
          <input className="ee-field" placeholder="Relationship (optional)"
                 value={newLabel}
                 onChange={(e) => setNewLabel(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && addEdge()} />
          <button className="ee-x-btn ee-add-btn" title="Add edge" onClick={addEdge}>+</button>
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
    icon: <img src="assets/icons/Navigator icon.svg" width={12} height={12} alt="" />,
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
        '--rp-shell-w': `${isCollapsedForFloat ? 0 : isOpen ? SHELL_WIDTH : 0}px`,
        '--rp-shell-border': (isOpen && !isCollapsedForFloat) ? '1px solid var(--shell-border)' : 'none',
        '--rp-shell-shadow': (isOpen && !isCollapsedForFloat) ? '-4px 0 20px rgba(0,0,0,0.18)' : 'none',
      }}
    >
      <div className="rp-shell__inner" style={{ '--rp-shell-inner-w': `${SHELL_WIDTH}px` }}>
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
              builderMode={navigatorProps?.builderMode}
              builderApi={navigatorProps?.builderApi}
              builderKind={navigatorProps?.builderKind}
              builderContext={navigatorProps?.builderContext}
              pageId={navigatorProps?.pageId}
              pageLabel={navigatorProps?.pageLabel}
              draftQuery={navigatorProps?.draftQuery}
              draftToken={navigatorProps?.draftToken}
              dockSide={navigatorProps?.dockSide}
              forceFloatToken={navigatorProps?.forceFloatToken}
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
          { label: 'High',     count: '12,353', pct: 22.59, color: 'var(--pai-red-high)'  },
          { label: 'Medium',   count: '36,136', pct: 66.08, color: 'var(--pai-red-high)'  },
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
          { label: 'Printers',         count: '124',   value: 124,  pct: '1%',   color: 'var(--pai-high-fg)'     },
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
          { label: 'High',     count: '3,560', pct: 30.26, color: 'var(--pai-red-high)'  },
          { label: 'Medium',   count: '4,188', pct: 35.60, color: 'var(--pai-red-high)'  },
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
          { label: 'Security Group',         count: '224',   value: 224,  pct: '2%',  color: 'var(--pai-high-fg)'     },
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
          { label: 'High',     count: '17,503', pct: 24.50, color: 'var(--pai-red-high)'  },
          { label: 'Medium',   count: '40,197', pct: 56.27, color: 'var(--pai-red-high)'  },
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

// Static per-route breadcrumb/title metadata for the classic (non-UX3) shell.
// Kept at module scope rather than inside App() — several routes (workspace,
// ux3, admin) return early before a function-scoped version would ever be
// initialized, so any closure capturing it (e.g. handleNav) would hit a TDZ
// ReferenceError the moment it's called from one of those routes.
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
  navigator: {
    title: 'Navigator',
    breadcrumb: ['Home', 'Navigator'],
    breadcrumbHrefs: [null, null],
  },
};

function App() {
  const [current, setCurrent] = useState(() => {
    const path = stripBase(window.location.pathname);
    if (path === '/workspace') return 'workspace';
    if (path.startsWith('/workspace/')) return path.slice(1);
    if (path === '/knowledge-graph') return 'kg';
    if (path === '/') return 'navigator';
    if (path === '/admin') return 'navigator';
    return path.slice(1) || 'navigator';
  });
  const [appMode, setAppMode] = useState(() => {
    const path = stripBase(window.location.pathname);
    return path.startsWith('/studio') ? 'studio' : 'em';
  }); // 'em' | 'studio'
  // Settings/Admin nests inside whatever shell (classic EM, Studio, UX3) was
  // already active rather than replacing it — this tracks whether that nested
  // panel is open, independent of `current`, so closing it lands exactly back
  // where the user was.
  const [settingsOpen, setSettingsOpen] = useState(() => stripBase(window.location.pathname) === '/admin');
  const adminState = useAdminPanelState();
  const [showSplash, setShowSplash] = useState(true);
  const onSplashDone = useCallback(() => setShowSplash(false), []);
  const { locked, unlock } = useAuthGate();
  const [matrixFilter, setMatrixFilter] = useState(null); // { framework, frameworkName, groupBy, row, col, colId, score }
  const [kgFocusEntity, setKgFocusEntity] = useState(null); // { type, label } — entity to pre-select when landing on Knowledge Graph
  const [assessmentBuilderOpen, setAssessmentBuilderOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('pai-theme') || 'light');
  const [navCollapsed, setNavCollapsed] = useState(false);
  // Lets a click on a dropdown-capable LeftNav item force the sidebar open
  // even while auto-collapsed (e.g. on the Navigator route) so its children
  // become visible/clickable. Cleared on every navigation.
  const [navExpandOverride, setNavExpandOverride] = useState(false);
  const [rightPanel, setRightPanel] = useState(null); // null | 'filter' | 'navigator'
  const [navigatorQuery, setNavigatorQuery] = useState('');
  // Bumped on every LeftNav "Navigator" click so NavigatorPage resets to its
  // Home screen even when `current` is already 'navigator' (mid-chat) — a
  // plain setCurrent('navigator') wouldn't re-render since the value is unchanged.
  const [navigatorReset, setNavigatorReset] = useState(0);
  const [navigatorViewMode, setNavigatorViewMode] = useState('sidebar');
  const [navigatorFloating, setNavigatorFloating] = useState(false);
  const [navigatorBuilderMode, setNavigatorBuilderMode] = useState(false);
  const [navigatorBuilderKind, setNavigatorBuilderKind] = useState('assessment');
  const [navigatorBuilderContext, setNavigatorBuilderContext] = useState(null);
  // "Ask Navigator" prefill — set by a prompt chip or a trend-chart point
  // click; draftToken bumps on every ask so the panel re-seeds its composer
  // even if it's already open on a different draft.
  const [navigatorDraftQuery, setNavigatorDraftQuery] = useState('');
  const [navigatorDraftToken, setNavigatorDraftToken] = useState(0);
  const [navigatorDock, setNavigatorDock] = useState('right');
  // Bumped whenever something that occupies the right side (e.g. the Trend
  // Explore drawer) opens while Navigator is docked as a sidebar — forces it
  // to switch to floating so the two don't fight over the same space,
  // without resetting whatever conversation is already in progress.
  const [navigatorForceFloatToken, setNavigatorForceFloatToken] = useState(0);
  const [assessmentBuilderApi, setAssessmentBuilderApi] = useState(null);
  const [dashboardBuilderApi, setDashboardBuilderApi] = useState(null);
  // Populated by Navigator's Build mode (and Ask/Research's "Add to Workspace")
  // right before navigating to a freshly-seeded `workspace/dashboard/new-*`
  // route — see the `workspace-dashboard-seed` handleNav branch below.
  const [dashboardSeed, setDashboardSeed] = useState(null);
  const BUILDER_SURFACES = {
    assessment: { matchRoute: c => c === 'report/assessments', api: assessmentBuilderApi },
    dashboard:  { matchRoute: c => c.startsWith('workspace/dashboard'), api: dashboardBuilderApi },
    dataConfig: { matchRoute: c => c === 'workspace/configure-screen', api: null },
  };
  const activeBuilderSurface = BUILDER_SURFACES[navigatorBuilderKind];
  const [visitedTabs, setVisitedTabs] = useState([]);
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

  // Set BEFORE first render of children so KGPage can read persisted edges synchronously
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
      const path = stripBase(window.location.pathname);
      setAppMode(path.startsWith('/studio') ? 'studio' : 'em');
      if (path === '/admin') { setSettingsOpen(true); return; }
      setSettingsOpen(false);
      if (path === '/workspace') setCurrent('workspace');
      else if (path.startsWith('/workspace/')) setCurrent(path.slice(1));
      else if (path === '/knowledge-graph') setCurrent('kg');
      else if (path === '/') setCurrent('navigator');
      else setCurrent(path.slice(1) || 'navigator');
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
    setRightPanel(prev => (prev === tabName ? null : tabName));
  };

  const handleModeChange = (mode) => {
    setAppMode(mode);
    if (mode === 'studio') {
      setCurrent('studio-home');
      history.pushState(null, '', navPath('/studio-home'));
    } else {
      setCurrent('exposure/overview');
      history.pushState(null, '', navPath('/exposure/overview'));
    }
  };

  const handleNav = (id, data) => {
    setNavExpandOverride(false);
    // Any navigation other than opening/closing Settings itself should back
    // it out first — clicking a primary-nav item while Settings is nested
    // beside it is a normal "go here instead" action.
    if (settingsOpen && id !== 'admin-page' && id !== 'admin-exit') setSettingsOpen(false);
    if (id === 'navigator') {
      setNavigatorViewMode('floating');
      setNavigatorFloating(true);
      setNavigatorBuilderMode(false);
      // Left-dock only applies to the Trend Explore drawer's own "ask" flow —
      // every other entry point (this one included) must fall back to the
      // normal right side, not inherit a 'left' left over from that drawer.
      setNavigatorDock('right');
      openRightTab('navigator');
      return;
    }
    if (id === 'navigator-builder') {
      setNavigatorViewMode('sidebar');
      setNavigatorFloating(false);
      setNavigatorBuilderMode(true);
      setNavigatorBuilderKind(data?.kind || 'assessment');
      setNavigatorBuilderContext(
        data?.widgetId ? { widgetId: data.widgetId, widgetLabel: data.widgetLabel }
        : data?.initialPrompt ? { initialPrompt: data.initialPrompt }
        : null
      );
      setNavigatorDock('right');
      setVisitedTabs(prev => prev.includes('navigator') ? prev : [...prev, 'navigator']);
      setRightPanel('navigator');
      return;
    }
    if (id === 'navigator-ask') {
      setNavigatorViewMode('floating');
      setNavigatorFloating(true);
      setNavigatorBuilderMode(false);
      setNavigatorDock(data?.dock === 'left' ? 'left' : 'right');
      setNavigatorDraftQuery(data?.query || '');
      setNavigatorDraftToken(n => n + 1);
      setVisitedTabs(prev => prev.includes('navigator') ? prev : [...prev, 'navigator']);
      setRightPanel('navigator');
      return;
    }
    if (id === 'navigator-ensure-floating') {
      if (rightPanel === 'navigator' && navigatorViewMode === 'sidebar') {
        setNavigatorViewMode('floating');
        setNavigatorFloating(true);
        setNavigatorDock(data?.dock === 'left' ? 'left' : 'right');
        setNavigatorForceFloatToken(n => n + 1);
      }
      return;
    }
    if (id === 'navigator-page') {
      setRightPanel(null);
      setNavigatorQuery(data || '');
      setNavigatorReset(n => n + 1);
      setCurrent('navigator');
      history.pushState(null, '', navPath('/navigator'));
      return;
    }
    // Hand-off from Navigator (Build mode's "Add to Workspace", or Ask/
    // Research's canvas equivalent) into a brand-new Workspace dashboard,
    // pre-populated with the widgets built during the chat. The route gets
    // a unique suffix each time so DashboardCanvas always mounts fresh
    // instead of reusing a stale previous "new dashboard" instance.
    if (id === 'workspace-dashboard-seed') {
      const route = `workspace/dashboard/new-${Date.now()}`;
      setDashboardSeed({ widgets: data?.widgets || [], name: data?.name || '' });
      setRightPanel(null);
      setCurrent(route);
      history.pushState(null, '', navPath('/workspace/dashboard/new'));
      return;
    }
    if (id === 'ux3-page') {
      setRightPanel(null);
      setCurrent('ux3/home');
      history.pushState(null, '', navPath('/ux3/home'));
      return;
    }
    if (id === 'ux3-exit') {
      // `data` carries the UX3 sub-route the user was viewing so "Explore in
      // Current UX" lands on its classic equivalent — but only routes the
      // classic shell actually knows (PAGE_META entries, plus 'workspace'
      // which is handled outside PAGE_META). Anything else (e.g.
      // 'client/networks', which has no classic build) falls back to the
      // default landing page instead of hitting the 404 ErrorPage.
      const validTargets = new Set([...Object.keys(PAGE_META), 'workspace']);
      const target = data && validTargets.has(data) ? data : 'exposure/overview';
      setCurrent(target);
      history.pushState(null, '', navPath(`/${target}`));
      return;
    }
    if (id === 'admin-page') {
      setRightPanel(null);
      setSettingsOpen(true);
      history.pushState(null, '', navPath('/admin'));
      return;
    }
    if (id === 'admin-exit') {
      setSettingsOpen(false);
      let url;
      if (current === 'workspace') url = '/workspace';
      else if (current.startsWith('workspace/')) url = `/${current}`;
      else if (current === 'kg') url = '/knowledge-graph';
      else url = `/${current}`;
      history.pushState(null, '', navPath(url));
      return;
    }
    if (id === 'kg') {
      setKgFocusEntity(data || null);
    }
    if (id === 'exposure/findings') {
      const category = data?.category || null;
      setFiltersByPage(prev => ({
        ...prev,
        'exposure/findings': category
          ? toChipsState([{ attrId: 'exposure-category', key: 'Exposure Category', value: category }])
          : { count: 0, chips: [] },
      }));
    }
    setCurrent(id);
    let url;
    if (id === 'workspace') url = '/workspace';
    else if (id.startsWith('workspace/')) url = `/${id}`;
    else if (id === 'kg') url = '/knowledge-graph';
    else url = `/${id}`;
    history.pushState(null, '', navPath(url));
  };

  // Per-page filter accessors
  const curPageFilters   = filtersByPage[current] || { count: 0, chips: [] };
  const activeFilterCount = curPageFilters.count;
  const activeFilters     = curPageFilters.chips;

  const setPageFilters = (pageId, count, chips) =>
    setFiltersByPage(prev => ({ ...prev, [pageId]: { count, chips } }));

  // Toggles the chip(s) behind one chart-segment click (1 chip for a single-dimension
  // mark, 2 for a stacked-segment intersection) — the single entry point every dashboard's
  // click-to-filter charts call. filtersByPage is the only copy of "what's active"; pages
  // read it back via the `crossFilters` prop and re-derive their own filtering from it.
  const toggleCrossFilterChip = (pageId, newChips) =>
    setFiltersByPage(prev => ({ ...prev, [pageId]: toChipsState(toggleChipGroup(prev[pageId]?.chips ?? [], newChips)) }));

  // Explore in: navigate to destId carrying the current page's filters
  const handleExplore = (destId) => {
    const src = filtersByPage[current] || { count: 0, chips: [] };
    setFiltersByPage(prev => ({ ...prev, [destId]: { count: src.count, chips: src.chips } }));
    handleNav(destId);
  };

  const sharedRightPanel = (
    <RightPanelShell
      tab={rightPanel}
      onTabSwitch={openRightTab}
      onClose={() => { setRightPanel(null); setNavigatorFloating(false); setNavigatorBuilderMode(false); setNavigatorBuilderKind('assessment'); setNavigatorBuilderContext(null); }}
      visitedTabs={visitedTabs}
      filterProps={{ pageId: current, onApply: (c, chips, merge = false) => {
        if (merge) {
          setFiltersByPage(prev => {
            const cur = prev[current] || { count: 0, chips: [] };
            const merged = [...cur.chips, ...(chips || [])];
            return { ...prev, [current]: { count: new Set(merged.map(f => f.attrId)).size, chips: merged } };
          });
        } else {
          setPageFilters(current, c, chips || []);
        }
      }}}
      navigatorProps={{
        onNav: handleNav,
        initialViewMode: navigatorViewMode,
        onViewModeChange: (mode) => { setNavigatorFloating(mode === 'floating'); setNavigatorViewMode(mode); },
        builderMode: navigatorBuilderMode && !!activeBuilderSurface?.matchRoute(current),
        builderApi: activeBuilderSurface?.api ?? null,
        builderKind: navigatorBuilderKind,
        builderContext: navigatorBuilderContext,
        pageId: current,
        pageLabel: PAGE_META[current]?.title || null,
        draftQuery: navigatorDraftQuery,
        draftToken: navigatorDraftToken,
        dockSide: navigatorDock,
        forceFloatToken: navigatorForceFloatToken,
      }}
      navigatorFloating={navigatorFloating}
    />
  );

  if (current === 'workspace' || current.startsWith('workspace/')) {
    return (
      <>
        {showSplash && <SplashScreen onDone={onSplashDone} authRequired={locked} onUnlock={unlock} />}
        {!showSplash && locked && (
          <div className="pw-lock-overlay">
            <PasswordGate onUnlock={unlock} />
          </div>
        )}
        {settingsOpen ? (
          <AdminPage onNav={handleNav} theme={theme} onToggleTheme={toggleTheme} />
        ) : (
          <WorkspacePage
            onNav={handleNav}
            initialRoute={current}
            theme={theme}
            onToggleTheme={toggleTheme}
            onBuilderApiReady={setDashboardBuilderApi}
            onOpenCopilotBuilder={(ctx) => handleNav('navigator-builder', { kind: ctx?.kind ?? 'dashboard', ...ctx })}
            rightPanelSlot={sharedRightPanel}
            rightPanelOpen={rightPanel !== null && !(rightPanel === 'navigator' && navigatorFloating)}
            navigatorActive={rightPanel === 'navigator'}
            seedDashboard={dashboardSeed}
            appMode={appMode}
            onModeChange={handleModeChange}
          />
        )}
      </>
    );
  }

  if (current === 'ux3' || current.startsWith('ux3/')) {
    return (
      <>
        {showSplash && <SplashScreen onDone={onSplashDone} authRequired={locked} onUnlock={unlock} />}
        {!showSplash && locked && (
          <div className="pw-lock-overlay">
            <PasswordGate onUnlock={unlock} />
          </div>
        )}
        <UX3Page
          onNav={handleNav}
          initialRoute={current}
          theme={theme}
          onToggleTheme={toggleTheme}
          settingsOpen={settingsOpen}
          adminState={adminState}
          onCloseSettings={() => handleNav('admin-exit')}
        />
      </>
    );
  }

  if (current === 'error') {
    return <ErrorPage type="error" onHome={() => { setCurrent('navigator'); history.pushState(null, '', navPath('/navigator')); }} />;
  }

  if (appMode !== 'studio' && !PAGE_META[current] && current !== 'kg') {
    return <ErrorPage type="notFound" onHome={() => { setCurrent('navigator'); history.pushState(null, '', navPath('/navigator')); }} />;
  }

  const pageMeta = PAGE_META[current] || PAGE_META.kg;
  const isKG = current === 'kg' || !PAGE_META[current];
  const showingAssessmentBuilder = current === 'report/assessments' && assessmentBuilderOpen;
  const isNavigatorRoute = current === 'navigator';
  // Auto-collapse whenever a docked right panel is open (Navigator in sidebar/
  // builder mode, or the filter panel) or the full-page Navigator route is
  // active, to reclaim width. Floating Navigator overlays content instead of
  // consuming layout width, so it's exempt. Never overrides the user's manual
  // preference once Navigator/the panel closes.
  const collapsed = (navCollapsed || (rightPanel !== null && !(rightPanel === 'navigator' && navigatorFloating)) || isNavigatorRoute) && !navExpandOverride;

  return (
    <div className="app-shell">
      {showSplash && <SplashScreen onDone={onSplashDone} authRequired={locked} onUnlock={unlock} />}
      {!showSplash && locked && (
        <div className="pw-lock-overlay">
          <PasswordGate onUnlock={unlock} />
        </div>
      )}
      <Topbar onNav={handleNav} navigatorActive={rightPanel === 'navigator'} showNavigatorButton={!isNavigatorRoute} theme={theme} onToggleTheme={toggleTheme} />

      <div ref={isKG && appMode !== 'studio' ? canvasRef : null} className="app-body">
        <LeftNav
          current={current}
          onNav={handleNav}
          collapsed={settingsOpen || collapsed}
          onToggleCollapse={() => {
            if (isNavigatorRoute) {
              setNavExpandOverride((o) => !o);
            } else {
              setNavExpandOverride(false);
              setNavCollapsed((c) => !c);
            }
          }}
          onExpand={() => setNavExpandOverride(true)}
          mode={appMode}
          onModeChange={handleModeChange}
        />

        {settingsOpen ? (
          <>
            <aside className="settings-panel">
              <AdminSettingsNav activeSection={adminState.activeSection} onSelect={adminState.setActiveSection} />
            </aside>
            <main className="exp-main exp-main--col admin-main">
              <AdminPanelContent state={adminState} onNav={handleNav} onClose={() => handleNav('admin-exit')} />
            </main>
          </>
        ) : appMode === 'studio' ? (
          <main className="exp-main exp-main--row studio-main">
            <div className="exp-content-col">
              {!isNavigatorRoute && (
                <SubHeader
                  title="Studio"
                  breadcrumb={['Home']}
                  breadcrumbHrefs={[null]}
                  showMenu={false}
                  showExplore={false}
                  actions={null}
                />
              )}
              <div className="page-scroll">
                {isNavigatorRoute ? (
                  <NavigatorPage initialQuery={navigatorQuery} resetToken={navigatorReset} onNav={handleNav} />
                ) : (
                  <StudioHomePage onNav={handleNav} />
                )}
              </div>
            </div>
            {sharedRightPanel}
          </main>
        ) : (
          <main className="exp-main exp-main--row">
            <div className="exp-content-col">
              {!isNavigatorRoute && (
                <SubHeader
                  title={showingAssessmentBuilder ? 'Assessment Builder' : pageMeta.title}
                  breadcrumb={showingAssessmentBuilder ? ['Home', 'Report', 'Assessments', 'New Assessment'] : pageMeta.breadcrumb}
                  breadcrumbHrefs={showingAssessmentBuilder ? [null, null, null, null] : pageMeta.breadcrumbHrefs}
                  breadcrumbClicks={showingAssessmentBuilder ? [undefined, undefined, () => setAssessmentBuilderOpen(false)] : [() => handleNav('exposure/overview')]}
                  leading={undefined}
                  pageId={current}
                  activeFilterCount={activeFilterCount}
                  activeFilters={activeFilters}
                  onRemoveFilter={(idx) => {
                    setFiltersByPage(prev => {
                      const cur = prev[current] || { count: 0, chips: [] };
                      const updated = cur.chips.filter((_, i) => i !== idx);
                      return { ...prev, [current]: { count: new Set(updated.map(c => c.attrId)).size, chips: updated } };
                    });
                  }}
                  onClearFilters={() => {
                    setPageFilters(current, 0, []);
                  }}
                  filterActive={rightPanel === 'filter'}
                  onFilter={() => openRightTab('filter')}
                  onAdd={showingAssessmentBuilder ? undefined : pageMeta.onAdd}
                  onExplore={handleExplore}
                  onEdit={DISCOVER_PAGES.has(current) ? () => {
                    setCurrent('workspace/dashboard/discover');
                    history.pushState(null, '', navPath('/workspace'));
                  } : undefined}
                />
              )}
              <div className="page-scroll">
                {isNavigatorRoute && <NavigatorPage initialQuery={navigatorQuery} resetToken={navigatorReset} onNav={handleNav} />}
                {current === 'exposure/overview'   && <ExposureOverviewPage onNav={handleNav} />}
                {current === 'exposure/findings'   && <FindingsPage onNav={handleNav} crossFilters={filtersByPage['exposure/findings']?.chips ?? []} onToggleFilter={chips => toggleCrossFilterChip('exposure/findings', chips)} />}
                {current === 'discover/device'     && <DiscoverDevicePage onNav={handleNav} crossFilters={filtersByPage['discover/device']?.chips ?? []} onToggleFilter={chips => toggleCrossFilterChip('discover/device', chips)} />}
                {current === 'discover/cloud'      && <DiscoverCloudPage onNav={handleNav} crossFilters={filtersByPage['discover/cloud']?.chips ?? []} onToggleFilter={chips => toggleCrossFilterChip('discover/cloud', chips)} />}
                {current === 'discover/identity'   && <DiscoverIdentityPage onNav={handleNav} crossFilters={filtersByPage['discover/identity']?.chips ?? []} onToggleFilter={chips => toggleCrossFilterChip('discover/identity', chips)} />}
                {current === 'report/compliance'        && <CompliancePage expanded={complianceExpanded} onExpandChange={setComplianceExpanded} onNav={handleNav} />}
                {current === 'report/assessments'       && <AssessmentsPage onOpenCopilotBuilder={() => handleNav('navigator-builder')} onBuilderApiReady={setAssessmentBuilderApi} builderOpen={assessmentBuilderOpen} onBuilderOpenChange={setAssessmentBuilderOpen} onNav={handleNav} />}
                {current === 'report/compliance-matrix'    && <ComplianceMatrixPage onCellClick={filter => { setMatrixFilter(filter); handleNav('report/compliance-findings'); }} />}
                {current === 'report/compliance-findings'  && <ComplianceFindingsPage filter={matrixFilter} onClearFilter={() => setMatrixFilter(null)} onNav={handleNav} />}
                {current === 'data-quality/overview'       && <DataQualityOverviewPage onNav={handleNav} crossFilters={filtersByPage['data-quality/overview']?.chips ?? []} onToggleFilter={chips => toggleCrossFilterChip('data-quality/overview', chips)} />}
                {current === 'data-quality/in-depth'       && <DataQualityInDepthPage onNav={handleNav} />}
                {!isKG && !isNavigatorRoute && current !== 'exposure/overview' && current !== 'exposure/findings' && current !== 'discover/device' && current !== 'discover/cloud' && current !== 'discover/identity' && current !== 'report/compliance' && current !== 'report/assessments' && current !== 'report/compliance-matrix' && current !== 'report/compliance-findings' && current !== 'data-quality/overview' && current !== 'data-quality/in-depth' && <ComingSoon />}
                {isKG && <KGPage focusEntity={kgFocusEntity} />}
              </div>
            </div>
            {sharedRightPanel}
          </main>
        )}
      </div>

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

      <AdminConfirmModal confirmAction={adminState.confirmAction} onClose={() => adminState.setConfirmAction(null)} />
    </div>
  );
}

function AppWithBoundary() {
  return (
    <ToastProvider>
      <DownloadsProvider>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </DownloadsProvider>
    </ToastProvider>
  );
}

export default AppWithBoundary;
