import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CalendarDays, ChevronLeft, ChevronRight, Circle, CircleCheck, CircleDashed, CircleDot, Plus, SearchX, SignalHigh, SignalLow, SignalMedium,
} from 'lucide-react';
import { Avatar, Modal, Segmented, cx, initials } from '../components/ui';
import { PageHeader, SearchInput } from '../components/page';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from '../components/ui/sonner';
import { SimpleTooltip } from '../components/ui/tooltip';
import { seedAccounts, COLUMNS, seedTasks } from '../data/sampleData';

const PRIO = {
  High: { variant: 'danger', icon: SignalHigh },
  Medium: { variant: 'warning', icon: SignalMedium },
  Low: { variant: 'neutral', icon: SignalLow },
};
// Status icon + colour per column (theme tokens, Linear-style).
const COL_STYLE = {
  todo: { icon: CircleDashed, className: 'text-muted-foreground' },
  doing: { icon: CircleDot, className: 'text-brand-600' },
  review: { icon: Circle, className: 'text-warning-500' },
  done: { icon: CircleCheck, className: 'text-success-600' },
};
const PEOPLE = seedAccounts.slice(0, 12).map((a) => a.owner);

function FormRow({ label, htmlFor, children }) {
  return (
    <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[120px_1fr] sm:gap-5">
      <Label htmlFor={htmlFor}>{label}</Label>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

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
    toast.success(`Task added to ${COLUMNS.find((c) => c.key === draft.col)?.label || 'the board'}`);
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

  const doneCount = tasks.filter((t) => t.col === 'done').length;

  return (
    <div className="page">
      <PageHeader title="Tasks" description="Everything your team is working on, from to-do to done. Drag cards between columns to update them."
        actions={<SimpleTooltip label="New task" shortcut="T"><Button onClick={() => newTask()}><Plus />New task</Button></SimpleTooltip>} />

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={q} onChange={setQ} placeholder="Search tasks, tags or people" label="Search tasks" className="h-8 w-full sm:w-80" />
        <span className="text-sm text-muted-foreground">{visible.length} tasks · drag cards between columns</span>
        <span className="ml-auto hidden items-center gap-2 text-sm text-muted-foreground md:inline-flex">
          <CircleCheck className="size-4 text-success-600" aria-hidden="true" />
          <span className="tabular-nums">{doneCount} of {tasks.length} done</span>
        </span>
      </div>

      {q && visible.length === 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-dashed bg-card px-4 py-3 text-sm text-muted-foreground">
          <SearchX className="size-4" aria-hidden="true" />No tasks match “{q}”.
          <Button variant="link" size="sm" className="h-auto px-0" onClick={() => setQ('')}>Clear search</Button>
        </div>
      )}

      <div className="-mx-1 overflow-x-auto px-1 pb-2">
        <div className="grid min-w-[1000px] grid-cols-4 gap-4">
          {COLUMNS.map((c, ci) => {
            const cards = visible.filter((t) => t.col === c.key);
            const style = COL_STYLE[c.key] || COL_STYLE.todo;
            const ColIcon = style.icon;
            const isOver = over === c.key;
            return (
              <section key={c.key} aria-label={c.label}
                onDragOver={(e) => { e.preventDefault(); if (over !== c.key) setOver(c.key); }}
                onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOver(null); }}
                onDrop={(e) => { e.preventDefault(); if (dragId) move(dragId, c.key); setDragId(null); setOver(null); }}
                className={cx('flex min-h-[460px] flex-col gap-2 rounded-xl border p-2 transition-colors',
                  isOver ? 'border-dashed border-primary bg-primary/[0.05]' : 'bg-muted/50')}>
                <div className="flex items-center gap-2 px-1.5 pb-1 pt-0.5">
                  <ColIcon className={cx('size-4', style.className)} aria-hidden="true" />
                  <h2 className="flex-1 text-sm font-semibold">{c.label}</h2>
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-card px-1.5 text-xs font-medium tabular-nums text-muted-foreground shadow-xs ring-1 ring-inset ring-border">{cards.length}</span>
                  <SimpleTooltip label={`Add task to ${c.label}`}>
                    <Button variant="ghost" size="icon-xs" onClick={() => newTask(c.key)} aria-label={`Add task to ${c.label}`} className="text-muted-foreground"><Plus /></Button>
                  </SimpleTooltip>
                </div>
                {cards.map((t) => {
                  const p = PRIO[t.priority] || PRIO.Low;
                  const PIcon = p.icon;
                  return (
                    <article key={t.id} draggable
                      onDragStart={(e) => { setDragId(t.id); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', t.id); }}
                      onDragEnd={() => { setOver(null); setDragId(null); }}
                      className={cx('group flex cursor-grab flex-col gap-2.5 rounded-lg border bg-card p-3 shadow-xs transition-[border-color,box-shadow,opacity] hover:border-line-strong hover:shadow-raised active:cursor-grabbing',
                        dragId === t.id && 'opacity-50')}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[11px] text-muted-foreground">{t.id}</span>
                        <Badge variant="neutral">{t.tag}</Badge>
                      </div>
                      <div className="text-sm font-medium leading-snug">{t.title}</div>
                      <div className="flex items-center gap-2">
                        <Badge variant={p.variant} className="gap-1"><PIcon aria-hidden="true" />{t.priority}</Badge>
                        <span className="inline-flex flex-1 items-center gap-1 truncate text-xs text-muted-foreground">
                          <CalendarDays className="size-3.5 flex-none" aria-hidden="true" />Due {t.due}
                        </span>
                        <div className="flex items-center opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                          {ci > 0 && (
                            <SimpleTooltip label={`Move to ${COLUMNS[ci - 1].label}`}>
                              <Button variant="ghost" size="icon-xs" onClick={() => move(t.id, COLUMNS[ci - 1].key)} aria-label="Move left"><ChevronLeft /></Button>
                            </SimpleTooltip>
                          )}
                          {ci < 3 && (
                            <SimpleTooltip label={`Move to ${COLUMNS[ci + 1].label}`}>
                              <Button variant="ghost" size="icon-xs" onClick={() => move(t.id, COLUMNS[ci + 1].key)} aria-label="Move right"><ChevronRight /></Button>
                            </SimpleTooltip>
                          )}
                        </div>
                        <SimpleTooltip label={t.who}>
                          <span className="rounded-full ring-2 ring-card"><Avatar text={initials(t.who)} size="xs" /></span>
                        </SimpleTooltip>
                      </div>
                    </article>
                  );
                })}
                {cards.length === 0 && (
                  <div className={cx('flex flex-1 flex-col items-center justify-center gap-1 rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground transition-colors',
                    isOver && 'border-primary/50 text-primary')}>
                    Drop a card here
                  </div>
                )}
                {cards.length > 0 && (
                  <button type="button" onClick={() => newTask(c.key)}
                    className="flex h-8 items-center gap-1.5 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
                    <Plus className="size-4" aria-hidden="true" />New task
                  </button>
                )}
              </section>
            );
          })}
        </div>
      </div>

      {draft && (
        <Modal title="New task" description="Add a card to the board. You can drag it to another column later." onClose={() => setDraft(null)} width="max-w-[600px]"
          footer={<><Button variant="outline" onClick={() => setDraft(null)}>Cancel</Button><Button onClick={saveTask}><Plus />Add task</Button></>}>
          <div className="flex flex-col gap-4">
            <FormRow label="Title *" htmlFor="task-title">
              <Input id="task-title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="What needs doing?" />
            </FormRow>
            <FormRow label="Assignee">
              <Select value={draft.who} onValueChange={(v) => setDraft({ ...draft, who: v })}>
                <SelectTrigger aria-label="Assignee"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PEOPLE.map((p) => (
                    <SelectItem key={p} value={p}><span className="flex items-center gap-2"><Avatar text={initials(p)} size="xs" />{p}</span></SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormRow>
            <FormRow label="Priority">
              <Segmented label="Priority" options={['High', 'Medium', 'Low']} value={draft.priority} onChange={(v) => setDraft({ ...draft, priority: v })} />
            </FormRow>
            <FormRow label="Column">
              <Select value={draft.col} onValueChange={(v) => setDraft({ ...draft, col: v })}>
                <SelectTrigger aria-label="Column"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COLUMNS.map((c) => {
                    const Icon = (COL_STYLE[c.key] || COL_STYLE.todo).icon;
                    return <SelectItem key={c.key} value={c.key}><span className="flex items-center gap-2"><Icon className={cx('size-4', COL_STYLE[c.key]?.className)} />{c.label}</span></SelectItem>;
                  })}
                </SelectContent>
              </Select>
            </FormRow>
          </div>
        </Modal>
      )}
    </div>
  );
}
