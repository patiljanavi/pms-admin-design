// // import { useState } from 'react';
// // import { FiEdit, FiPlus, FiSave } from 'react-icons/fi';
// // import RowActionsMenu from './RowActionsMenu';
// // import { cx } from './ui';
// // import LineItemModal from './LineItemModal';
// // import ServiceModal from './ServiceModal';
// // import { useData } from '../context/DataContext';
// // import { calcTotals, money, newRow, rowAmount } from '../data/invoiceTemplates';

// // const NEW_SERVICE = '__new_service__';

// // /**
// //  * Line items + summary for an invoice.
// //  * Each row picks a service (from DataContext) or is a custom item; "+ Create new service" opens a modal.
// //  * Props: rows · onChange(rows) · taxRate · onTaxRateChange(rate) · error
// //  */
// // export default function LineItemsAndSummary({ rows, onChange, taxRate, onTaxRateChange, error,
// //   lineItemsTitle = 'Line items', lineItemsSubtitle = 'Client-facing itemized list of products and services', summaryTitle = 'Summary' }) {
// //   const { services = [], serviceCategories = [], getService } = useData();
// //   const [serviceModal, setServiceModal] = useState(null);   // { index, service?, initial? }
// //   const [editIndex, setEditIndex] = useState(null);
// //   const { subtotal, taxTotal, totalAmount } = calcTotals(rows, taxRate);

// //   const setRow = (i, changes) => onChange(rows.map((r, j) => (j === i ? { ...r, ...changes } : r)));
// //   const fromService = (s) => ({ serviceId: s.id, productName: s.name, description: s.description || '', rate: Number(s.rate) || 0, tax: !!s.taxable });

// //   const onServiceChange = (i, value) => {
// //     if (value === NEW_SERVICE) { setServiceModal({ index: i, initial: { name: rows[i].productName, rate: rows[i].rate } }); return; }
// //     if (!value) { setRow(i, { serviceId: null }); return; }
// //     const s = getService?.(value) || services.find((x) => x.id === value);
// //     if (s) setRow(i, fromService(s));
// //   };
// //   const onAddRow = () => onChange([...rows, newRow()]);
// //   const onDuplicate = (i) => { const copy = { ...rows[i], id: newRow().id }; const list = [...rows]; list.splice(i + 1, 0, copy); onChange(list); };
// //   const onDeleteRow = (i) => onChange(rows.filter((_, j) => j !== i));

// //   // services grouped by category for the dropdown
// //   const groups = [...serviceCategories.map((c) => ({ id: c.id, name: c.name, items: services.filter((s) => s.categoryId === c.id) })),
// //     { id: 'none', name: 'Other services', items: services.filter((s) => !s.categoryId || !serviceCategories.some((c) => c.id === s.categoryId)) }]
// //     .filter((g) => g.items.length);

// //   return (
// //     <div className="flex flex-col gap-5">
// //       <div>
// //         <h2 className="text-lg font-semibold">{lineItemsTitle}</h2>
// //         <p className="text-sm text-muted">{lineItemsSubtitle}</p>
// //       </div>
// //       {error && <p role="alert" className="rounded-md bg-danger-50 px-3 py-2 text-sm font-semibold text-danger-700">{error}</p>}

