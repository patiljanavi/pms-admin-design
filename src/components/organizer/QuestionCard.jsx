import {
  ArrowDown, ArrowUp, Asterisk, AtSign, CalendarDays, ChevronDown, ChevronUp, CircleDot, CloudUpload, GitBranch, GripVertical,
  Hash, History, Pilcrow, Plus, Settings2, SquareCheck, SquareChevronDown, Text, ToggleLeft, Trash2, Type, X,
} from 'lucide-react';
import TextEditor from '../TextEditor';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { SimpleTooltip } from '../ui/tooltip';
import { cn } from 'lib/utils';
import { TEXT_BLOCK, hasOptions, newOption } from '../../data/organizerTemplates';

/** Icon + tint per question type (used by the cards, the add-question menu and the section outline). */
export const QUESTION_TYPE_META = {
  'Free Entry': { icon: Type, tone: 'bg-brand-50 text-brand-700 border-brand-100', hint: 'Short text answer' },
  Email: { icon: AtSign, tone: 'bg-brand-50 text-brand-700 border-brand-100', hint: 'Email address' },
  Number: { icon: Hash, tone: 'bg-brand-50 text-brand-700 border-brand-100', hint: 'Numbers only' },
  Date: { icon: CalendarDays, tone: 'bg-brand-50 text-brand-700 border-brand-100', hint: 'Date picker' },
  'Radio Buttons': { icon: CircleDot, tone: 'bg-violet-50 text-violet-700 border-violet-200/60', hint: 'Pick one option' },
  Checkboxes: { icon: SquareCheck, tone: 'bg-violet-50 text-violet-700 border-violet-200/60', hint: 'Pick any options' },
  Dropdown: { icon: SquareChevronDown, tone: 'bg-violet-50 text-violet-700 border-violet-200/60', hint: 'Pick one from a list' },
  'Yes/No': { icon: ToggleLeft, tone: 'bg-success-50 text-success-700 border-success-100', hint: 'Yes or no' },
  'File Upload': { icon: CloudUpload, tone: 'bg-warning-50 text-warning-700 border-warning-100', hint: 'Client uploads files' },
  [TEXT_BLOCK]: { icon: Pilcrow, tone: 'bg-muted text-muted-foreground border-border', hint: 'Instructions or information' },
};
const fallbackMeta = { icon: Text, tone: 'bg-muted text-muted-foreground border-border' };

/** Small tinted tile with the question type's icon. */
export function QuestionTypeIcon({ type, size = 'md', className }) {
  const meta = QUESTION_TYPE_META[type] || fallbackMeta;
  const Icon = meta.icon;
  return (
    <span className={cn('inline-flex flex-none items-center justify-center rounded-md border', meta.tone,
      size === 'sm' ? 'size-5 [&_svg]:size-3' : 'size-7 [&_svg]:size-3.5', className)} aria-hidden="true">
      <Icon />
    </span>
  );
}

const iconBtn = 'inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-30 [&_svg]:size-3.5';

