// Payments (Account → Invoices → Payments, "Pay invoice", "+ New → Offline Payment").
// Payment: { id, number: 'PAY-1001', accountId, status: 'succeeded' | 'refunded' | 'voided',
//            amount (money received), creditApplied (client credit used), credit (extra kept as client credit),
//            allocations: [{ invoiceId, amount }] (what it paid on each invoice), invoiceIds, refund (amount refunded),
//            method, provider ('Offline' | 'Client credit'), date: 'YYYY-MM-DD', description, notifyClient, recordedBy, createdAt }
// Only succeeded payments count. Invoice paid = sum of its allocations; balance = total − paid.
// Client credit of an account = credit added − credit applied (succeeded payments).
// Stored on the account: account.payments (accounts without saved payments get demo history).

export const PAYMENT_METHODS = ['Cash', 'Bank Debits', 'Credit Card', 'Credit Card or Bank Debits'];

let seq = 0;
export const paymentId = () => `pay-${Date.now().toString(36)}${(seq += 1).toString(36)}${Math.random().toString(36).slice(2, 5)}`;

/** "$ 1,234.5" / "1234.50" → 1234.5 */
export const parseAmount = (v) => Number(String(v ?? '').replace(/[^0-9.]/g, '')) || 0;
/** Keep only digits and one '.', max 2 decimals (like your Amount field). */
export const cleanAmountInput = (v) => {
  let s = String(v ?? '').replace(/[^0-9.]/g, '');
  const parts = s.split('.');
  if (parts.length > 2) s = `${parts[0]}.${parts.slice(1).join('')}`;
  if (s.includes('.')) { const [w, d] = s.split('.'); s = `${w}.${d.slice(0, 2)}`; }
  return s;
};
export const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

/** Next payment number (PAY-1001, PAY-1002, …) across all payments. */
export const nextPaymentNumber = (payments = []) => {
  const max = payments.reduce((m, p) => Math.max(m, Number(String(p.number || '').replace(/\D/g, '')) || 0), 1000);
  return `PAY-${max + 1}`;
};

/** Invoices that can still be paid: sent, overdue or partially paid (not drafts, not fully paid). */
export const isSettleable = (inv) => inv.state !== 'draft' && inv.state !== 'paid' && (inv.balance ?? inv.total) > 0;

/** Invoice status labels, including Partially paid. */
export const INVOICE_STATE_LABEL = { draft: 'Draft', sent: 'Sent', overdue: 'Overdue', partial: 'Partially paid', paid: 'Paid' };
export const PAYMENT_STATUS_LABEL = { succeeded: 'Succeeded', refunded: 'Refunded', voided: 'Voided' };

/** Fill in fields older payments may not have (allocations, status, provider…). totalOf(invoiceId) = the invoice total. */
export function normalizePayment(p, totalOf = () => 0) {
  const allocations = p.allocations || (p.invoiceIds || []).map((id) => ({ invoiceId: id, amount: round2(totalOf(id)) }));
  const amount = round2(p.amount);
  const creditApplied = round2(p.creditApplied || 0);
  return {
    status: 'succeeded', refund: 0, credit: 0, notifyClient: false, description: '',
    ...p,
    amount, creditApplied, allocations, invoiceIds: allocations.map((a) => a.invoiceId),
    provider: p.provider || (amount > 0 ? 'Offline' : 'Client credit'),
    method: p.method || (amount > 0 ? 'Cash' : 'Client credit'),
  };
}
const counts = (p) => p.status === 'succeeded';
/** Paid / balance / state for each invoice from the (succeeded) payments. Fully paid stays 'paid'; some paid → 'partial'. */
export function withPayments(invoices, payments) {
  const paidOf = new Map();
  payments.filter(counts).forEach((p) => p.allocations.forEach((a) => paidOf.set(a.invoiceId, round2((paidOf.get(a.invoiceId) || 0) + a.amount))));
  return invoices.map((inv) => {
    const total = round2(inv.total);
    const fromPayments = paidOf.get(inv.id) || 0;
    const paid = inv.state === 'paid' ? total : Math.min(total, fromPayments);   // "Mark as paid" = fully paid
    const balance = round2(total - paid);
    const state = inv.state === 'draft' ? 'draft' : total > 0 && balance <= 0 ? 'paid' : paid > 0 ? 'partial' : inv.state;
    return { ...inv, paid: round2(paid), balance: Math.max(0, balance), state };
  });
}
/** Client credit available for an account: credit added − credit applied (succeeded payments). */
export const creditBalance = (payments, accountId) => round2(payments.filter((p) => p.accountId === accountId && counts(p))
  .reduce((s, p) => s + (p.credit || 0) - (p.creditApplied || 0), 0));

const hashOf = (s) => [...String(s)].reduce((n, c) => (n * 31 + c.charCodeAt(0)) % 100003, 7);
/** Demo history: one payment per paid invoice (stable per account). */
export function demoPayments(account, accountInvoices = []) {
  const paid = accountInvoices.filter((i) => i.state === 'paid');
  const h0 = hashOf(account.id);
  const retainer = h0 % 3 === 0 ? [{
    id: `pay-${account.id}-retainer`, number: `PAY-R${String(h0 % 1000).padStart(3, '0')}`, accountId: account.id,
    amount: [50, 100, 150][h0 % 3 === 0 ? (h0 >> 2) % 3 : 0], applied: 0, credit: 0, method: 'Bank Debits',
    date: '2026-09-15', description: 'Retainer — kept as client credit', notifyClient: false, invoiceIds: [], allocations: [],
    recordedBy: 'Samuel Adeyemi', createdAt: '2026-09-15T10:00:00.000Z',
  }].map((r) => ({ ...r, credit: r.amount })) : [];
  return [...retainer, ...paid.map((inv, i) => {
    const h = hashOf(`${account.id}-${inv.id}`);
    const date = String(inv.paidAt || inv.dueDate || inv.issueDate || '').slice(0, 10);
    return {
      id: `pay-${account.id}-demo-${i}`,
      number: `PAY-${String(inv.number).replace(/\D/g, '')}`,  // stable: follows the invoice number (INV-1004 → PAY-1004)
      accountId: account.id,
      amount: inv.total, applied: inv.total, credit: 0,
      method: PAYMENT_METHODS[h % PAYMENT_METHODS.length],
      date,
      description: `Payment for ${inv.number}`,
      notifyClient: h % 2 === 0,
      invoiceIds: [inv.id],
      recordedBy: 'Ava Thompson',
      createdAt: date ? `${date}T15:00:00.000Z` : new Date().toISOString(),
    };
  })];
}
