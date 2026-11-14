import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, ArrowUpDown, Building2, Pencil, Plus, Trash2, Users, Workflow, X, Zap } from 'lucide-react';
import KanbanBoard from '../../components/workflow/KanbanBoard';
import JobDrawer from '../../components/workflow/JobDrawer';
import AutomationResultsModal from '../../components/workflow/AutomationResultsModal';
import MoveJobModal from '../../components/workflow/MoveJobModal';
import { Avatar, Modal, initials } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { SimpleTooltip } from '../../components/ui/tooltip';
import { toast } from '../../components/ui/sonner';
import { EmptyState, PageHeader, SearchInput } from '../../components/page';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { WORKFLOW_PIPELINES_PATH, accountTabPath } from '../../config';
import { SORT_JOBS_BY } from '../../data/pipelinesdata';
import { isOverdue } from '../../data/jobs';
// import { TEAM_MEMBERS } from '../../data/sampleData';

/** Deletions get a neutral toast, everything else a success toast. */
const notify = (m) => (/delet|remov/i.test(m) ? toast(m) : toast.success(m));

/** Kanban board of one pipeline: a column per stage; drag jobs between stages. /pipelines/:pipelineId */
export default function PipelineBoard() {
  const { teamOptions: TEAM_MEMBERS = [] } = useData();   // the logged-in user first, then active team members
// +  const TEAM_OPTIONS = TEAM_MEMBERS.map((m) => ({ ...m, value: m.label }));
  const { pipelineId } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const accountFilter = params.get('account');            // /pipelines/:id?account=<accountId> (from the account Workflow tab)
  const { pipelines = [], jobs = [], accounts = [], moveJob, deleteJobs } = useData();
  const { user } = useAuth() || {};
  const pipeline = pipelines.find((p) => String(p.id) === String(pipelineId));
  const [q, setQ] = useState('');
  const [assignee, setAssignee] = useState('All');
  const [sortBy, setSortBy] = useState(pipeline?.sortjobsby || 'dueDate');
  const [modal, setModal] = useState(null);       // { kind: 'job', job?, stageId? } | { kind: 'move', job } | { kind: 'delete', job } | { kind: 'results', groups }

  const accountById = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);
  /** Move a job; the stage's automations run for its account. */
  const moveTo = (job, stageId) => {
    const results = moveJob(job.id, stageId, { me: user?.name });
    const ran = results.filter((r) => r.ok).length;
    notify(`Moved “${job.name}” to ${stageName(stageId)}${ran ? ` · ${ran} automation${ran > 1 ? 's' : ''} ran` : ''}`);
    setModal(results.length ? { kind: 'results', groups: [{ accountName: accountById.get(job.accountId)?.name || '', results }] } : null);
  };

  if (!pipeline) {
    return (
      <div className="page">
        <div className="rounded-xl border bg-card shadow-card">
          <EmptyState icon={Workflow} title="Pipeline not found" description="It may have been deleted or renamed. Pick another pipeline to see its board."
            action={<Button asChild><Link to={WORKFLOW_PIPELINES_PATH}><ArrowLeft />Back to pipelines</Link></Button>} />
        </div>
      </div>
    );
  }

  const stageIds = new Set(pipeline.stages.map((s) => s.id));
  const mine = jobs.filter((j) => j.pipelineId === pipeline.id)
    .map((j) => (stageIds.has(j.stageId) ? j : { ...j, stageId: pipeline.stages[0]?.id }));   // jobs whose stage was removed show in the first stage
  const visible = mine.filter((j) => (!accountFilter || j.accountId === accountFilter) && (assignee === 'All' || (j.assignees || []).includes(assignee))
    && (!q.trim() || `${j.name} ${accountById.get(j.accountId)?.name || ''}`.toLowerCase().includes(q.trim().toLowerCase())));
  const stageName = (id) => pipeline.stages.find((s) => s.id === id)?.name;
  const filtersOn = !!(q || assignee !== 'All' || accountFilter);
  const clearFilters = () => { setQ(''); setAssignee('All'); setParams({}); };
  const overdue = mine.filter((j) => isOverdue(j)).length;
  const automations = pipeline.stages.reduce((n, s) => n + (s.automations?.length || 0), 0);
  const filteredAccount = accountFilter ? accountById.get(accountFilter) : null;

  return (
    <div className="page">
      <PageHeader
        title={
          <span className="flex min-w-0 items-center gap-3">
            <SimpleTooltip label="Back to pipelines">
              <Button asChild variant="outline" size="icon-sm" className="flex-none">
                <Link to={WORKFLOW_PIPELINES_PATH} aria-label="Back to pipelines"><ArrowLeft /></Link>
              </Button>
            </SimpleTooltip>
            <span className="truncate">{pipeline.pipelineName}</span>
          </span>
        }
        description={
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>{pipeline.stages.length} stages · {mine.length} job{mine.length === 1 ? '' : 's'}</span>
            {overdue > 0 && <Badge variant="danger"><AlertCircle aria-hidden="true" />{overdue} overdue</Badge>}
            {automations > 0 && <Badge variant="warning"><Zap aria-hidden="true" />{automations} automation{automations > 1 ? 's' : ''}</Badge>}
          </span>
        }
        actions={<>
          <Button variant="outline" asChild><Link to={`/firmtemp/pipelines/${pipeline.id}`}><Pencil />Edit pipeline</Link></Button>
          <Button onClick={() => setModal({ kind: 'job', stageId: pipeline.stages[0]?.id })}><Plus />Add job</Button>
        </>}
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput value={q} onChange={setQ} placeholder="Search job or account…" label="Search jobs" className="h-8 w-full sm:w-64" />
        <Select value={assignee} onValueChange={setAssignee}>
          <SelectTrigger className="h-8 w-auto min-w-[150px] gap-1.5" aria-label="Assignee">
            <Users className="size-3.5 text-muted-foreground" aria-hidden="true" /><SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All assignees</SelectItem>
            {TEAM_MEMBERS.map((m) => (
              <SelectItem key={m.label} value={m.label}>
                <span className="flex items-center gap-2"><Avatar text={initials(m.label)} size="xs" />{m.label}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="h-8 w-auto gap-1.5" aria-label="Sort by">
            <ArrowUpDown className="size-3.5 text-muted-foreground" aria-hidden="true" /><span className="text-muted-foreground">Sort:</span><SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_JOBS_BY.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
        {filteredAccount && (
          <span className="inline-flex h-8 items-center gap-1.5 rounded-md border border-brand-100 bg-brand-50 pl-2.5 pr-1 text-sm font-medium text-brand-700">
            <Building2 className="size-3.5" aria-hidden="true" />{filteredAccount.name}
            <button type="button" onClick={() => setParams({})} aria-label="Show all accounts"
              className="inline-flex size-6 items-center justify-center rounded transition-colors hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
              <X className="size-3.5" />
            </button>
          </span>
        )}
        {filtersOn && <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">Reset<X /></Button>}
        <span className="ml-auto hidden text-sm text-muted-foreground md:inline" aria-live="polite">
          {filtersOn ? `${visible.length} of ${mine.length} jobs` : `${mine.length} job${mine.length === 1 ? '' : 's'}`}
        </span>
      </div>

      {/* Board */}
      {pipeline.stages.length ? (
        <KanbanBoard pipeline={pipeline} jobs={visible} countJobs={mine} sortBy={sortBy} filtersOn={filtersOn}
          onDropJob={moveTo} onEdit={(j) => setModal({ kind: 'job', job: j })} onMoveRequest={(j) => setModal({ kind: 'move', job: j })}
          onDelete={(j) => setModal({ kind: 'delete', job: j })} onOpenAccount={(j) => navigate(accountTabPath('overview', j.accountId))}
          onAddJob={(stageId) => setModal({ kind: 'job', stageId })} showAddJob />
      ) : (
        <div className="rounded-xl border bg-card shadow-card">
          <EmptyState icon={Workflow} title="This pipeline has no stages" description="Add stages to the pipeline template to start moving jobs through it."
            action={<Button variant="outline" asChild><Link to={`/firmtemp/pipelines/${pipeline.id}`}><Pencil />Edit pipeline</Link></Button>} />
        </div>
      )}

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
          footer={<>
            <Button variant="outline" onClick={() => setModal(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { deleteJobs([modal.job.id]); setModal(null); notify('Job deleted'); }}><Trash2 />Delete job</Button>
          </>}>
          <p className="text-sm text-muted-foreground">The job is removed from this pipeline. This can’t be undone.</p>
        </Modal>
      )}
    </div>
  );
}
