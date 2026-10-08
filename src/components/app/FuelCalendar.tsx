"use client";

import { useMemo, useState, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";

export type CalendarDay = {
  day: number;
  spend: number;
  count: number;
  flagged: boolean;
};

/**
 * Month grid. Selecting a day filters the entry list rendered by the parent
 * (server component passes one <li> per entry, tagged with its day).
 */
export function FuelCalendar({
  year,
  month,
  daysInMonth,
  days,
  children,
}: {
  year: number;
  month: number;
  daysInMonth: number;
  days: CalendarDay[];
  /** Server-rendered entries, each wrapped in an element with data-day. */
  children: ReactNode;
}) {
  const { t, locale } = useI18n();
  const [selected, setSelected] = useState<number | null>(null);
  const tag = locale === "hi" ? "hi-IN" : locale === "gu" ? "gu-IN" : "en-IN";

  const byDay = useMemo(() => new Map(days.map((d) => [d.day, d])), [days]);
  const firstWeekday = new Date(year, month, 1).getDay();
  const cells = Array.from({ length: firstWeekday + daysInMonth }, (_, i) =>
    i < firstWeekday ? null : i - firstWeekday + 1
  );

  const weekLabels = useMemo(() => {
    const base = new Date(2024, 0, 7); // a Sunday
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return d.toLocaleDateString(tag, { weekday: "narrow" });
    });
  }, [tag]);

  const selectedLabel =
    selected != null
      ? new Date(year, month, selected).toLocaleDateString(tag, {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : null;

  const maxSpend = Math.max(...days.map((d) => d.spend), 1);

  return (
    <div>
      {/* Grid */}
      <div className="rounded-card border border-line bg-surface p-4 shadow-soft sm:p-5">
        <div className="mb-2 grid grid-cols-7 gap-1.5">
          {weekLabels.map((w, i) => (
            <div
              key={i}
              className="text-center text-[11px] font-bold uppercase tracking-wide text-ink-soft/60"
            >
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((day, i) => {
            if (day === null) return <div key={`pad-${i}`} />;
            const info = byDay.get(day);
            const active = selected === day;
            const intensity = info ? 0.14 + (info.spend / maxSpend) * 0.5 : 0;
            return (
              <button
                key={day}
                type="button"
                onClick={() => setSelected(active ? null : day)}
                className={cn(
                  "relative aspect-square rounded-xl border text-left transition-all",
                  active
                    ? "border-ink bg-ink text-paper shadow-soft"
                    : info
                      ? "border-transparent hover:border-brand/50"
                      : "border-transparent text-ink-soft/50 hover:bg-ink/[0.03]"
                )}
                style={
                  !active && info
                    ? {
                        backgroundColor: info.flagged
                          ? `rgba(220,38,38,${intensity})`
                          : `rgba(232,147,12,${intensity})`,
                      }
                    : undefined
                }
              >
                <span
                  className={cn(
                    "absolute left-1.5 top-1 text-[11px] font-bold",
                    active ? "text-paper" : info ? "text-ink" : ""
                  )}
                >
                  {day}
                </span>
                {info && (
                  <span
                    className={cn(
                      "absolute inset-x-1 bottom-1 truncate text-center text-[9px] font-bold sm:text-[10px]",
                      active ? "text-paper/80" : "text-ink/70"
                    )}
                  >
                    ₹{Intl.NumberFormat("en-IN", { notation: "compact" }).format(info.spend)}
                  </span>
                )}
                {info?.flagged && !active && (
                  <AlertTriangle className="absolute right-1 top-1 size-2.5 text-red-600" />
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line pt-3 text-[11px] font-semibold text-ink-soft">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded bg-brand/50" /> {t("vdetail.amount")}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded bg-red-500/60" /> {t("anomaly.flagged")}
          </span>
          {selected != null && (
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="ml-auto rounded-lg px-2 py-1 font-bold text-brand-deep hover:bg-brand/10"
            >
              {t("history.allMonth")}
            </button>
          )}
        </div>
      </div>

      {/* Entry list — CSS filters to the selected day, no extra fetch */}
      <div className="mt-5">
        <h2 className="mb-3 text-base font-bold tracking-tight text-ink">
          {selectedLabel
            ? t("history.dayEntries", { date: selectedLabel })
            : t("history.allMonth")}
        </h2>
        <div
          data-selected-day={selected ?? "all"}
          className={cn(
            "divide-y divide-line overflow-hidden rounded-card border border-line bg-surface shadow-soft",
            "[&[data-selected-day]:not([data-selected-day='all'])>*]:hidden"
          )}
        >
          <style>{
            selected != null
              ? `[data-selected-day='${selected}'] > [data-day='${selected}']{display:block !important}`
              : ""
          }</style>
          {children}
        </div>
        {selected != null && !byDay.has(selected) && (
          <p className="mt-3 rounded-card border border-dashed border-line-strong bg-surface/60 px-5 py-8 text-center text-sm font-semibold text-ink-soft">
            {t("history.noEntriesDay")}
          </p>
        )}
      </div>
    </div>
  );
}
