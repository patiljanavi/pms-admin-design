import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  FiArrowLeft, FiBriefcase, FiCalendar, FiCheck, FiChevronDown, FiEye, FiFileText, FiMessageSquare, FiTrash2, FiUsers,
} from 'react-icons/fi';
import MultiSelect from '../../../components/MultiSelect';
import ShortcodeTextField from '../../../components/ShortcodeTextField';
import TextEditor from '../../../components/TextEditor';
import { Avatar, Modal, Toggle, cx, initials } from '../../../components/ui';
import { useData } from '../../../context/DataContext';
import { TEAM_MEMBERS } from '../../../data/sampleData';
import { accountShortcuts } from '../../../data/shortcodes';
import { DURATION_OPTIONS, PRIORITY_STYLE, TASK_PRIORITIES } from '../../../data/taskTemplates';
import { CLIENT_DESCRIPTION_LIMIT, emptyJobTemplate } from '../../../data/jobtemplates';

const LIST_PATH = '/firmtemp/templates/jobs';
const TEAM_OPTIONS = TEAM_MEMBERS.map((m) => ({ ...m, value: m.label }));
const LIMIT = CLIENT_DESCRIPTION_LIMIT || 250;
const clone = (o) => JSON.parse(JSON.stringify(o));
/** Works whether a field calls onChange(text) or onChange(event). */
const textOf = (v) => (v && typeof v === 'object' && v.target ? v.target.value : v ?? '');
const blank = (template) => ({ ...clone(emptyJobTemplate), clientDescription: '', comments: [], ...clone(template || {}) });

/**
 * Turns DataContext's client-facing statuses into dropdown options.
 * Works with clientFacingJobs ({ value, label, color, description }) and other shapes
 * ({ id, name, clientfacingColour, clientfacingDescription, … }).
 */
const pick = (obj, keys) => keys.map((k) => obj?.[k]).find((v) => v !== undefined && v !== null && v !== '');
export function statusOptionsFrom(list = []) {
  const options = (list || []).map((s) => ({
    id: pick(s, ['value', 'id', '_id']),
    name: pick(s, ['label', 'name', 'title']) || '',
    color: pick(s, ['color', 'colour', 'clientfacingColour', 'clientfacingColor']) || '#475569',
    description: String(pick(s, ['description', 'clientfacingDescription', 'clientFacingDescription', 'clientDescription', 'desc', 'message']) || ''),
    stage: s?.stage,
  }));
  return options.some((o) => o.stage != null) ? options.sort((a, b) => (a.stage ?? 999) - (b.stage ?? 999)) : options;
}

