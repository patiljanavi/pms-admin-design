import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlignLeft, Bell, Clock, FileText, ListChecks, MessageSquare } from 'lucide-react';
import { cn } from 'lib/utils';
import ShortcodeTextField from '../../../components/ShortcodeTextField';
import TextEditor from '../../../components/TextEditor';
import { Avatar, Modal, initials } from '../../../components/ui';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { useData } from '../../../context/DataContext';
import { SENDERS } from '../../../data/emailtemplates';
import { contactShortcuts } from '../../../data/shortcodes';
import { emptyChatTemplate } from '../../../data/chatTemplates';
import { ToastBridge } from '../../../components/ui/sonner';
import {
  ChecklistEditor, EditorActionBar, EditorHeader, EditorNotFound, ErrorSummary, Field, FormSection, SwitchRow, fmtDate, invalidProps,
} from '../templateKit';

const LIST_PATH = '/firmtemp/templates/chats';
const clone = (o) => JSON.parse(JSON.stringify(o));
/** Works whether a field calls onChange(text) or onChange(event). */
const textOf = (v) => (v && typeof v === 'object' && v.target ? v.target.value : v ?? '');

// Previous local layout helpers, replaced by FormSection / SwitchRow from ../templateKit (shadcn Card + Switch):
// function Section({ title, icon, description, children }) {
//   return (
//     <section className="card p-5 sm:p-6">
//       <div className="mb-4">
//         <h2 className="flex items-center gap-2 text-lg font-semibold">{icon}{title}</h2>
//         {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
//       </div>
//       <div className="flex flex-col gap-4">{children}</div>
//     </section>
//   );
// }
// function SwitchRow({ label, description, checked, onChange }) {
//   return (
//     <div className="flex items-start justify-between gap-4 rounded-md border border-line p-3.5">
//       <div><div className="font-semibold">{label}</div>{description && <div className="text-sm text-muted-foreground">{description}</div>}</div>
//       <Toggle label={label} checked={checked} onChange={onChange} />
//     </div>
//   );
// }

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
  const dirty = JSON.stringify(form) !== JSON.stringify(saved);
  const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 2600); };
  const set = (k, v) => { const value = textOf(v); setForm((f) => ({ ...f, [k]: value })); setErrors((e) => ({ ...e, [k]: undefined })); };

  useEffect(() => {
    if (!dirty) return undefined;
    const h = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  if (!saveChatTemplate) return <div role="alert" className="rounded-xl border border-danger-100 bg-danger-50 p-6 text-sm font-medium text-danger-700">Chat templates are not set up in DataContext.js</div>;
  if (editingId && !existing) {
    return <EditorNotFound title="Chat template not found" backTo={LIST_PATH} backLabel="Back to chat templates" />;
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

  const taskCount = form.SubtaskSwitch ? subtasks.filter((s) => s.text.trim()).length : 0;

  return (
    <div className="flex flex-col gap-6">
      <EditorHeader
        backLabel="Chat templates" backAriaLabel="Back to chat templates" onBack={handleCloseChatTemp}
        icon={MessageSquare}
        title={isEditMode ? 'Edit Chat Template' : 'Create Chat Template'}
        badges={<>
          {form.sendReminders && <Badge variant="warning" shape="pill"><Bell />Reminders on</Badge>}
          {!isEditMode && <Badge variant="info" shape="pill">New</Badge>}
        </>}
        description="Configure your chat template"
        meta={existing?.updatedAt ? <><Clock className="size-3.5" aria-hidden="true" />Last updated {fmtDate(existing.updatedAt)}</> : null}
      />

      <ErrorSummary show={Object.values(errors).some(Boolean)} />

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        {/* LEFT COLUMN */}
        <div className="flex min-w-0 flex-col gap-6">
          <FormSection icon={FileText} title="Template details" description="Name the template and choose who the chat comes from.">
            <Field id="ct-name" label="Name" required error={errors.templateName}>
              <Input id="ct-name" value={form.templateName} onChange={(e) => set('templateName', e.target.value)}
                placeholder="Template Name" {...invalidProps('ct-name', errors.templateName)} />
            </Field>
            <Field id="ct-from" label="From" required error={errors.selecteduser}>
              <Select value={form.selecteduser?.value || ''} onValueChange={(v) => set('selecteduser', SENDERS.find((o) => o.value === v) || null)}>
                <SelectTrigger id="ct-from" className={cn(errors.selecteduser && 'border-destructive ring-[3px] ring-destructive/15')} {...invalidProps('ct-from', errors.selecteduser)}>
                  <SelectValue placeholder="Select Sender" />
                </SelectTrigger>
                <SelectContent>
                  {SENDERS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <span className="flex items-center gap-2"><Avatar text={initials(opt.label)} size="xs" />{opt.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <ShortcodeTextField label="Subject" required value={form.inputText} onChange={(v) => set('inputText', v)}
              placeholder="Enter chat subject..." shortcuts={contactShortcuts} error={errors.inputText} />
          </FormSection>

          <FormSection icon={AlignLeft} title="Description" description="The chat message your client receives.">
            <TextEditor ariaLabel="Chat message" value={form.description} onChange={(html) => set('description', html)} shortcuts={contactShortcuts}
              placeholder="Write the chat message…" minHeight={200} />
          </FormSection>

          <FormSection icon={Bell} title="Reminders" description="Nudge the client automatically until they reply.">
            <SwitchRow label="Send reminders to clients" description="Remind the client until they reply or finish their tasks"
              checked={!!form.sendReminders} onChange={(v) => set('sendReminders', v)} />
            {form.sendReminders && (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field id="ct-days" label="Days until next reminder" error={errors.daysuntilNextReminder}>
                  <Input id="ct-days" type="number" min="1" placeholder="Days until next reminder"
                    value={form.daysuntilNextReminder} onChange={(e) => set('daysuntilNextReminder', e.target.value)} {...invalidProps('ct-days', errors.daysuntilNextReminder)} />
                </Field>
                <Field id="ct-count" label="No. of reminders" error={errors.noOfReminder}>
                  <Input id="ct-count" type="number" min="1" placeholder="Number of reminders"
                    value={form.noOfReminder} onChange={(e) => set('noOfReminder', e.target.value)} {...invalidProps('ct-count', errors.noOfReminder)} />
                </Field>
              </div>
            )}
          </FormSection>
        </div>

        {/* RIGHT COLUMN: Client Tasks */}
        <aside className="flex min-w-0 flex-col gap-6 xl:sticky xl:top-[calc(var(--app-header-h,0px)+4.5rem)]">
          <FormSection icon={ListChecks} title="Client Tasks" description="A checklist the client sees with this chat"
            action={form.SubtaskSwitch ? <Badge variant="secondary" shape="pill" className="tabular-nums">{taskCount}</Badge> : null}>
            <SwitchRow label="Enable Client Tasks" checked={!!form.SubtaskSwitch} onChange={handleSubtaskSwitch} />
            {form.SubtaskSwitch && (
              <ChecklistEditor items={subtasks} itemLabel="Client task" doneSuffix="done"
                placeholder="Things to do" addLabel="Add Subtask"
                hint="Drag the handle or use the arrows to reorder. Empty tasks are removed when you save."
                onAdd={handleAddSubtask} onText={handleInputChange} onToggle={handleCheckboxChange}
                onDelete={handleDeleteSubtask} onMove={moveSubtask} />
            )}
          </FormSection>
        </aside>
      </div>

      <EditorActionBar isEdit={isEditMode} dirty={dirty} saving={false}
        onDelete={() => setModal('delete')} onCancel={handleCloseChatTemp} onSave={saveSchat} onSaveExit={savechat} />

      {modal === 'discard' && (
        <Modal title="Discard changes?" description="Your changes to this chat template haven't been saved." onClose={() => setModal(null)}
          footer={<><Button variant="outline" onClick={() => setModal(null)}>Keep editing</Button><Button variant="destructive" onClick={() => navigate(LIST_PATH)}>Discard</Button></>}>
          <p className="text-sm text-muted-foreground">If you leave now, everything you changed since the last save is lost.</p>
        </Modal>
      )}
      {modal === 'delete' && (
        <Modal title={`Delete “${saved.templateName}”?`} description="Chats already sent from this template are not affected." onClose={() => setModal(null)}
          footer={<><Button variant="outline" onClick={() => setModal(null)}>Cancel</Button><Button variant="destructive" onClick={() => { deleteChatTemplates([editingId]); navigate(LIST_PATH, { state: { toast: `Deleted “${saved.templateName}”` } }); }}>Delete</Button></>}>
          <p className="text-sm text-muted-foreground">This template is removed for everyone in your firm. This can't be undone.</p>
        </Modal>
      )}
      <ToastBridge message={toast} />
    </div>
  );
}