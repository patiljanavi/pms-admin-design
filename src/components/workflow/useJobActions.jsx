import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import JobDrawer from './JobDrawer';
import MoveJobModal from './MoveJobModal';
import AutomationResultsModal from './AutomationResultsModal';
import { Modal } from '../ui';
import { Button } from '../ui/button';
import { toast } from '../ui/sonner';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';

/** Deletions get a neutral toast, failures an error toast, everything else a success toast. */
const notify = (m) => {
  if (!m) return;
  if (/delet|remov|archiv/i.test(m)) toast(m);
  else if (/fail|error|invalid|couldn/i.test(m)) toast.error(m);
  else toast.success(m);
};

/**
 * Create / edit / move / delete jobs, with the stage automations and their results.
 * Shared by the Workflow board and the account Workflow tab.
 *   const jobUi = useJobActions();
 *   jobUi.addJob({ pipelineId, stageId, accountIds }) · jobUi.editJob(job) · jobUi.askMove(job) · jobUi.askDelete(job) · jobUi.moveTo(job, stageId)
 *   jobUi.moveMany(jobs, stageId) · jobUi.notify(message)
 *   {jobUi.ui}   ← render once (drawers, dialogs)
 */
export default function useJobActions() {
  const { pipelines = [], accounts = [], moveJob, deleteJobs } = useData();
  const { user } = useAuth() || {};
  const [modal, setModal] = useState(null);     // { kind: 'job', ... } | { kind: 'move', job } | { kind: 'delete', job } | { kind: 'results', groups }
  const pipelineOf = (job) => pipelines.find((p) => p.id === job.pipelineId);
  const stageName = (job, stageId) => pipelineOf(job)?.stages.find((s) => s.id === stageId)?.name || 'stage';
  const accountName = (job) => accounts.find((a) => a.id === job.accountId)?.name || '';

  /** Move a job; the new stage's automations run for its account. */
  const moveTo = (job, stageId) => {
    const results = moveJob(job.id, stageId, { me: user?.name });
    const ran = results.filter((r) => r.ok).length;
    notify(`Moved “${job.name}” to ${stageName(job, stageId)}${ran ? ` · ${ran} automation${ran > 1 ? 's' : ''} ran` : ''}`);
    setModal(results.length ? { kind: 'results', groups: [{ accountName: accountName(job), results }] } : null);
  };

  /** Move several jobs (same pipeline) to one stage; shows every automation result together. */
  const moveMany = (list, stageId) => {
    const moving = list.filter((j) => j.stageId !== stageId);
    if (!moving.length) return;
    const groups = [];
    moving.forEach((job) => {
      const results = moveJob(job.id, stageId, { me: user?.name });
      if (results.length) groups.push({ accountName: accountName(job), results });
    });
    const ran = groups.reduce((n, g) => n + g.results.filter((r) => r.ok).length, 0);
    notify(`Moved ${moving.length} job${moving.length > 1 ? 's' : ''} to ${stageName(moving[0], stageId)}${ran ? ` · ${ran} automation${ran > 1 ? 's' : ''} ran` : ''}`);
    setModal(groups.length ? { kind: 'results', groups } : null);
  };

  const ui = (
    <>
      {modal?.kind === 'job' && (
        <JobDrawer pipelineId={modal.pipelineId} stageId={modal.stageId} job={modal.job} accountIds={modal.accountIds || []} onClose={() => setModal(null)}
          onDone={({ message, results }) => { notify(message); setModal(results.length ? { kind: 'results', groups: results } : null); }} />
      )}
      {modal?.kind === 'move' && pipelineOf(modal.job) && (
        <MoveJobModal pipeline={pipelineOf(modal.job)} job={modal.job} onClose={() => setModal(null)} onMove={(stageId) => moveTo(modal.job, stageId)} />
      )}
      {modal?.kind === 'delete' && (
        <Modal title={`Delete “${modal.job.name}”?`} onClose={() => setModal(null)}
          footer={<>
            <Button variant="outline" onClick={() => setModal(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { deleteJobs([modal.job.id]); setModal(null); notify('Job deleted'); }}><Trash2 />Delete job</Button>
          </>}>
          <p className="text-sm text-muted-foreground">The job is removed from its pipeline. This can’t be undone.</p>
        </Modal>
      )}
      {modal?.kind === 'results' && <AutomationResultsModal groups={modal.groups} onClose={() => setModal(null)} />}
    </>
  );

  return {
    ui,
    moveTo,
    moveMany,
    notify,
    addJob: ({ pipelineId, stageId, accountIds } = {}) => setModal({ kind: 'job', pipelineId, stageId, accountIds }),
    editJob: (job) => setModal({ kind: 'job', job, pipelineId: job.pipelineId }),
    askMove: (job) => setModal({ kind: 'move', job }),
    askDelete: (job) => setModal({ kind: 'delete', job }),
  };
}
