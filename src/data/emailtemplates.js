// Email templates: options + dummy data (replace with your API later).
import { TEAM_MEMBERS } from './sampleData';
import { accountShortcuts, contactShortcuts } from './shortcodes';

export const EMAIL_MODES = [
  { value: 'contacts', label: 'Contact Shortcodes' },
  { value: 'account', label: 'Account Shortcodes' },
];
/** Shortcodes for a mode: 'contacts' → contactShortcuts, 'account' → accountShortcuts */
export const shortcutsForMode = (mode) => (mode === 'account' ? accountShortcuts : contactShortcuts);
export const modeLabel = (mode) => EMAIL_MODES.find((m) => m.value === mode)?.label || mode;

/** Senders for the "From" field ({ value, label } like your userData). */
export const SENDERS = TEAM_MEMBERS.map((m) => ({ value: m.value, label: m.label }));

/** Attachments */
export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
export const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png'];
export const formatSize = (bytes) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(2)} MB` : `${(bytes / 1024).toFixed(2)} KB`);

/** Blank form (field names match the form). */
export const emptyEmailTemplate = {
  templateName: '',
  mode: 'contacts',
  selectedUser: null,   // { value, label }
  subject: '',
  emailBody: '',
  files: [],            // [{ id, name, size, type }]
};

const sender = (name) => SENDERS.find((s) => s.label === name) || null;
const field = (key) => `<span class="te-field" contenteditable="false" data-field="${key}">[${key}]</span>`;

export const seedEmailTemplates = [
  { ...emptyEmailTemplate, id: 'et-1', templateName: 'Welcome to the firm', mode: 'contacts', selectedUser: sender('Ava Thompson'),
    subject: 'Welcome aboard, [FIRST_NAME]!',
    emailBody: `<p>Hi ${field('FIRST_NAME')},</p><p>Welcome to the firm! 🎉 We're excited to work with <b>${field('COMPANY_NAME')}</b>.</p><ul><li>Your portal invite is on its way</li><li>Your account manager will call you this week</li></ul>`,
    files: [{ id: 'f-1', name: 'Welcome-guide.pdf', size: 482113, type: 'application/pdf' }], updatedAt: '2026-03-10' },
  { ...emptyEmailTemplate, id: 'et-2', templateName: 'Document reminder', mode: 'contacts', selectedUser: sender('Leila Nasser'),
    subject: 'Reminder: documents due [NEXT_WEEK]',
    emailBody: `<p>Hi ${field('FIRST_NAME')},</p><p>A quick reminder that we still need a few documents before ${field('NEXT_WEEK')}. 📎</p>`,
    updatedAt: '2026-04-11' },
  { ...emptyEmailTemplate, id: 'et-3', templateName: 'Monthly report ready', mode: 'account', selectedUser: sender('Jonas Berg'),
    subject: '[ACCOUNT_NAME] — [LAST_MONTH_NAME] report',
    emailBody: `<p>Hello,</p><p>The ${field('LAST_MONTH_NAME')} report for ${field('ACCOUNT_NAME')} is ready. 📊</p>`,
    files: [{ id: 'f-2', name: 'Report-template.xlsx', size: 91234, type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }], updatedAt: '2026-05-12' },
  { ...emptyEmailTemplate, id: 'et-4', templateName: 'Quarter-end checklist', mode: 'account', selectedUser: sender('Samuel Adeyemi'),
    subject: '[CURRENT_QUARTER] close checklist for [ACCOUNT_NAME]',
    emailBody: `<p>Hi team,</p><p>Here is the ${field('CURRENT_QUARTER')} close checklist. ✅</p>`, updatedAt: '2026-06-20' },
  { ...emptyEmailTemplate, id: 'et-5', templateName: 'Invoice sent', mode: 'contacts', selectedUser: sender('Elena Ruiz'),
    subject: 'Your invoice from us', emailBody: `<p>Hi ${field('CONTACT_NAME')},</p><p>Your invoice is attached. 🧾</p>`, updatedAt: '2026-08-02' },
];