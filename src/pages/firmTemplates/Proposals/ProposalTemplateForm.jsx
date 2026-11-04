import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { FiAlertCircle, FiArrowLeft, FiCheck, FiChevronLeft, FiChevronRight, FiTrash2 } from 'react-icons/fi';
import GeneralStep from '../../../components/Proposal/GeneralStep';
import TextStep from '../../../components/Proposal/TextStep';
import ServicesInvoicesStep from '../../../components/Proposal/ServicesInvoicesStep';
import PaymentStep from '../../../components/Proposal/PaymentStep';
import { Modal, cx } from '../../../components/ui';
import { useData } from '../../../context/DataContext';
import { emptyProposal, proposalSteps, validateProposalStep } from '../../../data/proposalTemplates';

const LIST_PATH = '/firmtemp/templates/proposals';
const clone = (o) => JSON.parse(JSON.stringify(o));

/**
 * Create / edit a proposal template — step by step (General · Introduction · Terms · Services & Invoices · Payment).
 *   /firmtemp/templates/proposals/new          → create
 *   /firmtemp/templates/proposals/:templateId  → edit   (also accepts ?edit=<id>)
 */
export default function ProposalTemplateForm() {
  const { templateId } = useParams();
  const [params] = useSearchParams();
  const id = templateId || params.get('edit') || null;
  return <ProposalForm key={id || 'new'} proposalId={id} />;
}

