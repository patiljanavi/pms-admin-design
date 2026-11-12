import { useState } from 'react';
import { Bell, ClipboardList, Eye, Plus } from 'lucide-react';
import MultiSelect from '../MultiSelect';
import ShortcodeTextField from '../ShortcodeTextField';
import OrganizerPreview from './OrganizerPreview';
import SettingsCard, { DrawerLayout, Field } from './SettingsCard';
import { Avatar, Drawer, initials } from '../ui';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from '../ui/select';
import { cn } from 'lib/utils';
import { useData } from '../../context/DataContext';
import { accountShortcuts } from '../../data/shortcodes';
import { fillShortcodes } from '../../data/accountChats';
import { questionCount } from '../../data/organizerTemplates';

const NONE = '__none';

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
        <DrawerLayout icon={ClipboardList} title="Create organizer" description="Send a questionnaire from a template" onClose={onClose}
          footer={<>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={createOrganizerOfAccount}><Plus aria-hidden="true" /> Create</Button>
          </>}>
          <div className="flex flex-col gap-5">
            <div>
              <MultiSelect label="Accounts *" placeholder="Select accounts" options={accounts.map((a) => ({ value: a.id, label: a.name, meta: a.company }))} value={form.accountIds}
                onChange={(v) => set({ accountIds: v })} error={errors.accountIds}
                renderOption={(o) => <span className="flex flex-1 items-center gap-2.5"><Avatar text={initials(o.label)} size="sm" /><span><span className="block font-medium">{o.label}</span><span className="block text-xs text-muted-foreground">{o.meta}</span></span></span>} />
              {form.accountIds.length > 1 && <p className="mt-1.5 text-xs text-muted-foreground">A separate organizer is created for each account.</p>}
            </div>

            <Field label="Organizer Template" required error={errors.templateId}>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Select value={form.templateId ? String(form.templateId) : NONE}
                  onValueChange={(v) => handleOrganizerTemplateChange(v === NONE ? '' : organizerTemplates.find((t) => String(t.id) === v)?.id)}>
                  <SelectTrigger aria-label="Organizer Template" aria-invalid={!!errors.templateId} className={cn('flex-1', errors.templateId && 'border-danger-700')}>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>None</SelectItem>
                    {organizerTemplates.length > 0 && <SelectSeparator />}
                    {organizerTemplates.map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.templatename}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" onClick={handlePreview}><Eye aria-hidden="true" /> Preview Mode</Button>
              </div>
              {template ? (
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="neutral">{template.sections.length} sections</Badge>
                  <Badge variant="neutral">{questionCount(template)} questions</Badge>
                  <span className="text-xs text-muted-foreground">Preview shows the organizer the way the client will.</span>
                </div>
              ) : !errors.templateId && <p className="text-xs text-muted-foreground">See the organizer the way the client will with Preview Mode.</p>}
            </Field>

            <div>
              <ShortcodeTextField label="Organizer Name" required value={form.organizerName} onChange={(v) => set({ organizerName: v })} placeholder="Organizer Name"
                shortcuts={accountShortcuts} error={errors.organizerName} />
              <p className="mt-1.5 text-xs text-muted-foreground">Shortcodes are filled in for each account{firstAccount && form.organizerName.includes('[') ? <> — e.g. “<span className="font-medium text-foreground">{fillShortcodes(form.organizerName, firstAccount)}</span>”</> : '.'}</p>
            </div>

            <SettingsCard icon={Bell} title="Reminders" help="Remind the client until the organizer is submitted" checked={form.reminder} onChange={(v) => set({ reminder: v })}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Days until next reminder" htmlFor="co-days">
                  <Input id="co-days" type="number" min="1" aria-invalid={!!errors.reminders} value={form.days} onChange={(e) => set({ days: e.target.value, reminders: undefined })} />
                </Field>
                <Field label="No Of reminders" htmlFor="co-count">
                  <Input id="co-count" type="number" min="1" aria-invalid={!!errors.reminders} value={form.count} onChange={(e) => set({ count: e.target.value, reminders: undefined })} />
                </Field>
                {errors.reminders && <p role="alert" className="text-xs text-danger-700 sm:col-span-2">{errors.reminders}</p>}
              </div>
            </SettingsCard>
          </div>
        </DrawerLayout>
      </Drawer>

      {preview && template && (
        <OrganizerPreview onClose={() => setPreview(false)}
          organizer={{ ...template, organizerName: firstAccount ? fillShortcodes(form.organizerName, firstAccount) : form.organizerName }} />
      )}
    </>
  );
}
