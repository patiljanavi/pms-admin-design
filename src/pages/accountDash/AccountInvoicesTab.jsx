// // import { useEffect, useMemo, useState } from 'react';
// // import { useOutletContext } from 'react-router-dom';
// // import { CheckCircle2, ChevronLeft, ChevronRight, Download, FileText, MoreHorizontal, Pencil, Plus, Printer, RotateCcw, Send, Trash2, X } from 'lucide-react';
// // import { ToastBridge } from '../../components/ui/sonner';
// // // shadcn components — one file each in src/components/ui
// // import { Button } from '../../components/ui/button';
// // import { Badge } from '../../components/ui/badge';
// // import { Card, CardContent } from '../../components/ui/card';
// // import { Checkbox } from '../../components/ui/checkbox';
// // import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
// // import {
// //   DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
// // } from '../../components/ui/dropdown-menu';
// // import {
// //   AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
// // } from '../../components/ui/alert-dialog';

// // import AccountInvoiceDrawer from '../../components/invoices/AccountInvoiceDrawer';
// // import { useData } from '../../context/DataContext';
// // import { money } from '../../data/invoiceTemplates';
// // import { statusInfo } from '../../data/accountinvoices';

// // const PAGE_SIZE = 10;
// // const cn = (...c) => c.filter(Boolean).join(' ');
// // const fmt = (d) => (d ? new Date(`${String(d).slice(0, 10)}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—');
// // const BADGE = {
// //   draft: 'border-transparent bg-muted text-muted-foreground',
// //   sent: 'border-transparent bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
// //   overdue: 'border-transparent bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
// //   paid: 'border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
// // };

// // /**
// //  * Account → Invoices tab (shadcn): this account's invoices.
// //  * Create / Edit (AccountInvoiceDrawer) · Print · Download (PDF) · Send · Mark as paid · Delete · bulk actions · pagination.
// //  * Uses DataContext: invoices, nextInvoiceNumber, createInvoice, updateInvoice, deleteInvoices, setInvoiceStatus, printInvoice, downloadInvoice.
// //  */
// // export default function AccountInvoicesTab() {
// //   const { account } = useOutletContext();
// //   const { invoices = [], nextInvoiceNumber, createInvoice, updateInvoice, deleteInvoices, setInvoiceStatus, printInvoice, downloadInvoice } = useData();
// //   const mine = useMemo(() => invoices.filter((x) => x.accountId === account.id).sort((a, b) => (a.issueDate < b.issueDate ? 1 : -1)), [invoices, account.id]);
// //   const [drawer, setDrawer] = useState(null);          // { invoice? }
// //   const [confirm, setConfirm] = useState(null);        // invoices to delete
// //   const [selected, setSelected] = useState(() => new Set());
// //   const [page, setPage] = useState(1);
// //   const [toast, setToast] = useState('');
// //   const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 2600); };

// //   const pageCount = Math.max(1, Math.ceil(mine.length / PAGE_SIZE));
// //   const safePage = Math.min(page, pageCount);
// //   const rows = mine.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
// //   useEffect(() => { setSelected(new Set()); setPage(1); }, [account.id]);
// //   const chosen = mine.filter((x) => selected.has(x.id));
// //   const allOnPage = rows.length > 0 && rows.every((x) => selected.has(x.id));
// //   const someOnPage = rows.some((x) => selected.has(x.id));
// //   const toggle = (id) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
// //   const togglePage = () => setSelected((s) => { const n = new Set(s); rows.forEach((x) => (allOnPage ? n.delete(x.id) : n.add(x.id))); return n; });
// //   const unselect = (items) => setSelected((s) => { const n = new Set(s); items.forEach((x) => n.delete(x.id)); return n; });

// //   const sum = (list) => list.reduce((n, x) => n + x.total, 0);
// //   const stats = [
// //     ['Outstanding', money(sum(mine.filter((x) => x.state === 'sent' || x.state === 'overdue')))],
// //     ['Overdue', money(sum(mine.filter((x) => x.state === 'overdue')))],
// //     ['Paid', money(sum(mine.filter((x) => x.state === 'paid')))],
// //   ];
// //   const status = (items, s, msg) => { setInvoiceStatus(items, s); notify(msg); };
// //   const download = async (x) => notify((await downloadInvoice(x)) ? `Downloaded Invoice-${x.number}.pdf` : 'Couldn’t create the PDF. Try Print → Save as PDF.');
// //   const save = (form, { send }) => {
// //     const rec = drawer?.invoice ? updateInvoice(form) : createInvoice(form, { send });
// //     setDrawer(null);
// //     notify(drawer?.invoice ? `Updated ${rec.number}` : `${send ? 'Sent' : 'Saved draft'} ${rec.number}`);
// //   };

// //   return (
// //     <section className="space-y-4" aria-label="Invoices">
// //       <div className="flex flex-wrap items-end justify-between gap-3">
// //         <div className="grid flex-1 grid-cols-3 gap-3 sm:max-w-xl">
// //           {stats.map(([label, value]) => (
// //             <Card key={label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="text-lg font-semibold tabular-nums">{value}</p></CardContent></Card>
// //           ))}
// //         </div>
// //         <Button onClick={() => setDrawer({})}><Plus className="mr-1 h-4 w-4" aria-hidden="true" />Create invoice</Button>
// //       </div>

// //       <Card>
// //         {chosen.length > 0 && (
// //           <div role="region" aria-label="Selected rows" className="flex flex-wrap items-center gap-2 border-b bg-muted/50 px-4 py-2.5">
// //             <span className="mr-2 text-sm font-medium">{chosen.length} selected</span>
// //             <Button variant="outline" size="sm" onClick={() => { const unpaid = chosen.filter((x) => x.state !== 'paid'); status(unpaid, 'paid', `Marked ${unpaid.length} invoice${unpaid.length === 1 ? '' : 's'} as paid`); }}>
// //               <CheckCircle2 className="mr-1 h-4 w-4" aria-hidden="true" />Mark as paid
// //             </Button>
// //             <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setConfirm(chosen)}><Trash2 className="mr-1 h-4 w-4" aria-hidden="true" />Delete</Button>
// //             <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setSelected(new Set())}><X className="mr-1 h-4 w-4" aria-hidden="true" />Clear</Button>
// //           </div>
// //         )}

