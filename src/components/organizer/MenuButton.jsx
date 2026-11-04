import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * A button that opens a menu of choices. The menu is rendered in a portal (above everything),
 * so a card's overflow never cuts it off. It opens below the button, or above when there's no room.
 * Props: label (button content) · items ([{ label, onClick }] or strings) · onPick(item) · menuLabel · className · menuWidth · align ('left' | 'right')
 */
export default function MenuButton({ label, items, onPick, menuLabel, className, menuWidth = 240, align = 'left', buttonProps = {} }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, maxHeight: 320 });
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const list = items.map((it) => (typeof it === 'string' ? { label: it } : it));

  const place = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const wanted = Math.min(menuRef.current?.scrollHeight || list.length * 40 + 8, 360);
    const below = window.innerHeight - r.bottom - 8;
    const above = r.top - 8;
    const openDown = below >= wanted || below >= above;
    const maxHeight = Math.max(160, Math.min(360, openDown ? below - 4 : above - 4));
    const height = Math.min(wanted, maxHeight);
    const left = align === 'right' ? r.right - menuWidth : r.left;
    setPos({
      top: openDown ? r.bottom + 4 : r.top - height - 4,
      left: Math.min(Math.max(8, left), window.innerWidth - menuWidth - 8),
      maxHeight,
    });
  };
  useLayoutEffect(() => { if (open) place(); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => { if (!menuRef.current?.contains(e.target) && !btnRef.current?.contains(e.target)) setOpen(false); };
    const onMove = (e) => { if (!menuRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    window.addEventListener('resize', onMove);
    window.addEventListener('scroll', onMove, true);
    menuRef.current?.querySelector('[role="menuitem"]')?.focus();
    return () => { document.removeEventListener('mousedown', onDoc); window.removeEventListener('resize', onMove); window.removeEventListener('scroll', onMove, true); };
  }, [open]);

  const close = (focusButton = true) => { setOpen(false); if (focusButton) btnRef.current?.focus(); };
  const pick = (item) => { close(false); (item.onClick || onPick)?.(item.label, item); };
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
      <button ref={btnRef} type="button" aria-haspopup="menu" aria-expanded={open} className={className} {...buttonProps}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => { if (e.key === 'ArrowDown' && !open) { e.preventDefault(); setOpen(true); } }}>
        {label}
      </button>
      {open && createPortal(
        <ul ref={menuRef} role="menu" aria-label={menuLabel} onKeyDown={onMenuKey}
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: menuWidth, maxHeight: pos.maxHeight }}
          className="z-[70] overflow-y-auto rounded-md border border-line bg-surface p-1 shadow-pop">
          {list.map((item) => (
            <li key={item.label} role="none">
              <button type="button" role="menuitem" tabIndex={-1} onClick={() => pick(item)}
                className="w-full rounded px-3 py-2 text-left text-sm hover:bg-subtle focus:bg-brand-50 focus:outline-none">{item.label}</button>
            </li>
          ))}
        </ul>,
        document.body,
      )}
    </>
  );
}