import { useEffect, useRef, useState } from 'react';
import { ListChecks, Lock, Plus, Trash2, X } from 'lucide-react';
import { CloseButton } from '../ui';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { Progress } from '../ui/progress';
import { SimpleTooltip } from '../ui/tooltip';
import { cn } from 'lib/utils';

/**
 * Right-side panel for a chat's client tasks: progress, list (tick / remove) and an "Add tasks" form.
 * Props: tasks · readOnly · onToggle(id) · onRemove(id) · onSend(texts) · onClose()
 */
export default function TasksPanel({ tasks, readOnly, onToggle, onRemove, onSend, onClose }) {
  const [rows, setRows] = useState([{ id: 1, text: '' }]);
  const [error, setError] = useState('');
  const firstInput = useRef(null);
  const done = tasks.filter((t) => t.done).length;
  const filled = rows.filter((r) => r.text.trim());

  useEffect(() => { if (!readOnly) firstInput.current?.focus(); }, [readOnly]);
  // Esc closes the panel
  useEffect(() => {
    // …unless a menu handled it or a dialog is open on top
    const h = (e) => { if (e.key === 'Escape' && !e.defaultPrevented && !document.querySelector('[role="dialog"]')) onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  const send = () => {
    if (!filled.length) { setError('Write at least one task.'); return; }
    onSend(filled.map((r) => r.text.trim()));
    setRows([{ id: Date.now(), text: '' }]);
    setError('');
    setTimeout(() => firstInput.current?.focus(), 0);
  };

  return (
    <aside aria-label="Client tasks panel"
      className="absolute inset-y-0 right-0 z-20 flex w-full flex-col border-l bg-card shadow-pop sm:w-[340px] xl:static xl:z-auto xl:w-[320px] xl:flex-none xl:shadow-none">
      <header className="flex items-start gap-2 border-b px-4 py-3">
        <span className="mt-0.5 inline-flex size-7 flex-none items-center justify-center rounded-md border bg-subtle text-muted-foreground" aria-hidden="true"><ListChecks className="size-4" /></span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold">Client tasks</h3>
          <p className="text-xs text-muted-foreground">The client ticks these off in the chat.</p>
        </div>
        <CloseButton onClick={onClose} label="Close tasks panel" className="-mr-1.5 -mt-0.5" />
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {/* progress + list */}
        <div className="px-4 py-4">
          <div className="mb-3 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-foreground" data-testid="tasks-progress">{done} of {tasks.length} done</span>
              <span className="tabular-nums text-muted-foreground">{tasks.length ? Math.round((done / tasks.length) * 100) : 0}%</span>
            </div>
            <Progress value={tasks.length ? (done / tasks.length) * 100 : 0} className="h-1.5" indicatorClassName="bg-success-500" aria-hidden="true" />
          </div>
          {tasks.length ? (
            <ul aria-label="Tasks" className="-mx-1.5 flex flex-col gap-0.5">
              {tasks.map((t) => (
                <li key={t.id} className="group flex items-start gap-2 rounded-md px-1.5 py-1.5 transition-colors hover:bg-accent/60">
                  <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-2.5 text-sm">
                    <Checkbox checked={t.done} disabled={readOnly} onCheckedChange={() => onToggle(t.id)} className="mt-0.5" />
                    <span className={cn('min-w-0 break-words', t.done && 'text-muted-foreground line-through')}>{t.text}</span>
                  </label>
                  {!readOnly && (
                    <SimpleTooltip label="Remove task">
                      <button type="button" onClick={() => onRemove(t.id)} aria-label={`Remove task ${t.text}`}
                        className="inline-flex size-6 flex-none items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity hover:bg-danger-50 hover:text-danger-700 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 group-hover:opacity-100">
                        <X className="size-3.5" aria-hidden="true" />
                      </button>
                    </SimpleTooltip>
                  )}
                </li>
              ))}
            </ul>
          ) : <p className="rounded-lg border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">No tasks in this chat yet.</p>}
        </div>

        {/* add tasks */}
        {readOnly ? (
          <p className="mt-auto flex items-center gap-2 border-t bg-subtle px-4 py-3 text-sm text-muted-foreground"><Lock className="size-3.5 flex-none" aria-hidden="true" />This chat is archived — tasks can’t be changed.</p>
        ) : (
          <form noValidate onSubmit={(e) => { e.preventDefault(); send(); }} className="mt-auto border-t bg-subtle/60 px-4 py-4">
            <h4 className="text-sm font-medium">Add tasks</h4>
            <p className="mb-3 text-xs text-muted-foreground">Sent to the client as a task card in the chat.</p>
            <div className="flex flex-col gap-2">
              {rows.map((r, i) => (
                <div key={r.id} className="flex items-center gap-2">
                  <span className="size-4 flex-none rounded-[4px] border border-line-strong bg-card" aria-hidden="true" />
                  <Input ref={i === 0 ? firstInput : undefined} aria-label={`New task ${i + 1}`} value={r.text} placeholder="e.g. Upload your W-2"
                    className="h-8" aria-invalid={!!error && !r.text.trim()}
                    onChange={(e) => { setRows((l) => l.map((x) => (x.id === r.id ? { ...x, text: e.target.value } : x))); setError(''); }}
                    onKeyDown={(e) => { if (e.key === 'Enter' && r.text.trim() && i === rows.length - 1) { e.preventDefault(); setRows((l) => [...l, { id: Date.now(), text: '' }]); } }} />
                  {rows.length > 1 && (
                    <Button type="button" variant="ghost" size="icon-xs" onClick={() => setRows((l) => l.filter((x) => x.id !== r.id))} aria-label={`Remove new task ${i + 1}`}
                      className="text-muted-foreground hover:bg-danger-50 hover:text-danger-700"><Trash2 /></Button>
                  )}
                </div>
              ))}
            </div>
            <Button type="button" variant="ghost" size="xs" className="-ml-2 mt-2 text-muted-foreground" onClick={() => setRows((l) => [...l, { id: Date.now(), text: '' }])}><Plus />Add another</Button>
            {error && <p role="alert" className="mt-1 text-xs text-danger-700">{error}</p>}
            <Button type="submit" className="mt-3 w-full">{filled.length > 1 ? `Send ${filled.length} tasks` : 'Send task'}</Button>
            <p className="mt-1.5 text-center text-[11px] text-muted-foreground">Press Enter to add the next task.</p>
          </form>
        )}
      </div>
    </aside>
  );
}
