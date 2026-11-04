import { useState } from 'react';
import { FiAlertCircle, FiArrowLeft, FiZap } from 'react-icons/fi';
import { Drawer, cx } from '../ui';
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

  return (
    <Drawer onClose={onBack} label="Stage automations" width="max-w-[600px]">
      <div className="flex items-center gap-3 border-b border-line bg-subtle/60 px-5 py-4">
        <button type="button" onClick={onBack} aria-label="Back to the job" className="flex h-9 w-9 items-center justify-center rounded text-muted hover:bg-surface"><FiArrowLeft /></button>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-warning-50 text-warning-700" aria-hidden="true"><FiZap /></span>
        <div className="min-w-0 flex-1"><h2 className="truncate text-lg font-semibold">Stage automations</h2><p className="truncate text-sm text-muted">“{stage.name}” runs these when a job enters it</p></div>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-5">
        <p className="text-sm text-muted">They run for each selected account ({accounts.map((a) => a.name).join(', ')}).</p>
        <ul aria-label="Automations to run" className="flex flex-col gap-2">
          {autos.map((a, i) => {
            const applies = accounts.filter((acc) => meetsConditions(a, acc));
            const conditional = (a.selectedTags || []).length > 0;
            return (
              <li key={a.id}>
                <label className={cx('flex cursor-pointer items-start gap-3 rounded-lg border p-3.5', picked.includes(a.id) ? 'border-brand-600 bg-brand-50/50' : 'border-line')}>
                  <input type="checkbox" checked={picked.includes(a.id)} onChange={() => toggle(a.id)} className="mt-0.5 h-[18px] w-[18px] flex-none accent-brand-600" aria-label={`Run automation ${i + 1}: ${a.type}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{i + 1}. {describeAutomation(a, ctx)}</span>
                    {a.reminderChecked && <span className="block text-xs text-muted">Reminds every {a.daysuntilNextReminder} days, up to {a.noOfReminder} times</span>}
                    {conditional && (
                      <span className={cx('mt-1 flex items-center gap-1 text-xs', applies.length ? 'text-muted' : 'font-semibold text-warning-700')}>
                        {!applies.length && <FiAlertCircle aria-hidden="true" />}
                        Only for accounts with the tags {(a.selectedTags || []).map((id) => data.tagById?.get(id)?.label || id).join(', ')} — applies to {applies.length} of {accounts.length}
                      </span>
                    )}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="sticky bottom-0 flex flex-wrap justify-end gap-2.5 border-t border-line bg-subtle px-5 py-4">
        <button type="button" className="btn-secondary" onClick={onBack}>Back</button>
        <button type="button" className="btn-secondary" onClick={() => onRun([])}>Create without automations</button>
        <button type="button" className="btn-primary" onClick={() => onRun(picked)} disabled={!picked.length}><FiZap aria-hidden="true" /> Create job &amp; run {picked.length}</button>
      </div>
    </Drawer>
  );
}
