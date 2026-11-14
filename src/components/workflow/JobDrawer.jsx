import { useId, useMemo, useState } from 'react';
import { AlertTriangle, Briefcase, CalendarRange, Check, Globe, History, Zap } from 'lucide-react';
import MultiSelect from '../MultiSelect';
import ShortcodeTextField from '../ShortcodeTextField';
import TextEditor from '../TextEditor';
import AutomationReviewDrawer from './AutomationReviewDrawer';
import { PriorityBadge, StageDot } from './KanbanBoard';
import { Avatar, CloseButton, Drawer, Modal, Toggle, initials } from '../ui';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { cn } from 'lib/utils';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
// import { TEAM_MEMBERS } from '../../data/sampleData';
import { accountShortcuts } from '../../data/shortcodes';
import { DURATION_OPTIONS, TASK_PRIORITIES } from '../../data/taskTemplates';
import { statusOptionsFrom } from '../../data/statusOptions';
import { fillShortcodes } from '../../data/accountChats';

// const TEAM_OPTIONS = TEAM_MEMBERS.map((m) => ({ ...m, value: m.label }));
const NO_TEMPLATE = '__none__';

/** Label + control + hint/error, laid out the same everywhere in this drawer. */
function Field({ id, label, required, hint, error, children, className }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && <Label htmlFor={id}>{label}{required && <span className="text-danger-700"> *</span>}</Label>}
      {children}
      {hint && !error && <span className="text-xs text-muted-foreground">{hint}</span>}
      {error && <span className="text-xs text-danger-700">{error}</span>}
    </div>
  );
}

