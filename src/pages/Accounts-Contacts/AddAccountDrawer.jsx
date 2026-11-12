import { useState } from 'react';
import { ArrowLeft, ArrowRight, Building2, Check, CircleAlert, Plus, Star, Trash2, UserPlus } from 'lucide-react';
import MultiSelect from '../../components/MultiSelect';
import { Avatar, CloseButton, Drawer, initials } from '../../components/ui';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { SimpleTooltip } from '../../components/ui/tooltip';
import { TEAM_MEMBERS } from '../../data/sampleData';
import TagChip, { chipStyle } from '../../components/TagChip';
import { cn } from 'lib/utils';

const STEPS = [
  { label: 'Account', hint: 'Name, company, team and tags' },
  { label: 'Contacts', hint: 'People you will work with' },
];
const CONTACT_ROLES = ['Owner', 'Director', 'Finance', 'Operations', 'Other'];
let contactSeq = 1;
const newContact = (primary = false) => ({ id: `c-${contactSeq++}`, firstName: '', lastName: '', email: '', phone: '', role: 'Owner', primary });
const isEmail = (v) => /^\S+@\S+\.\S+$/.test(v);

const Req = () => <span className="ml-0.5 text-danger-700" aria-hidden="true">*</span>;

/** Label + control + inline error / hint. */
function Field({ id, label, required, error, hint, className, children }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={id}>{label}{required && <Req />}</Label>
      {children}
      {error
        ? <p id={`${id}-error`} className="flex items-center gap-1 text-xs text-danger-700"><CircleAlert className="size-3.5 flex-none" aria-hidden="true" />{error}</p>
        : hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
const invalid = (id, error) => (error ? { 'aria-invalid': true, 'aria-describedby': `${id}-error` } : {});

/** Card with a heading for grouping form fields. */
function FormSection({ title, description, children, action }) {
  return (
    <section className="rounded-xl border bg-card shadow-card">
      <div className="flex items-start justify-between gap-3 border-b px-5 py-3.5">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

/** Add account — opens as a right-side drawer, like the account view. */
export default function AddAccountDrawer({ onClose, onSave, tags: tagOptions = [], onCreateTag }) {
  const [step, setStep] = useState(0);
  const [account, setAccount] = useState({ name: '', company: '', team: [], tags: [] });
  const [contacts, setContacts] = useState([newContact(true)]);
  const [errors, setErrors] = useState({});

  const setA = (k, v) => { setAccount((p) => ({ ...p, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })); };
  const setC = (id, k, v) => {
    setContacts((list) => list.map((c) => (c.id === id ? { ...c, [k]: v } : c)));
    setErrors((e) => ({ ...e, [`${id}.${k}`]: undefined, contacts: undefined }));
  };
  const makePrimary = (id) => setContacts((list) => list.map((c) => ({ ...c, primary: c.id === id })));
  const removeContact = (id) => setContacts((list) => {
    const next = list.filter((c) => c.id !== id);
    if (next.length && !next.some((c) => c.primary)) next[0] = { ...next[0], primary: true };
    return next;
  });

  const createTag = (label) => onCreateTag?.(label); // shared store creates the tag and returns its id

  const validateAccount = () => {
    const e = {};
    if (!account.name.trim()) e.name = 'Enter an account name.';
    if (!account.company.trim()) e.company = 'Enter the company name.';
    if (!account.team.length) e.team = 'Assign at least one team member.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  const validateContacts = () => {
    const e = {};
    if (!contacts.length) e.contacts = 'Add at least one contact.';
    contacts.forEach((c) => {
      if (!c.firstName.trim()) e[`${c.id}.firstName`] = 'Required';
      if (!isEmail(c.email)) e[`${c.id}.email`] = 'Enter a valid email';
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validateAccount()) setStep(1); };
  const save = () => {
    if (!validateContacts()) return;
    const primary = contacts.find((c) => c.primary) || contacts[0];
    onSave({
      name: account.name.trim(),
      company: account.company.trim(),
      email: primary.email,
      team: account.team.map((v) => TEAM_MEMBERS.find((m) => m.value === v)?.label).filter(Boolean),
      tags: account.tags, // tag ids
      contacts,
    });
  };

  const goTo = (i) => { if (i === 1 && step === 0) next(); else setStep(i); };
  const title = account.name.trim() || 'New account';

  return (
    <Drawer onClose={onClose} label="Add account" width="max-w-[640px]">
      {/* Header */}
      <div className="flex flex-none items-start gap-3.5 border-b px-6 py-5">
        {account.name.trim()
          ? <Avatar text={initials(account.name)} size="lg" />
          : <span className="flex size-12 flex-none items-center justify-center rounded-xl border border-brand-100 bg-brand-50 text-brand-700" aria-hidden="true"><UserPlus className="size-5" /></span>}
        <div className="min-w-0 flex-1 pt-0.5">
          <h2 className="truncate text-lg font-semibold tracking-tight">{title}</h2>
          <p className="truncate text-sm text-muted-foreground">
            {account.company.trim()
              ? <span className="inline-flex items-center gap-1.5"><Building2 className="size-3.5" aria-hidden="true" />{account.company.trim()}</span>
              : 'Add a client business, the team looking after it and the people you deal with.'}
          </p>
        </div>
        <CloseButton onClick={onClose} />
      </div>

      {/* Steps */}
      <div role="tablist" aria-label="Add account steps" className="flex flex-none gap-1 border-b px-4 sm:px-5">
        {STEPS.map((s, i) => {
          const done = i < step;
          const current = step === i;
          return (
            <button key={s.label} type="button" role="tab" aria-selected={current} onClick={() => goTo(i)}
              className={cn('relative flex h-12 items-center gap-2.5 px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50',
                'after:absolute after:inset-x-2 after:-bottom-px after:h-0.5 after:rounded-full',
                current ? 'text-foreground after:bg-primary' : 'text-muted-foreground hover:text-foreground')}>
              <span className={cn('flex size-5 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums transition-colors',
                done ? 'bg-success-700 text-primary-foreground' : current ? 'bg-primary text-primary-foreground' : 'border border-line-strong text-muted-foreground')}>
                {done ? <Check className="size-3" strokeWidth={3} aria-hidden="true" /> : i + 1}
              </span>
              {s.label}
              <span className="hidden text-xs font-normal text-muted-foreground lg:inline">· {s.hint}</span>
            </button>
          );
        })}
      </div>

      {/* Body */}
      <div className="min-h-0 flex-1 overflow-y-auto bg-canvas px-6 py-5">
        {step === 0 && (
          <div className="flex flex-col gap-4">
            <FormSection title="Account details" description="How the account appears across Harbor.">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field id="aa-name" label="Account name" required error={errors.name}>
                  <Input id="aa-name" autoFocus value={account.name} onChange={(e) => setA('name', e.target.value)} placeholder="e.g. Northwind Holdings" {...invalid('aa-name', errors.name)} />
                </Field>
                <Field id="aa-company" label="Company name" required error={errors.company}>
                  <Input id="aa-company" value={account.company} onChange={(e) => setA('company', e.target.value)} placeholder="Registered company name" {...invalid('aa-company', errors.company)} />
                </Field>
              </div>
            </FormSection>

            <FormSection title="Team & tags" description="Who looks after this client, and how it's grouped.">
              <div className="flex flex-col gap-4">
                <MultiSelect
                  label={<>Team members<Req /></>}
                  placeholder="Search team members"
                  options={TEAM_MEMBERS}
                  value={account.team}
                  onChange={(v) => setA('team', v)}
                  error={errors.team}
                  renderOption={(o) => (
                    <span className="flex flex-1 items-center gap-2.5">
                      <Avatar text={initials(o.label)} size="sm" />
                      <span className="flex-1"><span className="block font-medium">{o.label}</span><span className="block text-xs text-muted-foreground">{o.meta}</span></span>
                    </span>
                  )}
                />
                <div>
                  <MultiSelect
                    label="Tags"
                    placeholder="Search or create a tag"
                    options={tagOptions}
                    value={account.tags}
                    onChange={(v) => setA('tags', v)}
                    creatable
                    createLabel="Create tag"
                    onCreate={createTag}
                    chipStyle={(o) => chipStyle(o.color)}
                    renderOption={(o) => <TagChip tag={o} />}
                  />
                  <p className="mt-1.5 text-xs text-muted-foreground">Type a new name and press <kbd className="kbd">Enter</kbd> to create a tag.</p>
                </div>
              </div>
            </FormSection>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm text-muted-foreground">People at <span className="font-medium text-foreground">{account.company || account.name}</span> you'll work with.</p>
              <span className="text-xs text-muted-foreground">{contacts.length} contact{contacts.length === 1 ? '' : 's'}</span>
            </div>
            {errors.contacts && (
              <div role="alert" className="flex items-center gap-2 rounded-lg border border-danger-100 bg-danger-50 px-3.5 py-2.5 text-sm font-medium text-danger-700">
                <CircleAlert className="size-4 flex-none" aria-hidden="true" />{errors.contacts}
              </div>
            )}

            {contacts.map((c, i) => {
              const fe = errors[`${c.id}.firstName`];
              const ee = errors[`${c.id}.email`];
              return (
                <fieldset key={c.id} className={cn('rounded-xl border bg-card shadow-card transition-colors', c.primary && 'border-primary/40 ring-1 ring-primary/15')}>
                  <legend className="sr-only">Contact {i + 1}</legend>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5">
                    <div className="flex items-center gap-2.5 text-sm font-medium">
                      <Avatar text={initials(`${c.firstName} ${c.lastName}`.trim() || `${i + 1}`)} size="sm" />
                      {`${c.firstName} ${c.lastName}`.trim() || `Contact ${i + 1}`}
                      {c.primary && <Badge variant="info">Primary</Badge>}
                    </div>
                    <div className="flex items-center gap-1">
                      {!c.primary && <Button type="button" variant="ghost" size="xs" onClick={() => makePrimary(c.id)}><Star />Make primary</Button>}
                      {contacts.length > 1 && (
                        <SimpleTooltip label="Remove contact">
                          <Button type="button" variant="ghost" size="icon-xs" aria-label={`Remove contact ${i + 1}`} onClick={() => removeContact(c.id)}
                            className="text-muted-foreground hover:bg-danger-50 hover:text-danger-700"><Trash2 /></Button>
                        </SimpleTooltip>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
                    <Field id={`${c.id}-first`} label="First name" required error={fe}>
                      <Input id={`${c.id}-first`} autoComplete="off" value={c.firstName} onChange={(e) => setC(c.id, 'firstName', e.target.value)} placeholder="Jane" {...invalid(`${c.id}-first`, fe)} />
                    </Field>
                    <Field id={`${c.id}-last`} label="Last name">
                      <Input id={`${c.id}-last`} autoComplete="off" value={c.lastName} onChange={(e) => setC(c.id, 'lastName', e.target.value)} placeholder="Doe" />
                    </Field>
                    <Field id={`${c.id}-email`} label="Email" required error={ee}>
                      <Input id={`${c.id}-email`} type="email" autoComplete="off" value={c.email} onChange={(e) => setC(c.id, 'email', e.target.value)} placeholder="jane@company.com" {...invalid(`${c.id}-email`, ee)} />
                    </Field>
                    <Field id={`${c.id}-phone`} label="Phone">
                      <Input id={`${c.id}-phone`} type="tel" autoComplete="off" value={c.phone} onChange={(e) => setC(c.id, 'phone', e.target.value)} placeholder="[Phone number]" />
                    </Field>
                    <Field id={`${c.id}-role`} label="Role" className="sm:col-span-2">
                      <Select value={c.role} onValueChange={(v) => setC(c.id, 'role', v)}>
                        <SelectTrigger id={`${c.id}-role`}><SelectValue /></SelectTrigger>
                        <SelectContent>{CONTACT_ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                      </Select>
                    </Field>
                  </div>
                </fieldset>
              );
            })}

            <button type="button" onClick={() => setContacts((l) => [...l, newContact(l.length === 0)])}
              className="flex h-11 items-center justify-center gap-2 rounded-xl border border-dashed border-line-strong text-sm font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
              <Plus className="size-4" aria-hidden="true" />Add another contact
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex flex-none items-center justify-between gap-2 border-t bg-subtle px-6 py-3.5">
        {step === 0
          ? <Button variant="outline" onClick={onClose}>Cancel</Button>
          : <Button variant="outline" onClick={() => setStep(0)}><ArrowLeft />Back</Button>}
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-muted-foreground sm:inline">Step {step + 1} of {STEPS.length}</span>
          {step === 0
            ? <Button onClick={next}>Continue to contacts<ArrowRight /></Button>
            : <Button onClick={save}><Check />Save account</Button>}
        </div>
      </div>
    </Drawer>
  );
}
