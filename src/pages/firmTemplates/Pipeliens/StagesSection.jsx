import { Fragment, useState } from 'react';
import {
  ArrowDown, ArrowUp, ChevronDown, ChevronsDownUp, ChevronsUpDown, CircleAlert, Filter, GripVertical, Layers, Pencil, Plus, Trash2, Zap,
} from 'lucide-react';
import MultiSelect from '../../../components/MultiSelect';
import TagChip, { chipStyle } from '../../../components/TagChip';
import { EmptyState } from '../../../components/page';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';
import { Switch } from '../../../components/ui/switch';
import { SimpleTooltip } from '../../../components/ui/tooltip';
import { cn } from 'lib/utils';
import AutomationDrawer, { useAutomationSources } from './AutomationDrawer';
import AutomationTypeMenu, { automationIcon } from './AutomationTypeMenu';
import { StatusDot } from './ColorStatusSelect';
import { automationInfo, newAutomation, newStage } from '../../../data/pipelinesdata';

/** Stages have no colour of their own, so each position gets a chart colour (theme-aware). */
const stageColor = (i) => `hsl(var(--chart-${(i % 5) + 1}))`;

/** Short, readable summary of one saved automation (shown on the stage row). */
function AutomationSummary({ a, n, sources, onDelete }) {
  const { tagById, statuses, templatesFor } = sources;
  const info = automationInfo(a.type);
  const Icon = automationIcon(a.type);
  const template = info.source ? templatesFor(a.type).find((o) => String(o.id) === String(a.selectedtemp)) : null;
  const status = statuses.find((s) => String(s.id) === String(a.selectedClientStatus));
  const tagChips = (ids) => (ids || []).map((id) => tagById.get(id)).filter(Boolean).map((t) => <TagChip key={t.value} tag={t} size="xs" />);
  return (
    <li className="group/auto flex items-start gap-2.5 rounded-lg border bg-subtle/60 px-2.5 py-2 text-sm transition-colors hover:bg-subtle">
      <span className="mt-0.5 inline-flex size-6 flex-none items-center justify-center rounded-md border border-brand-100 bg-brand-50 text-brand-700" aria-hidden="true">
        <Icon className="size-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs tabular-nums text-muted-foreground">{n}.</span>
          <span className="truncate font-medium leading-6">{a.type}</span>
        </div>
        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
          {info.source && <span className="truncate">{template ? <span className="font-medium text-foreground">{template.label}</span> : <span className="text-warning-700">Template not found</span>}</span>}
          {a.reminderChecked && <span>Reminds every {a.daysuntilNextReminder} days, up to {a.noOfReminder} times</span>}
          {a.type === 'Update client-facing job status' && (a.status
            ? (status ? <span className="flex items-center gap-1.5"><StatusDot color={status.color} className="size-2" /><span className="font-medium text-foreground">{status.name}</span> · visible to client</span> : <span className="text-warning-700">Status not found</span>)
            : <span>Hidden from client</span>)}
          {a.type === 'Update account tags' && (
            <>
              {a.addTags?.length > 0 && <span className="flex flex-wrap items-center gap-1"><span className="font-medium text-success-700">Add:</span>{tagChips(a.addTags)}</span>}
              {a.removeTags?.length > 0 && <span className="flex flex-wrap items-center gap-1"><span className="font-medium text-danger-700">Remove:</span>{tagChips(a.removeTags)}</span>}
            </>
          )}
          {a.type === 'Update job assignees' && (
            <>
              {a.selectedAssignees?.length > 0 && <span><span className="font-medium text-success-700">Add:</span> {a.selectedAssignees.join(', ')}</span>}
              {a.assigneesToRemove?.length > 0 && <span><span className="font-medium text-danger-700">Remove:</span> {a.assigneesToRemove.join(', ')}</span>}
            </>
          )}
          {a.selectedTags?.length > 0 && <span className="flex flex-wrap items-center gap-1">Only for: {tagChips(a.selectedTags)}</span>}
        </div>
      </div>
      <SimpleTooltip label="Delete automation">
        <Button type="button" variant="ghost" size="icon-xs" onClick={onDelete} aria-label={`Delete automation ${n} (${a.type})`}
          className="text-muted-foreground opacity-70 hover:bg-danger-50 hover:text-danger-700 group-hover/auto:opacity-100"><Trash2 /></Button>
      </SimpleTooltip>
    </li>
  );
}

