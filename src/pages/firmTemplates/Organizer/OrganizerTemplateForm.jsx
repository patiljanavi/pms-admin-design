// import { useEffect, useMemo, useRef, useState } from 'react';
// import { Link, useNavigate, useParams } from 'react-router-dom';
// import { FiArrowLeft, FiCopy, FiEye, FiFileText, FiLayers, FiMenu, FiPlus, FiRepeat, FiSettings, FiSliders, FiTrash2, FiGitMerge } from 'react-icons/fi';
// import ShortcodeTextField from '../../../components/ShortcodeTextField';
// import OrganizerPreview from '../../../components/organizer/OrganizerPreview';
// import OrganizerSettingsDrawer from '../../../components/organizer/OrganizerSettingsDrawer';
// import QuestionCard from '../../../components/organizer/QuestionCard';
// import QuestionSettingsDrawer from '../../../components/organizer/QuestionSettingsDrawer';
// import SectionSettingsDrawer from '../../../components/organizer/SectionSettingsDrawer';
// import { Modal, cx } from '../../../components/ui';
// import { useData } from '../../../context/DataContext';
// import { accountShortcuts } from '../../../data/shortcodes';
// import {
//   QUESTION_TYPES, TEXT_BLOCK, choiceQuestions, cloneSection, emptyOrganizer, newQuestion, newSection, organizerErrors, questionCount,
// } from '../../../data/organizerTemplates';

// const LIST_PATH = '/firmtemp/templates/organizers';
// const clone = (o) => JSON.parse(JSON.stringify(o));
// const move = (list, from, to) => {
//   if (from == null || to < 0 || to >= list.length || from === to) return list;
//   const next = [...list];
//   const [x] = next.splice(from, 1);
//   next.splice(to, 0, x);
//   return next;
// };
// const truncate = (text, words = 5) => { const w = (text || '').split(' '); return w.length > words ? `${w.slice(0, words).join(' ')} …` : text; };

// /** "+ Questions" button with a menu of question types. */
// function AddQuestionMenu({ onPick }) {
//   const [open, setOpen] = useState(false);
//   const box = useRef(null);
//   useEffect(() => {
//     const h = (e) => { if (!box.current?.contains(e.target)) setOpen(false); };
//     document.addEventListener('mousedown', h);
//     return () => document.removeEventListener('mousedown', h);
//   }, []);
//   return (
//     <div ref={box} className="relative">
//       <button type="button" className="btn-primary" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}
//         onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); } }}><FiPlus aria-hidden="true" /> Questions</button>
//       {open && (
//         <ul role="menu" aria-label="Question types" className="absolute bottom-full left-0 z-40 mb-1 w-56 rounded-md border border-line bg-surface p-1 shadow-pop">
//           {QUESTION_TYPES.map((t) => (
//             <li key={t} role="none"><button type="button" role="menuitem" onClick={() => { onPick(t); setOpen(false); }} className="w-full rounded px-3 py-2 text-left text-sm hover:bg-subtle focus:bg-brand-50 focus:outline-none">{t}</button></li>
//           ))}
//         </ul>
//       )}
//     </div>
//   );
// }

// /**
//  * Create / edit an organizer template (same pattern as the other template forms).
//  *   /firmtemp/templates/organizers/new          → create
//  *   /firmtemp/templates/organizers/:templateId  → edit
//  */
// export default function OrganizerTemplateForm() {
//   const { templateId } = useParams();
//   return <OrganizerBuilder key={templateId || 'new'} editingId={templateId} />;
// }

// function OrganizerBuilder({ editingId }) {
//   const navigate = useNavigate();
//   const { organizerTemplates = [], saveOrganizerTemplate, deleteOrganizerTemplates, organizerTemplateNameTaken } = useData();
//   const existing = editingId ? organizerTemplates.find((t) => String(t.id) === String(editingId)) : null;
//   const mode = editingId ? 'edit' : 'create';

//   const initial = useMemo(() => (existing ? clone(existing) : { ...emptyOrganizer(), sections: [newSection('Section 1')] }), []); // eslint-disable-line react-hooks/exhaustive-deps
//   const [form, setForm] = useState(initial);
//   const [saved, setSaved] = useState(initial);
//   const [selectedId, setSelectedId] = useState(initial.sections[0]?.id || null);
//   const [showErrors, setShowErrors] = useState(false);
//   const [panel, setPanel] = useState(null);       // 'preview' | 'settings' | 'section' | { question } | 'discard' | 'delete'
//   const [dragSection, setDragSection] = useState(null);
//   const [dragQuestion, setDragQuestion] = useState(null);
//   const [toast, setToast] = useState('');
//   const dirty = JSON.stringify(form) !== JSON.stringify(saved);
//   const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 2600); };
//   const errors = organizerErrors(form, organizerTemplateNameTaken?.(form.templatename, editingId));
//   const errorList = showErrors ? Object.values(errors) : [];

