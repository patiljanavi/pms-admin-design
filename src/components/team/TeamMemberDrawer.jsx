import { useEffect, useState } from 'react';
import { ShieldCheck, UserPlus } from 'lucide-react';
import { DrawerLayout, Field } from '../organizer/SettingsCard';
import { Drawer } from '../ui';
// shadcn components
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ToastBridge } from '../ui/sonner';
import { useData } from '../../context/DataContext';
import { DISABLED_PERMISSIONS, PERMISSIONS, ROLES, emptyPermissions, isValidEmail } from '../../data/team';
import { cn } from 'lib/utils';

/**
 * Add / Edit Team Member (shadcn). Fields: First Name · Middle Name · Last Name · Email (locked when editing) · Role ·
 * Access Rights (for employees; rights that aren't available yet are greyed out).
 * Saves with DataContext (inviteTeamMember / updateTeamMember). Props: member (edit) · onClose()
 */
export default function TeamMemberDrawer({ member = null, onClose }) {
  const { inviteTeamMember, updateTeamMember } = useData();
  const isEdit = !!member;
  const [form, setForm] = useState(() => ({
    firstName: member?.firstName || '', middleName: member?.middleName || '', lastName: member?.lastName || '',
    email: member?.email || '', role: member?.role || 'employee',
  }));
  const [permissions, setPermissions] = useState(() => ({ ...emptyPermissions(), ...(member?.permissions || {}) }));
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState('');
  const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 2600); };
  const [closing, setClosing] = useState(false);                         // show the toast first, then close
  useEffect(() => { if (closing) onClose?.(); }, [closing]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined, form: undefined })); };
  const available = PERMISSIONS.filter((p) => !DISABLED_PERMISSIONS.has(p.key));
  const allOn = available.every((p) => permissions[p.key]);
  const setAll = (on) => setPermissions((ps) => ({ ...ps, ...Object.fromEntries(available.map((p) => [p.key, on])) }));

  const handleSubmit = () => {
    if (closing) return;
    const e = {};
    if (!form.firstName.trim()) e.firstName = 'First name is required.';
    if (!isEdit && !form.email.trim()) e.email = 'Email is required.';
    else if (!isEdit && !isValidEmail(form.email)) e.email = 'Enter a valid email address.';
    if (!form.role) e.role = 'Choose a role.';
    setErrors(e);
    if (Object.keys(e).length) { notify('Please fix the highlighted fields.'); return; }
    const res = isEdit ? updateTeamMember(member.id, { ...form, permissions }) : inviteTeamMember({ ...form, permissions });
    if (res.error) { setErrors({ form: res.error }); notify(res.error); return; }
    notify(isEdit ? 'Team member updated' : `Invitation sent to ${form.email.trim()}`);
    setClosing(true);
  };

  return (
    <>
      <Drawer onClose={onClose} label={isEdit ? 'Edit Team Member' : 'Add Team Member'} width="max-w-[700px]">
        <DrawerLayout icon={UserPlus} title={isEdit ? 'Edit Team Member' : 'Add Team Member'}
          description={isEdit ? member.email : 'They get an email invitation to join your firm.'} onClose={onClose}
          footer={<>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={closing}>{closing ? 'Saving…' : isEdit ? 'Update' : 'Send Invite'}</Button>
          </>}>
          <div className="flex flex-col gap-5">
            {errors.form && <div role="alert" className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">{errors.form}</div>}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Field label="First Name" htmlFor="tm-first" required error={errors.firstName}>
                <Input id="tm-first" value={form.firstName} onChange={(e) => set('firstName', e.target.value)} placeholder="First Name" aria-invalid={!!errors.firstName} />
              </Field>
              <Field label="Middle Name" htmlFor="tm-middle">
                <Input id="tm-middle" value={form.middleName} onChange={(e) => set('middleName', e.target.value)} placeholder="Middle Name" />
              </Field>
              <Field label="Last Name" htmlFor="tm-last">
                <Input id="tm-last" value={form.lastName} onChange={(e) => set('lastName', e.target.value)} placeholder="Last Name" />
              </Field>
            </div>
            <Field label="Email" htmlFor="tm-email" required={!isEdit} error={errors.email}>
              <Input id="tm-email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="Email" disabled={isEdit} aria-invalid={!!errors.email} />
              {isEdit && <p className="text-xs text-muted-foreground">The email can’t be changed.</p>}
            </Field>
            <Field label="Role" required error={errors.role}>
              <Select value={form.role || undefined} onValueChange={(v) => set('role', v)}>
                <SelectTrigger aria-label="Role"><SelectValue placeholder="Select Role" /></SelectTrigger>
                <SelectContent>{ROLES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
              </Select>
            </Field>

            {form.role === 'employee' && (
              <section aria-label="Access Rights" className="flex flex-col gap-3">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <h3 className="flex items-center gap-2 text-base font-semibold"><ShieldCheck className="size-4 text-muted-foreground" aria-hidden="true" />Access Rights</h3>
                    <p className="text-xs text-muted-foreground">{Object.values(permissions).filter(Boolean).length} of {available.length} available rights on · greyed-out rights are coming soon</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => setAll(!allOn)}>{allOn ? 'Turn all off' : 'Turn all on'}</Button>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {PERMISSIONS.map((p) => {
                    const off = DISABLED_PERMISSIONS.has(p.key);
                    return (
                      <label key={p.key} htmlFor={`perm-${p.key}`}
                        className={cn('flex items-center justify-between gap-3 rounded-lg border bg-card p-3', off ? 'opacity-60' : 'cursor-pointer hover:bg-accent/40')}>
                        <span className="text-sm font-medium">{p.label}{off && <span className="ml-1.5 text-xs font-normal text-muted-foreground">· soon</span>}</span>
                        <Switch id={`perm-${p.key}`} aria-label={p.label} checked={!!permissions[p.key]} disabled={off}
                          onCheckedChange={(v) => setPermissions((ps) => ({ ...ps, [p.key]: v }))} />
                      </label>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        </DrawerLayout>
      </Drawer>
      <ToastBridge message={toast} />
    </>
  );
}
