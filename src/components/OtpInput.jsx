import { useRef } from 'react';
import { cx } from './ui';

/** 6 boxes: auto-advance, backspace/arrow navigation and paste-to-fill. */
export default function OtpInput({ value, onChange, length = 6 }) {
  const refs = useRef([]);
  const digits = Array.from({ length }, (_, i) => value[i] || '');

  const setAt = (i, d) => {
    const next = digits.slice();
    if (d.length > 1) {
      d.slice(0, length - i).split('').forEach((c, k) => { next[i + k] = c; });
      onChange(next.join(''));
      refs.current[Math.min(length - 1, i + d.length)]?.focus();
      return;
    }
    next[i] = d;
    onChange(next.join(''));
    if (d && i < length - 1) refs.current[i + 1]?.focus();
  };

  return (
    <div className="grid grid-cols-6 gap-2 sm:gap-2.5">
      {digits.map((d, i) => (
        <input key={i} ref={(el) => (refs.current[i] = el)} aria-label={`Digit ${i + 1} of ${length}`}
          inputMode="numeric" autoComplete={i === 0 ? 'one-time-code' : 'off'} value={d}
          onChange={(e) => setAt(i, e.target.value.replace(/\D/g, ''))}
          onPaste={(e) => { const t = e.clipboardData.getData('text').replace(/\D/g, ''); if (t.length > 1) { e.preventDefault(); setAt(i, t); } }}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' && !d && i > 0) refs.current[i - 1]?.focus();
            if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus();
            if (e.key === 'ArrowRight' && i < length - 1) refs.current[i + 1]?.focus();
          }}
          className={cx('h-12 w-full min-w-0 rounded-md text-center text-2xl font-bold text-ink sm:h-14',
            d ? 'border-2 border-brand-600 bg-brand-50' : 'border border-line-strong bg-surface')} />
      ))}
    </div>
  );
}
