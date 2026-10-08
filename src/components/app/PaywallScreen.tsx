import Link from "next/link";
import { AlertTriangle, Lock } from "lucide-react";
import { getServerLocale } from "@/i18n/server";
import { Card } from "@/components/ui";

/**
 * Shown when a company's trial/plan has ended.
 * Owners get the upgrade CTA; drivers are told to contact their owner.
 */
export async function PaywallScreen({
  role,
  companyName,
}: {
  role: "owner" | "driver";
  companyName: string;
}) {
  const { d } = await getServerLocale();

  return (
    <div className="mx-auto max-w-lg py-6">
      <Card className="border-red-300 bg-red-50/60 p-7 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-red-600/12 text-red-600">
          {role === "owner" ? <AlertTriangle className="size-7" /> : <Lock className="size-7" />}
        </span>
        <h1 className="mt-5 text-xl font-bold tracking-tight text-ink">{d["bill.expired"]}</h1>
        <p className="mt-2 text-sm text-ink-soft">
          {role === "owner" ? d["bill.expiredDesc"] : d["chat.emptyDriver"]}
        </p>
        <p className="mt-3 text-sm font-bold text-ink">{companyName}</p>

        {role === "owner" && (
          <Link
            href="/billing"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-brand px-6 text-sm font-bold text-night shadow-amber transition hover:bg-brand-deep hover:text-white"
          >
            {d["bill.choosePlan"]}
          </Link>
        )}
      </Card>
    </div>
  );
}
