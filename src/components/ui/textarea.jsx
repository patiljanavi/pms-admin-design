import * as React from 'react';
import { cn } from 'lib/utils';

const Textarea = React.forwardRef(({ className, ...props }, ref) => (
  <textarea ref={ref}
    className={cn(
      'flex min-h-[80px] w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-xs transition-[color,box-shadow,border-color] placeholder:text-muted-foreground/70',
      'focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50',
      className,
    )}
    {...props} />
));
Textarea.displayName = 'Textarea';

export { Textarea };
