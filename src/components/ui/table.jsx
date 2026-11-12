import * as React from 'react';
import { cn } from 'lib/utils';

const Table = React.forwardRef(({ className, containerClassName, ...props }, ref) => (
  <div className={cn('relative w-full overflow-x-auto', containerClassName)}>
    <table ref={ref} className={cn('w-full caption-bottom border-collapse text-sm', className)} {...props} />
  </div>
));
Table.displayName = 'Table';

const TableHeader = React.forwardRef(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn('bg-subtle [&_tr]:border-b [&_tr]:hover:bg-transparent', className)} {...props} />
));
TableHeader.displayName = 'TableHeader';

const TableBody = React.forwardRef(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props} />
));
TableBody.displayName = 'TableBody';

const TableFooter = React.forwardRef(({ className, ...props }, ref) => (
  <tfoot ref={ref} className={cn('border-t bg-subtle font-medium [&>tr]:last:border-b-0', className)} {...props} />
));
TableFooter.displayName = 'TableFooter';

const TableRow = React.forwardRef(({ className, ...props }, ref) => (
  <tr ref={ref} className={cn('group/row border-b transition-colors hover:bg-muted/40 data-[state=selected]:bg-primary/[0.04]', className)} {...props} />
));
TableRow.displayName = 'TableRow';

const TableHead = React.forwardRef(({ className, ...props }, ref) => (
  <th ref={ref}
    className={cn('h-10 whitespace-nowrap px-3 text-left align-middle text-xs font-medium text-muted-foreground first:pl-5 last:pr-5 [&:has([role=checkbox])]:w-10', className)}
    {...props} />
));
TableHead.displayName = 'TableHead';

const TableCell = React.forwardRef(({ className, ...props }, ref) => (
  <td ref={ref} className={cn('px-3 py-2.5 align-middle first:pl-5 last:pr-5', className)} {...props} />
));
TableCell.displayName = 'TableCell';

const TableCaption = React.forwardRef(({ className, ...props }, ref) => (
  <caption ref={ref} className={cn('mt-4 text-sm text-muted-foreground', className)} {...props} />
));
TableCaption.displayName = 'TableCaption';

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
