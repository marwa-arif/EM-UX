import React, { useState } from 'react'
import { IcBuilding, IcCreditCard, ProgressBar, SectionHead } from './shared.jsx'

/* ── Organization ────────────────────────────────────────────────── */
export function OrganizationSection({ userCount, onConfirm }) {
  return (
    <>
      <SectionHead icon={<IcBuilding/>} title="Organization" />

      <div className="admin-card">
        <div className="admin-card__header">
          <div className="admin-card__title">Account details</div>
        </div>
        <div className="admin-org-grid">
          <div className="admin-org-field">
            <div className="admin-org-field__label">Organization</div>
            <div className="admin-org-field__value">Prevalent AI</div>
          </div>
          <div className="admin-org-field">
            <div className="admin-org-field__label">Plan</div>
            <div className="admin-org-field__value">Enterprise</div>
          </div>
          <div className="admin-org-field">
            <div className="admin-org-field__label">Seats</div>
            <div className="admin-org-field__value">{userCount} of 25 used</div>
          </div>
          <div className="admin-org-field">
            <div className="admin-org-field__label">Tenant ID</div>
            <div className="admin-org-field__value admin-mono">ten_7f3a9c2e91</div>
          </div>
          <div className="admin-org-field">
            <div className="admin-org-field__label">Data residency</div>
            <div className="admin-org-field__value">US-East</div>
          </div>
          <div className="admin-org-field">
            <div className="admin-org-field__label">Created</div>
            <div className="admin-org-field__value">Sep 25, 2020</div>
          </div>
        </div>
      </div>

      <div className="admin-card admin-card--danger">
        <div className="admin-card__header">
          <div className="admin-card__title">Danger Zone</div>
          <div className="admin-card__subtitle">Irreversible actions for this workspace.</div>
        </div>
        <div className="admin-danger-row">
          <div>
            <div className="admin-danger-row__title">Delete this workspace</div>
            <div className="admin-danger-row__desc">Permanently deletes all assets, findings, and user access for Prevalent AI.</div>
          </div>
          <button
            className="ds-btn sz-md t-danger"
            onClick={() => onConfirm({
              title: 'Delete "Prevalent AI"?',
              body: "Permanently deletes this workspace — all assets, findings, and access. Can't be undone.",
              confirmLabel: 'Delete Workspace',
              onConfirm: () => {},
            })}
          >
            Delete Workspace
          </button>
        </div>
      </div>
    </>
  );
}

/* ── Billing & Plan ──────────────────────────────────────────────── */
const INVOICES = [
  { id: 1, date: 'Jun 1, 2026', amount: '$18,400.00', status: 'Paid' },
  { id: 2, date: 'May 1, 2026', amount: '$18,400.00', status: 'Paid' },
  { id: 3, date: 'Apr 1, 2026', amount: '$18,400.00', status: 'Paid' },
  { id: 4, date: 'Mar 1, 2026', amount: '$16,900.00', status: 'Paid' },
];

export function BillingSection({ userCount }) {
  const [showUpdate, setShowUpdate] = useState(false);

  return (
    <>
      <SectionHead icon={<IcCreditCard/>} title="Billing & Plan" />

      <div className="admin-card">
        <div className="admin-card__header">
          <div className="admin-card__title">Current plan</div>
        </div>
        <div className="admin-org-grid">
          <div className="admin-org-field">
            <div className="admin-org-field__label">Plan</div>
            <div className="admin-org-field__value">Enterprise (Annual)</div>
          </div>
          <div className="admin-org-field">
            <div className="admin-org-field__label">Next invoice</div>
            <div className="admin-org-field__value">Jul 1, 2026 · $18,400.00</div>
          </div>
          <div className="admin-org-field">
            <div className="admin-org-field__label">Payment method</div>
            <div className="admin-org-field__value">Visa •••• 4242</div>
          </div>
        </div>
        <div className="admin-save-row">
          <button className="ds-btn sz-md t-outline" onClick={() => setShowUpdate(true)}>Update Payment Method</button>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card__header">
          <div className="admin-card__title">Usage</div>
        </div>
        <ProgressBar label="Seats" used={userCount} total={25} />
        <ProgressBar label="Assets monitored" used={98442} total={150000} />
        <ProgressBar label="API calls this month" used={412000} total={1000000} />
      </div>

      <div className="admin-card">
        <div className="admin-card__header">
          <div className="admin-card__title">Invoice history</div>
        </div>
        <div className="ds-table-wrap">
          <table className="ds-table">
            <thead><tr><th>Date</th><th>Amount</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {INVOICES.map(inv => (
                <tr key={inv.id}>
                  <td>{inv.date}</td>
                  <td>{inv.amount}</td>
                  <td><span className="ds-badge success">{inv.status}</span></td>
                  <td className="admin-row-actions">
                    <button className="ds-btn sz-sm t-outline">Download</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showUpdate && (
        <div className="ds-modal-overlay">
          <div className="ds-modal" role="dialog" aria-modal="true">
            <div className="ds-modal-header">
              <span className="ds-modal-title">Update Payment Method</span>
              <button className="ds-modal-close" onClick={() => setShowUpdate(false)} aria-label="Close">×</button>
            </div>
            <div className="ds-modal-body admin-form-body">
              <label className="admin-field-label">Card number</label>
              <input className="admin-input" placeholder="4242 4242 4242 4242" />
              <div className="admin-form-grid">
                <div className="admin-field-col"><label className="admin-field-label">Expiry</label><input className="admin-input" placeholder="MM / YY" /></div>
                <div className="admin-field-col"><label className="admin-field-label">CVC</label><input className="admin-input" placeholder="123" /></div>
              </div>
            </div>
            <div className="ds-modal-footer">
              <button className="ds-btn sz-md t-outline" onClick={() => setShowUpdate(false)}>Cancel</button>
              <button className="ds-btn sz-md t-primary" onClick={() => setShowUpdate(false)}>Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