/** A titled group of fields, separated from the next by a rule. */
function Section({ icon: Icon, title, description, action, children }) {
  return (
    <section className="flex flex-col gap-4 border-t pt-6 first:border-t-0 first:pt-0">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          {Icon && <Icon className="mt-0.5 size-4 flex-none text-muted-foreground" aria-hidden="true" />}
          <div>
            <h3 className="text-sm font-semibold">{title}</h3>
            {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Client-facing status picker with a colour dot per status. */
function StatusSelect({ label = 'Status', value, onChange, statuses, error }) {
  const id = useId();
  return (
    <Field id={id} label={label} error={error}>
      <Select value={value == null ? '' : String(value)} onValueChange={(v) => { const s = statuses.find((x) => String(x.id) === v); if (s) onChange(s.id); }}>
        <SelectTrigger id={id} aria-invalid={!!error} className={cn(error && 'border-destructive')}>
          <SelectValue placeholder="Select status…" />
        </SelectTrigger>
        <SelectContent>
          {statuses.map((s) => (
            <SelectItem key={s.id} value={String(s.id)}>
              <span className="flex items-center gap-2"><span className="size-2.5 flex-none rounded-full" style={{ backgroundColor: s.color }} aria-hidden="true" />{s.name}</span>
            </SelectItem>
          ))}
          {!statuses.length && <div className="px-3 py-2 text-sm text-muted-foreground">No client-facing statuses yet.</div>}
        </SelectContent>
      </Select>
    </Field>
  );
}

const DESCRIPTION_LIMIT = 4000;
const addDays = (n, unit = 'days') => {
  const d = new Date();
  d.setDate(d.getDate() + (Number(n) || 0) * (unit === 'weeks' ? 7 : unit === 'months' ? 30 : 1));
  return d.toISOString().slice(0, 10);
};
const blank = (pipeline, stageId, accountIds) => ({
  accountIds, pipelineId: pipeline?.id || '', stageId: stageId || pipeline?.stages?.[0]?.id || '', jobTemplateId: pipeline?.defaultjobtemplate || '',
  name: '', assignees: [], priority: 'Medium', description: '',
  absoluteDate: false, startDate: '', dueDate: '', startsin: 0, startsInDuration: 'days', duein: 7, dueinduration: 'days',
  clientFacingStatus: false, inputText: '', selectedJob: null, clientDescription: '',
});
const fromTemplate = (tpl) => (tpl ? {
  name: tpl.jobName || tpl.templatename, assignees: tpl.assignees || [], priority: tpl.priority || 'Medium', description: tpl.description || '',
  absoluteDate: !!tpl.absoluteDate, startDate: tpl.startDate || '', dueDate: tpl.dueDate || '', startsin: tpl.startsin ?? 0, startsInDuration: tpl.startsInDuration || 'days',
  duein: tpl.duein ?? 7, dueinduration: tpl.dueinduration || 'days',
  clientFacingStatus: !!tpl.clientFacingStatus, inputText: tpl.inputText || '', selectedJob: tpl.selectedJob ?? null, clientDescription: tpl.clientDescription || '',
} : {});

/**
 * Create Job / Edit job drawer.
 * New job: Account(s) · Pipeline · Stage · Default job template · Job name · Assignees · Priority · Description · Dates · Client-facing status.
 * If the stage has automations, Save opens the automation review; the chosen ones run for each account.
 * Props: pipelineId · stageId · accountIds (preset) · job (edit) · onDone({ message, results }) · onClose()
 *   jobId: app-wide use ("New → Job"): "new" creates a job, an existing id edits that job.
 *          In this mode onDone(message) receives the message string (that caller shows it as a toast).
 */
export default function JobDrawer({ jobId, pipelineId, stageId, accountIds = [], job: jobProp = null, onDone, onClose }) {
  const { teamOptions: TEAM_MEMBERS = [] } = useData();   // the logged-in user first, then active team members
 const TEAM_OPTIONS = TEAM_MEMBERS.map((m) => ({ ...m, value: m.label }));
 
  const { accounts = [], pipelines = [], jobs = [], jobTemplates = [], clientFacingJobs, clientStatuses, createJobs, saveJob, moveJob } = useData();
  const { user } = useAuth() || {};
  const me = user?.name || 'You';
  const uid = useId();
  const fid = (name) => `${uid}-${name}`;
  const statuses = useMemo(() => statusOptionsFrom(clientFacingJobs ?? clientStatuses ?? []), [clientFacingJobs, clientStatuses]);
  // the job being edited: passed in, or looked up from jobId (app-wide use)
  const [job] = useState(() => jobProp || (jobId && jobId !== 'new' ? jobs.find((j) => String(j.id) === String(jobId)) || null : null));
  const isEdit = !!job;
  const startPipeline = pipelines.find((p) => p.id === (job?.pipelineId || pipelineId)) || null;
  const done = (payload) => (jobId !== undefined ? onDone?.(payload.message) : onDone?.(payload));

  const [form, setForm] = useState(() => {
    if (job) return { ...blank(startPipeline, job.stageId, [job.accountId]), ...job, accountIds: [job.accountId] };
    const b = blank(startPipeline, stageId, accountIds);
    return { ...b, ...fromTemplate(jobTemplates.find((t) => t.id === b.jobTemplateId)) };
  });
  const [errors, setErrors] = useState({});
  const [review, setReview] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [initial] = useState(() => JSON.stringify(form));
  const dirty = JSON.stringify(form) !== initial;
  const set = (changes) => { setForm((f) => ({ ...f, ...changes })); setErrors((e) => { const n = { ...e }; Object.keys(changes).forEach((k) => delete n[k]); return n; }); };

  const pipeline = pipelines.find((p) => p.id === form.pipelineId) || null;
  const stage = pipeline?.stages.find((s) => s.id === form.stageId) || null;
  const selectedAccounts = accounts.filter((a) => form.accountIds.includes(a.id));
  const handlePipelineChange = (id) => { const p = pipelines.find((x) => x.id === id); set({ pipelineId: id, stageId: p?.stages[0]?.id || '', ...(p?.defaultjobtemplate && !isEdit ? { jobTemplateId: p.defaultjobtemplate, ...fromTemplate(jobTemplates.find((t) => t.id === p.defaultjobtemplate)) } : {}) }); };
  const handleJobtemp = (id) => set({ jobTemplateId: id, ...fromTemplate(jobTemplates.find((t) => t.id === id)) });
  const pickStatus = (id) => {
    const next = statuses.find((s) => String(s.id) === String(id));
    const prev = statuses.find((s) => String(s.id) === String(form.selectedJob));
    const fill = next?.description && (!form.clientDescription.trim() || form.clientDescription.trim() === (prev?.description || '').trim());
    set({ selectedJob: id, ...(fill ? { clientDescription: next.description.slice(0, DESCRIPTION_LIMIT) } : {}) });
  };

  const validate = () => {
    const e = {};
    if (!form.accountIds.length) e.accountIds = 'Choose at least one account.';
    if (!form.pipelineId) e.pipelineId = 'Choose a pipeline.';
    if (!form.stageId) e.stageId = 'Choose a stage.';
    if (!form.name.trim()) e.name = 'Job name is required.';
    if (form.absoluteDate && form.startDate && form.dueDate && form.dueDate < form.startDate) e.dueDate = 'Due date must be on or after the start date.';
    if (form.clientFacingStatus && !form.selectedJob) e.selectedJob = 'Choose a status for the client portal.';
    setErrors(e);
    return !Object.keys(e).length;
  };
  /** The job as saved: relative dates become real dates. */
  const record = () => {
    const { accountIds: _ids, ...rest } = form;
    return {
      ...rest, name: form.name.trim(),
      startDate: form.absoluteDate ? form.startDate : addDays(form.startsin, form.startsInDuration),
      dueDate: form.absoluteDate ? form.dueDate : addDays(form.duein, form.dueinduration),
    };
  };
  const create = (automationIds) => {
    const { jobs: made, results } = createJobs(form.accountIds, record(), { automationIds, me });
    const ran = results.reduce((n, g) => n + g.results.filter((r) => r.ok).length, 0);
    done({ message: `${made.length > 1 ? `Created ${made.length} jobs` : `Created “${made[0]?.name}”`}${ran ? ` · ${ran} automation${ran > 1 ? 's' : ''} ran` : ''}`, results });
  };
  const handleSaveJob = () => {
    if (!validate()) return;
    if (isEdit) {
      const rec = record();
      const stageChanged = rec.stageId !== job.stageId;
      saveJob({ ...rec, id: job.id, accountId: form.accountIds[0], stageId: job.stageId });
      const results = stageChanged ? moveJob(job.id, rec.stageId, { me }) : [];
      done({ message: `Saved “${rec.name}”${results.length ? ` · ${results.filter((r) => r.ok).length} automations ran` : ''}`,
        results: results.length ? [{ accountName: selectedAccounts[0]?.name || '', results }] : [] });
      return;
    }
    if (stage?.automations?.length) setReview(true);
    else create([]);
  };
  const requestClose = () => (dirty ? setConfirmClose(true) : onClose());
  const nameExample = selectedAccounts[0] && form.name.includes('[') ? fillShortcodes(form.name, selectedAccounts[0]) : '';
  const errorCount = Object.keys(errors).length;

  const relRow = (label, numKey, unitKey) => (
    <div className="grid grid-cols-[72px_1fr_130px] items-center gap-3">
      <Label htmlFor={fid(numKey)} className="text-muted-foreground">{label}</Label>
      <Input id={fid(numKey)} aria-label={label} type="number" min="0" value={form[numKey]} onChange={(e) => set({ [numKey]: Number(e.target.value) })} />
      <Select value={form[unitKey]} onValueChange={(v) => set({ [unitKey]: v })}>
        <SelectTrigger aria-label={`${label} unit`}><SelectValue /></SelectTrigger>
        <SelectContent>{DURATION_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );

  return (
    <>
      <Drawer onClose={requestClose} label={isEdit ? 'Edit Job' : 'Create Job'} width="max-w-[650px]">
        <div className="flex h-full min-h-0 flex-col">
          <header className="flex items-start gap-3 border-b px-6 py-4">
            <span className="inline-flex size-9 flex-none items-center justify-center rounded-lg border border-brand-100 bg-brand-50 text-brand-700" aria-hidden="true">
              <Briefcase className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-lg font-semibold tracking-tight">{isEdit ? 'Edit Job' : 'Create Job'}</h2>
              <p className="truncate text-sm text-muted-foreground">{isEdit ? 'Update this job' : 'Create and configure a new workflow job'}</p>
            </div>
            <CloseButton onClick={requestClose} />
          </header>

          <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 py-5">
            {/* Placement */}
            <Section title="Where it lives" description="The account, pipeline and stage for this job.">
              {isEdit ? (
                <Field id={fid('account')} label="Account">
                  <Select value={String(form.accountIds[0] ?? '')} onValueChange={(v) => { const a = accounts.find((x) => String(x.id) === v); if (a) set({ accountIds: [a.id] }); }}>
                    <SelectTrigger id={fid('account')}><SelectValue placeholder="Select account…" /></SelectTrigger>
                    <SelectContent>
                      {accounts.map((a) => (
                        <SelectItem key={a.id} value={String(a.id)}>
                          <span className="flex items-center gap-2"><Avatar text={initials(a.name)} size="xs" />{a.name}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              ) : (
                <div>
                  <MultiSelect label="Account *" placeholder="Select accounts" options={accounts.map((a) => ({ value: a.id, label: a.name, meta: a.company }))} value={form.accountIds}
                    onChange={(v) => set({ accountIds: v })} error={errors.accountIds}
                    renderOption={(o) => <span className="flex flex-1 items-center gap-2.5"><Avatar text={initials(o.label)} size="sm" /><span><span className="block font-medium">{o.label}</span><span className="block text-xs text-muted-foreground">{o.meta}</span></span></span>} />
                  {form.accountIds.length > 1 && <p className="mt-1.5 text-xs text-muted-foreground">A separate job is created for each account.</p>}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field id={fid('pipeline')} label="Select Pipeline" required error={errors.pipelineId}>
                  <Select value={form.pipelineId ? String(form.pipelineId) : ''} disabled={isEdit}
                    onValueChange={(v) => { const p = pipelines.find((x) => String(x.id) === v); if (p) handlePipelineChange(p.id); }}>
                    <SelectTrigger id={fid('pipeline')} aria-invalid={!!errors.pipelineId} className={cn(errors.pipelineId && 'border-destructive')}><SelectValue placeholder="Select pipeline…" /></SelectTrigger>
                    <SelectContent>{pipelines.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.pipelineName}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field id={fid('stage')} label="Select Stage" required error={errors.stageId}>
                  <Select value={form.stageId ? String(form.stageId) : ''} disabled={!pipeline}
                    onValueChange={(v) => { const s = pipeline?.stages.find((x) => String(x.id) === v); if (s) set({ stageId: s.id }); }}>
                    <SelectTrigger id={fid('stage')} aria-invalid={!!errors.stageId} className={cn(errors.stageId && 'border-destructive')}><SelectValue placeholder="Select stage…" /></SelectTrigger>
                    <SelectContent>
                      {(pipeline?.stages || []).map((s, i) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          <span className="flex items-center gap-2">
                            <StageDot index={i} />{i + 1}. {s.name}
                            {s.automations?.length > 0 && <span className="inline-flex items-center gap-0.5 text-xs text-warning-700"><Zap className="size-3" aria-hidden="true" />{s.automations.length}</span>}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              {stage?.automations?.length > 0 && (
                <div className="flex items-center gap-2 rounded-lg border border-warning-100 bg-warning-50 px-3 py-2 text-xs font-medium text-warning-700">
                  <Zap className="size-3.5 flex-none" aria-hidden="true" />
                  {stage.automations.length} automation{stage.automations.length > 1 ? 's' : ''} run when a job enters this stage
                </div>
              )}

              <Field id={fid('template')} label="Default job template" hint="Fills in the job details below.">
                <Select value={form.jobTemplateId ? String(form.jobTemplateId) : ''}
                  onValueChange={(v) => handleJobtemp(v === NO_TEMPLATE ? '' : (jobTemplates.find((t) => String(t.id) === v)?.id ?? v))}>
                  <SelectTrigger id={fid('template')}><SelectValue placeholder="Select template…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_TEMPLATE}><span className="text-muted-foreground">No template</span></SelectItem>
                    {jobTemplates.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        {t.templatename}{t.id === pipeline?.defaultjobtemplate && <span className="ml-1.5 text-xs text-muted-foreground">(pipeline default)</span>}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </Section>

            {/* Details */}
            <Section title="Details" description="What the job is and who is working on it.">
              <div>
                <ShortcodeTextField label="Job Name" required value={form.name} onChange={(v) => set({ name: v })} placeholder="Enter job name" shortcuts={accountShortcuts} error={errors.name} />
                {nameExample && <p className="mt-1.5 text-xs text-muted-foreground">For {selectedAccounts[0].name}: <span className="font-medium text-foreground" data-testid="job-name-example">{nameExample}</span></p>}
              </div>

              <MultiSelect label="Job Assignees" placeholder="Select assignees" options={TEAM_OPTIONS} value={form.assignees} onChange={(v) => set({ assignees: v })}
                renderOption={(o) => <span className="flex flex-1 items-center gap-2.5"><Avatar text={initials(o.label)} size="sm" /><span className="font-medium">{o.label}</span></span>} />

              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium leading-none">Priority</span>
                <div role="radiogroup" aria-label="Priority" className="flex flex-wrap gap-1.5">
                  {TASK_PRIORITIES.map((p) => {
                    const on = form.priority === p;
                    return (
                      <button key={p} type="button" role="radio" aria-checked={on} onClick={() => set({ priority: p })}
                        className={cn('inline-flex h-8 items-center gap-1.5 rounded-md border px-1.5 transition-[background-color,border-color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                          on ? 'border-primary/50 bg-primary/5 shadow-xs' : 'border-transparent opacity-70 hover:bg-accent hover:opacity-100')}>
                        <PriorityBadge priority={p} />
                        {on && <Check className="size-3.5 text-primary" aria-hidden="true" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium leading-none">Description</span>
                <TextEditor key={form.jobTemplateId || 'none'} ariaLabel="Job description" value={form.description} onChange={(html) => set({ description: html })} shortcuts={accountShortcuts} minHeight={120} />
              </div>
            </Section>

            {/* Dates */}
            <Section icon={CalendarRange} title="Start and Due Date" description={form.absoluteDate ? 'Pick exact calendar dates.' : 'Counted from the day the job is created.'}
              action={<span className="flex items-center gap-2 text-sm text-muted-foreground"><Toggle label="Absolute Date" checked={form.absoluteDate} onChange={(v) => set({ absoluteDate: v })} /> Absolute Date</span>}>
              {form.absoluteDate ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field id={fid('start')} label="Start Date">
                    <Input id={fid('start')} type="date" value={form.startDate || ''} onChange={(e) => set({ startDate: e.target.value })} />
                  </Field>
                  <Field id={fid('due')} label="Due Date" error={errors.dueDate}>
                    <Input id={fid('due')} type="date" aria-invalid={!!errors.dueDate} value={form.dueDate || ''} onChange={(e) => set({ dueDate: e.target.value })} />
                  </Field>
                </div>
              ) : (
                <div className="flex flex-col gap-3">{relRow('Start In', 'startsin', 'startsInDuration')}{relRow('Due In', 'duein', 'dueinduration')}</div>
              )}
            </Section>

            {/* Client-facing status */}
            <Section icon={Globe} title="Client-facing status" description="What the client sees about this job in their portal."
              action={<span className="flex items-center gap-2 text-sm text-muted-foreground"><Toggle label="Show in Client portal" checked={form.clientFacingStatus} onChange={(v) => set({ clientFacingStatus: v })} /> Show in Client portal</span>}>
              {form.clientFacingStatus && (
                <div className="flex flex-col gap-4 rounded-lg border bg-subtle p-4">
                  <ShortcodeTextField label="Job name for client" value={form.inputText} onChange={(v) => set({ inputText: v })} placeholder="Job name for client" shortcuts={accountShortcuts} />
                  <StatusSelect label="Status" value={form.selectedJob} onChange={pickStatus} statuses={statuses} error={errors.selectedJob} />
                  <ShortcodeTextField label="Description" value={form.clientDescription} onChange={(v) => set({ clientDescription: v })} placeholder="Description"
                    multiline rows={4} maxLength={DESCRIPTION_LIMIT} shortcuts={accountShortcuts} />
                </div>
              )}
            </Section>

            {/* Automation history (edit) */}
            {isEdit && (job.activity || []).length > 0 && (
              <Section icon={History} title="Automation history">
                <ol aria-label="Automation history" className="relative flex flex-col gap-3 before:absolute before:bottom-2 before:left-[9px] before:top-2 before:w-px before:bg-border">
                  {[...job.activity].reverse().map((r, i) => (
                    <li key={i} className="relative flex items-start gap-3 text-sm">
                      <span className={cn('relative z-[1] mt-px inline-flex size-5 flex-none items-center justify-center rounded-full ring-4 ring-card',
                        r.ok ? 'bg-success-50 text-success-700' : 'bg-warning-50 text-warning-700')}>
                        {r.ok ? <Check className="size-3" strokeWidth={3} aria-label="Done" /> : <AlertTriangle className="size-3" aria-label="Skipped" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={r.ok ? 'text-foreground' : 'text-muted-foreground'}>{r.text}</span>
                        <span className="block text-xs text-muted-foreground">{new Date(r.at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                      </span>
                    </li>
                  ))}
                </ol>
              </Section>
            )}
          </div>

          <footer className="flex flex-wrap items-center justify-end gap-2 border-t bg-subtle px-6 py-3.5">
            <span className="mr-auto text-xs text-muted-foreground" aria-live="polite">
              {errorCount > 0
                ? <span className="font-medium text-danger-700">Fix {errorCount} field{errorCount > 1 ? 's' : ''} to save</span>
                : dirty ? 'Unsaved changes' : ''}
            </span>
            <Button variant="outline" onClick={requestClose}>Cancel</Button>
            <Button onClick={handleSaveJob}>{!isEdit && stage?.automations?.length ? <Zap /> : null}Save</Button>
          </footer>
        </div>

        {confirmClose && (
          <Modal title="Discard changes?" description="This job hasn't been saved." onClose={() => setConfirmClose(false)}
            footer={<>
              <Button variant="outline" onClick={() => setConfirmClose(false)}>Keep editing</Button>
              <Button variant="destructive" onClick={onClose}>Discard</Button>
            </>}>
            <p className="text-sm text-muted-foreground">Anything you entered in this drawer will be lost.</p>
          </Modal>
        )}
      </Drawer>

      {review && stage && <AutomationReviewDrawer stage={stage} accounts={selectedAccounts} onBack={() => setReview(false)} onRun={create} />}
    </>
  );
}
