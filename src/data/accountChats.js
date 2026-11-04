// // Account chats (Communication tab): demo data, shortcode filling and helpers.
// let seq = 0;
// const nid = (p) => `${p}-${Date.now().toString(36)}${(seq += 1).toString(36)}${Math.random().toString(36).slice(2, 5)}`;

// const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
// const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// /** The account's main contact. */
// export const primaryContact = (a) => (a.contacts || []).find((c) => c.primary) || (a.contacts || [])[0] || {};
// export const contactName = (c = {}) => [c.firstName, c.lastName].filter(Boolean).join(' ') || c.name || '';

// /** Replace [SHORTCODES] with this account's values (unknown ones stay as they are). */
// export function fillShortcodes(text = '', account = {}, now = new Date()) {
//   const c = primaryContact(account);
//   const q = Math.floor(now.getMonth() / 3) + 1;
//   const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
//   const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
//   const values = {
//     ACCOUNT_NAME: account.name, FIRST_NAME: c.firstName, MIDDLE_NAME: c.middleName, LAST_NAME: c.lastName, CONTACT_NAME: contactName(c),
//     COMPANY_NAME: account.company, PHONE_NUMBER: c.phone,
//     CURRENT_YEAR: now.getFullYear(), LAST_YEAR: now.getFullYear() - 1, NEXT_YEAR: now.getFullYear() + 1,
//     CURRENT_MONTH_NAME: MONTHS[now.getMonth()], LAST_MONTH_NAME: MONTHS[last.getMonth()], NEXT_MONTH_NAME: MONTHS[next.getMonth()],
//     CURRENT_MONTH_NUMBER: now.getMonth() + 1, CURRENT_QUARTER: `Q${q}`, LAST_QUARTER: `Q${q === 1 ? 4 : q - 1}`, NEXT_QUARTER: `Q${q === 4 ? 1 : q + 1}`,
//     CURRENT_DAY_NAME: DAYS[now.getDay()], CURRENT_DAY_NUMBER: now.getDate(), CURRENT_DAY_FULL_DATE: now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
//   };
//   return String(text).replace(/\[([A-Z_]+)\]/g, (m, key) => (values[key] !== undefined && values[key] !== '' ? String(values[key]) : m));
// }
// /** Same for editor HTML: shortcode chips become plain text. */
// export const fillShortcodesHtml = (html = '', account) => fillShortcodes(
//   String(html).replace(/<span class="te-field"[^>]*>(\[[A-Z_]+\])<\/span>/g, '$1'), account,
// );

// export const newTask = (text = '', done = false) => ({ id: nid('task'), text, done });
// export const newMessage = (from, text, author, at = new Date().toISOString(), html = false) => ({ id: nid('m'), from, author, text, html, at });

// /** Build a chat for one account from the New Chat form. */
// export function chatFromForm(form, account, authorName) {
//   const now = new Date().toISOString();
//   const body = fillShortcodesHtml(form.description || '', account);
//   return {
//     id: nid('chat'),
//     subject: fillShortcodes(form.subject.trim(), account),
//     templateId: form.templateId || null,
//     status: 'active',
//     createdAt: now,
//     reminders: { enabled: !!form.sendReminders, days: Number(form.days) || 0, count: Number(form.count) || 0 },
//     tasks: form.tasks.filter((t) => t.text.trim()).map((t) => newTask(fillShortcodes(t.text.trim(), account), false)),
//     messages: body.replace(/<[^>]*>/g, '').trim() ? [newMessage('firm', body, authorName, now, true)] : [],
//     unread: 0,
//   };
// }

// export const lastMessage = (chat) => chat.messages[chat.messages.length - 1];
// export const lastActivity = (chat) => lastMessage(chat)?.at || chat.createdAt;

