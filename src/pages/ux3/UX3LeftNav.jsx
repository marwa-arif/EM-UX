import React from 'react'

const GROUPS = [
  {
    label: 'Home',
    items: [
      { id: 'workspace', label: 'Workspace', icon: 'navbar-workspace' },
    ],
  },
  {
    label: 'Core Data',
    items: [
      { id: 'kg', label: 'Knowledge Graph', icon: 'navbar-kg' },
    ],
  },
  {
    label: 'Exposure',
    items: [
      { id: 'exposure/overview', label: 'Overview', icon: 'nav-overview' },
      { id: 'exposure/findings', label: 'Findings', icon: 'nav-findings' },
    ],
  },
  {
    label: 'Discover',
    items: [
      { id: 'discover/device',   label: 'Device',   icon: 'nav-discover-device' },
      { id: 'discover/cloud',    label: 'Cloud',    icon: 'nav-discover-cloud' },
      { id: 'discover/identity', label: 'Identity', icon: 'nav-discover-identity' },
    ],
  },
  {
    label: 'Report',
    items: [
      { id: 'report/compliance',          label: 'Compliance',          icon: 'nav-report-compliance' },
      { id: 'report/assessments',         label: 'Assessments',         icon: 'nav-report-assessments' },
      { id: 'report/compliance-matrix',   label: 'Compliance Matrix',   icon: 'nav-report-matrix' },
      { id: 'report/compliance-findings', label: 'Compliance Findings', icon: 'nav-findings' },
    ],
  },
  {
    label: 'Data Quality',
    items: [
      { id: 'data-quality/overview', label: 'Overview', icon: 'nav-overview' },
      { id: 'data-quality/in-depth', label: 'In-Depth',  icon: 'nav-dq-indepth' },
    ],
  },
  {
    label: 'Remediation',
    items: [
      { id: 'remediation/queue',  label: 'Queue',  icon: 'nav-remediation-queue' },
      { id: 'remediation/closed', label: 'Closed', icon: 'nav-remediation-closed' },
    ],
  },
  {
    label: 'Client Specific',
    items: [
      { id: 'client/servers',  label: 'Servers',  icon: 'infrastructure-type' },
      { id: 'client/networks', label: 'Networks', icon: 'entity-network' },
    ],
  },
];

function NavIcon({ icon }) {
  return (
    <span
      className="ux3-nav-icon"
      style={{
        maskImage: `url('/assets/icons/${icon}.svg')`,
        WebkitMaskImage: `url('/assets/icons/${icon}.svg')`,
      }}
    />
  );
}

const BackIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);

function UX3LeftNav({ current, onNav }) {
  return (
    <aside className="admin-sidebar ux3-leftnav">
      <nav className="admin-sidebar__nav">
        {GROUPS.map(group => (
          <div key={group.label} className="admin-sidebar__group">
            <div className="admin-sidebar__group-label">{group.label}</div>
            {group.items.map(item => (
              <button
                key={item.id}
                className={`admin-sidebar__item${current === item.id ? ' admin-sidebar__item--active' : ''}`}
                onClick={() => onNav(item.id)}
              >
                <NavIcon icon={item.icon} />
                {item.label}
              </button>
            ))}
          </div>
        ))}
      </nav>
      <div className="admin-sidebar__footer">
        <button className="admin-sidebar__item" onClick={() => onNav('ux3-exit')}>
          <BackIcon />
          Back to Classic Dashboard
        </button>
      </div>
    </aside>
  );
}

export default UX3LeftNav;
