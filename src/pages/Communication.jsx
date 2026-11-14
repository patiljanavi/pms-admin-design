// import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
// import { useSearchParams } from 'react-router-dom';
// import {
//   ArrowLeft, Check, CheckCheck, Hash, MessageSquarePlus, MoreHorizontal, Pencil, Plus, Search, SendHorizontal, Smile, SmilePlus, Trash2, Users,
// } from 'lucide-react';
// import EmojiPicker, { EmojiStyle, Theme } from 'emoji-picker-react';

// // shadcn components — one file each in src/components/ui
// import { Badge } from '../components/ui/badge';
// import { Button } from '../components/ui/button';
// import { Input } from '../components/ui/input';
// import { Label } from '../components/ui/label';
// import { Textarea } from '../components/ui/textarea';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
// import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
// import {
//   DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
// } from '../components/ui/dropdown-menu';
// import { ToastBridge } from '../components/ui/sonner';

// // your app components
// import { Avatar, Modal, initials } from '../components/ui';
// import { EmptyState } from '../components/page';
// import MultiSelect from '../components/MultiSelect';
// import { useAuth } from '../context/AuthContext';
// import { useData } from '../context/DataContext';
// import {
//   TEAM_NAMES, channelSlug, conversationTitle, displayName, dmPartner, firstUnreadId, isMe, isMember, lastMessage, mentions, messageStatus, recipientsOf, roleOf, unreadCount,
// } from '../data/teamChats';
// import { cn } from 'lib/utils';

// const DAY = 86400000;
// const timeOf = (iso) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
// const dayKey = (iso) => new Date(iso).toDateString();
// const dayLabel = (iso) => {
//   const d = new Date(iso); const today = new Date();
//   if (d.toDateString() === today.toDateString()) return 'Today';
//   if (d.toDateString() === new Date(today.getTime() - DAY).toDateString()) return 'Yesterday';
//   return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
// };
// const shortTime = (iso) => (!iso ? '' : dayKey(iso) === new Date().toDateString() ? timeOf(iso) : new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));

// /**
//  * DEMO ONLY: with no server, pretend your new messages reach people (✓✓ after ~1 s) and,
//  * in direct messages, get read (blue ✓✓ after ~3.5 s). Set to false once your server sends real receipts
//  * (it then calls markTeamMessagesDelivered / markTeamChatRead).
//  */
// export const SIMULATE_RECEIPTS = true;
// /** The six quick reactions (emoji-picker-react uses unified codes): 👍 ❤️ 😂 🎉 👀 ✅ */
// const QUICK_REACTIONS = ['1f44d', '2764-fe0f', '1f602', '1f389', '1f440', '2705'];
// const pickerTheme = () => (typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? Theme.DARK : Theme.LIGHT);

// /** ✓ sent · ✓✓ delivered · blue ✓✓ read (WhatsApp style). */
// function StatusTicks({ status, channel }) {
//   const label = status.state === 'read' ? (channel ? `Read by everyone (${status.total})` : 'Read')
//     : status.state === 'delivered' ? (channel ? `Delivered · read by ${status.read} of ${status.total}` : 'Delivered')
//       : 'Sent';
//   const Icon = status.state === 'sent' ? Check : CheckCheck;
//   return (
//     <span title={label} aria-label={label} data-status={status.state} className={cn('inline-flex', status.state === 'read' ? 'text-sky-400' : 'opacity-70')}>
//       <Icon className="size-3.5" aria-hidden="true" />
//     </span>
//   );
// }

// /** Message text with @mentions highlighted (and your own mentions stronger). */
// function MessageText({ text, me, own }) {
//   const names = [...TEAM_NAMES, me].filter(Boolean).sort((a, b) => b.length - a.length);
//   const firsts = names.map((n) => n.split(' ')[0]);
//   const re = new RegExp(`(@(?:${[...names, ...firsts].map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')}))`);
//   return (
//     <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
//       {text.split(re).map((part, i) => (i % 2 === 1                 // split() puts the matched @mentions at odd positions
//         ? <span key={i} className={cn('rounded px-0.5 font-medium', own ? 'bg-primary-foreground/20' : mentions(part, me) ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200' : 'bg-primary/10 text-primary')}>{part}</span>
//         : <Fragment key={i}>{part}</Fragment>))}
//     </p>
//   );
// }

// /**
//  * Communication: team channels and direct messages between teammates and the admin.
//  * DataContext: teamChats · createChannel · updateChannel · deleteTeamChat · openDirectMessage ·
//  *              sendTeamMessage · editTeamMessage · deleteTeamMessage · toggleTeamReaction · markTeamChatRead.
//  * ?new=chat opens "New message".
//  */
// export default function Communication() {
//   const { user } = useAuth() || {};
//   const me = user?.name || 'Admin';
//   const [params, setParams] = useSearchParams();
//   const {
//     teamChats = [], createChannel, updateChannel, deleteTeamChat, openDirectMessage,
//     sendTeamMessage, editTeamMessage, deleteTeamMessage, toggleTeamReaction, markTeamChatRead, markTeamMessagesDelivered,
//   } = useData();

//   const mine = useMemo(() => teamChats.filter((c) => isMember(c, me)), [teamChats, me]);
//   const [activeId, setActiveId] = useState(() => mine[0]?.id || null);
//   const [showConversation, setShowConversation] = useState(false);       // phones: list or conversation
//   const [q, setQ] = useState('');
//   const [draft, setDraft] = useState('');
//   const [editing, setEditing] = useState(null);                           // { id, text }
//   const [dialog, setDialog] = useState(null);                             // 'channel' | 'dm' | 'edit-channel' | 'delete-chat' | { deleteMessage }
//   const [unreadFrom, setUnreadFrom] = useState(null);                     // where the "New messages" divider goes
//   const [toast, setToast] = useState('');
//   const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 2600); };
//   const [picker, setPicker] = useState(null);                             // message id whose reaction picker is open
//   const [composerEmoji, setComposerEmoji] = useState(false);
//   const listEnd = useRef(null);
//   const composer = useRef(null);
//   const timers = useRef([]);
//   useEffect(() => () => timers.current.forEach(clearTimeout), []);

//   const active = mine.find((c) => c.id === activeId) || null;

//   // ?new=chat → New message
//   useEffect(() => {
//     if (params.get('new') === 'chat') { setDialog('dm'); const n = new URLSearchParams(params); n.delete('new'); setParams(n, { replace: true }); }
//   }, [params]); // eslint-disable-line react-hooks/exhaustive-deps
//   // opening a conversation: remember where unread starts, then mark it read
//   const open = (c) => {
//     setUnreadFrom(firstUnreadId(c, me));
//     setActiveId(c.id); setShowConversation(true); setEditing(null);
//     markTeamChatRead(c.id, me);
//   };
//   useEffect(() => { if (active && unreadCount(active, me)) markTeamChatRead(active.id, me); }, [active?.messages.length]); // eslint-disable-line react-hooks/exhaustive-deps
//   useEffect(() => { listEnd.current?.scrollIntoView?.({ block: 'end' }); }, [activeId, active?.messages.length]);
//   // first visit: mark the opened conversation
//   useEffect(() => { if (active) { setUnreadFrom(firstUnreadId(active, me)); markTeamChatRead(active.id, me); } }, []); // eslint-disable-line react-hooks/exhaustive-deps

