// import { useEffect, useRef, useState } from 'react';
// import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
// import {
//   FiBriefcase, FiCheckSquare, FiChevronDown, FiChevronLeft, FiChevronRight, FiClipboard,
//   FiFileMinus, FiFileText, FiFlag, FiFolder, FiMail, FiMessageSquare,
// } from 'react-icons/fi';

// const TABS = [
//   { to: '/firmtemp/templates/tasks', label: 'Tasks', icon: FiCheckSquare },
//   { to: '/firmtemp/templates/emails', label: 'Emails', icon: FiMail },
//   { to: '/firmtemp/templates/clientfacing', label: 'Client-facing Status', icon: FiFlag },
//   { to: '/firmtemp/templates/jobs', label: 'Jobs', icon: FiBriefcase },
//   { to: '/firmtemp/templates/chats', label: 'Chats', icon: FiMessageSquare },
//   { to: '/firmtemp/templates/folders', label: 'Folders', icon: FiFolder },
//   { to: '/firmtemp/templates/invoices', label: 'Invoices', icon: FiFileText },
//   { to: '/firmtemp/templates/proposals', label: 'Proposals & ELs', icon: FiFileMinus },
//   { to: '/firmtemp/templates/organizers', label: 'Organizers', icon: FiClipboard },
// ];

// export default function FirmTemplatesLayout() {
//   const navigate = useNavigate();
//   const { pathname } = useLocation();
//   const current = TABS.find((t) => pathname.toLowerCase().startsWith(t.to)) || TABS[0];

//   // Tablet / desktop: horizontal scroll with arrows when tabs don't fit
//   const scroller = useRef(null);
//   const [canLeft, setCanLeft] = useState(false);
//   const [canRight, setCanRight] = useState(false);

//   const updateArrows = () => {
//     const el = scroller.current;
//     if (!el) return;
//     setCanLeft(el.scrollLeft > 4);
//     setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
//   };
//   const scrollBy = (dir) => scroller.current?.scrollBy({ left: dir * 240, behavior: 'smooth' });

//   useEffect(() => {
//     updateArrows();
//     window.addEventListener('resize', updateArrows);
//     return () => window.removeEventListener('resize', updateArrows);
//   }, []);

//   // Keep the active tab visible when the page changes
//   useEffect(() => {
//     scroller.current?.querySelector('[aria-current="page"]')?.scrollIntoView?.({ block: 'nearest', inline: 'center' });
//     updateArrows();
//   }, [pathname]);

//   const CurrentIcon = current.icon;

//   // Create / edit pages (e.g. /firmtemp/templates/tasks/new) show without the tab bar
//   const isFormPage = pathname.split('/').filter(Boolean).length > 3;
//   if (isFormPage) return <Outlet />;

//   return (
//     <div className="flex flex-col gap-6">
//       {/* Page header */}
//       <header>
//         <nav aria-label="Breadcrumb" className="text-sm text-muted">Templates <span aria-hidden="true">/</span> Firm Templates</nav>
//         <h1 className="mt-1 text-3xl font-bold">Firm Templates</h1>
//         <p className="mt-1 max-w-[65ch] text-muted">Reusable tasks, emails, jobs, documents and more for your whole team.</p>
//       </header>

//       {/* Phones: dropdown */}
//       <div className="md:hidden">
//         <label htmlFor="template-type" className="mb-1.5 block text-sm font-semibold">Template type</label>
//         <div className="relative">
//           <CurrentIcon size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-600" aria-hidden="true" />
//           <select id="template-type" value={current.to} onChange={(e) => navigate(e.target.value)}
//             className="min-h-[48px] w-full appearance-none rounded-md border border-line-strong bg-surface pl-10 pr-10 font-semibold text-ink shadow-card focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/30">
//             {TABS.map((t) => <option key={t.to} value={t.to}>{t.label}</option>)}
//           </select>
//           <FiChevronDown size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
//         </div>
//       </div>

//       {/* Tablets & desktop: tab bar */}
//       <div className="relative hidden md:block">
//         <div className="relative rounded-t-lg border-b border-line bg-surface">
//           {canLeft && (
//             <>
//               <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-surface to-transparent" aria-hidden="true" />
//               <button type="button" onClick={() => scrollBy(-1)} aria-label="Scroll tabs left"
//                 className="absolute left-1 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface text-muted shadow-card hover:text-ink">
//                 <FiChevronLeft size={18} />
//               </button>
//             </>
//           )}

