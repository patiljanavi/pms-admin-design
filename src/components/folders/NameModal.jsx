import { useState } from 'react';
import { CircleAlert, FolderOpen } from 'lucide-react';
import { Modal } from '../ui';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
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
      footer={<><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="button" onClick={save}>{submitLabel}</Button></>}>
      <form noValidate onSubmit={(e) => { e.preventDefault(); save(); }} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name-modal-input">{label}</Label>
          <Input id="name-modal-input" autoFocus aria-invalid={!!error} value={name} placeholder={placeholder}
            onChange={(e) => { setName(e.target.value); setError(''); }}
            onFocus={(e) => { const dot = e.target.value.lastIndexOf('.'); if (dot > 0) e.target.setSelectionRange(0, dot); }} />
          {error && <span role="alert" className="flex items-center gap-1.5 text-xs text-danger-700"><CircleAlert className="size-3.5" aria-hidden="true" />{error}</span>}
          {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
        </div>
        {pickLocation && (
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Save in</span>
            <FolderPicker items={items} value={target} onChange={(id) => { setTarget(id); setError(''); }} label="Save in" />
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <FolderOpen className="size-3.5 flex-none" aria-hidden="true" />Will be created in: <span className="truncate font-medium text-foreground" data-testid="save-in">{pathLabel(items, target)}</span>
            </p>
          </div>
        )}
        <button type="submit" className="hidden" tabIndex={-1} aria-hidden="true" />
      </form>
    </Modal>
  );
}
