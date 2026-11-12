import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, ArrowRight, Check, CircleAlert, File, Folder, FolderOpen, FolderTree, Lock, SearchX, Trash2 } from 'lucide-react';
import FolderExplorer from '../../../components/folders/FolderExplorer';
import { Modal } from '../../../components/ui';
import { Alert, AlertTitle } from '../../../components/ui/alert';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { ToastBridge } from '../../../components/ui/sonner';
import { EmptyState, SectionHeading } from '../../../components/page';
import { useData } from '../../../context/DataContext';
import { DEFAULT_FOLDERS, countItems, emptyFolderTemplate } from '../../../data/folderTemplates';
import { cn } from 'lib/utils';

const LIST_PATH = '/firmtemp/templates/folders';
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

function ActionBar({ dirty, isNew, children }) {
  return (
    <div className="sticky bottom-0 z-20 -mx-4 -mb-6 mt-6 border-t bg-card/85 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:-mb-8 lg:px-8">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-2">
        <span className={cn('mr-auto inline-flex items-center gap-2 text-sm', dirty ? 'font-medium text-warning-700' : 'text-muted-foreground')} aria-live="polite">
          <span className={cn('size-1.5 rounded-full', dirty ? 'bg-warning-500' : isNew ? 'bg-muted-foreground/50' : 'bg-success-500')} aria-hidden="true" />
          {dirty ? 'Unsaved changes' : isNew ? 'Not saved yet' : 'All changes saved'}
        </span>
        {children}
      </div>
    </div>
  );
}

/** Two-step indicator for the create flow: 1 Name → 2 Folders and files. */
function Steps({ current }) {
  const steps = ['Name your template', 'Folders and files'];
  return (
    <ol aria-label="Steps" className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={s} className="flex items-center gap-3" aria-current={active ? 'step' : undefined}>
            {i > 0 && <span className={cn('h-px w-8 sm:w-12', done || active ? 'bg-primary/40' : 'bg-border')} aria-hidden="true" />}
            <span className={cn('inline-flex size-6 items-center justify-center rounded-full border text-xs font-semibold tabular-nums',
              active ? 'border-primary bg-primary text-primary-foreground' : done ? 'border-primary/40 bg-primary/10 text-primary' : 'bg-card text-muted-foreground')}>
              {done ? <Check className="size-3.5" aria-hidden="true" /> : i + 1}
            </span>
            <span className={cn('font-medium', active ? 'text-foreground' : 'text-muted-foreground')}>{s}</span>
          </li>
        );
      })}
    </ol>
  );
}

