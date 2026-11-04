// Proposal templates (Proposals & ELs): blank form, options, steps, validation and dummy data.
// Same structure as the ProposalForm: general · introduction · terms · services · payments.
import { calcTotals, newRow } from './invoiceTemplates';

export const ISSUE_OPTIONS = [
  { value: 'immediately', label: 'Immediately when the proposal is signed' },
  { value: 'specific date', label: 'On a specific date' },
];
export const TIME_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const h = 7 + Math.floor(i / 2);
  const m = i % 2 ? '30' : '00';
  return `${((h + 11) % 12) + 1}:${m} ${h < 12 ? 'AM' : 'PM'}`;
});
export const PROPOSAL_PAYMENT_METHODS = ['Credit card', 'Bank debit', 'Credit card or bank debit'];
export const INVOICE_DESCRIPTION_LIMIT = 1000;

let seq = 0;
export const emptyInvoice = () => ({
  id: `pinv-${Date.now().toString(36)}-${(seq += 1)}`,
  invoiceTemplate: null,          // invoice template id
  teamMembers: [],                // names
  issueInvoice: 'immediately',
  specificDate: '',
  selectedTime: '',
  description: '',
  rows: [newRow()],
  taxRate: 0,
  clientNote: '',
});

export const emptyProposal = () => ({
  general: {
    skipStepper: false,
    introductionEnabled: true,
    termsEnabled: true,
    servicesEnabled: true,
    paymentsEnabled: false,
    templateName: '',
    proposalName: '',
    teamMembers: [],
  },
  introduction: { title: '', description: '' },
  terms: { title: '', description: '' },
  services: {
    option: '',                    // 'invoice' | 'services'
    invoices: [emptyInvoice()],
    itemizedData: { rows: [newRow()], taxRate: 0 },
  },
  payments: { method: '', amount: 0 },
});

/** Steps shown for a proposal (same rules as getAvailableSteps). */
export function proposalSteps(p) {
  const steps = [{ key: 'general', name: 'General' }];
  if (p.general.introductionEnabled) steps.push({ key: 'introduction', name: 'Introduction' });
  if (p.general.termsEnabled) steps.push({ key: 'terms', name: 'Terms' });
  if (p.general.servicesEnabled) steps.push({ key: 'services', name: 'Services & Invoices' });
  if (p.general.paymentsEnabled && p.services.option === 'invoice') steps.push({ key: 'payments', name: 'Payment' });
  return steps;
}

