import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSessionUser } from "@/lib/auth";
import { getCompanyAccess } from "@/lib/access";
import { AppShell } from "@/components/AppShell";
import { PaywallScreen } from "@/components/app/PaywallScreen";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login?expired=1");

  const { company, access } = await getCompanyAccess(user.companyId);
  const companyName = company?.name ?? "Fleet";

  // Owners can always reach /billing and /settings so they can pay or sign out.
  const path = (await headers()).get("x-pathname") ?? "";
  const alwaysAllowed = path.startsWith("/billing") || path.startsWith("/settings");

  const shellUser = {
    id: user.id,
    name: user.name,
    phone: user.phone,
    role: user.role,
    companyName,
    access: {
      allowed: access.allowed,
      status: access.status,
      daysLeft: access.daysLeft,
      isFreeForever: access.isFreeForever,
    },
  };

  return (
    <AppShell user={shellUser}>
      {access.allowed || alwaysAllowed ? (
        children
      ) : (
        <PaywallScreen role={user.role} companyName={companyName} />
      )}
    </AppShell>
  );
}
