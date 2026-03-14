/**
 * main.tsx
 * 
 * Main entry point for the React application. Mounts the root `App` component
 * to the DOM inside `<StrictMode>` and imports global CSS.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
