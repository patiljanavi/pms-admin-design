// import { useEffect, useMemo, useState } from 'react';
// import { Link, useNavigate, useParams } from 'react-router-dom';
// import { FiArrowLeft, FiCalendar, FiFileText, FiList, FiMenu, FiPlus, FiTag, FiTrash2 } from 'react-icons/fi';
// import MultiSelect from '../../components/MultiSelect';
// import TextEditor from '../../components/TextEditor';

// import TagChip, { chipStyle } from '../../components/TagChip';
// import { Avatar, Modal, Toggle, cx, initials } from '../../components/ui';
// import { useData } from '../../context/DataContext';
// import { TEAM_MEMBERS } from '../../data/sampleData';
// import {
//   DURATION_OPTIONS, PRIORITY_STYLE, STATUS_STYLE, TASK_PRIORITIES, TASK_STATUSES, emptyTaskTemplate,
// } from '../../data/taskTemplates';

// const LIST_PATH = '/firmtemp/templates/tasks';
// const TEAM_OPTIONS = TEAM_MEMBERS.map((m) => ({ ...m, value: m.label })); // assignees are stored by name
// const clone = (o) => JSON.parse(JSON.stringify(o));

// /* ---------- small building blocks (same look as the rest of the app) ---------- */
// function Section({ title, icon, description, children }) {
//   return (
//     <section className="card p-5 sm:p-6">
//       <div className="mb-4">
//         <h2 className="flex items-center gap-2 text-lg font-semibold">{icon}{title}</h2>
//         {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
//       </div>
//       {children}
//     </section>
//   );
// }

// function SwitchRow({ label, description, checked, onChange }) {
//   return (
//     <div className="flex items-start justify-between gap-4 rounded-md border border-line p-3.5">
//       <div><div className="font-semibold">{label}</div>{description && <div className="text-sm text-muted">{description}</div>}</div>
//       <Toggle label={label} checked={checked} onChange={onChange} />
//     </div>
//   );
// }

// function PillSelect({ label, options, value, onChange, styles }) {
//   return (
//     <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
//       {options.map((o) => (
//         <button key={o} type="button" role="radio" aria-checked={value === o} onClick={() => onChange(o)}
//           className={cx('min-h-[38px] rounded-full px-3.5 text-sm font-semibold ring-offset-2 transition',
//             styles[o], value === o ? 'ring-2 ring-brand-600' : 'opacity-70 hover:opacity-100')}>
//           {o}
//         </button>
//       ))}
//     </div>
//   );
// }

// /**
//  * Create / edit a task template.
//  *   /firmtemp/templates/tasks/new          → create
//  *   /firmtemp/templates/tasks/:templateId  → edit
//  */
// export default function TaskTemplateForm() {
//   const { templateId } = useParams();
//   return <FormPage key={templateId || 'new'} editingId={templateId} />;
// }

// function FormPage({ editingId }) {
//   const navigate = useNavigate();
//   const { taskTemplates, saveTaskTemplate, deleteTaskTemplates, tags, createTag } = useData();
//   const existing = editingId ? taskTemplates.find((t) => t.id === editingId) : null;

//   const initial = useMemo(() => clone(existing || emptyTaskTemplate), []); // eslint-disable-line react-hooks/exhaustive-deps
//   const [form, setForm] = useState(initial);
//   const [saved, setSaved] = useState(initial);   // last saved version (for "unsaved changes")
//   const [errors, setErrors] = useState({});
//   const [saving, setSaving] = useState(false);
//   const [modal, setModal] = useState(null);      // 'discard' | 'delete'
//   const [toast, setToast] = useState('');
//   const [dragIndex, setDragIndex] = useState(null);
//   const dirty = JSON.stringify(form) !== JSON.stringify(saved);
//   const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 2600); };

//   useEffect(() => {
//     if (!dirty) return undefined;
//     const h = (e) => { e.preventDefault(); e.returnValue = ''; };
//     window.addEventListener('beforeunload', h);
//     return () => window.removeEventListener('beforeunload', h);
//   }, [dirty]);

//   if (editingId && !existing) {
//     return (
//       <div className="flex flex-col items-start gap-4">
//         <h1 className="text-3xl font-bold">Task template not found</h1>
//         <Link to={LIST_PATH} className="btn-primary">Back to task templates</Link>
//       </div>
//     );
//   }

