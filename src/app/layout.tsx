import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { Inter, Instrument_Serif } from "next/font/google";
import { I18nProvider } from "@/i18n/I18nProvider";
import { defaultLocale, isLocale } from "@/i18n";
import { getSessionUser } from "@/lib/auth";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

const serifDisplay = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-serif-display",
  display: "swap",
});

const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "FleetFuel — Vehicle & Fuel Management SaaS",
    template: "%s · FleetFuel",
  },
  description:
    "Photo-verified fuel logging, monthly fuel analytics, and secure owner–driver chat for fleets of Boleros, trucks, pickups and commercial vehicles. English, Hindi & Gujarati.",
  keywords: [
    "fuel management",
    "fleet management",
    "vehicle fuel tracking",
    "driver management",
    "diesel tracking",
    "commercial vehicles",
    "Bolero",
    "truck fuel log",
  ],
  openGraph: {
    title: "FleetFuel — Vehicle & Fuel Management",
    description:
      "Every litre accounted for. Photo-verified fuel entries, monthly graphs and secure owner–driver chat.",
    type: "website",
    siteName: "FleetFuel",
  },
  robots: { index: true, follow: true },
  applicationName: "FleetFuel",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f6f2" },
    { media: "(prefers-color-scheme: dark)", color: "#12100b" },
  ],
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const store = await cookies();
  const localeCookie = store.get("fm_locale")?.value;
  // Cookie wins (instant switch); the account locale is the cross-device fallback.
  const user = await getSessionUser().catch(() => null);
  const locale = isLocale(localeCookie)
    ? localeCookie
    : isLocale(user?.locale)
      ? user.locale
      : defaultLocale;

  return (
    <html lang={locale} className={`${inter.variable} ${serifDisplay.variable}`}>
      <body className="min-h-dvh bg-paper font-sans text-ink antialiased">
        <I18nProvider initialLocale={locale}>{children}</I18nProvider>
      </body>
    </html>
  );
}
