import { db } from "@/db";
import { fuelEntries, vehicles } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { jsonError, readJson } from "@/lib/api";
import { fuelEntrySchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
import { detectAnomalies, encodeAnomalies } from "@/lib/anomaly";
import { and, desc, eq } from "drizzle-orm";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const user = await requireUser("driver");
    const rl = rateLimit({ key: `fuel:${user.id}`, limit: 20, windowMs: 60_000 });
    if (!rl.ok) return Response.json({ error: "rate_limited" }, { status: 429 });

    const data = fuelEntrySchema.parse(await readJson(req));

    const [vehicle] = await db
      .select()
      .from(vehicles)
      .where(and(eq(vehicles.id, data.vehicleId), eq(vehicles.companyId, user.companyId)))
      .limit(1);
    if (!vehicle) return Response.json({ error: "not_found" }, { status: 404 });
    if (vehicle.driverId !== user.id) {
      return Response.json({ error: "not_assigned" }, { status: 403 });
    }

    // Proof photos are mandatory.
    if (!data.beforePhotoUrl.trim() || !data.afterPhotoUrl.trim()) {
      return Response.json({ error: "photo_required" }, { status: 400 });
    }

    // Hard block: arithmetic must be correct.
    if (Math.abs(data.fuelRate * data.quantityLiters - data.totalAmount) > 1) {
      return Response.json({ error: "total_mismatch" }, { status: 400 });
    }

    const [last] = await db
      .select({
        odometerKm: fuelEntries.odometerKm,
        fuelRate: fuelEntries.fuelRate,
      })
      .from(fuelEntries)
      .where(eq(fuelEntries.vehicleId, data.vehicleId))
      .orderBy(desc(fuelEntries.createdAt))
      .limit(1);

    // Hard block: odometer must move forward.
    if (last && data.odometerKm <= last.odometerKm) {
      return Response.json(
        { error: "km_invalid", lastKm: last.odometerKm },
        { status: 400 }
      );
    }

    // Soft flags: saved, but shown in red for the owner to review.
    const anomalies = detectAnomalies({
      fuelRate: data.fuelRate,
      quantityLiters: data.quantityLiters,
      totalAmount: data.totalAmount,
      odometerKm: data.odometerKm,
      lastRate: last ? Number(last.fuelRate) : null,
      lastOdometerKm: last ? last.odometerKm : null,
    });

    const [entry] = await db
      .insert(fuelEntries)
      .values({
        companyId: user.companyId,
        vehicleId: data.vehicleId,
        driverId: user.id,
        fuelRate: data.fuelRate.toFixed(2),
        quantityLiters: data.quantityLiters.toFixed(2),
        totalAmount: data.totalAmount.toFixed(2),
        odometerKm: data.odometerKm,
        beforePhotoUrl: data.beforePhotoUrl,
        afterPhotoUrl: data.afterPhotoUrl,
        pumpPhotoUrl: data.pumpPhotoUrl ?? null,
        note: data.note ?? null,
        anomaly: encodeAnomalies(anomalies),
      })
      .returning();

    return Response.json({ entry, anomalies }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
