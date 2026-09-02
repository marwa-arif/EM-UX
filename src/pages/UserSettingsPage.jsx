import React from 'react'
import Topbar from '../components/Topbar.jsx'
import '../styles/device.css'
import { UserSettingsNav, UserSettingsContent } from './settings/UserSettingsBody.jsx'

// Standalone full-page Settings — per-user only (Profile/Password/Notifications).
// Unlike the Admin Panel (AdminPage.jsx), which nests inside whatever shell
// was already active so its own left nav stays visible, this always takes
// over the full page: it's reachable from every shell via the same Topbar
// menu item, and has no shell-specific left nav of its own to nest next to.
function UserSettingsPage({ onNav, theme, onToggleTheme, state }) {
  const onClose = () => onNav('user-settings-exit');

  return (
    <div className="app-shell">
      <Topbar onNav={onNav} theme={theme} onToggleTheme={onToggleTheme} showNavigatorButton={false} />
      <div className="app-body">
        <aside className="settings-panel">
          <UserSettingsNav activeSection={state.activeSection} onSelect={state.setActiveSection} />
        </aside>

        <main className="exp-main exp-main--col admin-main">
          <UserSettingsContent state={state} onClose={onClose} />
        </main>
      </div>
    </div>
  );
}

export default UserSettingsPage;
