import { useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight, CircleAlert, Copy, Download, FileStack, GitBranch, Layers, Plus, SearchX, Trash2, Users, Zap } from 'lucide-react';
import Pagination, { usePagination } from '../../../components/Pagination';
import {
  BulkBar, HeaderCheckbox, SelectCheckbox, SelectedOnlyFilter, barButton, barDanger, downloadCsv, useSelection,
} from '../../../components/TableSelection';
import { Avatar, Modal, initials } from '../../../components/ui';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { toast } from '../../../components/ui/sonner';
import { SimpleTooltip } from '../../../components/ui/tooltip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { DataCard, EmptyState, PageHeader, SearchInput, StatCard } from '../../../components/page';
import { useData } from '../../../context/DataContext';
import { SORT_JOBS_BY } from '../../../data/pipelinesdata';
import { templateOptionsFrom } from '../../../data/statusOptions';
import RowActionsMenu from '../../../components/RowActionsMenu';

const LIST_PATH = '/firmtemp/pipelines';
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—');
const automationCount = (p) => (p.stages || []).reduce((n, s) => n + (s.automations?.length || 0), 0);
const stageColor = (i) => `hsl(var(--chart-${(i % 5) + 1}))`;
const notify = (m) => (/delet|remov/i.test(m) ? toast(m) : toast.success(m));

/** Route wrapper: /firmtemp/pipelines shows the list; /new and /:pipelineId show the form. */
export function PipelinesLayout() { return <Outlet />; }

function StageFlow({ stages }) {
  if (!stages.length) return <span className="text-xs text-muted-foreground/70">No stages</span>;
  const shown = stages.slice(0, 4);
  return (
    <div className="mt-1 flex min-w-0 flex-wrap items-center gap-1 text-xs text-muted-foreground">
      {shown.map((s, i) => (
        <span key={s.id || i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="size-3 text-muted-foreground/50" aria-hidden="true" />}
          <span className="inline-flex h-5 max-w-[140px] items-center gap-1.5 rounded-md border bg-subtle px-1.5">
            <span className="size-1.5 flex-none rounded-full" style={{ backgroundColor: stageColor(i) }} aria-hidden="true" />
            <span className="truncate">{s.name || 'Untitled'}</span>
          </span>
        </span>
      ))}
      {stages.length > 4 && (
        <SimpleTooltip label={stages.slice(4).map((s) => s.name).join(' → ')}>
          <span className="inline-flex h-5 items-center rounded-md border bg-muted px-1.5 font-medium">+{stages.length - 4}</span>
        </SimpleTooltip>
      )}
    </div>
  );
}

