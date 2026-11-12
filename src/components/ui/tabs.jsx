import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from 'lib/utils';

const Tabs = TabsPrimitive.Root;

/** variant="pill" (segmented, default shadcn look) or "line" (underlined, for page-level tabs) */
const TabsList = React.forwardRef(({ className, variant = 'pill', ...props }, ref) => (
  <TabsPrimitive.List ref={ref} data-variant={variant}
    className={cn(
      'group/tabs inline-flex items-center text-muted-foreground',
      variant === 'pill' && 'h-9 rounded-lg bg-muted p-[3px]',
      variant === 'line' && 'h-10 w-full justify-start gap-1 overflow-x-auto border-b',
      className,
    )}
    {...props} />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger ref={ref}
    className={cn(
      'inline-flex items-center justify-center gap-1.5 whitespace-nowrap text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4',
      'group-data-[variant=pill]/tabs:h-full group-data-[variant=pill]/tabs:rounded-md group-data-[variant=pill]/tabs:px-3 group-data-[variant=pill]/tabs:data-[state=active]:bg-card group-data-[variant=pill]/tabs:data-[state=active]:text-foreground group-data-[variant=pill]/tabs:data-[state=active]:shadow-xs hover:text-foreground',
      'group-data-[variant=line]/tabs:relative group-data-[variant=line]/tabs:h-10 group-data-[variant=line]/tabs:px-3 group-data-[variant=line]/tabs:after:absolute group-data-[variant=line]/tabs:after:inset-x-2 group-data-[variant=line]/tabs:after:-bottom-px group-data-[variant=line]/tabs:after:h-0.5 group-data-[variant=line]/tabs:after:rounded-full group-data-[variant=line]/tabs:data-[state=active]:text-foreground group-data-[variant=line]/tabs:data-[state=active]:after:bg-primary',
      className,
    )}
    {...props} />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Content ref={ref} className={cn('mt-3 focus-visible:outline-none', className)} {...props} />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
