import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import {
  Activity, ArrowUpRight, CheckCircle2, ClipboardList, Copy, Eye, FileSignature, FileText, Folder, Mail, NotebookPen,
  Plus, RotateCcw, Send, Settings2, Star, Tag, Trash2, UserRoundX, Users,
} from 'lucide-react';
import FolderExplorer from '../../components/folders/FolderExplorer';
import TagChip from '../../components/TagChip';
import { Avatar, Modal, Segmented, StatusBadge, initials } from '../../components/ui';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { SimpleTooltip } from '../../components/ui/tooltip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { EmptyState, StatCard } from '../../components/page';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { accountTabPath } from '../../config';
import { countItems, defaultTree, mergeFolderTree } from '../../data/folderTemplates';
import { htmlToText } from '../../components/TextEditor';
import { chatFromForm, contactName, demoChats, primaryContact } from '../../data/accountChats';
import ChatsView from '../../components/chat/ChatsView';
import CreateOrganizerDrawer from '../../components/organizer/CreateOrganizerDrawer';
import OrganizerPreview from '../../components/organizer/OrganizerPreview';
import RowActionsMenu from '../../components/RowActionsMenu';
import { demoOrganizers, organizerFromForm, organizerQuestions } from '../../data/accountOrganizers';
import { PROPOSAL_STATUS, demoProposals, newProposalId, proposalDisplayName } from '../../data/accountProposals';
import { money } from '../../data/invoiceTemplates';
import { proposalTotal } from '../../data/proposalTemplates';
import NewChatDrawer from '../../components/chat/NewChatDrawer';
import { ToastBridge, toast } from '../../components/ui/sonner';
import { cn } from 'lib/utils';