//   useEffect(() => {
//     if (!dirty) return undefined;
//     const h = (e) => { e.preventDefault(); e.returnValue = ''; };
//     window.addEventListener('beforeunload', h);
//     return () => window.removeEventListener('beforeunload', h);
//   }, [dirty]);

//   if (!saveOrganizerTemplate) return <div role="alert" className="card bg-danger-50 p-6 font-semibold text-danger-700">Organizer templates are not set up in DataContext.js</div>;
//   if (editingId && !existing) {
//     return (
//       <div className="flex flex-col items-start gap-4">
//         <h1 className="text-3xl font-bold">Organizer template not found</h1>
//         <Link to={LIST_PATH} className="btn-primary">Back to organizers</Link>
//       </div>
//     );
//   }

//   const set = (changes) => setForm((f) => ({ ...f, ...changes }));
//   const setSections = (fn) => setForm((f) => ({ ...f, sections: fn(f.sections) }));
//   const section = form.sections.find((s) => s.id === selectedId) || null;
//   const sectionIndex = form.sections.findIndex((s) => s.id === selectedId);
//   const updateSection = (changes) => setSections((list) => list.map((s) => (s.id === selectedId ? { ...s, ...changes } : s)));
//   const setQuestions = (fn) => setSections((list) => list.map((s) => (s.id === selectedId ? { ...s, formElements: fn(s.formElements) } : s)));
//   const allChoice = choiceQuestions(form.sections);

//   /* sections */
//   const addSection = () => { const s = newSection(`Section ${form.sections.length + 1}`); setSections((l) => [...l, s]); setSelectedId(s.id); };
//   const duplicateSection = () => { const copy = cloneSection(section); setSections((l) => { const n = [...l]; n.splice(sectionIndex + 1, 0, copy); return n; }); setSelectedId(copy.id); };
//   const deleteSection = () => {
//     const rest = form.sections.filter((s) => s.id !== selectedId);
//     setSections(() => rest);
//     setSelectedId(rest[Math.min(sectionIndex, rest.length - 1)]?.id || null);
//   };

//   /* save */
//   const persist = () => {
//     const id = saveOrganizerTemplate({ ...form, id: editingId || undefined, templatename: form.templatename.trim(), organizerName: form.organizerName.trim() });
//     return { ...form, id };
//   };
//   const saveOrganizerTemp = () => {               // Save / Update (stay)
//     setShowErrors(true);
//     if (Object.keys(errors).length) { window.scrollTo?.({ top: 0, behavior: 'smooth' }); return; }
//     const data = persist();
//     setForm(data); setSaved(data); setShowErrors(false);
//     notify(mode === 'edit' ? 'Organizer template updated successfully' : 'Organizer template created successfully');
//     if (!editingId) navigate(`${LIST_PATH}/${data.id}`, { replace: true });
//   };
//   const saveandexitOrganizerTemp = () => {        // Save & exit / Update & exit
//     setShowErrors(true);
//     if (Object.keys(errors).length) { window.scrollTo?.({ top: 0, behavior: 'smooth' }); return; }
//     const data = persist();
//     navigate(LIST_PATH, { state: { toast: mode === 'edit' ? `Updated “${data.templatename}”` : `Created “${data.templatename}”` } });
//   };
//   const handleCancel = () => (dirty ? setPanel('discard') : navigate(LIST_PATH));

//   return (
//     <div className="flex flex-col gap-6">
//       {/* Header */}
//       <header className="flex flex-wrap items-start gap-4">
//         <button onClick={handleCancel} aria-label="Back to organizers" className="mt-1 flex h-10 w-10 flex-none items-center justify-center rounded border border-line-strong bg-surface hover:bg-subtle"><FiArrowLeft size={18} /></button>
//         <div className="min-w-0 flex-1">
//           <nav aria-label="Breadcrumb" className="text-sm text-muted">
//             <Link to="/firmtemp/templates" className="hover:underline">Firm Templates</Link> <span aria-hidden="true">/</span> <Link to={LIST_PATH} className="hover:underline">Organizers</Link>
//           </nav>
//           <h1 className="truncate text-2xl font-bold sm:text-3xl">{mode === 'edit' ? 'Edit Organizer Template' : 'Create Organizer Template'}</h1>
//           <p className="text-muted">Customize your organizer template</p>
//         </div>
//         <div className="flex flex-wrap gap-2">
//           <button type="button" className="btn-secondary" onClick={() => setPanel('preview')}><FiEye aria-hidden="true" /> Preview</button>
//           <button type="button" className="btn-secondary" onClick={() => setPanel('settings')}><FiSliders aria-hidden="true" /> Organizer settings</button>
//           {mode === 'edit' && <button type="button" className="btn border border-danger-200 bg-surface text-danger-700 hover:bg-danger-50" onClick={() => setPanel('delete')}><FiTrash2 aria-hidden="true" /> Delete</button>}
//         </div>
//       </header>

//       {errorList.length > 0 && (
//         <div role="alert" className="rounded-md border border-danger-200 bg-danger-50 px-4 py-3 text-danger-700">
//           <p className="font-semibold">Please fix the following:</p>
//           <ul className="mt-1 list-disc pl-5 text-sm">{errorList.map((m) => <li key={m}>{m}</li>)}</ul>
//         </div>
//       )}

