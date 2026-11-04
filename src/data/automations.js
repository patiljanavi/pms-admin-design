// Runs a pipeline stage's automations for one account when a job enters that stage.
// Pure: takes the account and job, returns the changed account and job plus a result per automation.
import { chatFromForm, demoChats, fillShortcodes, fillShortcodesHtml } from './accountChats';
import { demoOrganizers, organizerFromForm } from './accountOrganizers';
import { applyProposalTemplate, demoProposals, emptyAccountProposal, newProposalId } from './accountProposals';
import { calcTotals } from './invoiceTemplates';
import { defaultTree, mergeFolderTree } from './folderTemplates';
import { statusOptionsFrom } from './statusOptions';

let seq = 0;
const nid = (p) => `${p}-${Date.now().toString(36)}${(seq += 1).toString(36)}${Math.random().toString(36).slice(2, 5)}`;
const nameOf = (t) => t?.templatename ?? t?.templateName ?? t?.general?.templateName ?? t?.name ?? 'template';
const find = (list = [], id) => list.find((t) => String(t.id) === String(id));

/** Does the account meet the automation's "only for accounts with these tags" condition? */
export function meetsConditions(automation, account) {
  const tags = automation.selectedTags || [];
  return !tags.length || tags.some((t) => (account.tags || []).includes(t));
}

/** One line describing what an automation will do (for the review drawer). */
export function describeAutomation(a, ctx) {
  const t = {
    'Send Email': find(ctx.emailTemplates, a.selectedtemp),
    'Send message': find(ctx.chatTemplates, a.selectedtemp),
    'Create Organizer': find(ctx.organizerTemplates, a.selectedtemp),
    'Send Proposal/Els': find(ctx.proposalTemplates, a.selectedtemp),
    'Send Invoice': find(ctx.invoiceTemplates, a.selectedtemp),
    'Apply folder template': find(ctx.folderTemplates, a.selectedtemp),
    'Create Task': find(ctx.taskTemplates, a.selectedtemp),
  }[a.type];
  if (t) return `${a.type}: “${nameOf(t)}”`;
  if (a.type === 'Update account tags') return `Update account tags: +${(a.addTags || []).length} / −${(a.removeTags || []).length}`;
  if (a.type === 'Update job assignees') return `Update job assignees: +${(a.selectedAssignees || []).length} / −${(a.assigneesToRemove || []).length}`;
  if (a.type === 'Update client-facing job status') {
    const st = statusOptionsFrom(ctx.statuses).find((s) => String(s.id) === String(a.selectedClientStatus));
    return a.status ? `Client-facing status → ${st?.name || 'status'}` : 'Hide the job from the client portal';
  }
  return a.type;
}

/**
 * Run automations for one account + job.
 * ctx: { chatTemplates, emailTemplates, organizerTemplates, proposalTemplates, invoiceTemplates, folderTemplates, taskTemplates, statuses, tagById, me }
 * Returns { account, job, results: [{ id, type, ok, text }] }
 */
