import Image from "next/image";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { AUTH_IMAGE } from "@/lib/media";
import { Logo } from "@/components/ui";

/** Left visual panel for auth pages (desktop only). */
export function AuthVisual() {
  return (
    <aside className="relative hidden overflow-hidden bg-night lg:flex lg:w-[46%] xl:w-1/2">
      <Image
        src={AUTH_IMAGE}
        alt="Truck on a city street at night"
        fill
        priority
        sizes="50vw"
        className="object-cover opacity-50"
      />
      <div className="noise absolute inset-0 bg-gradient-to-b from-night/70 via-night/40 to-night" />
      <div className="relative z-10 flex w-full flex-col p-10 xl:p-14">
        <Link href="/" aria-label="Back to home">
          <Logo dark />
        </Link>
        <div className="mt-auto max-w-md">
          <p className="font-serif text-[34px] italic leading-tight text-white xl:text-[40px]">
            Fuel tracking your
            <span className="text-brand"> accountant will love.</span>
          </p>
          <ul className="mt-8 space-y-3.5 text-[15px] font-medium text-white/70">
            {[
              "Sign in with just your mobile number",
              "Photo-verified fill-ups — before & after",
              "One group chat for the whole fleet",
              "English · हिन्दी · ગુજરાતી",
            ].map((t) => (
              <li key={t} className="flex items-center gap-3">
                <CheckCircle2 className="size-4.5 shrink-0 text-brand" />
                {t}
              </li>
            ))}
          </ul>
          <p className="mt-10 border-t border-white/10 pt-6 text-xs font-semibold uppercase tracking-[0.2em] text-white/35">
            Trusted by real fleets · Made for Indian roads
          </p>
        </div>
      </div>
    </aside>
  );
}
