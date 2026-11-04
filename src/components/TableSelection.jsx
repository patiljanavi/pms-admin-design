import { useEffect, useMemo, useRef, useState } from 'react';
import { FiX } from 'react-icons/fi';
import { Checkbox } from './ui';

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

/** Native checkbox (keyboard + screen reader friendly) with indeterminate support. */
export function SelectCheckbox({ checked, indeterminate = false, onChange, label }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.indeterminate = indeterminate && !checked; }, [indeterminate, checked]);
  return (
    <input ref={ref} type="checkbox" aria-label={label} checked={checked} onChange={(e) => onChange(e.target.checked)}
      className="h-[18px] w-[18px] cursor-pointer align-middle accent-brand-600" />
  );
}

/** Header checkbox: selects / clears every row currently shown. */
export function HeaderCheckbox({ selection, pageIds, label = 'Select all rows on this page' }) {
  const on = pageIds.filter((id) => selection.has(id)).length;
  return (
    <SelectCheckbox label={label} checked={pageIds.length > 0 && on === pageIds.length} indeterminate={on > 0}
      onChange={(v) => selection.setMany(pageIds, v)} />
  );
}

/** "Show selected only" filter used inside the bar. */
export function SelectedOnlyFilter({ checked, onChange }) {
  return <Checkbox checked={checked} onChange={onChange}><span className="text-sm font-semibold">Show selected only</span></Checkbox>;
}

/** Small select used for filters / actions inside the bar. */
export function BarSelect({ label, value, onChange, options }) {
  return (
    <label className="flex items-center gap-2 text-sm text-muted">{label}
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="min-h-[36px] rounded border border-line-strong bg-surface px-2 text-sm text-ink focus:border-brand-600 focus:outline-none">
        {options.map((o) => (typeof o === 'string' ? <option key={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>))}
      </select>
    </label>
  );
}

export const barButton = 'inline-flex min-h-[36px] items-center gap-1.5 rounded border border-line-strong bg-surface px-3 text-sm font-semibold text-ink hover:bg-subtle';
export const barDanger = 'inline-flex min-h-[36px] items-center gap-1.5 rounded border border-danger-200 bg-surface px-3 text-sm font-semibold text-danger-700 hover:bg-danger-50';

/**
 * Appears when at least one row is selected.
 * Left: count, "Select all N", Clear. Middle: filters. Right: bulk actions.
 */
export function BulkBar({ count, total, onSelectAll, onClear, filters, actions }) {
  if (!count) return null;
  return (
    <div role="region" aria-label="Selected rows" className="flex flex-wrap items-center gap-x-5 gap-y-3 border-b border-brand-100 bg-brand-50 px-4 py-3 sm:px-5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-brand-600 px-2.5 py-0.5 text-sm font-bold text-white">{count}</span>
        <span className="font-semibold">selected</span>
        {onSelectAll && count < total && <button type="button" className="btn-link text-sm" onClick={onSelectAll}>Select all {total}</button>}
        <button type="button" onClick={onClear} className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink"><FiX aria-hidden="true" /> Clear</button>
      </div>
      {filters && <div className="flex flex-wrap items-center gap-3 sm:border-l sm:border-brand-100 sm:pl-5">{filters}</div>}
      {actions && <div className="flex flex-wrap items-center gap-2 sm:ml-auto">{actions}</div>}
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
