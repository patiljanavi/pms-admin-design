import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiSearch } from 'react-icons/fi';
import { Avatar, Modal, Segmented, cx, initials } from '../components/ui';
import { seedAccounts, COLUMNS, seedTasks } from '../data/sampleData';

const PRIO = { High: 'text-danger-700', Medium: 'text-warning-700', Low: 'text-muted' };
const PEOPLE = seedAccounts.slice(0, 12).map((a) => a.owner);

export default function Tasks() {
  const [tasks, setTasks] = useState(seedTasks);
  const [q, setQ] = useState('');
  const [dragId, setDragId] = useState(null);
  const [over, setOver] = useState(null);
  const [draft, setDraft] = useState(null); // new task form

  const move = (id, col) => setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, col } : t)));
  const visible = useMemo(() => {
    const s = q.trim().toLowerCase();
    return tasks.filter((t) => !s || `${t.title} ${t.tag} ${t.who}`.toLowerCase().includes(s));
  }, [tasks, q]);

  const saveTask = () => {
    setTasks((ts) => [...ts, { id: `T-${200 + ts.length}`, title: draft.title.trim() || 'Untitled task', tag: 'New', priority: draft.priority, col: draft.col, who: draft.who, due: '[Due date]' }]);
    setDraft(null);
  };
  const newTask = (col = 'todo') => setDraft({ title: '', who: PEOPLE[0], priority: 'Medium', col });

  // ?new=task (from the quick panel) opens the New task form
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    if (searchParams.get('new') === 'task') {
      setDraft({ title: '', who: PEOPLE[0], priority: 'Medium', col: 'todo' });
      const next = new URLSearchParams(searchParams); next.delete('new'); setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><div className="text-sm text-muted">Workflow / Tasks</div><h1 className="mt-1 text-3xl font-bold">Tasks</h1></div>
        <button className="btn-primary" onClick={() => newTask()}>+ New task</button>
      </header>

      <div className="card flex flex-wrap items-center gap-3 px-4 py-3">
        <label className="flex min-h-[42px] flex-[1_1_260px] items-center gap-2 rounded border border-line-strong px-3 focus-within:border-brand-600">
          <FiSearch size={18} className="text-muted" aria-hidden="true" /><span className="sr-only">Search tasks</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tasks, tags or people" className="min-w-0 flex-1 bg-transparent outline-none" />
        </label>
        <span className="text-muted">{visible.length} tasks · drag cards between columns</span>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="grid min-w-[1000px] grid-cols-4 gap-4">
          {COLUMNS.map((c, ci) => {
            const cards = visible.filter((t) => t.col === c.key);
            return (
              <section key={c.key} aria-label={c.label}
                onDragOver={(e) => { e.preventDefault(); if (over !== c.key) setOver(c.key); }}
                onDragLeave={() => setOver(null)}
                onDrop={(e) => { e.preventDefault(); if (dragId) move(dragId, c.key); setDragId(null); setOver(null); }}
                className={cx('flex min-h-[420px] flex-col gap-2.5 rounded-lg border-2 p-2.5', over === c.key ? 'border-dashed border-brand-600 bg-[#E0E8FB]' : 'border-transparent bg-[#EBEFF5]')}>
                <div className="flex items-center gap-2 px-1 pb-2">
                  <span className={cx('h-2.5 w-2.5 rounded-full', c.dot)} />
                  <h2 className="flex-1 font-bold">{c.label}</h2>
                  <span className="rounded-full bg-[#E2E7EF] px-2 py-0.5 text-xs font-semibold text-muted">{cards.length}</span>
                  <button onClick={() => newTask(c.key)} aria-label={`Add task to ${c.label}`} className="h-8 w-8 rounded text-lg text-brand-600 hover:bg-surface">+</button>
                </div>
                {cards.map((t) => (
                  <article key={t.id} draggable onDragStart={(e) => { setDragId(t.id); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', t.id); }} onDragEnd={() => setOver(null)}
                    className="flex cursor-grab flex-col gap-2.5 rounded-md border border-line bg-surface p-3.5 shadow-card active:cursor-grabbing">
                    <div className="flex justify-between gap-2"><span className="rounded-sm bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-600">{t.tag}</span><span className={cx('text-xs font-bold', PRIO[t.priority])}>{t.priority}</span></div>
                    <div className="font-semibold leading-snug">{t.title}</div>
                    <div className="flex items-center gap-2">
                      <span title={t.who}><Avatar text={initials(t.who)} size="sm" tone="dark" /></span>
                      <span className="flex-1 text-xs text-muted">Due {t.due}</span>
                      {ci > 0 && <button onClick={() => move(t.id, COLUMNS[ci - 1].key)} aria-label="Move left" className="h-[30px] w-[30px] rounded-sm border border-line text-muted hover:bg-subtle">‹</button>}
                      {ci < 3 && <button onClick={() => move(t.id, COLUMNS[ci + 1].key)} aria-label="Move right" className="h-[30px] w-[30px] rounded-sm border border-line text-muted hover:bg-subtle">›</button>}
                    </div>
                  </article>
                ))}
                {cards.length === 0 && <div className="rounded-md border-2 border-dashed border-line-strong p-6 text-center text-sm text-muted">Drop a card here</div>}
              </section>
            );
          })}
        </div>
      </div>

      {draft && (
        <Modal title="New task" onClose={() => setDraft(null)} width="max-w-[620px]"
          footer={<><button className="btn-secondary" onClick={() => setDraft(null)}>Cancel</button><button className="btn-primary" onClick={saveTask}>Add task</button></>}>
          <div className="flex flex-col gap-3.5">
            <label className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[130px_1fr] sm:gap-5"><span className="font-semibold">Title *</span><input className="input" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="What needs doing?" /></label>
            <label className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[130px_1fr] sm:gap-5"><span className="font-semibold">Assignee</span><select className="input" value={draft.who} onChange={(e) => setDraft({ ...draft, who: e.target.value })}>{PEOPLE.map((p) => <option key={p}>{p}</option>)}</select></label>
            <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[130px_1fr] sm:gap-5"><span className="font-semibold">Priority</span><Segmented label="Priority" options={['High', 'Medium', 'Low']} value={draft.priority} onChange={(v) => setDraft({ ...draft, priority: v })} /></div>
            <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[130px_1fr] sm:gap-5"><span className="font-semibold">Column</span>
              <select className="input" value={draft.col} onChange={(e) => setDraft({ ...draft, col: e.target.value })}>{COLUMNS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}</select></div>
          </div>
        </Modal>
      )}
    </div>
  );
}
