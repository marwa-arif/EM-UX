import React, { useState } from 'react'
import { ENVIRONMENTS } from './mockEnvironments.js'
import { computeConfidence } from './stalenessConfig.js'
import { slug, unknownObserved } from './utils.js'
import { USER_FULL_NAME } from '../../currentUser.js'
import '../../styles/control-plane.css'

const KINDS = ['production', 'non-production', 'poc'];
const DEPLOYMENT_MODELS = ['prevalent-hosted', 'hybrid-hosted', 'client-hosted'];
const CLOUD_PROVIDERS = ['aws', 'azure', 'gcp'];

function manualObserved(value, deploymentModel) {
  const collectedAt = new Date().toISOString();
  return { value, source: 'manual', collectedAt, collectedBy: USER_FULL_NAME, confidence: computeConfidence({ value, source: 'manual', collectedAt }, deploymentModel) };
}

// This creates a directory record, never an actual environment — nothing
// here deploys, provisions, or reconfigures anything. See the brief's
// critical distinction: "update environment record," never "update
// environment."
export default function EnvironmentFormPage({ onNav, initialCustomerName = '' }) {
  const [form, setForm] = useState({
    customerName: initialCustomerName, name: '', kind: 'production', deploymentModel: 'client-hosted',
    cloudProvider: 'aws', region: '', devops: '', support: '',
    platformRelease: '', buildChannel: 'stable',
  });

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));
  const canSave = form.customerName.trim() && form.name.trim() && form.region.trim();

  const save = () => {
    const versionsValue = form.platformRelease.trim() || form.buildChannel !== 'stable'
      ? { platformRelease: form.platformRelease.trim() || null, buildChannel: form.buildChannel, components: [] }
      : null;

    const newEnv = {
      id: `env-manual-${Date.now()}`,
      displayName: `${form.customerName.trim()} — ${form.name.trim()}`,
      customer: { id: slug(form.customerName.trim()), name: form.customerName.trim() },
      kind: form.kind,
      deploymentModel: form.deploymentModel,
      cloudProvider: form.cloudProvider,
      region: form.region.trim(),
      assignedTo: {
        devops: form.devops.split(',').map(s => s.trim()).filter(Boolean),
        support: form.support.split(',').map(s => s.trim()).filter(Boolean),
      },
      createdAt: new Date().toISOString(),
      lastContact: null,
      lastSuccessfulCollection: null,
      topology: unknownObserved(),
      versions: versionsValue ? manualObserved(versionsValue, form.deploymentModel) : unknownObserved(),
      configuration: unknownObserved(),
    };

    ENVIRONMENTS.push(newEnv);
    onNav(`control-plane/environments/${newEnv.id}`);
  };

  return (
    <div className="cp-page cp-form-page">
      <button className="cp-back-link" onClick={() => onNav('control-plane/environments')}>&larr; Environment Directory</button>
      <h1 className="cp-detail__title">Add environment record</h1>
      <div className="ds-text-caption cp-form-page__hint">
        This adds a record to the directory — it does not create, modify, or connect to an actual environment.
        Sections you leave blank stay marked Unknown until a collector reports them or someone fills them in later; that's normal for a new record.
      </div>

      <div className="cp-form-page__grid">
        <label className="cp-form-field">
          <span>Customer</span>
          <input value={form.customerName} onChange={set('customerName')} placeholder="e.g. Meridian Health" />
        </label>
        <label className="cp-form-field">
          <span>Environment name</span>
          <input value={form.name} onChange={set('name')} placeholder="e.g. Production (US)" />
        </label>
        <label className="cp-form-field">
          <span>Kind</span>
          <select value={form.kind} onChange={set('kind')}>{KINDS.map(k => <option key={k} value={k}>{k}</option>)}</select>
        </label>
        <label className="cp-form-field">
          <span>Deployment model</span>
          <select value={form.deploymentModel} onChange={set('deploymentModel')}>{DEPLOYMENT_MODELS.map(m => <option key={m} value={m}>{m}</option>)}</select>
        </label>
        <label className="cp-form-field">
          <span>Cloud provider</span>
          <select value={form.cloudProvider} onChange={set('cloudProvider')}>{CLOUD_PROVIDERS.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}</select>
        </label>
        <label className="cp-form-field">
          <span>Region</span>
          <input value={form.region} onChange={set('region')} placeholder="e.g. us-east-1" />
        </label>
        <label className="cp-form-field">
          <span>Assigned DevOps (comma-separated)</span>
          <input value={form.devops} onChange={set('devops')} />
        </label>
        <label className="cp-form-field">
          <span>Assigned Support (comma-separated)</span>
          <input value={form.support} onChange={set('support')} />
        </label>
        <label className="cp-form-field">
          <span>Platform release (optional — leave blank if unmapped)</span>
          <input value={form.platformRelease} onChange={set('platformRelease')} placeholder="e.g. 2026.3" />
        </label>
        <label className="cp-form-field">
          <span>Build channel</span>
          <select value={form.buildChannel} onChange={set('buildChannel')}>
            <option value="stable">stable</option>
            <option value="non-release">non-release</option>
            <option value="beta">beta</option>
          </select>
        </label>
      </div>

      <div className="cp-form-page__actions">
        <button className="ds-btn sz-md t-outline" onClick={() => onNav('control-plane/environments')}>Cancel</button>
        <button className="ds-btn sz-md t-primary" disabled={!canSave} onClick={save}>Save environment record</button>
      </div>
    </div>
  );
}
