import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiFileText, FiPaperclip, FiSend, FiTrash2, FiUpload } from 'react-icons/fi';
import ShortcodeTextField from '../../../components/ShortcodeTextField';
import TextEditor from '../../../components/TextEditor';
import { Modal, cx } from '../../../components/ui';
import { useData } from '../../../context/DataContext';
import {
  ALLOWED_EXTENSIONS, EMAIL_MODES, MAX_FILE_SIZE, SENDERS, emptyEmailTemplate, formatSize, shortcutsForMode,
} from '../../../data/emailtemplates';

const LIST_PATH = '/firmtemp/templates/emails';
const clone = (o) => JSON.parse(JSON.stringify(o));

function Section({ title, icon, children }) {
  return (
    <section className="card p-5 sm:p-6">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">{icon}{title}</h2>
      <div className="flex flex-col gap-5">{children}</div>
    </section>
  );
}

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
    return <div role="alert" className="card border-danger-200 bg-danger-50 p-6 text-danger-700"><h2 className="text-lg font-bold">Email templates are not set up in DataContext.js</h2></div>;
  }
  if (editingId && !existing) {
    return (
      <div className="flex flex-col items-start gap-4">
        <h1 className="text-3xl font-bold">Email template not found</h1>
        <Link to={LIST_PATH} className="btn-primary">Back to email templates</Link>
      </div>
    );
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
      {/* Header */}
      <header className="flex flex-wrap items-center gap-4">
        <button onClick={handleCancel} aria-label="Back to email templates" className="flex h-10 w-10 items-center justify-center rounded border border-line-strong bg-surface hover:bg-subtle"><FiArrowLeft size={18} /></button>
        <div className="min-w-0 flex-1">
          <nav aria-label="Breadcrumb" className="text-sm text-muted">
            <Link to="/firmtemp/templates" className="hover:underline">Firm Templates</Link> / <Link to={LIST_PATH} className="hover:underline">Emails</Link>
          </nav>
          <h1 className="truncate text-2xl font-bold sm:text-3xl">{editingId ? 'Edit Email Template' : 'Create Email Template'}</h1>
          <p className="text-muted">Configure your email template settings</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {editingId && <button type="button" className="btn border border-danger-200 bg-surface text-danger-700 hover:bg-danger-50" onClick={() => setModal('delete')} disabled={saving}><FiTrash2 aria-hidden="true" /> Delete</button>}
          <button type="button" className="btn-secondary" onClick={handleCancel}>Cancel</button>
          <button type="button" className="btn border border-brand-600 bg-brand-50 text-brand-600 hover:bg-brand-100" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          <button type="button" className="btn-primary" onClick={handleSaveExit} disabled={saving}>{saving ? 'Saving…' : 'Save & Exit'}</button>
        </div>
      </header>

      {dirty && <div className="rounded-md border border-warning-300 bg-warning-50 px-4 py-2.5 text-sm font-semibold text-warning-700">You have unsaved changes.</div>}
      {Object.values(errors).some(Boolean) && <div role="alert" className="rounded-md bg-danger-50 px-4 py-3 font-semibold text-danger-700">Please fix the highlighted fields.</div>}

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-6">
          <Section title="Template Details" icon={<FiFileText aria-hidden="true" />}>
            <label className="field-label">
              <span>Template Name <span className="text-danger-700">*</span></span>
              <input className={cx('input', errors.templateName && 'border-danger-700')} value={form.templateName}
                onChange={(e) => set('templateName', e.target.value)} placeholder="Enter template name" />
              {errors.templateName && <span className="text-sm font-normal text-danger-700">{errors.templateName}</span>}
            </label>

            <fieldset>
              <legend className="mb-2 text-sm font-semibold">Mode</legend>
              <div role="radiogroup" className="flex flex-wrap gap-6">
                {EMAIL_MODES.map((m) => (
                  <label key={m.value} className="flex cursor-pointer items-center gap-2">
                    <input type="radio" name="mode" value={m.value} checked={form.mode === m.value} onChange={() => set('mode', m.value)} className="h-[18px] w-[18px] accent-brand-600" />
                    <span>{m.label}</span>
                  </label>
                ))}
              </div>
              <p className="mt-2 text-sm text-muted">The Subject and Email Body shortcode menus show {form.mode === 'account' ? 'account and date' : 'account, contact and date'} shortcodes.</p>
            </fieldset>
          </Section>

          <Section title="Sender & Subject" icon={<FiSend aria-hidden="true" />}>
            <label className="field-label">
              <span>From <span className="text-danger-700">*</span></span>
              <select className={cx('input', errors.selectedUser && 'border-danger-700')} value={form.selectedUser?.value || ''}
                onChange={(e) => set('selectedUser', SENDERS.find((u) => u.value === e.target.value) || null)}>
                <option value="">Select sender</option>
                {SENDERS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
              </select>
              {errors.selectedUser && <span className="text-sm font-normal text-danger-700">{errors.selectedUser}</span>}
            </label>

            <ShortcodeTextField label="Subject" required value={form.subject} onChange={(v) => set('subject', v)}
              placeholder="Enter email subject" shortcuts={shortcuts} error={errors.subject} />
          </Section>

          <Section title="Email Body">
            <TextEditor ariaLabel="Email body" value={form.emailBody} onChange={(html) => set('emailBody', html)}
              shortcuts={shortcuts} placeholder="Write your email…" minHeight={240} />
          </Section>
        </div>

        {/* RIGHT COLUMN - Attachments */}
        <aside className="flex flex-col gap-6 xl:sticky xl:top-24">
          <Section title="Attachments" icon={<FiPaperclip aria-hidden="true" />}>
            <div
              role="button" tabIndex={0} aria-label="Add attachments: drag and drop files or browse"
              onClick={() => fileInput.current?.click()}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.current?.click(); } }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
              className={cx('flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors',
                dragOver ? 'border-brand-600 bg-brand-50' : 'border-line-strong bg-subtle hover:border-brand-600/60 hover:bg-brand-50/60')}>
              <input ref={fileInput} type="file" multiple hidden data-testid="attachments-input"
                accept={ALLOWED_EXTENSIONS.map((e) => `.${e}`).join(',')}
                onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
              <FiUpload size={30} className="mb-3 text-muted" aria-hidden="true" />
              <p className="text-sm font-semibold">Drag & drop files here</p>
              <p className="mt-1 text-xs text-muted">or</p>
              <span className="btn-secondary mt-3 min-h-[36px] px-3 text-sm">Browse Files</span>
              <p className="mt-3 text-xs text-muted">20 MB file size limit. Supported: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG</p>
            </div>

            {fileErrors.length > 0 && (
              <ul role="alert" className="rounded-md bg-danger-50 px-3 py-2 text-sm text-danger-700">{fileErrors.map((m) => <li key={m}>{m}</li>)}</ul>
            )}

            {form.files.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <p className="text-sm font-semibold">Selected Files ({form.files.length})</p>
                {form.files.map((file, index) => (
                  <div key={file.id} className="flex items-center justify-between gap-2 rounded-md border border-line px-3 py-2">
                    <div className="flex min-w-0 items-center gap-2 text-sm">
                      <FiFileText className="flex-none text-muted" aria-hidden="true" />
                      <span className="truncate">{file.name}</span>
                      <span className="flex-none text-xs text-muted">({formatSize(file.size)})</span>
                    </div>
                    <button type="button" onClick={() => removeFile(index)} aria-label={`Remove ${file.name}`}
                      className="flex-none rounded p-1.5 text-muted hover:bg-danger-50 hover:text-danger-700"><FiTrash2 aria-hidden="true" /></button>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </aside>
      </div>

      {modal === 'discard' && (
        <Modal title="Discard changes?" onClose={() => setModal(null)}
          footer={<><button className="btn-secondary" onClick={() => setModal(null)}>Keep editing</button><button className="btn bg-danger-700 text-white hover:bg-[#831E15]" onClick={() => navigate(LIST_PATH)}>Discard</button></>}>
          <p className="text-muted">Your changes to this email template haven't been saved.</p>
        </Modal>
      )}
      {modal === 'delete' && (
        <Modal title={`Delete “${existing?.templateName}”?`} onClose={() => setModal(null)}
          footer={<><button className="btn-secondary" onClick={() => setModal(null)}>Cancel</button><button className="btn bg-danger-700 text-white hover:bg-[#831E15]" onClick={() => { deleteEmailTemplates([editingId]); navigate(LIST_PATH, { state: { toast: `Deleted “${existing.templateName}”` } }); }}>Delete</button></>}>
          <p className="text-muted">Emails already sent from this template are not affected.</p>
        </Modal>
      )}
      {toast && <div role="status" className="fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-md bg-ink px-5 py-3 font-semibold text-white">{toast}</div>}
    </div>
  );
}