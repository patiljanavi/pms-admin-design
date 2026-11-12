import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip as ChartTooltip, XAxis, YAxis,
} from 'recharts';
import {
  ArrowRight, Bell, Check, DollarSign, Download, Mail, Receipt, SearchX, TrendingUp, Users,
} from 'lucide-react';
import { Avatar, Segmented, cx, initials } from '../components/ui';
import { DataCard, EmptyState, PageHeader, StatCard } from '../components/page';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { toast } from '../components/ui/sonner';
import { SimpleTooltip } from '../components/ui/tooltip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { currentMrr, formatMoney, monthlyRevenue, recentInvoices, revenueByAccount, revenueByPlan } from '../data/revenue';
import { ACCOUNTS_PATH } from '../config';
import Pagination, { usePagination } from '../components/Pagination';
import { BarSelect, BulkBar, HeaderCheckbox, SelectCheckbox, SelectedOnlyFilter, barButton, downloadCsv, useSelection } from '../components/TableSelection';

// Sample accounts all joined in 2026, so the longest useful window is year to date (Jan–Oct).
const PERIODS = { 'Last 6 months': 6, 'Year to date': 10 };
const PERIOD_TEXT = { 'Last 6 months': 'the last 6 months', 'Year to date': 'year to date' };
const INVOICE_STATUS = { Paid: 'success', Due: 'warning', Overdue: 'danger' };
const PLAN_BADGE = { Starter: 'neutral', Pro: 'info', Enterprise: 'violet' };

// Chart colours come from the theme (light + dark): --chart-1 … --chart-5.
const SERIES = {
  subscriptions: { label: 'Subscriptions', color: 'hsl(var(--chart-1))' },
  onboarding: { label: 'Onboarding fees', color: 'hsl(var(--chart-5))' },
  total: { label: 'Total revenue', color: 'hsl(var(--chart-1))' },
};
const PLAN_FILL = { Starter: 'hsl(var(--chart-4))', Pro: 'hsl(var(--chart-1))', Enterprise: 'hsl(var(--chart-3))' };
const AXIS = { fontSize: 12, fill: 'hsl(var(--muted-foreground))' };

function pct(curr, prev) {
  if (!prev) return null;
  return Math.round(((curr - prev) / prev) * 1000) / 10;
}
const compactMoney = (t) => (t >= 1000 ? `$${(t / 1000).toFixed(t % 1000 ? 1 : 0)}k` : `$${t}`);

/* ---------- Charts (Recharts) ---------- */

/** Tooltip styled like shadcn's chart tooltip. */
function RevenueTooltip({ active, payload, keys }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="min-w-[200px] rounded-lg border bg-popover px-3 py-2.5 text-xs text-popover-foreground shadow-pop">
      <div className="mb-2 font-medium">{d.label} {d.year}</div>
      <div className="flex flex-col gap-1.5">
        {keys.map((k) => (
          <div key={k} className="flex items-center gap-2">
            <span className="size-2.5 flex-none rounded-[3px]" style={{ background: SERIES[k].color }} aria-hidden="true" />
            <span className="flex-1 text-muted-foreground">{SERIES[k].label}</span>
            <span className="font-mono font-medium tabular-nums">{formatMoney(d[k])}</span>
          </div>
        ))}
      </div>
      {keys.length > 1 && (
        <div className="mt-2 flex items-center justify-between border-t pt-2">
          <span className="text-muted-foreground">Total</span>
          <span className="font-mono font-semibold tabular-nums">{formatMoney(d.total)}</span>
        </div>
      )}
    </div>
  );
}

function ChartFrame({ data, children }) {
  return (
    <div className="h-[280px] w-full" role="img"
      aria-label={`Monthly revenue: ${data.map((d) => `${d.label} ${formatMoney(d.total)}`).join(', ')}`}>
      <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
    </div>
  );
}

