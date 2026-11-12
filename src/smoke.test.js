// Smoke test: every main page renders without crashing. Run with `npm test`.
import { renderApp } from './testUtils';

beforeAll(() => {
  localStorage.setItem('harbor.user', JSON.stringify({ email: 'test@harbor.dev', name: 'test' }));
  window.matchMedia = window.matchMedia || (() => ({ matches: true, addEventListener() {}, removeEventListener() {} }));
  window.scrollTo = () => {};
});

const routes = ['/login', '/register', '/insights', '/clients/accounts/activeaccounts', '/clients/accounts/activeaccounts/AC-1040',
  '/clients/contacts', '/tasks/pending', '/firmtemp/tags', '/settings/myaccount', '/firmtemp/templates/tasks',
  '/billing/Invoices', '/nope',
  '/firmtemp/templates', '/firmtemp/templates/tasks/new', '/firmtemp/templates/tasks/tt-1',
  ...['tasks', 'emails', 'clientfacing', 'jobs', 'chats', 'folders', 'invoices', 'proposals', 'organizers'].map((t) => `/firmtemp/templates/${t}`)];

test.each(routes)('renders %s', (url) => {
  const { container } = renderApp(url);
  expect(container.textContent.length).toBeGreaterThan(0);
  if (url.startsWith('/firmtemp/templates') && !url.startsWith('/firmtemp/templates/tasks/')) expect(container.textContent).toContain('Firm Templates');
  if (url === '/firmtemp/templates' || url === '/firmtemp/templates/tasks') expect(container.textContent).toContain('Monthly bank reconciliation');
  if (url.startsWith('/firmtemp/templates/tasks/')) expect(container.textContent).toContain('Task Template');
});
