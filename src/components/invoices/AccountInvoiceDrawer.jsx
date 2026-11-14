// // // import { useMemo, useState } from 'react';
// // // import { Braces, CalendarIcon, ChevronDown, Eye, FileText, Lock } from 'lucide-react';
// // // import LineItemsAndSummary from '../LineItemsAndSummary';
// // // import { buildInvoiceHtml } from './Invoicedocument';
// // // import TextEditor from '../TextEditor';

// // // // shadcn components — one file each in src/components/ui
// // // import { Button } from '../ui/button';
// // // import { Input } from '../ui/input';
// // // import { Textarea } from '../ui/textarea';
// // // import { Label } from '../ui/label';
// // // import { Badge } from '../ui/badge';
// // // import { Switch } from '../ui/switch';
// // // import { Separator } from '../ui/separator';
// // // import { Calendar } from '../ui/calendar';
// // // import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
// // // import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
// // // import {
// // //   DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger,
// // // } from '../ui/dropdown-menu';
// // // import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '../ui/sheet';
// // // import {
// // //   AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
// // // } from '../ui/alert-dialog';

// // // import { useData } from '../../context/DataContext';
// // // import { TEAM_MEMBERS } from '../../data/sampleData';
// // // import { accountShortcuts } from '../../data/shortcodes';
// // // import { PAYMENT_OPTIONS, calcTotals, money } from '../../data/invoiceTemplates';
// // // import { today } from '../../data/accountinvoices';
// // // import { fillShortcodes } from '../../data/accountChats';

// // // const DESCRIPTION_LIMIT = 4000;
// // // const NONE = '__none';
// // // const cn = (...c) => c.filter(Boolean).join(' ');
// // // const plusDays = (d, n) => new Date(new Date(`${d}T00:00:00`).getTime() + n * 86400000).toISOString().slice(0, 10);
// // // /* 'YYYY-MM-DD' ⇄ Date in local time */
// // // const toDate = (iso) => (iso ? new Date(`${iso}T00:00:00`) : undefined);
// // // const toIso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
// // // const showDate = (iso) => toDate(iso).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });

// // // /* ---------- invoice form helpers (kept here, so this file works with any version of data/accountinvoices) ---------- */
// // // let seq = 0;
// // // const rid = () => `row-${Date.now().toString(36)}${(seq += 1).toString(36)}`;
// // // /** One line item (same shape as the invoice templates' rows). */
// // // const newLine = (data = {}) => ({ id: rid(), serviceId: null, productName: '', description: '', rate: 0, qty: 1, tax: false, isDiscount: false, ...data });
// // // /** An empty invoice form. */
// // // const emptyInvoice = () => ({
// // //   templateId: '', number: '', paymentMode: PAYMENT_OPTIONS[2], issueDate: today(), dueDate: '', teamMembers: [],
// // //   description: '', payWithCredits: false, emailInvoice: true, reminders: false, daysNextReminder: 3, numOfReminder: 2,
// // //   rows: [newLine()], taxRate: 0, clientNote: '', status: 'draft',
// // // });
// // // /** Copy an invoice template into the form (line items get new ids). */
// // // const fromInvoiceTemplate = (t) => ({
// // //   templateId: t.id,
// // //   paymentMode: t.paymentMode || PAYMENT_OPTIONS[2],
// // //   description: t.description || t.templatename || '',
// // //   payWithCredits: !!t.payUsingCredits,
// // //   emailInvoice: !!t.emailToClient,
// // //   reminders: !!t.invoiceReminders,
// // //   daysNextReminder: t.daysNextReminder || 3,
// // //   numOfReminder: t.numOfReminder || 2,
// // //   rows: (t.rows || []).map(({ id, ...r }) => newLine(r)),
// // //   taxRate: Number(t.taxRate) || 0,
// // //   clientNote: t.clientNote || '',
// // // });

// // // function Field({ label, htmlFor, error, hint, children, className }) {
// // //   return (
// // //     <div className={cn('grid gap-1.5', className)}>
// // //       <Label htmlFor={htmlFor} className="text-sm font-medium text-foreground">{label}</Label>
// // //       {children}
// // //       {error ? <p className="text-xs text-destructive">{error}</p> : hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
// // //     </div>
// // //   );
// // // }

// // // /** Date field: shadcn Popover + Calendar. */
// // // function DateField({ id, label, value, onChange, disabled, error }) {
// // //   const [open, setOpen] = useState(false);
// // //   return (
// // //     <Field label={label} htmlFor={id} error={error}>
// // //       <Popover open={open} onOpenChange={setOpen}>
// // //         <PopoverTrigger asChild>
// // //           <Button id={id} type="button" variant="outline" disabled={disabled} aria-label={`${label}: ${value ? showDate(value) : 'not set'}`}
// // //             className={cn('w-full justify-start text-left font-normal', !value && 'text-muted-foreground', error && 'border-destructive')}>
// // //             <CalendarIcon className="mr-2 h-4 w-4" aria-hidden="true" />{value ? showDate(value) : <span>Pick a date</span>}
// // //           </Button>
// // //         </PopoverTrigger>
// // //         <PopoverContent className="w-auto p-0" align="start">
// // //           <Calendar mode="single" selected={toDate(value)} defaultMonth={toDate(value)} onSelect={(d) => { if (d) { onChange(toIso(d)); setOpen(false); } }} initialFocus />
// // //         </PopoverContent>
// // //       </Popover>
// // //     </Field>
// // //   );
// // // }

// // // /** Team Member: pick several (DropdownMenu with checkboxes). */
// // // function TeamSelect({ value = [], onChange }) {
// // //   return (
// // //     <Field label="Team Member" htmlFor="inv-team">
// // //       <DropdownMenu>
// // //         <DropdownMenuTrigger asChild>
// // //           <Button id="inv-team" type="button" variant="outline" aria-label="Team Member" className="h-auto min-h-9 w-full justify-between font-normal">
// // //             <span className="flex flex-wrap gap-1">
// // //               {value.length ? value.map((m) => <Badge key={m} variant="secondary" className="font-normal">{m}</Badge>) : <span className="text-muted-foreground">Team Member</span>}
// // //             </span>
// // //             <ChevronDown className="h-4 w-4 opacity-50" aria-hidden="true" />
// // //           </Button>
// // //         </DropdownMenuTrigger>
// // //         <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)]">
// // //           {TEAM_MEMBERS.map((m) => (
// // //             <DropdownMenuCheckboxItem key={m.label} checked={value.includes(m.label)} onSelect={(e) => e.preventDefault()}
// // //               onCheckedChange={() => onChange(value.includes(m.label) ? value.filter((x) => x !== m.label) : [...value, m.label])}>
// // //               {m.label}
// // //             </DropdownMenuCheckboxItem>
// // //           ))}
// // //         </DropdownMenuContent>
// // //       </DropdownMenu>
// // //     </Field>
// // //   );
// // // }

// // // /** "Shortcodes" menu: inserts e.g. [ACCOUNT_NAME]. */
// // // function ShortcodeMenu({ onInsert }) {
// // //   return (
// // //     <DropdownMenu>
// // //       <DropdownMenuTrigger asChild>
// // //         <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs"><Braces className="mr-1 h-3.5 w-3.5" aria-hidden="true" />Shortcodes</Button>
// // //       </DropdownMenuTrigger>
// // //       <DropdownMenuContent align="end" className="max-h-72 w-60 overflow-y-auto">
// // //         {accountShortcuts.map((s, i) => (s.isBold || !s.value
// // //           ? <DropdownMenuLabel key={`h-${i}`} className="text-xs text-muted-foreground">{s.title}</DropdownMenuLabel>
// // //           : <DropdownMenuItem key={s.value} onSelect={() => onInsert(`[${s.value}]`)}>{s.title}</DropdownMenuItem>))}
// // //       </DropdownMenuContent>
// // //     </DropdownMenu>
// // //   );
// // // }

// // // /** Preview: the invoice as the client sees it. */
// // // function PreviewSheet({ invoice, account, onClose }) {
// // //   return (
// // //     <Sheet open onOpenChange={(o) => !o && onClose()}>
// // //       <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-3xl">
// // //         <SheetHeader className="border-b px-5 py-4">
// // //           <SheetTitle>Preview</SheetTitle>
// // //           <SheetDescription>{invoice.number}{account ? ` · ${account.name}` : ''}</SheetDescription>
// // //         </SheetHeader>
// // //         <iframe title="Invoice preview" srcDoc={buildInvoiceHtml(invoice, account)} className="w-full flex-1 bg-white" />
// // //       </SheetContent>
// // //     </Sheet>
// // //   );
// // // }

