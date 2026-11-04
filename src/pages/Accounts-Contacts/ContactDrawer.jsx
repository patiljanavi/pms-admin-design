import { useMemo, useState } from 'react';
import { FiPlus, FiStar, FiTrash2, FiX } from 'react-icons/fi';
import { useData } from '../../context/DataContext';
import { COUNTRIES, PHONE_TYPES } from '../../data/countries';
import MultiSelect from '../../components/MultiSelect';
import TagChip, { chipStyle } from '../../components/TagChip';
import { Avatar, Drawer, Modal, cx, initials } from '../../components/ui';

let seq = 1;
const newPhone = (country = 'US', primary = false) => ({ id: `ph-new-${seq++}`, country, number: '', type: 'Mobile', primary });
const fullName = (f, m, l) => [f, m, l].map((x) => (x || '').trim()).filter(Boolean).join(' ');
const isEmail = (v) => /^\S+@\S+\.\S+$/.test(v);
const digits = (v) => v.replace(/\D/g, '');

const empty = {
  firstName: '', middleName: '', lastName: '', contactName: '', company: '', email: '', tags: [], note: '',
  phones: [newPhone('US', true)],
  address: { country: 'US', street: '', city: '', state: '', zip: '' },
};

function Section({ title, hint, children }) {
  return (
    <section className="flex flex-col gap-3.5">
      <div><h3 className="font-semibold">{title}</h3>{hint && <p className="text-sm text-muted">{hint}</p>}</div>
      {children}
    </section>
  );
}
function FieldError({ msg }) { return msg ? <span className="text-sm font-normal text-danger-700">{msg}</span> : null; }

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
        <div className="flex flex-col items-start gap-4 p-6"><h2 className="text-xl font-semibold">Contact not found</h2><p className="text-muted">No contact has the ID {contactId}.</p><button className="btn-primary" onClick={close}>Back to contacts</button></div>
      </Drawer>
    );
  }

  const inputCls = (k) => cx('input', errors[k] && 'border-danger-700');

  return (
    <Drawer onClose={close} label={isNew ? 'New contact' : `Edit ${existing.contactName}`} width="max-w-[680px]">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-line p-5 sm:p-6">
        <Avatar text={initials(contactName || '?')} size="lg" tone="solid" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-xl font-bold">{contactName || (isNew ? 'New contact' : 'Contact')}</h2>
          <div className="truncate text-muted">{[f.company, f.email].filter(Boolean).join(' · ') || 'Fill in the details below'}</div>
        </div>
        <button onClick={close} aria-label="Close" className="flex h-10 w-10 flex-none items-center justify-center rounded text-muted hover:bg-subtle"><FiX size={20} /></button>
      </div>

      <form className="flex flex-1 flex-col gap-7 p-5 sm:p-6" noValidate onSubmit={(e) => { e.preventDefault(); save(); }}>
        {Object.keys(errors).some((k) => errors[k]) && (
          <div role="alert" className="rounded bg-danger-50 px-3.5 py-3 font-semibold text-danger-700">Please fix the highlighted fields.</div>
        )}

        <Section title="Name">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
            <label className="field-label">First name *<input className={inputCls('firstName')} autoComplete="off" value={f.firstName} onChange={(e) => set('firstName', e.target.value)} placeholder="Jane" /><FieldError msg={errors.firstName} /></label>
            <label className="field-label">Middle name<input className="input" autoComplete="off" value={f.middleName} onChange={(e) => set('middleName', e.target.value)} placeholder="Marie" /></label>
            <label className="field-label">Last name *<input className={inputCls('lastName')} autoComplete="off" value={f.lastName} onChange={(e) => set('lastName', e.target.value)} placeholder="Doe" /><FieldError msg={errors.lastName} /></label>
          </div>
          <label className="field-label">Contact name *
            <input className={inputCls('contactName')} value={contactName}
              onChange={(e) => { setNameEdited(true); set('contactName', e.target.value); }} placeholder="Filled in from first, middle and last name" />
            <span className="flex flex-wrap items-center gap-2 text-sm font-normal text-muted">
              {nameEdited
                ? <>Custom name. <button type="button" className="btn-link" onClick={() => { setNameEdited(false); set('contactName', ''); }}>Use “{autoName || 'full name'}”</button></>
                : 'Filled in automatically from first, middle and last name. You can change it.'}
            </span>
            <FieldError msg={errors.contactName} />
          </label>
        </Section>

        <Section title="Company & tags">
          <label className="field-label">Company name<input className="input" autoComplete="off" value={f.company} onChange={(e) => set('company', e.target.value)} placeholder="Company the contact works for" /></label>
          <MultiSelect label="Tags" placeholder="Search or create a tag" options={tags} value={f.tags} onChange={(v) => set('tags', v)}
            creatable createLabel="Create tag" onCreate={createTag} chipStyle={(o) => chipStyle(o.color)} renderOption={(o) => <TagChip tag={o} />} />
        </Section>

        <Section title="Email">
          <label className="field-label">Email *<input className={inputCls('email')} type="email" autoComplete="off" value={f.email} onChange={(e) => set('email', e.target.value)} placeholder="jane@company.com" /><FieldError msg={errors.email} /></label>
        </Section>

        <Section title="Phone numbers" hint="Add as many as needed. ★ marks the primary number.">
          <ul className="flex flex-col gap-2.5">
            {f.phones.map((p, i) => (
              <li key={p.id} className={cx('rounded-md border p-3', p.primary ? 'border-brand-600 bg-brand-50/40' : 'border-line')}>
                <div className="flex flex-wrap items-start gap-2">
                  <label className="sr-only" htmlFor={`${p.id}-cc`}>Country code for phone {i + 1}</label>
                  <select id={`${p.id}-cc`} value={p.country} onChange={(e) => setPhone(p.id, 'country', e.target.value)}
                    className="input w-[150px] flex-none" title="Country code">
                    {usedCountries.map((c) => <option key={c.iso} value={c.iso}>{c.iso} {c.dial} · {c.name}</option>)}
                  </select>
                  <div className="min-w-[160px] flex-1">
                    <label className="sr-only" htmlFor={`${p.id}-num`}>Phone number {i + 1}</label>
                    <input id={`${p.id}-num`} type="tel" inputMode="tel" autoComplete="off" value={p.number}
                      onChange={(e) => setPhone(p.id, 'number', e.target.value.replace(/[^\d\s()-]/g, ''))}
                      placeholder="Phone number" className={cx('input', errors[`phone.${p.id}`] && 'border-danger-700')} />
                    <FieldError msg={errors[`phone.${p.id}`]} />
                  </div>
                  <label className="sr-only" htmlFor={`${p.id}-type`}>Type of phone {i + 1}</label>
                  <select id={`${p.id}-type`} value={p.type} onChange={(e) => setPhone(p.id, 'type', e.target.value)} className="input w-[110px] flex-none">
                    {PHONE_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                  <button type="button" onClick={() => makePrimary(p.id)} aria-pressed={p.primary} aria-label={p.primary ? `Phone ${i + 1} is primary` : `Make phone ${i + 1} primary`}
                    title={p.primary ? 'Primary number' : 'Make primary'}
                    className={cx('flex h-11 w-11 flex-none items-center justify-center rounded', p.primary ? 'text-brand-600' : 'text-muted hover:bg-subtle')}>
                    <FiStar size={18} style={p.primary ? { fill: 'currentColor' } : undefined} aria-hidden="true" />
                  </button>
                  {f.phones.length > 1 && (
                    <button type="button" onClick={() => removePhone(p.id)} aria-label={`Remove phone ${i + 1}`}
                      className="flex h-11 w-11 flex-none items-center justify-center rounded text-danger-700 hover:bg-danger-50"><FiTrash2 size={17} aria-hidden="true" /></button>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <button type="button" onClick={addPhone} className="btn self-start border border-dashed border-line-strong bg-surface text-brand-600 hover:bg-subtle"><FiPlus aria-hidden="true" /> Add phone number</button>
        </Section>

        <Section title="Address">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <label className="field-label sm:col-span-2">Country
              <select className="input" value={f.address.country} onChange={(e) => setAddr('country', e.target.value)}>
                <option value="">Select a country</option>
                {COUNTRIES.map((c) => <option key={c.iso} value={c.iso}>{c.name}</option>)}
              </select>
            </label>
            <label className="field-label sm:col-span-2">Street<input className="input" autoComplete="off" value={f.address.street} onChange={(e) => setAddr('street', e.target.value)} placeholder="Street and number, building, unit" /></label>
            <label className="field-label">City<input className="input" autoComplete="off" value={f.address.city} onChange={(e) => setAddr('city', e.target.value)} placeholder="City" /></label>
            <label className="field-label">State / Province<input className="input" autoComplete="off" value={f.address.state} onChange={(e) => setAddr('state', e.target.value)} placeholder="State or province" /></label>
            <label className="field-label">ZIP / Postal code<input className="input" autoComplete="off" value={f.address.zip} onChange={(e) => setAddr('zip', e.target.value)} placeholder="ZIP or postal code" /></label>
          </div>
        </Section>

        <Section title="Note">
          <label className="field-label"><span className="sr-only">Note</span>
            <textarea className="input min-h-[96px] py-2.5" value={f.note} onChange={(e) => set('note', e.target.value)} placeholder="Anything the team should know about this contact" />
          </label>
        </Section>

        <button type="submit" className="hidden" tabIndex={-1} aria-hidden="true" />
      </form>

      <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-2.5 border-t border-line bg-subtle px-5 py-4 sm:px-6">
        {!isNew ? <button type="button" onClick={() => setConfirmDelete(true)} className="inline-flex min-h-[44px] items-center gap-2 rounded px-3 font-semibold text-danger-700 hover:bg-danger-50"><FiTrash2 aria-hidden="true" /> Delete contact</button> : <span />}
        <div className="flex gap-2.5">
          <button type="button" className="btn-secondary" onClick={close}>Cancel</button>
          <button type="button" className="btn-primary" onClick={save}>{isNew ? 'Create contact' : 'Save changes'}</button>
        </div>
      </div>

      {confirmDelete && (
        <Modal title={`Delete ${existing.contactName}?`} onClose={() => setConfirmDelete(false)}
          footer={<><button className="btn-secondary" onClick={() => setConfirmDelete(false)}>Cancel</button>
            <button className="btn bg-danger-700 text-white hover:bg-[#831E15]" onClick={() => { deleteContacts([existing.id]); onDone?.(`Deleted ${existing.contactName}`); }}>Delete contact</button></>}>
          <p className="text-muted">This removes the contact. It can't be undone.</p>
        </Modal>
      )}
    </Drawer>
  );
}
