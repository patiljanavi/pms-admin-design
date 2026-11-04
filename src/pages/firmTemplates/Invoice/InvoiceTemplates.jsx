import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiBell, FiDownload, FiMail, FiSearch, FiTrash2, FiCopy, FiCreditCard } from 'react-icons/fi';
import RowActionsMenu from '../../../components/RowActionsMenu';
import InvoicePreview from '../../../components/InvoicePreview';
import Pagination, { usePagination } from '../../../components/Pagination';
import {
  BulkBar, HeaderCheckbox, SelectCheckbox, SelectedOnlyFilter, barButton, barDanger, downloadCsv, useSelection,
} from '../../../components/TableSelection';
import { Modal, cx } from '../../../components/ui';
import { useData } from '../../../context/DataContext';
import { PAYMENT_OPTIONS, calcTotals, money, paymentLabel } from '../../../data/invoiceTemplates';

const LIST_PATH = '/firmtemp/templates/invoices';
const fmtDate = (d) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—');

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

  if (!duplicateInvoiceTemplates) return <div role="alert" className="card bg-danger-50 p-6 font-semibold text-danger-700">Invoice templates are not set up in DataContext.js</div>;

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

  const stats = [
    ['Total templates', invoiceTemplates.length],
    ['With reminders', invoiceTemplates.filter((t) => t.invoiceReminders).length],
    ['Email on create', invoiceTemplates.filter((t) => t.emailToClient).length],
    ['Average total', money(invoiceTemplates.length ? invoiceTemplates.reduce((s, t) => s + calcTotals(t.rows, t.taxRate).totalAmount, 0) / invoiceTemplates.length : 0)],
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Invoice templates</h2>
          <p className="text-muted">Invoices with preset line items, payment method, emails and reminders.</p>
        </div>
        <button className="btn-primary" onClick={openNew}>+ New invoice template</button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(([label, n]) => (
          <div key={label} className="card p-4 sm:p-5"><div className="text-sm text-muted">{label}</div><div className="mt-1.5 text-2xl font-bold">{n}</div></div>
        ))}
      </div>

      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-4 sm:px-5">
          <label className="flex min-h-[44px] flex-[1_1_240px] items-center gap-2 rounded border border-line-strong px-3 focus-within:border-brand-600">
            <FiSearch size={18} className="text-muted" aria-hidden="true" /><span className="sr-only">Search invoice templates</span>
            <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search name, description, line item" className="min-w-0 flex-1 bg-transparent outline-none" />
          </label>
          <label className="flex items-center gap-2 text-muted">Payment method
            <select value={payment} onChange={(e) => { setPayment(e.target.value); setPage(1); }} className="input min-h-[44px] w-auto">
              <option value="All">All</option>
              {PAYMENT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          {filtersOn ? <button onClick={reset} className="btn-link px-2">Clear filters</button> : null}
        </div>

        <BulkBar count={selection.count} total={filtered.length}
          onSelectAll={() => selection.setMany(filtered.map((t) => t.id), true)} onClear={selection.clear}
          filters={<SelectedOnlyFilter checked={selectedOnly} onChange={(v) => { setSelectedOnly(v); setPage(1); }} />}
          actions={<>
            <button className={barButton} onClick={() => { duplicateInvoiceTemplates([...selection.ids]); notify(`Duplicated ${selection.count} template${selection.count > 1 ? 's' : ''}`); selection.clear(); }}><FiCopy aria-hidden="true" /> Duplicate</button>
            <button className={barButton} onClick={() => exportCsv(selected)}><FiDownload aria-hidden="true" /> Export</button>
            <button className={barDanger} onClick={() => setConfirm(selected)}><FiTrash2 aria-hidden="true" /> Delete</button>
          </>}
        />

        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] border-collapse">
            <thead>
              <tr className="bg-subtle text-left text-xs uppercase tracking-wide text-muted">
                <th className="w-12 py-3 pl-5 pr-1"><HeaderCheckbox selection={selection} pageIds={rows.map((t) => t.id)} /></th>
                <th className="px-3 py-3 font-semibold">Template name</th>
                <th className="px-3 py-3 font-semibold">Payment method</th>
                {/* <th className="px-3 py-3 font-semibold">Line items</th> */}
                <th className="px-3 py-3 text-right font-semibold">Total</th>
                <th className="px-3 py-3 font-semibold">Options</th>
                <th className="px-3 py-3 font-semibold">Updated</th>
                <th className="px-5 py-3 text-right font-semibold"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => {
                const checked = selection.has(t.id);
                const { totalAmount } = calcTotals(t.rows, t.taxRate);
                return (
                  <tr key={t.id} aria-selected={checked} className={cx('border-t border-line-soft', checked ? 'bg-brand-50' : 'hover:bg-subtle/60')}>
                    <td className="py-3 pl-5 pr-1"><SelectCheckbox label={`Select ${t.templatename}`} checked={checked} onChange={() => selection.toggle(t.id)} /></td>
                    <td className="max-w-[280px] px-3 py-3">
                      <button onClick={() => openEdit(t)} className="text-left font-semibold hover:text-brand-600 hover:underline">{t.templatename}</button>
                      {t.description && <div className="truncate text-sm text-muted">{t.description}</div>}
                    </td>
                    <td className="px-3 py-3 text-sm">{paymentLabel(t.paymentMode)}</td>
                    {/* <td className="max-w-[220px] px-3 py-3 text-sm"><span className="font-semibold">{(t.rows || []).length}</span><span className="ml-1.5 truncate text-muted">{(t.rows || []).map((r) => r.productName).slice(0, 2).join(', ')}{(t.rows || []).length > 2 ? '…' : ''}</span></td> */}
                    <td className="px-3 py-3 text-right font-semibold">{money(totalAmount)}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2 text-muted">
                        {t.emailToClient && <span title="Emails the client when created"><FiMail aria-label="Emails the client when created" /></span>}
                        {t.invoiceReminders && <span title={`Reminds every ${t.daysNextReminder} days, ${t.numOfReminder} times`}><FiBell aria-label="Sends reminders" className="text-warning-700" /></span>}
                        {t.payUsingCredits && <span title="Pays with credits if available"><FiCreditCard aria-label="Pays with credits" /></span>}
                        {!t.emailToClient && !t.invoiceReminders && !t.payUsingCredits && <span>—</span>}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-muted">{fmtDate(t.updatedAt)}</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end">
                        <RowActionsMenu label={t.templatename} onEdit={() => openEdit(t)}
                          onDuplicate={() => { duplicateInvoiceTemplates([t.id]); notify(`Duplicated “${t.templatename}”`); }}
                          extra={[{ label: 'Preview', icon: FiSearch, onClick: () => setPreview(t) }]}
                          onDelete={() => setConfirm([t])} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center gap-3 p-12 text-center text-muted">
              {invoiceTemplates.length ? 'No invoice templates match these filters.' : 'No invoice templates yet.'}
              {invoiceTemplates.length ? <button onClick={reset} className="btn-secondary">Clear filters</button> : <button onClick={openNew} className="btn-primary">+ New invoice template</button>}
            </div>
          )}
        </div>
        <Pagination {...paging} label="templates" />
      </section>

      {preview && <InvoicePreview form={preview} onClose={() => setPreview(null)} />}
      {confirm && (
        <Modal title={confirm.length === 1 ? `Delete “${confirm[0].templatename}”?` : `Delete ${confirm.length} templates?`} onClose={() => setConfirm(null)}
          footer={<><button className="btn-secondary" onClick={() => setConfirm(null)}>Cancel</button><button className="btn bg-danger-700 text-white hover:bg-[#831E15]" onClick={remove}>Delete</button></>}>
          <p className="text-muted">Invoices already created from {confirm.length === 1 ? 'this template' : 'these templates'} are not affected.</p>
        </Modal>
      )}
      {toast && <div role="status" className="fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-md bg-ink px-5 py-3 font-semibold text-white">{toast}</div>}
    </div>
  );
}