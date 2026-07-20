import React, { useState } from 'react'
import Topbar from '../components/Topbar.jsx'
import SubHeader from '../components/SubHeader.jsx'
import '../styles/device.css'
import {
  IcUsers, IcUserGroup, IcShield, IcFingerprint, IcKey, IcPlug, IcTicket, IcWebhook,
  IcLock, IcClipboard, IcCheckBadge, IcArchive, IcGauge, IcBell, IcBuilding, IcCreditCard,
} from './admin/shared.jsx'
import { UsersSection, GroupsSection, RolesSection, INITIAL_USERS, INITIAL_GROUPS, INITIAL_ROLES } from './admin/UsersAndAccess.jsx'
import { SSOSection, ApiKeysSection } from './admin/IdentitySecurity.jsx'
import { DataSourcesSection, TicketingSection, WebhooksSection } from './admin/DataIntegrations.jsx'
import { SecuritySection, AuditLogSection, ComplianceSection, DataRetentionSection } from './admin/SecurityCompliance.jsx'
import { RiskScoringSection, NotificationRulesSection } from './admin/RiskConfig.jsx'
import { OrganizationSection, BillingSection } from './admin/Workspace.jsx'

/* ── Sidebar structure ───────────────────────────────────────────── */
const NAV_GROUPS = [
  {
    label: 'Access',
    items: [
      { id: 'users',  label: 'Users',              icon: <IcUsers/> },
      { id: 'groups', label: 'Groups',              icon: <IcUserGroup/> },
      { id: 'roles',  label: 'Roles & Permissions', icon: <IcShield/> },
      { id: 'sso',    label: 'Single Sign-On',      icon: <IcFingerprint/> },
      { id: 'api-keys', label: 'API Keys',          icon: <IcKey/> },
    ],
  },
  {
    label: 'Integrations',
    items: [
      { id: 'data-sources', label: 'Data Sources',    icon: <IcPlug/> },
      { id: 'ticketing',    label: 'Ticketing & SOAR', icon: <IcTicket/> },
      { id: 'webhooks',     label: 'Webhooks',         icon: <IcWebhook/> },
    ],
  },
  {
    label: 'Security & Compliance',
    items: [
      { id: 'security',       label: 'Security',              icon: <IcLock/> },
      { id: 'audit-log',      label: 'Audit Log',              icon: <IcClipboard/> },
      { id: 'compliance',     label: 'Compliance Frameworks',  icon: <IcCheckBadge/> },
      { id: 'data-retention', label: 'Data Retention',         icon: <IcArchive/> },
    ],
  },
  {
    label: 'Risk Configuration',
    items: [
      { id: 'risk-scoring',      label: 'Risk Scoring',        icon: <IcGauge/> },
      { id: 'notification-rules', label: 'Notification Rules', icon: <IcBell/> },
    ],
  },
  {
    label: 'Workspace',
    items: [
      { id: 'organization', label: 'Organization', icon: <IcBuilding/> },
      { id: 'billing',      label: 'Billing & Plan', icon: <IcCreditCard/> },
    ],
  },
];
const ALL_ITEMS = NAV_GROUPS.flatMap(g => g.items);

