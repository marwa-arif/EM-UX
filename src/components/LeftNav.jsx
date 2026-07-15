import React, { useState, useRef, useEffect } from 'react'
import { Ic } from '../ui.jsx'

function IcBuildingBlock() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1"   y="1"   width="6" height="6" rx="1.5" fill="currentColor"/>
      <rect x="9"   y="1"   width="6" height="6" rx="1.5" fill="currentColor"/>
      <rect x="1"   y="9"   width="6" height="6" rx="1.5" fill="currentColor"/>
      <rect x="9"   y="9"   width="6" height="6" rx="1.5" fill="currentColor"/>
    </svg>
  )
}

function IcEMDashboard() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="6" height="5" rx="1" fill="currentColor"/>
      <rect x="9" y="1" width="6" height="5" rx="1" fill="currentColor"/>
      <rect x="1" y="8" width="6" height="7" rx="1" fill="currentColor"/>
      <rect x="9" y="8" width="6" height="7" rx="1" fill="currentColor"/>
    </svg>
  )
}

// Up+down arrows — conveys "switch between options" (not navigation)
function IcSortCaret() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <path d="M2.5 3.75 5 1.5 7.5 3.75" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2.5 6.25 5 8.5 7.5 6.25" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// Panel-left-close: sidebar panel icon with left-pointing arrow inside
function IcPanelClose() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.35"/>
      <path d="M5.25 1.5v12" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round"/>
      <path d="M9 5.5 L7 7.5 L9 9.5" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// Panel-left-open: sidebar panel icon with right-pointing arrow inside
function IcPanelOpen() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.35"/>
      <path d="M5.25 1.5v12" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round"/>
      <path d="M7 5.5 L9 7.5 L7 9.5" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function LeftNav({ current, onNav, collapsed, onToggleCollapse, mode = 'em', onModeChange }) {
  const model = [
    { id: 'workspace',  label: 'Workspace',       icon: 'navbar-workspace', dividerAfter: true },
    { id: 'exposure',   label: 'Exposure',        icon: 'navbar-exposure',   children: [
        { id: 'exposure/overview',  label: 'Overview',  icon: 'nav-overview' },
        { id: 'exposure/findings',  label: 'Findings',  icon: 'nav-findings' },
    ]},
    { id: 'discover',   label: 'Discover',        icon: 'navbar-discover',   children: [
        { id: 'discover/device',   label: 'Device',   icon: 'nav-discover-device' },
        { id: 'discover/cloud',    label: 'Cloud',    icon: 'nav-discover-cloud' },
        { id: 'discover/identity', label: 'Identity', icon: 'nav-discover-identity' },
    ]},
    { id: 'report',     label: 'Report',          icon: 'navbar-report',     children: [
        { id: 'report/compliance',          label: 'Compliance',          icon: 'nav-report-compliance' },
        { id: 'report/assessments',         label: 'Assessments',         icon: 'nav-report-assessments' },
        { id: 'report/compliance-matrix',   label: 'Compliance Matrix',   icon: 'nav-report-matrix' },
        { id: 'report/compliance-findings', label: 'Compliance Findings', icon: 'nav-findings' },
    ]},
    { id: 'kg',         label: 'Knowledge Graph', icon: 'navbar-kg',         solo: true },
    { id: 'data-quality', label: 'Data Quality',  icon: 'navbar-data quality', children: [
        { id: 'data-quality/overview', label: 'Overview',  icon: 'nav-overview' },
        { id: 'data-quality/in-depth', label: 'In-Depth',  icon: 'nav-dq-indepth' },
    ]},
    { id: 'remediation',label: 'Remediation',     icon: 'navbar-remediation', children: [
        { id: 'remediation/queue',  label: 'Queue',  icon: 'nav-remediation-queue' },
        { id: 'remediation/closed', label: 'Closed', icon: 'nav-remediation-closed' },
    ]},
  ];

  const activeParent = current?.split('/')[0];
  const activeChild  = current;
  const [openId, setOpenId] = useState(() => activeParent ?? null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const headerRef = useRef(null);

  const toggle = (id) => setOpenId(prev => prev === id ? null : id);
  const width = collapsed ? 52 : 220;
  const isStudio = mode === 'studio';

  // Close dropdown when clicking outside the header
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e) => {
      if (headerRef.current && !headerRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen]);

  const handleOption = (option) => {
    setDropdownOpen(false);
    if (option === 'navigator') {
      onNav('navigator-page');
    } else if (option === 'studio') {
      onModeChange?.('studio');
    } else if (option === 'em') {
      onModeChange?.('em');
    }
  };

  return (
    <aside className="leftnav" style={{ width }}>
      <div ref={headerRef} className="leftnav__header">
        {!collapsed ? (
          <>
            <button
              className={`leftnav__switcher${dropdownOpen ? ' leftnav__switcher--open' : ''}`}
              onClick={() => setDropdownOpen(o => !o)}
              aria-haspopup="menu"
              aria-expanded={dropdownOpen}
            >
              <span className="leftnav__switcher-icon">
                {isStudio ? <IcBuildingBlock /> : <IcEMDashboard />}
              </span>
              <span className="leftnav__switcher-text">
                <span className="leftnav__switcher-name">
                  {isStudio ? 'Studio' : 'EM Dashboard'}
                </span>
                {!isStudio && (
                  <span className="leftnav__switcher-sub">Exposure Management</span>
                )}
              </span>
              <span className="leftnav__switcher-caret">
                <IcSortCaret />
              </span>
            </button>

            <button
              onClick={onToggleCollapse}
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
              className="leftnav__collapse-btn"
            >
              <IcPanelClose />
            </button>
          </>
        ) : (
          <button
            onClick={onToggleCollapse}
            title="Expand sidebar"
            aria-label="Expand sidebar"
            className="leftnav__collapse-btn leftnav__collapse-btn--solo"
          >
            <IcPanelOpen />
          </button>
        )}

        {dropdownOpen && !collapsed && (
          <div className="leftnav__mode-dropdown">
            {isStudio ? (
              <button
                className="leftnav__mode-option"
                onClick={() => handleOption('em')}
              >
                <IcEMDashboard />
                <span className="leftnav__mode-option-label">EM Dashboard</span>
              </button>
            ) : (
              <button
                className="leftnav__mode-option"
                onClick={() => handleOption('studio')}
              >
                <IcBuildingBlock />
                <span className="leftnav__mode-option-label">Studio</span>
                <span className="leftnav__mode-option-soon">Soon</span>
              </button>
            )}
            <button
              className="leftnav__mode-option"
              onClick={() => handleOption('navigator')}
            >
              <img src="/assets/icons/Navigator icon.svg" width={14} height={14} alt="" className="leftnav__mode-option-img" />
              <span className="leftnav__mode-option-label">Navigator</span>
            </button>
          </div>
        )}
      </div>

      {!isStudio && (
        <div className="leftnav__body">
          {model.map(item => (
            <React.Fragment key={item.id}>
              <NavItem
                item={item}
                collapsed={collapsed}
                isActiveParent={activeParent === item.id}
                activeChild={activeChild}
                isOpen={openId === item.id}
                onToggle={() => toggle(item.id)}
                onNav={onNav}
              />
              {item.dividerAfter && <div className="leftnav__divider" />}
            </React.Fragment>
          ))}
        </div>
      )}
    </aside>
  );
}

