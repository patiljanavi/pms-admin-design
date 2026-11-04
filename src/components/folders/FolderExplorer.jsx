import { useState } from 'react';
import { FiChevronRight, FiFile, FiFilePlus, FiFolder, FiFolderPlus, FiFolderMinus, FiLock, FiMove, FiEdit3, FiUpload, FiHome } from 'react-icons/fi';
import RowActionsMenu from '../RowActionsMenu';
import { Modal, cx } from '../ui';
import FolderTree from './FolderTree';
import MoveModal from './MoveModal';
import NameModal from './NameModal';
import UploadModal from './UploadModal';
import {
  childrenOf, countItems, fileKind, fileSize, findNode, findPath, insertInto, moveNode, newFile, newFolder, parentIdOf, removeNode, updateNode,
} from '../../data/folderTemplates';

/**
 * File explorer for a folder template.
 * Props: items (tree) · onChange(items)
 * Default (locked) folders can't be renamed, moved or deleted; everything else can, at any depth.
 */
export default function FolderExplorer({ items, onChange }) {
  const [currentId, setCurrentId] = useState(null);           // null = top level
  const [expanded, setExpanded] = useState(() => new Set());
  const [modal, setModal] = useState(null);                   // { kind: 'folder'|'file'|'rename'|'move'|'delete', targetId, nodeId }
  const [toast, setToast] = useState('');
  const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 2400); };

  const current = currentId ? findNode(items, currentId) : null;
  const path = currentId ? findPath(items, currentId) || [] : [];
  const list = [...childrenOf(items, currentId)].sort((a, b) => (a.type === b.type ? 0 : a.type === 'folder' ? -1 : 1));
  const where = (id) => (id ? findNode(items, id)?.name : 'the top level');

  /** Where New folder / New file / Upload start: the folder being viewed, else the first default folder. */
  const defaultTarget = () => currentId ?? items.find((n) => n.type === 'folder')?.id ?? null;
  const open = (id) => {
    setCurrentId(id);
    if (id) setExpanded((s) => new Set([...s, id, ...(findPath(items, id) || []).map((f) => f.id)]));
  };
  const toggle = (id) => setExpanded((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const startUpload = (folderId) => setModal({ kind: 'upload', targetId: folderId });
  const doUpload = (files, target) => {
    onChange(insertInto(items, target, files.map((f) => newFile(f.name, f.size, f.type))));
    open(target);
    setModal(null);
    notify(`Uploaded ${files.length} file${files.length > 1 ? 's' : ''} to ${where(target)}`);
  };

  const menuFor = (n) => {
    const extra = [];
    if (n.type === 'folder') {
      extra.push({ label: 'Open', icon: FiFolder, onClick: () => open(n.id) });
      extra.push({ label: 'New folder', icon: FiFolderPlus, onClick: () => setModal({ kind: 'folder', targetId: n.id }) });
      extra.push({ label: 'New file', icon: FiFilePlus, onClick: () => setModal({ kind: 'file', targetId: n.id }) });
      extra.push({ label: 'Upload file', icon: FiUpload, onClick: () => startUpload(n.id) });
    }
    if (!n.locked) {
      extra.push({ label: 'Rename', icon: FiEdit3, onClick: () => setModal({ kind: 'rename', nodeId: n.id }) });
      extra.push({ label: 'Move', icon: FiMove, onClick: () => setModal({ kind: 'move', nodeId: n.id }) });
    }
    return <RowActionsMenu label={n.name} extra={extra} onDelete={n.locked ? undefined : () => setModal({ kind: 'delete', nodeId: n.id })} />;
  };

  const node = modal?.nodeId ? findNode(items, modal.nodeId) : null;
  const delCount = node?.type === 'folder' ? countItems(node.children) : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)]">
      {/* Left: folder tree */}
      <nav aria-label="Folder tree" className="border-b border-line p-3 lg:border-b-0 lg:border-r">
        <FolderTree items={items} currentId={currentId} expanded={expanded} onToggle={toggle} onOpen={open} />
      </nav>

      {/* Right: toolbar + contents */}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
          <nav aria-label="Folder path" className="flex min-w-0 flex-1 flex-wrap items-center gap-1 text-sm">
            <button type="button" onClick={() => open(null)} className={cx('flex items-center gap-1 rounded px-1.5 py-1 hover:bg-subtle', !currentId && 'font-semibold')}><FiHome aria-hidden="true" /> All folders</button>
            {path.map((f) => (
              <span key={f.id} className="flex items-center gap-1">
                <FiChevronRight className="text-muted" aria-hidden="true" />
                <button type="button" onClick={() => open(f.id)} aria-current={f.id === currentId ? 'page' : undefined} className={cx('max-w-[200px] truncate rounded px-1.5 py-1 hover:bg-subtle', f.id === currentId && 'font-semibold')}>{f.name}</button>
              </span>
            ))}
          </nav>
          <div role="toolbar" aria-label="Folder actions" className="flex flex-wrap gap-2">
            <button type="button" className="btn-secondary min-h-[38px] text-sm" onClick={() => setModal({ kind: 'folder', targetId: defaultTarget() })}><FiFolderPlus aria-hidden="true" /> New folder</button>
            {/* <button type="button" className="btn-secondary min-h-[38px] text-sm" onClick={() => setModal({ kind: 'file', targetId: defaultTarget() })}><FiFilePlus aria-hidden="true" /> New file</button> */}
            <button type="button" className="btn-primary min-h-[38px] text-sm" onClick={() => startUpload(defaultTarget())}><FiUpload aria-hidden="true" /> Upload file</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-sm" aria-label={current ? `Contents of ${current.name}` : 'Top level'}>
            <thead>
              <tr className="bg-subtle text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-2.5 font-semibold">Name</th>
                <th className="w-28 px-3 py-2.5 font-semibold">Type</th>
                <th className="w-28 px-3 py-2.5 font-semibold">Size</th>
                <th className="w-14 px-3 py-2.5"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {list.map((n) => {
                const c = n.type === 'folder' ? countItems(n.children) : null;
                return (
                  <tr key={n.id} className="border-t border-line-soft hover:bg-subtle/60" onDoubleClick={() => n.type === 'folder' && open(n.id)}>
                    <td className="px-4 py-2">
                      {n.type === 'folder' ? (
                        <button type="button" onClick={() => open(n.id)} className="flex items-center gap-2.5 text-left font-semibold hover:text-brand-600 hover:underline">
                          {n.locked ? <FiLock className="flex-none text-muted" aria-hidden="true" /> : <FiFolder className="flex-none text-warning-700" aria-hidden="true" />}{n.name}
                          {n.locked && <span className="rounded bg-subtle px-1.5 py-0.5 text-[11px] font-semibold text-muted no-underline">Default</span>}
                        </button>
                      ) : (
                        <span className="flex items-center gap-2.5"><FiFile className="flex-none text-brand-600" aria-hidden="true" />{n.name}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-muted">{n.type === 'folder' ? 'Folder' : fileKind(n.name)}</td>
                    <td className="px-3 py-2 text-muted">{n.type === 'folder' ? `${c.folders + c.files} item${c.folders + c.files === 1 ? '' : 's'}` : fileSize(n.size)}</td>
                    <td className="px-3 py-2"><div className="flex justify-end">{menuFor(n)}</div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {list.length === 0 && (
            <div className="flex flex-col items-center gap-2 p-10 text-center text-muted">
              <FiFolderMinus size={28} aria-hidden="true" />
              This folder is empty.
              <span className="text-xs">Use New folder, New file or Upload file above.</span>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {modal?.kind === 'folder' && (
        <NameModal title="New folder" label="Folder name" placeholder="e.g. Tax returns" submitLabel="Create folder" items={items} initialTarget={modal.targetId}
          onClose={() => setModal(null)}
          onSave={(name, target) => { onChange(insertInto(items, target, [newFolder(name)])); open(target); setModal(null); notify(`Created folder “${name}” in ${where(target)}`); }} />
      )}
      {/* {modal?.kind === 'file' && (
        <NameModal title="New file" label="File name" placeholder="e.g. Checklist.docx" submitLabel="Create file" items={items} initialTarget={modal.targetId}
          hint="Creates an empty placeholder file. Include the extension, e.g. .pdf or .docx."
          onClose={() => setModal(null)}
          onSave={(name, target) => { onChange(insertInto(items, target, [newFile(name)])); open(target); setModal(null); notify(`Created file “${name}” in ${where(target)}`); }} />
      )} */}
      {modal?.kind === 'upload' && <UploadModal items={items} initialTarget={modal.targetId} onClose={() => setModal(null)} onUpload={doUpload} />}
      {modal?.kind === 'rename' && node && (
        <NameModal title={`Rename ${node.type}`} label={node.type === 'folder' ? 'Folder name' : 'File name'} initial={node.name} submitLabel="Rename"
          siblings={childrenOf(items, parentIdOf(items, node.id))} exceptId={node.id}
          onClose={() => setModal(null)}
          onSave={(name) => { onChange(updateNode(items, node.id, (n) => ({ ...n, name }))); setModal(null); notify(`Renamed to “${name}”`); }} />
      )}
      {modal?.kind === 'move' && node && (
        <MoveModal items={items} nodeId={node.id} onClose={() => setModal(null)}
          onMove={(target) => { onChange(moveNode(items, node.id, target)); setModal(null); notify(`Moved “${node.name}” to ${where(target)}`); }} />
      )}
      {modal?.kind === 'delete' && node && (
        <Modal title={`Delete “${node.name}”?`} onClose={() => setModal(null)}
          footer={<><button type="button" className="btn-secondary" onClick={() => setModal(null)}>Cancel</button><button type="button" className="btn bg-danger-700 text-white hover:bg-[#831E15]" onClick={() => {
            if (currentId && (node.id === currentId || (findPath(items, currentId) || []).some((f) => f.id === node.id))) setCurrentId(parentIdOf(items, node.id));
            onChange(removeNode(items, node.id)); setModal(null); notify(`Deleted “${node.name}”`);
          }}>Delete</button></>}>
          <p className="text-muted">{node.type === 'folder' && delCount.folders + delCount.files > 0
            ? `This also deletes everything inside it (${delCount.folders} folder${delCount.folders === 1 ? '' : 's'}, ${delCount.files} file${delCount.files === 1 ? '' : 's'}).`
            : 'This can’t be undone.'}</p>
        </Modal>
      )}
      {toast && <div role="status" className="fixed left-1/2 top-6 z-[80] -translate-x-1/2 rounded-md bg-ink px-5 py-3 font-semibold text-white">{toast}</div>}
    </div>
  );
}