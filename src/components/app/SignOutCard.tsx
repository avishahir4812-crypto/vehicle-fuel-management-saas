"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, X } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { Button, Card, Spinner } from "@/components/ui";

export function SignOutCard() {
  const { t } = useI18n();
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function signOut() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <>
      <Card className="mt-4 flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-red-600/10 text-red-600">
            <LogOut className="size-4.5" />
          </span>
          <div>
            <h2 className="text-base font-bold text-ink">{t("signout.title")}</h2>
            <p className="text-sm text-ink-soft">{t("signout.desc")}</p>
          </div>
        </div>
        <Button variant="danger" onClick={() => setConfirming(true)} className="shrink-0">
          <LogOut className="size-4" />
          {t("nav.signOut")}
        </Button>
      </Card>

      {confirming && (
        <div
          className="fixed inset-0 z-[95] flex items-end justify-center bg-night/60 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => !loading && setConfirming(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="sheet-bottom w-full max-w-sm rounded-t-3xl border border-line bg-surface p-6 shadow-lift sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <span className="grid size-12 place-items-center rounded-2xl bg-red-600/10 text-red-600">
                <LogOut className="size-5" />
              </span>
              <button
                type="button"
                onClick={() => !loading && setConfirming(false)}
                className="grid size-8 place-items-center rounded-lg text-ink-soft hover:bg-ink/5"
                aria-label={t("common.close")}
              >
                <X className="size-4.5" />
              </button>
            </div>
            <h3 className="mt-4 text-lg font-bold tracking-tight text-ink">
              {t("signout.title")}?
            </h3>
            <p className="mt-1.5 text-sm text-ink-soft">{t("signout.desc")}</p>
            <div className="mt-6 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setConfirming(false)}
                disabled={loading}
              >
                {t("common.cancel")}
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={() => void signOut()}
                disabled={loading}
              >
                {loading && <Spinner />}
                {t("signout.confirm")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
