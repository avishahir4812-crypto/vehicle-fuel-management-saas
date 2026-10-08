import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Fuel, Gauge } from "lucide-react";
import type { VehicleCard as VehicleCardType } from "@/lib/queries";
import { getServerLocale } from "@/i18n/server";
import { VEHICLE_IMAGES } from "@/lib/media";
import { formatINR, formatLiters } from "@/lib/utils";
import { Avatar, Badge } from "@/components/ui";

/** Presentational vehicle card with this-month stats. */
export async function VehicleCard({
  vehicle,
  showDriver = true,
  driverCta = false,
}: {
  vehicle: VehicleCardType;
  showDriver?: boolean;
  driverCta?: boolean;
}) {
  const { d } = await getServerLocale();
  const typeLabel = d[`vehicleType.${vehicle.type}` as keyof typeof d] ?? vehicle.type;
  const fuelLabel = d[`fuelType.${vehicle.fuelType}` as keyof typeof d] ?? vehicle.fuelType;

  return (
    <div className="group flex flex-col overflow-hidden rounded-card border border-line bg-surface shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift">
      <Link href={`/vehicles/${vehicle.id}`} className="relative block h-36 overflow-hidden" tabIndex={-1}>
        <Image
          src={VEHICLE_IMAGES[vehicle.type] ?? VEHICLE_IMAGES.other}
          alt={vehicle.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-night/70 via-night/10 to-transparent" />
        <div className="absolute left-3 top-3 flex gap-1.5">
          <Badge tone="ink" className="bg-night/70 backdrop-blur">
            {typeLabel}
          </Badge>
          <Badge tone="amber" className="bg-brand/90 text-night backdrop-blur">
            {fuelLabel}
          </Badge>
        </div>
        <div className="absolute bottom-3 right-3 rounded-xl bg-night/70 px-2.5 py-1 text-right text-xs font-bold text-white backdrop-blur">
          {formatINR(vehicle.month.spend)}
          <span className="ml-1 font-medium text-white/60">{d["vehicles.thisMonth"]}</span>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <Link href={`/vehicles/${vehicle.id}`} className="min-w-0">
          <h3 className="truncate text-[15px] font-bold tracking-tight text-ink transition-colors group-hover:text-brand-deep">
            {vehicle.name}
          </h3>
          <p className="mt-0.5 font-mono text-xs font-semibold tracking-wide text-ink-soft">
            {vehicle.registrationNumber}
          </p>
        </Link>

        <div className="mt-3 grid grid-cols-3 gap-2 border-t border-line pt-3 text-center">
          <div>
            <p className="text-sm font-bold text-ink">{formatLiters(vehicle.month.liters)}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-soft/70">
              {d["vdetail.liters"]}
            </p>
          </div>
          <div>
            <p className="text-sm font-bold text-ink">{vehicle.month.entries}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-soft/70">
              {d["vdetail.totalEntries"]}
            </p>
          </div>
          <div>
            <p className="text-sm font-bold text-ink">
              {vehicle.lastOdometer?.toLocaleString("en-IN") ?? d["common.none"]}
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-soft/70">
              km
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2.5 pt-3">
          {showDriver ? (
            vehicle.driverName ? (
              <span className="flex min-w-0 items-center gap-2">
                <Avatar name={vehicle.driverName} id={vehicle.driverId ?? vehicle.id} size="sm" />
                <span className="truncate text-[13px] font-semibold text-ink-soft">
                  {vehicle.driverName}
                </span>
              </span>
            ) : (
              <span className="text-[13px] font-semibold italic text-ink-soft/60">
                {d["common.unassigned"]}
              </span>
            )
          ) : (
            <span className="flex min-w-0 items-center gap-1.5 text-[13px] font-semibold text-ink-soft">
              <Gauge className="size-3.5" />
              {vehicle.lastOdometer
                ? `${vehicle.lastOdometer.toLocaleString("en-IN")} km`
                : d["common.none"]}
            </span>
          )}

          <span className="ml-auto flex items-center gap-2">
            {driverCta ? (
              <Link
                href={`/fuel/new?vehicle=${vehicle.id}`}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-brand px-3 text-xs font-bold text-night shadow-amber transition hover:bg-brand-deep hover:text-white"
              >
                <Fuel className="size-3.5" />
                {d["dash.quickFuel"]}
              </Link>
            ) : (
              <Link
                href={`/vehicles/${vehicle.id}`}
                className="inline-flex h-8 items-center gap-0.5 rounded-lg px-2 text-xs font-bold text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink"
              >
                {d["vehicles.view"]}
                <ChevronRight className="size-3.5" />
              </Link>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
