import { computeConfidence } from './stalenessConfig.js';
import { slug, unknownObserved } from './utils.js';

// ~40 environments across ~18 customers, deliberately messy — see the
// Control Plane brief's "MOCK DATA" section for the exact list of hard
// cases this has to cover. Every scenario called out there is tagged
// inline with which requirement it satisfies.

const NOW = new Date();
const hoursAgo = (h) => new Date(NOW.getTime() - h * 3600000).toISOString();
const daysAgo = (d) => hoursAgo(d * 24);

function observed(value, { source = 'agent-reported', collectedAt = null, collectedBy, deploymentModel, conflict } = {}) {
  const base = { value, source, collectedAt, confidence: computeConfidence({ value, source, collectedAt }, deploymentModel, NOW) };
  if (collectedBy) base.collectedBy = collectedBy;
  if (conflict) base.conflict = conflict;
  return base;
}

// ── Component/version pools, so environments don't all look identical ─────
const COMPONENT_POOL = {
  small: [
    { name: 'Data Fabric', role: 'ingestion', replicas: 2, instanceSize: 'm5.xlarge' },
    { name: 'NiFi', role: 'flow-orchestration', replicas: 2, instanceSize: 'm5.large' },
    { name: 'EM', role: 'application', replicas: 2, instanceSize: 'm5.large' },
  ],
  medium: [
    { name: 'Data Fabric', role: 'ingestion', replicas: 3, instanceSize: 'm5.2xlarge' },
    { name: 'NiFi', role: 'flow-orchestration', replicas: 3, instanceSize: 'm5.xlarge' },
    { name: 'PuppyGraph', role: 'graph-query', replicas: 2, instanceSize: 'r5.xlarge' },
    { name: 'EM', role: 'application', replicas: 3, instanceSize: 'm5.large' },
  ],
  large: [
    { name: 'Data Fabric', role: 'ingestion', replicas: 5, instanceSize: 'm5.4xlarge' },
    { name: 'NiFi', role: 'flow-orchestration', replicas: 4, instanceSize: 'm5.2xlarge' },
    { name: 'PuppyGraph', role: 'graph-query', replicas: 3, instanceSize: 'r5.2xlarge' },
    { name: 'EM', role: 'application', replicas: 4, instanceSize: 'm5.xlarge' },
    { name: 'Reasoning Engine', role: 'inference', replicas: 2, instanceSize: 'g5.xlarge' },
  ],
};

function networkFor(cloud, region, i) {
  const cidr = `10.${20 + i}.0.0/16`;
  return cloud === 'aws'
    ? { vpcCidr: cidr, loadBalancerEndpoint: `pai-${i}.${region}.elb.amazonaws.com`, dnsHostname: `env-${i}.prevalent.cloud`, tlsCertExpiry: daysAgo(-120), egressPath: 'nat-gateway' }
    : { vpcCidr: cidr, loadBalancerEndpoint: `pai-${i}.${region}.cloudapp.azure.com`, dnsHostname: `env-${i}.prevalent.cloud`, tlsCertExpiry: daysAgo(-90), egressPath: 'firewall-egress' };
}

function versionsFor(release, channel, size) {
  const table = {
    small:  [{ name: 'Data Fabric', version: '4.2.1' }, { name: 'NiFi', version: '1.24.0' }, { name: 'EM', version: '3.8.0' }],
    medium: [{ name: 'Data Fabric', version: '4.3.0' }, { name: 'NiFi', version: '1.25.0' }, { name: 'PuppyGraph', version: '0.63.0' }, { name: 'EM', version: '3.9.2' }],
    large:  [{ name: 'Data Fabric', version: '4.3.2' }, { name: 'NiFi', version: '1.25.0' }, { name: 'PuppyGraph', version: '0.64.1' }, { name: 'EM', version: '3.9.2' }, { name: 'Reasoning Engine', version: '0.11.0' }],
  };
  return { platformRelease: release, buildChannel: channel, components: table[size] };
}

