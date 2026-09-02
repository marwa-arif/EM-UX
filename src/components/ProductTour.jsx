import React, { useEffect, useRef, useState } from 'react'
import '../styles/productTour.css'

// A step targets a real, currently-mounted element via `target` (a CSS
// selector into `data-tour` attributes added directly on the real DOM nodes
// across Topbar/LeftNav and the EM pages themselves — never a copy or mock),
// or has no target for a centered welcome/closing card. `page` sends the
// tour to a different route before it looks for `target` — the same page ids
// LeftNav itself navigates with. `openSelector`/`closeSelector` click a real
// control (e.g. the Active Filters pill) to reveal/hide a step's target so
// the tour demonstrates the interaction, not just a static highlight. Any
// step whose target never mounts (collapsed sidebar hiding a section label,
// a menu-only button while its menu is closed, etc.) is skipped automatically.
const STEPS = [
  { id: 'welcome', title: 'Welcome to Prevalent AI', body: 'Take a quick tour of the dashboard — navigation, Insights pages, filters, tables, and the Admin Panel. You can exit anytime.' },
  { id: 'topbar-logo', target: '[data-tour="topbar-logo"]', title: 'Home', body: 'Click the Prevalent AI logo anytime to return to Navigator, your home base.' },
  { id: 'topbar-navigator', target: '[data-tour="topbar-navigator"]', title: 'Navigator', body: 'Open Navigator for quick AI-assisted answers without leaving the page you’re on.' },
  { id: 'topbar-theme', target: '[data-tour="topbar-theme"]', title: 'Theme', body: 'Switch between light and dark themes to match your preference.' },
  { id: 'topbar-notif', target: '[data-tour="topbar-notif"]', title: 'Notifications', body: 'Notifications keep you updated on findings, downloads, and system activity.' },
  { id: 'topbar-account', target: '[data-tour="topbar-account"]', title: 'Account menu', body: 'Access Settings, Help & Support, and Log Out from here — you can reopen this tour anytime from Help & Support.' },
  { id: 'nav-navigator', target: '[data-tour="nav-item-navigator"]', title: 'Navigator', body: 'Your AI assistant for asking questions, researching, and building — all in one place.' },
  { id: 'nav-workspace', target: '[data-tour="nav-item-workspace"]', title: 'Workspace', body: 'Workspace holds your custom dashboards and saved views.' },
  { id: 'nav-section-insights', target: '[data-tour="nav-section-insights"]', title: 'Insights', body: 'The Insights section brings together everything about your exposure posture — let’s look at a couple of these pages.' },
  { id: 'exposure-gauge', page: 'exposure/overview', target: '[data-tour="page-exposure-gauge"]', title: 'Exposure score', body: 'Your overall risk score, out of 1000 — the higher it is, the more exposure you have to address.' },
  { id: 'exposure-card', page: 'exposure/overview', target: '[data-tour="page-exposure-card"]', title: 'Attack surface & categories', body: 'A breakdown of exposure by attack surface and category, so you know where to focus first.' },
  { id: 'findings-filter-pill', page: 'exposure/findings', target: '[data-tour="page-filter-pill"]', title: 'Active Filters', body: 'Every page like Findings lets you narrow down exactly what you’re looking at with Active Filters.' },
  { id: 'findings-filter-panel', page: 'exposure/findings', openSelector: '[data-tour="page-filter-pill"]', target: '[data-tour="page-filter-panel"]', closeSelector: '[data-tour="page-filter-close"]', title: 'Fine-tune your filters', body: 'Preview, save, or reset the filters applied to this page from here.' },
  { id: 'findings-table', page: 'exposure/findings', target: '[data-tour="page-findings-table"]', title: 'Findings table', body: 'Findings are laid out in a sortable table — click any row for full detail.' },
  { id: 'findings-severity', page: 'exposure/findings', target: '[data-tour="page-findings-severity"]', title: 'Severity', body: 'Every finding is scored by severity, so the riskiest issues stand out immediately.' },
  { id: 'findings-pagination', page: 'exposure/findings', target: '[data-tour="page-table-pagination"]', title: 'Pagination', body: 'Page through large result sets, and control how many rows you see at once.' },
  { id: 'findings-export', page: 'exposure/findings', target: '[data-tour="page-findings-export"]', title: 'Export', body: 'Export what you’re looking at anytime — filters and all.' },
  { id: 'discover-search', page: 'discover/device', target: '[data-tour="page-discover-search"]', title: 'Search', body: 'Search narrows any table instantly — no need to scroll through hundreds of rows.' },
  { id: 'discover-table', page: 'discover/device', target: '[data-tour="page-discover-table"]', title: 'Discover', body: 'Browse and drill into individual devices, cloud resources, and identities.' },
  { id: 'nav-section-fabric', target: '[data-tour="nav-section-fabric"]', title: 'Fabric Configuration', body: 'This is where you manage how data flows into the platform — ingestion, pipelines, ontology, and summary.' },
  { id: 'topbar-admin', openSelector: '[data-tour="topbar-account"]', target: '[data-tour="topbar-admin"]', closeSelector: '[data-tour="topbar-account"]', title: 'Admin Panel', body: 'Org-wide and plan-level settings live here.' },
  { id: 'closing', title: 'You’re all set', body: 'That’s the tour. Open Help & Support anytime to ask Navigator a question or run this tour again.' },
];

