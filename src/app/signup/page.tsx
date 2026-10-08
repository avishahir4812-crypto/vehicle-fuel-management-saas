import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/auth";
import { AuthVisual } from "@/components/auth/AuthVisual";
import { SignupForm } from "@/components/auth/SignupForm";
import { AuthI18n } from "@/components/auth/AuthI18n";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create a FleetFuel owner or driver account — English, Hindi & Gujarati supported.",
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  // Once someone has signed up on this device, send them straight to login
  // unless they explicitly asked for a new account.
  const { new: isNew } = await searchParams;
  const store = await cookies();
  if (!isNew && store.get("fm_returning")?.value === "1") {
    redirect("/login");
  }

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
          <AuthI18n kind="signupTitle" />
          <div className="mt-8">
            <SignupForm />
          </div>
        </div>
      </main>
    </div>
  );
}
