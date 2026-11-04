import { useState } from 'react';
import { FiSettings, FiX } from 'react-icons/fi';
import { Drawer } from '../ui';
import ConditionsEditor from './ConditionsEditor';
import SettingsCard from './SettingsCard';

/** Required · Pre-filled · Conditional (Any/All conditions) · Description — for one question. */
export default function QuestionSettingsDrawer({ question, questions, onSave, onClose }) {
  const [st, setSt] = useState(() => ({ ...question.questionsectionsettings }));
  const set = (changes) => setSt((s) => ({ ...s, ...changes }));
  const save = () => onSave({
    ...st,
    conditions: st.conditional ? (st.conditions || []).filter((c) => c.questionId && c.answer) : [],
    description: st.descriptionEnabled ? st.description : '',
  });
  return (
    <Drawer onClose={onClose} label="Question settings" width="max-w-[600px]">
      <div className="flex items-center gap-3 border-b border-line p-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-600" aria-hidden="true"><FiSettings /></span>
        <div className="min-w-0 flex-1"><h2 className="truncate text-lg font-bold">{question.text || 'Question settings'}</h2><p className="text-sm text-muted">{question.type}</p></div>
        <button onClick={onClose} aria-label="Close" className="flex h-10 w-10 items-center justify-center rounded text-muted hover:bg-subtle"><FiX size={20} /></button>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5">
        <SettingsCard title="Required" help="The client must answer this question to submit the organizer" checked={st.required} onChange={(v) => set({ required: v })} />
        <SettingsCard title="Pre-Filled" help="If asked before, the answer pre-populates from the previous organizer" checked={st.prefilled} onChange={(v) => set({ prefilled: v })} />
        <SettingsCard title="Conditional" help="Ask this question only in certain scenarios" checked={st.conditional} onChange={(v) => set({ conditional: v })}>
          <ConditionsEditor settings={st} onChange={set} questions={questions} />
        </SettingsCard>
        <SettingsCard title="Description" help="Add instructional text to help clients answer" checked={st.descriptionEnabled} onChange={(v) => set({ descriptionEnabled: v })}>
          <textarea aria-label="Question description" className="input min-h-[96px] py-2" value={st.description} onChange={(e) => set({ description: e.target.value })} placeholder="Description" />
        </SettingsCard>
      </div>
      <div className="sticky bottom-0 flex justify-end gap-2.5 border-t border-line bg-subtle px-5 py-4">
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <button type="button" className="btn-primary" onClick={save}>Save settings</button>
      </div>
    </Drawer>
  );
}
