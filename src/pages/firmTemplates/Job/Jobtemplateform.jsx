import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle, ArrowLeft, Briefcase, CalendarDays, CircleAlert, Eye, FileText, MessageSquare, Plus, SearchX, Trash2, Users,
} from 'lucide-react';
import MultiSelect from '../../../components/MultiSelect';
import ShortcodeTextField from '../../../components/ShortcodeTextField';
import TextEditor from '../../../components/TextEditor';
import { Avatar, Modal, Toggle, initials } from '../../../components/ui';
import { Alert, AlertTitle } from '../../../components/ui/alert';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Textarea } from '../../../components/ui/textarea';
import { SimpleTooltip } from '../../../components/ui/tooltip';
import { ToastBridge } from '../../../components/ui/sonner';
import { EmptyState, SectionHeading } from '../../../components/page';
import { useData } from '../../../context/DataContext';
// import { TEAM_MEMBERS } from '../../../data/sampleData';
import { accountShortcuts } from '../../../data/shortcodes';
import { DURATION_OPTIONS, TASK_PRIORITIES } from '../../../data/taskTemplates';
import { CLIENT_DESCRIPTION_LIMIT, emptyJobTemplate } from '../../../data/jobtemplates';
import { cn } from 'lib/utils';

const LIST_PATH = '/firmtemp/templates/jobs';
// const TEAM_OPTIONS = TEAM_MEMBERS.map((m) => ({ ...m, value: m.label }));
const LIMIT = CLIENT_DESCRIPTION_LIMIT || 250;
const clone = (o) => JSON.parse(JSON.stringify(o));
/** Works whether a field calls onChange(text) or onChange(event). */
const textOf = (v) => (v && typeof v === 'object' && v.target ? v.target.value : v ?? '');
const blank = (template) => ({ ...clone(emptyJobTemplate), clientDescription: '', comments: [], ...clone(template || {}) });
const PRIORITY_DOT = { Low: 'bg-muted-foreground/50', Medium: 'bg-brand-500', High: 'bg-warning-500', Urgent: 'bg-danger-500' };

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

