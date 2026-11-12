import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check as FiCheck, ChevronsUpDown as FiChevronDown, Plus as FiPlus, X as FiX } from 'lucide-react';
import { cx } from './ui';

/**
 * Multi-select with chips.
 * - options: [{ value, label, meta?, tone? }]
 * - value: array of selected option values
 * - creatable: lets the user add a new option by typing it (calls onCreate(label) → returns the new value)
 * - chipClass(option) / chipStyle(option): optional class or inline style for each chip (e.g. tag colours)
 * - renderOption(option): optional custom row content in the list
 * - createLabel: text before the typed value in the create row (default "Create")
 * Keyboard: type to filter · ↑/↓ to move · Enter to pick · Backspace removes the last chip · Esc closes.
 */
export default function MultiSelect({
  label, options, value, onChange, placeholder = 'Search…', creatable = false, onCreate,
  chipClass, chipStyle, renderOption, emptyText = 'No matches', error, createLabel = 'Create',
}) {
  const id = useId();
  const listId = `${id}-list`;
  const boxRef = useRef(null);
  const inputRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  const selected = value.map((v) => options.find((o) => o.value === v)).filter(Boolean);
  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => options.filter((o) => !q || `${o.label} ${o.meta || ''}`.toLowerCase().includes(q)), [options, q]);
  const exact = options.some((o) => o.label.toLowerCase() === q);
  const showCreate = creatable && q && !exact;
  const rows = showCreate ? [...filtered, { value: '__create__', label: query.trim(), create: true }] : filtered;

  useEffect(() => {
    const onDoc = (e) => { if (!boxRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);
  useEffect(() => { setActive(0); }, [query, open]);

  const toggle = (v) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  const pick = (row) => {
    if (!row) return;
    if (row.create) {
      const newValue = onCreate?.(row.label);
      if (newValue) onChange([...value, newValue]);
    } else {
      toggle(row.value);
    }
    setQuery('');
    inputRef.current?.focus();
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((i) => Math.min(rows.length - 1, i + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(0, i - 1)); }
    else if (e.key === 'Enter') { if (open && rows[active]) { e.preventDefault(); pick(rows[active]); } }
    else if (e.key === 'Escape' && open) { e.stopPropagation(); setOpen(false); } // close the list, not the surrounding modal
    else if (e.key === 'Backspace' && !query && value.length) { onChange(value.slice(0, -1)); }
  };

  return (
    <div ref={boxRef} className="relative">
      {label && <label htmlFor={id} className="mb-1.5 flex justify-between text-sm font-medium"><span>{label}</span>{value.length > 0 && <span className="font-normal text-muted-foreground">{value.length} selected</span>}</label>}
      <div onClick={() => { setOpen(true); inputRef.current?.focus(); }}
        className={cx('flex min-h-9 cursor-text flex-wrap items-center gap-1 rounded-md border bg-card px-1.5 py-1 shadow-xs transition-[box-shadow,border-color]',
          error ? 'border-destructive ring-[3px] ring-destructive/15' : open ? 'border-ring ring-[3px] ring-ring/20' : 'border-input')}>
        {selected.map((o) => (
          <span key={o.value} style={chipStyle ? chipStyle(o) : undefined} className={cx('inline-flex h-6 items-center gap-0.5 rounded-md py-0.5 pl-2 pr-0.5 text-xs font-medium', chipStyle ? '' : chipClass ? chipClass(o) : 'border bg-secondary text-secondary-foreground')}>
            {o.label}
            <button type="button" aria-label={`Remove ${o.label}`} onClick={(e) => { e.stopPropagation(); toggle(o.value); }}
              className="flex size-4 items-center justify-center rounded hover:bg-black/10"><FiX className="size-3" aria-hidden="true" /></button>
          </span>
        ))}
        <input id={id} ref={inputRef} role="combobox" aria-expanded={open} aria-controls={listId} aria-autocomplete="list"
          aria-activedescendant={open && rows[active] ? `${id}-opt-${active}` : undefined}
          value={query} onChange={(e) => { setQuery(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onKeyDown={onKeyDown}
          placeholder={value.length ? '' : placeholder}
          className="min-w-[120px] flex-1 bg-transparent px-1.5 py-0.5 text-sm outline-none placeholder:text-muted-foreground/70 focus-visible:ring-0 focus-visible:ring-offset-0" />
        <FiChevronDown aria-hidden="true" className="mr-1 size-4 flex-none text-muted-foreground/70" />
      </div>

      {open && (
        <ul id={listId} role="listbox" aria-multiselectable="true"
          className="absolute left-0 right-0 z-50 mt-1.5 max-h-64 animate-in fade-in-0 zoom-in-95 overflow-y-auto rounded-lg border bg-popover p-1 text-popover-foreground shadow-pop">
          {rows.length === 0 && <li className="px-3 py-2.5 text-sm text-muted-foreground">{emptyText}</li>}
          {rows.map((o, i) => {
            const isSel = value.includes(o.value);
            return (
              <li key={o.value} id={`${id}-opt-${i}`} role="option" aria-selected={isSel}
                onMouseDown={(e) => e.preventDefault()} onClick={() => pick(o)} onMouseEnter={() => setActive(i)}
                className={cx('flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm', i === active && 'bg-accent text-accent-foreground')}>
                {o.create ? (
                  <><FiPlus aria-hidden="true" className="size-4 text-primary" /><span>{createLabel} “<b>{o.label}</b>”</span></>
                ) : (
                  <>
                    <span className={cx('flex size-4 flex-none items-center justify-center rounded-[4px] border', isSel ? 'border-primary bg-primary text-primary-foreground' : 'border-line-strong')}>{isSel && <FiCheck className="size-3" strokeWidth={3} aria-hidden="true" />}</span>
                    {renderOption ? renderOption(o) : <span className="flex-1">{o.label}{o.meta && <span className="ml-2 text-sm text-muted-foreground">{o.meta}</span>}</span>}
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {error && <div className="mt-1.5 text-xs font-medium text-danger-700">{error}</div>}
    </div>
  );
}
