import "server-only";
import { unstable_cache } from "next/cache";
import { db } from "@/db";
import {
  fuelEntries,
  users,
  vehicles,
  type FuelEntry,
  type User,
  type Vehicle,
} from "@/db/schema";
import { and, desc, eq, gte, lt, inArray, sql } from "drizzle-orm";
import { pyGet } from "@/lib/py-client";
import { dataCacheTags } from "@/lib/data-cache";

const DATA_CACHE_SECONDS = 60;

function cachedQuery<T>(
  keyParts: string[],
  tags: string[],
  load: () => Promise<T>,
  revive: (value: T) => T = (value) => value
): Promise<T> {
  return unstable_cache(load, keyParts, {
    tags,
    revalidate: DATA_CACHE_SECONDS,
  })().then(revive);
}

/* ---------- Python service payload shapes ---------- */

type PyEntry = Omit<FuelEntryWithNames, "createdAt"> & { createdAt: string };
type PyCard = Omit<VehicleCard, "createdAt"> & { createdAt: string };

const reviveEntries = (rows: PyEntry[]): FuelEntryWithNames[] =>
  rows.map((e) => ({ ...e, createdAt: new Date(e.createdAt) }));
const reviveCards = (rows: PyCard[]): VehicleCard[] =>
  rows.map((c) => ({ ...c, createdAt: new Date(c.createdAt) }));

/* ---------- time helpers ---------- */

export function monthRange(offset = 0): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 1);
  return { start, end };
}

/* ---------- shapes ---------- */

export type MonthStats = { spend: number; liters: number; entries: number };

export type VehicleCard = Vehicle & {
  driverName: string | null;
  month: MonthStats;
  lastOdometer: number | null;
};

export type FuelEntryWithNames = FuelEntry & {
  vehicleName: string;
  driverName: string;
};

type JoinedRow = { entry: FuelEntry; vehicleName: string; driverName: string };
const flatten = (rows: JoinedRow[]): FuelEntryWithNames[] =>
  rows.map((r) => ({ ...r.entry, vehicleName: r.vehicleName, driverName: r.driverName }));

function reviveDate(value: Date): Date {
  return value instanceof Date ? value : new Date(String(value));
}

const reviveFuelEntry = (entry: FuelEntryWithNames): FuelEntryWithNames => ({
  ...entry,
  createdAt: reviveDate(entry.createdAt),
});

const reviveVehicleCard = (card: VehicleCard): VehicleCard => ({
  ...card,
  createdAt: reviveDate(card.createdAt),
});

const entrySelect = {
  entry: fuelEntries,
  vehicleName: vehicles.name,
  driverName: users.name,
};

function joinedEntries() {
  return db
    .select(entrySelect)
    .from(fuelEntries)
    .innerJoin(vehicles, eq(vehicles.id, fuelEntries.vehicleId))
    .innerJoin(users, eq(users.id, fuelEntries.driverId));
}

/* ---------- aggregates ---------- */

async function statsForVehicleIds(ids: string[], start: Date, end: Date) {
  const map = new Map<string, MonthStats>();
  if (ids.length === 0) return map;
  const rows = await db
    .select({
      vehicleId: fuelEntries.vehicleId,
      spend: sql<number>`coalesce(sum(${fuelEntries.totalAmount}::numeric), 0)::float8`,
      liters: sql<number>`coalesce(sum(${fuelEntries.quantityLiters}::numeric), 0)::float8`,
      entries: sql<number>`count(*)::int`,
    })
    .from(fuelEntries)
    .where(
      and(
        inArray(fuelEntries.vehicleId, ids),
        gte(fuelEntries.createdAt, start),
        lt(fuelEntries.createdAt, end)
      )
    )
    .groupBy(fuelEntries.vehicleId);
  for (const r of rows) {
    map.set(r.vehicleId, { spend: r.spend, liters: r.liters, entries: r.entries });
  }
  return map;
}

async function lastOdometers(ids: string[]) {
  const map = new Map<string, number>();
  if (ids.length === 0) return map;
  const rows = await db
    .select({
      vehicleId: fuelEntries.vehicleId,
      km: sql<number>`max(${fuelEntries.odometerKm})::int`,
    })
    .from(fuelEntries)
    .where(inArray(fuelEntries.vehicleId, ids))
    .groupBy(fuelEntries.vehicleId);
  for (const r of rows) map.set(r.vehicleId, r.km);
  return map;
}

