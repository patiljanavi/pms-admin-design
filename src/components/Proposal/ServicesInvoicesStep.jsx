import { FiFileText, FiList, FiPlus, FiX } from 'react-icons/fi';
import LineItemsAndSummary from '../LineItemsAndSummary';
import MultiSelect from '../MultiSelect';
import TextEditor from '../TextEditor';
import { Avatar, cx, initials } from '../ui';
import { useData } from '../../context/DataContext';
import { TEAM_MEMBERS } from '../../data/sampleData';
import { contactShortcuts } from '../../data/shortcodes';
import { calcTotals, money, newRow } from '../../data/invoiceTemplates';
import { INVOICE_DESCRIPTION_LIMIT, ISSUE_OPTIONS, TIME_OPTIONS, emptyInvoice } from '../../data/proposalTemplates';
import { templateOptionsFrom } from '../../data/statusOptions';

const TEAM_OPTIONS = TEAM_MEMBERS.map((m) => ({ ...m, value: m.label }));
const teamOption = (o) => (
  <span className="flex flex-1 items-center gap-2.5"><Avatar text={initials(o.label)} size="sm" /><span className="font-semibold">{o.label}</span></span>
);

function OptionCard({ value, current, onPick, icon, title, description }) {
  const on = current === value;
  return (
    <label className={cx('flex flex-1 cursor-pointer gap-3 rounded-lg border-2 p-4 transition-colors', on ? 'border-brand-600 bg-brand-50/60' : 'border-line hover:border-line-strong')}>
      <input type="radio" name="services-option" checked={on} onChange={() => onPick(value)} className="mt-1 h-[18px] w-[18px] flex-none accent-brand-600" aria-label={title} />
      <span className="min-w-0">
        <span className="flex items-center gap-2 font-semibold">{icon}{title}</span>
        <span className="mt-1 block text-sm text-muted">{description}</span>
      </span>
    </label>
  );
}

