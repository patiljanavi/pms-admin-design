import { useMemo, useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { AlertCircle, ArrowUpRight, Briefcase, Plus, SearchX, Settings2, Users, Workflow, Zap } from 'lucide-react';
import { Avatar, initials } from '../../components/ui';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { SimpleTooltip } from '../../components/ui/tooltip';
import { EmptyState, PageHeader, SearchInput, StatCard } from '../../components/page';
import { StageDot, stageColor } from '../../components/workflow/KanbanBoard';
import { useData } from '../../context/DataContext';
import { WORKFLOW_PIPELINES_PATH } from '../../config';
import { isOverdue } from '../../data/jobs';

/** Route wrapper: /pipelines shows the list; /pipelines/:pipelineId shows the board. */
export function WorkflowPipelinesLayout() { return <Outlet />; }

const MAX_LEGEND = 5;

/** One pipeline as a card: stage distribution bar, per-stage counts, team and automation badges. */
function PipelineCard({ pipeline: p, jobs }) {
  const automations = p.stages.reduce((n, s) => n + (s.automations?.length || 0), 0);
  const overdue = jobs.filter((j) => isOverdue(j)).length;
  const perStage = p.stages.map((s) => jobs.filter((j) => j.stageId === s.id).length);
  const placed = perStage.reduce((a, b) => a + b, 0);
  const team = p.availableto || [];
  const legend = p.stages.slice(0, MAX_LEGEND);
  const more = p.stages.length - legend.length;

  return (
    <Link to={`${WORKFLOW_PIPELINES_PATH}/${p.id}`} aria-label={`Open ${p.pipelineName} board`}
      className="group flex h-full flex-col gap-4 rounded-xl border bg-card p-5 shadow-card transition-[transform,box-shadow,border-color] duration-150 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
      <div className="flex items-start gap-3">
        <span className="inline-flex size-9 flex-none items-center justify-center rounded-lg border border-brand-100 bg-brand-50 text-brand-700" aria-hidden="true">
          <Workflow className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-semibold">{p.pipelineName}</h2>
          <p className="text-sm text-muted-foreground">
            {p.stages.length} stage{p.stages.length === 1 ? '' : 's'} · {jobs.length} job{jobs.length === 1 ? '' : 's'}
          </p>
        </div>
        <ArrowUpRight className="size-4 flex-none text-muted-foreground transition-[color,transform] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" aria-hidden="true" />
      </div>

      {/* where the jobs are, stage by stage */}
      <div className="flex flex-col gap-3">
        <div className="flex h-2 gap-0.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
          {placed > 0
            ? p.stages.map((s, i) => (perStage[i] ? <span key={s.id} className="h-full first:rounded-l-full last:rounded-r-full" style={{ width: `${(perStage[i] / placed) * 100}%`, backgroundColor: stageColor(i) }} /> : null))
            : p.stages.map((s, i) => <span key={s.id} className="h-full flex-1" style={{ backgroundColor: stageColor(i, 0.18) }} />)}
        </div>
        <ol aria-label={`${p.pipelineName} stages`} className="grid grid-cols-1 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-2">
          {legend.map((s, i) => (
            <li key={s.id} className="flex min-w-0 items-center gap-2">
              <StageDot index={i} />
              <span className="min-w-0 flex-1 truncate text-muted-foreground" title={s.name}>{s.name}</span>
              {s.automations?.length > 0 && <Zap className="size-3 flex-none text-warning-700" aria-label="Has automations" />}
              <span className={perStage[i] ? 'font-medium tabular-nums' : 'tabular-nums text-muted-foreground/60'}>{perStage[i]}</span>
            </li>
          ))}
          {more > 0 && <li className="text-sm text-muted-foreground">+{more} more stage{more > 1 ? 's' : ''}</li>}
        </ol>
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 border-t pt-4">
        {team.length ? (
          <SimpleTooltip label={team.join(', ')}>
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="flex -space-x-1.5">
                {team.slice(0, 4).map((n) => <span key={n} className="rounded-full ring-2 ring-card"><Avatar text={initials(n)} size="xs" /></span>)}
                {team.length > 4 && <span className="inline-flex size-6 items-center justify-center rounded-full bg-muted text-[10px] font-semibold ring-2 ring-card">+{team.length - 4}</span>}
              </span>
              <span className="sr-only">Available to {team.join(', ')}</span>
            </span>
          </SimpleTooltip>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"><Users className="size-3.5" aria-hidden="true" />Everyone</span>
        )}
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          {overdue > 0 && <Badge variant="danger"><AlertCircle aria-hidden="true" />{overdue} overdue</Badge>}
          {automations > 0 && <Badge variant="warning"><Zap aria-hidden="true" />{automations} automation{automations > 1 ? 's' : ''}</Badge>}
        </div>
      </div>
    </Link>
  );
}

/** Workflow → Pipelines: every pipeline (from Pipeline Templates) with its stages and job counts. */
export default function WorkflowPipelines() {
  const { pipelines = [], jobs = [] } = useData();
  const [q, setQ] = useState('');
  const shown = useMemo(() => pipelines.filter((p) => !q.trim() || `${p.pipelineName} ${p.stages.map((s) => s.name).join(' ')}`.toLowerCase().includes(q.trim().toLowerCase())), [pipelines, q]);
  const jobsIn = (p) => jobs.filter((j) => j.pipelineId === p.id);

  const ids = new Set(pipelines.map((p) => p.id));
  const live = jobs.filter((j) => ids.has(j.pipelineId));
  const overdue = live.filter((j) => isOverdue(j)).length;
  const automated = pipelines.filter((p) => p.stages.some((s) => s.automations?.length)).length;

  return (
    <div className="page">
      <PageHeader
        title="Pipelines"
        description="Open a pipeline to see its jobs on a Kanban board."
        actions={<>
          <Button variant="outline" asChild><Link to="/firmtemp/pipelines"><Settings2 />Manage pipeline templates</Link></Button>
          <Button asChild><Link to="/firmtemp/pipelines/new"><Plus />New pipeline</Link></Button>
        </>}
      />

      {pipelines.length > 0 && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          <StatCard label="Pipelines" value={pipelines.length} icon={Workflow} hint={`${pipelines.reduce((n, p) => n + p.stages.length, 0)} stages in total`} />
          <StatCard label="Jobs" value={live.length} icon={Briefcase} hint="across every pipeline" />
          <StatCard label="Overdue" value={overdue} icon={AlertCircle} tone={overdue ? 'danger' : 'default'} hint={overdue ? 'need attention' : 'all on track'} />
          <StatCard label="Automated" value={automated} icon={Zap} tone={automated ? 'warning' : 'default'} hint={`of ${pipelines.length} pipeline${pipelines.length === 1 ? '' : 's'}`} />
        </div>
      )}

      {pipelines.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput value={q} onChange={setQ} placeholder="Search pipeline or stage…" label="Search pipelines" className="h-8 w-full sm:w-72" />
          <span className="ml-auto hidden text-sm text-muted-foreground md:inline">{shown.length} of {pipelines.length} pipelines</span>
        </div>
      )}

      {shown.length > 0 && (
        <ul aria-label="Pipelines" className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {shown.map((p) => <li key={p.id}><PipelineCard pipeline={p} jobs={jobsIn(p)} /></li>)}
        </ul>
      )}

      {!shown.length && (
        <div className="rounded-xl border bg-card shadow-card">
          {pipelines.length ? (
            <EmptyState icon={SearchX} title="No pipelines match your search" description="Try a different pipeline or stage name."
              action={<Button variant="outline" onClick={() => setQ('')}>Clear search</Button>} />
          ) : (
            <EmptyState icon={Workflow} title="No pipelines yet" description="Pipelines are built from pipeline templates. Create one to start tracking jobs stage by stage."
              action={<Button asChild><Link to="/firmtemp/pipelines/new"><Plus />Create a pipeline template</Link></Button>} />
          )}
        </div>
      )}
    </div>
  );
}
