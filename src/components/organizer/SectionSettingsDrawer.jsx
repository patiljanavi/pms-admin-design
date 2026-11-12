import { useState } from 'react';
import { GitBranch, Layers, Repeat } from 'lucide-react';
import { Drawer } from '../ui';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import ConditionsEditor from './ConditionsEditor';
import SettingsCard, { DrawerLayout } from './SettingsCard';
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
  const len = (st.buttonName || '').length;
  return (
    <Drawer onClose={onClose} label="Section settings" width="max-w-[650px]">
      <DrawerLayout icon={Layers} title="Section settings" description={section.text || 'Untitled section'} onClose={onClose}
        footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={save}>Save settings</Button></>}>
        <div className="flex flex-col gap-3">
          <SettingsCard icon={Repeat} title="Allow client to repeat" help="The client can fill in this section more than once (e.g. one per dependent)" checked={st.sectionRepeatingMode} onChange={(v) => set({ sectionRepeatingMode: v })}>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="section-repeat-button" className="text-sm font-medium">Button name (maximum {REPEAT_BUTTON_LIMIT} characters)</label>
              <Input id="section-repeat-button" maxLength={REPEAT_BUTTON_LIMIT} value={st.buttonName} placeholder="Repeat Section" onChange={(e) => set({ buttonName: e.target.value })} />
              <span className={len >= REPEAT_BUTTON_LIMIT ? 'text-right text-xs font-medium tabular-nums text-warning-700' : 'text-right text-xs tabular-nums text-muted-foreground'}>{len}/{REPEAT_BUTTON_LIMIT}</span>
            </div>
          </SettingsCard>
          <SettingsCard icon={GitBranch} title="Conditional" help="Show this section only in certain scenarios" checked={st.conditional} onChange={(v) => set({ conditional: v })}>
            <ConditionsEditor settings={st} onChange={set} questions={questions} />
          </SettingsCard>
        </div>
      </DrawerLayout>
    </Drawer>
  );
}
