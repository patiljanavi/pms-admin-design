import { useEffect, useId, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, CircleAlert, GitBranch, LayoutTemplate, SearchX, Settings2, Trash2 } from 'lucide-react';
import MultiSelect from '../../../components/MultiSelect';
import StagesSection from './StagesSection';
import { Avatar, Modal, initials } from '../../../components/ui';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Checkbox } from '../../../components/ui/checkbox';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { SimpleTooltip } from '../../../components/ui/tooltip';
import { EmptyState } from '../../../components/page';
import { cn } from 'lib/utils';
import { useData } from '../../../context/DataContext';
import { TEAM_MEMBERS } from '../../../data/sampleData';
import { JOB_CARD_FIELDS, SORT_JOBS_BY, emptyPipeline, newStage } from '../../../data/pipelinesdata';
import { templateOptionsFrom } from '../../../data/statusOptions';
import { ToastBridge } from '../../../components/ui/sonner';

const LIST_PATH = '/firmtemp/pipelines';
const TEAM_OPTIONS = TEAM_MEMBERS.map((m) => ({ ...m, value: m.label }));
const clone = (o) => JSON.parse(JSON.stringify(o));
const NONE = '__none__';

function FormCard({ title, description, icon: Icon, action, children }) {
  return (
    <Card className="flex flex-col">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b px-5 py-4 sm:px-6">
        <div className="flex min-w-0 items-start gap-3">
          {Icon && (
            <span className="mt-0.5 inline-flex size-8 flex-none items-center justify-center rounded-lg border bg-subtle text-muted-foreground" aria-hidden="true">
              <Icon className="size-4" />
            </span>
          )}
          <div className="min-w-0">
            <h2 className="section-title">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
          </div>
        </div>
        {action}
      </div>
      <div className="flex flex-col gap-5 px-5 py-5 sm:px-6">{children}</div>
    </Card>
  );
}

