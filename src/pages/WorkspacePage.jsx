import React, { useState } from 'react'
import { PAI, Ic } from '../ui.jsx'
import Topbar from '../components/Topbar.jsx'
import LeftNav from '../components/LeftNav.jsx'
import { WorkspaceProvider } from '../context/WorkspaceCtx.jsx'
import LibraryPage from './LibraryPage.jsx'
import SavedPage from './SavedPage.jsx'

const KG_ROUTE = 'kg'

function WorkspaceSubHeader({ onNav }) {
  return (
    <div style={{
      height: 48, flexShrink: 0,
      background: 'var(--shell-bg)',
      borderBottom: '1px solid var(--shell-border)',
      display: 'flex', alignItems: 'center',
      padding: '0 20px', gap: 12,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: PAI.fg1, lineHeight: 1.2 }}>Workspace</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: PAI.fg3, marginTop: 2 }}>
          <span
            style={{ color: PAI.fg3, cursor: 'pointer' }}
            onClick={() => onNav(KG_ROUTE)}
            onMouseEnter={e => e.currentTarget.style.color = PAI.indigo}
            onMouseLeave={e => e.currentTarget.style.color = PAI.fg3}
          >Dashboard</span>
          <span>›</span>
          <span style={{ color: PAI.indigo, fontWeight: 500 }}>Workspace</span>
        </div>
      </div>

      <button style={{
        height: 28, padding: '0 10px',
        background: 'transparent', border: `1px solid ${PAI.borderStrong}`,
        borderRadius: 44, cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        color: PAI.fg2,
      }}>
        <Ic size={14} path={<><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>} />
      </button>

      <button style={{
        height: 28, padding: '0 12px',
        background: 'transparent', border: `1px solid ${PAI.borderStrong}`,
        borderRadius: 44, cursor: 'pointer',
        fontSize: 12, fontWeight: 500, fontFamily: 'inherit',
        display: 'inline-flex', alignItems: 'center', gap: 6,
        color: PAI.fg2,
      }}>
        <Ic size={12} path={<><path d="M15 3h6v6M10 14 21 3M21 14v7H3V3h7"/></>} />
        Explore in
        <Ic size={11} path={<><path d="m6 9 6 6 6-6"/></>} />
      </button>
    </div>
  )
}

export default function WorkspacePage({ onNav }) {
  const [current, setCurrent] = useState('workspace/library')
  const [collapsed, setCollapsed] = useState(false)

  const handleNav = (id) => {
    if (id === 'kg' || id === 'home' || !id.startsWith('workspace')) {
      onNav(id)
      return
    }
    setCurrent(id)
  }

  return (
    <WorkspaceProvider onNav={handleNav}>
      <div style={{
        display: 'flex', flexDirection: 'column',
        height: '100vh', overflow: 'hidden',
        fontFamily: "'Inter', system-ui",
        color: PAI.fg1, background: 'var(--shell-bg, #F7F9FC)',
      }}>
        <Topbar />
        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          <LeftNav
            current={current}
            onNav={handleNav}
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed(c => !c)}
          />
          <main style={{
            flex: 1, minWidth: 0,
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
            background: '#F7F9FC',
          }}>
            <WorkspaceSubHeader onNav={handleNav} />
            {current === 'workspace/saved' ? <SavedPage /> : <LibraryPage />}
          </main>
        </div>
      </div>
    </WorkspaceProvider>
  )
}
