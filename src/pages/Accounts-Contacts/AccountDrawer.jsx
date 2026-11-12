import { useEffect, useState } from 'react';
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import {
  Activity, Ban, Building2, CalendarDays, Check, Copy, CreditCard, Download, Gauge, KeyRound, Landmark, LayoutDashboard, LayoutGrid,
  Mail, MonitorSmartphone, Phone, Plus, Receipt, Settings, ShieldCheck, Smartphone, SearchX, UserRound, Users, X,
} from 'lucide-react';
import { Avatar, CloseButton, Drawer, Toggle, initials } from '../../components/ui';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Progress } from '../../components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { SimpleTooltip } from '../../components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { toast } from '../../components/ui/sonner';
import { EmptyState } from '../../components/page';
import { HeaderCheckbox, SelectCheckbox, SelectedOnlyFilter, downloadCsv, useSelection } from '../../components/TableSelection';
import { PLAN_PRICE, PLAN_SEATS } from '../../data/sampleData';
import TagChip from '../../components/TagChip';
import { useData } from '../../context/DataContext';
import { ACCOUNTS_PATH, accountTabPath } from '../../config';
import { cn } from 'lib/utils';

const BILLING_TABS = ['Invoices', 'Payment methods', 'Plan & usage'];
const SETTINGS_TABS = ['Profile', 'Security', 'Notifications'];
const MAIN_TABS = [
  { value: 'Overview', icon: LayoutGrid },
  { value: 'Billing', icon: Receipt },
  { value: 'Activity', icon: Activity },
  { value: 'Settings', icon: Settings },
];
const STATUS_VARIANT = { Active: 'success', Paid: 'success', Pending: 'warning', Due: 'warning', Suspended: 'danger', Overdue: 'danger' };
const TIME_ZONES = ['UTC', 'Europe / Berlin', 'America / New York', 'Asia / Kolkata'];

const StatusPill = ({ value }) => <Badge variant={STATUS_VARIANT[value] || 'neutral'} shape="pill" dot>{value}</Badge>;

