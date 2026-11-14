import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertCircle, ArrowDown, ArrowRight, ArrowUp, ArrowUpDown, Briefcase, Building2, CalendarClock, Download, ExternalLink, Flag, Kanban,
  LayoutList, Move, Plus, SearchX, Trash2, UserRoundX, Users, Workflow, X, Zap,
} from 'lucide-react';
import Pagination, { usePagination } from '../../components/Pagination';
import RowActionsMenu from '../../components/RowActionsMenu';
import FacetFilter from '../../components/FacetFilter';
import {
  BarSelect, BulkBar, HeaderCheckbox, SelectCheckbox, SelectedOnlyFilter, barDanger, barButton, downloadCsv, useSelection,
} from '../../components/TableSelection';
import useJobActions from '../../components/workflow/useJobActions';
import KanbanBoard, { AssigneeStack, DueDate, PriorityBadge, StageDot, stageColor } from '../../components/workflow/KanbanBoard';
import { Avatar, Modal, initials } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { ToggleGroup, ToggleGroupItem } from '../../components/ui/toggle-group';
import { SimpleTooltip } from '../../components/ui/tooltip';
import { DataCard, EmptyState, PageHeader, SearchInput, StatCard } from '../../components/page';
import { cn } from 'lib/utils';
import { useData } from '../../context/DataContext';
import { WORKFLOW_PIPELINES_PATH, accountTabPath } from '../../config';
// import { TEAM_MEMBERS } from '../../data/sampleData';
import { daysInStage, isOverdue } from '../../data/jobs';

const PRIORITY_RANK = { Urgent: 0, High: 1, Medium: 2, Low: 3 };
const inDays = (d, n) => { const t = new Date(); t.setHours(0, 0, 0, 0); const due = new Date(`${d}T00:00:00`); return due >= t && (due - t) / 86400000 <= n; };

/** Sortable column header (same look as the Accounts table). */
function SortHead({ label, col, sort, setSort, className }) {
  const active = sort.key === col;
  const Icon = !active ? ArrowUpDown : sort.dir === 'asc' ? ArrowUp : ArrowDown;
  return (
    <TableHead className={className} aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button type="button" onClick={() => setSort((s) => ({ key: col, dir: s.key === col && s.dir === 'asc' ? 'desc' : 'asc' }))}
        className={cn('-ml-2 inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-md px-2 transition-colors hover:bg-accent hover:text-foreground', active && 'text-foreground')}>
        {label}<Icon className={cn('size-3.5', !active && 'opacity-50')} aria-hidden="true" />
      </button>
    </TableHead>
  );
}

/**
 * Workflow → Jobs: every job in every pipeline.
 * Filters: search · Pipeline · Stage · Account · Job assignees · Overdue only.
 * Table: sortable columns, stage changes in place (automations run), bulk Assign / Move to stage / Export / Delete.
 * Board: with one pipeline chosen, the same jobs as a Kanban board.
 * Links: ?pipeline=<id>&account=<id> pre-set filters; ?new=job opens Create Job.
 */
