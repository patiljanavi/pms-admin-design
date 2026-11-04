import { Fragment, useState } from 'react';
import { FiChevronLeft, FiChevronRight, FiEdit2, FiMenu, FiPlus, FiTrash2 } from 'react-icons/fi';
import MultiSelect from '../../../components/MultiSelect';
import TagChip, { chipStyle } from '../../../components/TagChip';
import { Toggle, cx } from '../../../components/ui';
import AutomationDrawer, { useAutomationSources } from './AutomationDrawer';
import AutomationTypeMenu from './AutomationTypeMenu';
import { automationInfo, newAutomation, newStage } from '../../../data/pipelinesdata';

/** Short, readable summary of one saved automation (shown on the stage card). */
function AutomationSummary({ a, n, sources, onDelete }) {
  const { tagById, statuses, templatesFor } = sources;
  const info = automationInfo(a.type);
  const template = info.source ? templatesFor(a.type).find((o) => String(o.id) === String(a.selectedtemp)) : null;
  const status = statuses.find((s) => String(s.id) === String(a.selectedClientStatus));
  const tagChips = (ids) => (ids || []).map((id) => tagById.get(id)).filter(Boolean).map((t) => <TagChip key={t.value} tag={t} size="xs" />);
  return (
    <li className="rounded-md border border-line bg-subtle/60 p-2.5 text-sm">
      <div className="flex items-start gap-2">
        <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-brand-600 text-[11px] font-bold text-white">{n}</span>
        <span className="flex-1 font-semibold leading-5">{a.type}</span>
        <button type="button" onClick={onDelete} aria-label={`Delete automation ${n} (${a.type})`} className="flex h-6 w-6 items-center justify-center rounded text-danger-700 hover:bg-danger-50"><FiTrash2 size={13} aria-hidden="true" /></button>
      </div>
      <div className="mt-1.5 flex flex-col gap-1 pl-7 text-xs text-muted">
        {info.source && <span className="truncate">{template ? <span className="font-semibold text-ink">{template.label}</span> : <span className="text-warning-700">Template not found</span>}</span>}
        {a.reminderChecked && <span>Reminds every {a.daysuntilNextReminder} days, up to {a.noOfReminder} times</span>}
        {a.type === 'Update client-facing job status' && (a.status
          ? (status ? <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: status.color }} /><span className="font-semibold text-ink">{status.name}</span> · visible to client</span> : <span className="text-warning-700">Status not found</span>)
          : <span>Hidden from client</span>)}
        {a.type === 'Update account tags' && (
          <>
            {a.addTags?.length > 0 && <span className="flex flex-wrap items-center gap-1"><span className="font-semibold text-success-700">Add:</span>{tagChips(a.addTags)}</span>}
            {a.removeTags?.length > 0 && <span className="flex flex-wrap items-center gap-1"><span className="font-semibold text-danger-700">Remove:</span>{tagChips(a.removeTags)}</span>}
          </>
        )}
        {a.type === 'Update job assignees' && (
          <>
            {a.selectedAssignees?.length > 0 && <span><span className="font-semibold text-success-700">Add:</span> {a.selectedAssignees.join(', ')}</span>}
            {a.assigneesToRemove?.length > 0 && <span><span className="font-semibold text-danger-700">Remove:</span> {a.assigneesToRemove.join(', ')}</span>}
          </>
        )}
        {a.selectedTags?.length > 0 && <span className="flex flex-wrap items-center gap-1">Only for: {tagChips(a.selectedTags)}</span>}
      </div>
    </li>
  );
}

/**
 * Stages of a pipeline: a horizontal row of stage cards.
 * Props: stages · onChange(stages) · stageErrors (array of messages, by index)
 */
