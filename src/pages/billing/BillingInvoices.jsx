// import { useEffect, useMemo, useState } from 'react';
// import { useNavigate, useSearchParams } from 'react-router-dom';
// import {
//   ChevronDown, ChevronLeft, ChevronRight, Download, Filter, MoreHorizontal, Pencil, Plus, Printer, Search, Trash2, X,
// } from 'lucide-react';
// import { ToastBridge } from '../../components/ui/sonner';
// // shadcn components — one file each in src/components/ui
// import { Button } from '../../components/ui/button';
// import { Input } from '../../components/ui/input';
// import { Badge } from '../../components/ui/badge';
// import { Card, CardContent } from '../../components/ui/card';
// import { Checkbox } from '../../components/ui/checkbox';
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
// import {
//   DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
// } from '../../components/ui/dropdown-menu';
// import {
//   AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
// } from '../../components/ui/alert-dialog';

// import AccountInvoiceDrawer from '../../components/invoices/AccountInvoiceDrawer';
// import { useData } from '../../context/DataContext';
// import { money } from '../../data/invoiceTemplates';
// import { statusInfo } from '../../data/accountinvoices';

// const cn = (...c) => c.filter(Boolean).join(' ');
// const fmt = (d) => (d ? new Date(`${String(d).slice(0, 10)}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—');
// const BADGE = {
//   draft: 'border-transparent bg-muted text-muted-foreground',
//   sent: 'border-transparent bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
//   overdue: 'border-transparent bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
//   paid: 'border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
// };

// /** A filter button with a checkbox menu (optional search box for long lists). */
// function CheckFilter({ label, options, value, onChange, searchable = false }) {
//   const [q, setQ] = useState('');
//   const shown = searchable && q.trim() ? options.filter((o) => o.label.toLowerCase().includes(q.trim().toLowerCase())) : options;
//   const toggle = (v) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
//   return (
//     <DropdownMenu onOpenChange={(o) => !o && setQ('')}>
//       <DropdownMenuTrigger asChild>
//         <Button variant="outline" className="h-9 border-dashed" aria-label={`Filter by ${label.toLowerCase()}`}>
//           <Filter className="mr-1 h-4 w-4" aria-hidden="true" />{label}
//           {value.length > 0 && <Badge variant="secondary" className="ml-1 rounded-sm px-1.5 font-normal">{value.length}</Badge>}
//           <ChevronDown className="ml-1 h-4 w-4 opacity-50" aria-hidden="true" />
//         </Button>
//       </DropdownMenuTrigger>
//       <DropdownMenuContent align="start" className="w-64">
//         <DropdownMenuLabel>{label}</DropdownMenuLabel>
//         {searchable && (
//           <div className="px-2 pb-2">
//             <Input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.stopPropagation()} placeholder={`Search ${label.toLowerCase()}`} aria-label={`Search ${label.toLowerCase()}`} className="h-8" />
//           </div>
//         )}
//         <DropdownMenuSeparator />
//         <div className="max-h-64 overflow-y-auto">
//           {shown.map((o) => (
//             <DropdownMenuCheckboxItem key={o.value} checked={value.includes(o.value)} onCheckedChange={() => toggle(o.value)} onSelect={(e) => e.preventDefault()}>
//               {o.label}
//             </DropdownMenuCheckboxItem>
//           ))}
//           {!shown.length && <p className="px-2 py-3 text-center text-sm text-muted-foreground">No matches</p>}
//         </div>
//         {value.length > 0 && (<><DropdownMenuSeparator /><DropdownMenuItem onSelect={() => onChange([])} className="justify-center">Clear</DropdownMenuItem></>)}
//       </DropdownMenuContent>
//     </DropdownMenu>
//   );
// }

// /**
//  * Billing → Invoices: every account's invoices.
//  * Filters: invoice number · account name · service categories (from each invoice's line items).
//  * Edit (AccountInvoiceDrawer) · Print / Download (paid invoices only) · Delete · bulk delete · pagination.
//  * ?new=invoice opens "Create new Invoice"; ?account=<id> pre-sets the account filter.
//  * Uses DataContext: invoices, accounts, services, serviceCategories, nextInvoiceNumber,
//  * createInvoice, updateInvoice, deleteInvoices, printInvoice, downloadInvoice.
//  */
// export default function BillingInvoices() {
//   const navigate = useNavigate();
//   const [params, setParams] = useSearchParams();
//   const {
//     invoices = [], accounts = [], services = [], serviceCategories = [], nextInvoiceNumber,
//     createInvoice, updateInvoice, deleteInvoices, printInvoice, downloadInvoice,
//   } = useData();

