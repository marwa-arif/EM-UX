import React, { useState } from 'react'
import UX3LeftNav from './ux3/UX3LeftNav.jsx'
import Topbar from '../components/Topbar.jsx'
import SubHeader from '../components/SubHeader.jsx'
import ExposureOverviewV3 from './ux3/ExposureOverviewV3.jsx'
import ClientServersV3 from './ux3/ClientServersV3.jsx'

const PAGE_LABELS = {
  workspace: 'Workspace',
  'exposure/overview': 'Exposure · Overview',
  'exposure/findings': 'Exposure · Findings',
  'discover/device': 'Discover · Device',
  'discover/cloud': 'Discover · Cloud',
  'discover/identity': 'Discover · Identity',
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

function UX3Page({ onNav, theme, onToggleTheme }) {
  const [subRoute, setSubRoute] = useState('exposure/overview');

  const handleSubNav = (id, data) => {
    if (id === 'navigator-page' || id === 'navigator' || id === 'navigator-floating' || id === 'ux3-exit') {
      onNav(id, data);
      return;
    }
    setSubRoute(id);
  };

  const label = PAGE_LABELS[subRoute] || 'This page';

  return (
    <div className="app-shell">
      <Topbar onNav={onNav} theme={theme} onToggleTheme={onToggleTheme} />
      <div className="app-body">
        <UX3LeftNav current={subRoute} onNav={handleSubNav} />
        <main className="exp-main exp-main--row">
          <div className="exp-content-col">
            <SubHeader
              title="UX 3.0"
              breadcrumb={['UX 3.0', label]}
              breadcrumbHrefs={[null, null]}
              showMenu={false}
              showExplore={false}
              actions={null}
            />
            <div className="page-scroll">
              {subRoute === 'exposure/overview' ? <ExposureOverviewV3 onNav={handleSubNav} />
                : subRoute === 'client/servers' ? <ClientServersV3 />
                : <UX3Placeholder pageLabel={label} onExploreCurrent={() => handleSubNav('ux3-exit', subRoute)} />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default UX3Page;
