// React import not required with the new JSX transform
// Trans removed after migration
import { i18n } from '../../i18n';
import { LanguageSelector, LanguageDropdown } from './LanguageSelector';
import LanguageSwitchTest from './LanguageSwitchTest';

export function LanguageSwitchInstructions() {
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">
        {i18n.t('how_to_change_language')}
      </h1>
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">
          {i18n.t('option_1_using_the_language_selector_in_the_navigation_bar')}
        </h2>
        <div className="flex items-center gap-4 mb-4">
          <p className="text-gray-700">
            {i18n.t('click_on_the_language_selector_in_the_navigation_bar')}
          </p>
          <div className="border border-gray-200 rounded p-2 bg-gray-50">
            <LanguageSelector />
          </div>
        </div>
        <p className="text-gray-700 mb-4">
          {i18n.t('select_your_preferred_language_from_the_dropdown_list')}
        </p>
      </div>
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">
          {i18n.t('option_2_using_the_language_dropdown')}
        </h2>
        <div className="flex items-center gap-4 mb-4">
          <p className="text-gray-700">
            {i18n.t('click_on_the_language_dropdown_button')}
          </p>
          <div className="border border-gray-200 rounded p-2 bg-gray-50">
            <LanguageDropdown />
          </div>
        </div>
        <p className="text-gray-700 mb-4">
          {i18n.t('choose_your_language_from_the_expanded_list')}
        </p>
      </div>
      
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">
          {i18n.t('available_languages')}
        </h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>{i18n.t('english_en')}</li>
          <li>{i18n.t('espa_ol_spanish_es')}</li>
          <li>{i18n.t('fran_ais_french_fr')}</li>
          <li>{i18n.t('hindi_hi')}</li>
          <li>{i18n.t('chinese_zh')}</li>
        </ul>
      </div>
      
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-blue-800">
          {i18n.t('note_your_language_preference_will_be_saved_and_remembered_t')}
        </p>
      </div>
      
      {/* Add the language switch test component */}
      <LanguageSwitchTest />
    </div>
  );
}

export default LanguageSwitchInstructions;