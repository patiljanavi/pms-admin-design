// Team communication (Communication menu): channels and direct messages between teammates and the admin.
// Conversation: { id, type: 'channel' | 'dm', name, description, members: [names], createdBy, createdAt,
//                 messages: [{ id, author, text, createdAt, editedAt?, reactions: { emoji: [names] }, deliveredTo: [names] }],
//                 lastRead: { name: iso } }
// Message status (like WhatsApp) for your own messages: sent ✓ · delivered ✓✓ (reached every recipient) · read ✓✓ blue
// (every recipient opened the conversation after it was sent — the same lastRead that drives unread counts).
// The signed-in person is passed in as `me` (their name). In the demo data, ME stands for "the signed-in person".
import { TEAM_MEMBERS } from './sampleData';

export const ME = '__me__';
export const REACTIONS = ['👍', '❤️', '😂', '🎉', '👀', '✅'];
export const TEAM_NAMES = TEAM_MEMBERS.map((m) => m.label);
export const roleOf = (name) => TEAM_MEMBERS.find((m) => m.label === name)?.meta || '';

let seq = 0;
export const chatId = (p = 'tc') => `${p}-${Date.now().toString(36)}${(seq += 1).toString(36)}${Math.random().toString(36).slice(2, 5)}`;

/** Is this name the signed-in person? (handles the ME placeholder in demo data) */
export const isMe = (name, me) => name === ME || (!!me && name === me);
/** Display name: "You" for the signed-in person. */
export const displayName = (name, me) => (isMe(name, me) ? 'You' : name);
/** Is the signed-in person a member of this conversation? Channels with no member list are open to everyone. */
export const isMember = (c, me) => !c.members?.length || c.members.some((m) => isMe(m, me));
/** The other person in a direct message. */
export const dmPartner = (c, me) => (c.members || []).find((m) => !isMe(m, me)) || (c.members || [])[0];
/** Title of a conversation: "#general" or the other person's name. */
export const conversationTitle = (c, me) => (c.type === 'channel' ? `#${c.name}` : dmPartner(c, me) || 'Direct message');
const lastReadOf = (c, me) => (c.lastRead || {})[me] || (c.lastRead || {})[ME] || '';
/** Messages you haven't read (not counting your own). */
export const unreadCount = (c, me) => {
  const since = lastReadOf(c, me);
  return (c.messages || []).filter((m) => !isMe(m.author, me) && m.createdAt > since).length;
};
export const firstUnreadId = (c, me) => {
  const since = lastReadOf(c, me);
  return (c.messages || []).find((m) => !isMe(m.author, me) && m.createdAt > since)?.id || null;
};
/** Who receives messages in this conversation (everyone but the author; channels with no member list = the whole team). */
export const recipientsOf = (c, author, me) => {
  const all = c.members?.length ? c.members : [ME, ...TEAM_NAMES];
  return [...new Set(all)].filter((n) => !(isMe(n, me) && isMe(author, me)) && n !== author);
};
const readAt = (c, name, me) => (c.lastRead || {})[name] || (isMe(name, me) ? (c.lastRead || {})[ME] || (c.lastRead || {})[me] : '') || '';
/**
 * Status of a message: { state: 'sent' | 'delivered' | 'read', read, delivered, total }.
 * read = recipients who opened the conversation after it was sent; delivered = recipients it reached (or who read it).
 */
export const messageStatus = (c, m, me) => {
  const people = recipientsOf(c, m.author, me);
  const read = people.filter((n) => readAt(c, n, me) >= m.createdAt).length;
  const delivered = people.filter((n) => readAt(c, n, me) >= m.createdAt || (m.deliveredTo || []).includes(n)).length;
  const total = people.length;
  return { state: total && read === total ? 'read' : total && delivered === total ? 'delivered' : 'sent', read, delivered, total };
};
export const lastMessage = (c) => (c.messages || [])[c.messages.length - 1] || null;
/** Does the text mention this person (@First Last or @First)? */
export const mentions = (text = '', name = '') => {
  const first = name.split(' ')[0];
  return !!name && (text.includes(`@${name}`) || new RegExp(`@${first}\\b`).test(text));
};
/** "general-updates" style channel names. */
export const channelSlug = (s = '') => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);

