import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CornerDownLeft, FileText, Laptop, Moon, Sun } from 'lucide-react';
import { CONTACTS_PATH, MENU, QUICK_CREATE, accountTabPath } from '../config';
import { useData } from '../context/DataContext';
import { useAppearance } from '../context/AppearanceContext';
import { Avatar, initials } from './ui';
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut,
} from './ui/command';

const LIMIT = 6;

/**
 * ⌘K / Ctrl K command palette: jump to any page, create things, find accounts and contacts,
 * switch theme. Opened from the sidebar search, the header, or the keyboard.
 */
export default function CommandMenu({ open, onOpenChange, onCreate }) {
  const navigate = useNavigate();
  const { accounts = [], contacts = [] } = useData() || {};
  const { setTheme } = useAppearance();
  const [q, setQ] = useState('');
  const term = q.trim().toLowerCase();

  const pages = useMemo(() => MENU.flatMap((m) => (m.submenu.length
    ? m.submenu.map((s) => ({ id: s.id, label: s.label, section: m.label, path: s.path, icon: m.icon }))
    : [{ id: m.id, label: m.label, section: null, path: m.path, icon: m.icon }])), []);

  const accs = useMemo(() => (term
    ? accounts.filter((a) => `${a.name} ${a.company} ${a.email}`.toLowerCase().includes(term)).slice(0, LIMIT)
    : accounts.slice(0, 4)), [accounts, term]);
  const cons = useMemo(() => (term
    ? contacts.filter((c) => `${c.contactName} ${c.firstName} ${c.lastName} ${c.email} ${c.company}`.toLowerCase().includes(term)).slice(0, LIMIT)
    : []), [contacts, term]);

  const run = (fn) => { onOpenChange(false); setQ(''); fn(); };

  return (
    <CommandDialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setQ(''); }}
      commandProps={{ loop: true }}>
      <CommandInput value={q} onValueChange={setQ} placeholder="Search pages, accounts, contacts or type a command…" />
      <CommandList>
        <CommandEmpty>
          <div className="flex flex-col items-center gap-1">
            <span className="font-medium text-foreground">No results for “{q}”</span>
            <span>Try an account name, an email or a page like “Invoices”.</span>
          </div>
        </CommandEmpty>

        {accs.length > 0 && (
          <CommandGroup heading={term ? 'Accounts' : 'Recent accounts'}>
            {accs.map((a) => (
              <CommandItem key={a.id} value={`account ${a.name} ${a.company} ${a.email}`} onSelect={() => run(() => navigate(accountTabPath('overview', a.id)))}>
                <Avatar text={initials(a.name)} size="xs" />
                <span className="truncate font-medium">{a.name}</span>
                <span className="truncate text-muted-foreground">{a.company}</span>
                <CommandShortcut className="tracking-normal">Account</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {cons.length > 0 && (
          <CommandGroup heading="Contacts">
            {cons.map((c) => (
              <CommandItem key={c.id} value={`contact ${c.contactName} ${c.email} ${c.company}`} onSelect={() => run(() => navigate(`${CONTACTS_PATH}?edit=${c.id}`))}>
                <Avatar text={initials(c.contactName || c.email || '?')} size="xs" tone="dark" />
                <span className="truncate font-medium">{c.contactName || c.email}</span>
                <span className="truncate text-muted-foreground">{c.email}</span>
                <CommandShortcut className="tracking-normal">Contact</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandGroup heading="Create">
          {QUICK_CREATE.map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem key={item.id} value={`create new ${item.label}`} onSelect={() => run(() => onCreate(item))}>
                <Icon className="text-muted-foreground" />New {item.label.toLowerCase()}
                {item.shortcut && <CommandShortcut>{item.shortcut}</CommandShortcut>}
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />
        <CommandGroup heading="Go to">
          {pages.map((p) => {
            const Icon = p.icon || FileText;
            return (
              <CommandItem key={p.id} value={`go ${p.section || ''} ${p.label}`} onSelect={() => run(() => navigate(p.path))}>
                <Icon className="text-muted-foreground" />
                {p.section && <><span className="text-muted-foreground">{p.section}</span><ArrowRight className="!size-3 text-muted-foreground/60" /></>}
                <span>{p.label}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />
        <CommandGroup heading="Theme">
          <CommandItem value="theme light" onSelect={() => run(() => setTheme('light'))}><Sun className="text-muted-foreground" />Light theme</CommandItem>
          <CommandItem value="theme dark" onSelect={() => run(() => setTheme('dark'))}><Moon className="text-muted-foreground" />Dark theme</CommandItem>
          <CommandItem value="theme system" onSelect={() => run(() => setTheme('system'))}><Laptop className="text-muted-foreground" />Use system theme</CommandItem>
        </CommandGroup>
      </CommandList>
      <div className="flex items-center justify-between gap-4 border-t bg-subtle px-4 py-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1"><kbd className="kbd">↑</kbd><kbd className="kbd">↓</kbd>navigate</span>
          <span className="flex items-center gap-1"><kbd className="kbd"><CornerDownLeft className="size-3" /></kbd>open</span>
          <span className="flex items-center gap-1"><kbd className="kbd">esc</kbd>close</span>
        </span>
        <span className="hidden sm:inline">Harbor command menu</span>
      </div>
    </CommandDialog>
  );
}
