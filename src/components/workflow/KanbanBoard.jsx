import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle, Building2, Calendar, CalendarClock, ChevronsUp, Clock, ExternalLink, GripVertical, Inbox, Move, Plus,
  SignalHigh, SignalLow, SignalMedium, Zap,
} from 'lucide-react';
import RowActionsMenu from '../RowActionsMenu';
import TagChip from '../TagChip';
import { Avatar, initials } from '../ui';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { SimpleTooltip } from '../ui/tooltip';
import { cn } from 'lib/utils';
import { useData } from '../../context/DataContext';
import { accountTabPath } from '../../config';
import { statusOptionsFrom } from '../../data/statusOptions';
import { daysInStage, isOverdue, sortJobs } from '../../data/jobs';

/* ------------------------------------------------------------------------------------------
 * Small job UI pieces shared by the board, the Jobs table, the pipeline cards and the job modals.
 * ---------------------------------------------------------------------------------------- */

// Stages have no colour of their own, so each gets one by position. These are theme variables
// (HSL triplets), so the colours adjust for dark mode automatically.
const STAGE_TONES = ['--chart-1', '--chart-2', '--chart-3', '--chart-4', '--chart-5', '--violet-600', '--danger-500', '--success-600'];
/** Colour of the stage at `index` (optionally with alpha, e.g. 0.14 for tinted backgrounds). */
export const stageColor = (index = 0, alpha) => {
  const v = STAGE_TONES[((index % STAGE_TONES.length) + STAGE_TONES.length) % STAGE_TONES.length];
  return alpha == null ? `hsl(var(${v}))` : `hsl(var(${v}) / ${alpha})`;
};

/** Coloured dot for a stage, with a soft halo. */
export function StageDot({ index, className }) {
  return (
    <span aria-hidden="true" className={cn('inline-block size-2 flex-none rounded-full', className)}
      style={{ backgroundColor: stageColor(index), boxShadow: `0 0 0 3px ${stageColor(index, 0.18)}` }} />
  );
}

const PRIORITY = {
  Urgent: { variant: 'danger', icon: ChevronsUp },
  High: { variant: 'warning', icon: SignalHigh },
  Medium: { variant: 'info', icon: SignalMedium },
  Low: { variant: 'neutral', icon: SignalLow },
};
/** Priority as a badge with a signal icon (Urgent · High · Medium · Low). */
export function PriorityBadge({ priority, className }) {
  if (!priority) return null;
  const p = PRIORITY[priority] || { variant: 'neutral' };
  const Icon = p.icon;
  return <Badge variant={p.variant} className={cn('h-5 px-1.5', className)}>{Icon && <Icon aria-hidden="true" />}{priority}</Badge>;
}