//   /* ---------- the conversation list (search: names and message text) ---------- */
//   const s = q.trim().toLowerCase();
//   const matches = (c) => !s || conversationTitle(c, me).toLowerCase().includes(s) || c.messages.some((m) => m.text.toLowerCase().includes(s));
//   const byRecent = (a, b) => (lastMessage(b)?.createdAt || b.createdAt).localeCompare(lastMessage(a)?.createdAt || a.createdAt);
//   const channels = mine.filter((c) => c.type === 'channel' && matches(c)).sort(byRecent);
//   const dms = mine.filter((c) => c.type === 'dm' && matches(c)).sort(byRecent);

//   /* ---------- sending ---------- */
//   const mentionQuery = (/(^|\s)@([\w]*)$/.exec(draft) || [])[2];
//   const mentionOptions = mentionQuery !== undefined
//     ? (active?.members?.length ? active.members.filter((m) => !isMe(m, me)) : TEAM_NAMES).filter((n) => n.toLowerCase().includes(mentionQuery.toLowerCase())).slice(0, 6)
//     : [];
//   const insertMention = (name) => { setDraft((d) => d.replace(/@[\w]*$/, `@${name} `)); composer.current?.focus(); };
//   const send = () => {
//     if (!active || !draft.trim()) return;
//     const m = sendTeamMessage(active.id, draft, me);
//     setDraft(''); setUnreadFrom(null);
//     if (SIMULATE_RECEIPTS && m) {                                         // demo: ✓ → ✓✓ → blue ✓✓
//       const people = recipientsOf(active, me, me);
//       timers.current.push(setTimeout(() => people.forEach((n) => markTeamMessagesDelivered?.(active.id, n)), 1200));
//       if (active.type === 'dm') timers.current.push(setTimeout(() => people.forEach((n) => markTeamChatRead(active.id, n)), 3500));
//     }
//   };
//   /** Insert an emoji where the cursor is in the composer. */
//   const insertEmoji = (emoji) => {
//     const el = composer.current;
//     const at = el && typeof el.selectionStart === 'number' ? el.selectionStart : draft.length;
//     const end = el && typeof el.selectionEnd === 'number' ? el.selectionEnd : at;
//     setDraft((d) => d.slice(0, at) + emoji + d.slice(end));
//     setComposerEmoji(false);
//     requestAnimationFrame(() => { el?.focus(); el?.setSelectionRange?.(at + emoji.length, at + emoji.length); });
//   };
//   const onKeyDown = (e) => {
//     if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent?.isComposing) { e.preventDefault(); send(); }
//   };

//   const renderConversation = (c) => {
//     const unread = unreadCount(c, me);
//     const last = lastMessage(c);
//     const partner = c.type === 'dm' ? dmPartner(c, me) : null;
//     return (
//       <li key={c.id}>
//         <button type="button" onClick={() => open(c)} aria-current={c.id === activeId ? 'true' : undefined}
//           className={cn('flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-accent/60', c.id === activeId && 'bg-accent')}>
//           {c.type === 'channel'
//             ? <span className="inline-flex size-9 flex-none items-center justify-center rounded-lg border bg-subtle text-muted-foreground" aria-hidden="true"><Hash className="size-4" /></span>
//             : <Avatar text={initials(partner)} />}
//           <span className="min-w-0 flex-1">
//             <span className="flex items-center justify-between gap-2">
//               <span className={cn('truncate text-sm', unread ? 'font-semibold text-foreground' : 'font-medium')}>{conversationTitle(c, me)}</span>
//               <span className="flex-none text-xs tabular-nums text-muted-foreground">{shortTime(last?.createdAt)}</span>
//             </span>
//             <span className="flex items-center justify-between gap-2">
//               <span className="truncate text-xs text-muted-foreground">{last ? `${displayName(last.author, me)}: ${last.text}` : 'No messages yet'}</span>
//               {unread > 0 && <Badge className="h-5 min-w-5 flex-none justify-center rounded-full px-1.5 text-[11px] tabular-nums" aria-label={`${unread} unread`}>{unread}</Badge>}
//             </span>
//           </span>
//         </button>
//       </li>
//     );
//   };

//   /* ---------- messages: day dividers, grouping, "New messages" ---------- */
//   const rows = [];
//   (active?.messages || []).forEach((m, i, list) => {
//     const prev = list[i - 1];
//     const newDay = !prev || dayKey(prev.createdAt) !== dayKey(m.createdAt);
//     if (newDay) rows.push({ kind: 'day', key: `d-${m.id}`, label: dayLabel(m.createdAt) });
//     if (m.id === unreadFrom) rows.push({ kind: 'new', key: `n-${m.id}` });
//     const grouped = !newDay && prev && prev.author === m.author && m.id !== unreadFrom && new Date(m.createdAt) - new Date(prev.createdAt) < 5 * 60000;
//     rows.push({ kind: 'msg', key: m.id, m, grouped });
//   });

//   return (
//     <div className="flex flex-col gap-4">
//       <div>
//         <h1 className="text-3xl font-semibold tracking-tight">Communication</h1>
//         <p className="text-muted-foreground">Channels and direct messages for your team.</p>
//       </div>

//       <section aria-label="Team messages" className="grid h-[calc(100vh-var(--app-header-h,64px)-11rem)] min-h-[520px] grid-cols-1 overflow-hidden rounded-xl border bg-card shadow-card md:grid-cols-[300px_minmax(0,1fr)]">
//         {/* ---------- conversation list ---------- */}
//         <aside className={cn('flex min-h-0 flex-col border-r', showConversation && 'hidden md:flex')} aria-label="Conversations">
//           <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
//             <h2 className="text-sm font-semibold">Messages</h2>
//             <DropdownMenu>
//               <DropdownMenuTrigger asChild><Button size="icon" variant="ghost" className="size-8" aria-label="New conversation"><Plus /></Button></DropdownMenuTrigger>
//               <DropdownMenuContent align="end">
//                 <DropdownMenuItem onSelect={() => setDialog('channel')}><Hash className="mr-2 size-4" />New channel</DropdownMenuItem>
//                 <DropdownMenuItem onSelect={() => setDialog('dm')}><MessageSquarePlus className="mr-2 size-4" />New message</DropdownMenuItem>
//               </DropdownMenuContent>
//             </DropdownMenu>
//           </div>
//           <div className="relative px-3 pt-3">
//             <Search className="absolute left-5 top-5 size-4 text-muted-foreground" aria-hidden="true" />
//             <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search conversations and messages" aria-label="Search conversations and messages" className="h-8 pl-8" />
//           </div>
//           <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
//             <p className="px-2.5 pb-1 pt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">Channels</p>
//             <ul aria-label="Channels" className="flex flex-col gap-0.5">{channels.map(renderConversation)}</ul>
//             {!channels.length && <p className="px-2.5 text-xs text-muted-foreground">{s ? 'No channels match.' : 'No channels yet.'}</p>}
//             <p className="px-2.5 pb-1 pt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">Direct messages</p>
//             <ul aria-label="Direct messages" className="flex flex-col gap-0.5">{dms.map(renderConversation)}</ul>
//             {!dms.length && <p className="px-2.5 text-xs text-muted-foreground">{s ? 'No messages match.' : 'No direct messages yet.'}</p>}
//           </div>
//         </aside>

