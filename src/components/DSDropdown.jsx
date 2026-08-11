import React, { useState, useRef, useEffect } from 'react';
import { useDropdownExit } from '../hooks/useDropdownExit.js';

export default function DSDropdown({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { visible, closing } = useDropdownExit(open);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="ds-dropdown" ref={ref}>
      <button className="ds-dropdown-trigger" onClick={() => setOpen(o => !o)}>
        <span>{value}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s', flexShrink: 0 }}>
          <path d="M2 3.5L5 6.5L8 3.5"/>
        </svg>
      </button>
      {visible && (
        <div className={`ds-dropdown-panel${closing ? ' ds-dropdown-panel--closing' : ''}`}>
          {options.map(opt => (
            <button
              key={opt}
              className={`ds-dropdown-option${value === opt ? ' selected' : ''}`}
              onClick={() => { onChange(opt); setOpen(false); }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