/** One question (or text block) in a section, with its options editor. */
export default function QuestionCard({ q, index, total, onChange, onDelete, onSettings, onMove, dragProps = {}, dragging, id }) {
  const st = q.questionsectionsettings || {};
  const isText = q.type === TEXT_BLOCK;
  const set = (changes) => onChange({ ...q, ...changes });
  const setOption = (oid, text) => set({ options: q.options.map((o) => (o.id === oid ? { ...o, text } : o)) });
  const moveOption = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= q.options.length) return;
    const list = [...q.options];
    [list[i], list[j]] = [list[j], list[i]];
    set({ options: list });
  };
  const marker = (i) => (q.type === 'Checkboxes' ? <span className="size-4 flex-none rounded-[4px] border-2 border-line-strong" />
    : q.type === 'Dropdown' ? <span className="w-4 flex-none text-center text-xs font-semibold tabular-nums text-muted-foreground">{i + 1}.</span>
      : <span className="size-4 flex-none rounded-full border-2 border-line-strong" />);
  const name = isText ? 'Text block' : q.text || `Untitled ${q.type.toLowerCase()}`;
  const empty = !isText && !q.text.trim();

  return (
    <li id={id} aria-label={`Question ${index + 1}: ${q.type}`} {...dragProps}
      className={cn('group/q relative scroll-mt-24 rounded-xl border bg-card shadow-xs transition-[border-color,box-shadow,opacity]',
        'hover:border-line-strong hover:shadow-raised focus-within:border-primary/50 focus-within:shadow-raised focus-within:ring-[3px] focus-within:ring-primary/10',
        dragging && 'border-dashed border-primary opacity-50 shadow-none')}>
      {/* Header: drag handle · type · badges · hover toolbar */}
      <div className="flex flex-wrap items-center gap-2 px-3 pt-3">
        <SimpleTooltip label="Drag to reorder">
          <span className="-ml-1 inline-flex h-7 w-5 flex-none cursor-grab items-center justify-center rounded text-muted-foreground/50 transition-colors hover:bg-accent hover:text-muted-foreground active:cursor-grabbing group-hover/q:text-muted-foreground" aria-hidden="true">
            <GripVertical className="size-4" />
          </span>
        </SimpleTooltip>
        <QuestionTypeIcon type={q.type} />
        <span className="text-xs font-medium text-muted-foreground">
          {!isText && <span className="tabular-nums text-foreground">Q{index + 1}</span>}
          {!isText && <span className="mx-1.5 text-muted-foreground/50">·</span>}
          {isText ? 'Text block' : q.type}
        </span>
        {st.required && <Badge variant="danger"><Asterisk aria-hidden="true" />Required</Badge>}
        {st.conditional && <Badge variant="success"><GitBranch aria-hidden="true" />Conditional question</Badge>}
        {st.prefilled && <Badge variant="neutral"><History aria-hidden="true" />Pre-filled</Badge>}
        {st.descriptionEnabled && <Badge variant="neutral">Description</Badge>}
        <span className="ml-auto flex items-center gap-0.5 rounded-lg transition-opacity sm:opacity-0 sm:group-hover/q:opacity-100 sm:group-focus-within/q:opacity-100">
          <SimpleTooltip label="Move up"><button type="button" onClick={() => onMove(-1)} disabled={index === 0} aria-label={`Move ${name} up`} className={iconBtn}><ArrowUp aria-hidden="true" /></button></SimpleTooltip>
          <SimpleTooltip label="Move down"><button type="button" onClick={() => onMove(1)} disabled={index === total - 1} aria-label={`Move ${name} down`} className={iconBtn}><ArrowDown aria-hidden="true" /></button></SimpleTooltip>
          {!isText && <SimpleTooltip label="Settings"><button type="button" onClick={onSettings} aria-label={`Settings for ${name}`} className={iconBtn}><Settings2 aria-hidden="true" /></button></SimpleTooltip>}
          <span className="mx-0.5 h-4 w-px bg-border" aria-hidden="true" />
          <SimpleTooltip label="Delete"><button type="button" onClick={onDelete} aria-label={`Delete ${name}`} className={cn(iconBtn, 'hover:bg-danger-50 hover:text-danger-700')}><Trash2 aria-hidden="true" /></button></SimpleTooltip>
        </span>
      </div>

      <div className="px-3 pb-3 pt-2.5 sm:pl-10">
        {isText ? (
          <TextEditor ariaLabel={`Text block ${index + 1}`} value={q.text} onChange={(html) => set({ text: html })} placeholder="Instructions or information for the client…" minHeight={100} />
        ) : (
          <input aria-label={`Question ${index + 1} text`} value={q.text}
            className={cn('flex h-10 w-full min-w-0 rounded-md border bg-card px-3 text-md font-medium text-foreground shadow-xs transition-[box-shadow,border-color] placeholder:font-normal placeholder:text-muted-foreground/70',
              'focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20',
              empty ? 'border-dashed border-warning-300' : 'border-input')}
            placeholder={q.type === 'Date' ? 'Question, e.g. Date of birth (MM/DD/YYYY)' : `Question, e.g. ${q.type === 'Email' ? 'Email address' : q.type === 'Number' ? 'Number of dependents' : q.type === 'File Upload' ? 'Upload your W-2' : 'What is your…?'}`}
            onChange={(e) => set({ text: e.target.value })} />
        )}
        {st.descriptionEnabled && st.description && <p className="mt-1.5 px-0.5 text-sm text-muted-foreground">{st.description}</p>}

        {hasOptions(q.type) && (
          <div className="mt-3 flex flex-col gap-1">
            {q.options.map((o, i) => (
              <div key={o.id} className="group/opt flex items-center gap-2 rounded-md pl-1">
                {marker(i)}
                <input aria-label={`Question ${index + 1} option ${i + 1}`} value={o.text} placeholder={`Option ${i + 1}`} onChange={(e) => setOption(o.id, e.target.value)}
                  className="h-8 min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-2 text-sm text-foreground transition-[box-shadow,border-color] placeholder:text-muted-foreground/70 hover:border-input focus-visible:border-ring focus-visible:bg-card focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20" />
                <span className="flex items-center transition-opacity sm:opacity-0 sm:group-hover/opt:opacity-100 sm:group-focus-within/opt:opacity-100">
                  <button type="button" onClick={() => moveOption(i, -1)} disabled={i === 0} aria-label={`Move option ${i + 1} up`} className={iconBtn}><ChevronUp aria-hidden="true" /></button>
                  <button type="button" onClick={() => moveOption(i, 1)} disabled={i === q.options.length - 1} aria-label={`Move option ${i + 1} down`} className={iconBtn}><ChevronDown aria-hidden="true" /></button>
                  <button type="button" onClick={() => set({ options: q.options.filter((x) => x.id !== o.id) })} aria-label={`Delete option ${i + 1}`} className={cn(iconBtn, 'hover:bg-danger-50 hover:text-danger-700')}><X aria-hidden="true" /></button>
                </span>
              </div>
            ))}
            <Button type="button" variant="ghost" size="xs" onClick={() => set({ options: [...q.options, newOption()] })} className="mt-0.5 self-start text-muted-foreground hover:text-foreground">
              <Plus aria-hidden="true" /> Add option
            </Button>
          </div>
        )}
        {q.type === 'File Upload' && (
          <div className="mt-3 flex items-center gap-3 rounded-lg border border-dashed border-line-strong bg-subtle px-4 py-3 text-sm text-muted-foreground">
            <span className="inline-flex size-8 items-center justify-center rounded-md border bg-card shadow-xs"><CloudUpload className="size-4" aria-hidden="true" /></span>
            Client uploads files here
          </div>
        )}
      </div>
    </li>
  );
}
