import { createRoot } from 'react-dom/client';
import { setBaseUrl } from '@workspace/api-client-react';

import App from './App';

import './index.css';

// Allow the production API URL to be injected at build time.
// On Vercel set VITE_API_URL to the API server's origin (e.g. https://your-api.vercel.app).
// When not set the client uses relative paths (/api/...) which works when the
// API serverless function is deployed in the same Vercel project.
const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
if (apiUrl) {
  setBaseUrl(apiUrl);
}

createRoot(document.getElementById('root')!).render(<App />);
