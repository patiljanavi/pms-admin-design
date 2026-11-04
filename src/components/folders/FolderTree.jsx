import { FiChevronDown, FiChevronRight, FiFolder, FiHome, FiLock } from 'react-icons/fi';
import { cx } from '../ui';

/** Folder tree (folders only). Click to open a folder; ▸ to expand. */
export default function FolderTree({ items, currentId, expanded, onToggle, onOpen }) {
  const row = (f, depth) => {
    const kids = f.children.filter((c) => c.type === 'folder');
    const isOpen = expanded.has(f.id);
    const on = currentId === f.id;
    return (
      <li key={f.id} role="treeitem" aria-expanded={kids.length ? isOpen : undefined} aria-selected={on}>
        <div className={cx('flex items-center rounded', on ? 'bg-brand-50' : 'hover:bg-subtle')} style={{ paddingLeft: depth * 14 }}>
          <button type="button" tabIndex={-1} aria-hidden={!kids.length} onClick={() => onToggle(f.id)} aria-label={kids.length ? `${isOpen ? 'Collapse' : 'Expand'} ${f.name}` : undefined}
            className={cx('flex h-8 w-6 flex-none items-center justify-center text-muted', !kids.length && 'invisible')}>{isOpen ? <FiChevronDown /> : <FiChevronRight />}</button>
          <button type="button" onClick={() => onOpen(f.id)} title={f.name}
            className={cx('flex min-h-[32px] min-w-0 flex-1 items-center gap-2 pr-2 text-left text-sm', on && 'font-semibold text-brand-800')}>
            {f.locked ? <FiLock className="flex-none text-muted" aria-label="Default folder" /> : <FiFolder className="flex-none text-warning-700" aria-hidden="true" />}
            <span className="truncate">{f.name}</span>
          </button>
        </div>
        {isOpen && kids.length > 0 && <ul role="group">{kids.map((k) => row(k, depth + 1))}</ul>}
      </li>
    );
  };
  return (
    <ul role="tree" aria-label="Folders" className="flex flex-col gap-0.5">
      <li role="treeitem" aria-selected={currentId === null}>
        <button type="button" onClick={() => onOpen(null)} className={cx('flex min-h-[34px] w-full items-center gap-2 rounded px-2 text-left text-sm', currentId === null ? 'bg-brand-50 font-semibold text-brand-800' : 'hover:bg-subtle')}>
          <FiHome aria-hidden="true" /> All folders
        </button>
      </li>
      {items.filter((n) => n.type === 'folder').map((f) => row(f, 0))}
    </ul>
  );
}
