import React from 'react'
import '../styles/studio.css'

// ── Icons ─────────────────────────────────────────────────────────
const IcPipeline = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--pai-indigo)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="12" r="2.5"/>
    <path d="M8.3 6.9 15.7 10.9M8.3 17.1 15.7 13.1"/>
  </svg>
);
const IcIngest = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--pai-indigo)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h11"/><path d="M12 5l7 7-7 7"/>
  </svg>
);
const IcAgent = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2 L14.2 8.8 L21 11 L14.2 13.2 L12 20 L9.8 13.2 L3 11 L9.8 8.8 Z"/>
  </svg>
);
const IcPlug = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--fg-3)" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5.139 13.2801C5.0223 13.2801 4.9104 13.2337 4.8278 13.1512C4.7453 13.0686 4.6989 12.9567 4.6989 12.84V10.4918C4.4642 10.6028 4.2052 10.6527 3.9459 10.6368C3.6867 10.621 3.4357 10.5398 3.2163 10.4008C2.9969 10.2619 2.8162 10.0698 2.6909 9.8422C2.5657 9.6147 2.5 9.3592 2.5 9.0995C2.5 8.8398 2.5657 8.5844 2.6909 8.3568C2.8162 8.1293 2.9969 7.9372 3.2163 7.7982C3.4357 7.6593 3.6867 7.5781 3.9459 7.5622C4.2052 7.5463 4.4642 7.5963 4.6989 7.7073V5.3591C4.6989 5.2424 4.7453 5.1304 4.8278 5.0479C4.9104 4.9654 5.0223 4.919 5.139 4.919H7.7073C7.5961 4.6843 7.5461 4.4252 7.5619 4.1659C7.5777 3.9067 7.6588 3.6556 7.7977 3.4361C7.9367 3.2166 8.1288 3.0358 8.3564 2.9105C8.5839 2.7852 8.8395 2.7195 9.0992 2.7195C9.359 2.7195 9.6145 2.7852 9.8421 2.9105C10.0696 3.0358 10.2618 3.2166 10.4007 3.4361C10.5396 3.6556 10.6207 3.9067 10.6365 4.1659C10.6524 4.4252 10.6024 4.6843 10.4912 4.919H13.06C13.1767 4.919 13.2886 4.9654 13.3711 5.0479C13.4537 5.1304 13.5 5.2424 13.5 5.3591V7.7073C13.2653 7.5963 13.0063 7.5463 12.747 7.5622C12.4878 7.5781 12.2368 7.6593 12.0174 7.7982C11.798 7.9372 11.6173 8.1293 11.492 8.3568C11.3668 8.5844 11.3011 8.8398 11.3011 9.0995C11.3011 9.3592 11.3668 9.6147 11.492 9.8422C11.6173 10.0698 11.798 10.2619 12.0174 10.4008C12.2368 10.5398 12.4878 10.621 12.747 10.6368C13.0063 10.6527 13.2653 10.6028 13.5 10.4918V12.84C13.5 12.9567 13.4537 13.0686 13.3711 13.1512C13.2886 13.2337 13.1767 13.2801 13.06 13.2801H5.139Z"/>
  </svg>
);
const IcTemplate = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--fg-3)" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.0052 6.0037V8M8.0052 8H6.508C5.5667 8 5.0966 8 4.8041 8.2925C4.5116 8.5849 4.5116 9.0551 4.5116 9.9963M8.0052 8H9.5025C10.4437 8 10.9139 8 11.2063 8.2925C11.4988 8.5849 11.4988 9.0551 11.4988 9.9963M7.1498 3.0092H8.8606C9.8967 3.0092 10.0015 3.5632 10.0015 4.5064C10.0015 5.4497 9.8962 6.0037 8.8606 6.0037H7.1498C6.1137 6.0037 6.0089 5.4497 6.0089 4.5064C6.0089 3.5632 6.1142 3.0092 7.1498 3.0092ZM11.4988 12.9908H12.3542C13.3898 12.9908 13.4951 12.4369 13.4951 11.4936C13.4951 10.5503 13.3903 9.9963 12.3542 9.9963H10.6434C9.6078 9.9963 9.5025 10.5503 9.5025 11.4936C9.5025 12.4369 9.6073 12.9908 10.6434 12.9908H11.4988ZM4.5012 12.9908H5.3566C6.3922 12.9908 6.4975 12.4369 6.4975 11.4936C6.4975 10.5503 6.3927 9.9963 5.3566 9.9963H3.6458C2.6102 9.9963 2.5049 10.5503 2.5049 11.4936C2.5049 12.4369 2.6097 12.9908 3.6458 12.9908H4.5012Z"/>
  </svg>
);
const IcDoc = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--fg-3)" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3.01 11.5161V5.48C3.01 4.9277 3.4577 4.48 4.01 4.48H12.9993C13.5515 4.48 13.9993 4.9277 13.9993 5.48V11.5161C13.9993 12.0684 13.5515 12.5161 12.9993 12.5161H4.01C3.4577 12.5161 3.01 12.0684 3.01 11.5161Z"/>
    <path d="M5.4122 7.3267H10.5274"/>
    <path d="M5.4122 9.7093H7.8585"/>
  </svg>
);
const IcChevronRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 6 6 6-6 6"/>
  </svg>
);

