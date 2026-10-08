import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  ChevronRight,
  Globe,
  Lock,
  Phone,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { getCompany } from "@/lib/company";
import { getServerLocale } from "@/i18n/server";
import { formatPhone } from "@/lib/utils";
import { Avatar, Badge, Card } from "@/components/ui";
import { ProfileForm } from "@/components/app/ProfileForm";
import { LanguageSelector } from "@/components/app/LanguageSelector";
import { SignOutCard } from "@/components/app/SignOutCard";
import { ChangePasswordCard } from "@/components/app/ChangePasswordCard";
import { CompanyKeyCard } from "@/components/app/CompanyKeyCard";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) notFound();
  const { locale, d } = await getServerLocale();
  const company = await getCompany(user.companyId);

  return (
    <div className="mx-auto max-w-2xl">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          {d["settings.title"]}
        </h1>
      </header>

      <Card className="mt-6 flex items-center gap-4 p-5">
        <Avatar name={user.name} id={user.id} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-bold text-ink">{user.name}</p>
          <p className="flex items-center gap-1.5 text-sm text-ink-soft">
            <Phone className="size-3.5" />
            {formatPhone(user.phone)}
          </p>
        </div>
        <Badge tone={user.role === "owner" ? "amber" : "neutral"}>
          {user.role === "owner" ? d["common.owner"] : d["common.driver"]}
        </Badge>
      </Card>

      {/* Company + join key */}
      <Card className="mt-4 p-5">
        <h2 className="flex items-center gap-2 text-base font-bold text-ink">
          <Building2 className="size-4.5 text-brand" />
          {d["settings.company"]}
        </h2>
        <p className="mt-2 text-lg font-bold tracking-tight text-ink">{company?.name}</p>
        {user.role === "owner" && company && (
          <div className="mt-4">
            <CompanyKeyCard companyName={company.name} joinKey={company.joinKey} />
          </div>
        )}
        {user.role === "owner" && (
          <Link
            href="/billing"
            className="mt-4 flex items-center gap-3 rounded-2xl border border-line bg-paper px-4 py-3 transition hover:border-brand/50"
          >
            <Sparkles className="size-4.5 shrink-0 text-brand" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-ink">{d["bill.title"]}</span>
              <span className="block truncate text-xs text-ink-soft">{d["bill.sub"]}</span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-ink-soft" />
          </Link>
        )}
      </Card>

      <Card className="mt-4 p-5">
        <h2 className="flex items-center gap-2 text-base font-bold text-ink">
          <UserRound className="size-4.5 text-brand" />
          {d["settings.profile"]}
        </h2>
        <div className="mt-4">
          <ProfileForm initialName={user.name} />
        </div>
      </Card>

      <Card className="mt-4 p-5">
        <h2 className="flex items-center gap-2 text-base font-bold text-ink">
          <Globe className="size-4.5 text-brand" />
          {d["settings.language"]}
        </h2>
        <p className="mt-1 text-sm text-ink-soft">{d["settings.languageSub"]}</p>
        <div className="mt-4">
          <LanguageSelector />
        </div>
      </Card>

      <Card className="mt-4 p-5">
        <h2 className="flex items-center gap-2 text-base font-bold text-ink">
          <Lock className="size-4.5 text-brand" />
          {d["settings.account"]}
        </h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex items-center justify-between gap-4">
            <dt className="font-semibold text-ink-soft">{d["auth.phone"]}</dt>
            <dd className="font-bold text-ink">{formatPhone(user.phone)}</dd>
          </div>
          {user.email && (
            <div className="flex items-center justify-between gap-4">
              <dt className="font-semibold text-ink-soft">{d["auth.email"]}</dt>
              <dd className="truncate font-bold text-ink">{user.email}</dd>
            </div>
          )}
          <div className="flex items-center justify-between gap-4">
            <dt className="font-semibold text-ink-soft">{d["settings.memberSince"]}</dt>
            <dd className="font-bold text-ink">
              {new Date(user.createdAt).toLocaleDateString(
                locale === "hi" ? "hi-IN" : locale === "gu" ? "gu-IN" : "en-IN",
                { day: "numeric", month: "long", year: "numeric" }
              )}
            </dd>
          </div>
        </dl>
        <p className="mt-5 flex items-start gap-2 rounded-xl bg-emerald-600/[0.07] px-4 py-3 text-[13px] font-medium text-emerald-800">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" />
          {d["settings.security"]}
        </p>
      </Card>

      <ChangePasswordCard />

      <SignOutCard />
    </div>
  );
}
