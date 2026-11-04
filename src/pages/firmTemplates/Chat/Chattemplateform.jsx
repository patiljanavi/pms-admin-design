import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiBell, FiCheckSquare, FiFileText, FiMenu, FiMessageSquare, FiPlus, FiTrash2 } from 'react-icons/fi';
import ShortcodeTextField from '../../../components/ShortcodeTextField';
import TextEditor from '../../../components/TextEditor';
import { Modal, Toggle, cx } from '../../../components/ui';
import { useData } from '../../../context/DataContext';
import { SENDERS } from '../../../data/emailtemplates';
import { contactShortcuts } from '../../../data/shortcodes';
import { emptyChatTemplate } from '../../../data/chatTemplates';

const LIST_PATH = '/firmtemp/templates/chats';
const clone = (o) => JSON.parse(JSON.stringify(o));
/** Works whether a field calls onChange(text) or onChange(event). */
const textOf = (v) => (v && typeof v === 'object' && v.target ? v.target.value : v ?? '');

function Section({ title, icon, description, children }) {
  return (
    <section className="card p-5 sm:p-6">
      <div className="mb-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold">{icon}{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      </div>
      <div className="flex flex-col gap-4">{children}</div>
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

/**
 * Create / edit a chat template (same pattern as the task, email and job forms).
 *   /firmtemp/templates/chats/new          → create
 *   /firmtemp/templates/chats/:templateId  → edit
 */
export default function ChatTemplateForm() {
  const { templateId } = useParams();
  return <FormPage key={templateId || 'new'} editingId={templateId} />;
}

function FormPage({ editingId }) {
  const navigate = useNavigate();
  const { chatTemplates = [], saveChatTemplate, deleteChatTemplates, chatTemplateNameTaken } = useData();
  const existing = editingId ? chatTemplates.find((t) => String(t.id) === String(editingId)) : null;
  const isEditMode = !!editingId;

  const initial = useMemo(() => ({ ...clone(emptyChatTemplate), ...clone(existing || {}) }), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [form, setForm] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [errors, setErrors] = useState({});
  const [modal, setModal] = useState(null); // 'discard' | 'delete'
  const [toast, setToast] = useState('');
  const [dragIndex, setDragIndex] = useState(null);
  const dirty = JSON.stringify(form) !== JSON.stringify(saved);
  const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 2600); };
  const set = (k, v) => { const value = textOf(v); setForm((f) => ({ ...f, [k]: value })); setErrors((e) => ({ ...e, [k]: undefined })); };

  useEffect(() => {
    if (!dirty) return undefined;
    const h = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  if (!saveChatTemplate) return <div role="alert" className="card bg-danger-50 p-6 font-semibold text-danger-700">Chat templates are not set up in DataContext.js</div>;
  if (editingId && !existing) {
    return (
      <div className="flex flex-col items-start gap-4">
        <h1 className="text-3xl font-bold">Chat template not found</h1>
        <Link to={LIST_PATH} className="btn-primary">Back to chat templates</Link>
      </div>
    );
  }

  /* ---------- client tasks (subtasks) ---------- */
  const subtasks = form.subtasks || [];
  const setSubtasks = (list) => setForm((f) => ({ ...f, subtasks: list }));
  const handleAddSubtask = () => setSubtasks([...subtasks, { id: `s-${Date.now()}`, text: '', checked: false }]);
  const handleInputChange = (id, text) => setSubtasks(subtasks.map((s) => (s.id === id ? { ...s, text } : s)));
  const handleCheckboxChange = (id) => setSubtasks(subtasks.map((s) => (s.id === id ? { ...s, checked: !s.checked } : s)));
  const handleDeleteSubtask = (id) => setSubtasks(subtasks.filter((s) => s.id !== id));
  const moveSubtask = (from, to) => {
    if (from == null || to < 0 || to >= subtasks.length || from === to) return;
    const list = [...subtasks];
    const [item] = list.splice(from, 1);
    list.splice(to, 0, item);
    setSubtasks(list);
  };
  const handleSubtaskSwitch = (val) => {
    setForm((f) => ({ ...f, SubtaskSwitch: val, subtasks: val && !(f.subtasks || []).length ? [{ id: `s-${Date.now()}`, text: '', checked: false }] : f.subtasks }));
  };

  /* ---------- save ---------- */
  const validate = () => {
    const e = {};
    const name = form.templateName.trim();
    if (!name) e.templateName = 'Template name is required.';
    else if (chatTemplateNameTaken?.(name, editingId)) e.templateName = 'Another chat template already has this name.';
    if (!form.selecteduser) e.selecteduser = 'Choose who the chat is from.';
    if (!form.inputText.trim()) e.inputText = 'Subject is required.';
    if (form.sendReminders) {
      if (!(Number(form.daysuntilNextReminder) >= 1)) e.daysuntilNextReminder = 'Enter at least 1 day.';
      if (!(Number(form.noOfReminder) >= 1)) e.noOfReminder = 'Enter at least 1 reminder.';
    }
    setErrors(e);
    if (Object.keys(e).length) window.scrollTo?.({ top: 0, behavior: 'smooth' });
    return Object.keys(e).length === 0;
  };
  const persist = () => {
    const data = {
      ...form, id: editingId || undefined, templateName: form.templateName.trim(), inputText: form.inputText.trim(),
      daysuntilNextReminder: Number(form.daysuntilNextReminder) || 0, noOfReminder: Number(form.noOfReminder) || 0,
      subtasks: form.SubtaskSwitch ? subtasks.filter((s) => s.text.trim()).map((s) => ({ ...s, text: s.text.trim() })) : [],
    };
    const id = saveChatTemplate(data);
    return { ...data, id };
  };
  const saveSchat = () => {                        // Save (stay on the page)
    if (!validate()) return;
    const data = persist();
    setForm(data); setSaved(data);
    notify(`Saved “${data.templateName}”`);
    if (!editingId) navigate(`${LIST_PATH}/${data.id}`, { replace: true });
  };
  const savechat = () => {                         // Save & Exit
    if (!validate()) return;
    const data = persist();
    navigate(LIST_PATH, { state: { toast: editingId ? `Saved “${data.templateName}”` : `Created “${data.templateName}”` } });
  };
  const handleCloseChatTemp = () => (dirty ? setModal('discard') : navigate(LIST_PATH));

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-wrap items-center gap-4">
        <button onClick={handleCloseChatTemp} aria-label="Back to chat templates" className="flex h-10 w-10 items-center justify-center rounded border border-line-strong bg-surface hover:bg-subtle"><FiArrowLeft size={18} /></button>
        <div className="min-w-0 flex-1">
          <nav aria-label="Breadcrumb" className="text-sm text-muted">
            <Link to="/firmtemp/templates" className="hover:underline">Firm Templates</Link> / <Link to={LIST_PATH} className="hover:underline">Chats</Link>
          </nav>
          <h1 className="flex items-center gap-2 truncate text-2xl font-bold sm:text-3xl"><FiMessageSquare className="text-brand-600" aria-hidden="true" />{isEditMode ? 'Edit Chat Template' : 'Create Chat Template'}</h1>
          <p className="text-muted">Configure your chat template</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isEditMode && <button type="button" className="btn border border-danger-200 bg-surface text-danger-700 hover:bg-danger-50" onClick={() => setModal('delete')}><FiTrash2 aria-hidden="true" /> Delete</button>}
          <button type="button" className="btn-secondary" onClick={handleCloseChatTemp}>Cancel</button>
          <button type="button" className="btn border border-brand-600 bg-brand-50 text-brand-600 hover:bg-brand-100" onClick={saveSchat}>Save</button>
          <button type="button" className="btn-primary" onClick={savechat}>Save &amp; Exit</button>
        </div>
      </header>

      {dirty && <div className="rounded-md border border-warning-300 bg-warning-50 px-4 py-2.5 text-sm font-semibold text-warning-700">You have unsaved changes.</div>}
      {Object.values(errors).some(Boolean) && <div role="alert" className="rounded-md bg-danger-50 px-4 py-3 font-semibold text-danger-700">Please fix the highlighted fields.</div>}

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-6">
          <Section title="Template Details" icon={<FiFileText aria-hidden="true" />}>
            <label className="field-label">
              <span>Name <span className="text-danger-700">*</span></span>
              <input className={cx('input', errors.templateName && 'border-danger-700')} value={form.templateName} onChange={(e) => set('templateName', e.target.value)} placeholder="Template Name" />
              {errors.templateName && <span className="text-sm font-normal text-danger-700">{errors.templateName}</span>}
            </label>
            <label className="field-label">
              <span>From <span className="text-danger-700">*</span></span>
              <select className={cx('input', errors.selecteduser && 'border-danger-700')} value={form.selecteduser?.value || ''}
                onChange={(e) => set('selecteduser', SENDERS.find((o) => o.value === e.target.value) || null)}>
                <option value="">Select Sender</option>
                {SENDERS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
              {errors.selecteduser && <span className="text-sm font-normal text-danger-700">{errors.selecteduser}</span>}
            </label>
            <ShortcodeTextField label="Subject" required value={form.inputText} onChange={(v) => set('inputText', v)}
              placeholder="Enter chat subject..." shortcuts={contactShortcuts} error={errors.inputText} />
          </Section>

          <Section title="Description">
            <TextEditor ariaLabel="Chat message" value={form.description} onChange={(html) => set('description', html)} shortcuts={contactShortcuts}
              placeholder="Write the chat message…" minHeight={200} />
          </Section>

          <Section title="Reminders" icon={<FiBell aria-hidden="true" />}>
            <SwitchRow label="Send reminders to clients" description="Remind the client until they reply or finish their tasks"
              checked={!!form.sendReminders} onChange={(v) => set('sendReminders', v)} />
            {form.sendReminders && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="field-label">Days until next reminder
                  <input className={cx('input', errors.daysuntilNextReminder && 'border-danger-700')} type="number" min="1" placeholder="Days until next reminder"
                    value={form.daysuntilNextReminder} onChange={(e) => set('daysuntilNextReminder', e.target.value)} />
                  {errors.daysuntilNextReminder && <span className="text-sm font-normal text-danger-700">{errors.daysuntilNextReminder}</span>}
                </label>
                <label className="field-label">No. of reminders
                  <input className={cx('input', errors.noOfReminder && 'border-danger-700')} type="number" min="1" placeholder="Number of reminders"
                    value={form.noOfReminder} onChange={(e) => set('noOfReminder', e.target.value)} />
                  {errors.noOfReminder && <span className="text-sm font-normal text-danger-700">{errors.noOfReminder}</span>}
                </label>
              </div>
            )}
          </Section>
        </div>

        {/* RIGHT COLUMN: Client Tasks */}
        <aside className="flex flex-col gap-6 xl:sticky xl:top-24">
          <Section title="Client Tasks" icon={<FiCheckSquare aria-hidden="true" />} description="A checklist the client sees with this chat">
            <SwitchRow label="Enable Client Tasks" checked={!!form.SubtaskSwitch} onChange={handleSubtaskSwitch} />
            {form.SubtaskSwitch && (
              <div className="flex flex-col gap-2">
                {subtasks.map((s, index) => (
                  <div key={s.id} draggable onDragStart={() => setDragIndex(index)} onDragEnd={() => setDragIndex(null)}
                    onDragOver={(e) => e.preventDefault()} onDrop={() => { moveSubtask(dragIndex, index); setDragIndex(null); }}
                    className={cx('flex items-center gap-2 rounded-md border bg-surface p-2', dragIndex === index ? 'border-brand-600 opacity-60' : 'border-line')}>
                    <input type="checkbox" checked={s.checked} onChange={() => handleCheckboxChange(s.id)} aria-label={`Client task ${index + 1} done`} className="h-[18px] w-[18px] flex-none accent-brand-600" />
                    <input className="min-h-[38px] min-w-0 flex-1 rounded border border-transparent px-2 hover:border-line focus:border-brand-600 focus:outline-none"
                      value={s.text} onChange={(e) => handleInputChange(s.id, e.target.value)} placeholder="Things to do" aria-label={`Client task ${index + 1}`} />
                    <button type="button" onClick={() => moveSubtask(index, index - 1)} disabled={index === 0} aria-label={`Move client task ${index + 1} up`} className="h-8 w-7 flex-none rounded text-muted hover:bg-subtle disabled:opacity-30">↑</button>
                    <button type="button" onClick={() => moveSubtask(index, index + 1)} disabled={index === subtasks.length - 1} aria-label={`Move client task ${index + 1} down`} className="h-8 w-7 flex-none rounded text-muted hover:bg-subtle disabled:opacity-30">↓</button>
                    <button type="button" onClick={() => handleDeleteSubtask(s.id)} aria-label={`Delete client task ${index + 1}`} className="flex h-8 w-8 flex-none items-center justify-center rounded text-danger-700 hover:bg-danger-50"><FiTrash2 aria-hidden="true" /></button>
                    <span className="flex h-8 w-6 flex-none cursor-grab items-center justify-center text-muted" title="Drag to reorder" aria-hidden="true"><FiMenu /></span>
                  </div>
                ))}
                <button type="button" onClick={handleAddSubtask} className="btn w-full border border-dashed border-line-strong bg-surface text-brand-600 hover:bg-subtle"><FiPlus aria-hidden="true" /> Add Subtask</button>
                <p className="text-xs text-muted">Drag ☰ or use ↑ ↓ to reorder. Empty tasks are removed when you save.</p>
              </div>
            )}
          </Section>
        </aside>
      </div>

      {modal === 'discard' && (
        <Modal title="Discard changes?" onClose={() => setModal(null)}
          footer={<><button className="btn-secondary" onClick={() => setModal(null)}>Keep editing</button><button className="btn bg-danger-700 text-white hover:bg-[#831E15]" onClick={() => navigate(LIST_PATH)}>Discard</button></>}>
          <p className="text-muted">Your changes to this chat template haven't been saved.</p>
        </Modal>
      )}
      {modal === 'delete' && (
        <Modal title={`Delete “${saved.templateName}”?`} onClose={() => setModal(null)}
          footer={<><button className="btn-secondary" onClick={() => setModal(null)}>Cancel</button><button className="btn bg-danger-700 text-white hover:bg-[#831E15]" onClick={() => { deleteChatTemplates([editingId]); navigate(LIST_PATH, { state: { toast: `Deleted “${saved.templateName}”` } }); }}>Delete</button></>}>
          <p className="text-muted">Chats already sent from this template are not affected.</p>
        </Modal>
      )}
      {toast && <div role="status" className="fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-md bg-ink px-5 py-3 font-semibold text-white">{toast}</div>}
    </div>
  );
}