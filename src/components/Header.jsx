import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, CheckCheck, ChevronDown, CircleDollarSign, FileCheck2, Menu, MessageSquare, Moon, Plus, Search, Sun, UserPlus } from 'lucide-react';
import { ACCOUNT_DASH_PATH, ACCOUNT_TABS, ACCOUNTS_PATH, MENU, QUICK_CREATE } from '../config';
import { useAppearance } from '../context/AppearanceContext';
import { useData } from '../context/DataContext';
import { cn } from 'lib/utils';
import { Button } from './ui/button';
import { SimpleTooltip } from './ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from './ui/breadcrumb';
import { MOD } from './Sidebar';

const lower = (s) => s.toLowerCase();
const under = (pathname, path) => lower(pathname) === lower(path) || lower(pathname).startsWith(`${lower(path)}/`);

/** Section › Page (› record) from the current URL, using the sidebar menu. */
function useCrumbs() {
  const { pathname } = useLocation();
  const { accounts = [] } = useData() || {};
  return useMemo(() => {
    if (under(pathname, ACCOUNT_DASH_PATH)) {
      const [, tab, id] = pathname.slice(ACCOUNT_DASH_PATH.length).split('/');
      const acc = accounts.find((a) => String(a.id) === id);
      return [
        { label: 'Clients' }, { label: 'Accounts', to: ACCOUNTS_PATH },
        { label: acc?.name || 'Account', to: acc ? `${ACCOUNT_DASH_PATH}/overview/${acc.id}` : undefined },
        { label: ACCOUNT_TABS.find((t) => t.key === tab)?.label || 'Overview' },
      ];
    }
    let best = null;
    MENU.forEach((m) => {
      const cands = m.submenu.length ? m.submenu.map((s) => ({ ...s, section: m })) : [{ ...m, section: null }];
      cands.forEach((c) => { if (under(pathname, c.path) && (!best || c.path.length > best.path.length)) best = c; });
    });
    if (!best) return [];
    const crumbs = best.section ? [{ label: best.section.label }, { label: best.label, to: best.path }] : [{ label: best.label, to: best.path }];
    // Extra segments: words become crumbs ("tasks" → Tasks), "new" → New, ids → Details
    let to = best.path;
    pathname.slice(best.path.length).split('/').filter(Boolean).forEach((seg) => {
      to += `/${seg}`;
      const word = decodeURIComponent(seg);
      const label = word === 'new' ? 'New' : /\d/.test(word) || word.length > 24 ? 'Details' : word.charAt(0).toUpperCase() + word.slice(1).replace(/[-_]/g, ' ');
      crumbs.push({ label, to });
    });
    return crumbs;
  }, [pathname, accounts]);
}

const NOTIFICATIONS = [
  { id: 1, icon: CircleDollarSign, tone: 'text-success-700 bg-success-50', title: 'Invoice INV-2041 was paid', body: 'Bennett Group · $1,240.00', time: '4m', unread: true },
  { id: 2, icon: FileCheck2, tone: 'text-brand-700 bg-brand-50', title: 'Proposal signed', body: 'Northwind Traders accepted “2026 Tax Package”', time: '1h', unread: true },
  { id: 3, icon: MessageSquare, tone: 'text-violet-700 bg-violet-50', title: 'New message from Ava Thompson', body: '“Uploaded the Q3 bank statements…”', time: '3h', unread: true },
  { id: 4, icon: UserPlus, tone: 'text-warning-700 bg-warning-50', title: 'Leila Nasser joined the team', body: 'Tax specialist', time: 'Yesterday', unread: false },
];

