import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { FiBriefcase, FiCheck, FiChevronDown, FiX, FiZap } from 'react-icons/fi';
import MultiSelect from '../MultiSelect';
import ShortcodeTextField from '../ShortcodeTextField';
import TextEditor from '../TextEditor';
import AutomationReviewDrawer from './AutomationReviewDrawer';
import { Avatar, Drawer, Modal, Toggle, cx, initials } from '../ui';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { TEAM_MEMBERS } from '../../data/sampleData';
import { accountShortcuts } from '../../data/shortcodes';
import { DURATION_OPTIONS, PRIORITY_STYLE, TASK_PRIORITIES } from '../../data/taskTemplates';
import { statusOptionsFrom } from '../../data/statusOptions';
import { fillShortcodes } from '../../data/accountChats';

const TEAM_OPTIONS = TEAM_MEMBERS.map((m) => ({ ...m, value: m.label }));

/** Client-facing status picker with a color dot per status (built in, so this file needs no other picker). */
function StatusSelect({ label = 'Status', value, onChange, statuses, error }) {
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  const labelId = useId();
  const current = statuses.find((s) => String(s.id) === String(value));
  useEffect(() => {
    const h = (e) => { if (!box.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div ref={box} className="relative">
      <span id={labelId} className="mb-1.5 block text-sm font-semibold">{label}</span>
      <button type="button" aria-haspopup="listbox" aria-expanded={open} aria-labelledby={labelId} onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); } }}
        className={cx('flex min-h-[44px] w-full items-center gap-2 rounded border bg-surface px-3 text-left focus:outline-none focus:ring-2 focus:ring-brand-600/30', error ? 'border-danger-700' : 'border-line-strong focus:border-brand-600')}>
        {current ? <><span className="h-3 w-3 flex-none rounded-full" style={{ backgroundColor: current.color }} />{current.name}</> : <span className="text-muted/70">Select status...</span>}
        <FiChevronDown className="ml-auto text-muted" aria-hidden="true" />
      </button>
      {open && (
        <ul role="listbox" aria-label="Client-facing statuses" className="absolute left-0 right-0 z-40 mt-1 max-h-64 overflow-y-auto rounded-md border border-line bg-surface p-1 shadow-pop">
          {statuses.map((s) => {
            const on = String(s.id) === String(value);
            return (
              <li key={s.id} role="option" aria-selected={on} onClick={() => { onChange(s.id); setOpen(false); }}
                className={cx('flex cursor-pointer items-center gap-2 rounded px-3 py-2', on ? 'bg-brand-50' : 'hover:bg-subtle')}>
                <span className="h-3 w-3 flex-none rounded-full" style={{ backgroundColor: s.color }} />
                <span className="flex-1">{s.name}</span>
                {on && <FiCheck className="text-brand-600" aria-hidden="true" />}
              </li>
            );
          })}
          {!statuses.length && <li className="px-3 py-2 text-sm text-muted">No client-facing statuses yet.</li>}
        </ul>
      )}
      {error && <span className="mt-1 block text-sm text-danger-700">{error}</span>}
    </div>
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
 */
export default function JobDrawer({ pipelineId, stageId, accountIds = [], job = null, onDone, onClose }) {
  const { accounts = [], pipelines = [], jobTemplates = [], clientFacingJobs, clientStatuses, createJobs, saveJob, moveJob } = useData();
  const { user } = useAuth() || {};
  const me = user?.name || 'You';
  const statuses = useMemo(() => statusOptionsFrom(clientFacingJobs ?? clientStatuses ?? []), [clientFacingJobs, clientStatuses]);
  const isEdit = !!job;
  const startPipeline = pipelines.find((p) => p.id === (job?.pipelineId || pipelineId)) || null;

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
    const { jobs, results } = createJobs(form.accountIds, record(), { automationIds, me });
    const ran = results.reduce((n, g) => n + g.results.filter((r) => r.ok).length, 0);
    onDone({ message: `${jobs.length > 1 ? `Created ${jobs.length} jobs` : `Created “${jobs[0]?.name}”`}${ran ? ` · ${ran} automation${ran > 1 ? 's' : ''} ran` : ''}`, results });
  };
  const handleSaveJob = () => {
    if (!validate()) return;
    if (isEdit) {
      const rec = record();
      const stageChanged = rec.stageId !== job.stageId;
      saveJob({ ...rec, id: job.id, accountId: form.accountIds[0], stageId: job.stageId });
      const results = stageChanged ? moveJob(job.id, rec.stageId, { me }) : [];
      onDone({ message: `Saved “${rec.name}”${results.length ? ` · ${results.filter((r) => r.ok).length} automations ran` : ''}`,
        results: results.length ? [{ accountName: selectedAccounts[0]?.name || '', results }] : [] });
      return;
    }
    if (stage?.automations?.length) setReview(true);
    else create([]);
  };
  const requestClose = () => (dirty ? setConfirmClose(true) : onClose());
  const nameExample = selectedAccounts[0] && form.name.includes('[') ? fillShortcodes(form.name, selectedAccounts[0]) : '';

  const relRow = (label, numKey, unitKey) => (
    <div className="grid grid-cols-[72px_1fr_130px] items-center gap-3">
      <span className="text-sm font-semibold">{label}</span>
      <input aria-label={label} className="input" type="number" min="0" value={form[numKey]} onChange={(e) => set({ [numKey]: Number(e.target.value) })} />
      <select aria-label={`${label} unit`} className="input" value={form[unitKey]} onChange={(e) => set({ [unitKey]: e.target.value })}>
        {DURATION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );

  return (
    <>
      <Drawer onClose={requestClose} label={isEdit ? 'Edit Job' : 'Create Job'} width="max-w-[650px]">
        <div className="flex items-center gap-3 border-b border-line px-5 py-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-white" aria-hidden="true"><FiBriefcase /></span>
          <div className="flex-1"><h2 className="text-lg font-semibold">{isEdit ? 'Edit Job' : 'Create Job'}</h2><p className="text-xs text-muted">{isEdit ? 'Update this job' : 'Create and configure a new workflow job'}</p></div>
          <button type="button" onClick={requestClose} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-md text-muted hover:bg-subtle hover:text-ink"><FiX /></button>
        </div>

        <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-5">
          {/* Account */}
          {isEdit ? (
            <label className="field-label">Account
              <select className="input" value={form.accountIds[0] || ''} onChange={(e) => set({ accountIds: [e.target.value] })}>
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </label>
          ) : (
            <div>
              <MultiSelect label="Account *" placeholder="Select accounts" options={accounts.map((a) => ({ value: a.id, label: a.name, meta: a.company }))} value={form.accountIds}
                onChange={(v) => set({ accountIds: v })} error={errors.accountIds}
                renderOption={(o) => <span className="flex flex-1 items-center gap-2.5"><Avatar text={initials(o.label)} size="sm" /><span><span className="block font-semibold">{o.label}</span><span className="block text-xs text-muted">{o.meta}</span></span></span>} />
              {form.accountIds.length > 1 && <p className="mt-1.5 text-xs text-muted">A separate job is created for each account.</p>}
            </div>
          )}

          {/* Pipeline + Stage */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="field-label">
              <span>Select Pipeline <span className="text-danger-700">*</span></span>
              <select className={cx('input', errors.pipelineId && 'border-danger-700')} value={form.pipelineId} onChange={(e) => handlePipelineChange(e.target.value)} disabled={isEdit}>
                <option value="">Select pipeline...</option>
                {pipelines.map((p) => <option key={p.id} value={p.id}>{p.pipelineName}</option>)}
              </select>
              {errors.pipelineId && <span className="text-sm font-normal text-danger-700">{errors.pipelineId}</span>}
            </label>
            <label className="field-label">
              <span>Select Stage <span className="text-danger-700">*</span></span>
              <select className={cx('input', errors.stageId && 'border-danger-700')} value={form.stageId} onChange={(e) => set({ stageId: e.target.value })} disabled={!pipeline}>
                <option value="">Select stage...</option>
                {(pipeline?.stages || []).map((s, i) => <option key={s.id} value={s.id}>{i + 1}. {s.name}{s.automations?.length ? ` (⚡ ${s.automations.length})` : ''}</option>)}
              </select>
              {stage?.automations?.length > 0 && <span className="flex items-center gap-1 text-xs font-normal text-warning-700"><FiZap aria-hidden="true" />{stage.automations.length} automation{stage.automations.length > 1 ? 's' : ''} run when a job enters this stage</span>}
              {errors.stageId && <span className="text-sm font-normal text-danger-700">{errors.stageId}</span>}
            </label>
          </div>

          {/* Job template */}
          <label className="field-label">Default job template
            <select className="input" value={form.jobTemplateId || ''} onChange={(e) => handleJobtemp(e.target.value)}>
              <option value="">Select template...</option>
              {jobTemplates.map((t) => <option key={t.id} value={t.id}>{t.templatename}{t.id === pipeline?.defaultjobtemplate ? ' (pipeline default)' : ''}</option>)}
            </select>
            <span className="text-xs font-normal text-muted">Fills in the job details below.</span>
          </label>

          {/* Job name */}
          <div>
            <ShortcodeTextField label="Job Name" required value={form.name} onChange={(v) => set({ name: v })} placeholder="Enter job name" shortcuts={accountShortcuts} error={errors.name} />
            {nameExample && <p className="mt-1.5 text-xs text-muted">For {selectedAccounts[0].name}: <span className="font-semibold text-ink" data-testid="job-name-example">{nameExample}</span></p>}
          </div>

          {/* Assignees + priority */}
          <MultiSelect label="Job Assignees" placeholder="Select assignees" options={TEAM_OPTIONS} value={form.assignees} onChange={(v) => set({ assignees: v })}
            renderOption={(o) => <span className="flex flex-1 items-center gap-2.5"><Avatar text={initials(o.label)} size="sm" /><span className="font-semibold">{o.label}</span></span>} />
          <div>
            <span className="mb-1.5 block text-sm font-semibold">Priority</span>
            <div role="radiogroup" aria-label="Priority" className="flex flex-wrap gap-1.5">
              {TASK_PRIORITIES.map((p) => (
                <button key={p} type="button" role="radio" aria-checked={form.priority === p} onClick={() => set({ priority: p })}
                  className={cx('min-h-[36px] rounded-full px-3.5 text-sm font-semibold ring-offset-2', PRIORITY_STYLE[p], form.priority === p ? 'ring-2 ring-brand-600' : 'opacity-70 hover:opacity-100')}>{p}</button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <span className="mb-1.5 block text-sm font-semibold">Description</span>
            <TextEditor key={form.jobTemplateId || 'none'} ariaLabel="Job description" value={form.description} onChange={(html) => set({ description: html })} shortcuts={accountShortcuts} minHeight={120} />
          </div>

          {/* Dates */}
          <div className="flex flex-col gap-4 rounded-lg border border-line p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold">Start and Due Date</span>
              <span className="flex items-center gap-2 text-sm text-muted"><Toggle label="Absolute Date" checked={form.absoluteDate} onChange={(v) => set({ absoluteDate: v })} /> Absolute Date</span>
            </div>
            {form.absoluteDate ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="field-label">Start Date<input type="date" className="input" value={form.startDate || ''} onChange={(e) => set({ startDate: e.target.value })} /></label>
                <label className="field-label">Due Date
                  <input type="date" className={cx('input', errors.dueDate && 'border-danger-700')} value={form.dueDate || ''} onChange={(e) => set({ dueDate: e.target.value })} />
                  {errors.dueDate && <span className="text-sm font-normal text-danger-700">{errors.dueDate}</span>}
                </label>
              </div>
            ) : (
              <div className="flex flex-col gap-3">{relRow('Start In', 'startsin', 'startsInDuration')}{relRow('Due In', 'duein', 'dueinduration')}</div>
            )}
          </div>

          {/* Client-facing status */}
          <div className="flex flex-col gap-4 border-t border-line pt-5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold">Client-facing status</span>
              <span className="flex items-center gap-2 text-sm text-muted"><Toggle label="Show in Client portal" checked={form.clientFacingStatus} onChange={(v) => set({ clientFacingStatus: v })} /> Show in Client portal</span>
            </div>
            {form.clientFacingStatus && (
              <>
                <ShortcodeTextField label="Job name for client" value={form.inputText} onChange={(v) => set({ inputText: v })} placeholder="Job name for client" shortcuts={accountShortcuts} />
                <StatusSelect label="Status" value={form.selectedJob} onChange={pickStatus} statuses={statuses} error={errors.selectedJob} />
                <ShortcodeTextField label="Description" value={form.clientDescription} onChange={(v) => set({ clientDescription: v })} placeholder="Description"
                  multiline rows={4} maxLength={DESCRIPTION_LIMIT} shortcuts={accountShortcuts} />
              </>
            )}
          </div>

          {/* Automation history (edit) */}
          {isEdit && (job.activity || []).length > 0 && (
            <section aria-label="Automation history" className="rounded-lg border border-line p-4">
              <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold"><FiZap className="text-warning-700" aria-hidden="true" /> Automation history</h3>
              <ul className="flex flex-col gap-1 text-sm">
                {[...job.activity].reverse().map((r, i) => (
                  <li key={i} className={r.ok ? '' : 'text-muted'}>{r.ok ? '✓' : '⚠'} {r.text} <span className="text-xs text-muted">· {new Date(r.at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span></li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <div className="sticky bottom-0 flex justify-end gap-3 border-t border-line bg-surface px-5 py-4">
          <button type="button" className="btn-secondary" onClick={requestClose}>Cancel</button>
          <button type="button" className="btn-primary" onClick={handleSaveJob}>Save</button>
        </div>

        {confirmClose && (
          <Modal title="Discard changes?" onClose={() => setConfirmClose(false)}
            footer={<><button className="btn-secondary" onClick={() => setConfirmClose(false)}>Keep editing</button><button className="btn bg-danger-700 text-white hover:bg-[#831E15]" onClick={onClose}>Discard</button></>}>
            <p className="text-muted">This job hasn't been saved.</p>
          </Modal>
        )}
      </Drawer>

      {review && stage && <AutomationReviewDrawer stage={stage} accounts={selectedAccounts} onBack={() => setReview(false)} onRun={create} />}
    </>
  );
}