//   const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })); };

//   /* ---------- subtasks ---------- */
//   const subtasks = form.subtasks || [];
//   const setSubtasks = (list) => set('subtasks', list);
//   const handleAddSubtask = () => setSubtasks([...subtasks, { id: `s-${Date.now()}`, text: '', checked: false }]);
//   const handleInputChange = (id, text) => setSubtasks(subtasks.map((s) => (s.id === id ? { ...s, text } : s)));
//   const handleCheckboxChange = (id) => setSubtasks(subtasks.map((s) => (s.id === id ? { ...s, checked: !s.checked } : s)));
//   const handleDeleteSubtask = (id) => setSubtasks(subtasks.filter((s) => s.id !== id));
//   const moveSubtask = (from, to) => {
//     if (to < 0 || to >= subtasks.length || from === to) return;
//     const list = [...subtasks];
//     const [item] = list.splice(from, 1);
//     list.splice(to, 0, item);
//     setSubtasks(list);
//   };
//   const handleSubtaskSwitch = (val) => { set('SubtaskSwitch', val); if (val && subtasks.length === 0) setSubtasks([{ id: `s-${Date.now()}`, text: '', checked: false }]); };

//   /* ---------- save ---------- */
//   const validate = () => {
//     const e = {};
//     if (!form.templatename.trim()) e.templatename = 'Template name is required.';
//     if (form.absoluteDate && form.startDate && form.dueDate && form.dueDate < form.startDate) e.dueDate = 'Due date must be on or after the start date.';
//     setErrors(e);
//     if (Object.keys(e).length) window.scrollTo({ top: 0, behavior: 'smooth' });
//     return Object.keys(e).length === 0;
//   };
//   const persist = () => {
//     const data = {
//       ...form,
//       templatename: form.templatename.trim(),
//       startsin: Number(form.startsin) || 0,
//       duein: Number(form.duein) || 0,
//       subtasks: form.SubtaskSwitch ? subtasks.filter((s) => s.text.trim()).map((s) => ({ ...s, text: s.text.trim() })) : [],
//     };
//     const id = saveTaskTemplate(data);
//     return { ...data, id };
//   };
//   const createSaveTaskTemp = () => {                 // Save (stay on the page)
//     if (!validate()) return;
//     setSaving(true);
//     const data = persist();
//     setForm(data); setSaved(data); setSaving(false);
//     notify(`Saved “${data.templatename}”`);
//     if (!editingId) navigate(`${LIST_PATH}/${data.id}`, { replace: true });
//   };
//   const createTaskTemp = () => {                     // Save & Exit
//     if (!validate()) return;
//     setSaving(true);
//     const data = persist();
//     navigate(LIST_PATH, { state: { toast: editingId ? `Saved “${data.templatename}”` : `Created “${data.templatename}”` } });
//   };
//   const handleTaskCancel = () => (dirty ? setModal('discard') : navigate(LIST_PATH));

//   const dateInput = 'input';
//   const durationSelect = (key) => (
//     <select aria-label="Unit" className="input" value={form[key]} onChange={(e) => set(key, e.target.value)}>
//       {DURATION_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
//     </select>
//   );

//   return (
//     <div className="flex flex-col gap-6">
//       {/* Header (title + actions) */}
//       <header className="flex flex-wrap items-center gap-4">
//         <button onClick={handleTaskCancel} aria-label="Back to task templates" className="flex h-10 w-10 items-center justify-center rounded border border-line-strong bg-surface hover:bg-subtle"><FiArrowLeft size={18} /></button>
//         <div className="min-w-0 flex-1">
//           <nav aria-label="Breadcrumb" className="text-sm text-muted">
//             <Link to="/firmtemp/templates" className="hover:underline">Firm Templates</Link> / <Link to={LIST_PATH} className="hover:underline">Tasks</Link>
//           </nav>
//           <h1 className="truncate text-2xl font-bold sm:text-3xl">{editingId ? 'Edit Task Template' : 'Create Task Template'}</h1>
//           <p className="text-muted">Configure your task template settings</p>
//         </div>
//         <div className="flex flex-wrap gap-2">
//           {editingId && <button type="button" className="btn border border-danger-200 bg-surface text-danger-700 hover:bg-danger-50" onClick={() => setModal('delete')} disabled={saving}><FiTrash2 aria-hidden="true" /> Delete</button>}
//           <button type="button" className="btn-secondary" onClick={handleTaskCancel} disabled={saving}>Cancel</button>
//           <button type="button" className="btn border border-brand-600 bg-brand-50 text-brand-600 hover:bg-brand-100" onClick={createSaveTaskTemp} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
//           <button type="button" className="btn-primary" onClick={createTaskTemp} disabled={saving}>{saving ? 'Saving…' : 'Save & Exit'}</button>
//         </div>
//       </header>

