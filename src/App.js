import { Navigate, Route, Routes } from 'react-router-dom';
import RequireAuth from './components/RequireAuth';
import AppLayout from './components/AppLayout';
import { ACCOUNT_DASH_PATH,menuPaths, ACCOUNTS_PATH, HOME_PATH, INSIGHTS_PATH, MY_ACCOUNT_PATH, TAGS_PATH, TASKS_PATH, CONTACTS_PATH, FIRM_TEMPLATES_PATH,SERVICE_PATH,PIPELINES_PATH,WORKFLOW_PIPELINES_PATH ,WORKFLOW_JOBS_PATH} from './config';
import Login from './pages/Login';
import Register from './pages/Register';
import Accounts from './pages/Accounts-Contacts/Accounts';
import Tasks from './pages/Tasks';
import Insights from './pages/Insights';
import Tags from './pages/firmTemplates/Tag/Tags';
import MyAccount from './pages/MyAccount';
import NotFound from './pages/NotFound';
import Placeholder from './pages/Placeholder';
import AccountDrawer from './pages/Accounts-Contacts/AccountDrawer';
import Contacts from './pages/Accounts-Contacts/Contacts';
import AccountDashLayout from './pages/accountDash/AccountDashLayout';
import AccountWorkflow from './pages/accountDash/AccountWorkflow';                  // ← account Workflow tab
import WorkflowPipelines, { WorkflowPipelinesLayout } from './pages/workflow/WorkflowPipelines';   // ← Workflow → Pipelines
import PipelineBoard from './pages/workflow/PipelineBoard';                          // ← Kanban board page
import {
  AccountCommunication, AccountDocuments, AccountEmail, AccountInfo, AccountInvoices, AccountNotes, AccountOrganizers, AccountOverview, AccountProposals,
} from './pages/accountDash/tabs';
import FirmTemplatesLayout from './pages/firmTemplates/FirmTemplatesLayoutold';
import TaskTemplates from './pages/firmTemplates/Task/TaskTemplates';
import TaskTemplateForm from './pages/firmTemplates/Task/TaskTemplateForm';
import EmailTemplates from './pages/firmTemplates/Email/EmailTemplates';
import EmailTemplateForm from './pages/firmTemplates/Email/Emailtemplateform';
import ClientFacingTemplates from './pages/firmTemplates/ClientFacingJob/ClientFacingTemplates';
import JobTemplates from './pages/firmTemplates/Job/JobTemplates';
import JobTemplateForm from './pages/firmTemplates/Job/Jobtemplateform';
import ChatTemplates from './pages/firmTemplates/Chat/ChatTemplates';
import FolderTemplates from './pages/firmTemplates/Folder/FolderTemplates';
import FolderTemplateForm from './pages/firmTemplates/Folder/FolderTemplateForm';
import InvoiceTemplates from './pages/firmTemplates/Invoice/InvoiceTemplates';
import InvoiceTemplateForm from './pages/firmTemplates/Invoice/Invoicetemplateform';
import ProposalTemplates from './pages/firmTemplates/Proposals/ProposalTemplates';
import OrganizerTemplates from './pages/firmTemplates/Organizer/OrganizerTemplates';
import OrganizerTemplateForm from './pages/firmTemplates/Organizer/OrganizerTemplateForm';
import Service from './pages/firmTemplates/Service/ServicesPage';
import PipelineTemplates, { PipelinesLayout } from './pages/firmTemplates/Pipeliens/PipelineTemplates';
import PipelineForm from './pages/firmTemplates/Pipeliens/PipelineForm';
import ChatTemplateForm from './pages/firmTemplates/Chat/Chattemplateform'
import ProposalTemplateForm from './pages/firmTemplates/Proposals/ProposalTemplateForm';
import AccountProposalForm from './pages/accountDash/AccountProposalForm';   // ← create / edit proposal page
import AllJobs from './pages/workflow/AllJobs';    
/**
 * Menu paths that already have a real screen (keys in lowercase).
 * Every other menu path shows the Placeholder page.
 * `withAccountDrawer: true` also allows /:accountId to open the account drawer.
 * `children` adds sub-pages (tabs); the first one opens by default.
 */
