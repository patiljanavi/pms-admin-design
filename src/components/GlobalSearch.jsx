import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowRight, FiSearch, FiX } from 'react-icons/fi';
import { ACCOUNTS_PATH, CONTACTS_PATH } from '../config';
import { useData } from '../context/DataContext';
import { Avatar, cx, initials } from './ui';

const ALL_LIMIT = 4;    // rows per group on the "All" tab
const TAB_LIMIT = 50;   // rows on the Accounts / Contacts tabs

function Highlight({ text = '', q }) {
  const i = q ? text.toLowerCase().indexOf(q) : -1;
  if (i < 0) return text;
  return <>{text.slice(0, i)}<mark className="rounded-sm bg-warning-50 text-inherit">{text.slice(i, i + q.length)}</mark>{text.slice(i + q.length)}</>;
}

/** Finds accounts (name, company, email) and contacts (contact name, first/middle/last name, email, company). */
function useSearch(term) {
  const { accounts, contacts } = useData();
  return useMemo(() => {
    if (!term) return { accounts: [], contacts: [] };
    const accs = accounts.filter((a) => `${a.name} ${a.company} ${a.email}`.toLowerCase().includes(term));
    const cons = contacts.filter((c) => `${c.contactName} ${c.firstName} ${c.middleName} ${c.lastName} ${c.email} ${c.company}`.toLowerCase().includes(term))
      .map((c) => ({ ...c, name: c.contactName }));
    return { accounts: accs, contacts: cons };
  }, [accounts, contacts, term]);
}

function AccountRow({ a, term, onPick }) {
  return (
    <li>
      <button data-result onClick={() => onPick(`${ACCOUNTS_PATH}/${a.id}`)} className="flex w-full items-center gap-3 rounded px-3 py-2 text-left hover:bg-subtle focus:bg-subtle focus:outline-none">
        <Avatar text={initials(a.name)} size="sm" />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold"><Highlight text={a.name} q={term} /></span>
          <span className="block truncate text-sm text-muted"><Highlight text={a.company} q={term} /> · <Highlight text={a.email} q={term} /></span>
        </span>
        <span className="hidden text-xs font-semibold text-muted sm:block">Account</span>
      </button>
    </li>
  );
}

function ContactRow({ c, term, onPick }) {
  return (
    <li>
      <button data-result onClick={() => onPick(`${CONTACTS_PATH}?edit=${c.id}`)} className="flex w-full items-center gap-3 rounded px-3 py-2 text-left hover:bg-subtle focus:bg-subtle focus:outline-none">
        <Avatar text={initials(c.name || c.email)} size="sm" tone="dark" />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold"><Highlight text={c.name || c.email} q={term} /></span>
          <span className="block truncate text-sm text-muted"><Highlight text={c.email} q={term} />{c.company && <> · <Highlight text={c.company} q={term} /></>}</span>
        </span>
        <span className="hidden text-xs font-semibold text-muted sm:block">Contact</span>
      </button>
    </li>
  );
}

/** Tabs + results. Shared by the desktop dropdown and the phone overlay. */
function Results({ term, rawQuery, tab, setTab, onPick }) {
  const r = useSearch(term);
  const tabs = [['all', 'All', r.accounts.length + r.contacts.length], ['accounts', 'Accounts', r.accounts.length], ['contacts', 'Contacts', r.contacts.length]];
  const nothing = r.accounts.length + r.contacts.length === 0;

  return (
    <div className="flex min-h-0 flex-col">
      <div role="tablist" aria-label="Result type" className="flex gap-1 border-b border-line px-3">
        {tabs.map(([id, label, n]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
            className={cx('flex min-h-[44px] items-center gap-2 border-b-[3px] px-3 font-semibold',
              tab === id ? 'border-brand-600 text-brand-600' : 'border-transparent text-muted hover:text-ink')}>
            {label}
            <span className={cx('rounded-full px-2 py-0.5 text-xs', tab === id ? 'bg-brand-100 text-brand-600' : 'bg-[#E8EDF5] text-muted')}>{n}</span>
          </button>
        ))}
      </div>

      <div role="tabpanel" className="overflow-y-auto p-2" aria-live="polite">
        {nothing && <p className="px-3 py-8 text-center text-muted">No accounts or contacts match “{rawQuery}”.</p>}

        {!nothing && tab === 'all' && (
          <div className="flex flex-col gap-3">
            {r.accounts.length > 0 && (
              <section>
                <h3 className="px-3 pb-1 pt-1.5 text-xs font-semibold uppercase tracking-wide text-muted">Accounts</h3>
                <ul>{r.accounts.slice(0, ALL_LIMIT).map((a) => <AccountRow key={a.id} a={a} term={term} onPick={onPick} />)}</ul>
                {r.accounts.length > ALL_LIMIT && <button data-result onClick={() => setTab('accounts')} className="btn-link ml-3 mt-1 inline-flex items-center gap-1 text-sm">View all {r.accounts.length} accounts <FiArrowRight aria-hidden="true" /></button>}
              </section>
            )}
            {r.contacts.length > 0 && (
              <section>
                <h3 className="px-3 pb-1 pt-1.5 text-xs font-semibold uppercase tracking-wide text-muted">Contacts</h3>
                <ul>{r.contacts.slice(0, ALL_LIMIT).map((c) => <ContactRow key={c.id} c={c} term={term} onPick={onPick} />)}</ul>
                {r.contacts.length > ALL_LIMIT && <button data-result onClick={() => setTab('contacts')} className="btn-link ml-3 mt-1 inline-flex items-center gap-1 text-sm">View all {r.contacts.length} contacts <FiArrowRight aria-hidden="true" /></button>}
              </section>
            )}
          </div>
        )}

        {!nothing && tab === 'accounts' && (r.accounts.length
          ? <>
              <ul>{r.accounts.slice(0, TAB_LIMIT).map((a) => <AccountRow key={a.id} a={a} term={term} onPick={onPick} />)}</ul>
              <button data-result onClick={() => onPick(`${ACCOUNTS_PATH}?q=${encodeURIComponent(rawQuery.trim())}`)} className="btn-link ml-3 mt-2 inline-flex items-center gap-1 text-sm">Open in Accounts table <FiArrowRight aria-hidden="true" /></button>
            </>
          : <p className="px-3 py-8 text-center text-muted">No accounts match “{rawQuery}”.</p>)}

        {!nothing && tab === 'contacts' && (r.contacts.length
          ? <ul>{r.contacts.slice(0, TAB_LIMIT).map((c) => <ContactRow key={c.id} c={c} term={term} onPick={onPick} />)}</ul>
          : <p className="px-3 py-8 text-center text-muted">No contacts match “{rawQuery}”.</p>)}
      </div>
    </div>
  );
}

