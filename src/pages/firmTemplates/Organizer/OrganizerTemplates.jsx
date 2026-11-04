import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiBell, FiCopy, FiDownload, FiLock, FiSearch, FiTrash2, FiUploadCloud, FiUserCheck, FiEye } from 'react-icons/fi';
import RowActionsMenu from '../../../components/RowActionsMenu';
import OrganizerPreview from '../../../components/organizer/OrganizerPreview';
import Pagination, { usePagination } from '../../../components/Pagination';
import {
  BulkBar, HeaderCheckbox, SelectCheckbox, SelectedOnlyFilter, barButton, barDanger, downloadCsv, useSelection,
} from '../../../components/TableSelection';
import { Modal, cx } from '../../../components/ui';
import { useData } from '../../../context/DataContext';
import { questionCount } from '../../../data/organizerTemplates';

const LIST_PATH = '/firmtemp/templates/organizers';
const fmtDate = (d) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—');

/** Firm Templates → Organizers: table of organizer templates. New / Edit open OrganizerTemplateForm. */
export default function OrganizerTemplates() {
  const navigate = useNavigate();
  const { state: routeState, pathname } = useLocation();
  const { organizerTemplates = [], duplicateOrganizerTemplates, deleteOrganizerTemplates, pipelines = [] } = useData();

  // How many pipelines use each organizer (Create Organizer automations)
  const usedIn = useMemo(() => {
    const m = new Map();
    pipelines.forEach((p) => {
      const ids = new Set(p.stages.flatMap((s) => (s.automations || []).filter((a) => a.type === 'Create Organizer').map((a) => String(a.selectedtemp))));
      ids.forEach((id) => m.set(id, [...(m.get(id) || []), p.pipelineName]));
    });
    return m;
  }, [pipelines]);

  const [q, setQ] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [preview, setPreview] = useState(null);
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
    return organizerTemplates.filter((t) => (!selectedOnly || selection.has(t.id))
      && (!s || `${t.templatename} ${t.organizerName} ${t.sections.map((x) => x.text).join(' ')}`.toLowerCase().includes(s)));
  }, [organizerTemplates, q, selectedOnly, selection]);
  const paging = usePagination(filtered, { initialSize: 10, storageKey: 'organizer-templates' });
  const { pageItems: rows, setPage } = paging;
  const selected = organizerTemplates.filter((t) => selection.has(t.id));

  if (!duplicateOrganizerTemplates) return <div role="alert" className="card bg-danger-50 p-6 font-semibold text-danger-700">Organizer templates are not set up in DataContext.js</div>;

  const openNew = () => navigate(`${LIST_PATH}/new`);
  const openEdit = (t) => navigate(`${LIST_PATH}/${t.id}`);
  const remove = () => {
    const ids = confirm.map((t) => t.id);
    deleteOrganizerTemplates(ids); selection.setMany(ids, false); setConfirm(null);
    notify(`Deleted ${ids.length} template${ids.length > 1 ? 's' : ''}`);
  };
  const exportCsv = (items) => {
    downloadCsv('organizer-templates.csv', [['Template name', 'Organizer name', 'Sections', 'Questions', 'Reminders', 'Self service', 'Auto-seal', 'Used in pipelines', 'Updated'],
      ...items.map((t) => [t.templatename, t.organizerName, t.sections.length, questionCount(t),
        t.organizersettings.sendreminderstoclient ? `Every ${t.organizersettings.daysuntilnextreminder} days, ${t.organizersettings.numberofreminders} times` : 'Off',
        t.organizersettings.organizerselfservice ? 'Yes' : 'No', t.organizersettings.automaticallysealaftersubmission ? 'Yes' : 'No', (usedIn.get(String(t.id)) || []).join('; '), t.updatedAt])]);
    notify(`Exported ${items.length} templates`);
  };

  const stats = [
    ['Total templates', organizerTemplates.length],
    ['Questions', organizerTemplates.reduce((n, t) => n + questionCount(t), 0)],
    ['With reminders', organizerTemplates.filter((t) => t.organizersettings.sendreminderstoclient).length],
    ['Used in pipelines', organizerTemplates.filter((t) => usedIn.has(String(t.id))).length],
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Organizer templates</h2>
          <p className="text-muted">Questionnaires clients fill in, with conditional questions and sections.</p>
        </div>
        <button className="btn-primary" onClick={openNew}>+ Create Template</button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(([label, n]) => (
          <div key={label} className="card p-4 sm:p-5"><div className="text-sm text-muted">{label}</div><div className="mt-1.5 text-2xl font-bold">{n}</div></div>
        ))}
      </div>

      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-4 sm:px-5">
          <label className="flex min-h-[44px] flex-[1_1_260px] items-center gap-2 rounded border border-line-strong px-3 focus-within:border-brand-600">
            <FiSearch size={18} className="text-muted" aria-hidden="true" /><span className="sr-only">Search organizer templates</span>
            <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search template, organizer name, section" className="min-w-0 flex-1 bg-transparent outline-none" />
          </label>
          {q && <button onClick={() => { setQ(''); setPage(1); }} className="btn-link px-2">Clear</button>}
        </div>

        <BulkBar count={selection.count} total={filtered.length}
          onSelectAll={() => selection.setMany(filtered.map((t) => t.id), true)} onClear={selection.clear}
          filters={<SelectedOnlyFilter checked={selectedOnly} onChange={(v) => { setSelectedOnly(v); setPage(1); }} />}
          actions={<>
            <button className={barButton} onClick={() => { duplicateOrganizerTemplates([...selection.ids]); notify(`Duplicated ${selection.count} template${selection.count > 1 ? 's' : ''}`); selection.clear(); }}><FiCopy aria-hidden="true" /> Duplicate</button>
            <button className={barButton} onClick={() => exportCsv(selected)}><FiDownload aria-hidden="true" /> Export</button>
            <button className={barDanger} onClick={() => setConfirm(selected)}><FiTrash2 aria-hidden="true" /> Delete</button>
          </>}
        />

        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] border-collapse">
            <thead>
              <tr className="bg-subtle text-left text-xs uppercase tracking-wide text-muted">
                <th className="w-12 py-3 pl-5 pr-1"><HeaderCheckbox selection={selection} pageIds={rows.map((t) => t.id)} /></th>
                <th className="px-3 py-3 font-semibold">Template Name</th>
                <th className="px-3 py-3 font-semibold">Sections</th>
                <th className="px-3 py-3 font-semibold">Questions</th>
                <th className="px-3 py-3 font-semibold">Settings</th>
                <th className="px-3 py-3 font-semibold">Used in Pipelines</th>
                <th className="px-3 py-3 font-semibold">Updated</th>
                <th className="px-5 py-3 text-right font-semibold"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => {
                const checked = selection.has(t.id);
                const st = t.organizersettings || {};
                const pipes = usedIn.get(String(t.id)) || [];
                return (
                  <tr key={t.id} aria-selected={checked} className={cx('border-t border-line-soft', checked ? 'bg-brand-50' : 'hover:bg-subtle/60')}>
                    <td className="py-3 pl-5 pr-1"><SelectCheckbox label={`Select ${t.templatename}`} checked={checked} onChange={() => selection.toggle(t.id)} /></td>
                    <td className="max-w-[320px] px-3 py-3">
                      <button onClick={() => openEdit(t)} className="text-left font-semibold hover:text-brand-600 hover:underline">{t.templatename}</button>
                      <div className="truncate font-mono text-xs text-muted">{t.organizerName}</div>
                    </td>
                    <td className="px-3 py-3 text-sm"><span className="font-semibold">{t.sections.length}</span><span className="ml-1.5 text-muted">{t.sections.slice(0, 2).map((s) => s.text).join(', ')}{t.sections.length > 2 ? '…' : ''}</span></td>
                    <td className="px-3 py-3 font-semibold">{questionCount(t)}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2 text-muted">
                        {st.sendreminderstoclient && <span title={`Reminds every ${st.daysuntilnextreminder} days, ${st.numberofreminders} times`}><FiBell className="text-warning-700" aria-label="Sends reminders" /></span>}
                        {st.notifyaboutdocumentupload && <span title="Notifies about document uploads"><FiUploadCloud aria-label="Notifies about uploads" /></span>}
                        {st.organizerselfservice && <span title="Self service"><FiUserCheck aria-label="Self service" /></span>}
                        {st.automaticallysealaftersubmission && <span title="Seals after submission"><FiLock aria-label="Seals after submission" /></span>}
                        {!st.sendreminderstoclient && !st.notifyaboutdocumentupload && !st.organizerselfservice && !st.automaticallysealaftersubmission && <span>—</span>}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-sm">{pipes.length ? <span title={pipes.join(', ')}>{pipes.length} pipeline{pipes.length > 1 ? 's' : ''}</span> : <span className="text-muted">—</span>}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-muted">{fmtDate(t.updatedAt)}</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end">
                        <RowActionsMenu label={t.templatename} onEdit={() => openEdit(t)}
                          onDuplicate={() => { duplicateOrganizerTemplates([t.id]); notify(`Duplicated “${t.templatename}”`); }}
                          extra={[{ label: 'Preview', icon: FiEye, onClick: () => setPreview(t) }]}
                          onDelete={() => setConfirm([t])} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center gap-3 p-12 text-center text-muted">
              {organizerTemplates.length ? 'No organizer templates match your search.' : 'No organizer templates found'}
              {!organizerTemplates.length && <><span className="text-sm">Create your first organizer template to get started</span><button onClick={openNew} className="btn-primary">+ Create Template</button></>}
            </div>
          )}
        </div>
        <Pagination {...paging} label="templates" />
      </section>

      {preview && <OrganizerPreview organizer={preview} onClose={() => setPreview(null)} />}
      {confirm && (
        <Modal title={confirm.length === 1 ? 'Delete Organizer Template' : `Delete ${confirm.length} organizer templates?`} onClose={() => setConfirm(null)}
          footer={<><button className="btn-secondary" onClick={() => setConfirm(null)}>Cancel</button><button className="btn bg-danger-700 text-white hover:bg-[#831E15]" onClick={remove}>Delete</button></>}>
          <p className="text-muted">{confirm.length === 1 ? <>Are you sure you want to delete <span className="font-semibold text-danger-700">“{confirm[0].templatename}”</span>?</> : 'Are you sure you want to delete these templates?'} Organizers already sent are not affected.</p>
        </Modal>
      )}
      {toast && <div role="status" className="fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-md bg-ink px-5 py-3 font-semibold text-white">{toast}</div>}
    </div>
  );
}