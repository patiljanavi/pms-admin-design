// import { useEffect, useState } from 'react';
// import { Outlet, useLocation, useNavigate } from 'react-router-dom';
// import { FiX } from 'react-icons/fi';
// import { useAuth } from '../context/AuthContext';
// import Header from './Header';
// import QuickPanel from './QuickPanel';
// import AddAccountDrawer from './AddAccountDrawer';
// import ContactDrawer from './ContactDrawer';
// import { useData } from '../context/DataContext';
// import Sidebar from './Sidebar';
// import { cx } from './ui';

// const KEY = 'harbor.sidebarCollapsed';

// /** Signed-in frame: sidebar · header (search + New) · page. */
// export default function AppLayout() {
//   const { user, signOut } = useAuth();
//   const navigate = useNavigate();
//   const { pathname } = useLocation();
//   const [mobileOpen, setMobileOpen] = useState(false);
//   const [quickOpen, setQuickOpen] = useState(false);
//   const [createDrawer, setCreateDrawer] = useState(null); // 'account' | 'contact' | null (opened from "+ New")
//   const [toast, setToast] = useState('');
//   const { tags, createTag, addAccount } = useData();
//   const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 2600); };
//   const [collapsed, setCollapsed] = useState(() => { try { return localStorage.getItem(KEY) === '1'; } catch { return false; } });

//   useEffect(() => { setMobileOpen(false); setQuickOpen(false); }, [pathname]);
//   useEffect(() => { try { localStorage.setItem(KEY, collapsed ? '1' : '0'); } catch {} }, [collapsed]);

//   const logout = () => { signOut(); navigate('/login', { replace: true }); };

//   return (
//     <div className="min-h-screen lg:flex">
//       {/* Desktop sidebar */}
//       <aside className={cx('hidden flex-none border-r border-line bg-surface py-6 transition-[width] lg:sticky lg:top-0 lg:block lg:h-screen',
//         collapsed ? 'w-[76px] px-2' : 'w-[260px] px-3')}>
//         <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed((c) => !c)} onSignOut={logout} userEmail={user?.email} />
//       </aside>

//       {/* Phone / tablet slide-in sidebar */}
//       {mobileOpen && (
//         <div className="fixed inset-0 z-40 flex bg-ink/40 lg:hidden" onMouseDown={(e) => e.target === e.currentTarget && setMobileOpen(false)}>
//           <aside className="relative h-full w-[280px] max-w-[85%] bg-surface px-3 py-5 shadow-pop">
//             <button onClick={() => setMobileOpen(false)} aria-label="Close menu" className="absolute right-3 top-4 flex h-9 w-9 items-center justify-center rounded text-muted hover:bg-subtle"><FiX size={20} /></button>
//             <Sidebar showCollapse={false} onNavigate={() => setMobileOpen(false)} onSignOut={logout} userEmail={user?.email} />
//           </aside>
//         </div>
//       )}

//       <div className="flex min-w-0 flex-1 flex-col">
//         <Header onMenu={() => setMobileOpen(true)} menuOpen={mobileOpen} onQuickCreate={() => setQuickOpen((o) => !o)} quickOpen={quickOpen} />
//         <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
//           <Outlet />
//         </main>
//       </div>

//       {quickOpen && <QuickPanel onClose={() => setQuickOpen(false)} sidebarCollapsed={collapsed} onOpenDrawer={setCreateDrawer} />}

//       {/* Drawers opened from "+ New", on top of whatever page is showing */}
//       {createDrawer === 'account' && (
//         <AddAccountDrawer tags={tags} onCreateTag={createTag} onClose={() => setCreateDrawer(null)}
//           onSave={(form) => { const rec = addAccount(form); setCreateDrawer(null); notify(`${rec.name} was added`); }} />
//       )}
//       {createDrawer === 'contact' && (
//         <ContactDrawer contactId="new" onClose={() => setCreateDrawer(null)}
//           onDone={(message) => { setCreateDrawer(null); if (message) notify(message); }} />
//       )}
//       {toast && <div role="status" className="fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-md bg-ink px-5 py-3 font-semibold text-white">{toast}</div>}
//     </div>
//   );
// }
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { FiX } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import Header from './Header';
import QuickPanel from './QuickPanel';
import AddAccountDrawer from '../pages/Accounts-Contacts/AccountDrawer';
import ContactDrawer from '../pages/Accounts-Contacts/ContactDrawer';
import { useData } from '../context/DataContext';
import Sidebar from './Sidebar';
import { cx } from './ui';
import JobDrawer from '../components/workflow/JobDrawer';

