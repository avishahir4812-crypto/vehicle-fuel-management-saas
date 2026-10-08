import { db } from "@/db";
import { users } from "@/db/schema";
import { verifyPassword, createSession } from "@/lib/auth";
import { jsonError, readJson } from "@/lib/api";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validation";
import { normalizePhone } from "@/lib/utils";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

/** Accepts a phone number (preferred) or an email address. */
export async function POST(req: Request) {
  try {
    const rl = rateLimit({ key: `login:${clientIp(req)}`, limit: 8, windowMs: 60_000 });
    if (!rl.ok) return Response.json({ error: "rate_limited" }, { status: 429 });

    const { identifier, password } = loginSchema.parse(await readJson(req));

    const isEmail = identifier.includes("@");
    const lookup = isEmail ? identifier.trim().toLowerCase() : normalizePhone(identifier);
    if (!lookup) return Response.json({ error: "invalid_credentials" }, { status: 401 });

    const [user] = await db
      .select()
      .from(users)
      .where(isEmail ? eq(users.email, lookup) : eq(users.phone, lookup))
      .limit(1);

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return Response.json({ error: "invalid_credentials" }, { status: 401 });
    }

    await createSession(user.id);
    return Response.json({
      user: { id: user.id, name: user.name, role: user.role },
    });
  } catch (error) {
    return jsonError(error);
  }
}
