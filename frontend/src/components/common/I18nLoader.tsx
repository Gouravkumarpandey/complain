import { useEffect, useState } from 'react';
import { initI18n } from '../../i18n';

interface I18nLoaderProps {
  children: React.ReactNode;
}

/**
 * Component that handles i18n initialization before rendering children
 */
export function I18nLoader({ children }: I18nLoaderProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    // Initialize i18n when the component mounts
    const loadI18n = async () => {
      try {
        console.log('Initializing i18n system...');
        // Listen for language changes from localStorage directly
        const handleStorageChange = (e: StorageEvent) => {
          if (e.key === 'language' && e.newValue) {
            console.log(`Storage event detected: language changed to ${e.newValue}`);
            window.location.reload();
          }
        };
        
        window.addEventListener('storage', handleStorageChange);
        
        await initI18n();
        console.log('i18n initialized successfully');
        setIsLoaded(true);
        
        // Check if we're missing a language setting
        if (!localStorage.getItem('language')) {
          console.log('No language set in localStorage, setting default language');
          localStorage.setItem('language', 'en');
        }
        
        return () => {
          window.removeEventListener('storage', handleStorageChange);
        };
      } catch (error) {
        console.error('Failed to initialize i18n:', error);
        // Continue anyway with the default locale
        setIsLoaded(true);
      }
    };
    
    loadI18n();
  }, []);
  
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-medium">Loading translations...</p>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
}