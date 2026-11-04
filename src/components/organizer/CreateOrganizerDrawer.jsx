import { useState } from 'react';
import { FiClipboard, FiEye, FiPlus, FiX } from 'react-icons/fi';
import MultiSelect from '../MultiSelect';
import ShortcodeTextField from '../ShortcodeTextField';
import OrganizerPreview from './OrganizerPreview';
import { Avatar, Drawer, Toggle, cx, initials } from '../ui';
import { useData } from '../../context/DataContext';
import { accountShortcuts } from '../../data/shortcodes';
import { fillShortcodes } from '../../data/accountChats';
import { questionCount } from '../../data/organizerTemplates';

/**
 * Create organizer drawer: Accounts · Organizer Template · Organizer Name · Preview Mode · Reminders.
 * Props: defaultAccountIds · onCreate(accountIds, form, template) · onClose()
 */
export default function CreateOrganizerDrawer({ defaultAccountIds = [], onCreate, onClose }) {
  const { accounts = [], organizerTemplates = [] } = useData();
  const [form, setForm] = useState({ accountIds: defaultAccountIds, templateId: '', organizerName: '', reminder: false, days: 3, count: 1 });
  const [errors, setErrors] = useState({});
  const [preview, setPreview] = useState(false);
  const set = (changes) => { setForm((f) => ({ ...f, ...changes })); setErrors((e) => { const n = { ...e }; Object.keys(changes).forEach((k) => delete n[k]); return n; }); };
  const template = organizerTemplates.find((t) => t.id === form.templateId) || null;
  const firstAccount = accounts.find((a) => a.id === form.accountIds[0]);

  // Picking a template fills the organizer name and its reminder settings
  const handleOrganizerTemplateChange = (id) => {
    const t = organizerTemplates.find((x) => x.id === id);
    if (!t) { set({ templateId: '' }); return; }
    const st = t.organizersettings || {};
    set({ templateId: t.id, organizerName: t.organizerName || t.templatename, reminder: !!st.sendreminderstoclient, days: st.daysuntilnextreminder || 3, count: st.numberofreminders || 1 });
  };

  const validate = () => {
    const e = {};
    if (!form.accountIds.length) e.accountIds = 'Choose at least one account.';
    if (!form.templateId) e.templateId = 'Choose an organizer template.';
    if (!form.organizerName.trim()) e.organizerName = 'Organizer name is required.';
    if (form.reminder && (!(Number(form.days) >= 1) || !(Number(form.count) >= 1))) e.reminders = 'Enter at least 1 day and 1 reminder.';
    setErrors(e);
    return !Object.keys(e).length;
  };
  const createOrganizerOfAccount = () => { if (validate()) onCreate(form.accountIds, form, template); };
  const handlePreview = () => {
    if (!template) { setErrors((e) => ({ ...e, templateId: 'Choose an organizer template to preview it.' })); return; }
    setPreview(true);
  };

  return (
    <>
      <Drawer onClose={onClose} label="Create organizer" width="max-w-[600px]">
        <div className="flex items-center gap-3 border-b border-line bg-subtle/60 px-6 py-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-white" aria-hidden="true"><FiClipboard /></span>
          <div className="flex-1"><h2 className="text-lg font-semibold">Create organizer</h2><p className="text-sm text-muted">Send a questionnaire from a template</p></div>
          <button onClick={onClose} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-subtle hover:text-ink"><FiX /></button>
        </div>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-6">
          <MultiSelect label="Accounts *" placeholder="Select accounts" options={accounts.map((a) => ({ value: a.id, label: a.name, meta: a.company }))} value={form.accountIds}
            onChange={(v) => set({ accountIds: v })} error={errors.accountIds}
            renderOption={(o) => <span className="flex flex-1 items-center gap-2.5"><Avatar text={initials(o.label)} size="sm" /><span><span className="block font-semibold">{o.label}</span><span className="block text-xs text-muted">{o.meta}</span></span></span>} />
          {form.accountIds.length > 1 && <p className="-mt-3 text-xs text-muted">A separate organizer is created for each account.</p>}

          <label className="field-label">
            <span>Organizer Template <span className="text-danger-700">*</span></span>
            <select className={cx('input', errors.templateId && 'border-danger-700')} value={form.templateId} onChange={(e) => handleOrganizerTemplateChange(e.target.value)}>
              <option value="">None</option>
              {organizerTemplates.map((t) => <option key={t.id} value={t.id}>{t.templatename}</option>)}
            </select>
            {template && <span className="text-xs font-normal text-muted">{template.sections.length} sections · {questionCount(template)} questions</span>}
            {errors.templateId && <span className="text-sm font-normal text-danger-700">{errors.templateId}</span>}
          </label>

          <div>
            <ShortcodeTextField label="Organizer Name" required value={form.organizerName} onChange={(v) => set({ organizerName: v })} placeholder="Organizer Name"
              shortcuts={accountShortcuts} error={errors.organizerName} />
            <p className="mt-1.5 text-xs text-muted">Shortcodes are filled in for each account{firstAccount && form.organizerName.includes('[') ? <> — e.g. “{fillShortcodes(form.organizerName, firstAccount)}”</> : '.'}</p>
          </div>

          <div>
            <button type="button" className="btn-secondary" onClick={handlePreview}><FiEye aria-hidden="true" /> Preview Mode</button>
            <p className="mt-1.5 text-xs text-muted">See the organizer the way the client will.</p>
          </div>

          <div className="rounded-lg border border-line p-4">
            <div className="flex items-center justify-between gap-4">
              <span className="font-semibold">Reminders</span>
              <Toggle label="Reminders" checked={form.reminder} onChange={(v) => set({ reminder: v })} />
            </div>
            {form.reminder && (
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="field-label">Days until next reminder
                  <input type="number" min="1" className={cx('input', errors.reminders && 'border-danger-700')} value={form.days} onChange={(e) => set({ days: e.target.value, reminders: undefined })} />
                </label>
                <label className="field-label">No Of reminders
                  <input type="number" min="1" className={cx('input', errors.reminders && 'border-danger-700')} value={form.count} onChange={(e) => set({ count: e.target.value, reminders: undefined })} />
                </label>
                {errors.reminders && <p role="alert" className="text-sm text-danger-700 sm:col-span-2">{errors.reminders}</p>}
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 flex justify-end gap-3 border-t border-line bg-subtle px-6 py-4">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="btn-primary" onClick={createOrganizerOfAccount}><FiPlus aria-hidden="true" /> Create</button>
        </div>
      </Drawer>

      {preview && template && (
        <OrganizerPreview onClose={() => setPreview(false)}
          organizer={{ ...template, organizerName: firstAccount ? fillShortcodes(form.organizerName, firstAccount) : form.organizerName }} />
      )}
    </>
  );
}