// // // /**
// // //  * Create / Edit Invoice drawer (shadcn Sheet).
// // //  * Fields: Account · Invoice Template (fills everything) · Invoice Number (auto) · Payment method · Date · Due date · Team Member ·
// // //  * Description (shortcodes, 4000) · Additional (credits / email / reminders) · Line items + Summary · Note to client.
// // //  * Props: accountId (preset) · invoice (edit) · nextNumber · onSave(form, { send }) · onClose()
// // //  */
// // // export default function AccountInvoiceDrawer({ accountId = '', invoice = null, nextNumber, onSave, onClose }) {
// // //   const { accounts = [], invoiceTemplates = [] } = useData();
// // //   const isEditMode = !!invoice;
// // //   const isPaid = invoice?.state === 'paid' || invoice?.status === 'paid';
// // //   const [form, setForm] = useState(() => (invoice
// // //     ? { ...emptyInvoice(), ...invoice, rows: invoice.rows?.length ? invoice.rows : [newLine({ productName: invoice.description || invoice.name || 'Services', rate: Number(invoice.total) || 0 })] }
// // //     : { ...emptyInvoice(), accountId, number: nextNumber, dueDate: plusDays(today(), 14) }));
// // //   const [initial] = useState(() => JSON.stringify(form));
// // //   const [errors, setErrors] = useState({});
// // //   const [preview, setPreview] = useState(false);
// // //   const [confirmClose, setConfirmClose] = useState(false);
// // //   const dirty = JSON.stringify(form) !== initial;
// // //   const set = (c) => { setForm((f) => ({ ...f, ...c })); setErrors((e) => { const n = { ...e }; Object.keys(c).forEach((k) => delete n[k]); return n; }); };
// // //   const account = accounts.find((a) => a.id === form.accountId);
// // //   const totals = useMemo(() => calcTotals(form.rows, form.taxRate), [form.rows, form.taxRate]);

// // //   const handleTemplateChange = (id) => {
// // //     const t = invoiceTemplates.find((x) => x.id === id);
// // //     if (!t) { set({ templateId: '' }); return; }
// // //     set(fromInvoiceTemplate(t));
// // //   };
// // //   const validate = () => {
// // //     const e = {};
// // //     if (!form.accountId) e.accountId = 'Choose an account.';
// // //     if (!form.rows.some((r) => (r.productName || '').trim())) e.rows = 'Add at least one line item.';
// // //     else if (!(totals.totalAmount > 0)) e.rows = 'The invoice total must be above $0.';
// // //     if (form.dueDate && form.issueDate && form.dueDate < form.issueDate) e.dueDate = 'Due date must be on or after the invoice date.';
// // //     setErrors(e);
// // //     return !Object.keys(e).length;
// // //   };
// // //   const handleSave = () => {
// // //     if (isPaid || !validate()) return;
// // //     onSave(form, { send: !isEditMode && form.emailInvoice });
// // //   };
// // //   const requestClose = () => (dirty ? setConfirmClose(true) : onClose());
// // //   const previewInvoice = { ...form, description: account ? fillShortcodes(form.description, account) : form.description };

// // //   return (
// // //     <>
// // //       <Sheet open onOpenChange={(o) => !o && requestClose()}>
// // //         <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-[760px]">
// // //           {/* Header (the ✕ is the Sheet's own close button) */}
// // //           <SheetHeader className="flex-row items-center gap-3 space-y-0 border-b px-5 py-4 pr-12">
// // //             <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-primary text-primary-foreground" aria-hidden="true"><FileText className="h-4 w-4" /></span>
// // //             <div className="flex-1">
// // //               <SheetTitle>{isEditMode ? 'Edit Invoice' : 'Create new Invoice'}</SheetTitle>
// // //               <SheetDescription className="sr-only">Account invoice</SheetDescription>
// // //             </div>
// // //             <Button type="button" variant="ghost" size="sm" className="text-primary hover:text-primary/80" onClick={() => setPreview(true)}><Eye className="mr-1 h-4 w-4" aria-hidden="true" />Preview</Button>
// // //           </SheetHeader>

// // //           <div className="flex-1 space-y-6 overflow-y-auto bg-muted/30 p-5">
// // //             {isPaid && (
// // //               <p role="note" className="flex items-center gap-2 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
// // //                 <Lock className="h-4 w-4" aria-hidden="true" />This invoice is paid, so it can’t be changed.
// // //               </p>
// // //             )}

// // //             {/* Account + template */}
// // //             <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
// // //               <Field label="Account name, ID or email *" htmlFor="inv-account" error={errors.accountId}>
// // //                 <Select value={form.accountId || undefined} onValueChange={(v) => set({ accountId: v })} disabled={isPaid}>
// // //                   <SelectTrigger id="inv-account" aria-label="Account" className={cn(errors.accountId && 'border-destructive')}><SelectValue placeholder="Select an account…" /></SelectTrigger>
// // //                   <SelectContent>
// // //                     {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name} · {a.id}{a.contacts?.[0]?.email || a.email ? ` · ${a.contacts?.[0]?.email || a.email}` : ''}</SelectItem>)}
// // //                   </SelectContent>
// // //                 </Select>
// // //               </Field>
// // //               <Field label="Invoice Template" htmlFor="inv-template" hint="Fills in the payment method, description, line items, tax and note.">
// // //                 <Select value={form.templateId || NONE} onValueChange={(v) => handleTemplateChange(v === NONE ? '' : v)} disabled={isPaid}>
// // //                   <SelectTrigger id="inv-template" aria-label="Invoice Template"><SelectValue placeholder="Invoice Template" /></SelectTrigger>
// // //                   <SelectContent>
// // //                     <SelectItem value={NONE}>Invoice Template</SelectItem>
// // //                     {invoiceTemplates.map((t) => <SelectItem key={t.id} value={t.id}>{t.templatename}</SelectItem>)}
// // //                   </SelectContent>
// // //                 </Select>
// // //               </Field>
// // //             </div>

// // //             {/* Number + payment */}
// // //             <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
// // //               <Field label="Invoice Number" htmlFor="inv-number" hint="Auto-generated invoice number">
// // //                 <Input id="inv-number" value={form.number} readOnly aria-readonly="true" className="bg-muted font-mono" />
// // //               </Field>
// // //               <Field label="Choose payment method" htmlFor="inv-pay">
// // //                 <Select value={form.paymentMode?.value} onValueChange={(v) => set({ paymentMode: PAYMENT_OPTIONS.find((o) => o.value === v) })} disabled={isPaid}>
// // //                   <SelectTrigger id="inv-pay" aria-label="Payment method"><SelectValue placeholder="Select Payment Mode" /></SelectTrigger>
// // //                   <SelectContent>{PAYMENT_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
// // //                 </Select>
// // //               </Field>
// // //             </div>

// // //             {/* Dates + team */}
// // //             <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
// // //               <DateField id="inv-date" label="Date" value={form.issueDate} onChange={(v) => set({ issueDate: v })} disabled={isPaid} />
// // //               <DateField id="inv-due" label="Due date" value={form.dueDate} onChange={(v) => set({ dueDate: v })} disabled={isPaid} error={errors.dueDate} />
// // //               <TeamSelect value={form.teamMembers || []} onChange={(v) => set({ teamMembers: v })} />
// // //             </div>

// // //             {/* Description */}
// // //             <div className="grid gap-1.5">
// // //               <div className="flex items-center justify-between">
// // //                 <Label htmlFor="inv-desc" className="text-sm font-medium text-foreground">Description</Label>
// // //                 <ShortcodeMenu onInsert={(code) => set({ description: `${form.description}${code}`.slice(0, DESCRIPTION_LIMIT) })} />
// // //               </div>
// // //               <Textarea id="inv-desc" rows={4} value={form.description} maxLength={DESCRIPTION_LIMIT} placeholder="Description" disabled={isPaid}
// // //                 onChange={(e) => set({ description: e.target.value.slice(0, DESCRIPTION_LIMIT) })} />
// // //               <p className="flex justify-between text-xs text-muted-foreground">
// // //                 <span>{account && form.description.includes('[') ? <>For {account.name}: <span className="font-medium text-foreground" data-testid="description-example">{fillShortcodes(form.description, account)}</span></> : ''}</span>
// // //                 <span>{form.description.length}/{DESCRIPTION_LIMIT} characters</span>
// // //               </p>
// // //             </div>

