import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiAlertCircle, FiCalendar, FiClock, FiExternalLink, FiMove, FiPlus, FiZap } from 'react-icons/fi';
import RowActionsMenu from '../RowActionsMenu';
import TagChip from '../TagChip';
import { Avatar, cx, initials } from '../ui';
import { useData } from '../../context/DataContext';
import { accountTabPath } from '../../config';
import { PRIORITY_STYLE } from '../../data/taskTemplates';
import { statusOptionsFrom } from '../../data/statusOptions';
import { daysInStage, isOverdue, sortJobs } from '../../data/jobs';

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

/**
 * Kanban columns for one pipeline (shared by Workflow → Pipelines and the account Workflow tab).
 * Props:
 *   pipeline · jobs (the jobs to show) · countJobs (for the column counts; default = jobs) · sortBy · filtersOn
 *   onDropJob(job, stageId) · onEdit(job) · onMoveRequest(job) · onDelete(job) · onOpenAccount(job) · onAddJob(stageId)
 */
export default function KanbanBoard({ pipeline, jobs, countJobs, sortBy = 'dueDate', filtersOn = false, onDropJob, onEdit, onMoveRequest, onDelete, onOpenAccount, onAddJob }) {
  const { accounts = [], tagById = new Map(), jobTemplates = [], clientFacingJobs, clientStatuses } = useData();
  const [dragId, setDragId] = useState(null);
  const [overStage, setOverStage] = useState(null);
  const accountById = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);
  const statuses = useMemo(() => statusOptionsFrom(clientFacingJobs ?? clientStatuses ?? []), [clientFacingJobs, clientStatuses]);
  // the job's own client-facing status (set in the job or by an automation), else its template's
  const statusOf = (job) => {
    if (job.clientFacingStatus && job.selectedJob) return statuses.find((s) => String(s.id) === String(job.selectedJob)) || null;
    const tpl = jobTemplates.find((t) => t.id === job.jobTemplateId);
    return tpl?.clientFacingStatus ? statuses.find((s) => String(s.id) === String(tpl.selectedJob)) : null;
  };
  // jobs whose stage was removed show in the first stage
  const stageIds = new Set(pipeline.stages.map((s) => s.id));
  const place = (j) => (stageIds.has(j.stageId) ? j : { ...j, stageId: pipeline.stages[0]?.id });
  const shown = jobs.map(place);
  const counted = (countJobs || jobs).map(place);
  const accountName = (id) => accountById.get(id)?.name || '';

  const drop = (stageId) => {
    const job = shown.find((j) => j.id === dragId);
    setDragId(null); setOverStage(null);
    if (job && job.stageId !== stageId) onDropJob(job, stageId);
  };

  return (
    <div className="-mx-1 overflow-x-auto pb-2">
      <ol aria-label="Stages" className="flex min-h-[420px] gap-3 px-1">
        {pipeline.stages.map((s, i) => {
          const list = sortJobs(shown.filter((j) => j.stageId === s.id), sortBy, accountName);
          const total = counted.filter((j) => j.stageId === s.id).length;
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
                    onOpenAccount={() => onOpenAccount?.(j)} onEdit={() => onEdit(j)} onMove={() => onMoveRequest(j)} onDelete={() => onDelete(j)} />
                ))}
                {!list.length && <li className="rounded-md border border-dashed border-line-strong px-3 py-6 text-center text-xs text-muted">{filtersOn && total ? 'No matching jobs' : 'Drop jobs here'}</li>}
              </ul>
              {/* {onAddJob && (
                <button type="button" onClick={() => onAddJob(s.id)} aria-label={`Add job to ${s.name}`}
                  className="m-2 mt-0 flex items-center justify-center gap-1.5 rounded-md py-2 text-sm font-semibold text-muted hover:bg-surface hover:text-brand-600"><FiPlus aria-hidden="true" /> Add job</button>
              )} */}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
