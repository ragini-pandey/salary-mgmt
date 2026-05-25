import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { sql } from "drizzle-orm";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import * as schema from "./schema";

export type TestDb = ReturnType<typeof drizzle<typeof schema>> & {
  /** Closes the underlying pglite instance. Call from afterEach. */
  $dispose: () => Promise<void>;
};

/**
 * Builds a brand-new in-memory Postgres for a single test, applies all
 * Drizzle migrations against it, and returns the Drizzle handle.
 *
 * Per-test isolation: each call creates a fresh PGlite — tests can run
 * in parallel without polluting each other.
 *
 * Why raw-SQL apply over `migrate()`: pglite + the migrator carries a
 * meta-table overhead per call; pasting our few CREATE statements is
 * a few ms instead of tens.
 */
export async function createTestDb(): Promise<TestDb> {
  const pglite = new PGlite();
  const db = drizzle(pglite, { schema }) as TestDb;

  const migrationsDir = path.resolve(process.cwd(), "drizzle");
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const fullPath = path.join(migrationsDir, file);
    const rawSql = readFileSync(fullPath, "utf8");
    // drizzle-kit separates statements with this sentinel.
    const statements = rawSql
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter(Boolean);
    for (const stmt of statements) {
      await db.execute(sql.raw(stmt));
    }
  }

  db.$dispose = async () => {
    await pglite.close();
  };

  return db;
}
