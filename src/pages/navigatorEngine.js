// ── Navigator AI reasoning engine — pure logic, no React/DOM ──────────
// Ported from the Navigator AI Home.html Claude Design prototype.

// ── Tool Calling Framework — MCP tool registry ────────────────────────
export const TOOLS = {
  // ── GraphQL Agent ──────────────────────────────────────────────────
  execute_graphql_query: {
    tier: ['quick', 'graph', 'risk', 'deep'],
    requiresApproval: true,
    fallback: 'get_entity_details',
    label: 'execute_graphql_query',
    description: 'Executing GraphQL query against the knowledge graph',
    actionLabel: 'Run query',
    fallbackLabel: 'Look up entity details instead',
    inputLabels: { query: 'GraphQL query', entityContext: 'Focus entity', filters: 'Filters' },
    input:  { query: 'string', entityContext: 'string[]', filters: 'object' },
    output: { count: 'number', data: 'object' },
  },
  prepare_graphql_query: {
    tier: ['quick', 'graph'],
    requiresApproval: false,
    fallback: null,
    label: 'prepare_graphql_query',
    description: 'Building GraphQL query from natural language intent',
    actionLabel: 'Prepare query',
    fallbackLabel: null,
    inputLabels: { query: 'Natural language query' },
    input:  { query: 'string' },
    output: { graphql: 'string' },
  },
  validate_graphql_query: {
    tier: ['graph', 'risk'],
    requiresApproval: false,
    fallback: null,
    label: 'validate_graphql_query',
    description: 'Validating query structure — returns result count',
    actionLabel: 'Validate',
    fallbackLabel: null,
    inputLabels: { query: 'GraphQL query' },
    input:  { query: 'string' },
    output: { count: 'number' },
  },
  prepare_and_execute_batch: {
    tier: ['risk', 'deep'],
    requiresApproval: true,
    fallback: 'execute_graphql_query',
    label: 'prepare_and_execute_batch',
    description: 'Running correlated GraphQL queries across entity types',
    actionLabel: 'Run batch',
    fallbackLabel: 'Run single query instead',
    inputLabels: { queries: 'Query set', variables_list: 'Variable sets' },
    input:  { queries: 'string[]', variables_list: 'object[]' },
    output: { results: 'object[]' },
  },
  prepare_display: {
    tier: ['graph', 'summary'],
    requiresApproval: false,
    fallback: 'execute_graphql_query',
    label: 'prepare_display',
    description: 'Formatting query results for structured display',
    actionLabel: 'Prepare display',
    fallbackLabel: 'Run raw query instead',
    inputLabels: { query: 'GraphQL query', title: 'Display title', query_type: 'Query type', user_question: 'Question' },
    input:  { query: 'string', title: 'string', query_type: 'string', user_question: 'string' },
    output: { display: 'object', count: 'number' },
  },
  get_graphql_query_type: {
    tier: ['graph', 'summary'],
    requiresApproval: false,
    fallback: null,
    label: 'get_graphql_query_type',
    description: 'Loading query template — getEntityGraph / getEntityGraphMetrics / getDistinctValues',
    actionLabel: 'Load template',
    fallbackLabel: null,
    inputLabels: { query_type: 'Query type' },
    input:  { query_type: 'string' },
    output: { template: 'string' },
  },
  // ── Data Dictionary Agent ──────────────────────────────────────────
  list_entities: {
    tier: ['concept', 'data-dict', 'graph', 'quick'],
    requiresApproval: false,
    fallback: null,
    label: 'list_entities',
    description: 'Fetching all entity types from the data dictionary',
    actionLabel: 'List entities',
    fallbackLabel: null,
    inputLabels: {},
    input:  {},
    output: { entities: 'string[]' },
  },
  get_entity_details: {
    tier: ['concept', 'data-dict'],
    requiresApproval: false,
    fallback: null,
    label: 'get_entity_details',
    description: 'Loading entity definition and attributes from data dictionary',
    actionLabel: 'Look it up',
    fallbackLabel: null,
    inputLabels: { entity_name: 'Entity name', compact: 'Compact mode' },
    input:  { entity_name: 'string', compact: 'boolean' },
    output: { definition: 'string', fields: 'object[]' },
  },
  list_relationships: {
    tier: ['data-dict', 'risk'],
    requiresApproval: false,
    fallback: null,
    label: 'list_relationships',
    description: 'Retrieving all entity relationships from the knowledge graph schema',
    actionLabel: 'List relationships',
    fallbackLabel: null,
    inputLabels: {},
    input:  {},
    output: { relationships: 'string[]' },
  },
  get_relationship_details: {
    tier: ['data-dict', 'graph', 'risk'],
    requiresApproval: false,
    fallback: null,
    label: 'get_relationship_details',
    description: 'Loading relationship definition between entity types',
    actionLabel: 'Look it up',
    fallbackLabel: null,
    inputLabels: { relationship_name: 'Relationship', compact: 'Compact mode' },
    input:  { relationship_name: 'string', compact: 'boolean' },
    output: { definition: 'string', source: 'string', target: 'string' },
  },
  // ── Metadata Agent ─────────────────────────────────────────────────
  get_entity_updated_at: {
    tier: ['summary'],
    requiresApproval: false,
    fallback: null,
    label: 'get_entity_updated_at',
    description: 'Verifying when entity data was last synchronized',
    actionLabel: 'Check freshness',
    fallbackLabel: null,
    inputLabels: {},
    input:  {},
    output: { updated_at: 'string' },
  },
};

