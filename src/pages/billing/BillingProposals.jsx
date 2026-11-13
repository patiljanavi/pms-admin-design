import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowDown, ArrowUp, ArrowUpDown, CheckCircle2, ChevronDown, Clock, ExternalLink, FilePen, FileSignature, Files, Filter, Plus, RotateCcw, Search, SearchX, Send, Trash2, X,
} from 'lucide-react';

// shadcn components — one file each in src/components/ui
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { ToastBridge } from '../../components/ui/sonner';

// your app components
import { Modal } from '../../components/ui';
import { EmptyState, StatCard } from '../../components/page';
import RowActionsMenu from '../../components/RowActionsMenu';
import { BulkBar, HeaderCheckbox, SelectCheckbox, useSelection } from '../../components/TableSelection';
import Pagination, { usePagination } from '../../components/Pagination';
import { useData } from '../../context/DataContext';
import { accountTabPath } from '../../config';
import { PROPOSAL_STATUS, demoProposals, newProposalId, proposalDisplayName } from '../../data/accountProposals';
import { money } from '../../data/invoiceTemplates';
import { proposalTotal } from '../../data/proposalTemplates';
import { cn } from 'lib/utils';

export const BILLING_PROPOSALS_URL = '/billing/proposalsandels';
const ALL = 'all';
const ORDER = ['draft', 'sent', 'signed'];
const PROPOSAL_BADGE = { draft: 'neutral', sent: 'info', signed: 'success' };
const fmtDate = (d) => (d ? new Date(d.length === 10 ? `${d}T00:00:00` : d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—');
const Dash = () => <span className="text-muted-foreground/60">—</span>;
const billingOf = (p) => (!p.general?.servicesEnabled ? null
  : p.services?.option === 'invoice' ? `${p.services.invoices.length} invoice${p.services.invoices.length === 1 ? '' : 's'}`
    : p.services?.option === 'services' ? 'Itemized services' : 'Not set');
const totalOf = (p) => (p.general?.servicesEnabled && p.services?.option ? proposalTotal(p) : null);

/* ---------- small table helpers ---------- */
/** Sortable column header: click to sort, click again to reverse. sort = { col, dir } */
function SortHead({ label, col, sort, setSort, className }) {
  const on = sort.col === col;
  const Icon = !on ? ArrowUpDown : sort.dir === 'asc' ? ArrowUp : ArrowDown;
  return (
    <TableHead className={className} aria-sort={on ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <Button variant="ghost" size="sm" className="-ml-3 h-8 gap-1.5" onClick={() => setSort((s) => ({ col, dir: s.col === col && s.dir === 'asc' ? 'desc' : 'asc' }))}>
        {label}<Icon className={cn('size-3.5', !on && 'opacity-40')} aria-hidden="true" />
      </Button>
    </TableHead>
  );
}
/** Name cell: icon · name (opens the row) · one-line preview. */
function NameCell({ icon: Icon, name, preview, onOpen }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 inline-flex size-8 flex-none items-center justify-center rounded-lg border bg-subtle text-muted-foreground" aria-hidden="true"><Icon className="size-4" /></span>
      <div className="min-w-0">
        <button type="button" onClick={onOpen} className="max-w-full truncate text-left font-medium text-foreground underline-offset-4 hover:underline">{name}</button>
        {preview && <p className="truncate text-xs text-muted-foreground">{preview}</p>}
      </div>
    </div>
  );
}
/** Filter button with a checkbox menu (shadcn DropdownMenu); optional search box for long lists. */
function CheckFilter({ label, options, value, onChange, searchable = false }) {
  const [q, setQ] = useState('');
  const shown = searchable && q.trim() ? options.filter((o) => o.label.toLowerCase().includes(q.trim().toLowerCase())) : options;
  const toggle = (v) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  return (
    <DropdownMenu onOpenChange={(o) => !o && setQ('')}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed" aria-label={`Filter by ${label.toLowerCase()}`}>
          <Filter aria-hidden="true" />{label}
          {value.length > 0 && <Badge variant="secondary" className="ml-1 rounded-sm px-1.5 font-normal">{value.length}</Badge>}
          <ChevronDown className="opacity-50" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        {searchable && (
          <div className="px-2 pb-2">
            <Input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.stopPropagation()} placeholder={`Search ${label.toLowerCase()}`} aria-label={`Search ${label.toLowerCase()}`} className="h-8" />
          </div>
        )}
        <DropdownMenuSeparator />
        <div className="max-h-64 overflow-y-auto">
          {shown.map((o) => (
            <DropdownMenuCheckboxItem key={o.value} checked={value.includes(o.value)} onCheckedChange={() => toggle(o.value)} onSelect={(e) => e.preventDefault()}>{o.label}</DropdownMenuCheckboxItem>
          ))}
          {!shown.length && <p className="px-2 py-3 text-center text-sm text-muted-foreground">No matches</p>}
        </div>
        {value.length > 0 && (<><DropdownMenuSeparator /><DropdownMenuItem onSelect={() => onChange([])} className="justify-center">Clear</DropdownMenuItem></>)}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Billing → Proposals & ELs: every account's proposals (saved on each account: account.proposals, else the demo proposals).
 * Filters: search · Status · Account · Template. Sort · select rows · bulk Send / Mark as signed / Delete · pagination.
 * Edit / New open the account's proposal pages (with state.returnTo, so they can come back here). ?new=proposal asks for the account first.
 */
export default function BillingProposals() {
  const navigate = useNavigate();
  const { state: routeState, pathname } = useLocation();
  const [params, setParams] = useSearchParams();
  const { accounts = [], setAccounts, proposalTemplates = [] } = useData();

  const [q, setQ] = useState('');
  const [status, setStatus] = useState(ALL);
  const [accountIds, setAccountIds] = useState(() => (params.get('account') ? [params.get('account')] : []));
  const [templateIds, setTemplateIds] = useState([]);
  const [sort, setSort] = useState({ col: 'updated', dir: 'desc' });
  const [confirm, setConfirm] = useState(null);             // proposals to delete
  const [choose, setChoose] = useState(null);               // New proposal: account id being chosen ('' = none yet)
  const [note, setNote] = useState('');
  const notify = (m) => { setNote(m); setTimeout(() => setNote(''), 2400); };
  const selection = useSelection();

  // messages back from the proposal page; ?new=proposal opens the account picker
  useEffect(() => {
    if (routeState?.toast) { notify(routeState.toast); navigate(pathname, { replace: true, state: null }); }
  }, [routeState]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (params.get('new') === 'proposal') { setChoose(''); const n = new URLSearchParams(params); n.delete('new'); setParams(n, { replace: true }); }
  }, [params]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- every account's proposals ---------- */
  const listOf = (a) => a.proposals ?? demoProposals(a, proposalTemplates);
  const all = useMemo(() => accounts.flatMap((a) => listOf(a).map((p) => ({
    ...p,
    accountId: a.id,
    accountName: a.name,
    displayName: proposalDisplayName(p, a),
    templateName: proposalTemplates.find((t) => t.id === p.general?.templateId)?.general?.templateName || '',
    state: p.status || 'draft',
  }))), [accounts, proposalTemplates]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Change the proposals of the given accounts: fn(list) → new list. */
  const update = (items, fn) => {
    const ids = [...new Set(items.map((p) => p.accountId))];
    setAccounts((list) => list.map((a) => (ids.includes(a.id) ? { ...a, proposals: fn(listOf(a), a) } : a)));
  };
  const changeStatus = (items, to) => {
    if (!items.length) return;
    const ids = new Set(items.map((p) => p.id));
    const now = new Date().toISOString();
    update(items, (list) => list.map((p) => (ids.has(p.id)
      ? { ...p, status: to, updatedAt: now, ...(to === 'sent' && !p.sentAt ? { sentAt: now } : {}), ...(to === 'signed' ? { signedAt: now } : {}) } : p)));
    selection.setMany([...ids], false);
    const n = items.length;
    notify(to === 'signed' ? `Marked ${n === 1 ? 'as' : `${n} proposals as`} signed` : to === 'sent' ? (n === 1 ? 'Proposal sent' : `Sent ${n} proposals`) : 'Proposal reopened');
  };
  const duplicate = (item) => {
    const now = new Date().toISOString();
    update([item], (list) => {
      const src = list.find((p) => p.id === item.id);
      if (!src) return list;
      const copy = { ...JSON.parse(JSON.stringify(src)), id: newProposalId(), status: 'draft', createdAt: now, updatedAt: now };
      delete copy.sentAt; delete copy.signedAt;
      copy.general.proposalName = `${src.general.proposalName} (copy)`;
      return [copy, ...list];
    });
    notify('Proposal duplicated');
  };
  const remove = (items) => {
    const ids = new Set(items.map((p) => p.id));
    update(items, (list) => list.filter((p) => !ids.has(p.id)));
    selection.setMany([...ids], false);
    notify(items.length > 1 ? `Deleted ${items.length} proposals` : 'Proposal deleted');
  };

  /* ---------- filter · sort · pagination ---------- */
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const val = {
      name: (p) => p.displayName.toLowerCase(),
      account: (p) => p.accountName.toLowerCase(),
      status: (p) => ORDER.indexOf(p.state),
      total: (p) => totalOf(p) ?? -1,
      updated: (p) => p.updatedAt || p.createdAt || '',
    }[sort.col];
    return all
      .filter((p) => (!s || `${p.displayName} ${p.accountName} ${p.templateName}`.toLowerCase().includes(s))
        && (status === ALL || p.state === status)
        && (!accountIds.length || accountIds.includes(p.accountId))
        && (!templateIds.length || templateIds.includes(p.general?.templateId)))
      .sort((a, b) => { const x = val(a); const y = val(b); return (x < y ? -1 : x > y ? 1 : 0) * (sort.dir === 'asc' ? 1 : -1); });
  }, [all, q, status, accountIds, templateIds, sort]);
  const paging = usePagination(filtered, { initialSize: 25, storageKey: 'billing-proposals' });
  const { pageItems: rows, setPage } = paging;
  const selected = filtered.filter((p) => selection.has(p.id));
  const filtersOn = q || status !== ALL || accountIds.length || templateIds.length;
  const reset = () => { setQ(''); setStatus(ALL); setAccountIds([]); setTemplateIds([]); setPage(1); setParams({}, { replace: true }); };

  const by = (s) => all.filter((p) => p.state === s);
  const value = (list) => list.reduce((n, p) => n + (totalOf(p) || 0), 0);
  // proposal pages live on the account; returnTo brings them back here
  const openEdit = (p) => navigate(`${accountTabPath('proposals', p.accountId)}/${p.id}`, { state: { returnTo: BILLING_PROPOSALS_URL } });
  const openNew = (accountId) => navigate(`${accountTabPath('proposals', accountId)}/new`, { state: { returnTo: BILLING_PROPOSALS_URL } });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Billing / Proposals &amp; ELs</p>
          <h1 className="text-3xl font-semibold tracking-tight">Proposals &amp; ELs</h1>
          <p className="text-muted-foreground">Proposals and engagement letters for every account.</p>
        </div>
        <Button onClick={() => setChoose(accountIds.length === 1 ? accountIds[0] : '')}><Plus />New proposal</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard label="All proposals" value={all.length} icon={Files} />
        <StatCard label="Waiting for signature" value={money(value(by('sent')))} icon={Clock} />
        <StatCard label="Signed" value={money(value(by('signed')))} icon={CheckCircle2} />
        <StatCard label="Drafts" value={by('draft').length} icon={FilePen} />
      </div>

      <section className="overflow-hidden rounded-xl border bg-card shadow-card" aria-label="All proposals">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2 size-4 text-muted-foreground" aria-hidden="true" />
            <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search proposal, account or template…" aria-label="Search proposals" className="h-8 pl-8" />
          </div>
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="h-8 w-[200px]" aria-label="Status"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All statuses</SelectItem>
              {ORDER.map((k) => <SelectItem key={k} value={k}>{PROPOSAL_STATUS[k].label}</SelectItem>)}
            </SelectContent>
          </Select>
          <CheckFilter label="Account" searchable options={accounts.map((a) => ({ value: a.id, label: a.name }))} value={accountIds} onChange={(v) => { setAccountIds(v); setPage(1); }} />
          <CheckFilter label="Template" options={proposalTemplates.map((t) => ({ value: t.id, label: t.general.templateName }))} value={templateIds} onChange={(v) => { setTemplateIds(v); setPage(1); }} />
          {filtersOn ? <Button variant="ghost" size="sm" onClick={reset} className="text-muted-foreground">Reset<X /></Button> : null}
          <span className="ml-auto text-sm tabular-nums text-muted-foreground" data-testid="proposal-count">{filtered.length} of {all.length}</span>
        </div>

        <BulkBar count={selection.count} total={filtered.length}
          onSelectAll={() => selection.setMany(filtered.map((p) => p.id), true)} onClear={selection.clear}
          actions={<>
            <Button variant="outline" size="sm" disabled={!selected.some((p) => p.state === 'draft')} onClick={() => changeStatus(selected.filter((p) => p.state === 'draft'), 'sent')}><Send />Send</Button>
            <Button variant="outline" size="sm" disabled={!selected.some((p) => p.state === 'sent')} onClick={() => changeStatus(selected.filter((p) => p.state === 'sent'), 'signed')}><CheckCircle2 />Mark as signed</Button>
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setConfirm(selected)}><Trash2 />Delete</Button>
          </>} />

        <div className="overflow-x-auto">
          <Table className="min-w-[1180px]" aria-label="Proposals">
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"><HeaderCheckbox selection={selection} pageIds={rows.map((p) => p.id)} /></TableHead>
                <SortHead label="Proposal" col="name" sort={sort} setSort={setSort} />
                <SortHead label="Account" col="account" sort={sort} setSort={setSort} />
                <SortHead label="Status" col="status" sort={sort} setSort={setSort} />
                <TableHead>Billing</TableHead>
                <SortHead label="Total" col="total" sort={sort} setSort={setSort} className="text-right" />
                <SortHead label="Updated" col="updated" sort={sort} setSort={setSort} />
                <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((p) => {
                const checked = selection.has(p.id);
                const total = totalOf(p);
                return (
                  <TableRow key={p.id} data-state={checked ? 'selected' : undefined}>
                    <TableCell><SelectCheckbox label={`Select ${p.displayName}`} checked={checked} onChange={() => selection.toggle(p.id)} /></TableCell>
                    <TableCell className="max-w-[320px]"><NameCell icon={FileSignature} name={p.displayName} preview={p.templateName ? `From “${p.templateName}”` : 'No template'} onOpen={() => openEdit(p)} /></TableCell>
                    <TableCell>
                      <button type="button" className="text-left font-medium hover:text-primary hover:underline" onClick={() => navigate(accountTabPath('proposals', p.accountId))}>{p.accountName}</button>
                    </TableCell>
                    <TableCell><Badge variant={PROPOSAL_BADGE[p.state] || 'neutral'} dot>{(PROPOSAL_STATUS[p.state] || PROPOSAL_STATUS.draft).label}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{billingOf(p) ?? <Dash />}</TableCell>
                    <TableCell className="whitespace-nowrap text-right font-medium tabular-nums">{total != null ? money(total) : <Dash />}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm tabular-nums text-muted-foreground">{fmtDate(p.updatedAt || p.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <RowActionsMenu label={p.displayName} onEdit={() => openEdit(p)} onDuplicate={() => duplicate(p)} onDelete={() => setConfirm([p])}
                        extra={[
                          ...(p.state === 'draft' ? [{ label: 'Send proposal', icon: Send, onClick: () => changeStatus([p], 'sent') }] : []),
                          ...(p.state === 'sent' ? [{ label: 'Mark as signed', icon: CheckCircle2, onClick: () => changeStatus([p], 'signed') }] : []),
                          ...(p.state === 'signed' ? [{ label: 'Reopen', icon: RotateCcw, onClick: () => changeStatus([p], 'sent') }] : []),
                          { label: 'Open account', icon: ExternalLink, onClick: () => navigate(accountTabPath('proposals', p.accountId)) },
                        ]} />
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={8}>
                    {all.length ? (
                      <EmptyState icon={SearchX} title="No proposals match" description="Try a different search or remove some filters."
                        action={<Button variant="outline" onClick={reset}>Clear filters</Button>} />
                    ) : (
                      <EmptyState icon={FileSignature} title="No proposals yet" description="Send a proposal or engagement letter for a client to review and sign."
                        action={<Button onClick={() => setChoose('')}><Plus />New proposal</Button>} />
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {filtered.length > 0 && <Pagination {...paging} label="proposals" />}
      </section>

      {/* New proposal: choose the account first */}
      {choose !== null && (
        <Modal title="New proposal" description="Which account is it for?" onClose={() => setChoose(null)} width="max-w-md"
          footer={<><Button variant="outline" onClick={() => setChoose(null)}>Cancel</Button><Button disabled={!choose} onClick={() => openNew(choose)}>Continue</Button></>}>
          <div className="grid gap-2">
            <Label htmlFor="new-proposal-account">Account</Label>
            <Select value={choose || undefined} onValueChange={setChoose}>
              <SelectTrigger id="new-proposal-account" aria-label="Account"><SelectValue placeholder="Select an account" /></SelectTrigger>
              <SelectContent>{accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}{a.company ? ` — ${a.company}` : ''}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </Modal>
      )}

      {/* Delete confirm */}
      {confirm && (
        <Modal title={confirm.length === 1 ? `Delete “${confirm[0].displayName}”?` : `Delete ${confirm.length} proposals?`}
          description="The clients will no longer see them." onClose={() => setConfirm(null)}
          footer={<><Button variant="outline" onClick={() => setConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { remove(confirm); setConfirm(null); }}><Trash2 />{confirm.length === 1 ? 'Delete proposal' : 'Delete proposals'}</Button></>}>
          <ul className="mb-2 max-h-40 list-disc overflow-y-auto pl-5 text-sm">{confirm.map((p) => <li key={p.id}>{p.displayName} · {p.accountName}</li>)}</ul>
          <p className="text-sm text-muted-foreground">This can't be undone.</p>
        </Modal>
      )}
      <ToastBridge message={note} />
    </div>
  );
}
