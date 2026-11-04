// Task templates: options + dummy data (replace with your API later).

export const TASK_STATUSES = ['Active', 'Draft', 'Inactive'];
export const TASK_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
export const DURATION_OPTIONS = [
  { value: 'days', label: 'Days' },
  { value: 'weeks', label: 'Weeks' },
  { value: 'months', label: 'Months' },
];

export const STATUS_STYLE = {
  Active: 'bg-success-50 text-success-700',
  Draft: 'bg-warning-50 text-warning-700',
  Inactive: 'bg-[#E8EDF5] text-muted',
};
export const PRIORITY_STYLE = {
  Low: 'bg-[#E8EDF5] text-muted',
  Medium: 'bg-brand-100 text-brand-800',
  High: 'bg-warning-50 text-warning-700',
  Urgent: 'bg-danger-50 text-danger-700',
};

/** Blank form for a new task template (field names match the form). */
export const emptyTaskTemplate = {
  templatename: '',
  status: 'Active',
  assignees: [],          // team member names
  priority: 'Medium',
  description: '',
  tags: [],               // tag ids
  absoluteDate: false,
  startDate: '',
  dueDate: '',
  startsin: 0,
  startsInDuration: 'days',
  duein: 7,
  dueinduration: 'days',
  SubtaskSwitch: false,
  subtasks: [],           // [{ id, text, checked }]
};

const unit = (n, d) => `${n} ${n === 1 ? d.replace(/s$/, '') : d}`;
const fmt = (iso) => (iso ? new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—');

/** "Starts in 0 days · Due in 5 days"  or  "Mar 1, 2026 → Mar 15, 2026" */
export function describeDates(t) {
  if (t.absoluteDate) return `${fmt(t.startDate)} → ${fmt(t.dueDate)}`;
  return `Starts in ${unit(Number(t.startsin) || 0, t.startsInDuration)} · Due in ${unit(Number(t.duein) || 0, t.dueinduration)}`;
}

const sub = (prefix, items) => items.map((text, i) => ({ id: `${prefix}-s${i + 1}`, text, checked: false }));

export const seedTaskTemplates = [
  { ...emptyTaskTemplate, id: 'tt-1', templatename: 'Monthly bank reconciliation', status: 'Active', priority: 'High',
    assignees: ['Mateo Rossi', 'Jonas Berg'], tags: ['bookkeeping'], duein: 5,
    description: 'Reconcile every bank and card account against statements before the 5th of the month.',
    SubtaskSwitch: true, subtasks: sub('tt-1', ['Download statements', 'Match transactions', 'Flag unknown items']), updatedAt: '2026-03-10' },
  { ...emptyTaskTemplate, id: 'tt-2', templatename: 'Collect W-2 and 1099 forms', status: 'Active', priority: 'Medium',
    assignees: ['Leila Nasser'], tags: ['tax'], duein: 2, dueinduration: 'weeks',
    description: 'Request year-end tax forms from the client.', SubtaskSwitch: true, subtasks: sub('tt-2', ['Send request', 'Follow up after 7 days']), updatedAt: '2026-04-11' },
  { ...emptyTaskTemplate, id: 'tt-3', templatename: 'Payroll run review', status: 'Active', priority: 'Urgent',
    assignees: ['Nina Petrova', 'Samuel Adeyemi'], tags: ['payroll', 'priority'], duein: 2, updatedAt: '2026-05-12' },
  { ...emptyTaskTemplate, id: 'tt-4', templatename: 'New client kickoff call', status: 'Draft', priority: 'Low',
    assignees: ['Ava Thompson'], tags: ['onboarding', 'new-client'], startsin: 1, duein: 3,
    SubtaskSwitch: true, subtasks: sub('tt-4', ['Book call', 'Share agenda', 'Send recap']), updatedAt: '2026-06-13' },
  { ...emptyTaskTemplate, id: 'tt-5', templatename: 'Q4 audit preparation', status: 'Active', priority: 'High',
    assignees: ['Samuel Adeyemi', 'Jonas Berg', 'Elena Ruiz'], tags: ['audit', 'vip'],
    absoluteDate: true, startDate: '2026-11-02', dueDate: '2026-12-15', updatedAt: '2026-08-20' },
  { ...emptyTaskTemplate, id: 'tt-6', templatename: 'Archive closed engagements', status: 'Inactive', priority: 'Low',
    assignees: ['Theo Laurent'], tags: ['dormant'], duein: 1, dueinduration: 'months', updatedAt: '2026-09-02' },
];
