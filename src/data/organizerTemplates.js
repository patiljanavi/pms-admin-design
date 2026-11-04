// Organizer templates: question types, blank records, condition logic and dummy data.
// Field names match the organizer builder (templatename, organizerName, sections, formElements, settings).

export const QUESTION_TYPES = ['Free Entry', 'Email', 'Number', 'Date', 'Radio Buttons', 'Checkboxes', 'Dropdown', 'Yes/No', 'File Upload'];
export const TEXT_BLOCK = 'Text Editor';
/** Questions with options — the only ones conditions can be based on. */
export const CHOICE_TYPES = ['Radio Buttons', 'Checkboxes', 'Dropdown', 'Yes/No'];
export const hasOptions = (type) => CHOICE_TYPES.includes(type);
export const REPEAT_BUTTON_LIMIT = 25;

let seq = 0;
const nid = (p) => `${p}-${Date.now().toString(36)}${(seq += 1).toString(36)}${Math.random().toString(36).slice(2, 5)}`;

export const emptyQuestionSettings = () => ({
  required: false, prefilled: false, conditional: false, mode: 'Any', conditions: [], descriptionEnabled: false, description: '',
});
export const emptySectionSettings = () => ({
  sectionRepeatingMode: false, buttonName: 'Repeat Section', conditional: false, mode: 'Any', conditions: [],
});
export const defaultOrganizerSettings = () => ({
  notifyaboutdocumentupload: false,
  organizerselfservice: false,
  automaticallysealaftersubmission: false,
  sendreminderstoclient: false,
  daysuntilnextreminder: 3,
  numberofreminders: 1,
});

export const newQuestion = (type, sectionid, data = {}) => ({
  id: nid('q'),
  type,
  sectionid,
  text: '',
  options: type === 'Yes/No' ? [{ id: nid('o'), text: 'Yes' }, { id: nid('o'), text: 'No' }] : hasOptions(type) ? [{ id: nid('o'), text: '' }] : [],
  questionsectionsettings: emptyQuestionSettings(),
  ...data,
});
export const newSection = (text = '') => ({ id: nid('s'), text, formElements: [], sectionsettings: emptySectionSettings() });
export const newOption = (text = '') => ({ id: nid('o'), text });
export const newCondition = () => ({ question: '', questionId: null, answer: '' });

export const emptyOrganizer = () => ({
  templatename: '',
  organizerName: '',
  sections: [],
  organizersettings: defaultOrganizerSettings(),
});

/** Copy a section with new ids for it, its questions and options. */
export function cloneSection(section) {
  const id = nid('s');
  return {
    ...JSON.parse(JSON.stringify(section)),
    id,
    text: `${section.text || 'Section'} (Copy)`,
    formElements: section.formElements.map((q) => ({ ...JSON.parse(JSON.stringify(q)), id: nid('q'), sectionid: id, options: q.options.map((o) => ({ ...o, id: nid('o') })) })),
  };
}

/** Every choice question in the organizer, with its section name (for condition pickers). */
export const choiceQuestions = (sections = []) => sections.flatMap((s, i) => s.formElements
  .filter((q) => hasOptions(q.type))
  .map((q) => ({ ...q, sectionName: s.text || `Section ${i + 1}` })));

/**
 * Are the conditions met? (used by the preview)
 * settings: { conditional, mode: 'Any' | 'All', conditions: [{ questionId, answer }] }
 * answers:  { [questionId]: string | string[] }
 */
export function conditionsMet(settings, answers) {
  if (!settings?.conditional) return true;
  const list = (settings.conditions || []).filter((c) => c.questionId && c.answer);
  if (!list.length) return true;
  const met = list.map((c) => {
    const a = answers[c.questionId];
    return Array.isArray(a) ? a.includes(c.answer) : a === c.answer;
  });
  return settings.mode === 'All' ? met.every(Boolean) : met.some(Boolean);
}

/** Problems that stop the template from being saved. */
export function organizerErrors(o, nameTaken) {
  const e = {};
  if (!o.templatename.trim()) e.templatename = 'Template name is required';
  else if (nameTaken) e.templatename = 'Template name already exists';
  if (!o.organizerName.trim()) e.organizerName = 'Organizer name is required';
  const untitled = o.sections.filter((s) => !s.text.trim()).length;
  if (untitled) e.sections = `${untitled} section${untitled > 1 ? 's need' : ' needs'} a title`;
  const blank = o.sections.reduce((n, s) => n + s.formElements.filter((q) => q.type !== TEXT_BLOCK && !q.text.trim()).length, 0);
  if (blank) e.questions = `${blank} question${blank > 1 ? 's have' : ' has'} no text`;
  const noOpts = o.sections.reduce((n, s) => n + s.formElements.filter((q) => hasOptions(q.type) && !q.options.some((op) => op.text.trim())).length, 0);
  if (noOpts) e.options = `${noOpts} choice question${noOpts > 1 ? 's need' : ' needs'} at least one option`;
  return e;
}