/* ── Page ────────────────────────────────────────────────────────── */
function AdminPage({ onNav, theme, onToggleTheme }) {
  const [activeSection, setActiveSection] = useState('users');
  const [users, setUsers] = useState(INITIAL_USERS);
  const [groups, setGroups] = useState(INITIAL_GROUPS);
  const [roles, setRoles] = useState(INITIAL_ROLES);
  const [settings, setSettings] = useState({
    enforceMFA: false,
    auditLogExport: true,
    autoDeprovision: false,
    sessionTimeout: '4 hours',
    authMethods: new Set(['Password', 'Single sign-on']),
    pwMinLength: '10 characters',
    pwRequireNumber: true,
    pwRequireUpper: true,
    pwRequireSpecial: false,
    pwExpiry: '365 days',
  });
  const [confirmAction, setConfirmAction] = useState(null);

  const sectionLabel = ALL_ITEMS.find(s => s.id === activeSection)?.label || 'Admin Panel';

  return (
    <div className="app-shell">
      <Topbar onNav={onNav} theme={theme} onToggleTheme={onToggleTheme} />
      <div className="app-body">
        <aside className="admin-sidebar">
          <nav className="admin-sidebar__nav">
            {NAV_GROUPS.map(group => (
              <div key={group.label} className="admin-sidebar__group">
                <div className="admin-sidebar__group-label">{group.label}</div>
                {group.items.map(s => (
                  <button
                    key={s.id}
                    className={`admin-sidebar__item${activeSection === s.id ? ' admin-sidebar__item--active' : ''}`}
                    onClick={() => setActiveSection(s.id)}
                  >
                    {s.icon}
                    {s.label}
                  </button>
                ))}
              </div>
            ))}
          </nav>
          <div className="admin-sidebar__footer">
            <div className="admin-sidebar__tenant">Tenant ID<br /><span className="admin-mono">ten_7f3a9c2e91</span></div>
            <div className="admin-sidebar__support-label">Support</div>
            <button className="admin-sidebar__item admin-sidebar__item--support" disabled>
              <IcClipboard />
              Help Center
              <span className="admin-sidebar__soon">Soon</span>
            </button>
          </div>
        </aside>

        <main className="exp-main exp-main--col admin-main">
          <SubHeader
            title={sectionLabel}
            breadcrumb={['Home', 'Admin Panel']}
            breadcrumbHrefs={[null, null]}
            breadcrumbClicks={[() => onNav('admin-exit')]}
            showMenu={false}
            showExplore={false}
            actions={null}
            leading={
              <button className="ds-btn sz-md t-outline admin-back-btn" onClick={() => onNav('admin-exit')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
                </svg>
                Back
              </button>
            }
          />

          <div className="page-scroll">
            <div className="admin-content">
              {activeSection === 'users' && (
                <UsersSection users={users} setUsers={setUsers} groups={groups} onConfirm={setConfirmAction} />
              )}
              {activeSection === 'groups' && (
                <GroupsSection groups={groups} setGroups={setGroups} users={users} onConfirm={setConfirmAction} />
              )}
              {activeSection === 'roles' && (
                <RolesSection roles={roles} setRoles={setRoles} onConfirm={setConfirmAction} />
              )}
              {activeSection === 'sso' && <SSOSection />}
              {activeSection === 'api-keys' && <ApiKeysSection onConfirm={setConfirmAction} />}
              {activeSection === 'data-sources' && <DataSourcesSection onConfirm={setConfirmAction} />}
              {activeSection === 'ticketing' && <TicketingSection />}
              {activeSection === 'webhooks' && <WebhooksSection onConfirm={setConfirmAction} />}
              {activeSection === 'security' && <SecuritySection settings={settings} setSettings={setSettings} />}
              {activeSection === 'audit-log' && <AuditLogSection />}
              {activeSection === 'compliance' && <ComplianceSection onNav={onNav} />}
              {activeSection === 'data-retention' && <DataRetentionSection />}
              {activeSection === 'risk-scoring' && <RiskScoringSection />}
              {activeSection === 'notification-rules' && <NotificationRulesSection onConfirm={setConfirmAction} />}
              {activeSection === 'organization' && (
                <OrganizationSection userCount={users.length} onConfirm={setConfirmAction} />
              )}
              {activeSection === 'billing' && <BillingSection userCount={users.length} />}
            </div>
          </div>
        </main>
      </div>

      {confirmAction && (
        <div className="ds-modal-overlay">
          <div className="ds-modal" role="dialog" aria-modal="true">
            <div className="ds-modal-header">
              <span className="ds-modal-title">{confirmAction.title}</span>
              <button className="ds-modal-close" onClick={() => setConfirmAction(null)} aria-label="Close">×</button>
            </div>
            <div className="ds-modal-body">{confirmAction.body}</div>
            <div className="ds-modal-footer">
              <button className="ds-btn sz-md t-outline" onClick={() => setConfirmAction(null)}>Cancel</button>
              <button className="ds-btn sz-md t-danger" onClick={() => { confirmAction.onConfirm(); setConfirmAction(null); }}>
                {confirmAction.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPage;
