import React, { useState, useRef, useEffect } from 'react'
import { Ic } from '../ui.jsx'
import ActiveFilterPanel, { SaveFilterModal } from './ActiveFilterPanel.jsx'
import { useSavedFilters } from '../context/SavedFiltersCtx.jsx'
import { useToast } from '../context/ToastCtx.jsx'

const EXPLORE_GROUPS = [
  { label: 'Exposure', icon: 'navbar-exposure', items: [
    { label: 'Overview',            id: 'exposure/overview',          icon: 'nav-overview' },
    { label: 'Findings',            id: 'exposure/findings',          icon: 'nav-findings' },
  ]},
  { label: 'Discover', icon: 'navbar-discover', items: [
    { label: 'Device',              id: 'discover/device',            icon: 'nav-discover-device' },
    { label: 'Cloud',               id: 'discover/cloud',             icon: 'nav-discover-cloud' },
    { label: 'Identity',            id: 'discover/identity',          icon: 'nav-discover-identity' },
  ]},
  { label: 'Report', icon: 'navbar-report', items: [
    { label: 'Compliance',          id: 'report/compliance',          icon: 'nav-report-compliance' },
    { label: 'Assessments',         id: 'report/assessments',         icon: 'nav-report-assessments' },
    { label: 'Compliance Matrix',   id: 'report/compliance-matrix',   icon: 'nav-report-matrix' },
    { label: 'Compliance Findings', id: 'report/compliance-findings', icon: 'nav-findings' },
  ]},
  { label: 'Knowledge Graph', icon: 'navbar-kg', items: [
    { label: 'Knowledge Graph',     id: 'kg',                         icon: 'navbar-kg' },
  ]},
];

