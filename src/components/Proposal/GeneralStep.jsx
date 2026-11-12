import { Info } from 'lucide-react';
import MultiSelect from '../MultiSelect';
import ShortcodeTextField from '../ShortcodeTextField';
import { Avatar, Toggle, cx, initials } from '../ui';
import { Checkbox } from '../ui/checkbox';
import { cn } from 'lib/utils';
import { TEAM_MEMBERS } from '../../data/sampleData';
import { accountShortcuts } from '../../data/shortcodes';

const TEAM_OPTIONS = TEAM_MEMBERS.map((m) => ({ ...m, value: m.label }));

function StepCard({ title, description, checked, onChange, note }) {
  return (
    <label className={cn('flex cursor-pointer gap-3 rounded-lg border p-4 transition-[border-color,background-color,box-shadow]',
      checked ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20' : 'bg-card hover:border-line-strong hover:bg-accent/40')}>
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(v === true)} className="mt-0.5" aria-label={title} />
      <span className="min-w-0">
        <span className="block text-sm font-medium">{title}</span>
        <span className="mt-1 block text-sm text-muted-foreground">{description}</span>
        {note && <span className="mt-2 flex items-start gap-1.5 text-xs font-medium text-warning-700"><Info className="mt-px size-3.5 flex-none" aria-hidden="true" />{note}</span>}
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
        <h2 className="text-xl font-semibold tracking-tight">General Information</h2>
        <p className="mt-1 text-sm text-muted-foreground">Name the template, choose who works on it and which steps clients go through.</p>
      </div>

      <section className="rounded-xl border bg-subtle/50 p-5">
        <h3 className="section-title mb-4">Basic details</h3>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <label className="field-label">
            <span>Template Name <span className="text-danger-700">*</span></span>
            <input className={cx('input', stepErrors.templateName && 'border-danger-700')} value={g.templateName} onChange={(e) => set('templateName', e.target.value)} placeholder="e.g. Small business package" />
            {stepErrors.templateName && <span className="text-xs font-normal text-danger-700">{stepErrors.templateName}</span>}
          </label>
          <div>
            <ShortcodeTextField label="Proposal name (visible to clients)" required value={g.proposalName} onChange={(v) => set('proposalName', v)}
              placeholder="e.g. [CURRENT_YEAR] services for [ACCOUNT_NAME]" shortcuts={accountShortcuts} error={stepErrors.proposalName} />
          </div>
          <div className="md:col-span-2">
            <MultiSelect label="Team Members *" placeholder="Team Member" options={TEAM_OPTIONS} value={g.teamMembers} onChange={(v) => set('teamMembers', v)} error={stepErrors.teamMembers}
              renderOption={(o) => (
                <span className="flex flex-1 items-center gap-2.5"><Avatar text={initials(o.label)} size="sm" />
                  <span><span className="block font-medium">{o.label}</span><span className="block text-sm text-muted-foreground">{o.meta}</span></span></span>
              )} />
          </div>
        </div>
      </section>

      <section className="rounded-xl border p-5">
        <h3 className="section-title">Configure proposal steps</h3>
        <p className="mb-4 mt-0.5 text-sm text-muted-foreground">Customize which steps to include in your proposal.</p>
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
        <div className="mt-4 flex items-center justify-between gap-4 rounded-lg border bg-card p-4">
          <div><div className="text-sm font-medium">Skip stepper for clients</div><div className="text-sm text-muted-foreground">Clients see the whole proposal on one page instead of step by step</div></div>
          <Toggle label="Skip stepper for clients" checked={!!g.skipStepper} onChange={(v) => set('skipStepper', v)} />
        </div>
      </section>
    </div>
  );
}