import { useEffect, useRef, useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import { AUTOMATION_TYPES } from '../../../data/pipelinesdata';
import { cx } from '../../../components/ui';

/** "+ Add automation" button with a menu of the 10 automation types. */
export default function AutomationTypeMenu({ label = 'Add automation', onPick, className, align = 'left' }) {
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  useEffect(() => {
    const h = (e) => { if (!box.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div ref={box} className="relative">
      <button type="button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); } }}
        className={cx('btn w-full border border-dashed border-line-strong bg-surface text-brand-600 hover:bg-subtle', className)}>
        <FiPlus aria-hidden="true" /> {label}
      </button>
      {open && (
        <ul role="menu" aria-label="Automation types"
          className={cx('absolute bottom-full z-40 mb-1 max-h-72 w-64 overflow-y-auto rounded-md border border-line bg-surface p-1 shadow-pop', align === 'right' ? 'right-0' : 'left-0')}>
          {AUTOMATION_TYPES.map((a) => (
            <li key={a.type} role="none">
              <button type="button" role="menuitem" onClick={() => { onPick(a.type); setOpen(false); }}
                className="w-full rounded px-3 py-2 text-left text-sm hover:bg-subtle focus:bg-brand-50 focus:outline-none">{a.type}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
