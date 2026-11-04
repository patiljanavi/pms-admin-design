import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { FiAlertTriangle, FiArchive, FiEdit3, FiLock, FiPlus, FiRotateCcw, FiTrash2 } from 'react-icons/fi';
import { BsPinAngle, BsPinAngleFill } from 'react-icons/bs';
import NoteDrawer from '../../components/notes/NoteDrawer';
import TextEditor from '../../components/TextEditor';
import { Modal, cx } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { demoNotes, fmtNoteTime, normalizeNote, noteId, sortNotes } from '../../data/accountNotes';

const htmlEmpty = (html) => !String(html || '').replace(/<(?!img)[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();

function Segmented({ label, value, options, onChange }) {
  return (
    <div role="tablist" aria-label={label} className="flex w-fit gap-1 rounded-xl border border-line bg-subtle/60 p-1 shadow-card">
      {options.map(([key, text]) => (
        <button key={key} type="button" role="tab" aria-selected={value === key} onClick={() => onChange(key)}
          className={cx('rounded-lg px-4 py-1.5 text-sm font-semibold', value === key ? 'bg-brand-600 text-white shadow-card' : 'text-muted hover:text-ink')}>{text}</button>
      ))}
    </div>
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

  return (
    <div className="flex flex-col gap-4">
      <Segmented label="Note type" value={noteTab} onChange={(v) => { setNoteTab(v); setLogComposerNoteId(null); }}
        options={[['standard', `Notes (${count('standard', false)})`], ['reviewer', `Reviewer Notes (${count('reviewer', false)})`]]} />

      {isReviewerTab && (
        <div className="flex items-start gap-2 rounded-lg border border-warning-300 bg-warning-50 px-4 py-3 text-sm text-warning-700">
          <FiAlertTriangle className="mt-0.5 flex-none" aria-hidden="true" />
          <span>A reviewer note is a heading — “June Tax return” — with a log underneath it. Use + to add an entry; each one is stamped with who wrote it and when, and becomes a permanent record that cannot be edited or removed. Archiving files a note out of the active list without changing anything it holds.</span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented label="Note status" value={view} onChange={setView} options={[['active', 'Active'], ['archived', 'Archived']]} />
        <button type="button" className="btn-primary" onClick={() => setDrawer({ mode: 'create' })}><FiPlus aria-hidden="true" /> New Note</button>
      </div>

      {filtered.length === 0 && (
        <div className="rounded-lg border border-dashed border-line-strong bg-subtle/40 px-6 py-10 text-center">
          <p className="text-sm font-semibold">{view === 'archived' ? `No archived ${isReviewerTab ? 'reviewer notes' : 'notes'} yet.` : isReviewerTab ? 'No reviewer notes yet.' : 'No notes yet.'}</p>
          {view === 'active' && <p className="mt-1 text-xs text-muted">{isReviewerTab ? 'Use New Note to name a piece of work — “June Tax return” — then add entries to its log with +.' : 'Use New Note to add one.'}</p>}
        </div>
      )}

      <ul aria-label={isReviewerTab ? 'Reviewer notes' : 'Notes'} className="flex flex-col gap-4">
        {filtered.map((note) => (
          <li key={note.id}>
            <article aria-label={note.title} className={cx('relative overflow-hidden rounded-lg border bg-surface p-5 shadow-card transition-shadow hover:shadow-pop', note.pinned ? 'border-warning-300' : 'border-line')}>
              {note.pinned && <span className="absolute inset-y-0 left-0 w-1 bg-warning-700" aria-hidden="true" />}

              {/* header */}
              <div className="flex items-start justify-between gap-4 text-xs text-muted">
                <div><div className="font-semibold text-ink/70">{note.createdBy}</div><div>{fmtNoteTime(note.createdAt)}</div></div>
                {note.pinned && <span className="flex items-center gap-1 font-semibold text-warning-700"><BsPinAngleFill aria-hidden="true" /> Pinned</span>}
              </div>

              {/* body */}
              <div className="mt-3">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-semibold">{note.title}</h3>
                  {note.noteType === 'reviewer' && view === 'active' && (
                    <button type="button" title="Add a log entry" aria-label={`Add a log entry to ${note.title}`} aria-expanded={logComposerNoteId === note.id}
                      onClick={() => { setLogComposerNoteId(logComposerNoteId === note.id ? null : note.id); setLogText(''); }}
                      className="btn-secondary min-h-[34px] flex-none px-2.5"><FiPlus aria-hidden="true" /></button>
                  )}
                </div>

                {note.noteType === 'reviewer' ? (
                  <>
                    <ol aria-label={`${note.title} log`} className="mt-4 flex flex-col gap-3 border-l border-line pl-4">
                      {note.logs.map((log, i) => (
                        <li key={log.id} className="relative">
                          <span className="absolute -left-[21px] top-2 h-2 w-2 rounded-full bg-line-strong" aria-hidden="true" />
                          <div className="flex flex-wrap items-baseline gap-x-2 text-xs text-muted">
                            <span className="font-semibold text-ink/70">Log {i + 1}</span>
                            <span>{log.createdByEmail ? `${log.createdBy} (${log.createdByEmail})` : log.createdBy}</span>
                            <span>{fmtNoteTime(log.createdAt)}</span>
                          </div>
                          {/* note HTML comes from this app's own editor */}
                          <div className="te-content mt-1 text-sm" dangerouslySetInnerHTML={{ __html: log.text || '<p>No description</p>' }} />
                        </li>
                      ))}
                      {!note.logs.length && <li className="text-sm italic text-muted">No entries yet.</li>}
                    </ol>
                    {logComposerNoteId === note.id && (
                      <div className="mt-4 rounded-lg border border-line bg-subtle/50 p-4">
                        <span className="text-xs font-semibold">New log entry</span>
                        <div className="mt-2"><TextEditor ariaLabel="New log entry" value={logText} onChange={setLogText} allowImages minHeight={110} placeholder="What happened?" /></div>
                        <p className="mt-2 text-xs text-muted">Added as you, with the current time. Permanent once saved.</p>
                        <div className="mt-3 flex justify-end gap-2">
                          <button type="button" className="btn-secondary min-h-[36px] text-sm" onClick={() => { setLogComposerNoteId(null); setLogText(''); }}>Cancel</button>
                          <button type="button" className="btn-primary min-h-[36px] text-sm" disabled={htmlEmpty(logText)} onClick={() => appendLog(note)}>Add log</button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="te-content mt-2 text-sm" dangerouslySetInnerHTML={{ __html: note.text || '<p>No description</p>' }} />
                )}
              </div>

              {/* footer: actions */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line-soft pt-3">
                <div className="flex flex-wrap items-center gap-1">
                  {note.noteType === 'reviewer' ? (
                    <>
                      <span className="mr-2 flex items-center gap-1.5 text-xs text-muted"><FiLock aria-hidden="true" /> Permanent record</span>
                      {view === 'active'
                        ? <button type="button" onClick={() => { update(note.id, { archived: true }); notify('Note archived'); }} aria-label={`Archive ${note.title}`} title="Archive" className="flex h-9 w-9 items-center justify-center rounded text-muted hover:bg-subtle"><FiArchive aria-hidden="true" /></button>
                        : <button type="button" onClick={() => { update(note.id, { archived: false }); notify('Note restored'); }} className="btn-secondary min-h-[34px] text-sm"><FiRotateCcw aria-hidden="true" /> Restore</button>}
                    </>
                  ) : view === 'active' ? (
                    <>
                      <button type="button" onClick={() => update(note.id, { pinned: !note.pinned })} aria-pressed={note.pinned} aria-label={note.pinned ? `Unpin ${note.title}` : `Pin ${note.title}`} title={note.pinned ? 'Unpin' : 'Pin'}
                        className={cx('flex h-9 w-9 items-center justify-center rounded hover:bg-subtle', note.pinned ? 'text-warning-700' : 'text-muted')}>{note.pinned ? <BsPinAngleFill aria-hidden="true" /> : <BsPinAngle aria-hidden="true" />}</button>
                      <button type="button" onClick={() => { update(note.id, { archived: true, pinned: false }); notify('Note archived'); }} aria-label={`Archive ${note.title}`} title="Archive" className="flex h-9 w-9 items-center justify-center rounded text-muted hover:bg-subtle"><FiArchive aria-hidden="true" /></button>
                      <button type="button" onClick={() => setDrawer({ mode: 'edit', note })} className="btn-secondary min-h-[34px] text-sm"><FiEdit3 aria-hidden="true" /> Edit</button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={() => { update(note.id, { archived: false }); notify('Note restored'); }} className="btn-secondary min-h-[34px] text-sm"><FiRotateCcw aria-hidden="true" /> Restore</button>
                      <button type="button" onClick={() => setConfirm({ title: 'Delete Note', description: 'This action cannot be undone.', confirmText: 'Delete', danger: true,
                        onConfirm: () => { saveNotes((list) => list.filter((n) => n.id !== note.id)); setConfirm(null); notify('Note deleted'); } })}
                        className="btn min-h-[34px] text-sm text-danger-700 hover:bg-danger-50"><FiTrash2 aria-hidden="true" /> Delete</button>
                    </>
                  )}
                </div>
                <span className="rounded-full border border-line bg-subtle px-3 py-0.5 text-xs font-semibold text-muted">{view === 'active' ? 'Active' : 'Archived'}</span>
              </div>
            </article>
          </li>
        ))}
      </ul>

      {drawer && <NoteDrawer mode={drawer.mode} reviewer={isReviewerTab} note={drawer.note} onClose={() => setDrawer(null)} onSave={saveNote} />}
      {confirm && (
        <Modal title={confirm.title} onClose={() => setConfirm(null)}
          footer={<><button className="btn-secondary" onClick={() => setConfirm(null)}>Cancel</button>
            <button className={confirm.danger ? 'btn bg-danger-700 text-white hover:bg-[#831E15]' : 'btn-primary'} onClick={confirm.onConfirm}>{confirm.confirmText || 'Confirm'}</button></>}>
          <p className="text-muted">{confirm.description}</p>
        </Modal>
      )}
      {toast && <div role="status" className="fixed left-1/2 top-6 z-[60] -translate-x-1/2 rounded-md bg-ink px-5 py-3 font-semibold text-white">{toast}</div>}
    </div>
  );
}