// //         <Table aria-label="Account invoices">
// //           <TableHeader>
// //             <TableRow>
// //               <TableHead className="w-10 pl-4"><Checkbox aria-label="Select all on this page" checked={allOnPage ? true : someOnPage ? 'indeterminate' : false} onCheckedChange={togglePage} /></TableHead>
// //               <TableHead>Invoice</TableHead>
// //               <TableHead>Description</TableHead>
// //               <TableHead>Issued</TableHead>
// //               <TableHead>Due</TableHead>
// //               <TableHead className="text-right">Amount</TableHead>
// //               <TableHead>Status</TableHead>
// //               <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead>
// //             </TableRow>
// //           </TableHeader>
// //           <TableBody>
// //             {rows.map((x) => (
// //               <TableRow key={x.id} data-state={selected.has(x.id) ? 'selected' : undefined}>
// //                 <TableCell className="pl-4"><Checkbox aria-label={`Select ${x.number}`} checked={selected.has(x.id)} onCheckedChange={() => toggle(x.id)} /></TableCell>
// //                 <TableCell><Button variant="link" className="h-auto p-0 font-mono font-semibold" onClick={() => setDrawer({ invoice: x })}>{x.number}</Button></TableCell>
// //                 <TableCell className="max-w-[280px]">
// //                   <div className="truncate" title={x.description}>{x.description}</div>
// //                   <div className="text-xs text-muted-foreground">{(x.rows || []).length} line item{(x.rows || []).length === 1 ? '' : 's'}</div>
// //                 </TableCell>
// //                 <TableCell className="whitespace-nowrap text-muted-foreground">{fmt(x.issueDate)}</TableCell>
// //                 <TableCell className={cn('whitespace-nowrap', x.state === 'overdue' ? 'font-medium text-destructive' : 'text-muted-foreground')}>{fmt(x.dueDate)}</TableCell>
// //                 <TableCell className="whitespace-nowrap text-right font-medium tabular-nums">{money(x.total)}</TableCell>
// //                 <TableCell><Badge variant="outline" className={BADGE[x.state]}>{statusInfo(x.state).label}</Badge></TableCell>
// //                 <TableCell>
// //                   <DropdownMenu>
// //                     <DropdownMenuTrigger asChild>
// //                       <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Actions for ${x.number}`}><MoreHorizontal className="h-4 w-4" aria-hidden="true" /></Button>
// //                     </DropdownMenuTrigger>
// //                     <DropdownMenuContent align="end">
// //                       <DropdownMenuItem onSelect={() => setDrawer({ invoice: x })}><Pencil className="mr-2 h-4 w-4" aria-hidden="true" />{x.state === 'paid' ? 'View' : 'Edit'}</DropdownMenuItem>
// //                       <DropdownMenuItem onSelect={() => printInvoice(x)}><Printer className="mr-2 h-4 w-4" aria-hidden="true" />Print</DropdownMenuItem>
// //                       <DropdownMenuItem onSelect={() => download(x)}><Download className="mr-2 h-4 w-4" aria-hidden="true" />Download</DropdownMenuItem>
// //                       {x.state === 'draft' && <DropdownMenuItem onSelect={() => status([x], 'sent', `Sent ${x.number}`)}><Send className="mr-2 h-4 w-4" aria-hidden="true" />Send</DropdownMenuItem>}
// //                       {x.state === 'paid'
// //                         ? <DropdownMenuItem onSelect={() => status([x], 'sent', `${x.number} marked as unpaid`)}><RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />Mark as unpaid</DropdownMenuItem>
// //                         : <DropdownMenuItem onSelect={() => status([x], 'paid', `${x.number} marked as paid`)}><CheckCircle2 className="mr-2 h-4 w-4" aria-hidden="true" />Mark as paid</DropdownMenuItem>}
// //                       <DropdownMenuSeparator />
// //                       <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => setConfirm([x])}><Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />Delete</DropdownMenuItem>
// //                     </DropdownMenuContent>
// //                   </DropdownMenu>
// //                 </TableCell>
// //               </TableRow>
// //             ))}
// //             {!mine.length && (
// //               <TableRow><TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
// //                 <span className="inline-flex items-center gap-2"><FileText className="h-4 w-4" aria-hidden="true" />No invoices for {account.name} yet.</span>
// //               </TableCell></TableRow>
// //             )}
// //           </TableBody>
// //         </Table>

// //         {mine.length > 0 && (
// //           <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm text-muted-foreground">
// //             <span data-testid="page-range">{(safePage - 1) * PAGE_SIZE + 1}–{Math.min(mine.length, safePage * PAGE_SIZE)} of {mine.length} invoices</span>
// //             <div className="flex items-center gap-1">
// //               <span className="mr-2">Page {safePage} of {pageCount}</span>
// //               <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(safePage - 1)} disabled={safePage === 1} aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></Button>
// //               <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(safePage + 1)} disabled={safePage === pageCount} aria-label="Next page"><ChevronRight className="h-4 w-4" /></Button>
// //             </div>
// //           </div>
// //         )}
// //       </Card>

// //       {drawer && (
// //         <AccountInvoiceDrawer accountId={account.id} invoice={drawer.invoice || null} nextNumber={nextInvoiceNumber} onClose={() => setDrawer(null)} onSave={save} />
// //       )}

// //       <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
// //         <AlertDialogContent>
// //           <AlertDialogHeader>
// //             <AlertDialogTitle>{confirm?.length === 1 ? `Delete ${confirm[0].number}?` : `Delete ${confirm?.length} invoices?`}</AlertDialogTitle>
// //             <AlertDialogDescription>The client will no longer see {confirm?.length === 1 ? 'this invoice' : 'these invoices'}. This can’t be undone.</AlertDialogDescription>
// //           </AlertDialogHeader>
// //           <ul className="max-h-40 list-disc overflow-y-auto pl-5 text-sm">{(confirm || []).map((x) => <li key={x.id}>{x.number} · {money(x.total)}</li>)}</ul>
// //           <AlertDialogFooter>
// //             <AlertDialogCancel>Cancel</AlertDialogCancel>
// //             <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
// //               onClick={() => { deleteInvoices(confirm); unselect(confirm); notify(`Deleted ${confirm.length} invoice${confirm.length === 1 ? '' : 's'}`); setConfirm(null); }}>
// //               {confirm?.length === 1 ? 'Delete invoice' : 'Delete invoices'}
// //             </AlertDialogAction>
// //           </AlertDialogFooter>
// //         </AlertDialogContent>
// //       </AlertDialog>

// //       <ToastBridge message={toast} />
// //     </section>
// //   );
// // }
// import { useEffect, useMemo, useState } from 'react';
// import { useOutletContext, useSearchParams } from 'react-router-dom';
// import {
//   Ban, CheckCircle2, ChevronLeft, ChevronRight, CreditCard, Download, FileText, HandCoins, MoreHorizontal, Pencil, Plus, Printer, Receipt, RotateCcw, Send, Trash2, Undo2, Wallet, X,
// } from 'lucide-react';
// import { ToastBridge } from '../../components/ui/sonner';
// import { SubTabs } from '../../components/TabNav';
// // shadcn components — one file each in src/components/ui
// import { Button } from '../../components/ui/button';
// import { Badge } from '../../components/ui/badge';
// import { Card, CardContent } from '../../components/ui/card';
// import { Checkbox } from '../../components/ui/checkbox';
// import { Modal } from '../../components/ui';
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
// import {
//   DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
// } from '../../components/ui/dropdown-menu';
// import {
//   AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
// } from '../../components/ui/alert-dialog';

// import AccountInvoiceDrawer from '../../components/invoices/AccountInvoiceDrawer';
// import OfflinePaymentDrawer from '../../components/invoices/OfflinePaymentDrawer';
// import { useAuth } from '../../context/AuthContext';
// import { useData } from '../../context/DataContext';
// import { money } from '../../data/invoiceTemplates';
// import { INVOICE_STATE_LABEL, PAYMENT_STATUS_LABEL, isSettleable, round2 } from '../../data/payments';

// const PAGE_SIZE = 10;
// const cn = (...c) => c.filter(Boolean).join(' ');
// const fmt = (d) => (d ? new Date(`${String(d).slice(0, 10)}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—');
// const BADGE = {
//   draft: 'border-transparent bg-muted text-muted-foreground',
//   sent: 'border-transparent bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
//   overdue: 'border-transparent bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
//   partial: 'border-transparent bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
//   paid: 'border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
// };
// const PAYMENT_BADGE = {
//   succeeded: 'border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
//   refunded: 'border-transparent bg-muted text-muted-foreground',
//   voided: 'border-transparent bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
// };
// const Dash = () => <span className="text-muted-foreground/60">—</span>;

