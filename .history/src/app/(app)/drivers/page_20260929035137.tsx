import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageSquare, Phone, Users } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { getCompanyDrivers } from "@/lib/queries";
import { getServerLocale } from "@/i18n/server";
import { formatPhone } from "@/lib/utils";
import { Avatar, Badge, EmptyState } from "@/components/ui";
import { AddDriverButton } from "@/components/app/AddDriverButton";
import { DriverResetButton } from "@/components/app/DriverResetButton";

export const metadata: Metadata = { title: "Drivers" };

export default async function DriversPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "owner") notFound();

  const { d } = await getServerLocale();
  const drivers = await getCompanyDrivers(user.companyId);

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            {d["drivers.title"]}
          </h1>
          <p className="mt-1 text-[15px] text-ink-soft">{d["drivers.sub"]}</p>
        </div>
        <AddDriverButton />
      </header>

      {drivers.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={<Users className="size-6" />}
          title={d["drivers.empty"]}
          desc={d["drivers.emptyDesc"]}
          action={<AddDriverButton />}
        />
      ) : (
        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          {drivers.map((driver) => (
            <div
              key={driver.id}
              className="rounded-card border border-line bg-surface p-5 shadow-soft transition-shadow hover:shadow-lift"
            >
              <div className="flex items-center gap-3.5">
                <Avatar name={driver.name} id={driver.id} size="lg" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-bold text-ink">{driver.name}</p>
                  <p className="flex items-center gap-1.5 text-[13px] font-semibold text-ink-soft">
                    <Phone className="size-3.5" />
                    {formatPhone(driver.phone)}
                  </p>
                </div>
                <Link
                  href="/chat"
                  className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-ink px-3.5 text-xs font-bold text-paper transition hover:bg-ink-soft"
                >
                  <MessageSquare className="size-3.5" />
                  {d["drivers.message"]}
                </Link>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-line pt-4">
                {driver.assignedVehicles.length === 0 ? (
                  <Badge tone="neutral">{d["drivers.noVehicle"]}</Badge>
                ) : (
                  <>
                    <span className="text-xs font-bold uppercase tracking-wide text-ink-soft/70">
                      {driver.assignedVehicles.length} {d["drivers.vehicles"]}
                    </span>
                    {driver.assignedVehicles.map((v) => (
                      <Badge key={v.id} tone="neutral">
                        {v.name}
                      </Badge>
                    ))}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
