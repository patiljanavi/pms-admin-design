// Sample data used until you connect a backend.
// Replace these exports with API calls; the pages don't need to change.

/* ---------- Team members & tags ---------- */
export const TEAM_MEMBERS = [
  { value: 'u-ava', label: 'Ava Thompson', meta: 'Account manager' },
  { value: 'u-jonas', label: 'Jonas Berg', meta: 'Senior accountant' },
  { value: 'u-leila', label: 'Leila Nasser', meta: 'Tax specialist' },
  { value: 'u-mateo', label: 'Mateo Rossi', meta: 'Bookkeeper' },
  { value: 'u-nina', label: 'Nina Petrova', meta: 'Payroll lead' },
  { value: 'u-samuel', label: 'Samuel Adeyemi', meta: 'Partner' },
  { value: 'u-elena', label: 'Elena Ruiz', meta: 'Client success' },
  { value: 'u-theo', label: 'Theo Laurent', meta: 'Junior accountant' },
];

// Starting tags. `color` is any hex colour; chips pick black or white text automatically.
export const DEFAULT_TAGS = [
  { value: 'vip', label: 'VIP', color: '#5B3CC4', createdAt: '2026-01-12' },
  { value: 'priority', label: 'Priority', color: '#A3261B', createdAt: '2026-01-12' },
  { value: 'onboarding', label: 'Onboarding', color: '#A16207', createdAt: '2026-02-03' },
  { value: 'tax', label: 'Tax', color: '#1D4ED8', createdAt: '2026-02-03' },
  { value: 'bookkeeping', label: 'Bookkeeping', color: '#17633A', createdAt: '2026-03-18' },
  { value: 'payroll', label: 'Payroll', color: '#0E7490', createdAt: '2026-04-09' },
  { value: 'audit', label: 'Audit', color: '#C2410C', createdAt: '2026-05-21' },
  { value: 'new-client', label: 'New client', color: '#BE185D', createdAt: '2026-06-30' },
  { value: 'dormant', label: 'Dormant', color: '#475569', createdAt: '2026-08-14' },
];
export const DEFAULT_CLIENT_FACING_JOBS = [
  { value: 'cfj-1', label: 'Website redesign', color: '#5B3CC4', description: 'Redesign the client website for better UX.', createdAt: '2026-01-12' },
  { value: 'cfj-2', label: 'Mobile app launch', color: '#A3261B', description: 'Launch the new mobile application for iOS and Android.', createdAt: '2026-02-03' },
  { value: 'cfj-3', label: 'Marketing campaign', color: '#A16207', description: 'Plan and execute a marketing campaign for the new product.', createdAt: '2026-03-18' },
  { value: 'cfj-4', label: 'Data migration', color: '#1D4ED8', description: 'Migrate client data to the new CRM system.', createdAt: '2026-04-09' },
];
/* ---------- Accounts ---------- */
const names = ['Amara Okafor','Lucas Bennett','Priya Raman','Diego Alvarez','Sofia Lindqvist','Kenji Watanabe','Hannah Weiss','Omar Haddad','Chloe Martin','Rafael Costa','Mei Chen','Noah Fischer','Zara Ahmed','Ethan Brooks','Isla Murphy','Mateo Rossi','Leila Nasser','Jonas Berg','Ava Thompson','Yusuf Demir','Nina Petrova','Samuel Adeyemi','Elena Ruiz','Theo Laurent'];
const companies = ['Northwind','Bluepeak','Lumen Labs','Orchard Co','Vertex','Kitebird'];
const roles = ['Admin','Editor','Viewer'];
const statuses = ['Active','Active','Pending','Active','Suspended'];
const plans = ['Starter','Pro','Enterprise'];
const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep'];

export const PLAN_PRICE = { Starter: 29, Pro: 99, Enterprise: 499 };
export const PLAN_SEATS = { Starter: [3, 5], Pro: [14, 25], Enterprise: [62, 100] };


const domain = (i) => `${companies[i % 6].toLowerCase().replace(/\s/g, '')}.com`;
const second = ['finance', 'ops', 'accounts', 'admin'];
const suffix = ['Holdings', 'Group', 'Partners', 'LLC', 'Ventures', '& Co'];

