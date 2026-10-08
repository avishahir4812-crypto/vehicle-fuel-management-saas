import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { AuthVisual } from "@/components/auth/AuthVisual";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { AuthI18n } from "@/components/auth/AuthI18n";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Reset your FleetFuel password with a 6-digit code.",
};

export default async function ForgotPasswordPage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  return (
    <div className="flex min-h-dvh bg-paper">
      <AuthVisual />
      <main className="flex flex-1 flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-sm font-semibold text-ink-soft transition hover:text-ink lg:hidden"
          >
            ← FleetFuel
          </Link>
          <div className="ml-auto">
            <AuthI18n />
          </div>
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <ForgotPasswordForm />
        </div>
      </main>
    </div>
  );
}
