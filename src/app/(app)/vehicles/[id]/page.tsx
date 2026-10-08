import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Fuel,
  Gauge,
  TrendingUp,
} from "lucide-react";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";
import { getAssignableDrivers, getVehicleAnalytics, getVehicleById } from "@/lib/queries";
import { getServerLocale } from "@/i18n/server";
import { VEHICLE_IMAGES } from "@/lib/media";
import { formatINR, formatLiters } from "@/lib/utils";
import { Avatar, Badge, Card, EmptyState } from "@/components/ui";
import { FuelChart, type DayPoint } from "@/components/FuelChart";
import { FuelEntryRow } from "@/components/app/FuelEntryRow";
import { AssignDriver } from "@/components/app/AssignDriver";

export const metadata: Metadata = { title: "Vehicle" };

export default async function VehicleDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) notFound();

  const { id } = await params;
  const { month } = await searchParams;
  const { locale, d } = await getServerLocale();
  const tag = locale === "hi" ? "hi-IN" : locale === "gu" ? "gu-IN" : "en-IN";

  const vehicle = await getVehicleById(id);
  if (!vehicle) notFound();

  const canView =
    vehicle.companyId === user.companyId &&
    (user.role === "owner" || vehicle.driverId === user.id);
  if (!canView) notFound();

  const offset = Math.max(-36, Math.min(0, Number.parseInt(month ?? "0", 10) || 0));
  const analytics = await getVehicleAnalytics(vehicle.id, offset);

  let driverName: string | null = null;
  if (vehicle.driverId) {
    const [dr] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, vehicle.driverId))
      .limit(1);
    driverName = dr?.name ?? null;
  }

  const byDay = new Map<number, DayPoint>();
  let monthSpend = 0;
  let monthLiters = 0;
  for (const e of analytics.entries) {
    const day = new Date(e.createdAt).getDate();
    const point = byDay.get(day) ?? { day, amount: 0, liters: 0 };
    point.amount += Number(e.totalAmount);
    point.liters += Number(e.quantityLiters);
    byDay.set(day, point);
    monthSpend += Number(e.totalAmount);
    monthLiters += Number(e.quantityLiters);
  }
  const daysInMonth = new Date(
    analytics.monthStart.getFullYear(),
    analytics.monthStart.getMonth() + 1,
    0
  ).getDate();
  const points = [...byDay.values()].sort((a, b) => a.day - b.day);
  const monthLabel = analytics.monthStart.toLocaleDateString(tag, {
    month: "long",
    year: "numeric",
  });
  const ownerDriverList =
    user.role === "owner" ? await getAssignableDrivers(user.companyId) : [];

  const statChips = [
    { label: d["vdetail.monthSpend"], value: formatINR(monthSpend) },
    { label: d["vdetail.monthFuel"], value: formatLiters(monthLiters) },
    { label: d["vdetail.entries"], value: String(analytics.entries.length) },
    {
      label: d["vdetail.average"],
      value: analytics.entries.length ? formatINR(monthSpend / analytics.entries.length) : d["common.none"],
    },
  ];

  return (
    <div>
      <Link
        href="/vehicles"
        className="inline-flex items-center gap-1.5 text-sm font-bold text-ink-soft transition hover:text-ink"
      >
        <ArrowLeft className="size-4" />
        {d["nav.vehicles"]}
      </Link>

      {/* ---------- Header card ---------- */}
      <Card className="mt-4 overflow-hidden">
        <div className="relative h-44 sm:h-52">
          <Image
            src={VEHICLE_IMAGES[vehicle.type] ?? VEHICLE_IMAGES.other}
            alt={vehicle.name}
            fill
            priority
            sizes="(max-width: 1152px) 100vw, 1152px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-night/85 via-night/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-3 p-5">
            <div>
              <div className="mb-2 flex gap-1.5">
                <Badge tone="amber" className="bg-brand text-night">
                  {d[`vehicleType.${vehicle.type}` as keyof typeof d]}
                </Badge>
                <Badge className="bg-white/15 text-white backdrop-blur">
                  {d[`fuelType.${vehicle.fuelType}` as keyof typeof d]}
                </Badge>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {vehicle.name}
              </h1>
              <p className="mt-1 font-mono text-sm font-semibold tracking-wide text-white/70">
                {vehicle.registrationNumber}
              </p>
            </div>
            {user.role === "driver" && (
              <Link
                href={`/fuel/new?vehicle=${vehicle.id}`}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-night shadow-amber transition hover:bg-brand-deep hover:text-white"
              >
                <Fuel className="size-4" />
                {d["vdetail.addEntry"]}
              </Link>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4">
          <span className="flex items-center gap-2 text-sm text-ink-soft">
            <Gauge className="size-4" />
            <span className="font-semibold">{d["vdetail.lastOdometer"]}:</span>
            <span className="font-bold text-ink">
              {analytics.lastOdometer != null
                ? `${analytics.lastOdometer.toLocaleString("en-IN")} km`
                : d["common.none"]}
            </span>
          </span>

          <span className="flex items-center gap-2.5 text-sm">
            {driverName ? (
              <>
                <Avatar name={driverName} id={vehicle.driverId!} size="sm" />
                <span className="font-semibold text-ink">{driverName}</span>
              </>
            ) : (
              <span className="font-semibold italic text-ink-soft/70">{d["common.unassigned"]}</span>
            )}
          </span>

          {user.role === "owner" && (
            <span className="ml-auto">
              <AssignDriver
                vehicleId={vehicle.id}
                currentDriverId={vehicle.driverId}
                drivers={ownerDriverList}
              />
            </span>
          )}
        </div>
      </Card>

      {/* ---------- Chart ---------- */}
      <Card className="mt-6 p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-base font-bold tracking-tight text-ink">
            <TrendingUp className="size-4.5 text-brand" />
            {d["vdetail.graph"]}
          </h2>
          <div className="flex items-center gap-2">
            <Link
              href={`/vehicles/${vehicle.id}?month=${offset - 1}`}
              scroll={false}
              className="grid size-9 place-items-center rounded-xl border border-line text-ink-soft transition hover:border-line-strong hover:text-ink"
              aria-label="Previous month"
            >
              <ChevronLeft className="size-4" />
            </Link>
            <Link
              href={`/vehicles/${vehicle.id}?month=${offset + 1}`}
              scroll={false}
              aria-disabled={offset === 0}
              className={
                offset === 0
                  ? "pointer-events-none grid size-9 place-items-center rounded-xl border border-line text-ink-soft/30"
                  : "grid size-9 place-items-center rounded-xl border border-line text-ink-soft transition hover:border-line-strong hover:text-ink"
              }
              aria-label="Next month"
            >
              <ChevronRight className="size-4" />
            </Link>
          </div>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {statChips.map((s) => (
            <div key={s.label} className="rounded-2xl bg-paper px-4 py-3">
              <p className="text-lg font-bold tracking-tight text-ink">{s.value}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft/70">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        <FuelChart
          days={daysInMonth}
          points={points}
          monthLabel={monthLabel}
          emptyText={d["vdetail.noEntriesMonth"]}
          labels={{
            amount: d["vdetail.amount"],
            liters: d["vdetail.liters"],
            amountShort: d["vdetail.amount"],
            litersShort: d["vdetail.liters"],
          }}
        />
      </Card>

      {/* ---------- Entry log ---------- */}
      <section className="mt-6">
        <h2 className="text-lg font-bold tracking-tight text-ink">{d["vdetail.fuelLog"]}</h2>
        {analytics.entries.length === 0 ? (
          <EmptyState
            className="mt-4"
            icon={<Fuel className="size-6" />}
            title={d["vdetail.noEntriesMonth"]}
            action={
              user.role === "driver" ? (
                <Link
                  href={`/fuel/new?vehicle=${vehicle.id}`}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-bold text-night shadow-amber transition hover:bg-brand-deep hover:text-white"
                >
                  <Fuel className="size-4" />
                  {d["vdetail.addEntry"]}
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className="mt-4 divide-y divide-line overflow-hidden rounded-card border border-line bg-surface shadow-soft">
            {[...analytics.entries].reverse().map((e) => (
              <FuelEntryRow key={e.id} entry={e} showDriver={user.role === "owner"} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
