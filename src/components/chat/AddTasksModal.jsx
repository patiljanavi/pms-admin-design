import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Modal } from '../ui';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

/** Add one or more client tasks to a chat. Calls onSend(['Task one', 'Task two']). */
export default function AddTasksModal({ onSend, onClose }) {
  const [rows, setRows] = useState([{ id: 1, text: '' }]);
  const [error, setError] = useState('');
  const filled = rows.filter((r) => r.text.trim());
  const send = () => {
    if (!filled.length) { setError('Write at least one task.'); return; }
    onSend(filled.map((r) => r.text.trim()));
  };
  return (
    <Modal title="Add client tasks" description="The client sees these in the chat and ticks them off." onClose={onClose} width="max-w-md"
      footer={<><Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="button" onClick={send}>{filled.length > 1 ? `Send ${filled.length} tasks` : 'Send task'}</Button></>}>
      <form noValidate onSubmit={(e) => { e.preventDefault(); send(); }} className="flex flex-col gap-2">
        {rows.map((r, i) => (
          <div key={r.id} className="flex items-center gap-2">
            <span className="size-4 flex-none rounded-[4px] border border-line-strong bg-card" aria-hidden="true" />
            <Input autoFocus={i === rows.length - 1} aria-label={`New task ${i + 1}`} className="flex-1" value={r.text} placeholder="e.g. Upload your W-2"
              aria-invalid={!!error && !r.text.trim()}
              onChange={(e) => { setRows((l) => l.map((x) => (x.id === r.id ? { ...x, text: e.target.value } : x))); setError(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter' && r.text.trim() && i === rows.length - 1) { e.preventDefault(); setRows((l) => [...l, { id: Date.now(), text: '' }]); } }} />
            {rows.length > 1 && (
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => setRows((l) => l.filter((x) => x.id !== r.id))} aria-label={`Remove new task ${i + 1}`}
                className="text-muted-foreground hover:bg-danger-50 hover:text-danger-700"><Trash2 /></Button>
            )}
          </div>
        ))}
        <Button type="button" variant="ghost" size="sm" className="-ml-2 self-start text-muted-foreground" onClick={() => setRows((l) => [...l, { id: Date.now(), text: '' }])}><Plus />Add another</Button>
        <p className="text-xs text-muted-foreground">Tip: press Enter to add the next task.</p>
        {error && <p role="alert" className="text-xs text-danger-700">{error}</p>}
      </form>
    </Modal>
  );
}
