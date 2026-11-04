import { useState } from 'react';
import { FiCheck, FiTag, FiTrash2 } from 'react-icons/fi';
import { Drawer, cx } from './ui';
import { FiX } from 'react-icons/fi';
import TagChip, { TAG_PALETTE, chipStyle, colorName, isHex, textOn } from './TagChip';
import { useData } from '../context/DataContext';

/**
 * One drawer for both creating and editing a tag.
 * - tag: the tag to edit, or null to create a new one
 * - onSaved(tag, isNew): called after saving
 * - onDelete(tag): edit mode only
 */
export default function TagDrawer({ tag, onClose, onSaved, onDelete, usage = 0 }) {
  const { nameTaken, saveTag } = useData();
  const isNew = !tag;
  const [label, setLabel] = useState(tag?.label || '');
  const [color, setColor] = useState(tag?.color || TAG_PALETTE[0].hex);
  const [hexInput, setHexInput] = useState(tag?.color || TAG_PALETTE[0].hex);
  const [description, setDescription] = useState(tag?.description || '');
  const [error, setError] = useState('');

  const pickColor = (hex) => { setColor(hex); setHexInput(hex); };
  const onHex = (v) => {
    const val = v.startsWith('#') ? v : `#${v}`;
    setHexInput(val);
    if (isHex(val)) setColor(val.toUpperCase());
  };

  const save = () => {
    const name = label.trim();
    if (!name) { setError('Enter a tag name.'); return; }
    if (name.length > 30) { setError('Keep the name to 30 characters or fewer.'); return; }
    if (nameTaken(name, tag?.value)) { setError(`A tag called “${name}” already exists.`); return; }
    const id = saveTag({ value: tag?.value, label: name, color, description: description.trim() });
    onSaved?.({ value: id, label: name, color }, isNew);
  };

  const preview = { value: 'preview', label: label.trim() || 'Tag name', color };

  return (
    <Drawer onClose={onClose} label={isNew ? 'New tag' : `Edit tag ${tag.label}`} width="max-w-[480px]">
      <div className="flex items-center gap-4 border-b border-line p-5 sm:p-6">
        <span className="flex h-14 w-14 flex-none items-center justify-center rounded-full" style={chipStyle(color)} aria-hidden="true"><FiTag size={22} /></span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-xl font-bold">{isNew ? 'New tag' : 'Edit tag'}</h2>
          <div className="truncate text-muted">{isNew ? 'Create a label to group accounts' : `Used by ${usage} account${usage === 1 ? '' : 's'}`}</div>
        </div>
        <button onClick={onClose} aria-label="Close" className="flex h-10 w-10 flex-none items-center justify-center rounded text-muted hover:bg-subtle"><FiX size={20} /></button>
      </div>

      <form className="flex flex-1 flex-col gap-6 p-5 sm:p-6" onSubmit={(e) => { e.preventDefault(); save(); }} noValidate>
        {/* Preview */}
        <div className="rounded-lg border border-line bg-subtle p-4">
          <div className="mb-2.5 text-xs font-semibold text-muted">Preview</div>
          <div className="flex flex-wrap items-center gap-3">
            <TagChip tag={preview} />
            <span className="text-sm text-muted">as it appears in the accounts table</span>
          </div>
        </div>

        <label className="field-label">Name *
          <input className={cx('input', error && 'border-danger-700')} value={label} maxLength={30} autoFocus
            onChange={(e) => { setLabel(e.target.value); setError(''); }} placeholder="e.g. Quarterly filing" />
          <span className="flex justify-between text-xs font-normal text-muted">
            <span className={cx(error && 'font-semibold text-danger-700')}>{error || 'Short and clear works best.'}</span>
            <span>{label.length}/30</span>
          </span>
        </label>

        {/* <fieldset>
          <legend className="mb-2.5 text-sm font-semibold">Color</legend>
          <div role="radiogroup" aria-label="Tag color" className="grid grid-cols-6 gap-2.5">
            {TAG_PALETTE.map((p) => {
              const on = color.toLowerCase() === p.hex.toLowerCase();
              return (
                <button key={p.hex} type="button" role="radio" aria-checked={on} aria-label={p.name} title={p.name} onClick={() => pickColor(p.hex)}
                  className={cx('flex aspect-square items-center justify-center rounded-full transition-transform', on ? 'ring-2 ring-ink ring-offset-2' : 'hover:scale-105')}
                  style={{ backgroundColor: p.hex, color: textOn(p.hex) }}>
                  {on && <FiCheck size={18} aria-hidden="true" />}
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm font-semibold">Custom
              <input type="color" value={color} onChange={(e) => pickColor(e.target.value.toUpperCase())}
                className="h-10 w-12 cursor-pointer rounded border border-line-strong bg-surface p-1" aria-label="Pick a custom color" />
            </label>
            <input aria-label="Hex color" value={hexInput} onChange={(e) => onHex(e.target.value.trim())} maxLength={7}
              className={cx('input w-32 font-mono uppercase', !isHex(hexInput) && 'border-danger-700')} />
            <span className="text-sm text-muted">{colorName(color)}</span>
          </div>
          {!isHex(hexInput) && <p className="mt-1.5 text-sm text-danger-700">Use a 6-digit hex code like #1D4ED8.</p>}
        </fieldset> */}
<fieldset>
  <legend className="mb-2.5 text-sm font-semibold">Color</legend>

  <div role="radiogroup" aria-label="Tag color" className="flex flex-wrap items-center gap-2.5">
    {TAG_PALETTE.map((p) => {
      const on = color.toLowerCase() === p.hex.toLowerCase();
      return (
        <button
          key={p.hex}
          type="button"
          role="radio"
          aria-checked={on}
          aria-label={p.name}
          title={p.name}
          onClick={() => pickColor(p.hex)}
          className={cx(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all duration-150',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2',
            on
              ? 'ring-2 ring-ink ring-offset-2 ring-offset-surface'
              : 'ring-1 ring-inset ring-black/10 hover:scale-110 hover:shadow-sm'
          )}
          style={{ backgroundColor: p.hex, color: textOn(p.hex) }}
        >
          {on && <FiCheck size={14} strokeWidth={3} aria-hidden="true" />}
        </button>
      );
    })}
  </div>

  <div className="mt-4 flex flex-wrap items-center gap-3">
    <label className="flex items-center gap-2 text-sm font-semibold">Custom
      <input type="color" value={color} onChange={(e) => pickColor(e.target.value.toUpperCase())}
        className="h-10 w-12 cursor-pointer rounded border border-line-strong bg-surface p-1" aria-label="Pick a custom color" />
    </label>
    <input aria-label="Hex color" value={hexInput} onChange={(e) => onHex(e.target.value.trim())} maxLength={7}
      className={cx('input w-32 font-mono uppercase', !isHex(hexInput) && 'border-danger-700')} />
    <span className="text-sm text-muted">{colorName(color)}</span>
  </div>
  {!isHex(hexInput) && <p className="mt-1.5 text-sm text-danger-700">Use a 6-digit hex code like #1D4ED8.</p>}
</fieldset>
        <label className="field-label">Description
          <textarea className="input min-h-[84px] py-2.5" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="When should the team use this tag? (optional)" />
        </label>

        <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
      </form>

      <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-2.5 border-t border-line bg-subtle px-5 py-4 sm:px-6">
        {!isNew ? (
          <button type="button" onClick={() => onDelete?.(tag)} className="inline-flex min-h-[44px] items-center gap-2 rounded px-3 font-semibold text-danger-700 hover:bg-danger-50"><FiTrash2 aria-hidden="true" /> Delete tag</button>
        ) : <span />}
        <div className="flex gap-2.5">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="btn-primary" onClick={save}>{isNew ? 'Create tag' : 'Save changes'}</button>
        </div>
      </div>
    </Drawer>
  );
}
