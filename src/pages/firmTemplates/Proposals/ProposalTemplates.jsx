import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiCopy, FiDownload, FiSearch, FiTrash2 } from 'react-icons/fi';
import RowActionsMenu from '../../../components/RowActionsMenu';
import Pagination, { usePagination } from '../../../components/Pagination';
import {
  BulkBar, HeaderCheckbox, SelectCheckbox, SelectedOnlyFilter, barButton, barDanger, downloadCsv, useSelection,
} from '../../../components/TableSelection';
import { Avatar, Modal, cx, initials } from '../../../components/ui';
import { useData } from '../../../context/DataContext';
import { money } from '../../../data/invoiceTemplates';
import { proposalSteps, proposalTotal } from '../../../data/proposalTemplates';

const LIST_PATH = '/firmtemp/templates/proposals';
const fmtDate = (d) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—');
const BILLING = { invoice: 'Invoices', services: 'Itemized services', '': 'Not set' };
const billingOf = (p) => (p.general.servicesEnabled ? (p.services.option || '') : 'none');

/** Firm Templates → Proposals & ELs: table of proposal templates. New / Edit open ProposalTemplateForm. */
export default function ProposalTemplates() {
  const navigate = useNavigate();
  const { state: routeState, pathname } = useLocation();
  const { proposalTemplates = [], duplicateProposalTemplates, deleteProposalTemplates } = useData();

  const [q, setQ] = useState('');
  const [billing, setBilling] = useState('All');
  const [confirm, setConfirm] = useState(null);
  const [toast, setToast] = useState('');
  const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 2600); };
  useEffect(() => {
    if (routeState?.toast) { notify(routeState.toast); navigate(pathname, { replace: true, state: null }); }
  }, [routeState]); // eslint-disable-line react-hooks/exhaustive-deps

  const selection = useSelection();
  const [selectedOnly, setSelectedOnly] = useState(false);
  useEffect(() => { if (selection.count === 0) setSelectedOnly(false); }, [selection.count]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return proposalTemplates.filter((p) => (billing === 'All' || billingOf(p) === billing)
      && (!selectedOnly || selection.has(p.id))
      && (!s || `${p.general.templateName} ${p.general.proposalName} ${(p.general.teamMembers || []).join(' ')}`.toLowerCase().includes(s)));
  }, [proposalTemplates, q, billing, selectedOnly, selection]);
  const paging = usePagination(filtered, { initialSize: 10, storageKey: 'proposal-templates' });
  const { pageItems: rows, setPage } = paging;
  const selected = proposalTemplates.filter((p) => selection.has(p.id));
  const filtersOn = q || billing !== 'All';
  const reset = () => { setQ(''); setBilling('All'); setSelectedOnly(false); setPage(1); };

  if (!duplicateProposalTemplates) return <div role="alert" className="card bg-danger-50 p-6 font-semibold text-danger-700">Proposal templates are not set up in DataContext.js</div>;

  const openNew = () => navigate(`${LIST_PATH}/new`);
  const openEdit = (p) => navigate(`${LIST_PATH}/${p.id}`);
  const remove = () => {
    const ids = confirm.map((p) => p.id);
    deleteProposalTemplates(ids); selection.setMany(ids, false); setConfirm(null);
    notify(`Deleted ${ids.length} proposal${ids.length > 1 ? 's' : ''}`);
  };
  const exportCsv = (items) => {
    downloadCsv('proposal-templates.csv', [['Template name', 'Proposal name', 'Steps', 'Billing', 'Invoices', 'Total', 'Team', 'Updated'],
      ...items.map((p) => [p.general.templateName, p.general.proposalName, proposalSteps(p).map((s) => s.name).join(' → '), BILLING[billingOf(p)] || '—',
        p.services.option === 'invoice' ? p.services.invoices.length : 0, proposalTotal(p), (p.general.teamMembers || []).join('; '), p.updatedAt])]);
    notify(`Exported ${items.length} proposals`);
  };

  const stats = [
    ['Total proposals', proposalTemplates.length],
    ['Bill with invoices', proposalTemplates.filter((p) => billingOf(p) === 'invoice').length],
    ['Itemized services', proposalTemplates.filter((p) => billingOf(p) === 'services').length],
    ['Collect payment', proposalTemplates.filter((p) => p.general.paymentsEnabled && p.services.option === 'invoice').length],
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Proposal &amp; EL templates</h2>
          <p className="text-muted">Proposals with an introduction, engagement letter, services or invoices, and payment.</p>
        </div>
        <button className="btn-primary" onClick={openNew}>+ New proposal template</button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(([label, n]) => (
          <div key={label} className="card p-4 sm:p-5"><div className="text-sm text-muted">{label}</div><div className="mt-1.5 text-2xl font-bold">{n}</div></div>
        ))}
      </div>

      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-4 sm:px-5">
          <label className="flex min-h-[44px] flex-[1_1_240px] items-center gap-2 rounded border border-line-strong px-3 focus-within:border-brand-600">
            <FiSearch size={18} className="text-muted" aria-hidden="true" /><span className="sr-only">Search proposals</span>
            <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search template, proposal name, team" className="min-w-0 flex-1 bg-transparent outline-none" />
          </label>
          <label className="flex items-center gap-2 text-muted">Billing
            <select value={billing} onChange={(e) => { setBilling(e.target.value); setPage(1); }} className="input min-h-[44px] w-auto">
              <option value="All">All</option>
              <option value="invoice">Invoices</option>
              <option value="services">Itemized services</option>
              <option value="none">No services step</option>
            </select>
          </label>
          {filtersOn ? <button onClick={reset} className="btn-link px-2">Clear filters</button> : null}
        </div>

        <BulkBar count={selection.count} total={filtered.length}
          onSelectAll={() => selection.setMany(filtered.map((p) => p.id), true)} onClear={selection.clear}
          filters={<SelectedOnlyFilter checked={selectedOnly} onChange={(v) => { setSelectedOnly(v); setPage(1); }} />}
          actions={<>
            <button className={barButton} onClick={() => { duplicateProposalTemplates([...selection.ids]); notify(`Duplicated ${selection.count} proposal${selection.count > 1 ? 's' : ''}`); selection.clear(); }}><FiCopy aria-hidden="true" /> Duplicate</button>
            <button className={barButton} onClick={() => exportCsv(selected)}><FiDownload aria-hidden="true" /> Export</button>
            <button className={barDanger} onClick={() => setConfirm(selected)}><FiTrash2 aria-hidden="true" /> Delete</button>
          </>}
        />

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] border-collapse">
            <thead>
              <tr className="bg-subtle text-left text-xs uppercase tracking-wide text-muted">
                <th className="w-12 py-3 pl-5 pr-1"><HeaderCheckbox selection={selection} pageIds={rows.map((p) => p.id)} /></th>
                <th className="px-3 py-3 font-semibold">Template</th>
                <th className="px-3 py-3 font-semibold">Steps</th>
                <th className="px-3 py-3 font-semibold">Billing</th>
                <th className="px-3 py-3 text-right font-semibold">Total</th>
                <th className="px-3 py-3 font-semibold">Team</th>
                <th className="px-3 py-3 font-semibold">Updated</th>
                <th className="px-5 py-3 text-right font-semibold"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const checked = selection.has(p.id);
                const b = billingOf(p);
                return (
                  <tr key={p.id} aria-selected={checked} className={cx('border-t border-line-soft', checked ? 'bg-brand-50' : 'hover:bg-subtle/60')}>
                    <td className="py-3 pl-5 pr-1"><SelectCheckbox label={`Select ${p.general.templateName}`} checked={checked} onChange={() => selection.toggle(p.id)} /></td>
                    <td className="max-w-[300px] px-3 py-3">
                      <button onClick={() => openEdit(p)} className="text-left font-semibold hover:text-brand-600 hover:underline">{p.general.templateName}</button>
                      <div className="truncate font-mono text-xs text-muted">{p.general.proposalName}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        {proposalSteps(p).slice(1).map((s) => <span key={s.key} className="rounded bg-subtle px-1.5 py-0.5 text-xs font-semibold text-muted">{s.name}</span>)}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-sm">{b === 'none' ? <span className="text-muted">—</span>
                      : b === 'invoice' ? <span>{p.services.invoices.length} invoice{p.services.invoices.length === 1 ? '' : 's'}{p.general.paymentsEnabled ? ' · payment' : ''}</span>
                        : BILLING[b]}</td>
                    <td className="px-3 py-3 text-right font-semibold">{b === 'none' || !b ? <span className="font-normal text-muted">—</span> : money(proposalTotal(p))}</td>
                    <td className="px-3 py-3">
                      <div className="flex -space-x-2" title={(p.general.teamMembers || []).join(', ')}>
                        {(p.general.teamMembers || []).slice(0, 3).map((n) => <span key={n} className="rounded-full ring-2 ring-surface"><Avatar text={initials(n)} size="sm" tone="solid" /></span>)}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-muted">{fmtDate(p.updatedAt)}</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end">
                        <RowActionsMenu label={p.general.templateName} onEdit={() => openEdit(p)}
                          onDuplicate={() => { duplicateProposalTemplates([p.id]); notify(`Duplicated “${p.general.templateName}”`); }}
                          onDelete={() => setConfirm([p])} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center gap-3 p-12 text-center text-muted">
              {proposalTemplates.length ? 'No proposals match these filters.' : 'No proposal templates yet.'}
              {proposalTemplates.length ? <button onClick={reset} className="btn-secondary">Clear filters</button> : <button onClick={openNew} className="btn-primary">+ New proposal template</button>}
            </div>
          )}
        </div>
        <Pagination {...paging} label="proposals" />
      </section>

      {confirm && (
        <Modal title={confirm.length === 1 ? `Delete “${confirm[0].general.templateName}”?` : `Delete ${confirm.length} proposals?`} onClose={() => setConfirm(null)}
          footer={<><button className="btn-secondary" onClick={() => setConfirm(null)}>Cancel</button><button className="btn bg-danger-700 text-white hover:bg-[#831E15]" onClick={remove}>Delete</button></>}>
          <p className="text-muted">Proposals already sent from {confirm.length === 1 ? 'this template' : 'these templates'} are not affected.</p>
        </Modal>
      )}
      {toast && <div role="status" className="fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-md bg-ink px-5 py-3 font-semibold text-white">{toast}</div>}
    </div>
  );
}