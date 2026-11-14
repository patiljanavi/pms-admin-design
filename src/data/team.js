// Team members, access rights and groups (Templates → Teams & Plans).
// Member: { id, firstName, middleName, lastName, name, email, role: 'employee' | 'admin', status: 'active' | 'invited' | 'deactivated',
//           permissions: { [key]: boolean }, title, invitedAt, deactivatedAt? }
// Group:  { id, name, leaderId, memberIds: [...], createdAt }  — a member is in at most one group.
import { TEAM_MEMBERS } from './sampleData';

/** Access rights, in the order shown (your keys), with readable labels. */
export const PERMISSIONS = [
  ['managePayments', 'Manage payments'], ['managePipelines', 'Manage pipelines'], ['manageTimeEntries', 'Manage time entries'],
  ['manageAccounts', 'Manage accounts'], ['manageTags', 'Manage tags'], ['manageOrganizers', 'Manage organizers'],
  ['chargeFirmBalance', 'Charge firm balance'], ['manageContacts', 'Manage contacts'], ['manageSites', 'Manage sites'],
  ['manageServices', 'Manage services'], ['managePublicFilterTemplates', 'Manage public filter templates'], ['manageTemplates', 'Manage templates'],
  ['manageMarketPlace', 'Manage marketplace'], ['manageInvoices', 'Manage invoices'], ['manageJobRecurrence', 'Manage job recurrence'],
  ['manageRatesinTimeEntries', 'Manage rates in time entries'], ['viewallAccounts', 'View all accounts'], ['manageCustomFields', 'Manage custom fields'],
  ['assignTeamMates', 'Assign teammates'], ['viewAllContacts', 'View all contacts'], ['manageProposals', 'Manage proposals'],
  ['manageEmails', 'Manage emails'], ['editOrganizersAnswers', 'Edit organizer answers'], ['manageDocuments', 'Manage documents'],
  ['manageIRSTranscripts', 'Manage IRS transcripts'], ['viewReporting', 'View reporting'],
].map(([key, label]) => ({ key, label }));
/** Not available yet (shown, but can't be switched on) — your list. */
export const DISABLED_PERMISSIONS = new Set([
  'managePayments', 'manageTimeEntries', 'chargeFirmBalance', 'manageSites', 'viewReporting', 'manageMarketPlace',
  'managePublicFilterTemplates', 'manageJobRecurrence', 'manageRatesinTimeEntries', 'manageCustomFields', 'manageEmails',
  'editOrganizersAnswers', 'manageDocuments', 'manageIRSTranscripts',
]);
export const emptyPermissions = () => Object.fromEntries(PERMISSIONS.map((p) => [p.key, false]));
export const ROLES = [{ value: 'employee', label: 'Employee' }];

let seq = 0;
export const teamId = (p = 'tm') => `${p}-${Date.now().toString(36)}${(seq += 1).toString(36)}${Math.random().toString(36).slice(2, 5)}`;
export const fullName = (m) => [m.firstName, m.middleName, m.lastName].map((s) => (s || '').trim()).filter(Boolean).join(' ');
export const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((e || '').trim());
export const grantedCount = (m) => Object.values(m.permissions || {}).filter(Boolean).length;

/** Demo team: your current team (active) + two deactivated people. */
export function seedTeam() {
  const perms = (keys) => ({ ...emptyPermissions(), ...Object.fromEntries(keys.map((k) => [k, true])) });
  const common = ['managePipelines', 'manageAccounts', 'manageContacts', 'manageTags', 'assignTeamMates', 'viewAllContacts'];
  const people = [...TEAM_MEMBERS.map((m) => ({ id: m.value, name: m.label, title: m.meta, status: 'active' })),
    { id: 'u-priya', name: 'Priya Shah', title: 'Seasonal preparer', status: 'deactivated' },
    { id: 'u-marcus', name: 'Marcus Lee', title: 'Intern', status: 'deactivated' }];
  return people.map((p, i) => {
    const [firstName, ...rest] = p.name.split(' ');
    return {
      id: p.id, firstName, middleName: '', lastName: rest.join(' '), name: p.name, title: p.title,
      email: `${p.name.toLowerCase().replace(/[^a-z]+/g, '.')}@harborfirm.com`, role: 'employee', status: p.status,
      permissions: perms(i % 3 === 0 ? [...common, 'manageInvoices', 'manageProposals', 'manageTemplates'] : common),
      invitedAt: new Date(Date.now() - (120 - i * 9) * 86400000).toISOString(),
      ...(p.status === 'deactivated' ? { deactivatedAt: new Date(Date.now() - 20 * 86400000).toISOString() } : {}),
    };
  });
}
/** Demo groups. */
export const seedGroups = () => [
  { id: 'grp-tax', name: 'Tax team', leaderId: 'u-leila', memberIds: ['u-jonas', 'u-theo'], createdAt: '2026-08-01T09:00:00.000Z' },
  { id: 'grp-books', name: 'Bookkeeping', leaderId: 'u-mateo', memberIds: ['u-nina'], createdAt: '2026-08-12T09:00:00.000Z' },
];
