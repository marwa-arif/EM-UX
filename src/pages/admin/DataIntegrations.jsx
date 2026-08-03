import React, { useState } from 'react'
import DSDropdown from '../../components/DSDropdown.jsx'
import { DSPillSearch } from '../../context/WorkspaceCtx.jsx'
import { IcPlug, IcTicket, IcWebhook, STATUS_BADGE, SectionHead, RowMenu, FormModal } from './shared.jsx'

/* ── Data Sources ────────────────────────────────────────────────── */
export const INITIAL_DATA_SOURCES = [
  { id: 1, name: 'AWS',                 type: 'Cloud',         status: 'Connected', lastSync: '4 minutes ago', assets: '12,382', freq: 'Hourly'    },
  { id: 2, name: 'MS Azure',            type: 'Cloud',         status: 'Connected', lastSync: '9 minutes ago', assets: '8,940',  freq: 'Hourly'    },
  { id: 3, name: 'Qualys',              type: 'Vulnerability', status: 'Connected', lastSync: '1 hour ago',    assets: '5,204',  freq: 'Daily'     },
  { id: 4, name: 'MS Active Directory', type: 'Identity',      status: 'Connected', lastSync: '2 hours ago',   assets: '71,442', freq: 'Real-time' },
  { id: 5, name: 'Wiz',                 type: 'Cloud',         status: 'Syncing',   lastSync: 'Syncing now',   assets: '3,110',  freq: 'Real-time' },
  { id: 6, name: 'MS Defender',         type: 'EDR',           status: 'Connected', lastSync: '3 hours ago',   assets: '9,873',  freq: 'Hourly'    },
  { id: 7, name: 'Okta',                type: 'Identity',      status: 'Error',     lastSync: '2 days ago',    assets: '4,021',  freq: 'Daily'     },
  { id: 8, name: 'Tenable',             type: 'Vulnerability', status: 'Connected', lastSync: '6 hours ago',   assets: '2,558',  freq: 'Daily'     },
];

export function DataSourcesSection({ onConfirm }) {
  const [sources, setSources] = useState(INITIAL_DATA_SOURCES);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('Cloud');

  const addSource = () => {
    if (!name.trim()) return;
    setSources(prev => [...prev, { id: Date.now(), name, type, status: 'Syncing', lastSync: 'Syncing now', assets: '0', freq: 'Daily' }]);
    setName(''); setType('Cloud'); setShowAdd(false);
  };

  const reconnect = (id) => setSources(prev => prev.map(s => s.id === id ? { ...s, status: 'Connected', lastSync: 'Just now' } : s));
  const setFreq = (id, freq) => setSources(prev => prev.map(s => s.id === id ? { ...s, freq } : s));

  const requestDisconnect = (s) => onConfirm({
    title: `Disconnect "${s.name}"?`,
    body: `Stops new data from ${s.name} syncing in. Previously ingested assets remain.`,
    confirmLabel: 'Disconnect',
    onConfirm: () => setSources(prev => prev.filter(x => x.id !== s.id)),
  });

  return (
    <>
      <SectionHead icon={<IcPlug/>} title="Data Sources" count={sources.length} desc="Integrations feeding asset and finding data into this workspace." />

      <div className="admin-toolbar">
        <div className="admin-toolbar__spacer" />
        <button className="ds-btn sz-md t-primary" onClick={() => setShowAdd(true)}>Add Data Source</button>
      </div>

      <div className="ds-table-wrap">
        <table className="ds-table">
          <thead>
            <tr>
              <th>Data Source</th><th>Type</th><th>Status</th><th>Last Sync</th><th>Assets</th><th>Sync Frequency</th><th></th>
            </tr>
          </thead>
          <tbody>
            {sources.map(s => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td><span className="ds-badge neutral">{s.type}</span></td>
                <td><span className={`ds-badge ${STATUS_BADGE[s.status] || 'neutral'}`}>{s.status}</span></td>
                <td>{s.lastSync}</td>
                <td>{s.assets}</td>
                <td><DSDropdown value={s.freq} onChange={(v) => setFreq(s.id, v)} options={['Real-time', 'Hourly', 'Daily', 'Weekly']} /></td>
                <td>
                  <RowMenu items={[
                    ...(s.status === 'Error' ? [{ label: 'Reconnect', onClick: () => reconnect(s.id) }] : []),
                    { label: 'Disconnect', danger: true, onClick: () => requestDisconnect(s) },
                  ]} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <FormModal title="Add Data Source" onClose={() => setShowAdd(false)} onSubmit={addSource} submitLabel="Connect" submitDisabled={!name.trim()}>
          <label className="admin-field-label">Name</label>
          <input className="admin-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. CrowdStrike" />
          <label className="admin-field-label">Type</label>
          <DSDropdown value={type} onChange={setType} options={['Cloud', 'Identity', 'EDR', 'Vulnerability']} />
        </FormModal>
      )}
    </>
  );
}

/* ── Ticketing & SOAR ────────────────────────────────────────────── */
const INITIAL_CONNECTORS = [
  { id: 'jira',       name: 'Jira',        desc: 'Create and sync remediation tickets in a Jira project.', status: 'Connected',    field: 'Project key', value: 'SEC' },
  { id: 'servicenow', name: 'ServiceNow',  desc: 'Open incidents directly from critical findings.',        status: 'Disabled', field: 'Instance URL', value: '' },
  { id: 'pagerduty',  name: 'PagerDuty',   desc: 'Page on-call responders for critical exposure alerts.',  status: 'Connected',    field: 'Escalation policy', value: 'Security On-Call' },
  { id: 'slack',       name: 'Slack',      desc: 'Post findings and scan summaries to a Slack channel.',   status: 'Connected',    field: 'Default channel', value: '#security-alerts' },
];

