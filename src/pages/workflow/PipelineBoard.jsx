import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { FiAlertCircle, FiArrowLeft, FiCalendar, FiClock, FiEdit2, FiMove, FiPlus, FiSearch, FiExternalLink, FiZap } from 'react-icons/fi';
import RowActionsMenu from '../../components/RowActionsMenu';
import TagChip from '../../components/TagChip';
import JobDrawer from '../../components/workflow/JobDrawer';
import AutomationResultsModal from '../../components/workflow/AutomationResultsModal';
import MoveJobModal from '../../components/workflow/MoveJobModal';
import { Avatar, Modal, cx, initials } from '../../components/ui';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { WORKFLOW_PIPELINES_PATH, accountTabPath } from '../../config';
import { SORT_JOBS_BY } from '../../data/pipelinesdata';
import { PRIORITY_STYLE } from '../../data/taskTemplates';
import { statusOptionsFrom } from '../../data/statusOptions';
import { daysInStage, isOverdue, sortJobs } from '../../data/jobs';
import { TEAM_MEMBERS } from '../../data/sampleData';

const fmt = (d) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '');

/** One job card. Shows the fields chosen in the pipeline's "Job Card Fields". */
function JobCard({ job, pipeline, account, tags, status, onEdit, onMove, onDelete, onOpenAccount, onDragStart, onDragEnd, dragging }) {
  const f = pipeline;              // job card field switches live on the pipeline (accountId, name, priority, …)
  const days = daysInStage(job);
  const overdue = isOverdue(job);
  return (
    <li draggable onDragStart={onDragStart} onDragEnd={onDragEnd} aria-label={job.name}
      className={cx('cursor-grab rounded-lg border bg-surface p-3 shadow-card transition-shadow hover:shadow-pop active:cursor-grabbing', dragging ? 'border-dashed border-brand-600 opacity-50' : 'border-line')}>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          {f.accountId && account && (
            <Link to={accountTabPath('workflow', account.id)} className="block truncate text-xs font-semibold text-brand-600 hover:underline" onClick={(e) => e.stopPropagation()}>{account.name}</Link>
          )}
          <button type="button" onClick={onEdit} className="text-left font-semibold leading-snug hover:text-brand-600 hover:underline">{f.name !== false ? job.name : account?.name || job.name}</button>
        </div>
        <RowActionsMenu label={job.name} onEdit={onEdit}
          extra={[{ label: 'Move to stage…', icon: FiMove, onClick: onMove }, ...(account ? [{ label: 'Open account', icon: FiExternalLink, onClick: onOpenAccount }] : [])]}
          onDelete={onDelete} />
      </div>

      {f.description && job.description && <p className="mt-1.5 line-clamp-2 text-xs text-muted">{job.description}</p>}
      {f.accounttags && tags.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{tags.map((t) => <TagChip key={t.value} tag={t} size="xs" />)}</div>}

      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted">
        {f.priority && job.priority && <span className={cx('rounded-full px-2 py-0.5 font-semibold', PRIORITY_STYLE[job.priority])}>{job.priority}</span>}
        {f.startdate && job.startDate && <span className="flex items-center gap-1" title="Start date"><FiCalendar aria-hidden="true" />{fmt(job.startDate)}</span>}
        {f.duedate && job.dueDate && (
          <span className={cx('flex items-center gap-1', overdue && 'font-semibold text-danger-700')} title={overdue ? 'Overdue' : 'Due date'}>
            {overdue ? <FiAlertCircle aria-hidden="true" /> : <FiCalendar aria-hidden="true" />}Due {fmt(job.dueDate)}{overdue && <span className="sr-only"> (overdue)</span>}
          </span>
        )}
        {f.daysInStage && <span className="flex items-center gap-1" title="Days in this stage"><FiClock aria-hidden="true" />{days} day{days === 1 ? '' : 's'} in stage</span>}
        {f.clientFacingStatus && status && <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: status.color }} aria-hidden="true" />{status.name}</span>}
      </div>

      {f.assignees && job.assignees?.length > 0 && (
        <div className="mt-2.5 flex items-center gap-1.5" title={job.assignees.join(', ')}>
          <span className="flex -space-x-2">{job.assignees.slice(0, 3).map((m) => <span key={m} className="rounded-full ring-2 ring-surface"><Avatar text={initials(m)} size="sm" tone="solid" /></span>)}</span>
          <span className="truncate text-xs text-muted">{job.assignees.length === 1 ? job.assignees[0] : `${job.assignees.length} assignees`}</span>
        </div>
      )}
    </li>
  );
}

