// import { useEffect, useMemo, useState } from 'react';
// import { Link, useNavigate, useParams } from 'react-router-dom';
// import { FiArrowLeft, FiFolder, FiTrash2 } from 'react-icons/fi';
// import FolderExplorer from '../../../components/folders/FolderExplorer';
// import { Modal, cx } from '../../../components/ui';
// import { useData } from '../../../context/DataContext';
// import { DEFAULT_FOLDERS, countItems, emptyFolderTemplate } from '../../../data/folderTemplates';

// const LIST_PATH = '/firmtemp/templates/folders';
// const clone = (o) => JSON.parse(JSON.stringify(o));

// /**
//  * Create / edit a folder template.
//  *   /firmtemp/templates/folders/new          → create (starts with the three default folders)
//  *   /firmtemp/templates/folders/:templateId  → edit
//  */
// export default function FolderTemplateForm() {
//   const { templateId } = useParams();
//   return <FolderTemplatePage key={templateId || 'new'} editingId={templateId} />;
// }

// function FolderTemplatePage({ editingId }) {
//   const navigate = useNavigate();
//   const { folderTemplates = [], saveFolderTemplate, deleteFolderTemplates, folderTemplateNameTaken } = useData();
//   const existing = editingId ? folderTemplates.find((t) => String(t.id) === String(editingId)) : null;
//   const isEdit = !!editingId;

//   const initial = useMemo(() => (existing ? clone(existing) : emptyFolderTemplate()), []); // eslint-disable-line react-hooks/exhaustive-deps
//   const [form, setForm] = useState(initial);
//   const [saved, setSaved] = useState(initial);
//   const [error, setError] = useState('');
//   const [modal, setModal] = useState(null);   // 'discard' | 'delete'
//   const [toast, setToast] = useState('');
//   const dirty = JSON.stringify(form) !== JSON.stringify(saved);
//   const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 2600); };
//   const counts = countItems(form.items);

//   useEffect(() => {
//     if (!dirty) return undefined;
//     const h = (e) => { e.preventDefault(); e.returnValue = ''; };
//     window.addEventListener('beforeunload', h);
//     return () => window.removeEventListener('beforeunload', h);
//   }, [dirty]);

//   if (!saveFolderTemplate) return <div role="alert" className="card bg-danger-50 p-6 font-semibold text-danger-700">Folder templates are not set up in DataContext.js</div>;
//   if (editingId && !existing) {
//     return (
//       <div className="flex flex-col items-start gap-4">
//         <h1 className="text-3xl font-bold">Folder template not found</h1>
//         <Link to={LIST_PATH} className="btn-primary">Back to folder templates</Link>
//       </div>
//     );
//   }

//   const validate = () => {
//     const name = form.templatename.trim();
//     const e = !name ? 'Template name is required' : folderTemplateNameTaken?.(name, editingId) ? 'Template name already exists' : '';
//     setError(e);
//     return !e;
//   };
//   const persist = () => {
//     const id = saveFolderTemplate({ ...form, id: editingId || undefined, templatename: form.templatename.trim() });
//     return { ...form, id, templatename: form.templatename.trim() };
//   };
//   const onSave = () => {
//     if (!validate()) return;
//     const data = persist();
//     setForm(data); setSaved(data);
//     notify(isEdit ? 'Folder template updated' : 'Folder template created');
//     if (!editingId) navigate(`${LIST_PATH}/${data.id}`, { replace: true });
//   };
//   const onSaveAndExit = () => {
//     if (!validate()) return;
//     const data = persist();
//     navigate(LIST_PATH, { state: { toast: isEdit ? `Updated “${data.templatename}”` : `Created “${data.templatename}”` } });
//   };
//   const onCancel = () => (dirty ? setModal('discard') : navigate(LIST_PATH));

