import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle, ChevronRight, Copy, CreditCard, Download, FileSignature, ListChecks, Plus, Receipt, SearchX, Trash2, X } from 'lucide-react';
import RowActionsMenu from '../../../components/RowActionsMenu';
import Pagination, { usePagination } from '../../../components/Pagination';
import {
  BarSelect, BulkBar, HeaderCheckbox, SelectCheckbox, SelectedOnlyFilter, barButton, barDanger, downloadCsv, useSelection,
} from '../../../components/TableSelection';
import { Avatar, Modal, initials } from '../../../components/ui';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { ToastBridge } from '../../../components/ui/sonner';
import { SimpleTooltip } from '../../../components/ui/tooltip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { DataCard, EmptyState, SearchInput, StatCard } from '../../../components/page';
import { useData } from '../../../context/DataContext';
import { money } from '../../../data/invoiceTemplates';
import { proposalSteps, proposalTotal } from '../../../data/proposalTemplates';

const LIST_PATH = '/firmtemp/templates/proposals';
const fmtDate = (d) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—');
const BILLING = { invoice: 'Invoices', services: 'Itemized services', '': 'Not set' };
const billingOf = (p) => (p.general.servicesEnabled ? (p.services.option || '') : 'none');
const BILLING_FILTER = [
  { value: 'All', label: 'All' },
  { value: 'invoice', label: 'Invoices' },
  { value: 'services', label: 'Itemized services' },
  { value: 'none', label: 'No services step' },
];
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const Dash = () => <span className="text-muted-foreground/60">—</span>;

