import React, { useState } from 'react'
import { PAI, Ic } from './ui.jsx'

function LeftNav({ current, onNav, collapsed, onToggleCollapse }) {
  const model = [
    { id: 'workspace',  label: 'Workspace',       icon: 'navbar-workspace', dividerAfter: true },
    { id: 'exposure',   label: 'Exposure',        icon: 'navbar-exposure',   children: [
        { id: 'exposure/overview', label: 'Overview' },
        { id: 'exposure/trend',    label: 'Trend' },
    ]},
    { id: 'discover',   label: 'Discover',        icon: 'navbar-discover',   children: [
        { id: 'discover/assets',   label: 'Assets' },
        { id: 'discover/scan',     label: 'Scan' },
    ]},
    { id: 'report',     label: 'Report',          icon: 'navbar-report',     children: [
        { id: 'report/board',      label: 'Board view' },
        { id: 'report/compliance', label: 'Compliance' },
    ]},
    { id: 'kg',         label: 'Knowledge Graph', icon: 'navbar-kg',         solo: true },
    { id: 'dq',         label: 'Data Quality',    icon: 'navbar-data quality', children: [
        { id: 'dq/issues',   label: 'Issues' },
        { id: 'dq/coverage', label: 'Coverage' },
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
    <aside style={{
      width, flexShrink: 0,
      background: 'var(--shell-bg, #F7F9FC)',
      borderRight: '1px solid var(--shell-border, #E6E6E6)',
      display: 'flex', flexDirection: 'column',
      transition: 'width 180ms cubic-bezier(.2,.8,.2,1)',
      overflow: 'hidden',
    }}>
      <div style={{
        height: 48, boxSizing: 'border-box',
        padding: collapsed ? '0 10px' : '0 14px',
        display: 'flex', alignItems: 'center', gap: 8,
        borderBottom: '1px solid #EFEFEF',
        flexShrink: 0,
      }}>
        {!collapsed && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display:'flex', alignItems:'center', gap: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: PAI.fg1, lineHeight: 1.2 }}>EM Dashboard</div>
              <Ic size={12} path={<><path d="m6 9 6 6 6-6"/></>}/>
            </div>
            <div style={{ fontSize: 11, color: PAI.fg3, marginTop: 2 }}>Exposure Management</div>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          title={collapsed ? 'Expand' : 'Collapse'}
          style={{
            width: 24, height: 24, padding: 0,
            border: '1px solid #E6E6E6', background: '#fff',
            color: PAI.fg3, cursor: 'pointer', borderRadius: 6,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Ic size={12} path={collapsed
            ? <><path d="m9 18 6-6-6-6"/></>
            : <><path d="m15 18-6-6 6-6"/></>
          } />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
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
            {item.dividerAfter && (
              <div style={{ margin: '6px 12px', borderTop: '1px solid #EFEFEF' }} />
            )}
          </React.Fragment>
        ))}
      </div>
    </aside>
  );
}

function NavItem({ item, collapsed, isActiveParent, activeChild, isOpen, onToggle, onNav }) {
  const [hover, setHover] = useState(false);
  const hasChildren = item.children && item.children.length;
  const isSelected = isActiveParent;

  // Knowledge Graph & Home: solo items behave like leaf
  const treatAsLeaf = !hasChildren;

  const parentBg = isSelected ? 'rgba(99,96,216,0.08)' : hover ? 'rgba(0,0,0,0.04)' : 'transparent';
  const parentColor = isSelected ? PAI.indigo : PAI.fg2;
  const parentWeight = isSelected ? 500 : 400;

  const handleClick = () => {
    if (treatAsLeaf) onNav(item.id);
    else { onToggle(); if (!isActiveParent) onNav(item.children[0].id); }
  };

  return (
    <div style={{ padding: '0 8px', marginBottom: 1 }}>
      <button
        onClick={handleClick}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        title={collapsed ? item.label : undefined}
        style={{
          display: 'flex', alignItems: 'center', gap: 10, width: '100%',
          padding: collapsed ? '7px 8px' : '7px 10px',
          background: parentBg, color: parentColor,
          border: 'none', borderRadius: 6,
          cursor: 'pointer', textAlign: 'left',
          fontSize: 12, fontWeight: parentWeight, fontFamily: 'inherit',
          transition: 'background 120ms cubic-bezier(.2,.8,.2,1)',
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}
      >
        <img
          src={`assets/icons/${item.icon}.svg`}
          width={16} height={16}
          style={{ flexShrink: 0,
            filter: isSelected
              ? 'brightness(0) saturate(100%) invert(37%) sepia(76%) saturate(700%) hue-rotate(218deg) brightness(97%)'
              : 'grayscale(20%) opacity(0.78)' }}
          alt=""
        />
        {!collapsed && (
          <>
            <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>
            {hasChildren && (
              <span style={{
                display: 'inline-flex', color: PAI.fg3,
                transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 150ms cubic-bezier(.2,.8,.2,1)',
              }}>
                <Ic size={12} path={<><path d="m6 9 6 6 6-6"/></>}/>
              </span>
            )}
          </>
        )}
      </button>

      {!collapsed && hasChildren && (
        <div style={{
          overflow: 'hidden',
          maxHeight: isOpen ? item.children.length * 30 : 0,
          transition: 'max-height 220ms cubic-bezier(.2,.8,.2,1)',
        }}>
          {item.children.map(c => {
            const active = activeChild === c.id;
            return (
              <button
                key={c.id}
                onClick={() => onNav(c.id)}
                style={{
                  display: 'flex', alignItems: 'center', width: '100%', height: 28,
                  paddingLeft: 38, paddingRight: 10,
                  background: active ? 'rgba(99,96,216,0.08)' : 'transparent',
                  color: active ? PAI.indigo : PAI.fg3,
                  border: 'none', borderRadius: 6,
                  cursor: 'pointer', textAlign: 'left',
                  fontSize: 12, fontWeight: active ? 500 : 400, fontFamily: 'inherit', marginTop: 1,
                  transition: 'background 120ms cubic-bezier(.2,.8,.2,1)',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(0,0,0,0.04)'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
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
