import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Truck } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { getCompanyVehicles, getDriverVehicles } from "@/lib/queries";
import { getServerLocale } from "@/i18n/server";
import { EmptyState } from "@/components/ui";
import { VehicleCard } from "@/components/app/VehicleCard";
import { AddVehicleButton } from "@/components/app/AddVehicleButton";

export const metadata: Metadata = { title: "Vehicles" };

export default async function VehiclesPage() {
  const user = await getSessionUser();
  if (!user) notFound();
  const { d } = await getServerLocale();

  const isOwner = user.role === "owner";
  const cards = isOwner
    ? await getCompanyVehicles(user.companyId)
    : await getDriverVehicles(user.id);

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            {d["vehicles.title"]}
          </h1>
          <p className="mt-1 text-[15px] text-ink-soft">
            {isOwner ? d["vehicles.sub"] : d["dash.driverSub"]}
          </p>
        </div>
        {isOwner && <AddVehicleButton />}
      </header>

      {cards.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={<Truck className="size-6" />}
          title={isOwner ? d["vehicles.noVehicles"] : d["dash.noVehiclesDriver"]}
          desc={isOwner ? d["vehicles.noVehiclesDesc"] : d["dash.noVehiclesDriverDesc"]}
          action={isOwner ? <AddVehicleButton /> : undefined}
        />
      ) : (
        <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((v) => (
            <VehicleCard key={v.id} vehicle={v} showDriver={isOwner} driverCta={!isOwner} />
          ))}
        </div>
      )}
    </div>
  );
}