/**
 * Header search for accounts and contacts.
 * Desktop: input with a dropdown. Phones: a search button that opens a full-screen search.
 * Ctrl + K / ⌘ + K focuses it from anywhere.
 */
export default function GlobalSearch() {
  const navigate = useNavigate();
  const boxRef = useRef(null);
  const inputRef = useRef(null);
  const mobileInputRef = useRef(null);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tab, setTab] = useState('all');
  const term = q.trim().toLowerCase();

  useEffect(() => { setTab('all'); }, [term]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (window.matchMedia('(min-width: 1024px)').matches) { inputRef.current?.focus(); setOpen(true); }
        else setMobileOpen(true);
      }
    };
    const onDoc = (e) => { if (!boxRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDoc);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onDoc); };
  }, []);
  useEffect(() => { if (mobileOpen) mobileInputRef.current?.focus(); }, [mobileOpen]);

  const pick = (to) => { navigate(to); setOpen(false); setMobileOpen(false); setQ(''); };

  // ↑ / ↓ between the input and the results; Esc closes
  const onKeyNav = (e, input) => {
    if (e.key === 'Escape') { setOpen(false); setMobileOpen(false); input?.blur(); return; }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const root = e.currentTarget;
    const items = [input, ...root.querySelectorAll('[data-result]')].filter(Boolean);
    const i = items.indexOf(document.activeElement);
    if (i === -1) return;
    e.preventDefault();
    items[Math.max(0, Math.min(items.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1)))]?.focus();
  };

  const field = (ref, autoOpen, panelId) => (
    <label className="flex min-h-[42px] items-center gap-2 rounded-md border border-line-strong bg-surface px-3 focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-600/30">
      <FiSearch size={18} className="flex-none text-muted" aria-hidden="true" />
      <span className="sr-only">Search accounts and contacts</span>
      <input ref={ref} value={q} onChange={(e) => { setQ(e.target.value); if (autoOpen) setOpen(true); }} onFocus={() => autoOpen && setOpen(true)}
        placeholder="Search accounts, contacts, emails…" role="combobox" aria-controls={panelId} aria-expanded={autoOpen ? open && !!term : !!term}
        className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted/70" />
      {q ? <button type="button" onClick={() => { setQ(''); ref.current?.focus(); }} aria-label="Clear search" className="text-muted hover:text-ink"><FiX /></button>
        : <kbd className="hidden rounded border border-line-strong bg-subtle px-1.5 py-0.5 font-mono text-xs text-muted xl:block">Ctrl K</kbd>}
    </label>
  );

  return (
    <>
      {/* Desktop: inline field + dropdown */}
      <div ref={boxRef} className="relative hidden w-full max-w-[560px] lg:block" onKeyDown={(e) => onKeyNav(e, inputRef.current)}>
        {field(inputRef, true, 'global-search-results')}
        {open && term && (
          <div id="global-search-results" className="absolute left-0 right-0 top-full z-50 mt-2 flex max-h-[70vh] flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-pop">
            <Results term={term} rawQuery={q} tab={tab} setTab={setTab} onPick={pick} />
          </div>
        )}
      </div>

      {/* Phones / tablets: icon that opens a full-screen search */}
      <button type="button" onClick={() => setMobileOpen(true)} aria-label="Search" className="flex h-10 w-10 items-center justify-center rounded text-ink hover:bg-subtle lg:hidden"><FiSearch size={20} /></button>
      {mobileOpen && (
        <div role="dialog" aria-modal="true" aria-label="Search" className="fixed inset-0 z-50 flex flex-col bg-surface lg:hidden" onKeyDown={(e) => onKeyNav(e, mobileInputRef.current)}>
          <div className="flex items-center gap-2 border-b border-line p-3">
            <div className="flex-1">{field(mobileInputRef, false, 'global-search-results-mobile')}</div>
            <button type="button" onClick={() => setMobileOpen(false)} className="btn-link px-2">Cancel</button>
          </div>
          {term ? <div id="global-search-results-mobile" className="flex min-h-0 flex-1 flex-col"><Results term={term} rawQuery={q} tab={tab} setTab={setTab} onPick={pick} /></div>
            : <p className="p-6 text-center text-muted">Search by account name, contact name or email.</p>}
        </div>
      )}
    </>
  );
}
