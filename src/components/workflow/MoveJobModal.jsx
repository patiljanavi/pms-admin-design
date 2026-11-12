import { useState } from 'react';
import { ArrowRight, Zap } from 'lucide-react';
import { Modal, RadioDot } from '../ui';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { cn } from 'lib/utils';
import { StageDot } from './KanbanBoard';

/** Keyboard-friendly way to move a job: pick the stage. */
export default function MoveJobModal({ pipeline, job, onMove, onClose }) {
  const [stageId, setStageId] = useState(job.stageId);
  const target = pipeline.stages.find((s) => s.id === stageId);
  const autos = stageId !== job.stageId ? target?.automations?.length || 0 : 0;
  return (
    <Modal title={`Move “${job.name}”`} subtitle="Choose a stage" description={pipeline.pipelineName} onClose={onClose} width="max-w-md"
      footer={<>
        {autos > 0 && (
          <span className="mr-auto inline-flex items-center gap-1.5 text-xs text-warning-700">
            <Zap className="size-3.5" aria-hidden="true" />{autos} automation{autos > 1 ? 's' : ''} will run
          </span>
        )}
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button disabled={stageId === job.stageId} onClick={() => onMove(stageId)}>Move<ArrowRight /></Button>
      </>}>
      <div role="radiogroup" aria-label="Stages" className="flex flex-col gap-1.5">
        {pipeline.stages.map((s, i) => {
          const on = stageId === s.id;
          const current = s.id === job.stageId;
          return (
            <label key={s.id}
              className={cn('flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring/50',
                on ? 'border-primary/50 bg-primary/5' : 'hover:bg-accent')}>
              <input type="radio" name="move-stage" checked={on} onChange={() => setStageId(s.id)} className="sr-only" />
              <RadioDot on={on} />
              <StageDot index={i} />
              <span className="w-4 text-xs tabular-nums text-muted-foreground">{i + 1}</span>
              <span className={cn('min-w-0 flex-1 truncate', on && 'font-medium')}>{s.name}</span>
              {s.automations?.length > 0 && (
                <span className="inline-flex items-center gap-0.5 text-xs text-warning-700" title={`${s.automations.length} automations`}>
                  <Zap className="size-3" aria-hidden="true" />{s.automations.length}<span className="sr-only"> automations</span>
                </span>
              )}
              {current && <Badge variant="neutral">Current</Badge>}
            </label>
          );
        })}
      </div>
    </Modal>
  );
}
