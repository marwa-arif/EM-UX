import React, { useState } from 'react'
import { Ic } from '../ui.jsx'

function LeftNav({ current, onNav, collapsed, onToggleCollapse }) {
  const model = [
    { id: 'workspace',  label: 'Workspace',       icon: 'navbar-workspace', dividerAfter: true },
    { id: 'exposure',   label: 'Exposure',        icon: 'navbar-exposure',   children: [
        { id: 'exposure/overview',  label: 'Overview' },
        { id: 'exposure/findings',  label: 'Findings' },
    ]},
    { id: 'discover',   label: 'Discover',        icon: 'navbar-discover',   children: [
        { id: 'discover/device',   label: 'Device' },
        { id: 'discover/cloud',    label: 'Cloud' },
        { id: 'discover/identity', label: 'Identity' },
    ]},
    { id: 'report',     label: 'Report',          icon: 'navbar-report',     children: [
        { id: 'report/compliance',          label: 'Compliance' },
        { id: 'report/assessments',         label: 'Assessments' },
        { id: 'report/compliance-matrix',   label: 'Compliance Matrix' },
        { id: 'report/compliance-findings', label: 'Compliance Findings' },
    ]},
    { id: 'kg',         label: 'Knowledge Graph', icon: 'navbar-kg',         solo: true },
    { id: 'data-quality', label: 'Data Quality',  icon: 'navbar-data quality', children: [
        { id: 'data-quality/overview', label: 'Overview' },
        { id: 'data-quality/in-depth', label: 'In-Depth' },
    ]},
    { id: 'remediation',label: 'Remediation',     icon: 'navbar-remediation', children: [
        { id: 'remediation/queue',  label: 'Queue' },
        { id: 'remediation/closed', label: 'Closed' },
    ]},
  ];

  const activeParent = current?.split('/')[0];
  const activeChild  = current;
  const [openIds, setOpenIds] = useState(() => new Set([activeParent]));

  const toggle = (id) => setOpenIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const width = collapsed ? 52 : 220;

  return (
    <aside className="leftnav" style={{ width }}>
      <div className={`leftnav__header${collapsed ? ' leftnav__header--collapsed' : ''}`}>
        {!collapsed && (
          <div className="leftnav__org">
            <div className="leftnav__org-name-row">
              <div className="leftnav__org-name">EM Dashboard</div>
              <Ic size={12} path={<><path d="m6 9 6 6 6-6"/></>}/>
            </div>
            <div className="leftnav__org-sub">Exposure Management</div>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          title={collapsed ? 'Expand' : 'Collapse'}
          className="leftnav__toggle-btn"
        >
          <Ic size={12} path={collapsed
            ? <><path d="m9 18 6-6-6-6"/></>
            : <><path d="m15 18-6-6 6-6"/></>
          } />
        </button>
      </div>

      <div className="leftnav__body">
        {model.map(item => (
          <React.Fragment key={item.id}>
            <NavItem
              item={item}
              collapsed={collapsed}
              isActiveParent={activeParent === item.id}
              activeChild={activeChild}
              isOpen={openIds.has(item.id)}
              onToggle={() => toggle(item.id)}
              onNav={onNav}
            />
            {item.dividerAfter && <div className="leftnav__divider" />}
          </React.Fragment>
        ))}
      </div>
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
          style={{ flexShrink: 0,
            filter: isActiveParent
              ? 'brightness(0) saturate(100%) invert(37%) sepia(76%) saturate(700%) hue-rotate(218deg) brightness(97%)'
              : 'grayscale(20%) opacity(0.78)' }}
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
