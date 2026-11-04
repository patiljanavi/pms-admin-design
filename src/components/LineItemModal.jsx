import { useState } from 'react';
import { Modal, cx } from './ui';
import { money, rowAmount } from '../data/invoiceTemplates';

/** Modal to edit one line item. Props: row · number · onSave(row) · onClose() */
export default function LineItemModal({ row, number, onSave, onClose }) {
  const [form, setForm] = useState({ ...row });
  const [errors, setErrors] = useState({});
  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })); };
  const save = () => {
    const e = {};
    if (!form.productName.trim()) e.productName = 'Enter the item name.';
    if (!(Number(form.qty) > 0)) e.qty = 'Quantity must be more than 0.';
    if (!(Number(form.rate) >= 0) || form.rate === '') e.rate = 'Enter a rate (0 or more).';
    setErrors(e);
    if (Object.keys(e).length) return;
    onSave({ ...form, productName: form.productName.trim(), description: form.description.trim(), rate: Number(form.rate), qty: Number(form.qty) });
  };
  return (
    <Modal title={`Edit item ${number}`} subtitle="Line item" onClose={onClose} width="max-w-lg"
      footer={<><button type="button" className="btn-secondary" onClick={onClose}>Cancel</button><button type="button" className="btn-primary" onClick={save}>Save item</button></>}>
      <form className="flex flex-col gap-4" noValidate onSubmit={(e) => { e.preventDefault(); save(); }}>
        <label className="field-label">Item name *
          <input autoFocus className={cx('input', errors.productName && 'border-danger-700')} value={form.productName} onChange={(e) => set('productName', e.target.value)} />
          {errors.productName && <span className="text-sm font-normal text-danger-700">{errors.productName}</span>}
        </label>
        <label className="field-label">Description
          <textarea className="input min-h-[72px] py-2" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Shown under the item name on the invoice" />
        </label>
        <div className="grid grid-cols-3 gap-3">
          <label className="field-label">Rate ($)
            <input type="number" min="0" step="0.01" className={cx('input', errors.rate && 'border-danger-700')} value={form.rate} onChange={(e) => set('rate', e.target.value)} />
          </label>
          <label className="field-label">Quantity
            <input type="number" min="1" className={cx('input', errors.qty && 'border-danger-700')} value={form.qty} onChange={(e) => set('qty', e.target.value)} />
          </label>
          <div className="field-label">Amount<div className="flex min-h-[44px] items-center font-semibold">{money(rowAmount(form))}</div></div>
        </div>
        {(errors.rate || errors.qty) && <p className="-mt-2 text-sm text-danger-700">{errors.rate || errors.qty}</p>}
        <label className="flex cursor-pointer items-center gap-2.5">
          <input type="checkbox" checked={!!form.tax} onChange={(e) => set('tax', e.target.checked)} className="h-[18px] w-[18px] accent-brand-600" /> Apply tax to this item
        </label>
        <button type="submit" className="hidden" tabIndex={-1} aria-hidden="true" />
      </form>
    </Modal>
  );
}