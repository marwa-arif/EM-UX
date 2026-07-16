import React, { useState } from 'react'
import DSDropdown from '../../components/DSDropdown.jsx'
import { DSPillSearch } from '../../context/WorkspaceCtx.jsx'
import { IcFingerprint, IcKey, SectionHead, ToggleRow, RowMenu, MaskedSecret, FormModal } from './shared.jsx'

/* ── Single Sign-On ──────────────────────────────────────────────── */
export function SSOSection() {
  const [enabled, setEnabled] = useState(true);
  const [protocol, setProtocol] = useState('SAML 2.0');
  const [idp, setIdp] = useState('Okta');
  const [ssoUrl, setSsoUrl] = useState('https://prevalent.okta.com/app/sso/saml');
  const [entityId, setEntityId] = useState('urn:prevalent-ai:sp');
  const [enforceSSO, setEnforceSSO] = useState(false);
  const [scimEnabled, setScimEnabled] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saved, setSaved] = useState(false);
  const scimToken = 'scim_9f8a7b6c5d4e3f2g1h0i9j8k7l6m5n4o';

  const testConnection = () => {
    setTesting(true); setTestResult(null);
    setTimeout(() => { setTesting(false); setTestResult('success'); }, 900);
  };
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 1500); };

  return (
    <>
      <SectionHead icon={<IcFingerprint/>} title="Single Sign-On" desc="Configure SAML/OIDC authentication and SCIM provisioning." />

      <div className="admin-card">
        <ToggleRow label="Enable SSO" desc="Allow users to sign in via your identity provider." value={enabled} onChange={setEnabled} />

        {enabled && (
          <div className="admin-form-grid">
            <div className="admin-field-col">
              <label className="admin-field-label">Protocol</label>
              <DSDropdown value={protocol} onChange={setProtocol} options={['SAML 2.0', 'OIDC']} />
            </div>
            <div className="admin-field-col">
              <label className="admin-field-label">Identity provider</label>
              <DSDropdown value={idp} onChange={setIdp} options={['Okta', 'Azure AD', 'Google Workspace', 'OneLogin', 'Custom']} />
            </div>
            <div className="admin-field-col admin-field-col--wide">
              <label className="admin-field-label">Single sign-on URL</label>
              <input className="admin-input" value={ssoUrl} onChange={e => setSsoUrl(e.target.value)} />
            </div>
            <div className="admin-field-col admin-field-col--wide">
              <label className="admin-field-label">Entity ID / Audience URI</label>
              <input className="admin-input" value={entityId} onChange={e => setEntityId(e.target.value)} />
            </div>
            <div className="admin-field-col admin-field-col--wide">
              <label className="admin-field-label">x.509 certificate</label>
              <textarea className="admin-textarea" rows={3} placeholder="-----BEGIN CERTIFICATE-----" />
            </div>
          </div>
        )}

        <ToggleRow label="Enforce SSO for all users" desc="Disable password-based sign-in once your configuration is verified." value={enforceSSO} onChange={setEnforceSSO} />
      </div>

      <div className="admin-card">
        <div className="admin-card__header">
          <div className="admin-card__title">SCIM provisioning</div>
          <div className="admin-card__subtitle">Automatically sync users and groups from your identity provider.</div>
        </div>
        <ToggleRow label="Enable SCIM" desc="Provision and deprovision users automatically." value={scimEnabled} onChange={setScimEnabled} />
        {scimEnabled && (
          <>
            <div className="admin-field-col">
              <label className="admin-field-label">SCIM base URL</label>
              <div className="admin-mono admin-static-value">https://api.prevalent.ai/scim/v2</div>
            </div>
            <div className="admin-field-col">
              <label className="admin-field-label">Bearer token</label>
              <MaskedSecret value={scimToken} />
            </div>
          </>
        )}
      </div>

      <div className="admin-save-row admin-save-row--split">
        <div className="admin-test-group">
          <button className="ds-btn sz-md t-outline" onClick={testConnection} disabled={testing}>{testing ? 'Testing…' : 'Test Connection'}</button>
          {testResult === 'success' && <span className="admin-test-result admin-test-result--ok">Connection verified</span>}
        </div>
        <button className="ds-btn sz-md t-primary" onClick={save}>{saved ? 'Saved ✓' : 'Save changes'}</button>
      </div>
    </>
  );
}

