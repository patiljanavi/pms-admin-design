import { useId } from 'react';
import { CircleDashed } from 'lucide-react';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { cn } from 'lib/utils';

/** Status colour dot. Colours are data, so they go inline; the ring keeps light colours visible in both themes. */
export function StatusDot({ color, className }) {
  return <span className={cn('size-2.5 flex-none rounded-full ring-1 ring-inset ring-foreground/10', className)} style={{ backgroundColor: color }} aria-hidden="true" />;
}

/** Dropdown of client-facing statuses ({ id, name, color }) with a colour dot for each. */
export default function ColorStatusSelect({ label = 'Status', value, onChange, statuses, error }) {
  const id = useId();
  const current = statuses.find((s) => String(s.id) === String(value));
  const errorId = `${id}-error`;
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select value={current ? String(current.id) : ''}
        onValueChange={(v) => { const s = statuses.find((x) => String(x.id) === v); if (s) onChange(s.id); }}>
        <SelectTrigger id={id} aria-invalid={!!error} aria-describedby={error ? errorId : undefined}
          className={cn(error && 'border-destructive focus:border-destructive focus:ring-destructive/20')}>
          <SelectValue placeholder="Select status" />
        </SelectTrigger>
        <SelectContent aria-label="Client-facing statuses" className="max-h-72">
          {statuses.map((s) => (
            <SelectItem key={s.id} value={String(s.id)}>
              <span className="flex items-center gap-2"><StatusDot color={s.color} />{s.name}</span>
            </SelectItem>
          ))}
          {statuses.length === 0 && (
            <div className="flex items-center gap-2 px-2 py-3 text-sm text-muted-foreground">
              <CircleDashed className="size-4" aria-hidden="true" />No client-facing statuses yet.
            </div>
          )}
        </SelectContent>
      </Select>
      {error && <p id={errorId} className="text-xs text-danger-700">{error}</p>}
    </div>
  );
}
