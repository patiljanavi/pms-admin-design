import { AlertTriangle, Check } from 'lucide-react';
import { Avatar, Modal, initials } from '../ui';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { cn } from 'lib/utils';

/** What the automations did, per account. groups: [{ accountName, results: [{ ok, text }] }] */
export default function AutomationResultsModal({ title = 'Automations ran', groups, onClose }) {
  const all = groups.flatMap((g) => g.results);
  const done = all.filter((r) => r.ok).length;
  const skipped = all.length - done;
  return (
    <Modal title={title} onClose={onClose} width="max-w-lg"
      description={`${done} completed${skipped ? ` · ${skipped} skipped` : ''}${groups.length > 1 ? ` across ${groups.length} accounts` : ''}`}
      footer={<Button onClick={onClose}>Done</Button>}>
      <div className="flex flex-col gap-4">
        {groups.map((g, gi) => {
          const ok = g.results.filter((r) => r.ok).length;
          return (
            <section key={`${g.accountName}-${gi}`} aria-label={`Results for ${g.accountName}`} className="overflow-hidden rounded-lg border">
              <h3 className="flex items-center gap-2.5 border-b bg-subtle px-3 py-2 text-sm font-semibold">
                <Avatar text={initials(g.accountName)} size="xs" />
                <span className="min-w-0 flex-1 truncate">{g.accountName || 'Account'}</span>
                <Badge variant={ok === g.results.length ? 'success' : 'warning'} className="tabular-nums">{ok}/{g.results.length}</Badge>
              </h3>
              <ul className="flex flex-col divide-y">
                {g.results.map((r, i) => (
                  <li key={`${r.id}-${i}`} className="flex items-start gap-2.5 px-3 py-2.5 text-sm">
                    <span className={cn('mt-px inline-flex size-5 flex-none items-center justify-center rounded-full',
                      r.ok ? 'bg-success-50 text-success-700' : 'bg-warning-50 text-warning-700')}>
                      {r.ok ? <Check className="size-3" strokeWidth={3} aria-label="Done" /> : <AlertTriangle className="size-3" aria-label="Skipped" />}
                    </span>
                    <span className={r.ok ? 'text-foreground' : 'text-muted-foreground'}>{r.text}</span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </Modal>
  );
}
