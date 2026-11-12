import { Switch } from '../ui/switch';
import { CloseButton } from '../ui';
import { cn } from 'lib/utils';

/**
 * A settings block with a title, help text and a switch; extra content shows when it's on.
 * Props: title · help · checked · onChange(bool) · icon (optional lucide icon) · children
 */
export default function SettingsCard({ title, help, checked, onChange, icon: Icon, children }) {
  const open = !!checked && !!children;
  return (
    <section className={cn('rounded-xl border bg-card shadow-xs transition-colors', checked && 'border-primary/30 ring-1 ring-primary/10')}>
      <div className="flex items-start gap-3 p-4">
        {Icon && (
          <span className={cn('mt-0.5 inline-flex size-8 flex-none items-center justify-center rounded-lg border transition-colors [&_svg]:size-4',
            checked ? 'border-brand-200 bg-brand-50 text-brand-700' : 'bg-subtle text-muted-foreground')} aria-hidden="true">
            <Icon />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-foreground">{title}</div>
          {help && <p className="mt-0.5 text-sm text-muted-foreground">{help}</p>}
        </div>
        <Switch aria-label={title} checked={!!checked} onCheckedChange={onChange} className="mt-0.5" />
      </div>
      {open && <div className="border-t bg-subtle/50 px-4 py-4 animate-in fade-in-0 slide-in-from-top-1">{children}</div>}
    </section>
  );
}

/**
 * Standard drawer layout for the organizer drawers: header (icon, title, description, close),
 * a scrolling body and a footer with the actions on the right.
 */
export function DrawerLayout({ icon: Icon, iconStyle, title, description, onClose, footer, children, bodyClassName }) {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <header className="flex items-start gap-3 border-b px-6 py-4">
        {Icon && (
          <span className="inline-flex size-9 flex-none items-center justify-center rounded-lg border bg-subtle text-muted-foreground shadow-xs [&_svg]:size-4" style={iconStyle} aria-hidden="true">
            <Icon />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-semibold tracking-tight text-foreground">{title}</h2>
          {description && <p className="truncate text-sm text-muted-foreground">{description}</p>}
        </div>
        <CloseButton onClick={onClose} className="-mr-2" />
      </header>
      <div className={cn('min-h-0 flex-1 overflow-y-auto px-6 py-5', bodyClassName)}>{children}</div>
      {footer && <footer className="flex flex-wrap items-center justify-end gap-2 border-t bg-subtle px-6 py-3.5">{footer}</footer>}
    </div>
  );
}

/** Small "Label + control + help/error" stack used in the organizer drawers. */
export function Field({ label, htmlFor, required, help, error, children, className }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
          {label}{required && <span className="text-danger-700"> *</span>}
        </label>
      )}
      {children}
      {error ? <p role="alert" className="text-xs text-danger-700">{error}</p> : help ? <p className="text-xs text-muted-foreground">{help}</p> : null}
    </div>
  );
}
