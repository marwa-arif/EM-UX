import React, { useState } from 'react'
import { ChangelogModal } from './VersionBadge.jsx'

const IcClose = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const IcNavigatorAsk = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/>
    <circle cx="12" cy="12" r="3.2"/>
  </svg>
);

const IcBook = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);

const IcKeyboard = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2"/>
    <path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M6 13h.01M18 13h.01M8 13h8"/>
  </svg>
);

const IcSparkles = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4"/>
    <path d="M8 8l8 8M16 8l-8 8"/>
  </svg>
);

const IcMail = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="m2 6 10 7 10-7"/>
  </svg>
);

const IcCompass = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
  </svg>
);

function HelpSupportPanel({ onClose, onNav, onStartTour }) {
  const [showChangelog, setShowChangelog] = useState(false);

  const openNavigator = () => {
    onClose();
    onNav?.('navigator');
  };

  return (
    <>
      <div className="help-panel-overlay" onClick={onClose} />
      <div className="help-panel" role="dialog" aria-label="Help and support">
        <div className="help-panel__header">
          <span className="help-panel__title">Help &amp; Support</span>
          <button className="help-panel__close" onClick={onClose} aria-label="Close">
            <IcClose />
          </button>
        </div>

        <div className="help-panel__body">
          <section className="help-panel__section">
            <div className="help-panel__section-title">Ask Navigator</div>
            <p className="help-panel__section-desc">
              Get instant answers about your exposure data, findings, compliance, and pipelines.
            </p>
            <button className="ds-btn sz-md t-primary" onClick={openNavigator}>
              <IcNavigatorAsk />
              Open Navigator
            </button>
          </section>

          <div className="help-panel__divider" />

          <section className="help-panel__section">
            <div className="help-panel__section-title">Help resources</div>
            <div className="help-panel__resource-list">
              <button className="help-panel__resource" disabled>
                <span className="help-panel__resource-icon"><IcBook /></span>
                <span className="help-panel__resource-body">
                  <span className="help-panel__resource-label">Documentation</span>
                  <span className="help-panel__resource-sub">Guides and reference material</span>
                </span>
                <span className="help-panel__resource-badge">Soon</span>
              </button>
              <button className="help-panel__resource" disabled>
                <span className="help-panel__resource-icon"><IcKeyboard /></span>
                <span className="help-panel__resource-body">
                  <span className="help-panel__resource-label">Keyboard shortcuts</span>
                  <span className="help-panel__resource-sub">Navigate the dashboard faster</span>
                </span>
                <span className="help-panel__resource-badge">Soon</span>
              </button>
              <button className="help-panel__resource" onClick={() => setShowChangelog(true)}>
                <span className="help-panel__resource-icon"><IcSparkles /></span>
                <span className="help-panel__resource-body">
                  <span className="help-panel__resource-label">What's new</span>
                  <span className="help-panel__resource-sub">Release notes and changelog</span>
                </span>
              </button>
              <a className="help-panel__resource" href="mailto:support@prevalent.ai">
                <span className="help-panel__resource-icon"><IcMail /></span>
                <span className="help-panel__resource-body">
                  <span className="help-panel__resource-label">Contact support</span>
                  <span className="help-panel__resource-sub">Email our support team</span>
                </span>
              </a>
            </div>
          </section>

          <div className="help-panel__divider" />

          <section className="help-panel__section">
            <div className="help-panel__tour-card">
              <span className="help-panel__tour-icon"><IcCompass /></span>
              <div className="help-panel__tour-body">
                <div className="help-panel__section-title">Take a tour</div>
                <p className="help-panel__section-desc">
                  A guided walkthrough of the dashboard — navigation, key pages, filters, tables, and the Console.
                </p>
              </div>
            </div>
            <button
              className="ds-btn sz-md t-outline help-panel__tour-btn"
              onClick={() => { onClose(); onStartTour?.(); }}
            >
              Start Tour
            </button>
          </section>
        </div>
      </div>

      {showChangelog && <ChangelogModal onClose={() => setShowChangelog(false)} />}
    </>
  );
}

export default HelpSupportPanel;
