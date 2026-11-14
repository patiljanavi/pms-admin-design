import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Bell, CircleAlert, ClipboardList, CloudUpload, Copy, Download, Eye, ListChecks, Lock, Plus, SearchX, Trash2, UserCheck, Workflow, X,
} from 'lucide-react';
import RowActionsMenu from '../../../components/RowActionsMenu';
import OrganizerPreview from '../../../components/organizer/OrganizerPreview';
import Pagination, { usePagination } from '../../../components/Pagination';
import {
  BulkBar, HeaderCheckbox, SelectCheckbox, SelectedOnlyFilter, barButton, barDanger, downloadCsv, useSelection,
} from '../../../components/TableSelection';
import { Modal } from '../../../components/ui';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { toast } from '../../../components/ui/sonner';
import { SimpleTooltip } from '../../../components/ui/tooltip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { DataCard, EmptyState, SearchInput, StatCard } from '../../../components/page';
import { useData } from '../../../context/DataContext';
import { questionCount } from '../../../data/organizerTemplates';

const LIST_PATH = '/firmtemp/templates/organizers';
const fmtDate = (d) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—');
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
// Deletions get a neutral toast, everything else a success toast
const notify = (m) => (/delet/i.test(m) ? toast(m) : toast.success(m));

/** Settings icons shown in the table (tooltip on hover). */
function SettingIcon({ icon: Icon, label, className }) {
  return (
    <SimpleTooltip label={label}>
      <span role="img" aria-label={label} className={`inline-flex size-6 items-center justify-center rounded-md border bg-subtle text-muted-foreground [&_svg]:size-3.5 ${className || ''}`}>
        <Icon aria-hidden="true" />
      </span>
    </SimpleTooltip>
  );
}

