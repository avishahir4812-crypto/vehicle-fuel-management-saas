import { AlertTriangle, Fuel } from "lucide-react";
import type { FuelEntryWithNames } from "@/lib/queries";
import { getServerLocale } from "@/i18n/server";
import { formatINR, cn } from "@/lib/utils";
import { ProofPhotos } from "@/components/ProofPhotos";
import { ANOMALY_LABEL_KEY, decodeAnomalies } from "@/lib/anomaly";
import type { DictKey } from "@/i18n";

/** One fuel entry. Flagged entries render in red with the reason. */
export async function FuelEntryRow({
  entry,
  showDriver = true,
  showVehicle = false,
}: {
  entry: FuelEntryWithNames;
  showDriver?: boolean;
  showVehicle?: boolean;
}) {
  const { locale, d } = await getServerLocale();
  const date = new Date(entry.createdAt);
  const tag = locale === "hi" ? "hi-IN" : locale === "gu" ? "gu-IN" : "en-IN";

  const codes = decodeAnomalies(entry.anomaly);
  const flagged = codes.length > 0;
  const reasons = codes.map((c) => d[ANOMALY_LABEL_KEY[c] as DictKey]).filter(Boolean);

  const photos = [
    { url: entry.beforePhotoUrl, label: d["vdetail.before"] },
    { url: entry.afterPhotoUrl, label: d["vdetail.after"] },
    ...(entry.pumpPhotoUrl ? [{ url: entry.pumpPhotoUrl, label: d["vdetail.pump"] }] : []),
  ];

  return (
    <article className={cn("px-4 py-4 sm:px-5", flagged && "bg-red-50/70")}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <span
            className={cn(
              "grid size-11 shrink-0 place-items-center rounded-xl",
              flagged ? "bg-red-600/12 text-red-600" : "bg-brand/12 text-brand-deep"
            )}
          >
            {flagged ? <AlertTriangle className="size-5" /> : <Fuel className="size-5" />}
          </span>
          <div className="min-w-0">
            <p className={cn("text-sm font-bold", flagged ? "text-red-700" : "text-ink")}>
              {showVehicle
                ? entry.vehicleName
                : date.toLocaleDateString(tag, { weekday: "short", day: "numeric", month: "short" })}
            </p>
            <p className={cn("text-xs", flagged ? "text-red-600/80" : "text-ink-soft")}>
              {showVehicle
                ? date.toLocaleDateString(tag, { day: "numeric", month: "short" })
                : `${formatINR(entry.fuelRate, true)}/L`}
              {" · "}
              {entry.odometerKm.toLocaleString("en-IN")} km
              {showDriver ? ` · ${entry.driverName}` : ""}
            </p>
            {entry.note && (
              <p className="mt-0.5 truncate text-xs italic text-ink-soft/80">{entry.note}</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 sm:ml-auto sm:justify-end">
          <ProofPhotos photos={photos} />
          <div className="text-right">
            <p className={cn("text-[15px] font-bold", flagged ? "text-red-700" : "text-ink")}>
              {formatINR(entry.totalAmount, true)}
            </p>
            <p className={cn("text-xs", flagged ? "text-red-600/80" : "text-ink-soft")}>
              {Number(entry.quantityLiters).toLocaleString("en-IN", { maximumFractionDigits: 1 })} L
            </p>
          </div>
        </div>
      </div>

      {flagged && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-red-200 pt-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
            <AlertTriangle className="size-3" />
            {d["anomaly.title"]}
          </span>
          {reasons.map((r) => (
            <span key={r} className="text-[12px] font-semibold text-red-700">
              {r}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