export const seedAccounts = names.map((name, i) => {
  const [first, last] = name.split(' ');
  const email = `${first.toLowerCase()}@${domain(i)}`;
  // Sample team members (1–3) and tags (0–3), picked deterministically
  const team = [TEAM_MEMBERS[i % 8], TEAM_MEMBERS[(i + 3) % 8], TEAM_MEMBERS[(i + 5) % 8]].slice(0, 1 + (i % 3)).map((m) => m.label);
  const tags = [DEFAULT_TAGS[i % 8], DEFAULT_TAGS[(i + 2) % 8], DEFAULT_TAGS[(i + 5) % 8]].slice(0, i % 4).map((t) => t.value); // tag ids
  const contacts = [{ id: `c-${i}-1`, firstName: first, lastName: last, email, phone: '', role: 'Owner', primary: true }];
  if (i % 2 === 0) contacts.push({ id: `c-${i}-2`, firstName: 'Accounts', lastName: 'team', email: `${second[i % 4]}@${domain(i)}`, phone: '', role: 'Finance', primary: false });
  return {
    id: `AC-${1040 + i}`,
    name: `${last} ${suffix[i % 6]}`,         // account name
    owner: name,                               // primary contact's name
    email,
    company: companies[i % 6],
    team,
    tags,
    contacts,
    // Kept for billing, the drawer and Insights (not shown in the table)
    role: roles[i % 3],
    status: statuses[i % 5],
    plan: plans[(i * 2) % 3],
    joined: `${months[i % 9]} ${3 + i}, 2026`,
  };
});

/* ---------- Tasks (Kanban) ---------- */
export const COLUMNS = [
  { key: 'todo', label: 'To do', dot: 'bg-[#9AA4B2]' },
  { key: 'doing', label: 'In progress', dot: 'bg-brand-600' },
  { key: 'review', label: 'Review', dot: 'bg-[#B86E00]' },
  { key: 'done', label: 'Done', dot: 'bg-success-700' },
];

export const seedTasks = [
  ['Migrate billing exports', 'Billing', 'High', 'todo', 'Amara Okafor', 'Oct 14'],
  ['Review enterprise contract', 'Sales', 'Medium', 'todo', 'Priya Raman', 'Oct 16'],
  ['Fix invoice PDF layout', 'Bug', 'High', 'todo', 'Sofia Lindqvist', 'Oct 12'],
  ['Onboard Bluepeak team', 'Onboarding', 'Low', 'doing', 'Lucas Bennett', 'Oct 10'],
  ['Role permissions audit', 'Security', 'High', 'doing', 'Hannah Weiss', 'Oct 11'],
  ['Update plan pricing page', 'Marketing', 'Medium', 'doing', 'Chloe Martin', 'Oct 18'],
  ['Two-factor rollout', 'Security', 'Medium', 'review', 'Kenji Watanabe', 'Oct 9'],
  ['Weekly report template', 'Reports', 'Low', 'review', 'Diego Alvarez', 'Oct 13'],
  ['Archive suspended accounts', 'Ops', 'Low', 'done', 'Omar Haddad', 'Oct 2'],
  ['Payment method validation', 'Billing', 'Medium', 'done', 'Rafael Costa', 'Oct 3'],
].map(([title, tag, priority, col, who, due], i) => ({ id: `T-${101 + i}`, title, tag, priority, col, who, due }));

/* ---------- Contacts ---------- */
// Sample people (one per account). Phone numbers use the fictional 555 range.
const PLACES = [
  { country: 'US', city: 'New York', state: 'NY', zip: '10001', street: '120 Market Street' },
  { country: 'GB', city: 'London', state: 'Greater London', zip: 'EC1A 1BB', street: '8 King’s Road' },
  { country: 'IN', city: 'Mumbai', state: 'Maharashtra', zip: '400001', street: '21 Marine Drive' },
  { country: 'CA', city: 'Toronto', state: 'ON', zip: 'M5H 2N2', street: '45 Bay Street' },
  { country: 'AU', city: 'Sydney', state: 'NSW', zip: '2000', street: '3 George Street' },
  { country: 'DE', city: 'Berlin', state: 'Berlin', zip: '10115', street: 'Invalidenstraße 12' },
  { country: 'AE', city: 'Dubai', state: 'Dubai', zip: '', street: 'Sheikh Zayed Road, Tower 4' },
  { country: 'SG', city: 'Singapore', state: '', zip: '018956', street: '10 Marina Boulevard' },
];
const MIDDLE = ['', 'J.', '', 'Marie', '', '', 'Lee', ''];
const joinName = (...parts) => parts.filter(Boolean).join(' ');

export const seedContacts = seedAccounts.map((a, i) => {
  const [firstName, lastName] = a.owner.split(' ');
  const middleName = MIDDLE[i % 8];
  const place = PLACES[i % 8];
  const phones = [{ id: `ph-${i}-1`, country: place.country, number: `555 01${String(10 + i).padStart(2, '0')}`, type: 'Mobile', primary: true }];
  if (i % 3 === 0) phones.push({ id: `ph-${i}-2`, country: place.country, number: `555 02${String(10 + i).padStart(2, '0')}`, type: 'Work', primary: false });
  return {
    id: `CT-${1100 + i}`,
    firstName, middleName, lastName,
    contactName: joinName(firstName, middleName, lastName),
    company: a.company,
    email: a.email,
    tags: a.tags.slice(0, 2),
    phones,
    address: { ...place },
    note: '',
    createdAt: `2026-${String(1 + (i % 9)).padStart(2, '0')}-${String(3 + (i % 25)).padStart(2, '0')}`,
  };
});
