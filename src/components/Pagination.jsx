import { useEffect, useMemo, useState } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { cx } from './ui';

export const PAGE_SIZES = [10, 20, 25, 50, 100];

/**
 * Paging state for a list.
 * - storageKey (optional): remembers the chosen page size on this device, per table.
 * Returns the rows for the current page plus everything <Pagination> needs.
 */
export function usePagination(items, { initialSize = 10, storageKey } = {}) {
  const [pageSize, setPageSizeState] = useState(() => {
    if (!storageKey) return initialSize;
    try { const v = Number(localStorage.getItem(`harbor.pageSize.${storageKey}`)); return PAGE_SIZES.includes(v) ? v : initialSize; } catch { return initialSize; }
  });
  const [page, setPage] = useState(1);

  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, pages);
  const startIndex = (current - 1) * pageSize;
  const pageItems = useMemo(() => items.slice(startIndex, startIndex + pageSize), [items, startIndex, pageSize]);

  // If filters shrink the list, don't stay on a page that no longer exists.
  useEffect(() => { if (page > pages) setPage(pages); }, [page, pages]);

  const setPageSize = (size) => {
    // Keep the first visible row on screen after changing the size.
    setPage(Math.floor(startIndex / size) + 1);
    setPageSizeState(size);
    if (storageKey) { try { localStorage.setItem(`harbor.pageSize.${storageKey}`, String(size)); } catch {} }
  };

  return {
    pageItems, page: current, pages, total, pageSize, setPage, setPageSize,
    start: total ? startIndex + 1 : 0, end: Math.min(startIndex + pageSize, total),
  };
}

/** 1 … 4 5 6 … 12 — keeps the bar short when there are many pages. */
function pageList(page, pages) {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const set = new Set([1, pages, page - 1, page, page + 1]);
  if (page <= 3) [2, 3, 4].forEach((n) => set.add(n));
  if (page >= pages - 2) [pages - 3, pages - 2, pages - 1].forEach((n) => set.add(n));
  const nums = [...set].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  const out = [];
  nums.forEach((n, i) => { if (i && n - nums[i - 1] > 1) out.push('…'); out.push(n); });
  return out;
}

/**
 * Footer for a table: rows-per-page selector, "Showing x–y of z", page buttons.
 * Pass the object from usePagination as props: <Pagination {...paging} />
 */
export default function Pagination({ page, pages, total, start, end, setPage, pageSize, setPageSize, sizes = PAGE_SIZES, label = 'rows' }) {
  const btn = 'flex min-h-[36px] min-w-[36px] items-center justify-center rounded px-2.5 font-semibold';
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3.5 sm:px-5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-muted">
        {setPageSize && (
          <label className="flex items-center gap-2">Rows per page
            <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}
              className="min-h-[36px] rounded border border-line-strong bg-surface px-2 font-semibold text-ink focus:border-brand-600 focus:outline-none">
              {sizes.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
        )}
        <span aria-live="polite">{total ? `Showing ${start}–${end} of ${total} ${label}` : `0 ${label}`}</span>
      </div>
      {pages > 1 && (
        <nav aria-label="Pagination" className="flex flex-wrap items-center gap-1.5">
          <button className={cx(btn, 'border border-line-strong bg-surface hover:bg-subtle disabled:border-line disabled:bg-subtle disabled:text-[#9AA4B2]')}
            disabled={page <= 1} onClick={() => setPage(page - 1)} aria-label="Previous page"><FiChevronLeft aria-hidden="true" /></button>
          {pageList(page, pages).map((n, i) => (n === '…'
            ? <span key={`gap-${i}`} className="px-1 text-muted" aria-hidden="true">…</span>
            : <button key={n} aria-current={n === page ? 'page' : undefined} aria-label={`Page ${n}`} onClick={() => setPage(n)}
                className={cx(btn, n === page ? 'bg-brand-600 text-white' : 'border border-line-strong bg-surface hover:bg-subtle')}>{n}</button>))}
          <button className={cx(btn, 'border border-line-strong bg-surface hover:bg-subtle disabled:border-line disabled:bg-subtle disabled:text-[#9AA4B2]')}
            disabled={page >= pages} onClick={() => setPage(page + 1)} aria-label="Next page"><FiChevronRight aria-hidden="true" /></button>
        </nav>
      )}
    </div>
  );
}
