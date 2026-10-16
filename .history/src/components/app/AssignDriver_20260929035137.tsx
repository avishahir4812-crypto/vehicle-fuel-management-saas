"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserCheck } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { Select } from "@/components/ui";

export function AssignDriver({
  vehicleId,
  currentDriverId,
  drivers,
}: {
  vehicleId: string;
  currentDriverId: string | null;
  drivers: { id: string; name: string; phone: string }[];
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [value, setValue] = useState(currentDriverId ?? "");
  const [saving, setSaving] = useState(false);

  async function assign(next: string) {
    setValue(next);
    setSaving(true);
    try {
      await fetch(`/api/vehicles/${vehicleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId: next === "" ? null : next }),
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <UserCheck className="size-4 shrink-0 text-ink-soft" />
      <Select
        aria-label={t("vehicles.assignDriver")}
        value={value}
        onChange={(e) => void assign(e.target.value)}
        disabled={saving}
        className="h-9 w-auto min-w-40 text-sm"
      >
        <option value="">{t("common.unassigned")}</option>
        {drivers.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </Select>
    </div>
  );
}
