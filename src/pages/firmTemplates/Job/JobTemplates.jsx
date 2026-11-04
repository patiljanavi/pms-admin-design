import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiCopy, FiDownload,  FiSearch, FiTrash2 } from 'react-icons/fi';
import Pagination, { usePagination } from '../../../components/Pagination';
import { htmlToText } from '../../../components/TextEditor';
import {
  BulkBar, HeaderCheckbox, SelectCheckbox, SelectedOnlyFilter, barButton, barDanger, downloadCsv, useSelection,
} from '../../../components/TableSelection';
import { Avatar, Modal, cx, initials } from '../../../components/ui';
import { useData } from '../../../context/DataContext';
import {  TASK_PRIORITIES, describeDates } from '../../../data/taskTemplates';
import { statusOptionsFrom } from './Jobtemplateform';
import RowActionsMenu from '../../../components/RowActionsMenu';

const LIST_PATH = '/firmtemp/templates/jobs';


/** Firm Templates → Jobs: table of job templates. New / Edit open JobTemplateForm (same as Tasks and Emails). */
export default function JobTemplates() {
  const navigate = useNavigate();
  const { state: routeState, pathname } = useLocation();
  const { jobTemplates = [], duplicateJobTemplates, deleteJobTemplates, clientFacingJobs, clientStatuses } = useData();
  const statusList = clientFacingJobs ?? clientStatuses;
  const statusById = useMemo(() => new Map(statusOptionsFrom(statusList ?? []).map((s) => [String(s.id), s])), [statusList]);

  const [q, setQ] = useState('');
  const [priority, setPriority] = useState('All');
  const [portal, setPortal] = useState('All');      // All · Shown · Hidden
  const [confirm, setConfirm] = useState(null);
  const [toast, setToast] = useState('');
  const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 2600); };
  const openNew = () => navigate(`${LIST_PATH}/new`);
  const openEdit = (t) => navigate(`${LIST_PATH}/${t.id}`);

  // Message sent back from the form page ("Created …", "Saved …", "Deleted …")
  useEffect(() => {
    if (routeState?.toast) { notify(routeState.toast); navigate(pathname, { replace: true, state: null }); }
  }, [routeState]); // eslint-disable-line react-hooks/exhaustive-deps

  const selection = useSelection();
  const [selectedOnly, setSelectedOnly] = useState(false);
  useEffect(() => { if (selection.count === 0) setSelectedOnly(false); }, [selection.count]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return jobTemplates.filter((t) => (priority === 'All' || t.priority === priority)
      && (portal === 'All' || (portal === 'Shown' ? t.clientFacingStatus : !t.clientFacingStatus))
      && (!selectedOnly || selection.has(t.id))
      && (!s || `${t.templatename} ${t.jobName} ${htmlToText(t.description)} ${(t.assignees || []).join(' ')}`.toLowerCase().includes(s)));
  }, [jobTemplates, q, priority, portal, selectedOnly, selection]);

  const paging = usePagination(filtered, { initialSize: 10, storageKey: 'job-templates' });
  const { pageItems: rows, setPage } = paging;
  const selected = jobTemplates.filter((t) => selection.has(t.id));
  const filtersOn = q || priority !== 'All' || portal !== 'All';
  const reset = () => { setQ(''); setPriority('All'); setPortal('All'); setSelectedOnly(false); setPage(1); };

  if (!duplicateJobTemplates) return <div role="alert" className="card bg-danger-50 p-6 font-semibold text-danger-700">Job templates are not set up in DataContext.js</div>;

  const remove = () => {
    const ids = confirm.map((t) => t.id);
    deleteJobTemplates(ids); selection.setMany(ids, false); setConfirm(null);
    notify(`Deleted ${ids.length} template${ids.length > 1 ? 's' : ''}`);
  };
  const exportCsv = (items) => {
    downloadCsv('job-templates.csv', [['Template name', 'Job name', 'Assignees', 'Priority', 'Dates', 'Client portal', 'Client status', 'Comments', 'Updated'],
      ...items.map((t) => [t.templatename, t.jobName, (t.assignees || []).join('; '), t.priority, describeDates(t),
        t.clientFacingStatus ? 'Shown' : 'Hidden', statusById.get(String(t.selectedJob))?.name || '', (t.comments || []).join(' | '), t.updatedAt])]);
    notify(`Exported ${items.length} templates`);
  };

  const stats = [
    ['Total templates', jobTemplates.length],
    ['Shown in client portal', jobTemplates.filter((t) => t.clientFacingStatus).length],
    ['High or urgent', jobTemplates.filter((t) => ['High', 'Urgent'].includes(t.priority)).length],
    ['With comments', jobTemplates.filter((t) => t.comments?.length).length],
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Job templates</h2>
          <p className="text-muted">Jobs with assignees, dates and what clients see in their portal.</p>
        </div>
        <button className="btn-primary" onClick={openNew}>+ New job template</button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(([label, n]) => (
          <div key={label} className="card p-4 sm:p-5"><div className="text-sm text-muted">{label}</div><div className="mt-1.5 text-2xl font-bold">{n}</div></div>
        ))}
      </div>

      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-4 sm:px-5">
          <label className="flex min-h-[44px] flex-[1_1_240px] items-center gap-2 rounded border border-line-strong px-3 focus-within:border-brand-600">
            <FiSearch size={18} className="text-muted" aria-hidden="true" /><span className="sr-only">Search job templates</span>
            <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search name, job name, assignee" className="min-w-0 flex-1 bg-transparent outline-none" />
          </label>
          <label className="flex items-center gap-2 text-muted">Priority
            <select value={priority} onChange={(e) => { setPriority(e.target.value); setPage(1); }} className="input min-h-[44px] w-auto">
              {['All', ...TASK_PRIORITIES].map((o) => <option key={o}>{o}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2 text-muted">Client portal
            <select value={portal} onChange={(e) => { setPortal(e.target.value); setPage(1); }} className="input min-h-[44px] w-auto">
              {['All', 'Shown', 'Hidden'].map((o) => <option key={o}>{o}</option>)}
            </select>
          </label>
          {filtersOn ? <button onClick={reset} className="btn-link px-2">Clear filters</button> : null}
        </div>

        <BulkBar count={selection.count} total={filtered.length}
          onSelectAll={() => selection.setMany(filtered.map((t) => t.id), true)} onClear={selection.clear}
          filters={<SelectedOnlyFilter checked={selectedOnly} onChange={(v) => { setSelectedOnly(v); setPage(1); }} />}
          actions={<>
            <button className={barButton} onClick={() => { duplicateJobTemplates([...selection.ids]); notify(`Duplicated ${selection.count} template${selection.count > 1 ? 's' : ''}`); selection.clear(); }}><FiCopy aria-hidden="true" /> Duplicate</button>
            <button className={barButton} onClick={() => exportCsv(selected)}><FiDownload aria-hidden="true" /> Export</button>
            <button className={barDanger} onClick={() => setConfirm(selected)}><FiTrash2 aria-hidden="true" /> Delete</button>
          </>}
        />

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] border-collapse">
            <thead>
              <tr className="bg-subtle text-left text-xs uppercase tracking-wide text-muted">
                <th className="w-12 py-3 pl-5 pr-1"><HeaderCheckbox selection={selection} pageIds={rows.map((t) => t.id)} /></th>
                <th className="px-3 py-3 font-semibold">Template name</th>
                
                <th className="px-5 py-3 text-right font-semibold"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => {
                const checked = selection.has(t.id);
                // const st = t.clientFacingStatus ? statusById.get(String(t.selectedJob)) : null;
                return (
                  <tr key={t.id} aria-selected={checked} className={cx('border-t border-line-soft', checked ? 'bg-brand-50' : 'hover:bg-subtle/60')}>
                    <td className="py-3 pl-5 pr-1"><SelectCheckbox label={`Select ${t.templatename}`} checked={checked} onChange={() => selection.toggle(t.id)} /></td>
                    <td className="max-w-[280px] px-3 py-3">
                      <button onClick={() => openEdit(t)} className="text-left font-semibold hover:text-brand-600 hover:underline">{t.templatename}</button>
                      <div className="truncate font-mono text-xs text-muted">{t.jobName}</div>
                    </td>
                    
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        {/* <button onClick={() => openEdit(t)} aria-label={`Edit ${t.templatename}`} className="flex h-9 w-9 items-center justify-center rounded text-muted hover:bg-subtle hover:text-ink"><FiEdit2 aria-hidden="true" /></button>
                        <button onClick={() => { duplicateJobTemplates([t.id]); notify(`Duplicated “${t.templatename}”`); }} aria-label={`Duplicate ${t.templatename}`} className="flex h-9 w-9 items-center justify-center rounded text-muted hover:bg-subtle hover:text-ink"><FiCopy aria-hidden="true" /></button>
                        <button onClick={() => setConfirm([t])} aria-label={`Delete ${t.templatename}`} className="flex h-9 w-9 items-center justify-center rounded text-danger-700 hover:bg-danger-50"><FiTrash2 aria-hidden="true" /></button> */}
                      <RowActionsMenu
                        label={t.templatename}
                        onEdit={() => openEdit(t)}
                        onDuplicate={() => { duplicateJobTemplates([t.id]); notify(`Duplicated “${t.templatename}”`); }}
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
              {jobTemplates.length ? 'No job templates match these filters.' : 'No job templates yet.'}
              {jobTemplates.length ? <button onClick={reset} className="btn-secondary">Clear filters</button> : <button onClick={openNew} className="btn-primary">+ New job template</button>}
            </div>
          )}
        </div>
        <Pagination {...paging} label="templates" />
      </section>

      {confirm && (
        <Modal title={confirm.length === 1 ? `Delete “${confirm[0].templatename}”?` : `Delete ${confirm.length} templates?`} onClose={() => setConfirm(null)}
          footer={<><button className="btn-secondary" onClick={() => setConfirm(null)}>Cancel</button><button className="btn bg-danger-700 text-white hover:bg-[#831E15]" onClick={remove}>Delete</button></>}>
          <p className="text-muted">Jobs already created from {confirm.length === 1 ? 'this template' : 'these templates'} stay as they are.</p>
        </Modal>
      )}
      {toast && <div role="status" className="fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-md bg-ink px-5 py-3 font-semibold text-white">{toast}</div>}
    </div>
  );
}