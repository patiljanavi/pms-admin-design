import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertCircle, ArrowDown, ArrowUp, ArrowUpDown, CheckCircle2, CheckSquare, ChevronDown, Clock, ExternalLink, Filter, ListChecks, Plus, RotateCcw, Search, SearchX, Trash2, X,
} from 'lucide-react';

// shadcn components — one file each in src/components/ui
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Checkbox } from '../components/ui/checkbox';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { ToastBridge } from '../components/ui/sonner';

// your app components
import { Avatar, Modal, Segmented, initials } from '../components/ui';
import { EmptyState, StatCard } from '../components/page';
import RowActionsMenu from '../components/RowActionsMenu';
import { BulkBar, HeaderCheckbox, SelectCheckbox, useSelection } from '../components/TableSelection';
import Pagination, { usePagination } from '../components/Pagination';
import TaskDrawer, { TaskStatusBadge } from '../components/workflow/TaskDrawer';
import { useData } from '../context/DataContext';
import { accountTabPath } from '../config';
import { TEAM_MEMBERS } from '../data/sampleData';
import { TASK_PRIORITIES } from '../data/taskTemplates';
import { isCompleted, isTaskOverdue, taskId, tasksOf } from '../data/accountTasks';
import { fillShortcodes } from '../data/accountChats';
import { cn } from 'lib/utils';

