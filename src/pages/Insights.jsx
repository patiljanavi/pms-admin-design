import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowDownRight, FiArrowUpRight, FiBell, FiCheck, FiDownload, FiMail } from 'react-icons/fi';
import { Avatar, Segmented, cx, initials } from '../components/ui';
import { PLAN_COLOR, currentMrr, formatMoney, monthlyRevenue, recentInvoices, revenueByAccount, revenueByPlan } from '../data/revenue';
import { ACCOUNTS_PATH } from '../config';
import Pagination, { usePagination } from '../components/Pagination';
import { BarSelect, BulkBar, HeaderCheckbox, SelectCheckbox, SelectedOnlyFilter, barButton, downloadCsv, useSelection } from '../components/TableSelection';

// Sample accounts all joined in 2026, so the longest useful window is year to date (Jan–Oct).
const PERIODS = { 'Last 6 months': 6, 'Year to date': 10 };
const PERIOD_TEXT = { 'Last 6 months': 'the last 6 months', 'Year to date': 'year to date' };
const INVOICE_STATUS = {
  Paid: 'bg-success-50 text-success-700',
  Due: 'bg-warning-50 text-warning-700',
  Overdue: 'bg-danger-50 text-danger-700',
};

function pct(curr, prev) {
  if (!prev) return null;
  return Math.round(((curr - prev) / prev) * 1000) / 10;
}

/* ---------- KPI card ---------- */
function KpiCard({ label, value, hint, change, tone = 'default' }) {
  const up = change != null && change >= 0;
  return (
    <div className="card flex flex-col gap-2 p-5">
      <div className="text-sm text-muted">{label}</div>
      <div className={cx('text-2xl font-bold', tone === 'danger' && 'text-danger-700')}>{value}</div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {change != null && (
          <span className={cx('inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-semibold', up ? 'bg-success-50 text-success-700' : 'bg-danger-50 text-danger-700')}>
            {up ? <FiArrowUpRight aria-hidden="true" /> : <FiArrowDownRight aria-hidden="true" />}
            {Math.abs(change)}%
          </span>
        )}
        <span className="text-muted">{hint}</span>
      </div>
    </div>
  );
}

/* ---------- Revenue chart (SVG, no library) ---------- */
function RevenueChart({ data }) {
  const [hover, setHover] = useState(null);
  const W = 720; const H = 280; const padL = 56; const padB = 32; const padT = 16; const padR = 8;
  const max = Math.max(...data.map((d) => d.total), 1);
  const niceMax = Math.ceil(max / 500) * 500 || 500;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(niceMax * t));
  const plotW = W - padL - padR; const plotH = H - padT - padB;
  const slot = plotW / data.length; const barW = Math.min(36, slot * 0.6);
  const y = (v) => padT + plotH - (v / niceMax) * plotH;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img"
        aria-label={`Monthly revenue: ${data.map((d) => `${d.label} ${formatMoney(d.total)}`).join(', ')}`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} stroke="#E2E7EF" strokeDasharray={t === 0 ? '' : '4 4'} />
            <text x={padL - 10} y={y(t) + 4} textAnchor="end" fontSize="12" fill="#5A6577">{t >= 1000 ? `$${(t / 1000).toFixed(t % 1000 ? 1 : 0)}k` : `$${t}`}</text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = padL + slot * i + (slot - barW) / 2;
          const subH = (d.subscriptions / niceMax) * plotH;
          const oneH = (d.onboarding / niceMax) * plotH;
          const active = hover === i;
          return (
            <g key={d.key} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={padL + slot * i} y={padT} width={slot} height={plotH} fill={active ? '#F0F4FF' : 'transparent'} />
              <rect x={x} y={y(d.subscriptions)} width={barW} height={subH} rx="3" fill={active ? '#1E40AF' : '#1D4ED8'} />
              {d.onboarding > 0 && <rect x={x} y={y(d.total)} width={barW} height={Math.max(oneH - 1, 0)} rx="3" fill="#93AEF5" />}
              <text x={x + barW / 2} y={H - 10} textAnchor="middle" fontSize="12" fill={active ? '#0F1B2D' : '#5A6577'} fontWeight={active ? 600 : 400}>{d.label}</text>
            </g>
          );
        })}
      </svg>
      {hover != null && (
        <div className="pointer-events-none absolute top-2 rounded-md bg-ink px-3 py-2 text-sm text-white shadow-pop"
          style={{ left: `${((padL + slot * hover + slot / 2) / W) * 100}%`, transform: 'translateX(-50%)' }}>
          <div className="font-semibold">{data[hover].label} {data[hover].year}</div>
          <div>Total {formatMoney(data[hover].total)}</div>
          <div className="text-[#C9D2E0]">Subscriptions {formatMoney(data[hover].subscriptions)} · Onboarding {formatMoney(data[hover].onboarding)}</div>
        </div>
      )}
      <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted">
        <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-brand-600" />Subscriptions</span>
        <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-[#93AEF5]" />Onboarding fees</span>
      </div>
    </div>
  );
}

