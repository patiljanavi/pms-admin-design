import { useEffect, useMemo, useState } from 'react';
import { Download, Flag, Palette, Pencil, Plus, SearchX, Text, Trash2, X } from 'lucide-react';

import Pagination, { usePagination } from '../../../components/Pagination';
import { Modal } from '../../../components/ui';
import {
  BulkBar,
  HeaderCheckbox,
  SelectCheckbox,
  SelectedOnlyFilter,
  barButton,
  barDanger,
  downloadCsv,
  useSelection,
} from '../../../components/TableSelection';
import FacetFilter from '../../../components/FacetFilter';
import RowActionsMenu from '../../../components/RowActionsMenu';
import { colorName } from '../../../components/TagChip';
import { Button } from '../../../components/ui/button';
import { toast } from '../../../components/ui/sonner';
import { SimpleTooltip } from '../../../components/ui/tooltip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { DataCard, EmptyState, SearchInput, StatCard } from '../../../components/page';
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

const DEFAULT_COLOR = '#9CA3AF';

/**
 * Status pill tinted from the job's colour. color-mix keeps it readable on light and dark
 * surfaces: a soft tint background, a darker/lighter text mixed towards the foreground.
 */
function StatusPill({ color, children, className = '' }) {
  const hex = color || DEFAULT_COLOR;
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-sm font-medium ${className}`}
      style={{
        backgroundColor: `color-mix(in srgb, ${hex} 14%, transparent)`,
        borderColor: `color-mix(in srgb, ${hex} 32%, transparent)`,
        color: `color-mix(in srgb, ${hex} 62%, hsl(var(--foreground)))`,
      }}
    >
      <span className="size-2 flex-none rounded-full" style={{ backgroundColor: hex }} aria-hidden="true" />
      <span className="truncate">{children}</span>
    </span>
  );
}

const notify = (message) => (/delet/i.test(message) ? toast(message) : toast.success(message));

export default function ClientFacingTemplates() {
  const { clientFacingJobs, deleteClientFacingJobs } = useData();

  const [q, setQ] = useState('');
  const [colors, setColors] = useState([]);
  const [drawer, setDrawer] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [selectedOnly, setSelectedOnly] = useState(false);

  const selection = useSelection();

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

  const colorFacets = useMemo(
    () =>
      colorsInUse.map((hex) => {
        const name = colorName(hex);
        const label = name === 'Custom' ? hex : name;
        return {
          value: hex,
          label,
          count: clientFacingJobs.filter((job) => job.color?.toUpperCase() === hex).length,
          render: () => (
            <span className="flex items-center gap-2">
              <span className="size-3 rounded-full ring-1 ring-inset ring-foreground/10" style={{ backgroundColor: hex }} aria-hidden="true" />
              {label}
            </span>
          ),
        };
      }),
    [colorsInUse, clientFacingJobs]
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

  const withDescription = clientFacingJobs.filter((job) => job.description?.trim()).length;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Client Facing Templates</h2>
          <p className="text-sm text-muted-foreground">
            Templates for client-facing communications.
          </p>
        </div>

        <Button onClick={() => setDrawer({ clientFacingJob: null })}>
          <Plus />
          New Client Facing Template
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
        <StatCard label="Total templates" value={clientFacingJobs.length} icon={Flag} />
        <StatCard label="Colors in use" value={colorsInUse.length} icon={Palette} hint="Filter by color below" />
        <StatCard label="With description" value={withDescription} icon={Text}
          hint={`${Math.round((withDescription / Math.max(clientFacingJobs.length, 1)) * 100)}% of templates`} className="col-span-2 lg:col-span-1" />
      </div>

      <DataCard
        toolbar={
          <>
            <SearchInput
              value={q}
              onChange={(value) => {
                setQ(value);
                setPage(1);
              }}
              label="Search client-facing jobs"
              placeholder="Search client-facing jobs"
              className="h-8 w-full sm:w-72"
            />
            {colorFacets.length > 0 && (
              <FacetFilter
                title="Color"
                icon={Palette}
                options={colorFacets}
                value={colors}
                onChange={(value) => {
                  setColors(value);
                  setPage(1);
                }}
              />
            )}
            {filtersOn && (
              <Button variant="ghost" size="sm" onClick={reset} className="text-muted-foreground">
                Clear filters
                <X />
              </Button>
            )}
            <span className="ml-auto hidden text-sm text-muted-foreground md:inline">
              {filtered.length} of {clientFacingJobs.length}
            </span>
          </>
        }
        footer={filtered.length > 0 && <Pagination {...paging} label="client-facing jobs" />}
      >
        <Table className="min-w-[720px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <HeaderCheckbox selection={selection} pageIds={rows.map((job) => job.value)} />
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-20"><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((job) => {
              const checked = selection.has(job.value);

              return (
                <TableRow key={job.value} data-state={checked ? 'selected' : undefined} className="group">
                  <TableCell>
                    <SelectCheckbox
                      label={`Select ${job.label}`}
                      checked={checked}
                      onChange={() => selection.toggle(job.value)}
                    />
                  </TableCell>
                  <TableCell className="max-w-[300px]">
                    <button
                      type="button"
                      onClick={() => setDrawer({ clientFacingJob: job })}
                      className="max-w-full rounded-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                      aria-label={`${job.label} (color ${job.color || 'default'}) — edit`}
                    >
                      <StatusPill color={job.color} className="transition-shadow hover:shadow-raised">{job.label}</StatusPill>
                    </button>
                  </TableCell>
                  <TableCell className="max-w-[420px]">
                    {job.description ? (
                      <span className="line-clamp-1 text-sm text-muted-foreground">{job.description}</span>
                    ) : (
                      <span className="text-muted-foreground/60">—</span>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{fmtDate(job.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-0.5">
                      <SimpleTooltip label="Edit job">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setDrawer({ clientFacingJob: job })}
                          aria-label={`Edit ${job.label}`}
                          className="text-muted-foreground opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
                        >
                          <Pencil />
                        </Button>
                      </SimpleTooltip>
                      <RowActionsMenu
                        label={job.label}
                        onEdit={() => setDrawer({ clientFacingJob: job })}
                        onDelete={() => setConfirm([job])}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5}>
                  {clientFacingJobs.length ? (
                    <EmptyState
                      icon={SearchX}
                      title="No jobs match these filters."
                      description="Try a different search or remove the color filter."
                      action={<Button variant="outline" onClick={reset}>Clear filters</Button>}
                    />
                  ) : (
                    <EmptyState
                      icon={Flag}
                      title="No client-facing jobs yet."
                      description="Create one to get started."
                      action={
                        <Button onClick={() => setDrawer({ clientFacingJob: null })}>
                          <Plus />
                          New Client Facing Job
                        </Button>
                      }
                    />
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </DataCard>

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
              type="button"
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
              <Download aria-hidden="true" />
              Export
            </button>

            <button
              type="button"
              className={barDanger}
              disabled={selectedJobs.length === 0}
              onClick={() => setConfirm(selectedJobs)}
            >
              <Trash2 aria-hidden="true" />
              Delete
            </button>
          </>
        }
      />

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
          description="This action cannot be undone."
          onClose={() => setConfirm(null)}
          footer={
            <>
              <Button variant="outline" onClick={() => setConfirm(null)}>
                Cancel
              </Button>

              <Button variant="destructive" onClick={doDelete}>
                <Trash2 />
                Delete {confirm.length === 1 ? 'template' : 'templates'}
              </Button>
            </>
          }
        >
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{' '}
            {confirm.length === 1
              ? `“${confirm[0].label}”`
              : `${confirm.length} client-facing templates`}
            ?
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {confirm.slice(0, 12).map((job) => <StatusPill key={job.value} color={job.color}>{job.label}</StatusPill>)}
            {confirm.length > 12 && <span className="self-center text-xs text-muted-foreground">+{confirm.length - 12} more</span>}
          </div>
        </Modal>
      )}
    </div>
  );
}
