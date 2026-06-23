import React from 'react'
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

function Topbar({ onNav, navigatorActive, theme = 'light', onToggleTheme }) {
  return (
    <header className="topbar">
      <img src="/assets/logo/pai-wordmark-white.svg" height={22} alt="Prevalent AI"
           className="topbar__logo" />

      <div className="topbar__spacer" />

      <div className="topbar__timestamp">
        Last updated <span className="topbar__timestamp-val">Apr 20, 2026 · 14:32 UTC</span>
      </div>

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

      <div className="topbar__avatar">MP</div>

      <button
        className={`topbar__navigator${navigatorActive ? ' active' : ''}`}
        onClick={() => onNav?.('navigator')}
      >
        <img src="/assets/icons/Navigator icon.svg" width={14} height={14} alt="" />
        <span className="topbar__navigator-label">Navigator</span>
      </button>
    </header>
  );
}

export default Topbar;
