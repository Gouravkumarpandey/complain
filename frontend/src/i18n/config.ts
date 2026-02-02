import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import zh from './locales/zh.json';
import hi from './locales/hi.json';
import es from './locales/es.json';
import ar from './locales/ar.json';
import fr from './locales/fr.json';
import bn from './locales/bn.json';
import pt from './locales/pt.json';
import ru from './locales/ru.json';
import id from './locales/id.json';
import ur from './locales/ur.json';
import de from './locales/de.json';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            zh: { translation: zh },
            hi: { translation: hi },
            es: { translation: es },
            ar: { translation: ar },
            fr: { translation: fr },
            bn: { translation: bn },
            pt: { translation: pt },
            ru: { translation: ru },
            id: { translation: id },
            ur: { translation: ur },
            de: { translation: de }
        },
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false
        }
    });

export default i18n;
