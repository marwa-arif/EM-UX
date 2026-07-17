import React, { useState } from 'react'
import DSDropdown from '../../components/DSDropdown.jsx'
import { DSPillSearch } from '../../context/WorkspaceCtx.jsx'
import { IcLock, IcClipboard, IcCheckBadge, IcArchive, IcDownload, STATUS_BADGE, initials, SectionHead, ToggleRow } from './shared.jsx'

/* ── Security ────────────────────────────────────────────────────── */
export function SecuritySection({ settings, setSettings }) {
  const [ipAllowlist, setIpAllowlist] = useState('10.0.0.0/8\n192.168.1.0/24');
  const [saved, setSaved] = useState(false);
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 1500); };

  const authMethods = settings.authMethods;
  const toggleAuthMethod = (m) => setSettings(s => {
    const next = new Set(s.authMethods);
    next.has(m) ? next.delete(m) : next.add(m);
    return { ...s, authMethods: next };
  });

  return (
    <>
      <SectionHead icon={<IcLock/>} title="Security" desc="Workspace-wide authentication and access hardening." />

      <div className="admin-card">
        <div className="admin-toggle-list">
          <ToggleRow
            label="Enforce MFA for all users"
            desc="Require multi-factor authentication at every sign-in."
            value={settings.enforceMFA}
            onChange={(v) => setSettings(s => ({ ...s, enforceMFA: v }))}
          />
          <ToggleRow
            label="Auto-deprovision inactive users"
            desc="Automatically revoke access after 90 days of inactivity."
            value={settings.autoDeprovision}
            onChange={(v) => setSettings(s => ({ ...s, autoDeprovision: v }))}
          />
          <ToggleRow
            label="Audit log export"
            desc="Allow admins to export the audit log as CSV."
            value={settings.auditLogExport}
            onChange={(v) => setSettings(s => ({ ...s, auditLogExport: v }))}
          />
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card__header">
          <div className="admin-card__title">Authentication methods</div>
          <div className="admin-card__subtitle">Allowed ways a user can sign in. SSO is configured separately under Identity.</div>
        </div>
        <div className="admin-checkbox-list">
          {['Password', 'Single sign-on', 'Magic link'].map(m => (
            <label key={m} className="admin-checkbox-list__item">
              <input type="checkbox" className="admin-checkbox" checked={authMethods.has(m)} onChange={() => toggleAuthMethod(m)} />
              {m}
            </label>
          ))}
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card__header">
          <div className="admin-card__title">Password policy</div>
        </div>
        <div className="admin-field-row">
          <label className="admin-field-label">Minimum length</label>
          <DSDropdown value={settings.pwMinLength} onChange={(v) => setSettings(s => ({ ...s, pwMinLength: v }))} options={['8 characters', '10 characters', '12 characters', '16 characters']} />
        </div>
        <div className="admin-toggle-list">
          <ToggleRow label="Require a number" value={settings.pwRequireNumber} onChange={(v) => setSettings(s => ({ ...s, pwRequireNumber: v }))} />
          <ToggleRow label="Require an uppercase letter" value={settings.pwRequireUpper} onChange={(v) => setSettings(s => ({ ...s, pwRequireUpper: v }))} />
          <ToggleRow label="Require a special character" value={settings.pwRequireSpecial} onChange={(v) => setSettings(s => ({ ...s, pwRequireSpecial: v }))} />
        </div>
        <div className="admin-field-row">
          <label className="admin-field-label">Password expiry</label>
          <DSDropdown value={settings.pwExpiry} onChange={(v) => setSettings(s => ({ ...s, pwExpiry: v }))} options={['Never', '90 days', '180 days', '365 days']} />
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card__header">
          <div className="admin-card__title">Session &amp; network</div>
        </div>
        <div className="admin-field-row">
          <label className="admin-field-label">Session timeout</label>
          <DSDropdown value={settings.sessionTimeout} onChange={(v) => setSettings(s => ({ ...s, sessionTimeout: v }))}
                      options={['30 minutes', '1 hour', '4 hours', '8 hours', '24 hours']} />
        </div>
        <div className="admin-field-col">
          <label className="admin-field-label">IP allowlist</label>
          <div className="admin-field-desc">One CIDR range per line. Leave empty to allow any IP.</div>
          <textarea className="admin-textarea" rows={3} value={ipAllowlist} onChange={e => setIpAllowlist(e.target.value)} />
        </div>
      </div>

      <div className="admin-save-row">
        <button className="ds-btn sz-md t-primary" onClick={save}>{saved ? 'Saved ✓' : 'Save changes'}</button>
      </div>
    </>
  );
}