// Primary tool per tier — drives the Tool Approval Card and the initial callTool()
const PRIMARY_TOOL_BY_TIER = {
  quick:      'execute_graphql_query',
  graph:      'execute_graphql_query',
  risk:       'prepare_and_execute_batch',
  deep:       'prepare_and_execute_batch',
  concept:    'get_entity_details',
  'data-dict':'get_entity_details',
  web:        null,
  summary:    'prepare_display',
};

export function selectTool(tier) {
  return PRIMARY_TOOL_BY_TIER[tier] || 'execute_graphql_query';
}

// Build a readable param summary for the thought stream: "query, filters: 3"
export function toolCallSummary(toolName, context) {
  const t = TOOLS[toolName];
  if (!t) return '';
  const parts = Object.keys(t.input).slice(0, 3); // show first 3 params
  return parts.map(k => {
    const v = context[k];
    if (v === undefined) return k;
    if (Array.isArray(v)) return `${k}: ${v.length}`;
    if (typeof v === 'object' && v !== null) return `${k}: {…}`;
    return `${k}: "${String(v).slice(0, 20)}"`;
  }).join(', ');
}

// Simulate MCP tool invocation — returns mock output matching each tool's schema
export function callTool(toolName, inputs) {
  switch (toolName) {
    case 'execute_graphql_query':
      return { count: Math.floor(12 + Math.random() * 80), data: { entity: inputs.entityContext || [], filters: inputs.filters || {} } };
    case 'prepare_graphql_query':
      return { graphql: `query { entities(filter: { type: "${inputs.query || 'asset'}" }) { id name risk } }` };
    case 'validate_graphql_query':
      return { count: Math.floor(10 + Math.random() * 200) };
    case 'prepare_and_execute_batch':
      return { results: [{ count: Math.floor(20 + Math.random() * 80) }, { count: Math.floor(5 + Math.random() * 40) }] };
    case 'prepare_display':
      return { display: { title: inputs.title || 'Results', type: inputs.query_type || 'getEntityGraph' }, count: Math.floor(100 + Math.random() * 900) };
    case 'get_graphql_query_type':
      return { template: inputs.query_type || 'getEntityGraph' };
    case 'list_entities':
      return { entities: ['Asset', 'Identity', 'Finding', 'Application', 'Device', 'Cloud', 'Vulnerability', 'Control'] };
    case 'get_entity_details':
      return { definition: 'Entity definition loaded from data dictionary.', fields: [{ name: 'id' }, { name: 'risk_score' }, { name: 'status' }] };
    case 'list_relationships':
      return { relationships: ['AFFECTS', 'OWNS', 'EXPOSES', 'CONNECTS_TO', 'MITIGATES', 'MAPS_TO'] };
    case 'get_relationship_details':
      return { definition: 'Relationship definition loaded from schema.', source: 'Entity', target: 'Entity' };
    case 'get_entity_updated_at':
      return { updated_at: new Date().toISOString() };
    default:
      return {};
  }
}

