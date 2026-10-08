"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Globe } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { localeNames, locales } from "@/i18n";
import { cn } from "@/lib/utils";

export function LanguageMenu({ dark = false, compact = false }: { dark?: boolean; compact?: boolean }) {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "flex h-9 items-center gap-1.5 rounded-xl px-2.5 text-[13px] font-semibold transition-colors",
          dark
            ? "text-white/80 hover:bg-white/10 hover:text-white"
            : "text-ink-soft hover:bg-ink/5 hover:text-ink"
        )}
      >
        <Globe className="size-4" />
        {!compact && <span>{localeNames[locale]}</span>}
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 top-11 z-50 w-40 overflow-hidden rounded-xl border border-line bg-surface p-1 shadow-lift"
        >
          {locales.map((l) => (
            <button
              key={l}
              type="button"
              role="option"
              aria-selected={locale === l}
              onClick={() => {
                setLocale(l);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors",
                locale === l ? "bg-brand/10 text-brand-ink" : "text-ink hover:bg-ink/5"
              )}
            >
              {localeNames[l]}
              {locale === l && <Check className="size-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