// /** Simple pages of 10 (same as before): rows on this page + the pager. */
// function usePages(list, resetKey) {
//   const [page, setPage] = useState(1);
//   useEffect(() => { setPage(1); }, [resetKey]);
//   const pageCount = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
//   const safePage = Math.min(page, pageCount);
//   const rows = list.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
//   const pager = list.length > 0 && (
//     <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm text-muted-foreground">
//       <span data-testid="page-range">{(safePage - 1) * PAGE_SIZE + 1}–{Math.min(list.length, safePage * PAGE_SIZE)} of {list.length}</span>
//       <div className="flex items-center gap-1">
//         <span className="mr-2">Page {safePage} of {pageCount}</span>
//         <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(safePage - 1)} disabled={safePage === 1} aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></Button>
//         <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(safePage + 1)} disabled={safePage === pageCount} aria-label="Next page"><ChevronRight className="h-4 w-4" /></Button>
//       </div>
//     </div>
//   );
//   return { rows, pager };
// }

// /**
//  * Account Invoices tab with two child tabs (like the Workflow tab's Pipelines / Jobs):
//  *   Invoices — this account's invoices (?view=invoices, the default)
//  *   Payments — this account's payment history (?view=payments)
//  * Uses DataContext: invoices, payments, nextInvoiceNumber, createInvoice, updateInvoice, deleteInvoices, setInvoiceStatus,
//  * printInvoice, downloadInvoice, recordOfflinePayment (via OfflinePaymentDrawer), voidPayment.
//  */
// export default function AccountInvoicesTab() {
//   const { account } = useOutletContext();
//   const { invoices = [], payments = [] } = useData();
//   const [params, setParams] = useSearchParams();
//   const view = params.get('view') === 'payments' ? 'payments' : 'invoices';
//   const setView = (v) => setParams((prev) => { const n = new URLSearchParams(prev); n.set('view', v); return n; }, { replace: true });
//   const [toast, setToast] = useState('');
//   const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 2600); };

//   return (
//     <div className="flex flex-col gap-5">
//       {/* Child tabs (same style as every tab bar) */}
//       <SubTabs label="Invoices views" value={view} onChange={setView}
//         tabs={[
//           { key: 'invoices', label: 'Invoices', icon: Receipt, count: invoices.filter((x) => x.accountId === account.id).length },
//           { key: 'payments', label: 'Payments', icon: CreditCard, count: payments.filter((p) => p.accountId === account.id).length },
//         ]} />

//       {view === 'invoices'
//         ? <InvoicesView notify={notify} />
//         : <PaymentsView notify={notify} onShowInvoices={() => setView('invoices')} />}

//       <ToastBridge message={toast} />
//     </div>
//   );
// }

// /* ---------- Invoices (child tab 1): the account's invoices ---------- */
// function InvoicesView({ notify }) {
//   const { account } = useOutletContext();
//   const { invoices = [], nextInvoiceNumber, createInvoice, updateInvoice, deleteInvoices, setInvoiceStatus, printInvoice, downloadInvoice, creditOf } = useData();
//   const mine = useMemo(() => invoices.filter((x) => x.accountId === account.id).sort((a, b) => (a.issueDate < b.issueDate ? 1 : -1)), [invoices, account.id]);
//   const [drawer, setDrawer] = useState(null);          // { invoice? }
//   const [payDrawer, setPayDrawer] = useState(false);
//   const [paying, setPaying] = useState(null);          // invoice in the Pay invoice modal
//   const [confirm, setConfirm] = useState(null);        // invoices to delete
//   const [selected, setSelected] = useState(() => new Set());
//   const { rows, pager } = usePages(mine, account.id);
//   useEffect(() => { setSelected(new Set()); }, [account.id]);
//   const chosen = mine.filter((x) => selected.has(x.id));
//   const allOnPage = rows.length > 0 && rows.every((x) => selected.has(x.id));
//   const someOnPage = rows.some((x) => selected.has(x.id));
//   const toggle = (id) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
//   const togglePage = () => setSelected((s) => { const n = new Set(s); rows.forEach((x) => (allOnPage ? n.delete(x.id) : n.add(x.id))); return n; });
//   const unselect = (items) => setSelected((s) => { const n = new Set(s); items.forEach((x) => n.delete(x.id)); return n; });

//   const sumOf = (list, key) => list.reduce((n, x) => n + (Number(x[key]) || 0), 0);
//   const stats = [
//     ['Outstanding', money(sumOf(mine.filter((x) => x.state !== 'draft'), 'balance'))],
//     ['Overdue', money(sumOf(mine.filter((x) => x.state === 'overdue'), 'balance'))],
//     ['Paid', money(sumOf(mine, 'paid'))],
//     ['Client credit', money(creditOf ? creditOf(account.id) : 0)],
//   ];
//   const status = (items, s, msg) => { setInvoiceStatus(items, s); notify(msg); };
//   const download = async (x) => notify((await downloadInvoice(x)) ? `Downloaded Invoice-${x.number}.pdf` : 'Couldn’t create the PDF. Try Print → Save as PDF.');
//   const save = (form, { send }) => {
//     const rec = drawer?.invoice ? updateInvoice(form) : createInvoice(form, { send });
//     setDrawer(null);
//     notify(drawer?.invoice ? `Updated ${rec.number}` : `${send ? 'Sent' : 'Saved draft'} ${rec.number}`);
//   };

//   return (
//     <section role="tabpanel" aria-label="Invoices" className="space-y-4">
//       <div className="flex flex-wrap items-end justify-between gap-3">
//         <div className="grid flex-1 grid-cols-2 gap-3 sm:max-w-3xl sm:grid-cols-4">
//           {stats.map(([label, value]) => (
//             <Card key={label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="text-lg font-semibold tabular-nums" data-testid={`stat-${label}`}>{value}</p></CardContent></Card>
//           ))}
//         </div>
//         <div className="flex flex-wrap gap-2">
//           <Button variant="outline" onClick={() => setPayDrawer(true)}><Wallet className="mr-1 h-4 w-4" aria-hidden="true" />Record payment</Button>
//           <Button onClick={() => setDrawer({})}><Plus className="mr-1 h-4 w-4" aria-hidden="true" />Create invoice</Button>
//         </div>
//       </div>

//       <Card>
//         {chosen.length > 0 && (
//           <div role="region" aria-label="Selected rows" className="flex flex-wrap items-center gap-2 border-b bg-muted/50 px-4 py-2.5">
//             <span className="mr-2 text-sm font-medium">{chosen.length} selected</span>
//             <Button variant="outline" size="sm" onClick={() => { const unpaid = chosen.filter((x) => x.state !== 'paid'); status(unpaid, 'paid', `Marked ${unpaid.length} invoice${unpaid.length === 1 ? '' : 's'} as paid`); }}>
//               <CheckCircle2 className="mr-1 h-4 w-4" aria-hidden="true" />Mark as paid
//             </Button>
//             <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setConfirm(chosen)}><Trash2 className="mr-1 h-4 w-4" aria-hidden="true" />Delete</Button>
//             <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setSelected(new Set())}><X className="mr-1 h-4 w-4" aria-hidden="true" />Clear</Button>
//           </div>
//         )}

