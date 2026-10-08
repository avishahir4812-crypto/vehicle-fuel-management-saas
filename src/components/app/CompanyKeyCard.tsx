"use client";

import { useState } from "react";
import { Check, Copy, KeyRound } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { Button } from "@/components/ui";

export function CompanyKeyCard({
  companyName,
  joinKey,
}: {
  companyName: string;
  joinKey: string;
}) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  return (
    <div className="rounded-2xl border border-brand/30 bg-brand/[0.06] p-4">
      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-brand-ink">
        <KeyRound className="size-3.5" />
        {t("settings.joinKey")}
      </p>
      <p className="mt-2 font-mono text-3xl font-bold tracking-[0.3em] text-brand-deep">
        {joinKey}
      </p>
      <p className="mt-2 text-[13px] text-ink-soft">{t("settings.joinKeyDesc")}</p>
      <Button
        variant="outline"
        size="sm"
        className="mt-3"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(`${companyName} · ${joinKey}`);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {
            /* ignore */
          }
        }}
      >
        {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
        {copied ? t("drivers.copied") : t("settings.copyKey")}
      </Button>
    </div>
  );
}
