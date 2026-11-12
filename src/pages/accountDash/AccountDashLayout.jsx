// import { Link, Navigate, Outlet, useMatch, useNavigate } from 'react-router-dom';
// import {
//   FiActivity, FiArrowLeft, FiClipboard, FiEdit2, FiFileMinus, FiFileText, FiFolder, FiGrid, FiInfo, FiMail, FiMessageSquare, FiEdit3,
// } from 'react-icons/fi';
// import TabNav from '../../components/TabNav';
// import TagChip from '../../components/TagChip';
// import { Avatar, initials } from '../../components/ui';
// import { useData } from '../../context/DataContext';
// import { ACCOUNTS_PATH, ACCOUNT_DASH_PATH, ACCOUNT_TABS, accountTabPath } from '../../config';

// const ICONS = {
//   overview: FiGrid, info: FiInfo, docs: FiFolder, communication: FiMessageSquare, organizers: FiClipboard,
//   invoices: FiFileText, email: FiMail, proposals: FiFileMinus, notes: FiEdit3, workflow: FiActivity,
// };

// /**
//  * Account dashboard with routed tabs (same pattern as Firm Templates).
//  *   /clients/accounts/accountsdash/<tab>/<accountId>
//  * Each tab gets the account through useOutletContext().
//  */
// export default function AccountDashLayout() {
//   const navigate = useNavigate();
//   const match = useMatch(`${ACCOUNT_DASH_PATH}/:tab/:accountId`);
//   const { accounts = [], tagById = new Map(), setAccounts } = useData();
//   const tab = match?.params.tab;
//   const accountId = match?.params.accountId;
//   const account = accounts.find((a) => String(a.id) === String(accountId));

//   if (!match) return <Navigate to={ACCOUNTS_PATH} replace />;
//   if (!ACCOUNT_TABS.some((t) => t.key === tab)) return <Navigate to={accountTabPath('overview', accountId)} replace />;
//   if (!account) {
//     return (
//       <div className="flex flex-col items-start gap-4">
//         <h1 className="text-3xl font-bold">Account not found</h1>
//         <p className="text-muted-foreground">It may have been deleted.</p>
//         <Link to={ACCOUNTS_PATH} className="btn-primary">Back to accounts</Link>
//       </div>
//     );
//   }

//   const tabs = ACCOUNT_TABS.map((t) => ({ to: accountTabPath(t.key, account.id), label: t.label, icon: ICONS[t.key] }));
//   const tags = (account.tags || []).map((id) => tagById.get(id)).filter(Boolean);
//   /** Update this account (used by tabs, e.g. notes and documents). */
//   const updateAccount = (changes) => setAccounts((list) => list.map((a) => (a.id === account.id ? { ...a, ...(typeof changes === 'function' ? changes(a) : changes) } : a)));

//   return (
//     <div className="flex flex-col gap-6">
//       <header className="flex flex-wrap items-start gap-4">
//         <button onClick={() => navigate(ACCOUNTS_PATH)} aria-label="Back to accounts" className="mt-1 flex h-10 w-10 flex-none items-center justify-center rounded border border-line-strong bg-surface hover:bg-subtle"><FiArrowLeft size={18} /></button>
//         <Avatar text={initials(account.name)} size="lg" />
//         <div className="min-w-0 flex-1">
//           <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">Clients <span aria-hidden="true">/</span> <Link to={ACCOUNTS_PATH} className="hover:underline">Accounts</Link></nav>
//           <h1 className="truncate text-2xl font-bold sm:text-3xl">{account.name}</h1>
//           <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-muted-foreground">
//             {account.company && <span>{account.company}</span>}
//             {tags.length > 0 && <span className="flex flex-wrap gap-1">{tags.map((t) => <TagChip key={t.value} tag={t} size="xs" />)}</span>}
//             {(account.team || []).length > 0 && (
//               <span className="flex items-center gap-1.5" title={account.team.join(', ')}>
//                 <span className="flex -space-x-2">{account.team.slice(0, 3).map((m) => <span key={m} className="rounded-full ring-2 ring-surface"><Avatar text={initials(m)} size="sm" tone="solid" /></span>)}</span>
//                 {account.team.length === 1 ? account.team[0] : `${account.team.length} team members`}
//               </span>
//             )}
//           </div>
//         </div>
//         <button type="button" className="btn-secondary" onClick={() => navigate(`${ACCOUNTS_PATH}/${account.id}`)}><FiEdit2 aria-hidden="true" /> Edit account</button>
//       </header>

//       <TabNav tabs={tabs} currentTo={accountTabPath(tab, account.id)} navLabel="Account sections" selectLabel="Section" selectId="account-section" />

