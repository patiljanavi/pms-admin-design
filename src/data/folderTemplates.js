// Folder templates: a tree of folders and files. The three default folders are always there
// and can't be renamed, deleted or moved (things inside them can).

export const DEFAULT_FOLDERS = ['Client Uploaded Documents', 'Firm Documents Shared with Client', 'Private'];
export const INVALID_NAME = /[\\/:*?"<>|]/;

let seq = 0;
const nid = (p) => `${p}-${Date.now().toString(36)}${(seq += 1).toString(36)}${Math.random().toString(36).slice(2, 5)}`;

export const newFolder = (name, children = [], locked = false) => ({ id: nid('fd'), type: 'folder', name, locked, children });
export const newFile = (name, size = 0, mime = '') => ({ id: nid('fl'), type: 'file', name, size, mime });
/** The three default (locked) folders. */
export const defaultTree = () => DEFAULT_FOLDERS.map((n) => newFolder(n, [], true));
export const emptyFolderTemplate = () => ({ templatename: '', items: defaultTree() });

/* ---------- tree helpers (pure: they return new trees) ---------- */
export function findNode(items, id) {
  for (const n of items) {
    if (n.id === id) return n;
    if (n.type === 'folder') { const f = findNode(n.children, id); if (f) return f; }
  }
  return null;
}
/** Folders from the root down to `id` (inclusive). [] for the root. */
export function findPath(items, id, trail = []) {
  for (const n of items) {
    if (n.id === id) return [...trail, n];
    if (n.type === 'folder') { const p = findPath(n.children, id, [...trail, n]); if (p) return p; }
  }
  return id ? null : [];
}
export const childrenOf = (items, folderId) => (folderId ? findNode(items, folderId)?.children || [] : items);
export const parentIdOf = (items, id) => { const p = findPath(items, id); return p && p.length > 1 ? p[p.length - 2].id : null; };

export const updateNode = (items, id, fn) => items.map((n) => (n.id === id ? fn(n) : n.type === 'folder' ? { ...n, children: updateNode(n.children, id, fn) } : n));
export const removeNode = (items, id) => items.filter((n) => n.id !== id).map((n) => (n.type === 'folder' ? { ...n, children: removeNode(n.children, id) } : n));
/** Add nodes inside a folder (or at the root when folderId is null). */
export const insertInto = (items, folderId, nodes) => (folderId ? updateNode(items, folderId, (f) => ({ ...f, children: [...f.children, ...nodes] })) : [...items, ...nodes]);
/** Is `id` the folder itself or somewhere inside `folder`? (can't move a folder into itself) */
export const isInside = (folder, id) => folder.id === id || (folder.type === 'folder' && folder.children.some((c) => isInside(c, id)));
export function moveNode(items, id, targetFolderId) {
  const node = findNode(items, id);
  if (!node) return items;
  return insertInto(removeNode(items, id), targetFolderId, [node]);
}

/** Folders and files (counted recursively). */
export function countItems(items) {
  return items.reduce((acc, n) => {
    if (n.type === 'folder') { const c = countItems(n.children); return { folders: acc.folders + 1 + c.folders, files: acc.files + c.files }; }
    return { ...acc, files: acc.files + 1 };
  }, { folders: 0, files: 0 });
}

/** Error message for a name, or '' when it's fine. siblings = items in the same folder. */
export function nameError(name, siblings, exceptId) {
  const n = (name || '').trim();
  if (!n) return 'Enter a name.';
  if (n.length > 120) return 'Use 120 characters or fewer.';
  if (INVALID_NAME.test(n)) return 'Names can’t contain \\ / : * ? " < > |';
  if (siblings.some((s) => s.id !== exceptId && s.name.trim().toLowerCase() === n.toLowerCase())) return 'Something with this name already exists in this folder.';
  return '';
}
/** "Report.pdf" → "Report (2).pdf" until the name is free in that folder. */
export function uniqueName(name, siblings) {
  const taken = (n) => siblings.some((s) => s.name.toLowerCase() === n.toLowerCase());
  if (!taken(name)) return name;
  const dot = name.lastIndexOf('.');
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : '';
  let i = 2;
  while (taken(`${base} (${i})${ext}`)) i += 1;
  return `${base} (${i})${ext}`;
}
/** Add a folder template's folders and files into an existing tree (folders with the same name are merged). */
export function mergeFolderTree(target, source) {
  const out = target.map((n) => ({ ...n }));
  source.forEach((s) => {
    const same = out.find((t) => t.type === 'folder' && s.type === 'folder' && t.name.toLowerCase() === s.name.toLowerCase());
    if (same) same.children = mergeFolderTree(same.children, s.children);
    else out.push({ ...JSON.parse(JSON.stringify(s)), name: uniqueName(s.name, out) });
  });
  return out;
}
export const fileKind = (name = '') => {
  const ext = name.includes('.') ? name.split('.').pop().toLowerCase() : '';
  return { pdf: 'PDF', doc: 'Word', docx: 'Word', xls: 'Excel', xlsx: 'Excel', csv: 'CSV', jpg: 'Image', jpeg: 'Image', png: 'Image', txt: 'Text' }[ext] || (ext ? ext.toUpperCase() : 'File');
};
export const fileSize = (b = 0) => (!b ? '—' : b < 1024 ? `${b} B` : b < 1048576 ? `${Math.round(b / 1024)} KB` : `${(b / 1048576).toFixed(1)} MB`);

/* ---------- dummy data ---------- */
const withDefaults = (extra = {}) => DEFAULT_FOLDERS.map((n) => newFolder(n, extra[n] || [], true));
const tpl = (id, templatename, extra, rootExtras = [], updatedAt = '2026-06-01') => ({ id, templatename, items: [...withDefaults(extra), ...rootExtras], updatedAt });

export const seedFolderTemplates = [
  tpl('ft-1', 'Individual tax client', {
    'Client Uploaded Documents': [newFolder('W-2 and 1099 forms'), newFolder('Receipts'), newFolder('Prior year returns')],
    'Firm Documents Shared with Client': [newFolder('Signed returns'), newFile('Engagement letter.pdf', 184320, 'application/pdf')],
    Private: [newFolder('Workpapers'), newFile('Notes.txt', 2048, 'text/plain')],
  }, [], '2026-02-12'),
  tpl('ft-2', 'Small business bookkeeping', {
    'Client Uploaded Documents': [newFolder('Bank statements', [newFolder('Checking'), newFolder('Savings')]), newFolder('Invoices'), newFolder('Receipts')],
    'Firm Documents Shared with Client': [newFolder('Monthly reports'), newFolder('Year-end reports')],
    Private: [newFolder('Reconciliations')],
  }, [], '2026-03-08'),
  tpl('ft-3', 'Payroll client', {
    'Client Uploaded Documents': [newFolder('Timesheets'), newFolder('New hire forms')],
    'Firm Documents Shared with Client': [newFolder('Payroll reports'), newFolder('W-2s')],
  }, [], '2026-04-02'),
  tpl('ft-4', 'Audit engagement', {
    'Client Uploaded Documents': [newFolder('General ledger'), newFolder('Contracts'), newFolder('Fixed assets')],
    'Firm Documents Shared with Client': [newFolder('Management letter'), newFolder('Final statements')],
    Private: [newFolder('Audit workpapers', [newFolder('Planning'), newFolder('Fieldwork'), newFolder('Review')])],
  }, [newFolder('Archive')], '2026-05-15'),
  tpl('ft-5', 'New client onboarding', {
    'Client Uploaded Documents': [newFolder('ID documents'), newFolder('Prior accountant files')],
    'Firm Documents Shared with Client': [newFile('Welcome guide.pdf', 512000, 'application/pdf')],
  }, [], '2026-06-20'),
  tpl('ft-6', 'Basic (defaults only)', {}, [], '2026-07-01'),
];