function ProposalForm({ proposalId }) {
  const navigate = useNavigate();
  const { proposalTemplates = [], saveProposalTemplate, deleteProposalTemplates, proposalTemplateNameTaken } = useData();
  const existing = proposalId ? proposalTemplates.find((t) => String(t.id) === String(proposalId)) : null;
  const isEditing = !!proposalId;

  const initial = useMemo(() => (existing ? clone(existing) : emptyProposal()), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [formData, setFormData] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepErrors, setStepErrors] = useState({});     // { general: {...}, terms: {...}, … }
  const [modal, setModal] = useState(null);             // 'discard' | 'delete'
  const [toast, setToast] = useState('');
  const dirty = JSON.stringify(formData) !== JSON.stringify(saved);
  const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 2600); };

  const availableSteps = proposalSteps(formData);
  const step = Math.min(currentStep, availableSteps.length - 1);
  const stepKey = availableSteps[step]?.key;
  const isLastStep = step === availableSteps.length - 1;

  const updateFormData = (section, newData) => setFormData((prev) => ({ ...prev, [section]: { ...prev[section], ...newData } }));

  // Once a step has shown errors, re-check it as the user fixes things
  useEffect(() => {
    setStepErrors((prev) => {
      const next = { ...prev };
      Object.keys(prev).forEach((key) => { next[key] = validateProposalStep(key, formData); });
      return next;
    });
  }, [formData]);

  useEffect(() => {
    if (!dirty) return undefined;
    const h = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  if (!saveProposalTemplate) return <div role="alert" className="card bg-danger-50 p-6 font-semibold text-danger-700">Proposal templates are not set up in DataContext.js</div>;
  if (proposalId && !existing) {
    return (
      <div className="flex flex-col items-start gap-4">
        <h1 className="text-3xl font-bold">Proposal template not found</h1>
        <Link to={LIST_PATH} className="btn-primary">Back to proposals</Link>
      </div>
    );
  }

  const errorsFor = (key) => {
    const e = validateProposalStep(key, formData);
    if (key === 'general' && !e.templateName && proposalTemplateNameTaken?.(formData.general.templateName, proposalId)) e.templateName = 'Another proposal template already has this name';
    return e;
  };
  const hasStepError = (key) => stepErrors[key] && Object.keys(stepErrors[key]).length > 0;
  const validateStep = (key) => {
    const e = errorsFor(key);
    setStepErrors((prev) => ({ ...prev, [key]: e }));
    return Object.keys(e).length === 0;
  };
  const validateAll = () => {
    const all = {};
    availableSteps.forEach((s) => { const e = errorsFor(s.key); if (Object.keys(e).length) all[s.key] = e; });
    return all;
  };

  const goToStep = (i) => { if (i >= 0 && i < availableSteps.length) { setCurrentStep(i); window.scrollTo?.({ top: 0 }); } };
  const prevStep = () => goToStep(step - 1);

  const persist = () => {
    const id = saveProposalTemplate({ ...formData, id: proposalId || undefined });
    return { ...formData, id };
  };
  const handleSubmit = (exit = true) => {
    const all = validateAll();
    if (Object.keys(all).length) {
      setStepErrors(all);
      const first = availableSteps.findIndex((s) => all[s.key]);
      goToStep(first === -1 ? 0 : first);
      return;
    }
    const data = persist();
    if (exit) {
      navigate(LIST_PATH, { state: { toast: isEditing ? `Proposal updated: “${data.general.templateName}”` : `Proposal created: “${data.general.templateName}”` } });
      return;
    }
    setFormData(data); setSaved(data);
    notify(isEditing ? 'Proposal updated' : 'Proposal saved');
    if (!isEditing) navigate(`${LIST_PATH}/${data.id}`, { replace: true });
  };
  const nextStep = () => {
    if (!validateStep(stepKey)) { window.scrollTo?.({ top: 0, behavior: 'smooth' }); return; }
    if (isLastStep) handleSubmit(true);
    else goToStep(step + 1);
  };
  const handleBackToList = () => (dirty ? setModal('discard') : navigate(LIST_PATH));

  const stepProps = { formData, updateFormData, stepErrors: stepErrors[stepKey] || {} };
  const content = {
    general: <GeneralStep {...stepProps} />,
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
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-wrap items-start gap-4">
        <button onClick={handleBackToList} aria-label="Back to proposals" className="mt-1 flex h-10 w-10 flex-none items-center justify-center rounded border border-line-strong bg-surface hover:bg-subtle"><FiArrowLeft size={18} /></button>
        <div className="min-w-0 flex-1">
          <nav aria-label="Breadcrumb" className="text-sm text-muted">
            <Link to="/firmtemp/templates" className="hover:underline">Firm Templates</Link> <span aria-hidden="true">/</span> <Link to={LIST_PATH} className="hover:underline">Proposals &amp; ELs</Link>
          </nav>
          <h1 className="truncate text-2xl font-bold sm:text-3xl">{isEditing ? `Edit Proposal: ${saved.general.templateName}` : 'Create New Proposal'}</h1>
          <p className="text-muted">Step {step + 1} of {availableSteps.length} · {availableSteps[step]?.name}</p>
        </div>
        {isEditing && <button type="button" className="btn border border-danger-200 bg-surface text-danger-700 hover:bg-danger-50" onClick={() => setModal('delete')}><FiTrash2 aria-hidden="true" /> Delete</button>}
      </header>

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
          <button type="button" className="btn-secondary" onClick={prevStep} disabled={step === 0}><FiChevronLeft aria-hidden="true" /> Previous</button>
          {dirty && <span className="flex items-center gap-2 text-sm font-semibold text-warning-700"><span className="h-2 w-2 rounded-full bg-warning-700" aria-hidden="true" />Unsaved changes</span>}
          <span className="ml-auto" />
          <button type="button" className="btn-secondary" onClick={handleBackToList}>Cancel</button>
          <button type="button" className="btn border border-brand-600 bg-brand-50 text-brand-600 hover:bg-brand-100" onClick={() => handleSubmit(false)}>{isEditing ? 'Update' : 'Save'}</button>
          <button type="button" className="btn-primary" onClick={nextStep}>
            {isLastStep ? (isEditing ? 'Update Proposal' : 'Submit Proposal') : <>Next <FiChevronRight aria-hidden="true" /></>}
          </button>
        </div>
      </div>

      {modal === 'discard' && (
        <Modal title="Discard changes?" onClose={() => setModal(null)}
          footer={<><button className="btn-secondary" onClick={() => setModal(null)}>Keep editing</button><button className="btn bg-danger-700 text-white hover:bg-[#831E15]" onClick={() => navigate(LIST_PATH)}>Discard</button></>}>
          <p className="text-muted">Your changes to this proposal haven't been saved.</p>
        </Modal>
      )}
      {modal === 'delete' && (
        <Modal title={`Delete “${saved.general.templateName}”?`} onClose={() => setModal(null)}
          footer={<><button className="btn-secondary" onClick={() => setModal(null)}>Cancel</button><button className="btn bg-danger-700 text-white hover:bg-[#831E15]" onClick={() => { deleteProposalTemplates([proposalId]); navigate(LIST_PATH, { state: { toast: `Deleted “${saved.general.templateName}”` } }); }}>Delete</button></>}>
          <p className="text-muted">Proposals already sent from this template are not affected.</p>
        </Modal>
      )}
      {toast && <div role="status" className="fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-md bg-ink px-5 py-3 font-semibold text-white">{toast}</div>}
    </div>
  );
}