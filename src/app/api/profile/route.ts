import { db } from "@/db";
import { users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { jsonError, readJson } from "@/lib/api";
import {
  invalidateCompanyCache,
  invalidateDriverCache,
} from "@/lib/data-cache";
import { profileSchema } from "@/lib/validation";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

export async function PATCH(req: Request) {
  try {
    const user = await requireUser();
    const data = profileSchema.parse(await readJson(req));
    await db
      .update(users)
      .set({ name: data.name })
      .where(eq(users.id, user.id));
    invalidateCompanyCache(user.companyId);
    invalidateDriverCache(user.id);
    return Response.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
