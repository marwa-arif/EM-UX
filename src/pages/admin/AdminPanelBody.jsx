import React, { useState } from 'react'
import SubHeader from '../../components/SubHeader.jsx'
import {
  IcUsers, IcUserGroup, IcShield, IcFingerprint, IcKey,
  IcPlug, IcTicket, IcWebhook,
  IcLock, IcClipboard, IcCheckBadge, IcArchive,
  IcGauge, IcBell,
  IcBuilding, IcCreditCard,
} from './shared.jsx'
import { UsersSection, GroupsSection, RolesSection, INITIAL_USERS, INITIAL_GROUPS, INITIAL_ROLES } from './UsersAndAccess.jsx'
import { SSOSection, ApiKeysSection } from './IdentitySecurity.jsx'
import { DataSourcesSection, TicketingSection, WebhooksSection } from './DataIntegrations.jsx'
import { SecuritySection, AuditLogSection, ComplianceSection, DataRetentionSection } from './SecurityCompliance.jsx'
import { RiskScoringSection, NotificationRulesSection } from './RiskConfig.jsx'
import { OrganizationSection, BillingSection } from './Workspace.jsx'
import { IcServer, IcCheckShield } from '../control-plane/shared.jsx'
import EnvironmentDirectoryPage from '../control-plane/EnvironmentDirectoryPage.jsx'
import EnvironmentDetailPage from '../control-plane/EnvironmentDetailPage.jsx'
import EnvironmentFormPage from '../control-plane/EnvironmentFormPage.jsx'
import CoveragePage from '../control-plane/CoveragePage.jsx'

/* ── Settings nav structure — shared by every shell the Settings panel
   can nest inside (classic EM, Studio, UX3, and the Workspace fallback).
   Each item carries an iconNode so LeftNav can render the Admin Panel
   using the exact same NavItem row (icon + label, same font weight, same
   collapse-to-icon-rail behavior) as the Insights/Fabric Configuration
   groups, instead of a visually distinct icon-less list. ── */
