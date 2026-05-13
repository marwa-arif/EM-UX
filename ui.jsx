// UI primitives — Prevalent AI Studio kit
// Exports: Button, Chip, IconBtn, DualToggle, KPI, Input
// Loaded via Babel; attached to window at the bottom.

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
  const [hover, setHover] = React.useState(false);
  const [down, setDown] = React.useState(false);

  const sizes = {
    sm: { h: 24, px: 12, fs: 11 },
    md: { h: 32, px: 16, fs: 12 },
    lg: { h: 40, px: 20, fs: 13 },
  }[size];

  let bg, fg, border = 'none';
  if (disabled) {
    bg = type === 'primary' ? PAI.bgRaised : 'transparent';
    fg = PAI.disabled;
    border = type === 'outline' ? `1px solid ${PAI.border}` : 'none';
  } else if (type === 'primary') {
    bg = down ? PAI.indigo : hover ? PAI.indigoHover : PAI.indigo;
    fg = PAI.indigoTint;
  } else if (type === 'secondary') {
    bg = hover ? '#E0DFF7' : PAI.indigoTint;
    fg = PAI.indigo;
  } else if (type === 'outline') {
    bg = down ? PAI.bgRaised : 'transparent';
    fg = PAI.fg2;
    border = `1px solid ${hover ? '#404040' : PAI.borderStrong}`;
  } else if (type === 'tertiary') {
    bg = down ? '#E6E6E6' : hover ? PAI.bgRaised : 'transparent';
    fg = PAI.fg2;
  } else if (type === 'danger') {
    bg = hover ? '#FFDBDC' : PAI.critBg;
    fg = PAI.critFg;
  }

  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setDown(false); }}
      onMouseDown={() => setDown(true)}
      onMouseUp={() => setDown(false)}
      disabled={disabled}
      style={{
        height: sizes.h, padding: `0 ${sizes.px}px`,
        fontSize: sizes.fs, fontWeight: 500, fontFamily: 'inherit',
        background: bg, color: fg, border,
        borderRadius: 44, cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: 6,
        transition: 'background 150ms cubic-bezier(.2,.8,.2,1), color 150ms, border 150ms',
        outline: 'none', whiteSpace: 'nowrap', userSelect: 'none',
      }}
    >
      {leading}{label}{trailing}
    </button>
  );
}

// ── IconBtn ─────────────────────────────────────────────────────────
function IconBtn({ children, onClick, active, title, size = 28 }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={title}
      style={{
        width: size, height: size, padding: 0,
        background: active ? 'rgba(99,96,216,0.08)' : hover ? 'rgba(0,0,0,0.04)' : 'transparent',
        color: active ? PAI.indigo : PAI.fg2,
        border: 'none', borderRadius: 6, cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 120ms cubic-bezier(.2,.8,.2,1)',
      }}
    >
      {children}
    </button>
  );
}

// ── Chip ────────────────────────────────────────────────────────────
function Chip({ tone = 'neutral', children, subtle, dot }) {
  const tones = {
    critical: { bg: PAI.critBg, fg: PAI.critFg },
    high:     { bg: PAI.highBg, fg: PAI.highFg },
    medium:   { bg: PAI.medBg,  fg: PAI.medFg  },
    low:      { bg: PAI.lowBg,  fg: PAI.lowFg  },
    open:     { bg: PAI.critBg, fg: PAI.critFg },
    progress: { bg: PAI.highBg, fg: PAI.highFg },
    resolved: { bg: PAI.lowBg,  fg: PAI.lowFg  },
    neutral:  { bg: PAI.bgRaised, fg: PAI.fg3 },
    indigo:   { bg: PAI.indigoTint, fg: PAI.indigo },
  };
  const t = tones[tone] || tones.neutral;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      height: 22, padding: '0 8px',
      background: subtle ? 'transparent' : t.bg,
      color: t.fg,
      border: subtle ? `1px solid ${PAI.border}` : 'none',
      borderRadius: 4,
      fontSize: 11, fontWeight: 600,
      letterSpacing: '0.04em', textTransform: 'uppercase',
      whiteSpace: 'nowrap',
    }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: t.fg }} />}
      {children}
    </span>
  );
}

// ── DualToggle ──────────────────────────────────────────────────────
function DualToggle({ options, value, onChange }) {
  return (
    <div style={{
      display: 'inline-flex', background: PAI.bgRaised,
      borderRadius: 44, padding: 2, gap: 0,
    }}>
      {options.map(o => {
        const active = o === value;
        return (
          <button
            key={o}
            onClick={() => onChange(o)}
            style={{
              height: 24, padding: '0 14px',
              borderRadius: 44, border: 'none',
              background: active ? '#fff' : 'transparent',
              color: active ? PAI.indigo : PAI.fg3,
              fontSize: 11, fontWeight: 500,
              fontFamily: 'inherit', cursor: 'pointer',
              boxShadow: active ? '0 1px 2px rgba(16,16,16,0.08)' : 'none',
              transition: 'all 150ms cubic-bezier(.2,.8,.2,1)',
            }}
          >{o}</button>
        );
      })}
    </div>
  );
}

// ── KPI card ────────────────────────────────────────────────────────
function KPI({ label, value, valueColor, trend, trendTone = 'up' }) {
  const trendColors = { up: PAI.critFg, down: PAI.lowFg, flat: PAI.fg3 };
  const trendArrow = { up: '▲', down: '▼', flat: '—' };
  return (
    <div style={{
      background: PAI.surface, border: `1px solid ${PAI.border}`,
      borderRadius: 4, padding: 14,
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div style={{
        fontSize: 10, fontWeight: 600, color: PAI.fg3,
        textTransform: 'uppercase', letterSpacing: '0.06em',
      }}>{label}</div>
      <div style={{
        fontSize: 24, fontWeight: 700, lineHeight: 1,
        color: valueColor || PAI.fg1,
        fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em',
      }}>{value}</div>
      {trend && (
        <div style={{
          fontSize: 11, fontWeight: 600,
          color: trendColors[trendTone],
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <span>{trendArrow[trendTone]}</span>{trend}
        </div>
      )}
    </div>
  );
}

// ── Input ───────────────────────────────────────────────────────────
function Input({ value, onChange, placeholder, prefix, size = 'md', width }) {
  const [focused, setFocused] = React.useState(false);
  const heights = { sm: 28, md: 32, lg: 40 }[size];
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      height: heights, padding: '0 12px', width,
      background: '#fff',
      border: `1px solid ${focused ? PAI.indigo : PAI.border}`,
      borderRadius: 8,
      boxShadow: focused ? '0 0 0 3px rgba(99,96,216,0.22)' : 'none',
      transition: 'all 150ms cubic-bezier(.2,.8,.2,1)',
    }}>
      {prefix && <span style={{ color: PAI.fg3, display: 'flex' }}>{prefix}</span>}
      <input
        value={value || ''} onChange={e => onChange && onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          flex: 1, border: 'none', outline: 'none', background: 'transparent',
          fontSize: 13, fontFamily: 'inherit', color: PAI.fg1,
          minWidth: 0,
        }}
      />
    </div>
  );
}

// ── Ic — tiny generic Lucide-like strokes (used for chrome only) ────
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

Object.assign(window, { PAI, Button, IconBtn, Chip, DualToggle, KPI, Input, Ic, Icons });
