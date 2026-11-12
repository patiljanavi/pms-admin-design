import { useState } from 'react';
import { Asterisk, GitBranch, History, Settings2, TextQuote } from 'lucide-react';
import { Drawer } from '../ui';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import ConditionsEditor from './ConditionsEditor';
import SettingsCard, { DrawerLayout } from './SettingsCard';

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
      <DrawerLayout icon={Settings2} title={question.text || 'Question settings'} description={question.type} onClose={onClose}
        footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={save}>Save settings</Button></>}>
        <div className="flex flex-col gap-3">
          <SettingsCard icon={Asterisk} title="Required" help="The client must answer this question to submit the organizer" checked={st.required} onChange={(v) => set({ required: v })} />
          <SettingsCard icon={History} title="Pre-Filled" help="If asked before, the answer pre-populates from the previous organizer" checked={st.prefilled} onChange={(v) => set({ prefilled: v })} />
          <SettingsCard icon={GitBranch} title="Conditional" help="Ask this question only in certain scenarios" checked={st.conditional} onChange={(v) => set({ conditional: v })}>
            <ConditionsEditor settings={st} onChange={set} questions={questions} />
          </SettingsCard>
          <SettingsCard icon={TextQuote} title="Description" help="Add instructional text to help clients answer" checked={st.descriptionEnabled} onChange={(v) => set({ descriptionEnabled: v })}>
            <Textarea aria-label="Question description" className="min-h-[96px]" value={st.description} onChange={(e) => set({ description: e.target.value })} placeholder="Description" />
          </SettingsCard>
        </div>
      </DrawerLayout>
    </Drawer>
  );
}
