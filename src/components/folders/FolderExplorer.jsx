import { useState } from 'react';
import {
  ChevronRight, FilePlus, FolderOpen, FolderPlus, FolderInput, House, LayoutGrid, List, Lock, PencilLine, Trash2, Upload,
} from 'lucide-react';
import RowActionsMenu from '../RowActionsMenu';
import { Modal } from '../ui';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { SimpleTooltip } from '../ui/tooltip';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { EmptyState } from '../page';
import FolderTree from './FolderTree';
import MoveModal from './MoveModal';
import NameModal from './NameModal';
import UploadModal from './UploadModal';
import { FileTypeIcon, FolderGlyph } from './FolderPicker';
import {
  childrenOf, countItems, fileKind, fileSize, findNode, findPath, insertInto, moveNode, newFile, newFolder, parentIdOf, removeNode, updateNode,
} from '../../data/folderTemplates';
import { ToastBridge } from '../ui/sonner';
import { cn } from 'lib/utils';

const itemsLabel = (c) => `${c.folders + c.files} item${c.folders + c.files === 1 ? '' : 's'}`;

/**
 * File explorer for a folder template.
 * Props: items (tree) · onChange(items)
 * Default (locked) folders can't be renamed, moved or deleted; everything else can, at any depth.
 */
