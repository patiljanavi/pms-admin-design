import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowDown, ArrowUp, ArrowUpDown, Building2, CircleDashed, Download, Palette, Plus, SearchX, Settings2, Tag, Tags as TagsIcon, Trash2, X,
} from 'lucide-react';
import Pagination, { usePagination } from '../../../components/Pagination';
import { Modal, Segmented } from '../../../components/ui';
import { Button } from '../../../components/ui/button';
import { toast } from '../../../components/ui/sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';
import { DataCard, EmptyState, PageHeader, SearchInput, StatCard } from '../../../components/page';
import FacetFilter from '../../../components/FacetFilter';
import TagChip, { TAG_PALETTE, colorName } from '../../../components/TagChip';
import { BarSelect, BulkBar, HeaderCheckbox, SelectCheckbox, SelectedOnlyFilter, barButton, barDanger, downloadCsv, useSelection } from '../../../components/TableSelection';
import { useData } from '../../../context/DataContext';
import TagDrawer from '../../../components/TagDrawer';
import { ACCOUNTS_PATH } from '../../../config';
import RowActionsMenu from '../../../components/RowActionsMenu';
import { cn } from 'lib/utils';

const USAGE = ['All', 'In use', 'Unused'];
const fmtDate = (d) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—');
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

const COLUMNS = [
  { id: 'color', label: 'Color' },
  { id: 'usage', label: 'Accounts' },
  { id: 'created', label: 'Created' },
];
const COLS_KEY = 'harbor.tags.columns';
const DEFAULT_COLS = { color: true, usage: true, created: true };
const readCols = () => { try { return { ...DEFAULT_COLS, ...JSON.parse(localStorage.getItem(COLS_KEY) || '{}') }; } catch { return DEFAULT_COLS; } };

/** Colour dot from tag data (inline style is fine — it's user data, not a theme colour). */
const Swatch = ({ hex, className }) => <span className={cn('size-3.5 flex-none rounded-full ring-1 ring-inset ring-foreground/10', className)} style={{ backgroundColor: hex }} aria-hidden="true" />;

function SortHead({ label, k, sort, sortBy, className }) {
  const active = sort.key === k;
  const Icon = !active ? ArrowUpDown : sort.dir === 'asc' ? ArrowUp : ArrowDown;
  return (
    <TableHead className={className} aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button type="button" onClick={() => sortBy(k)}
        className={cn('-ml-2 inline-flex h-7 items-center gap-1.5 rounded-md px-2 transition-colors hover:bg-accent hover:text-foreground', active && 'text-foreground')}>
        {label}<Icon className={cn('size-3.5', !active && 'opacity-50')} />
      </button>
    </TableHead>
  );
}