/* ---------- building blocks (same look as the task and email forms) ---------- */
function Section({ title, icon, children }) {
  return (
    <section className="card p-5 sm:p-6">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">{icon}{title}</h2>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}
function SwitchRow({ label, description, checked, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-md border border-line p-3.5">
      <div><div className="font-semibold">{label}</div>{description && <div className="text-sm text-muted">{description}</div>}</div>
      <Toggle label={label} checked={checked} onChange={onChange} />
    </div>
  );
}

/** Status dropdown that shows each client-facing status with its color dot. */
function StatusSelect({ value, onChange, statuses }) {
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  const current = statuses.find((s) => String(s.id) === String(value));
  useEffect(() => {
    const h = (e) => { if (!box.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div ref={box} className="relative">
      <span id="job-status-label" className="mb-1.5 block text-sm font-semibold">Status</span>
      <button type="button" aria-haspopup="listbox" aria-expanded={open} aria-labelledby="job-status-label" onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); } }}
        className="flex min-h-[44px] w-full items-center gap-2 rounded border border-line-strong bg-surface px-3 text-left focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/30">
        {current ? <><span className="h-3 w-3 flex-none rounded-full" style={{ backgroundColor: current.color }} />{current.name}</> : <span className="text-muted/70">Select client-facing status</span>}
        <FiChevronDown className="ml-auto text-muted" aria-hidden="true" />
      </button>
      {open && (
        <ul role="listbox" aria-label="Client-facing statuses" className="absolute left-0 right-0 z-40 mt-1 max-h-64 overflow-y-auto rounded-md border border-line bg-surface p-1 shadow-pop">
          {statuses.map((s) => (
            <li key={s.id} role="option" aria-selected={String(s.id) === String(value)} onClick={() => { onChange(s.id); setOpen(false); }}
              className={cx('flex cursor-pointer items-center gap-2 rounded px-3 py-2', String(s.id) === String(value) ? 'bg-brand-50' : 'hover:bg-subtle')}>
              <span className="h-3 w-3 flex-none rounded-full" style={{ backgroundColor: s.color }} />
              <span className="flex-1">{s.name}</span>
              {s.stage != null && <span className="text-xs text-muted">Stage {s.stage}</span>}
              {String(s.id) === String(value) && <FiCheck className="text-brand-600" aria-hidden="true" />}
            </li>
          ))}
          {statuses.length === 0 && <li className="px-3 py-2 text-sm text-muted">No client-facing statuses yet. Add them in the Client-facing Status tab.</li>}
        </ul>
      )}
    </div>
  );
}

/**
 * Create / edit a job template (same pattern as TaskTemplateForm and EmailTemplateForm).
 *   /firmtemp/templates/jobs/new          → create
 *   /firmtemp/templates/jobs/:templateId  → edit
 */
export default function JobTemplateForm() {
  const { templateId } = useParams();
  return <FormPage key={templateId || 'new'} editingId={templateId} />;
}

function FormPage({ editingId }) {
  const navigate = useNavigate();
  const { jobTemplates = [], saveJobTemplate, deleteJobTemplates, clientFacingJobs, clientStatuses } = useData();
  const existing = editingId ? jobTemplates.find((t) => String(t.id) === String(editingId)) : null;
  // Status options come from DataContext: clientFacingJobs (or clientStatuses in older setups)
  const statuses = statusOptionsFrom(clientFacingJobs ?? clientStatuses ?? []);

  const initial = useMemo(() => blank(existing), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [form, setForm] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [modal, setModal] = useState(null); // 'discard' | 'delete'
  const [toast, setToast] = useState('');
  const dirty = JSON.stringify(form) !== JSON.stringify(saved);
  const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 2600); };
  const set = (k, v) => { const value = textOf(v); setForm((f) => ({ ...f, [k]: value })); setErrors((e) => ({ ...e, [k]: undefined })); };

  useEffect(() => {
    if (!dirty) return undefined;
    const h = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  if (!saveJobTemplate) {
    return <div role="alert" className="card border-danger-200 bg-danger-50 p-6 text-danger-700"><h2 className="text-lg font-bold">Job templates are not set up in DataContext.js</h2></div>;
  }
  if (editingId && !existing) {
    return (
      <div className="flex flex-col items-start gap-4">
        <h1 className="text-3xl font-bold">Job template not found</h1>
        <Link to={LIST_PATH} className="btn-primary">Back to job templates</Link>
      </div>
    );
  }

  /* ---------- client-facing status → fills the Description ---------- */
  const statusOf = (id) => statuses.find((s) => String(s.id) === String(id));
  const pickStatus = (id) => {
    const next = statusOf(id);
    const prevText = (statusOf(form.selectedJob)?.description || '').trim();
    setErrors((e) => ({ ...e, selectedJob: undefined }));
    setForm((f) => {
      const current = (f.clientDescription || '').trim();
      // Fill when the field is empty or still holds the previous status's description (not edited by hand)
      const fill = next?.description && (!current || current === prevText);
      return { ...f, selectedJob: id, ...(fill ? { clientDescription: next.description.slice(0, LIMIT) } : {}) };
    });
    if (process.env.NODE_ENV !== 'production' && next && !next.description) {
      // eslint-disable-next-line no-console
      console.warn(`[JobTemplateForm] Client-facing status "${next.name}" has no description, so nothing was filled in.`);
    }
  };
  const selectedStatus = statusOf(form.selectedJob);
  const canUseStatusText = selectedStatus?.description && (form.clientDescription || '').trim() !== selectedStatus.description.trim();

  /* ---------- comments ---------- */
  const addCommentField = () => set('comments', [...form.comments, '']);
  const handleCommentChange = (i, v) => set('comments', form.comments.map((c, j) => (j === i ? v : c)));
  const deleteCommentField = (i) => set('comments', form.comments.filter((_, j) => j !== i));

  /* ---------- save ---------- */
  const validate = () => {
    const e = {};
    if (!form.templatename.trim()) e.templatename = 'Template name is required.';
    if (!form.jobName.trim()) e.jobName = 'Job name is required.';
    if (form.absoluteDate && form.startDate && form.dueDate && form.dueDate < form.startDate) e.dueDate = 'Due date must be on or after the start date.';
    if (form.clientFacingStatus && !form.selectedJob) e.selectedJob = 'Choose a status for the client portal.';
    setErrors(e);
    if (Object.keys(e).length) window.scrollTo?.({ top: 0, behavior: 'smooth' });
    return Object.keys(e).length === 0;
  };
  const persist = () => {
    const data = {
      ...form, id: editingId || undefined, templatename: form.templatename.trim(), jobName: form.jobName.trim(),
      startsin: Number(form.startsin) || 0, duein: Number(form.duein) || 0,
      comments: (form.comments || []).map((c) => String(c).trim()).filter(Boolean),
    };
    const id = saveJobTemplate(data);
    return { ...data, id };
  };
  const handleSave = () => {                         // Save (stay on the page)
    if (!validate()) return;
    setSubmitting(true);
    const data = persist();
    setForm(data); setSaved(data); setSubmitting(false);
    notify(`Saved “${data.templatename}”`);
    if (!editingId) navigate(`${LIST_PATH}/${data.id}`, { replace: true });
  };
  const handleSaveAndExit = () => {                  // Save & Exit
    if (!validate()) return;
    setSubmitting(true);
    const data = persist();
    navigate(LIST_PATH, { state: { toast: editingId ? `Saved “${data.templatename}”` : `Created “${data.templatename}”` } });
  };
  const handleCloseJobTemp = () => (dirty ? setModal('discard') : navigate(LIST_PATH));

  const relRow = (label, numKey, unitKey) => (
    <div className="grid grid-cols-[72px_1fr_130px] items-center gap-3">
      <span className="text-sm font-semibold">{label}</span>
      <input aria-label={label} className="input" type="number" min="0" value={form[numKey]} onChange={(e) => set(numKey, e.target.value)} />
      <select aria-label={`${label} unit`} className="input" value={form[unitKey]} onChange={(e) => set(unitKey, e.target.value)}>
        {DURATION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header (title + actions) */}
      <header className="flex flex-wrap items-center gap-4">
        <button onClick={handleCloseJobTemp} aria-label="Back to job templates" className="flex h-10 w-10 items-center justify-center rounded border border-line-strong bg-surface hover:bg-subtle"><FiArrowLeft size={18} /></button>
        <div className="min-w-0 flex-1">
          <nav aria-label="Breadcrumb" className="text-sm text-muted">
            <Link to="/firmtemp/templates" className="hover:underline">Firm Templates</Link> / <Link to={LIST_PATH} className="hover:underline">Jobs</Link>
          </nav>
          <h1 className="flex items-center gap-2 truncate text-2xl font-bold sm:text-3xl"><FiBriefcase className="text-brand-600" aria-hidden="true" />{editingId ? 'Edit Job Template' : 'Create Job Template'}</h1>
          <p className="text-muted">Configure your job template settings</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {editingId && <button type="button" className="btn border border-danger-200 bg-surface text-danger-700 hover:bg-danger-50" onClick={() => setModal('delete')} disabled={submitting}><FiTrash2 aria-hidden="true" /> Delete</button>}
          <button type="button" className="btn-secondary" onClick={handleCloseJobTemp} disabled={submitting}>Cancel</button>
          <button type="button" className="btn border border-brand-600 bg-brand-50 text-brand-600 hover:bg-brand-100" onClick={handleSave} disabled={submitting}>{submitting ? 'Saving…' : 'Save'}</button>
          <button type="button" className="btn-primary" onClick={handleSaveAndExit} disabled={submitting}>{submitting ? 'Saving…' : 'Save & Exit'}</button>
        </div>
      </header>

      {dirty && <div className="rounded-md border border-warning-300 bg-warning-50 px-4 py-2.5 text-sm font-semibold text-warning-700">You have unsaved changes.</div>}
      {Object.values(errors).some(Boolean) && <div role="alert" className="rounded-md bg-danger-50 px-4 py-3 font-semibold text-danger-700">Please fix the highlighted fields.</div>}

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-6">
          <Section title="General Information" icon={<FiFileText aria-hidden="true" />}>
            <label className="field-label">
              <span>Template Name <span className="text-danger-700">*</span></span>
              <input className={cx('input', errors.templatename && 'border-danger-700')} value={form.templatename} onChange={(e) => set('templatename', e.target.value)} placeholder="Template Name" />
              {errors.templatename && <span className="text-sm font-normal text-danger-700">{errors.templatename}</span>}
            </label>
            <ShortcodeTextField label="Job Name" required value={form.jobName} onChange={(v) => set('jobName', v)} placeholder="Job Name" shortcuts={accountShortcuts} error={errors.jobName} />
          </Section>

          <Section title="Assignment" icon={<FiUsers aria-hidden="true" />}>
            <MultiSelect label="Job Assignees" placeholder="Job Assignees" options={TEAM_OPTIONS} value={form.assignees} onChange={(v) => set('assignees', v)}
              renderOption={(o) => (
                <span className="flex flex-1 items-center gap-2.5"><Avatar text={initials(o.label)} size="sm" />
                  <span><span className="block font-semibold">{o.label}</span><span className="block text-sm text-muted">{o.meta}</span></span></span>
              )} />
            <div>
              <span className="mb-1.5 block text-sm font-semibold">Priority</span>
              <div role="radiogroup" aria-label="Priority" className="flex flex-wrap gap-1.5">
                {TASK_PRIORITIES.map((p) => (
                  <button key={p} type="button" role="radio" aria-checked={form.priority === p} onClick={() => set('priority', p)}
                    className={cx('min-h-[38px] rounded-full px-3.5 text-sm font-semibold ring-offset-2', PRIORITY_STYLE[p], form.priority === p ? 'ring-2 ring-brand-600' : 'opacity-70 hover:opacity-100')}>{p}</button>
                ))}
              </div>
            </div>
          </Section>

          <Section title="Description">
            <TextEditor ariaLabel="Job description" value={form.description} onChange={(html) => set('description', html)} shortcuts={accountShortcuts} placeholder="Describe the job…" minHeight={180} />
          </Section>

          <Section title="Start and Due Date" icon={<FiCalendar aria-hidden="true" />}>
            <SwitchRow label="Absolute Date" description="Set fixed calendar dates instead of relative offsets" checked={!!form.absoluteDate} onChange={(v) => set('absoluteDate', v)} />
            {form.absoluteDate ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="field-label">Start Date<input type="date" className="input" value={form.startDate || ''} onChange={(e) => set('startDate', e.target.value)} /></label>
                <label className="field-label">Due Date
                  <input type="date" className={cx('input', errors.dueDate && 'border-danger-700')} value={form.dueDate || ''} min={form.startDate || undefined} onChange={(e) => set('dueDate', e.target.value)} />
                  {errors.dueDate && <span className="text-sm font-normal text-danger-700">{errors.dueDate}</span>}
                </label>
              </div>
            ) : (
              <div className="flex flex-col gap-3">{relRow('Start In', 'startsin', 'startsInDuration')}{relRow('Due In', 'duein', 'dueinduration')}</div>
            )}
          </Section>
        </div>

        {/* RIGHT COLUMN */}
        <aside className="flex flex-col gap-6">
          <Section title="Client-Facing Status" icon={<FiEye aria-hidden="true" />}>
            <SwitchRow label="Show in Client Portal" description="Clients see this job and its status in their portal" checked={!!form.clientFacingStatus} onChange={(v) => set('clientFacingStatus', v)} />
            {form.clientFacingStatus && (
              <div className="flex flex-col gap-4">
                <ShortcodeTextField label="Job Name for Client" value={form.inputText} onChange={(v) => set('inputText', v)} placeholder="Job name for client" shortcuts={accountShortcuts} />
                <div>
                  <StatusSelect value={form.selectedJob} onChange={pickStatus} statuses={statuses} />
                  {errors.selectedJob && <span className="mt-1 block text-sm text-danger-700">{errors.selectedJob}</span>}
                </div>
                <div>
                  <ShortcodeTextField key={`desc-${form.selectedJob || 'none'}`} label="Description" value={form.clientDescription || ''} onChange={(v) => set('clientDescription', v)} placeholder="Description"
                    shortcuts={accountShortcuts} multiline rows={4} maxLength={LIMIT} />
                  {canUseStatusText && (
                    <button type="button" onClick={() => set('clientDescription', selectedStatus.description.slice(0, LIMIT))}
                      className="btn-link mt-1 inline-flex items-center gap-1.5 px-0 text-sm">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: selectedStatus.color }} aria-hidden="true" />
                      Use the “{selectedStatus.name}” description
                    </button>
                  )}
                </div>
              </div>
            )}
          </Section>

          <Section title="Comments" icon={<FiMessageSquare aria-hidden="true" />}>
            {form.comments.map((comment, index) => (
              <div key={index} className="flex items-start gap-2">
                <textarea className="input min-h-[64px] flex-1 py-2" rows={2} value={comment} onChange={(e) => handleCommentChange(index, e.target.value)}
                  placeholder={`Comment ${index + 1}`} aria-label={`Comment ${index + 1}`} />
                <button type="button" onClick={() => deleteCommentField(index)} aria-label={`Delete comment ${index + 1}`}
                  className="mt-1 rounded p-2 text-muted hover:bg-danger-50 hover:text-danger-700"><FiTrash2 aria-hidden="true" /></button>
              </div>
            ))}
            <button type="button" onClick={addCommentField} className="btn w-full border border-dashed border-line-strong bg-surface text-brand-600 hover:bg-subtle"><FiMessageSquare aria-hidden="true" /> Add Comment</button>
          </Section>
        </aside>
      </div>

      {modal === 'discard' && (
        <Modal title="Discard changes?" onClose={() => setModal(null)}
          footer={<><button className="btn-secondary" onClick={() => setModal(null)}>Keep editing</button><button className="btn bg-danger-700 text-white hover:bg-[#831E15]" onClick={() => navigate(LIST_PATH)}>Discard</button></>}>
          <p className="text-muted">Your changes to this job template haven't been saved.</p>
        </Modal>
      )}
      {modal === 'delete' && (
        <Modal title={`Delete “${saved.templatename}”?`} onClose={() => setModal(null)}
          footer={<><button className="btn-secondary" onClick={() => setModal(null)}>Cancel</button><button className="btn bg-danger-700 text-white hover:bg-[#831E15]" onClick={() => { deleteJobTemplates([editingId]); navigate(LIST_PATH, { state: { toast: `Deleted “${saved.templatename}”` } }); }}>Delete</button></>}>
          <p className="text-muted">Jobs already created from this template stay as they are.</p>
        </Modal>
      )}
      {toast && <div role="status" className="fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-md bg-ink px-5 py-3 font-semibold text-white">{toast}</div>}
    </div>
  );
}