"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, Copy, KeyRound, Phone, ShieldCheck, UserPlus, X } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { Button, Field, Input, Spinner } from "@/components/ui";
import { passwordStrength } from "@/lib/utils";

function randomPassword() {
  const words = ["fleet", "diesel", "road", "cargo", "pump", "truck"];
  return `${words[Math.floor(Math.random() * words.length)]}${Math.floor(1000 + Math.random() * 8999)}`;
}

export function AddDriverButton() {
  const { t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState(randomPassword);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<{ phone: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const pw = passwordStrength(password);
  const canSubmit = name.trim().length >= 2 && phone.replace(/\D/g, "").length >= 10 && pw.score === 3;

  function close() {
    if (loading) return;
    setOpen(false);
    setTimeout(() => {
      setName("");
      setPhone("");
      setPassword(randomPassword());
      setError(null);
      setCreated(null);
      setCopied(false);
    }, 200);
    router.refresh();
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/drivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, password }),
      });
      if (res.status === 201) {
        const data = (await res.json()) as { credentials: { phone: string; password: string } };
        setCreated(data.credentials);
        router.refresh();
        return;
      }
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(
        data?.error === "phone_taken" ? t("auth.err.phoneTaken") : t("drivers.err.generic")
      );
    } catch {
      setError(t("drivers.err.generic"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button variant="brand" onClick={() => setOpen(true)}>
        <UserPlus className="size-4" />
        {t("drivers.add")}
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-[90] flex items-end justify-center bg-night/60 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={close}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="sheet-bottom w-full max-w-md rounded-t-3xl border border-line bg-surface p-6 shadow-lift sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            {created ? (
              <div>
                <div className="flex items-start justify-between">
                  <span className="grid size-12 place-items-center rounded-2xl bg-emerald-600/10 text-emerald-600">
                    <ShieldCheck className="size-6" />
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
                <h2 className="mt-4 text-lg font-bold tracking-tight text-ink">{t("drivers.created")}</h2>
                <p className="mt-1.5 text-sm text-ink-soft">{t("drivers.createdDesc")}</p>

                <dl className="mt-5 space-y-2 rounded-2xl border border-line bg-paper p-4">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-xs font-bold uppercase tracking-wide text-ink-soft">
                      {t("auth.phone")}
                    </dt>
                    <dd className="font-mono text-sm font-bold text-ink">{created.phone}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-t border-line pt-2">
                    <dt className="text-xs font-bold uppercase tracking-wide text-ink-soft">
                      {t("auth.password")}
                    </dt>
                    <dd className="font-mono text-sm font-bold text-ink">{created.password}</dd>
                  </div>
                </dl>

                <div className="mt-5 flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(
                          `FleetFuel login\nMobile: ${created.phone}\nPassword: ${created.password}`
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
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-bold tracking-tight text-ink">{t("drivers.newTitle")}</h2>
                    <p className="mt-1 text-sm text-ink-soft">{t("drivers.newDesc")}</p>
                  </div>
                  <button
                    type="button"
                    onClick={close}
                    className="grid size-8 shrink-0 place-items-center rounded-lg text-ink-soft hover:bg-ink/5"
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
                  <Field label={t("auth.fullName")}>
                    <Input
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ramesh Patel"
                      maxLength={80}
                    />
                  </Field>
                  <Field label={t("auth.phone")} hint={t("auth.phoneHint")}>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-soft/60" />
                      <Input
                        type="tel"
                        inputMode="numeric"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="98765 43210"
                        maxLength={15}
                        className="pl-10"
                      />
                    </div>
                  </Field>
                  <Field label={t("auth.password")} hint={t("auth.passwordHint")}>
                    <div className="flex gap-2">
                      <Input
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="font-mono"
                        maxLength={100}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="shrink-0"
                        onClick={() => setPassword(randomPassword())}
                      >
                        <KeyRound className="size-4" />
                        {t("drivers.generate")}
                      </Button>
                    </div>
                  </Field>

                  <div className="flex gap-3 pt-2">
                    <Button type="button" variant="outline" className="flex-1" onClick={close}>
                      {t("common.cancel")}
                    </Button>
                    <Button type="submit" variant="brand" className="flex-1" disabled={loading || !canSubmit}>
                      {loading && <Spinner />}
                      {loading ? t("common.saving") : t("drivers.add")}
                    </Button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
