import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Droplets,
  Fuel,
  IndianRupee,
  Receipt,
  TrendingDown,
  TrendingUp,
  Truck,
} from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { getDriverOverview, getOwnerOverview } from "@/lib/queries";
import { getServerLocale } from "@/i18n/server";
import { formatDate, formatINR, formatLiters } from "@/lib/utils";
import { Avatar, Badge, EmptyState } from "@/components/ui";
import { StatCard } from "@/components/app/StatCard";
import { VehicleCard } from "@/components/app/VehicleCard";
import { AddVehicleButton } from "@/components/app/AddVehicleButton";

export const metadata: Metadata = { title: "Dashboard" };

function TrendChip({ current, previous, label }: { current: number; previous: number; label: string }) {
  if (previous <= 0) return null;
  const diff = ((current - previous) / previous) * 100;
  const up = diff >= 0;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-[11px] font-bold">
      {up ? <TrendingUp className="size-3 text-emerald-400" /> : <TrendingDown className="size-3 text-red-400" />}
      <span className={up ? "text-emerald-300" : "text-red-300"}>
        {Math.abs(diff).toFixed(0)}%
      </span>
      <span className="text-white/40">{label}</span>
    </span>
  );
}

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) notFound();
  const { locale, d } = await getServerLocale();

  /* ------------------------------ DRIVER ------------------------------ */
  if (user.role === "driver") {
    const ov = await getDriverOverview(user.id);
    return (
      <div>
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              {d["dash.greeting"].replace("{name}", user.name.split(" ")[0])}
            </h1>
            <p className="mt-1 text-[15px] text-ink-soft">{d["dash.driverSub"]}</p>
          </div>
          {ov.cards.length > 0 && (
            <Link
              href={`/fuel/new?vehicle=${ov.cards[0].id}`}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-night shadow-amber transition hover:bg-brand-deep hover:text-white"
            >
              <Fuel className="size-4" />
              {d["dash.quickFuel"]}
            </Link>
          )}
        </header>

        <section className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard accent icon={<Truck className="size-5" />} label={d["dash.myVehicles"]} value={String(ov.cards.length)} />
          <StatCard icon={<IndianRupee className="size-5" />} label={d["dash.spendMonth"]} value={formatINR(ov.monthSpend)} />
          <StatCard icon={<Droplets className="size-5" />} label={d["dash.fuelMonth"]} value={formatLiters(ov.monthLiters)} />
          <StatCard icon={<Receipt className="size-5" />} label={d["dash.entriesMonth"]} value={String(ov.monthEntries)} />
        </section>

        <section className="mt-12">
          <h2 className="text-lg font-bold tracking-tight text-ink">{d["dash.myVehicles"]}</h2>
          {ov.cards.length === 0 ? (
            <EmptyState
              className="mt-4"
              icon={<Truck className="size-6" />}
              title={d["dash.noVehiclesDriver"]}
              desc={d["dash.noVehiclesDriverDesc"]}
            />
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {ov.cards.map((v) => (
                <VehicleCard key={v.id} vehicle={v} driverCta />
              ))}
            </div>
          )}
        </section>

        {ov.recent.length > 0 && (
          <section className="mt-12">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold tracking-tight text-ink">{d["dash.recentActivity"]}</h2>
              <Link href="/history" className="flex items-center gap-1 text-sm font-bold text-brand-deep hover:underline">
                {d["common.viewAll"]}
                <ArrowRight className="size-4" />
              </Link>
            </div>
            <div className="mt-4 divide-y divide-line overflow-hidden rounded-card border border-line bg-surface shadow-soft">
              {ov.recent.slice(0, 5).map((e) => (
                <div key={e.id} className="flex items-center gap-4 px-4 py-3.5 sm:px-5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand/12 text-brand-deep">
                    <Fuel className="size-4.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-ink">{e.vehicleName}</p>
                    <p className="text-xs text-ink-soft">
                      {formatDate(e.createdAt, locale)} · {e.odometerKm.toLocaleString("en-IN")} km
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-ink">{formatINR(e.totalAmount, true)}</p>
                    <p className="text-xs text-ink-soft">{formatLiters(e.quantityLiters)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }

  /* ------------------------------ OWNER ------------------------------ */
  const ov = await getOwnerOverview(user.companyId);
  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            {d["dash.greeting"].replace("{name}", user.name.split(" ")[0])}
          </h1>
          <p className="mt-1 text-[15px] text-ink-soft">{d["dash.ownerSub"]}</p>
        </div>
        <AddVehicleButton />
      </header>

      <section className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          accent
          icon={<IndianRupee className="size-5" />}
          label={d["dash.spendMonth"]}
          value={formatINR(ov.spend)}
          sub={<TrendChip current={ov.spend} previous={ov.prevSpend} label={d["dash.vsLastMonth"]} />}
        />
        <StatCard icon={<Droplets className="size-5" />} label={d["dash.fuelMonth"]} value={formatLiters(ov.liters)} />
        <StatCard icon={<Receipt className="size-5" />} label={d["dash.entriesMonth"]} value={String(ov.entries)} />
        <StatCard
          icon={<Truck className="size-5" />}
          label={d["dash.totalVehicles"]}
          value={String(ov.vehicleCount)}
          sub={
            <Badge tone="neutral" className="self-start">
              {ov.driverCount} {d["dash.totalDrivers"].toLowerCase()}
            </Badge>
          }
        />
      </section>

      {ov.flagged > 0 && (
        <Link
          href="/history"
          className="mt-4 flex items-center gap-3 rounded-card border border-red-300 bg-red-50 px-5 py-4 transition hover:bg-red-100"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-red-600/12 text-red-600">
            <AlertTriangle className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-red-700">
              {d["history.flaggedCount"].replace("{count}", String(ov.flagged))}
            </p>
            <p className="text-xs text-red-600/80">{d["anomaly.title"]}</p>
          </div>
          <ArrowRight className="size-4 text-red-600" />
        </Link>
      )}

      <section className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-ink">{d["dash.myVehicles"]}</h2>
          <Link href="/vehicles" className="flex items-center gap-1 text-sm font-bold text-brand-deep hover:underline">
            {d["common.viewAll"]}
            <ArrowRight className="size-4" />
          </Link>
        </div>
        {ov.cards.length === 0 ? (
          <EmptyState
            className="mt-4"
            icon={<Truck className="size-6" />}
            title={d["vehicles.noVehicles"]}
            desc={d["vehicles.noVehiclesDesc"]}
            action={<AddVehicleButton />}
          />
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {ov.cards.slice(0, 6).map((v) => (
              <VehicleCard key={v.id} vehicle={v} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-bold tracking-tight text-ink">{d["dash.recentActivity"]}</h2>
        {ov.recent.length === 0 ? (
          <EmptyState
            className="mt-4"
            icon={<Fuel className="size-6" />}
            title={d["dash.noActivity"]}
            desc={d["dash.noActivityDesc"]}
          />
        ) : (
          <div className="mt-4 divide-y divide-line overflow-hidden rounded-card border border-line bg-surface shadow-soft">
            {ov.recent.map((e) => (
              <Link
                key={e.id}
                href={`/vehicles/${e.vehicleId}`}
                className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-paper sm:px-5"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand/12 text-brand-deep">
                  <Fuel className="size-4.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-ink">{e.vehicleName}</p>
                  <p className="text-xs text-ink-soft">
                    {formatDate(e.createdAt, locale)} · {formatLiters(e.quantityLiters)} · {e.odometerKm.toLocaleString("en-IN")} km
                  </p>
                </div>
                <span className="hidden items-center gap-1.5 text-xs font-semibold text-ink-soft sm:flex">
                  <Avatar name={e.driverName} id={e.driverId} size="sm" />
                  {e.driverName}
                </span>
                <p className="text-sm font-bold text-ink">{formatINR(e.totalAmount, true)}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
