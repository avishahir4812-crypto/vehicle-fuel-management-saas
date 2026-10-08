"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Clock, Phone } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { Button, Field, Input, Spinner } from "@/components/ui";

export function LoginForm({ expired = false }: { expired?: boolean }) {
  const { t } = useI18n();
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      if (res.ok) {
        document.cookie = "fm_returning=1;path=/;max-age=31536000;samesite=lax";
        router.push("/dashboard");
        router.refresh();
        return;
      }
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(
        data?.error === "invalid_credentials"
          ? t("auth.err.invalid")
          : data?.error === "rate_limited"
            ? t("auth.err.rate")
            : t("auth.err.input")
      );
    } catch {
      setError(t("auth.err.generic"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="w-full space-y-5" noValidate>
      {expired && !error && (
        <div className="flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          <Clock className="size-4 shrink-0" />
          {t("auth.sessionExpired")}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      <Field label={t("auth.identifier")}>
        <div className="relative">
          <Phone className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-soft/60" />
          <Input
            inputMode="text"
            autoComplete="username"
            required
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder={t("auth.identifierPlaceholder")}
            maxLength={120}
            className="pl-10"
          />
        </div>
      </Field>

      <Field label={t("auth.password")}>
        <Input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          maxLength={100}
        />
      </Field>

      <Button type="submit" variant="brand" size="lg" className="w-full" disabled={loading}>
        {loading && <Spinner />}
        {loading ? t("common.loading") : t("auth.signIn")}
      </Button>

      <p className="text-center">
        <Link
          href="/forgot-password"
          className="text-sm font-bold text-brand-deep hover:underline"
        >
          {t("auth.forgot")}
        </Link>
      </p>

      <p className="pt-1 text-center text-sm text-ink-soft">
        {t("auth.noAccount")}{" "}
        <Link href="/signup?new=1" className="font-bold text-brand-deep hover:underline">
          {t("auth.createAccount")}
        </Link>
      </p>
    </form>
  );
}
