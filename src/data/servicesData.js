// Dummy data for the Services page. Replace with API data later.

export const RATE_TYPES = [
  { label: 'Item', value: 'item' },
  { label: 'Hour', value: 'hour' },
];

// Shown after the amount in lists, e.g. $95.00/hr
export const RATE_SUFFIX = { item: '/item', hour: '/hr' };

export const SEED_CATEGORIES = [
  { id: 'cat-1', name: 'Tax Preparation', description: 'Individual and business tax returns' },
  { id: 'cat-2', name: 'Bookkeeping', description: 'Monthly books, reconciliations and cleanup' },
  { id: 'cat-3', name: 'Payroll', description: 'Payroll runs, filings and year-end forms' },
  { id: 'cat-4', name: 'Advisory', description: 'Planning, consulting and CFO services' },
  { id: 'cat-5', name: 'Audit & Assurance', description: 'Reviews, compilations and audits' },
  { id: 'cat-6', name: 'Sales Tax', description: 'Sales and use tax registration and filings' },
  { id: 'cat-7', name: 'Business Formation', description: 'Entity setup, EIN and state registrations' },
  { id: 'cat-8', name: 'Tax Resolution', description: 'IRS notices, payment plans and representation' },
  { id: 'cat-9', name: 'Estate & Trust', description: 'Fiduciary returns and estate planning support' },
  { id: 'cat-10', name: 'Administrative', description: 'Notary, copies and other small services' },
  { id: 'cat-11', name: 'Nonprofit', description: 'Form 990 filings and nonprofit compliance' },
  { id: 'cat-12', name: 'International Tax', description: 'Foreign income, FBAR and treaty filings' },
  { id: 'cat-13', name: 'Real Estate', description: 'Rental property, 1031 exchanges and depreciation' },
  { id: 'cat-14', name: 'Retirement Planning', description: 'Contributions, rollovers and distribution planning' },
  { id: 'cat-15', name: 'Software Setup', description: 'Accounting software setup and training' },
  { id: 'cat-16', name: 'Compliance', description: 'Annual reports, licenses and state filings' },
  { id: 'cat-17', name: 'Forensic Accounting', description: 'Fraud review and litigation support' },
  { id: 'cat-18', name: 'Valuation', description: 'Business and asset valuations' },
  { id: 'cat-19', name: 'Budgeting & Forecasting', description: 'Annual budgets and rolling forecasts' },
  { id: 'cat-20', name: 'Training', description: 'Workshops and one-on-one client training' },
];

export const SEED_SERVICES = [
  { id: 'svc-1', name: 'Individual Tax Return (1040)', description: 'Federal and one state return, including schedules A–E.', rate: '450.00', rateType: 'item', tax: false, categoryId: 'cat-1' },
  { id: 'svc-2', name: 'S-Corp Tax Return (1120-S)', description: 'Business return with K-1s for up to three shareholders.', rate: '1250.00', rateType: 'item', tax: false, categoryId: 'cat-1' },
  { id: 'svc-3', name: 'Monthly Bookkeeping', description: 'Categorize transactions, reconcile accounts and send monthly reports.', rate: '600.00', rateType: 'item', tax: true, categoryId: 'cat-2' },
  { id: 'svc-4', name: 'Catch-up Bookkeeping', description: 'Clean up prior months of unreconciled books.', rate: '95.00', rateType: 'hour', tax: true, categoryId: 'cat-2' },
  { id: 'svc-5', name: 'Payroll Processing', description: 'Payroll run with direct deposit and quarterly filings, per employee.', rate: '12.00', rateType: 'item', tax: true, categoryId: 'cat-3' },
  { id: 'svc-6', name: 'Fractional CFO', description: 'Cash-flow forecasting, budgeting and strategy calls.', rate: '225.00', rateType: 'hour', tax: false, categoryId: 'cat-4' },
  { id: 'svc-7', name: 'Financial Statement Review', description: 'Limited-assurance review of annual statements.', rate: '4800.00', rateType: 'item', tax: false, categoryId: 'cat-5' },
  { id: 'svc-8', name: 'Sales Tax Filing', description: 'Monthly or quarterly sales tax return for one state.', rate: '150.00', rateType: 'item', tax: true, categoryId: 'cat-6' },
  { id: 'svc-9', name: 'IRS Notice Response', description: 'Review the notice and prepare a written response.', rate: '175.00', rateType: 'hour', tax: false, categoryId: 'cat-8' },
  { id: 'svc-10', name: 'Notary Service', description: 'Notarize one document.', rate: '25.00', rateType: 'item', tax: false, categoryId: 'cat-10' },
  { id: 'svc-11', name: 'Nonprofit Return (990)', description: 'Annual Form 990 with public support schedules.', rate: '1800.00', rateType: 'item', tax: false, categoryId: 'cat-11' },
  { id: 'svc-12', name: 'FBAR Filing', description: 'Report of foreign bank and financial accounts.', rate: '200.00', rateType: 'item', tax: false, categoryId: 'cat-12' },
  { id: 'svc-13', name: 'Rental Property Schedule', description: 'Schedule E for one rental property, with depreciation.', rate: '175.00', rateType: 'item', tax: false, categoryId: 'cat-13' },
  { id: 'svc-14', name: 'Retirement Planning Session', description: 'Review accounts and plan contributions and withdrawals.', rate: '160.00', rateType: 'hour', tax: false, categoryId: 'cat-14' },
  { id: 'svc-15', name: 'QuickBooks Setup', description: 'Chart of accounts, bank feeds and opening balances.', rate: '850.00', rateType: 'item', tax: true, categoryId: 'cat-15' },
  { id: 'svc-16', name: 'Annual Report Filing', description: 'State annual report for one entity.', rate: '125.00', rateType: 'item', tax: true, categoryId: 'cat-16' },
  { id: 'svc-17', name: 'Fraud Investigation', description: 'Trace transactions and prepare findings.', rate: '275.00', rateType: 'hour', tax: false, categoryId: 'cat-17' },
  { id: 'svc-18', name: 'Business Valuation', description: 'Valuation report for a small business.', rate: '6500.00', rateType: 'item', tax: false, categoryId: 'cat-18' },
  { id: 'svc-19', name: 'Annual Budget Build', description: '12-month budget with monthly targets.', rate: '140.00', rateType: 'hour', tax: false, categoryId: 'cat-19' },
  { id: 'svc-20', name: 'Client Software Training', description: 'Hands-on training for the client’s team.', rate: '110.00', rateType: 'hour', tax: true, categoryId: 'cat-20' },
];