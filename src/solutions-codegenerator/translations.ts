import en from "./en.json";
import de from "./de.json";
import { MagicTranslator } from "../magic/magicTranslator";
import { TranslationSchema } from "./translation-schema";

const translate = new MagicTranslator({ en, de });

export function setLanguage(lang: string) {
  translate.switchLanguage(lang);
}

export function t<T extends keyof TranslationSchema>(
  key: T,
  ...params: TranslationSchema[T]
) {
  return translate.translate(key, params[0]);
}

console.log(t("greeting", { username: "Nils" }));
console.log(t("title"));
