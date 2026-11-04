import { useEffect, useMemo, useState } from 'react';
import { Outlet, useNavigate, useSearchParams } from 'react-router-dom';
import { FiDownload, FiTrash2 } from 'react-icons/fi';
import { ACCOUNTS_PATH, accountTabPath } from '../../config';
import Pagination, { usePagination } from '../../components/Pagination';
import MultiSelect from '../../components/MultiSelect';
import { FiSearch } from 'react-icons/fi';
import { Avatar, Modal, cx, initials } from '../../components/ui';
import { BarSelect, BulkBar, HeaderCheckbox, SelectCheckbox, SelectedOnlyFilter, barButton, barDanger, downloadCsv, useSelection } from '../../components/TableSelection';
import { TEAM_MEMBERS } from '../../data/sampleData';
import TagChip, { chipStyle } from '../../components/TagChip';
import { useData } from '../../context/DataContext';
import AddAccountDrawer from './AddAccountDrawer';
import SetupWizard from '../../components/SetupWizard';

const TEAM_OPTIONS = TEAM_MEMBERS.map((m) => ({ ...m, value: m.label })); // accounts store team members by name
const emailsOf = (a) => (a.contacts?.length ? a.contacts.map((c) => c.email) : [a.email]).filter(Boolean);

function TagList({ tags, max = 3 }) {
  if (!tags?.length) return <span className="text-muted">—</span>;
  const rest = tags.length - max;
  return (
    <div className="flex flex-wrap gap-1">
      {tags.slice(0, max).map((t) => <TagChip key={t.value} tag={t} size="xs" />)}
      {rest > 0 && <span className="rounded-full bg-[#E8EDF5] px-2 py-0.5 text-xs font-semibold text-muted" title={tags.slice(max).map((t) => t.label).join(', ')}>+{rest}</span>}
    </div>
  );
}

function TeamList({ team }) {
  if (!team?.length) return <span className="text-muted">Unassigned</span>;
  return (
    <div className="flex items-center gap-2" title={team.join(', ')}>
      <div className="flex -space-x-2">
        {team.slice(0, 3).map((m) => <span key={m} className="rounded-full ring-2 ring-surface"><Avatar text={initials(m)} size="sm" tone="solid" /></span>)}
      </div>
      <span className="max-w-[150px] truncate text-sm">{team.length === 1 ? team[0] : `${team[0].split(' ')[0]} +${team.length - 1}`}</span>
    </div>
  );
}

function EmailList({ emails }) {
  if (!emails.length) return <span className="text-muted">—</span>;
  return (
    <div className="flex flex-col">
      <a href={`mailto:${emails[0]}`} className="truncate text-sm text-brand-600 hover:underline">{emails[0]}</a>
      {emails.length > 1 && <span className="text-xs text-muted" title={emails.slice(1).join(', ')}>+{emails.length - 1} more</span>}
    </div>
  );
}