// // //             {/* Additional */}
// // //             <section aria-label="Additional" className="rounded-lg border bg-background p-4">
// // //               <h3 className="mb-2 text-base font-semibold">Additional</h3>
// // //               <div className="divide-y">
// // //                 {[['payWithCredits', 'pay-invoice', 'Pay invoice using client credits'], ['emailInvoice', 'email-invoice', 'Email invoice to client'], ['reminders', 'reminders', 'Reminders']].map(([key, id, label]) => (
// // //                   <div key={key} className="flex items-center justify-between gap-3 py-2.5">
// // //                     <Label htmlFor={id} className="cursor-pointer font-normal">{label}</Label>
// // //                     <Switch id={id} checked={!!form[key]} onCheckedChange={(v) => set({ [key]: v })} disabled={isPaid} />
// // //                   </div>
// // //                 ))}
// // //               </div>
// // //               {form.reminders && (
// // //                 <div className="mt-3 grid grid-cols-2 gap-3">
// // //                   <Field label="Days until next reminder" htmlFor="inv-days"><Input id="inv-days" type="number" min="1" value={form.daysNextReminder} onChange={(e) => set({ daysNextReminder: Number(e.target.value) })} /></Field>
// // //                   <Field label="Number of reminders" htmlFor="inv-count"><Input id="inv-count" type="number" min="1" value={form.numOfReminder} onChange={(e) => set({ numOfReminder: Number(e.target.value) })} /></Field>
// // //                 </div>
// // //               )}
// // //               {!isEditMode && <p className="mt-2 text-xs text-muted-foreground">{form.emailInvoice ? 'Saving sends the invoice to the client.' : 'Saved as a draft — send it later.'}</p>}
// // //             </section>

// // //             {/* Line items + summary */}
// // //             <section className="rounded-lg border bg-background p-4">
// // //               <LineItemsAndSummary rows={form.rows} onChange={(rows) => set({ rows })} taxRate={form.taxRate} onTaxRateChange={(taxRate) => set({ taxRate })}
// // //                 error={errors.rows} allowDiscount lineItemsTitle="Line items" lineItemsSubtitle="Client-facing itemized list of products and services" summaryTitle="Summary" />
// // //             </section>

// // //             {/* Note */}
// // //             <section>
// // //               <h3 className="mb-2 text-base font-semibold">Note to client</h3>
// // //               <TextEditor ariaLabel="Note to client" value={form.clientNote} onChange={(html) => set({ clientNote: html })} shortcuts={accountShortcuts} minHeight={120} />
// // //             </section>
// // //           </div>

// // //           <Separator />
// // //           <SheetFooter className="flex-row items-center justify-end gap-3 px-5 py-4">
// // //             <span className="mr-auto text-sm text-muted-foreground">Total <span className="font-semibold text-foreground">{money(totals.totalAmount)}</span></span>
// // //             <Button variant="outline" onClick={requestClose}>Cancel</Button>
// // //             <Button onClick={handleSave} disabled={isPaid}>{isEditMode ? 'Update Invoice' : 'Save Invoice'}</Button>
// // //           </SheetFooter>
// // //         </SheetContent>
// // //       </Sheet>

// // //       {/* Discard changes? */}
// // //       <AlertDialog open={confirmClose} onOpenChange={setConfirmClose}>
// // //         <AlertDialogContent>
// // //           <AlertDialogHeader>
// // //             <AlertDialogTitle>Discard changes?</AlertDialogTitle>
// // //             <AlertDialogDescription>This invoice hasn’t been saved.</AlertDialogDescription>
// // //           </AlertDialogHeader>
// // //           <AlertDialogFooter>
// // //             <AlertDialogCancel>Keep editing</AlertDialogCancel>
// // //             <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={onClose}>Discard</AlertDialogAction>
// // //           </AlertDialogFooter>
// // //         </AlertDialogContent>
// // //       </AlertDialog>

// // //       {preview && <PreviewSheet invoice={previewInvoice} account={account} onClose={() => setPreview(false)} />}
// // //     </>
// // //   );
// // // }

// // import { useMemo, useState } from 'react';
// // import { Braces, CalendarIcon, ChevronDown, Eye, FileText, Lock } from 'lucide-react';
// // import LineItemsAndSummary from '../LineItemsAndSummary';
// // import { buildInvoiceHtml } from './Invoicedocument';
// // import TextEditor from '../TextEditor';

// // // shadcn components — one file each in src/components/ui
// // import { Button } from '../ui/button';
// // import { Input } from '../ui/input';
// // import { Textarea } from '../ui/textarea';
// // import { Label } from '../ui/label';
// // import { Badge } from '../ui/badge';
// // import { Switch } from '../ui/switch';
// // import { Calendar } from '../ui/calendar';
// // import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
// // import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
// // import {
// //   DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger,
// // } from '../ui/dropdown-menu';
// // import { Drawer } from '../ui';
// // import SettingsCard, { DrawerLayout, Field } from '../organizer/SettingsCard';
// // import {
// //   AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
// // } from '../ui/alert-dialog';

// // import { useData } from '../../context/DataContext';
// // import { TEAM_MEMBERS } from '../../data/sampleData';
// // import { accountShortcuts } from '../../data/shortcodes';
// // import { PAYMENT_OPTIONS, calcTotals, money } from '../../data/invoiceTemplates';
// // import { today } from '../../data/accountinvoices';
// // import { fillShortcodes } from '../../data/accountChats';

// // const DESCRIPTION_LIMIT = 4000;
// // const NONE = '__none';
// // const cn = (...c) => c.filter(Boolean).join(' ');
// // const plusDays = (d, n) => new Date(new Date(`${d}T00:00:00`).getTime() + n * 86400000).toISOString().slice(0, 10);
// // /* 'YYYY-MM-DD' ⇄ Date in local time */
// // const toDate = (iso) => (iso ? new Date(`${iso}T00:00:00`) : undefined);
// // const toIso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
// // const showDate = (iso) => toDate(iso).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });

// // /* ---------- invoice form helpers (kept here, so this file works with any version of data/accountinvoices) ---------- */
// // let seq = 0;
// // const rid = () => `row-${Date.now().toString(36)}${(seq += 1).toString(36)}`;
// // /** One line item (same shape as the invoice templates' rows). */
// // const newLine = (data = {}) => ({ id: rid(), serviceId: null, productName: '', description: '', rate: 0, qty: 1, tax: false, isDiscount: false, ...data });
// // /** An empty invoice form. */
// // const emptyInvoice = () => ({
// //   templateId: '', number: '', paymentMode: PAYMENT_OPTIONS[2], issueDate: today(), dueDate: '', teamMembers: [],
// //   description: '', payWithCredits: false, emailInvoice: true, reminders: false, daysNextReminder: 3, numOfReminder: 2,
// //   rows: [newLine()], taxRate: 0, clientNote: '', status: 'draft',
// // });
// // /** Copy an invoice template into the form (line items get new ids). */
// // const fromInvoiceTemplate = (t) => ({
// //   templateId: t.id,
// //   paymentMode: t.paymentMode || PAYMENT_OPTIONS[2],
// //   description: t.description || t.templatename || '',
// //   payWithCredits: !!t.payUsingCredits,
// //   emailInvoice: !!t.emailToClient,
// //   reminders: !!t.invoiceReminders,
// //   daysNextReminder: t.daysNextReminder || 3,
// //   numOfReminder: t.numOfReminder || 2,
// //   rows: (t.rows || []).map(({ id, ...r }) => newLine(r)),
// //   taxRate: Number(t.taxRate) || 0,
// //   clientNote: t.clientNote || '',
// // });



// // /** Date field: shadcn Popover + Calendar. */
// // function DateField({ id, label, value, onChange, disabled, error }) {
// //   const [open, setOpen] = useState(false);
// //   return (
// //     <Field label={label} htmlFor={id} error={error}>
// //       <Popover open={open} onOpenChange={setOpen}>
// //         <PopoverTrigger asChild>
// //           <Button id={id} type="button" variant="outline" disabled={disabled} aria-label={`${label}: ${value ? showDate(value) : 'not set'}`}
// //             className={cn('w-full justify-start text-left font-normal', !value && 'text-muted-foreground', error && 'border-destructive')}>
// //             <CalendarIcon className="mr-2 h-4 w-4" aria-hidden="true" />{value ? showDate(value) : <span>Pick a date</span>}
// //           </Button>
// //         </PopoverTrigger>
// //         <PopoverContent className="w-auto p-0" align="start">
// //           <Calendar mode="single" selected={toDate(value)} defaultMonth={toDate(value)} onSelect={(d) => { if (d) { onChange(toIso(d)); setOpen(false); } }} initialFocus />
// //         </PopoverContent>
// //       </Popover>
// //     </Field>
// //   );
// // }

// // /** Team Member: pick several (DropdownMenu with checkboxes). */
// // function TeamSelect({ value = [], onChange }) {
// //   return (
// //     <Field label="Team Member" htmlFor="inv-team">
// //       <DropdownMenu>
// //         <DropdownMenuTrigger asChild>
// //           <Button id="inv-team" type="button" variant="outline" aria-label="Team Member" className="h-auto min-h-9 w-full justify-between font-normal">
// //             <span className="flex flex-wrap gap-1">
// //               {value.length ? value.map((m) => <Badge key={m} variant="secondary" className="font-normal">{m}</Badge>) : <span className="text-muted-foreground">Team Member</span>}
// //             </span>
// //             <ChevronDown className="h-4 w-4 opacity-50" aria-hidden="true" />
// //           </Button>
// //         </DropdownMenuTrigger>
// //         <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)]">
// //           {TEAM_MEMBERS.map((m) => (
// //             <DropdownMenuCheckboxItem key={m.label} checked={value.includes(m.label)} onSelect={(e) => e.preventDefault()}
// //               onCheckedChange={() => onChange(value.includes(m.label) ? value.filter((x) => x !== m.label) : [...value, m.label])}>
// //               {m.label}
// //             </DropdownMenuCheckboxItem>
// //           ))}
// //         </DropdownMenuContent>
// //       </DropdownMenu>
// //     </Field>
// //   );
// // }

