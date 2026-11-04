import { cx } from '../ui';
import { calcTotals, money } from '../../data/invoiceTemplates';
import { PROPOSAL_PAYMENT_METHODS, proposalTotal } from '../../data/proposalTemplates';

/** Step — Payment: collect a payment when the client signs (only when billing with invoices). */
export default function PaymentStep({ formData, updateFormData, stepErrors = {} }) {
  const p = formData.payments;
  const set = (changes) => updateFormData('payments', changes);
  const first = formData.services.invoices?.[0];
  const firstTotal = first ? calcTotals(first.rows, first.taxRate).totalAmount : 0;
  const total = proposalTotal(formData);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold">Payment</h2>
        <p className="text-muted">Collect a payment from the client when they sign the proposal.</p>
      </div>
      <section className="grid grid-cols-1 gap-5 rounded-lg border border-line p-5 md:grid-cols-2">
        <label className="field-label">
          <span>Payment method <span className="text-danger-700">*</span></span>
          <select className={cx('input', stepErrors.method && 'border-danger-700')} value={p.method} onChange={(e) => set({ method: e.target.value })}>
            <option value="">Select payment method</option>
            {PROPOSAL_PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
          </select>
          {stepErrors.method && <span className="text-sm font-normal text-danger-700">{stepErrors.method}</span>}
        </label>
        <label className="field-label">
          <span>Amount ($) <span className="text-danger-700">*</span></span>
          <input type="number" min="0" step="0.01" className={cx('input', stepErrors.amount && 'border-danger-700')} value={p.amount} onChange={(e) => set({ amount: e.target.value })} />
          {stepErrors.amount && <span className="text-sm font-normal text-danger-700">{stepErrors.amount}</span>}
        </label>
        <div className="flex flex-wrap gap-2 md:col-span-2">
          <button type="button" className="btn-secondary min-h-[36px] text-sm" onClick={() => set({ amount: Math.round(firstTotal * 100) / 100 })}>Use first invoice ({money(firstTotal)})</button>
          <button type="button" className="btn-secondary min-h-[36px] text-sm" onClick={() => set({ amount: Math.round(total * 100) / 100 })}>Use full total ({money(total)})</button>
        </div>
      </section>
    </div>
  );
}