import en from "./en.json";
import de from "./de.json";

const translations = { en, de };

let currentLanguage = "de";
export function setLanguage(lang: string) {
  currentLanguage = lang;
}

export function t(key: string, params?: Record<string, string | number>) {
  const template = translations[currentLanguage][key];
  return template.replaceAll(/\{(.*?)}/g, (_: string, paramName: string) => {
    return params[paramName];
  });
}
