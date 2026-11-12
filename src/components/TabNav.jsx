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
//           <FiChevronDown size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
//         </div>
//       </div>

//       {/* Tablets & desktop: tab bar */}
//       <div className="relative hidden md:block">
//         <div className="relative rounded-t-lg border-b border-line bg-surface">
//           {canLeft && (
//             <>
//               <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-surface to-transparent" aria-hidden="true" />
//               <button type="button" onClick={() => scrollBy(-1)} aria-label="Scroll tabs left"
//                 className="absolute left-1 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface text-muted-foreground shadow-card hover:text-ink"><FiChevronLeft size={18} /></button>
//             </>
//           )}
//           <nav ref={scroller} onScroll={updateArrows} aria-label={navLabel}
//             className="flex gap-1 overflow-x-auto scroll-smooth px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
//             {tabs.map(({ to, label, icon: Icon }) => (
//               <NavLink key={to} to={to} aria-current={to === current.to ? 'page' : undefined}
//                 className={() => [
//                   'group relative flex min-h-[52px] flex-none items-center gap-2 whitespace-nowrap rounded-t-md px-4 text-[15px] font-semibold transition-colors',
//                   'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-600',
//                   to === current.to ? 'text-brand-600' : 'text-muted-foreground hover:bg-subtle hover:text-ink',
//                 ].join(' ')}>
//                 {Icon && <Icon size={17} aria-hidden="true" className={to === current.to ? 'text-brand-600' : 'text-muted-foreground group-hover:text-ink'} />}
//                 {label}
//                 <span aria-hidden="true" className={`absolute inset-x-3 -bottom-px h-[3px] rounded-t-full transition-colors ${to === current.to ? 'bg-brand-600' : 'bg-transparent group-hover:bg-line-strong'}`} />
//               </NavLink>
//             ))}
//           </nav>
//           {canRight && (
//             <>
//               <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-surface to-transparent" aria-hidden="true" />
//               <button type="button" onClick={() => scrollBy(1)} aria-label="Scroll tabs right"
//                 className="absolute right-1 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface text-muted-foreground shadow-card hover:text-ink"><FiChevronRight size={18} /></button>
//             </>
//           )}
//         </div>
//       </div>
//     </>
//   );
// }


import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from 'lib/utils';

/* ─────────────────────────────────────────────────────────────
   One tab style for the whole app (Linear / Attio style line tabs):
   compact item · icon · optional count pill · 2px underline on the active tab.
   TabNav  = routed tabs (Firm Templates, Account dashboard).
   SubTabs = in-page child tabs (e.g. account Workflow → Pipelines / Jobs).
   ───────────────────────────────────────────────────────────── */

/** Classes for one tab. */
export const tabItemClass = (active) => cn(
  'group relative flex h-10 flex-none items-center gap-2 whitespace-nowrap px-3 text-sm font-medium outline-none transition-colors',
  // soft hover "pill" behind the label, like Linear
  'before:absolute before:inset-x-0.5 before:inset-y-1.5 before:rounded-md before:transition-colors hover:before:bg-accent',
  'focus-visible:before:ring-2 focus-visible:before:ring-ring/50',
  active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
);

/** Icon + label + count + underline: the inside of every tab. */
function TabInner({ icon: Icon, label, count, active }) {
  return (
    <>
      {Icon && <Icon aria-hidden="true" className={cn('relative size-4 flex-none transition-colors', active ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground')} />}
      <span className="relative">{label}</span>
      {count != null && (
        <span className={cn('relative inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1.5 text-[11px] font-medium tabular-nums',
          active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>{count}</span>
      )}
      <span aria-hidden="true" className={cn('absolute inset-x-2 bottom-0 h-0.5 rounded-full transition-colors', active ? 'bg-primary' : 'bg-transparent')} />
    </>
  );
}

const arrowBtn = 'absolute top-1/2 z-20 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md border bg-card text-muted-foreground shadow-xs transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50';

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
          <button type="button" onClick={() => scrollBy(-1)} aria-label="Scroll tabs left" className={cn(arrowBtn, 'left-0')}><ChevronLeft className="size-4" /></button>
        </>
      )}
      {canRight && (
        <>
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-14 bg-gradient-to-l from-canvas to-transparent" aria-hidden="true" />
          <button type="button" onClick={() => scrollBy(1)} aria-label="Scroll tabs right" className={cn(arrowBtn, 'right-0')}><ChevronRight className="size-4" /></button>
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
        <label htmlFor={selectId} className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">{selectLabel}</label>
        <div className="relative">
          {CurrentIcon && <CurrentIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />}
          <select id={selectId} value={current.to} onChange={(e) => navigate(e.target.value)}
            className="h-10 w-full appearance-none rounded-md border border-input bg-card pl-9 pr-9 text-sm font-medium text-foreground shadow-xs transition-[box-shadow,border-color] focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20">
            {tabs.map((t) => <option key={t.to} value={t.to}>{t.label}{t.count != null ? ` (${t.count})` : ''}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        </div>
      </div>

      {/* Tablets & desktop: tab row */}
      <div className="relative hidden items-center gap-3 border-b md:flex">
        <div className="relative min-w-0 flex-1">
          {arrows}
          <nav ref={scroller} onScroll={update} aria-label={navLabel}
            className="isolate flex overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
        {actions && <div className="flex flex-none items-center gap-2 pb-1">{actions}</div>}
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
    <div className="relative flex flex-wrap items-center justify-between gap-3 border-b">
      <div className="relative min-w-0 flex-1">
        {arrows}
        <div ref={scroller} onScroll={update} role="tablist" aria-label={label} onKeyDown={onKeyDown}
          className="isolate flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
      {actions && <div className="flex flex-none items-center gap-2 pb-1">{actions}</div>}
    </div>
  );
}
