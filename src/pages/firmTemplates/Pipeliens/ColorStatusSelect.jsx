import { useEffect, useId, useRef, useState } from 'react';
import { FiCheck, FiChevronDown } from 'react-icons/fi';
import { cx } from '../../../components/ui';

/** Dropdown of client-facing statuses ({ id, name, color }) with a color dot for each. */
export default function ColorStatusSelect({ label = 'Status', value, onChange, statuses, error }) {
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  const labelId = useId();
  const current = statuses.find((s) => String(s.id) === String(value));
  useEffect(() => {
    const h = (e) => { if (!box.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div ref={box} className="relative">
      <span id={labelId} className="mb-1.5 block text-sm font-semibold">{label}</span>
      <button type="button" aria-haspopup="listbox" aria-expanded={open} aria-labelledby={labelId} onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); } }}
        className={cx('flex min-h-[44px] w-full items-center gap-2 rounded border bg-surface px-3 text-left focus:outline-none focus:ring-2 focus:ring-brand-600/30',
          error ? 'border-danger-700' : 'border-line-strong focus:border-brand-600')}>
        {current ? <><span className="h-3 w-3 flex-none rounded-full" style={{ backgroundColor: current.color }} />{current.name}</> : <span className="text-muted/70">Select status</span>}
        <FiChevronDown className="ml-auto text-muted" aria-hidden="true" />
      </button>
      {open && (
        <ul role="listbox" aria-label="Client-facing statuses" className="absolute left-0 right-0 z-40 mt-1 max-h-64 overflow-y-auto rounded-md border border-line bg-surface p-1 shadow-pop">
          {statuses.map((s) => {
            const on = String(s.id) === String(value);
            return (
              <li key={s.id} role="option" aria-selected={on} onClick={() => { onChange(s.id); setOpen(false); }}
                className={cx('flex cursor-pointer items-center gap-2 rounded px-3 py-2', on ? 'bg-brand-50' : 'hover:bg-subtle')}>
                <span className="h-3 w-3 flex-none rounded-full" style={{ backgroundColor: s.color }} />
                <span className="flex-1">{s.name}</span>
                {on && <FiCheck className="text-brand-600" aria-hidden="true" />}
              </li>
            );
          })}
          {statuses.length === 0 && <li className="px-3 py-2 text-sm text-muted">No client-facing statuses yet.</li>}
        </ul>
      )}
      {error && <span className="mt-1 block text-sm text-danger-700">{error}</span>}
    </div>
  );
}