const waitFor = (selector, timeout, isCancelled) => new Promise((resolve) => {
  const start = Date.now();
  const tick = () => {
    if (isCancelled()) return resolve(null);
    const el = document.querySelector(selector);
    if (el) return resolve(el);
    if (Date.now() - start >= timeout) return resolve(null);
    setTimeout(tick, 80);
  };
  tick();
});

function ProductTour({ active, onExit, onNav, currentPage }) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const step = STEPS[index];
  const currentPageRef = useRef(currentPage);
  currentPageRef.current = currentPage;

  useEffect(() => { if (active) setIndex(0); }, [active]);

  const last = index === STEPS.length - 1;
  const first = index === 0;

  const goNext = () => setIndex(i => Math.min(i + 1, STEPS.length - 1));
  const goBack = () => setIndex(i => Math.max(i - 1, 0));
  const finish = () => onExit();

  // Runs the full step transition: navigate to the step's page if needed,
  // optionally click a control to reveal the target, wait for the target to
  // mount, then measure and track it. Cleanup clicks `closeSelector` (if any)
  // so a step's opened panel doesn't linger once the tour moves on.
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    let removeListeners = null;

    if (step.page && step.page !== currentPageRef.current) onNav?.(step.page);

    if (!step.target) {
      // Centered welcome/closing card — nothing to highlight.
      setRect(null);
      setNotFound(false);
      return;
    }

    // Deliberately NOT clearing `rect` here — keep showing the previous
    // step's highlight in place until this one resolves, so the spotlight
    // glides (via the CSS transition on .tour-spotlight/.tour-card) to its
    // new position instead of flashing to blank/dim on every single step.
    setNotFound(false);

    (async () => {
      if (step.openSelector) {
        const openEl = await waitFor(step.openSelector, 1500, () => cancelled);
        if (cancelled) return;
        if (openEl && !document.querySelector(step.target)) openEl.click();
      }
      const el = await waitFor(step.target, 2500, () => cancelled);
      if (cancelled) return;
      if (!el) { setNotFound(true); setRect(null); return; }

      el.scrollIntoView({ block: 'center' });
      const measure = () => {
        const r = el.getBoundingClientRect();
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      };
      requestAnimationFrame(measure);
      window.addEventListener('resize', measure);
      window.addEventListener('scroll', measure, true);
      removeListeners = () => {
        window.removeEventListener('resize', measure);
        window.removeEventListener('scroll', measure, true);
      };
    })();

    return () => {
      cancelled = true;
      removeListeners?.();
      if (step.closeSelector) document.querySelector(step.closeSelector)?.click();
    };
  }, [index, active]);

  // A step whose target never mounts can't be shown — skip forward past it
  // rather than leaving the user stuck.
  useEffect(() => {
    if (!active || !notFound) return;
    if (last) { onExit(); return; }
    const t = setTimeout(goNext, 0);
    return () => clearTimeout(t);
  }, [notFound, active, last, index]);

  useEffect(() => {
    if (!active) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onExit();
      else if (e.key === 'ArrowRight' || e.key === 'Enter') { if (!last) goNext(); }
      else if (e.key === 'ArrowLeft') { if (!first) goBack(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [active, last, first]);

  if (!active || notFound) return null;

  const PAD = 8;
  const spotlight = rect ? {
    top: rect.top - PAD,
    left: rect.left - PAD,
    width: rect.width + PAD * 2,
    height: rect.height + PAD * 2,
  } : null;

  const CARD_WIDTH = 340;
  const CARD_MAX_HEIGHT = 240;
  let cardStyle = {};
  let cardPlacement = 'center';
  if (spotlight) {
    const spaceRight = window.innerWidth - (spotlight.left + spotlight.width);
    if (spotlight.left < 300) {
      cardPlacement = 'right';
      cardStyle = { top: Math.max(16, Math.min(spotlight.top, window.innerHeight - CARD_MAX_HEIGHT)), left: spotlight.left + spotlight.width + 16 };
    } else if (spotlight.top < 80) {
      cardPlacement = 'bottom';
      cardStyle = { top: spotlight.top + spotlight.height + 16, left: Math.max(16, Math.min(spotlight.left, window.innerWidth - CARD_WIDTH - 16)) };
    } else {
      cardPlacement = spaceRight > 340 ? 'right' : 'left';
      cardStyle = cardPlacement === 'right'
        ? { top: Math.max(16, spotlight.top), left: spotlight.left + spotlight.width + 16 }
        : { top: Math.max(16, spotlight.top), left: Math.max(16, spotlight.left - CARD_WIDTH - 16) };
    }
    // Final safety clamp — regardless of branch, never let the card render
    // past the viewport edge (e.g. a target very close to the right/bottom edge).
    cardStyle.left = Math.max(16, Math.min(cardStyle.left, window.innerWidth - CARD_WIDTH - 16));
    cardStyle.top = Math.max(16, Math.min(cardStyle.top, window.innerHeight - CARD_MAX_HEIGHT));
  }

  return (
    <div className="tour-root">
      <div className="tour-blocker" />
      {spotlight ? (
        <div className="tour-spotlight" style={{ top: spotlight.top, left: spotlight.left, width: spotlight.width, height: spotlight.height }} />
      ) : (
        <div className="tour-dim" />
      )}

      <div className={`tour-card tour-card--${cardPlacement}`} style={cardPlacement === 'center' ? undefined : cardStyle}>
        <div className="tour-card__head">
          <span className="tour-card__step">Step {index + 1} of {STEPS.length}</span>
          <button className="tour-card__close" onClick={onExit} aria-label="Exit tour">✕</button>
        </div>
        <div className="tour-card__progress"><div className="tour-card__progress-fill" style={{ width: `${((index + 1) / STEPS.length) * 100}%` }} /></div>
        <div className="tour-card__title" key={`title-${index}`}>{step.title}</div>
        <div className="tour-card__body" key={`body-${index}`}>{step.body}</div>
        <div className="tour-card__footer">
          <button className="ds-btn sz-md t-outline" onClick={onExit}>Skip tour</button>
          <div className="tour-card__nav">
            {!first && <button className="ds-btn sz-md t-outline" onClick={goBack}>Back</button>}
            <button className="ds-btn sz-md t-primary" onClick={last ? finish : goNext}>{last ? 'Finish' : 'Next'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductTour;
