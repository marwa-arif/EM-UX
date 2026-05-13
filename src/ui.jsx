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

export { PAI, Button, IconBtn, Chip, DualToggle, KPI, Input, Ic, Icons };
