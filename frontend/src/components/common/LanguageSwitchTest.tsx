import React from 'react';
import { i18n } from '../../i18n';
// Trans removed after migration
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
        {i18n.t('language_switching_test')}
      </h2>
      <p className="mb-2">
        {i18n.t('this_is_a_test_component_to_verify_that_language_switching_i')}
      </p>
      <p className="mb-2 font-semibold">
        {i18n.t('current_language_locale')}
      </p>
      <p className="font-medium">
        {i18n.t('try_selecting_a_different_language_from_the_selector_above_t')}
      </p>
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
        <p className="text-lg font-medium">
          {i18n.t('hello_welcome_to_quickfix')}
        </p>
        <p>
          {i18n.t('we_re_here_to_help_resolve_your_complaints_quickly_and_effic')}
        </p>
        <p className="mt-2">
          {i18n.t('please_select_your_preferred_language_to_continue')}
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