//       {dirty && <div className="rounded-md border border-warning-300 bg-warning-50 px-4 py-2.5 text-sm font-semibold text-warning-700">You have unsaved changes.</div>}
//       {Object.values(errors).some(Boolean) && <div role="alert" className="rounded-md bg-danger-50 px-4 py-3 font-semibold text-danger-700">Please fix the highlighted fields.</div>}

//       <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
//         {/* LEFT COLUMN */}
//         <div className="flex flex-col gap-6">
//           {/* General */}
//           <Section title="General" icon={<FiFileText aria-hidden="true" />}>
//             <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
//               <label className="field-label">
//                 <span>Template Name <span className="text-danger-700">*</span></span>
//                 <input className={cx('input', errors.templatename && 'border-danger-700')} value={form.templatename}
//                   onChange={(e) => set('templatename', e.target.value)} placeholder="Enter template name" />
//                 {errors.templatename && <span className="text-sm font-normal text-danger-700">{errors.templatename}</span>}
//               </label>
//               <div className="flex flex-col gap-1.5">
//                 <span className="text-sm font-semibold">Status</span>
//                 <PillSelect label="Status" options={TASK_STATUSES} value={form.status} onChange={(v) => set('status', v)} styles={STATUS_STYLE} />
//               </div>
//               <div>
//                 <MultiSelect label="Assignees" placeholder="Select assignees" options={TEAM_OPTIONS} value={form.assignees}
//                   onChange={(v) => set('assignees', v)}
//                   renderOption={(o) => (
//                     <span className="flex flex-1 items-center gap-2.5"><Avatar text={initials(o.label)} size="sm" />
//                       <span><span className="block font-semibold">{o.label}</span><span className="block text-sm text-muted">{o.meta}</span></span></span>
//                   )} />
//               </div>
//               <div className="flex flex-col gap-1.5">
//                 <span className="text-sm font-semibold">Priority</span>
//                 <PillSelect label="Priority" options={TASK_PRIORITIES} value={form.priority} onChange={(v) => set('priority', v)} styles={PRIORITY_STYLE} />
//               </div>
//             </div>
//           </Section>

//           {/* Description */}
//        {/* Description */}
// <Section title="Description">
//   <TextEditor
//     ariaLabel="Description"
//     value={form.description}
//     onChange={(html) => set('description', html)}
//     placeholder="What should be done, and how? (shown on every task created from this template)"
//   />
// </Section>

//           {/* Tags */}
//           <Section title="Tags" icon={<FiTag aria-hidden="true" />}>
//             <MultiSelect placeholder="Select or search tags" options={tags} value={form.tags} onChange={(v) => set('tags', v)}
//               creatable createLabel="Create tag" onCreate={createTag}
//               chipStyle={(o) => chipStyle(o.color)} renderOption={(o) => <TagChip tag={o} />} />
//           </Section>

//           {/* Dates */}
//           <Section title="Dates" icon={<FiCalendar aria-hidden="true" />}>
//             <SwitchRow label="Use absolute dates" description="Set fixed calendar dates instead of relative offsets"
//               checked={!!form.absoluteDate} onChange={(v) => set('absoluteDate', v)} />

