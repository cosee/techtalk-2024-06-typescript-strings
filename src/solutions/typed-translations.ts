// noinspection JSUnusedLocalSymbols

import en from "./en";
import de from "./de";
import { MagicTranslator } from "../magic/magicTranslator";

const translate = new MagicTranslator({ en, de });

export function setLanguage(lang: string) {
  translate.switchLanguage(lang);
}

type Translations = typeof en;
type TranslationKey = keyof Translations;

type ExtractParams<T extends string> =
  T extends `${string}{${infer Param}}${infer Rest}`
    ? Param | ExtractParams<Rest>
    : never;

type ParamNames<T extends TranslationKey> = ExtractParams<Translations[T]>;

// In order to be able to call t("title"), but also
// t("greeting", { username: "Nils"}) and still have good
// suggestions, we need to compute the rest-parameter (...params),
// as a type (empty array->no rest parameter, array with one item
// one parameter).
// In the function we then immediately destructure the rest
// https://stackoverflow.com/q/78619236/4251384
type TMethodRestParams<T extends TranslationKey> = T extends TranslationKey
  ? ParamNames<T> extends never
    ? []
    : [params: Record<ParamNames<T>, string>]
  : [];

export function t<T extends TranslationKey>(
  key: T,
  ...[params]: TMethodRestParams<T>
) {
  return translate.translate(key, params);
}



