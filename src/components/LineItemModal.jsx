import { useState } from 'react';
import { CircleAlert } from 'lucide-react';
import { Modal } from './ui';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { money, rowAmount } from '../data/invoiceTemplates';

function FieldError({ id, children }) {
  return <p id={id} className="flex items-center gap-1 text-xs font-medium text-danger-700"><CircleAlert className="size-3.5 flex-none" aria-hidden="true" />{children}</p>;
}

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
      footer={<><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="button" onClick={save}>Save item</Button></>}>
      <form className="flex flex-col gap-5" noValidate onSubmit={(e) => { e.preventDefault(); save(); }}>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="li-name">Item name<span className="ml-0.5 text-danger-700" aria-hidden="true">*</span></Label>
          <Input id="li-name" autoFocus value={form.productName} onChange={(e) => set('productName', e.target.value)} aria-invalid={!!errors.productName}
            aria-describedby={errors.productName ? 'li-name-error' : undefined} />
          {errors.productName && <FieldError id="li-name-error">{errors.productName}</FieldError>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="li-description">Description</Label>
          <Textarea id="li-description" className="min-h-[72px]" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Shown under the item name on the invoice" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="li-rate">Rate ($)</Label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground" aria-hidden="true">$</span>
              <Input id="li-rate" type="number" min="0" step="0.01" className="pl-6 text-right tabular-nums" value={form.rate} onChange={(e) => set('rate', e.target.value)} aria-invalid={!!errors.rate} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="li-qty">Quantity</Label>
            <Input id="li-qty" type="number" min="1" className="text-right tabular-nums" value={form.qty} onChange={(e) => set('qty', e.target.value)} aria-invalid={!!errors.qty} />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium leading-none">Amount</span>
            <div className="flex h-9 items-center justify-end rounded-md border border-dashed bg-subtle px-3 text-sm font-semibold tabular-nums" aria-live="polite">{money(rowAmount(form))}</div>
          </div>
        </div>
        {(errors.rate || errors.qty) && <FieldError>{errors.rate || errors.qty}</FieldError>}
        <label htmlFor="li-tax" className="flex cursor-pointer items-center gap-2.5 rounded-lg border bg-subtle/40 px-3.5 py-3 text-sm transition-colors hover:bg-accent">
          <Checkbox id="li-tax" checked={!!form.tax} onCheckedChange={(v) => set('tax', v === true)} />
          <span className="font-medium">Apply tax to this item</span>
        </label>
        <button type="submit" className="hidden" tabIndex={-1} aria-hidden="true" />
      </form>
    </Modal>
  );
}
