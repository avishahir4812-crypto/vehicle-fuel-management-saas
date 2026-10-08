import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword, requireUser } from "@/lib/auth";
import { jsonError, readJson } from "@/lib/api";
import { createDriverSchema } from "@/lib/validation";
import { ensureCompanyThread } from "@/lib/chat";
import { rateLimit } from "@/lib/rate-limit";
import { eq, or } from "drizzle-orm";

export const runtime = "nodejs";

/** Owner creates a driver inside their own company. */
export async function POST(req: Request) {
  try {
    const owner = await requireUser("owner");
    const rl = rateLimit({ key: `mkdriver:${owner.id}`, limit: 20, windowMs: 60_000 });
    if (!rl.ok) return Response.json({ error: "rate_limited" }, { status: 429 });

    const data = createDriverSchema.parse(await readJson(req));

    const clash = await db
      .select({ phone: users.phone })
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

    const [driver] = await db
      .insert(users)
      .values({
        name: data.name,
        phone: data.phone,
        email: data.email ?? null,
        passwordHash: hashPassword(data.password),
        role: "driver",
        companyId: owner.companyId,
        locale: owner.locale,
      })
      .returning();

    await ensureCompanyThread(owner.companyId);

    return Response.json(
      {
        driver: { id: driver.id, name: driver.name, phone: driver.phone },
        credentials: { phone: data.phone, password: data.password },
      },
      { status: 201 }
    );
  } catch (error) {
    return jsonError(error);
  }
}
