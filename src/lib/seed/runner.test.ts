import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";

import { createTestDb, type TestDb } from "../db/test-db";
import { loadNamePools } from "./generator";
import { seedDatabase } from "./runner";

describe("seedDatabase", () => {
  let db: TestDb;
  beforeEach(async () => {
    db = await createTestDb();
  });
  afterEach(async () => db.$dispose());

  it("inserts the requested number of rows", async () => {
    await seedDatabase(db, {
      count: 500,
      seed: 1,
      pools: loadNamePools(),
    });
    const [{ count }] = (
      await db.execute<{ count: number }>(
        sql`SELECT COUNT(*)::int AS count FROM employees`,
      )
    ).rows;
    expect(count).toBe(500);
  });

  it("is idempotent: rerunning leaves the same count, not double", async () => {
    const pools = loadNamePools();
    await seedDatabase(db, { count: 100, seed: 1, pools });
    await seedDatabase(db, { count: 100, seed: 1, pools });

    const [{ count }] = (
      await db.execute<{ count: number }>(
        sql`SELECT COUNT(*)::int AS count FROM employees`,
      )
    ).rows;
    expect(count).toBe(100);
  });

  it("returns timing metadata so the CLI can print a perf summary", async () => {
    const result = await seedDatabase(db, {
      count: 200,
      seed: 1,
      pools: loadNamePools(),
    });
    expect(result.inserted).toBe(200);
    expect(result.elapsedMs).toBeGreaterThan(0);
    expect(typeof result.rowsPerSecond).toBe("number");
  });
});
