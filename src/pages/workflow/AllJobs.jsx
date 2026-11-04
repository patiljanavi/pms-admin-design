import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FiAlertCircle, FiArrowRight, FiChevronDown, FiChevronUp, FiDownload, FiExternalLink, FiMove, FiPlus, FiSearch, FiTrash2 } from 'react-icons/fi';
import MultiSelect from '../../components/MultiSelect';
import Pagination, { usePagination } from '../../components/Pagination';
import RowActionsMenu from '../../components/RowActionsMenu';
import {
  BarSelect, BulkBar, HeaderCheckbox, SelectCheckbox, SelectedOnlyFilter, barDanger, barButton, downloadCsv, useSelection,
} from '../../components/TableSelection';
import useJobActions from '../../components/workflow/useJobActions';
import { Avatar, Modal, cx, initials } from '../../components/ui';
import { useData } from '../../context/DataContext';
import { WORKFLOW_PIPELINES_PATH, accountTabPath } from '../../config';
import { PRIORITY_STYLE } from '../../data/taskTemplates';
import { TEAM_MEMBERS } from '../../data/sampleData';
import { daysInStage, isOverdue } from '../../data/jobs';

const fmt = (d) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—');
const PRIORITY_RANK = { Urgent: 0, High: 1, Medium: 2, Low: 3 };
const TEAM_OPTIONS = TEAM_MEMBERS.map((m) => ({ ...m, value: m.label }));
const inDays = (d, n) => { const t = new Date(); t.setHours(0, 0, 0, 0); const due = new Date(`${d}T00:00:00`); return due >= t && (due - t) / 86400000 <= n; };

/**
 * Workflow → Jobs: every job in every pipeline.
 * Filters: search · Pipeline · Stage · Account · Job assignees · Overdue only.
 * Table: sortable columns, stage changes in place (automations run), bulk Assign / Move to stage / Export / Delete.
 * Links: ?pipeline=<id>&account=<id> pre-set filters; ?new=job opens Create Job.
 */
