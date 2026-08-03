// Shared synthetic per-record population generator for the Discover Device/Cloud/Identity
// dashboards. Every widget (Data Source bars, Type donut, Criticality bar + Assets table)
// recomputes from one real, filterable population instead of independent hardcoded numbers —
// this replaces the old single-scenario "isFiltered" canned-snapshot demo, which could only
// ever show one fixed filtered state and can't represent arbitrary/stacking chart filters.
// One generator + per-page config, rather than three copies of the same logic.

function pseudoHash(str) {
  let h1 = 0x12345678, h2 = 0x87654321
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i)
    h1 = (Math.imul(h1 ^ c, 16777619)) >>> 0
    h2 = (Math.imul(h2 + c, 2246822519)) >>> 0
  }
  let x = (h1 ^ h2) >>> 0
  let out = ''
  for (let i = 0; i < 64; i++) {
    x = (Math.imul(x, 1103515245) + 12345) >>> 0
    out += ((x >>> 28) & 0xf).toString(16)
  }
  return out
}
function pick(hash, offset, pool) {
  return pool[parseInt(hash.slice(offset, offset + 4), 16) % pool.length]
}
function pickInt(hash, offset, min, max) {
  return min + (parseInt(hash.slice(offset, offset + 4), 16) % (max - min))
}

// Deterministic UUID-shaped id per assessment (mock — no real backend id exists). Shared here
// so both the record generator and each page's "filter by this assessment" row icon agree on
// the same id for the same assessment text.
export function fakeAssessmentId(text) {
  let h1 = 0x811c9dc5, h2 = 0x1000193
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i)
    h1 = Math.imul(h1 ^ c, 16777619) >>> 0
    h2 = Math.imul(h2 + c, 2654435761) >>> 0
  }
  const hex = (h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0')).toUpperCase()
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-4${hex.slice(13,16)}-8${hex.slice(17,20)}-${hex.slice(20,32).padEnd(12,'0')}`
}

// config: { key, count, sources: [{name, corr}], types: [{label, icon, color}],
//           criticalities: [{label, color}], insights: [{text}], namePrefix, osPool, deployPool }
export function makeDiscoverRecords(config) {
  const osPool = config.osPool || ['Linux', 'Windows', 'macOS']
  const deployPool = config.deployPool || ['Cloud', 'On-Prem']
  const records = []
  for (let i = 0; i < config.count; i++) {
    const h = pseudoHash(`${config.key}#${i}`)
    const source = pick(h, 0, config.sources.map(s => s.name))
    const sourceCfg = config.sources.find(s => s.name === source)
    const corrType = pickInt(h, 12, 0, 100) < (sourceCfg?.corr ?? 20) ? 'Corroborated' : 'Unique'
    const insight = config.insights.length ? config.insights[parseInt(h.slice(16, 20), 16) % config.insights.length] : null
    records.push({
      id: `${config.key}-${h.slice(20, 28)}`,
      name: `${config.namePrefix || 'RES'}-${h.slice(24, 30).toUpperCase()}.ACNA.CO`,
      source,
      corrType,
      type: pick(h, 4, config.types.map(t => t.label)),
      criticality: pick(h, 8, config.criticalities.map(c => c.label)),
      assessmentId: insight ? fakeAssessmentId(insight.text) : null,
      score: pickInt(h, 28, 100, 1000),
      os: pick(h, 32, osPool),
      deploy: pick(h, 36, deployPool),
    })
  }
  return records
}

export function aggregateBySource(records, sourcesConfig) {
  const bySource = new Map()
  for (const r of records) {
    if (!bySource.has(r.source)) bySource.set(r.source, { Corroborated: 0, Unique: 0 })
    bySource.get(r.source)[r.corrType]++
  }
  return sourcesConfig
    .filter(s => bySource.has(s.name))
    .map(s => {
      const c = bySource.get(s.name)
      const total = c.Corroborated + c.Unique || 1
      return { name: s.name, Corroborated: Math.round((c.Corroborated / total) * 100), Unique: Math.round((c.Unique / total) * 100) }
    })
}

export function aggregateByType(records, typesConfig) {
  const counts = new Map()
  for (const r of records) counts.set(r.type, (counts.get(r.type) || 0) + 1)
  const total = records.length || 1
  return typesConfig
    .filter(t => counts.has(t.label))
    .map(t => ({ label: t.label, icon: t.icon, color: t.color, count: counts.get(t.label), pct: Math.round((counts.get(t.label) / total) * 1000) / 10 }))
}

export function aggregateByCriticality(records, criticalitiesConfig) {
  const counts = new Map()
  for (const r of records) counts.set(r.criticality, (counts.get(r.criticality) || 0) + 1)
  const total = records.length || 1
  return criticalitiesConfig
    .filter(c => counts.has(c.label))
    .map(c => ({ label: c.label, color: c.color, count: counts.get(c.label).toLocaleString(), pct: Math.round((counts.get(c.label) / total) * 10000) / 100 }))
}
