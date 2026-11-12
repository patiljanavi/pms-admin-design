import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Archive, ArchiveRestore, Lock, NotebookPen, Pencil, Pin, PinOff, Plus, ScrollText, ShieldAlert, Trash2 } from 'lucide-react';
import NoteDrawer from '../../components/notes/NoteDrawer';
import TextEditor from '../../components/TextEditor';
import { Avatar, Modal, Segmented, initials } from '../../components/ui';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { SimpleTooltip } from '../../components/ui/tooltip';
import { EmptyState } from '../../components/page';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { demoNotes, fmtNoteTime, normalizeNote, noteId, sortNotes } from '../../data/accountNotes';
import { ToastBridge } from '../../components/ui/sonner';
import { cn } from 'lib/utils';

const htmlEmpty = (html) => !String(html || '').replace(/<(?!img)[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();

/** Segmented label with a count pill. */
const withCount = (text, n) => <>{text}<span className="text-xs tabular-nums text-muted-foreground">{n}</span></>;

/** Small icon button with a tooltip (pin, archive …). */
function IconAction({ label, onClick, children, pressed, className }) {
  return (
    <SimpleTooltip label={label}>
      <Button type="button" variant="ghost" size="icon-sm" onClick={onClick} aria-label={label} aria-pressed={pressed}
        className={cn('text-muted-foreground hover:text-foreground', className)}>{children}</Button>
    </SimpleTooltip>
  );
}

/**
 * Account Notes tab: Notes / Reviewer Notes · Active / Archived.
 * Standard notes: pin, archive, edit, restore, delete. Reviewer notes: a heading + an append-only log (permanent).
 * Descriptions use the TextEditor with images (stored inside the note).
 */
export default function AccountNotes() {
  const { account } = useOutletContext();
  const { setAccounts } = useData();
  const { user } = useAuth() || {};
  const me = user?.name || user?.username || 'You';
  const myEmail = user?.email || '';

  const [view, setView] = useState('active');
  const [noteTab, setNoteTab] = useState('standard');
  const [drawer, setDrawer] = useState(null);                  // { mode: 'create' } | { mode: 'edit', note }
  const [confirm, setConfirm] = useState(null);                // { title, description, confirmText, danger, onConfirm }
  const [logComposerNoteId, setLogComposerNoteId] = useState(null);
  const [logText, setLogText] = useState('');
  const [toast, setToast] = useState('');
  const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 2400); };

  const notes = useMemo(() => sortNotes((account.notes ?? demoNotes(account)).map(normalizeNote)), [account]);
  const saveNotes = (fn) => setAccounts((list) => list.map((a) => (a.id === account.id ? { ...a, notes: fn((a.notes ?? demoNotes(a)).map(normalizeNote)) } : a)));
  const update = (id, changes) => saveNotes((list) => list.map((n) => (n.id === id ? { ...n, ...changes } : n)));

  const isReviewerTab = noteTab === 'reviewer';
  const filtered = notes.filter((n) => n.noteType === noteTab && (view === 'active' ? !n.archived : n.archived));
  const count = (type, archived) => notes.filter((n) => n.noteType === type && n.archived === archived).length;

  /* ---------- create / update ---------- */
  const saveNote = ({ title, text }) => {
    const now = new Date().toISOString();
    if (drawer.mode === 'edit') {
      update(drawer.note.id, { title, text });
      setDrawer(null); notify('Note updated');
      return;
    }
    const create = (noteType) => {
      const rec = { id: noteId(), title, text: noteType === 'reviewer' ? '' : text, createdBy: me, createdAt: now, archived: false, pinned: false, noteType,
        logs: noteType === 'reviewer' && !htmlEmpty(text) ? [{ id: noteId('log'), text, createdBy: me, createdByEmail: myEmail, createdAt: now }] : [] };
      saveNotes((list) => [rec, ...list]);
      setDrawer(null); setConfirm(null); notify('Note created');
    };
    // Creating a reviewer note is irreversible, so confirm first
    if (isReviewerTab) {
      setConfirm({ title: 'Save reviewer note?', description: 'Reviewer notes are a permanent record. Once saved, this note cannot be edited or deleted — you can only add further entries.', confirmText: 'Save permanently', onConfirm: () => create('reviewer') });
      return;
    }
    create('standard');
  };

  /* ---------- reviewer log ---------- */
  const appendLog = (note) => {
    if (htmlEmpty(logText)) return;
    setConfirm({
      title: 'Add log entry?',
      description: 'This entry becomes part of a permanent record. Once added it cannot be edited or removed — you can only add further entries.',
      confirmText: 'Add permanently',
      onConfirm: () => {
        update(note.id, { logs: [...note.logs, { id: noteId('log'), text: logText, createdBy: me, createdByEmail: myEmail, createdAt: new Date().toISOString() }] });
        setLogComposerNoteId(null); setLogText(''); setConfirm(null); notify('Log added');
      },
    });
  };

  const emptyTitle = view === 'archived' ? `No archived ${isReviewerTab ? 'reviewer notes' : 'notes'}` : isReviewerTab ? 'No reviewer notes yet' : 'No notes yet';
  const emptyText = view === 'archived' ? 'Archived notes are kept here, out of the active list.'
    : isReviewerTab ? 'Use New note to name a piece of work — “June Tax return” — then add entries to its log with +.' : 'Capture calls, decisions and context for your team. Only your firm can see notes.';

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <Segmented label="Note type" value={noteTab} onChange={(v) => { setNoteTab(v); setLogComposerNoteId(null); }}
          options={[{ value: 'standard', label: withCount('Notes', count('standard', false)) }, { value: 'reviewer', label: withCount('Reviewer notes', count('reviewer', false)) }]} />
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Segmented label="Note status" size="sm" value={view} onChange={setView} options={[{ value: 'active', label: 'Active' }, { value: 'archived', label: 'Archived' }]} />
          <Button onClick={() => setDrawer({ mode: 'create' })}><Plus />New note</Button>
        </div>
      </div>

      {isReviewerTab && (
        <Alert variant="warning" role="note">
          <ShieldAlert aria-hidden="true" />
          <AlertTitle>Reviewer notes are permanent</AlertTitle>
          <AlertDescription>
            A reviewer note is a heading — “June Tax return” — with a log underneath it. Use + to add an entry; each one is stamped with who wrote it and when, and becomes a permanent record that cannot be edited or removed. Archiving files a note out of the active list without changing anything it holds.
          </AlertDescription>
        </Alert>
      )}

      {filtered.length === 0 && (
        <div className="rounded-xl border border-dashed bg-card">
          <EmptyState icon={isReviewerTab ? ScrollText : NotebookPen} title={emptyTitle} description={emptyText}
            action={view === 'active' && <Button variant="outline" onClick={() => setDrawer({ mode: 'create' })}><Plus />New note</Button>} />
        </div>
      )}

      <ul aria-label={isReviewerTab ? 'Reviewer notes' : 'Notes'} className="flex flex-col gap-3">
        {filtered.map((note) => (
          <li key={note.id}>
            <article aria-label={note.title}
              className={cn('group relative overflow-hidden rounded-xl border bg-card shadow-card transition-[box-shadow,border-color] hover:border-line-strong hover:shadow-raised',
                note.pinned && 'border-warning-300')}>
              {note.pinned && <span className="absolute inset-y-0 left-0 w-0.5 bg-warning-500" aria-hidden="true" />}

              <div className="px-5 pb-4 pt-4">
                {/* header */}
                <div className="flex items-center gap-2.5">
                  <Avatar text={initials(note.createdBy)} size="sm" />
                  <div className="min-w-0 flex-1 text-xs">
                    <div className="truncate font-medium text-foreground">{note.createdBy}</div>
                    <div className="text-muted-foreground">{fmtNoteTime(note.createdAt)}</div>
                  </div>
                  {note.pinned && <Badge variant="warning"><Pin />Pinned</Badge>}
                  {note.noteType === 'reviewer' && <Badge variant="neutral"><Lock />Permanent</Badge>}
                </div>

                {/* body */}
                <div className="mt-3">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-md font-semibold leading-snug">{note.title}</h3>
                    {note.noteType === 'reviewer' && view === 'active' && (
                      <SimpleTooltip label="Add a log entry">
                        <Button type="button" variant={logComposerNoteId === note.id ? 'secondary' : 'outline'} size="icon-sm" aria-label={`Add a log entry to ${note.title}`} aria-expanded={logComposerNoteId === note.id}
                          onClick={() => { setLogComposerNoteId(logComposerNoteId === note.id ? null : note.id); setLogText(''); }}>
                          <Plus />
                        </Button>
                      </SimpleTooltip>
                    )}
                  </div>

                  {note.noteType === 'reviewer' ? (
                    <>
                      <ol aria-label={`${note.title} log`} className="ml-1.5 mt-4 flex flex-col gap-4 border-l pl-5">
                        {note.logs.map((log, i) => (
                          <li key={log.id} className="relative">
                            <span className="absolute -left-[25px] top-1 size-2.5 rounded-full border-2 border-card bg-line-strong ring-1 ring-border" aria-hidden="true" />
                            <div className="flex flex-wrap items-baseline gap-x-2 text-xs text-muted-foreground">
                              <span className="font-medium text-foreground">Log {i + 1}</span>
                              <span>{log.createdByEmail ? `${log.createdBy} (${log.createdByEmail})` : log.createdBy}</span>
                              <span aria-hidden="true">·</span>
                              <span>{fmtNoteTime(log.createdAt)}</span>
                            </div>
                            {/* note HTML comes from this app's own editor */}
                            <div className="te-content mt-1 text-sm [&_a]:text-primary [&_a]:underline [&_img]:rounded-md [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5" dangerouslySetInnerHTML={{ __html: log.text || '<p>No description</p>' }} />
                          </li>
                        ))}
                        {!note.logs.length && <li className="text-sm italic text-muted-foreground">No entries yet.</li>}
                      </ol>
                      {logComposerNoteId === note.id && (
                        <div className="mt-4 rounded-lg border bg-subtle p-4">
                          <span className="text-sm font-medium">New log entry</span>
                          <div className="mt-2"><TextEditor ariaLabel="New log entry" value={logText} onChange={setLogText} allowImages minHeight={110} placeholder="What happened?" /></div>
                          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground"><Lock className="size-3" aria-hidden="true" />Added as you, with the current time. Permanent once saved.</p>
                          <div className="mt-3 flex justify-end gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => { setLogComposerNoteId(null); setLogText(''); }}>Cancel</Button>
                            <Button type="button" size="sm" disabled={htmlEmpty(logText)} onClick={() => appendLog(note)}>Add log</Button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="te-content mt-1.5 text-sm text-foreground/90 [&_a]:text-primary [&_a]:underline [&_img]:rounded-md [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5" dangerouslySetInnerHTML={{ __html: note.text || '<p>No description</p>' }} />
                  )}
                </div>
              </div>

              {/* footer: actions */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t bg-subtle/60 px-3 py-1.5">
                <div className="flex flex-wrap items-center gap-1">
                  {note.noteType === 'reviewer' ? (
                    view === 'active'
                      ? <IconAction label="Archive" onClick={() => { update(note.id, { archived: true }); notify('Note archived'); }}><Archive /></IconAction>
                      : <Button type="button" variant="ghost" size="sm" onClick={() => { update(note.id, { archived: false }); notify('Note restored'); }}><ArchiveRestore />Restore</Button>
                  ) : view === 'active' ? (
                    <>
                      <IconAction label={note.pinned ? 'Unpin' : 'Pin'} pressed={note.pinned} onClick={() => update(note.id, { pinned: !note.pinned })}
                        className={note.pinned ? 'text-warning-700 hover:text-warning-700' : undefined}>
                        {note.pinned ? <PinOff /> : <Pin />}
                      </IconAction>
                      <IconAction label="Archive" onClick={() => { update(note.id, { archived: true, pinned: false }); notify('Note archived'); }}><Archive /></IconAction>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setDrawer({ mode: 'edit', note })}><Pencil />Edit</Button>
                    </>
                  ) : (
                    <>
                      <Button type="button" variant="ghost" size="sm" onClick={() => { update(note.id, { archived: false }); notify('Note restored'); }}><ArchiveRestore />Restore</Button>
                      <Button type="button" variant="ghost" size="sm" className="text-danger-700 hover:bg-danger-50 hover:text-danger-700"
                        onClick={() => setConfirm({ title: 'Delete note?', description: 'This action cannot be undone.', confirmText: 'Delete note', danger: true,
                          onConfirm: () => { saveNotes((list) => list.filter((n) => n.id !== note.id)); setConfirm(null); notify('Note deleted'); } })}>
                        <Trash2 />Delete
                      </Button>
                    </>
                  )}
                </div>
                <Badge variant={view === 'active' ? 'success' : 'neutral'} dot className="mr-1.5">{view === 'active' ? 'Active' : 'Archived'}</Badge>
              </div>
            </article>
          </li>
        ))}
      </ul>

      {drawer && <NoteDrawer mode={drawer.mode} reviewer={isReviewerTab} note={drawer.note} onClose={() => setDrawer(null)} onSave={saveNote} />}
      {confirm && (
        <Modal title={confirm.title} description={confirm.description} onClose={() => setConfirm(null)}
          footer={<><Button variant="outline" onClick={() => setConfirm(null)}>Cancel</Button>
            <Button variant={confirm.danger ? 'destructive' : 'default'} onClick={confirm.onConfirm}>{confirm.danger ? <Trash2 /> : <Lock />}{confirm.confirmText || 'Confirm'}</Button></>}>
          <p className="text-sm text-muted-foreground">{confirm.danger ? 'The note and everything in it will be removed for your whole team.' : 'Double-check the text — you won’t be able to change it later.'}</p>
        </Modal>
      )}
      <ToastBridge message={toast} />
    </div>
  );
}
