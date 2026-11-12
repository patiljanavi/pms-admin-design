import { useMemo, useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { cn } from 'lib/utils';
import { Checkbox as UiCheckbox } from './ui/checkbox';
import { Checkbox } from './ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from './ui/dropdown-menu';

/** Keeps a set of selected row ids. */
export function useSelection() {
  const [ids, setIds] = useState(() => new Set());
  return useMemo(() => ({
    ids,
    count: ids.size,
    has: (id) => ids.has(id),
    toggle: (id) => setIds((p) => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; }),
    setMany: (list, on) => setIds((p) => { const n = new Set(p); list.forEach((id) => (on ? n.add(id) : n.delete(id))); return n; }),
    clear: () => setIds(new Set()),
    /** Drop ids that no longer exist (e.g. after deleting rows). */
    keepOnly: (valid) => setIds((p) => new Set([...p].filter((id) => valid.includes(id)))),
  }), [ids]);
}

/** Row checkbox (shadcn) with indeterminate support. */
export function SelectCheckbox({ checked, indeterminate = false, onChange, label }) {
  return (
    <UiCheckbox aria-label={label} checked={checked ? true : indeterminate ? 'indeterminate' : false}
      onCheckedChange={(v) => onChange(v === true)} className="align-middle" />
  );
}

/** Header checkbox: selects / clears every row currently shown. */
export function HeaderCheckbox({ selection, pageIds, label = 'Select all rows on this page' }) {
  const on = pageIds.filter((id) => selection.has(id)).length;
  const all = pageIds.length > 0 && on === pageIds.length;
  return <SelectCheckbox label={label} checked={all} indeterminate={on > 0} onChange={() => selection.setMany(pageIds, !all)} />;
}

/** "Show selected only" filter used inside the bar. */
export function SelectedOnlyFilter({ checked, onChange }) {
  return <Checkbox checked={checked} onChange={onChange}><span className="text-sm font-medium">Selected only</span></Checkbox>;
}

const norm = (o) => (typeof o === 'string' ? { value: o, label: o } : o);

/**
 * Compact control for table toolbars and the bulk bar.
 * - value === ''  → an action menu ("Add tag ▾"); picking an item calls onChange(value).
 * - otherwise     → a filter select showing "Label: Current".
 */
export function BarSelect({ label, value, onChange, options }) {
  const items = options.map(norm).filter((o) => o.value !== '');
  if (value === '') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger className={barButton}>{label}<ChevronDown className="size-3.5 opacity-60" /></DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="max-h-80 w-56 overflow-y-auto">
          <DropdownMenuLabel>{label}</DropdownMenuLabel>
          {items.map((o) => <DropdownMenuItem key={o.value} onSelect={() => onChange(o.value)}>{o.label}</DropdownMenuItem>)}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-8 w-auto gap-1.5 text-sm" aria-label={label}>
        <span className="text-muted-foreground">{label}:</span><SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {items.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

export const barButton = 'inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-md border border-input bg-card px-3 text-sm font-medium text-foreground shadow-xs transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 [&_svg]:size-3.5';
export const barDanger = 'inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-md border border-danger-200 bg-card px-3 text-sm font-medium text-danger-700 shadow-xs transition-colors hover:bg-danger-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 [&_svg]:size-3.5';

/**
 * Floating action bar that appears while rows are selected (Linear / Attio style).
 * Left: count, "Select all N", clear. Middle: filters. Right: bulk actions.
 */
export function BulkBar({ count, total, onSelectAll, onClear, filters, actions }) {
  if (!count) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-40 flex justify-center px-4">
      <div role="region" aria-label="Selected rows"
        className="pointer-events-auto flex max-w-full animate-in fade-in-0 slide-in-from-bottom-4 flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border bg-popover py-2 pl-3 pr-2 text-popover-foreground shadow-pop duration-200">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-md bg-primary px-1.5 text-xs font-semibold tabular-nums text-primary-foreground">{count}</span>
          <span className="text-sm font-medium">selected</span>
          {onSelectAll && count < total && (
            <button type="button" className="text-sm font-medium text-primary hover:underline" onClick={onSelectAll}>Select all {total}</button>
          )}
        </div>
        {filters && <div className="flex items-center gap-3 border-l pl-3">{filters}</div>}
        {actions && <div className="flex flex-wrap items-center gap-1.5 border-l pl-3">{actions}</div>}
        <button type="button" onClick={onClear} aria-label="Clear selection"
          className={cn('ml-1 inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground')}>
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}

/** Downloads rows (array of arrays) as a CSV file. */
export function downloadCsv(filename, rows) {
  const esc = (v) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const blob = new Blob([rows.map((r) => r.map(esc).join(',')).join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
