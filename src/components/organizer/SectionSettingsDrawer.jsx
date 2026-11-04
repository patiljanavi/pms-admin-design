import { useState } from 'react';
import { FiLayers, FiX } from 'react-icons/fi';
import { Drawer } from '../ui';
import ConditionsEditor from './ConditionsEditor';
import SettingsCard from './SettingsCard';
import { REPEAT_BUTTON_LIMIT } from '../../data/organizerTemplates';

/** Allow client to repeat (+ button name) · Conditional (Any/All conditions) — for one section. */
export default function SectionSettingsDrawer({ section, questions, onSave, onClose }) {
  const [st, setSt] = useState(() => ({ ...section.sectionsettings }));
  const set = (changes) => setSt((s) => ({ ...s, ...changes }));
  const save = () => onSave({
    ...st,
    buttonName: st.sectionRepeatingMode ? (st.buttonName || 'Repeat Section').slice(0, REPEAT_BUTTON_LIMIT) : st.buttonName,
    conditions: st.conditional ? (st.conditions || []).filter((c) => c.questionId && c.answer) : [],
  });
  return (
    <Drawer onClose={onClose} label="Section settings" width="max-w-[650px]">
      <div className="flex items-center gap-3 border-b border-line p-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-600" aria-hidden="true"><FiLayers /></span>
        <div className="min-w-0 flex-1"><h2 className="truncate text-lg font-bold">Section settings</h2><p className="truncate text-sm text-muted">{section.text || 'Untitled section'}</p></div>
        <button onClick={onClose} aria-label="Close" className="flex h-10 w-10 items-center justify-center rounded text-muted hover:bg-subtle"><FiX size={20} /></button>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5">
        <SettingsCard title="Allow client to repeat" help="The client can fill in this section more than once (e.g. one per dependent)" checked={st.sectionRepeatingMode} onChange={(v) => set({ sectionRepeatingMode: v })}>
          <label className="field-label">Button name (maximum {REPEAT_BUTTON_LIMIT} characters)
            <input className="input" maxLength={REPEAT_BUTTON_LIMIT} value={st.buttonName} onChange={(e) => set({ buttonName: e.target.value })} />
            <span className="text-right text-xs font-normal text-muted">{(st.buttonName || '').length}/{REPEAT_BUTTON_LIMIT}</span>
          </label>
        </SettingsCard>
        <SettingsCard title="Conditional" help="Show this section only in certain scenarios" checked={st.conditional} onChange={(v) => set({ conditional: v })}>
          <ConditionsEditor settings={st} onChange={set} questions={questions} />
        </SettingsCard>
      </div>
      <div className="sticky bottom-0 flex justify-end gap-2.5 border-t border-line bg-subtle px-5 py-4">
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <button type="button" className="btn-primary" onClick={save}>Save settings</button>
      </div>
    </Drawer>
  );
}