// // /** "Shortcodes" menu: inserts e.g. [ACCOUNT_NAME]. */
// // function ShortcodeMenu({ onInsert }) {
// //   return (
// //     <DropdownMenu>
// //       <DropdownMenuTrigger asChild>
// //         <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs"><Braces className="mr-1 h-3.5 w-3.5" aria-hidden="true" />Shortcodes</Button>
// //       </DropdownMenuTrigger>
// //       <DropdownMenuContent align="end" className="max-h-72 w-60 overflow-y-auto">
// //         {accountShortcuts.map((s, i) => (s.isBold || !s.value
// //           ? <DropdownMenuLabel key={`h-${i}`} className="text-xs text-muted-foreground">{s.title}</DropdownMenuLabel>
// //           : <DropdownMenuItem key={s.value} onSelect={() => onInsert(`[${s.value}]`)}>{s.title}</DropdownMenuItem>))}
// //       </DropdownMenuContent>
// //     </DropdownMenu>
// //   );
// // }

// // /**
// //  * Preview: the invoice as the client sees it.
// //  * Uses the same custom Drawer layout as the organizer drawer.
// //  */
// // function PreviewDrawer({ invoice, account, onClose }) {
// //   return (
// //     <Drawer onClose={onClose} label="Invoice Preview" width="max-w-3xl">
// //       <DrawerLayout
// //         title="Preview"
// //         description={`${invoice.number}${account ? ` · ${account.name}` : ''}`}
// //         onClose={onClose}
// //       >
// //         <iframe
// //           title="Invoice preview"
// //           srcDoc={buildInvoiceHtml(invoice, account)}
// //           className="h-full min-h-[75vh] w-full bg-white"
// //         />
// //       </DrawerLayout>
// //     </Drawer>
// //   );
// // }

// // /**
// //  * Create / Edit Invoice drawer (custom Drawer, matching CreateOrganizerDrawer).
// //  * Fields: Account · Invoice Template (fills everything) · Invoice Number (auto) · Payment method · Date · Due date · Team Member ·
// //  * Description (shortcodes, 4000) · Additional (credits / email / reminders) · Line items + Summary · Note to client.
// //  * Props: accountId (preset) · invoice (edit) · nextNumber · onSave(form, { send }) · onClose()
// //  */
// // export default function AccountInvoiceDrawer({ accountId = '', invoice = null, nextNumber, onSave, onClose }) {
// //   const { accounts = [], invoiceTemplates = [] } = useData();
// //   const isEditMode = !!invoice;
// //   const isPaid = invoice?.state === 'paid' || invoice?.status === 'paid';
// //   const [form, setForm] = useState(() => (invoice
// //     ? { ...emptyInvoice(), ...invoice, rows: invoice.rows?.length ? invoice.rows : [newLine({ productName: invoice.description || invoice.name || 'Services', rate: Number(invoice.total) || 0 })] }
// //     : { ...emptyInvoice(), accountId, number: nextNumber, dueDate: plusDays(today(), 14) }));
// //   const [initial] = useState(() => JSON.stringify(form));
// //   const [errors, setErrors] = useState({});
// //   const [preview, setPreview] = useState(false);
// //   const [confirmClose, setConfirmClose] = useState(false);
// //   const dirty = JSON.stringify(form) !== initial;
// //   const set = (c) => { setForm((f) => ({ ...f, ...c })); setErrors((e) => { const n = { ...e }; Object.keys(c).forEach((k) => delete n[k]); return n; }); };
// //   const account = accounts.find((a) => a.id === form.accountId);
// //   const totals = useMemo(() => calcTotals(form.rows, form.taxRate), [form.rows, form.taxRate]);

// //   const handleTemplateChange = (id) => {
// //     const t = invoiceTemplates.find((x) => x.id === id);
// //     if (!t) { set({ templateId: '' }); return; }
// //     set(fromInvoiceTemplate(t));
// //   };
// //   const validate = () => {
// //     const e = {};
// //     if (!form.accountId) e.accountId = 'Choose an account.';
// //     if (!form.rows.some((r) => (r.productName || '').trim())) e.rows = 'Add at least one line item.';
// //     else if (!(totals.totalAmount > 0)) e.rows = 'The invoice total must be above $0.';
// //     if (form.dueDate && form.issueDate && form.dueDate < form.issueDate) e.dueDate = 'Due date must be on or after the invoice date.';
// //     setErrors(e);
// //     return !Object.keys(e).length;
// //   };
// //   const handleSave = () => {
// //     if (isPaid || !validate()) return;
// //     onSave(form, { send: !isEditMode && form.emailInvoice });
// //   };
// //   const requestClose = () => (dirty ? setConfirmClose(true) : onClose());
// //   const previewInvoice = { ...form, description: account ? fillShortcodes(form.description, account) : form.description };

// //   return (
// //     <>
// //       <Drawer
// //         onClose={requestClose}
// //         label={isEditMode ? 'Edit Invoice' : 'Create new Invoice'}
// //         width="max-w-[760px]"
// //       >
// //         <DrawerLayout
// //           icon={FileText}
// //           title={isEditMode ? 'Edit Invoice' : 'Create new Invoice'}
// //           description="Account invoice"
// //           onClose={requestClose}
// //           footer={
// //             <>
// //               <span className="mr-auto text-sm text-muted-foreground">
// //                 Total <span className="font-semibold text-foreground">{money(totals.totalAmount)}</span>
// //               </span>
// //               <Button variant="outline" onClick={requestClose}>Cancel</Button>
// //               <Button onClick={handleSave} disabled={isPaid}>
// //                 {isEditMode ? 'Update Invoice' : 'Save Invoice'}
// //               </Button>
// //             </>
// //           }
// //         >
// //           <div className="space-y-6">
// //             {isPaid && (
// //               <p role="note" className="flex items-center gap-2 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
// //                 <Lock className="h-4 w-4" aria-hidden="true" />This invoice is paid, so it can’t be changed.
// //               </p>
// //             )}

// //             {/* Account + template */}
// //             <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
// //               <Field label="Account name, ID or email *" htmlFor="inv-account" error={errors.accountId}>
// //                 <Select value={form.accountId || undefined} onValueChange={(v) => set({ accountId: v })} disabled={isPaid}>
// //                   <SelectTrigger id="inv-account" aria-label="Account" className={cn(errors.accountId && 'border-destructive')}><SelectValue placeholder="Select an account…" /></SelectTrigger>
// //                   <SelectContent>
// //                     {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name} · {a.id}{a.contacts?.[0]?.email || a.email ? ` · ${a.contacts?.[0]?.email || a.email}` : ''}</SelectItem>)}
// //                   </SelectContent>
// //                 </Select>
// //               </Field>
// //               <Field label="Invoice Template" htmlFor="inv-template" hint="Fills in the payment method, description, line items, tax and note.">
// //                 <div className="flex flex-col gap-2 sm:flex-row">
// //                   <Select value={form.templateId || NONE} onValueChange={(v) => handleTemplateChange(v === NONE ? '' : v)} disabled={isPaid}>
// //                     <SelectTrigger id="inv-template" aria-label="Invoice Template" className="flex-1">
// //                       <SelectValue placeholder="Invoice Template" />
// //                     </SelectTrigger>
// //                     <SelectContent>
// //                       <SelectItem value={NONE}>Invoice Template</SelectItem>
// //                       {invoiceTemplates.map((t) => <SelectItem key={t.id} value={t.id}>{t.templatename}</SelectItem>)}
// //                     </SelectContent>
// //                   </Select>
// //                   <Button type="button" variant="outline" onClick={() => setPreview(true)}>
// //                     <Eye aria-hidden="true" />
// //                     Preview Mode
// //                   </Button>
// //                 </div>
// //               </Field>
// //             </div>

// //             {/* Number + payment */}
// //             <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
// //               <Field label="Invoice Number" htmlFor="inv-number" hint="Auto-generated invoice number">
// //                 <Input id="inv-number" value={form.number} readOnly aria-readonly="true" className="bg-muted font-mono" />
// //               </Field>
// //               <Field label="Choose payment method" htmlFor="inv-pay">
// //                 <Select value={form.paymentMode?.value} onValueChange={(v) => set({ paymentMode: PAYMENT_OPTIONS.find((o) => o.value === v) })} disabled={isPaid}>
// //                   <SelectTrigger id="inv-pay" aria-label="Payment method"><SelectValue placeholder="Select Payment Mode" /></SelectTrigger>
// //                   <SelectContent>{PAYMENT_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
// //                 </Select>
// //               </Field>
// //             </div>

