/**
 * Harbor UI primitives.
 *
 * These keep the API the screens already use (Modal, Drawer, Toggle, Segmented …) but are
 * now built on shadcn/ui + Radix, so they get focus trapping, scroll locking, stacking,
 * animation and dark mode for free. For new code, prefer importing the shadcn components
 * directly: `import { Button } from 'components/ui/button'`.
 */
import * as SwitchPrimitives from '@radix-ui/react-switch';
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';
import { Check, X } from 'lucide-react';
import { cn } from 'lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './dialog';
import { Sheet, SheetContent, SheetTitle } from './sheet';

/** Class joiner kept for older code. Uses tailwind-merge, so later classes win. */
export const cx = (...c) => cn(...c);

/** "Bennett Group" → "BG" (skips symbols like & and ·). */
export const initials = (name = '') => name.trim().split(/\s+/).filter((w) => /[a-z0-9]/i.test(w[0])).map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?';

/* ---------- Status badge ---------- */
const STATUS = {
  Active: 'border-success-100 bg-success-50 text-success-700',
  Paid: 'border-success-100 bg-success-50 text-success-700',
  Pending: 'border-warning-100 bg-warning-50 text-warning-700',
  Due: 'border-warning-100 bg-warning-50 text-warning-700',
  Suspended: 'border-danger-100 bg-danger-50 text-danger-700',
  Overdue: 'border-danger-100 bg-danger-50 text-danger-700',
};
export function StatusBadge({ value, className }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium', STATUS[value] || 'border-border bg-muted text-muted-foreground', className)}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />{value}
    </span>
  );
}

/* ---------- Avatar ---------- */
// Soft, theme-aware avatar colours picked from the initials so each person keeps "their" colour.
const AVATAR_TONES = [
  'bg-brand-100 text-brand-700',
  'bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200/60',
  'bg-success-100 text-success-700',
  'bg-warning-100 text-warning-700',
  'bg-danger-100 text-danger-700',
  'bg-secondary text-secondary-foreground',
];
const hash = (s = '') => [...s].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);

export function Avatar({ text, size = 'md', tone = 'soft', className }) {
  const s = { xs: 'size-6 text-[10px]', sm: 'size-7 text-[11px]', md: 'size-8 text-xs', lg: 'size-12 text-base', xl: 'size-16 text-xl' }[size];
  const t = tone === 'solid' ? 'bg-primary text-primary-foreground'
    : tone === 'dark' ? 'bg-inverse text-inverse-foreground'
      : AVATAR_TONES[hash(text) % AVATAR_TONES.length];
  return (
    <span className={cn('inline-flex flex-none select-none items-center justify-center rounded-full font-semibold tracking-tight', s, t, className)} aria-hidden="true">
      {text}
    </span>
  );
}

/* ---------- Checkbox row ---------- */
export function Checkbox({ checked, onChange, children, disabled, className }) {
  return (
    <button type="button" role="checkbox" aria-checked={checked} disabled={disabled} onClick={() => onChange(!checked)}
      className={cn('group flex items-center gap-2.5 rounded-md py-1.5 text-left text-sm text-foreground disabled:opacity-50', className)}>
      <span className={cn('grid size-4 flex-none place-content-center rounded-[4px] border shadow-xs transition-colors',
        checked ? 'border-primary bg-primary text-primary-foreground' : 'border-line-strong bg-card group-hover:border-muted-foreground/60')}>
        {checked && <Check className="size-3" strokeWidth={3} />}
      </span>
      <span>{children}</span>
    </button>
  );
}

/** Single-select radio dot */
export function RadioDot({ on }) {
  return (
    <span className={cn('grid size-4 flex-none place-content-center rounded-full border bg-card shadow-xs transition-colors', on ? 'border-primary' : 'border-line-strong')}>
      {on && <span className="size-2 rounded-full bg-primary" />}
    </span>
  );
}

/* ---------- Switch ---------- */
export function Toggle({ checked, onChange, label, disabled, size = 'md' }) {
  const lg = size === 'lg';
  return (
    <SwitchPrimitives.Root checked={!!checked} onCheckedChange={onChange} aria-label={label} disabled={disabled}
      className={cn('peer inline-flex flex-none cursor-pointer items-center rounded-full border-2 border-transparent shadow-xs transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
        'data-[state=checked]:bg-primary data-[state=unchecked]:bg-input', lg ? 'h-6 w-11' : 'h-5 w-9')}>
      <SwitchPrimitives.Thumb className={cn('pointer-events-none block rounded-full bg-white shadow-sm transition-transform data-[state=unchecked]:translate-x-0',
        lg ? 'size-5 data-[state=checked]:translate-x-5' : 'size-4 data-[state=checked]:translate-x-4')} />
    </SwitchPrimitives.Root>
  );
}

