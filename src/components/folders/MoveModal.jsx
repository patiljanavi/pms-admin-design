import { useState } from 'react';
import { FiChevronDown, FiChevronRight, FiFolder, FiHome, FiLock } from 'react-icons/fi';
import { Modal, cx } from '../ui';
import { childrenOf, findNode, findPath, isInside, parentIdOf } from '../../data/folderTemplates';

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
  const row = (f, depth) => {
    const kids = f.children.filter((c) => c.type === 'folder');
    const isOpen = open.has(f.id);
    const disabled = blocked(f);
    return (
      <li key={f.id}>
        <div className="flex items-center" style={{ paddingLeft: depth * 18 }}>
          <button type="button" aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${f.name}`} disabled={!kids.length || disabled}
            onClick={() => setOpen((s) => { const n = new Set(s); if (n.has(f.id)) n.delete(f.id); else n.add(f.id); return n; })}
            className={cx('flex h-8 w-6 items-center justify-center text-muted', (!kids.length || disabled) && 'invisible')}>{isOpen ? <FiChevronDown /> : <FiChevronRight />}</button>
          <button type="button" role="radio" aria-checked={target === f.id} disabled={disabled} onClick={() => pick(f.id)}
            className={cx('flex min-h-[34px] flex-1 items-center gap-2 rounded px-2 text-left text-sm', target === f.id ? 'bg-brand-50 font-semibold text-brand-800' : 'hover:bg-subtle', disabled && 'cursor-not-allowed opacity-40')}>
            {f.locked ? <FiLock className="text-muted" aria-hidden="true" /> : <FiFolder className="text-warning-700" aria-hidden="true" />}{f.name}
          </button>
        </div>
        {isOpen && !disabled && kids.length > 0 && <ul>{kids.map((k) => row(k, depth + 1))}</ul>}
      </li>
    );
  };

  return (
    <Modal title={`Move “${node.name}”`} subtitle="Choose the folder to move it to" onClose={onClose} width="max-w-md"
      footer={<><button type="button" className="btn-secondary" onClick={onClose}>Cancel</button><button type="button" className="btn-primary" disabled={target === undefined || !!error} onClick={() => onMove(target)}>Move here</button></>}>
      <div role="radiogroup" aria-label="Destination folder" className="max-h-[50vh] overflow-y-auto rounded-md border border-line p-2">
        <button type="button" role="radio" aria-checked={target === null} onClick={() => pick(null)}
          className={cx('flex min-h-[34px] w-full items-center gap-2 rounded px-2 text-left text-sm', target === null ? 'bg-brand-50 font-semibold text-brand-800' : 'hover:bg-subtle')}>
          <FiHome aria-hidden="true" /> Top level
        </button>
        <ul>{items.filter((n) => n.type === 'folder').map((f) => row(f, 0))}</ul>
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-danger-700">{error}</p>}
    </Modal>
  );
}
