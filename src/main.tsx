import '@fontsource-variable/space-grotesk';
import '@fontsource/orbitron/700.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from '@/app/App';
import '@/app/styles.css';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root container was not found');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
