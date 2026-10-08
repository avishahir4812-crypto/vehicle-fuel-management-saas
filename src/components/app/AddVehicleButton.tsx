"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Plus, X } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { Button, Field, Input, Select, Spinner } from "@/components/ui";
import type { DictKey } from "@/i18n";

const TYPES: DictKey[] = ["vehicleType.bolero", "vehicleType.truck", "vehicleType.pickup", "vehicleType.other"];
const TYPE_VALUES = ["bolero", "truck", "pickup", "other"] as const;
const FUEL_VALUES = ["diesel", "petrol", "cng"] as const;

export function AddVehicleButton({ fullWidth = false }: { fullWidth?: boolean }) {
  const { t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<(typeof TYPE_VALUES)[number]>("truck");
  const [reg, setReg] = useState("");
  const [fuelType, setFuelType] = useState<(typeof FUEL_VALUES)[number]>("diesel");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function reset() {
    setName("");
    setType("truck");
    setReg("");
    setFuelType("diesel");
    setError(null);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type, registrationNumber: reg, fuelType }),
      });
      if (res.status === 201) {
        setOpen(false);
        reset();
        router.refresh();
        return;
      }
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error === "reg_taken" ? t("vehicles.err.regTaken") : t("vehicles.err.generic"));
    } catch {
      setError(t("vehicles.err.generic"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button variant="brand" onClick={() => setOpen(true)} className={fullWidth ? "w-full" : ""}>
        <Plus className="size-4" />
        {t("vehicles.add")}
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-[90] flex items-end justify-center bg-night/60 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => !loading && setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={t("vehicles.newTitle")}
        >
          <div
            className="sheet-bottom w-full max-w-md rounded-t-3xl border border-line bg-surface p-6 shadow-lift sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold tracking-tight text-ink">{t("vehicles.newTitle")}</h2>
              <button
                type="button"
                onClick={() => !loading && setOpen(false)}
                className="grid size-8 place-items-center rounded-lg text-ink-soft hover:bg-ink/5"
                aria-label={t("common.close")}
              >
                <X className="size-4.5" />
              </button>
            </div>

            <form onSubmit={onSubmit} className="mt-5 space-y-4">
              {error && (
                <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  <AlertCircle className="size-4 shrink-0" />
                  {error}
                </div>
              )}
              <Field label={t("vehicles.name")}>
                <Input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("vehicles.namePlaceholder")}
                  maxLength={60}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label={t("vehicles.type")}>
                  <Select value={type} onChange={(e) => setType(e.target.value as typeof type)}>
                    {TYPE_VALUES.map((v, i) => (
                      <option key={v} value={v}>
                        {t(TYPES[i])}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label={t("vehicles.fuelType")}>
                  <Select value={fuelType} onChange={(e) => setFuelType(e.target.value as typeof fuelType)}>
                    {FUEL_VALUES.map((v) => (
                      <option key={v} value={v}>
                        {t(`fuelType.${v}` as DictKey)}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
              <Field label={t("vehicles.reg")}>
                <Input
                  required
                  value={reg}
                  onChange={(e) => setReg(e.target.value.toUpperCase())}
                  placeholder={t("vehicles.regPlaceholder")}
                  maxLength={16}
                  className="font-mono uppercase tracking-wide"
                />
              </Field>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => !loading && setOpen(false)}>
                  {t("common.cancel")}
                </Button>
                <Button type="submit" variant="brand" className="flex-1" disabled={loading}>
                  {loading && <Spinner />}
                  {loading ? t("common.saving") : t("vehicles.add")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
