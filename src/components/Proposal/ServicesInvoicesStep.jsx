import { CircleAlert, FileText, List, Plus, Receipt, X } from 'lucide-react';
import LineItemsAndSummary from '../LineItemsAndSummary';
import MultiSelect from '../MultiSelect';
import TextEditor from '../TextEditor';
import { Avatar, RadioDot, cx, initials } from '../ui';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Button } from '../ui/button';
import { SimpleTooltip } from '../ui/tooltip';
import { useData } from '../../context/DataContext';
import { TEAM_MEMBERS } from '../../data/sampleData';
import { contactShortcuts } from '../../data/shortcodes';
import { calcTotals, money, newRow } from '../../data/invoiceTemplates';
import { INVOICE_DESCRIPTION_LIMIT, ISSUE_OPTIONS, TIME_OPTIONS, emptyInvoice } from '../../data/proposalTemplates';
import { templateOptionsFrom } from '../../data/statusOptions';

const TEAM_OPTIONS = TEAM_MEMBERS.map((m) => ({ ...m, value: m.label }));
const teamOption = (o) => (
  <span className="flex flex-1 items-center gap-2.5"><Avatar text={initials(o.label)} size="sm" /><span className="font-medium">{o.label}</span></span>
);

function OptionCard({ value, current, onPick, icon, title, description }) {
  const on = current === value;
  return (
    <label className={cx('relative flex flex-1 cursor-pointer gap-3 rounded-lg border p-4 transition-[border-color,background-color,box-shadow] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring/50',
      on ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20' : 'bg-card hover:border-line-strong hover:bg-accent/40')}>
      <input type="radio" name="services-option" checked={on} onChange={() => onPick(value)} className="sr-only" aria-label={title} />
      <span className={cx('inline-flex size-9 flex-none items-center justify-center rounded-lg border [&_svg]:size-4', on ? 'border-primary/30 bg-card text-primary' : 'bg-subtle text-muted-foreground')} aria-hidden="true">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{title}</span>
        <span className="mt-1 block text-sm text-muted-foreground">{description}</span>
      </span>
      <span className="mt-0.5"><RadioDot on={on} /></span>
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
    <section aria-label={`Invoice ${index + 1}`} className={cx('overflow-hidden rounded-xl border bg-card shadow-card', Object.keys(errors).length && 'border-danger-200 ring-1 ring-danger-200')}>
      <header className="flex items-center gap-3 border-b bg-subtle px-5 py-3">
        <span className="inline-flex size-7 items-center justify-center rounded-md border bg-card text-muted-foreground" aria-hidden="true"><Receipt className="size-3.5" /></span>
        <h4 className="flex-1 text-sm font-semibold">Invoice #{index + 1}</h4>
        {Object.keys(errors).length > 0 && <span className="inline-flex items-center gap-1 text-xs font-medium text-danger-700"><CircleAlert className="size-3.5" aria-hidden="true" />Needs attention</span>}
        <span className="text-sm font-semibold tabular-nums">{money(totalAmount)}</span>
        {canRemove && (
          <SimpleTooltip label="Remove invoice">
            <Button type="button" variant="ghost" size="icon-sm" onClick={onRemove} aria-label={`Remove invoice ${index + 1}`} className="-mr-1.5 text-muted-foreground hover:bg-danger-50 hover:text-danger-700"><X /></Button>
          </SimpleTooltip>
        )}
      </header>
      <div className="flex flex-col gap-5 p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="field-label">
            <span>Invoice Template <span className="text-danger-700">*</span></span>
            <select className={cx('input', errors.invoiceTemplate && 'border-danger-700')} value={invoice.invoiceTemplate ?? ''} onChange={(e) => pickTemplate(e.target.value)}>
              <option value="">Select invoice template</option>
              {templateOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
            <span className="text-xs font-normal text-muted-foreground">Choosing a template fills in its line items, tax and note.</span>
            {errors.invoiceTemplate && <span className="text-xs font-normal text-danger-700">{errors.invoiceTemplate}</span>}
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
                {errors.specificDate && <span className="text-xs font-normal text-danger-700">{errors.specificDate}</span>}
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
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{invoice.description.length}/{INVOICE_DESCRIPTION_LIMIT}</span>
          </span>
          {errors.description && <span className="text-xs font-normal text-danger-700">{errors.description}</span>}
        </label>

        <div>
          <h5 className="text-sm font-medium">Line items</h5>
          <p className="mb-3 text-xs text-muted-foreground">Client-facing itemized list of products and services</p>
          <LineItemsAndSummary hideHeading allowDiscount label={`Invoice ${index + 1} line items`} rows={invoice.rows} onChange={(rows) => set({ rows })}
            taxRate={invoice.taxRate} onTaxRateChange={(v) => set({ taxRate: v })} error={errors.rows} />
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-medium">Note for client</span>
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
        <h2 className="text-xl font-semibold tracking-tight">Services &amp; Invoices</h2>
        <p className="mt-1 text-sm text-muted-foreground">Specify the services your firm will provide and how the client is billed.</p>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">How do you want to bill? <span className="text-danger-700">*</span></legend>
        <div className="flex flex-col gap-3 md:flex-row">
          <OptionCard value="invoice" current={s.option} onPick={(v) => setServices({ option: v })} icon={<FileText />}
            title="Bill using invoices" description="Create one or more invoices that are issued when the proposal is signed (or on a date)." />
          <OptionCard value="services" current={s.option} onPick={(v) => setServices({ option: v })} icon={<List />}
            title="Itemized services" description="List services and prices in the proposal without creating invoices." />
        </div>
        {stepErrors.option && <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-danger-700"><CircleAlert className="size-3.5" aria-hidden="true" />{stepErrors.option}</p>}
      </fieldset>

      {s.option === 'invoice' && (
        <div className="flex flex-col gap-4">
          {(stepErrors.invoices || invoiceErrorCount > 0) && (
            <Alert variant="destructive">
              <CircleAlert aria-hidden="true" />
              <AlertTitle>{stepErrors.invoices || `${invoiceErrorCount} invoice${invoiceErrorCount > 1 ? 's need' : ' needs'} attention.`}</AlertTitle>
            </Alert>
          )}
          {s.invoices.length === 0 && (
            <Alert variant="warning" role="status">
              <Receipt aria-hidden="true" />
              <AlertTitle>No invoices added</AlertTitle>
              <AlertDescription>Add at least one invoice to continue.</AlertDescription>
            </Alert>
          )}
          {s.invoices.map((inv, i) => (
            <InvoiceCard key={inv.id} invoice={inv} index={i} canRemove={s.invoices.length > 1} errors={stepErrors[`invoice_${i}`]}
              templateOptions={templateOptions} invoiceTemplates={invoiceTemplates}
              onChange={(next) => setInvoice(i, next)} onRemove={() => setServices({ invoices: s.invoices.filter((_, j) => j !== i) })} />
          ))}
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" onClick={() => setServices({ invoices: [...s.invoices, emptyInvoice()] })}><Plus />Add invoice</Button>
            <span className="text-xs text-muted-foreground">{s.invoices.length} invoice{s.invoices.length === 1 ? '' : 's'} added</span>
          </div>
        </div>
      )}

      {s.option === 'services' && (
        <section aria-label="Itemized services" className="rounded-xl border bg-card p-5 shadow-card">
          <h3 className="section-title">Itemized services</h3>
          <p className="mb-3 text-xs text-muted-foreground">Client-facing itemized list of products and services</p>
          <LineItemsAndSummary hideHeading allowDiscount label="Itemized services" rows={s.itemizedData.rows}
            onChange={(rows) => setServices({ itemizedData: { ...s.itemizedData, rows } })}
            taxRate={s.itemizedData.taxRate} onTaxRateChange={(v) => setServices({ itemizedData: { ...s.itemizedData, taxRate: v } })} error={stepErrors.itemizedRows} />
        </section>
      )}
    </div>
  );
}