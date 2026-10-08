import "server-only";
import { db } from "@/db";
import { companies, type Company } from "@/db/schema";
import { eq } from "drizzle-orm";
import { evaluateAccess, type Access } from "@/lib/billing";

/** Loads the company and evaluates its subscription state. */
export async function getCompanyAccess(
  companyId: string
): Promise<{ company: Company | null; access: Access }> {
  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.id, companyId))
    .limit(1);

  if (!company) {
    return {
      company: null,
      access: {
        allowed: false,
        plan: "trial",
        status: "expired",
        daysLeft: 0,
        periodEnd: null,
        isFreeForever: false,
      },
    };
  }

  return { company, access: evaluateAccess(company) };
}