async function vehicleCards(base: Vehicle[]): Promise<VehicleCard[]> {
  if (base.length === 0) return [];
  const ids = base.map((v) => v.id);
  const { start, end } = monthRange(0);
  const driverIds = [...new Set(base.map((v) => v.driverId).filter(Boolean))] as string[];
  const [stats, odos, driverRows] = await Promise.all([
    statsForVehicleIds(ids, start, end),
    lastOdometers(ids),
    driverIds.length
      ? db
          .select({ id: users.id, name: users.name })
          .from(users)
          .where(inArray(users.id, driverIds))
      : Promise.resolve([]),
  ]);
  const names = new Map(driverRows.map((d) => [d.id, d.name]));
  return base.map((v) => ({
    ...v,
    driverName: v.driverId ? names.get(v.driverId) ?? null : null,
    month: stats.get(v.id) ?? { spend: 0, liters: 0, entries: 0 },
    lastOdometer: odos.get(v.id) ?? null,
  }));
}

/* ---------- dashboards (company scoped) ---------- */

export type OwnerOverview = {
  spend: number;
  liters: number;
  entries: number;
  prevSpend: number;
  vehicleCount: number;
  driverCount: number;
  flagged: number;
  recent: FuelEntryWithNames[];
  cards: VehicleCard[];
};

export function getOwnerOverview(companyId: string): Promise<OwnerOverview> {
  return cachedQuery(
    ["owner-overview", companyId],
    [dataCacheTags.company(companyId)],
    () => getOwnerOverviewUncached(companyId),
    (overview) => ({
      ...overview,
      recent: overview.recent.map(reviveFuelEntry),
      cards: overview.cards.map(reviveVehicleCard),
    })
  );
}

async function getOwnerOverviewUncached(companyId: string): Promise<OwnerOverview> {
  // Fast path — Python analytics service.
  const py = await pyGet<
    Omit<OwnerOverview, "recent" | "cards"> & { recent: PyEntry[]; cards: PyCard[] }
  >("/analytics/owner-overview", { company_id: companyId });
  if (py) {
    return { ...py, recent: reviveEntries(py.recent), cards: reviveCards(py.cards) };
  }

  const [fleet, driverRow] = await Promise.all([
    db
      .select()
      .from(vehicles)
      .where(eq(vehicles.companyId, companyId))
      .orderBy(desc(vehicles.createdAt)),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(and(eq(users.companyId, companyId), eq(users.role, "driver"))),
  ]);
  const ids = fleet.map((v) => v.id);

  const { start, end } = monthRange(0);
  const prev = monthRange(-1);

  const current = { spend: 0, liters: 0, entries: 0 };
  let prevSpend = 0;
  let recent: FuelEntryWithNames[] = [];
  let flagged = 0;

  if (ids.length > 0) {
    const [stats, prevStats, recentRows, flaggedRow] = await Promise.all([
      statsForVehicleIds(ids, start, end),
      statsForVehicleIds(ids, prev.start, prev.end),
      joinedEntries()
        .where(inArray(fuelEntries.vehicleId, ids))
        .orderBy(desc(fuelEntries.createdAt))
        .limit(6),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(fuelEntries)
        .where(
          and(
            eq(fuelEntries.companyId, companyId),
            gte(fuelEntries.createdAt, start),
            sql`${fuelEntries.anomaly} is not null`
          )
        ),
    ]);
    for (const s of stats.values()) {
      current.spend += s.spend;
      current.liters += s.liters;
      current.entries += s.entries;
    }
    for (const s of prevStats.values()) prevSpend += s.spend;
    recent = flatten(recentRows);
    flagged = flaggedRow[0]?.count ?? 0;
  }

  const cards = await vehicleCards(fleet);

  return {
    spend: current.spend,
    liters: current.liters,
    entries: current.entries,
    prevSpend,
    vehicleCount: fleet.length,
    driverCount: driverRow[0]?.count ?? 0,
    flagged,
    recent,
    cards,
  };
}

export type DriverOverview = {
  cards: VehicleCard[];
  recent: FuelEntryWithNames[];
  monthSpend: number;
  monthLiters: number;
  monthEntries: number;
};

export function getDriverOverview(driverId: string): Promise<DriverOverview> {
  return cachedQuery(
    ["driver-overview", driverId],
    [dataCacheTags.driver(driverId)],
    () => getDriverOverviewUncached(driverId),
    (overview) => ({
      ...overview,
      recent: overview.recent.map(reviveFuelEntry),
      cards: overview.cards.map(reviveVehicleCard),
    })
  );
}

