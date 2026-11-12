import { useState } from 'react';
import { Bell, CloudUpload, Lock, SlidersHorizontal, UserCheck } from 'lucide-react';
import { Drawer } from '../ui';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import SettingsCard, { DrawerLayout, Field } from './SettingsCard';

/** Organizer-wide settings: notifications, self service, auto-seal and reminders. */
export default function OrganizerSettingsDrawer({ settings, onSave, onClose }) {
  const [st, setSt] = useState(() => ({ ...settings }));
  const [error, setError] = useState('');
  const set = (changes) => { setSt((s) => ({ ...s, ...changes })); setError(''); };
  const save = () => {
    if (st.sendreminderstoclient && (!(Number(st.daysuntilnextreminder) >= 1) || !(Number(st.numberofreminders) >= 1))) { setError('Enter at least 1 day and 1 reminder.'); return; }
    onSave({ ...st, daysuntilnextreminder: Number(st.daysuntilnextreminder) || 3, numberofreminders: Number(st.numberofreminders) || 1 });
  };
  return (
    <Drawer onClose={onClose} label="Organizer settings" width="max-w-[520px]">
      <DrawerLayout icon={SlidersHorizontal} title="Organizer settings" description="Notifications, client access and reminders for this organizer." onClose={onClose}
        footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={save}>Save settings</Button></>}>
        <div className="flex flex-col gap-3">
          <SettingsCard icon={CloudUpload} title="Notify about document upload" help="Email your team when the client uploads a file" checked={st.notifyaboutdocumentupload} onChange={(v) => set({ notifyaboutdocumentupload: v })} />
          <SettingsCard icon={UserCheck} title="Organizer self service" help="Clients can start this organizer themselves from the portal" checked={st.organizerselfservice} onChange={(v) => set({ organizerselfservice: v })} />
          <SettingsCard icon={Lock} title="Automatically seal after submission" help="Lock answers once the client submits" checked={st.automaticallysealaftersubmission} onChange={(v) => set({ automaticallysealaftersubmission: v })} />
          <SettingsCard icon={Bell} title="Send reminders to clients" help="Until the organizer is submitted" checked={st.sendreminderstoclient} onChange={(v) => set({ sendreminderstoclient: v })}>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Days until next reminder" htmlFor="org-days">
                <Input id="org-days" type="number" min="1" aria-invalid={!!error} value={st.daysuntilnextreminder} onChange={(e) => set({ daysuntilnextreminder: e.target.value })} />
              </Field>
              <Field label="No. of reminders" htmlFor="org-count">
                <Input id="org-count" type="number" min="1" aria-invalid={!!error} value={st.numberofreminders} onChange={(e) => set({ numberofreminders: e.target.value })} />
              </Field>
            </div>
            {error && <p role="alert" className="mt-2 text-xs text-danger-700">{error}</p>}
          </SettingsCard>
        </div>
      </DrawerLayout>
    </Drawer>
  );
}
