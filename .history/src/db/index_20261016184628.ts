import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const rawUrl = process.env.DATABASE_URL;

if (!rawUrl) {
  throw new Error("DATABASE_URL is required — set it in .env.local");
}

// sslmode ko URL se hatao — Pool config mein explicitly handle karenge
const url = new URL(rawUrl);
url.searchParams.delete("sslmode");

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: url.toString(),
    ssl: {
      rejectUnauthorized: true,
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);