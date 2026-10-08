"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { PLAN_LIST, rupees, type PlanId } from "@/lib/billing";
import { Spinner } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { DictKey } from "@/i18n";

const PLAN_LABEL: Record<PlanId, DictKey> = {
  monthly: "bill.monthly",
  quarterly: "bill.quarterly",
  yearly: "bill.yearly",
};

/**
 * Shared light-theme pricing grid.
 *  • variant="marketing" → landing page, links to signup
 *  • variant="billing"   → in-app, subscribes directly
 */
export function PricingPlans({
  variant = "marketing",
  currentPlan,
  onSubscribed,
}: {
  variant?: "marketing" | "billing";
  currentPlan?: string;
  onSubscribed?: (periodEnd: string) => void;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [busy, setBusy] = useState<PlanId | null>(null);

  async function subscribe(plan: PlanId) {
    setBusy(plan);
    try {
      const res = await fetch("/api/billing/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { periodEnd: string };
      onSubscribed?.(data.periodEnd);
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-3 lg:gap-6">
      {PLAN_LIST.map((plan) => {
        const best = plan.id === "yearly";
        const isCurrent = currentPlan === plan.id;
        return (
          <div
            key={plan.id}
            className={cn(
              "relative flex flex-col rounded-3xl border p-6 transition-all duration-300 sm:p-7",
              best
                ? "border-brand bg-surface shadow-amber lg:-my-2 lg:py-9"
                : "border-line bg-surface shadow-soft hover:-translate-y-1 hover:shadow-lift"
            )}
          >
            {best && (
              <span className="absolute -top-3.5 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full bg-brand px-3.5 py-1 text-[11px] font-bold uppercase tracking-wide text-night shadow-amber">
                <Sparkles className="size-3" />
                {t("bill.popular")}
              </span>
            )}

            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-lg font-bold tracking-tight text-ink">
                {t(PLAN_LABEL[plan.id])}
              </h3>
              {plan.discountPct > 0 && (
                <span className="rounded-full bg-emerald-600/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                  {t("bill.save", { pct: plan.discountPct })}
                </span>
              )}
            </div>

            <div className="mt-5 flex items-end gap-1.5">
              <span className="text-[40px] font-bold leading-none tracking-tight text-ink">
                {rupees(plan.perMonthPaise)}
              </span>
              <span className="pb-1 text-sm font-semibold text-ink-soft">
                {t("bill.perMonth")}
              </span>
            </div>

            <p className="mt-2.5 text-[13px] font-medium leading-relaxed text-ink-soft">
              {plan.months === 1
                ? t("bill.billedMonthly", { total: rupees(plan.totalPaise) })
                : t("bill.billedAs", {
                    total: rupees(plan.totalPaise),
                    months: plan.months,
                  })}
            </p>

            {plan.savingsPaise > 0 && (
              <p className="mt-1 text-[13px] font-bold text-emerald-700">
                − {rupees(plan.savingsPaise)}
              </p>
            )}

            <div className="mt-6 flex-1 space-y-2 border-t border-line pt-5">
              {(["bill.f1", "bill.f2", "bill.f3", "bill.f4", "bill.f5", "bill.f6"] as DictKey[])
                .slice(0, best ? 6 : 4)
                .map((key) => (
                  <p key={key} className="flex items-start gap-2.5 text-[13px] text-ink-soft">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-brand" />
                    {t(key)}
                  </p>
                ))}
            </div>

            {variant === "marketing" ? (
              <Link
                href="/signup?new=1"
                className={cn(
                  "mt-7 inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-bold transition",
                  best
                    ? "bg-brand text-night shadow-amber hover:bg-brand-deep hover:text-white"
                    : "bg-ink text-paper hover:bg-ink-soft"
                )}
              >
                {t("bill.startTrial")}
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => void subscribe(plan.id)}
                disabled={busy !== null}
                className={cn(
                  "mt-7 inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold transition disabled:opacity-50",
                  best
                    ? "bg-brand text-night shadow-amber hover:bg-brand-deep hover:text-white"
                    : "bg-ink text-paper hover:bg-ink-soft"
                )}
              >
                {busy === plan.id && <Spinner />}
                {busy === plan.id
                  ? t("bill.activating")
                  : isCurrent
                    ? t("bill.renew")
                    : t("bill.subscribe")}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
