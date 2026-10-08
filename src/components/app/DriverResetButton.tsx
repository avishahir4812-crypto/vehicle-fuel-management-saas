"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, KeyRound, RotateCcw, X } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { Button, Spinner } from "@/components/ui";

/** Owner resets a forgotten driver password in one tap. */
export function DriverResetButton({
  driverId,
  driverName,
}: {
  driverId: string;
  driverName: string;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [creds, setCreds] = useState<{ phone: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  async function reset() {
    setLoading(true);
    try {
      const res = await fetch(`/api/drivers/${driverId}/reset`, { method: "POST" });
      if (!res.ok) return;
      const data = (await res.json()) as { credentials: { phone: string; password: string } };
      setCreds(data.credentials);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  function close() {
    setConfirming(false);
    setTimeout(() => {
      setCreds(null);
      setCopied(false);
    }, 200);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        title={t("drivers.reset")}
        aria-label={`${t("drivers.reset")} — ${driverName}`}
        className="grid size-9 shrink-0 place-items-center rounded-xl border border-line text-ink-soft transition hover:border-line-strong hover:text-ink"
      >
        <KeyRound className="size-4" />
      </button>

      {confirming && (
        <div
          className="fixed inset-0 z-[90] flex items-end justify-center bg-night/60 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => !loading && close()}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="sheet-bottom w-full max-w-sm rounded-t-3xl border border-line bg-surface p-6 shadow-lift sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            {creds ? (
              <div>
                <div className="flex items-start justify-between">
                  <span className="grid size-12 place-items-center rounded-2xl bg-emerald-600/10 text-emerald-600">
                    <RotateCcw className="size-6" />
                  </span>
                  <button
                    type="button"
                    onClick={close}
                    className="grid size-8 place-items-center rounded-lg text-ink-soft hover:bg-ink/5"
                    aria-label={t("common.close")}
                  >
                    <X className="size-4.5" />
                  </button>
                </div>
                <h2 className="mt-4 text-lg font-bold tracking-tight text-ink">
                  {t("drivers.reset")}
                </h2>
                <p className="mt-1.5 text-sm text-ink-soft">{t("drivers.createdDesc")}</p>
                <dl className="mt-5 space-y-2 rounded-2xl border border-line bg-paper p-4">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-xs font-bold uppercase tracking-wide text-ink-soft">
                      {t("auth.phone")}
                    </dt>
                    <dd className="font-mono text-sm font-bold text-ink">{creds.phone}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-t border-line pt-2">
                    <dt className="text-xs font-bold uppercase tracking-wide text-ink-soft">
                      {t("auth.password")}
                    </dt>
                    <dd className="font-mono text-sm font-bold text-ink">{creds.password}</dd>
                  </div>
                </dl>
                <div className="mt-5 flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(
                          `FleetFuel login\nMobile: ${creds.phone}\nPassword: ${creds.password}`
                        );
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      } catch {
                        /* ignore */
                      }
                    }}
                  >
                    {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
                    {copied ? t("drivers.copied") : t("drivers.copy")}
                  </Button>
                  <Button variant="primary" className="flex-1" onClick={close}>
                    {t("drivers.done")}
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between">
                  <span className="grid size-12 place-items-center rounded-2xl bg-amber-500/10 text-amber-600">
                    <KeyRound className="size-6" />
                  </span>
                  <button
                    type="button"
                    onClick={() => !loading && close()}
                    className="grid size-8 place-items-center rounded-lg text-ink-soft hover:bg-ink/5"
                    aria-label={t("common.close")}
                  >
                    <X className="size-4.5" />
                  </button>
                </div>
                <h2 className="mt-4 text-lg font-bold tracking-tight text-ink">
                  {t("drivers.resetConfirm")}
                </h2>
                <p className="mt-1.5 text-sm text-ink-soft">{t("drivers.resetDesc")}</p>
                <p className="mt-3 rounded-xl bg-paper px-4 py-2.5 text-sm font-bold text-ink">
                  {driverName}
                </p>
                <div className="mt-5 flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={close} disabled={loading}>
                    {t("common.cancel")}
                  </Button>
                  <Button
                    variant="danger"
                    className="flex-1"
                    onClick={() => void reset()}
                    disabled={loading}
                  >
                    {loading && <Spinner />}
                    {t("drivers.reset")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
