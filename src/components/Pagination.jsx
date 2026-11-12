import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from 'lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

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

const iconBtn = 'inline-flex size-8 items-center justify-center rounded-md border border-input bg-card text-foreground shadow-xs transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50';

/**
 * Footer for a table: "x–y of z", rows-per-page, "Page n of m" and first/prev/next/last.
 * Pass the object from usePagination as props: <Pagination {...paging} />
 */
export default function Pagination({ page, pages, total, start, end, setPage, pageSize, setPageSize, sizes = PAGE_SIZES, label = 'rows', className }) {
  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm sm:px-5', className)}>
      <span className="text-muted-foreground" aria-live="polite">
        {total ? <><span className="font-medium text-foreground tabular-nums">{start}–{end}</span> of <span className="font-medium text-foreground tabular-nums">{total}</span> {label}</> : `0 ${label}`}
      </span>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {setPageSize && (
          <div className="flex items-center gap-2">
            <span className="hidden text-muted-foreground sm:inline">Rows per page</span>
            <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
              <SelectTrigger className="h-8 w-[72px]" aria-label="Rows per page"><SelectValue /></SelectTrigger>
              <SelectContent side="top">
                {sizes.map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
        <span className="font-medium tabular-nums">Page {page} of {pages}</span>
        <nav aria-label="Pagination" className="flex items-center gap-1">
          <button type="button" className={cn(iconBtn, 'hidden sm:inline-flex')} disabled={page <= 1} onClick={() => setPage(1)} aria-label="First page"><ChevronsLeft className="size-4" /></button>
          <button type="button" className={iconBtn} disabled={page <= 1} onClick={() => setPage(page - 1)} aria-label="Previous page"><ChevronLeft className="size-4" /></button>
          <button type="button" className={iconBtn} disabled={page >= pages} onClick={() => setPage(page + 1)} aria-label="Next page"><ChevronRight className="size-4" /></button>
          <button type="button" className={cn(iconBtn, 'hidden sm:inline-flex')} disabled={page >= pages} onClick={() => setPage(pages)} aria-label="Last page"><ChevronsRight className="size-4" /></button>
        </nav>
      </div>
    </div>
  );
}
