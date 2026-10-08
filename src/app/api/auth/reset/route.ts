import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { jsonError, readJson } from "@/lib/api";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { verifyOtp } from "@/lib/reset";
import { hashPassword } from "@/lib/auth";
import { passwordField } from "@/lib/validation";
import { normalizePhone } from "@/lib/utils";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const runtime = "nodejs";

const bodySchema = z.object({
  identifier: z.string().trim().min(3).max(120),
  otp: z.string().trim().regex(/^\d{6}$/, "invalid_otp"),
  newPassword: passwordField,
});

/**
 * Final step: verify the OTP and set the new password.
 * All existing sessions are signed out afterwards.
 */
export async function POST(req: Request) {
  try {
    const rl = rateLimit({ key: `reset:${clientIp(req)}`, limit: 10, windowMs: 60_000 });
    if (!rl.ok) return Response.json({ error: "rate_limited" }, { status: 429 });

    const { identifier, otp, newPassword } = bodySchema.parse(await readJson(req));
    const lookup = identifier.includes("@")
      ? identifier.trim().toLowerCase()
      : normalizePhone(identifier);

    const verified = await verifyOtp(lookup, otp);
    if (!verified.ok) {
      return Response.json({ error: verified.error }, { status: 400 });
    }

    await db
      .update(users)
      .set({ passwordHash: hashPassword(newPassword) })
      .where(eq(users.id, verified.userId));

    // Single-use OTP + sign out everywhere for safety.
    await db.delete(sessions).where(eq(sessions.userId, verified.userId));

    return Response.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
