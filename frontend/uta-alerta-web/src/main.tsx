import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
