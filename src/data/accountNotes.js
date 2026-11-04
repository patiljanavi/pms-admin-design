// Account notes (Notes tab): standard notes and reviewer notes (an append-only log).
let seq = 0;
export const noteId = (p = 'note') => `${p}-${Date.now().toString(36)}${(seq += 1).toString(36)}${Math.random().toString(36).slice(2, 5)}`;

/** Notes saved before this version had { text, author } — read them as standard notes. */
export const normalizeNote = (n) => ({
  id: n.id,
  title: n.title || (n.text ? String(n.text).replace(/<[^>]*>/g, '').slice(0, 60) : 'Note'),
  text: n.text || '',
  createdBy: n.createdBy || n.author || 'Unknown',
  createdAt: n.createdAt || new Date().toISOString(),
  archived: !!n.archived,
  pinned: !!n.pinned,
  noteType: n.noteType || 'standard',
  logs: n.logs || [],
});

/** Pinned first, then newest first. */
export const sortNotes = (list) => [...list].sort((a, b) => (a.pinned === b.pinned ? new Date(b.createdAt) - new Date(a.createdAt) : a.pinned ? -1 : 1));

export const fmtNoteTime = (iso) => new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });

/** Demo notes for accounts that have none saved yet (stable ids per account). */
export function demoNotes(account) {
  const ago = (d, h = 0) => new Date(Date.now() - d * 86400000 - h * 3600000).toISOString();
  const id = (k) => `note-${account.id}-${k}`;
  return [
    { id: id(1), noteType: 'standard', pinned: true, archived: false, title: 'Prefers email', createdBy: 'Ava Thompson', createdAt: ago(9),
      text: '<p>Prefers <b>email</b> over phone calls. Best reached before 10 am.</p>', logs: [] },
    { id: id(2), noteType: 'standard', pinned: false, archived: false, title: 'Year-end planning call', createdBy: 'Jonas Berg', createdAt: ago(3),
      text: '<p>Discussed buying equipment before December to use Section 179.</p><ul><li>Send depreciation estimate</li><li>Follow up in 2 weeks</li></ul>', logs: [] },
    { id: id(3), noteType: 'standard', pinned: false, archived: true, title: 'Old bank details', createdBy: 'Mateo Rossi', createdAt: ago(60),
      text: '<p>Switched banks in March — old statements are in Private.</p>', logs: [] },
    { id: id(4), noteType: 'reviewer', pinned: false, archived: false, title: 'June Tax return', createdBy: 'Leila Nasser', createdAt: ago(20), text: '',
      logs: [
        { id: id('l1'), text: '<p>Prepared the return. Waiting on the 1099-B.</p>', createdBy: 'Leila Nasser', createdByEmail: 'leila@harbor.dev', createdAt: ago(20) },
        { id: id('l2'), text: '<p>Reviewed — capital gains look right. Ready for partner sign-off.</p>', createdBy: 'Samuel Adeyemi', createdByEmail: 'samuel@harbor.dev', createdAt: ago(18) },
      ] },
  ];
}
