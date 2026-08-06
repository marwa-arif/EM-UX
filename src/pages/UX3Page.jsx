import React, { useState } from 'react'
import UX3LeftNav from './ux3/UX3LeftNav.jsx'
import Topbar from '../components/Topbar.jsx'
import SubHeader from '../components/SubHeader.jsx'
import { FilterPanel } from '../components/FilterPanel.jsx'
import ClientServersV3 from './ux3/ClientServersV3.jsx'
import UX3Home from './ux3/UX3Home.jsx'
import KGPage from './KGPage.jsx'
import { AdminSettingsNav, AdminPanelContent } from './admin/AdminPanelBody.jsx'

const PAGE_LABELS = {
  home: 'Home',
  workspace: 'Workspace',
  'exposure/overview': 'Exposure · Overview',
  'exposure/findings': 'Exposure · Findings',
  'discover/device': 'Attack Surface · Device',
  'discover/cloud': 'Attack Surface · Cloud',
  'discover/identity': 'Attack Surface · Identity',
  'security-posture/host': 'Security Posture · Host',
  'security-posture/identity': 'Security Posture · Identity',
  'security-posture/cloud': 'Security Posture · Cloud',
  'report/compliance': 'Report · Compliance',
  'report/assessments': 'Report · Assessments',
  'report/compliance-matrix': 'Report · Compliance Matrix',
  'report/compliance-findings': 'Report · Compliance Findings',
  kg: 'Knowledge Graph',
  'data-quality/overview': 'Data Quality · Overview',
  'data-quality/in-depth': 'Data Quality · In-Depth',
  'remediation/queue': 'Remediation · Queue',
  'remediation/closed': 'Remediation · Closed',
  'client/servers': 'Client Specific · Servers',
  'client/networks': 'Client Specific · Networks',
  'studio/workspace/device': 'Studio · Workspace · Device',
  'studio/workspace/cloud': 'Studio · Workspace · Cloud',
  'studio/pipeline/device': 'Studio · Pipeline · Device',
  'studio/pipeline/cloud': 'Studio · Pipeline · Cloud',
  'studio/ontology/device': 'Studio · Ontology · Device',
  'studio/ontology/cloud': 'Studio · Ontology · Cloud',
};

function UX3Placeholder({ pageLabel, onExploreCurrent }) {
  return (
    <div className="coming-soon">
      <svg width="128" height="128" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="64" cy="64" r="60" fill="#EEEEFF" />
        <circle cx="64" cy="64" r="40" stroke="var(--pai-indigo-light)" strokeWidth="2" fill="var(--card-bg)" />
        <circle cx="64" cy="64" r="32" stroke="var(--pai-indigo)" strokeWidth="2.5" fill="none" />
        <path d="M64 40 L69 59 L88 64 L69 69 L64 88 L59 69 L40 64 L59 59 Z" fill="var(--pai-indigo)" />
        <circle cx="64" cy="34" r="2" fill="var(--pai-indigo)" />
        <circle cx="64" cy="94" r="2" fill="var(--pai-indigo)" />
        <circle cx="34" cy="64" r="2" fill="var(--pai-indigo)" />
        <circle cx="94" cy="64" r="2" fill="var(--pai-indigo)" />
        <circle cx="22" cy="34" r="6" fill="var(--pai-indigo)" opacity="0.12" />
        <circle cx="106" cy="95" r="8" fill="var(--pai-indigo)" opacity="0.08" />
        <circle cx="100" cy="22" r="4" fill="var(--pai-indigo)" opacity="0.16" />
        <circle cx="18" cy="88" r="5" fill="var(--pai-indigo)" opacity="0.1" />
      </svg>
      <div className="coming-soon__text">
        <div className="coming-soon__title">UX 3.0 — In Progress</div>
        <div className="coming-soon__desc">
          {pageLabel} hasn't been redesigned yet. Updated pages will land here one at a time as the UX 3.0 refresh ships.
        </div>
        <button className="ds-btn sz-md t-primary coming-soon__cta" onClick={onExploreCurrent}>
          Explore in Current UX
        </button>
      </div>
    </div>
  );
}