/** Account dashboard tabs: /clients/accounts/accountsdash/<tab>/<accountId> */
const ACCOUNT_DASH_TABS = [
  { path: 'overview', Component: AccountOverview },
  { path: 'info', Component: AccountInfo },
  { path: 'docs', Component: AccountDocuments },
  { path: 'communication', Component: AccountCommunication },
  { path: 'organizers', Component: AccountOrganizers },
  { path: 'invoices', Component: AccountInvoices },
  { path: 'email', Component: AccountEmail },
  { path: 'proposals', Component: AccountProposals },
  { path: 'notes', Component: AccountNotes },
    { path: 'workflow', Component: AccountWorkflow }, 
 
];
const SCREENS = {
  [INSIGHTS_PATH.toLowerCase()]: { Component: Insights },
  [ACCOUNTS_PATH.toLowerCase()]: { Component: Accounts, withAccountDrawer: true },
  [TASKS_PATH.toLowerCase()]: { Component: Tasks },
  [TAGS_PATH.toLowerCase()]: { Component: Tags },
  [SERVICE_PATH.toLowerCase()]: { Component: Service },
 [PIPELINES_PATH.toLowerCase()]: {
    Component: PipelinesLayout,
    children: [
      { index: true, Component: PipelineTemplates },
      { path: 'new', Component: PipelineForm },
      { path: ':pipelineId', Component: PipelineForm },
    ],
  },
   [WORKFLOW_JOBS_PATH.toLowerCase()]: { Component: AllJobs },
    // Workflow → Pipelines (/pipelines): list of pipelines; /pipelines/:pipelineId = Kanban board page
  [WORKFLOW_PIPELINES_PATH.toLowerCase()]: {
    Component: WorkflowPipelinesLayout,
    children: [
      { index: true, Component: WorkflowPipelines },
      { path: ':pipelineId', Component: PipelineBoard },
    ],
  },

    [MY_ACCOUNT_PATH.toLowerCase()]: { Component: MyAccount },
  [CONTACTS_PATH.toLowerCase()]: { Component: Contacts },
 
  [FIRM_TEMPLATES_PATH.toLowerCase()]: {
    Component: FirmTemplatesLayout,
    children: [
      { path: 'tasks', Component: TaskTemplates },
      { path: 'tasks/new', Component: TaskTemplateForm },          // create page
      { path: 'tasks/:templateId', Component: TaskTemplateForm },  // edit page
      { path: 'emails', Component: EmailTemplates },
      {path: 'emails/new', Component: EmailTemplateForm },          // create page
      {path: 'emails/:templateId', Component: EmailTemplateForm },  // edit page
      { path: 'clientfacing', Component: ClientFacingTemplates },
      { path: 'jobs', Component: JobTemplates },
      {path: 'jobs/new', Component: JobTemplateForm },          // create page
      {path: 'jobs/:templateId', Component: JobTemplateForm },  // edit page
      { path: 'chats', Component: ChatTemplates },
      {path: 'chats/new', Component: ChatTemplateForm },          // create page
      {path: 'chats/:templateId', Component: ChatTemplateForm },  // edit page
      { path: 'folders', Component: FolderTemplates },
      {path: 'folders/new', Component: FolderTemplateForm },          // create page
      {path: 'folders/:templateId', Component: FolderTemplateForm },  // edit page
      { path: 'invoices', Component: InvoiceTemplates },
      {path: 'invoices/new', Component: InvoiceTemplateForm },          // create page
      {path: 'invoices/:templateId', Component: InvoiceTemplateForm },  // edit page
      { path: 'proposals', Component: ProposalTemplates },
      {path:'proposals/new',Component: ProposalTemplateForm},
      {path:'proposals/:templateId', Component:ProposalTemplateForm},
      { path: 'organizers', Component: OrganizerTemplates },
      {path:'organizers/new',Component: OrganizerTemplateForm},
      {path:'organizers/:templateId', Component:OrganizerTemplateForm},
    ],
  },
};

export default function App() {
  const paths = menuPaths();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
        <Route index element={<Navigate to={HOME_PATH} replace />} />
{/* Account dashboard (not a menu item): opened from an account's name */}
        <Route path={ACCOUNT_DASH_PATH} element={<AccountDashLayout />}>
          {ACCOUNT_DASH_TABS.map(({ path, Component }) => <Route key={path} path={`${path}/:accountId`} element={<Component />} />)}
          <Route path="proposals/:accountId/:proposalId" element={<AccountProposalForm />} />
          <Route path="proposals/:accountId/new" element={<AccountProposalForm />} />
          <Route path="*" element={null} />
        </Route>
        {/* One route per menu path from MENU in config.js */}
        {paths.map(({ path, label, section }) => {
          const screen = SCREENS[path.toLowerCase()];
          if (!screen) {
            return <Route key={path} path={path} element={<Placeholder title={label} section={section} />} />;
          }
        
          const { Component, withAccountDrawer, children } = screen;
const hasIndexChild = children?.some((c) => c.index);

return (
  <Route key={path} path={path} element={<Component />}>
    {withAccountDrawer && <Route path=":accountId" element={<AccountDrawer />} />}
    {children && !hasIndexChild && (
      <Route index element={<Navigate to={children[0].path} replace />} />
    )}
    {children?.map((child) =>
      child.index ? (
        <Route key="index" index element={<child.Component />} />
      ) : (
        <Route key={child.path} path={child.path} element={<child.Component />} />
      )
    )}
  </Route>
);
        })}
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