//         <Table aria-label="Account invoices">
//           <TableHeader>
//             <TableRow>
//               <TableHead className="w-10 pl-4"><Checkbox aria-label="Select all on this page" checked={allOnPage ? true : someOnPage ? 'indeterminate' : false} onCheckedChange={togglePage} /></TableHead>
//               <TableHead>Invoice number</TableHead>
//               <TableHead>Status</TableHead>
//               <TableHead>Posted</TableHead>
//               <TableHead className="text-right">Total</TableHead>
//               <TableHead className="text-right">Paid</TableHead>
//               <TableHead className="text-right">Balance</TableHead>
//               <TableHead>Description</TableHead>
//               <TableHead className="w-12">Settings</TableHead>
//             </TableRow>
//           </TableHeader>
//           <TableBody>
//             {rows.map((x) => (
//               <TableRow key={x.id} data-state={selected.has(x.id) ? 'selected' : undefined}>
//                 <TableCell className="pl-4"><Checkbox aria-label={`Select ${x.number}`} checked={selected.has(x.id)} onCheckedChange={() => toggle(x.id)} /></TableCell>
//                 <TableCell><Button variant="link" className="h-auto p-0 font-mono font-semibold" onClick={() => setDrawer({ invoice: x })}>{x.number}</Button></TableCell>
//                 <TableCell>
//                   <Badge variant="outline" className={BADGE[x.state]}>{INVOICE_STATE_LABEL[x.state] || x.state}</Badge>
//                   {x.state !== 'paid' && x.state !== 'draft' && x.dueDate && <div className={cn('mt-0.5 text-xs', x.state === 'overdue' ? 'text-destructive' : 'text-muted-foreground')}>Due {fmt(x.dueDate)}</div>}
//                 </TableCell>
//                 <TableCell className="whitespace-nowrap text-muted-foreground">{fmt(x.issueDate)}</TableCell>
//                 <TableCell className="whitespace-nowrap text-right font-medium tabular-nums">{money(x.total)}</TableCell>
//                 <TableCell className="whitespace-nowrap text-right tabular-nums text-muted-foreground">{x.paid > 0 ? money(x.paid) : <Dash />}</TableCell>
//                 <TableCell className={cn('whitespace-nowrap text-right tabular-nums', x.balance > 0 && x.state !== 'draft' ? 'font-medium' : 'text-muted-foreground')}>{money(x.balance ?? x.total)}</TableCell>
//                 <TableCell className="max-w-[260px]">
//                   <div className="truncate" title={x.description}>{x.description}</div>
//                   <div className="text-xs text-muted-foreground">{(x.rows || []).length} line item{(x.rows || []).length === 1 ? '' : 's'}</div>
//                 </TableCell>
//                 <TableCell>
//                   <DropdownMenu>
//                     <DropdownMenuTrigger asChild>
//                       <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Actions for ${x.number}`}><MoreHorizontal className="h-4 w-4" aria-hidden="true" /></Button>
//                     </DropdownMenuTrigger>
//                     <DropdownMenuContent align="end">
//                       {isSettleable(x) && (<>
//                         <DropdownMenuItem onSelect={() => setPaying(x)}><HandCoins className="mr-2 h-4 w-4" aria-hidden="true" />Pay invoice</DropdownMenuItem>
//                         <DropdownMenuSeparator />
//                       </>)}
//                       <DropdownMenuItem onSelect={() => setDrawer({ invoice: x })}><Pencil className="mr-2 h-4 w-4" aria-hidden="true" />{x.state === 'paid' ? 'View' : 'Edit'}</DropdownMenuItem>
//                       <DropdownMenuItem onSelect={() => printInvoice(x)}><Printer className="mr-2 h-4 w-4" aria-hidden="true" />Print</DropdownMenuItem>
//                       <DropdownMenuItem onSelect={() => download(x)}><Download className="mr-2 h-4 w-4" aria-hidden="true" />Download</DropdownMenuItem>
//                       {x.state === 'draft' && <DropdownMenuItem onSelect={() => status([x], 'sent', `Sent ${x.number}`)}><Send className="mr-2 h-4 w-4" aria-hidden="true" />Send</DropdownMenuItem>}
//                       {x.state === 'paid'
//                         ? <DropdownMenuItem onSelect={() => status([x], 'sent', `${x.number} marked as unpaid`)}><RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />Mark as unpaid</DropdownMenuItem>
//                         : <DropdownMenuItem onSelect={() => status([x], 'paid', `${x.number} marked as paid`)}><CheckCircle2 className="mr-2 h-4 w-4" aria-hidden="true" />Mark as paid</DropdownMenuItem>}
//                       <DropdownMenuSeparator />
//                       <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => setConfirm([x])}><Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />Delete</DropdownMenuItem>
//                     </DropdownMenuContent>
//                   </DropdownMenu>
//                 </TableCell>
//               </TableRow>
//             ))}
//             {!mine.length && (
//               <TableRow><TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
//                 <span className="inline-flex items-center gap-2"><FileText className="h-4 w-4" aria-hidden="true" />No invoices for {account.name} yet.</span>
//               </TableCell></TableRow>
//             )}
//           </TableBody>
//         </Table>
//         {pager}
//       </Card>

//       {drawer && (
//         <AccountInvoiceDrawer accountId={account.id} invoice={drawer.invoice || null} nextNumber={nextInvoiceNumber} onClose={() => setDrawer(null)} onSave={save} />
//       )}
//       {payDrawer && <OfflinePaymentDrawer accountId={account.id} onClose={() => setPayDrawer(false)} />}
//       {paying && <PayInvoiceModal invoice={invoices.find((i) => i.id === paying.id) || paying} onClose={() => setPaying(null)} notify={notify} />}

//       <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
//         <AlertDialogContent>
//           <AlertDialogHeader>
//             <AlertDialogTitle>{confirm?.length === 1 ? `Delete ${confirm[0].number}?` : `Delete ${confirm?.length} invoices?`}</AlertDialogTitle>
//             <AlertDialogDescription>The client will no longer see {confirm?.length === 1 ? 'this invoice' : 'these invoices'}. This can’t be undone.</AlertDialogDescription>
//           </AlertDialogHeader>
//           <ul className="max-h-40 list-disc overflow-y-auto pl-5 text-sm">{(confirm || []).map((x) => <li key={x.id}>{x.number} · {money(x.total)}</li>)}</ul>
//           <AlertDialogFooter>
//             <AlertDialogCancel>Cancel</AlertDialogCancel>
//             <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
//               onClick={() => { deleteInvoices(confirm); unselect(confirm); notify(`Deleted ${confirm.length} invoice${confirm.length === 1 ? '' : 's'}`); setConfirm(null); }}>
//               {confirm?.length === 1 ? 'Delete invoice' : 'Delete invoices'}
//             </AlertDialogAction>
//           </AlertDialogFooter>
//         </AlertDialogContent>
//       </AlertDialog>
//     </section>
//   );
// }

// /* ---------- Pay invoice: information only — Invoice Number · Invoice Amount · Credit Applied · Amount to Pay → Proceed Payment ----------
//  * With client credit: Proceed applies the credit (→ Partially paid); "Amount to Pay" is what's left for the client to pay.
//  * Without credit (e.g. the client has now paid the rest): Proceed records the Amount to Pay as paid (→ Paid).
//  */
// function PayInvoiceModal({ invoice, onClose, notify }) {
//   const { payInvoice, creditOf } = useData();
//   const { user } = useAuth() || {};
//   const balance = round2(invoice.balance ?? invoice.total);
//   const credit = round2(Math.min(creditOf ? creditOf(invoice.accountId) : 0, balance));   // credit applied (up to the balance)
//   const toPay = round2(balance - credit);                                                  // the remaining amount
//   const [error, setError] = useState('');

//   const proceed = () => {
//     const rec = credit > 0
//       ? payInvoice(invoice, { creditApplied: credit, amount: 0 }, user?.name || 'You')      // apply the credit; the client pays the rest
//       : payInvoice(invoice, { creditApplied: 0, amount: toPay }, user?.name || 'You');      // record the payment of what's left
//     if (!rec) { setError('Couldn’t record this payment.'); return; }
//     const left = credit > 0 ? toPay : 0;
//     notify(left > 0 ? `${invoice.number} partially paid — ${money(left)} left to pay` : `${invoice.number} paid in full`);
//     onClose();
//   };

//   const Info = ({ label, children, testId }) => (
//     <div>
//       <p className="text-sm text-muted-foreground">{label}</p>
//       <div className="mt-1 font-semibold" data-testid={testId}>{children}</div>
//     </div>
//   );

