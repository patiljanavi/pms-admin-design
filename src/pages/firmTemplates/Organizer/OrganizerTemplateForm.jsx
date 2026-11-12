import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Check, ChevronDown, ChevronRight, ChevronUp, CircleAlert, Copy, Eye, GitBranch, GripVertical, Layers, ListChecks,
  PenLine, Pilcrow, Plus, Repeat, SearchX, Settings2, SlidersHorizontal, Trash2,
} from 'lucide-react';
import MenuButton from '../../../components/organizer/MenuButton';
import ShortcodeTextField from '../../../components/ShortcodeTextField';
import OrganizerPreview, { ClientQuestion } from '../../../components/organizer/OrganizerPreview';
import OrganizerSettingsDrawer from '../../../components/organizer/OrganizerSettingsDrawer';
import QuestionCard, { QUESTION_TYPE_META, QuestionTypeIcon } from '../../../components/organizer/QuestionCard';
import QuestionSettingsDrawer from '../../../components/organizer/QuestionSettingsDrawer';
import SectionSettingsDrawer from '../../../components/organizer/SectionSettingsDrawer';
import { Field } from '../../../components/organizer/SettingsCard';
import { Modal } from '../../../components/ui';
import { Badge } from '../../../components/ui/badge';
import { Button, buttonVariants } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { toast } from '../../../components/ui/sonner';
import { SimpleTooltip } from '../../../components/ui/tooltip';
import { ToggleGroup, ToggleGroupItem } from '../../../components/ui/toggle-group';
import { EmptyState } from '../../../components/page';
import { cn } from 'lib/utils';
import { useData } from '../../../context/DataContext';
import { accountShortcuts } from '../../../data/shortcodes';
import {
  QUESTION_TYPES, TEXT_BLOCK, choiceQuestions, cloneSection, conditionsMet, emptyOrganizer, newQuestion, newSection, organizerErrors, questionCount,
} from '../../../data/organizerTemplates';

const LIST_PATH = '/firmtemp/templates/organizers';
const clone = (o) => JSON.parse(JSON.stringify(o));
const move = (list, from, to) => {
  if (from == null || to < 0 || to >= list.length || from === to) return list;
  const next = [...list];
  const [x] = next.splice(from, 1);
  next.splice(to, 0, x);
  return next;
};
const truncate = (text, words = 5) => { const w = (text || '').split(' '); return w.length > words ? `${w.slice(0, words).join(' ')} …` : text; };

/** "+ Questions" button with a menu of question types (opens above the page, never clipped). */
function AddQuestionMenu({ onPick }) {
  const items = QUESTION_TYPES.map((t) => ({ label: t, icon: QUESTION_TYPE_META[t]?.icon, description: QUESTION_TYPE_META[t]?.hint }));
  return (
    <MenuButton label={<><Plus aria-hidden="true" /> Questions</>} items={items} onPick={onPick}
      menuLabel="Question types" className={buttonVariants()} menuWidth={248} />
  );
}

const StepBadge = ({ n }) => (
  <span className="inline-flex size-6 flex-none items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground" aria-hidden="true">{n}</span>
);
const outlineIconBtn = 'inline-flex h-4 w-5 items-center justify-center rounded text-muted-foreground hover:bg-background hover:text-foreground disabled:opacity-30 [&_svg]:size-3';

/**
 * Create / edit an organizer template (same pattern as the other template forms).
 *   /firmtemp/templates/organizers/new          → create
 *   /firmtemp/templates/organizers/:templateId  → edit
 */
export default function OrganizerTemplateForm() {
  const { templateId } = useParams();
  return <OrganizerBuilder key={templateId || 'new'} editingId={templateId} />;
}