function configFor({ idp = 'oidc', integrations = ['native'], modules = ['Exposure Management'], retention = 365, driftState = 'matches-baseline', baselineAvailable = true, tfVersion = '1.7.4' }) {
  return {
    identityProvider: { type: idp, tenantId: idp ? `ten_${Math.random().toString(36).slice(2, 10)}` : null },
    dataPlatformIntegrations: integrations,
    enabledModules: modules,
    dataRetentionDays: retention,
    terraform: { baselineAvailable, version: baselineAvailable ? tfVersion : null, driftState },
    additional: {},
  };
}

let seq = 0;
function makeEnv({
  customer, name, kind, deploymentModel, cloudProvider, region,
  devops = [], support = [],
  size = 'medium', release = '2026.3', channel = 'stable',
  driftState = 'matches-baseline', baselineAvailable = true,
  createdDaysAgo = 400,
  lastContactHoursAgo, lastCollectionHoursAgo,
  // A manual entry's collectedAt is when the person typed it in, not when
  // the (possibly nonexistent) collector last checked in — independent of
  // lastCollectionHoursAgo above.
  manualEntryDaysAgo = 5,
  topologySource, topologyCollectedBy,
  versionsSource, versionsCollectedBy, versionsConflict,
  configSource, configCollectedBy,
  topologyUnknown = false, configUnknown = false, versionsUnknown = false,
}) {
  seq += 1;
  const i = seq;
  const lastContact = lastContactHoursAgo == null ? null : hoursAgo(lastContactHoursAgo);
  const lastSuccessfulCollection = lastCollectionHoursAgo == null ? null : hoursAgo(lastCollectionHoursAgo);

  const collectedAtFor = (source) =>
    source === 'manual' ? daysAgo(manualEntryDaysAgo) : (lastCollectionHoursAgo != null ? hoursAgo(lastCollectionHoursAgo) : null);

  const topology = topologyUnknown
    ? unknownObserved()
    : observed(
        { components: COMPONENT_POOL[size], network: networkFor(cloudProvider, region, i) },
        { source: topologySource ?? 'agent-reported', collectedAt: collectedAtFor(topologySource ?? 'agent-reported'), collectedBy: topologyCollectedBy, deploymentModel }
      );

  const versions = versionsUnknown
    ? unknownObserved()
    : observed(
        versionsFor(release, channel, size),
        { source: versionsSource ?? 'agent-reported', collectedAt: collectedAtFor(versionsSource ?? 'agent-reported'), collectedBy: versionsCollectedBy, deploymentModel, conflict: versionsConflict }
      );

  const configuration = configUnknown
    ? unknownObserved()
    : observed(
        configFor({ driftState, baselineAvailable }),
        { source: configSource ?? 'agent-reported', collectedAt: collectedAtFor(configSource ?? 'agent-reported'), collectedBy: configCollectedBy, deploymentModel }
      );

  return {
    id: `env-${String(i).padStart(3, '0')}`,
    displayName: `${customer} — ${name}`,
    customer: { id: slug(customer), name: customer },
    kind, deploymentModel, cloudProvider, region,
    assignedTo: { devops, support },
    createdAt: daysAgo(createdDaysAgo),
    lastContact, lastSuccessfulCollection,
    topology, versions, configuration,
  };
}

const AWS_REGIONS = ['us-east-1', 'us-west-2', 'eu-west-1', 'eu-central-1', 'ap-southeast-2'];
const AZ_REGIONS = ['eastus', 'westeurope', 'uksouth'];

