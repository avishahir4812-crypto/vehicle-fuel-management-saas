import { jsonError, readJson } from "@/lib/api";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { startPasswordReset } from "@/lib/reset";
import { z } from "zod";
import { normalizePhone } from "@/lib/utils";

export const runtime = "nodejs";

const bodySchema = z.object({
  identifier: z.string().trim().min(3).max(120),
});

/**
 * Step 1 of password reset. In a production deployment the OTP is SMS'd to
 * the user's phone; here it is returned for display since no SMS provider
 * is configured. Rate-limited to prevent enumeration.
 */
export async function POST(req: Request) {
  try {
    const rl = rateLimit({ key: `forgot:${clientIp(req)}`, limit: 5, windowMs: 60_000 });
    if (!rl.ok) return Response.json({ error: "rate_limited" }, { status: 429 });

    const { identifier } = bodySchema.parse(await readJson(req));
    const lookup = identifier.includes("@")
      ? identifier.trim().toLowerCase()
      : normalizePhone(identifier);

    const result = await startPasswordReset(lookup);
    if (!result.ok) {
      // Generic response — never reveal whether the account exists.
      return Response.json({ ok: true, sent: true });
    }

    return Response.json({
      ok: true,
      sent: true,
      maskedPhone: result.maskedPhone,
      otp: result.otp,
      channel: "demo",
    });
  } catch (error) {
    return jsonError(error);
  }
}
