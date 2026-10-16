import { db } from "@/db";
import { users, vehicles } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { jsonError, readJson } from "@/lib/api";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

export const runtime = "nodejs";

const assignDriverSchema = z.object({
  driverId: z.string().uuid().nullable(),
});

/** Owner assigns / un-assigns a driver to a vehicle. */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const owner = await requireUser("owner");
    const { id: vehicleId } = await params;
    const data = assignDriverSchema.parse(await readJson(req));

    // 1️⃣ Vehicle owner ki company ka hona chahiye
    const [vehicle] = await db
      .select({ id: vehicles.id })
      .from(vehicles)
      .where(
        and(
          eq(vehicles.id, vehicleId),
          eq(vehicles.companyId, owner.companyId)
        )
      )
      .limit(1);

    if (!vehicle) {
      return Response.json({ error: "not_found" }, { status: 404 });
    }

    // 2️⃣ Agar driver assign ho raha hai, toh driver bhi same company ka hona chahiye
    if (data.driverId) {
      const [driver] = await db
        .select({ id: users.id })
        .from(users)
        .where(
          and(
            eq(users.id, data.driverId),
            eq(users.companyId, owner.companyId),
            eq(users.role, "driver")
          )
        )
        .limit(1);

      if (!driver) {
        return Response.json({ error: "driver_not_found" }, { status: 404 });
      }
    }

    // 3️⃣ Update
    await db
      .update(vehicles)
      .set({ driverId: data.driverId })
      .where(eq(vehicles.id, vehicleId));

    return Response.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}