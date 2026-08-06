import React, { useState } from 'react'
import SubHeader from '../../components/SubHeader.jsx'
import { UsersSection, GroupsSection, RolesSection, INITIAL_USERS, INITIAL_GROUPS, INITIAL_ROLES } from './UsersAndAccess.jsx'
import { SSOSection, ApiKeysSection } from './IdentitySecurity.jsx'
import { DataSourcesSection, TicketingSection, WebhooksSection } from './DataIntegrations.jsx'
import { SecuritySection, AuditLogSection, ComplianceSection, DataRetentionSection } from './SecurityCompliance.jsx'
import { RiskScoringSection, NotificationRulesSection } from './RiskConfig.jsx'
import { OrganizationSection, BillingSection } from './Workspace.jsx'

/* ── Settings nav structure — shared by every shell the Settings panel
   can nest inside (classic EM, Studio, UX3, and the Workspace fallback). ── */
export const ADMIN_NAV_GROUPS = [
  {
    label: 'Access',
    items: [
      { id: 'users',  label: 'Users' },
      { id: 'groups', label: 'Groups' },
      { id: 'roles',  label: 'Roles & Permissions' },
      { id: 'sso',    label: 'Single Sign-On' },
      { id: 'api-keys', label: 'API Keys' },
    ],
  },
  {
    label: 'Integrations',
    items: [
      { id: 'data-sources', label: 'Data Sources' },
      { id: 'ticketing',    label: 'Ticketing & SOAR' },
      { id: 'webhooks',     label: 'Webhooks' },
    ],
  },
  {
    label: 'Security & Compliance',
    items: [
      { id: 'security',       label: 'Security' },
      { id: 'audit-log',      label: 'Audit Log' },
      { id: 'compliance',     label: 'Compliance Frameworks' },
      { id: 'data-retention', label: 'Data Retention' },
    ],
  },
  {
    label: 'Risk Configuration',
    items: [
      { id: 'risk-scoring',      label: 'Risk Scoring' },
      { id: 'notification-rules', label: 'Notification Rules' },
    ],
  },
  {
    label: 'Workspace',
    items: [
      { id: 'organization', label: 'Organization' },
      { id: 'billing',      label: 'Billing & Plan' },
    ],
  },
];
const ALL_ITEMS = ADMIN_NAV_GROUPS.flatMap(g => g.items);

export function useAdminPanelState() {
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

  return {
    activeSection, setActiveSection,
    users, setUsers,
    groups, setGroups,
    roles, setRoles,
    settings, setSettings,
    confirmAction, setConfirmAction,
    sectionLabel,
  };
}

/* ── Settings nav column — plain grouped list, no per-item icons (the
   icon-per-row treatment read as cluttered/chunky at this density). ── */
export function AdminSettingsNav({ activeSection, onSelect }) {
  return (
    <>
      <nav className="settings-panel__nav">
        <div className="settings-panel__title">Settings</div>
        {ADMIN_NAV_GROUPS.map(group => (
          <div key={group.label} className="settings-panel__group">
            <div className="settings-panel__group-label">{group.label}</div>
            {group.items.map(s => (
              <button
                key={s.id}
                className={`settings-panel__item${activeSection === s.id ? ' settings-panel__item--active' : ''}`}
                onClick={() => onSelect(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
        ))}
      </nav>
      <div className="settings-panel__footer">
        <div className="settings-panel__tenant">Tenant ID<br /><span className="admin-mono">ten_7f3a9c2e91</span></div>
      </div>
    </>
  );
}

export function AdminPanelContent({ state, onNav, onClose }) {
  const { activeSection, users, setUsers, groups, setGroups, roles, setRoles, settings, setSettings, setConfirmAction, sectionLabel } = state;
  return (
    <>
      <SubHeader
        title={sectionLabel}
        breadcrumb={['Home', 'Admin Panel']}
        breadcrumbHrefs={[null, null]}
        breadcrumbClicks={[onClose]}
        showMenu={false}
        showExplore={false}
        actions={null}
        leading={
          <button className="ds-btn sz-md t-outline admin-back-btn" onClick={onClose}>
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
    </>
  );
}

export function AdminConfirmModal({ confirmAction, onClose }) {
  if (!confirmAction) return null;
  return (
    <div className="ds-modal-overlay">
      <div className="ds-modal" role="dialog" aria-modal="true">
        <div className="ds-modal-header">
          <span className={`ds-modal-title ${confirmAction.tier === 'warning' ? 'warning' : 'danger'}`}>{confirmAction.title}</span>
          <button className="ds-modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="ds-modal-body">{confirmAction.body}</div>
        <div className="ds-modal-footer">
          <button className="ds-btn sz-md t-outline" onClick={onClose}>Cancel</button>
          <button className={`ds-btn sz-md ${confirmAction.tier === 'warning' ? 't-primary' : 't-danger'}`} onClick={() => { confirmAction.onConfirm(); onClose(); }}>
            {confirmAction.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
