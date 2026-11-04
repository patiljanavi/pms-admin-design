// import { useEffect, useRef, useState } from 'react';
// import { NavLink, useLocation, useNavigate } from 'react-router-dom';
// import { FiChevronDown, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

// /**
//  * Responsive tab bar for routed tabs (used by Firm Templates and the Account dashboard).
//  * Phones: a dropdown. Tablets/desktop: a scrollable tab row with ‹ › arrows when tabs don't fit.
//  * Props: tabs ([{ to, label, icon }]) · currentTo · navLabel · selectLabel · selectId
//  */
// export default function TabNav({ tabs, currentTo, navLabel, selectLabel, selectId }) {
//   const navigate = useNavigate();
//   const { pathname } = useLocation();
//   const current = tabs.find((t) => t.to === currentTo) || tabs[0];
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
//   // keep the active tab visible when the page changes
//   useEffect(() => {
//     scroller.current?.querySelector('[aria-current="page"]')?.scrollIntoView?.({ block: 'nearest', inline: 'center' });
//     updateArrows();
//   }, [pathname]);

//   const CurrentIcon = current.icon;
//   return (
//     <>
//       {/* Phones: dropdown */}
//       <div className="md:hidden">
//         <label htmlFor={selectId} className="mb-1.5 block text-sm font-semibold">{selectLabel}</label>
//         <div className="relative">
//           {CurrentIcon && <CurrentIcon size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-600" aria-hidden="true" />}
//           <select id={selectId} value={current.to} onChange={(e) => navigate(e.target.value)}
//             className="min-h-[48px] w-full appearance-none rounded-md border border-line-strong bg-surface pl-10 pr-10 font-semibold text-ink shadow-card focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/30">
//             {tabs.map((t) => <option key={t.to} value={t.to}>{t.label}</option>)}
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
//                 className="absolute left-1 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface text-muted shadow-card hover:text-ink"><FiChevronLeft size={18} /></button>
//             </>
//           )}
//           <nav ref={scroller} onScroll={updateArrows} aria-label={navLabel}
//             className="flex gap-1 overflow-x-auto scroll-smooth px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
//             {tabs.map(({ to, label, icon: Icon }) => (
//               <NavLink key={to} to={to} aria-current={to === current.to ? 'page' : undefined}
//                 className={() => [
//                   'group relative flex min-h-[52px] flex-none items-center gap-2 whitespace-nowrap rounded-t-md px-4 text-[15px] font-semibold transition-colors',
//                   'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-600',
//                   to === current.to ? 'text-brand-600' : 'text-muted hover:bg-subtle hover:text-ink',
//                 ].join(' ')}>
//                 {Icon && <Icon size={17} aria-hidden="true" className={to === current.to ? 'text-brand-600' : 'text-muted group-hover:text-ink'} />}
//                 {label}
//                 <span aria-hidden="true" className={`absolute inset-x-3 -bottom-px h-[3px] rounded-t-full transition-colors ${to === current.to ? 'bg-brand-600' : 'bg-transparent group-hover:bg-line-strong'}`} />
//               </NavLink>
//             ))}
//           </nav>
//           {canRight && (
//             <>
//               <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-surface to-transparent" aria-hidden="true" />
//               <button type="button" onClick={() => scrollBy(1)} aria-label="Scroll tabs right"
//                 className="absolute right-1 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface text-muted shadow-card hover:text-ink"><FiChevronRight size={18} /></button>
//             </>
//           )}
//         </div>
//       </div>
//     </>
//   );
// }


