import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import {
  Archive, ArchiveRestore, ArrowLeft, Bell, CheckCheck, Inbox, ListChecks, MessagesSquare, Plus, SearchX, SendHorizontal,
} from 'lucide-react';
import TasksPanel from './TasksPanel';
import RowActionsMenu from '../RowActionsMenu';
import { Avatar, Modal, Segmented, initials } from '../ui';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { SimpleTooltip } from '../ui/tooltip';
import { EmptyState, SearchInput } from '../page';
import { lastActivity, lastMessage, newMessage, newTask, newTasksMessage } from '../../data/accountChats';
import { cn } from 'lib/utils';

const sameDay = (a, b) => a.toDateString() === b.toDateString();
/** 10:42 · Yesterday · Monday · Mar 4 */
function shortTime(iso) {
  const d = new Date(iso);
  const now = new Date();
  if (sameDay(d, now)) return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const y = new Date(now); y.setDate(now.getDate() - 1);
  if (sameDay(d, y)) return 'Yesterday';
  if (now - d < 6 * 86400000) return d.toLocaleDateString('en-US', { weekday: 'long' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
function dayLabel(iso) {
  const d = new Date(iso);
  const now = new Date();
  if (sameDay(d, now)) return 'Today';
  const y = new Date(now); y.setDate(now.getDate() - 1);
  if (sameDay(d, y)) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}
const preview = (m) => (m ? `${m.from === 'firm' ? 'You: ' : ''}${m.type === 'tasks' ? `${m.taskIds.length} task${m.taskIds.length === 1 ? '' : 's'} sent` : m.html ? m.text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : m.text}` : 'No messages yet');
/** Basic typography for HTML written in the app's own editor. */
const RICH = 'te-content [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-0.5 [&_ul]:list-disc [&_ul]:pl-5';

/**
 * Inbox-style chats for one account: Active / Archived list + conversation.
 * Props: chats · onChange(chats) · onNew() · me (author name)
 */
export default function ChatsView({ chats, onChange, onNew, me = 'You', clientName }) {
  const [tab, setTab] = useState('active');
  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [tasksOpen, setTasksOpen] = useState(false);     // right-side tasks panel
  const bottom = useRef(null);

  const counts = { active: chats.filter((c) => c.status !== 'archived').length, archived: chats.filter((c) => c.status === 'archived').length };
  const list = useMemo(() => chats
    .filter((c) => (tab === 'archived' ? c.status === 'archived' : c.status !== 'archived'))
    .filter((c) => !q.trim() || `${c.subject} ${c.messages.map((m) => m.text).join(' ')}`.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => new Date(lastActivity(b)) - new Date(lastActivity(a))), [chats, tab, q]);
  const chat = chats.find((c) => c.id === selectedId) || null;

  const setChat = (id, fn) => onChange(chats.map((c) => (c.id === id ? { ...c, ...fn(c) } : c)));
  const openChat = (c) => { setSelectedId(c.id); setDraft(''); setTasksOpen(false); if (c.unread) setChat(c.id, () => ({ unread: 0 })); };
  useEffect(() => { bottom.current?.scrollIntoView?.({ block: 'end' }); }, [selectedId, chat?.messages.length]);
  // if the open chat moves to the other list (archived / unarchived), follow it
  useEffect(() => { if (chat && (chat.status === 'archived') !== (tab === 'archived')) setTab(chat.status === 'archived' ? 'archived' : 'active'); }, [chat?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const send = () => {
    const text = draft.trim();
    if (!text || !chat) return;
    setChat(chat.id, (c) => ({ messages: [...c.messages, newMessage('firm', text, me)] }));
    setDraft('');
  };
  /** Add tasks to the chat and post them as a task card. */
  const sendTasks = (texts) => {
    if (!chat || !texts.length) return;
    const tasks = texts.map((t) => newTask(t));
    setChat(chat.id, (c) => ({ tasks: [...c.tasks, ...tasks], messages: [...c.messages, newTasksMessage(tasks.map((t) => t.id), me)] }));
  };
  const toggleTask = (id) => setChat(chat.id, (c) => ({ tasks: c.tasks.map((x) => (x.id === id ? { ...x, done: !x.done } : x)) }));
  const removeTask = (id) => setChat(chat.id, (c) => ({ tasks: c.tasks.filter((x) => x.id !== id) }));
  const archive = (c, value) => setChat(c.id, () => ({ status: value ? 'archived' : 'active' }));
  const doneTasks = chat ? chat.tasks.filter((t) => t.done).length : 0;

  return (
    <div className="grid h-[min(740px,calc(100vh-220px))] min-h-[540px] grid-cols-1 overflow-hidden rounded-xl border bg-card shadow-card lg:grid-cols-[340px_minmax(0,1fr)]">
      {/* ===== Conversation list ===== */}
      <aside className={cn('flex min-h-0 flex-col lg:border-r', chat && 'hidden lg:flex')} aria-label="Chats">
        <div className="flex flex-col gap-3 border-b px-4 pb-3 pt-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-base font-semibold">Chats<span className="text-sm font-normal tabular-nums text-muted-foreground">{counts.active}</span></h2>
            <Button size="sm" onClick={onNew}><Plus />New chat</Button>
          </div>
          <Segmented label="Chat lists" size="sm" value={tab} onChange={setTab} className="grid grid-cols-2"
            options={[
              { value: 'active', label: <><Inbox className="size-3.5" aria-hidden="true" />Active<span className="tabular-nums text-muted-foreground">{counts.active}</span></> },
              { value: 'archived', label: <><Archive className="size-3.5" aria-hidden="true" />Archived<span className="tabular-nums text-muted-foreground">{counts.archived}</span></> },
            ]} />
          <SearchInput value={q} onChange={setQ} placeholder="Search chats" label="Search chats" className="h-8" />
        </div>
        <ul className="min-h-0 flex-1 overflow-y-auto p-1.5" aria-label={`${tab === 'archived' ? 'Archived' : 'Active'} chats`}>
          {list.map((c) => {
            const m = lastMessage(c);
            const on = c.id === selectedId;
            return (
              <li key={c.id}>
                <button type="button" onClick={() => openChat(c)} aria-current={on ? 'true' : undefined}
                  className={cn('relative flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50',
                    on ? 'bg-accent' : 'hover:bg-accent/60')}>
                  {on && <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-primary" aria-hidden="true" />}
                  <Avatar text={initials(c.subject)} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-2">
                      <span className={cn('flex-1 truncate text-sm', c.unread ? 'font-semibold text-foreground' : 'font-medium text-foreground')}>{c.subject}</span>
                      <span className={cn('flex-none text-[11px] tabular-nums', c.unread ? 'font-semibold text-primary' : 'text-muted-foreground')}>{shortTime(lastActivity(c))}</span>
                    </span>
                    <span className="mt-0.5 flex items-center gap-2">
                      <span className={cn('flex-1 truncate text-[13px]', c.unread ? 'text-foreground' : 'text-muted-foreground')}>{preview(m)}</span>
                      {c.unread > 0 && <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold tabular-nums text-primary-foreground" aria-label={`${c.unread} unread`}>{c.unread}</span>}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
          {!list.length && (
            <li>
              {q ? <EmptyState compact icon={SearchX} title="No chats match" description="Try a different word or clear the search." action={<Button variant="outline" size="sm" onClick={() => setQ('')}>Clear search</Button>} />
                : tab === 'archived' ? <EmptyState compact icon={Archive} title="No archived chats" description="Chats you archive are kept here." />
                  : <EmptyState compact icon={MessagesSquare} title="No active chats yet" description="Start a conversation with this client." action={<Button size="sm" onClick={onNew}><Plus />New chat</Button>} />}
            </li>
          )}
        </ul>
      </aside>

      {/* ===== Conversation ===== */}
      {chat ? (
        <div className="relative flex min-h-0 min-w-0">
          <section className="flex min-h-0 min-w-0 flex-1 flex-col" aria-label={`Conversation: ${chat.subject}`}>
            <header className="flex items-center gap-3 border-b px-4 py-3">
              <Button variant="ghost" size="icon-sm" onClick={() => setSelectedId(null)} aria-label="Back to chats" className="lg:hidden"><ArrowLeft /></Button>
              <Avatar text={initials(chat.subject)} />
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold">{chat.subject}</h3>
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                  {clientName && <span>with {clientName}</span>}
                  {chat.reminders?.enabled && (
                    <SimpleTooltip label={`Reminds the client every ${chat.reminders.days} days, up to ${chat.reminders.count} times`}>
                      <span className="inline-flex items-center gap-1"><Bell className="size-3" aria-hidden="true" />Every {chat.reminders.days} days · {chat.reminders.count}×</span>
                    </SimpleTooltip>
                  )}
                  {chat.status === 'archived' && <Badge variant="neutral"><Archive />Archived</Badge>}
                </p>
              </div>
              <Button type="button" variant={tasksOpen ? 'secondary' : 'outline'} size="sm" onClick={() => setTasksOpen((o) => !o)} aria-expanded={tasksOpen} aria-controls="chat-tasks-panel">
                <ListChecks /><span className="tabular-nums">{doneTasks}/{chat.tasks.length}</span><span className="hidden sm:inline">tasks</span>
              </Button>
              <RowActionsMenu label={chat.subject}
                extra={[chat.status === 'archived'
                  ? { label: 'Unarchive', icon: ArchiveRestore, onClick: () => archive(chat, false) }
                  : { label: 'Archive', icon: Archive, onClick: () => archive(chat, true) }]}
                onDelete={() => setConfirm(chat)} />
            </header>

            {/* messages */}
            <ol aria-label="Messages" className="min-h-0 flex-1 overflow-y-auto bg-subtle/60 px-4 py-4 sm:px-6">
              {chat.messages.map((m, i) => {
                const prev = chat.messages[i - 1];
                const showDay = i === 0 || !sameDay(new Date(prev.at), new Date(m.at));
                const mine = m.from === 'firm';
                const firstOfGroup = showDay || !prev || prev.from !== m.from || prev.author !== m.author;
                const isTasks = m.type === 'tasks';
                const time = new Date(m.at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                return (
                  <Fragment key={m.id}>
                    {showDay && (
                      <li className="my-4 flex items-center gap-3 first:mt-0" aria-label={dayLabel(m.at)}>
                        <span className="h-px flex-1 bg-border" aria-hidden="true" />
                        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{dayLabel(m.at)}</span>
                        <span className="h-px flex-1 bg-border" aria-hidden="true" />
                      </li>
                    )}
                    <li className={cn('flex items-end gap-2', mine ? 'justify-end' : 'justify-start', firstOfGroup ? 'mt-3' : 'mt-1')}>
                      {!mine && (firstOfGroup ? <Avatar text={initials(m.author)} size="sm" className="mb-5" /> : <span className="w-7 flex-none" aria-hidden="true" />)}
                      <div className={cn('flex max-w-[78%] flex-col', mine ? 'items-end' : 'items-start')}>
                        {firstOfGroup && <span className="mb-1 px-1 text-xs font-medium text-muted-foreground">{m.author}</span>}
                        {isTasks ? (() => {
                          const items = m.taskIds.map((id) => chat.tasks.find((t) => t.id === id)).filter(Boolean);
                          const done = items.filter((t) => t.done).length;
                          return (
                            <div role="group" aria-label="Task card" className="w-[280px] max-w-full overflow-hidden rounded-xl border bg-card text-sm shadow-card">
                              <div className="flex items-center gap-2 border-b bg-subtle px-3 py-2 font-medium">
                                <ListChecks className="size-4 text-muted-foreground" aria-hidden="true" /><span className="flex-1">Client tasks</span>
                                {items.length > 0 && <span className="text-xs tabular-nums text-muted-foreground">{done}/{items.length}</span>}
                              </div>
                              {items.length ? (
                                <ul className="flex flex-col gap-0.5 p-1.5">
                                  {items.map((t) => (
                                    <li key={t.id}>
                                      <label className="flex cursor-pointer items-start gap-2.5 rounded-md px-1.5 py-1.5 hover:bg-accent/60">
                                        <Checkbox checked={t.done} disabled={chat.status === 'archived'} onCheckedChange={() => toggleTask(t.id)} className="mt-0.5" aria-label={`${t.text} (in chat)`} />
                                        <span className={cn('min-w-0 break-words', t.done && 'text-muted-foreground line-through')}>{t.text}</span>
                                      </label>
                                    </li>
                                  ))}
                                </ul>
                              ) : <p className="px-3 py-3 text-xs italic text-muted-foreground">These tasks were removed.</p>}
                              {items.length > 0 && (
                                <div className="h-1 bg-muted" aria-hidden="true"><div className="h-full bg-success-500 transition-all" style={{ width: `${(done / items.length) * 100}%` }} /></div>
                              )}
                            </div>
                          );
                        })() : (
                          <div className={cn('rounded-2xl px-3.5 py-2 text-sm shadow-xs',
                            mine ? 'rounded-br-md bg-primary text-primary-foreground' : 'rounded-bl-md border bg-card text-card-foreground')}>
                            {m.html ? <div className={RICH} dangerouslySetInnerHTML={{ __html: m.text }} /> : <p className="whitespace-pre-wrap break-words">{m.text}</p>}
                          </div>
                        )}
                        <span className="mt-1 flex items-center gap-1 px-1 text-[11px] tabular-nums text-muted-foreground">
                          {time}
                          {mine && <CheckCheck className="size-3.5 text-primary" aria-label="Delivered" />}
                        </span>
                      </div>
                    </li>
                  </Fragment>
                );
              })}
              {!chat.messages.length && (
                <li><EmptyState compact icon={MessagesSquare} title="No messages yet" description="Say hello — the client is notified when you write." /></li>
              )}
              <li ref={bottom} aria-hidden="true" />
            </ol>

            {/* composer */}
            {chat.status === 'archived' ? (
              <div className="flex flex-wrap items-center justify-center gap-3 border-t bg-card px-4 py-3 text-sm text-muted-foreground">
                <Archive className="size-4" aria-hidden="true" />This chat is archived.
                <Button type="button" variant="outline" size="sm" onClick={() => archive(chat, false)}><ArchiveRestore />Unarchive to reply</Button>
              </div>
            ) : (
              <form className="border-t bg-card p-3" onSubmit={(e) => { e.preventDefault(); send(); }}>
                <div className="flex items-end gap-1.5 rounded-xl border border-input bg-card p-1.5 shadow-xs transition-[box-shadow,border-color] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/20">
                  <SimpleTooltip label="Add tasks">
                    <Button type="button" variant="ghost" size="icon-sm" onClick={() => setTasksOpen((o) => !o)} aria-label="Add tasks" aria-expanded={tasksOpen}
                      className={cn('flex-none', tasksOpen ? 'bg-accent text-foreground' : 'text-muted-foreground')}><ListChecks /></Button>
                  </SimpleTooltip>
                  <label className="sr-only" htmlFor="chat-message">Message</label>
                  <textarea id="chat-message" rows={1} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={`Message ${clientName || 'the client'}…`}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                    className="max-h-32 min-h-[32px] flex-1 resize-none bg-transparent px-1.5 py-1.5 text-sm outline-none placeholder:text-muted-foreground/70 focus-visible:ring-0" />
                  <SimpleTooltip label="Send" shortcut="↵">
                    <Button type="submit" size="icon-sm" disabled={!draft.trim()} aria-label="Send message" className="flex-none"><SendHorizontal /></Button>
                  </SimpleTooltip>
                </div>
                <p className="mt-1.5 hidden px-1 text-[11px] text-muted-foreground sm:block">Enter to send · Shift + Enter for a new line</p>
              </form>
            )}
          </section>
          {tasksOpen && (
            <div id="chat-tasks-panel" className="contents">
              <TasksPanel tasks={chat.tasks} readOnly={chat.status === 'archived'} onToggle={toggleTask} onRemove={removeTask}
                onSend={sendTasks} onClose={() => setTasksOpen(false)} />
            </div>
          )}
        </div>
      ) : (
        <div className="hidden flex-col items-center justify-center bg-subtle/60 lg:flex">
          <EmptyState icon={MessagesSquare} title="Select a conversation" description="Pick a chat on the left, or start a new one with this client."
            action={<Button onClick={onNew}><Plus />New chat</Button>} />
        </div>
      )}

      {confirm && (
        <Modal title={`Delete “${confirm.subject}”?`} description="The conversation and its messages are removed for your team and the client." onClose={() => setConfirm(null)}
          footer={<><Button variant="outline" onClick={() => setConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { onChange(chats.filter((c) => c.id !== confirm.id)); setSelectedId(null); setConfirm(null); }}>Delete chat</Button></>}>
          <p className="text-sm text-muted-foreground">This can't be undone.</p>
        </Modal>
      )}
    </div>
  );
}
