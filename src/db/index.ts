import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePostgres } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

type AppDatabase = ReturnType<typeof drizzlePostgres>;
const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
  __fleetFuelDrizzleDatabase?: AppDatabase;
};

function getDatabaseUrl(): URL {
  const value =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.NEON_DATABASE_URL;

  if (!value) {
    throw new Error(
      "Database configuration is missing. Set DATABASE_URL (or POSTGRES_URL / NEON_DATABASE_URL) in .env.local."
    );
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Database configuration must be a valid PostgreSQL URL.");
  }

  if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
    throw new Error("Database configuration must use the postgres:// protocol.");
  }

  return url;
}

function createPostgresDb(connectionString: string): AppDatabase {
  const pool =
    globalForDb.__arenaNextJsPostgresqlPool ??
    new Pool({ connectionString });

  if (process.env.NODE_ENV !== "production") {
    globalForDb.__arenaNextJsPostgresqlPool = pool;
  }

  return drizzlePostgres(pool);
}

function getDb(): AppDatabase {
  if (globalForDb.__fleetFuelDrizzleDatabase) {
    return globalForDb.__fleetFuelDrizzleDatabase;
  }

  const url = getDatabaseUrl();
  const connectionString = url.toString();
  const isNeon = url.hostname.endsWith(".neon.tech");

  // Drizzle's drivers expose separate result types but share this query API.
  const database = isNeon
    ? (drizzleNeon(neon(connectionString)) as unknown as AppDatabase)
    : createPostgresDb(connectionString);

  globalForDb.__fleetFuelDrizzleDatabase = database;
  return database;
}

// Defer environment validation and connection setup until a query is actually used.
export const db: AppDatabase = new Proxy({} as AppDatabase, {
  get(_target, property) {
    const database = getDb();
    const value = Reflect.get(database, property, database);
    return typeof value === "function" ? value.bind(database) : value;
  },
});
