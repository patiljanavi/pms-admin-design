

// import { useMemo } from 'react';
// import { Link, useOutletContext, useSearchParams } from 'react-router-dom';
// import { FiAlertCircle, FiArrowRight, FiColumns, FiExternalLink, FiList, FiPlus } from 'react-icons/fi';
// import RowActionsMenu from '../../components/RowActionsMenu';
// import KanbanBoard from '../../components/workflow/KanbanBoard';
// import useJobActions from '../../components/workflow/useJobActions';
// import { cx } from '../../components/ui';
// import { useData } from '../../context/DataContext';
// import { WORKFLOW_PIPELINES_PATH } from '../../config';
// import { PRIORITY_STYLE } from '../../data/taskTemplates';
// import { isOverdue } from '../../data/jobs';

// const fmt = (d) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—');

// /**
//  * Account Workflow tab with two child tabs:
//  *   Pipelines — a Kanban board of one pipeline with only this account's jobs (?view=pipelines&pipeline=<id>)
//  *   Jobs      — this account's jobs in every pipeline, as a table (?view=jobs)
//  * Uses the same jobs, automations and dialogs as Workflow → Pipelines.
//  */
// export default function AccountWorkflow() {
//   const { account } = useOutletContext();
//   const { pipelines = [], jobs = [] } = useData();
//   const [params, setParams] = useSearchParams();
//   const jobUi = useJobActions();

//   const mine = useMemo(() => jobs.filter((j) => j.accountId === account.id), [jobs, account.id]);
//   const countIn = (p) => mine.filter((j) => j.pipelineId === p.id).length;
//   const view = params.get('view') === 'jobs' ? 'jobs' : 'pipelines';
//   // default pipeline: the first one this account has jobs in, else the first pipeline
//   const pipeline = pipelines.find((p) => p.id === params.get('pipeline')) || pipelines.find((p) => countIn(p) > 0) || pipelines[0] || null;
//   const setView = (v) => setParams((prev) => { const n = new URLSearchParams(prev); n.set('view', v); return n; }, { replace: true });
//   const setPipeline = (id) => setParams((prev) => { const n = new URLSearchParams(prev); n.set('view', 'pipelines'); n.set('pipeline', id); return n; }, { replace: true });
//   const pipelineOf = (j) => pipelines.find((p) => p.id === j.pipelineId);

//   const childTab = (key, label, Icon, count) => (
//     <button type="button" role="tab" aria-selected={view === key} onClick={() => setView(key)}
//       className={cx('relative flex min-h-[44px] items-center gap-2 px-4 text-sm font-semibold', view === key ? 'text-brand-600' : 'text-muted hover:text-ink')}>
//       <Icon aria-hidden="true" /> {label}{count != null && <span className={cx('rounded-full px-2 text-xs', view === key ? 'bg-brand-100' : 'bg-subtle')}>{count}</span>}
//       {view === key && <span className="absolute inset-x-2 -bottom-px h-[3px] rounded-t-full bg-brand-600" aria-hidden="true" />}
//     </button>
//   );

//   return (
//     <div className="flex flex-col gap-5">
//       {/* Child tabs + Add job */}
//       <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line">
//         <div role="tablist" aria-label="Workflow views" className="flex">
//           {childTab('pipelines', 'Pipelines', FiColumns)}
//           {childTab('jobs', 'Jobs', FiList, mine.length)}
//         </div>
//         {/* <button type="button" className="btn-primary mb-2" onClick={() => jobUi.addJob({ pipelineId: view === 'pipelines' ? pipeline?.id : undefined, stageId: undefined, accountIds: [account.id] })}>
//           <FiPlus aria-hidden="true" /> Add job
//         </button> */}
//       </div>

