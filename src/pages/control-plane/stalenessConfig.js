// Per-deployment-model check-in cadence. A single universal staleness
// threshold either cries wolf on Client Hosted (checks in daily, so a 6h
// gap is normal) or hides real failures on Prevalent Hosted (checks in
// hourly, so a 6h gap already means something is wrong) — see the Control
// Plane brief. Kept here, not scattered through components.
export const STALENESS_THRESHOLDS = {
  'prevalent-hosted': { expectedCheckinHours: 1, staleAfterHours: 6 },
  'hybrid-hosted':    { expectedCheckinHours: 6, staleAfterHours: 24 },
  'client-hosted':    { expectedCheckinHours: 24, staleAfterHours: 72 },
};

// Manually maintained records have no collection cadence — this is a
// "flag for review" window, not a collection SLA.
export const MANUAL_REVIEW_AFTER_DAYS = 30;

export const DEPLOYMENT_MODEL_LABEL = {
  'prevalent-hosted': 'Prevalent Hosted',
  'hybrid-hosted': 'Hybrid Hosted',
  'client-hosted': 'Client Hosted',
};

// Confidence for one Observed<T> section. Three states only — never a
// fourth "error" state, never collapsed into color:
//   verified — collected within the expected window for this deployment model
//   stale    — last collected beyond the expected window (or, for a
//              manual value, older than the review window)
//   unknown  — never collected, or collection failed
// Manual values can compute to 'verified' here (fresh) or 'stale' (overdue
// for review), but the UI must never render the word "Verified" for a
// manual source — see ProvenanceHeader in shared.jsx. That's a display-layer
// rule, not a fourth enum value.
export function computeConfidence(observed, deploymentModel, now = new Date()) {
  if (!observed || observed.value == null || observed.collectedAt == null) return 'unknown';
  const ageHours = (now.getTime() - new Date(observed.collectedAt).getTime()) / 3600000;

  if (observed.source === 'manual') {
    return ageHours > MANUAL_REVIEW_AFTER_DAYS * 24 ? 'stale' : 'verified';
  }
  const thresholds = STALENESS_THRESHOLDS[deploymentModel];
  if (!thresholds) return 'unknown';
  return ageHours > thresholds.staleAfterHours ? 'stale' : 'verified';
}

export function formatAge(collectedAt, now = new Date()) {
  if (!collectedAt) return null;
  const ms = now.getTime() - new Date(collectedAt).getTime();
  const hours = ms / 3600000;
  if (hours < 1) return 'less than an hour ago';
  if (hours < 24) return `${Math.round(hours)}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}
