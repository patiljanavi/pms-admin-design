import { cva } from 'class-variance-authority';
import { cn } from 'lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-medium transition-colors [&_svg]:size-3',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        outline: 'border-border text-foreground',
        destructive: 'border-transparent bg-destructive text-destructive-foreground',
        success: 'border-success-100 bg-success-50 text-success-700',
        warning: 'border-warning-100 bg-warning-50 text-warning-700',
        danger: 'border-danger-100 bg-danger-50 text-danger-700',
        info: 'border-brand-100 bg-brand-50 text-brand-700',
        violet: 'border-violet-200/60 bg-violet-50 text-violet-700',
        neutral: 'border-border bg-muted text-muted-foreground',
      },
      shape: { default: '', pill: 'rounded-full' },
    },
    defaultVariants: { variant: 'default', shape: 'default' },
  },
);

/** `dot` adds a small status dot before the label. */
function Badge({ className, variant, shape, dot = false, children, ...props }) {
  return (
    <span className={cn(badgeVariants({ variant, shape }), className)} {...props}>
      {dot && <span className="size-1.5 rounded-full bg-current opacity-80" aria-hidden="true" />}
      {children}
    </span>
  );
}

export { Badge, badgeVariants };
