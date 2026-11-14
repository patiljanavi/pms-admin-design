import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Braces, Building2, Contact, Copy, Download, Mail, Paperclip, Plus, SearchX, Send, Trash2, X } from 'lucide-react';
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
import { EMAIL_MODES, SENDERS, modeLabel } from '../../../data/emailtemplates';
import { Dash, ListHeader, NameCell, PersonCell, SelectFilter, SortHead, Tip, fmtDate, sortRows } from '../templateKit';

const LIST_PATH = '/firmtemp/templates/emails';
const MODE_BADGE = { contacts: 'violet', account: 'info' };
const MODE_ICON = { contacts: Contact, account: Building2 };

/** Firm Templates → Emails: table of email templates. New / Edit open EmailTemplateForm. */
export default function EmailTemplates() {
  const navigate = useNavigate();
  const { state: routeState, pathname } = useLocation();
  const { emailTemplates = [], duplicateEmailTemplates, deleteEmailTemplates } = useData();

  const [q, setQ] = useState('');
  const [mode, setMode] = useState('All');
  const [from, setFrom] = useState('All');
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
    const list = emailTemplates.filter((t) => (mode === 'All' || t.mode === mode)
      && (from === 'All' || t.selectedUser?.value === from)
      && (!selectedOnly || selection.has(t.id))
      && (!s || `${t.templateName} ${t.subject} ${htmlToText(t.emailBody)} ${t.selectedUser?.label || ''}`.toLowerCase().includes(s)));
    return sortRows(list, sort, {
      name: (t) => t.templateName.toLowerCase(),
      from: (t) => t.selectedUser?.label || '',
      updated: (t) => t.updatedAt || '',
    });
  }, [emailTemplates, q, mode, from, selectedOnly, selection, sort]);

  const paging = usePagination(filtered, { initialSize: 10, storageKey: 'email-templates' });
  const { pageItems: rows, setPage } = paging;
  const selected = emailTemplates.filter((t) => selection.has(t.id));
  const filtersOn = q || mode !== 'All' || from !== 'All';
  const reset = () => { setQ(''); setMode('All'); setFrom('All'); setSelectedOnly(false); setPage(1); };
  const openNew = () => navigate(`${LIST_PATH}/new`);
  const openEdit = (t) => navigate(`${LIST_PATH}/${t.id}`);

  const remove = () => {
    const ids = confirm.map((t) => t.id);
    deleteEmailTemplates(ids); selection.setMany(ids, false); setConfirm(null);
    notify(`Deleted ${ids.length} template${ids.length > 1 ? 's' : ''}`);
  };
  const exportCsv = (items) => {
    downloadCsv('email-templates.csv', [['Name', 'Mode', 'From', 'Subject', 'Body', 'Attachments', 'Updated'],
      ...items.map((t) => [t.templateName, modeLabel(t.mode), t.selectedUser?.label || '', t.subject, htmlToText(t.emailBody), (t.files || []).map((f) => f.name).join('; '), t.updatedAt])]);
    notify(`Exported ${items.length} templates`);
  };

  const withFiles = emailTemplates.filter((t) => t.files?.length).length;

  return (
    <div className="flex flex-col gap-6">
      <ListHeader
        title="Email templates"
        description="Emails your team sends often, with shortcodes filled in for each contact or account."
        actions={<>
          <Button onClick={openNew} aria-label="+ New email template"><Plus />New email template</Button>
        </>}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard label="Total templates" value={emailTemplates.length} icon={Mail}
          hint={`${new Set(emailTemplates.map((t) => t.selectedUser?.value).filter(Boolean)).size} senders`} />
        {EMAIL_MODES.map((m) => (
          <StatCard key={m.value} label={m.label} value={emailTemplates.filter((t) => t.mode === m.value).length} icon={MODE_ICON[m.value]}
            tone={m.value === 'account' ? 'brand' : 'default'} active={mode === m.value}
            hint={mode === m.value ? 'Showing only these · click to clear' : 'Click to filter'}
            onClick={() => { setMode((cur) => (cur === m.value ? 'All' : m.value)); setPage(1); }} />
        ))}
        <StatCard label="With attachments" value={withFiles} icon={Paperclip}
          hint={`${Math.round((withFiles / Math.max(emailTemplates.length, 1)) * 100)}% of templates`} />
      </div>

      <DataCard
        toolbar={<>
          <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} label="Search email templates"
            placeholder="Search name, subject, body, sender…" className="h-8 w-full sm:w-72" />
          <SelectFilter label="Mode" icon={Braces} value={mode} onChange={(v) => { setMode(v); setPage(1); }}
            options={[{ value: 'All', label: 'All' }, ...EMAIL_MODES]} />
          <SelectFilter label="From" icon={Send} value={from} onChange={(v) => { setFrom(v); setPage(1); }}
            options={[{ value: 'All', label: 'All' }, ...SENDERS]} />
          {filtersOn ? <Button variant="ghost" size="sm" onClick={reset} className="text-muted-foreground">Reset<X /></Button> : null}
          <span className="ml-auto hidden text-sm tabular-nums text-muted-foreground md:inline">{filtered.length} of {emailTemplates.length}</span>
        </>}
        footer={filtered.length > 0 && <Pagination {...paging} label="templates" />}
      >
         <BulkBar count={selection.count} total={filtered.length}
        onSelectAll={() => selection.setMany(filtered.map((t) => t.id), true)} onClear={selection.clear}
        filters={<SelectedOnlyFilter checked={selectedOnly} onChange={(v) => { setSelectedOnly(v); setPage(1); }} />}
        actions={<>
          <button type="button" className={barButton} onClick={() => { duplicateEmailTemplates([...selection.ids]); notify(`Duplicated ${selection.count} template${selection.count > 1 ? 's' : ''}`); selection.clear(); }}><Copy aria-hidden="true" />Duplicate</button>
          <button type="button" className={barButton} onClick={() => exportCsv(selected)}><Download aria-hidden="true" />Export</button>
          <button type="button" className={barDanger} onClick={() => setConfirm(selected)}><Trash2 aria-hidden="true" />Delete</button>
        </>}
      />
        <Table className="min-w-[980px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"><HeaderCheckbox selection={selection} pageIds={rows.map((t) => t.id)} /></TableHead>
              <SortHead label="Template" col="name" sort={sort} setSort={setSort} />
              <TableHead>Mode</TableHead>
              <SortHead label="From" col="from" sort={sort} setSort={setSort} />
              <TableHead>Subject</TableHead>
              <TableHead>Attachments</TableHead>
              <SortHead label="Updated" col="updated" sort={sort} setSort={setSort} />
              <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((t) => {
              const checked = selection.has(t.id);
              const files = t.files || [];
              return (
                <TableRow key={t.id} data-state={checked ? 'selected' : undefined}>
                  <TableCell><SelectCheckbox label={`Select ${t.templateName}`} checked={checked} onChange={() => selection.toggle(t.id)} /></TableCell>
                  <TableCell className="max-w-[280px]">
                    <NameCell icon={Mail} name={t.templateName} preview={t.emailBody ? htmlToText(t.emailBody) : ''} onOpen={() => openEdit(t)} />
                  </TableCell>
                  <TableCell><Badge variant={MODE_BADGE[t.mode] || 'neutral'}>{modeLabel(t.mode)}</Badge></TableCell>
                  <TableCell><PersonCell name={t.selectedUser?.label} /></TableCell>
                  <TableCell className="max-w-[280px] truncate text-sm text-muted-foreground">{t.subject || <Dash />}</TableCell>
                  <TableCell className="text-sm">
                    {files.length ? (
                      <Tip label={files.map((f) => f.name).join(', ')}>
                        <span className="inline-flex items-center gap-1 rounded-md border bg-muted px-1.5 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
                          <Paperclip className="size-3" aria-hidden="true" />{files.length}
                        </span>
                      </Tip>
                    ) : <Dash />}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{fmtDate(t.updatedAt)}</TableCell>
                  <TableCell className="text-right">
                    {/* <button onClick={() => openEdit(t)} aria-label={`Edit ${t.templateName}`} className="flex h-9 w-9 items-center justify-center rounded text-muted-foreground hover:bg-subtle hover:text-ink"><FiEdit2 aria-hidden="true" /></button>
                    <button onClick={() => { duplicateEmailTemplates([t.id]); notify(`Duplicated “${t.templateName}”`); }} aria-label={`Duplicate ${t.templateName}`} className="flex h-9 w-9 items-center justify-center rounded text-muted-foreground hover:bg-subtle hover:text-ink"><FiCopy aria-hidden="true" /></button>
                    <button onClick={() => setConfirm([t])} aria-label={`Delete ${t.templateName}`} className="flex h-9 w-9 items-center justify-center rounded text-danger-700 hover:bg-danger-50"><FiTrash2 aria-hidden="true" /></button> */}
                    <RowActionsMenu label={t.templateName} onEdit={() => openEdit(t)}
                      onDuplicate={() => { duplicateEmailTemplates([t.id]); notify(`Duplicated “${t.templateName}”`); }}
                      onDelete={() => setConfirm([t])} />
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={8}>
                  {emailTemplates.length ? (
                    <EmptyState icon={SearchX} title="No email templates match" description="Try a different search or remove some filters."
                      action={<Button variant="outline" onClick={reset}>Clear filters</Button>} />
                  ) : (
                    <EmptyState icon={Mail} title="No email templates yet" description="Save the emails your team sends most, with shortcodes for names, companies and dates."
                      action={<Button onClick={openNew}><Plus />New email template</Button>} />
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </DataCard>

     

      {confirm && (
        <Modal title={confirm.length === 1 ? `Delete “${confirm[0].templateName}”?` : `Delete ${confirm.length} templates?`}
          description={`Emails already sent from ${confirm.length === 1 ? 'this template' : 'these templates'} are not affected.`}
          onClose={() => setConfirm(null)}
          footer={<><Button variant="outline" onClick={() => setConfirm(null)}>Cancel</Button><Button variant="destructive" onClick={remove}>Delete</Button></>}>
          <ul className="max-h-48 divide-y overflow-y-auto rounded-lg border">
            {confirm.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <span className="truncate font-medium">{t.templateName}</span>
                <span className="truncate text-muted-foreground">{t.subject}</span>
              </li>
            ))}
          </ul>
        </Modal>
      )}
      <ToastBridge message={toast} />
    </div>
  );
}
