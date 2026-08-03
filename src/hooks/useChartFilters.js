import { useMemo } from 'react'

// Given the flat chip array a page currently has active (filtersByPage[pageId].chips),
// returns helpers for chart widgets ("is this mark selected?") and row-level datasets
// ("does this row match every active filter?").
export function useChartFilters(chips) {
  const byAttr = useMemo(() => {
    const m = new Map()
    for (const c of chips || []) {
      if (!m.has(c.attrId)) m.set(c.attrId, new Set())
      m.get(c.attrId).add(c.value)
    }
    return m
  }, [chips])

  const isActive = (attrId, value) => byAttr.has(attrId) && byAttr.get(attrId).has(value)

  // fieldsMap: { [attrId]: row => value }. Only attrIds present in fieldsMap are tested —
  // chips for attrIds this dataset doesn't know about are ignored, not treated as "no match",
  // so unrelated chip types (e.g. a saved-filter chip) never corrupt this widget's filtering.
  const matches = (row, fieldsMap) => {
    for (const [attrId, values] of byAttr) {
      const getter = fieldsMap[attrId]
      if (!getter) continue
      if (!values.has(getter(row))) return false
    }
    return true
  }

  return { isActive, matches }
}
