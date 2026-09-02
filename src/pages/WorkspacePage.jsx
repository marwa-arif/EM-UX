import React, { useState, useRef, useEffect } from 'react'
import '../styles/shell.css'
import '../styles/filter-panel.css'
import Topbar from '../components/Topbar.jsx'
import { LeftNavHybrid } from '../components/LeftNavAlt.jsx'
import SubHeader from '../components/SubHeader.jsx'
import { FilterPanel } from '../components/FilterPanel.jsx'
import { WorkspaceProvider } from '../context/WorkspaceCtx.jsx'
import LibraryPage from './LibraryPage.jsx'
import SavedPage, { SAVED_ROWS } from './SavedPage.jsx'
import DashboardCanvas, { EXEC_SUMMARY_TEMPLATE, VULN_DETAIL_TEMPLATE, MOM_TEMPLATE } from './DashboardCanvas.jsx'
import DataConfigPage from './DataConfigPage.jsx'
import ReportPreviewPage from './ReportPreviewPage.jsx'

const DASHBOARD_TITLES = {
  'workspace/dashboard/discover':             'Discover Dashboard',
  'workspace/dashboard/ciso':                 'CISO Dashboard',
  'workspace/dashboard/client-subsidiary':    'Client Subsidiary',
  'workspace/dashboard/device-attack-surface':'Device Attack Surface',
  'workspace/dashboard/risk-mitigation':      'Risk Mitigation Queries',
  'workspace/dashboard/security-gaps':        'Tracked Security Gaps',
}
// Dashboard-template routes map to one of DashboardCanvas's four widget
// templates — several Library cards intentionally reuse the same widget
// set (see DASHBOARD_EDIT_SEED_BY_TEMPLATE in DashboardCanvas.jsx, which
// makes the same reuse when re-editing an already-saved dashboard of these
// types) while still getting their own route/title/badge.
const DASHBOARD_TEMPLATE_IDS = {
  'workspace/dashboard/discover':              'discover',
  'workspace/dashboard/ciso':                  'executive-summary',
  'workspace/dashboard/client-subsidiary':     'executive-summary',
  'workspace/dashboard/device-attack-surface': 'vulnerabilities',
  'workspace/dashboard/risk-mitigation':       'vulnerabilities',
  'workspace/dashboard/security-gaps':         'vulnerabilities',
}
const REPORT_TITLES = {
  'workspace/report/executive-summary': 'Executive Summary',
  'workspace/report/vulnerabilities':   'Detailed Report on Vulnerabilities',
  'workspace/report/month-over-month':  'Month over Month Report',
}

