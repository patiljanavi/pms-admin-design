import { FiArrowDown, FiArrowUp, FiMenu, FiPlus, FiSettings, FiTrash2, FiUploadCloud } from 'react-icons/fi';
import TextEditor from '../TextEditor';
import { cx } from '../ui';
import { TEXT_BLOCK, hasOptions, newOption } from '../../data/organizerTemplates';

const Badge = ({ tone, children }) => (
  <span className={cx('rounded-full px-2 py-0.5 text-[11px] font-semibold', tone === 'green' ? 'bg-success-50 text-success-700' : tone === 'red' ? 'bg-danger-50 text-danger-700' : 'bg-subtle text-muted')}>{children}</span>
);

/** One question (or text block) in a section, with its options editor. */
export default function QuestionCard({ q, index, total, onChange, onDelete, onSettings, onMove, dragProps = {}, dragging }) {
  const st = q.questionsectionsettings || {};
  const isText = q.type === TEXT_BLOCK;
  const set = (changes) => onChange({ ...q, ...changes });
  const setOption = (id, text) => set({ options: q.options.map((o) => (o.id === id ? { ...o, text } : o)) });
  const moveOption = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= q.options.length) return;
    const list = [...q.options];
    [list[i], list[j]] = [list[j], list[i]];
    set({ options: list });
  };
  const marker = (i) => (q.type === 'Checkboxes' ? <span className="h-4 w-4 flex-none rounded border-2 border-line-strong" />
    : q.type === 'Dropdown' ? <span className="w-4 flex-none text-center text-xs font-bold text-muted">{i + 1}.</span>
      : <span className="h-4 w-4 flex-none rounded-full border-2 border-line-strong" />);
  const name = isText ? 'Text block' : q.text || `Untitled ${q.type.toLowerCase()}`;

  return (
    <li aria-label={`Question ${index + 1}: ${q.type}`} {...dragProps}
      className={cx('rounded-lg border bg-surface p-3 transition-colors', dragging ? 'border-dashed border-brand-600 opacity-60' : 'border-line hover:border-line-strong')}>
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <span className="flex h-7 w-5 cursor-grab items-center justify-center text-muted" title="Drag to reorder" aria-hidden="true"><FiMenu /></span>
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">{isText ? 'Text block' : q.type}</span>
        {st.required && <Badge tone="red">Required</Badge>}
        {st.conditional && <Badge tone="green">Conditional question</Badge>}
        {st.prefilled && <Badge>Pre-filled</Badge>}
        {st.descriptionEnabled && <Badge>Description</Badge>}
        <span className="ml-auto flex gap-0.5">
          <button type="button" onClick={() => onMove(-1)} disabled={index === 0} aria-label={`Move ${name} up`} className="flex h-8 w-8 items-center justify-center rounded text-muted hover:bg-subtle disabled:opacity-30"><FiArrowUp aria-hidden="true" /></button>
          <button type="button" onClick={() => onMove(1)} disabled={index === total - 1} aria-label={`Move ${name} down`} className="flex h-8 w-8 items-center justify-center rounded text-muted hover:bg-subtle disabled:opacity-30"><FiArrowDown aria-hidden="true" /></button>
          {!isText && <button type="button" onClick={onSettings} aria-label={`Settings for ${name}`} title="Settings" className="flex h-8 w-8 items-center justify-center rounded text-muted hover:bg-subtle hover:text-ink"><FiSettings aria-hidden="true" /></button>}
          <button type="button" onClick={onDelete} aria-label={`Delete ${name}`} title="Delete" className="flex h-8 w-8 items-center justify-center rounded text-danger-700 hover:bg-danger-50"><FiTrash2 aria-hidden="true" /></button>
        </span>
      </div>

      {isText ? (
        <TextEditor ariaLabel={`Text block ${index + 1}`} value={q.text} onChange={(html) => set({ text: html })} placeholder="Instructions or information for the client…" minHeight={100} />
      ) : (
        <input aria-label={`Question ${index + 1} text`} className={cx('input', !q.text.trim() && 'border-warning-300')} value={q.text}
          placeholder={q.type === 'Date' ? 'Question, e.g. Date of birth (MM/DD/YYYY)' : `Question, e.g. ${q.type === 'Email' ? 'Email address' : q.type === 'Number' ? 'Number of dependents' : q.type === 'File Upload' ? 'Upload your W-2' : 'What is your…?'}`}
          onChange={(e) => set({ text: e.target.value })} />
      )}
      {st.descriptionEnabled && st.description && <p className="mt-1.5 text-xs text-muted">{st.description}</p>}

      {hasOptions(q.type) && (
        <div className="mt-3 flex flex-col gap-1.5 pl-1">
          {q.options.map((o, i) => (
            <div key={o.id} className="flex items-center gap-2">
              {marker(i)}
              <input aria-label={`Question ${index + 1} option ${i + 1}`} className="min-h-[36px] min-w-0 flex-1 rounded border border-line bg-surface px-2.5 text-sm focus:border-brand-600 focus:outline-none" value={o.text} placeholder={`Option ${i + 1}`} onChange={(e) => setOption(o.id, e.target.value)} />
              <button type="button" onClick={() => moveOption(i, -1)} disabled={i === 0} aria-label={`Move option ${i + 1} up`} className="h-8 w-7 rounded text-muted hover:bg-subtle disabled:opacity-30">↑</button>
              <button type="button" onClick={() => moveOption(i, 1)} disabled={i === q.options.length - 1} aria-label={`Move option ${i + 1} down`} className="h-8 w-7 rounded text-muted hover:bg-subtle disabled:opacity-30">↓</button>
              <button type="button" onClick={() => set({ options: q.options.filter((x) => x.id !== o.id) })} aria-label={`Delete option ${i + 1}`} className="flex h-8 w-8 items-center justify-center rounded text-muted hover:bg-danger-50 hover:text-danger-700"><FiTrash2 size={14} aria-hidden="true" /></button>
            </div>
          ))}
          <button type="button" onClick={() => set({ options: [...q.options, newOption()] })} className="btn-link mt-1 self-start px-0 text-sm"><FiPlus aria-hidden="true" /> Add option</button>
        </div>
      )}
      {q.type === 'File Upload' && <div className="mt-2 inline-flex items-center gap-2 rounded border border-dashed border-line-strong px-3 py-2 text-sm text-muted"><FiUploadCloud aria-hidden="true" /> Client uploads files here</div>}
    </li>
  );
}
