import { useState } from 'react';
import { ChevronRight, File, FileArchive, FileImage, FileSpreadsheet, FileText, Folder, FolderLock, House } from 'lucide-react';
import { RadioDot } from '../ui';
import { findPath } from '../../data/folderTemplates';
import { cn } from 'lib/utils';

/* ---------- File-type icons (shared by the explorer, tree and upload dialog) ---------- */
const FILE_TYPES = [
  { exts: ['pdf'], icon: FileText, tone: 'bg-danger-50 text-danger-700' },
  { exts: ['doc', 'docx', 'txt', 'rtf', 'odt'], icon: FileText, tone: 'bg-brand-50 text-brand-700' },
  { exts: ['xls', 'xlsx', 'csv', 'ods', 'numbers'], icon: FileSpreadsheet, tone: 'bg-success-50 text-success-700' },
  { exts: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'svg'], icon: FileImage, tone: 'bg-violet-50 text-violet-700' },
  { exts: ['zip', 'rar', '7z', 'gz'], icon: FileArchive, tone: 'bg-warning-50 text-warning-700' },
];
const typeOf = (name = '') => {
  const ext = name.includes('.') ? name.split('.').pop().toLowerCase() : '';
  return FILE_TYPES.find((t) => t.exts.includes(ext)) || { icon: File, tone: 'bg-muted text-muted-foreground' };
};

/** Coloured file icon picked from the file name's extension. `tile` draws it on a soft square. */
export function FileTypeIcon({ name, tile = false, className }) {
  const { icon: Icon, tone } = typeOf(name);
  if (!tile) return <Icon className={cn('size-4 flex-none', tone.split(' ').find((c) => c.startsWith('text-')), className)} aria-hidden="true" />;
  return (
    <span className={cn('inline-flex size-8 flex-none items-center justify-center rounded-md', tone, className)} aria-hidden="true">
      <Icon className="size-4" />
    </span>
  );
}

/** Folder icon: a lock for default (locked) folders. */
export function FolderGlyph({ locked, className, label }) {
  return locked
    ? <FolderLock className={cn('size-4 flex-none text-muted-foreground', className)} aria-label={label} aria-hidden={label ? undefined : true} />
    : <Folder className={cn('size-4 flex-none fill-warning-100 text-warning-500', className)} aria-hidden="true" />;
}

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

  const optionClass = (on, disabled) => cn(
    'flex h-8 min-w-0 flex-1 items-center gap-2 rounded-md px-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
    on ? 'bg-primary/10 font-medium text-foreground' : 'hover:bg-accent',
    disabled && 'cursor-not-allowed opacity-40 hover:bg-transparent',
  );

  const row = (f, depth) => {
    const kids = f.children.filter((c) => c.type === 'folder');
    const disabled = isDisabled(f);
    const isOpen = open.has(f.id) && !disabled;
    const on = value === f.id;
    return (
      <li key={f.id}>
        <div className="flex items-center" style={{ paddingLeft: depth * 16 }}>
          <button type="button" aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${f.name}`} disabled={!kids.length || disabled} onClick={() => toggle(f.id)}
            className={cn('inline-flex size-6 flex-none items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground', (!kids.length || disabled) && 'invisible')}>
            <ChevronRight className={cn('size-3.5 transition-transform', isOpen && 'rotate-90')} />
          </button>
          <button type="button" role="radio" aria-checked={on} disabled={disabled} onClick={() => onChange(f.id)} className={optionClass(on, disabled)}>
            <RadioDot on={on} />
            <FolderGlyph locked={f.locked} />
            <span className="truncate">{f.name}</span>
          </button>
        </div>
        {isOpen && kids.length > 0 && <ul>{kids.map((k) => row(k, depth + 1))}</ul>}
      </li>
    );
  };

  return (
    <div role="radiogroup" aria-label={label} className={cn('overflow-y-auto rounded-lg border bg-card p-1.5', maxHeight)}>
      {showRoot && (
        <div className="flex items-center">
          <span className="size-6 flex-none" aria-hidden="true" />
          <button type="button" role="radio" aria-checked={value === null} onClick={() => onChange(null)} className={optionClass(value === null, false)}>
            <RadioDot on={value === null} />
            <House className="size-4 flex-none text-muted-foreground" aria-hidden="true" />Top level
          </button>
        </div>
      )}
      <ul>{items.filter((n) => n.type === 'folder').map((f) => row(f, 0))}</ul>
    </div>
  );
}

/** "Client Uploaded Documents › Receipts" (or "Top level"). */
export const pathLabel = (items, id) => (id ? (findPath(items, id) || []).map((f) => f.name).join(' › ') : 'Top level');
