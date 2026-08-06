// Cross-filter chip helpers shared by every dashboard page that supports clicking a
// chart bar segment or pie/donut slice to filter the page. A chip is
// { attrId, key, value } — the same shape ActiveFilterPanel already displays. A single
// click can represent 1 chip (a plain bar/slice, one dimension) or 2 (a stacked-bar
// segment, which encodes both the row's category and the segment's own value).

const sameChip = (a, b) => a.attrId === b.attrId && a.value === b.value;

// Toggles a click's chip(s) as a unit: if every chip in `newChips` is already present,
// removes all of them (the click un-filters); otherwise adds whichever are missing.
export function toggleChipGroup(chips, newChips) {
  const allPresent = newChips.every(nc => chips.some(c => sameChip(c, nc)));
  if (allPresent) return chips.filter(c => !newChips.some(nc => sameChip(c, nc)));
  const toAdd = newChips.filter(nc => !chips.some(c => sameChip(c, nc)));
  return [...chips, ...toAdd];
}

// filtersByPage[pageId] shape.
export function toChipsState(chips) {
  return { count: new Set(chips.map(c => c.attrId)).size, chips };
}
