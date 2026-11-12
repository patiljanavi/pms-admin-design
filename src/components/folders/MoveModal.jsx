import { useState } from 'react';
import { ChevronRight, CircleAlert, House } from 'lucide-react';
import { Modal, RadioDot } from '../ui';
import { Button } from '../ui/button';
import { FileTypeIcon, FolderGlyph } from './FolderPicker';
import { childrenOf, findNode, findPath, isInside, parentIdOf } from '../../data/folderTemplates';
import { cn } from 'lib/utils';

/** Pick a destination folder for a folder or file. A folder can't go inside itself. */
export default function MoveModal({ items, nodeId, onMove, onClose }) {
  const node = findNode(items, nodeId);
  const fromId = parentIdOf(items, nodeId);
  const [target, setTarget] = useState(undefined);       // undefined = nothing picked, null = root
  // start with the tree open down to where the item is now
  const [open, setOpen] = useState(() => new Set((findPath(items, nodeId) || []).slice(0, -1).map((f) => f.id)));
  const [error, setError] = useState('');
  const blocked = (f) => node.type === 'folder' && isInside(node, f.id);

  const pick = (id) => {
    setTarget(id);
    const clash = childrenOf(items, id).some((s) => s.id !== nodeId && s.name.toLowerCase() === node.name.toLowerCase());
    setError(id === fromId ? 'It’s already in this folder.' : clash ? `“${node.name}” already exists there.` : '');
  };
  const optionClass = (on, disabled) => cn(
    'flex h-8 min-w-0 flex-1 items-center gap-2 rounded-md px-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
    on ? 'bg-primary/10 font-medium text-foreground' : 'hover:bg-accent',
    disabled && 'cursor-not-allowed opacity-40 hover:bg-transparent',
  );
  const row = (f, depth) => {
    const kids = f.children.filter((c) => c.type === 'folder');
    const isOpen = open.has(f.id);
    const disabled = blocked(f);
    return (
      <li key={f.id}>
        <div className="flex items-center" style={{ paddingLeft: depth * 16 }}>
          <button type="button" aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${f.name}`} disabled={!kids.length || disabled}
            onClick={() => setOpen((s) => { const n = new Set(s); if (n.has(f.id)) n.delete(f.id); else n.add(f.id); return n; })}
            className={cn('inline-flex size-6 flex-none items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground', (!kids.length || disabled) && 'invisible')}>
            <ChevronRight className={cn('size-3.5 transition-transform', isOpen && 'rotate-90')} />
          </button>
          <button type="button" role="radio" aria-checked={target === f.id} disabled={disabled} onClick={() => pick(f.id)} className={optionClass(target === f.id, disabled)}>
            <RadioDot on={target === f.id} />
            <FolderGlyph locked={f.locked} />
            <span className="truncate">{f.name}</span>
            {f.id === fromId && <span className="ml-auto flex-none text-xs font-normal text-muted-foreground">Current</span>}
          </button>
        </div>
        {isOpen && !disabled && kids.length > 0 && <ul>{kids.map((k) => row(k, depth + 1))}</ul>}
      </li>
    );
  };

  return (
    <Modal title={`Move “${node.name}”`} description="Choose the folder to move it to." onClose={onClose} width="max-w-md"
      footer={<><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="button" disabled={target === undefined || !!error} onClick={() => onMove(target)}>Move here</Button></>}>
      <div className="mb-3 flex items-center gap-2.5 rounded-lg border bg-subtle px-3 py-2 text-sm">
        {node.type === 'folder' ? <FolderGlyph locked={node.locked} /> : <FileTypeIcon name={node.name} />}
        <span className="min-w-0 flex-1 truncate font-medium">{node.name}</span>
      </div>
      <div role="radiogroup" aria-label="Destination folder" className="max-h-[50vh] overflow-y-auto rounded-lg border bg-card p-1.5">
        <div className="flex items-center">
          <span className="size-6 flex-none" aria-hidden="true" />
          <button type="button" role="radio" aria-checked={target === null} onClick={() => pick(null)} className={optionClass(target === null, false)}>
            <RadioDot on={target === null} />
            <House className="size-4 flex-none text-muted-foreground" aria-hidden="true" />Top level
            {fromId === null && <span className="ml-auto flex-none text-xs font-normal text-muted-foreground">Current</span>}
          </button>
        </div>
        <ul>{items.filter((n) => n.type === 'folder').map((f) => row(f, 0))}</ul>
      </div>
      {error && <p role="alert" className="mt-2 flex items-center gap-1.5 text-xs text-danger-700"><CircleAlert className="size-3.5" aria-hidden="true" />{error}</p>}
    </Modal>
  );
}
