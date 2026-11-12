import { ChevronRight, House } from 'lucide-react';
import { FolderGlyph } from './FolderPicker';
import { cn } from 'lib/utils';

const rowClass = (on) => cn('group flex items-center rounded-md transition-colors', on ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground');

/** Folder tree (folders only). Click to open a folder; ▸ to expand. */
export default function FolderTree({ items, currentId, expanded, onToggle, onOpen }) {
  const row = (f, depth) => {
    const kids = f.children.filter((c) => c.type === 'folder');
    const isOpen = expanded.has(f.id);
    const on = currentId === f.id;
    return (
      <li key={f.id} role="treeitem" aria-expanded={kids.length ? isOpen : undefined} aria-selected={on}>
        <div className={rowClass(on)} style={{ paddingLeft: depth * 14 }}>
          <button type="button" tabIndex={-1} aria-hidden={!kids.length} onClick={() => onToggle(f.id)} aria-label={kids.length ? `${isOpen ? 'Collapse' : 'Expand'} ${f.name}` : undefined}
            className={cn('inline-flex size-6 flex-none items-center justify-center rounded text-muted-foreground hover:text-foreground', !kids.length && 'invisible')}>
            <ChevronRight className={cn('size-3.5 transition-transform', isOpen && 'rotate-90')} />
          </button>
          <button type="button" onClick={() => onOpen(f.id)} title={f.name}
            className={cn('flex h-8 min-w-0 flex-1 items-center gap-2 rounded-md pr-2 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50', on && 'font-medium')}>
            <FolderGlyph locked={f.locked} label={f.locked ? 'Default folder' : undefined} />
            <span className="truncate">{f.name}</span>
          </button>
        </div>
        {isOpen && kids.length > 0 && <ul role="group" className="flex flex-col gap-px">{kids.map((k) => row(k, depth + 1))}</ul>}
      </li>
    );
  };
  return (
    <ul role="tree" aria-label="Folders" className="flex flex-col gap-px">
      <li role="treeitem" aria-selected={currentId === null}>
        <button type="button" onClick={() => onOpen(null)}
          className={cn(rowClass(currentId === null), 'h-8 w-full gap-2 px-2 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50', currentId === null && 'font-medium')}>
          <House className="size-4 flex-none" aria-hidden="true" />All folders
        </button>
      </li>
      {items.filter((n) => n.type === 'folder').map((f) => row(f, 0))}
    </ul>
  );
}
