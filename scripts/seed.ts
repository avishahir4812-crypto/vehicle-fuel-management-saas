/**
 * Demo data seeder — run with: npx tsx scripts/seed.ts
 * Idempotent: clears the demo company and rebuilds it.
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { scryptSync, randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import * as schema from "../src/db/schema";
import { detectAnomalies, encodeAnomalies } from "../src/lib/anomaly";

const databaseUrl =
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:5432/app_db";

const pool = new Pool({ connectionString: databaseUrl });
const db = drizzle(pool, { schema });

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

const BEFORE = "/api/uploads/0b1c2d3e-4f5a-4b6c-9d8e-111111111111.jpg";
const AFTER = "/api/uploads/0b1c2d3e-4f5a-4b6c-9d8e-222222222222.jpg";
const PUMP = "/api/uploads/0b1c2d3e-4f5a-4b6c-9d8e-333333333333.jpg";

const COMPANY = "Shakti Transport";
const JOIN_KEY = "GJ7KM";

function daysAgo(n: number, hour = 8 + Math.floor(Math.random() * 10)): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, Math.floor(Math.random() * 59), 0, 0);
  return d;
}

async function main() {
  await db.delete(schema.companies).where(eq(schema.companies.joinKey, JOIN_KEY));

  const trialEnds = new Date();
  trialEnds.setDate(trialEnds.getDate() + 10);

  const [company] = await db
    .insert(schema.companies)
    .values({
      name: COMPANY,
      joinKey: JOIN_KEY,
      plan: "trial",
      subStatus: "trialing",
      periodEnd: trialEnds,
      createdAt: daysAgo(150),
    })
    .returning();

  const [owner] = await db
    .insert(schema.users)
    .values({
      name: "Priya Deshmukh",
      phone: "9876500001",
      email: "owner@fleetfuel.com",
      passwordHash: hashPassword("fleet2026"),
      role: "owner",
      companyId: company.id,
      createdAt: daysAgo(150),
    })
    .returning();

  const [ramesh, suresh] = await db
    .insert(schema.users)
    .values([
      {
        name: "Ramesh Patel",
        phone: "9876500002",
        email: "ramesh@fleetfuel.com",
        passwordHash: hashPassword("driver2026"),
        role: "driver" as const,
        companyId: company.id,
        createdAt: daysAgo(120),
      },
      {
        name: "Suresh Chaudhary",
        phone: "9876500003",
        passwordHash: hashPassword("driver2026"),
        role: "driver" as const,
        companyId: company.id,
        createdAt: daysAgo(100),
      },
    ])
    .returning();

  const [bolero, truck, dmax] = await db
    .insert(schema.vehicles)
    .values([
      {
        companyId: company.id,
        ownerId: owner.id,
        driverId: ramesh.id,
        name: "Bolero Pik-Up · Unit 1",
        type: "bolero" as const,
        registrationNumber: "GJ 05 AB 1234",
        fuelType: "diesel",
        createdAt: daysAgo(90),
      },
      {
        companyId: company.id,
        ownerId: owner.id,
        driverId: suresh.id,
        name: "Tata LPT 407 Truck",
        type: "truck" as const,
        registrationNumber: "GJ 01 TX 7788",
        fuelType: "diesel",
        createdAt: daysAgo(120),
      },
      {
        companyId: company.id,
        ownerId: owner.id,
        driverId: ramesh.id,
        name: "Isuzu D-Max Pickup",
        type: "pickup" as const,
        registrationNumber: "GJ 07 PU 4567",
        fuelType: "diesel",
        createdAt: daysAgo(60),
      },
      {
        companyId: company.id,
        ownerId: owner.id,
        driverId: null,
        name: "Ashok Leyland Dost XL",
        type: "other" as const,
        registrationNumber: "GJ 27 KT 9012",
        fuelType: "cng",
        createdAt: daysAgo(20),
      },
    ])
    .returning();

  async function seedFuel(
    vehicle: { id: string },
    driverId: string,
    baseKm: number,
    dayOffsets: number[],
    rateBase: number,
    qtyBase: number,
    /** Indexes that should intentionally trip an anomaly (shown red). */
    spikeAt: number[] = []
  ) {
    let km = baseKm;
    let lastRate: number | null = null;
    for (let i = 0; i < dayOffsets.length; i++) {
      const spike = spikeAt.includes(i);
      const rate = spike ? rateBase * 1.42 : rateBase + Math.random() * 2.2;
      const qty = qtyBase + Math.round(Math.random() * 14);
      const amount = Math.round(rate * qty * 100) / 100;
      km += spike ? 5200 : 85 + Math.floor(Math.random() * 95);

      const codes = detectAnomalies({
        fuelRate: rate,
        quantityLiters: qty,
        totalAmount: amount,
        odometerKm: km,
        lastRate,
        lastOdometerKm: i === 0 ? null : km - (spike ? 5200 : 120),
      });

      await db.insert(schema.fuelEntries).values({
        companyId: company.id,
        vehicleId: vehicle.id,
        driverId,
        fuelRate: rate.toFixed(2),
        quantityLiters: qty.toFixed(2),
        totalAmount: amount.toFixed(2),
        odometerKm: km,
        beforePhotoUrl: BEFORE,
        afterPhotoUrl: AFTER,
        pumpPhotoUrl: Math.random() > 0.45 ? PUMP : null,
        note:
          Math.random() > 0.7
            ? ["HP pump · NH48", "Indian Oil · Ring Road", "BP pump · Sanand"][i % 3]
            : null,
        anomaly: encodeAnomalies(codes),
        createdAt: daysAgo(dayOffsets[i]),
      });
      lastRate = rate;
    }
  }

  // Spread across this month and the two before it, so the calendar has history.
  await seedFuel(truck, suresh.id, 121_400, [68, 61, 54, 47, 40, 34, 27, 20, 14, 9, 5, 2, 0], 93.4, 40, [7]);
  await seedFuel(bolero, ramesh.id, 83_900, [72, 64, 57, 49, 41, 33, 26, 18, 11, 6, 3, 1], 92.9, 24, [9]);
  await seedFuel(dmax, ramesh.id, 45_200, [66, 58, 44, 36, 23, 15, 8, 4, 0], 93.9, 28);

  // Single combined company thread.
  const [thread] = await db
    .insert(schema.conversations)
    .values({ companyId: company.id, createdAt: daysAgo(40) })
    .returning();

  await db.insert(schema.messages).values([
    { conversationId: thread.id, senderId: owner.id, body: "Sabko namaste 🙏 Is group me sab fuel updates aur routes share karo.", createdAt: daysAgo(6, 9) },
    { conversationId: thread.id, senderId: ramesh.id, body: "Ji madam. Bolero ka aaj ka entry daal diya hai.", createdAt: daysAgo(6, 10) },
    { conversationId: thread.id, senderId: suresh.id, body: "@Priya Deshmukh truck Ahmedabad se nikal gaya, shaam tak Rajkot pahunch jayega.", createdAt: daysAgo(3, 16) },
    { conversationId: thread.id, senderId: owner.id, body: "@Suresh Chaudhary badhiya. Diesel rate 94 se upar ja raha hai — full tank hi karwana.", createdAt: daysAgo(1, 9) },
    { conversationId: thread.id, senderId: ramesh.id, body: "Madam, kal subah 6 baje Sanand pump se nikalunga.", createdAt: daysAgo(0, 8) },
  ]);

  // Drivers have caught up; the owner has unread messages.
  await db.insert(schema.conversationReads).values([
    { conversationId: thread.id, userId: ramesh.id, lastReadAt: new Date() },
    { conversationId: thread.id, userId: suresh.id, lastReadAt: new Date() },
    { conversationId: thread.id, userId: owner.id, lastReadAt: daysAgo(2) },
  ]);

  console.log(`Seeded company "${COMPANY}" (key ${JOIN_KEY})`);
  console.log("  owner  → 9876500001 / fleet2026");
  console.log("  driver → 9876500002 / driver2026 (Ramesh)");
  console.log("  driver → 9876500003 / driver2026 (Suresh)");
}

main()
  .then(() => pool.end())
  .catch((err) => {
    console.error(err);
    pool.end();
    process.exit(1);
  });
