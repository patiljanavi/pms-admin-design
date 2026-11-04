import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiCopy, FiDownload, FiSearch, FiTrash2 } from 'react-icons/fi';
import MultiSelect from '../../../components/MultiSelect';
import Pagination, { usePagination } from '../../../components/Pagination';
import TagChip, { chipStyle } from '../../../components/TagChip';
import {
  BulkBar, HeaderCheckbox, SelectCheckbox, SelectedOnlyFilter, barButton, barDanger, downloadCsv, useSelection,
} from '../../../components/TableSelection';
import { Avatar, Modal, cx, initials } from '../../../components/ui';
import { useData } from '../../../context/DataContext';
import { PRIORITY_STYLE, STATUS_STYLE, TASK_PRIORITIES, TASK_STATUSES, describeDates } from '../../../data/taskTemplates';
import RowActionsMenu from '../../../components/RowActionsMenu';

const LIST_PATH = '/firmtemp/templates/tasks';
const fmtDate = (d) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—');

function Assignees({ names }) {
  if (!names?.length) return <span className="text-muted">Unassigned</span>;
  return (
    <div className="flex items-center gap-2" title={names.join(', ')}>
      <div className="flex -space-x-2">{names.slice(0, 3).map((n) => <span key={n} className="rounded-full ring-2 ring-surface"><Avatar text={initials(n)} size="sm" tone="solid" /></span>)}</div>
      {names.length > 3 && <span className="text-sm text-muted">+{names.length - 3}</span>}
    </div>
  );
}

