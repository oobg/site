import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initApp } from './app/init';
import { App } from './app/App';
import './index.css';

initApp();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