// //       <ol aria-label="Line items" className="flex flex-col gap-3">
// //         {rows.map((r, i) => (
// //           <li key={r.id} aria-label={`Line item ${i + 1}`} className={cx('rounded-lg border p-3', !r.productName.trim() && error ? 'border-danger-700' : 'border-line')}>
// //             <div className="mb-2 flex items-center gap-2">
// //               <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-subtle text-xs font-bold text-muted">{i + 1}</span>
// //               <select aria-label={`Service for item ${i + 1}`} className="input min-h-[38px] min-w-0 flex-1 text-sm" value={r.serviceId ?? ''} onChange={(e) => onServiceChange(i, e.target.value)}>
// //                 <option value="">Custom item (no service)</option>
// //                 {groups.map((g) => (
// //                   <optgroup key={g.id} label={g.name}>
// //                     {g.items.map((s) => <option key={s.id} value={s.id}>{s.name} — {money(s.rate)}</option>)}
// //                   </optgroup>
// //                 ))}
// //                 <option value={NEW_SERVICE}>+ Create new service…</option>
// //               </select>
// //               <RowActionsMenu label={`item ${i + 1}`}
// //                 onEdit={() => setEditIndex(i)}
// //                 onDuplicate={() => onDuplicate(i)}
// //                 extra={[
// //                   ...(r.serviceId && getService?.(r.serviceId) ? [{ label: 'Edit service', icon: FiEdit, onClick: () => setServiceModal({ index: i, service: getService(r.serviceId) }) }] : []),
// //                   { label: 'Save as new service', icon: FiSave, onClick: () => setServiceModal({ index: i, initial: { name: r.productName, description: r.description, rate: r.rate, taxable: r.tax } }) },
// //                 ]}
// //                 onDelete={() => onDeleteRow(i)} />
// //             </div>
// //             <input aria-label={`Item ${i + 1} name`} className="input mb-2 min-h-[38px] text-sm" value={r.productName} placeholder="Item name"
// //               onChange={(e) => setRow(i, { productName: e.target.value })} />
// //             {r.description && <p className="mb-2 line-clamp-2 text-xs text-muted">{r.description}</p>}
// //             <div className="grid grid-cols-[1fr_72px_1fr] items-end gap-2">
// //               <label className="text-xs font-semibold text-muted">Rate
// //                 <input aria-label={`Item ${i + 1} rate`} type="number" min="0" step="0.01" className="input mt-1 min-h-[38px] text-sm" value={r.rate} onChange={(e) => setRow(i, { rate: e.target.value })} />
// //               </label>
// //               <label className="text-xs font-semibold text-muted">Qty
// //                 <input aria-label={`Item ${i + 1} quantity`} type="number" min="1" className="input mt-1 min-h-[38px] text-sm" value={r.qty} onChange={(e) => setRow(i, { qty: e.target.value })} />
// //               </label>
// //               <div className="text-right text-xs font-semibold text-muted">Amount<div className="mt-1 flex min-h-[38px] items-center justify-end text-sm font-bold text-ink" data-testid={`amount-${i + 1}`}>{money(rowAmount(r))}</div></div>
// //             </div>
// //             <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm">
// //               <input type="checkbox" checked={!!r.tax} onChange={(e) => setRow(i, { tax: e.target.checked })} className="h-4 w-4 accent-brand-600" aria-label={`Tax item ${i + 1}`} /> Tax
// //             </label>
// //           </li>
// //         ))}
// //       </ol>
// //       {rows.length === 0 && <p className="rounded-md border border-dashed border-line-strong p-6 text-center text-sm text-muted">No line items yet.</p>}
// //       <button type="button" onClick={onAddRow} className="btn w-full border border-dashed border-line-strong bg-surface text-brand-600 hover:bg-subtle"><FiPlus aria-hidden="true" /> Add line item</button>

// //       {/* Summary */}
// //       <section aria-label={summaryTitle} className="rounded-lg bg-subtle p-4">
// //         <h3 className="mb-3 font-semibold">{summaryTitle}</h3>
// //         <dl className="flex flex-col gap-2 text-sm">
// //           <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="font-semibold" data-testid="subtotal">{money(subtotal)}</dd></div>
// //           <div className="flex items-center justify-between gap-3">
// //             <dt><label htmlFor="tax-rate" className="text-muted">Tax rate (%)</label></dt>
// //             <dd><input id="tax-rate" type="number" min="0" max="100" step="0.01" className="input min-h-[34px] w-24 text-right text-sm" value={taxRate} onChange={(e) => onTaxRateChange(e.target.value)} /></dd>
// //           </div>
// //           <div className="flex justify-between"><dt className="text-muted">Tax</dt><dd className="font-semibold" data-testid="tax-total">{money(taxTotal)}</dd></div>
// //           <div className="mt-1 flex justify-between border-t border-line pt-2 text-base"><dt className="font-bold">Total</dt><dd className="font-bold" data-testid="total">{money(totalAmount)}</dd></div>
// //         </dl>
// //       </section>

