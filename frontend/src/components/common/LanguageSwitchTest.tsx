import React from 'react';
import { Trans } from '../../i18n-compat';
import { useLanguage } from '../../contexts/LanguageContext';

const LanguageSwitchTest: React.FC = () => {
  const { locale, availableLocales } = useLanguage();
  
  // Define flag emojis for each language
  const languageFlags: Record<string, string> = {
    en: '🇬🇧',
    es: '🇪🇸',
    fr: '🇫🇷',
    hi: '🇮🇳',
    zh: '🇨🇳',
  };

  // Get the current flag
  const currentFlag = languageFlags[locale] || '🌍';
  
  return (
    <div className="p-4 bg-gray-100 rounded-md my-4">
      <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
        <span>{currentFlag}</span>
        <Trans>Language Switching Test</Trans>
      </h2>
      <p className="mb-2">
        <Trans>This is a test component to verify that language switching is working correctly.</Trans>
      </p>
      <p className="mb-2 font-semibold">
        <Trans>Current language: {locale}</Trans>
      </p>
      <p className="font-medium">
        <Trans>Try selecting a different language from the selector above to see this text change.</Trans>
      </p>
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
        <p className="text-lg font-medium">
          <Trans>Hello! Welcome to QuickFix.</Trans>
        </p>
        <p>
          <Trans>We're here to help resolve your complaints quickly and efficiently.</Trans>
        </p>
        <p className="mt-2">
          <Trans>Please select your preferred language to continue.</Trans>
        </p>
      </div>
      
      {/* Available languages display */}
      <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded">
        <p className="font-medium mb-2">Available Languages:</p>
        <div className="flex flex-wrap gap-2">
          {Object.keys(availableLocales).map(code => (
            <div 
              key={code} 
              className={`px-3 py-1.5 rounded flex items-center gap-1.5 ${
                code === locale 
                  ? 'bg-blue-100 border border-blue-300 font-medium' 
                  : 'bg-white border border-gray-200'
              }`}
            >
              <span>{languageFlags[code] || '🌍'}</span>
              <span>{availableLocales[code as keyof typeof availableLocales].name}</span>
              {code === locale && <span className="text-xs bg-blue-500 text-white px-1.5 rounded-full">Active</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LanguageSwitchTest;