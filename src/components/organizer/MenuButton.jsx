import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { cn } from 'lib/utils';

/**
 * A button that opens a menu of choices (shadcn DropdownMenu). The menu renders in a portal above
 * everything — also inside drawers and dialogs — and flips above the button when there's no room below.
 * Props: label (button content) · items ([{ label, onClick, icon?, description? }] or strings) · onPick(label, item)
 *        menuLabel · className · menuWidth · align ('left' | 'right') · buttonProps
 */
export default function MenuButton({ label, items, onPick, menuLabel, className, menuWidth = 240, align = 'left', buttonProps = {} }) {
  const list = items.map((it) => (typeof it === 'string' ? { label: it } : it));
  const pick = (item) => (item.onClick || onPick)?.(item.label, item);

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button type="button" className={className} {...buttonProps}>{label}</button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align === 'right' ? 'end' : 'start'} collisionPadding={8} aria-label={menuLabel}
        style={{ width: menuWidth }}
        className="pointer-events-auto z-[120] max-h-[min(360px,var(--radix-dropdown-menu-content-available-height))] overflow-y-auto">
        {menuLabel && <><DropdownMenuLabel>{menuLabel}</DropdownMenuLabel><DropdownMenuSeparator /></>}
        {list.map((item) => {
          const Icon = item.icon;
          return (
            <DropdownMenuItem key={item.label} onSelect={() => pick(item)} className={cn(item.description && 'items-start py-2')}>
              {Icon && (
                <span className="inline-flex size-6 flex-none items-center justify-center rounded-md border bg-subtle text-muted-foreground [&_svg]:!size-3.5" aria-hidden="true">
                  <Icon />
                </span>
              )}
              <span className="flex min-w-0 flex-col">
                <span className="truncate">{item.label}</span>
                {item.description && <span className="truncate text-xs text-muted-foreground">{item.description}</span>}
              </span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
