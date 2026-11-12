import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Archive, CheckSquare, CircleCheck, Copy, Download, Flag, ListChecks, PencilLine, Plus, SearchX, Trash2, X,
} from 'lucide-react';
import Pagination, { usePagination } from '../../../components/Pagination';
import TagChip from '../../../components/TagChip';
import FacetFilter from '../../../components/FacetFilter';
import RowActionsMenu from '../../../components/RowActionsMenu';
import {
  BulkBar, HeaderCheckbox, SelectCheckbox, SelectedOnlyFilter, barButton, barDanger, downloadCsv, useSelection,
} from '../../../components/TableSelection';
import { DataCard, EmptyState, SearchInput, StatCard } from '../../../components/page';
import { Modal } from '../../../components/ui';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { ToastBridge } from '../../../components/ui/sonner';
import { useData } from '../../../context/DataContext';
import { TASK_PRIORITIES, TASK_STATUSES, describeDates } from '../../../data/taskTemplates';
import {
  Dash, ListHeader, NameCell, PRIORITY_DOT, PeopleStack, STATUS_BADGE, SelectFilter, SortHead, TagList, fmtDate, sortRows,
} from '../templateKit';

const LIST_PATH = '/firmtemp/templates/tasks';
const STAT_ICON = { Active: CircleCheck, Draft: PencilLine, Inactive: Archive };
const STAT_TONE = { Active: 'success', Draft: 'warning', Inactive: 'default' };

