"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

interface DeleteVehicleButtonProps {
  vehicleId: string;
  vehicleName: string;
  /** After success, redirect yahan (list page) */
  redirectTo?: string;
  labels: {
    delete: string;
    confirm: string;
    deleting: string;
    blocked: string;
    error: string;
  };
}

export function DeleteVehicleButton({
  vehicleId,
  vehicleName,
  redirectTo = "/vehicles",
  labels,
}: DeleteVehicleButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    const ok = window.confirm(labels.confirm.replace("{name}", vehicleName));
    if (!ok) return;

    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/vehicles/${vehicleId}`, { method: "DELETE" });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          if (data.error === "has_dependencies") {
            setError(labels.blocked);
          } else {
            setError(labels.error);
          }
          return;
        }

        router.push(redirectTo);
        router.refresh();
      } catch {
        setError(labels.error);
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleDelete}
        disabled={pending}
        className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 text-xs font-bold text-red-600 transition hover:bg-red-100 hover:text-red-700 disabled:opacity-50"
      >
        <Trash2 className="size-3.5" />
        {pending ? labels.deleting : labels.delete}
      </button>
      {error && (
        <p className="max-w-[220px] text-right text-[11px] font-semibold text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}