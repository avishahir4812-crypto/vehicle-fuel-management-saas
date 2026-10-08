"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, KeyRound } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { Button, Card, Field, Input, Spinner } from "@/components/ui";
import { cn, passwordStrength } from "@/lib/utils";
import type { DictKey } from "@/i18n";

export function ChangePasswordCard() {
  const { t } = useI18n();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const pw = passwordStrength(newPassword);

  function mapError(code: string | undefined): string {
    const map: Record<string, DictKey> = {
      wrong_password: "auth.err.wrongPassword",
      same_password: "auth.err.samePassword",
      rate_limited: "auth.err.rate",
      invalid_input: "auth.err.input",
    };
    return t(map[code ?? ""] ?? "auth.err.generic");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setLoading(true);
    try {
      const res = await fetch("/api/profile/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (res.ok) {
        setSaved(true);
        setCurrentPassword("");
        setNewPassword("");
        setTimeout(() => setSaved(false), 3500);
        return;
      }
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(mapError(data?.error));
    } catch {
      setError(t("auth.err.generic"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mt-4 p-5">
      <h2 className="flex items-center gap-2 text-base font-bold text-ink">
        <KeyRound className="size-4.5 text-brand" />
        {t("auth.changePassword")}
      </h2>

      {saved && (
        <p className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-600/10 px-4 py-3 text-sm font-bold text-emerald-700">
          <CheckCircle2 className="size-4" />
          {t("auth.passwordChanged")}
        </p>
      )}

      <form onSubmit={onSubmit} className="mt-4 space-y-4">
        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </p>
        )}
        <Field label={t("auth.currentPassword")}>
          <Input
            type="password"
            autoComplete="current-password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            maxLength={100}
          />
        </Field>
        <Field label={t("auth.forgotNewPassword")}>
          <Input
            type="password"
            autoComplete="new-password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            maxLength={100}
          />
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {(
              [
                [pw.hasLength, t("auth.pwLength")],
                [pw.hasLetter, t("auth.pwLetter")],
                [pw.hasNumber, t("auth.pwNumber")],
              ] as const
            ).map(([ok, label]) => (
              <span
                key={label}
                className={cn(
                  "flex items-center gap-1 text-[11px] font-bold",
                  newPassword.length === 0 ? "text-ink-soft/60" : ok ? "text-emerald-600" : "text-red-600"
                )}
              >
                •{label}
              </span>
            ))}
          </div>
        </Field>
        <Button
          type="submit"
          variant="primary"
          disabled={loading || !currentPassword || pw.score < 3}
        >
          {loading && <Spinner />}
          {loading ? t("common.saving") : t("auth.changePassword")}
        </Button>
      </form>
    </Card>
  );
}
