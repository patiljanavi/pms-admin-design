import { useMemo, useState } from 'react';
import { CircleAlert, Plus, RotateCcw, SearchX, Star, Trash2, UserPlus } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { COUNTRIES, PHONE_TYPES } from '../../data/countries';
import MultiSelect from '../../components/MultiSelect';
import TagChip, { chipStyle } from '../../components/TagChip';
import { Avatar, CloseButton, Drawer, Modal, initials } from '../../components/ui';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { SimpleTooltip } from '../../components/ui/tooltip';
import { EmptyState } from '../../components/page';
import { cn } from 'lib/utils';

let seq = 1;
const newPhone = (country = 'US', primary = false) => ({ id: `ph-new-${seq++}`, country, number: '', type: 'Mobile', primary });
const fullName = (f, m, l) => [f, m, l].map((x) => (x || '').trim()).filter(Boolean).join(' ');
const isEmail = (v) => /^\S+@\S+\.\S+$/.test(v);
const digits = (v) => v.replace(/\D/g, '');
const NO_COUNTRY = '__none__'; // Radix Select can't use '' as an item value

const empty = {
  firstName: '', middleName: '', lastName: '', contactName: '', company: '', email: '', tags: [], note: '',
  phones: [newPhone('US', true)],
  address: { country: 'US', street: '', city: '', state: '', zip: '' },
};

/** Card with a heading for grouping form fields. */
function Section({ title, hint, children }) {
  return (
    <section className="rounded-xl border bg-card shadow-card">
      <div className="border-b px-5 py-3.5">
        <h3 className="text-sm font-semibold">{title}</h3>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </div>
      <div className="flex flex-col gap-4 p-5">{children}</div>
    </section>
  );
}
function FieldError({ id, msg }) {
  return msg ? <p id={id} className="flex items-center gap-1 text-xs text-danger-700"><CircleAlert className="size-3.5 flex-none" aria-hidden="true" />{msg}</p> : null;
}
/** Label + control + inline error / hint. */
function Field({ id, label, required, error, hint, className, children }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={id}>{label}{required && <span className="ml-0.5 text-danger-700" aria-hidden="true">*</span>}</Label>
      {children}
      {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
      <FieldError id={`${id}-error`} msg={error} />
    </div>
  );
}
const invalid = (id, error) => (error ? { 'aria-invalid': true, 'aria-describedby': `${id}-error` } : {});

/**
 * Contact form in a side drawer, for creating and editing.
 * Used by pages/Contacts.jsx:
 *   <ContactDrawer contactId="new" onClose={…} onDone={(message) => …} />   → create
 *   <ContactDrawer contactId="CT-1100" onClose={…} onDone={(message) => …} /> → edit
 * The key makes the form start fresh when you switch to another contact.
 */
export default function ContactDrawer({ contactId = 'new', onClose, onDone }) {
  return <ContactForm key={contactId} contactId={contactId} onClose={onClose} onDone={onDone} />;
}

