import en from "./en.json";
import de from "./de.json";
import { MagicTranslator } from "../magic/magicTranslator";
import { TranslationSchema } from "./translation-schema";

const translate = new MagicTranslator({ en, de });

export function setLanguage(lang: string) {
  translate.switchLanguage(lang);
}

// In order to be able to call t("title"), but also
// t("greeting", { username: "Nils"}) and still have good
// suggestions, we need to compute the rest-parameter (...params),
// as a type (empty array->no rest parameter, array with one item
// one parameter).
// In the function we then immediately destructure the rest
// https://stackoverflow.com/q/78619236/4251384
export function t<T extends keyof TranslationSchema>(
  key: T,
  ...params: TranslationSchema[T]
) {
  return translate.translate(key, params[0]);
}

console.log(t("greeting", { username: "Nils" }));
console.log(t("title"));
