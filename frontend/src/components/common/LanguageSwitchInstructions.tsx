import React from 'react';
import { Trans } from '@lingui/macro';
import { LanguageSelector, LanguageDropdown } from './LanguageSelector';
import LanguageSwitchTest from './LanguageSwitchTest';

export function LanguageSwitchInstructions() {
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">
        <Trans>How to Change Language</Trans>
      </h1>
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">
          <Trans>Option 1: Using the Language Selector in the Navigation Bar</Trans>
        </h2>
        <div className="flex items-center gap-4 mb-4">
          <p className="text-gray-700">
            <Trans>Click on the language selector in the navigation bar:</Trans>
          </p>
          <div className="border border-gray-200 rounded p-2 bg-gray-50">
            <LanguageSelector />
          </div>
        </div>
        <p className="text-gray-700 mb-4">
          <Trans>Select your preferred language from the dropdown list.</Trans>
        </p>
      </div>
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">
          <Trans>Option 2: Using the Language Dropdown</Trans>
        </h2>
        <div className="flex items-center gap-4 mb-4">
          <p className="text-gray-700">
            <Trans>Click on the language dropdown button:</Trans>
          </p>
          <div className="border border-gray-200 rounded p-2 bg-gray-50">
            <LanguageDropdown />
          </div>
        </div>
        <p className="text-gray-700 mb-4">
          <Trans>Choose your language from the expanded list.</Trans>
        </p>
      </div>
      
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">
          <Trans>Available Languages</Trans>
        </h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><Trans>English (en)</Trans></li>
          <li><Trans>Español - Spanish (es)</Trans></li>
          <li><Trans>Français - French (fr)</Trans></li>
          <li><Trans>हिन्दी - Hindi (hi)</Trans></li>
          <li><Trans>中文 - Chinese (zh)</Trans></li>
        </ul>
      </div>
      
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-blue-800">
          <Trans>
            Note: Your language preference will be saved and remembered the next time you visit the application.
          </Trans>
        </p>
      </div>
      
      {/* Add the language switch test component */}
      <LanguageSwitchTest />
    </div>
  );
}

export default LanguageSwitchInstructions;