//       {/* General */}
//       <section className="card overflow-hidden">
//         <header className="flex items-center gap-3 border-b border-line bg-subtle/60 px-5 py-4 sm:px-6">
//           <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white" aria-hidden="true">1</span>
//           <div><h2 className="font-semibold">General</h2><p className="text-sm text-muted">The template name is internal; clients see the organizer name</p></div>
//         </header>
//         <div className="grid grid-cols-1 gap-5 p-5 sm:p-6 md:grid-cols-2">
//           <label className="field-label">
//             <span>Template Name <span className="text-danger-700">*</span></span>
//             <input className={cx('input', showErrors && errors.templatename && 'border-danger-700')} value={form.templatename} onChange={(e) => set({ templatename: e.target.value })} placeholder="Template name" />
//             {showErrors && errors.templatename && <span className="text-sm font-normal text-danger-700">{errors.templatename}</span>}
//           </label>
//           <ShortcodeTextField label="Organizer name" required value={form.organizerName} onChange={(v) => set({ organizerName: v })} placeholder="Organizer name, e.g. [CURRENT_YEAR] tax organizer"
//             shortcuts={accountShortcuts} error={showErrors ? errors.organizerName : undefined} />
//         </div>
//       </section>

//       {/* Sections builder */}
//       <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
//         {/* Left: section list */}
//         <section className="card overflow-hidden lg:sticky lg:top-24">
//           <header className="flex items-center gap-3 border-b border-line bg-subtle/60 px-5 py-4">
//             <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white" aria-hidden="true">2</span>
//             <div className="flex-1"><h2 className="font-semibold">Sections</h2><p className="text-xs text-muted">{form.sections.length} sections · {questionCount(form)} questions</p></div>
//           </header>
//           <div className="p-3">
//             <ol aria-label="Sections" className="flex flex-col gap-1.5">
//               {form.sections.map((s, i) => {
//                 const on = s.id === selectedId;
//                 return (
//                   <li key={s.id} draggable onDragStart={() => setDragSection(i)} onDragEnd={() => setDragSection(null)} onDragOver={(e) => e.preventDefault()}
//                     onDrop={() => { setSections((l) => move(l, dragSection, i)); setDragSection(null); }}
//                     className={cx('group flex items-center gap-1 rounded-md border pr-1 transition-colors', on ? 'border-brand-600 bg-brand-50' : 'border-line bg-surface hover:bg-subtle', dragSection === i && 'opacity-50')}>
//                     <span className="flex h-10 w-6 flex-none cursor-grab items-center justify-center text-muted" aria-hidden="true"><FiMenu size={14} /></span>
//                     <button type="button" onClick={() => setSelectedId(s.id)} aria-current={on ? 'true' : undefined} className="flex min-w-0 flex-1 items-center gap-2 py-2 text-left">
//                       <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-subtle px-1 text-[11px] font-bold text-muted">{i + 1}</span>
//                       <span className={cx('truncate text-sm', on && 'font-semibold')}>{truncate(s.text) || <span className="italic text-muted">Untitled section</span>}</span>
//                     </button>
//                     {s.sectionsettings?.conditional && <FiGitMerge size={13} className="flex-none text-success-700" aria-label="Conditional section" />}
//                     {s.sectionsettings?.sectionRepeatingMode && <FiRepeat size={13} className="flex-none text-brand-600" aria-label="Repeatable section" />}
//                     <span className="flex flex-none flex-col opacity-60 group-hover:opacity-100">
//                       <button type="button" onClick={() => setSections((l) => move(l, i, i - 1))} disabled={i === 0} aria-label={`Move section ${i + 1} up`} className="h-4 text-[10px] leading-none text-muted disabled:opacity-30">▲</button>
//                       <button type="button" onClick={() => setSections((l) => move(l, i, i + 1))} disabled={i === form.sections.length - 1} aria-label={`Move section ${i + 1} down`} className="h-4 text-[10px] leading-none text-muted disabled:opacity-30">▼</button>
//                     </span>
//                   </li>
//                 );
//               })}
//             </ol>
//             <button type="button" onClick={addSection} className="btn mt-3 w-full border border-dashed border-line-strong bg-surface text-brand-600 hover:bg-subtle"><FiPlus aria-hidden="true" /> New section</button>
//           </div>
//         </section>

