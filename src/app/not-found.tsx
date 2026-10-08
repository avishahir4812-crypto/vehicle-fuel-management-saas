import Link from "next/link";
import { Compass } from "lucide-react";
import { Logo } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <header className="flex h-16 items-center px-5 sm:px-8">
        <Logo />
      </header>
      <main className="grid flex-1 place-items-center px-6">
        <div className="text-center">
          <span className="mx-auto grid size-16 place-items-center rounded-3xl bg-ink/[0.05]">
            <Compass className="size-8 text-brand" />
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-ink">404</h1>
          <p className="mt-2 text-ink-soft">The page you are looking for doesn&apos;t exist.</p>
          <Link
            href="/"
            className="mt-8 inline-flex h-11 items-center rounded-xl bg-ink px-6 text-sm font-bold text-paper transition hover:bg-ink-soft"
          >
            Back to FleetFuel
          </Link>
        </div>
      </main>
    </div>
  );
}