const DAY = 86400000;
const startOfToday = () => { const t = new Date(); t.setHours(0, 0, 0, 0); return t; };
/** Whole days from today until `date` (negative = in the past). */
export const daysUntil = (date) => Math.round((new Date(`${date}T00:00:00`) - startOfToday()) / DAY);
const fmtDate = (d, year) => new Date(`${d}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(year ? { year: 'numeric' } : {}) });

/**
 * Due date with a tone: red when overdue, amber when due within 3 days.
 * variant "chip" (board cards) or "text" (tables).
 */
export function DueDate({ job, variant = 'text', withYear = false, prefix = '', className }) {
  if (!job?.dueDate) return variant === 'text' ? <span className="text-muted-foreground/60">—</span> : null;
  const overdue = isOverdue(job);
  const left = daysUntil(job.dueDate);
  const soon = !overdue && left >= 0 && left <= 3;
  const Icon = overdue ? AlertCircle : soon ? CalendarClock : Calendar;
  const hint = overdue ? `Overdue by ${Math.max(1, -left)} day${-left > 1 ? 's' : ''}` : left === 0 ? 'Due today' : left === 1 ? 'Due tomorrow' : `Due in ${left} days`;
  return (
    <SimpleTooltip label={`${hint} · ${fmtDate(job.dueDate, true)}`}>
      <span className={cn('inline-flex items-center gap-1 whitespace-nowrap tabular-nums',
        variant === 'chip'
          ? cn('h-5 rounded-md border px-1.5 text-[11px] font-medium',
            overdue ? 'border-danger-100 bg-danger-50 text-danger-700' : soon ? 'border-warning-100 bg-warning-50 text-warning-700' : 'bg-card text-muted-foreground')
          : cn('text-sm', overdue ? 'font-medium text-danger-700' : soon ? 'text-warning-700' : 'text-muted-foreground'),
        className)}>
        <Icon className={variant === 'chip' ? 'size-3' : 'size-3.5'} aria-hidden="true" />
        {prefix}{fmtDate(job.dueDate, withYear)}
        {overdue && <span className="sr-only"> (overdue)</span>}
      </span>
    </SimpleTooltip>
  );
}

/** Overlapping avatars with the names in a tooltip. */
export function AssigneeStack({ people = [], max = 3, size = 'xs', showName = false, className }) {
  if (!people.length) return null;
  const rest = people.length - max;
  return (
    <SimpleTooltip label={people.join(', ')}>
      <span className={cn('inline-flex min-w-0 items-center gap-2', className)}>
        <span className="flex flex-none -space-x-1.5">
          {people.slice(0, max).map((m) => <span key={m} className="rounded-full ring-2 ring-card"><Avatar text={initials(m)} size={size} /></span>)}
          {rest > 0 && <span className="inline-flex size-6 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground ring-2 ring-card">+{rest}</span>}
        </span>
        {showName && <span className="truncate text-sm">{people.length === 1 ? people[0] : `${people[0].split(' ')[0]} +${people.length - 1}`}</span>}
      </span>
    </SimpleTooltip>
  );
}

const chip = 'inline-flex h-5 items-center gap-1 whitespace-nowrap rounded-md border bg-card px-1.5 text-[11px] font-medium text-muted-foreground [&_svg]:size-3';

/* ------------------------------------------------------------------------------------------ */

/** One job card. Shows the fields chosen in the pipeline's "Job Card Fields". */
function JobCard({ job, pipeline, account, tags, status, onEdit, onMove, onDelete, onOpenAccount, onDragStart, onDragEnd, dragging }) {
  const f = pipeline;              // job card field switches live on the pipeline (accountId, name, priority, …)
  const days = daysInStage(job);
  const title = f.name !== false ? job.name : account?.name || job.name;
  const showTags = f.accounttags && tags.length > 0;
  const meta = (f.priority && job.priority) || (f.startdate && job.startDate) || (f.duedate && job.dueDate) || f.daysInStage || (f.clientFacingStatus && status);
  const people = f.assignees ? job.assignees || [] : [];
  return (
    <li draggable aria-label={job.name}
      onDragStart={(e) => { try { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(job.id)); } catch { /* older browsers */ } onDragStart?.(e); }}
      onDragEnd={onDragEnd}
      className={cn('group/card relative cursor-grab select-none rounded-lg border bg-card p-3 shadow-xs transition-[transform,box-shadow,border-color,opacity] duration-150',
        'hover:-translate-y-px hover:border-line-strong hover:shadow-raised active:cursor-grabbing',
        dragging && 'rotate-1 border-dashed border-primary/60 opacity-50 shadow-none')}>
      <div className="flex items-start gap-1.5">
        <div className="min-w-0 flex-1">
          {f.accountId && account && (
            <Link to={accountTabPath('workflow', account.id)} onClick={(e) => e.stopPropagation()} draggable={false}
              className="mb-1 inline-flex max-w-full items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
              <Building2 className="size-3 flex-none" aria-hidden="true" /><span className="truncate">{account.name}</span>
            </Link>
          )}
          <button type="button" onClick={onEdit} draggable={false}
            className="block w-full rounded-sm text-left text-sm font-medium leading-snug text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
            {title}
          </button>
        </div>
        <div className={cn('-mr-1.5 -mt-1.5 flex flex-none items-center transition-opacity',
          '[@media(hover:hover)]:opacity-0 focus-within:opacity-100 group-hover/card:opacity-100 has-[[data-state=open]]:opacity-100')}>
          <GripVertical className="size-3.5 text-muted-foreground/60" aria-hidden="true" />
          <RowActionsMenu label={job.name} onEdit={onEdit} className="size-7"
            extra={[{ label: 'Move to stage…', icon: Move, onClick: onMove }, ...(account ? [{ label: 'Open account', icon: ExternalLink, onClick: onOpenAccount }] : [])]}
            onDelete={onDelete} />
        </div>
      </div>

      {f.description && job.description && <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{job.description}</p>}
      {showTags && (
        <div className="mt-2 flex flex-wrap gap-1">
          {tags.slice(0, 3).map((t) => <TagChip key={t.value} tag={t} size="xs" />)}
          {tags.length > 3 && (
            <SimpleTooltip label={tags.slice(3).map((t) => t.label).join(', ')}>
              <span className="inline-flex h-5 items-center rounded-md border bg-muted px-1.5 text-[11px] font-medium text-muted-foreground">+{tags.length - 3}</span>
            </SimpleTooltip>
          )}
        </div>
      )}

      {(meta || people.length > 0) && (
        <div className="mt-3 flex items-end gap-2">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
            {f.priority && <PriorityBadge priority={job.priority} />}
            {f.duedate && <DueDate job={job} variant="chip" />}
            {f.startdate && job.startDate && (
              <SimpleTooltip label="Start date"><span className={chip}><Clock aria-hidden="true" />{fmtDate(job.startDate)}</span></SimpleTooltip>
            )}
            {f.daysInStage && (
              <SimpleTooltip label="Days in this stage">
                <span className={chip}><Clock aria-hidden="true" />{days}d<span className="sr-only"> in stage</span></span>
              </SimpleTooltip>
            )}
            {f.clientFacingStatus && status && (
              <SimpleTooltip label="Client-facing status">
                <span className={chip}><span className="size-1.5 rounded-full" style={{ backgroundColor: status.color }} aria-hidden="true" /><span className="max-w-[120px] truncate">{status.name}</span></span>
              </SimpleTooltip>
            )}
          </div>
          <AssigneeStack people={people} max={3} className="flex-none" />
        </div>
      )}
    </li>
  );
}

/**
 * Kanban columns for one pipeline (shared by Workflow → Pipelines, Workflow → Jobs and the account Workflow tab).
 * Props:
 *   pipeline · jobs (the jobs to show) · countJobs (for the column counts; default = jobs) · sortBy · filtersOn
 *   onDropJob(job, stageId) · onEdit(job) · onMoveRequest(job) · onDelete(job) · onOpenAccount(job) · onAddJob(stageId)
 *   showAddJob: show an "Add job" button on each column (calls onAddJob)
 */
export default function KanbanBoard({ pipeline, jobs, countJobs, sortBy = 'dueDate', filtersOn = false, onDropJob, onEdit, onMoveRequest, onDelete, onOpenAccount, onAddJob, showAddJob = false, className }) {
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
  const addable = showAddJob && !!onAddJob;

  const drop = (stageId) => {
    const job = shown.find((j) => j.id === dragId);
    setDragId(null); setOverStage(null);
    if (job && job.stageId !== stageId) onDropJob(job, stageId);
  };

  return (
    <div className={cn('-mx-1 snap-x overflow-x-auto px-1 pb-3', className)}>
      <ol aria-label="Stages" className="flex min-h-[420px] gap-3">
        {pipeline.stages.map((s, i) => {
          const list = sortJobs(shown.filter((j) => j.stageId === s.id), sortBy, accountName);
          const total = counted.filter((j) => j.stageId === s.id).length;
          const over = overStage === s.id && !!dragId;
          const draggingFromHere = !!dragId && shown.some((j) => j.id === dragId && j.stageId === s.id);
          const autos = s.automations?.length || 0;
          return (
            <li key={s.id} aria-label={`Stage ${i + 1}: ${s.name}`}
              onDragOver={(e) => { e.preventDefault(); setOverStage(s.id); }}
              onDragLeave={(e) => { if (e.currentTarget.contains(e.relatedTarget)) return; setOverStage((v) => (v === s.id ? null : v)); }}
              onDrop={(e) => { e.preventDefault(); drop(s.id); }}
              className={cn('relative flex max-h-[max(420px,calc(100dvh-15rem))] w-[296px] flex-none snap-start flex-col overflow-hidden rounded-xl border bg-muted/50 transition-[background-color,border-color,box-shadow] duration-150',
                over && !draggingFromHere && 'border-primary/50 bg-primary/5 ring-2 ring-primary/20')}>
              <span aria-hidden="true" className="absolute inset-x-0 top-0 h-0.5" style={{ backgroundColor: stageColor(i, 0.7) }} />
              <div className="flex items-center gap-2 px-3 pb-2 pt-3">
                <StageDot index={i} />
                <h2 className="min-w-0 flex-1 truncate text-sm font-semibold" title={s.name}>{s.name}</h2>
                {autos > 0 && (
                  <SimpleTooltip label={`${autos} automation${autos > 1 ? 's' : ''} run when a job enters this stage`}>
                    <span className="inline-flex size-6 items-center justify-center rounded-md text-warning-700" aria-label={`${autos} automations`}><Zap className="size-3.5" aria-hidden="true" /></span>
                  </SimpleTooltip>
                )}
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full border bg-card px-1.5 text-[11px] font-semibold tabular-nums text-muted-foreground" aria-label={`${total} jobs`}>{total}</span>
              </div>
              <ul aria-label={`${s.name} jobs`} className="flex min-h-[96px] flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2 pt-0.5">
                {list.map((j) => (
                  <JobCard key={j.id} job={j} pipeline={pipeline} account={accountById.get(j.accountId)} status={statusOf(j)}
                    tags={(accountById.get(j.accountId)?.tags || []).map((id) => tagById.get(id)).filter(Boolean)}
                    dragging={dragId === j.id} onDragStart={() => setDragId(j.id)} onDragEnd={() => { setDragId(null); setOverStage(null); }}
                    onOpenAccount={() => onOpenAccount?.(j)} onEdit={() => onEdit(j)} onMove={() => onMoveRequest(j)} onDelete={() => onDelete(j)} />
                ))}
                {!list.length && (
                  <li className={cn('flex flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-line-strong px-3 py-7 text-center text-xs text-muted-foreground transition-colors',
                    over && 'border-primary/60 text-primary')}>
                    <Inbox className="size-4 opacity-60" aria-hidden="true" />
                    {filtersOn && total ? 'No matching jobs' : 'Drop jobs here'}
                  </li>
                )}
              </ul>
              {addable && (
                <div className="px-2 pb-2">
                  <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground hover:bg-card" onClick={() => onAddJob(s.id)} aria-label={`Add job to ${s.name}`}>
                    <Plus />Add job
                  </Button>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
