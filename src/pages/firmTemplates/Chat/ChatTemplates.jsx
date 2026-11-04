import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiBell, FiCheckSquare, FiCopy, FiDownload, FiSearch, FiTrash2 } from 'react-icons/fi';
import Pagination, { usePagination } from '../../../components/Pagination';
import { htmlToText } from '../../../components/TextEditor';
import {
  BulkBar, HeaderCheckbox, SelectCheckbox, SelectedOnlyFilter, barButton, barDanger, downloadCsv, useSelection,
} from '../../../components/TableSelection';
import { Avatar, Modal, cx, initials } from '../../../components/ui';
import { useData } from '../../../context/DataContext';
import { SENDERS } from '../../../data/emailtemplates';
import RowActionsMenu from '../../../components/RowActionsMenu';

const LIST_PATH = '/firmtemp/templates/chats';
const fmtDate = (d) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—');

/** Firm Templates → Chats: table of chat templates. New / Edit open ChatTemplateForm (same as Tasks, Emails, Jobs). */
export default function ChatTemplates() {
  const navigate = useNavigate();
  const { state: routeState, pathname } = useLocation();
  const { chatTemplates = [], duplicateChatTemplates, deleteChatTemplates } = useData();

  const [q, setQ] = useState('');
  const [from, setFrom] = useState('All');
  const [reminders, setReminders] = useState('All');   // All · On · Off
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
    return chatTemplates.filter((t) => (from === 'All' || t.selecteduser?.value === from)
      && (reminders === 'All' || (reminders === 'On' ? t.sendReminders : !t.sendReminders))
      && (!selectedOnly || selection.has(t.id))
      && (!s || `${t.templateName} ${t.inputText} ${htmlToText(t.description)} ${t.selecteduser?.label || ''}`.toLowerCase().includes(s)));
  }, [chatTemplates, q, from, reminders, selectedOnly, selection]);

  const paging = usePagination(filtered, { initialSize: 10, storageKey: 'chat-templates' });
  const { pageItems: rows, setPage } = paging;
  const selected = chatTemplates.filter((t) => selection.has(t.id));
  const filtersOn = q || from !== 'All' || reminders !== 'All';
  const reset = () => { setQ(''); setFrom('All'); setReminders('All'); setSelectedOnly(false); setPage(1); };

  if (!duplicateChatTemplates) return <div role="alert" className="card bg-danger-50 p-6 font-semibold text-danger-700">Chat templates are not set up in DataContext.js</div>;

  const openNew = () => navigate(`${LIST_PATH}/new`);
  const openEdit = (t) => navigate(`${LIST_PATH}/${t.id}`);
  const remove = () => {
    const ids = confirm.map((t) => t.id);
    deleteChatTemplates(ids); selection.setMany(ids, false); setConfirm(null);
    notify(`Deleted ${ids.length} template${ids.length > 1 ? 's' : ''}`);
  };
  const exportCsv = (items) => {
    downloadCsv('chat-templates.csv', [['Name', 'From', 'Subject', 'Message', 'Reminders', 'Client tasks', 'Updated'],
      ...items.map((t) => [t.templateName, t.selecteduser?.label || '', t.inputText, htmlToText(t.description),
        t.sendReminders ? `Every ${t.daysuntilNextReminder} days, ${t.noOfReminder} times` : 'Off',
        (t.SubtaskSwitch ? t.subtasks || [] : []).map((s) => s.text).join('; '), t.updatedAt])]);
    notify(`Exported ${items.length} templates`);
  };

  const stats = [
    ['Total templates', chatTemplates.length],
    ['With reminders', chatTemplates.filter((t) => t.sendReminders).length],
    ['With client tasks', chatTemplates.filter((t) => t.SubtaskSwitch && t.subtasks?.length).length],
    ['Senders', new Set(chatTemplates.map((t) => t.selecteduser?.value).filter(Boolean)).size],
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Chat templates</h2>
          <p className="text-muted">Messages for client chats, with reminders and a checklist of client tasks.</p>
        </div>
        <button className="btn-primary" onClick={openNew}>+ New chat template</button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(([label, n]) => (
          <div key={label} className="card p-4 sm:p-5"><div className="text-sm text-muted">{label}</div><div className="mt-1.5 text-2xl font-bold">{n}</div></div>
        ))}
      </div>

      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-4 sm:px-5">
          <label className="flex min-h-[44px] flex-[1_1_240px] items-center gap-2 rounded border border-line-strong px-3 focus-within:border-brand-600">
            <FiSearch size={18} className="text-muted" aria-hidden="true" /><span className="sr-only">Search chat templates</span>
            <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search name, subject, message, sender" className="min-w-0 flex-1 bg-transparent outline-none" />
          </label>
          <label className="flex items-center gap-2 text-muted">From
            <select value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} className="input min-h-[44px] w-auto">
              <option value="All">All</option>
              {SENDERS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2 text-muted">Reminders
            <select value={reminders} onChange={(e) => { setReminders(e.target.value); setPage(1); }} className="input min-h-[44px] w-auto">
              {['All', 'On', 'Off'].map((o) => <option key={o}>{o}</option>)}
            </select>
          </label>
          {filtersOn ? <button onClick={reset} className="btn-link px-2">Clear filters</button> : null}
        </div>

        <BulkBar count={selection.count} total={filtered.length}
          onSelectAll={() => selection.setMany(filtered.map((t) => t.id), true)} onClear={selection.clear}
          filters={<SelectedOnlyFilter checked={selectedOnly} onChange={(v) => { setSelectedOnly(v); setPage(1); }} />}
          actions={<>
            <button className={barButton} onClick={() => { duplicateChatTemplates([...selection.ids]); notify(`Duplicated ${selection.count} template${selection.count > 1 ? 's' : ''}`); selection.clear(); }}><FiCopy aria-hidden="true" /> Duplicate</button>
            <button className={barButton} onClick={() => exportCsv(selected)}><FiDownload aria-hidden="true" /> Export</button>
            <button className={barDanger} onClick={() => setConfirm(selected)}><FiTrash2 aria-hidden="true" /> Delete</button>
          </>}
        />

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse">
            <thead>
              <tr className="bg-subtle text-left text-xs uppercase tracking-wide text-muted">
                <th className="w-12 py-3 pl-5 pr-1"><HeaderCheckbox selection={selection} pageIds={rows.map((t) => t.id)} /></th>
                <th className="px-3 py-3 font-semibold">Template name</th>
                <th className="px-3 py-3 font-semibold">From</th>
                <th className="px-3 py-3 font-semibold">Subject</th>
                <th className="px-3 py-3 font-semibold">Reminders</th>
                <th className="px-3 py-3 font-semibold">Client tasks</th>
                <th className="px-3 py-3 font-semibold">Updated</th>
                <th className="px-5 py-3 text-right font-semibold"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => {
                const checked = selection.has(t.id);
                const taskCount = t.SubtaskSwitch ? (t.subtasks || []).length : 0;
                return (
                  <tr key={t.id} aria-selected={checked} className={cx('border-t border-line-soft', checked ? 'bg-brand-50' : 'hover:bg-subtle/60')}>
                    <td className="py-3 pl-5 pr-1"><SelectCheckbox label={`Select ${t.templateName}`} checked={checked} onChange={() => selection.toggle(t.id)} /></td>
                    <td className="max-w-[260px] px-3 py-3">
                      <button onClick={() => openEdit(t)} className="text-left font-semibold hover:text-brand-600 hover:underline">{t.templateName}</button>
                      {t.description && <div className="truncate text-sm text-muted">{htmlToText(t.description)}</div>}
                    </td>
                    <td className="px-3 py-3">{t.selecteduser ? <span className="flex items-center gap-2"><Avatar text={initials(t.selecteduser.label)} size="sm" />{t.selecteduser.label}</span> : <span className="text-muted">—</span>}</td>
                    <td className="max-w-[260px] truncate px-3 py-3 text-sm">{t.inputText}</td>
                    <td className="px-3 py-3 text-sm">{t.sendReminders
                      ? <span className="inline-flex items-center gap-1.5"><FiBell className="text-warning-700" aria-hidden="true" />Every {t.daysuntilNextReminder}d · {t.noOfReminder}×</span>
                      : <span className="text-muted">Off</span>}</td>
                    <td className="px-3 py-3 text-sm">{taskCount ? <span className="inline-flex items-center gap-1.5"><FiCheckSquare aria-hidden="true" />{taskCount}</span> : <span className="text-muted">—</span>}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-muted">{fmtDate(t.updatedAt)}</td>
                    <td className="px-5 py-3">
                      <RowActionsMenu
                        label={t.templateName}
                        onEdit={() => openEdit(t)}
                        onDuplicate={() => { duplicateChatTemplates([t.id]); notify(`Duplicated “${t.templateName}”`); }}
                        onDelete={() => setConfirm([t])}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center gap-3 p-12 text-center text-muted">
              {chatTemplates.length ? 'No chat templates match these filters.' : 'No chat templates yet.'}
              {chatTemplates.length ? <button onClick={reset} className="btn-secondary">Clear filters</button> : <button onClick={openNew} className="btn-primary">+ New chat template</button>}
            </div>
          )}
        </div>
        <Pagination {...paging} label="templates" />
      </section>

      {confirm && (
        <Modal title={confirm.length === 1 ? `Delete “${confirm[0].templateName}”?` : `Delete ${confirm.length} templates?`} onClose={() => setConfirm(null)}
          footer={<><button className="btn-secondary" onClick={() => setConfirm(null)}>Cancel</button><button className="btn bg-danger-700 text-white hover:bg-[#831E15]" onClick={remove}>Delete</button></>}>
          <p className="text-muted">Chats already sent from {confirm.length === 1 ? 'this template' : 'these templates'} are not affected.</p>
        </Modal>
      )}
      {toast && <div role="status" className="fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-md bg-ink px-5 py-3 font-semibold text-white">{toast}</div>}
    </div>
  );
}