// /** Demo chats for an account that has none saved yet (stable ids per account). */
// export function demoChats(account) {
//   const c = primaryContact(account);
//   const first = c.firstName || 'there';
//   const client = contactName(c) || account.name;
//   const ago = (days, hours = 0) => new Date(Date.now() - days * 86400000 - hours * 3600000).toISOString();
//   const id = (k) => `chat-${account.id}-${k}`;
//   return [
//     {
//       id: id(1), subject: 'Missing receipts', templateId: 'ct-1', status: 'active', createdAt: ago(2, 5),
//       reminders: { enabled: true, days: 3, count: 3 },
//       tasks: [{ id: id('t1'), text: 'Upload card receipts', done: true }, { id: id('t2'), text: 'Upload cash receipts', done: false }],
//       messages: [
//         { id: id('m1'), from: 'firm', author: 'Mateo Rossi', html: true, at: ago(2, 5), text: `<p>Hi ${first},</p><p>We're closing the books and a few receipts are missing. 🧾 Could you upload them?</p>` },
//         { id: id('m2'), from: 'client', author: client, at: ago(1, 3), text: 'Sure! I uploaded the card receipts. Cash ones are coming tomorrow.' },
//         { id: id('m3'), from: 'firm', author: 'Mateo Rossi', at: ago(1, 2), text: 'Thank you, got them 👍' },
//         { id: id('m4'), from: 'client', author: client, at: ago(0, 1), text: 'Quick question — do parking receipts count?' },
//       ],
//       unread: 1,
//     },
//     {
//       id: id(2), subject: 'Your tax return is ready to sign', templateId: 'ct-2', status: 'active', createdAt: ago(6),
//       reminders: { enabled: false, days: 0, count: 0 },
//       tasks: [{ id: id('t3'), text: 'Review the return', done: true }, { id: id('t4'), text: 'Sign the e-file authorization', done: true }],
//       messages: [
//         { id: id('m5'), from: 'firm', author: 'Leila Nasser', html: true, at: ago(6), text: `<p>Hi ${first}, your return is ready. Please review and sign in your portal. ✍️</p>` },
//         { id: id('m6'), from: 'client', author: client, at: ago(5, 20), text: 'Signed ✓ Thanks for the quick turnaround!' },
//       ],
//       unread: 0,
//     },
//     {
//       id: id(3), subject: 'Welcome to the portal', templateId: 'ct-3', status: 'archived', createdAt: ago(40),
//       reminders: { enabled: false, days: 0, count: 0 }, tasks: [],
//       messages: [{ id: id('m7'), from: 'firm', author: 'Ava Thompson', html: true, at: ago(40), text: `<p>Welcome aboard, ${first}! 🎉 Use this chat any time you have a question.</p>` }],
//       unread: 0,
//     },
//   ];
// }

// Account chats (Communication tab): demo data, shortcode filling and helpers.
let seq = 0;
const nid = (p) => `${p}-${Date.now().toString(36)}${(seq += 1).toString(36)}${Math.random().toString(36).slice(2, 5)}`;

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** The account's main contact. */
export const primaryContact = (a) => (a.contacts || []).find((c) => c.primary) || (a.contacts || [])[0] || {};
export const contactName = (c = {}) => [c.firstName, c.lastName].filter(Boolean).join(' ') || c.name || '';

/** Replace [SHORTCODES] with this account's values (unknown ones stay as they are). */
export function fillShortcodes(text = '', account = {}, now = new Date()) {
  const c = primaryContact(account);
  const q = Math.floor(now.getMonth() / 3) + 1;
  const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const values = {
    ACCOUNT_NAME: account.name, FIRST_NAME: c.firstName, MIDDLE_NAME: c.middleName, LAST_NAME: c.lastName, CONTACT_NAME: contactName(c),
    COMPANY_NAME: account.company, PHONE_NUMBER: c.phone,
    CURRENT_YEAR: now.getFullYear(), LAST_YEAR: now.getFullYear() - 1, NEXT_YEAR: now.getFullYear() + 1,
    CURRENT_MONTH_NAME: MONTHS[now.getMonth()], LAST_MONTH_NAME: MONTHS[last.getMonth()], NEXT_MONTH_NAME: MONTHS[next.getMonth()],
    CURRENT_MONTH_NUMBER: now.getMonth() + 1, CURRENT_QUARTER: `Q${q}`, LAST_QUARTER: `Q${q === 1 ? 4 : q - 1}`, NEXT_QUARTER: `Q${q === 4 ? 1 : q + 1}`,
    CURRENT_DAY_NAME: DAYS[now.getDay()], CURRENT_DAY_NUMBER: now.getDate(), CURRENT_DAY_FULL_DATE: now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
  };
  return String(text).replace(/\[([A-Z_]+)\]/g, (m, key) => (values[key] !== undefined && values[key] !== '' ? String(values[key]) : m));
}
/** Same for editor HTML: shortcode chips become plain text. */
export const fillShortcodesHtml = (html = '', account) => fillShortcodes(
  String(html).replace(/<span class="te-field"[^>]*>(\[[A-Z_]+\])<\/span>/g, '$1'), account,
);

