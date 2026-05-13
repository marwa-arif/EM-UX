import React from 'react'
import { Icons } from './ui.jsx'

function Topbar() {
  return (
    <header style={{
      height: 48,
      background: '#131313',
      display: 'flex', alignItems: 'center',
      padding: '0 16px', gap: 12,
      flexShrink: 0,
      position: 'relative', zIndex: 50,
    }}>
      {/* Left: PAI wordmark only, height 26 — never "Prevalent AI" text */}
      <img src="assets/logo/pai-wordmark-white.svg" height={22} alt="Prevalent AI"
           style={{ display: 'block' }} />

      <div style={{ flex: 1 }} />

      {/* Last updated label */}
      <div style={{ fontSize: 11, color: '#9A9A9A', whiteSpace: 'nowrap' }}>
        Last updated <span style={{ color: '#D1D1D1' }}>Apr 20, 2026 · 14:32 UTC</span>
      </div>

      {/* Bell */}
      <button title="Notifications" style={{
        width: 32, height: 32, border: 'none',
        background: 'transparent', color: '#D1D1D1',
        borderRadius: 6, cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
      }}>
        {Icons.bell}
        <span style={{
          position: 'absolute', top: 6, right: 7,
          width: 6, height: 6, borderRadius: '50%',
          background: '#D12329', border: '1px solid #131313',
        }} />
      </button>

      {/* Avatar */}
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        background: '#6360D8', color: '#F0F0FC',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 600,
      }}>MP</div>

      {/* Navigator — t-special (gradient border, gradient text) */}
      <button style={{
        height: 28, padding: '0 12px',
        background: '#131313',
        border: '1px solid transparent',
        borderRadius: 44,
        backgroundImage: 'linear-gradient(#131313,#131313), linear-gradient(90deg,#467FCD,#47ADCB)',
        backgroundOrigin: 'border-box',
        backgroundClip: 'padding-box, border-box',
        cursor: 'pointer',
        fontSize: 12, fontWeight: 500, fontFamily: 'inherit',
        display: 'inline-flex', alignItems: 'center', gap: 6,
      }}>
        <img src="assets/icons/Navigator icon.svg" width={14} height={14} alt="" />
        <span style={{
          background: 'linear-gradient(90deg,#6A9FE6,#5DD0E0)',
          WebkitBackgroundClip: 'text', backgroundClip: 'text',
          WebkitTextFillColor: 'transparent', color: 'transparent',
          fontWeight: 600,
        }}>Navigator</span>
      </button>
    </header>
  );
}

export default Topbar;
