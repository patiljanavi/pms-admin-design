import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiCopy, FiEdit2, FiMoreVertical, FiTrash2 } from 'react-icons/fi';
import { cx } from './ui';

const MENU_WIDTH = 176;

/**
 * ⋮ button that opens a row's action menu: Edit · Duplicate · Delete.
 * Pass only the actions a table supports (e.g. no onDuplicate for Tags).
 * Props: label (row name, for screen readers) · onEdit · onDuplicate · onDelete · extra ([{ label, icon, onClick, danger }])
 * The menu is rendered in a portal, so a table's overflow never cuts it off.
 */
export default function RowActionsMenu({ label, onEdit, onDuplicate, onDelete, extra = [] }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  const items = [
    onEdit && { key: 'edit', label: 'Edit', icon: FiEdit2, onClick: onEdit },
    onDuplicate && { key: 'duplicate', label: 'Duplicate', icon: FiCopy, onClick: onDuplicate },
    ...extra.map((x, i) => ({ key: `x${i}`, ...x })),
    onDelete && { key: 'delete', label: 'Delete', icon: FiTrash2, onClick: onDelete, danger: true, divider: true },
  ].filter(Boolean);

  // Place the menu under the button (or above it when there is no room below)
  const place = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const height = menuRef.current?.offsetHeight || items.length * 40 + 12;
    const below = r.bottom + 4 + height <= window.innerHeight;
    setPos({
      top: below ? r.bottom + 4 : Math.max(8, r.top - height - 4),
      left: Math.min(Math.max(8, r.right - MENU_WIDTH), window.innerWidth - MENU_WIDTH - 8),
    });
  };
  useLayoutEffect(() => { if (open) place(); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => { if (!menuRef.current?.contains(e.target) && !btnRef.current?.contains(e.target)) setOpen(false); };
    const onMove = () => setOpen(false);              // close when the page scrolls or resizes
    document.addEventListener('mousedown', onDoc);
    window.addEventListener('resize', onMove);
    window.addEventListener('scroll', onMove, true);
    menuRef.current?.querySelector('[role="menuitem"]')?.focus();
    return () => {
      document.removeEventListener('mousedown', onDoc);
      window.removeEventListener('resize', onMove);
      window.removeEventListener('scroll', onMove, true);
    };
  }, [open]);

  const close = (focusButton = true) => { setOpen(false); if (focusButton) btnRef.current?.focus(); };
  const run = (item) => { close(false); item.onClick(); };
  const onMenuKey = (e) => {
    const els = [...(menuRef.current?.querySelectorAll('[role="menuitem"]') || [])];
    const i = els.indexOf(document.activeElement);
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); els[(i + 1) % els.length]?.focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); els[(i - 1 + els.length) % els.length]?.focus(); }
    else if (e.key === 'Home') { e.preventDefault(); els[0]?.focus(); }
    else if (e.key === 'End') { e.preventDefault(); els[els.length - 1]?.focus(); }
    else if (e.key === 'Tab') close(false);
  };

  return (
    <>
      <button ref={btnRef} type="button" aria-label={`Actions for ${label}`} aria-haspopup="menu" aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => { if (e.key === 'ArrowDown' && !open) { e.preventDefault(); setOpen(true); } }}
        className={cx('flex h-9 w-9 items-center justify-center rounded text-muted hover:bg-subtle hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600',
          open && 'bg-subtle text-ink')}>
        <FiMoreVertical size={18} aria-hidden="true" />
      </button>
      {open && createPortal(
        <div ref={menuRef} role="menu" aria-label={`Actions for ${label}`} onKeyDown={onMenuKey}
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: MENU_WIDTH }}
          className="z-[70] rounded-md border border-line bg-surface p-1 shadow-pop">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.key}>
                {item.divider && items.length > 1 && <div className="my-1 h-px bg-line" role="separator" />}
                <button type="button" role="menuitem" tabIndex={-1} onClick={() => run(item)}
                  className={cx('flex w-full items-center gap-2.5 rounded px-3 py-2 text-left text-sm font-medium focus:outline-none',
                    item.danger ? 'text-danger-700 hover:bg-danger-50 focus:bg-danger-50' : 'text-ink hover:bg-subtle focus:bg-subtle')}>
                  {Icon && <Icon aria-hidden="true" className="flex-none" />}{item.label}
                </button>
              </div>
            );
          })}
        </div>,
        document.body,
      )}
    </>
  );
}