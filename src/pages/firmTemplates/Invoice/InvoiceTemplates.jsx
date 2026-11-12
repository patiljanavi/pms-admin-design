import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle, Bell, Copy, CreditCard, DollarSign, Download, Eye, FileText, Mail, Plus, SearchX, Trash2, X } from 'lucide-react';
import RowActionsMenu from '../../../components/RowActionsMenu';
import InvoicePreview from '../../../components/InvoicePreview';
import Pagination, { usePagination } from '../../../components/Pagination';
import {
  BarSelect, BulkBar, HeaderCheckbox, SelectCheckbox, SelectedOnlyFilter, barButton, barDanger, downloadCsv, useSelection,
} from '../../../components/TableSelection';
import { Modal } from '../../../components/ui';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { ToastBridge } from '../../../components/ui/sonner';
import { SimpleTooltip } from '../../../components/ui/tooltip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { DataCard, EmptyState, SearchInput, StatCard } from '../../../components/page';
import { useData } from '../../../context/DataContext';
import { PAYMENT_OPTIONS, calcTotals, money, paymentLabel } from '../../../data/invoiceTemplates';

const LIST_PATH = '/firmtemp/templates/invoices';
const fmtDate = (d) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—');
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

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

/** Small icon chip with a tooltip, for the Options column. */
function OptionIcon({ label, icon: Icon, className }) {
  return (
    <SimpleTooltip label={label}>
      <span tabIndex={0} aria-label={label} role="img"
        className={`inline-flex size-6 items-center justify-center rounded-md border bg-subtle text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 ${className || ''}`}>
        <Icon className="size-3.5" aria-hidden="true" />
      </span>
    </SimpleTooltip>
  );
}

