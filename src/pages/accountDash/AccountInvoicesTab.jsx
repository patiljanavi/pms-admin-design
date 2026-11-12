import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { CheckCircle2, ChevronLeft, ChevronRight, Download, FileText, MoreHorizontal, Pencil, Plus, Printer, RotateCcw, Send, Trash2, X } from 'lucide-react';
import { ToastBridge } from '../../components/ui/sonner';
// shadcn components — one file each in src/components/ui
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent } from '../../components/ui/card';
import { Checkbox } from '../../components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../../components/ui/alert-dialog';

import AccountInvoiceDrawer from '../../components/invoices/AccountInvoiceDrawer';
import { useData } from '../../context/DataContext';
import { money } from '../../data/invoiceTemplates';
import { statusInfo } from '../../data/accountinvoices';

const PAGE_SIZE = 10;
const cn = (...c) => c.filter(Boolean).join(' ');
const fmt = (d) => (d ? new Date(`${String(d).slice(0, 10)}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—');
const BADGE = {
  draft: 'border-transparent bg-muted text-muted-foreground',
  sent: 'border-transparent bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  overdue: 'border-transparent bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  paid: 'border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
};

/**
 * Account → Invoices tab (shadcn): this account's invoices.
 * Create / Edit (AccountInvoiceDrawer) · Print · Download (PDF) · Send · Mark as paid · Delete · bulk actions · pagination.
 * Uses DataContext: invoices, nextInvoiceNumber, createInvoice, updateInvoice, deleteInvoices, setInvoiceStatus, printInvoice, downloadInvoice.
 */
export default function AccountInvoicesTab() {
  const { account } = useOutletContext();
  const { invoices = [], nextInvoiceNumber, createInvoice, updateInvoice, deleteInvoices, setInvoiceStatus, printInvoice, downloadInvoice } = useData();
  const mine = useMemo(() => invoices.filter((x) => x.accountId === account.id).sort((a, b) => (a.issueDate < b.issueDate ? 1 : -1)), [invoices, account.id]);
  const [drawer, setDrawer] = useState(null);          // { invoice? }
  const [confirm, setConfirm] = useState(null);        // invoices to delete
  const [selected, setSelected] = useState(() => new Set());
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState('');
  const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 2600); };

  const pageCount = Math.max(1, Math.ceil(mine.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const rows = mine.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  useEffect(() => { setSelected(new Set()); setPage(1); }, [account.id]);
  const chosen = mine.filter((x) => selected.has(x.id));
  const allOnPage = rows.length > 0 && rows.every((x) => selected.has(x.id));
  const someOnPage = rows.some((x) => selected.has(x.id));
  const toggle = (id) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const togglePage = () => setSelected((s) => { const n = new Set(s); rows.forEach((x) => (allOnPage ? n.delete(x.id) : n.add(x.id))); return n; });
  const unselect = (items) => setSelected((s) => { const n = new Set(s); items.forEach((x) => n.delete(x.id)); return n; });

  const sum = (list) => list.reduce((n, x) => n + x.total, 0);
  const stats = [
    ['Outstanding', money(sum(mine.filter((x) => x.state === 'sent' || x.state === 'overdue')))],
    ['Overdue', money(sum(mine.filter((x) => x.state === 'overdue')))],
    ['Paid', money(sum(mine.filter((x) => x.state === 'paid')))],
  ];
  const status = (items, s, msg) => { setInvoiceStatus(items, s); notify(msg); };
  const download = async (x) => notify((await downloadInvoice(x)) ? `Downloaded Invoice-${x.number}.pdf` : 'Couldn’t create the PDF. Try Print → Save as PDF.');
  const save = (form, { send }) => {
    const rec = drawer?.invoice ? updateInvoice(form) : createInvoice(form, { send });
    setDrawer(null);
    notify(drawer?.invoice ? `Updated ${rec.number}` : `${send ? 'Sent' : 'Saved draft'} ${rec.number}`);
  };

  return (
    <section className="space-y-4" aria-label="Invoices">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="grid flex-1 grid-cols-3 gap-3 sm:max-w-xl">
          {stats.map(([label, value]) => (
            <Card key={label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="text-lg font-semibold tabular-nums">{value}</p></CardContent></Card>
          ))}
        </div>
        <Button onClick={() => setDrawer({})}><Plus className="mr-1 h-4 w-4" aria-hidden="true" />Create invoice</Button>
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
              <TableHead>Invoice</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Issued</TableHead>
              <TableHead>Due</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((x) => (
              <TableRow key={x.id} data-state={selected.has(x.id) ? 'selected' : undefined}>
                <TableCell className="pl-4"><Checkbox aria-label={`Select ${x.number}`} checked={selected.has(x.id)} onCheckedChange={() => toggle(x.id)} /></TableCell>
                <TableCell><Button variant="link" className="h-auto p-0 font-mono font-semibold" onClick={() => setDrawer({ invoice: x })}>{x.number}</Button></TableCell>
                <TableCell className="max-w-[280px]">
                  <div className="truncate" title={x.description}>{x.description}</div>
                  <div className="text-xs text-muted-foreground">{(x.rows || []).length} line item{(x.rows || []).length === 1 ? '' : 's'}</div>
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">{fmt(x.issueDate)}</TableCell>
                <TableCell className={cn('whitespace-nowrap', x.state === 'overdue' ? 'font-medium text-destructive' : 'text-muted-foreground')}>{fmt(x.dueDate)}</TableCell>
                <TableCell className="whitespace-nowrap text-right font-medium tabular-nums">{money(x.total)}</TableCell>
                <TableCell><Badge variant="outline" className={BADGE[x.state]}>{statusInfo(x.state).label}</Badge></TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Actions for ${x.number}`}><MoreHorizontal className="h-4 w-4" aria-hidden="true" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
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
              <TableRow><TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                <span className="inline-flex items-center gap-2"><FileText className="h-4 w-4" aria-hidden="true" />No invoices for {account.name} yet.</span>
              </TableCell></TableRow>
            )}
          </TableBody>
        </Table>

        {mine.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm text-muted-foreground">
            <span data-testid="page-range">{(safePage - 1) * PAGE_SIZE + 1}–{Math.min(mine.length, safePage * PAGE_SIZE)} of {mine.length} invoices</span>
            <div className="flex items-center gap-1">
              <span className="mr-2">Page {safePage} of {pageCount}</span>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(safePage - 1)} disabled={safePage === 1} aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(safePage + 1)} disabled={safePage === pageCount} aria-label="Next page"><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}
      </Card>

      {drawer && (
        <AccountInvoiceDrawer accountId={account.id} invoice={drawer.invoice || null} nextNumber={nextInvoiceNumber} onClose={() => setDrawer(null)} onSave={save} />
      )}

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm?.length === 1 ? `Delete ${confirm[0].number}?` : `Delete ${confirm?.length} invoices?`}</AlertDialogTitle>
            <AlertDialogDescription>The client will no longer see {confirm?.length === 1 ? 'this invoice' : 'these invoices'}. This can’t be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <ul className="max-h-40 list-disc overflow-y-auto pl-5 text-sm">{(confirm || []).map((x) => <li key={x.id}>{x.number} · {money(x.total)}</li>)}</ul>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { deleteInvoices(confirm); unselect(confirm); notify(`Deleted ${confirm.length} invoice${confirm.length === 1 ? '' : 's'}`); setConfirm(null); }}>
              {confirm?.length === 1 ? 'Delete invoice' : 'Delete invoices'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ToastBridge message={toast} />
    </section>
  );
}