import React, { useState, useRef, useEffect } from 'react'

// Toolbar dropdown (label above, pill button) — shared by ComplianceMatrixPage
// and any other page that needs the same label+pill control (e.g. a
// "Compare with" date picker). Relies on the comp-matrix-tb-*/comp-sort-*
// classes defined in styles/compliance.css, so consumers must import that
// stylesheet.
export default function MatrixDropdown({ label, subLabel, value, options, onChange, width = 150 }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  const selected = options.find(o => o.id === value)

  return (
    <div className="comp-matrix-tb-item">
      <span className="comp-matrix-tb-label">
        {label}
        {subLabel && <span className="comp-matrix-tb-label-sub"> {subLabel}</span>}
      </span>
      <div ref={ref} className="comp-matrix-dropdown-wrap">
        <button
          className={`comp-matrix-tb-btn${open ? ' comp-matrix-tb-btn--open' : ''}`}
          style={{ '--comp-matrix-btn-w': `${width}px` }}
          onClick={() => setOpen(o => !o)}
        >
          <span className="comp-matrix-tb-btn-text">{selected?.name ?? value}</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </button>
        {open && (
          <div className="comp-sort-menu comp-matrix-dropdown-menu">
            {options.map(opt => (
              <button
                key={opt.id}
                className={`comp-sort-item${opt.id === value ? ' comp-sort-item--selected' : ''}`}
                onClick={() => { onChange(opt.id); setOpen(false) }}
              >
                {opt.date
                  ? <><span>{opt.date}</span><span className="comp-matrix-opt-sublabel">({opt.sublabel})</span></>
                  : opt.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
