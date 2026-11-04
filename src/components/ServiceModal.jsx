import { useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import { Modal, cx } from './ui';
import CategoryModal from './CategoryModal';
import { useData } from '../context/DataContext';

/**
 * Modal to create or edit a service (with "+ Create category" opening a second modal).
 * Props: service (existing service to edit, or null) · initial (prefill for a new service) · onSaved(service) · onClose()
 */
export default function ServiceModal({ service = null, initial = {}, onSaved, onClose }) {
  const { saveService, serviceNameTaken, serviceCategories = [] } = useData();
  const isEdit = !!service?.id;
  const [form, setForm] = useState(() => ({ name: '', description: '', rate: 0, categoryId: null, taxable: false, ...initial, ...(service || {}) }));
  const [errors, setErrors] = useState({});
  const [categoryOpen, setCategoryOpen] = useState(false);
  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })); };

  const save = () => {
    const e = {};
    const n = (form.name || '').trim();
    if (!n) e.name = 'Enter a service name.';
    else if (serviceNameTaken?.(n, service?.id)) e.name = 'A service with this name already exists.';
    if (!(Number(form.rate) >= 0) || form.rate === '') e.rate = 'Enter a rate (0 or more).';
    setErrors(e);
    if (Object.keys(e).length) return;
    onSaved(saveService({ ...form, id: service?.id, name: n, rate: Number(form.rate) || 0 }));
  };

  return (
    <>
      <Modal title={isEdit ? 'Edit service' : 'Create new service'} subtitle="Services you bill for. Line items can reuse them." onClose={onClose} width="max-w-lg"
        footer={<><button type="button" className="btn-secondary" onClick={onClose}>Cancel</button><button type="button" className="btn-primary" onClick={save}>{isEdit ? 'Save service' : 'Create service'}</button></>}>
        <form className="flex flex-col gap-4" noValidate onSubmit={(e) => { e.preventDefault(); save(); }}>
          <label className="field-label">Service name *
            <input autoFocus className={cx('input', errors.name && 'border-danger-700')} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Payroll processing" />
            {errors.name && <span className="text-sm font-normal text-danger-700">{errors.name}</span>}
          </label>
          <label className="field-label">Description
            <textarea className="input min-h-[72px] py-2" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Shown on the invoice under the item name" />
          </label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="field-label">Rate ($) *
              <input type="number" min="0" step="0.01" className={cx('input', errors.rate && 'border-danger-700')} value={form.rate} onChange={(e) => set('rate', e.target.value)} />
              {errors.rate && <span className="text-sm font-normal text-danger-700">{errors.rate}</span>}
            </label>
            <div className="field-label">
              <label htmlFor="service-category">Category</label>
              <div className="flex gap-2">
                <select id="service-category" className="input min-w-0 flex-1" value={form.categoryId ?? ''} onChange={(e) => set('categoryId', e.target.value || null)}>
                  <option value="">No category</option>
                  {serviceCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button type="button" onClick={() => setCategoryOpen(true)} aria-label="Create category" title="Create category"
                  className="flex h-11 w-11 flex-none items-center justify-center rounded border border-line-strong text-brand-600 hover:bg-subtle"><FiPlus aria-hidden="true" /></button>
              </div>
            </div>
          </div>
          <label className="flex cursor-pointer items-center gap-2.5">
            <input type="checkbox" checked={!!form.taxable} onChange={(e) => set('taxable', e.target.checked)} className="h-[18px] w-[18px] accent-brand-600" />
            <span>Taxable <span className="text-sm text-muted">(line items using this service are taxed by default)</span></span>
          </label>
          <button type="submit" className="hidden" tabIndex={-1} aria-hidden="true" />
        </form>
      </Modal>
      {categoryOpen && (
        <CategoryModal onClose={() => setCategoryOpen(false)} onSaved={(cat) => { set('categoryId', cat.id); setCategoryOpen(false); }} />
      )}
    </>
  );
}