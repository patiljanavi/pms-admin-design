import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
   ChevronDown, ChevronsUpDown, HelpCircle, Keyboard, LogOut, Monitor, Moon, PanelLeftClose, PanelLeftOpen,
  Search, Sun, UserRound,
  // Check, Settings, Sparkles,
} from 'lucide-react';
import { MENU, MENU_GROUPS, MY_ACCOUNT_PATH } from '../config';
import { useAppearance } from '../context/AppearanceContext';
import { cn } from 'lib/utils';
import { Avatar, initials } from './ui';
import { SimpleTooltip } from './ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup,
  DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubContent,
  DropdownMenuSubTrigger, DropdownMenuTrigger,
} from './ui/dropdown-menu';

/** Kept for older imports: tooltip shown only when `enabled`. */
export function RailTooltip({ label, enabled = true, children }) {
  return <SimpleTooltip label={label} side="right" enabled={enabled}><span className="block">{children}</span></SimpleTooltip>;
}

const same = (a, b) => a.toLowerCase() === b.toLowerCase();
const isUnder = (pathname, path) => same(pathname, path) || pathname.toLowerCase().startsWith(`${path.toLowerCase()}/`);
const groupActive = (pathname, item) => isUnder(pathname, item.path) || item.submenu.some((s) => isUnder(pathname, s.path));

export const isMac = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform || navigator.userAgent);
export const MOD = isMac ? '⌘' : 'Ctrl';

const itemCls = (active, collapsed) => cn(
  'group/item relative flex h-8 w-full items-center gap-2.5 rounded-md px-2 text-sm font-medium outline-none transition-colors',
  'focus-visible:ring-2 focus-visible:ring-ring/50 [&_svg]:size-4 [&_svg]:shrink-0',
  collapsed && 'size-9 justify-center px-0',
  active ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-muted hover:bg-sidebar-accent/70 hover:text-sidebar-foreground',
);

/* ---------- Workspace switcher ---------- */
function WorkspaceSwitcher({ collapsed }) {
  const mark = (
    <span className="relative flex size-7 flex-none items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-800 text-[13px] font-bold text-white shadow-xs ring-1 ring-inset ring-white/15">
      H
    </span>
  );
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={cn('flex w-full items-center gap-2.5 rounded-lg p-1.5 text-left outline-none transition-colors hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-ring/50 data-[state=open]:bg-sidebar-accent', collapsed && 'justify-center')}>
        {mark}
        {!collapsed && (
          <>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-sm font-semibold">Harbor</span>
              {/* <span className="block truncate text-xs text-sidebar-muted">Bennett &amp; Co. CPAs</span> */}
            </span>
            <ChevronsUpDown className="size-4 text-sidebar-muted" />
          </>
        )}
      </DropdownMenuTrigger>
      {/* <DropdownMenuContent align="start" side={collapsed ? 'right' : 'bottom'} className="w-64">
        <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
        <DropdownMenuItem>{mark}<span className="flex-1">Bennett &amp; Co. CPAs</span><Check className="text-primary" /></DropdownMenuItem>
        <DropdownMenuItem>
          <span className="flex size-7 items-center justify-center rounded-lg bg-violet-600 text-[13px] font-bold text-white">N</span>
          <span className="flex-1">Northwind Advisory</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem><Settings />Workspace settings</DropdownMenuItem>
        <DropdownMenuItem><Sparkles />Upgrade plan</DropdownMenuItem>
      </DropdownMenuContent> */}
    </DropdownMenu>
  );
}

