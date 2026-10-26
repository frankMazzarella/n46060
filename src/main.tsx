import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './view/App';
import './view/styles/tokens.css';
import './view/styles/base.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Missing #root element in index.html');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
