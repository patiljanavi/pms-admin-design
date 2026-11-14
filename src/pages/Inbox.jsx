import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Bell, Briefcase, Building2, CheckCheck, ClipboardList, ExternalLink, FileSignature, ListChecks, Mail, MailOpen, MessageSquare,
  MoreHorizontal, Receipt, Search, SearchX, Trash2, UserRound, UsersRound, Wallet, X,
} from 'lucide-react';
import Pagination, { usePagination } from '../components/Pagination';
import { BulkBar, HeaderCheckbox, SelectCheckbox, barButton, barDanger, useSelection } from '../components/TableSelection';
import { Modal } from '../components/ui';
// shadcn components
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from '../components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { ToastBridge } from '../components/ui/sonner';
import { useData } from '../context/DataContext';
import { NOTIFICATION_TYPES, dayGroup, timeAgo } from '../data/notifications';
import { cn } from 'lib/utils';

const ICONS = {
  account: Building2, contact: UserRound, invoice: Receipt, payment: Wallet, proposal: FileSignature,
  task: ListChecks, job: Briefcase, chat: MessageSquare, organizer: ClipboardList, team: UsersRound,
};
const GROUPS = ['Today', 'Yesterday', 'This week', 'Earlier'];
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

/**
 * Inbox+ — notifications (new accounts, invoices, payments, proposals, tasks, chats, …).
 * All / Unread (?view=unread) · type filter · search · grouped by day · click to open (marks read) ·
 * mark read / unread · delete (asks first) · bulk actions · pagination.
 * Uses DataContext: notifications, unreadNotifications, markNotificationsRead, markAllNotificationsRead, deleteNotifications.
 */
