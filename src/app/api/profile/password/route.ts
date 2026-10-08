import { db } from "@/db";
import { users } from "@/db/schema";
import { requireUser, verifyPassword, hashPassword } from "@/lib/auth";
import { jsonError, readJson } from "@/lib/api";
import { passwordField } from "@/lib/validation";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const runtime = "nodejs";

const bodySchema = z.object({
  currentPassword: z.string().min(1).max(100),
  newPassword: passwordField,
});

/** Change password while signed in. */
export async function PUT(req: Request) {
  try {
    const user = await requireUser();
    const { currentPassword, newPassword } = bodySchema.parse(await readJson(req));

    if (!verifyPassword(currentPassword, user.passwordHash)) {
      return Response.json({ error: "wrong_password" }, { status: 403 });
    }
    if (currentPassword === newPassword) {
      return Response.json({ error: "same_password" }, { status: 400 });
    }

    await db
      .update(users)
      .set({ passwordHash: hashPassword(newPassword) })
      .where(eq(users.id, user.id));

    return Response.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
