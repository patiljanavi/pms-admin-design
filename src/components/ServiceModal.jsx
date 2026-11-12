import { useId, useState } from 'react';
import { FolderPlus } from 'lucide-react';
import { Modal } from './ui';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { SimpleTooltip } from './ui/tooltip';
import CategoryModal from './CategoryModal';
import { useData } from '../context/DataContext';

const NO_CATEGORY = '__none__';

/**
 * Modal to create or edit a service (with "+ Create category" opening a second modal).
 * Props: service (existing service to edit, or null) · initial (prefill for a new service) · onSaved(service) · onClose()
 */
export default function ServiceModal({ service = null, initial = {}, onSaved, onClose }) {
  const { saveService, serviceNameTaken, serviceCategories = [] } = useData();
  const uid = useId();
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

  const id = (k) => `${uid}-${k}`;

  return (
    <>
      <Modal title={isEdit ? 'Edit service' : 'Create new service'} description="Services you bill for. Line items can reuse them." onClose={onClose} width="max-w-lg"
        footer={<><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="button" onClick={save}>{isEdit ? 'Save service' : 'Create service'}</Button></>}>
        <form className="flex flex-col gap-4" noValidate onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); save(); }}>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={id('name')}>Service name <span className="text-danger-700">*</span></Label>
            <Input id={id('name')} autoFocus value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Payroll processing"
              aria-invalid={!!errors.name} aria-describedby={errors.name ? id('name-err') : undefined} />
            {errors.name && <p id={id('name-err')} className="text-xs text-danger-700">{errors.name}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={id('desc')}>Description</Label>
            <Textarea id={id('desc')} className="min-h-[72px] resize-y" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Shown on the invoice under the item name" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={id('rate')}>Rate ($) <span className="text-danger-700">*</span></Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground" aria-hidden="true">$</span>
                <Input id={id('rate')} type="number" min="0" step="0.01" className="pl-7 tabular-nums" value={form.rate} onChange={(e) => set('rate', e.target.value)}
                  aria-invalid={!!errors.rate} aria-describedby={errors.rate ? id('rate-err') : undefined} />
              </div>
              {errors.rate && <p id={id('rate-err')} className="text-xs text-danger-700">{errors.rate}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={id('cat')}>Category</Label>
              <div className="flex gap-2">
                <Select value={form.categoryId ? String(form.categoryId) : NO_CATEGORY} onValueChange={(v) => set('categoryId', v === NO_CATEGORY ? null : v)}>
                  <SelectTrigger id={id('cat')} className="min-w-0 flex-1"><SelectValue placeholder="No category" /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    <SelectItem value={NO_CATEGORY} className="text-muted-foreground">No category</SelectItem>
                    {serviceCategories.length > 0 && <SelectSeparator />}
                    {serviceCategories.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <SimpleTooltip label="Create category">
                  <Button type="button" variant="outline" size="icon" onClick={() => setCategoryOpen(true)} aria-label="Create category" className="flex-none"><FolderPlus /></Button>
                </SimpleTooltip>
              </div>
            </div>
          </div>
          <label htmlFor={id('tax')} className="flex cursor-pointer items-start gap-2.5 rounded-lg border bg-subtle/60 px-3 py-2.5 transition-colors hover:bg-subtle">
            <Checkbox id={id('tax')} className="mt-0.5" checked={!!form.taxable} onCheckedChange={(v) => set('taxable', v === true)} />
            <span className="flex flex-col gap-0.5 text-sm">
              <span className="font-medium">Taxable</span>
              <span className="text-xs text-muted-foreground">Line items using this service are taxed by default</span>
            </span>
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
