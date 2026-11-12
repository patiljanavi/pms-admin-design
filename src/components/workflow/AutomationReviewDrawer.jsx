import { useState } from 'react';
import { AlertTriangle, ArrowLeft, Tag, Zap } from 'lucide-react';
import { Avatar, CloseButton, Drawer, initials } from '../ui';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { SimpleTooltip } from '../ui/tooltip';
import { cn } from 'lib/utils';
import { useData } from '../../context/DataContext';
import { describeAutomation, meetsConditions } from '../../data/automations';

/**
 * Shown when saving a job into a stage that has automations: pick which ones run.
 * Props: stage · accounts (the selected accounts) · onRun(automationIds) · onBack()
 */
export default function AutomationReviewDrawer({ stage, accounts, onRun, onBack }) {
  const data = useData();
  const ctx = { ...data, statuses: data.clientFacingJobs ?? data.clientStatuses };
  const autos = stage.automations || [];
  const [picked, setPicked] = useState(() => autos.map((a) => a.id));
  const toggle = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const allOn = picked.length === autos.length;

  return (
    <Drawer onClose={onBack} label="Stage automations" width="max-w-[600px]">
      <div className="flex h-full min-h-0 flex-col">
        <header className="flex items-start gap-3 border-b px-6 py-4">
          <SimpleTooltip label="Back to the job">
            <Button variant="ghost" size="icon-sm" className="-ml-2 flex-none text-muted-foreground" onClick={onBack} aria-label="Back to the job"><ArrowLeft /></Button>
          </SimpleTooltip>
          <span className="inline-flex size-9 flex-none items-center justify-center rounded-lg border border-warning-100 bg-warning-50 text-warning-700" aria-hidden="true">
            <Zap className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-semibold tracking-tight">Stage automations</h2>
            <p className="truncate text-sm text-muted-foreground">“{stage.name}” runs these when a job enters it</p>
          </div>
          <CloseButton onClick={onBack} label="Close automations review" />
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
          <div className="flex items-center gap-3 rounded-lg border bg-subtle px-3.5 py-3">
            <span className="flex flex-none -space-x-1.5">
              {accounts.slice(0, 3).map((a) => <span key={a.id} className="rounded-full ring-2 ring-subtle"><Avatar text={initials(a.name)} size="xs" /></span>)}
            </span>
            <p className="min-w-0 flex-1 text-sm text-muted-foreground">
              They run for each selected account (<span className="font-medium text-foreground">{accounts.map((a) => a.name).join(', ')}</span>).
            </p>
          </div>

          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold">{picked.length} of {autos.length} selected</h3>
            <Button variant="link" size="xs" className="h-auto px-0" onClick={() => setPicked(allOn ? [] : autos.map((a) => a.id))}>
              {allOn ? 'Select none' : 'Select all'}
            </Button>
          </div>

          <ul aria-label="Automations to run" className="flex flex-col gap-2">
            {autos.map((a, i) => {
              const applies = accounts.filter((acc) => meetsConditions(a, acc));
              const conditional = (a.selectedTags || []).length > 0;
              const on = picked.includes(a.id);
              return (
                <li key={a.id}>
                  <label className={cn('flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring/50',
                    on ? 'border-primary/50 bg-primary/5' : 'hover:bg-accent')}>
                    <Checkbox checked={on} onCheckedChange={() => toggle(a.id)} className="mt-0.5" aria-label={`Run automation ${i + 1}: ${a.type}`} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start gap-2">
                        <span className="mt-px inline-flex h-5 min-w-5 flex-none items-center justify-center rounded-md bg-muted px-1 text-[11px] font-semibold tabular-nums text-muted-foreground">{i + 1}</span>
                        <span className="text-sm font-medium leading-snug">{describeAutomation(a, ctx)}</span>
                      </span>
                      {a.reminderChecked && <span className="mt-1 block pl-7 text-xs text-muted-foreground">Reminds every {a.daysuntilNextReminder} days, up to {a.noOfReminder} times</span>}
                      {conditional && (
                        <span className={cn('mt-1.5 ml-7 flex items-start gap-1.5 rounded-md px-2 py-1 text-xs',
                          applies.length ? 'bg-muted text-muted-foreground' : 'bg-warning-50 font-medium text-warning-700')}>
                          {applies.length ? <Tag className="mt-px size-3 flex-none" aria-hidden="true" /> : <AlertTriangle className="mt-px size-3 flex-none" aria-hidden="true" />}
                          <span>Only for accounts with the tags {(a.selectedTags || []).map((id) => data.tagById?.get(id)?.label || id).join(', ')} — applies to {applies.length} of {accounts.length}</span>
                        </span>
                      )}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>

        <footer className="flex flex-wrap items-center justify-end gap-2 border-t bg-subtle px-6 py-3.5">
          <Button variant="ghost" className="mr-auto" onClick={onBack}><ArrowLeft />Back</Button>
          <Button variant="outline" onClick={() => onRun([])}>Create without automations</Button>
          <Button onClick={() => onRun(picked)} disabled={!picked.length}><Zap />Create job &amp; run {picked.length}</Button>
        </footer>
      </div>
    </Drawer>
  );
}
