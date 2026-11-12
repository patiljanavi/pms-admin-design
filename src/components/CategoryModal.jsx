import { useId, useState } from 'react';
import { Modal } from './ui';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { useData } from '../context/DataContext';

/**
 * Create (or edit) a service category. Used by ServiceModal's "Create category" button.
 * Props: category (optional, to edit) · onSaved(category) · onClose()
 */
export default function CategoryModal({ category = null, onSaved, onClose }) {
  const { saveServiceCategory, serviceCategoryNameTaken } = useData();
  const uid = useId();
  const [name, setName] = useState(category?.name || '');
  const [description, setDescription] = useState(category?.description || '');
  const [error, setError] = useState('');

  const save = () => {
    const trimmed = name.trim();
    if (!trimmed) return setError('Enter a category name.');
    if (serviceCategoryNameTaken?.(trimmed, category?.id)) return setError('A category with this name already exists.');
    return onSaved(saveServiceCategory({ id: category?.id, name: trimmed, description: description.trim() }));
  };

  return (
    <Modal title={category ? 'Edit category' : 'New category'} description="Group related services so they're easier to find." onClose={onClose} width="max-w-md"
      footer={<><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="button" onClick={save}>{category ? 'Save changes' : 'Create category'}</Button></>}>
      <form className="flex flex-col gap-4" noValidate onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); save(); }}>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${uid}-name`}>Category name <span className="text-danger-700">*</span></Label>
          <Input id={`${uid}-name`} autoFocus value={name} placeholder="e.g. Tax Preparation" onChange={(e) => { setName(e.target.value); setError(''); }}
            aria-invalid={!!error} aria-describedby={error ? `${uid}-err` : undefined} />
          {error && <p id={`${uid}-err`} className="text-xs text-danger-700">{error}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${uid}-desc`}>Description</Label>
          <Textarea id={`${uid}-desc`} rows={3} className="resize-none" value={description} placeholder="What kind of services go here?" onChange={(e) => setDescription(e.target.value)} />
        </div>
        <button type="submit" className="hidden" tabIndex={-1} aria-hidden="true" />
      </form>
    </Modal>
  );
}
