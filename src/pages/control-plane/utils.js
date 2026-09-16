// Shared helpers used by both the mock data seed (mockEnvironments.js) and
// the manual-entry form (EnvironmentFormPage.jsx) — kept in one place so the
// two don't drift into producing differently-shaped ids/records.

export const slug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export const unknownObserved = () => ({ value: null, source: 'agent-reported', collectedAt: null, confidence: 'unknown' });
