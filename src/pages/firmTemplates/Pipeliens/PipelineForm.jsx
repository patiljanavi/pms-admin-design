import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { FiArrowLeft, FiGitBranch, FiLayout, FiSettings, FiTrash2 } from 'react-icons/fi';
import MultiSelect from '../../../components/MultiSelect';
import StagesSection from './StagesSection';
import { Avatar, Modal, cx, initials } from '../../../components/ui';
import { useData } from '../../../context/DataContext';
import { TEAM_MEMBERS } from '../../../data/sampleData';
import { JOB_CARD_FIELDS, SORT_JOBS_BY, emptyPipeline, newStage } from '../../../data/pipelinesdata';
import { templateOptionsFrom } from '../../../data/statusOptions';

const LIST_PATH = '/firmtemp/pipelines';
const TEAM_OPTIONS = TEAM_MEMBERS.map((m) => ({ ...m, value: m.label }));
const clone = (o) => JSON.parse(JSON.stringify(o));

function Card({ title, icon, action, children }) {
  return (
    <section className="card p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold">{icon}{title}</h2>
        {action}
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
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

  if (!savePipeline) return <div role="alert" className="card bg-danger-50 p-6 font-semibold text-danger-700">Pipelines are not set up in DataContext.js</div>;
  if (editingId && !existing && !currentId) {
    return (
      <div className="flex flex-col items-start gap-4">
        <h1 className="text-3xl font-bold">Pipeline not found</h1>
        <Link to={LIST_PATH} className="btn-primary">Back to pipeline templates</Link>
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

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-wrap items-center gap-4">
        <button onClick={handleCancel} aria-label="Back to pipeline templates" className="flex h-10 w-10 items-center justify-center rounded border border-line-strong bg-surface hover:bg-subtle"><FiArrowLeft size={18} /></button>
        <div className="min-w-0 flex-1">
          <nav aria-label="Breadcrumb" className="text-sm text-muted">Templates / <Link to={LIST_PATH} className="hover:underline">Pipeline Templates</Link></nav>
          <h1 className="flex items-center gap-2 truncate text-2xl font-bold sm:text-3xl"><FiGitBranch className="text-brand-600" aria-hidden="true" />{isEdit ? 'Edit Pipeline' : 'Create Pipeline'}</h1>
          <p className="text-muted">Configure pipeline settings and stages</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isEdit && <button type="button" className="btn border border-danger-200 bg-surface text-danger-700 hover:bg-danger-50" onClick={() => setModal('delete')} disabled={loading}><FiTrash2 aria-hidden="true" /> Delete</button>}
          <button type="button" className="btn-secondary" onClick={handleCancel} disabled={loading}>Cancel</button>
          <button type="button" className="btn border border-brand-600 bg-brand-50 text-brand-600 hover:bg-brand-100" onClick={() => handleSavePipeline(false)} disabled={loading}>{loading ? 'Saving…' : isEdit ? 'Update' : 'Save'}</button>
          <button type="button" className="btn-primary" onClick={() => handleSavePipeline(true)} disabled={loading}>{loading ? 'Saving…' : isEdit ? 'Update & Exit' : 'Save & Exit'}</button>
        </div>
      </header>

      {dirty && <div className="rounded-md border border-warning-300 bg-warning-50 px-4 py-2.5 text-sm font-semibold text-warning-700">You have unsaved changes.</div>}
      {errorList.length > 0 && (
        <div role="alert" className="rounded-md bg-danger-50 px-4 py-3 text-danger-700">
          <p className="font-semibold">Please fix the following:</p>
          <ul className="mt-1 list-disc pl-5 text-sm">{errorList.map((m) => <li key={m}>{m}</li>)}</ul>
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
        {/* LEFT – Pipeline settings */}
        <Card title="Pipeline Details" icon={<FiSettings aria-hidden="true" />}>
          <label className="field-label">
            <span>Pipeline Name <span className="text-danger-700">*</span></span>
            <input className={cx('input', errors.pipelineName && 'border-danger-700')} value={form.pipelineName} onChange={(e) => set('pipelineName', e.target.value)} placeholder="Pipeline Name" />
            {errors.pipelineName && <span className="text-sm font-normal text-danger-700">{errors.pipelineName}</span>}
          </label>
          <MultiSelect label="Available To" placeholder="Select team members" options={TEAM_OPTIONS} value={form.availableto || []} onChange={(v) => set('availableto', v)}
            renderOption={(o) => (
              <span className="flex flex-1 items-center gap-2.5"><Avatar text={initials(o.label)} size="sm" />
                <span><span className="block font-semibold">{o.label}</span><span className="block text-sm text-muted">{o.meta}</span></span></span>
            )} />
          <label className="field-label">Sort jobs by
            <select className="input" value={form.sortjobsby ?? ''} onChange={(e) => set('sortjobsby', e.target.value || null)}>
              <option value="">Sort By Job</option>
              {SORT_JOBS_BY.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          <label className="field-label">Default job template
            <select className="input" value={form.defaultjobtemplate ?? ''} onChange={(e) => set('defaultjobtemplate', jobTemplateOptions.find((o) => String(o.id) === e.target.value)?.id ?? null)}>
              <option value="">Default job template</option>
              {jobTemplateOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
            <span className="text-xs font-normal text-muted">Used when a job is added to this pipeline without choosing a template.</span>
          </label>
        </Card>

        {/* RIGHT – Job card fields */}
        <Card title="Job Card Fields" icon={<FiLayout aria-hidden="true" />}
          action={(
            <span className="flex items-center gap-2 text-sm">
              <span className="text-muted">{cardFieldsOn}/{JOB_CARD_FIELDS.length}</span>
              <button type="button" className="btn-link px-1" onClick={() => setAllCardFields(true)}>All</button>
              <button type="button" className="btn-link px-1" onClick={() => setAllCardFields(false)}>None</button>
            </span>
          )}>
          <p className="-mt-2 text-sm text-muted">Choose what each job card shows on the pipeline board.</p>
          <div role="group" aria-label="Job card fields" className="grid grid-cols-1 gap-x-4 sm:grid-cols-2 2xl:grid-cols-3">
            {JOB_CARD_FIELDS.map((f) => (
              <label key={f.name} className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 hover:bg-subtle">
                <input type="checkbox" checked={!!form[f.name]} onChange={(e) => set(f.name, e.target.checked)} className="h-[18px] w-[18px] accent-brand-600" />
                <span className="text-sm">{f.label}</span>
              </label>
            ))}
          </div>
        </Card>
      </div>

      {/* Stages */}
      <StagesSection stages={form.stages} onChange={setStages} stageErrors={stageErrors} />

      {modal === 'discard' && (
        <Modal title="Discard changes?" onClose={() => setModal(null)}
          footer={<><button className="btn-secondary" onClick={() => setModal(null)}>Keep editing</button><button className="btn bg-danger-700 text-white hover:bg-[#831E15]" onClick={() => navigate(LIST_PATH)}>Discard</button></>}>
          <p className="text-muted">Your changes to this pipeline haven't been saved.</p>
        </Modal>
      )}
      {modal === 'delete' && (
        <Modal title={`Delete “${saved.pipelineName}”?`} onClose={() => setModal(null)}
          footer={<><button className="btn-secondary" onClick={() => setModal(null)}>Cancel</button><button className="btn bg-danger-700 text-white hover:bg-[#831E15]" onClick={() => { deletePipelines([currentId]); navigate(LIST_PATH, { state: { toast: `Deleted “${saved.pipelineName}”` } }); }}>Delete</button></>}>
          <p className="text-muted">Jobs already in this pipeline are not affected.</p>
        </Modal>
      )}
      {toast && <div role="status" className="fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-md bg-ink px-5 py-3 font-semibold text-white">{toast}</div>}
    </div>
  );
}