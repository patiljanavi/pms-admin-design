import { useEffect, useMemo, useState } from 'react';
import { CalendarIcon, CreditCard } from 'lucide-react';
import { DrawerLayout, Field } from '../organizer/SettingsCard';
import { Drawer } from '../ui';
// shadcn components
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Calendar } from '../ui/calendar';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Textarea } from '../ui/textarea';
import { ToastBridge } from '../ui/sonner';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { money } from '../../data/invoiceTemplates';
import { PAYMENT_METHODS, cleanAmountInput, isSettleable, parseAmount, round2 } from '../../data/payments';
import { cn } from 'lib/utils';

const toDate = (iso) => (iso ? new Date(`${iso}T00:00:00`) : undefined);
const toIso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const showDate = (iso) => toDate(iso).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
const fmtDate = (iso) => (iso ? toDate(String(iso).slice(0, 10)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—');

/**
 * Offline Payment drawer (shadcn): record a payment made outside the system and settle invoices with it.
 * Fields: Account · Date · Amount · Payment Method · Description · Notify client by email · invoices to settle.
 * Rule: the amount must cover the whole balance of the selected invoices (no partial payments); extra = client credit.
 * Saves with DataContext.recordOfflinePayment. Props: accountId (preset) · onClose() · onSaved(payment) (optional)
 */
export default function OfflinePaymentDrawer({ accountId = '', onClose, onSaved }) {
  const { accounts = [], invoices = [], recordOfflinePayment } = useData();
  const { user } = useAuth() || {};
  const [form, setForm] = useState({ accountId, date: toIso(new Date()), amount: '', method: PAYMENT_METHODS[0], description: '', notifyClient: false, invoiceIds: [] });
  const [amountTouched, setAmountTouched] = useState(false);       // after typing, ticking invoices no longer changes the amount
  const [dateOpen, setDateOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState('');
  const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 2600); };
  const [closing, setClosing] = useState(false);                   // show the toast first, then close
  useEffect(() => { if (closing) onClose?.(); }, [closing]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (changes) => { setForm((f) => ({ ...f, ...changes })); setErrors((e) => { const n = { ...e }; Object.keys(changes).forEach((k) => delete n[k]); delete n.amount; return n; }); };

  // the account's unpaid invoices (sent / overdue), oldest due first
  const pending = useMemo(() => invoices.filter((i) => i.accountId === form.accountId && isSettleable(i))
    .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || '')), [invoices, form.accountId]);
  const selected = pending.filter((i) => form.invoiceIds.includes(i.id));
  const selectedTotal = round2(selected.reduce((s, i) => s + (Number(i.total) || 0), 0));
  const amount = parseAmount(form.amount);
  const credit = round2(amount - selectedTotal);
  const allChecked = pending.length > 0 && selected.length === pending.length;

  const pickAccount = (id) => { set({ accountId: id, invoiceIds: [] }); if (!amountTouched) set({ amount: '' }); };
  const setInvoices = (ids) => {
    const total = round2(pending.filter((i) => ids.includes(i.id)).reduce((s, i) => s + (Number(i.total) || 0), 0));
    set({ invoiceIds: ids, ...(amountTouched ? {} : { amount: total ? total.toFixed(2) : '' }) });
  };
  const toggle = (id) => setInvoices(form.invoiceIds.includes(id) ? form.invoiceIds.filter((x) => x !== id) : [...form.invoiceIds, id]);

  const handleSave = () => {
    if (closing) return;
    const e = {};
    if (!form.accountId) e.accountId = 'Choose an account.';
    if (!form.date) e.date = 'Choose the payment date.';
    if (amount <= 0) e.amount = 'Enter the amount received.';
    else if (amount < selectedTotal) e.amount = `The amount must cover the selected invoices (${money(selectedTotal)}). Partial payments are not supported.`;
    setErrors(e);
    if (Object.keys(e).length) { notify('Please fix the highlighted fields.'); return; }
    const rec = recordOfflinePayment({ ...form, amount }, user?.name || 'You');
    if (!rec) { notify('Couldn’t record the payment.'); return; }
    onSaved?.(rec);
    const paid = rec.invoiceIds.length;
    notify(`Payment of ${money(rec.amount)} recorded${paid ? ` · ${paid} invoice${paid === 1 ? '' : 's'} paid` : ''}`);
    setClosing(true);
  };

  return (
    <>
      <Drawer onClose={onClose} label="Offline Payment" width="max-w-[650px]">
        <DrawerLayout icon={CreditCard} title="Offline Payment" description="Record a payment made outside the portal and settle invoices with it" onClose={onClose}
          footer={<>
            <span className="mr-auto text-sm text-muted-foreground">Payment <span className="font-semibold tabular-nums text-foreground">{money(amount)}</span></span>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={closing}>{closing ? 'Saving…' : 'Save payment'}</Button>
          </>}>
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Account */}
              <Field label="Account" required error={errors.accountId}>
                <Select value={form.accountId || undefined} onValueChange={pickAccount}>
                  <SelectTrigger aria-label="Account" aria-invalid={!!errors.accountId} className={cn(errors.accountId && 'border-destructive')}><SelectValue placeholder="Account name, ID or email" /></SelectTrigger>
                  <SelectContent>{accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}{a.email ? ` — ${a.email}` : ''}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              {/* Date */}
              <Field label="Date" htmlFor="payment-date" required error={errors.date}>
                <Popover open={dateOpen} onOpenChange={setDateOpen}>
                  <PopoverTrigger asChild>
                    <Button id="payment-date" type="button" variant="outline" aria-label={`Date: ${form.date ? showDate(form.date) : 'not set'}`}
                      className={cn('w-full justify-start text-left font-normal', !form.date && 'text-muted-foreground')}>
                      <CalendarIcon aria-hidden="true" />{form.date ? showDate(form.date) : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={toDate(form.date)} defaultMonth={toDate(form.date)} onSelect={(d) => { if (d) { set({ date: toIso(d) }); setDateOpen(false); } }} initialFocus />
                  </PopoverContent>
                </Popover>
              </Field>
              {/* Amount */}
              <Field label="Amount" htmlFor="payment-amount" required error={errors.amount}>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground" aria-hidden="true">$</span>
                  <Input id="payment-amount" inputMode="decimal" placeholder="0.00" value={form.amount} aria-invalid={!!errors.amount}
                    onChange={(e) => { setAmountTouched(true); set({ amount: cleanAmountInput(e.target.value) }); }}
                    className={cn('pl-7 tabular-nums', errors.amount && 'border-destructive')} />
                </div>
              </Field>
              {/* Payment method */}
              <Field label="Payment Method">
                <Select value={form.method} onValueChange={(v) => set({ method: v })}>
                  <SelectTrigger aria-label="Payment Method"><SelectValue placeholder="Select Payment Mode" /></SelectTrigger>
                  <SelectContent>{PAYMENT_METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            </div>

            {/* Description */}
            <Field label="Description" htmlFor="payment-description">
              <Textarea id="payment-description" rows={3} placeholder="Enter description" value={form.description} onChange={(e) => set({ description: e.target.value })} className="resize-none" />
            </Field>

            {/* Notify */}
            <div className="flex items-center gap-2">
              <Checkbox id="payment-notify" checked={form.notifyClient} onCheckedChange={(v) => set({ notifyClient: !!v })} />
              <Label htmlFor="payment-notify" className="font-normal">Notify client by email</Label>
            </div>

            {/* Invoices to settle */}
            <section className="flex flex-col gap-3" aria-label="Invoices to settle">
              <div>
                <h3 className="text-base font-semibold">Settle invoices paid outside of your system</h3>
                <p className="mt-1 text-sm text-muted-foreground">Payments must cover the entire balance due. Partial payments are not supported.</p>
              </div>
              <div className="overflow-hidden rounded-lg border">
                <Table aria-label="Pending invoices">
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-10">
                        <Checkbox aria-label="Select all pending invoices" disabled={!pending.length}
                          checked={allChecked ? true : selected.length ? 'indeterminate' : false}
                          onCheckedChange={() => setInvoices(allChecked ? [] : pending.map((i) => i.id))} />
                      </TableHead>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Due</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!form.accountId ? (
                      <TableRow className="hover:bg-transparent"><TableCell colSpan={5} className="py-6 text-center text-muted-foreground">Choose an account to see its unpaid invoices.</TableCell></TableRow>
                    ) : !pending.length ? (
                      <TableRow className="hover:bg-transparent"><TableCell colSpan={5} className="py-6 text-center text-muted-foreground">No pending invoices</TableCell></TableRow>
                    ) : pending.map((inv) => {
                      const checked = form.invoiceIds.includes(inv.id);
                      return (
                        <TableRow key={inv.id} data-state={checked ? 'selected' : undefined} className="cursor-pointer" onClick={() => toggle(inv.id)}>
                          <TableCell onClick={(e) => e.stopPropagation()}><Checkbox aria-label={`Settle ${inv.number}`} checked={checked} onCheckedChange={() => toggle(inv.id)} /></TableCell>
                          <TableCell className="font-mono font-medium text-primary">{inv.number}</TableCell>
                          <TableCell className="whitespace-nowrap text-muted-foreground">{fmtDate(inv.issueDate)}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            {inv.state === 'overdue' ? <Badge variant="destructive" className="font-normal">Overdue · {fmtDate(inv.dueDate)}</Badge> : <span className="text-muted-foreground">{fmtDate(inv.dueDate)}</span>}
                          </TableCell>
                          <TableCell className="text-right font-medium tabular-nums">{money(inv.total)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Summary */}
              <dl className="grid grid-cols-2 gap-x-6 gap-y-1.5 rounded-lg bg-muted/40 px-4 py-3 text-sm sm:grid-cols-4" aria-label="Payment summary">
                <div><dt className="text-muted-foreground">Selected invoices</dt><dd className="font-medium tabular-nums" data-testid="sum-selected">{selected.length} · {money(selectedTotal)}</dd></div>
                <div><dt className="text-muted-foreground">Payment</dt><dd className="font-medium tabular-nums" data-testid="sum-amount">{money(amount)}</dd></div>
                <div><dt className="text-muted-foreground">Applied</dt><dd className="font-medium tabular-nums">{money(Math.min(amount, selectedTotal))}</dd></div>
                <div><dt className="text-muted-foreground">Client credit</dt><dd className={cn('font-medium tabular-nums', credit > 0 && 'text-emerald-600')} data-testid="sum-credit">{money(Math.max(0, credit))}</dd></div>
              </dl>
              {credit > 0 && amount > 0 && <p className="text-xs text-muted-foreground">{money(credit)} more than the selected invoices will be kept as client credit.</p>}
            </section>
          </div>
        </DrawerLayout>
      </Drawer>
      <ToastBridge message={toast} />
    </>
  );
}