/** Firm Templates → Tasks: table of task templates. New / Edit open TaskTemplateForm. */
export default function TaskTemplates() {
  const navigate = useNavigate();
  const { state: routeState, pathname } = useLocation();
  const { taskTemplates, duplicateTaskTemplates, deleteTaskTemplates, tags, tagById } = useData();

  const [q, setQ] = useState('');
  const [status, setStatus] = useState('All');
  const [priority, setPriority] = useState('All');
  const [tagFilter, setTagFilter] = useState([]);
  const [confirm, setConfirm] = useState(null);
  const [toast, setToast] = useState('');
  const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 2600); };

  // Message sent back from the form page
  useEffect(() => {
    if (routeState?.toast) { notify(routeState.toast); navigate(pathname, { replace: true, state: null }); }
  }, [routeState]); // eslint-disable-line react-hooks/exhaustive-deps

  const selection = useSelection();
  const [selectedOnly, setSelectedOnly] = useState(false);
  useEffect(() => { if (selection.count === 0) setSelectedOnly(false); }, [selection.count]);

  const tagsOf = (t) => (t.tags || []).map((id) => tagById.get(id)).filter(Boolean);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return taskTemplates.filter((t) => (status === 'All' || t.status === status)
      && (priority === 'All' || t.priority === priority)
      && (!tagFilter.length || tagFilter.some((id) => (t.tags || []).includes(id)))
      && (!selectedOnly || selection.has(t.id))
      && (!s || `${t.templatename} ${t.description} ${(t.assignees || []).join(' ')}`.toLowerCase().includes(s)));
  }, [taskTemplates, q, status, priority, tagFilter, selectedOnly, selection]);

  const paging = usePagination(filtered, { initialSize: 10, storageKey: 'task-templates' });
  const { pageItems: rows, setPage } = paging;
  const selected = taskTemplates.filter((t) => selection.has(t.id));
  const filtersOn = q || status !== 'All' || priority !== 'All' || tagFilter.length;
  const reset = () => { setQ(''); setStatus('All'); setPriority('All'); setTagFilter([]); setSelectedOnly(false); setPage(1); };
  const openNew = () => navigate(`${LIST_PATH}/new`);
  const openEdit = (t) => navigate(`${LIST_PATH}/${t.id}`);

  const remove = () => {
    const ids = confirm.map((t) => t.id);
    deleteTaskTemplates(ids); selection.setMany(ids, false); setConfirm(null);
    notify(`Deleted ${ids.length} template${ids.length > 1 ? 's' : ''}`);
  };
  const exportCsv = (items) => {
    downloadCsv('task-templates.csv', [['Name', 'Status', 'Priority', 'Assignees', 'Tags', 'Dates', 'Subtasks', 'Updated'],
      ...items.map((t) => [t.templatename, t.status, t.priority, (t.assignees || []).join('; '), tagsOf(t).map((g) => g.label).join('; '),
        describeDates(t), (t.subtasks || []).map((s) => s.text).join('; '), t.updatedAt])]);
    notify(`Exported ${items.length} templates`);
  };

  const stats = [['Total templates', taskTemplates.length], ...TASK_STATUSES.map((s) => [s, taskTemplates.filter((t) => t.status === s).length])];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Task templates</h2>
          <p className="text-muted">Reusable tasks with assignees, dates and a subtask checklist.</p>
        </div>
        <button className="btn-primary" onClick={openNew}>+ New task template</button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(([label, n]) => (
          <div key={label} className="card p-4 sm:p-5"><div className="text-sm text-muted">{label}</div><div className="mt-1.5 text-2xl font-bold">{n}</div></div>
        ))}
      </div>

      <section className="card">
        {/* Filters */}
        <div className="flex flex-wrap items-start gap-3 border-b border-line px-4 py-4 sm:px-5">
          <label className="flex min-h-[44px] flex-[1_1_220px] items-center gap-2 rounded border border-line-strong px-3 focus-within:border-brand-600">
            <FiSearch size={18} className="text-muted" aria-hidden="true" /><span className="sr-only">Search task templates</span>
            <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search name, description, assignee" className="min-w-0 flex-1 bg-transparent outline-none" />
          </label>
          <label className="flex items-center gap-2 text-muted">Status
            <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="input min-h-[44px] w-auto">
              {['All', ...TASK_STATUSES].map((o) => <option key={o}>{o}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2 text-muted">Priority
            <select value={priority} onChange={(e) => { setPriority(e.target.value); setPage(1); }} className="input min-h-[44px] w-auto">
              {['All', ...TASK_PRIORITIES].map((o) => <option key={o}>{o}</option>)}
            </select>
          </label>
          <div className="flex-[1_1_200px]">
            <MultiSelect placeholder="Filter by tags" options={tags} value={tagFilter} onChange={(v) => { setTagFilter(v); setPage(1); }}
              chipStyle={(o) => chipStyle(o.color)} renderOption={(o) => <TagChip tag={o} />} emptyText="No tags" />
          </div>
          {filtersOn ? <button onClick={reset} className="btn-link min-h-[44px] px-2">Clear filters</button> : null}
        </div>

        <BulkBar count={selection.count} total={filtered.length}
          onSelectAll={() => selection.setMany(filtered.map((t) => t.id), true)} onClear={selection.clear}
          filters={<SelectedOnlyFilter checked={selectedOnly} onChange={(v) => { setSelectedOnly(v); setPage(1); }} />}
          actions={<>
            <button className={barButton} onClick={() => { duplicateTaskTemplates([...selection.ids]); notify(`Duplicated ${selection.count} template${selection.count > 1 ? 's' : ''}`); selection.clear(); }}><FiCopy aria-hidden="true" /> Duplicate</button>
            <button className={barButton} onClick={() => exportCsv(selected)}><FiDownload aria-hidden="true" /> Export</button>
            <button className={barDanger} onClick={() => setConfirm(selected)}><FiTrash2 aria-hidden="true" /> Delete</button>
          </>}
        />

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] border-collapse">
            <thead>
              <tr className="bg-subtle text-left text-xs uppercase tracking-wide text-muted">
                <th className="w-12 py-3 pl-5 pr-1"><HeaderCheckbox selection={selection} pageIds={rows.map((t) => t.id)} /></th>
                <th className="px-3 py-3 font-semibold">Template name</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 font-semibold">Priority</th>
                <th className="px-3 py-3 font-semibold">Assignees</th>
                <th className="px-3 py-3 font-semibold">Tags</th>
                <th className="px-3 py-3 font-semibold">Dates</th>
                <th className="px-3 py-3 font-semibold">Subtasks</th>
                <th className="px-3 py-3 font-semibold">Updated</th>
                <th className="px-5 py-3 text-right font-semibold"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => {
                const checked = selection.has(t.id);
                const tg = tagsOf(t);
                return (
                  <tr key={t.id} aria-selected={checked} className={cx('border-t border-line-soft', checked ? 'bg-brand-50' : 'hover:bg-subtle/60')}>
                    <td className="py-3 pl-5 pr-1"><SelectCheckbox label={`Select ${t.templatename}`} checked={checked} onChange={() => selection.toggle(t.id)} /></td>
                    <td className="max-w-[280px] px-3 py-3">
                      <button onClick={() => openEdit(t)} className="text-left font-semibold hover:text-brand-600 hover:underline">{t.templatename}</button>
                      {t.description && <div className="truncate text-sm text-muted">{t.description}</div>}
                    </td>
                    <td className="px-3 py-3"><span className={cx('pill', STATUS_STYLE[t.status])}>{t.status}</span></td>
                    <td className="px-3 py-3"><span className={cx('pill', PRIORITY_STYLE[t.priority])}>{t.priority}</span></td>
                    <td className="px-3 py-3"><Assignees names={t.assignees} /></td>
                    <td className="px-3 py-3">
                      {tg.length ? <div className="flex flex-wrap gap-1">{tg.slice(0, 2).map((g) => <TagChip key={g.value} tag={g} size="xs" />)}{tg.length > 2 && <span className="text-xs text-muted">+{tg.length - 2}</span>}</div> : <span className="text-muted">—</span>}
                    </td>
                    <td className="px-3 py-3 text-sm">{describeDates(t)}</td>
                    <td className="px-3 py-3 text-sm">{t.SubtaskSwitch && t.subtasks?.length ? `${t.subtasks.length} items` : <span className="text-muted">—</span>}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-muted">{fmtDate(t.updatedAt)}</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        {/* <button onClick={() => openEdit(t)} aria-label={`Edit ${t.templatename}`} className="flex h-9 w-9 items-center justify-center rounded text-muted hover:bg-subtle hover:text-ink"><FiEdit2 aria-hidden="true" /></button>
                        <button onClick={() => { duplicateTaskTemplates([t.id]); notify(`Duplicated “${t.templatename}”`); }} aria-label={`Duplicate ${t.templatename}`} className="flex h-9 w-9 items-center justify-center rounded text-muted hover:bg-subtle hover:text-ink"><FiCopy aria-hidden="true" /></button>
                        <button onClick={() => setConfirm([t])} aria-label={`Delete ${t.templatename}`} className="flex h-9 w-9 items-center justify-center rounded text-danger-700 hover:bg-danger-50"><FiTrash2 aria-hidden="true" /></button> */}
                     
                      <RowActionsMenu
                        label={t.templatename}
                        onEdit={() => openEdit(t)}
                        onDelete={() => setConfirm([t])}
                      />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center gap-3 p-12 text-center text-muted">
              {taskTemplates.length ? 'No task templates match these filters.' : 'No task templates yet.'}
              {taskTemplates.length ? <button onClick={reset} className="btn-secondary">Clear filters</button> : <button onClick={openNew} className="btn-primary">+ New task template</button>}
            </div>
          )}
        </div>
        <Pagination {...paging} label="templates" />
      </section>

      {confirm && (
        <Modal title={confirm.length === 1 ? `Delete “${confirm[0].templatename}”?` : `Delete ${confirm.length} templates?`} onClose={() => setConfirm(null)}
          footer={<><button className="btn-secondary" onClick={() => setConfirm(null)}>Cancel</button><button className="btn bg-danger-700 text-white hover:bg-[#831E15]" onClick={remove}>Delete</button></>}>
          <p className="text-muted">Tasks already created from {confirm.length === 1 ? 'this template' : 'these templates'} stay as they are.</p>
        </Modal>
      )}
      {toast && <div role="status" className="fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-md bg-ink px-5 py-3 font-semibold text-white">{toast}</div>}
    </div>
  );
}
