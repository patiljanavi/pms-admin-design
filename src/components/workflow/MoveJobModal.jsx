import { useState } from 'react';
import { Modal, cx } from '../ui';

/** Keyboard-friendly way to move a job: pick the stage. */
export default function MoveJobModal({ pipeline, job, onMove, onClose }) {
  const [stageId, setStageId] = useState(job.stageId);
  return (
    <Modal title={`Move “${job.name}”`} subtitle="Choose a stage" onClose={onClose} width="max-w-md"
      footer={<><button type="button" className="btn-secondary" onClick={onClose}>Cancel</button><button type="button" className="btn-primary" disabled={stageId === job.stageId} onClick={() => onMove(stageId)}>Move</button></>}>
      <div role="radiogroup" aria-label="Stages" className="flex flex-col gap-1">
        {pipeline.stages.map((s, i) => (
          <label key={s.id} className={cx('flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5', stageId === s.id ? 'border-brand-600 bg-brand-50' : 'border-line hover:bg-subtle')}>
            <input type="radio" name="move-stage" checked={stageId === s.id} onChange={() => setStageId(s.id)} className="h-4 w-4 accent-brand-600" />
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-subtle px-1 text-[11px] font-bold text-muted">{i + 1}</span>
            <span className="flex-1">{s.name}</span>
            {s.id === job.stageId && <span className="text-xs text-muted">current</span>}
          </label>
        ))}
      </div>
    </Modal>
  );
}