export default function AllJobs() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { jobs = [], pipelines = [], accounts = [], saveJob, deleteJobs } = useData();
  const jobUi = useJobActions();

  const [q, setQ] = useState('');
  const [pipelineFilter, setPipelineFilter] = useState(() => (params.get('pipeline') ? [params.get('pipeline')] : []));
  const [stageFilter, setStageFilter] = useState([]);
  const [accountFilter, setAccountFilter] = useState(() => (params.get('account') ? [params.get('account')] : []));
  const [assigneeFilter, setAssigneeFilter] = useState([]);
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [sort, setSort] = useState({ key: 'dueDate', dir: 'asc' });
  const [confirmDelete, setConfirmDelete] = useState(null);

  // ?new=job (from "+ New → Jobs") opens the Create Job drawer
  useEffect(() => {
    if (params.get('new') === 'job') {
      jobUi.addJob({});
      const n = new URLSearchParams(params); n.delete('new'); setParams(n, { replace: true });
    }
  }, [params]); // eslint-disable-line react-hooks/exhaustive-deps

  const accountById = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);
  const pipelineById = useMemo(() => new Map(pipelines.map((p) => [p.id, p])), [pipelines]);
  const stageOf = (j) => {
    const p = pipelineById.get(j.pipelineId);
    return p?.stages.find((s) => s.id === j.stageId) || p?.stages[0] || null;
  };
  // only jobs whose pipeline still exists
  const allJobs = useMemo(() => jobs.filter((j) => pipelineById.has(j.pipelineId)), [jobs, pipelineById]);

  /* ---------- filter options ---------- */
  const pipelineOptions = pipelines.map((p) => ({ value: p.id, label: p.pipelineName, meta: `${p.stages.length} stages` }));
  // stages of the chosen pipelines (or of every pipeline), each labelled with its pipeline
  const stageOptions = pipelines.filter((p) => !pipelineFilter.length || pipelineFilter.includes(p.id))
    .flatMap((p) => p.stages.map((s) => ({ value: s.id, label: s.name, meta: p.pipelineName })));
  // a stage picked earlier disappears when its pipeline is no longer chosen
  useEffect(() => {
    const ok = new Set(stageOptions.map((o) => o.value));
    setStageFilter((list) => (list.every((id) => ok.has(id)) ? list : list.filter((id) => ok.has(id))));
  }, [pipelineFilter.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps
  const accountOptions = accounts.map((a) => ({ value: a.id, label: a.name, meta: a.company }));

  /* ---------- filtering + sorting ---------- */
  const selection = useSelection();
  const [selectedOnly, setSelectedOnly] = useState(false);
  useEffect(() => { if (selection.count === 0) setSelectedOnly(false); }, [selection.count]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const list = allJobs.filter((j) => {
      if (pipelineFilter.length && !pipelineFilter.includes(j.pipelineId)) return false;
      if (stageFilter.length && !stageFilter.includes(stageOf(j)?.id)) return false;
      if (accountFilter.length && !accountFilter.includes(j.accountId)) return false;
      if (assigneeFilter.length && !assigneeFilter.some((m) => (j.assignees || []).includes(m))) return false;
      if (overdueOnly && !isOverdue(j)) return false;
      if (selectedOnly && !selection.has(j.id)) return false;
      if (!s) return true;
      return `${j.name} ${accountById.get(j.accountId)?.name || ''} ${(j.assignees || []).join(' ')}`.toLowerCase().includes(s);
    });
    const val = {
      name: (j) => j.name.toLowerCase(),
      account: (j) => (accountById.get(j.accountId)?.name || '').toLowerCase(),
      pipeline: (j) => (pipelineById.get(j.pipelineId)?.pipelineName || '').toLowerCase(),
      stage: (j) => pipelineById.get(j.pipelineId)?.stages.findIndex((st) => st.id === stageOf(j)?.id) ?? 0,
      priority: (j) => PRIORITY_RANK[j.priority] ?? 9,
      assignees: (j) => (j.assignees || []).join(', ').toLowerCase() || '~',
      dueDate: (j) => j.dueDate || '9999-12-31',
      days: (j) => daysInStage(j),
    }[sort.key];
    return [...list].sort((a, b) => { const x = val(a); const y = val(b); return (x < y ? -1 : x > y ? 1 : 0) * (sort.dir === 'asc' ? 1 : -1); });
  }, [allJobs, q, pipelineFilter, stageFilter, accountFilter, assigneeFilter, overdueOnly, selectedOnly, selection, sort, accountById, pipelineById]); // eslint-disable-line react-hooks/exhaustive-deps

  const paging = usePagination(filtered, { initialSize: 25, storageKey: 'all-jobs' });
  const { pageItems: rows, setPage } = paging;
  const selected = allJobs.filter((j) => selection.has(j.id));
  const filtersOn = q || pipelineFilter.length || stageFilter.length || accountFilter.length || assigneeFilter.length || overdueOnly;
  const clearFilters = () => { setQ(''); setPipelineFilter([]); setStageFilter([]); setAccountFilter([]); setAssigneeFilter([]); setOverdueOnly(false); setPage(1); setParams({}, { replace: true }); };
  const withPage1 = (fn) => (v) => { fn(v); setPage(1); };

  const stats = [
    ['All jobs', allJobs.length],
    ['Overdue', allJobs.filter((j) => isOverdue(j)).length],
    ['Due in 7 days', allJobs.filter((j) => j.dueDate && inDays(j.dueDate, 7)).length],
    ['Unassigned', allJobs.filter((j) => !(j.assignees || []).length).length],
  ];

  /* ---------- bulk ---------- */
  const samePipeline = selected.length > 0 && selected.every((j) => j.pipelineId === selected[0].pipelineId) ? pipelineById.get(selected[0].pipelineId) : null;
  const bulkAssign = (member) => {
    if (!member) return;
    selected.forEach((j) => { if (!(j.assignees || []).includes(member)) saveJob({ ...j, assignees: [...(j.assignees || []), member] }); });
    jobUi.notify(`Assigned ${member} to ${selected.length} job${selected.length > 1 ? 's' : ''}`);
  };
  const bulkMove = (stageId) => { if (stageId && samePipeline) jobUi.moveMany(selected, stageId); };
  const exportCsv = (list) => {
    downloadCsv('jobs.csv', [['Job', 'Account', 'Pipeline', 'Stage', 'Priority', 'Assignees', 'Start', 'Due', 'Days in stage'],
      ...list.map((j) => [j.name, accountById.get(j.accountId)?.name || '', pipelineById.get(j.pipelineId)?.pipelineName || '', stageOf(j)?.name || '',
        j.priority || '', (j.assignees || []).join('; '), j.startDate || '', j.dueDate || '', daysInStage(j)])]);
    jobUi.notify(`Exported ${list.length} jobs`);
  };

  const Th = ({ k, children, className = '' }) => {
    const on = sort.key === k;
    return (
      <th className={cx('px-3 py-3 font-semibold', className)} aria-sort={on ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
        <button type="button" onClick={() => setSort((s) => ({ key: k, dir: s.key === k && s.dir === 'asc' ? 'desc' : 'asc' }))} className="flex items-center gap-1 uppercase hover:text-ink">
          {children}{on ? (sort.dir === 'asc' ? <FiChevronUp aria-hidden="true" /> : <FiChevronDown aria-hidden="true" />) : null}
        </button>
      </th>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <nav aria-label="Breadcrumb" className="text-sm text-muted">Workflow <span aria-hidden="true">/</span> Jobs</nav>
          <h1 className="mt-1 text-3xl font-bold">Jobs</h1>
          <p className="mt-1 text-muted">Every job in every pipeline.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-secondary" onClick={() => navigate(WORKFLOW_PIPELINES_PATH)}>Pipeline boards</button>
          <button type="button" className="btn-primary" onClick={() => jobUi.addJob({ pipelineId: pipelineFilter.length === 1 ? pipelineFilter[0] : undefined, accountIds: accountFilter })}><FiPlus aria-hidden="true" /> Add job</button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(([label, n]) => <div key={label} className="card p-4 sm:p-5"><div className="text-sm text-muted">{label}</div><div className="mt-1.5 text-2xl font-bold">{n}</div></div>)}
      </div>

      <section className="card" aria-label="All jobs">
        {/* Filters */}
        <div className="flex flex-col gap-3 border-b border-line px-4 py-4 sm:px-5">
          <div className="flex flex-wrap items-start gap-3">
            <label className="flex min-h-[44px] flex-[1_1_240px] items-center gap-2 rounded border border-line-strong px-3 focus-within:border-brand-600">
              <FiSearch className="text-muted" aria-hidden="true" /><span className="sr-only">Search jobs</span>
              <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search job, account or assignee" className="min-w-0 flex-1 bg-transparent outline-none" />
            </label>
            <div className="flex-[1_1_200px]"><MultiSelect placeholder="Pipeline" ariaLabel="Filter by pipeline" options={pipelineOptions} value={pipelineFilter} onChange={withPage1(setPipelineFilter)} emptyText="No pipelines" /></div>
            <div className="flex-[1_1_200px]">
              <MultiSelect placeholder="Stage" ariaLabel="Filter by stage" options={stageOptions} value={stageFilter} onChange={withPage1(setStageFilter)} emptyText="No stages"
                renderOption={(o) => <span className="flex flex-1 flex-col"><span className="font-semibold">{o.label}</span><span className="text-xs text-muted">{o.meta}</span></span>} />
            </div>
          </div>
          <div className="flex flex-wrap items-start gap-3">
            <div className="flex-[1_1_220px]">
              <MultiSelect placeholder="Account name" ariaLabel="Filter by account" options={accountOptions} value={accountFilter} onChange={withPage1(setAccountFilter)} emptyText="No accounts"
                renderOption={(o) => <span className="flex flex-1 items-center gap-2.5"><Avatar text={initials(o.label)} size="sm" /><span><span className="block font-semibold">{o.label}</span><span className="block text-xs text-muted">{o.meta}</span></span></span>} />
            </div>
            <div className="flex-[1_1_220px]">
              <MultiSelect placeholder="Job assignees" ariaLabel="Filter by assignee" options={TEAM_OPTIONS} value={assigneeFilter} onChange={withPage1(setAssigneeFilter)}
                renderOption={(o) => <span className="flex flex-1 items-center gap-2.5"><Avatar text={initials(o.label)} size="sm" /><span className="font-semibold">{o.label}</span></span>} />
            </div>
            <label className="flex min-h-[44px] items-center gap-2 rounded border border-line-strong px-3 text-sm font-semibold">
              <input type="checkbox" className="h-4 w-4 accent-danger-700" checked={overdueOnly} onChange={(e) => { setOverdueOnly(e.target.checked); setPage(1); }} /> Overdue only
            </label>
            {filtersOn ? <button type="button" onClick={clearFilters} className="btn-link min-h-[44px] px-2">Clear filters</button> : null}
          </div>
          <p className="text-sm text-muted" aria-live="polite" data-testid="jobs-count">{filtered.length} of {allJobs.length} jobs</p>
        </div>

        <BulkBar count={selection.count} total={filtered.length}
          onSelectAll={() => selection.setMany(filtered.map((j) => j.id), true)} onClear={selection.clear}
          filters={<SelectedOnlyFilter checked={selectedOnly} onChange={(v) => { setSelectedOnly(v); setPage(1); }} />}
          actions={<>
            <BarSelect label="Assign" value="" onChange={bulkAssign} options={[{ value: '', label: 'Choose…' }, ...TEAM_MEMBERS.map((m) => m.label)]} />
            {samePipeline
              ? <BarSelect label="Move to stage" value="" onChange={bulkMove} options={[{ value: '', label: 'Choose…' }, ...samePipeline.stages.map((s, i) => ({ value: s.id, label: `${i + 1}. ${s.name}${s.automations?.length ? ' ⚡' : ''}` }))]} />
              : <span className="text-xs text-muted" title="Select jobs from one pipeline to move them"><FiMove className="mr-1 inline" aria-hidden="true" />Move: pick one pipeline</span>}
            <button className={barButton} onClick={() => exportCsv(selected)}><FiDownload aria-hidden="true" /> Export</button>
            <button className={barDanger} onClick={() => setConfirmDelete(selected)}><FiTrash2 aria-hidden="true" /> Delete</button>
          </>}
        />

        <div className="overflow-x-auto">
          <table aria-label="Jobs" className="w-full min-w-[1080px] border-collapse text-sm">
            <thead>
              <tr className="bg-subtle text-left text-xs tracking-wide text-muted">
                <th className="w-12 py-3 pl-5 pr-1"><HeaderCheckbox selection={selection} pageIds={rows.map((j) => j.id)} /></th>
                <Th k="name">Job</Th>
                <Th k="account">Account</Th>
                <Th k="pipeline">Pipeline</Th>
                <Th k="stage">Stage</Th>
                <Th k="priority">Priority</Th>
                <Th k="assignees">Assignees</Th>
                <Th k="dueDate">Due</Th>
                <Th k="days">In stage</Th>
                <th className="px-5 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((j) => {
                const p = pipelineById.get(j.pipelineId);
                const st = stageOf(j);
                const acct = accountById.get(j.accountId);
                const overdue = isOverdue(j);
                const checked = selection.has(j.id);
                const days = daysInStage(j);
                return (
                  <tr key={j.id} aria-selected={checked} className={cx('border-t border-line-soft', checked ? 'bg-brand-50' : 'hover:bg-subtle/60')}>
                    <td className="py-3 pl-5 pr-1"><SelectCheckbox label={`Select ${j.name}`} checked={checked} onChange={() => selection.toggle(j.id)} /></td>
                    <td className="px-3 py-3"><button type="button" onClick={() => jobUi.editJob(j)} className="text-left font-semibold hover:text-brand-600 hover:underline">{j.name}</button></td>
                    <td className="px-3 py-3">{acct ? <button type="button" onClick={() => navigate(accountTabPath('workflow', acct.id))} className="text-left hover:text-brand-600 hover:underline">{acct.name}</button> : <span className="text-muted">—</span>}</td>
                    <td className="px-3 py-3"><button type="button" onClick={() => navigate(`${WORKFLOW_PIPELINES_PATH}/${p.id}`)} className="text-left hover:text-brand-600 hover:underline">{p.pipelineName}</button></td>
                    <td className="px-3 py-3">
                      <select aria-label={`Stage of ${j.name}`} className="input min-h-[34px] w-auto max-w-[200px] py-0 text-sm" value={st?.id || ''} onChange={(e) => jobUi.moveTo(j, e.target.value)}>
                        {p.stages.map((s, i) => <option key={s.id} value={s.id}>{i + 1}. {s.name}{s.automations?.length ? ' ⚡' : ''}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-3">{j.priority && <span className={cx('rounded-full px-2 py-0.5 text-xs font-semibold', PRIORITY_STYLE[j.priority])}>{j.priority}</span>}</td>
                    <td className="px-3 py-3">
                      {(j.assignees || []).length ? (
                        <span className="flex items-center gap-1.5" title={j.assignees.join(', ')}>
                          <span className="flex -space-x-2">{j.assignees.slice(0, 3).map((m) => <span key={m} className="rounded-full ring-2 ring-surface"><Avatar text={initials(m)} size="sm" tone="solid" /></span>)}</span>
                          <span className="max-w-[120px] truncate text-muted">{j.assignees.length === 1 ? j.assignees[0] : `${j.assignees.length} people`}</span>
                        </span>
                      ) : <span className="text-muted">Unassigned</span>}
                    </td>
                    <td className={cx('whitespace-nowrap px-3 py-3', overdue ? 'font-semibold text-danger-700' : 'text-muted')}>{overdue && <FiAlertCircle className="mr-1 inline" aria-label="Overdue" />}{fmt(j.dueDate)}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-muted">{days} day{days === 1 ? '' : 's'}</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end">
                        <RowActionsMenu label={j.name} onEdit={() => jobUi.editJob(j)}
                          extra={[
                            { label: 'Move to stage…', icon: FiMove, onClick: () => jobUi.askMove(j) },
                            { label: 'Open board', icon: FiArrowRight, onClick: () => navigate(`${WORKFLOW_PIPELINES_PATH}/${p.id}`) },
                            ...(acct ? [{ label: 'Open account', icon: FiExternalLink, onClick: () => navigate(accountTabPath('workflow', acct.id)) }] : []),
                          ]}
                          onDelete={() => jobUi.askDelete(j)} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center gap-3 p-12 text-center text-muted">
              {allJobs.length ? 'No jobs match these filters.' : 'No jobs yet.'}
              {filtersOn ? <button onClick={clearFilters} className="btn-secondary">Clear filters</button> : <button onClick={() => jobUi.addJob({})} className="btn-primary"><FiPlus aria-hidden="true" /> Add job</button>}
            </div>
          )}
        </div>
        <Pagination {...paging} label="jobs" />
      </section>

      {confirmDelete && (
        <Modal title={`Delete ${confirmDelete.length} job${confirmDelete.length > 1 ? 's' : ''}?`} onClose={() => setConfirmDelete(null)}
          footer={<><button className="btn-secondary" onClick={() => setConfirmDelete(null)}>Cancel</button>
            <button className="btn bg-danger-700 text-white hover:bg-[#831E15]" onClick={() => { deleteJobs(confirmDelete.map((j) => j.id)); selection.clear(); setConfirmDelete(null); jobUi.notify(`Deleted ${confirmDelete.length} job${confirmDelete.length > 1 ? 's' : ''}`); }}>Delete jobs</button></>}>
          <p className="text-muted">These jobs are removed from their pipelines.</p>
          <ul className="mt-3 max-h-40 list-disc overflow-y-auto pl-5">{confirmDelete.map((j) => <li key={j.id}>{j.name}</li>)}</ul>
        </Modal>
      )}
      {jobUi.ui}
    </div>
  );
}