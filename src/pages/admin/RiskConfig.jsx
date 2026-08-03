import React, { useState } from 'react'
import DSDropdown from '../../components/DSDropdown.jsx'
import { IcGauge, IcBell, SectionHead, ToggleRow, RowMenu, SliderRow, FormModal } from './shared.jsx'

/* ── Risk Scoring ────────────────────────────────────────────────── */
const INITIAL_WEIGHTS = {
  Cloud: 20,
  Device: 20,
  Identity: 15,
  'Control Gap': 15,
  'Software Vulnerability': 20,
  Misconfiguration: 10,
};

export function RiskScoringSection() {
  const [weights, setWeights] = useState(INITIAL_WEIGHTS);
  const [tolerance, setTolerance] = useState('Balanced');
  const [saved, setSaved] = useState(false);

  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  const setWeight = (key, v) => setWeights(prev => ({ ...prev, [key]: v }));
  const resetDefaults = () => setWeights(INITIAL_WEIGHTS);
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 1500); };

  return (
    <>
      <SectionHead icon={<IcGauge/>} title="Risk Scoring" desc="Configure how each exposure category contributes to the overall Exposure Score." />

      <div className="admin-card">
        <div className="admin-card__header">
          <div className="admin-card__title">Category weights</div>
          <div className="admin-card__subtitle">Adjust the relative influence of each exposure category. Values are normalized to 100%.</div>
        </div>
        {Object.keys(weights).map(key => (
          <SliderRow key={key} label={key} value={weights[key]} onChange={(v) => setWeight(key, v)} />
        ))}
        <div className={`admin-weight-total${total !== 100 ? ' admin-weight-total--warn' : ''}`}>
          Total weight: {total}% {total !== 100 && '— should equal 100%'}
        </div>
        <div className="admin-save-row admin-save-row--split">
          <button className="ds-btn sz-md t-outline" onClick={resetDefaults}>Reset to Defaults</button>
          <button className="ds-btn sz-md t-primary" onClick={save}>{saved ? 'Saved ✓' : 'Save changes'}</button>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card__header">
          <div className="admin-card__title">Risk tolerance</div>
          <div className="admin-card__subtitle">Controls where High / Medium / Low severity thresholds fall on the Exposure Score.</div>
        </div>
        <div className="admin-field-row">
          <label className="admin-field-label">Tolerance profile</label>
          <DSDropdown value={tolerance} onChange={setTolerance} options={['Conservative', 'Balanced', 'Aggressive']} />
        </div>
        <div className="admin-field-desc">
          {tolerance === 'Conservative' && 'Flags issues as High/Critical earlier — fewer false negatives, more alerts.'}
          {tolerance === 'Balanced'     && 'Default thresholds recommended for most organizations.'}
          {tolerance === 'Aggressive'   && 'Only the most severe issues are flagged as High/Critical — fewer alerts.'}
        </div>
      </div>
    </>
  );
}

/* ── Notification Rules ──────────────────────────────────────────── */
const TRIGGERS = [
  'Critical finding detected',
  'New critical asset discovered',
  'Data source sync failed',
  'Compliance score drops below threshold',
  'Failed sign-in threshold exceeded',
];
const CHANNELS = ['Email', 'Slack', 'PagerDuty', 'Webhook'];

const INITIAL_RULES = [
  { id: 1, name: 'Critical findings to SOC',    trigger: 'Critical finding detected',                 channel: 'Slack',     enabled: true  },
  { id: 2, name: 'Sync failure alert',          trigger: 'Data source sync failed',                   channel: 'Email',     enabled: true  },
  { id: 3, name: 'Compliance drift page',       trigger: 'Compliance score drops below threshold',     channel: 'PagerDuty', enabled: false },
  { id: 4, name: 'Brute-force detection',       trigger: 'Failed sign-in threshold exceeded',          channel: 'Webhook',   enabled: true  },
];

export function NotificationRulesSection({ onConfirm }) {
  const [rules, setRules] = useState(INITIAL_RULES);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [trigger, setTrigger] = useState(TRIGGERS[0]);
  const [channel, setChannel] = useState(CHANNELS[0]);

  const toggleEnabled = (id) => setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));

  const createRule = () => {
    if (!name.trim()) return;
    setRules(prev => [...prev, { id: Date.now(), name: name.trim(), trigger, channel, enabled: true }]);
    setName(''); setTrigger(TRIGGERS[0]); setChannel(CHANNELS[0]); setShowCreate(false);
  };

  const requestDelete = (r) => onConfirm({
    title: `Delete "${r.name}"?`,
    body: "This rule will no longer fire. Can't be undone.",
    confirmLabel: 'Delete',
    onConfirm: () => setRules(prev => prev.filter(x => x.id !== r.id)),
  });

  return (
    <>
      <SectionHead icon={<IcBell/>} title="Notification Rules" count={rules.length} desc="Route specific exposure events to the right channel automatically." />

      <div className="admin-toolbar">
        <div className="admin-toolbar__spacer" />
        <button className="ds-btn sz-md t-primary" onClick={() => setShowCreate(true)}>Create Rule</button>
      </div>

      <div className="ds-table-wrap">
        <table className="ds-table">
          <thead><tr><th>Rule</th><th>Trigger</th><th>Channel</th><th>Enabled</th><th></th></tr></thead>
          <tbody>
            {rules.map(r => (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td>{r.trigger}</td>
                <td><span className="ds-badge neutral">{r.channel}</span></td>
                <td>
                  <button
                    type="button" role="switch" aria-checked={r.enabled}
                    className={`admin-switch admin-switch--sm${r.enabled ? ' admin-switch--on' : ''}`}
                    onClick={() => toggleEnabled(r.id)}
                  >
                    <span className="admin-switch__thumb" />
                  </button>
                </td>
                <td><RowMenu items={[{ label: 'Delete rule', danger: true, onClick: () => requestDelete(r) }]} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <FormModal title="Create Notification Rule" onClose={() => setShowCreate(false)} onSubmit={createRule} submitLabel="Create" submitDisabled={!name.trim()}>
          <label className="admin-field-label">Rule name</label>
          <input className="admin-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Ransomware indicator alert" />
          <label className="admin-field-label">Trigger</label>
          <DSDropdown value={trigger} onChange={setTrigger} options={TRIGGERS} />
          <label className="admin-field-label">Channel</label>
          <DSDropdown value={channel} onChange={setChannel} options={CHANNELS} />
        </FormModal>
      )}
    </>
  );
}
