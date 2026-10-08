import "server-only";
import { randomBytes, scryptSync, createHash } from "crypto";
import { db } from "@/db";
import { passwordResets, sessions, users } from "@/db/schema";
import { eq, lt } from "drizzle-orm";

const TTL_MINUTES = 15;
const MAX_ATTEMPTS = 5;

/** 6-digit numeric OTP — easy to read out on any phone. */
export function generateOtp(): string {
  return String(100000 + Math.floor(Math.random() * 900000));
}

export function hashOtp(otp: string): string {
  return createHash("sha256").update(otp).digest("hex");
}

export type StartResetResult =
  | { ok: true; otp: string; maskedPhone: string }
  | { ok: false; error: "not_found" | "rate_limited" };

/**
 * Begins a password reset: creates an OTP valid for 15 minutes.
 * The OTP is returned to the caller (in production it would be SMS'd);
 * the UI shows it since we have no SMS provider in this deployment.
 */
export async function startPasswordReset(identifier: string): Promise<StartResetResult> {
  const [user] = await db
    .select()
    .from(users)
    .where(
      identifier.includes("@")
        ? eq(users.email, identifier.trim().toLowerCase())
        : eq(users.phone, identifier.replace(/\D/g, ""))
    )
    .limit(1);
  if (!user) return { ok: false, error: "not_found" };

  // Only one live OTP per user at a time.
  await db.delete(passwordResets).where(eq(passwordResets.userId, user.id));

  const otp = generateOtp();
  await db.insert(passwordResets).values({
    userId: user.id,
    otpHash: hashOtp(otp),
    expiresAt: new Date(Date.now() + TTL_MINUTES * 60_000),
  });

  return {
    ok: true,
    otp,
    maskedPhone: user.phone.replace(/^(\d{2})\d+(\d{3})$/, "$1•••••$2"),
  };
}

export type VerifyResult =
  | { ok: true; userId: string }
  | { ok: false; error: "not_found" | "expired" | "wrong_otp" | "locked" };

/** Checks the OTP and returns the user id on success (does not consume it). */
export async function verifyOtp(identifier: string, otp: string): Promise<VerifyResult> {
  const [user] = await db
    .select()
    .from(users)
    .where(
      identifier.includes("@")
        ? eq(users.email, identifier.trim().toLowerCase())
        : eq(users.phone, identifier.replace(/\D/g, ""))
    )
    .limit(1);
  if (!user) return { ok: false, error: "not_found" };

  const [reset] = await db
    .select()
    .from(passwordResets)
    .where(eq(passwordResets.userId, user.id))
    .limit(1);
  if (!reset) return { ok: false, error: "not_found" };
  if (reset.expiresAt < new Date()) {
    await db.delete(passwordResets).where(eq(passwordResets.id, reset.id));
    return { ok: false, error: "expired" };
  }
  if (reset.attempts >= MAX_ATTEMPTS) {
    await db.delete(passwordResets).where(eq(passwordResets.id, reset.id));
    return { ok: false, error: "locked" };
  }

  if (reset.otpHash !== hashOtp(otp)) {
    await db
      .update(passwordResets)
      .set({ attempts: reset.attempts + 1 })
      .where(eq(passwordResets.id, reset.id));
    return { ok: false, error: "wrong_otp" };
  }

  return { ok: true, userId: user.id };
}

/** Sets a new password after a verified OTP. */
export async function completeReset(identifier: string, otp: string, newPassword: string) {
  const verified = await verifyOtp(identifier, otp);
  if (!verified.ok) return verified;

  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(newPassword, salt, 64).toString("hex");

  await db
    .update(users)
    .set({ passwordHash: `${salt}:${hash}` })
    .where(eq(users.id, verified.userId));

  // OTP is single-use; also kill every existing session for safety.
  await db.delete(passwordResets).where(eq(passwordResets.userId, verified.userId));
  await db.delete(sessions).where(eq(sessions.userId, verified.userId));
  return { ok: true as const, userId: verified.userId };
}

/** Housekeeping: remove expired OTP rows. */
export async function purgeExpiredResets() {
  await db.delete(passwordResets).where(lt(passwordResets.expiresAt, new Date()));
}
