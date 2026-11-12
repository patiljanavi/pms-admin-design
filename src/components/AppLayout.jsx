import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { QUICK_CREATE } from '../config';
import { cn } from 'lib/utils';
import Header from './Header';
import Sidebar, { MOD } from './Sidebar';
import CommandMenu from './CommandMenu';
import { Modal } from './ui';
import { Sheet, SheetContent, SheetTitle } from './ui/sheet';
import { useOutletContext } from 'react-router-dom';

import { toast } from './ui/sonner';
import AddAccountDrawer from '../pages/Accounts-Contacts/AddAccountDrawer';
import ContactDrawer from '../pages/Accounts-Contacts/ContactDrawer';
import JobDrawer from './workflow/JobDrawer';
import InvoiceDrawer from '../components/invoices/AccountInvoiceDrawer';
const KEY = 'harbor.sidebarCollapsed';

const SHORTCUTS = [
  ['Open command menu', `${MOD} K`],
  ['Toggle sidebar', `${MOD} B`],
  ['New account', 'A'],
  ['New contact', 'C'],
  ['New job', 'J'],
  ['New task', 'T'],
  ['Show shortcuts', '?'],
];

const typing = (el) => el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));

/** Signed-in frame: sidebar · header (breadcrumbs, search, New) · page. */
export default function AppLayout() {
  const { user, signOut } = useAuth();
    const { invoices = [], nextInvoiceNumber, createInvoice, updateInvoice, deleteInvoices, setInvoiceStatus, printInvoice, downloadInvoice } = useData();
   
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { tags, createTag, addAccount } = useData();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [createDrawer, setCreateDrawer] = useState(null); // 'account' | 'contact' | 'job' | null
  const [collapsed, setCollapsed] = useState(() => { try { return localStorage.getItem(KEY) === '1'; } catch { return false; } });

  // Header height is shared as --app-header-h so page-level sticky bars sit right below it.
  const headerRef = useRef(null);
  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return undefined;
    const setVar = () => document.documentElement.style.setProperty('--app-header-h', `${el.offsetHeight}px`);
    setVar();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', setVar);
      return () => window.removeEventListener('resize', setVar);
    }
    const ro = new ResizeObserver(setVar);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);
  useEffect(() => { try { localStorage.setItem(KEY, collapsed ? '1' : '0'); } catch {} }, [collapsed]);

  const create = useCallback((item) => {
    if (item.drawer) setCreateDrawer(item.drawer);
    else if (item.to) navigate(item.to);
  }, [navigate]);

  // Global keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      const k = e.key.toLowerCase();
      if ((e.metaKey || e.ctrlKey) && k === 'k') { e.preventDefault(); setSearchOpen((o) => !o); return; }
      if ((e.metaKey || e.ctrlKey) && k === 'b') { e.preventDefault(); setCollapsed((c) => !c); return; }
      if (e.metaKey || e.ctrlKey || e.altKey || typing(e.target) || document.querySelector('[role="dialog"], [role="menu"]')) return;
      if (e.key === '?') { e.preventDefault(); setShortcutsOpen(true); return; }
      const item = QUICK_CREATE.find((q) => q.shortcut && q.shortcut.toLowerCase() === k);
      if (item) { e.preventDefault(); create(item); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [create]);
    const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 2600); };
  const [toast, setToast] = useState('');

 const save = (form, { send }) => {
    const rec = createDrawer?.invoice ? updateInvoice(form) : createInvoice(form, { send });
    setCreateDrawer(null);
    notify(createDrawer?.invoice ? `Updated ${rec.number}` : `${send ? 'Sent' : 'Saved draft'} ${rec.number}`);
  };
  const logout = () => { signOut(); navigate('/login', { replace: true }); };
  const sidebarProps = { onSignOut: logout, user, onOpenSearch: () => setSearchOpen(true), onShortcuts: () => setShortcutsOpen(true) };

  return (
    <div className="min-h-screen bg-canvas lg:flex">
      {/* Desktop sidebar */}
      <aside className={cn('hidden flex-none border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-out lg:sticky lg:top-0 lg:block lg:h-screen',
        collapsed ? 'w-[60px]' : 'w-[248px]')}>
        <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed((c) => !c)} {...sidebarProps} />
      </aside>

      {/* Phone / tablet sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[280px] max-w-[85%] bg-sidebar p-0 text-sidebar-foreground" aria-describedby={undefined}>
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Sidebar showCollapse={false} onNavigate={() => setMobileOpen(false)} {...sidebarProps} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <div ref={headerRef} className="sticky top-0 z-30">
          <Header onMenu={() => setMobileOpen(true)} menuOpen={mobileOpen} onCreate={create} onOpenSearch={() => setSearchOpen(true)} />
        </div>
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>

      <CommandMenu open={searchOpen} onOpenChange={setSearchOpen} onCreate={create} />

      {shortcutsOpen && (
        <Modal title="Keyboard shortcuts" description="Move around Harbor without leaving the keyboard." onClose={() => setShortcutsOpen(false)} width="max-w-md">
          <ul className="-my-1 divide-y">
            {SHORTCUTS.map(([label, keys]) => (
              <li key={label} className="flex items-center justify-between py-2.5 text-sm">
                <span>{label}</span>
                <span className="flex gap-1">{keys.split(' ').map((k) => <kbd key={k} className="kbd h-6 px-2 text-xs">{k}</kbd>)}</span>
              </li>
            ))}
          </ul>
        </Modal>
      )}

      {/* Drawers opened from "+ New" / ⌘K / shortcuts, on top of whatever page is showing */}
      {createDrawer === 'account' && (
        <AddAccountDrawer tags={tags} onCreateTag={createTag} onClose={() => setCreateDrawer(null)}
          onSave={(form) => { const rec = addAccount(form); setCreateDrawer(null); toast.success(`${rec.name} was added`); }} />
      )}
      {createDrawer === 'contact' && (
        <ContactDrawer contactId="new" onClose={() => setCreateDrawer(null)}
          onDone={(message) => { setCreateDrawer(null); if (message) toast.success(message); }} />
      )}
      {createDrawer === 'job' && (
        <JobDrawer jobId="new" onClose={() => setCreateDrawer(null)}
          onDone={(message) => { setCreateDrawer(null); if (message) toast.success(message); }} />
      )}
      {createDrawer === 'invoice' && (
        <InvoiceDrawer accountId={ null} invoice={createDrawer.invoice || null} nextNumber={nextInvoiceNumber} onClose={() => setCreateDrawer(null)} onSave={save} />
      )}
    </div>
  );
}
