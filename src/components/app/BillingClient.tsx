"use client";

import { useState } from "react";
import { CheckCircle2, Info } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { PricingPlans } from "@/components/PricingPlans";
import { Card } from "@/components/ui";

export function BillingClient({
  currentPlan,
  locale,
}: {
  currentPlan: string;
  locale: string;
}) {
  const { t } = useI18n();
  const [activated, setActivated] = useState<string | null>(null);
  const tag = locale === "hi" ? "hi-IN" : locale === "gu" ? "gu-IN" : "en-IN";

  return (
    <div>
      {activated && (
        <Card className="mb-5 flex items-center gap-3 border-emerald-300 bg-emerald-50 p-5">
          <CheckCircle2 className="size-6 shrink-0 text-emerald-600" />
          <div>
            <p className="text-base font-bold text-emerald-800">{t("bill.success")}</p>
            <p className="text-sm text-emerald-700">
              {t("bill.successDesc", {
                date: new Date(activated).toLocaleDateString(tag, {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                }),
              })}
            </p>
          </div>
        </Card>
      )}

      <PricingPlans
        variant="billing"
        currentPlan={currentPlan}
        onSubscribed={(periodEnd) => setActivated(periodEnd)}
      />

      <p className="mt-5 flex items-start gap-2 rounded-xl bg-ink/[0.04] px-4 py-3 text-[13px] font-medium text-ink-soft">
        <Info className="mt-0.5 size-4 shrink-0" />
        {t("bill.demoNote")}
      </p>
    </div>
  );
}
