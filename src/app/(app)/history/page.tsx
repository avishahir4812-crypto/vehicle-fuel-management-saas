import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { getCalendarMonth } from "@/lib/queries";
import { getServerLocale } from "@/i18n/server";
import { formatINR, formatLiters } from "@/lib/utils";
import { FuelCalendar, type CalendarDay } from "@/components/app/FuelCalendar";
import { FuelEntryRow } from "@/components/app/FuelEntryRow";

export const metadata: Metadata = { title: "Fuel History" };

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) notFound();

  const { month } = await searchParams;
  const { locale, d } = await getServerLocale();
  const tag = locale === "hi" ? "hi-IN" : locale === "gu" ? "gu-IN" : "en-IN";

  const offset = Math.max(-36, Math.min(0, Number.parseInt(month ?? "0", 10) || 0));
  const data = await getCalendarMonth(
    user.role === "owner" ? { companyId: user.companyId } : { driverId: user.id },
    offset
  );

  // Aggregate per calendar day.
  const dayMap = new Map<number, CalendarDay>();
  for (const e of data.entries) {
    const day = new Date(e.createdAt).getDate();
    const cur = dayMap.get(day) ?? { day, spend: 0, count: 0, flagged: false };
    cur.spend += Number(e.totalAmount);
    cur.count += 1;
    if (e.anomaly) cur.flagged = true;
    dayMap.set(day, cur);
  }

  const monthLabel = data.monthStart.toLocaleDateString(tag, { month: "long", year: "numeric" });

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            {d["history.title"]}
          </h1>
          <p className="mt-1 text-[15px] text-ink-soft">{d["history.pickDay"]}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/history?month=${offset - 1}`}
            scroll={false}
            className="grid size-9 place-items-center rounded-xl border border-line text-ink-soft transition hover:border-line-strong hover:text-ink"
            aria-label="Previous month"
          >
            <ChevronLeft className="size-4" />
          </Link>
          <span className="flex min-w-40 items-center justify-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-sm font-bold text-ink">
            <CalendarDays className="size-4 text-brand" />
            {monthLabel}
          </span>
          <Link
            href={`/history?month=${offset + 1}`}
            scroll={false}
            aria-disabled={offset === 0}
            className={
              offset === 0
                ? "pointer-events-none grid size-9 place-items-center rounded-xl border border-line text-ink-soft/30"
                : "grid size-9 place-items-center rounded-xl border border-line text-ink-soft transition hover:border-line-strong hover:text-ink"
            }
            aria-label="Next month"
          >
            <ChevronRight className="size-4" />
          </Link>
        </div>
      </header>

      {/* Month summary */}
      <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: d["history.monthTotal"], value: formatINR(data.totals.spend) },
          { label: d["vdetail.liters"], value: formatLiters(data.totals.liters) },
          { label: d["vdetail.entries"], value: String(data.totals.count) },
        ].map((s) => (
          <div key={s.label} className="rounded-card border border-line bg-surface p-4 shadow-soft">
            <p className="text-xl font-bold tracking-tight text-ink">{s.value}</p>
            <p className="mt-0.5 text-[12px] font-semibold text-ink-soft">{s.label}</p>
          </div>
        ))}
        <div
          className={
            data.totals.flagged > 0
              ? "rounded-card border border-red-300 bg-red-50 p-4 shadow-soft"
              : "rounded-card border border-line bg-surface p-4 shadow-soft"
          }
        >
          <p
            className={
              data.totals.flagged > 0
                ? "flex items-center gap-1.5 text-xl font-bold tracking-tight text-red-700"
                : "text-xl font-bold tracking-tight text-ink"
            }
          >
            {data.totals.flagged > 0 && <AlertTriangle className="size-4" />}
            {data.totals.flagged}
          </p>
          <p
            className={
              data.totals.flagged > 0
                ? "mt-0.5 text-[12px] font-semibold text-red-600"
                : "mt-0.5 text-[12px] font-semibold text-ink-soft"
            }
          >
            {d["anomaly.flagged"]}
          </p>
        </div>
      </section>

      <div className="mt-6">
        <FuelCalendar
          year={data.monthStart.getFullYear()}
          month={data.monthStart.getMonth()}
          daysInMonth={data.daysInMonth}
          days={[...dayMap.values()]}
        >
          {data.entries.length === 0 ? (
            <p
              data-day="none"
              className="px-5 py-10 text-center text-sm font-semibold text-ink-soft"
            >
              {d["vdetail.noEntriesMonth"]}
            </p>
          ) : (
            [...data.entries]
              .reverse()
              .map((e) => (
                <div key={e.id} data-day={new Date(e.createdAt).getDate()}>
                  <FuelEntryRow
                    entry={e}
                    showDriver={user.role === "owner"}
                    showVehicle
                  />
                </div>
              ))
          )}
        </FuelCalendar>
      </div>
    </div>
  );
}
