import React, { useState, useEffect, useRef } from 'react'
import Topbar from './components/Topbar.jsx'
import LeftNav from './components/LeftNav.jsx'
import SubHeader from './components/SubHeader.jsx'
import { PageKG } from './pages/PageKG.jsx'
import { FilterPanel, GraphFilterDrawer } from './components/FilterPanel.jsx'
import { useTweaks, TweaksPanel, TweakSection, TweakSlider, TweakToggle } from './components/tweaks-panel.jsx'
import { PAI } from './ui.jsx'

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
    border: '1px solid #E6E6E6', background: '#fff', color: '#101010',
    fontFamily: 'inherit',
    minWidth: 0,
  };
  const inputStyle = { ...selStyle };
  const xBtnStyle = {
    width: 22, height: 22, borderRadius: 4, border: '1px solid #E6E6E6',
    background: '#fff', color: '#6E6E6E', cursor: 'pointer',
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
            borderColor: savedFlash ? '#4FAE5E' : (dirty ? '#6360D8' : 'rgba(0,0,0,.1)'),
            background: savedFlash ? '#E7F4E9' : (dirty ? '#6360D8' : 'rgba(0,0,0,.04)'),
            color: savedFlash ? '#2F7A3D' : (dirty ? '#fff' : '#8A8A8A'),
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
            borderRadius: 6, border: '1px solid rgba(0,0,0,.1)',
            background: 'transparent',
            color: dirty ? '#6E6E6E' : 'rgba(0,0,0,.25)',
            fontSize: 11,
            cursor: dirty ? 'pointer' : 'default',
            fontFamily: 'inherit',
          }}
        >
          Reset
        </button>
      </div>

      <div style={{ ...rowStyle, fontSize: 9, color: '#8A8A8A', textTransform: 'uppercase', letterSpacing: '0.04em', paddingBottom: 4, borderBottom: '1px solid #F0F0F0', marginBottom: 6 }}>
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
                    onMouseEnter={(ev) => ev.currentTarget.style.background = '#FBE9EA'}
                    onMouseLeave={(ev) => ev.currentTarget.style.background = '#fff'}
            >×</button>
          </div>
        ))}
        {edges.length === 0 && (
          <div style={{ fontSize: 11, color: '#8A8A8A', padding: '8px 0' }}>No edges. Add one below.</div>
        )}
      </div>

      <div style={{ borderTop: '1px solid #F0F0F0', marginTop: 8, paddingTop: 8 }}>
        <div style={{ fontSize: 9, color: '#8A8A8A', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
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
          <button style={{ ...xBtnStyle, color: '#6360D8', borderColor: '#D6D3F1' }}
                  title="Add edge"
                  onClick={addEdge}>+</button>
        </div>
      </div>
    </div>
  );
}

const WORKSPACE_URL = 'workspace.html';

function App() {
  const [current, setCurrent] = useState('kg');
  const [collapsed, setCollapsed] = useState(false);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [graphFilterOpen, setGraphFilterOpen] = useState(false);
  const [activeFilterCount, setActiveFilterCount] = useState(0);
  const [tweaks, setTweak] = useTweaks(FLOAT_TWEAK_DEFAULTS);
  const [canvasTop, setCanvasTop] = useState(0);
  const canvasRef = useRef(null);

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

  const handleNav = (id) => {
    if (id === 'workspace' || id.startsWith('workspace/')) {
      window.location.href = WORKSPACE_URL;
      return;
    }
    setCurrent(id);
  };

  const meta = { title: 'Knowledge Graph', crumbs: ['Dashboard', 'Knowledge Graph'] };

  return (
    <div data-screen-label="Knowledge Graph" style={{
      display: 'flex', flexDirection: 'column',
      height: '100vh', overflow: 'hidden',
      fontFamily: "'Inter', system-ui",
      color: PAI.fg1, background: 'var(--shell-bg, #F7F9FC)',
    }}>
      <Topbar />

      <div ref={canvasRef} style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <LeftNav
          current={current}
          onNav={handleNav}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
        />

        <main style={{
          flex: 1, minWidth: 0,
          display: 'flex', flexDirection: 'column',
          overflow: 'auto',
          background: '#FAFBFD',
        }}>
          <SubHeader
            title={meta.title}
            breadcrumb={meta.crumbs}
            breadcrumbHrefs={[WORKSPACE_URL, null]}
            activeFilterCount={activeFilterCount}
            filterActive={filterPanelOpen}
            onFilter={() => setFilterPanelOpen(o => !o)}
            onAdd={() => {}}
            onExplore={() => {}}
          />

          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex' }}>
            {/* Canvas — always full width */}
            <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
              <PageKG />
            </div>

            {/* Filter panel — flex-push 348px sidebar */}
            <div style={{
              width: filterPanelOpen ? 348 : 0,
              flexShrink: 0,
              background: '#fff',
              borderLeft: filterPanelOpen ? '1px solid #E6E6E6' : 'none',
              boxShadow: filterPanelOpen ? '-4px 0 20px rgba(0,0,0,0.07)' : 'none',
              overflow: 'hidden',
              display: 'flex', flexDirection: 'column',
              transition: 'width 280ms cubic-bezier(0.4,0,0.2,1)',
            }}>
              <div style={{ width: 348, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <FilterPanel
                  onApply={(count) => setActiveFilterCount(count)}
                  onClose={() => setFilterPanelOpen(false)}
                  onOpenGraphFilter={() => setGraphFilterOpen(o => !o)}
                  graphFilterOpen={graphFilterOpen}
                />
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Graph Filter bottom drawer — position fixed, escapes all stacking contexts */}
      {GraphFilterDrawer && (
        <GraphFilterDrawer
          open={graphFilterOpen}
          onClose={() => setGraphFilterOpen(false)}
          onApply={(count) => { setActiveFilterCount(count); setGraphFilterOpen(false); }}
          onClose={() => setGraphFilterOpen(false)}
          top={canvasTop}
        />
      )}

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
    </div>
  );
}

export default App;
