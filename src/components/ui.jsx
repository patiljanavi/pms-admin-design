import { useEffect, useRef } from 'react';
import { FiX } from 'react-icons/fi';

export const cx = (...c) => c.filter(Boolean).join(' ');

/** "Bennett Group" → "BG" (skips symbols like & and ·). */
export const initials = (name) => name.trim().split(/\s+/).filter((w) => /[a-z0-9]/i.test(w[0])).map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?';

const STATUS = {
  Active: 'bg-success-50 text-success-700',
  Pending: 'bg-warning-50 text-warning-700',
  Suspended: 'bg-danger-50 text-danger-700',
  Paid: 'bg-success-50 text-success-700',
  Due: 'bg-danger-50 text-danger-700',
};
export function StatusBadge({ value }) {
  return <span className={cx('pill', STATUS[value])}>{value}</span>;
}

export function Avatar({ text, size = 'md', tone = 'soft' }) {
  const s = { sm: 'h-7 w-7 text-xs', md: 'h-9 w-9 text-sm', lg: 'h-14 w-14 text-lg' }[size];
  const t = tone === 'solid' ? 'bg-brand-600 text-white' : tone === 'dark' ? 'bg-ink text-white' : 'bg-brand-100 text-brand-600';
  return <span className={cx('inline-flex flex-none items-center justify-center rounded-full font-semibold', s, t)} aria-hidden="true">{text}</span>;
}

/** Multi-select checkbox styled as a row */
export function Checkbox({ checked, onChange, children }) {
  return (
    <button type="button" role="checkbox" aria-checked={checked} onClick={() => onChange(!checked)}
      className="flex items-center gap-2.5 py-1.5 text-left text-ink">
      <span className={cx('flex h-5 w-5 flex-none items-center justify-center rounded-[5px] text-xs font-bold',
        checked ? 'bg-brand-600 text-white' : 'border-2 border-[#9AA4B2] bg-surface')}>{checked ? '✓' : ''}</span>
      <span>{children}</span>
    </button>
  );
}

/** Single-select radio dot */
export function RadioDot({ on }) {
  return <span className={cx('block h-[18px] w-[18px] flex-none rounded-full bg-surface', on ? 'border-[6px] border-brand-600' : 'border-2 border-[#9AA4B2]')} />;
}

export function Toggle({ checked, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
      className={cx('relative h-7 w-12 flex-none rounded-full transition-colors', checked ? 'bg-violet-600' : 'bg-line-strong')}>
      <span className={cx('absolute top-[3px] h-[22px] w-[22px] rounded-full bg-white transition-all', checked ? 'left-[23px]' : 'left-[3px]')} />
    </button>
  );
}

/** Segmented single-select control */
export function Segmented({ options, value, onChange, label }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex flex-wrap gap-1 rounded-md bg-[#E8EDF5] p-1">
      {options.map((o) => (
        <button key={o} type="button" role="radio" aria-checked={value === o} onClick={() => onChange(o)}
          className={cx('min-h-[36px] rounded-[7px] px-4 font-semibold', value === o ? 'bg-surface text-brand-600 shadow-card' : 'text-muted hover:text-ink')}>
          {o}
        </button>
      ))}
    </div>
  );
}

/** Underlined tabs (primary) */
export function Tabs({ tabs, value, onChange }) {
  return (
    <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-line px-4 sm:px-6">
      {tabs.map((t) => (
        <button key={t} role="tab" aria-selected={value === t} onClick={() => onChange(t)}
          className={cx('min-h-[48px] whitespace-nowrap border-b-[3px] px-3.5 font-semibold',
            value === t ? 'border-brand-600 text-brand-600' : 'border-transparent text-muted hover:text-ink')}>
          {t}
        </button>
      ))}
    </div>
  );
}

function useEscape(onClose) {
  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);
}

export function Modal({ title, subtitle, onClose, children, footer, width = 'max-w-lg' }) {
  useEscape(onClose);
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); }, []);
  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-ink/45 p-4 sm:py-20" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} className={cx('w-full rounded-xl bg-surface shadow-pop outline-none', width)}>
        <div className="flex items-center justify-between border-b border-line px-5 py-4 sm:px-6">
          <div>
            {subtitle && <div className="text-sm text-muted">{subtitle}</div>}
            <h2 className="text-lg font-semibold">{title}</h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="flex h-10 w-10 items-center justify-center rounded text-muted hover:bg-subtle"><FiX size={20} /></button>
        </div>
        <div className="px-5 py-5 sm:px-6">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2.5 rounded-b-xl border-t border-line bg-subtle px-5 py-4 sm:px-6">{footer}</div>}
      </div>
    </div>
  );
}

export function Drawer({ onClose, label, children, width = 'max-w-[560px]' }) {
  useEscape(onClose);
  return (
    <div className="fixed inset-0 z-30 flex justify-end bg-ink/35" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside role="dialog" aria-modal="true" aria-label={label} className={cx('flex h-full w-full flex-col overflow-y-auto bg-surface shadow-drawer', width)}>
        {children}
      </aside>
    </div>
  );
}
