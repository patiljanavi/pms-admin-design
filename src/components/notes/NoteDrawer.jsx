import { useState } from 'react';
import { FiX } from 'react-icons/fi';
import TextEditor from '../TextEditor';
import { Drawer, Modal } from '../ui';

/**
 * Create / edit a note. Description uses the TextEditor with images (stored inside the note).
 * Props: mode ('create' | 'edit') · reviewer (creating a reviewer note) · note · onSave({ title, text }) · onClose()
 */
export default function NoteDrawer({ mode = 'create', reviewer = false, note = null, onSave, onClose }) {
  const [noteTitle, setNoteTitle] = useState(note?.title || '');
  const [noteText, setNoteText] = useState(note?.text || '');
  const [confirmClose, setConfirmClose] = useState(false);
  const dirty = noteTitle !== (note?.title || '') || noteText !== (note?.text || '');
  const requestClose = () => (dirty ? setConfirmClose(true) : onClose());

  const title = mode === 'edit' ? 'Edit Note' : reviewer ? 'Create Reviewer Note' : 'Create Note';
  const help = mode === 'edit' ? 'Update the title and description for this note.'
    : reviewer ? 'The title names the work; the entry below opens its log. Both are a permanent record — further entries can be added with +, but nothing can be edited or removed.'
      : 'Add a title and description for this note.';

  return (
    <Drawer onClose={requestClose} label={title} width="max-w-[650px]">
      <div className="flex items-start justify-between gap-3 border-b border-line bg-subtle/60 px-6 py-5">
        <div><h2 className="text-lg font-semibold">{title}</h2><p className="mt-1 text-sm text-muted">{help}</p></div>
        <button type="button" onClick={requestClose} aria-label="Close" className="flex h-9 w-9 flex-none items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-ink"><FiX /></button>
      </div>

      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-6">
        <div className="rounded-lg border border-line bg-surface p-5 shadow-card">
          <label className="field-label">Title
            <input autoFocus className="input" value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)}
              placeholder={reviewer ? 'Name the work, e.g. “June Tax return”…' : 'Enter note title...'} />
          </label>
        </div>
        <div className="rounded-lg border border-line bg-surface p-5 shadow-card">
          <span className="mb-1.5 block text-sm font-semibold">{reviewer && mode === 'create' ? 'First log entry' : 'Description'}</span>
          <TextEditor ariaLabel={reviewer && mode === 'create' ? 'First log entry' : 'Note description'} value={noteText} onChange={setNoteText}
            allowImages placeholder="Write your note… add images with the image button, or paste / drop them" minHeight={200} />
        </div>
      </div>

      <div className="sticky bottom-0 flex justify-end gap-3 border-t border-line bg-subtle px-6 py-4">
        <button type="button" className="btn-secondary" onClick={requestClose}>Cancel</button>
        <button type="button" className="btn-primary min-w-[120px]" disabled={!noteTitle.trim()} onClick={() => onSave({ title: noteTitle.trim(), text: noteText })}>
          {mode === 'edit' ? 'Update Note' : 'Save Note'}
        </button>
      </div>

      {confirmClose && (
        <Modal title="Discard changes?" onClose={() => setConfirmClose(false)}
          footer={<><button className="btn-secondary" onClick={() => setConfirmClose(false)}>Keep editing</button><button className="btn bg-danger-700 text-white hover:bg-[#831E15]" onClick={onClose}>Discard</button></>}>
          <p className="text-muted">Your note hasn't been saved.</p>
        </Modal>
      )}
    </Drawer>
  );
}
