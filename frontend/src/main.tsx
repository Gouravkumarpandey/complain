// Import polyfill first to ensure process is defined
import './polyfills';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { LanguageProvider } from './contexts/LanguageContext';
import { I18nLoader } from './components/common/I18nLoader';
import './i18n';

// i18n is initialized when the module is imported (i18next init)

// Render the app (remove Lingui provider)
createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <I18nLoader>
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </I18nLoader>
  </StrictMode>
);