/** Templates → Pipeline Templates: table of pipelines. New / Edit open PipelineForm. */
export default function PipelineTemplates() {
  const navigate = useNavigate();
  const { state: routeState, pathname } = useLocation();
  const { pipelines = [], duplicatePipeline, deletePipelines, jobTemplates = [] } = useData();
  const jobTemplateById = useMemo(() => new Map(templateOptionsFrom(jobTemplates).map((o) => [String(o.id), o.label])), [jobTemplates]);

  const [q, setQ] = useState('');
  const [confirm, setConfirm] = useState(null);
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

  if (!duplicatePipeline) {
    return (
      <div role="alert" className="flex items-center gap-2 rounded-xl border border-danger-200 bg-danger-50 p-5 text-sm font-medium text-danger-700">
        <CircleAlert className="size-4 flex-none" aria-hidden="true" />Pipelines are not set up in DataContext.js
      </div>
    );
  }

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
  const clearSearch = () => { setQ(''); setSelectedOnly(false); setPage(1); };

  const stageTotal = pipelines.reduce((n, p) => n + (p.stages?.length || 0), 0);
  const autoTotal = pipelines.reduce((n, p) => n + automationCount(p), 0);
  const withDefault = pipelines.filter((p) => p.defaultjobtemplate).length;

  return (
    <div className="page">
      <PageHeader
        title="Pipeline Templates"
        description="Stages jobs move through, with automations that run at each stage."
        actions={<>
          <Button variant="outline" onClick={() => exportCsv(filtered)} disabled={!filtered.length}><Download />Export</Button>
          <Button onClick={openNew}><Plus />New pipeline</Button>
        </>}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard label="Pipelines" value={pipelines.length} icon={GitBranch} />
        <StatCard label="Stages" value={stageTotal} icon={Layers} hint={`${(stageTotal / Math.max(pipelines.length, 1)).toFixed(1)} per pipeline`} />
        <StatCard label="Automations" value={autoTotal} icon={Zap} tone={autoTotal ? 'brand' : 'default'} />
        <StatCard label="With a default job template" value={withDefault} icon={FileStack}
          hint={`${Math.round((withDefault / Math.max(pipelines.length, 1)) * 100)}% of pipelines`} />
      </div>

      <DataCard
        toolbar={<>
          <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search pipeline, stage, team member" label="Search pipelines" className="h-8 w-full sm:w-80" />
          <span className="ml-auto hidden text-sm tabular-nums text-muted-foreground md:inline">{filtered.length} of {pipelines.length}</span>
        </>}
        footer={filtered.length > 0 && <Pagination {...paging} label="pipelines" />}
      >
        <Table className="min-w-[1000px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"><HeaderCheckbox selection={selection} pageIds={rows.map((p) => p.id)} /></TableHead>
              <TableHead>Pipeline</TableHead>
              <TableHead className="text-right">Stages</TableHead>
              <TableHead>Automations</TableHead>
              <TableHead>Available to</TableHead>
              <TableHead>Default job template</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((p) => {
              const checked = selection.has(p.id);
              const stages = p.stages || [];
              const autos = automationCount(p);
              const team = p.availableto || [];
              const tpl = jobTemplateById.get(String(p.defaultjobtemplate));
              return (
                <TableRow key={p.id} data-state={checked ? 'selected' : undefined}>
                  <TableCell><SelectCheckbox label={`Select ${p.pipelineName}`} checked={checked} onChange={() => selection.toggle(p.id)} /></TableCell>
                  <TableCell className="max-w-[380px]">
                    <button type="button" onClick={() => openEdit(p)} className="block max-w-full truncate text-left font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:underline">{p.pipelineName}</button>
                    <StageFlow stages={stages} />
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{stages.length}</TableCell>
                  <TableCell>
                    {autos ? <Badge variant="info" className="tabular-nums"><Zap aria-hidden="true" />{autos}</Badge> : <span className="text-muted-foreground/60">—</span>}
                  </TableCell>
                  <TableCell>
                    {team.length ? (
                      <SimpleTooltip label={team.join(', ')}>
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-1">
                            {team.slice(0, 4).map((n) => <span key={n} className="rounded-full ring-2 ring-card"><Avatar text={initials(n)} size="xs" /></span>)}
                          </div>
                          {team.length > 4 && <span className="text-xs tabular-nums text-muted-foreground">+{team.length - 4}</span>}
                        </div>
                      </SimpleTooltip>
                    ) : <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"><Users className="size-3.5" aria-hidden="true" />Everyone</span>}
                  </TableCell>
                  <TableCell className="max-w-[220px] truncate text-sm">{tpl || <span className="text-muted-foreground/60">—</span>}</TableCell>
                  <TableCell className="whitespace-nowrap text-sm tabular-nums text-muted-foreground">{fmtDate(p.updatedAt)}</TableCell>
                  <TableCell className="text-right">
                    <RowActionsMenu
                      label={p.pipelineName}
                      onEdit={() => openEdit(p)}
                      onDuplicate={() => { duplicatePipeline(p.id); notify(`Duplicated “${p.pipelineName}”`); }}
                      onDelete={() => setConfirm([p])}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={8}>
                  {pipelines.length ? (
                    <EmptyState icon={SearchX} title="No pipelines match your search." description="Try a different pipeline, stage or team member name."
                      action={<Button variant="outline" onClick={clearSearch}>Clear search</Button>} />
                  ) : (
                    <EmptyState icon={GitBranch} title="No pipelines yet." description="Create a pipeline to define the stages your jobs move through."
                      action={<Button onClick={openNew}><Plus />New pipeline</Button>} />
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </DataCard>

      <BulkBar count={selection.count} total={filtered.length}
        onSelectAll={() => selection.setMany(filtered.map((p) => p.id), true)} onClear={selection.clear}
        filters={<SelectedOnlyFilter checked={selectedOnly} onChange={(v) => { setSelectedOnly(v); setPage(1); }} />}
        actions={<>
          <button type="button" className={barButton} onClick={() => { selected.forEach((p) => duplicatePipeline(p.id)); notify(`Duplicated ${selected.length} pipeline${selected.length > 1 ? 's' : ''}`); selection.clear(); }}><Copy aria-hidden="true" />Duplicate</button>
          <button type="button" className={barButton} onClick={() => exportCsv(selected)}><Download aria-hidden="true" />Export</button>
          <button type="button" className={barDanger} onClick={() => setConfirm(selected)}><Trash2 aria-hidden="true" />Delete</button>
        </>}
      />

      {confirm && (
        <Modal title={confirm.length === 1 ? `Delete “${confirm[0].pipelineName}”?` : `Delete ${confirm.length} pipelines?`}
          description={`Jobs already in ${confirm.length === 1 ? 'this pipeline' : 'these pipelines'} are not affected.`} onClose={() => setConfirm(null)}
          footer={<><Button variant="outline" onClick={() => setConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={remove}><Trash2 />Delete</Button></>}>
          <ul className="max-h-48 divide-y overflow-y-auto rounded-lg border">
            {confirm.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                <GitBranch className="size-4 flex-none text-muted-foreground" aria-hidden="true" />
                <span className="truncate font-medium">{p.pipelineName}</span>
                <span className="ml-auto flex-none text-xs tabular-nums text-muted-foreground">{(p.stages || []).length} stages</span>
              </li>
            ))}
          </ul>
        </Modal>
      )}
    </div>
  );
}
