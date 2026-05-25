import React, { useState } from 'react'
import Topbar from '../components/Topbar.jsx'
import LeftNav from '../components/LeftNav.jsx'
import SubHeader from '../components/SubHeader.jsx'
import { WorkspaceProvider } from '../context/WorkspaceCtx.jsx'
import LibraryPage from './LibraryPage.jsx'
import SavedPage from './SavedPage.jsx'
import DashboardCanvas from './DashboardCanvas.jsx'
import DataConfigPage from './DataConfigPage.jsx'

const DASHBOARD_TITLES = {
  'workspace/dashboard/discover': 'Discover Dashboard',
}

export default function WorkspacePage({ onNav, initialRoute = 'workspace/library', theme = 'light', onToggleTheme }) {
  const [current, setCurrent] = useState(
    initialRoute === 'workspace' ? 'workspace/library' : initialRoute
  )
  const [collapsed, setCollapsed] = useState(false)

  const handleNav = (id) => {
    if (id === 'kg' || id === 'home' || !id.startsWith('workspace')) {
      onNav(id)
      return
    }
    setCurrent(id)
  }

  const isDashboard  = current.startsWith('workspace/dashboard')
  const isConfigPage = current === 'workspace/configure-screen'
  const dashTitle    = DASHBOARD_TITLES[current] ?? 'New Dashboard'
  const templateId   = current === 'workspace/dashboard/discover' ? 'discover' : null

  return (
    <WorkspaceProvider onNav={handleNav}>
      <div style={{
        display: 'flex', flexDirection: 'column',
        height: '100vh', overflow: 'hidden',
        fontFamily: "'Inter', system-ui",
        color: 'var(--pai-fg1)', background: 'var(--shell-bg)',
      }}>
        <Topbar theme={theme} onToggleTheme={onToggleTheme} />
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
              title={
                isDashboard  ? dashTitle :
                isConfigPage ? 'Configure Screen' :
                'Workspace'
              }
              breadcrumb={
                isDashboard  ? ['Home', 'Workspace', dashTitle] :
                isConfigPage ? ['Home', 'Workspace', 'Configure Screen'] :
                ['Home', 'Workspace']
              }
              breadcrumbClicks={
                isDashboard  ? [() => handleNav('kg'), () => handleNav('workspace/library')] :
                isConfigPage ? [() => handleNav('kg'), () => handleNav('workspace/library')] :
                [() => handleNav('kg')]
              }
              actions={null}
              showMenu={false}
              showExplore={false}
            />
            {current === 'workspace/saved'
              ? <SavedPage />
              : isConfigPage
                ? <DataConfigPage />
                : isDashboard
                  ? <DashboardCanvas key={current} onNav={handleNav} templateId={templateId} />
                  : <LibraryPage />
            }
          </main>
        </div>
      </div>
    </WorkspaceProvider>
  )
}
