import { useState } from 'react';
import { FiMessageSquare, FiPlus, FiTrash2, FiX } from 'react-icons/fi';
import MultiSelect from '../MultiSelect';
import ShortcodeTextField from '../ShortcodeTextField';
import TextEditor from '../TextEditor';
import { Avatar, Drawer, Toggle, cx, initials } from '../ui';
import { useData } from '../../context/DataContext';
import { contactShortcuts } from '../../data/shortcodes';
import { newTask } from '../../data/accountChats';

/** Card used for each section of the drawer. */
const Block = ({ children }) => <div className="rounded-lg border border-line bg-surface p-5 shadow-card">{children}</div>;

/**
 * New Chat drawer. Fields: Account * (one or more) · Template · Subject * · Description · Reminders · Client tasks.
 * Props: defaultAccountIds · onCreate(accountIds, form) · onClose()
 */
export default function NewChatDrawer({ defaultAccountIds = [], onCreate, onClose }) {
  const { accounts = [], chatTemplates = [] } = useData();
  const [form, setForm] = useState({ accountIds: defaultAccountIds, templateId: '', subject: '', description: '', sendReminders: false, days: 3, count: 2, tasks: [] });
  const [errors, setErrors] = useState({});
  const set = (changes) => { setForm((f) => ({ ...f, ...changes })); setErrors((e) => { const n = { ...e }; Object.keys(changes).forEach((k) => delete n[k]); return n; }); };
  const accountOptions = accounts.map((a) => ({ value: a.id, label: a.name, meta: a.company }));

  // Picking a template fills subject, description, reminders and tasks
  const handleTemplateChange = (id) => {
    const t = chatTemplates.find((x) => x.id === id);
    if (!t) { set({ templateId: '' }); return; }
    set({
      templateId: t.id,
      subject: t.inputText || '',
      description: t.description || '',
      sendReminders: !!t.sendReminders,
      days: t.daysuntilNextReminder || 3,
      count: t.noOfReminder || 2,
      tasks: t.SubtaskSwitch ? (t.subtasks || []).map((s) => newTask(s.text)) : [],
    });
  };

  const saveChat = () => {
    const e = {};
    if (!form.accountIds.length) e.accountIds = 'Choose at least one account.';
    if (!form.subject.trim()) e.subject = 'Subject is required.';
    if (form.sendReminders && (!(Number(form.days) >= 1) || !(Number(form.count) >= 1))) e.reminders = 'Enter at least 1 day and 1 reminder.';
    setErrors(e);
    if (Object.keys(e).length) return;
    onCreate(form.accountIds, form);
  };

  return (
    <Drawer onClose={onClose} label="New Chat" width="max-w-[650px]">
      <div className="flex items-center gap-3 border-b border-line bg-subtle/60 px-6 py-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-white" aria-hidden="true"><FiMessageSquare /></span>
        <div className="flex-1"><h2 className="text-lg font-semibold">New Chat</h2><p className="text-sm text-muted">Create a new client conversation and tasks</p></div>
        <button onClick={onClose} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-subtle hover:text-ink"><FiX /></button>
      </div>

      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-6">
        <Block>
          <MultiSelect label="Account *" placeholder="Select accounts" options={accountOptions} value={form.accountIds} onChange={(v) => set({ accountIds: v })} error={errors.accountIds}
            renderOption={(o) => <span className="flex flex-1 items-center gap-2.5"><Avatar text={initials(o.label)} size="sm" /><span><span className="block font-semibold">{o.label}</span><span className="block text-xs text-muted">{o.meta}</span></span></span>} />
          {form.accountIds.length > 1 && <p className="mt-1.5 text-xs text-muted">A separate chat is created for each account.</p>}
        </Block>

        <Block>
          <label className="field-label">Template
            <select className="input" value={form.templateId} onChange={(e) => handleTemplateChange(e.target.value)}>
              <option value="">Select a template</option>
              {chatTemplates.map((t) => <option key={t.id} value={t.id}>{t.templateName}</option>)}
            </select>
            <span className="text-xs font-normal text-muted">Fills in the subject, description, reminders and tasks.</span>
          </label>
        </Block>

        <Block>
          <ShortcodeTextField label="Subject" required value={form.subject} onChange={(v) => set({ subject: v })} placeholder="e.g. A few receipts are missing, [FIRST_NAME]"
            shortcuts={contactShortcuts} error={errors.subject} />
          <p className="mt-1.5 text-xs text-muted">Shortcodes are filled in for each account when the chat is created.</p>
        </Block>

        <Block>
          <span className="mb-1.5 block text-sm font-semibold">Description</span>
          <TextEditor key={form.templateId || 'blank'} ariaLabel="Chat description" value={form.description} onChange={(html) => set({ description: html })}
            shortcuts={contactShortcuts} placeholder="The first message the client sees…" minHeight={150} />
        </Block>

        <Block>
          <div className="flex items-center justify-between gap-4">
            <span className="font-semibold">Send reminders to client</span>
            <Toggle label="Send reminders to client" checked={form.sendReminders} onChange={(v) => set({ sendReminders: v })} />
          </div>
          {form.sendReminders && (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="field-label">Days until next reminder
                <input type="number" min="1" className={cx('input', errors.reminders && 'border-danger-700')} value={form.days} onChange={(e) => set({ days: e.target.value, reminders: undefined })} />
              </label>
              <label className="field-label">Number of reminders
                <input type="number" min="1" className={cx('input', errors.reminders && 'border-danger-700')} value={form.count} onChange={(e) => set({ count: e.target.value, reminders: undefined })} />
              </label>
              {errors.reminders && <p role="alert" className="text-sm text-danger-700 sm:col-span-2">{errors.reminders}</p>}
            </div>
          )}
        </Block>

        <Block>
          <div className="mb-3 flex items-center justify-between">
            <span className="font-semibold">Client Tasks</span>
            <button type="button" className="btn-secondary min-h-[36px] text-sm" onClick={() => set({ tasks: [...form.tasks, newTask()] })}><FiPlus aria-hidden="true" /> Add Task</button>
          </div>
          <ul className="flex flex-col gap-2">
            {form.tasks.map((t, i) => (
              <li key={t.id} className="flex items-center gap-2 rounded-lg border border-line bg-subtle/40 p-2.5">
                <input type="checkbox" disabled aria-label={`Task ${i + 1} (client ticks it off)`} className="h-[18px] w-[18px] flex-none" />
                <input className="min-h-[38px] min-w-0 flex-1 rounded border border-line bg-surface px-2.5 text-sm focus:border-brand-600 focus:outline-none" value={t.text}
                  placeholder="Enter task description" aria-label={`Task ${i + 1}`} onChange={(e) => set({ tasks: form.tasks.map((x) => (x.id === t.id ? { ...x, text: e.target.value } : x)) })} />
                <button type="button" onClick={() => set({ tasks: form.tasks.filter((x) => x.id !== t.id) })} aria-label={`Remove task ${i + 1}`} className="flex h-8 w-8 items-center justify-center rounded text-muted hover:bg-danger-50 hover:text-danger-700"><FiTrash2 aria-hidden="true" /></button>
              </li>
            ))}
          </ul>
          {!form.tasks.length && <p className="rounded-lg border border-dashed border-line-strong px-4 py-6 text-center text-sm text-muted">No tasks added yet. Click “Add Task” to create one.</p>}
        </Block>
      </div>

      <div className="sticky bottom-0 flex justify-end gap-3 border-t border-line bg-subtle px-6 py-4">
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <button type="button" className="btn-primary" onClick={saveChat}><FiPlus aria-hidden="true" /> Create Chat</button>
      </div>
    </Drawer>
  );
}