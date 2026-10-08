"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { dictionaries, isLocale, type DictKey, type Locale } from "@/i18n";

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  switching: boolean;
  t: (key: DictKey, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const setLocale = useCallback(
    (next: Locale) => {
      if (!isLocale(next) || next === locale) return;

      // 1. Instant client-side switch.
      setLocaleState(next);
      document.cookie = `fm_locale=${next};path=/;max-age=31536000;samesite=lax`;
      document.documentElement.lang = next;

      // 2. Persist to the account, then re-render server components so every
      //    server-rendered string (dashboard, cards, chat titles) follows too.
      void fetch("/api/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: next }),
      })
        .catch(() => undefined)
        .finally(() => {
          startTransition(() => router.refresh());
        });
    },
    [locale, router]
  );

  const t = useCallback(
    (key: DictKey, vars?: Record<string, string | number>) => {
      let value = dictionaries[locale][key] ?? dictionaries.en[key] ?? key;
      if (vars) {
        for (const [name, raw] of Object.entries(vars)) {
          value = value.replaceAll(`{${name}}`, String(raw));
        }
      }
      return value;
    },
    [locale]
  );

  const value = useMemo(
    () => ({ locale, setLocale, switching: pending, t }),
    [locale, setLocale, pending, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
