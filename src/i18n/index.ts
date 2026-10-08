import { en, type Dict, type DictKey } from "./dictionaries/en";
import { hi } from "./dictionaries/hi";
import { gu } from "./dictionaries/gu";

export type Locale = "en" | "hi" | "gu";
export const locales: Locale[] = ["en", "hi", "gu"];
export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  hi: "हिन्दी",
  gu: "ગુજરાતી",
};

export const dictionaries: Record<Locale, Dict> = { en, hi, gu };

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "en" || value === "hi" || value === "gu";
}

export function getDictionary(locale: string | undefined): Dict {
  return isLocale(locale) ? dictionaries[locale] : dictionaries.en;
}

export type { Dict, DictKey };