//         {/* ---------- conversation ---------- */}
//         <div className={cn('flex min-h-0 flex-col', !showConversation && 'hidden md:flex')}>
//           {active ? (
//             <>
//               <header className="flex items-center gap-3 border-b px-4 py-3">
//                 <Button variant="ghost" size="icon" className="size-8 md:hidden" onClick={() => setShowConversation(false)} aria-label="Back to conversations"><ArrowLeft /></Button>
//                 {active.type === 'channel'
//                   ? <span className="inline-flex size-9 flex-none items-center justify-center rounded-lg border bg-subtle text-muted-foreground" aria-hidden="true"><Hash className="size-4" /></span>
//                   : <Avatar text={initials(dmPartner(active, me))} />}
//                 <div className="min-w-0 flex-1">
//                   <h2 className="truncate font-semibold">{conversationTitle(active, me)}</h2>
//                   <p className="truncate text-xs text-muted-foreground">
//                     {active.type === 'channel'
//                       ? `${active.description || 'Channel'} · ${active.members.length ? `${active.members.length} members` : 'Everyone'}`
//                       : roleOf(dmPartner(active, me)) || 'Direct message'}
//                   </p>
//                 </div>
//                 <DropdownMenu>
//                   <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="size-8" aria-label="Conversation actions"><MoreHorizontal /></Button></DropdownMenuTrigger>
//                   <DropdownMenuContent align="end">
//                     {active.type === 'channel' && <DropdownMenuItem onSelect={() => setDialog('edit-channel')}><Pencil className="mr-2 size-4" />Edit channel</DropdownMenuItem>}
//                     {active.type === 'channel' && <DropdownMenuSeparator />}
//                     <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => setDialog('delete-chat')}>
//                       <Trash2 className="mr-2 size-4" />{active.type === 'channel' ? 'Delete channel' : 'Delete conversation'}
//                     </DropdownMenuItem>
//                   </DropdownMenuContent>
//                 </DropdownMenu>
//               </header>

//               <ol aria-label={`Messages in ${conversationTitle(active, me)}`} className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
//                 {!active.messages.length && (
//                   <li><EmptyState icon={active.type === 'channel' ? Hash : MessageSquarePlus} title={`This is the start of ${conversationTitle(active, me)}`} description="Say hello — messages show here." /></li>
//                 )}
//                 {rows.map((r) => {
//                   if (r.kind === 'day') return <li key={r.key} className="my-3 flex items-center gap-3 px-3 text-xs font-medium text-muted-foreground"><span className="h-px flex-1 bg-border" />{r.label}<span className="h-px flex-1 bg-border" /></li>;
//                   if (r.kind === 'new') return <li key={r.key} className="my-2 flex items-center gap-3 px-3 text-xs font-semibold text-destructive" data-testid="new-messages"><span className="h-px flex-1 bg-destructive/40" />New messages<span className="h-px flex-1 bg-destructive/40" /></li>;
//                   const { m, grouped } = r;
//                   const own = isMe(m.author, me);
//                   const isEditing = editing?.id === m.id;
//                   const channel = active.type === 'channel';
//                   const reactions = Object.entries(m.reactions || {});
//                   const keepOpen = picker === m.id;                       // keep the buttons visible while the picker is open
//                   const reveal = cn('transition-opacity focus-visible:opacity-100', keepOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100');
//                   return (
//                     <li key={r.key} className={cn('group flex gap-2 px-3', own ? 'justify-end' : 'justify-start', grouped ? 'mt-0.5' : 'mt-3')}
//                       aria-label={`${displayName(m.author, me)} at ${timeOf(m.createdAt)}`} data-own={own ? 'true' : 'false'}>
//                       {!own && <div className="w-8 flex-none">{!grouped && <Avatar text={initials(m.author)} size="sm" />}</div>}
//                       <div className={cn('flex min-w-0 max-w-[78%] flex-col sm:max-w-[70%]', own ? 'items-end' : 'items-start')}>
//                         {/* bubble */}
//                         <div className={cn('relative max-w-full rounded-2xl px-3 py-1.5 shadow-sm',
//                           own ? 'bg-primary text-primary-foreground' : 'border bg-muted/60 text-foreground',
//                           !grouped && (own ? 'rounded-tr-md' : 'rounded-tl-md'), isEditing && 'w-full min-w-[260px]')}>
//                           {!own && !grouped && channel && (
//                             <p className="text-xs font-semibold text-primary">{m.author}{roleOf(m.author) && <span className="ml-1.5 font-normal text-muted-foreground">{roleOf(m.author)}</span>}</p>
//                           )}
//                           {isEditing ? (
//                             <div className="flex flex-col gap-2 py-1">
//                               <Textarea value={editing.text} onChange={(e) => setEditing({ ...editing, text: e.target.value })} aria-label="Edit message" rows={2} className="bg-background text-foreground"
//                                 onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); editTeamMessage(active.id, m.id, editing.text); setEditing(null); } if (e.key === 'Escape') setEditing(null); }} />
//                               <div className="flex justify-end gap-2">
//                                 <Button size="sm" variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
//                                 <Button size="sm" variant="secondary" onClick={() => { editTeamMessage(active.id, m.id, editing.text); setEditing(null); }} disabled={!editing.text.trim()}>Save</Button>
//                               </div>
//                             </div>
//                           ) : (
//                             <>
//                               <MessageText text={m.text} me={me} own={own} />
//                               <span className={cn('float-right -mb-0.5 ml-3 mt-0.5 inline-flex items-center gap-1 text-[11px] leading-4 tabular-nums', own ? 'text-primary-foreground/75' : 'text-muted-foreground')}>
//                                 {m.editedAt && <span>(edited)</span>}
//                                 <time dateTime={m.createdAt}>{timeOf(m.createdAt)}</time>
//                                 {own && <StatusTicks status={messageStatus(active, m, me)} channel={channel} />}
//                               </span>
//                             </>
//                           )}
//                         </div>
//                         {/* below the bubble: reactions · react · edit / delete */}
//                         {!isEditing && (
//                           <div className={cn('mt-1 flex flex-wrap items-center gap-1', own && 'flex-row-reverse')}>
//                             {reactions.map(([emoji, who]) => {
//                               const pressed = who.some((n) => isMe(n, me));
//                               const names = who.map((n) => displayName(n, me)).join(', ');
//                               return (
//                                 <button key={emoji} type="button" aria-pressed={pressed} onClick={() => toggleTeamReaction(active.id, m.id, emoji, me)}
//                                   title={names} aria-label={`${emoji} ${who.length}, reacted by ${names}`}
//                                   className={cn('inline-flex h-6 items-center gap-1 rounded-full border px-2 text-xs tabular-nums shadow-sm transition-colors', pressed ? 'border-primary/40 bg-primary/10 text-primary' : 'bg-background hover:bg-accent')}>
//                                   <span aria-hidden="true">{emoji}</span>{who.length}
//                                 </button>
//                               );
//                             })}
//                             <Popover open={picker === m.id} onOpenChange={(o) => setPicker(o ? m.id : null)}>
//                               <PopoverTrigger asChild>
//                                 <Button variant="ghost" size="icon" className={cn('size-6 rounded-full text-muted-foreground', reveal)} aria-label="Add reaction"><SmilePlus className="size-4" /></Button>
//                               </PopoverTrigger>
//                               <PopoverContent side="bottom" align={own ? 'end' : 'start'} sideOffset={6} className="w-auto border-0 bg-transparent p-0 shadow-none" aria-label="Choose a reaction">
//                                 <EmojiPicker reactionsDefaultOpen allowExpandReactions reactions={QUICK_REACTIONS} theme={pickerTheme()} emojiStyle={EmojiStyle.NATIVE} lazyLoadEmojis
//                                   searchPlaceholder="Search emoji" previewConfig={{ showPreview: false }} width={340} height={400}
//                                   onReactionClick={(e) => { toggleTeamReaction(active.id, m.id, e.emoji, me); setPicker(null); }}
//                                   onEmojiClick={(e) => { toggleTeamReaction(active.id, m.id, e.emoji, me); setPicker(null); }} />
//                               </PopoverContent>
//                             </Popover>
//                             {own && (
//                               <DropdownMenu>
//                                 <DropdownMenuTrigger asChild>
//                                   <Button variant="ghost" size="icon" className={cn('size-6 rounded-full text-muted-foreground data-[state=open]:opacity-100', reveal)} aria-label="Message actions"><MoreHorizontal className="size-4" /></Button>
//                                 </DropdownMenuTrigger>
//                                 <DropdownMenuContent align="end">
//                                   <DropdownMenuItem onSelect={() => setEditing({ id: m.id, text: m.text })}><Pencil className="mr-2 size-4" />Edit message</DropdownMenuItem>
//                                   <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => setDialog({ deleteMessage: m })}><Trash2 className="mr-2 size-4" />Delete message</DropdownMenuItem>
//                                 </DropdownMenuContent>
//                               </DropdownMenu>
//                             )}
//                           </div>
//                         )}
//                       </div>
//                     </li>
//                   );
//                 })}
//                 <li ref={listEnd} aria-hidden="true" />
//               </ol>

