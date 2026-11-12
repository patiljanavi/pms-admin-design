import { useRef, useState } from 'react';
import { CloudUpload, FolderOpen, X } from 'lucide-react';
import { Modal } from '../ui';
import { Button } from '../ui/button';
import FolderPicker, { FileTypeIcon, pathLabel } from './FolderPicker';
import { childrenOf, fileSize, uniqueName } from '../../data/folderTemplates';
import { cn } from 'lib/utils';

/** Pick where to upload, then choose (or drop) files. Calls onUpload([{ name, size, type }], targetId). */
export default function UploadModal({ items, initialTarget, onUpload, onClose }) {
  const [target, setTarget] = useState(initialTarget);
  const [files, setFiles] = useState([]);
  const [over, setOver] = useState(false);
  const input = useRef(null);
  const add = (list) => setFiles((f) => [...f, ...[...list].map((x) => ({ key: `${x.name}-${x.size}-${Math.random()}`, name: x.name, size: x.size, type: x.type }))]);

  // names after upload in the chosen folder ("W2.pdf" → "W2 (2).pdf" if taken)
  const finalNames = (() => {
    const sib = [...childrenOf(items, target)];
    return files.map((f) => { const n = uniqueName(f.name, sib); sib.push({ name: n }); return n; });
  })();
  const totalSize = files.reduce((n, f) => n + (f.size || 0), 0);

  return (
    <Modal title="Upload files" description="Choose a folder, then add the files to upload." onClose={onClose} width="max-w-lg"
      footer={<>
        {files.length > 0 && <span className="mr-auto text-xs tabular-nums text-muted-foreground">{files.length} file{files.length > 1 ? 's' : ''} · {fileSize(totalSize)}</span>}
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="button" disabled={!files.length} onClick={() => onUpload(files.map((f, i) => ({ ...f, name: finalNames[i] })), target)}>
          {files.length ? `Upload ${files.length} file${files.length > 1 ? 's' : ''}` : 'Upload'}
        </Button>
      </>}>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Upload to</span>
          <FolderPicker items={items} value={target} onChange={setTarget} label="Upload to" maxHeight="max-h-48" />
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <FolderOpen className="size-3.5 flex-none" aria-hidden="true" />Files go to: <span className="truncate font-medium text-foreground" data-testid="upload-to">{pathLabel(items, target)}</span>
          </p>
        </div>

        <div onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
          onDrop={(e) => { e.preventDefault(); setOver(false); add(e.dataTransfer.files); }}
          className={cn('flex flex-col items-center gap-3 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors',
            over ? 'border-primary bg-primary/5' : 'border-line-strong bg-subtle/50 hover:border-muted-foreground/40')}>
          <span className={cn('inline-flex size-11 items-center justify-center rounded-xl border bg-card shadow-card transition-colors', over ? 'text-primary' : 'text-muted-foreground')} aria-hidden="true">
            <CloudUpload className="size-5" />
          </span>
          <div>
            <p className="text-sm font-medium">{over ? 'Drop to add files' : 'Drag and drop files here'}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">PDF, Word, Excel, images and more</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => input.current?.click()}>Browse files</Button>
          <input ref={input} type="file" multiple className="hidden" aria-label="Choose files to upload" onChange={(e) => { add(e.target.files || []); e.target.value = ''; }} />
        </div>

        {files.length > 0 && (
          <ul aria-label="Files to upload" className="flex max-h-48 flex-col divide-y overflow-y-auto rounded-lg border">
            {files.map((f, i) => (
              <li key={f.key} className="flex items-center gap-3 px-3 py-2 text-sm">
                <FileTypeIcon name={f.name} tile />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{finalNames[i]}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {fileSize(f.size)}{finalNames[i] !== f.name && <span className="text-warning-700"> · renamed — “{f.name}” exists</span>}
                  </span>
                </span>
                <Button type="button" variant="ghost" size="icon-xs" onClick={() => setFiles((l) => l.filter((x) => x.key !== f.key))} aria-label={`Remove ${f.name}`}
                  className="text-muted-foreground hover:bg-danger-50 hover:text-danger-700"><X /></Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
