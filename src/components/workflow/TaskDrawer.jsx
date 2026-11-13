import { useMemo, useState,useEffect } from 'react';
import { CalendarIcon, CheckSquare, ListChecks, Plus, Trash2 } from 'lucide-react';
import MultiSelect from '../MultiSelect';
import TextEditor from '../TextEditor';
import SettingsCard, { DrawerLayout, Field } from '../organizer/SettingsCard';
import { Avatar, Drawer, initials } from '../ui';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from '../ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../ui/alert-dialog';
import { cn } from 'lib/utils';
import * as sonner from '../ui/sonner';
import { useData } from '../../context/DataContext';
import { TEAM_MEMBERS } from '../../data/sampleData';
import { TASK_PRIORITIES } from '../../data/taskTemplates';
import { TASK_STATUSES, emptyTask, fromTaskTemplate, statusBadgeStyle, subtaskId } from '../../data/accountTasks';

const NONE = '__none';
const { ToastBridge } = sonner;
/** A message that stays visible after the drawer closes (sonner's global toast). */
// const showToast = (text) => {
//   const t = sonner.toast;
//   if (t && typeof t.success === 'function') t.success(text);
//   else if (typeof t === 'function') t(text);
// };
/* 'YYYY-MM-DD' ⇄ Date in local time */
const toDate = (iso) => (iso ? new Date(`${iso}T00:00:00`) : undefined);
const toIso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const showDate = (iso) => toDate(iso).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });

/** A task status as a coloured badge (your status colours, with readable text). */
export function TaskStatusBadge({ status, className }) {
  return <Badge variant="outline" style={statusBadgeStyle(status)} className={cn('whitespace-nowrap border-transparent', className)}>{status}</Badge>;
}

