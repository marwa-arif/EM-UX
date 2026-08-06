import React, { useState, useRef, useEffect } from 'react'
import '../styles/shell.css'
import '../styles/filter-panel.css'
import Topbar from '../components/Topbar.jsx'
import LeftNav from '../components/LeftNav.jsx'
import SubHeader from '../components/SubHeader.jsx'
import { FilterPanel } from '../components/FilterPanel.jsx'
import { WorkspaceProvider } from '../context/WorkspaceCtx.jsx'
import LibraryPage from './LibraryPage.jsx'
import SavedPage from './SavedPage.jsx'
import DashboardCanvas, { EXEC_SUMMARY_TEMPLATE, VULN_DETAIL_TEMPLATE, MOM_TEMPLATE } from './DashboardCanvas.jsx'
import DataConfigPage from './DataConfigPage.jsx'
import ReportPreviewPage from './ReportPreviewPage.jsx'

const DASHBOARD_TITLES = {
  'workspace/dashboard/discover': 'Discover Dashboard',
}
const REPORT_TITLES = {
  'workspace/report/executive-summary': 'Executive Summary',
  'workspace/report/vulnerabilities':   'Detailed Report on Vulnerabilities',
  'workspace/report/month-over-month':  'Month over Month Report',
}

export default function WorkspacePage({ onNav, initialRoute = 'workspace/library', theme = 'light', onToggleTheme, onBuilderApiReady, onOpenCopilotBuilder, rightPanelSlot, rightPanelOpen = false, navigatorActive = false, seedDashboard = null, appMode, onModeChange }) {
  const [current, setCurrent] = useState(
    initialRoute === 'workspace' ? 'workspace/saved' : initialRoute
  )
  // Remembers whichever workspace list tab (Saved or Templates) the user was
  // last on, so "back"/"cancel"/"leave" out of the dashboard/report builder
  // returns to where they came from instead of always landing on Saved.
  const [listOrigin, setListOrigin] = useState(
    current === 'workspace/library' ? 'workspace/library' : 'workspace/saved'
  )
  const dashboardBuilderRef = useRef(null)
  useEffect(() => { onBuilderApiReady?.(dashboardBuilderRef) }, [])
  const [collapsed, setCollapsed] = useState(false)
  const [navExpandOverride, setNavExpandOverride] = useState(false)
  const [reportFilterOpen, setReportFilterOpen] = useState(false)
  const [reportFilters, setReportFilters] = useState([])
  const [reportFilterCount, setReportFilterCount] = useState(0)
  const [customReportTitles, setCustomReportTitles] = useState({})
  // Set by SavedPage's "Edit" action on a saved dashboard row (see the
  // 'workspace/dashboard/edit-<id>' route below) so DashboardCanvas can seed
  // itself with that dashboard's widgets/scope instead of starting blank.
  const [editDashboardSeed, setEditDashboardSeed] = useState(null)

  const handleNav = (id) => {
    if (id === 'exposure/overview' || id === 'home' || !id.startsWith('workspace')) {
      onNav(id)
      return
    }
    if (id.startsWith('workspace/report/') && !id.startsWith('workspace/report-preview/')) {
      localStorage.removeItem('pai-excel-warn-dismissed')
    }
    const resolved = id === 'workspace' ? 'workspace/saved' : id
    if (resolved === 'workspace/saved' || resolved === 'workspace/library') {
      setListOrigin(resolved)
    }
    setCurrent(resolved)
    onNav(resolved)
  }

  const isEditDashboard   = current.startsWith('workspace/dashboard/edit-')
  const isSeededDashboard = current.startsWith('workspace/dashboard/new-')
  const isDashboard     = current.startsWith('workspace/dashboard')
  const isReport        = current.startsWith('workspace/report/') && !current.startsWith('workspace/report-preview/')
  const isReportPreview = current.startsWith('workspace/report-preview/')
  const isConfigPage    = current === 'workspace/configure-screen'
  const isReportPage    = isReport || isReportPreview

  // Once the user navigates away from the edit-* route, drop the seed so it
  // isn't mistakenly picked up by the next dashboard opened (e.g. "New
  // Dashboard"). Keyed off the route rather than DashboardCanvas's own mount
  // so it can't race the title/seed read above.
  useEffect(() => {
    if (!isEditDashboard && editDashboardSeed) setEditDashboardSeed(null)
  }, [current])

  const dashTitle   = isEditDashboard && editDashboardSeed ? editDashboardSeed.name : (DASHBOARD_TITLES[current] ?? 'New Dashboard')
  const reportTitle = isReport
    ? (customReportTitles[current] ?? REPORT_TITLES[current] ?? 'Report Template')
    : isReportPreview
      ? (customReportTitles[current.replace('report-preview', 'report')] ?? REPORT_TITLES[current.replace('report-preview', 'report')] ?? 'Report Template')
      : 'Report Template'

  const reportRouteKey = isReport ? current : current.replace('report-preview', 'report')
  const reportTemplateId =
    reportRouteKey === 'workspace/report/vulnerabilities'  ? 'vulnerabilities' :
    reportRouteKey === 'workspace/report/month-over-month' ? 'month-over-month' :
    reportRouteKey === 'workspace/report/executive-summary' ? 'executive-summary' : null
  const reportTemplate =
    reportTemplateId === 'vulnerabilities'  ? VULN_DETAIL_TEMPLATE :
    reportTemplateId === 'month-over-month' ? MOM_TEMPLATE :
    EXEC_SUMMARY_TEMPLATE

  const templateId  = current === 'workspace/dashboard/discover' ? 'discover' : reportTemplateId
  const previewBack = current.replace('report-preview', 'report')

  const handleRemoveFilter = (idx) => {
    const updated = reportFilters.filter((_, i) => i !== idx)
    setReportFilters(updated)
    setReportFilterCount(new Set(updated.map(c => c.attrId)).size)
  }
  const handleClearFilters = () => { setReportFilters([]); setReportFilterCount(0) }
  const handleApplyFilters = (count, chips) => {
    setReportFilterCount(count)
    setReportFilters(chips || [])
    setReportFilterOpen(false)
  }

  const pageTitle =
    isDashboard     ? dashTitle :
    isReport        ? reportTitle :
    isReportPreview ? reportTitle :
    isConfigPage    ? 'Configure Screen' :
    'Workspace'

  const pageBreadcrumb =
    isDashboard     ? ['Home', 'Workspace', dashTitle] :
    isReport        ? ['Home', 'Workspace', reportTitle] :
    isReportPreview ? ['Home', 'Workspace', reportTitle] :
    isConfigPage    ? ['Home', 'Workspace', 'Configure Screen'] :
    ['Home', 'Workspace']

  const pageBreadcrumbClicks =
    isDashboard || isReportPage || isConfigPage
      ? [() => handleNav('exposure/overview'), () => handleNav(listOrigin)]
      : [() => handleNav('exposure/overview')]

  return (
    <WorkspaceProvider onNav={handleNav} editDashboardSeed={editDashboardSeed} setEditDashboardSeed={setEditDashboardSeed}>
      <div className="wp-root">
        <Topbar theme={theme} onToggleTheme={onToggleTheme} onNav={handleNav} navigatorActive={navigatorActive} showNavigatorButton />
        <div className="wp-body">
          <LeftNav
            current={current}
            onNav={handleNav}
            collapsed={(collapsed || rightPanelOpen) && !navExpandOverride}
            onToggleCollapse={() => { setNavExpandOverride(false); setCollapsed(c => !c) }}
            onExpand={() => setNavExpandOverride(true)}
            mode={appMode}
            onModeChange={onModeChange}
          />
          <main className="wp-main">
            <SubHeader
              title={pageTitle}
              breadcrumb={pageBreadcrumb}
              breadcrumbClicks={pageBreadcrumbClicks}
              actions={isReportPage ? undefined : null}
              pageId={isReportPage ? 'workspace/report' : undefined}
              activeFilters={isReportPage ? reportFilters : []}
              activeFilterCount={isReportPage ? reportFilterCount : 0}
              onRemoveFilter={handleRemoveFilter}
              onClearFilters={handleClearFilters}
              onFilter={isReport ? () => setReportFilterOpen(o => !o) : undefined}
              filterActive={reportFilterOpen}
              showMenu={false}
              showExplore={false}
            />
            <div className="wp-main-body">
              <div className="wp-main-content">
                {current === 'workspace/saved'
                  ? <SavedPage />
                  : isConfigPage
                    ? <DataConfigPage onOpenCopilotBuilder={onOpenCopilotBuilder} backTarget={listOrigin} />
                    : isDashboard
                      ? <DashboardCanvas ref={dashboardBuilderRef} key={current} onNav={handleNav} templateId={templateId} onOpenCopilotBuilder={onOpenCopilotBuilder} seedWidgets={isSeededDashboard ? seedDashboard?.widgets : undefined} seedName={isSeededDashboard ? seedDashboard?.name : undefined} backTarget={listOrigin} />
                      : isReport
                        ? <DashboardCanvas ref={dashboardBuilderRef} key={current} onNav={handleNav} reportMode reportTitle={reportTitle} templateId={reportTemplateId} onNameChange={n => setCustomReportTitles(prev => ({ ...prev, [current]: n }))} onOpenCopilotBuilder={onOpenCopilotBuilder} backTarget={listOrigin} />
                        : isReportPreview
                          ? <ReportPreviewPage
                              reportTitle={reportTitle}
                              reportFilters={reportFilters}
                              template={reportTemplate}
                              onBack={() => handleNav(previewBack)}
                            />
                          : <LibraryPage />
                }
              </div>
              {isReport && (
                <div className="wp-filter-drawer" style={{ width: reportFilterOpen ? 400 : 0 }}>
                  <div className="wp-filter-drawer__inner">
                    {reportFilterOpen && (
                      <FilterPanel
                        embedded
                        pageId="workspace/report"
                        onClose={() => setReportFilterOpen(false)}
                        onApply={handleApplyFilters}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          </main>
          {rightPanelSlot}
        </div>
      </div>
    </WorkspaceProvider>
  )
}
