import { useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { FiCopy, FiDownload, FiEdit2, FiSearch, FiTrash2, FiZap } from 'react-icons/fi';
import Pagination, { usePagination } from '../../../components/Pagination';
import {
  BulkBar, HeaderCheckbox, SelectCheckbox, SelectedOnlyFilter, barButton, barDanger, downloadCsv, useSelection,
} from '../../../components/TableSelection';
import { Avatar, Modal, cx, initials } from '../../../components/ui';
import { useData } from '../../../context/DataContext';
import { SORT_JOBS_BY } from '../../../data/pipelinesdata';
import { templateOptionsFrom } from '../../../data/statusOptions';
import RowActionsMenu from '../../../components/RowActionsMenu';

const LIST_PATH = '/firmtemp/pipelines';
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—');
const automationCount = (p) => (p.stages || []).reduce((n, s) => n + (s.automations?.length || 0), 0);

/** Route wrapper: /firmtemp/pipelines shows the list; /new and /:pipelineId show the form. */
export function PipelinesLayout() { return <Outlet />; }

/** Templates → Pipeline Templates: table of pipelines. New / Edit open PipelineForm. */
export default function PipelineTemplates() {
  const navigate = useNavigate();
  const { state: routeState, pathname } = useLocation();
  const { pipelines = [], duplicatePipeline, deletePipelines, jobTemplates = [] } = useData();
  const jobTemplateById = useMemo(() => new Map(templateOptionsFrom(jobTemplates).map((o) => [String(o.id), o.label])), [jobTemplates]);

  const [q, setQ] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [toast, setToast] = useState('');
  const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 2600); };
  useEffect(() => {
    if (routeState?.toast) { notify(routeState.toast); navigate(pathname, { replace: true, state: null }); }
  }, [routeState]); // eslint-disable-line react-hooks/exhaustive-deps

  const selection = useSelection();
  const [selectedOnly, setSelectedOnly] = useState(false);
  useEffect(() => { if (selection.count === 0) setSelectedOnly(false); }, [selection.count]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return pipelines.filter((p) => (!selectedOnly || selection.has(p.id))
      && (!s || `${p.pipelineName} ${(p.stages || []).map((st) => st.name).join(' ')} ${(p.availableto || []).join(' ')}`.toLowerCase().includes(s)));
  }, [pipelines, q, selectedOnly, selection]);
  const paging = usePagination(filtered, { initialSize: 10, storageKey: 'pipelines' });
  const { pageItems: rows, setPage } = paging;
  const selected = pipelines.filter((p) => selection.has(p.id));

  if (!duplicatePipeline) return <div role="alert" className="card bg-danger-50 p-6 font-semibold text-danger-700">Pipelines are not set up in DataContext.js</div>;

  const openNew = () => navigate(`${LIST_PATH}/new`);
  const openEdit = (p) => navigate(`${LIST_PATH}/${p.id}`);
  const remove = () => {
    const ids = confirm.map((p) => p.id);
    deletePipelines(ids); selection.setMany(ids, false); setConfirm(null);
    notify(`Deleted ${ids.length} pipeline${ids.length > 1 ? 's' : ''}`);
  };
  const exportCsv = (items) => {
    downloadCsv('pipelines.csv', [['Pipeline', 'Stages', 'Automations', 'Available to', 'Sort jobs by', 'Default job template', 'Updated'],
      ...items.map((p) => [p.pipelineName, (p.stages || []).map((s) => s.name).join(' → '), automationCount(p), (p.availableto || []).join('; '),
        SORT_JOBS_BY.find((o) => o.value === p.sortjobsby)?.label || '', jobTemplateById.get(String(p.defaultjobtemplate)) || '', fmtDate(p.updatedAt)])]);
    notify(`Exported ${items.length} pipelines`);
  };

  const stats = [
    ['Pipelines', pipelines.length],
    ['Stages', pipelines.reduce((n, p) => n + (p.stages?.length || 0), 0)],
    ['Automations', pipelines.reduce((n, p) => n + automationCount(p), 0)],
    ['With a default job template', pipelines.filter((p) => p.defaultjobtemplate).length],
  ];

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-sm text-muted">Templates / Pipeline Templates</div>
          <h1 className="mt-1 text-3xl font-bold">Pipeline Templates</h1>
          <p className="mt-1 text-muted">Stages jobs move through, with automations that run at each stage.</p>
        </div>
        <button className="btn-primary" onClick={openNew}>+ New pipeline</button>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(([label, n]) => (
          <div key={label} className="card p-4 sm:p-5"><div className="text-sm text-muted">{label}</div><div className="mt-1.5 text-2xl font-bold">{n}</div></div>
        ))}
      </div>

      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-4 sm:px-5">
          <label className="flex min-h-[44px] flex-[1_1_260px] items-center gap-2 rounded border border-line-strong px-3 focus-within:border-brand-600">
            <FiSearch size={18} className="text-muted" aria-hidden="true" /><span className="sr-only">Search pipelines</span>
            <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search pipeline, stage, team member" className="min-w-0 flex-1 bg-transparent outline-none" />
          </label>
          {q && <button onClick={() => { setQ(''); setPage(1); }} className="btn-link px-2">Clear</button>}
        </div>

        <BulkBar count={selection.count} total={filtered.length}
          onSelectAll={() => selection.setMany(filtered.map((p) => p.id), true)} onClear={selection.clear}
          filters={<SelectedOnlyFilter checked={selectedOnly} onChange={(v) => { setSelectedOnly(v); setPage(1); }} />}
          actions={<>
            <button className={barButton} onClick={() => { selected.forEach((p) => duplicatePipeline(p.id)); notify(`Duplicated ${selected.length} pipeline${selected.length > 1 ? 's' : ''}`); selection.clear(); }}><FiCopy aria-hidden="true" /> Duplicate</button>
            <button className={barButton} onClick={() => exportCsv(selected)}><FiDownload aria-hidden="true" /> Export</button>
            <button className={barDanger} onClick={() => setConfirm(selected)}><FiTrash2 aria-hidden="true" /> Delete</button>
          </>}
        />

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] border-collapse">
            <thead>
              <tr className="bg-subtle text-left text-xs uppercase tracking-wide text-muted">
                <th className="w-12 py-3 pl-5 pr-1"><HeaderCheckbox selection={selection} pageIds={rows.map((p) => p.id)} /></th>
                <th className="px-3 py-3 font-semibold">Pipeline</th>
                <th className="px-3 py-3 font-semibold">Stages</th>
                <th className="px-3 py-3 font-semibold">Automations</th>
                <th className="px-3 py-3 font-semibold">Available to</th>
                <th className="px-3 py-3 font-semibold">Default job template</th>
                <th className="px-3 py-3 font-semibold">Updated</th>
                <th className="px-5 py-3 text-right font-semibold"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const checked = selection.has(p.id);
                const stages = p.stages || [];
                return (
                  <tr key={p.id} aria-selected={checked} className={cx('border-t border-line-soft', checked ? 'bg-brand-50' : 'hover:bg-subtle/60')}>
                    <td className="py-3 pl-5 pr-1"><SelectCheckbox label={`Select ${p.pipelineName}`} checked={checked} onChange={() => selection.toggle(p.id)} /></td>
                    <td className="max-w-[340px] px-3 py-3">
                      <button onClick={() => openEdit(p)} className="text-left font-semibold hover:text-brand-600 hover:underline">{p.pipelineName}</button>
                      <div className="mt-1 flex flex-wrap items-center gap-1 text-xs text-muted">
                        {stages.slice(0, 4).map((s, i) => <span key={s.id || i} className="flex items-center gap-1">{i > 0 && <span aria-hidden="true">→</span>}<span className="rounded bg-subtle px-1.5 py-0.5">{s.name}</span></span>)}
                        {stages.length > 4 && <span>→ +{stages.length - 4}</span>}
                      </div>
                    </td>
                    <td className="px-3 py-3 font-semibold">{stages.length}</td>
                    <td className="px-3 py-3 text-sm">{automationCount(p) ? <span className="inline-flex items-center gap-1"><FiZap className="text-warning-700" aria-hidden="true" />{automationCount(p)}</span> : <span className="text-muted">—</span>}</td>
                    <td className="px-3 py-3">
                      {(p.availableto || []).length ? (
                        <div className="flex -space-x-2" title={p.availableto.join(', ')}>
                          {p.availableto.slice(0, 4).map((n) => <span key={n} className="rounded-full ring-2 ring-surface"><Avatar text={initials(n)} size="sm" tone="solid" /></span>)}
                        </div>
                      ) : <span className="text-muted">Everyone</span>}
                    </td>
                    <td className="px-3 py-3 text-sm">{jobTemplateById.get(String(p.defaultjobtemplate)) || <span className="text-muted">—</span>}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-muted">{fmtDate(p.updatedAt)}</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        {/* <button onClick={() => openEdit(p)} aria-label={`Edit ${p.pipelineName}`} className="flex h-9 w-9 items-center justify-center rounded text-muted hover:bg-subtle hover:text-ink"><FiEdit2 aria-hidden="true" /></button>
                        <button onClick={() => { duplicatePipeline(p.id); notify(`Duplicated “${p.pipelineName}”`); }} aria-label={`Duplicate ${p.pipelineName}`} className="flex h-9 w-9 items-center justify-center rounded text-muted hover:bg-subtle hover:text-ink"><FiCopy aria-hidden="true" /></button>
                        <button onClick={() => setConfirm([p])} aria-label={`Delete ${p.pipelineName}`} className="flex h-9 w-9 items-center justify-center rounded text-danger-700 hover:bg-danger-50"><FiTrash2 aria-hidden="true" /></button> */}
                      <RowActionsMenu
                        label={p.pipelineName}
                        onEdit={() => openEdit(p)}
                        onDuplicate={() => { duplicatePipeline(p.id); notify(`Duplicated “${p.pipelineName}”`); }}
                        onDelete={() => setConfirm([p])}
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
              {pipelines.length ? 'No pipelines match your search.' : 'No pipelines yet.'}
              {!pipelines.length && <button onClick={openNew} className="btn-primary">+ New pipeline</button>}
            </div>
          )}
        </div>
        <Pagination {...paging} label="pipelines" />
      </section>

      {confirm && (
        <Modal title={confirm.length === 1 ? `Delete “${confirm[0].pipelineName}”?` : `Delete ${confirm.length} pipelines?`} onClose={() => setConfirm(null)}
          footer={<><button className="btn-secondary" onClick={() => setConfirm(null)}>Cancel</button><button className="btn bg-danger-700 text-white hover:bg-[#831E15]" onClick={remove}>Delete</button></>}>
          <p className="text-muted">Jobs already in {confirm.length === 1 ? 'this pipeline' : 'these pipelines'} are not affected.</p>
        </Modal>
      )}
      {toast && <div role="status" className="fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-md bg-ink px-5 py-3 font-semibold text-white">{toast}</div>}
    </div>
  );
}