//   return (
//     <Modal title={`Pay ${invoice.number}`} onClose={onClose} width="max-w-sm">
//       <div className="flex flex-col gap-5" aria-label="Payment summary">
//         <Info label="Invoice Number" testId="pay-number"><span className="tabular-nums">{invoice.number}</span></Info>
//         <Info label="Invoice Amount" testId="pay-amount">
//           <span className="tabular-nums">{money(balance)}</span>
//           {invoice.paid > 0 && <span className="ml-2 text-xs font-normal text-muted-foreground">({money(invoice.paid)} of {money(invoice.total)} already paid)</span>}
//         </Info>
//         <Info label="Credit Applied" testId="pay-credit"><span className="tabular-nums text-emerald-600 dark:text-emerald-400">{money(credit)}</span></Info>
//         <Info label="Amount to Pay" testId="pay-to-pay"><span className="text-2xl font-bold tabular-nums">{money(toPay)}</span></Info>
//         {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
//         <Button size="lg" className="w-full" onClick={proceed}>Proceed Payment</Button>
//       </div>
//     </Modal>
//   );
// }

// /* ---------- Payments (child tab 2): the account's payment history ---------- */
// function PaymentsView({ notify, onShowInvoices }) {
//   const { account } = useOutletContext();
//   const { payments = [], invoices = [], refundPayment, voidPayment, creditOf } = useData();
//   const mine = useMemo(() => payments.filter((p) => p.accountId === account.id), [payments, account.id]);
//   const [payDrawer, setPayDrawer] = useState(false);
//   const [confirm, setConfirm] = useState(null);        // { kind: 'refund' | 'void', payment }
//   const { rows, pager } = usePages(mine, account.id);
//   const numberOf = (id) => invoices.find((i) => i.id === id)?.number || '—';
//   const ok = mine.filter((p) => p.status === 'succeeded');

//   const stats = [
//     ['Received', money(ok.reduce((s, p) => s + (Number(p.amount) || 0), 0))],
//     ['Payments', String(mine.length)],
//     ['Refunded', money(mine.reduce((s, p) => s + (Number(p.refund) || 0), 0))],
//     ['Client credit', money(creditOf ? creditOf(account.id) : 0)],
//   ];
//   const act = () => {
//     const { kind, payment: p } = confirm;
//     if (kind === 'refund') { refundPayment(p); notify(`Refunded ${p.number} (${money(p.amount)})`); } else { voidPayment(p); notify(`Voided ${p.number}`); }
//     setConfirm(null);
//   };

//   return (
//     <section role="tabpanel" aria-label="Payments" className="space-y-4">
//       <div className="flex flex-wrap items-end justify-between gap-3">
//         <div className="grid flex-1 grid-cols-2 gap-3 sm:max-w-3xl sm:grid-cols-4">
//           {stats.map(([label, value]) => (
//             <Card key={label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="text-lg font-semibold tabular-nums">{value}</p></CardContent></Card>
//           ))}
//         </div>
//         <Button onClick={() => setPayDrawer(true)}><Plus className="mr-1 h-4 w-4" aria-hidden="true" />Record payment</Button>
//       </div>

//       <Card className="overflow-x-auto">
//         <Table aria-label="Account payments" className="min-w-[1180px]">
//           <TableHeader>
//             <TableRow>
//               <TableHead className="pl-4">Payment number</TableHead>
//               <TableHead>Date</TableHead>
//               <TableHead>Status</TableHead>
//               <TableHead className="text-right">Amount</TableHead>
//               <TableHead>Payment method</TableHead>
//               <TableHead>Invoices paid</TableHead>
//               <TableHead className="text-right">Refund</TableHead>
//               <TableHead>Description</TableHead>
//               <TableHead>Payment provider</TableHead>
//               <TableHead className="w-12">Actions</TableHead>
//             </TableRow>
//           </TableHeader>
//           <TableBody>
//             {rows.map((p) => {
//               const live = p.status === 'succeeded';
//               return (
//                 <TableRow key={p.id} className={cn(!live && 'opacity-60')}>
//                   <TableCell className="whitespace-nowrap pl-4 font-mono font-semibold">{p.number}</TableCell>
//                   <TableCell className="whitespace-nowrap text-muted-foreground">{fmt(p.date)}</TableCell>
//                   <TableCell><Badge variant="outline" className={PAYMENT_BADGE[p.status]}>{PAYMENT_STATUS_LABEL[p.status] || p.status}</Badge></TableCell>
//                   <TableCell className="whitespace-nowrap text-right tabular-nums">
//                     <span className="font-medium">{money(p.amount)}</span>
//                     {p.creditApplied > 0 && <span className="block text-xs text-muted-foreground">+ {money(p.creditApplied)} credit applied</span>}
//                     {p.credit > 0 && <span className="block text-xs text-emerald-700 dark:text-emerald-400">{money(p.credit)} to credit</span>}
//                   </TableCell>
//                   <TableCell className="whitespace-nowrap text-sm">{p.method}</TableCell>
//                   <TableCell>
//                     {(p.allocations || []).length
//                       ? <div className="flex flex-wrap gap-1">{p.allocations.map((al) => <Badge key={al.invoiceId} variant="secondary" className="font-mono font-normal">{numberOf(al.invoiceId)} · {money(al.amount)}</Badge>)}</div>
//                       : <span className="text-sm text-muted-foreground">Added to credit</span>}
//                   </TableCell>
//                   <TableCell className="whitespace-nowrap text-right tabular-nums text-muted-foreground">{p.refund > 0 ? money(p.refund) : <Dash />}</TableCell>
//                   <TableCell className="max-w-[220px]"><div className="truncate text-sm text-muted-foreground" title={p.description}>{p.description || <Dash />}</div></TableCell>
//                   <TableCell className="whitespace-nowrap text-sm">{p.provider}</TableCell>
//                   <TableCell>
//                     <DropdownMenu>
//                       <DropdownMenuTrigger asChild>
//                         <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Actions for ${p.number}`}><MoreHorizontal className="h-4 w-4" aria-hidden="true" /></Button>
//                       </DropdownMenuTrigger>
//                       <DropdownMenuContent align="end">
//                         <DropdownMenuItem onSelect={onShowInvoices}><Receipt className="mr-2 h-4 w-4" aria-hidden="true" />View invoices</DropdownMenuItem>
//                         {live && p.amount > 0 && <DropdownMenuItem onSelect={() => setConfirm({ kind: 'refund', payment: p })}><Undo2 className="mr-2 h-4 w-4" aria-hidden="true" />Refund</DropdownMenuItem>}
//                         {live && (<>
//                           <DropdownMenuSeparator />
//                           <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => setConfirm({ kind: 'void', payment: p })}><Ban className="mr-2 h-4 w-4" aria-hidden="true" />Void payment</DropdownMenuItem>
//                         </>)}
//                       </DropdownMenuContent>
//                     </DropdownMenu>
//                   </TableCell>
//                 </TableRow>
//               );
//             })}
//             {!mine.length && (
//               <TableRow><TableCell colSpan={10} className="h-32 text-center text-muted-foreground">
//                 <span className="inline-flex items-center gap-2"><Wallet className="h-4 w-4" aria-hidden="true" />No payments from {account.name} yet.</span>
//               </TableCell></TableRow>
//             )}
//           </TableBody>
//         </Table>
//         {pager}
//       </Card>

//       {payDrawer && <OfflinePaymentDrawer accountId={account.id} onClose={() => setPayDrawer(false)} />}