// ── Data ────────────────────────────────────────────────────────
const RESOURCES = [
  { icon: <IcPlug />, title: 'Connector library', desc: '240+ authenticated & unauthenticated sources' },
  { icon: <IcTemplate />, title: 'Entity & relationship templates', desc: 'Prebuilt SRDM models for common goals' },
  { icon: <IcDoc />, title: 'Documentation', desc: 'Pipelines, scheduling, and Fabric guides' },
];

const CONNECTIONS = [
  { monogram: 'QK', name: 'Qualys VMDR — BUPA Prod', host: 'qualysapi.qualys.com', state: 'sync', label: 'Syncing', time: '2h ago' },
  { monogram: 'JI', name: 'Jira Cloud — BUPA', host: 'bupa.atlassian.net', state: 'active', label: 'Active', time: '6h ago' },
  { monogram: 'SN', name: 'ServiceNow — Dev', host: 'dev.service-now.com', state: 'error', label: 'Error', time: null, errorBadge: 'Auth expired' },
];

function StudioHomePage({ onNav }) {
  return (
    <div className="studio-home">
      <section className="studio-hero">
        <h2 className="studio-hero__title">Welcome back!</h2>
        <div className="studio-hero__cards">
          <div className="studio-conn-card">
            <div className="studio-conn-card__header">
              <div className="studio-conn-card__title-group">
                <p className="studio-conn-card__title">Connections</p>
                <span className="studio-conn-badge studio-conn-badge--success">4 active</span>
              </div>
              <button className="studio-conn-manage">Manage <IcChevronRight /></button>
            </div>

            {CONNECTIONS.map(c => (
              <div className="studio-conn-row" key={c.name}>
                <div className="studio-conn-row__icon">{c.monogram}</div>
                <div className="studio-conn-row__content">
                  <p className="studio-conn-row__name">{c.name}</p>
                  <p className="studio-conn-row__sub">{c.host}</p>
                </div>
                <div className="studio-conn-row__status">
                  <div className="studio-conn-row__dotgroup">
                    <span className={`studio-conn-dot studio-conn-dot--${c.state}`} />
                    <span className={c.state === 'error' ? 'studio-conn-row__statuslabel studio-conn-row__statuslabel--error' : 'studio-conn-row__statuslabel'}>{c.label}</span>
                  </div>
                  {c.time && <span className="studio-conn-row__time">{c.time}</span>}
                  {c.errorBadge && <span className="studio-conn-row__errbadge">{c.errorBadge}</span>}
                  {c.state === 'error' && (
                    <button className="studio-conn-row__fix">Fix <IcChevronRight /></button>
                  )}
                </div>
              </div>
            ))}

            <div className="studio-conn-card__footer">
              <button className="ds-btn sz-md t-outline">Use existing connector</button>
              <button className="ds-btn sz-md t-outline">Set up new connector</button>
            </div>
          </div>

          <div className="studio-card studio-card--accent">
            <div className="studio-card__icon"><IcPipeline /></div>
            <div className="studio-card__body">
              <p className="studio-card__title">Build your first data pipeline</p>
              <p className="studio-card__desc">Connect your security tools, define your entities, and automate risk insights — in minutes, not months.</p>
            </div>
            <div className="studio-card__actions">
              <button className="ds-btn sz-md t-outline">Start with a goal</button>
              <button className="ds-btn sz-md studio-btn-agent">Chat with Studio Agent</button>
            </div>
          </div>

          <div className="studio-card">
            <div className="studio-card__icon"><IcIngest /></div>
            <div className="studio-card__body">
              <p className="studio-card__title">Ingest Data</p>
              <p className="studio-card__desc">Connect your security tools, define your entities, and automate.</p>
            </div>
            <div className="studio-card__actions">
              <button className="ds-btn sz-md t-outline">Start</button>
            </div>
          </div>
        </div>
      </section>

      <section className="studio-discover">
        <p className="studio-discover__title">Discover</p>
        <div className="studio-discover__row">
          <div className="studio-hub">
            <div className="studio-hub__header">Resource hub</div>
            {RESOURCES.map(r => (
              <button key={r.title} className="studio-hub__row">
                <span className="studio-hub__icon">{r.icon}</span>
                <span className="studio-hub__text">
                  <span className="studio-hub__row-title">{r.title}</span>
                  <span className="studio-hub__row-desc">{r.desc}</span>
                </span>
                <span className="studio-hub__chevron"><IcChevronRight /></span>
              </button>
            ))}
          </div>

          <div className="studio-promo">
            <span className="studio-promo__badge">New</span>
            <div className="studio-promo__body">
              <div className="studio-promo__heading">
                <span className="studio-promo__icon"><IcAgent /></span>
                <p className="studio-promo__title">Agentic pipeline builder</p>
              </div>
              <p className="studio-promo__desc">
                Describe what you want in plain language and let the Studio Agent assemble connectors, entities, relationships, and scoring for you.
              </p>
            </div>
            <button className="studio-promo__cta">
              Try it now <IcChevronRight />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default StudioHomePage;
