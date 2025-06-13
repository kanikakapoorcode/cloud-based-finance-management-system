import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';
import { TransactionProvider } from './contexts/TransactionContext';

// Add error handling
const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('Root element not found!');
} else {
  console.log('Root element found, attempting to render app...');
  
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <BrowserRouter>
          <AuthProvider>
            <TransactionProvider>
              <App />
            </TransactionProvider>
          </AuthProvider>
        </BrowserRouter>
      </React.StrictMode>
    );
    console.log('App rendered successfully');
  } catch (error) {
    console.error('Error rendering the app:', error);
    
    // Fallback content if the app fails to render
    rootElement.innerHTML = `
      <div style="padding: 20px; font-family: Arial, sans-serif;">
        <h1>Something went wrong</h1>
        <p>The application encountered an error. Please check the console for details.</p>
        <pre style="background: #f5f5f5; padding: 10px; border-radius: 5px;">${error?.message || 'Unknown error'}</pre>
      </div>
    `;
  }
}