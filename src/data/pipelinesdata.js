// Pipeline templates: options, blank records and sample pipelines.
// Field names match the pipeline form (pipelineName, availableto, sortjobsby, defaultjobtemplate, card fields, stages).

export const SORT_JOBS_BY = [
  { value: 'dueDate', label: 'Due date' },
  { value: 'startDate', label: 'Start date' },
  { value: 'priority', label: 'Priority' },
  { value: 'name', label: 'Job name' },
  { value: 'account', label: 'Account name' },
  { value: 'createdAt', label: 'Date added' },
  { value: 'daysInStage', label: 'Days in stage' },
];

/** Job card fields (checkboxes): what each job card on the pipeline board shows. */
export const JOB_CARD_FIELDS = [
  { name: 'accountId', label: 'Account ID' },
  { name: 'accounttags', label: 'Account tags' },
  { name: 'stageTimeLimit', label: 'Stage time limit' },
  { name: 'name', label: 'Name' },
  { name: 'description', label: 'Description' },
  { name: 'priority', label: 'Priority' },
  { name: 'startdate', label: 'Start date' },
  { name: 'duedate', label: 'Due date' },
  { name: 'intakeDate', label: 'Intake date' },
  { name: 'internalDeadlineDate', label: 'Internal deadline date' },
  { name: 'timeBudget', label: 'Time budget' },
  { name: 'tracked', label: 'Tracked' },
  { name: 'timeVariance', label: 'Time variance' },
  { name: 'budgetTimeSpent', label: 'Budget Time Spent' },
  { name: 'assignees', label: 'Assignees' },
  { name: 'clientFacingStatus', label: 'Client-facing status' },
  { name: 'daysInStage', label: 'Days in stage' },
];

/**
 * Automations a stage can run when a job enters it.
 * source = the DataContext list its template comes from · reminders = can repeat until the client acts.
 */
export const AUTOMATION_TYPES = [
  { type: 'Send Email', source: 'emailTemplates', refModel: 'EmailTemplate', reminders: true },
  { type: 'Send Invoice', source: 'invoiceTemplates', refModel: 'InvoiceTemplate', reminders: true },
  { type: 'Send Proposal/Els', source: 'proposalTemplates', refModel: 'ProposalTemplate', reminders: true },
  { type: 'Create Organizer', source: 'organizerTemplates', refModel: 'OrganizerTemplate', reminders: true },
  { type: 'Apply folder template', source: 'folderTemplates', refModel: 'FolderTemplate' },
  { type: 'Update account tags' },
  { type: 'Create Task', source: 'taskTemplates', refModel: 'TaskTemplate' },
  { type: 'Send message', source: 'chatTemplates', refModel: 'ChatTemplate', reminders: true },
  { type: 'Update client-facing job status' },
  { type: 'Update job assignees' },
];
export const automationInfo = (type) => AUTOMATION_TYPES.find((a) => a.type === type) || { type };
export const CLIENT_STATUS_DESCRIPTION_LIMIT = 150;

const rid = (p) => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export const newAutomation = (type) => ({
  id: rid('auto'),
  type,
  selectedtemp: null,            // template id
  selectedTags: [],              // conditions: only for accounts with these tag ids
  reminderChecked: false,
  daysuntilNextReminder: 3,
  noOfReminder: 2,
  addTags: [],
  removeTags: [],
  selectedAssignees: [],
  assigneesToRemove: [],
  status: true,                  // client-facing: show (true) / hide (false)
  selectedClientStatus: null,    // client-facing status id
  clientDescription: '',
  refModel: automationInfo(type).refModel || null,
});

export const newStage = (name = '') => ({ id: rid('stage'), name, conditions: [], automations: [], autoMove: false });

export const emptyPipeline = {
  pipelineName: '',
  availableto: [],               // team member names
  sortjobsby: null,              // SORT_JOBS_BY value
  defaultjobtemplate: null,      // job template id
  ...Object.fromEntries(JOB_CARD_FIELDS.map((f) => [f.name, ['name', 'duedate', 'assignees', 'priority'].includes(f.name)])),
  stages: [],
};

const auto = (type, extra) => ({ ...newAutomation(type), ...extra });
const stage = (name, extra = {}) => ({ ...newStage(name), ...extra });

export const SEED_PIPELINES = [
  {
    ...emptyPipeline, id: 'pl-1', pipelineName: 'Individual tax return', availableto: ['Leila Nasser', 'Samuel Adeyemi', 'Ava Thompson'],
    sortjobsby: 'dueDate', defaultjobtemplate: 'jt-1', accounttags: true, clientFacingStatus: true, daysInStage: true,
    stages: [
      stage('Intake', { automations: [auto('Send Email', { selectedtemp: 'et-1' }), auto('Update client-facing job status', { selectedClientStatus: 'cs-1', clientDescription: 'We have opened your job and will be in touch shortly.' })] }),
      stage('Waiting on documents', { automations: [auto('Send Email', { selectedtemp: 'et-2', reminderChecked: true, daysuntilNextReminder: 3, noOfReminder: 3 }), auto('Update client-facing job status', { selectedClientStatus: 'cs-2', clientDescription: 'Please upload the requested documents in your portal.' })] }),
      stage('In preparation', { automations: [auto('Create Task', { selectedtemp: 'tt-2' })], autoMove: true }),
      stage('Partner review', { conditions: ['vip'], automations: [auto('Update job assignees', { selectedAssignees: ['Samuel Adeyemi'] })] }),
      stage('Completed', { automations: [auto('Update account tags', { addTags: ['tax'], removeTags: ['onboarding'] })] }),
    ],
    updatedAt: '2026-09-14T10:00:00.000Z',
  },
  {
    ...emptyPipeline, id: 'pl-2', pipelineName: 'Monthly bookkeeping', availableto: ['Mateo Rossi', 'Jonas Berg'],
    sortjobsby: 'startDate', defaultjobtemplate: 'jt-2', timeBudget: true, tracked: true,
    stages: [
      stage('To do'),
      stage('Reconciling', { automations: [auto('Create Task', { selectedtemp: 'tt-1' })] }),
      stage('Client questions', { automations: [auto('Send message', { selectedtemp: 1 })] }),
      stage('Done', { automations: [auto('Send Invoice', { selectedtemp: 1 })] }),
    ],
    updatedAt: '2026-10-02T09:30:00.000Z',
  },
  {
    ...emptyPipeline, id: 'pl-3', pipelineName: 'New client onboarding', availableto: ['Ava Thompson', 'Elena Ruiz'],
    sortjobsby: 'createdAt', defaultjobtemplate: 'jt-3',
    stages: [
      stage('Lead'),
      stage('Proposal sent', { automations: [auto('Send Proposal/Els', { selectedtemp: 1, reminderChecked: true })] }),
      stage('Setup', { automations: [auto('Apply folder template', { selectedtemp: 1 }), auto('Create Organizer', { selectedtemp: 2 })] }),
      stage('Active client', { automations: [auto('Update account tags', { addTags: ['new-client'] })] }),
    ],
    updatedAt: '2026-10-20T14:15:00.000Z',
  },
];