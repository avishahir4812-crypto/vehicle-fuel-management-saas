import { db } from "@/db";
import { companies, users } from "@/db/schema";
import { hashPassword, createSession } from "@/lib/auth";
import { jsonError, readJson } from "@/lib/api";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { signupSchema } from "@/lib/validation";
import { findCompanyByNameAndKey, generateUniqueJoinKey } from "@/lib/company";
import { FREE_FOREVER_PHONES, trialEnd } from "@/lib/billing";
import { ensureCompanyThread } from "@/lib/chat";
import { eq, or } from "drizzle-orm";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const rl = rateLimit({ key: `signup:${clientIp(req)}`, limit: 10, windowMs: 60_000 });
    if (!rl.ok) return Response.json({ error: "rate_limited" }, { status: 429 });

    const data = signupSchema.parse(await readJson(req));

    // Phone is the primary identifier; email is optional but still unique.
    const clash = await db
      .select({ phone: users.phone, email: users.email })
      .from(users)
      .where(
        data.email
          ? or(eq(users.phone, data.phone), eq(users.email, data.email))
          : eq(users.phone, data.phone)
      )
      .limit(1);
    if (clash.length > 0) {
      return Response.json(
        { error: clash[0].phone === data.phone ? "phone_taken" : "email_taken" },
        { status: 409 }
      );
    }

    let companyId: string;
    let joinKey: string | null = null;

    if (data.role === "owner") {
      joinKey = await generateUniqueJoinKey();
      // Demo/partner numbers never pay; everyone else starts a 10-day trial.
      const freeForever = FREE_FOREVER_PHONES.includes(data.phone);
      const [company] = await db
        .insert(companies)
        .values({
          name: data.companyName,
          joinKey,
          plan: freeForever ? "free" : "trial",
          subStatus: freeForever ? "active" : "trialing",
          periodEnd: freeForever ? null : trialEnd(),
        })
        .returning();
      companyId = company.id;
    } else {
      // Driver must match BOTH the company name and its key.
      const company = await findCompanyByNameAndKey(data.companyName, data.joinKey);
      if (!company) {
        return Response.json({ error: "company_not_found" }, { status: 404 });
      }
      companyId = company.id;
    }

    const [user] = await db
      .insert(users)
      .values({
        name: data.name,
        phone: data.phone,
        email: data.email ?? null,
        passwordHash: hashPassword(data.password),
        role: data.role,
        companyId,
      })
      .returning();

    await ensureCompanyThread(companyId);
    await createSession(user.id);

    return Response.json(
      {
        user: { id: user.id, name: user.name, role: user.role },
        company: { id: companyId, joinKey },
      },
      { status: 201 }
    );
  } catch (error) {
    return jsonError(error);
  }
}
