// Smoke test: every main page renders without crashing. Run with `npm test`.
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { AppearanceProvider } from './context/AppearanceContext';

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
  const { container } = render(
    <MemoryRouter initialEntries={[url]}>
      <AppearanceProvider><AuthProvider><DataProvider><App /></DataProvider></AuthProvider></AppearanceProvider>
    </MemoryRouter>,
  );
  expect(container.textContent.length).toBeGreaterThan(0);
  if (url.startsWith('/firmtemp/templates') && !url.startsWith('/firmtemp/templates/tasks/')) expect(container.textContent).toContain('Firm Templates');
  if (url === '/firmtemp/templates' || url === '/firmtemp/templates/tasks') expect(container.textContent).toContain('Monthly bank reconciliation');
  if (url.startsWith('/firmtemp/templates/tasks/')) expect(container.textContent).toContain('Task Template');
});
