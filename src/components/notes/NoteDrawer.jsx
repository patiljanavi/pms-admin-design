import { useState } from 'react';
import { Lock, NotebookPen, Save } from 'lucide-react';
import TextEditor from '../TextEditor';
import { CloseButton, Drawer, Modal } from '../ui';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

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
  const bodyLabel = reviewer && mode === 'create' ? 'First log entry' : 'Description';
  const canSave = !!noteTitle.trim();

  return (
    <Drawer onClose={requestClose} label={title} width="max-w-[650px]">
      {/* Header */}
      <div className="flex flex-none items-start gap-3.5 border-b px-6 py-5">
        <span className="flex size-10 flex-none items-center justify-center rounded-xl border border-brand-100 bg-brand-50 text-brand-700" aria-hidden="true">
          <NotebookPen className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{help}</p>
        </div>
        <CloseButton onClick={requestClose} />
      </div>

      {/* Body */}
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
        {reviewer && mode === 'create' && (
          <div className="flex items-start gap-2.5 rounded-lg border border-warning-100 bg-warning-50 px-3.5 py-2.5 text-sm text-warning-700">
            <Lock className="mt-0.5 size-4 flex-none" aria-hidden="true" />
            <span>Reviewer notes are permanent once saved. Double-check before you save.</span>
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="note-title">Title<span className="ml-0.5 text-danger-700" aria-hidden="true">*</span></Label>
          <Input id="note-title" autoFocus value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)}
            placeholder={reviewer ? 'Name the work, e.g. “June Tax return”…' : 'Enter note title...'} />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">{bodyLabel}</span>
          <TextEditor ariaLabel={reviewer && mode === 'create' ? 'First log entry' : 'Note description'} value={noteText} onChange={setNoteText}
            allowImages placeholder="Write your note… add images with the image button, or paste / drop them" minHeight={200} />
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-none items-center justify-between gap-3 border-t bg-subtle px-6 py-3.5">
        <span className="text-xs text-muted-foreground">{!canSave ? 'Add a title to save' : dirty ? 'Unsaved changes' : ''}</span>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={requestClose}>Cancel</Button>
          <Button type="button" className="min-w-[120px]" disabled={!canSave} onClick={() => onSave({ title: noteTitle.trim(), text: noteText })}>
            <Save />{mode === 'edit' ? 'Update Note' : 'Save Note'}
          </Button>
        </div>
      </div>

      {confirmClose && (
        <Modal title="Discard changes?" description="Your note hasn't been saved. If you leave now, your changes will be lost." onClose={() => setConfirmClose(false)}
          footer={<><Button variant="outline" onClick={() => setConfirmClose(false)}>Keep editing</Button><Button variant="destructive" onClick={onClose}>Discard</Button></>}>
          <p className="text-sm text-muted-foreground">{noteTitle.trim() ? `“${noteTitle.trim()}” will not be saved.` : 'The draft will not be saved.'}</p>
        </Modal>
      )}
    </Drawer>
  );
}
