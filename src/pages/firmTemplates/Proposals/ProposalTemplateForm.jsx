import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Check, ChevronLeft, ChevronRight, CircleAlert, FileSignature, SearchX, Trash2 } from 'lucide-react';
import GeneralStep from '../../../components/Proposal/GeneralStep';
import TextStep from '../../../components/Proposal/TextStep';
import ServicesInvoicesStep from '../../../components/Proposal/ServicesInvoicesStep';
import PaymentStep from '../../../components/Proposal/PaymentStep';
import { Modal } from '../../../components/ui';
import { Alert, AlertTitle } from '../../../components/ui/alert';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { ToastBridge } from '../../../components/ui/sonner';
import { EmptyState } from '../../../components/page';
import { useData } from '../../../context/DataContext';
import { emptyProposal, proposalSteps, validateProposalStep } from '../../../data/proposalTemplates';
import { cn } from 'lib/utils';

const LIST_PATH = '/firmtemp/templates/proposals';
const clone = (o) => JSON.parse(JSON.stringify(o));

/* ---------- building blocks ---------- */
function EditorHeader({ backLabel, backAria, onBack, icon: Icon, title, status, description, actions }) {
  return (
    <header className="flex flex-col gap-4">
      <button type="button" onClick={onBack} aria-label={backAria}
        className="group inline-flex w-fit items-center gap-1.5 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />{backLabel}
      </button>
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="flex min-w-0 items-start gap-3.5">
          {Icon && (
            <span className="mt-0.5 inline-flex size-10 flex-none items-center justify-center rounded-xl border border-brand-100 bg-brand-50 text-brand-700 [&_svg]:size-5" aria-hidden="true">
              <Icon />
            </span>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h1 className="page-title truncate">{title}</h1>
              {status}
            </div>
            {description && <p className="page-description">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}

function ActionBar({ dirty, isNew, start, children }) {
  return (
    <div className="sticky bottom-0 z-20 -mx-4 -mb-6 mt-6 border-t bg-card/85 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:-mb-8 lg:px-8">
      <div className="mx-auto flex max-w-[1100px] flex-wrap items-center gap-2">
        {start}
        <span className={cn('mr-auto inline-flex items-center gap-2 text-sm', dirty ? 'font-medium text-warning-700' : 'text-muted-foreground')} aria-live="polite">
          <span className={cn('size-1.5 rounded-full', dirty ? 'bg-warning-500' : isNew ? 'bg-muted-foreground/50' : 'bg-success-500')} aria-hidden="true" />
          <span className="hidden sm:inline">{dirty ? 'Unsaved changes' : isNew ? 'Not saved yet' : 'All changes saved'}</span>
        </span>
        {children}
      </div>
    </div>
  );
}

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

  if (!saveProposalTemplate) {
    return <Alert variant="destructive"><AlertTriangle aria-hidden="true" /><AlertTitle>Proposal templates are not set up in DataContext.js</AlertTitle></Alert>;
  }
  if (proposalId && !existing) {
    return (
      <div className="page max-w-[1100px]">
        <Card>
          <EmptyState icon={SearchX} title="Proposal template not found" description="It may have been deleted, or the link is out of date."
            action={<Button asChild><Link to={LIST_PATH}><ArrowLeft />Back to proposals</Link></Button>} />
        </Card>
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
  const currentHasError = hasStepError(stepKey);
  const progress = availableSteps.length > 1 ? (step / (availableSteps.length - 1)) * 100 : 100;

  return (
    <>
      <div className="page max-w-[1100px]">
        <EditorHeader backLabel="Proposals & ELs" backAria="Back to proposals" onBack={handleBackToList} icon={FileSignature}
          title={isEditing ? `Edit Proposal: ${saved.general.templateName}` : 'Create New Proposal'}
          status={!isEditing ? <Badge variant="info" dot>New</Badge> : dirty ? <Badge variant="warning" dot>Edited</Badge> : <Badge variant="success" dot>Saved</Badge>}
          description={`Step ${step + 1} of ${availableSteps.length} · ${availableSteps[step]?.name}`}
          actions={isEditing && <Button variant="destructive-outline" onClick={() => setModal('delete')}><Trash2 />Delete</Button>} />

        {/* Stepper */}
        <nav aria-label="Proposal steps" className="overflow-hidden rounded-xl border bg-card shadow-card">
          <ol className="flex items-center gap-1 overflow-x-auto px-3 py-3 sm:px-4">
            {availableSteps.map((s, i) => {
              const isActive = i === step;
              const hasError = hasStepError(s.key);
              const isCompleted = i < step && !hasError;
              const last = i === availableSteps.length - 1;
              return (
                <li key={s.key} className={cn('flex min-w-0 items-center gap-1', !last && 'flex-1')}>
                  <button type="button" onClick={() => goToStep(i)} aria-current={isActive ? 'step' : undefined}
                    aria-label={`Step ${i + 1}: ${s.name}${hasError ? ' (has errors)' : isCompleted ? ' (done)' : ''}`}
                    className={cn('group flex flex-none items-center gap-2.5 rounded-md px-1.5 py-1 text-sm font-medium transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                      isActive ? 'text-foreground' : hasError ? 'text-danger-700' : isCompleted ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')}>
                    <span className={cn('inline-flex size-6 flex-none items-center justify-center rounded-full border text-xs font-semibold tabular-nums transition-colors',
                      isActive ? (hasError ? 'border-danger-600 bg-danger-600 text-danger-50 ring-4 ring-danger-100' : 'border-primary bg-primary text-primary-foreground ring-4 ring-primary/15')
                        : hasError ? 'border-danger-200 bg-danger-50 text-danger-700'
                          : isCompleted ? 'border-primary/40 bg-primary/10 text-primary'
                            : 'border-line-strong bg-card text-muted-foreground')}>
                      {hasError && !isActive ? <CircleAlert className="size-3.5" aria-hidden="true" /> : isCompleted ? <Check className="size-3.5" strokeWidth={3} aria-hidden="true" /> : i + 1}
                    </span>
                    <span className={cn('whitespace-nowrap', !isActive && 'hidden md:inline')}>{s.name}</span>
                  </button>
                  {!last && <span className={cn('mx-1 h-px min-w-3 flex-1 rounded-full', isCompleted ? 'bg-primary/50' : 'bg-border')} aria-hidden="true" />}
                </li>
              );
            })}
          </ol>
          <div className="h-0.5 bg-muted" aria-hidden="true">
            <div className="h-full bg-primary/70 transition-[width] duration-300" style={{ width: `${progress}%` }} />
          </div>
        </nav>

        {currentHasError && (
          <Alert variant="destructive">
            <CircleAlert aria-hidden="true" />
            <AlertTitle>Please fix the highlighted fields in this step.</AlertTitle>
          </Alert>
        )}

        {/* Step content */}
        <Card className="p-5 sm:p-8">{content}</Card>

        {modal === 'discard' && (
          <Modal title="Discard changes?" onClose={() => setModal(null)}
            footer={<><Button variant="outline" onClick={() => setModal(null)}>Keep editing</Button><Button variant="destructive" onClick={() => navigate(LIST_PATH)}>Discard</Button></>}>
            <p className="text-sm text-muted-foreground">Your changes to this proposal haven't been saved.</p>
          </Modal>
        )}
        {modal === 'delete' && (
          <Modal title={`Delete “${saved.general.templateName}”?`} onClose={() => setModal(null)}
            footer={<><Button variant="outline" onClick={() => setModal(null)}>Cancel</Button><Button variant="destructive" onClick={() => { deleteProposalTemplates([proposalId]); navigate(LIST_PATH, { state: { toast: `Deleted “${saved.general.templateName}”` } }); }}><Trash2 />Delete</Button></>}>
            <p className="text-sm text-muted-foreground">Proposals already sent from this template are not affected.</p>
          </Modal>
        )}
        <ToastBridge message={toast} />
      </div>

      {/* Navigation (sticky) */}
      <ActionBar dirty={dirty} isNew={!isEditing}
        start={<Button variant="outline" onClick={prevStep} disabled={step === 0}><ChevronLeft />Previous</Button>}>
        <Button variant="ghost" onClick={handleBackToList}>Cancel</Button>
        <Button variant="outline" onClick={() => handleSubmit(false)}>{isEditing ? 'Update' : 'Save'}</Button>
        <Button onClick={nextStep}>
          {isLastStep ? (isEditing ? 'Update Proposal' : 'Submit Proposal') : <>Next<ChevronRight /></>}
        </Button>
      </ActionBar>
    </>
  );
}
