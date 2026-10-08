import { jsonError, readJson } from "@/lib/api";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { verifyOtp } from "@/lib/reset";
import { normalizePhone } from "@/lib/utils";
import { z } from "zod";

export const runtime = "nodejs";

const bodySchema = z.object({
  identifier: z.string().trim().min(3).max(120),
  otp: z.string().trim().regex(/^\d{6}$/, "invalid_otp"),
});

/** Checks the OTP without consuming it (used by the reset wizard UI). */
export async function POST(req: Request) {
  try {
    const rl = rateLimit({ key: `verify:${clientIp(req)}`, limit: 15, windowMs: 60_000 });
    if (!rl.ok) return Response.json({ error: "rate_limited" }, { status: 429 });

    const { identifier, otp } = bodySchema.parse(await readJson(req));
    const lookup = identifier.includes("@")
      ? identifier.trim().toLowerCase()
      : normalizePhone(identifier);

    const result = await verifyOtp(lookup, otp);
    if (!result.ok) return Response.json({ error: result.error }, { status: 400 });
    return Response.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
