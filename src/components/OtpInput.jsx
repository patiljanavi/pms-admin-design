import { useRef } from 'react';
import { cx } from './ui';

/** 6 boxes: auto-advance, backspace/arrow navigation and paste-to-fill. */
export default function OtpInput({ value, onChange, length = 6, invalid = false }) {
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

  const half = Math.ceil(length / 2);

  return (
    <div className="flex items-center gap-2 sm:gap-2.5" role="group" aria-label="Verification code">
      {digits.map((d, i) => (
        <span key={i} className="contents">
          {i === half && length > 4 && <span className="h-0.5 w-2.5 flex-none rounded-full bg-line-strong" aria-hidden="true" />}
          <input ref={(el) => (refs.current[i] = el)} aria-label={`Digit ${i + 1} of ${length}`} aria-invalid={invalid || undefined}
            inputMode="numeric" autoComplete={i === 0 ? 'one-time-code' : 'off'} value={d}
            onChange={(e) => setAt(i, e.target.value.replace(/\D/g, ''))}
            onFocus={(e) => e.target.select()}
            onPaste={(e) => { const t = e.clipboardData.getData('text').replace(/\D/g, ''); if (t.length > 1) { e.preventDefault(); setAt(i, t); } }}
            onKeyDown={(e) => {
              if (e.key === 'Backspace' && !d && i > 0) refs.current[i - 1]?.focus();
              if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus();
              if (e.key === 'ArrowRight' && i < length - 1) refs.current[i + 1]?.focus();
            }}
            className={cx('h-12 w-full min-w-0 flex-1 rounded-lg border bg-card text-center font-mono text-xl font-semibold tabular-nums text-foreground caret-primary shadow-xs outline-none transition-[border-color,box-shadow,background-color] sm:h-14 sm:text-2xl',
              'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20 focus-visible:ring-offset-0',
              invalid ? 'border-destructive ring-[3px] ring-destructive/15' : d ? 'border-primary/60 bg-primary/[0.04]' : 'border-input')} />
        </span>
      ))}
    </div>
  );
}
