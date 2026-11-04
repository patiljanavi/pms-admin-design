// Jobs on pipeline boards (Workflow → Pipelines). Each job sits in one stage of one pipeline.
import { SEED_PIPELINES } from './pipelinesdata';
import { seedAccounts } from './sampleData';

let seq = 0;
export const jobId = () => `job-${Date.now().toString(36)}${(seq += 1).toString(36)}${Math.random().toString(36).slice(2, 5)}`;
export const JOB_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
const PRIORITY_RANK = { Urgent: 0, High: 1, Medium: 2, Low: 3 };

export const emptyJob = (pipeline, stageId) => ({
  pipelineId: pipeline?.id || null,
  stageId: stageId || pipeline?.stages?.[0]?.id || null,
  accountId: '',
  jobTemplateId: pipeline?.defaultjobtemplate || '',
  name: '',
  description: '',
  priority: 'Medium',
  startDate: '',
  dueDate: '',
  assignees: [],
});

const day = 86400000;
export const daysInStage = (job, now = Date.now()) => Math.max(0, Math.floor((now - new Date(job.enteredStageAt || job.createdAt).getTime()) / day));
export const isOverdue = (job, now = new Date()) => !!job.dueDate && new Date(`${job.dueDate}T23:59:59`) < now;

/** Sort jobs the way the pipeline's "Sort jobs by" says. */
export function sortJobs(jobs, sortBy, accountName = () => '') {
  const list = [...jobs];
  const by = {
    dueDate: (a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999'),
    startDate: (a, b) => (a.startDate || '9999').localeCompare(b.startDate || '9999'),
    priority: (a, b) => (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9),
    name: (a, b) => a.name.localeCompare(b.name),
    account: (a, b) => accountName(a.accountId).localeCompare(accountName(b.accountId)),
    createdAt: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    daysInStage: (a, b) => daysInStage(b) - daysInStage(a),
  }[sortBy];
  return by ? list.sort(by) : list;
}

/* ---------- demo jobs: spread over the sample pipelines' stages ---------- */
const iso = (daysAgo) => new Date(Date.now() - daysAgo * day).toISOString();
const date = (inDays) => new Date(Date.now() + inDays * day).toISOString().slice(0, 10);
const acct = (i) => seedAccounts[i % seedAccounts.length];
const job = (p, stageIndex, i, data) => ({
  id: `job-${p.id}-${stageIndex}-${i}`,
  pipelineId: p.id,
  stageId: p.stages[Math.min(stageIndex, p.stages.length - 1)].id,
  accountId: acct(i).id,
  jobTemplateId: p.defaultjobtemplate || '',
  description: '',
  startDate: '',
  assignees: [],
  createdAt: iso(20 - i),
  enteredStageAt: iso((i * 3) % 11),
  ...data,
});
// Only pipelines that exist and have stages get demo jobs (works with any SEED_PIPELINES).
const usable = (SEED_PIPELINES || []).filter((p) => p?.stages?.length);
const [pTax, pBooks, pOnboard] = usable;
const demo = (p, rows) => (p && seedAccounts.length ? rows.map(([stage, i, data]) => job(p, stage, i, data)) : []);
export const seedJobs = [
  ...demo(pTax, [
    [0, 0, { name: `${acct(0).name} – tax return`, priority: 'High', dueDate: date(12), assignees: ['Leila Nasser'] }],
    [0, 1, { name: `${acct(1).name} – tax return`, priority: 'Medium', dueDate: date(20), assignees: ['Samuel Adeyemi'] }],
    [1, 2, { name: `${acct(2).name} – tax return`, priority: 'Urgent', dueDate: date(-2), assignees: ['Leila Nasser', 'Ava Thompson'], description: 'Waiting on the 1099-B.' }],
    [2, 3, { name: `${acct(3).name} – tax return`, priority: 'High', startDate: date(-5), dueDate: date(6), assignees: ['Samuel Adeyemi'] }],
    [3, 4, { name: `${acct(4).name} – tax return`, priority: 'Low', dueDate: date(3), assignees: ['Leila Nasser'] }],
    [4, 5, { name: `${acct(5).name} – tax return`, priority: 'Medium', dueDate: date(-10), assignees: ['Ava Thompson'] }],
  ]),
  ...demo(pBooks, [
    [0, 6, { name: `${acct(6).name} – monthly close`, priority: 'Medium', dueDate: date(9), assignees: ['Mateo Rossi'] }],
    [1, 7, { name: `${acct(7).name} – monthly close`, priority: 'High', dueDate: date(4), assignees: ['Jonas Berg'] }],
    [2, 0, { name: `${acct(0).name} – monthly close`, priority: 'Medium', dueDate: date(2), assignees: ['Mateo Rossi'] }],
  ]),
  ...demo(pOnboard, [
    [1, 1, { name: `Onboarding – ${acct(1).name}`, priority: 'Low', dueDate: date(14), assignees: ['Ava Thompson', 'Elena Ruiz'] }],
  ]),
];
