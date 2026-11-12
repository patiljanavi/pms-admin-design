import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { AlertCircle, Braces, ChevronDown, Search } from 'lucide-react';
import { cx } from './ui';

/**
 * Text input with a "Shortcodes" button. Picking a shortcode inserts [VALUE] at the cursor.
 * Props: label · value · onChange(value) · placeholder · shortcuts ([{ title, isBold }, { title, value }]) · required · error
 */
export default function ShortcodeTextField({ label, value = '', onChange, placeholder, shortcuts = [], required, error }) {
  const id = useId();
  const errorId = `${id}-error`;
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
    <div ref={boxRef} className="relative flex flex-col gap-2">
      {label && (
        <label htmlFor={id} className="flex items-center gap-0.5 text-sm font-medium leading-none text-foreground">
          {label}{required && <span className="text-danger-700" aria-hidden="true">*</span>}
        </label>
      )}
      <div className={cx('flex h-9 items-stretch overflow-hidden rounded-md border bg-card shadow-xs transition-[box-shadow,border-color]',
        error ? 'border-destructive ring-[3px] ring-destructive/15' : 'border-input focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/20')}>
        <input id={id} ref={inputRef} value={value} placeholder={placeholder} aria-required={required || undefined}
          aria-invalid={error ? true : undefined} aria-describedby={error ? errorId : undefined}
          onChange={(e) => { onChange?.(e.target.value); cursor.current = e.target.selectionStart; }}
          onClick={remember} onKeyUp={remember} onSelect={remember}
          className="min-w-0 flex-1 bg-transparent px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/70 focus-visible:ring-0 focus-visible:ring-offset-0" />
        <button type="button" onMouseDown={remember} onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="dialog" aria-label={`${label || 'Field'} shortcodes`}
          className={cx('flex flex-none items-center gap-1.5 border-l px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50',
            open ? 'bg-accent text-foreground' : 'bg-subtle text-muted-foreground hover:bg-accent hover:text-foreground')}>
          <Braces className="size-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">Shortcodes</span>
          <ChevronDown className={cx('size-3.5 opacity-60 transition-transform', open && 'rotate-180')} aria-hidden="true" />
        </button>
      </div>
      {error && <span id={errorId} className="flex items-center gap-1.5 text-xs font-medium text-danger-700"><AlertCircle className="size-3.5 flex-none" aria-hidden="true" />{error}</span>}

      {open && (
        <div role="dialog" aria-label={`${label || 'Field'} shortcodes`} onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); } }}
          className="absolute right-0 top-full z-50 mt-1.5 flex w-[min(340px,100%)] animate-in fade-in-0 zoom-in-95 flex-col overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-pop">
          <div className="border-b p-1.5">
            <label className="flex h-8 items-center gap-2 rounded-md px-2 focus-within:bg-accent/60">
              <Search className="size-3.5 flex-none text-muted-foreground" aria-hidden="true" /><span className="sr-only">Search shortcodes</span>
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search shortcodes…"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70 focus-visible:ring-0 focus-visible:ring-offset-0" />
            </label>
          </div>
          <div className="max-h-[280px] overflow-y-auto p-1">
            {rows.map((s) => (s.isBold
              ? <div key={`h-${s.title}`} className="px-2 pb-1 pt-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{s.title}</div>
              : (
                <button key={s.value} type="button" onClick={() => insert(s)}
                  className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent focus:bg-accent focus:outline-none">
                  <span className="truncate">{s.title}</span>
                  <code className="max-w-[55%] flex-none truncate rounded border bg-muted px-1.5 py-px font-mono text-[11px] text-muted-foreground">[{s.value}]</code>
                </button>
              )))}
            {rows.length === 0 && <p className="px-4 py-6 text-center text-sm text-muted-foreground">No shortcodes found.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
