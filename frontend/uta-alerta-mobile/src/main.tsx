import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// --- INYECTAR HEADER PARA NGROK EN TODAS LAS PETICIONES FETCH ---
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  const [resource, config] = args;
  const newConfig = config || {};
  newConfig.headers = {
    ...newConfig.headers,
    'ngrok-skip-browser-warning': 'true',
    'Bypass-Tunnel-Reminder': 'true'
  };
  return originalFetch(resource, newConfig);
};
// -------------------------------------------------------------

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);