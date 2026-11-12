// Renders the whole app at a URL with the same providers as src/index.js.
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { AppearanceProvider } from './context/AppearanceContext';
import { TooltipProvider } from './components/ui/tooltip';
import { Toaster } from './components/ui/sonner';

export function Providers({ children }) {
  return (
    <AppearanceProvider>
      <TooltipProvider>
        <AuthProvider><DataProvider>{children}<Toaster /></DataProvider></AuthProvider>
      </TooltipProvider>
    </AppearanceProvider>
  );
}

export const renderApp = (url) => render(<MemoryRouter initialEntries={[url]}><Providers><App /></Providers></MemoryRouter>);
