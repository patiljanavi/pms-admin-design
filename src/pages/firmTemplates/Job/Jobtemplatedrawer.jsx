import { useState } from 'react';
import { Briefcase, CalendarDays, CircleAlert, Eye, FileText, MessageSquare, Plus, Trash2, Users } from 'lucide-react';
import MultiSelect from '../../../components/MultiSelect';
import ShortcodeTextField from '../../../components/ShortcodeTextField';
import TextEditor from '../../../components/TextEditor';
import { Avatar, CloseButton, Drawer, Modal, Toggle, initials } from '../../../components/ui';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Textarea } from '../../../components/ui/textarea';
import { SimpleTooltip } from '../../../components/ui/tooltip';
import { ToastBridge } from '../../../components/ui/sonner';
import { useData } from '../../../context/DataContext';
import { TEAM_MEMBERS } from '../../../data/sampleData';
import { accountShortcuts } from '../../../data/shortcodes';
import { DURATION_OPTIONS, TASK_PRIORITIES } from '../../../data/taskTemplates';
import { CLIENT_DESCRIPTION_LIMIT, emptyJobTemplate } from '../../../data/jobtemplates';
import { cn } from 'lib/utils';

/**
 * Turns DataContext's client-facing statuses into dropdown options.
 * Accepts the common field names, so it works with clientFacingJobs ({ value, label, color, description })
 * and other shapes ({ id, name, clientfacingColour, clientfacingDescription, … }).
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

const TEAM_OPTIONS = TEAM_MEMBERS.map((m) => ({ ...m, value: m.label }));
const LIMIT = CLIENT_DESCRIPTION_LIMIT || 250;
const PRIORITY_DOT = { Low: 'bg-muted-foreground/50', Medium: 'bg-brand-500', High: 'bg-warning-500', Urgent: 'bg-danger-500' };
/** Works whether a field calls onChange(text) or onChange(event). */
const textOf = (v) => (v && typeof v === 'object' && v.target ? v.target.value : v ?? '');
const clone = (o) => JSON.parse(JSON.stringify(o));