//               {/* composer */}
//               <div className="relative border-t p-3">
//                 {mentionOptions.length > 0 && (
//                   <ul role="listbox" aria-label="Mention someone" className="absolute bottom-full left-3 mb-1 w-64 overflow-hidden rounded-md border bg-popover p-1 shadow-md">
//                     {mentionOptions.map((n) => (
//                       <li key={n} role="option" aria-selected="false">
//                         <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insertMention(n)} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-accent">
//                           <Avatar text={initials(n)} size="xs" />{n}<span className="ml-auto text-xs text-muted-foreground">{roleOf(n)}</span>
//                         </button>
//                       </li>
//                     ))}
//                   </ul>
//                 )}
//                 <div className="flex items-end gap-2">
//                   <Popover open={composerEmoji} onOpenChange={setComposerEmoji}>
//                     <PopoverTrigger asChild>
//                       <Button variant="ghost" size="icon" className="size-10 flex-none text-muted-foreground" aria-label="Insert emoji"><Smile /></Button>
//                     </PopoverTrigger>
//                     <PopoverContent side="top" align="start" sideOffset={8} className="w-auto border-0 bg-transparent p-0 shadow-none" aria-label="Choose an emoji">
//                       <EmojiPicker theme={pickerTheme()} emojiStyle={EmojiStyle.NATIVE} lazyLoadEmojis searchPlaceholder="Search emoji"
//                         previewConfig={{ showPreview: false }} width={340} height={400} onEmojiClick={(e) => insertEmoji(e.emoji)} />
//                     </PopoverContent>
//                   </Popover>
//                   <Textarea ref={composer} value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={onKeyDown} rows={Math.min(6, Math.max(1, draft.split('\n').length))}
//                     placeholder={`Message ${conversationTitle(active, me)}`} aria-label={`Message ${conversationTitle(active, me)}`} className="min-h-10 resize-none" />
//                   <Button onClick={send} disabled={!draft.trim()} aria-label="Send message" className="h-10"><SendHorizontal /></Button>
//                 </div>
//                 <p className="mt-1.5 text-xs text-muted-foreground">Enter to send · Shift + Enter for a new line · @ to mention</p>
//               </div>
//             </>
//           ) : (
//             <div className="flex flex-1 items-center justify-center">
//               <EmptyState icon={Users} title="No conversation selected" description="Pick a channel or person on the left, or start a new conversation."
//                 action={<Button onClick={() => setDialog('dm')}><MessageSquarePlus />New message</Button>} />
//             </div>
//           )}
//         </div>
//       </section>

//       {(dialog === 'channel' || dialog === 'edit-channel') && (
//         <ChannelDialog me={me} channel={dialog === 'edit-channel' ? active : null} onClose={() => setDialog(null)}
//           onSave={(form) => {
//             if (dialog === 'edit-channel') { updateChannel(active.id, form); notify(`Updated #${channelSlug(form.name)}`); }
//             else { const c = createChannel(form, me); open(c); notify(`Created #${c.name}`); }
//             setDialog(null);
//           }} />
//       )}
//       {dialog === 'dm' && (
//         <NewMessageDialog me={me} onClose={() => setDialog(null)}
//           onOpen={(person) => { const c = openDirectMessage(person, me); open(c); setDialog(null); }} />
//       )}
//       {dialog === 'delete-chat' && active && (
//         <Modal title={active.type === 'channel' ? `Delete ${conversationTitle(active, me)}?` : `Delete your conversation with ${conversationTitle(active, me)}?`}
//           description="All its messages are removed for everyone. This can't be undone." onClose={() => setDialog(null)}
//           footer={<><Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
//             <Button variant="destructive" onClick={() => { const t = conversationTitle(active, me); deleteTeamChat(active.id); setActiveId(mine.find((c) => c.id !== active.id)?.id || null); setShowConversation(false); setDialog(null); notify(`Deleted ${t}`); }}><Trash2 />Delete</Button></>}>
//           <p className="text-sm text-muted-foreground">{active.messages.length} message{active.messages.length === 1 ? '' : 's'} will be deleted.</p>
//         </Modal>
//       )}
//       {dialog?.deleteMessage && (
//         <Modal title="Delete message?" description="It's removed for everyone in this conversation." onClose={() => setDialog(null)}
//           footer={<><Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
//             <Button variant="destructive" onClick={() => { deleteTeamMessage(active.id, dialog.deleteMessage.id); setDialog(null); notify('Message deleted'); }}><Trash2 />Delete message</Button></>}>
//           <blockquote className="rounded-md border-l-4 bg-muted/40 px-3 py-2 text-sm text-muted-foreground">{dialog.deleteMessage.text}</blockquote>
//         </Modal>
//       )}
//       <ToastBridge message={toast} />
//     </div>
//   );
// }

// /** New channel / Edit channel: name · description · members (none = everyone). */
// function ChannelDialog({ me, channel, onSave, onClose }) {
//   const [name, setName] = useState(channel?.name || '');
//   const [description, setDescription] = useState(channel?.description || '');
//   const [members, setMembers] = useState(() => (channel?.members || []).filter((m) => !isMe(m, me)));
//   const [error, setError] = useState('');
//   const slug = channelSlug(name);
//   const save = () => {
//     if (!slug) { setError('Channel name is required.'); return; }
//     onSave({ name, description, members: members.length ? [me, ...members] : [] });
//   };
//   return (
//     <Modal title={channel ? 'Edit channel' : 'New channel'} description="Channels are for topics, teams or projects." onClose={onClose}
//       footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={save}>{channel ? 'Save' : 'Create channel'}</Button></>}>
//       <div className="flex flex-col gap-4">
//         <div className="grid gap-2">
//           <Label htmlFor="channel-name">Name</Label>
//           <Input id="channel-name" value={name} onChange={(e) => { setName(e.target.value); setError(''); }} placeholder="e.g. payroll-team" aria-invalid={!!error} />
//           {error ? <p className="text-xs text-destructive">{error}</p> : slug && <p className="text-xs text-muted-foreground">Shown as <span className="font-medium text-foreground">#{slug}</span></p>}
//         </div>
//         <div className="grid gap-2">
//           <Label htmlFor="channel-description">Description</Label>
//           <Textarea id="channel-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="What is this channel about?" />
//         </div>
//         <MultiSelect label="Members" placeholder="Everyone (leave empty)" options={TEAM_NAMES.map((n) => ({ value: n, label: n, meta: roleOf(n) }))} value={members} onChange={setMembers}
//           renderOption={(o) => <span className="flex flex-1 items-center gap-2.5"><Avatar text={initials(o.label)} size="sm" /><span><span className="block font-medium">{o.label}</span><span className="block text-xs text-muted-foreground">{o.meta}</span></span></span>} />
//         <p className="-mt-2 text-xs text-muted-foreground">{members.length ? `${members.length + 1} members including you.` : 'Everyone in the firm can see this channel.'}</p>
//       </div>
//     </Modal>
//   );
// }

