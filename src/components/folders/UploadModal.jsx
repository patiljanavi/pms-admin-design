import { useRef, useState } from 'react';
import { FiFile, FiUploadCloud, FiX } from 'react-icons/fi';
import { Modal, cx } from '../ui';
import FolderPicker, { pathLabel } from './FolderPicker';
import { childrenOf, fileSize, uniqueName } from '../../data/folderTemplates';

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

  return (
    <Modal title="Upload files" onClose={onClose} width="max-w-lg"
      footer={<><button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <button type="button" className="btn-primary" disabled={!files.length} onClick={() => onUpload(files.map((f, i) => ({ ...f, name: finalNames[i] })), target)}>
          {files.length ? `Upload ${files.length} file${files.length > 1 ? 's' : ''}` : 'Upload'}
        </button></>}>
      <div className="flex flex-col gap-4">
        <div>
          <span className="mb-1.5 block text-sm font-semibold">Upload to</span>
          <FolderPicker items={items} value={target} onChange={setTarget} label="Upload to" maxHeight="max-h-48" />
          <p className="mt-1.5 text-xs text-muted">Files go to: <span className="font-semibold text-ink" data-testid="upload-to">{pathLabel(items, target)}</span></p>
        </div>

        <div onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
          onDrop={(e) => { e.preventDefault(); setOver(false); add(e.dataTransfer.files); }}
          className={cx('flex flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 text-center', over ? 'border-brand-600 bg-brand-50' : 'border-line-strong')}>
          <FiUploadCloud size={26} className="text-brand-600" aria-hidden="true" />
          <span className="text-sm">Drag files here, or</span>
          <button type="button" className="btn-secondary min-h-[36px] text-sm" onClick={() => input.current?.click()}>Choose files</button>
          <input ref={input} type="file" multiple className="hidden" aria-label="Choose files to upload" onChange={(e) => { add(e.target.files || []); e.target.value = ''; }} />
        </div>

        {files.length > 0 && (
          <ul aria-label="Files to upload" className="flex max-h-48 flex-col gap-1 overflow-y-auto">
            {files.map((f, i) => (
              <li key={f.key} className="flex items-center gap-2.5 rounded-md border border-line px-3 py-2 text-sm">
                <FiFile className="flex-none text-brand-600" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate">{finalNames[i]}{finalNames[i] !== f.name && <span className="ml-1.5 text-xs text-muted">(renamed — “{f.name}” exists)</span>}</span>
                <span className="text-xs text-muted">{fileSize(f.size)}</span>
                <button type="button" onClick={() => setFiles((l) => l.filter((x) => x.key !== f.key))} aria-label={`Remove ${f.name}`} className="flex h-7 w-7 items-center justify-center rounded text-muted hover:bg-danger-50 hover:text-danger-700"><FiX aria-hidden="true" /></button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}