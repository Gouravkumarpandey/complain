import React, { createContext, useState, useEffect, useContext } from 'react';
import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import { dynamicActivate, locales, defaultLocale } from '../i18n';

// Type for the language context value
type LanguageContextType = {
  locale: string;
  setLocale: (locale: string) => Promise<void>;
  availableLocales: typeof locales;
};

// Create the context with default values
const LanguageContext = createContext<LanguageContextType>({
  locale: defaultLocale,
  setLocale: async () => {},
  availableLocales: locales
});

// Custom hook to use the language context
export const useLanguage = () => useContext(LanguageContext);

// Language provider component
export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState(localStorage.getItem('language') || defaultLocale);

  // Initialize i18n on component mount
  useEffect(() => {
    console.log(`LanguageProvider: Activating locale ${locale}`);
    dynamicActivate(locale)
      .then(() => console.log(`LanguageProvider: Locale ${locale} activated successfully`))
      .catch(error => console.error(`LanguageProvider: Failed to activate locale ${locale}:`, error));
  }, [locale]);

  // Function to change the current locale
  const setLocale = async (newLocale: string) => {
    console.log(`LanguageProvider: Changing locale from ${locale} to ${newLocale}`);
    
    if (newLocale === locale) {
      console.log('LanguageProvider: Locale already active, skipping activation');
      return;
    }
    
    try {
      await dynamicActivate(newLocale);
      console.log(`LanguageProvider: Successfully activated locale ${newLocale}`);
      
      // Make sure to save to localStorage directly here as well
      try {
        localStorage.setItem('language', newLocale);
        console.log(`LanguageProvider: Saved language ${newLocale} to localStorage`);
      } catch (e) {
        console.error('LanguageProvider: Error saving to localStorage:', e);
      }
      
      // Update state after successful activation
      setLocaleState(newLocale);
      
      // Force update on page components if needed
      // Uncomment if language switching seems stuck:
      // window.dispatchEvent(new Event('languageChanged'));
    } catch (error) {
      console.error(`LanguageProvider: Failed to activate locale ${newLocale}:`, error);
    }
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, availableLocales: locales }}>
      <I18nProvider i18n={i18n}>
        {children}
      </I18nProvider>
    </LanguageContext.Provider>
  );
};

export default LanguageProvider;