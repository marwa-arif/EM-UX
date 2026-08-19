import React, { useState, useRef, useEffect } from 'react'
import { Icons } from '../ui.jsx'
import VersionBadge from './VersionBadge.jsx'
import NotificationPanel, { initialNotifications } from './NotificationPanel.jsx'
import HelpSupportPanel from './HelpSupportPanel.jsx'
import { useDownloads } from '../DownloadsContext.jsx'
import { IcPanelToggle } from './LeftNav.jsx'

const SunIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);

const MoonIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

const SettingsIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

const HelpIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const SparkleIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z"/>
  </svg>
);

const LogoutIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const UserIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

function Topbar({ onNav, navigatorActive, showNavigatorButton = true, theme = 'light', onToggleTheme, onStartTour, navCollapsed, onToggleNavCollapse, onNavToggleHoverEnter, onNavToggleHoverLeave, navDesign, onSetNavDesign }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const [helpOpen, setHelpOpen] = useState(false);

  const [notifOpen, setNotifOpen] = useState(false);
  const [notifFilter, setNotifFilter] = useState('all');
  const [notifications, setNotifications] = useState(initialNotifications);
  const { downloads, retryDownload, dismissDownload, bellTargetRef, bellPulse } = useDownloads();
  const notifRef = useRef(null);
  const unreadCount = notifications.filter(n => !n.read).length;

  const [bellPulsing, setBellPulsing] = useState(false);
  const prevBellPulse = useRef(bellPulse);
  useEffect(() => {
    if (bellPulse === prevBellPulse.current) return;
    prevBellPulse.current = bellPulse;
    setBellPulsing(true);
    const t = setTimeout(() => setBellPulsing(false), 500);
    return () => clearTimeout(t);
  }, [bellPulse]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [menuOpen]);

  useEffect(() => {
    if (!notifOpen) return;
    const onDown = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [notifOpen]);

  const handleMenuOption = (option) => {
    setMenuOpen(false);
    if (option === 'settings') onNav?.('user-settings-page');
    else if (option === 'help') setHelpOpen(true);
    else if (option === 'ux3') onNav?.('ux3-page');
    else if (option === 'logout') window.location.href = import.meta.env.BASE_URL;
  };

  const handleMarkAllRead = () => setNotifications(ns => ns.map(n => ({ ...n, read: true })));
  const handleMarkRead = (id) => setNotifications(ns => ns.map(n => n.id === id ? { ...n, read: true } : n));
  const handleDismiss = (id) => setNotifications(ns => ns.filter(n => n.id !== id));

  return (
    <header className="topbar">
      {/* Option 2 ("rail") owns its own collapse/expand toggle inside the
          nav itself (see LeftNavAlt.jsx) instead of this shared Topbar
          button, same reasoning as the Navigator sidebar's own toggle.
          Option 4 ("split") has no full-width "expanded" state to toggle
          back into at all — its rail is icon-only by design, always the
          same width whether pinned or not — so the button is dropped
          rather than given an equivalent; the rail still auto-hides in the
          same contexts (e.g. an active Navigator chat) and the existing
          hover-peek zone still recovers it, same as Options 1/3. */}
      {onToggleNavCollapse && navDesign !== 'rail' && navDesign !== 'split' && (
        <button
          className="topbar__btn topbar__nav-toggle"
          onClick={onToggleNavCollapse}
          onMouseEnter={onNavToggleHoverEnter}
          onMouseLeave={onNavToggleHoverLeave}
          title={navCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={navCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          data-tour="topbar-nav-toggle"
        >
          <IcPanelToggle open={navCollapsed} />
        </button>
      )}

      <button
        className="topbar__logo-btn"
        onClick={() => onNav?.('navigator-page')}
        title="Navigator"
        aria-label="Go to Navigator home"
        data-tour="topbar-logo"
      >
        <img src="assets/logo/pai-wordmark-white.svg" height={22} alt="Prevalent AI"
             className="topbar__logo" />
      </button>

      <div className="topbar__spacer" />

      {showNavigatorButton && (
        <button
          className={`topbar__navigator${navigatorActive ? ' active' : ''}`}
          onClick={() => onNav?.('navigator')}
          title="Navigator"
          aria-label="Navigator"
          data-tour="topbar-navigator"
        >
          <span className="topbar__navigator-icon" />
        </button>
      )}

      {onSetNavDesign && (
        <div className="topbar__nav-switch" role="group" aria-label="Left nav design">
          {/* Display order reshuffled to 2/4/1/3 (former Option 2 first, then
              4, 1, 3) — the numbers here are just this slot's position, not
              tied to each design's underlying navDesign value/id. */}
          <button
            type="button"
            onClick={() => onSetNavDesign('rail')}
            title="Nav design 1"
            aria-label="Nav design 1"
            aria-pressed={navDesign === 'rail'}
            className={`topbar__nav-switch-btn${navDesign === 'rail' ? ' topbar__nav-switch-btn--active' : ''}`}
          >
            1
          </button>
          <button
            type="button"
            onClick={() => onSetNavDesign('split')}
            title="Nav design 2"
            aria-label="Nav design 2"
            aria-pressed={navDesign === 'split'}
            className={`topbar__nav-switch-btn${navDesign === 'split' ? ' topbar__nav-switch-btn--active' : ''}`}
          >
            2
          </button>
          <button
            type="button"
            onClick={() => onSetNavDesign('classic')}
            title="Nav design 3"
            aria-label="Nav design 3"
            aria-pressed={navDesign === 'classic'}
            className={`topbar__nav-switch-btn${navDesign === 'classic' ? ' topbar__nav-switch-btn--active' : ''}`}
          >
            3
          </button>
          <button
            type="button"
            onClick={() => onSetNavDesign('renamed')}
            title="Nav design 4"
            aria-label="Nav design 4"
            aria-pressed={navDesign === 'renamed'}
            className={`topbar__nav-switch-btn${navDesign === 'renamed' ? ' topbar__nav-switch-btn--active' : ''}`}
          >
            4
          </button>
        </div>
      )}

      <VersionBadge />

      <button
        title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        className="topbar__btn topbar__theme-toggle"
        onClick={onToggleTheme}
        data-tour="topbar-theme"
      >
        {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
      </button>

      <div ref={notifRef} className="topbar__notif">
        <button
          ref={bellTargetRef}
          title="Notifications"
          aria-label="Notifications"
          aria-haspopup="menu"
          aria-expanded={notifOpen}
          className={`topbar__btn${bellPulsing ? ' topbar__btn--pulse' : ''}`}
          onClick={() => setNotifOpen(o => !o)}
          data-tour="topbar-notif"
        >
          {Icons.bell}
          {unreadCount > 0 && <span className="topbar__notif-dot" />}
        </button>

        {notifOpen && (
          <NotificationPanel
            notifications={notifications}
            filter={notifFilter}
            onFilterChange={setNotifFilter}
            onMarkAllRead={handleMarkAllRead}
            onMarkRead={handleMarkRead}
            onDismiss={handleDismiss}
            downloads={downloads}
            onRetryDownload={retryDownload}
            onDismissDownload={dismissDownload}
          />
        )}
      </div>

      <div ref={menuRef} className="topbar__account">
        <button
          title="Account menu"
          aria-label="Account menu"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className="topbar__avatar"
          onClick={() => setMenuOpen(o => !o)}
          data-tour="topbar-account"
        >
          <UserIcon />
        </button>

        {menuOpen && (
          <div className="topbar__account-menu" role="menu">
            <div className="topbar__account-menu-header">
              <div className="topbar__account-menu-name">MP</div>
              <div className="topbar__account-menu-email">mp@prevalent.ai</div>
              <div className="topbar__account-menu-timestamp">
                Last updated <span className="topbar__account-menu-timestamp-val">Apr 20, 2026 · 14:32 UTC</span>
              </div>
            </div>
            <div className="topbar__account-menu-divider" />
            <button className="topbar__account-menu-item" role="menuitem" onClick={() => handleMenuOption('settings')}>
              <SettingsIcon />
              Settings
            </button>
            <button className="topbar__account-menu-item" role="menuitem" onClick={() => handleMenuOption('help')}>
              <HelpIcon />
              Help &amp; Support
            </button>
            <button className="topbar__account-menu-item" role="menuitem" onClick={() => handleMenuOption('ux3')} data-tour="topbar-ux3">
              <SparkleIcon />
              UX 3.0
              <span className="topbar__account-menu-soon">Beta</span>
            </button>
            <div className="topbar__account-menu-divider" />
            <button className="topbar__account-menu-item topbar__account-menu-item--danger" role="menuitem" onClick={() => handleMenuOption('logout')}>
              <LogoutIcon />
              Log Out
            </button>
          </div>
        )}
      </div>

      {helpOpen && (
        <HelpSupportPanel
          onClose={() => setHelpOpen(false)}
          onNav={onNav}
          onStartTour={onStartTour}
        />
      )}
    </header>
  );
}

export default Topbar;
