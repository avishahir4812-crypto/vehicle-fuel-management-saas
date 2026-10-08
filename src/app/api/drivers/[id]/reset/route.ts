import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { requireUser, hashPassword } from "@/lib/auth";
import { jsonError } from "@/lib/api";
import { and, eq } from "drizzle-orm";

export const runtime = "nodejs";

/**
 * Owner resets a driver's password directly (driver forgot it, no phone in
 * hand). Generates a fresh password, signs the driver out everywhere, and
 * returns the new credentials for the owner to share.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const owner = await requireUser("owner");
    const { id } = await params;

    const [driver] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.id, id),
          eq(users.role, "driver"),
          eq(users.companyId, owner.companyId)
        )
      )
      .limit(1);
    if (!driver) return Response.json({ error: "not_found" }, { status: 404 });

    const words = ["fleet", "diesel", "road", "cargo", "pump", "truck", "route", "wheel"];
    const password = `${words[Math.floor(Math.random() * words.length)]}${Math.floor(1000 + Math.random() * 8999)}`;

    await db
      .update(users)
      .set({ passwordHash: hashPassword(password) })
      .where(eq(users.id, driver.id));

    // Force re-login on all the driver's devices.
    await db.delete(sessions).where(eq(sessions.userId, driver.id));

    return Response.json({
      ok: true,
      credentials: { phone: driver.phone, password },
    });
  } catch (error) {
    return jsonError(error);
  }
}