//         {/* Right: section editor */}
//         {section ? (
//           <section aria-label="Section editor" className="card overflow-hidden">
//             <header className="flex flex-wrap items-center gap-2 border-b border-line bg-subtle/60 px-5 py-3">
//               <FiLayers className="text-brand-600" aria-hidden="true" />
//               <input aria-label="Section title" className={cx('min-h-[40px] min-w-[200px] flex-1 rounded border bg-surface px-3 font-semibold focus:border-brand-600 focus:outline-none', showErrors && !section.text.trim() ? 'border-danger-700' : 'border-line')}
//                 value={section.text} placeholder="Section title" onChange={(e) => updateSection({ text: e.target.value })} />
//               {section.sectionsettings?.conditional && <span className="rounded-full bg-success-50 px-2 py-0.5 text-xs font-semibold text-success-700">Conditional section</span>}
//               {section.sectionsettings?.sectionRepeatingMode && <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-800">Repeatable</span>}
//               <span className="flex gap-0.5">
//                 <button type="button" onClick={duplicateSection} aria-label="Duplicate section" title="Duplicate section" className="flex h-9 w-9 items-center justify-center rounded text-muted hover:bg-surface hover:text-ink"><FiCopy aria-hidden="true" /></button>
//                 <button type="button" onClick={() => setPanel('section')} aria-label="Section settings" title="Section settings" className="flex h-9 w-9 items-center justify-center rounded text-muted hover:bg-surface hover:text-ink"><FiSettings aria-hidden="true" /></button>
//                 <button type="button" onClick={deleteSection} aria-label="Delete section" title="Delete section" className="flex h-9 w-9 items-center justify-center rounded text-danger-700 hover:bg-danger-50"><FiTrash2 aria-hidden="true" /></button>
//               </span>
//             </header>
//             <div className="p-4 sm:p-5">
//               <ol aria-label="Questions" className="flex flex-col gap-3">
//                 {section.formElements.map((q, i) => (
//                   <QuestionCard key={q.id} q={q} index={i} total={section.formElements.length} dragging={dragQuestion === i}
//                     dragProps={{ draggable: true, onDragStart: () => setDragQuestion(i), onDragEnd: () => setDragQuestion(null), onDragOver: (e) => e.preventDefault(), onDrop: () => { setQuestions((l) => move(l, dragQuestion, i)); setDragQuestion(null); } }}
//                     onChange={(next) => setQuestions((l) => l.map((x) => (x.id === q.id ? next : x)))}
//                     onDelete={() => setQuestions((l) => l.filter((x) => x.id !== q.id))}
//                     onSettings={() => setPanel({ question: q })}
//                     onMove={(dir) => setQuestions((l) => move(l, i, i + dir))} />
//                 ))}
//               </ol>
//               {!section.formElements.length && <p className="rounded-md border border-dashed border-line-strong p-8 text-center text-muted">No questions yet. Add a question or a text block.</p>}
//               <div className="mt-5 flex flex-wrap gap-3">
//                 <AddQuestionMenu onPick={(type) => setQuestions((l) => [...l, newQuestion(type, section.id)])} />
//                 <button type="button" className="btn-secondary" onClick={() => setQuestions((l) => [...l, newQuestion(TEXT_BLOCK, section.id)])}><FiFileText aria-hidden="true" /> Text Block</button>
//               </div>
//             </div>
//           </section>
//         ) : (
//           <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-line-strong text-muted">Select a section to start editing, or add a new one.</div>
//         )}
//       </div>

//       {/* Sticky action bar */}
//       <div className="sticky bottom-0 z-10 -mx-4 -mb-6 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-10 lg:-mb-8 lg:px-10">
//         <div className="flex flex-wrap items-center justify-end gap-2.5">
//           {dirty && <span className="mr-auto flex items-center gap-2 text-sm font-semibold text-warning-700"><span className="h-2 w-2 rounded-full bg-warning-700" aria-hidden="true" />Unsaved changes</span>}
//           <button type="button" className="btn-secondary" onClick={handleCancel}>Cancel</button>
//           <button type="button" className="btn border border-brand-600 bg-brand-50 text-brand-600 hover:bg-brand-100" onClick={saveOrganizerTemp}>{mode === 'edit' ? 'Update' : 'Save'}</button>
//           <button type="button" className="btn-primary" onClick={saveandexitOrganizerTemp}>{mode === 'edit' ? 'Update & exit' : 'Save & exit'}</button>
//         </div>
//       </div>

//       {/* Drawers & modals */}
//       {panel === 'preview' && <OrganizerPreview organizer={form} onClose={() => setPanel(null)} />}
//       {panel === 'settings' && <OrganizerSettingsDrawer settings={form.organizersettings} onClose={() => setPanel(null)} onSave={(st) => { set({ organizersettings: st }); setPanel(null); }} />}
//       {panel === 'section' && section && (
//         <SectionSettingsDrawer section={section} questions={allChoice.filter((q) => q.sectionid !== section.id)} onClose={() => setPanel(null)}
//           onSave={(st) => { updateSection({ sectionsettings: st }); setPanel(null); }} />
//       )}
//       {panel?.question && (
//         <QuestionSettingsDrawer question={panel.question} questions={allChoice.filter((q) => q.id !== panel.question.id)} onClose={() => setPanel(null)}
//           onSave={(st) => { setSections((list) => list.map((s) => ({ ...s, formElements: s.formElements.map((x) => (x.id === panel.question.id ? { ...x, questionsectionsettings: st } : x)) }))); setPanel(null); }} />
//       )}
//       {panel === 'discard' && (
//         <Modal title="Discard changes?" onClose={() => setPanel(null)}
//           footer={<><button className="btn-secondary" onClick={() => setPanel(null)}>Keep editing</button><button className="btn bg-danger-700 text-white hover:bg-[#831E15]" onClick={() => navigate(LIST_PATH)}>Discard</button></>}>
//           <p className="text-muted">Your changes to this organizer haven't been saved.</p>
//         </Modal>
//       )}
//       {panel === 'delete' && (
//         <Modal title={`Delete “${saved.templatename}”?`} onClose={() => setPanel(null)}
//           footer={<><button className="btn-secondary" onClick={() => setPanel(null)}>Cancel</button><button className="btn bg-danger-700 text-white hover:bg-[#831E15]" onClick={() => { deleteOrganizerTemplates([editingId]); navigate(LIST_PATH, { state: { toast: `Deleted “${saved.templatename}”` } }); }}>Delete</button></>}>
//           <p className="text-muted">Organizers already sent to clients are not affected.</p>
//         </Modal>
//       )}
//       {toast && <div role="status" className="fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-md bg-ink px-5 py-3 font-semibold text-white">{toast}</div>}
//     </div>
//   );
// }