// //             {/* Dates + team */}
// //             <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
// //               <DateField id="inv-date" label="Date" value={form.issueDate} onChange={(v) => set({ issueDate: v })} disabled={isPaid} />
// //               <DateField id="inv-due" label="Due date" value={form.dueDate} onChange={(v) => set({ dueDate: v })} disabled={isPaid} error={errors.dueDate} />
// //               <TeamSelect value={form.teamMembers || []} onChange={(v) => set({ teamMembers: v })} />
// //             </div>

// //             {/* Description */}
// //             <div className="grid gap-1.5">
// //               <div className="flex items-center justify-between">
// //                 <Label htmlFor="inv-desc" className="text-sm font-medium text-foreground">Description</Label>
// //                 <ShortcodeMenu onInsert={(code) => set({ description: `${form.description}${code}`.slice(0, DESCRIPTION_LIMIT) })} />
// //               </div>
// //               <Textarea id="inv-desc" rows={4} value={form.description} maxLength={DESCRIPTION_LIMIT} placeholder="Description" disabled={isPaid}
// //                 onChange={(e) => set({ description: e.target.value.slice(0, DESCRIPTION_LIMIT) })} />
// //               <p className="flex justify-between text-xs text-muted-foreground">
// //                 <span>{account && form.description.includes('[') ? <>For {account.name}: <span className="font-medium text-foreground" data-testid="description-example">{fillShortcodes(form.description, account)}</span></> : ''}</span>
// //                 <span>{form.description.length}/{DESCRIPTION_LIMIT} characters</span>
// //               </p>
// //             </div>

// //             {/* Additional */}
// //             <section aria-label="Additional" className="rounded-lg border bg-background p-4">
// //               <h3 className="mb-2 text-base font-semibold">Additional</h3>
// //               <div className="divide-y">
// //                 {[['payWithCredits', 'pay-invoice', 'Pay invoice using client credits'], ['emailInvoice', 'email-invoice', 'Email invoice to client'], ['reminders', 'reminders', 'Reminders']].map(([key, id, label]) => (
// //                   <div key={key} className="flex items-center justify-between gap-3 py-2.5">
// //                     <Label htmlFor={id} className="cursor-pointer font-normal">{label}</Label>
// //                     <Switch id={id} checked={!!form[key]} onCheckedChange={(v) => set({ [key]: v })} disabled={isPaid} />
// //                   </div>
// //                 ))}
// //               </div>
// //               {form.reminders && (
// //                 <div className="mt-3 grid grid-cols-2 gap-3">
// //                   <Field label="Days until next reminder" htmlFor="inv-days"><Input id="inv-days" type="number" min="1" value={form.daysNextReminder} onChange={(e) => set({ daysNextReminder: Number(e.target.value) })} /></Field>
// //                   <Field label="Number of reminders" htmlFor="inv-count"><Input id="inv-count" type="number" min="1" value={form.numOfReminder} onChange={(e) => set({ numOfReminder: Number(e.target.value) })} /></Field>
// //                 </div>
// //               )}
// //               {!isEditMode && <p className="mt-2 text-xs text-muted-foreground">{form.emailInvoice ? 'Saving sends the invoice to the client.' : 'Saved as a draft — send it later.'}</p>}
// //             </section>

// //             {/* Line items + summary */}
// //             <section className="rounded-lg border bg-background p-4">
// //               <LineItemsAndSummary rows={form.rows} onChange={(rows) => set({ rows })} taxRate={form.taxRate} onTaxRateChange={(taxRate) => set({ taxRate })}
// //                 error={errors.rows} allowDiscount lineItemsTitle="Line items" lineItemsSubtitle="Client-facing itemized list of products and services" summaryTitle="Summary" />
// //             </section>

// //             {/* Note */}
// //             <section>
// //               <h3 className="mb-2 text-base font-semibold">Note to client</h3>
// //               <TextEditor ariaLabel="Note to client" value={form.clientNote} onChange={(html) => set({ clientNote: html })} shortcuts={accountShortcuts} minHeight={120} />
// //             </section>
// //           </div>

// //         </DrawerLayout>
// //       </Drawer>

// //       {/* Discard changes? */}
// //       <AlertDialog open={confirmClose} onOpenChange={setConfirmClose}>
// //         <AlertDialogContent>
// //           <AlertDialogHeader>
// //             <AlertDialogTitle>Discard changes?</AlertDialogTitle>
// //             <AlertDialogDescription>This invoice hasn’t been saved.</AlertDialogDescription>
// //           </AlertDialogHeader>
// //           <AlertDialogFooter>
// //             <AlertDialogCancel>Keep editing</AlertDialogCancel>
// //             <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={onClose}>Discard</AlertDialogAction>
// //           </AlertDialogFooter>
// //         </AlertDialogContent>
// //       </AlertDialog>

// //       {preview && <PreviewDrawer invoice={previewInvoice} account={account} onClose={() => setPreview(false)} />}
// //     </>
// //   );
// // }

// import { useMemo, useState } from 'react';
// import { Bell, CalendarIcon, Eye, Lock, Mail, Receipt, Wallet } from 'lucide-react';
// import MultiSelect from '../MultiSelect';
// import ShortcodeTextField from '../ShortcodeTextField';
// import LineItemsAndSummary from '../LineItemsAndSummary';
// import TextEditor from '../TextEditor';
// import InvoicePreview from '../InvoicePreview';
// import SettingsCard, { DrawerLayout, Field } from '../organizer/SettingsCard';
// import { printInvoice } from './Invoicedocument';
// import { Avatar, Drawer, initials } from '../ui';
// import { Button } from '../ui/button';
// import { Input } from '../ui/input';
// import { Calendar } from '../ui/calendar';
// import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
// import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from '../ui/select';
// import {
//   AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
// } from '../ui/alert-dialog';
// import { cn } from 'lib/utils';
// import { useData } from '../../context/DataContext';
// import { TEAM_MEMBERS } from '../../data/sampleData';
// import { accountShortcuts } from '../../data/shortcodes';
// import { PAYMENT_OPTIONS, calcTotals, money } from '../../data/invoiceTemplates';
// import { today } from '../../data/accountinvoices';
// import { fillShortcodes } from '../../data/accountChats';

// const NONE = '__none';
// const DESCRIPTION_LIMIT = 4000;
// const plusDays = (d, n) => new Date(new Date(`${d}T00:00:00`).getTime() + n * 86400000).toISOString().slice(0, 10);
// /* 'YYYY-MM-DD' ⇄ Date in local time */
// const toDate = (iso) => (iso ? new Date(`${iso}T00:00:00`) : undefined);
// const toIso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
// const showDate = (iso) => toDate(iso).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });

// /* ---------- invoice form helpers (here, so this file works with any version of data/accountinvoices) ---------- */
// let seq = 0;
// const newLine = (data = {}) => ({ id: `row-${Date.now().toString(36)}${(seq += 1).toString(36)}`, serviceId: null, productName: '', description: '', rate: 0, qty: 1, tax: false, isDiscount: false, ...data });
// const emptyInvoice = () => ({
//   templateId: '', number: '', paymentMode: PAYMENT_OPTIONS[2], issueDate: today(), dueDate: '', teamMembers: [],
//   description: '', payWithCredits: false, emailInvoice: true, reminders: false, daysNextReminder: 3, numOfReminder: 2,
//   rows: [newLine()], taxRate: 0, clientNote: '', status: 'draft',
// });
// /** Picking a template fills the payment method, description, the three options, line items, tax and note. */
// const fromInvoiceTemplate = (t) => ({
//   templateId: t.id,
//   paymentMode: t.paymentMode || PAYMENT_OPTIONS[2],
//   description: t.description || t.templatename || '',
//   payWithCredits: !!t.payUsingCredits,
//   emailInvoice: !!t.emailToClient,
//   reminders: !!t.invoiceReminders,
//   daysNextReminder: t.daysNextReminder || 3,
//   numOfReminder: t.numOfReminder || 2,
//   rows: (t.rows || []).map(({ id, ...r }) => newLine(r)),
//   taxRate: Number(t.taxRate) || 0,
//   clientNote: t.clientNote || '',
// });