function SubHeader({ title, breadcrumb, breadcrumbHrefs = [], breadcrumbClicks = [], activeFilterCount = 0, activeFilters = [], onRemoveFilter, onClearFilters, onExplore, onFilter, filterActive, actions, leading, showMenu = true, showExplore = true, onEdit, pageId }) {
  const { addSavedFilter, overwriteSavedFilter } = useSavedFilters();
  const { showToast } = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const [exploreOpen, setExploreOpen] = useState(false);
  const exploreRef = useRef(null);
  const [filterPillOpen, setFilterPillOpen] = useState(false);
  const [pillPos, setPillPos] = useState(null);
  const pillBtnRef = useRef(null);
  const subheaderRef = useRef(null);
  const [showSaveModal, setShowSaveModal] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [menuOpen]);

  useEffect(() => {
    if (!exploreOpen) return;
    const onDown = (e) => { if (exploreRef.current && !exploreRef.current.contains(e.target)) setExploreOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [exploreOpen]);

  const handleSaveFilter = (data) => {
    if (data.overwrite) {
      overwriteSavedFilter(data.overwrite, activeFilters.length, activeFilters);
      showToast({ type: 'success', msg: `"${data.overwrite}" filter updated.` });
    } else {
      addSavedFilter({ name: data.filterName, description: data.description, availability: data.availability, filterCount: activeFilters.length, filters: activeFilters });
      showToast({ type: 'success', msg: `"${data.filterName}" saved as a filter.` });
    }
  };

  const handlePillClick = () => {
    if (!filterPillOpen && pillBtnRef.current && subheaderRef.current) {
      const pillRect = pillBtnRef.current.getBoundingClientRect();
      const shRect = subheaderRef.current.getBoundingClientRect();
      setPillPos({ top: pillRect.bottom + 6, right: window.innerWidth - shRect.right });
    }
    setFilterPillOpen(o => !o);
  };

  return (
    <>
    <div className="subheader" ref={subheaderRef}>

      {leading}

      <div className="subheader__title-block">
        <div className="subheader__title">{title}</div>
        {breadcrumb && (
          <div className="subheader__breadcrumb">
            {breadcrumb.map((b, i) => {
              const isLast = i === breadcrumb.length - 1;
              const href = breadcrumbHrefs[i];
              const onClick = breadcrumbClicks[i];
              return (
                <React.Fragment key={i}>
                  {i > 0 && <span className="subheader__breadcrumb-sep">›</span>}
                  {!isLast && onClick ? (
                    <span className="subheader__breadcrumb-link" onClick={onClick}>{b}</span>
                  ) : !isLast && href ? (
                    <a href={href} className="subheader__breadcrumb-link">{b}</a>
                  ) : (
                    <span className={isLast ? 'subheader__breadcrumb-current' : ''}>{b}</span>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>

      {showMenu && <div ref={menuRef} className="subheader__more-wrap">
        <button onClick={() => setMenuOpen(o => !o)} className="subheader__more-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>
          </svg>
        </button>
        {menuOpen && (
          <div className="subheader__dropdown">
            <button onClick={() => { setMenuOpen(false); onEdit && onEdit(); }} className="subheader__dropdown-item">
              <Ic size={13} path={<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>} />
              Edit
            </button>
          </div>
        )}
      </div>}

      {showExplore && <div ref={exploreRef} className="subheader__explore-wrap">
        <button
          onClick={() => setExploreOpen(o => !o)}
          className={`subheader__explore-btn${exploreOpen ? ' subheader__explore-btn--open' : ''}`}
        >
          <img src="assets/icons/Explore-in.svg" width={13} height={13} alt="" />
          Explore in
          <Ic size={11} path={<><path d="m6 9 6 6 6-6"/></>} />
        </button>
        {exploreOpen && (
          <div className="subheader__explore-dropdown">
            {EXPLORE_GROUPS.map((group, gi) => (
              <div key={group.label}>
                {gi > 0 && <div className="subheader__explore-divider" />}
                <div className="subheader__explore-group">
                  <img src={`assets/icons/${group.icon}.svg`} width={13} height={13} alt="" style={{ opacity: 0.5 }} />
                  <span className="subheader__explore-group-label">{group.label}</span>
                </div>
                {group.items.map(item => (
                  <button
                    key={item.label}
                    onClick={() => { setExploreOpen(false); onExplore && onExplore(item.id); }}
                    className="subheader__explore-item"
                  >
                    <img src={`assets/icons/${item.icon}.svg`} width={14} height={14} alt="" />
                    {item.label}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>}

      <div className="subheader__spacer" />

      {actions !== undefined ? actions : (
        <>
          <div className="subheader__filter-group">
            <button
              title="Save current filter"
              disabled={activeFilterCount === 0}
              className="subheader__save-btn"
              onClick={() => setShowSaveModal(true)}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--pai-surface)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              </svg>
            </button>

            <div className="subheader__filter-pill-wrap">
              <button
                ref={pillBtnRef}
                onClick={handlePillClick}
                className={`subheader__filter-pill subheader__filter-pill--active${filterPillOpen ? ' subheader__filter-pill--open' : ''}`}
              >
                Active Filters
                {activeFilterCount > 0 && (
                  <span className="subheader__filter-count">{activeFilterCount}</span>
                )}
              </button>
            </div>
          </div>
          {filterPillOpen && (
            <ActiveFilterPanel
              activeFilters={activeFilters}
              onRemove={onRemoveFilter}
              onClear={onClearFilters}
              onClose={() => setFilterPillOpen(false)}
              position={pillPos}
              pageId={pageId}
            />
          )}

          <div className="subheader__vdivider" />

          <button
            onClick={onFilter}
            aria-pressed={!!filterActive}
            className={`subheader__filter-btn${filterActive ? ' subheader__filter-btn--open' : ''}`}
          >
            Filter
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
            </svg>
          </button>
        </>
      )}

    </div>

      {showSaveModal && (
        <SaveFilterModal
          onClose={() => setShowSaveModal(false)}
          onSave={handleSaveFilter}
        />
      )}
    </>
  );
}

export default SubHeader;