function IconAction({ label, className, ...props }) {
  return (
    <SimpleTooltip label={label}>
      <Button type="button" variant="ghost" size="icon-xs" className={cn('text-muted-foreground hover:text-foreground disabled:opacity-30', className)} {...props} />
    </SimpleTooltip>
  );
}

/**
 * Stages of a pipeline: an ordered list of stage rows.
 * Props: stages · onChange(stages) · stageErrors (array of messages, by index)
 */
export default function StagesSection({ stages, onChange, stageErrors = [] }) {
  const sources = useAutomationSources();
  const [drawer, setDrawer] = useState(null);      // { index, automations } while editing a stage's automations
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);
  const [collapsed, setCollapsed] = useState(() => new Set()); // stage ids whose details are hidden (display only)

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
  const toggleCollapsed = (id) => setCollapsed((p) => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const allCollapsed = stages.length > 0 && stages.every((s) => collapsed.has(s.id));
  const totalAutomations = stages.reduce((n, s) => n + (s.automations?.length || 0), 0);

  return (
    <section className="card" aria-labelledby="stages-heading">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b px-5 py-4 sm:px-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 id="stages-heading" className="section-title">Stages</h2>
            <Badge variant="neutral" className="tabular-nums">{stages.length}</Badge>
            {totalAutomations > 0 && <Badge variant="info" className="tabular-nums"><Zap aria-hidden="true" />{totalAutomations}</Badge>}
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">Jobs move through stages in order. A pipeline needs at least 2 stages. Drag the handle or use the arrows to reorder.</p>
        </div>
        <div className="flex items-center gap-2">
          {stages.length > 0 && (
            <Button type="button" variant="ghost" size="sm" className="text-muted-foreground"
              onClick={() => setCollapsed(allCollapsed ? new Set() : new Set(stages.map((s) => s.id)))}>
              {allCollapsed ? <ChevronsUpDown /> : <ChevronsDownUp />}{allCollapsed ? 'Expand all' : 'Collapse all'}
            </Button>
          )}
          <Button type="button" size="sm" onClick={() => addStage(stages.length)}><Plus aria-hidden="true" />Add stage</Button>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {stages.length === 0 && (
          <div className="rounded-xl border border-dashed">
            <EmptyState compact icon={Layers} title="No stages yet" description="Stages are the columns jobs move through on the pipeline board."
              action={<Button type="button" variant="outline" onClick={() => onChange([newStage('To do'), newStage('Done')])}>Start with “To do” and “Done”</Button>} />
          </div>
        )}

        <ol aria-label="Pipeline stages" className="flex flex-col">
          {stages.map((stage, i) => {
            const first = i === 0;
            const last = i === stages.length - 1;
            const open = !collapsed.has(stage.id);
            const autoCount = stage.automations.length;
            const condCount = (stage.conditions || []).length;
            const error = stageErrors[i];
            return (
              <Fragment key={stage.id}>
                <li aria-label={`Stage ${i + 1}`} draggable onDragStart={(e) => { setDragIndex(i); e.dataTransfer.effectAllowed = 'move'; }}
                  onDragEnd={() => { setDragIndex(null); setOverIndex(null); }}
                  onDragOver={(e) => { e.preventDefault(); if (overIndex !== i) setOverIndex(i); }}
                  onDragLeave={() => setOverIndex((o) => (o === i ? null : o))}
                  onDrop={() => { moveStage(dragIndex, i); setDragIndex(null); setOverIndex(null); }}
                  className={cn('group/stage relative rounded-xl border bg-card shadow-xs transition-[border-color,box-shadow,opacity]',
                    dragIndex === i ? 'opacity-50' : 'hover:border-line-strong',
                    overIndex === i && dragIndex !== null && dragIndex !== i && 'border-primary/60 ring-2 ring-primary/20',
                    error && 'border-danger-200 ring-1 ring-danger-200')}>
                  {/* Row header */}
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-2 px-2 py-2 sm:flex-nowrap sm:pr-3">
                    <SimpleTooltip label="Drag to reorder">
                      <span className="flex h-8 w-5 flex-none cursor-grab items-center justify-center text-muted-foreground/50 transition-colors group-hover/stage:text-muted-foreground active:cursor-grabbing" aria-hidden="true">
                        <GripVertical className="size-4" />
                      </span>
                    </SimpleTooltip>
                    <span className="inline-flex h-6 min-w-6 flex-none items-center justify-center rounded-md border bg-muted px-1.5 text-xs font-semibold tabular-nums text-muted-foreground">{i + 1}</span>
                    <StatusDot color={stageColor(i)} />
                    <input value={stage.name} onChange={(e) => setStage(i, { name: e.target.value })} placeholder="Stage name" aria-label={`Stage ${i + 1} name`}
                      aria-invalid={!!error}
                      className={cn('h-8 min-w-0 flex-1 basis-40 rounded-md border bg-transparent px-2 text-sm font-medium text-foreground outline-none transition-[border-color,box-shadow,background-color] placeholder:font-normal placeholder:text-muted-foreground/70',
                        'focus:border-ring focus:bg-card focus:ring-[3px] focus:ring-ring/20',
                        error ? 'border-destructive' : 'border-transparent hover:border-input')} />

                    <div className="flex flex-none items-center gap-1.5">
                      {condCount > 0 && (
                        <SimpleTooltip label={`Only accounts with ${condCount === 1 ? 'this tag' : 'any of these tags'} enter this stage`}>
                          <Badge variant="violet" className="tabular-nums"><Filter aria-hidden="true" />{condCount}</Badge>
                        </SimpleTooltip>
                      )}
                      <SimpleTooltip label={autoCount ? `${autoCount} automation${autoCount > 1 ? 's' : ''} run when a job enters this stage` : 'No automations'}>
                        <Badge variant={autoCount ? 'info' : 'neutral'} className={cn('tabular-nums', !autoCount && 'opacity-70')}><Zap aria-hidden="true" />{autoCount}</Badge>
                      </SimpleTooltip>
                      {!last && stage.autoMove && <Badge variant="success" dot>Auto-move</Badge>}
                    </div>

                    <div className="ml-auto flex flex-none items-center gap-0.5 sm:ml-1">
                      <IconAction label="Move up" onClick={() => moveStage(i, i - 1)} disabled={first} aria-label={`Move stage ${i + 1} up`}><ArrowUp /></IconAction>
                      <IconAction label="Move down" onClick={() => moveStage(i, i + 1)} disabled={last} aria-label={`Move stage ${i + 1} down`}><ArrowDown /></IconAction>
                      <IconAction label="Delete stage" onClick={() => deleteStage(i)} aria-label={`Delete stage ${i + 1}`} className="hover:bg-danger-50 hover:text-danger-700"><Trash2 /></IconAction>
                      <span className="mx-0.5 h-4 w-px bg-border" aria-hidden="true" />
                      <IconAction label={open ? 'Hide details' : 'Show details'} onClick={() => toggleCollapsed(stage.id)} aria-expanded={open} aria-label={`${open ? 'Hide' : 'Show'} details for stage ${i + 1}`}>
                        <ChevronDown className={cn('transition-transform', !open && '-rotate-90')} />
                      </IconAction>
                    </div>
                  </div>
                  {error && <p className="-mt-1 flex items-center gap-1.5 px-4 pb-2 text-xs sm:pl-[5.375rem] font-medium text-danger-700"><CircleAlert className="size-3.5" aria-hidden="true" />{error}</p>}

                  {/* Row details */}
                  {open && (
                    <div className="grid grid-cols-1 gap-5 border-t px-4 py-4 sm:pl-[5.375rem] lg:grid-cols-2">
                      <div className="flex flex-col gap-1.5">
                        <p className="text-sm font-medium">Stage conditions</p>
                        {first || last ? (
                          <p className="text-xs text-muted-foreground">{first ? 'First' : 'Last'} stage can’t have conditions</p>
                        ) : (
                          <>
                            <p className="text-xs text-muted-foreground">Job enters this stage only if the account has any of these tags</p>
                            <MultiSelect placeholder="No conditions" options={sources.tags} value={stage.conditions || []} onChange={(v) => setStage(i, { conditions: v })}
                              chipStyle={(o) => chipStyle(o.color)} renderOption={(o) => <TagChip tag={o} />} emptyText="No tags" />
                          </>
                        )}

                        {!last && (
                          <div className="mt-3 flex items-start justify-between gap-3 rounded-lg border bg-subtle/60 p-3">
                            <Label htmlFor={`automove-${stage.id}`} className="flex cursor-pointer flex-col gap-1 leading-snug">
                              Auto-move
                              <span className="text-xs font-normal text-muted-foreground">Move to the next stage when all tasks are done</span>
                            </Label>
                            <Switch id={`automove-${stage.id}`} aria-label={`Auto-move stage ${i + 1}`} checked={!!stage.autoMove} onCheckedChange={(v) => setStage(i, { autoMove: v })} />
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <p className="text-sm font-medium">Automations</p>
                        <p className="text-xs text-muted-foreground">Run when a job enters this stage</p>
                        {autoCount ? (
                          <ul className="flex flex-col gap-1.5">
                            {stage.automations.map((a, n) => (
                              <AutomationSummary key={a.id || n} a={a} n={n + 1} sources={sources}
                                onDelete={() => setStage(i, { automations: stage.automations.filter((_, k) => k !== n) })} />
                            ))}
                          </ul>
                        ) : <p className="rounded-lg border border-dashed px-3 py-2.5 text-sm text-muted-foreground">No automations configured</p>}
                        <div className="mt-1">
                          {autoCount ? (
                            <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => openAutomations(i)}><Pencil aria-hidden="true" />Edit automations ({autoCount})</Button>
                          ) : (
                            <AutomationTypeMenu onPick={(type) => openAutomations(i, type)} className="h-8" />
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </li>

                {/* add a stage between */}
                {!last && (
                  <li className="group/add relative flex h-7 items-center justify-center" aria-label={`Between stage ${i + 1} and ${i + 2}`}>
                    <span className="absolute inset-y-0 left-12 w-px bg-border" aria-hidden="true" />
                    <SimpleTooltip label="Add stage here">
                      <button type="button" onClick={() => addStage(i + 1)} aria-label={`Add stage after stage ${i + 1}`}
                        className="relative inline-flex h-5 items-center gap-1 rounded-full border bg-card px-2 text-[11px] font-medium text-muted-foreground opacity-0 shadow-xs transition-all hover:border-primary/50 hover:text-primary focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 group-hover/add:opacity-100">
                        <Plus className="size-3" aria-hidden="true" />Add stage
                      </button>
                    </SimpleTooltip>
                  </li>
                )}
              </Fragment>
            );
          })}
        </ol>

        {stages.length > 0 && (
          <button type="button" onClick={() => addStage(stages.length)}
            className="mt-3 flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-dashed text-sm font-medium text-muted-foreground transition-colors hover:border-line-strong hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
            <Plus className="size-4" aria-hidden="true" />Add stage at the end
          </button>
        )}
      </div>

      {drawer && (
        <AutomationDrawer stageNumber={drawer.index + 1} stageName={stages[drawer.index]?.name} automations={drawer.automations} saved={drawer.original}
          onClose={() => setDrawer(null)}
          onSave={(list) => { setStage(drawer.index, { automations: list }); setDrawer(null); }} />
      )}
    </section>
  );
}
