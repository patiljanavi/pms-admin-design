import { useEffect, useMemo, useState } from 'react';
import { FiCopy, FiDownload, FiEdit2, FiFileText, FiSearch, FiTrash2, FiX } from 'react-icons/fi';
import Pagination, { usePagination } from '../../components/Pagination';
import {
  BulkBar, HeaderCheckbox, SelectCheckbox, SelectedOnlyFilter, barButton, barDanger, downloadCsv, useSelection,
} from '../../components/TableSelection';
import { Drawer, Modal, cx } from '../../components/ui';

const today = () => new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

/**
 * Templates screen used by every Firm Templates tab — works like Accounts / Contacts:
 * stat cards · search · filter · row checkboxes + bulk actions · rows per page · Add / Edit drawer.
 *
 * Props (set in each tab page):
 *   title       "Task templates"
 *   singular    "task template"   (button + drawer titles)
 *   columns     [{ key, label, render?(row) }]          table columns
 *   fields      [{ key, label, type, options?, required? }]   drawer form (text · textarea · number · select)
 *   rows        sample rows (each needs an id)
 *   filterKey   field used for the filter dropdown and stat cards (optional)
 */
export default function TemplatesTable({ title, singular, columns, fields, rows: initialRows, filterKey }) {
  const [rows, setRows] = useState(initialRows);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('All');
  const [drawer, setDrawer] = useState(null);   // null = closed · 'new' · or the row being edited
  const [confirm, setConfirm] = useState(null); // rows to delete
  const [toast, setToast] = useState('');
  const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 2600); };

  const selection = useSelection();
  const [selectedOnly, setSelectedOnly] = useState(false);
  useEffect(() => { if (selection.count === 0) setSelectedOnly(false); }, [selection.count]);

  const filterField = fields.find((f) => f.key === filterKey);
  const filterOptions = filterField ? ['All', ...(filterField.options || [...new Set(rows.map((r) => String(r[filterKey])))])] : [];

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows.filter((r) => (filter === 'All' || String(r[filterKey]) === filter)
      && (!selectedOnly || selection.has(r.id))
      && (!s || Object.values(r).join(' ').toLowerCase().includes(s)));
  }, [rows, q, filter, filterKey, selectedOnly, selection]);

  const paging = usePagination(filtered, { initialSize: 10 });
  const { pageItems, setPage } = paging;
  const selectedRows = rows.filter((r) => selection.has(r.id));
  const filtersOn = q || filter !== 'All';
  const reset = () => { setQ(''); setFilter('All'); setSelectedOnly(false); setPage(1); };

  // ---------- actions ----------
  const save = (data) => {
    if (drawer === 'new') {
      setRows((list) => [{ ...data, id: Date.now(), updated: today() }, ...list]);
      notify(`Created “${data.name}”`);
    } else {
      setRows((list) => list.map((r) => (r.id === drawer.id ? { ...r, ...data, updated: today() } : r)));
      notify(`Saved “${data.name}”`);
    }
    setDrawer(null);
  };
  const duplicate = (items) => {
    setRows((list) => [...items.map((r, i) => ({ ...r, id: Date.now() + i, name: `${r.name} (copy)`, updated: today() })), ...list]);
    notify(`Duplicated ${items.length} template${items.length > 1 ? 's' : ''}`);
  };
  const remove = () => {
    const ids = confirm.map((r) => r.id);
    setRows((list) => list.filter((r) => !ids.includes(r.id)));
    selection.setMany(ids, false);
    setConfirm(null); setDrawer(null);
    notify(`Deleted ${ids.length} template${ids.length > 1 ? 's' : ''}`);
  };
  const exportCsv = (items) => {
    downloadCsv(`${singular.replace(/\s+/g, '-')}s.csv`, [columns.map((c) => c.label), ...items.map((r) => columns.map((c) => r[c.key]))]);
    notify(`Exported ${items.length} templates`);
  };

  // stat cards: total + up to 3 filter values
  const stats = [['Total templates', rows.length],
    ...(filterField ? filterOptions.slice(1, 4).map((v) => [v, rows.filter((r) => String(r[filterKey]) === v).length]) : [])];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-2xl font-bold">{title}</h2>
        <button className="btn-primary" onClick={() => setDrawer('new')}>+ New {singular}</button>
      </div>

      {/* Stat cards */}
      <div className={cx('grid grid-cols-2 gap-4', stats.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3')}>
        {stats.map(([label, n]) => (
          <div key={label} className="card p-4 sm:p-5"><div className="text-sm text-muted">{label}</div><div className="mt-1.5 text-2xl font-bold">{n}</div></div>
        ))}
      </div>

      <section className="card overflow-hidden">
        {/* Search + filter */}
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-4 sm:px-5">
          <label className="flex min-h-[42px] flex-[1_1_240px] items-center gap-2 rounded border border-line-strong px-3 focus-within:border-brand-600">
            <FiSearch size={18} className="text-muted" aria-hidden="true" /><span className="sr-only">Search {title.toLowerCase()}</span>
            <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder={`Search ${title.toLowerCase()}`} className="min-w-0 flex-1 bg-transparent outline-none" />
          </label>
          {filterField && (
            <label className="flex items-center gap-2 text-muted">{filterField.label}
              <select value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }} className="input min-h-[42px] w-auto">
                {filterOptions.map((o) => <option key={o}>{o}</option>)}
              </select>
            </label>
          )}
          {filtersOn ? <button onClick={reset} className="btn-link px-2">Clear filters</button> : null}
        </div>

        {/* Shown while rows are selected */}
        <BulkBar count={selection.count} total={filtered.length}
          onSelectAll={() => selection.setMany(filtered.map((r) => r.id), true)} onClear={selection.clear}
          filters={<SelectedOnlyFilter checked={selectedOnly} onChange={(v) => { setSelectedOnly(v); setPage(1); }} />}
          actions={<>
            <button className={barButton} onClick={() => { duplicate(selectedRows); selection.clear(); }}><FiCopy aria-hidden="true" /> Duplicate</button>
            <button className={barButton} onClick={() => exportCsv(selectedRows)}><FiDownload aria-hidden="true" /> Export</button>
            <button className={barDanger} onClick={() => setConfirm(selectedRows)}><FiTrash2 aria-hidden="true" /> Delete</button>
          </>}
        />

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse">
            <thead>
              <tr className="bg-subtle text-left text-xs uppercase tracking-wide text-muted">
                <th className="w-12 py-3 pl-5 pr-1"><HeaderCheckbox selection={selection} pageIds={pageItems.map((r) => r.id)} /></th>
                {columns.map((c) => <th key={c.key} className="px-3 py-3 font-semibold">{c.label}</th>)}
                <th className="px-5 py-3 text-right font-semibold"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((r) => {
                const checked = selection.has(r.id);
                return (
                  <tr key={r.id} aria-selected={checked} className={cx('border-t border-line-soft', checked ? 'bg-brand-50' : 'hover:bg-subtle/60')}>
                    <td className="py-3 pl-5 pr-1"><SelectCheckbox label={`Select ${r.name}`} checked={checked} onChange={() => selection.toggle(r.id)} /></td>
                    {columns.map((c, i) => (
                      <td key={c.key} className="px-3 py-3">
                        {i === 0 && c.key === 'name'
                          ? <button onClick={() => setDrawer(r)} className="text-left font-semibold hover:text-brand-600 hover:underline">{r.name}</button>
                          : (c.render ? c.render(r) : r[c.key])}
                      </td>
                    ))}
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => setDrawer(r)} aria-label={`Edit ${r.name}`} className="flex h-9 w-9 items-center justify-center rounded text-muted hover:bg-subtle hover:text-ink"><FiEdit2 aria-hidden="true" /></button>
                        <button onClick={() => duplicate([r])} aria-label={`Duplicate ${r.name}`} className="flex h-9 w-9 items-center justify-center rounded text-muted hover:bg-subtle hover:text-ink"><FiCopy aria-hidden="true" /></button>
                        <button onClick={() => setConfirm([r])} aria-label={`Delete ${r.name}`} className="flex h-9 w-9 items-center justify-center rounded text-danger-700 hover:bg-danger-50"><FiTrash2 aria-hidden="true" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center gap-3 p-12 text-center text-muted">
              {rows.length ? 'No templates match these filters.' : 'No templates yet.'}
              {rows.length ? <button onClick={reset} className="btn-secondary">Clear filters</button> : <button onClick={() => setDrawer('new')} className="btn-primary">+ New {singular}</button>}
            </div>
          )}
        </div>
        <Pagination {...paging} label="templates" />
      </section>

      {drawer && (
        <TemplateFormDrawer key={drawer === 'new' ? 'new' : drawer.id} singular={singular} fields={fields}
          row={drawer === 'new' ? null : drawer} onClose={() => setDrawer(null)} onSave={save} onDelete={() => setConfirm([drawer])} />
      )}

      {confirm && (
        <Modal title={confirm.length === 1 ? `Delete “${confirm[0].name}”?` : `Delete ${confirm.length} templates?`} onClose={() => setConfirm(null)}
          footer={<><button className="btn-secondary" onClick={() => setConfirm(null)}>Cancel</button>
            <button className="btn bg-danger-700 text-white hover:bg-[#831E15]" onClick={remove}>Delete</button></>}>
          <p className="text-muted">This can't be undone.</p>
        </Modal>
      )}
      {toast && <div role="status" className="fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-md bg-ink px-5 py-3 font-semibold text-white">{toast}</div>}
    </div>
  );
}