export function runAutomations(automations, accountIn, jobIn, ctx) {
  let account = { ...accountIn };
  let job = { ...jobIn };
  const now = new Date().toISOString();
  const results = [];
  const done = (a, text) => results.push({ id: a.id, type: a.type, ok: true, text });
  const skip = (a, text) => results.push({ id: a.id, type: a.type, ok: false, text });

  automations.forEach((a) => {
    if (!meetsConditions(a, account)) {
      const names = (a.selectedTags || []).map((id) => ctx.tagById?.get(id)?.label || id).join(', ');
      skip(a, `${a.type} skipped — ${account.name} doesn’t have the tag${a.selectedTags.length > 1 ? 's' : ''} ${names}`);
      return;
    }
    const reminders = { sendReminders: !!a.reminderChecked, days: a.daysuntilNextReminder || 3, count: a.noOfReminder || 1 };
    switch (a.type) {
      case 'Send message': {
        const t = find(ctx.chatTemplates, a.selectedtemp);
        if (!t) { skip(a, 'Send message skipped — the chat template no longer exists'); return; }
        const chat = chatFromForm({
          templateId: t.id, subject: t.inputText || t.templateName, description: t.description || '',
          sendReminders: reminders.sendReminders || !!t.sendReminders, days: a.reminderChecked ? reminders.days : t.daysuntilNextReminder, count: a.reminderChecked ? reminders.count : t.noOfReminder,
          tasks: t.SubtaskSwitch ? (t.subtasks || []).map((s) => ({ text: s.text })) : [],
        }, account, ctx.me);
        account = { ...account, chats: [chat, ...(account.chats ?? demoChats(account))] };
        done(a, `Chat sent: “${chat.subject}”`);
        return;
      }
      case 'Send Email': {
        const t = find(ctx.emailTemplates, a.selectedtemp);
        if (!t) { skip(a, 'Send Email skipped — the email template no longer exists'); return; }
        const email = { id: nid('email'), templateId: t.id, subject: fillShortcodes(t.subject || t.templateName, account), body: fillShortcodesHtml(t.emailBody || '', account),
          from: t.selectedUser?.label || t.selectedUser || ctx.me, sentAt: now, reminders: a.reminderChecked ? { days: reminders.days, count: reminders.count } : null };
        account = { ...account, emails: [email, ...(account.emails || [])] };
        done(a, `Email sent: “${email.subject}”`);
        return;
      }
      case 'Create Organizer': {
        const t = find(ctx.organizerTemplates, a.selectedtemp);
        if (!t) { skip(a, 'Create Organizer skipped — the organizer template no longer exists'); return; }
        const st = t.organizersettings || {};
        const org = organizerFromForm({ organizerName: t.organizerName || t.templatename, reminder: a.reminderChecked || !!st.sendreminderstoclient,
          days: a.reminderChecked ? reminders.days : st.daysuntilnextreminder, count: a.reminderChecked ? reminders.count : st.numberofreminders }, account, t);
        account = { ...account, organizers: [org, ...(account.organizers ?? demoOrganizers(account, ctx.organizerTemplates))] };
        done(a, `Organizer created: “${org.organizerName}”`);
        return;
      }
      case 'Send Proposal/Els': {
        const t = find(ctx.proposalTemplates, a.selectedtemp);
        if (!t) { skip(a, 'Send Proposal skipped — the proposal template no longer exists'); return; }
        const p = { ...applyProposalTemplate(emptyAccountProposal(account), t), id: newProposalId(), status: 'sent', createdAt: now, updatedAt: now, sentAt: now };
        account = { ...account, proposals: [p, ...(account.proposals ?? demoProposals(account, ctx.proposalTemplates))] };
        done(a, `Proposal sent: “${fillShortcodes(p.general.proposalName, account)}”`);
        return;
      }
      case 'Send Invoice': {
        const t = find(ctx.invoiceTemplates, a.selectedtemp);
        if (!t) { skip(a, 'Send Invoice skipped — the invoice template no longer exists'); return; }
        const inv = { id: nid('inv'), templateId: t.id, name: fillShortcodes(t.description || t.templatename, account), total: calcTotals(t.rows, t.taxRate).totalAmount, status: 'sent', sentAt: now };
        account = { ...account, invoices: [inv, ...(account.invoices || [])] };
        done(a, `Invoice sent: “${inv.name}”`);
        return;
      }
      case 'Apply folder template': {
        const t = find(ctx.folderTemplates, a.selectedtemp);
        if (!t) { skip(a, 'Apply folder template skipped — the folder template no longer exists'); return; }
        account = { ...account, documents: mergeFolderTree(account.documents || defaultTree(), t.items) };
        done(a, `Folder template applied: “${t.templatename}”`);
        return;
      }
      case 'Create Task': {
        const t = find(ctx.taskTemplates, a.selectedtemp);
        if (!t) { skip(a, 'Create Task skipped — the task template no longer exists'); return; }
        const task = { id: nid('task'), templateId: t.id, jobId: job.id, name: fillShortcodes(t.templatename, account), assignees: t.assignees || [], priority: t.priority, status: 'Open', createdAt: now };
        account = { ...account, tasks: [task, ...(account.tasks || [])] };
        done(a, `Task created: “${task.name}”`);
        return;
      }
      case 'Update account tags': {
        const tags = new Set(account.tags || []);
        (a.addTags || []).forEach((t) => tags.add(t));
        (a.removeTags || []).forEach((t) => tags.delete(t));
        account = { ...account, tags: [...tags] };
        const label = (ids) => ids.map((id) => ctx.tagById?.get(id)?.label || id).join(', ');
        done(a, `Tags updated${a.addTags?.length ? ` · added ${label(a.addTags)}` : ''}${a.removeTags?.length ? ` · removed ${label(a.removeTags)}` : ''}`);
        return;
      }
      case 'Update job assignees': {
        const set = new Set(job.assignees || []);
        (a.selectedAssignees || []).forEach((m) => set.add(m));
        (a.assigneesToRemove || []).forEach((m) => set.delete(m));
        job = { ...job, assignees: [...set] };
        done(a, `Job assignees updated: ${[...set].join(', ') || 'none'}`);
        return;
      }
      case 'Update client-facing job status': {
        job = { ...job, clientFacingStatus: !!a.status, selectedJob: a.status ? a.selectedClientStatus : job.selectedJob, clientDescription: a.status ? fillShortcodes(a.clientDescription || '', account) : job.clientDescription };
        const st = statusOptionsFrom(ctx.statuses).find((s) => String(s.id) === String(a.selectedClientStatus));
        done(a, a.status ? `Client-facing status set to “${st?.name || 'status'}”` : 'Job hidden from the client portal');
        return;
      }
      default:
        skip(a, `${a.type} isn’t supported yet`);
    }
  });

  job = { ...job, activity: [...(job.activity || []), ...results.map((r) => ({ ...r, at: now }))] };
  return { account, job, results };
}
