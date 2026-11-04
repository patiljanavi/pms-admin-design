import { useEffect, useState } from 'react';
import { FiAlertCircle, FiCheck, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import TextStep from './TextStep';
import ServicesInvoicesStep from './ServicesInvoicesStep';
import PaymentStep from './PaymentStep';
import { cx } from '../ui';
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
      <nav aria-label="Proposal steps" className="card p-3 sm:p-4">
        <ol className="flex flex-wrap items-center gap-y-2">
          {availableSteps.map((s, i) => {
            const isActive = i === step;
            const hasError = hasStepError(s.key);
            const isCompleted = i < step && !hasError;
            return (
              <li key={s.key} className="flex items-center">
                <button type="button" onClick={() => goToStep(i)} aria-current={isActive ? 'step' : undefined} aria-label={`Step ${i + 1}: ${s.name}${hasError ? ' (has errors)' : isCompleted ? ' (done)' : ''}`}
                  className={cx('flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors',
                    isActive ? 'bg-brand-600 text-white shadow-card'
                      : hasError ? 'bg-danger-50 text-danger-700 hover:bg-danger-100'
                        : isCompleted ? 'bg-brand-100 text-brand-800 hover:bg-brand-100/70'
                          : 'bg-subtle text-muted hover:text-ink')}>
                  <span className={cx('flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold',
                    isActive ? 'bg-white/25 text-white' : hasError ? 'bg-danger-700 text-white' : isCompleted ? 'bg-brand-600 text-white' : 'bg-line-strong/60 text-ink')}>
                    {hasError && !isActive ? <FiAlertCircle size={12} aria-hidden="true" /> : isCompleted ? <FiCheck size={12} aria-hidden="true" /> : i + 1}
                  </span>
                  <span className="hidden sm:inline">{s.name}</span>
                </button>
                {i < availableSteps.length - 1 && <FiChevronRight className="mx-1 text-line-strong" aria-hidden="true" />}
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Step content */}
      <div className="card p-5 sm:p-8">{content}</div>

      {/* Navigation (sticky) */}
      <div className="sticky bottom-0 z-10 -mx-4 -mb-6 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-10 lg:-mb-8 lg:px-10">
        <div className="flex flex-wrap items-center gap-2.5">
          <button type="button" className="btn-secondary" onClick={() => goToStep(step - 1)} disabled={step === 0}><FiChevronLeft aria-hidden="true" /> Previous</button>
          {dirty && <span className="flex items-center gap-2 text-sm font-semibold text-warning-700"><span className="h-2 w-2 rounded-full bg-warning-700" aria-hidden="true" />Unsaved changes</span>}
          <span className="ml-auto" />
          <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button type="button" className="btn border border-brand-600 bg-brand-50 text-brand-600 hover:bg-brand-100" onClick={() => handleSubmit(false)}>{saveLabel || (isEditing ? 'Update' : 'Save')}</button>
          <button type="button" className="btn-primary" onClick={nextStep}>
            {isLastStep ? (submitLabel || (isEditing ? 'Update Proposal' : 'Submit Proposal')) : <>Next <FiChevronRight aria-hidden="true" /></>}
          </button>
        </div>
      </div>
    </>
  );
}