function Field({ label, htmlFor, required, hint, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor}>{label}{required && <span className="ml-0.5 text-danger-700">*</span>}</Label>
      {children}
      {error ? <p className="text-xs text-danger-700">{error}</p> : hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/**
 * Create / edit a pipeline template.
 *   /firmtemp/pipelines/new            → create
 *   /firmtemp/pipelines/:pipelineId    → edit   (also accepts ?edit=<id>)
 */
export default function PipelineForm() {
  const { pipelineId } = useParams();
  const [params] = useSearchParams();
  const id = pipelineId || params.get('edit') || null;
  return <FormPage key={id || 'new'} editingId={id} />;
}

function FormPage({ editingId }) {
  const navigate = useNavigate();
  const uid = useId();
  const { pipelines = [], savePipeline, deletePipelines, pipelineNameTaken, jobTemplates = [] } = useData();
  const existing = editingId ? pipelines.find((p) => String(p.id) === String(editingId)) : null;
  const jobTemplateOptions = templateOptionsFrom(jobTemplates);

  const initial = useMemo(() => clone(existing || { ...emptyPipeline, stages: [newStage('To do'), newStage('Done')] }), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [form, setForm] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [currentId, setCurrentId] = useState(existing?.id || null);
  const [errors, setErrors] = useState({});
  const [stageErrors, setStageErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(null); // 'discard' | 'delete'
  const [toast, setToast] = useState('');
  const dirty = JSON.stringify(form) !== JSON.stringify(saved);
  const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 2600); };
  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })); };

  useEffect(() => {
    if (!dirty) return undefined;
    const h = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  if (!savePipeline) {
    return (
      <div role="alert" className="flex items-center gap-2 rounded-xl border border-danger-200 bg-danger-50 p-5 text-sm font-medium text-danger-700">
        <CircleAlert className="size-4 flex-none" aria-hidden="true" />Pipelines are not set up in DataContext.js
      </div>
    );
  }
  if (editingId && !existing && !currentId) {
    return (
      <div className="page">
        <Card>
          <EmptyState icon={SearchX} title="Pipeline not found"
            description="It may have been deleted, or the link is out of date."
            action={<Button onClick={() => navigate(LIST_PATH)}><ArrowLeft />Back to pipeline templates</Button>} />
        </Card>
      </div>
    );
  }

  const isEdit = !!currentId;
  const cardFieldsOn = JOB_CARD_FIELDS.filter((f) => form[f.name]).length;
  const setAllCardFields = (on) => setForm((f) => ({ ...f, ...Object.fromEntries(JOB_CARD_FIELDS.map((c) => [c.name, on])) }));
  const setStages = (stages) => { setForm((f) => ({ ...f, stages })); setStageErrors([]); setErrors((e) => ({ ...e, stages: undefined })); };

  const validate = () => {
    const e = {};
    const name = form.pipelineName.trim();
    if (!name) e.pipelineName = 'Pipeline name is required.';
    else if (pipelineNameTaken?.(name, currentId)) e.pipelineName = 'Another pipeline already has this name.';
    if (form.stages.length < 2) e.stages = 'Please add at least 2 stages.';
    const seen = new Map();
    const se = form.stages.map((s, i) => {
      const n = s.name.trim().toLowerCase();
      if (!n) return `Stage ${i + 1} name is required`;
      if (seen.has(n)) return 'Stage names must be different';
      seen.set(n, i);
      return '';
    });
    if (se.some(Boolean)) e.stageNames = `${se.filter(Boolean).length} stage name(s) need fixing.`;
    setErrors(e); setStageErrors(se);
    if (Object.keys(e).length) window.scrollTo?.({ top: 0, behavior: 'smooth' });
    return Object.keys(e).length === 0;
  };

  const handleSavePipeline = (exitAfterSave) => {
    if (!validate()) return;
    setLoading(true);
    const rec = savePipeline({ ...form, id: currentId || undefined });
    setLoading(false);
    if (exitAfterSave) {
      navigate(LIST_PATH, { state: { toast: `Pipeline ${isEdit ? 'updated' : 'created'}: “${rec.pipelineName}”` } });
      return;
    }
    const clean = clone({ ...rec });
    setForm(clean); setSaved(clean); setCurrentId(rec.id);
    notify(`Pipeline ${isEdit ? 'updated' : 'created'} successfully!`);
    if (!isEdit) navigate(`${LIST_PATH}/${rec.id}`, { replace: true });
  };
  const handleCancel = () => (dirty ? setModal('discard') : navigate(LIST_PATH));
  const errorList = [errors.pipelineName, errors.stages, errors.stageNames].filter(Boolean);
  const nameId = `${uid}-name`;
  const sortId = `${uid}-sort`;
  const tplId = `${uid}-tpl`;

  return (
    <div className="page pb-2">
      {/* Header */}
      <header className="flex flex-wrap items-start gap-x-4 gap-y-3">
        <SimpleTooltip label="Back to pipeline templates">
          <Button type="button" variant="outline" size="icon" onClick={handleCancel} aria-label="Back to pipeline templates" className="mt-0.5 flex-none"><ArrowLeft /></Button>
        </SimpleTooltip>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="page-title flex items-center gap-2.5 truncate">
              <span className="inline-flex size-8 flex-none items-center justify-center rounded-lg border border-brand-100 bg-brand-50 text-brand-700" aria-hidden="true"><GitBranch className="size-4" /></span>
              {isEdit ? 'Edit Pipeline' : 'Create Pipeline'}
            </h1>
            {isEdit && saved.pipelineName && <Badge variant="neutral" className="max-w-[240px] truncate">{saved.pipelineName}</Badge>}
          </div>
          <p className="page-description">Configure pipeline settings and stages</p>
        </div>
        {isEdit && (
          <Button type="button" variant="destructive-outline" onClick={() => setModal('delete')} disabled={loading}><Trash2 aria-hidden="true" />Delete</Button>
        )}
      </header>

      {errorList.length > 0 && (
        <div role="alert" className="flex gap-3 rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-danger-700">
          <CircleAlert className="mt-0.5 size-4 flex-none" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold">Please fix the following:</p>
            <ul className="mt-1 list-disc pl-5 text-sm">{errorList.map((m) => <li key={m}>{m}</li>)}</ul>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
        {/* LEFT – Pipeline settings */}
        <FormCard title="Pipeline Details" description="Name, who can use it and how jobs are ordered." icon={Settings2}>
          <Field label="Pipeline Name" htmlFor={nameId} required error={errors.pipelineName}>
            <Input id={nameId} value={form.pipelineName} onChange={(e) => set('pipelineName', e.target.value)} placeholder="Pipeline Name"
              aria-invalid={!!errors.pipelineName} />
          </Field>
          <MultiSelect label="Available To" placeholder="Select team members" options={TEAM_OPTIONS} value={form.availableto || []} onChange={(v) => set('availableto', v)}
            renderOption={(o) => (
              <span className="flex flex-1 items-center gap-2.5"><Avatar text={initials(o.label)} size="xs" />
                <span className="min-w-0"><span className="block truncate font-medium">{o.label}</span>{o.meta && <span className="block truncate text-xs text-muted-foreground">{o.meta}</span>}</span></span>
            )} />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Sort jobs by" htmlFor={sortId}>
              <Select value={form.sortjobsby ?? ''} onValueChange={(v) => set('sortjobsby', v === NONE ? null : v)}>
                <SelectTrigger id={sortId}><SelectValue placeholder="Sort By Job" /></SelectTrigger>
                <SelectContent>
                  {SORT_JOBS_BY.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  {form.sortjobsby != null && <><SelectSeparator /><SelectItem value={NONE} className="text-muted-foreground">Clear</SelectItem></>}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Default job template" htmlFor={tplId} hint="Used when a job is added to this pipeline without choosing a template.">
              <Select value={form.defaultjobtemplate != null ? String(form.defaultjobtemplate) : ''}
                onValueChange={(v) => set('defaultjobtemplate', v === NONE ? null : jobTemplateOptions.find((o) => String(o.id) === v)?.id ?? null)}>
                <SelectTrigger id={tplId}><SelectValue placeholder="Default job template" /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {jobTemplateOptions.map((o) => <SelectItem key={o.id} value={String(o.id)}>{o.label}</SelectItem>)}
                  {jobTemplateOptions.length === 0 && <div className="px-2 py-3 text-sm text-muted-foreground">No job templates yet.</div>}
                  {form.defaultjobtemplate != null && <><SelectSeparator /><SelectItem value={NONE} className="text-muted-foreground">No default template</SelectItem></>}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </FormCard>

        {/* RIGHT – Job card fields */}
        <FormCard title="Job Card Fields" description="Choose what each job card shows on the pipeline board." icon={LayoutTemplate}
          action={(
            <div className="flex items-center gap-1">
              <Badge variant="neutral" className="mr-1 tabular-nums">{cardFieldsOn}/{JOB_CARD_FIELDS.length}</Badge>
              <Button type="button" variant="ghost" size="xs" onClick={() => setAllCardFields(true)} disabled={cardFieldsOn === JOB_CARD_FIELDS.length}>All</Button>
              <Button type="button" variant="ghost" size="xs" onClick={() => setAllCardFields(false)} disabled={cardFieldsOn === 0}>None</Button>
            </div>
          )}>
          <div role="group" aria-label="Job card fields" className="-mx-2 grid grid-cols-1 gap-x-2 gap-y-0.5 sm:grid-cols-2 2xl:grid-cols-3">
            {JOB_CARD_FIELDS.map((f) => {
              const fid = `${uid}-card-${f.name}`;
              const on = !!form[f.name];
              return (
                <label key={f.name} htmlFor={fid}
                  className={cn('flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent', on ? 'text-foreground' : 'text-muted-foreground')}>
                  <Checkbox id={fid} checked={on} onCheckedChange={(v) => set(f.name, v === true)} />
                  {f.label}
                </label>
              );
            })}
          </div>
        </FormCard>
      </div>

      {/* Stages */}
      <StagesSection stages={form.stages} onChange={setStages} stageErrors={stageErrors} />

      {/* Sticky action bar */}
      <div className="sticky bottom-4 z-20 flex flex-wrap items-center gap-2 rounded-xl border bg-card/95 px-4 py-3 shadow-raised backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="mr-auto flex min-w-0 items-center gap-2 text-sm" aria-live="polite">
          {dirty ? (
            <><span className="size-2 flex-none rounded-full bg-warning-500" aria-hidden="true" /><span className="font-medium text-warning-700">You have unsaved changes.</span></>
          ) : isEdit ? (
            <><Check className="size-4 flex-none text-success-700" aria-hidden="true" /><span className="text-muted-foreground">All changes saved</span></>
          ) : (
            <span className="text-muted-foreground">New pipeline — not saved yet</span>
          )}
        </div>
        <Button type="button" variant="ghost" onClick={handleCancel} disabled={loading}>Cancel</Button>
        <Button type="button" variant="outline" onClick={() => handleSavePipeline(false)} disabled={loading}>{loading ? 'Saving…' : isEdit ? 'Update' : 'Save'}</Button>
        <Button type="button" onClick={() => handleSavePipeline(true)} disabled={loading}>{loading ? 'Saving…' : isEdit ? 'Update & Exit' : 'Save & Exit'}</Button>
      </div>

      {modal === 'discard' && (
        <Modal title="Discard changes?" description="Your changes to this pipeline haven't been saved." onClose={() => setModal(null)}
          footer={<><Button variant="outline" onClick={() => setModal(null)}>Keep editing</Button><Button variant="destructive" onClick={() => navigate(LIST_PATH)}>Discard</Button></>}>
          <p className="text-sm text-muted-foreground">If you leave now, you'll lose the edits you've made since the last save.</p>
        </Modal>
      )}
      {modal === 'delete' && (
        <Modal title={`Delete “${saved.pipelineName}”?`} description="This pipeline template will be removed." onClose={() => setModal(null)}
          footer={<><Button variant="outline" onClick={() => setModal(null)}>Cancel</Button><Button variant="destructive" onClick={() => { deletePipelines([currentId]); navigate(LIST_PATH, { state: { toast: `Deleted “${saved.pipelineName}”` } }); }}><Trash2 />Delete</Button></>}>
          <p className="text-sm text-muted-foreground">Jobs already in this pipeline are not affected.</p>
        </Modal>
      )}
      <ToastBridge message={toast} />
    </div>
  );
}
