import { useEffect, useMemo, useState } from 'react';
import { Link, Outlet, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowDown, ArrowUp, ArrowUpDown, Building2, Download, Eye, LayoutDashboard, Plus, Settings2, Sparkles, Tags as TagsIcon,
  Trash2, UserRoundX, Users, X, SearchX, Contact,
} from 'lucide-react';
import { ACCOUNTS_PATH, accountTabPath } from '../../config';
import Pagination, { usePagination } from '../../components/Pagination';
import { Avatar, Modal, initials } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { toast } from '../../components/ui/sonner';
import { SimpleTooltip } from '../../components/ui/tooltip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { BarSelect, BulkBar, HeaderCheckbox, SelectCheckbox, SelectedOnlyFilter, barButton, barDanger, downloadCsv, useSelection } from '../../components/TableSelection';
import { DataCard, EmptyState, PageHeader, SearchInput, StatCard } from '../../components/page';
import FacetFilter from '../../components/FacetFilter';
import RowActionsMenu from '../../components/RowActionsMenu';
import { TEAM_MEMBERS } from '../../data/sampleData';
import TagChip from '../../components/TagChip';
import { useData } from '../../context/DataContext';
import { cn } from 'lib/utils';
import AddAccountDrawer from './AddAccountDrawer';
import SetupWizard from '../../components/SetupWizard';

const emailsOf = (a) => (a.contacts?.length ? a.contacts.map((c) => c.email) : [a.email]).filter(Boolean);

const COLUMNS = [
  { id: 'company', label: 'Company' },
  { id: 'tags', label: 'Tags' },
  { id: 'team', label: 'Team' },
  { id: 'emails', label: 'Emails' },
];
const COLS_KEY = 'harbor.accounts.columns';
const readCols = () => { try { return { company: true, tags: true, team: true, emails: true, ...JSON.parse(localStorage.getItem(COLS_KEY) || '{}') }; } catch { return { company: true, tags: true, team: true, emails: true }; } };

