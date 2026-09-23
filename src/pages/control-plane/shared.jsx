import React from 'react'
import { DEPLOYMENT_MODEL_LABEL, formatAge } from './stalenessConfig.js'

/* ── Form modal — copied verbatim from src/pages/admin/shared.jsx's
   FormModal (title/onClose/onSubmit/submitLabel/children shape). ── */
export function FormModal({ title, onClose, onSubmit, submitLabel = 'Save', submitDisabled = false, children }) {
  return (
    <div className="ds-modal-overlay">
      <div className="ds-modal cp-form-modal" role="dialog" aria-modal="true">
        <div className="ds-modal-header">
          <span className="ds-modal-title">{title}</span>
          <button className="ds-modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="ds-modal-body cp-form-body">{children}</div>
        <div className="ds-modal-footer">
          <button className="ds-btn sz-md t-outline" onClick={onClose}>Cancel</button>
          <button className="ds-btn sz-md t-primary" disabled={submitDisabled} onClick={onSubmit}>{submitLabel}</button>
        </div>
      </div>
    </div>
  );
}

/* ── Confidence badge — never green/amber/red (that vocabulary is reserved
   for the later health-monitoring epic). Verified/Stale read via weight and
   opacity (see control-plane.css .cp-badge--stale), not hue. A manually
   entered value NEVER renders as "Verified" — the whole point of provenance
   here is that a person's word and a collector's word are different kinds
   of evidence, even when both are current. ── */
function ConfidenceBadge({ confidence, source }) {
  if (confidence === 'unknown') return <span className="ds-badge neutral cp-badge--unknown">Unknown</span>;
  if (source === 'manual') {
    return confidence === 'stale'
      ? <span className="ds-badge neutral cp-badge--stale">Manual · flagged for review</span>
      : <span className="ds-badge neutral cp-badge--manual">Manually entered</span>;
  }
  return confidence === 'stale'
    ? <span className="ds-badge neutral cp-badge--stale">Stale</span>
    : <span className="ds-badge neutral cp-badge--verified">Verified</span>;
}

const SOURCE_LABEL = {
  'agent-reported': 'Agent-reported',
  'manual': 'Manual entry',
  'terraform-derived': 'Terraform-derived',
};

/* ── Provenance header — one per section (Topology/Versions/Configuration),
   never one timestamp for the whole record. An `unknown` section renders
   no value at all above this header (the caller's job) — this header is
   what makes that absence read as "never collected" instead of "forgot to
   render". ── */
export function ProvenanceHeader({ title, observed, deploymentModel, conflictNote }) {
  const { source, collectedAt, collectedBy, confidence, conflict } = observed;
  return (
    <div className="cp-section-header">
      <div className="cp-section-header__top">
        <span className="cp-section-header__title">{title}</span>
        <ConfidenceBadge confidence={confidence} source={source} />
      </div>
      <div className="ds-text-caption cp-section-header__meta">
        {confidence === 'unknown' ? (
          <span>Never collected, or collection failed.</span>
        ) : source === 'manual' ? (
          <span>Entered by {collectedBy || 'unknown user'} · {formatAge(collectedAt)}</span>
        ) : (
          <span>{SOURCE_LABEL[source] || source} · as of {formatAge(collectedAt)}
            {deploymentModel && <> · expected every {DEPLOYMENT_MODEL_LABEL[deploymentModel]?.toLowerCase()} cadence</>}
          </span>
        )}
      </div>
      {conflict && (
        <div className="cp-conflict-banner">
          <strong>Conflict:</strong> a manual entry from {conflict.collectedBy || 'a previous edit'} ({formatAge(conflict.collectedAt)}) disagrees with the automated reading shown below.
          {conflictNote}
        </div>
      )}
    </div>
  );
}

/* ── Small inline icons — this codebase has no icon library; every area
   hand-writes its own tiny SVGs (see admin/shared.jsx's IcUsers etc.). ── */
export const IcServer = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="8" rx="1"/><rect x="2" y="13" width="20" height="8" rx="1"/>
    <line x1="6" y1="7" x2="6" y2="7"/><line x1="6" y1="17" x2="6" y2="17"/>
  </svg>
);
export const IcCheckShield = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
