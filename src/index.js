import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { AppearanceProvider } from './context/AppearanceContext';
import { TooltipProvider } from './components/ui/tooltip';
import { Toaster } from './components/ui/sonner';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppearanceProvider>
        <TooltipProvider delayDuration={300} skipDelayDuration={150}>
          <AuthProvider>
            <DataProvider>
              <App />
              <Toaster />
            </DataProvider>
          </AuthProvider>
        </TooltipProvider>
      </AppearanceProvider>
    </BrowserRouter>
  </React.StrictMode>
);