//           <nav ref={scroller} onScroll={updateArrows} aria-label="Template types"
//             className="flex gap-1 overflow-x-auto scroll-smooth px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
//             {TABS.map(({ to, label, icon: Icon }) => (
//               <NavLink key={to} to={to}
//                 className={({ isActive }) => [
//                   'group relative flex min-h-[52px] flex-none items-center gap-2 whitespace-nowrap rounded-t-md px-4 text-[15px] font-semibold transition-colors',
//                   'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-600',
//                   isActive ? 'text-brand-600' : 'text-muted hover:bg-subtle hover:text-ink',
//                 ].join(' ')}>
//                 {({ isActive }) => (
//                   <>
//                     <Icon size={17} aria-hidden="true" className={isActive ? 'text-brand-600' : 'text-muted group-hover:text-ink'} />
//                     {label}
//                     {/* active indicator */}
//                     <span aria-hidden="true"
//                       className={`absolute inset-x-3 -bottom-px h-[3px] rounded-t-full transition-colors ${isActive ? 'bg-brand-600' : 'bg-transparent group-hover:bg-line-strong'}`} />
//                   </>
//                 )}
//               </NavLink>
//             ))}
//           </nav>

//           {canRight && (
//             <>
//               <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-surface to-transparent" aria-hidden="true" />
//               <button type="button" onClick={() => scrollBy(1)} aria-label="Scroll tabs right"
//                 className="absolute right-1 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface text-muted shadow-card hover:text-ink">
//                 <FiChevronRight size={18} />
//               </button>
//             </>
//           )}
//         </div>
//       </div>

//       {/* The selected tab's page */}
//       <Outlet />
//     </div>
//   );
// }
import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  FiBriefcase, FiCheckSquare, FiChevronDown, FiChevronLeft, FiChevronRight, FiClipboard,
  FiFileMinus, FiFileText, FiFlag, FiFolder, FiMail, FiMessageSquare,
} from 'react-icons/fi';

const TABS = [
  { to: '/firmtemp/templates/tasks', label: 'Tasks', icon: FiCheckSquare },
  { to: '/firmtemp/templates/emails', label: 'Emails', icon: FiMail },
  { to: '/firmtemp/templates/clientfacing', label: 'Client-facing Status', icon: FiFlag },
  { to: '/firmtemp/templates/jobs', label: 'Jobs', icon: FiBriefcase },
  { to: '/firmtemp/templates/chats', label: 'Chats', icon: FiMessageSquare },
  { to: '/firmtemp/templates/folders', label: 'Folders', icon: FiFolder },
  { to: '/firmtemp/templates/invoices', label: 'Invoices', icon: FiFileText },
  { to: '/firmtemp/templates/proposals', label: 'Proposals & ELs', icon: FiFileMinus },
  { to: '/firmtemp/templates/organizers', label: 'Organizers', icon: FiClipboard },
];

// Sticks just below the app's main header. AppLayout measures that header
// and sets --app-header-h on <html>, so this works on every screen size.
const STICKY_TOP = 'top-[var(--app-header-h,0px)]';