const ALL = 'all';
const RANK = { Urgent: 0, High: 1, Medium: 2, Low: 3 };
const PRIORITY_DOT = { Low: 'bg-muted-foreground/50', Medium: 'bg-blue-500', High: 'bg-amber-500', Urgent: 'bg-red-500' };
const fmtDate = (d) => (d ? new Date(`${String(d).slice(0, 10)}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—');
const Dash = () => <span className="text-muted-foreground/60">—</span>;

/* ---------- small table helpers ---------- */
function SortHead({ label, col, sort, setSort, className }) {
  const on = sort.col === col;
  const Icon = !on ? ArrowUpDown : sort.dir === 'asc' ? ArrowUp : ArrowDown;
  return (
    <TableHead className={className} aria-sort={on ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <Button variant="ghost" size="sm" className="-ml-3 h-8 gap-1.5" onClick={() => setSort((s) => ({ col, dir: s.col === col && s.dir === 'asc' ? 'desc' : 'asc' }))}>
        {label}<Icon className={cn('size-3.5', !on && 'opacity-40')} aria-hidden="true" />
      </Button>
    </TableHead>
  );
}
function NameCell({ icon: Icon, name, preview, onOpen, done }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 inline-flex size-8 flex-none items-center justify-center rounded-lg border bg-subtle text-muted-foreground" aria-hidden="true"><Icon className="size-4" /></span>
      <div className="min-w-0">
        <button type="button" onClick={onOpen} className={cn('max-w-full truncate text-left font-medium text-foreground underline-offset-4 hover:underline', done && 'text-muted-foreground line-through')}>{name}</button>
        {preview && <p className="truncate text-xs text-muted-foreground">{preview}</p>}
      </div>
    </div>
  );
}
function CheckFilter({ label, options, value, onChange, searchable = false }) {
  const [q, setQ] = useState('');
  const shown = searchable && q.trim() ? options.filter((o) => o.label.toLowerCase().includes(q.trim().toLowerCase())) : options;
  const toggle = (v) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  return (
    <DropdownMenu onOpenChange={(o) => !o && setQ('')}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed" aria-label={`Filter by ${label.toLowerCase()}`}>
          <Filter aria-hidden="true" />{label}
          {value.length > 0 && <Badge variant="secondary" className="ml-1 rounded-sm px-1.5 font-normal">{value.length}</Badge>}
          <ChevronDown className="opacity-50" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        {searchable && (
          <div className="px-2 pb-2">
            <Input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.stopPropagation()} placeholder={`Search ${label.toLowerCase()}`} aria-label={`Search ${label.toLowerCase()}`} className="h-8" />
          </div>
        )}
        <DropdownMenuSeparator />
        <div className="max-h-64 overflow-y-auto">
          {shown.map((o) => (
            <DropdownMenuCheckboxItem key={o.value} checked={value.includes(o.value)} onCheckedChange={() => toggle(o.value)} onSelect={(e) => e.preventDefault()}>{o.label}</DropdownMenuCheckboxItem>
          ))}
          {!shown.length && <p className="px-2 py-3 text-center text-sm text-muted-foreground">No matches</p>}
        </div>
        {value.length > 0 && (<><DropdownMenuSeparator /><DropdownMenuItem onSelect={() => onChange([])} className="justify-center">Clear</DropdownMenuItem></>)}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Workflow → Tasks: every account's tasks (saved on each account: account.tasks, else the demo tasks).
 * Pending / Completed (?view=completed) · search · Account · Assignee · Priority · Overdue only ·
 * sort · select rows · bulk Mark as completed / Reopen / Delete · Create / Edit (TaskDrawer) · pagination.
 * ?new=task opens "Create Task"; ?account=<id> pre-sets the account filter.
 */
export default function Tasks() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { accounts = [], setAccounts, taskTemplates = [], jobs = [], pipelines = [] } = useData();
  const view = params.get('view') === 'completed' ? 'completed' : 'pending';

  const [q, setQ] = useState('');
  const [accountIds, setAccountIds] = useState(() => (params.get('account') ? [params.get('account')] : []));
  const [assignees, setAssignees] = useState([]);
  const [priority, setPriority] = useState(ALL);
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [sort, setSort] = useState({ col: 'due', dir: 'asc' });
  const [drawer, setDrawer] = useState(null);              // { task? }
  const [confirm, setConfirm] = useState(null);            // tasks to delete
  const [note, setNote] = useState('');
  const notify = (m) => { setNote(m); setTimeout(() => setNote(''), 2400); };
  const selection = useSelection();

  useEffect(() => {
    if (params.get('new') === 'task') { setDrawer({}); const n = new URLSearchParams(params); n.delete('new'); setParams(n, { replace: true }); }
  }, [params]); // eslint-disable-line react-hooks/exhaustive-deps
  const setView = (v) => { setParams((prev) => { const n = new URLSearchParams(prev); if (v === 'completed') n.set('view', 'completed'); else n.delete('view'); return n; }, { replace: true }); selection.clear(); };

  /* ---------- every account's tasks ---------- */
  const all = useMemo(() => accounts.flatMap((a) => tasksOf(a, taskTemplates).map((t) => {
    const job = jobs.find((j) => j.id === t.jobId) || null;
    return { ...t, accountId: a.id, accountName: a.name, job, pipelineName: job ? pipelines.find((p) => p.id === job.pipelineId)?.pipelineName || '' : '' };
  })), [accounts, taskTemplates, jobs, pipelines]);

  /** Change the tasks of the given accounts: fn(list, account) → new list. */
  const update = (accountIdsToChange, fn) => setAccounts((list) => list.map((a) => (accountIdsToChange.includes(a.id) ? { ...a, tasks: fn(tasksOf(a, taskTemplates), a) } : a)));
  const saveTask = (form) => {
    const { accountName, job, pipelineName, ...data } = form;
    const account = accounts.find((a) => a.id === form.accountId);
    const existing = form.id ? all.find((t) => t.id === form.id) : null;
    const now = new Date().toISOString();
    const rec = {
      ...data,
      id: form.id || taskId(),
      name: account ? fillShortcodes(form.name.trim(), account) : form.name.trim(),
      description: account ? fillShortcodes(form.description || '', account) : form.description,
      subtasks: form.subtasksOn ? form.subtasks.filter((s) => s.text.trim()) : [],
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      completedAt: isCompleted(form) ? (existing?.completedAt || now) : undefined,
    };
    const from = existing?.accountId;
    update([...new Set([form.accountId, from].filter(Boolean))], (list, a) => {
      const others = list.filter((t) => t.id !== rec.id);
      return a.id === form.accountId ? (from === a.id ? list.map((t) => (t.id === rec.id ? rec : t)) : [rec, ...others]) : others;
    });
    return rec;
  };
  const changeStatus = (items, status) => {
    if (!items.length) return;
    const ids = new Set(items.map((t) => t.id));
    const now = new Date().toISOString();
    update([...new Set(items.map((t) => t.accountId))], (list) => list.map((t) => (ids.has(t.id) ? { ...t, status, updatedAt: now, completedAt: status === 'Completed' ? now : undefined } : t)));
    selection.setMany([...ids], false);
    const what = items.length === 1 ? `“${items[0].name}”` : `${items.length} tasks`;
    notify(status === 'Completed' ? `Completed ${what}` : `Reopened ${what}`);
  };
  const remove = (items) => {
    const ids = new Set(items.map((t) => t.id));
    update([...new Set(items.map((t) => t.accountId))], (list) => list.filter((t) => !ids.has(t.id)));
    selection.setMany([...ids], false);
    notify(items.length > 1 ? `Deleted ${items.length} tasks` : 'Task deleted');
  };

  /* ---------- filter · sort · pagination ---------- */
  const pending = all.filter((t) => !isCompleted(t));
  const completed = all.filter(isCompleted);
  const inView = view === 'completed' ? completed : pending;
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const val = {
      name: (t) => t.name.toLowerCase(), account: (t) => t.accountName.toLowerCase(), job: (t) => (t.job?.name || '~').toLowerCase(),
      status: (t) => t.status, priority: (t) => RANK[t.priority] ?? 9, due: (t) => t.dueDate || '9999-12-31', completed: (t) => t.completedAt || '',
    }[sort.col] || ((t) => t.dueDate || '');
    return inView
      .filter((t) => (!s || `${t.name} ${t.accountName} ${t.job?.name || ''} ${(t.assignees || []).join(' ')}`.toLowerCase().includes(s))
        && (!accountIds.length || accountIds.includes(t.accountId))
        && (!assignees.length || assignees.some((m) => (t.assignees || []).includes(m)))
        && (priority === ALL || t.priority === priority)
        && (!overdueOnly || view !== 'pending' || isTaskOverdue(t)))
      .sort((a, b) => { const x = val(a); const y = val(b); return (x < y ? -1 : x > y ? 1 : 0) * (sort.dir === 'asc' ? 1 : -1); });
  }, [inView, q, accountIds, assignees, priority, overdueOnly, view, sort]);
  const paging = usePagination(filtered, { initialSize: 25, storageKey: 'tasks' });
  const { pageItems: rows, setPage } = paging;
  useEffect(() => { setPage(1); }, [view]); // eslint-disable-line react-hooks/exhaustive-deps
  const selected = filtered.filter((t) => selection.has(t.id));
  const filtersOn = q || accountIds.length || assignees.length || priority !== ALL || overdueOnly;
  const reset = () => { setQ(''); setAccountIds([]); setAssignees([]); setPriority(ALL); setOverdueOnly(false); setPage(1); };
  const p1 = (fn) => (v) => { fn(v); setPage(1); };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Workflow / Tasks</p>
          <h1 className="text-3xl font-semibold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">Tasks for every account.</p>
        </div>
        <Button onClick={() => setDrawer({})}><Plus />New task</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard label="Pending" value={pending.length} icon={Clock} />
        <StatCard label="Overdue" value={pending.filter((t) => isTaskOverdue(t)).length} icon={AlertCircle} />
        <StatCard label="Due this week" value={pending.filter((t) => t.dueDate && !isTaskOverdue(t) && (new Date(`${t.dueDate}T00:00:00`) - Date.now()) / 86400000 <= 7).length} icon={ListChecks} />
        <StatCard label="Completed" value={completed.length} icon={CheckCircle2} />
      </div>

      <section className="overflow-hidden rounded-xl border bg-card shadow-card" aria-label={view === 'completed' ? 'Completed tasks' : 'Pending tasks'}>
        {/* Pending / Completed + filters */}
        <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
          <Segmented label="Task lists" size="sm" value={view} onChange={setView}
            options={[['pending', 'Pending', pending.length], ['completed', 'Completed', completed.length]].map(([k, l, n]) => ({
              value: k, label: <>{l}<span className="text-xs tabular-nums text-muted-foreground">{n}</span></>,
            }))} />
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2 size-4 text-muted-foreground" aria-hidden="true" />
            <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search task, account, job…" aria-label="Search tasks" className="h-8 pl-8" />
          </div>
          <CheckFilter label="Account" searchable options={accounts.map((a) => ({ value: a.id, label: a.name }))} value={accountIds} onChange={p1(setAccountIds)} />
          <CheckFilter label="Assignee" options={TEAM_MEMBERS.map((m) => ({ value: m.label, label: m.label }))} value={assignees} onChange={p1(setAssignees)} />
          <Select value={priority} onValueChange={p1(setPriority)}>
            <SelectTrigger className="h-8 w-[150px]" aria-label="Priority"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All priorities</SelectItem>
              {TASK_PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
          {view === 'pending' && (
            <div className="flex h-8 items-center gap-2 rounded-md border px-2.5">
              <Checkbox id="overdue-only" checked={overdueOnly} onCheckedChange={(v) => { setOverdueOnly(!!v); setPage(1); }} />
              <Label htmlFor="overdue-only" className="text-sm font-normal">Overdue only</Label>
            </div>
          )}
          {filtersOn ? <Button variant="ghost" size="sm" onClick={reset} className="text-muted-foreground">Reset<X /></Button> : null}
          <span className="ml-auto text-sm tabular-nums text-muted-foreground" data-testid="task-count">{filtered.length} of {inView.length} {view} tasks</span>
        </div>

        <BulkBar count={selection.count} total={filtered.length}
          onSelectAll={() => selection.setMany(filtered.map((t) => t.id), true)} onClear={selection.clear}
          actions={<>
            {view === 'pending'
              ? <Button variant="outline" size="sm" onClick={() => changeStatus(selected, 'Completed')}><CheckCircle2 />Mark as completed</Button>
              : <Button variant="outline" size="sm" onClick={() => changeStatus(selected, 'No status')}><RotateCcw />Reopen</Button>}
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setConfirm(selected)}><Trash2 />Delete</Button>
          </>} />

        <div className="overflow-x-auto">
          <Table className="min-w-[1180px]" aria-label="Tasks">
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"><HeaderCheckbox selection={selection} pageIds={rows.map((t) => t.id)} /></TableHead>
                <SortHead label="Task" col="name" sort={sort} setSort={setSort} />
                <SortHead label="Account" col="account" sort={sort} setSort={setSort} />
                <SortHead label="Job" col="job" sort={sort} setSort={setSort} />
                <SortHead label="Status" col="status" sort={sort} setSort={setSort} />
                <SortHead label="Priority" col="priority" sort={sort} setSort={setSort} />
                <TableHead>Assignees</TableHead>
                {view === 'completed' ? <SortHead label="Completed" col="completed" sort={sort} setSort={setSort} /> : <SortHead label="Due" col="due" sort={sort} setSort={setSort} />}
                <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((t) => {
                const checked = selection.has(t.id);
                const overdue = isTaskOverdue(t);
                const subs = t.subtasks || [];
                const doneSubs = subs.filter((s) => s.checked).length;
                return (
                  <TableRow key={t.id} data-state={checked ? 'selected' : undefined}>
                    <TableCell><SelectCheckbox label={`Select ${t.name}`} checked={checked} onChange={() => selection.toggle(t.id)} /></TableCell>
                    <TableCell className="max-w-[300px]">
                      <NameCell icon={CheckSquare} name={t.name} done={isCompleted(t)} onOpen={() => setDrawer({ task: t })}
                        preview={subs.length ? <span className="inline-flex items-center gap-1"><ListChecks className="size-3" aria-hidden="true" />{doneSubs}/{subs.length} subtasks</span> : null} />
                    </TableCell>
                    <TableCell><button type="button" className="text-left font-medium hover:text-primary hover:underline" onClick={() => navigate(accountTabPath('workflow', t.accountId))}>{t.accountName}</button></TableCell>
                    <TableCell className="max-w-[200px]">{t.job ? <><div className="truncate text-sm">{t.job.name}</div><div className="truncate text-xs text-muted-foreground">{t.pipelineName}</div></> : <Dash />}</TableCell>
                    <TableCell><TaskStatusBadge status={t.status} /></TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1.5 font-medium">
                        <span className={cn('size-1.5 rounded-full', PRIORITY_DOT[t.priority] || 'bg-muted-foreground/50')} aria-hidden="true" />{t.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {(t.assignees || []).length ? (
                        <span className="flex items-center gap-2" title={t.assignees.join(', ')}>
                          <span className="inline-flex -space-x-1.5">{t.assignees.slice(0, 3).map((m) => <span key={m} className="rounded-full ring-2 ring-card"><Avatar text={initials(m)} size="xs" /></span>)}</span>
                          <span className="max-w-[110px] truncate text-sm text-muted-foreground">{t.assignees.length === 1 ? t.assignees[0] : `${t.assignees.length} people`}</span>
                        </span>
                      ) : <span className="text-sm text-muted-foreground">Unassigned</span>}
                    </TableCell>
                    {view === 'completed'
                      ? <TableCell className="whitespace-nowrap text-sm tabular-nums text-muted-foreground">{fmtDate(t.completedAt)}</TableCell>
                      : <TableCell className={cn('whitespace-nowrap text-sm tabular-nums', overdue ? 'font-medium text-destructive' : 'text-muted-foreground')}>
                          {overdue && <AlertCircle className="mr-1 inline size-3.5" aria-label="Overdue" />}{fmtDate(t.dueDate)}
                        </TableCell>}
                    <TableCell className="text-right">
                      <RowActionsMenu label={t.name} onEdit={() => setDrawer({ task: t })} onDelete={() => setConfirm([t])}
                        extra={[
                          isCompleted(t)
                            ? { label: 'Reopen', icon: RotateCcw, onClick: () => changeStatus([t], 'No status') }
                            : { label: 'Mark as completed', icon: CheckCircle2, onClick: () => changeStatus([t], 'Completed') },
                          { label: 'Open account', icon: ExternalLink, onClick: () => navigate(accountTabPath('workflow', t.accountId)) },
                        ]} />
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={9}>
                    {inView.length ? (
                      <EmptyState icon={SearchX} title="No tasks match" description="Try a different search or remove some filters."
                        action={<Button variant="outline" onClick={reset}>Clear filters</Button>} />
                    ) : view === 'completed' ? (
                      <EmptyState icon={CheckCircle2} title="No completed tasks yet" description="Tasks you complete move here." />
                    ) : (
                      <EmptyState icon={CheckSquare} title="No pending tasks" description="Create a task for an account, or start from a task template."
                        action={<Button onClick={() => setDrawer({})}><Plus />New task</Button>} />
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {filtered.length > 0 && <Pagination {...paging} label="tasks" />}
      </section>

      {drawer && (
        <TaskDrawer task={drawer.task || null} accountId={accountIds.length === 1 ? accountIds[0] : ''} onClose={() => setDrawer(null)}
          onSave={(form) => { const rec = saveTask(form); setDrawer(null); notify(drawer.task ? `Updated “${rec.name}”` : `Created “${rec.name}”`); }} />
      )}
      {confirm && (
        <Modal title={confirm.length === 1 ? `Delete “${confirm[0].name}”?` : `Delete ${confirm.length} tasks?`} description="This can't be undone." onClose={() => setConfirm(null)}
          footer={<><Button variant="outline" onClick={() => setConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { remove(confirm); setConfirm(null); }}><Trash2 />{confirm.length === 1 ? 'Delete task' : 'Delete tasks'}</Button></>}>
          <ul className="max-h-40 list-disc overflow-y-auto pl-5 text-sm">{confirm.map((t) => <li key={t.id}>{t.name} · {t.accountName}</li>)}</ul>
        </Modal>
      )}
      <ToastBridge message={note} />
    </div>
  );
}
