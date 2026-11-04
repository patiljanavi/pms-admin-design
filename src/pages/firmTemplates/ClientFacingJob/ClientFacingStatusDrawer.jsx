import { useState } from 'react';
import { FiCheck, FiTag, FiTrash2, FiX } from 'react-icons/fi';
import { Drawer, cx } from '../../../components/ui';
import { useData } from '../../../context/DataContext';
import  { TAG_PALETTE, colorName,  } from '../../../components/TagChip';
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

  return (
    <Drawer
      onClose={onClose}
      label={isNew ? 'New client-facing job' : `Edit job ${job.label}`}
      width="max-w-[480px]"
    >
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-line p-5 sm:p-6">
        <span
          className="flex h-14 w-14 flex-none items-center justify-center rounded-full"
          style={{
            backgroundColor: color,
            color: textOn(color),
          }}
          aria-hidden="true"
        >
          <FiTag size={22} />
        </span>

        <div className="min-w-0 flex-1">
          <h2 className="truncate text-xl font-bold">
            {isNew ? 'New client-facing job' : 'Edit job'}
          </h2>

          <div className="truncate text-muted">
            {isNew
              ? 'Create a job status visible to clients'
              : `Used by ${usage} account${usage === 1 ? '' : 's'}`}
          </div>
        </div>

        <button
          onClick={onClose}
          aria-label="Close"
          className="flex h-10 w-10 flex-none items-center justify-center rounded text-muted hover:bg-subtle"
        >
          <FiX size={20} />
        </button>
      </div>

      <form
        className="flex flex-1 flex-col gap-6 p-5 sm:p-6"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
        noValidate
      >
        {/* Preview: client-facing job status */}
        <div className="rounded-lg border border-line bg-subtle p-4">
          <div className="mb-2.5 text-xs font-semibold text-muted">
            Client preview
          </div>

          <div className="rounded-lg border border-line bg-surface p-4">
            <div className="mb-2 text-xs font-medium text-muted">
              Job status
            </div>

            <span
              className="inline-flex items-center rounded-full px-3 py-1.5 text-sm font-semibold"
              style={{
                backgroundColor: color,
                color: textOn(color),
              }}
            >
              {preview.label}
            </span>

            {description.trim() && (
              <p className="mt-3 text-sm text-muted">
                {description.trim()}
              </p>
            )}
          </div>

          <p className="mt-2.5 text-xs text-muted">
            This is how the job status will appear to clients.
          </p>
        </div>

        {/* Name */}
        <label className="field-label">
          Name *
          <input
            className={cx('input', error && 'border-danger-700')}
            value={label}
            maxLength={30}
            autoFocus
            onChange={(e) => {
              setLabel(e.target.value);
              setError('');
            }}
            placeholder="e.g. Documents requested"
          />

          <span className="flex justify-between text-xs font-normal text-muted">
            <span className={cx(error && 'font-semibold text-danger-700')}>
              {error || 'Short and clear works best.'}
            </span>
            <span>{label.length}/30</span>
          </span>
        </label>

        {/* Color */}
        {/* <fieldset>
          <legend className="mb-2.5 text-sm font-semibold">
            Color
          </legend>

          <div className="grid grid-cols-6 gap-2.5">
            {[
              '#2563EB',
              '#16A34A',
              '#DC2626',
              '#9333EA',
              '#EA580C',
              '#0891B2',
            ].map((hex) => {
              const selected = color.toLowerCase() === hex.toLowerCase();

              return (
                <button
                  key={hex}
                  type="button"
                  aria-label={hex}
                  aria-pressed={selected}
                  onClick={() => pickColor(hex)}
                  className={cx(
                    'flex aspect-square items-center justify-center rounded-full transition-transform',
                    selected
                      ? 'ring-2 ring-ink ring-offset-2'
                      : 'hover:scale-105'
                  )}
                  style={{
                    backgroundColor: hex,
                    color: textOn(hex),
                  }}
                >
                  {selected && <FiCheck size={18} />}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm font-semibold">
              Custom
              <input
                type="color"
                value={color}
                onChange={(e) => pickColor(e.target.value.toUpperCase())}
                className="h-10 w-12 cursor-pointer rounded border border-line-strong bg-surface p-1"
                aria-label="Pick a custom color"
              />
            </label>

            <input
              aria-label="Hex color"
              value={hexInput}
              onChange={(e) => onHex(e.target.value.trim())}
              maxLength={7}
              className={cx(
                'input w-32 font-mono uppercase',
                !isHex(hexInput) && 'border-danger-700'
              )}
            />

            <span className="text-sm text-muted">{color}</span>
          </div>

          {!isHex(hexInput) && (
            <p className="mt-1.5 text-sm text-danger-700">
              Use a 6-digit hex code like #1D4ED8.
            </p>
          )}
        </fieldset> */}
<fieldset>
  <legend className="mb-2.5 text-sm font-semibold">Color</legend>

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
          className={cx(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all duration-150',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2',
            selected
              ? 'ring-2 ring-ink ring-offset-2 ring-offset-surface'
              : 'ring-1 ring-inset ring-black/10 hover:scale-110 hover:shadow-sm'
          )}
          style={{ backgroundColor: hex, color: textOn(hex) }}
        >
          {selected && <FiCheck size={14} strokeWidth={3} aria-hidden="true" />}
        </button>
      );
    })}
  </div>

  <div className="mt-4 flex flex-wrap items-center gap-3">
    <label className="flex items-center gap-2 text-sm font-semibold">
      Custom
      <input
        type="color"
        value={color}
        onChange={(e) => pickColor(e.target.value.toUpperCase())}
        className="h-10 w-12 cursor-pointer rounded border border-line-strong bg-surface p-1"
        aria-label="Pick a custom color"
      />
    </label>

    <input
      aria-label="Hex color"
      value={hexInput}
      onChange={(e) => onHex(e.target.value.trim())}
      maxLength={7}
      className={cx('input w-32 font-mono uppercase', !isHex(hexInput) && 'border-danger-700')}
    />

    <span className="text-sm text-muted">{colorName(color)}</span>
  </div>

  {!isHex(hexInput) && (
    <p className="mt-1.5 text-sm text-danger-700">Use a 6-digit hex code like #1D4ED8.</p>
  )}
</fieldset>
        {/* Description */}
        <label className="field-label">
          Description
          <textarea
            className="input min-h-[84px] py-2.5"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="When should the team use this job status? (optional)"
          />
        </label>

        <button
          type="submit"
          className="hidden"
          aria-hidden="true"
          tabIndex={-1}
        />
      </form>

      {/* Footer */}
      <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-2.5 border-t border-line bg-subtle px-5 py-4 sm:px-6">
        {!isNew ? (
          <button
            type="button"
            onClick={() => onDelete?.(job)}
            className="inline-flex min-h-[44px] items-center gap-2 rounded px-3 font-semibold text-danger-700 hover:bg-danger-50"
          >
            <FiTrash2 aria-hidden="true" />
            Delete job
          </button>
        ) : (
          <span />
        )}

        <div className="flex gap-2.5">
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            type="button"
            className="btn-primary"
            onClick={save}
          >
            {isNew ? 'Create job' : 'Save changes'}
          </button>
        </div>
      </div>
    </Drawer>
  );
}