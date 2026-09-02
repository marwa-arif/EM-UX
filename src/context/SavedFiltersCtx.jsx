import React, { createContext, useContext, useState, useCallback } from 'react'

const SavedFiltersCtx = createContext(null)

const DEFAULT_SAVED_FILTERS = [
  { id: 'cs',  name: 'Critical Servers',           desc: 'Monitor activity on key servers.',                 author: 'You',      visibility: 'Private', count: 5,  pinned: true  },
  { id: 'chr', name: 'Corporate high risk assets', desc: 'Track sensitive corporate systems.',               author: 'John T',   visibility: 'Public',  count: 12, pinned: true  },
  { id: 'cdm', name: 'Client data management',     desc: 'Manage client information securely.',              author: 'Sarah L',  visibility: 'Public',  count: 8,  pinned: true  },
  { id: 'cm',  name: 'Compliance monitoring',      desc: 'Ensure regulatory compliance across departments.', author: 'Mark R',   visibility: 'Public',  count: 5,  pinned: false },
  { id: 'ir',  name: 'Incident response plans',    desc: 'Prepare for and respond to security incidents.',   author: 'You',      visibility: 'Public',  count: 10, pinned: false },
  { id: 'tif', name: 'Threat intel feeds',         desc: 'Stay ahead of emerging threats.',                  author: 'Jane Doe', visibility: 'Private', count: 8,  pinned: false },
]

let nextSavedFilterId = 1

export function SavedFiltersProvider({ children }) {
  const [savedFilters, setSavedFilters] = useState(DEFAULT_SAVED_FILTERS)

  const addSavedFilter = useCallback(({ name, description, availability, filterCount, filters }) => {
    const id = `sf-${nextSavedFilterId++}`
    setSavedFilters(prev => [
      { id, name, desc: description?.trim() || 'Custom saved filter.', author: 'You', visibility: availability, count: filterCount, pinned: false, filters: filters || [] },
      ...prev,
    ])
    return id
  }, [])

  const overwriteSavedFilter = useCallback((name, filterCount, filters) => {
    setSavedFilters(prev => prev.map(f => f.name === name ? { ...f, count: filterCount, filters: filters || f.filters } : f))
  }, [])

  const deleteSavedFilter = useCallback((id) => {
    setSavedFilters(prev => prev.filter(f => f.id !== id))
  }, [])

  return (
    <SavedFiltersCtx.Provider value={{ savedFilters, addSavedFilter, overwriteSavedFilter, deleteSavedFilter }}>
      {children}
    </SavedFiltersCtx.Provider>
  )
}

export function useSavedFilters() {
  const ctx = useContext(SavedFiltersCtx)
  if (!ctx) throw new Error('useSavedFilters must be used within a SavedFiltersProvider')
  return ctx
}
