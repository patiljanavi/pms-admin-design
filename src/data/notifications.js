// Notifications (Inbox+). Notification: { id, type, title, body, link?, accountId?, actor?, createdAt, read }
// New ones are added by DataContext when things happen (account registered, invoice created, payment received, …).

/** Types: label (for the filter) and a colour tone (the page picks the icon). */
export const NOTIFICATION_TYPES = {
  account: { label: 'Accounts', tone: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
  contact: { label: 'Contacts', tone: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300' },
  invoice: { label: 'Invoices', tone: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300' },
  payment: { label: 'Payments', tone: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
  proposal: { label: 'Proposals', tone: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' },
  task: { label: 'Tasks', tone: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300' },
  job: { label: 'Jobs', tone: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' },
  chat: { label: 'Chats', tone: 'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300' },
  organizer: { label: 'Organizers', tone: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300' },
  team: { label: 'Team', tone: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
};

let seq = 0;
export const notificationId = () => `ntf-${Date.now().toString(36)}${(seq += 1).toString(36)}${Math.random().toString(36).slice(2, 5)}`;

/** A new notification (unread). */
export const makeNotification = (type, { title, body = '', link = '', accountId = null, actor = '' } = {}) => ({
  id: notificationId(), type, title, body, link, accountId, actor, createdAt: new Date().toISOString(), read: false,
});

/** "just now", "5 min ago", "3 h ago", "Yesterday", "Nov 2" */
export function timeAgo(iso, now = Date.now()) {
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 172800) return 'Yesterday';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
/** Today / Yesterday / This week / Earlier */
export function dayGroup(iso, now = new Date()) {
  const d = new Date(iso);
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (d.getTime() >= start) return 'Today';
  if (d.getTime() >= start - 86400000) return 'Yesterday';
  if (d.getTime() >= start - 6 * 86400000) return 'This week';
  return 'Earlier';
}

/** Demo notifications from the sample accounts (times relative to now; the first 5 are unread). */
export function seedNotifications(accounts = [], dashPath = (tab, id) => `/clients/accounts/accountsdash/${tab}/${id}`) {
  const a = (i) => accounts[i % Math.max(accounts.length, 1)] || { id: '', name: 'A client' };
  const ago = (min) => new Date(Date.now() - min * 60000).toISOString();
  const n = (type, min, title, body, acct, tab, actor = '') => ({
    id: `ntf-seed-${type}-${min}`, type, title, body, accountId: acct?.id || null, link: acct?.id ? dashPath(tab, acct.id) : '', actor, createdAt: ago(min), read: false,
  });
  const list = [
    n('account', 12, 'New account registered', `${a(5).name} was registered`, a(5), 'overview', 'Ava Thompson'),
    n('payment', 48, 'Payment received', `${a(0).name} paid $692.80 by Bank Debits`, a(0), 'invoices'),
    n('proposal', 95, 'Proposal signed', `${a(1).name} signed “Your 2026 tax return”`, a(1), 'proposals'),
    n('chat', 160, 'New client message', `${a(2).name} replied in “A few receipts are missing”`, a(2), 'communication'),
    n('organizer', 230, 'Organizer completed', `${a(3).name} finished the 2026 tax organizer`, a(3), 'organizers'),
    n('invoice', 60 * 20, 'Invoice overdue', `${a(4).name}’s invoice is past its due date`, a(4), 'invoices'),
    n('task', 60 * 26, 'Task completed', `Jonas Berg completed “Reconcile October bank feeds” for ${a(6).name}`, a(6), 'workflow', 'Jonas Berg'),
    n('team', 60 * 30, 'Team member joined', 'Theo Laurent accepted the invitation', null, ''),
    n('contact', 60 * 50, 'New contact added', `A contact was added to ${a(7).name}`, a(7), 'info', 'Elena Ruiz'),
    n('job', 60 * 70, 'Job moved', `“Year-end close” for ${a(8).name} moved to Review`, a(8), 'workflow', 'Mateo Rossi'),
    n('invoice', 60 * 96, 'Invoice sent', `An invoice was sent to ${a(9).name}`, a(9), 'invoices', 'Ava Thompson'),
    n('account', 60 * 24 * 6, 'New account registered', `${a(10).name} was registered`, a(10), 'overview', 'Samuel Adeyemi'),
  ];
  return list.map((x, i) => ({ ...x, read: i >= 5 }));
}
