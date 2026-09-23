import React, { useState } from 'react'
import { ENVIRONMENTS } from './mockEnvironments.js'
import { DEPLOYMENT_MODEL_LABEL, formatAge, computeConfidence } from './stalenessConfig.js'
import { ProvenanceHeader, FormModal } from './shared.jsx'
import { USER_FULL_NAME } from '../../currentUser.js'
import '../../styles/control-plane.css'

const KIND_LABEL = { production: 'Production', 'non-production': 'Non-Production', poc: 'POC' };
const CHANNELS = ['stable', 'non-release', 'beta'];
const DRIFT_LABEL = {
  'matches-baseline': 'Matches baseline',
  'differs-from-baseline': 'Differs from baseline',
  'no-baseline': 'No baseline available for comparison',
};

// Records a manual correction to one Observed<T> section — never touches the
// live environment, only this record. Clears any prior conflict: an
// explicit edit is the person acknowledging/resolving it, not a new one.
function manualEdit(value, deploymentModel) {
  const collectedAt = new Date().toISOString();
  return {
    value, source: 'manual', collectedAt, collectedBy: USER_FULL_NAME,
    confidence: computeConfidence({ value, source: 'manual', collectedAt }, deploymentModel),
  };
}

function NetworkGrid({ network }) {
  const rows = [
    ['VPC CIDR', network.vpcCidr], ['Load balancer endpoint', network.loadBalancerEndpoint],
    ['DNS hostname', network.dnsHostname], ['TLS cert expiry', network.tlsCertExpiry],
    ['Egress path', network.egressPath],
  ];
  return (
    <div className="cp-grid">
      {rows.map(([k, v]) => (
        <div key={k} className="cp-grid-cell">
          <div className="cp-grid-key">{k}</div>
          <div className="cp-grid-val">{v ?? <span className="cp-muted">—</span>}</div>
        </div>
      ))}
    </div>
  );
}

function DriftState({ driftState }) {
  if (driftState === 'no-baseline') return <span className="ds-badge neutral cp-badge--no-baseline">No baseline available for comparison</span>;
  if (driftState === 'differs-from-baseline') return <span className="ds-badge neutral cp-badge--drift">Differs from baseline</span>;
  return <span className="ds-badge neutral cp-badge--verified">Matches baseline</span>;
}