//   const [number, setNumber] = useState('');
//   const [accountIds, setAccountIds] = useState(() => (params.get('account') ? [params.get('account')] : []));
//   const [categoryIds, setCategoryIds] = useState([]);
//   const [drawer, setDrawer] = useState(null);           // { invoice? }
//   const [confirm, setConfirm] = useState(null);         // invoices to delete
//   const [selected, setSelected] = useState(() => new Set());
//   const [page, setPage] = useState(1);
//   const [pageSize, setPageSize] = useState(25);
//   const [toast, setToast] = useState('');
//   const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 2600); };

//   useEffect(() => {
//     if (params.get('new') === 'invoice') { setDrawer({}); const n = new URLSearchParams(params); n.delete('new'); setParams(n, { replace: true }); }
//   }, [params]); // eslint-disable-line react-hooks/exhaustive-deps

//   /* service categories of an invoice = the categories of its line items' services (by id, else by name) */
//   const categoryOfRow = useMemo(() => {
//     const byId = new Map(services.map((s) => [s.id, s.categoryId]));
//     const byName = new Map(services.map((s) => [s.name.trim().toLowerCase(), s.categoryId]));
//     return (r) => (r.serviceId && byId.get(r.serviceId)) || byName.get((r.productName || '').trim().toLowerCase()) || null;
//   }, [services]);
//   const categoryName = useMemo(() => new Map(serviceCategories.map((c) => [c.id, c.name])), [serviceCategories]);
//   const rowsWithCats = useMemo(() => invoices.map((inv) => ({ ...inv, categoryIds: [...new Set((inv.rows || []).map(categoryOfRow).filter(Boolean))] })), [invoices, categoryOfRow]);

//   const filtered = useMemo(() => {
//     const q = number.trim().toLowerCase();
//     return rowsWithCats
//       .filter((inv) => (!q || String(inv.number).toLowerCase().includes(q))
//         && (!accountIds.length || accountIds.includes(inv.accountId))
//         && (!categoryIds.length || inv.categoryIds.some((c) => categoryIds.includes(c))))
//       .sort((a, b) => (a.issueDate < b.issueDate ? 1 : a.issueDate > b.issueDate ? -1 : 0));
//   }, [rowsWithCats, number, accountIds, categoryIds]);

//   // a new list → page 1; forget selected rows that are filtered out or deleted
//   const listKey = filtered.map((x) => x.id).join(',');
//   useEffect(() => { setPage(1); setSelected((s) => { const ids = new Set(filtered.map((x) => x.id)); return new Set([...s].filter((id) => ids.has(id))); }); }, [listKey]); // eslint-disable-line react-hooks/exhaustive-deps

//   const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
//   const safePage = Math.min(page, pageCount);
//   const rows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
//   const chosen = filtered.filter((x) => selected.has(x.id));
//   const allOnPage = rows.length > 0 && rows.every((x) => selected.has(x.id));
//   const someOnPage = rows.some((x) => selected.has(x.id));
//   const toggle = (id) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
//   const togglePage = () => setSelected((s) => { const n = new Set(s); rows.forEach((x) => (allOnPage ? n.delete(x.id) : n.add(x.id))); return n; });
//   const filtersOn = number || accountIds.length || categoryIds.length;
//   const clearFilters = () => { setNumber(''); setAccountIds([]); setCategoryIds([]); setParams({}, { replace: true }); };

//   const sum = (list) => list.reduce((n, x) => n + x.total, 0);
//   const by = (s) => invoices.filter((x) => x.state === s);
//   const stats = [
//     ['Outstanding', money(sum([...by('sent'), ...by('overdue')])), `${by('sent').length + by('overdue').length} invoices`],
//     ['Overdue', money(sum(by('overdue'))), `${by('overdue').length} invoices`],
//     ['Paid', money(sum(by('paid'))), `${by('paid').length} invoices`],
//     ['Drafts', String(by('draft').length), 'not sent yet'],
//   ];

//   const download = async (x) => notify((await downloadInvoice(x)) ? `Downloaded Invoice-${x.number}.pdf` : 'Couldn’t create the PDF. Try Print → Save as PDF.');
//   const save = (form, { send }) => {
//     const rec = drawer?.invoice ? updateInvoice(form) : createInvoice(form, { send });
//     setDrawer(null);
//     notify(drawer?.invoice ? `Updated ${rec.number}` : `${send ? 'Sent' : 'Saved draft'} ${rec.number}`);
//   };

