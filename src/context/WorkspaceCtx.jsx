import React from 'react'

// Workspace context — shared state for all workspace pages

// Pill search matching the KG design system: icon on right inside indigo circle
function DSPillSearch({ value, onChange, placeholder, width = 200 }) {
  const [focused, setFocused] = React.useState(false);
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center',
      height: 32, boxSizing: 'border-box', paddingLeft: 14, paddingRight: 4,
      background: 'var(--card-bg)',
      border: `1px solid ${focused ? 'var(--pai-indigo)' : 'var(--shell-border)'}`,
      boxShadow: focused ? '0 0 0 3px rgba(99,96,216,0.18)' : 'none',
      borderRadius: 44, width,
      transition: 'border-color 120ms, box-shadow 120ms',
    }}>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        style={{
          flex: 1, border: 'none', outline: 'none', background: 'transparent',
          fontSize: 13, fontFamily: 'inherit', color: 'var(--pai-fg1)', minWidth: 0,
        }}
      />
      {value && (
        <button
          onMouseDown={e => { e.preventDefault(); onChange(''); }}
          style={{
            width: 16, height: 16, padding: 0, border: 'none', background: 'transparent',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--pai-fg3)', borderRadius: 999, flexShrink: 0, marginLeft: 4,
          }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      )}
      <span style={{
        width: 24, height: 24, marginLeft: 4, borderRadius: '50%',
        background: 'var(--pai-indigo-tint)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--pai-indigo)', flexShrink: 0,
      }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>
        </svg>
      </span>
    </div>
  );
}

const LibraryIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.125" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6.75 2.25H3C2.58579 2.25 2.25 2.58579 2.25 3V6.75C2.25 7.16421 2.58579 7.5 3 7.5H6.75C7.16421 7.5 7.5 7.16421 7.5 6.75V3C7.5 2.58579 7.16421 2.25 6.75 2.25Z"/>
    <path d="M15 2.25H11.25C10.8358 2.25 10.5 2.58579 10.5 3V6.75C10.5 7.16421 10.8358 7.5 11.25 7.5H15C15.4142 7.5 15.75 7.16421 15.75 6.75V3C15.75 2.58579 15.4142 2.25 15 2.25Z"/>
    <path d="M15 10.5H11.25C10.8358 10.5 10.5 10.8358 10.5 11.25V15C10.5 15.4142 10.8358 15.75 11.25 15.75H15C15.4142 15.75 15.75 15.4142 15.75 15V11.25C15.75 10.8358 15.4142 10.5 15 10.5Z"/>
    <path d="M6.75 10.5H3C2.58579 10.5 2.25 10.8358 2.25 11.25V15C2.25 15.4142 2.58579 15.75 3 15.75H6.75C7.16421 15.75 7.5 15.4142 7.5 15V11.25C7.5 10.8358 7.16421 10.5 6.75 10.5Z"/>
  </svg>
);

const SavedIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.125" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.5 3H15.75M10.5 6.75H15.75M10.5 11.25H15.75M10.5 15H15.75M3 2.25H6.75C7.16421 2.25 7.5 2.58579 7.5 3V6.75C7.5 7.16421 7.16421 7.5 6.75 7.5H3C2.58579 7.5 2.25 7.16421 2.25 6.75V3C2.25 2.58579 2.58579 2.25 3 2.25ZM3 10.5H6.75C7.16421 10.5 7.5 10.8358 7.5 11.25V15C7.5 15.4142 7.16421 15.75 6.75 15.75H3C2.58579 15.75 2.25 15.4142 2.25 15V11.25C2.25 10.8358 2.58579 10.5 3 10.5Z"/>
  </svg>
);

const WorkspaceContext = React.createContext(null);

function WorkspaceProvider({ children, onNav }) {
  const [dashboardName, setDashboardName] = React.useState('');
  const [isPrivate, setIsPrivate] = React.useState(true);
  const [widgets, setWidgets] = React.useState([]);
  const [editingWidget, setEditingWidget] = React.useState(null);
  const [isWidgetDrawerOpen, setWidgetDrawerOpen] = React.useState(false);

  const [libraryFilter, setLibraryFilter] = React.useState('all');
  const [librarySearch, setLibrarySearch] = React.useState('');
  const [savedFilter, setSavedFilter] = React.useState('all');
  const [savedVisibility, setSavedVisibility] = React.useState('all');
  const [savedSearch, setSavedSearch] = React.useState('');
  const [deleteTarget, setDeleteTarget] = React.useState(null);

  const addWidget = React.useCallback((w) => {
    setWidgets(prev => {
      const idx = prev.findIndex(x => x.id === w.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = w; return next; }
      return [...prev, w];
    });
  }, []);

  const removeWidget = React.useCallback((id) => {
    setWidgets(prev => prev.filter(x => x.id !== id));
  }, []);

  const openWidgetDrawer = React.useCallback((widget) => {
    setEditingWidget(widget ?? null);
    setWidgetDrawerOpen(true);
  }, []);

  const closeWidgetDrawer = React.useCallback(() => {
    setEditingWidget(null);
    setWidgetDrawerOpen(false);
  }, []);

  const openDeleteModal = React.useCallback((id, name) => {
    setDeleteTarget({ id, name });
  }, []);

  const closeDeleteModal = React.useCallback(() => {
    setDeleteTarget(null);
  }, []);

  return (
    <WorkspaceContext.Provider value={{
      onNav,
      dashboardName, setDashboardName,
      isPrivate, setIsPrivate,
      widgets, addWidget, removeWidget,
      editingWidget, isWidgetDrawerOpen,
      openWidgetDrawer, closeWidgetDrawer,
      libraryFilter, setLibraryFilter,
      librarySearch, setLibrarySearch,
      savedFilter, setSavedFilter,
      savedVisibility, setSavedVisibility,
      savedSearch, setSavedSearch,
      deleteTarget, openDeleteModal, closeDeleteModal,
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

function useWorkspace() {
  const ctx = React.useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return ctx;
}

export { DSPillSearch, LibraryIcon, SavedIcon, WorkspaceProvider, useWorkspace };