/** Small titled block used inside the drawer body. */
function Block({ title, action, children, className }) {
  return (
    <section className={cn('flex flex-col gap-2.5', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</h3>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/** Key fact in the header strip. */
function Fact({ icon: Icon, label, children }) {
  return (
    <div className="min-w-0 py-3 pr-3 sm:border-l sm:pl-4 sm:first:border-l-0 sm:first:pl-0">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Icon className="size-3.5" aria-hidden="true" />{label}</div>
      <div className="mt-1 truncate text-sm font-medium text-foreground">{children}</div>
    </div>
  );
}

/** Settings row: title + description on the left, control on the right. */
function SettingRow({ title, description, children }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3.5">
      <div className="min-w-0">
        <div className="text-sm font-medium">{title}</div>
        {description && <div className="text-sm text-muted-foreground">{description}</div>}
      </div>
      {children}
    </div>
  );
}

const copy = (text, what) => navigator.clipboard?.writeText(text).then(() => toast.success(`${what} copied`, { description: text }), () => toast.error(`Couldn't copy the ${what.toLowerCase()}`));

export default function AccountDrawer() {
  const { accountId } = useParams();
  const { accounts } = useOutletContext();
  const navigate = useNavigate();
  const { tagById } = useData();
  const [tab, setTab] = useState('Overview');
  const [bill, setBill] = useState('Invoices');
  const [sett, setSett] = useState('Profile');
  const [tg, setTg] = useState({ twofa: true, email: true, sms: false, weekly: true, product: false });
  const close = () => navigate(ACCOUNTS_PATH);

  // Invoice selection (Billing → Invoices)
  const invSel = useSelection();
  const [selectedOnly, setSelectedOnly] = useState(false);
  const [paidNow, setPaidNow] = useState(() => new Set());
  useEffect(() => { if (invSel.count === 0) setSelectedOnly(false); }, [invSel.count]);
  useEffect(() => { invSel.clear(); setPaidNow(new Set()); }, [accountId]); // eslint-disable-line react-hooks/exhaustive-deps

  const a = accounts.find((x) => x.id === accountId);
  if (!a) {
    return (
      <Drawer onClose={close} label="Account not found">
        <div className="flex justify-end px-4 pt-4"><CloseButton onClick={close} /></div>
        <div className="flex flex-1 items-center justify-center">
          <EmptyState icon={SearchX} title="Account not found" description={`No account has the ID ${accountId}. It may have been deleted.`}
            action={<Button asChild><Link to={ACCOUNTS_PATH}>Back to accounts</Link></Button>} />
        </div>
      </Drawer>
    );
  }
  const price = PLAN_PRICE[a.plan];
  const [used, limit] = PLAN_SEATS[a.plan];
  const seatPct = Math.round((used / limit) * 100);
  const invoices = ['Oct 1', 'Sep 1', 'Aug 1', 'Jul 1'].map((d, i) => {
    const no = `INV-${a.id.slice(3)}-${12 - i}`;
    return { no, date: `${d}, 2026`, amount: `$${price}.00`, status: paidNow.has(no) || !(i === 0 && a.status !== 'Active') ? 'Paid' : 'Due' };
  });
  const shownInvoices = invoices.filter((iv) => !selectedOnly || invSel.has(iv.no));
  const selectedInvoices = invoices.filter((iv) => invSel.has(iv.no));
  const dueCount = invoices.filter((iv) => iv.status === 'Due').length;
  const flip = (k) => (v) => setTg((p) => ({ ...p, [k]: v }));
  const tags = (a.tags || []).map((id) => tagById.get(id)).filter(Boolean);
  const contactName = (c) => `${c.firstName || ''} ${c.lastName || ''}`.trim();

  const markPaid = () => {
    const n = invSel.count;
    setPaidNow((p) => new Set([...p, ...invSel.ids]));
    toast.success(`Marked ${n} invoice${n === 1 ? '' : 's'} as paid`);
  };
  const downloadSelected = () => {
    downloadCsv(`${a.id}-invoices.csv`, [['Invoice', 'Date', 'Amount', 'Status'], ...selectedInvoices.map((iv) => [iv.no, iv.date, iv.amount, iv.status])]);
    toast.success(`Downloaded ${selectedInvoices.length} invoice${selectedInvoices.length === 1 ? '' : 's'}`, { description: `${a.id}-invoices.csv` });
  };

  return (
    <Drawer onClose={close} label={`${a.name} details`} width="max-w-[640px]">
      {/* Header */}
      <div className="flex-none border-b px-6 pb-0 pt-5">
        <div className="flex items-start gap-4">
          <Avatar text={initials(a.name)} size="lg" />
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-lg font-semibold tracking-tight">{a.name}</h2>
              <StatusPill value={a.status} />
            </div>
            <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted-foreground">
              {a.company && <span className="inline-flex items-center gap-1.5"><Building2 className="size-3.5" aria-hidden="true" />{a.company}</span>}
              {a.company && a.email && <span aria-hidden="true" className="text-muted-foreground/50">·</span>}
              {a.email && <a href={`mailto:${a.email}`} className="truncate hover:text-primary hover:underline">{a.email}</a>}
            </div>
          </div>
          <div className="flex flex-none items-center gap-1">
            <SimpleTooltip label="Open dashboard">
              <Button variant="ghost" size="icon-sm" asChild>
                <Link to={accountTabPath('overview', a.id)} aria-label="Open account dashboard"><LayoutDashboard /></Link>
              </Button>
            </SimpleTooltip>
            <CloseButton onClick={close} />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 border-t sm:grid-cols-4">
          <Fact icon={Gauge} label="Plan">{a.plan} · ${price}/mo</Fact>
          <Fact icon={Users} label="Seats">{used} / {a.plan === 'Enterprise' ? '∞' : limit}</Fact>
          <Fact icon={UserRound} label="Role">{a.role}</Fact>
          <Fact icon={CalendarDays} label="Member since">{a.joined}</Fact>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col">
        <TabsList variant="line" className="flex-none px-4 sm:px-5">
          {MAIN_TABS.map(({ value, icon: Icon }) => (
            <TabsTrigger key={value} value={value}>
              <Icon aria-hidden="true" />{value}
              {value === 'Billing' && dueCount > 0 && <span className="ml-0.5 inline-flex size-4 items-center justify-center rounded-full bg-warning-100 text-[10px] font-semibold text-warning-700">{dueCount}</span>}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {/* Overview */}
          <TabsContent value="Overview" className="mt-0 flex flex-col gap-6 px-6 py-5">
            <Block title="Details">
              <dl className="grid grid-cols-1 overflow-hidden rounded-lg border sm:grid-cols-2">
                {[
                  ['Account ID', <span key="id" className="inline-flex items-center gap-1.5 font-mono text-[13px]">{a.id}
                    <SimpleTooltip label="Copy ID"><button type="button" onClick={() => copy(a.id, 'Account ID')} aria-label="Copy account ID"
                      className="inline-flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"><Copy className="size-3.5" /></button></SimpleTooltip></span>],
                  ['Company', a.company || '—'],
                  ['Role', a.role],
                  ['Plan', `${a.plan} · $${price} / mo`],
                ].map(([k, v]) => (
                  <div key={k} className="flex min-h-[52px] flex-col justify-center gap-0.5 border-b px-4 py-2.5 sm:[&:nth-child(odd)]:border-r">
                    <dt className="text-xs text-muted-foreground">{k}</dt>
                    <dd className="text-sm font-medium">{v}</dd>
                  </div>
                ))}
                <div className="flex flex-col gap-0.5 px-4 py-2.5 sm:col-span-2">
                  <dt className="text-xs text-muted-foreground">Member since</dt>
                  <dd className="text-sm font-medium">{a.joined}</dd>
                </div>
              </dl>
            </Block>

            {(a.team?.length > 0 || tags.length > 0) && (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {a.team?.length > 0 && (
                  <Block title="Team">
                    <ul className="flex flex-col gap-2">
                      {a.team.map((m) => (
                        <li key={m} className="flex items-center gap-2.5 text-sm"><Avatar text={initials(m)} size="sm" /><span className="truncate font-medium">{m}</span></li>
                      ))}
                    </ul>
                  </Block>
                )}
                {tags.length > 0 && (
                  <Block title="Tags">
                    <div className="flex flex-wrap gap-1.5">{tags.map((t) => <TagChip key={t.value} tag={t} />)}</div>
                  </Block>
                )}
              </div>
            )}

            {a.contacts?.length > 0 && (
              <Block title={`Contacts · ${a.contacts.length}`}>
                <ul className="divide-y overflow-hidden rounded-lg border">
                  {a.contacts.map((c) => (
                    <li key={c.id} className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40">
                      <Avatar text={initials(contactName(c) || '?')} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium">{contactName(c) || 'Unnamed contact'}</span>
                          {c.primary && <Badge variant="info" className="px-1.5 py-0 text-[11px]">Primary</Badge>}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">{[c.role, c.email, c.phone].filter(Boolean).join(' · ')}</div>
                      </div>
                      <div className="flex flex-none items-center gap-0.5 opacity-70 transition-opacity group-hover:opacity-100">
                        {c.email && (
                          <SimpleTooltip label={`Email ${c.email}`}>
                            <Button variant="ghost" size="icon-xs" asChild><a href={`mailto:${c.email}`} aria-label={`Email ${contactName(c)}`}><Mail /></a></Button>
                          </SimpleTooltip>
                        )}
                        {c.phone && (
                          <SimpleTooltip label={`Call ${c.phone}`}>
                            <Button variant="ghost" size="icon-xs" asChild><a href={`tel:${c.phone}`} aria-label={`Call ${contactName(c)}`}><Phone /></a></Button>
                          </SimpleTooltip>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </Block>
            )}

            <Block title="Actions">
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm"><Mail />Send email</Button>
                <Button variant="outline" size="sm"><KeyRound />Reset password</Button>
                <Button variant="destructive-outline" size="sm"><Ban />Suspend account</Button>
              </div>
            </Block>
          </TabsContent>

          {/* Billing */}
          <TabsContent value="Billing" className="mt-0 px-6 py-5">
            <Tabs value={bill} onValueChange={setBill} className="flex flex-col gap-4">
              <TabsList className="self-start">
                {BILLING_TABS.map((t) => <TabsTrigger key={t} value={t}>{t}</TabsTrigger>)}
              </TabsList>

              <TabsContent value="Invoices" className="mt-0">
                <div className="overflow-hidden rounded-lg border">
                  <div className={cn('flex min-h-11 flex-wrap items-center gap-x-3 gap-y-2 border-b px-4 py-2 text-sm transition-colors', invSel.count > 0 ? 'bg-primary/[0.04]' : 'bg-card')}>
                    {invSel.count > 0 ? (
                      <div role="region" aria-label="Selected invoices" className="flex w-full flex-wrap items-center gap-x-3 gap-y-2">
                        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-md bg-primary px-1.5 text-xs font-semibold tabular-nums text-primary-foreground">{invSel.count}</span>
                        <span className="font-medium">selected</span>
                        {invSel.count < invoices.length && (
                          <button type="button" className="font-medium text-primary hover:underline" onClick={() => invSel.setMany(invoices.map((iv) => iv.no), true)}>Select all {invoices.length}</button>
                        )}
                        <span className="h-4 w-px bg-border" aria-hidden="true" />
                        <SelectedOnlyFilter checked={selectedOnly} onChange={setSelectedOnly} />
                        <div className="ml-auto flex items-center gap-1.5">
                          <Button variant="outline" size="xs" onClick={markPaid}><Check />Mark as paid</Button>
                          <Button variant="outline" size="xs" onClick={downloadSelected}><Download />Download</Button>
                          <SimpleTooltip label="Clear selection">
                            <Button variant="ghost" size="icon-xs" onClick={invSel.clear} aria-label="Clear selection"><X /></Button>
                          </SimpleTooltip>
                        </div>
                      </div>
                    ) : (
                      <>
                        <span className="font-medium">{invoices.length} invoices</span>
                        {dueCount > 0
                          ? <Badge variant="warning" dot>{dueCount} due</Badge>
                          : <Badge variant="success" dot>All paid</Badge>}
                        <span className="ml-auto text-xs text-muted-foreground">Select invoices to mark them paid or download</span>
                      </>
                    )}
                  </div>
                  <Table className="min-w-[460px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10"><HeaderCheckbox selection={invSel} pageIds={shownInvoices.map((iv) => iv.no)} label="Select all invoices" /></TableHead>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {shownInvoices.map((iv) => (
                        <TableRow key={iv.no} data-state={invSel.has(iv.no) ? 'selected' : undefined}>
                          <TableCell><SelectCheckbox label={`Select invoice ${iv.no}`} checked={invSel.has(iv.no)} onChange={() => invSel.toggle(iv.no)} /></TableCell>
                          <TableCell className="font-mono text-[13px]">{iv.no}</TableCell>
                          <TableCell className="text-muted-foreground">{iv.date}</TableCell>
                          <TableCell className="text-right font-medium tabular-nums">{iv.amount}</TableCell>
                          <TableCell><StatusPill value={iv.status} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="Payment methods" className="mt-0 flex flex-col gap-2.5">
                <div className="flex items-center gap-3.5 rounded-lg border border-primary/40 bg-primary/[0.03] p-4 ring-1 ring-primary/10">
                  <span className="flex h-9 w-12 flex-none items-center justify-center rounded-md bg-inverse text-inverse-foreground"><CreditCard className="size-4" aria-hidden="true" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-sm font-medium">Card ending [0000]<Badge variant="info">Default</Badge></div>
                    <div className="text-sm text-muted-foreground">Expires [MM/YY]</div>
                  </div>
                </div>
                <div className="flex items-center gap-3.5 rounded-lg border p-4">
                  <span className="flex h-9 w-12 flex-none items-center justify-center rounded-md border bg-muted text-muted-foreground"><Landmark className="size-4" aria-hidden="true" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">Bank transfer ending [0000]</div>
                    <div className="text-sm text-muted-foreground">Backup method</div>
                  </div>
                </div>
                <button type="button" className="flex h-11 items-center justify-center gap-2 rounded-lg border border-dashed border-line-strong text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
                  <Plus className="size-4" aria-hidden="true" />Add payment method
                </button>
              </TabsContent>

              <TabsContent value="Plan & usage" className="mt-0">
                <div className="flex flex-col gap-5 rounded-lg border bg-card p-5 shadow-card">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Current plan</div>
                      <div className="mt-1 text-xl font-semibold tracking-tight">{a.plan}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-semibold tabular-nums">${price}</div>
                      <div className="text-xs text-muted-foreground">per month</div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-sm"><span className="font-medium">Seats used</span><span className="tabular-nums text-muted-foreground">{used} of {a.plan === 'Enterprise' ? 'unlimited' : limit} seats</span></div>
                    <Progress value={seatPct} aria-label="Seats used" indicatorClassName={seatPct >= 90 ? 'bg-warning-700' : undefined} />
                  </div>
                  <div className="flex flex-wrap gap-2 border-t pt-4">
                    <Button size="sm">Change plan</Button>
                    <Button size="sm" variant="ghost" className="text-muted-foreground">Cancel subscription</Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Activity */}
          <TabsContent value="Activity" className="mt-0 px-6 py-5">
            <ol className="relative flex flex-col">
              {[['Signed in from a new device', 'Today, 09:14', true], ['Paid the latest invoice', 'Oct 1, 2026', true], ['Invited 2 team members', 'Sep 22, 2026'], ['Changed role permissions', 'Sep 10, 2026'], ['Account created', a.joined]].map(([t, d, recent], i, arr) => (
                <li key={t} className="relative flex gap-3.5 pb-5 last:pb-0">
                  {i < arr.length - 1 && <span className="absolute left-[5px] top-4 h-full w-px bg-border" aria-hidden="true" />}
                  <span className={cn('relative mt-1.5 size-[11px] flex-none rounded-full ring-4 ring-card', recent ? 'bg-primary' : 'border-2 border-line-strong bg-card')} aria-hidden="true" />
                  <div>
                    <div className="text-sm font-medium">{t}</div>
                    <div className="text-xs text-muted-foreground">{d}</div>
                  </div>
                </li>
              ))}
            </ol>
          </TabsContent>

          {/* Settings */}
          <TabsContent value="Settings" className="mt-0 px-6 py-5">
            <Tabs value={sett} onValueChange={setSett} className="flex flex-col gap-4">
              <TabsList className="self-start">
                {SETTINGS_TABS.map((t) => <TabsTrigger key={t} value={t}>{t}</TabsTrigger>)}
              </TabsList>

              <TabsContent value="Profile" className="mt-0">
                <div className="grid grid-cols-1 gap-4 rounded-lg border p-5 sm:grid-cols-2">
                  <div className="flex flex-col gap-2 sm:col-span-2">
                    <Label htmlFor={`${a.id}-name`}>Display name</Label>
                    <Input id={`${a.id}-name`} defaultValue={a.name} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor={`${a.id}-email`}>Email</Label>
                    <Input id={`${a.id}-email`} type="email" defaultValue={a.email} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor={`${a.id}-tz`}>Time zone</Label>
                    <Select defaultValue="UTC">
                      <SelectTrigger id={`${a.id}-tz`}><SelectValue /></SelectTrigger>
                      <SelectContent>{TIME_ZONES.map((z) => <SelectItem key={z} value={z}>{z}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end border-t pt-4 sm:col-span-2">
                    <Button size="sm">Save profile</Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="Security" className="mt-0 flex flex-col gap-4">
                <div className="rounded-lg border">
                  <SettingRow title={<span className="inline-flex items-center gap-2"><ShieldCheck className="size-4 text-muted-foreground" aria-hidden="true" />Two-factor authentication</span>} description="Require a code at sign in">
                    <Toggle label="Two-factor authentication" checked={tg.twofa} onChange={flip('twofa')} />
                  </SettingRow>
                </div>
                <Block title="Active sessions">
                  <ul className="divide-y rounded-lg border">
                    <li className="flex items-center gap-3 px-4 py-3 text-sm">
                      <MonitorSmartphone className="size-4 text-muted-foreground" aria-hidden="true" /><span className="flex-1 font-medium">Chrome · macOS</span><Badge variant="success" dot>Current</Badge>
                    </li>
                    <li className="flex items-center gap-3 px-4 py-3 text-sm">
                      <Smartphone className="size-4 text-muted-foreground" aria-hidden="true" /><span className="flex-1 font-medium">Safari · iPhone</span><span className="text-muted-foreground">2 days ago</span>
                    </li>
                  </ul>
                </Block>
                <Button variant="outline" size="sm" className="self-start">Sign out all sessions</Button>
              </TabsContent>

              <TabsContent value="Notifications" className="mt-0">
                <div className="divide-y rounded-lg border">
                  {[['email', 'Email alerts', 'Important account events by email'], ['sms', 'SMS alerts', 'Urgent alerts by text message'], ['weekly', 'Weekly summary', 'A digest every Monday morning'], ['product', 'Product updates', 'New features and improvements']].map(([k, l, d]) => (
                    <SettingRow key={k} title={l} description={d}><Toggle label={l} checked={tg[k]} onChange={flip(k)} /></SettingRow>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </div>
      </Tabs>
    </Drawer>
  );
}