/* ---------- building blocks ---------- */
/** Editor header: back link, title + status badge, description, secondary actions. */
function EditorHeader({ backLabel, backAria, onBack, icon: Icon, title, status, description, actions }) {
  return (
    <header className="flex flex-col gap-4">
      <button type="button" onClick={onBack} aria-label={backAria}
        className="group inline-flex w-fit items-center gap-1.5 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />{backLabel}
      </button>
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="flex min-w-0 items-start gap-3.5">
          {Icon && (
            <span className="mt-0.5 inline-flex size-10 flex-none items-center justify-center rounded-xl border border-brand-100 bg-brand-50 text-brand-700 [&_svg]:size-5" aria-hidden="true">
              <Icon />
            </span>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h1 className="page-title truncate">{title}</h1>
              {status}
            </div>
            {description && <p className="page-description">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}

/** Card with an icon + SectionHeading header and a padded body. */
function FormSection({ icon: Icon, title, description, action, children }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-start gap-3 border-b px-5 py-4">
        {Icon && (
          <span className="inline-flex size-8 flex-none items-center justify-center rounded-lg border bg-subtle text-muted-foreground [&_svg]:size-4" aria-hidden="true">
            <Icon />
          </span>
        )}
        <SectionHeading title={title} description={description} action={action} className="min-w-0 flex-1" />
      </div>
      <div className="flex flex-col gap-5 p-5">{children}</div>
    </Card>
  );
}

/** Label + control + inline error / hint. */
function Field({ id, label, required, error, hint, children, className }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && <Label htmlFor={id}>{label}{required && <span className="ml-0.5 text-danger-700" aria-hidden="true">*</span>}</Label>}
      {children}
      {error ? <FieldError id={id ? `${id}-error` : undefined}>{error}</FieldError> : hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
function FieldError({ id, children }) {
  return <p id={id} className="flex items-center gap-1 text-xs font-medium text-danger-700"><CircleAlert className="size-3.5 flex-none" aria-hidden="true" />{children}</p>;
}

function SwitchRow({ label, description, checked, onChange }) {
  return (
    <div className={cn('flex items-start justify-between gap-4 rounded-lg border p-3.5 transition-colors', checked ? 'border-primary/25 bg-primary/[0.03]' : 'bg-subtle/40')}>
      <div className="min-w-0">
        <div className="text-sm font-medium text-foreground">{label}</div>
        {description && <div className="mt-0.5 text-sm text-muted-foreground">{description}</div>}
      </div>
      <Toggle label={label} checked={checked} onChange={onChange} />
    </div>
  );
}

/** Sticky footer with the save actions; spans the full content width. */
function ActionBar({ dirty, isNew, children }) {
  return (
    <div className="sticky bottom-0 z-20 -mx-4 -mb-6 mt-6 border-t bg-card/85 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:-mb-8 lg:px-8">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-2">
        <span className={cn('mr-auto inline-flex items-center gap-2 text-sm', dirty ? 'font-medium text-warning-700' : 'text-muted-foreground')} aria-live="polite">
          <span className={cn('size-1.5 rounded-full', dirty ? 'bg-warning-500' : isNew ? 'bg-muted-foreground/50' : 'bg-success-500')} aria-hidden="true" />
          {dirty ? 'Unsaved changes' : isNew ? 'Not saved yet' : 'All changes saved'}
        </span>
        {children}
      </div>
    </div>
  );
}

/** Status dropdown that shows each client-facing status with its colour dot. */
function StatusSelect({ value, onChange, statuses, error }) {
  const current = statuses.find((s) => String(s.id) === String(value));
  return (
    <Field id="job-status" label="Status" error={error}>
      <Select value={current ? String(current.id) : ''}
        onValueChange={(v) => { const s = statuses.find((x) => String(x.id) === v); if (s) onChange(s.id); }}>
        <SelectTrigger id="job-status" aria-invalid={!!error} className={cn(error && 'border-destructive')}>
          <SelectValue placeholder="Select client-facing status" />
        </SelectTrigger>
        <SelectContent>
          {statuses.map((s) => (
            <SelectItem key={String(s.id)} value={String(s.id)}>
              <span className="flex items-center gap-2">
                <span className="size-2.5 flex-none rounded-full ring-1 ring-inset ring-foreground/10" style={{ backgroundColor: s.color }} aria-hidden="true" />
                <span className="truncate">{s.name}</span>
                {s.stage != null && <span className="text-xs text-muted-foreground">· Stage {s.stage}</span>}
              </span>
            </SelectItem>
          ))}
          {statuses.length === 0 && <p className="px-2 py-2 text-sm text-muted-foreground">No client-facing statuses yet. Add them in the Client-facing Status tab.</p>}
        </SelectContent>
      </Select>
    </Field>
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
  const { teamOptions: TEAM_MEMBERS = [] } = useData();   // the logged-in user first, then active team members
 const TEAM_OPTIONS = TEAM_MEMBERS.map((m) => ({ ...m, value: m.label }));
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
    return (
      <Alert variant="destructive"><AlertTriangle aria-hidden="true" /><AlertTitle>Job templates are not set up in DataContext.js</AlertTitle></Alert>
    );
  }
  if (editingId && !existing) {
    return (
      <div className="page max-w-[1200px]">
        <Card>
          <EmptyState icon={SearchX} title="Job template not found" description="It may have been deleted, or the link is out of date."
            action={<Button asChild><Link to={LIST_PATH}><ArrowLeft />Back to job templates</Link></Button>} />
        </Card>
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
  const descLength = (form.clientDescription || '').length;

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
  const errorCount = Object.values(errors).filter(Boolean).length;

  const relRow = (label, numKey, unitKey) => (
    <div className="grid grid-cols-[64px_minmax(0,1fr)_minmax(0,150px)] items-center gap-3">
      <Label htmlFor={`job-${numKey}`} className="text-muted-foreground">{label}</Label>
      <Input id={`job-${numKey}`} aria-label={label} type="number" min="0" className="tabular-nums" value={form[numKey]} onChange={(e) => set(numKey, e.target.value)} />
      <Select value={form[unitKey] ? String(form[unitKey]) : ''} onValueChange={(v) => set(unitKey, v)}>
        <SelectTrigger aria-label={`${label} unit`}><SelectValue placeholder="Unit" /></SelectTrigger>
        <SelectContent>
          {DURATION_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <>
      <div className="page max-w-[1200px]">
        <EditorHeader backLabel="Job templates" backAria="Back to job templates" onBack={handleCloseJobTemp} icon={Briefcase}
          title={editingId ? 'Edit Job Template' : 'Create Job Template'}
          status={!editingId ? <Badge variant="info" dot>New</Badge> : dirty ? <Badge variant="warning" dot>Edited</Badge> : <Badge variant="success" dot>Saved</Badge>}
          description="Configure your job template settings"
          actions={editingId && <Button variant="destructive-outline" onClick={() => setModal('delete')} disabled={submitting}><Trash2 />Delete</Button>} />

        {errorCount > 0 && (
          <Alert variant="destructive">
            <CircleAlert aria-hidden="true" />
            <AlertTitle>Please fix the highlighted fields.</AlertTitle>
          </Alert>
        )}

        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          {/* LEFT COLUMN */}
          <div className="flex min-w-0 flex-col gap-6">
            <FormSection title="General Information" description="How the template and the jobs it creates are named." icon={FileText}>
              <Field id="job-templatename" label="Template Name" required error={errors.templatename}>
                <Input id="job-templatename" value={form.templatename} onChange={(e) => set('templatename', e.target.value)} placeholder="Template Name"
                  aria-invalid={!!errors.templatename} aria-describedby={errors.templatename ? 'job-templatename-error' : undefined} />
              </Field>
              <ShortcodeTextField label="Job Name" required value={form.jobName} onChange={(v) => set('jobName', v)} placeholder="Job Name" shortcuts={accountShortcuts} error={errors.jobName} />
            </FormSection>

            <FormSection title="Assignment" description="Who works on the job and how urgent it is." icon={Users}>
              <MultiSelect label="Job Assignees" placeholder="Job Assignees" options={TEAM_OPTIONS} value={form.assignees} onChange={(v) => set('assignees', v)}
                renderOption={(o) => (
                  <span className="flex flex-1 items-center gap-2.5"><Avatar text={initials(o.label)} size="sm" />
                    <span className="min-w-0"><span className="block truncate font-medium">{o.label}</span><span className="block truncate text-xs text-muted-foreground">{o.meta}</span></span></span>
                )} />
              <div className="flex flex-col gap-1.5">
                <span id="job-priority-label" className="text-sm font-medium">Priority</span>
                <div role="radiogroup" aria-labelledby="job-priority-label" className="flex flex-wrap gap-1.5">
                  {TASK_PRIORITIES.map((p) => {
                    const on = form.priority === p;
                    return (
                      <button key={p} type="button" role="radio" aria-checked={on} onClick={() => set('priority', p)}
                        className={cn('inline-flex h-8 items-center gap-2 rounded-md border px-3 text-sm font-medium shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                          on ? 'border-primary/40 bg-primary/[0.06] text-foreground ring-1 ring-primary/30' : 'border-input bg-card text-muted-foreground hover:bg-accent hover:text-foreground')}>
                        <span className={cn('size-2 rounded-full', PRIORITY_DOT[p] || 'bg-muted-foreground/50')} aria-hidden="true" />{p}
                      </button>
                    );
                  })}
                </div>
              </div>
            </FormSection>

            <FormSection title="Description" description="Instructions your team sees on every job created from this template." icon={FileText}>
              <TextEditor ariaLabel="Job description" value={form.description} onChange={(html) => set('description', html)} shortcuts={accountShortcuts} placeholder="Describe the job…" minHeight={180} />
            </FormSection>

            <FormSection title="Start and Due Date" description="Fixed calendar dates, or offsets from when the job is created." icon={CalendarDays}>
              <SwitchRow label="Absolute Date" description="Set fixed calendar dates instead of relative offsets" checked={!!form.absoluteDate} onChange={(v) => set('absoluteDate', v)} />
              {form.absoluteDate ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field id="job-start-date" label="Start Date">
                    <Input id="job-start-date" type="date" value={form.startDate || ''} onChange={(e) => set('startDate', e.target.value)} />
                  </Field>
                  <Field id="job-due-date" label="Due Date" error={errors.dueDate}>
                    <Input id="job-due-date" type="date" value={form.dueDate || ''} min={form.startDate || undefined} onChange={(e) => set('dueDate', e.target.value)}
                      aria-invalid={!!errors.dueDate} aria-describedby={errors.dueDate ? 'job-due-date-error' : undefined} />
                  </Field>
                </div>
              ) : (
                <div className="flex flex-col gap-3">{relRow('Start In', 'startsin', 'startsInDuration')}{relRow('Due In', 'duein', 'dueinduration')}</div>
              )}
            </FormSection>
          </div>

          {/* RIGHT COLUMN */}
          <aside className="flex min-w-0 flex-col gap-6">
            <FormSection title="Client-Facing Status" description="What the client sees in their portal." icon={Eye}>
              <SwitchRow label="Show in Client Portal" description="Clients see this job and its status in their portal" checked={!!form.clientFacingStatus} onChange={(v) => set('clientFacingStatus', v)} />
              {form.clientFacingStatus && (
                <div className="flex flex-col gap-5">
                  <ShortcodeTextField label="Job Name for Client" value={form.inputText} onChange={(v) => set('inputText', v)} placeholder="Job name for client" shortcuts={accountShortcuts} />
                  <StatusSelect value={form.selectedJob} onChange={pickStatus} statuses={statuses} error={errors.selectedJob} />
                  <div className="flex flex-col gap-1.5">
                    <ShortcodeTextField key={`desc-${form.selectedJob || 'none'}`} label="Description" value={form.clientDescription || ''} onChange={(v) => set('clientDescription', v)} placeholder="Description"
                      shortcuts={accountShortcuts} multiline rows={4} maxLength={LIMIT} />
                    <div className="flex items-start justify-between gap-3">
                      {canUseStatusText ? (
                        <button type="button" onClick={() => set('clientDescription', selectedStatus.description.slice(0, LIMIT))}
                          className="inline-flex min-w-0 items-center gap-1.5 rounded text-left text-xs font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
                          <span className="size-2 flex-none rounded-full" style={{ backgroundColor: selectedStatus.color }} aria-hidden="true" />
                          <span className="truncate">Use the “{selectedStatus.name}” description</span>
                        </button>
                      ) : <span />}
                      <span className={cn('flex-none text-xs tabular-nums', descLength > LIMIT ? 'font-medium text-danger-700' : 'text-muted-foreground')}>{descLength}/{LIMIT}</span>
                    </div>
                  </div>
                </div>
              )}
            </FormSection>

            <FormSection title="Comments" description="Notes added to every job created from this template." icon={MessageSquare}
              action={form.comments.length > 0 && <Badge variant="neutral">{form.comments.length}</Badge>}>
              {form.comments.length === 0 && (
                <p className="rounded-lg border border-dashed px-4 py-5 text-center text-sm text-muted-foreground">No comments yet.</p>
              )}
              {form.comments.map((comment, index) => (
                <div key={index} className="flex items-start gap-1.5">
                  <Textarea className="min-h-[64px] flex-1" rows={2} value={comment} onChange={(e) => handleCommentChange(index, e.target.value)}
                    placeholder={`Comment ${index + 1}`} aria-label={`Comment ${index + 1}`} />
                  <SimpleTooltip label="Delete comment">
                    <Button type="button" variant="ghost" size="icon-sm" onClick={() => deleteCommentField(index)} aria-label={`Delete comment ${index + 1}`}
                      className="mt-0.5 text-muted-foreground hover:bg-danger-50 hover:text-danger-700"><Trash2 /></Button>
                  </SimpleTooltip>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addCommentField} className="w-full border-dashed text-muted-foreground shadow-none hover:text-foreground"><Plus />Add Comment</Button>
            </FormSection>
          </aside>
        </div>

        {modal === 'discard' && (
          <Modal title="Discard changes?" onClose={() => setModal(null)}
            footer={<><Button variant="outline" onClick={() => setModal(null)}>Keep editing</Button><Button variant="destructive" onClick={() => navigate(LIST_PATH)}>Discard</Button></>}>
            <p className="text-sm text-muted-foreground">Your changes to this job template haven't been saved.</p>
          </Modal>
        )}
        {modal === 'delete' && (
          <Modal title={`Delete “${saved.templatename}”?`} onClose={() => setModal(null)}
            footer={<><Button variant="outline" onClick={() => setModal(null)}>Cancel</Button><Button variant="destructive" onClick={() => { deleteJobTemplates([editingId]); navigate(LIST_PATH, { state: { toast: `Deleted “${saved.templatename}”` } }); }}><Trash2 />Delete</Button></>}>
            <p className="text-sm text-muted-foreground">Jobs already created from this template stay as they are.</p>
          </Modal>
        )}
        <ToastBridge message={toast} />
      </div>

      <ActionBar dirty={dirty} isNew={!editingId}>
        <Button variant="ghost" onClick={handleCloseJobTemp} disabled={submitting}>Cancel</Button>
        <Button variant="outline" onClick={handleSave} disabled={submitting}>{submitting ? 'Saving…' : 'Save'}</Button>
        <Button onClick={handleSaveAndExit} disabled={submitting}>{submitting ? 'Saving…' : 'Save & Exit'}</Button>
      </ActionBar>
    </>
  );
}