export default function EnvironmentDetailPage({ id, onNav }) {
  const initial = ENVIRONMENTS.find(e => e.id === id);
  const [env, setEnv] = useState(initial);
  const [editSection, setEditSection] = useState(null); // 'topology' | 'versions' | 'configuration'
  const [draft, setDraft] = useState(null);

  if (!env) {
    return (
      <div className="cp-empty-section">
        <div className="cp-empty-section__icon">📋</div>
        <div className="cp-empty-section__title">Environment record not found</div>
        <div className="cp-empty-section__desc">It may have been removed, or the link is out of date.</div>
        <button className="ds-btn sz-md t-outline" onClick={() => onNav('control-plane/environments')}>Back to directory</button>
      </div>
    );
  }

  const openEdit = (section) => {
    setEditSection(section);
    if (section === 'topology') setDraft({ ...env.topology.value?.network });
    if (section === 'versions') setDraft({ platformRelease: env.versions.value?.platformRelease || '', buildChannel: env.versions.value?.buildChannel || 'stable' });
    if (section === 'configuration') setDraft({
      idpType: env.configuration.value?.identityProvider?.type || '',
      dataRetentionDays: env.configuration.value?.dataRetentionDays ?? '',
      driftState: env.configuration.value?.terraform?.driftState || 'no-baseline',
    });
  };
  const closeEdit = () => { setEditSection(null); setDraft(null); };

  const saveEdit = () => {
    setEnv(prev => {
      if (editSection === 'topology') {
        const value = { components: prev.topology.value?.components || [], network: { ...prev.topology.value?.network, ...draft } };
        return { ...prev, topology: manualEdit(value, prev.deploymentModel) };
      }
      if (editSection === 'versions') {
        const value = { ...prev.versions.value, platformRelease: draft.platformRelease || null, buildChannel: draft.buildChannel };
        return { ...prev, versions: manualEdit(value, prev.deploymentModel) };
      }
      if (editSection === 'configuration') {
        const value = {
          ...prev.configuration.value,
          identityProvider: { ...prev.configuration.value?.identityProvider, type: draft.idpType || null },
          dataRetentionDays: draft.dataRetentionDays === '' ? null : Number(draft.dataRetentionDays),
          terraform: { ...prev.configuration.value?.terraform, driftState: draft.driftState },
        };
        return { ...prev, configuration: manualEdit(value, prev.deploymentModel) };
      }
      return prev;
    });
    closeEdit();
  };

  return (
    <div className="cp-page cp-detail">
      <div className="cp-detail__header">
        <button className="cp-back-link" onClick={() => onNav('control-plane/environments')}>&larr; Environment Directory</button>
        <h1 className="cp-detail__title">{env.displayName}</h1>
        <div className="cp-detail__subtitle">
          {KIND_LABEL[env.kind]} · {DEPLOYMENT_MODEL_LABEL[env.deploymentModel]} · {env.cloudProvider.toUpperCase()} · {env.region}
        </div>
      </div>

      {/* Identity — structural record fields, not collected data, so no
          confidence badge. lastContact and lastSuccessfulCollection are
          shown separately per the brief: an environment can reach us
          without sending anything useful, and that's a different problem
          than going quiet entirely. */}
      <section className="cp-section">
        <div className="cp-section-header__top"><span className="cp-section-header__title">Identity</span></div>
        <div className="cp-grid">
          <div className="cp-grid-cell"><div className="cp-grid-key">Customer</div><div className="cp-grid-val">{env.customer.name}</div></div>
          <div className="cp-grid-cell"><div className="cp-grid-key">Record created</div><div className="cp-grid-val">{formatAge(env.createdAt)}</div></div>
          <div className="cp-grid-cell"><div className="cp-grid-key">Last contact</div><div className="cp-grid-val">{env.lastContact ? formatAge(env.lastContact) : <span className="cp-muted">Never</span>}</div></div>
          <div className="cp-grid-cell"><div className="cp-grid-key">Last successful collection</div><div className="cp-grid-val">{env.lastSuccessfulCollection ? formatAge(env.lastSuccessfulCollection) : <span className="cp-muted">Never</span>}</div></div>
          <div className="cp-grid-cell"><div className="cp-grid-key">Assigned DevOps</div><div className="cp-grid-val">{env.assignedTo.devops.join(', ') || <span className="cp-muted">Unassigned</span>}</div></div>
          <div className="cp-grid-cell"><div className="cp-grid-key">Assigned Support</div><div className="cp-grid-val">{env.assignedTo.support.join(', ') || <span className="cp-muted">Unassigned</span>}</div></div>
        </div>
      </section>

      {/* Topology */}
      <section className="cp-section">
        <ProvenanceHeader title="Topology" observed={env.topology} deploymentModel={env.deploymentModel} />
        {env.topology.confidence !== 'unknown' && env.topology.value && (
          <>
            <div className="ds-table-wrap">
              <table className="ds-table">
                <thead><tr><th>Component</th><th>Role</th><th>Replicas</th><th>Instance size</th></tr></thead>
                <tbody>
                  {env.topology.value.components.map(c => (
                    <tr key={c.name}><td>{c.name}</td><td>{c.role}</td><td>{c.replicas ?? '—'}</td><td>{c.instanceSize || '—'}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <NetworkGrid network={env.topology.value.network} />
            <button className="ds-btn sz-sm t-outline cp-section__edit" onClick={() => openEdit('topology')}>Edit network record</button>
          </>
        )}
      </section>

      {/* Versions */}
      <section className="cp-section">
        <ProvenanceHeader title="Versions" observed={env.versions} deploymentModel={env.deploymentModel} />
        {env.versions.value && (
          <>
            <div className="cp-grid">
              <div className="cp-grid-cell"><div className="cp-grid-key">Platform release</div><div className="cp-grid-val">{env.versions.value.platformRelease || <span className="cp-muted">Unmapped to a named release</span>}</div></div>
              <div className="cp-grid-cell"><div className="cp-grid-key">Build channel</div><div className="cp-grid-val">{env.versions.value.buildChannel !== 'stable' ? <span className="ds-badge caution">{env.versions.value.buildChannel}</span> : 'stable'}</div></div>
            </div>
            <div className="ds-table-wrap">
              <table className="ds-table">
                <thead><tr><th>Component</th><th>Version</th></tr></thead>
                <tbody>
                  {env.versions.value.components.map(c => (
                    <tr key={c.name}><td>{c.name}</td><td>{c.version}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button className="ds-btn sz-sm t-outline cp-section__edit" onClick={() => openEdit('versions')}>Edit versions record</button>
          </>
        )}
      </section>

      {/* Configuration */}
      <section className="cp-section">
        <ProvenanceHeader title="Configuration" observed={env.configuration} deploymentModel={env.deploymentModel} />
        {env.configuration.confidence !== 'unknown' && env.configuration.value && (
          <>
            <div className="cp-grid">
              <div className="cp-grid-cell"><div className="cp-grid-key">Identity provider</div><div className="cp-grid-val">{env.configuration.value.identityProvider.type?.toUpperCase() || <span className="cp-muted">Not configured</span>}</div></div>
              <div className="cp-grid-cell"><div className="cp-grid-key">Data platform integrations</div><div className="cp-grid-val">{env.configuration.value.dataPlatformIntegrations.join(', ') || <span className="cp-muted">None</span>}</div></div>
              <div className="cp-grid-cell"><div className="cp-grid-key">Enabled modules</div><div className="cp-grid-val">{env.configuration.value.enabledModules.join(', ') || <span className="cp-muted">None</span>}</div></div>
              <div className="cp-grid-cell"><div className="cp-grid-key">Data retention</div><div className="cp-grid-val">{env.configuration.value.dataRetentionDays != null ? `${env.configuration.value.dataRetentionDays} days` : <span className="cp-muted">—</span>}</div></div>
              <div className="cp-grid-cell"><div className="cp-grid-key">Terraform drift</div><div className="cp-grid-val"><DriftState driftState={env.configuration.value.terraform.driftState} /></div></div>
              <div className="cp-grid-cell"><div className="cp-grid-key">Terraform version</div><div className="cp-grid-val">{env.configuration.value.terraform.version || <span className="cp-muted">—</span>}</div></div>
            </div>
            <button className="ds-btn sz-sm t-outline cp-section__edit" onClick={() => openEdit('configuration')}>Edit configuration record</button>
          </>
        )}
      </section>

      {editSection === 'topology' && draft && (
        <FormModal title="Edit network record" onClose={closeEdit} onSubmit={saveEdit} submitLabel="Save record">
          {['vpcCidr', 'loadBalancerEndpoint', 'dnsHostname', 'tlsCertExpiry', 'egressPath'].map(field => (
            <label key={field} className="cp-form-field">
              <span>{field}</span>
              <input value={draft[field] || ''} onChange={e => setDraft(d => ({ ...d, [field]: e.target.value }))} />
            </label>
          ))}
        </FormModal>
      )}
      {editSection === 'versions' && draft && (
        <FormModal title="Edit versions record" onClose={closeEdit} onSubmit={saveEdit} submitLabel="Save record">
          <label className="cp-form-field">
            <span>Platform release</span>
            <input value={draft.platformRelease} onChange={e => setDraft(d => ({ ...d, platformRelease: e.target.value }))} placeholder="e.g. 2026.3, or leave blank if unmapped" />
          </label>
          <label className="cp-form-field">
            <span>Build channel</span>
            <select value={draft.buildChannel} onChange={e => setDraft(d => ({ ...d, buildChannel: e.target.value }))}>
              {CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
        </FormModal>
      )}
      {editSection === 'configuration' && draft && (
        <FormModal title="Edit configuration record" onClose={closeEdit} onSubmit={saveEdit} submitLabel="Save record">
          <label className="cp-form-field">
            <span>Identity provider</span>
            <select value={draft.idpType} onChange={e => setDraft(d => ({ ...d, idpType: e.target.value }))}>
              <option value="">Not configured</option>
              <option value="oidc">OIDC</option>
              <option value="saml">SAML</option>
            </select>
          </label>
          <label className="cp-form-field">
            <span>Data retention (days)</span>
            <input type="number" value={draft.dataRetentionDays} onChange={e => setDraft(d => ({ ...d, dataRetentionDays: e.target.value }))} />
          </label>
          <label className="cp-form-field">
            <span>Terraform drift</span>
            <select value={draft.driftState} onChange={e => setDraft(d => ({ ...d, driftState: e.target.value }))}>
              <option value="matches-baseline">Matches baseline</option>
              <option value="differs-from-baseline">Differs from baseline</option>
              <option value="no-baseline">No baseline available for comparison</option>
            </select>
          </label>
        </FormModal>
      )}
    </div>
  );
}
