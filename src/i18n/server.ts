import "server-only";
import { cookies } from "next/headers";
import { getDictionary, isLocale, type Dict, type Locale } from "@/i18n";

/** Read the user's locale cookie in server components/routes. */
export async function getServerLocale(): Promise<{ locale: Locale; d: Dict }> {
  const store = await cookies();
  const value = store.get("fm_locale")?.value;
  const locale = isLocale(value) ? value : "en";
  return { locale, d: getDictionary(locale) };
}
