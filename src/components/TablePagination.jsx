import React from 'react'

const ROWS_OPTIONS = [10, 25, 50, 100];

function getPageNums(current, total) {
  const delta = 2;
  const rangeSet = new Set();
  rangeSet.add(1);
  rangeSet.add(total);
  for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
    rangeSet.add(i);
  }
  const sorted = [...rangeSet].sort((a, b) => a - b);
  const result = [];
  let prev = null;
  for (const p of sorted) {
    if (prev !== null && p - prev > 1) result.push('...');
    result.push(p);
    prev = p;
  }
  return result;
}

const IcChevLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m15 18-6-6 6-6"/>
  </svg>
);
const IcChevRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6"/>
  </svg>
);
const IcChevsRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 17 5-5-5-5"/><path d="m13 17 5-5-5-5"/>
  </svg>
);

export default function TablePagination({ total, page, rowsPerPage, onPageChange, onRowsPerPageChange }) {
  const totalPages  = Math.max(1, Math.ceil(total / rowsPerPage));
  const safePage    = Math.min(Math.max(1, page), totalPages);
  const startItem   = total === 0 ? 0 : (safePage - 1) * rowsPerPage + 1;
  const endItem     = Math.min(safePage * rowsPerPage, total);
  const pageNums    = getPageNums(safePage, totalPages);

  return (
    <div className="tpg">
      <div className="tpg__left">
        <div className="tpg__counts">
          {ROWS_OPTIONS.map(n => (
            <button
              key={n}
              className={`tpg__count${n === rowsPerPage ? ' tpg__count--active' : ''}`}
              onClick={() => onRowsPerPageChange(n)}
            >
              {n}
            </button>
          ))}
        </div>
        <span className="tpg__info">
          Showing rows {startItem} to {endItem} of {total.toLocaleString()}
        </span>
      </div>

      <div className="tpg__right">
        <button
          className="tpg__nav"
          disabled={safePage === 1}
          onClick={() => onPageChange(safePage - 1)}
          title="Previous page"
        >
          <IcChevLeft />
        </button>

        {pageNums.map((p, i) =>
          p === '...'
            ? <span key={`d${i}`} className="tpg__ellipsis">...</span>
            : (
              <button
                key={p}
                className={`tpg__pg${p === safePage ? ' tpg__pg--active' : ''}`}
                onClick={() => onPageChange(p)}
              >
                {p}
              </button>
            )
        )}

        <button
          className="tpg__nav"
          disabled={safePage === totalPages}
          onClick={() => onPageChange(safePage + 1)}
          title="Next page"
        >
          <IcChevRight />
        </button>
        <button
          className="tpg__nav"
          disabled={safePage === totalPages}
          onClick={() => onPageChange(totalPages)}
          title="Last page"
        >
          <IcChevsRight />
        </button>
      </div>
    </div>
  );
}
