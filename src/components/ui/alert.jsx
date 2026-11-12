import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from 'lib/utils';

const alertVariants = cva(
  'relative grid w-full grid-cols-[0_1fr] items-start gap-y-0.5 rounded-lg border px-4 py-3 text-sm has-[>svg]:grid-cols-[16px_1fr] has-[>svg]:gap-x-3 [&>svg]:size-4 [&>svg]:translate-y-0.5',
  {
    variants: {
      variant: {
        default: 'bg-card text-card-foreground',
        info: 'border-brand-100 bg-brand-50 text-brand-800 [&>svg]:text-brand-600',
        success: 'border-success-100 bg-success-50 text-success-700',
        warning: 'border-warning-100 bg-warning-50 text-warning-700',
        destructive: 'border-danger-100 bg-danger-50 text-danger-700',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

const Alert = React.forwardRef(({ className, variant, ...props }, ref) => (
  <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
));
Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('col-start-2 font-medium leading-snug tracking-tight', className)} {...props} />
));
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('col-start-2 text-sm opacity-90 [&_p]:leading-relaxed', className)} {...props} />
));
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription };
