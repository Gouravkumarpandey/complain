import React from 'react';
import { i18n } from '../../i18n';
// Trans removed after full migration
import { useLanguage } from '../../contexts/LanguageContext';

type LanguageInfo = {
  code: string;
  name: string;
  flag: string;
};

const languages: LanguageInfo[] = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'zh', name: '中文', flag: '🇨🇳' }
];

export function HomeLangSwitcher() {
  const { locale, setLocale } = useLanguage();
  const [isChanging, setIsChanging] = React.useState(false);
  
  const handleLanguageChange = async (langCode: string) => {
    if (langCode === locale) return;
    
    setIsChanging(true);
    try {
      await setLocale(langCode);
      console.log(`Language changed to: ${langCode}`);
    } catch (error) {
      console.error(`Error changing language to ${langCode}:`, error);
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6">
          <h1 className="text-3xl font-bold text-white">
            {i18n.t('welcome_to_quickfix')}
          </h1>
          <p className="text-blue-100 mt-2">
            {i18n.t('ai_powered_complaint_resolution_system')}
          </p>
        </div>
        
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {i18n.t('choose_your_language')}
          </h2>
          
          <div className="flex flex-wrap gap-3 mb-8">
            {languages.map(lang => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                disabled={isChanging}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
                  locale === lang.code
                    ? 'bg-blue-100 border-2 border-blue-500 text-blue-700 font-medium'
                    : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                <span className="text-xl">{lang.flag}</span>
                <span>{lang.name}</span>
                {locale === lang.code && (
                  <span className="inline-block w-2 h-2 bg-blue-500 rounded-full ml-1"></span>
                )}
              </button>
            ))}
          </div>
          
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-3">
              {i18n.t('translated_content_demo')}
            </h3>
            <p className="mb-2">
              {i18n.t('hello_welcome_to_quickfix_where_we_make_resolving_your_compl')}
            </p>
            <p>
              {i18n.t('our_ai_powered_system_helps_route_your_concerns_to_the_right')}
            </p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd"></path>
              </svg>
              <h4 className="font-medium text-blue-800">
                {i18n.t('current_language')}: {locale}
              </h4>
            </div>
            <p className="text-blue-700 text-sm">
              {i18n.t('your_language_preference_will_be_saved_for_your_next_visit_y')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomeLangSwitcher;