// Tasks for accounts (account.tasks). Used by Workflow → Tasks, the account Workflow tab and the "Create Task" automation.
import { fillShortcodes } from './accountChats';

let seq = 0;
export const taskId = () => `task-${Date.now().toString(36)}${(seq += 1).toString(36)}${Math.random().toString(36).slice(2, 5)}`;
export const subtaskId = () => `st-${Date.now().toString(36)}${(seq += 1).toString(36)}`;
const DAY = 86400000;
const iso = (t) => new Date(t).toISOString().slice(0, 10);
export const todayIso = () => iso(Date.now());

/** Task statuses (the Status picker's options and colours). */
export const TASK_STATUSES = [
  { value: 'No status', label: 'No status', color: '#C4AEAD' },
  { value: 'Planned', label: 'Planned', color: '#4169E1' },
  { value: 'In review', label: 'In review', color: '#F6BE00' },
  { value: 'In progress', label: 'In progress', color: '#F6BE00' },
  { value: 'On hold', label: 'On hold', color: '#BCC6CC' },
  { value: 'Extended', label: 'Extended', color: '#82CAFF' },
  { value: 'Waiting for Client', label: 'Waiting for Client', color: '#566D7E' },
  { value: 'Waiting for Signatures', label: 'Waiting for Signatures', color: '#566D7E' },
  { value: 'Waiting for agency', label: 'Waiting for agency', color: '#566D7E' },
  { value: 'Completed', label: 'Completed', color: '#00FF00' },
  { value: 'Canceled', label: 'Canceled', color: '#EB5406' },
];
/** Statuses that close a task (shown on the Completed tab). */
export const CLOSED_STATUSES = ['Completed', 'Canceled'];

/* readable text on each status colour: white or dark, whichever has more contrast */
const lum = (hex) => {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const DARK = '#0F1B2D';
const textFor = (hex) => ((1.05) / (lum(hex) + 0.05) >= (lum(hex) + 0.05) / (lum(DARK) + 0.05) ? '#FFFFFF' : DARK);
export const statusInfo = (status) => TASK_STATUSES.find((s) => s.value === status) || TASK_STATUSES[0];
/** Inline style for a status badge (the status colour + readable text). */
export const statusBadgeStyle = (status) => { const c = statusInfo(status).color; return { backgroundColor: c, color: textFor(c) }; };

/** Statuses used before this list existed → their new value. */
const LEGACY = { Open: 'No status', 'Waiting on client': 'Waiting for Client' };
export const isCompleted = (t) => CLOSED_STATUSES.includes(t.status);           // closed: Completed or Canceled
export const isTaskOverdue = (t, now = todayIso()) => !isCompleted(t) && !!t.dueDate && t.dueDate < now;

/** The task form's fields (matches the Create / Edit Task drawer). */
export const emptyTask = () => ({
  accountId: '', jobId: '', templateId: '', status: 'No status', assignees: [], priority: 'Medium', name: '', description: '',
  tags: [], startDate: todayIso(), dueDate: '', subtasksOn: false, subtasks: [],
});

const plus = (n, unit = 'days') => iso(Date.now() + (Number(n) || 0) * (unit === 'weeks' ? 7 : unit === 'months' ? 30 : 1) * DAY);
/** Copy a task template into task fields (name and description get the account's shortcodes filled when saved). */
export const fromTaskTemplate = (t) => ({
  templateId: t.id,
  name: t.templatename,
  priority: t.priority || 'Medium',
  assignees: t.assignees || [],
  tags: t.tags || [],
  description: t.description || '',
  startDate: t.absoluteDate ? t.startDate : plus(t.startsin, t.startsInDuration),
  dueDate: t.absoluteDate ? t.dueDate : plus(t.duein, t.dueinduration),
  subtasksOn: !!t.SubtaskSwitch,
  subtasks: (t.subtasks || []).map((s) => ({ id: subtaskId(), text: s.text, checked: false })),
});

/** Fill in fields older / automation-made tasks may not have. */
export function normalizeTask(t) {
  return {
    ...emptyTask(),
    ...t,
    status: LEGACY[t.status] || t.status || 'No status',
    subtasks: t.subtasks || [],
    subtasksOn: t.subtasksOn ?? !!(t.subtasks || []).length,
    startDate: t.startDate || (t.createdAt ? iso(t.createdAt) : todayIso()),
  };
}

/** A stable number from the account id (so demo tasks don't depend on list order). */
const hash = (s) => [...String(s)].reduce((n, c) => (n * 31 + c.charCodeAt(0)) % 9973, 7);

/** Demo tasks for accounts with none saved yet (stable per account). */
export function demoTasks(account, templates = []) {
  const h = hash(account.id);
  const t = (id) => templates.find((x) => x.id === id);
  const make = (k, tplId, status, dueOffset) => {
    const tpl = t(tplId);
    if (!tpl) return null;
    const base = fromTaskTemplate(tpl);
    return {
      ...emptyTask(), ...base,
      id: `task-${account.id}-${k}`,
      accountId: account.id,
      name: fillShortcodes(tpl.templatename, account),
      description: fillShortcodes(tpl.description || '', account),
      status,
      startDate: iso(Date.now() - 6 * DAY),
      dueDate: iso(Date.now() + dueOffset * DAY),
      subtasks: base.subtasks.map((s, i) => ({ ...s, id: `task-${account.id}-${k}-s${i}`, checked: status === 'Completed' || i === 0 })),
      createdAt: new Date(Date.now() - (8 + k) * DAY).toISOString(),
      ...(status === 'Completed' ? { completedAt: new Date(Date.now() - DAY).toISOString() } : {}),
    };
  };
  const plans = [
    [[0, 'tt-1', 'In progress', 3], [1, 'tt-2', 'Completed', -4]],
    [[0, 'tt-2', 'Planned', -1]],
    [[0, 'tt-3', 'Waiting for Client', 5], [1, 'tt-1', 'No status', 9]],
    [],
  ];
  return plans[h % plans.length].map((p) => make(...p)).filter(Boolean);
}

/** An account's tasks (its saved list, else demo tasks), normalised. */
export const tasksOf = (account, templates = []) => (account.tasks ?? demoTasks(account, templates)).map(normalizeTask);