import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// Yahan humne direct link ka fallback de diya hai:
const databaseUrl =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_NYqrldI8a5fz@ep-bitter-heart-b377gs09-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: databaseUrl,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);