export default function FolderExplorer({ items, onChange }) {
  const [currentId, setCurrentId] = useState(null);           // null = top level
  const [expanded, setExpanded] = useState(() => new Set());
  const [modal, setModal] = useState(null);                   // { kind: 'folder'|'file'|'rename'|'move'|'delete', targetId, nodeId }
  const [layout, setLayout] = useState('list');               // 'list' | 'grid' (view only)
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

  const menuFor = (n, className) => {
    const extra = [];
    if (n.type === 'folder') {
      extra.push({ label: 'Open', icon: FolderOpen, onClick: () => open(n.id) });
      extra.push({ label: 'New folder', icon: FolderPlus, onClick: () => setModal({ kind: 'folder', targetId: n.id }) });
      extra.push({ label: 'New file', icon: FilePlus, onClick: () => setModal({ kind: 'file', targetId: n.id }) });
      extra.push({ label: 'Upload file', icon: Upload, onClick: () => startUpload(n.id) });
    }
    if (!n.locked) {
      extra.push({ label: 'Rename', icon: PencilLine, onClick: () => setModal({ kind: 'rename', nodeId: n.id }) });
      extra.push({ label: 'Move', icon: FolderInput, onClick: () => setModal({ kind: 'move', nodeId: n.id }) });
    }
    return <RowActionsMenu label={n.name} className={className} extra={extra} onDelete={n.locked ? undefined : () => setModal({ kind: 'delete', nodeId: n.id })} />;
  };

  const node = modal?.nodeId ? findNode(items, modal.nodeId) : null;
  const delCount = node?.type === 'folder' ? countItems(node.children) : null;
  const crumb = (on) => cn('inline-flex h-7 max-w-[200px] items-center gap-1.5 truncate rounded-md px-2 transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
    on ? 'font-medium text-foreground' : 'text-muted-foreground');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[248px_minmax(0,1fr)]">
      {/* Left: folder tree */}
      <nav aria-label="Folder tree" className="border-b bg-subtle/50 p-2 lg:border-b-0 lg:border-r">
        <div className="px-2 pb-1.5 pt-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Folders</div>
        <FolderTree items={items} currentId={currentId} expanded={expanded} onToggle={toggle} onOpen={open} />
      </nav>

      {/* Right: toolbar + contents */}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2.5 sm:px-4">
          <nav aria-label="Folder path" className="flex min-w-0 flex-1 flex-wrap items-center gap-0.5 text-sm">
            <button type="button" onClick={() => open(null)} className={crumb(!currentId)}><House className="size-3.5 flex-none" aria-hidden="true" />All folders</button>
            {path.map((f) => (
              <span key={f.id} className="flex min-w-0 items-center gap-0.5">
                <ChevronRight className="size-3.5 flex-none text-muted-foreground/60" aria-hidden="true" />
                <button type="button" onClick={() => open(f.id)} aria-current={f.id === currentId ? 'page' : undefined} className={crumb(f.id === currentId)}>{f.name}</button>
              </span>
            ))}
          </nav>
          <div role="toolbar" aria-label="Folder actions" className="flex flex-wrap items-center gap-2">
            <ToggleGroup type="single" value={layout} onValueChange={(v) => v && setLayout(v)} aria-label="Layout" className="h-8">
              <SimpleTooltip label="List view"><ToggleGroupItem value="list" aria-label="List view" className="h-[26px] px-2"><List className="size-4" /></ToggleGroupItem></SimpleTooltip>
              <SimpleTooltip label="Grid view"><ToggleGroupItem value="grid" aria-label="Grid view" className="h-[26px] px-2"><LayoutGrid className="size-4" /></ToggleGroupItem></SimpleTooltip>
            </ToggleGroup>
            <Button type="button" variant="outline" size="sm" onClick={() => setModal({ kind: 'folder', targetId: defaultTarget() })}><FolderPlus />New folder</Button>
            {/* <button type="button" className="btn-secondary min-h-[38px] text-sm" onClick={() => setModal({ kind: 'file', targetId: defaultTarget() })}><FiFilePlus aria-hidden="true" /> New file</button> */}
            <Button type="button" size="sm" onClick={() => startUpload(defaultTarget())}><Upload />Upload</Button>
          </div>
        </div>

        {list.length === 0 ? (
          <div className="p-4 sm:p-6">
            <div className="rounded-xl border-2 border-dashed bg-subtle/40">
              <EmptyState icon={FolderOpen} title={current ? `“${current.name}” is empty` : 'No folders yet'} description="Upload files or create a folder to organise this space."
                action={<><Button size="sm" onClick={() => startUpload(defaultTarget())}><Upload />Upload files</Button>
                  <Button variant="outline" size="sm" onClick={() => setModal({ kind: 'folder', targetId: defaultTarget() })}><FolderPlus />New folder</Button></>} />
            </div>
          </div>
        ) : layout === 'grid' ? (
          <ul aria-label={current ? `Contents of ${current.name}` : 'Top level'} className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 xl:grid-cols-4">
            {list.map((n) => {
              const isFolder = n.type === 'folder';
              const c = isFolder ? countItems(n.children) : null;
              return (
                <li key={n.id} className="group relative" onDoubleClick={() => isFolder && open(n.id)}>
                  <button type="button" onClick={() => isFolder && open(n.id)} disabled={!isFolder}
                    className="flex w-full flex-col items-start gap-3 rounded-lg border bg-card p-3.5 text-left shadow-xs transition-[border-color,box-shadow,background-color] hover:border-line-strong hover:shadow-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-default">
                    {isFolder
                      ? <span className="inline-flex size-10 items-center justify-center rounded-lg bg-warning-50" aria-hidden="true"><FolderGlyph locked={n.locked} className="size-5" /></span>
                      : <FileTypeIcon name={n.name} tile className="size-10 [&_svg]:size-5" />}
                    <span className="w-full min-w-0 pr-6">
                      <span className="block truncate text-sm font-medium text-foreground">{n.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">{isFolder ? itemsLabel(c) : `${fileKind(n.name)} · ${fileSize(n.size)}`}</span>
                    </span>
                  </button>
                  {n.locked && <Badge variant="neutral" className="pointer-events-none absolute left-[3.75rem] top-3.5"><Lock />Default</Badge>}
                  <div className="absolute right-2 top-2">{menuFor(n, 'opacity-70 group-hover:opacity-100 data-[state=open]:opacity-100')}</div>
                </li>
              );
            })}
          </ul>
        ) : (
          <Table className="min-w-[520px]" aria-label={current ? `Contents of ${current.name}` : 'Top level'}>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="w-28">Type</TableHead>
                <TableHead className="w-28">Size</TableHead>
                <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((n) => {
                const c = n.type === 'folder' ? countItems(n.children) : null;
                return (
                  <TableRow key={n.id} onDoubleClick={() => n.type === 'folder' && open(n.id)}>
                    <TableCell className="py-2">
                      {n.type === 'folder' ? (
                        <button type="button" onClick={() => open(n.id)} className="group/name flex min-w-0 items-center gap-2.5 text-left font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
                          <FolderGlyph locked={n.locked} />
                          <span className="truncate underline-offset-4 group-hover/name:underline">{n.name}</span>
                          {n.locked && <Badge variant="neutral">Default</Badge>}
                        </button>
                      ) : (
                        <span className="flex min-w-0 items-center gap-2.5"><FileTypeIcon name={n.name} /><span className="truncate">{n.name}</span></span>
                      )}
                    </TableCell>
                    <TableCell className="py-2 text-muted-foreground">{n.type === 'folder' ? 'Folder' : fileKind(n.name)}</TableCell>
                    <TableCell className="py-2 tabular-nums text-muted-foreground">{n.type === 'folder' ? itemsLabel(c) : fileSize(n.size)}</TableCell>
                    <TableCell className="py-2 text-right">{menuFor(n)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
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
          description={node.type === 'folder' && delCount.folders + delCount.files > 0
            ? `This also deletes everything inside it (${delCount.folders} folder${delCount.folders === 1 ? '' : 's'}, ${delCount.files} file${delCount.files === 1 ? '' : 's'}).`
            : 'This can’t be undone.'}
          footer={<><Button type="button" variant="outline" onClick={() => setModal(null)}>Cancel</Button><Button type="button" variant="destructive" onClick={() => {
            if (currentId && (node.id === currentId || (findPath(items, currentId) || []).some((f) => f.id === node.id))) setCurrentId(parentIdOf(items, node.id));
            onChange(removeNode(items, node.id)); setModal(null); notify(`Deleted “${node.name}”`);
          }}><Trash2 />Delete {node.type}</Button></>}>
          <div className="flex items-center gap-3 rounded-lg border bg-subtle px-3 py-2.5 text-sm">
            {node.type === 'folder' ? <FolderGlyph locked={node.locked} /> : <FileTypeIcon name={node.name} />}
            <span className="min-w-0 flex-1 truncate font-medium">{node.name}</span>
            <span className="text-xs text-muted-foreground">{node.type === 'folder' ? itemsLabel(delCount) : fileSize(node.size)}</span>
          </div>
        </Modal>
      )}
      <ToastBridge message={toast} />
    </div>
  );
}
