import React from 'react';

// Canonical entity-type palette — colors + icon glyph for every entity kind the app models.
// Originated in KGPage's Knowledge Graph canvas; every other drawer's relationship-graph nodes
// (center + leaves) reuse these exact colors/icons so an entity reads the same everywhere,
// not just inside the Knowledge Graph page itself.
export const ENTITY_TYPES = {
  account:        { label: 'Account',           tint: '#F1ECF9', stroke: '#D3C3EC', tintDark: '#1E1228', strokeDark: '#3D2558', icon: '#9269CF', count: 15301,    fragments: 15349,    group: 'identity', glyph: 'account' },
  identity:       { label: 'Identity',          tint: '#F4E6F9', stroke: '#DCB3ED', tintDark: '#22102E', strokeDark: '#4D1E68', icon: '#A842D2', count: 71442,    fragments: 146922,   group: 'identity', glyph: 'identity' },
  group:          { label: 'Group',             tint: '#E3F6F7', stroke: '#A9E5E7', tintDark: '#0D2A2B', strokeDark: '#1A5254', icon: '#27BDC2', count: 2,        fragments: 2,        group: 'identity', glyph: 'group' },
  person:         { label: 'Person',            tint: '#E4EDF1', stroke: '#ABC8D3', tintDark: '#0E1F28', strokeDark: '#1D3E50', icon: '#2E7690', count: 304,      fragments: 1016,     group: 'identity', glyph: 'person' },
  application:    { label: 'Application',       tint: '#F4EEE6', stroke: '#DECCB1', tintDark: '#261B0D', strokeDark: '#4E381A', icon: '#AD803D', count: 4376,     fragments: 42717,    group: 'cloud',    glyph: 'application' },
  vulnerability:  { label: 'Vulnerability',     tint: '#F4E9E9', stroke: '#DFBCBC', tintDark: '#261313', strokeDark: '#4E2626', icon: '#AE5757', count: 55230,    fragments: 311397,   group: 'host',     glyph: 'vulnerability' },
  assessment:     { label: 'Assessment',        tint: '#F4ECE5', stroke: '#DEC4AF', tintDark: '#241808', strokeDark: '#4A3018', icon: '#AC6C36', count: 497,      fragments: 497,      group: 'host',     glyph: 'assessment' },
  cluster:        { label: 'Cluster',           tint: '#E5E5F5', stroke: '#AEAEE1', tintDark: '#0D0D28', strokeDark: '#1A1A50', icon: '#3434B4', count: 231,      fragments: 231,      group: 'cloud',    glyph: 'cluster' },
  container:      { label: 'Container',         tint: '#EBE4F2', stroke: '#C2ADD7', tintDark: '#180C24', strokeDark: '#321848', icon: '#66329C', count: 358,      fragments: 358,      group: 'cloud',    glyph: 'container' },
  cloudAccount:   { label: 'Cloud Account',     tint: '#E6E7F5', stroke: '#B1B4DF', tintDark: '#0D1028', strokeDark: '#1A2050', icon: '#3B43B0', count: 15,       fragments: 15,       group: 'cloud',    glyph: 'cloud' },
  finding:        { label: 'Finding',           tint: '#E9E4F6', stroke: '#BCABE4', tintDark: '#130A2A', strokeDark: '#281455', icon: '#582DBB', count: 15518350, fragments: 15518350, group: 'host',     glyph: 'finding', primary: true },
  ticket:         { label: 'Ticket',            tint: '#E6F6F4', stroke: '#B1E3DE', tintDark: '#0D2A27', strokeDark: '#1A524E', icon: '#3DBAAD', count: 10,       fragments: 10,       group: 'host',     glyph: 'ticket' },
  host:           { label: 'Host',              tint: '#E3E9F1', stroke: '#AABBD3', tintDark: '#0A1520', strokeDark: '#163060', icon: '#2B5690', count: 58687,    fragments: 225709,   group: 'host',     glyph: 'host' },
  network:        { label: 'Network',           tint: '#DEF0EA', stroke: '#99D0BF', tintDark: '#0A2018', strokeDark: '#143E30', icon: '#00895E', count: 77,       fragments: 77,       group: 'cloud',    glyph: 'network' },
  netSvc:         { label: 'Network Services',  tint: '#F0F4E4', stroke: '#D0DCAD', tintDark: '#1C230D', strokeDark: '#38461A', icon: '#89A833', count: 253,      fragments: 253,      group: 'cloud',    glyph: 'netsvc' },
  netIface:       { label: 'Network Interface', tint: '#F6E6F0', stroke: '#E3B1D1', tintDark: '#280D1E', strokeDark: '#50183A', icon: '#BA3D8C', count: 3303,     fragments: 3303,     group: 'cloud',    glyph: 'netiface' },
  storage:        { label: 'Storage',           tint: '#E5F1F7', stroke: '#B0D5E7', tintDark: '#0C2030', strokeDark: '#184060', icon: '#3A96C4', count: 5541,     fragments: 5541,     group: 'cloud',    glyph: 'storage' },
};

export const GLYPH_TO_FILE = {
  account: 'entity-account.svg',
  identity: 'entity-identity.svg',
  group: 'entity-group.svg',
  person: 'entity-person.svg',
  application: 'entity-application.svg',
  vulnerability: 'entity-vulnerability.svg',
  assessment: 'entity-assessment.svg',
  cluster: 'entity-cluster.svg',
  container: 'entity-cloud-container.svg',
  cloud: 'entity-cloud-account.svg',
  finding: 'entity-finding.svg',
  ticket: 'entity-ticket.svg',
  host: 'entity-host.svg',
  network: 'entity-network.svg',
  netsvc: 'entity-network-services.svg',
  netiface: 'entity-network-interface.svg',
  storage: 'entity-storage.svg',
};

// Some pages use their own entityType vocabulary (device/identity/cloud/storage) instead of
// this palette's keys (host/identity/cloudAccount/storage) — map theirs onto ours so every
// drawer's relationship-graph nodes read from the same canonical colors/icons.
export const ASSET_ENTITY_TYPE_KEY = { device: 'host', identity: 'identity', cloud: 'cloudAccount', storage: 'storage' };

export function EntityGlyph({ kind, size = 18 }) {
  const file = GLYPH_TO_FILE[kind];
  if (!file) return null;
  return (
    <img
      src={`assets/icons/${file}`}
      width={size} height={size}
      className="kg-entity-glyph"
      alt=""
    />
  );
}