function ContactForm({ contactId, onClose, onDone }) {
  const { contacts, saveContact, deleteContacts, tags, createTag } = useData();
  const existing = contacts.find((c) => c.id === contactId);
  const isNew = contactId === 'new';

  const [f, setF] = useState(() => (existing ? { ...empty, ...existing, address: { ...empty.address, ...existing.address }, phones: existing.phones?.length ? existing.phones : [newPhone('US', true)] } : empty));
  const [nameEdited, setNameEdited] = useState(() => !!existing && existing.contactName !== fullName(existing.firstName, existing.middleName, existing.lastName));
  const [errors, setErrors] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const close = () => onClose?.();

  const autoName = fullName(f.firstName, f.middleName, f.lastName);
  const contactName = nameEdited ? f.contactName : autoName;

  const set = (k, v) => { setF((p) => ({ ...p, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })); };
  const setAddr = (k, v) => setF((p) => ({ ...p, address: { ...p.address, [k]: v } }));
  const setPhone = (id, k, v) => { setF((p) => ({ ...p, phones: p.phones.map((x) => (x.id === id ? { ...x, [k]: v } : x)) })); setErrors((e) => ({ ...e, [`phone.${id}`]: undefined })); };
  const makePrimary = (id) => setF((p) => ({ ...p, phones: p.phones.map((x) => ({ ...x, primary: x.id === id })) }));
  const removePhone = (id) => setF((p) => {
    const phones = p.phones.filter((x) => x.id !== id);
    if (phones.length && !phones.some((x) => x.primary)) phones[0] = { ...phones[0], primary: true };
    return { ...p, phones };
  });
  const addPhone = () => setF((p) => ({ ...p, phones: [...p.phones, newPhone(p.address.country || 'US', p.phones.length === 0)] }));

  const usedCountries = useMemo(() => COUNTRIES, []);

  const validate = () => {
    const e = {};
    if (!f.firstName.trim()) e.firstName = 'Enter a first name.';
    if (!f.lastName.trim()) e.lastName = 'Enter a last name.';
    if (!contactName.trim()) e.contactName = 'Enter a contact name.';
    if (!isEmail(f.email.trim())) e.email = 'Enter a valid email address.';
    f.phones.forEach((p) => {
      const n = digits(p.number);
      if (p.number.trim() && (n.length < 6 || n.length > 15)) e[`phone.${p.id}`] = 'Use 6–15 digits.';
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = () => {
    if (!validate()) return;
    const phones = f.phones.filter((p) => p.number.trim()).map((p) => ({ ...p, number: p.number.trim() }));
    if (phones.length && !phones.some((p) => p.primary)) phones[0].primary = true;
    const id = saveContact({
      id: isNew ? undefined : f.id,
      firstName: f.firstName.trim(), middleName: f.middleName.trim(), lastName: f.lastName.trim(),
      contactName: contactName.trim(), company: f.company.trim(), email: f.email.trim(),
      tags: f.tags, note: f.note.trim(), phones,
      address: Object.fromEntries(Object.entries(f.address).map(([k, v]) => [k, (v || '').trim()])),
    });
    onDone?.(isNew ? `Created ${contactName.trim()}` : `Saved ${contactName.trim()}`, id);
  };

  if (!isNew && !existing) {
    return (
      <Drawer onClose={close} label="Contact not found">
        <div className="flex justify-end px-4 pt-4"><CloseButton onClick={close} /></div>
        <div className="flex flex-1 items-center justify-center">
          <EmptyState icon={SearchX} title="Contact not found" description={`No contact has the ID ${contactId}. It may have been deleted.`}
            action={<Button onClick={close}>Back to contacts</Button>} />
        </div>
      </Drawer>
    );
  }

  const errorCount = Object.keys(errors).filter((k) => errors[k]).length;

  return (
    <Drawer onClose={close} label={isNew ? 'New contact' : `Edit ${existing.contactName}`} width="max-w-[680px]">
      {/* Header */}
      <div className="flex flex-none items-start gap-3.5 border-b px-6 py-5">
        {contactName
          ? <Avatar text={initials(contactName)} size="lg" />
          : <span className="flex size-12 flex-none items-center justify-center rounded-xl border border-brand-100 bg-brand-50 text-brand-700" aria-hidden="true"><UserPlus className="size-5" /></span>}
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-lg font-semibold tracking-tight">{contactName || (isNew ? 'New contact' : 'Contact')}</h2>
            {!isNew && <Badge variant="neutral" className="font-mono text-[11px]">{existing.id}</Badge>}
          </div>
          <p className="truncate text-sm text-muted-foreground">{[f.company, f.email].filter(Boolean).join(' · ') || (isNew ? 'Add someone you work with at a client.' : 'Fill in the details below.')}</p>
        </div>
        <CloseButton onClick={close} />
      </div>

      <form className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto bg-canvas px-6 py-5" noValidate onSubmit={(e) => { e.preventDefault(); save(); }}>
        {errorCount > 0 && (
          <div role="alert" className="flex items-center gap-2 rounded-lg border border-danger-100 bg-danger-50 px-3.5 py-2.5 text-sm font-medium text-danger-700">
            <CircleAlert className="size-4 flex-none" aria-hidden="true" />Please fix the highlighted field{errorCount === 1 ? '' : 's'}.
          </div>
        )}

        <Section title="Name">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field id="ct-first" label="First name" required error={errors.firstName}>
              <Input id="ct-first" autoComplete="off" value={f.firstName} onChange={(e) => set('firstName', e.target.value)} placeholder="Jane" {...invalid('ct-first', errors.firstName)} />
            </Field>
            <Field id="ct-middle" label="Middle name">
              <Input id="ct-middle" autoComplete="off" value={f.middleName} onChange={(e) => set('middleName', e.target.value)} placeholder="Marie" />
            </Field>
            <Field id="ct-last" label="Last name" required error={errors.lastName}>
              <Input id="ct-last" autoComplete="off" value={f.lastName} onChange={(e) => set('lastName', e.target.value)} placeholder="Doe" {...invalid('ct-last', errors.lastName)} />
            </Field>
          </div>
          <Field id="ct-name" label="Contact name" required error={errors.contactName}
            hint={nameEdited
              ? <span className="flex flex-wrap items-center gap-1.5">Custom name.
                  <button type="button" className="inline-flex items-center gap-1 font-medium text-primary hover:underline" onClick={() => { setNameEdited(false); set('contactName', ''); }}>
                    <RotateCcw className="size-3" aria-hidden="true" />Use “{autoName || 'full name'}”
                  </button>
                </span>
              : 'Filled in automatically from first, middle and last name. You can change it.'}>
            <Input id="ct-name" value={contactName} onChange={(e) => { setNameEdited(true); set('contactName', e.target.value); }}
              placeholder="Filled in from first, middle and last name" {...invalid('ct-name', errors.contactName)} />
          </Field>
        </Section>

        <Section title="Company & tags">
          <Field id="ct-company" label="Company name">
            <Input id="ct-company" autoComplete="off" value={f.company} onChange={(e) => set('company', e.target.value)} placeholder="Company the contact works for" />
          </Field>
          <MultiSelect label="Tags" placeholder="Search or create a tag" options={tags} value={f.tags} onChange={(v) => set('tags', v)}
            creatable createLabel="Create tag" onCreate={createTag} chipStyle={(o) => chipStyle(o.color)} renderOption={(o) => <TagChip tag={o} />} />
        </Section>

        <Section title="Contact details" hint="Email is required. Add as many phone numbers as you need — the starred one is primary.">
          <Field id="ct-email" label="Email" required error={errors.email}>
            <Input id="ct-email" type="email" autoComplete="off" value={f.email} onChange={(e) => set('email', e.target.value)} placeholder="jane@company.com" {...invalid('ct-email', errors.email)} />
          </Field>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Phone numbers</span>
            <ul className="flex flex-col gap-2">
              {f.phones.map((p, i) => {
                const err = errors[`phone.${p.id}`];
                const country = usedCountries.find((c) => c.iso === p.country);
                return (
                  <li key={p.id} className={cn('rounded-lg border p-2.5 transition-colors', p.primary ? 'border-primary/40 bg-primary/[0.03]' : 'bg-card')}>
                    <div className="flex flex-wrap items-start gap-2">
                      <Select value={p.country} onValueChange={(v) => setPhone(p.id, 'country', v)}>
                        <SelectTrigger className="w-[112px] flex-none" aria-label={`Country code for phone ${i + 1}`} title="Country code">
                          <SelectValue>{country ? <span className="font-mono text-[13px]">{country.iso} {country.dial}</span> : 'Code'}</SelectValue>
                        </SelectTrigger>
                        <SelectContent className="max-h-72">
                          {usedCountries.map((c) => (
                            <SelectItem key={c.iso} value={c.iso}><span className="inline-block w-16 font-mono text-xs text-muted-foreground">{c.iso} {c.dial}</span>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex min-w-[160px] flex-1 flex-col gap-1">
                        <Input id={`${p.id}-num`} type="tel" inputMode="tel" autoComplete="off" value={p.number} aria-label={`Phone number ${i + 1}`}
                          onChange={(e) => setPhone(p.id, 'number', e.target.value.replace(/[^\d\s()-]/g, ''))}
                          placeholder="Phone number" className="font-mono" {...invalid(`${p.id}-num`, err)} />
                        <FieldError id={`${p.id}-num-error`} msg={err} />
                      </div>
                      <Select value={p.type} onValueChange={(v) => setPhone(p.id, 'type', v)}>
                        <SelectTrigger className="w-[104px] flex-none" aria-label={`Type of phone ${i + 1}`}><SelectValue /></SelectTrigger>
                        <SelectContent>{PHONE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                      </Select>
                      <div className="flex flex-none items-center">
                        <SimpleTooltip label={p.primary ? 'Primary number' : 'Make primary'}>
                          <Button type="button" variant="ghost" size="icon" onClick={() => makePrimary(p.id)} aria-pressed={p.primary}
                            aria-label={p.primary ? `Phone ${i + 1} is primary` : `Make phone ${i + 1} primary`}
                            className={p.primary ? 'text-warning-700 hover:text-warning-700' : 'text-muted-foreground'}>
                            <Star className={cn(p.primary && 'fill-current')} aria-hidden="true" />
                          </Button>
                        </SimpleTooltip>
                        {f.phones.length > 1 && (
                          <SimpleTooltip label="Remove number">
                            <Button type="button" variant="ghost" size="icon" onClick={() => removePhone(p.id)} aria-label={`Remove phone ${i + 1}`}
                              className="text-muted-foreground hover:bg-danger-50 hover:text-danger-700"><Trash2 aria-hidden="true" /></Button>
                          </SimpleTooltip>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <Button type="button" variant="ghost" size="sm" onClick={addPhone} className="self-start text-primary hover:text-primary"><Plus />Add phone number</Button>
          </div>
        </Section>

        <Section title="Address">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field id="ct-country" label="Country" className="sm:col-span-2">
              <Select value={f.address.country || NO_COUNTRY} onValueChange={(v) => setAddr('country', v === NO_COUNTRY ? '' : v)}>
                <SelectTrigger id="ct-country"><SelectValue placeholder="Select a country" /></SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value={NO_COUNTRY} className="text-muted-foreground">Select a country</SelectItem>
                  {COUNTRIES.map((c) => <SelectItem key={c.iso} value={c.iso}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field id="ct-street" label="Street" className="sm:col-span-2">
              <Input id="ct-street" autoComplete="off" value={f.address.street} onChange={(e) => setAddr('street', e.target.value)} placeholder="Street and number, building, unit" />
            </Field>
            <Field id="ct-city" label="City">
              <Input id="ct-city" autoComplete="off" value={f.address.city} onChange={(e) => setAddr('city', e.target.value)} placeholder="City" />
            </Field>
            <Field id="ct-state" label="State / Province">
              <Input id="ct-state" autoComplete="off" value={f.address.state} onChange={(e) => setAddr('state', e.target.value)} placeholder="State or province" />
            </Field>
            <Field id="ct-zip" label="ZIP / Postal code">
              <Input id="ct-zip" autoComplete="off" value={f.address.zip} onChange={(e) => setAddr('zip', e.target.value)} placeholder="ZIP or postal code" />
            </Field>
          </div>
        </Section>

        <Section title="Note">
          <Label htmlFor="ct-note" className="sr-only">Note</Label>
          <Textarea id="ct-note" className="min-h-[96px]" value={f.note} onChange={(e) => set('note', e.target.value)} placeholder="Anything the team should know about this contact" />
        </Section>

        <button type="submit" className="hidden" tabIndex={-1} aria-hidden="true" />
      </form>

      {/* Footer */}
      <div className="flex flex-none flex-wrap items-center justify-between gap-2 border-t bg-subtle px-6 py-3.5">
        {!isNew
          ? <Button type="button" variant="ghost" onClick={() => setConfirmDelete(true)} className="text-danger-700 hover:bg-danger-50 hover:text-danger-700"><Trash2 />Delete contact</Button>
          : <span />}
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={close}>Cancel</Button>
          <Button type="button" onClick={save}>{isNew ? 'Create contact' : 'Save changes'}</Button>
        </div>
      </div>

      {confirmDelete && (
        <Modal title={`Delete ${existing.contactName}?`} description="This removes the contact from your workspace." onClose={() => setConfirmDelete(false)}
          footer={<><Button variant="outline" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { deleteContacts([existing.id]); onDone?.(`Deleted ${existing.contactName}`); }}><Trash2 />Delete contact</Button></>}>
          <div className="flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm">
            <Avatar text={initials(existing.contactName)} size="sm" />
            <div className="min-w-0">
              <div className="truncate font-medium">{existing.contactName}</div>
              <div className="truncate text-xs text-muted-foreground">{[existing.company, existing.email].filter(Boolean).join(' · ')}</div>
            </div>
          </div>
        </Modal>
      )}
    </Drawer>
  );
}