//   return (
//     <div className="space-y-6">
//       <div className="flex flex-wrap items-end justify-between gap-3">
//         <div>
//           <p className="text-sm text-muted-foreground">Billing / Invoices</p>
//           <h1 className="text-3xl font-semibold tracking-tight">Invoices</h1>
//           <p className="text-muted-foreground">Invoices for every account.</p>
//         </div>
//         <Button onClick={() => setDrawer({})}><Plus className="mr-1 h-4 w-4" aria-hidden="true" />New invoice</Button>
//       </div>

//       <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
//         {stats.map(([label, value, sub]) => (
//           <Card key={label}><CardContent className="p-4 sm:p-5">
//             <p className="text-sm text-muted-foreground">{label}</p>
//             <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
//             <p className="text-xs text-muted-foreground">{sub}</p>
//           </CardContent></Card>
//         ))}
//       </div>

//       <Card aria-label="All invoices">
//         {/* Filters */}
//         <div className="space-y-3 border-b p-4">
//           <div className="flex flex-wrap items-center gap-2">
//             <div className="relative w-full sm:w-64">
//               <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
//               <Input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="Invoice number" aria-label="Search by invoice number" className="pl-8" />
//             </div>
//             <CheckFilter label="Account name" searchable options={accounts.map((a) => ({ value: a.id, label: a.name }))} value={accountIds} onChange={setAccountIds} />
//             <CheckFilter label="Service categories" options={serviceCategories.map((c) => ({ value: c.id, label: c.name }))} value={categoryIds} onChange={setCategoryIds} />
//             {filtersOn ? <Button variant="ghost" size="sm" onClick={clearFilters}><X className="mr-1 h-4 w-4" aria-hidden="true" />Clear filters</Button> : null}
//           </div>
//           <p className="text-sm text-muted-foreground" aria-live="polite" data-testid="invoice-count">{filtered.length} of {invoices.length} invoices · {money(sum(filtered))}</p>
//         </div>

//         {/* Bulk */}
//         {chosen.length > 0 && (
//           <div role="region" aria-label="Selected rows" className="flex flex-wrap items-center gap-2 border-b bg-muted/50 px-4 py-2.5">
//             <span className="mr-2 text-sm font-medium">{chosen.length} selected</span>
//             <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setConfirm(chosen)}><Trash2 className="mr-1 h-4 w-4" aria-hidden="true" />Delete</Button>
//             <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setSelected(new Set())}><X className="mr-1 h-4 w-4" aria-hidden="true" />Clear</Button>
//           </div>
//         )}