export const questionCount = (o) => (o.sections || []).reduce((n, s) => n + s.formElements.filter((q) => q.type !== TEXT_BLOCK).length, 0);

/* ---------- dummy data ---------- */
const q = (type, text, opts, settings) => ({ type, text, opts, settings });
const build = (id, templatename, organizerName, sectionDefs, settings = {}, updatedAt = '2026-06-01') => {
  const sections = sectionDefs.map(([title, questions, sectionsettings]) => {
    const s = { ...newSection(title), sectionsettings: { ...emptySectionSettings(), ...(sectionsettings || {}) } };
    s.formElements = questions.map((x) => newQuestion(x.type, s.id, {
      text: x.text,
      ...(x.opts ? { options: x.opts.map((t) => newOption(t)) } : {}),
      questionsectionsettings: { ...emptyQuestionSettings(), ...(x.settings || {}) },
    }));
    return s;
  });
  return { id, templatename, organizerName, sections, organizersettings: { ...defaultOrganizerSettings(), ...settings }, updatedAt };
};
/** Link a condition to a question by its text, after the ids exist. */
const linkConditions = (o) => {
  const all = o.sections.flatMap((s) => s.formElements);
  const fix = (st) => ({ ...st, conditions: (st.conditions || []).map((c) => ({ ...c, questionId: all.find((x) => x.text === c.question)?.id ?? null })) });
  o.sections = o.sections.map((s) => ({ ...s, sectionsettings: fix(s.sectionsettings), formElements: s.formElements.map((x) => ({ ...x, questionsectionsettings: fix(x.questionsectionsettings) })) }));
  return o;
};

