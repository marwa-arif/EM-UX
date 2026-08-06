import React, { useState, useRef, useEffect } from 'react';

// ── Segmented tabs (large) ───────────────────────────────────────────
// Visual style adapted from the design system's dual-toggle: pill track
// with a sliding indigo thumb and label color that flips on the active
// segment.
export default function SegmentedTabs({ value, options, onChange, fullWidth, height = 32 }) {
  const containerRef = useRef(null);
  const btnRefs = useRef([]);
  const labelRefs = useRef([]);
  const [thumb, setThumb] = useState({ left: 3, width: 0 });

  useEffect(() => {
    const idx = options.indexOf(value);
    const btn = btnRefs.current[idx];
    if (btn) {
      // Thumb fills the active tab exactly — container has no padding,
      // so the pill spans the full button bounds.
      setThumb({ left: btn.offsetLeft, width: btn.offsetWidth });
    }
  }, [value, options.join('|')]);

  return (
    <div
      ref={containerRef}
      className={fullWidth ? 'kg-seg-tabs kg-seg-tabs--full' : 'kg-seg-tabs'}
      style={{ '--kg-seg-height': `${height}px` }}
    >
      {/* sliding white thumb — sized to match active segment */}
      <div
        className="kg-seg-thumb"
        style={{
          left: thumb.left,
          width: thumb.width,
          opacity: thumb.width ? 1 : 0,
        }}
      />
      {options.map((o, i) => {
        const active = o === value;
        // Dividers between segments are hidden — the sliding thumb already
        // indicates active state clearly enough on its own.
        const showDivider = false;
        return (
          <button
            key={o}
            ref={el => btnRefs.current[i] = el}
            onClick={() => onChange && onChange(o)}
            className={[
              'kg-seg-btn',
              active ? 'kg-seg-btn--active' : '',
              !onChange ? 'kg-seg-btn--no-change' : '',
              fullWidth ? 'kg-seg-btn--full' : '',
            ].filter(Boolean).join(' ')}
          >
            {showDivider && <span className="kg-seg-divider" />}
            <span ref={el => labelRefs.current[i] = el}>{o}</span>
          </button>
        );
      })}
    </div>
  );
}
