import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { newCondition } from '../../data/organizerTemplates';

/**
 * Mode (Any / All) + a list of "question = answer" conditions.
 * Props: settings ({ mode, conditions }) · onChange(changes) · questions (choice questions with sectionName) · label
 */
export default function ConditionsEditor({ settings, onChange, questions, label = 'Conditions' }) {
  const conditions = settings.conditions?.length ? settings.conditions : [newCondition()];
  const setConditions = (list) => onChange({ conditions: list });
  const setRow = (i, changes) => setConditions(conditions.map((c, j) => (j === i ? { ...c, ...changes } : c)));
  const bySection = questions.reduce((m, q) => { (m[q.sectionName] = m[q.sectionName] || []).push(q); return m; }, {});

  if (!questions.length) {
    return <p className="rounded-md bg-subtle p-3 text-sm text-muted">Add a Radio Buttons, Checkboxes, Dropdown or Yes/No question first — conditions are based on their answers.</p>;
  }
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="font-semibold">{label}</h4>
        <label className="flex items-center gap-2 text-sm">Show when
          <select aria-label="Condition mode" className="input min-h-[36px] w-auto py-0 text-sm" value={settings.mode || 'Any'} onChange={(e) => onChange({ mode: e.target.value })}>
            <option value="Any">Any condition is met</option>
            <option value="All">All conditions are met</option>
          </select>
        </label>
      </div>
      {conditions.map((c, i) => {
        const question = questions.find((q) => String(q.id) === String(c.questionId));
        return (
          <div key={i} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2 rounded-md border border-line p-2.5">
            <label className="text-xs font-semibold text-muted">Question
              <select aria-label={`Condition ${i + 1} question`} className="input mt-1 min-h-[38px] text-sm" value={c.questionId ?? ''}
                onChange={(e) => { const qq = questions.find((x) => String(x.id) === e.target.value); setRow(i, { questionId: qq?.id ?? null, question: qq?.text || '', answer: '' }); }}>
                <option value="">Select question</option>
                {Object.entries(bySection).map(([section, qs]) => (
                  <optgroup key={section} label={section}>
                    {qs.map((qq) => <option key={qq.id} value={qq.id}>{qq.text || `Untitled ${qq.type.toLowerCase()}`}</option>)}
                  </optgroup>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold text-muted">Answer
              <select aria-label={`Condition ${i + 1} answer`} className="input mt-1 min-h-[38px] text-sm" value={c.answer || ''} disabled={!question} onChange={(e) => setRow(i, { answer: e.target.value })}>
                <option value="">Select answer</option>
                {(question?.options || []).filter((o) => o.text.trim()).map((o) => <option key={o.id} value={o.text}>{o.text}</option>)}
              </select>
            </label>
            <button type="button" onClick={() => setConditions(conditions.filter((_, j) => j !== i))} aria-label={`Remove condition ${i + 1}`}
              className="flex h-[38px] w-9 items-center justify-center rounded text-danger-700 hover:bg-danger-50"><FiTrash2 aria-hidden="true" /></button>
          </div>
        );
      })}
      <button type="button" onClick={() => setConditions([...conditions, newCondition()])} className="btn-link self-start px-0 text-sm"><FiPlus aria-hidden="true" /> Add condition</button>
    </div>
  );
}