/** One invoice inside the proposal. */
function InvoiceCard({ invoice, index, canRemove, onChange, onRemove, errors = {}, templateOptions, invoiceTemplates }) {
  const set = (changes) => onChange({ ...invoice, ...changes });
  const pickTemplate = (id) => {
    const tpl = invoiceTemplates.find((t) => String(t.id) === id);
    if (!tpl) { set({ invoiceTemplate: null }); return; }
    // Fill the invoice from the chosen invoice template
    set({
      invoiceTemplate: tpl.id,
      description: (tpl.description || invoice.description || '').slice(0, INVOICE_DESCRIPTION_LIMIT),
      rows: (tpl.rows?.length ? tpl.rows : [newRow()]).map(({ id, ...rest }) => newRow(rest)),   // copies with new ids
      taxRate: tpl.taxRate ?? 0,
      clientNote: tpl.clientNote || invoice.clientNote,
    });
  };
  const { totalAmount } = calcTotals(invoice.rows, invoice.taxRate);

  return (
    <section aria-label={`Invoice ${index + 1}`} className={cx('rounded-lg border bg-surface shadow-card', Object.keys(errors).length ? 'border-danger-700' : 'border-line')}>
      <header className="flex items-center gap-3 border-b border-line bg-subtle/60 px-5 py-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white" aria-hidden="true">{index + 1}</span>
        <h4 className="flex-1 font-semibold">Invoice #{index + 1}</h4>
        <span className="text-sm font-semibold">{money(totalAmount)}</span>
        {canRemove && <button type="button" onClick={onRemove} aria-label={`Remove invoice ${index + 1}`} className="flex h-8 w-8 items-center justify-center rounded text-muted hover:bg-danger-50 hover:text-danger-700"><FiX aria-hidden="true" /></button>}
      </header>
      <div className="flex flex-col gap-5 p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="field-label">
            <span>Invoice Template <span className="text-danger-700">*</span></span>
            <select className={cx('input', errors.invoiceTemplate && 'border-danger-700')} value={invoice.invoiceTemplate ?? ''} onChange={(e) => pickTemplate(e.target.value)}>
              <option value="">Select invoice template</option>
              {templateOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
            <span className="text-xs font-normal text-muted">Choosing a template fills in its line items, tax and note.</span>
            {errors.invoiceTemplate && <span className="text-sm font-normal text-danger-700">{errors.invoiceTemplate}</span>}
          </label>
          <MultiSelect label="Team Members *" placeholder="Select team members" options={TEAM_OPTIONS} value={invoice.teamMembers} onChange={(v) => set({ teamMembers: v })}
            error={errors.teamMembers} renderOption={teamOption} />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <label className="field-label">Issue invoice
            <select className="input" value={invoice.issueInvoice} onChange={(e) => set({ issueInvoice: e.target.value })}>
              {ISSUE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          {invoice.issueInvoice === 'specific date' && (
            <>
              <label className="field-label">Date
                <input type="date" className={cx('input', errors.specificDate && 'border-danger-700')} value={invoice.specificDate || ''} onChange={(e) => set({ specificDate: e.target.value })} />
                {errors.specificDate && <span className="text-sm font-normal text-danger-700">{errors.specificDate}</span>}
              </label>
              <label className="field-label">Time
                <select className="input" value={invoice.selectedTime || ''} onChange={(e) => set({ selectedTime: e.target.value })}>
                  <option value="">Select time</option>
                  {TIME_OPTIONS.map((t) => <option key={t}>{t}</option>)}
                </select>
              </label>
            </>
          )}
        </div>

        <label className="field-label">
          <span>Description <span className="text-danger-700">*</span></span>
          <span className="relative">
            <input className={cx('input pr-24', errors.description && 'border-danger-700')} value={invoice.description} maxLength={INVOICE_DESCRIPTION_LIMIT}
              onChange={(e) => set({ description: e.target.value })} placeholder="Description" />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">{invoice.description.length}/{INVOICE_DESCRIPTION_LIMIT}</span>
          </span>
          {errors.description && <span className="text-sm font-normal text-danger-700">{errors.description}</span>}
        </label>

        <div>
          <h5 className="text-sm font-semibold">Line items</h5>
          <p className="mb-3 text-xs text-muted">Client-facing itemized list of products and services</p>
          <LineItemsAndSummary hideHeading allowDiscount label={`Invoice ${index + 1} line items`} rows={invoice.rows} onChange={(rows) => set({ rows })}
            taxRate={invoice.taxRate} onTaxRateChange={(v) => set({ taxRate: v })} error={errors.rows} />
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-semibold">Note for client</span>
          <TextEditor ariaLabel={`Invoice ${index + 1} note for client`} value={invoice.clientNote} onChange={(html) => set({ clientNote: html })} shortcuts={contactShortcuts} minHeight={110} placeholder="Shown at the bottom of this invoice" />
        </div>
      </div>
    </section>
  );
}

/** Step — Services & Invoices: bill with invoices, or list itemized services. */
export default function ServicesInvoicesStep({ formData, updateFormData, stepErrors = {} }) {
  const { invoiceTemplates = [] } = useData();
  const templateOptions = templateOptionsFrom(invoiceTemplates);
  const s = formData.services;
  const setServices = (changes) => updateFormData('services', changes);
  const setInvoice = (i, inv) => setServices({ invoices: s.invoices.map((x, j) => (j === i ? inv : x)) });
  const invoiceErrorCount = Object.keys(stepErrors).filter((k) => k.startsWith('invoice_')).length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold">Services &amp; Invoices</h2>
        <p className="text-muted">Specify the services your firm will provide and how the client is billed.</p>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold">How do you want to bill? <span className="text-danger-700">*</span></legend>
        <div className="flex flex-col gap-3 md:flex-row">
          <OptionCard value="invoice" current={s.option} onPick={(v) => setServices({ option: v })} icon={<FiFileText aria-hidden="true" />}
            title="Bill using invoices" description="Create one or more invoices that are issued when the proposal is signed (or on a date)." />
          <OptionCard value="services" current={s.option} onPick={(v) => setServices({ option: v })} icon={<FiList aria-hidden="true" />}
            title="Itemized services" description="List services and prices in the proposal without creating invoices." />
        </div>
        {stepErrors.option && <p className="mt-2 text-sm font-semibold text-danger-700">{stepErrors.option}</p>}
      </fieldset>

      {s.option === 'invoice' && (
        <div className="flex flex-col gap-4">
          {(stepErrors.invoices || invoiceErrorCount > 0) && (
            <div role="alert" className="rounded-md border border-danger-200 bg-danger-50 px-4 py-3 text-sm font-semibold text-danger-700">
              {stepErrors.invoices || `${invoiceErrorCount} invoice${invoiceErrorCount > 1 ? 's need' : ' needs'} attention.`}
            </div>
          )}
          {s.invoices.length === 0 && (
            <div className="rounded-md border border-warning-300 bg-warning-50 px-4 py-3">
              <p className="text-sm font-semibold text-warning-700">No invoices added</p>
              <p className="text-xs text-warning-700">Add at least one invoice to continue.</p>
            </div>
          )}
          {s.invoices.map((inv, i) => (
            <InvoiceCard key={inv.id} invoice={inv} index={i} canRemove={s.invoices.length > 1} errors={stepErrors[`invoice_${i}`]}
              templateOptions={templateOptions} invoiceTemplates={invoiceTemplates}
              onChange={(next) => setInvoice(i, next)} onRemove={() => setServices({ invoices: s.invoices.filter((_, j) => j !== i) })} />
          ))}
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className="btn-secondary" onClick={() => setServices({ invoices: [...s.invoices, emptyInvoice()] })}><FiPlus aria-hidden="true" /> Add invoice</button>
            <span className="text-xs text-muted">{s.invoices.length} invoice(s) added</span>
          </div>
        </div>
      )}

      {s.option === 'services' && (
        <section aria-label="Itemized services" className="rounded-lg border border-line p-5">
          <h3 className="font-semibold">Itemized services</h3>
          <p className="mb-3 text-xs text-muted">Client-facing itemized list of products and services</p>
          <LineItemsAndSummary hideHeading allowDiscount label="Itemized services" rows={s.itemizedData.rows}
            onChange={(rows) => setServices({ itemizedData: { ...s.itemizedData, rows } })}
            taxRate={s.itemizedData.taxRate} onTaxRateChange={(v) => setServices({ itemizedData: { ...s.itemizedData, taxRate: v } })} error={stepErrors.itemizedRows} />
        </section>
      )}
    </div>
  );
}