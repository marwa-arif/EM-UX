import React, { useState } from 'react';
import pkg from '../../package.json';
import changelog from '../data/changelog.json';

function ChangelogModal({ onClose }) {
  const currentVersion = pkg.version;

  return (
    <div className="vb-overlay" onClick={onClose}>
      <div className="vb-modal" onClick={e => e.stopPropagation()}>
        <div className="vb-modal__header">
          <span className="vb-modal__title">Release History</span>
          <button className="vb-modal__close" onClick={onClose}>✕</button>
        </div>
        <div className="vb-modal__body">
          {changelog.map(entry => {
            const isCurrent = entry.version === currentVersion;
            return (
              <div key={entry.version} className={`vb-entry${isCurrent ? ' vb-entry--current' : ''}`}>
                <div className="vb-entry__head">
                  <span className="vb-entry__version">v{entry.version}</span>
                  {isCurrent && <span className="vb-entry__tag">current</span>}
                  <span className="vb-entry__date">{entry.date}</span>
                  <span className="vb-entry__spacer" />
                  {entry.url && !isCurrent && (
                    <a
                      className="vb-entry__view"
                      href={entry.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View →
                    </a>
                  )}
                </div>
                {Object.entries(entry.changes).map(([label, items]) =>
                  items.length > 0 && (
                    <div key={label} className="vb-section">
                      <span className={`vb-section__label vb-section__label--${label.toLowerCase()}`}>{label}</span>
                      <ul className="vb-section__list">
                        {items.map((item, i) => <li key={i}>{item}</li>)}
                      </ul>
                    </div>
                  )
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function VersionBadge() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="vb-badge" onClick={() => setOpen(true)} title="View release history">
        v{pkg.version}
      </button>
      {open && <ChangelogModal onClose={() => setOpen(false)} />}
    </>
  );
}
