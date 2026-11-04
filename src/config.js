// ─────────────────────────────────────────────────────────────
// App settings in one place: URLs, sidebar menu, quick create and fonts.
// This file imports no pages, so any file can import it safely.
// ─────────────────────────────────────────────────────────────
import { AiOutlineAppstoreAdd, AiOutlineImport } from 'react-icons/ai';
import { MdOutlineMail, MdFormatListBulletedAdd, MdForum, MdAddCard, MdOutlineTask, MdOutlinePayment } from 'react-icons/md';
import { IoPeopleOutline, IoBagAddOutline, IoPaperPlaneOutline } from 'react-icons/io5';
import { FaRegUser, FaRegNewspaper } from 'react-icons/fa';
import { RiContactsBook3Line } from 'react-icons/ri';
import { LuWorkflow } from 'react-icons/lu';
import { LiaMoneyBillSolid } from 'react-icons/lia';
import { FiSettings } from 'react-icons/fi';
import { GoDotFill } from 'react-icons/go';

/* ---------- URLs ---------- */
export const ACCOUNTS_PATH = '/clients/accounts/activeaccounts';
export const CONTACTS_PATH = '/clients/contacts';
export const INSIGHTS_PATH = '/insights';
export const TAGS_PATH = '/firmtemp/tags';
export const FIRM_TEMPLATES_PATH = '/firmtemp/templates';
export const MY_ACCOUNT_PATH = '/settings/myaccount';
export const TASKS_PATH = '/tasks/pending';
export const SERVICE_PATH = '/firmtemp/service';
export const PIPELINES_PATH = '/firmtemp/pipelines';
export const HOME_PATH = ACCOUNTS_PATH;
export const WORKFLOW_PIPELINES_PATH = '/pipelines';
export const WORKFLOW_JOBS_PATH = '/jobs/activejob';

/** Account dashboard (opened from an account's name): /clients/accounts/accountsdash/<tab>/<accountId> */
export const ACCOUNT_DASH_PATH = '/clients/accounts/accountsdash';
export const ACCOUNT_TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'info', label: 'Info' },
  { key: 'docs', label: 'Documents' },
  { key: 'communication', label: 'Communication' },
  { key: 'organizers', label: 'Organizers' },
  { key: 'invoices', label: 'Invoices' },
  { key: 'email', label: 'Email' },
  { key: 'proposals', label: 'Proposals' },
  { key: 'notes', label: 'Notes' },
  { key: 'workflow', label: 'Workflow' },
];
export const accountTabPath = (tab, accountId) => `${ACCOUNT_DASH_PATH}/${tab}/${accountId}`;

/* ---------- Sidebar menu ---------- */
/**
 * Sidebar menu (hard-coded).
 * `icon` is the react-icons component itself. Items with `submenu` become expandable groups.
 * App.js imports MENU to create one route per path.
 */
export const MENU = [
  { id: 'insights', label: 'Insights', path: '/insights', icon: AiOutlineAppstoreAdd, submenu: [] },
  { id: 'inbox', label: 'Inbox +', path: '/Inbox+', icon: MdOutlineMail, submenu: [] },
  {
    id: 'clients', label: 'Clients', path: '/clients/accounts/activeaccounts', icon: IoPeopleOutline,
    submenu: [
      { id: 'clients-accounts', label: 'Accounts', path: '/clients/accounts/activeaccounts', icon: GoDotFill },
      { id: 'clients-contacts', label: 'Contacts', path: '/clients/contacts', icon: GoDotFill },
    ],
  },
  {
    id: 'workflow', label: 'Workflow', path: '/jobs/activejob', icon: LuWorkflow,
    submenu: [
      { id: 'workflow-jobs', label: 'Jobs', path: '/jobs/activejob', icon: GoDotFill },
      { id: 'workflow-pipelines', label: 'Pipelines', path: '/pipelines', icon: GoDotFill },
      { id: 'workflow-tasks', label: 'Tasks', path: '/tasks/pending', icon: GoDotFill },
    ],
  },
  {
    id: 'billing', label: 'Billing', path: '/billing/time', icon: LiaMoneyBillSolid,
    submenu: [
      { id: 'billing-invoices', label: 'Invoices', path: '/billing/Invoices', icon: GoDotFill },
      { id: 'billing-proposals', label: 'Proposals&Els', path: '/billing/proposalsandels', icon: GoDotFill },
    ],
  },
  {
    id: 'settings', label: 'Settings', path: '/settings/myaccount', icon: FiSettings,
    submenu: [
      { id: 'settings-myaccount', label: 'My Account', path: '/settings/myaccount', icon: GoDotFill },
      { id: 'settings-firm', label: 'Firm Settings', path: '/settings/firmsettings', icon: GoDotFill },
    ],
  },
  {
    id: 'templates', label: 'Templates', path: '/firmtemp/marketplace', icon: MdFormatListBulletedAdd,
    submenu: [
      { id: 'templates-firm', label: 'Firm Templates', path: '/firmtemp/templates', icon: GoDotFill },
      { id: 'templates-services', label: 'Services', path: '/firmtemp/service', icon: GoDotFill },
      { id: 'templates-teams', label: 'Teams & Plans', path: '/firmtemp/teammember', icon: GoDotFill },
      { id: 'templates-tags', label: 'Tags', path: '/firmtemp/tags', icon: GoDotFill },
      { id: 'templates-pipelines', label: 'Pipeline Templates', path: '/firmtemp/pipelines', icon: GoDotFill },
    ],
  },
  {
    id: 'import', label: 'Import', path: '/import/contacts', icon: AiOutlineImport,
    submenu: [
      { id: 'import-contacts', label: 'Contact Import', path: '/import/contacts', icon: GoDotFill },
      { id: 'import-accounts', label: 'Account Import', path: '/import/accounts', icon: GoDotFill },
      { id: 'import-docs', label: 'Document Upload', path: '/upload-docs', icon: GoDotFill },
    ],
  },
  { id: 'communication', label: 'Communication', path: '/internal-communation', icon: MdForum, submenu: [] },
];

