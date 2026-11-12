import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Bell, CircleAlert, Eye, FileText, Receipt, SearchX, Trash2 } from 'lucide-react';
import ShortcodeTextField from '../../../components/ShortcodeTextField';
import TextEditor from '../../../components/TextEditor';
import InvoicePreview from '../../../components/InvoicePreview';
import LineItemsAndSummary from '../../../components/LineItemsAndSummary';
import { Modal, Toggle } from '../../../components/ui';
import { Alert, AlertTitle } from '../../../components/ui/alert';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { ToastBridge } from '../../../components/ui/sonner';
import { EmptyState, SectionHeading } from '../../../components/page';
import { useData } from '../../../context/DataContext';
import { accountShortcuts, contactShortcuts } from '../../../data/shortcodes';
import { PAYMENT_OPTIONS, calcTotals, emptyInvoiceTemplate, money, newRow, paymentLabel } from '../../../data/invoiceTemplates';
import { cn } from 'lib/utils';

const LIST_PATH = '/firmtemp/templates/invoices';
const CLEAR = '__clear__';
const clone = (o) => JSON.parse(JSON.stringify(o));
const textOf = (v) => (v && typeof v === 'object' && v.target ? v.target.value : v ?? '');

/* ---------- building blocks ---------- */
function EditorHeader({ backLabel, backAria, onBack, icon: Icon, title, status, description, actions }) {
  return (
    <header className="flex flex-col gap-4">
      <button type="button" onClick={onBack} aria-label={backAria}
        className="group inline-flex w-fit items-center gap-1.5 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />{backLabel}
      </button>
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="flex min-w-0 items-start gap-3.5">
          {Icon && (
            <span className="mt-0.5 inline-flex size-10 flex-none items-center justify-center rounded-xl border border-brand-100 bg-brand-50 text-brand-700 [&_svg]:size-5" aria-hidden="true">
              <Icon />
            </span>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h1 className="page-title truncate">{title}</h1>
              {status}
            </div>
            {description && <p className="page-description">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}

function ActionBar({ dirty, isNew, children }) {
  return (
    <div className="sticky bottom-0 z-20 -mx-4 -mb-6 mt-6 border-t bg-card/85 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:-mb-8 lg:px-8">
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-2">
        <span className={cn('mr-auto inline-flex items-center gap-2 text-sm', dirty ? 'font-medium text-warning-700' : 'text-muted-foreground')} aria-live="polite">
          <span className={cn('size-1.5 rounded-full', dirty ? 'bg-warning-500' : isNew ? 'bg-muted-foreground/50' : 'bg-success-500')} aria-hidden="true" />
          {dirty ? 'Unsaved changes' : isNew ? 'Not saved yet' : 'All changes saved'}
        </span>
        {children}
      </div>
    </div>
  );
}

/** Card with a header (optional step number / icon, title, description) and a body. */
function Section({ step, icon: Icon, title, description, action, children, bodyClass = 'p-5' }) {
  return (
    <Card className="overflow-hidden">
      {title && (
        <div className="flex items-start gap-3 border-b px-5 py-4">
          {step ? (
            <span className="inline-flex size-7 flex-none items-center justify-center rounded-full border border-brand-100 bg-brand-50 text-xs font-semibold tabular-nums text-brand-700" aria-hidden="true">{step}</span>
          ) : Icon ? (
            <span className="inline-flex size-7 flex-none items-center justify-center rounded-lg border bg-subtle text-muted-foreground" aria-hidden="true"><Icon className="size-3.5" /></span>
          ) : null}
          <SectionHeading title={title} description={description} action={action} className="min-w-0 flex-1" />
        </div>
      )}
      <div className={bodyClass}>{children}</div>
    </Card>
  );
}

function FieldError({ id, children }) {
  return <p id={id} className="flex items-center gap-1 text-xs font-medium text-danger-700"><CircleAlert className="size-3.5 flex-none" aria-hidden="true" />{children}</p>;
}

/** A setting with a switch; its extra fields (children) are indented under it when it's on. */
function ToggleSetting({ label, description, checked, onChange, children }) {
  return (
    <div className="py-4 first:pt-0 last:pb-0">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm font-medium text-foreground">{label}</div>
          {description && <div className="mt-0.5 text-xs text-muted-foreground">{description}</div>}
        </div>
        <Toggle label={label} checked={checked} onChange={onChange} />
      </div>
      {checked && children && <div className="mt-3 border-l-2 border-primary/20 pl-4">{children}</div>}
    </div>
  );
}

/** Small label / value row for the "At a glance" card. */
const Glance = ({ label, children }) => (
  <div className="flex items-center justify-between gap-3 py-2 text-sm"><dt className="text-muted-foreground">{label}</dt><dd className="text-right font-medium tabular-nums">{children}</dd></div>
);

/**
 * Create / edit an invoice template (same pattern as the task, email, job and chat forms).
 *   /firmtemp/templates/invoices/new          → create
 *   /firmtemp/templates/invoices/:templateId  → edit
 */
export default function InvoiceTemplateForm() {
  const { templateId } = useParams();
  return <FormPage key={templateId || 'new'} editingId={templateId} />;
}

function FormPage({ editingId }) {
  const navigate = useNavigate();
  const { invoiceTemplates = [], saveInvoiceTemplate, deleteInvoiceTemplates, invoiceTemplateNameTaken } = useData();
  const existing = editingId ? invoiceTemplates.find((t) => String(t.id) === String(editingId)) : null;
  const isEditMode = !!editingId;

  const initial = useMemo(() => ({ ...clone(emptyInvoiceTemplate), rows: [newRow()], ...clone(existing || {}) }), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [formData, setFormData] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [errors, setErrors] = useState({});
  const [modal, setModal] = useState(null);   // 'discard' | 'delete' | 'preview'
  const [toast, setToast] = useState('');
  const dirty = JSON.stringify(formData) !== JSON.stringify(saved);
  const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 2600); };
  const set = (k, v) => { const value = textOf(v); setFormData((f) => ({ ...f, [k]: value })); setErrors((e) => ({ ...e, [k]: undefined })); };

  useEffect(() => {
    if (!dirty) return undefined;
    const h = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  if (!saveInvoiceTemplate) {
    return <Alert variant="destructive"><AlertTriangle aria-hidden="true" /><AlertTitle>Invoice templates are not set up in DataContext.js</AlertTitle></Alert>;
  }
  if (editingId && !existing) {
    return (
      <div className="page max-w-[1280px]">
        <Card>
          <EmptyState icon={SearchX} title="Invoice template not found" description="It may have been deleted, or the link is out of date."
            action={<Button asChild><Link to={LIST_PATH}><ArrowLeft />Back to invoice templates</Link></Button>} />
        </Card>
      </div>
    );
  }

  const validate = () => {
    const e = {};
    const name = formData.templatename.trim();
    if (!name) e.templatename = 'Template name is required.';
    else if (invoiceTemplateNameTaken?.(name, editingId)) e.templatename = 'Another invoice template already has this name.';
    if (!formData.rows.length) e.rows = 'Add at least one line item.';
    else if (formData.rows.some((r) => !r.productName.trim())) e.rows = 'Every line item needs a name.';
    else if (formData.rows.some((r) => !(Number(r.qty) > 0) || !(Number(r.rate) >= 0) || r.rate === '')) e.rows = 'Check the rate and quantity of every line item.';
    if (formData.emailToClient && !formData.clientmsg.trim()) e.clientmsg = 'Write the email message, or turn off the email.';
    if (formData.invoiceReminders) {
      if (!(Number(formData.daysNextReminder) >= 1)) e.daysNextReminder = 'Enter at least 1 day.';
      if (!(Number(formData.numOfReminder) >= 1)) e.numOfReminder = 'Enter at least 1 reminder.';
    }
    if (!(Number(formData.taxRate) >= 0 && Number(formData.taxRate) <= 100)) e.rows = 'Tax rate must be between 0 and 100.';
    setErrors(e);
    if (Object.keys(e).length) window.scrollTo?.({ top: 0, behavior: 'smooth' });
    return Object.keys(e).length === 0;
  };
  const persist = () => {
    const data = {
      ...formData, id: editingId || undefined, templatename: formData.templatename.trim(),
      taxRate: Number(formData.taxRate) || 0, daysNextReminder: Number(formData.daysNextReminder) || 0, numOfReminder: Number(formData.numOfReminder) || 0,
      rows: formData.rows.map((r) => ({ ...r, productName: r.productName.trim(), rate: Number(r.rate) || 0, qty: Number(r.qty) || 0 })),
    };
    const id = saveInvoiceTemplate(data);
    return { ...data, id };
  };
  const onSave = () => {
    if (!validate()) return;
    const data = persist();
    setFormData(data); setSaved(data);
    notify(isEditMode ? `Updated “${data.templatename}”` : `Saved “${data.templatename}”`);
    if (!editingId) navigate(`${LIST_PATH}/${data.id}`, { replace: true });
  };
  const onSaveAndExit = () => {
    if (!validate()) return;
    const data = persist();
    navigate(LIST_PATH, { state: { toast: isEditMode ? `Updated “${data.templatename}”` : `Created “${data.templatename}”` } });
  };
  const onCancel = () => (dirty ? setModal('discard') : navigate(LIST_PATH));

  const { totalAmount } = calcTotals(formData.rows, formData.taxRate);
  const errorCount = Object.values(errors).filter(Boolean).length;
  const onOff = (on) => (on ? <Badge variant="success" dot>On</Badge> : <Badge variant="neutral">Off</Badge>);

  return (
    <>
      <div className="page max-w-[1280px]">
        <EditorHeader backLabel="Invoice templates" backAria="Back to invoice templates" onBack={onCancel} icon={Receipt}
          title={isEditMode ? 'Edit Invoice Template' : 'Create Invoice Template'}
          status={!isEditMode ? <Badge variant="info" dot>New</Badge> : dirty ? <Badge variant="warning" dot>Edited</Badge> : <Badge variant="success" dot>Saved</Badge>}
          description="Configure your invoice template settings"
          actions={<>
            <Button variant="outline" onClick={() => setModal('preview')}><Eye />Preview</Button>
            {isEditMode && <Button variant="destructive-outline" onClick={() => setModal('delete')}><Trash2 />Delete</Button>}
          </>} />

        {errorCount > 0 && (
          <Alert variant="destructive">
            <CircleAlert aria-hidden="true" />
            <AlertTitle className="flex items-center gap-2">
              Please fix the highlighted fields.
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-danger-700 px-1.5 text-[11px] font-semibold tabular-nums text-danger-50">{errorCount}</span>
            </AlertTitle>
          </Alert>
        )}

        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          {/* ===== MAIN: the invoice itself ===== */}
          <div className="flex min-w-0 flex-col gap-6">
            <Section step={1} title="Template details" description="How this template is named and paid">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="inv-templatename">Template Name<span className="ml-0.5 text-danger-700" aria-hidden="true">*</span></Label>
                  <Input id="inv-templatename" name="TemplateName" value={formData.templatename} onChange={(e) => set('templatename', e.target.value)} placeholder="Template Name"
                    aria-invalid={!!errors.templatename} aria-describedby={errors.templatename ? 'inv-templatename-error' : undefined} />
                  {errors.templatename && <FieldError id="inv-templatename-error">{errors.templatename}</FieldError>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="inv-payment">Choose payment method</Label>
                  <Select value={formData.paymentMode?.value || ''}
                    onValueChange={(v) => set('paymentMode', v === CLEAR ? null : PAYMENT_OPTIONS.find((o) => o.value === v) || null)}>
                    <SelectTrigger id="inv-payment"><SelectValue placeholder="Select Payment Mode" /></SelectTrigger>
                    <SelectContent>
                      {PAYMENT_OPTIONS.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                      {formData.paymentMode?.value && (
                        <>
                          <SelectSeparator />
                          <SelectItem value={CLEAR} className="text-muted-foreground">Clear selection</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <ShortcodeTextField label="Description" value={formData.description} onChange={(v) => set('description', v)} placeholder="Description shown on the invoice, e.g. [LAST_MONTH_NAME] bookkeeping for [ACCOUNT_NAME]"
                    multiline rows={3} maxLength={50000} shortcuts={accountShortcuts} />
                </div>
              </div>
            </Section>

            <Section step={2} title="Line items" description="Client-facing itemized list of products and services">
              <LineItemsAndSummary rows={formData.rows} onChange={(rows) => { setFormData((f) => ({ ...f, rows })); setErrors((e) => ({ ...e, rows: undefined })); }}
                taxRate={formData.taxRate} onTaxRateChange={(v) => set('taxRate', v)} error={errors.rows} hideHeading />
            </Section>

            <Section step={3} title="Note to client" description="Shown at the bottom of the invoice">
              <TextEditor ariaLabel="Note to client" value={formData.clientNote} onChange={(html) => set('clientNote', html)} shortcuts={contactShortcuts} placeholder="e.g. Thank you for your business! Payment is due within 15 days." minHeight={140} />
            </Section>
          </div>

          {/* ===== SIDEBAR: summary + settings ===== */}
          <aside className="flex min-w-0 flex-col gap-6 xl:sticky xl:top-20">
            <Section icon={FileText} title="At a glance" bodyClass="px-5 pb-4 pt-4">
              <div className="rounded-lg border bg-subtle/50 px-4 py-3">
                <div className="text-xs font-medium text-muted-foreground">Total</div>
                <div className="mt-0.5 text-2xl font-bold tracking-tight tabular-nums text-foreground" data-testid="glance-total">{money(totalAmount)}</div>
              </div>
              <dl className="mt-2 divide-y">
                <Glance label="Line items">{formData.rows.length}</Glance>
                <Glance label="Payment">{paymentLabel(formData.paymentMode)}</Glance>
                <Glance label="Email on create">{onOff(formData.emailToClient)}</Glance>
                <Glance label="Reminders">{formData.invoiceReminders
                  ? <Badge variant="warning">{`Every ${formData.daysNextReminder || '–'}d · ${formData.numOfReminder || '–'}×`}</Badge>
                  : <Badge variant="neutral">Off</Badge>}</Glance>
              </dl>
              <Button variant="outline" onClick={() => setModal('preview')} className="mt-3 w-full"><Eye />Preview invoice</Button>
            </Section>

            <Section icon={Bell} title="Email & Reminders" description="What happens after the invoice is created">
              <div className="divide-y">
                <ToggleSetting label="Send email to client when invoice created" description="Sends the invoice with your message"
                  checked={!!formData.emailToClient} onChange={(v) => set('emailToClient', v)}>
                  <ShortcodeTextField label="Email Message to Client" value={formData.clientmsg} onChange={(v) => set('clientmsg', v)}
                    placeholder="Enter email message to client..." multiline rows={3} shortcuts={contactShortcuts} error={errors.clientmsg} />                </ToggleSetting>
                <ToggleSetting label="Pay invoice with credits if available" description="Uses the account’s credit balance first"
                  checked={!!formData.payUsingCredits} onChange={(v) => set('payUsingCredits', v)} />
                <ToggleSetting label="Send Reminders to clients" description="Until the invoice is paid"
                  checked={!!formData.invoiceReminders} onChange={(v) => set('invoiceReminders', v)}>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="inv-days" className="text-xs">Days until next reminder</Label>
                      <Input id="inv-days" type="number" min="1" className="tabular-nums" placeholder="Days until next reminder" value={formData.daysNextReminder}
                        onChange={(e) => set('daysNextReminder', e.target.value)} aria-invalid={!!errors.daysNextReminder} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="inv-count" className="text-xs">Number of reminders</Label>
                      <Input id="inv-count" type="number" min="1" className="tabular-nums" placeholder="Number of reminders" value={formData.numOfReminder}
                        onChange={(e) => set('numOfReminder', e.target.value)} aria-invalid={!!errors.numOfReminder} />
                    </div>
                  </div>
                  {(errors.daysNextReminder || errors.numOfReminder) && <div className="mt-1.5"><FieldError>{errors.daysNextReminder || errors.numOfReminder}</FieldError></div>}
                </ToggleSetting>
              </div>
            </Section>
          </aside>
        </div>

        {modal === 'preview' && <InvoicePreview form={formData} onClose={() => setModal(null)} />}
        {modal === 'discard' && (
          <Modal title="Discard changes?" onClose={() => setModal(null)}
            footer={<><Button variant="outline" onClick={() => setModal(null)}>Keep editing</Button><Button variant="destructive" onClick={() => navigate(LIST_PATH)}>Discard</Button></>}>
            <p className="text-sm text-muted-foreground">Your changes to this invoice template haven't been saved.</p>
          </Modal>
        )}
        {modal === 'delete' && (
          <Modal title={`Delete “${saved.templatename}”?`} onClose={() => setModal(null)}
            footer={<><Button variant="outline" onClick={() => setModal(null)}>Cancel</Button><Button variant="destructive" onClick={() => { deleteInvoiceTemplates([editingId]); navigate(LIST_PATH, { state: { toast: `Deleted “${saved.templatename}”` } }); }}><Trash2 />Delete</Button></>}>
            <p className="text-sm text-muted-foreground">Invoices already created from this template are not affected.</p>
          </Modal>
        )}
        <ToastBridge message={toast} />
      </div>

      <ActionBar dirty={dirty} isNew={!isEditMode}>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button variant="outline" onClick={onSave}>{isEditMode ? 'Update' : 'Save'}</Button>
        <Button onClick={onSaveAndExit}>{isEditMode ? 'Update & Exit' : 'Save & Exit'}</Button>
      </ActionBar>
    </>
  );
}
