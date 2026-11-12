import { Copy, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { cn } from 'lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';

/**
 * ⋯ button that opens a row's action menu: Edit · Duplicate · Delete (shadcn DropdownMenu).
 * Pass only the actions a table supports (e.g. no onDuplicate for Tags).
 * Props: label (row name, for screen readers) · onEdit · onDuplicate · onDelete · extra ([{ label, icon, onClick, danger }])
 */
export default function RowActionsMenu({ label, onEdit, onDuplicate, onDelete, extra = [], className }) {
  const items = [
    onEdit && { key: 'edit', label: 'Edit', icon: Pencil, onClick: onEdit, shortcut: 'E' },
    onDuplicate && { key: 'duplicate', label: 'Duplicate', icon: Copy, onClick: onDuplicate },
    ...extra.map((x, i) => ({ key: `x${i}`, ...x })),
  ].filter(Boolean);

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger aria-label={`Actions for ${label}`}
        className={cn('inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 data-[state=open]:bg-accent data-[state=open]:text-foreground', className)}>
        <MoreHorizontal className="size-4" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44" onCloseAutoFocus={(e) => e.preventDefault()}>
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <DropdownMenuItem key={item.key} onSelect={item.onClick} variant={item.danger ? 'destructive' : undefined}>
              {Icon && <Icon className="text-muted-foreground" aria-hidden="true" />}{item.label}
            </DropdownMenuItem>
          );
        })}
        {onDelete && (
          <>
            {items.length > 0 && <DropdownMenuSeparator />}
            <DropdownMenuItem variant="destructive" onSelect={onDelete}><Trash2 aria-hidden="true" />Delete</DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