async function getDriverOverviewUncached(driverId: string): Promise<DriverOverview> {
  const py = await pyGet<
    Omit<DriverOverview, "recent" | "cards"> & { recent: PyEntry[]; cards: PyCard[] }
  >("/analytics/driver-overview", { driver_id: driverId });
  if (py) {
    return { ...py, recent: reviveEntries(py.recent), cards: reviveCards(py.cards) };
  }

  const { start, end } = monthRange(0);
  const [assigned, rows] = await Promise.all([
    db
      .select()
      .from(vehicles)
      .where(eq(vehicles.driverId, driverId))
      .orderBy(desc(vehicles.createdAt)),
    joinedEntries()
      .where(
        and(
          eq(fuelEntries.driverId, driverId),
          gte(fuelEntries.createdAt, start),
          lt(fuelEntries.createdAt, end)
        )
      )
      .orderBy(desc(fuelEntries.createdAt))
      .limit(30),
  ]);
  const recent = flatten(rows);
  const cards = await vehicleCards(assigned);

  let monthSpend = 0;
  let monthLiters = 0;
  for (const r of recent) {
    monthSpend += Number(r.totalAmount);
    monthLiters += Number(r.quantityLiters);
  }

  return {
    cards,
    recent: recent.slice(0, 8),
    monthSpend,
    monthLiters,
    monthEntries: recent.length,
  };
}

/* ---------- vehicles ---------- */

export function getCompanyVehicles(companyId: string): Promise<VehicleCard[]> {
  return cachedQuery(
    ["company-vehicles", companyId],
    [dataCacheTags.company(companyId)],
    async () => {
      const rows = await db
        .select()
        .from(vehicles)
        .where(eq(vehicles.companyId, companyId))
        .orderBy(desc(vehicles.createdAt));
      return vehicleCards(rows);
    },
    (cards) => cards.map(reviveVehicleCard)
  );
}

export function getDriverVehicles(driverId: string): Promise<VehicleCard[]> {
  return cachedQuery(
    ["driver-vehicles", driverId],
    [dataCacheTags.driver(driverId)],
    async () => {
      const rows = await db
        .select()
        .from(vehicles)
        .where(eq(vehicles.driverId, driverId))
        .orderBy(desc(vehicles.createdAt));
      return vehicleCards(rows);
    },
    (cards) => cards.map(reviveVehicleCard)
  );
}

export async function getVehicleById(id: string) {
  const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, id)).limit(1);
  return vehicle ?? null;
}

export function getVehicleAnalytics(
  vehicleId: string,
  offset: number,
  companyId: string
) {
  return cachedQuery(
    ["vehicle-analytics", companyId, vehicleId, String(offset)],
    [dataCacheTags.company(companyId), dataCacheTags.vehicle(vehicleId)],
    () => getVehicleAnalyticsUncached(vehicleId, offset),
    (analytics) => ({
      ...analytics,
      entries: analytics.entries.map(reviveFuelEntry),
      monthStart: reviveDate(analytics.monthStart),
      monthEnd: reviveDate(analytics.monthEnd),
    })
  );
}

async function getVehicleAnalyticsUncached(vehicleId: string, offset: number) {
  const py = await pyGet<{
    entries: PyEntry[];
    lastOdometer: number | null;
    monthStart: string;
    monthEnd: string;
  }>("/analytics/vehicle", { vehicle_id: vehicleId, offset });
  if (py) {
    return {
      entries: reviveEntries(py.entries),
      lastOdometer: py.lastOdometer,
      monthStart: new Date(py.monthStart),
      monthEnd: new Date(py.monthEnd),
    };
  }

  const { start, end } = monthRange(offset);
  const [rows, odos] = await Promise.all([
    joinedEntries()
      .where(
        and(
          eq(fuelEntries.vehicleId, vehicleId),
          gte(fuelEntries.createdAt, start),
          lt(fuelEntries.createdAt, end)
        )
      )
      .orderBy(fuelEntries.createdAt),
    lastOdometers([vehicleId]),
  ]);
  return {
    entries: flatten(rows),
    lastOdometer: odos.get(vehicleId) ?? null,
    monthStart: start,
    monthEnd: end,
  };
}

/* ---------- calendar history ---------- */

