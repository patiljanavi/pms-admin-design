import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlignLeft, Building2, Clock, Contact, FileText, Mail, Paperclip, Send, Upload, X } from 'lucide-react';
import { cn } from 'lib/utils';
import ShortcodeTextField from '../../../components/ShortcodeTextField';
import TextEditor from '../../../components/TextEditor';
import { Avatar, Modal, initials } from '../../../components/ui';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { useData } from '../../../context/DataContext';
import {
  ALLOWED_EXTENSIONS, EMAIL_MODES, MAX_FILE_SIZE, SENDERS, emptyEmailTemplate, formatSize, shortcutsForMode,
} from '../../../data/emailtemplates';
import { ToastBridge } from '../../../components/ui/sonner';
import {
  EditorActionBar, EditorHeader, EditorNotFound, ErrorSummary, Field, FormSection, fmtDate, invalidProps,
} from '../templateKit';

const LIST_PATH = '/firmtemp/templates/emails';
const clone = (o) => JSON.parse(JSON.stringify(o));
const MODE_ICON = { contacts: Contact, account: Building2 };
const MODE_HINT = { contacts: 'Account, contact and date shortcodes', account: 'Account and date shortcodes' };
const MODE_BADGE = { contacts: 'violet', account: 'info' };

/**
 * Create / edit an email template (same pattern as TaskTemplateForm).
 *   /firmtemp/templates/emails/new          → create
 *   /firmtemp/templates/emails/:templateId  → edit
 */
export default function EmailTemplateForm() {
  const { templateId } = useParams();
  return <FormPage key={templateId || 'new'} editingId={templateId} />;
}