export const ENVIRONMENTS = [
  // ── Meridian Health — client-hosted pair, one stale (client-hosted stale
  // threshold: >72h), plus an extra staging env ──────────────────────────
  makeEnv({ customer: 'Meridian Health', name: 'Production (US)', kind: 'production', deploymentModel: 'client-hosted', cloudProvider: 'aws', region: 'us-east-1', devops: ['R. Alaoui'], support: ['J. Ng'], size: 'large', release: '2026.3', lastContactHoursAgo: 90, lastCollectionHoursAgo: 90 }),
  makeEnv({ customer: 'Meridian Health', name: 'Non-Production', kind: 'non-production', deploymentModel: 'client-hosted', cloudProvider: 'aws', region: 'us-east-1', devops: ['R. Alaoui'], support: ['J. Ng'], size: 'small', release: '2026.3', lastContactHoursAgo: 100, lastCollectionHoursAgo: 100 /* stale: >72h — REQ: stale, client-hosted */ }),
  makeEnv({ customer: 'Meridian Health', name: 'Staging', kind: 'non-production', deploymentModel: 'client-hosted', cloudProvider: 'aws', region: 'us-east-1', devops: ['R. Alaoui'], support: ['J. Ng'], size: 'small', release: null, channel: 'non-release', lastContactHoursAgo: 12, lastCollectionHoursAgo: 12 /* REQ: non-release build */ }),

  // ── Alderbrook Financial — hybrid pair, one stale (>24h) ───────────────
  makeEnv({ customer: 'Alderbrook Financial', name: 'Production (EU)', kind: 'production', deploymentModel: 'hybrid-hosted', cloudProvider: 'azure', region: 'westeurope', devops: ['T. Björk'], support: ['M. Osei'], size: 'large', release: '2026.3', lastContactHoursAgo: 3, lastCollectionHoursAgo: 3 }),
  makeEnv({ customer: 'Alderbrook Financial', name: 'Non-Production', kind: 'non-production', deploymentModel: 'hybrid-hosted', cloudProvider: 'azure', region: 'westeurope', devops: ['T. Björk'], support: ['M. Osei'], size: 'small', release: '2026.2', lastContactHoursAgo: 30, lastCollectionHoursAgo: 30 /* stale: >24h — REQ: stale, hybrid-hosted */ }),

  // ── Nimbus Retail Co. — client-hosted pair, no-baseline drift on prod ──
  makeEnv({ customer: 'Nimbus Retail Co.', name: 'Production', kind: 'production', deploymentModel: 'client-hosted', cloudProvider: 'aws', region: 'us-west-2', devops: ['D. Kowalski'], support: ['J. Ng'], size: 'medium', release: '2026.3', driftState: 'no-baseline', baselineAvailable: false, lastContactHoursAgo: 8, lastCollectionHoursAgo: 8 /* REQ: no-baseline */ }),
  makeEnv({ customer: 'Nimbus Retail Co.', name: 'Non-Production', kind: 'non-production', deploymentModel: 'client-hosted', cloudProvider: 'aws', region: 'us-west-2', devops: ['D. Kowalski'], support: ['J. Ng'], size: 'small', release: '2026.3', driftState: 'no-baseline', baselineAvailable: false, lastContactHoursAgo: 15, lastCollectionHoursAgo: 15 /* REQ: no-baseline */ }),

  // ── Cascade Logistics — prevalent-hosted pair, one stale (>6h) ─────────
  makeEnv({ customer: 'Cascade Logistics', name: 'Production', kind: 'production', deploymentModel: 'prevalent-hosted', cloudProvider: 'aws', region: 'us-east-1', devops: ['R. Alaoui'], support: ['M. Osei'], size: 'medium', release: '2026.3', lastContactHoursAgo: 0.5, lastCollectionHoursAgo: 0.5 }),
  makeEnv({ customer: 'Cascade Logistics', name: 'Non-Production', kind: 'non-production', deploymentModel: 'prevalent-hosted', cloudProvider: 'aws', region: 'us-east-1', devops: ['R. Alaoui'], support: ['M. Osei'], size: 'small', release: '2026.3', lastContactHoursAgo: 9, lastCollectionHoursAgo: 9 /* stale: >6h — REQ: stale, prevalent-hosted */ }),

  // ── Foundry Insurance Group — client-hosted pair ───────────────────────
  makeEnv({ customer: 'Foundry Insurance Group', name: 'Production', kind: 'production', deploymentModel: 'client-hosted', cloudProvider: 'azure', region: 'eastus', devops: ['D. Kowalski'], support: ['J. Ng'], size: 'medium', release: '2026.2', lastContactHoursAgo: 20, lastCollectionHoursAgo: 20 }),
  makeEnv({ customer: 'Foundry Insurance Group', name: 'Non-Production', kind: 'non-production', deploymentModel: 'client-hosted', cloudProvider: 'azure', region: 'eastus', devops: ['D. Kowalski'], support: ['J. Ng'], size: 'small', release: '2026.2', lastContactHoursAgo: 22, lastCollectionHoursAgo: 22 }),

  // ── Brightline Telecom — client-hosted pair, contact-vs-collection
  // divergence on prod (collector reached us, sent nothing useful) ───────
  makeEnv({ customer: 'Brightline Telecom', name: 'Production', kind: 'production', deploymentModel: 'client-hosted', cloudProvider: 'aws', region: 'eu-west-1', devops: ['T. Björk'], support: ['M. Osei'], size: 'large', release: '2026.3', lastContactHoursAgo: 1, lastCollectionHoursAgo: 130 /* REQ: lastContact recent, lastSuccessfulCollection old */ }),
  makeEnv({ customer: 'Brightline Telecom', name: 'Non-Production', kind: 'non-production', deploymentModel: 'client-hosted', cloudProvider: 'aws', region: 'eu-west-1', devops: ['T. Björk'], support: ['M. Osei'], size: 'small', release: '2026.3', lastContactHoursAgo: 6, lastCollectionHoursAgo: 6 }),

  // ── Solstice Manufacturing — client-hosted pair, beta build on non-prod ─
  makeEnv({ customer: 'Solstice Manufacturing', name: 'Production', kind: 'production', deploymentModel: 'client-hosted', cloudProvider: 'azure', region: 'westeurope', devops: ['D. Kowalski'], support: ['J. Ng'], size: 'medium', release: '2026.3', lastContactHoursAgo: 14, lastCollectionHoursAgo: 14 }),
  makeEnv({ customer: 'Solstice Manufacturing', name: 'Non-Production', kind: 'non-production', deploymentModel: 'client-hosted', cloudProvider: 'azure', region: 'westeurope', devops: ['D. Kowalski'], support: ['J. Ng'], size: 'small', release: null, channel: 'beta', lastContactHoursAgo: 2, lastCollectionHoursAgo: 2 /* REQ: beta build */ }),

  // ── Harborview Bank — hybrid pair + extra DR env, contact-vs-collection
  // divergence on the DR env too (second instance of that scenario) ──────
  makeEnv({ customer: 'Harborview Bank', name: 'Production', kind: 'production', deploymentModel: 'hybrid-hosted', cloudProvider: 'aws', region: 'us-east-1', devops: ['R. Alaoui'], support: ['J. Ng'], size: 'large', release: '2026.3', lastContactHoursAgo: 4, lastCollectionHoursAgo: 4 }),
  makeEnv({ customer: 'Harborview Bank', name: 'Non-Production', kind: 'non-production', deploymentModel: 'hybrid-hosted', cloudProvider: 'aws', region: 'us-east-1', devops: ['R. Alaoui'], support: ['J. Ng'], size: 'small', release: '2026.3', lastContactHoursAgo: 5, lastCollectionHoursAgo: 5 }),
  makeEnv({ customer: 'Harborview Bank', name: 'Disaster Recovery', kind: 'non-production', deploymentModel: 'hybrid-hosted', cloudProvider: 'aws', region: 'us-west-2', devops: ['R. Alaoui'], support: ['J. Ng'], size: 'small', release: '2026.2', lastContactHoursAgo: 2, lastCollectionHoursAgo: 60 /* REQ: lastContact recent, lastSuccessfulCollection old (2nd instance) */ }),

  // ── Kestrel Energy — client-hosted pair, no-baseline on both ───────────
  makeEnv({ customer: 'Kestrel Energy', name: 'Production', kind: 'production', deploymentModel: 'client-hosted', cloudProvider: 'azure', region: 'uksouth', devops: ['T. Björk'], support: ['M. Osei'], size: 'medium', release: '2026.2', driftState: 'no-baseline', baselineAvailable: false, lastContactHoursAgo: 18, lastCollectionHoursAgo: 18 /* REQ: no-baseline */ }),
  makeEnv({ customer: 'Kestrel Energy', name: 'Non-Production', kind: 'non-production', deploymentModel: 'client-hosted', cloudProvider: 'azure', region: 'uksouth', devops: ['T. Björk'], support: ['M. Osei'], size: 'small', release: '2026.2', driftState: 'no-baseline', baselineAvailable: false, lastContactHoursAgo: 21, lastCollectionHoursAgo: 21 /* REQ: no-baseline */ }),

  // ── Vantage Biotech — client-hosted trio (prod/non-prod/poc), topology
  // verified but configuration entirely unknown on the POC ──────────────
  makeEnv({ customer: 'Vantage Biotech', name: 'Production', kind: 'production', deploymentModel: 'client-hosted', cloudProvider: 'aws', region: 'us-east-1', devops: ['D. Kowalski'], support: ['J. Ng'], size: 'medium', release: '2026.3', lastContactHoursAgo: 10, lastCollectionHoursAgo: 10 }),
  makeEnv({ customer: 'Vantage Biotech', name: 'Non-Production', kind: 'non-production', deploymentModel: 'client-hosted', cloudProvider: 'aws', region: 'us-east-1', devops: ['D. Kowalski'], support: ['J. Ng'], size: 'small', release: '2026.3', lastContactHoursAgo: 11, lastCollectionHoursAgo: 11 }),
  makeEnv({ customer: 'Vantage Biotech', name: 'POC', kind: 'poc', deploymentModel: 'client-hosted', cloudProvider: 'aws', region: 'us-east-1', devops: ['D. Kowalski'], support: [], size: 'small', release: '2026.3', createdDaysAgo: 20, lastContactHoursAgo: 5, lastCollectionHoursAgo: 5, configUnknown: true /* REQ: topology verified, configuration entirely unknown */ }),

  // ── Northfield Utilities — hybrid pair ─────────────────────────────────
  makeEnv({ customer: 'Northfield Utilities', name: 'Production', kind: 'production', deploymentModel: 'hybrid-hosted', cloudProvider: 'azure', region: 'eastus', devops: ['R. Alaoui'], support: ['M. Osei'], size: 'medium', release: '2026.3', lastContactHoursAgo: 2, lastCollectionHoursAgo: 2 }),
  makeEnv({ customer: 'Northfield Utilities', name: 'Non-Production', kind: 'non-production', deploymentModel: 'hybrid-hosted', cloudProvider: 'azure', region: 'eastus', devops: ['R. Alaoui'], support: ['M. Osei'], size: 'small', release: '2026.3', lastContactHoursAgo: 3, lastCollectionHoursAgo: 3 }),

  // ── Copperline Media — client-hosted, POC only (single-env customer) ──
  makeEnv({ customer: 'Copperline Media', name: 'POC', kind: 'poc', deploymentModel: 'client-hosted', cloudProvider: 'aws', region: 'ap-southeast-2', devops: ['T. Björk'], support: [], size: 'small', release: '2026.3', createdDaysAgo: 40, lastContactHoursAgo: 7, lastCollectionHoursAgo: 7 }),

  // ── Anchor Point Capital — client-hosted pair, manually maintained
  // (both sections), one section (versions) later contradicted by an
  // automated read — REQ: manual entries, one conflicting ───────────────
  makeEnv({
    customer: 'Anchor Point Capital', name: 'Production', kind: 'production', deploymentModel: 'client-hosted', cloudProvider: 'aws', region: 'us-west-2',
    devops: ['D. Kowalski'], support: ['J. Ng'], size: 'medium', release: '2026.2', createdDaysAgo: 500,
    lastContactHoursAgo: 4, lastCollectionHoursAgo: 4,
    topologySource: 'manual', topologyCollectedBy: 'D. Kowalski',
    versionsSource: 'agent-reported',
    versionsConflict: { value: { platformRelease: '2026.1', buildChannel: 'stable', components: [{ name: 'Data Fabric', version: '4.1.0' }, { name: 'NiFi', version: '1.22.0' }, { name: 'PuppyGraph', version: '0.60.0' }, { name: 'EM', version: '3.7.0' }] }, source: 'manual', collectedAt: daysAgo(60), collectedBy: 'D. Kowalski' },
    configSource: 'manual', configCollectedBy: 'D. Kowalski',
  }),
  makeEnv({ customer: 'Anchor Point Capital', name: 'Non-Production', kind: 'non-production', deploymentModel: 'client-hosted', cloudProvider: 'aws', region: 'us-west-2', devops: ['D. Kowalski'], support: ['J. Ng'], size: 'small', release: '2026.2', lastContactHoursAgo: 6, lastCollectionHoursAgo: 6 }),

  // ── Trellis Healthcare — client-hosted pair, manually maintained,
  // stale manual entry (>30 days since entry — REQ: stale, manual) ──────
  makeEnv({
    customer: 'Trellis Healthcare', name: 'Production', kind: 'production', deploymentModel: 'client-hosted', cloudProvider: 'azure', region: 'westeurope',
    devops: ['T. Björk'], support: ['M. Osei'], size: 'medium', release: '2026.1', createdDaysAgo: 600,
    lastContactHoursAgo: null, lastCollectionHoursAgo: null, manualEntryDaysAgo: 45,
    topologySource: 'manual', topologyCollectedBy: 'M. Osei',
    versionsSource: 'manual', versionsCollectedBy: 'M. Osei',
    configSource: 'manual', configCollectedBy: 'M. Osei',
  }),
  makeEnv({ customer: 'Trellis Healthcare', name: 'Non-Production', kind: 'non-production', deploymentModel: 'client-hosted', cloudProvider: 'azure', region: 'westeurope', devops: ['T. Björk'], support: ['M. Osei'], size: 'small', release: '2026.1', createdDaysAgo: 600, manualEntryDaysAgo: 45, topologySource: 'manual', topologyCollectedBy: 'M. Osei', versionsSource: 'manual', versionsCollectedBy: 'M. Osei', configSource: 'manual', configCollectedBy: 'M. Osei', lastContactHoursAgo: null, lastCollectionHoursAgo: null }),

  // ── Ridgeway Logistics — client-hosted pair, one env never collected
  // at all — REQ: exists, nothing ever collected (distinct from stale) ──
  makeEnv({ customer: 'Ridgeway Logistics', name: 'Production', kind: 'production', deploymentModel: 'client-hosted', cloudProvider: 'aws', region: 'us-east-1', devops: ['R. Alaoui'], support: ['J. Ng'], size: 'medium', release: '2026.3', lastContactHoursAgo: 5, lastCollectionHoursAgo: 5 }),
  makeEnv({ customer: 'Ridgeway Logistics', name: 'Non-Production', kind: 'non-production', deploymentModel: 'client-hosted', cloudProvider: 'aws', region: 'us-east-1', devops: ['R. Alaoui'], support: ['J. Ng'], size: 'small', release: '2026.3', createdDaysAgo: 3, lastContactHoursAgo: null, lastCollectionHoursAgo: null, topologyUnknown: true, configUnknown: true, versionsUnknown: true /* REQ: never collected */ }),

  // ── Pinecrest Retail — client-hosted pair ──────────────────────────────
  makeEnv({ customer: 'Pinecrest Retail', name: 'Production', kind: 'production', deploymentModel: 'client-hosted', cloudProvider: 'azure', region: 'eastus', devops: ['D. Kowalski'], support: ['J. Ng'], size: 'medium', release: '2026.3', lastContactHoursAgo: 9, lastCollectionHoursAgo: 9 }),
  makeEnv({ customer: 'Pinecrest Retail', name: 'Non-Production', kind: 'non-production', deploymentModel: 'client-hosted', cloudProvider: 'azure', region: 'eastus', devops: ['D. Kowalski'], support: ['J. Ng'], size: 'small', release: '2026.3', lastContactHoursAgo: 10, lastCollectionHoursAgo: 10 }),

  // ── Summit Aerospace — hybrid trio (prod/non-prod/DR) ──────────────────
  makeEnv({ customer: 'Summit Aerospace', name: 'Production', kind: 'production', deploymentModel: 'hybrid-hosted', cloudProvider: 'aws', region: 'us-west-2', devops: ['T. Björk'], support: ['M. Osei'], size: 'large', release: '2026.3', lastContactHoursAgo: 1, lastCollectionHoursAgo: 1 }),
  makeEnv({ customer: 'Summit Aerospace', name: 'Non-Production', kind: 'non-production', deploymentModel: 'hybrid-hosted', cloudProvider: 'aws', region: 'us-west-2', devops: ['T. Björk'], support: ['M. Osei'], size: 'small', release: '2026.3', lastContactHoursAgo: 2, lastCollectionHoursAgo: 2 }),
  makeEnv({ customer: 'Summit Aerospace', name: 'Disaster Recovery', kind: 'non-production', deploymentModel: 'hybrid-hosted', cloudProvider: 'aws', region: 'eu-central-1', devops: ['T. Björk'], support: ['M. Osei'], size: 'small', release: '2026.2', lastContactHoursAgo: 5, lastCollectionHoursAgo: 5 }),

  // ── Lattice Cybersecurity — prevalent-hosted trio ──────────────────────
  makeEnv({ customer: 'Lattice Cybersecurity', name: 'Production', kind: 'production', deploymentModel: 'prevalent-hosted', cloudProvider: 'aws', region: 'us-east-1', devops: ['R. Alaoui'], support: ['J. Ng'], size: 'medium', release: '2026.3', lastContactHoursAgo: 0.3, lastCollectionHoursAgo: 0.3 }),
  makeEnv({ customer: 'Lattice Cybersecurity', name: 'Non-Production', kind: 'non-production', deploymentModel: 'prevalent-hosted', cloudProvider: 'aws', region: 'us-east-1', devops: ['R. Alaoui'], support: ['J. Ng'], size: 'small', release: '2026.3', lastContactHoursAgo: 0.4, lastCollectionHoursAgo: 0.4 }),
  makeEnv({ customer: 'Lattice Cybersecurity', name: 'Sandbox', kind: 'poc', deploymentModel: 'prevalent-hosted', cloudProvider: 'aws', region: 'us-east-1', devops: ['R. Alaoui'], support: [], size: 'small', release: null, channel: 'beta', createdDaysAgo: 15, lastContactHoursAgo: 1, lastCollectionHoursAgo: 1 /* REQ: beta build (2nd instance) */ }),
];

// Known to exist (e.g. a CRM/contract system Prevalent maintains separately)
// but with no Environment record at all — the gap /coverage exists to show.
export const CUSTOMERS_WITHOUT_ENVIRONMENTS = [
  { id: 'greenfield-agriculture', name: 'Greenfield Agriculture' },
  { id: 'cobalt-robotics', name: 'Cobalt Robotics' },
];

export function allKnownCustomers() {
  const fromEnvironments = new Map(ENVIRONMENTS.map((e) => [e.customer.id, e.customer]));
  for (const c of CUSTOMERS_WITHOUT_ENVIRONMENTS) fromEnvironments.set(c.id, c);
  return [...fromEnvironments.values()].sort((a, b) => a.name.localeCompare(b.name));
}
