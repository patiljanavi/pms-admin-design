import { useEffect, useRef, useState } from 'react';
import { FiCheckSquare, FiPlus, FiTrash2, FiX } from 'react-icons/fi';
import { cx } from '../ui';

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
      className="absolute inset-y-0 right-0 z-20 flex w-full flex-col border-l border-line bg-surface shadow-pop sm:w-[340px] xl:static xl:z-auto xl:w-[320px] xl:flex-none xl:shadow-none">
      <header className="flex items-center gap-2 border-b border-line bg-subtle/60 px-4 py-3">
        <FiCheckSquare className="text-brand-600" aria-hidden="true" />
        <h3 className="flex-1 font-semibold">Client tasks</h3>
        <button type="button" onClick={onClose} aria-label="Close tasks panel" className="flex h-8 w-8 items-center justify-center rounded text-muted hover:bg-surface hover:text-ink"><FiX aria-hidden="true" /></button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {/* progress + list */}
        <div className="px-4 py-3">
          <div className="mb-2 flex items-center gap-2 text-sm">
            <span className="font-semibold" data-testid="tasks-progress">{done} of {tasks.length} done</span>
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-subtle" aria-hidden="true">
              <span className="block h-full rounded-full bg-success-700 transition-all" style={{ width: `${tasks.length ? (done / tasks.length) * 100 : 0}%` }} />
            </span>
          </div>
          {tasks.length ? (
            <ul aria-label="Tasks" className="flex flex-col gap-1">
              {tasks.map((t) => (
                <li key={t.id} className="group flex items-start gap-2 rounded-md px-2 py-1.5 hover:bg-subtle">
                  <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-2 text-sm">
                    <input type="checkbox" checked={t.done} disabled={readOnly} onChange={() => onToggle(t.id)} className="mt-0.5 h-4 w-4 flex-none accent-success-700" />
                    <span className={cx('break-words', t.done && 'text-muted line-through')}>{t.text}</span>
                  </label>
                  {!readOnly && (
                    <button type="button" onClick={() => onRemove(t.id)} aria-label={`Remove task ${t.text}`}
                      className="flex h-6 w-6 flex-none items-center justify-center rounded text-muted opacity-60 hover:bg-danger-50 hover:text-danger-700 group-hover:opacity-100"><FiX size={13} aria-hidden="true" /></button>
                  )}
                </li>
              ))}
            </ul>
          ) : <p className="rounded-md border border-dashed border-line-strong px-3 py-5 text-center text-sm text-muted">No tasks in this chat yet.</p>}
        </div>

        {/* add tasks */}
        {readOnly ? (
          <p className="mt-auto border-t border-line px-4 py-3 text-sm text-muted">This chat is archived — tasks can’t be changed.</p>
        ) : (
          <form noValidate onSubmit={(e) => { e.preventDefault(); send(); }} className="mt-auto border-t border-line px-4 py-4">
            <h4 className="mb-1 text-sm font-semibold">Add tasks</h4>
            <p className="mb-3 text-xs text-muted">Sent to the client as a task card in the chat.</p>
            <div className="flex flex-col gap-2">
              {rows.map((r, i) => (
                <div key={r.id} className="flex items-center gap-2">
                  <span className="h-4 w-4 flex-none rounded border-2 border-line-strong" aria-hidden="true" />
                  <input ref={i === 0 ? firstInput : undefined} aria-label={`New task ${i + 1}`} value={r.text} placeholder="e.g. Upload your W-2"
                    className="min-h-[38px] min-w-0 flex-1 rounded border border-line bg-subtle px-2.5 text-sm focus:border-brand-600 focus:outline-none"
                    onChange={(e) => { setRows((l) => l.map((x) => (x.id === r.id ? { ...x, text: e.target.value } : x))); setError(''); }}
                    onKeyDown={(e) => { if (e.key === 'Enter' && r.text.trim() && i === rows.length - 1) { e.preventDefault(); setRows((l) => [...l, { id: Date.now(), text: '' }]); } }} />
                  {rows.length > 1 && <button type="button" onClick={() => setRows((l) => l.filter((x) => x.id !== r.id))} aria-label={`Remove new task ${i + 1}`} className="flex h-8 w-8 items-center justify-center rounded text-muted hover:bg-danger-50 hover:text-danger-700"><FiTrash2 size={14} aria-hidden="true" /></button>}
                </div>
              ))}
            </div>
            <button type="button" className="btn-link mt-2 px-0 text-sm" onClick={() => setRows((l) => [...l, { id: Date.now(), text: '' }])}><FiPlus aria-hidden="true" /> Add another</button>
            {error && <p role="alert" className="mt-1 text-sm text-danger-700">{error}</p>}
            <button type="submit" className="btn-primary mt-3 w-full">{filled.length > 1 ? `Send ${filled.length} tasks` : 'Send task'}</button>
            <p className="mt-1.5 text-center text-xs text-muted">Press Enter to add the next task.</p>
          </form>
        )}
      </div>
    </aside>
  );
}