//         <Table aria-label="Invoices">
//           <TableHeader>
//             <TableRow>
//               <TableHead className="w-10 pl-4"><Checkbox aria-label="Select all on this page" checked={allOnPage ? true : someOnPage ? 'indeterminate' : false} onCheckedChange={togglePage} /></TableHead>
//               <TableHead>Invoice</TableHead>
//               <TableHead>Account</TableHead>
//               <TableHead>Service categories</TableHead>
//               <TableHead>Issued</TableHead>
//               <TableHead>Due</TableHead>
//               <TableHead className="text-right">Amount</TableHead>
//               <TableHead>Status</TableHead>
//               <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead>
//             </TableRow>
//           </TableHeader>
//           <TableBody>
//             {rows.map((x) => {
//               const paid = x.state === 'paid';
//               return (
//                 <TableRow key={x.id} data-state={selected.has(x.id) ? 'selected' : undefined}>
//                   <TableCell className="pl-4"><Checkbox aria-label={`Select ${x.number}`} checked={selected.has(x.id)} onCheckedChange={() => toggle(x.id)} /></TableCell>
//                   <TableCell><Button variant="link" className="h-auto p-0 font-mono font-semibold" onClick={() => setDrawer({ invoice: x })}>{x.number}</Button></TableCell>
//                   <TableCell>
//                     <Button variant="link" className="h-auto p-0 text-foreground" onClick={() => navigate(`/clients/accounts/accountsdash/invoices/${x.accountId}`)}>{x.accountName}</Button>
//                     <div className="max-w-[220px] truncate text-xs text-muted-foreground" title={x.description}>{x.description}</div>
//                   </TableCell>
//                   <TableCell>
//                     <div className="flex flex-wrap gap-1">
//                       {x.categoryIds.length ? x.categoryIds.map((c) => <Badge key={c} variant="secondary" className="font-normal">{categoryName.get(c) || c}</Badge>) : <span className="text-muted-foreground">—</span>}
//                     </div>
//                   </TableCell>
//                   <TableCell className="whitespace-nowrap text-muted-foreground">{fmt(x.issueDate)}</TableCell>
//                   <TableCell className={cn('whitespace-nowrap', x.state === 'overdue' ? 'font-medium text-destructive' : 'text-muted-foreground')}>{fmt(x.dueDate)}</TableCell>
//                   <TableCell className="whitespace-nowrap text-right font-medium tabular-nums">{money(x.total)}</TableCell>
//                   <TableCell><Badge variant="outline" className={BADGE[x.state]}>{statusInfo(x.state).label}</Badge></TableCell>
//                   <TableCell>
//                     <DropdownMenu>
//                       <DropdownMenuTrigger asChild>
//                         <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Actions for ${x.number}`}><MoreHorizontal className="h-4 w-4" aria-hidden="true" /></Button>
//                       </DropdownMenuTrigger>
//                       <DropdownMenuContent align="end" className="w-52">
//                         <DropdownMenuItem onSelect={() => setDrawer({ invoice: x })}><Pencil className="mr-2 h-4 w-4" aria-hidden="true" />{paid ? 'View' : 'Edit'}</DropdownMenuItem>
//                         {/* Print / Download: paid invoices only */}
//                         <DropdownMenuItem disabled={!paid} onSelect={() => printInvoice(x)}>
//                           <Printer className="mr-2 h-4 w-4" aria-hidden="true" />Print{!paid && <span className="ml-auto text-xs">paid only</span>}
//                         </DropdownMenuItem>
//                         <DropdownMenuItem disabled={!paid} onSelect={() => download(x)}>
//                           <Download className="mr-2 h-4 w-4" aria-hidden="true" />Download{!paid && <span className="ml-auto text-xs">paid only</span>}
//                         </DropdownMenuItem>
//                         <DropdownMenuSeparator />
//                         <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => setConfirm([x])}><Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />Delete</DropdownMenuItem>
//                       </DropdownMenuContent>
//                     </DropdownMenu>
//                   </TableCell>
//                 </TableRow>
//               );
//             })}
//             {!filtered.length && (
//               <TableRow><TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
//                 {invoices.length ? <>No invoices match these filters. <Button variant="link" className="h-auto p-0" onClick={clearFilters}>Clear filters</Button></> : 'No invoices yet.'}
//               </TableCell></TableRow>
//             )}
//           </TableBody>
//         </Table>

//         {/* Pagination */}
//         {filtered.length > 0 && (
//           <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm text-muted-foreground">
//             <div className="flex items-center gap-2">
//               <span>Rows per page</span>
//               <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
//                 <SelectTrigger className="h-8 w-[72px]" aria-label="Rows per page"><SelectValue /></SelectTrigger>
//                 <SelectContent>{[10, 25, 50].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
//               </Select>
//             </div>
//             <span data-testid="page-range">{(safePage - 1) * pageSize + 1}–{Math.min(filtered.length, safePage * pageSize)} of {filtered.length}</span>
//             <div className="flex items-center gap-1">
//               <span className="mr-2">Page {safePage} of {pageCount}</span>
//               <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(safePage - 1)} disabled={safePage === 1} aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></Button>
//               <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(safePage + 1)} disabled={safePage === pageCount} aria-label="Next page"><ChevronRight className="h-4 w-4" /></Button>
//             </div>
//           </div>
//         )}
//       </Card>

//       {drawer && (
//         <AccountInvoiceDrawer accountId={drawer.invoice?.accountId || (accountIds.length === 1 ? accountIds[0] : '')} invoice={drawer.invoice || null}
//           nextNumber={nextInvoiceNumber} onClose={() => setDrawer(null)} onSave={save} />
//       )}

