import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Truck } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { getCompanyVehicles, getDriverVehicles } from "@/lib/queries";
import { getServerLocale } from "@/i18n/server";
import type { Dict } from "@/i18n";
import { EmptyState } from "@/components/ui";
import { VehicleCard } from "@/components/app/VehicleCard";
import { AddVehicleButton } from "@/components/app/AddVehicleButton";

export const metadata: Metadata = { title: "Vehicles" };

async function VehicleList({
  userId,
  companyId,
  isOwner,
  d,
}: {
  userId: string;
  companyId: string;
  isOwner: boolean;
  d: Dict;
}) {
  const cards = isOwner
    ? await getCompanyVehicles(companyId)
    : await getDriverVehicles(userId);

  if (cards.length === 0) {
    return (
      <EmptyState
        className="mt-8"
        icon={<Truck className="size-6" />}
        title={isOwner ? d["vehicles.noVehicles"] : d["dash.noVehiclesDriver"]}
        desc={isOwner ? d["vehicles.noVehiclesDesc"] : d["dash.noVehiclesDriverDesc"]}
        action={isOwner ? <AddVehicleButton /> : undefined}
      />
    );
  }

  return (
    <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((v, index) => (
        <VehicleCard
          key={v.id}
          vehicle={v}
          showDriver={isOwner}
          driverCta={!isOwner}
          priority={index === 0}
        />
      ))}
    </div>
  );
}

function VehicleListSkeleton() {
  return (
    <div
      className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
      aria-busy="true"
      aria-label="Loading vehicles"
    >
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="overflow-hidden rounded-card border border-line bg-surface">
          <div className="skeleton h-36 w-full" />
          <div className="space-y-3 p-4">
            <div className="skeleton h-4 w-2/3 rounded-md" />
            <div className="skeleton h-3 w-1/3 rounded-md" />
            <div className="grid grid-cols-3 gap-2 pt-2">
              {Array.from({ length: 3 }, (_, itemIndex) => (
                <div key={itemIndex} className="skeleton h-8 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function VehiclesPage() {
  const [user, { d }] = await Promise.all([getSessionUser(), getServerLocale()]);
  if (!user) notFound();

  const isOwner = user.role === "owner";

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

      <Suspense fallback={<VehicleListSkeleton />}>
        <VehicleList
          userId={user.id}
          companyId={user.companyId}
          isOwner={isOwner}
          d={d}
        />
      </Suspense>
    </div>
  );
}
