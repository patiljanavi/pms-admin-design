import { useState } from 'react';
import { Check, Monitor, Tag, Trash2 } from 'lucide-react';
import { CloseButton, Drawer } from '../../../components/ui';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { cn } from 'lib/utils';
import { useData } from '../../../context/DataContext';
import { TAG_PALETTE, colorName } from '../../../components/TagChip';

/**
 * One drawer for creating and editing a client-facing job.
 * - job: the job to edit, or null to create a new one
 * - onSaved(job, isNew): called after saving
 * - onDelete(job): edit mode only
 * - usage: number of accounts using this job
 */
export default function ClientFacingJobDrawer({
  job,
  onClose,
  onSaved,
  onDelete,
  usage = 0,
}) {
  const { clientFacingJobNameTaken, saveClientFacingJob } = useData();

  const isNew = !job;
  const [label, setLabel] = useState(job?.label || '');
  const [color, setColor] = useState(
    job?.color || '#2563EB'
  );
  const [hexInput, setHexInput] = useState(
    job?.color || '#2563EB'
  );
  const [description, setDescription] = useState(
    job?.description || ''
  );
  const [error, setError] = useState('');

  const isHex = (value) => /^#[0-9A-Fa-f]{6}$/.test(value);

  const textOn = (hex) => {
    const value = hex.replace('#', '');
    const r = parseInt(value.substring(0, 2), 16);
    const g = parseInt(value.substring(2, 4), 16);
    const b = parseInt(value.substring(4, 6), 16);

    return (r * 299 + g * 587 + b * 114) / 1000 >= 150
      ? '#111827'
      : '#FFFFFF';
  };

  const pickColor = (hex) => {
    setColor(hex);
    setHexInput(hex);
  };

  const onHex = (value) => {
    const val = value.startsWith('#') ? value : `#${value}`;
    setHexInput(val);

    if (isHex(val)) {
      setColor(val.toUpperCase());
    }
  };

  const save = () => {
    const name = label.trim();

    if (!name) {
      setError('Enter a job name.');
      return;
    }

    if (name.length > 30) {
      setError('Keep the name to 30 characters or fewer.');
      return;
    }

    if (clientFacingJobNameTaken(name, job?.value)) {
      setError(`A job called “${name}” already exists.`);
      return;
    }

    // Replace saveTag with your client-facing job save function
    // if jobs are stored separately in DataContext.
    const id = saveClientFacingJob({
      value: job?.value,
      label: name,
      color,
      description: description.trim(),
    });

    onSaved?.(
      {
        value: id,
        label: name,
        color,
        description: description.trim(),
      },
      isNew
    );
  };

  const preview = {
    value: 'preview',
    label: label.trim() || 'Job name',
    color,
  };

  // Soft, theme-aware tint of the chosen colour for the header icon
  const tint = {
    backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)`,
    borderColor: `color-mix(in srgb, ${color} 35%, transparent)`,
    color: `color-mix(in srgb, ${color} 70%, hsl(var(--foreground)))`,
  };

  return (
    <Drawer
      onClose={onClose}
      label={isNew ? 'New client-facing job' : `Edit job ${job.label}`}
      width="max-w-[480px]"
    >
      <div className="flex h-full min-h-0 flex-1 flex-col">
        {/* Header */}
        <header className="flex items-start gap-3 border-b px-6 py-4">
          <span
            className="inline-flex size-9 flex-none items-center justify-center rounded-lg border shadow-xs transition-colors"
            style={tint}
            aria-hidden="true"
          >
            <Tag className="size-4" />
          </span>

          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-semibold tracking-tight">
              {isNew ? 'New client-facing job' : 'Edit job'}
            </h2>

            <p className="truncate text-sm text-muted-foreground">
              {isNew
                ? 'Create a job status visible to clients'
                : `Used by ${usage} account${usage === 1 ? '' : 's'}`}
            </p>
          </div>

          <CloseButton onClick={onClose} className="-mr-2" />
        </header>

        <form
          className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 py-5"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
          noValidate
        >
          {/* Preview: client-facing job status */}
          <div className="overflow-hidden rounded-xl border bg-subtle">
            <div className="flex items-center gap-1.5 border-b px-4 py-2 text-xs font-medium text-muted-foreground">
              <Monitor className="size-3.5" aria-hidden="true" />
              Client preview
            </div>

            <div className="p-4">
              <div className="rounded-lg border bg-card p-4 shadow-xs">
                <div className="mb-2 text-xs font-medium text-muted-foreground">
                  Job status
                </div>

                <span
                  className="inline-flex max-w-full items-center truncate rounded-full px-3 py-1 text-sm font-semibold shadow-xs"
                  style={{
                    backgroundColor: color,
                    color: textOn(color),
                  }}
                >
                  {preview.label}
                </span>

                {description.trim() && (
                  <p className="mt-3 text-sm text-muted-foreground">
                    {description.trim()}
                  </p>
                )}
              </div>

              <p className="mt-2.5 text-xs text-muted-foreground">
                This is how the job status will appear to clients.
              </p>
            </div>
          </div>

          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cf-job-name" className="text-sm font-medium">
              Name <span className="text-danger-700">*</span>
            </label>
            <Input
              id="cf-job-name"
              aria-invalid={!!error}
              value={label}
              maxLength={30}
              autoFocus
              onChange={(e) => {
                setLabel(e.target.value);
                setError('');
              }}
              placeholder="e.g. Documents requested"
            />

            <span className="flex justify-between gap-3 text-xs text-muted-foreground">
              <span role={error ? 'alert' : undefined} className={cn(error && 'text-danger-700')}>
                {error || 'Short and clear works best.'}
              </span>
              <span className={cn('tabular-nums', label.length >= 30 && 'font-medium text-warning-700')}>{label.length}/30</span>
            </span>
          </div>

          {/* Color */}
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-2 text-sm font-medium">Color</legend>

            <div role="radiogroup" aria-label="Tag color" className="flex flex-wrap items-center gap-2">
              {TAG_PALETTE.map(({ hex, name }) => {
                const selected = color.toLowerCase() === hex.toLowerCase();

                return (
                  <button
                    key={hex}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-label={name}
                    title={name}
                    onClick={() => pickColor(hex)}
                    className={cn(
                      'flex size-7 shrink-0 items-center justify-center rounded-full transition-all duration-150',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card',
                      selected
                        ? 'ring-2 ring-foreground/70 ring-offset-2 ring-offset-card'
                        : 'ring-1 ring-inset ring-foreground/10 hover:scale-110 hover:shadow-raised'
                    )}
                    style={{ backgroundColor: hex, color: textOn(hex) }}
                  >
                    {selected && <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label className="relative inline-flex size-9 cursor-pointer items-center justify-center overflow-hidden rounded-md border border-input bg-card shadow-xs transition-colors hover:bg-accent">
                <span className="sr-only">Custom</span>
                <span className="size-5 rounded ring-1 ring-inset ring-foreground/10" style={{ backgroundColor: color }} aria-hidden="true" />
                <input
                  type="color"
                  value={color}
                  onChange={(e) => pickColor(e.target.value.toUpperCase())}
                  className="absolute inset-0 cursor-pointer opacity-0"
                  aria-label="Pick a custom color"
                />
              </label>

              <Input
                aria-label="Hex color"
                aria-invalid={!isHex(hexInput)}
                value={hexInput}
                onChange={(e) => onHex(e.target.value.trim())}
                maxLength={7}
                className="w-28 font-mono uppercase"
              />

              <Badge variant="neutral">{colorName(color)}</Badge>
            </div>

            {!isHex(hexInput) && (
              <p className="text-xs text-danger-700">Use a 6-digit hex code like #1D4ED8.</p>
            )}
          </fieldset>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cf-job-description" className="text-sm font-medium">
              Description <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <Textarea
              id="cf-job-description"
              className="min-h-[84px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="When should the team use this job status? (optional)"
            />
          </div>

          <button
            type="submit"
            className="hidden"
            aria-hidden="true"
            tabIndex={-1}
          />
        </form>

        {/* Footer */}
        <footer className="flex flex-wrap items-center justify-between gap-2 border-t bg-subtle px-6 py-3.5">
          {!isNew ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => onDelete?.(job)}
              className="text-danger-700 hover:bg-danger-50 hover:text-danger-700"
            >
              <Trash2 aria-hidden="true" />
              Delete job
            </Button>
          ) : (
            <span />
          )}

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>

            <Button type="button" onClick={save}>
              {isNew ? 'Create job' : 'Save changes'}
            </Button>
          </div>
        </footer>
      </div>
    </Drawer>
  );
}
