import React, { useState } from 'react'
import Topbar from '../components/Topbar.jsx'
import LeftNav from '../components/LeftNav.jsx'
import SubHeader from '../components/SubHeader.jsx'
import { WorkspaceProvider } from '../context/WorkspaceCtx.jsx'
import LibraryPage from './LibraryPage.jsx'
import SavedPage from './SavedPage.jsx'
import DashboardCanvas from './DashboardCanvas.jsx'

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
        color: 'var(--pai-fg1)', background: 'var(--shell-bg)',
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
            background: 'var(--ctrl-bg)',
          }}>
            <SubHeader
              title={current.startsWith('workspace/dashboard') ? 'New Dashboard' : 'Workspace'}
              breadcrumb={current.startsWith('workspace/dashboard')
                ? ['Dashboard', 'Workspace', 'New Dashboard']
                : ['Dashboard', 'Workspace']
              }
              breadcrumbClicks={current.startsWith('workspace/dashboard')
                ? [() => handleNav('kg'), () => handleNav('workspace/library')]
                : [() => handleNav('kg')]
              }
              actions={null}
              showMenu={false}
              showExplore={false}
            />
            {current === 'workspace/saved'
              ? <SavedPage />
              : current.startsWith('workspace/dashboard')
                ? <DashboardCanvas onNav={handleNav} />
                : <LibraryPage />
            }
          </main>
        </div>
      </div>
    </WorkspaceProvider>
  )
}