/* ---------- User menu ---------- */
function UserMenu({ collapsed, user, onSignOut, onShortcuts }) {
  const navigate = useNavigate();
  const { theme, setTheme } = useAppearance();
  const name = user?.name || user?.email || 'You';
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={cn('flex w-full items-center gap-2.5 rounded-lg p-1.5 text-left outline-none transition-colors hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-ring/50 data-[state=open]:bg-sidebar-accent', collapsed && 'justify-center')}>
        <span className="relative">
          <Avatar text={initials(name)} size="sm" tone="dark" />
          <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-sidebar bg-success-500" aria-hidden="true" />
        </span>
        {!collapsed && (
          <>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-sm font-medium capitalize">{name}</span>
              <span className="block truncate text-xs text-sidebar-muted">{user?.email}</span>
            </span>
            <ChevronsUpDown className="size-4 text-sidebar-muted" />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side={collapsed ? 'right' : 'top'} className="w-60">
        <DropdownMenuLabel className="font-normal">
          <div className="text-sm font-medium capitalize text-foreground">{name}</div>
          <div className="truncate text-xs text-muted-foreground">{user?.email}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={() => navigate(MY_ACCOUNT_PATH)}><UserRound />My account</DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>{theme === 'dark' ? <Moon /> : theme === 'light' ? <Sun /> : <Monitor />}Theme</DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-40">
              <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuItem onSelect={onShortcuts}><Keyboard />Keyboard shortcuts<DropdownMenuShortcut>?</DropdownMenuShortcut></DropdownMenuItem>
          <DropdownMenuItem><HelpCircle />Help &amp; support</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={onSignOut}><LogOut />Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ---------- Nav item with submenu ---------- */
function NavGroup({ item, pathname, open, onOpenChange, onNavigate }) {
  const Icon = item.icon;
  const active = groupActive(pathname, item);
  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <CollapsibleTrigger className={cn(itemCls(false, false), active && 'text-sidebar-foreground')}>
        <Icon aria-hidden="true" className={cn(active && 'text-primary')} />
        <span className="flex-1 truncate text-left">{item.label}</span>
        <ChevronDown className={cn('!size-3.5 opacity-60 transition-transform duration-200', open && 'rotate-180')} aria-hidden="true" />
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
        <ul className="relative ml-[17px] flex flex-col gap-px border-l border-sidebar-border py-1 pl-2.5">
          {item.submenu.map((sub) => {
            const subActive = isUnder(pathname, sub.path);
            return (
              <li key={sub.id} className="relative">
                {subActive && <span className="absolute -left-[11px] top-1.5 h-5 w-px bg-primary" aria-hidden="true" />}
                <NavLink to={sub.path} onClick={onNavigate} aria-current={subActive ? 'page' : undefined}
                  className={cn('flex h-7 items-center rounded-md px-2 text-[13px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50',
                    subActive ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground' : 'text-sidebar-muted hover:bg-sidebar-accent/70 hover:text-sidebar-foreground')}>
                  <span className="truncate">{sub.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}

/** Collapsed rail: a group icon opens a flyout menu with its pages. */
function RailGroup({ item, pathname, onNavigate }) {
  const navigate = useNavigate();
  const Icon = item.icon;
  const active = groupActive(pathname, item);
  return (
    <DropdownMenu>
      <SimpleTooltip label={item.label} side="right">
        <DropdownMenuTrigger className={itemCls(active, true)} aria-label={item.label}>
          <Icon aria-hidden="true" />
        </DropdownMenuTrigger>
      </SimpleTooltip>
      <DropdownMenuContent side="right" align="start" sideOffset={10} className="w-52">
        <DropdownMenuLabel>{item.label}</DropdownMenuLabel>
        {item.submenu.map((sub) => (
          <DropdownMenuItem key={sub.id} onSelect={() => { navigate(sub.path); onNavigate?.(); }}
            className={cn(isUnder(pathname, sub.path) && 'bg-accent font-medium')}>
            {sub.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Sidebar built from MENU / MENU_GROUPS.
 * - Items without a submenu are links; items with one are animated collapsible groups.
 * - `collapsed` shows an icon rail with tooltips and flyout menus.
 */
export default function Sidebar({
  menu = MENU, collapsed = false, onToggleCollapse, onNavigate, onSignOut, user, showCollapse = true, onOpenSearch, onShortcuts,
}) {
  const { pathname } = useLocation();
  const [open, setOpen] = useState({});

  // Open the group that contains the current page whenever the URL changes.
  useEffect(() => {
    const current = menu.find((m) => m.submenu.length && groupActive(pathname, m));
    if (current) setOpen((o) => ({ ...o, [current.id]: true }));
  }, [pathname, menu]);

  const groups = MENU_GROUPS.map((g) => ({ ...g, items: menu.filter((m) => (m.group || 'workspace') === g.id) })).filter((g) => g.items.length);

  return (
    <div className="flex h-full flex-col">
      <div className={cn('flex flex-col gap-2 p-2.5', collapsed && 'items-center')}>
        <WorkspaceSwitcher collapsed={collapsed} />
        {collapsed ? (
          <SimpleTooltip label="Search" shortcut={`${MOD} K`} side="right">
            <button type="button" onClick={onOpenSearch} aria-label="Search" className={itemCls(false, true)}><Search /></button>
          </SimpleTooltip>
        ) : (
          <button type="button" onClick={onOpenSearch}
            className="flex h-8 w-full items-center gap-2 rounded-md border border-sidebar-border bg-card px-2 text-sm text-sidebar-muted shadow-xs transition-colors hover:border-line-strong hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
            <Search className="size-4" />
            <span className="flex-1 text-left">Search…</span>
            <kbd className="kbd">{MOD} K</kbd>
          </button>
        )}
      </div>

      <nav aria-label="Main" className={cn('flex flex-1 flex-col gap-4 overflow-y-auto px-2.5 pb-3 pt-1', collapsed && 'items-center')}>
        {groups.map((g) => (
          <div key={g.id} className={cn('flex flex-col gap-px', collapsed && 'items-center gap-1')}>
            {collapsed
              ? <div className="mx-auto mb-1 h-px w-6 bg-sidebar-border first:hidden" aria-hidden="true" />
              : <div className="mb-1 px-2 text-[11px] font-medium uppercase tracking-wider text-sidebar-muted/80">{g.label}</div>}
            {g.items.map((item) => {
              const Icon = item.icon;
              if (item.submenu.length) {
                return collapsed
                  ? <RailGroup key={item.id} item={item} pathname={pathname} onNavigate={onNavigate} />
                  : <NavGroup key={item.id} item={item} pathname={pathname} open={!!open[item.id]} onNavigate={onNavigate}
                      onOpenChange={(v) => setOpen((o) => ({ ...o, [item.id]: v }))} />;
              }
              const active = groupActive(pathname, item);
              return (
                <SimpleTooltip key={item.id} label={item.label} side="right" enabled={collapsed}>
                  <NavLink to={item.path} onClick={onNavigate} aria-current={active ? 'page' : undefined} className={itemCls(active, collapsed)}>
                    <Icon aria-hidden="true" className={cn(active && 'text-primary')} />
                    {collapsed ? <span className="sr-only">{item.label}</span> : <span className="flex-1 truncate">{item.label}</span>}
                    {item.badge && !collapsed && (
                      <span className="ml-auto rounded-md bg-primary/10 px-1.5 text-[11px] font-semibold tabular-nums text-primary">{item.badge}</span>
                    )}
                    {item.badge && collapsed && <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-primary" aria-hidden="true" />}
                  </NavLink>
                </SimpleTooltip>
              );
            })}
          </div>
        ))}
      </nav>

      {/* {!collapsed && (
        <div className="mx-2.5 mb-2 rounded-lg border border-sidebar-border bg-card p-3 shadow-xs">
          <div className="flex items-center gap-2 text-sm font-medium"><Sparkles className="size-4 text-primary" />Trial · 9 days left</div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full w-[70%] rounded-full bg-primary" /></div>
          <button type="button" className="mt-2.5 text-xs font-medium text-primary hover:underline">Upgrade to Pro</button>
        </div>
      )} */}

      <div className={cn('flex flex-col gap-1 border-t border-sidebar-border p-2.5', collapsed && 'items-center')}>
        {showCollapse && (
          <SimpleTooltip label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} shortcut={`${MOD} B`} side="right">
            <button type="button" onClick={onToggleCollapse} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} className={itemCls(false, collapsed)}>
              {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
              {!collapsed && <span>Collapse</span>}
            </button>
          </SimpleTooltip>
        )}
        <UserMenu collapsed={collapsed} user={user} onSignOut={onSignOut} onShortcuts={onShortcuts} />
      </div>
    </div>
  );
}