// //       {editIndex !== null && rows[editIndex] && (
// //         <LineItemModal row={rows[editIndex]} number={editIndex + 1} onClose={() => setEditIndex(null)}
// //           onSave={(row) => { setRow(editIndex, row); setEditIndex(null); }} />
// //       )}
// //       {serviceModal && (
// //         <ServiceModal service={serviceModal.service || null} initial={serviceModal.initial} onClose={() => setServiceModal(null)}
// //           onSaved={(s) => { setRow(serviceModal.index, fromService(s)); setServiceModal(null); }} />
// //       )}
// //     </div>
// //   );
// // }
// import { useState } from 'react';
// import { FiEdit, FiPlus, FiSave } from 'react-icons/fi';
// import RowActionsMenu from './RowActionsMenu';
// import { cx } from './ui';
// import LineItemModal from './LineItemModal';
// import ServiceCombobox from './Servicecombobox';
// import ServiceModal from './ServiceModal';
// import { useData } from '../context/DataContext';
// import { calcTotals, money, newRow, rowAmount } from '../data/invoiceTemplates';

// /**
//  * Line items (table) + summary for an invoice.
//  * The Item field is type-to-search: pick a service (DataContext), keep what you typed as a custom item,
//  * or create a new service with that name (opens a modal).
//  * Props: rows · onChange(rows) · taxRate · onTaxRateChange(rate) · error
//  */
// export default function LineItemsAndSummary({ rows, onChange, taxRate, onTaxRateChange, error,
//   lineItemsTitle = 'Line items', lineItemsSubtitle = 'Client-facing itemized list of products and services', summaryTitle = 'Summary' }) {
//   const { services = [], serviceCategories = [], getService } = useData();
//   const [serviceModal, setServiceModal] = useState(null);   // { index, service?, initial? }
//   const [editIndex, setEditIndex] = useState(null);
//   const { subtotal, taxTotal, totalAmount } = calcTotals(rows, taxRate);

//   const setRow = (i, changes) => onChange(rows.map((r, j) => (j === i ? { ...r, ...changes } : r)));
//   const fromService = (s) => ({ serviceId: s.id, productName: s.name, description: s.description || '', rate: Number(s.rate) || 0, tax: !!s.taxable });
//   const onAddRow = () => onChange([...rows, newRow()]);
//   const onDuplicate = (i) => { const list = [...rows]; list.splice(i + 1, 0, { ...rows[i], id: newRow().id }); onChange(list); };
//   const onDeleteRow = (i) => onChange(rows.filter((_, j) => j !== i));
//   const cell = 'px-2 py-2 align-top';
//   const numInput = 'min-h-[38px] w-full rounded border border-line-strong bg-surface px-2 text-right text-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/30';

//   return (
//     <div className="flex flex-col gap-4">
//       <div>
//         <h2 className="text-lg font-semibold">{lineItemsTitle}</h2>
//         <p className="text-sm text-muted">{lineItemsSubtitle}</p>
//       </div>
//       {error && <p role="alert" className="rounded-md bg-danger-50 px-3 py-2 text-sm font-semibold text-danger-700">{error}</p>}

