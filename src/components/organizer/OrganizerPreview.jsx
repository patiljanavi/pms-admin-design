import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, CircleCheck, CloudUpload, Plus, RotateCcw } from 'lucide-react';
import { Modal } from '../ui';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { cn } from 'lib/utils';
import { TEXT_BLOCK, conditionsMet } from '../../data/organizerTemplates';

const Shortcodes = ({ text = '' }) => text.split(/(\[[A-Z0-9_]+\])/g).map((p, i) => (/^\[[A-Z0-9_]+\]$/.test(p)
  ? <span key={i} className="te-field mx-0.5 rounded bg-brand-50 px-1.5 font-mono text-[0.8em] font-medium text-brand-700 ring-1 ring-inset ring-brand-200">{p}</span>
  : <span key={i}>{p}</span>));

/** Typography for text blocks written in the rich text editor (theme tokens → works in dark mode). */
const RICH_TEXT = cn('te-content text-sm leading-relaxed text-foreground',
  '[&_h1]:mb-2 [&_h1]:text-xl [&_h1]:font-semibold [&_h2]:mb-1.5 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:mb-1 [&_h3]:font-semibold',
  '[&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_a]:text-primary [&_a]:underline',
  '[&_blockquote]:border-l-2 [&_blockquote]:border-line-strong [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground',
  '[&_.te-field]:rounded [&_.te-field]:bg-brand-50 [&_.te-field]:px-1 [&_.te-field]:font-mono [&_.te-field]:text-[0.85em] [&_.te-field]:text-brand-700');

/** One question as the client sees it. key = answer key (question id, plus "#n" for repeated copies). */
export function ClientQuestion({ q, value, onAnswer, answerKey }) {
  const st = q.questionsectionsettings || {};
  if (q.type === TEXT_BLOCK) return <div className={cn(RICH_TEXT, 'rounded-lg bg-subtle px-4 py-3')} dangerouslySetInnerHTML={{ __html: q.text }} />;   // from this app's own editor
  const label = <span className="text-sm font-medium text-foreground">{q.text || `Untitled ${q.type.toLowerCase()}`}{st.required && <span className="text-danger-700"> *</span>}</span>;
  const opts = q.options.filter((o) => o.text.trim());
  return (
    <div className="flex flex-col">
      {['Radio Buttons', 'Yes/No', 'Checkboxes'].includes(q.type) ? (
        <fieldset>
          <legend>{label}</legend>
          {st.descriptionEnabled && st.description && <p className="mt-0.5 text-sm text-muted-foreground">{st.description}</p>}
          <div className={cn('mt-2 flex gap-2', q.type === 'Yes/No' ? 'flex-row flex-wrap' : 'flex-col')}>
            {opts.map((o) => {
              const multi = q.type === 'Checkboxes';
              const checked = multi ? (value || []).includes(o.text) : value === o.text;
              return (
                <label key={o.id} className={cn('flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition-colors',
                  checked ? 'border-primary/50 bg-brand-50 text-foreground' : 'bg-card hover:bg-accent', q.type === 'Yes/No' && 'min-w-[96px]')}>
                  <input type={multi ? 'checkbox' : 'radio'} name={answerKey} checked={checked} className="size-4 accent-primary"
                    onChange={() => onAnswer(multi ? (checked ? (value || []).filter((x) => x !== o.text) : [...(value || []), o.text]) : o.text)} />
                  {o.text}
                </label>
              );
            })}
          </div>
        </fieldset>
      ) : (
        <label className="flex flex-col gap-1">
          {label}
          {st.descriptionEnabled && st.description && <span className="text-sm text-muted-foreground">{st.description}</span>}
          {q.type === 'Dropdown' && (
            <select className="mt-1 flex h-9 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground shadow-xs focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20"
              value={value || ''} onChange={(e) => onAnswer(e.target.value)}>
              <option value="">Select…</option>
              {opts.map((o) => <option key={o.id}>{o.text}</option>)}
            </select>
          )}
          {['Free Entry', 'Email', 'Number', 'Date'].includes(q.type) && (
            <Input className="mt-1" type={{ Email: 'email', Number: 'number', Date: 'date' }[q.type] || 'text'} value={value || ''} onChange={(e) => onAnswer(e.target.value)} />
          )}
          {q.type === 'File Upload' && (
            <span className="mt-1 flex flex-col items-center gap-1.5 rounded-lg border border-dashed border-line-strong bg-subtle px-4 py-5 text-center text-sm text-muted-foreground">
              <span className="inline-flex size-8 items-center justify-center rounded-md border bg-card shadow-xs"><CloudUpload className="size-4" aria-hidden="true" /></span>
              Upload files (disabled in preview)
            </span>
          )}
        </label>
      )}
      {st.prefilled && <span className="mt-1 text-xs text-muted-foreground">Pre-filled from the client’s previous organizer when available</span>}
    </div>
  );
}