/** Firm Templates → Organizers: table of organizer templates. New / Edit open OrganizerTemplateForm. */
export default function OrganizerTemplates() {
  const navigate = useNavigate();
  const { state: routeState, pathname } = useLocation();
  const { organizerTemplates = [], duplicateOrganizerTemplates, deleteOrganizerTemplates, pipelines = [] } = useData();

  // How many pipelines use each organizer (Create Organizer automations)
  const usedIn = useMemo(() => {
    const m = new Map();
    pipelines.forEach((p) => {
      const ids = new Set(p.stages.flatMap((s) => (s.automations || []).filter((a) => a.type === 'Create Organizer').map((a) => String(a.selectedtemp))));
      ids.forEach((id) => m.set(id, [...(m.get(id) || []), p.pipelineName]));
    });
    return m;
  }, [pipelines]);

  const [q, setQ] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [preview, setPreview] = useState(null);
  useEffect(() => {
    if (routeState?.toast) { notify(routeState.toast); navigate(pathname, { replace: true, state: null }); }
  }, [routeState]); // eslint-disable-line react-hooks/exhaustive-deps

  const selection = useSelection();
  const [selectedOnly, setSelectedOnly] = useState(false);
  useEffect(() => { if (selection.count === 0) setSelectedOnly(false); }, [selection.count]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return organizerTemplates.filter((t) => (!selectedOnly || selection.has(t.id))
      && (!s || `${t.templatename} ${t.organizerName} ${t.sections.map((x) => x.text).join(' ')}`.toLowerCase().includes(s)));
  }, [organizerTemplates, q, selectedOnly, selection]);
  const paging = usePagination(filtered, { initialSize: 10, storageKey: 'organizer-templates' });
  const { pageItems: rows, setPage } = paging;
  const selected = organizerTemplates.filter((t) => selection.has(t.id));

  if (!duplicateOrganizerTemplates) {
    return (
      <div role="alert" className="flex items-center gap-2 rounded-xl border border-danger-200 bg-danger-50 p-5 font-medium text-danger-700">
        <CircleAlert className="size-4" aria-hidden="true" />Organizer templates are not set up in DataContext.js
      </div>
    );
  }

  const openNew = () => navigate(`${LIST_PATH}/new`);
  const openEdit = (t) => navigate(`${LIST_PATH}/${t.id}`);
  const remove = () => {
    const ids = confirm.map((t) => t.id);
    deleteOrganizerTemplates(ids); selection.setMany(ids, false); setConfirm(null);
    notify(`Deleted ${ids.length} template${ids.length > 1 ? 's' : ''}`);
  };
  const exportCsv = (items) => {
    downloadCsv('organizer-templates.csv', [['Template name', 'Organizer name', 'Sections', 'Questions', 'Reminders', 'Self service', 'Auto-seal', 'Used in pipelines', 'Updated'],
      ...items.map((t) => [t.templatename, t.organizerName, t.sections.length, questionCount(t),
        t.organizersettings.sendreminderstoclient ? `Every ${t.organizersettings.daysuntilnextreminder} days, ${t.organizersettings.numberofreminders} times` : 'Off',
        t.organizersettings.organizerselfservice ? 'Yes' : 'No', t.organizersettings.automaticallysealaftersubmission ? 'Yes' : 'No', (usedIn.get(String(t.id)) || []).join('; '), t.updatedAt])]);
    notify(`Exported ${items.length} templates`);
  };

  const totalQuestions = organizerTemplates.reduce((n, t) => n + questionCount(t), 0);
  const withReminders = organizerTemplates.filter((t) => t.organizersettings.sendreminderstoclient).length;
  const inPipelines = organizerTemplates.filter((t) => usedIn.has(String(t.id))).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Organizer templates</h2>
          <p className="text-sm text-muted-foreground">Questionnaires clients fill in, with conditional questions and sections.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => exportCsv(filtered)} disabled={!filtered.length}><Download />Export</Button>
          <Button onClick={openNew}><Plus />Create Template</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard label="Total templates" value={organizerTemplates.length} icon={ClipboardList} />
        <StatCard label="Questions" value={totalQuestions} icon={ListChecks} hint={`${(totalQuestions / Math.max(organizerTemplates.length, 1)).toFixed(1)} per template`} />
        <StatCard label="With reminders" value={withReminders} icon={Bell} hint={`${Math.round((withReminders / Math.max(organizerTemplates.length, 1)) * 100)}% of templates`} />
        <StatCard label="Used in pipelines" value={inPipelines} icon={Workflow} hint="via Create Organizer automations" />
      </div>

      <DataCard
        toolbar={<>
          <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} label="Search organizer templates" placeholder="Search template, organizer name, section" className="h-8 w-full sm:w-80" />
          {q && <Button variant="ghost" size="sm" onClick={() => { setQ(''); setPage(1); }} className="text-muted-foreground">Clear<X /></Button>}
          <span className="ml-auto hidden text-sm text-muted-foreground md:inline">{filtered.length} of {organizerTemplates.length}</span>
        </>}
        footer={filtered.length > 0 && <Pagination {...paging} label="templates" />}
      >
           <BulkBar count={selection.count} total={filtered.length}
        onSelectAll={() => selection.setMany(filtered.map((t) => t.id), true)} onClear={selection.clear}
        filters={<SelectedOnlyFilter checked={selectedOnly} onChange={(v) => { setSelectedOnly(v); setPage(1); }} />}
        actions={<>
          <button type="button" className={barButton} onClick={() => { duplicateOrganizerTemplates([...selection.ids]); notify(`Duplicated ${selection.count} template${selection.count > 1 ? 's' : ''}`); selection.clear(); }}><Copy aria-hidden="true" />Duplicate</button>
          <button type="button" className={barButton} onClick={() => exportCsv(selected)}><Download aria-hidden="true" />Export</button>
          <button type="button" className={barDanger} onClick={() => setConfirm(selected)}><Trash2 aria-hidden="true" />Delete</button>
        </>}
      />
        <Table className="min-w-[960px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"><HeaderCheckbox selection={selection} pageIds={rows.map((t) => t.id)} /></TableHead>
              <TableHead>Template Name</TableHead>
              <TableHead>Sections</TableHead>
              <TableHead className="text-right">Questions</TableHead>
              <TableHead>Settings</TableHead>
              <TableHead>Used in Pipelines</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((t) => {
              const checked = selection.has(t.id);
              const st = t.organizersettings || {};
              const pipes = usedIn.get(String(t.id)) || [];
              const anySetting = st.sendreminderstoclient || st.notifyaboutdocumentupload || st.organizerselfservice || st.automaticallysealaftersubmission;
              return (
                <TableRow key={t.id} aria-selected={checked} data-state={checked ? 'selected' : undefined}>
                  <TableCell><SelectCheckbox label={`Select ${t.templatename}`} checked={checked} onChange={() => selection.toggle(t.id)} /></TableCell>
                  <TableCell className="max-w-[320px]">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex size-8 flex-none items-center justify-center rounded-lg border bg-subtle text-muted-foreground" aria-hidden="true"><ClipboardList className="size-4" /></span>
                      <div className="min-w-0">
                        <button type="button" onClick={() => openEdit(t)} className="block max-w-full truncate text-left font-medium text-foreground underline-offset-4 hover:underline">{t.templatename}</button>
                        <div className="truncate font-mono text-xs text-muted-foreground">{t.organizerName}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[260px]">
                    <div className="flex items-center gap-2">
                      <Badge variant="neutral" className="tabular-nums">{t.sections.length}</Badge>
                      <span className="truncate text-sm text-muted-foreground">{t.sections.slice(0, 2).map((s) => s.text).join(', ')}{t.sections.length > 2 ? '…' : ''}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{questionCount(t)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {st.sendreminderstoclient && <SettingIcon icon={Bell} label={`Reminds every ${st.daysuntilnextreminder} days, ${st.numberofreminders} times`} className="border-warning-100 bg-warning-50 text-warning-700" />}
                      {st.notifyaboutdocumentupload && <SettingIcon icon={CloudUpload} label="Notifies about document uploads" />}
                      {st.organizerselfservice && <SettingIcon icon={UserCheck} label="Self service" />}
                      {st.automaticallysealaftersubmission && <SettingIcon icon={Lock} label="Seals after submission" />}
                      {!anySetting && <span className="text-muted-foreground/60">—</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    {pipes.length ? (
                      <SimpleTooltip label={pipes.join(', ')}>
                        <Badge variant="info" className="cursor-default"><Workflow aria-hidden="true" />{plural(pipes.length, 'pipeline')}</Badge>
                      </SimpleTooltip>
                    ) : <span className="text-muted-foreground/60">—</span>}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{fmtDate(t.updatedAt)}</TableCell>
                  <TableCell className="text-right">
                    <RowActionsMenu label={t.templatename} onEdit={() => openEdit(t)}
                      onDuplicate={() => { duplicateOrganizerTemplates([t.id]); notify(`Duplicated “${t.templatename}”`); }}
                      extra={[{ label: 'Preview', icon: Eye, onClick: () => setPreview(t) }]}
                      onDelete={() => setConfirm([t])} />
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={8}>
                  {organizerTemplates.length ? (
                    <EmptyState icon={SearchX} title="No organizer templates match your search." description="Try a different template, organizer or section name."
                      action={<Button variant="outline" onClick={() => { setQ(''); setSelectedOnly(false); setPage(1); }}>Clear search</Button>} />
                  ) : (
                    <EmptyState icon={ClipboardList} title="No organizer templates found" description="Create your first organizer template to get started"
                      action={<Button onClick={openNew}><Plus />Create Template</Button>} />
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
          <button type="button" className={barButton} onClick={() => { duplicateOrganizerTemplates([...selection.ids]); notify(`Duplicated ${selection.count} template${selection.count > 1 ? 's' : ''}`); selection.clear(); }}><Copy aria-hidden="true" />Duplicate</button>
          <button type="button" className={barButton} onClick={() => exportCsv(selected)}><Download aria-hidden="true" />Export</button>
          <button type="button" className={barDanger} onClick={() => setConfirm(selected)}><Trash2 aria-hidden="true" />Delete</button>
        </>}
      />

      {preview && <OrganizerPreview organizer={preview} onClose={() => setPreview(null)} />}
      {confirm && (
        <Modal title={confirm.length === 1 ? 'Delete Organizer Template' : `Delete ${confirm.length} organizer templates?`}
          description="Organizers already sent are not affected." onClose={() => setConfirm(null)}
          footer={<><Button variant="outline" onClick={() => setConfirm(null)}>Cancel</Button><Button variant="destructive" onClick={remove}><Trash2 />Delete</Button></>}>
          {confirm.length === 1 ? (
            <p className="text-sm text-muted-foreground">Are you sure you want to delete <span className="font-medium text-foreground">“{confirm[0].templatename}”</span>?</p>
          ) : (
            <ul className="max-h-48 divide-y overflow-y-auto rounded-lg border">
              {confirm.map((t) => (
                <li key={t.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                  <ClipboardList className="size-4 text-muted-foreground" aria-hidden="true" /><span className="truncate font-medium">{t.templatename}</span>
                  <span className="ml-auto flex-none text-xs tabular-nums text-muted-foreground">{questionCount(t)} questions</span>
                </li>
              ))}
            </ul>
          )}
        </Modal>
      )}
    </div>
  );
}
