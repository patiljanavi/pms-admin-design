import { useMemo, useState } from 'react';
import { FiInfo, FiTrash2, FiX, FiZap } from 'react-icons/fi';
import MultiSelect from '../../../components/MultiSelect';
import TagChip, { chipStyle } from '../../../components/TagChip';
import { Avatar, Drawer, Modal, cx, initials } from '../../../components/ui';
import AutomationTypeMenu from './AutomationTypeMenu';
import ColorStatusSelect from './ColorStatusSelect';
import { useData } from '../../../context/DataContext';
import { TEAM_MEMBERS } from '../../../data/sampleData';
import { CLIENT_STATUS_DESCRIPTION_LIMIT, automationInfo, newAutomation } from '../../../data/pipelinesdata';
import { statusOptionsFrom, templateOptionsFrom } from '../../../data/statusOptions';

const TEAM_OPTIONS = TEAM_MEMBERS.map((m) => ({ ...m, value: m.label }));
const clone = (o) => JSON.parse(JSON.stringify(o));

/** Template options for an automation type, read from DataContext. */
// export function useAutomationSources() {
//   const data = useData() || {};
//   const statuses = statusOptionsFrom(data.clientFacingJobs ?? data.clientStatuses ?? []);
//   const templatesFor = (type) => {
//     const { source } = automationInfo(type);
//     return source ? templateOptionsFrom(data[source] || []) : [];
//   };
//   return { tags: data.tags || [], tagById: data.tagById || new Map(), statuses, templatesFor };
// }
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
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="font-semibold">{label}</span>
      <input type="number" min="1" className="input min-h-[38px] w-20" value={value} onChange={(e) => onChange(e.target.value)} />
      {suffix && <span className="text-muted">{suffix}</span>}
    </label>
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

  // Client-facing status: fill the description from the chosen status (unless edited by hand)
  // const pickStatus = (i, id) => {
  //   const a = list[i];
  //   const next = statuses.find((s) => String(s.id) === String(id));
  //   const prevText = (statuses.find((s) => String(s.id) === String(a.selectedClientStatus))?.description || '').trim();
  //   const current = (a.clientDescription || '').trim();
  //   const fill = next?.description && (!current || current === prevText);
  //   update(i, { selectedClientStatus: id, ...(fill ? { clientDescription: next.description.slice(0, CLIENT_STATUS_DESCRIPTION_LIMIT) } : {}) });
  // };

