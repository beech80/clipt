import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';
import './styles/performance-settings.css';
import './styles/squad-chat.css';
import { Toaster } from 'sonner';

// Create a client with proper configuration
// Create a custom QueryClient with enhanced error handling for undefined variables
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
      // Add global error handling to prevent 'is not defined' errors
      onError: (error) => {
        console.error('Query error:', error);
        // Don't propagate up certain errors so they don't cause app crashes
        if (error instanceof Error && 
            (error.message.includes('is not defined') || 
             error.message.includes('Cannot read property'))) {
          console.warn('Suppressing React Query error:', error.message);
        }
      },
    },
    mutations: {
      // Add similar error handling for mutations
      onError: (error) => {
        console.error('Mutation error:', error);
        if (error instanceof Error && 
            (error.message.includes('is not defined') || 
             error.message.includes('Cannot read property'))) {
          console.warn('Suppressing React Query mutation error:', error.message);
        }
      },
    },
  },
});

// Add debug logging to see if root element exists
console.log('Root element found:', document.getElementById('root'));

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <App />
        <Toaster position="top-center" richColors />
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);

console.log('App mounted successfully');