//       <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
//         <AlertDialogContent>
//           <AlertDialogHeader>
//             <AlertDialogTitle>{confirm?.length === 1 ? `Delete ${confirm[0].number}?` : `Delete ${confirm?.length} invoices?`}</AlertDialogTitle>
//             <AlertDialogDescription>The client{confirm?.length === 1 ? '' : 's'} will no longer see {confirm?.length === 1 ? 'this invoice' : 'these invoices'}. This can’t be undone.</AlertDialogDescription>
//           </AlertDialogHeader>
//           <ul className="max-h-40 list-disc overflow-y-auto pl-5 text-sm">{(confirm || []).map((x) => <li key={x.id}>{x.number} · {x.accountName} · {money(x.total)}</li>)}</ul>
//           <AlertDialogFooter>
//             <AlertDialogCancel>Cancel</AlertDialogCancel>
//             <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
//               onClick={() => { deleteInvoices(confirm); notify(`Deleted ${confirm.length} invoice${confirm.length === 1 ? '' : 's'}`); setConfirm(null); }}>
//               {confirm?.length === 1 ? 'Delete invoice' : 'Delete invoices'}
//             </AlertDialogAction>
//           </AlertDialogFooter>
//         </AlertDialogContent>
//       </AlertDialog>
// <ToastBridge message={toast} />
//       {/* {toast && <div role="status" className="fixed left-1/2 top-6 z-[100] -translate-x-1/2 rounded-md bg-foreground px-4 py-2.5 text-sm font-medium text-background shadow-lg">{toast}</div>} */}
//     </div>
//   );
// }

import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowDown, ArrowUp, ArrowUpDown, ChevronDown, Download, Filter, Plus, Printer, Receipt, Search, SearchX, Trash2, X,
} from 'lucide-react';

// shadcn components — one file each in src/components/ui
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../../components/ui/alert-dialog';
import { ToastBridge } from '../../components/ui/sonner';
// your table helpers
import { BulkBar, HeaderCheckbox, SelectCheckbox, useSelection } from '../../components/TableSelection';
import RowActionsMenu from '../../components/RowActionsMenu';
import Pagination, { usePagination } from '../../components/Pagination';

import AccountInvoiceDrawer from '../../components/invoices/AccountInvoiceDrawer';
import { useData } from '../../context/DataContext';
import { money } from '../../data/invoiceTemplates';
import { statusInfo } from '../../data/accountinvoices';

