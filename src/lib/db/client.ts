import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

// Drizzle types are derived from the imported schema, so callers can
// query with full type inference without naming the union themselves.
export type AppDb = ReturnType<typeof drizzle<typeof schema>>;

let cachedPool: Pool | undefined;
let cachedDb: AppDb | undefined;

/**
 * Returns a singleton Drizzle handle wrapping a pg.Pool.
 *
 * Singleton because Next.js may HMR many times in dev and instantiate
 * route handlers per request; we don't want a pool storm.
 */
export function getDb(): AppDb {
  if (cachedDb) return cachedDb;

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. See .env.example for the dev value.",
    );
  }

  cachedPool = new Pool({
    connectionString: url,
    // 10 is enough for a single-process Next.js node; Neon's pooler
    // does the heavy lifting in production.
    max: 10,
  });

  cachedDb = drizzle(cachedPool, { schema });
  return cachedDb;
}