// /** Date field: shadcn Popover + Calendar. */
// function DateField({ id, label, value, onChange, disabled, error, required }) {
//   const [open, setOpen] = useState(false);
//   return (
//     <Field label={label} htmlFor={id} required={required} error={error}>
//       <Popover open={open} onOpenChange={setOpen}>
//         <PopoverTrigger asChild>
//           <Button id={id} type="button" variant="outline" disabled={disabled} aria-invalid={!!error} aria-label={`${label}: ${value ? showDate(value) : 'not set'}`}
//             className={cn('w-full justify-start text-left font-normal', !value && 'text-muted-foreground', error && 'border-danger-700')}>
//             <CalendarIcon aria-hidden="true" />{value ? showDate(value) : <span>Pick a date</span>}
//           </Button>
//         </PopoverTrigger>
//         <PopoverContent className="w-auto p-0" align="start">
//           <Calendar mode="single" selected={toDate(value)} defaultMonth={toDate(value)} onSelect={(d) => { if (d) { onChange(toIso(d)); setOpen(false); } }} initialFocus />
//         </PopoverContent>
//       </Popover>
//     </Field>
//   );
// }

// /**
//  * Create / Edit invoice drawer (same layout as Create organizer): Account · Invoice Template · Invoice Number · Payment method ·
//  * Date · Due date · Team Member · Description · Pay with credits · Email to client · Reminders · Line items + Summary · Note to client.
//  * Props: accountId (preset) · invoice (edit) · nextNumber · onSave(form, { send }) · onClose()
//  */
// export default function AccountInvoiceDrawer({ accountId = '', invoice = null, nextNumber, onSave, onClose }) {
//   const { accounts = [], invoiceTemplates = [] } = useData();
//   const isEditMode = !!invoice;
//   const isPaid = invoice?.state === 'paid' || invoice?.status === 'paid';
//   const [form, setForm] = useState(() => (invoice
//     ? { ...emptyInvoice(), ...invoice, rows: invoice.rows?.length ? invoice.rows : [newLine({ productName: invoice.description || invoice.name || 'Services', rate: Number(invoice.total) || 0 })] }
//     : { ...emptyInvoice(), accountId, number: nextNumber, dueDate: plusDays(today(), 14) }));
//   const [initial] = useState(() => JSON.stringify(form));
//   const [errors, setErrors] = useState({});
//   const [preview, setPreview] = useState(false);
//   const [confirmClose, setConfirmClose] = useState(false);
//   const set = (changes) => { setForm((f) => ({ ...f, ...changes })); setErrors((e) => { const n = { ...e }; Object.keys(changes).forEach((k) => delete n[k]); return n; }); };
//   const account = accounts.find((a) => a.id === form.accountId);
//   const totals = useMemo(() => calcTotals(form.rows, form.taxRate), [form.rows, form.taxRate]);

//   const handleTemplateChange = (id) => {
//     const t = invoiceTemplates.find((x) => x.id === id);
//     if (!t) { set({ templateId: '' }); return; }
//     set(fromInvoiceTemplate(t));
//   };
//   const validate = () => {
//     const e = {};
//     if (!form.accountId) e.accountId = 'Choose an account.';
//     if (!form.rows.some((r) => (r.productName || '').trim())) e.rows = 'Add at least one line item.';
//     else if (!(totals.totalAmount > 0)) e.rows = 'The invoice total must be above $0.';
//     if (form.dueDate && form.issueDate && form.dueDate < form.issueDate) e.dueDate = 'Due date must be on or after the invoice date.';
//     if (form.reminders && (!(Number(form.daysNextReminder) >= 1) || !(Number(form.numOfReminder) >= 1))) e.reminders = 'Enter at least 1 day and 1 reminder.';
//     setErrors(e);
//     return !Object.keys(e).length;
//   };
//   const handleSave = () => { if (!isPaid && validate()) onSave(form, { send: !isEditMode && form.emailInvoice }); };
//   const handleClose = () => (JSON.stringify(form) !== initial ? setConfirmClose(true) : onClose());
//   const title = isEditMode ? 'Edit Invoice' : 'Create new Invoice';
//   const previewInvoice = { ...form, description: account ? fillShortcodes(form.description, account) : form.description };

//   return (
//     <>
//       <Drawer onClose={handleClose} label={title} width="max-w-[760px]">
//         <DrawerLayout icon={Receipt} title={title} description={isEditMode ? `${form.number}${account ? ` · ${account.name}` : ''}` : 'Bill an account, or start from an invoice template'} onClose={handleClose}
//           footer={<>
//             <span className="mr-auto text-sm text-muted-foreground">Total <span className="font-semibold text-foreground">{money(totals.totalAmount)}</span></span>
//             <Button variant="ghost" className="text-primary" onClick={() => setPreview(true)}><Eye aria-hidden="true" /> Preview</Button>
//             <Button variant="outline" onClick={handleClose}>Cancel</Button>
//             <Button onClick={handleSave} disabled={isPaid}>{isEditMode ? 'Update Invoice' : 'Save Invoice'}</Button>
//           </>}>
//           <div className="flex flex-col gap-5">
//             {isPaid && (
//               <p role="note" className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm font-medium text-muted-foreground">
//                 <Lock className="h-4 w-4" aria-hidden="true" /> This invoice is paid, so it can’t be changed.
//               </p>
//             )}

//             {/* Account · Invoice Template */}
//             <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
//               <Field label="Account name, ID or email" required error={errors.accountId}>
//                 <Select value={form.accountId || undefined} onValueChange={(v) => set({ accountId: v })} disabled={isPaid}>
//                   <SelectTrigger aria-label="Account" aria-invalid={!!errors.accountId} className={cn(errors.accountId && 'border-danger-700')}>
//                     <SelectValue placeholder="Select an account" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name} · {a.id}{a.contacts?.[0]?.email || a.email ? ` · ${a.contacts?.[0]?.email || a.email}` : ''}</SelectItem>)}
//                   </SelectContent>
//                 </Select>
//               </Field>
//               <Field label="Invoice Template">
//                 <Select value={form.templateId ? String(form.templateId) : NONE} disabled={isPaid}
//                   onValueChange={(v) => handleTemplateChange(v === NONE ? '' : invoiceTemplates.find((t) => String(t.id) === v)?.id)}>
//                   <SelectTrigger aria-label="Invoice Template"><SelectValue placeholder="None" /></SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value={NONE}>None</SelectItem>
//                     {invoiceTemplates.length > 0 && <SelectSeparator />}
//                     {invoiceTemplates.map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.templatename}</SelectItem>)}
//                   </SelectContent>
//                 </Select>
//                 <p className="text-xs text-muted-foreground">Fills in the payment method, description, line items, tax and note.</p>
//               </Field>
//             </div>

//             {/* Invoice Number · Payment method */}
//             <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
//               <Field label="Invoice Number" htmlFor="inv-number">
//                 <Input id="inv-number" value={form.number} readOnly aria-readonly="true" className="bg-muted/50 font-mono" />
//                 <p className="text-xs text-muted-foreground">Auto-generated invoice number</p>
//               </Field>
//               <Field label="Choose payment method">
//                 <Select value={form.paymentMode?.value} onValueChange={(v) => set({ paymentMode: PAYMENT_OPTIONS.find((o) => o.value === v) })} disabled={isPaid}>
//                   <SelectTrigger aria-label="Payment method"><SelectValue placeholder="Select Payment Mode" /></SelectTrigger>
//                   <SelectContent>{PAYMENT_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
//                 </Select>
//               </Field>
//             </div>

//             {/* Date · Due date */}
//             <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
//               <DateField id="inv-date" label="Date" value={form.issueDate} onChange={(v) => set({ issueDate: v })} disabled={isPaid} />
//               <DateField id="inv-due" label="Due date" value={form.dueDate} onChange={(v) => set({ dueDate: v })} disabled={isPaid} error={errors.dueDate} />
//             </div>

//             {/* Team Member */}
//             <MultiSelect label="Team Member" placeholder="Team Member" options={TEAM_MEMBERS.map((m) => ({ value: m.label, label: m.label }))} value={form.teamMembers || []}
//               onChange={(v) => set({ teamMembers: v })}
//               renderOption={(o) => <span className="flex flex-1 items-center gap-2.5"><Avatar text={initials(o.label)} size="sm" /><span className="font-medium">{o.label}</span></span>} />

//             {/* Description */}
//             <div>
//               <ShortcodeTextField label="Description" value={form.description} onChange={(v) => set({ description: v.slice(0, DESCRIPTION_LIMIT) })} placeholder="Description"
//                 multiline rows={4} maxLength={DESCRIPTION_LIMIT} shortcuts={accountShortcuts} />
//               <p className="mt-1.5 flex justify-between gap-3 text-xs text-muted-foreground">
//                 <span>Shortcodes are filled in for the account{account && form.description.includes('[') ? <> — e.g. “<span className="font-medium text-foreground" data-testid="description-example">{fillShortcodes(form.description, account)}</span>”</> : '.'}</span>
//                 <span className="flex-none">{form.description.length}/{DESCRIPTION_LIMIT} characters</span>
//               </p>
//             </div>