/* ── Audit Log ───────────────────────────────────────────────────── */
const AUDIT_LOG = [
  { id: 1, actor: 'MP (You)',      action: 'Signed in',                 target: '—',                      time: 'Today · 14:32 UTC',    ip: '203.0.113.4'   },
  { id: 2, actor: 'Alex Rivera',   action: 'Removed user',              target: 'Casey Nguyen',           time: 'Today · 11:05 UTC',    ip: '198.51.100.22' },
  { id: 3, actor: 'Nadia Farouk',  action: 'Updated role',              target: 'Ravi Deshmukh → Viewer', time: 'Yesterday · 19:40 UTC', ip: '198.51.100.9'  },
  { id: 4, actor: 'MP (You)',      action: 'Disconnected data source',  target: 'Okta',                   time: 'Yesterday · 16:12 UTC', ip: '203.0.113.4'   },
  { id: 5, actor: 'Marcus Chen',   action: 'Enabled SSO enforcement',   target: 'Security settings',      time: '2 days ago · 09:03 UTC', ip: '198.51.100.31' },
  { id: 6, actor: 'Priya Nair',    action: 'Exported audit log',        target: 'CSV export',             time: '3 days ago · 13:47 UTC', ip: '198.51.100.5'  },
  { id: 7, actor: 'Alex Rivera',   action: 'Invited user',              target: 'Sam Okafor',             time: '4 days ago · 08:29 UTC', ip: '198.51.100.22' },
  { id: 8, actor: 'MP (You)',      action: 'Connected data source',     target: 'MS Defender',            time: '5 days ago · 17:58 UTC', ip: '203.0.113.4'   },
];

const FAILED_LOGINS = [
  { id: 1, actor: 'unknown@external.com', reason: 'Invalid credentials', time: 'Today · 03:12 UTC',    ip: '45.129.14.201' },
  { id: 2, actor: 'nadia.farouk@prevalent.ai', reason: 'MFA challenge failed', time: 'Yesterday · 22:47 UTC', ip: '198.51.100.9' },
  { id: 3, actor: 'unknown@external.com', reason: 'Invalid credentials', time: '3 days ago · 04:02 UTC', ip: '45.129.14.201' },
];

