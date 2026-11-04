import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiDownload, FiSearch, FiTrash2 } from 'react-icons/fi';
import { useData } from '../../context/DataContext';
import { COUNTRIES, countryByIso, formatPhone } from '../../data/countries';
import MultiSelect from '../../components/MultiSelect';
import Pagination, { usePagination } from '../../components/Pagination';
import TagChip, { chipStyle } from '../../components/TagChip';
import {
  BarSelect, BulkBar, HeaderCheckbox, SelectCheckbox, SelectedOnlyFilter, barButton, barDanger, downloadCsv, useSelection,
} from '../../components/TableSelection';
import { Avatar, Modal, cx, initials } from '../../components/ui';
import ContactDrawer from './ContactDrawer';

const primaryPhone = (c) => c.phones?.find((p) => p.primary) || c.phones?.[0];
const location = (c) => [c.address?.city, c.address?.state, countryByIso(c.address?.country)?.name].filter(Boolean).join(', ');

export default function Contacts() {
  const { contacts, setContacts, deleteContacts, tags, tagById } = useData();
  const [q, setQ] = useState('');
  const [tagFilter, setTagFilter] = useState([]);
  const [country, setCountry] = useState('All');
  const [confirm, setConfirm] = useState(false);
  const [toast, setToast] = useState('');
  const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 2600); };

  // Drawer: null = closed, 'new' = create, a contact id = edit
  const [drawer, setDrawer] = useState(null);
  const openNew = () => setDrawer('new');
  const openEdit = (id) => setDrawer(id);
  const closeDrawer = () => setDrawer(null);
  const onDrawerDone = (message) => { setDrawer(null); if (message) notify(message); };

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
  const countriesInUse = useMemo(() => {
    const set = new Set(contacts.map((c) => c.address?.country).filter(Boolean));
    return COUNTRIES.filter((c) => set.has(c.iso));
  }, [contacts]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return contacts.filter((c) => {
      if (tagFilter.length && !tagFilter.some((t) => (c.tags || []).includes(t))) return false;
      if (country !== 'All' && c.address?.country !== country) return false;
      if (selectedOnly && !selection.has(c.id)) return false;
      if (!s) return true;
      const hay = [c.contactName, c.firstName, c.middleName, c.lastName, c.email, c.company, c.address?.city,
        ...(c.phones || []).map((p) => `${formatPhone(p)} ${p.number.replace(/\D/g, '')}`)].join(' ').toLowerCase();
      return hay.includes(s);
    });
  }, [contacts, q, tagFilter, country, selectedOnly, selection]);

  const paging = usePagination(filtered, { initialSize: 10, storageKey: 'contacts' });
  const { pageItems: rows, setPage } = paging;
  const selected = contacts.filter((c) => selection.has(c.id));
  const filtersOn = q || tagFilter.length || country !== 'All';
  const reset = () => { setQ(''); setTagFilter([]); setCountry('All'); setSelectedOnly(false); setPage(1); };

  const addTag = (id) => {
    if (!id) return;
    setContacts((list) => list.map((c) => (selection.has(c.id) && !(c.tags || []).includes(id) ? { ...c, tags: [...(c.tags || []), id] } : c)));
    notify(`Added “${tagById.get(id)?.label}” to ${selection.count} contact${selection.count > 1 ? 's' : ''}`);
  };
  const exportSelected = () => {
    downloadCsv('contacts-selected.csv', [['Contact name', 'First name', 'Middle name', 'Last name', 'Company', 'Email', 'Phones', 'Tags', 'Street', 'City', 'State', 'ZIP', 'Country', 'Note'],
      ...selected.map((c) => [c.contactName, c.firstName, c.middleName, c.lastName, c.company, c.email,
        (c.phones || []).map((p) => `${formatPhone(p)} (${p.type})`).join('; '), tagsOf(c).map((t) => t.label).join('; '),
        c.address?.street, c.address?.city, c.address?.state, c.address?.zip, countryByIso(c.address?.country)?.name || '', c.note])]);
    notify(`Exported ${selected.length} contacts`);
  };
  const doDelete = () => {
    const n = selection.count;
    deleteContacts([...selection.ids]);
    selection.clear(); setConfirm(false);
    notify(`Deleted ${n} contact${n > 1 ? 's' : ''}`);
  };

  const stats = [
    ['Total contacts', contacts.length],
    ['With a phone number', contacts.filter((c) => c.phones?.length).length],
    ['Countries', new Set(contacts.map((c) => c.address?.country).filter(Boolean)).size],
  ];

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-sm text-muted">Clients / Contacts</div>
          <h1 className="mt-1 text-3xl font-bold">Contacts</h1>
        </div>
        <button className="btn-primary" onClick={openNew}>+ New contact</button>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map(([l, n]) => <div key={l} className="card p-4 sm:p-5"><div className="text-sm text-muted">{l}</div><div className="mt-1.5 text-2xl font-bold">{n}</div></div>)}
      </div>

      <section className="card">
        <div className="flex flex-wrap items-start gap-3 border-b border-line px-4 py-4 sm:px-5">
          <label className="flex min-h-[44px] flex-[1_1_240px] items-center gap-2 rounded border border-line-strong px-3 focus-within:border-brand-600">
            <FiSearch size={18} className="text-muted" aria-hidden="true" /><span className="sr-only">Search contacts</span>
            <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search name, email, company, phone…" className="min-w-0 flex-1 bg-transparent outline-none" />
          </label>
          <div className="flex-[1_1_220px]">
            <MultiSelect placeholder="Filter by tags" options={tags} value={tagFilter} onChange={(v) => { setTagFilter(v); setPage(1); }}
              chipStyle={(o) => chipStyle(o.color)} renderOption={(o) => <TagChip tag={o} />} emptyText="No tags" />
          </div>
          <label className="flex min-h-[44px] items-center gap-2 text-muted">Country
            <select value={country} onChange={(e) => { setCountry(e.target.value); setPage(1); }} className="input min-h-[44px] w-auto">
              <option value="All">All</option>
              {countriesInUse.map((c) => <option key={c.iso} value={c.iso}>{c.name}</option>)}
            </select>
          </label>
          {filtersOn ? <button onClick={reset} className="btn-link min-h-[44px] px-2">Clear filters</button> : null}
        </div>

        <BulkBar count={selection.count} total={filtered.length}
          onSelectAll={() => selection.setMany(filtered.map((c) => c.id), true)} onClear={selection.clear}
          filters={<SelectedOnlyFilter checked={selectedOnly} onChange={(v) => { setSelectedOnly(v); setPage(1); }} />}
          actions={<>
            <BarSelect label="Add tag" value="" onChange={addTag} options={[{ value: '', label: 'Choose…' }, ...tags.map((t) => ({ value: t.value, label: t.label }))]} />
            <button className={barButton} onClick={exportSelected}><FiDownload aria-hidden="true" /> Export</button>
            <button className={barDanger} onClick={() => setConfirm(true)}><FiTrash2 aria-hidden="true" /> Delete</button>
          </>}
        />

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse">
            <thead>
              <tr className="bg-subtle text-left text-xs uppercase tracking-wide text-muted">
                <th className="w-12 py-3 pl-5 pr-1"><HeaderCheckbox selection={selection} pageIds={rows.map((c) => c.id)} /></th>
                <th className="px-3 py-3 font-semibold">Contact name</th>
                <th className="px-3 py-3 font-semibold">Company</th>
                <th className="px-3 py-3 font-semibold">Phone</th>
                <th className="px-3 py-3 font-semibold">Tags</th>
                <th className="px-3 py-3 font-semibold">Location</th>
                <th className="px-5 py-3 text-right font-semibold"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const checked = selection.has(c.id);
                const phone = primaryPhone(c);
                const extra = (c.phones?.length || 0) - 1;
                const t = tagsOf(c);
                return (
                  <tr key={c.id} aria-selected={checked} className={cx('border-t border-line-soft', checked ? 'bg-brand-50' : 'hover:bg-subtle/60')}>
                    <td className="py-3 pl-5 pr-1"><SelectCheckbox label={`Select ${c.contactName}`} checked={checked} onChange={() => selection.toggle(c.id)} /></td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar text={initials(c.contactName)} />
                        <div className="min-w-0">
                          <button onClick={() => openEdit(c.id)} className="block max-w-[240px] truncate text-left font-semibold hover:text-brand-600 hover:underline">{c.contactName}</button>
                          <a href={`mailto:${c.email}`} className="block max-w-[240px] truncate text-sm text-muted hover:text-brand-600">{c.email}</a>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">{c.company || <span className="text-muted">—</span>}</td>
                    <td className="px-3 py-3">
                      {phone ? (
                        <div>
                          <a href={`tel:${formatPhone(phone).replace(/[^\d+]/g, '')}`} className="whitespace-nowrap font-mono text-sm hover:text-brand-600">{formatPhone(phone)}</a>
                          <div className="text-xs text-muted">{phone.type}{extra > 0 ? ` · +${extra} more` : ''}</div>
                        </div>
                      ) : <span className="text-muted">—</span>}
                    </td>
                    <td className="px-3 py-3">
                      {t.length ? <div className="flex flex-wrap gap-1">{t.slice(0, 2).map((x) => <TagChip key={x.value} tag={x} size="xs" />)}{t.length > 2 && <span className="rounded-full bg-[#E8EDF5] px-2 py-0.5 text-xs font-semibold text-muted">+{t.length - 2}</span>}</div> : <span className="text-muted">—</span>}
                    </td>
                    <td className="px-3 py-3">{location(c) || <span className="text-muted">—</span>}</td>
                    <td className="px-5 py-3 text-right"><button onClick={() => openEdit(c.id)} className="btn-secondary min-h-[36px] px-3.5 text-brand-600">Edit</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center gap-3 p-12 text-center text-muted">
              {contacts.length ? 'No contacts match these filters.' : 'No contacts yet.'}
              {contacts.length ? <button onClick={reset} className="btn-secondary">Clear filters</button> : <button onClick={openNew} className="btn-primary">+ New contact</button>}
            </div>
          )}
        </div>
        <Pagination {...paging} label="contacts" />
      </section>

      {confirm && (
        <Modal title={`Delete ${selection.count} contact${selection.count > 1 ? 's' : ''}?`} onClose={() => setConfirm(false)}
          footer={<><button className="btn-secondary" onClick={() => setConfirm(false)}>Cancel</button>
            <button className="btn bg-danger-700 text-white hover:bg-[#831E15]" onClick={doDelete}>Delete contacts</button></>}>
          <p className="text-muted">These contacts will be removed. This can't be undone.</p>
          <ul className="mt-3 max-h-40 list-disc overflow-y-auto pl-5">{selected.map((c) => <li key={c.id}>{c.contactName} <span className="text-muted">· {c.email}</span></li>)}</ul>
        </Modal>
      )}
      {toast && <div role="status" className="fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-md bg-ink px-5 py-3 font-semibold text-white">{toast}</div>}

      {/* Add / Edit contact drawer */}
      {drawer && <ContactDrawer contactId={drawer} onClose={closeDrawer} onDone={onDrawerDone} />}
    </div>
  );
}
