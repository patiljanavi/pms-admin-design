import { useMemo, useState } from 'react';
import { FiCheckCircle, FiChevronLeft, FiChevronRight, FiPlus, FiUploadCloud } from 'react-icons/fi';
import { Modal, cx } from '../ui';
import { TEXT_BLOCK, conditionsMet } from '../../data/organizerTemplates';

const Shortcodes = ({ text = '' }) => text.split(/(\[[A-Z0-9_]+\])/g).map((p, i) => (/^\[[A-Z0-9_]+\]$/.test(p) ? <span key={i} className="te-field">{p}</span> : <span key={i}>{p}</span>));

/** One question as the client sees it. key = answer key (question id, plus "#n" for repeated copies). */
function ClientQuestion({ q, value, onAnswer, answerKey }) {
  const st = q.questionsectionsettings || {};
  if (q.type === TEXT_BLOCK) return <div className="te-content text-sm" dangerouslySetInnerHTML={{ __html: q.text }} />;   // from this app's own editor
  const label = <span className="font-semibold">{q.text || `Untitled ${q.type.toLowerCase()}`}{st.required && <span className="text-danger-700"> *</span>}</span>;
  const opts = q.options.filter((o) => o.text.trim());
  const input = 'input mt-1.5';
  return (
    <div className="flex flex-col">
      {['Radio Buttons', 'Yes/No', 'Checkboxes'].includes(q.type) ? (
        <fieldset>
          <legend>{label}</legend>
          {st.descriptionEnabled && st.description && <p className="text-sm text-muted">{st.description}</p>}
          <div className={cx('mt-2 flex gap-x-5 gap-y-2', q.type === 'Yes/No' ? 'flex-row' : 'flex-col')}>
            {opts.map((o) => {
              const multi = q.type === 'Checkboxes';
              const checked = multi ? (value || []).includes(o.text) : value === o.text;
              return (
                <label key={o.id} className="flex cursor-pointer items-center gap-2">
                  <input type={multi ? 'checkbox' : 'radio'} name={answerKey} checked={checked} className="h-[18px] w-[18px] accent-brand-600"
                    onChange={() => onAnswer(multi ? (checked ? (value || []).filter((x) => x !== o.text) : [...(value || []), o.text]) : o.text)} />
                  {o.text}
                </label>
              );
            })}
          </div>
        </fieldset>
      ) : (
        <label className="flex flex-col">
          {label}
          {st.descriptionEnabled && st.description && <span className="text-sm text-muted">{st.description}</span>}
          {q.type === 'Dropdown' && (
            <select className={input} value={value || ''} onChange={(e) => onAnswer(e.target.value)}>
              <option value="">Select…</option>
              {opts.map((o) => <option key={o.id}>{o.text}</option>)}
            </select>
          )}
          {['Free Entry', 'Email', 'Number', 'Date'].includes(q.type) && (
            <input className={input} type={{ Email: 'email', Number: 'number', Date: 'date' }[q.type] || 'text'} value={value || ''} onChange={(e) => onAnswer(e.target.value)} />
          )}
          {q.type === 'File Upload' && <span className="mt-1.5 flex items-center gap-2 rounded border border-dashed border-line-strong p-4 text-sm text-muted"><FiUploadCloud aria-hidden="true" /> Upload files (disabled in preview)</span>}
        </label>
      )}
      {st.prefilled && <span className="mt-1 text-xs text-muted">Pre-filled from the client’s previous organizer when available</span>}
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
  const current = visibleSections[Math.min(step, visibleSections.length - 1)];
  const answer = (key, v) => setAnswers((a) => ({ ...a, [key]: v }));

  return (
    <Modal title="Organizer preview" subtitle={organizer.templatename || 'Untitled template'} onClose={onClose} width="max-w-3xl"
      footer={<button type="button" className="btn-secondary" onClick={onClose}>Close preview</button>}>
      <div className="rounded-lg border border-line bg-surface p-5 sm:p-6">
        <h3 className="text-xl font-bold"><Shortcodes text={organizer.organizerName || 'Untitled organizer'} /></h3>
        {!visibleSections.length ? <p className="mt-4 text-muted">No sections to show yet.</p> : done ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <FiCheckCircle size={40} className="text-success-700" aria-hidden="true" />
            <p className="text-lg font-semibold">Organizer submitted</p>
            <p className="text-sm text-muted">This is a preview — nothing was sent.</p>
            <button type="button" className="btn-secondary mt-2" onClick={() => { setDone(false); setStep(0); setAnswers({}); setCopies({}); }}>Start over</button>
          </div>
        ) : (
          <>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <select aria-label="Go to section" className="input min-h-[38px] w-auto text-sm" value={Math.min(step, visibleSections.length - 1)} onChange={(e) => setStep(Number(e.target.value))}>
                {visibleSections.map((s, i) => <option key={s.id} value={i}>{i + 1}. {s.text || 'Untitled section'}</option>)}
              </select>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-subtle" aria-hidden="true"><div className="h-full bg-brand-600 transition-all" style={{ width: `${((Math.min(step, visibleSections.length - 1) + 1) / visibleSections.length) * 100}%` }} /></div>
              <span className="text-sm text-muted">Step {Math.min(step, visibleSections.length - 1) + 1} of {visibleSections.length}</span>
            </div>

            <section aria-label={`Section: ${current.text}`} className="mt-5">
              {Array.from({ length: 1 + (copies[current.id] || 0) }, (_, copy) => (
                <div key={copy} className={cx('flex flex-col gap-5', copy > 0 && 'mt-5 border-t border-dashed border-line-strong pt-5')}>
                  <h4 className="text-lg font-semibold">{current.text}{copy > 0 ? ` (${copy + 1})` : ''}</h4>
                  {current.formElements
                    .filter((q) => conditionsMet(q.questionsectionsettings, answers))
                    .map((q) => {
                      const key = copy ? `${q.id}#${copy}` : q.id;
                      return <ClientQuestion key={key} q={q} answerKey={key} value={answers[key]} onAnswer={(v) => answer(key, v)} />;
                    })}
                  {!current.formElements.length && <p className="text-sm text-muted">This section has no questions yet.</p>}
                </div>
              ))}
              {current.sectionsettings?.sectionRepeatingMode && (
                <button type="button" className="btn-secondary mt-4" onClick={() => setCopies((c) => ({ ...c, [current.id]: (c[current.id] || 0) + 1 }))}>
                  <FiPlus aria-hidden="true" /> {current.sectionsettings.buttonName || 'Repeat Section'}
                </button>
              )}
            </section>

            <div className="mt-6 flex justify-between border-t border-line pt-4">
              <button type="button" className="btn-secondary" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}><FiChevronLeft aria-hidden="true" /> Back</button>
              {Math.min(step, visibleSections.length - 1) < visibleSections.length - 1
                ? <button type="button" className="btn-primary" onClick={() => setStep((s) => s + 1)}>Next <FiChevronRight aria-hidden="true" /></button>
                : <button type="button" className="btn-primary" onClick={() => setDone(true)}>Submit</button>}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