export default function AllJobs() {
   const { teamOptions: TEAM_MEMBERS = [] } = useData();   // the logged-in user first, then active team members
// +  const TEAM_OPTIONS = TEAM_MEMBERS.map((m) => ({ ...m, value: m.label }));
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
  const [view, setView] = useState('list');   // 'list' | 'board'

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
  const countBy = (fn) => allJobs.reduce((m, j) => { const k = fn(j); m.set(k, (m.get(k) || 0) + 1); return m; }, new Map());
  const pipelineCounts = countBy((j) => j.pipelineId);
  const stageCounts = countBy((j) => stageOf(j)?.id);
  const accountCounts = countBy((j) => j.accountId);
  const pipelineOptions = pipelines.map((p) => ({ value: p.id, label: p.pipelineName, icon: Workflow, count: pipelineCounts.get(p.id) || 0 }));
  // stages of the chosen pipelines (or of every pipeline), each labelled with its pipeline
  const stageOptions = pipelines.filter((p) => !pipelineFilter.length || pipelineFilter.includes(p.id))
    .flatMap((p) => p.stages.map((s, i) => ({
      value: s.id, label: s.name, meta: p.pipelineName, count: stageCounts.get(s.id) || 0,
      render: () => (
        <span className="flex min-w-0 items-center gap-2">
          <StageDot index={i} />
          <span className="truncate">{s.name}</span>
          <span className="truncate text-xs text-muted-foreground">{p.pipelineName}</span>
        </span>
      ),
    })));
  // a stage picked earlier disappears when its pipeline is no longer chosen
  useEffect(() => {
    const ok = new Set(stageOptions.map((o) => o.value));
    setStageFilter((list) => (list.every((id) => ok.has(id)) ? list : list.filter((id) => ok.has(id))));
  }, [pipelineFilter.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps
  const accountOptions = accounts.map((a) => ({
    value: a.id, label: a.name, count: accountCounts.get(a.id) || 0,
    render: () => <span className="flex min-w-0 items-center gap-2"><Avatar text={initials(a.name)} size="xs" /><span className="truncate">{a.name}</span></span>,
  }));
  const assigneeOptions = TEAM_MEMBERS.map((m) => ({
    value: m.label, label: m.label, count: allJobs.filter((j) => (j.assignees || []).includes(m.label)).length,
    render: () => <span className="flex min-w-0 items-center gap-2"><Avatar text={initials(m.label)} size="xs" /><span className="truncate">{m.label}</span></span>,
  }));

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
  const filtersOn = !!(q || pipelineFilter.length || stageFilter.length || accountFilter.length || assigneeFilter.length || overdueOnly);
  const clearFilters = () => { setQ(''); setPipelineFilter([]); setStageFilter([]); setAccountFilter([]); setAssigneeFilter([]); setOverdueOnly(false); setPage(1); setParams({}, { replace: true }); };
  const withPage1 = (fn) => (v) => { fn(v); setPage(1); };

  const overdueCount = allJobs.filter((j) => isOverdue(j)).length;
  const dueSoon = allJobs.filter((j) => j.dueDate && inDays(j.dueDate, 7)).length;
  const unassigned = allJobs.filter((j) => !(j.assignees || []).length).length;

  // board view needs exactly one pipeline
  const boardPipeline = pipelineFilter.length === 1 ? pipelineById.get(pipelineFilter[0]) : null;

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

  const COLS = 10;
  const emptyState = allJobs.length === 0 ? (
    <EmptyState icon={Briefcase} title="No jobs yet" description="Add a job to an account to start tracking it through a pipeline."
      action={<Button onClick={() => jobUi.addJob({})}><Plus />Add job</Button>} />
  ) : (
    <EmptyState icon={SearchX} title="No jobs match these filters" description="Try a different search or remove some filters."
      action={<Button variant="outline" onClick={clearFilters}>Clear filters</Button>} />
  );

  return (
    <div className="page">
      <PageHeader
        title="Jobs"
        description="Every job in every pipeline — where it is, who has it and when it’s due."
        actions={<>
          <Button variant="outline" onClick={() => exportCsv(filtered)}><Download />Export</Button>
          <Button variant="outline" onClick={() => navigate(WORKFLOW_PIPELINES_PATH)}><Kanban />Pipeline boards</Button>
          <Button onClick={() => jobUi.addJob({ pipelineId: pipelineFilter.length === 1 ? pipelineFilter[0] : undefined, accountIds: accountFilter })}><Plus />Add job</Button>
        </>}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard label="All jobs" value={allJobs.length} icon={Briefcase} hint={`in ${pipelines.length} pipeline${pipelines.length === 1 ? '' : 's'}`} />
        <StatCard label="Overdue" value={overdueCount} icon={AlertCircle} tone={overdueCount ? 'danger' : 'default'}
          hint={overdueOnly ? 'Showing only these · click to clear' : 'Click to show only these'}
          onClick={() => { setOverdueOnly((v) => !v); setPage(1); }} active={overdueOnly} />
        <StatCard label="Due in 7 days" value={dueSoon} icon={CalendarClock} tone={dueSoon ? 'warning' : 'default'} hint="including today" />
        <StatCard label="Unassigned" value={unassigned} icon={UserRoundX} tone={unassigned ? 'warning' : 'default'} hint="no one is working on these" />
      </div>

      <DataCard
        toolbar={<>
          <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search job, account or assignee…" label="Search jobs" className="h-8 w-full sm:w-72" />
          <FacetFilter title="Pipeline" icon={Workflow} options={pipelineOptions} value={pipelineFilter} onChange={withPage1(setPipelineFilter)} />
          <FacetFilter title="Stage" options={stageOptions} value={stageFilter} onChange={withPage1(setStageFilter)} />
          <FacetFilter title="Account" icon={Building2} options={accountOptions} value={accountFilter} onChange={withPage1(setAccountFilter)} />
          <FacetFilter title="Assignee" icon={Users} options={assigneeOptions} value={assigneeFilter} onChange={withPage1(setAssigneeFilter)} />
          <Button variant="outline" size="sm" aria-pressed={overdueOnly} onClick={() => { setOverdueOnly((v) => !v); setPage(1); }}
            className={cn('border-dashed', overdueOnly && 'border-solid border-danger-200 bg-danger-50 text-danger-700 hover:bg-danger-50 hover:text-danger-700')}>
            <Flag className={overdueOnly ? '' : 'text-muted-foreground'} />Overdue only
          </Button>
          {filtersOn && <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">Reset<X /></Button>}
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-sm text-muted-foreground md:inline" aria-live="polite" data-testid="jobs-count">{filtered.length} of {allJobs.length} jobs</span>
            <ToggleGroup type="single" value={view} onValueChange={(v) => v && setView(v)} aria-label="View" className="h-8">
              <SimpleTooltip label="List"><ToggleGroupItem value="list" aria-label="List view" className="px-2"><LayoutList /></ToggleGroupItem></SimpleTooltip>
              <SimpleTooltip label="Board"><ToggleGroupItem value="board" aria-label="Board view" className="px-2"><Kanban /></ToggleGroupItem></SimpleTooltip>
            </ToggleGroup>
          </div>
        </>}
        footer={view === 'list' && filtered.length > 0 && <Pagination {...paging} label="jobs" />}
      >
        {view === 'board' ? (
          <div className="bg-subtle/40 p-4">
            {boardPipeline ? (
              boardPipeline.stages.length ? (
                <KanbanBoard pipeline={boardPipeline} jobs={filtered} countJobs={allJobs.filter((j) => j.pipelineId === boardPipeline.id)}
                  sortBy={boardPipeline.sortjobsby || 'dueDate'} filtersOn={filtersOn}
                  onDropJob={jobUi.moveTo} onEdit={jobUi.editJob} onMoveRequest={jobUi.askMove} onDelete={jobUi.askDelete}
                  onOpenAccount={(j) => navigate(accountTabPath('workflow', j.accountId))}
                  onAddJob={(stageId) => jobUi.addJob({ pipelineId: boardPipeline.id, stageId, accountIds: accountFilter })} showAddJob />
              ) : (
                <EmptyState icon={Workflow} title="This pipeline has no stages" description="Add stages to its pipeline template to use the board." compact />
              )
            ) : (
              <EmptyState icon={Kanban} title="Pick a pipeline to see its board" compact
                description={pipelineFilter.length > 1 ? 'The board shows one pipeline at a time. Choose which one.' : 'Each pipeline has its own stages, so the board shows one pipeline at a time.'}
                action={pipelines.length ? pipelines.slice(0, 6).map((p) => (
                  <Button key={p.id} variant="outline" size="sm" onClick={() => { setPipelineFilter([p.id]); setPage(1); }}>
                    <Workflow />{p.pipelineName}<span className="tabular-nums text-muted-foreground">{pipelineCounts.get(p.id) || 0}</span>
                  </Button>
                )) : null} />
            )}
          </div>
        ) : (
          <>
          <BulkBar count={selection.count} total={filtered.length}
        onSelectAll={() => selection.setMany(filtered.map((j) => j.id), true)} onClear={selection.clear}
        filters={<SelectedOnlyFilter checked={selectedOnly} onChange={(v) => { setSelectedOnly(v); setPage(1); }} />}
        actions={<>
          <BarSelect label="Assign" value="" onChange={bulkAssign} options={[{ value: '', label: 'Choose…' }, ...TEAM_MEMBERS.map((m) => m.label)]} />
          {samePipeline
            ? <BarSelect label="Move to stage" value="" onChange={bulkMove} options={[{ value: '', label: 'Choose…' }, ...samePipeline.stages.map((s, i) => ({ value: s.id, label: `${i + 1}. ${s.name}${s.automations?.length ? ' ⚡' : ''}` }))]} />
            : (
              <SimpleTooltip label="Select jobs from one pipeline to move them">
                <span className="inline-flex h-8 items-center gap-1.5 px-1 text-xs text-muted-foreground"><Move className="size-3.5" aria-hidden="true" />Move: pick one pipeline</span>
              </SimpleTooltip>
            )}
          <button type="button" className={barButton} onClick={() => exportCsv(selected)}><Download aria-hidden="true" />Export</button>
          <button type="button" className={barDanger} onClick={() => setConfirmDelete(selected)}><Trash2 aria-hidden="true" />Delete</button>
        </>}
      />
          <Table aria-label="Jobs" className="min-w-[1100px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"><HeaderCheckbox selection={selection} pageIds={rows.map((j) => j.id)} /></TableHead>
                <SortHead label="Job" col="name" sort={sort} setSort={setSort} />
                <SortHead label="Account" col="account" sort={sort} setSort={setSort} />
                <SortHead label="Pipeline" col="pipeline" sort={sort} setSort={setSort} />
                <SortHead label="Stage" col="stage" sort={sort} setSort={setSort} />
                <SortHead label="Priority" col="priority" sort={sort} setSort={setSort} />
                <SortHead label="Assignees" col="assignees" sort={sort} setSort={setSort} />
                <SortHead label="Due" col="dueDate" sort={sort} setSort={setSort} />
                <SortHead label="In stage" col="days" sort={sort} setSort={setSort} />
                <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((j) => {
                const p = pipelineById.get(j.pipelineId);
                const st = stageOf(j);
                const stIndex = p.stages.findIndex((s) => s.id === st?.id);
                const acct = accountById.get(j.accountId);
                const checked = selection.has(j.id);
                const days = daysInStage(j);
                return (
                  <TableRow key={j.id} data-state={checked ? 'selected' : undefined} aria-selected={checked}>
                    <TableCell><SelectCheckbox label={`Select ${j.name}`} checked={checked} onChange={() => selection.toggle(j.id)} /></TableCell>
                    <TableCell className="max-w-[260px]">
                      <button type="button" onClick={() => jobUi.editJob(j)}
                        className="block max-w-full truncate rounded-sm text-left font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
                        {j.name}
                      </button>
                    </TableCell>
                    <TableCell className="max-w-[220px]">
                      {acct ? (
                        <button type="button" onClick={() => navigate(accountTabPath('workflow', acct.id))}
                          className="flex max-w-full items-center gap-2 rounded-sm text-left text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
                          <Avatar text={initials(acct.name)} size="xs" /><span className="truncate">{acct.name}</span>
                        </button>
                      ) : <span className="text-muted-foreground/60">—</span>}
                    </TableCell>
                    <TableCell>
                      <button type="button" onClick={() => navigate(`${WORKFLOW_PIPELINES_PATH}/${p.id}`)}
                        className="whitespace-nowrap rounded-sm text-left text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
                        {p.pipelineName}
                      </button>
                    </TableCell>
                    <TableCell>
                      <Select value={st?.id ? String(st.id) : ''} onValueChange={(v) => { const s = p.stages.find((x) => String(x.id) === v); if (s) jobUi.moveTo(j, s.id); }}>
                        <SelectTrigger aria-label={`Stage of ${j.name}`}
                          className="h-7 w-auto max-w-[210px] gap-1.5 rounded-full border-transparent px-2.5 text-xs font-medium shadow-none hover:border-input"
                          style={{ backgroundColor: stageColor(Math.max(stIndex, 0), 0.12) }}>
                          <StageDot index={Math.max(stIndex, 0)} className="size-1.5" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {p.stages.map((s, i) => (
                            <SelectItem key={s.id} value={String(s.id)}>
                              <span className="flex items-center gap-2">
                                {i + 1}. {s.name}
                                {s.automations?.length > 0 && <Zap className="size-3 text-warning-700" aria-label="Has automations" />}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell><PriorityBadge priority={j.priority} /></TableCell>
                    <TableCell>
                      {(j.assignees || []).length
                        ? <AssigneeStack people={j.assignees} showName className="max-w-[180px]" />
                        : <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground/80"><UserRoundX className="size-3.5" aria-hidden="true" />Unassigned</span>}
                    </TableCell>
                    <TableCell><DueDate job={j} withYear /></TableCell>
                    <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">{days} day{days === 1 ? '' : 's'}</TableCell>
                    <TableCell className="text-right">
                      <RowActionsMenu label={j.name} onEdit={() => jobUi.editJob(j)}
                        extra={[
                          { label: 'Move to stage…', icon: Move, onClick: () => jobUi.askMove(j) },
                          { label: 'Open board', icon: ArrowRight, onClick: () => navigate(`${WORKFLOW_PIPELINES_PATH}/${p.id}`) },
                          ...(acct ? [{ label: 'Open account', icon: ExternalLink, onClick: () => navigate(accountTabPath('workflow', acct.id)) }] : []),
                        ]}
                        onDelete={() => jobUi.askDelete(j)} />
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={COLS}>{emptyState}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </>
        )}
      </DataCard>

      

      {confirmDelete && (
        <Modal title={`Delete ${confirmDelete.length} job${confirmDelete.length > 1 ? 's' : ''}?`} description="These jobs are removed from their pipelines." onClose={() => setConfirmDelete(null)}
          footer={<>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { deleteJobs(confirmDelete.map((j) => j.id)); selection.clear(); setConfirmDelete(null); jobUi.notify(`Deleted ${confirmDelete.length} job${confirmDelete.length > 1 ? 's' : ''}`); }}>
              <Trash2 />Delete jobs
            </Button>
          </>}>
          <ul className="max-h-48 divide-y overflow-y-auto rounded-lg border">
            {confirmDelete.map((j) => (
              <li key={j.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                <Briefcase className="size-3.5 flex-none text-muted-foreground" aria-hidden="true" />
                <span className="truncate font-medium">{j.name}</span>
                <span className="ml-auto truncate text-xs text-muted-foreground">{accountById.get(j.accountId)?.name}</span>
              </li>
            ))}
          </ul>
        </Modal>
      )}
      {jobUi.ui}
    </div>
  );
}
