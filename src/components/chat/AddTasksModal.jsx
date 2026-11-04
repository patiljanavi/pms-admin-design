import { useState } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { Modal } from '../ui';

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
    <Modal title="Add client tasks" subtitle="The client sees these in the chat and ticks them off" onClose={onClose} width="max-w-md"
      footer={<><button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <button type="button" className="btn-primary" onClick={send}>{filled.length > 1 ? `Send ${filled.length} tasks` : 'Send task'}</button></>}>
      <form noValidate onSubmit={(e) => { e.preventDefault(); send(); }} className="flex flex-col gap-2">
        {rows.map((r, i) => (
          <div key={r.id} className="flex items-center gap-2">
            <span className="h-4 w-4 flex-none rounded border-2 border-line-strong" aria-hidden="true" />
            <input autoFocus={i === rows.length - 1} aria-label={`New task ${i + 1}`} className="input min-h-[40px] flex-1" value={r.text} placeholder="e.g. Upload your W-2"
              onChange={(e) => { setRows((l) => l.map((x) => (x.id === r.id ? { ...x, text: e.target.value } : x))); setError(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter' && r.text.trim() && i === rows.length - 1) { e.preventDefault(); setRows((l) => [...l, { id: Date.now(), text: '' }]); } }} />
            {rows.length > 1 && <button type="button" onClick={() => setRows((l) => l.filter((x) => x.id !== r.id))} aria-label={`Remove new task ${i + 1}`} className="flex h-9 w-9 items-center justify-center rounded text-muted hover:bg-danger-50 hover:text-danger-700"><FiTrash2 aria-hidden="true" /></button>}
          </div>
        ))}
        <button type="button" className="btn-link self-start px-0 text-sm" onClick={() => setRows((l) => [...l, { id: Date.now(), text: '' }])}><FiPlus aria-hidden="true" /> Add another</button>
        <p className="text-xs text-muted">Tip: press Enter to add the next task.</p>
        {error && <p role="alert" className="text-sm text-danger-700">{error}</p>}
      </form>
    </Modal>
  );
}