import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiCopy, FiEye, FiFileText, FiLayers, FiMenu, FiPlus, FiRepeat, FiSettings, FiSliders, FiTrash2, FiGitMerge } from 'react-icons/fi';
import MenuButton from '../../../components/organizer/MenuButton';
import ShortcodeTextField from '../../../components/ShortcodeTextField';
import OrganizerPreview from '../../../components/organizer/OrganizerPreview';
import OrganizerSettingsDrawer from '../../../components/organizer/OrganizerSettingsDrawer';
import QuestionCard from '../../../components/organizer/QuestionCard';
import QuestionSettingsDrawer from '../../../components/organizer/QuestionSettingsDrawer';
import SectionSettingsDrawer from '../../../components/organizer/SectionSettingsDrawer';
import { Modal, cx } from '../../../components/ui';
import { useData } from '../../../context/DataContext';
import { accountShortcuts } from '../../../data/shortcodes';
import {
  QUESTION_TYPES, TEXT_BLOCK, choiceQuestions, cloneSection, emptyOrganizer, newQuestion, newSection, organizerErrors, questionCount,
} from '../../../data/organizerTemplates';

const LIST_PATH = '/firmtemp/templates/organizers';
const clone = (o) => JSON.parse(JSON.stringify(o));
const move = (list, from, to) => {
  if (from == null || to < 0 || to >= list.length || from === to) return list;
  const next = [...list];
  const [x] = next.splice(from, 1);
  next.splice(to, 0, x);
  return next;
};
const truncate = (text, words = 5) => { const w = (text || '').split(' '); return w.length > words ? `${w.slice(0, words).join(' ')} …` : text; };

/** "+ Questions" button with a menu of question types (opens above the page, never clipped). */
function AddQuestionMenu({ onPick }) {
  return (
    <MenuButton label={<><FiPlus aria-hidden="true" /> Questions</>} items={QUESTION_TYPES} onPick={onPick}
      menuLabel="Question types" className="btn-primary" menuWidth={224} />
  );
}

/**
 * Create / edit an organizer template (same pattern as the other template forms).
 *   /firmtemp/templates/organizers/new          → create
 *   /firmtemp/templates/organizers/:templateId  → edit
 */
export default function OrganizerTemplateForm() {
  const { templateId } = useParams();
  return <OrganizerBuilder key={templateId || 'new'} editingId={templateId} />;
}