export default function FirmTemplatesLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const current = TABS.find((t) => pathname.toLowerCase().startsWith(t.to)) || TABS[0];

  // Tablet / desktop: horizontal scroll with arrows when tabs don't fit
  const scroller = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  // Show a soft shadow under the header only once it is actually stuck
  const sentinel = useRef(null);
  const [isStuck, setIsStuck] = useState(false);

  const updateArrows = () => {
    const el = scroller.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };
  const scrollBy = (dir) => scroller.current?.scrollBy({ left: dir * 240, behavior: 'smooth' });

  useEffect(() => {
    updateArrows();
    window.addEventListener('resize', updateArrows);
    return () => window.removeEventListener('resize', updateArrows);
  }, []);

  // Keep the active tab visible when the page changes (horizontal only, so the page doesn't jump)
  useEffect(() => {
    const el = scroller.current;
    const active = el?.querySelector('[aria-current="page"]');
    if (el && active) {
      const target = active.offsetLeft - (el.clientWidth - active.clientWidth) / 2;
      el.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
    }
    updateArrows();
  }, [pathname]);

  // Detect when the sticky header is pinned
  useEffect(() => {
    const el = sentinel.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const headerH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--app-header-h')) || 0;
    const io = new IntersectionObserver(([entry]) => setIsStuck(!entry.isIntersecting),
      { threshold: 0, rootMargin: `-${Math.round(headerH)}px 0px 0px 0px` });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const CurrentIcon = current.icon;

  // The header and sticky tabs show on every page under this layout,
  // including create / edit pages (e.g. /firmtemp/templates/tasks/new)
  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <header>
        <nav aria-label="Breadcrumb" className="text-sm text-muted">Templates <span aria-hidden="true">/</span> Firm Templates</nav>
        <h1 className="mt-1 text-3xl font-bold">Firm Templates</h1>
        <p className="mt-1 max-w-[65ch] text-muted">Reusable tasks, emails, jobs, documents and more for your whole team.</p>
      </header>

      {/* Invisible marker: when it scrolls out of view, the header below is stuck */}
      <div ref={sentinel} aria-hidden="true" className="-mb-6 h-px" />

      {/* Sticky tab header */}
      <div
        className={[
          'sticky z-20 -mx-4 bg-surface px-4 pt-2 transition-shadow sm:-mx-6 sm:px-6 md:mx-0 md:px-0 md:pt-0',
          STICKY_TOP,
          isStuck ? 'shadow-[0_4px_12px_-6px_rgba(0,0,0,0.15)]' : '',
        ].join(' ')}>

        {/* Phones: dropdown */}
        <div className="pb-3 md:hidden">
          <label htmlFor="template-type" className="mb-1.5 block text-sm font-semibold">Template type</label>
          <div className="relative">
            <CurrentIcon size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-600" aria-hidden="true" />
            <select id="template-type" value={current.to} onChange={(e) => navigate(e.target.value)}
              className="min-h-[48px] w-full appearance-none rounded-md border border-line-strong bg-surface pl-10 pr-10 font-semibold text-ink shadow-card focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/30">
              {TABS.map((t) => <option key={t.to} value={t.to}>{t.label}</option>)}
            </select>
            <FiChevronDown size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
          </div>
        </div>

        {/* Tablets & desktop: tab bar */}
        <div className="relative hidden md:block">
          <div className="relative rounded-t-lg border-b border-line bg-surface">
            {canLeft && (
              <>
                <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-surface to-transparent" aria-hidden="true" />
                <button type="button" onClick={() => scrollBy(-1)} aria-label="Scroll tabs left"
                  className="absolute left-1 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface text-muted shadow-card hover:text-ink">
                  <FiChevronLeft size={18} />
                </button>
              </>
            )}

            <nav ref={scroller} onScroll={updateArrows} aria-label="Template types"
              className="flex gap-1 overflow-x-auto scroll-smooth px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {TABS.map(({ to, label, icon: Icon }) => (
                <NavLink key={to} to={to}
                  className={({ isActive }) => [
                    'group relative flex min-h-[52px] flex-none items-center gap-2 whitespace-nowrap rounded-t-md px-4 text-[15px] font-semibold transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-600',
                    isActive ? 'text-brand-600' : 'text-muted hover:bg-subtle hover:text-ink',
                  ].join(' ')}>
                  {({ isActive }) => (
                    <>
                      <Icon size={17} aria-hidden="true" className={isActive ? 'text-brand-600' : 'text-muted group-hover:text-ink'} />
                      {label}
                      {/* active indicator */}
                      <span aria-hidden="true"
                        className={`absolute inset-x-3 -bottom-px h-[3px] rounded-t-full transition-colors ${isActive ? 'bg-brand-600' : 'bg-transparent group-hover:bg-line-strong'}`} />
                    </>
                  )}
                </NavLink>
              ))}
            </nav>

            {canRight && (
              <>
                <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-surface to-transparent" aria-hidden="true" />
                <button type="button" onClick={() => scrollBy(1)} aria-label="Scroll tabs right"
                  className="absolute right-1 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface text-muted shadow-card hover:text-ink">
                  <FiChevronRight size={18} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* The selected tab's page */}
      <Outlet />
    </div>
  );
}