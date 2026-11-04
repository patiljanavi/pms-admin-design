import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiChevronsLeft, FiChevronsRight, FiPlus, FiX } from 'react-icons/fi';
import { QUICK_CREATE } from '../config';
import { RailTooltip } from './Sidebar';
import { cx } from './ui';

const KEY = 'harbor.quickCollapsed';

function useIsDesktop() {
  const query = '(min-width: 1024px)';
  const [ok, setOk] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const m = window.matchMedia(query);
    const h = () => setOk(m.matches);
    m.addEventListener('change', h);
    return () => m.removeEventListener('change', h);
  }, []);
  return ok;
}

/**
 * Quick create panel, opened by "+ New" in the header.
 * Slides out next to the sidebar; collapses to an icon rail on desktop (remembered on this device).
 */
export default function QuickPanel({ onClose, sidebarCollapsed, onOpenDrawer }) {
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const firstRef = useRef(null);
  const [collapsedPref, setCollapsedPref] = useState(() => { try { return localStorage.getItem(KEY) === '1'; } catch { return false; } });
  const collapsed = isDesktop && collapsedPref;

  useEffect(() => { try { localStorage.setItem(KEY, collapsedPref ? '1' : '0'); } catch {} }, [collapsedPref]);
  useEffect(() => { firstRef.current?.focus(); }, []);
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  const go = (item) => {
    onClose();
    if (item.drawer) onOpenDrawer?.(item.drawer); // Account / Contact: open the drawer right here
    else navigate(item.to);
  };
  const left = !isDesktop ? 'left-0' : sidebarCollapsed ? 'left-[76px]' : 'left-[260px]';
  const width = !isDesktop ? 'w-[300px] max-w-[85%]' : collapsed ? 'w-[72px]' : 'w-[280px]';

  return (
    <>
      <div className="fixed inset-0 z-30 bg-ink/20 lg:bg-transparent" onMouseDown={onClose} aria-hidden="true" />
      <aside aria-label="Quick create" className={cx('fixed bottom-0 top-0 z-40 flex flex-col border-r border-line bg-surface shadow-drawer transition-[width]', left, width)}>
        <div className={cx('flex items-center border-b border-line py-4', collapsed ? 'flex-col gap-2 px-2' : 'gap-2 px-4')}>
          <span className="flex h-8 w-8 flex-none items-center justify-center rounded bg-brand-600 text-white" aria-hidden="true"><FiPlus size={18} /></span>
          {!collapsed && <h2 className="flex-1 text-md font-bold">Create new</h2>}
          {isDesktop && (
            <RailTooltip label={collapsed ? 'Expand panel' : 'Collapse panel'} enabled={collapsed}>
              <button onClick={() => setCollapsedPref((c) => !c)} aria-label={collapsed ? 'Expand panel' : 'Collapse panel'}
                className="flex h-8 w-8 items-center justify-center rounded text-muted hover:bg-subtle">{collapsed ? <FiChevronsRight size={18} /> : <FiChevronsLeft size={18} />}</button>
            </RailTooltip>
          )}
          <RailTooltip label="Close" enabled={collapsed}>
            <button onClick={onClose} aria-label="Close panel" className="flex h-8 w-8 items-center justify-center rounded text-muted hover:bg-subtle"><FiX size={18} /></button>
          </RailTooltip>
        </div>

        <nav aria-label="Create new" className={cx('flex-1 overflow-y-auto', collapsed ? 'p-2' : 'p-3')}>
          <ul className="flex flex-col gap-0.5">
            {QUICK_CREATE.map((item, i) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <RailTooltip label={item.label} enabled={collapsed}>
                    <button ref={i === 0 ? firstRef : undefined} onClick={() => go(item)}
                      className={cx('flex min-h-[44px] w-full items-center gap-3 rounded px-3 text-left font-medium text-ink hover:bg-brand-50 hover:text-brand-600 focus:bg-brand-50', collapsed && 'justify-center px-0')}>
                      <Icon size={19} className="flex-none text-muted" aria-hidden="true" />
                      {collapsed ? <span className="sr-only">New {item.label}</span> : <span className="flex-1">{item.label}</span>}
                      {!collapsed && <FiPlus size={14} className="text-line-strong" aria-hidden="true" />}
                    </button>
                  </RailTooltip>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}
