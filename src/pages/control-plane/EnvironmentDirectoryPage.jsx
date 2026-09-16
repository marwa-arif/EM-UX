import React, { useMemo, useState, useEffect } from 'react'
import { DSPillSearch } from '../../context/WorkspaceCtx.jsx'
import TablePagination from '../../components/TablePagination.jsx'
import { ENVIRONMENTS } from './mockEnvironments.js'
import { DEPLOYMENT_MODEL_LABEL, formatAge } from './stalenessConfig.js'
import '../../styles/control-plane.css'

const DEPLOYMENT_MODELS = ['prevalent-hosted', 'hybrid-hosted', 'client-hosted'];
const CLOUD_PROVIDERS = ['aws', 'azure', 'gcp'];
const KINDS = ['production', 'non-production', 'poc'];
const CHANNELS = ['stable', 'non-release', 'beta'];
const CONFIDENCES = ['verified', 'stale', 'unknown'];
const CONFIDENCE_RANK = { unknown: 0, stale: 1, verified: 2 }; // worse first, for "surface staleness" sorting

const KIND_LABEL = { production: 'Production', 'non-production': 'Non-Production', poc: 'POC' };

function worstSection(env) {
  const sections = [env.topology, env.versions, env.configuration];
  return sections.reduce((worst, s) => (CONFIDENCE_RANK[s.confidence] < CONFIDENCE_RANK[worst] ? s.confidence : worst), 'verified');
}

function uniqueSorted(arr) { return [...new Set(arr)].sort((a, b) => a.localeCompare(b)); }

function readFiltersFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const list = (key) => params.get(key)?.split(',').filter(Boolean) ?? [];
  return {
    q: params.get('q') || '',
    customer: list('customer'),
    deploymentModel: list('model'),
    cloudProvider: list('cloud'),
    kind: list('kind'),
    platformRelease: list('release'),
    componentVersion: list('component'),
    buildChannel: list('channel'),
    confidence: list('confidence'),
    sortKey: params.get('sort') || 'customer',
    sortDir: params.get('dir') || 'asc',
  };
}

