import { GitBranch, Info, Plus, Trash2 } from 'lucide-react';
import { newCondition } from '../../data/organizerTemplates';
import { Button } from '../ui/button';
import { SimpleTooltip } from '../ui/tooltip';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '../ui/select';

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
    return (
      <p className="flex items-start gap-2 rounded-lg border border-dashed bg-card p-3 text-sm text-muted-foreground">
        <Info className="mt-0.5 size-4 flex-none" aria-hidden="true" />
        Add a Radio Buttons, Checkboxes, Dropdown or Yes/No question first — conditions are based on their answers.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="inline-flex items-center gap-1.5 text-sm font-semibold"><GitBranch className="size-3.5 text-muted-foreground" aria-hidden="true" />{label}</h4>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">Show when
          <Select value={settings.mode || 'Any'} onValueChange={(v) => onChange({ mode: v })}>
            <SelectTrigger aria-label="Condition mode" className="h-8 w-auto gap-1.5 text-foreground"><SelectValue /></SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="Any">Any condition is met</SelectItem>
              <SelectItem value="All">All conditions are met</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <ol className="flex flex-col gap-2">
        {conditions.map((c, i) => {
          const question = questions.find((q) => String(q.id) === String(c.questionId));
          const answers = (question?.options || []).filter((o) => o.text.trim());
          return (
            <li key={i} className="grid grid-cols-[1fr_auto] items-end gap-2 rounded-lg border bg-card p-2.5 shadow-xs sm:grid-cols-[auto_1fr_1fr_auto]">
              <span className="hidden h-9 items-center text-xs font-medium uppercase tracking-wide text-muted-foreground sm:flex">{i === 0 ? 'If' : (settings.mode || 'Any') === 'All' ? 'And' : 'Or'}</span>
              <div className="flex min-w-0 flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">Question</span>
                <Select value={c.questionId == null ? '' : String(c.questionId)}
                  onValueChange={(v) => { const qq = questions.find((x) => String(x.id) === v); setRow(i, { questionId: qq?.id ?? null, question: qq?.text || '', answer: '' }); }}>
                  <SelectTrigger aria-label={`Condition ${i + 1} question`}><SelectValue placeholder="Select question" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(bySection).map(([section, qs]) => (
                      <SelectGroup key={section}>
                        <SelectLabel>{section}</SelectLabel>
                        {qs.map((qq) => <SelectItem key={qq.id} value={String(qq.id)}>{qq.text || `Untitled ${qq.type.toLowerCase()}`}</SelectItem>)}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 flex min-w-0 flex-col gap-1 sm:col-span-1">
                <span className="text-xs font-medium text-muted-foreground">Answer</span>
                <Select value={c.answer || ''} disabled={!question} onValueChange={(v) => setRow(i, { answer: v })}>
                  <SelectTrigger aria-label={`Condition ${i + 1} answer`}><SelectValue placeholder="Select answer" /></SelectTrigger>
                  <SelectContent>
                    {answers.map((o) => <SelectItem key={o.id} value={o.text}>{o.text}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <SimpleTooltip label="Remove condition">
                <Button type="button" variant="ghost" size="icon" onClick={() => setConditions(conditions.filter((_, j) => j !== i))} aria-label={`Remove condition ${i + 1}`}
                  className="row-start-1 text-muted-foreground hover:bg-danger-50 hover:text-danger-700 sm:row-start-auto"><Trash2 aria-hidden="true" /></Button>
              </SimpleTooltip>
            </li>
          );
        })}
      </ol>
      <Button type="button" variant="outline" size="sm" onClick={() => setConditions([...conditions, newCondition()])} className="self-start"><Plus aria-hidden="true" /> Add condition</Button>
    </div>
  );
}