function RevenueBars({ data }) {
  return (
    <ChartFrame data={data}>
      <BarChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} barCategoryGap="28%">
        <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} tick={AXIS} />
        <YAxis tickLine={false} axisLine={false} tickMargin={8} width={48} tick={AXIS} tickFormatter={compactMoney} />
        <ChartTooltip cursor={{ fill: 'hsl(var(--muted))', opacity: 0.7 }} content={<RevenueTooltip keys={['subscriptions', 'onboarding']} />} />
        <Bar dataKey="subscriptions" stackId="rev" fill={SERIES.subscriptions.color} stroke="hsl(var(--card))" strokeWidth={1} maxBarSize={36} />
        <Bar dataKey="onboarding" stackId="rev" fill={SERIES.onboarding.color} stroke="hsl(var(--card))" strokeWidth={1} radius={[4, 4, 0, 0]} maxBarSize={36} />
      </BarChart>
    </ChartFrame>
  );
}

function RevenueTrend({ data }) {
  return (
    <ChartFrame data={data}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="insights-total-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={SERIES.total.color} stopOpacity={0.28} />
            <stop offset="100%" stopColor={SERIES.total.color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} tick={AXIS} />
        <YAxis tickLine={false} axisLine={false} tickMargin={8} width={48} tick={AXIS} tickFormatter={compactMoney} />
        <ChartTooltip cursor={{ stroke: 'hsl(var(--line-strong))', strokeDasharray: '4 4' }} content={<RevenueTooltip keys={['subscriptions', 'onboarding']} />} />
        <Area type="monotone" dataKey="total" stroke={SERIES.total.color} strokeWidth={2} fill="url(#insights-total-fill)"
          dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: 'hsl(var(--card))', fill: SERIES.total.color }} />
      </AreaChart>
    </ChartFrame>
  );
}