function OrganizerBuilder({ editingId }) {
  const navigate = useNavigate();
  const { organizerTemplates = [], saveOrganizerTemplate, deleteOrganizerTemplates, organizerTemplateNameTaken } = useData();
  const existing = editingId ? organizerTemplates.find((t) => String(t.id) === String(editingId)) : null;
  const mode = editingId ? 'edit' : 'create';

  const initial = useMemo(() => (existing ? clone(existing) : { ...emptyOrganizer(), sections: [newSection('Section 1')] }), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [form, setForm] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [selectedId, setSelectedId] = useState(initial.sections[0]?.id || null);
  const [showErrors, setShowErrors] = useState(false);
  const [panel, setPanel] = useState(null);       // 'preview' | 'settings' | 'section' | { question } | 'discard' | 'delete'
  const [dragSection, setDragSection] = useState(null);
  const [dragQuestion, setDragQuestion] = useState(null);
  const [view, setView] = useState('edit');       // section editor: 'edit' | 'preview' (UI only)
  const [previewAnswers, setPreviewAnswers] = useState({});
  const dirty = JSON.stringify(form) !== JSON.stringify(saved);
  const errors = organizerErrors(form, organizerTemplateNameTaken?.(form.templatename, editingId));
  const errorList = showErrors ? Object.values(errors) : [];

  useEffect(() => {
    if (!dirty) return undefined;
    const h = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  if (!saveOrganizerTemplate) {
    return (
      <div role="alert" className="flex items-center gap-2 rounded-xl border border-danger-200 bg-danger-50 p-5 font-medium text-danger-700">
        <CircleAlert className="size-4" aria-hidden="true" />Organizer templates are not set up in DataContext.js
      </div>
    );
  }
  if (editingId && !existing) {
    return (
      <div className="page">
        <Card>
          <EmptyState icon={SearchX} title="Organizer template not found" description="It may have been deleted, or the link is out of date."
            action={<Button asChild><Link to={LIST_PATH}>Back to organizers</Link></Button>} />
        </Card>
      </div>
    );
  }

  const set = (changes) => setForm((f) => ({ ...f, ...changes }));
  const setSections = (fn) => setForm((f) => ({ ...f, sections: fn(f.sections) }));
  const section = form.sections.find((s) => s.id === selectedId) || null;
  const sectionIndex = form.sections.findIndex((s) => s.id === selectedId);
  const updateSection = (changes) => setSections((list) => list.map((s) => (s.id === selectedId ? { ...s, ...changes } : s)));
  const setQuestions = (fn) => setSections((list) => list.map((s) => (s.id === selectedId ? { ...s, formElements: fn(s.formElements) } : s)));
  const allChoice = choiceQuestions(form.sections);

  /* sections */
  const addSection = () => { const s = newSection(`Section ${form.sections.length + 1}`); setSections((l) => [...l, s]); setSelectedId(s.id); };
  const duplicateSection = () => { const copy = cloneSection(section); setSections((l) => { const n = [...l]; n.splice(sectionIndex + 1, 0, copy); return n; }); setSelectedId(copy.id); };
  const deleteSection = () => {
    const rest = form.sections.filter((s) => s.id !== selectedId);
    setSections(() => rest);
    setSelectedId(rest[Math.min(sectionIndex, rest.length - 1)]?.id || null);
  };

  /* save */
  const persist = () => {
    const id = saveOrganizerTemplate({ ...form, id: editingId || undefined, templatename: form.templatename.trim(), organizerName: form.organizerName.trim() });
    return { ...form, id };
  };
  const saveOrganizerTemp = () => {               // Save / Update (stay)
    setShowErrors(true);
    if (Object.keys(errors).length) { window.scrollTo?.({ top: 0, behavior: 'smooth' }); return; }
    const data = persist();
    setForm(data); setSaved(data); setShowErrors(false);
    toast.success(mode === 'edit' ? 'Organizer template updated successfully' : 'Organizer template created successfully');
    if (!editingId) navigate(`${LIST_PATH}/${data.id}`, { replace: true });
  };
  const saveandexitOrganizerTemp = () => {        // Save & exit / Update & exit
    setShowErrors(true);
    if (Object.keys(errors).length) { window.scrollTo?.({ top: 0, behavior: 'smooth' }); return; }
    const data = persist();
    navigate(LIST_PATH, { state: { toast: mode === 'edit' ? `Updated “${data.templatename}”` : `Created “${data.templatename}”` } });
  };
  const handleCancel = () => (dirty ? setPanel('discard') : navigate(LIST_PATH));
  const scrollToQuestion = (q) => document.getElementById(`oq-${q.id}`)?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-wrap items-start gap-4">
        <SimpleTooltip label="Back to organizers">
          <Button variant="outline" size="icon" onClick={handleCancel} aria-label="Back to organizers" className="mt-0.5 flex-none"><ArrowLeft /></Button>
        </SimpleTooltip>
        <div className="min-w-0 flex-1">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-muted-foreground">
            <Link to="/firmtemp/templates" className="transition-colors hover:text-foreground">Firm Templates</Link>
            <ChevronRight className="size-3.5 opacity-60" aria-hidden="true" />
            <Link to={LIST_PATH} className="transition-colors hover:text-foreground">Organizers</Link>
          </nav>
          <h1 className="page-title mt-0.5 truncate">{mode === 'edit' ? 'Edit Organizer Template' : 'Create Organizer Template'}</h1>
          <p className="page-description">Customize your organizer template</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setPanel('preview')}><Eye aria-hidden="true" /> Preview</Button>
          <Button variant="outline" onClick={() => setPanel('settings')}><SlidersHorizontal aria-hidden="true" /> Organizer settings</Button>
          {mode === 'edit' && <Button variant="destructive-outline" onClick={() => setPanel('delete')}><Trash2 aria-hidden="true" /> Delete</Button>}
        </div>
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

      {/* General */}
      <Card className="overflow-hidden">
        <header className="flex items-center gap-3 border-b px-5 py-4 sm:px-6">
          <StepBadge n={1} />
          <div><h2 className="section-title">General</h2><p className="text-sm text-muted-foreground">The template name is internal; clients see the organizer name</p></div>
        </header>
        <div className="grid grid-cols-1 gap-5 p-5 sm:p-6 md:grid-cols-2">
          <Field label="Template Name" required htmlFor="organizer-template-name" error={showErrors ? errors.templatename : undefined}>
            <Input id="organizer-template-name" aria-invalid={!!(showErrors && errors.templatename)} value={form.templatename} onChange={(e) => set({ templatename: e.target.value })} placeholder="Template name" />
          </Field>
          <ShortcodeTextField label="Organizer name" required value={form.organizerName} onChange={(v) => set({ organizerName: v })} placeholder="Organizer name, e.g. [CURRENT_YEAR] tax organizer"
            shortcuts={accountShortcuts} error={showErrors ? errors.organizerName : undefined} />
        </div>
      </Card>

      {/* Sections builder */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        {/* Left: section outline */}
        <Card className="overflow-hidden lg:sticky lg:top-24">
          <header className="flex items-center gap-3 border-b px-4 py-3.5">
            <StepBadge n={2} />
            <div className="min-w-0 flex-1">
              <h2 className="section-title">Sections</h2>
              <p className="text-xs text-muted-foreground"><span className="tabular-nums">{form.sections.length}</span> sections · <span className="tabular-nums">{questionCount(form)}</span> questions</p>
            </div>
            <SimpleTooltip label="New section"><Button variant="ghost" size="icon-sm" onClick={addSection} aria-label="Add section"><Plus /></Button></SimpleTooltip>
          </header>
          <div className="max-h-[calc(100vh-14rem)] overflow-y-auto p-2">
            <ol aria-label="Sections" className="flex flex-col gap-0.5">
              {form.sections.map((s, i) => {
                const on = s.id === selectedId;
                const n = s.formElements.filter((q) => q.type !== TEXT_BLOCK).length;
                return (
                  <li key={s.id} draggable onDragStart={() => setDragSection(i)} onDragEnd={() => setDragSection(null)} onDragOver={(e) => e.preventDefault()}
                    onDrop={() => { setSections((l) => move(l, dragSection, i)); setDragSection(null); }}
                    className={cn('rounded-lg transition-opacity', dragSection === i && 'opacity-40')}>
                    <div className={cn('group/s relative flex items-center gap-0.5 rounded-lg pr-1 transition-colors',
                      on ? 'bg-brand-50 ring-1 ring-inset ring-primary/20' : 'hover:bg-accent')}>
                      {on && <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-primary" aria-hidden="true" />}
                      <span className="flex h-11 w-5 flex-none cursor-grab items-center justify-center text-muted-foreground/40 transition-colors group-hover/s:text-muted-foreground active:cursor-grabbing" aria-hidden="true"><GripVertical className="size-3.5" /></span>
                      <button type="button" onClick={() => setSelectedId(s.id)} aria-current={on ? 'true' : undefined}
                        className="flex min-w-0 flex-1 items-center gap-2.5 rounded-md py-1.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
                        <span className={cn('inline-flex size-5 flex-none items-center justify-center rounded-md text-[11px] font-semibold tabular-nums',
                          on ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>{i + 1}</span>
                        <span className="min-w-0 flex-1">
                          <span className={cn('block truncate text-sm', on ? 'font-medium text-foreground' : 'text-foreground/90')}>{truncate(s.text) || <span className="italic text-muted-foreground">Untitled section</span>}</span>
                          <span className="block text-xs tabular-nums text-muted-foreground">{n} question{n === 1 ? '' : 's'}</span>
                        </span>
                      </button>
                      {s.sectionsettings?.conditional && (
                        <SimpleTooltip label="Conditional section"><span role="img" aria-label="Conditional section" className="inline-flex size-5 items-center justify-center text-success-700"><GitBranch className="size-3.5" aria-hidden="true" /></span></SimpleTooltip>
                      )}
                      {s.sectionsettings?.sectionRepeatingMode && (
                        <SimpleTooltip label="Repeatable section"><span role="img" aria-label="Repeatable section" className="inline-flex size-5 items-center justify-center text-brand-700"><Repeat className="size-3.5" aria-hidden="true" /></span></SimpleTooltip>
                      )}
                      <span className="flex flex-none flex-col opacity-40 transition-opacity focus-within:opacity-100 group-hover/s:opacity-100">
                        <button type="button" onClick={() => setSections((l) => move(l, i, i - 1))} disabled={i === 0} aria-label={`Move section ${i + 1} up`} className={outlineIconBtn}><ChevronUp aria-hidden="true" /></button>
                        <button type="button" onClick={() => setSections((l) => move(l, i, i + 1))} disabled={i === form.sections.length - 1} aria-label={`Move section ${i + 1} down`} className={outlineIconBtn}><ChevronDown aria-hidden="true" /></button>
                      </span>
                    </div>
                    {/* Question outline of the selected section */}
                    {on && s.formElements.length > 0 && (
                      <ol aria-label={`Questions in ${s.text || 'this section'}`} className="mb-1 ml-[30px] mt-1 flex flex-col gap-px border-l pl-2">
                        {s.formElements.map((q) => (
                          <li key={q.id}>
                            <button type="button" onClick={() => scrollToQuestion(q)}
                              className="flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
                              <QuestionTypeIcon type={q.type} size="sm" />
                              <span className={cn('truncate', !q.text.trim() && q.type !== TEXT_BLOCK && 'italic')}>{q.type === TEXT_BLOCK ? 'Text block' : truncate(q.text, 6) || `Untitled ${q.type.toLowerCase()}`}</span>
                            </button>
                          </li>
                        ))}
                      </ol>
                    )}
                  </li>
                );
              })}
            </ol>
            <button type="button" onClick={addSection}
              className="mt-2 flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-line-strong text-sm font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:bg-brand-50 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
              <Plus className="size-4" aria-hidden="true" /> New section
            </button>
          </div>
        </Card>

        {/* Right: section editor */}
        {section ? (
          <section aria-label="Section editor" className="overflow-hidden rounded-xl border bg-card shadow-card">
            <header className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b bg-subtle/60 px-4 py-3 sm:px-5">
              <span className="inline-flex size-9 flex-none items-center justify-center rounded-lg border border-brand-100 bg-brand-50 text-brand-700" aria-hidden="true"><Layers className="size-4" /></span>
              <div className="min-w-[200px] flex-1">
                <div className="text-2xs font-medium uppercase tracking-wider text-muted-foreground">Section {sectionIndex + 1} of {form.sections.length}</div>
                <input aria-label="Section title" value={section.text} placeholder="Section title" onChange={(e) => updateSection({ text: e.target.value })}
                  className={cn('-ml-2 h-8 w-full rounded-md border bg-transparent px-2 text-md font-semibold text-foreground transition-[box-shadow,border-color] placeholder:font-normal placeholder:text-muted-foreground/70',
                    'hover:border-input focus-visible:border-ring focus-visible:bg-card focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20',
                    showErrors && !section.text.trim() ? 'border-danger-700' : 'border-transparent')} />
              </div>
              {section.sectionsettings?.conditional && <Badge variant="success"><GitBranch aria-hidden="true" />Conditional section</Badge>}
              {section.sectionsettings?.sectionRepeatingMode && <Badge variant="info"><Repeat aria-hidden="true" />Repeatable</Badge>}
              <ToggleGroup type="single" value={view} onValueChange={(v) => v && setView(v)} aria-label="Section view" className="h-8">
                <ToggleGroupItem value="edit" className="px-2.5 text-xs"><PenLine aria-hidden="true" className="!size-3.5" />Build</ToggleGroupItem>
                <ToggleGroupItem value="preview" className="px-2.5 text-xs"><Eye aria-hidden="true" className="!size-3.5" />Preview</ToggleGroupItem>
              </ToggleGroup>
              <span className="flex items-center gap-0.5">
                <SimpleTooltip label="Duplicate section"><Button variant="ghost" size="icon-sm" onClick={duplicateSection} aria-label="Duplicate section" className="text-muted-foreground"><Copy /></Button></SimpleTooltip>
                <SimpleTooltip label="Section settings"><Button variant="ghost" size="icon-sm" onClick={() => setPanel('section')} aria-label="Section settings" className="text-muted-foreground"><Settings2 /></Button></SimpleTooltip>
                <SimpleTooltip label="Delete section"><Button variant="ghost" size="icon-sm" onClick={deleteSection} aria-label="Delete section" className="text-muted-foreground hover:bg-danger-50 hover:text-danger-700"><Trash2 /></Button></SimpleTooltip>
              </span>
            </header>

            {view === 'edit' ? (
              <div className="p-4 sm:p-5">
                <ol aria-label="Questions" className="flex flex-col gap-3">
                  {section.formElements.map((q, i) => (
                    <QuestionCard key={q.id} id={`oq-${q.id}`} q={q} index={i} total={section.formElements.length} dragging={dragQuestion === i}
                      dragProps={{ draggable: true, onDragStart: () => setDragQuestion(i), onDragEnd: () => setDragQuestion(null), onDragOver: (e) => e.preventDefault(), onDrop: () => { setQuestions((l) => move(l, dragQuestion, i)); setDragQuestion(null); } }}
                      onChange={(next) => setQuestions((l) => l.map((x) => (x.id === q.id ? next : x)))}
                      onDelete={() => setQuestions((l) => l.filter((x) => x.id !== q.id))}
                      onSettings={() => setPanel({ question: q })}
                      onMove={(dir) => setQuestions((l) => move(l, i, i + dir))} />
                  ))}
                </ol>
                {!section.formElements.length && (
                  <div className="rounded-xl border border-dashed">
                    <EmptyState compact icon={ListChecks} title="No questions yet" description="Add a question or a text block." />
                  </div>
                )}
                <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-dashed bg-subtle/60 p-3">
                  <AddQuestionMenu onPick={(type) => setQuestions((l) => [...l, newQuestion(type, section.id)])} />
                  <Button variant="outline" onClick={() => setQuestions((l) => [...l, newQuestion(TEXT_BLOCK, section.id)])}><Pilcrow aria-hidden="true" /> Text Block</Button>
                  <span className="ml-auto hidden text-xs text-muted-foreground sm:inline">Drag cards to reorder</span>
                </div>
              </div>
            ) : (
              <div className="bg-canvas p-4 sm:p-6">
                <div className="mx-auto flex max-w-xl flex-col gap-5 rounded-xl border bg-card p-5 shadow-card sm:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold tracking-tight">{section.text || 'Untitled section'}</h3>
                    {Object.keys(previewAnswers).length > 0 && <Button variant="ghost" size="xs" onClick={() => setPreviewAnswers({})} className="text-muted-foreground">Reset answers</Button>}
                  </div>
                  {section.formElements.filter((q) => conditionsMet(q.questionsectionsettings, previewAnswers)).map((q) => (
                    <ClientQuestion key={q.id} q={q} answerKey={`inline-${q.id}`} value={previewAnswers[q.id]} onAnswer={(v) => setPreviewAnswers((a) => ({ ...a, [q.id]: v }))} />
                  ))}
                  {!section.formElements.length && <p className="text-sm text-muted-foreground">This section has no questions yet.</p>}
                </div>
                <p className="mt-3 text-center text-xs text-muted-foreground">How this section looks to the client. Use <span className="font-medium text-foreground">Preview</span> above for the whole organizer.</p>
              </div>
            )}
          </section>
        ) : (
          <Card className="border-dashed shadow-none">
            <EmptyState icon={Layers} title="No section selected" description="Select a section to start editing, or add a new one."
              action={<Button variant="outline" onClick={addSection}><Plus aria-hidden="true" /> New section</Button>} />
          </Card>
        )}
      </div>

      {/* Sticky action bar */}
      <div className="sticky bottom-0 z-10 -mx-4 -mb-6 border-t bg-card/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:-mb-8 lg:px-8">
        <div className="flex flex-wrap items-center justify-end gap-2">
          {dirty ? <Badge variant="warning" dot className="mr-auto">Unsaved changes</Badge>
            : mode === 'edit' && <span className="mr-auto inline-flex items-center gap-1.5 text-sm text-muted-foreground"><Check className="size-4 text-success-700" aria-hidden="true" />All changes saved</span>}
          <Button variant="outline" onClick={handleCancel}>Cancel</Button>
          <Button variant="secondary" onClick={saveOrganizerTemp}>{mode === 'edit' ? 'Update' : 'Save'}</Button>
          <Button onClick={saveandexitOrganizerTemp}>{mode === 'edit' ? 'Update & exit' : 'Save & exit'}</Button>
        </div>
      </div>

      {/* Drawers & modals */}
      {panel === 'preview' && <OrganizerPreview organizer={form} onClose={() => setPanel(null)} />}
      {panel === 'settings' && <OrganizerSettingsDrawer settings={form.organizersettings} onClose={() => setPanel(null)} onSave={(st) => { set({ organizersettings: st }); setPanel(null); }} />}
      {panel === 'section' && section && (
        <SectionSettingsDrawer section={section} questions={allChoice.filter((q) => q.sectionid !== section.id)} onClose={() => setPanel(null)}
          onSave={(st) => { updateSection({ sectionsettings: st }); setPanel(null); }} />
      )}
      {panel?.question && (
        <QuestionSettingsDrawer question={panel.question} questions={allChoice.filter((q) => q.id !== panel.question.id)} onClose={() => setPanel(null)}
          onSave={(st) => { setSections((list) => list.map((s) => ({ ...s, formElements: s.formElements.map((x) => (x.id === panel.question.id ? { ...x, questionsectionsettings: st } : x)) }))); setPanel(null); }} />
      )}
      {panel === 'discard' && (
        <Modal title="Discard changes?" description="Your changes to this organizer haven't been saved." onClose={() => setPanel(null)}
          footer={<><Button variant="outline" onClick={() => setPanel(null)}>Keep editing</Button><Button variant="destructive" onClick={() => navigate(LIST_PATH)}>Discard</Button></>}>
          <p className="text-sm text-muted-foreground">If you leave now, everything since your last save is lost.</p>
        </Modal>
      )}
      {panel === 'delete' && (
        <Modal title={`Delete “${saved.templatename}”?`} description="Organizers already sent to clients are not affected." onClose={() => setPanel(null)}
          footer={<><Button variant="outline" onClick={() => setPanel(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { deleteOrganizerTemplates([editingId]); navigate(LIST_PATH, { state: { toast: `Deleted “${saved.templatename}”` } }); }}><Trash2 aria-hidden="true" />Delete</Button></>}>
          <p className="text-sm text-muted-foreground">The template, its {saved.sections?.length || 0} sections and {questionCount(saved)} questions will be removed.</p>
        </Modal>
      )}
    </div>
  );
}