export default function WorkspacePage({ onNav, initialRoute = 'workspace/library', theme = 'light', onToggleTheme, onBuilderApiReady, onOpenCopilotBuilder, rightPanelSlot, rightPanelOpen = false, navigatorActive = false, seedDashboard = null, appMode, onModeChange, initialCollapsed = false }) {
  const [current, setCurrent] = useState(
    initialRoute === 'workspace' ? 'workspace/saved' : initialRoute
  )
  // Remembers whichever workspace list route (Saved or Templates, each
  // optionally locked to -dashboards/-reports, see savedTypeLock below) the
  // user was last on, so "back"/"cancel"/"leave" out of the dashboard/report
  // builder returns to the exact same locked view instead of always landing
  // on the unlocked Saved tab.
  const isListRoute = (id) => /^workspace\/(saved|library)(-dashboards|-reports)?$/.test(id)
  const [listOrigin, setListOrigin] = useState(
    isListRoute(current) ? current : 'workspace/saved'
  )
  const dashboardBuilderRef = useRef(null)
  useEffect(() => { onBuilderApiReady?.(dashboardBuilderRef) }, [])
  // Seeded from App.jsx's own manual-collapse flag (see its `navCollapsed`
  // and the <WorkspacePage initialCollapsed={navCollapsed}> call site) — App
  // and WorkspacePage mount entirely separate LeftNavHybrid/Topbar trees, so
  // without this, navigating here from a manually-collapsed App-tree page
  // (e.g. clicking Workspace on the rail) always reset back to expanded,
  // since this state defaulted to false on every fresh mount.
  const [collapsed, setCollapsed] = useState(initialCollapsed)
  const [navExpandOverride, setNavExpandOverride] = useState(false)
  const [reportFilterOpen, setReportFilterOpen] = useState(false)
  const [reportFilters, setReportFilters] = useState([])
  const [reportFilterCount, setReportFilterCount] = useState(0)
  const [customReportTitles, setCustomReportTitles] = useState({})
  // Set by SavedPage's "Edit" action on a saved dashboard row (see the
  // 'workspace/dashboard/edit-<id>' route below) so DashboardCanvas can seed
  // itself with that dashboard's widgets/scope instead of starting blank.
  const [editDashboardSeed, setEditDashboardSeed] = useState(null)

  // `data` (e.g. the query string LeftNavAlt.jsx's Navigator preview passes
  // for a specific recent chat) has to be forwarded through both branches —
  // dropping it here silently reduces that call to a bare, query-less
  // 'navigator-page' navigation, landing on a blank new chat instead of the
  // chat that was actually clicked.
  const handleNav = (id, data) => {
    if (id === 'exposure/overview' || id === 'home' || !id.startsWith('workspace')) {
      onNav(id, data)
      return
    }
    if (id.startsWith('workspace/report/') && !id.startsWith('workspace/report-preview/')) {
      localStorage.removeItem('pai-excel-warn-dismissed')
    }
    const resolved = id === 'workspace' ? 'workspace/saved' : id
    if (isListRoute(resolved)) {
      setListOrigin(resolved)
    }
    setCurrent(resolved)
    onNav(resolved, data)
  }

  const isEditDashboard   = current.startsWith('workspace/dashboard/edit-')
  const isViewDashboard   = current.startsWith('workspace/dashboard/view-')
  const isSeededDashboard = current.startsWith('workspace/dashboard/new-')
  const isDashboard     = current.startsWith('workspace/dashboard')
  const isReport        = current.startsWith('workspace/report/') && !current.startsWith('workspace/report-preview/')
  const isReportPreview = current.startsWith('workspace/report-preview/')
  const isConfigPage    = current === 'workspace/configure-screen'
  const isReportPage    = isReport || isReportPreview
  // Option 4's Workspace nav section (Dashboards/Report Centre rows) routes
  // here with a -dashboards/-reports suffix instead of a separate page —
  // SavedPage/LibraryPage read this to hide their own All/Dashboards/
  // Reports pill filter and lock the list to just that type.
  const isSavedPage   = current === 'workspace/saved' || current === 'workspace/saved-dashboards' || current === 'workspace/saved-reports'
  const isLibraryPage = current === 'workspace/library' || current === 'workspace/library-dashboards' || current === 'workspace/library-reports'
  const savedTypeLock = !(isSavedPage || isLibraryPage) ? null
    : current.endsWith('-dashboards') ? 'dashboards'
    : current.endsWith('-reports') ? 'reports'
    : null

  // Once the user navigates away from the edit-* route, drop the seed so it
  // isn't mistakenly picked up by the next dashboard opened (e.g. "New
  // Dashboard"). Keyed off the route rather than DashboardCanvas's own mount
  // so it can't race the title/seed read above.
  useEffect(() => {
    if (!isEditDashboard && !isViewDashboard && editDashboardSeed) setEditDashboardSeed(null)
  }, [current])

  // SavedPage's own Edit/View buttons set the seed *before* navigating (see
  // its handleEdit/handleView), so it's already correct by the time this
  // runs. But an edit-*/view-* route can also be reached directly — e.g. the
  // LeftNav's Workspace hover preview (LeftNavAlt.jsx's openSavedItem) opens
  // one from wherever the user currently is, with no seed set at all — so
  // resolve it here from the id in the route whenever it's missing/stale,
  // rather than falling back to a generic "New Dashboard" title.
  useEffect(() => {
    if (!isEditDashboard && !isViewDashboard) return
    const rowId = current.slice(current.lastIndexOf('-') + 1)
    if (editDashboardSeed && editDashboardSeed.id === rowId) return
    const row = SAVED_ROWS.find(r => r.id === rowId)
    if (row) setEditDashboardSeed(row)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current])

  const dashTitle   = (isEditDashboard || isViewDashboard) && editDashboardSeed ? editDashboardSeed.name : (DASHBOARD_TITLES[current] ?? 'New Dashboard')
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

  const templateId  = DASHBOARD_TEMPLATE_IDS[current] ?? reportTemplateId
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
    isDashboard     ? ['Configuration', dashTitle] :
    isReport        ? ['Insights', 'Workspace', reportTitle] :
    isReportPreview ? ['Insights', 'Workspace', reportTitle] :
    isConfigPage    ? ['Insights', 'Workspace', 'Configure Screen'] :
    ['Insights', 'Workspace']

  const pageBreadcrumbClicks =
    isDashboard
      ? [() => handleNav(listOrigin)]
      : isReportPage || isConfigPage
        ? [() => handleNav('exposure/overview'), () => handleNav(listOrigin)]
        : [() => handleNav('exposure/overview')]

  const navCollapsed = (collapsed || rightPanelOpen) && !navExpandOverride

  // Same generalized pin/unpin behavior as App.jsx's toggleNavCollapse.
  const toggleNavCollapse = () => {
    if (navCollapsed) {
      setNavExpandOverride(o => !o)
    } else {
      setNavExpandOverride(false)
      setCollapsed(c => !c)
    }
  }

  return (
    <WorkspaceProvider onNav={handleNav} editDashboardSeed={editDashboardSeed} setEditDashboardSeed={setEditDashboardSeed}>
      <div className="wp-root">
        <Topbar theme={theme} onToggleTheme={onToggleTheme} onNav={handleNav} navigatorActive={navigatorActive} showNavigatorButton navCollapsed={navCollapsed} onToggleNavCollapse={toggleNavCollapse} />
        <div className="wp-body">
          <LeftNavHybrid
            current={current}
            onNav={handleNav}
            collapsed={navCollapsed}
            onToggleCollapse={toggleNavCollapse}
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
                {isSavedPage
                  ? <SavedPage typeLock={savedTypeLock} />
                  : isConfigPage
                    ? <DataConfigPage onOpenCopilotBuilder={onOpenCopilotBuilder} backTarget={listOrigin} />
                    : isDashboard
                      ? <DashboardCanvas ref={dashboardBuilderRef} key={current} onNav={handleNav} templateId={templateId} onOpenCopilotBuilder={onOpenCopilotBuilder} seedWidgets={isSeededDashboard ? seedDashboard?.widgets : undefined} seedName={isSeededDashboard ? seedDashboard?.name : DASHBOARD_TITLES[current]} backTarget={listOrigin} viewMode={isViewDashboard} />
                      : isReport
                        ? <DashboardCanvas ref={dashboardBuilderRef} key={current} onNav={handleNav} reportMode reportTitle={reportTitle} templateId={reportTemplateId} onNameChange={n => setCustomReportTitles(prev => ({ ...prev, [current]: n }))} onOpenCopilotBuilder={onOpenCopilotBuilder} backTarget={listOrigin} />
                        : isReportPreview
                          ? <ReportPreviewPage
                              reportTitle={reportTitle}
                              reportFilters={reportFilters}
                              template={reportTemplate}
                              onBack={() => handleNav(previewBack)}
                            />
                          : <LibraryPage typeLock={savedTypeLock} />
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
