import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import {
  FiActivity, FiClipboard, FiFileMinus, FiFileText, FiFolder, FiMail, FiMessageSquare, FiUsers, FiTag, FiArrowRight, FiEye, FiPlus, FiRotateCcw, FiCheckCircle, FiSend,
} from 'react-icons/fi';
import FolderExplorer from '../../components/folders/FolderExplorer';
import TagChip from '../../components/TagChip';
import { Avatar, Modal, initials } from '../../components/ui';
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

const fmtDate = (d) => (d ? new Date(d.length === 10 ? `${d}T00:00:00` : d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—');
const contactsOf = (a) => (a.contacts?.length ? a.contacts : a.email ? [{ name: a.name, email: a.email }] : []);
const Card = ({ title, action, children, className = '' }) => (
  <section className={`card p-5 sm:p-6 ${className}`}>
    {(title || action) && <div className="mb-4 flex items-center justify-between gap-3">{title && <h2 className="text-lg font-semibold">{title}</h2>}{action}</div>}
    {children}
  </section>
);

/* ---------- Overview ---------- */
export function AccountOverview() {
  const { account } = useOutletContext();
  const { tagById = new Map() } = useData();
  const docs = countItems(account.documents || defaultTree());
  const stats = [
    ['Contacts', contactsOf(account).length, FiUsers],
    ['Tags', (account.tags || []).length, FiTag],
    ['Documents', docs.files, FiFolder],
    ['Notes', (account.notes || []).length, FiFileText],
  ];
  const quick = [
    ['docs', 'Documents', 'Folders and files shared with the client', FiFolder],
    ['organizers', 'Organizers', 'Questionnaires the client fills in', FiClipboard],
    ['invoices', 'Invoices', 'Bills sent to this account', FiFileText],
    ['proposals', 'Proposals', 'Engagement letters and proposals', FiFileMinus],
    ['workflow', 'Workflow', 'Jobs moving through your pipelines', FiActivity],
    ['notes', 'Notes', 'Private notes for your team', FiMessageSquare],
  ];
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(([label, n, Icon]) => (
          <div key={label} className="card flex items-center gap-3 p-4 sm:p-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-600" aria-hidden="true"><Icon /></span>
            <div><div className="text-sm text-muted">{label}</div><div className="text-2xl font-bold">{n}</div></div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card title="Quick links">
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {quick.map(([key, label, desc, Icon]) => (
              <li key={key}>
                <Link to={accountTabPath(key, account.id)} className="group flex items-start gap-3 rounded-lg border border-line p-4 hover:border-brand-600 hover:bg-brand-50/40">
                  <Icon className="mt-0.5 flex-none text-brand-600" aria-hidden="true" />
                  <span className="min-w-0 flex-1"><span className="block font-semibold">{label}</span><span className="block text-sm text-muted">{desc}</span></span>
                  <FiArrowRight className="mt-1 text-muted group-hover:text-brand-600" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="At a glance">
          <dl className="divide-y divide-line-soft text-sm">
            <div className="flex justify-between gap-3 py-2"><dt className="text-muted">Company</dt><dd className="font-semibold">{account.company || '—'}</dd></div>
            <div className="flex justify-between gap-3 py-2"><dt className="text-muted">Plan</dt><dd className="font-semibold">{account.plan || '—'}</dd></div>
            <div className="flex justify-between gap-3 py-2"><dt className="text-muted">Status</dt><dd className="font-semibold">{account.status || '—'}</dd></div>
            <div className="flex justify-between gap-3 py-2"><dt className="text-muted">Client since</dt><dd className="font-semibold">{fmtDate(account.joined)}</dd></div>
            <div className="flex flex-wrap justify-between gap-3 py-2"><dt className="text-muted">Tags</dt><dd className="flex flex-wrap justify-end gap-1">{(account.tags || []).map((id) => tagById.get(id)).filter(Boolean).map((t) => <TagChip key={t.value} tag={t} size="xs" />)}{!(account.tags || []).length && '—'}</dd></div>
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
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <Card title="Account details">
        <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
          {rows.map(([k, v]) => <div key={k}><dt className="text-xs font-semibold uppercase tracking-wide text-muted">{k}</dt><dd className="mt-0.5 break-words">{v || '—'}</dd></div>)}
        </dl>
      </Card>
      <Card title={`Contacts (${contacts.length})`}>
        {contacts.length ? (
          <ul className="divide-y divide-line-soft">
            {contacts.map((c, i) => (
              <li key={c.id || c.email || i} className="flex items-center gap-3 py-2.5">
                <Avatar text={initials(contactName(c) || c.email)} size="sm" />
                <div className="min-w-0 flex-1"><div className="truncate font-semibold">{contactName(c) || '—'}{c.primary && <span className="ml-2 rounded bg-subtle px-1.5 py-0.5 text-[11px] font-semibold text-muted">Primary</span>}</div>{c.email && <a href={`mailto:${c.email}`} className="truncate text-sm text-brand-600 hover:underline">{c.email}</a>}</div>
              </li>
            ))}
          </ul>
        ) : <p className="text-muted">No contacts yet.</p>}
      </Card>
      <Card title="Team members" className="xl:col-span-2">
        {(account.team || []).length ? (
          <ul className="flex flex-wrap gap-3">{account.team.map((m) => <li key={m} className="flex items-center gap-2 rounded-full border border-line py-1 pl-1 pr-3"><Avatar text={initials(m)} size="sm" tone="solid" />{m}</li>)}</ul>
        ) : <p className="text-muted">No team members assigned.</p>}
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
  const apply = () => {
    const tpl = folderTemplates.find((t) => t.id === pick);
    if (!tpl) return;
    updateAccount({ documents: mergeFolderTree(items, tpl.items) });
    setNote(`Applied “${tpl.templatename}”`); setPick('');
    setTimeout(() => setNote(''), 2400);
  };
  return (
    <section className="card overflow-hidden" aria-label="Documents">
      <header className="flex flex-wrap items-end gap-3 border-b border-line bg-subtle/60 px-5 py-4">
        <div className="flex-1"><h2 className="font-semibold">Documents</h2><p className="text-sm text-muted">{countItems(items).folders} folders · {countItems(items).files} files</p></div>
        <label className="flex items-center gap-2 text-sm">Apply folder template
          <select className="input min-h-[38px] w-auto text-sm" value={pick} onChange={(e) => setPick(e.target.value)}>
            <option value="">Choose…</option>
            {folderTemplates.map((t) => <option key={t.id} value={t.id}>{t.templatename}</option>)}
          </select>
        </label>
        <button type="button" className="btn-secondary min-h-[38px] text-sm" disabled={!pick} onClick={apply}>Apply</button>
        {note && <span role="status" className="text-sm font-semibold text-success-700">{note}</span>}
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
      <Card title={title}>
        {sent.length ? (
          <ul aria-label={`Sent ${title.toLowerCase()}`} className="divide-y divide-line-soft">
            {sent.map((it) => (
              <li key={it.id} className="flex items-start gap-3 py-3">
                <span className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-full bg-brand-100 text-brand-600" aria-hidden="true"><Icon size={15} /></span>
                <div className="min-w-0 flex-1"><div className="truncate font-semibold">{it.title}</div>{it.subtitle && <div className="truncate text-xs text-muted">{it.subtitle}</div>}</div>
                <span className="whitespace-nowrap text-xs text-muted">{fmtDate(it.date)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-lg border-2 border-dashed border-line-strong p-10 text-center text-muted">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600" aria-hidden="true"><Icon size={22} /></span>
            <p className="font-semibold text-ink">{empty.replace('{name}', account.name)}</p>
            <p className="max-w-md text-sm">Items sent to this account will show here.</p>
          </div>
        )}
      </Card>
      <Card title="Available templates" action={templatesLink && <Link to={templatesLink} className="btn-link px-0 text-sm">Manage</Link>}>
        {templates.length ? (
          <ul className="divide-y divide-line-soft">
            {templates.slice(0, 8).map((t) => (
              <li key={t.id} className="py-2.5"><div className="truncate font-semibold">{nameOf(t)}</div>{describe && <div className="truncate text-xs text-muted">{describe(t)}</div>}</li>
            ))}
          </ul>
        ) : <p className="text-sm text-muted">No templates yet.</p>}
        {templates.length > 8 && <p className="mt-2 text-xs text-muted">+{templates.length - 8} more</p>}
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
      {note && <div role="status" className="fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-md bg-ink px-5 py-3 font-semibold text-white">{note}</div>}
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
    <section className="card overflow-hidden" aria-label="Organizers">
      <header className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4">
        <div className="flex-1"><h2 className="text-lg font-semibold">Organizers</h2><p className="text-sm text-muted">Questionnaires sent to {account.name}</p></div>
        <div role="tablist" aria-label="Organizer lists" className="flex rounded-full bg-subtle p-1">
          {[['active', 'Active'], ['completed', 'Completed']].map(([k, l]) => (
            <button key={k} type="button" role="tab" aria-selected={filter === k} onClick={() => setFilter(k)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ${filter === k ? 'bg-surface text-ink shadow-card' : 'text-muted hover:text-ink'}`}>
              {l} <span className="text-xs text-muted">{organizers.filter((o) => (k === 'completed' ? o.status === 'completed' : o.status !== 'completed')).length}</span>
            </button>
          ))}
        </div>
        <button type="button" className="btn-primary" onClick={() => setDrawer(true)}><FiPlus aria-hidden="true" /> Create organizer</button>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead>
            <tr className="bg-subtle text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-5 py-3 font-semibold">Organizer</th>
              <th className="px-3 py-3 font-semibold">Status</th>
              <th className="px-3 py-3 font-semibold">Questions</th>
              <th className="px-3 py-3 font-semibold">Reminders</th>
              <th className="px-3 py-3 font-semibold">Sent</th>
              <th className="px-5 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {shown.map((o) => (
              <tr key={o.id} className="border-t border-line-soft hover:bg-subtle/60">
                <td className="px-5 py-3">
                  <button type="button" onClick={() => setPreview(o)} className="text-left font-semibold hover:text-brand-600 hover:underline">{o.organizerName}</button>
                  <div className="text-xs text-muted">From “{o.templatename}”</div>
                </td>
                <td className="px-3 py-3">{o.status === 'completed'
                  ? <span className="rounded-full bg-success-50 px-2.5 py-0.5 text-xs font-semibold text-success-700">Completed</span>
                  : <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-800">Waiting for client</span>}</td>
                <td className="px-3 py-3">{o.sections.length} sections · {organizerQuestions(o)} questions</td>
                <td className="px-3 py-3">{o.reminders?.enabled ? `Every ${o.reminders.days} days · ${o.reminders.count}×` : <span className="text-muted">Off</span>}</td>
                <td className="whitespace-nowrap px-3 py-3 text-muted">{fmtDate(o.createdAt)}</td>
                <td className="px-5 py-3">
                  <div className="flex justify-end">
                    <RowActionsMenu label={o.organizerName}
                      extra={[
                        { label: 'Preview', icon: FiEye, onClick: () => setPreview(o) },
                        o.status === 'completed'
                          ? { label: 'Reopen', icon: FiRotateCcw, onClick: () => setStatus(o, 'active') }
                          : { label: 'Mark as completed', icon: FiCheckCircle, onClick: () => setStatus(o, 'completed') },
                      ]}
                      onDelete={() => setConfirm(o)} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!shown.length && (
          <div className="flex flex-col items-center gap-3 p-12 text-center text-muted">
            <FiClipboard size={26} aria-hidden="true" />
            {filter === 'completed' ? 'No completed organizers yet.' : `No organizers sent to ${account.name} yet.`}
            {filter !== 'completed' && <button type="button" className="btn-primary" onClick={() => setDrawer(true)}><FiPlus aria-hidden="true" /> Create organizer</button>}
          </div>
        )}
      </div>

      {drawer && <CreateOrganizerDrawer defaultAccountIds={[account.id]} onClose={() => setDrawer(false)} onCreate={create} />}
      {preview && <OrganizerPreview organizer={preview} onClose={() => setPreview(null)} />}
      {confirm && (
        <Modal title={`Delete “${confirm.organizerName}”?`} onClose={() => setConfirm(null)}
          footer={<><button className="btn-secondary" onClick={() => setConfirm(null)}>Cancel</button><button className="btn bg-danger-700 text-white hover:bg-[#831E15]" onClick={() => { save(organizers.filter((x) => x.id !== confirm.id)); setConfirm(null); notify('Organizer deleted'); }}>Delete</button></>}>
          <p className="text-muted">The client will no longer see this organizer or its answers.</p>
        </Modal>
      )}
      {note && <div role="status" className="fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-md bg-ink px-5 py-3 font-semibold text-white">{note}</div>}
    </section>
  );
}
export function AccountInvoices() {
  const { invoiceTemplates = [] } = useData();
  const { account } = useOutletContext();
  const sent = (account.invoices || []).map((i) => ({ id: i.id, title: i.name, subtitle: `${money(i.total)} · ${i.status === 'paid' ? 'Paid' : 'Sent'}`, date: i.sentAt }));
  return <TemplateTab sent={sent} icon={FiFileText} title="Invoices" empty="No invoices for {name} yet." templates={invoiceTemplates} templatesLink="/firmtemp/templates/invoices" nameOf={(t) => t.templatename} describe={(t) => t.description} />;
}
export function AccountEmail() {
  const { emailTemplates = [] } = useData();
  const { account } = useOutletContext();
  const sent = (account.emails || []).map((e) => ({ id: e.id, title: e.subject, subtitle: `From ${e.from}${e.reminders ? ` · reminds every ${e.reminders.days} days` : ''}`, date: e.sentAt }));
  return <TemplateTab sent={sent} icon={FiMail} title="Email" empty="No emails sent to {name} yet." templates={emailTemplates} templatesLink="/firmtemp/templates/emails" nameOf={(t) => t.templateName} describe={(t) => t.subject || htmlToText(t.emailBody || '')} />;
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
    <section className="card overflow-hidden" aria-label="Proposals">
      <header className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4">
        <div className="flex-1"><h2 className="text-lg font-semibold">Proposals</h2><p className="text-sm text-muted">Proposals and engagement letters for {account.name}</p></div>
        <button type="button" className="btn-primary" onClick={openNew}><FiPlus aria-hidden="true" /> Create proposal</button>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[780px] border-collapse text-sm">
          <thead>
            <tr className="bg-subtle text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-5 py-3 font-semibold">Proposal</th>
              <th className="px-3 py-3 font-semibold">Status</th>
              <th className="px-3 py-3 font-semibold">Billing</th>
              <th className="px-3 py-3 text-right font-semibold">Total</th>
              <th className="px-3 py-3 font-semibold">Updated</th>
              <th className="px-5 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {proposals.map((p) => {
              const name = proposalDisplayName(p, account);
              const st = PROPOSAL_STATUS[p.status] || PROPOSAL_STATUS.draft;
              const tpl = proposalTemplates.find((t) => t.id === p.general.templateId);
              return (
                <tr key={p.id} className="border-t border-line-soft hover:bg-subtle/60">
                  <td className="px-5 py-3">
                    <button type="button" onClick={() => openEdit(p)} className="text-left font-semibold hover:text-brand-600 hover:underline">{name}</button>
                    <div className="text-xs text-muted">{tpl ? `From “${tpl.general.templateName}”` : 'No template'}</div>
                  </td>
                  <td className="px-3 py-3"><span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${st.tone}`}>{st.label}</span></td>
                  <td className="px-3 py-3">{!p.general.servicesEnabled ? <span className="text-muted">—</span> : p.services.option === 'invoice' ? `${p.services.invoices.length} invoice${p.services.invoices.length === 1 ? '' : 's'}` : p.services.option === 'services' ? 'Itemized services' : <span className="text-muted">Not set</span>}</td>
                  <td className="px-3 py-3 text-right font-semibold">{p.general.servicesEnabled && p.services.option ? money(proposalTotal(p)) : <span className="font-normal text-muted">—</span>}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-muted">{fmtDate(p.updatedAt)}</td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end">
                      <RowActionsMenu label={name} onEdit={() => openEdit(p)} onDuplicate={() => duplicate(p)}
                        extra={p.status === 'draft' ? [{ label: 'Send proposal', icon: FiSend, onClick: () => setStatus(p, 'sent') }]
                          : p.status === 'sent' ? [{ label: 'Mark as signed', icon: FiCheckCircle, onClick: () => setStatus(p, 'signed') }] : []}
                        onDelete={() => setConfirm(p)} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!proposals.length && (
          <div className="flex flex-col items-center gap-3 p-12 text-center text-muted">
            <FiFileMinus size={26} aria-hidden="true" />
            No proposals for {account.name} yet.
            <button type="button" className="btn-primary" onClick={openNew}><FiPlus aria-hidden="true" /> Create proposal</button>
          </div>
        )}
      </div>
      {confirm && (
        <Modal title={`Delete “${proposalDisplayName(confirm, account)}”?`} onClose={() => setConfirm(null)}
          footer={<><button className="btn-secondary" onClick={() => setConfirm(null)}>Cancel</button><button className="btn bg-danger-700 text-white hover:bg-[#831E15]" onClick={() => { save(proposals.filter((x) => x.id !== confirm.id)); setConfirm(null); notify('Proposal deleted'); }}>Delete</button></>}>
          <p className="text-muted">The client will no longer see this proposal.</p>
        </Modal>
      )}
      {note && <div role="status" className="fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-md bg-ink px-5 py-3 font-semibold text-white">{note}</div>}
    </section>
  );
}


