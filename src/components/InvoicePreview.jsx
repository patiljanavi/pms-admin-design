import { Modal } from './ui';
import { calcTotals, money, paymentLabel, rowAmount } from '../data/invoiceTemplates';

/** Highlights [SHORTCODES] so the preview shows where real values will go. */
function WithShortcodes({ text = '' }) {
  return text.split(/(\[[A-Z0-9_]+\])/g).map((part, i) => (/^\[[A-Z0-9_]+\]$/.test(part)
    ? <span key={i} className="te-field">{part}</span>
    : <span key={i}>{part}</span>));
}

/** Preview of the invoice a client receives from this template. Props: form · onClose() */
export default function InvoicePreview({ form, onClose }) {
  const { subtotal, taxTotal, totalAmount } = calcTotals(form.rows, form.taxRate);
  const issued = new Date();
  return (
    <Modal title="Invoice preview" subtitle={form.templatename || 'Untitled template'} onClose={onClose} width="max-w-3xl"
      footer={<button type="button" className="btn-primary" onClick={onClose}>Close preview</button>}>
      <article aria-label="Invoice" className="rounded-lg border border-line bg-surface p-6 shadow-card sm:p-8">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-5">
          <div>
            <div className="flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded bg-brand-600 font-bold text-white">H</span><span className="text-lg font-bold">Harbor Accounting</span></div>
            <p className="mt-2 text-sm text-muted"><WithShortcodes text="[FIRM_EMAIL]" /></p>
          </div>
          <div className="text-right">
            <h3 className="text-2xl font-bold tracking-wide text-brand-600">INVOICE</h3>
            <p className="text-sm text-muted">No. INV-PREVIEW</p>
            <p className="text-sm text-muted">Issued {issued.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 py-5 sm:grid-cols-2">
          <div><p className="text-xs font-semibold uppercase tracking-wide text-muted">Bill to</p><p className="mt-1 font-semibold"><WithShortcodes text="[ACCOUNT_NAME]" /></p></div>
          <div className="sm:text-right"><p className="text-xs font-semibold uppercase tracking-wide text-muted">Payment method</p><p className="mt-1 font-semibold">{paymentLabel(form.paymentMode)}</p></div>
          {form.description && <div className="sm:col-span-2"><p className="text-xs font-semibold uppercase tracking-wide text-muted">Description</p><p className="mt-1"><WithShortcodes text={form.description} /></p></div>}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead><tr className="border-y border-line bg-subtle text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-3 py-2 font-semibold">Item</th><th className="px-3 py-2 text-right font-semibold">Rate</th><th className="px-3 py-2 text-right font-semibold">Qty</th><th className="px-3 py-2 text-right font-semibold">Amount</th>
            </tr></thead>
            <tbody>
              {form.rows.map((r) => (
                <tr key={r.id} className="border-b border-line-soft align-top">
                  <td className="px-3 py-2.5"><div className="font-semibold">{r.productName || 'Untitled item'}{r.tax && <span className="ml-1.5 text-xs font-normal text-muted">(taxed)</span>}</div>{r.description && <div className="text-xs text-muted">{r.description}</div>}</td>
                  <td className="px-3 py-2.5 text-right">{money(r.rate)}</td>
                  <td className="px-3 py-2.5 text-right">{r.qty}</td>
                  <td className="px-3 py-2.5 text-right font-semibold">{money(rowAmount(r))}</td>
                </tr>
              ))}
              {form.rows.length === 0 && <tr><td colSpan={4} className="px-3 py-6 text-center text-muted">No line items</td></tr>}
            </tbody>
          </table>
        </div>

        <dl className="ml-auto mt-4 flex max-w-xs flex-col gap-1.5 text-sm">
          <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{money(subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Tax ({Number(form.taxRate) || 0}%)</dt><dd>{money(taxTotal)}</dd></div>
          <div className="flex justify-between border-t border-line pt-1.5 text-base font-bold"><dt>Total due</dt><dd data-testid="preview-total">{money(totalAmount)}</dd></div>
          {form.payUsingCredits && <p className="text-xs text-muted">Available account credits are applied automatically.</p>}
        </dl>

        {form.clientNote && (
          <section className="mt-6 border-t border-line pt-4">
            <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Note</h4>
            {/* The note comes from this app's own text editor */}
            <div className="te-content text-sm" dangerouslySetInnerHTML={{ __html: form.clientNote }} />
          </section>
        )}
      </article>
      {(form.emailToClient || form.invoiceReminders) && (
        <ul className="mt-4 flex flex-col gap-1 text-sm text-muted">
          {form.emailToClient && <li>✉ Emailed to the client when the invoice is created.</li>}
          {form.invoiceReminders && <li>🔔 Reminder every {form.daysNextReminder} days, up to {form.numOfReminder} times.</li>}
        </ul>
      )}
    </Modal>
  );
}