/* ---------- Page ---------- */
export default function Insights() {
  const [period, setPeriod] = useState('Year to date');
  const [invoiceFilter, setInvoiceFilter] = useState('All');

  const months = useMemo(() => monthlyRevenue(PERIODS[period]), [period]);
  const allMonths = useMemo(() => monthlyRevenue(2), []);
  const mrr = currentMrr();
  const byPlan = useMemo(() => revenueByPlan(), []);
  const topAccounts = useMemo(() => revenueByAccount(), []); // all accounts, ranked by lifetime revenue
  const [invoices, setInvoices] = useState(recentInvoices);
  const [toast, setToast] = useState('');
  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2600); };

  // Selection: Top accounts table
  const topSel = useSelection();
  const [topSelectedOnly, setTopSelectedOnly] = useState(false);
  const [topPlan, setTopPlan] = useState('All');
  useEffect(() => { if (topSel.count === 0) { setTopSelectedOnly(false); setTopPlan('All'); } }, [topSel.count]);
  const filteredTop = topAccounts.filter((a) => (!topSelectedOnly || topSel.has(a.id)) && (topPlan === 'All' || a.plan === topPlan));
  const topPaging = usePagination(filteredTop, { initialSize: 10, storageKey: 'insights-top' });
  const shownTop = topPaging.pageItems;
  const topSelectedRows = topAccounts.filter((a) => topSel.has(a.id));

  // Selection: Recent invoices table
  const invSel = useSelection();
  const [invSelectedOnly, setInvSelectedOnly] = useState(false);
  const [invPlan, setInvPlan] = useState('All');
  useEffect(() => { if (invSel.count === 0) { setInvSelectedOnly(false); setInvPlan('All'); } }, [invSel.count]);

  const periodTotal = months.reduce((s, m) => s + m.total, 0);
  const last = allMonths[allMonths.length - 1]; const prev = allMonths[allMonths.length - 2];
  const activeCount = byPlan.reduce((s, p) => s + p.accounts, 0);
  const arpa = activeCount ? Math.round(mrr / activeCount) : 0;
  const unpaid = invoices.filter((i) => i.status !== 'Paid');
  const outstanding = unpaid.reduce((s, i) => s + i.amount, 0);
  const overdueCount = invoices.filter((i) => i.status === 'Overdue').length;
  const filteredInvoices = invoices.filter((i) => (invoiceFilter === 'All' || i.status === invoiceFilter)
    && (!invSelectedOnly || invSel.has(i.no)) && (invPlan === 'All' || i.plan === invPlan));
  const invPaging = usePagination(filteredInvoices, { initialSize: 10, storageKey: 'insights-invoices' });
  const shownInvoices = invPaging.pageItems;
  // Go back to page 1 whenever a filter changes
  const { setPage: setTopPage } = topPaging;
  const { setPage: setInvPage } = invPaging;
  useEffect(() => { setTopPage(1); }, [topPlan, topSelectedOnly, setTopPage]);
  useEffect(() => { setInvPage(1); }, [invoiceFilter, invPlan, invSelectedOnly, setInvPage]);
  const invSelectedRows = invoices.filter((i) => invSel.has(i.no));

  const markPaid = () => {
    const n = invSelectedRows.filter((i) => i.status !== 'Paid').length;
    setInvoices((list) => list.map((i) => (invSel.has(i.no) ? { ...i, status: 'Paid', date: 'Oct 22, 2026' } : i)));
    notify(n ? `${n} invoice${n > 1 ? 's' : ''} marked as paid` : 'Selected invoices were already paid');
  };
  const sendReminders = () => {
    const due = invSelectedRows.filter((i) => i.status !== 'Paid');
    notify(due.length ? `Reminder sent for ${due.length} unpaid invoice${due.length > 1 ? 's' : ''}` : 'No unpaid invoices selected');
  };

  const exportCsv = () => downloadCsv(`harbor-revenue-${period.toLowerCase().replace(/\s+/g, '-')}.csv`,
    [['Month', 'Year', 'Subscriptions', 'Onboarding', 'Total'], ...months.map((m) => [m.label, m.year, m.subscriptions, m.onboarding, m.total])]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-sm text-muted">Admin / Insights</div>
          <h1 className="mt-1 text-3xl font-bold">Revenue insights</h1>
          <p className="mt-1 text-muted">Sample data · figures as of October 2026, in USD</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Segmented label="Period" options={Object.keys(PERIODS)} value={period} onChange={setPeriod} />
          <button onClick={exportCsv} className="btn-secondary"><FiDownload aria-hidden="true" /> Export CSV</button>
        </div>
      </header>

      {/* KPI cards */}
      <section aria-label="Key figures" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Monthly recurring revenue" value={formatMoney(mrr)} change={pct(last.subscriptions, prev.subscriptions)} hint="vs last month" />
        <KpiCard label={`Revenue · ${PERIOD_TEXT[period]}`} value={formatMoney(periodTotal)} hint={`${formatMoney(last.total)} this month`} />
        <KpiCard label="Average revenue per account" value={formatMoney(arpa)} hint={`${activeCount} paying accounts`} />
        <KpiCard label="Outstanding invoices" value={formatMoney(outstanding)} tone={outstanding ? 'danger' : 'default'} hint={`${unpaid.length} unpaid · ${overdueCount} overdue`} />
      </section>

      {/* Chart + plan breakdown */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <section className="card p-5 xl:col-span-2">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-semibold">Monthly revenue</h2>
            <span className="text-sm text-muted">{formatMoney(periodTotal)} {PERIOD_TEXT[period]}</span>
          </div>
          <RevenueChart data={months} />
        </section>

        <section className="card flex flex-col gap-4 p-5">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-lg font-semibold">Revenue by plan</h2>
            <span className="text-sm text-muted">Current MRR</span>
          </div>
          <div className="flex h-3 overflow-hidden rounded-full bg-line" aria-hidden="true">
            {byPlan.map((p) => <div key={p.plan} className={PLAN_COLOR[p.plan]} style={{ width: `${p.share}%` }} />)}
          </div>
          <ul className="flex flex-col divide-y divide-line-soft">
            {byPlan.map((p) => (
              <li key={p.plan} className="flex items-center gap-3 py-3">
                <span className={cx('h-3 w-3 flex-none rounded-sm', PLAN_COLOR[p.plan])} aria-hidden="true" />
                <div className="flex-1">
                  <div className="font-semibold">{p.plan}</div>
                  <div className="text-sm text-muted">{p.accounts} paying accounts</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{formatMoney(p.mrr)}</div>
                  <div className="text-sm text-muted">{p.share}%</div>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-auto flex items-center justify-between rounded-md bg-subtle px-4 py-3">
            <span className="text-muted">Annual run rate</span>
            <span className="font-bold">{formatMoney(mrr * 12)}</span>
          </div>
        </section>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="card overflow-hidden">
          <div className="flex items-baseline justify-between gap-2 border-b border-line px-5 py-4">
            <h2 className="text-lg font-semibold">Top accounts by revenue</h2>
            <Link to={ACCOUNTS_PATH} className="btn-link text-sm">View all accounts</Link>
          </div>
          <BulkBar count={topSel.count} total={filteredTop.length}
            onSelectAll={() => topSel.setMany(filteredTop.map((a) => a.id), true)} onClear={topSel.clear}
            filters={<>
              <SelectedOnlyFilter checked={topSelectedOnly} onChange={setTopSelectedOnly} />
              <BarSelect label="Plan" value={topPlan} onChange={setTopPlan} options={['All', 'Starter', 'Pro', 'Enterprise']} />
            </>}
            actions={<>
              <a className={barButton} href={`mailto:${topSelectedRows.map((a) => a.email).join(',')}`}><FiMail aria-hidden="true" /> Email</a>
              <button className={barButton} onClick={() => downloadCsv('top-accounts-selected.csv', [['Rank', 'ID', 'Name', 'Company', 'Plan', 'MRR', 'Lifetime'],
                ...topSelectedRows.map((a) => [topAccounts.indexOf(a) + 1, a.id, a.name, a.company, a.plan, a.mrr, a.lifetime])])}><FiDownload aria-hidden="true" /> Export</button>
            </>}
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="bg-subtle text-left text-xs uppercase tracking-wide text-muted">
                  <th className="w-12 py-3 pl-5 pr-1"><HeaderCheckbox selection={topSel} pageIds={shownTop.map((a) => a.id)} /></th>
                  <th className="px-3 py-3 font-semibold">Account</th>
                  <th className="px-3 py-3 font-semibold">Plan</th>
                  <th className="px-3 py-3 text-right font-semibold">MRR</th>
                  <th className="px-5 py-3 text-right font-semibold">Lifetime</th>
                </tr>
              </thead>
              <tbody>
                {shownTop.map((a) => (
                  <tr key={a.id} aria-selected={topSel.has(a.id)} className={cx('border-t border-line-soft', topSel.has(a.id) ? 'bg-brand-50' : 'hover:bg-subtle/60')}>
                    <td className="py-3 pl-5 pr-1"><SelectCheckbox label={`Select ${a.name}`} checked={topSel.has(a.id)} onChange={() => topSel.toggle(a.id)} /></td>
                    <td className="px-3 py-3">
                      <Link to={`${ACCOUNTS_PATH}/${a.id}`} className="flex items-center gap-3 hover:underline">
                        <span className="w-4 text-sm text-muted">{topAccounts.indexOf(a) + 1}</span>
                        <Avatar text={initials(a.name)} size="sm" />
                        <span><span className="block font-semibold">{a.name}</span><span className="block text-sm text-muted">{a.company}</span></span>
                      </Link>
                    </td>
                    <td className="px-3 py-3">{a.plan}</td>
                    <td className="px-3 py-3 text-right">{a.mrr ? formatMoney(a.mrr) : <span className="text-muted">—</span>}</td>
                    <td className="px-5 py-3 text-right font-semibold">{formatMoney(a.lifetime)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {shownTop.length === 0 && <div className="p-10 text-center text-muted">No accounts match these filters.</div>}
          </div>
          <Pagination {...topPaging} label="accounts" />
        </section>

        <section className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
            <h2 className="text-lg font-semibold">Recent invoices</h2>
            <div className="flex flex-wrap gap-1.5">
              {['All', 'Paid', 'Due', 'Overdue'].map((s) => (
                <button key={s} onClick={() => setInvoiceFilter(s)} aria-pressed={invoiceFilter === s}
                  className={cx('min-h-[32px] rounded-full border px-3 text-sm font-semibold', invoiceFilter === s ? 'border-brand-600 bg-brand-600 text-white' : 'border-line-strong bg-surface hover:bg-subtle')}>{s}</button>
              ))}
            </div>
          </div>
          <BulkBar count={invSel.count} total={filteredInvoices.length}
            onSelectAll={() => invSel.setMany(filteredInvoices.map((i) => i.no), true)} onClear={invSel.clear}
            filters={<>
              <SelectedOnlyFilter checked={invSelectedOnly} onChange={setInvSelectedOnly} />
              <BarSelect label="Plan" value={invPlan} onChange={setInvPlan} options={['All', 'Starter', 'Pro', 'Enterprise']} />
            </>}
            actions={<>
              <button className={barButton} onClick={markPaid}><FiCheck aria-hidden="true" /> Mark as paid</button>
              <button className={barButton} onClick={sendReminders}><FiBell aria-hidden="true" /> Send reminder</button>
              <button className={barButton} onClick={() => downloadCsv('invoices-selected.csv', [['Invoice', 'Account', 'Plan', 'Date', 'Amount', 'Status'],
                ...invSelectedRows.map((i) => [i.no, i.account, i.plan, i.date, i.amount, i.status])])}><FiDownload aria-hidden="true" /> Export</button>
            </>}
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="bg-subtle text-left text-xs uppercase tracking-wide text-muted">
                  <th className="w-12 py-3 pl-5 pr-1"><HeaderCheckbox selection={invSel} pageIds={shownInvoices.map((i) => i.no)} /></th>
                  <th className="px-3 py-3 font-semibold">Invoice</th>
                  <th className="px-3 py-3 font-semibold">Account</th>
                  <th className="px-3 py-3 font-semibold">Date</th>
                  <th className="px-3 py-3 text-right font-semibold">Amount</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {shownInvoices.map((inv) => (
                  <tr key={inv.no} aria-selected={invSel.has(inv.no)} className={cx('border-t border-line-soft', invSel.has(inv.no) ? 'bg-brand-50' : 'hover:bg-subtle/60')}>
                    <td className="py-3 pl-5 pr-1"><SelectCheckbox label={`Select invoice ${inv.no}`} checked={invSel.has(inv.no)} onChange={() => invSel.toggle(inv.no)} /></td>
                    <td className="px-3 py-3 font-mono text-sm">{inv.no}</td>
                    <td className="px-3 py-3"><Link to={`${ACCOUNTS_PATH}/${inv.accountId}`} className="font-semibold hover:underline">{inv.account}</Link><div className="text-sm text-muted">{inv.plan}</div></td>
                    <td className="px-3 py-3 text-muted">{inv.date}</td>
                    <td className="px-3 py-3 text-right font-semibold">{formatMoney(inv.amount)}</td>
                    <td className="px-5 py-3"><span className={cx('pill', INVOICE_STATUS[inv.status])}>{inv.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {shownInvoices.length === 0 && <div className="p-10 text-center text-muted">No invoices match these filters.</div>}
          </div>
          <Pagination {...invPaging} label="invoices" />
        </section>
      </div>
      {toast && <div role="status" className="fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-md bg-ink px-5 py-3 font-semibold text-white">{toast}</div>}
    </div>
  );
}
