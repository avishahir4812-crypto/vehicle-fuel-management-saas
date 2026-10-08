import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { jsonError, readJson } from "@/lib/api";
import { localeSchema } from "@/lib/validation";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

/** Persist the chosen language to the cookie (and the account, if signed in). */
export async function POST(req: Request) {
  try {
    const { locale } = localeSchema.parse(await readJson(req));

    const store = await cookies();
    store.set("fm_locale", locale, {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });

    const user = await getSessionUser();
    if (user) {
      await db.update(users).set({ locale }).where(eq(users.id, user.id));
    }
    return Response.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
