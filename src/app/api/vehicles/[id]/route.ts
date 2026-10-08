import { db } from "@/db";
import { users, vehicles } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { jsonError, readJson } from "@/lib/api";
import { assignDriverSchema } from "@/lib/validation";
import { and, eq } from "drizzle-orm";

export const runtime = "nodejs";

/** Assign / unassign a driver from the same company. */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser("owner");
    const { id } = await params;
    const data = assignDriverSchema.parse(await readJson(req));

    if (data.driverId) {
      const [driver] = await db
        .select({ id: users.id, role: users.role, companyId: users.companyId })
        .from(users)
        .where(eq(users.id, data.driverId))
        .limit(1);
      if (!driver || driver.role !== "driver" || driver.companyId !== user.companyId) {
        return Response.json({ error: "invalid_input" }, { status: 400 });
      }
    }

    const [updated] = await db
      .update(vehicles)
      .set({ driverId: data.driverId ?? null })
      .where(and(eq(vehicles.id, id), eq(vehicles.companyId, user.companyId)))
      .returning();

    if (!updated) return Response.json({ error: "not_found" }, { status: 404 });
    return Response.json({ vehicle: updated });
  } catch (error) {
    return jsonError(error);
  }
}
