/**
 * Subscription rules — shared by server and client (no server-only imports).
 *
 *  • 10-day free trial on signup
 *  • Monthly  ₹49
 *  • 3 months ₹49×3 − 10%
 *  • 1 year   ₹49×12 − 22%
 *  • Specific phone numbers are free forever (demo accounts)
 */

export const TRIAL_DAYS = 10;
export const BASE_PRICE_PAISE = 4900; // ₹49.00

/** Accounts that never pay — demo / partner numbers. */
export const FREE_FOREVER_PHONES = ["9429680396"];

export type PlanId = "monthly" | "quarterly" | "yearly";

export type PlanDef = {
  id: PlanId;
  months: number;
  discountPct: number;
  /** Final amount charged, in paise. */
  totalPaise: number;
  /** Effective per-month price, in paise. */
  perMonthPaise: number;
  savingsPaise: number;
};

function build(id: PlanId, months: number, discountPct: number): PlanDef {
  const gross = BASE_PRICE_PAISE * months;
  const totalPaise = Math.round((gross * (100 - discountPct)) / 100);
  return {
    id,
    months,
    discountPct,
    totalPaise,
    perMonthPaise: Math.round(totalPaise / months),
    savingsPaise: gross - totalPaise,
  };
}

export const PLANS: Record<PlanId, PlanDef> = {
  monthly: build("monthly", 1, 0),
  quarterly: build("quarterly", 3, 10),
  yearly: build("yearly", 12, 22),
};

export const PLAN_LIST: PlanDef[] = [PLANS.monthly, PLANS.quarterly, PLANS.yearly];

export function isPlanId(value: string): value is PlanId {
  return value === "monthly" || value === "quarterly" || value === "yearly";
}

export function rupees(paise: number): string {
  return (paise / 100).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: paise % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

/* ---------- access evaluation ---------- */

export type Access = {
  /** Whether the company may use the product right now. */
  allowed: boolean;
  plan: "trial" | "monthly" | "quarterly" | "yearly" | "free";
  status: "trialing" | "active" | "expired";
  /** Whole days left; null when the plan never expires. */
  daysLeft: number | null;
  periodEnd: Date | null;
  isFreeForever: boolean;
};

export function evaluateAccess(company: {
  plan: string;
  subStatus: string;
  periodEnd: Date | string | null;
}): Access {
  const plan = company.plan as Access["plan"];

  if (plan === "free") {
    return {
      allowed: true,
      plan: "free",
      status: "active",
      daysLeft: null,
      periodEnd: null,
      isFreeForever: true,
    };
  }

  const end = company.periodEnd ? new Date(company.periodEnd) : null;
  const now = Date.now();
  const expired = !end || end.getTime() <= now;
  const daysLeft = end ? Math.max(0, Math.ceil((end.getTime() - now) / 86_400_000)) : 0;

  return {
    allowed: !expired,
    plan,
    status: expired ? "expired" : plan === "trial" ? "trialing" : "active",
    daysLeft,
    periodEnd: end,
    isFreeForever: false,
  };
}

export function trialEnd(from: Date = new Date()): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + TRIAL_DAYS);
  return d;
}

/** Extends from the later of now / current period end (so renewals stack). */
export function nextPeriodEnd(currentEnd: Date | null, months: number): Date {
  const base =
    currentEnd && currentEnd.getTime() > Date.now() ? new Date(currentEnd) : new Date();
  const end = new Date(base);
  end.setMonth(end.getMonth() + months);
  return end;
}