export const ADMIN_NAV_GROUPS = [
  {
    label: 'Access',
    items: [
      { id: 'users',  label: 'Users', iconNode: <IcUsers /> },
      { id: 'groups', label: 'Groups', iconNode: <IcUserGroup /> },
      { id: 'roles',  label: 'Roles & Permissions', iconNode: <IcShield /> },
      { id: 'sso',    label: 'Single Sign-On', iconNode: <IcFingerprint /> },
      { id: 'api-keys', label: 'API Keys', iconNode: <IcKey /> },
    ],
  },
  {
    label: 'Integrations',
    items: [
      { id: 'data-sources', label: 'Data Sources', iconNode: <IcPlug /> },
      { id: 'ticketing',    label: 'Ticketing & SOAR', iconNode: <IcTicket /> },
      { id: 'webhooks',     label: 'Webhooks', iconNode: <IcWebhook /> },
    ],
  },
  {
    label: 'Security & Compliance',
    items: [
      { id: 'security',       label: 'Security', iconNode: <IcLock /> },
      { id: 'audit-log',      label: 'Audit Log', iconNode: <IcClipboard /> },
      { id: 'compliance',     label: 'Compliance Frameworks', iconNode: <IcCheckBadge /> },
      { id: 'data-retention', label: 'Data Retention', iconNode: <IcArchive /> },
    ],
  },
  {
    label: 'Risk Configuration',
    items: [
      { id: 'risk-scoring',      label: 'Risk Scoring', iconNode: <IcGauge /> },
      { id: 'notification-rules', label: 'Notification Rules', iconNode: <IcBell /> },
    ],
  },
  {
    label: 'Workspace',
    items: [
      { id: 'organization', label: 'Organization', iconNode: <IcBuilding /> },
      { id: 'billing',      label: 'Billing & Plan', iconNode: <IcCreditCard /> },
    ],
  },
  // Control Plane — first capability is the Environment Directory (read-only
  // directory + detail, manual record entry, coverage reconciliation). Lives
  // here in Admin Panel rather than a top-level LeftNav section per request.
  // Room for more items (Deployments/Health/Audit/Cost) later in this same
  // group, no restructuring needed.
  {
    label: 'Control Plane',
    items: [
      { id: 'cp-environments', label: 'Environments', iconNode: <IcServer /> },
      { id: 'cp-coverage',     label: 'Coverage', iconNode: <IcCheckShield /> },
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

  // Environment Directory has its own list/detail/new sub-views, same as
  // every other Admin Panel section renders a flat page for its one
  // `activeSection` id — nested here instead of promoted into `current`/
  // PAGE_META (App.jsx) since it's reached only through Admin Panel, not a
  // top-level destination.
  const [cpEnvView, setCpEnvView] = useState('list'); // 'list' | 'detail' | 'new'
  const [cpSelectedEnvId, setCpSelectedEnvId] = useState(null);
  const [cpNewCustomer, setCpNewCustomer] = useState('');

  // Single onNav for all four control-plane pages (Directory/Detail/Form/
  // Coverage) — they were built to call onNav with real route ids
  // ('control-plane/environments', '.../new', '.../<id>', '.../coverage');
  // this translates those into local view-state instead of a URL change, so
  // none of those page components needed to change to live inside Admin
  // Panel's single-activeSection model.
  const handleControlPlaneNav = (id, data) => {
    if (id === 'control-plane/coverage') { setActiveSection('cp-coverage'); return; }
    if (id === 'control-plane/environments') { setActiveSection('cp-environments'); setCpEnvView('list'); return; }
    if (id === 'control-plane/environments/new') { setActiveSection('cp-environments'); setCpEnvView('new'); setCpNewCustomer(data?.customerName || ''); return; }
    if (id.startsWith('control-plane/environments/')) { setActiveSection('cp-environments'); setCpEnvView('detail'); setCpSelectedEnvId(id.split('/')[2]); return; }
  };

  const sectionLabel = ALL_ITEMS.find(s => s.id === activeSection)?.label || 'Admin Panel';

  return {
    activeSection, setActiveSection,
    users, setUsers,
    groups, setGroups,
    roles, setRoles,
    settings, setSettings,
    confirmAction, setConfirmAction,
    cpEnvView, cpSelectedEnvId, cpNewCustomer, handleControlPlaneNav,
    sectionLabel,
  };
}

/* ── Settings nav column — plain grouped list, no per-item icons (the
   icon-per-row treatment read as cluttered/chunky at this density). ── */
export function AdminSettingsNav({ activeSection, onSelect }) {
  return (
    <>
      <nav className="settings-panel__nav">
        <div className="settings-panel__title">Admin Panel</div>
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
  const { activeSection, users, setUsers, groups, setGroups, roles, setRoles, settings, setSettings, setConfirmAction, sectionLabel, cpEnvView, cpSelectedEnvId, cpNewCustomer, handleControlPlaneNav } = state;
  return (
    <>
      <SubHeader
        title={sectionLabel}
        breadcrumb={['Insights', 'Admin Panel']}
        breadcrumbHrefs={[null, null]}
        breadcrumbClicks={[onClose]}
        showMenu={false}
        showExplore={false}
        actions={null}
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
          {activeSection === 'cp-environments' && cpEnvView === 'list' && <EnvironmentDirectoryPage onNav={handleControlPlaneNav} />}
          {activeSection === 'cp-environments' && cpEnvView === 'detail' && <EnvironmentDetailPage id={cpSelectedEnvId} onNav={handleControlPlaneNav} />}
          {activeSection === 'cp-environments' && cpEnvView === 'new' && <EnvironmentFormPage onNav={handleControlPlaneNav} initialCustomerName={cpNewCustomer} />}
          {activeSection === 'cp-coverage' && <CoveragePage onNav={handleControlPlaneNav} />}
        </div>
      </div>
    </>
  );
}

export function AdminConfirmModal({ confirmAction, onClose }) {
  if (!confirmAction) return null;
  const isDelete = /^(Delete|Remove)/i.test(confirmAction.confirmLabel);
  return (
    <div className="ds-modal-overlay">
      <div className="ds-modal" role="dialog" aria-modal="true">
        <div className="ds-modal-header">
          <span className={`ds-modal-title ${confirmAction.tier === 'warning' ? 'warning' : 'danger'}${isDelete ? ' admin-delete-modal-title' : ''}`}>
            {isDelete && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                <line x1="10" y1="11" x2="10" y2="17"/>
                <line x1="14" y1="11" x2="14" y2="17"/>
              </svg>
            )}
            {confirmAction.title}
          </span>
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
