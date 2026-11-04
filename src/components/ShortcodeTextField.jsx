import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { MdArrowDropDown, MdDataObject } from 'react-icons/md';
import { FiSearch } from 'react-icons/fi';
import { cx } from './ui';

/**
 * Text input with a "Shortcodes" button. Picking a shortcode inserts [VALUE] at the cursor.
 * Props: label · value · onChange(value) · placeholder · shortcuts ([{ title, isBold }, { title, value }]) · required · error
 */
export default function ShortcodeTextField({ label, value = '', onChange, placeholder, shortcuts = [], required, error }) {
  const id = useId();
  const inputRef = useRef(null);
  const boxRef = useRef(null);
  const cursor = useRef(null);            // last cursor position in the input
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');

  useEffect(() => {
    const onDoc = (e) => { if (!boxRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    const out = [];
    let heading = null;
    shortcuts.forEach((s) => {
      if (s.isBold) { heading = s; return; }
      if (term && !`${s.title} ${s.value}`.toLowerCase().includes(term)) return;
      if (heading) { out.push(heading); heading = null; }
      out.push(s);
    });
    return out;
  }, [shortcuts, q]);

  const remember = () => { cursor.current = inputRef.current?.selectionStart ?? value.length; };
  const insert = (s) => {
    const token = `[${s.value}]`;
    const at = cursor.current ?? value.length;
    const next = value.slice(0, at) + token + value.slice(at);
    onChange?.(next);
    setOpen(false); setQ('');
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(at + token.length, at + token.length);
      cursor.current = at + token.length;
    });
  };

  return (
    <div ref={boxRef} className="relative flex flex-col gap-1.5">
      {label && <label htmlFor={id} className="text-sm font-semibold">{label}{required && <span className="text-danger-700"> *</span>}</label>}
      <div className={cx('flex min-h-[44px] items-stretch overflow-hidden rounded border bg-surface focus-within:ring-2 focus-within:ring-brand-600/30',
        error ? 'border-danger-700' : 'border-line-strong focus-within:border-brand-600')}>
        <input id={id} ref={inputRef} value={value} placeholder={placeholder}
          onChange={(e) => { onChange?.(e.target.value); cursor.current = e.target.selectionStart; }}
          onClick={remember} onKeyUp={remember} onSelect={remember}
          className="min-w-0 flex-1 bg-transparent px-3 outline-none placeholder:text-muted/70" />
        <button type="button" onMouseDown={remember} onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={`${label || 'Field'} shortcodes`}
          className={cx('flex flex-none items-center gap-1 border-l border-line px-2.5 text-sm font-semibold', open ? 'bg-brand-100 text-brand-600' : 'bg-subtle text-muted hover:text-ink')}>
          <MdDataObject className="text-[17px]" aria-hidden="true" /> Shortcodes <MdArrowDropDown aria-hidden="true" />
        </button>
      </div>
      {error && <span className="text-sm text-danger-700">{error}</span>}

      {open && (
        <div role="dialog" aria-label={`${label || 'Field'} shortcodes`} onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); } }}
          className="absolute right-0 top-full z-30 mt-1 flex w-[min(320px,100%)] flex-col rounded-md border border-line bg-surface shadow-pop">
          <div className="border-b border-line p-2">
            <label className="flex min-h-[38px] items-center gap-2 rounded border border-line-strong px-2.5 focus-within:border-brand-600">
              <FiSearch className="text-muted" aria-hidden="true" /><span className="sr-only">Search shortcodes</span>
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search shortcodes" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
            </label>
          </div>
          <div className="max-h-[280px] overflow-y-auto p-1.5">
            {rows.map((s) => (s.isBold
              ? <div key={`h-${s.title}`} className="px-2 pb-1 pt-2 text-xs font-bold uppercase tracking-wide text-ink">{s.title}</div>
              : (
                <button key={s.value} type="button" onClick={() => insert(s)} className="flex w-full items-center justify-between gap-3 rounded px-2 py-1.5 text-left hover:bg-subtle focus:bg-brand-50 focus:outline-none">
                  <span className="text-sm">{s.title}</span>
                  <code className="truncate rounded bg-brand-100 px-1.5 font-mono text-[11px] text-brand-800">[{s.value}]</code>
                </button>
              )))}
            {rows.length === 0 && <p className="p-4 text-center text-sm text-muted">No shortcodes found.</p>}
          </div>
        </div>
      )}
    </div>
  );
}