import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { Button } from './ui/button';
import { TableHead } from './ui/table';

/*
 * Shared pieces for the data tables (templates pages, account tabs, Billing):
 *   SortHead  — sortable column header            <SortHead label="Updated" col="updated" sort={sort} setSort={setSort} />
 *   NameCell  — icon · name (opens the row) · preview line
 *   Dash      — "—" for empty cells
 *   useSort   — sort state + sorted rows           const { sort, setSort, sorted } = useSort(rows, { updated: (r) => r.updatedAt }, { col: 'updated', dir: 'desc' })
 */

/** Sortable column header: click to sort, click again to reverse. sort = { col, dir } */
export function SortHead({ label, col, sort, setSort, className = '' }) {
  const on = sort.col === col;
  const Icon = !on ? ArrowUpDown : sort.dir === 'asc' ? ArrowUp : ArrowDown;
  return (
    <TableHead className={className} aria-sort={on ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <Button variant="ghost" size="sm" className="-ml-3 h-8 gap-1.5" onClick={() => setSort((s) => ({ col, dir: s.col === col && s.dir === 'asc' ? 'desc' : 'asc' }))}>
        {label}<Icon className={`size-3.5 ${on ? '' : 'opacity-40'}`} aria-hidden="true" />
      </Button>
    </TableHead>
  );
}

/** Name cell: icon · name (a button that opens the row) · one-line preview. */
export function NameCell({ icon: Icon, name, preview, onOpen, mono = false }) {
  return (
    <div className="flex items-start gap-2.5">
      {Icon && <span className="mt-0.5 inline-flex size-8 flex-none items-center justify-center rounded-lg border bg-subtle text-muted-foreground" aria-hidden="true"><Icon className="size-4" /></span>}
      <div className="min-w-0">
        <button type="button" onClick={onOpen} className={`max-w-full truncate text-left font-medium text-foreground underline-offset-4 hover:underline ${mono ? 'font-mono' : ''}`}>{name}</button>
        {preview && <p className="truncate text-xs text-muted-foreground" title={typeof preview === 'string' ? preview : undefined}>{preview}</p>}
      </div>
    </div>
  );
}

export const Dash = () => <span className="text-muted-foreground/60">—</span>;

/** Sort state + sorted rows. getters: { [col]: (row) => comparable value } */
export function useSort(rows, getters, initial) {
  const [sort, setSort] = useState(initial);
  const sorted = useMemo(() => {
    const val = getters[sort.col];
    if (!val) return rows;
    return [...rows].sort((a, b) => { const x = val(a); const y = val(b); return (x < y ? -1 : x > y ? 1 : 0) * (sort.dir === 'asc' ? 1 : -1); });
  }, [rows, sort]); // eslint-disable-line react-hooks/exhaustive-deps
  return { sort, setSort, sorted };
}

/** Title row above a DataCard in the account tabs: title · description on the left, actions on the right. */
export function SectionHeader({ title, description, children }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="section-title">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}