//             {form.absoluteDate ? (
//               <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
//                 <label className="field-label">Start Date
//                   <input type="date" className={dateInput} value={form.startDate || ''} onChange={(e) => set('startDate', e.target.value)} />
//                 </label>
//                 <label className="field-label">Due Date
//                   <input type="date" className={cx(dateInput, errors.dueDate && 'border-danger-700')} value={form.dueDate || ''} min={form.startDate || undefined} onChange={(e) => set('dueDate', e.target.value)} />
//                   {errors.dueDate && <span className="text-sm font-normal text-danger-700">{errors.dueDate}</span>}
//                 </label>
//               </div>
//             ) : (
//               <div className="mt-4 flex flex-col gap-3">
//                 <div className="grid grid-cols-[80px_1fr_140px] items-center gap-3">
//                   <span className="text-sm font-semibold">Start in</span>
//                   <input aria-label="Start in" className="input" type="number" min="0" placeholder="0" value={form.startsin} onChange={(e) => set('startsin', e.target.value)} />
//                   {durationSelect('startsInDuration')}
//                 </div>
//                 <div className="grid grid-cols-[80px_1fr_140px] items-center gap-3">
//                   <span className="text-sm font-semibold">Due in</span>
//                   <input aria-label="Due in" className="input" type="number" min="0" placeholder="0" value={form.duein} onChange={(e) => set('duein', e.target.value)} />
//                   {durationSelect('dueinduration')}
//                 </div>
//               </div>
//             )}
//           </Section>
//         </div>

//         {/* RIGHT COLUMN */}
//         <aside className="flex flex-col gap-6 xl:sticky xl:top-24">
//           <Section title="Subtasks" icon={<FiList aria-hidden="true" />} description="Add checklist items to this task template">
//             <SwitchRow label="Enable subtasks" description="Show a subtask checklist on every task created from this template"
//               checked={!!form.SubtaskSwitch} onChange={handleSubtaskSwitch} />

//             {form.SubtaskSwitch && (
//               <div className="mt-4 flex flex-col gap-2">
//                 {subtasks.map((s, index) => (
//                   <div key={s.id} draggable onDragStart={() => setDragIndex(index)} onDragEnd={() => setDragIndex(null)}
//                     onDragOver={(e) => e.preventDefault()} onDrop={() => { moveSubtask(dragIndex, index); setDragIndex(null); }}
//                     className={cx('flex items-center gap-2 rounded-md border bg-surface p-2', dragIndex === index ? 'border-brand-600 opacity-60' : 'border-line')}>
//                     <span className="flex h-8 w-6 flex-none cursor-grab items-center justify-center text-muted" title="Drag to reorder" aria-hidden="true"><FiMenu /></span>
//                     <input type="checkbox" checked={s.checked} onChange={() => handleCheckboxChange(s.id)} aria-label={`Subtask ${index + 1} done by default`} className="h-[18px] w-[18px] flex-none accent-brand-600" />
//                     <input className="min-h-[38px] min-w-0 flex-1 rounded border border-transparent px-2 hover:border-line focus:border-brand-600 focus:outline-none"
//                       value={s.text} onChange={(e) => handleInputChange(s.id, e.target.value)} placeholder={`Subtask ${index + 1}`} aria-label={`Subtask ${index + 1}`} />
//                     <div className="flex flex-none">
//                       <button type="button" onClick={() => moveSubtask(index, index - 1)} disabled={index === 0} aria-label={`Move subtask ${index + 1} up`} className="h-8 w-7 rounded text-muted hover:bg-subtle disabled:opacity-30">↑</button>
//                       <button type="button" onClick={() => moveSubtask(index, index + 1)} disabled={index === subtasks.length - 1} aria-label={`Move subtask ${index + 1} down`} className="h-8 w-7 rounded text-muted hover:bg-subtle disabled:opacity-30">↓</button>
//                       <button type="button" onClick={() => handleDeleteSubtask(s.id)} aria-label={`Delete subtask ${index + 1}`} className="flex h-8 w-8 items-center justify-center rounded text-danger-700 hover:bg-danger-50"><FiTrash2 aria-hidden="true" /></button>
//                     </div>
//                   </div>
//                 ))}
//                 <button type="button" onClick={handleAddSubtask} className="btn border border-dashed border-line-strong bg-surface text-brand-600 hover:bg-subtle"><FiPlus aria-hidden="true" /> Add subtask</button>
//                 <p className="text-xs text-muted">Drag ☰ or use ↑ ↓ to reorder. Empty subtasks are removed when you save.</p>
//               </div>
//             )}
//           </Section>
//         </aside>
//       </div>

