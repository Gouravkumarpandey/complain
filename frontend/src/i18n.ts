import { i18n } from '@lingui/core';
import { en, es, fr, zh } from 'make-plural/plurals';

// Type definition for message modules
type MessageModule = {
  messages?: Record<string, any>;
  default?: { 
    messages?: Record<string, any> 
  };
};

// Define available locales and their data
export const locales = {
  en: {
    name: 'English',
    plurals: en
  },
  es: {
    name: 'Español',
    plurals: es
  },
  fr: {
    name: 'Français',
    plurals: fr
  },
  hi: {
    name: 'हिन्दी',
    // Hindi uses same plural rules as English for now
    plurals: en
  },
  zh: {
    name: '中文',
    plurals: zh
  }
};

// Define the default locale
export const defaultLocale = 'en';

// Initialize i18n
i18n.loadLocaleData({
  en: { plurals: locales.en.plurals },
  es: { plurals: locales.es.plurals },
  fr: { plurals: locales.fr.plurals },
  hi: { plurals: locales.hi.plurals },
  zh: { plurals: locales.zh.plurals }
});

/**
 * Load messages for the given locale and activate it
 */
export async function dynamicActivate(locale: string) {
  console.log(`Activating locale: ${locale}`);
  
  // Handle different locales
  let messages = {};
  
  try {
    // Use index.js files which contain both original messages and custom translations
    switch (locale) {
      case 'en': {
        const enModule = await import('./locales/en/index.js') as MessageModule;
        messages = enModule.messages || enModule.default?.messages || {};
        console.log('Loaded English messages:', messages);
        break;
      }
      case 'es': {
        const esModule = await import('./locales/es/index.js') as MessageModule;
        messages = esModule.messages || esModule.default?.messages || {};
        console.log('Loaded Spanish messages:', messages);
        break;
      }
      case 'fr': {
        const frModule = await import('./locales/fr/index.js') as MessageModule;
        messages = frModule.messages || frModule.default?.messages || {};
        console.log('Loaded French messages:', messages);
        break;
      }
      case 'hi': {
        const hiModule = await import('./locales/hi/index.js') as MessageModule;
        messages = hiModule.messages || hiModule.default?.messages || {};
        console.log('Loaded Hindi messages:', messages);
        break;
      }
      case 'zh': {
        const zhModule = await import('./locales/zh/index.js') as MessageModule;
        messages = zhModule.messages || zhModule.default?.messages || {};
        console.log('Loaded Chinese messages:', messages);
        break;
      }
      default:
        console.warn(`Unknown locale: ${locale}, falling back to empty messages`);
        messages = {};
    }
  } catch (error) {
    console.error(`Error loading messages for ${locale}:`, error);
    messages = {};
  }
  
  // Load and activate the locale
  i18n.load(locale, messages);
  i18n.activate(locale);
  
  // Store the selected language
  try {
    localStorage.setItem('language', locale);
    console.log(`Successfully saved language "${locale}" to localStorage`);
  } catch (error) {
    console.error('Error saving language to localStorage:', error);
  }
  document.documentElement.setAttribute('lang', locale);
  
  return messages;
}

// Initialize with the default locale
export function initI18n() {
  const storedLocale = localStorage.getItem('language') || defaultLocale;
  return dynamicActivate(storedLocale);
}