import en from "./en";
import de from "./de";
import { MagicTranslator } from "../magic/magicTranslator";

type Schema = typeof en;
type TranslationKey = keyof Schema;
type Template<T extends TranslationKey> = (typeof en)[T] | (typeof en)[T];
const x: Template<"greeting"> = "Hello {username}";

type ExtractOneParam<T extends string> =
  T extends `${string}{${infer Param}}${string}` ? Param : never;
const param1: ExtractOneParam<Template<"nextGame">> = "player1";

type ExtractAllParams<T extends string> =
  T extends `${string}{${infer Param}}${infer Rest}`
    ? Param | ExtractAllParams<Rest>
    : never;
const param2: ExtractAllParams<Template<"nextGame">> = "player2";

type ParamsForTranslationKey<T extends TranslationKey> = Record<
  ExtractAllParams<Template<T>>,
  string | number
>;

const translate = new MagicTranslator({ en, de });

export function setLanguage(lang: string) {
  translate.switchLanguage(lang);
}

export function t<T extends TranslationKey>(
  key: T,
  params: ParamsForTranslationKey<T>,
) {
  return translate.translate(key, params);
}

console.log(t("greeting", { username: "Nils" }));
console.log(t("title", {}));
console.log(
  t("nextGame", { player1: "Tina", player2: "John", player3: "Alic" }),
);
