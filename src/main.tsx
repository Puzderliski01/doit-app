import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import { HouseProvider } from './house/store';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <HouseProvider>
        <App />
      </HouseProvider>
    </ErrorBoundary>
  </StrictMode>,
);