export const newTask = (text = '', done = false) => ({ id: nid('task'), text, done });
export const newMessage = (from, text, author, at = new Date().toISOString(), html = false) => ({ id: nid('m'), from, author, text, html, at });
/** A task card in the conversation (shows the live state of these tasks). */
export const newTasksMessage = (taskIds, author, at = new Date().toISOString()) => ({ id: nid('m'), type: 'tasks', from: 'firm', author, taskIds, text: '', at });

/** Build a chat for one account from the New Chat form. */
export function chatFromForm(form, account, authorName) {
  const now = new Date().toISOString();
  const body = fillShortcodesHtml(form.description || '', account);
  const tasks = form.tasks.filter((t) => t.text.trim()).map((t) => newTask(fillShortcodes(t.text.trim(), account), false));
  const messages = body.replace(/<[^>]*>/g, '').trim() ? [newMessage('firm', body, authorName, now, true)] : [];
  if (tasks.length) messages.push(newTasksMessage(tasks.map((t) => t.id), authorName, now));
  return {
    id: nid('chat'),
    subject: fillShortcodes(form.subject.trim(), account),
    templateId: form.templateId || null,
    status: 'active',
    createdAt: now,
    reminders: { enabled: !!form.sendReminders, days: Number(form.days) || 0, count: Number(form.count) || 0 },
    tasks,
    messages,
    unread: 0,
  };
}

export const lastMessage = (chat) => chat.messages[chat.messages.length - 1];
export const lastActivity = (chat) => lastMessage(chat)?.at || chat.createdAt;

/** Demo chats for an account that has none saved yet (stable ids per account). */
export function demoChats(account) {
  const c = primaryContact(account);
  const first = c.firstName || 'there';
  const client = contactName(c) || account.name;
  const ago = (days, hours = 0) => new Date(Date.now() - days * 86400000 - hours * 3600000).toISOString();
  const id = (k) => `chat-${account.id}-${k}`;
  return [
    {
      id: id(1), subject: 'Missing receipts', templateId: 'ct-1', status: 'active', createdAt: ago(2, 5),
      reminders: { enabled: true, days: 3, count: 3 },
      tasks: [{ id: id('t1'), text: 'Upload card receipts', done: true }, { id: id('t2'), text: 'Upload cash receipts', done: false }],
      messages: [
        { id: id('m1'), from: 'firm', author: 'Mateo Rossi', html: true, at: ago(2, 5), text: `<p>Hi ${first},</p><p>We're closing the books and a few receipts are missing. 🧾 Could you upload them?</p>` },
        { id: id('m1t'), type: 'tasks', from: 'firm', author: 'Mateo Rossi', at: ago(2, 5), taskIds: [id('t1'), id('t2')], text: '' },
        { id: id('m2'), from: 'client', author: client, at: ago(1, 3), text: 'Sure! I uploaded the card receipts. Cash ones are coming tomorrow.' },
        { id: id('m3'), from: 'firm', author: 'Mateo Rossi', at: ago(1, 2), text: 'Thank you, got them 👍' },
        { id: id('m4'), from: 'client', author: client, at: ago(0, 1), text: 'Quick question — do parking receipts count?' },
      ],
      unread: 1,
    },
    {
      id: id(2), subject: 'Your tax return is ready to sign', templateId: 'ct-2', status: 'active', createdAt: ago(6),
      reminders: { enabled: false, days: 0, count: 0 },
      tasks: [{ id: id('t3'), text: 'Review the return', done: true }, { id: id('t4'), text: 'Sign the e-file authorization', done: true }],
      messages: [
        { id: id('m5'), from: 'firm', author: 'Leila Nasser', html: true, at: ago(6), text: `<p>Hi ${first}, your return is ready. Please review and sign in your portal. ✍️</p>` },
        { id: id('m5t'), type: 'tasks', from: 'firm', author: 'Leila Nasser', at: ago(6), taskIds: [id('t3'), id('t4')], text: '' },
        { id: id('m6'), from: 'client', author: client, at: ago(5, 20), text: 'Signed ✓ Thanks for the quick turnaround!' },
      ],
      unread: 0,
    },
    {
      id: id(3), subject: 'Welcome to the portal', templateId: 'ct-3', status: 'archived', createdAt: ago(40),
      reminders: { enabled: false, days: 0, count: 0 }, tasks: [],
      messages: [{ id: id('m7'), from: 'firm', author: 'Ava Thompson', html: true, at: ago(40), text: `<p>Welcome aboard, ${first}! 🎉 Use this chat any time you have a question.</p>` }],
      unread: 0,
    },
  ];
}