export type CalendarMonth = {
  entries: FuelEntryWithNames[];
  monthStart: Date;
  daysInMonth: number;
  totals: { spend: number; liters: number; count: number; flagged: number };
};

/**
 * All entries in one month, scoped to the company (owner) or driver.
 * Powers the calendar view — any past month, any day.
 */
export function getCalendarMonth(
  scope: { companyId: string } | { driverId: string },
  offset: number
): Promise<CalendarMonth> {
  const scopeKey =
    "companyId" in scope ? `company-${scope.companyId}` : `driver-${scope.driverId}`;
  const scopeTag =
    "companyId" in scope
      ? dataCacheTags.company(scope.companyId)
      : dataCacheTags.driver(scope.driverId);
  return cachedQuery(
    ["calendar-month", scopeKey, String(offset)],
    [scopeTag],
    () => getCalendarMonthUncached(scope, offset),
    (month) => ({
      ...month,
      entries: month.entries.map(reviveFuelEntry),
      monthStart: reviveDate(month.monthStart),
    })
  );
}

async function getCalendarMonthUncached(
  scope: { companyId: string } | { driverId: string },
  offset: number
): Promise<CalendarMonth> {
  const py = await pyGet<{
    entries: PyEntry[];
    monthStart: string;
    daysInMonth: number;
    totals: CalendarMonth["totals"];
  }>(
    "/analytics/calendar",
    "companyId" in scope
      ? { company_id: scope.companyId, offset }
      : { driver_id: scope.driverId, offset }
  );
  if (py) {
    return {
      entries: reviveEntries(py.entries),
      monthStart: new Date(py.monthStart),
      daysInMonth: py.daysInMonth,
      totals: py.totals,
    };
  }

  const { start, end } = monthRange(offset);
  const scopeFilter =
    "companyId" in scope
      ? eq(fuelEntries.companyId, scope.companyId)
      : eq(fuelEntries.driverId, scope.driverId);

  const rows = await joinedEntries()
    .where(and(scopeFilter, gte(fuelEntries.createdAt, start), lt(fuelEntries.createdAt, end)))
    .orderBy(fuelEntries.createdAt);

  const entries = flatten(rows);
  const totals = { spend: 0, liters: 0, count: entries.length, flagged: 0 };
  for (const e of entries) {
    totals.spend += Number(e.totalAmount);
    totals.liters += Number(e.quantityLiters);
    if (e.anomaly) totals.flagged += 1;
  }

  return {
    entries,
    monthStart: start,
    daysInMonth: new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate(),
    totals,
  };
}

/* ---------- people (company scoped) ---------- */

export type DriverWithVehicles = Pick<User, "id" | "name" | "phone" | "email" | "createdAt"> & {
  assignedVehicles: Vehicle[];
};

export function getCompanyDrivers(companyId: string): Promise<DriverWithVehicles[]> {
  return cachedQuery(
    ["company-drivers", companyId],
    [dataCacheTags.company(companyId)],
    async () => {
      const [drivers, owned] = await Promise.all([
        db
          .select({
            id: users.id,
            name: users.name,
            phone: users.phone,
            email: users.email,
            createdAt: users.createdAt,
          })
          .from(users)
          .where(and(eq(users.companyId, companyId), eq(users.role, "driver")))
          .orderBy(users.name),
        db
          .select()
          .from(vehicles)
          .where(eq(vehicles.companyId, companyId)),
      ]);

      if (drivers.length === 0) return [];

      return drivers.map((driver) => ({
        ...driver,
        assignedVehicles: owned.filter((vehicle) => vehicle.driverId === driver.id),
      }));
    },
    (drivers) =>
      drivers.map((driver) => ({
        ...driver,
        createdAt: reviveDate(driver.createdAt),
        assignedVehicles: driver.assignedVehicles.map((vehicle) => ({
          ...vehicle,
          createdAt: reviveDate(vehicle.createdAt),
        })),
      }))
  );
}

/** Driver picker for vehicle assignment — company members only. */
export function getAssignableDrivers(companyId: string) {
  return cachedQuery(
    ["assignable-drivers", companyId],
    [dataCacheTags.company(companyId)],
    () =>
      db
        .select({ id: users.id, name: users.name, phone: users.phone })
        .from(users)
        .where(and(eq(users.companyId, companyId), eq(users.role, "driver")))
        .orderBy(users.name)
        .limit(200)
  );
}