export default function Tags() {
  const navigate = useNavigate();
  const { tags, tagUsage, recolorTags, deleteTags } = useData();
  const [q, setQ] = useState('');
  const [colors, setColors] = useState([]);     // hex values
  const [usage, setUsage] = useState('All');
  const [sort, setSort] = useState({ key: 'label', dir: 'asc' });
  const [cols, setCols] = useState(readCols);
  const [drawer, setDrawer] = useState(null);   // { tag: null } = new, { tag } = edit
  const [confirm, setConfirm] = useState(null); // array of tags to delete

  useEffect(() => { try { localStorage.setItem(COLS_KEY, JSON.stringify(cols)); } catch {} }, [cols]);

  const selection = useSelection();
  const [selectedOnly, setSelectedOnly] = useState(false);
  useEffect(() => { if (selection.count === 0) setSelectedOnly(false); }, [selection.count]);

  const used = (t) => tagUsage.get(t.value) || 0;
  const colorsInUse = useMemo(() => [...new Set(tags.map((t) => t.color.toUpperCase()))], [tags]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const list = tags.filter((t) => (!s || `${t.label} ${t.description || ''}`.toLowerCase().includes(s))
      && (!colors.length || colors.includes(t.color.toUpperCase()))
      && (usage === 'All' || (usage === 'In use' ? used(t) > 0 : used(t) === 0))
      && (!selectedOnly || selection.has(t.value)));
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      if (sort.key === 'usage') return (used(a) - used(b)) * dir || a.label.localeCompare(b.label);
      if (sort.key === 'created') return (a.createdAt || '').localeCompare(b.createdAt || '') * dir;
      return a.label.localeCompare(b.label) * dir;
    });
  }, [tags, q, colors, usage, selectedOnly, selection, sort, tagUsage]); // eslint-disable-line react-hooks/exhaustive-deps

  const paging = usePagination(filtered, { initialSize: 10, storageKey: 'tags' });
  const { pageItems: rows, setPage } = paging;
  const pageIds = rows.map((t) => t.value);
  const selectedTags = tags.filter((t) => selection.has(t.value));
  const filtersOn = !!(q || colors.length || usage !== 'All');
  const reset = () => { setQ(''); setColors([]); setUsage('All'); setSelectedOnly(false); setPage(1); };

  const sortBy = (key) => setSort((s) => ({ key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc' }));
  const colorFacets = useMemo(() => colorsInUse.map((hex) => ({
    value: hex, label: `${colorName(hex)} ${hex}`, count: tags.filter((t) => t.color.toUpperCase() === hex).length,
    render: () => <span className="flex items-center gap-2"><Swatch hex={hex} />{colorName(hex)}<span className="font-mono text-[11px] text-muted-foreground">{hex}</span></span>,
  })), [colorsInUse, tags]);

  const doDelete = () => {
    const ids = confirm.map((t) => t.value);
    const name = confirm.length === 1 ? `“${confirm[0].label}”` : plural(ids.length, 'tag');
    deleteTags(ids);
    selection.setMany(ids, false);
    setConfirm(null); setDrawer(null);
    toast(`Deleted ${name}`);
  };
  const recolor = (hex) => {
    if (!hex) return;
    recolorTags([...selection.ids], hex);
    toast.success(`Changed color of ${plural(selection.count, 'tag')} to ${colorName(hex)}`);
  };
  const exportRows = (list, name) => {
    downloadCsv(name, [['Name', 'Color', 'Accounts', 'Created', 'Description'], ...list.map((t) => [t.label, t.color, used(t), t.createdAt, t.description || ''])]);
    toast.success(`Exported ${plural(list.length, 'tag')}`, { description: name });
  };
  const affected = confirm ? confirm.reduce((n, t) => n + used(t), 0) : 0;

  const inUse = tags.filter((t) => used(t) > 0).length;
  const unused = tags.length - inUse;
  const toggleUsage = (v) => { setUsage((u) => (u === v ? 'All' : v)); setPage(1); };
  const visibleCount = 2 + COLUMNS.filter((c) => cols[c.id]).length + 1;

  return (
    <div className="page">
      <PageHeader
        title="Tags"
        description="Labels your team uses to group and filter accounts."
        actions={<>
          <Button variant="outline" onClick={() => exportRows(filtered, 'tags.csv')} disabled={!filtered.length}><Download />Export</Button>
          <Button onClick={() => setDrawer({ tag: null })}><Plus />New tag</Button>
        </>}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:gap-4">
        <StatCard label="Total tags" value={tags.length} icon={TagsIcon} hint={`${colorsInUse.length} color${colorsInUse.length === 1 ? '' : 's'} in use`} />
        <StatCard label="In use" value={inUse} icon={Building2} tone="success"
          hint={usage === 'In use' ? 'Showing only these · click to clear' : 'Click to show only these'} onClick={() => toggleUsage('In use')} active={usage === 'In use'} />
        <StatCard label="Unused" value={unused} icon={CircleDashed} tone={unused ? 'warning' : 'default'}
          hint={usage === 'Unused' ? 'Showing only these · click to clear' : 'Click to show only these'} onClick={() => toggleUsage('Unused')} active={usage === 'Unused'} />
      </div>

      <DataCard
        toolbar={<>
          <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search tags" className="h-8 w-full sm:w-64" />
          <FacetFilter title="Color" icon={Palette} options={colorFacets} value={colors} onChange={(v) => { setColors(v); setPage(1); }} searchPlaceholder="Filter colors…" />
          <Segmented label="Usage" size="sm" options={USAGE} value={usage} onChange={(v) => { setUsage(v); setPage(1); }} />
          {filtersOn && <Button variant="ghost" size="sm" onClick={reset} className="text-muted-foreground">Reset<X /></Button>}
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-sm text-muted-foreground md:inline">{filtered.length} of {tags.length}</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="outline" size="sm"><Settings2 />View</Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {COLUMNS.map((c) => (
                  <DropdownMenuCheckboxItem key={c.id} checked={cols[c.id]} onSelect={(e) => e.preventDefault()}
                    onCheckedChange={(v) => setCols((p) => ({ ...p, [c.id]: !!v }))}>{c.label}</DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </>}
        footer={filtered.length > 0 && <Pagination {...paging} label="tags" />}
      >
        <Table className="min-w-[760px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"><HeaderCheckbox selection={selection} pageIds={pageIds} /></TableHead>
              <SortHead label="Tag" k="label" sort={sort} sortBy={sortBy} />
              {cols.color && <TableHead>Color</TableHead>}
              {cols.usage && <SortHead label="Accounts" k="usage" sort={sort} sortBy={sortBy} />}
              {cols.created && <SortHead label="Created" k="created" sort={sort} sortBy={sortBy} />}
              <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((t) => {
              const checked = selection.has(t.value);
              const n = used(t);
              return (
                <TableRow key={t.value} data-state={checked ? 'selected' : undefined}>
                  <TableCell><SelectCheckbox label={`Select ${t.label}`} checked={checked} onChange={() => selection.toggle(t.value)} /></TableCell>
                  <TableCell>
                    <button type="button" onClick={() => setDrawer({ tag: t })} aria-label={`Edit ${t.label}`}
                      className="rounded-md transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
                      <TagChip tag={t} />
                    </button>
                    {t.description && <div className="mt-1 max-w-[300px] truncate text-xs text-muted-foreground">{t.description}</div>}
                  </TableCell>
                  {cols.color && (
                    <TableCell>
                      <span className="inline-flex items-center gap-2 text-sm">
                        <Swatch hex={t.color} />
                        <span>{colorName(t.color)}</span>
                        <span className="font-mono text-xs text-muted-foreground">{t.color.toUpperCase()}</span>
                      </span>
                    </TableCell>
                  )}
                  {cols.usage && (
                    <TableCell>
                      {n > 0
                        ? <Link to={`${ACCOUNTS_PATH}?tag=${encodeURIComponent(t.value)}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground underline-offset-4 hover:text-primary hover:underline">
                            <Building2 className="size-3.5 text-muted-foreground" aria-hidden="true" />{plural(n, 'account')}
                          </Link>
                        : <span className="text-sm text-muted-foreground/70">Unused</span>}
                    </TableCell>
                  )}
                  {cols.created && <TableCell className="whitespace-nowrap text-muted-foreground">{fmtDate(t.createdAt)}</TableCell>}
                  <TableCell className="text-right">
                    <RowActionsMenu label={t.label}
                      onEdit={() => setDrawer({ tag: t })}
                      extra={n > 0 ? [{ label: 'View accounts', icon: Building2, onClick: () => navigate(`${ACCOUNTS_PATH}?tag=${encodeURIComponent(t.value)}`) }] : []}
                      onDelete={() => setConfirm([t])} />
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={visibleCount}>
                  {tags.length === 0 ? (
                    <EmptyState icon={Tag} title="No tags yet" description="Create a tag to start grouping and filtering accounts."
                      action={<Button onClick={() => setDrawer({ tag: null })}><Plus />New tag</Button>} />
                  ) : (
                    <EmptyState icon={SearchX} title="No tags match" description="Try a different search or remove some filters."
                      action={<Button variant="outline" onClick={reset}>Clear filters</Button>} />
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </DataCard>

      <BulkBar
        count={selection.count}
        total={filtered.length}
        onSelectAll={() => selection.setMany(filtered.map((t) => t.value), true)}
        onClear={selection.clear}
        filters={<SelectedOnlyFilter checked={selectedOnly} onChange={(v) => { setSelectedOnly(v); setPage(1); }} />}
        actions={<>
          <BarSelect label="Set color" value="" onChange={recolor} options={TAG_PALETTE.map((p) => ({ value: p.hex, label: p.name }))} />
          <button type="button" className={barButton} onClick={() => exportRows(selectedTags, 'tags-selected.csv')}><Download aria-hidden="true" />Export</button>
          <button type="button" className={barDanger} onClick={() => setConfirm(selectedTags)}><Trash2 aria-hidden="true" />Delete</button>
        </>}
      />

      {drawer && (
        <TagDrawer
          key={drawer.tag?.value || 'new'}
          tag={drawer.tag}
          usage={drawer.tag ? used(drawer.tag) : 0}
          onClose={() => setDrawer(null)}
          onSaved={(tag, isNew) => { setDrawer(null); toast.success(isNew ? `Created “${tag.label}”` : `Saved “${tag.label}”`); }}
          onDelete={(tag) => setConfirm([tag])}
        />
      )}

      {confirm && (
        <Modal title={confirm.length === 1 ? `Delete “${confirm[0].label}”?` : `Delete ${confirm.length} tags?`} onClose={() => setConfirm(null)}
          description={affected > 0
            ? `This removes the tag${confirm.length > 1 ? 's' : ''} from ${plural(affected, 'account')}. The accounts themselves are not deleted.`
            : 'No accounts use this, so nothing else changes.'}
          footer={<><Button variant="outline" onClick={() => setConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={doDelete}><Trash2 />Delete {confirm.length === 1 ? 'tag' : plural(confirm.length, 'tag')}</Button></>}>
          <div className="flex flex-wrap gap-1.5">{confirm.map((t) => <TagChip key={t.value} tag={t} />)}</div>
        </Modal>
      )}
    </div>
  );
}
