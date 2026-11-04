// Proposals for an account (Proposals tab): blank proposal, apply a template, validation and demo data.
import { newRow } from './invoiceTemplates';
import { emptyInvoice, emptyProposal, validateProposalStep } from './proposalTemplates';
import { fillShortcodes } from './accountChats';

let seq = 0;
const nid = () => `ap-${Date.now().toString(36)}${(seq += 1).toString(36)}${Math.random().toString(36).slice(2, 5)}`;
const clone = (o) => JSON.parse(JSON.stringify(o));

export const PROPOSAL_STATUS = {
  draft: { label: 'Draft', tone: 'bg-subtle text-muted' },
  sent: { label: 'Waiting for signature', tone: 'bg-brand-100 text-brand-800' },
  signed: { label: 'Signed', tone: 'bg-success-50 text-success-700' },
};

/** A blank proposal for an account (team members default to the account's team). */
export function emptyAccountProposal(account) {
  const p = emptyProposal();
  return { ...p, general: { ...p.general, accountId: account?.id || null, templateId: '', teamMembers: [...(account?.team || [])] } };
}

/** Fill a proposal from a proposal template (every step). Invoices and line items get new ids. */
export function applyProposalTemplate(current, tpl) {
  const t = clone(tpl);
  return {
    ...current,
    general: {
      ...current.general,
      templateId: tpl.id,
      proposalName: t.general.proposalName || t.general.templateName || '',
      teamMembers: t.general.teamMembers?.length ? t.general.teamMembers : current.general.teamMembers,
      introductionEnabled: t.general.introductionEnabled,
      termsEnabled: t.general.termsEnabled,
      servicesEnabled: t.general.servicesEnabled,
      paymentsEnabled: t.general.paymentsEnabled,
      skipStepper: t.general.skipStepper,
    },
    introduction: t.introduction,
    terms: t.terms,
    services: {
      ...t.services,
      invoices: (t.services.invoices || []).map((inv) => ({ ...inv, id: emptyInvoice().id, rows: inv.rows.map(({ id, ...r }) => newRow(r)) })),
      itemizedData: { ...t.services.itemizedData, rows: (t.services.itemizedData?.rows || []).map(({ id, ...r }) => newRow(r)) },
    },
    payments: t.payments,
  };
}

/** Same rules as templates, but General needs an account (and no template name). */
export function validateAccountProposalStep(key, data) {
  const e = validateProposalStep(key, data);
  if (key === 'general') {
    delete e.templateName;
    if (!data.general.accountId) e.accountId = 'Account is required';
  }
  return e;
}

export const proposalDisplayName = (p, account) => fillShortcodes(p.general.proposalName || 'Untitled proposal', account);

/** A demo proposal for accounts that have none saved yet (stable id per account). */
export function demoProposals(account, templates = []) {
  const t = templates.find((x) => x.id === 'pt-2') || templates[0];
  if (!t) return [];
  const p = applyProposalTemplate(emptyAccountProposal(account), t);
  return [{ ...p, id: `ap-${account.id}-demo`, status: 'sent', createdAt: new Date(Date.now() - 3 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 3 * 86400000).toISOString() }];
}

export const newProposalId = nid;
