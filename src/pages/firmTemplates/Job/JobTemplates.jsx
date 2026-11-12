import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle, Briefcase, Copy, Download, Eye, MessageSquare, Plus, SearchX, Trash2, X } from 'lucide-react';
import Pagination, { usePagination } from '../../../components/Pagination';
import { htmlToText } from '../../../components/TextEditor';
import {
  BarSelect, BulkBar, HeaderCheckbox, SelectCheckbox, SelectedOnlyFilter, barButton, barDanger, downloadCsv, useSelection,
} from '../../../components/TableSelection';
import { Modal } from '../../../components/ui';
import { Button } from '../../../components/ui/button';
import { ToastBridge } from '../../../components/ui/sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { DataCard, EmptyState, SearchInput, StatCard } from '../../../components/page';
import RowActionsMenu from '../../../components/RowActionsMenu';
import { useData } from '../../../context/DataContext';
import { TASK_PRIORITIES, describeDates } from '../../../data/taskTemplates';
import { statusOptionsFrom } from './Jobtemplateform';

const LIST_PATH = '/firmtemp/templates/jobs';
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

/** Title row for a tab inside the Firm Templates layout (the layout owns the page h1). */
function ListHeader({ title, description, action }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

/** Firm Templates → Jobs: table of job templates. New / Edit open JobTemplateForm (same as Tasks and Emails). */
export default function JobTemplates() {
  const navigate = useNavigate();
  const { state: routeState, pathname } = useLocation();
  const { jobTemplates = [], duplicateJobTemplates, deleteJobTemplates, clientFacingJobs, clientStatuses } = useData();
  const statusList = clientFacingJobs ?? clientStatuses;
  const statusById = useMemo(() => new Map(statusOptionsFrom(statusList ?? []).map((s) => [String(s.id), s])), [statusList]);

  const [q, setQ] = useState('');
  const [priority, setPriority] = useState('All');
  const [portal, setPortal] = useState('All');      // All · Shown · Hidden
  const [confirm, setConfirm] = useState(null);
  const [toast, setToast] = useState('');
  const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 2600); };
  const openNew = () => navigate(`${LIST_PATH}/new`);
  const openEdit = (t) => navigate(`${LIST_PATH}/${t.id}`);

  // Message sent back from the form page ("Created …", "Saved …", "Deleted …")
  useEffect(() => {
    if (routeState?.toast) { notify(routeState.toast); navigate(pathname, { replace: true, state: null }); }
  }, [routeState]); // eslint-disable-line react-hooks/exhaustive-deps

  const selection = useSelection();
  const [selectedOnly, setSelectedOnly] = useState(false);
  useEffect(() => { if (selection.count === 0) setSelectedOnly(false); }, [selection.count]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return jobTemplates.filter((t) => (priority === 'All' || t.priority === priority)
      && (portal === 'All' || (portal === 'Shown' ? t.clientFacingStatus : !t.clientFacingStatus))
      && (!selectedOnly || selection.has(t.id))
      && (!s || `${t.templatename} ${t.jobName} ${htmlToText(t.description)} ${(t.assignees || []).join(' ')}`.toLowerCase().includes(s)));
  }, [jobTemplates, q, priority, portal, selectedOnly, selection]);

  const paging = usePagination(filtered, { initialSize: 10, storageKey: 'job-templates' });
  const { pageItems: rows, setPage } = paging;
  const selected = jobTemplates.filter((t) => selection.has(t.id));
  const filtersOn = q || priority !== 'All' || portal !== 'All';
  const reset = () => { setQ(''); setPriority('All'); setPortal('All'); setSelectedOnly(false); setPage(1); };

  if (!duplicateJobTemplates) {
    return (
      <div role="alert" className="flex items-center gap-3 rounded-xl border border-danger-100 bg-danger-50 p-5 text-sm font-medium text-danger-700">
        <AlertTriangle className="size-4 flex-none" aria-hidden="true" />Job templates are not set up in DataContext.js
      </div>
    );
  }

  const remove = () => {
    const ids = confirm.map((t) => t.id);
    deleteJobTemplates(ids); selection.setMany(ids, false); setConfirm(null);
    notify(`Deleted ${ids.length} template${ids.length > 1 ? 's' : ''}`);
  };
  const exportCsv = (items) => {
    downloadCsv('job-templates.csv', [['Template name', 'Job name', 'Assignees', 'Priority', 'Dates', 'Client portal', 'Client status', 'Comments', 'Updated'],
      ...items.map((t) => [t.templatename, t.jobName, (t.assignees || []).join('; '), t.priority, describeDates(t),
        t.clientFacingStatus ? 'Shown' : 'Hidden', statusById.get(String(t.selectedJob))?.name || '', (t.comments || []).join(' | '), t.updatedAt])]);
    notify(`Exported ${items.length} templates`);
  };

  const shown = jobTemplates.filter((t) => t.clientFacingStatus).length;
  const urgent = jobTemplates.filter((t) => ['High', 'Urgent'].includes(t.priority)).length;

  return (
    <div className="flex flex-col gap-6">
      <ListHeader title="Job templates" description="Jobs with assignees, dates and what clients see in their portal."
        action={<Button onClick={openNew}><Plus />New job template</Button>} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard label="Total templates" value={jobTemplates.length} icon={Briefcase} />
        <StatCard label="Shown in client portal" value={shown} icon={Eye} tone="brand"
          hint={portal === 'Shown' ? 'Showing only these · click to clear' : 'Click to show only these'}
          onClick={() => { setPortal((p) => (p === 'Shown' ? 'All' : 'Shown')); setPage(1); }} active={portal === 'Shown'} />
        <StatCard label="High or urgent" value={urgent} icon={AlertTriangle} tone={urgent ? 'warning' : 'default'} />
        <StatCard label="With comments" value={jobTemplates.filter((t) => t.comments?.length).length} icon={MessageSquare} />
      </div>

      <DataCard
        toolbar={<>
          <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} label="Search job templates"
            placeholder="Search name, job name, assignee" className="h-8 w-full sm:w-72" />
          <BarSelect label="Priority" value={priority} onChange={(v) => { setPriority(v); setPage(1); }} options={['All', ...TASK_PRIORITIES]} />
          <BarSelect label="Client portal" value={portal} onChange={(v) => { setPortal(v); setPage(1); }} options={['All', 'Shown', 'Hidden']} />
          {filtersOn ? <Button variant="ghost" size="sm" onClick={reset} className="text-muted-foreground">Reset<X /></Button> : null}
          <span className="ml-auto hidden text-sm tabular-nums text-muted-foreground md:inline">{filtered.length} of {jobTemplates.length}</span>
        </>}
        footer={filtered.length > 0 && <Pagination {...paging} label="templates" />}
      >
        <Table className="min-w-[560px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"><HeaderCheckbox selection={selection} pageIds={rows.map((t) => t.id)} /></TableHead>
              <TableHead>Template name</TableHead>
              <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((t) => {
              const checked = selection.has(t.id);
              return (
                <TableRow key={t.id} data-state={checked ? 'selected' : undefined} aria-selected={checked}>
                  <TableCell><SelectCheckbox label={`Select ${t.templatename}`} checked={checked} onChange={() => selection.toggle(t.id)} /></TableCell>
                  <TableCell className="max-w-[520px]">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex size-8 flex-none items-center justify-center rounded-lg border bg-subtle text-muted-foreground" aria-hidden="true">
                        <Briefcase className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <Link to={`${LIST_PATH}/${t.id}`} className="block truncate font-medium text-foreground underline-offset-4 hover:underline">{t.templatename}</Link>
                        {t.jobName && <div className="truncate font-mono text-xs text-muted-foreground">{t.jobName}</div>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <RowActionsMenu
                      label={t.templatename}
                      onEdit={() => openEdit(t)}
                      onDuplicate={() => { duplicateJobTemplates([t.id]); notify(`Duplicated “${t.templatename}”`); }}
                      onDelete={() => setConfirm([t])}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={3}>
                  {jobTemplates.length ? (
                    <EmptyState icon={SearchX} title="No job templates match these filters" description="Try a different search or remove some filters."
                      action={<Button variant="outline" onClick={reset}>Clear filters</Button>} />
                  ) : (
                    <EmptyState icon={Briefcase} title="No job templates yet" description="Create a reusable job with assignees, dates and a client-facing status."
                      action={<Button onClick={openNew}><Plus />New job template</Button>} />
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
          <button type="button" className={barButton} onClick={() => { duplicateJobTemplates([...selection.ids]); notify(`Duplicated ${selection.count} template${selection.count > 1 ? 's' : ''}`); selection.clear(); }}><Copy aria-hidden="true" />Duplicate</button>
          <button type="button" className={barButton} onClick={() => exportCsv(selected)}><Download aria-hidden="true" />Export</button>
          <button type="button" className={barDanger} onClick={() => setConfirm(selected)}><Trash2 aria-hidden="true" />Delete</button>
        </>}
      />

      {confirm && (
        <Modal title={confirm.length === 1 ? `Delete “${confirm[0].templatename}”?` : `Delete ${confirm.length} templates?`}
          description={`Jobs already created from ${confirm.length === 1 ? 'this template' : 'these templates'} stay as they are.`}
          onClose={() => setConfirm(null)}
          footer={<><Button variant="outline" onClick={() => setConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={remove}><Trash2 />{confirm.length > 1 ? `Delete ${plural(confirm.length, 'template')}` : 'Delete'}</Button></>}>
          <ul className="max-h-48 divide-y overflow-y-auto rounded-lg border">
            {confirm.map((t) => (
              <li key={t.id} className="flex items-center gap-2.5 px-3 py-2 text-sm">
                <Briefcase className="size-4 flex-none text-muted-foreground" aria-hidden="true" />
                <span className="truncate font-medium">{t.templatename}</span>
                {t.jobName && <span className="truncate font-mono text-xs text-muted-foreground">{t.jobName}</span>}
              </li>
            ))}
          </ul>
        </Modal>
      )}
      <ToastBridge message={toast} />
    </div>
  );
}
