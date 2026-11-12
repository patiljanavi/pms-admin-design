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
//       className={cx('relative flex min-h-[44px] items-center gap-2 px-4 text-sm font-semibold', view === key ? 'text-brand-600' : 'text-muted-foreground hover:text-ink')}>
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
//                 className={cx('flex min-h-[38px] items-center gap-2 rounded-full border px-3.5 text-sm font-semibold', pipeline?.id === p.id ? 'border-brand-600 bg-brand-50 text-brand-800' : 'border-line bg-surface text-muted-foreground hover:text-ink')}>
//                 {p.pipelineName}<span className="rounded-full bg-surface px-1.5 text-xs">{countIn(p)}</span>
//               </button>
//             ))}
//           </div>
//           {pipeline ? (
//             <>
//               <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
//                 <span>{account.name}’s jobs in <b className="text-ink">{pipeline.pipelineName}</b> · {countIn(pipeline)} job{countIn(pipeline) === 1 ? '' : 's'}</span>
//                 <Link to={`${WORKFLOW_PIPELINES_PATH}/${pipeline.id}`} className="btn-link px-0 text-sm"><FiExternalLink aria-hidden="true" /> Open full board</Link>
//               </div>
//               <KanbanBoard pipeline={pipeline} jobs={mine.filter((j) => j.pipelineId === pipeline.id)} sortBy={pipeline.sortjobsby || 'dueDate'}
//                 onDropJob={jobUi.moveTo} onEdit={jobUi.editJob} onMoveRequest={jobUi.askMove} onDelete={jobUi.askDelete}
//                 onAddJob={(stageId) => jobUi.addJob({ pipelineId: pipeline.id, stageId, accountIds: [account.id] })} />
//             </>
//           ) : <p className="rounded-lg border border-dashed border-line-strong p-10 text-center text-muted-foreground">No pipelines yet. <Link to="/firmtemp/pipelines/new" className="btn-link">Create a pipeline template</Link></p>}
//         </section>
//       ) : (
//         <section role="tabpanel" aria-label="Jobs" className="flex flex-col gap-6">
//           <div className="card overflow-hidden">
//             <div className="overflow-x-auto">
//               <table aria-label="Account jobs" className="w-full min-w-[800px] border-collapse text-sm">
//                 <thead>
//                   <tr className="bg-subtle text-left text-xs uppercase tracking-wide text-muted-foreground">
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
//                         <td className="max-w-[180px] truncate px-3 py-3 text-muted-foreground" title={(j.assignees || []).join(', ')}>{(j.assignees || []).join(', ') || '—'}</td>
//                         <td className={cx('whitespace-nowrap px-3 py-3', overdue ? 'font-semibold text-danger-700' : 'text-muted-foreground')}>{overdue && <FiAlertCircle className="mr-1 inline" aria-label="Overdue" />}{fmt(j.dueDate)}</td>
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
//               {!mine.length && <p className="p-10 text-center text-muted-foreground">{account.name} has no jobs yet. Use <b>Add job</b> to put one in a pipeline.</p>}
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
//                     <span className="text-muted-foreground">{(t.assignees || []).join(', ') || 'Unassigned'}</span>
//                     <span className="rounded bg-subtle px-2 py-0.5 text-xs font-semibold text-muted-foreground">{t.status}</span>
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
import { AlertCircle, ArrowRight, Briefcase, Columns3, ExternalLink, List, ListChecks } from 'lucide-react';
import RowActionsMenu from '../../components/RowActionsMenu';
import KanbanBoard from '../../components/workflow/KanbanBoard';
import useJobActions from '../../components/workflow/useJobActions';
import { SubTabs } from '../../components/TabNav';
import { Avatar, initials } from '../../components/ui';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { SimpleTooltip } from '../../components/ui/tooltip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { EmptyState } from '../../components/page';
import { useData } from '../../context/DataContext';
import { WORKFLOW_PIPELINES_PATH } from '../../config';
import { isOverdue } from '../../data/jobs';
import { cn } from 'lib/utils';

const fmt = (d) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—');
const PRIORITY_BADGE = { Low: 'neutral', Medium: 'info', High: 'warning', Urgent: 'danger' };

