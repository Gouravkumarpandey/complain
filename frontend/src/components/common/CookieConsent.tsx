import React, { useState, useEffect, useRef } from 'react';
import { Globe, ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Professional Multi-Language CookieConsent Component
 */

interface CookiePreferences {
    essential: boolean;
    analytics: boolean;
    marketing: boolean;
    functional: boolean;
}

const LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिन्दी' },
    { code: 'es', label: 'Español' },
    { code: 'fr', label: 'Français' },
    { code: 'zh', label: '中文' },
];

export const CookieConsent: React.FC = () => {
    const { t, i18n } = useTranslation();
    const [isVisible, setIsVisible] = useState<boolean>(false);
    const [showCustomize, setShowCustomize] = useState<boolean>(false);
    const [showLangMenu, setShowLangMenu] = useState<boolean>(false);
    const langMenuRef = useRef<HTMLDivElement>(null);
    const [preferences, setPreferences] = useState<CookiePreferences>({
        essential: true,
        analytics: false,
        marketing: false,
        functional: false,
    });

    useEffect(() => {
        const savedConsent = localStorage.getItem('cookie-consent-preferences');
        if (!savedConsent) {
            const timer = setTimeout(() => setIsVisible(true), 500);
            return () => clearTimeout(timer);
        }
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
                setShowLangMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAcceptAll = () => {
        savePreferences({
            essential: true,
            analytics: true,
            marketing: true,
            functional: true,
        });
    };

    const handleRejectAll = () => {
        savePreferences({
            essential: true,
            analytics: false,
            marketing: false,
            functional: false,
        });
    };

    const handleSaveCustom = () => {
        savePreferences(preferences);
        setShowCustomize(false);
    };

    const savePreferences = (prefs: CookiePreferences) => {
        localStorage.setItem('cookie-consent-preferences', JSON.stringify(prefs));
        localStorage.setItem('cookie-consent-date', new Date().toISOString());
        setIsVisible(false);
        window.dispatchEvent(new CustomEvent('cookieConsentChanged', { detail: prefs }));
    };

    const changeLanguage = (code: string) => {
        i18n.changeLanguage(code);
        setShowLangMenu(false);
    };

    useEffect(() => {
        (window as any).clearCookieConsent = () => {
            localStorage.removeItem('cookie-consent-preferences');
            setIsVisible(true);
        };

        const handleOpenSettings = () => {
            setShowCustomize(true);
        };
        window.addEventListener('openCookieSettings', handleOpenSettings);
        return () => window.removeEventListener('openCookieSettings', handleOpenSettings);
    }, []);

    if (!isVisible && !showCustomize) return null;

    return (
        <>
            {/* Main Banner */}
            {isVisible && !showCustomize && (
                <div className="fixed bottom-0 left-0 w-full z-[9999] bg-white border-t border-gray-200 animate-in fade-in slide-in-from-bottom-full duration-500">
                    <div className="max-w-[1400px] mx-auto p-6 md:p-8 flex flex-col lg:flex-row gap-8 items-start justify-between">
                        <div className="flex-1 space-y-4">
                            <h2 className="text-[17px] font-bold text-black font-sans uppercase tracking-tight">
                                {t('cookies.title')}
                            </h2>

                            <div className="text-[13.5px] leading-[1.6] text-gray-700 font-sans max-w-[950px]">
                                {t('cookies.description')}
                            </div>

                            {/* Enhanced Language Selector */}
                            <div className="relative" ref={langMenuRef}>
                                <button
                                    onClick={() => setShowLangMenu(!showLangMenu)}
                                    className="flex items-center gap-1.5 text-[12px] font-semibold text-gray-600 hover:text-black cursor-pointer pt-2 group transition-colors"
                                >
                                    <Globe className="w-3.5 h-3.5 group-hover:stroke-black" />
                                    <span>{i18n.language?.toUpperCase() || 'EN'}</span>
                                    <ChevronUp className={`w-2.5 h-2.5 transition-transform duration-200 ${showLangMenu ? 'rotate-0' : 'rotate-180'}`} />
                                </button>

                                {showLangMenu && (
                                    <div className="absolute bottom-full left-0 mb-2 w-32 bg-white border border-gray-200 rounded shadow-xl py-1 z-[10001] animate-in fade-in zoom-in-95 duration-200">
                                        {LANGUAGES.map((lang) => (
                                            <button
                                                key={lang.code}
                                                onClick={() => changeLanguage(lang.code)}
                                                className={`w-full text-left px-4 py-2 text-[12px] hover:bg-gray-50 flex items-center justify-between ${i18n.language === lang.code ? 'font-bold text-black' : 'text-gray-600'}`}
                                            >
                                                {lang.label}
                                                {i18n.language === lang.code && <div className="w-1 h-1 bg-black rounded-full" />}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col gap-2.5 w-full lg:w-[220px] shrink-0">
                            <button
                                onClick={handleAcceptAll}
                                className="w-full h-[42px] bg-black text-white text-[13px] font-bold rounded hover:bg-gray-800 transition-all duration-200 flex items-center justify-center tracking-tight"
                            >
                                {t('cookies.acceptAll')}
                            </button>
                            <button
                                onClick={handleRejectAll}
                                className="w-full h-[42px] bg-black text-white text-[13px] font-bold rounded hover:bg-gray-800 transition-all duration-200 flex items-center justify-center tracking-tight"
                            >
                                {t('cookies.rejectAll')}
                            </button>
                            <button
                                onClick={() => setShowCustomize(true)}
                                className="w-full h-[42px] bg-white text-black border border-gray-400 text-[13px] font-bold rounded hover:bg-gray-50 transition-all duration-200 flex items-center justify-center tracking-tight"
                            >
                                {t('cookies.manage')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Customization Modal */}
            {showCustomize && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-[2px] animate-in fade-in duration-300">
                    <div className="bg-white shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-gray-100">
                        <div className="p-8 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-black">{t('cookies.settingsTitle')}</h2>
                            <p className="text-gray-500 text-sm mt-1">{t('cookies.settingsSubtitle')}</p>
                        </div>

                        <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
                            {[
                                { id: 'essential', label: t('cookies.strictlyNecessary'), desc: 'Required for basic site functionality.', required: true },
                                { id: 'functional', label: t('cookies.functional'), desc: t('cookies.functionalDesc'), state: preferences.functional },
                                { id: 'analytics', label: t('cookies.analytics'), desc: t('cookies.analyticsDesc'), state: preferences.analytics },
                                { id: 'marketing', label: t('cookies.marketing'), desc: t('cookies.marketingDesc'), state: preferences.marketing }
                            ].map((cookie) => (
                                <div key={cookie.id} className="flex items-start justify-between gap-12 group">
                                    <div className="flex-1">
                                        <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                                            {cookie.label}
                                            {cookie.required && <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded tracking-wider font-bold uppercase">{t('cookies.required')}</span>}
                                        </h4>
                                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{cookie.desc}</p>
                                    </div>
                                    {!cookie.required && (
                                        <button
                                            onClick={() => setPreferences({ ...preferences, [cookie.id as keyof CookiePreferences]: !preferences[cookie.id as keyof CookiePreferences] })}
                                            className={`shrink-0 w-11 h-5 rounded-full transition-colors duration-200 relative flex items-center px-0.5 mt-1 ${(preferences as any)[cookie.id] ? 'bg-black' : 'bg-gray-200'
                                                }`}
                                        >
                                            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${(preferences as any)[cookie.id] ? 'translate-x-[24px]' : 'translate-x-0'
                                                }`} />
                                        </button>
                                    )}
                                    {cookie.required && (
                                        <div className="shrink-0 w-11 h-5 bg-black rounded-full relative flex items-center px-0.5 mt-1 opacity-50 cursor-not-allowed">
                                            <div className="w-4 h-4 bg-white rounded-full translate-x-[24px]" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="p-8 bg-gray-50 flex items-center justify-end gap-3">
                            <button
                                onClick={() => setShowCustomize(false)}
                                className="px-6 py-2 text-sm font-bold text-gray-600 hover:text-black"
                            >
                                {t('cookies.goBack')}
                            </button>
                            <button
                                onClick={handleSaveCustom}
                                className="px-8 py-2.5 text-sm font-bold text-white bg-black hover:bg-gray-800 transition-all duration-300 rounded shadow-lg shadow-gray-200"
                            >
                                {t('cookies.save')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default CookieConsent;