//       <Outlet context={{ account, updateAccount }} />
//     </div>
//   );
// }

import { useMemo } from 'react';
import { Link, Navigate, Outlet, useMatch, useNavigate } from 'react-router-dom';
import {
  Activity, ArrowLeft, Briefcase, Building2, CalendarDays, ClipboardList, Copy, FileSignature, FileText, Folder, Hash, Info,
  LayoutGrid, Mail, MessagesSquare, MoreHorizontal, NotebookPen, Pencil, Plus, SearchX, Users,
} from 'lucide-react';
import TabNav from '../../components/TabNav';
import TagChip from '../../components/TagChip';
import useJobActions from '../../components/workflow/useJobActions';
import { EmptyState } from '../../components/page';
import { Avatar, initials } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { SimpleTooltip } from '../../components/ui/tooltip';
import { toast } from '../../components/ui/sonner';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { useData } from '../../context/DataContext';
import { ACCOUNTS_PATH, ACCOUNT_DASH_PATH, ACCOUNT_TABS, accountTabPath } from '../../config';
import { countItems, defaultTree } from '../../data/folderTemplates';
import { demoNotes, normalizeNote } from '../../data/accountNotes';
import { demoProposals } from '../../data/accountProposals';
import { primaryContact } from '../../data/accountChats';
import { cn } from 'lib/utils';

const ICONS = {
  overview: LayoutGrid, info: Info, docs: Folder, communication: MessagesSquare, organizers: ClipboardList,
  invoices: FileText, email: Mail, proposals: FileSignature, notes: NotebookPen, workflow: Activity,
};

