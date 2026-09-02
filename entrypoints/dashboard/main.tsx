import React from 'react';
import ReactDOM from 'react-dom/client';
import DashboardApp from './DashboardApp.tsx';
import { ErrorBoundary } from '../sidepanel/components/ErrorBoundary.tsx';
import '../sidepanel/style.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <DashboardApp />
    </ErrorBoundary>
  </React.StrictMode>,
);