/** Date field: shadcn Popover + Calendar. */
function DateField({ id, label, value, onChange, error }) {
  const [open, setOpen] = useState(false);
  return (
    <Field label={label} htmlFor={id} error={error}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button id={id} type="button" variant="outline" aria-invalid={!!error} aria-label={`${label}: ${value ? showDate(value) : 'not set'}`}
            className={cn('w-full justify-start text-left font-normal', !value && 'text-muted-foreground', error && 'border-danger-700')}>
            <CalendarIcon aria-hidden="true" />{value ? showDate(value) : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={toDate(value)} defaultMonth={toDate(value)} onSelect={(d) => { if (d) { onChange(toIso(d)); setOpen(false); } }} initialFocus />
        </PopoverContent>
      </Popover>
    </Field>
  );
}

/**
 * Create / Edit Task drawer (same layout as Create organizer / Create invoice).
 * Fields: Account · Select Job (this account's jobs, by pipeline) · Select Template · Status · Priority · Task Name ·
 * Assignees · Description · Tags · Start Date · Due Date · Subtasks.
 * Props: task (edit) · accountId / jobId (presets) · onClose()
 *   onSave(form)  — optional: you save it yourself
 *   without onSave the drawer saves with DataContext (createTask / updateTask), then calls
 *   onSaved(task, { created }) and closes. The success message goes to onDone(message) if given,
 *   otherwise the drawer shows it itself (sonner toast). While open, messages show through ToastBridge.
 */
export default function TaskDrawer({ task = null, accountId = '', jobId = '', onSave, onSaved, onDone, onClose }) {
  const { accounts = [], jobs = [], pipelines = [], taskTemplates = [], tags = [], createTask, updateTask } = useData();
  const isEdit = !!task;
  const [form, setForm] = useState(() => (task ? { ...emptyTask(), ...task } : { ...emptyTask(), accountId, jobId }));
  const [initial] = useState(() => JSON.stringify(form));
  const [errors, setErrors] = useState({});
  const [confirmClose, setConfirmClose] = useState(false);
 
  const set = (changes) => { setForm((f) => ({ ...f, ...changes })); setErrors((e) => { const n = { ...e }; Object.keys(changes).forEach((k) => delete n[k]); return n; }); };
  // inside TaskDrawer, next to the other useState lines
  const [toast, setToast] = useState('');
  const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 2600); };
  const [closing, setClosing] = useState(false);
  useEffect(() => { if (closing) onClose?.(); }, [closing]); // eslint-disable-line react-hooks/exhaustive-deps
  // the chosen account's jobs, grouped by pipeline
  const jobGroups = useMemo(() => pipelines.map((p) => ({ pipeline: p, items: jobs.filter((j) => j.accountId === form.accountId && j.pipelineId === p.id) }))
    .filter((g) => g.items.length), [jobs, pipelines, form.accountId]);
  const pickAccount = (id) => set({ accountId: id, ...(jobs.some((j) => j.id === form.jobId && j.accountId === id) ? {} : { jobId: '' }) });
  const pickTemplate = (id) => { const t = taskTemplates.find((x) => x.id === id); set(t ? fromTaskTemplate(t) : { templateId: '' }); };
  const setSub = (id, changes) => set({ subtasks: form.subtasks.map((s) => (s.id === id ? { ...s, ...changes } : s)) });
  const addSub = () => set({ subtasks: [...form.subtasks, { id: subtaskId(), text: '', checked: false }] });

   const handleSave = () => {
    const e = {};
    if (!form.accountId) e.accountId = 'Choose an account.';
    if (!form.name.trim()) e.name = 'Task name is required.';
    if (form.startDate && form.dueDate && form.dueDate < form.startDate) e.dueDate = 'Due date must be on or after the start date.';
    setErrors(e);
    if (Object.keys(e).length) { notify('Please fix the highlighted fields.'); return; }
    if (typeof onSave === 'function') { onSave(form); return; }        // the page saves it
    const rec = isEdit ? updateTask(form) : createTask(form);           // or save with DataContext
    onSaved?.(rec, { created: !isEdit });
    notify(isEdit ? `Updated “${rec.name}”` : `Created “${rec.name}”`);  // ToastBridge shows it
    setClosing(true);                                                    // then the drawer closes
  };
  const handleClose = () => (JSON.stringify(form) !== initial ? setConfirmClose(true) : onClose());
  const title = isEdit ? 'Edit Task' : 'Create Task';
  const done = form.subtasks.filter((s) => s.checked).length;

  return (
    <>
      <Drawer onClose={handleClose} label={title} width="max-w-[650px]">
        <DrawerLayout icon={CheckSquare} title={title} description={isEdit ? form.name : 'Add a task for an account, or start from a template'} onClose={handleClose}
          footer={<>
            <Button variant="outline" onClick={handleClose}>Cancel</Button>
            <Button onClick={handleSave}>{isEdit ? 'Update Task' : 'Create Task'}</Button>
          </>}>
          <div className="flex flex-col gap-5">
            {/* Account */}
            <Field label="Account" required error={errors.accountId}>
              <Select value={form.accountId || undefined} onValueChange={pickAccount}>
                <SelectTrigger aria-label="Account" aria-invalid={!!errors.accountId} className={cn(errors.accountId && 'border-danger-700')}><SelectValue placeholder="Select an account" /></SelectTrigger>
                <SelectContent>{accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>

            {/* Job: this account's jobs, grouped by pipeline */}
            <Field label="Select Job">
              <Select value={form.jobId || NONE} onValueChange={(v) => set({ jobId: v === NONE ? '' : v })} disabled={!form.accountId}>
                <SelectTrigger aria-label="Job"><SelectValue placeholder="Select Job" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>No job</SelectItem>
                  {jobGroups.map((g) => (
                    <SelectGroup key={g.pipeline.id}>
                      <SelectSeparator />
                      <SelectLabel className="text-xs uppercase tracking-wide text-muted-foreground">{g.pipeline.pipelineName}</SelectLabel>
                      {g.items.map((j) => <SelectItem key={j.id} value={j.id}>{j.name}</SelectItem>)}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{!form.accountId ? 'Choose an account first.' : !jobGroups.length ? 'This account has no jobs.' : 'Only this account’s jobs are listed.'}</p>
            </Field>

            {/* Template */}
            <Field label="Select Template">
              <Select value={form.templateId || NONE} onValueChange={(v) => pickTemplate(v === NONE ? '' : v)}>
                <SelectTrigger aria-label="Template"><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>None</SelectItem>
                  {taskTemplates.length > 0 && <SelectSeparator />}
                  {taskTemplates.map((t) => <SelectItem key={t.id} value={t.id}>{t.templatename}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Fills in the name, priority, assignees, tags, description, dates and subtasks.</p>
            </Field>

            {/* Status · Priority */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Status">
                <Select value={form.status} onValueChange={(v) => set({ status: v })}>
                  <SelectTrigger aria-label="Status"><SelectValue><TaskStatusBadge status={form.status} /></SelectValue></SelectTrigger>
                  <SelectContent>{TASK_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}><TaskStatusBadge status={s.value} /></SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Priority">
                <Select value={form.priority} onValueChange={(v) => set({ priority: v })}>
                  <SelectTrigger aria-label="Priority"><SelectValue /></SelectTrigger>
                  <SelectContent>{TASK_PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            </div>

            {/* Task Name */}
            <Field label="Task Name" htmlFor="task-name" required error={errors.name}>
              <Input id="task-name" value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="Task Name" aria-invalid={!!errors.name} className={cn(errors.name && 'border-danger-700')} />
            </Field>

            {/* Assignees */}
            <MultiSelect label="Assignees" placeholder="Assignees" options={TEAM_MEMBERS.map((m) => ({ value: m.label, label: m.label }))} value={form.assignees}
              onChange={(v) => set({ assignees: v })}
              renderOption={(o) => <span className="flex flex-1 items-center gap-2.5"><Avatar text={initials(o.label)} size="sm" /><span className="font-medium">{o.label}</span></span>} />

            {/* Description */}
            <Field label="Description">
              <TextEditor key={form.templateId || 'none'} ariaLabel="Task description" value={form.description} onChange={(html) => set({ description: html })} minHeight={110} />
            </Field>

            {/* Tags */}
            <MultiSelect label="Tags" placeholder="Tags" options={tags.map((t) => ({ value: t.value, label: t.label }))} value={form.tags} onChange={(v) => set({ tags: v })} emptyText="No tags" />

            {/* Dates */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DateField id="task-start" label="Start Date" value={form.startDate} onChange={(v) => set({ startDate: v })} />
              <DateField id="task-due" label="Due Date" value={form.dueDate} onChange={(v) => set({ dueDate: v })} error={errors.dueDate} />
            </div>

            {/* Subtasks */}
            <SettingsCard icon={ListChecks} title="Subtasks" help={form.subtasksOn && form.subtasks.length ? `${done} of ${form.subtasks.length} done` : 'Break the task into a checklist'}
              checked={form.subtasksOn} onChange={(v) => set({ subtasksOn: v, ...(v && !form.subtasks.length ? { subtasks: [{ id: subtaskId(), text: '', checked: false }] } : {}) })}>
              <div className="flex flex-col gap-2">
                {form.subtasks.map((s, i) => (
                  <div key={s.id} className="flex items-center gap-2">
                    <Checkbox checked={!!s.checked} onCheckedChange={(v) => setSub(s.id, { checked: !!v })} aria-label={`Subtask ${i + 1} done`} />
                    <Input value={s.text} aria-label={`Subtask ${i + 1}`} placeholder="Subtask" onChange={(e) => setSub(s.id, { text: e.target.value })}
                      className={cn(s.checked && 'text-muted-foreground line-through')} />
                    <Button type="button" variant="ghost" size="icon" aria-label={`Delete subtask ${i + 1}`} onClick={() => set({ subtasks: form.subtasks.filter((x) => x.id !== s.id) })}><Trash2 /></Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" className="self-start" onClick={addSub}><Plus />Add Subtask</Button>
              </div>
            </SettingsCard>
          </div>
        </DrawerLayout>
      </Drawer>

      {/* Discard changes? */}
      <AlertDialog open={confirmClose} onOpenChange={setConfirmClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>This task hasn’t been saved.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={onClose}>Discard</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* messages while the drawer is open */}
<ToastBridge message={toast} />    </>
  );
}