export function TicketingSection() {
  const [connectors, setConnectors] = useState(INITIAL_CONNECTORS);

  const setField = (id, value) => setConnectors(prev => prev.map(c => c.id === id ? { ...c, value } : c));
  const toggleConnected = (id) => setConnectors(prev => prev.map(c => c.id === id ? { ...c, status: c.status === 'Connected' ? 'Disabled' : 'Connected' } : c));

  return (
    <>
      <SectionHead icon={<IcTicket/>} title="Ticketing & SOAR" desc="Route findings into your ticketing, incident response, and paging tools." />

      {connectors.map(c => (
        <div key={c.id} className="admin-card">
          <div className="admin-connector-head">
            <div>
              <div className="admin-card__title">{c.name}</div>
              <div className="admin-card__subtitle">{c.desc}</div>
            </div>
            <span className={`ds-badge ${STATUS_BADGE[c.status] || 'neutral'}`}>{c.status}</span>
          </div>
          {c.status === 'Connected' && (
            <div className="admin-field-row">
              <label className="admin-field-label">{c.field}</label>
              <input className="admin-input admin-input--inline" value={c.value} onChange={e => setField(c.id, e.target.value)} />
            </div>
          )}
          <div className="admin-save-row">
            <button className={`ds-btn sz-sm ${c.status === 'Connected' ? 't-outline' : 't-primary'}`} onClick={() => toggleConnected(c.id)}>
              {c.status === 'Connected' ? 'Disconnect' : 'Connect'}
            </button>
          </div>
        </div>
      ))}
    </>
  );
}

/* ── Webhooks ────────────────────────────────────────────────────── */
const INITIAL_WEBHOOKS = [
  { id: 1, url: 'https://hooks.prevalent-partner.io/ingest/findings', events: ['finding.created', 'finding.updated'], status: 'Active',  lastDelivery: '3 minutes ago' },
  { id: 2, url: 'https://soc.acme-corp.com/webhooks/pai',             events: ['scan.completed'],                    status: 'Active',  lastDelivery: '1 hour ago'    },
  { id: 3, url: 'https://legacy.example.com/pai-events',              events: ['asset.discovered'],                  status: 'Failing', lastDelivery: '2 days ago'    },
];
const EVENT_OPTIONS = ['finding.created', 'finding.updated', 'asset.discovered', 'scan.completed', 'compliance.score_changed'];

export function WebhooksSection({ onConfirm }) {
  const [hooks, setHooks] = useState(INITIAL_WEBHOOKS);
  const [showAdd, setShowAdd] = useState(false);
  const [url, setUrl] = useState('');
  const [events, setEvents] = useState(new Set());

  const toggleEvent = (e) => setEvents(prev => {
    const next = new Set(prev);
    next.has(e) ? next.delete(e) : next.add(e);
    return next;
  });

  const addHook = () => {
    if (!url.trim() || events.size === 0) return;
    setHooks(prev => [...prev, { id: Date.now(), url: url.trim(), events: [...events], status: 'Active', lastDelivery: '—' }]);
    setUrl(''); setEvents(new Set()); setShowAdd(false);
  };

  const requestDelete = (h) => onConfirm({
    title: 'Delete webhook?',
    body: `Event delivery to ${h.url} stops immediately. Can't be undone.`,
    confirmLabel: 'Delete',
    onConfirm: () => setHooks(prev => prev.filter(x => x.id !== h.id)),
  });

  return (
    <>
      <SectionHead icon={<IcWebhook/>} title="Webhooks" count={hooks.length} desc="Push real-time event notifications to external endpoints." />

      <div className="admin-toolbar">
        <div className="admin-toolbar__spacer" />
        <button className="ds-btn sz-md t-primary" onClick={() => setShowAdd(true)}>Add Webhook</button>
      </div>

      <div className="ds-table-wrap">
        <table className="ds-table">
          <thead>
            <tr><th>Endpoint</th><th>Events</th><th>Status</th><th>Last Delivery</th><th></th></tr>
          </thead>
          <tbody>
            {hooks.map(h => (
              <tr key={h.id}>
                <td className="admin-mono">{h.url}</td>
                <td>
                  <div className="admin-perm-badges">
                    {h.events.map(e => <span key={e} className="ds-badge neutral">{e}</span>)}
                  </div>
                </td>
                <td><span className={`ds-badge ${STATUS_BADGE[h.status] || 'neutral'}`}>{h.status}</span></td>
                <td>{h.lastDelivery}</td>
                <td><RowMenu items={[{ label: 'Delete webhook', danger: true, onClick: () => requestDelete(h) }]} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <FormModal title="Add Webhook" onClose={() => setShowAdd(false)} onSubmit={addHook} submitLabel="Add" submitDisabled={!url.trim() || events.size === 0}>
          <label className="admin-field-label">Endpoint URL</label>
          <input className="admin-input" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com/webhook" />
          <label className="admin-field-label">Events</label>
          <div className="admin-checkbox-list">
            {EVENT_OPTIONS.map(e => (
              <label key={e} className="admin-checkbox-list__item">
                <input type="checkbox" className="admin-checkbox" checked={events.has(e)} onChange={() => toggleEvent(e)} />
                <span className="admin-mono">{e}</span>
              </label>
            ))}
          </div>
        </FormModal>
      )}
    </>
  );
}