const KEY = 'harbor.sidebarCollapsed';

/** Signed-in frame: sidebar · header (search + New) · page. */
export default function AppLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [createDrawer, setCreateDrawer] = useState(null); // 'account' | 'contact' | null (opened from "+ New")
  const [toast, setToast] = useState('');
  const { tags, createTag, addAccount } = useData();
  const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 2600); };
  const [collapsed, setCollapsed] = useState(() => { try { return localStorage.getItem(KEY) === '1'; } catch { return false; } });

  // Main header stays pinned; its height is shared as --app-header-h so
  // page-level sticky bars (like the Firm Templates tabs) sit right below it.
  const headerRef = useRef(null);
  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return;
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

  useEffect(() => { setMobileOpen(false); setQuickOpen(false); }, [pathname]);
  useEffect(() => { try { localStorage.setItem(KEY, collapsed ? '1' : '0'); } catch {} }, [collapsed]);

  const logout = () => { signOut(); navigate('/login', { replace: true }); };

  return (
    <div className="min-h-screen lg:flex">
      {/* Desktop sidebar */}
      <aside className={cx('hidden flex-none border-r border-line bg-surface py-6 transition-[width] lg:sticky lg:top-0 lg:block lg:h-screen',
        collapsed ? 'w-[76px] px-2' : 'w-[260px] px-3')}>
        <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed((c) => !c)} onSignOut={logout} userEmail={user?.email} />
      </aside>

      {/* Phone / tablet slide-in sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex bg-ink/40 lg:hidden" onMouseDown={(e) => e.target === e.currentTarget && setMobileOpen(false)}>
          <aside className="relative h-full w-[280px] max-w-[85%] bg-surface px-3 py-5 shadow-pop">
            <button onClick={() => setMobileOpen(false)} aria-label="Close menu" className="absolute right-3 top-4 flex h-9 w-9 items-center justify-center rounded text-muted hover:bg-subtle"><FiX size={20} /></button>
            <Sidebar showCollapse={false} onNavigate={() => setMobileOpen(false)} onSignOut={logout} userEmail={user?.email} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Main header: pinned to the top on every screen size */}
        <div ref={headerRef} className="sticky top-0 z-30 bg-surface">
          <Header onMenu={() => setMobileOpen(true)} menuOpen={mobileOpen} onQuickCreate={() => setQuickOpen((o) => !o)} quickOpen={quickOpen} />
        </div>
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          <Outlet />
        </main>
      </div>

      {quickOpen && <QuickPanel onClose={() => setQuickOpen(false)} sidebarCollapsed={collapsed} onOpenDrawer={setCreateDrawer} />}

      {/* Drawers opened from "+ New", on top of whatever page is showing */}
      {createDrawer === 'account' && (
        <AddAccountDrawer tags={tags} onCreateTag={createTag} onClose={() => setCreateDrawer(null)}
          onSave={(form) => { const rec = addAccount(form); setCreateDrawer(null); notify(`${rec.name} was added`); }} />
      )}
      {createDrawer === 'contact' && (
        <ContactDrawer contactId="new" onClose={() => setCreateDrawer(null)}
          onDone={(message) => { setCreateDrawer(null); if (message) notify(message); }} />
      )}
      {createDrawer === 'job' && (
        <JobDrawer jobId="new" onClose={() => setCreateDrawer(null)}
          onDone={(message) => { setCreateDrawer(null); if (message) notify(message); }} />
      )}
      {toast && <div role="status" className="fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-md bg-ink px-5 py-3 font-semibold text-white">{toast}</div>}
    </div>
  );
}