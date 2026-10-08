"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  CameraOff,
  CheckCircle2,
  Gauge,
  IndianRupee,
  NotebookPen,
} from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { Button, Card, Field, Input, Spinner } from "@/components/ui";
import { PhotoCapture } from "@/components/PhotoCapture";
import { cn } from "@/lib/utils";

export function FuelEntryForm({
  vehicle,
}: {
  vehicle: { id: string; name: string; registrationNumber: string; lastOdometer: number | null };
}) {
  const { t } = useI18n();
  const router = useRouter();

  const [odometer, setOdometer] = useState("");
  const [rate, setRate] = useState("");
  const [quantity, setQuantity] = useState("");
  const [total, setTotal] = useState("");
  const [totalManual, setTotalManual] = useState(false);
  const [note, setNote] = useState("");
  const [before, setBefore] = useState<string | null>(null);
  const [after, setAfter] = useState<string | null>(null);
  const [pump, setPump] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"idle" | "uploading" | "saving">("idle");
  const [done, setDone] = useState(false);

  const rateNum = Number.parseFloat(rate) || 0;
  const qtyNum = Number.parseFloat(quantity) || 0;
  const autoTotal = useMemo(
    () => (rateNum > 0 && qtyNum > 0 ? (rateNum * qtyNum).toFixed(0) : ""),
    [rateNum, qtyNum]
  );
  const totalNum = Number.parseFloat(totalManual ? total : total || autoTotal) || 0;
  const kmNum = Number.parseInt(odometer, 10) || 0;

  /* ---- live validation (red states) ---- */
  const kmInvalid =
    vehicle.lastOdometer != null && odometer !== "" && kmNum <= vehicle.lastOdometer;
  const kmJump =
    vehicle.lastOdometer != null && kmNum > vehicle.lastOdometer + 4000;
  const rateOdd = rateNum > 0 && (rateNum < 40 || rateNum > 160);
  const totalOff =
    rateNum > 0 && qtyNum > 0 && totalNum > 0 && Math.abs(rateNum * qtyNum - totalNum) > 1;
  const photosMissing = !before || !after;

  const blocked = kmInvalid || totalOff || photosMissing || !kmNum || !rateNum || !qtyNum;

  function onRateChange(v: string) {
    setRate(v);
    if (!totalManual) {
      const q = Number.parseFloat(quantity) || 0;
      const r = Number.parseFloat(v) || 0;
      setTotal(r > 0 && q > 0 ? (r * q).toFixed(0) : "");
    }
  }
  function onQuantityChange(v: string) {
    setQuantity(v);
    if (!totalManual) {
      const r = Number.parseFloat(rate) || 0;
      const q = Number.parseFloat(v) || 0;
      setTotal(r > 0 && q > 0 ? (r * q).toFixed(0) : "");
    }
  }

  async function submit() {
    setError(null);
    if (photosMissing) {
      setError(t("fuel.err.photos"));
      return;
    }
    if (kmInvalid) {
      setError(t("fuel.err.km", { km: vehicle.lastOdometer!.toLocaleString("en-IN") }));
      return;
    }
    if (totalOff) {
      setError(t("fuel.err.totalMismatch"));
      return;
    }

    try {
      setPhase("uploading");
      const images = pump ? [before!, after!, pump] : [before!, after!];
      const upRes = await fetch("/api/uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images }),
      });
      if (!upRes.ok) throw new Error("upload_failed");
      const { urls } = (await upRes.json()) as { urls: string[] };

      setPhase("saving");
      const res = await fetch("/api/fuel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId: vehicle.id,
          fuelRate: rateNum,
          quantityLiters: qtyNum,
          totalAmount: totalNum,
          odometerKm: kmNum,
          beforePhotoUrl: urls[0],
          afterPhotoUrl: urls[1],
          pumpPhotoUrl: pump ? urls[2] : null,
          note: note.trim() ? note.trim() : null,
        }),
      });

      if (res.status === 201) {
        setDone(true);
        setTimeout(() => {
          router.push(`/vehicles/${vehicle.id}`);
          router.refresh();
        }, 900);
        return;
      }

      const data = (await res.json().catch(() => null)) as
        | { error?: string; lastKm?: number }
        | null;
      if (data?.error === "total_mismatch") setError(t("fuel.err.totalMismatch"));
      else if (data?.error === "km_invalid")
        setError(t("fuel.err.km", { km: (data.lastKm ?? 0).toLocaleString("en-IN") }));
      else if (data?.error === "photo_required") setError(t("fuel.err.photos"));
      else if (data?.error === "not_assigned") setError(t("fuel.notAssigned"));
      else setError(t("fuel.err.generic"));
    } catch (err) {
      setError(
        err instanceof Error && err.message === "upload_failed"
          ? t("fuel.err.upload")
          : t("fuel.err.generic")
      );
    } finally {
      setPhase("idle");
    }
  }

  if (done) {
    return (
      <Card className="flex flex-col items-center px-6 py-16 text-center">
        <span className="grid size-16 place-items-center rounded-full bg-emerald-600/10">
          <CheckCircle2 className="size-8 text-emerald-600" />
        </span>
        <p className="mt-5 text-xl font-bold tracking-tight text-ink">{t("fuel.success")}</p>
      </Card>
    );
  }

  const busy = phase !== "idle";
  const warnClass = "mt-1.5 flex items-center gap-1.5 text-xs font-bold text-red-600";

  return (
    <div className="space-y-5">
      <Card className="flex items-center justify-between border-ink/10 bg-ink px-5 py-4 text-paper">
        <div>
          <p className="text-sm font-bold">{vehicle.name}</p>
          <p className="mt-0.5 font-mono text-xs text-white/60">{vehicle.registrationNumber}</p>
        </div>
        {vehicle.lastOdometer != null && (
          <div className="text-right">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-white/50">
              {t("vdetail.lastOdometer")}
            </p>
            <p className="text-sm font-bold">{vehicle.lastOdometer.toLocaleString("en-IN")} km</p>
          </div>
        )}
      </Card>

      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {error}
        </div>
      )}

      <Card className="space-y-4 p-5">
        <Field label={t("fuel.odometer")}>
          <div className="relative">
            <Gauge className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-soft/60" />
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              required
              value={odometer}
              onChange={(e) => setOdometer(e.target.value)}
              placeholder={
                vehicle.lastOdometer != null
                  ? `> ${vehicle.lastOdometer.toLocaleString("en-IN")}`
                  : "48250"
              }
              className={cn(
                "pl-10",
                (kmInvalid || kmJump) && "border-red-400 bg-red-50/60 focus:border-red-500 focus:ring-red-200"
              )}
            />
          </div>
          {kmInvalid && (
            <span className={warnClass}>
              <AlertTriangle className="size-3.5" />
              {t("fuel.err.km", { km: vehicle.lastOdometer!.toLocaleString("en-IN") })}
            </span>
          )}
          {!kmInvalid && kmJump && (
            <span className={warnClass}>
              <AlertTriangle className="size-3.5" />
              {t("fuel.checkKm")}
            </span>
          )}
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label={t("fuel.rate")}>
            <Input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              required
              value={rate}
              onChange={(e) => onRateChange(e.target.value)}
              placeholder="94.77"
              className={cn(
                rateOdd && "border-red-400 bg-red-50/60 focus:border-red-500 focus:ring-red-200"
              )}
            />
            {rateOdd && (
              <span className={warnClass}>
                <AlertTriangle className="size-3.5" />
                {t("fuel.checkRate")}
              </span>
            )}
          </Field>
          <Field label={t("fuel.quantity")}>
            <Input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              required
              value={quantity}
              onChange={(e) => onQuantityChange(e.target.value)}
              placeholder="25.4"
            />
          </Field>
        </div>

        <Field label={t("fuel.total")}>
          <div className="relative">
            <IndianRupee className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-soft/60" />
            <Input
              type="number"
              inputMode="decimal"
              step="1"
              min="0"
              required
              value={total}
              onChange={(e) => {
                setTotal(e.target.value);
                setTotalManual(true);
              }}
              placeholder={autoTotal}
              className={cn(
                "pl-10 text-lg font-bold",
                totalOff && "border-red-400 bg-red-50/60 focus:border-red-500 focus:ring-red-200"
              )}
            />
          </div>
          {totalOff ? (
            <span className={warnClass}>
              <AlertTriangle className="size-3.5" />
              {t("fuel.err.totalMismatch")}
            </span>
          ) : (
            !totalManual &&
            autoTotal && (
              <span className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="size-3.5" />
                {t("fuel.totalAuto")}: ₹{autoTotal}
              </span>
            )
          )}
        </Field>

        <Field label={`${t("fuel.note")} (${t("common.optional")})`}>
          <div className="relative">
            <NotebookPen className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-soft/60" />
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("fuel.notePlaceholder")}
              maxLength={300}
              className="pl-10"
            />
          </div>
        </Field>
      </Card>

      <Card className={cn("p-5", photosMissing && "border-brand/40")}>
        <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-ink-soft">
          {t("fuel.proof")}
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <PhotoCapture
            label={t("fuel.before")}
            hint={before ? t("fuel.changePhoto") : t("fuel.tapCapture")}
            required
            value={before}
            onChange={setBefore}
            icon="before"
          />
          <PhotoCapture
            label={t("fuel.after")}
            hint={after ? t("fuel.changePhoto") : t("fuel.tapCapture")}
            required
            value={after}
            onChange={setAfter}
            icon="after"
          />
        </div>
        <div className="mt-4">
          <PhotoCapture
            label={`${t("fuel.pump")} (${t("common.optional")})`}
            hint={pump ? t("fuel.changePhoto") : t("fuel.tapCapture")}
            value={pump}
            onChange={setPump}
            icon="pump"
          />
        </div>
        {photosMissing && (
          <p className="mt-4 flex items-center gap-2 rounded-xl bg-brand/10 px-3.5 py-2.5 text-[13px] font-bold text-brand-ink">
            <CameraOff className="size-4 shrink-0" />
            {t("fuel.photoRequired")}
          </p>
        )}
      </Card>

      <Button
        type="button"
        variant="brand"
        size="lg"
        className="w-full text-base"
        disabled={busy || blocked}
        onClick={() => void submit()}
      >
        {busy && <Spinner />}
        {phase === "idle" && t("fuel.submit")}
        {phase === "uploading" && t("fuel.submitting")}
        {phase === "saving" && t("common.saving")}
      </Button>
    </div>
  );
}
