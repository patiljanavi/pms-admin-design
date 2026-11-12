import { useId, useMemo, useState } from 'react';
import { CircleAlert, Eye, EyeOff, Info, Trash2, Zap } from 'lucide-react';
import MultiSelect from '../../../components/MultiSelect';
import TagChip, { chipStyle } from '../../../components/TagChip';
import { Avatar, CloseButton, Drawer, Modal, initials } from '../../../components/ui';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Switch } from '../../../components/ui/switch';
import { Textarea } from '../../../components/ui/textarea';
import { SimpleTooltip } from '../../../components/ui/tooltip';
import { cn } from 'lib/utils';
import AutomationTypeMenu, { automationIcon } from './AutomationTypeMenu';
import ColorStatusSelect from './ColorStatusSelect';
import { useData } from '../../../context/DataContext';
import { TEAM_MEMBERS } from '../../../data/sampleData';
import { CLIENT_STATUS_DESCRIPTION_LIMIT, automationInfo, newAutomation } from '../../../data/pipelinesdata';
import { statusOptionsFrom, templateOptionsFrom } from '../../../data/statusOptions';

const TEAM_OPTIONS = TEAM_MEMBERS.map((m) => ({ ...m, value: m.label }));
const clone = (o) => JSON.parse(JSON.stringify(o));

/** Template options for an automation type, read from DataContext. */
export function useAutomationSources() {
  const data = useData() || {};
  const clientFacingJobs = data.clientFacingJobs || [];
  const statuses = statusOptionsFrom(clientFacingJobs);
  const templatesFor = (type) => {
    const { source } = automationInfo(type);
    return source ? templateOptionsFrom(data[source] || []) : [];
  };
  return { tags: data.tags || [], tagById: data.tagById || new Map(), statuses, clientFacingJobs, templatesFor };
}

function NumberField({ label, value, onChange, suffix }) {
  const id = useId();
  return (
    <div className="flex items-center gap-2 text-sm">
      <Label htmlFor={id} className="font-normal text-muted-foreground">{label}</Label>
      <Input id={id} type="number" min="1" className="h-8 w-16 text-center tabular-nums" value={value} onChange={(e) => onChange(e.target.value)} />
      {suffix && <span className="text-muted-foreground">{suffix}</span>}
    </div>
  );
}

/** Icon tile for an automation type. */
export function AutomationIcon({ type, className }) {
  const Icon = automationIcon(type);
  return (
    <span className={cn('inline-flex size-8 flex-none items-center justify-center rounded-lg border border-brand-100 bg-brand-50 text-brand-700 [&_svg]:size-4', className)} aria-hidden="true">
      <Icon />
    </span>
  );
}

/**
 * Drawer to add / edit the automations of one stage.
 * Props: stageNumber · stageName · automations (what the drawer starts with) · saved (the stage's saved automations) · onSave(list) · onClose()
 */