function Notifications() {
  const [items, setItems] = useState(NOTIFICATIONS);
  const unread = items.filter((n) => n.unread).length;
  return (
    <Popover>
      <SimpleTooltip label="Notifications" side="bottom">
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}>
            <Bell />
            {unread > 0 && <span className="absolute right-2 top-2 size-2 rounded-full bg-danger-600 ring-2 ring-card" aria-hidden="true" />}
          </Button>
        </PopoverTrigger>
      </SimpleTooltip>
      <PopoverContent align="end" className="w-[380px] p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Notifications</span>
            {unread > 0 && <span className="rounded-md bg-primary/10 px-1.5 text-xs font-semibold text-primary">{unread} new</span>}
          </div>
          <button type="button" onClick={() => setItems((l) => l.map((n) => ({ ...n, unread: false })))}
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-50" disabled={!unread}>
            <CheckCheck className="size-3.5" />Mark all read
          </button>
        </div>
        <ul className="max-h-[360px] divide-y overflow-y-auto">
          {items.map((n) => {
            const Icon = n.icon;
            return (
              <li key={n.id}>
                <button type="button" onClick={() => setItems((l) => l.map((x) => (x.id === n.id ? { ...x, unread: false } : x)))}
                  className="flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50">
                  <span className={cn('flex size-8 flex-none items-center justify-center rounded-lg', n.tone)}><Icon className="size-4" /></span>
                  <span className="min-w-0 flex-1">
                    <span className={cn('block text-sm', n.unread ? 'font-semibold' : 'font-medium text-muted-foreground')}>{n.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">{n.body}</span>
                  </span>
                  <span className="flex flex-none flex-col items-end gap-1.5">
                    <span className="text-xs text-muted-foreground">{n.time}</span>
                    {n.unread && <span className="size-2 rounded-full bg-primary" aria-label="Unread" />}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="border-t p-1.5">
          <Button variant="ghost" size="sm" className="w-full text-muted-foreground">View all activity</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** Top bar: (menu on phones) · breadcrumbs · search · notifications · theme · + New */
export default function Header({ onMenu, menuOpen, onCreate, onOpenSearch }) {
  const crumbs = useCrumbs();
  const { resolvedTheme, toggleTheme } = useAppearance();

  return (
    <header className="flex h-14 items-center gap-2 border-b bg-card/80 px-3 backdrop-blur-md supports-[backdrop-filter]:bg-card/70 sm:px-5 lg:px-6">
      <Button variant="ghost" size="icon" onClick={onMenu} aria-label="Open menu" aria-expanded={menuOpen} className="lg:hidden"><Menu /></Button>

      <Breadcrumb className="min-w-0 flex-1">
        <BreadcrumbList className="flex-nowrap">
          {crumbs.map((c, i) => {
            const last = i === crumbs.length - 1;
            return (
              <span key={`${c.label}-${i}`} className={cn('contents', !last && i < crumbs.length - 2 && 'max-sm:hidden')}>
                {i > 0 && <BreadcrumbSeparator className={cn(i < crumbs.length - 1 && 'max-sm:hidden')} />}
                <BreadcrumbItem className="min-w-0">
                  {last ? <BreadcrumbPage className="truncate">{c.label}</BreadcrumbPage>
                    : c.to ? <BreadcrumbLink asChild><Link to={c.to} className="truncate">{c.label}</Link></BreadcrumbLink>
                      : <span className="truncate">{c.label}</span>}
                </BreadcrumbItem>
              </span>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-none items-center gap-1">
        <button type="button" onClick={onOpenSearch}
          className="hidden h-8 w-56 items-center gap-2 rounded-md border bg-card px-2.5 text-sm text-muted-foreground shadow-xs transition-colors hover:border-line-strong hover:text-foreground md:flex xl:w-72">
          <Search className="size-4" /><span className="flex-1 text-left">Search…</span><kbd className="kbd">{MOD} K</kbd>
        </button>
        <Button variant="ghost" size="icon" className="text-muted-foreground md:hidden" onClick={onOpenSearch} aria-label="Search"><Search /></Button>

        <Notifications />

        <SimpleTooltip label={resolvedTheme === 'dark' ? 'Light mode' : 'Dark mode'} side="bottom">
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle colour theme" className="text-muted-foreground hover:text-foreground">
            {resolvedTheme === 'dark' ? <Sun /> : <Moon />}
          </Button>
        </SimpleTooltip>

        <div className="mx-1 hidden h-5 w-px bg-border sm:block" aria-hidden="true" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="gap-1 pl-2.5 pr-2" aria-label="Create new">
              <Plus /><span className="hidden sm:inline">New</span><ChevronDown className="!size-3.5 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Create new</DropdownMenuLabel>
            {QUICK_CREATE.map((item) => {
              const Icon = item.icon;
              return (
                <DropdownMenuItem key={item.id} onSelect={() => onCreate(item)}>
                  <Icon className="text-muted-foreground" />{item.label}
                  {item.shortcut && <DropdownMenuShortcut>{item.shortcut}</DropdownMenuShortcut>}
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-xs text-muted-foreground">Tip: press <kbd className="kbd">{MOD} K</kbd> for everything</div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
