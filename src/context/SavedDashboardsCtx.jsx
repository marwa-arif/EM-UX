import React, { createContext, useContext, useState, useCallback } from 'react'

const SavedDashboardsContext = createContext(null)

// Mounted once, app-wide (see AppWithBoundary in App.jsx) — deliberately
// *outside* WorkspacePage's own WorkspaceProvider, which fully unmounts
// (and loses all its state) every time the user navigates out of
// workspace/*. A dashboard pinned to a left-nav section (see the Save
// modal's "Save Dashboard Under" field, DashboardCanvas.jsx) has to survive
// that trip so App.jsx's own LeftNavHybrid and page-render branch can still
// see it while the user is on Exposure/Discover/Report/Data Quality/KG.
// WorkspaceCtx.jsx's WorkspaceProvider reads/writes through this same store
// (passed in as props) rather than owning its own copy, so SavedPage.jsx and
// DashboardCanvas.jsx keep working unchanged.
export function SavedDashboardsProvider({ children }) {
  const [savedDashboards, setSavedDashboards] = useState([])
  // User-created left-nav sections (see the Save modal's "Save Dashboard
  // Under" field, DashboardCanvas.jsx — its "+ Create New Section" option)
  // — a real, reusable section other dashboards can be saved under too, not
  // just a one-off destination for whichever dashboard first created it.
  // Kept separate from savedDashboards: a custom section persists here even
  // if every dashboard that used it is later deleted, so it stays pickable
  // from the dropdown (withSavedDashboards in LeftNav.jsx only renders it in
  // the nav itself once ≥1 dashboard actually references it again).
  const [customSections, setCustomSections] = useState([])

  const addSavedDashboard = useCallback((entry) => {
    setSavedDashboards(prev => [entry, ...prev.filter(d => d.id !== entry.id && d.name !== entry.name)])
  }, [])

  const removeSavedDashboard = useCallback((id) => {
    setSavedDashboards(prev => prev.filter(d => d.id !== id))
  }, [])

  const addCustomSection = useCallback((section) => {
    setCustomSections(prev => prev.some(s => s.id === section.id) ? prev : [...prev, section])
  }, [])

  return (
    <SavedDashboardsContext.Provider value={{ savedDashboards, addSavedDashboard, removeSavedDashboard, customSections, addCustomSection }}>
      {children}
    </SavedDashboardsContext.Provider>
  )
}

export function useSavedDashboards() {
  const ctx = useContext(SavedDashboardsContext)
  if (!ctx) throw new Error('useSavedDashboards must be used within a SavedDashboardsProvider')
  return ctx
}
