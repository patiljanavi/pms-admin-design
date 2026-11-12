import { useState } from 'react';
import { BookmarkPlus, CircleAlert, ListPlus, Plus, Settings2 } from 'lucide-react';
import RowActionsMenu from './RowActionsMenu';
import { cx } from './ui';
import { Alert, AlertTitle } from './ui/alert';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Input } from './ui/input';
import { SectionHeading } from './page';
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

  const cell = 'px-2 py-2.5 align-top';
  const fit = 'flex h-9 items-center';                // lines static cells up with the h-9 inputs
  const numInput = 'h-9 text-right tabular-nums';
  const th = 'h-9 px-2 text-xs font-medium text-muted-foreground';

  return (
    <div className="flex flex-col gap-4">
      {!hideHeading && <SectionHeading title={lineItemsTitle} description={lineItemsSubtitle} />}
      {error && (
        <Alert variant="destructive">
          <CircleAlert aria-hidden="true" />
          <AlertTitle>{error}</AlertTitle>
        </Alert>
      )}

      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm" aria-label="Line items">
            <thead className="border-b bg-subtle">
              <tr className="text-left">
                <th className={cx(th, 'w-10 pl-3 text-center')}>#</th>
                <th className={th}>Item</th>
                <th className={cx(th, 'w-32 text-right')}>Rate</th>
                <th className={cx(th, 'w-20 text-right')}>Qty</th>
                <th className={cx(th, 'w-32 pr-3 text-right')}>Amount</th>
                <th className={cx(th, 'w-14 text-center')}>Tax</th>
                <th className={cx(th, 'w-12 pr-3')}><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((r, i) => {
                const invalid = !r.productName.trim() && !!error;
                return (
                  <tr key={r.id} aria-label={`Line item ${i + 1}`} className={cx('transition-colors', invalid ? 'bg-danger-50/50' : 'hover:bg-muted/30')}>
                    <td className={cx(cell, 'pl-3')}>
                      <span className={cx(fit, 'justify-center text-xs font-medium tabular-nums text-muted-foreground')}>{i + 1}</span>
                    </td>
                    <td className={cell}>
                      <ServiceCombobox label={`Item ${i + 1} name`} value={r.productName} serviceId={r.serviceId} services={services} categories={serviceCategories}
                        invalid={invalid}
                        onType={(text) => setRow(i, { productName: text, serviceId: null })}
                        onPickService={(s) => setRow(i, fromService(s))}
                        onCreateService={(name) => setServiceModal({ index: i, initial: { name, rate: r.rate, description: r.description, taxable: r.tax } })} />
                      {(r.productName.trim() || r.description) && (
                        <div className="mt-1.5 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                          {r.productName.trim() && <Badge variant={r.serviceId ? 'info' : 'neutral'} className="px-1.5 py-0 text-[11px]">{r.serviceId ? 'Service' : 'Custom'}</Badge>}
                          {r.description && <span className="line-clamp-1">{r.description}</span>}
                        </div>
                      )}
                    </td>
                    <td className={cell}>
                      <div className="relative">
                        <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-sm text-muted-foreground" aria-hidden="true">$</span>
                        <Input aria-label={`Item ${i + 1} rate`} type="number" min="0" step="0.01" className={cx(numInput, 'pl-6 pr-2.5')} value={r.rate} onChange={(e) => setRow(i, { rate: e.target.value })} />
                      </div>
                    </td>
                    <td className={cell}>
                      <Input aria-label={`Item ${i + 1} quantity`} type="number" min="1" className={cx(numInput, 'px-2.5')} value={r.qty} onChange={(e) => setRow(i, { qty: e.target.value })} />
                    </td>
                    <td className={cx(cell, 'pr-3')}>
                      <span className={cx(fit, 'justify-end font-medium tabular-nums text-foreground')} data-testid={`amount-${i + 1}`}>{money(rowAmount(r))}</span>
                    </td>
                    <td className={cell}>
                      <span className={cx(fit, 'justify-center')}>
                        <Checkbox checked={!!r.tax} onCheckedChange={(v) => setRow(i, { tax: v === true })} aria-label={`Tax item ${i + 1}`} />
                      </span>
                    </td>
                    <td className={cx(cell, 'pr-3')}>
                      <span className={cx(fit, 'justify-end')}>
                        <RowActionsMenu label={`item ${i + 1}`}
                          onEdit={() => setEditIndex(i)}
                          onDuplicate={() => onDuplicate(i)}
                          extra={[
                            ...(r.serviceId && getService?.(r.serviceId) ? [{ label: 'Edit service', icon: Settings2, onClick: () => setServiceModal({ index: i, service: getService(r.serviceId) }) }] : []),
                            ...(!r.serviceId ? [{ label: 'Save as new service', icon: BookmarkPlus, onClick: () => setServiceModal({ index: i, initial: { name: r.productName, description: r.description, rate: r.rate, taxable: r.tax } }) }] : []),
                          ]}
                          onDelete={() => onDeleteRow(i)} />
                      </span>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-10 text-center">
                    <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                      <span className="inline-flex size-9 items-center justify-center rounded-lg border bg-subtle" aria-hidden="true"><ListPlus className="size-4" /></span>
                      No line items yet.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t">
                <td colSpan={7} className="p-0">
                  <button type="button" onClick={onAddRow}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:bg-accent focus-visible:text-foreground focus-visible:outline-none">
                    <span className="inline-flex size-5 items-center justify-center rounded border border-dashed border-line-strong" aria-hidden="true"><Plus className="size-3.5" /></span>
                    Add line item
                  </button>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="flex justify-end">
        <section aria-label={summaryTitle} className="w-full overflow-hidden rounded-lg border bg-subtle/50 sm:max-w-xs">
          <h3 className="border-b px-4 py-2.5 text-sm font-semibold">{summaryTitle}</h3>
          <dl className="flex flex-col gap-2.5 px-4 py-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-medium tabular-nums" data-testid="subtotal">{money(subtotal)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt><label htmlFor="tax-rate" className="text-muted-foreground">Tax rate (%)</label></dt>
              <dd className="relative">
                <Input id="tax-rate" type="number" min="0" max="100" step="0.01" className="h-8 w-24 pr-6 text-right tabular-nums" value={taxRate} onChange={(e) => onTaxRateChange(e.target.value)} />
                <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-sm text-muted-foreground" aria-hidden="true">%</span>
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Tax</dt>
              <dd className="font-medium tabular-nums" data-testid="tax-total">{money(taxTotal)}</dd>
            </div>
            <div className="-mx-4 mt-0.5 flex items-baseline justify-between gap-3 border-t px-4 pt-3">
              <dt className="font-semibold">Total</dt>
              <dd className="text-lg font-semibold tracking-tight tabular-nums" data-testid="total">{money(totalAmount)}</dd>
            </div>
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
