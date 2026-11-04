// Job templates: blank form + dummy data. Field names match the job template form.
export const CLIENT_DESCRIPTION_LIMIT = 250;

export const emptyJobTemplate = {
  templatename: '',
  jobName: '',
  assignees: [],              // team member names
  priority: 'Medium',
  description: '',            // HTML from the text editor
  absoluteDate: false,
  startDate: '',
  dueDate: '',
  startsin: 0,
  startsInDuration: 'days',
  duein: 30,
  dueinduration: 'days',
  clientFacingStatus: false,  // "Show in Client Portal"
  inputText: '',              // Job name for client
  selectedJob: null,          // client-facing status id
  clientDescription: '',
  comments: [],               // strings
};

export const seedJobTemplates = [
  { ...emptyJobTemplate, id: 'jt-1', templatename: 'Individual tax return', jobName: '[ACCOUNT_NAME] – [CURRENT_YEAR] tax return', priority: 'High',
    assignees: ['Leila Nasser', 'Samuel Adeyemi'], duein: 45,
    description: '<p>Prepare and file the <b>individual return</b> for <span class="te-field" contenteditable="false" data-field="ACCOUNT_NAME">[ACCOUNT_NAME]</span>.</p><ul><li>Collect documents</li><li>Partner review</li><li>E-file</li></ul>',
    clientFacingStatus: true, inputText: 'Your [CURRENT_YEAR] tax return', selectedJob: 'cs-2', clientDescription: 'Please upload your W-2, 1099s and receipts.',
    comments: ['Check last year’s carry-forwards'], updatedAt: '2026-03-10' },
  { ...emptyJobTemplate, id: 'jt-2', templatename: 'Monthly close', jobName: '[ACCOUNT_NAME] – [LAST_MONTH_NAME] close', priority: 'Medium',
    assignees: ['Mateo Rossi'], duein: 10, clientFacingStatus: true, inputText: '[LAST_MONTH_NAME] bookkeeping', selectedJob: 'cs-3',
    clientDescription: 'We are reconciling your accounts for the month.', updatedAt: '2026-04-11' },
  { ...emptyJobTemplate, id: 'jt-3', templatename: 'New client onboarding', jobName: 'Onboarding – [ACCOUNT_NAME]', priority: 'Low',
    assignees: ['Ava Thompson', 'Elena Ruiz'], duein: 2, dueinduration: 'weeks', comments: ['Send portal invite on day 1', 'Book kickoff call'], updatedAt: '2026-05-12' },
  { ...emptyJobTemplate, id: 'jt-4', templatename: 'Year-end audit', jobName: '[ACCOUNT_NAME] audit [CURRENT_YEAR]', priority: 'Urgent',
    assignees: ['Samuel Adeyemi', 'Jonas Berg', 'Theo Laurent'], absoluteDate: true, startDate: '2026-12-01', dueDate: '2027-02-15',
    clientFacingStatus: true, inputText: 'Annual audit', selectedJob: 'cs-1', updatedAt: '2026-08-20' },
];

/**
 * Options for the job form's client-facing "Status" dropdown, from DataContext.
 * Works with clientFacingJobs ({ value, label, color, description }) and with clientStatuses ({ id, name, color, stage }).
 * Returns [{ id, name, color, stage? }].
 */
export function toStatusOptions(list = []) {
  const options = list.map((s) => ({ id: s.value ?? s.id, name: s.label ?? s.name, color: s.color || '#475569', stage: s.stage }));
  return options.some((o) => o.stage != null) ? options.sort((a, b) => (a.stage ?? 999) - (b.stage ?? 999)) : options;
}