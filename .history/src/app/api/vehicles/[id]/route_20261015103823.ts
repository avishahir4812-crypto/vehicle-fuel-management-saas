import { db } from "@/db";
import { vehicles, fuelEntries } from "@/db/schema";
import { requireUser, ApiError } from "@/lib/auth";
import { jsonError, readJson } from "@/lib/api";
import { idParamSchema, updateVehicleSchema } from "@/lib/validation";
import { and, eq, count } from "drizzle-orm";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/vehicles/[id]
 * Fetch a single vehicle by ID belonging to the owner's company.
 */
export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const user = await requireUser();
    const { id: rawId } = await params;
    const id = idParamSchema.parse(rawId);

    const [vehicle] = await db
      .select()
      .from(vehicles)
      .where(
        and(
          eq(vehicles.id, id),
          eq(vehicles.companyId, user.companyId)
        )
      )
      .limit(1);

    if (!vehicle) throw new ApiError(404, "not_found");

    return Response.json({ vehicle });
  } catch (error) {
    return jsonError(error);
  }
}

/**
 * PATCH /api/vehicles/[id]
 * Update vehicle metadata (Name, Registration Number, Fuel Type, etc.).
 */
export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const owner = await requireUser("owner");
    const { id: rawId } = await params;
    const id = idParamSchema.parse(rawId);
    const body = updateVehicleSchema.parse(await readJson(req));

    const [updatedVehicle] = await db
      .update(vehicles)
      .set(body)
      .where(
        and(
          eq(vehicles.id, id),
          eq(vehicles.companyId, owner.companyId)
        )
      )
      .returning();

    if (!updatedVehicle) throw new ApiError(404, "not_found");

    return Response.json({ vehicle: updatedVehicle });
  } catch (error) {
    return jsonError(error);
  }
}

/**
 * DELETE /api/vehicles/[id]
 * Securely delete a vehicle if no active fuel audit logs exist.
 */
export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    const owner = await requireUser("owner");
    const { id: rawId } = await params;
    const id = idParamSchema.parse(rawId);

    // 1. Check if vehicle exists in owner's company
    const [existingVehicle] = await db
      .select({ id: vehicles.id })
      .from(vehicles)
      .where(
        and(
          eq(vehicles.id, id),
          eq(vehicles.companyId, owner.companyId)
        )
      )
      .limit(1);

    if (!existingVehicle) throw new ApiError(404, "not_found");

    // 2. Safety Audit Check: Verify if fuel entries are tied to this vehicle
    const [{ entryCount }] = await db
      .select({ entryCount: count() })
      .from(fuelEntries)
      .where(
        and(
          eq(fuelEntries.vehicleId, id),
          eq(fuelEntries.companyId, owner.companyId)
        )
      );

    if (Number(entryCount) > 0) {
      return Response.json(
        { 
          error: "has_dependencies", 
          message: "Is vehicle par fuel entries record me hain. Data audit safety ke liye isko delete nahi kiya ja sakta." 
        },
        { status: 400 }
      );
    }

    // 3. Delete vehicle record safely
    await db
      .delete(vehicles)
      .where(
        and(
          eq(vehicles.id, id),
          eq(vehicles.companyId, owner.companyId)
        )
      );

    return Response.json({ ok: true, message: "vehicle_deleted" }, { status: 200 });
  } catch (error) {
    return jsonError(error);
  }
}