export default function Accounts() {
  const navigate = useNavigate();
  const { accounts, setAccounts, tags: tagOptions, tagById, createTag, addAccount: addNewAccount } = useData();
  const [searchParams, setSearchParams] = useSearchParams();
  const [q, setQ] = useState('');
  const [tagFilter, setTagFilter] = useState(() => (searchParams.get('tag') ? [searchParams.get('tag')] : [])); // tag ids, e.g. ?tag=vip from the Tags page
  const [teamFilter, setTeamFilter] = useState([]); // team member names
  const [modal, setModal] = useState(null); // 'add' | 'wizard' | 'delete' | null
  const [toast, setToast] = useState('');

  const tagsOf = (a) => (a.tags || []).map((id) => tagById.get(id)).filter(Boolean);

  // Selection + its "selected only" filter
  const selection = useSelection();
  const [selectedOnly, setSelectedOnly] = useState(false);
  useEffect(() => { if (selection.count === 0) setSelectedOnly(false); }, [selection.count]);

  // Links from the quick panel: ?new=account opens the Add account drawer, ?q= pre-fills the search
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    let changed = false;
    if (next.get('new') === 'account') { setModal('add'); next.delete('new'); changed = true; }
    if (next.has('q')) { setQ(next.get('q')); next.delete('q'); changed = true; }
    if (changed) setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2600); };

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return accounts.filter((a) => {
      if (tagFilter.length && !tagFilter.some((t) => (a.tags || []).includes(t))) return false;   // has any selected tag
      if (teamFilter.length && !teamFilter.some((m) => (a.team || []).includes(m))) return false; // has any selected member
      if (selectedOnly && !selection.has(a.id)) return false;
      if (!s) return true;
      const hay = [a.name, a.company, ...emailsOf(a), ...(a.team || []), ...tagsOf(a).map((t) => t.label)].join(' ').toLowerCase();
      return hay.includes(s);
    });
  }, [accounts, q, tagFilter, teamFilter, selectedOnly, selection, tagById]); // eslint-disable-line react-hooks/exhaustive-deps

  const paging = usePagination(filtered, { initialSize: 10, storageKey: 'accounts' });
  const { pageItems: rows, setPage } = paging;
  const pageIds = rows.map((a) => a.id);
  const selectedRows = accounts.filter((a) => selection.has(a.id));
  const filtersOn = q || tagFilter.length || teamFilter.length;

  const stats = [
    ['Total accounts', accounts.length],
    ['Contacts', accounts.reduce((n, a) => n + (a.contacts?.length || 1), 0)],
    ['Tagged accounts', accounts.filter((a) => a.tags?.length).length],
    ['Without a team member', accounts.filter((a) => !a.team?.length).length],
  ];

  const addAccount = (form) => {
    const rec = addNewAccount(form); // shared with the "+ New" panel (see DataContext)
    setModal(null); resetFilters();
    notify(`${rec.name} was added`);
  };
  function resetFilters() { setQ(''); setTagFilter([]); setTeamFilter([]); setSelectedOnly(false); setPage(1); }

  // Bulk actions
  const addTag = (value) => {
    const tag = tagOptions.find((t) => t.value === value);
    if (!tag) return;
    setAccounts((list) => list.map((a) => (selection.has(a.id) && !(a.tags || []).includes(value) ? { ...a, tags: [...(a.tags || []), value] } : a)));
    notify(`Added “${tag.label}” to ${selection.count} account${selection.count > 1 ? 's' : ''}`);
  };
  const assign = (member) => {
    if (!member) return;
    setAccounts((list) => list.map((a) => (selection.has(a.id) && !(a.team || []).includes(member) ? { ...a, team: [...(a.team || []), member] } : a)));
    notify(`Assigned ${member} to ${selection.count} account${selection.count > 1 ? 's' : ''}`);
  };
  const exportSelected = () => {
    downloadCsv('accounts-selected.csv', [['Account name', 'Company', 'Tags', 'Team members', 'Emails'],
      ...selectedRows.map((a) => [a.name, a.company, tagsOf(a).map((t) => t.label).join('; '), (a.team || []).join('; '), emailsOf(a).join('; ')])]);
    notify(`Exported ${selectedRows.length} accounts`);
  };
  const deleteSelected = () => {
    const n = selection.count;
    setAccounts((list) => list.filter((a) => !selection.has(a.id)));
    selection.clear(); setModal(null); setPage(1);
    notify(`Deleted ${n} account${n > 1 ? 's' : ''}`);
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-sm text-muted">Clients / Accounts</div>
          <h1 className="mt-1 text-3xl font-bold">Accounts</h1>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button className="btn-secondary" onClick={() => setModal('wizard')}>Guided setup</button>
          <button className="btn-primary" onClick={() => setModal('add')}>+ Add account</button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(([l, n]) => (
          <div key={l} className="card p-4 sm:p-5"><div className="text-sm text-muted">{l}</div><div className="mt-1.5 text-2xl font-bold">{n}</div></div>
        ))}
      </div>

      <section className="card">
        {/* Filters */}
        <div className="flex flex-wrap items-start gap-3 border-b border-line px-4 py-4 sm:px-5">
          <label className="flex min-h-[44px] flex-[1_1_240px] items-center gap-2 rounded border border-line-strong px-3 focus-within:border-brand-600">
            <FiSearch size={18} className="text-muted" aria-hidden="true" />
            <span className="sr-only">Search accounts</span>
            <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search account, company, email…" className="min-w-0 flex-1 bg-transparent outline-none" />
          </label>
          <div className="flex-[1_1_220px]">
            <MultiSelect placeholder="Filter by tags" options={tagOptions} value={tagFilter}
              onChange={(v) => { setTagFilter(v); setPage(1); }} chipStyle={(o) => chipStyle(o.color)} emptyText="No tags"
              renderOption={(o) => <TagChip tag={o} />} />
          </div>
          <div className="flex-[1_1_220px]">
            <MultiSelect placeholder="Filter by team members" options={TEAM_OPTIONS} value={teamFilter}
              onChange={(v) => { setTeamFilter(v); setPage(1); }}
              renderOption={(o) => (
                <span className="flex flex-1 items-center gap-2.5"><Avatar text={initials(o.label)} size="sm" />
                  <span><span className="block font-semibold">{o.label}</span><span className="block text-sm text-muted">{o.meta}</span></span></span>
              )} />
          </div>
          {filtersOn ? <button onClick={resetFilters} className="btn-link min-h-[44px] px-2">Clear filters</button> : null}
        </div>

        {/* Shown only while rows are selected */}
        <BulkBar
          count={selection.count}
          total={filtered.length}
          onSelectAll={() => selection.setMany(filtered.map((a) => a.id), true)}
          onClear={selection.clear}
          filters={<SelectedOnlyFilter checked={selectedOnly} onChange={(v) => { setSelectedOnly(v); setPage(1); }} />}
          actions={<>
            <BarSelect label="Add tag" value="" onChange={addTag} options={[{ value: '', label: 'Choose…' }, ...tagOptions.map((t) => ({ value: t.value, label: t.label }))]} />
            <BarSelect label="Assign" value="" onChange={assign} options={[{ value: '', label: 'Choose…' }, ...TEAM_MEMBERS.map((m) => m.label)]} />
            <button className={barButton} onClick={exportSelected}><FiDownload aria-hidden="true" /> Export</button>
            <button className={barDanger} onClick={() => setModal('delete')}><FiTrash2 aria-hidden="true" /> Delete</button>
          </>}
        />

        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse">
            <thead>
              <tr className="bg-subtle text-left text-xs uppercase tracking-wide text-muted">
                <th className="w-12 py-3 pl-5 pr-1"><HeaderCheckbox selection={selection} pageIds={pageIds} /></th>
                <th className="px-3 py-3 font-semibold">Account name</th>
                <th className="px-3 py-3 font-semibold">Company</th>
                <th className="px-3 py-3 font-semibold">Tags</th>
                <th className="px-3 py-3 font-semibold">Team members</th>
                <th className="px-3 py-3 font-semibold">Emails</th>
                <th className="px-5 py-3 text-right font-semibold"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => {
                const checked = selection.has(a.id);
                return (
                  <tr key={a.id} aria-selected={checked} className={cx('border-t border-line-soft align-middle', checked ? 'bg-brand-50' : 'hover:bg-subtle/60')}>
                    <td className="py-3 pl-5 pr-1"><SelectCheckbox label={`Select ${a.name}`} checked={checked} onChange={() => selection.toggle(a.id)} /></td>
                    {/* <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar text={initials(a.name)} />
                        <button onClick={() => navigate(`${ACCOUNTS_PATH}/${a.id}`)} className="text-left font-semibold hover:text-brand-600 hover:underline">{a.name}</button>
                      </div>
                    </td> */}
                     <td className="px-3 py-3">
                                          <div className="flex items-center gap-3">
                                            <Avatar text={initials(a.name)} />
                                            <button onClick={() => navigate(accountTabPath('overview', a.id))} className="text-left font-semibold hover:text-brand-600 hover:underline">{a.name}</button>
                                          </div>
                                        </td>
                    <td className="px-3 py-3">{a.company || <span className="text-muted">—</span>}</td>
                    <td className="px-3 py-3"><TagList tags={tagsOf(a)} /></td>
                    <td className="px-3 py-3"><TeamList team={a.team} /></td>
                    <td className="max-w-[220px] px-3 py-3"><EmailList emails={emailsOf(a)} /></td>
                    <td className="px-5 py-3 text-right"><button onClick={() => navigate(`${ACCOUNTS_PATH}/${a.id}`)} className="btn-secondary min-h-[36px] px-3.5 text-brand-600">View</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center gap-3 p-12 text-center text-muted">
              No accounts match these filters.
              <button onClick={resetFilters} className="btn-secondary">Clear filters</button>
            </div>
          )}
        </div>
        <Pagination {...paging} label="accounts" />
      </section>

      {modal === 'add' && <AddAccountDrawer onClose={() => setModal(null)} onSave={addAccount} tags={tagOptions} onCreateTag={createTag} />}
      {modal === 'wizard' && <SetupWizard onClose={() => setModal(null)} onFinish={addAccount} />}
      {modal === 'delete' && (
        <Modal title={`Delete ${selection.count} account${selection.count > 1 ? 's' : ''}?`} onClose={() => setModal(null)}
          footer={<><button className="btn-secondary" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn bg-danger-700 text-white hover:bg-[#831E15]" onClick={deleteSelected}>Delete accounts</button></>}>
          <p className="text-muted">These accounts and their contacts will be removed. This can't be undone.</p>
          <ul className="mt-3 max-h-40 list-disc overflow-y-auto pl-5">{selectedRows.map((a) => <li key={a.id}>{a.name} <span className="text-muted">· {a.company}</span></li>)}</ul>
        </Modal>
      )}
      {toast && <div role="status" className="fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-md bg-ink px-5 py-3 font-semibold text-white">{toast}</div>}

      {/* Drawer route renders here: /clients/accounts/activeaccounts/:accountId */}
      <Outlet context={{ accounts }} />
    </div>
  );
}
