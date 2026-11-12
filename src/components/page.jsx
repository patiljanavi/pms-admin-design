/**
 * Page-level building blocks shared by every screen, so headers, stats, toolbars and
 * empty states look and behave the same everywhere.
 */
import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownRight, ArrowUpRight, Search, X } from 'lucide-react';
import { cn } from 'lib/utils';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from './ui/breadcrumb';

/** Title row: optional breadcrumbs / eyebrow, title, description and right-aligned actions. */
export function PageHeader({ title, description, breadcrumbs, eyebrow, actions, children, className }) {
  return (
    <header className={cn('flex flex-col gap-4', className)}>
      {breadcrumbs?.length > 0 && (
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((b, i) => (
              <span key={b.label} className="contents">
                {i > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {b.to && i < breadcrumbs.length - 1
                    ? <BreadcrumbLink asChild><Link to={b.to}>{b.label}</Link></BreadcrumbLink>
                    : i === breadcrumbs.length - 1 ? <BreadcrumbPage>{b.label}</BreadcrumbPage> : <span>{b.label}</span>}
                </BreadcrumbItem>
              </span>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      )}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          {eyebrow && <div className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">{eyebrow}</div>}
          <h1 className="page-title">{title}</h1>
          {description && <p className="page-description max-w-2xl">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </header>
  );
}

/** KPI tile. `change` is a % (number); `icon` a lucide/react-icons component. */
export function StatCard({ label, value, hint, change, icon: Icon, tone = 'default', invertChange = false, className, children, onClick, active }) {
  const up = change != null && change >= 0;
  const good = invertChange ? !up : up;
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp type={onClick ? 'button' : undefined} onClick={onClick} aria-pressed={onClick ? !!active : undefined}
      className={cn('group relative flex flex-col gap-3 overflow-hidden rounded-xl border bg-card p-4 text-left shadow-card transition-[border-color,box-shadow] sm:p-5',
        onClick && 'hover:border-line-strong hover:shadow-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
        active && 'border-primary/50 ring-1 ring-primary/30', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        {Icon && (
          <span className={cn('inline-flex size-8 items-center justify-center rounded-lg border bg-subtle text-muted-foreground [&_svg]:size-4',
            tone === 'danger' && 'border-danger-100 bg-danger-50 text-danger-700',
            tone === 'success' && 'border-success-100 bg-success-50 text-success-700',
            tone === 'brand' && 'border-brand-100 bg-brand-50 text-brand-700',
            tone === 'warning' && 'border-warning-100 bg-warning-50 text-warning-700')}>
            <Icon aria-hidden="true" />
          </span>
        )}
      </div>
      <div className={cn('text-2xl font-semibold tracking-tight tabular-nums', tone === 'danger' && 'text-danger-700')}>{value}</div>
      {(change != null || hint) && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {change != null && (
            <span className={cn('inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium tabular-nums',
              good ? 'bg-success-50 text-success-700' : 'bg-danger-50 text-danger-700')}>
              {up ? <ArrowUpRight className="size-3" aria-hidden="true" /> : <ArrowDownRight className="size-3" aria-hidden="true" />}
              {Math.abs(change)}%
            </span>
          )}
          {hint && <span className="text-muted-foreground">{hint}</span>}
        </div>
      )}
      {children}
    </Comp>
  );
}

/** Friendly empty / no-results state with an icon, copy and optional actions. */
export function EmptyState({ icon: Icon, title, description, action, className, compact = false }) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center', compact ? 'gap-2 px-6 py-10' : 'gap-3 px-6 py-16', className)}>
      {Icon && (
        <div className="relative mb-1">
          <div className="absolute inset-0 -m-3 rounded-full bg-gradient-to-b from-muted to-transparent" aria-hidden="true" />
          <span className="relative inline-flex size-11 items-center justify-center rounded-xl border bg-card text-muted-foreground shadow-card [&_svg]:size-5">
            <Icon aria-hidden="true" />
          </span>
        </div>
      )}
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold">{title}</h3>
        {description && <p className="mx-auto max-w-sm text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="mt-2 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}

/** Search field with icon and clear button (controlled). */
export const SearchInput = forwardRef(function SearchInput({ value, onChange, placeholder = 'Search…', className, label, shortcut, ...props }, ref) {
  return (
    <label className={cn('relative flex h-9 min-w-0 items-center rounded-md border border-input bg-card shadow-xs transition-[box-shadow,border-color] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/20', className)}>
      <Search className="pointer-events-none ml-3 size-4 flex-none text-muted-foreground" aria-hidden="true" />
      <span className="sr-only">{label || placeholder}</span>
      <input ref={ref} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="h-full min-w-0 flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground/70 focus-visible:ring-0 focus-visible:ring-offset-0" {...props} />
      {value ? (
        <button type="button" onClick={() => onChange('')} aria-label="Clear search" className="mr-1.5 inline-flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground">
          <X className="size-3.5" />
        </button>
      ) : shortcut ? <kbd className="kbd mr-2">{shortcut}</kbd> : null}
    </label>
  );
});

/** Card wrapper for a data table: toolbar on top, table, footer. */
export function DataCard({ toolbar, children, footer, className }) {
  return (
    <section className={cn('overflow-hidden rounded-xl border bg-card shadow-card', className)}>
      {toolbar && <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3 sm:px-5">{toolbar}</div>}
      {children}
      {footer}
    </section>
  );
}

/** Small section heading used inside cards and forms. */
export function SectionHeading({ title, description, action, className }) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-3', className)}>
      <div>
        <h2 className="section-title">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}
