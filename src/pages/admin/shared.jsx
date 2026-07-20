import React, { useState, useRef, useEffect } from 'react'

/* ── Icons ───────────────────────────────────────────────────────── */
export const IcUsers = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
export const IcUserGroup = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 21a6 6 0 0 0-12 0"/><circle cx="12" cy="9" r="4"/>
    <path d="M22.5 21a5 5 0 0 0-4-4.9M1.5 21a5 5 0 0 1 4-4.9"/>
    <circle cx="19" cy="7" r="2.5"/><circle cx="5" cy="7" r="2.5"/>
  </svg>
);
export const IcShield = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
export const IcKey = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="7.5" cy="15.5" r="5.5"/><path d="M21 2l-9.6 9.6"/><path d="M15.5 7.5l3 3L22 7l-3-3"/>
  </svg>
);
export const IcFingerprint = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 11c0 3.5-.5 6.5-2 9"/><path d="M7 20a13 13 0 0 0 2-9 3 3 0 1 1 6 0c0 1 0 2-.1 3"/>
    <path d="M4.5 15a17 17 0 0 0 1-5 6.5 6.5 0 0 1 13 0c0 1.5-.1 2.8-.3 4"/>
    <path d="M17.5 20a20 20 0 0 0 .5-9"/><path d="M2 12a10 10 0 0 1 18-6"/>
  </svg>
);
export const IcPlug = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 9.5 14.5 2 12 4.5l1.5 1.5-6 6L6 10.5 3.5 13l7.5 7.5 2.5-2.5-1.5-1.5 6-6z"/>
    <path d="M9 15l-4 4"/>
  </svg>
);
export const IcTicket = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 6v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-6z"/>
  </svg>
);
export const IcWebhook = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 16.98h-5.99c-1.1 0-1.95.94-2.48 1.9A4 4 0 1 1 2 17"/>
    <path d="M15 3.5A4 4 0 0 1 20.4 8.86"/><path d="M9 15h4a2 2 0 0 1 1.87 1.3l1 3"/>
    <circle cx="10" cy="8" r="4"/>
  </svg>
);
export const IcClipboard = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="8" y="2" width="8" height="4" rx="1"/>
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
    <line x1="8" y1="11" x2="16" y2="11"/><line x1="8" y1="15" x2="16" y2="15"/><line x1="8" y1="19" x2="12" y2="19"/>
  </svg>
);
export const IcLock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
export const IcCheckBadge = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 12 2 2 4-4"/><path d="M12 2 3.5 6v6c0 5 3.5 8.5 8.5 10 5-1.5 8.5-5 8.5-10V6z"/>
  </svg>
);
export const IcArchive = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="5" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/>
    <line x1="10" y1="13" x2="14" y2="13"/>
  </svg>
);
export const IcGauge = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="m13.5 10.5 3-3"/>
    <path d="M4 15a8 8 0 1 1 16 0"/>
  </svg>
);
export const IcBell = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
  </svg>
);
export const IcBuilding = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="1"/>
    <line x1="9" y1="7" x2="9" y2="7"/><line x1="15" y1="7" x2="15" y2="7"/>
    <line x1="9" y1="12" x2="9" y2="12"/><line x1="15" y1="12" x2="15" y2="12"/>
    <line x1="9" y1="17" x2="15" y2="17"/>
  </svg>
);
export const IcCreditCard = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
);
export const IcMore = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/>
  </svg>
);
export const IcDownload = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
export const IcEye = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
export const IcEyeOff = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a20.6 20.6 0 0 1 5.06-6.06M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a20.6 20.6 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);
export const IcCopy = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);

/* ── Badge maps ──────────────────────────────────────────────────── */
export const STATUS_BADGE = {
  Active: 'success', Invited: 'neutral', Connected: 'success', Syncing: 'info',
  Error: 'danger', Enabled: 'success', Disabled: 'neutral', Failing: 'danger', Suspended: 'danger',
};
export const ROLE_BADGE = { Owner: 'info', Admin: 'info', Analyst: 'neutral', Viewer: 'neutral' };

