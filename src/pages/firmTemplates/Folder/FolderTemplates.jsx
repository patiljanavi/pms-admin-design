import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle, Copy, Download, File, Folder, FolderTree, Plus, SearchX, Trash2, Workflow, X } from 'lucide-react';
import RowActionsMenu from '../../../components/RowActionsMenu';
import Pagination, { usePagination } from '../../../components/Pagination';
import {
  BulkBar, HeaderCheckbox, SelectCheckbox, SelectedOnlyFilter, barButton, barDanger, downloadCsv, useSelection,
} from '../../../components/TableSelection';
import { Modal } from '../../../components/ui';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { ToastBridge } from '../../../components/ui/sonner';
import { SimpleTooltip } from '../../../components/ui/tooltip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { DataCard, EmptyState, SearchInput } from '../../../components/page';
import { useData } from '../../../context/DataContext';
import { countItems } from '../../../data/folderTemplates';

const LIST_PATH = '/firmtemp/templates/folders';
const fmtDate = (d) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—');
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const Dash = () => <span className="text-muted-foreground/60">—</span>;

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

/** Firm Templates → Folders: table of folder templates. New / Edit open FolderTemplateForm. */
export default function FolderTemplates() {
  const navigate = useNavigate();
  const { state: routeState, pathname } = useLocation();
  const { folderTemplates = [], duplicateFolderTemplates, deleteFolderTemplates, pipelines = [] } = useData();

  // pipelines whose "Apply folder template" automation uses each template
  const usedIn = useMemo(() => {
    const m = new Map();
    pipelines.forEach((p) => {
      const ids = new Set(p.stages.flatMap((s) => (s.automations || []).filter((a) => a.type === 'Apply folder template').map((a) => String(a.selectedtemp))));
      ids.forEach((id) => m.set(id, [...(m.get(id) || []), p.pipelineName]));
    });
    return m;
  }, [pipelines]);

  const [q, setQ] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [toast, setToast] = useState('');
  const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 2600); };
  useEffect(() => {
    if (routeState?.toast) { notify(routeState.toast); navigate(pathname, { replace: true, state: null }); }
  }, [routeState]); // eslint-disable-line react-hooks/exhaustive-deps

  const selection = useSelection();
  const [selectedOnly, setSelectedOnly] = useState(false);
  useEffect(() => { if (selection.count === 0) setSelectedOnly(false); }, [selection.count]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return folderTemplates.filter((t) => (!selectedOnly || selection.has(t.id)) && (!s || t.templatename.toLowerCase().includes(s)));
  }, [folderTemplates, q, selectedOnly, selection]);
  const paging = usePagination(filtered, { initialSize: 10, storageKey: 'folder-templates' });
  const { pageItems: rows, setPage } = paging;
  const selected = folderTemplates.filter((t) => selection.has(t.id));

  if (!duplicateFolderTemplates) {
    return (
      <div role="alert" className="flex items-center gap-3 rounded-xl border border-danger-100 bg-danger-50 p-5 text-sm font-medium text-danger-700">
        <AlertTriangle className="size-4 flex-none" aria-hidden="true" />Folder templates are not set up in DataContext.js
      </div>
    );
  }

  const openNew = () => navigate(`${LIST_PATH}/new`);
  const openEdit = (t) => navigate(`${LIST_PATH}/${t.id}`);
  const clearSearch = () => { setQ(''); setPage(1); };
  const remove = () => {
    const ids = confirm.map((t) => t.id);
    deleteFolderTemplates(ids); selection.setMany(ids, false); setConfirm(null);
    notify(`Deleted ${ids.length} template${ids.length > 1 ? 's' : ''}`);
  };
  const exportCsv = (items) => {
    downloadCsv('folder-templates.csv', [['Template name', 'Folders', 'Files', 'Used in pipelines', 'Updated'],
      ...items.map((t) => { const c = countItems(t.items); return [t.templatename, c.folders, c.files, (usedIn.get(String(t.id)) || []).join('; '), t.updatedAt]; })]);
    notify(`Exported ${items.length} templates`);
  };

  return (
    <div className="flex flex-col gap-6">
      <ListHeader title="Folder templates" description="Folder structures created for an account, always with the three default folders."
        action={<Button onClick={openNew}><Plus />New folder template</Button>} />

      <DataCard
        toolbar={<>
          <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} label="Search folder templates" placeholder="Search template name" className="h-8 w-full sm:w-72" />
          {q && <Button variant="ghost" size="sm" onClick={clearSearch} className="text-muted-foreground">Clear<X /></Button>}
          <span className="ml-auto hidden text-sm tabular-nums text-muted-foreground md:inline">{filtered.length} of {folderTemplates.length}</span>
        </>}
        footer={filtered.length > 0 && <Pagination {...paging} label="templates" />}
      >
         <BulkBar count={selection.count} total={filtered.length}
        onSelectAll={() => selection.setMany(filtered.map((t) => t.id), true)} onClear={selection.clear}
        filters={<SelectedOnlyFilter checked={selectedOnly} onChange={(v) => { setSelectedOnly(v); setPage(1); }} />}
        actions={<>
          <button type="button" className={barButton} onClick={() => { duplicateFolderTemplates([...selection.ids]); notify(`Duplicated ${selection.count} template${selection.count > 1 ? 's' : ''}`); selection.clear(); }}><Copy aria-hidden="true" />Duplicate</button>
          <button type="button" className={barButton} onClick={() => exportCsv(selected)}><Download aria-hidden="true" />Export</button>
          <button type="button" className={barDanger} onClick={() => setConfirm(selected)}><Trash2 aria-hidden="true" />Delete</button>
        </>}
      />
        <Table className="min-w-[760px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"><HeaderCheckbox selection={selection} pageIds={rows.map((t) => t.id)} /></TableHead>
              <TableHead>Template name</TableHead>
              <TableHead className="text-right">Folders</TableHead>
              <TableHead className="text-right">Files</TableHead>
              <TableHead>Used in pipelines</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((t) => {
              const checked = selection.has(t.id);
              const c = countItems(t.items);
              const pipes = usedIn.get(String(t.id)) || [];
              return (
                <TableRow key={t.id} data-state={checked ? 'selected' : undefined} aria-selected={checked}>
                  <TableCell><SelectCheckbox label={`Select ${t.templatename}`} checked={checked} onChange={() => selection.toggle(t.id)} /></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex size-8 flex-none items-center justify-center rounded-lg border border-brand-100 bg-brand-50 text-brand-700" aria-hidden="true">
                        <Folder className="size-4" />
                      </span>
                      <Link to={`${LIST_PATH}/${t.id}`} className="truncate font-medium text-foreground underline-offset-4 hover:underline">{t.templatename}</Link>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="inline-flex items-center gap-1.5 font-medium tabular-nums"><Folder className="size-3.5 text-muted-foreground" aria-hidden="true" />{c.folders}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    {c.files ? <span className="inline-flex items-center gap-1.5 tabular-nums"><File className="size-3.5 text-muted-foreground" aria-hidden="true" />{c.files}</span> : <Dash />}
                  </TableCell>
                  <TableCell>
                    {pipes.length ? (
                      <SimpleTooltip label={pipes.join(', ')}>
                        <span tabIndex={0} className="inline-flex rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
                          <Badge variant="violet"><Workflow aria-hidden="true" />{pipes.length} pipeline{pipes.length > 1 ? 's' : ''}</Badge>
                        </span>
                      </SimpleTooltip>
                    ) : <Dash />}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{fmtDate(t.updatedAt)}</TableCell>
                  <TableCell className="text-right">
                    <RowActionsMenu label={t.templatename} onEdit={() => openEdit(t)}
                      onDuplicate={() => { duplicateFolderTemplates([t.id]); notify(`Duplicated “${t.templatename}”`); }}
                      onDelete={() => setConfirm([t])} />
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={7}>
                  {folderTemplates.length ? (
                    <EmptyState icon={SearchX} title="No folder templates match your search" description="Try a different name."
                      action={<Button variant="outline" onClick={clearSearch}>Clear search</Button>} />
                  ) : (
                    <EmptyState icon={FolderTree} title="No folder templates yet" description="Build a folder structure once and apply it to every new account."
                      action={<Button onClick={openNew}><Plus />New folder template</Button>} />
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </DataCard>

     

      {confirm && (
        <Modal title={confirm.length === 1 ? `Delete “${confirm[0].templatename}”?` : `Delete ${confirm.length} templates?`}
          description="Folders already created for accounts are not affected." onClose={() => setConfirm(null)}
          footer={<><Button variant="outline" onClick={() => setConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={remove}><Trash2 />{confirm.length > 1 ? `Delete ${plural(confirm.length, 'template')}` : 'Delete'}</Button></>}>
          <ul className="max-h-48 divide-y overflow-y-auto rounded-lg border">
            {confirm.map((t) => {
              const c = countItems(t.items);
              return (
                <li key={t.id} className="flex items-center gap-2.5 px-3 py-2 text-sm">
                  <Folder className="size-4 flex-none text-muted-foreground" aria-hidden="true" />
                  <span className="truncate font-medium">{t.templatename}</span>
                  <span className="ml-auto flex-none text-xs tabular-nums text-muted-foreground">{plural(c.folders, 'folder')} · {plural(c.files, 'file')}</span>
                </li>
              );
            })}
          </ul>
        </Modal>
      )}
      <ToastBridge message={toast} />
    </div>
  );
}
