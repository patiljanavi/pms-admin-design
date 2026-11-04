import { useState } from 'react';
import { Modal, cx } from '../ui';
import FolderPicker, { pathLabel } from './FolderPicker';
import { childrenOf, nameError } from '../../data/folderTemplates';

/**
 * Ask for a name (new folder, new file, rename). Checks for empty, invalid and duplicate names.
 * With `items` + `initialTarget`, it also shows a "Save in" folder picker and calls onSave(name, targetId).
 * Without them (rename), pass `siblings` and it calls onSave(name).
 */
export default function NameModal({ title, label, initial = '', placeholder, hint, siblings, exceptId, submitLabel = 'Save', onSave, onClose, items, initialTarget }) {
  const pickLocation = items !== undefined && initialTarget !== undefined;
  const [name, setName] = useState(initial);
  const [target, setTarget] = useState(initialTarget);
  const [error, setError] = useState('');
  const save = () => {
    const e = nameError(name, pickLocation ? childrenOf(items, target) : siblings, exceptId);
    if (e) { setError(e); return; }
    if (pickLocation) onSave(name.trim(), target); else onSave(name.trim());
  };
  return (
    <Modal title={title} onClose={onClose} width="max-w-lg"
      footer={<><button type="button" className="btn-secondary" onClick={onClose}>Cancel</button><button type="button" className="btn-primary" onClick={save}>{submitLabel}</button></>}>
      <form noValidate onSubmit={(e) => { e.preventDefault(); save(); }} className="flex flex-col gap-4">
        <label className="field-label">{label}
          <input autoFocus className={cx('input', error && 'border-danger-700')} value={name} placeholder={placeholder}
            onChange={(e) => { setName(e.target.value); setError(''); }}
            onFocus={(e) => { const dot = e.target.value.lastIndexOf('.'); if (dot > 0) e.target.setSelectionRange(0, dot); }} />
          {error && <span role="alert" className="text-sm font-normal text-danger-700">{error}</span>}
          {hint && <span className="text-xs font-normal text-muted">{hint}</span>}
        </label>
        {pickLocation && (
          <div>
            <span className="mb-1.5 block text-sm font-semibold">Save in</span>
            <FolderPicker items={items} value={target} onChange={(id) => { setTarget(id); setError(''); }} label="Save in" />
            <p className="mt-1.5 text-xs text-muted">Will be created in: <span className="font-semibold text-ink" data-testid="save-in">{pathLabel(items, target)}</span></p>
          </div>
        )}
        <button type="submit" className="hidden" tabIndex={-1} aria-hidden="true" />
      </form>
    </Modal>
  );
}