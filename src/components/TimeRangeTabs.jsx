import React, { useLayoutEffect, useRef, useState } from 'react';

// Shared date-range pill tabs (1W/1M/3M/6M/1Y, etc.) — used by Compliance
// and Exposure Overview trend headers. Styling lives in .comp-time-pill*
// (compliance.css) so every usage picks up changes from one place.
//
// Highlight is a sliding thumb (same pattern as SegmentedTabs' kg-seg-thumb)
// rather than each pill fading its own background — active state should
// visibly move left/right between tabs, not cross-fade in place.
export default function TimeRangeTabs({ value, onChange, options = ['1W', '1M', '3M', '6M', '1Y'], children }) {
  const wrapRef = useRef(null);
  const [thumb, setThumb] = useState({ left: 0, width: 0, ready: false });

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const active = wrap?.querySelector('.comp-time-pill--active');
    if (wrap && active) {
      // getBoundingClientRect, not offsetLeft — the Custom-range button lives
      // inside its own position:relative wrapper, which would otherwise become
      // the offsetParent and throw off the measurement.
      const wrapRect = wrap.getBoundingClientRect();
      const activeRect = active.getBoundingClientRect();
      setThumb({ left: activeRect.left - wrapRect.left, width: activeRect.width, ready: true });
    }
  }, [value, options.join('|')]);

  return (
    <div className="comp-time-pills-wrap" ref={wrapRef}>
      <div
        className="comp-time-pill-thumb"
        style={{ left: thumb.left, width: thumb.width, opacity: thumb.ready ? 1 : 0 }}
      />
      {options.map(t => (
        <button
          key={t}
          className={`comp-time-pill${value === t ? ' comp-time-pill--active' : ''}`}
          onClick={() => onChange(t)}
        >{t}</button>
      ))}
      {children}
    </div>
  );
}
