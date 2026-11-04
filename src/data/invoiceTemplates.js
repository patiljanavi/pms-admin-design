// Invoice templates: options, blank form, totals helper and dummy data. Field names match the invoice form.
export const PAYMENT_OPTIONS = [
  { value: 'bank_debit', label: 'Bank Debits' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'card_or_bank', label: 'Credit Card or Bank Debits' },
  { value: 'check', label: 'Check' },
  { value: 'none', label: 'No online payment' },
];
export const paymentLabel = (m) => m?.label || PAYMENT_OPTIONS.find((o) => o.value === m?.value)?.label || '—';

const rid = () => `row-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
/** One line item. serviceId links to a service (or null for a custom item). */
export const newRow = (data = {}) => ({ id: rid(), serviceId: null, productName: '', description: '', rate: 0, qty: 1, tax: false, ...data });
export const rowAmount = (r) => (Number(r.rate) || 0) * (Number(r.qty) || 0);

/** Subtotal, tax (on rows marked "tax") and total. */
export function calcTotals(rows = [], taxRate = 0) {
  const subtotal = rows.reduce((s, r) => s + rowAmount(r), 0);
  const taxable = rows.filter((r) => r.tax).reduce((s, r) => s + rowAmount(r), 0);
  const taxTotal = Math.round(taxable * (Number(taxRate) || 0)) / 100;
  return { subtotal, taxTotal, totalAmount: subtotal + taxTotal };
}
export const money = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(n) || 0);

export const emptyInvoiceTemplate = {
  templatename: '',
  description: '',              // invoice description (shortcodes allowed)
  paymentMode: PAYMENT_OPTIONS[2],
  emailToClient: false,
  clientmsg: '',                // email message when the invoice is created
  payUsingCredits: false,
  invoiceReminders: false,
  daysNextReminder: 3,
  numOfReminder: 2,
  rows: [],                     // line items
  taxRate: 0,                   // %
  clientNote: '',               // HTML from the text editor
};

const pm = (value) => PAYMENT_OPTIONS.find((o) => o.value === value);
const line = (serviceId, productName, rate, qty = 1, tax = false, description = '') => newRow({ serviceId, productName, rate, qty, tax, description });
const tpl = (id, data) => ({ ...emptyInvoiceTemplate, id, ...data });

export const seedInvoiceTemplates = [
  tpl('it-1', { templatename: 'Monthly bookkeeping', description: '[LAST_MONTH_NAME] bookkeeping for [ACCOUNT_NAME]', paymentMode: pm('card_or_bank'),
    rows: [line('svc-5', 'Monthly bookkeeping', 450, 1, true), line('svc-6', 'Bank reconciliation', 95, 2, true)], taxRate: 8.25,
    emailToClient: true, clientmsg: 'Hi [CONTACT_NAME], your [LAST_MONTH_NAME] invoice is ready.', invoiceReminders: true, updatedAt: '2026-03-02' }),
  tpl('it-2', { templatename: 'Individual tax return', description: '[CURRENT_YEAR] individual tax preparation', paymentMode: pm('credit_card'),
    rows: [line('svc-1', 'Individual tax return (1040)', 600), line('svc-2', 'State tax return', 150)], payUsingCredits: true, updatedAt: '2026-03-12' }),
  tpl('it-3', { templatename: 'Business tax return', description: '[CURRENT_YEAR] S-corp return for [ACCOUNT_NAME]', paymentMode: pm('bank_debit'),
    rows: [line('svc-3', 'Business tax return (1120-S)', 1200), line('svc-2', 'State tax return', 150)], invoiceReminders: true, daysNextReminder: 7, numOfReminder: 3, updatedAt: '2026-04-01' }),
  tpl('it-4', { templatename: 'Payroll – bi-weekly', description: 'Payroll runs for [CURRENT_MONTH_NAME]', paymentMode: pm('bank_debit'),
    rows: [line('svc-7', 'Payroll processing', 120, 2, true)], taxRate: 8.25, updatedAt: '2026-04-18' }),
  tpl('it-5', { templatename: 'Quarterly estimates', description: '[CURRENT_QUARTER] estimated tax calculation', paymentMode: pm('card_or_bank'),
    rows: [line('svc-4', 'Quarterly tax estimates', 125)], emailToClient: true, clientmsg: 'Your [CURRENT_QUARTER] estimate invoice is attached.', updatedAt: '2026-05-06' }),
  tpl('it-6', { templatename: '1099 filing package', description: 'Contractor 1099s for [LAST_YEAR]', paymentMode: pm('credit_card'),
    rows: [line('svc-8', '1099 preparation', 25, 12)], updatedAt: '2026-05-25' }),
  tpl('it-7', { templatename: 'Advisory retainer', description: 'Monthly advisory retainer', paymentMode: pm('card_or_bank'),
    rows: [line('svc-9', 'Advisory hour', 175, 4, true)], taxRate: 8.25, payUsingCredits: true, invoiceReminders: true, updatedAt: '2026-06-14' }),
  tpl('it-8', { templatename: 'Year-end package', description: '[CURRENT_YEAR] year-end close for [ACCOUNT_NAME]', paymentMode: pm('check'),
    rows: [line('svc-10', 'Year-end close', 800, 1, true), line('svc-6', 'Bank reconciliation', 95, 3, true), line(null, 'Rush fee', 250, 1, false, 'Completed within 5 days')],
    taxRate: 8.25, clientNote: '<p>Thank you for a great year! 🎉</p>', updatedAt: '2026-07-30' }),
  tpl('it-9', { templatename: 'New client setup', description: 'Onboarding for [ACCOUNT_NAME]', paymentMode: pm('none'),
    rows: [line(null, 'Setup fee', 300, 1, false, 'Chart of accounts and software setup'), line('svc-9', 'Advisory hour', 175, 2, true)], taxRate: 8.25, updatedAt: '2026-08-21' }),
  tpl('it-10', { templatename: 'Full-service tax + books', description: 'Bookkeeping and tax for [CURRENT_YEAR]', paymentMode: pm('card_or_bank'),
    rows: [line('svc-5', 'Monthly bookkeeping', 450, 12, true), line('svc-3', 'Business tax return (1120-S)', 1200), line('svc-1', 'Individual tax return (1040)', 600)],
    taxRate: 8.25, emailToClient: true, clientmsg: 'Hi [CONTACT_NAME], here is your annual invoice.', invoiceReminders: true, daysNextReminder: 5, numOfReminder: 4,
    clientNote: '<p>Payment is due within <b>15 days</b>.</p>', updatedAt: '2026-09-30' }),
];