/** Firm Templates → Invoices: table of invoice templates. New / Edit open InvoiceTemplateForm. */
export default function InvoiceTemplates() {
  const navigate = useNavigate();
  const { state: routeState, pathname } = useLocation();
  const { invoiceTemplates = [], duplicateInvoiceTemplates, deleteInvoiceTemplates } = useData();

  const [q, setQ] = useState('');
  const [payment, setPayment] = useState('All');
  const [confirm, setConfirm] = useState(null);
  const [preview, setPreview] = useState(null);
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
    return invoiceTemplates.filter((t) => (payment === 'All' || t.paymentMode?.value === payment)
      && (!selectedOnly || selection.has(t.id))
      && (!s || `${t.templatename} ${t.description} ${(t.rows || []).map((r) => r.productName).join(' ')}`.toLowerCase().includes(s)));
  }, [invoiceTemplates, q, payment, selectedOnly, selection]);
  const paging = usePagination(filtered, { initialSize: 10, storageKey: 'invoice-templates' });
  const { pageItems: rows, setPage } = paging;
  const selected = invoiceTemplates.filter((t) => selection.has(t.id));
  const filtersOn = q || payment !== 'All';
  const reset = () => { setQ(''); setPayment('All'); setSelectedOnly(false); setPage(1); };

  if (!duplicateInvoiceTemplates) {
    return (
      <div role="alert" className="flex items-center gap-3 rounded-xl border border-danger-100 bg-danger-50 p-5 text-sm font-medium text-danger-700">
        <AlertTriangle className="size-4 flex-none" aria-hidden="true" />Invoice templates are not set up in DataContext.js
      </div>
    );
  }

  const openNew = () => navigate(`${LIST_PATH}/new`);
  const openEdit = (t) => navigate(`${LIST_PATH}/${t.id}`);
  const remove = () => {
    const ids = confirm.map((t) => t.id);
    deleteInvoiceTemplates(ids); selection.setMany(ids, false); setConfirm(null);
    notify(`Deleted ${ids.length} template${ids.length > 1 ? 's' : ''}`);
  };
  const exportCsv = (items) => {
    downloadCsv('invoice-templates.csv', [['Name', 'Description', 'Payment method', 'Line items', 'Subtotal', 'Tax rate', 'Total', 'Email on create', 'Reminders', 'Updated'],
      ...items.map((t) => { const x = calcTotals(t.rows, t.taxRate); return [t.templatename, t.description, paymentLabel(t.paymentMode),
        (t.rows || []).map((r) => `${r.productName} x${r.qty}`).join('; '), x.subtotal, t.taxRate, x.totalAmount, t.emailToClient ? 'Yes' : 'No',
        t.invoiceReminders ? `Every ${t.daysNextReminder} days, ${t.numOfReminder} times` : 'Off', t.updatedAt]; })]);
    notify(`Exported ${items.length} templates`);
  };

  const avgTotal = invoiceTemplates.length ? invoiceTemplates.reduce((s, t) => s + calcTotals(t.rows, t.taxRate).totalAmount, 0) / invoiceTemplates.length : 0;
  const paymentOptions = [{ value: 'All', label: 'All' }, ...PAYMENT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))];

  return (
    <div className="flex flex-col gap-6">
      <ListHeader title="Invoice templates" description="Invoices with preset line items, payment method, emails and reminders."
        action={<Button onClick={openNew}><Plus />New invoice template</Button>} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard label="Total templates" value={invoiceTemplates.length} icon={FileText} />
        <StatCard label="With reminders" value={invoiceTemplates.filter((t) => t.invoiceReminders).length} icon={Bell} tone="warning" />
        <StatCard label="Email on create" value={invoiceTemplates.filter((t) => t.emailToClient).length} icon={Mail} tone="brand" />
        <StatCard label="Average total" value={money(avgTotal)} icon={DollarSign} tone="success" />
      </div>

      <DataCard
        toolbar={<>
          <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} label="Search invoice templates"
            placeholder="Search name, description, line item" className="h-8 w-full sm:w-72" />
          <BarSelect label="Payment method" value={payment} onChange={(v) => { setPayment(v); setPage(1); }} options={paymentOptions} />
          {filtersOn ? <Button variant="ghost" size="sm" onClick={reset} className="text-muted-foreground">Reset<X /></Button> : null}
          <span className="ml-auto hidden text-sm tabular-nums text-muted-foreground md:inline">{filtered.length} of {invoiceTemplates.length}</span>
        </>}
        footer={filtered.length > 0 && <Pagination {...paging} label="templates" />}
      >
        <Table className="min-w-[900px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"><HeaderCheckbox selection={selection} pageIds={rows.map((t) => t.id)} /></TableHead>
              <TableHead>Template name</TableHead>
              <TableHead>Payment method</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Options</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((t) => {
              const checked = selection.has(t.id);
              const { totalAmount } = calcTotals(t.rows, t.taxRate);
              const pay = paymentLabel(t.paymentMode);
              const noOptions = !t.emailToClient && !t.invoiceReminders && !t.payUsingCredits;
              return (
                <TableRow key={t.id} data-state={checked ? 'selected' : undefined} aria-selected={checked}>
                  <TableCell><SelectCheckbox label={`Select ${t.templatename}`} checked={checked} onChange={() => selection.toggle(t.id)} /></TableCell>
                  <TableCell className="max-w-[320px]">
                    <Link to={`${LIST_PATH}/${t.id}`} className="block truncate font-medium text-foreground underline-offset-4 hover:underline">{t.templatename}</Link>
                    {t.description && <div className="truncate text-xs text-muted-foreground">{t.description}</div>}
                  </TableCell>
                  <TableCell>{pay === '—' ? <span className="text-muted-foreground/60">—</span> : <Badge variant="neutral"><CreditCard aria-hidden="true" />{pay}</Badge>}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{money(totalAmount)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {t.emailToClient && <OptionIcon label="Emails the client when created" icon={Mail} />}
                      {t.invoiceReminders && <OptionIcon label={`Reminds every ${t.daysNextReminder} days, ${t.numOfReminder} times`} icon={Bell} className="border-warning-100 bg-warning-50 text-warning-700" />}
                      {t.payUsingCredits && <OptionIcon label="Pays with credits if available" icon={CreditCard} />}
                      {noOptions && <span className="text-muted-foreground/60">—</span>}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{fmtDate(t.updatedAt)}</TableCell>
                  <TableCell className="text-right">
                    <RowActionsMenu label={t.templatename} onEdit={() => openEdit(t)}
                      onDuplicate={() => { duplicateInvoiceTemplates([t.id]); notify(`Duplicated “${t.templatename}”`); }}
                      extra={[{ label: 'Preview', icon: Eye, onClick: () => setPreview(t) }]}
                      onDelete={() => setConfirm([t])} />
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={7}>
                  {invoiceTemplates.length ? (
                    <EmptyState icon={SearchX} title="No invoice templates match these filters" description="Try a different search or payment method."
                      action={<Button variant="outline" onClick={reset}>Clear filters</Button>} />
                  ) : (
                    <EmptyState icon={FileText} title="No invoice templates yet" description="Save your usual line items, payment method and reminders once, then reuse them."
                      action={<Button onClick={openNew}><Plus />New invoice template</Button>} />
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </DataCard>

      <BulkBar count={selection.count} total={filtered.length}
        onSelectAll={() => selection.setMany(filtered.map((t) => t.id), true)} onClear={selection.clear}
        filters={<SelectedOnlyFilter checked={selectedOnly} onChange={(v) => { setSelectedOnly(v); setPage(1); }} />}
        actions={<>
          <button type="button" className={barButton} onClick={() => { duplicateInvoiceTemplates([...selection.ids]); notify(`Duplicated ${selection.count} template${selection.count > 1 ? 's' : ''}`); selection.clear(); }}><Copy aria-hidden="true" />Duplicate</button>
          <button type="button" className={barButton} onClick={() => exportCsv(selected)}><Download aria-hidden="true" />Export</button>
          <button type="button" className={barDanger} onClick={() => setConfirm(selected)}><Trash2 aria-hidden="true" />Delete</button>
        </>}
      />

      {preview && <InvoicePreview form={preview} onClose={() => setPreview(null)} />}
      {confirm && (
        <Modal title={confirm.length === 1 ? `Delete “${confirm[0].templatename}”?` : `Delete ${confirm.length} templates?`}
          description={`Invoices already created from ${confirm.length === 1 ? 'this template' : 'these templates'} are not affected.`}
          onClose={() => setConfirm(null)}
          footer={<><Button variant="outline" onClick={() => setConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={remove}><Trash2 />{confirm.length > 1 ? `Delete ${plural(confirm.length, 'template')}` : 'Delete'}</Button></>}>
          <ul className="max-h-48 divide-y overflow-y-auto rounded-lg border">
            {confirm.map((t) => (
              <li key={t.id} className="flex items-center gap-2.5 px-3 py-2 text-sm">
                <FileText className="size-4 flex-none text-muted-foreground" aria-hidden="true" />
                <span className="truncate font-medium">{t.templatename}</span>
                <span className="ml-auto flex-none tabular-nums text-muted-foreground">{money(calcTotals(t.rows, t.taxRate).totalAmount)}</span>
              </li>
            ))}
          </ul>
        </Modal>
      )}
      <ToastBridge message={toast} />
    </div>
  );
}
