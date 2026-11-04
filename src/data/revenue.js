// Revenue figures for the Insights page, derived from the sample accounts and plan prices.
// Replace these helpers with API calls when you connect a backend.
import { PLAN_PRICE, seedAccounts } from './sampleData';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const PLANS = ['Starter', 'Pro', 'Enterprise'];
export const PLAN_COLOR = { Starter: 'bg-[#9AA4B2]', Pro: 'bg-brand-600', Enterprise: 'bg-violet-600' };

// "Today" for the sample data: October 2026.
const CURRENT_MONTH = 9; // 0-based index of Oct
const CURRENT_YEAR = 2026;

const joinedMonth = (a) => MONTHS.indexOf(a.joined.split(' ')[0]); // 0-based, all joined in 2026

/** Monthly recurring revenue right now: every Active account pays its plan price. */
export function currentMrr(accounts = seedAccounts) {
  return accounts.filter((a) => a.status === 'Active').reduce((s, a) => s + PLAN_PRICE[a.plan], 0);
}

/**
 * Revenue for each of the last `count` months (oldest first).
 * An account pays from the month after it joined; suspended accounts stopped paying 2 months ago;
 * pending accounts have not paid yet. One-off onboarding fees are added in the month an account joined.
 */
export function monthlyRevenue(count = 12, accounts = seedAccounts) {
  const rows = [];
  for (let k = count - 1; k >= 0; k -= 1) {
    const offset = CURRENT_MONTH - k;                     // can go negative (previous year)
    const monthIdx = ((offset % 12) + 12) % 12;
    const year = offset < 0 ? CURRENT_YEAR - 1 : CURRENT_YEAR;
    let subscriptions = 0;
    let onboarding = 0;
    accounts.forEach((a) => {
      const jm = joinedMonth(a);
      if (year < CURRENT_YEAR) return;                    // sample accounts all joined in 2026
      if (offset === jm) onboarding += 150;               // one-off setup fee
      const paying = a.status === 'Active' || (a.status === 'Suspended' && offset <= CURRENT_MONTH - 2);
      if (paying && offset > jm) subscriptions += PLAN_PRICE[a.plan];
    });
    rows.push({ key: `${year}-${monthIdx}`, label: MONTHS[monthIdx], year, subscriptions, onboarding, total: subscriptions + onboarding });
  }
  return rows;
}

/** Lifetime revenue per account, highest first. */
export function revenueByAccount(accounts = seedAccounts) {
  return accounts.map((a) => {
    const jm = joinedMonth(a);
    const lastPaid = a.status === 'Active' ? CURRENT_MONTH : a.status === 'Suspended' ? CURRENT_MONTH - 2 : jm;
    const months = Math.max(0, lastPaid - jm);
    return { ...a, months, lifetime: months * PLAN_PRICE[a.plan] + 150, mrr: a.status === 'Active' ? PLAN_PRICE[a.plan] : 0 };
  }).sort((x, y) => y.lifetime - x.lifetime);
}

/** Current MRR split by plan. */
export function revenueByPlan(accounts = seedAccounts) {
  const total = currentMrr(accounts) || 1;
  return PLANS.map((plan) => {
    const list = accounts.filter((a) => a.plan === plan && a.status === 'Active');
    const mrr = list.length * PLAN_PRICE[plan];
    return { plan, accounts: list.length, mrr, share: Math.round((mrr / total) * 100) };
  });
}

/** The latest invoice for every account: Pending accounts owe this month, Suspended ones are overdue. */
export function recentInvoices(accounts = seedAccounts) {
  return accounts.map((a, i) => {
    const status = a.status === 'Active' ? 'Paid' : a.status === 'Pending' ? 'Due' : 'Overdue';
    const date = status === 'Overdue' ? 'Aug 1, 2026' : 'Oct 1, 2026';
    return { no: `INV-${a.id.slice(3)}-12`, accountId: a.id, account: a.name, company: a.company, plan: a.plan, date, amount: PLAN_PRICE[a.plan], status, order: i };
  });
}

export const formatMoney = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
