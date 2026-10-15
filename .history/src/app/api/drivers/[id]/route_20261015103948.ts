import { db } from "@/db";
import { users, sessions, vehicles, fuelEntries } from "@/db/schema";
import { requireUser, ApiError } from "@/lib/auth";
import { jsonError, readJson } from "@/lib/api";
import { idParamSchema, updateDriverSchema } from "@/lib/validation";
import { and, eq, count } from "drizzle-orm";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/drivers/[id]
 * Fetch driver profile details.
 */
export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const owner = await requireUser("owner");
    const { id: rawId } = await params;
    const id = idParamSchema.parse(rawId);

    const [driver] = await db
      .select({
        id: users.id,
        name: users.name,
        phone: users.phone,
        email: users.email,
        role: users.role,
        locale: users.locale,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(
        and(
          eq(users.id, id),
          eq(users.role, "driver"),
          eq(users.companyId, owner.companyId)
        )
      )
      .limit(1);

    if (!driver) throw new ApiError(404, "not_found");

    return Response.json({ driver });
  } catch (error) {
    return jsonError(error);
  }
}

/**
 * PATCH /api/drivers/[id]
 * Update driver profile (Name, Phone, Email).
 */
export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const owner = await requireUser("owner");
    const { id: rawId } = await params;
    const id = idParamSchema.parse(rawId);
    const body = updateDriverSchema.parse(await readJson(req));

    const [updatedDriver] = await db
      .update(users)
      .set(body)
      .where(
        and(
          eq(users.id, id),
          eq(users.role, "driver"),
          eq(users.companyId, owner.companyId)
        )
      )
      .returning({
        id: users.id,
        name: users.name,
        phone: users.phone,
        email: users.email,
      });

    if (!updatedDriver) throw new ApiError(404, "not_found");

    return Response.json({ driver: updatedDriver });
  } catch (error) {
    return jsonError(error);
  }
}

/**
 * DELETE /api/drivers/[id]
 * Revoke driver sessions, unassign from vehicles, and delete driver user account.
 */
export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    const owner = await requireUser("owner");
    const { id: rawId } = await params;
    const id = idParamSchema.parse(rawId);

    // 1. Verify driver exists in owner's company
    const [driver] = await db
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.id, id),
          eq(users.role, "driver"),
          eq(users.companyId, owner.companyId)
        )
      )
      .limit(1);

    if (!driver) throw new ApiError(404, "not_found");

    // 2. Audit Safety: Check if driver has added fuel entries
    const [{ entryCount }] = await db
      .select({ entryCount: count() })
      .from(fuelEntries)
      .where(
        and(
          eq(fuelEntries.driverId, id),
          eq(fuelEntries.companyId, owner.companyId)
        )
      );

    if (Number(entryCount) > 0) {
      return Response.json(
        {
          error: "has_dependencies",
          message: "Is driver dwara fuel entries logged hain. Data integrity ke liye pehle entries handle karein."
        },
        { status: 400 }
      );
    }

    // 3. Unlink driver from assigned vehicles (Set driverId = null)
    await db
      .update(vehicles)
      .set({ driverId: null })
      .where(
        and(
          eq(vehicles.driverId, id),
          eq(vehicles.companyId, owner.companyId)
        )
      );

    // 4. Force Logout: Revoke all active login sessions for this driver
    await db.delete(sessions).where(eq(sessions.userId, id));

    // 5. Delete Driver user account
    await db
      .delete(users)
      .where(
        and(
          eq(users.id, id),
          eq(users.role, "driver"),
          eq(users.companyId, owner.companyId)
        )
      );

    return Response.json({ ok: true, message: "driver_deleted" }, { status: 200 });
  } catch (error) {
    return jsonError(error);
  }
}