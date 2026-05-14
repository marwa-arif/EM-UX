import React from 'react'

const PAI = {
  indigo: '#6360D8',
  indigoHover: '#504BB8',
  indigoTint: '#F0F0FC',
  fg1: '#101010',
  fg2: '#282828',
  fg3: '#6E6E6E',
  disabled: '#9CA3AF',
  border: '#E6E6E6',
  borderStrong: '#CFCFCF',
  bgApp: '#F7F9FC',
  bgRaised: '#F5F5F5',
  surface: '#FFFFFF',
  critFg: '#D12329', critBg: '#F9EEEE',
  highFg: '#D98B1D', highBg: '#FEF3C7',
  medFg:  '#6360D8', medBg:  '#F0F0FC',
  lowFg:  '#1A7549', lowBg:  '#EFF7ED',
};

// ── Button ──────────────────────────────────────────────────────────
function Button({ type = 'primary', size = 'md', label, leading, trailing, onClick, disabled }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`pai-btn pai-btn--${size} pai-btn--${type}`}
    >
      {leading}{label}{trailing}
    </button>
  );
}

// ── IconBtn ─────────────────────────────────────────────────────────
function IconBtn({ children, onClick, active, title, size = 28 }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{ width: size, height: size }}
      className={`pai-icon-btn${active ? ' pai-icon-btn--active' : ''}`}
    >
      {children}
    </button>
  );
}

// ── Chip ────────────────────────────────────────────────────────────
function Chip({ tone = 'neutral', children, subtle, dot }) {
  return (
    <span className={`pai-chip pai-chip--${tone}${subtle ? ' pai-chip--subtle' : ''}`}>
      {dot && <span className="pai-chip__dot" />}
      {children}
    </span>
  );
}

// ── DualToggle ──────────────────────────────────────────────────────
function DualToggle({ options, value, onChange }) {
  return (
    <div className="pai-dual-toggle">
      {options.map(o => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={`pai-dual-toggle__btn${o === value ? ' pai-dual-toggle__btn--active' : ''}`}
        >{o}</button>
      ))}
    </div>
  );
}

// ── KPI card ────────────────────────────────────────────────────────
function KPI({ label, value, valueColor, trend, trendTone = 'up' }) {
  return (
    <div className="pai-kpi">
      <div className="pai-kpi__label">{label}</div>
      <div className="pai-kpi__value" style={{ color: valueColor || PAI.fg1 }}>{value}</div>
      {trend && (
        <div className={`pai-kpi__trend pai-kpi__trend--${trendTone}`}>
          <span>{{ up: '▲', down: '▼', flat: '—' }[trendTone]}</span>{trend}
        </div>
      )}
    </div>
  );
}

// ── Input ───────────────────────────────────────────────────────────
function Input({ value, onChange, placeholder, prefix, size = 'md', width }) {
  return (
    <div className={`pai-input-wrap pai-input-wrap--${size}`} style={{ width }}>
      {prefix && <span className="pai-input-wrap__prefix">{prefix}</span>}
      <input
        value={value || ''} onChange={e => onChange && onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

// ── Ic — tiny generic Lucide-like strokes ───────────────────────────
function Ic({ path, size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {path}
    </svg>
  );
}

const Icons = {
  search:   <Ic path={<><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></>} />,
  plus:     <Ic path={<><path d="M12 5v14M5 12h14"/></>} />,
  download: <Ic path={<><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/><path d="M5 21h14"/></>} />,
  filter:   <Ic path={<><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></>} />,
  chevron:  <Ic path={<><path d="m6 9 6 6 6-6"/></>} />,
  bell:     <Ic path={<><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></>} />,
  kebab:    <Ic path={<><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></>} />,
  close:    <Ic path={<><path d="M18 6 6 18M6 6l12 12"/></>} />,
  arrowLeft:<Ic path={<><path d="m15 18-6-6 6-6"/></>} />,
  info:     <Ic path={<><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></>} />,
};

function EmIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="emIconGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6A9FE6" />
          <stop offset="100%" stopColor="#5DD0E0" />
        </linearGradient>
      </defs>
      <path d="M13.2007 9.02099C12.7652 9.4565 12.7652 10.1626 13.2007 10.5981C13.6362 11.0336 14.3423 11.0336 14.7778 10.5981C15.2133 10.1626 15.2133 9.4565 14.7778 9.02099C14.3423 8.58547 13.6362 8.58547 13.2007 9.02099Z" fill="url(#emIconGrad)"/>
      <path d="M13.3416 16.9992C12.7949 17.546 12.7949 18.4324 13.3416 18.9791C13.8883 19.5259 14.7748 19.5259 15.3215 18.9791C15.8682 18.4324 15.8682 17.546 15.3215 16.9992C14.7748 16.4525 13.8883 16.4525 13.3416 16.9992Z" fill="url(#emIconGrad)"/>
      <path d="M9.08772 12.7839C8.31448 13.5571 8.31448 14.8108 9.08772 15.584C9.86096 16.3572 11.1146 16.3572 11.8879 15.584C12.6611 14.8108 12.6611 13.5571 11.8879 12.7839C11.1146 12.0106 9.86096 12.0106 9.08772 12.7839Z" fill="url(#emIconGrad)"/>
      <path d="M5.07391 8.76325C4.20948 9.62768 4.20942 11.0293 5.07385 11.8937C5.93828 12.7581 7.33986 12.7581 8.20429 11.8936C9.06873 11.0292 9.06878 9.62762 8.20435 8.76319C7.33992 7.89876 5.93834 7.89882 5.07391 8.76325Z" fill="url(#emIconGrad)"/>
      <path d="M13.304 1.65352C12.7573 2.20026 12.7573 3.08669 13.304 3.63342C13.8507 4.18016 14.7372 4.18016 15.2839 3.63342C15.8306 3.08669 15.8306 2.20026 15.2839 1.65352C14.7372 1.10679 13.8507 1.10679 13.304 1.65352Z" fill="url(#emIconGrad)"/>
      <path d="M9.04524 4.56511C8.272 5.33835 8.272 6.59202 9.04524 7.36525C9.81848 8.13849 11.0721 8.13849 11.8454 7.36525C12.6186 6.59202 12.6186 5.33835 11.8454 4.56511C11.0721 3.79187 9.81848 3.79187 9.04524 4.56511Z" fill="url(#emIconGrad)"/>
    </svg>
  );
}

export { PAI, Button, IconBtn, Chip, DualToggle, KPI, Input, Ic, Icons, EmIcon };
