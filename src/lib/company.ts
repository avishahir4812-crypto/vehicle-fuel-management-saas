import "server-only";
import { randomInt } from "crypto";
import { db } from "@/db";
import { companies } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";

/** Unambiguous alphabet — no O/0, I/1, so keys are easy to read out loud. */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function makeJoinKey(): string {
  let key = "";
  for (let i = 0; i < 5; i++) key += ALPHABET[randomInt(ALPHABET.length)];
  return key;
}

/** Generates a key that is guaranteed unique across all companies. */
export async function generateUniqueJoinKey(): Promise<string> {
  for (let attempt = 0; attempt < 12; attempt++) {
    const key = makeJoinKey();
    const [existing] = await db
      .select({ id: companies.id })
      .from(companies)
      .where(eq(companies.joinKey, key))
      .limit(1);
    if (!existing) return key;
  }
  throw new Error("join_key_exhausted");
}

/**
 * Resolves the company a driver is trying to join.
 * Both the company name (case/space-insensitive) and the key must match, so
 * two different owners can never collide.
 */
export async function findCompanyByNameAndKey(name: string, joinKey: string) {
  const normalized = name.trim().toLowerCase().replace(/\s+/g, " ");
  const [company] = await db
    .select()
    .from(companies)
    .where(
      and(
        eq(companies.joinKey, joinKey.trim().toUpperCase()),
        sql`lower(regexp_replace(${companies.name}, '\\s+', ' ', 'g')) = ${normalized}`
      )
    )
    .limit(1);
  return company ?? null;
}

export async function getCompany(companyId: string) {
  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.id, companyId))
    .limit(1);
  return company ?? null;
}
