import React from 'react'

// Workspace context — shared state for all workspace pages

// Pill search matching the KG design system: icon on right inside indigo circle
function DSPillSearch({ value, onChange, placeholder, width = 200 }) {
  const [focused, setFocused] = React.useState(false);
  return (
    <div
      className={`ds-pill-search${focused ? ' ds-pill-search--focused' : ''}`}
      style={{ width }}
    >
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className="ds-pill-search__input"
      />
      {value && (
        <button
          onMouseDown={e => { e.preventDefault(); onChange(''); }}
          className="ds-pill-search__clear"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      )}
      <span className="ds-pill-search__icon">
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

function WorkspaceProvider({ children, onNav, editDashboardSeed, setEditDashboardSeed }) {
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
  const [savedReports, setSavedReports] = React.useState([]);
  const [savedDashboards, setSavedDashboards] = React.useState([]);
  const [justSavedName, setJustSavedName] = React.useState(null);

  const addSavedReport = React.useCallback((entry) => {
    setSavedReports(prev => [entry, ...prev.filter(r => r.name !== entry.name)]);
  }, []);

  const addSavedDashboard = React.useCallback((entry) => {
    setSavedDashboards(prev => [entry, ...prev.filter(d => d.id !== entry.id && d.name !== entry.name)]);
  }, []);
  const [uploadedFile, setUploadedFile] = React.useState(null);   // File object
  const [uploadSource, setUploadSource] = React.useState('html'); // 'html' | 'design'

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
      editDashboardSeed, setEditDashboardSeed,
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
      savedReports, addSavedReport,
      savedDashboards, addSavedDashboard,
      justSavedName, setJustSavedName,
      uploadedFile, setUploadedFile,
      uploadSource, setUploadSource,
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

// ── Import banner — shared by Library & Saved so it never appears/disappears
// between the two tabs (that mismatch caused a layout jump on tab switch) ──
const ImportSparkleIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3 L13.5 8.5 L19 10 L13.5 11.5 L12 17 L10.5 11.5 L5 10 L10.5 8.5 Z"/>
    <path d="M5 3 L5.75 5.25 L8 6 L5.75 6.75 L5 9 L4.25 6.75 L2 6 L4.25 5.25 Z" opacity="0.6"/>
    <path d="M19 15 L19.5 16.5 L21 17 L19.5 17.5 L19 19 L18.5 17.5 L17 17 L18.5 16.5 Z" opacity="0.6"/>
  </svg>
);

const ImportCodeIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6"/>
    <polyline points="8 6 2 12 8 18"/>
  </svg>
);

const ImportUploadIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

const ImportFigmaIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3h4a3 3 0 0 1 0 6H8z"/>
    <path d="M8 9h4a3 3 0 0 1 0 6H8z"/>
    <path d="M8 15h3a3 3 0 1 1-3 3z"/>
    <circle cx="15" cy="12" r="3"/>
  </svg>
);

function LibraryImportBar() {
  const { onNav, setUploadedFile, setUploadSource } = useWorkspace();
  const fileRef = React.useRef(null);
  const [connectModalOpen, setConnectModalOpen] = React.useState(false);
  const [connectSource, setConnectSource] = React.useState(null); // 'claude' | 'figma'

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFile(file);
    setUploadSource('html');
    onNav('workspace/configure-screen');
    e.target.value = '';   // reset so same file can be re-selected
  };

  const closeConnectModal = () => { setConnectModalOpen(false); setConnectSource(null); };

  const handleConnectContinue = () => {
    if (!connectSource) return;
    setUploadSource('design');
    closeConnectModal();
    onNav('workspace/configure-screen');
  };

  // Close connect-source modal on Escape
  React.useEffect(() => {
    if (!connectModalOpen) return;
    const handler = (e) => { if (e.key === 'Escape') closeConnectModal(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [connectModalOpen]);

  return (
    <>
      <div className="lib-import">
        <div className="lib-import-icon">
          <ImportSparkleIcon />
        </div>
        <div className="lib-import-text">
          <span className="lib-import-title">Import a Screen</span>
          <span className="lib-import-desc">Upload an HTML file or connect a design — AI wires your data automatically.</span>
        </div>
        <div className="lib-import-btns">
          <button className="ds-btn sz-sm t-outline" onClick={() => setConnectModalOpen(true)}>
            <ImportCodeIcon /> Connect Design
          </button>
          <button className="ds-btn sz-sm t-primary" onClick={() => fileRef.current?.click()}>
            <ImportUploadIcon /> Upload HTML
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".html,.htm"
            className="lib-file-input"
            onChange={handleFileChange}
          />
        </div>
      </div>

      {connectModalOpen && (
        <div className="ds-modal-overlay" onClick={closeConnectModal}>
          <div className="ds-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="ds-modal-header">
              <span className="ds-modal-title">Connect a Design</span>
              <button className="ds-modal-close" onClick={closeConnectModal} aria-label="Close">×</button>
            </div>
            <div className="ds-modal-body">
              <p className="ds-modal-desc">Choose where to pull your design from. AI detects widgets and wires your data automatically.</p>
              <div className="dcp-source-row">
                <button
                  className={`dcp-source-btn${connectSource === 'claude' ? ' active' : ''}`}
                  onClick={() => setConnectSource('claude')}
                >
                  <span className="dcp-source-btn-icon"><ImportSparkleIcon /></span>
                  <span className="dcp-source-btn-label">Claude Code</span>
                  <span className="dcp-source-btn-sub">AI-generated design</span>
                </button>
                <button
                  className={`dcp-source-btn${connectSource === 'figma' ? ' active' : ''}`}
                  onClick={() => setConnectSource('figma')}
                >
                  <span className="dcp-source-btn-icon"><ImportFigmaIcon /></span>
                  <span className="dcp-source-btn-label">Figma</span>
                  <span className="dcp-source-btn-sub">Import from a file</span>
                </button>
              </div>
            </div>
            <div className="ds-modal-footer">
              <button className="ds-btn sz-md t-outline" onClick={closeConnectModal}>Cancel</button>
              <button className="ds-btn sz-md t-primary" disabled={!connectSource} onClick={handleConnectContinue}>Continue</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export { DSPillSearch, LibraryIcon, SavedIcon, LibraryImportBar, WorkspaceProvider, useWorkspace };