//   return (
//     <div className="flex flex-col gap-6">
//       <header className="flex flex-wrap items-start gap-4">
//         <button onClick={onCancel} aria-label="Back to folder templates" className="mt-1 flex h-10 w-10 flex-none items-center justify-center rounded border border-line-strong bg-surface hover:bg-subtle"><FiArrowLeft size={18} /></button>
//         <div className="min-w-0 flex-1">
//           <nav aria-label="Breadcrumb" className="text-sm text-muted">
//             <Link to="/firmtemp/templates" className="hover:underline">Firm Templates</Link> <span aria-hidden="true">/</span> <Link to={LIST_PATH} className="hover:underline">Folders</Link>
//           </nav>
//           <h1 className="truncate text-2xl font-bold sm:text-3xl">{isEdit ? 'Edit Folder Template' : 'Create Folder Template'}</h1>
//           <p className="text-muted">The folders and files every account gets when this template is applied</p>
//         </div>
//         {isEdit && <button type="button" className="btn border border-danger-200 bg-surface text-danger-700 hover:bg-danger-50" onClick={() => setModal('delete')}><FiTrash2 aria-hidden="true" /> Delete</button>}
//       </header>

//       <section className="card p-5 sm:p-6">
//         <label className="field-label max-w-xl">
//           <span>Template Name <span className="text-danger-700">*</span></span>
//           <input className={cx('input', error && 'border-danger-700')} value={form.templatename} placeholder="Template name"
//             onChange={(e) => { setForm((f) => ({ ...f, templatename: e.target.value })); setError(''); }} />
//           {error && <span role="alert" className="text-sm font-normal text-danger-700">{error}</span>}
//         </label>
//       </section>

//       <section className="card overflow-hidden" aria-label="Folders and files">
//         <header className="flex flex-wrap items-center gap-3 border-b border-line bg-subtle/60 px-5 py-4">
//           <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-600" aria-hidden="true"><FiFolder /></span>
//           <div className="flex-1">
//             <h2 className="font-semibold">Folders and files</h2>
//             <p className="text-sm text-muted">{counts.folders} folders · {counts.files} files. The {DEFAULT_FOLDERS.length} default folders (🔒) can’t be renamed, moved or deleted.</p>
//           </div>
//         </header>
//         <FolderExplorer items={form.items} onChange={(items) => setForm((f) => ({ ...f, items }))} />
//       </section>

//       <div className="sticky bottom-0 z-10 -mx-4 -mb-6 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-10 lg:-mb-8 lg:px-10">
//         <div className="flex flex-wrap items-center justify-end gap-2.5">
//           {dirty && <span className="mr-auto flex items-center gap-2 text-sm font-semibold text-warning-700"><span className="h-2 w-2 rounded-full bg-warning-700" aria-hidden="true" />Unsaved changes</span>}
//           <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
//           <button type="button" className="btn border border-brand-600 bg-brand-50 text-brand-600 hover:bg-brand-100" onClick={onSave}>{isEdit ? 'Update' : 'Save'}</button>
//           <button type="button" className="btn-primary" onClick={onSaveAndExit}>{isEdit ? 'Update & Exit' : 'Save & Exit'}</button>
//         </div>
//       </div>

//       {modal === 'discard' && (
//         <Modal title="Discard changes?" onClose={() => setModal(null)}
//           footer={<><button className="btn-secondary" onClick={() => setModal(null)}>Keep editing</button><button className="btn bg-danger-700 text-white hover:bg-[#831E15]" onClick={() => navigate(LIST_PATH)}>Discard</button></>}>
//           <p className="text-muted">Your changes to this folder template haven't been saved.</p>
//         </Modal>
//       )}
//       {modal === 'delete' && (
//         <Modal title={`Delete “${saved.templatename}”?`} onClose={() => setModal(null)}
//           footer={<><button className="btn-secondary" onClick={() => setModal(null)}>Cancel</button><button className="btn bg-danger-700 text-white hover:bg-[#831E15]" onClick={() => { deleteFolderTemplates([editingId]); navigate(LIST_PATH, { state: { toast: `Deleted “${saved.templatename}”` } }); }}>Delete</button></>}>
//           <p className="text-muted">Folders already created for accounts are not affected.</p>
//         </Modal>
//       )}
//       {toast && <div role="status" className="fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-md bg-ink px-5 py-3 font-semibold text-white">{toast}</div>}
//     </div>
//   );
// }

import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiArrowRight, FiFolder, FiTrash2 } from 'react-icons/fi';
import FolderExplorer from '../../../components/folders/FolderExplorer';
import { Modal, cx } from '../../../components/ui';
import { useData } from '../../../context/DataContext';
import { DEFAULT_FOLDERS, countItems, emptyFolderTemplate } from '../../../data/folderTemplates';

