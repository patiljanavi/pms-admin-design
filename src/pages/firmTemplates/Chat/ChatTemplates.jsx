import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Copy, Download, ListChecks, MessageSquare, Plus, SearchX, Send, Trash2, Users, X } from 'lucide-react';
import Pagination, { usePagination } from '../../../components/Pagination';
import { htmlToText } from '../../../components/TextEditor';
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
import { SENDERS } from '../../../data/emailtemplates';
import { Dash, ListHeader, NameCell, PersonCell, SelectFilter, SortHead, Tip, fmtDate, sortRows } from '../templateKit';

const LIST_PATH = '/firmtemp/templates/chats';

/** Firm Templates → Chats: table of chat templates. New / Edit open ChatTemplateForm (same as Tasks, Emails, Jobs). */
export default function ChatTemplates() {
  const navigate = useNavigate();
  const { state: routeState, pathname } = useLocation();
  const { chatTemplates = [], duplicateChatTemplates, deleteChatTemplates } = useData();

  const [q, setQ] = useState('');
  const [from, setFrom] = useState('All');
  const [reminders, setReminders] = useState('All');   // All · On · Off
  const [sort, setSort] = useState(null);
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
    const list = chatTemplates.filter((t) => (from === 'All' || t.selecteduser?.value === from)
      && (reminders === 'All' || (reminders === 'On' ? t.sendReminders : !t.sendReminders))
      && (!selectedOnly || selection.has(t.id))
      && (!s || `${t.templateName} ${t.inputText} ${htmlToText(t.description)} ${t.selecteduser?.label || ''}`.toLowerCase().includes(s)));
    return sortRows(list, sort, {
      name: (t) => t.templateName.toLowerCase(),
      from: (t) => t.selecteduser?.label || '',
      updated: (t) => t.updatedAt || '',
    });
  }, [chatTemplates, q, from, reminders, selectedOnly, selection, sort]);

  const paging = usePagination(filtered, { initialSize: 10, storageKey: 'chat-templates' });
  const { pageItems: rows, setPage } = paging;
  const selected = chatTemplates.filter((t) => selection.has(t.id));
  const filtersOn = q || from !== 'All' || reminders !== 'All';
  const reset = () => { setQ(''); setFrom('All'); setReminders('All'); setSelectedOnly(false); setPage(1); };

  if (!duplicateChatTemplates) {
    return <div role="alert" className="rounded-xl border border-danger-100 bg-danger-50 p-6 text-sm font-medium text-danger-700">Chat templates are not set up in DataContext.js</div>;
  }

  const openNew = () => navigate(`${LIST_PATH}/new`);
  const openEdit = (t) => navigate(`${LIST_PATH}/${t.id}`);
  const remove = () => {
    const ids = confirm.map((t) => t.id);
    deleteChatTemplates(ids); selection.setMany(ids, false); setConfirm(null);
    notify(`Deleted ${ids.length} template${ids.length > 1 ? 's' : ''}`);
  };
  const exportCsv = (items) => {
    downloadCsv('chat-templates.csv', [['Name', 'From', 'Subject', 'Message', 'Reminders', 'Client tasks', 'Updated'],
      ...items.map((t) => [t.templateName, t.selecteduser?.label || '', t.inputText, htmlToText(t.description),
        t.sendReminders ? `Every ${t.daysuntilNextReminder} days, ${t.noOfReminder} times` : 'Off',
        (t.SubtaskSwitch ? t.subtasks || [] : []).map((s) => s.text).join('; '), t.updatedAt])]);
    notify(`Exported ${items.length} templates`);
  };

  const withReminders = chatTemplates.filter((t) => t.sendReminders).length;

  return (
    <div className="flex flex-col gap-6">
      <ListHeader
        title="Chat templates"
        description="Messages for client chats, with reminders and a checklist of client tasks."
        actions={<>
          <Button onClick={openNew} aria-label="+ New chat template"><Plus />New chat template</Button>
        </>}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard label="Total templates" value={chatTemplates.length} icon={MessageSquare} />
        <StatCard label="With reminders" value={withReminders} icon={Bell} tone="warning" active={reminders === 'On'}
          hint={reminders === 'On' ? 'Showing only these · click to clear' : 'Click to filter'}
          onClick={() => { setReminders((cur) => (cur === 'On' ? 'All' : 'On')); setPage(1); }} />
        <StatCard label="With client tasks" value={chatTemplates.filter((t) => t.SubtaskSwitch && t.subtasks?.length).length} icon={ListChecks} />
        <StatCard label="Senders" value={new Set(chatTemplates.map((t) => t.selecteduser?.value).filter(Boolean)).size} icon={Users} />
      </div>

      <DataCard
        toolbar={<>
          <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} label="Search chat templates"
            placeholder="Search name, subject, message, sender…" className="h-8 w-full sm:w-72" />
          <SelectFilter label="From" icon={Send} value={from} onChange={(v) => { setFrom(v); setPage(1); }}
            options={[{ value: 'All', label: 'All' }, ...SENDERS]} />
          <SelectFilter label="Reminders" icon={Bell} value={reminders} onChange={(v) => { setReminders(v); setPage(1); }} options={['All', 'On', 'Off']} />
          {filtersOn ? <Button variant="ghost" size="sm" onClick={reset} className="text-muted-foreground">Reset<X /></Button> : null}
          <span className="ml-auto hidden text-sm tabular-nums text-muted-foreground md:inline">{filtered.length} of {chatTemplates.length}</span>
        </>}
        footer={filtered.length > 0 && <Pagination {...paging} label="templates" />}
      >
        <Table className="min-w-[1000px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"><HeaderCheckbox selection={selection} pageIds={rows.map((t) => t.id)} /></TableHead>
              <SortHead label="Template" col="name" sort={sort} setSort={setSort} />
              <SortHead label="From" col="from" sort={sort} setSort={setSort} />
              <TableHead>Subject</TableHead>
              <TableHead>Reminders</TableHead>
              <TableHead>Client tasks</TableHead>
              <SortHead label="Updated" col="updated" sort={sort} setSort={setSort} />
              <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((t) => {
              const checked = selection.has(t.id);
              const tasks = t.SubtaskSwitch ? (t.subtasks || []) : [];
              return (
                <TableRow key={t.id} data-state={checked ? 'selected' : undefined}>
                  <TableCell><SelectCheckbox label={`Select ${t.templateName}`} checked={checked} onChange={() => selection.toggle(t.id)} /></TableCell>
                  <TableCell className="max-w-[280px]">
                    <NameCell icon={MessageSquare} name={t.templateName} preview={t.description ? htmlToText(t.description) : ''} onOpen={() => openEdit(t)} />
                  </TableCell>
                  <TableCell><PersonCell name={t.selecteduser?.label} /></TableCell>
                  <TableCell className="max-w-[260px] truncate text-sm text-muted-foreground">{t.inputText || <Dash />}</TableCell>
                  <TableCell>
                    {t.sendReminders ? (
                      <Tip label={`Every ${t.daysuntilNextReminder} days, up to ${t.noOfReminder} times`}>
                        <span className="inline-flex"><Badge variant="warning"><Bell />Every {t.daysuntilNextReminder}d · {t.noOfReminder}×</Badge></span>
                      </Tip>
                    ) : <Badge variant="neutral">Off</Badge>}
                  </TableCell>
                  <TableCell className="text-sm">
                    {tasks.length ? (
                      <Tip label={tasks.map((s) => s.text).join(', ')}>
                        <span className="inline-flex items-center gap-1.5 whitespace-nowrap"><ListChecks className="size-3.5 text-muted-foreground" aria-hidden="true" />{tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}</span>
                      </Tip>
                    ) : <Dash />}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{fmtDate(t.updatedAt)}</TableCell>
                  <TableCell className="text-right">
                    <RowActionsMenu label={t.templateName} onEdit={() => openEdit(t)}
                      onDuplicate={() => { duplicateChatTemplates([t.id]); notify(`Duplicated “${t.templateName}”`); }}
                      onDelete={() => setConfirm([t])} />
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={8}>
                  {chatTemplates.length ? (
                    <EmptyState icon={SearchX} title="No chat templates match" description="Try a different search or remove some filters."
                      action={<Button variant="outline" onClick={reset}>Clear filters</Button>} />
                  ) : (
                    <EmptyState icon={MessageSquare} title="No chat templates yet" description="Save messages you send clients often, with automatic reminders and a task checklist."
                      action={<Button onClick={openNew}><Plus />New chat template</Button>} />
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
          <button type="button" className={barButton} onClick={() => { duplicateChatTemplates([...selection.ids]); notify(`Duplicated ${selection.count} template${selection.count > 1 ? 's' : ''}`); selection.clear(); }}><Copy aria-hidden="true" />Duplicate</button>
          <button type="button" className={barButton} onClick={() => exportCsv(selected)}><Download aria-hidden="true" />Export</button>
          <button type="button" className={barDanger} onClick={() => setConfirm(selected)}><Trash2 aria-hidden="true" />Delete</button>
        </>}
      />

      {confirm && (
        <Modal title={confirm.length === 1 ? `Delete “${confirm[0].templateName}”?` : `Delete ${confirm.length} templates?`}
          description={`Chats already sent from ${confirm.length === 1 ? 'this template' : 'these templates'} are not affected.`}
          onClose={() => setConfirm(null)}
          footer={<><Button variant="outline" onClick={() => setConfirm(null)}>Cancel</Button><Button variant="destructive" onClick={remove}>Delete</Button></>}>
          <ul className="max-h-48 divide-y overflow-y-auto rounded-lg border">
            {confirm.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <span className="truncate font-medium">{t.templateName}</span>
                <span className="truncate text-muted-foreground">{t.inputText}</span>
              </li>
            ))}
          </ul>
        </Modal>
      )}
      <ToastBridge message={toast} />
    </div>
  );
}
