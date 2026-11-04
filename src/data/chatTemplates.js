// Chat templates: blank form + dummy data (replace with your API later).
// Field names match the chat template form.
import { SENDERS } from './emailtemplates';

export const emptyChatTemplate = {
  templateName: '',
  selecteduser: null,          // { value, label } — who the chat is from
  inputText: '',               // subject (with shortcodes like [FIRST_NAME])
  description: '',             // message body (HTML from the text editor)
  sendReminders: false,
  daysuntilNextReminder: 3,
  noOfReminder: 2,
  SubtaskSwitch: false,        // "Enable Client Tasks"
  subtasks: [],                // [{ id, text, checked }]
};

const from = (name) => SENDERS.find((s) => s.label === name) || null;
const field = (key) => `<span class="te-field" contenteditable="false" data-field="${key}">[${key}]</span>`;
const tasks = (id, items) => items.map((text, i) => ({ id: `${id}-s${i + 1}`, text, checked: false }));
const chat = (id, data) => ({ ...emptyChatTemplate, id, ...data });

export const seedChatTemplates = [
  chat('ct-1', { templateName: 'Missing receipts', selecteduser: from('Mateo Rossi'), inputText: 'A few receipts are missing for [LAST_MONTH_NAME]',
    description: `<p>Hi ${field('FIRST_NAME')},</p><p>We're closing the books for ${field('LAST_MONTH_NAME')} and a few receipts are missing. 🧾</p>`,
    sendReminders: true, daysuntilNextReminder: 3, noOfReminder: 3, SubtaskSwitch: true, subtasks: tasks('ct-1', ['Upload card receipts', 'Upload cash receipts']), updatedAt: '2026-03-04' }),
  chat('ct-2', { templateName: 'Signature reminder', selecteduser: from('Leila Nasser'), inputText: 'Your [CURRENT_YEAR] return is ready to sign',
    description: `<p>Hi ${field('FIRST_NAME')},</p><p>Your return is ready. Please review and sign in your portal. ✍️</p>`,
    sendReminders: true, daysuntilNextReminder: 2, noOfReminder: 4, SubtaskSwitch: true, subtasks: tasks('ct-2', ['Review the return', 'Sign the e-file authorization']), updatedAt: '2026-03-18' }),
  chat('ct-3', { templateName: 'Welcome to the portal', selecteduser: from('Ava Thompson'), inputText: 'Welcome, [FIRST_NAME]!',
    description: `<p>Hi ${field('FIRST_NAME')}, welcome aboard! 🎉 Use this chat any time you have a question.</p>`, updatedAt: '2026-04-02' }),
  chat('ct-4', { templateName: 'Bank statements request', selecteduser: from('Mateo Rossi'), inputText: 'Bank statements for [LAST_MONTH_NAME]',
    description: '<p>Please upload last month\'s statements for every business account. 🏦</p>', sendReminders: true, daysuntilNextReminder: 5, noOfReminder: 2,
    SubtaskSwitch: true, subtasks: tasks('ct-4', ['Checking account statement', 'Savings account statement', 'Credit card statement']), updatedAt: '2026-04-15' }),
  chat('ct-5', { templateName: 'Payroll hours check', selecteduser: from('Nina Petrova'), inputText: 'Confirm hours for this pay period',
    description: '<p>Please confirm employee hours before we run payroll on Friday. ⏰</p>', sendReminders: true, daysuntilNextReminder: 1, noOfReminder: 2, updatedAt: '2026-05-01' }),
  chat('ct-6', { templateName: 'Quarterly estimate due', selecteduser: from('Leila Nasser'), inputText: '[CURRENT_QUARTER] estimated tax payment',
    description: `<p>Your ${field('CURRENT_QUARTER')} estimated payment is due soon. We've attached the voucher. 📅</p>`, updatedAt: '2026-05-20' }),
  chat('ct-7', { templateName: 'Organizer follow-up', selecteduser: from('Elena Ruiz'), inputText: 'Your tax organizer is waiting',
    description: '<p>Just a reminder to finish your tax organizer so we can get started. 📋</p>', sendReminders: true, daysuntilNextReminder: 7, noOfReminder: 3,
    SubtaskSwitch: true, subtasks: tasks('ct-7', ['Complete income section', 'Complete deductions section', 'Submit the organizer']), updatedAt: '2026-06-03' }),
  chat('ct-8', { templateName: 'Invoice question', selecteduser: from('Elena Ruiz'), inputText: 'About your latest invoice',
    description: '<p>Do you have any questions about the invoice we sent? We are happy to help. 💬</p>', updatedAt: '2026-06-28' }),
  chat('ct-9', { templateName: '1099 contractor details', selecteduser: from('Jonas Berg'), inputText: 'Contractor details for 1099s',
    description: '<p>We need W-9 details for each contractor you paid this year.</p>', sendReminders: true, daysuntilNextReminder: 4, noOfReminder: 3,
    SubtaskSwitch: true, subtasks: tasks('ct-9', ['List all contractors', 'Upload each W-9']), updatedAt: '2026-07-14' }),
  chat('ct-10', { templateName: 'Audit document request', selecteduser: from('Samuel Adeyemi'), inputText: 'Documents for your [CURRENT_YEAR] audit',
    description: '<p>To prepare for the audit, please upload the items in the checklist. 🔍</p>', sendReminders: true, daysuntilNextReminder: 3, noOfReminder: 5,
    SubtaskSwitch: true, subtasks: tasks('ct-10', ['General ledger export', 'Fixed asset register', 'Loan agreements', 'Board minutes']), updatedAt: '2026-08-09' }),
  chat('ct-11', { templateName: 'Year-end checklist', selecteduser: from('Jonas Berg'), inputText: 'Year-end checklist for [ACCOUNT_NAME]',
    description: '<p>Here is everything we need to close the year. ✅</p>', SubtaskSwitch: true,
    subtasks: tasks('ct-11', ['Inventory count', 'Outstanding invoices list', 'Payroll summary']), updatedAt: '2026-09-22' }),
  chat('ct-12', { templateName: 'Thank you note', selecteduser: from('Ava Thompson'), inputText: 'Thank you, [FIRST_NAME]',
    description: '<p>Thanks for working with us this year! 🙏</p>', updatedAt: '2026-10-05' }),
];