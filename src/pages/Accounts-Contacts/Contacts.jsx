import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowDown, ArrowUp, ArrowUpDown, Contact, Copy, Download, Globe2, Mail, MapPin, Pencil, Phone, Plus, SearchX, Settings2,
  Tags as TagsIcon, Trash2, UserRound, X,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { countryByIso, formatPhone } from '../../data/countries';
import Pagination, { usePagination } from '../../components/Pagination';
import TagChip from '../../components/TagChip';
import {
  BarSelect, BulkBar, HeaderCheckbox, SelectCheckbox, SelectedOnlyFilter, barButton, barDanger, downloadCsv, useSelection,
} from '../../components/TableSelection';
import { Avatar, Modal, initials } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { toast } from '../../components/ui/sonner';
import { SimpleTooltip } from '../../components/ui/tooltip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { DataCard, EmptyState, PageHeader, SearchInput, StatCard } from '../../components/page';
import FacetFilter from '../../components/FacetFilter';
import RowActionsMenu from '../../components/RowActionsMenu';
import { cn } from 'lib/utils';
import ContactDrawer from './ContactDrawer';

const primaryPhone = (c) => c.phones?.find((p) => p.primary) || c.phones?.[0];
const location = (c) => [c.address?.city, c.address?.state, countryByIso(c.address?.country)?.name].filter(Boolean).join(', ');
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

const COLUMNS = [
  { id: 'company', label: 'Company' },
  { id: 'phone', label: 'Phone' },
  { id: 'tags', label: 'Tags' },
  { id: 'location', label: 'Location' },
];
const COLS_KEY = 'harbor.contacts.columns';
const DEFAULT_COLS = { company: true, phone: true, tags: true, location: true };
const readCols = () => { try { return { ...DEFAULT_COLS, ...JSON.parse(localStorage.getItem(COLS_KEY) || '{}') }; } catch { return DEFAULT_COLS; } };

const Dash = () => <span className="text-muted-foreground/60">—</span>;

function TagList({ tags, max = 2 }) {
  if (!tags?.length) return <Dash />;
  const rest = tags.length - max;
  return (
    <div className="flex flex-wrap items-center gap-1">
      {tags.slice(0, max).map((t) => <TagChip key={t.value} tag={t} size="xs" />)}
      {rest > 0 && (
        <SimpleTooltip label={tags.slice(max).map((t) => t.label).join(', ')}>
          <span className="inline-flex h-5 items-center rounded-md border bg-muted px-1.5 text-[11px] font-medium text-muted-foreground">+{rest}</span>
        </SimpleTooltip>
      )}
    </div>
  );
}

/** Sortable column head. `sort.col === null` keeps the natural (newest first) order. */
function SortHead({ label, col, sort, setSort, className }) {
  const active = sort.col === col;
  const Icon = !active ? ArrowUpDown : sort.dir === 'asc' ? ArrowUp : ArrowDown;
  return (
    <TableHead className={className} aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button type="button" onClick={() => setSort({ col, dir: active && sort.dir === 'asc' ? 'desc' : 'asc' })}
        className={cn('-ml-2 inline-flex h-7 items-center gap-1.5 rounded-md px-2 transition-colors hover:bg-accent hover:text-foreground', active && 'text-foreground')}>
        {label}<Icon className={cn('size-3.5', !active && 'opacity-50')} />
      </button>
    </TableHead>
  );
}

