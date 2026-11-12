import { useEffect, useState } from 'react';
import { AlertCircle, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import TextStep from './TextStep';
import ServicesInvoicesStep from './ServicesInvoicesStep';
import PaymentStep from './PaymentStep';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { cn } from 'lib/utils';
import { proposalSteps } from '../../data/proposalTemplates';

/**
 * The proposal stepper shared by proposal templates and account proposals:
 * General · Introduction · Terms · Services & Invoices · Payment.
 * Props:
 *   formData · updateFormData(section, changes)
 *   validate(stepKey, formData) → errors for that step
 *   renderGeneral(stepProps)    → the General step (templates and account proposals differ here)
 *   renderHeader({ step, total, name }) → optional text above the stepper
 *   onSave(exitAfterSave)       → called once every step is valid
 *   onCancel · isEditing · dirty · saveLabel · submitLabel
 *   draftSteps                  → steps checked by Save (e.g. ['general'] for drafts); default: every step
 */
export default function ProposalWizard({ formData, updateFormData, validate, renderGeneral, renderHeader, onSave, onCancel, isEditing, dirty, saveLabel, submitLabel, draftSteps }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [stepErrors, setStepErrors] = useState({});     // { general: {...}, terms: {...}, … }

  const availableSteps = proposalSteps(formData);
  const step = Math.min(currentStep, availableSteps.length - 1);
  const stepKey = availableSteps[step]?.key;
  const isLastStep = step === availableSteps.length - 1;

  // once a step has shown errors, re-check it as the user fixes things
  useEffect(() => {
    setStepErrors((prev) => {
      const next = { ...prev };
      Object.keys(prev).forEach((key) => { next[key] = validate(key, formData); });
      return next;
    });
  }, [formData]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasStepError = (key) => stepErrors[key] && Object.keys(stepErrors[key]).length > 0;
  const goToStep = (i) => { if (i >= 0 && i < availableSteps.length) { setCurrentStep(i); window.scrollTo?.({ top: 0 }); } };
  const validateAll = (keys) => {
    const all = {};
    availableSteps.filter((s) => !keys || keys.includes(s.key)).forEach((s) => { const e = validate(s.key, formData); if (Object.keys(e).length) all[s.key] = e; });
    return all;
  };
  const handleSubmit = (exit) => {
    const all = validateAll(exit ? undefined : draftSteps);
    if (Object.keys(all).length) {
      setStepErrors(all);
      const first = availableSteps.findIndex((s) => all[s.key]);
      goToStep(first === -1 ? 0 : first);
      return;
    }
    onSave(exit);
  };
  const nextStep = () => {
    const e = validate(stepKey, formData);
    setStepErrors((prev) => ({ ...prev, [stepKey]: e }));
    if (Object.keys(e).length) { window.scrollTo?.({ top: 0, behavior: 'smooth' }); return; }
    if (isLastStep) handleSubmit(true);
    else goToStep(step + 1);
  };

  const stepProps = { formData, updateFormData, stepErrors: stepErrors[stepKey] || {} };
  const content = {
    general: renderGeneral(stepProps),
    introduction: <TextStep {...stepProps} section="introduction" heading="Introduction" titleLabel="Introduction Title" descriptionLabel="Description"
      intro="Explain to your clients who you are, what services you provide, the value you bring, and any other information you want to share."
      titlePlaceholder="Enter introduction title" descriptionPlaceholder="Tell the client about your firm…" />,
    terms: <TextStep {...stepProps} section="terms" heading="Terms" titleLabel="Terms Title" descriptionLabel="Terms and conditions"
      intro="The engagement letter or contractual agreement your client reviews and signs."
      titlePlaceholder="e.g. Engagement letter" descriptionPlaceholder="Scope of work, fees, responsibilities…" />,
    services: <ServicesInvoicesStep {...stepProps} />,
    payments: <PaymentStep {...stepProps} />,
  }[stepKey];

  return (
    <>
      {renderHeader?.({ step: step + 1, total: availableSteps.length, name: availableSteps[step]?.name })}

      {/* Stepper */}
      <nav aria-label="Proposal steps" className="rounded-xl border bg-card px-4 py-3.5 shadow-card sm:px-5">
        {/* phones: compact progress */}
        <div className="mb-3 flex items-center justify-between gap-3 text-sm sm:hidden">
          <span className="font-medium">{availableSteps[step]?.name}</span>
          <span className="tabular-nums text-muted-foreground">Step {step + 1} of {availableSteps.length}</span>
        </div>
        <Progress value={((step + 1) / availableSteps.length) * 100} className="mb-3 h-1 sm:hidden" aria-hidden="true" />
        <ol className="flex items-center gap-2">
          {availableSteps.map((s, i) => {
            const isActive = i === step;
            const hasError = hasStepError(s.key);
            const isCompleted = i < step && !hasError;
            const last = i === availableSteps.length - 1;
            return (
              <li key={s.key} className={cn('flex min-w-0 items-center gap-2', !last && 'flex-1')}>
                <button type="button" onClick={() => goToStep(i)} aria-current={isActive ? 'step' : undefined} aria-label={`Step ${i + 1}: ${s.name}${hasError ? ' (has errors)' : isCompleted ? ' (done)' : ''}`}
                  className="group flex min-w-0 flex-none items-center gap-2.5 rounded-md py-1 pr-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
                  <span className={cn('inline-flex size-7 flex-none items-center justify-center rounded-full text-xs font-semibold tabular-nums transition-[background-color,color,box-shadow]',
                    isActive && !hasError ? 'bg-primary text-primary-foreground ring-4 ring-primary/15'
                      : hasError ? cn('bg-danger-50 text-danger-700 ring-1 ring-inset ring-danger-200', isActive && 'ring-2')
                        : isCompleted ? 'bg-primary/10 text-primary group-hover:bg-primary/15'
                          : 'border bg-card text-muted-foreground group-hover:border-line-strong group-hover:text-foreground')}>
                    {hasError ? <AlertCircle className="size-3.5" aria-hidden="true" /> : isCompleted ? <Check className="size-3.5" strokeWidth={3} aria-hidden="true" /> : i + 1}
                  </span>
                  <span className={cn('hidden truncate font-medium md:inline',
                    isActive ? 'text-foreground' : hasError ? 'text-danger-700' : 'text-muted-foreground group-hover:text-foreground')}>{s.name}</span>
                </button>
                {!last && <span className={cn('h-px min-w-3 flex-1 rounded-full', i < step ? 'bg-primary/40' : 'bg-border')} aria-hidden="true" />}
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Step content */}
      <div className="rounded-xl border bg-card p-5 shadow-card sm:p-8">{content}</div>

      {/* Navigation (sticky, floating) */}
      <div className="sticky bottom-4 z-10 rounded-xl border bg-card/95 px-3 py-2.5 shadow-raised backdrop-blur supports-[backdrop-filter]:bg-card/80 sm:px-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="ghost" onClick={() => goToStep(step - 1)} disabled={step === 0}><ChevronLeft />Previous</Button>
          {dirty && (
            <span className="inline-flex items-center gap-2 text-sm font-medium text-warning-700">
              <span className="relative flex size-2"><span className="absolute inline-flex size-full animate-ping rounded-full bg-warning-500 opacity-60" /><span className="relative inline-flex size-2 rounded-full bg-warning-500" /></span>
              Unsaved changes
            </span>
          )}
          <span className="ml-auto" />
          <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button type="button" variant="outline" onClick={() => handleSubmit(false)}>{saveLabel || (isEditing ? 'Update' : 'Save')}</Button>
          <Button type="button" onClick={nextStep}>
            {isLastStep ? (submitLabel || (isEditing ? 'Update Proposal' : 'Submit Proposal')) : <>Next<ChevronRight /></>}
          </Button>
        </div>
      </div>
    </>
  );
}