const htmlEmpty = (html) => !String(html || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
const rowErrors = (rows = []) => {
  if (!rows.length) return 'At least one line item is required.';
  if (rows.some((r) => !String(r.productName || '').trim())) return 'Every line item needs a product/service name (or a reason for a discount).';
  if (rows.some((r) => !r.isDiscount && !(Number(r.rate) > 0))) return 'Rate must be greater than 0 for every line item.';
  if (rows.some((r) => !(Number(r.qty) > 0))) return 'Quantity must be greater than 0.';
  return '';
};

/** Errors for one step (same rules as validateStepData). Returns {} when the step is valid. */
export function validateProposalStep(key, p) {
  const e = {};
  if (key === 'general') {
    if (!p.general.templateName?.trim()) e.templateName = 'Template name is required';
    if (!p.general.proposalName?.trim()) e.proposalName = 'Proposal name is required';
    if (!p.general.teamMembers?.length) e.teamMembers = 'At least one team member is required';
  }
  if (key === 'introduction') {
    if (!p.introduction.title?.trim()) e.title = 'Introduction title is required';
    if (htmlEmpty(p.introduction.description)) e.description = 'Introduction description is required';
  }
  if (key === 'terms') {
    if (!p.terms.title?.trim()) e.title = 'Terms title is required';
    if (htmlEmpty(p.terms.description)) e.description = 'Terms and conditions are required';
  }
  if (key === 'services') {
    const s = p.services;
    if (!s.option) e.option = 'Please select an option';
    else if (s.option === 'invoice') {
      if (!s.invoices.length) e.invoices = 'At least one invoice is required';
      s.invoices.forEach((inv, i) => {
        const ie = {};
        if (!inv.invoiceTemplate) ie.invoiceTemplate = 'Template is required';
        if (!inv.teamMembers?.length) ie.teamMembers = 'At least one team member is required';
        if (!inv.description?.trim()) ie.description = 'Description is required';
        if (inv.issueInvoice === 'specific date' && !inv.specificDate) ie.specificDate = 'Pick a date';
        const re = rowErrors(inv.rows);
        if (re) ie.rows = re;
        if (Object.keys(ie).length) e[`invoice_${i}`] = ie;
      });
    } else if (s.option === 'services') {
      const re = rowErrors(s.itemizedData.rows);
      if (re) e.itemizedRows = re;
    }
  }
  if (key === 'payments') {
    if (!p.payments.method?.trim()) e.method = 'Payment method is required';
    if (!(Number(p.payments.amount) > 0)) e.amount = 'Payment amount must be greater than 0';
  }
  return e;
}

/** Total value of a proposal (all invoices, or the itemized services). */
export function proposalTotal(p) {
  if (p.services?.option === 'invoice') return (p.services.invoices || []).reduce((s, inv) => s + calcTotals(inv.rows, inv.taxRate).totalAmount, 0);
  if (p.services?.option === 'services') return calcTotals(p.services.itemizedData?.rows, p.services.itemizedData?.taxRate).totalAmount;
  return 0;
}

/* ---------- dummy data ---------- */
const line = (productName, rate, qty = 1, extra = {}) => newRow({ productName, rate, qty, ...extra });
const intro = (firm) => ({ title: 'Why work with us', description: `<p>${firm} helps growing businesses stay compliant and make better decisions. 📈</p><ul><li>Dedicated account manager</li><li>Secure client portal</li></ul>` });
const terms = { title: 'Engagement letter', description: '<p>This letter confirms the services we will provide to <span class="te-field" contenteditable="false" data-field="ACCOUNT_NAME">[ACCOUNT_NAME]</span>. Fees are due within 15 days of each invoice.</p>' };
const inv = (data) => ({ ...emptyInvoice(), ...data });
const proposal = (id, g, rest = {}) => {
  const base = emptyProposal();
  return {
    ...base, ...rest, id,
    general: { ...base.general, ...g },
    introduction: rest.introduction || intro('Harbor Accounting'),
    terms: rest.terms || terms,
    services: { ...base.services, ...(rest.services || {}) },
    payments: { ...base.payments, ...(rest.payments || {}) },
    updatedAt: rest.updatedAt || '2026-06-01',
  };
};

export const seedProposalTemplates = [
  proposal('pt-1', { templateName: 'Small business package', proposalName: '[CURRENT_YEAR] services for [ACCOUNT_NAME]', teamMembers: ['Ava Thompson', 'Jonas Berg'], paymentsEnabled: true }, {
    services: { option: 'invoice', invoices: [
      inv({ invoiceTemplate: 'it-1', teamMembers: ['Jonas Berg'], description: 'Monthly bookkeeping', rows: [line('Monthly bookkeeping', 450, 1, { serviceId: 'svc-5', tax: true })], taxRate: 8.25 }),
      inv({ invoiceTemplate: 'it-2', teamMembers: ['Leila Nasser'], description: 'Annual tax return', issueInvoice: 'specific date', specificDate: '2027-02-15', selectedTime: '9:00 AM', rows: [line('Individual tax return (1040)', 600, 1, { serviceId: 'svc-1' })] }),
    ] },
    payments: { method: 'Credit card or bank debit', amount: 450 }, updatedAt: '2026-03-04' }),
  proposal('pt-2', { templateName: 'Personal tax engagement', proposalName: 'Your [CURRENT_YEAR] tax return', teamMembers: ['Leila Nasser'] }, {
    services: { option: 'services', itemizedData: { rows: [line('Individual tax return (1040)', 600, 1, { serviceId: 'svc-1' }), line('State tax return', 150, 1, { serviceId: 'svc-2' }), line('Returning client', 75, 1, { isDiscount: true })], taxRate: 0 } },
    updatedAt: '2026-03-20' }),
  proposal('pt-3', { templateName: 'Payroll setup', proposalName: 'Payroll services for [ACCOUNT_NAME]', teamMembers: ['Nina Petrova'], introductionEnabled: false }, {
    services: { option: 'invoice', invoices: [inv({ invoiceTemplate: 'it-4', teamMembers: ['Nina Petrova'], description: 'Bi-weekly payroll', rows: [line('Payroll processing', 120, 2, { serviceId: 'svc-7', tax: true })], taxRate: 8.25 })] },
    updatedAt: '2026-04-08' }),
  proposal('pt-4', { templateName: 'Advisory retainer', proposalName: 'Advisory retainer – [CURRENT_QUARTER]', teamMembers: ['Samuel Adeyemi'], paymentsEnabled: true }, {
    services: { option: 'invoice', invoices: [inv({ invoiceTemplate: 'it-7', teamMembers: ['Samuel Adeyemi'], description: 'Monthly advisory hours', rows: [line('Advisory hour', 175, 4, { serviceId: 'svc-9', tax: true })], taxRate: 8.25 })] },
    payments: { method: 'Credit card', amount: 700 }, updatedAt: '2026-04-22' }),
  proposal('pt-5', { templateName: 'Year-end close', proposalName: '[CURRENT_YEAR] year-end close', teamMembers: ['Jonas Berg', 'Mateo Rossi'] }, {
    services: { option: 'services', itemizedData: { rows: [line('Year-end close', 800, 1, { serviceId: 'svc-10', tax: true }), line('Bank reconciliation', 95, 3, { serviceId: 'svc-6', tax: true })], taxRate: 8.25 } },
    updatedAt: '2026-05-10' }),
  proposal('pt-6', { templateName: 'New client onboarding', proposalName: 'Welcome to Harbor, [ACCOUNT_NAME]', teamMembers: ['Ava Thompson', 'Elena Ruiz'], termsEnabled: false }, {
    services: { option: 'services', itemizedData: { rows: [line('Setup fee', 300), line('New client offer', 100, 1, { isDiscount: true })], taxRate: 0 } },
    updatedAt: '2026-05-28' }),
  proposal('pt-7', { templateName: 'Business tax return', proposalName: '[CURRENT_YEAR] business return', teamMembers: ['Leila Nasser', 'Samuel Adeyemi'] }, {
    services: { option: 'invoice', invoices: [inv({ invoiceTemplate: 'it-3', teamMembers: ['Leila Nasser'], description: 'S-corp return and state filing', rows: [line('Business tax return (1120-S)', 1200, 1, { serviceId: 'svc-3' }), line('State tax return', 150, 1, { serviceId: 'svc-2' })] })] },
    updatedAt: '2026-06-15' }),
  proposal('pt-8', { templateName: '1099 contractor filings', proposalName: '1099s for [LAST_YEAR]', teamMembers: ['Theo Laurent'], introductionEnabled: false, termsEnabled: false }, {
    services: { option: 'services', itemizedData: { rows: [line('1099 preparation', 25, 10, { serviceId: 'svc-8' })], taxRate: 0 } },
    updatedAt: '2026-07-02' }),
  proposal('pt-9', { templateName: 'Quarterly estimates plan', proposalName: 'Estimated taxes – [CURRENT_YEAR]', teamMembers: ['Leila Nasser'], paymentsEnabled: true }, {
    services: { option: 'invoice', invoices: [inv({ invoiceTemplate: 'it-5', teamMembers: ['Leila Nasser'], description: 'Four quarterly estimates', rows: [line('Quarterly tax estimates', 125, 4, { serviceId: 'svc-4' })] })] },
    payments: { method: 'Bank debit', amount: 125 }, updatedAt: '2026-08-11' }),
  proposal('pt-10', { templateName: 'Full-service annual', proposalName: '[CURRENT_YEAR] full service for [ACCOUNT_NAME]', teamMembers: ['Ava Thompson', 'Jonas Berg', 'Leila Nasser'] }, {
    services: { option: 'invoice', invoices: [
      inv({ invoiceTemplate: 'it-10', teamMembers: ['Jonas Berg'], description: 'Annual bookkeeping', rows: [line('Monthly bookkeeping', 450, 12, { serviceId: 'svc-5', tax: true }), line('Annual prepay', 400, 1, { isDiscount: true })], taxRate: 8.25 }),
      inv({ invoiceTemplate: 'it-3', teamMembers: ['Leila Nasser'], description: 'Business tax return', rows: [line('Business tax return (1120-S)', 1200, 1, { serviceId: 'svc-3' })] }),
    ] },
    updatedAt: '2026-09-25' }),
];