function writeFiltersToUrl(f) {
  const params = new URLSearchParams();
  if (f.q) params.set('q', f.q);
  const setIf = (key, arr) => { if (arr.length) params.set(key, arr.join(',')); };
  setIf('customer', f.customer);
  setIf('model', f.deploymentModel);
  setIf('cloud', f.cloudProvider);
  setIf('kind', f.kind);
  setIf('release', f.platformRelease);
  setIf('component', f.componentVersion);
  setIf('channel', f.buildChannel);
  setIf('confidence', f.confidence);
  if (f.sortKey !== 'customer') params.set('sort', f.sortKey);
  if (f.sortDir !== 'asc') params.set('dir', f.sortDir);
  const qs = params.toString();
  history.replaceState(null, '', qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
}

function FilterGroup({ title, options, selected, onToggle }) {
  return (
    <div className="ds-filter-popup__group">
      <div className="ds-filter-popup__group-title">{title}</div>
      {options.map(opt => (
        <label key={opt.value} className="ds-filter-popup__option">
          <input type="checkbox" checked={selected.includes(opt.value)} onChange={() => onToggle(opt.value)} />
          {opt.label}
        </label>
      ))}
    </div>
  );
}

export default function EnvironmentDirectoryPage({ onNav }) {
  const [filters, setFilters] = useState(readFiltersFromUrl);
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  useEffect(() => { writeFiltersToUrl(filters); }, [filters]);
  useEffect(() => { setPage(1); }, [filters]);

  const customers = useMemo(() => uniqueSorted(ENVIRONMENTS.map(e => e.customer.name)), []);
  const releases = useMemo(() => uniqueSorted(ENVIRONMENTS.map(e => e.versions.value?.platformRelease).filter(Boolean)), []);
  const componentVersions = useMemo(() => {
    const set = new Set();
    ENVIRONMENTS.forEach(e => (e.versions.value?.components || []).forEach(c => set.add(`${c.name}@${c.version}`)));
    return uniqueSorted([...set]);
  }, []);

  const toggle = (key, value) => setFilters(f => ({
    ...f,
    [key]: f[key].includes(value) ? f[key].filter(v => v !== value) : [...f[key], value],
  }));

  const setQuery = (q) => setFilters(f => ({ ...f, q }));
  const clearAll = () => setFilters({ q: '', customer: [], deploymentModel: [], cloudProvider: [], kind: [], platformRelease: [], componentVersion: [], buildChannel: [], confidence: [], sortKey: filters.sortKey, sortDir: filters.sortDir });

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return ENVIRONMENTS.filter(e => {
      if (q && !`${e.displayName} ${e.customer.name}`.toLowerCase().includes(q)) return false;
      if (filters.customer.length && !filters.customer.includes(e.customer.name)) return false;
      if (filters.deploymentModel.length && !filters.deploymentModel.includes(e.deploymentModel)) return false;
      if (filters.cloudProvider.length && !filters.cloudProvider.includes(e.cloudProvider)) return false;
      if (filters.kind.length && !filters.kind.includes(e.kind)) return false;
      if (filters.platformRelease.length && !filters.platformRelease.includes(e.versions.value?.platformRelease)) return false;
      if (filters.buildChannel.length && !filters.buildChannel.includes(e.versions.value?.buildChannel)) return false;
      if (filters.confidence.length && !filters.confidence.includes(worstSection(e))) return false;
      if (filters.componentVersion.length) {
        const have = (e.versions.value?.components || []).map(c => `${c.name}@${c.version}`);
        if (!filters.componentVersion.some(cv => have.includes(cv))) return false;
      }
      return true;
    });
  }, [filters]);

  const sorted = useMemo(() => {
    const dir = filters.sortDir === 'desc' ? -1 : 1;
    const key = filters.sortKey;
    return [...filtered].sort((a, b) => {
      if (key === 'confidence') return dir * (CONFIDENCE_RANK[worstSection(a)] - CONFIDENCE_RANK[worstSection(b)]);
      if (key === 'lastCollection') {
        const at = a.lastSuccessfulCollection ? new Date(a.lastSuccessfulCollection).getTime() : -Infinity;
        const bt = b.lastSuccessfulCollection ? new Date(b.lastSuccessfulCollection).getTime() : -Infinity;
        return dir * (at - bt);
      }
      const av = key === 'customer' ? a.customer.name : key === 'cloud' ? a.cloudProvider : key === 'release' ? (a.versions.value?.platformRelease || '') : a[key];
      const bv = key === 'customer' ? b.customer.name : key === 'cloud' ? b.cloudProvider : key === 'release' ? (b.versions.value?.platformRelease || '') : b[key];
      return dir * String(av ?? '').localeCompare(String(bv ?? ''));
    });
  }, [filtered, filters.sortKey, filters.sortDir]);

  const paged = sorted.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const sortBy = (key) => setFilters(f => ({ ...f, sortKey: key, sortDir: f.sortKey === key && f.sortDir === 'asc' ? 'desc' : 'asc' }));
  const sortClass = (key) => `ds-th-sortable${filters.sortKey === key ? (filters.sortDir === 'asc' ? ' ds-th-sortable-asc' : ' ds-th-sortable-desc') : ''}`;

  const activeChips = [
    ...filters.customer.map(v => ({ key: `customer:${v}`, label: `Customer: ${v}`, onRemove: () => toggle('customer', v) })),
    ...filters.deploymentModel.map(v => ({ key: `model:${v}`, label: DEPLOYMENT_MODEL_LABEL[v], onRemove: () => toggle('deploymentModel', v) })),
    ...filters.cloudProvider.map(v => ({ key: `cloud:${v}`, label: v.toUpperCase(), onRemove: () => toggle('cloudProvider', v) })),
    ...filters.kind.map(v => ({ key: `kind:${v}`, label: KIND_LABEL[v], onRemove: () => toggle('kind', v) })),
    ...filters.platformRelease.map(v => ({ key: `release:${v}`, label: `Release ${v}`, onRemove: () => toggle('platformRelease', v) })),
    ...filters.componentVersion.map(v => ({ key: `cv:${v}`, label: v, onRemove: () => toggle('componentVersion', v) })),
    ...filters.buildChannel.map(v => ({ key: `channel:${v}`, label: `${v} build`, onRemove: () => toggle('buildChannel', v) })),
    ...filters.confidence.map(v => ({ key: `conf:${v}`, label: `Confidence: ${v}`, onRemove: () => toggle('confidence', v) })),
  ];

  if (ENVIRONMENTS.length === 0) {
    return (
      <div className="cp-empty-section">
        <div className="cp-empty-section__icon">📋</div>
        <div className="cp-empty-section__title">No environments recorded yet</div>
        <div className="cp-empty-section__desc">Add the first environment record to start building the directory.</div>
        <button className="ds-btn sz-md t-primary" onClick={() => onNav('control-plane/environments/new')}>Add environment record</button>
      </div>
    );
  }

  return (
    <div className="cp-page">
      <div className="cp-toolbar">
        <DSPillSearch value={filters.q} onChange={setQuery} placeholder="Search environments or customers" width={280} dataTour="cp-env-search" />
        <div className="ds-filter-popup-wrap">
          <button className={`ds-filter-btn${filterOpen ? ' ds-filter-btn--open' : ''}`} onClick={() => setFilterOpen(o => !o)}>
            Filters
            {activeChips.length > 0 && <span className="ds-filter-btn__count">{activeChips.length}</span>}
          </button>
          {filterOpen && (
            <div className="ds-filter-popup" role="dialog">
              <FilterGroup title="Customer" options={customers.map(c => ({ value: c, label: c }))} selected={filters.customer} onToggle={v => toggle('customer', v)} />
              <FilterGroup title="Deployment model" options={DEPLOYMENT_MODELS.map(m => ({ value: m, label: DEPLOYMENT_MODEL_LABEL[m] }))} selected={filters.deploymentModel} onToggle={v => toggle('deploymentModel', v)} />
              <FilterGroup title="Cloud provider" options={CLOUD_PROVIDERS.map(c => ({ value: c, label: c.toUpperCase() }))} selected={filters.cloudProvider} onToggle={v => toggle('cloudProvider', v)} />
              <FilterGroup title="Environment kind" options={KINDS.map(k => ({ value: k, label: KIND_LABEL[k] }))} selected={filters.kind} onToggle={v => toggle('kind', v)} />
              <FilterGroup title="Platform release" options={releases.map(r => ({ value: r, label: r }))} selected={filters.platformRelease} onToggle={v => toggle('platformRelease', v)} />
              <FilterGroup title="Component version" options={componentVersions.map(c => ({ value: c, label: c }))} selected={filters.componentVersion} onToggle={v => toggle('componentVersion', v)} />
              <FilterGroup title="Build channel" options={CHANNELS.map(c => ({ value: c, label: c }))} selected={filters.buildChannel} onToggle={v => toggle('buildChannel', v)} />
              <FilterGroup title="Confidence" options={CONFIDENCES.map(c => ({ value: c, label: c }))} selected={filters.confidence} onToggle={v => toggle('confidence', v)} />
              <div className="ds-filter-popup__footer">
                <button className="ds-btn sz-sm t-outline" onClick={clearAll}>Clear all</button>
                <button className="ds-btn sz-sm t-primary" onClick={() => setFilterOpen(false)}>Apply</button>
              </div>
            </div>
          )}
        </div>
        <div className="cp-toolbar__spacer" />
        <button className="ds-btn sz-md t-primary" onClick={() => onNav('control-plane/environments/new')}>Add environment record</button>
      </div>

      {activeChips.length > 0 && (
        <div className="ds-active-filters-bar">
          {activeChips.map(chip => (
            <span key={chip.key} className="ds-filter-chip-active">
              {chip.label}
              <button onClick={chip.onRemove} aria-label={`Remove ${chip.label}`}>×</button>
            </span>
          ))}
          <button className="ds-active-filters-bar__clear" onClick={clearAll}>Clear all</button>
        </div>
      )}

      <div className="ds-table-wrap">
        <table className="ds-table">
          <thead>
            <tr>
              <th className={sortClass('displayName')} onClick={() => sortBy('displayName')}>Environment</th>
              <th className={sortClass('customer')} onClick={() => sortBy('customer')}>Customer</th>
              <th className={sortClass('kind')} onClick={() => sortBy('kind')}>Kind</th>
              <th className={sortClass('deploymentModel')} onClick={() => sortBy('deploymentModel')}>Deployment model</th>
              <th className={sortClass('cloud')} onClick={() => sortBy('cloud')}>Cloud / region</th>
              <th className={sortClass('release')} onClick={() => sortBy('release')}>Platform release</th>
              <th>Build channel</th>
              <th className={sortClass('confidence')} onClick={() => sortBy('confidence')}>Confidence</th>
              <th className={sortClass('lastCollection')} onClick={() => sortBy('lastCollection')}>Last collection</th>
            </tr>
          </thead>
          <tbody>
            {paged.map(env => {
              const worst = worstSection(env);
              const channel = env.versions.value?.buildChannel;
              return (
                <tr key={env.id} className="cp-row" onClick={() => onNav(`control-plane/environments/${env.id}`)}>
                  <td className="cp-td-name">{env.displayName}</td>
                  <td>{env.customer.name}</td>
                  <td>{KIND_LABEL[env.kind]}</td>
                  <td>{DEPLOYMENT_MODEL_LABEL[env.deploymentModel]}</td>
                  <td>{env.cloudProvider.toUpperCase()} · {env.region}</td>
                  <td>{env.versions.value?.platformRelease || <span className="cp-muted">Unmapped</span>}</td>
                  <td>{channel && channel !== 'stable' ? <span className="ds-badge caution">{channel}</span> : <span className="cp-muted">stable</span>}</td>
                  <td>
                    {worst === 'unknown' && <span className="ds-badge neutral cp-badge--unknown">Unknown</span>}
                    {worst === 'stale' && <span className="ds-badge neutral cp-badge--stale">Stale</span>}
                    {worst === 'verified' && <span className="ds-badge neutral cp-badge--verified">Verified</span>}
                  </td>
                  <td>{env.lastSuccessfulCollection ? formatAge(env.lastSuccessfulCollection) : <span className="cp-muted">Never</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {sorted.length === 0 && (
          <div className="cp-empty-table">
            <div className="cp-empty-table__icon">🔍</div>
            <div className="cp-empty-table__title">No match among {ENVIRONMENTS.length} environments</div>
            <div className="cp-empty-table__desc">Try removing a filter or adjusting your search.</div>
          </div>
        )}
      </div>

      <TablePagination total={sorted.length} page={page} rowsPerPage={rowsPerPage} onPageChange={setPage} onRowsPerPageChange={setRowsPerPage} />
    </div>
  );
}
