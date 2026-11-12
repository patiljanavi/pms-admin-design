import { useState } from 'react';
import { Check, CircleAlert, Pipette, Tag, Trash2 } from 'lucide-react';
import { CloseButton, Drawer } from './ui';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { SimpleTooltip } from './ui/tooltip';
import TagChip, { TAG_PALETTE, chipStyle, colorName, isHex, textOn } from './TagChip';
import { useData } from '../context/DataContext';
import { cn } from 'lib/utils';

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
  const custom = !TAG_PALETTE.some((p) => p.hex.toLowerCase() === color.toLowerCase());
  const hexBad = !isHex(hexInput);

  return (
    <Drawer onClose={onClose} label={isNew ? 'New tag' : `Edit tag ${tag.label}`} width="max-w-[480px]">
      {/* Header */}
      <div className="flex flex-none items-start gap-3.5 border-b px-6 py-5">
        <span className="flex size-11 flex-none items-center justify-center rounded-xl transition-colors" style={chipStyle(color)} aria-hidden="true"><Tag className="size-5" /></span>
        <div className="min-w-0 flex-1 pt-0.5">
          <h2 className="truncate text-lg font-semibold tracking-tight">{isNew ? 'New tag' : 'Edit tag'}</h2>
          <p className="truncate text-sm text-muted-foreground">{isNew ? 'Create a label to group accounts.' : `Used by ${usage} account${usage === 1 ? '' : 's'}`}</p>
        </div>
        <CloseButton onClick={onClose} />
      </div>

      <form className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 py-5" onSubmit={(e) => { e.preventDefault(); save(); }} noValidate>
        {/* Preview */}
        <div className="rounded-xl border bg-subtle p-4">
          <div className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Preview</div>
          <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card px-3 py-2.5 shadow-xs">
            <TagChip tag={preview} />
            <TagChip tag={preview} size="xs" />
            <span className="ml-auto text-xs text-muted-foreground">as it appears in tables</span>
          </div>
        </div>

        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tag-name">Name<span className="ml-0.5 text-danger-700" aria-hidden="true">*</span></Label>
          <Input id="tag-name" value={label} maxLength={30} autoFocus aria-invalid={!!error || undefined} aria-describedby="tag-name-help"
            onChange={(e) => { setLabel(e.target.value); setError(''); }} placeholder="e.g. Quarterly filing" />
          <div id="tag-name-help" className="flex justify-between gap-3 text-xs">
            {error
              ? <span className="flex items-center gap-1 text-danger-700"><CircleAlert className="size-3.5 flex-none" aria-hidden="true" />{error}</span>
              : <span className="text-muted-foreground">Short and clear works best.</span>}
            <span className={cn('tabular-nums text-muted-foreground', label.length >= 30 && 'text-warning-700')}>{label.length}/30</span>
          </div>
        </div>

        {/* Colour */}
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1.5 flex w-full items-center justify-between text-sm font-medium">
            Color
            <span className="text-xs font-normal text-muted-foreground">{colorName(color)}</span>
          </legend>

          <div role="radiogroup" aria-label="Tag color" className="grid grid-cols-6 gap-2.5">
            {TAG_PALETTE.map((p) => {
              const on = color.toLowerCase() === p.hex.toLowerCase();
              return (
                <SimpleTooltip key={p.hex} label={p.name}>
                  <button type="button" role="radio" aria-checked={on} aria-label={p.name} onClick={() => pickColor(p.hex)}
                    className={cn('flex aspect-square w-full items-center justify-center rounded-lg shadow-xs ring-1 ring-inset ring-foreground/10 transition-all duration-150',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card',
                      on ? 'scale-100 outline outline-2 outline-offset-2 outline-foreground/70' : 'hover:scale-[1.06] hover:shadow-sm')}
                    style={{ backgroundColor: p.hex, color: textOn(p.hex) }}>
                    {on && <Check className="size-4" strokeWidth={3} aria-hidden="true" />}
                  </button>
                </SimpleTooltip>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-subtle p-2.5">
            <SimpleTooltip label="Pick a custom color">
              <label className={cn('relative flex size-9 flex-none cursor-pointer items-center justify-center overflow-hidden rounded-md shadow-xs ring-1 ring-inset ring-foreground/10',
                custom && 'outline outline-2 outline-offset-2 outline-foreground/70')} style={{ backgroundColor: color, color: textOn(color) }}>
                <Pipette className="size-4" aria-hidden="true" />
                <input type="color" value={color} onChange={(e) => pickColor(e.target.value.toUpperCase())}
                  className="absolute inset-0 cursor-pointer opacity-0" aria-label="Pick a custom color" />
              </label>
            </SimpleTooltip>
            <Input aria-label="Hex color" value={hexInput} onChange={(e) => onHex(e.target.value.trim())} maxLength={7}
              aria-invalid={hexBad || undefined} className="h-9 w-28 font-mono uppercase" />
            <span className="text-sm text-muted-foreground">{custom ? 'Custom color' : 'From the palette'}</span>
          </div>
          {hexBad && <p className="flex items-center gap-1 text-xs text-danger-700"><CircleAlert className="size-3.5" aria-hidden="true" />Use a 6-digit hex code like #1D4ED8.</p>}
        </fieldset>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tag-desc">Description <span className="font-normal text-muted-foreground">(optional)</span></Label>
          <Textarea id="tag-desc" className="min-h-[84px]" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="When should the team use this tag?" />
        </div>

        <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
      </form>

      {/* Footer */}
      <div className="flex flex-none flex-wrap items-center justify-between gap-2 border-t bg-subtle px-6 py-3.5">
        {!isNew
          ? <Button type="button" variant="ghost" onClick={() => onDelete?.(tag)} className="text-danger-700 hover:bg-danger-50 hover:text-danger-700"><Trash2 />Delete tag</Button>
          : <span />}
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="button" onClick={save}>{isNew ? 'Create tag' : 'Save changes'}</Button>
        </div>
      </div>
    </Drawer>
  );
}
