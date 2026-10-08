import { cn } from "@/lib/utils";
import { Fuel } from "lucide-react";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

/* ---------- Logo ---------- */

export function Logo({ dark = false, className }: { dark?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-xl",
          dark ? "bg-brand text-night" : "bg-ink text-brand"
        )}
      >
        <Fuel className="size-4" strokeWidth={2.4} />
      </span>
      <span
        className={cn(
          "text-[17px] font-bold tracking-tight",
          dark ? "text-white" : "text-ink"
        )}
      >
        Fleet<span className="text-brand">Fuel</span>
      </span>
    </span>
  );
}

/* ---------- Buttons ---------- */

type ButtonVariant = "primary" | "brand" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  const variants: Record<ButtonVariant, string> = {
    primary:
      "bg-ink text-paper hover:bg-ink-soft shadow-[0_1px_2px_rgba(23,21,16,0.2)]",
    brand:
      "bg-brand text-night hover:bg-brand-deep hover:text-white shadow-amber",
    outline:
      "border border-line-strong bg-surface text-ink hover:border-ink/40 hover:bg-paper",
    ghost: "text-ink-soft hover:bg-ink/5 hover:text-ink",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };
  const sizes: Record<ButtonSize, string> = {
    sm: "h-8 px-3 text-[13px] rounded-lg gap-1.5",
    md: "h-10 px-4 text-sm rounded-xl gap-2",
    lg: "h-12 px-6 text-[15px] rounded-xl gap-2",
  };
  return (
    <button
      className={cn(
        "inline-flex select-none items-center justify-center font-semibold transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}

/* ---------- Inputs ---------- */

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-[15px] text-ink outline-none transition-all placeholder:text-ink-soft/50 focus:border-brand focus:ring-4 focus:ring-brand/15",
        className
      )}
      {...props}
    />
  );
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-11 w-full appearance-none rounded-xl border border-line bg-surface px-3.5 pr-9 text-[15px] text-ink outline-none transition-all focus:border-brand focus:ring-4 focus:ring-brand/15",
        "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2349463d%22 stroke-width=%222.4%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpath d=%22m6 9 6 6 6-6%22/%3E%3C/svg%3E')] bg-[right_0.85rem_center] bg-no-repeat",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-[13px] font-semibold text-ink-soft">{label}</span>
      {children}
      {hint ? <span className="mt-1.5 block text-xs text-ink-soft/70">{hint}</span> : null}
    </label>
  );
}

/* ---------- Surfaces ---------- */

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-card border border-line bg-surface shadow-soft", className)}>
      {children}
    </div>
  );
}

export function Badge({
  className,
  children,
  tone = "neutral",
}: {
  className?: string;
  children: ReactNode;
  tone?: "neutral" | "amber" | "green" | "red" | "ink";
}) {
  const tones = {
    neutral: "bg-ink/[0.06] text-ink-soft",
    amber: "bg-brand/15 text-brand-ink",
    green: "bg-emerald-600/10 text-emerald-700",
    red: "bg-red-600/10 text-red-600",
    ink: "bg-ink text-paper",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function Avatar({
  name,
  id,
  size = "md",
  className,
}: {
  name: string;
  id: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = { sm: "size-7 text-[10px]", md: "size-9 text-xs", lg: "size-12 text-sm" };
  const palette = [
    "bg-amber-500",
    "bg-emerald-600",
    "bg-sky-600",
    "bg-rose-500",
    "bg-violet-600",
    "bg-teal-600",
  ];
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum = (sum + id.charCodeAt(i)) % 97;
  const color = palette[sum % palette.length];
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full font-bold text-white",
        sizes[size],
        color,
        className
      )}
    >
      {initials}
    </span>
  );
}

/* ---------- Feedback ---------- */

export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("size-4 animate-spin", className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function EmptyState({
  icon,
  title,
  desc,
  action,
  className,
}: {
  icon: ReactNode;
  title: string;
  desc?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-card border border-dashed border-line-strong bg-surface/60 px-6 py-14 text-center",
        className
      )}
    >
      <div className="grid size-12 place-items-center rounded-2xl bg-ink/[0.05] text-ink-soft">
        {icon}
      </div>
      <p className="mt-4 text-[15px] font-bold text-ink">{title}</p>
      {desc ? <p className="mt-1 max-w-sm text-sm text-ink-soft/80">{desc}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
