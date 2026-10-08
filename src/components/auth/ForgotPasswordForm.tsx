"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, KeyRound, MessageSquareText, Phone, ShieldCheck } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { Button, Field, Input, Spinner } from "@/components/ui";
import { cn, passwordStrength } from "@/lib/utils";
import type { DictKey } from "@/i18n";

type Step = "identifier" | "otp" | "done";

export function ForgotPasswordForm() {
  const { t } = useI18n();
  const router = useRouter();
  const [step, setStep] = useState<Step>("identifier");
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [maskedPhone, setMaskedPhone] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pw = passwordStrength(newPassword);
  const otpValid = /^\d{6}$/.test(otp);

  function mapError(code: string | undefined): string {
    const map: Record<string, DictKey> = {
      rate_limited: "auth.err.rate",
      expired: "auth.err.expired",
      wrong_otp: "auth.err.wrongOtp",
      locked: "auth.err.locked",
      invalid_input: "auth.err.input",
    };
    return t(map[code ?? ""] ?? "auth.err.generic");
  }

  async function requestCode(e?: FormEvent) {
    e?.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      });
      const data = (await res.json().catch(() => null)) as {
        otp?: string;
        maskedPhone?: string;
      } | null;
      // Always advance — the response never reveals account existence.
      setDevOtp(data?.otp ?? null);
      setMaskedPhone(data?.maskedPhone ?? null);
      setStep("otp");
    } catch {
      setError(t("auth.err.generic"));
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, otp, newPassword }),
      });
      if (res.ok) {
        setStep("done");
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

  /* ---------- Step 3: success ---------- */
  if (step === "done") {
    return (
      <div className="w-full text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-600/10 text-emerald-600">
          <ShieldCheck className="size-7" />
        </span>
        <h1 className="mt-5 text-xl font-bold tracking-tight text-ink">{t("auth.forgotDone")}</h1>
        <Button
          variant="brand"
          size="lg"
          className="mt-7 w-full"
          onClick={() => {
            router.push("/login");
            router.refresh();
          }}
        >
          {t("auth.signIn")}
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Link
        href="/login"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-bold text-ink-soft transition hover:text-ink"
      >
        <ArrowLeft className="size-4" />
        {t("auth.signIn")}
      </Link>

      <h1 className="text-2xl font-bold tracking-tight text-ink">{t("auth.forgotTitle")}</h1>

      {/* ---------- Step 1: identifier ---------- */}
      {step === "identifier" && (
        <>
          <p className="mt-2 text-sm text-ink-soft">{t("auth.forgotDesc")}</p>
          <form onSubmit={(e) => void requestCode(e)} className="mt-7 space-y-5" noValidate>
            {error && <ErrorBanner text={error} />}
            <Field label={t("auth.identifier")}>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-soft/60" />
                <Input
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={t("auth.identifierPlaceholder")}
                  maxLength={120}
                  className="pl-10"
                />
              </div>
            </Field>
            <Button
              type="submit"
              variant="brand"
              size="lg"
              className="w-full"
              disabled={loading || identifier.trim().length < 3}
            >
              {loading && <Spinner />}
              {t("auth.forgot")}
            </Button>
          </form>
        </>
      )}

      {/* ---------- Step 2: OTP + new password ---------- */}
      {step === "otp" && (
        <>
          <p className="mt-2 flex items-center gap-2 text-sm text-ink-soft">
            <MessageSquareText className="size-4 text-brand" />
            {t("auth.forgotSent")}
            {maskedPhone && <span className="font-mono font-bold text-ink">{maskedPhone}</span>}
          </p>

          {devOtp && (
            <div className="mt-4 rounded-xl border border-brand/30 bg-brand/[0.07] px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-brand-ink">
                {t("auth.forgotDemoNote")}
              </p>
              <p className="mt-1 font-mono text-2xl font-bold tracking-[0.3em] text-brand-deep">
                {devOtp}
              </p>
            </div>
          )}

          <form onSubmit={resetPassword} className="mt-6 space-y-5" noValidate>
            {error && <ErrorBanner text={error} />}
            <Field label={t("auth.forgotStep2")}>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-soft/60" />
                <Input
                  inputMode="numeric"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="••••••"
                  maxLength={6}
                  className="pl-10 text-center font-mono text-2xl tracking-[0.5em]"
                />
              </div>
            </Field>

            <Field label={t("auth.forgotNewPassword")}>
              <Input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
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
                      newPassword.length === 0
                        ? "text-ink-soft/60"
                        : ok
                          ? "text-emerald-600"
                          : "text-red-600"
                    )}
                  >
                    •{label}
                  </span>
                ))}
              </div>
            </Field>

            <Button
              type="submit"
              variant="brand"
              size="lg"
              className="w-full"
              disabled={loading || !otpValid || pw.score < 3}
            >
              {loading && <Spinner />}
              {t("auth.forgotConfirm")}
            </Button>

            <div className="flex justify-between text-sm">
              <button
                type="button"
                onClick={() => void requestCode()}
                className="font-bold text-brand-deep hover:underline"
              >
                {t("auth.resend")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep("identifier");
                  setOtp("");
                  setNewPassword("");
                  setError(null);
                }}
                className="font-bold text-ink-soft hover:underline"
              >
                {t("auth.startOver")}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}

function ErrorBanner({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
      <AlertCircle className="size-4 shrink-0" />
      {text}
    </div>
  );
}