//       <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
//         <AlertDialogContent>
//           <AlertDialogHeader>
//             <AlertDialogTitle>{confirm ? `${confirm.kind === 'refund' ? 'Refund' : 'Void'} ${confirm.payment.number}?` : ''}</AlertDialogTitle>
//             <AlertDialogDescription>
//               {confirm && `${confirm.kind === 'refund' ? `${money(confirm.payment.amount)} is marked as refunded. ` : ''}${(confirm.payment.allocations || []).length
//                 ? `${confirm.payment.allocations.map((al) => numberOf(al.invoiceId)).join(', ')} will owe this amount again`
//                 : 'The credit it added is removed'}${confirm.payment.creditApplied > 0 ? ', and the credit it used goes back to the client' : ''}. It stays in the history.`}
//             </AlertDialogDescription>
//           </AlertDialogHeader>
//           <AlertDialogFooter>
//             <AlertDialogCancel>Cancel</AlertDialogCancel>
//             <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={act}>
//               {confirm?.kind === 'refund' ? 'Refund payment' : 'Void payment'}
//             </AlertDialogAction>
//           </AlertDialogFooter>
//         </AlertDialogContent>
//       </AlertDialog>
//     </section>
//   );
// }

import { useEffect, useMemo, useState } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import {
  Ban, CheckCircle2, ChevronLeft, ChevronRight, CreditCard, Download, FileText, HandCoins, MoreHorizontal, Pencil, Plus, Printer, Receipt, RotateCcw, Send, Trash2, Undo2, Wallet, X,
} from 'lucide-react';
import { ToastBridge } from '../../components/ui/sonner';
import { SubTabs } from '../../components/TabNav';
// shadcn components — one file each in src/components/ui
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent } from '../../components/ui/card';
import { Checkbox } from '../../components/ui/checkbox';
import { Modal } from '../../components/ui';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../../components/ui/alert-dialog';

import AccountInvoiceDrawer from '../../components/invoices/AccountInvoiceDrawer';
import OfflinePaymentDrawer from '../../components/invoices/OfflinePaymentDrawer';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { money } from '../../data/invoiceTemplates';
import { INVOICE_STATE_LABEL, PAYMENT_STATUS_LABEL, isSettleable, round2 } from '../../data/payments';