/* ---------- demo data (times relative to now, so it always looks current) ---------- */
const ago = (min) => new Date(Date.now() - min * 60000).toISOString();
const msg = (author, text, minAgo, reactions = {}, deliveredTo = []) => ({ id: chatId('tm'), author, text, createdAt: ago(minAgo), reactions, deliveredTo });

export function seedTeamChats() {
  const [ava, jonas, leila, mateo, nina, samuel, elena] = TEAM_NAMES;
  return [
    {
      id: 'tc-general', type: 'channel', name: 'general', description: 'Firm-wide announcements and day-to-day chat',
      members: [], createdBy: samuel, createdAt: ago(60 * 24 * 30),
      lastRead: { [ME]: ago(60), [ava]: ago(30), [samuel]: ago(25), [nina]: ago(19), [jonas]: ago(60 * 2), [elena]: ago(44), [leila]: ago(60 * 2.5), [mateo]: ago(60 * 2), [TEAM_NAMES[7]]: ago(60 * 2.9) },
      messages: [
        msg(samuel, 'Morning all — reminder that the office closes early on Friday.', 60 * 26, { '👍': [ava, jonas, mateo] }),
        msg(ava, 'Thanks! I’ll move my 4pm client call to Thursday.', 60 * 25),
        msg(ME, 'Quarterly review deck is in the shared drive under Firm Documents.', 60 * 3, { '🎉': [samuel] }, TEAM_NAMES),
        msg(elena, 'Welcome to our three new clients this week 🎉 Onboarding packets went out this morning.', 45, { '❤️': [nina, ava] }),
        msg(nina, 'Payroll for the 15th is fully processed for every client.', 20),
      ],
    },
    {
      id: 'tc-tax', type: 'channel', name: 'tax-season', description: 'Returns, extensions and deadlines',
      members: [ME, leila, jonas, samuel, ava], createdBy: leila, createdAt: ago(60 * 24 * 20),
      lastRead: { [ME]: ago(60 * 5), [leila]: ago(25), [jonas]: ago(60 * 3), [samuel]: ago(29), [ava]: ago(60 * 8) },
      messages: [
        msg(leila, 'Extension deadline is coming up. I’ve flagged 6 returns still waiting on client documents.', 60 * 7),
        msg(jonas, 'I can take two of those. Okafor Holdings and Rivera Studio?', 60 * 6, { '✅': [leila] }),
        msg(leila, '@Jonas perfect, thank you. The rest I’ll chase today.', 60 * 4),
        msg(samuel, 'Let’s review the open ones together at 3pm.', 30),
      ],
    },
    {
      id: 'tc-onboarding', type: 'channel', name: 'client-onboarding', description: 'New clients, kickoff calls and paperwork',
      members: [ME, elena, mateo, ava], createdBy: elena, createdAt: ago(60 * 24 * 10),
      lastRead: { [ME]: ago(5), [elena]: ago(60), [mateo]: ago(60 * 20), [ava]: ago(60 * 29) },
      messages: [
        msg(elena, 'Kickoff call with Harbor Bakery is booked for Tuesday 10am.', 60 * 30),
        msg(mateo, 'I’ll set up their bookkeeping pipeline before then.', 60 * 29),
      ],
    },
    {
      id: 'tc-dm-ava', type: 'dm', name: '', description: '', members: [ME, ava], createdBy: ava, createdAt: ago(60 * 24 * 7),
      lastRead: { [ME]: ago(60 * 2), [ava]: ago(60 * 2.4) },
      messages: [
        msg(ava, 'Hi! Could you approve the new engagement letter template?', 60 * 3),
        msg(ME, 'Looking at it now.', 60 * 2.5, {}, [ava]),
        msg(ava, 'Thanks — the client is waiting on it before they sign.', 15),
      ],
    },
    {
      id: 'tc-dm-jonas', type: 'dm', name: '', description: '', members: [ME, jonas], createdBy: ME, createdAt: ago(60 * 24 * 3),
      lastRead: { [ME]: ago(10), [jonas]: ago(60 * 24 + 15) },
      messages: [
        msg(ME, 'Can you send me the reconciliation for October?', 60 * 24 + 40),
        msg(jonas, 'Sent it to your inbox 👍', 60 * 24 + 10, { '👍': [ME] }),
      ],
    },
  ];
}