import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { FiArchive, FiArrowLeft, FiBell, FiCheck, FiCheckSquare, FiInbox, FiMessageSquare, FiPlus, FiSearch, FiSend } from 'react-icons/fi';
import TasksPanel from './TasksPanel';
import RowActionsMenu from '../RowActionsMenu';
import { Avatar, Modal, cx, initials } from '../ui';
import { lastActivity, lastMessage, newMessage, newTask, newTasksMessage } from '../../data/accountChats';

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
const preview = (m) => (m ? `${m.from === 'firm' ? 'You: ' : ''}${m.type === 'tasks' ? `📋 ${m.taskIds.length} task${m.taskIds.length === 1 ? '' : 's'}` : m.html ? m.text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : m.text}` : 'No messages yet');

/**
 * WhatsApp-style chats for one account: Active / Archived list + conversation.
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
    <div className="card grid h-[min(720px,calc(100vh-220px))] min-h-[520px] grid-cols-1 overflow-hidden lg:grid-cols-[340px_minmax(0,1fr)]">
      {/* ===== Chat list ===== */}
      <aside className={cx('flex min-h-0 flex-col border-line lg:border-r', chat && 'hidden lg:flex')} aria-label="Chats">
        <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
          <h2 className="text-lg font-bold">Chats</h2>
          <button type="button" className="btn-primary min-h-[38px] text-sm" onClick={onNew}><FiPlus aria-hidden="true" /> New chat</button>
        </div>
        <div className="flex gap-1 border-b border-line px-3 pt-2" role="tablist" aria-label="Chat lists">
          {[['active', 'Active', FiInbox], ['archived', 'Archived', FiArchive]].map(([key, label, Icon]) => (
            <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => setTab(key)}
              className={cx('relative flex min-h-[40px] items-center gap-1.5 px-3 text-sm font-semibold', tab === key ? 'text-brand-600' : 'text-muted hover:text-ink')}>
              <Icon aria-hidden="true" /> {label} <span className={cx('rounded-full px-1.5 text-xs', tab === key ? 'bg-brand-100' : 'bg-subtle')}>{counts[key]}</span>
              {tab === key && <span className="absolute inset-x-2 -bottom-px h-[3px] rounded-t-full bg-brand-600" aria-hidden="true" />}
            </button>
          ))}
        </div>
        <label className="m-3 flex min-h-[40px] items-center gap-2 rounded-full bg-subtle px-3.5">
          <FiSearch className="text-muted" aria-hidden="true" /><span className="sr-only">Search chats</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search chats" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
        </label>
        <ul className="min-h-0 flex-1 overflow-y-auto" aria-label={`${tab === 'archived' ? 'Archived' : 'Active'} chats`}>
          {list.map((c) => {
            const m = lastMessage(c);
            const on = c.id === selectedId;
            return (
              <li key={c.id}>
                <button type="button" onClick={() => openChat(c)} aria-current={on ? 'true' : undefined}
                  className={cx('flex w-full items-center gap-3 border-b border-line-soft px-4 py-3 text-left', on ? 'bg-brand-50' : 'hover:bg-subtle')}>
                  <Avatar text={initials(c.subject)} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-2">
                      <span className={cx('flex-1 truncate', c.unread ? 'font-bold' : 'font-semibold')}>{c.subject}</span>
                      <span className={cx('flex-none text-xs', c.unread ? 'font-semibold text-success-700' : 'text-muted')}>{shortTime(lastActivity(c))}</span>
                    </span>
                    <span className="mt-0.5 flex items-center gap-2">
                      <span className={cx('flex-1 truncate text-sm', c.unread ? 'text-ink' : 'text-muted')}>{preview(m)}</span>
                      {c.unread > 0 && <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-success-700 px-1.5 text-[11px] font-bold text-white" aria-label={`${c.unread} unread`}>{c.unread}</span>}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
          {!list.length && (
            <li className="flex flex-col items-center gap-2 p-10 text-center text-sm text-muted">
              {tab === 'archived' ? <FiArchive size={24} aria-hidden="true" /> : <FiMessageSquare size={24} aria-hidden="true" />}
              {q ? 'No chats match your search.' : tab === 'archived' ? 'No archived chats.' : 'No active chats yet.'}
            </li>
          )}
        </ul>
      </aside>

      {/* ===== Conversation ===== */}
      {chat ? (
        <div className="relative flex min-h-0 min-w-0">
        <section className="flex min-h-0 min-w-0 flex-1 flex-col" aria-label={`Conversation: ${chat.subject}`}>
          <header className="flex items-center gap-3 border-b border-line bg-subtle/60 px-4 py-3">
            <button type="button" onClick={() => setSelectedId(null)} aria-label="Back to chats" className="flex h-9 w-9 items-center justify-center rounded text-muted hover:bg-surface lg:hidden"><FiArrowLeft /></button>
            <Avatar text={initials(chat.subject)} />
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-semibold">{chat.subject}</h3>
              <p className="flex flex-wrap items-center gap-x-3 text-xs text-muted">
                {clientName && <span>{clientName}</span>}
                {chat.reminders?.enabled && <span className="flex items-center gap-1"><FiBell aria-hidden="true" />Reminds every {chat.reminders.days} days · {chat.reminders.count}×</span>}

                {chat.status === 'archived' && <span className="rounded bg-subtle px-1.5 font-semibold">Archived</span>}
              </p>
            </div>
            <button type="button" onClick={() => setTasksOpen((o) => !o)} aria-expanded={tasksOpen} aria-controls="chat-tasks-panel"
              className={cx('flex min-h-[36px] items-center gap-1.5 rounded-full border px-3 text-sm font-semibold', tasksOpen ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-line bg-surface text-muted hover:text-ink')}>
              <FiCheckSquare aria-hidden="true" /><span>{doneTasks}/{chat.tasks.length} tasks</span>
            </button>
            <RowActionsMenu label={chat.subject}
              extra={[chat.status === 'archived'
                ? { label: 'Unarchive', icon: FiInbox, onClick: () => archive(chat, false) }
                : { label: 'Archive', icon: FiArchive, onClick: () => archive(chat, true) }]}
              onDelete={() => setConfirm(chat)} />
          </header>

          {/* messages */}
          <ol aria-label="Messages" className="min-h-0 flex-1 overflow-y-auto bg-subtle/70 px-4 py-4 [background-image:radial-gradient(rgb(0_0_0/0.035)_1px,transparent_1px)] [background-size:18px_18px] sm:px-8">
            {chat.messages.map((m, i) => {
              const showDay = i === 0 || !sameDay(new Date(chat.messages[i - 1].at), new Date(m.at));
              const mine = m.from === 'firm';
              return (
                <Fragment key={m.id}>
                  {showDay && <li className="my-3 flex justify-center"><span className="rounded-md bg-surface px-3 py-1 text-xs font-semibold text-muted shadow-card">{dayLabel(m.at)}</span></li>}
                  <li className={cx('mb-1.5 flex', mine ? 'justify-end' : 'justify-start')}>
                    <div className={cx('relative max-w-[78%] rounded-lg px-3 pb-1.5 pt-2 text-sm shadow-card', mine ? 'rounded-tr-sm bg-success-50' : 'rounded-tl-sm bg-surface')}>
                      {(!mine || i === 0 || chat.messages[i - 1].from !== m.from) && <div className={cx('mb-0.5 text-xs font-semibold', mine ? 'text-success-700' : 'text-brand-600')}>{mine ? m.author : m.author}</div>}
                      {m.type === 'tasks' ? (() => {
                        const items = m.taskIds.map((id) => chat.tasks.find((t) => t.id === id)).filter(Boolean);
                        const done = items.filter((t) => t.done).length;
                        return (
                          <div role="group" aria-label="Task card" className="min-w-[220px]">
                            <div className="mb-1.5 flex items-center gap-1.5 font-semibold"><FiCheckSquare aria-hidden="true" /> Client tasks</div>
                            {items.length ? (
                              <ul className="flex flex-col gap-1 rounded-md bg-surface/70 p-2">
                                {items.map((t) => (
                                  <li key={t.id}>
                                    <label className="flex cursor-pointer items-start gap-2">
                                      <input type="checkbox" checked={t.done} disabled={chat.status === 'archived'} onChange={() => toggleTask(t.id)} className="mt-0.5 h-4 w-4 flex-none accent-success-700" aria-label={`${t.text} (in chat)`} />
                                      <span className={cx(t.done && 'text-muted line-through')}>{t.text}</span>
                                    </label>
                                  </li>
                                ))}
                              </ul>
                            ) : <p className="text-xs italic text-muted">These tasks were removed.</p>}
                            {items.length > 0 && <p className="mt-1 text-xs text-muted">{done} of {items.length} done</p>}
                          </div>
                        );
                      })() : m.html ? <div className="te-content [&_p]:my-0.5" dangerouslySetInnerHTML={{ __html: m.text }} /> : <p className="whitespace-pre-wrap break-words">{m.text}</p>}
                      <div className="mt-0.5 flex items-center justify-end gap-1 text-[11px] text-muted">
                        {new Date(m.at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        {mine && <span className="flex text-brand-600" aria-label="Delivered"><FiCheck size={12} /><FiCheck size={12} className="-ml-1.5" /></span>}
                      </div>
                    </div>
                  </li>
                </Fragment>
              );
            })}
            {!chat.messages.length && <li className="py-10 text-center text-sm text-muted">No messages yet. Say hello 👋</li>}
            <li ref={bottom} aria-hidden="true" />
          </ol>

          {/* composer */}
          {chat.status === 'archived' ? (
            <div className="flex items-center justify-center gap-3 border-t border-line bg-surface px-4 py-3 text-sm text-muted">
              This chat is archived.
              <button type="button" className="btn-secondary min-h-[36px] text-sm" onClick={() => archive(chat, false)}><FiInbox aria-hidden="true" /> Unarchive to reply</button>
            </div>
          ) : (
            <form className="flex items-end gap-2 border-t border-line bg-surface px-3 py-3" onSubmit={(e) => { e.preventDefault(); send(); }}>
              <button type="button" onClick={() => setTasksOpen((o) => !o)} aria-label="Add tasks" aria-expanded={tasksOpen} title="Add tasks" className={cx('flex h-11 w-11 flex-none items-center justify-center rounded-full hover:bg-subtle', tasksOpen ? 'text-brand-600' : 'text-muted hover:text-brand-600')}><FiCheckSquare size={19} aria-hidden="true" /></button>
              <label className="sr-only" htmlFor="chat-message">Message</label>
              <textarea id="chat-message" rows={1} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Type a message"
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                className="max-h-32 min-h-[44px] flex-1 resize-none rounded-3xl border border-line bg-subtle px-4 py-2.5 text-sm focus:border-brand-600 focus:outline-none" />
              <button type="submit" disabled={!draft.trim()} aria-label="Send message" className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-success-700 text-white disabled:opacity-40"><FiSend aria-hidden="true" /></button>
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
        <div className="hidden flex-col items-center justify-center gap-3 bg-subtle/60 p-10 text-center text-muted lg:flex">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-surface shadow-card" aria-hidden="true"><FiMessageSquare size={28} className="text-brand-600" /></span>
          <p className="text-lg font-semibold text-ink">Select a chat</p>
          <p className="max-w-xs text-sm">Pick a conversation on the left, or start a new one.</p>
          <button type="button" className="btn-primary" onClick={onNew}><FiPlus aria-hidden="true" /> New chat</button>
        </div>
      )}

      {confirm && (
        <Modal title={`Delete “${confirm.subject}”?`} onClose={() => setConfirm(null)}
          footer={<><button className="btn-secondary" onClick={() => setConfirm(null)}>Cancel</button><button className="btn bg-danger-700 text-white hover:bg-[#831E15]" onClick={() => { onChange(chats.filter((c) => c.id !== confirm.id)); setSelectedId(null); setConfirm(null); }}>Delete chat</button></>}>
          <p className="text-muted">The conversation and its messages are removed for your team and the client.</p>
        </Modal>
      )}
    </div>
  );
}
