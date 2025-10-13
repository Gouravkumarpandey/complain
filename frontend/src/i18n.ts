import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en/translation.json';
import hi from './locales/hi/translation.json';

// Define simple locales metadata for compatibility with previous Lingui-based code
export const locales = {
  en: { name: 'English' },
  hi: { name: 'हिन्दी' },
  fr: { name: 'Français' },
  es: { name: 'Español' },
  zh: { name: '中文' }
} as const;

export const defaultLocale = 'en';

// Initialize i18next with JSON resource files
i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi }
  },
  lng: localStorage.getItem('language') || defaultLocale,
  fallbackLng: defaultLocale,
  interpolation: { escapeValue: false }
});

// Compatibility functions to match previous APIs
export function dynamicActivate(locale: string) {
  return i18n.changeLanguage(locale).then(() => {
    try {
      localStorage.setItem('language', locale);
    } catch (e) {
      // ignore localStorage errors
    }
    document.documentElement.setAttribute('lang', locale);
    return locale;
  });
}

export function initI18n() {
  const stored = localStorage.getItem('language') || defaultLocale;
  return dynamicActivate(stored);
}

// named export for any modules importing { i18n }
export { i18n };

export default i18n;