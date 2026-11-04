import { useState } from 'react';
import JobDrawer from './JobDrawer';
import MoveJobModal from './MoveJobModal';
import AutomationResultsModal from './AutomationResultsModal';
import { Modal } from '../ui';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';

/**
 * Create / edit / move / delete jobs, with the stage automations and their results.
 * Shared by the Workflow board and the account Workflow tab.
 *   const jobUi = useJobActions();
 *   jobUi.addJob({ pipelineId, stageId, accountIds }) · jobUi.editJob(job) · jobUi.askMove(job) · jobUi.askDelete(job) · jobUi.moveTo(job, stageId)
 *   {jobUi.ui}   ← render once (drawers, dialogs, message)
 */
export default function useJobActions() {
  const { pipelines = [], accounts = [], moveJob, deleteJobs } = useData();
  const { user } = useAuth() || {};
  const [modal, setModal] = useState(null);     // { kind: 'job', ... } | { kind: 'move', job } | { kind: 'delete', job } | { kind: 'results', groups }
  const [toast, setToast] = useState('');
  const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 2600); };
  const pipelineOf = (job) => pipelines.find((p) => p.id === job.pipelineId);
  const stageName = (job, stageId) => pipelineOf(job)?.stages.find((s) => s.id === stageId)?.name || 'stage';

  /** Move a job; the new stage's automations run for its account. */
  const moveTo = (job, stageId) => {
    const results = moveJob(job.id, stageId, { me: user?.name });
    const ran = results.filter((r) => r.ok).length;
    notify(`Moved “${job.name}” to ${stageName(job, stageId)}${ran ? ` · ${ran} automation${ran > 1 ? 's' : ''} ran` : ''}`);
    setModal(results.length ? { kind: 'results', groups: [{ accountName: accounts.find((a) => a.id === job.accountId)?.name || '', results }] } : null);
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
          footer={<><button className="btn-secondary" onClick={() => setModal(null)}>Cancel</button><button className="btn bg-danger-700 text-white hover:bg-[#831E15]" onClick={() => { deleteJobs([modal.job.id]); setModal(null); notify('Job deleted'); }}>Delete job</button></>}>
          <p className="text-muted">The job is removed from its pipeline.</p>
        </Modal>
      )}
      {modal?.kind === 'results' && <AutomationResultsModal groups={modal.groups} onClose={() => setModal(null)} />}
      {toast && <div role="status" className="fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-md bg-ink px-5 py-3 font-semibold text-white">{toast}</div>}
    </>
  );

  return {
    ui,
    moveTo,
    addJob: ({ pipelineId, stageId, accountIds } = {}) => setModal({ kind: 'job', pipelineId, stageId, accountIds }),
    editJob: (job) => setModal({ kind: 'job', job, pipelineId: job.pipelineId }),
    askMove: (job) => setModal({ kind: 'move', job }),
    askDelete: (job) => setModal({ kind: 'delete', job }),
  };
}