export default function AutomationDrawer({ stageNumber, stageName, automations: initialList = [], saved, onSave, onClose }) {
  const savedList = saved ?? initialList;
  const isEdit = savedList.length > 0;
  const { tags, statuses, clientFacingJobs, templatesFor } = useAutomationSources();
  const [list, setList] = useState(() => clone(initialList));
  const [errors, setErrors] = useState({});
  const [confirmClose, setConfirmClose] = useState(false);
  const dirty = JSON.stringify(list) !== JSON.stringify(savedList);
  const tagOptions = useMemo(() => tags, [tags]);

  const update = (i, changes) => {
    setList((l) => l.map((a, j) => (j === i ? { ...a, ...changes } : a)));
    setErrors((e) => ({ ...e, [i]: undefined }));
  };
  const add = (type) => setList((l) => [...l, newAutomation(type)]);
  const remove = (i) => { setList((l) => l.filter((_, j) => j !== i)); setErrors({}); };
  const requestClose = () => (dirty ? setConfirmClose(true) : onClose());

  // Client-facing status: fill the description from the selected job in DataContext
  const pickStatus = (i, id) => {
    const job = clientFacingJobs.find((j) => String(j.value) === String(id))
      || statuses.find((s) => String(s.id) === String(id));
    update(i, {
      selectedClientStatus: id,
      clientDescription: (job?.description || '').slice(0, CLIENT_STATUS_DESCRIPTION_LIMIT),
    });
  };

  const validate = () => {
    const e = {};
    list.forEach((a, i) => {
      const info = automationInfo(a.type);
      if (info.source && !a.selectedtemp) e[i] = 'Choose a template.';
      if (a.type === 'Update client-facing job status' && a.status && !a.selectedClientStatus) e[i] = 'Choose the status clients will see.';
      if (a.type === 'Update account tags' && !a.addTags.length && !a.removeTags.length) e[i] = 'Pick tags to add or remove.';
      if (a.type === 'Update job assignees' && !a.selectedAssignees.length && !a.assigneesToRemove.length) e[i] = 'Pick assignees to add or remove.';
      if (info.reminders && a.reminderChecked && (!(Number(a.daysuntilNextReminder) > 0) || !(Number(a.noOfReminder) > 0))) e[i] = 'Reminders need a number of days and a count.';
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  const save = () => {
    if (!validate()) return;
    onSave(list.map((a, i) => ({
      ...a, index: i + 1, refModel: automationInfo(a.type).refModel || null,
      daysuntilNextReminder: Number(a.daysuntilNextReminder) || 0, noOfReminder: Number(a.noOfReminder) || 0,
      clientDescription: a.status ? a.clientDescription : '',
      selectedClientStatus: a.status ? a.selectedClientStatus : null,
    })));
  };

  const tagSelect = (label, value, onChange, exclude = [], placeholder = 'Select tags') => (
    <MultiSelect label={label} placeholder={placeholder} options={tagOptions.filter((t) => !exclude.includes(t.value))} value={value}
      onChange={onChange} chipStyle={(o) => chipStyle(o.color)} renderOption={(o) => <TagChip tag={o} />} emptyText="No tags" />
  );
  const teamSelect = (label, value, onChange, exclude = []) => (
    <MultiSelect label={label} placeholder="Select team members" options={TEAM_OPTIONS.filter((m) => !exclude.includes(m.value))} value={value} onChange={onChange}
      renderOption={(o) => <span className="flex flex-1 items-center gap-2.5"><Avatar text={initials(o.label)} size="xs" /><span className="font-medium">{o.label}</span></span>} />
  );

  const renderFields = (a, i) => {
    const info = automationInfo(a.type);
    if (info.source) {
      const options = templatesFor(a.type);
      const current = options.find((o) => String(o.id) === String(a.selectedtemp));
      const missing = errors[i] && !a.selectedtemp;
      return (
        <>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`tpl-${a.id}`}>Template <span className="text-danger-700">*</span></Label>
            <Select value={current ? String(current.id) : ''} disabled={options.length === 0}
              onValueChange={(v) => { const opt = options.find((o) => String(o.id) === v); update(i, { selectedtemp: opt ? opt.id : null }); }}>
              <SelectTrigger id={`tpl-${a.id}`} aria-invalid={!!missing} className={cn(missing && 'border-destructive')}>
                <SelectValue placeholder="Select template" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {options.map((o) => <SelectItem key={o.id} value={String(o.id)}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
            {options.length === 0 && <p className="text-xs text-muted-foreground">No {a.type.replace(/^(Send|Create|Apply) /, '').toLowerCase()} templates yet.</p>}
          </div>
          {info.reminders && (
            <div className="rounded-lg border bg-subtle/60 p-3">
              <div className="flex items-start justify-between gap-3">
                <Label htmlFor={`rem-${a.id}`} className="flex cursor-pointer flex-col gap-1 leading-snug">
                  Send reminders until the client acts
                  <span className="text-xs font-normal text-muted-foreground">Follow up automatically if nothing happens.</span>
                </Label>
                <Switch id={`rem-${a.id}`} checked={!!a.reminderChecked} onCheckedChange={(v) => update(i, { reminderChecked: v })} />
              </div>
              {a.reminderChecked && (
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 border-t pt-3">
                  <NumberField label="Every" value={a.daysuntilNextReminder} onChange={(v) => update(i, { daysuntilNextReminder: v })} suffix="days" />
                  <NumberField label="Up to" value={a.noOfReminder} onChange={(v) => update(i, { noOfReminder: v })} suffix="reminders" />
                </div>
              )}
            </div>
          )}
        </>
      );
    }
    if (a.type === 'Update client-facing job status') {
      return (
        <>
          <p className="flex gap-2 rounded-lg border border-brand-100 bg-brand-50 p-3 text-sm text-brand-700">
            <Info className="mt-0.5 size-4 flex-none" aria-hidden="true" />The client-facing status updates as soon as the job enters this stage. Clients see it in their portal.
          </p>
          <fieldset>
            <legend className="mb-1.5 text-sm font-medium">Visibility for client</legend>
            <div role="radiogroup" className="grid grid-cols-2 gap-2">
              {[[true, 'Show status', Eye], [false, 'Hide status', EyeOff]].map(([v, l, Icon]) => {
                const on = a.status === v;
                return (
                  <label key={l} className={cn('flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors focus-within:ring-2 focus-within:ring-ring/50',
                    on ? 'border-primary/50 bg-brand-50 text-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground')}>
                    <input type="radio" name={`vis-${a.id}`} checked={on} onChange={() => update(i, { status: v })} className="sr-only" />
                    <span className={cn('grid size-4 flex-none place-content-center rounded-full border bg-card', on ? 'border-primary' : 'border-line-strong')}>
                      {on && <span className="size-2 rounded-full bg-primary" />}
                    </span>
                    <Icon className="size-4" aria-hidden="true" />{l}
                  </label>
                );
              })}
            </div>
          </fieldset>
          {a.status && (
            <>
              <ColorStatusSelect label="Select status" value={a.selectedClientStatus} onChange={(id) => pickStatus(i, id)} statuses={statuses}
                error={errors[i] && !a.selectedClientStatus ? errors[i] : undefined} />
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`desc-${a.id}`}>Status description for client</Label>
                <Textarea id={`desc-${a.id}`} className="min-h-[88px] resize-y" maxLength={CLIENT_STATUS_DESCRIPTION_LIMIT} value={a.clientDescription}
                  onChange={(e) => update(i, { clientDescription: e.target.value })} placeholder="Status description for client" />
                <span className="self-end text-xs tabular-nums text-muted-foreground">{(a.clientDescription || '').length}/{CLIENT_STATUS_DESCRIPTION_LIMIT}</span>
              </div>
            </>
          )}
        </>
      );
    }
    if (a.type === 'Update account tags') {
      return (
        <>
          {tagSelect('Add tags', a.addTags, (v) => update(i, { addTags: v }), a.removeTags, 'Select tags to ADD')}
          {tagSelect('Remove tags', a.removeTags, (v) => update(i, { removeTags: v }), a.addTags, 'Select tags to REMOVE')}
        </>
      );
    }
    if (a.type === 'Update job assignees') {
      return (
        <>
          {teamSelect('Add job assignees', a.selectedAssignees, (v) => update(i, { selectedAssignees: v }), a.assigneesToRemove)}
          {teamSelect('Remove job assignees', a.assigneesToRemove, (v) => update(i, { assigneesToRemove: v }), a.selectedAssignees)}
        </>
      );
    }
    return null;
  };

  return (
    <Drawer onClose={requestClose} label={`Automations for stage ${stageNumber}`} width="max-w-[640px]">
      <div className="flex min-h-0 flex-1 flex-col">
        {/* Header */}
        <div className="flex flex-none items-start gap-3 border-b px-6 py-4">
          <span className="mt-0.5 inline-flex size-9 flex-none items-center justify-center rounded-lg border border-brand-100 bg-brand-50 text-brand-700" aria-hidden="true"><Zap className="size-4" /></span>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-semibold tracking-tight">{isEdit ? 'Edit automations' : 'Add automations'}</h2>
            <p className="truncate text-sm text-muted-foreground">Stage {stageNumber}{stageName ? ` · ${stageName}` : ''} — run when a job enters this stage</p>
          </div>
          <CloseButton onClick={requestClose} />
        </div>

        {/* Body */}
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-6 py-5">
          {list.length === 0 && (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-10 text-center">
              <span className="inline-flex size-10 items-center justify-center rounded-xl border bg-card text-muted-foreground shadow-card"><Zap className="size-5" aria-hidden="true" /></span>
              <p className="text-sm font-medium">No automations yet</p>
              <p className="max-w-xs text-sm text-muted-foreground">Add one below to send emails, create tasks or update the job when it reaches this stage.</p>
            </div>
          )}
          {list.map((a, i) => (
            <section key={a.id} aria-label={`Automation ${i + 1}: ${a.type}`}
              className={cn('rounded-xl border bg-card shadow-xs transition-colors', errors[i] ? 'border-danger-200 ring-1 ring-danger-200' : '')}>
              <div className="flex items-center gap-3 border-b px-4 py-3">
                <AutomationIcon type={a.type} />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium tabular-nums text-muted-foreground">Step {i + 1}</div>
                  <h3 className="truncate text-sm font-semibold">{a.type}</h3>
                </div>
                <SimpleTooltip label="Delete automation">
                  <Button type="button" variant="ghost" size="icon-sm" onClick={() => remove(i)} aria-label={`Delete automation ${i + 1}`}
                    className="text-muted-foreground hover:bg-danger-50 hover:text-danger-700"><Trash2 /></Button>
                </SimpleTooltip>
              </div>
              <div className="flex flex-col gap-4 p-4">
                {renderFields(a, i)}
                {tagSelect('Only for accounts with these tags (optional)', a.selectedTags, (v) => update(i, { selectedTags: v }), [], 'Any account')}
                {errors[i] && (
                  <p role="alert" className="flex items-center gap-1.5 text-sm font-medium text-danger-700"><CircleAlert className="size-4 flex-none" aria-hidden="true" />{errors[i]}</p>
                )}
              </div>
            </section>
          ))}
          <AutomationTypeMenu label={list.length ? 'Add another automation' : 'Add automation'} onPick={add} />
        </div>

        {/* Footer */}
        <div className="flex flex-none flex-wrap items-center gap-2 border-t bg-subtle px-6 py-3.5">
          <div className="mr-auto flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="neutral" className="tabular-nums">{list.length} {list.length === 1 ? 'automation' : 'automations'}</Badge>
            {dirty && <Badge variant="warning" dot>Unsaved</Badge>}
          </div>
          <Button type="button" variant="outline" onClick={requestClose}>Cancel</Button>
          <Button type="button" onClick={save}>{isEdit ? `Update automations (${list.length})` : `Save automations (${list.length})`}</Button>
        </div>
      </div>

      {confirmClose && (
        <Modal title="Discard changes?" description="Your changes to these automations haven't been saved." onClose={() => setConfirmClose(false)}
          footer={<><Button variant="outline" onClick={() => setConfirmClose(false)}>Keep editing</Button><Button variant="destructive" onClick={onClose}>Discard</Button></>}>
          <p className="text-sm text-muted-foreground">If you leave now, the automations for stage {stageNumber} go back to how they were.</p>
        </Modal>
      )}
    </Drawer>
  );
}