//             {/* Additional */}
//             <div className="flex flex-col gap-3">
//               <h3 className="text-sm font-semibold text-foreground">Additional</h3>
//               <SettingsCard icon={Wallet} title="Pay invoice using client credits" help="Use the client’s credit balance first" checked={form.payWithCredits} onChange={(v) => set({ payWithCredits: v })} />
//               <SettingsCard icon={Mail} title="Email invoice to client" help={isEditMode ? 'Send the invoice by email' : 'Saving sends the invoice; turn off to save a draft'} checked={form.emailInvoice} onChange={(v) => set({ emailInvoice: v })} />
//               <SettingsCard icon={Bell} title="Reminders" help="Remind the client until the invoice is paid" checked={form.reminders} onChange={(v) => set({ reminders: v })}>
//                 <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
//                   <Field label="Days until next reminder" htmlFor="inv-days">
//                     <Input id="inv-days" type="number" min="1" aria-invalid={!!errors.reminders} value={form.daysNextReminder} onChange={(e) => set({ daysNextReminder: e.target.value, reminders: true })} />
//                   </Field>
//                   <Field label="No Of reminders" htmlFor="inv-count">
//                     <Input id="inv-count" type="number" min="1" aria-invalid={!!errors.reminders} value={form.numOfReminder} onChange={(e) => set({ numOfReminder: e.target.value, reminders: true })} />
//                   </Field>
//                   {errors.reminders && <p role="alert" className="text-xs text-danger-700 sm:col-span-2">{errors.reminders}</p>}
//                 </div>
//               </SettingsCard>
//             </div>

//             {/* Line items + Summary */}
//             <div className="rounded-lg border p-4">
//               <LineItemsAndSummary rows={form.rows} onChange={(rows) => set({ rows })} taxRate={form.taxRate} onTaxRateChange={(taxRate) => set({ taxRate })}
//                 error={errors.rows} allowDiscount lineItemsTitle="Line items" lineItemsSubtitle="Client-facing itemized list of products and services" summaryTitle="Summary" />
//             </div>

//             {/* Note to client */}
//             <Field label="Note to client">
//               <TextEditor ariaLabel="Note to client" value={form.clientNote} onChange={(html) => set({ clientNote: html })} shortcuts={accountShortcuts} minHeight={120} />
//             </Field>
//           </div>
//         </DrawerLayout>
//       </Drawer>

//       {/* Preview: your InvoicePreview modal (the same one as the invoice templates), for this account */}
//       {preview && (
//         <InvoicePreview
//           form={{
//             templatename: title,
//             paymentMode: form.paymentMode,
//             description: form.description,
//             rows: form.rows,
//             taxRate: form.taxRate,
//             payUsingCredits: form.payWithCredits,
//             clientNote: form.clientNote,
//             emailToClient: form.emailInvoice,
//             invoiceReminders: form.reminders,
//             daysNextReminder: form.daysNextReminder,
//             numOfReminder: form.numOfReminder,
//           }}
//           account={account}
//           number={form.number}
//           issueDate={form.issueDate}
//           dueDate={form.dueDate}
//           onPrint={() => printInvoice(previewInvoice, account)}
//           onClose={() => setPreview(false)}
//         />
//       )}

//       {/* Discard changes? */}
//       <AlertDialog open={confirmClose} onOpenChange={setConfirmClose}>
//         <AlertDialogContent>
//           <AlertDialogHeader>
//             <AlertDialogTitle>Discard changes?</AlertDialogTitle>
//             <AlertDialogDescription>This invoice hasn’t been saved.</AlertDialogDescription>
//           </AlertDialogHeader>
//           <AlertDialogFooter>
//             <AlertDialogCancel>Keep editing</AlertDialogCancel>
//             <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={onClose}>Discard</AlertDialogAction>
//           </AlertDialogFooter>
//         </AlertDialogContent>
//       </AlertDialog>
//     </>
//   );
// }


import { useMemo, useState } from 'react';
import { Bell, CalendarIcon, Eye, Lock, Mail, Receipt, Wallet } from 'lucide-react';
import MultiSelect from '../MultiSelect';
import ShortcodeTextField from '../ShortcodeTextField';
import LineItemsAndSummary from '../LineItemsAndSummary';
import TextEditor from '../TextEditor';
import InvoicePreview from '../InvoicePreview';
import SettingsCard, { DrawerLayout, Field } from '../organizer/SettingsCard';
import { printInvoice } from './Invoicedocument';
import { Avatar, Drawer, initials } from '../ui';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from '../ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../ui/alert-dialog';
import { cn } from 'lib/utils';
import { useData } from '../../context/DataContext';
import { accountShortcuts } from '../../data/shortcodes';
import { PAYMENT_OPTIONS, calcTotals, money } from '../../data/invoiceTemplates';
import { today } from '../../data/accountinvoices';
import { fillShortcodes } from '../../data/accountChats';

const NONE = '__none';
const DESCRIPTION_LIMIT = 4000;
const plusDays = (d, n) => new Date(new Date(`${d}T00:00:00`).getTime() + n * 86400000).toISOString().slice(0, 10);
/* 'YYYY-MM-DD' ⇄ Date in local time */
const toDate = (iso) => (iso ? new Date(`${iso}T00:00:00`) : undefined);
const toIso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const showDate = (iso) => toDate(iso).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });

/* ---------- invoice form helpers (here, so this file works with any version of data/accountinvoices) ---------- */
let seq = 0;
const newLine = (data = {}) => ({ id: `row-${Date.now().toString(36)}${(seq += 1).toString(36)}`, serviceId: null, productName: '', description: '', rate: 0, qty: 1, tax: false, isDiscount: false, ...data });
const emptyInvoice = () => ({
  templateId: '', number: '', paymentMode: PAYMENT_OPTIONS[2], issueDate: today(), dueDate: '', teamMembers: [],
  description: '', payWithCredits: false, emailInvoice: true, reminders: false, daysNextReminder: 3, numOfReminder: 2,
  rows: [newLine()], taxRate: 0, clientNote: '', status: 'draft',
});
/** Picking a template fills the payment method, description, the three options, line items, tax and note. */
const fromInvoiceTemplate = (t) => ({
  templateId: t.id,
  paymentMode: t.paymentMode || PAYMENT_OPTIONS[2],
  description: t.description || t.templatename || '',
  payWithCredits: !!t.payUsingCredits,
  emailInvoice: !!t.emailToClient,
  reminders: !!t.invoiceReminders,
  daysNextReminder: t.daysNextReminder || 3,
  numOfReminder: t.numOfReminder || 2,
  rows: (t.rows || []).map(({ id, ...r }) => newLine(r)),
  taxRate: Number(t.taxRate) || 0,
  clientNote: t.clientNote || '',
});