//       <div className="overflow-x-auto rounded-lg border border-line">
//         <table className="w-full min-w-[720px] border-collapse text-sm" aria-label="Line items">
//           <thead>
//             <tr className="bg-subtle text-left text-xs uppercase tracking-wide text-muted">
//               <th className="w-10 px-2 py-2.5 text-center font-semibold">#</th>
//               <th className="px-2 py-2.5 font-semibold">Item</th>
//               <th className="w-28 px-2 py-2.5 text-right font-semibold">Rate</th>
//               <th className="w-20 px-2 py-2.5 text-right font-semibold">Qty</th>
//               <th className="w-28 px-2 py-2.5 text-right font-semibold">Amount</th>
//               <th className="w-14 px-2 py-2.5 text-center font-semibold">Tax</th>
//               <th className="w-12 px-2 py-2.5"><span className="sr-only">Actions</span></th>
//             </tr>
//           </thead>
//           <tbody>
//             {rows.map((r, i) => (
//               <tr key={r.id} aria-label={`Line item ${i + 1}`} className={cx('border-t border-line-soft', !r.productName.trim() && error && 'bg-danger-50/40')}>
//                 <td className={cx(cell, 'pt-4 text-center text-xs font-bold text-muted')}>{i + 1}</td>
//                 <td className={cell}>
//                   <ServiceCombobox label={`Item ${i + 1} name`} value={r.productName} serviceId={r.serviceId} services={services} categories={serviceCategories}
//                     invalid={!r.productName.trim() && !!error}
//                     onType={(text) => setRow(i, { productName: text, serviceId: null })}
//                     onPickService={(s) => setRow(i, fromService(s))}
//                     onCreateService={(name) => setServiceModal({ index: i, initial: { name, rate: r.rate, description: r.description, taxable: r.tax } })} />
//                   <div className="mt-1 flex items-center gap-1.5 pl-0.5 text-xs text-muted">
//                     {r.productName.trim() && <span className={cx('rounded px-1.5 py-0.5 font-semibold', r.serviceId ? 'bg-brand-100 text-brand-800' : 'bg-subtle')}>{r.serviceId ? 'Service' : 'Custom'}</span>}
//                     {r.description && <span className="line-clamp-1">{r.description}</span>}
//                   </div>
//                 </td>
//                 <td className={cell}><input aria-label={`Item ${i + 1} rate`} type="number" min="0" step="0.01" className={numInput} value={r.rate} onChange={(e) => setRow(i, { rate: e.target.value })} /></td>
//                 <td className={cell}><input aria-label={`Item ${i + 1} quantity`} type="number" min="1" className={numInput} value={r.qty} onChange={(e) => setRow(i, { qty: e.target.value })} /></td>
//                 <td className={cx(cell, 'pt-4 text-right font-semibold')} data-testid={`amount-${i + 1}`}>{money(rowAmount(r))}</td>
//                 <td className={cx(cell, 'pt-3.5 text-center')}><input type="checkbox" checked={!!r.tax} onChange={(e) => setRow(i, { tax: e.target.checked })} className="h-4 w-4 accent-brand-600" aria-label={`Tax item ${i + 1}`} /></td>
//                 <td className={cx(cell, 'pt-2')}>
//                   <RowActionsMenu label={`item ${i + 1}`}
//                     onEdit={() => setEditIndex(i)}
//                     onDuplicate={() => onDuplicate(i)}
//                     extra={[
//                       ...(r.serviceId && getService?.(r.serviceId) ? [{ label: 'Edit service', icon: FiEdit, onClick: () => setServiceModal({ index: i, service: getService(r.serviceId) }) }] : []),
//                       ...(!r.serviceId ? [{ label: 'Save as new service', icon: FiSave, onClick: () => setServiceModal({ index: i, initial: { name: r.productName, description: r.description, rate: r.rate, taxable: r.tax } }) }] : []),
//                     ]}
//                     onDelete={() => onDeleteRow(i)} />
//                 </td>
//               </tr>
//             ))}
//             {rows.length === 0 && <tr><td colSpan={7} className="px-3 py-8 text-center text-muted">No line items yet.</td></tr>}
//           </tbody>
//         </table>
//       </div>

//       <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
//         <button type="button" onClick={onAddRow} className="btn self-start border border-dashed border-line-strong bg-surface text-brand-600 hover:bg-subtle"><FiPlus aria-hidden="true" /> Add line item</button>

//         {/* Summary */}
//         <section aria-label={summaryTitle} className="w-full rounded-lg bg-subtle p-4 lg:max-w-sm">
//           <h3 className="mb-3 font-semibold">{summaryTitle}</h3>
//           <dl className="flex flex-col gap-2 text-sm">
//             <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="font-semibold" data-testid="subtotal">{money(subtotal)}</dd></div>
//             <div className="flex items-center justify-between gap-3">
//               <dt><label htmlFor="tax-rate" className="text-muted">Tax rate (%)</label></dt>
//               <dd><input id="tax-rate" type="number" min="0" max="100" step="0.01" className="input min-h-[34px] w-24 text-right text-sm" value={taxRate} onChange={(e) => onTaxRateChange(e.target.value)} /></dd>
//             </div>
//             <div className="flex justify-between"><dt className="text-muted">Tax</dt><dd className="font-semibold" data-testid="tax-total">{money(taxTotal)}</dd></div>
//             <div className="mt-1 flex justify-between border-t border-line pt-2 text-base"><dt className="font-bold">Total</dt><dd className="font-bold" data-testid="total">{money(totalAmount)}</dd></div>
//           </dl>
//         </section>
//       </div>