/** Every unique path in MENU (parents and children), used by App.js to create routes. */
export function menuPaths(menu = MENU) {
  const seen = new Map();
  menu.forEach((m) => {
    if (!seen.has(m.path.toLowerCase())) seen.set(m.path.toLowerCase(), { path: m.path, label: m.label, section: m.label });
    m.submenu.forEach((s) => { if (!seen.has(s.path.toLowerCase())) seen.set(s.path.toLowerCase(), { path: s.path, label: s.label, section: m.label }); });
  });
  return [...seen.values()];
}

/* ---------- Quick create (the "+ New" panel) ---------- */
/**
 * `path` is the value from the menu data ("#" = no page of its own yet).
 * `drawer` opens that form right away in a drawer, on whatever page you are on:
 *   'account' → Add account drawer · 'contact' → New contact drawer.
 * `to` is where clicking goes for the other items:
 *   - Task opens its real form (?new=task is read by the Tasks page).
 *   - Items with "#" open the related page with ?new=…, ready for you to build that form.
 */
export const QUICK_CREATE = [
  { id: 'account', label: 'Account', path: '#', icon: FaRegUser, drawer: 'account' },
  { id: 'contact', label: 'Contact', path: '#', icon: RiContactsBook3Line, drawer: 'contact' },
  { id: 'jobs', label: 'Jobs', path: '#', icon: IoBagAddOutline, drawer: 'job' },
  { id: 'proposal', label: 'Proposal', path: '/billing/proposalsandels/new', icon: FaRegNewspaper, to: '/billing/proposalsandels/new' },
  { id: 'invoice', label: 'Invoice', path: '#', icon: MdAddCard, to: '/billing/Invoices?new=invoice' },
  { id: 'task', label: 'Task', path: '#', icon: MdOutlineTask, to: `${TASKS_PATH}?new=task` },
  { id: 'chat', label: 'Chat', path: '#', icon: IoPaperPlaneOutline, to: '/internal-communation?new=chat' },
  { id: 'payment', label: 'Offline Payment', path: '#', icon: MdOutlinePayment, to: '/billing/Invoices?new=payment' },
];

/* ---------- Fonts (Settings → My Account) ---------- */
// `sans` / `mono` are CSS font stacks; `google` is the Google Fonts css2 query.
const SYS = 'system-ui, -apple-system, "Segoe UI", sans-serif';
const MONO = 'ui-monospace, SFMono-Regular, monospace';

export const FONTS = [
  { id: 'plex', name: 'IBM Plex Sans', mono: 'IBM Plex Mono', feel: 'Engineered, neutral, slightly technical', bestFor: 'Finance and accounting tools',
    sans: `"IBM Plex Sans", ${SYS}`, monoStack: `"IBM Plex Mono", ${MONO}`, google: 'family=IBM+Plex+Mono:wght@500&family=IBM+Plex+Sans:wght@400;500;600;700' },
  { id: 'public', name: 'Public Sans', mono: 'JetBrains Mono', feel: 'Plain and trustworthy', bestFor: 'Data-heavy tables, long forms',
    sans: `"Public Sans", ${SYS}`, monoStack: `"JetBrains Mono", ${MONO}`, google: 'family=JetBrains+Mono:wght@500&family=Public+Sans:wght@400;500;600;700' },
  { id: 'manrope', name: 'Manrope', mono: 'JetBrains Mono', feel: 'Modern, geometric, friendly but serious', bestFor: 'Dashboards with cards and KPIs',
    sans: `Manrope, ${SYS}`, monoStack: `"JetBrains Mono", ${MONO}`, google: 'family=JetBrains+Mono:wght@500&family=Manrope:wght@400;500;600;700' },
  { id: 'source', name: 'Source Sans 3', mono: 'Source Code Pro', feel: 'Calm, compact, very readable', bestFor: 'Dense tables and long lists',
    sans: `"Source Sans 3", ${SYS}`, monoStack: `"Source Code Pro", ${MONO}`, google: 'family=Source+Code+Pro:wght@500&family=Source+Sans+3:wght@400;500;600;700' },
  { id: 'dm', name: 'DM Sans', mono: 'DM Mono', feel: 'Soft and clean', bestFor: 'Client portals, onboarding',
    sans: `"DM Sans", ${SYS}`, monoStack: `"DM Mono", ${MONO}`, google: 'family=DM+Mono:wght@500&family=DM+Sans:wght@400;500;600;700' },
  { id: 'figtree', name: 'Figtree', mono: 'Fira Code', feel: 'Warm, rounded, easy on the eyes', bestFor: 'Inbox, communication, CRM',
    sans: `Figtree, ${SYS}`, monoStack: `"Fira Code", ${MONO}`, google: 'family=Fira+Code:wght@500&family=Figtree:wght@400;500;600;700' },
  { id: 'lexend', name: 'Lexend', mono: 'Roboto Mono', feel: 'Wide letters designed for reading ease', bestFor: 'Accessibility-first products',
    sans: `Lexend, ${SYS}`, monoStack: `"Roboto Mono", ${MONO}`, google: 'family=Roboto+Mono:wght@500&family=Lexend:wght@400;500;600;700' },
];

export const DEFAULT_FONT = 'plex';
export const fontById = (id) => FONTS.find((f) => f.id === id) || FONTS[0];