function TagList({ tags, max = 2 }) {
  if (!tags?.length) return <span className="text-muted-foreground/60">—</span>;
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

function TeamList({ team }) {
  if (!team?.length) return <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground/80"><UserRoundX className="size-3.5" />Unassigned</span>;
  return (
    <SimpleTooltip label={team.join(', ')}>
      <div className="flex items-center gap-2">
        <div className="flex -space-x-1">
          {team.slice(0, 3).map((m) => <span key={m} className="rounded-full ring-2 ring-card"><Avatar text={initials(m)} size="xs" /></span>)}
        </div>
        <span className="max-w-[140px] truncate text-sm">{team.length === 1 ? team[0] : `${team[0].split(' ')[0]} +${team.length - 1}`}</span>
      </div>
    </SimpleTooltip>
  );
}

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

export default function Accounts() {
  const navigate = useNavigate();
  const { accounts, setAccounts, tags: tagOptions, tagById, createTag, addAccount: addNewAccount } = useData();
  const [searchParams, setSearchParams] = useSearchParams();
  const [q, setQ] = useState('');
  const [tagFilter, setTagFilter] = useState(() => (searchParams.get('tag') ? [searchParams.get('tag')] : [])); // ?tag=vip from the Tags page
  const [teamFilter, setTeamFilter] = useState([]);
  const [unassignedOnly, setUnassignedOnly] = useState(false);
  const [sort, setSort] = useState({ col: 'name', dir: 'asc' });
  const [cols, setCols] = useState(readCols);
  const [modal, setModal] = useState(null); // 'add' | 'wizard' | 'delete' | null

  useEffect(() => { try { localStorage.setItem(COLS_KEY, JSON.stringify(cols)); } catch {} }, [cols]);

  const tagsOf = (a) => (a.tags || []).map((id) => tagById.get(id)).filter(Boolean);

  const selection = useSelection();
  const [selectedOnly, setSelectedOnly] = useState(false);
  useEffect(() => { if (selection.count === 0) setSelectedOnly(false); }, [selection.count]);

  // Links from elsewhere: ?new=account opens the Add drawer, ?q= pre-fills the search
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    let changed = false;
    if (next.get('new') === 'account') { setModal('add'); next.delete('new'); changed = true; }
    if (next.has('q')) { setQ(next.get('q')); next.delete('q'); changed = true; }
    if (changed) setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const list = accounts.filter((a) => {
      if (tagFilter.length && !tagFilter.some((t) => (a.tags || []).includes(t))) return false;
      if (teamFilter.length && !teamFilter.some((m) => (a.team || []).includes(m))) return false;
      if (unassignedOnly && a.team?.length) return false;
      if (selectedOnly && !selection.has(a.id)) return false;
      if (!s) return true;
      const hay = [a.name, a.company, ...emailsOf(a), ...(a.team || []), ...tagsOf(a).map((t) => t.label)].join(' ').toLowerCase();
      return hay.includes(s);
    });
    const key = (a) => (sort.col === 'company' ? a.company || '' : a.name || '').toLowerCase();
    return [...list].sort((x, y) => key(x).localeCompare(key(y)) * (sort.dir === 'asc' ? 1 : -1));
  }, [accounts, q, tagFilter, teamFilter, unassignedOnly, selectedOnly, selection, tagById, sort]); // eslint-disable-line react-hooks/exhaustive-deps

  const paging = usePagination(filtered, { initialSize: 10, storageKey: 'accounts' });
  const { pageItems: rows, setPage } = paging;
  const pageIds = rows.map((a) => a.id);
  const selectedRows = accounts.filter((a) => selection.has(a.id));
  const filtersOn = !!(q || tagFilter.length || teamFilter.length || unassignedOnly);

  const tagFacets = useMemo(() => tagOptions.map((t) => ({ ...t, count: accounts.filter((a) => (a.tags || []).includes(t.value)).length, render: () => <TagChip tag={t} size="xs" /> })), [tagOptions, accounts]);
  const teamFacets = useMemo(() => TEAM_MEMBERS.map((m) => ({ value: m.label, label: m.label, count: accounts.filter((a) => (a.team || []).includes(m.label)).length,
    render: () => <span className="flex items-center gap-2"><Avatar text={initials(m.label)} size="xs" />{m.label}</span> })), [accounts]);

  const unassigned = accounts.filter((a) => !a.team?.length).length;
  const contactsCount = accounts.reduce((n, a) => n + (a.contacts?.length || 1), 0);

  function resetFilters() { setQ(''); setTagFilter([]); setTeamFilter([]); setUnassignedOnly(false); setSelectedOnly(false); setPage(1); }

  const addAccount = (form) => {
    const rec = addNewAccount(form);
    setModal(null); resetFilters();
    toast.success(`${rec.name} was added`, { action: { label: 'Open', onClick: () => navigate(accountTabPath('overview', rec.id)) } });
  };

  // Bulk actions
  const plural = (n, w) => `${n} ${w}${n > 1 ? 's' : ''}`;
  const addTag = (value) => {
    const tag = tagOptions.find((t) => t.value === value);
    if (!tag) return;
    setAccounts((list) => list.map((a) => (selection.has(a.id) && !(a.tags || []).includes(value) ? { ...a, tags: [...(a.tags || []), value] } : a)));
    toast.success(`Added “${tag.label}” to ${plural(selection.count, 'account')}`);
  };
  const assign = (member) => {
    if (!member) return;
    setAccounts((list) => list.map((a) => (selection.has(a.id) && !(a.team || []).includes(member) ? { ...a, team: [...(a.team || []), member] } : a)));
    toast.success(`Assigned ${member} to ${plural(selection.count, 'account')}`);
  };
  const exportRows = (list, name) => {
    downloadCsv(name, [['Account name', 'Company', 'Tags', 'Team members', 'Emails'],
      ...list.map((a) => [a.name, a.company, tagsOf(a).map((t) => t.label).join('; '), (a.team || []).join('; '), emailsOf(a).join('; ')])]);
    toast.success(`Exported ${plural(list.length, 'account')}`, { description: name });
  };
  const deleteSelected = () => {
    const removed = accounts.filter((a) => selection.has(a.id));
    setAccounts((list) => list.filter((a) => !selection.has(a.id)));
    selection.clear(); setModal(null); setPage(1);
    toast(`Deleted ${plural(removed.length, 'account')}`, {
      action: { label: 'Undo', onClick: () => setAccounts((list) => [...removed, ...list]) },
    });
  };
  const deleteOne = (a) => {
    setAccounts((list) => list.filter((x) => x.id !== a.id));
    toast(`Deleted ${a.name}`, { action: { label: 'Undo', onClick: () => setAccounts((list) => [a, ...list]) } });
  };

  const visibleCount = 2 + COLUMNS.filter((c) => cols[c.id]).length + 1;

  return (
    <div className="page">
      <PageHeader
        title="Accounts"
        description="Every client business you work with — their people, tags and the team looking after them."
        actions={<>
          <Button variant="outline" onClick={() => exportRows(filtered, 'accounts.csv')}><Download />Export</Button>
          <Button variant="outline" onClick={() => setModal('wizard')}><Sparkles />Guided setup</Button>
          <Button onClick={() => setModal('add')}><Plus />Add account</Button>
        </>}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard label="Total accounts" value={accounts.length} icon={Building2} hint="across all teams" change={12.5} />
        <StatCard label="Contacts" value={contactsCount} icon={Contact} hint={`${(contactsCount / Math.max(accounts.length, 1)).toFixed(1)} per account`} />
        <StatCard label="Tagged" value={accounts.filter((a) => a.tags?.length).length} icon={TagsIcon}
          hint={`${Math.round((accounts.filter((a) => a.tags?.length).length / Math.max(accounts.length, 1)) * 100)}% of accounts`} />
        <StatCard label="Unassigned" value={unassigned} icon={UserRoundX} tone={unassigned ? 'warning' : 'default'}
          hint={unassignedOnly ? 'Showing only these · click to clear' : 'Click to show only these'}
          onClick={() => { setUnassignedOnly((v) => !v); setPage(1); }} active={unassignedOnly} />
      </div>

      <DataCard
        toolbar={<>
          <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search accounts, companies, emails…" className="h-8 w-full sm:w-72" />
          <FacetFilter title="Tags" options={tagFacets} value={tagFilter} onChange={(v) => { setTagFilter(v); setPage(1); }} />
          <FacetFilter title="Team" icon={Users} options={teamFacets} value={teamFilter} onChange={(v) => { setTeamFilter(v); setPage(1); }} />
          {filtersOn && <Button variant="ghost" size="sm" onClick={resetFilters} className="text-muted-foreground">Reset<X /></Button>}
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-sm text-muted-foreground md:inline">{filtered.length} of {accounts.length}</span>
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
        footer={filtered.length > 0 && <Pagination {...paging} label="accounts" />}
      >
        <Table className="min-w-[860px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"><HeaderCheckbox selection={selection} pageIds={pageIds} /></TableHead>
              <SortHead label="Account" col="name" sort={sort} setSort={setSort} />
              {cols.company && <SortHead label="Company" col="company" sort={sort} setSort={setSort} />}
              {cols.tags && <TableHead>Tags</TableHead>}
              {cols.team && <TableHead>Team</TableHead>}
              {cols.emails && <TableHead>Emails</TableHead>}
              <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((a) => {
              const checked = selection.has(a.id);
              const emails = emailsOf(a);
              return (
                <TableRow key={a.id} data-state={checked ? 'selected' : undefined}>
                  <TableCell><SelectCheckbox label={`Select ${a.name}`} checked={checked} onChange={() => selection.toggle(a.id)} /></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar text={initials(a.name)} />
                      <div className="min-w-0">
                        <Link to={accountTabPath('overview', a.id)} className="block truncate font-medium text-foreground underline-offset-4 hover:underline">{a.name}</Link>
                        <div className="truncate text-xs text-muted-foreground">{(a.contacts?.length || 1)} contact{(a.contacts?.length || 1) > 1 ? 's' : ''}</div>
                      </div>
                    </div>
                  </TableCell>
                  {cols.company && <TableCell className="text-muted-foreground">{a.company || <span className="text-muted-foreground/60">—</span>}</TableCell>}
                  {cols.tags && <TableCell><TagList tags={tagsOf(a)} /></TableCell>}
                  {cols.team && <TableCell><TeamList team={a.team} /></TableCell>}
                  {cols.emails && (
                    <TableCell className="max-w-[220px]">
                      {emails.length ? (
                        <div className="flex items-center gap-1.5">
                          <a href={`mailto:${emails[0]}`} className="truncate text-sm text-muted-foreground hover:text-primary hover:underline">{emails[0]}</a>
                          {emails.length > 1 && <SimpleTooltip label={emails.slice(1).join(', ')}><span className="flex-none rounded border bg-muted px-1 text-[11px] font-medium text-muted-foreground">+{emails.length - 1}</span></SimpleTooltip>}
                        </div>
                      ) : <span className="text-muted-foreground/60">—</span>}
                    </TableCell>
                  )}
                  <TableCell className="text-right">
                    <RowActionsMenu label={a.name}
                      extra={[
                        { label: 'Open dashboard', icon: LayoutDashboard, onClick: () => navigate(accountTabPath('overview', a.id)) },
                        { label: 'Quick view', icon: Eye, onClick: () => navigate(`${ACCOUNTS_PATH}/${a.id}`) },
                      ]}
                      onDelete={() => deleteOne(a)} />
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={visibleCount}>
                  {accounts.length === 0 ? (
                    <EmptyState icon={Building2} title="No accounts yet" description="Add your first client account to start tracking contacts, jobs and invoices."
                      action={<Button onClick={() => setModal('add')}><Plus />Add account</Button>} />
                  ) : (
                    <EmptyState icon={SearchX} title="No accounts match" description="Try a different search or remove some filters."
                      action={<Button variant="outline" onClick={resetFilters}>Clear filters</Button>} />
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
        onSelectAll={() => selection.setMany(filtered.map((a) => a.id), true)}
        onClear={selection.clear}
        filters={<SelectedOnlyFilter checked={selectedOnly} onChange={(v) => { setSelectedOnly(v); setPage(1); }} />}
        actions={<>
          <BarSelect label="Add tag" value="" onChange={addTag} options={tagOptions.map((t) => ({ value: t.value, label: t.label }))} />
          <BarSelect label="Assign" value="" onChange={assign} options={TEAM_MEMBERS.map((m) => m.label)} />
          <button type="button" className={barButton} onClick={() => exportRows(selectedRows, 'accounts-selected.csv')}><Download aria-hidden="true" />Export</button>
          <button type="button" className={barDanger} onClick={() => setModal('delete')}><Trash2 aria-hidden="true" />Delete</button>
        </>}
      />

      {modal === 'add' && <AddAccountDrawer onClose={() => setModal(null)} onSave={addAccount} tags={tagOptions} onCreateTag={createTag} />}
      {modal === 'wizard' && <SetupWizard onClose={() => setModal(null)} onFinish={addAccount} />}
      {modal === 'delete' && (
        <Modal title={`Delete ${plural(selection.count, 'account')}?`} description="These accounts and their contacts will be removed." onClose={() => setModal(null)}
          footer={<><Button variant="outline" onClick={() => setModal(null)}>Cancel</Button>
            <Button variant="destructive" onClick={deleteSelected}><Trash2 />Delete {plural(selection.count, 'account')}</Button></>}>
          <ul className="max-h-48 divide-y overflow-y-auto rounded-lg border">
            {selectedRows.map((a) => (
              <li key={a.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                <Avatar text={initials(a.name)} size="xs" /><span className="font-medium">{a.name}</span><span className="truncate text-muted-foreground">{a.company}</span>
              </li>
            ))}
          </ul>
        </Modal>
      )}

      {/* Drawer route renders here: /clients/accounts/activeaccounts/:accountId */}
      <Outlet context={{ accounts }} />
    </div>
  );
}
