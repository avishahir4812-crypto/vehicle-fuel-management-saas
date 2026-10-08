"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Check,
  Copy,
  Crown,
  KeyRound,
  Phone,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { Button, Field, Input, Spinner } from "@/components/ui";
import { cn, passwordStrength } from "@/lib/utils";

export function SignupForm() {
  const { t } = useI18n();
  const router = useRouter();
  const [role, setRole] = useState<"owner" | "driver">("owner");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [joinKey, setJoinKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [issuedKey, setIssuedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const pw = passwordStrength(password);
  const phoneDigits = phone.replace(/\D/g, "");
  const canSubmit =
    name.trim().length >= 2 &&
    phoneDigits.length >= 10 &&
    pw.score === 3 &&
    companyName.trim().length >= 2 &&
    (role === "owner" || joinKey.trim().length === 5);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          role === "owner"
            ? { role, name, phone, email, password, companyName }
            : { role, name, phone, email, password, companyName, joinKey }
        ),
      });

      if (res.status === 201) {
        document.cookie = "fm_returning=1;path=/;max-age=31536000;samesite=lax";
        const data = (await res.json()) as { company: { joinKey: string | null } };
        if (role === "owner" && data.company.joinKey) {
          setIssuedKey(data.company.joinKey);
          return;
        }
        router.push("/dashboard");
        router.refresh();
        return;
      }

      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(
        data?.error === "phone_taken"
          ? t("auth.err.phoneTaken")
          : data?.error === "email_taken"
            ? t("auth.err.taken")
            : data?.error === "company_not_found"
              ? t("auth.err.companyNotFound")
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

  /* ---------- Owner: show the generated company key ---------- */
  if (issuedKey) {
    return (
      <div className="w-full text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-600/10 text-emerald-600">
          <ShieldCheck className="size-7" />
        </span>
        <h2 className="mt-5 text-xl font-bold tracking-tight text-ink">{t("auth.keyIssued")}</h2>
        <p className="mt-1.5 text-sm text-ink-soft">{t("auth.keyIssuedDesc")}</p>

        <div className="mt-6 rounded-2xl border border-line bg-paper p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">{companyName}</p>
          <p className="mt-2 font-mono text-4xl font-bold tracking-[0.35em] text-brand-deep">
            {issuedKey}
          </p>
        </div>

        <div className="mt-5 flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(`${companyName} · ${issuedKey}`);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              } catch {
                /* ignore */
              }
            }}
          >
            {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
            {copied ? t("drivers.copied") : t("settings.copyKey")}
          </Button>
          <Button
            variant="brand"
            className="flex-1"
            onClick={() => {
              router.push("/dashboard");
              router.refresh();
            }}
          >
            {t("auth.continue")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="w-full space-y-5" noValidate>
      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {error}
        </div>
      )}

      <Field label={t("auth.role")}>
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              { value: "owner", icon: Crown, label: t("auth.asOwner"), hint: t("auth.ownerHint") },
              { value: "driver", icon: Truck, label: t("auth.asDriver"), hint: t("auth.driverHint") },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setRole(opt.value)}
              aria-pressed={role === opt.value}
              className={cn(
                "rounded-2xl border-2 p-3.5 text-left transition-all",
                role === opt.value
                  ? "border-brand bg-brand/[0.06] shadow-[0_0_0_4px_rgba(232,147,12,0.12)]"
                  : "border-line bg-surface hover:border-line-strong"
              )}
            >
              <opt.icon className={cn("size-5", role === opt.value ? "text-brand" : "text-ink-soft")} />
              <p className="mt-2 text-sm font-bold text-ink">{opt.label}</p>
              <p className="mt-0.5 text-[11px] leading-snug text-ink-soft">{opt.hint}</p>
            </button>
          ))}
        </div>
      </Field>

      <Field label={t("auth.fullName")}>
        <Input
          autoComplete="name"
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
            autoComplete="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="98765 43210"
            maxLength={15}
            className="pl-10"
          />
        </div>
      </Field>

      <Field label={t("auth.emailOptional")}>
        <Input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@fleet.com"
          maxLength={120}
        />
      </Field>

      <Field label={t("auth.password")}>
        <Input
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          maxLength={100}
        />
        {/* Live, simple password validation */}
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
                password.length === 0 ? "text-ink-soft/60" : ok ? "text-emerald-600" : "text-red-600"
              )}
            >
              <Check className={cn("size-3", !ok && "opacity-40")} />
              {label}
            </span>
          ))}
        </div>
      </Field>

      <Field
        label={role === "owner" ? t("auth.companyName") : t("auth.companyJoin")}
        hint={role === "owner" ? t("auth.companyHint") : undefined}
      >
        <Input
          required
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Shakti Transport"
          maxLength={80}
        />
      </Field>

      {role === "driver" && (
        <Field label={t("auth.joinKey")} hint={t("auth.joinKeyHint")}>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-soft/60" />
            <Input
              required
              value={joinKey}
              onChange={(e) => setJoinKey(e.target.value.toUpperCase().slice(0, 5))}
              placeholder="GJ7KM"
              maxLength={5}
              className="pl-10 font-mono text-lg tracking-[0.3em]"
            />
          </div>
        </Field>
      )}

      <Button
        type="submit"
        variant="brand"
        size="lg"
        className="w-full"
        disabled={loading || !canSubmit}
      >
        {loading && <Spinner />}
        {loading ? t("common.loading") : t("auth.createAccount")}
      </Button>

      <p className="pt-1 text-center text-sm text-ink-soft">
        {t("auth.hasAccount")}{" "}
        <Link href="/login" className="font-bold text-brand-deep hover:underline">
          {t("auth.signIn")}
        </Link>
      </p>
    </form>
  );
}