//       {editIndex !== null && rows[editIndex] && (
//         <LineItemModal row={rows[editIndex]} number={editIndex + 1} onClose={() => setEditIndex(null)}
//           onSave={(row) => { setRow(editIndex, row); setEditIndex(null); }} />
//       )}
//       {serviceModal && (
//         <ServiceModal service={serviceModal.service || null} initial={serviceModal.initial} onClose={() => setServiceModal(null)}
//           onSaved={(s) => { setRow(serviceModal.index, fromService(s)); setServiceModal(null); }} />
//       )}
//     </div>
//   );
// }

import { useState } from 'react';
import { FiEdit, FiPlus, FiSave } from 'react-icons/fi';
import RowActionsMenu from './RowActionsMenu';
import { cx } from './ui';
import LineItemModal from './LineItemModal';
import ServiceCombobox from './Servicecombobox';
import ServiceModal from './ServiceModal';
import { useData } from '../context/DataContext';
import { calcTotals, money, newRow, rowAmount } from '../data/invoiceTemplates';

/**
 * Line items (table) + summary for an invoice.
 * The Item field is type-to-search: pick a service (DataContext), keep what you typed as a custom item,
 * or create a new service with that name (opens a modal).
 * Props: rows · onChange(rows) · taxRate · onTaxRateChange(rate) · error
 */
