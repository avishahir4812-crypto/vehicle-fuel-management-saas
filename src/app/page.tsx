import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Camera,
  CheckCircle2,
  Fuel,
  Languages,
  MessageSquare,
  ShieldCheck,
  Smartphone,
  TrendingUp,
  ChevronRight,
  Gift,
} from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { Logo } from "@/components/ui";
import { LanguageMenu } from "@/components/LanguageMenu";
import { Reveal } from "@/components/Reveal";
import { PricingPlans } from "@/components/PricingPlans";

const features = [
  {
    icon: Camera,
    title: "Photo-verified entries",
    desc: "Before & after dashboard photos, plus an optional pump meter shot, make every fill-up tamper-proof.",
  },
  {
    icon: BarChart3,
    title: "Clean monthly graphs",
    desc: "See exactly when, how much, and how much money each vehicle consumed — no noise, no clutter.",
  },
  {
    icon: MessageSquare,
    title: "One fleet group chat",
    desc: "Owner and every driver in a single secure thread, with @mentions and unread counters.",
  },
  {
    icon: ShieldCheck,
    title: "Role-based access",
    desc: "Owners command the fleet. Drivers log fuel. Every route is protected with encrypted sessions.",
  },
  {
    icon: Languages,
    title: "English · हिन्दी · ગુજરાતી",
    desc: "The whole product speaks your team's language, switching in a single tap.",
  },
  {
    icon: Smartphone,
    title: "Mobile-first by design",
    desc: "Drivers log fuel from the pump in under 20 seconds. Owners review from anywhere.",
  },
];

const steps = [
  {
    n: "01",
    title: "Capture",
    desc: "Driver photographs the dashboard before and after refuelling — the pump meter shot is optional proof.",
  },
  {
    n: "02",
    title: "Log",
    desc: "Rate, quantity, total and vehicle KM are entered. The app verifies the maths and the odometer instantly.",
  },
  {
    n: "03",
    title: "Track",
    desc: "Owners get a spotless monthly graph per vehicle — spend, litres and history, all in one glance.",
  },
];

const tickerItems = [
  "Bolero",
  "बोलेरो",
  "બોલેરો",
  "Trucks",
  "ट्रक",
  "ટ્રક",
  "Pickups",
  "पिकअप",
  "પિકઅપ",
  "Tankers",
  "टैंकर",
  "ટેન્કર",
];

function HeroChartMock() {
  return (
    <div className="relative mx-auto w-full max-w-xl rounded-3xl border border-line bg-surface p-5 shadow-lift sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-bold uppercase tracking-[0.18em] text-ink-soft/70">
            GJ 05 AB 1234 · Bolero Pik-Up
          </p>
          <p className="mt-1 text-lg font-bold tracking-tight text-ink">March fuel overview</p>
        </div>
        <span className="shrink-0 rounded-full bg-brand/12 px-3 py-1 text-xs font-bold text-brand-ink">
          ₹ Amount
        </span>
      </div>

      <svg viewBox="0 0 600 260" className="mt-4 w-full" role="img" aria-label="Monthly fuel chart">
        <defs>
          <linearGradient id="heroFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e8930c" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#e8930c" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[62, 112, 162, 212].map((gy) => (
          <line
            key={gy}
            x1="0"
            x2="600"
            y1={gy}
            y2={gy}
            stroke="#e7e4dc"
            strokeDasharray="2 6"
          />
        ))}
        <path
          d="M 0 222 C 45 200, 65 188, 100 178 S 160 190, 190 196 S 250 140, 290 132 S 350 150, 385 118 S 450 92, 490 72 S 560 62, 600 44 L 600 260 L 0 260 Z"
          fill="url(#heroFill)"
        />
        <path
          d="M 0 222 C 45 200, 65 188, 100 178 S 160 190, 190 196 S 250 140, 290 132 S 350 150, 385 118 S 450 92, 490 72 S 560 62, 600 44"
          fill="none"
          stroke="#e8930c"
          strokeWidth="3"
          strokeLinecap="round"
          className="chart-line-draw"
        />
        {[
          [100, 178],
          [290, 132],
          [385, 118],
          [490, 72],
          [600, 44],
        ].map(([cx, cy]) => (
          <circle
            key={cx}
            cx={cx}
            cy={cy}
            r="5"
            fill="#fff"
            stroke="#e8930c"
            strokeWidth="3"
          />
        ))}
      </svg>

      <div className="mt-2 grid grid-cols-3 gap-3 text-center">
        {[
          ["₹48,250", "Month spend"],
          ["512 L", "Litres filled"],
          ["9", "Fill-ups"],
        ].map(([v, l]) => (
          <div key={l} className="rounded-2xl bg-paper px-2 py-3">
            <p className="text-base font-bold tracking-tight text-ink sm:text-lg">{v}</p>
            <p className="mt-0.5 text-[11px] font-semibold text-ink-soft">{l}</p>
          </div>
        ))}
      </div>

      <div className="absolute -right-3 -top-3 hidden animate-float-slow items-center gap-2 rounded-2xl border border-line bg-surface px-3.5 py-2.5 shadow-lift sm:flex">
        <span className="pulse-dot size-2 rounded-full bg-emerald-500" />
        <span className="text-xs font-bold text-ink">Fill-up just verified</span>
      </div>
    </div>
  );
}