/** Drawer section: small icon + title, divided from the next one. */
function Section({ title, icon: Icon, children }) {
  return (
    <section className="flex flex-col gap-4 border-b px-6 py-5 last:border-b-0">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        {Icon && <Icon className="size-4 text-muted-foreground" aria-hidden="true" />}{title}
      </h3>
      {children}
    </section>
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

/** Status dropdown that shows each client-facing status with its colour dot. */
function StatusSelect({ value, onChange, statuses, error }) {
  const current = statuses.find((s) => String(s.id) === String(value));
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="job-drawer-status">Status</Label>
      <Select value={current ? String(current.id) : ''}
        onValueChange={(v) => { const s = statuses.find((x) => String(x.id) === v); if (s) onChange(s.id); }}>
        <SelectTrigger id="job-drawer-status" aria-invalid={!!error} className={cn(error && 'border-destructive')}>
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
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
}

/**
 * One drawer to create or edit a job template (like the Tag drawer).
 * Props: template (null = new) · onClose() · onDone(message)
 */
export default function JobTemplateDrawer({ template, onClose, onDone }) {
  const { saveJobTemplate, deleteJobTemplates, clientFacingJobs, clientStatuses } = useData();
  // Status options come from DataContext: clientFacingJobs (or clientStatuses in older setups)
  const statuses = statusOptionsFrom(clientFacingJobs ?? clientStatuses ?? []);
  const [editingId, setEditingId] = useState(template?.id || null);
  // Always start from the full blank form, so fields like clientDescription are never undefined
  const [form, setForm] = useState(() => ({ ...clone(emptyJobTemplate), clientDescription: '', comments: [], ...clone(template || {}) }));
  const [saved, setSaved] = useState(() => ({ ...clone(emptyJobTemplate), clientDescription: '', comments: [], ...clone(template || {}) }));
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [modal, setModal] = useState(null); // 'discard' | 'delete'
  const [note, setNote] = useState('');
  const dirty = JSON.stringify(form) !== JSON.stringify(saved);
  const hasErrors = Object.values(errors).some(Boolean);
  const set = (k, v) => { const value = textOf(v); setForm((f) => ({ ...f, [k]: value })); setErrors((e) => ({ ...e, [k]: undefined })); };

  /* client-facing status → fills the Description below */
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
      console.warn(`[JobTemplateDrawer] Client-facing status "${next.name}" has no description, so nothing was filled in.`, (clientFacingJobs ?? clientStatuses ?? []).find((s) => String(s.value ?? s.id) === String(id)));
    }
  };
  const selectedStatus = statusOf(form.selectedJob);
  const canUseStatusText = selectedStatus?.description && (form.clientDescription || '').trim() !== selectedStatus.description.trim();

  /* comments */
  const addCommentField = () => set('comments', [...form.comments, '']);
  const handleCommentChange = (i, v) => set('comments', form.comments.map((c, j) => (j === i ? v : c)));
  const deleteCommentField = (i) => set('comments', form.comments.filter((_, j) => j !== i));

  const validate = () => {
    const e = {};
    if (!form.templatename.trim()) e.templatename = 'Template name is required.';
    if (!form.jobName.trim()) e.jobName = 'Job name is required.';
    if (form.absoluteDate && form.startDate && form.dueDate && form.dueDate < form.startDate) e.dueDate = 'Due date must be on or after the start date.';
    if (form.clientFacingStatus && !form.selectedJob) e.selectedJob = 'Choose a status for the client portal.';
    setErrors(e);
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
  const handleSave = () => {                     // Save (drawer stays open)
    if (!validate()) return;
    setSubmitting(true);
    const data = persist();
    setEditingId(data.id); setForm(data); setSaved(data); setSubmitting(false);
    setNote(`Saved “${data.templatename}”`); setTimeout(() => setNote(''), 2400);
  };
  const handleSaveAndExit = () => {
    if (!validate()) return;
    setSubmitting(true);
    const data = persist();
    onDone?.(editingId ? `Saved “${data.templatename}”` : `Created “${data.templatename}”`);
  };
  const handleCloseJobTemp = () => (dirty ? setModal('discard') : onClose());

  const relRow = (label, numKey, unitKey) => (
    <div className="grid grid-cols-[64px_minmax(0,1fr)_minmax(0,130px)] items-center gap-3">
      <Label htmlFor={`jd-${numKey}`} className="text-muted-foreground">{label}</Label>
      <Input id={`jd-${numKey}`} aria-label={label} type="number" min="0" className="tabular-nums" value={form[numKey]} onChange={(e) => set(numKey, e.target.value)} />
      <Select value={form[unitKey] ? String(form[unitKey]) : ''} onValueChange={(v) => set(unitKey, v)}>
        <SelectTrigger aria-label={`${label} unit`}><SelectValue placeholder="Unit" /></SelectTrigger>
        <SelectContent>{DURATION_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );

  return (
    <Drawer onClose={handleCloseJobTemp} label={editingId ? 'Edit Job Template' : 'Create Job Template'} width="max-w-[720px]">
      <div className="flex h-full min-h-0 flex-col">
        {/* Header */}
        <div className="flex flex-none items-start gap-3.5 border-b px-6 py-5">
          <span className="inline-flex size-10 flex-none items-center justify-center rounded-xl border border-brand-100 bg-brand-50 text-brand-700" aria-hidden="true"><Briefcase className="size-5" /></span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-lg font-semibold tracking-tight">{editingId ? 'Edit Job Template' : 'Create Job Template'}</h2>
              {dirty && <Badge variant="warning" dot>Unsaved</Badge>}
            </div>
            <p className="truncate text-sm text-muted-foreground">Configure your job template settings</p>
          </div>
          <CloseButton onClick={handleCloseJobTemp} />
        </div>

        {(dirty || hasErrors) && (
          <div className={cn('flex flex-none items-center gap-2 border-b px-6 py-2 text-sm font-medium', hasErrors ? 'bg-danger-50 text-danger-700' : 'bg-warning-50 text-warning-700')} role={hasErrors ? 'alert' : undefined}>
            {hasErrors && <CircleAlert className="size-4" aria-hidden="true" />}
            {hasErrors ? 'Please fix the highlighted fields.' : 'You have unsaved changes.'}
          </div>
        )}

        {/* Body */}
        <form className="min-h-0 flex-1 overflow-y-auto" noValidate onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          <Section title="General Information" icon={FileText}>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="jd-templatename">Template Name<span className="ml-0.5 text-danger-700" aria-hidden="true">*</span></Label>
              <Input id="jd-templatename" value={form.templatename} onChange={(e) => set('templatename', e.target.value)} placeholder="Template Name" aria-invalid={!!errors.templatename} />
              {errors.templatename && <FieldError>{errors.templatename}</FieldError>}
            </div>
            <ShortcodeTextField label="Job Name" required value={form.jobName} onChange={(v) => set('jobName', v)} placeholder="Job Name" shortcuts={accountShortcuts} error={errors.jobName} />
          </Section>

          <Section title="Assignment" icon={Users}>
            <MultiSelect label="Job Assignees" placeholder="Job Assignees" options={TEAM_OPTIONS} value={form.assignees} onChange={(v) => set('assignees', v)}
              renderOption={(o) => (
                <span className="flex flex-1 items-center gap-2.5"><Avatar text={initials(o.label)} size="sm" />
                  <span className="min-w-0"><span className="block truncate font-medium">{o.label}</span><span className="block truncate text-xs text-muted-foreground">{o.meta}</span></span></span>
              )} />
            <div className="flex flex-col gap-1.5">
              <span id="jd-priority-label" className="text-sm font-medium">Priority</span>
              <div role="radiogroup" aria-labelledby="jd-priority-label" className="flex flex-wrap gap-1.5">
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
          </Section>

          <Section title="Description" icon={FileText}>
            <TextEditor ariaLabel="Job description" value={form.description} onChange={(html) => set('description', html)} shortcuts={accountShortcuts} placeholder="Describe the job…" minHeight={150} />
          </Section>

          <Section title="Start and Due Date" icon={CalendarDays}>
            <SwitchRow label="Absolute Date" description="Set fixed calendar dates instead of relative offsets" checked={!!form.absoluteDate} onChange={(v) => set('absoluteDate', v)} />
            {form.absoluteDate ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="jd-start">Start Date</Label>
                  <Input id="jd-start" type="date" value={form.startDate || ''} onChange={(e) => set('startDate', e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="jd-due">Due Date</Label>
                  <Input id="jd-due" type="date" value={form.dueDate || ''} min={form.startDate || undefined} onChange={(e) => set('dueDate', e.target.value)} aria-invalid={!!errors.dueDate} />
                  {errors.dueDate && <FieldError>{errors.dueDate}</FieldError>}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">{relRow('Start In', 'startsin', 'startsInDuration')}{relRow('Due In', 'duein', 'dueinduration')}</div>
            )}
          </Section>

          <Section title="Client-Facing Status" icon={Eye}>
            <SwitchRow label="Show in Client Portal" description="Clients see this job and its status in their portal" checked={!!form.clientFacingStatus} onChange={(v) => set('clientFacingStatus', v)} />
            {form.clientFacingStatus && (
              <div className="flex flex-col gap-5">
                <ShortcodeTextField label="Job Name for Client" value={form.inputText} onChange={(v) => set('inputText', v)} placeholder="Job name for client" shortcuts={accountShortcuts} />
                <StatusSelect value={form.selectedJob} onChange={pickStatus} statuses={statuses} error={errors.selectedJob} />
                <div className="flex flex-col gap-1.5">
                  <ShortcodeTextField key={`desc-${form.selectedJob || 'none'}`} label="Description" value={form.clientDescription || ''} onChange={(v) => set('clientDescription', v)} placeholder="Description"
                    shortcuts={accountShortcuts} multiline rows={4} maxLength={LIMIT} />
                  {canUseStatusText && (
                    <button type="button" onClick={() => set('clientDescription', selectedStatus.description.slice(0, LIMIT))}
                      className="inline-flex w-fit items-center gap-1.5 rounded text-xs font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
                      <span className="size-2 rounded-full" style={{ backgroundColor: selectedStatus.color }} aria-hidden="true" />
                      Use the “{selectedStatus.name}” description
                    </button>
                  )}
                </div>
              </div>
            )}
          </Section>

          <Section title="Comments" icon={MessageSquare}>
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
          </Section>
          <button type="submit" className="hidden" tabIndex={-1} aria-hidden="true" />
        </form>

        {/* Footer actions */}
        <div className="flex flex-none flex-wrap items-center justify-between gap-2 border-t bg-subtle px-6 py-3.5">
          {editingId ? <Button variant="ghost" onClick={() => setModal('delete')} className="text-danger-700 hover:bg-danger-50 hover:text-danger-700"><Trash2 />Delete</Button> : <span />}
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={handleCloseJobTemp} disabled={submitting}>Cancel</Button>
            <Button variant="outline" onClick={handleSave} disabled={submitting}>{submitting ? 'Saving…' : 'Save'}</Button>
            <Button onClick={handleSaveAndExit} disabled={submitting}>{submitting ? 'Saving…' : 'Save & Exit'}</Button>
          </div>
        </div>
      </div>
      <ToastBridge message={note} />

      {modal === 'discard' && (
        <Modal title="Discard changes?" onClose={() => setModal(null)}
          footer={<><Button variant="outline" onClick={() => setModal(null)}>Keep editing</Button><Button variant="destructive" onClick={onClose}>Discard</Button></>}>
          <p className="text-sm text-muted-foreground">Your changes to this job template haven't been saved.</p>
        </Modal>
      )}
      {modal === 'delete' && (
        <Modal title={`Delete “${form.templatename}”?`} onClose={() => setModal(null)}
          footer={<><Button variant="outline" onClick={() => setModal(null)}>Cancel</Button><Button variant="destructive" onClick={() => { deleteJobTemplates([editingId]); onDone?.(`Deleted “${saved.templatename}”`); }}><Trash2 />Delete</Button></>}>
          <p className="text-sm text-muted-foreground">Jobs already created from this template stay as they are.</p>
        </Modal>
      )}
    </Drawer>
  );
}
