// Invoices sent to accounts (account.invoices). Used by Billing → Invoices, the account Invoices tab
// and the "Send Invoice" automation.
import { calcTotals } from './invoiceTemplates';
import { fillShortcodes } from './accountChats';

let seq = 0;
export const invoiceId = () => `inv-${Date.now().toString(36)}${(seq += 1).toString(36)}${Math.random().toString(36).slice(2, 5)}`;
const DAY = 86400000;
const iso = (d) => new Date(d).toISOString().slice(0, 10);
export const today = () => iso(Date.now());

export const INVOICE_STATUSES = [
  { value: 'draft', label: 'Draft', tone: 'bg-chip text-muted' },
  { value: 'sent', label: 'Sent', tone: 'bg-brand-100 text-brand-800' },
  { value: 'overdue', label: 'Overdue', tone: 'bg-danger-50 text-danger-700' },
  { value: 'paid', label: 'Paid', tone: 'bg-success-50 text-success-700' },
];
export const statusInfo = (v) => INVOICE_STATUSES.find((s) => s.value === v) || INVOICE_STATUSES[0];

/** Draft / Sent / Overdue (sent and past due) / Paid. */
export function invoiceStatus(inv, now = today()) {
  if (inv.status === 'paid') return 'paid';
  if (inv.status === 'draft') return 'draft';
  return inv.dueDate && inv.dueDate < now ? 'overdue' : 'sent';
}

/** Fill in fields older / automation-made invoices may not have (number, dates). */
export function normalizeInvoice(inv, fallbackNumber) {
  const issue = inv.issueDate || (inv.sentAt ? iso(inv.sentAt) : today());
  return {
    status: 'sent',
    ...inv,
    number: inv.number || fallbackNumber || `INV-${String(inv.id).slice(-5).toUpperCase()}`,
    name: inv.name || 'Invoice',
    total: Number(inv.total) || 0,
    issueDate: issue,
    dueDate: inv.dueDate || iso(new Date(`${issue}T00:00:00`).getTime() + 14 * DAY),
  };
}

/** Demo invoices for accounts with none saved yet (stable per account). */
export function demoInvoices(account, templates = [], index = 0) {
  const t = (id) => templates.find((x) => x.id === id);
  const make = (k, tplId, daysAgo, status, dueIn = 14) => {
    const tpl = t(tplId);
    if (!tpl) return null;
    const issue = Date.now() - daysAgo * DAY;
    return {
      id: `inv-${account.id}-${k}`,
      number: `INV-${1001 + index * 3 + k}`,
      templateId: tpl.id,
      name: fillShortcodes(tpl.description || tpl.templatename, account),
      total: calcTotals(tpl.rows, tpl.taxRate).totalAmount,
      status,
      issueDate: iso(issue),
      dueDate: iso(issue + dueIn * DAY),
      ...(status === 'paid' ? { paidAt: iso(issue + 6 * DAY) } : {}),
    };
  };
  // a mix: one paid, one sent (maybe overdue), one draft — varies by account
  const plans = [
    [[0, 'it-1', 40, 'paid'], [1, 'it-1', 10, 'sent'], [2, 'it-5', 2, 'draft']],
    [[0, 'it-2', 30, 'sent'], [1, 'it-4', 5, 'sent']],
    [[0, 'it-3', 60, 'paid'], [1, 'it-3', 25, 'sent', 10]],
  ];
  return plans[index % plans.length].map((p) => make(...p)).filter(Boolean);
}

/** An account's invoices (its saved list, else demo invoices), normalised. */
export function invoicesOf(account, templates = [], index = 0) {
  const list = account.invoices ?? demoInvoices(account, templates, index);
  return list.map((inv) => normalizeInvoice(inv));
}

/** Next free invoice number across all accounts' invoices. */
export function nextInvoiceNumber(all) {
  const max = all.reduce((m, inv) => Math.max(m, Number(String(inv.number || '').replace(/\D/g, '')) || 0), 1000);
  return `INV-${max + 1}`;
}