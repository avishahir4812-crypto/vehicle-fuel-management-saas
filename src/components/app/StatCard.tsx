import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function StatCard({
  icon,
  label,
  value,
  sub,
  accent = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  sub?: ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-card border p-5 transition-shadow hover:shadow-lift",
        accent
          ? "border-ink bg-ink text-paper shadow-soft"
          : "border-line bg-surface shadow-soft"
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "grid size-10 place-items-center rounded-xl",
            accent ? "bg-brand text-night" : "bg-ink/[0.05] text-ink"
          )}
        >
          {icon}
        </span>
        {sub}
      </div>
      <p
        className={cn(
          "mt-4 text-2xl font-bold tracking-tight sm:text-[28px]",
          accent ? "text-white" : "text-ink"
        )}
      >
        {value}
      </p>
      <p className={cn("mt-0.5 text-[13px] font-semibold", accent ? "text-white/50" : "text-ink-soft")}>
        {label}
      </p>
    </div>
  );
}