function UX3Page({ onNav, initialRoute, theme, onToggleTheme, settingsOpen, adminState, onCloseSettings }) {
  const [subRoute, setSubRoute] = useState(() => (
    initialRoute && initialRoute.startsWith('ux3/') ? initialRoute.slice(4) : 'home'
  ));
  const [kgFilterCount, setKgFilterCount] = useState(0);
  const [kgFilters, setKgFilters] = useState([]);
  const [kgFilterOpen, setKgFilterOpen] = useState(false);

  const isKgRoute = subRoute === 'kg';

  const handleRemoveKgFilter = (idx) => {
    const updated = kgFilters.filter((_, i) => i !== idx);
    setKgFilters(updated);
    setKgFilterCount(new Set(updated.map(c => c.attrId)).size);
  };
  const handleClearKgFilters = () => { setKgFilters([]); setKgFilterCount(0); };
  const handleApplyKgFilters = (count, chips) => {
    setKgFilterCount(count);
    setKgFilters(chips || []);
    setKgFilterOpen(false);
  };

  const handleSubNav = (id, data) => {
    if (id === 'navigator-page' || id === 'navigator' || id === 'navigator-floating' || id === 'workspace' || id === 'ux3-exit') {
      onNav(id, data);
      return;
    }
    setSubRoute(id);
    onNav(`ux3/${id}`);
  };

  const label = PAGE_LABELS[subRoute] || 'This page';

  return (
    <div className="app-shell">
      <Topbar onNav={onNav} theme={theme} onToggleTheme={onToggleTheme} showProductSwitcher />
      <div className="app-body">
        <UX3LeftNav current={subRoute} onNav={handleSubNav} forceCollapsed={settingsOpen} />
        {settingsOpen ? (
          <>
            <aside className="settings-panel">
              <AdminSettingsNav activeSection={adminState.activeSection} onSelect={adminState.setActiveSection} />
            </aside>
            <main className="exp-main exp-main--col admin-main">
              <AdminPanelContent state={adminState} onNav={onNav} onClose={onCloseSettings} />
            </main>
          </>
        ) : (
        <main className="exp-main exp-main--row">
          <div className="exp-content-col">
            <div className="ux3-subheader">
              <SubHeader
                title="UX 3.0"
                breadcrumb={['UX 3.0', label]}
                breadcrumbHrefs={[null, null]}
                showMenu={false}
                showExplore={false}
                actions={isKgRoute ? undefined : null}
                pageId={isKgRoute ? 'kg' : undefined}
                activeFilters={isKgRoute ? kgFilters : []}
                activeFilterCount={isKgRoute ? kgFilterCount : 0}
                onRemoveFilter={handleRemoveKgFilter}
                onClearFilters={handleClearKgFilters}
                onFilter={isKgRoute ? () => setKgFilterOpen(o => !o) : undefined}
                filterActive={kgFilterOpen}
              />
            </div>
            <div className="wp-main-body">
              <div className="wp-main-content">
                <div className="page-scroll">
                  {subRoute === 'home' ? <UX3Home onNav={handleSubNav} />
                    : subRoute === 'client/servers' ? <ClientServersV3 />
                    : subRoute === 'kg' ? <div className="ux3-kg"><KGPage /></div>
                    : <UX3Placeholder pageLabel={label} onExploreCurrent={() => handleSubNav('ux3-exit', subRoute)} />}
                </div>
              </div>
              {isKgRoute && (
                <div
                  className="wp-filter-drawer ux3-filter-panel"
                  style={{ width: kgFilterOpen ? 400 : 0 }}
                >
                  <div className="wp-filter-drawer__inner">
                    {kgFilterOpen && (
                      <FilterPanel
                        embedded
                        pageId="kg"
                        onClose={() => setKgFilterOpen(false)}
                        onApply={handleApplyKgFilters}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
        )}
      </div>
    </div>
  );
}

export default UX3Page;
