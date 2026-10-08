import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { AuthVisual } from "@/components/auth/AuthVisual";
import { LoginForm } from "@/components/auth/LoginForm";
import { AuthI18n } from "@/components/auth/AuthI18n";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your FleetFuel owner or driver account with your mobile number.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ expired?: string }>;
}) {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");
  const { expired } = await searchParams;

  return (
    <div className="flex min-h-dvh bg-paper">
      <AuthVisual />
      <main className="flex flex-1 flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm font-semibold text-ink-soft transition hover:text-ink lg:hidden">
            ← FleetFuel
          </Link>
          <div className="ml-auto">
            <AuthI18n />
          </div>
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <AuthI18n kind="loginTitle" />
          <div className="mt-8">
            <LoginForm expired={expired === "1"} />
          </div>
        </div>
      </main>
    </div>
  );
}
