import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MoreHorizontal, Pencil, Plus, RotateCcw, Search, Trash2, UserMinus, UserPlus, UsersRound, UserRound, UserX } from 'lucide-react';
import { SubTabs } from '../../components/TabNav';
import Pagination, { usePagination } from '../../components/Pagination';
import { Avatar, initials } from '../../components/ui';
import { EmptyState } from '../../components/page';
// shadcn components
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../../components/ui/dropdown-menu';
// import {
//   AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
// } from '../../components/ui/alert-dialog';
import { ToastBridge } from '../../components/ui/sonner';
import TeamMemberDrawer from '../../components/team/TeamMemberDrawer';
import GroupDrawer from '../../components/team/GroupDrawer';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { DISABLED_PERMISSIONS, PERMISSIONS, grantedCount } from '../../data/team';
import { Modal } from '../../components/ui';
const fmt = (d) => (d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—');
const AVAILABLE = PERMISSIONS.filter((p) => !DISABLED_PERMISSIONS.has(p.key)).length;
const Dash = () => <span className="text-muted-foreground/60">—</span>;

function Person({ name, email, you }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar text={initials(name)} size="sm" />
      <div className="min-w-0">
        <div className="flex items-center gap-2 font-medium">{name}{you && <Badge variant="secondary" className="font-normal">You</Badge>}</div>
        {email && <div className="truncate text-xs text-muted-foreground">{email}</div>}
      </div>
    </div>
  );
}
function RowMenu({ label, children }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Actions for ${label}`}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
      <DropdownMenuContent align="end">{children}</DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Templates → Teams & Plans: Active members · Deactivated members · Groups (child tabs like Workflow, ?view=).
 * The logged-in admin is listed first in Active members. Uses DataContext: teamMembers, groups, groupOf,
 * inviteTeamMember / updateTeamMember (TeamMemberDrawer), deactivateTeamMembers, reactivateTeamMembers, deleteTeamMembers,
 * createGroup / updateGroup (GroupDrawer), deleteGroup.
 */
export default function TeamsPage() {
  const { user } = useAuth() || {};
  const { teamMembers = [], groups = [], groupOf, deactivateTeamMembers, reactivateTeamMembers, deleteTeamMembers, deleteGroup } = useData();
  const [params, setParams] = useSearchParams();
  const view = ['deactivated', 'groups'].includes(params.get('view')) ? params.get('view') : 'active';
  const setView = (v) => setParams((prev) => { const n = new URLSearchParams(prev); n.set('view', v); return n; }, { replace: true });
  const [q, setQ] = useState('');
  const [memberDrawer, setMemberDrawer] = useState(null);       // { member? }
  const [groupDrawer, setGroupDrawer] = useState(null);         // { group? }
  const [confirm, setConfirm] = useState(null);                 // { kind: 'deactivate' | 'delete' | 'deleteGroup', item }
  const [toast, setToast] = useState('');
  const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 2600); };

  const active = teamMembers.filter((m) => m.status !== 'deactivated');
  const deactivated = teamMembers.filter((m) => m.status === 'deactivated');
  const s = q.trim().toLowerCase();
  const match = (m) => !s || `${m.name} ${m.email} ${m.title || ''}`.toLowerCase().includes(s);
  const nameOf = (id) => teamMembers.find((m) => m.id === id)?.name || 'Unknown';
  const shownGroups = useMemo(() => groups.filter((g) => !s || `${g.name} ${nameOf(g.leaderId)} ${g.memberIds.map(nameOf).join(' ')}`.toLowerCase().includes(s)), [groups, s, teamMembers]); // eslint-disable-line react-hooks/exhaustive-deps
  const admin = user?.name ? { name: user.name, email: user.email } : null;
  // rows per table (the logged-in admin stays first in Active members), then 10 per page
  const activeRows = [...(admin && (!s || `${admin.name} ${admin.email}`.toLowerCase().includes(s)) ? [{ id: '__admin', admin: true, ...admin }] : []), ...active.filter(match)];
  const deactivatedRows = deactivated.filter(match);
  const activePaging = usePagination(activeRows, { initialSize: 10, storageKey: 'team-active' });
  const deactivatedPaging = usePagination(deactivatedRows, { initialSize: 10, storageKey: 'team-deactivated' });
  const groupsPaging = usePagination(shownGroups, { initialSize: 10, storageKey: 'team-groups' });
  const search = (v) => { setQ(v); activePaging.setPage(1); deactivatedPaging.setPage(1); groupsPaging.setPage(1); };

  const doConfirm = () => {
    const { kind, item } = confirm;
    if (kind === 'deactivate') {
      const res = deactivateTeamMembers([item.id]);
      if (res.blocked.length) notify(`${item.name} leads “${res.blocked[0].group.name}”. Choose another leader for that group first.`);
      else notify(`${item.name} was deactivated`);
    } else if (kind === 'delete') { deleteTeamMembers([item.id]); notify(`${item.name} was deleted`); } else { deleteGroup(item.id); notify(`Group “${item.name}” deleted`); }
    setConfirm(null);
  };
  const confirmText = confirm && {
    deactivate: [`Deactivate ${confirm.item.name}?`, 'They can no longer sign in, are removed from their group and can’t be assigned to work. You can reactivate them later.', 'Deactivate'],
    delete: [`Delete ${confirm.item.name}?`, 'They are removed from your team for good. This can’t be undone.', 'Delete'],
    deleteGroup: [`Delete group “${confirm.item.name}”?`, 'Its people stay on the team, without a group.', 'Delete group'],
  }[confirm.kind];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Templates / Teams &amp; Plans</p>
          <h1 className="text-3xl font-semibold tracking-tight">Teams &amp; Plans</h1>
          <p className="text-muted-foreground">Invite teammates, set what they can do, and organize them into groups.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setGroupDrawer({})}><UsersRound className="mr-1 h-4 w-4" aria-hidden="true" />Create Group</Button>
          <Button onClick={() => setMemberDrawer({})}><UserPlus className="mr-1 h-4 w-4" aria-hidden="true" />Add Team Member</Button>
        </div>
      </div>

      <SubTabs label="Team views" value={view} onChange={setView}
        tabs={[
          { key: 'active', label: 'Active members', icon: UserRound, count: active.length + (admin ? 1 : 0) },
          { key: 'deactivated', label: 'Deactivated members', icon: UserX, count: deactivated.length },
          { key: 'groups', label: 'Groups', icon: UsersRound, count: groups.length },
        ]} />

      <div className="relative w-full sm:w-80">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <Input value={q} onChange={(e) => search(e.target.value)} placeholder={view === 'groups' ? 'Search groups or people…' : 'Search name or email…'} aria-label="Search team" className="pl-8" />
      </div>

      {view === 'active' && (
        <section role="tabpanel" aria-label="Active members">
          <Card className="overflow-x-auto">
            <Table aria-label="Active members" className="min-w-[860px]">
              <TableHeader><TableRow>
                <TableHead className="pl-4">Name</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead>
                <TableHead>Group</TableHead><TableHead>Access rights</TableHead><TableHead>Invited</TableHead><TableHead className="w-12"><span className="sr-only">Actions</span></TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {activePaging.pageItems.map((m) => (m.admin ? (
                  <TableRow key="__admin">
                    <TableCell className="pl-4"><Person name={admin.name} email={admin.email} you /></TableCell>
                    <TableCell><Badge variant="outline">Admin</Badge></TableCell>
                    <TableCell><Badge variant="outline" className="border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">Active</Badge></TableCell>
                    <TableCell><Dash /></TableCell>
                    <TableCell className="text-sm text-muted-foreground">All</TableCell>
                    <TableCell><Dash /></TableCell>
                    <TableCell />
                  </TableRow>
                ) : (() => {
                  const g = groupOf(m.id);
                  return (
                    <TableRow key={m.id}>
                      <TableCell className="pl-4"><Person name={m.name} email={m.email} /></TableCell>
                      <TableCell><Badge variant="outline">{m.role === 'admin' ? 'Admin' : 'Employee'}</Badge></TableCell>
                      <TableCell>{m.status === 'invited'
                        ? <Badge variant="outline" className="border-transparent bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">Invited</Badge>
                        : <Badge variant="outline" className="border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">Active</Badge>}</TableCell>
                      <TableCell className="text-sm">{g ? <>{g.name}{g.leaderId === m.id && <span className="ml-1 text-xs text-muted-foreground">(leader)</span>}</> : <Dash />}</TableCell>
                      <TableCell className="text-sm tabular-nums text-muted-foreground">{grantedCount(m)} of {AVAILABLE}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{fmt(m.invitedAt)}</TableCell>
                      <TableCell>
                        <RowMenu label={m.name}>
                          <DropdownMenuItem onSelect={() => setMemberDrawer({ member: m })}><Pencil className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => setConfirm({ kind: 'deactivate', item: m })}><UserMinus className="mr-2 h-4 w-4" />Deactivate</DropdownMenuItem>
                        </RowMenu>
                      </TableCell>
                    </TableRow>
                  );
                })()))}
                {!activeRows.length && (
                  <TableRow><TableCell colSpan={7}><EmptyState icon={UserPlus} title={s ? 'No one matches' : 'No team members yet'} description={s ? 'Try a different name or email.' : 'Invite your first teammate.'} /></TableCell></TableRow>
                )}
              </TableBody>
            </Table>
            {activeRows.length > 0 && <Pagination {...activePaging} label="members" />}
          </Card>
        </section>
      )}

      {view === 'deactivated' && (
        <section role="tabpanel" aria-label="Deactivated members">
          <Card className="overflow-x-auto">
            <Table aria-label="Deactivated members" className="min-w-[640px]">
              <TableHeader><TableRow>
                <TableHead className="pl-4">Name</TableHead><TableHead>Role</TableHead><TableHead>Deactivated</TableHead><TableHead className="w-12"><span className="sr-only">Actions</span></TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {deactivatedPaging.pageItems.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="pl-4"><Person name={m.name} email={m.email} /></TableCell>
                    <TableCell><Badge variant="outline">{m.role === 'admin' ? 'Admin' : 'Employee'}</Badge></TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{fmt(m.deactivatedAt)}</TableCell>
                    <TableCell>
                      <RowMenu label={m.name}>
                        <DropdownMenuItem onSelect={() => { reactivateTeamMembers([m.id]); notify(`${m.name} is active again`); }}><RotateCcw className="mr-2 h-4 w-4" />Reactivate</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => setConfirm({ kind: 'delete', item: m })}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                      </RowMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {!deactivatedRows.length && (
                  <TableRow><TableCell colSpan={4}><EmptyState icon={UserX} title={s ? 'No one matches' : 'No deactivated members'} description="People you deactivate show here; you can reactivate them anytime." /></TableCell></TableRow>
                )}
              </TableBody>
            </Table>
            {deactivatedRows.length > 0 && <Pagination {...deactivatedPaging} label="members" />}
          </Card>
        </section>
      )}

      {view === 'groups' && (
        <section role="tabpanel" aria-label="Groups">
          <Card className="overflow-x-auto">
            <Table aria-label="Groups" className="min-w-[760px]">
              <TableHeader><TableRow>
                <TableHead className="pl-4">Group name</TableHead><TableHead>Leader</TableHead><TableHead>Members</TableHead><TableHead>Created</TableHead><TableHead className="w-12"><span className="sr-only">Actions</span></TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {groupsPaging.pageItems.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell className="pl-4 font-medium">{g.name}</TableCell>
                    <TableCell><Person name={nameOf(g.leaderId)} /></TableCell>
                    <TableCell>
                      {g.memberIds.length ? (
                        <span className="flex items-center gap-2" title={g.memberIds.map(nameOf).join(', ')}>
                          <span className="flex -space-x-1.5">{g.memberIds.slice(0, 4).map((id) => <span key={id} className="rounded-full ring-2 ring-card"><Avatar text={initials(nameOf(id))} size="xs" /></span>)}</span>
                          <span className="text-sm text-muted-foreground">{g.memberIds.length} member{g.memberIds.length === 1 ? '' : 's'}</span>
                        </span>
                      ) : <span className="text-sm text-muted-foreground">No members</span>}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{fmt(g.createdAt)}</TableCell>
                    <TableCell>
                      <RowMenu label={g.name}>
                        <DropdownMenuItem onSelect={() => setGroupDrawer({ group: g })}><Pencil className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => setConfirm({ kind: 'deleteGroup', item: g })}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                      </RowMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {!shownGroups.length && (
                  <TableRow><TableCell colSpan={5}><EmptyState icon={UsersRound} title={s ? 'No groups match' : 'No groups yet'} description="Group teammates under a leader."
                    action={!s && <Button onClick={() => setGroupDrawer({})}><Plus className="mr-1 h-4 w-4" />Create Group</Button>} /></TableCell></TableRow>
                )}
              </TableBody>
            </Table>
            {shownGroups.length > 0 && <Pagination {...groupsPaging} label="groups" />}
          </Card>
        </section>
      )}

      {memberDrawer && <TeamMemberDrawer member={memberDrawer.member || null} onClose={() => setMemberDrawer(null)} />}
      {groupDrawer && <GroupDrawer group={groupDrawer.group || null} onClose={() => setGroupDrawer(null)} />}

      {/* <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmText?.[0]}</AlertDialogTitle>
            <AlertDialogDescription>{confirmText?.[1]}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={doConfirm}>{confirmText?.[2]}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog> */}
 {confirm && (
  <Modal
    title={confirmText?.[0]}
    description={confirmText?.[1]}
    onClose={() => setConfirm(null)}
    footer={
      <>
        <Button variant="outline" onClick={() => setConfirm(null)}>
          Cancel
        </Button>
        <Button variant="destructive" onClick={doConfirm}>
          {confirmText?.[2]}
        </Button>
      </>
    }
  >
    <div className="rounded-lg border p-4">
      <div className="flex items-center gap-3">
        <Avatar
          text={initials(confirm.item.name)}
          size="md"
        />

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            {confirm.item.name}
          </p>

          {confirm.item.email && (
            <p className="truncate text-xs text-muted-foreground">
              {confirm.item.email}
            </p>
          )}
        </div>

        <Badge variant="secondary">
          {confirm.kind === 'deleteGroup'
            ? 'Group'
            : confirm.item.role || 'Employee'}
        </Badge>
      </div>

      {confirm.kind === 'deleteGroup' && (
        <div className="mt-3 border-t pt-3 text-sm text-muted-foreground">
          {confirm.item.memberIds?.length || 0} team members in this group
        </div>
      )}
    </div>
  </Modal>
)}
      <ToastBridge message={toast} />
    </div>
  );
}