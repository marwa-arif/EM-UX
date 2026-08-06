import React, { useState, useRef, useEffect } from 'react'
import { Icons } from '../ui.jsx'
import VersionBadge from './VersionBadge.jsx'

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

const AdminIcon = () => (
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

function Topbar({ onNav, navigatorActive, showNavigatorButton = true, theme = 'light', onToggleTheme, showProductSwitcher = false }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const switcherRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [menuOpen]);

  useEffect(() => {
    if (!switcherOpen) return;
    const onDown = (e) => { if (switcherRef.current && !switcherRef.current.contains(e.target)) setSwitcherOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [switcherOpen]);

  const handleMenuOption = (option) => {
    setMenuOpen(false);
    if (option === 'admin') onNav?.('admin-page');
    else if (option === 'logout') window.location.href = import.meta.env.BASE_URL;
  };

  return (
    <header className="topbar">
      <img src="assets/logo/pai-wordmark-white.svg" height={22} alt="Prevalent AI"
           className="topbar__logo" />

      {showProductSwitcher && (
        <>
        <span className="topbar__logo-divider" />
        <div ref={switcherRef} className="topbar__switcher">
          <button
            className={`topbar__switcher-btn${switcherOpen ? ' topbar__switcher-btn--open' : ''}`}
            onClick={() => setSwitcherOpen(o => !o)}
            aria-haspopup="menu"
            aria-expanded={switcherOpen}
            title="Switch product"
          >
            Exposure Management
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </button>
          {switcherOpen && (
            <div className="topbar__switcher-menu" role="menu">
              <button className="topbar__switcher-item topbar__switcher-item--active" role="menuitem" onClick={() => setSwitcherOpen(false)}>
                Exposure Management
              </button>
              <button className="topbar__switcher-item" role="menuitem" onClick={() => setSwitcherOpen(false)}>
                Studio
              </button>
            </div>
          )}
        </div>
        </>
      )}

      <div className="topbar__spacer" />

      {showNavigatorButton && (
        <button
          className={`topbar__navigator${navigatorActive ? ' active' : ''}`}
          onClick={() => onNav?.('navigator')}
          title="Navigator"
          aria-label="Navigator"
        >
          <span className="topbar__navigator-icon" />
        </button>
      )}

      <VersionBadge />

      <button
        title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        className="topbar__btn topbar__theme-toggle"
        onClick={onToggleTheme}
      >
        {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
      </button>

      <button title="Notifications" className="topbar__btn">
        {Icons.bell}
        <span className="topbar__notif-dot" />
      </button>

      <div ref={menuRef} className="topbar__account">
        <button
          title="Account menu"
          aria-label="Account menu"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className="topbar__avatar"
          onClick={() => setMenuOpen(o => !o)}
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
            <button className="topbar__account-menu-item" role="menuitem" onClick={() => handleMenuOption('admin')}>
              <AdminIcon />
              Admin Panel
            </button>
            <button className="topbar__account-menu-item" role="menuitem" onClick={() => handleMenuOption('help')}>
              <HelpIcon />
              Help &amp; Support
              <span className="topbar__account-menu-soon">Soon</span>
            </button>
            <div className="topbar__account-menu-divider" />
            <button className="topbar__account-menu-item topbar__account-menu-item--danger" role="menuitem" onClick={() => handleMenuOption('logout')}>
              <LogoutIcon />
              Log Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default Topbar;
