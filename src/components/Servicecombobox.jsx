import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiCheck, FiEdit3, FiPlus } from 'react-icons/fi';
import { cx } from './ui';
import { money } from '../data/invoiceTemplates';

/**
 * Item field for a line item: type to search services, pick one, keep what you typed as a custom item,
 * or create a new service with that name.
 * Props: label · value (item name) · serviceId · services · categories
 *        onType(text)          – typing (makes it a custom item)
 *        onPickService(svc)    – a service was chosen
 *        onCreateService(name) – "+ Create service “name”"
 */
export default function ServiceCombobox({ label, value, serviceId, services = [], categories = [], onType, onPickService, onCreateService, invalid }) {
  const id = useId();
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 320 });
  const q = (value || '').trim().toLowerCase();

  // Options: matching services (grouped by category), then "custom item" and "create service"
  const options = useMemo(() => {
    const matches = services.filter((s) => !q || serviceId || `${s.name} ${s.description || ''}`.toLowerCase().includes(q));
    const catName = (cid) => categories.find((c) => c.id === cid)?.name || 'Other services';
    const list = [...matches].sort((a, b) => catName(a.categoryId).localeCompare(catName(b.categoryId)) || a.name.localeCompare(b.name))
      .map((s) => ({ kind: 'service', key: s.id, service: s, group: catName(s.categoryId) }));
    const exact = services.some((s) => s.name.trim().toLowerCase() === q);
    if (q && !serviceId) list.push({ kind: 'custom', key: '__custom__', text: value.trim() });
    if (q && !exact) list.push({ kind: 'create', key: '__create__', text: value.trim() });
    return list;
  }, [services, categories, q, value, serviceId]);

  const place = () => {
    const r = inputRef.current?.getBoundingClientRect();
    if (!r) return;
    const width = Math.max(r.width, 320);
    const height = Math.min(listRef.current?.offsetHeight || 280, 300);
    const below = r.bottom + 4 + height <= window.innerHeight;
    setPos({ top: below ? r.bottom + 4 : Math.max(8, r.top - height - 4), left: Math.min(r.left, window.innerWidth - width - 8), width });
  };
  useLayoutEffect(() => { if (open) place(); }, [open, options.length]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setActive(0); }, [q]);
  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => { if (!inputRef.current?.contains(e.target) && !listRef.current?.contains(e.target)) setOpen(false); };
    const onMove = (e) => { if (!listRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    window.addEventListener('resize', onMove);
    window.addEventListener('scroll', onMove, true);
    return () => { document.removeEventListener('mousedown', onDoc); window.removeEventListener('resize', onMove); window.removeEventListener('scroll', onMove, true); };
  }, [open]);

  const choose = (opt) => {
    if (!opt) return;
    if (opt.kind === 'service') onPickService(opt.service);
    if (opt.kind === 'create') onCreateService(opt.text);
    // 'custom' keeps the typed text as it is
    setOpen(false);
  };
  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); if (!open) setOpen(true); else setActive((i) => Math.min(options.length - 1, i + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(0, i - 1)); }
    else if (e.key === 'Enter') { if (open && options[active]) { e.preventDefault(); choose(options[active]); } }
    else if (e.key === 'Escape' && open) { e.preventDefault(); e.stopPropagation(); setOpen(false); }
    else if (e.key === 'Tab') setOpen(false);
  };

  let lastGroup = null;
  return (
    <>
      <input ref={inputRef} role="combobox" aria-label={label} aria-expanded={open} aria-controls={`${id}-list`} aria-autocomplete="list"
        aria-activedescendant={open && options[active] ? `${id}-opt-${active}` : undefined}
        value={value} placeholder="Type a service or item name" onKeyDown={onKeyDown}
        onFocus={() => setOpen(true)} onClick={() => setOpen(true)}
        onChange={(e) => { onType(e.target.value); setOpen(true); }}
        className={cx('min-h-[38px] w-full rounded border bg-surface px-2.5 text-sm font-semibold focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/30',
          invalid ? 'border-danger-700' : 'border-line-strong')} />
      {open && options.length > 0 && createPortal(
        <ul ref={listRef} id={`${id}-list`} role="listbox" aria-label={`${label} suggestions`}
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width }}
          className="z-[70] max-h-[300px] overflow-y-auto rounded-md border border-line bg-surface p-1 shadow-pop">
          {options.map((opt, i) => {
            const header = opt.kind === 'service' && opt.group !== lastGroup ? opt.group : null;
            if (opt.kind === 'service') lastGroup = opt.group;
            const isActive = i === active;
            return (
              <li key={opt.key} role="presentation">
                {header && <div className="px-2.5 pb-0.5 pt-2 text-[11px] font-bold uppercase tracking-wide text-muted">{header}</div>}
                <div id={`${id}-opt-${i}`} role="option" aria-selected={isActive} onMouseDown={(e) => e.preventDefault()} onClick={() => choose(opt)} onMouseEnter={() => setActive(i)}
                  className={cx('flex cursor-pointer items-center gap-2 rounded px-2.5 py-2 text-sm', isActive && 'bg-subtle', opt.kind !== 'service' && 'border-t border-line-soft')}>
                  {opt.kind === 'service' && (<>
                    <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{opt.service.name}</span>{opt.service.description && <span className="block truncate text-xs text-muted">{opt.service.description}</span>}</span>
                    <span className="flex-none text-xs font-semibold text-muted">{money(opt.service.rate)}</span>
                    {opt.service.id === serviceId && <FiCheck className="flex-none text-brand-600" aria-hidden="true" />}
                  </>)}
                  {opt.kind === 'custom' && <><FiEdit3 className="flex-none text-muted" aria-hidden="true" /><span className="truncate">{`Use “${opt.text}” as a custom item`}</span></>}
                  {opt.kind === 'create' && <><FiPlus className="flex-none text-brand-600" aria-hidden="true" /><span className="truncate font-semibold text-brand-600">{`Create service “${opt.text}”`}</span></>}
                </div>
              </li>
            );
          })}
        </ul>,
        document.body,
      )}
    </>
  );
}