const fmtDate = (d) => (d ? new Date(d.length === 10 ? `${d}T00:00:00` : d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—');

/** One cell of the key-stats strip under the record header. */
function Stat({ icon: Icon, label, value, to }) {
  const inner = (
    <>
      <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><Icon className="size-3.5" aria-hidden="true" />{label}</span>
      <span className="truncate text-lg font-semibold tabular-nums tracking-tight text-foreground">{value}</span>
    </>
  );
  const base = 'flex min-w-0 flex-col gap-1 bg-card px-4 py-3 sm:px-5';
  return to ? (
    <Link to={to} className={cn(base, 'transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none')}>{inner}</Link>
  ) : <div className={base}>{inner}</div>;
}

/**
 * Account dashboard with routed tabs (same pattern as Firm Templates).
 *   /clients/accounts/accountsdash/<tab>/<accountId>
 * Each tab gets the account through useOutletContext().
 */
export default function AccountDashLayout() {
  const navigate = useNavigate();
  const match = useMatch(`${ACCOUNT_DASH_PATH}/:tab/:accountId/*`);   // also …/proposals/:accountId/new
  const { accounts = [], tagById = new Map(), setAccounts, jobs = [], proposalTemplates = [] } = useData();
  const jobUi = useJobActions();
  const tab = match?.params.tab;
  const accountId = match?.params.accountId;
  const account = accounts.find((a) => String(a.id) === String(accountId));

  // numbers for the key-stats strip
  const stats = useMemo(() => {
    if (!account) return null;
    const contacts = account.contacts?.length ? account.contacts.length : account.email ? 1 : 0;
    const notes = (account.notes ?? demoNotes(account)).map(normalizeNote).filter((n) => !n.archived).length;
    return {
      contacts,
      jobs: jobs.filter((j) => j.accountId === account.id).length,
      files: countItems(account.documents || defaultTree()).files,
      proposals: (account.proposals ?? demoProposals(account, proposalTemplates)).length,
      notes,
    };
  }, [account, jobs, proposalTemplates]);

  if (!match) return <Navigate to={ACCOUNTS_PATH} replace />;
  if (!ACCOUNT_TABS.some((t) => t.key === tab)) return <Navigate to={accountTabPath('overview', accountId)} replace />;
  if (!account) {
    return (
      <div className="page">
        <div className="card">
          <EmptyState icon={SearchX} title="Account not found" description="It may have been deleted, or the link is out of date."
            action={<Button asChild><Link to={ACCOUNTS_PATH}><ArrowLeft />Back to accounts</Link></Button>} />
        </div>
      </div>
    );
  }

  const tabs = ACCOUNT_TABS.map((t) => ({ to: accountTabPath(t.key, account.id), label: t.label, icon: ICONS[t.key] }));
  const tags = (account.tags || []).map((id) => tagById.get(id)).filter(Boolean);
  const team = account.team || [];
  const email = primaryContact(account).email || account.email || '';
  /** Update this account (used by tabs, e.g. notes and documents). */
  const updateAccount = (changes) => setAccounts((list) => list.map((a) => (a.id === account.id ? { ...a, ...(typeof changes === 'function' ? changes(a) : changes) } : a)));

  const copy = (text, what) => {
    try {
      navigator.clipboard?.writeText(String(text));
      toast.success(`${what} copied`);
    } catch { toast.error(`Couldn't copy ${what.toLowerCase()}`); }
  };

  return (
    <div className="page">
      {/* ===== Record header ===== */}
      <header className="flex flex-col gap-5">
        <div className="flex flex-wrap items-start gap-x-4 gap-y-4">
          <SimpleTooltip label="Back to accounts">
            <Button variant="ghost" size="icon-sm" onClick={() => navigate(ACCOUNTS_PATH)} aria-label="Back to accounts" className="-ml-1 mt-1 text-muted-foreground">
              <ArrowLeft />
            </Button>
          </SimpleTooltip>
          <Avatar text={initials(account.name)} size="xl" className="shadow-card" />

          <div className="min-w-0 flex-1 basis-64">
            <h1 className="page-title truncate">{account.name}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
              {account.company && <span className="inline-flex items-center gap-1.5"><Building2 className="size-3.5" aria-hidden="true" />{account.company}</span>}
              {email && (
                <a href={`mailto:${email}`} className="inline-flex min-w-0 items-center gap-1.5 hover:text-foreground hover:underline">
                  <Mail className="size-3.5 flex-none" aria-hidden="true" /><span className="truncate">{email}</span>
                </a>
              )}
              {team.length > 0 && (
                <SimpleTooltip label={team.join(', ')}>
                  <span className="inline-flex items-center gap-2">
                    <span className="flex -space-x-1.5">
                      {team.slice(0, 3).map((m) => <span key={m} className="rounded-full ring-2 ring-canvas"><Avatar text={initials(m)} size="xs" /></span>)}
                    </span>
                    {team.length === 1 ? team[0] : `${team.length} team members`}
                  </span>
                </SimpleTooltip>
              )}
            </div>
            {tags.length > 0 && <div className="mt-2.5 flex flex-wrap gap-1.5">{tags.map((t) => <TagChip key={t.value} tag={t} size="xs" />)}</div>}
          </div>

          {/* Quick actions */}
          <div className="flex flex-none items-center gap-2">
            {email ? (
              <Button variant="outline" asChild><a href={`mailto:${email}`}><Mail />Email</a></Button>
            ) : (
              <SimpleTooltip label="No email address on this account">
                <span tabIndex={0} className="rounded-md"><Button variant="outline" disabled><Mail />Email</Button></span>
              </SimpleTooltip>
            )}
            <Button onClick={() => jobUi.addJob({ accountIds: [account.id] })}><Plus />New job</Button>
            <DropdownMenu modal={false}>
              <SimpleTooltip label="More actions">
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="More actions"><MoreHorizontal /></Button>
                </DropdownMenuTrigger>
              </SimpleTooltip>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="truncate">{account.name}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => navigate(`${ACCOUNTS_PATH}/${account.id}`)}><Pencil className="text-muted-foreground" />Edit account</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => navigate(`${accountTabPath('proposals', account.id)}/new`)}><FileSignature className="text-muted-foreground" />New proposal</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => navigate(accountTabPath('notes', account.id))}><NotebookPen className="text-muted-foreground" />Go to notes</DropdownMenuItem>
                <DropdownMenuSeparator />
                {email && <DropdownMenuItem onSelect={() => copy(email, 'Email')}><Copy className="text-muted-foreground" />Copy email</DropdownMenuItem>}
                <DropdownMenuItem onSelect={() => copy(account.id, 'Account ID')}><Hash className="text-muted-foreground" />Copy account ID</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Key stats strip */}
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border shadow-card sm:grid-cols-3 lg:grid-cols-6">
          <Stat icon={Users} label="Contacts" value={stats.contacts} to={accountTabPath('info', account.id)} />
          <Stat icon={Briefcase} label="Jobs" value={stats.jobs} to={accountTabPath('workflow', account.id)} />
          <Stat icon={Folder} label="Files" value={stats.files} to={accountTabPath('docs', account.id)} />
          <Stat icon={FileSignature} label="Proposals" value={stats.proposals} to={accountTabPath('proposals', account.id)} />
          <Stat icon={NotebookPen} label="Notes" value={stats.notes} to={accountTabPath('notes', account.id)} />
          <Stat icon={CalendarDays} label="Client since" value={fmtDate(account.joined)} />
        </div>
      </header>

      <TabNav tabs={tabs} currentTo={accountTabPath(tab, account.id)} navLabel="Account sections" selectLabel="Section" selectId="account-section" />

      <Outlet context={{ account, updateAccount }} />

      {jobUi.ui}
    </div>
  );
}