/* ── Small shared bits ───────────────────────────────────────────── */
export function initials(name) {
  return name.replace(/\s*\(.*?\)\s*/g, '').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
}

export function SectionHead({ icon, title, count, desc }) {
  return (
    <>
      <div className="admin-section-head">
        <div className="admin-section-head__icon">{icon}</div>
        <div className="admin-section-head__title">
          {title} {count != null && <span className="admin-section-head__count">({count})</span>}
        </div>
      </div>
      {desc && <div className="admin-section-desc">{desc}</div>}
    </>
  );
}

export function ToggleRow({ label, desc, value, onChange }) {
  return (
    <div className="admin-toggle-row">
      <div className="admin-toggle-row__text">
        <div className="admin-toggle-row__label">{label}</div>
        {desc && <div className="admin-toggle-row__desc">{desc}</div>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        className={`admin-switch${value ? ' admin-switch--on' : ''}`}
        onClick={() => onChange(!value)}
      >
        <span className="admin-switch__thumb" />
      </button>
    </div>
  );
}

export function RowMenu({ items }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  if (!items.length) return <span className="admin-row-menu-empty">—</span>;

  return (
    <div className="admin-row-menu-wrap" ref={ref}>
      <button className="admin-row-menu-btn" onClick={() => setOpen(o => !o)} aria-label="Row actions">
        <IcMore />
      </button>
      {open && (
        <div className="admin-row-menu" role="menu">
          {items.map((item, i) => (
            <button
              key={i}
              role="menuitem"
              className={`admin-row-menu-item${item.danger ? ' admin-row-menu-item--danger' : ''}`}
              onClick={() => { setOpen(false); item.onClick(); }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function SliderRow({ label, value, onChange, max = 100, unit = '%' }) {
  return (
    <div className="admin-slider-row">
      <div className="admin-slider-row__head">
        <span className="admin-slider-row__label">{label}</span>
        <span className="admin-slider-row__value">{value}{unit}</span>
      </div>
      <input
        type="range" min={0} max={max} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="admin-slider"
      />
    </div>
  );
}

export function ProgressBar({ used, total, label }) {
  const pct = Math.min(100, Math.round((used / total) * 100));
  return (
    <div className="admin-progress">
      <div className="admin-progress__head">
        <span>{label}</span>
        <span className="admin-progress__count">{used.toLocaleString()} / {total.toLocaleString()}</span>
      </div>
      <div className="admin-progress__track">
        <div className="admin-progress__fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function MaskedSecret({ value }) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try { await navigator.clipboard.writeText(value); } catch { /* clipboard unavailable */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const masked = value.slice(0, 8) + '••••••••••••••••' + value.slice(-4);

  return (
    <div className="admin-masked-secret">
      <span className="admin-mono">{revealed ? value : masked}</span>
      <button className="admin-icon-btn" title={revealed ? 'Hide' : 'Reveal'} onClick={() => setRevealed(r => !r)}>
        {revealed ? <IcEyeOff /> : <IcEye />}
      </button>
      <button className="admin-icon-btn" title="Copy" onClick={copy}>
        <IcCopy />
      </button>
      {copied && <span className="admin-copied-flag">Copied</span>}
    </div>
  );
}

export function FormModal({ title, onClose, onSubmit, submitLabel = 'Save', submitDisabled = false, children }) {
  return (
    <div className="ds-modal-overlay">
      <div className="ds-modal" role="dialog" aria-modal="true">
        <div className="ds-modal-header">
          <span className="ds-modal-title">{title}</span>
          <button className="ds-modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="ds-modal-body admin-form-body">{children}</div>
        <div className="ds-modal-footer">
          <button className="ds-btn sz-md t-outline" onClick={onClose}>Cancel</button>
          <button className="ds-btn sz-md t-primary" disabled={submitDisabled} onClick={onSubmit}>{submitLabel}</button>
        </div>
      </div>
    </div>
  );
}