export default function Inbox() {
  const navigate = useNavigate();
  const { notifications = [], unreadNotifications = 0, markNotificationsRead, markAllNotificationsRead, deleteNotifications } = useData();
  const [params, setParams] = useSearchParams();
  const view = params.get('view') === 'unread' ? 'unread' : 'all';
  const setView = (v) => { setParams((prev) => { const n = new URLSearchParams(prev); n.set('view', v); return n; }, { replace: true }); paging.setPage(1); };
  const [type, setType] = useState('all');
  const [q, setQ] = useState('');
  const [confirm, setConfirm] = useState(null);         // notifications to delete
  const [toast, setToast] = useState('');
  const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 2600); };
  const selection = useSelection();

  const s = q.trim().toLowerCase();
  const filtered = useMemo(() => notifications
    .filter((n) => (view === 'all' || !n.read) && (type === 'all' || n.type === type)
      && (!s || `${n.title} ${n.body} ${n.actor || ''}`.toLowerCase().includes(s)))
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')), [notifications, view, type, s]);
  const paging = usePagination(filtered, { initialSize: 20, storageKey: 'inbox' });
  const rows = paging.pageItems;
  const groups = GROUPS.map((g) => [g, rows.filter((n) => dayGroup(n.createdAt) === g)]).filter(([, list]) => list.length);
  const typesInUse = Object.keys(NOTIFICATION_TYPES).filter((t) => notifications.some((n) => n.type === t));
  const selected = notifications.filter((n) => selection.has(n.id));
  const filtersOn = !!(s || type !== 'all');
  const reset = () => { setQ(''); setType('all'); paging.setPage(1); };

  const open = (n) => { if (!n.read) markNotificationsRead([n.id]); if (n.link) navigate(n.link); };
  const setRead = (items, read) => { markNotificationsRead(items.map((n) => n.id), read); notify(`Marked ${plural(items.length, 'notification')} as ${read ? 'read' : 'unread'}`); };
  const doDelete = () => {
    deleteNotifications(confirm.map((n) => n.id));
    selection.setMany(confirm.map((n) => n.id), false);
    notify(`Deleted ${plural(confirm.length, 'notification')}`);
    setConfirm(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight">Inbox
            {unreadNotifications > 0 && <Badge className="rounded-full px-2 text-xs tabular-nums" data-testid="unread-badge">{unreadNotifications}</Badge>}
          </h1>
          <p className="text-muted-foreground">{unreadNotifications ? `${unreadNotifications} unread · ` : 'All caught up · '}what’s happening across your accounts and team.</p>
        </div>
        <Button variant="outline" onClick={() => { markAllNotificationsRead(); notify('All notifications marked as read'); }} disabled={!unreadNotifications}>
          <CheckCheck />Mark all as read
        </Button>
      </div>

      <Card>
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b p-4">
          <div role="tablist" aria-label="Inbox views" className="inline-flex rounded-lg border bg-muted/40 p-0.5">
            {[['all', 'All', notifications.length], ['unread', 'Unread', unreadNotifications]].map(([key, label, count]) => (
              <button key={key} type="button" role="tab" aria-selected={view === key} onClick={() => setView(key)}
                className={cn('inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors',
                  view === key ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
                {label}<span className="tabular-nums text-muted-foreground">{count}</span>
              </button>
            ))}
          </div>
          <Select value={type} onValueChange={(v) => { setType(v); paging.setPage(1); }}>
            <SelectTrigger aria-label="Filter by type" className="h-9 w-auto min-w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectSeparator />
              {typesInUse.map((t) => <SelectItem key={t} value={t}>{NOTIFICATION_TYPES[t].label}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" aria-hidden="true" />
            <Input value={q} onChange={(e) => { setQ(e.target.value); paging.setPage(1); }} placeholder="Search notifications" aria-label="Search notifications" className="pl-8" />
          </div>
          {filtersOn && <Button variant="ghost" size="sm" onClick={reset} className="text-muted-foreground">Reset<X /></Button>}
          {rows.length > 0 && (
            <label className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
              <HeaderCheckbox selection={selection} pageIds={rows.map((n) => n.id)} />Select page
            </label>
          )}
        </div>

        <BulkBar count={selection.count} total={filtered.length}
          onSelectAll={() => selection.setMany(filtered.map((n) => n.id), true)} onClear={selection.clear}
          actions={<>
            <button type="button" className={barButton} onClick={() => setRead(selected, true)}><MailOpen aria-hidden="true" />Mark as read</button>
            <button type="button" className={barButton} onClick={() => setRead(selected, false)}><Mail aria-hidden="true" />Mark as unread</button>
            <button type="button" className={barDanger} onClick={() => setConfirm(selected)}><Trash2 aria-hidden="true" />Delete</button>
          </>} />

        {/* List, grouped by day */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground" aria-hidden="true">{filtersOn ? <SearchX className="size-5" /> : <Bell className="size-5" />}</span>
            <p className="font-medium">{filtersOn ? 'No notifications match' : view === 'unread' ? 'You’re all caught up' : 'No notifications yet'}</p>
            <p className="text-sm text-muted-foreground">{filtersOn ? 'Try a different search or type.' : 'New accounts, invoices, payments and more will show here.'}</p>
            {filtersOn && <Button variant="outline" className="mt-2" onClick={reset}>Clear filters</Button>}
          </div>
        ) : (
          <div aria-label="Notifications">
            {groups.map(([g, list]) => (
              <section key={g} aria-label={g}>
                <h2 className="border-b bg-muted/40 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{g}</h2>
                <ul className="divide-y">
                  {list.map((n) => {
                    const Icon = ICONS[n.type] || Bell;
                    const meta = NOTIFICATION_TYPES[n.type] || { tone: 'bg-muted text-muted-foreground', label: n.type };
                    const checked = selection.has(n.id);
                    return (
                      <li key={n.id} data-testid="notification" data-read={n.read ? 'true' : 'false'}
                        className={cn('group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/40', !n.read && 'bg-primary/[0.03]', checked && 'bg-accent')}>
                        <span className="pt-1"><SelectCheckbox label={`Select ${n.title}`} checked={checked} onChange={() => selection.toggle(n.id)} /></span>
                        <span className={cn('mt-0.5 flex size-9 flex-none items-center justify-center rounded-full', meta.tone)} aria-hidden="true"><Icon className="size-4" /></span>
                        <button type="button" onClick={() => open(n)} className="min-w-0 flex-1 text-left" aria-label={`${n.title}: ${n.body}${n.read ? '' : ' (unread)'}`}>
                          <p className={cn('text-sm', n.read ? 'text-foreground' : 'font-semibold text-foreground')}>{n.title}</p>
                          <p className="truncate text-sm text-muted-foreground" title={n.body}>{n.body}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{n.actor ? `${n.actor} · ` : ''}{meta.label} · <time dateTime={n.createdAt}>{timeAgo(n.createdAt)}</time></p>
                        </button>
                        {!n.read && <span className="mt-2 size-2 flex-none rounded-full bg-primary" aria-hidden="true" />}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 flex-none" aria-label={`Actions for ${n.title}`}><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {n.link && <DropdownMenuItem onSelect={() => open(n)}><ExternalLink className="mr-2 h-4 w-4" />Open</DropdownMenuItem>}
                            {n.read
                              ? <DropdownMenuItem onSelect={() => setRead([n], false)}><Mail className="mr-2 h-4 w-4" />Mark as unread</DropdownMenuItem>
                              : <DropdownMenuItem onSelect={() => setRead([n], true)}><MailOpen className="mr-2 h-4 w-4" />Mark as read</DropdownMenuItem>}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => setConfirm([n])}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
        {filtered.length > 0 && <Pagination {...paging} label="notifications" />}
      </Card>

      {confirm && (
        <Modal title={`Delete ${plural(confirm.length, 'notification')}?`} description="They’re removed from your inbox." onClose={() => setConfirm(null)}
          footer={<>
            <Button variant="outline" onClick={() => setConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={doDelete}><Trash2 />Delete {plural(confirm.length, 'notification')}</Button>
          </>}>
          <ul className="max-h-48 divide-y overflow-y-auto rounded-lg border">
            {confirm.map((n) => <li key={n.id} className="px-3 py-2 text-sm"><span className="font-medium">{n.title}</span> <span className="text-muted-foreground">· {n.body}</span></li>)}
          </ul>
        </Modal>
      )}
      <ToastBridge message={toast} />
    </div>
  );
}