const PAGE_SIZE = 10;
const cn = (...c) => c.filter(Boolean).join(' ');
const fmt = (d) => (d ? new Date(`${String(d).slice(0, 10)}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—');
const BADGE = {
  draft: 'border-transparent bg-muted text-muted-foreground',
  sent: 'border-transparent bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  overdue: 'border-transparent bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  partial: 'border-transparent bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
  paid: 'border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
};
const PAYMENT_BADGE = {
  succeeded: 'border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  refunded: 'border-transparent bg-muted text-muted-foreground',
  voided: 'border-transparent bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
};
const Dash = () => <span className="text-muted-foreground/60">—</span>;

/** Simple pages of 10 (same as before): rows on this page + the pager. */
function usePages(list, resetKey) {
  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [resetKey]);
  const pageCount = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const rows = list.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const pager = list.length > 0 && (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm text-muted-foreground">
      <span data-testid="page-range">{(safePage - 1) * PAGE_SIZE + 1}–{Math.min(list.length, safePage * PAGE_SIZE)} of {list.length}</span>
      <div className="flex items-center gap-1">
        <span className="mr-2">Page {safePage} of {pageCount}</span>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(safePage - 1)} disabled={safePage === 1} aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></Button>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(safePage + 1)} disabled={safePage === pageCount} aria-label="Next page"><ChevronRight className="h-4 w-4" /></Button>
      </div>
    </div>
  );
  return { rows, pager };
}

/**
 * Account Invoices tab with two child tabs (like the Workflow tab's Pipelines / Jobs):
 *   Invoices — this account's invoices (?view=invoices, the default)
 *   Payments — this account's payment history (?view=payments)
 * Uses DataContext: invoices, payments, nextInvoiceNumber, createInvoice, updateInvoice, deleteInvoices, setInvoiceStatus,
 * printInvoice, downloadInvoice, recordOfflinePayment (via OfflinePaymentDrawer), voidPayment.
 */
export default function AccountInvoicesTab() {
  const { account } = useOutletContext();
  const { invoices = [], payments = [] } = useData();
  const [params, setParams] = useSearchParams();
  const view = params.get('view') === 'payments' ? 'payments' : 'invoices';
  const setView = (v) => setParams((prev) => { const n = new URLSearchParams(prev); n.set('view', v); return n; }, { replace: true });
  const [toast, setToast] = useState('');
  const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 2600); };

  return (
    <div className="flex flex-col gap-5">
      {/* Child tabs (same style as every tab bar) */}
      <SubTabs label="Invoices views" value={view} onChange={setView}
        tabs={[
          { key: 'invoices', label: 'Invoices', icon: Receipt, count: invoices.filter((x) => x.accountId === account.id).length },
          { key: 'payments', label: 'Payments', icon: CreditCard, count: payments.filter((p) => p.accountId === account.id).length },
        ]} />

      {view === 'invoices'
        ? <InvoicesView notify={notify} />
        : <PaymentsView notify={notify} onShowInvoices={() => setView('invoices')} />}

      <ToastBridge message={toast} />
    </div>
  );
}

/* ---------- Invoices (child tab 1): the account's invoices ---------- */
function InvoicesView({ notify }) {
  const { account } = useOutletContext();
  const { invoices = [], nextInvoiceNumber, createInvoice, updateInvoice, deleteInvoices, setInvoiceStatus, printInvoice, downloadInvoice, creditOf } = useData();
  const mine = useMemo(() => invoices.filter((x) => x.accountId === account.id).sort((a, b) => (a.issueDate < b.issueDate ? 1 : -1)), [invoices, account.id]);
  const [drawer, setDrawer] = useState(null);          // { invoice? }
  const [payDrawer, setPayDrawer] = useState(false);
  const [paying, setPaying] = useState(null);          // invoice in the Pay invoice modal
  const [confirm, setConfirm] = useState(null);        // invoices to delete
  const [selected, setSelected] = useState(() => new Set());
  const { rows, pager } = usePages(mine, account.id);
  useEffect(() => { setSelected(new Set()); }, [account.id]);
  const chosen = mine.filter((x) => selected.has(x.id));
  const allOnPage = rows.length > 0 && rows.every((x) => selected.has(x.id));
  const someOnPage = rows.some((x) => selected.has(x.id));
  const toggle = (id) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const togglePage = () => setSelected((s) => { const n = new Set(s); rows.forEach((x) => (allOnPage ? n.delete(x.id) : n.add(x.id))); return n; });
  const unselect = (items) => setSelected((s) => { const n = new Set(s); items.forEach((x) => n.delete(x.id)); return n; });

  const sumOf = (list, key) => list.reduce((n, x) => n + (Number(x[key]) || 0), 0);
  const stats = [
    ['Outstanding', money(sumOf(mine.filter((x) => x.state !== 'draft'), 'balance'))],
    ['Overdue', money(sumOf(mine.filter((x) => x.state === 'overdue'), 'balance'))],
    ['Paid', money(sumOf(mine, 'paid'))],
    ['Client credit', money(creditOf ? creditOf(account.id) : 0)],
  ];
  const status = (items, s, msg) => { setInvoiceStatus(items, s); notify(msg); };
  const download = async (x) => notify((await downloadInvoice(x)) ? `Downloaded Invoice-${x.number}.pdf` : 'Couldn’t create the PDF. Try Print → Save as PDF.');
  const save = (form, { send }) => {
    const rec = drawer?.invoice ? updateInvoice(form) : createInvoice(form, { send });
    setDrawer(null);
    notify(drawer?.invoice ? `Updated ${rec.number}` : `${send ? 'Sent' : 'Saved draft'} ${rec.number}`);
  };

  return (
    <section role="tabpanel" aria-label="Invoices" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="grid flex-1 grid-cols-2 gap-3 sm:max-w-3xl sm:grid-cols-4">
          {stats.map(([label, value]) => (
            <Card key={label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="text-lg font-semibold tabular-nums" data-testid={`stat-${label}`}>{value}</p></CardContent></Card>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setPayDrawer(true)}><Wallet className="mr-1 h-4 w-4" aria-hidden="true" />Record payment</Button>
          <Button onClick={() => setDrawer({})}><Plus className="mr-1 h-4 w-4" aria-hidden="true" />Create invoice</Button>
        </div>
      </div>

      <Card>
        {chosen.length > 0 && (
          <div role="region" aria-label="Selected rows" className="flex flex-wrap items-center gap-2 border-b bg-muted/50 px-4 py-2.5">
            <span className="mr-2 text-sm font-medium">{chosen.length} selected</span>
            <Button variant="outline" size="sm" onClick={() => { const unpaid = chosen.filter((x) => x.state !== 'paid'); status(unpaid, 'paid', `Marked ${unpaid.length} invoice${unpaid.length === 1 ? '' : 's'} as paid`); }}>
              <CheckCircle2 className="mr-1 h-4 w-4" aria-hidden="true" />Mark as paid
            </Button>
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setConfirm(chosen)}><Trash2 className="mr-1 h-4 w-4" aria-hidden="true" />Delete</Button>
            <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setSelected(new Set())}><X className="mr-1 h-4 w-4" aria-hidden="true" />Clear</Button>
          </div>
        )}

        <Table aria-label="Account invoices">
          <TableHeader>
            <TableRow>
              <TableHead className="w-10 pl-4"><Checkbox aria-label="Select all on this page" checked={allOnPage ? true : someOnPage ? 'indeterminate' : false} onCheckedChange={togglePage} /></TableHead>
              <TableHead>Invoice number</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Posted</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-12">Settings</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((x) => (
              <TableRow key={x.id} data-state={selected.has(x.id) ? 'selected' : undefined}>
                <TableCell className="pl-4"><Checkbox aria-label={`Select ${x.number}`} checked={selected.has(x.id)} onCheckedChange={() => toggle(x.id)} /></TableCell>
                <TableCell><Button variant="link" className="h-auto p-0 font-mono font-semibold" onClick={() => setDrawer({ invoice: x })}>{x.number}</Button></TableCell>
                <TableCell>
                  <Badge variant="outline" className={BADGE[x.state]}>{INVOICE_STATE_LABEL[x.state] || x.state}</Badge>
                  {x.state !== 'paid' && x.state !== 'draft' && x.dueDate && <div className={cn('mt-0.5 text-xs', x.state === 'overdue' ? 'text-destructive' : 'text-muted-foreground')}>Due {fmt(x.dueDate)}</div>}
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">{fmt(x.issueDate)}</TableCell>
                <TableCell className="whitespace-nowrap text-right font-medium tabular-nums">{money(x.total)}</TableCell>
                <TableCell className="whitespace-nowrap text-right tabular-nums text-muted-foreground">{x.paid > 0 ? money(x.paid) : <Dash />}</TableCell>
                <TableCell className={cn('whitespace-nowrap text-right tabular-nums', x.balance > 0 && x.state !== 'draft' ? 'font-medium' : 'text-muted-foreground')}>{money(x.balance ?? x.total)}</TableCell>
                <TableCell className="max-w-[260px]">
                  <div className="truncate" title={x.description}>{x.description}</div>
                  <div className="text-xs text-muted-foreground">{(x.rows || []).length} line item{(x.rows || []).length === 1 ? '' : 's'}</div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Actions for ${x.number}`}><MoreHorizontal className="h-4 w-4" aria-hidden="true" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {isSettleable(x) && (<>
                        <DropdownMenuItem onSelect={() => setPaying(x)}><HandCoins className="mr-2 h-4 w-4" aria-hidden="true" />Pay invoice</DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>)}
                      <DropdownMenuItem onSelect={() => setDrawer({ invoice: x })}><Pencil className="mr-2 h-4 w-4" aria-hidden="true" />{x.state === 'paid' ? 'View' : 'Edit'}</DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => printInvoice(x)}><Printer className="mr-2 h-4 w-4" aria-hidden="true" />Print</DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => download(x)}><Download className="mr-2 h-4 w-4" aria-hidden="true" />Download</DropdownMenuItem>
                      {x.state === 'draft' && <DropdownMenuItem onSelect={() => status([x], 'sent', `Sent ${x.number}`)}><Send className="mr-2 h-4 w-4" aria-hidden="true" />Send</DropdownMenuItem>}
                      {x.state === 'paid'
                        ? <DropdownMenuItem onSelect={() => status([x], 'sent', `${x.number} marked as unpaid`)}><RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />Mark as unpaid</DropdownMenuItem>
                        : <DropdownMenuItem onSelect={() => status([x], 'paid', `${x.number} marked as paid`)}><CheckCircle2 className="mr-2 h-4 w-4" aria-hidden="true" />Mark as paid</DropdownMenuItem>}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => setConfirm([x])}><Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {!mine.length && (
              <TableRow><TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                <span className="inline-flex items-center gap-2"><FileText className="h-4 w-4" aria-hidden="true" />No invoices for {account.name} yet.</span>
              </TableCell></TableRow>
            )}
          </TableBody>
        </Table>
        {pager}
      </Card>

      {drawer && (
        <AccountInvoiceDrawer accountId={account.id} invoice={drawer.invoice || null} nextNumber={nextInvoiceNumber} onClose={() => setDrawer(null)} onSave={save} />
      )}
      {payDrawer && <OfflinePaymentDrawer accountId={account.id} onClose={() => setPayDrawer(false)} />}
      {paying && <PayInvoiceModal invoice={invoices.find((i) => i.id === paying.id) || paying} onClose={() => setPaying(null)} notify={notify} />}

      {/* Delete (one from a row's menu, or the selected ones) — your Modal, same as Contacts */}
      {confirm && (
        <Modal title={confirm.length === 1 ? `Delete ${confirm[0].number}?` : `Delete ${confirm.length} invoices?`}
          description={`The client will no longer see ${confirm.length === 1 ? 'this invoice' : 'these invoices'}. This can’t be undone.`}
          onClose={() => setConfirm(null)}
          footer={<>
            <Button variant="outline" onClick={() => setConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { deleteInvoices(confirm); unselect(confirm); notify(`Deleted ${confirm.length} invoice${confirm.length === 1 ? '' : 's'}`); setConfirm(null); }}>
              <Trash2 className="mr-1 h-4 w-4" aria-hidden="true" />{confirm.length === 1 ? 'Delete invoice' : 'Delete invoices'}
            </Button>
          </>}>
          <ul className="max-h-48 divide-y overflow-y-auto rounded-lg border">
            {confirm.map((x) => (
              <li key={x.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <span className="font-mono font-medium">{x.number}</span>
                <span className="truncate text-muted-foreground">{x.description}</span>
                <span className="ml-auto whitespace-nowrap tabular-nums">{money(x.total)}</span>
              </li>
            ))}
          </ul>
        </Modal>
      )}
    </section>
  );
}

/* ---------- Pay invoice: information only — Invoice Number · Invoice Amount · Credit Applied · Amount to Pay → Proceed Payment ----------
 * With client credit: Proceed applies the credit (→ Partially paid); "Amount to Pay" is what's left for the client to pay.
 * Without credit (e.g. the client has now paid the rest): Proceed records the Amount to Pay as paid (→ Paid).
 */
