import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowDown, FiArrowUp, FiDownload, FiEdit2, FiTrash2 } from 'react-icons/fi';
import Pagination, { usePagination } from '../../../components/Pagination';
import { FiSearch } from 'react-icons/fi';
import { Modal, Segmented, cx } from '../../../components/ui';
import TagChip, { TAG_PALETTE, colorName } from '../../../components/TagChip';
import { BarSelect, BulkBar, HeaderCheckbox, SelectCheckbox, SelectedOnlyFilter, barButton, barDanger, downloadCsv, useSelection } from '../../../components/TableSelection';
import { useData } from '../../../context/DataContext';
import TagDrawer from '../../../components/TagDrawer';
import { ACCOUNTS_PATH } from '../../../config';
import RowActionsMenu from '../../../components/RowActionsMenu';

const USAGE = ['All', 'In use', 'Unused'];
const fmtDate = (d) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—');

export default function Tags() {
  const { tags, tagUsage, recolorTags, deleteTags } = useData();
  const [q, setQ] = useState('');
  const [colors, setColors] = useState([]);     // hex values
  const [usage, setUsage] = useState('All');
  const [sort, setSort] = useState({ key: 'label', dir: 'asc' });
  const [drawer, setDrawer] = useState(null);   // { tag: null } = new, { tag } = edit
  const [confirm, setConfirm] = useState(null); // array of tags to delete
  const [toast, setToast] = useState('');
  const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 2600); };

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
  const selectedTags = tags.filter((t) => selection.has(t.value));
  const filtersOn = q || colors.length || usage !== 'All';
  const reset = () => { setQ(''); setColors([]); setUsage('All'); setSelectedOnly(false); setPage(1); };

  const toggleColor = (hex) => { setColors((c) => (c.includes(hex) ? c.filter((x) => x !== hex) : [...c, hex])); setPage(1); };
  const sortBy = (key) => setSort((s) => ({ key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc' }));
  const SortIcon = ({ k }) => (sort.key !== k ? null : sort.dir === 'asc' ? <FiArrowUp aria-hidden="true" /> : <FiArrowDown aria-hidden="true" />);
  const ariaSort = (k) => (sort.key === k ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none');

  const doDelete = () => {
    const ids = confirm.map((t) => t.value);
    deleteTags(ids);
    selection.setMany(ids, false);
    setConfirm(null); setDrawer(null);
    notify(`Deleted ${ids.length} tag${ids.length > 1 ? 's' : ''}`);
  };
  const affected = confirm ? confirm.reduce((n, t) => n + used(t), 0) : 0;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-sm text-muted">Templates / Tags</div>
          <h1 className="mt-1 text-3xl font-bold">Tags</h1>
          <p className="mt-1 text-muted">Labels your team uses to group and filter accounts.</p>
        </div>
        <button className="btn-primary" onClick={() => setDrawer({ tag: null })}>+ New tag</button>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[['Total tags', tags.length], ['In use', tags.filter((t) => used(t) > 0).length], ['Unused', tags.filter((t) => used(t) === 0).length]].map(([l, n]) => (
          <div key={l} className="card p-4 sm:p-5"><div className="text-sm text-muted">{l}</div><div className="mt-1.5 text-2xl font-bold">{n}</div></div>
        ))}
      </div>

      <section className="card overflow-hidden">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-4 sm:px-5">
          <label className="flex min-h-[42px] flex-[1_1_220px] items-center gap-2 rounded border border-line-strong px-3 focus-within:border-brand-600">
            <FiSearch size={18} className="text-muted" aria-hidden="true" /><span className="sr-only">Search tags</span>
            <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search tags" className="min-w-0 flex-1 bg-transparent outline-none" />
          </label>
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by color">
            <span className="text-sm text-muted">Color</span>
            {colorsInUse.map((hex) => {
              const on = colors.includes(hex);
              return (
                <button key={hex} type="button" aria-pressed={on} aria-label={`${colorName(hex)} ${hex}`} title={`${colorName(hex)} ${hex}`} onClick={() => toggleColor(hex)}
                  className={cx('h-7 w-7 rounded-full', on ? 'ring-2 ring-ink ring-offset-2' : 'ring-1 ring-black/10 hover:scale-110')} style={{ backgroundColor: hex }} />
              );
            })}
          </div>
          <Segmented label="Usage" options={USAGE} value={usage} onChange={(v) => { setUsage(v); setPage(1); }} />
          {filtersOn ? <button onClick={reset} className="btn-link px-2">Clear filters</button> : null}
        </div>

        <BulkBar
          count={selection.count}
          total={filtered.length}
          onSelectAll={() => selection.setMany(filtered.map((t) => t.value), true)}
          onClear={selection.clear}
          filters={<SelectedOnlyFilter checked={selectedOnly} onChange={(v) => { setSelectedOnly(v); setPage(1); }} />}
          actions={<>
            <BarSelect label="Set color" value="" onChange={(hex) => { if (!hex) return; recolorTags([...selection.ids], hex); notify(`Changed color of ${selection.count} tag${selection.count > 1 ? 's' : ''} to ${colorName(hex)}`); }}
              options={[{ value: '', label: 'Choose…' }, ...TAG_PALETTE.map((p) => ({ value: p.hex, label: p.name }))]} />
            <button className={barButton} onClick={() => { downloadCsv('tags-selected.csv', [['Name', 'Color', 'Accounts', 'Created', 'Description'], ...selectedTags.map((t) => [t.label, t.color, used(t), t.createdAt, t.description || ''])]); notify(`Exported ${selectedTags.length} tags`); }}>
              <FiDownload aria-hidden="true" /> Export</button>
            <button className={barDanger} onClick={() => setConfirm(selectedTags)}><FiTrash2 aria-hidden="true" /> Delete</button>
          </>}
        />

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse">
            <thead>
              <tr className="bg-subtle text-left text-xs uppercase tracking-wide text-muted">
                <th className="w-12 py-3 pl-5 pr-1"><HeaderCheckbox selection={selection} pageIds={rows.map((t) => t.value)} /></th>
                <th className="px-3 py-3 font-semibold" aria-sort={ariaSort('label')}><button onClick={() => sortBy('label')} className="inline-flex items-center gap-1 uppercase hover:text-ink">Tag <SortIcon k="label" /></button></th>
                <th className="px-3 py-3 font-semibold">Color</th>
                <th className="px-3 py-3 font-semibold" aria-sort={ariaSort('usage')}><button onClick={() => sortBy('usage')} className="inline-flex items-center gap-1 uppercase hover:text-ink">Accounts <SortIcon k="usage" /></button></th>
                <th className="px-3 py-3 font-semibold" aria-sort={ariaSort('created')}><button onClick={() => sortBy('created')} className="inline-flex items-center gap-1 uppercase hover:text-ink">Created <SortIcon k="created" /></button></th>
                <th className="px-5 py-3 text-right font-semibold"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => {
                const checked = selection.has(t.value);
                const n = used(t);
                return (
                  <tr key={t.value} aria-selected={checked} className={cx('border-t border-line-soft', checked ? 'bg-brand-50' : 'hover:bg-subtle/60')}>
                    <td className="py-3 pl-5 pr-1"><SelectCheckbox label={`Select ${t.label}`} checked={checked} onChange={() => selection.toggle(t.value)} /></td>
                    <td className="px-3 py-3">
                      <TagChip tag={t} />
                      {t.description && <div className="mt-1 max-w-[260px] truncate text-sm text-muted">{t.description}</div>}
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center gap-2"><span className="h-4 w-4 rounded-full ring-1 ring-black/10" style={{ backgroundColor: t.color }} aria-hidden="true" />
                        <span>{colorName(t.color)}</span><span className="font-mono text-sm text-muted">{t.color.toUpperCase()}</span></span>
                    </td>
                    <td className="px-3 py-3">
                      {n > 0 ? <Link to={`${ACCOUNTS_PATH}?tag=${encodeURIComponent(t.value)}`} className="font-semibold text-brand-600 hover:underline">{n} account{n > 1 ? 's' : ''}</Link>
                        : <span className="text-muted">Unused</span>}
                    </td>
                    <td className="px-3 py-3 text-muted">{fmtDate(t.createdAt)}</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        {/* <button onClick={() => setDrawer({ tag: t })} aria-label={`Edit ${t.label}`} className="flex h-9 w-9 items-center justify-center rounded text-muted hover:bg-subtle hover:text-ink"><FiEdit2 aria-hidden="true" /></button>
                        <button onClick={() => setConfirm([t])} aria-label={`Delete ${t.label}`} className="flex h-9 w-9 items-center justify-center rounded text-danger-700 hover:bg-danger-50"><FiTrash2 aria-hidden="true" /></button> */}
                     
                      <RowActionsMenu
                        label={t.label}
                        onEdit={() => setDrawer({ tag: t })}
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
              {tags.length ? 'No tags match these filters.' : 'No tags yet. Create one to start grouping accounts.'}
              {tags.length ? <button onClick={reset} className="btn-secondary">Clear filters</button> : <button onClick={() => setDrawer({ tag: null })} className="btn-primary">+ New tag</button>}
            </div>
          )}
        </div>
        <Pagination {...paging} label="tags" />
      </section>

      {drawer && (
        <TagDrawer
          key={drawer.tag?.value || 'new'}
          tag={drawer.tag}
          usage={drawer.tag ? used(drawer.tag) : 0}
          onClose={() => setDrawer(null)}
          onSaved={(tag, isNew) => { setDrawer(null); notify(isNew ? `Created “${tag.label}”` : `Saved “${tag.label}”`); }}
          onDelete={(tag) => setConfirm([tag])}
        />
      )}

      {confirm && (
        <Modal title={confirm.length === 1 ? `Delete “${confirm[0].label}”?` : `Delete ${confirm.length} tags?`} onClose={() => setConfirm(null)}
          footer={<><button className="btn-secondary" onClick={() => setConfirm(null)}>Cancel</button>
            <button className="btn bg-danger-700 text-white hover:bg-[#831E15]" onClick={doDelete}>Delete {confirm.length === 1 ? 'tag' : 'tags'}</button></>}>
          <p className="text-muted">{affected > 0 ? `This removes the tag${confirm.length > 1 ? 's' : ''} from ${affected} account${affected > 1 ? 's' : ''}. The accounts themselves are not deleted.` : 'No accounts use this, so nothing else changes.'}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">{confirm.map((t) => <TagChip key={t.value} tag={t} />)}</div>
        </Modal>
      )}

      {toast && <div role="status" className="fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-md bg-ink px-5 py-3 font-semibold text-white">{toast}</div>}
    </div>
  );
}