/** Date field: shadcn Popover + Calendar. */
function DateField({ id, label, value, onChange, disabled, error, required }) {
  const [open, setOpen] = useState(false);
  return (
    <Field label={label} htmlFor={id} required={required} error={error}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button id={id} type="button" variant="outline" disabled={disabled} aria-invalid={!!error} aria-label={`${label}: ${value ? showDate(value) : 'not set'}`}
            className={cn('w-full justify-start text-left font-normal', !value && 'text-muted-foreground', error && 'border-danger-700')}>
            <CalendarIcon aria-hidden="true" />{value ? showDate(value) : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={toDate(value)} defaultMonth={toDate(value)} onSelect={(d) => { if (d) { onChange(toIso(d)); setOpen(false); } }} initialFocus />
        </PopoverContent>
      </Popover>
    </Field>
  );
}

/**
 * Create / Edit invoice drawer (same layout as Create organizer): Account · Invoice Template · Invoice Number · Payment method ·
 * Date · Due date · Team Member · Description · Pay with credits · Email to client · Reminders · Line items + Summary · Note to client.
 * Props: accountId (preset) · invoice (edit) · nextNumber · onSave(form, { send }) · onClose()
 */
export default function AccountInvoiceDrawer({ accountId = '', invoice = null, nextNumber, onSave, onClose }) {
  const { accounts = [], invoiceTemplates = [], teamOptions = [] } = useData();
  const isEditMode = !!invoice;
  const isPaid = invoice?.state === 'paid' || invoice?.status === 'paid';
  const [form, setForm] = useState(() => (invoice
    ? { ...emptyInvoice(), ...invoice, rows: invoice.rows?.length ? invoice.rows : [newLine({ productName: invoice.description || invoice.name || 'Services', rate: Number(invoice.total) || 0 })] }
    : { ...emptyInvoice(), accountId, number: nextNumber, dueDate: plusDays(today(), 14) }));
  const [initial] = useState(() => JSON.stringify(form));
  const [errors, setErrors] = useState({});
  const [preview, setPreview] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const set = (changes) => { setForm((f) => ({ ...f, ...changes })); setErrors((e) => { const n = { ...e }; Object.keys(changes).forEach((k) => delete n[k]); return n; }); };
  const account = accounts.find((a) => a.id === form.accountId);
  const totals = useMemo(() => calcTotals(form.rows, form.taxRate), [form.rows, form.taxRate]);

  const handleTemplateChange = (id) => {
    const t = invoiceTemplates.find((x) => x.id === id);
    if (!t) { set({ templateId: '' }); return; }
    set(fromInvoiceTemplate(t));
  };
  const validate = () => {
    const e = {};
    if (!form.accountId) e.accountId = 'Choose an account.';
    if (!form.rows.some((r) => (r.productName || '').trim())) e.rows = 'Add at least one line item.';
    else if (!(totals.totalAmount > 0)) e.rows = 'The invoice total must be above $0.';
    if (form.dueDate && form.issueDate && form.dueDate < form.issueDate) e.dueDate = 'Due date must be on or after the invoice date.';
    if (form.reminders && (!(Number(form.daysNextReminder) >= 1) || !(Number(form.numOfReminder) >= 1))) e.reminders = 'Enter at least 1 day and 1 reminder.';
    setErrors(e);
    return !Object.keys(e).length;
  };
  const handleSave = () => { if (!isPaid && validate()) onSave(form, { send: !isEditMode && form.emailInvoice }); };
  const handleClose = () => (JSON.stringify(form) !== initial ? setConfirmClose(true) : onClose());
  const title = isEditMode ? 'Edit Invoice' : 'Create new Invoice';
  const previewInvoice = { ...form, description: account ? fillShortcodes(form.description, account) : form.description };

  return (
    <>
      <Drawer onClose={handleClose} label={title} width="max-w-[760px]">
        <DrawerLayout icon={Receipt} title={title} description={isEditMode ? `${form.number}${account ? ` · ${account.name}` : ''}` : 'Bill an account, or start from an invoice template'} onClose={handleClose}
          footer={<>
            <span className="mr-auto text-sm text-muted-foreground">Total <span className="font-semibold text-foreground">{money(totals.totalAmount)}</span></span>
            <Button variant="ghost" className="text-primary" onClick={() => setPreview(true)}><Eye aria-hidden="true" /> Preview</Button>
            <Button variant="outline" onClick={handleClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={isPaid}>{isEditMode ? 'Update Invoice' : 'Save Invoice'}</Button>
          </>}>
          <div className="flex flex-col gap-5">
            {isPaid && (
              <p role="note" className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm font-medium text-muted-foreground">
                <Lock className="h-4 w-4" aria-hidden="true" /> This invoice is paid, so it can’t be changed.
              </p>
            )}

            {/* Account · Invoice Template */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Account name, ID or email" required error={errors.accountId}>
                <Select value={form.accountId || undefined} onValueChange={(v) => set({ accountId: v })} disabled={isPaid}>
                  <SelectTrigger aria-label="Account" aria-invalid={!!errors.accountId} className={cn(errors.accountId && 'border-danger-700')}>
                    <SelectValue placeholder="Select an account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name} · {a.id}{a.contacts?.[0]?.email || a.email ? ` · ${a.contacts?.[0]?.email || a.email}` : ''}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Invoice Template">
                <Select value={form.templateId ? String(form.templateId) : NONE} disabled={isPaid}
                  onValueChange={(v) => handleTemplateChange(v === NONE ? '' : invoiceTemplates.find((t) => String(t.id) === v)?.id)}>
                  <SelectTrigger aria-label="Invoice Template"><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>None</SelectItem>
                    {invoiceTemplates.length > 0 && <SelectSeparator />}
                    {invoiceTemplates.map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.templatename}</SelectItem>)}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Fills in the payment method, description, line items, tax and note.</p>
              </Field>
            </div>

            {/* Invoice Number · Payment method */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Invoice Number" htmlFor="inv-number">
                <Input id="inv-number" value={form.number} readOnly aria-readonly="true" className="bg-muted/50 font-mono" />
                <p className="text-xs text-muted-foreground">Auto-generated invoice number</p>
              </Field>
              <Field label="Choose payment method">
                <Select value={form.paymentMode?.value} onValueChange={(v) => set({ paymentMode: PAYMENT_OPTIONS.find((o) => o.value === v) })} disabled={isPaid}>
                  <SelectTrigger aria-label="Payment method"><SelectValue placeholder="Select Payment Mode" /></SelectTrigger>
                  <SelectContent>{PAYMENT_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            </div>

            {/* Date · Due date */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DateField id="inv-date" label="Date" value={form.issueDate} onChange={(v) => set({ issueDate: v })} disabled={isPaid} />
              <DateField id="inv-due" label="Due date" value={form.dueDate} onChange={(v) => set({ dueDate: v })} disabled={isPaid} error={errors.dueDate} />
            </div>

            {/* Team Member */}
            <MultiSelect label="Team Member" placeholder="Team Member" options={teamOptions.map((m) => ({ value: m.label, label: m.label }))} value={form.teamMembers || []}
              onChange={(v) => set({ teamMembers: v })}
              renderOption={(o) => <span className="flex flex-1 items-center gap-2.5"><Avatar text={initials(o.label)} size="sm" /><span className="font-medium">{o.label}</span></span>} />

            {/* Description */}
            <div>
              <ShortcodeTextField label="Description" value={form.description} onChange={(v) => set({ description: v.slice(0, DESCRIPTION_LIMIT) })} placeholder="Description"
                multiline rows={4} maxLength={DESCRIPTION_LIMIT} shortcuts={accountShortcuts} />
              <p className="mt-1.5 flex justify-between gap-3 text-xs text-muted-foreground">
                <span>Shortcodes are filled in for the account{account && form.description.includes('[') ? <> — e.g. “<span className="font-medium text-foreground" data-testid="description-example">{fillShortcodes(form.description, account)}</span>”</> : '.'}</span>
                <span className="flex-none">{form.description.length}/{DESCRIPTION_LIMIT} characters</span>
              </p>
            </div>

            {/* Additional */}
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-foreground">Additional</h3>
              <SettingsCard icon={Wallet} title="Pay invoice using client credits" help="Use the client’s credit balance first" checked={form.payWithCredits} onChange={(v) => set({ payWithCredits: v })} />
              <SettingsCard icon={Mail} title="Email invoice to client" help={isEditMode ? 'Send the invoice by email' : 'Saving sends the invoice; turn off to save a draft'} checked={form.emailInvoice} onChange={(v) => set({ emailInvoice: v })} />
              <SettingsCard icon={Bell} title="Reminders" help="Remind the client until the invoice is paid" checked={form.reminders} onChange={(v) => set({ reminders: v })}>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Days until next reminder" htmlFor="inv-days">
                    <Input id="inv-days" type="number" min="1" aria-invalid={!!errors.reminders} value={form.daysNextReminder} onChange={(e) => set({ daysNextReminder: e.target.value, reminders: true })} />
                  </Field>
                  <Field label="No Of reminders" htmlFor="inv-count">
                    <Input id="inv-count" type="number" min="1" aria-invalid={!!errors.reminders} value={form.numOfReminder} onChange={(e) => set({ numOfReminder: e.target.value, reminders: true })} />
                  </Field>
                  {errors.reminders && <p role="alert" className="text-xs text-danger-700 sm:col-span-2">{errors.reminders}</p>}
                </div>
              </SettingsCard>
            </div>

            {/* Line items + Summary */}
            <div className="rounded-lg border p-4">
              <LineItemsAndSummary rows={form.rows} onChange={(rows) => set({ rows })} taxRate={form.taxRate} onTaxRateChange={(taxRate) => set({ taxRate })}
                error={errors.rows} allowDiscount lineItemsTitle="Line items" lineItemsSubtitle="Client-facing itemized list of products and services" summaryTitle="Summary" />
            </div>

            {/* Note to client */}
            <Field label="Note to client">
              <TextEditor ariaLabel="Note to client" value={form.clientNote} onChange={(html) => set({ clientNote: html })} shortcuts={accountShortcuts} minHeight={120} />
            </Field>
          </div>
        </DrawerLayout>
      </Drawer>

      {/* Preview: your InvoicePreview modal (the same one as the invoice templates), for this account */}
      {preview && (
        <InvoicePreview
          form={{
            templatename: title,
            paymentMode: form.paymentMode,
            description: form.description,
            rows: form.rows,
            taxRate: form.taxRate,
            payUsingCredits: form.payWithCredits,
            clientNote: form.clientNote,
            emailToClient: form.emailInvoice,
            invoiceReminders: form.reminders,
            daysNextReminder: form.daysNextReminder,
            numOfReminder: form.numOfReminder,
          }}
          account={account}
          number={form.number}
          issueDate={form.issueDate}
          dueDate={form.dueDate}
          onPrint={() => printInvoice(previewInvoice, account)}
          onClose={() => setPreview(false)}
        />
      )}

      {/* Discard changes? */}
      <AlertDialog open={confirmClose} onOpenChange={setConfirmClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>This invoice hasn’t been saved.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={onClose}>Discard</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
