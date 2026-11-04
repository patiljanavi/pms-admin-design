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
//         <p className="text-muted">It may have been deleted.</p>
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
//           <nav aria-label="Breadcrumb" className="text-sm text-muted">Clients <span aria-hidden="true">/</span> <Link to={ACCOUNTS_PATH} className="hover:underline">Accounts</Link></nav>
//           <h1 className="truncate text-2xl font-bold sm:text-3xl">{account.name}</h1>
//           <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-muted">
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

import { Link, Navigate, Outlet, useMatch, useNavigate } from 'react-router-dom';
import {
  FiActivity, FiArrowLeft, FiClipboard, FiEdit2, FiFileMinus, FiFileText, FiFolder, FiGrid, FiInfo, FiMail, FiMessageSquare, FiEdit3,
} from 'react-icons/fi';
import TabNav from '../../components/TabNav';
import TagChip from '../../components/TagChip';
import { Avatar, initials } from '../../components/ui';
import { useData } from '../../context/DataContext';
import { ACCOUNTS_PATH, ACCOUNT_DASH_PATH, ACCOUNT_TABS, accountTabPath } from '../../config';

const ICONS = {
  overview: FiGrid, info: FiInfo, docs: FiFolder, communication: FiMessageSquare, organizers: FiClipboard,
  invoices: FiFileText, email: FiMail, proposals: FiFileMinus, notes: FiEdit3, workflow: FiActivity,
};

/**
 * Account dashboard with routed tabs (same pattern as Firm Templates).
 *   /clients/accounts/accountsdash/<tab>/<accountId>
 * Each tab gets the account through useOutletContext().
 */
export default function AccountDashLayout() {
  const navigate = useNavigate();
  const match = useMatch(`${ACCOUNT_DASH_PATH}/:tab/:accountId/*`);   // also …/proposals/:accountId/new
  const { accounts = [], tagById = new Map(), setAccounts } = useData();
  const tab = match?.params.tab;
  const accountId = match?.params.accountId;
  const account = accounts.find((a) => String(a.id) === String(accountId));

  if (!match) return <Navigate to={ACCOUNTS_PATH} replace />;
  if (!ACCOUNT_TABS.some((t) => t.key === tab)) return <Navigate to={accountTabPath('overview', accountId)} replace />;
  if (!account) {
    return (
      <div className="flex flex-col items-start gap-4">
        <h1 className="text-3xl font-bold">Account not found</h1>
        <p className="text-muted">It may have been deleted.</p>
        <Link to={ACCOUNTS_PATH} className="btn-primary">Back to accounts</Link>
      </div>
    );
  }

  const tabs = ACCOUNT_TABS.map((t) => ({ to: accountTabPath(t.key, account.id), label: t.label, icon: ICONS[t.key] }));
  const tags = (account.tags || []).map((id) => tagById.get(id)).filter(Boolean);
  /** Update this account (used by tabs, e.g. notes and documents). */
  const updateAccount = (changes) => setAccounts((list) => list.map((a) => (a.id === account.id ? { ...a, ...(typeof changes === 'function' ? changes(a) : changes) } : a)));

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start gap-4">
        <button onClick={() => navigate(ACCOUNTS_PATH)} aria-label="Back to accounts" className="mt-1 flex h-10 w-10 flex-none items-center justify-center rounded border border-line-strong bg-surface hover:bg-subtle"><FiArrowLeft size={18} /></button>
        <Avatar text={initials(account.name)} size="lg" />
        <div className="min-w-0 flex-1">
          <nav aria-label="Breadcrumb" className="text-sm text-muted">Clients <span aria-hidden="true">/</span> <Link to={ACCOUNTS_PATH} className="hover:underline">Accounts</Link></nav>
          <h1 className="truncate text-2xl font-bold sm:text-3xl">{account.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-muted">
            {account.company && <span>{account.company}</span>}
            {tags.length > 0 && <span className="flex flex-wrap gap-1">{tags.map((t) => <TagChip key={t.value} tag={t} size="xs" />)}</span>}
            {(account.team || []).length > 0 && (
              <span className="flex items-center gap-1.5" title={account.team.join(', ')}>
                <span className="flex -space-x-2">{account.team.slice(0, 3).map((m) => <span key={m} className="rounded-full ring-2 ring-surface"><Avatar text={initials(m)} size="sm" tone="solid" /></span>)}</span>
                {account.team.length === 1 ? account.team[0] : `${account.team.length} team members`}
              </span>
            )}
          </div>
        </div>
        <button type="button" className="btn-secondary" onClick={() => navigate(`${ACCOUNTS_PATH}/${account.id}`)}><FiEdit2 aria-hidden="true" /> Edit account</button>
      </header>

      <TabNav tabs={tabs} currentTo={accountTabPath(tab, account.id)} navLabel="Account sections" selectLabel="Section" selectId="account-section" />

      <Outlet context={{ account, updateAccount }} />
    </div>
  );
}