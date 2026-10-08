import { db } from "@/db";
import { vehicles } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { jsonError, readJson } from "@/lib/api";
import { vehicleSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const user = await requireUser("owner");
    const data = vehicleSchema.parse(await readJson(req));
    try {
      const [vehicle] = await db
        .insert(vehicles)
        .values({
          companyId: user.companyId,
          ownerId: user.id,
          name: data.name,
          type: data.type,
          registrationNumber: data.registrationNumber,
          fuelType: data.fuelType,
        })
        .returning();
      return Response.json({ vehicle }, { status: 201 });
    } catch (err) {
      if (err instanceof Error && err.message.includes("vehicles_reg_unique")) {
        return Response.json({ error: "reg_taken" }, { status: 409 });
      }
      throw err;
    }
  } catch (error) {
    return jsonError(error);
  }
}