import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { FiChevronDown, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { cx } from './ui';

/* ─────────────────────────────────────────────────────────────
   One tab style for the whole app:
   compact item · icon · optional count badge · 3px underline on the active tab.
   TabNav = routed tabs (Firm Templates, Account dashboard).
   SubTabs = in-page child tabs (e.g. account Workflow → Pipelines / Jobs).
   ───────────────────────────────────────────────────────────── */

/** Classes for one tab. */
export const tabItemClass = (active) => cx(
  'relative flex min-h-[44px] flex-none items-center gap-2 whitespace-nowrap px-4 text-sm font-semibold transition-colors',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-600',
  active ? 'text-brand-600' : 'text-muted hover:text-ink',
);

/** Icon + label + count + underline: the inside of every tab. */
function TabInner({ icon: Icon, label, count, active }) {
  return (
    <>
      {Icon && <Icon size={16} aria-hidden="true" />}
      {label}
      {count != null && <span className={cx('rounded-full px-2 text-xs', active ? 'bg-brand-100' : 'bg-subtle')}>{count}</span>}
      {active && <span className="absolute inset-x-2 -bottom-px h-[3px] rounded-t-full bg-brand-600" aria-hidden="true" />}
    </>
  );
}

/** Scroll arrows that appear when the tabs don't fit. */
function useOverflowArrows(dep) {
  const scroller = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const update = () => {
    const el = scroller.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };
  useEffect(() => {
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  // keep the active tab in view when it changes
  useEffect(() => {
    scroller.current?.querySelector('[aria-current="page"], [aria-selected="true"]')?.scrollIntoView?.({ block: 'nearest', inline: 'center' });
    update();
  }, [dep]); // eslint-disable-line react-hooks/exhaustive-deps
  const scrollBy = (dir) => scroller.current?.scrollBy({ left: dir * 240, behavior: 'smooth' });
  const arrows = (
    <>
      {canLeft && (
        <>
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-14 bg-gradient-to-r from-canvas to-transparent" aria-hidden="true" />
          <button type="button" onClick={() => scrollBy(-1)} aria-label="Scroll tabs left"
            className="absolute left-0 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface text-muted shadow-card hover:text-ink"><FiChevronLeft size={18} /></button>
        </>
      )}
      {canRight && (
        <>
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-14 bg-gradient-to-l from-canvas to-transparent" aria-hidden="true" />
          <button type="button" onClick={() => scrollBy(1)} aria-label="Scroll tabs right"
            className="absolute right-0 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface text-muted shadow-card hover:text-ink"><FiChevronRight size={18} /></button>
        </>
      )}
    </>
  );
  return { scroller, update, arrows };
}

/**
 * Routed tabs (used by Firm Templates and the Account dashboard).
 * Phones: a dropdown. Tablets/desktop: the tab row, with ‹ › arrows when tabs don't fit.
 * Props: tabs ([{ to, label, icon, count? }]) · currentTo · navLabel · selectLabel · selectId · actions (optional, right side)
 */
export default function TabNav({ tabs, currentTo, navLabel, selectLabel, selectId, actions }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const current = tabs.find((t) => t.to === currentTo) || tabs[0];
  const { scroller, update, arrows } = useOverflowArrows(pathname);
  const CurrentIcon = current.icon;

  return (
    <>
      {/* Phones: dropdown */}
      <div className="md:hidden">
        <label htmlFor={selectId} className="mb-1.5 block text-sm font-semibold">{selectLabel}</label>
        <div className="relative">
          {CurrentIcon && <CurrentIcon size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-600" aria-hidden="true" />}
          <select id={selectId} value={current.to} onChange={(e) => navigate(e.target.value)}
            className="min-h-[48px] w-full appearance-none rounded-md border border-line-strong bg-surface pl-10 pr-10 font-semibold text-ink shadow-card focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/30">
            {tabs.map((t) => <option key={t.to} value={t.to}>{t.label}{t.count != null ? ` (${t.count})` : ''}</option>)}
          </select>
          <FiChevronDown size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
        </div>
      </div>

      {/* Tablets & desktop: tab row */}
      <div className="relative hidden items-end gap-3 border-b border-line md:flex">
        <div className="relative min-w-0 flex-1">
          {arrows}
          <nav ref={scroller} onScroll={update} aria-label={navLabel}
            className="flex overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {tabs.map(({ to, label, icon, count }) => {
              const active = to === current.to;
              return (
                <NavLink key={to} to={to} aria-current={active ? 'page' : undefined} className={() => tabItemClass(active)}>
                  <TabInner icon={icon} label={label} count={count} active={active} />
                </NavLink>
              );
            })}
          </nav>
        </div>
        {actions && <div className="mb-2 flex flex-none items-center gap-2">{actions}</div>}
      </div>
    </>
  );
}

/**
 * In-page child tabs (no routing): same look as TabNav.
 * Props: tabs ([{ key, label, icon, count? }]) · value · onChange(key) · label (for screen readers) · actions (optional, right side)
 */
export function SubTabs({ tabs, value, onChange, label, actions }) {
  const { scroller, update, arrows } = useOverflowArrows(value);
  const onKeyDown = (e) => {
    const i = tabs.findIndex((t) => t.key === value);
    const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
    if (next == null) return;
    e.preventDefault();
    const t = tabs[(next + tabs.length) % tabs.length];
    onChange(t.key);
    requestAnimationFrame(() => scroller.current?.querySelector(`[data-key="${t.key}"]`)?.focus());
  };
  return (
    <div className="relative flex flex-wrap items-end justify-between gap-3 border-b border-line">
      <div className="relative min-w-0 flex-1">
        {arrows}
        <div ref={scroller} onScroll={update} role="tablist" aria-label={label} onKeyDown={onKeyDown}
          className="flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map(({ key, label: text, icon, count }) => {
            const active = key === value;
            return (
              <button key={key} data-key={key} type="button" role="tab" aria-selected={active} tabIndex={active ? 0 : -1}
                onClick={() => onChange(key)} className={tabItemClass(active)}>
                <TabInner icon={icon} label={text} count={count} active={active} />
              </button>
            );
          })}
        </div>
      </div>
      {actions && <div className="mb-2 flex flex-none items-center gap-2">{actions}</div>}
    </div>
  );
}