function FormPage({ editingId }) {
  const navigate = useNavigate();
  const { emailTemplates = [], saveEmailTemplate, deleteEmailTemplates } = useData();
  const existing = editingId ? emailTemplates.find((t) => t.id === editingId) : null;

  const initial = useMemo(() => clone(existing || emptyEmailTemplate), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [form, setForm] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [errors, setErrors] = useState({});
  const [fileErrors, setFileErrors] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState(null); // 'discard' | 'delete'
  const [toast, setToast] = useState('');
  const fileInput = useRef(null);
  const dirty = JSON.stringify(form) !== JSON.stringify(saved);
  const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 2600); };

  // Shortcodes follow the selected mode (Contact / Account)
  const shortcuts = shortcutsForMode(form.mode);

  useEffect(() => {
    if (!dirty) return undefined;
    const h = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  if (!saveEmailTemplate) {
    return <div role="alert" className="rounded-xl border border-danger-100 bg-danger-50 p-6 text-danger-700"><h2 className="text-base font-semibold">Email templates are not set up in DataContext.js</h2></div>;
  }
  if (editingId && !existing) {
    return <EditorNotFound title="Email template not found" backTo={LIST_PATH} backLabel="Back to email templates" />;
  }

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })); };

  /* ---------- attachments ---------- */
  const addFiles = (list) => {
    const errs = [];
    const accepted = [];
    Array.from(list || []).forEach((file) => {
      const ext = file.name.split('.').pop().toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) errs.push(`${file.name}: file type not supported`);
      else if (file.size > MAX_FILE_SIZE) errs.push(`${file.name}: larger than 20 MB`);
      else accepted.push({ id: `f-${Date.now()}-${accepted.length}-${file.name}`, name: file.name, size: file.size, type: file.type });
    });
    setFileErrors(errs);
    if (accepted.length) set('files', [...form.files, ...accepted]);
  };
  const removeFile = (index) => set('files', form.files.filter((_, i) => i !== index));

  /* ---------- save ---------- */
  const validate = () => {
    const e = {};
    if (!form.templateName.trim()) e.templateName = 'Template name is required.';
    if (!form.selectedUser) e.selectedUser = 'Choose who the email is from.';
    if (!form.subject.trim()) e.subject = 'Subject is required.';
    setErrors(e);
    if (Object.keys(e).length) window.scrollTo({ top: 0, behavior: 'smooth' });
    return Object.keys(e).length === 0;
  };
  const persist = () => {
    const data = { ...form, templateName: form.templateName.trim(), subject: form.subject.trim() };
    const id = saveEmailTemplate(data);
    return { ...data, id };
  };
  const handleSave = () => {
    if (!validate()) return;
    setSaving(true);
    const data = persist();
    setForm(data); setSaved(data); setSaving(false);
    notify(`Saved “${data.templateName}”`);
    if (!editingId) navigate(`${LIST_PATH}/${data.id}`, { replace: true });
  };
  const handleSaveExit = () => {
    if (!validate()) return;
    setSaving(true);
    const data = persist();
    navigate(LIST_PATH, { state: { toast: editingId ? `Saved “${data.templateName}”` : `Created “${data.templateName}”` } });
  };
  const handleCancel = () => (dirty ? setModal('discard') : navigate(LIST_PATH));

  return (
    <div className="flex flex-col gap-6">
      <EditorHeader
        backLabel="Email templates" backAriaLabel="Back to email templates" onBack={handleCancel}
        icon={Mail}
        title={editingId ? 'Edit Email Template' : 'Create Email Template'}
        badges={<>
          <Badge variant={MODE_BADGE[form.mode] || 'neutral'} shape="pill">{EMAIL_MODES.find((m) => m.value === form.mode)?.label || form.mode}</Badge>
          {!editingId && <Badge variant="info" shape="pill">New</Badge>}
        </>}
        description="Configure your email template settings"
        meta={existing?.updatedAt ? <><Clock className="size-3.5" aria-hidden="true" />Last updated {fmtDate(existing.updatedAt)}</> : null}
      />

      <ErrorSummary show={Object.values(errors).some(Boolean)} />

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* LEFT COLUMN */}
        <div className="flex min-w-0 flex-col gap-6">
          <FormSection icon={FileText} title="Template details" description="Name the template and choose which shortcodes it can use.">
            <Field id="et-name" label="Template name" required error={errors.templateName}>
              <Input id="et-name" value={form.templateName} onChange={(e) => set('templateName', e.target.value)}
                placeholder="Enter template name" {...invalidProps('et-name', errors.templateName)} />
            </Field>

            <fieldset className="min-w-0">
              <legend className="mb-2 text-sm font-medium leading-none">Mode</legend>
              <div role="radiogroup" aria-label="Mode" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {EMAIL_MODES.map((m) => {
                  const on = form.mode === m.value;
                  const Icon = MODE_ICON[m.value] || Mail;
                  return (
                    <label key={m.value}
                      className={cn('flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 transition-colors focus-within:ring-2 focus-within:ring-ring/50',
                        on ? 'border-primary/50 bg-primary/[0.04] ring-1 ring-primary/30' : 'hover:border-line-strong hover:bg-accent/50')}>
                      <input type="radio" name="mode" value={m.value} checked={on} onChange={() => set('mode', m.value)} className="mt-0.5 size-4 flex-none accent-primary" />
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5 text-sm font-medium text-foreground"><Icon className="size-4 text-muted-foreground" aria-hidden="true" />{m.label}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">{MODE_HINT[m.value]}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">The Subject and Email Body shortcode menus show {form.mode === 'account' ? 'account and date' : 'account, contact and date'} shortcodes.</p>
            </fieldset>
          </FormSection>

          <FormSection icon={Send} title="Sender & subject" description="Who the email comes from and what recipients see in their inbox.">
            <Field id="et-from" label="From" required error={errors.selectedUser}>
              <Select value={form.selectedUser?.value || ''} onValueChange={(v) => set('selectedUser', SENDERS.find((u) => u.value === v) || null)}>
                <SelectTrigger id="et-from" className={cn(errors.selectedUser && 'border-destructive ring-[3px] ring-destructive/15')} {...invalidProps('et-from', errors.selectedUser)}>
                  <SelectValue placeholder="Select sender" />
                </SelectTrigger>
                <SelectContent>
                  {SENDERS.map((u) => (
                    <SelectItem key={u.value} value={u.value}>
                      <span className="flex items-center gap-2"><Avatar text={initials(u.label)} size="xs" />{u.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <ShortcodeTextField label="Subject" required value={form.subject} onChange={(v) => set('subject', v)}
              placeholder="Enter email subject" shortcuts={shortcuts} error={errors.subject} />
          </FormSection>

          <FormSection icon={AlignLeft} title="Email body" description="Use shortcodes to personalise each email.">
            <TextEditor ariaLabel="Email body" value={form.emailBody} onChange={(html) => set('emailBody', html)}
              shortcuts={shortcuts} placeholder="Write your email…" minHeight={240} />
          </FormSection>
        </div>

        {/* RIGHT COLUMN - Attachments */}
        <aside className="flex min-w-0 flex-col gap-6 xl:sticky xl:top-[calc(var(--app-header-h,0px)+4.5rem)]">
          <FormSection icon={Paperclip} title="Attachments" description="Sent with every email from this template."
            action={form.files.length ? <Badge variant="secondary" shape="pill" className="tabular-nums">{form.files.length}</Badge> : null}
            bodyClassName="gap-4">
            <div
              role="button" tabIndex={0} aria-label="Add attachments: drag and drop files or browse"
              onClick={() => fileInput.current?.click()}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.current?.click(); } }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
              className={cn('group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                dragOver ? 'border-primary bg-primary/5' : 'border-line-strong bg-subtle/60 hover:border-primary/50 hover:bg-primary/[0.03]')}>
              <input ref={fileInput} type="file" multiple hidden data-testid="attachments-input"
                accept={ALLOWED_EXTENSIONS.map((e) => `.${e}`).join(',')}
                onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
              <span className={cn('mb-3 flex size-10 items-center justify-center rounded-xl border bg-card shadow-card transition-colors', dragOver ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} aria-hidden="true">
                <Upload className="size-5" />
              </span>
              <p className="text-sm font-medium text-foreground">Drag & drop files here, or <span className="text-primary underline-offset-4 group-hover:underline">browse</span></p>
              <p className="mt-1.5 text-xs text-muted-foreground">20 MB file size limit. Supported: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG</p>
            </div>

            {fileErrors.length > 0 && (
              <ul role="alert" className="flex flex-col gap-1 rounded-lg border border-danger-100 bg-danger-50 px-3 py-2 text-xs font-medium text-danger-700">
                {fileErrors.map((m) => <li key={m}>{m}</li>)}
              </ul>
            )}

            {form.files.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Selected files ({form.files.length})</p>
                <ul className="flex flex-col gap-1.5">
                  {form.files.map((file, index) => (
                    <li key={file.id} className="group flex items-center gap-2.5 rounded-lg border bg-card px-2.5 py-2 shadow-xs transition-colors hover:border-line-strong">
                      <span className="flex size-8 flex-none items-center justify-center rounded-md bg-muted text-muted-foreground" aria-hidden="true"><FileText className="size-4" /></span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{file.name}</div>
                        <div className="text-xs text-muted-foreground">{formatSize(file.size)}</div>
                      </div>
                      <Button type="button" variant="ghost" size="icon-xs" onClick={() => removeFile(index)} aria-label={`Remove ${file.name}`}
                        className="text-muted-foreground hover:bg-danger-50 hover:text-danger-700"><X /></Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </FormSection>
        </aside>
      </div>

      <EditorActionBar isEdit={!!editingId} dirty={dirty} saving={saving}
        onDelete={() => setModal('delete')} onCancel={handleCancel} onSave={handleSave} onSaveExit={handleSaveExit} />

      {modal === 'discard' && (
        <Modal title="Discard changes?" description="Your changes to this email template haven't been saved." onClose={() => setModal(null)}
          footer={<><Button variant="outline" onClick={() => setModal(null)}>Keep editing</Button><Button variant="destructive" onClick={() => navigate(LIST_PATH)}>Discard</Button></>}>
          <p className="text-sm text-muted-foreground">If you leave now, everything you changed since the last save is lost.</p>
        </Modal>
      )}
      {modal === 'delete' && (
        <Modal title={`Delete “${existing?.templateName}”?`} description="Emails already sent from this template are not affected." onClose={() => setModal(null)}
          footer={<><Button variant="outline" onClick={() => setModal(null)}>Cancel</Button><Button variant="destructive" onClick={() => { deleteEmailTemplates([editingId]); navigate(LIST_PATH, { state: { toast: `Deleted “${existing.templateName}”` } }); }}>Delete</Button></>}>
          <p className="text-sm text-muted-foreground">This template is removed for everyone in your firm. This can't be undone.</p>
        </Modal>
      )}
      <ToastBridge message={toast} />
    </div>
  );
}
