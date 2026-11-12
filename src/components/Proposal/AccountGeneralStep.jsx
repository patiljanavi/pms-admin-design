import { Info } from 'lucide-react';
import MultiSelect from '../MultiSelect';
import ShortcodeTextField from '../ShortcodeTextField';
import { Avatar, Toggle, cx, initials } from '../ui';
import { Checkbox } from '../ui/checkbox';
import { cn } from 'lib/utils';
import { useData } from '../../context/DataContext';
import { TEAM_MEMBERS } from '../../data/sampleData';
import { accountShortcuts } from '../../data/shortcodes';
import { applyProposalTemplate } from '../../data/accountProposals';
import { fillShortcodes } from '../../data/accountChats';

const TEAM_OPTIONS = TEAM_MEMBERS.map((m) => ({ ...m, value: m.label }));

/** A step on / off card ("Introduction Step", "Terms Step", …). */
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

/**
 * General step of an ACCOUNT proposal (standalone file).
 * Fields: Account * · Template · Proposal name (visible to clients) * · Team Members * · proposal steps.
 * Picking a template fills every step of the proposal.
 *
 * Props (from ProposalWizard + AccountProposalForm):
 *   formData · updateFormData(section, changes) · setFormData(fn) · stepErrors
 */
export default function AccountGeneralStep({ formData, updateFormData, setFormData, stepErrors = {} }) {
  const { accounts = [], proposalTemplates = [] } = useData();
  const g = formData.general;
  const set = (field, value) => updateFormData('general', { [field]: value });
  const account = accounts.find((a) => a.id === g.accountId);

  // Template → fill every step (general, introduction, terms, services, payments)
  const handleTemplateChange = (id) => {
    const tpl = proposalTemplates.find((t) => t.id === id);
    if (tpl) setFormData((prev) => applyProposalTemplate(prev, tpl));
    else set('templateId', '');
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">General Information</h2>
        <p className="mt-1 text-sm text-muted-foreground">Who the proposal is for, and which template to start from.</p>
      </div>

      {/* ===== BASIC DETAILS ===== */}
      <section className="rounded-xl border bg-subtle/50 p-5">
        <h3 className="section-title mb-4">Basic details</h3>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Account */}
          <label className="field-label">
            <span>Account <span className="text-danger-700">*</span></span>
            <select className={cx('input', stepErrors.accountId && 'border-danger-700')} value={g.accountId || ''} onChange={(e) => set('accountId', e.target.value || null)}>
              <option value="">Select an account...</option>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}{a.company ? ` — ${a.company}` : ''}</option>)}
            </select>
            {stepErrors.accountId && <span className="text-xs font-normal text-danger-700">{stepErrors.accountId}</span>}
          </label>

          {/* Template */}
          <label className="field-label">Template
            <select className="input" value={g.templateId || ''} onChange={(e) => handleTemplateChange(e.target.value)}>
              <option value="">Select template...</option>
              {proposalTemplates.map((t) => <option key={t.id} value={t.id}>{t.general.templateName}</option>)}
            </select>
            <span className="text-xs font-normal text-muted-foreground">Choose a template to pre-fill the proposal</span>
          </label>

          {/* Proposal name */}
          <div className="md:col-span-2">
            <ShortcodeTextField label="Proposal name (visible to clients)" required value={g.proposalName} onChange={(v) => set('proposalName', v)}
              placeholder="Proposal name (visible to clients)" shortcuts={accountShortcuts} error={stepErrors.proposalName} />
            {account && g.proposalName.includes('[') && (
              <p className="mt-1.5 text-xs text-muted-foreground">The client sees: <span className="font-medium text-foreground" data-testid="client-sees">{fillShortcodes(g.proposalName, account)}</span></p>
            )}
          </div>

          {/* Team members */}
          <div className="md:col-span-2">
            <MultiSelect label="Team Members *" placeholder="Team Member" options={TEAM_OPTIONS} value={g.teamMembers} onChange={(v) => set('teamMembers', v)} error={stepErrors.teamMembers}
              renderOption={(o) => (
                <span className="flex flex-1 items-center gap-2.5"><Avatar text={initials(o.label)} size="sm" />
                  <span><span className="block font-medium">{o.label}</span><span className="block text-sm text-muted-foreground">{o.meta}</span></span></span>
              )} />
          </div>
        </div>
      </section>

      {/* ===== CONFIGURE PROPOSAL STEPS ===== */}
      <section className="rounded-xl border p-5">
        <h3 className="section-title">Configure proposal steps</h3>
        <p className="mb-4 mt-0.5 text-sm text-muted-foreground">Customize which steps to include in your proposal. Each step helps communicate different aspects of your service to clients.</p>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <StepCard title="Introduction Step" description="Explain to your clients who you are, what services you provide, the value you bring, and any other information you want to share."
            checked={!!g.introductionEnabled} onChange={(v) => set('introductionEnabled', v)} />
          <StepCard title="Terms Step" description="Engagement letter or contractual agreement that outlines the terms of the relationship between your firm and clients."
            checked={!!g.termsEnabled} onChange={(v) => set('termsEnabled', v)} />
          <StepCard title="Services & Invoices Step" description="Specify the services your firm will provide. Add one-time or recurring invoices to get paid automatically."
            checked={!!g.servicesEnabled} onChange={(v) => set('servicesEnabled', v)} />
          <StepCard title="Payment Step" description="Configure payment methods and terms for your proposal."
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