function OrganizerBuilder({ editingId }) {
  const navigate = useNavigate();
  const { organizerTemplates = [], saveOrganizerTemplate, deleteOrganizerTemplates, organizerTemplateNameTaken } = useData();
  const existing = editingId ? organizerTemplates.find((t) => String(t.id) === String(editingId)) : null;
  const mode = editingId ? 'edit' : 'create';

  const initial = useMemo(() => (existing ? clone(existing) : { ...emptyOrganizer(), sections: [newSection('Section 1')] }), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [form, setForm] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [selectedId, setSelectedId] = useState(initial.sections[0]?.id || null);
  const [showErrors, setShowErrors] = useState(false);
  const [panel, setPanel] = useState(null);       // 'preview' | 'settings' | 'section' | { question } | 'discard' | 'delete'
  const [dragSection, setDragSection] = useState(null);
  const [dragQuestion, setDragQuestion] = useState(null);
  const [toast, setToast] = useState('');
  const dirty = JSON.stringify(form) !== JSON.stringify(saved);
  const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 2600); };
  const errors = organizerErrors(form, organizerTemplateNameTaken?.(form.templatename, editingId));
  const errorList = showErrors ? Object.values(errors) : [];

  useEffect(() => {
    if (!dirty) return undefined;
    const h = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  if (!saveOrganizerTemplate) return <div role="alert" className="card bg-danger-50 p-6 font-semibold text-danger-700">Organizer templates are not set up in DataContext.js</div>;
  if (editingId && !existing) {
    return (
      <div className="flex flex-col items-start gap-4">
        <h1 className="text-3xl font-bold">Organizer template not found</h1>
        <Link to={LIST_PATH} className="btn-primary">Back to organizers</Link>
      </div>
    );
  }

  const set = (changes) => setForm((f) => ({ ...f, ...changes }));
  const setSections = (fn) => setForm((f) => ({ ...f, sections: fn(f.sections) }));
  const section = form.sections.find((s) => s.id === selectedId) || null;
  const sectionIndex = form.sections.findIndex((s) => s.id === selectedId);
  const updateSection = (changes) => setSections((list) => list.map((s) => (s.id === selectedId ? { ...s, ...changes } : s)));
  const setQuestions = (fn) => setSections((list) => list.map((s) => (s.id === selectedId ? { ...s, formElements: fn(s.formElements) } : s)));
  const allChoice = choiceQuestions(form.sections);

  /* sections */
  const addSection = () => { const s = newSection(`Section ${form.sections.length + 1}`); setSections((l) => [...l, s]); setSelectedId(s.id); };
  const duplicateSection = () => { const copy = cloneSection(section); setSections((l) => { const n = [...l]; n.splice(sectionIndex + 1, 0, copy); return n; }); setSelectedId(copy.id); };
  const deleteSection = () => {
    const rest = form.sections.filter((s) => s.id !== selectedId);
    setSections(() => rest);
    setSelectedId(rest[Math.min(sectionIndex, rest.length - 1)]?.id || null);
  };

  /* save */
  const persist = () => {
    const id = saveOrganizerTemplate({ ...form, id: editingId || undefined, templatename: form.templatename.trim(), organizerName: form.organizerName.trim() });
    return { ...form, id };
  };
  const saveOrganizerTemp = () => {               // Save / Update (stay)
    setShowErrors(true);
    if (Object.keys(errors).length) { window.scrollTo?.({ top: 0, behavior: 'smooth' }); return; }
    const data = persist();
    setForm(data); setSaved(data); setShowErrors(false);
    notify(mode === 'edit' ? 'Organizer template updated successfully' : 'Organizer template created successfully');
    if (!editingId) navigate(`${LIST_PATH}/${data.id}`, { replace: true });
  };
  const saveandexitOrganizerTemp = () => {        // Save & exit / Update & exit
    setShowErrors(true);
    if (Object.keys(errors).length) { window.scrollTo?.({ top: 0, behavior: 'smooth' }); return; }
    const data = persist();
    navigate(LIST_PATH, { state: { toast: mode === 'edit' ? `Updated “${data.templatename}”` : `Created “${data.templatename}”` } });
  };
  const handleCancel = () => (dirty ? setPanel('discard') : navigate(LIST_PATH));

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-wrap items-start gap-4">
        <button onClick={handleCancel} aria-label="Back to organizers" className="mt-1 flex h-10 w-10 flex-none items-center justify-center rounded border border-line-strong bg-surface hover:bg-subtle"><FiArrowLeft size={18} /></button>
        <div className="min-w-0 flex-1">
          <nav aria-label="Breadcrumb" className="text-sm text-muted">
            <Link to="/firmtemp/templates" className="hover:underline">Firm Templates</Link> <span aria-hidden="true">/</span> <Link to={LIST_PATH} className="hover:underline">Organizers</Link>
          </nav>
          <h1 className="truncate text-2xl font-bold sm:text-3xl">{mode === 'edit' ? 'Edit Organizer Template' : 'Create Organizer Template'}</h1>
          <p className="text-muted">Customize your organizer template</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-secondary" onClick={() => setPanel('preview')}><FiEye aria-hidden="true" /> Preview</button>
          <button type="button" className="btn-secondary" onClick={() => setPanel('settings')}><FiSliders aria-hidden="true" /> Organizer settings</button>
          {mode === 'edit' && <button type="button" className="btn border border-danger-200 bg-surface text-danger-700 hover:bg-danger-50" onClick={() => setPanel('delete')}><FiTrash2 aria-hidden="true" /> Delete</button>}
        </div>
      </header>

      {errorList.length > 0 && (
        <div role="alert" className="rounded-md border border-danger-200 bg-danger-50 px-4 py-3 text-danger-700">
          <p className="font-semibold">Please fix the following:</p>
          <ul className="mt-1 list-disc pl-5 text-sm">{errorList.map((m) => <li key={m}>{m}</li>)}</ul>
        </div>
      )}

      {/* General */}
      <section className="card overflow-hidden">
        <header className="flex items-center gap-3 border-b border-line bg-subtle/60 px-5 py-4 sm:px-6">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white" aria-hidden="true">1</span>
          <div><h2 className="font-semibold">General</h2><p className="text-sm text-muted">The template name is internal; clients see the organizer name</p></div>
        </header>
        <div className="grid grid-cols-1 gap-5 p-5 sm:p-6 md:grid-cols-2">
          <label className="field-label">
            <span>Template Name <span className="text-danger-700">*</span></span>
            <input className={cx('input', showErrors && errors.templatename && 'border-danger-700')} value={form.templatename} onChange={(e) => set({ templatename: e.target.value })} placeholder="Template name" />
            {showErrors && errors.templatename && <span className="text-sm font-normal text-danger-700">{errors.templatename}</span>}
          </label>
          <ShortcodeTextField label="Organizer name" required value={form.organizerName} onChange={(v) => set({ organizerName: v })} placeholder="Organizer name, e.g. [CURRENT_YEAR] tax organizer"
            shortcuts={accountShortcuts} error={showErrors ? errors.organizerName : undefined} />
        </div>
      </section>

      {/* Sections builder */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        {/* Left: section list */}
        <section className="card overflow-hidden lg:sticky lg:top-24">
          <header className="flex items-center gap-3 border-b border-line bg-subtle/60 px-5 py-4">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white" aria-hidden="true">2</span>
            <div className="flex-1"><h2 className="font-semibold">Sections</h2><p className="text-xs text-muted">{form.sections.length} sections · {questionCount(form)} questions</p></div>
          </header>
          <div className="p-3">
            <ol aria-label="Sections" className="flex flex-col gap-1.5">
              {form.sections.map((s, i) => {
                const on = s.id === selectedId;
                return (
                  <li key={s.id} draggable onDragStart={() => setDragSection(i)} onDragEnd={() => setDragSection(null)} onDragOver={(e) => e.preventDefault()}
                    onDrop={() => { setSections((l) => move(l, dragSection, i)); setDragSection(null); }}
                    className={cx('group flex items-center gap-1 rounded-md border pr-1 transition-colors', on ? 'border-brand-600 bg-brand-50' : 'border-line bg-surface hover:bg-subtle', dragSection === i && 'opacity-50')}>
                    <span className="flex h-10 w-6 flex-none cursor-grab items-center justify-center text-muted" aria-hidden="true"><FiMenu size={14} /></span>
                    <button type="button" onClick={() => setSelectedId(s.id)} aria-current={on ? 'true' : undefined} className="flex min-w-0 flex-1 items-center gap-2 py-2 text-left">
                      <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-subtle px-1 text-[11px] font-bold text-muted">{i + 1}</span>
                      <span className={cx('truncate text-sm', on && 'font-semibold')}>{truncate(s.text) || <span className="italic text-muted">Untitled section</span>}</span>
                    </button>
                    {s.sectionsettings?.conditional && <FiGitMerge size={13} className="flex-none text-success-700" aria-label="Conditional section" />}
                    {s.sectionsettings?.sectionRepeatingMode && <FiRepeat size={13} className="flex-none text-brand-600" aria-label="Repeatable section" />}
                    <span className="flex flex-none flex-col opacity-60 group-hover:opacity-100">
                      <button type="button" onClick={() => setSections((l) => move(l, i, i - 1))} disabled={i === 0} aria-label={`Move section ${i + 1} up`} className="h-4 text-[10px] leading-none text-muted disabled:opacity-30">▲</button>
                      <button type="button" onClick={() => setSections((l) => move(l, i, i + 1))} disabled={i === form.sections.length - 1} aria-label={`Move section ${i + 1} down`} className="h-4 text-[10px] leading-none text-muted disabled:opacity-30">▼</button>
                    </span>
                  </li>
                );
              })}
            </ol>
            <button type="button" onClick={addSection} className="btn mt-3 w-full border border-dashed border-line-strong bg-surface text-brand-600 hover:bg-subtle"><FiPlus aria-hidden="true" /> New section</button>
          </div>
        </section>

        {/* Right: section editor */}
        {section ? (
          <section aria-label="Section editor" className="card overflow-hidden">
            <header className="flex flex-wrap items-center gap-2 border-b border-line bg-subtle/60 px-5 py-3">
              <FiLayers className="text-brand-600" aria-hidden="true" />
              <input aria-label="Section title" className={cx('min-h-[40px] min-w-[200px] flex-1 rounded border bg-surface px-3 font-semibold focus:border-brand-600 focus:outline-none', showErrors && !section.text.trim() ? 'border-danger-700' : 'border-line')}
                value={section.text} placeholder="Section title" onChange={(e) => updateSection({ text: e.target.value })} />
              {section.sectionsettings?.conditional && <span className="rounded-full bg-success-50 px-2 py-0.5 text-xs font-semibold text-success-700">Conditional section</span>}
              {section.sectionsettings?.sectionRepeatingMode && <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-800">Repeatable</span>}
              <span className="flex gap-0.5">
                <button type="button" onClick={duplicateSection} aria-label="Duplicate section" title="Duplicate section" className="flex h-9 w-9 items-center justify-center rounded text-muted hover:bg-surface hover:text-ink"><FiCopy aria-hidden="true" /></button>
                <button type="button" onClick={() => setPanel('section')} aria-label="Section settings" title="Section settings" className="flex h-9 w-9 items-center justify-center rounded text-muted hover:bg-surface hover:text-ink"><FiSettings aria-hidden="true" /></button>
                <button type="button" onClick={deleteSection} aria-label="Delete section" title="Delete section" className="flex h-9 w-9 items-center justify-center rounded text-danger-700 hover:bg-danger-50"><FiTrash2 aria-hidden="true" /></button>
              </span>
            </header>
            <div className="p-4 sm:p-5">
              <ol aria-label="Questions" className="flex flex-col gap-3">
                {section.formElements.map((q, i) => (
                  <QuestionCard key={q.id} q={q} index={i} total={section.formElements.length} dragging={dragQuestion === i}
                    dragProps={{ draggable: true, onDragStart: () => setDragQuestion(i), onDragEnd: () => setDragQuestion(null), onDragOver: (e) => e.preventDefault(), onDrop: () => { setQuestions((l) => move(l, dragQuestion, i)); setDragQuestion(null); } }}
                    onChange={(next) => setQuestions((l) => l.map((x) => (x.id === q.id ? next : x)))}
                    onDelete={() => setQuestions((l) => l.filter((x) => x.id !== q.id))}
                    onSettings={() => setPanel({ question: q })}
                    onMove={(dir) => setQuestions((l) => move(l, i, i + dir))} />
                ))}
              </ol>
              {!section.formElements.length && <p className="rounded-md border border-dashed border-line-strong p-8 text-center text-muted">No questions yet. Add a question or a text block.</p>}
              <div className="mt-5 flex flex-wrap gap-3">
                <AddQuestionMenu onPick={(type) => setQuestions((l) => [...l, newQuestion(type, section.id)])} />
                <button type="button" className="btn-secondary" onClick={() => setQuestions((l) => [...l, newQuestion(TEXT_BLOCK, section.id)])}><FiFileText aria-hidden="true" /> Text Block</button>
              </div>
            </div>
          </section>
        ) : (
          <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-line-strong text-muted">Select a section to start editing, or add a new one.</div>
        )}
      </div>

      {/* Sticky action bar */}
      <div className="sticky bottom-0 z-10 -mx-4 -mb-6 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-10 lg:-mb-8 lg:px-10">
        <div className="flex flex-wrap items-center justify-end gap-2.5">
          {dirty && <span className="mr-auto flex items-center gap-2 text-sm font-semibold text-warning-700"><span className="h-2 w-2 rounded-full bg-warning-700" aria-hidden="true" />Unsaved changes</span>}
          <button type="button" className="btn-secondary" onClick={handleCancel}>Cancel</button>
          <button type="button" className="btn border border-brand-600 bg-brand-50 text-brand-600 hover:bg-brand-100" onClick={saveOrganizerTemp}>{mode === 'edit' ? 'Update' : 'Save'}</button>
          <button type="button" className="btn-primary" onClick={saveandexitOrganizerTemp}>{mode === 'edit' ? 'Update & exit' : 'Save & exit'}</button>
        </div>
      </div>

      {/* Drawers & modals */}
      {panel === 'preview' && <OrganizerPreview organizer={form} onClose={() => setPanel(null)} />}
      {panel === 'settings' && <OrganizerSettingsDrawer settings={form.organizersettings} onClose={() => setPanel(null)} onSave={(st) => { set({ organizersettings: st }); setPanel(null); }} />}
      {panel === 'section' && section && (
        <SectionSettingsDrawer section={section} questions={allChoice.filter((q) => q.sectionid !== section.id)} onClose={() => setPanel(null)}
          onSave={(st) => { updateSection({ sectionsettings: st }); setPanel(null); }} />
      )}
      {panel?.question && (
        <QuestionSettingsDrawer question={panel.question} questions={allChoice.filter((q) => q.id !== panel.question.id)} onClose={() => setPanel(null)}
          onSave={(st) => { setSections((list) => list.map((s) => ({ ...s, formElements: s.formElements.map((x) => (x.id === panel.question.id ? { ...x, questionsectionsettings: st } : x)) }))); setPanel(null); }} />
      )}
      {panel === 'discard' && (
        <Modal title="Discard changes?" onClose={() => setPanel(null)}
          footer={<><button className="btn-secondary" onClick={() => setPanel(null)}>Keep editing</button><button className="btn bg-danger-700 text-white hover:bg-[#831E15]" onClick={() => navigate(LIST_PATH)}>Discard</button></>}>
          <p className="text-muted">Your changes to this organizer haven't been saved.</p>
        </Modal>
      )}
      {panel === 'delete' && (
        <Modal title={`Delete “${saved.templatename}”?`} onClose={() => setPanel(null)}
          footer={<><button className="btn-secondary" onClick={() => setPanel(null)}>Cancel</button><button className="btn bg-danger-700 text-white hover:bg-[#831E15]" onClick={() => { deleteOrganizerTemplates([editingId]); navigate(LIST_PATH, { state: { toast: `Deleted “${saved.templatename}”` } }); }}>Delete</button></>}>
          <p className="text-muted">Organizers already sent to clients are not affected.</p>
        </Modal>
      )}
      {toast && <div role="status" className="fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-md bg-ink px-5 py-3 font-semibold text-white">{toast}</div>}
    </div>
  );
}