// ── Tool Approval Card — fuzzy-extracted mock parameter values ────────
export function buildTacInputValues(toolName, queryText) {
  const q = queryText || '';
  const mCtx = /\b(user|person|identity|host|applicat|finding|asset|account)\w*/.exec(q.toLowerCase());
  const fieldMatch = q.match(/\b\w+_\w+\b/);
  const base = {
    query: q,
    entityContext: mCtx ? [mCtx[0]] : ['asset'],
    filters: {},
    entity_name: mCtx ? (mCtx[0].charAt(0).toUpperCase() + mCtx[0].slice(1)) : 'Asset',
    relationship_name: fieldMatch ? fieldMatch[0] : 'AFFECTS',
    compact: true,
    query_type: 'getEntityGraph',
    title: q ? q.slice(0, 40) : 'Results',
    user_question: q,
    queries: ['query { entities { id risk_score } }'],
    variables_list: [{}],
  };
  const t = TOOLS[toolName];
  const result = {};
  if (t && t.input) {
    Object.keys(t.input).forEach(k => { result[k] = base[k] !== undefined ? base[k] : ''; });
  }
  return result;
}

export function formatTacVal(v) {
  if (Array.isArray(v)) return v.slice(0, 3).join(', ') + (v.length > 3 ? ` +${v.length - 3} more` : '');
  if (typeof v === 'object' && v !== null) return 'auto-detected';
  const s = String(v);
  return s.length > 32 ? `${s.slice(0, 32)}…` : (s || '—');
}

