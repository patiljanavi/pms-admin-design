import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronsUpDown, UsersRound, X } from 'lucide-react';
import { DrawerLayout, Field } from '../organizer/SettingsCard';
import { Avatar, Drawer, initials } from '../ui';
// shadcn components
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '../ui/command';
import { ToastBridge } from '../ui/sonner';
import { useData } from '../../context/DataContext';
import { cn } from 'lib/utils';

/**
 * Create / Edit Group (shadcn). Fields: Group Name · Select Leader (locked when editing) · Select Members (leader excluded).
 * Only active members without a group can be picked (plus this group's own people when editing).
 * Saves with DataContext (createGroup / updateGroup). Props: group (edit) · onClose()
 * Escape inside a picker closes only that list (not the whole drawer).
 */
export default function GroupDrawer({ group = null, onClose }) {
  const { activeTeamMembers = [], groupOf, createGroup, updateGroup } = useData();
  const isEdit = !!group;
  const [name, setName] = useState(group?.name || '');
  const [leaderId, setLeaderId] = useState(group?.leaderId || '');
  const [memberIds, setMemberIds] = useState(group?.memberIds || []);
  const [leaderOpen, setLeaderOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState('');
  const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 2600); };
  const [closing, setClosing] = useState(false);
  useEffect(() => { if (closing) onClose?.(); }, [closing]); // eslint-disable-line react-hooks/exhaustive-deps

  // people who can be picked: active, and without a group (or in this group when editing)
  const eligible = useMemo(() => activeTeamMembers.filter((m) => { const g = groupOf(m.id); return !g || (isEdit && g.id === group.id); }), [activeTeamMembers, groupOf, isEdit, group]);
  const byId = (id) => eligible.find((m) => m.id === id) || activeTeamMembers.find((m) => m.id === id);
  const leader = leaderId ? byId(leaderId) : null;
  const pickLeader = (id) => { setLeaderId(id); setMemberIds((ids) => ids.filter((x) => x !== id)); setLeaderOpen(false); setErrors((e) => ({ ...e, leader: undefined })); };
  const toggleMember = (id) => setMemberIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  const handleSubmit = () => {
    if (closing) return;
    const e = {};
    if (!name.trim()) e.name = 'Group name is required.';
    if (!leaderId) e.leader = 'Choose a leader.';
    setErrors(e);
    if (Object.keys(e).length) { notify('Group name and leader are required.'); return; }
    const res = isEdit ? updateGroup(group.id, { name, memberIds }) : createGroup({ name, leaderId, memberIds });
    if (res.error) { setErrors({ form: res.error }); notify(res.error); return; }
    notify(isEdit ? 'Group updated' : `Group “${name.trim()}” created`);
    setClosing(true);
  };

  return (
    <>
      <Drawer onClose={onClose} label={isEdit ? 'Edit Group' : 'Create Group'} width="max-w-[480px]">
        <DrawerLayout icon={UsersRound} title={isEdit ? 'Edit Group' : 'Create Group'} description="A leader and the teammates they look after." onClose={onClose}
          footer={<>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={closing}>{isEdit ? 'Update Group' : 'Create Group'}</Button>
          </>}>
          <div className="flex flex-col gap-5">
            {errors.form && <div role="alert" className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">{errors.form}</div>}
            <Field label="Group Name" htmlFor="grp-name" required error={errors.name}>
              <Input id="grp-name" value={name} onChange={(e) => { setName(e.target.value); setErrors((x) => ({ ...x, name: undefined })); }} placeholder="e.g. Tax team" aria-invalid={!!errors.name} />
            </Field>

            {/* Leader (locked when editing) */}
            <Field label="Select Leader" required error={errors.leader}>
              <Popover open={leaderOpen} onOpenChange={(o) => !isEdit && setLeaderOpen(o)}>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" role="combobox" aria-label="Select Leader" aria-expanded={leaderOpen} disabled={isEdit}
                    className={cn('w-full justify-between font-normal', !leader && 'text-muted-foreground')}>
                    {leader ? <span className="flex items-center gap-2"><Avatar text={initials(leader.name)} size="xs" />{leader.name}</span> : 'Select Leader'}
                    <ChevronsUpDown className="opacity-50" aria-hidden="true" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start" onEscapeKeyDown={(e) => e.stopPropagation()}>
                  <Command>
                    <CommandInput placeholder="Search leader..." />
                    <CommandList>
                      <CommandEmpty>No one without a group found</CommandEmpty>
                      {eligible.map((m) => (
                        <CommandItem key={m.id} value={m.name} onSelect={() => pickLeader(m.id)}>
                          <Avatar text={initials(m.name)} size="xs" />{m.name}
                          <span className="ml-1 text-xs text-muted-foreground">{m.title}</span>
                          {leaderId === m.id && <Check className="ml-auto size-4" aria-hidden="true" />}
                        </CommandItem>
                      ))}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {isEdit && <p className="text-xs text-muted-foreground">The leader can’t be changed here.</p>}
            </Field>

            {/* Members (leader excluded) */}
            <Field label="Select Members">
              <Popover open={membersOpen} onOpenChange={setMembersOpen}>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" role="combobox" aria-label="Select Members" aria-expanded={membersOpen} className="w-full justify-between font-normal text-muted-foreground">
                    {memberIds.length ? `${memberIds.length} member${memberIds.length === 1 ? '' : 's'} selected` : 'Select Members'}
                    <ChevronsUpDown className="opacity-50" aria-hidden="true" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start" onEscapeKeyDown={(e) => e.stopPropagation()}>
                  <Command>
                    <CommandInput placeholder="Search members..." />
                    <CommandList>
                      <CommandEmpty>No one without a group found</CommandEmpty>
                      {eligible.filter((m) => m.id !== leaderId).map((m) => {
                        const on = memberIds.includes(m.id);
                        return (
                          <CommandItem key={m.id} value={m.name} onSelect={() => toggleMember(m.id)} aria-selected={on}>
                            <Avatar text={initials(m.name)} size="xs" />{m.name}
                            <span className="ml-1 text-xs text-muted-foreground">{m.title}</span>
                            {on && <Check className="ml-auto size-4" aria-hidden="true" />}
                          </CommandItem>
                        );
                      })}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {memberIds.length > 0 && (
                <ul aria-label="Selected members" className="mt-1 flex flex-wrap gap-1.5">
                  {memberIds.map((id) => {
                    const m = byId(id);
                    return (
                      <li key={id} className="inline-flex items-center gap-1.5 rounded-full border bg-card py-0.5 pl-1 pr-1.5 text-sm">
                        <Avatar text={initials(m?.name || '?')} size="xs" />{m?.name || id}
                        <button type="button" onClick={() => toggleMember(id)} aria-label={`Remove ${m?.name || id}`} className="rounded-full p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"><X className="size-3" /></button>
                      </li>
                    );
                  })}
                </ul>
              )}
              <p className="text-xs text-muted-foreground">Only active teammates who aren’t in another group are listed.</p>
            </Field>
          </div>
        </DrawerLayout>
      </Drawer>
      <ToastBridge message={toast} />
    </>
  );
}
