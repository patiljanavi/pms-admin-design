// Firm Templates: task template table + create / edit page, other tabs, tab bar.
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import InvoiceTemplates from './pages/firmTemplates/Invoice/InvoiceTemplates';
import { Providers, renderApp } from './testUtils';

beforeAll(() => {
  localStorage.setItem('harbor.user', JSON.stringify({ email: 'test@harbor.dev', name: 'test' }));
  window.matchMedia = window.matchMedia || (() => ({ matches: true, addEventListener() {}, removeEventListener() {} }));
  window.scrollTo = () => {};
});

const app = renderApp;

test('task templates: create with assignees, tags and subtasks, then Save & Exit', async () => {
  app('/firmtemp/templates/tasks');
  expect(screen.getByText('Monthly bank reconciliation')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: '+ New task template' }));
  expect(screen.getByRole('heading', { name: 'Create Task Template' })).toBeTruthy();

  // validation
  fireEvent.click(screen.getByRole('button', { name: 'Save & Exit' }));
  expect(screen.getByText('Template name is required.')).toBeTruthy();

  fireEvent.change(screen.getByPlaceholderText('Enter template name'), { target: { value: 'Quarterly VAT return' } });
  fireEvent.click(screen.getByRole('radio', { name: 'Urgent' }));

  // assignees (team members multi-select)
  fireEvent.focus(screen.getByPlaceholderText('Select assignees'));
  fireEvent.click(screen.getByRole('option', { name: /Leila Nasser/ }));
  // tags (tag multi-select)
  fireEvent.focus(screen.getByPlaceholderText('Select or search tags'));
  fireEvent.click(screen.getByRole('option', { name: 'Tax' }));

  // subtasks
  fireEvent.click(screen.getByRole('switch', { name: 'Enable subtasks' }));
  fireEvent.change(screen.getByLabelText('Subtask 1'), { target: { value: 'Collect invoices' } });
  fireEvent.click(screen.getByRole('button', { name: 'Add subtask' }));
  fireEvent.change(screen.getByLabelText('Subtask 2'), { target: { value: 'File return' } });
  fireEvent.click(screen.getByRole('button', { name: 'Move subtask 2 up' }));
  expect(screen.getByLabelText('Subtask 1').value).toBe('File return');

  fireEvent.click(screen.getByRole('button', { name: 'Save & Exit' }));
  expect(await screen.findByText('Created “Quarterly VAT return”')).toBeTruthy();
  const row = screen.getByText('Quarterly VAT return').closest('tr');
  expect(within(row).getByText('Urgent')).toBeTruthy();
  expect(within(row).getByText('Tax')).toBeTruthy();
  expect(within(row).getByText('2 items')).toBeTruthy();
}, 20000);

test('task templates: edit and Save stays on the page; absolute dates', async () => {
  app('/firmtemp/templates/tasks/tt-3');
  expect(screen.getByRole('heading', { name: 'Edit Task Template' })).toBeTruthy();
  expect(screen.getByDisplayValue('Payroll run review')).toBeTruthy();
  fireEvent.click(screen.getByRole('switch', { name: 'Use absolute dates' }));
  fireEvent.change(screen.getByLabelText('Start Date'), { target: { value: '2026-11-10' } });
  fireEvent.change(screen.getByLabelText(/^Due Date/), { target: { value: '2026-11-01' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  expect(screen.getByText('Due date must be on or after the start date.')).toBeTruthy();
  fireEvent.change(screen.getByLabelText(/^Due Date/), { target: { value: '2026-11-20' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  expect(await screen.findByText('Saved “Payroll run review”')).toBeTruthy();
  expect(screen.getByRole('heading', { name: 'Edit Task Template' })).toBeTruthy(); // still on the form
});

test('task templates: filter and bulk delete', () => {
  app('/firmtemp/templates/tasks');
  fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'Inactive' } });
  expect(screen.getByText('Archive closed engagements')).toBeTruthy();
  expect(screen.queryByText('Payroll run review')).toBeNull();
  fireEvent.click(screen.getByLabelText('Select Archive closed engagements'));
  fireEvent.click(within(screen.getByRole('region', { name: 'Selected rows' })).getByRole('button', { name: /Delete/ }));
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }));
  expect(screen.queryByText('Archive closed engagements')).toBeNull();
});

test('other tabs keep working; phone dropdown switches tabs', () => {
  app('/firmtemp/templates/tasks');
  fireEvent.change(screen.getByLabelText('Template type'), { target: { value: '/firmtemp/templates/emails' } });
  expect(screen.getByText('Email templates')).toBeTruthy();
  expect(screen.getByRole('link', { name: 'Emails' }).getAttribute('aria-current')).toBe('page');
});

test('invoice totals are formatted', () => {
  render(<MemoryRouter><Providers><Routes><Route path="/" element={<InvoiceTemplates />} /></Routes></Providers></MemoryRouter>);
  expect(screen.getByText('$570')).toBeTruthy();
});