const LIST_PATH = '/firmtemp/templates/folders';
const clone = (o) => JSON.parse(JSON.stringify(o));

/**
 * Create / edit a folder template.
 *   /firmtemp/templates/folders/new          → step 1: enter the template name and save
 *   /firmtemp/templates/folders/:templateId  → step 2 / edit: the folder tree (starts with the three default folders)
 */
export default function FolderTemplateForm() {
  const { templateId } = useParams();
  return <FolderTemplatePage key={templateId || 'new'} editingId={templateId} />;
}

function FolderTemplatePage({ editingId }) {
  const navigate = useNavigate();
  const { state: routeState, pathname } = useLocation();
  const { folderTemplates = [], saveFolderTemplate, deleteFolderTemplates, folderTemplateNameTaken } = useData();
  const existing = editingId ? folderTemplates.find((t) => String(t.id) === String(editingId)) : null;
  const isEdit = !!editingId;

  const initial = useMemo(() => (existing ? clone(existing) : emptyFolderTemplate()), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [form, setForm] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);   // 'discard' | 'delete'
  const [toast, setToast] = useState('');
  const dirty = JSON.stringify(form) !== JSON.stringify(saved);
  const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 2600); };
  const counts = countItems(form.items);

  // message passed from step 1 ("created — now add folders")
  useEffect(() => {
    if (routeState?.toast) { notify(routeState.toast); navigate(pathname, { replace: true, state: null }); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!dirty) return undefined;
    const h = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  if (!saveFolderTemplate) return <div role="alert" className="card bg-danger-50 p-6 font-semibold text-danger-700">Folder templates are not set up in DataContext.js</div>;
  if (editingId && !existing) {
    return (
      <div className="flex flex-col items-start gap-4">
        <h1 className="text-3xl font-bold">Folder template not found</h1>
        <Link to={LIST_PATH} className="btn-primary">Back to folder templates</Link>
      </div>
    );
  }

  const validate = () => {
    const name = form.templatename.trim();
    const e = !name ? 'Template name is required' : folderTemplateNameTaken?.(name, editingId) ? 'Template name already exists' : '';
    setError(e);
    return !e;
  };
  const persist = () => {
    const id = saveFolderTemplate({ ...form, id: editingId || undefined, templatename: form.templatename.trim() });
    return { ...form, id, templatename: form.templatename.trim() };
  };
  const onSave = () => {
    if (!validate()) return;
    const data = persist();
    if (!editingId) {
      // step 1 done → open the template to add folders and files
      navigate(`${LIST_PATH}/${data.id}`, { replace: true, state: { toast: 'Folder template created — now add folders and files' } });
      return;
    }
    setForm(data); setSaved(data);
    notify('Folder template updated');
  };
  const onSaveAndExit = () => {
    if (!validate()) return;
    const data = persist();
    navigate(LIST_PATH, { state: { toast: isEdit ? `Updated “${data.templatename}”` : `Created “${data.templatename}”` } });
  };
  const onCancel = () => (dirty ? setModal('discard') : navigate(LIST_PATH));

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start gap-4">
        <button onClick={onCancel} aria-label="Back to folder templates" className="mt-1 flex h-10 w-10 flex-none items-center justify-center rounded border border-line-strong bg-surface hover:bg-subtle"><FiArrowLeft size={18} /></button>
        <div className="min-w-0 flex-1">
          <nav aria-label="Breadcrumb" className="text-sm text-muted">
            <Link to="/firmtemp/templates" className="hover:underline">Firm Templates</Link> <span aria-hidden="true">/</span> <Link to={LIST_PATH} className="hover:underline">Folders</Link>
          </nav>
          <h1 className="truncate text-2xl font-bold sm:text-3xl">{isEdit ? 'Edit Folder Template' : 'Create Folder Template'}</h1>
          <p className="text-muted">{isEdit ? 'The folders and files every account gets when this template is applied' : 'Step 1 of 2 · Name your template'}</p>
        </div>
        {isEdit && <button type="button" className="btn border border-danger-200 bg-surface text-danger-700 hover:bg-danger-50" onClick={() => setModal('delete')}><FiTrash2 aria-hidden="true" /> Delete</button>}
      </header>

      <section className="card p-5 sm:p-6">
        <form noValidate onSubmit={(e) => { e.preventDefault(); onSave(); }} className="flex flex-wrap items-end gap-3">
          <label className="field-label min-w-[260px] max-w-xl flex-1">
            <span>Template Name <span className="text-danger-700">*</span></span>
            <input autoFocus={!isEdit} className={cx('input', error && 'border-danger-700')} value={form.templatename} placeholder="Template name"
              onChange={(e) => { setForm((f) => ({ ...f, templatename: e.target.value })); setError(''); }} />
            {error && <span role="alert" className="text-sm font-normal text-danger-700">{error}</span>}
          </label>
          {!isEdit && <button type="submit" className="btn-primary">Save &amp; continue <FiArrowRight aria-hidden="true" /></button>}
        </form>
      </section>

      {!isEdit ? (
        /* Step 1: the folder tree appears after the name is saved */
        <section aria-label="Folders and files" className="flex flex-col items-center gap-3 rounded-lg border-2 border-dashed border-line-strong p-10 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600" aria-hidden="true"><FiFolder size={22} /></span>
          <h2 className="text-lg font-semibold">Next: folders and files</h2>
          <p className="max-w-md text-muted">Save the template name to start building the folder structure. It begins with the {DEFAULT_FOLDERS.length} default folders: {DEFAULT_FOLDERS.join(', ')}.</p>
        </section>
      ) : (
      <section className="card overflow-hidden" aria-label="Folders and files">
        <header className="flex flex-wrap items-center gap-3 border-b border-line bg-subtle/60 px-5 py-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-600" aria-hidden="true"><FiFolder /></span>
          <div className="flex-1">
            <h2 className="font-semibold">Folders and files</h2>
            <p className="text-sm text-muted">{counts.folders} folders · {counts.files} files. The {DEFAULT_FOLDERS.length} default folders (🔒) can’t be renamed, moved or deleted.</p>
          </div>
        </header>
        <FolderExplorer items={form.items} onChange={(items) => setForm((f) => ({ ...f, items }))} />
      </section>
      )}

      <div className="sticky bottom-0 z-10 -mx-4 -mb-6 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-10 lg:-mb-8 lg:px-10">
        <div className="flex flex-wrap items-center justify-end gap-2.5">
          {dirty && <span className="mr-auto flex items-center gap-2 text-sm font-semibold text-warning-700"><span className="h-2 w-2 rounded-full bg-warning-700" aria-hidden="true" />Unsaved changes</span>}
          <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
          {isEdit && <button type="button" className="btn border border-brand-600 bg-brand-50 text-brand-600 hover:bg-brand-100" onClick={onSave}>Update</button>}
          <button type="button" className="btn-primary" onClick={onSaveAndExit}>{isEdit ? 'Update & Exit' : 'Save & Exit'}</button>
        </div>
      </div>

      {modal === 'discard' && (
        <Modal title="Discard changes?" onClose={() => setModal(null)}
          footer={<><button className="btn-secondary" onClick={() => setModal(null)}>Keep editing</button><button className="btn bg-danger-700 text-white hover:bg-[#831E15]" onClick={() => navigate(LIST_PATH)}>Discard</button></>}>
          <p className="text-muted">Your changes to this folder template haven't been saved.</p>
        </Modal>
      )}
      {modal === 'delete' && (
        <Modal title={`Delete “${saved.templatename}”?`} onClose={() => setModal(null)}
          footer={<><button className="btn-secondary" onClick={() => setModal(null)}>Cancel</button><button className="btn bg-danger-700 text-white hover:bg-[#831E15]" onClick={() => { deleteFolderTemplates([editingId]); navigate(LIST_PATH, { state: { toast: `Deleted “${saved.templatename}”` } }); }}>Delete</button></>}>
          <p className="text-muted">Folders already created for accounts are not affected.</p>
        </Modal>
      )}
      {toast && <div role="status" className="fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-md bg-ink px-5 py-3 font-semibold text-white">{toast}</div>}
    </div>
  );
}