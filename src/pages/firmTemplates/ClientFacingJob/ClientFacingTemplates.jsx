import { useEffect, useMemo, useState } from 'react';
import { FiDownload, FiEdit2, FiTrash2, FiSearch } from 'react-icons/fi';

import Pagination, { usePagination } from '../../../components/Pagination';
import { Modal, cx } from '../../../components/ui';
import {
  BulkBar,
  SelectCheckbox,
  SelectedOnlyFilter,
  barButton,
  barDanger,
  downloadCsv,
  useSelection,
} from '../../../components/TableSelection';
import { useData } from '../../../context/DataContext';
import ClientFacingDrawer from './ClientFacingStatusDrawer';

const fmtDate = (date) =>
  date
    ? new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '—';

export default function ClientFacingTemplates() {
  const { clientFacingJobs, deleteClientFacingJobs } = useData();

  const [q, setQ] = useState('');
  const [colors, setColors] = useState([]);
  const [drawer, setDrawer] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [toast, setToast] = useState('');
  const [selectedOnly, setSelectedOnly] = useState(false);

  const selection = useSelection();

  const notify = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 2600);
  };

  useEffect(() => {
    if (selection.count === 0) {
      setSelectedOnly(false);
    }
  }, [selection.count]);

  // Available job colors
  const colorsInUse = useMemo(
    () => [
      ...new Set(
        clientFacingJobs
          .map((job) => job.color?.toUpperCase())
          .filter(Boolean)
      ),
    ],
    [clientFacingJobs]
  );

  // Search, color filter, selected-only filter, sorted by name
  const filtered = useMemo(() => {
    const search = q.trim().toLowerCase();

    return clientFacingJobs
      .filter(
        (job) =>
          (!search ||
            `${job.label} ${job.description || ''}`
              .toLowerCase()
              .includes(search)) &&
          (!colors.length || colors.includes(job.color?.toUpperCase())) &&
          (!selectedOnly || selection.has(job.value))
      )
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [clientFacingJobs, q, colors, selectedOnly, selection]);

  // Pagination
  const paging = usePagination(filtered, {
    initialSize: 10,
    storageKey: 'client-facing-jobs',
  });

  const { pageItems: rows, setPage } = paging;

  // Selected jobs
  const selectedJobs = clientFacingJobs.filter((job) =>
    selection.has(job.value)
  );

  const filtersOn = Boolean(q || colors.length);

  const reset = () => {
    setQ('');
    setColors([]);
    setSelectedOnly(false);
    setPage(1);
  };

  const toggleColor = (hex) => {
    setColors((current) =>
      current.includes(hex)
        ? current.filter((color) => color !== hex)
        : [...current, hex]
    );

    setPage(1);
  };

  // Delete selected jobs
  const doDelete = () => {
    if (!confirm?.length) return;

    const ids = confirm.map((job) => job.value);

    deleteClientFacingJobs(ids);
    selection.setMany(ids, false);

    setConfirm(null);
    setDrawer(null);

    notify(
      `Deleted ${ids.length} client-facing job${ids.length > 1 ? 's' : ''}`
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-sm text-muted">Templates / Client Facing</div>

          <h1 className="mt-1 text-3xl font-bold">Client Facing Templates</h1>

          <p className="mt-1 text-muted">
            Templates for client-facing communications.
          </p>
        </div>

        <button
          className="btn-primary"
          onClick={() => setDrawer({ clientFacingJob: null })}
        >
          + New Client Facing Template
        </button>
      </header>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="card p-4 sm:p-5">
          <div className="text-sm text-muted">Total templates</div>
          <div className="mt-1.5 text-2xl font-bold">
            {clientFacingJobs.length}
          </div>
        </div>
      </div>

      {/* Search and color filters */}
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-4 sm:px-5">
        <label className="flex min-h-[42px] flex-[1_1_220px] items-center gap-2 rounded border border-line-strong px-3 focus-within:border-brand-600">
          <FiSearch size={18} className="text-muted" aria-hidden="true" />

          <span className="sr-only">Search client-facing jobs</span>

          <input
            value={q}
            onChange={(event) => {
              setQ(event.target.value);
              setPage(1);
            }}
            placeholder="Search client-facing jobs"
            className="min-w-0 flex-1 bg-transparent outline-none"
          />
        </label>

        <div
          className="flex flex-wrap items-center gap-2"
          role="group"
          aria-label="Filter by color"
        >
          <span className="text-sm text-muted">Color</span>

          {colorsInUse.map((hex) => {
            const active = colors.includes(hex);

            return (
              <button
                key={hex}
                type="button"
                aria-pressed={active}
                aria-label={`Filter by color ${hex}`}
                title={hex}
                onClick={() => toggleColor(hex)}
                className={cx(
                  'h-7 w-7 rounded-full',
                  active
                    ? 'ring-2 ring-ink ring-offset-2'
                    : 'ring-1 ring-black/10 hover:scale-110'
                )}
                style={{ backgroundColor: hex }}
              />
            );
          })}
        </div>

        {filtersOn && (
          <button onClick={reset} className="btn-link px-2">
            Clear filters
          </button>
        )}
      </div>

      {/* Bulk actions */}
      <BulkBar
        count={selection.count}
        total={filtered.length}
        onSelectAll={() =>
          selection.setMany(
            filtered.map((job) => job.value),
            true
          )
        }
        onClear={selection.clear}
        filters={
          <SelectedOnlyFilter
            checked={selectedOnly}
            onChange={(value) => {
              setSelectedOnly(value);
              setPage(1);
            }}
          />
        }
        actions={
          <>
            <button
              className={barButton}
              disabled={selectedJobs.length === 0}
              onClick={() => {
                downloadCsv('client-facing-jobs-selected.csv', [
                  ['Name', 'Color', 'Created', 'Description'],
                  ...selectedJobs.map((job) => [
                    job.label,
                    job.color || '',
                    job.createdAt || '',
                    job.description || '',
                  ]),
                ]);

                notify(`Exported ${selectedJobs.length} jobs`);
              }}
            >
              <FiDownload aria-hidden="true" />
              Export
            </button>

            <button
              className={barDanger}
              disabled={selectedJobs.length === 0}
              onClick={() => setConfirm(selectedJobs)}
            >
              <FiTrash2 aria-hidden="true" />
              Delete
            </button>
          </>
        }
      />

      {/* Client-facing job cards */}
      <div className="p-4 sm:p-5">
        {rows.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {rows.map((job) => {
              const checked = selection.has(job.value);

              return (
                <article
                  key={job.value}
                  className={cx(
                    'group flex min-w-0 flex-col rounded-xl border p-4 transition-colors',
                    checked
                      ? 'border-brand-600 bg-brand-50/50'
                      : 'border-line hover:border-line-strong hover:bg-subtle/40'
                  )}
                >
                  {/* Card header */}
                  <div className="flex items-start gap-3">
                    <div className="pt-1">
                      <SelectCheckbox
                        label={`Select ${job.label}`}
                        checked={checked}
                        onChange={() => selection.toggle(job.value)}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-2.5">
                        <span
                          className="mt-1.5 h-3 w-3 flex-none rounded-full ring-1 ring-black/10"
                          style={{ backgroundColor: job.color || '#9CA3AF' }}
                          aria-label={`Color ${job.color || 'default'}`}
                          title={job.color || 'Default color'}
                        />

                        <h3 className="min-w-0 break-words font-semibold text-ink">
                          {job.label}
                        </h3>
                      </div>

                      <p className="line-clamp-1 text-sm text-muted-foreground">
                        {job.description || '-'}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-none items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setDrawer({ clientFacingJob: job })}
                        aria-label={`Edit ${job.label}`}
                        title="Edit job"
                        className="flex h-9 w-9 items-center justify-center rounded-md text-muted hover:bg-subtle hover:text-ink"
                      >
                        <FiEdit2 aria-hidden="true" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setConfirm([job])}
                        aria-label={`Delete ${job.label}`}
                        title="Delete job"
                        className="flex h-9 w-9 items-center justify-center rounded-md text-danger-700 hover:bg-danger-50"
                      >
                        <FiTrash2 aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  {/* Card footer */}
                  <div className="mt-4 flex items-center justify-end border-t border-line-soft pt-3 text-xs text-muted">
                    <span>{fmtDate(job.createdAt)}</span>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 p-8 text-center text-muted sm:p-12">
            {clientFacingJobs.length
              ? 'No jobs match these filters.'
              : 'No client-facing jobs yet. Create one to get started.'}

            {clientFacingJobs.length > 0 ? (
              <button onClick={reset} className="btn-secondary">
                Clear filters
              </button>
            ) : (
              <button
                onClick={() => setDrawer({ clientFacingJob: null })}
                className="btn-primary"
              >
                + New Client Facing Job
              </button>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      <Pagination {...paging} label="client-facing jobs" />

      {/* Create/Edit drawer */}
      {drawer && (
        <ClientFacingDrawer
          key={drawer.clientFacingJob?.value || 'new'}
          job={drawer.clientFacingJob}
          onClose={() => setDrawer(null)}
          onSaved={(job, isNew) => {
            setDrawer(null);
            notify(isNew ? `Created “${job.label}”` : `Saved “${job.label}”`);
          }}
          onDelete={(job) => setConfirm([job])}
        />
      )}

      {/* Delete confirmation */}
      {confirm && (
        <Modal
          title={
            confirm.length === 1
              ? `Delete “${confirm[0].label}”?`
              : `Delete ${confirm.length} templates?`
          }
          onClose={() => setConfirm(null)}
          footer={
            <>
              <button
                className="btn-secondary"
                onClick={() => setConfirm(null)}
              >
                Cancel
              </button>

              <button
                className="btn bg-danger-700 text-white hover:bg-[#831E15]"
                onClick={doDelete}
              >
                Delete {confirm.length === 1 ? 'template' : 'templates'}
              </button>
            </>
          }
        >
          <p className="text-muted">
            Are you sure you want to delete{' '}
            {confirm.length === 1
              ? `“${confirm[0].label}”`
              : `${confirm.length} client-facing templates`}
            ? This action cannot be undone.
          </p>
        </Modal>
      )}

      {/* Toast */}
      {toast && (
        <div
          role="status"
          className="fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-md bg-ink px-5 py-3 font-semibold text-white"
        >
          {toast}
        </div>
      )}
    </div>
  );
}