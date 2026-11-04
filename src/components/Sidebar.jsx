import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useLocation } from 'react-router-dom';
import { FiChevronDown, FiChevronsLeft, FiChevronsRight, FiLogOut } from 'react-icons/fi';
import { MENU } from '../config';
import { cx } from './ui';

/**
 * Tooltip for the collapsed sidebar rail.
 * Rendered in a portal with position: fixed, so the sidebar's overflow never clips it.
 * Shows on hover and keyboard focus; Escape hides it. When `enabled` is false it renders children only.
 */
export function RailTooltip({ label, enabled = true, children }) {
  const ref = useRef(null);
  const [pos, setPos] = useState(null);

  if (!enabled) return children;

  const show = () => {
    const r = ref.current?.getBoundingClientRect();
    if (r) setPos({ top: r.top + r.height / 2, left: r.right + 12 });
  };
  const hide = () => setPos(null);

  return (
    <div ref={ref} onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}
      onKeyDown={(e) => e.key === 'Escape' && hide()}>
      {children}
      {pos && createPortal(
        <div aria-hidden="true" style={{ top: pos.top, left: pos.left }}
          className="pointer-events-none fixed z-50 -translate-y-1/2 whitespace-nowrap rounded-md bg-ink px-2.5 py-1.5 text-sm font-medium text-white shadow-pop">
          <span className="absolute -left-1 top-1/2 h-2 w-2 -translate-y-1/2 rotate-45 bg-ink" />
          {label}
        </div>,
        document.body,
      )}
    </div>
  );
}

const same = (a, b) => a.toLowerCase() === b.toLowerCase();
const isUnder = (pathname, path) => same(pathname, path) || pathname.toLowerCase().startsWith(`${path.toLowerCase()}/`);
const groupActive = (pathname, item) => isUnder(pathname, item.path) || item.submenu.some((s) => isUnder(pathname, s.path));

function Brand({ collapsed }) {
  return (
    <div className={cx('flex items-center gap-2.5', collapsed && 'justify-center')}>
      <span className="flex h-8 w-8 flex-none items-center justify-center rounded bg-brand-600 font-bold text-white">H</span>
      {!collapsed && <span className="text-md font-bold">Harbor Admin</span>}
    </div>
  );
}

/**
 * Sidebar built from MENU.
 * - Items without a submenu are links.
 * - Items with a submenu are expandable groups; the group holding the current page opens automatically.
 * - `collapsed` shows icons only (desktop); hovering or focusing an icon shows its label in a tooltip.
 */
export default function Sidebar({ menu = MENU, collapsed = false, onToggleCollapse, onNavigate, onSignOut, userEmail, showCollapse = true }) {
  const { pathname } = useLocation();
  const [open, setOpen] = useState({});

  // Open the group that contains the current page whenever the URL changes.
  useEffect(() => {
    const current = menu.find((m) => m.submenu.length && groupActive(pathname, m));
    if (current) setOpen((o) => ({ ...o, [current.id]: true }));
  }, [pathname, menu]);

  const linkBase = 'flex min-h-[42px] items-center gap-3 rounded px-3 font-medium transition-colors';

  return (
    <div className="flex h-full flex-col gap-5">
      <div className={cx('flex items-center', collapsed ? 'justify-center' : 'justify-between px-2')}>
        <Brand collapsed={collapsed} />
        {showCollapse && !collapsed && (
          <button onClick={onToggleCollapse} aria-label="Collapse sidebar" className="flex h-8 w-8 items-center justify-center rounded text-muted hover:bg-subtle"><FiChevronsLeft size={18} /></button>
        )}
      </div>
      {showCollapse && collapsed && (
        <RailTooltip label="Expand sidebar">
          <button onClick={onToggleCollapse} aria-label="Expand sidebar" className="mx-auto flex h-8 w-8 items-center justify-center rounded text-muted hover:bg-subtle"><FiChevronsRight size={18} /></button>
        </RailTooltip>
      )}

      <nav aria-label="Main" className="-mx-1 flex flex-1 flex-col gap-0.5 overflow-y-auto px-1">
        {menu.map((item) => {
          const Icon = item.icon;
          const active = groupActive(pathname, item);

          if (!item.submenu.length) {
            return (
              <RailTooltip key={item.id} label={item.label} enabled={collapsed}>
                <NavLink to={item.path} onClick={onNavigate}
                  className={cx(linkBase, collapsed && 'justify-center px-0',
                    active ? 'bg-brand-100 font-semibold text-brand-600' : 'text-muted hover:bg-subtle hover:text-ink')}
                  aria-current={active ? 'page' : undefined}>
                  <Icon size={19} className="flex-none" aria-hidden="true" />
                  {collapsed ? <span className="sr-only">{item.label}</span> : <span className="truncate">{item.label}</span>}
                </NavLink>
              </RailTooltip>
            );
          }

          // Collapsed rail: the group icon links to the group's main page.
          if (collapsed) {
            return (
              <RailTooltip key={item.id} label={item.label}>
                <NavLink to={item.submenu[0]?.path || item.path} onClick={onNavigate}
                  className={cx(linkBase, 'justify-center px-0', active ? 'bg-brand-100 text-brand-600' : 'text-muted hover:bg-subtle hover:text-ink')}>
                  <Icon size={19} aria-hidden="true" />
                  <span className="sr-only">{item.label}</span>
                </NavLink>
              </RailTooltip>
            );
          }

          const isOpen = !!open[item.id];
          const panelId = `submenu-${item.id}`;
          return (
            <div key={item.id}>
              <button type="button" onClick={() => setOpen((o) => ({ ...o, [item.id]: !isOpen }))} aria-expanded={isOpen} aria-controls={panelId}
                className={cx(linkBase, 'w-full text-left', active ? 'font-semibold text-ink' : 'text-muted hover:bg-subtle hover:text-ink')}>
                <Icon size={19} className={cx('flex-none', active && 'text-brand-600')} aria-hidden="true" />
                <span className="flex-1 truncate">{item.label}</span>
                <FiChevronDown size={16} aria-hidden="true" className={cx('flex-none transition-transform', isOpen && 'rotate-180')} />
              </button>
              {isOpen && (
                <ul id={panelId} className="ml-[21px] mt-0.5 flex flex-col gap-0.5 border-l border-line pl-2.5">
                  {item.submenu.map((sub) => {
                    const SubIcon = sub.icon;
                    const subActive = isUnder(pathname, sub.path);
                    return (
                      <li key={sub.id}>
                        <NavLink to={sub.path} onClick={onNavigate} aria-current={subActive ? 'page' : undefined}
                          className={cx('flex min-h-[38px] items-center gap-2.5 rounded px-2.5 text-[13px]',
                            subActive ? 'bg-brand-100 font-semibold text-brand-600' : 'text-muted hover:bg-subtle hover:text-ink')}>
                          <SubIcon size={10} className={cx('flex-none', subActive ? 'text-brand-600' : 'text-line-strong')} aria-hidden="true" />
                          <span className="truncate">{sub.label}</span>
                        </NavLink>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-line pt-4">
        {!collapsed && userEmail && <div className="truncate px-3 text-sm text-muted">{userEmail}</div>}
        <RailTooltip label="Sign out" enabled={collapsed}>
          <button onClick={onSignOut}
            className={cx(linkBase, 'mt-2 w-full font-semibold text-danger-700 hover:bg-danger-50', collapsed && 'justify-center px-0')}>
            <FiLogOut size={18} aria-hidden="true" />{!collapsed ? 'Sign out' : <span className="sr-only">Sign out</span>}
          </button>
        </RailTooltip>
      </div>
    </div>
  );
}