/* ---------- Segmented control ---------- */
export function Segmented({ options, value, onChange, label, size = 'md', className }) {
  return (
    <ToggleGroupPrimitive.Root type="single" value={value} onValueChange={(v) => v && onChange(v)} aria-label={label}
      className={cn('inline-flex flex-wrap items-center gap-0.5 rounded-lg bg-muted p-[3px]', className)}>
      {options.map((o) => {
        const val = typeof o === 'string' ? o : o.value;
        const text = typeof o === 'string' ? o : o.label;
        return (
          <ToggleGroupPrimitive.Item key={val} value={val}
            className={cn('inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 font-medium text-muted-foreground transition-all hover:text-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-xs',
              size === 'sm' ? 'h-7 text-xs' : 'h-8 text-sm')}>
            {text}
          </ToggleGroupPrimitive.Item>
        );
      })}
    </ToggleGroupPrimitive.Root>
  );
}

/* ---------- Underlined tabs ---------- */
export function Tabs({ tabs, value, onChange, className }) {
  return (
    <div role="tablist" className={cn('flex gap-1 overflow-x-auto border-b px-4 sm:px-6', className)}>
      {tabs.map((t) => (
        <button key={t} role="tab" type="button" aria-selected={value === t} onClick={() => onChange(t)}
          className={cn('relative h-11 whitespace-nowrap px-3 text-sm font-medium transition-colors',
            'after:absolute after:inset-x-2 after:-bottom-px after:h-0.5 after:rounded-full after:transition-colors',
            value === t ? 'text-foreground after:bg-primary' : 'text-muted-foreground after:bg-transparent hover:text-foreground')}>
          {t}
        </button>
      ))}
    </div>
  );
}

/* ---------- Overlays ---------- */
/**
 * Radix closes a dialog on any pointer-down outside its content. Older widgets render their
 * menus in portals (outside the dialog), so only treat a click on the dimmed backdrop as "outside".
 */
const onlyBackdropCloses = (e) => {
  const target = e.detail?.originalEvent?.target;
  if (!(target instanceof Element) || !target.closest('[data-overlay]')) e.preventDefault();
};

/**
 * Modal dialog. Mount it conditionally: {open && <Modal … />}.
 * width: any max-w-* class (default max-w-lg).
 */
export function Modal({ title, subtitle, description, onClose, children, footer, width = 'max-w-lg', bodyClassName }) {
  return (
    <Dialog open onOpenChange={(o) => !o && onClose?.()}>
      <DialogContent className={cn(width)} onPointerDownOutside={onlyBackdropCloses} onInteractOutside={onlyBackdropCloses}>
        <div className="flex flex-col gap-1 border-b px-6 pb-4 pr-12 pt-5">
          {subtitle && <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{subtitle}</div>}
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : <DialogDescription className="sr-only">{title}</DialogDescription>}
        </div>
        <div className={cn('min-h-0 flex-1 overflow-y-auto px-6 py-5', bodyClassName)}>{children}</div>
        {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t bg-subtle px-6 py-3.5">{footer}</div>}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Right-hand drawer. The screen renders its own header/close button inside `children`.
 * Mount it conditionally: {open && <Drawer … />}.
 */
export function Drawer({ onClose, label, children, width = 'max-w-[560px]', className }) {
  return (
    <Sheet open onOpenChange={(o) => !o && onClose?.()}>
      <SheetContent side="right" hideClose aria-describedby={undefined}
        onPointerDownOutside={onlyBackdropCloses} onInteractOutside={onlyBackdropCloses}
        className={cn('w-full overflow-y-auto sm:max-w-none', width, className)}>
        <SheetTitle className="sr-only">{label}</SheetTitle>
        {children}
      </SheetContent>
    </Sheet>
  );
}

/** Close button for custom drawer/modal headers. */
export function CloseButton({ onClick, label = 'Close', className }) {
  return (
    <button type="button" onClick={onClick} aria-label={label}
      className={cn('inline-flex size-8 flex-none items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50', className)}>
      <X className="size-4" />
    </button>
  );
}

