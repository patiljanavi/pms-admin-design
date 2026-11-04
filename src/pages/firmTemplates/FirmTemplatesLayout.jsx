import { Outlet, useLocation } from 'react-router-dom';
import TabNav from '../../components/TabNav';
import {
  FiBriefcase, FiCheckSquare, FiClipboard,
  FiFileMinus, FiFileText, FiFlag, FiFolder, FiMail, FiMessageSquare,
} from 'react-icons/fi';

const TABS = [
  { to: '/firmtemp/templates/tasks', label: 'Tasks', icon: FiCheckSquare },
  { to: '/firmtemp/templates/emails', label: 'Emails', icon: FiMail },
  { to: '/firmtemp/templates/clientfacing', label: 'Client-facing Status', icon: FiFlag },
  { to: '/firmtemp/templates/jobs', label: 'Jobs', icon: FiBriefcase },
  { to: '/firmtemp/templates/chats', label: 'Chats', icon: FiMessageSquare },
  { to: '/firmtemp/templates/folders', label: 'Folders', icon: FiFolder },
  { to: '/firmtemp/templates/invoices', label: 'Invoices', icon: FiFileText },
  { to: '/firmtemp/templates/proposals', label: 'Proposals & ELs', icon: FiFileMinus },
  { to: '/firmtemp/templates/organizers', label: 'Organizers', icon: FiClipboard },
];

export default function FirmTemplatesLayout() {
  const { pathname } = useLocation();
  const current = TABS.find((t) => pathname.toLowerCase().startsWith(t.to)) || TABS[0];

  // Create / edit pages (e.g. /firmtemp/templates/tasks/new) show without the tab bar
  const isFormPage = pathname.split('/').filter(Boolean).length > 3;
  if (isFormPage) return <Outlet />;

  return (
    <div className="flex flex-col gap-6">
      <header>
        <nav aria-label="Breadcrumb" className="text-sm text-muted">Templates <span aria-hidden="true">/</span> Firm Templates</nav>
        <h1 className="mt-1 text-3xl font-bold">Firm Templates</h1>
        <p className="mt-1 max-w-[65ch] text-muted">Reusable tasks, emails, jobs, documents and more for your whole team.</p>
      </header>
      <TabNav tabs={TABS} currentTo={current.to} navLabel="Template types" selectLabel="Template type" selectId="template-type" />
      <Outlet />
    </div>
  );
}