/** Firm Templates → Tasks: table of task templates. New / Edit open TaskTemplateForm. */
export default function TaskTemplates() {
  const navigate = useNavigate();
  const { state: routeState, pathname } = useLocation();
  const { taskTemplates, duplicateTaskTemplates, deleteTaskTemplates, tags, tagById } = useData();

  const [q, setQ] = useState('');
  const [status, setStatus] = useState('All');
  const [priority, setPriority] = useState('All');
  const [tagFilter, setTagFilter] = useState([]);
  const [sort, setSort] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [toast, setToast] = useState('');
  const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 2600); };

  // Message sent back from the form page
  useEffect(() => {
    if (routeState?.toast) { notify(routeState.toast); navigate(pathname, { replace: true, state: null }); }
  }, [routeState]); // eslint-disable-line react-hooks/exhaustive-deps

  const selection = useSelection();
  const [selectedOnly, setSelectedOnly] = useState(false);
  useEffect(() => { if (selection.count === 0) setSelectedOnly(false); }, [selection.count]);

  const tagsOf = (t) => (t.tags || []).map((id) => tagById.get(id)).filter(Boolean);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const list = taskTemplates.filter((t) => (status === 'All' || t.status === status)
      && (priority === 'All' || t.priority === priority)
      && (!tagFilter.length || tagFilter.some((id) => (t.tags || []).includes(id)))
      && (!selectedOnly || selection.has(t.id))
      && (!s || `${t.templatename} ${t.description} ${(t.assignees || []).join(' ')}`.toLowerCase().includes(s)));
    return sortRows(list, sort, {
      name: (t) => t.templatename.toLowerCase(),
      priority: (t) => TASK_PRIORITIES.indexOf(t.priority),
      updated: (t) => t.updatedAt || '',
    });
  }, [taskTemplates, q, status, priority, tagFilter, selectedOnly, selection, sort]);

  const paging = usePagination(filtered, { initialSize: 10, storageKey: 'task-templates' });
  const { pageItems: rows, setPage } = paging;
  const selected = taskTemplates.filter((t) => selection.has(t.id));
  const filtersOn = q || status !== 'All' || priority !== 'All' || tagFilter.length;
  const reset = () => { setQ(''); setStatus('All'); setPriority('All'); setTagFilter([]); setSelectedOnly(false); setPage(1); };
  const openNew = () => navigate(`${LIST_PATH}/new`);
  const openEdit = (t) => navigate(`${LIST_PATH}/${t.id}`);

  const remove = () => {
    const ids = confirm.map((t) => t.id);
    deleteTaskTemplates(ids); selection.setMany(ids, false); setConfirm(null);
    notify(`Deleted ${ids.length} template${ids.length > 1 ? 's' : ''}`);
  };
  const exportCsv = (items) => {
    downloadCsv('task-templates.csv', [['Name', 'Status', 'Priority', 'Assignees', 'Tags', 'Dates', 'Subtasks', 'Updated'],
      ...items.map((t) => [t.templatename, t.status, t.priority, (t.assignees || []).join('; '), tagsOf(t).map((g) => g.label).join('; '),
        describeDates(t), (t.subtasks || []).map((s) => s.text).join('; '), t.updatedAt])]);
    notify(`Exported ${items.length} templates`);
  };

  const tagFacets = useMemo(() => tags.map((t) => ({
    ...t, count: taskTemplates.filter((x) => (x.tags || []).includes(t.value)).length, render: () => <TagChip tag={t} size="xs" />,
  })), [tags, taskTemplates]);

  const toggleStatus = (s) => { setStatus((cur) => (cur === s ? 'All' : s)); setPage(1); };

  return (
    <div className="flex flex-col gap-6">
      <ListHeader
        title="Task templates"
        description="Reusable tasks with assignees, dates and a subtask checklist."
        actions={<>
          <Button onClick={openNew} aria-label="+ New task template"><Plus />New task template</Button>
        </>}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard label="Total templates" value={taskTemplates.length} icon={CheckSquare}
          hint={`${taskTemplates.filter((t) => t.SubtaskSwitch && t.subtasks?.length).length} with subtasks`} />
        {TASK_STATUSES.map((s) => {
          const n = taskTemplates.filter((t) => t.status === s).length;
          return (
            <StatCard key={s} label={s} value={n} icon={STAT_ICON[s]} tone={STAT_TONE[s]} active={status === s}
              hint={status === s ? 'Showing only these · click to clear' : 'Click to filter'} onClick={() => toggleStatus(s)} />
          );
        })}
      </div>

      <DataCard
        toolbar={<>
          <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} label="Search task templates"
            placeholder="Search name, description, assignee…" className="h-8 w-full sm:w-72" />
          <SelectFilter label="Status" icon={CircleCheck} value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={['All', ...TASK_STATUSES]} />
          <SelectFilter label="Priority" icon={Flag} value={priority} onChange={(v) => { setPriority(v); setPage(1); }} options={['All', ...TASK_PRIORITIES]} />
          <FacetFilter title="Tags" options={tagFacets} value={tagFilter} onChange={(v) => { setTagFilter(v); setPage(1); }} />
          {filtersOn ? <Button variant="ghost" size="sm" onClick={reset} className="text-muted-foreground">Reset<X /></Button> : null}
          <span className="ml-auto hidden text-sm tabular-nums text-muted-foreground md:inline">{filtered.length} of {taskTemplates.length}</span>
        </>}
        footer={filtered.length > 0 && <Pagination {...paging} label="templates" />}
      >
        <Table className="min-w-[1080px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"><HeaderCheckbox selection={selection} pageIds={rows.map((t) => t.id)} /></TableHead>
              <SortHead label="Template" col="name" sort={sort} setSort={setSort} />
              <TableHead>Status</TableHead>
              <SortHead label="Priority" col="priority" sort={sort} setSort={setSort} />
              <TableHead>Assignees</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Schedule</TableHead>
              <TableHead>Subtasks</TableHead>
              <SortHead label="Updated" col="updated" sort={sort} setSort={setSort} />
              <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((t) => {
              const checked = selection.has(t.id);
              const subtaskCount = t.SubtaskSwitch ? (t.subtasks || []).length : 0;
              return (
                <TableRow key={t.id} data-state={checked ? 'selected' : undefined}>
                  <TableCell><SelectCheckbox label={`Select ${t.templatename}`} checked={checked} onChange={() => selection.toggle(t.id)} /></TableCell>
                  <TableCell className="max-w-[300px]">
                    <NameCell icon={CheckSquare} name={t.templatename} preview={t.description} onOpen={() => openEdit(t)} />
                  </TableCell>
                  <TableCell><Badge variant={STATUS_BADGE[t.status] || 'neutral'} dot>{t.status}</Badge></TableCell>
                  <TableCell>
                    <Badge variant="outline" className="gap-1.5 font-medium">
                      <span className={`size-1.5 rounded-full ${PRIORITY_DOT[t.priority] || 'bg-muted-foreground/50'}`} aria-hidden="true" />{t.priority}
                    </Badge>
                  </TableCell>
                  <TableCell><PeopleStack names={t.assignees} /></TableCell>
                  <TableCell><TagList tags={tagsOf(t)} /></TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{describeDates(t)}</TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    {subtaskCount ? <span className="inline-flex items-center gap-1.5"><ListChecks className="size-3.5 text-muted-foreground" aria-hidden="true" />{subtaskCount} items</span> : <Dash />}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{fmtDate(t.updatedAt)}</TableCell>
                  <TableCell className="text-right">
                    {/* <button onClick={() => openEdit(t)} aria-label={`Edit ${t.templatename}`} className="flex h-9 w-9 items-center justify-center rounded text-muted-foreground hover:bg-subtle hover:text-ink"><FiEdit2 aria-hidden="true" /></button>
                    <button onClick={() => { duplicateTaskTemplates([t.id]); notify(`Duplicated “${t.templatename}”`); }} aria-label={`Duplicate ${t.templatename}`} className="flex h-9 w-9 items-center justify-center rounded text-muted-foreground hover:bg-subtle hover:text-ink"><FiCopy aria-hidden="true" /></button>
                    <button onClick={() => setConfirm([t])} aria-label={`Delete ${t.templatename}`} className="flex h-9 w-9 items-center justify-center rounded text-danger-700 hover:bg-danger-50"><FiTrash2 aria-hidden="true" /></button> */}
                    <RowActionsMenu label={t.templatename} onEdit={() => openEdit(t)} onDelete={() => setConfirm([t])} />
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={10}>
                  {taskTemplates.length ? (
                    <EmptyState icon={SearchX} title="No task templates match" description="Try a different search or remove some filters."
                      action={<Button variant="outline" onClick={reset}>Clear filters</Button>} />
                  ) : (
                    <EmptyState icon={CheckSquare} title="No task templates yet" description="Create a template once and reuse it for every recurring task."
                      action={<Button onClick={openNew}><Plus />New task template</Button>} />
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </DataCard>

      <BulkBar count={selection.count} total={filtered.length}
        onSelectAll={() => selection.setMany(filtered.map((t) => t.id), true)} onClear={selection.clear}
        filters={<SelectedOnlyFilter checked={selectedOnly} onChange={(v) => { setSelectedOnly(v); setPage(1); }} />}
        actions={<>
          <button type="button" className={barButton} onClick={() => { duplicateTaskTemplates([...selection.ids]); notify(`Duplicated ${selection.count} template${selection.count > 1 ? 's' : ''}`); selection.clear(); }}><Copy aria-hidden="true" />Duplicate</button>
          <button type="button" className={barButton} onClick={() => exportCsv(selected)}><Download aria-hidden="true" />Export</button>
          <button type="button" className={barDanger} onClick={() => setConfirm(selected)}><Trash2 aria-hidden="true" />Delete</button>
        </>}
      />

      {confirm && (
        <Modal title={confirm.length === 1 ? `Delete “${confirm[0].templatename}”?` : `Delete ${confirm.length} templates?`}
          description={`Tasks already created from ${confirm.length === 1 ? 'this template' : 'these templates'} stay as they are.`}
          onClose={() => setConfirm(null)}
          footer={<><Button variant="outline" onClick={() => setConfirm(null)}>Cancel</Button><Button variant="destructive" onClick={remove}>Delete</Button></>}>
          <ul className="max-h-48 divide-y overflow-y-auto rounded-lg border">
            {confirm.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <span className="truncate font-medium">{t.templatename}</span>
                <Badge variant={STATUS_BADGE[t.status] || 'neutral'} dot>{t.status}</Badge>
              </li>
            ))}
          </ul>
        </Modal>
      )}
      <ToastBridge message={toast} />
    </div>
  );
}
