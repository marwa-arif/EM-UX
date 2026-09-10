import React, { useEffect, useMemo, useRef, useState } from 'react'

// Every right-docked panel/drawer surface in the codebase, so the FAB gets
// out of the way of any of them rather than just the ones first tested:
//  - .rp-shell / .wp-filter-drawer: in-flow flex siblings that claim real
//    width from the right edge (not fixed overlays) — animated via an
//    inline style width/CSS-var, not a class toggle.
//  - .dc-panel / .dc-aw-panel: Widget Settings and Add Widget, both
//    in-flow flex siblings (same 348px docked-panel shape), conditionally
//    mounted.
//  - .help-panel, .afp-panel, .comp-drawer, .dev-drawer: genuine
//    position:fixed overlays docked to the right edge (Help & Support,
//    Active Filter preview, and the two parallel "drawer" implementations
//    used across Findings/Compliance/Discover pages) — conditionally
//    mounted, so a plain childList check finds them.
// All of the above are either in-flow (no fixed positioning to race
// against) or plain conditional mounts/style-attribute changes, so the
// existing MutationObserver + ResizeObserver + settle-poll setup below
// already covers their open/close timing; this list only had to grow to
// include them.
// Navigator's own floating chat panel is deliberately NOT in this list —
// since the FAB is what opens it, there's no need to keep the launcher
// visible (shifted or otherwise) once it's already open; see the `active`
// prop below, which hides the FAB outright instead.
const OVERLAP_SELECTORS = '.rp-shell, .wp-filter-drawer, .dc-panel, .dc-aw-panel, .help-panel, .afp-panel, .comp-drawer, .dev-drawer';
const BASE_RIGHT = 24;
const GAP_FROM_PANEL = 24;

const GENERIC_MESSAGES = [
  'Have a question? Ask Navigator.',
  'Need a hand? Just ask.',
  "I'm here if you need me.",
];

const contextualMessages = (page) => !page ? [] : [
  `Curious about ${page}?`,
  `Need help with ${page}?`,
  `Ask me about ${page}.`,
];

// Interleave contextual/generic so a run of shows doesn't group all of one
// kind together before touching the other.
function buildMessagePool(pageContext) {
  const contextual = contextualMessages(pageContext);
  const generic = GENERIC_MESSAGES;
  const pool = [];
  const max = Math.max(contextual.length, generic.length);
  for (let i = 0; i < max; i++) {
    if (contextual[i]) pool.push(contextual[i]);
    if (generic[i]) pool.push(generic[i]);
  }
  return pool;
}

const INITIAL_DELAY_MS = 6000;
const REPEAT_INTERVAL_MS = 55000;
const SHOW_DURATION_MS = 9000;

// The FAB's default footprint, computed from the viewport rather than
// measured off the button element, since the button's own position is what
// we're about to solve for.
const defaultFabRect = () => {
  const size = 48;
  return {
    left: window.innerWidth - BASE_RIGHT - size,
    right: window.innerWidth - BASE_RIGHT,
    top: window.innerHeight - BASE_RIGHT - size,
    bottom: window.innerHeight - BASE_RIGHT,
  };
};

function CopilotFab({ onClick, active, pageContext }) {
  const [rightOffset, setRightOffset] = useState(BASE_RIGHT);
  const shiftedRef = useRef(false);
  const activeRef = useRef(active);
  const [message, setMessage] = useState(null);
  const messagePool = useMemo(() => buildMessagePool(pageContext), [pageContext]);
  const poolIndexRef = useRef(0);

  useEffect(() => { shiftedRef.current = rightOffset > BASE_RIGHT; }, [rightOffset]);
  useEffect(() => { activeRef.current = active; if (active) setMessage(null); }, [active]);

  useEffect(() => {
    let raf = null;
    const recompute = () => {
      raf = null;
      const fabRect = defaultFabRect();
      let maxRight = BASE_RIGHT;
      document.querySelectorAll(OVERLAP_SELECTORS).forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return;
        const intersects = !(r.right < fabRect.left || r.left > fabRect.right || r.bottom < fabRect.top || r.top > fabRect.bottom);
        if (!intersects) return;
        const candidate = (window.innerWidth - r.left) + GAP_FROM_PANEL;
        if (candidate > maxRight) maxRight = candidate;
      });
      setRightOffset(maxRight);
    };
    const scheduleRecompute = () => { if (raf == null) raf = requestAnimationFrame(recompute); };

    scheduleRecompute();
    const resizeObserver = new ResizeObserver(scheduleRecompute);
    resizeObserver.observe(document.body);
    const mutationObserver = new MutationObserver(scheduleRecompute);
    mutationObserver.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });
    window.addEventListener('resize', scheduleRecompute);
    // These panels animate width via a CSS transition (not further DOM
    // mutations), so the observers above fire once right as the transition
    // *starts* — a poll catches the settled state once it finishes, since
    // transition durations vary by panel and aren't worth hardcoding.
    const settlePoll = setInterval(scheduleRecompute, 400);

    return () => {
      if (raf != null) cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener('resize', scheduleRecompute);
      clearInterval(settlePoll);
    };
  }, []);

  useEffect(() => {
    if (!messagePool.length) return;
    let hideTimer = null;
    const showNext = () => {
      if (shiftedRef.current || activeRef.current) return; // skip this cycle silently while a panel is open, try again next interval
      const next = messagePool[poolIndexRef.current % messagePool.length];
      poolIndexRef.current += 1;
      setMessage(next);
      hideTimer = setTimeout(() => setMessage(null), SHOW_DURATION_MS);
    };
    const initialTimer = setTimeout(showNext, INITIAL_DELAY_MS);
    const interval = setInterval(showNext, REPEAT_INTERVAL_MS);
    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [messagePool]);

  const handleFabClick = () => {
    setMessage(null);
    onClick?.();
  };

  // Navigator is already open (this is what the FAB itself opens) — no
  // need to keep the launcher around, shifted or otherwise; its own close
  // button (with the genie-close animation) is how the user gets back.
  if (active) return null;

  return (
    <>
      {message && (
        <div
          className="copilot-hint"
          style={{ right: `${rightOffset}px` }}
          role="button"
          tabIndex={0}
          onClick={handleFabClick}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleFabClick(); }}
        >
          <p className="copilot-hint__body">{message}</p>
        </div>
      )}
      <button
        className={`copilot-fab${active ? ' active' : ''}`}
        style={{ right: `${rightOffset}px` }}
        onClick={handleFabClick}
        title="Ask Navigator"
        aria-label="Ask Navigator"
        data-tour="copilot-fab"
      >
        <img src="assets/icons/Navigator icon.svg" width={20} height={20} alt="" />
        <span className="copilot-fab__shine" aria-hidden="true" />
      </button>
    </>
  )
}

export default CopilotFab
