import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiCopy, FiDownload, FiPaperclip, FiSearch, FiTrash2 } from 'react-icons/fi';
import Pagination, { usePagination } from '../../../components/Pagination';
import { htmlToText } from '../../../components/TextEditor';
import {
  BulkBar, HeaderCheckbox, SelectCheckbox, SelectedOnlyFilter, barButton, barDanger, downloadCsv, useSelection,
} from '../../../components/TableSelection';
import { Avatar, Modal, cx, initials } from '../../../components/ui';
import { useData } from '../../../context/DataContext';
import { EMAIL_MODES, SENDERS, modeLabel } from '../../../data/emailtemplates';
import RowActionsMenu from '../../../components/RowActionsMenu';
const LIST_PATH = '/firmtemp/templates/emails';
const fmtDate = (d) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—');
const MODE_STYLE = { contacts: 'bg-violet-50 text-violet-700', account: 'bg-brand-100 text-brand-800' };

/** Firm Templates → Emails: table of email templates. New / Edit open EmailTemplateForm. */
export default function EmailTemplates() {
  const navigate = useNavigate();
  const { state: routeState, pathname } = useLocation();
  const { emailTemplates = [], duplicateEmailTemplates, deleteEmailTemplates } = useData();

  const [q, setQ] = useState('');
  const [mode, setMode] = useState('All');
  const [from, setFrom] = useState('All');
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
    return emailTemplates.filter((t) => (mode === 'All' || t.mode === mode)
      && (from === 'All' || t.selectedUser?.value === from)
      && (!selectedOnly || selection.has(t.id))
      && (!s || `${t.templateName} ${t.subject} ${htmlToText(t.emailBody)} ${t.selectedUser?.label || ''}`.toLowerCase().includes(s)));
  }, [emailTemplates, q, mode, from, selectedOnly, selection]);

  const paging = usePagination(filtered, { initialSize: 10, storageKey: 'email-templates' });
  const { pageItems: rows, setPage } = paging;
  const selected = emailTemplates.filter((t) => selection.has(t.id));
  const filtersOn = q || mode !== 'All' || from !== 'All';
  const reset = () => { setQ(''); setMode('All'); setFrom('All'); setSelectedOnly(false); setPage(1); };
  const openNew = () => navigate(`${LIST_PATH}/new`);
  const openEdit = (t) => navigate(`${LIST_PATH}/${t.id}`);

  const remove = () => {
    const ids = confirm.map((t) => t.id);
    deleteEmailTemplates(ids); selection.setMany(ids, false); setConfirm(null);
    notify(`Deleted ${ids.length} template${ids.length > 1 ? 's' : ''}`);
  };
  const exportCsv = (items) => {
    downloadCsv('email-templates.csv', [['Name', 'Mode', 'From', 'Subject', 'Body', 'Attachments', 'Updated'],
      ...items.map((t) => [t.templateName, modeLabel(t.mode), t.selectedUser?.label || '', t.subject, htmlToText(t.emailBody), (t.files || []).map((f) => f.name).join('; '), t.updatedAt])]);
    notify(`Exported ${items.length} templates`);
  };

  const stats = [['Total templates', emailTemplates.length], ...EMAIL_MODES.map((m) => [m.label, emailTemplates.filter((t) => t.mode === m.value).length]),
    ['With attachments', emailTemplates.filter((t) => t.files?.length).length]];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Email templates</h2>
          <p className="text-muted">Emails your team sends often, with shortcodes filled in for each contact or account.</p>
        </div>
        <button className="btn-primary" onClick={openNew}>+ New email template</button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(([label, n]) => (
          <div key={label} className="card p-4 sm:p-5"><div className="text-sm text-muted">{label}</div><div className="mt-1.5 text-2xl font-bold">{n}</div></div>
        ))}
      </div>

      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-4 sm:px-5">
          <label className="flex min-h-[44px] flex-[1_1_240px] items-center gap-2 rounded border border-line-strong px-3 focus-within:border-brand-600">
            <FiSearch size={18} className="text-muted" aria-hidden="true" /><span className="sr-only">Search email templates</span>
            <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search name, subject, body, sender" className="min-w-0 flex-1 bg-transparent outline-none" />
          </label>
          <label className="flex items-center gap-2 text-muted">Mode
            <select value={mode} onChange={(e) => { setMode(e.target.value); setPage(1); }} className="input min-h-[44px] w-auto">
              <option value="All">All</option>
              {EMAIL_MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2 text-muted">From
            <select value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} className="input min-h-[44px] w-auto">
              <option value="All">All</option>
              {SENDERS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
            </select>
          </label>
          {filtersOn ? <button onClick={reset} className="btn-link px-2">Clear filters</button> : null}
        </div>

        <BulkBar count={selection.count} total={filtered.length}
          onSelectAll={() => selection.setMany(filtered.map((t) => t.id), true)} onClear={selection.clear}
          filters={<SelectedOnlyFilter checked={selectedOnly} onChange={(v) => { setSelectedOnly(v); setPage(1); }} />}
          actions={<>
            <button className={barButton} onClick={() => { duplicateEmailTemplates([...selection.ids]); notify(`Duplicated ${selection.count} template${selection.count > 1 ? 's' : ''}`); selection.clear(); }}><FiCopy aria-hidden="true" /> Duplicate</button>
            <button className={barButton} onClick={() => exportCsv(selected)}><FiDownload aria-hidden="true" /> Export</button>
            <button className={barDanger} onClick={() => setConfirm(selected)}><FiTrash2 aria-hidden="true" /> Delete</button>
          </>}
        />

        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] border-collapse">
            <thead>
              <tr className="bg-subtle text-left text-xs uppercase tracking-wide text-muted">
                <th className="w-12 py-3 pl-5 pr-1"><HeaderCheckbox selection={selection} pageIds={rows.map((t) => t.id)} /></th>
                <th className="px-3 py-3 font-semibold">Template name</th>
                <th className="px-3 py-3 font-semibold">Mode</th>
                <th className="px-3 py-3 font-semibold">From</th>
                <th className="px-3 py-3 font-semibold">Subject</th>
                <th className="px-3 py-3 font-semibold">Attachments</th>
                <th className="px-3 py-3 font-semibold">Updated</th>
                <th className="px-5 py-3 text-right font-semibold"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => {
                const checked = selection.has(t.id);
                return (
                  <tr key={t.id} aria-selected={checked} className={cx('border-t border-line-soft', checked ? 'bg-brand-50' : 'hover:bg-subtle/60')}>
                    <td className="py-3 pl-5 pr-1"><SelectCheckbox label={`Select ${t.templateName}`} checked={checked} onChange={() => selection.toggle(t.id)} /></td>
                    <td className="max-w-[260px] px-3 py-3">
                      <button onClick={() => openEdit(t)} className="text-left font-semibold hover:text-brand-600 hover:underline">{t.templateName}</button>
                      {t.emailBody && <div className="truncate text-sm text-muted">{htmlToText(t.emailBody)}</div>}
                    </td>
                    <td className="px-3 py-3"><span className={cx('pill', MODE_STYLE[t.mode])}>{modeLabel(t.mode)}</span></td>
                    <td className="px-3 py-3">
                      {t.selectedUser ? <span className="flex items-center gap-2"><Avatar text={initials(t.selectedUser.label)} size="sm" />{t.selectedUser.label}</span> : <span className="text-muted">—</span>}
                    </td>
                    <td className="max-w-[260px] truncate px-3 py-3 text-sm">{t.subject}</td>
                    <td className="px-3 py-3 text-sm">{t.files?.length ? <span className="inline-flex items-center gap-1"><FiPaperclip aria-hidden="true" />{t.files.length}</span> : <span className="text-muted">—</span>}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-muted">{fmtDate(t.updatedAt)}</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        {/* <button onClick={() => openEdit(t)} aria-label={`Edit ${t.templateName}`} className="flex h-9 w-9 items-center justify-center rounded text-muted hover:bg-subtle hover:text-ink"><FiEdit2 aria-hidden="true" /></button>
                        <button onClick={() => { duplicateEmailTemplates([t.id]); notify(`Duplicated “${t.templateName}”`); }} aria-label={`Duplicate ${t.templateName}`} className="flex h-9 w-9 items-center justify-center rounded text-muted hover:bg-subtle hover:text-ink"><FiCopy aria-hidden="true" /></button>
                        <button onClick={() => setConfirm([t])} aria-label={`Delete ${t.templateName}`} className="flex h-9 w-9 items-center justify-center rounded text-danger-700 hover:bg-danger-50"><FiTrash2 aria-hidden="true" /></button> */}
                     <RowActionsMenu
                        label={t.templateName}
                        onEdit={() => openEdit(t)}
                        onDuplicate={() => { duplicateEmailTemplates([t.id]); notify(`Duplicated “${t.templateName}”`); }}
                        onDelete={() => setConfirm([t])}
                      />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center gap-3 p-12 text-center text-muted">
              {emailTemplates.length ? 'No email templates match these filters.' : 'No email templates yet.'}
              {emailTemplates.length ? <button onClick={reset} className="btn-secondary">Clear filters</button> : <button onClick={openNew} className="btn-primary">+ New email template</button>}
            </div>
          )}
        </div>
        <Pagination {...paging} label="templates" />
      </section>

      {confirm && (
        <Modal title={confirm.length === 1 ? `Delete “${confirm[0].templateName}”?` : `Delete ${confirm.length} templates?`} onClose={() => setConfirm(null)}
          footer={<><button className="btn-secondary" onClick={() => setConfirm(null)}>Cancel</button><button className="btn bg-danger-700 text-white hover:bg-[#831E15]" onClick={remove}>Delete</button></>}>
          <p className="text-muted">Emails already sent from {confirm.length === 1 ? 'this template' : 'these templates'} are not affected.</p>
        </Modal>
      )}
      {toast && <div role="status" className="fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-md bg-ink px-5 py-3 font-semibold text-white">{toast}</div>}
    </div>
  );
}