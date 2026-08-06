import React from 'react'
import Topbar from '../components/Topbar.jsx'
import '../styles/device.css'
import { useAdminPanelState, AdminSettingsNav, AdminPanelContent, AdminConfirmModal } from './admin/AdminPanelBody.jsx'

// Standalone full-page fallback shell — used where there's no primary nav to
// nest the Settings panel next to (Workspace). Everywhere else, App.jsx/
// UX3Page.jsx embed AdminSettingsNav + AdminPanelContent directly next to
// their own (collapsed) primary nav instead of mounting this.
function AdminPage({ onNav, theme, onToggleTheme }) {
  const state = useAdminPanelState();
  const onClose = () => onNav('admin-exit');

  return (
    <div className="app-shell">
      <Topbar onNav={onNav} theme={theme} onToggleTheme={onToggleTheme} />
      <div className="app-body">
        <aside className="settings-panel">
          <AdminSettingsNav activeSection={state.activeSection} onSelect={state.setActiveSection} />
        </aside>

        <main className="exp-main exp-main--col admin-main">
          <AdminPanelContent state={state} onNav={onNav} onClose={onClose} />
        </main>
      </div>

      <AdminConfirmModal confirmAction={state.confirmAction} onClose={() => state.setConfirmAction(null)} />
    </div>
  );
}

export default AdminPage;
