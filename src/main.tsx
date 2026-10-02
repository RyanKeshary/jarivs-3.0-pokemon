import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

/**
 * Query defaults tuned for a mostly-static, admin-editable page.
 *
 * `refetchOnWindowFocus` is off because the realtime subscription already
 * delivers every change to this data; refetching on tab focus would be a second
 * mechanism doing the same job and would cost a request each time someone
 * alt-tabs while reading.
*/
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 60_000,
      retry: 2,
    },
  },
});

const container = document.getElementById('root');
if (!container) throw new Error('Missing #root element in index.html');

createRoot(container).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);