// /** New message: pick a teammate → opens (or starts) the direct message. */
// function NewMessageDialog({ me, onOpen, onClose }) {
//   const [person, setPerson] = useState('');
//   const people = TEAM_NAMES.filter((n) => !isMe(n, me));
//   return (
//     <Modal title="New message" description="Send a direct message to a teammate." onClose={onClose} width="max-w-md"
//       footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button disabled={!person} onClick={() => onOpen(person)}>Open conversation</Button></>}>
//       <div className="grid gap-2">
//         <Label htmlFor="dm-person">To</Label>
//         <Select value={person || undefined} onValueChange={setPerson}>
//           <SelectTrigger id="dm-person" aria-label="To"><SelectValue placeholder="Choose a teammate" /></SelectTrigger>
//           <SelectContent>{people.map((n) => <SelectItem key={n} value={n}>{n}{roleOf(n) ? ` — ${roleOf(n)}` : ''}</SelectItem>)}</SelectContent>
//         </Select>
//       </div>
//     </Modal>
//   );
// }
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Check, CheckCheck, Hash, MessageSquarePlus, MoreHorizontal, Pencil, Plus, Search, SendHorizontal, Smile, SmilePlus, Trash2, Users,
} from 'lucide-react';
import EmojiPicker, { EmojiStyle, Theme } from 'emoji-picker-react';

// shadcn components — one file each in src/components/ui
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { ToastBridge } from '../components/ui/sonner';

// your app components
import { Avatar, Modal, initials } from '../components/ui';
import { EmptyState } from '../components/page';
import MultiSelect from '../components/MultiSelect';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import {
  TEAM_NAMES, channelSlug, conversationTitle, displayName, dmPartner, firstUnreadId, isMe, isMember, lastMessage, mentions, messageStatus, recipientsOf, roleOf, unreadCount,
} from '../data/teamChats';
import { cn } from 'lib/utils';

const DAY = 86400000;
const timeOf = (iso) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
const dayKey = (iso) => new Date(iso).toDateString();
const dayLabel = (iso) => {
  const d = new Date(iso); const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === new Date(today.getTime() - DAY).toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
};
const shortTime = (iso) => (!iso ? '' : dayKey(iso) === new Date().toDateString() ? timeOf(iso) : new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));

/**
 * DEMO ONLY: with no server, pretend your new messages reach people (✓✓ after ~1 s) and,
 * in direct messages, get read (blue ✓✓ after ~3.5 s). Set to false once your server sends real receipts
 * (it then calls markTeamMessagesDelivered / markTeamChatRead).
 */
export const SIMULATE_RECEIPTS = true;
/** The six quick reactions (emoji-picker-react uses unified codes): 👍 ❤️ 😂 🎉 👀 ✅ */
const QUICK_REACTIONS = ['1f44d', '2764-fe0f', '1f602', '1f389', '1f440', '2705'];
const pickerTheme = () => (typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? Theme.DARK : Theme.LIGHT);

/** ✓ sent · ✓✓ delivered · blue ✓✓ read (WhatsApp style). */
function StatusTicks({ status, channel }) {
  const label = status.state === 'read' ? (channel ? `Read by everyone (${status.total})` : 'Read')
    : status.state === 'delivered' ? (channel ? `Delivered · read by ${status.read} of ${status.total}` : 'Delivered')
      : 'Sent';
  const Icon = status.state === 'sent' ? Check : CheckCheck;
  return (
    <span title={label} aria-label={label} data-status={status.state} className={cn('inline-flex', status.state === 'read' ? 'text-sky-400' : 'opacity-70')}>
      <Icon className="size-3.5" aria-hidden="true" />
    </span>
  );
}

