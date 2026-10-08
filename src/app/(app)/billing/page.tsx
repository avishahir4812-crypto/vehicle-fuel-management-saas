import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { AlertTriangle, BadgeCheck, CalendarClock, Receipt, Sparkles } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { getCompanyAccess } from "@/lib/access";
import { getServerLocale } from "@/i18n/server";
import { rupees } from "@/lib/billing";
import { Badge, Card } from "@/components/ui";
import { BillingClient } from "@/components/app/BillingClient";

export const metadata: Metadata = { title: "Subscription" };

export default async function BillingPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "owner") notFound();

  const { locale, d } = await getServerLocale();
  const tag = locale === "hi" ? "hi-IN" : locale === "gu" ? "gu-IN" : "en-IN";
  const { company, access } = await getCompanyAccess(user.companyId);
  if (!company) notFound();

  const history = await db
    .select()
    .from(payments)
    .where(eq(payments.companyId, company.id))
    .orderBy(desc(payments.createdAt))
    .limit(12);

  const fmtDate = (value: Date | string) =>
    new Date(value).toLocaleDateString(tag, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="mx-auto max-w-4xl">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          {d["bill.title"]}
        </h1>
        <p className="mt-1 text-[15px] text-ink-soft">{d["bill.sub"]}</p>
      </header>

      {/* Current status */}
      <Card
        className={
          access.isFreeForever
            ? "mt-6 border-emerald-300 bg-emerald-50 p-5"
            : access.allowed
              ? "mt-6 p-5"
              : "mt-6 border-red-300 bg-red-50 p-5"
        }
      >
        <div className="flex flex-wrap items-center gap-4">
          <span
            className={
              access.isFreeForever
                ? "grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-600/12 text-emerald-600"
                : access.allowed
                  ? "grid size-12 shrink-0 place-items-center rounded-2xl bg-brand/12 text-brand-deep"
                  : "grid size-12 shrink-0 place-items-center rounded-2xl bg-red-600/12 text-red-600"
            }
          >
            {access.isFreeForever ? (
              <BadgeCheck className="size-6" />
            ) : access.allowed ? (
              <CalendarClock className="size-6" />
            ) : (
              <AlertTriangle className="size-6" />
            )}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-lg font-bold tracking-tight text-ink">
                {access.isFreeForever
                  ? d["bill.freeForever"]
                  : access.status === "trialing"
                    ? d["bill.trialBadge"]
                    : d[`bill.${access.plan}` as keyof typeof d] ?? access.plan}
              </p>
              <Badge tone={access.allowed ? "green" : "red"}>
                {access.isFreeForever
                  ? d["bill.freeForever"]
                  : access.allowed
                    ? d["common.confirm"]
                    : d["bill.expired"]}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-ink-soft">
              {access.isFreeForever
                ? d["bill.freeForeverDesc"]
                : !access.allowed
                  ? d["bill.expiredDesc"]
                  : access.status === "trialing"
                    ? access.daysLeft === 1
                      ? d["bill.trialLastDay"]
                      : d["bill.trialLeft"].replace("{days}", String(access.daysLeft ?? 0))
                    : d["bill.activeUntil"].replace(
                        "{date}",
                        access.periodEnd ? fmtDate(access.periodEnd) : "—"
                      )}
            </p>
          </div>
        </div>
      </Card>

      {/* Plans */}
      {!access.isFreeForever && (
        <section className="mt-8">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold tracking-tight text-ink">
            <Sparkles className="size-4.5 text-brand" />
            {d["bill.choosePlan"]}
          </h2>
          <BillingClient currentPlan={company.plan} locale={locale} />
        </section>
      )}

      {/* Payment history */}
      <section className="mt-8">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold tracking-tight text-ink">
          <Receipt className="size-4.5 text-brand" />
          {d["bill.history"]}
        </h2>
        {history.length === 0 ? (
          <p className="rounded-card border border-dashed border-line-strong bg-surface/60 px-5 py-8 text-center text-sm font-semibold text-ink-soft">
            {d["bill.noPayments"]}
          </p>
        ) : (
          <div className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface shadow-soft">
            {history.map((p) => (
              <div key={p.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-ink">
                    {d[`bill.${p.plan}` as keyof typeof d] ?? p.plan}
                  </p>
                  <p className="text-xs text-ink-soft">
                    {fmtDate(p.periodStart)} → {fmtDate(p.periodEnd)} · {d["bill.ref"]} {p.reference}
                  </p>
                </div>
                <p className="text-sm font-bold text-ink">{rupees(p.amountPaise)}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