// Client-facing status: fill the description from the selected job in DataContext
const pickStatus = (i, id) => {
  const job =
    clientFacingJobs.find((j) => String(j.value) === String(id)) ||
    statuses.find((s) => String(s.id) === String(id));
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
      renderOption={(o) => <span className="flex flex-1 items-center gap-2.5"><Avatar text={initials(o.label)} size="sm" /><span className="font-semibold">{o.label}</span></span>} />
  );

  const renderFields = (a, i) => {
    const info = automationInfo(a.type);
    if (info.source) {
      const options = templatesFor(a.type);
      return (
        <>
          <label className="field-label">Template *
            <select className={cx('input', errors[i] && !a.selectedtemp && 'border-danger-700')} value={a.selectedtemp ?? ''}
              onChange={(e) => { const opt = options.find((o) => String(o.id) === e.target.value); update(i, { selectedtemp: opt ? opt.id : null }); }}>
              <option value="">Select template</option>
              {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
            {options.length === 0 && <span className="text-sm font-normal text-muted">No {a.type.replace(/^(Send|Create|Apply) /, '').toLowerCase()} templates yet.</span>}
          </label>
          {info.reminders && (
            <div className="rounded-md border border-line p-3">
              <label className="flex cursor-pointer items-center gap-2.5 font-semibold">
                <input type="checkbox" checked={!!a.reminderChecked} onChange={(e) => update(i, { reminderChecked: e.target.checked })} className="h-[18px] w-[18px] accent-brand-600" />
                Send reminders until the client acts
              </label>
              {a.reminderChecked && (
                <div className="mt-3 flex flex-wrap gap-4 pl-7">
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
          <p className="flex gap-2 rounded-md bg-subtle p-3 text-sm text-muted"><FiInfo className="mt-0.5 flex-none" aria-hidden="true" />The client-facing status updates as soon as the job enters this stage. Clients see it in their portal.</p>
          <fieldset>
            <legend className="mb-1.5 text-sm font-semibold">Visibility for client</legend>
            <div className="flex gap-5">
              {[[true, 'Show status'], [false, 'Hide status']].map(([v, l]) => (
                <label key={l} className="flex cursor-pointer items-center gap-2">
                  <input type="radio" name={`vis-${a.id}`} checked={a.status === v} onChange={() => update(i, { status: v })} className="h-[18px] w-[18px] accent-brand-600" />{l}
                </label>
              ))}
            </div>
          </fieldset>
          {a.status && (
            <>
              <ColorStatusSelect label="Select status" value={a.selectedClientStatus} onChange={(id) => pickStatus(i, id)} statuses={statuses}
                error={errors[i] && !a.selectedClientStatus ? errors[i] : undefined} />
              <label className="field-label">Status description for client
                <textarea className="input min-h-[90px] py-2.5" maxLength={CLIENT_STATUS_DESCRIPTION_LIMIT} value={a.clientDescription}
                  onChange={(e) => update(i, { clientDescription: e.target.value })} placeholder="Status description for client" />
                <span className="text-right text-xs font-normal text-muted">{(a.clientDescription || '').length}/{CLIENT_STATUS_DESCRIPTION_LIMIT}</span>
              </label>
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
    <Drawer onClose={requestClose} label={`Automations for stage ${stageNumber}`} width="max-w-[700px]">
      <div className="flex items-center gap-4 border-b border-line p-5 sm:p-6">
        <span className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-brand-600 text-white" aria-hidden="true"><FiZap size={20} /></span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-xl font-bold">{isEdit ? 'Edit automations' : 'Add automations'}</h2>
          <div className="truncate text-muted">Stage {stageNumber}{stageName ? ` · ${stageName}` : ''} — run when a job enters this stage</div>
        </div>
        <button onClick={requestClose} aria-label="Close" className="flex h-10 w-10 flex-none items-center justify-center rounded text-muted hover:bg-subtle"><FiX size={20} /></button>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5 sm:p-6">
        {list.length === 0 && <p className="rounded-md border border-dashed border-line-strong p-8 text-center text-muted">No automations yet. Add one below.</p>}
        {list.map((a, i) => (
          <section key={a.id} aria-label={`Automation ${i + 1}: ${a.type}`} className={cx('rounded-lg border p-4', errors[i] ? 'border-danger-700' : 'border-line')}>
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">{i + 1}</span>
              <h3 className="flex-1 font-semibold">{a.type}</h3>
              <button type="button" onClick={() => remove(i)} aria-label={`Delete automation ${i + 1}`} className="flex h-8 w-8 items-center justify-center rounded text-danger-700 hover:bg-danger-50"><FiTrash2 aria-hidden="true" /></button>
            </div>
            <div className="flex flex-col gap-4">
              {renderFields(a, i)}
              {tagSelect('Only for accounts with these tags (optional)', a.selectedTags, (v) => update(i, { selectedTags: v }), [], 'Any account')}
              {errors[i] && <p role="alert" className="text-sm font-semibold text-danger-700">{errors[i]}</p>}
            </div>
          </section>
        ))}
        <AutomationTypeMenu label={list.length ? 'Add another automation' : 'Add automation'} onPick={add} />
      </div>

      <div className="sticky bottom-0 flex justify-end gap-2.5 border-t border-line bg-subtle px-5 py-4 sm:px-6">
        <button type="button" className="btn-secondary" onClick={requestClose}>Cancel</button>
        <button type="button" className="btn-primary" onClick={save}>{isEdit ? `Update automations (${list.length})` : `Save automations (${list.length})`}</button>
      </div>

      {confirmClose && (
        <Modal title="Discard changes?" onClose={() => setConfirmClose(false)}
          footer={<><button className="btn-secondary" onClick={() => setConfirmClose(false)}>Keep editing</button><button className="btn bg-danger-700 text-white hover:bg-[#831E15]" onClick={onClose}>Discard</button></>}>
          <p className="text-muted">Your changes to these automations haven't been saved.</p>
        </Modal>
      )}
    </Drawer>
  );
}
