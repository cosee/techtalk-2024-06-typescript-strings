let translationStore: Record<string, Record<string, string>> = {};

export class MagicTranslator {
  private translations: Record<string, Record<string, string>>;
  private currentLanguage: string;

  constructor(translations: Record<string, Record<string, string>>) {
    this.translations = translations;
  }

  switchLanguage(language: string) {
    this.currentLanguage = language;
  }

  translate(key: string, params?: Record<string, string | number>): string {
    const languageElement = this.translations[this.currentLanguage][key];
    return languageElement.replace(
      /\{(.*?)\}/g,
      (_: string, paramName: string) => {
        return String(params?.[paramName]);
      },
    );
  }
}
