// Organizers applied to an account (Organizers tab).
import { fillShortcodes } from './accountChats';
import { questionCount } from './organizerTemplates';

let seq = 0;
const nid = () => `org-${Date.now().toString(36)}${(seq += 1).toString(36)}${Math.random().toString(36).slice(2, 5)}`;

/** Build one account's organizer from the Create organizer form and the chosen template. */
export function organizerFromForm(form, account, template) {
  return {
    id: nid(),
    templateId: template.id,
    templatename: template.templatename,
    organizerName: fillShortcodes(form.organizerName.trim(), account),
    sections: JSON.parse(JSON.stringify(template.sections)),       // a copy: later template edits don't change it
    reminders: { enabled: !!form.reminder, days: Number(form.days) || 0, count: Number(form.count) || 0 },
    status: 'active',
    createdAt: new Date().toISOString(),
  };
}

/** A demo organizer for accounts that have none saved yet (stable id per account). */
export function demoOrganizers(account, templates = []) {
  const t = templates.find((x) => x.id === 'ot-1') || templates[0];
  if (!t) return [];
  return [{
    id: `org-${account.id}-demo`,
    templateId: t.id,
    templatename: t.templatename,
    organizerName: fillShortcodes(t.organizerName, account),
    sections: JSON.parse(JSON.stringify(t.sections)),
    reminders: { enabled: !!t.organizersettings?.sendreminderstoclient, days: t.organizersettings?.daysuntilnextreminder || 3, count: t.organizersettings?.numberofreminders || 1 },
    status: 'active',
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
  }];
}

export const organizerQuestions = (o) => questionCount(o);