export default async function LandingPage() {
  const user = await getSessionUser();

  return (
    <div className="min-h-dvh bg-paper text-ink">
      {/* ---------- Nav ---------- */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-line/70 bg-paper/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm font-semibold text-ink-soft md:flex">
            <a href="#features" className="transition hover:text-ink">Features</a>
            <a href="#how" className="transition hover:text-ink">How it works</a>
            <a href="#pricing" className="transition hover:text-ink">Pricing</a>
          </nav>
          <div className="flex items-center gap-1.5">
            <LanguageMenu />
            {user ? (
              <Link
                href="/dashboard"
                className="ml-1 rounded-xl bg-brand px-4 py-2 text-sm font-bold text-night transition hover:bg-brand-deep hover:text-white"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-xl px-3.5 py-2 text-sm font-bold text-ink-soft transition hover:text-ink"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup?new=1"
                  className="rounded-xl bg-ink px-4 py-2 text-sm font-bold text-paper transition hover:bg-ink-soft"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden pt-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(65%_55%_at_85%_0%,rgba(232,147,12,0.09),transparent_70%)]" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 pb-20 pt-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:pb-28 lg:pt-20">
          <div>
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-1.5 text-xs font-bold text-ink-soft shadow-soft">
                <Fuel className="size-3.5 text-brand" />
                Vehicle & fuel management SaaS
              </span>
            </Reveal>
            <Reveal delay={90}>
              <h1 className="mt-6 text-[42px] font-bold leading-[1.04] tracking-tight text-ink sm:text-6xl lg:text-[68px]">
                Every litre.
                <br />
                <span className="font-serif italic text-brand">Accounted for.</span>
              </h1>
            </Reveal>
            <Reveal delay={180}>
              <p className="mt-6 max-w-lg text-[17px] leading-relaxed text-ink-soft">
                FleetFuel brings photo-verified fuel logging, clean monthly analytics and a
                secure fleet chat to Boleros, trucks, pickups and every commercial vehicle in
                between.
              </p>
            </Reveal>
            <Reveal delay={260}>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link
                  href="/signup?new=1"
                  className="group inline-flex h-12 items-center gap-2 rounded-xl bg-brand px-6 text-[15px] font-bold text-night shadow-amber transition hover:bg-brand-deep hover:text-white"
                >
                  Start 10-day free trial
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex h-12 items-center gap-2 rounded-xl border border-line-strong bg-surface px-6 text-[15px] font-bold text-ink transition hover:border-ink/30"
                >
                  Sign in
                </Link>
              </div>
            </Reveal>
            <Reveal delay={330}>
              <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-2 text-[13px] font-semibold text-ink-soft/80">
                {["No card needed", "Unlimited vehicles", "English · हिन्दी · ગુજરાતી"].map((t) => (
                  <span key={t} className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-4 text-brand" /> {t}
                  </span>
                ))}
              </div>
            </Reveal>
          </div>

          <Reveal delay={200} className="relative">
            {user ? (
              <Link href="/dashboard" className="block">
                <HeroChartMock />
              </Link>
            ) : (
              <HeroChartMock />
            )}
          </Reveal>
        </div>

        {/* ---------- Ticker ---------- */}
        <div className="relative border-y border-line/70 bg-surface/70 py-4">
          <div className="flex overflow-hidden">
            <div className="animate-ticker flex shrink-0 items-center gap-10 pr-10">
              {[...tickerItems, ...tickerItems].map((item, i) => (
                <span
                  key={i}
                  className="flex items-center gap-10 whitespace-nowrap text-sm font-bold tracking-wide text-ink-soft/40"
                >
                  {item}
                  <span className="size-1 rounded-full bg-brand/50" />
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Features ---------- */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        <Reveal>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand">The product</p>
          <h2 className="mt-3 max-w-2xl text-4xl font-bold tracking-tight text-ink sm:text-5xl">
            Built like a real SaaS.
            <span className="font-serif italic text-ink-soft/60"> Not a spreadsheet.</span>
          </h2>
        </Reveal>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 70}>
              <div className="group h-full rounded-3xl border border-line bg-surface p-7 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-brand/30 hover:shadow-lift">
                <div className="grid size-11 place-items-center rounded-2xl bg-brand/10 text-brand-deep transition-transform duration-300 group-hover:scale-110">
                  <f.icon className="size-5" />
                </div>
                <h3 className="mt-5 text-lg font-bold tracking-tight text-ink">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section id="how" className="border-y border-line/70 bg-surface/60">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand">Workflow</p>
            <h2 className="mt-3 max-w-xl text-4xl font-bold tracking-tight text-ink sm:text-5xl">
              From pump to proof in{" "}
              <span className="font-serif italic text-ink-soft/60">three steps.</span>
            </h2>
          </Reveal>
          <div className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
            {steps.map((s, i) => (
              <Reveal key={s.n} delay={i * 100}>
                <div className="relative">
                  <span className="font-serif text-[72px] italic leading-none text-brand/30">
                    {s.n}
                  </span>
                  <h3 className="mt-3 text-xl font-bold tracking-tight text-ink">{s.title}</h3>
                  <p className="mt-2.5 max-w-xs text-sm leading-relaxed text-ink-soft">{s.desc}</p>
                  {i < steps.length - 1 && (
                    <ChevronRight className="absolute -right-6 top-8 hidden size-5 text-ink/15 md:block" />
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Roles ---------- */}
      <section id="roles" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        <Reveal>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand">
            Two roles, one truth
          </p>
          <h2 className="mt-3 max-w-2xl text-4xl font-bold tracking-tight text-ink sm:text-5xl">
            Made for owners.
            <span className="font-serif italic text-ink-soft/60"> Loved by drivers.</span>
          </h2>
        </Reveal>
        <div className="mt-14 grid gap-5 lg:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-3xl border border-brand/40 bg-gradient-to-b from-brand/[0.07] to-transparent p-8 shadow-soft sm:p-10">
              <span className="rounded-full bg-brand/12 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-ink">
                Owner
              </span>
              <h3 className="mt-5 text-2xl font-bold tracking-tight text-ink">
                Command the whole fleet
              </h3>
              <ul className="mt-6 space-y-3.5 text-[15px] text-ink-soft">
                {[
                  "Add vehicles — Bolero, trucks, pickups, anything",
                  "Assign drivers to each vehicle in one tap",
                  "Review photo-verified fill-ups with monthly graphs",
                  "Chat with every driver in one group thread",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2.5">
                    <CheckCircle2 className="mt-0.5 size-4.5 shrink-0 text-brand" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="h-full rounded-3xl border border-line bg-surface p-8 shadow-soft sm:p-10">
              <span className="rounded-full bg-ink/[0.06] px-3 py-1 text-xs font-bold uppercase tracking-wider text-ink-soft">
                Driver
              </span>
              <h3 className="mt-5 text-2xl font-bold tracking-tight text-ink">
                Log fuel in 20 seconds
              </h3>
              <ul className="mt-6 space-y-3.5 text-[15px] text-ink-soft">
                {[
                  "Snap before/after dashboard photos at the pump",
                  "Enter rate, litres and vehicle KM — total auto-checks",
                  "Odometer validated against the last reading",
                  "Direct, private chat with the whole fleet",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2.5">
                    <CheckCircle2 className="mt-0.5 size-4.5 shrink-0 text-emerald-600" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>

        {/* Language strip */}
        <Reveal delay={150}>
          <div className="mt-5 flex flex-col items-center justify-between gap-6 rounded-3xl border border-line bg-surface px-8 py-9 shadow-soft sm:flex-row sm:px-10">
            <div className="flex items-center gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand/10 text-brand-deep">
                <Languages className="size-6" />
              </span>
              <div>
                <p className="text-lg font-bold tracking-tight text-ink">
                  Speaks three languages natively
                </p>
                <p className="mt-0.5 text-sm text-ink-soft">
                  Switch anytime — the entire product follows.
                </p>
              </div>
            </div>
            <div className="flex gap-8 text-center">
              <div>
                <p className="text-xl font-bold text-ink">English</p>
                <p className="mt-0.5 text-xs text-ink-soft">Hello</p>
              </div>
              <div>
                <p className="text-xl font-bold text-ink">हिन्दी</p>
                <p className="mt-0.5 text-xs text-ink-soft">नमस्ते</p>
              </div>
              <div>
                <p className="text-xl font-bold text-ink">ગુજરાતી</p>
                <p className="mt-0.5 text-xs text-ink-soft">નમસ્તે</p>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ---------- Pricing ---------- */}
      <section id="pricing" className="border-y border-line/70 bg-surface/60">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
          <Reveal>
            <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand">
                  Pricing
                </p>
                <h2 className="mt-3 max-w-xl text-4xl font-bold tracking-tight text-ink sm:text-5xl">
                  One price.
                  <span className="font-serif italic text-ink-soft/60"> Your whole fleet.</span>
                </h2>
                <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-ink-soft">
                  Start with 10 days free — no card needed. Unlimited vehicles, drivers and fuel
                  entries on every plan.
                </p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-brand/30 bg-brand/[0.08] px-4 py-2 text-[13px] font-bold text-brand-ink">
                <Gift className="size-4 text-brand" />
                10 days free trial
              </span>
            </div>
          </Reveal>

          <Reveal delay={120} className="mt-14">
            <PricingPlans variant="marketing" />
          </Reveal>

          <Reveal delay={200}>
            <p className="mt-10 text-center text-[13px] font-medium text-ink-soft/70">
              Prices in INR. Plans renew manually — cancel any time by simply not renewing.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-24">
        <Reveal>
          <div className="noise relative overflow-hidden rounded-[2rem] bg-night px-6 py-16 text-center sm:px-12 lg:py-20">
            <TrendingUp className="mx-auto size-9 text-brand" />
            <h2 className="mx-auto mt-6 max-w-2xl text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Fuel you can <span className="font-serif italic text-brand">trust.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-white/60">
              Set up your fleet in two minutes. Free to start, built to scale.
            </p>
            <div className="mt-9 flex justify-center">
              <Link
                href={user ? "/dashboard" : "/signup?new=1"}
                className="group inline-flex h-12 items-center gap-2 rounded-xl bg-brand px-7 text-[15px] font-bold text-night shadow-amber transition hover:bg-brand-deep hover:text-white"
              >
                {user ? "Open dashboard" : "Start 10-day free trial"}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ---------- Footer ---------- */}
      <footer className="border-t border-line/70">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-ink-soft sm:flex-row sm:px-6">
          <Logo />
          <p>© 2026 FleetFuel. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
