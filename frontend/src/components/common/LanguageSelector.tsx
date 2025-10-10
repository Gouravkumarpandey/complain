import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Globe } from 'lucide-react';

interface LanguageSelectorProps {
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ className = '' }) => {
  const { locale, setLocale, availableLocales } = useLanguage();
  
  const handleLanguageChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedLocale = event.target.value;
    console.log(`LanguageSelector: Language selected: ${selectedLocale}`);
    
    // Add a visual indicator that something is happening
    event.target.classList.add('opacity-50');
    
    try {
      // Force save to localStorage immediately
      localStorage.setItem('language', selectedLocale);
      
      // Update through context
      await setLocale(selectedLocale);
      console.log(`LanguageSelector: Language changed to: ${selectedLocale}`);
      
      // Try forcing a reload to ensure the new language is applied everywhere
      // Uncommenting this might help if the language isn't changing
      window.location.reload();
    } catch (error) {
      console.error(`LanguageSelector: Error changing language to ${selectedLocale}:`, error);
    } finally {
      event.target.classList.remove('opacity-50');
    }
  };
  
  return (
    <div className={`flex items-center ${className}`}>
      <Globe className="w-4 h-4 mr-1 text-gray-600" />
      <select
        value={locale}
        onChange={handleLanguageChange}
        className="appearance-none bg-transparent border-none text-sm text-gray-600 focus:outline-none cursor-pointer"
        aria-label="Select language"
      >
        {Object.entries(availableLocales).map(([code, { name }]) => (
          <option key={code} value={code}>
            {name}
          </option>
        ))}
      </select>
    </div>
  );
};

// Dropdown style language selector
export const LanguageDropdown: React.FC<LanguageSelectorProps> = ({ className = '' }) => {
  const { locale, setLocale, availableLocales } = useLanguage();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isChanging, setIsChanging] = React.useState(false);
  
  const toggleDropdown = () => setIsOpen(!isOpen);
  
  const selectLanguage = async (code: string) => {
    if (code === locale) {
      setIsOpen(false);
      return;
    }
    
    console.log(`LanguageDropdown: Language selected: ${code}`);
    setIsChanging(true);
    
    try {
      // Force save to localStorage immediately
      localStorage.setItem('language', code);
      
      // Update through context
      await setLocale(code);
      console.log(`LanguageDropdown: Language changed to: ${code}`);
      
      // Force a reload to ensure the new language is applied everywhere
      window.location.reload();
    } catch (error) {
      console.error(`LanguageDropdown: Error changing language to ${code}:`, error);
    } finally {
      setIsChanging(false);
      setIsOpen(false);
    }
  };
  
  return (
    <div className={`relative ${className}`}>
      <button 
        onClick={toggleDropdown}
        disabled={isChanging}
        className={`flex items-center justify-between px-3 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-md ${
          isChanging ? 'opacity-75 cursor-not-allowed' : 'hover:bg-gray-50'
        }`}
      >
        {isChanging ? (
          <span className="w-4 h-4 mr-2 border-2 border-t-blue-500 border-blue-200 rounded-full animate-spin"></span>
        ) : (
          <Globe className="w-4 h-4 mr-2 text-gray-600" />
        )}
        <span>{locale in availableLocales ? availableLocales[locale as keyof typeof availableLocales].name : 'Language'}</span>
        <span className="ml-2">▼</span>
      </button>
      
      {isOpen && (
        <div className="absolute right-0 z-10 mt-1 w-40 bg-white border border-gray-200 rounded-md shadow-lg">
          <ul className="py-1">
            {Object.entries(availableLocales).map(([code, { name }]) => (
              <li key={code}>
                <button
                  onClick={() => selectLanguage(code)}
                  className={`block w-full text-left px-4 py-2 text-sm ${
                    code === locale ? 'bg-gray-100 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;