function PayInvoiceModal({ invoice, onClose, notify }) {
  const { payInvoice, creditOf } = useData();
  const { user } = useAuth() || {};
  const balance = round2(invoice.balance ?? invoice.total);
  const credit = round2(Math.min(creditOf ? creditOf(invoice.accountId) : 0, balance));   // credit applied (up to the balance)
  const toPay = round2(balance - credit);                                                  // the remaining amount
  const [error, setError] = useState('');

  const proceed = () => {
    const rec = credit > 0
      ? payInvoice(invoice, { creditApplied: credit, amount: 0 }, user?.name || 'You')      // apply the credit; the client pays the rest
      : payInvoice(invoice, { creditApplied: 0, amount: toPay }, user?.name || 'You');      // record the payment of what's left
    if (!rec) { setError('Couldn’t record this payment.'); return; }
    const left = credit > 0 ? toPay : 0;
    notify(left > 0 ? `${invoice.number} partially paid — ${money(left)} left to pay` : `${invoice.number} paid in full`);
    onClose();
  };

  const Info = ({ label, children, testId }) => (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="mt-1 font-semibold" data-testid={testId}>{children}</div>
    </div>
  );

  return (
    <Modal title={`Pay ${invoice.number}`} onClose={onClose} width="max-w-sm">
      <div className="flex flex-col gap-5" aria-label="Payment summary">
        <Info label="Invoice Number" testId="pay-number"><span className="tabular-nums">{invoice.number}</span></Info>
        <Info label="Invoice Amount" testId="pay-amount">
          <span className="tabular-nums">{money(balance)}</span>
          {invoice.paid > 0 && <span className="ml-2 text-xs font-normal text-muted-foreground">({money(invoice.paid)} of {money(invoice.total)} already paid)</span>}
        </Info>
        <Info label="Credit Applied" testId="pay-credit"><span className="tabular-nums text-emerald-600 dark:text-emerald-400">{money(credit)}</span></Info>
        <Info label="Amount to Pay" testId="pay-to-pay"><span className="text-2xl font-bold tabular-nums">{money(toPay)}</span></Info>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button size="lg" className="w-full" onClick={proceed}>Proceed Payment</Button>
      </div>
    </Modal>
  );
}

/* ---------- Payments (child tab 2): the account's payment history ---------- */
function PaymentsView({ notify, onShowInvoices }) {
  const { account } = useOutletContext();
  const { payments = [], invoices = [], refundPayment, voidPayment, creditOf } = useData();
  const mine = useMemo(() => payments.filter((p) => p.accountId === account.id), [payments, account.id]);
  const [payDrawer, setPayDrawer] = useState(false);
  const [confirm, setConfirm] = useState(null);        // { kind: 'refund' | 'void', payment }
  const { rows, pager } = usePages(mine, account.id);
  const numberOf = (id) => invoices.find((i) => i.id === id)?.number || '—';
  const ok = mine.filter((p) => p.status === 'succeeded');

  const stats = [
    ['Received', money(ok.reduce((s, p) => s + (Number(p.amount) || 0), 0))],
    ['Payments', String(mine.length)],
    ['Refunded', money(mine.reduce((s, p) => s + (Number(p.refund) || 0), 0))],
    ['Client credit', money(creditOf ? creditOf(account.id) : 0)],
  ];
  const act = () => {
    const { kind, payment: p } = confirm;
    if (kind === 'refund') { refundPayment(p); notify(`Refunded ${p.number} (${money(p.amount)})`); } else { voidPayment(p); notify(`Voided ${p.number}`); }
    setConfirm(null);
  };

  return (
    <section role="tabpanel" aria-label="Payments" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="grid flex-1 grid-cols-2 gap-3 sm:max-w-3xl sm:grid-cols-4">
          {stats.map(([label, value]) => (
            <Card key={label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="text-lg font-semibold tabular-nums">{value}</p></CardContent></Card>
          ))}
        </div>
        <Button onClick={() => setPayDrawer(true)}><Plus className="mr-1 h-4 w-4" aria-hidden="true" />Record payment</Button>
      </div>

      <Card className="overflow-x-auto">
        <Table aria-label="Account payments" className="min-w-[1180px]">
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Payment number</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Payment method</TableHead>
              <TableHead>Invoices paid</TableHead>
              <TableHead className="text-right">Refund</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Payment provider</TableHead>
              <TableHead className="w-12">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((p) => {
              const live = p.status === 'succeeded';
              return (
                <TableRow key={p.id} className={cn(!live && 'opacity-60')}>
                  <TableCell className="whitespace-nowrap pl-4 font-mono font-semibold">{p.number}</TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{fmt(p.date)}</TableCell>
                  <TableCell><Badge variant="outline" className={PAYMENT_BADGE[p.status]}>{PAYMENT_STATUS_LABEL[p.status] || p.status}</Badge></TableCell>
                  <TableCell className="whitespace-nowrap text-right tabular-nums">
                    <span className="font-medium">{money(p.amount)}</span>
                    {p.creditApplied > 0 && <span className="block text-xs text-muted-foreground">+ {money(p.creditApplied)} credit applied</span>}
                    {p.credit > 0 && <span className="block text-xs text-emerald-700 dark:text-emerald-400">{money(p.credit)} to credit</span>}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">{p.method}</TableCell>
                  <TableCell>
                    {(p.allocations || []).length
                      ? <div className="flex flex-wrap gap-1">{p.allocations.map((al) => <Badge key={al.invoiceId} variant="secondary" className="font-mono font-normal">{numberOf(al.invoiceId)} · {money(al.amount)}</Badge>)}</div>
                      : <span className="text-sm text-muted-foreground">Added to credit</span>}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right tabular-nums text-muted-foreground">{p.refund > 0 ? money(p.refund) : <Dash />}</TableCell>
                  <TableCell className="max-w-[220px]"><div className="truncate text-sm text-muted-foreground" title={p.description}>{p.description || <Dash />}</div></TableCell>
                  <TableCell className="whitespace-nowrap text-sm">{p.provider}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Actions for ${p.number}`}><MoreHorizontal className="h-4 w-4" aria-hidden="true" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={onShowInvoices}><Receipt className="mr-2 h-4 w-4" aria-hidden="true" />View invoices</DropdownMenuItem>
                        {live && p.amount > 0 && <DropdownMenuItem onSelect={() => setConfirm({ kind: 'refund', payment: p })}><Undo2 className="mr-2 h-4 w-4" aria-hidden="true" />Refund</DropdownMenuItem>}
                        {live && (<>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => setConfirm({ kind: 'void', payment: p })}><Ban className="mr-2 h-4 w-4" aria-hidden="true" />Void payment</DropdownMenuItem>
                        </>)}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
            {!mine.length && (
              <TableRow><TableCell colSpan={10} className="h-32 text-center text-muted-foreground">
                <span className="inline-flex items-center gap-2"><Wallet className="h-4 w-4" aria-hidden="true" />No payments from {account.name} yet.</span>
              </TableCell></TableRow>
            )}
          </TableBody>
        </Table>
        {pager}
      </Card>

      {payDrawer && <OfflinePaymentDrawer accountId={account.id} onClose={() => setPayDrawer(false)} />}

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm ? `${confirm.kind === 'refund' ? 'Refund' : 'Void'} ${confirm.payment.number}?` : ''}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirm && `${confirm.kind === 'refund' ? `${money(confirm.payment.amount)} is marked as refunded. ` : ''}${(confirm.payment.allocations || []).length
                ? `${confirm.payment.allocations.map((al) => numberOf(al.invoiceId)).join(', ')} will owe this amount again`
                : 'The credit it added is removed'}${confirm.payment.creditApplied > 0 ? ', and the credit it used goes back to the client' : ''}. It stays in the history.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={act}>
              {confirm?.kind === 'refund' ? 'Refund payment' : 'Void payment'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}