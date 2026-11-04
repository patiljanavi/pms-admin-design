import { FiInfo } from 'react-icons/fi';
import MultiSelect from '../MultiSelect';
import ShortcodeTextField from '../ShortcodeTextField';
import { Avatar, Toggle, cx, initials } from '../ui';
import { useData } from '../../context/DataContext';
import { TEAM_MEMBERS } from '../../data/sampleData';
import { accountShortcuts } from '../../data/shortcodes';
import { applyProposalTemplate } from '../../data/accountProposals';
import { fillShortcodes } from '../../data/accountChats';

const TEAM_OPTIONS = TEAM_MEMBERS.map((m) => ({ ...m, value: m.label }));

/** A step on / off card ("Introduction Step", "Terms Step", …). */
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
        <h2 className="text-2xl font-bold">General Information</h2>
        <p className="text-muted">Who the proposal is for, and which template to start from.</p>
      </div>

      {/* ===== BASIC DETAILS ===== */}
      <section className="rounded-lg border border-line bg-subtle/40 p-5">
        <h3 className="mb-4 font-semibold">Basic details</h3>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Account */}
          <label className="field-label">
            <span>Account <span className="text-danger-700">*</span></span>
            <select className={cx('input', stepErrors.accountId && 'border-danger-700')} value={g.accountId || ''} onChange={(e) => set('accountId', e.target.value || null)}>
              <option value="">Select an account...</option>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}{a.company ? ` — ${a.company}` : ''}</option>)}
            </select>
            {stepErrors.accountId && <span className="text-sm font-normal text-danger-700">{stepErrors.accountId}</span>}
          </label>

          {/* Template */}
          <label className="field-label">Template
            <select className="input" value={g.templateId || ''} onChange={(e) => handleTemplateChange(e.target.value)}>
              <option value="">Select template...</option>
              {proposalTemplates.map((t) => <option key={t.id} value={t.id}>{t.general.templateName}</option>)}
            </select>
            <span className="text-xs font-normal text-muted">Choose a template to pre-fill the proposal</span>
          </label>

          {/* Proposal name */}
          <div className="md:col-span-2">
            <ShortcodeTextField label="Proposal name (visible to clients)" required value={g.proposalName} onChange={(v) => set('proposalName', v)}
              placeholder="Proposal name (visible to clients)" shortcuts={accountShortcuts} error={stepErrors.proposalName} />
            {account && g.proposalName.includes('[') && (
              <p className="mt-1.5 text-xs text-muted">The client sees: <span className="font-semibold text-ink" data-testid="client-sees">{fillShortcodes(g.proposalName, account)}</span></p>
            )}
          </div>

          {/* Team members */}
          <div className="md:col-span-2">
            <MultiSelect label="Team Members *" placeholder="Team Member" options={TEAM_OPTIONS} value={g.teamMembers} onChange={(v) => set('teamMembers', v)} error={stepErrors.teamMembers}
              renderOption={(o) => (
                <span className="flex flex-1 items-center gap-2.5"><Avatar text={initials(o.label)} size="sm" />
                  <span><span className="block font-semibold">{o.label}</span><span className="block text-sm text-muted">{o.meta}</span></span></span>
              )} />
          </div>
        </div>
      </section>

      {/* ===== CONFIGURE PROPOSAL STEPS ===== */}
      <section className="rounded-lg border border-line p-5">
        <h3 className="font-semibold">Configure proposal steps</h3>
        <p className="mb-4 text-sm text-muted">Customize which steps to include in your proposal. Each step helps communicate different aspects of your service to clients.</p>
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
        <div className="mt-4 flex items-start justify-between gap-4 rounded-md border border-line p-3.5">
          <div><div className="font-semibold">Skip stepper for clients</div><div className="text-sm text-muted">Clients see the whole proposal on one page instead of step by step</div></div>
          <Toggle label="Skip stepper for clients" checked={!!g.skipStepper} onChange={(v) => set('skipStepper', v)} />
        </div>
      </section>
    </div>
  );
}