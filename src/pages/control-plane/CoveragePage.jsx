import React from 'react'
import { ENVIRONMENTS, CUSTOMERS_WITHOUT_ENVIRONMENTS, allKnownCustomers } from './mockEnvironments.js'
import { formatAge } from './stalenessConfig.js'
import '../../styles/control-plane.css'

// The success metric for this epic is 100% of active customers
// represented, verified against an independently maintained list — if that
// reconciliation only lives in a spreadsheet, coverage rots silently. This
// page is that reconciliation, made a surface instead of a spreadsheet.
export default function CoveragePage({ onNav }) {
  const known = allKnownCustomers();
  const represented = known.length - CUSTOMERS_WITHOUT_ENVIRONMENTS.length;
  const neverCollected = ENVIRONMENTS.filter(e => e.lastSuccessfulCollection === null);

  return (
    <div className="cp-page cp-coverage">
      <div className="cp-coverage__summary">
        <div className="cp-coverage__stat">
          <div className="cp-coverage__stat-value">{represented} / {known.length}</div>
          <div className="cp-coverage__stat-label">known customers represented by at least one environment record</div>
        </div>
      </div>

      <section className="cp-section">
        <div className="cp-section-header__top"><span className="cp-section-header__title">Customers with no environment record</span></div>
        <div className="ds-text-caption cp-section-header__meta">What's missing — no other screen in this directory shows this.</div>
        {CUSTOMERS_WITHOUT_ENVIRONMENTS.length === 0 ? (
          <div className="cp-empty-section cp-empty-section--inline">
            <div className="cp-empty-section__title">Every known customer has at least one environment record.</div>
          </div>
        ) : (
          <div className="ds-table-wrap">
            <table className="ds-table">
              <thead><tr><th>Customer</th><th className="col-actions">Action</th></tr></thead>
              <tbody>
                {CUSTOMERS_WITHOUT_ENVIRONMENTS.map(c => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td className="col-actions">
                      <button className="ds-btn sz-sm t-outline" onClick={() => onNav('control-plane/environments/new', { customerName: c.name })}>
                        Add environment record
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="cp-section">
        <div className="cp-section-header__top"><span className="cp-section-header__title">Environments that have never successfully reported</span></div>
        <div className="ds-text-caption cp-section-header__meta">A record exists, but no collection has ever succeeded — distinct from stale, which means collection used to work.</div>
        {neverCollected.length === 0 ? (
          <div className="cp-empty-section cp-empty-section--inline">
            <div className="cp-empty-section__title">Every environment record has at least one successful collection on file.</div>
          </div>
        ) : (
          <div className="ds-table-wrap">
            <table className="ds-table">
              <thead><tr><th>Environment</th><th>Customer</th><th>Record created</th><th>Last contact</th></tr></thead>
              <tbody>
                {neverCollected.map(e => (
                  <tr key={e.id} className="cp-row" onClick={() => onNav(`control-plane/environments/${e.id}`)}>
                    <td className="cp-td-name">{e.displayName}</td>
                    <td>{e.customer.name}</td>
                    <td>{formatAge(e.createdAt)}</td>
                    <td>{e.lastContact ? formatAge(e.lastContact) : <span className="cp-muted">Never</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
