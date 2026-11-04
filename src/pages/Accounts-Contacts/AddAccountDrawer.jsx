import { useState } from 'react';
import { FiPlus, FiTrash2, FiUserPlus } from 'react-icons/fi';
import MultiSelect from '../../components/MultiSelect';
import { Avatar, Drawer, cx, initials } from '../../components/ui';
import { FiX } from 'react-icons/fi';
import { TEAM_MEMBERS } from '../../data/sampleData';
import TagChip, { chipStyle } from '../../components/TagChip';

const STEPS = ['Account', 'Contacts'];
const CONTACT_ROLES = ['Owner', 'Director', 'Finance', 'Operations', 'Other'];
let contactSeq = 1;
const newContact = (primary = false) => ({ id: `c-${contactSeq++}`, firstName: '', lastName: '', email: '', phone: '', role: 'Owner', primary });
const isEmail = (v) => /^\S+@\S+\.\S+$/.test(v);

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

  return (
    <Drawer onClose={onClose} label="Add account" width="max-w-[640px]">
      {/* Header — same layout as the account view */}
      <div className="flex items-center gap-4 border-b border-line p-5 sm:p-6">
        <span className="flex h-14 w-14 flex-none items-center justify-center rounded-full bg-brand-600 text-white" aria-hidden="true"><FiUserPlus size={24} /></span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-xl font-bold">{account.name.trim() || 'New account'}</h2>
          <div className="truncate text-muted">{account.company.trim() || `Step ${step + 1} of 2 · ${STEPS[step]}`}</div>
        </div>
        <button onClick={onClose} aria-label="Close" className="flex h-10 w-10 flex-none items-center justify-center rounded text-muted hover:bg-subtle"><FiX size={20} /></button>
      </div>

      {/* Steps as tabs */}
      <div role="tablist" aria-label="Add account steps" className="flex gap-1 border-b border-line px-4 sm:px-6">
        {STEPS.map((l, i) => (
          <button key={l} type="button" role="tab" aria-selected={step === i} onClick={() => goTo(i)}
            className={cx('flex min-h-[48px] items-center gap-2 border-b-[3px] px-3.5 font-semibold',
              step === i ? 'border-brand-600 text-brand-600' : 'border-transparent text-muted hover:text-ink')}>
            <span className={cx('flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
              i < step ? 'bg-success-700 text-white' : step === i ? 'bg-brand-600 text-white' : 'border-2 border-line-strong text-muted')}>{i < step ? '✓' : i + 1}</span>
            {l}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 p-5 sm:p-6">
      {step === 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="field-label">Account name *
            <input className={cx('input', errors.name && 'border-danger-700')} value={account.name} onChange={(e) => setA('name', e.target.value)} placeholder="e.g. Northwind Holdings" />
            {errors.name && <span className="text-sm text-danger-700">{errors.name}</span>}
          </label>
          <label className="field-label">Company name *
            <input className={cx('input', errors.company && 'border-danger-700')} value={account.company} onChange={(e) => setA('company', e.target.value)} placeholder="Registered company name" />
            {errors.company && <span className="text-sm text-danger-700">{errors.company}</span>}
          </label>

          <div className="sm:col-span-2">
            <MultiSelect
              label="Team members *"
              placeholder="Search team members"
              options={TEAM_MEMBERS}
              value={account.team}
              onChange={(v) => setA('team', v)}
              error={errors.team}
              renderOption={(o) => (
                <span className="flex flex-1 items-center gap-2.5">
                  <Avatar text={initials(o.label)} size="sm" />
                  <span className="flex-1"><span className="block font-semibold">{o.label}</span><span className="block text-sm text-muted">{o.meta}</span></span>
                </span>
              )}
            />
          </div>

          <div className="sm:col-span-2">
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
            <p className="mt-1.5 text-sm text-muted">Type a new name and press Enter to create a tag.</p>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-muted">People at <b className="text-ink">{account.company || account.name}</b> you'll work with.</p>
            <span className="text-sm text-muted">{contacts.length} contact{contacts.length === 1 ? '' : 's'}</span>
          </div>
          {errors.contacts && <div role="alert" className="rounded bg-danger-50 px-3.5 py-3 font-semibold text-danger-700">{errors.contacts}</div>}

          {contacts.map((c, i) => (
            <fieldset key={c.id} className={cx('rounded-lg border p-4', c.primary ? 'border-brand-600 bg-brand-50/40' : 'border-line')}>
              <legend className="sr-only">Contact {i + 1}</legend>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-semibold">
                  Contact {i + 1}
                  {c.primary && <span className="pill bg-brand-600 text-white">Primary</span>}
                </div>
                <div className="flex items-center gap-1">
                  {!c.primary && <button type="button" className="btn-link px-2 text-sm" onClick={() => makePrimary(c.id)}>Make primary</button>}
                  {contacts.length > 1 && (
                    <button type="button" aria-label={`Remove contact ${i + 1}`} onClick={() => removeContact(c.id)}
                      className="flex h-9 w-9 items-center justify-center rounded text-danger-700 hover:bg-danger-50"><FiTrash2 aria-hidden="true" /></button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="field-label">First name *
                  <input className={cx('input', errors[`${c.id}.firstName`] && 'border-danger-700')} autoComplete="off" value={c.firstName} onChange={(e) => setC(c.id, 'firstName', e.target.value)} placeholder="Jane" />
                  {errors[`${c.id}.firstName`] && <span className="text-sm text-danger-700">{errors[`${c.id}.firstName`]}</span>}
                </label>
                <label className="field-label">Last name
                  <input className="input" autoComplete="off" value={c.lastName} onChange={(e) => setC(c.id, 'lastName', e.target.value)} placeholder="Doe" />
                </label>
                <label className="field-label">Email *
                  <input className={cx('input', errors[`${c.id}.email`] && 'border-danger-700')} type="email" autoComplete="off" value={c.email} onChange={(e) => setC(c.id, 'email', e.target.value)} placeholder="jane@company.com" />
                  {errors[`${c.id}.email`] && <span className="text-sm text-danger-700">{errors[`${c.id}.email`]}</span>}
                </label>
                <label className="field-label">Phone
                  <input className="input" type="tel" autoComplete="off" value={c.phone} onChange={(e) => setC(c.id, 'phone', e.target.value)} placeholder="[Phone number]" />
                </label>
                <label className="field-label sm:col-span-2">Role
                  <select className="input" value={c.role} onChange={(e) => setC(c.id, 'role', e.target.value)}>
                    {CONTACT_ROLES.map((r) => <option key={r}>{r}</option>)}
                  </select>
                </label>
              </div>
            </fieldset>
          ))}

          <button type="button" onClick={() => setContacts((l) => [...l, newContact(l.length === 0)])}
            className="btn border border-dashed border-line-strong bg-surface text-brand-600 hover:bg-subtle"><FiPlus aria-hidden="true" /> Add another contact</button>
        </div>
      )}
      </div>

      {/* Footer pinned to the bottom of the drawer */}
      <div className="sticky bottom-0 flex justify-between gap-2.5 border-t border-line bg-subtle px-5 py-4 sm:px-6">
        {step === 0 ? <button className="btn-secondary" onClick={onClose}>Cancel</button> : <button className="btn-secondary" onClick={() => setStep(0)}>Back</button>}
        {step === 0 ? <button className="btn-primary" onClick={next}>Continue to contacts</button> : <button className="btn-primary" onClick={save}>Save account</button>}
      </div>
    </Drawer>
  );
}