//       {modal === 'discard' && (
//         <Modal title="Discard changes?" onClose={() => setModal(null)}
//           footer={<><button className="btn-secondary" onClick={() => setModal(null)}>Keep editing</button><button className="btn bg-danger-700 text-white hover:bg-[#831E15]" onClick={() => navigate(LIST_PATH)}>Discard</button></>}>
//           <p className="text-muted">Your changes to this task template haven't been saved.</p>
//         </Modal>
//       )}
//       {modal === 'delete' && (
//         <Modal title={`Delete “${existing?.templatename}”?`} onClose={() => setModal(null)}
//           footer={<><button className="btn-secondary" onClick={() => setModal(null)}>Cancel</button><button className="btn bg-danger-700 text-white hover:bg-[#831E15]" onClick={() => { deleteTaskTemplates([editingId]); navigate(LIST_PATH, { state: { toast: `Deleted “${existing.templatename}”` } }); }}>Delete</button></>}>
//           <p className="text-muted">Tasks already created from this template stay as they are.</p>
//         </Modal>
//       )}
//       {toast && <div role="status" className="fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-md bg-ink px-5 py-3 font-semibold text-white">{toast}</div>}
//     </div>
//   );
// }
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiCalendar, FiFileText, FiList, FiMenu, FiPlus, FiTag, FiTrash2 } from 'react-icons/fi';
import MultiSelect from '../../../components/MultiSelect';
import TextEditor from '../../../components/TextEditor';
import { accountShortcuts } from '../../../data/shortcodes';
import TagChip, { chipStyle } from '../../../components/TagChip';
import { Avatar, Modal, Toggle, cx, initials } from '../../../components/ui';
import { useData } from '../../../context/DataContext';
import { TEAM_MEMBERS } from '../../../data/sampleData';
import {
  DURATION_OPTIONS, PRIORITY_STYLE, STATUS_STYLE, TASK_PRIORITIES, TASK_STATUSES, emptyTaskTemplate,
} from '../../../data/taskTemplates';

const LIST_PATH = '/firmtemp/templates/tasks';
const TEAM_OPTIONS = TEAM_MEMBERS.map((m) => ({ ...m, value: m.label })); // assignees are stored by name
const clone = (o) => JSON.parse(JSON.stringify(o));

/* ---------- small building blocks (same look as the rest of the app) ---------- */
function Section({ title, icon, description, children }) {
  return (
    <section className="card p-5 sm:p-6">
      <div className="mb-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold">{icon}{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function SwitchRow({ label, description, checked, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-md border border-line p-3.5">
      <div><div className="font-semibold">{label}</div>{description && <div className="text-sm text-muted">{description}</div>}</div>
      <Toggle label={label} checked={checked} onChange={onChange} />
    </div>
  );
}

function PillSelect({ label, options, value, onChange, styles }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button key={o} type="button" role="radio" aria-checked={value === o} onClick={() => onChange(o)}
          className={cx('min-h-[38px] rounded-full px-3.5 text-sm font-semibold ring-offset-2 transition',
            styles[o], value === o ? 'ring-2 ring-brand-600' : 'opacity-70 hover:opacity-100')}>
          {o}
        </button>
      ))}
    </div>
  );
}

/**
 * Create / edit a task template.
 *   /firmtemp/templates/tasks/new          → create
 *   /firmtemp/templates/tasks/:templateId  → edit
 */
export default function TaskTemplateForm() {
  const { templateId } = useParams();
  return <FormPage key={templateId || 'new'} editingId={templateId} />;
}