const fmtDate = (d) => (d ? new Date(d.length === 10 ? `${d}T00:00:00` : d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—');
const contactsOf = (a) => (a.contacts?.length ? a.contacts : a.email ? [{ name: a.name, email: a.email }] : []);
const PROPOSAL_BADGE = { draft: 'neutral', sent: 'info', signed: 'success' };
const Dash = () => <span className="text-muted-foreground/60">—</span>;

/** Card with an optional header (title · description · action). */
function Card({ title, description, action, children, className, bodyClassName }) {
  return (
    <section className={cn('overflow-hidden rounded-xl border bg-card shadow-card', className)}>
      {(title || action) && (
        <header className="flex flex-wrap items-start justify-between gap-3 px-5 pb-3 pt-4">
          <div className="min-w-0">
            {title && <h2 className="section-title">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={cn('px-5 pb-5', !(title || action) && 'pt-5', bodyClassName)}>{children}</div>
    </section>
  );
}

/** Header for list-style cards (Organizers, Proposals): title + description on the left, actions on the right. */
function ListHeader({ title, description, children }) {
  return (
    <header className="flex flex-wrap items-center gap-3 border-b px-5 py-4">
      <div className="min-w-0 flex-1">
        <h2 className="section-title">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </header>
  );
}

/** Label/value row inside a details list. */
function Detail({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="flex-none text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right text-sm font-medium">{children}</dd>
    </div>
  );
}

/* ---------- Overview ---------- */
export function AccountOverview() {
  const { account } = useOutletContext();
  const { tagById = new Map() } = useData();
  const docs = countItems(account.documents || defaultTree());
  const contacts = contactsOf(account);
  const tags = (account.tags || []).map((id) => tagById.get(id)).filter(Boolean);
  const stats = [
    ['Contacts', contacts.length, Users],
    ['Tags', (account.tags || []).length, Tag],
    ['Documents', docs.files, Folder],
    ['Notes', (account.notes || []).length, FileText],
  ];
  const quick = [
    ['docs', 'Documents', `${docs.folders} folders · ${docs.files} files`, Folder],
    ['organizers', 'Organizers', 'Questionnaires the client fills in', ClipboardList],
    ['invoices', 'Invoices', 'Bills sent to this account', FileText],
    ['proposals', 'Proposals', 'Engagement letters and proposals', FileSignature],
    ['workflow', 'Workflow', 'Jobs moving through your pipelines', Activity],
    ['notes', 'Notes', `${(account.notes || []).length || 'Private'} notes for your team`, NotebookPen],
  ];
  return (
    <div className="flex flex-col gap-6">
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      {stats.map(([label, n, Icon]) => <StatCard key={label} label={label} value={n} icon={Icon} />)}
    </div>
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="flex min-w-0 flex-col gap-6">
        <Card title="Jump to" description="Everything you keep for this client, one click away.">
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {quick.map(([key, label, desc, Icon]) => (
              <li key={key}>
                <Link to={accountTabPath(key, account.id)}
                  className="group flex h-full items-start gap-3 rounded-lg border bg-card p-4 transition-[border-color,box-shadow,background-color] hover:border-line-strong hover:bg-accent/40 hover:shadow-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
                  <span className="inline-flex size-9 flex-none items-center justify-center rounded-lg border bg-subtle text-muted-foreground transition-colors group-hover:text-foreground" aria-hidden="true"><Icon className="size-4" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-foreground">{label}</span>
                    <span className="block truncate text-sm text-muted-foreground">{desc}</span>
                  </span>
                  <ArrowUpRight className="size-4 flex-none text-muted-foreground/60 transition-[color,transform] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="People" description={`${contacts.length} contact${contacts.length === 1 ? '' : 's'}`}
          action={<Button variant="ghost" size="sm" asChild><Link to={accountTabPath('info', account.id)}>View all</Link></Button>}>
          {contacts.length ? (
            <ul className="-mx-2 flex flex-col">
              {contacts.slice(0, 4).map((c, i) => (
                <li key={c.id || c.email || i} className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-accent/50">
                  <Avatar text={initials(contactName(c) || c.email)} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 truncate text-sm font-medium">{contactName(c) || c.email || '—'}{c.primary && <Badge variant="neutral">Primary</Badge>}</span>
                    {c.email && <span className="block truncate text-xs text-muted-foreground">{c.email}</span>}
                  </span>
                  {c.email && (
                    <SimpleTooltip label={`Email ${contactName(c) || c.email}`}>
                      <Button variant="ghost" size="icon-xs" asChild><a href={`mailto:${c.email}`} aria-label={`Email ${contactName(c) || c.email}`}><Mail /></a></Button>
                    </SimpleTooltip>
                  )}
                </li>
              ))}
            </ul>
          ) : <EmptyState compact icon={Users} title="No contacts yet" description="Contacts added to this account show here." />}
        </Card>
      </div>

      <Card title="About">
        <dl className="-mt-1 divide-y">
          <Detail label="Company">{account.company || <Dash />}</Detail>
          <Detail label="Plan">{account.plan || <Dash />}</Detail>
          <Detail label="Status">{account.status ? <StatusBadge value={account.status} /> : <Dash />}</Detail>
          <Detail label="Client since">{fmtDate(account.joined)}</Detail>
          <Detail label="Tags">
            {tags.length ? <span className="flex flex-wrap justify-end gap-1">{tags.map((t) => <TagChip key={t.value} tag={t} size="xs" />)}</span> : <Dash />}
          </Detail>
          <Detail label="Team">
            {(account.team || []).length ? (
              <SimpleTooltip label={account.team.join(', ')}>
                <span className="inline-flex -space-x-1.5">{account.team.slice(0, 5).map((m) => <span key={m} className="rounded-full ring-2 ring-card"><Avatar text={initials(m)} size="xs" /></span>)}</span>
              </SimpleTooltip>
            ) : <span className="inline-flex items-center gap-1.5 font-normal text-muted-foreground"><UserRoundX className="size-3.5" />Unassigned</span>}
          </Detail>
        </dl>
      </Card>
    </div>
    </div>
  );
}

/* ---------- Info ---------- */
export function AccountInfo() {
  const { account } = useOutletContext();
  const rows = [['Account name', account.name], ['Company', account.company], ['Email', account.email], ['Plan', account.plan], ['Status', account.status], ['Role', account.role], ['Client since', fmtDate(account.joined)], ['Account ID', account.id]];
  const contacts = contactsOf(account);
  const copyId = () => {
    try { navigator.clipboard?.writeText(String(account.id)); toast.success('Account ID copied'); } catch { toast.error("Couldn't copy the account ID"); }
  };
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <Card title="Account details" description="Core information about this client.">
        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          {rows.map(([k, v]) => (
            <div key={k} className="min-w-0">
              <dt className="text-xs font-medium text-muted-foreground">{k}</dt>
              <dd className="mt-1 flex min-w-0 items-center gap-1.5 break-words text-sm font-medium">
                {k === 'Status' && v ? <StatusBadge value={v} />
                  : k === 'Email' && v ? <a href={`mailto:${v}`} className="truncate text-primary hover:underline">{v}</a>
                    : k === 'Account ID' ? (
                      <>
                        <code className="truncate rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{v}</code>
                        <SimpleTooltip label="Copy ID"><Button variant="ghost" size="icon-xs" onClick={copyId} aria-label="Copy account ID"><Copy /></Button></SimpleTooltip>
                      </>
                    ) : v || <Dash />}
              </dd>
            </div>
          ))}
        </dl>
      </Card>
      <Card title="Contacts" description={`${contacts.length} ${contacts.length === 1 ? 'person' : 'people'} at this account`}>
        {contacts.length ? (
          <ul className="-mx-2 flex flex-col">
            {contacts.map((c, i) => (
              <li key={c.id || c.email || i} className="flex items-center gap-3 rounded-md px-2 py-2.5 hover:bg-accent/50">
                <Avatar text={initials(contactName(c) || c.email)} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 truncate text-sm font-medium">{contactName(c) || '—'}{c.primary && <Badge variant="info"><Star />Primary</Badge>}</div>
                  {c.email && <a href={`mailto:${c.email}`} className="block truncate text-sm text-muted-foreground hover:text-primary hover:underline">{c.email}</a>}
                </div>
              </li>
            ))}
          </ul>
        ) : <EmptyState compact icon={Users} title="No contacts yet" description="Add contacts from the account's edit drawer." />}
      </Card>
      <Card title="Team members" description="Who in your firm looks after this account." className="xl:col-span-2">
        {(account.team || []).length ? (
          <ul className="flex flex-wrap gap-2">
            {account.team.map((m) => (
              <li key={m} className="flex items-center gap-2 rounded-full border bg-card py-1 pl-1 pr-3 text-sm font-medium shadow-xs"><Avatar text={initials(m)} size="sm" />{m}</li>
            ))}
          </ul>
        ) : <EmptyState compact icon={UserRoundX} title="No team members assigned" description="Assign people from the Accounts list or the edit drawer." />}
      </Card>
    </div>
  );
}

/* ---------- Documents (folder explorer, starts with the 3 default folders) ---------- */
/** Add a folder template's folders and files into the account's folders (matching folders by name). */
export function AccountDocuments() {
  const { account, updateAccount } = useOutletContext();
  const { folderTemplates = [] } = useData();
  const [pick, setPick] = useState('');
  const [note, setNote] = useState('');
  const items = account.documents || defaultTree();
  const counts = countItems(items);
  const apply = () => {
    const tpl = folderTemplates.find((t) => t.id === pick);
    if (!tpl) return;
    updateAccount({ documents: mergeFolderTree(items, tpl.items) });
    setNote(`Applied “${tpl.templatename}”`); setPick('');
    setTimeout(() => setNote(''), 2400);
  };
  return (
    <section className="overflow-hidden rounded-xl border bg-card shadow-card" aria-label="Documents">
      <header className="flex flex-wrap items-center gap-3 border-b px-5 py-4">
        <div className="min-w-0 flex-1">
          <h2 className="section-title">Documents</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{counts.folders} folders · {counts.files} files shared with {account.name}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={pick} onValueChange={setPick} disabled={!folderTemplates.length}>
            <SelectTrigger className="h-8 w-[220px]" aria-label="Apply folder template">
              <SelectValue placeholder="Apply folder template…" />
            </SelectTrigger>
            <SelectContent>
              {folderTemplates.map((t) => <SelectItem key={t.id} value={t.id}>{t.templatename}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" disabled={!pick} onClick={apply}>Apply</Button>
          {note && <span role="status" className="inline-flex items-center gap-1.5 text-sm font-medium text-success-700"><CheckCircle2 className="size-4" aria-hidden="true" />{note}</span>}
        </div>
      </header>
      <FolderExplorer items={items} onChange={(next) => updateAccount({ documents: next })} />
    </section>
  );
}

/* ---------- Notes (own file: AccountNotes.jsx) ---------- */
export { default as AccountNotes } from './AccountNotes';

/* ---------- Tabs that list related templates (starting pages) ---------- */
function TemplateTab({ icon: Icon, title, empty, templates, templatesLink, nameOf, describe, sent = [] }) {
  const { account } = useOutletContext();
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <Card title={title} description={sent.length ? `${sent.length} sent to ${account.name}` : undefined} bodyClassName={sent.length ? 'px-0 pb-0' : undefined}>
        {sent.length ? (
          <ul aria-label={`Sent ${title.toLowerCase()}`} className="divide-y border-t">
            {sent.map((it) => (
              <li key={it.id} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/40">
                <span className="inline-flex size-8 flex-none items-center justify-center rounded-lg border bg-subtle text-muted-foreground" aria-hidden="true"><Icon className="size-4" /></span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{it.title}</div>
                  {it.subtitle && <div className="truncate text-xs text-muted-foreground">{it.subtitle}</div>}
                </div>
                {it.badge && <Badge variant={it.badge.variant} dot>{it.badge.label}</Badge>}
                <span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">{fmtDate(it.date)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-lg border border-dashed bg-subtle/50">
            <EmptyState icon={Icon} title={empty.replace('{name}', account.name)} description={`${title} sent to this account will show here.`} />
          </div>
        )}
      </Card>
      <Card title="Available templates" description={`${templates.length} template${templates.length === 1 ? '' : 's'}`}
        action={templatesLink && <Button variant="ghost" size="sm" asChild><Link to={templatesLink}><Settings2 />Manage</Link></Button>}>
        {templates.length ? (
          <ul className="-mx-2 flex flex-col">
            {templates.slice(0, 8).map((t) => (
              <li key={t.id} className="rounded-md px-2 py-2 hover:bg-accent/50">
                <div className="truncate text-sm font-medium">{nameOf(t)}</div>
                {describe && <div className="truncate text-xs text-muted-foreground">{describe(t) || '—'}</div>}
              </li>
            ))}
          </ul>
        ) : <EmptyState compact icon={Icon} title="No templates yet" description="Create one in Firm Templates to reuse it here." />}
        {templates.length > 8 && <p className="mt-2 text-xs text-muted-foreground">+{templates.length - 8} more</p>}
      </Card>
    </div>
  );
}
export function AccountCommunication() {
  const { account } = useOutletContext();
  const { setAccounts } = useData();
  const { user } = useAuth() || {};
  const [drawer, setDrawer] = useState(false);
  const [note, setNote] = useState('');
  const chats = account.chats ?? demoChats(account);
  const me = user?.name || 'You';

  // save chats on the account (and on other accounts chosen in New Chat)
  const saveChats = (next) => setAccounts((list) => list.map((a) => (a.id === account.id ? { ...a, chats: next } : a)));
  const createChats = (accountIds, form) => {
    setAccounts((list) => list.map((a) => (accountIds.includes(a.id) ? { ...a, chats: [chatFromForm(form, a, me), ...(a.chats ?? demoChats(a))] } : a)));
    setDrawer(false);
    setNote(accountIds.length > 1 ? `Created ${accountIds.length} chats` : 'Chat created');
    setTimeout(() => setNote(''), 2400);
  };
  return (
    <>
      <ChatsView chats={chats} onChange={saveChats} onNew={() => setDrawer(true)} me={me} clientName={contactName(primaryContact(account)) || account.name} />
      {drawer && <NewChatDrawer defaultAccountIds={[account.id]} onClose={() => setDrawer(false)} onCreate={createChats} />}
      <ToastBridge message={note} />
    </>
  );
}
export function AccountOrganizers() {
  const { account } = useOutletContext();
  const { setAccounts, organizerTemplates = [] } = useData();
  const [drawer, setDrawer] = useState(false);
  const [preview, setPreview] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [filter, setFilter] = useState('active');
  const [note, setNote] = useState('');
  const organizers = account.organizers ?? demoOrganizers(account, organizerTemplates);
  const shown = organizers.filter((o) => (filter === 'completed' ? o.status === 'completed' : o.status !== 'completed'));
  const countOf = (k) => organizers.filter((o) => (k === 'completed' ? o.status === 'completed' : o.status !== 'completed')).length;
  const notify = (m) => { setNote(m); setTimeout(() => setNote(''), 2400); };

  const save = (next) => setAccounts((list) => list.map((a) => (a.id === account.id ? { ...a, organizers: next } : a)));
  const setStatus = (o, status) => { save(organizers.map((x) => (x.id === o.id ? { ...x, status } : x))); notify(status === 'completed' ? `Marked “${o.organizerName}” as completed` : `Reopened “${o.organizerName}”`); };
  const create = (accountIds, form, template) => {
    setAccounts((list) => list.map((a) => (accountIds.includes(a.id)
      ? { ...a, organizers: [organizerFromForm(form, a, template), ...(a.organizers ?? demoOrganizers(a, organizerTemplates))] } : a)));
    setDrawer(false); setFilter('active');
    notify(accountIds.length > 1 ? `Created ${accountIds.length} organizers` : 'Organizer created');
  };

  return (
    <section className="overflow-hidden rounded-xl border bg-card shadow-card" aria-label="Organizers">
      <ListHeader title="Organizers" description={`Questionnaires sent to ${account.name}`}>
        <Segmented label="Organizer lists" size="sm" value={filter} onChange={setFilter}
          options={[['active', 'Active'], ['completed', 'Completed']].map(([k, l]) => ({
            value: k, label: <>{l}<span className="text-xs tabular-nums text-muted-foreground">{countOf(k)}</span></>,
          }))} />
        <Button size="sm" onClick={() => setDrawer(true)}><Plus />Create organizer</Button>
      </ListHeader>

      {shown.length > 0 ? (
        <Table className="min-w-[760px]">
          <TableHeader>
            <TableRow>
              <TableHead>Organizer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Questions</TableHead>
              <TableHead>Reminders</TableHead>
              <TableHead>Sent</TableHead>
              <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.map((o) => (
              <TableRow key={o.id}>
                <TableCell>
                  <button type="button" onClick={() => setPreview(o)} className="text-left font-medium text-foreground underline-offset-4 hover:underline">{o.organizerName}</button>
                  <div className="text-xs text-muted-foreground">From “{o.templatename}”</div>
                </TableCell>
                <TableCell>{o.status === 'completed'
                  ? <Badge variant="success" dot>Completed</Badge>
                  : <Badge variant="info" dot>Waiting for client</Badge>}</TableCell>
                <TableCell className="text-muted-foreground">{o.sections.length} sections · {organizerQuestions(o)} questions</TableCell>
                <TableCell className="text-muted-foreground">{o.reminders?.enabled ? `Every ${o.reminders.days} days · ${o.reminders.count}×` : <span className="text-muted-foreground/70">Off</span>}</TableCell>
                <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">{fmtDate(o.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <RowActionsMenu label={o.organizerName}
                    extra={[
                      { label: 'Preview', icon: Eye, onClick: () => setPreview(o) },
                      o.status === 'completed'
                        ? { label: 'Reopen', icon: RotateCcw, onClick: () => setStatus(o, 'active') }
                        : { label: 'Mark as completed', icon: CheckCircle2, onClick: () => setStatus(o, 'completed') },
                    ]}
                    onDelete={() => setConfirm(o)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : filter === 'completed' ? (
        <EmptyState icon={CheckCircle2} title="No completed organizers yet" description="Organizers the client has finished will move here." />
      ) : (
        <EmptyState icon={ClipboardList} title={`No organizers sent to ${account.name} yet`} description="Send a questionnaire to collect the information you need from this client."
          action={<Button onClick={() => setDrawer(true)}><Plus />Create organizer</Button>} />
      )}

      {drawer && <CreateOrganizerDrawer defaultAccountIds={[account.id]} onClose={() => setDrawer(false)} onCreate={create} />}
      {preview && <OrganizerPreview organizer={preview} onClose={() => setPreview(null)} />}
      {confirm && (
        <Modal title={`Delete “${confirm.organizerName}”?`} description="The client will no longer see this organizer or its answers." onClose={() => setConfirm(null)}
          footer={<><Button variant="outline" onClick={() => setConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { save(organizers.filter((x) => x.id !== confirm.id)); setConfirm(null); notify('Organizer deleted'); }}><Trash2 />Delete organizer</Button></>}>
          <p className="text-sm text-muted-foreground">This can't be undone.</p>
        </Modal>
      )}
      <ToastBridge message={note} />
    </section>
  );
}
export function AccountInvoices() {
  const { invoiceTemplates = [] } = useData();
  const { account } = useOutletContext();
  const sent = (account.invoices || []).map((i) => ({
    id: i.id, title: i.name, subtitle: money(i.total), date: i.sentAt,
    badge: i.status === 'paid' ? { label: 'Paid', variant: 'success' } : { label: 'Sent', variant: 'info' },
  }));
  return <TemplateTab sent={sent} icon={FileText} title="Invoices" empty="No invoices for {name} yet." templates={invoiceTemplates} templatesLink="/firmtemp/templates/invoices" nameOf={(t) => t.templatename} describe={(t) => t.description} />;
}
export function AccountEmail() {
  const { emailTemplates = [] } = useData();
  const { account } = useOutletContext();
  const sent = (account.emails || []).map((e) => ({ id: e.id, title: e.subject, subtitle: `From ${e.from}${e.reminders ? ` · reminds every ${e.reminders.days} days` : ''}`, date: e.sentAt }));
  return <TemplateTab sent={sent} icon={Mail} title="Email" empty="No emails sent to {name} yet." templates={emailTemplates} templatesLink="/firmtemp/templates/emails" nameOf={(t) => t.templateName} describe={(t) => t.subject || htmlToText(t.emailBody || '')} />;
}
export function AccountProposals() {
  const { account } = useOutletContext();
  const { setAccounts, proposalTemplates = [] } = useData();
  const [confirm, setConfirm] = useState(null);
  const [note, setNote] = useState('');
  const navigate = useNavigate();
  const { state: routeState, pathname } = useLocation();
  const proposals = account.proposals ?? demoProposals(account, proposalTemplates);
  const notify = (m) => { setNote(m); setTimeout(() => setNote(''), 2400); };
  // message from the create / edit page ("Proposal sent: …")
  useEffect(() => {
    if (routeState?.toast) { notify(routeState.toast); navigate(pathname, { replace: true, state: null }); }
  }, [routeState]); // eslint-disable-line react-hooks/exhaustive-deps

  const base = accountTabPath('proposals', account.id);
  const openNew = () => navigate(`${base}/new`);                 // create page
  const openEdit = (p) => navigate(`${base}/${p.id}`);           // edit page
  const save = (next) => setAccounts((list) => list.map((a) => (a.id === account.id ? { ...a, proposals: next } : a)));
  const setStatus = (p, status) => { save(proposals.map((x) => (x.id === p.id ? { ...x, status, updatedAt: new Date().toISOString() } : x))); notify(status === 'signed' ? 'Marked as signed' : 'Proposal sent'); };
  const duplicate = (p) => {
    const copy = { ...JSON.parse(JSON.stringify(p)), id: newProposalId(), status: 'draft', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    copy.general.proposalName = `${p.general.proposalName} (copy)`;
    save([copy, ...proposals]); notify('Proposal duplicated');
  };

  return (
    <section className="overflow-hidden rounded-xl border bg-card shadow-card" aria-label="Proposals">
      <ListHeader title="Proposals" description={`Proposals and engagement letters for ${account.name}`}>
        <Button size="sm" onClick={openNew}><Plus />Create proposal</Button>
      </ListHeader>
      {proposals.length > 0 ? (
        <Table className="min-w-[780px]">
          <TableHeader>
            <TableRow>
              <TableHead>Proposal</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Billing</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {proposals.map((p) => {
              const name = proposalDisplayName(p, account);
              const st = PROPOSAL_STATUS[p.status] || PROPOSAL_STATUS.draft;
              const tpl = proposalTemplates.find((t) => t.id === p.general.templateId);
              return (
                <TableRow key={p.id}>
                  <TableCell>
                    <button type="button" onClick={() => openEdit(p)} className="text-left font-medium text-foreground underline-offset-4 hover:underline">{name}</button>
                    <div className="text-xs text-muted-foreground">{tpl ? `From “${tpl.general.templateName}”` : 'No template'}</div>
                  </TableCell>
                  <TableCell><Badge variant={PROPOSAL_BADGE[p.status] || 'neutral'} dot>{st.label}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{!p.general.servicesEnabled ? <Dash /> : p.services.option === 'invoice' ? `${p.services.invoices.length} invoice${p.services.invoices.length === 1 ? '' : 's'}` : p.services.option === 'services' ? 'Itemized services' : <span className="text-muted-foreground/70">Not set</span>}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{p.general.servicesEnabled && p.services.option ? money(proposalTotal(p)) : <Dash />}</TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">{fmtDate(p.updatedAt)}</TableCell>
                  <TableCell className="text-right">
                    <RowActionsMenu label={name} onEdit={() => openEdit(p)} onDuplicate={() => duplicate(p)}
                      extra={p.status === 'draft' ? [{ label: 'Send proposal', icon: Send, onClick: () => setStatus(p, 'sent') }]
                        : p.status === 'sent' ? [{ label: 'Mark as signed', icon: CheckCircle2, onClick: () => setStatus(p, 'signed') }] : []}
                      onDelete={() => setConfirm(p)} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      ) : (
        <EmptyState icon={FileSignature} title={`No proposals for ${account.name} yet`} description="Send a proposal or engagement letter for the client to review and sign."
          action={<Button onClick={openNew}><Plus />Create proposal</Button>} />
      )}
      {confirm && (
        <Modal title={`Delete “${proposalDisplayName(confirm, account)}”?`} description="The client will no longer see this proposal." onClose={() => setConfirm(null)}
          footer={<><Button variant="outline" onClick={() => setConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { save(proposals.filter((x) => x.id !== confirm.id)); setConfirm(null); notify('Proposal deleted'); }}><Trash2 />Delete proposal</Button></>}>
          <p className="text-sm text-muted-foreground">This can't be undone.</p>
        </Modal>
      )}
      <ToastBridge message={note} />
    </section>
  );
}