export const seedOrganizerTemplates = [
  linkConditions(build('ot-1', 'Individual tax organizer', '[CURRENT_YEAR] tax organizer for [ACCOUNT_NAME]', [
    ['Personal information', [
      q('Free Entry', 'Full legal name', null, { required: true }),
      q('Email', 'Email address', null, { required: true, prefilled: true }),
      q('Date', 'Date of birth'),
      q('Radio Buttons', 'Filing status', ['Single', 'Married filing jointly', 'Married filing separately', 'Head of household'], { required: true }),
    ]],
    ['Spouse', [
      q('Free Entry', 'Spouse full name', null, { required: true }),
      q('Date', 'Spouse date of birth'),
    ], { conditional: true, mode: 'Any', conditions: [{ question: 'Filing status', answer: 'Married filing jointly' }, { question: 'Filing status', answer: 'Married filing separately' }] }],
    ['Dependents', [
      q('Free Entry', 'Dependent name'),
      q('Date', 'Dependent date of birth'),
      q('Yes/No', 'Lived with you all year?', ['Yes', 'No']),
    ], { sectionRepeatingMode: true, buttonName: 'Add another dependent' }],
    ['Income', [
      q('Checkboxes', 'Which income did you have?', ['W-2 wages', '1099 contractor', 'Rental income', 'Investments']),
      q('File Upload', 'Upload your W-2 forms', null, { conditional: true, conditions: [{ question: 'Which income did you have?', answer: 'W-2 wages' }] }),
      q('File Upload', 'Upload your 1099 forms', null, { conditional: true, conditions: [{ question: 'Which income did you have?', answer: '1099 contractor' }] }),
      q('Text Editor', '<p>Tip: you can upload photos of your documents from your phone 📱</p>'),
    ]],
  ], { sendreminderstoclient: true, daysuntilnextreminder: 3, numberofreminders: 3, notifyaboutdocumentupload: true }, '2026-02-10')),
  linkConditions(build('ot-2', 'New client onboarding', 'Welcome questionnaire – [ACCOUNT_NAME]', [
    ['About your business', [
      q('Free Entry', 'Business name', null, { required: true }),
      q('Dropdown', 'Entity type', ['Sole proprietor', 'LLC', 'S-Corp', 'C-Corp', 'Partnership'], { required: true }),
      q('Number', 'Number of employees'),
    ]],
    ['Accounting setup', [
      q('Radio Buttons', 'Accounting software', ['QuickBooks', 'Xero', 'None']),
      q('Free Entry', 'Who has admin access?', null, { conditional: true, conditions: [{ question: 'Accounting software', answer: 'QuickBooks' }, { question: 'Accounting software', answer: 'Xero' }] }),
    ]],
  ], { organizerselfservice: true }, '2026-03-05')),
  linkConditions(build('ot-3', 'Business tax organizer', '[CURRENT_YEAR] business tax organizer', [
    ['Company', [q('Free Entry', 'Legal company name', null, { required: true }), q('Free Entry', 'EIN', null, { required: true, prefilled: true })]],
    ['Assets', [q('Yes/No', 'Did you buy equipment over $2,500?', ['Yes', 'No']), q('File Upload', 'Upload equipment invoices', null, { conditional: true, conditions: [{ question: 'Did you buy equipment over $2,500?', answer: 'Yes' }] })]],
  ], { sendreminderstoclient: true, numberofreminders: 2, automaticallysealaftersubmission: true }, '2026-03-28')),
  linkConditions(build('ot-4', 'Payroll setup', 'Payroll information for [ACCOUNT_NAME]', [
    ['Pay schedule', [q('Radio Buttons', 'How often do you pay?', ['Weekly', 'Bi-weekly', 'Semi-monthly', 'Monthly'], { required: true }), q('Date', 'First pay date')]],
    ['Employees', [q('Free Entry', 'Employee name'), q('Email', 'Employee email'), q('Number', 'Annual salary')], { sectionRepeatingMode: true, buttonName: 'Add employee' }],
  ], {}, '2026-04-14')),
  linkConditions(build('ot-5', 'Rental property organizer', 'Rental properties – [CURRENT_YEAR]', [
    ['Property', [q('Free Entry', 'Property address', null, { required: true }), q('Number', 'Rent collected'), q('Number', 'Mortgage interest paid')], { sectionRepeatingMode: true, buttonName: 'Add property' }],
  ], { notifyaboutdocumentupload: true }, '2026-04-30')),
  linkConditions(build('ot-6', '1099 contractor list', 'Contractors paid in [LAST_YEAR]', [
    ['Contractor', [q('Free Entry', 'Contractor name', null, { required: true }), q('Number', 'Amount paid'), q('File Upload', 'W-9 form')], { sectionRepeatingMode: true, buttonName: 'Add contractor' }],
  ], { sendreminderstoclient: true }, '2026-05-19')),
  linkConditions(build('ot-7', 'Year-end checklist', '[CURRENT_YEAR] year-end checklist', [
    ['Documents', [q('Checkboxes', 'Which documents are ready?', ['Bank statements', 'Loan statements', 'Inventory count']), q('File Upload', 'Upload documents')]],
  ], { automaticallysealaftersubmission: true }, '2026-06-22')),
  linkConditions(build('ot-8', 'Quarterly estimates check-in', '[CURRENT_QUARTER] check-in', [
    ['Income this quarter', [q('Yes/No', 'Did your income change a lot?', ['Yes', 'No']), q('Number', 'Estimated income this quarter', null, { conditional: true, conditions: [{ question: 'Did your income change a lot?', answer: 'Yes' }] })]],
  ], { sendreminderstoclient: true, daysuntilnextreminder: 7 }, '2026-07-08')),
  linkConditions(build('ot-9', 'Audit preparation', 'Audit preparation for [ACCOUNT_NAME]', [
    ['General ledger', [q('File Upload', 'Upload the general ledger', null, { required: true }), q('Free Entry', 'Notes for the auditor', null, { descriptionEnabled: true, description: 'Anything unusual this year?' })]],
    ['Contacts', [q('Free Entry', 'Main contact name'), q('Email', 'Main contact email')]],
  ], { notifyaboutdocumentupload: true, automaticallysealaftersubmission: true }, '2026-08-17')),
  linkConditions(build('ot-10', 'Feedback survey', 'How did we do, [ACCOUNT_NAME]?', [
    ['Your feedback', [q('Radio Buttons', 'How satisfied are you?', ['Very satisfied', 'Satisfied', 'Not satisfied']), q('Free Entry', 'What could we do better?', null, { conditional: true, conditions: [{ question: 'How satisfied are you?', answer: 'Not satisfied' }] })]],
  ], { organizerselfservice: true }, '2026-09-29')),
];