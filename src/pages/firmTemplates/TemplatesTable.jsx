import { useEffect, useMemo, useState } from 'react';
import { Copy, Download, FileText, Filter, LayoutTemplate, Plus, SearchX, Trash2, X } from 'lucide-react';
import Pagination, { usePagination } from '../../components/Pagination';
import RowActionsMenu from '../../components/RowActionsMenu';
import {
  BulkBar, HeaderCheckbox, SelectCheckbox, SelectedOnlyFilter, barButton, barDanger, downloadCsv, useSelection,
} from '../../components/TableSelection';
import { DataCard, EmptyState, SearchInput, StatCard } from '../../components/page';
import { CloseButton, Drawer, Modal } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { TooltipProvider } from '../../components/ui/tooltip';
import { ToastBridge } from '../../components/ui/sonner';
import { Field, ListHeader, NameCell, SelectFilter, SortHead, invalidProps, sortRows } from './templateKit';

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
  const [sort, setSort] = useState(null);
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
    const list = rows.filter((r) => (filter === 'All' || String(r[filterKey]) === filter)
      && (!selectedOnly || selection.has(r.id))
      && (!s || Object.values(r).join(' ').toLowerCase().includes(s)));
    return sortRows(list, sort, Object.fromEntries(columns.map((c) => [c.key, (r) => r[c.key]])));
  }, [rows, q, filter, filterKey, selectedOnly, selection, sort, columns]);

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

  // stat cards: total + up to 3 filter values (click one to filter by it)
  const stats = filterField ? filterOptions.slice(1, 4).map((v) => [v, rows.filter((r) => String(r[filterKey]) === v).length]) : [];
  const colCount = columns.length + 2;

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-col gap-6">
        <ListHeader title={title}
          actions={<>
            <Button onClick={() => setDrawer('new')} aria-label={`+ New ${singular}`}><Plus />New {singular}</Button>
          </>} />

        <div className={stats.length >= 3 ? 'grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4' : 'grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4'}>
          <StatCard label="Total templates" value={rows.length} icon={LayoutTemplate} />
          {stats.map(([label, n]) => (
            <StatCard key={label} label={label} value={n} active={filter === label}
              hint={filter === label ? 'Showing only these · click to clear' : 'Click to filter'}
              onClick={() => { setFilter((cur) => (cur === label ? 'All' : label)); setPage(1); }} />
          ))}
        </div>

        <DataCard
          toolbar={<>
            <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} label={`Search ${title.toLowerCase()}`}
              placeholder={`Search ${title.toLowerCase()}…`} className="h-8 w-full sm:w-72" />
            {filterField && (
              <SelectFilter label={filterField.label} icon={Filter} value={filter} onChange={(v) => { setFilter(v); setPage(1); }} options={filterOptions} />
            )}
            {filtersOn ? <Button variant="ghost" size="sm" onClick={reset} className="text-muted-foreground">Reset<X /></Button> : null}
            <span className="ml-auto hidden text-sm tabular-nums text-muted-foreground md:inline">{filtered.length} of {rows.length}</span>
          </>}
          footer={filtered.length > 0 && <Pagination {...paging} label="templates" />}
        >
          <Table className="min-w-[720px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"><HeaderCheckbox selection={selection} pageIds={pageItems.map((r) => r.id)} /></TableHead>
                {columns.map((c) => (c.render
                  ? <TableHead key={c.key}>{c.label}</TableHead>
                  : <SortHead key={c.key} label={c.label} col={c.key} sort={sort} setSort={setSort} />))}
                <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((r) => {
                const checked = selection.has(r.id);
                return (
                  <TableRow key={r.id} data-state={checked ? 'selected' : undefined}>
                    <TableCell><SelectCheckbox label={`Select ${r.name}`} checked={checked} onChange={() => selection.toggle(r.id)} /></TableCell>
                    {columns.map((c, i) => (
                      <TableCell key={c.key} className={i === 0 ? 'max-w-[320px]' : 'text-muted-foreground'}>
                        {i === 0 && c.key === 'name'
                          ? <NameCell icon={FileText} name={r.name} onOpen={() => setDrawer(r)} />
                          : (c.render ? c.render(r) : r[c.key])}
                      </TableCell>
                    ))}
                    <TableCell className="text-right">
                      <RowActionsMenu label={r.name} onEdit={() => setDrawer(r)} onDuplicate={() => duplicate([r])} onDelete={() => setConfirm([r])} />
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={colCount}>
                    {rows.length ? (
                      <EmptyState icon={SearchX} title="No templates match" description="Try a different search or remove the filter."
                        action={<Button variant="outline" onClick={reset}>Clear filters</Button>} />
                    ) : (
                      <EmptyState icon={LayoutTemplate} title="No templates yet" description={`Create your first ${singular} to reuse it across the firm.`}
                        action={<Button onClick={() => setDrawer('new')}><Plus />New {singular}</Button>} />
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DataCard>

        {/* Shown while rows are selected */}
        <BulkBar count={selection.count} total={filtered.length}
          onSelectAll={() => selection.setMany(filtered.map((r) => r.id), true)} onClear={selection.clear}
          filters={<SelectedOnlyFilter checked={selectedOnly} onChange={(v) => { setSelectedOnly(v); setPage(1); }} />}
          actions={<>
            <button type="button" className={barButton} onClick={() => { duplicate(selectedRows); selection.clear(); }}><Copy aria-hidden="true" />Duplicate</button>
            <button type="button" className={barButton} onClick={() => exportCsv(selectedRows)}><Download aria-hidden="true" />Export</button>
            <button type="button" className={barDanger} onClick={() => setConfirm(selectedRows)}><Trash2 aria-hidden="true" />Delete</button>
          </>}
        />

        {drawer && (
          <TemplateFormDrawer key={drawer === 'new' ? 'new' : drawer.id} singular={singular} fields={fields}
            row={drawer === 'new' ? null : drawer} onClose={() => setDrawer(null)} onSave={save} onDelete={() => setConfirm([drawer])} />
        )}

        {confirm && (
          <Modal title={confirm.length === 1 ? `Delete “${confirm[0].name}”?` : `Delete ${confirm.length} templates?`}
            description="This can't be undone." onClose={() => setConfirm(null)}
            footer={<><Button variant="outline" onClick={() => setConfirm(null)}>Cancel</Button>
              <Button variant="destructive" onClick={remove}>Delete</Button></>}>
            <ul className="max-h-48 divide-y overflow-y-auto rounded-lg border">
              {confirm.map((r) => <li key={r.id} className="truncate px-3 py-2 text-sm font-medium">{r.name}</li>)}
            </ul>
          </Modal>
        )}
        <ToastBridge message={toast} />
      </div>
    </TooltipProvider>
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
      <div className="flex h-full flex-col">
        <div className="flex items-start gap-3 border-b px-6 py-5">
          <span className="flex size-10 flex-none items-center justify-center rounded-xl border bg-subtle text-muted-foreground" aria-hidden="true"><FileText className="size-5" /></span>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-semibold tracking-tight">{String(form.name || '').trim() || (isNew ? `New ${singular}` : row.name)}</h2>
            <p className="truncate text-sm text-muted-foreground">{isNew ? `Create a ${singular}` : `Last updated ${row.updated || '—'}`}</p>
          </div>
          <CloseButton onClick={onClose} />
        </div>

        <form className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-5" noValidate onSubmit={(e) => { e.preventDefault(); submit(); }}>
          {fields.map((f) => {
            const id = `tpl-field-${f.key}`;
            const err = errors[f.key];
            return (
              <Field key={f.key} id={id} label={f.label} required={f.required} error={err}>
                {f.type === 'textarea' && (
                  <Textarea id={id} className="min-h-[110px]" value={form[f.key]} onChange={(e) => set(f.key, e.target.value)} placeholder={f.placeholder} {...invalidProps(id, err)} />
                )}
                {f.type === 'select' && (
                  <Select value={String(form[f.key] ?? '')} onValueChange={(v) => set(f.key, v)}>
                    <SelectTrigger id={id} {...invalidProps(id, err)}><SelectValue /></SelectTrigger>
                    <SelectContent>{f.options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                  </Select>
                )}
                {f.type === 'number' && (
                  <Input id={id} className="w-36" type="number" min="0" value={form[f.key]} onChange={(e) => set(f.key, e.target.value)} {...invalidProps(id, err)} />
                )}
                {(!f.type || f.type === 'text') && (
                  <Input id={id} value={form[f.key]} onChange={(e) => set(f.key, e.target.value)} placeholder={f.placeholder} {...invalidProps(id, err)} />
                )}
              </Field>
            );
          })}
          <button type="submit" className="hidden" tabIndex={-1} aria-hidden="true" />
        </form>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t bg-subtle px-6 py-3.5">
          {!isNew
            ? <Button type="button" variant="ghost" onClick={onDelete} className="text-danger-700 hover:bg-danger-50 hover:text-danger-700"><Trash2 />Delete</Button>
            : <span />}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="button" onClick={submit}>{isNew ? 'Create template' : 'Save changes'}</Button>
          </div>
        </div>
      </div>
    </Drawer>
  );
}
