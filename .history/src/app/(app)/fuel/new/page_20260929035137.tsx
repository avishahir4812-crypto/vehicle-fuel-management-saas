import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ChevronRight, Truck } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { getDriverVehicles, getVehicleById } from "@/lib/queries";
import { getServerLocale } from "@/i18n/server";
import { EmptyState } from "@/components/ui";
import { FuelEntryForm } from "@/components/app/FuelEntryForm";

export const metadata: Metadata = { title: "Log fuel" };

export default async function NewFuelPage({
  searchParams,
}: {
  searchParams: Promise<{ vehicle?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) notFound();
  if (user.role !== "driver") redirect("/dashboard");

  const { vehicle: vehicleId } = await searchParams;
  const { d } = await getServerLocale();

  const vehicles = await getDriverVehicles(user.id);

  if (vehicles.length === 0) {
    return (
      <div className="mx-auto max-w-lg">
        <EmptyState
          icon={<Truck className="size-6" />}
          title={d["dash.noVehiclesDriver"]}
          desc={d["dash.noVehiclesDriverDesc"]}
        />
      </div>
    );
  }

  // No vehicle chosen yet → auto-select the single one, else show a picker.
  if (!vehicleId) {
    if (vehicles.length === 1) redirect(`/fuel/new?vehicle=${vehicles[0].id}`);
    return (
      <div className="mx-auto max-w-lg">
        <header>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">{d["fuel.title"]}</h1>
          <p className="mt-1 text-[15px] text-ink-soft">{d["fuel.vehicle"]}</p>
        </header>
        <div className="mt-6 space-y-3">
          {vehicles.map((v) => (
            <Link
              key={v.id}
              href={`/fuel/new?vehicle=${v.id}`}
              className="flex items-center justify-between rounded-card border border-line bg-surface px-5 py-4 shadow-soft transition-all hover:-translate-y-0.5 hover:border-brand/50 hover:shadow-lift"
            >
              <div>
                <p className="text-[15px] font-bold text-ink">{v.name}</p>
                <p className="mt-0.5 font-mono text-xs font-semibold text-ink-soft">
                  {v.registrationNumber}
                </p>
              </div>
              <ChevronRight className="size-5 text-ink-soft" />
            </Link>
          ))}
        </div>
      </div>
    );
  }

  const vehicle = await getVehicleById(vehicleId);
  if (!vehicle || vehicle.driverId !== user.id) {
    return (
      <div className="mx-auto max-w-lg">
        <EmptyState
          icon={<Truck className="size-6" />}
          title={d["fuel.notAssigned"]}
          action={
            <Link
              href="/vehicles"
              className="inline-flex h-10 items-center rounded-xl border border-line px-4 text-sm font-bold text-ink"
            >
              {d["common.back"]}
            </Link>
          }
        />
      </div>
    );
  }

  const selected = vehicles.find((v) => v.id === vehicle.id);
  const lastOdometer = selected?.lastOdometer ?? null;

  return (
    <div className="mx-auto max-w-xl">
      <Link
        href={`/vehicles/${vehicle.id}`}
        className="inline-flex items-center gap-1.5 text-sm font-bold text-ink-soft transition hover:text-ink"
      >
        <ArrowLeft className="size-4" />
        {vehicle.name}
      </Link>
      <h1 className="mt-3 text-2xl font-bold tracking-tight text-ink sm:text-3xl">{d["fuel.title"]}</h1>
      <div className="mt-6">
        <FuelEntryForm
          vehicle={{
            id: vehicle.id,
            name: vehicle.name,
            registrationNumber: vehicle.registrationNumber,
            lastOdometer,
          }}
        />
      </div>
    </div>
  );
}
