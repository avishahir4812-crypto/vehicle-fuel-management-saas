"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  ClipboardList,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
  Sparkles,
  Truck,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/I18nProvider";
import { Avatar, Logo } from "@/components/ui";
import { LanguageMenu } from "@/components/LanguageMenu";
import type { DictKey } from "@/i18n";

type ShellUser = {
  id: string;
  name: string;
  phone: string;
  role: "owner" | "driver";
  companyName: string;
  access: {
    allowed: boolean;
    status: "trialing" | "active" | "expired";
    daysLeft: number | null;
    isFreeForever: boolean;
  };
};

type NavItem = { href: string; label: DictKey; icon: typeof LayoutDashboard };

const ownerNav: NavItem[] = [
  { href: "/dashboard", label: "nav.dashboard", icon: LayoutDashboard },
  { href: "/vehicles", label: "nav.vehicles", icon: Truck },
  { href: "/history", label: "nav.history", icon: ClipboardList },
  { href: "/drivers", label: "nav.drivers", icon: Users },
  { href: "/chat", label: "nav.chat", icon: MessageSquare },
];

const driverNav: NavItem[] = [
  { href: "/dashboard", label: "nav.dashboard", icon: LayoutDashboard },
  { href: "/vehicles", label: "nav.vehicles", icon: Truck },
  { href: "/history", label: "nav.history", icon: ClipboardList },
  { href: "/chat", label: "nav.chat", icon: MessageSquare },
  { href: "/settings", label: "nav.settings", icon: Settings },
];

/** Owners reach Settings from the avatar / sidebar footer. */

export function AppShell({ user, children }: { user: ShellUser; children: ReactNode }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const nav = user.role === "owner" ? ownerNav : driverNav;
  const [unread, setUnread] = useState(0);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch("/api/chat", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { totalUnread: number };
        if (!cancelled) setUnread(data.totalUnread ?? 0);
      } catch {
        /* keep quiet */
      }
    }
    void poll();
    const interval = setInterval(poll, 12_000);
    const onFocus = () => void poll();
    const onRead = () => void poll();
    window.addEventListener("focus", onFocus);
    window.addEventListener("fm:messages", onRead);
    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("fm:messages", onRead);
    };
  }, []);

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  async function signOut() {
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/");
      router.refresh();
    }
  }

  const unreadBadge = unread > 0 && (
    <span className="ml-auto grid min-w-5 place-items-center rounded-full bg-red-600 px-1.5 text-[10px] font-bold leading-5 text-white">
      {unread > 99 ? "99+" : unread}
    </span>
  );

  return (
    <div className="min-h-dvh">
      {/* ---------- Desktop sidebar ---------- */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-line bg-surface lg:flex">
        <div className="flex h-16 items-center border-b border-line px-5">
          <Link href="/dashboard" aria-label="FleetFuel" className="min-w-0">
            <Logo />
            <p className="mt-0.5 truncate pl-10 text-[11px] font-semibold text-ink-soft">
              {user.companyName}
            </p>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all",
                  active
                    ? "bg-ink text-paper shadow-soft"
                    : "text-ink-soft hover:bg-ink/[0.04] hover:text-ink"
                )}
              >
                <Icon className={cn("size-[18px]", active ? "text-brand" : "opacity-70")} />
                {t(item.label)}
                {item.href === "/chat" && unreadBadge}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-line p-3">
          {user.role === "owner" && (
            <Link
              href="/billing"
              className={cn(
                "mb-2 flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all",
                pathname.startsWith("/billing")
                  ? "bg-ink text-paper shadow-soft"
                  : "text-ink-soft hover:bg-ink/[0.04] hover:text-ink"
              )}
            >
              <Sparkles
                className={cn(
                  "size-[18px]",
                  pathname.startsWith("/billing") ? "text-brand" : "opacity-70"
                )}
              />
              {t("nav.billing")}
              {user.role === "owner" &&
                !user.access.isFreeForever &&
                user.access.status === "trialing" && (
                  <span className="ml-auto rounded-full bg-brand/20 px-2 text-[10px] font-bold leading-5 text-brand-ink">
                    {user.access.daysLeft}d
                  </span>
                )}
            </Link>
          )}
          <div className="flex items-center gap-3 rounded-xl p-2">
            <Avatar name={user.name} id={user.id} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-ink">{user.name}</p>
              <p className="text-xs font-medium capitalize text-ink-soft">
                {t(user.role === "owner" ? "common.owner" : "common.driver")}
              </p>
            </div>
            <LanguageMenu compact />
          </div>
          <button
            type="button"
            onClick={signOut}
            disabled={signingOut}
            className="mt-2 flex w-full items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
          >
            <LogOut className="size-4" />
            {t("nav.signOut")}
          </button>
        </div>
      </aside>

      {/* ---------- Mobile topbar ---------- */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-paper/90 px-4 backdrop-blur-md lg:hidden">
        <Link href="/dashboard" aria-label="FleetFuel">
          <Logo />
        </Link>
        <div className="flex items-center gap-1">
          <LanguageMenu compact />
          <Link href="/settings" aria-label={t("nav.settings")}>
            <Avatar name={user.name} id={user.id} size="sm" className="ml-1" />
          </Link>
        </div>
      </header>

      {/* ---------- Content ---------- */}
      <div className="lg:pl-64">
        <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-[4.5rem] sm:px-8 lg:px-10 lg:pb-16 lg:pt-10">
          {/* Trial / expiry banner — owners only, hidden for free-forever accounts */}
          {user.role === "owner" &&
            !user.access.isFreeForever &&
            (user.access.status === "trialing" || !user.access.allowed) &&
            !pathname.startsWith("/billing") && (
              <Link
                href="/billing"
                className={cn(
                  "mb-5 flex items-center gap-3 rounded-2xl border px-4 py-3 transition",
                  user.access.allowed
                    ? "border-brand/40 bg-brand/[0.08] hover:bg-brand/[0.13]"
                    : "border-red-300 bg-red-50 hover:bg-red-100"
                )}
              >
                <Sparkles
                  className={cn(
                    "size-4.5 shrink-0",
                    user.access.allowed ? "text-brand-deep" : "text-red-600"
                  )}
                />
                <span
                  className={cn(
                    "min-w-0 flex-1 truncate text-[13px] font-bold",
                    user.access.allowed ? "text-brand-ink" : "text-red-700"
                  )}
                >
                  {user.access.allowed
                    ? t("bill.trialBanner", { days: user.access.daysLeft ?? 0 })
                    : t("bill.expired")}
                </span>
                <span
                  className={cn(
                    "shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold",
                    user.access.allowed
                      ? "bg-brand text-night"
                      : "bg-red-600 text-white"
                  )}
                >
                  {t("bill.renewCta")}
                </span>
              </Link>
            )}
          {children}
        </main>
      </div>

      {/* ---------- Mobile bottom nav ---------- */}
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur-md lg:hidden">
        <div className="grid grid-cols-5">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold transition-colors",
                  active ? "text-ink" : "text-ink-soft/60"
                )}
              >
                {active && (
                  <span className="absolute -top-px h-0.5 w-8 rounded-full bg-brand" />
                )}
                <span className="relative">
                  <Icon className={cn("size-5", active && "text-brand")} />
                  {item.href === "/chat" && unread > 0 && (
                    <span className="absolute -right-2 -top-1 grid min-w-4 place-items-center rounded-full bg-red-600 px-1 text-[9px] font-bold leading-4 text-white">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </span>
                {t(item.label)}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