export default function StagesSection({ stages, onChange, stageErrors = [] }) {
  const sources = useAutomationSources();
  const [drawer, setDrawer] = useState(null);      // { index, automations } while editing a stage's automations
  const [dragIndex, setDragIndex] = useState(null);

  const setStage = (i, changes) => onChange(stages.map((s, j) => (j === i ? { ...s, ...changes } : s)));
  const addStage = (at) => { const list = [...stages]; list.splice(at, 0, newStage()); onChange(list); };
  const deleteStage = (i) => onChange(stages.filter((_, j) => j !== i));
  const moveStage = (from, to) => {
    if (from == null || to < 0 || to >= stages.length || from === to) return;
    const list = [...stages];
    const [item] = list.splice(from, 1);
    list.splice(to, 0, item);
    onChange(list);
  };
  const openAutomations = (i, startWithType) => setDrawer({
    index: i,
    automations: startWithType ? [...stages[i].automations, newAutomation(startWithType)] : stages[i].automations,
    original: stages[i].automations,
  });

  return (
    <section className="card p-5 sm:p-6" aria-labelledby="stages-heading">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="stages-heading" className="text-lg font-semibold">Stages</h2>
          <p className="text-sm text-muted">Jobs move left to right. A pipeline needs at least 2 stages. Drag ☰ or use ‹ › to reorder.</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => addStage(stages.length)}><FiPlus aria-hidden="true" /> Add stage</button>
      </div>

      {stages.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-lg border-2 border-dashed border-line-strong p-10 text-center text-muted">
          No stages yet.
          <button type="button" className="btn-secondary" onClick={() => onChange([newStage('To do'), newStage('Done')])}>Start with “To do” and “Done”</button>
        </div>
      )}

      <ol aria-label="Pipeline stages" className="flex gap-3 overflow-x-auto pb-3">
        {stages.map((stage, i) => {
          const first = i === 0;
          const last = i === stages.length - 1;
          return (
            <Fragment key={stage.id}>
              <li aria-label={`Stage ${i + 1}`} draggable onDragStart={() => setDragIndex(i)} onDragEnd={() => setDragIndex(null)}
                onDragOver={(e) => e.preventDefault()} onDrop={() => { moveStage(dragIndex, i); setDragIndex(null); }}
                className={cx('flex max-h-[560px] w-[300px] flex-none flex-col rounded-lg border bg-surface shadow-card',
                  dragIndex === i ? 'border-brand-600 opacity-60' : stageErrors[i] ? 'border-danger-700' : 'border-line')}>
                {/* header */}
                <div className="border-b border-line p-3">
                  <div className="flex items-center gap-1.5">
                    <span className="flex h-8 w-6 cursor-grab items-center justify-center text-muted" title="Drag to reorder" aria-hidden="true"><FiMenu /></span>
                    <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-subtle px-1.5 text-xs font-bold text-muted">{i + 1}</span>
                    <input value={stage.name} onChange={(e) => setStage(i, { name: e.target.value })} placeholder="Stage name" aria-label={`Stage ${i + 1} name`}
                      className={cx('min-h-[36px] min-w-0 flex-1 rounded border bg-transparent px-2 font-semibold focus:border-brand-600 focus:outline-none', stageErrors[i] ? 'border-danger-700' : 'border-transparent hover:border-line')} />
                  </div>
                  {stageErrors[i] && <p className="mt-1 pl-8 text-xs font-semibold text-danger-700">{stageErrors[i]}</p>}
                  <div className="mt-1.5 flex justify-end gap-0.5">
                    <button type="button" onClick={() => moveStage(i, i - 1)} disabled={first} aria-label={`Move stage ${i + 1} left`} className="flex h-7 w-7 items-center justify-center rounded text-muted hover:bg-subtle disabled:opacity-30"><FiChevronLeft aria-hidden="true" /></button>
                    <button type="button" onClick={() => moveStage(i, i + 1)} disabled={last} aria-label={`Move stage ${i + 1} right`} className="flex h-7 w-7 items-center justify-center rounded text-muted hover:bg-subtle disabled:opacity-30"><FiChevronRight aria-hidden="true" /></button>
                    <button type="button" onClick={() => deleteStage(i)} aria-label={`Delete stage ${i + 1}`} className="flex h-7 w-7 items-center justify-center rounded text-danger-700 hover:bg-danger-50"><FiTrash2 aria-hidden="true" /></button>
                  </div>
                </div>

                {/* body */}
                <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-3">
                  <div>
                    <p className="text-sm font-semibold">Stage conditions</p>
                    {first || last ? (
                      <p className="text-xs text-muted">{first ? 'First' : 'Last'} stage can’t have conditions</p>
                    ) : (
                      <>
                        <p className="mb-1.5 text-xs text-muted">Job enters this stage only if the account has any of these tags</p>
                        <MultiSelect placeholder="No conditions" options={sources.tags} value={stage.conditions || []} onChange={(v) => setStage(i, { conditions: v })}
                          chipStyle={(o) => chipStyle(o.color)} renderOption={(o) => <TagChip tag={o} />} emptyText="No tags" />
                      </>
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-semibold">Automations</p>
                    <p className="mb-1.5 text-xs text-muted">Run when a job enters this stage</p>
                    {stage.automations.length ? (
                      <ul className="flex flex-col gap-1.5">
                        {stage.automations.map((a, n) => (
                          <AutomationSummary key={a.id || n} a={a} n={n + 1} sources={sources}
                            onDelete={() => setStage(i, { automations: stage.automations.filter((_, k) => k !== n) })} />
                        ))}
                      </ul>
                    ) : <p className="text-sm italic text-muted">No automations configured</p>}
                  </div>

                  {!last && (
                    <label className="flex items-start justify-between gap-3 rounded-md border border-line p-2.5 text-sm">
                      <span><span className="block font-semibold">Auto-move</span><span className="text-xs text-muted">Move to the next stage when all tasks are done</span></span>
                      <Toggle label={`Auto-move stage ${i + 1}`} checked={!!stage.autoMove} onChange={(v) => setStage(i, { autoMove: v })} />
                    </label>
                  )}
                </div>

                {/* footer */}
                <div className="border-t border-line p-3">
                  {stage.automations.length ? (
                    <button type="button" className="btn-primary w-full" onClick={() => openAutomations(i)}><FiEdit2 aria-hidden="true" /> Edit automations ({stage.automations.length})</button>
                  ) : (
                    <AutomationTypeMenu onPick={(type) => openAutomations(i, type)} />
                  )}
                </div>
              </li>

              {/* add a stage between */}
              {!last && (
                <li className="flex flex-none items-center">
                  <button type="button" onClick={() => addStage(i + 1)} aria-label={`Add stage after stage ${i + 1}`} title="Add stage here"
                    className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-dashed border-line-strong text-muted hover:border-brand-600 hover:text-brand-600"><FiPlus aria-hidden="true" /></button>
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>

      {drawer && (
        <AutomationDrawer stageNumber={drawer.index + 1} stageName={stages[drawer.index]?.name} automations={drawer.automations} saved={drawer.original}
          onClose={() => setDrawer(null)}
          onSave={(list) => { setStage(drawer.index, { automations: list }); setDrawer(null); }} />
      )}
    </section>
  );
}