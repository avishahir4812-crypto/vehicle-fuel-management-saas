import { db } from "@/db";
import { companies, payments } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { jsonError, readJson } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { PLANS, isPlanId, nextPeriodEnd } from "@/lib/billing";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { z } from "zod";

export const runtime = "nodejs";

const bodySchema = z.object({
  plan: z.string().refine(isPlanId, "invalid_plan"),
});

/**
 * Activates a subscription.
 *
 * No payment gateway is wired in this deployment, so this records the
 * purchase and extends the period immediately. To go live, verify the
 * gateway signature (Razorpay/Stripe webhook) before this insert.
 */
export async function POST(req: Request) {
  try {
    const owner = await requireUser("owner");
    const rl = rateLimit({ key: `sub:${owner.id}`, limit: 10, windowMs: 60_000 });
    if (!rl.ok) return Response.json({ error: "rate_limited" }, { status: 429 });

    const { plan } = bodySchema.parse(await readJson(req));
    const def = PLANS[plan];

    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, owner.companyId))
      .limit(1);
    if (!company) return Response.json({ error: "not_found" }, { status: 404 });

    // Free-forever accounts don't need (and can't buy) a plan.
    if (company.plan === "free") {
      return Response.json({ ok: true, plan: "free", periodEnd: null });
    }

    const periodStart = new Date();
    const periodEnd = nextPeriodEnd(company.periodEnd, def.months);
    const reference = `FF-${randomBytes(5).toString("hex").toUpperCase()}`;

    await db
      .update(companies)
      .set({ plan: def.id, subStatus: "active", periodEnd })
      .where(eq(companies.id, company.id));

    await db.insert(payments).values({
      companyId: company.id,
      plan: def.id,
      amountPaise: def.totalPaise,
      months: def.months,
      periodStart,
      periodEnd,
      reference,
    });

    return Response.json({
      ok: true,
      plan: def.id,
      reference,
      periodEnd: periodEnd.toISOString(),
    });
  } catch (error) {
    return jsonError(error);
  }
}