export default function Contacts() {
  const { contacts, setContacts, deleteContacts, tags, tagById } = useData();
  const [q, setQ] = useState('');
  const [tagFilter, setTagFilter] = useState([]);
  const [countryFilter, setCountryFilter] = useState([]); // ISO codes
  const [sort, setSort] = useState({ col: null, dir: 'asc' });
  const [cols, setCols] = useState(readCols);
  const [confirm, setConfirm] = useState(false);

  useEffect(() => { try { localStorage.setItem(COLS_KEY, JSON.stringify(cols)); } catch {} }, [cols]);

  /** Put removed contacts back where they were (Undo). */
  const restore = (removed) => setContacts((list) => {
    const next = [...list];
    removed.filter(({ c }) => !next.some((x) => x.id === c.id))
      .sort((a, b) => a.i - b.i)
      .forEach(({ c, i }) => next.splice(Math.min(i, next.length), 0, c));
    return next;
  });
  const withIndex = (ids) => contacts.map((c, i) => ({ c, i })).filter(({ c }) => ids.includes(c.id));

  // Drawer: null = closed, 'new' = create, a contact id = edit
  const [drawer, setDrawer] = useState(null);
  const openNew = () => setDrawer('new');
  const openEdit = (id) => setDrawer(id);
  const closeDrawer = () => setDrawer(null);
  const onDrawerDone = (message) => {
    // The drawer deletes the contact itself; keep a copy so the toast can undo it.
    const removed = drawer && drawer !== 'new' && /^Deleted /.test(message || '') ? withIndex([drawer]) : [];
    setDrawer(null);
    if (!message) return;
    if (removed.length) toast(message, { action: { label: 'Undo', onClick: () => restore(removed) } });
    else toast.success(message);
  };

  // Links from elsewhere: ?new=contact (Quick create) and ?edit=CT-1100 (header search)
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    let changed = false;
    if (next.get('new') === 'contact') { setDrawer('new'); next.delete('new'); changed = true; }
    if (next.get('edit')) { setDrawer(next.get('edit')); next.delete('edit'); changed = true; }
    if (changed) setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const selection = useSelection();
  const [selectedOnly, setSelectedOnly] = useState(false);
  useEffect(() => { if (selection.count === 0) setSelectedOnly(false); }, [selection.count]);

  const tagsOf = (c) => (c.tags || []).map((id) => tagById.get(id)).filter(Boolean);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const list = contacts.filter((c) => {
      if (tagFilter.length && !tagFilter.some((t) => (c.tags || []).includes(t))) return false;
      if (countryFilter.length && !countryFilter.includes(c.address?.country)) return false;
      if (selectedOnly && !selection.has(c.id)) return false;
      if (!s) return true;
      const hay = [c.contactName, c.firstName, c.middleName, c.lastName, c.email, c.company, c.address?.city,
        ...(c.phones || []).map((p) => `${formatPhone(p)} ${p.number.replace(/\D/g, '')}`)].join(' ').toLowerCase();
      return hay.includes(s);
    });
    if (!sort.col) return list;
    const key = (c) => (sort.col === 'company' ? c.company : sort.col === 'location' ? location(c) : c.contactName) || '';
    return [...list].sort((x, y) => {
      const a = key(x).toLowerCase(); const b = key(y).toLowerCase();
      if (!a !== !b) return a ? -1 : 1; // blanks last
      return a.localeCompare(b) * (sort.dir === 'asc' ? 1 : -1);
    });
  }, [contacts, q, tagFilter, countryFilter, selectedOnly, selection, sort]);

  const paging = usePagination(filtered, { initialSize: 10, storageKey: 'contacts' });
  const { pageItems: rows, setPage } = paging;
  const pageIds = rows.map((c) => c.id);
  const selected = contacts.filter((c) => selection.has(c.id));
  const filtersOn = !!(q || tagFilter.length || countryFilter.length);
  const reset = () => { setQ(''); setTagFilter([]); setCountryFilter([]); setSelectedOnly(false); setPage(1); };

  const tagFacets = useMemo(() => tags.map((t) => ({ ...t, count: contacts.filter((c) => (c.tags || []).includes(t.value)).length, render: () => <TagChip tag={t} size="xs" /> })), [tags, contacts]);
  const countryFacets = useMemo(() => {
    const counts = new Map();
    contacts.forEach((c) => { const iso = c.address?.country; if (iso) counts.set(iso, (counts.get(iso) || 0) + 1); });
    return [...counts.keys()].map((iso) => ({ iso, name: countryByIso(iso)?.name || iso }))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(({ iso, name }) => ({ value: iso, label: name, count: counts.get(iso),
        render: () => <span className="flex items-center gap-2"><span className="w-6 font-mono text-[11px] text-muted-foreground">{iso}</span>{name}</span> }));
  }, [contacts]);

  const addTag = (id) => {
    if (!id) return;
    setContacts((list) => list.map((c) => (selection.has(c.id) && !(c.tags || []).includes(id) ? { ...c, tags: [...(c.tags || []), id] } : c)));
    toast.success(`Added “${tagById.get(id)?.label}” to ${plural(selection.count, 'contact')}`);
  };
  const exportRows = (list, name) => {
    downloadCsv(name, [['Contact name', 'First name', 'Middle name', 'Last name', 'Company', 'Email', 'Phones', 'Tags', 'Street', 'City', 'State', 'ZIP', 'Country', 'Note'],
      ...list.map((c) => [c.contactName, c.firstName, c.middleName, c.lastName, c.company, c.email,
        (c.phones || []).map((p) => `${formatPhone(p)} (${p.type})`).join('; '), tagsOf(c).map((t) => t.label).join('; '),
        c.address?.street, c.address?.city, c.address?.state, c.address?.zip, countryByIso(c.address?.country)?.name || '', c.note])]);
    toast.success(`Exported ${plural(list.length, 'contact')}`, { description: name });
  };
  const doDelete = () => {
    const ids = [...selection.ids];
    const removed = withIndex(ids);
    deleteContacts(ids);
    selection.clear(); setConfirm(false); setPage(1);
    toast(`Deleted ${plural(removed.length, 'contact')}`, { action: { label: 'Undo', onClick: () => restore(removed) } });
  };
  const deleteOne = (c) => {
    const removed = withIndex([c.id]);
    deleteContacts([c.id]);
    selection.setMany([c.id], false);
    toast(`Deleted ${c.contactName}`, { action: { label: 'Undo', onClick: () => restore(removed) } });
  };
  const copyEmail = (email) => {
    navigator.clipboard?.writeText(email).then(() => toast.success('Email copied', { description: email }), () => toast.error("Couldn't copy the email"));
  };

  const withPhone = contacts.filter((c) => c.phones?.length).length;
  const tagged = contacts.filter((c) => c.tags?.length).length;
  const countryCount = new Set(contacts.map((c) => c.address?.country).filter(Boolean)).size;
  const pct = (n) => `${Math.round((n / Math.max(contacts.length, 1)) * 100)}%`;
  const visibleCount = 2 + COLUMNS.filter((c) => cols[c.id]).length + 1;

  return (
    <div className="page">
      <PageHeader
        title="Contacts"
        description="The people you deal with at each client — how to reach them, where they are and how they're tagged."
        actions={<>
          <Button variant="outline" onClick={() => exportRows(filtered, 'contacts.csv')} disabled={!filtered.length}><Download />Export</Button>
          <Button onClick={openNew}><Plus />New contact</Button>
        </>}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard label="Total contacts" value={contacts.length} icon={Contact} hint="across all accounts" />
        <StatCard label="With a phone number" value={withPhone} icon={Phone} hint={`${pct(withPhone)} reachable by phone`} />
        <StatCard label="Countries" value={countryCount} icon={Globe2} hint={countryCount === 1 ? 'one location' : 'where your contacts are'} />
        <StatCard label="Tagged" value={tagged} icon={TagsIcon} hint={`${pct(tagged)} of contacts`} />
      </div>

      <DataCard
        toolbar={<>
          <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search name, email, company, phone…" className="h-8 w-full sm:w-72" />
          <FacetFilter title="Tags" options={tagFacets} value={tagFilter} onChange={(v) => { setTagFilter(v); setPage(1); }} />
          <FacetFilter title="Country" icon={Globe2} options={countryFacets} value={countryFilter} onChange={(v) => { setCountryFilter(v); setPage(1); }} searchPlaceholder="Filter countries…" />
          {filtersOn && <Button variant="ghost" size="sm" onClick={reset} className="text-muted-foreground">Reset<X /></Button>}
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-sm text-muted-foreground md:inline">{filtered.length} of {contacts.length}</span>
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
        footer={filtered.length > 0 && <Pagination {...paging} label="contacts" />}
      >
        <Table className="min-w-[900px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"><HeaderCheckbox selection={selection} pageIds={pageIds} /></TableHead>
              <SortHead label="Contact" col="name" sort={sort} setSort={setSort} />
              {cols.company && <SortHead label="Company" col="company" sort={sort} setSort={setSort} />}
              {cols.phone && <TableHead>Phone</TableHead>}
              {cols.tags && <TableHead>Tags</TableHead>}
              {cols.location && <SortHead label="Location" col="location" sort={sort} setSort={setSort} />}
              <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((c) => {
              const checked = selection.has(c.id);
              const phone = primaryPhone(c);
              const extra = (c.phones?.length || 0) - 1;
              const loc = location(c);
              return (
                <TableRow key={c.id} data-state={checked ? 'selected' : undefined}>
                  <TableCell><SelectCheckbox label={`Select ${c.contactName}`} checked={checked} onChange={() => selection.toggle(c.id)} /></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar text={initials(c.contactName)} />
                      <div className="min-w-0">
                        <button type="button" onClick={() => openEdit(c.id)}
                          className="block max-w-[240px] truncate rounded-sm text-left font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
                          {c.contactName}
                        </button>
                        {c.email
                          ? <a href={`mailto:${c.email}`} className="block max-w-[240px] truncate text-xs text-muted-foreground hover:text-primary hover:underline">{c.email}</a>
                          : <span className="block text-xs text-muted-foreground/60">No email</span>}
                      </div>
                    </div>
                  </TableCell>
                  {cols.company && <TableCell className="text-muted-foreground">{c.company || <Dash />}</TableCell>}
                  {cols.phone && (
                    <TableCell>
                      {phone ? (
                        <div className="flex flex-col">
                          <a href={`tel:${formatPhone(phone).replace(/[^\d+]/g, '')}`} className="whitespace-nowrap font-mono text-sm tabular-nums text-foreground hover:text-primary">{formatPhone(phone)}</a>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            {phone.type}
                            {extra > 0 && (
                              <SimpleTooltip label={c.phones.filter((p) => p !== phone).map((p) => `${formatPhone(p)} · ${p.type}`).join(', ')}>
                                <span className="rounded border bg-muted px-1 text-[11px] font-medium">+{extra}</span>
                              </SimpleTooltip>
                            )}
                          </span>
                        </div>
                      ) : <Dash />}
                    </TableCell>
                  )}
                  {cols.tags && <TableCell><TagList tags={tagsOf(c)} /></TableCell>}
                  {cols.location && (
                    <TableCell className="max-w-[220px]">
                      {loc ? <span className="flex items-center gap-1.5 text-muted-foreground"><MapPin className="size-3.5 flex-none opacity-70" aria-hidden="true" /><span className="truncate">{loc}</span></span> : <Dash />}
                    </TableCell>
                  )}
                  <TableCell className="text-right">
                    <RowActionsMenu label={c.contactName}
                      onEdit={() => openEdit(c.id)}
                      extra={[
                        c.email && { label: 'Send email', icon: Mail, onClick: () => { window.location.href = `mailto:${c.email}`; } },
                        c.email && { label: 'Copy email', icon: Copy, onClick: () => copyEmail(c.email) },
                        phone && { label: 'Call', icon: Phone, onClick: () => { window.location.href = `tel:${formatPhone(phone).replace(/[^\d+]/g, '')}`; } },
                      ].filter(Boolean)}
                      onDelete={() => deleteOne(c)} />
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={visibleCount}>
                  {contacts.length === 0 ? (
                    <EmptyState icon={UserRound} title="No contacts yet" description="Add the people you work with at each client so the whole team knows who to reach."
                      action={<Button onClick={openNew}><Plus />New contact</Button>} />
                  ) : (
                    <EmptyState icon={SearchX} title="No contacts match" description="Try a different search or remove some filters."
                      action={<Button variant="outline" onClick={reset}>Clear filters</Button>} />
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </DataCard>

      <BulkBar count={selection.count} total={filtered.length}
        onSelectAll={() => selection.setMany(filtered.map((c) => c.id), true)} onClear={selection.clear}
        filters={<SelectedOnlyFilter checked={selectedOnly} onChange={(v) => { setSelectedOnly(v); setPage(1); }} />}
        actions={<>
          <BarSelect label="Add tag" value="" onChange={addTag} options={tags.map((t) => ({ value: t.value, label: t.label }))} />
          {selection.count === 1 && <button type="button" className={barButton} onClick={() => openEdit([...selection.ids][0])}><Pencil aria-hidden="true" />Edit</button>}
          <button type="button" className={barButton} onClick={() => exportRows(selected, 'contacts-selected.csv')}><Download aria-hidden="true" />Export</button>
          <button type="button" className={barDanger} onClick={() => setConfirm(true)}><Trash2 aria-hidden="true" />Delete</button>
        </>}
      />

      {confirm && (
        <Modal title={`Delete ${plural(selection.count, 'contact')}?`} description="These contacts will be removed. You can undo this right after." onClose={() => setConfirm(false)}
          footer={<><Button variant="outline" onClick={() => setConfirm(false)}>Cancel</Button>
            <Button variant="destructive" onClick={doDelete}><Trash2 />Delete {plural(selection.count, 'contact')}</Button></>}>
          <ul className="max-h-48 divide-y overflow-y-auto rounded-lg border">
            {selected.map((c) => (
              <li key={c.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                <Avatar text={initials(c.contactName)} size="xs" /><span className="font-medium">{c.contactName}</span><span className="truncate text-muted-foreground">{c.email}</span>
              </li>
            ))}
          </ul>
        </Modal>
      )}

      {/* Add / Edit contact drawer */}
      {drawer && <ContactDrawer contactId={drawer} onClose={closeDrawer} onDone={onDrawerDone} />}
    </div>
  );
}