//       {view === 'pipelines' ? (
//         <section role="tabpanel" aria-label="Pipelines" className="flex flex-col gap-4">
//           {/* Pipeline picker: every pipeline, with this account's job count */}
//           <div role="radiogroup" aria-label="Pipeline" className="flex flex-wrap gap-2">
//             {pipelines.map((p) => (
//               <button key={p.id} type="button" role="radio" aria-checked={pipeline?.id === p.id} onClick={() => setPipeline(p.id)}
//                 className={cx('flex min-h-[38px] items-center gap-2 rounded-full border px-3.5 text-sm font-semibold', pipeline?.id === p.id ? 'border-brand-600 bg-brand-50 text-brand-800' : 'border-line bg-surface text-muted hover:text-ink')}>
//                 {p.pipelineName}<span className="rounded-full bg-surface px-1.5 text-xs">{countIn(p)}</span>
//               </button>
//             ))}
//           </div>
//           {pipeline ? (
//             <>
//               <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
//                 <span>{account.name}’s jobs in <b className="text-ink">{pipeline.pipelineName}</b> · {countIn(pipeline)} job{countIn(pipeline) === 1 ? '' : 's'}</span>
//                 <Link to={`${WORKFLOW_PIPELINES_PATH}/${pipeline.id}`} className="btn-link px-0 text-sm"><FiExternalLink aria-hidden="true" /> Open full board</Link>
//               </div>
//               <KanbanBoard pipeline={pipeline} jobs={mine.filter((j) => j.pipelineId === pipeline.id)} sortBy={pipeline.sortjobsby || 'dueDate'}
//                 onDropJob={jobUi.moveTo} onEdit={jobUi.editJob} onMoveRequest={jobUi.askMove} onDelete={jobUi.askDelete}
//                 onAddJob={(stageId) => jobUi.addJob({ pipelineId: pipeline.id, stageId, accountIds: [account.id] })} />
//             </>
//           ) : <p className="rounded-lg border border-dashed border-line-strong p-10 text-center text-muted">No pipelines yet. <Link to="/firmtemp/pipelines/new" className="btn-link">Create a pipeline template</Link></p>}
//         </section>
//       ) : (
//         <section role="tabpanel" aria-label="Jobs" className="flex flex-col gap-6">
//           <div className="card overflow-hidden">
//             <div className="overflow-x-auto">
//               <table aria-label="Account jobs" className="w-full min-w-[800px] border-collapse text-sm">
//                 <thead>
//                   <tr className="bg-subtle text-left text-xs uppercase tracking-wide text-muted">
//                     <th className="px-5 py-3 font-semibold">Job</th>
//                     <th className="px-3 py-3 font-semibold">Pipeline</th>
//                     <th className="px-3 py-3 font-semibold">Stage</th>
//                     <th className="px-3 py-3 font-semibold">Priority</th>
//                     <th className="px-3 py-3 font-semibold">Assignees</th>
//                     <th className="px-3 py-3 font-semibold">Due</th>
//                     <th className="px-5 py-3"><span className="sr-only">Actions</span></th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {mine.map((j) => {
//                     const p = pipelineOf(j);
//                     if (!p) return null;
//                     const overdue = isOverdue(j);
//                     return (
//                       <tr key={j.id} className="border-t border-line-soft hover:bg-subtle/60">
//                         <td className="px-5 py-3"><button type="button" onClick={() => jobUi.editJob(j)} className="text-left font-semibold hover:text-brand-600 hover:underline">{j.name}</button></td>
//                         <td className="px-3 py-3"><button type="button" onClick={() => setPipeline(p.id)} className="hover:text-brand-600 hover:underline">{p.pipelineName}</button></td>
//                         <td className="px-3 py-3">
//                           <select aria-label={`Stage of ${j.name}`} className="input min-h-[34px] w-auto py-0 text-sm" value={p.stages.some((s) => s.id === j.stageId) ? j.stageId : p.stages[0]?.id}
//                             onChange={(e) => jobUi.moveTo(j, e.target.value)}>
//                             {p.stages.map((s, i) => <option key={s.id} value={s.id}>{i + 1}. {s.name}{s.automations?.length ? ' ⚡' : ''}</option>)}
//                           </select>
//                         </td>
//                         <td className="px-3 py-3">{j.priority && <span className={cx('rounded-full px-2 py-0.5 text-xs font-semibold', PRIORITY_STYLE[j.priority])}>{j.priority}</span>}</td>
//                         <td className="max-w-[180px] truncate px-3 py-3 text-muted" title={(j.assignees || []).join(', ')}>{(j.assignees || []).join(', ') || '—'}</td>
//                         <td className={cx('whitespace-nowrap px-3 py-3', overdue ? 'font-semibold text-danger-700' : 'text-muted')}>{overdue && <FiAlertCircle className="mr-1 inline" aria-label="Overdue" />}{fmt(j.dueDate)}</td>
//                         <td className="px-5 py-3">
//                           <div className="flex justify-end">
//                             <RowActionsMenu label={j.name} onEdit={() => jobUi.editJob(j)}
//                               extra={[{ label: 'Show on board', icon: FiArrowRight, onClick: () => setPipeline(p.id) }]}
//                               onDelete={() => jobUi.askDelete(j)} />
//                           </div>
//                         </td>
//                       </tr>
//                     );
//                   })}
//                 </tbody>
//               </table>
//               {!mine.length && <p className="p-10 text-center text-muted">{account.name} has no jobs yet. Use <b>Add job</b> to put one in a pipeline.</p>}
//             </div>
//           </div>

