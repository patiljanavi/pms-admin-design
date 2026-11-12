import * as React from 'react';
import { cn } from 'lib/utils';

const Input = React.forwardRef(({ className, type, ...props }, ref) => (
  <input type={type} ref={ref}
    className={cn(
      'flex h-9 w-full min-w-0 rounded-md border border-input bg-card px-3 py-1 text-sm text-foreground shadow-xs transition-[color,box-shadow,border-color]',
      'file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground/70',
      'focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20 focus-visible:ring-offset-0',
      'disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive/20',
      className,
    )}
    {...props} />
));
Input.displayName = 'Input';

export { Input };
