import { useState } from 'react';
import { FiChevronDown, FiChevronRight, FiFolder, FiHome, FiLock } from 'react-icons/fi';
import { cx } from '../ui';
import { findPath } from '../../data/folderTemplates';

/**
 * Choose a folder (or the top level) from the tree.
 * Props: items · value (folder id, null = top level, undefined = none) · onChange(id) · isDisabled(folder) · label · showRoot · expandTo
 * Opens with the tree expanded down to the selected folder (or to `expandTo`).
 */
export default function FolderPicker({ items, value, onChange, isDisabled = () => false, label = 'Folder', showRoot = true, maxHeight = 'max-h-60', expandTo }) {
  const [open, setOpen] = useState(() => {
    const start = expandTo ?? value;
    if (!start) return new Set();
    // open down to the folder, and the folder itself so its subfolders can be picked
    return new Set((findPath(items, start) || []).map((f) => f.id));
  });
  const toggle = (id) => setOpen((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const row = (f, depth) => {
    const kids = f.children.filter((c) => c.type === 'folder');
    const disabled = isDisabled(f);
    const isOpen = open.has(f.id) && !disabled;
    const on = value === f.id;
    return (
      <li key={f.id}>
        <div className="flex items-center" style={{ paddingLeft: depth * 18 }}>
          <button type="button" aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${f.name}`} disabled={!kids.length || disabled} onClick={() => toggle(f.id)}
            className={cx('flex h-8 w-6 flex-none items-center justify-center text-muted', (!kids.length || disabled) && 'invisible')}>{isOpen ? <FiChevronDown /> : <FiChevronRight />}</button>
          <button type="button" role="radio" aria-checked={on} disabled={disabled} onClick={() => onChange(f.id)}
            className={cx('flex min-h-[34px] min-w-0 flex-1 items-center gap-2 rounded px-2 text-left text-sm', on ? 'bg-brand-50 font-semibold text-brand-800 ring-1 ring-brand-600' : 'hover:bg-subtle', disabled && 'cursor-not-allowed opacity-40')}>
            <span className={cx('h-3.5 w-3.5 flex-none rounded-full border-2', on ? 'border-brand-600 bg-brand-600 shadow-[inset_0_0_0_2px_white]' : 'border-line-strong')} aria-hidden="true" />
            {f.locked ? <FiLock className="flex-none text-muted" aria-hidden="true" /> : <FiFolder className="flex-none text-warning-700" aria-hidden="true" />}
            <span className="truncate">{f.name}</span>
          </button>
        </div>
        {isOpen && kids.length > 0 && <ul>{kids.map((k) => row(k, depth + 1))}</ul>}
      </li>
    );
  };

  return (
    <div role="radiogroup" aria-label={label} className={cx('overflow-y-auto rounded-md border border-line p-2', maxHeight)}>
      {showRoot && (
        <button type="button" role="radio" aria-checked={value === null} onClick={() => onChange(null)}
          className={cx('flex min-h-[34px] w-full items-center gap-2 rounded px-2 text-left text-sm', value === null ? 'bg-brand-50 font-semibold text-brand-800 ring-1 ring-brand-600' : 'hover:bg-subtle')}>
          <span className={cx('h-3.5 w-3.5 flex-none rounded-full border-2', value === null ? 'border-brand-600 bg-brand-600 shadow-[inset_0_0_0_2px_white]' : 'border-line-strong')} aria-hidden="true" />
          <FiHome aria-hidden="true" /> Top level
        </button>
      )}
      <ul>{items.filter((n) => n.type === 'folder').map((f) => row(f, 0))}</ul>
    </div>
  );
}

/** "Client Uploaded Documents › Receipts" (or "Top level"). */
export const pathLabel = (items, id) => (id ? (findPath(items, id) || []).map((f) => f.name).join(' › ') : 'Top level');