function RevenueTable({ data }) {
  return (
    <div className="max-h-[280px] overflow-y-auto rounded-lg border">
      <Table>
        <TableHeader className="sticky top-0 z-10">
          <TableRow>
            <TableHead>Month</TableHead>
            <TableHead className="text-right">Subscriptions</TableHead>
            <TableHead className="text-right">Onboarding</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((m) => (
            <TableRow key={m.key}>
              <TableCell className="font-medium">{m.label} {m.year}</TableCell>
              <TableCell className="text-right text-muted-foreground">{formatMoney(m.subscriptions)}</TableCell>
              <TableCell className="text-right text-muted-foreground">{formatMoney(m.onboarding)}</TableCell>
              <TableCell className="text-right font-medium">{formatMoney(m.total)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function Legend({ items }) {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
      {items.map((it) => (
        <span key={it.label} className="flex items-center gap-2 text-muted-foreground">
          <span className="size-2.5 rounded-[3px]" style={{ background: it.color }} aria-hidden="true" />
          {it.label}
          {it.value != null && <span className="font-medium tabular-nums text-foreground">{it.value}</span>}
        </span>
      ))}
    </div>
  );
}

function CardShell({ title, description, action, className, children }) {
  return (
    <section className={cx('flex flex-col gap-5 rounded-xl border bg-card p-5 shadow-card', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="section-title">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/* ---------- Page ---------- */
export default function Insights() {
  const [period, setPeriod] = useState('Year to date');
  const [chartView, setChartView] = useState('breakdown');
  const [invoiceFilter, setInvoiceFilter] = useState('All');

  const months = useMemo(() => monthlyRevenue(PERIODS[period]), [period]);
  const allMonths = useMemo(() => monthlyRevenue(2), []);
  const mrr = currentMrr();
  const byPlan = useMemo(() => revenueByPlan(), []);
  const topAccounts = useMemo(() => revenueByAccount(), []); // all accounts, ranked by lifetime revenue
  const [invoices, setInvoices] = useState(recentInvoices);

  // Both tables use the floating bulk bar; show the one the user touched last so they never overlap.
  const [activeBar, setActiveBar] = useState('top');

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
  const periodSubs = months.reduce((s, m) => s + m.subscriptions, 0);
  const periodOnboarding = months.reduce((s, m) => s + m.onboarding, 0);
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
    if (n) toast.success(`${n} invoice${n > 1 ? 's' : ''} marked as paid`);
    else toast('Selected invoices were already paid');
  };
  const sendReminders = () => {
    const due = invSelectedRows.filter((i) => i.status !== 'Paid');
    if (due.length) toast.success(`Reminder sent for ${due.length} unpaid invoice${due.length > 1 ? 's' : ''}`);
    else toast('No unpaid invoices selected');
  };

  const exportCsv = () => downloadCsv(`harbor-revenue-${period.toLowerCase().replace(/\s+/g, '-')}.csv`,
    [['Month', 'Year', 'Subscriptions', 'Onboarding', 'Total'], ...months.map((m) => [m.label, m.year, m.subscriptions, m.onboarding, m.total])]);

  const statusCount = (s) => (s === 'All' ? invoices.length : invoices.filter((i) => i.status === s).length);
  const showTopBar = topSel.count > 0 && (activeBar === 'top' || invSel.count === 0);
  const showInvBar = invSel.count > 0 && !showTopBar;

  const selectedChip = (count, shown, which) => (count > 0 && !shown ? (
    <Button variant="outline" size="xs" onClick={() => setActiveBar(which)}>{count} selected · show actions</Button>
  ) : null);

  return (
    <div className="page">
      <PageHeader title="Revenue insights" description="Sample data · figures as of October 2026, in USD"
        actions={<>
          <Segmented label="Period" options={Object.keys(PERIODS)} value={period} onChange={setPeriod} />
          <Button variant="outline" onClick={exportCsv}><Download />Export CSV</Button>
        </>} />

      {/* KPI cards */}
      <section aria-label="Key figures" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:gap-4 xl:grid-cols-4">
        <StatCard label="Monthly recurring revenue" value={formatMoney(mrr)} icon={DollarSign} tone="brand" change={pct(last.subscriptions, prev.subscriptions)} hint="vs last month" />
        <StatCard label={`Revenue · ${PERIOD_TEXT[period]}`} value={formatMoney(periodTotal)} icon={TrendingUp} hint={`${formatMoney(last.total)} this month`} />
        <StatCard label="Average revenue per account" value={formatMoney(arpa)} icon={Users} hint={`${activeCount} paying accounts`} />
        <StatCard label="Outstanding invoices" value={formatMoney(outstanding)} icon={Receipt} tone={outstanding ? 'danger' : 'default'}
          hint={`${unpaid.length} unpaid · ${overdueCount} overdue`}
          onClick={() => setInvoiceFilter((f) => (f === 'Overdue' ? 'All' : 'Overdue'))} active={invoiceFilter === 'Overdue'} />
      </section>

      {/* Chart + plan breakdown */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <CardShell className="xl:col-span-2" title="Monthly revenue"
          description={<><span className="font-medium tabular-nums text-foreground">{formatMoney(periodTotal)}</span> {PERIOD_TEXT[period]}</>}
          action={<Segmented size="sm" label="Chart view" value={chartView} onChange={setChartView}
            options={[{ value: 'breakdown', label: 'Breakdown' }, { value: 'trend', label: 'Trend' }, { value: 'table', label: 'Table' }]} />}>
          {chartView === 'breakdown' && <RevenueBars data={months} />}
          {chartView === 'trend' && <RevenueTrend data={months} />}
          {chartView === 'table' && <RevenueTable data={months} />}
          {chartView !== 'table' && (
            <Legend items={chartView === 'trend'
              ? [{ label: SERIES.total.label, color: SERIES.total.color, value: formatMoney(periodTotal) }]
              : [{ label: SERIES.subscriptions.label, color: SERIES.subscriptions.color, value: formatMoney(periodSubs) },
                { label: SERIES.onboarding.label, color: SERIES.onboarding.color, value: formatMoney(periodOnboarding) }]} />
          )}
        </CardShell>

        <CardShell title="Revenue by plan" description="Current MRR">
          <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-muted" role="img"
            aria-label={byPlan.map((p) => `${p.plan} ${p.share}%`).join(', ')}>
            {byPlan.filter((p) => p.share > 0).map((p) => (
              <SimpleTooltip key={p.plan} label={`${p.plan} · ${formatMoney(p.mrr)} (${p.share}%)`}>
                <div className="h-full first:rounded-l-full last:rounded-r-full" style={{ width: `${p.share}%`, background: PLAN_FILL[p.plan] }} />
              </SimpleTooltip>
            ))}
          </div>
          <ul className="flex flex-col divide-y">
            {byPlan.map((p) => (
              <li key={p.plan} className="flex items-center gap-3 py-3 first:pt-0">
                <span className="size-2.5 flex-none rounded-[3px]" style={{ background: PLAN_FILL[p.plan] }} aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{p.plan}</div>
                  <div className="text-xs text-muted-foreground">{p.accounts} paying accounts</div>
                </div>
                <div className="text-right">
                  <div className="font-medium tabular-nums">{formatMoney(p.mrr)}</div>
                  <div className="text-xs tabular-nums text-muted-foreground">{p.share}%</div>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-auto flex items-center justify-between rounded-lg border bg-subtle px-4 py-3">
            <span className="text-sm text-muted-foreground">Annual run rate</span>
            <span className="text-lg font-semibold tabular-nums">{formatMoney(mrr * 12)}</span>
          </div>
        </CardShell>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 gap-4 2xl:grid-cols-2">
        <div onClickCapture={() => setActiveBar('top')} className="min-w-0">
          <DataCard className="flex h-full flex-col"
            toolbar={<>
              <div className="min-w-0">
                <h2 className="section-title">Top accounts by revenue</h2>
                <p className="text-xs text-muted-foreground">Ranked by lifetime revenue</p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                {selectedChip(topSel.count, showTopBar, 'top')}
                <Button variant="ghost" size="sm" asChild><Link to={ACCOUNTS_PATH}>View all accounts<ArrowRight /></Link></Button>
              </div>
            </>}
            footer={<Pagination {...topPaging} label="accounts" className="mt-auto" />}>
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"><HeaderCheckbox selection={topSel} pageIds={shownTop.map((a) => a.id)} /></TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead className="text-right">MRR</TableHead>
                  <TableHead className="text-right">Lifetime</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shownTop.map((a) => {
                  const checked = topSel.has(a.id);
                  return (
                    <TableRow key={a.id} data-state={checked ? 'selected' : undefined} aria-selected={checked}>
                      <TableCell><SelectCheckbox label={`Select ${a.name}`} checked={checked} onChange={() => topSel.toggle(a.id)} /></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span className="w-5 text-right text-xs tabular-nums text-muted-foreground">{topAccounts.indexOf(a) + 1}</span>
                          <Avatar text={initials(a.name)} size="sm" />
                          <div className="min-w-0">
                            <Link to={`${ACCOUNTS_PATH}/${a.id}`} className="block truncate font-medium text-foreground underline-offset-4 hover:underline">{a.name}</Link>
                            <div className="truncate text-xs text-muted-foreground">{a.company}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant={PLAN_BADGE[a.plan] || 'neutral'}>{a.plan}</Badge></TableCell>
                      <TableCell className="text-right tabular-nums">{a.mrr ? formatMoney(a.mrr) : <span className="text-muted-foreground/60">—</span>}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">{formatMoney(a.lifetime)}</TableCell>
                    </TableRow>
                  );
                })}
                {shownTop.length === 0 && (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={5}>
                      <EmptyState compact icon={SearchX} title="No accounts match these filters." description="Clear the selection filters to see every account."
                        action={<Button variant="outline" size="sm" onClick={() => { setTopSelectedOnly(false); setTopPlan('All'); }}>Clear filters</Button>} />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DataCard>
        </div>

        <div onClickCapture={() => setActiveBar('inv')} className="min-w-0">
          <DataCard className="flex h-full flex-col"
            toolbar={<>
              <div className="min-w-0">
                <h2 className="section-title">Recent invoices</h2>
                <p className="text-xs text-muted-foreground">Latest invoice for every account</p>
              </div>
              <div className="ml-auto flex flex-wrap items-center gap-2">
                {selectedChip(invSel.count, showInvBar, 'inv')}
                <Segmented size="sm" label="Invoice status" value={invoiceFilter} onChange={setInvoiceFilter}
                  options={['All', 'Paid', 'Due', 'Overdue'].map((s) => ({ value: s, label: <>{s}<span className="tabular-nums text-muted-foreground">{statusCount(s)}</span></> }))} />
              </div>
            </>}
            footer={<Pagination {...invPaging} label="invoices" className="mt-auto" />}>
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"><HeaderCheckbox selection={invSel} pageIds={shownInvoices.map((i) => i.no)} /></TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shownInvoices.map((inv) => {
                  const checked = invSel.has(inv.no);
                  return (
                    <TableRow key={inv.no} data-state={checked ? 'selected' : undefined} aria-selected={checked}>
                      <TableCell><SelectCheckbox label={`Select invoice ${inv.no}`} checked={checked} onChange={() => invSel.toggle(inv.no)} /></TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{inv.no}</TableCell>
                      <TableCell>
                        <Link to={`${ACCOUNTS_PATH}/${inv.accountId}`} className="block truncate font-medium text-foreground underline-offset-4 hover:underline">{inv.account}</Link>
                        <div className="text-xs text-muted-foreground">{inv.plan}</div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">{inv.date}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">{formatMoney(inv.amount)}</TableCell>
                      <TableCell><Badge variant={INVOICE_STATUS[inv.status] || 'neutral'} dot>{inv.status}</Badge></TableCell>
                    </TableRow>
                  );
                })}
                {shownInvoices.length === 0 && (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={6}>
                      <EmptyState compact icon={SearchX} title="No invoices match these filters." description="Try another status or clear the selection filters."
                        action={<Button variant="outline" size="sm" onClick={() => { setInvoiceFilter('All'); setInvSelectedOnly(false); setInvPlan('All'); }}>Clear filters</Button>} />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DataCard>
        </div>
      </div>

      <BulkBar count={showTopBar ? topSel.count : 0} total={filteredTop.length}
        onSelectAll={() => topSel.setMany(filteredTop.map((a) => a.id), true)} onClear={topSel.clear}
        filters={<>
          <SelectedOnlyFilter checked={topSelectedOnly} onChange={setTopSelectedOnly} />
          <BarSelect label="Plan" value={topPlan} onChange={setTopPlan} options={['All', 'Starter', 'Pro', 'Enterprise']} />
        </>}
        actions={<>
          <a className={barButton} href={`mailto:${topSelectedRows.map((a) => a.email).join(',')}`}><Mail aria-hidden="true" />Email</a>
          <button type="button" className={barButton} onClick={() => downloadCsv('top-accounts-selected.csv', [['Rank', 'ID', 'Name', 'Company', 'Plan', 'MRR', 'Lifetime'],
            ...topSelectedRows.map((a) => [topAccounts.indexOf(a) + 1, a.id, a.name, a.company, a.plan, a.mrr, a.lifetime])])}><Download aria-hidden="true" />Export</button>
        </>}
      />
      <BulkBar count={showInvBar ? invSel.count : 0} total={filteredInvoices.length}
        onSelectAll={() => invSel.setMany(filteredInvoices.map((i) => i.no), true)} onClear={invSel.clear}
        filters={<>
          <SelectedOnlyFilter checked={invSelectedOnly} onChange={setInvSelectedOnly} />
          <BarSelect label="Plan" value={invPlan} onChange={setInvPlan} options={['All', 'Starter', 'Pro', 'Enterprise']} />
        </>}
        actions={<>
          <button type="button" className={barButton} onClick={markPaid}><Check aria-hidden="true" />Mark as paid</button>
          <button type="button" className={barButton} onClick={sendReminders}><Bell aria-hidden="true" />Send reminder</button>
          <button type="button" className={barButton} onClick={() => downloadCsv('invoices-selected.csv', [['Invoice', 'Account', 'Plan', 'Date', 'Amount', 'Status'],
            ...invSelectedRows.map((i) => [i.no, i.account, i.plan, i.date, i.amount, i.status])])}><Download aria-hidden="true" />Export</button>
        </>}
      />
    </div>
  );
}