export default function LineItemsAndSummary({ rows, onChange, taxRate, onTaxRateChange, error, hideHeading = false,
  lineItemsTitle = 'Line items', lineItemsSubtitle = 'Client-facing itemized list of products and services', summaryTitle = 'Summary' }) {
  const { services = [], serviceCategories = [], getService } = useData();
  const [serviceModal, setServiceModal] = useState(null);   // { index, service?, initial? }
  const [editIndex, setEditIndex] = useState(null);
  const { subtotal, taxTotal, totalAmount } = calcTotals(rows, taxRate);

  const setRow = (i, changes) => onChange(rows.map((r, j) => (j === i ? { ...r, ...changes } : r)));
  const fromService = (s) => ({ serviceId: s.id, productName: s.name, description: s.description || '', rate: Number(s.rate) || 0, tax: !!s.taxable });
  const onAddRow = () => onChange([...rows, newRow()]);
  const onDuplicate = (i) => { const list = [...rows]; list.splice(i + 1, 0, { ...rows[i], id: newRow().id }); onChange(list); };
  const onDeleteRow = (i) => onChange(rows.filter((_, j) => j !== i));
  const cell = 'px-2 py-2 align-top';
  const numInput = 'min-h-[38px] w-full rounded border border-line-strong bg-surface px-2 text-right text-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/30';

  return (
    <div className="flex flex-col gap-4">
      {!hideHeading && (
        <div>
          <h2 className="text-lg font-semibold">{lineItemsTitle}</h2>
          <p className="text-sm text-muted">{lineItemsSubtitle}</p>
        </div>
      )}
      {error && <p role="alert" className="rounded-md bg-danger-50 px-3 py-2 text-sm font-semibold text-danger-700">{error}</p>}

      <div className="overflow-x-auto rounded-lg border border-line">
        <table className="w-full min-w-[720px] border-collapse text-sm" aria-label="Line items">
          <thead>
            <tr className="bg-subtle text-left text-xs uppercase tracking-wide text-muted">
              <th className="w-10 px-2 py-2.5 text-center font-semibold">#</th>
              <th className="px-2 py-2.5 font-semibold">Item</th>
              <th className="w-28 px-2 py-2.5 text-right font-semibold">Rate</th>
              <th className="w-20 px-2 py-2.5 text-right font-semibold">Qty</th>
              <th className="w-28 px-2 py-2.5 text-right font-semibold">Amount</th>
              <th className="w-14 px-2 py-2.5 text-center font-semibold">Tax</th>
              <th className="w-12 px-2 py-2.5"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} aria-label={`Line item ${i + 1}`} className={cx('border-t border-line-soft', !r.productName.trim() && error && 'bg-danger-50/40')}>
                <td className={cx(cell, 'pt-4 text-center text-xs font-bold text-muted')}>{i + 1}</td>
                <td className={cell}>
                  <ServiceCombobox label={`Item ${i + 1} name`} value={r.productName} serviceId={r.serviceId} services={services} categories={serviceCategories}
                    invalid={!r.productName.trim() && !!error}
                    onType={(text) => setRow(i, { productName: text, serviceId: null })}
                    onPickService={(s) => setRow(i, fromService(s))}
                    onCreateService={(name) => setServiceModal({ index: i, initial: { name, rate: r.rate, description: r.description, taxable: r.tax } })} />
                  <div className="mt-1 flex items-center gap-1.5 pl-0.5 text-xs text-muted">
                    {r.productName.trim() && <span className={cx('rounded px-1.5 py-0.5 font-semibold', r.serviceId ? 'bg-brand-100 text-brand-800' : 'bg-subtle')}>{r.serviceId ? 'Service' : 'Custom'}</span>}
                    {r.description && <span className="line-clamp-1">{r.description}</span>}
                  </div>
                </td>
                <td className={cell}><input aria-label={`Item ${i + 1} rate`} type="number" min="0" step="0.01" className={numInput} value={r.rate} onChange={(e) => setRow(i, { rate: e.target.value })} /></td>
                <td className={cell}><input aria-label={`Item ${i + 1} quantity`} type="number" min="1" className={numInput} value={r.qty} onChange={(e) => setRow(i, { qty: e.target.value })} /></td>
                <td className={cx(cell, 'pt-4 text-right font-semibold')} data-testid={`amount-${i + 1}`}>{money(rowAmount(r))}</td>
                <td className={cx(cell, 'pt-3.5 text-center')}><input type="checkbox" checked={!!r.tax} onChange={(e) => setRow(i, { tax: e.target.checked })} className="h-4 w-4 accent-brand-600" aria-label={`Tax item ${i + 1}`} /></td>
                <td className={cx(cell, 'pt-2')}>
                  <RowActionsMenu label={`item ${i + 1}`}
                    onEdit={() => setEditIndex(i)}
                    onDuplicate={() => onDuplicate(i)}
                    extra={[
                      ...(r.serviceId && getService?.(r.serviceId) ? [{ label: 'Edit service', icon: FiEdit, onClick: () => setServiceModal({ index: i, service: getService(r.serviceId) }) }] : []),
                      ...(!r.serviceId ? [{ label: 'Save as new service', icon: FiSave, onClick: () => setServiceModal({ index: i, initial: { name: r.productName, description: r.description, rate: r.rate, taxable: r.tax } }) }] : []),
                    ]}
                    onDelete={() => onDeleteRow(i)} />
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={7} className="px-3 py-8 text-center text-muted">No line items yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <button type="button" onClick={onAddRow} className="btn self-start border border-dashed border-line-strong bg-surface text-brand-600 hover:bg-subtle"><FiPlus aria-hidden="true" /> Add line item</button>

        {/* Summary */}
        <section aria-label={summaryTitle} className="w-full rounded-lg border border-line bg-subtle/60 p-4 lg:max-w-xs">
          <h3 className="mb-3 font-semibold">{summaryTitle}</h3>
          <dl className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="font-semibold" data-testid="subtotal">{money(subtotal)}</dd></div>
            <div className="flex items-center justify-between gap-3">
              <dt><label htmlFor="tax-rate" className="text-muted">Tax rate (%)</label></dt>
              <dd><input id="tax-rate" type="number" min="0" max="100" step="0.01" className="input min-h-[34px] w-24 text-right text-sm" value={taxRate} onChange={(e) => onTaxRateChange(e.target.value)} /></dd>
            </div>
            <div className="flex justify-between"><dt className="text-muted">Tax</dt><dd className="font-semibold" data-testid="tax-total">{money(taxTotal)}</dd></div>
            <div className="mt-1 flex justify-between border-t border-line pt-2 text-base"><dt className="font-bold">Total</dt><dd className="font-bold" data-testid="total">{money(totalAmount)}</dd></div>
          </dl>
        </section>
      </div>

      {editIndex !== null && rows[editIndex] && (
        <LineItemModal row={rows[editIndex]} number={editIndex + 1} onClose={() => setEditIndex(null)}
          onSave={(row) => { setRow(editIndex, row); setEditIndex(null); }} />
      )}
      {serviceModal && (
        <ServiceModal service={serviceModal.service || null} initial={serviceModal.initial} onClose={() => setServiceModal(null)}
          onSaved={(s) => { setRow(serviceModal.index, fromService(s)); setServiceModal(null); }} />
      )}
    </div>
  );
}