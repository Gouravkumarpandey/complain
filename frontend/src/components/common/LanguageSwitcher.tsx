import { i18n } from "@lingui/core";
import { dynamicActivate } from '../../i18n';

const languages = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिंदी" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
  { code: "zh", label: "中文" },
];

function LanguageSwitcher() {
  const changeLang = async (lang: string) => {
    try {
      // Use centralized loader which handles Vite-friendly dynamic imports
      await dynamicActivate(lang);
    } catch (err) {
      console.error('Language load error', err);
    }
  };

  return (
    <select onChange={(e) => changeLang(e.target.value)} defaultValue={i18n.locale}>
      {languages.map((lang) => (
        <option key={lang.code} value={lang.code}>{lang.label}</option>
      ))}
    </select>
  );
}

export default LanguageSwitcher;
