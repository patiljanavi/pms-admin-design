import { FiInfo } from 'react-icons/fi';
import MultiSelect from '../MultiSelect';
import ShortcodeTextField from '../ShortcodeTextField';
import { Avatar, Toggle, cx, initials } from '../ui';
import { TEAM_MEMBERS } from '../../data/sampleData';
import { accountShortcuts } from '../../data/shortcodes';

const TEAM_OPTIONS = TEAM_MEMBERS.map((m) => ({ ...m, value: m.label }));

function StepCard({ title, description, checked, onChange, note }) {
  return (
    <label className={cx('flex cursor-pointer gap-3 rounded-lg border-2 p-4 transition-colors', checked ? 'border-brand-600 bg-brand-50/60' : 'border-line hover:border-line-strong')}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-[18px] w-[18px] flex-none accent-brand-600" aria-label={title} />
      <span className="min-w-0">
        <span className="block font-semibold">{title}</span>
        <span className="mt-1 flex items-start gap-1.5 text-sm text-muted"><FiInfo className="mt-0.5 flex-none" aria-hidden="true" />{description}</span>
        {note && <span className="mt-1 block text-xs font-semibold text-warning-700">{note}</span>}
      </span>
    </label>
  );
}

/** Step 1 — General: names, team members and which steps the proposal has. */
export default function GeneralStep({ formData, updateFormData, stepErrors = {} }) {
  const g = formData.general;
  const set = (field, value) => updateFormData('general', { [field]: value });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold">General Information</h2>
        <p className="text-muted">Name the template, choose who works on it and which steps clients go through.</p>
      </div>

      <section className="rounded-lg border border-line bg-subtle/40 p-5">
        <h3 className="mb-4 font-semibold">Basic details</h3>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <label className="field-label">
            <span>Template Name <span className="text-danger-700">*</span></span>
            <input className={cx('input', stepErrors.templateName && 'border-danger-700')} value={g.templateName} onChange={(e) => set('templateName', e.target.value)} placeholder="e.g. Small business package" />
            {stepErrors.templateName && <span className="text-sm font-normal text-danger-700">{stepErrors.templateName}</span>}
          </label>
          <div>
            <ShortcodeTextField label="Proposal name (visible to clients)" required value={g.proposalName} onChange={(v) => set('proposalName', v)}
              placeholder="e.g. [CURRENT_YEAR] services for [ACCOUNT_NAME]" shortcuts={accountShortcuts} error={stepErrors.proposalName} />
          </div>
          <div className="md:col-span-2">
            <MultiSelect label="Team Members *" placeholder="Team Member" options={TEAM_OPTIONS} value={g.teamMembers} onChange={(v) => set('teamMembers', v)} error={stepErrors.teamMembers}
              renderOption={(o) => (
                <span className="flex flex-1 items-center gap-2.5"><Avatar text={initials(o.label)} size="sm" />
                  <span><span className="block font-semibold">{o.label}</span><span className="block text-sm text-muted">{o.meta}</span></span></span>
              )} />
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-line p-5">
        <h3 className="font-semibold">Configure proposal steps</h3>
        <p className="mb-4 text-sm text-muted">Customize which steps to include in your proposal.</p>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <StepCard title="Introduction Step" description="Explain to your clients who you are, what you do and the value you bring."
            checked={!!g.introductionEnabled} onChange={(v) => set('introductionEnabled', v)} />
          <StepCard title="Terms Step" description="Engagement letter or contractual agreement the client signs."
            checked={!!g.termsEnabled} onChange={(v) => set('termsEnabled', v)} />
          <StepCard title="Services & Invoices Step" description="Specify the services your firm will provide and how they are billed."
            checked={!!g.servicesEnabled} onChange={(v) => set('servicesEnabled', v)} />
          <StepCard title="Payment Step" description="Collect a payment when the client signs the proposal."
            checked={!!g.paymentsEnabled} onChange={(v) => set('paymentsEnabled', v)}
            note={g.paymentsEnabled && formData.services.option !== 'invoice' ? 'Shown only when Services & Invoices bills using invoices.' : ''} />
        </div>
        <div className="mt-4 flex items-start justify-between gap-4 rounded-md border border-line p-3.5">
          <div><div className="font-semibold">Skip stepper for clients</div><div className="text-sm text-muted">Clients see the whole proposal on one page instead of step by step</div></div>
          <Toggle label="Skip stepper for clients" checked={!!g.skipStepper} onChange={(v) => set('skipStepper', v)} />
        </div>
      </section>
    </div>
  );
}