/** Stacked avatars for job / task assignees. */
function Assignees({ people = [] }) {
  if (!people.length) return <span className="text-muted-foreground/70">Unassigned</span>;
  return (
    <SimpleTooltip label={people.join(', ')}>
      <span className="inline-flex items-center gap-2">
        <span className="flex -space-x-1.5">{people.slice(0, 3).map((m) => <span key={m} className="rounded-full ring-2 ring-card"><Avatar text={initials(m)} size="xs" /></span>)}</span>
        <span className="max-w-[120px] truncate text-sm text-muted-foreground">{people.length === 1 ? people[0] : `${people[0].split(' ')[0]} +${people.length - 1}`}</span>
      </span>
    </SimpleTooltip>
  );
}

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
      {/* Child tabs (same style as every tab bar) */}
      <SubTabs label="Workflow views" value={view} onChange={setView}
        tabs={[{ key: 'pipelines', label: 'Pipelines', icon: Columns3 }, { key: 'jobs', label: 'Jobs', icon: List, count: mine.length }]}
        /* To show an "Add job" button on the right, import FiPlus from 'react-icons/fi' and add:
           actions={<button type="button" className="btn-primary" onClick={() => jobUi.addJob({ pipelineId: view === 'pipelines' ? pipeline?.id : undefined, accountIds: [account.id] })}><FiPlus aria-hidden="true" /> Add job</button>} */
      />

      {view === 'pipelines' ? (
        <section role="tabpanel" aria-label="Pipelines" className="flex flex-col gap-4">
          {pipeline ? (
            <>
              <div className="flex flex-wrap items-center gap-3">
                {/* Pipeline picker: only pipelines with this account's jobs, with the job count */}
                <div role="radiogroup" aria-label="Pipeline" className="flex flex-wrap gap-1.5">
                  {withJobs.map((p) => {
                    const on = pipeline.id === p.id;
                    return (
                      <button key={p.id} type="button" role="radio" aria-checked={on} onClick={() => setPipeline(p.id)}
                        className={cn('inline-flex h-8 items-center gap-2 rounded-full border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                          on ? 'border-primary/40 bg-primary/10 text-foreground' : 'bg-card text-muted-foreground shadow-xs hover:bg-accent hover:text-foreground')}>
                        {p.pipelineName}
                        <span className={cn('inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1.5 text-[11px] tabular-nums', on ? 'bg-primary text-primary-foreground' : 'bg-muted')}>{countIn(p)}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="ml-auto flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="hidden sm:inline">{countIn(pipeline)} job{countIn(pipeline) === 1 ? '' : 's'} in <span className="font-medium text-foreground">{pipeline.pipelineName}</span></span>
                  <Button variant="outline" size="sm" asChild><Link to={`${WORKFLOW_PIPELINES_PATH}/${pipeline.id}`}><ExternalLink />Open full board</Link></Button>
                </div>
              </div>
              <KanbanBoard pipeline={pipeline} jobs={mine.filter((j) => j.pipelineId === pipeline.id)} sortBy={pipeline.sortjobsby || 'dueDate'}
                onDropJob={jobUi.moveTo} onEdit={jobUi.editJob} onMoveRequest={jobUi.askMove} onDelete={jobUi.askDelete}
                onAddJob={(stageId) => jobUi.addJob({ pipelineId: pipeline.id, stageId, accountIds: [account.id] })} />
            </>
          ) : (
            <div className="rounded-xl border border-dashed bg-card">
              <EmptyState icon={Columns3} title={`${account.name} has no jobs in any pipeline yet`}
                description={pipelines.length ? 'Pipelines show here once this account has a job in them. Use New job at the top of the page to add one.' : 'Create a pipeline template first, then add jobs for this account.'}
                action={!pipelines.length && <Button variant="outline" asChild><Link to="/firmtemp/pipelines/new">Create a pipeline template</Link></Button>} />
            </div>
          )}
        </section>
      ) : (
        <section role="tabpanel" aria-label="Jobs" className="flex flex-col gap-6">
          <div className="overflow-hidden rounded-xl border bg-card shadow-card">
            {mine.length ? (
              <Table aria-label="Account jobs" className="min-w-[860px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Job</TableHead>
                    <TableHead>Pipeline</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Assignees</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mine.map((j) => {
                    const p = pipelineOf(j);
                    if (!p) return null;
                    const overdue = isOverdue(j);
                    return (
                      <TableRow key={j.id}>
                        <TableCell><button type="button" onClick={() => jobUi.editJob(j)} className="text-left font-medium text-foreground underline-offset-4 hover:underline">{j.name}</button></TableCell>
                        <TableCell><button type="button" onClick={() => setPipeline(p.id)} className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">{p.pipelineName}</button></TableCell>
                        <TableCell>
                          <select aria-label={`Stage of ${j.name}`} className="input h-8 w-auto max-w-[220px] py-0 text-sm" value={p.stages.some((s) => s.id === j.stageId) ? j.stageId : p.stages[0]?.id}
                            onChange={(e) => jobUi.moveTo(j, e.target.value)}>
                            {p.stages.map((s, i) => <option key={s.id} value={s.id}>{i + 1}. {s.name}{s.automations?.length ? ' ⚡' : ''}</option>)}
                          </select>
                        </TableCell>
                        <TableCell>{j.priority ? <Badge variant={PRIORITY_BADGE[j.priority] || 'neutral'} dot>{j.priority}</Badge> : <span className="text-muted-foreground/60">—</span>}</TableCell>
                        <TableCell><Assignees people={j.assignees} /></TableCell>
                        <TableCell className={cn('whitespace-nowrap tabular-nums', overdue ? 'font-medium text-danger-700' : 'text-muted-foreground')}>
                          <span className="inline-flex items-center gap-1.5">{overdue && <AlertCircle className="size-3.5" aria-label="Overdue" />}{fmt(j.dueDate)}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <RowActionsMenu label={j.name} onEdit={() => jobUi.editJob(j)}
                            extra={[{ label: 'Show on board', icon: ArrowRight, onClick: () => setPipeline(p.id) }]}
                            onDelete={() => jobUi.askDelete(j)} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <EmptyState icon={Briefcase} title={`${account.name} has no jobs yet`} description="Use New job at the top of the page to put one in a pipeline." />
            )}
          </div>

          {(account.tasks || []).length > 0 && (
            <section aria-label="Tasks from automations" className="overflow-hidden rounded-xl border bg-card shadow-card">
              <header className="flex items-center gap-2 border-b px-5 py-3.5">
                <ListChecks className="size-4 text-muted-foreground" aria-hidden="true" />
                <h2 className="section-title flex-1">Tasks</h2>
                <span className="text-sm text-muted-foreground">{account.tasks.length} from automations</span>
              </header>
              <ul className="flex flex-col divide-y">
                {account.tasks.map((t) => (
                  <li key={t.id} className="flex flex-wrap items-center gap-3 px-5 py-2.5 text-sm transition-colors hover:bg-muted/40">
                    <span className="min-w-0 flex-1 truncate font-medium">{t.name}</span>
                    {t.priority && <Badge variant={PRIORITY_BADGE[t.priority] || 'neutral'} dot>{t.priority}</Badge>}
                    <Assignees people={t.assignees} />
                    <Badge variant="outline">{t.status}</Badge>
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
