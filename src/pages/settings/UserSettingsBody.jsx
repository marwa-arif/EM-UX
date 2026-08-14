import React, { useState } from 'react'
import SubHeader from '../../components/SubHeader.jsx'
import { IcUsers, IcLock, IcBell, SectionHead, ToggleRow } from '../admin/shared.jsx'

/* ── Per-user Settings — basic account-level preferences, distinct from the
   Admin Console's org/company/plan-wide configuration (AdminPanelBody.jsx).
   Reached only from the Topbar account menu, never nested inside a shell's
   own left nav, so it's a single flat list rather than grouped sections. ── */
export const USER_SETTINGS_NAV = [
  { id: 'profile', label: 'Profile' },
  { id: 'password', label: 'Password & Security' },
  { id: 'notifications', label: 'Notifications' },
];

export function useUserSettingsState() {
  const [activeSection, setActiveSection] = useState('profile');
  const [profile, setProfile] = useState({ name: 'MP', email: 'mp@prevalent.ai' });
  const [security, setSecurity] = useState({ twoFactorEnabled: false });
  const [notifications, setNotifications] = useState({
    productUpdates: true,
    securityAlerts: true,
    weeklyDigest: false,
  });

  const sectionLabel = USER_SETTINGS_NAV.find(s => s.id === activeSection)?.label || 'Settings';

  return {
    activeSection, setActiveSection,
    profile, setProfile,
    security, setSecurity,
    notifications, setNotifications,
    sectionLabel,
  };
}

export function UserSettingsNav({ activeSection, onSelect }) {
  return (
    <nav className="settings-panel__nav">
      <div className="settings-panel__title">Settings</div>
      <div className="settings-panel__group">
        {USER_SETTINGS_NAV.map(s => (
          <button
            key={s.id}
            className={`settings-panel__item${activeSection === s.id ? ' settings-panel__item--active' : ''}`}
            onClick={() => onSelect(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

function ProfileSection({ profile, setProfile }) {
  return (
    <>
      <SectionHead icon={<IcUsers />} title="Profile" desc="Your personal account information." />
      <div className="admin-card">
        <div className="admin-form-body">
          <label className="admin-field-label">Name</label>
          <input className="admin-input" value={profile.name} onChange={(e) => setProfile(p => ({ ...p, name: e.target.value }))} />
          <label className="admin-field-label">Email</label>
          <input className="admin-input" value={profile.email} onChange={(e) => setProfile(p => ({ ...p, email: e.target.value }))} />
        </div>
        <div className="admin-save-row">
          <button className="ds-btn sz-md t-primary">Save Changes</button>
        </div>
      </div>
    </>
  );
}

function PasswordSection({ security, setSecurity }) {
  return (
    <>
      <SectionHead icon={<IcLock />} title="Password & Security" desc="Manage your own sign-in credentials." />
      <div className="admin-card">
        <div className="admin-card__header">
          <div className="admin-card__title">Change password</div>
        </div>
        <div className="admin-form-body">
          <label className="admin-field-label">Current password</label>
          <input type="password" className="admin-input" placeholder="••••••••" />
          <div className="admin-form-grid">
            <div className="admin-field-col">
              <label className="admin-field-label">New password</label>
              <input type="password" className="admin-input" placeholder="••••••••" />
            </div>
            <div className="admin-field-col">
              <label className="admin-field-label">Confirm password</label>
              <input type="password" className="admin-input" placeholder="••••••••" />
            </div>
          </div>
        </div>
        <div className="admin-save-row">
          <button className="ds-btn sz-md t-primary">Update Password</button>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-toggle-list">
          <ToggleRow
            label="Two-factor authentication"
            desc="Require a one-time code from your device when signing in."
            value={security.twoFactorEnabled}
            onChange={(v) => setSecurity(s => ({ ...s, twoFactorEnabled: v }))}
          />
        </div>
      </div>
    </>
  );
}

function NotificationsSection({ notifications, setNotifications }) {
  return (
    <>
      <SectionHead icon={<IcBell />} title="Notifications" desc="Choose what you personally get notified about." />
      <div className="admin-card">
        <div className="admin-toggle-list">
          <ToggleRow
            label="Product updates"
            desc="New features and changes to the product."
            value={notifications.productUpdates}
            onChange={(v) => setNotifications(n => ({ ...n, productUpdates: v }))}
          />
          <ToggleRow
            label="Security alerts"
            desc="Sign-ins from a new device and other account security events."
            value={notifications.securityAlerts}
            onChange={(v) => setNotifications(n => ({ ...n, securityAlerts: v }))}
          />
          <ToggleRow
            label="Weekly digest email"
            desc="A weekly summary of activity relevant to you."
            value={notifications.weeklyDigest}
            onChange={(v) => setNotifications(n => ({ ...n, weeklyDigest: v }))}
          />
        </div>
      </div>
    </>
  );
}

export function UserSettingsContent({ state, onClose }) {
  const { activeSection, profile, setProfile, security, setSecurity, notifications, setNotifications, sectionLabel } = state;
  return (
    <>
      <SubHeader
        title={sectionLabel}
        breadcrumb={['Home', 'Settings']}
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
          {activeSection === 'profile' && <ProfileSection profile={profile} setProfile={setProfile} />}
          {activeSection === 'password' && <PasswordSection security={security} setSecurity={setSecurity} />}
          {activeSection === 'notifications' && <NotificationsSection notifications={notifications} setNotifications={setNotifications} />}
        </div>
      </div>
    </>
  );
}
