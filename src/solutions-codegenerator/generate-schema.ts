/// <reference types="vite/client" />

import de from "./de.json";
import en from "./en.json";

import prettier from "prettier";

import fs from "node:fs/promises";
import Handlebars from "handlebars";
import translationSchemaTemplate from "./translation-schema.ts.hbs?raw";

type TranslationMap = Record<string, string>;
type ParamsMap = Record<string, Set<string>>;
type TranslationsByLanguage = Record<string, TranslationMap>;

await validateAndRender(process.argv[2], { de, en });
console.log(`Done ${new Date().toTimeString()}`);

function collectErrors(
  paramsMapsByLanguage: Record<string, ParamsMap>,
  allParamsMap: ParamsMap,
) {
  const errors: string[] = [];
  for (const [language, paramsMap] of Object.entries(paramsMapsByLanguage)) {
    validate(language, paramsMap, allParamsMap, errors);
  }
  return errors;
}

async function validateAndRender(
  file: string,
  translations: TranslationsByLanguage,
) {
  console.error("\n\nStarting code generation")
  const paramsMapsByLanguage = mapValues(translations, asParamsMap);
  const allParamsMap: ParamsMap = mergeParamsMaps(
    Object.values(paramsMapsByLanguage),
  );

  const errors = collectErrors(paramsMapsByLanguage, allParamsMap);
  if (errors.length > 0) {
    console.error();
    console.error("Stopping because of errors:");
    console.error(errors.join("\n") + "\n");
    return;
  }
  console.error("Writing schema to", file);
  const code = renderSchema(allParamsMap);
  await writePrettyTypeScript(file, code);
}

async function writePrettyTypeScript(file: string, code: string) {
  const prettyCode = await prettier.format(code, { parser: "typescript" });
  await fs.writeFile(file, prettyCode);
}

function asParamsMap(translationsMap: TranslationMap): ParamsMap {
  return mapValues(translationsMap, extractParams);
}

function extractParams(translatedValue: string): Set<string> {
  const placeholders = translatedValue.match(/\{(.*?)}/g);
  if (placeholders == null) return new Set();
  return new Set(placeholders.map((p) => p.slice(1, -1)));
}

function mergeParamsMaps(paramsMaps: Iterable<ParamsMap>) {
  const result: ParamsMap = {};
  for (const paramsMap of paramsMaps) {
    for (const key of Object.keys(paramsMap)) {
      result[key] = result[key]
        ? new Set([...result[key], ...paramsMap[key]])
        : new Set(paramsMap[key]);
    }
  }
  return result;
}

function validate(
  language: string,
  paramsMap: ParamsMap,
  allParamsMap: ParamsMap,
  errors: string[],
) {
  for (const key of Object.keys(allParamsMap)) {
    if (paramsMap[key] == null) {
      errors.push(`- ${language}: Key "${key}" is missing"`);
    } else {
      for (const param of allParamsMap[key]) {
        if (!paramsMap[key].has(param)) {
          errors.push(
            `- ${language}: Key "${key}" does not use parameter "${param}"`,
          );
        }
      }
    }
  }
}

function renderSchema(allParamsMap: ParamsMap): string {
  const handlebars = Handlebars.create();
  handlebars.registerHelper("js", JSON.stringify.bind(JSON));
  handlebars.registerHelper("literals", literals);
  const template = handlebars.compile(translationSchemaTemplate, {
    noEscape: true,
  });
  const code = template(
    { paramsMap: allParamsMap },
    { allowedProtoProperties: { size: true } },
  );
  return code;
}

function js(input: unknown) {
  return JSON.stringify(input);
}

function literals(values: Iterable<string>) {
  return [...values].map(js).join(" | ");
}

function mapValues<I, O>(
  obj: Record<string, I>,
  mapperFn: (input: I, key: string) => O,
): Record<string, O> {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, mapperFn(v, k)]),
  );
}