//           {(account.tasks || []).length > 0 && (
//             <section aria-label="Tasks from automations" className="card p-5">
//               <h2 className="mb-3 text-lg font-semibold">Tasks</h2>
//               <ul className="flex flex-col divide-y divide-line-soft">
//                 {account.tasks.map((t) => (
//                   <li key={t.id} className="flex items-center gap-3 py-2 text-sm">
//                     <span className="flex-1 font-semibold">{t.name}</span>
//                     {t.priority && <span className={cx('rounded-full px-2 py-0.5 text-xs font-semibold', PRIORITY_STYLE[t.priority])}>{t.priority}</span>}
//                     <span className="text-muted">{(t.assignees || []).join(', ') || 'Unassigned'}</span>
//                     <span className="rounded bg-subtle px-2 py-0.5 text-xs font-semibold text-muted">{t.status}</span>
//                   </li>
//                 ))}
//               </ul>
//             </section>
//           )}
//         </section>
//       )}

//       {jobUi.ui}
//     </div>
//   );
// }

import { useMemo } from 'react';
import { Link, useOutletContext, useSearchParams } from 'react-router-dom';
import { FiAlertCircle, FiArrowRight, FiColumns, FiExternalLink, FiList } from 'react-icons/fi';
import RowActionsMenu from '../../components/RowActionsMenu';
import KanbanBoard from '../../components/workflow/KanbanBoard';
import useJobActions from '../../components/workflow/useJobActions';
import { SubTabs } from '../../components/TabNav';
import { cx } from '../../components/ui';
import { useData } from '../../context/DataContext';
import { WORKFLOW_PIPELINES_PATH } from '../../config';
import { PRIORITY_STYLE } from '../../data/taskTemplates';
import { isOverdue } from '../../data/jobs';

const fmt = (d) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—');

/**
 * Account Workflow tab with two child tabs:
 *   Pipelines — a Kanban board of one pipeline with only this account's jobs (?view=pipelines&pipeline=<id>)
 *   Jobs      — this account's jobs in every pipeline, as a table (?view=jobs)
 * Uses the same jobs, automations and dialogs as Workflow → Pipelines.
 */
