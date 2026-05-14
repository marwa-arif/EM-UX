import React from 'react'
import { Icons } from '../ui.jsx'

function Topbar({ onNav }) {
  return (
    <header className="topbar">
      <img src="assets/logo/pai-wordmark-white.svg" height={22} alt="Prevalent AI"
           style={{ display: 'block' }} />

      <div className="topbar__spacer" />

      <div className="topbar__timestamp">
        Last updated <span className="topbar__timestamp-val">Apr 20, 2026 · 14:32 UTC</span>
      </div>

      <button title="Notifications" className="topbar__btn">
        {Icons.bell}
        <span className="topbar__notif-dot" />
      </button>

      <div className="topbar__avatar">MP</div>

      <button className="topbar__navigator" onClick={() => onNav?.('navigator')}>
        <img src="assets/icons/Navigator icon.svg" width={14} height={14} alt="" />
        <span className="topbar__navigator-label">Navigator</span>
      </button>
    </header>
  );
}

export default Topbar;
