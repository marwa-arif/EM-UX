// Shared by PageKG.jsx, KGPage.jsx (both render the Knowledge Graph canvas
// off this same edge set) and DashboardCanvas.jsx (looks up the real verb
// for a traversed hop in a Widget Filter chip's path label, e.g. "Host Has
// Vulnerability" vs "Vulnerability On Application") — previously duplicated
// verbatim in both KG page files.

// Edges — [src, tgt, label, hidden?, srcAlias?, tgtAlias?]
export const INITIAL_EDGES = [
  ['account', 'identity', 'Associated with'],
  ['account', 'finding', 'Has'],
  ['application', 'host', 'Running on'],
  ['application', 'vulnerability', 'Has'],
  ['assessment', 'finding', 'Associated with'],
  ['cloudAccount', 'finding', 'Has'],
  ['cloudAccount', 'storage', 'Has'],
  ['cloudAccount', 'container', 'Has'],
  ['cloudAccount', 'host', 'Has'],
  ['cloudAccount', 'cluster', 'Has'],
  ['cluster', 'cluster', 'Has', null, 'MapReduce Cluster', 'Compute Instance Group'],
  ['cluster', 'finding', 'Has'],
  ['cluster', 'container', 'Has', null, 'Container Group'],
  ['cluster', 'container', 'Has', null, 'Container Service'],
  ['cluster', 'cluster', 'Has', null, 'Kubernetes Cluster', 'Compute Instance Group'],
  ['cluster', 'host', 'Has', null, 'Compute Instance Group', 'Virtual Machine'],
  ['cluster', 'cloudAccount', 'Belongs to', true],
  ['container', 'cluster', 'Belongs to', true, null, 'Container Service'],
  ['container', 'cloudAccount', 'Belongs to', true],
  ['container', 'finding', 'Has'],
  ['container', 'vulnerability', 'Has'],
  ['container', 'cluster', 'Belongs to', true, null, 'Container Group'],
  ['host', 'person', 'Owned by'],
  ['host', 'cloudAccount', 'Belongs to', true],
  ['host', 'identity', 'Has'],
  ['host', 'finding', 'Has'],
  ['host', 'application', 'Hosting', true],
  ['host', 'vulnerability', 'Has'],
  ['host', 'cluster', 'Belongs to', true, 'Virtual Machine', 'Compute Instance Group'],
  ['host', 'storage', 'Has', null, 'Virtual Machine', 'Volume'],
  ['identity', 'person', 'Associated with'],
  ['identity', 'account', 'Has', true],
  ['identity', 'finding', 'Has'],
  ['identity', 'host', 'Associated with', true],
  ['network', 'finding', 'Has'],
  ['netSvc', 'finding', 'Has'],
  ['person', 'host', 'Owns', true],
  ['person', 'identity', 'Has', true],
  ['person', 'finding', 'Has'],
  ['storage', 'storage', 'Has', null, null, 'Queue Service'],
  ['storage', 'finding', 'Has'],
  ['storage', 'storage', 'Belongs to', null, 'Table Service'],
  ['storage', 'storage', 'Has', null, null, 'Bucket'],
  ['storage', 'cloudAccount', 'Belongs to', true, 'Storage Resource'],
  ['storage', 'storage', 'Belongs to', null, 'File System Service'],
  ['storage', 'host', 'To', true, 'Volume Associates', 'Virtual Machine'],
  ['vulnerability', 'host', 'On', true],
  ['vulnerability', 'container', 'On', true],
  ['vulnerability', 'finding', 'Has'],
  ['vulnerability', 'application', 'On', true],
];

// Directed (fromId, toId) -> verb lookup, e.g. relationVerb('host', 'vulnerability')
// -> 'Has'. Falls back to 'Has' for a pair with no edge defined (e.g. a hop
// ENTITY_RELATIONS in FilterPanel.jsx allows that this edge list hasn't been
// given its own real-world verb yet).
export function relationVerb(fromId, toId) {
  const edge = INITIAL_EDGES.find(([s, t]) => s === fromId && t === toId);
  return edge ? edge[2] : 'Has';
}