function FormPage({ editingId }) {
  const navigate = useNavigate();
  const data = useData();
  const { taskTemplates = [], saveTaskTemplate, deleteTaskTemplates, tags = [], createTag } = data;
  const existing = editingId ? taskTemplates.find((t) => t.id === editingId) : null;

  const initial = useMemo(() => clone(existing || emptyTaskTemplate), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [form, setForm] = useState(initial);
  const [saved, setSaved] = useState(initial);   // last saved version (for "unsaved changes")
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState(null);      // 'discard' | 'delete'
  const [toast, setToast] = useState('');
  const [dragIndex, setDragIndex] = useState(null);
  const dirty = JSON.stringify(form) !== JSON.stringify(saved);
  const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 2600); };

  useEffect(() => {
    if (!dirty) return undefined;
    const h = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  if (!saveTaskTemplate) {
    return (
      <div role="alert" className="card border-danger-200 bg-danger-50 p-6 text-danger-700">
        <h2 className="text-lg font-bold">Task templates are not set up in DataContext.js</h2>
        <p className="mt-1">Add <code className="font-mono">taskTemplates</code> and <code className="font-mono">saveTaskTemplate</code> to <code className="font-mono">src/context/DataContext.js</code>, then reload.</p>
      </div>
    );
  }

  if (editingId && !existing) {
    return (
      <div className="flex flex-col items-start gap-4">
        <h1 className="text-3xl font-bold">Task template not found</h1>
        <Link to={LIST_PATH} className="btn-primary">Back to task templates</Link>
      </div>
    );
  }

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })); };

  /* ---------- subtasks ---------- */
  const subtasks = form.subtasks || [];
  const setSubtasks = (list) => set('subtasks', list);
  const handleAddSubtask = () => setSubtasks([...subtasks, { id: `s-${Date.now()}`, text: '', checked: false }]);
  const handleInputChange = (id, text) => setSubtasks(subtasks.map((s) => (s.id === id ? { ...s, text } : s)));
  const handleCheckboxChange = (id) => setSubtasks(subtasks.map((s) => (s.id === id ? { ...s, checked: !s.checked } : s)));
  const handleDeleteSubtask = (id) => setSubtasks(subtasks.filter((s) => s.id !== id));
  const moveSubtask = (from, to) => {
    if (to < 0 || to >= subtasks.length || from === to) return;
    const list = [...subtasks];
    const [item] = list.splice(from, 1);
    list.splice(to, 0, item);
    setSubtasks(list);
  };
  const handleSubtaskSwitch = (val) => { set('SubtaskSwitch', val); if (val && subtasks.length === 0) setSubtasks([{ id: `s-${Date.now()}`, text: '', checked: false }]); };

  /* ---------- save ---------- */
  const validate = () => {
    const e = {};
    if (!form.templatename.trim()) e.templatename = 'Template name is required.';
    if (form.absoluteDate && form.startDate && form.dueDate && form.dueDate < form.startDate) e.dueDate = 'Due date must be on or after the start date.';
    setErrors(e);
    if (Object.keys(e).length) window.scrollTo({ top: 0, behavior: 'smooth' });
    return Object.keys(e).length === 0;
  };
  const persist = () => {
    const data = {
      ...form,
      templatename: form.templatename.trim(),
      startsin: Number(form.startsin) || 0,
      duein: Number(form.duein) || 0,
      subtasks: form.SubtaskSwitch ? subtasks.filter((s) => s.text.trim()).map((s) => ({ ...s, text: s.text.trim() })) : [],
    };
    const id = saveTaskTemplate(data);
    return { ...data, id };
  };
  const createSaveTaskTemp = () => {                 // Save (stay on the page)
    if (!validate()) return;
    setSaving(true);
    const data = persist();
    setForm(data); setSaved(data); setSaving(false);
    notify(`Saved “${data.templatename}”`);
    if (!editingId) navigate(`${LIST_PATH}/${data.id}`, { replace: true });
  };
  const createTaskTemp = () => {                     // Save & Exit
    if (!validate()) return;
    setSaving(true);
    const data = persist();
    navigate(LIST_PATH, { state: { toast: editingId ? `Saved “${data.templatename}”` : `Created “${data.templatename}”` } });
  };
  const handleTaskCancel = () => (dirty ? setModal('discard') : navigate(LIST_PATH));

  const dateInput = 'input';
  const durationSelect = (key) => (
    <select aria-label="Unit" className="input" value={form[key]} onChange={(e) => set(key, e.target.value)}>
      {DURATION_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header (title + actions) */}
      <header className="flex flex-wrap items-center gap-4">
        <button onClick={handleTaskCancel} aria-label="Back to task templates" className="flex h-10 w-10 items-center justify-center rounded border border-line-strong bg-surface hover:bg-subtle"><FiArrowLeft size={18} /></button>
        <div className="min-w-0 flex-1">
          <nav aria-label="Breadcrumb" className="text-sm text-muted">
            <Link to="/firmtemp/templates" className="hover:underline">Firm Templates</Link> / <Link to={LIST_PATH} className="hover:underline">Tasks</Link>
          </nav>
          <h1 className="truncate text-2xl font-bold sm:text-3xl">{editingId ? 'Edit Task Template' : 'Create Task Template'}</h1>
          <p className="text-muted">Configure your task template settings</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {editingId && <button type="button" className="btn border border-danger-200 bg-surface text-danger-700 hover:bg-danger-50" onClick={() => setModal('delete')} disabled={saving}><FiTrash2 aria-hidden="true" /> Delete</button>}
          <button type="button" className="btn-secondary" onClick={handleTaskCancel} disabled={saving}>Cancel</button>
          <button type="button" className="btn border border-brand-600 bg-brand-50 text-brand-600 hover:bg-brand-100" onClick={createSaveTaskTemp} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          <button type="button" className="btn-primary" onClick={createTaskTemp} disabled={saving}>{saving ? 'Saving…' : 'Save & Exit'}</button>
        </div>
      </header>

      {dirty && <div className="rounded-md border border-warning-300 bg-warning-50 px-4 py-2.5 text-sm font-semibold text-warning-700">You have unsaved changes.</div>}
      {Object.values(errors).some(Boolean) && <div role="alert" className="rounded-md bg-danger-50 px-4 py-3 font-semibold text-danger-700">Please fix the highlighted fields.</div>}

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-6">
          {/* General */}
          <Section title="General" icon={<FiFileText aria-hidden="true" />}>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <label className="field-label">
                <span>Template Name <span className="text-danger-700">*</span></span>
                <input className={cx('input', errors.templatename && 'border-danger-700')} value={form.templatename}
                  onChange={(e) => set('templatename', e.target.value)} placeholder="Enter template name" />
                {errors.templatename && <span className="text-sm font-normal text-danger-700">{errors.templatename}</span>}
              </label>
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold">Status</span>
                <PillSelect label="Status" options={TASK_STATUSES} value={form.status} onChange={(v) => set('status', v)} styles={STATUS_STYLE} />
              </div>
              <div>
                <MultiSelect label="Assignees" placeholder="Select assignees" options={TEAM_OPTIONS} value={form.assignees}
                  onChange={(v) => set('assignees', v)}
                  renderOption={(o) => (
                    <span className="flex flex-1 items-center gap-2.5"><Avatar text={initials(o.label)} size="sm" />
                      <span><span className="block font-semibold">{o.label}</span><span className="block text-sm text-muted">{o.meta}</span></span></span>
                  )} />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold">Priority</span>
                <PillSelect label="Priority" options={TASK_PRIORITIES} value={form.priority} onChange={(v) => set('priority', v)} styles={PRIORITY_STYLE} />
              </div>
            </div>
          </Section>

          {/* Description */}
          <Section title="Description">
            <TextEditor ariaLabel="Description" value={form.description} onChange={(html) => set('description', html)} 
            shortcuts={accountShortcuts}
              placeholder="What should be done, and how? (shown on every task created from this template)" />
          </Section>

          {/* Tags */}
          <Section title="Tags" icon={<FiTag aria-hidden="true" />}>
            <MultiSelect placeholder="Select or search tags" options={tags} value={form.tags} onChange={(v) => set('tags', v)}
              creatable createLabel="Create tag" onCreate={createTag}
              chipStyle={(o) => chipStyle(o.color)} renderOption={(o) => <TagChip tag={o} />} />
          </Section>

          {/* Dates */}
          <Section title="Dates" icon={<FiCalendar aria-hidden="true" />}>
            <SwitchRow label="Use absolute dates" description="Set fixed calendar dates instead of relative offsets"
              checked={!!form.absoluteDate} onChange={(v) => set('absoluteDate', v)} />

            {form.absoluteDate ? (
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="field-label">Start Date
                  <input type="date" className={dateInput} value={form.startDate || ''} onChange={(e) => set('startDate', e.target.value)} />
                </label>
                <label className="field-label">Due Date
                  <input type="date" className={cx(dateInput, errors.dueDate && 'border-danger-700')} value={form.dueDate || ''} min={form.startDate || undefined} onChange={(e) => set('dueDate', e.target.value)} />
                  {errors.dueDate && <span className="text-sm font-normal text-danger-700">{errors.dueDate}</span>}
                </label>
              </div>
            ) : (
              <div className="mt-4 flex flex-col gap-3">
                <div className="grid grid-cols-[80px_1fr_140px] items-center gap-3">
                  <span className="text-sm font-semibold">Start in</span>
                  <input aria-label="Start in" className="input" type="number" min="0" placeholder="0" value={form.startsin} onChange={(e) => set('startsin', e.target.value)} />
                  {durationSelect('startsInDuration')}
                </div>
                <div className="grid grid-cols-[80px_1fr_140px] items-center gap-3">
                  <span className="text-sm font-semibold">Due in</span>
                  <input aria-label="Due in" className="input" type="number" min="0" placeholder="0" value={form.duein} onChange={(e) => set('duein', e.target.value)} />
                  {durationSelect('dueinduration')}
                </div>
              </div>
            )}
          </Section>
        </div>

        {/* RIGHT COLUMN */}
        <aside className="flex flex-col gap-6 xl:sticky xl:top-24">
          <Section title="Subtasks" icon={<FiList aria-hidden="true" />} description="Add checklist items to this task template">
            <SwitchRow label="Enable subtasks" description="Show a subtask checklist on every task created from this template"
              checked={!!form.SubtaskSwitch} onChange={handleSubtaskSwitch} />

            {form.SubtaskSwitch && (
              <div className="mt-4 flex flex-col gap-2">
                {subtasks.map((s, index) => (
                  <div key={s.id} draggable onDragStart={() => setDragIndex(index)} onDragEnd={() => setDragIndex(null)}
                    onDragOver={(e) => e.preventDefault()} onDrop={() => { moveSubtask(dragIndex, index); setDragIndex(null); }}
                    className={cx('flex items-center gap-2 rounded-md border bg-surface p-2', dragIndex === index ? 'border-brand-600 opacity-60' : 'border-line')}>
                    <span className="flex h-8 w-6 flex-none cursor-grab items-center justify-center text-muted" title="Drag to reorder" aria-hidden="true"><FiMenu /></span>
                    <input type="checkbox" checked={s.checked} onChange={() => handleCheckboxChange(s.id)} aria-label={`Subtask ${index + 1} done by default`} className="h-[18px] w-[18px] flex-none accent-brand-600" />
                    <input className="min-h-[38px] min-w-0 flex-1 rounded border border-transparent px-2 hover:border-line focus:border-brand-600 focus:outline-none"
                      value={s.text} onChange={(e) => handleInputChange(s.id, e.target.value)} placeholder={`Subtask ${index + 1}`} aria-label={`Subtask ${index + 1}`} />
                    <div className="flex flex-none">
                      <button type="button" onClick={() => moveSubtask(index, index - 1)} disabled={index === 0} aria-label={`Move subtask ${index + 1} up`} className="h-8 w-7 rounded text-muted hover:bg-subtle disabled:opacity-30">↑</button>
                      <button type="button" onClick={() => moveSubtask(index, index + 1)} disabled={index === subtasks.length - 1} aria-label={`Move subtask ${index + 1} down`} className="h-8 w-7 rounded text-muted hover:bg-subtle disabled:opacity-30">↓</button>
                      <button type="button" onClick={() => handleDeleteSubtask(s.id)} aria-label={`Delete subtask ${index + 1}`} className="flex h-8 w-8 items-center justify-center rounded text-danger-700 hover:bg-danger-50"><FiTrash2 aria-hidden="true" /></button>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={handleAddSubtask} className="btn border border-dashed border-line-strong bg-surface text-brand-600 hover:bg-subtle"><FiPlus aria-hidden="true" /> Add subtask</button>
                <p className="text-xs text-muted">Drag ☰ or use ↑ ↓ to reorder. Empty subtasks are removed when you save.</p>
              </div>
            )}
          </Section>
        </aside>
      </div>

      {modal === 'discard' && (
        <Modal title="Discard changes?" onClose={() => setModal(null)}
          footer={<><button className="btn-secondary" onClick={() => setModal(null)}>Keep editing</button><button className="btn bg-danger-700 text-white hover:bg-[#831E15]" onClick={() => navigate(LIST_PATH)}>Discard</button></>}>
          <p className="text-muted">Your changes to this task template haven't been saved.</p>
        </Modal>
      )}
      {modal === 'delete' && (
        <Modal title={`Delete “${existing?.templatename}”?`} onClose={() => setModal(null)}
          footer={<><button className="btn-secondary" onClick={() => setModal(null)}>Cancel</button><button className="btn bg-danger-700 text-white hover:bg-[#831E15]" onClick={() => { deleteTaskTemplates([editingId]); navigate(LIST_PATH, { state: { toast: `Deleted “${existing.templatename}”` } }); }}>Delete</button></>}>
          <p className="text-muted">Tasks already created from this template stay as they are.</p>
        </Modal>
      )}
      {toast && <div role="status" className="fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-md bg-ink px-5 py-3 font-semibold text-white">{toast}</div>}
    </div>
  );
}