/** Read-only preview of the starting structure, with indentation guides (shown before the template is saved). */
function DefaultTreePreview({ rootName }) {
  return (
    <div className="w-full max-w-sm rounded-lg border bg-card p-2 text-left shadow-xs" aria-label="Starting folders">
      <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium">
        <FolderOpen className="size-4 flex-none text-brand-600" aria-hidden="true" />
        <span className="truncate">{rootName}</span>
      </div>
      <ul className="ml-[17px] border-l pl-2">
        {DEFAULT_FOLDERS.map((name) => (
          <li key={name} className="relative flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground before:absolute before:-left-2 before:top-1/2 before:h-px before:w-2 before:bg-border">
            <Folder className="size-4 flex-none text-brand-600/80" aria-hidden="true" />
            <span className="truncate text-foreground">{name}</span>
            <Lock className="ml-auto size-3.5 flex-none" aria-label="Default folder" />
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Create / edit a folder template.
 *   /firmtemp/templates/folders/new          → step 1: enter the template name and save
 *   /firmtemp/templates/folders/:templateId  → step 2 / edit: the folder tree (starts with the three default folders)
 */
export default function FolderTemplateForm() {
  const { templateId } = useParams();
  return <FolderTemplatePage key={templateId || 'new'} editingId={templateId} />;
}

function FolderTemplatePage({ editingId }) {
  const navigate = useNavigate();
  const { state: routeState, pathname } = useLocation();
  const { folderTemplates = [], saveFolderTemplate, deleteFolderTemplates, folderTemplateNameTaken } = useData();
  const existing = editingId ? folderTemplates.find((t) => String(t.id) === String(editingId)) : null;
  const isEdit = !!editingId;

  const initial = useMemo(() => (existing ? clone(existing) : emptyFolderTemplate()), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [form, setForm] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);   // 'discard' | 'delete'
  const [toast, setToast] = useState('');
  const dirty = JSON.stringify(form) !== JSON.stringify(saved);
  const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 2600); };
  const counts = countItems(form.items);

  // message passed from step 1 ("created — now add folders")
  useEffect(() => {
    if (routeState?.toast) { notify(routeState.toast); navigate(pathname, { replace: true, state: null }); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!dirty) return undefined;
    const h = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  if (!saveFolderTemplate) {
    return <Alert variant="destructive"><AlertTriangle aria-hidden="true" /><AlertTitle>Folder templates are not set up in DataContext.js</AlertTitle></Alert>;
  }
  if (editingId && !existing) {
    return (
      <div className="page max-w-[1200px]">
        <Card>
          <EmptyState icon={SearchX} title="Folder template not found" description="It may have been deleted, or the link is out of date."
            action={<Button asChild><Link to={LIST_PATH}><ArrowLeft />Back to folder templates</Link></Button>} />
        </Card>
      </div>
    );
  }

  const validate = () => {
    const name = form.templatename.trim();
    const e = !name ? 'Template name is required' : folderTemplateNameTaken?.(name, editingId) ? 'Template name already exists' : '';
    setError(e);
    return !e;
  };
  const persist = () => {
    const id = saveFolderTemplate({ ...form, id: editingId || undefined, templatename: form.templatename.trim() });
    return { ...form, id, templatename: form.templatename.trim() };
  };
  const onSave = () => {
    if (!validate()) return;
    const data = persist();
    if (!editingId) {
      // step 1 done → open the template to add folders and files
      navigate(`${LIST_PATH}/${data.id}`, { replace: true, state: { toast: 'Folder template created — now add folders and files' } });
      return;
    }
    setForm(data); setSaved(data);
    notify('Folder template updated');
  };
  const onSaveAndExit = () => {
    if (!validate()) return;
    const data = persist();
    navigate(LIST_PATH, { state: { toast: isEdit ? `Updated “${data.templatename}”` : `Created “${data.templatename}”` } });
  };
  const onCancel = () => (dirty ? setModal('discard') : navigate(LIST_PATH));

  return (
    <>
      <div className="page max-w-[1200px]">
        <EditorHeader backLabel="Folder templates" backAria="Back to folder templates" onBack={onCancel} icon={FolderTree}
          title={isEdit ? 'Edit Folder Template' : 'Create Folder Template'}
          status={!isEdit ? <Badge variant="info" dot>New</Badge> : dirty ? <Badge variant="warning" dot>Edited</Badge> : <Badge variant="success" dot>Saved</Badge>}
          description={isEdit ? 'The folders and files every account gets when this template is applied' : 'Step 1 of 2 · Name your template'}
          actions={isEdit && <Button variant="destructive-outline" onClick={() => setModal('delete')}><Trash2 />Delete</Button>} />

        {!isEdit && <Steps current={0} />}

        <Card className="overflow-hidden">
          <div className="border-b px-5 py-4">
            <SectionHeading title="Template details" description="A name your team will recognise when applying it to an account or pipeline." />
          </div>
          <form noValidate onSubmit={(e) => { e.preventDefault(); onSave(); }} className="flex flex-wrap items-start gap-3 p-5">
            <div className="flex min-w-[260px] max-w-xl flex-1 flex-col gap-1.5">
              <Label htmlFor="folder-templatename">Template Name<span className="ml-0.5 text-danger-700" aria-hidden="true">*</span></Label>
              <Input id="folder-templatename" autoFocus={!isEdit} value={form.templatename} placeholder="Template name" aria-invalid={!!error}
                aria-describedby={error ? 'folder-templatename-error' : undefined}
                onChange={(e) => { setForm((f) => ({ ...f, templatename: e.target.value })); setError(''); }} />
              {error && (
                <p id="folder-templatename-error" role="alert" className="flex items-center gap-1 text-xs font-medium text-danger-700">
                  <CircleAlert className="size-3.5 flex-none" aria-hidden="true" />{error}
                </p>
              )}
            </div>
            {!isEdit && <Button type="submit" className="sm:mt-[22px]">Save &amp; continue<ArrowRight /></Button>}
          </form>
        </Card>

        {!isEdit ? (
          /* Step 1: the folder tree appears after the name is saved */
          <section aria-label="Folders and files" className="flex flex-col items-center gap-4 rounded-xl border border-dashed bg-subtle/40 px-6 py-10 text-center">
            <div className="flex flex-col items-center gap-1">
              <h2 className="text-base font-semibold">Next: folders and files</h2>
              <p className="max-w-md text-sm text-muted-foreground">Save the template name to start building the folder structure. It begins with the {DEFAULT_FOLDERS.length} default folders: {DEFAULT_FOLDERS.join(', ')}.</p>
            </div>
            <DefaultTreePreview rootName={form.templatename.trim() || 'New folder template'} />
          </section>
        ) : (
          <Card className="overflow-hidden" aria-label="Folders and files">
            <div className="flex flex-wrap items-start gap-3 border-b px-5 py-4">
              <span className="inline-flex size-8 flex-none items-center justify-center rounded-lg border bg-subtle text-muted-foreground" aria-hidden="true"><FolderTree className="size-4" /></span>
              <div className="min-w-0 flex-1">
                <h2 className="section-title">Folders and files</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {counts.folders} folders · {counts.files} files. The {DEFAULT_FOLDERS.length} default folders (<Lock className="inline size-3.5 align-[-2px]" aria-label="locked" />) can’t be renamed, moved or deleted.
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <Badge variant="neutral" className="tabular-nums"><Folder aria-hidden="true" />{counts.folders}</Badge>
                <Badge variant="neutral" className="tabular-nums"><File aria-hidden="true" />{counts.files}</Badge>
              </div>
            </div>
            <FolderExplorer items={form.items} onChange={(items) => setForm((f) => ({ ...f, items }))} />
          </Card>
        )}

        {modal === 'discard' && (
          <Modal title="Discard changes?" onClose={() => setModal(null)}
            footer={<><Button variant="outline" onClick={() => setModal(null)}>Keep editing</Button><Button variant="destructive" onClick={() => navigate(LIST_PATH)}>Discard</Button></>}>
            <p className="text-sm text-muted-foreground">Your changes to this folder template haven't been saved.</p>
          </Modal>
        )}
        {modal === 'delete' && (
          <Modal title={`Delete “${saved.templatename}”?`} onClose={() => setModal(null)}
            footer={<><Button variant="outline" onClick={() => setModal(null)}>Cancel</Button><Button variant="destructive" onClick={() => { deleteFolderTemplates([editingId]); navigate(LIST_PATH, { state: { toast: `Deleted “${saved.templatename}”` } }); }}><Trash2 />Delete</Button></>}>
            <p className="text-sm text-muted-foreground">Folders already created for accounts are not affected.</p>
          </Modal>
        )}
        <ToastBridge message={toast} />
      </div>

      <ActionBar dirty={dirty} isNew={!isEdit}>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        {isEdit && <Button variant="outline" onClick={onSave}>Update</Button>}
        <Button onClick={onSaveAndExit}>{isEdit ? 'Update & Exit' : 'Save & Exit'}</Button>
      </ActionBar>
    </>
  );
}