export default function AccountWorkflow() {
  const { account } = useOutletContext();
  const { pipelines = [], jobs = [] } = useData();
  const [params, setParams] = useSearchParams();
  const jobUi = useJobActions();

  const mine = useMemo(() => jobs.filter((j) => j.accountId === account.id), [jobs, account.id]);
  const countIn = (p) => mine.filter((j) => j.pipelineId === p.id).length;
  const view = params.get('view') === 'jobs' ? 'jobs' : 'pipelines';
  // only pipelines this account has jobs in; the chosen one, else the first of them
  const withJobs = pipelines.filter((p) => countIn(p) > 0);
  const pipeline = withJobs.find((p) => p.id === params.get('pipeline')) || withJobs[0] || null;
  const setView = (v) => setParams((prev) => { const n = new URLSearchParams(prev); n.set('view', v); return n; }, { replace: true });
  const setPipeline = (id) => setParams((prev) => { const n = new URLSearchParams(prev); n.set('view', 'pipelines'); n.set('pipeline', id); return n; }, { replace: true });
  const pipelineOf = (j) => pipelines.find((p) => p.id === j.pipelineId);

  return (
    <div className="flex flex-col gap-5">
      {/* Child tabs (same style as every tab bar) + Add job */}
      <SubTabs label="Workflow views" value={view} onChange={setView}
        tabs={[{ key: 'pipelines', label: 'Pipelines', icon: FiColumns }, { key: 'jobs', label: 'Jobs', icon: FiList, count: mine.length }]}
        /* To show an "Add job" button on the right, import FiPlus from 'react-icons/fi' and add:
           actions={<button type="button" className="btn-primary" onClick={() => jobUi.addJob({ pipelineId: view === 'pipelines' ? pipeline?.id : undefined, accountIds: [account.id] })}><FiPlus aria-hidden="true" /> Add job</button>} */
      />

      {view === 'pipelines' ? (
        <section role="tabpanel" aria-label="Pipelines" className="flex flex-col gap-4">
          {/* Pipeline picker: only pipelines with this account's jobs, with the job count */}
          {withJobs.length > 0 && (
          <div role="radiogroup" aria-label="Pipeline" className="flex flex-wrap gap-2">
            {withJobs.map((p) => (
              <button key={p.id} type="button" role="radio" aria-checked={pipeline?.id === p.id} onClick={() => setPipeline(p.id)}
                className={cx('flex min-h-[38px] items-center gap-2 rounded-full border px-3.5 text-sm font-semibold', pipeline?.id === p.id ? 'border-brand-600 bg-brand-50 text-brand-800' : 'border-line bg-surface text-muted hover:text-ink')}>
                {p.pipelineName}<span className="rounded-full bg-surface px-1.5 text-xs">{countIn(p)}</span>
              </button>
            ))}
          </div>
          )}
          {pipeline ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
                <span>{account.name}’s jobs in <b className="text-ink">{pipeline.pipelineName}</b> · {countIn(pipeline)} job{countIn(pipeline) === 1 ? '' : 's'}</span>
                <Link to={`${WORKFLOW_PIPELINES_PATH}/${pipeline.id}`} className="btn-link px-0 text-sm"><FiExternalLink aria-hidden="true" /> Open full board</Link>
              </div>
              <KanbanBoard pipeline={pipeline} jobs={mine.filter((j) => j.pipelineId === pipeline.id)} sortBy={pipeline.sortjobsby || 'dueDate'}
                onDropJob={jobUi.moveTo} onEdit={jobUi.editJob} onMoveRequest={jobUi.askMove} onDelete={jobUi.askDelete}
                onAddJob={(stageId) => jobUi.addJob({ pipelineId: pipeline.id, stageId, accountIds: [account.id] })} />
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-line-strong p-10 text-center text-muted">
              <FiColumns size={26} aria-hidden="true" />
              <p className="font-semibold text-ink">{account.name} has no jobs in any pipeline yet.</p>
              <p className="text-sm">{pipelines.length ? 'Pipelines show here once this account has a job in them.' : <>No pipelines yet. <Link to="/firmtemp/pipelines/new" className="btn-link">Create a pipeline template</Link></>}</p>
            </div>
          )}
        </section>
      ) : (
        <section role="tabpanel" aria-label="Jobs" className="flex flex-col gap-6">
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table aria-label="Account jobs" className="w-full min-w-[800px] border-collapse text-sm">
                <thead>
                  <tr className="bg-subtle text-left text-xs uppercase tracking-wide text-muted">
                    <th className="px-5 py-3 font-semibold">Job</th>
                    <th className="px-3 py-3 font-semibold">Pipeline</th>
                    <th className="px-3 py-3 font-semibold">Stage</th>
                    <th className="px-3 py-3 font-semibold">Priority</th>
                    <th className="px-3 py-3 font-semibold">Assignees</th>
                    <th className="px-3 py-3 font-semibold">Due</th>
                    <th className="px-5 py-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {mine.map((j) => {
                    const p = pipelineOf(j);
                    if (!p) return null;
                    const overdue = isOverdue(j);
                    return (
                      <tr key={j.id} className="border-t border-line-soft hover:bg-subtle/60">
                        <td className="px-5 py-3"><button type="button" onClick={() => jobUi.editJob(j)} className="text-left font-semibold hover:text-brand-600 hover:underline">{j.name}</button></td>
                        <td className="px-3 py-3"><button type="button" onClick={() => setPipeline(p.id)} className="hover:text-brand-600 hover:underline">{p.pipelineName}</button></td>
                        <td className="px-3 py-3">
                          <select aria-label={`Stage of ${j.name}`} className="input min-h-[34px] w-auto py-0 text-sm" value={p.stages.some((s) => s.id === j.stageId) ? j.stageId : p.stages[0]?.id}
                            onChange={(e) => jobUi.moveTo(j, e.target.value)}>
                            {p.stages.map((s, i) => <option key={s.id} value={s.id}>{i + 1}. {s.name}{s.automations?.length ? ' ⚡' : ''}</option>)}
                          </select>
                        </td>
                        <td className="px-3 py-3">{j.priority && <span className={cx('rounded-full px-2 py-0.5 text-xs font-semibold', PRIORITY_STYLE[j.priority])}>{j.priority}</span>}</td>
                        <td className="max-w-[180px] truncate px-3 py-3 text-muted" title={(j.assignees || []).join(', ')}>{(j.assignees || []).join(', ') || '—'}</td>
                        <td className={cx('whitespace-nowrap px-3 py-3', overdue ? 'font-semibold text-danger-700' : 'text-muted')}>{overdue && <FiAlertCircle className="mr-1 inline" aria-label="Overdue" />}{fmt(j.dueDate)}</td>
                        <td className="px-5 py-3">
                          <div className="flex justify-end">
                            <RowActionsMenu label={j.name} onEdit={() => jobUi.editJob(j)}
                              extra={[{ label: 'Show on board', icon: FiArrowRight, onClick: () => setPipeline(p.id) }]}
                              onDelete={() => jobUi.askDelete(j)} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!mine.length && <p className="p-10 text-center text-muted">{account.name} has no jobs yet. Use <b>Add job</b> to put one in a pipeline.</p>}
            </div>
          </div>

          {(account.tasks || []).length > 0 && (
            <section aria-label="Tasks from automations" className="card p-5">
              <h2 className="mb-3 text-lg font-semibold">Tasks</h2>
              <ul className="flex flex-col divide-y divide-line-soft">
                {account.tasks.map((t) => (
                  <li key={t.id} className="flex items-center gap-3 py-2 text-sm">
                    <span className="flex-1 font-semibold">{t.name}</span>
                    {t.priority && <span className={cx('rounded-full px-2 py-0.5 text-xs font-semibold', PRIORITY_STYLE[t.priority])}>{t.priority}</span>}
                    <span className="text-muted">{(t.assignees || []).join(', ') || 'Unassigned'}</span>
                    <span className="rounded bg-subtle px-2 py-0.5 text-xs font-semibold text-muted">{t.status}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </section>
      )}

      {jobUi.ui}
    </div>
  );
}