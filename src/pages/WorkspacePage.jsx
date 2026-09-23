import React, { useState, useRef, useEffect, useMemo } from 'react'
import '../styles/shell.css'
import '../styles/filter-panel.css'
import Topbar from '../components/Topbar.jsx'
import CopilotFab from '../components/CopilotFab.jsx'
import { LeftNavHybrid } from '../components/LeftNavAlt.jsx'
import { INSIGHTS_MODEL, withSavedDashboards } from '../components/LeftNav.jsx'
import SubHeader from '../components/SubHeader.jsx'
import { FilterPanel } from '../components/FilterPanel.jsx'
import { buildDashboardScopeImplicitConfig } from '../components/ActiveFilterPanel.jsx'
import { WorkspaceProvider } from '../context/WorkspaceCtx.jsx'
import { useSavedDashboards } from '../context/SavedDashboardsCtx.jsx'
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

// A dashboard id is `d-<timestamp>` for anything actually saved this session
// (see DashboardCanvas.jsx's handleDashboardSaved) — it contains a hyphen of
// its own, so `route.slice(route.lastIndexOf('-') + 1)` grabs only the
// numeric suffix after that inner hyphen, never the real id. Stripping the
// known route prefix instead works regardless of what the id itself looks
// like (mock SAVED_ROWS ids, with no hyphen, worked with the old approach by
// coincidence — that's what hid this).
const EDIT_ROUTE_PREFIX = 'workspace/dashboard/edit-'
const VIEW_ROUTE_PREFIX = 'workspace/dashboard/view-'
const dashboardIdFromRoute = (route) =>
  route.startsWith(EDIT_ROUTE_PREFIX) ? route.slice(EDIT_ROUTE_PREFIX.length)
  : route.startsWith(VIEW_ROUTE_PREFIX) ? route.slice(VIEW_ROUTE_PREFIX.length)
  : null

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
  // Sourced from the same app-wide store App.jsx's own LeftNavHybrid reads
  // (see SavedDashboardsCtx.jsx) — not useWorkspace(), which isn't callable
  // here since WorkspaceProvider only wraps this component's returned JSX,
  // not its own function body.
  const { savedDashboards, customSections } = useSavedDashboards()
  const insightsModel = useMemo(() => withSavedDashboards(INSIGHTS_MODEL, savedDashboards, customSections), [savedDashboards, customSections])
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
  // Raw traversal chains from a report viewer's own ad-hoc Graph Filter — see
  // dashboardFilterPaths below for the dashboard-view equivalent.
  const [reportFilterPaths, setReportFilterPaths] = useState([])
  // Ad-hoc filters a viewer adds on top of a saved dashboard's own scope (see
  // dashboardImplicitConfig below) — kept separate from reportFilters since a
  // dashboard view and a report preview are reached via different routes and
  // shouldn't share state when the user bounces between them.
  const [dashboardFilterOpen, setDashboardFilterOpen] = useState(false)
  const [dashboardFilters, setDashboardFilters] = useState([])
  const [dashboardFilterCount, setDashboardFilterCount] = useState(0)
  // Raw traversal chains (e.g. [['host','vulnerability']]) from a viewer's own
  // ad-hoc Graph Filter — kept alongside dashboardFilters' flattened chips so
  // ActiveFilterPanel can render the relationship as a nested tree instead of
  // a flat, mislabeled "Graph Filter" chip (see buildDashboardScopeImplicitConfig
  // for the equivalent on the dashboard's own saved scope).
  const [dashboardFilterPaths, setDashboardFilterPaths] = useState([])
  const [customReportTitles, setCustomReportTitles] = useState({})
  // Set by SavedPage's "Edit" action on a saved dashboard row (see the
  // 'workspace/dashboard/edit-<id>' route below) so DashboardCanvas can seed
  // itself with that dashboard's widgets/scope instead of starting blank.
  const [editDashboardSeed, setEditDashboardSeed] = useState(null)

  // Set right before replaying a nav the user already confirmed through the
  // dashboard/report builder's own "Discard unsaved changes?" modal (see
  // guardNav below), so that replay isn't gated a second time.
  const bypassNavGuardRef = useRef(false)

  // `data` (e.g. the query string LeftNavAlt.jsx's Navigator preview passes
  // for a specific recent chat) has to be forwarded through both branches —
  // dropping it here silently reduces that call to a bare, query-less
  // 'navigator-page' navigation, landing on a blank new chat instead of the
  // chat that was actually clicked.
  const handleNav = (id, data) => {
    const resolved = id === 'workspace' ? 'workspace/saved' : id
    // Mid-creating/editing a dashboard or report renders DashboardCanvas —
    // switching to any other destination (a different LeftNav section,
    // another saved dashboard, even leaving Workspace entirely) would
    // otherwise unmount it silently. Route that switch through the same
    // discard-confirm modal the canvas's own Back button uses, unless this
    // call is itself the confirmed replay.
    const isBuilderRoute = (current.startsWith('workspace/dashboard') && !current.startsWith('workspace/dashboard/view-')) ||
      (current.startsWith('workspace/report/') && !current.startsWith('workspace/report-preview/'))

    // The CopilotFab bubble (id 'navigator', always floating over the canvas)
    // is meant to work side by side with the canvas while building — it
    // opens the same inline guided-builder panel as this canvas's own
    // "Ask AI" button (onOpenCopilotBuilder), not the standalone floating
    // Navigator panel, and skips the discard-unsaved-changes prompt below
    // since nothing is actually being navigated away from.
    // The LeftNav's plain "Navigator" item is a different affordance — it
    // fires 'navigator-page' (its navigateId, see TOP_ITEMS in LeftNav.jsx)
    // and is real top-level navigation like any other LeftNav destination,
    // so it must NOT be caught here: it falls through to the normal
    // discard-confirm guard just below, then actually navigates to Navigator.
    if (id === 'navigator' && isBuilderRoute) {
      onOpenCopilotBuilder?.({})
      return
    }

    if (!bypassNavGuardRef.current && isBuilderRoute && resolved !== current) {
      const api = dashboardBuilderRef.current
      if (api?.guardNav && !api.guardNav(() => { bypassNavGuardRef.current = true; handleNav(id, data) })) {
        return
      }
    }
    bypassNavGuardRef.current = false

    if (id === 'exposure/overview' || id === 'home' || !id.startsWith('workspace')) {
      onNav(id, data)
      return
    }
    if (id.startsWith('workspace/report/') && !id.startsWith('workspace/report-preview/')) {
      localStorage.removeItem('pai-excel-warn-dismissed')
    }
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

  // Ad-hoc dashboard filters are per-viewing-session, not persisted with the
  // dashboard — drop them once the user leaves this saved dashboard's view
  // route so reopening it (or a different one) starts clean.
  useEffect(() => {
    if (!isViewDashboard && dashboardFilters.length) handleClearDashboardFilters()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current])

  // SavedPage's own Edit/View buttons set the seed *before* navigating (see
  // its handleEdit/handleView), so it's already correct by the time
  // DashboardCanvas below ever mounts. But an edit-*/view-* route can also be
  // reached directly — e.g. the left-nav "···" menu's Edit action on a
  // dashboard pinned to a nav section (App.jsx), or a LeftNav hover-preview —
  // with no seed set at all. This used to resolve that fallback in a
  // useEffect, but that's too late: DashboardCanvas captures whatever
  // editDashboardSeed it sees on its own first render into a one-time
  // useState, so by the time an effect (which only runs after commit) could
  // correct it, DashboardCanvas has already latched onto the stale null and
  // rendered a blank "New Dashboard" — and short of `current` changing again,
  // never picks up the fix. Resolving it synchronously during render instead
  // means DashboardCanvas's very first render already sees the right value.
  // savedDashboards (the real store) takes precedence over SAVED_ROWS (the
  // hardcoded mock rows) — a real saved dashboard's id is never one of the
  // mock ids, but checking savedDashboards first keeps this correct if that
  // ever changes.
  const resolvedEditSeed = (() => {
    if (!isEditDashboard && !isViewDashboard) return editDashboardSeed
    const rowId = dashboardIdFromRoute(current)
    if (editDashboardSeed && editDashboardSeed.id === rowId) return editDashboardSeed
    return savedDashboards.find(r => r.id === rowId) ?? SAVED_ROWS.find(r => r.id === rowId) ?? null
  })()

  const dashTitle   = (isEditDashboard || isViewDashboard) && resolvedEditSeed ? resolvedEditSeed.name : (DASHBOARD_TITLES[current] ?? 'New Dashboard')
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
  const handleClearFilters = () => { setReportFilters([]); setReportFilterCount(0); setReportFilterPaths([]) }
  const handleApplyFilters = (count, chips, paths) => {
    setReportFilterCount(count)
    setReportFilters(chips || [])
    setReportFilterPaths(paths || [])
    setReportFilterOpen(false)
  }

  const handleRemoveDashboardFilter = (idx) => {
    const updated = dashboardFilters.filter((_, i) => i !== idx)
    setDashboardFilters(updated)
    setDashboardFilterCount(new Set(updated.map(c => c.attrId)).size)
  }
  const handleClearDashboardFilters = () => { setDashboardFilters([]); setDashboardFilterCount(0); setDashboardFilterPaths([]) }
  const handleApplyDashboardFilters = (count, chips, paths) => {
    setDashboardFilterCount(count)
    setDashboardFilters(chips || [])
    setDashboardFilterPaths(paths || [])
    setDashboardFilterOpen(false)
  }
  // A saved dashboard's scope (entities + Include/Exclude attributes, set via
  // DashboardCanvas's Dashboard Scope modal) is this view's locked filter set —
  // surfaced the same way Discover's page-level implicit filters are, just
  // computed per-dashboard from what was saved instead of hardcoded per-route.
  const dashboardImplicitConfig = isViewDashboard
    ? buildDashboardScopeImplicitConfig(resolvedEditSeed?.dashboardScopes, resolvedEditSeed?.dashboardScopeAttrs, resolvedEditSeed?.dashboardScopePaths)
    : undefined

  const pageTitle =
    isDashboard     ? dashTitle :
    isReport        ? reportTitle :
    isReportPreview ? reportTitle :
    isConfigPage    ? 'Configure Screen' :
    'Workspace'

  // Any already-saved dashboard being viewed or edited (edit-*/view-*) got
  // here through Workspace > Saved regardless of whether it's also pinned to
  // an Insights section (that pin only decides its left-nav entry, not how
  // this builder page frames itself) — see resolvedEditSeed's own comment
  // above for why edit-/view- always means "an existing saved dashboard"
  // even when reached via a section's pinned-dashboard Edit action. Only a
  // brand-new, not-yet-saved dashboard (new-*) has no Saved-list membership
  // yet, so it keeps the generic Configuration breadcrumb below.
  const isWorkspaceDashboard = isEditDashboard || isViewDashboard

  // The plain Workspace list (Saved/Library) is a top-level section of its
  // own, not nested under Insights — unlike the dashboard/report builder
  // sub-pages below, it gets no breadcrumb trail at all, just its title.
  const pageBreadcrumb =
    isWorkspaceDashboard ? ['Workspace', 'Saved', dashTitle] :
    isDashboard     ? ['Configuration', dashTitle] :
    isReport        ? ['Insights', 'Workspace', reportTitle] :
    isReportPreview ? ['Insights', 'Workspace', reportTitle] :
    isConfigPage    ? ['Insights', 'Workspace', 'Configure Screen'] :
    undefined

  const pageBreadcrumbClicks =
    isWorkspaceDashboard
      ? [() => handleNav('workspace/saved'), () => handleNav(listOrigin)]
      : isDashboard
        ? [() => handleNav(listOrigin)]
        : isReportPage || isConfigPage
          ? [() => handleNav('exposure/overview'), () => handleNav(listOrigin)]
          : undefined

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
    <WorkspaceProvider onNav={handleNav} editDashboardSeed={resolvedEditSeed} setEditDashboardSeed={setEditDashboardSeed}>
      <div className="wp-root">
        <Topbar theme={theme} onToggleTheme={onToggleTheme} onNav={handleNav} navCollapsed={navCollapsed} onToggleNavCollapse={toggleNavCollapse} />
        <div className="wp-body">
          <LeftNavHybrid
            current={current}
            onNav={handleNav}
            collapsed={navCollapsed}
            onToggleCollapse={toggleNavCollapse}
            mode={appMode}
            onModeChange={onModeChange}
            insightsModel={insightsModel}
          />
          <main className="wp-main">
            <SubHeader
              title={pageTitle}
              breadcrumb={pageBreadcrumb}
              breadcrumbClicks={pageBreadcrumbClicks}
              actions={(isReportPage || isViewDashboard) ? undefined : null}
              pageId={isReportPage ? 'workspace/report' : undefined}
              implicitConfig={dashboardImplicitConfig}
              graphFilterPaths={isReportPage ? reportFilterPaths : isViewDashboard ? dashboardFilterPaths : undefined}
              activeFilters={isReportPage ? reportFilters : isViewDashboard ? dashboardFilters : []}
              activeFilterCount={isReportPage ? reportFilterCount : isViewDashboard ? dashboardFilterCount : 0}
              onRemoveFilter={isViewDashboard ? handleRemoveDashboardFilter : handleRemoveFilter}
              onClearFilters={isViewDashboard ? handleClearDashboardFilters : handleClearFilters}
              onFilter={isReport ? () => setReportFilterOpen(o => !o) : isViewDashboard ? () => setDashboardFilterOpen(o => !o) : undefined}
              filterActive={isReport ? reportFilterOpen : isViewDashboard ? dashboardFilterOpen : false}
              onEdit={isViewDashboard ? () => handleNav(`${EDIT_ROUTE_PREFIX}${dashboardIdFromRoute(current)}`) : undefined}
              showMenu={isViewDashboard}
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
              {isViewDashboard && (
                <div className="wp-filter-drawer" style={{ width: dashboardFilterOpen ? 400 : 0 }}>
                  <div className="wp-filter-drawer__inner">
                    {dashboardFilterOpen && (
                      <FilterPanel
                        embedded
                        pageId="workspace/report"
                        onClose={() => setDashboardFilterOpen(false)}
                        onApply={handleApplyDashboardFilters}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          </main>
          {rightPanelSlot}
        </div>
        <CopilotFab onClick={() => handleNav('navigator')} active={navigatorActive} pageContext={pageTitle} />
      </div>
    </WorkspaceProvider>
  )
}