// ── Chit-chat bypass ───────────────────────────────────────────────────
export function isChitChat(q) {
  const ql = q.trim().toLowerCase().replace(/[!?.]+$/, '');
  return /^(hi|hey|hello|howdy|hiya|yo|sup|greetings|good\s*(morning|afternoon|evening|day|night)|what'?s\s*up|how\s*(are\s*(you|u)|is\s*it\s*going)|thanks?(\s*you)?|thank\s*you|cheers|ok|okay|cool|great|nice|perfect|got\s*it|sounds\s*good|bye|goodbye|see\s*ya|later|ciao)$/.test(ql);
}

const CHIT_CHAT_REPLIES = [
  { test: /^(hi|hey|hello|howdy|hiya|yo|greetings)/, reply: 'Hello! What can I help you with today? You can ask about assets, vulnerabilities, risk exposure, or compliance posture.' },
  { test: /good\s*(morning|afternoon|evening|day)/, reply: 'Good to see you. Ask me anything about your security posture — vulnerabilities, assets, compliance, or risk.' },
  { test: /how\s*(are\s*(you|u)|is\s*it\s*going)|what'?s\s*up/, reply: 'Ready to help. What would you like to explore?' },
  { test: /thanks?(\s*you)?|thank\s*you|cheers/, reply: 'Happy to help. Let me know if there\'s anything else.' },
  { test: /bye|goodbye|see\s*ya|later|ciao/, reply: 'See you. Come back anytime.' },
  { test: /ok|okay|cool|great|nice|perfect|got\s*it|sounds\s*good/, reply: 'Got it. What would you like to look at next?' },
];

export function chitChatReply(q) {
  const ql = q.trim().toLowerCase();
  for (let i = 0; i < CHIT_CHAT_REPLIES.length; i++) {
    if (CHIT_CHAT_REPLIES[i].test.test(ql)) return CHIT_CHAT_REPLIES[i].reply;
  }
  return 'What would you like to explore?';
}

// ── Query Classification ──────────────────────────────────────────────
export function classifyQuery(q) {
  const ql = q.toLowerCase();
  // Web — CVE/NVD/MITRE/ATT&CK references always route to web search
  if (/CVE-\d{4}-\d+|CWE-\d+|\b(NVD|NIST|MITRE|ATT&CK)\b/i.test(q)) return 'web';
  // Data dictionary — field name lookups
  if (/\b(what (is|does|are)|define|meaning of|explain)\b.*(privilege_level|epss|cvss|asset_criticality|compliance|finding|exposure_score)/i.test(ql)) return 'data-dict';
  // Summary / dashboard
  if (/\b(summarize|summary|overview|dashboard|what.s my exposure|give me a picture)\b/i.test(ql)) return 'summary';
  // Concept — general EM terminology questions
  if (/\b(what (is|are|does)|explain|define|how does|tell me about)\b/i.test(ql)) return 'concept';
  // KG tiers
  if (/\b(analyz|analysis|deep\s*dive|risk\s*scor|compliance|impact|trend|correlat|anomal)\b/.test(ql) || q.length > 100) return 'deep';
  if (/\b(risk|vulnerab|critical|high.sever|exploit|threat|exposure)\b/.test(ql)) return 'risk';
  if (/\b(who\s+has|which\s+users?|how\s+many|connect|path|between|linked|related|owned?\s+by|access\s+to)\b/.test(ql)) return 'graph';
  return 'quick';
}

// Detects the entity type a query is centered on (Identity/Host/Application/…),
// used both to word the step labels and to seed the filter-tree visualization.
export function detectEntity(q, fallback = 'entity') {
  const m = /\b(user|person|identity|host|applicat|finding|asset|account)\w*/.exec(q.toLowerCase());
  return m ? (m[0].charAt(0).toUpperCase() + m[0].slice(1)) : fallback;
}

// ── Step Plan Builder ─────────────────────────────────────────────────
// Extra steps are injected based on query complexity so the tool-call
// count isn't always fixed at 3–4; in production the number of MCP
// tools invoked varies with the request.
export function buildStepPlan(q, tier) {
  const ent = detectEntity(q, 'entity');

  // Complexity signals: multi-entity queries or long questions need more tools
  const entityMatches = (q.match(/\b(user|identity|host|application|device|finding|cloud|vulnerab)\w*/gi) || []);
  const isMultiEntity = entityMatches.length > 1;
  const isLong = q.length > 70;
  const extraCount = (isMultiEntity ? 1 : 0) + (isLong ? 1 : 0);

  if (tier === 'concept') return [
    { label: 'Scanning available entity types', icon: 'search', tool: 'list_entities' },
    { label: 'Loading entity definition from data dictionary', icon: 'brain', tool: 'get_entity_details' },
  ];
  if (tier === 'data-dict') return [
    { label: 'Identifying field reference in entity registry', icon: 'search', tool: 'list_entities' },
    { label: 'Loading schema metadata and attributes', icon: 'node', tool: 'get_entity_details' },
    { label: 'Resolving relationship connections', icon: 'filter', expandable: true, tool: 'get_relationship_details' },
  ];
  if (tier === 'web') return [
    { label: 'Detecting CVE / threat intelligence query', icon: 'search' },
    { label: 'Querying NVD / MITRE for matching records', icon: 'web' },
    { label: 'Cross-referencing with asset inventory', icon: 'node', tool: 'execute_graphql_query' },
    { label: 'Formatting sourced answer with citations', icon: 'brain' },
  ];
  if (tier === 'summary') return [
    { label: 'Checking entity data freshness', icon: 'search', tool: 'get_entity_updated_at' },
    { label: 'Selecting metrics query template', icon: 'brain', tool: 'get_graphql_query_type' },
    { label: 'Executing exposure metrics query', icon: 'node', liveMetrics: true, tool: 'execute_graphql_query' },
    { label: 'Formatting summary for display', icon: 'route', tool: 'prepare_display' },
  ];
  if (tier === 'quick') {
    const steps = [
      { label: 'Resolving query intent and entity scope', icon: 'search', tool: 'list_entities' },
      { label: 'Building GraphQL lookup query', icon: 'node', tool: 'prepare_graphql_query' },
      { label: `Executing ${ent} lookup`, icon: 'filter', expandable: true, tool: 'execute_graphql_query' },
    ];
    if (extraCount > 0) steps.splice(2, 0, { label: 'Resolving related entity context', icon: 'brain', tool: 'get_entity_details' });
    return steps;
  }
  if (tier === 'graph') {
    const steps = [
      { label: 'Resolving entity types in scope', icon: 'node', tool: 'list_entities' },
      { label: 'Loading graph traversal query template', icon: 'route', tool: 'get_graphql_query_type' },
      { label: `Constructing traversal query for ${ent}`, icon: 'filter', tool: 'prepare_graphql_query' },
      { label: 'Validating query and estimating result size', icon: 'filter', expandable: true, tool: 'validate_graphql_query' },
    ];
    if (extraCount > 0) steps.splice(2, 0, { label: 'Resolving relationship paths between entity types', icon: 'route', tool: 'get_relationship_details' });
    if (extraCount > 1) steps.splice(3, 0, { label: 'Enriching graph with privilege context', icon: 'brain', tool: 'get_entity_details' });
    return steps;
  }
  if (tier === 'risk') {
    const steps = [
      { label: `Identifying ${ent} scope and entity types`, icon: 'node', tool: 'list_entities' },
      { label: 'Loading exposure relationship model', icon: 'brain', tool: 'list_relationships' },
      { label: 'Traversing cross-entity exposure paths', icon: 'route', tool: 'get_relationship_details' },
      { label: 'Running correlated risk batch queries', icon: 'filter', expandable: true, tool: 'prepare_and_execute_batch' },
    ];
    if (extraCount > 0) steps.splice(3, 0, { label: 'Cross-referencing exploit intelligence', icon: 'web' });
    if (extraCount > 1) steps.splice(4, 0, { label: 'Enriching findings with severity context', icon: 'brain', tool: 'get_entity_details' });
    return steps;
  }
  // deep — phased
  return [
    { phase: 'Discovery', steps: [
      { label: 'Scanning entity registry and relationship schema', icon: 'brain', tool: 'list_entities' },
      { label: `Resolving ${ent} relationship graph`, icon: 'node', tool: 'list_relationships' },
    ]},
    { phase: 'Query Construction', steps: [
      { label: 'Loading traversal query template', icon: 'route', tool: 'get_graphql_query_type', liveMetrics: true },
      { label: 'Building and validating batch query set', icon: 'filter', tool: 'validate_graphql_query' },
    ]},
    { phase: 'Impact Assessment', steps: [
      { label: 'Executing cross-entity batch queries', icon: 'brain', tool: 'prepare_and_execute_batch', interrupt: true },
      { label: 'Selecting analysis strategy', icon: 'route', branching: true, branches: [{ label: 'Narrow: critical only' }, { label: 'Broad: all severities' }] },
      { label: 'Formatting results for display', icon: 'filter', expandable: true, tool: 'prepare_display' },
    ]},
  ];
}

// ── Flatten phased plan into a linear items array ─────────────────────
export function flattenPlan(plan) {
  if (!plan.length || !plan[0].phase) return plan;
  const flat = [];
  plan.forEach(ph => {
    flat.push({ _phaseName: ph.phase });
    ph.steps.forEach(s => flat.push(s));
  });
  return flat;
}

// Tiers whose answer renders inline in the chat card rather than the canvas panel
export const TEXT_ONLY_TIERS = ['web', 'concept', 'data-dict'];

// ── Thought data per step icon type ────────────────────────────────────
export const STEP_THOUGHTS = {
  search: ['Tokenizing query…', 'Resolving intent patterns…', 'Matching entity schema…'],
  node:   ['Scanning entity registry…', 'Loading node attributes…', 'Resolving relationship edges…'],
  route:  ['Evaluating traversal candidates…', 'Applying graph heuristics…', 'Optimizing path weights…'],
  filter: ['Scoring filter relevance…', 'Ranking constraint dimensions…', 'Validating schema compatibility…'],
  brain:  ['Activating inference pipeline…', 'Cross-referencing risk models…', 'Computing confidence scores…'],
  web:    ['Querying NVD API for CVE records…', 'Parsing CVSS score and affected products…', 'Cross-referencing with your asset inventory…'],
};
export const STEP_THOUGHT_URLS = {
  web: ['nvd.nist.gov/vuln/search', 'cve.mitre.org/cgi-bin/cvekey.cgi', 'attack.mitre.org/techniques'],
};

// Tier-specific completion copy
export const TITLE_COMPLETION_LABELS = {
  quick: 'Lookup complete',
  graph: 'Graph traversal complete',
  risk: 'Risk analysis complete',
  deep: 'Deep analysis complete',
  concept: 'Definition retrieved',
  'data-dict': 'Schema loaded',
  summary: 'Summary ready',
  web: 'Search complete',
};
export const INTRO_COMPLETION_MESSAGES = {
  quick:      'Analysis complete — matching records retrieved from your knowledge graph.',
  graph:      'Analysis complete — relationship chains mapped across connected entities.',
  risk:       'Analysis complete — critical exposure paths identified requiring immediate attention.',
  deep:       'Analysis complete — risk indicators correlated across all exposure dimensions.',
  concept:    'Analysis complete — definition retrieved from the Prevalent AI knowledge base.',
  'data-dict':'Analysis complete — field schema and usage examples loaded.',
  summary:    'Analysis complete — exposure dashboard summary ready.',
  web:        'Analysis complete — threat intelligence sourced and cross-referenced.',
};

// "Explore Further" follow-up suggestions shown once an answer completes
export const FOLLOWUP_SUGGESTIONS = {
  quick:      ['Which of these lack MFA?', 'Show only accounts with critical findings', 'Who granted these admin roles?'],
  graph:      ['Which of these paths cross environment boundaries?', 'Show me the shortest path to the Payment Gateway', 'Are any of these identities shared service accounts?'],
  risk:       ['What\'s the remediation plan for the vCenter finding?', 'Which of these are internet-facing?', 'Show me the blast radius of admin-svc-account'],
  deep:       ['Which chain should we remediate first?', 'Show me the compliance impact of these findings', 'What changed since the last scan?'],
  concept:    ['How is exposure score different from CVSS?', 'What lowers an exposure score?', 'Show me our current average exposure score'],
  'data-dict':['What does compliance mean in this context?', 'Show me all identities with elevated privilege_level', 'What other fields relate to privilege_level?'],
  summary:    ['Which domain contributed most to this week\'s increase?', 'Show me the remediation owners for critical items', 'Compare this to last month'],
  web:        ['Are any of our assets affected by this CVE?', 'Show me other critical CVEs from this month', 'What\'s the recommended patch timeline?'],
};

// Canvas-panel topbar answer line per tier
export const CANVAS_ANSWERS = {
  quick:    'Query resolved — matching records retrieved from your knowledge graph.',
  graph:    'Graph traversal complete — relationship chains mapped across connected entities.',
  risk:     'Risk analysis complete — critical exposure paths identified requiring immediate attention.',
  deep:     'Multi-stage analysis complete — risk indicators correlated across all exposure dimensions.',
  concept:  'Definition retrieved from the Prevalent AI knowledge base.',
  'data-dict': 'Schema metadata loaded — field definition and usage examples available.',
  summary:  'Exposure summary generated — KPIs and top-risk items compiled.',
  web:      'Web search complete — threat intelligence sourced and cross-referenced.',
};
