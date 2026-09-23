// Maps a selected date-range pill to the comparison period used in
// "X% from last ___" labels: 1W compares to the last day, 1M to the
// last week, and 3M/6M/1Y to the last month.
export function comparisonLabelForRange(range) {
  const normalized = String(range).replace(/\s+/g, '').toUpperCase();
  if (normalized === '1W') return 'last day';
  if (normalized === '1M') return 'last week';
  return 'last month';
}