export function AuditLogSection() {
  const [search, setSearch] = useState('');
  const [range, setRange] = useState('Last 7 days');
  const [category, setCategory] = useState('All categories');

  const rows = AUDIT_LOG.filter(r => !search || `${r.actor} ${r.action} ${r.target}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <SectionHead icon={<IcClipboard/>} title="Audit Log" desc="A record of security-relevant actions taken in this workspace." />

      <div className="admin-toolbar">
        <DSPillSearch value={search} onChange={setSearch} placeholder="Search by actor, action, or target" width={260} />
        <DSDropdown value={category} onChange={setCategory} options={['All categories', 'Access', 'Data Sources', 'Security', 'Billing']} />
        <DSDropdown value={range} onChange={setRange} options={['Last 24 hours', 'Last 7 days', 'Last 30 days', 'All time']} />
        <div className="admin-toolbar__spacer" />
        <button className="ds-btn sz-md t-outline"><IcDownload /> Export CSV</button>
      </div>

      <div className="ds-table-wrap">
        <table className="ds-table">
          <thead>
            <tr><th>Actor</th><th>Action</th><th>Target</th><th>Timestamp</th><th>IP Address</th></tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td>
                  <div className="admin-user-cell">
                    <div className="admin-user-avatar admin-user-avatar--sm">{initials(r.actor)}</div>
                    {r.actor}
                  </div>
                </td>
                <td>{r.action}</td>
                <td>{r.target}</td>
                <td>{r.time}</td>
                <td className="admin-mono">{r.ip}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={5} className="admin-empty-row">No matching audit events.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="admin-card">
        <div className="admin-card__header">
          <div className="admin-card__title">Failed sign-in attempts</div>
          <div className="admin-card__subtitle">Repeated failures from the same IP may indicate a credential-stuffing attempt.</div>
        </div>
        <div className="ds-table-wrap">
          <table className="ds-table">
            <thead><tr><th>Account</th><th>Reason</th><th>Timestamp</th><th>IP Address</th></tr></thead>
            <tbody>
              {FAILED_LOGINS.map(f => (
                <tr key={f.id}>
                  <td>{f.actor}</td>
                  <td><span className="ds-badge danger">{f.reason}</span></td>
                  <td>{f.time}</td>
                  <td className="admin-mono">{f.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/* ── Compliance Frameworks ───────────────────────────────────────── */
const INITIAL_FRAMEWORKS = [
  { id: 'nist',  name: 'NIST CSF 2.0',      enabled: true,  coverage: 82, assessed: 'Jun 2, 2026' },
  { id: 'iso',   name: 'ISO/IEC 27001',     enabled: true,  coverage: 74, assessed: 'May 18, 2026' },
  { id: 'soc2',  name: 'SOC 2 Type II',     enabled: true,  coverage: 91, assessed: 'Jun 28, 2026' },
  { id: 'pci',   name: 'PCI DSS 4.0',       enabled: false, coverage: 0,  assessed: '—' },
  { id: 'cis',   name: 'CIS Controls v8',   enabled: true,  coverage: 68, assessed: 'Apr 30, 2026' },
  { id: 'hipaa', name: 'HIPAA Security Rule', enabled: false, coverage: 0, assessed: '—' },
];

export function ComplianceSection({ onNav }) {
  const [frameworks, setFrameworks] = useState(INITIAL_FRAMEWORKS);
  const toggle = (id) => setFrameworks(prev => prev.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f));

  return (
    <>
      <SectionHead icon={<IcCheckBadge/>} title="Compliance Frameworks" count={frameworks.filter(f => f.enabled).length} desc="Frameworks mapped against your findings and control coverage." />

      <div className="ds-table-wrap">
        <table className="ds-table">
          <thead><tr><th>Framework</th><th>Status</th><th>Coverage</th><th>Last Assessed</th><th></th></tr></thead>
          <tbody>
            {frameworks.map(f => (
              <tr key={f.id}>
                <td>{f.name}</td>
                <td><span className={`ds-badge ${f.enabled ? 'success' : 'neutral'}`}>{f.enabled ? 'Enabled' : 'Disabled'}</span></td>
                <td>
                  {f.enabled ? (
                    <div className="admin-mini-progress">
                      <div className="admin-mini-progress__track"><div className="admin-mini-progress__fill" style={{ width: `${f.coverage}%` }} /></div>
                      <span>{f.coverage}%</span>
                    </div>
                  ) : '—'}
                </td>
                <td>{f.assessed}</td>
                <td className="admin-row-actions">
                  {f.enabled && (
                    <button className="ds-btn sz-sm t-outline" onClick={() => onNav?.('report/compliance')}>View Report</button>
                  )}
                  <button className={`ds-btn sz-sm ${f.enabled ? 't-outline' : 't-primary'}`} onClick={() => toggle(f.id)}>
                    {f.enabled ? 'Disable' : 'Enable'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ── Data Retention ──────────────────────────────────────────────── */
export function DataRetentionSection() {
  const [retention, setRetention] = useState({
    findings: '3 years',
    auditLog: '1 year',
    scanHistory: '1 year',
    deletedAssets: '90 days',
  });
  const [saved, setSaved] = useState(false);
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 1500); };

  const ROWS = [
    { key: 'findings',      label: 'Findings',              desc: 'How long resolved findings remain queryable.',        options: ['90 days', '1 year', '3 years', 'Indefinite'] },
    { key: 'auditLog',      label: 'Audit log',              desc: 'How long security-relevant events are retained.',    options: ['90 days', '1 year', '3 years', 'Indefinite'] },
    { key: 'scanHistory',   label: 'Scan history',           desc: 'How long historical scan snapshots are kept.',       options: ['30 days', '90 days', '1 year', 'Indefinite'] },
    { key: 'deletedAssets', label: 'Deleted asset records',  desc: 'Grace period before deleted assets are purged.',     options: ['30 days', '90 days', '1 year'] },
  ];

  return (
    <>
      <SectionHead icon={<IcArchive/>} title="Data Retention" desc="How long different types of data are kept before automatic deletion." />

      <div className="admin-card">
        {ROWS.map(r => (
          <div key={r.key} className="admin-field-row admin-field-row--bordered">
            <div>
              <div className="admin-toggle-row__label">{r.label}</div>
              <div className="admin-toggle-row__desc">{r.desc}</div>
            </div>
            <DSDropdown value={retention[r.key]} onChange={(v) => setRetention(s => ({ ...s, [r.key]: v }))} options={r.options} />
          </div>
        ))}
      </div>

      <div className="admin-save-row">
        <button className="ds-btn sz-md t-primary" onClick={save}>{saved ? 'Saved ✓' : 'Save changes'}</button>
      </div>
    </>
  );
}