const fmtDate = (d) => (d ? new Date(`${String(d).slice(0, 10)}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—');
/** Status dot colours (same look as the Priority badge on the templates pages). */
const STATUS_DOT = { draft: 'bg-muted-foreground/50', sent: 'bg-blue-500', overdue: 'bg-red-500', paid: 'bg-emerald-500' };
const ORDER = ['draft', 'sent', 'overdue', 'paid'];
const SORT_VALUE = {
  number: (x) => Number(String(x.number).replace(/\D/g, '')) || 0,
  account: (x) => (x.accountName || '').toLowerCase(),
  status: (x) => ORDER.indexOf(x.state),
  issued: (x) => x.issueDate || '',
  due: (x) => x.dueDate || '',
  amount: (x) => Number(x.total) || 0,
};

/* ---------- small table helpers (same names and props as on your templates pages).
   If you already have shared versions, delete these and import yours. ---------- */
/** Sortable column header: click to sort, click again to reverse. sort = { col, dir } */
function SortHead({ label, col, sort, setSort, className = '' }) {
  const on = sort.col === col;
  const Icon = !on ? ArrowUpDown : sort.dir === 'asc' ? ArrowUp : ArrowDown;
  return (
    <TableHead className={className} aria-sort={on ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <Button variant="ghost" size="sm" className="-ml-3 h-8 gap-1.5" onClick={() => setSort((s) => ({ col, dir: s.col === col && s.dir === 'asc' ? 'desc' : 'asc' }))}>
        {label}<Icon className={`size-3.5 ${on ? '' : 'opacity-40'}`} aria-hidden="true" />
      </Button>
    </TableHead>
  );
}
/** Name cell: icon · name (opens the item) · one-line preview. */
function NameCell({ icon: Icon, name, preview, onOpen }) {
  return (
    <div className="flex items-start gap-2.5">
      {/* <span className="mt-0.5 flex size-8 flex-none items-center justify-center rounded-md bg-muted text-muted-foreground" aria-hidden="true"><Icon className="size-4" /></span> */}
      <div className="min-w-0">
        <button type="button" onClick={onOpen} className="font-mono font-semibold hover:text-primary hover:underline">{name}</button>
        {preview && <p className="truncate text-xs text-muted-foreground" title={preview}>{preview}</p>}
      </div>
    </div>
  );
}
const Dash = () => <span className="text-muted-foreground">—</span>;
/** Empty table message with an action. */
function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center gap-2 py-12 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground" aria-hidden="true"><Icon className="size-5" /></span>
      <p className="font-medium">{title}</p>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/** A filter button with a checkbox menu (optional search box for long lists). */
function CheckFilter({ label, options, value, onChange, searchable = false }) {
  const [q, setQ] = useState('');
  const shown = searchable && q.trim() ? options.filter((o) => o.label.toLowerCase().includes(q.trim().toLowerCase())) : options;
  const toggle = (v) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  return (
    <DropdownMenu onOpenChange={(o) => !o && setQ('')}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="h-9 border-dashed" aria-label={`Filter by ${label.toLowerCase()}`}>
          <Filter className="mr-1 size-4" aria-hidden="true" />{label}
          {value.length > 0 && <Badge variant="secondary" className="ml-1 rounded-sm px-1.5 font-normal">{value.length}</Badge>}
          <ChevronDown className="ml-1 size-4 opacity-50" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        {searchable && (
          <div className="px-2 pb-2">
            <Input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.stopPropagation()} placeholder={`Search ${label.toLowerCase()}`} aria-label={`Search ${label.toLowerCase()}`} className="h-8" />
          </div>
        )}
        <DropdownMenuSeparator />
        <div className="max-h-64 overflow-y-auto">
          {shown.map((o) => (
            <DropdownMenuCheckboxItem key={o.value} checked={value.includes(o.value)} onCheckedChange={() => toggle(o.value)} onSelect={(e) => e.preventDefault()}>{o.label}</DropdownMenuCheckboxItem>
          ))}
          {!shown.length && <p className="px-2 py-3 text-center text-sm text-muted-foreground">No matches</p>}
        </div>
        {value.length > 0 && (<><DropdownMenuSeparator /><DropdownMenuItem onSelect={() => onChange([])} className="justify-center">Clear</DropdownMenuItem></>)}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Billing → Invoices: every account's invoices.
 * Filters: invoice number · account name · service categories (from each invoice's line items).
 * Edit (AccountInvoiceDrawer) · Print / Download (paid invoices only) · Delete · bulk delete · sorting · pagination.
 * ?new=invoice opens "Create new Invoice"; ?account=<id> pre-sets the account filter.
 */
export default function BillingInvoices() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const {
    invoices = [], accounts = [], services = [], serviceCategories = [], nextInvoiceNumber,
    createInvoice, updateInvoice, deleteInvoices, printInvoice, downloadInvoice,
  } = useData();

  const [number, setNumber] = useState('');
  const [accountIds, setAccountIds] = useState(() => (params.get('account') ? [params.get('account')] : []));
  const [categoryIds, setCategoryIds] = useState([]);
  const [sort, setSort] = useState({ col: 'issued', dir: 'desc' });
  const [drawer, setDrawer] = useState(null);           // { invoice? }
  const [confirm, setConfirm] = useState(null);         // invoices to delete
  const [toast, setToast] = useState('');
  const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 2600); };
  const selection = useSelection();

  useEffect(() => {
    if (params.get('new') === 'invoice') { setDrawer({}); const n = new URLSearchParams(params); n.delete('new'); setParams(n, { replace: true }); }
  }, [params]); // eslint-disable-line react-hooks/exhaustive-deps

  /* service categories of an invoice = the categories of its line items' services (by id, else by name) */
  const categoryOfRow = useMemo(() => {
    const byId = new Map(services.map((s) => [s.id, s.categoryId]));
    const byName = new Map(services.map((s) => [s.name.trim().toLowerCase(), s.categoryId]));
    return (r) => (r.serviceId && byId.get(r.serviceId)) || byName.get((r.productName || '').trim().toLowerCase()) || null;
  }, [services]);
  const categoryName = useMemo(() => new Map(serviceCategories.map((c) => [c.id, c.name])), [serviceCategories]);

  const filtered = useMemo(() => {
    const q = number.trim().toLowerCase();
    const val = SORT_VALUE[sort.col];
    return invoices
      .map((inv) => ({ ...inv, categoryIds: [...new Set((inv.rows || []).map(categoryOfRow).filter(Boolean))] }))
      .filter((inv) => (!q || String(inv.number).toLowerCase().includes(q))
        && (!accountIds.length || accountIds.includes(inv.accountId))
        && (!categoryIds.length || inv.categoryIds.some((c) => categoryIds.includes(c))))
      .sort((a, b) => { const x = val(a); const y = val(b); return (x < y ? -1 : x > y ? 1 : 0) * (sort.dir === 'asc' ? 1 : -1); });
  }, [invoices, categoryOfRow, number, accountIds, categoryIds, sort]);

  // pagination (same as the templates pages); the chosen page size is remembered
  const paging = usePagination(filtered, { initialSize: 25, storageKey: 'billing-invoices' });
  const { pageItems: rows, setPage } = paging;
  const listKey = filtered.map((x) => x.id).join(',');
  const selected = filtered.filter((x) => selection.has(x.id));
  // drop selected rows that are filtered out or deleted
  useEffect(() => { const ids = new Set(filtered.map((x) => x.id)); const gone = invoices.filter((x) => selection.has(x.id) && !ids.has(x.id)).map((x) => x.id); if (gone.length) selection.setMany(gone, false); }, [listKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtersOn = number || accountIds.length || categoryIds.length;
  const reset = () => { setNumber(''); setAccountIds([]); setCategoryIds([]); setPage(1); setParams({}, { replace: true }); };
  const openNew = () => setDrawer({});
  const openEdit = (x) => setDrawer({ invoice: x });

  const sum = (list) => list.reduce((n, x) => n + x.total, 0);
  const by = (s) => invoices.filter((x) => x.state === s);
  const stats = [
    ['Outstanding', money(sum([...by('sent'), ...by('overdue')])), `${by('sent').length + by('overdue').length} invoices`],
    ['Overdue', money(sum(by('overdue'))), `${by('overdue').length} invoices`],
    ['Paid', money(sum(by('paid'))), `${by('paid').length} invoices`],
    ['Drafts', String(by('draft').length), 'not sent yet'],
  ];

  const download = async (x) => notify((await downloadInvoice(x)) ? `Downloaded Invoice-${x.number}.pdf` : 'Couldn’t create the PDF. Try Print → Save as PDF.');
  const save = (form, { send }) => {
    const rec = drawer?.invoice ? updateInvoice(form) : createInvoice(form, { send });
    setDrawer(null);
    notify(drawer?.invoice ? `Updated ${rec.number}` : `${send ? 'Sent' : 'Saved draft'} ${rec.number}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Billing / Invoices</p>
          <h1 className="text-3xl font-semibold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">Invoices for every account.</p>
        </div>
        <Button onClick={openNew}><Plus />New invoice</Button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(([label, value, sub]) => (
          <Card key={label}><CardContent className="p-4 sm:p-5">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
            <p className="text-xs text-muted-foreground">{sub}</p>
          </CardContent></Card>
        ))}
      </div>

      <Card aria-label="All invoices">
        {/* Filters */}
        <div className="space-y-3 border-b p-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" aria-hidden="true" />
              <Input value={number} onChange={(e) => { setNumber(e.target.value); setPage(1); }} placeholder="Invoice number" aria-label="Search by invoice number" className="pl-8" />
            </div>
            <CheckFilter label="Account name" searchable options={accounts.map((a) => ({ value: a.id, label: a.name }))} value={accountIds} onChange={(v) => { setAccountIds(v); setPage(1); }} />
            <CheckFilter label="Service categories" options={serviceCategories.map((c) => ({ value: c.id, label: c.name }))} value={categoryIds} onChange={(v) => { setCategoryIds(v); setPage(1); }} />
            {filtersOn ? <Button variant="ghost" size="sm" onClick={reset} className="text-muted-foreground">Reset<X /></Button> : null}
            <span className="ml-auto text-sm tabular-nums text-muted-foreground" aria-live="polite" data-testid="invoice-count">{filtered.length} of {invoices.length} invoices · {money(sum(filtered))}</span>
          </div>
        </div>

        <BulkBar count={selection.count} total={filtered.length}
          onSelectAll={() => selection.setMany(filtered.map((x) => x.id), true)} onClear={selection.clear}
          actions={<Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setConfirm(selected)}><Trash2 />Delete</Button>} />

        <div className="overflow-x-auto">
          <Table className="min-w-[1080px]" aria-label="Invoices">
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"><HeaderCheckbox selection={selection} pageIds={rows.map((x) => x.id)} /></TableHead>
                <SortHead label="Invoice" col="number" sort={sort} setSort={setSort} />
                <SortHead label="Account" col="account" sort={sort} setSort={setSort} />
                <TableHead>Service categories</TableHead>
                <SortHead label="Status" col="status" sort={sort} setSort={setSort} />
                <SortHead label="Issued" col="issued" sort={sort} setSort={setSort} />
                <SortHead label="Due" col="due" sort={sort} setSort={setSort} />
                <SortHead label="Amount" col="amount" sort={sort} setSort={setSort} className="text-right" />
                <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((x) => {
                const checked = selection.has(x.id);
                const paid = x.state === 'paid';
                return (
                  <TableRow key={x.id} data-state={checked ? 'selected' : undefined}>
                    <TableCell><SelectCheckbox label={`Select ${x.number}`} checked={checked} onChange={() => selection.toggle(x.id)} /></TableCell>
                    <TableCell className="max-w-[280px]">
                      <NameCell icon={Receipt} name={x.number} preview={x.description} onOpen={() => openEdit(x)} />
                    </TableCell>
                    <TableCell>
                      <button type="button" className="text-left font-medium hover:text-primary hover:underline" onClick={() => navigate(`/clients/accounts/accountsdash/invoices/${x.accountId}`)}>{x.accountName}</button>
                    </TableCell>
                    <TableCell>
                      {x.categoryIds.length
                        ? <div className="flex flex-wrap gap-1">{x.categoryIds.map((c) => <Badge key={c} variant="secondary" className="font-normal">{categoryName.get(c) || c}</Badge>)}</div>
                        : <Dash />}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1.5 font-medium">
                        <span className={`size-1.5 rounded-full ${STATUS_DOT[x.state] || 'bg-muted-foreground/50'}`} aria-hidden="true" />{statusInfo(x.state).label}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{fmtDate(x.issueDate)}</TableCell>
                    <TableCell className={`whitespace-nowrap text-sm ${x.state === 'overdue' ? 'font-medium text-destructive' : 'text-muted-foreground'}`}>{fmtDate(x.dueDate)}</TableCell>
                    <TableCell className="whitespace-nowrap text-right font-medium tabular-nums">{money(x.total)}</TableCell>
                    <TableCell className="text-right">
                      <RowActionsMenu label={x.number} onEdit={() => openEdit(x)} onDelete={() => setConfirm([x])}
                        extra={paid ? [   // Print / Download: paid invoices only
                          { label: 'Print', icon: Printer, onClick: () => printInvoice(x) },
                          { label: 'Download', icon: Download, onClick: () => download(x) },
                        ] : []} />
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={9}>
                    {invoices.length ? (
                      <EmptyState icon={SearchX} title="No invoices match" description="Try a different invoice number or remove some filters."
                        action={<Button variant="outline" onClick={reset}>Clear filters</Button>} />
                    ) : (
                      <EmptyState icon={Receipt} title="No invoices yet" description="Create an invoice for an account, or start from an invoice template."
                        action={<Button onClick={openNew}><Plus />New invoice</Button>} />
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination (same as the templates pages) */}
        {filtered.length > 0 && <Pagination {...paging} label="invoices" />}
      </Card>

      {drawer && (
        <AccountInvoiceDrawer accountId={drawer.invoice?.accountId || (accountIds.length === 1 ? accountIds[0] : '')} invoice={drawer.invoice || null}
          nextNumber={nextInvoiceNumber} onClose={() => setDrawer(null)} onSave={save} />
      )}

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm?.length === 1 ? `Delete ${confirm[0].number}?` : `Delete ${confirm?.length} invoices?`}</AlertDialogTitle>
            <AlertDialogDescription>The client{confirm?.length === 1 ? '' : 's'} will no longer see {confirm?.length === 1 ? 'this invoice' : 'these invoices'}. This can’t be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <ul className="max-h-40 list-disc overflow-y-auto pl-5 text-sm">{(confirm || []).map((x) => <li key={x.id}>{x.number} · {x.accountName} · {money(x.total)}</li>)}</ul>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { deleteInvoices(confirm); selection.setMany(confirm.map((x) => x.id), false); notify(`Deleted ${confirm.length} invoice${confirm.length === 1 ? '' : 's'}`); setConfirm(null); }}>
              {confirm?.length === 1 ? 'Delete invoice' : 'Delete invoices'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
 <ToastBridge message={toast} />
      {/* {toast && <div role="status" className="fixed left-1/2 top-6 z-[100] -translate-x-1/2 rounded-md bg-foreground px-4 py-2.5 text-sm font-medium text-background shadow-lg">{toast}</div>} */}
    </div>
  );
}