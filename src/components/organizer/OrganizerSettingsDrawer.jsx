import { useState } from 'react';
import { FiSliders, FiX } from 'react-icons/fi';
import { Drawer, cx } from '../ui';
import SettingsCard from './SettingsCard';

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
      <div className="flex items-center gap-3 border-b border-line p-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-600" aria-hidden="true"><FiSliders /></span>
        <h2 className="flex-1 text-lg font-bold">Organizer settings</h2>
        <button onClick={onClose} aria-label="Close" className="flex h-10 w-10 items-center justify-center rounded text-muted hover:bg-subtle"><FiX size={20} /></button>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5">
        <SettingsCard title="Notify about document upload" help="Email your team when the client uploads a file" checked={st.notifyaboutdocumentupload} onChange={(v) => set({ notifyaboutdocumentupload: v })} />
        <SettingsCard title="Organizer self service" help="Clients can start this organizer themselves from the portal" checked={st.organizerselfservice} onChange={(v) => set({ organizerselfservice: v })} />
        <SettingsCard title="Automatically seal after submission" help="Lock answers once the client submits" checked={st.automaticallysealaftersubmission} onChange={(v) => set({ automaticallysealaftersubmission: v })} />
        <SettingsCard title="Send reminders to clients" help="Until the organizer is submitted" checked={st.sendreminderstoclient} onChange={(v) => set({ sendreminderstoclient: v })}>
          <div className="grid grid-cols-2 gap-3">
            <label className="field-label">Days until next reminder
              <input type="number" min="1" className={cx('input', error && 'border-danger-700')} value={st.daysuntilnextreminder} onChange={(e) => set({ daysuntilnextreminder: e.target.value })} />
            </label>
            <label className="field-label">No. of reminders
              <input type="number" min="1" className={cx('input', error && 'border-danger-700')} value={st.numberofreminders} onChange={(e) => set({ numberofreminders: e.target.value })} />
            </label>
          </div>
          {error && <p role="alert" className="mt-2 text-sm text-danger-700">{error}</p>}
        </SettingsCard>
      </div>
      <div className="sticky bottom-0 flex justify-end gap-2.5 border-t border-line bg-subtle px-5 py-4">
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <button type="button" className="btn-primary" onClick={save}>Save settings</button>
      </div>
    </Drawer>
  );
}