/** Kanban board of one pipeline: a column per stage; drag jobs between stages. /pipelines/:pipelineId */
export default function PipelineBoard() {
  const { pipelineId } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const accountFilter = params.get('account');            // /pipelines/:id?account=<accountId> (from the account Workflow tab)
  const { pipelines = [], jobs = [], accounts = [], tagById = new Map(), jobTemplates = [], clientFacingJobs, clientStatuses, moveJob, deleteJobs } = useData();
  const { user } = useAuth() || {};
  const pipeline = pipelines.find((p) => String(p.id) === String(pipelineId));
  const [q, setQ] = useState('');
  const [assignee, setAssignee] = useState('All');
  const [sortBy, setSortBy] = useState(pipeline?.sortjobsby || 'dueDate');
  const [dragId, setDragId] = useState(null);
  const [overStage, setOverStage] = useState(null);
  const [modal, setModal] = useState(null);       // { kind: 'job', job?, stageId? } | { kind: 'move', job } | { kind: 'delete', job } | { kind: 'results', groups }
  const [toast, setToast] = useState('');
  const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 2400); };

  const accountById = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);
  const statuses = useMemo(() => statusOptionsFrom(clientFacingJobs ?? clientStatuses ?? []), [clientFacingJobs, clientStatuses]);
  // the job's own client-facing status (set in the job or by an automation), else its template's
  const statusOf = (job) => {
    if (job.clientFacingStatus && job.selectedJob) return statuses.find((s) => String(s.id) === String(job.selectedJob)) || null;
    const tpl = jobTemplates.find((t) => t.id === job.jobTemplateId);
    return tpl?.clientFacingStatus ? statuses.find((s) => String(s.id) === String(tpl.selectedJob)) : null;
  };
  /** Move a job; the stage's automations run for its account. */
  const moveTo = (job, stageId) => {
    const results = moveJob(job.id, stageId, { me: user?.name });
    const ran = results.filter((r) => r.ok).length;
    notify(`Moved “${job.name}” to ${stageName(stageId)}${ran ? ` · ${ran} automation${ran > 1 ? 's' : ''} ran` : ''}`);
    setModal(results.length ? { kind: 'results', groups: [{ accountName: accountById.get(job.accountId)?.name || '', results }] } : null);
  };

  if (!pipeline) {
    return (
      <div className="flex flex-col items-start gap-4">
        <h1 className="text-3xl font-bold">Pipeline not found</h1>
        <Link to={WORKFLOW_PIPELINES_PATH} className="btn-primary">Back to pipelines</Link>
      </div>
    );
  }

  const stageIds = new Set(pipeline.stages.map((s) => s.id));
  const mine = jobs.filter((j) => j.pipelineId === pipeline.id)
    .map((j) => (stageIds.has(j.stageId) ? j : { ...j, stageId: pipeline.stages[0]?.id }));   // jobs whose stage was removed show in the first stage
  const visible = mine.filter((j) => (!accountFilter || j.accountId === accountFilter) && (assignee === 'All' || (j.assignees || []).includes(assignee))
    && (!q.trim() || `${j.name} ${accountById.get(j.accountId)?.name || ''}`.toLowerCase().includes(q.trim().toLowerCase())));
  const accountName = (id) => accountById.get(id)?.name || '';
  const stageName = (id) => pipeline.stages.find((s) => s.id === id)?.name;

  const drop = (stageId) => {
    const job = mine.find((j) => j.id === dragId);
    setDragId(null); setOverStage(null);
    if (!job || job.stageId === stageId) return;
    moveTo(job, stageId);
  };
  const filtersOn = q || assignee !== 'All' || accountFilter;

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <header className="flex flex-wrap items-start gap-4">
        <Link to={WORKFLOW_PIPELINES_PATH} aria-label="Back to pipelines" className="mt-1 flex h-10 w-10 flex-none items-center justify-center rounded border border-line-strong bg-surface hover:bg-subtle"><FiArrowLeft size={18} /></Link>
        <div className="min-w-0 flex-1">
          <nav aria-label="Breadcrumb" className="text-sm text-muted">Workflow <span aria-hidden="true">/</span> <Link to={WORKFLOW_PIPELINES_PATH} className="hover:underline">Pipelines</Link></nav>
          <h1 className="truncate text-2xl font-bold sm:text-3xl">{pipeline.pipelineName}</h1>
          <p className="text-muted">{pipeline.stages.length} stages · {mine.length} job{mine.length === 1 ? '' : 's'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={`/firmtemp/pipelines/${pipeline.id}`} className="btn-secondary"><FiEdit2 aria-hidden="true" /> Edit pipeline</Link>
          <button type="button" className="btn-primary" onClick={() => setModal({ kind: 'job', stageId: pipeline.stages[0]?.id })}><FiPlus aria-hidden="true" /> Add job</button>
        </div>
      </header>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex min-h-[42px] flex-[1_1_240px] items-center gap-2 rounded border border-line-strong bg-surface px-3 focus-within:border-brand-600">
          <FiSearch className="text-muted" aria-hidden="true" /><span className="sr-only">Search jobs</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search job or account" className="min-w-0 flex-1 bg-transparent outline-none" />
        </label>
        <label className="flex items-center gap-2 text-sm text-muted">Assignee
          <select className="input min-h-[42px] w-auto" value={assignee} onChange={(e) => setAssignee(e.target.value)}>
            <option value="All">All</option>
            {TEAM_MEMBERS.map((m) => <option key={m.label}>{m.label}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-muted">Sort by
          <select className="input min-h-[42px] w-auto" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            {SORT_JOBS_BY.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>
        {accountFilter && accountById.get(accountFilter) && (
          <span className="flex items-center gap-1.5 rounded-full bg-brand-100 py-1 pl-3 pr-1 text-sm font-semibold text-brand-800">
            {accountById.get(accountFilter).name}
            <button type="button" onClick={() => setParams({})} aria-label="Show all accounts" className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-brand-600 hover:text-white">✕</button>
          </span>
        )}
        {filtersOn && <button type="button" className="btn-link px-2" onClick={() => { setQ(''); setAssignee('All'); setParams({}); }}>Clear filters</button>}
      </div>

      {/* Board */}
      <div className="-mx-1 overflow-x-auto pb-2">
        <ol aria-label="Stages" className="flex min-h-[420px] gap-3 px-1">
          {pipeline.stages.map((s, i) => {
            const list = sortJobs(visible.filter((j) => j.stageId === s.id), sortBy, accountName);
            const total = mine.filter((j) => j.stageId === s.id).length;
            return (
              <li key={s.id} aria-label={`Stage ${i + 1}: ${s.name}`}
                onDragOver={(e) => { e.preventDefault(); setOverStage(s.id); }} onDragLeave={() => setOverStage((v) => (v === s.id ? null : v))} onDrop={() => drop(s.id)}
                className={cx('flex w-[290px] flex-none flex-col rounded-lg border bg-subtle/70 transition-colors', overStage === s.id && dragId ? 'border-brand-600 bg-brand-50' : 'border-line')}>
                <div className="flex items-center gap-2 border-b border-line px-3 py-2.5">
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-surface px-1 text-[11px] font-bold text-muted">{i + 1}</span>
                  <h2 className="flex-1 truncate font-semibold">{s.name}</h2>
                  {s.automations?.length > 0 && <FiZap className="text-warning-700" aria-label={`${s.automations.length} automations`} title={`${s.automations.length} automations`} />}
                  <span className="rounded-full bg-surface px-2 text-xs font-bold text-muted" aria-label={`${total} jobs`}>{total}</span>
                </div>
                <ul aria-label={`${s.name} jobs`} className="flex min-h-[80px] flex-1 flex-col gap-2 overflow-y-auto p-2">
                  {list.map((j) => (
                    <JobCard key={j.id} job={j} pipeline={pipeline} account={accountById.get(j.accountId)} status={statusOf(j)}
                      tags={(accountById.get(j.accountId)?.tags || []).map((id) => tagById.get(id)).filter(Boolean)}
                      dragging={dragId === j.id} onDragStart={() => setDragId(j.id)} onDragEnd={() => { setDragId(null); setOverStage(null); }}
                      onOpenAccount={() => navigate(accountTabPath('overview', j.accountId))}
                      onEdit={() => setModal({ kind: 'job', job: j })} onMove={() => setModal({ kind: 'move', job: j })} onDelete={() => setModal({ kind: 'delete', job: j })} />
                  ))}
                  {!list.length && <li className="rounded-md border border-dashed border-line-strong px-3 py-6 text-center text-xs text-muted">{filtersOn && total ? 'No matching jobs' : 'Drop jobs here'}</li>}
                </ul>
                <button type="button" onClick={() => setModal({ kind: 'job', stageId: s.id })} aria-label={`Add job to ${s.name}`}
                  className="m-2 mt-0 flex items-center justify-center gap-1.5 rounded-md py-2 text-sm font-semibold text-muted hover:bg-surface hover:text-brand-600"><FiPlus aria-hidden="true" /> Add job</button>
              </li>
            );
          })}
        </ol>
      </div>

      {modal?.kind === 'job' && (
        <JobDrawer pipelineId={pipeline.id} stageId={modal.stageId} job={modal.job} accountIds={accountFilter ? [accountFilter] : []} onClose={() => setModal(null)}
          onDone={({ message, results }) => { notify(message); setModal(results.length ? { kind: 'results', groups: results } : null); }} />
      )}
      {modal?.kind === 'move' && (
        <MoveJobModal pipeline={pipeline} job={modal.job} onClose={() => setModal(null)} onMove={(stageId) => moveTo(modal.job, stageId)} />
      )}
      {modal?.kind === 'results' && <AutomationResultsModal groups={modal.groups} onClose={() => setModal(null)} />}
      {modal?.kind === 'delete' && (
        <Modal title={`Delete “${modal.job.name}”?`} onClose={() => setModal(null)}
          footer={<><button className="btn-secondary" onClick={() => setModal(null)}>Cancel</button><button className="btn bg-danger-700 text-white hover:bg-[#831E15]" onClick={() => { deleteJobs([modal.job.id]); setModal(null); notify('Job deleted'); }}>Delete job</button></>}>
          <p className="text-muted">The job is removed from this pipeline.</p>
        </Modal>
      )}
      {toast && <div role="status" className="fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-md bg-ink px-5 py-3 font-semibold text-white">{toast}</div>}
    </div>
  );
}