/** Title row for a tab inside the Firm Templates layout (the layout owns the page h1). */
function ListHeader({ title, description, action }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

/** Firm Templates → Proposals & ELs: table of proposal templates. New / Edit open ProposalTemplateForm. */
export default function ProposalTemplates() {
  const navigate = useNavigate();
  const { state: routeState, pathname } = useLocation();
  const { proposalTemplates = [], duplicateProposalTemplates, deleteProposalTemplates } = useData();

  const [q, setQ] = useState('');
  const [billing, setBilling] = useState('All');
  const [confirm, setConfirm] = useState(null);
  const [toast, setToast] = useState('');
  const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 2600); };
  useEffect(() => {
    if (routeState?.toast) { notify(routeState.toast); navigate(pathname, { replace: true, state: null }); }
  }, [routeState]); // eslint-disable-line react-hooks/exhaustive-deps

  const selection = useSelection();
  const [selectedOnly, setSelectedOnly] = useState(false);
  useEffect(() => { if (selection.count === 0) setSelectedOnly(false); }, [selection.count]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return proposalTemplates.filter((p) => (billing === 'All' || billingOf(p) === billing)
      && (!selectedOnly || selection.has(p.id))
      && (!s || `${p.general.templateName} ${p.general.proposalName} ${(p.general.teamMembers || []).join(' ')}`.toLowerCase().includes(s)));
  }, [proposalTemplates, q, billing, selectedOnly, selection]);
  const paging = usePagination(filtered, { initialSize: 10, storageKey: 'proposal-templates' });
  const { pageItems: rows, setPage } = paging;
  const selected = proposalTemplates.filter((p) => selection.has(p.id));
  const filtersOn = q || billing !== 'All';
  const reset = () => { setQ(''); setBilling('All'); setSelectedOnly(false); setPage(1); };

  if (!duplicateProposalTemplates) {
    return (
      <div role="alert" className="flex items-center gap-3 rounded-xl border border-danger-100 bg-danger-50 p-5 text-sm font-medium text-danger-700">
        <AlertTriangle className="size-4 flex-none" aria-hidden="true" />Proposal templates are not set up in DataContext.js
      </div>
    );
  }

  const openNew = () => navigate(`${LIST_PATH}/new`);
  const openEdit = (p) => navigate(`${LIST_PATH}/${p.id}`);
  const remove = () => {
    const ids = confirm.map((p) => p.id);
    deleteProposalTemplates(ids); selection.setMany(ids, false); setConfirm(null);
    notify(`Deleted ${ids.length} proposal${ids.length > 1 ? 's' : ''}`);
  };
  const exportCsv = (items) => {
    downloadCsv('proposal-templates.csv', [['Template name', 'Proposal name', 'Steps', 'Billing', 'Invoices', 'Total', 'Team', 'Updated'],
      ...items.map((p) => [p.general.templateName, p.general.proposalName, proposalSteps(p).map((s) => s.name).join(' → '), BILLING[billingOf(p)] || '—',
        p.services.option === 'invoice' ? p.services.invoices.length : 0, proposalTotal(p), (p.general.teamMembers || []).join('; '), p.updatedAt])]);
    notify(`Exported ${items.length} proposals`);
  };
  const setBillingFilter = (v) => { setBilling(v); setPage(1); };
  const toggleStat = (v) => setBillingFilter(billing === v ? 'All' : v);

  return (
    <div className="flex flex-col gap-6">
      <ListHeader title="Proposal & EL templates" description="Proposals with an introduction, engagement letter, services or invoices, and payment."
        action={<Button onClick={openNew}><Plus />New proposal template</Button>} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard label="Total proposals" value={proposalTemplates.length} icon={FileSignature} />
        <StatCard label="Bill with invoices" value={proposalTemplates.filter((p) => billingOf(p) === 'invoice').length} icon={Receipt} tone="brand"
          onClick={() => toggleStat('invoice')} active={billing === 'invoice'} hint={billing === 'invoice' ? 'Filtered · click to clear' : 'Click to filter'} />
        <StatCard label="Itemized services" value={proposalTemplates.filter((p) => billingOf(p) === 'services').length} icon={ListChecks}
          onClick={() => toggleStat('services')} active={billing === 'services'} hint={billing === 'services' ? 'Filtered · click to clear' : 'Click to filter'} />
        <StatCard label="Collect payment" value={proposalTemplates.filter((p) => p.general.paymentsEnabled && p.services.option === 'invoice').length} icon={CreditCard} tone="success" />
      </div>

      <DataCard
        toolbar={<>
          <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} label="Search proposals"
            placeholder="Search template, proposal name, team" className="h-8 w-full sm:w-72" />
          <BarSelect label="Billing" value={billing} onChange={setBillingFilter} options={BILLING_FILTER} />
          {filtersOn ? <Button variant="ghost" size="sm" onClick={reset} className="text-muted-foreground">Reset<X /></Button> : null}
          <span className="ml-auto hidden text-sm tabular-nums text-muted-foreground md:inline">{filtered.length} of {proposalTemplates.length}</span>
        </>}
        footer={filtered.length > 0 && <Pagination {...paging} label="proposals" />}
      >
        <Table className="min-w-[1000px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"><HeaderCheckbox selection={selection} pageIds={rows.map((p) => p.id)} /></TableHead>
              <TableHead>Template</TableHead>
              <TableHead>Steps</TableHead>
              <TableHead>Billing</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((p) => {
              const checked = selection.has(p.id);
              const b = billingOf(p);
              const team = p.general.teamMembers || [];
              const steps = proposalSteps(p).slice(1);
              return (
                <TableRow key={p.id} data-state={checked ? 'selected' : undefined} aria-selected={checked}>
                  <TableCell><SelectCheckbox label={`Select ${p.general.templateName}`} checked={checked} onChange={() => selection.toggle(p.id)} /></TableCell>
                  <TableCell className="max-w-[300px]">
                    <Link to={`${LIST_PATH}/${p.id}`} className="block truncate font-medium text-foreground underline-offset-4 hover:underline">{p.general.templateName}</Link>
                    {p.general.proposalName && <div className="truncate font-mono text-xs text-muted-foreground">{p.general.proposalName}</div>}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-0.5">
                      {steps.map((s, i) => (
                        <span key={s.key} className="inline-flex items-center gap-0.5">
                          {i > 0 && <ChevronRight className="size-3 text-muted-foreground/50" aria-hidden="true" />}
                          <Badge variant="neutral" className="px-1.5 font-medium">{s.name}</Badge>
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {b === 'none' ? <Dash />
                      : b === 'invoice' ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Badge variant="info"><Receipt aria-hidden="true" />{p.services.invoices.length} invoice{p.services.invoices.length === 1 ? '' : 's'}</Badge>
                          {p.general.paymentsEnabled && <Badge variant="success"><CreditCard aria-hidden="true" />payment</Badge>}
                        </span>
                      )
                        : b === 'services' ? <Badge variant="violet"><ListChecks aria-hidden="true" />{BILLING[b]}</Badge>
                          : <Badge variant="neutral">{BILLING[b]}</Badge>}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{b === 'none' || !b ? <Dash /> : money(proposalTotal(p))}</TableCell>
                  <TableCell>
                    {team.length ? (
                      <SimpleTooltip label={team.join(', ')}>
                        <span tabIndex={0} className="inline-flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
                          <span className="flex -space-x-1">
                            {team.slice(0, 3).map((n) => <span key={n} className="rounded-full ring-2 ring-card"><Avatar text={initials(n)} size="xs" /></span>)}
                          </span>
                          {team.length > 3 && <span className="text-xs tabular-nums text-muted-foreground">+{team.length - 3}</span>}
                        </span>
                      </SimpleTooltip>
                    ) : <Dash />}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{fmtDate(p.updatedAt)}</TableCell>
                  <TableCell className="text-right">
                    <RowActionsMenu label={p.general.templateName} onEdit={() => openEdit(p)}
                      onDuplicate={() => { duplicateProposalTemplates([p.id]); notify(`Duplicated “${p.general.templateName}”`); }}
                      onDelete={() => setConfirm([p])} />
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={8}>
                  {proposalTemplates.length ? (
                    <EmptyState icon={SearchX} title="No proposals match these filters" description="Try a different search or billing option."
                      action={<Button variant="outline" onClick={reset}>Clear filters</Button>} />
                  ) : (
                    <EmptyState icon={FileSignature} title="No proposal templates yet" description="Put your introduction, engagement letter and pricing together once, then send it to any client."
                      action={<Button onClick={openNew}><Plus />New proposal template</Button>} />
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </DataCard>

      <BulkBar count={selection.count} total={filtered.length}
        onSelectAll={() => selection.setMany(filtered.map((p) => p.id), true)} onClear={selection.clear}
        filters={<SelectedOnlyFilter checked={selectedOnly} onChange={(v) => { setSelectedOnly(v); setPage(1); }} />}
        actions={<>
          <button type="button" className={barButton} onClick={() => { duplicateProposalTemplates([...selection.ids]); notify(`Duplicated ${selection.count} proposal${selection.count > 1 ? 's' : ''}`); selection.clear(); }}><Copy aria-hidden="true" />Duplicate</button>
          <button type="button" className={barButton} onClick={() => exportCsv(selected)}><Download aria-hidden="true" />Export</button>
          <button type="button" className={barDanger} onClick={() => setConfirm(selected)}><Trash2 aria-hidden="true" />Delete</button>
        </>}
      />

      {confirm && (
        <Modal title={confirm.length === 1 ? `Delete “${confirm[0].general.templateName}”?` : `Delete ${confirm.length} proposals?`}
          description={`Proposals already sent from ${confirm.length === 1 ? 'this template' : 'these templates'} are not affected.`}
          onClose={() => setConfirm(null)}
          footer={<><Button variant="outline" onClick={() => setConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={remove}><Trash2 />{confirm.length > 1 ? `Delete ${plural(confirm.length, 'proposal')}` : 'Delete'}</Button></>}>
          <ul className="max-h-48 divide-y overflow-y-auto rounded-lg border">
            {confirm.map((p) => (
              <li key={p.id} className="flex items-center gap-2.5 px-3 py-2 text-sm">
                <FileSignature className="size-4 flex-none text-muted-foreground" aria-hidden="true" />
                <span className="truncate font-medium">{p.general.templateName}</span>
                {p.general.proposalName && <span className="truncate font-mono text-xs text-muted-foreground">{p.general.proposalName}</span>}
              </li>
            ))}
          </ul>
        </Modal>
      )}
      <ToastBridge message={toast} />
    </div>
  );
}
