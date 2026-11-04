import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiCopy, FiDownload, FiSearch, FiTrash2 } from 'react-icons/fi';
import RowActionsMenu from '../../../components/RowActionsMenu';
import Pagination, { usePagination } from '../../../components/Pagination';
import {
  BulkBar, HeaderCheckbox, SelectCheckbox, SelectedOnlyFilter, barButton, barDanger, downloadCsv, useSelection,
} from '../../../components/TableSelection';
import { Modal, cx } from '../../../components/ui';
import { useData } from '../../../context/DataContext';
import { countItems } from '../../../data/folderTemplates';

const LIST_PATH = '/firmtemp/templates/folders';
const fmtDate = (d) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—');

/** Firm Templates → Folders: table of folder templates. New / Edit open FolderTemplateForm. */
export default function FolderTemplates() {
  const navigate = useNavigate();
  const { state: routeState, pathname } = useLocation();
  const { folderTemplates = [], duplicateFolderTemplates, deleteFolderTemplates, pipelines = [] } = useData();

  // pipelines whose "Apply folder template" automation uses each template
  const usedIn = useMemo(() => {
    const m = new Map();
    pipelines.forEach((p) => {
      const ids = new Set(p.stages.flatMap((s) => (s.automations || []).filter((a) => a.type === 'Apply folder template').map((a) => String(a.selectedtemp))));
      ids.forEach((id) => m.set(id, [...(m.get(id) || []), p.pipelineName]));
    });
    return m;
  }, [pipelines]);

  const [q, setQ] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [toast, setToast] = useState('');
  const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 2600); };
  useEffect(() => {
    if (routeState?.toast) { notify(routeState.toast); navigate(pathname, { replace: true, state: null }); }
  }, [routeState]); // eslint-disable-line react-hooks/exhaustive-deps

  const selection = useSelection();
  const [selectedOnly, setSelectedOnly] = useState(false);
  useEffect(() => { if (selection.count === 0) setSelectedOnly(false); }, [selection.count]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return folderTemplates.filter((t) => (!selectedOnly || selection.has(t.id)) && (!s || t.templatename.toLowerCase().includes(s)));
  }, [folderTemplates, q, selectedOnly, selection]);
  const paging = usePagination(filtered, { initialSize: 10, storageKey: 'folder-templates' });
  const { pageItems: rows, setPage } = paging;
  const selected = folderTemplates.filter((t) => selection.has(t.id));

  if (!duplicateFolderTemplates) return <div role="alert" className="card bg-danger-50 p-6 font-semibold text-danger-700">Folder templates are not set up in DataContext.js</div>;

  const openNew = () => navigate(`${LIST_PATH}/new`);
  const openEdit = (t) => navigate(`${LIST_PATH}/${t.id}`);
  const remove = () => {
    const ids = confirm.map((t) => t.id);
    deleteFolderTemplates(ids); selection.setMany(ids, false); setConfirm(null);
    notify(`Deleted ${ids.length} template${ids.length > 1 ? 's' : ''}`);
  };
  const exportCsv = (items) => {
    downloadCsv('folder-templates.csv', [['Template name', 'Folders', 'Files', 'Used in pipelines', 'Updated'],
      ...items.map((t) => { const c = countItems(t.items); return [t.templatename, c.folders, c.files, (usedIn.get(String(t.id)) || []).join('; '), t.updatedAt]; })]);
    notify(`Exported ${items.length} templates`);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Folder templates</h2>
          <p className="text-muted">Folder structures created for an account, always with the three default folders.</p>
        </div>
        <button className="btn-primary" onClick={openNew}>+ New folder template</button>
      </div>

      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-4 sm:px-5">
          <label className="flex min-h-[44px] flex-[1_1_260px] items-center gap-2 rounded border border-line-strong px-3 focus-within:border-brand-600">
            <FiSearch size={18} className="text-muted" aria-hidden="true" /><span className="sr-only">Search folder templates</span>
            <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search template name" className="min-w-0 flex-1 bg-transparent outline-none" />
          </label>
          {q && <button onClick={() => { setQ(''); setPage(1); }} className="btn-link px-2">Clear</button>}
        </div>

        <BulkBar count={selection.count} total={filtered.length}
          onSelectAll={() => selection.setMany(filtered.map((t) => t.id), true)} onClear={selection.clear}
          filters={<SelectedOnlyFilter checked={selectedOnly} onChange={(v) => { setSelectedOnly(v); setPage(1); }} />}
          actions={<>
            <button className={barButton} onClick={() => { duplicateFolderTemplates([...selection.ids]); notify(`Duplicated ${selection.count} template${selection.count > 1 ? 's' : ''}`); selection.clear(); }}><FiCopy aria-hidden="true" /> Duplicate</button>
            <button className={barButton} onClick={() => exportCsv(selected)}><FiDownload aria-hidden="true" /> Export</button>
            <button className={barDanger} onClick={() => setConfirm(selected)}><FiTrash2 aria-hidden="true" /> Delete</button>
          </>}
        />

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse">
            <thead>
              <tr className="bg-subtle text-left text-xs uppercase tracking-wide text-muted">
                <th className="w-12 py-3 pl-5 pr-1"><HeaderCheckbox selection={selection} pageIds={rows.map((t) => t.id)} /></th>
                <th className="px-3 py-3 font-semibold">Template name</th>
                <th className="px-3 py-3 font-semibold">Folders</th>
                <th className="px-3 py-3 font-semibold">Files</th>
                <th className="px-3 py-3 font-semibold">Used in pipelines</th>
                <th className="px-3 py-3 font-semibold">Updated</th>
                <th className="px-5 py-3 text-right font-semibold"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => {
                const checked = selection.has(t.id);
                const c = countItems(t.items);
                const pipes = usedIn.get(String(t.id)) || [];
                return (
                  <tr key={t.id} aria-selected={checked} className={cx('border-t border-line-soft', checked ? 'bg-brand-50' : 'hover:bg-subtle/60')}>
                    <td className="py-3 pl-5 pr-1"><SelectCheckbox label={`Select ${t.templatename}`} checked={checked} onChange={() => selection.toggle(t.id)} /></td>
                    <td className="px-3 py-3"><button onClick={() => openEdit(t)} className="text-left font-semibold hover:text-brand-600 hover:underline">{t.templatename}</button></td>
                    <td className="px-3 py-3 font-semibold">{c.folders}</td>
                    <td className="px-3 py-3">{c.files || <span className="text-muted">—</span>}</td>
                    <td className="px-3 py-3 text-sm">{pipes.length ? <span title={pipes.join(', ')}>{pipes.length} pipeline{pipes.length > 1 ? 's' : ''}</span> : <span className="text-muted">—</span>}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-muted">{fmtDate(t.updatedAt)}</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end">
                        <RowActionsMenu label={t.templatename} onEdit={() => openEdit(t)}
                          onDuplicate={() => { duplicateFolderTemplates([t.id]); notify(`Duplicated “${t.templatename}”`); }}
                          onDelete={() => setConfirm([t])} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center gap-3 p-12 text-center text-muted">
              {folderTemplates.length ? 'No folder templates match your search.' : 'No folder templates yet.'}
              {!folderTemplates.length && <button onClick={openNew} className="btn-primary">+ New folder template</button>}
            </div>
          )}
        </div>
        <Pagination {...paging} label="templates" />
      </section>

      {confirm && (
        <Modal title={confirm.length === 1 ? `Delete “${confirm[0].templatename}”?` : `Delete ${confirm.length} templates?`} onClose={() => setConfirm(null)}
          footer={<><button className="btn-secondary" onClick={() => setConfirm(null)}>Cancel</button><button className="btn bg-danger-700 text-white hover:bg-[#831E15]" onClick={remove}>Delete</button></>}>
          <p className="text-muted">Folders already created for accounts are not affected.</p>
        </Modal>
      )}
      {toast && <div role="status" className="fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-md bg-ink px-5 py-3 font-semibold text-white">{toast}</div>}
    </div>
  );
}
