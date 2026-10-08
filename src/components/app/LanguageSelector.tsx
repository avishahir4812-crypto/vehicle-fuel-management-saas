"use client";

import { CheckCircle2 } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { localeNames, locales, type Locale } from "@/i18n";
import { cn } from "@/lib/utils";

const SAMPLES: Record<Locale, string> = {
  en: "Dashboard · Vehicles · Messages",
  hi: "डैशबोर्ड · वाहन · संदेश",
  gu: "ડેશબોર્ડ · વાહનો · સંદેશા",
};

export function LanguageSelector() {
  const { locale, setLocale } = useI18n();
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {locales.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLocale(l)}
          aria-pressed={locale === l}
          className={cn(
            "rounded-2xl border-2 p-4 text-left transition-all",
            locale === l
              ? "border-brand bg-brand/[0.06] shadow-[0_0_0_4px_rgba(232,147,12,0.12)]"
              : "border-line bg-surface hover:border-line-strong"
          )}
        >
          <div className="flex items-center justify-between">
            <p className="text-[17px] font-bold text-ink">{localeNames[l]}</p>
            {locale === l && <CheckCircle2 className="size-4.5 text-brand" />}
          </div>
          <p className="mt-1.5 text-xs font-medium text-ink-soft">{SAMPLES[l]}</p>
        </button>
      ))}
    </div>
  );
}