/** Add / Edit drawer — same layout as the account and contact drawers. */
function TemplateFormDrawer({ singular, fields, row, onClose, onSave, onDelete }) {
  const isNew = !row;
  const [form, setForm] = useState(() => Object.fromEntries(fields.map((f) => [f.key, row ? row[f.key] ?? '' : (f.type === 'select' ? f.options[0] : '')])));
  const [errors, setErrors] = useState({});
  const set = (k, v) => { setForm((p) => ({ ...p, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })); };

  const submit = () => {
    const e = {};
    fields.forEach((f) => { if (f.required && !String(form[f.key] ?? '').trim()) e[f.key] = `Enter ${f.label.toLowerCase()}.`; });
    setErrors(e);
    if (Object.keys(e).length) return;
    const data = { ...form, name: String(form.name || '').trim() };
    fields.forEach((f) => { if (f.type === 'number') data[f.key] = Number(data[f.key]) || 0; });
    onSave(data);
  };

  return (
    <Drawer onClose={onClose} label={isNew ? `New ${singular}` : `Edit ${row.name}`} width="max-w-[560px]">
      <div className="flex items-center gap-4 border-b border-line p-5 sm:p-6">
        <span className="flex h-14 w-14 flex-none items-center justify-center rounded-full bg-brand-600 text-white" aria-hidden="true"><FiFileText size={22} /></span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-xl font-bold">{String(form.name || '').trim() || (isNew ? `New ${singular}` : row.name)}</h2>
          <div className="truncate text-muted">{isNew ? `Create a ${singular}` : `Last updated ${row.updated || '—'}`}</div>
        </div>
        <button onClick={onClose} aria-label="Close" className="flex h-10 w-10 flex-none items-center justify-center rounded text-muted hover:bg-subtle"><FiX size={20} /></button>
      </div>

      <form className="flex flex-1 flex-col gap-4 p-5 sm:p-6" noValidate onSubmit={(e) => { e.preventDefault(); submit(); }}>
        {fields.map((f) => (
          <label key={f.key} className="field-label">
            <span>{f.label}{f.required && ' *'}</span>
            {f.type === 'textarea' && <textarea className={cx('input min-h-[110px] py-2.5', errors[f.key] && 'border-danger-700')} value={form[f.key]} onChange={(e) => set(f.key, e.target.value)} placeholder={f.placeholder} />}
            {f.type === 'select' && <select className="input" value={form[f.key]} onChange={(e) => set(f.key, e.target.value)}>{f.options.map((o) => <option key={o}>{o}</option>)}</select>}
            {f.type === 'number' && <input className="input w-36" type="number" min="0" value={form[f.key]} onChange={(e) => set(f.key, e.target.value)} />}
            {(!f.type || f.type === 'text') && <input className={cx('input', errors[f.key] && 'border-danger-700')} value={form[f.key]} onChange={(e) => set(f.key, e.target.value)} placeholder={f.placeholder} />}
            {errors[f.key] && <span className="text-sm font-normal text-danger-700">{errors[f.key]}</span>}
          </label>
        ))}
        <button type="submit" className="hidden" tabIndex={-1} aria-hidden="true" />
      </form>

      <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-2.5 border-t border-line bg-subtle px-5 py-4 sm:px-6">
        {!isNew ? <button type="button" onClick={onDelete} className="inline-flex min-h-[44px] items-center gap-2 rounded px-3 font-semibold text-danger-700 hover:bg-danger-50"><FiTrash2 aria-hidden="true" /> Delete</button> : <span />}
        <div className="flex gap-2.5">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="btn-primary" onClick={submit}>{isNew ? 'Create template' : 'Save changes'}</button>
        </div>
      </div>
    </Drawer>
  );
}
