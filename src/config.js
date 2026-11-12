// ─────────────────────────────────────────────────────────────
// App settings in one place: URLs, sidebar menu, quick create and fonts.
// This file imports no pages, so any file can import it safely.
// ─────────────────────────────────────────────────────────────
import {
  LayoutDashboard, Inbox, Users, Workflow, Receipt, Settings, LayoutTemplate, Upload, MessagesSquare,
  Building2, Contact, Briefcase, FileSignature, FilePlus2, ListTodo, Send, CreditCard,
} from 'lucide-react';

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
/** Sidebar section headings, in display order. */
export const MENU_GROUPS = [
  { id: 'workspace', label: 'Workspace' },
  { id: 'firm', label: 'Firm' },
];

export const MENU = [
  { id: 'insights', label: 'Insights', path: '/insights', icon: LayoutDashboard, group: 'workspace', submenu: [] },
  { id: 'inbox', label: 'Inbox', path: '/Inbox+', icon: Inbox, group: 'workspace', badge: 12, submenu: [] },
  {
    id: 'clients', label: 'Clients', path: '/clients/accounts/activeaccounts', icon: Users, group: 'workspace',
    submenu: [
      { id: 'clients-accounts', label: 'Accounts', path: '/clients/accounts/activeaccounts' },
      { id: 'clients-contacts', label: 'Contacts', path: '/clients/contacts' },
    ],
  },
  {
    id: 'workflow', label: 'Workflow', path: '/jobs/activejob', icon: Workflow, group: 'workspace',
    submenu: [
      { id: 'workflow-jobs', label: 'Jobs', path: '/jobs/activejob' },
      { id: 'workflow-pipelines', label: 'Pipelines', path: '/pipelines' },
      { id: 'workflow-tasks', label: 'Tasks', path: '/tasks/pending' },
    ],
  },
  {
    id: 'billing', label: 'Billing', path: '/billing/time', icon: Receipt, group: 'workspace',
    submenu: [
      { id: 'billing-invoices', label: 'Invoices', path: '/billing/Invoices' },
      { id: 'billing-proposals', label: 'Proposals&Els', path: '/billing/proposalsandels' },
    ],
  },
  {
    id: 'settings', label: 'Settings', path: '/settings/myaccount', icon: Settings, group: 'firm',
    submenu: [
      { id: 'settings-myaccount', label: 'My Account', path: '/settings/myaccount' },
      { id: 'settings-firm', label: 'Firm Settings', path: '/settings/firmsettings' },
    ],
  },
  {
    id: 'templates', label: 'Templates', path: '/firmtemp/marketplace', icon: LayoutTemplate, group: 'firm',
    submenu: [
      { id: 'templates-firm', label: 'Firm Templates', path: '/firmtemp/templates' },
      { id: 'templates-services', label: 'Services', path: '/firmtemp/service' },
      { id: 'templates-teams', label: 'Teams & Plans', path: '/firmtemp/teammember' },
      { id: 'templates-tags', label: 'Tags', path: '/firmtemp/tags' },
      { id: 'templates-pipelines', label: 'Pipeline Templates', path: '/firmtemp/pipelines' },
    ],
  },
  {
    id: 'import', label: 'Import', path: '/import/contacts', icon: Upload, group: 'firm',
    submenu: [
      { id: 'import-contacts', label: 'Contact Import', path: '/import/contacts' },
      { id: 'import-accounts', label: 'Account Import', path: '/import/accounts' },
      { id: 'import-docs', label: 'Document Upload', path: '/upload-docs' },
    ],
  },
  { id: 'communication', label: 'Communication', path: '/internal-communation', icon: MessagesSquare, group: 'workspace', submenu: [] },
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
  { id: 'account', label: 'Account', path: '#', icon: Building2, shortcut: 'A', drawer: 'account' },
  { id: 'contact', label: 'Contact', path: '#', icon: Contact, shortcut: 'C', drawer: 'contact' },
  { id: 'jobs', label: 'Job', path: '#', icon: Briefcase, shortcut: 'J', drawer: 'job' },
  { id: 'proposal', label: 'Proposal', path: '/billing/proposalsandels/new', icon: FileSignature, to: '/billing/proposalsandels/new' },
  { id: 'invoice', label: 'Invoice', path: '#', icon: FilePlus2, to: '/billing/Invoices?new=invoice' },
  { id: 'task', label: 'Task', path: '#', icon: ListTodo, shortcut: 'T', to: `${TASKS_PATH}?new=task` },
  { id: 'chat', label: 'Chat', path: '#', icon: Send, to: '/internal-communation?new=chat' },
  { id: 'payment', label: 'Offline Payment', path: '#', icon: CreditCard, to: '/billing/Invoices?new=payment' },
];

/* ---------- Fonts (Settings → My Account) ---------- */
// `sans` / `mono` are CSS font stacks; `google` is the Google Fonts css2 query.
const SYS = 'system-ui, -apple-system, "Segoe UI", sans-serif';
const MONO = 'ui-monospace, SFMono-Regular, monospace';

export const FONTS = [
  { id: 'inter', name: 'Inter', mono: 'JetBrains Mono', feel: 'Crisp, neutral, the modern SaaS default', bestFor: 'Everything — dense tables to dashboards',
    sans: `Inter, ${SYS}`, monoStack: `"JetBrains Mono", ${MONO}`, google: 'family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500' },
  { id: 'geist', name: 'Geist', mono: 'Geist Mono', feel: 'Precise, technical, very legible', bestFor: 'Developer-grade dashboards',
    sans: `Geist, ${SYS}`, monoStack: `"Geist Mono", ${MONO}`, google: 'family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500' },
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

export const DEFAULT_FONT = 'inter';
export const fontById = (id) => FONTS.find((f) => f.id === id) || FONTS[0];