/* ── API Keys ────────────────────────────────────────────────────── */
const INITIAL_API_KEYS = [
  { id: 1, name: 'CI/CD Pipeline',       prefix: 'pai_live_4f2a9c8b1e3d7f6a2b5c9d8e1f4a7b2c', scopes: ['Read'],          created: 'Feb 2, 2024',  lastUsed: '2 hours ago' },
  { id: 2, name: 'SIEM Export',          prefix: 'pai_live_9b3e7f1a4c8d2e6f9a1b4c7d2e5f8a3b', scopes: ['Read', 'Write'], created: 'Nov 14, 2023', lastUsed: 'Yesterday'   },
  { id: 3, name: 'Legacy Integration',   prefix: 'pai_live_2c6f9a3d7e1b4c8f2a5d9e3b7c1f4a8d', scopes: ['Read'],          created: 'Aug 3, 2022',  lastUsed: '—'           },
];

function randomKeySuffix() {
  const chars = 'abcdef0123456789';
  let out = '';
  for (let i = 0; i < 32; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export function ApiKeysSection({ onConfirm }) {
  const [keys, setKeys] = useState(INITIAL_API_KEYS);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [scopes, setScopes] = useState(new Set(['Read']));
  const [revealKey, setRevealKey] = useState(null); // { name, full } shown once after creation

  const rows = keys.filter(k => !search || k.name.toLowerCase().includes(search.toLowerCase()));

  const toggleScope = (s) => setScopes(prev => {
    const next = new Set(prev);
    next.has(s) ? next.delete(s) : next.add(s);
    return next;
  });

  const createKey = () => {
    if (!name.trim() || scopes.size === 0) return;
    const full = `pai_live_${randomKeySuffix()}`;
    setKeys(prev => [...prev, { id: Date.now(), name: name.trim(), prefix: full, scopes: [...scopes], created: 'Just now', lastUsed: '—' }]);
    setRevealKey({ name: name.trim(), full });
    setName(''); setScopes(new Set(['Read'])); setShowCreate(false);
  };

  const requestRevoke = (key) => onConfirm({
    title: `Revoke "${key.name}"?`,
    body: `Any integration using this key will immediately lose API access. This action cannot be undone.`,
    confirmLabel: 'Revoke',
    onConfirm: () => setKeys(prev => prev.filter(k => k.id !== key.id)),
  });

  return (
    <>
      <SectionHead icon={<IcKey/>} title="API Keys" count={keys.length} desc="Keys for programmatic access to the Prevalent AI API." />

      <div className="admin-toolbar">
        <DSPillSearch value={search} onChange={setSearch} placeholder="Find a key by name" width={240} />
        <div className="admin-toolbar__spacer" />
        <button className="ds-btn sz-md t-primary" onClick={() => setShowCreate(true)}>Generate API Key</button>
      </div>

      <div className="ds-table-wrap">
        <table className="ds-table">
          <thead>
            <tr><th>Name</th><th>Key</th><th>Scopes</th><th>Created</th><th>Last used</th><th></th></tr>
          </thead>
          <tbody>
            {rows.map(k => (
              <tr key={k.id}>
                <td>{k.name}</td>
                <td><MaskedSecret value={k.prefix} /></td>
                <td>
                  <div className="admin-perm-badges">
                    {k.scopes.map(s => <span key={s} className="ds-badge neutral">{s}</span>)}
                  </div>
                </td>
                <td>{k.created}</td>
                <td>{k.lastUsed}</td>
                <td><RowMenu items={[{ label: 'Revoke key', danger: true, onClick: () => requestRevoke(k) }]} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <FormModal title="Generate API Key" onClose={() => setShowCreate(false)} onSubmit={createKey} submitLabel="Generate" submitDisabled={!name.trim() || scopes.size === 0}>
          <label className="admin-field-label">Key name</label>
          <input className="admin-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. SOAR Integration" />
          <label className="admin-field-label">Scopes</label>
          <div className="admin-checkbox-list">
            {['Read', 'Write', 'Admin'].map(s => (
              <label key={s} className="admin-checkbox-list__item">
                <input type="checkbox" className="admin-checkbox" checked={scopes.has(s)} onChange={() => toggleScope(s)} />
                {s}
              </label>
            ))}
          </div>
        </FormModal>
      )}

      {revealKey && (
        <div className="ds-modal-overlay">
          <div className="ds-modal" role="dialog" aria-modal="true">
            <div className="ds-modal-header">
              <span className="ds-modal-title">API key created</span>
            </div>
            <div className="ds-modal-body admin-form-body">
              <div className="admin-field-desc">Copy <strong>{revealKey.name}</strong> now — for security, you won't be able to view the full key again.</div>
              <MaskedSecret value={revealKey.full} />
            </div>
            <div className="ds-modal-footer">
              <button className="ds-btn sz-md t-primary" onClick={() => setRevealKey(null)}>Done</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