function NavItem({ item, collapsed, isActiveParent, activeChild, isOpen, onToggle, onNav }) {
  const hasChildren = item.children && item.children.length;
  const treatAsLeaf = !hasChildren;

  const handleClick = () => {
    if (treatAsLeaf) onNav(item.id);
    else { onToggle(); if (!isActiveParent) onNav(item.children[0].id); }
  };

  return (
    <div className="nav-item">
      <button
        onClick={handleClick}
        title={collapsed ? item.label : undefined}
        className={[
          'nav-item__btn',
          collapsed ? 'nav-item__btn--collapsed' : '',
          isActiveParent ? 'nav-item__btn--active' : '',
        ].filter(Boolean).join(' ')}
      >
        <img
          src={`/assets/icons/${item.icon}.svg`}
          width={16} height={16}
          className={`nav-item__icon${isActiveParent ? ' nav-item__icon--active' : ''}`}
          alt=""
        />
        {!collapsed && (
          <>
            <span className="nav-item__label">{item.label}</span>
            {hasChildren && (
              <span className={`nav-item__chevron${isOpen ? ' nav-item__chevron--open' : ''}`}>
                <Ic size={12} path={<><path d="m6 9 6 6 6-6"/></>}/>
              </span>
            )}
          </>
        )}
      </button>

      {!collapsed && hasChildren && (
        <div
          className="nav-item__children"
          style={{ maxHeight: isOpen ? item.children.length * 30 : 0 }}
        >
          {item.children.map(c => {
            const active = activeChild === c.id;
            return (
              <button
                key={c.id}
                onClick={() => onNav(c.id)}
                className={`nav-item__child${active ? ' nav-item__child--active' : ''}`}
              >
                {c.icon && (
                  <span
                    className="nav-item__child-icon"
                    style={{
                      maskImage: `url('/assets/icons/${c.icon}.svg')`,
                      WebkitMaskImage: `url('/assets/icons/${c.icon}.svg')`,
                      maskSize: 'contain',
                      WebkitMaskSize: 'contain',
                      maskRepeat: 'no-repeat',
                      WebkitMaskRepeat: 'no-repeat',
                      maskPosition: 'center',
                      WebkitMaskPosition: 'center',
                      maskMode: 'alpha',
                    }}
                  />
                )}
                {c.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default LeftNav;