/** Preview of the organizer as the client fills it in — conditions apply live. */
export default function OrganizerPreview({ organizer, onClose }) {
  const [answers, setAnswers] = useState({});
  const [copies, setCopies] = useState({});        // { sectionId: extra copies }
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const visibleSections = useMemo(() => organizer.sections.filter((s) => conditionsMet(s.sectionsettings, answers)), [organizer.sections, answers]);
  const at = Math.min(step, visibleSections.length - 1);
  const current = visibleSections[at];
  const answer = (key, v) => setAnswers((a) => ({ ...a, [key]: v }));

  return (
    <Modal title="Organizer preview" subtitle={organizer.templatename || 'Untitled template'} description="This is what your client sees. Conditions apply as you answer." onClose={onClose} width="max-w-3xl"
      bodyClassName="bg-canvas"
      footer={<Button variant="outline" onClick={onClose}>Close preview</Button>}>
      <div className="mx-auto max-w-2xl overflow-hidden rounded-xl border bg-card shadow-card">
        <div className="border-b px-5 py-4 sm:px-6">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Client portal</div>
          <h3 className="mt-0.5 text-xl font-semibold tracking-tight"><Shortcodes text={organizer.organizerName || 'Untitled organizer'} /></h3>
        </div>
        <div className="p-5 sm:p-6">
          {!visibleSections.length ? <p className="text-sm text-muted-foreground">No sections to show yet.</p> : done ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <span className="mb-1 inline-flex size-12 items-center justify-center rounded-full bg-success-50 text-success-700 ring-8 ring-success-50/50"><CircleCheck className="size-6" aria-hidden="true" /></span>
              <p className="text-lg font-semibold">Organizer submitted</p>
              <p className="text-sm text-muted-foreground">This is a preview — nothing was sent.</p>
              <Button variant="outline" className="mt-2" onClick={() => { setDone(false); setStep(0); setAnswers({}); setCopies({}); }}><RotateCcw aria-hidden="true" />Start over</Button>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <Select value={String(at)} onValueChange={(v) => setStep(Number(v))}>
                  <SelectTrigger aria-label="Go to section" className="h-8 w-auto max-w-[260px] gap-2"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {visibleSections.map((s, i) => <SelectItem key={s.id} value={String(i)}>{i + 1}. {s.text || 'Untitled section'}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="h-1.5 min-w-[80px] flex-1 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                  <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${((at + 1) / visibleSections.length) * 100}%` }} />
                </div>
                <span className="text-xs font-medium tabular-nums text-muted-foreground">Step {at + 1} of {visibleSections.length}</span>
              </div>

              <section aria-label={`Section: ${current.text}`} className="mt-6">
                {Array.from({ length: 1 + (copies[current.id] || 0) }, (_, copy) => (
                  <div key={copy} className={cn('flex flex-col gap-5', copy > 0 && 'mt-6 border-t border-dashed pt-6')}>
                    <h4 className="text-lg font-semibold tracking-tight">{current.text}{copy > 0 ? ` (${copy + 1})` : ''}</h4>
                    {current.formElements
                      .filter((q) => conditionsMet(q.questionsectionsettings, answers))
                      .map((q) => {
                        const key = copy ? `${q.id}#${copy}` : q.id;
                        return <ClientQuestion key={key} q={q} answerKey={key} value={answers[key]} onAnswer={(v) => answer(key, v)} />;
                      })}
                    {!current.formElements.length && <p className="text-sm text-muted-foreground">This section has no questions yet.</p>}
                  </div>
                ))}
                {current.sectionsettings?.sectionRepeatingMode && (
                  <Button variant="outline" size="sm" className="mt-5" onClick={() => setCopies((c) => ({ ...c, [current.id]: (c[current.id] || 0) + 1 }))}>
                    <Plus aria-hidden="true" /> {current.sectionsettings.buttonName || 'Repeat Section'}
                  </Button>
                )}
              </section>

              <div className="mt-8 flex justify-between border-t pt-4">
                <Button variant="outline" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}><ChevronLeft aria-hidden="true" /> Back</Button>
                {at < visibleSections.length - 1
                  ? <Button onClick={() => setStep((s) => s + 1)}>Next <ChevronRight aria-hidden="true" /></Button>
                  : <Button onClick={() => setDone(true)}>Submit</Button>}
              </div>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