/** Message text with @mentions highlighted (and your own mentions stronger). */
function MessageText({ text, me, own }) {
  const names = [...TEAM_NAMES, me].filter(Boolean).sort((a, b) => b.length - a.length);
  const firsts = names.map((n) => n.split(' ')[0]);
  const re = new RegExp(`(@(?:${[...names, ...firsts].map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')}))`);
  return (
    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
      {text.split(re).map((part, i) => (i % 2 === 1                 // split() puts the matched @mentions at odd positions
        ? <span key={i} className={cn('rounded px-0.5 font-medium', own ? 'bg-primary-foreground/20' : mentions(part, me) ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200' : 'bg-primary/10 text-primary')}>{part}</span>
        : <Fragment key={i}>{part}</Fragment>))}
    </p>
  );
}

/**
 * Communication: team channels and direct messages between teammates and the admin.
 * DataContext: teamChats · createChannel · updateChannel · deleteTeamChat · openDirectMessage ·
 *              sendTeamMessage · editTeamMessage · deleteTeamMessage · toggleTeamReaction · markTeamChatRead.
 * ?new=chat opens "New message".
 */
export default function Communication() {
  const { user } = useAuth() || {};
  const me = user?.name || 'Admin';
  const [params, setParams] = useSearchParams();
  const {
    teamChats = [], createChannel, updateChannel, deleteTeamChat, openDirectMessage,
    sendTeamMessage, editTeamMessage, deleteTeamMessage, toggleTeamReaction, markTeamChatRead, markTeamMessagesDelivered, teamOptions = [],
  } = useData();
  const activeNames = teamOptions.map((o) => o.label);                    // pickers: active teammates (+ you) only

  const mine = useMemo(() => teamChats.filter((c) => isMember(c, me)), [teamChats, me]);
  const [activeId, setActiveId] = useState(() => mine[0]?.id || null);
  const [showConversation, setShowConversation] = useState(false);       // phones: list or conversation
  const [q, setQ] = useState('');
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState(null);                           // { id, text }
  const [dialog, setDialog] = useState(null);                             // 'channel' | 'dm' | 'edit-channel' | 'delete-chat' | { deleteMessage }
  const [unreadFrom, setUnreadFrom] = useState(null);                     // where the "New messages" divider goes
  const [toast, setToast] = useState('');
  const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 2600); };
  const [picker, setPicker] = useState(null);                             // message id whose reaction picker is open
  const [composerEmoji, setComposerEmoji] = useState(false);
  const listEnd = useRef(null);
  const composer = useRef(null);
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const active = mine.find((c) => c.id === activeId) || null;

  // ?new=chat → New message
  useEffect(() => {
    if (params.get('new') === 'chat') { setDialog('dm'); const n = new URLSearchParams(params); n.delete('new'); setParams(n, { replace: true }); }
  }, [params]); // eslint-disable-line react-hooks/exhaustive-deps
  // opening a conversation: remember where unread starts, then mark it read
  const open = (c) => {
    setUnreadFrom(firstUnreadId(c, me));
    setActiveId(c.id); setShowConversation(true); setEditing(null);
    markTeamChatRead(c.id, me);
  };
  useEffect(() => { if (active && unreadCount(active, me)) markTeamChatRead(active.id, me); }, [active?.messages.length]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { listEnd.current?.scrollIntoView?.({ block: 'end' }); }, [activeId, active?.messages.length]);
  // first visit: mark the opened conversation
  useEffect(() => { if (active) { setUnreadFrom(firstUnreadId(active, me)); markTeamChatRead(active.id, me); } }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- the conversation list (search: names and message text) ---------- */
  const s = q.trim().toLowerCase();
  const matches = (c) => !s || conversationTitle(c, me).toLowerCase().includes(s) || c.messages.some((m) => m.text.toLowerCase().includes(s));
  const byRecent = (a, b) => (lastMessage(b)?.createdAt || b.createdAt).localeCompare(lastMessage(a)?.createdAt || a.createdAt);
  const channels = mine.filter((c) => c.type === 'channel' && matches(c)).sort(byRecent);
  const dms = mine.filter((c) => c.type === 'dm' && matches(c)).sort(byRecent);

  /* ---------- sending ---------- */
  const mentionQuery = (/(^|\s)@([\w]*)$/.exec(draft) || [])[2];
  const mentionOptions = mentionQuery !== undefined
    ? (active?.members?.length ? active.members.filter((m) => !isMe(m, me) && activeNames.includes(m)) : activeNames.filter((n) => !isMe(n, me))).filter((n) => n.toLowerCase().includes(mentionQuery.toLowerCase())).slice(0, 6)
    : [];
  const insertMention = (name) => { setDraft((d) => d.replace(/@[\w]*$/, `@${name} `)); composer.current?.focus(); };
  const send = () => {
    if (!active || !draft.trim()) return;
    const m = sendTeamMessage(active.id, draft, me);
    setDraft(''); setUnreadFrom(null);
    if (SIMULATE_RECEIPTS && m) {                                         // demo: ✓ → ✓✓ → blue ✓✓
      const people = recipientsOf(active, me, me);
      timers.current.push(setTimeout(() => people.forEach((n) => markTeamMessagesDelivered?.(active.id, n)), 1200));
      if (active.type === 'dm') timers.current.push(setTimeout(() => people.forEach((n) => markTeamChatRead(active.id, n)), 3500));
    }
  };
  /** Insert an emoji where the cursor is in the composer. */
  const insertEmoji = (emoji) => {
    const el = composer.current;
    const at = el && typeof el.selectionStart === 'number' ? el.selectionStart : draft.length;
    const end = el && typeof el.selectionEnd === 'number' ? el.selectionEnd : at;
    setDraft((d) => d.slice(0, at) + emoji + d.slice(end));
    setComposerEmoji(false);
    requestAnimationFrame(() => { el?.focus(); el?.setSelectionRange?.(at + emoji.length, at + emoji.length); });
  };
  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent?.isComposing) { e.preventDefault(); send(); }
  };

  const renderConversation = (c) => {
    const unread = unreadCount(c, me);
    const last = lastMessage(c);
    const partner = c.type === 'dm' ? dmPartner(c, me) : null;
    return (
      <li key={c.id}>
        <button type="button" onClick={() => open(c)} aria-current={c.id === activeId ? 'true' : undefined}
          className={cn('flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-accent/60', c.id === activeId && 'bg-accent')}>
          {c.type === 'channel'
            ? <span className="inline-flex size-9 flex-none items-center justify-center rounded-lg border bg-subtle text-muted-foreground" aria-hidden="true"><Hash className="size-4" /></span>
            : <Avatar text={initials(partner)} />}
          <span className="min-w-0 flex-1">
            <span className="flex items-center justify-between gap-2">
              <span className={cn('truncate text-sm', unread ? 'font-semibold text-foreground' : 'font-medium')}>{conversationTitle(c, me)}</span>
              <span className="flex-none text-xs tabular-nums text-muted-foreground">{shortTime(last?.createdAt)}</span>
            </span>
            <span className="flex items-center justify-between gap-2">
              <span className="truncate text-xs text-muted-foreground">{last ? `${displayName(last.author, me)}: ${last.text}` : 'No messages yet'}</span>
              {unread > 0 && <Badge className="h-5 min-w-5 flex-none justify-center rounded-full px-1.5 text-[11px] tabular-nums" aria-label={`${unread} unread`}>{unread}</Badge>}
            </span>
          </span>
        </button>
      </li>
    );
  };

  /* ---------- messages: day dividers, grouping, "New messages" ---------- */
  const rows = [];
  (active?.messages || []).forEach((m, i, list) => {
    const prev = list[i - 1];
    const newDay = !prev || dayKey(prev.createdAt) !== dayKey(m.createdAt);
    if (newDay) rows.push({ kind: 'day', key: `d-${m.id}`, label: dayLabel(m.createdAt) });
    if (m.id === unreadFrom) rows.push({ kind: 'new', key: `n-${m.id}` });
    const grouped = !newDay && prev && prev.author === m.author && m.id !== unreadFrom && new Date(m.createdAt) - new Date(prev.createdAt) < 5 * 60000;
    rows.push({ kind: 'msg', key: m.id, m, grouped });
  });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Communication</h1>
        <p className="text-muted-foreground">Channels and direct messages for your team.</p>
      </div>

      <section aria-label="Team messages" className="grid h-[calc(100vh-var(--app-header-h,64px)-11rem)] min-h-[520px] grid-cols-1 overflow-hidden rounded-xl border bg-card shadow-card md:grid-cols-[300px_minmax(0,1fr)]">
        {/* ---------- conversation list ---------- */}
        <aside className={cn('flex min-h-0 flex-col border-r', showConversation && 'hidden md:flex')} aria-label="Conversations">
          <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
            <h2 className="text-sm font-semibold">Messages</h2>
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button size="icon" variant="ghost" className="size-8" aria-label="New conversation"><Plus /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setDialog('channel')}><Hash className="mr-2 size-4" />New channel</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setDialog('dm')}><MessageSquarePlus className="mr-2 size-4" />New message</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="relative px-3 pt-3">
            <Search className="absolute left-5 top-5 size-4 text-muted-foreground" aria-hidden="true" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search conversations and messages" aria-label="Search conversations and messages" className="h-8 pl-8" />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
            <p className="px-2.5 pb-1 pt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">Channels</p>
            <ul aria-label="Channels" className="flex flex-col gap-0.5">{channels.map(renderConversation)}</ul>
            {!channels.length && <p className="px-2.5 text-xs text-muted-foreground">{s ? 'No channels match.' : 'No channels yet.'}</p>}
            <p className="px-2.5 pb-1 pt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">Direct messages</p>
            <ul aria-label="Direct messages" className="flex flex-col gap-0.5">{dms.map(renderConversation)}</ul>
            {!dms.length && <p className="px-2.5 text-xs text-muted-foreground">{s ? 'No messages match.' : 'No direct messages yet.'}</p>}
          </div>
        </aside>

        {/* ---------- conversation ---------- */}
        <div className={cn('flex min-h-0 flex-col', !showConversation && 'hidden md:flex')}>
          {active ? (
            <>
              <header className="flex items-center gap-3 border-b px-4 py-3">
                <Button variant="ghost" size="icon" className="size-8 md:hidden" onClick={() => setShowConversation(false)} aria-label="Back to conversations"><ArrowLeft /></Button>
                {active.type === 'channel'
                  ? <span className="inline-flex size-9 flex-none items-center justify-center rounded-lg border bg-subtle text-muted-foreground" aria-hidden="true"><Hash className="size-4" /></span>
                  : <Avatar text={initials(dmPartner(active, me))} />}
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-semibold">{conversationTitle(active, me)}</h2>
                  <p className="truncate text-xs text-muted-foreground">
                    {active.type === 'channel'
                      ? `${active.description || 'Channel'} · ${active.members.length ? `${active.members.length} members` : 'Everyone'}`
                      : roleOf(dmPartner(active, me)) || 'Direct message'}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="size-8" aria-label="Conversation actions"><MoreHorizontal /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {active.type === 'channel' && <DropdownMenuItem onSelect={() => setDialog('edit-channel')}><Pencil className="mr-2 size-4" />Edit channel</DropdownMenuItem>}
                    {active.type === 'channel' && <DropdownMenuSeparator />}
                    <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => setDialog('delete-chat')}>
                      <Trash2 className="mr-2 size-4" />{active.type === 'channel' ? 'Delete channel' : 'Delete conversation'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </header>

              <ol aria-label={`Messages in ${conversationTitle(active, me)}`} className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
                {!active.messages.length && (
                  <li><EmptyState icon={active.type === 'channel' ? Hash : MessageSquarePlus} title={`This is the start of ${conversationTitle(active, me)}`} description="Say hello — messages show here." /></li>
                )}
                {rows.map((r) => {
                  if (r.kind === 'day') return <li key={r.key} className="my-3 flex items-center gap-3 px-3 text-xs font-medium text-muted-foreground"><span className="h-px flex-1 bg-border" />{r.label}<span className="h-px flex-1 bg-border" /></li>;
                  if (r.kind === 'new') return <li key={r.key} className="my-2 flex items-center gap-3 px-3 text-xs font-semibold text-destructive" data-testid="new-messages"><span className="h-px flex-1 bg-destructive/40" />New messages<span className="h-px flex-1 bg-destructive/40" /></li>;
                  const { m, grouped } = r;
                  const own = isMe(m.author, me);
                  const isEditing = editing?.id === m.id;
                  const channel = active.type === 'channel';
                  const reactions = Object.entries(m.reactions || {});
                  const keepOpen = picker === m.id;                       // keep the buttons visible while the picker is open
                  const reveal = cn('transition-opacity focus-visible:opacity-100', keepOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100');
                  return (
                    <li key={r.key} className={cn('group flex gap-2 px-3', own ? 'justify-end' : 'justify-start', grouped ? 'mt-0.5' : 'mt-3')}
                      aria-label={`${displayName(m.author, me)} at ${timeOf(m.createdAt)}`} data-own={own ? 'true' : 'false'}>
                      {!own && <div className="w-8 flex-none">{!grouped && <Avatar text={initials(m.author)} size="sm" />}</div>}
                      <div className={cn('flex min-w-0 max-w-[78%] flex-col sm:max-w-[70%]', own ? 'items-end' : 'items-start')}>
                        {/* bubble */}
                        <div className={cn('relative max-w-full rounded-2xl px-3 py-1.5 shadow-sm',
                          own ? 'bg-primary text-primary-foreground' : 'border bg-muted/60 text-foreground',
                          !grouped && (own ? 'rounded-tr-md' : 'rounded-tl-md'), isEditing && 'w-full min-w-[260px]')}>
                          {!own && !grouped && channel && (
                            <p className="text-xs font-semibold text-primary">{m.author}{roleOf(m.author) && <span className="ml-1.5 font-normal text-muted-foreground">{roleOf(m.author)}</span>}</p>
                          )}
                          {isEditing ? (
                            <div className="flex flex-col gap-2 py-1">
                              <Textarea value={editing.text} onChange={(e) => setEditing({ ...editing, text: e.target.value })} aria-label="Edit message" rows={2} className="bg-background text-foreground"
                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); editTeamMessage(active.id, m.id, editing.text); setEditing(null); } if (e.key === 'Escape') setEditing(null); }} />
                              <div className="flex justify-end gap-2">
                                <Button size="sm" variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
                                <Button size="sm" variant="secondary" onClick={() => { editTeamMessage(active.id, m.id, editing.text); setEditing(null); }} disabled={!editing.text.trim()}>Save</Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <MessageText text={m.text} me={me} own={own} />
                              <span className={cn('float-right -mb-0.5 ml-3 mt-0.5 inline-flex items-center gap-1 text-[11px] leading-4 tabular-nums', own ? 'text-primary-foreground/75' : 'text-muted-foreground')}>
                                {m.editedAt && <span>(edited)</span>}
                                <time dateTime={m.createdAt}>{timeOf(m.createdAt)}</time>
                                {own && <StatusTicks status={messageStatus(active, m, me)} channel={channel} />}
                              </span>
                            </>
                          )}
                        </div>
                        {/* below the bubble: reactions · react · edit / delete */}
                        {!isEditing && (
                          <div className={cn('mt-1 flex flex-wrap items-center gap-1', own && 'flex-row-reverse')}>
                            {reactions.map(([emoji, who]) => {
                              const pressed = who.some((n) => isMe(n, me));
                              const names = who.map((n) => displayName(n, me)).join(', ');
                              return (
                                <button key={emoji} type="button" aria-pressed={pressed} onClick={() => toggleTeamReaction(active.id, m.id, emoji, me)}
                                  title={names} aria-label={`${emoji} ${who.length}, reacted by ${names}`}
                                  className={cn('inline-flex h-6 items-center gap-1 rounded-full border px-2 text-xs tabular-nums shadow-sm transition-colors', pressed ? 'border-primary/40 bg-primary/10 text-primary' : 'bg-background hover:bg-accent')}>
                                  <span aria-hidden="true">{emoji}</span>{who.length}
                                </button>
                              );
                            })}
                            <Popover open={picker === m.id} onOpenChange={(o) => setPicker(o ? m.id : null)}>
                              <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className={cn('size-6 rounded-full text-muted-foreground', reveal)} aria-label="Add reaction"><SmilePlus className="size-4" /></Button>
                              </PopoverTrigger>
                              <PopoverContent side="bottom" align={own ? 'end' : 'start'} sideOffset={6} className="w-auto border-0 bg-transparent p-0 shadow-none" aria-label="Choose a reaction">
                                <EmojiPicker reactionsDefaultOpen allowExpandReactions reactions={QUICK_REACTIONS} theme={pickerTheme()} emojiStyle={EmojiStyle.NATIVE} lazyLoadEmojis
                                  searchPlaceholder="Search emoji" previewConfig={{ showPreview: false }} width={340} height={400}
                                  onReactionClick={(e) => { toggleTeamReaction(active.id, m.id, e.emoji, me); setPicker(null); }}
                                  onEmojiClick={(e) => { toggleTeamReaction(active.id, m.id, e.emoji, me); setPicker(null); }} />
                              </PopoverContent>
                            </Popover>
                            {own && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className={cn('size-6 rounded-full text-muted-foreground data-[state=open]:opacity-100', reveal)} aria-label="Message actions"><MoreHorizontal className="size-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onSelect={() => setEditing({ id: m.id, text: m.text })}><Pencil className="mr-2 size-4" />Edit message</DropdownMenuItem>
                                  <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => setDialog({ deleteMessage: m })}><Trash2 className="mr-2 size-4" />Delete message</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
                <li ref={listEnd} aria-hidden="true" />
              </ol>

              {/* composer */}
              <div className="relative border-t p-3">
                {mentionOptions.length > 0 && (
                  <ul role="listbox" aria-label="Mention someone" className="absolute bottom-full left-3 mb-1 w-64 overflow-hidden rounded-md border bg-popover p-1 shadow-md">
                    {mentionOptions.map((n) => (
                      <li key={n} role="option" aria-selected="false">
                        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insertMention(n)} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-accent">
                          <Avatar text={initials(n)} size="xs" />{n}<span className="ml-auto text-xs text-muted-foreground">{roleOf(n)}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex items-end gap-2">
                  <Popover open={composerEmoji} onOpenChange={setComposerEmoji}>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-10 flex-none text-muted-foreground" aria-label="Insert emoji"><Smile /></Button>
                    </PopoverTrigger>
                    <PopoverContent side="top" align="start" sideOffset={8} className="w-auto border-0 bg-transparent p-0 shadow-none" aria-label="Choose an emoji">
                      <EmojiPicker theme={pickerTheme()} emojiStyle={EmojiStyle.NATIVE} lazyLoadEmojis searchPlaceholder="Search emoji"
                        previewConfig={{ showPreview: false }} width={340} height={400} onEmojiClick={(e) => insertEmoji(e.emoji)} />
                    </PopoverContent>
                  </Popover>
                  <Textarea ref={composer} value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={onKeyDown} rows={Math.min(6, Math.max(1, draft.split('\n').length))}
                    placeholder={`Message ${conversationTitle(active, me)}`} aria-label={`Message ${conversationTitle(active, me)}`} className="min-h-10 resize-none" />
                  <Button onClick={send} disabled={!draft.trim()} aria-label="Send message" className="h-10"><SendHorizontal /></Button>
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">Enter to send · Shift + Enter for a new line · @ to mention</p>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <EmptyState icon={Users} title="No conversation selected" description="Pick a channel or person on the left, or start a new conversation."
                action={<Button onClick={() => setDialog('dm')}><MessageSquarePlus />New message</Button>} />
            </div>
          )}
        </div>
      </section>

      {(dialog === 'channel' || dialog === 'edit-channel') && (
        <ChannelDialog me={me} channel={dialog === 'edit-channel' ? active : null} onClose={() => setDialog(null)}
          onSave={(form) => {
            if (dialog === 'edit-channel') { updateChannel(active.id, form); notify(`Updated #${channelSlug(form.name)}`); }
            else { const c = createChannel(form, me); open(c); notify(`Created #${c.name}`); }
            setDialog(null);
          }} />
      )}
      {dialog === 'dm' && (
        <NewMessageDialog me={me} onClose={() => setDialog(null)}
          onOpen={(person) => { const c = openDirectMessage(person, me); open(c); setDialog(null); }} />
      )}
      {dialog === 'delete-chat' && active && (
        <Modal title={active.type === 'channel' ? `Delete ${conversationTitle(active, me)}?` : `Delete your conversation with ${conversationTitle(active, me)}?`}
          description="All its messages are removed for everyone. This can't be undone." onClose={() => setDialog(null)}
          footer={<><Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { const t = conversationTitle(active, me); deleteTeamChat(active.id); setActiveId(mine.find((c) => c.id !== active.id)?.id || null); setShowConversation(false); setDialog(null); notify(`Deleted ${t}`); }}><Trash2 />Delete</Button></>}>
          <p className="text-sm text-muted-foreground">{active.messages.length} message{active.messages.length === 1 ? '' : 's'} will be deleted.</p>
        </Modal>
      )}
      {dialog?.deleteMessage && (
        <Modal title="Delete message?" description="It's removed for everyone in this conversation." onClose={() => setDialog(null)}
          footer={<><Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { deleteTeamMessage(active.id, dialog.deleteMessage.id); setDialog(null); notify('Message deleted'); }}><Trash2 />Delete message</Button></>}>
          <blockquote className="rounded-md border-l-4 bg-muted/40 px-3 py-2 text-sm text-muted-foreground">{dialog.deleteMessage.text}</blockquote>
        </Modal>
      )}
      <ToastBridge message={toast} />
    </div>
  );
}

/** New channel / Edit channel: name · description · members (none = everyone). */
function ChannelDialog({ me, channel, onSave, onClose }) {
  const { teamOptions = [] } = useData();
  const choices = teamOptions.map((o) => o.label).filter((n) => !isMe(n, me));
  const [name, setName] = useState(channel?.name || '');
  const [description, setDescription] = useState(channel?.description || '');
  const [members, setMembers] = useState(() => (channel?.members || []).filter((m) => !isMe(m, me)));
  const [error, setError] = useState('');
  const slug = channelSlug(name);
  const save = () => {
    if (!slug) { setError('Channel name is required.'); return; }
    onSave({ name, description, members: members.length ? [me, ...members] : [] });
  };
  return (
    <Modal title={channel ? 'Edit channel' : 'New channel'} description="Channels are for topics, teams or projects." onClose={onClose}
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={save}>{channel ? 'Save' : 'Create channel'}</Button></>}>
      <div className="flex flex-col gap-4">
        <div className="grid gap-2">
          <Label htmlFor="channel-name">Name</Label>
          <Input id="channel-name" value={name} onChange={(e) => { setName(e.target.value); setError(''); }} placeholder="e.g. payroll-team" aria-invalid={!!error} />
          {error ? <p className="text-xs text-destructive">{error}</p> : slug && <p className="text-xs text-muted-foreground">Shown as <span className="font-medium text-foreground">#{slug}</span></p>}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="channel-description">Description</Label>
          <Textarea id="channel-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="What is this channel about?" />
        </div>
        <MultiSelect label="Members" placeholder="Everyone (leave empty)" options={choices.map((n) => ({ value: n, label: n, meta: roleOf(n) }))} value={members} onChange={setMembers}
          renderOption={(o) => <span className="flex flex-1 items-center gap-2.5"><Avatar text={initials(o.label)} size="sm" /><span><span className="block font-medium">{o.label}</span><span className="block text-xs text-muted-foreground">{o.meta}</span></span></span>} />
        <p className="-mt-2 text-xs text-muted-foreground">{members.length ? `${members.length + 1} members including you.` : 'Everyone in the firm can see this channel.'}</p>
      </div>
    </Modal>
  );
}

/** New message: pick a teammate → opens (or starts) the direct message. */
function NewMessageDialog({ me, onOpen, onClose }) {
  const [person, setPerson] = useState('');
  const { teamOptions = [] } = useData();
  const people = teamOptions.map((o) => o.label).filter((n) => !isMe(n, me));         // active teammates only
  return (
    <Modal title="New message" description="Send a direct message to a teammate." onClose={onClose} width="max-w-md"
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button disabled={!person} onClick={() => onOpen(person)}>Open conversation</Button></>}>
      <div className="grid gap-2">
        <Label htmlFor="dm-person">To</Label>
        <Select value={person || undefined} onValueChange={setPerson}>
          <SelectTrigger id="dm-person" aria-label="To"><SelectValue placeholder="Choose a teammate" /></SelectTrigger>
          <SelectContent>{people.map((n) => <SelectItem key={n} value={n}>{n}{roleOf(n) ? ` — ${roleOf(n)}` : ''}</SelectItem>)}</SelectContent>
        </Select>
      </div>
    </Modal>
  );
}
