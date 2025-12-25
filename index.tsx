
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Register Service Worker for Full Offline Support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Using a simple relative path string directly in register(). 
    // The browser automatically resolves this against the current document's URL, 
    // which avoids 'Invalid URL' construction errors and origin mismatch issues 
    // in sandboxed or iframe-based preview environments.
    navigator.serviceWorker.register('./sw.js').then((reg) => {
      console.log('Galaxy Inn POS Service Worker Registered', reg.scope);
    }).catch((err) => {
      console.error('Service Worker Registration Failed:', err);
    });
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
